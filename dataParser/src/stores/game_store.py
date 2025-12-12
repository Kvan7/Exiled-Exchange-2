import os

import pandas as pd

from constants.filenames import (
    GAME_API_TABLES_TYPE,
    STAT_DESCRIPTION_FILES,
    STAT_DESCRIPTION_FILES_TYPE,
)
from constants.lang import LANG, LANGUAGES_NAMES
from stores.helpers.description import Description


class GameStore:
    lang: LANG
    data_dir: str

    def __init__(self, lang: LANG):
        self.lang = lang
        self.data_dir = os.path.join(
            os.path.dirname(__file__),
            "../../data/vendor/tables",
            LANGUAGES_NAMES[self.lang],
        )

    def get(self, tableFileName: GAME_API_TABLES_TYPE) -> pd.DataFrame:
        return pd.read_json(os.path.join(self.data_dir, tableFileName))  # pyright:ignore [reportUnknownMemberType]

    def get_description(
        self, tableFileName: STAT_DESCRIPTION_FILES_TYPE
    ) -> pd.DataFrame:
        desc = Description(self.lang, tableFileName)
        desc.load()
        return desc.to_dataframe()

    def get_all_descriptions(self) -> pd.DataFrame:
        output = None
        for desc_file in STAT_DESCRIPTION_FILES:
            desc_df = self.get_description(desc_file)
            if output is None:
                output = desc_df
            else:
                output = pd.concat([output, desc_df])
        if output is None:
            raise ValueError("No descriptions found")
        return output
