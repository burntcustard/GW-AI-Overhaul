define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Horsefly Upgrade Tech adds bombs to the strafer which it will drop as it passes over its target."
    ),
    summarize: _.constant("!LOC:Horsefly Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
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
    deal: function (unused0, unused1, inventory) {
      var chance = 0;
      if (
        (gwaioFunctions.hasUnit(
          "/pa/units/air/air_factory_adv/air_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_airfactory")) &&
        gwaioFunctions.hasUnit("/pa/units/air/strafer/strafer.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/air/strafer/strafer.json",
          path: "tools",
          op: "push",
          value: {
            spec_id: "/pa/units/air/bomber/bomber_tool_weapon.json",
            aim_bone: "bone_root",
            muzzle_bone: "bone_root",
          },
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
