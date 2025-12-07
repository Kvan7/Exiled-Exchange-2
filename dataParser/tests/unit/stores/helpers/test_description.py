import json
from unittest.mock import Mock

import pandas as pd
import pytest

from stores.helpers.description import Description


@pytest.mark.parametrize(
    "file_name,expected",
    [
        ("one_description_test.csd", "one_description_test.json"),
        (
            "one_description_multi_lines_test.csd",
            "one_description_multi_lines_test.json",
        ),
        ("two_description_test.csd", "two_description_test.json"),
        ("two_description_one_no_description_test.csd", "two_description_test.json"),
        ("case_empty.csd", pytest.raises(ValueError)),
        ("case_only_no_description.csd", pytest.raises(ValueError)),
    ],
    ids=[
        "One Description",
        "One Description, Multi Line Data",
        "Two Descriptions",
        "Two Descriptions, One No Description",
        "Empty File",
        "Only No Descriptions",
    ],
)
def test_description_from_files(tmp_path, file_name, expected):
    from pathlib import Path

    src = Path("tests/data/cases") / file_name
    dst = tmp_path / file_name
    dst.write_text(src.read_text(encoding="utf-8"), encoding="utf-16")

    desc = Description("en", dst.name)
    desc.data_dir = tmp_path

    if isinstance(expected, str):
        desc.load()
        with open(Path("tests/data/expected") / expected, "r", encoding="utf-8") as f:
            assert desc.data == json.loads(f.read())
    else:
        with expected:
            desc.load()


@pytest.mark.parametrize(
    "data,expected",
    [
        (
            ["first desc", "second desc"],
            pd.DataFrame(
                [
                    {"text": "first desc", "length": 10},
                    {"text": "second desc", "length": 11},
                ]
            ),
        ),
        (
            ["only one"],
            pd.DataFrame([{"text": "only one", "length": 8}]),
        ),
    ],
    ids=[
        "Two descriptions",
        "One description",
    ],
)
def test_description_to_dataframe_isolated(data, expected):
    desc = Description("en", "dummy.csd")
    desc.parse_description = lambda x: {"text": x, "length": len(x)}
    desc.data = data
    df = desc.to_dataframe()
    pd.testing.assert_frame_equal(
        df.reset_index(drop=True), expected.reset_index(drop=True)
    )


def test_description_to_dataframe_mixed_outputs():
    desc = Description("en", "dummy.csd")

    def fake_parse(x):
        if x == "one":
            return {"val": 1}
        if x == "two":
            return {"val": 2}

    desc.parse_description = fake_parse
    desc.data = ["one", "two"]
    df = desc.to_dataframe()
    expected = pd.DataFrame([{"val": 1}, {"val": 2}])
    pd.testing.assert_frame_equal(
        df.reset_index(drop=True), expected.reset_index(drop=True)
    )


@pytest.mark.parametrize(
    "string,expected_count",
    [
        (
            '''1 %_maximum_life_as_focus\n1\n# "Enemies have Maximum [Concentration] equal to {0}% of their Maximum Life"\nlang "Spanish"\n1\n# "Los enemigos tienen una [Concentration|concentración] equivalente al {0}% de su vida máxima"''',
            1,
        ),
        (
            """1 heist_coins_from_monsters_+%\n2\n1|# "{0}% increased Rogue's Markers dropped by monsters"\n#|-1 "{0}% reduced Rogue's Markers dropped by monsters" negate 1""",
            2,
        ),
        (
            '''1 local_jewel_variable_ring_radius_value\n8\n1 "Only affects Passives in Very Small Ring"\n2 "Only affects Passives in Small Ring"\n3 "Only affects Passives in Medium-Small Ring"\n4 "Only affects Passives in Medium Ring"\n5 "Only affects Passives in Medium-Large Ring"\n6 "Only affects Passives in Large Ring"\n7 "Only affects Passives in Very Large Ring"\n8 "Only affects Passives in Massive Ring"''',
            8,
        ),
        (
            '''2 local_display_socketed_gems_minimum_added_fire_damage local_display_socketed_gems_maximum_added_fire_damage\n1\n# # "Socketed Gems deal {0} to {1} Added Fire Damage"''',
            1,
        ),
        (
            '''2 local_unique_hungry_loop_number_of_gems_to_consume local_unique_hungry_loop_has_consumed_gem\n5\n1 0 "Consumes Socketed Uncorrupted Support Gems when they reach Maximum Level\\!Can Consume {0} Uncorrupted Support Gem\!Has not Consumed any Gems"\n1 # "Consumes Socketed Uncorrupted Support Gems when they reach Maximum Level\\!Can Consume {0} additional Uncorrupted Support Gem"\n2|# 0 "Consumes Socketed Uncorrupted Support Gems when they reach Maximum Level\\!Can Consume {0} Uncorrupted Support Gems\\!Has not Consumed any Gems"\n2|# # "Consumes Socketed Uncorrupted Support Gems when they reach Maximum Level\\!Can Consume {0} additional Uncorrupted Support Gems" canonical_line canonical_stat 1\n-1 1 "Has Consumed 1 Gem"''',
            5,
        ),
        (
            '''2 arsonist_destructive_link_%_of_life_as_fire_damage quality_display_arsonist_is_gem\n2\n# 0 "Deals additional [Fire] Damage equal to {0:+d}% of [Minion]'s maximum Life"\n# # "Deals additional [Fire] Damage equal to {0}% of [Minion]'s maximum Life"\nlang "Simplified Chinese"\n1\n# # "造成相当于[召唤生物]生命上限 {0}% 的额外[火焰]伤害"\nlang "Japanese"\n2\n# 0 "[Minion|ミニオン]の最大ライフの{0:+d}%と同量の追加[Fire|火]ダメージを与える"\n# # "[Minion|ミニオン]の最大ライフの{0}%と同量の追加[Fire|火]ダメージを与える"\nlang "Thai"\n2\n# 0 "สร้างความเสียหาย [Fire|ไฟ] เพิ่มเติม เท่ากับ {0:+d}% ของ พลังชีวิตสูงุสดของ[Minion|มิเนียน]"\n# # "สร้างความเสียหาย [Fire|ไฟ] เพิ่มเติม เท่ากับ {0}% ของ พลังชีวิตสูงุสดของ[Minion|มิเนียน]"\nlang "Spanish"\n2\n# 0 "Inflige daño de [Fire|fuego] adicional equivalente a {0:+d}% de la vida máxima del [Minion|esbirro]"\n# # "Inflige daño de [Fire|fuego] adicional equivalente al {0}% de la vida máxima del [Minion|esbirro]"\nlang "Portuguese"\n2\n# 0 "Causa Dano de [Fire|Fogo] adicional igual a {0:+d}% da Vida máxima do [Minion|Lacaio]"\n# # "Causa Dano de [Fire|Fogo] adicional igual a {0}% da Vida máxima do [Minion|Lacaio]"\nlang "German"\n2\n# 0 "Verursacht zusätzlichen [Fire|Feuer]schaden in Höhe von {0:+d}% des maximalen Lebens der [Minion|Kreatur]"\n# # "Verursacht zusätzlichen [Fire|Feuer]schaden in Höhe von {0}% des maximalen Lebens der [Minion|Kreatur]"\nlang "Korean"\n1\n# # "[Minion|소환수]의 최대 생명력의 {0}%와 동일한 추가 [Fire|화염] 피해를 줌"\nlang "Russian"\n2\n# 0 "Наносит дополнительный урон от [Fire|огня], равный {0:+d}% от максимума здоровья [Minion|приспешника]"\n# # "Наносит дополнительный урон от [Fire|огня], равный {0}% от максимума здоровья [Minion|приспешника]"\nlang "Traditional Chinese"\n1\n# # "造成相當於[Minion|召喚物]最大生命 {0}% 的[Fire|火焰]傷害"\nlang "French"\n1\n# # "Inflige des Dégâts de [Fire|Feu] supplémentaires équivalents à {0}% de la Vie maximale de la [Minion|Créature]"''',
            1,
        ),
    ],
    ids=[
        "One Id, One Matcher",
        "One Id, Two Matchers",
        "One Id, Many Matchers",
        "Two Ids, One Matcher",
        "Two Ids, Many Matchers",
        "Two Ids, One Matcher, Different Lang",
    ],
)
def test_parse_description_returns_correct_length(string, expected_count):
    desc = Description("en", "dummy.csd")

    parsed = desc.parse_description(string)

    assert len(parsed["matchers"]) == expected_count


@pytest.mark.parametrize(
    "string,expected_count",
    [
        (
            '''2 arsonist_destructive_link_%_of_life_as_fire_damage quality_display_arsonist_is_gem\n2\n# 0 "Deals additional [Fire] Damage equal to {0:+d}% of [Minion]'s maximum Life"\n# # "Deals additional [Fire] Damage equal to {0}% of [Minion]'s maximum Life"\nlang "Simplified Chinese"\n1\n# # "造成相当于[召唤生物]生命上限 {0}% 的额外[火焰]伤害"\nlang "Japanese"\n2\n# 0 "[Minion|ミニオン]の最大ライフの{0:+d}%と同量の追加[Fire|火]ダメージを与える"\n# # "[Minion|ミニオン]の最大ライフの{0}%と同量の追加[Fire|火]ダメージを与える"\nlang "Thai"\n2\n# 0 "สร้างความเสียหาย [Fire|ไฟ] เพิ่มเติม เท่ากับ {0:+d}% ของ พลังชีวิตสูงุสดของ[Minion|มิเนียน]"\n# # "สร้างความเสียหาย [Fire|ไฟ] เพิ่มเติม เท่ากับ {0}% ของ พลังชีวิตสูงุสดของ[Minion|มิเนียน]"\nlang "Spanish"\n2\n# 0 "Inflige daño de [Fire|fuego] adicional equivalente a {0:+d}% de la vida máxima del [Minion|esbirro]"\n# # "Inflige daño de [Fire|fuego] adicional equivalente al {0}% de la vida máxima del [Minion|esbirro]"\nlang "Portuguese"\n2\n# 0 "Causa Dano de [Fire|Fogo] adicional igual a {0:+d}% da Vida máxima do [Minion|Lacaio]"\n# # "Causa Dano de [Fire|Fogo] adicional igual a {0}% da Vida máxima do [Minion|Lacaio]"\nlang "German"\n2\n# 0 "Verursacht zusätzlichen [Fire|Feuer]schaden in Höhe von {0:+d}% des maximalen Lebens der [Minion|Kreatur]"\n# # "Verursacht zusätzlichen [Fire|Feuer]schaden in Höhe von {0}% des maximalen Lebens der [Minion|Kreatur]"\nlang "Korean"\n1\n# # "[Minion|소환수]의 최대 생명력의 {0}%와 동일한 추가 [Fire|화염] 피해를 줌"\nlang "Russian"\n2\n# 0 "Наносит дополнительный урон от [Fire|огня], равный {0:+d}% от максимума здоровья [Minion|приспешника]"\n# # "Наносит дополнительный урон от [Fire|огня], равный {0}% от максимума здоровья [Minion|приспешника]"\nlang "Traditional Chinese"\n1\n# # "造成相當於[Minion|召喚物]最大生命 {0}% 的[Fire|火焰]傷害"\nlang "French"\n1\n# # "Inflige des Dégâts de [Fire|Feu] supplémentaires équivalents à {0}% de la Vie maximale de la [Minion|Créature]"''',
            1,
        ),
    ],
    ids=[
        "two ids, langs have different matcher counts",
    ],
)
def test_parse_description_returns_correct_length_different_lang(
    string, expected_count
):
    desc = Description("ko", "dummy.csd")

    parsed = desc.parse_description(string)

    assert len(parsed["matchers"]) == expected_count


def test_lang_splitting():
    desc = Description("en", "dummy.csd")

    string = '''1 some_id
1
# "some description"
lang "German"
1
# "some other description"'''

    split = desc.split_on_lang(string)
    assert split == (
        "1 some_id",
        1,
        {"en": ['# "some description"'], "de": ['# "some other description"']},
    )


def test_lang_splitting_multi_line_descriptions():
    desc = Description("en", "dummy.csd")

    string = '''1 some_id
1
# "some description\\!line two"
lang "German"
1
# "some other description\\!line two"'''

    split = desc.split_on_lang(string)
    assert split == (
        "1 some_id",
        1,
        {
            "en": ['# "some description\\!line two"'],
            "de": ['# "some other description\\!line two"'],
        },
    )


@pytest.mark.parametrize(
    "line,expected",
    [
        (
            '0 "Take {0} Chaos Damage per Second during Effect" per_minute_to_per_second 1',
            (
                ("0",),
                "Take {0} Chaos Damage per Second during Effect",
                "per_minute_to_per_second 1",
            ),
        ),
        (
            '1 "{0}% increased Attack Speed"',
            (("1",), "{0}% increased Attack Speed", None),
        ),
        (
            '# "Take {0} Chaos Damage per Second during Effect" per_minute_to_per_second 1',
            (
                ("#",),
                "Take {0} Chaos Damage per Second during Effect",
                "per_minute_to_per_second 1",
            ),
        ),
        (
            '1|# "{0}% increased Attack Speed"',
            (("1|#",), "{0}% increased Attack Speed", None),
        ),
        (
            '''# # "Adds {0} to {1} Lightning Damage if you haven't Killed [Recently]"''',
            (
                (
                    "#",
                    "#",
                ),
                "Adds {0} to {1} Lightning Damage if you haven't Killed [Recently]",
                None,
            ),
        ),
        (
            """# 1|# "{1}% increased Movement Speed for {0} seconds on Throwing a Trap" milliseconds_to_seconds 1 canonical_line canonical_stat 2""",
            (
                (
                    "#",
                    "1|#",
                ),
                "{1}% increased Movement Speed for {0} seconds on Throwing a Trap",
                "milliseconds_to_seconds 1 canonical_line canonical_stat 2",
            ),
        ),
    ],
    ids=[
        "one value with flags",
        "one value without flags",
        "one placeholder with flags",
        "one placeholder without flags",
        "two placeholders with flags",
        "two placeholders without flags",
    ],
)
def test_parse_line(line, expected):
    desc = Description("en", "dummy.csd")
    desc.parse_matcher = lambda s: s
    assert desc.parse_line(line) == expected


@pytest.mark.parametrize(
    "matcher,expected",
    [
        ("", ""),
        ("Provides Immunity to Chaos Damage", "Provides Immunity to Chaos Damage"),
        ("Provides Immunity to [Chaos] Damage", "Provides Immunity to Chaos Damage"),
        ("[Evasion|Evasion Rating] is zero", "Evasion Rating is zero"),
        ("Дарует иммунитет к урону [Chaos|хаосом]", "Дарует иммунитет к урону хаосом"),
        ("Provides Immunity to [Chaos Damage", "Provides Immunity to Chaos Damage"),
        ("Provides Immunity to Chaos] Damage", "Provides Immunity to Chaos Damage"),
        ("Your Evasion|Evasion Rating] is zero", "Your Evasion Rating is zero"),
        (
            "Maximum [EnergyShield|Energy Shield is zero",
            "Maximum Energy Shield is zero",
        ),
        (
            "Maximum |Energy Shield] is zero",
            "Maximum Energy Shield is zero",
        ),
    ],
    ids=[
        "Empty case",
        "No attribute tags",
        "Replace attribute tags",
        "Replace attribute tags with spaces",
        "Replace split attribute tags",
        "Replace broken attribute tags 1",
        "Replace broken attribute tags 2",
        "Replace broken attribute tags 3",
        "Replace broken attribute tags 4",
        "Replace missing left side",
    ],
)
def test_parse_matcher_replaces_attribute_tags(matcher, expected):
    desc = Description("en", "dummy.csd")
    assert desc.replace_attribute_tags(matcher) == expected


@pytest.mark.parametrize(
    "matcher,expected",
    [
        ("Provides [Immunity] to [Chaos] Damage", "Provides Immunity to Chaos Damage"),
        (
            "{0}% erhöhte [BuffEffect|Wirkung] von [Curse|Flüchen] auf Euch",
            "{0}% erhöhte Wirkung von Flüchen auf Euch",
        ),
        (
            "[EnergyShieldLeech|Leech] [EnergyShield|Energy Shield] {0}% faster",
            "Leech Energy Shield {0}% faster",
        ),
        ("Provides [Immunity] to [Chaos Damage", "Provides Immunity to Chaos Damage"),
        (
            "[StatGain|Gain] {0}% of maximum Mana as Extra maximum [EnergyShield|Energy Shield]",
            "Gain {0}% of maximum Mana as Extra maximum Energy Shield",
        ),
    ],
    ids=[
        "Replace attribute tags",
        "Replace split attribute tags",
        "Replace attribute tags with spaces",
        "Replace broken attribute tags 1",
        "Replace att tags, start end",
    ],
)
def test_parse_matcher_replaces_multiple_attribute_tags(matcher, expected):
    desc = Description("en", "dummy.csd")
    assert desc.replace_attribute_tags(matcher) == expected


@pytest.mark.parametrize(
    "matcher,expected",
    [
        ("Provides Immunity to Chaos Damage", "Provides Immunity to Chaos Damage"),
        (
            "Area contains Temporal Incursions\\!Temporal Incursion Portals have their direction reversed",
            "Area contains Temporal Incursions\nTemporal Incursion Portals have their direction reversed",
        ),
    ],
    ids=[
        "Doesn't change ones with no newlines",
        "Replaces placeholder with newline",
    ],
)
def test_parse_matcher_replaces_placeholder_newline_chars(matcher, expected):
    desc = Description("en", "dummy.csd")
    desc.replace_attribute_tags = Mock(side_effect=lambda x: x)
    desc.replace_placeholders = Mock(side_effect=lambda x: x)

    assert desc.parse_matcher(matcher) == expected


@pytest.mark.parametrize(
    "matcher,expected",
    [
        (
            "Only affects Passives in Very Small Ring",
            "Only affects Passives in Very Small Ring",
        ),
        ("Area contains {0} Clasped Hands", "Area contains # Clasped Hands"),
        (
            "Players have {0}% chance to summon a pack of Harbinger Monsters on Kill",
            "Players have #% chance to summon a pack of Harbinger Monsters on Kill",
        ),
        (
            "{0:+d} to Intelligence",
            "# to Intelligence",
        ),
        ("{0:+d}% to Fire Resistance", "#% to Fire Resistance"),
        (
            "{:+d}% to Critical Damage Bonus per 100 Maximum Energy Shield on Shield",
            "#% to Critical Damage Bonus per 100 Maximum Energy Shield on Shield",
        ),
        (
            "{0} to {1} Added Physical Damage with Staff Attacks",
            "# to # Added Physical Damage with Staff Attacks",
        ),
        (
            "20% chance to Summon an additional Skeleton with Summon Skeletons",
            "20% chance to Summon an additional Skeleton with Summon Skeletons",
        ),
        (
            "Inflict Corrupted Blood for {1} second on Block, dealing {2}% of\\!your maximum Life as Physical damage per second",
            "Inflict Corrupted Blood for # second on Block, dealing #% of\\!your maximum Life as Physical damage per second",
        ),
        ("+{0} to Level of all {1} Skills", "+# to Level of all # Skills"),
        (
            "Adds %1% to %2% Fire Damage to Spear Attacks",
            "Adds # to # Fire Damage to Spear Attacks",
        ),
        (
            "Enemies you [Attack] have {0}% chance to Reflect {1} to {2} Chaos Damage to you",
            "Enemies you [Attack] have #% chance to Reflect # to # Chaos Damage to you",
        ),
        (
            "Minions can't be Damaged for {} second after being Summoned",
            "Minions can't be Damaged for # second after being Summoned",
        ),
    ],
    ids=[
        "No placeholders",
        "Replace normal",
        "Replace normal(percent)",
        "Replace normal(int)",
        "Replace percent",
        "Replace edge case percent",
        "Replace double",
        "Don't replace const values",
        "Doesn't start with 0 enumerated placeholder",
        "Replace placeholder with plus",
        "Replace bad placeholder",
        "Replace 3 placeholders",
        "Replace only curly braces as placeholder",
    ],
)
def test_replace_placeholders(matcher, expected):
    desc = Description("en", "dummy.csd")
    assert desc.replace_placeholders(matcher) == expected


def test_parse_matcher_calls_properly():
    desc = Description("en", "dummy.csd")
    desc.replace_attribute_tags = Mock(return_value="after_attr")
    desc.replace_placeholders = Mock(return_value="after_placeholders")

    result = desc.parse_matcher("input_line")

    desc.replace_attribute_tags.assert_called_once_with("input_line")
    desc.replace_placeholders.assert_called_once_with("after_attr")
    assert result == "after_placeholders"


def test_load_drops_pre_description_lines(tmp_path):
    from pathlib import Path

    filename = "case_drop_starting_lines.csd"
    src = Path("tests/data/cases") / filename
    dst = tmp_path / filename
    dst.write_text(src.read_text(encoding="utf-8"), encoding="utf-16")

    desc = Description("en", dst.name)
    desc.data_dir = tmp_path

    desc.load()
    assert len(desc.data) == 1


def test_load_only_splits_on_real_descriptions(tmp_path):
    from pathlib import Path

    filename = "case_split_on_real_descriptions.csd"
    src = Path("tests/data/cases") / filename
    dst = tmp_path / filename
    dst.write_text(src.read_text(encoding="utf-8"), encoding="utf-16")

    desc = Description("en", dst.name)
    desc.data_dir = tmp_path

    desc.load()
    assert len(desc.data) == 3
