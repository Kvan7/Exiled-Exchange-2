import logging
import os
import re
import uuid
from collections import defaultdict
from pprint import pprint

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

    # Filter duplicate stat1 ids, but shortest mod_id (keep shortest)
    shortest_mod_id_by_stat1 = {}
    for mod_id, mod_list in by_id.items():
        stat_list = mod_list[0].get("mod_stat_ids")
        if len(stat_list) < 1:
            shortest_mod_id_by_stat1[uuid.uuid4()] = mod_id
            continue
        stat1_id = stat_list[0]
        if stat1_id in shortest_mod_id_by_stat1:
            if len(mod_id) < len(shortest_mod_id_by_stat1[stat1_id]):
                shortest_mod_id_by_stat1[stat1_id] = mod_id
        else:
            shortest_mod_id_by_stat1[stat1_id] = mod_id

    # Filter by_id to only include shortest mod_id keys
    filtered_by_id = {}
    for stat1_id, mod_id in shortest_mod_id_by_stat1.items():
        filtered_by_id[mod_id] = by_id[mod_id]

    logger.info(f"Created {len(filtered_by_id)} single stat mods")

    return by_id


def modTierBuilderB(mod_data, base_item_types, gold_mod_prices, tags):
    gold_with_readable_tags = {
        mod_data[gold_row["Mod"]]["Id"]: {
            tags[tag]["Id"] if "armour" not in tags[tag]["Id"] else "body_armour"
            for tag in gold_row["Tags"]
            if tag
        }
        for gold_row in gold_mod_prices
    }

    # Flatten mods data for easier processing
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
        mod_allowed_base_types = gold_with_readable_tags.get(mod_unique_id, [])
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
            "mod_allowed_base_types": mod_allowed_base_types,
        }
        flat_mods.append(mod_mod)

    logger.info(f"Created {len(flat_mods)} mods")

    # step 2
    by_id = {}
    for mod in flat_mods:
        mod_id_with_trailing_num = mod.get("mod_unique_id")
        mod_id = re.sub(r"\d+_?$", "", mod_id_with_trailing_num.strip())
        if mod_id not in by_id:
            by_id[mod_id] = {
                "mods": [],
                "mods_id": mod_id,
                "mod_type": mod["mod_type"],
                "mod_allowed_base_types": set(mod["mod_allowed_base_types"]),
                "mod_stat_ids": set(mod["mod_stat_ids"]),
            }
        by_id[mod_id]["mods"].append(mod)
        by_id[mod_id]["mod_stat_ids"] = by_id[mod_id]["mod_stat_ids"].union(
            set(mod["mod_stat_ids"])
        )
        by_id[mod_id]["mod_allowed_base_types"] = by_id[mod_id][
            "mod_allowed_base_types"
        ].union(set(mod["mod_allowed_base_types"]))

    logger.info(f"Created {len(by_id)} unique mods")

    grouped_by_mod_type = defaultdict(list)
    for mod_id, mod_group in by_id.items():
        grouped_by_mod_type[mod_group["mod_type"]].append(mod_group)

    output_data = []

    for mod_type, mod_groups in grouped_by_mod_type.items():
        all_stats = set()
        for mod_group in mod_groups:
            all_stats = all_stats.union(mod_group["mod_stat_ids"])

    return output_data


if __name__ == "__main__":
    import json

    with open(
        f"{os.path.dirname(os.path.realpath(__file__))}/../tables/en/Mods.json",
        "r",
        encoding="utf-8",
    ) as f:
        mod_data = json.load(f)
    with open(
        f"{os.path.dirname(os.path.realpath(__file__))}/../tables/en/BaseItemTypes.json",
        "r",
        encoding="utf-8",
    ) as f:
        base_item_data = json.load(f)
    with open(
        f"{os.path.dirname(os.path.realpath(__file__))}/../tables/en/GoldModPrices.json",
        "r",
        encoding="utf-8",
    ) as f:
        gold_data = json.load(f)
    with open(
        f"{os.path.dirname(os.path.realpath(__file__))}/../tables/en/Tags.json",
        "r",
        encoding="utf-8",
    ) as f:
        tags = json.load(f)
    logging.basicConfig(level=logging.INFO)
    modTierBuilderB(mod_data, base_item_data, gold_data, tags)
