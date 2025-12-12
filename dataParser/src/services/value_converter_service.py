# pyright: basic

import re
from collections import defaultdict
from typing import Any

import pandas as pd

from constants.filenames import (
    ADVANCED_MOD_STAT_DESCRIPTIONS,
    BLIGHT_CRAFTING_RECIPES,
    BLIGHT_CRAFTING_RESULTS,
    PASSIVE_SKILLS,
)
from constants.known_stats import (
    ALLOCATES_NOTABLE,
    BETTER_LOOKUP,
    DISCONNECTED_PASSIVES_AROUND_KEYSTONE,
    JEWEL_RADIUS_CHANGE,
    JEWEL_RING_RADIUS,
    SUPPORTED_VALUES,
    TIME_LOST_HISTORIC_JEWEL,
    UNIQUE_JEWEL_PLUS_LEVEL,
    VALUE_TO_DESCRIPTION_ID,
    VALUE_TO_REF,
)
from constants.lang import GERMAN, LANG
from stores.game_store import GameStore
from stores.helpers.description import Description


class ValueConverterService:
    def __init__(self, lang: LANG):
        self.lang: LANG = lang
        self.blight = self.get_blight()

    def get_blight(self) -> dict[int, str]:
        g = GameStore(self.lang)
        passives = g.get(PASSIVE_SKILLS)[["_index", "PassiveSkillGraphId"]]
        blight_recipes = g.get(BLIGHT_CRAFTING_RECIPES)[
            ["BlightCraftingResult", "BlightCraftingItems"]
        ]
        blight_results = g.get(BLIGHT_CRAFTING_RESULTS)[["_index", "PassiveSkill"]]

        merged1 = passives.merge(
            blight_results, left_on="_index", right_on="PassiveSkill", how="inner"
        )
        merged2 = merged1.merge(
            blight_recipes,
            left_on="_index_y",
            right_on="BlightCraftingResult",
            how="inner",
        )
        filtered = merged2[["BlightCraftingItems", "PassiveSkillGraphId"]].dropna()
        filtered["PassiveSkillGraphId"] = filtered["PassiveSkillGraphId"].astype(int)
        records = filtered.to_dict(orient="records")
        return {
            r["PassiveSkillGraphId"]: ",".join(
                str(oil) for oil in r["BlightCraftingItems"]
            )
            for r in records
        }

    def convert_value_stats_to_trade(self, in_df: pd.DataFrame) -> pd.DataFrame:
        filtered_to_supported = in_df[in_df["hash"].isin(SUPPORTED_VALUES)]
        grouped = filtered_to_supported.set_index("hash").groupby(level="hash")
        converted = grouped.apply(self.agg_by_hash).reset_index(drop=True)
        converted["dp"] = None
        converted["hash"] = converted["hash"].apply(lambda x: [int(x)])

        return converted[["ref", "dp", "better", "matchers", "trade", "id", "hash"]]

    def agg_by_hash(self, in_df: pd.DataFrame) -> pd.DataFrame:
        hash: int = int(in_df.iloc[0].name)  # pyright: ignore[reportArgumentType]
        if hash == JEWEL_RADIUS_CHANGE:
            return self.simple_agg(in_df)
        elif hash == JEWEL_RING_RADIUS:
            return self.simple_agg(in_df)
        elif hash == ALLOCATES_NOTABLE:
            return self.simple_agg(in_df)
        elif hash == TIME_LOST_HISTORIC_JEWEL:
            return self.historic_agg(in_df)
        elif hash == DISCONNECTED_PASSIVES_AROUND_KEYSTONE:
            return self.simple_agg(in_df)
        elif hash == UNIQUE_JEWEL_PLUS_LEVEL:
            return self.simple_agg(in_df)

        return in_df

    def simple_agg(self, in_df: pd.DataFrame) -> pd.DataFrame:
        id = int(in_df.iloc[0].name)  # pyright: ignore[reportArgumentType]
        out = {
            "ref": VALUE_TO_REF[id],
            "id": VALUE_TO_DESCRIPTION_ID[id],
            "hash": id,
            "better": 1 if id not in BETTER_LOOKUP else BETTER_LOOKUP[id],
        }
        ids = defaultdict(set)
        matchers: list[dict[str, str | int | bool | list[int]]] = []
        for row in in_df.itertuples():
            ids[row.type].add(row.id)
            matcher: dict[str, Any] = {"string": row.text, "value": int(row.value)}  # pyright: ignore[reportArgumentType]
            if id == ALLOCATES_NOTABLE and int(row.value) in self.blight:  # pyright: ignore[reportArgumentType]
                matcher["oils"] = self.blight[int(row.value)]  # pyright: ignore[reportArgumentType]
            if id == UNIQUE_JEWEL_PLUS_LEVEL:
                matcher["string"] = matcher["string"].replace("+", "")
            matchers.append(matcher)
        out["trade"] = {"ids": {k: list(v) for k, v in ids.items()}, "option": True}
        matchers.sort(key=lambda x: x["value"])
        out["matchers"] = matchers

        return pd.DataFrame([out])

    def historic_agg(self, in_df: pd.DataFrame) -> pd.DataFrame:
        advanced_desc = Description(self.lang, ADVANCED_MOD_STAT_DESCRIPTIONS)
        advanced_desc.load()
        advanced_df: dict[str, list[dict[str, str]]] = (
            advanced_desc.to_dataframe().set_index("id")["matchers"].to_dict()
        )
        historic_matchers = advanced_df["local_unique_jewel_alternate_tree_version"]
        advanced_desc_array = [matcher["string"] for matcher in historic_matchers]
        max_value = (
            int(in_df["value"].max())
            if self.lang != GERMAN
            else int(in_df["value"].max()) - 1
        )
        if len(advanced_desc_array) != max_value:
            # error case, just return simple agg
            return self.simple_agg(in_df)
        out = []
        for row in in_df.itertuples():
            value = int(row.value) - 1  # pyright: ignore[reportArgumentType]
            if self.lang == GERMAN:
                value -= 1

            out_row = {
                "ref": row.ref.split("\n")[0],  # pyright: ignore[reportAttributeAccessIssue, reportArgumentType]
                "id": VALUE_TO_DESCRIPTION_ID[TIME_LOST_HISTORIC_JEWEL],
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "better": BETTER_LOOKUP[TIME_LOST_HISTORIC_JEWEL],
                "matchers": [
                    {
                        "string": re.sub(r"\([^)]*\)", "", advanced_desc_array[value]),
                        "advanced": advanced_desc_array[value],
                    }
                ],
                "trade": {
                    "ids": {
                        "explicit": [
                            f"explicit.stat_{TIME_LOST_HISTORIC_JEWEL}|{value + 1}"
                        ]
                    }
                },
            }
            out.append(out_row)

        return pd.DataFrame(out)
