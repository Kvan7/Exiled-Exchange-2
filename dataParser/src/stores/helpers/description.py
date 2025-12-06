import os
import re
from itertools import groupby
from re import Pattern

import pandas as pd
from numpy.strings import isdigit

from constants.filenames import STAT_DESCRIPTION_FILES_TYPE
from constants.known_stats import (
    BETTER_LOOKUP,
    RECOVERY_APPLIED_INSTANTLY,
    TIME_LOST_HISTORIC_JEWEL,
)
from constants.lang import (
    ALL_LANG,
    ENGLISH,
    LANG,
    LANGUAGES_NAMES,
    LANGUAGES_NAMES_TO_CODES,
)
from stores.helpers.hash_computer import HashComputer


class Description:
    pattern_full: Pattern[str] = re.compile(r"\[([^\|\]]*?)\|([^\]]+)\]")
    pattern_trailing: Pattern[str] = re.compile(r"([^\[\|\s]+)\|([^\]]+)\]")
    pattern_no_closing: Pattern[str] = re.compile(r"\[([^\|\]]*?)\|([^\]\[]+)")
    pattern_missing_left: Pattern[str] = re.compile(r"\|\s*([^\]]+)\]")

    def __init__(self, lang: LANG, filename: STAT_DESCRIPTION_FILES_TYPE):
        self.lang: LANG = lang

        self.data_dir: str = os.path.join(
            os.path.dirname(__file__), "../../../data/vendor/files"
        )

        self.filename: str = filename

        self.data: list[str] | None = None
        self.hc: HashComputer = HashComputer()

    def load(self):
        with open(
            os.path.join(self.data_dir, self.filename), "r", encoding="utf-16"
        ) as f:
            datalines = f.readlines()
        if len(datalines) == 0:
            raise ValueError(f"No data found for {self.filename}")
        trimmed_datalines = [line.strip() for line in datalines]

        filtered_datalines = [
            line.replace("\\n", "\\!")
            for line in trimmed_datalines
            if line != ""
            and not line.startswith("no_description")
            and not line.startswith("include")
        ]

        real_description_indices = [
            idx for idx, line in enumerate(filtered_datalines) if line == "description"
        ]
        if not real_description_indices:
            raise ValueError(f"No descriptions found for {self.filename}")

        descriptions: list[str] = []
        for i, start_idx in enumerate(real_description_indices):
            end_idx = (
                real_description_indices[i + 1]
                if i + 1 < len(real_description_indices)
                else len(filtered_datalines)
            )
            group = "\n".join(filtered_datalines[start_idx + 1 : end_idx]).strip()
            if group:
                descriptions.append(group)

        if not descriptions:
            raise ValueError(f"No descriptions found for {self.filename}")
        self.data = descriptions

    def to_dataframe(self) -> pd.DataFrame:
        output: list[dict[str, str | int | list[dict[str, str | int | bool]]]] = []
        if self.data is None:
            raise ValueError("No data found")
        for description in self.data:
            parsed = self.parse_description(description)
            output.append(parsed)
        return pd.DataFrame(output)

    def parse_ids(self, ids: str) -> tuple[int, tuple[str, ...]]:
        parts = ids.strip().split()
        count = int(parts[0])
        return count, tuple(parts[1:])

    def split_on_lang(
        self, description: str
    ) -> tuple[str, int, dict[ALL_LANG, list[str]]]:
        pre_lines = description.split("\n")

        if len(pre_lines) < 2:
            raise ValueError("Invalid description block.")

        lines = [f'lang "{LANGUAGES_NAMES[ENGLISH]}"', *pre_lines[1:]]

        ids = pre_lines[0]
        matcher_count = int(pre_lines[1])

        split: list[tuple[ALL_LANG, list[str]]] = []

        for is_lang, group in groupby(lines, lambda line: line.startswith("lang")):
            if is_lang:
                for line in group:
                    lang = line.split('"')[1]
                    if lang not in LANGUAGES_NAMES_TO_CODES:
                        raise ValueError(f"Invalid language name: {lang}")
                    split.append((LANGUAGES_NAMES_TO_CODES[lang], []))
            else:
                if not split:
                    raise AssertionError("No language found")
                for line in group:
                    if not line.isdigit():
                        split[-1][1].append(line)

        return (
            ids,
            matcher_count,
            {lang: lang_block for lang, lang_block in split},
        )

    def _apply_pattern_with_limit(
        self, pattern: re.Pattern[str], line: str, max_iterations: int = 25
    ) -> str:
        for _ in range(max_iterations):
            if not re.search(pattern, line):
                break
            line = re.sub(pattern, r"\2" if pattern.groups == 2 else r"\1", line)
        else:
            raise RuntimeError(
                f"Exceeded max iterations for pattern: {pattern.pattern}"
            )
        return line

    def replace_attribute_tags(self, line: str) -> str:
        line = self._apply_pattern_with_limit(self.pattern_full, line)
        line = self._apply_pattern_with_limit(self.pattern_trailing, line)
        line = self._apply_pattern_with_limit(self.pattern_no_closing, line)
        line = self._apply_pattern_with_limit(self.pattern_missing_left, line)

        line = line.replace("[", "").replace("]", "")
        return line

    def replace_placeholders(self, line: str) -> str:
        # NOTE: May need to move to be after combining with trade stuff
        # Replace {0}, {0:+d}, {:+d}, etc.
        line = re.sub(r"\{(?:[0-9]+)?(?:\:[^}]+)?\}", "#", line)
        # Replace bare {} placeholders
        line = re.sub(r"\{\}", "#", line)
        # Replace %1%, %2%, etc.
        line = re.sub(r"%[0-9]+%", "#", line)
        return line

    def parse_matcher(self, line: str) -> str:
        fixed_attribute_tags = self.replace_attribute_tags(line)
        fixed_placeholders = self.replace_placeholders(fixed_attribute_tags)
        replaced_newlines = fixed_placeholders.replace("\\!", "\n").replace(" \n", "\n")
        return replaced_newlines

    def parse_line(self, line: str) -> tuple[tuple[str, ...], str, str | None]:
        parts = line.strip().split('"')
        if len(parts) < 3:
            raise ValueError(f"Invalid line format: {line}")
        pre_quote = parts[0].strip()
        text = self.parse_matcher(parts[1].strip())
        if text.startswith("+"):
            text = text[1:]
        flags = parts[2].strip() if len(parts) > 2 and parts[2].strip() else None
        value_placeholders = tuple(pre_quote.split())
        return value_placeholders, text, flags

    def parse_description(
        self, description: str
    ) -> dict[str, bool | str | int | list[dict[str, str | int | bool]]]:
        ids, _, lang_blocks = self.split_on_lang(description)
        _, id_strings = self.parse_ids(ids)
        missing_lang = self.lang not in lang_blocks
        id = self.hc.compute_hash(list(id_strings))

        output: dict[str, bool | str | int | list[dict[str, str | int | bool]]] = {
            "id": id_strings[0],
            "hash": id,
            "better": 1 if id not in BETTER_LOOKUP else BETTER_LOOKUP[id],
        }

        matchers: list[dict[str, str | int | bool]] = []
        dp = None
        blocks = lang_blocks[ENGLISH] if missing_lang else lang_blocks[self.lang]
        for line in blocks:
            if "table_only" in line:
                continue
            value_placeholders, line_string, flags = self.parse_line(line)
            value = self.parse_value(value_placeholders, id)
            out: dict[str, str | int | bool] = {}
            out["string"] = line_string
            if value is not None:
                if id == RECOVERY_APPLIED_INSTANTLY and value == 100:
                    # Instant Recovery is a different trade ID so dont include this matcher
                    continue
                out["value"] = value
            negate = self.parse_negate(flags)
            if negate or self.override_negate(value_placeholders, id):
                out["negate"] = True
            canonical = self.parse_canonical(flags)
            if canonical:
                pass
                # out["canonical"] = True
            decimal = self.parse_dp(flags, line_string)
            if decimal and dp is None:
                dp = decimal
            matchers = [m for m in matchers if m["string"] != line_string]
            matchers.append(out)

        output["matchers"] = matchers
        if dp:
            output["dp"] = dp
        return output

    def parse_value(self, value_placeholders: tuple[str, ...], id: int) -> int | None:
        if not value_placeholders or len(value_placeholders) == 0:
            return None
        index = self.value_index(id)
        placeholder = value_placeholders[index]
        if placeholder.isdigit() or (
            placeholder.startswith("-") and isdigit(placeholder[1:])
        ):
            return int(placeholder)
        if id == 2342939473 or id == 4267306471:
            # current_energy_shield_%_as_elemental_damage_reduction viper_strike_dual_wield_damage_+%_final
            return None

        if id == 2055966527 and value_placeholders == ("#", "#", "!0"):
            # bleed_on_hit_with_attacks_%
            # # # !0 "[Attack|Attacks] cannot cause [Bleeding|Bleeding]"
            return 0

        mapping = {
            "!0": 0,
            "100|#": 100,
            "#|-100": -100,
            "2147483646|#": 2147483646,
            "101|#": 100,
            "#|1": 1,
            "99|100": 100,
            "10|19": 1,
            "10|#": 10,
            "15|24": 1,
            "99|#": 100,
            "5|#": 1,
        }
        return mapping.get(placeholder)

    def value_index(self, id: int) -> int:
        LOOKUP = {
            TIME_LOST_HISTORIC_JEWEL: 1,
        }
        if id in LOOKUP:
            return LOOKUP[id]
        return 0

    def override_negate(
        self, value_placeholders: tuple[str, ...], id: int
    ) -> bool | None:
        if not value_placeholders or len(value_placeholders) == 0:
            return None
        index = self.value_index(id)
        placeholder = value_placeholders[index]

        if id in {
            836936635,
            3598623697,
            472520716,
            1444556985,
            3979226081,
            2991563371,
            1726353460,
        }:
            return False

        return placeholder == "#|-1"

    def parse_negate(self, flags: str | None) -> bool | None:
        if flags is None:
            return None
        if "negate" in flags:
            return True
        return None

    def flip_negate(self, negate: bool | None) -> bool | None:
        assert negate is not False

        return True if negate is None else None

    def parse_canonical(self, flags: str | None) -> bool | None:
        if flags is None:
            return None
        if "canonical" in flags:
            return True
        return None

    def parse_dp(self, flags: str | None, line: str) -> bool | None:
        if flags is None:
            return None
        if "divide_by_one_hundred" in flags or (
            "per_minute_to_per_second" in flags and "%" not in line
        ):
            return True
        return None
