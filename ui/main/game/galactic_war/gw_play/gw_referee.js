define(["shared/gw_common"], function (GW) {
  var GWReferee = function (game) {
    var self = this;

    self.game = ko.observable(game);

    self.files = ko.observable();
    self.localFiles = ko.observable();
    self.config = ko.observable();
  };

  var generateGameFiles = function () {
    var self = this;

    // Game file generation cannot use previously mounted files.  That would be bad.
    var done = $.Deferred();

    // community mods will hook unmountAllMemoryFiles to remount client mods
    api.file.unmountAllMemoryFiles().always(function () {
      var titans = api.content.usingTitans();

      var game = self.game();
      var galaxy = game.galaxy();
      var battleGround = galaxy.stars()[game.currentStar()];
      var ai = battleGround.ai();

      var aiFileGen = $.Deferred();
      var playerFileGen = $.Deferred();
      var foeFileGen = $.Deferred();
      var foe2FileGen = $.Deferred();
      var unitsLoad = $.get("spec://pa/units/unit_list.json");
      var aiMapLoad = $.get("spec://pa/ai/unit_maps/ai_unit_map.json");
      var aiX1MapLoad = titans
        ? $.get("spec://pa/ai/unit_maps/ai_unit_map_x1.json")
        : {};
      $.when(unitsLoad, aiMapLoad, aiX1MapLoad).then(function (
        unitsGet,
        aiMapGet,
        aiX1MapGet
      ) {
        var units = parse(unitsGet[0]).units;

        var aiUnitMap = parse(aiMapGet[0]);
        var aiX1UnitMap = parse(aiX1MapGet[0]);

        var enemyAIUnitMap = GW.specs.genAIUnitMap(aiUnitMap, ".ai");
        var enemyX1AIUnitMap = GW.specs.genAIUnitMap(aiX1UnitMap, ".ai");

        GW.specs.genUnitSpecs(units, ".ai").then(function (aiSpecFiles) {
          var aiInventory = ai.inventory;
          var aiFilesClassic = _.assign(
            { "/pa/ai/unit_maps/ai_unit_map.json.ai": enemyAIUnitMap },
            aiSpecFiles
          );
          var aiFilesX1 = titans
            ? _.assign(
                { "/pa/ai/unit_maps/ai_unit_map_x1.json.ai": enemyX1AIUnitMap },
                aiSpecFiles
              )
            : {};
          var aiFiles = _.assign({}, aiFilesClassic, aiFilesX1);
          GW.specs.modSpecs(aiFiles, aiInventory, ".ai");
          aiFileGen.resolve(aiFiles);
        });

        if (ai.foes) {
          var enemyFoeUnitMap = GW.specs.genAIUnitMap(aiUnitMap, ".foe1");
          var enemyX1FoeUnitMap = GW.specs.genAIUnitMap(aiX1UnitMap, ".foe1");

          GW.specs.genUnitSpecs(units, ".foe1").then(function (aiSpecFiles) {
            var foeInventory = ai.foes[0].inventory;
            var aiFilesClassic = _.assign(
              { "/pa/ai/unit_maps/ai_unit_map.json.foe1": enemyFoeUnitMap },
              aiSpecFiles
            );
            var aiFilesX1 = titans
              ? _.assign(
                  {
                    "/pa/ai/unit_maps/ai_unit_map_x1.json.foe1": enemyX1FoeUnitMap,
                  },
                  aiSpecFiles
                )
              : {};
            var foeFiles = _.assign({}, aiFilesClassic, aiFilesX1);
            GW.specs.modSpecs(foeFiles, foeInventory, ".foe1");
            foeFileGen.resolve(foeFiles);
          });

          if (ai.foes[1]) {
            var enemyFoe2UnitMap = GW.specs.genAIUnitMap(aiUnitMap, ".foe2");
            var enemyX1Foe2UnitMap = GW.specs.genAIUnitMap(
              aiX1UnitMap,
              ".foe2"
            );

            GW.specs.genUnitSpecs(units, ".foe2").then(function (aiSpecFiles) {
              var foeInventory = ai.foes[1].inventory;
              var aiFilesClassic = _.assign(
                { "/pa/ai/unit_maps/ai_unit_map.json.foe2": enemyFoe2UnitMap },
                aiSpecFiles
              );
              var aiFilesX1 = titans
                ? _.assign(
                    {
                      "/pa/ai/unit_maps/ai_unit_map_x1.json.foe2": enemyX1Foe2UnitMap,
                    },
                    aiSpecFiles
                  )
                : {};
              var foeFiles = _.assign({}, aiFilesClassic, aiFilesX1);
              GW.specs.modSpecs(foeFiles, foeInventory, ".foe2");
              foe2FileGen.resolve(foeFiles);
            });
          }
        }

        var playerAIUnitMap = GW.specs.genAIUnitMap(aiUnitMap, ".player");
        var playerX1AIUnitMap = titans
          ? GW.specs.genAIUnitMap(aiX1UnitMap, ".player")
          : {};

        var inventory = self.game().inventory();

        GW.specs
          .genUnitSpecs(inventory.units(), ".player")
          .then(function (playerSpecFiles) {
            var playerFilesClassic = _.assign(
              { "/pa/ai/unit_maps/ai_unit_map.json.player": playerAIUnitMap },
              playerSpecFiles
            );
            var playerFilesX1 = titans
              ? _.assign(
                  {
                    "/pa/ai/unit_maps/ai_unit_map_x1.json.player": playerX1AIUnitMap,
                  },
                  playerSpecFiles
                )
              : {};
            var playerFiles = _.assign({}, playerFilesClassic, playerFilesX1);
            GW.specs.modSpecs(playerFiles, inventory.mods(), ".player");
            playerFileGen.resolve(playerFiles);
          });
      });

      var filesToProcess = [aiFileGen, playerFileGen];

      if (ai.foes) {
        filesToProcess.push(foeFileGen);
        if (ai.foes[1]) filesToProcess.push(foe2FileGen);
      }

      $.when.apply($, filesToProcess).always(function () {
        self.files(_.assign.apply(_, ({}, arguments)));
        done.resolve();
      });
    });
    return done.promise();
  };

  // The commanders changed from an object notation to a string.  In order to
  // process old save games properly, we need to patch up the commander spec
  // before sending to the server.
  var fixupCommander = function (commander) {
    if (_.isObject(commander) && _.isString(commander.UnitSpec))
      return commander.UnitSpec;
    return commander;
  };

  var generateConfig = function () {
    var self = this;

    var game = self.game();
    var galaxy = game.galaxy();
    var battleGround = galaxy.stars()[game.currentStar()];
    var system = battleGround.system();
    var ai = battleGround.ai();
    var inventory = game.inventory();
    var playerColor = inventory.getTag("global", "playerColor");
    var playerCommander = inventory.getTag("global", "commander");
    var armies = [];
    var slotsArray = [];
    var aiLandingOptions = [
      "off_player_planet",
      "on_player_planet",
      "no_restriction",
    ];

    // Setup the player
    armies.push({
      slots: [{ name: "Player" }],
      color: playerColor,
      econ_rate: 1,
      spec_tag: ".player",
      alliance_group: 1,
    });
    // Setup the player's Sub Commanders
    // eslint-disable-next-line lodash/prefer-map
    _.forEach(inventory.minions(), function (minion) {
      armies.push({
        slots: [
          {
            ai: true,
            name: minion.name || "Sub Commander",
            commander: fixupCommander(minion.commander || playerCommander),
            landing_policy: _.sample(aiLandingOptions),
          },
        ],
        color: minion.color || [playerColor[1], playerColor[0]],
        econ_rate: 1,
        personality: minion.personality,
        spec_tag: ".player",
        alliance_group: 1,
      });
    });

    // Setup the AI
    ai.personality.adv_eco_mod = ai.personality.adv_eco_mod * ai.econ_rate;
    ai.personality.adv_eco_mod_alone =
      ai.personality.adv_eco_mod_alone * ai.econ_rate;
    if (ai.character === "!LOC:Boss") {
      if (ai.bossCommanders) {
        _.times(ai.bossCommanders, function () {
          slotsArray.push({
            ai: true,
            name: ai.name,
            commander: fixupCommander(ai.commander),
            landing_policy: _.sample(aiLandingOptions),
          });
        });
      } else {
        // Support GWAIO v2.0.4 and earlier
        _.times(ai.landing_policy.length, function () {
          slotsArray.push({
            ai: true,
            name: ai.name,
            commander: fixupCommander(ai.commander),
            landing_policy: _.sample(aiLandingOptions),
          });
        });
      }
    } else {
      slotsArray.push({
        ai: true,
        name: ai.name,
        commander: fixupCommander(ai.commander),
        landing_policy: _.sample(aiLandingOptions),
      });
    }
    armies.push({
      slots: slotsArray,
      color: ai.color,
      econ_rate: ai.econ_rate,
      personality: ai.personality,
      spec_tag: ".ai",
      alliance_group: 2,
    });
    _.forEach(ai.minions, function (minion) {
      minion.personality.adv_eco_mod =
        minion.personality.adv_eco_mod * (minion.econ_rate || ai.econ_rate);
      minion.personality.adv_eco_mod_alone =
        minion.personality.adv_eco_mod_alone *
        (minion.econ_rate || ai.econ_rate);
      armies.push({
        slots: [
          {
            ai: true,
            name: minion.name || "Minion",
            commander: fixupCommander(minion.commander || ai.commander),
            landing_policy: _.sample(aiLandingOptions),
          },
        ],
        color: minion.color,
        econ_rate: minion.econ_rate || ai.econ_rate,
        personality: minion.personality,
        spec_tag: ".ai",
        alliance_group: 2,
      });
    });
    // Add Additional Factions for FFA if any
    var allianceGroup = 3;
    var foeTag = [".foe1", ".foe2"];
    var count = 0;
    _.forEach(ai.foes, function (foe) {
      var slotsArrayFoes = [];
      foe.personality.adv_eco_mod =
        foe.personality.adv_eco_mod * (foe.econ_rate || ai.econ_rate);
      foe.personality.adv_eco_mod_alone =
        foe.personality.adv_eco_mod_alone * (foe.econ_rate || ai.econ_rate);
      if (foe.commanderCount) {
        _.times(foe.commanderCount, function () {
          slotsArrayFoes.push({
            ai: true,
            name: foe.name || "Foe",
            commander: fixupCommander(foe.commander || ai.commander),
            landing_policy: _.sample(aiLandingOptions),
          });
        });
      } else if (foe.landing_policy) {
        // Support GWAIO v1.2.0 - v2.0.4
        _.times(foe.landing_policy, function () {
          slotsArrayFoes.push({
            ai: true,
            name: foe.name || "Foe",
            commander: fixupCommander(foe.commander || ai.commander),
            landing_policy: _.sample(aiLandingOptions),
          });
        });
      } else {
        // Support GWAIO v1.1.0 and earlier
        slotsArrayFoes.push({
          ai: true,
          name: foe.name || "Foe",
          commander: fixupCommander(foe.commander || ai.commander),
          landing_policy: _.sample(aiLandingOptions),
        });
      }
      armies.push({
        slots: slotsArrayFoes,
        color: foe.color,
        econ_rate: foe.econ_rate || ai.econ_rate,
        personality: foe.personality,
        spec_tag: foeTag[count],
        alliance_group: allianceGroup,
      });
      allianceGroup = allianceGroup + 1;
      count += 1;
    });

    var config = {
      files: self.files(),
      armies: armies,
      player: {
        commander: fixupCommander(playerCommander),
      },
      system: system,
      land_anywhere: ai.landAnywhere,
      bounty_mode: ai.bountyMode,
      bounty_value: ai.bountyValue,
      sudden_death_mode: ai.suddenDeath,
    };
    _.forEach(config.armies, function (army) {
      // eslint-disable-next-line lodash/prefer-filter
      _.forEach(army.slots, function (slot) {
        if (slot.ai) {
          if (army.alliance_group === 1) slot.commander += ".player";
          else if (army.alliance_group === 2) slot.commander += ".ai";
          else if (army.alliance_group === 3) slot.commander += ".foe1";
          else slot.commander += ".foe2";
        }
      });
    });
    config.player.commander += ".player";
    // Store the game in the config for diagnostic purposes.
    config.gw = game.save();
    self.config(config);
  };

  GWReferee.prototype.stripSystems = function () {
    var self = this;

    // remove the systems from the galaxy
    var gw = self.config().gw;
    GW.Game.saveSystems(gw);
  };

  GWReferee.prototype.mountFiles = function () {
    var self = this;

    var deferred = $.Deferred();

    var allFiles = _.cloneDeep(self.files());
    // The player unit list needs to be the superset of units for proper UI behavior
    var playerUnits = allFiles["/pa/units/unit_list.json.player"];
    var aiUnits = allFiles["/pa/units/unit_list.json.ai"];
    if (playerUnits) {
      var allUnits = _.cloneDeep(playerUnits);
      if (aiUnits && allUnits.units) {
        allUnits.units = allUnits.units.concat(aiUnits.units);
      }
      allFiles["/pa/units/unit_list.json"] = allUnits;
    }

    if (self.localFiles()) {
      _.extend(allFiles, self.localFiles());
    }

    var cookedFiles = _.mapValues(allFiles, function (value) {
      // eslint-disable-next-line lodash/prefer-lodash-typecheck
      if (typeof value !== "string") return JSON.stringify(value);
      else return value;
    });

    // community mods will hook unmountAllMemoryFiles to remount client mods
    api.file.unmountAllMemoryFiles().always(function () {
      api.file.mountMemoryFiles(cookedFiles).then(function () {
        deferred.resolve();
      });
    });

    return deferred.promise();
  };

  GWReferee.prototype.tagGame = function () {
    api.game.setUnitSpecTag(".player");
  };

  loadScript("coui://download/community-mods-gw_referee.js");

  return {
    hire: function (game) {
      var ref = new GWReferee(game);
      return _.bind(generateGameFiles, ref)()
        .then(_.bind(generateConfig, ref))
        .then(function () {
          return ref;
        });
    },
  };
});
