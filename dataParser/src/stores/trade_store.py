import json
import os

import pandas as pd

from constants.filenames import ITEMS_JSON, STATIC_JSON, STATS_JSON
from constants.lang import LANG


class TradeStore:
    def __init__(self, lang: LANG):
        self.lang: LANG = lang
        self.data_dir: str = os.path.join(
            os.path.dirname(__file__), "../../data/json", self.lang
        )

    def load_file(
        self, filename: str
    ) -> dict[
        str, list[dict[str, str | bool | list[dict[str, str | bool | dict[str, bool]]]]]
    ]:
        with open(os.path.join(self.data_dir, filename), "r", encoding="utf-8") as f:
            return json.load(f)  # pyright:ignore [ reportAny ]

    def items(self) -> pd.DataFrame:
        rows: list[dict[str, str | bool | None]] = []
        data = self.load_file(ITEMS_JSON)
        for item in data["result"]:
            if not isinstance(item["entries"], list):
                raise ValueError("Entries should be a list")
            for entry in item["entries"]:
                rows.append(
                    {  # pyright:ignore [ reportArgumentType ]
                        "id": item["id"],
                        "label": item["label"],
                        "type": entry.get("type"),
                        "text": entry.get("text"),
                        "name": entry.get("name"),
                        "unique": entry.get("flags", {}).get("unique", False),  # pyright:ignore [reportUnknownMemberType,reportAttributeAccessIssue]
                    }
                )
        return pd.DataFrame(rows)

    def stats(self) -> pd.DataFrame:
        rows: list[dict[str, str | bool]] = []
        data = self.load_file(STATS_JSON)
        for stat in data["result"]:
            if not isinstance(stat["entries"], list):
                raise ValueError("Entries should be a list")
            for entry in stat["entries"]:
                text = entry["text"]
                if isinstance(text, str):
                    text = text.replace("+#%", "#%")
                rows.append(
                    {  # pyright:ignore [ reportArgumentType ]
                        "id": entry["id"],
                        "text": text,
                        "type": entry["type"],
                    }
                )
        return pd.DataFrame(rows).drop_duplicates(subset="id", keep="last")

    def static(self) -> pd.DataFrame:
        rows: list[dict[str, str]] = []
        data = self.load_file(STATIC_JSON)
        for item in data["result"]:
            if not isinstance(item["entries"], list):
                raise ValueError("Entries should be a list")
            for entry in item["entries"]:
                tag: str | None = entry.get("id")  # pyright: ignore[reportAssignmentType]
                rows.append(
                    {  # pyright:ignore [ reportArgumentType ]
                        "type": item["id"],
                        "tradeTag": tag
                        if tag is not None
                        and (
                            "precursor-tablet" not in tag
                            and "idol-of-estazunti" not in tag
                            and "gaze" not in tag
                            and "waystone" not in tag
                        )
                        else None,
                        "text": entry.get("text"),
                        "image": entry.get("image"),
                    }
                )
        return pd.DataFrame(rows)
