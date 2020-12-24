define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Catapult Upgrade Tech adds flak to the tactical missile launcher."
    ),
    summarize: _.constant("!LOC:Catapult Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_defense.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (_, __, inventory) {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json"
        )
      )
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
          ) ||
          inventory.hasCard("nem_start_tower_rush")
        )
          chance = 35;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file:
            "/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json",
          path: "tools",
          op: "push",
          value: {
            spec_id: "/pa/units/land/tank_flak/tank_flak_tool_weapon.json",
            aim_bone: "bone_missile01",
            projectiles_per_fire: 4,
            muzzle_bone: [
              "bone_missile01",
              "bone_missile01",
              "bone_missile01",
              "bone_missile01",
            ],
          },
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});