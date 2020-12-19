define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:The Nuclear Missile Launcher does full damage to both Commanders and orbital units."
    ),
    summarize: _.constant("!LOC:Super Nuke"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_super_weapons.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_super_weapon",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function () {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/air/air_factory_adv/air_factory_adv.json"
        ) ||
        gwaioFunctions.hasUnit(
          "/pa/units/land/bot_factory_adv/bot_factory_adv.json"
        ) ||
        gwaioFunctions.hasUnit(
          "/pa/units/sea/naval_factory_adv/naval_factory_adv.json"
        ) ||
        gwaioFunctions.hasUnit(
          "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: " /pa/units/land/nuke_launcher/nuke_launcher_ammo.json",
          path: "armor_damage_map.AT_Commander",
          op: "multiply",
          value: 3,
        },
        {
          file: " /pa/units/land/nuke_launcher/nuke_launcher_ammo.json",
          path: "armor_damage_map.AT_Orbital",
          op: "multiply",
          value: 3,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});