import logging
import os
import re
import uuid

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


def modTierBuilderB(mod_data, base_item_types, gold_mod_prices):
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

    # Create mapping of BaseItemTypes.Tags and Mods
    item_tags_map = {
        row["Id"]: set(row["Tags"].split(",") if row["Tags"] else [])
        for row in base_item_types
    }
    mod_tags_map = {
        row["Mod"]: set(row["Tags"].split(",") if row["Tags"] else [])
        for row in gold_mod_prices
    }

    # Step 2: Filter mods by applicable items
    filtered_mods = []
    for mod in flat_mods:
        mod_id = mod.get("mod_unique_id")
        mod_tags = mod_tags_map.get(mod_id, set())
        applicable_items = []

        for item_id, item_tags in item_tags_map.items():
            # Check if the mod's tags overlap with the item's tags
            if mod_tags.intersection(item_tags):
                applicable_items.append(item_id)

        if applicable_items:
            mod["applicable_items"] = applicable_items
            filtered_mods.append(mod)

    logger.info(f"Filtered mods to {len(filtered_mods)} with applicable items")

    # Step 3: Organize mods by stat and tiers for applicable items
    base_item_stats = {}
    for mod in filtered_mods:
        for item_id in mod["applicable_items"]:
            if item_id not in base_item_stats:
                base_item_stats[item_id] = {}

            for stat_id in mod["mod_stat_ids"]:
                if stat_id not in base_item_stats[item_id]:
                    base_item_stats[item_id][stat_id] = []

                base_item_stats[item_id][stat_id].append(
                    {
                        "tier": len(base_item_stats[item_id][stat_id]) + 1,
                        "mod_id": mod["mod_unique_id"],
                        "mod_name": mod["mod_name"],
                        "mod_level": mod["mod_level"],
                        "mod_stat_values": mod["mod_stat_values"],
                    }
                )

    # Step 4: Sort tiers within each stat for consistency
    for item_id, stats in base_item_stats.items():
        for stat_id, tiers in stats.items():
            tiers.sort(key=lambda x: x["mod_level"])

    logger.info(f"Generated tiers for {len(base_item_stats)} item base types")

    return base_item_stats


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
    logging.basicConfig(level=logging.INFO)
    modTierBuilderB(mod_data, base_item_data, gold_data)
