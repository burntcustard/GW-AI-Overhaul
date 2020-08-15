// Allow player to delete tech cards whenever they want
$("#hover-card").replaceWith(
  loadHtml("coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards.html")
);
locTree($("#hover-card"));

requireGW(
  [
    "shared/gw_common",
    "shared/gw_factions",
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  ],
  function (GW, GWFactions, gwaioBank) {
    // Deal the General Commander's minions as cards to the inventory for GWAIO v4.3.0+
    if (
      model.game().inventory().cards().length === 1 &&
      model.game().inventory().cards()[0].id === "gwc_start_subcdr" &&
      !model.game().inventory().cards()[0].minions
    ) {
      var playerFaction = model
        .game()
        .inventory()
        .getTag("global", "playerFaction");
      _.times(2, function () {
        var minion = _.sample(GWFactions[playerFaction].minions);
        model
          .game()
          .inventory()
          .cards()
          .push({ id: "gwc_minion", minion: minion, unique: Math.random() });
      });
      model.game().inventory().applyCards();
      model.driveAccessInProgress(true);
      GW.manifest.saveGame(model.game()).then(function () {
        model.driveAccessInProgress(false);
      });
    }

    /* Start of GWAIO implementation of GWDealer */
    if (!model.gwaioDeck) model.gwaioDeck = [];
    model.gwaioDeck.push(
      "gwaio_enable_bot_aa",
      "gwc_add_card_slot",
      "gwc_bld_efficiency_cdr",
      "gwc_bld_efficiency_fabs",
      "gwc_combat_air",
      "gwc_combat_bots",
      "gwc_combat_commander",
      "gwc_combat_orbital",
      "gwc_combat_sea",
      "gwc_combat_structures",
      "gwc_combat_vehicles",
      "gwc_cost_air",
      "gwc_cost_artillery",
      "gwc_cost_bots",
      "gwc_cost_defenses",
      "gwc_cost_economy",
      "gwc_cost_intel",
      "gwc_cost_orbital",
      "gwc_cost_sea",
      "gwc_cost_super_weapons",
      "gwc_cost_titans",
      "gwc_cost_vehicles",
      "gwc_damage_air",
      "gwc_damage_artillery",
      "gwc_damage_bots",
      "gwc_damage_commander",
      "gwc_damage_defenses",
      "gwc_damage_orbital",
      "gwc_damage_sea",
      "gwc_damage_vehicles",
      "gwc_enable_air_all",
      "gwc_enable_air_t1",
      "gwc_enable_artillery",
      "gwc_enable_bots_all",
      "gwc_enable_bots_t1",
      "gwc_enable_defenses_t2",
      "gwc_enable_orbital_all",
      "gwc_enable_sea_all",
      "gwc_enable_super_weapons",
      "gwc_enable_titans",
      "gwc_enable_vehicles_all",
      "gwc_enable_vehicles_t1",
      "gwc_energy_efficiency_intel",
      "gwc_energy_efficiency_weapons",
      "gwc_health_air",
      "gwc_health_bots",
      "gwc_health_commander",
      "gwc_health_orbital",
      "gwc_health_sea",
      "gwc_health_structures",
      "gwc_health_vehicles",
      "gwc_minion",
      "gwc_speed_air",
      "gwc_speed_bots",
      "gwc_speed_commander",
      "gwc_speed_orbital",
      "gwc_speed_sea",
      "gwc_speed_vehicles",
      "gwc_storage_1",
      "gwc_storage_and_buff"
    );

    var cards = [];
    var cardContexts = {};

    var loadCount = model.gwaioDeck.length;
    var loaded = $.Deferred();

    var deck = [];
    _.forEach(model.gwaioDeck, function (cardId) {
      requireGW(["cards/" + cardId], function (card) {
        card.id = cardId;
        cards.push(card);
        deck.push(cardId);
        if (--loadCount === 0) loaded.resolve();
      });
    });

    // GWDealer.chooseCards - use our deck
    var chooseCards = function (params) {
      var inventory = params.inventory;
      var rng = params.rng || new Math.seedrandom();
      var count = params.count;
      var star = params.star;
      var galaxy = params.galaxy;

      var result = $.Deferred();
      loaded.then(function () {
        _.forEach(cards, function (card) {
          if (card.getContext && !cardContexts[card.id])
            cardContexts[card.id] = card.getContext(galaxy, inventory);
        });

        var list = [];

        _.times(count, function () {
          var fullHand = [];
          var hand = [];

          fullHand = _.map(cards, function (card) {
            var context = cardContexts[card.id];

            var match =
              inventory.hasCard(card.id) || _.any(list, { id: card.id });

            var result = card.deal && card.deal(star, context, inventory);
            if (match) result.chance = 0;

            return result;
          });

          fullHand = _.map(fullHand, function (deal, index) {
            deal.index = index;
            return deal;
          });

          hand = _.filter(fullHand, function (deal) {
            if (!deal) return false;

            if (!deal.chance) return false;

            return true;
          });

          if (hand.length) {
            var resultIndex;

            var probability = _.reduce(
              hand,
              function (sum, card) {
                return sum + card.chance;
              },
              0
            );
            var roll = rng() * probability;
            var index = 0;
            for (; roll >= hand[index].chance && index < hand.length; ++index) {
              roll -= hand[index].chance;
            }
            if (index < hand.length) {
              var result = hand[index];
              resultIndex = result.index;
            }

            if (resultIndex !== undefined) {
              var resultDeal = fullHand[resultIndex];
              var params = resultDeal && resultDeal.params;
              var cardId = deck[resultIndex];
              var systemCard = {
                id: cardId,
              };

              if (params && _.isObject(params)) _.extend(systemCard, params);

              list.push(systemCard);
            }
          }
        });

        result.resolve(list);
      });
      return result;
    };
    /* end of GWAIO implementation of GWDealer */

    // gw_play self.explore - we need to call our chooseCards function
    model.explore = function () {
      if (!model.game() || !model.game().explore()) return;

      model.scanning(true);

      api.audio.playSound("/VO/Computer/gw/board_exploring");

      var star = model.game().galaxy().stars()[model.game().currentStar()];

      var dealStarCards =
        !model.game().isTutorial() &&
        chooseCards({
          inventory: model.game().inventory(),
          count: 3,
          star: star,
          galaxy: model.game().galaxy(),
        }).then(function (result) {
          var ok = true;

          _.forEach(star.cardList(), function (card) {
            if (!GW.bank.hasStartCard(card) && !gwaioBank.hasStartCard(card))
              ok = false;
          });

          if (ok) star.cardList(result);
        });
      $.when(dealStarCards).then(function () {
        model.driveAccessInProgress(true);
        GW.manifest.saveGame(model.game()).then(function () {
          model.driveAccessInProgress(false);
        });

        _.delay(function () {
          model.scanning(false);
        }, 2000);
      });
    };
  }
);