import logging
import os
import re

logger = logging.getLogger(__name__)


def modTierBuilder(mod_data):
    # First flatten out for each stat on the mod
    flat_mods = []
    logger.info("Starting to build mods")
    logger.info(f"Incoming data: {len(mod_data)}")
    for mod in mod_data:
        mod_index = mod.get("_index")
        if mod_index is None:
            continue
        mod_unique_id = mod.get("Id")
        mod_type = mod.get("ModType")
        mod_level = mod.get("Level")
        mod_domain = mod.get("Domain")
        mod_name = mod.get("Name")
        mod_jewel_radius = mod.get("RadiusJewelType")
        mod_stats = []
        mod_stat_ids = []
        for stat_index in range(1, 7):
            stat = mod.get(f"Stat{stat_index}")
            if stat is None:
                continue
            stat_value = mod.get(f"Stat{stat_index}Value")
            if stat_value is None or not isinstance(stat_value, list):
                continue
            mod_stat_ids.append(stat)
            mod_stats.append(stat_value)

        mod_mod = {
            "mod_index": mod_index,
            "mod_unique_id": mod_unique_id,
            "mod_type": mod_type,
            "mod_level": mod_level,
            "mod_domain": mod_domain,
            "mod_name": mod_name,
            "mod_jewel_radius": mod_jewel_radius,
            "mod_stat_values": mod_stats,
            "mod_stat_ids": mod_stat_ids,
        }
        flat_mods.append(mod_mod)

    logger.info(f"Created {len(flat_mods)} mods")
    # step 2
    by_id = {}
    for mod in flat_mods:
        mod_id_with_trailing_num = mod.get("mod_unique_id")
        mod_id = re.sub(r"\d+$", "", mod_id_with_trailing_num.strip())
        if mod_id not in by_id:
            by_id[mod_id] = []
        by_id[mod_id].append(mod)
    logger.info(f"Created {len(by_id)} unique mods")

    return by_id


if __name__ == "__main__":
    import json

    with open(
        f"{os.path.dirname(os.path.realpath(__file__))}/../tables/en/Mods.json",
        "r",
        encoding="utf-8",
    ) as f:
        mod_data = json.load(f)
    logging.basicConfig(level=logging.INFO)
    modTierBuilder(mod_data)
