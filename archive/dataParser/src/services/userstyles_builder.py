import logging

import pandas as pd

from constants.css import (
    USER_STYLE_PREFIX,
    USER_STYLE_SUFFIX,
)
from models.css_rule import CssRule
from models.user_style_model import UserStyleModel

logger = logging.getLogger(__name__)


class UserStylesBuilder:
    user_style_prefix: str = USER_STYLE_PREFIX
    user_style_suffix: str = USER_STYLE_SUFFIX

    def __init__(
        self,
        tagged_df: pd.DataFrame,
        css_rules: list[CssRule],
        user_style: UserStyleModel,
    ):
        self.df: pd.DataFrame = tagged_df
        self.css_rules: list[CssRule] = css_rules
        self.css_rules.reverse()
        self.user_style: UserStyleModel = user_style

    def build(self) -> str:
        output = [
            self.user_style_prefix.format(
                self.user_style.name,
                self.user_style.description,
                self.user_style.filename,
                self.user_style.version,
                self.user_style.user_style_vars,
            ),
            self.user_style.user_style_default_css,
        ]

        logger.info(f"Applying {len(self.css_rules)} css rules")
        logger.debug([str(rule) for rule in self.css_rules])

        for rule in self.css_rules:
            output.append(rule.apply(self.df))

        output.append(self.user_style_suffix)
        return "\n".join(output)
