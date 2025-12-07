from typing import cast

import pandas as pd

from constants.filenames import (
    ARMOUR_TYPES,
    ITEM_CLASSES,
    SOUL_CORES,
    SOUL_CORES_PER_CLASS,
    STATS,
)
from constants.lang import ENGLISH, LANG
from stores.game_store import GameStore

GENERAL_CLASS_TO_ITEM_CLASS = {
    "armour": [
        "Body Armour",
        "Boots",
        "Buckler",
        "Focus",
        "Gloves",
        "Helmet",
        "Shield",
    ],
    "weapon": [
        "Bow",
        "Claw",
        "Crossbow",
        "Dagger",
        "Flail",
        "One Hand Axe",
        "One Hand Mace",
        "One Hand Sword",
        "Spear",
        "Two Hand Axe",
        "Two Hand Mace",
        "Two Hand Sword",
        "Warstaff",
        "Talisman",
    ],
    "caster": [
        "Staff",
        "Wand",
    ],
}


class SpecificColumnService:
    def __init__(self, lang: LANG):
        self.lang: LANG = lang

        # self.ref_trade_store: TradeStore = TradeStore(ENGLISH)
        # self.trade_store: TradeStore = TradeStore(lang)
        self.ref_game_store: GameStore = GameStore(ENGLISH)
        # self.game_store: GameStore = GameStore(lang)

    def apply_item_specific_columns(
        self, items: pd.DataFrame, stats: pd.DataFrame
    ) -> pd.DataFrame:
        plus_ar = self.apply_armour_column(items)
        plus_gem = self.apply_gem_column(plus_ar)
        plus_rune = self.apply_rune_column(plus_gem, stats)
        return plus_rune

    def apply_armour_column(self, items: pd.DataFrame) -> pd.DataFrame:
        armour = self.ref_game_store.get(ARMOUR_TYPES)

        def create_armour_dict(row: dict[str, int | str]) -> dict[str, list[int]]:
            armour_dict: dict[str, list[int]] = {}
            if row["Armour"] != 0:
                armour_dict["ar"] = [int(row["Armour"]), int(row["Armour"])]
            if row["Evasion"] != 0:
                armour_dict["ev"] = [int(row["Evasion"]), int(row["Evasion"])]
            if row["EnergyShield"] != 0:
                armour_dict["es"] = [int(row["EnergyShield"]), int(row["EnergyShield"])]
            return armour_dict

        armour["armour"] = armour.apply(create_armour_dict, axis=1)
        armour = armour[["BaseItemType", "armour"]]

        return items.merge(
            armour, left_on="internal_index", right_on="BaseItemType", how="left"
        ).drop("BaseItemType", axis=1)

    def apply_gem_column(self, items: pd.DataFrame) -> pd.DataFrame:
        gem = items.copy()

        def create_gem_dict(namespace_col: str) -> dict[str, bool] | None:
            return (
                {"awakened": False, "transfigured": False}
                if namespace_col == "GEM"
                else None
            )

        gem["gem"] = gem["namespace"].apply(create_gem_dict)  # pyright:ignore [reportUnknownMemberType]
        return gem

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
                return matcher
        for matcher in sorted_matchers:
            if not matcher.get("value"):
                return matcher
        print(sorted_matchers)
        raise ValueError("No non-negated matcher found")

    def apply_rune_column(
        self, items: pd.DataFrame, stats: pd.DataFrame
    ) -> pd.DataFrame:
        runes_a = self.apply_rune_column_by_rune(items, stats)
        runes_b = self.apply_rune_column_by_item_class(items, stats)
        runes = pd.concat([runes_a, runes_b])
        grouped = runes.groupby("BaseItemType", as_index=False).agg(  # pyright:ignore [reportUnknownMemberType]
            {"rune": lambda runes: [r for rune_list in runes for r in rune_list]}  # pyright:ignore [reportUnknownLambdaType,reportUnknownVariableType]
        )

        return items.merge(
            grouped,
            left_on="internal_index",
            right_on="BaseItemType",
            how="left",
        )

    def apply_rune_column_by_rune(
        self, _: pd.DataFrame, stats: pd.DataFrame
    ) -> pd.DataFrame:
        runes = self.ref_game_store.get(SOUL_CORES).drop(
            ["_index", "RequiredLevel"], axis=1
        )
        stats_lookup: dict[int, str] = self.ref_game_store.get(STATS)["Id"].to_dict()  # pyright:ignore [reportUnknownVariableType,reportUnknownMemberType]

        def replace_indices_with_ids(index_list: list[int]):
            return [stats_lookup[i] for i in index_list]

        runes["StatsArmour"] = runes["StatsArmour"].apply(replace_indices_with_ids)  # pyright:ignore [reportUnknownMemberType]
        runes["StatsMartialWeapon"] = runes["StatsMartialWeapon"].apply(  # pyright:ignore [reportUnknownMemberType]
            replace_indices_with_ids
        )
        runes["StatsCasterWeapon"] = runes["StatsCasterWeapon"].apply(  # pyright:ignore [reportUnknownMemberType]
            replace_indices_with_ids
        )

        runes["StatsAllEquipment"] = runes["StatsAllEquipment"].apply(  # pyright:ignore [reportUnknownMemberType]
            replace_indices_with_ids
        )

        def process_row(rune: dict[str, int | list[int]], ref_df: pd.DataFrame):
            rune_out: list[
                dict[str, str | int | bool | list[int] | list[str] | None]
            ] = []

            def process_stat(stat_list: list[int], value_list_key: str, key: str):
                if len(stat_list) > 0:
                    stat_id = stat_list[0]
                    # Look up the row in ref_df with the corresponding 'id' and get 'matchers' and 'trade'
                    row = ref_df.loc[ref_df["id"] == stat_id]
                    if not row.empty:
                        matchers = cast(
                            list[dict[str, str | int | bool]], row["matchers"].iloc[0]
                        )
                        trade = (
                            cast(dict[str, dict[str, list[str]]], row["trade"].iloc[0])
                            if "trade" in row.columns
                            else {}
                        )

                        # Translate and extract values
                        translated = self.first_non_negated(matchers).get("string")
                        trade_id = (
                            (trade.get("ids") or {}).get("rune") if trade else None
                        )

                        # Fill the rune_out dictionary
                        rune_out.append(
                            {
                                "categories": GENERAL_CLASS_TO_ITEM_CLASS.get(key, []),
                                "string": translated,
                                "values": cast(list[int], rune[value_list_key]),
                                "tradeId": trade_id,
                            }
                        )

            if not (
                isinstance(rune["StatsArmour"], list)
                and isinstance(rune["StatsMartialWeapon"], list)
                and isinstance(rune["StatsCasterWeapon"], list)
                and isinstance(rune["StatsAllEquipment"], list)
            ):
                raise ValueError("Stats should be lists")

            # Process each type of stat
            process_stat(rune["StatsArmour"], "StatsValuesArmour", "armour")
            process_stat(
                rune["StatsMartialWeapon"], "StatsValuesMartialWeapon", "weapon"
            )
            process_stat(rune["StatsCasterWeapon"], "StatsValuesCasterWeapon", "caster")

            for this_key in GENERAL_CLASS_TO_ITEM_CLASS.keys():
                process_stat(
                    rune["StatsAllEquipment"], "StatsValuesAllEquipment", this_key
                )

            return rune_out

        runes["rune"] = runes.apply(process_row, axis=1, args=(stats,))
        filtered_runes = runes[["BaseItemType", "rune"]]
        dropped_empty = filtered_runes[
            filtered_runes["rune"].apply(lambda x: len(x) > 0)  # pyright:ignore [reportUnknownMemberType,reportUnknownArgumentType,reportUnknownLambdaType]
        ]
        return dropped_empty

    def apply_rune_column_by_item_class(
        self, _: pd.DataFrame, stats: pd.DataFrame
    ) -> pd.DataFrame:
        runes = self.ref_game_store.get(SOUL_CORES_PER_CLASS).drop(["_index"], axis=1)
        classes: dict[int, int] = self.ref_game_store.get(ITEM_CLASSES)["Id"].to_dict()  # pyright:ignore [reportUnknownVariableType,reportUnknownMemberType]
        stats_lookup: dict[int, str] = self.ref_game_store.get(STATS)["Id"].to_dict()  # pyright:ignore [reportUnknownVariableType,reportUnknownMemberType]

        def replace_indices_with_ids(index_list: list[int]):
            return [stats_lookup[i] for i in index_list]

        runes["Stats"] = runes["Stats"].apply(replace_indices_with_ids)  # pyright:ignore [reportUnknownMemberType]

        def process_row(rune: dict[str, int | list[int]], ref_df: pd.DataFrame):
            rune_out: list[
                dict[str, str | int | bool | list[int] | list[str] | None]
            ] = []

            if not (isinstance(rune["Stats"], list)):
                raise ValueError("Stats should be lists")

            if len(rune["Stats"]) == 0:
                return rune_out

            stat_id = rune["Stats"][0]
            # Look up the row in ref_df with the corresponding 'id' and get 'matchers' and 'trade'
            row = ref_df.loc[ref_df["id"] == stat_id]
            if not row.empty:
                matchers = cast(
                    list[dict[str, str | int | bool]], row["matchers"].iloc[0]
                )
                trade = (
                    cast(dict[str, dict[str, list[str]]], row["trade"].iloc[0])
                    if "trade" in row.columns
                    else {}
                )

                # Translate and extract values
                translated = self.first_non_negated(matchers).get("string")
                trade_id = (trade.get("ids") or {}).get("rune") if trade else None
                if not isinstance(rune["ItemClass"], int):
                    raise ValueError("ItemClass should be an integer")

                # Fill the rune_out dictionary
                rune_out.append(
                    {
                        "categories": classes[rune["ItemClass"]],
                        "string": translated,
                        "values": cast(list[int], rune["StatsValues"]),
                        "tradeId": trade_id,
                    }
                )

            return rune_out

        runes["rune"] = runes.apply(process_row, axis=1, args=(stats,))
        filtered_runes = runes[["BaseItemType", "rune"]]
        dropped_empty = filtered_runes[
            filtered_runes["rune"].apply(lambda x: len(x) > 0)  # pyright:ignore [reportUnknownMemberType,reportUnknownArgumentType,reportUnknownLambdaType]
        ]

        return dropped_empty
