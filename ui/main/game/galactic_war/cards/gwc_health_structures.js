define(["shared/gw_common"], function (GW) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Structure Armor Tech increases the health of all structures by 50%"
    ),
    summarize: _.constant("!LOC:Structure Armor Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_structure.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_armor",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context) {
      var chance = 0;
      var dist = system.distance();
      if (dist > 0) {
        if (context.totalSize <= GW.balance.numberOfSystems[0]) {
          chance = 14;
        } else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
          chance = 14;
        } else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
          chance = 28;
          if (dist > 6) chance = 142;
        } else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
          chance = 28;
          if (dist > 9) chance = 142;
        } else {
          chance = 28;
          if (dist > 12) chance = 142;
        }
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      var units = [
        "/pa/units/air/air_factory_adv/air_factory_adv.json",
        "/pa/units/air/air_factory/air_factory.json",
        "/pa/units/land/air_defense_adv/air_defense_adv.json",
        "/pa/units/land/air_defense/air_defense.json",
        "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher.json",
        "/pa/units/land/artillery_long/artillery_long.json",
        "/pa/units/land/artillery_short/artillery_short.json",
        "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json",
        "/pa/units/land/bot_factory_adv/bot_factory_adv.json",
        "/pa/units/land/bot_factory/bot_factory.json",
        "/pa/units/land/control_module/control_module.json",
        "/pa/units/land/energy_plant_adv/energy_plant_adv.json",
        "/pa/units/land/energy_plant/energy_plant.json",
        "/pa/units/land/energy_storage/energy_storage.json",
        "/pa/units/land/land_barrier/land_barrier.json",
        "/pa/units/land/land_mine/land_mine.json",
        "/pa/units/land/laser_defense_adv/laser_defense_adv.json",
        "/pa/units/land/laser_defense_single/laser_defense_single.json",
        "/pa/units/land/laser_defense/laser_defense.json",
        "/pa/units/land/metal_extractor_adv/metal_extractor_adv.json",
        "/pa/units/land/metal_extractor/metal_extractor.json",
        "/pa/units/land/metal_storage/metal_storage.json",
        "/pa/units/land/nuke_launcher/nuke_launcher.json",
        "/pa/units/land/radar_adv/radar_adv.json",
        "/pa/units/land/radar/radar.json",
        "/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json",
        "/pa/units/land/teleporter/teleporter.json",
        "/pa/units/land/unit_cannon/unit_cannon.json",
        "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json",
        "/pa/units/land/vehicle_factory/vehicle_factory.json",
        "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
        "/pa/units/orbital/ion_defense/ion_defense.json",
        "/pa/units/orbital/mining_platform/mining_platform.json",
        "/pa/units/orbital/orbital_factory/orbital_factory.json",
        "/pa/units/orbital/orbital_launcher/orbital_launcher.json",
        "/pa/units/sea/defense_satellite/defense_satellite.json",
        "/pa/units/sea/naval_factory_adv/naval_factory_adv.json",
        "/pa/units/sea/naval_factory/naval_factory.json",
        "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json",
        "/pa/units/sea/torpedo_launcher/torpedo_launcher.json",
      ];
      var mods = [];
      var modUnit = function (unit) {
        mods.push({
          file: unit,
          path: "max_health",
          op: "multiply",
          value: 1.5,
        });
      };
      _.forEach(units, modUnit);
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});