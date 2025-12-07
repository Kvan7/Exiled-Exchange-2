import re

import pytest

from constants.filenames import GAME_API_TABLES, STAT_DESCRIPTION_FILES
from constants.lang import LANGUAGES
from stores.game_store import GameStore


@pytest.mark.parametrize("lang", LANGUAGES)
def test_game_store_get_description(lang):
    store = GameStore(lang)
    forbidden_re = re.compile(r"[\[\]\|\{\}]")

    for filename in STAT_DESCRIPTION_FILES:
        df = store.get_description(filename)

        for _, row in df.iterrows():
            for matcher in row["matchers"]:
                text: str = matcher["string"]
                id_ = row.get("id", None)

                if "<nemesismod>" in text or "<enchanted>" in text or "<附魔>" in text:
                    clean_text = re.sub(r"\{\{.*?\}\}", "", text)
                else:
                    clean_text = text

                if (
                    (lang == "ko" and (id_ == "from_league_item_quantity_+%_permyriad"))
                    or (
                        lang == "ru"
                        and (
                            id_ == "expedition_elite_%_to_drop_rare_jewellery"
                            or id_
                            == "cast_when_stunned_gain_X_centienergy_when_stunned"
                            or id_
                            == "local_display_supported_by_level_x_awakened_weapon_elemental_damage"
                            or id_ == "buff_effect_on_self_+%"
                            or id_ == "you_and_allies_in_presence_accuracy_rating_+%"
                            or id_ == "you_and_allies_in_presence_attack_speed_+%"
                            or id_ == "you_and_allies_in_presence_cast_speed_+%"
                            or id_ == "you_and_allies_in_presence_cooldown_speed_+%"
                        )
                    )
                    or (
                        lang == "es"
                        and (
                            id_ == "from_league_item_quantity_+%_permyriad"
                            or id_ == "block_%_damage_taken_while_active_blocking"
                            or id_
                            == "skill_cost_efficiency_+%_if_consumed_power_charge_recently"
                        )
                    )
                    or (
                        lang == "ja"
                        and (
                            id_ == "map_betrayal_intelligence_+%"
                            or id_
                            == "map_betrayal_non_interrogate_options_grant_X_intelligence"
                            or id_
                            == "remnant_pickup_range_+%_if_you_have_at_least_100_tribute"
                        )
                    )
                    or (
                        lang == "cmn-Hant"
                        and (
                            id_
                            == "map_expedition_monster_spawn_additional_missing_life_%"
                            or id_ == "base_number_of_projectiles"
                        )
                    )
                    or (lang == "de" and (id_ == "temporal_chains_gem_level_+"))
                    or (
                        lang == "pt"
                        and (
                            id_
                            == "support_advancing_assault_projectile_damage_+%_final"
                            or id_ == "map_expedition_rare_monsters_+%"
                        )
                    )
                ):
                    # assert forbidden_re.search(clean_text) or ("{0%}" in clean_text), (
                    #     f"{filename} - [{id_}]: Translation has been fixed: {text}"
                    # )
                    continue

                assert (not forbidden_re.search(clean_text)) ^ ("{0%}" in clean_text), (
                    f"{filename} - [{id_}]: forbidden chars found in: {text}"
                )

        for val in df["matchers"]:
            for matcher in val:
                if "value" in matcher:
                    assert isinstance(matcher["value"], int), (
                        f"{filename} - values: invalid content found: {val}"
                    )


@pytest.mark.parametrize("lang", LANGUAGES)
@pytest.mark.parametrize("table", GAME_API_TABLES)
def test_game_store_get_table_loads_without_error(lang, table):
    store = GameStore(lang)
    df = store.get(table)
    assert df is not None
