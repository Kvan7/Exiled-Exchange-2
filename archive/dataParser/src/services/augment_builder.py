import logging

import pandas as pd
from pandas.core.frame import DataFrame

from constants.filenames import (
    BASE_ITEM_TYPES,
    SOUL_CORE_STAT_CATEGORIES,
    SOUL_CORE_STATS,
    SOUL_CORES,
    STATS,
)
from constants.lang import ENGLISH
from stores.game_store import GameStore
from stores.trade_store import TradeStore

SOUL_CORE_CLASS_MAPPINGS = {
    "All": [
        "Bow",
        "Claw",
        "Crossbow",
        "Dagger",
        "Flail",
        "One Hand Axe",
        "One Hand Mace",
        "One Hand Sword",
        "Spear",
        "Talisman",
        "Two Hand Axe",
        "Two Hand Mace",
        "Two Hand Sword",
        "Warstaff",
        "Staff",
        "Wand",
        "Helmet",
        "Body Armour",
        "Boots",
        "Gloves",
        "Buckler",
        "Focus",
        "Shield",
        "Sceptre",
    ],
    "Martial Weapons": [
        "Bow",
        "Claw",
        "Crossbow",
        "Dagger",
        "Flail",
        "One Hand Axe",
        "One Hand Mace",
        "One Hand Sword",
        "Spear",
        "Talisman",
        "Two Hand Axe",
        "Two Hand Mace",
        "Two Hand Sword",
        "Warstaff",
    ],
    "Caster Weapons": ["Staff", "Wand"],
    "Armour": [
        "Helmet",
        "Body Armour",
        "Boots",
        "Gloves",
        "Buckler",
        "Focus",
        "Shield",
    ],
    "Shield": ["Shield", "Buckler"],
}

logger = logging.getLogger(__name__)


class AugmentBuilder:
    def __init__(self, nd_stats: pd.DataFrame) -> None:
        self.ref_trade_store: TradeStore = TradeStore(ENGLISH)
        self.ref_game_store: GameStore = GameStore(ENGLISH)
        self.nd_stats: pd.DataFrame = nd_stats
        self.db: DataFrame = self.build()

    def build(self) -> pd.DataFrame:
        cores = self.get_soul_cores()
        categories = self.get_categories()
        stats = self.get_stats(self.nd_stats)
        cores_with_stats = stats.merge(
            cores, left_on="SoulCore", right_index=True, validate="many_to_one"
        ).drop(columns=["SoulCore"])
        cores_with_stats["Classes"] = cores_with_stats["StatCategory"].apply(
            lambda x: categories[x]
        )
        renamed = cores_with_stats.rename(
            {
                "Name": "refName",
                "Classes": "categories",
            },
            axis=1,
        )[["refName", "categories", "string", "values", "tradeId"]]
        return renamed

    def get_soul_cores(
        self,
    ):
        soul_cores = self.ref_game_store.get(SOUL_CORES).drop(columns=["_index"])
        base_items = self.ref_game_store.get(BASE_ITEM_TYPES).drop(columns=["_index"])
        soul_core_item = soul_cores.merge(
            base_items, "inner", left_on="BaseItemType", right_index=True
        )[["Name", "RequiredLevel"]]

        logger.debug(soul_core_item)
        return soul_core_item

    def get_stats(self, nd_stats: pd.DataFrame):
        soul_core_stats = self.ref_game_store.get(SOUL_CORE_STATS).drop(
            columns=["_index"]
        )
        stats = self.ref_game_store.get(STATS).drop(columns=["_index"])

        exploded_joined = soul_core_stats.explode("Stats").merge(
            stats, how="inner", left_on="Stats", right_index=True
        )[["SoulCore", "StatCategory", "Id", "StatsValues"]]
        with_id = (
            exploded_joined.loc[lambda df: ~df.index.duplicated()]
            .dropna(subset=["Id"])
            .reset_index(drop=True)
        )
        joined = with_id.merge(nd_stats, left_on="Id", right_on="id", how="inner")

        joined["matcher"] = joined["matchers"].apply(self.first_non_negated)
        joined["rune_id"] = joined["trade"].apply(self.rune_stat_id)
        return joined[
            ["SoulCore", "StatCategory", "StatsValues", "matcher", "rune_id"]
        ].rename(
            {"matcher": "string", "rune_id": "tradeId", "StatsValues": "values"}, axis=1
        )

    def get_categories(self) -> dict[str, list[str]]:
        soul_core_categories = self.ref_game_store.get(SOUL_CORE_STAT_CATEGORIES).drop(
            columns=["_index"]
        )
        soul_core_categories["Classes"] = soul_core_categories["Id"].apply(
            lambda x: [x]
            if x not in SOUL_CORE_CLASS_MAPPINGS
            else SOUL_CORE_CLASS_MAPPINGS[x]
        )
        logger.debug(soul_core_categories["Classes"])
        return soul_core_categories["Classes"].to_dict()

    def first_non_negated(self, matchers: list[dict[str, str | int | bool]]):
        """
        Returns the first dictionary in 'matchers' list where 'negated' is either absent or False.
        :param matchers: List of dictionaries to search.
        :return: The first non-negated dictionary or None if all are negated.
        """

        sorted_matchers = sorted(
            matchers,
            key=lambda x: len(x["string"]) if isinstance(x["string"], str) else 9999999,
        )
        for matcher in sorted_matchers:
            # Check for absence of 'negated' key or its value being False
            if not matcher.get("negate", False) and not matcher.get("value"):
                return matcher["string"]
        for matcher in sorted_matchers:
            if not matcher.get("value"):
                return matcher["string"]
        raise ValueError("No non-negated matcher found")

    def rune_stat_id(self, ids: dict[str, dict[str, list[str]]] | None):
        return (ids.get("ids") or {}).get("rune") if ids else None
