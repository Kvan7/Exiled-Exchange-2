# pyright: basic

import logging
from typing import Any

import pandas as pd
from pandas.core.frame import DataFrame

from constants.filenames import (
    ATLAS_STAT_DESCRIPTIONS,
    BASE_ITEM_TYPES,
    GOLD_MOD_PRICES,
    ITEM_CLASS_CATEGORIES,
    ITEM_CLASSES,
    MODS,
    STATS,
    TAGS,
    WORDS,
)
from constants.known_stats import (
    SAME_TRANSLATIONS_DIFFERENT_STATS,
    TRADE_INVERTED,
    UNIQUE_ITEMS_FIXED_STATS,
)
from constants.lang import ENGLISH, LANG, RUSSIAN
from constants.mod_types import EXPLICIT, MOD_TYPES
from services.image_provider import MODE, ImageProvider
from services.logbook_factions import LogbookFactions
from services.specific_column_service import SpecificColumnService
from services.value_converter_service import ValueConverterService
from stores.game_store import GameStore
from stores.trade_store import TradeStore

logger = logging.getLogger(__name__)


class NdBuilderService:
    local_lookup: dict[str, str]
    stats: pd.DataFrame
    items: pd.DataFrame

    def __init__(self, lang: LANG, image_mode: MODE):
        self.lang: LANG = lang

        self.ref_trade_store: TradeStore = TradeStore(ENGLISH)
        self.trade_store: TradeStore = TradeStore(lang)
        self.ref_game_store: GameStore = GameStore(ENGLISH)
        self.game_store: GameStore = GameStore(lang)

        self.vc = ValueConverterService(lang)
        self.image_mode: MODE = image_mode
        self.image_provider = ImageProvider(mode=image_mode)
        self.specific_column_service = SpecificColumnService(lang)
        self.logbook_factions = LogbookFactions(lang)

    def build_stats_ndjson(self) -> pd.DataFrame:
        logger.info("Building stats")
        # Get all required data
        # Data from Trade API
        logger.info("Importing trade site data")
        valueless_trade_stats_df = self.get_output_ready_trade_stats()
        value_trade_stats_df = self.get_output_value_stats()
        # Data from Descriptions
        logger.info("Importing descriptions")
        desc_df = self.descriptions_hashed()

        logger.info("Joining trade site and descriptions")
        joined_df = self.join_trade_and_descriptions(valueless_trade_stats_df, desc_df)

        timeless_mask = joined_df["ref"].str.startswith(("Small", "Notable"))
        joined_df.loc[timeless_mask] = joined_df.loc[timeless_mask].apply(
            self.timeless_function, axis=1
        )

        logger.info("Joining stats with and without values")
        concated = pd.concat([joined_df, value_trade_stats_df]).sort_values("ref")
        map_ids = self.map_stat_ids()

        concated.loc[concated["id"].isin(map_ids), "fromAreaMods"] = True

        joined_df_i = self.add_trade_inverted(concated)

        logger.info("Filling in missing matchers")
        missing_filled = self.fill_in_missing_matchers(joined_df_i)

        logger.info("Adding logbook factions")
        log_faction = self.logbook_factions.get_out_factions()
        log_added = pd.concat([missing_filled, log_faction]).sort_values("ref")

        logger.info("Cleaning up stats")
        return self.clean_up_ndjson(log_added)

    def clean_up_ndjson(self, ndjson: pd.DataFrame) -> pd.DataFrame:
        ndjson = ndjson[
            [
                "ref",
                "dp",
                "better",
                "matchers",
                "trade",
                "fromAreaMods",
                "id",
                # Hash is here and dropped later to not copy values of a slice
                "hash",
            ]
        ]
        ndjson["better"] = ndjson["better"].fillna(1).astype(int)

        def custom_sort_key(matcher):
            # Determine the group number: 0 for no 'negated' and no 'value', 1 for 'negated', 2 for 'value'
            if "negate" not in matcher and "value" not in matcher:
                group = 0
            elif "negate" in matcher:
                group = 1
            elif "value" in matcher:
                group = 2
            else:
                # Handles unexpected cases, if any
                group = 3

            # Return a tuple: group number and string length
            return (group, len(matcher["string"]))

        ndjson["matchers"] = ndjson["matchers"].apply(
            lambda x: sorted(x, key=custom_sort_key)
        )
        self.stats = ndjson.sort_values(by="ref").drop(columns=["hash"])
        return self.stats

    def join_trade_and_descriptions(
        self, trade_stats_df: pd.DataFrame, desc_df: pd.DataFrame
    ) -> pd.DataFrame:
        def custom_agg(col: pd.Series):
            col_name = col.name
            if col_name == "hash":
                return list(col.dropna())

            if col_name == "matchers":
                return list(
                    {
                        frozenset(d.items()): d for sub in col.dropna() for d in sub
                    }.values()
                )

            return col.iloc[0]

        grouped_trade_stats_df_xploded = trade_stats_df.explode("hash")

        merged_trade_stats_df = grouped_trade_stats_df_xploded.merge(
            desc_df, left_on="hash", right_on="hash", how="left"
        )
        merged_trade_stats_df_un_exploded = (
            merged_trade_stats_df.groupby("ref").agg(custom_agg).reset_index()
        )
        return merged_trade_stats_df_un_exploded

    def add_trade_inverted(self, in_df: pd.DataFrame) -> pd.DataFrame:
        def add_inverted(row):
            trade = row["trade"]
            if len(row["hash"]) > 0 and row["hash"][0] in TRADE_INVERTED:
                trade["inverted"] = True
            return trade

        df = in_df.copy()
        df["trade"] = df.apply(add_inverted, axis=1)
        return df

    def stats_combined_df(self) -> pd.DataFrame:
        ref_stats_df = self.ref_trade_store.stats()[["id", "text", "type"]]
        lang_stats_df = self.trade_store.stats()[["id", "text"]]
        combined_df = pd.merge(
            ref_stats_df,
            lang_stats_df,
            on="id",
            suffixes=("_ref", "_text"),
            validate="1:1",
        )
        combined_df = combined_df.rename(
            columns={"text_text": "text", "text_ref": "ref"}
        )
        out = combined_df[["id", "text", "ref", "type"]]
        out["ref"] = out["ref"].str.replace(r" \(.*\)", "", regex=True)

        self.local_lookup = {row["ref"]: row["text"] for _, row in out.iterrows()}

        return out

    def descriptions_hashed(self) -> pd.DataFrame:
        all_desc_de_dupped = self.game_store.get_all_descriptions().drop_duplicates(
            "id", keep="last"
        )
        atlas_ones = self.game_store.get_description(ATLAS_STAT_DESCRIPTIONS)

        return pd.concat([atlas_ones, all_desc_de_dupped])

    def valueless_trade_stats_df(self) -> pd.DataFrame:
        stats_df = self.stats_combined_df()
        return stats_df[~stats_df["id"].str.contains("\\|")]

    def value_trade_stats_df(self) -> pd.DataFrame:
        stats_df = self.stats_combined_df()
        value_trade_stats_df: DataFrame = stats_df[
            stats_df["id"].str.contains("\\|")
        ].copy()
        value_trade_stats_df["value"] = (
            value_trade_stats_df["id"].str.split("\\|").str[-1]
        )
        value_trade_stats_df["id"] = value_trade_stats_df["id"].str.split("\\|").str[0]
        value_trade_stats_df["hash"] = value_trade_stats_df.apply(
            lambda row: int(row["id"].split("_")[-1]), axis=1
        )
        return value_trade_stats_df

    def group_trade_stats(self, in_df: pd.DataFrame) -> pd.DataFrame:
        # Check we have needed columns
        assert set(in_df.columns) == {"id", "text", "ref", "type"}  # nosec: B101
        grouped_trade_stats_df = in_df.pivot_table(
            index=["ref"],
            columns="type",
            values="id",
            aggfunc=lambda ids: list(ids),
        ).reset_index()
        for col in MOD_TYPES:
            grouped_trade_stats_df[col] = (
                grouped_trade_stats_df[col]
                .fillna("")
                .apply(lambda d: d if isinstance(d, list) else [])
            )

        assert set(grouped_trade_stats_df.columns) == {"ref"}.union(MOD_TYPES)  # nosec: B101
        return grouped_trade_stats_df

    def add_hash_to_trade_stats(self, in_df: pd.DataFrame) -> pd.DataFrame:
        def get_hash(row) -> list[int]:
            hashes: set[int] = set()
            for t in MOD_TYPES:
                for trade_id in row[t]:
                    num = trade_id.split("_")[-1]
                    if num.isdigit():
                        hashes.add(int(num))
            return sorted(hashes)

        out_df = in_df.copy()
        out_df["hash"] = out_df.apply(lambda row: get_hash(row), axis=1)

        return out_df

    def convert_to_trade_out(self, in_df: pd.DataFrame) -> pd.DataFrame:
        def make_trade(row):
            ids = {}
            for mod in MOD_TYPES:
                if row[mod]:
                    ids[mod] = sorted(row[mod])
                    if (
                        mod == EXPLICIT
                        and self.lang in SAME_TRANSLATIONS_DIFFERENT_STATS
                    ):
                        for key, related_stats in SAME_TRANSLATIONS_DIFFERENT_STATS[
                            self.lang
                        ].items():
                            if key in ids[mod]:
                                ids[mod].extend(related_stats)
            x: dict[str, dict[Any, Any] | bool] = {"ids": ids}
            return x

        trade_stats_out_closer_df = in_df.copy().drop(columns=MOD_TYPES)
        trade_stats_out_closer_df["trade"] = in_df.apply(make_trade, axis=1)
        return trade_stats_out_closer_df

    def get_output_ready_trade_stats(self) -> pd.DataFrame:
        value_less_stats = self.valueless_trade_stats_df()
        grouped_valueless_stats = self.group_trade_stats(value_less_stats)
        hash_stats = self.add_hash_to_trade_stats(grouped_valueless_stats)
        trade_stats = self.convert_to_trade_out(hash_stats)
        return trade_stats

    def get_output_value_stats(self) -> pd.DataFrame:
        value = self.value_trade_stats_df()
        return self.vc.convert_value_stats_to_trade(value)

    def timeless_function(self, row: pd.Series) -> pd.Series:
        if self.local_lookup is None:
            raise ValueError("Local lookup is not set")

        ref = row["ref"]
        matchers = {"string": self.local_lookup[ref]}
        row["matchers"] = [matchers]
        return row

    def build_items_ndjson(self) -> pd.DataFrame:
        logger.info("Building items")

        logger.info("Getting unique items")
        unique_items = self.unique_items()
        logger.info("Getting non-unique items")
        non_unique_items = self.non_unique_items()

        logger.info("Applying gem and armour columns")
        col_added = self.specific_column_service.apply_item_specific_columns(
            non_unique_items, self.stats
        )

        logger.info("Joining unique and non-unique dfs")
        combined = pd.concat([unique_items, col_added]).reset_index(drop=True)

        logger.info("Cleaning up items")
        cleaned_items = self.clean_up_items(combined)

        logger.info(f"Applying images at level {self.image_mode}")
        images_added = self.apply_images(cleaned_items)
        images_added.loc[images_added["namespace"] != "UNIQUE", "craftable"] = (
            images_added.loc[images_added["namespace"] != "UNIQUE", "category"].apply(
                lambda x: {"category": x}
            )
        )

        logger.info("adding static data")
        static = self.ref_trade_store.static()
        static["icon_s"] = static["image"].apply(lambda x: f"https://web.poecdn.com{x}")
        static_items_added = images_added.merge(
            static[["text", "icon_s", "tradeTag"]],
            left_on="refName",
            right_on="text",
            how="left",
        )
        static_items_added.loc[static_items_added["icon_s"].notna(), "icon"] = (
            static_items_added["icon_s"]
        )

        logger.info("Sorting and returning items")
        self.items = static_items_added.sort_values(by=["namespace", "refName"])[
            [
                "name",
                "refName",
                "namespace",
                "unique",
                "icon",
                "tags",
                "tradeTag",
                "craftable",
                "w",
                "h",
                "armour",
                "gem",
                "rune",
            ]
        ]
        return self.items

    def get_items_base_types(self) -> pd.DataFrame:
        ref_base_types = self.ref_game_store.get(BASE_ITEM_TYPES)[
            ["_index", "ItemClass", "Width", "Height", "Name", "DropLevel", "Tags"]
        ].rename({"Name": "refName", "_index": "internal_index"}, axis=1)
        base_types = self.game_store.get(BASE_ITEM_TYPES)[["Name"]]
        return base_types.join(ref_base_types, validate="1:1").rename(
            {"refName": "type"}, axis=1
        )

    def unique_items(self) -> pd.DataFrame:
        ts_items = self.ref_trade_store.items()
        words = self.game_store.get(WORDS)
        joined_base = self.get_items_base_types()

        unique_mask = ts_items["unique"] == True  # noqa: E712
        unique_items = ts_items.loc[unique_mask].copy()
        unique_items["namespace"] = "UNIQUE"

        # Edge case fix: Rename specific items
        outdated_names = {
            "Sekhema's Resolve": "Sekhema's Resolve Fire",
            "The Road Warrior": "The Immortan",
            "Byrnabas": "Brynabas",
            "Splinter of Lorrata": "Splinter of Loratta",
        }
        unique_items["name"] = unique_items["name"].replace(outdated_names)

        named_unique_items = unique_items.merge(
            words[["Text", "Text2"]], left_on="name", right_on="Text", how="left"
        )[["type", "namespace", "Text2", "Text"]].rename(
            {"Text2": "name", "Text": "refName"}, axis=1
        )

        named_unique_items["unique"] = named_unique_items.apply(
            lambda row: {"base": row["type"]}
            if row["refName"] not in UNIQUE_ITEMS_FIXED_STATS
            else {
                "base": row["type"],
                "fixedStats": UNIQUE_ITEMS_FIXED_STATS[row["refName"]],
            },
            axis=1,
        )
        combined_unique = joined_base.merge(
            named_unique_items, on="type", how="right"
        ).drop("Name", axis=1)
        return combined_unique

    def non_unique_items(self) -> pd.DataFrame:
        ts_items = self.ref_trade_store.items()
        joined_base = self.get_items_base_types()
        non_unique_mask = ts_items["unique"] == False  # noqa: E712

        non_unique_items = ts_items.loc[non_unique_mask].copy()

        non_unique_items["namespace"] = non_unique_items["id"].apply(
            lambda x: "GEM" if x == "gem" else "ITEM"
        )
        non_unique_items.loc[
            non_unique_items["type"].str.startswith("Uncut"), "namespace"
        ] = "ITEM"
        classes = self.ref_game_store.get(ITEM_CLASSES)[
            ["_index", "ItemClassCategory"]
        ].merge(
            self.ref_game_store.get(ITEM_CLASS_CATEGORIES).rename(
                {"_index": "_index2"}, axis=1
            )[["_index2", "Id"]],
            left_on="ItemClassCategory",
            right_on="_index2",
            how="left",
        )
        combined_non_unique = joined_base.merge(
            non_unique_items[["type", "namespace"]], on="type", how="right"
        ).rename({"type": "refName", "Name": "name"}, axis=1)
        combined_non_unique = combined_non_unique.merge(
            classes[["_index", "Id"]],
            left_on="ItemClass",
            right_on="_index",
            validate="m:1",
        ).drop(["_index"], axis=1)
        return combined_non_unique

    def map_stat_ids(self) -> set[str]:
        mods = self.game_store.get(MODS)
        gold = self.game_store.get(GOLD_MOD_PRICES)
        stats_lookup = self.game_store.get(STATS)["Id"].to_dict()

        map_mods = mods.loc[mods["Id"].str.startswith("Map")]
        inner = map_mods.merge(gold, left_on="_index", right_on="Mod", how="inner")

        stat_col = [f"Stat{i}" for i in range(1, 7)]
        all_stats_l = []
        for col in stat_col:
            all_stats_l.append(inner[col].fillna(-1).astype(int))

        all_stats = pd.concat(all_stats_l)
        return set(stats_lookup[x] for x in all_stats[all_stats != -1].dropna())  # pyright: ignore[reportReturnType]

    def clean_up_items(self, items: pd.DataFrame) -> pd.DataFrame:
        tags = self.ref_game_store.get(TAGS)
        tags_lookup = tags["Id"].to_dict()
        filtered = items.drop(["ItemClass", "type", "DropLevel"], axis=1).rename(
            {"Id": "category", "Width": "w", "Height": "h", "Tags": "tags"}, axis=1
        )
        filtered["tags"] = filtered["tags"].apply(lambda x: [tags_lookup[t] for t in x])
        return filtered

    def apply_images(self, items: pd.DataFrame) -> pd.DataFrame:
        return self.image_provider.apply_images(items)

    def fill_in_missing_matchers(self, joined_df_i: pd.DataFrame) -> pd.DataFrame:
        trade_stats_df = self.stats_combined_df()
        trade_stats_df["matchers"] = trade_stats_df["text"].apply(
            lambda x: [{"string": x}]
        )
        ref_matchers_dict = trade_stats_df.set_index("ref")["matchers"].to_dict()

        def update_matchers(row):
            if isinstance(row["matchers"], list) and len(row["matchers"]) == 0:
                # Check if ref is in the dictionary
                if row["ref"] in ref_matchers_dict:
                    return ref_matchers_dict[row["ref"]]
            return row["matchers"]

        joined_df_i["matchers"] = joined_df_i.apply(update_matchers, axis=1)
        return joined_df_i
