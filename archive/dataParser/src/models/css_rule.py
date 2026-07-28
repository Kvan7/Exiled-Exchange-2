import logging
from collections.abc import Callable
from typing import override

import pandas as pd

logger = logging.getLogger(__name__)


class CssRule:
    # the css that will be applied to all matching rows
    css: str
    # selector for the element on trade site
    css_selector: str
    # function that determines if the row should be included in this rule
    row_selector: Callable[[str, int, list[str], str], bool]

    name: str
    # None if always on
    # string for the bool option to disable
    disableSelector: str | None

    def __init__(
        self,
        css: str,
        css_selector: str,
        row_selector: Callable[[str, int, list[str], str], bool],
        name: str = "",
        disableSelector: str | None = None,
    ):
        self.css = css
        self.css_selector = css_selector
        self.row_selector = row_selector
        self.name = name
        self.disableSelector = disableSelector

    def apply(self, df: pd.DataFrame) -> str:
        my_hashes: list[str] = []
        logger.debug(f"Applying {self.css} to {df.shape[0]} rows")

        for _, row in df.iterrows():  # pyright: ignore[reportUnknownMemberType, reportUnknownVariableType]
            if self.row_selector(row["ref"], row["hash"], row["Tags"], row["id"]):  # pyright: ignore[reportUnknownArgumentType]
                my_hashes.append(row["hash"])  # pyright: ignore[reportUnknownArgumentType]
                logger.debug(f"Matched {row['ref']}[{row['hash']}]")

        out: list[str] = [f"/* {self.name} */"]
        # all but last
        for hash in my_hashes[:-1]:
            out.append(self.css_selector.format(hash) + ", ")

        out.append(self.css_selector.format(my_hashes[-1]) + "{")
        out.append(f"/* {self.name} */")
        out.append(self.css)
        out.append("}")
        logger.debug(f"Generated {len(out)} lines of css")

        if self.disableSelector is not None:
            out.insert(0, f"if {self.disableSelector} {{")
            out.append("}")

        return "\n".join(out)

    @override
    def __repr__(self):
        return f"CssRule(name={self.name}, css={self.css}, css_selector={self.css_selector}, row_selector={self.row_selector})"

    @override
    def __str__(self):
        return self.name
