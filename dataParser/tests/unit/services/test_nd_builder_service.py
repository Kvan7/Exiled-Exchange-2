from unittest.mock import MagicMock, patch

import pandas as pd
import pytest

from constants.known_stats import TRADE_INVERTED
from services.nd_builder_service import NdBuilderService


def setup_stats_combined_df_tests(ref_df, lang_df):
    service = NdBuilderService("ru", "new")
    mock_ref_trade_store = MagicMock()
    mock_trade_store = MagicMock()
    mock_ref_trade_store.stats.return_value = ref_df
    mock_trade_store.stats.return_value = lang_df
    service.ref_trade_store = mock_ref_trade_store
    service.trade_store = mock_trade_store

    return service


def test_stats_combined_df_full_matches():
    ref_df = pd.DataFrame(
        [
            {
                "id": "explicit.stat_1050105434",
                "text": "# to maximum Mana",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3299347043",
                "text": "# to maximum Life",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3372524247",
                "text": "#% to Fire Resistance",
                "type": "explicit",
            },
            {
                "id": "rune.stat_3523867985",
                "text": "#% increased Armour, Evasion and Energy Shield",
                "type": "rune",
            },
            {
                "id": "rune.stat_1509134228",
                "text": "#% increased Physical Damage",
                "type": "rune",
            },
        ]
    )
    lang_df = pd.DataFrame(
        [
            {
                "id": "explicit.stat_1050105434",
                "text": "# to maximum Mana",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3299347043",
                "text": "# to maximum Life",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3372524247",
                "text": "#% to Fire Resistance",
                "type": "explicit",
            },
            {
                "id": "rune.stat_3523867985",
                "text": "#% increased Armour, Evasion and Energy Shield",
                "type": "rune",
            },
            {
                "id": "rune.stat_1509134228",
                "text": "#% increased Physical Damage",
                "type": "rune",
            },
        ]
    )
    expected = pd.DataFrame(
        [
            {
                "id": "explicit.stat_1050105434",
                "text": "# to maximum Mana",
                "ref": "# to maximum Mana",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3299347043",
                "text": "# to maximum Life",
                "ref": "# to maximum Life",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3372524247",
                "text": "#% to Fire Resistance",
                "ref": "#% to Fire Resistance",
                "type": "explicit",
            },
            {
                "id": "rune.stat_3523867985",
                "text": "#% increased Armour, Evasion and Energy Shield",
                "ref": "#% increased Armour, Evasion and Energy Shield",
                "type": "rune",
            },
            {
                "id": "rune.stat_1509134228",
                "text": "#% increased Physical Damage",
                "ref": "#% increased Physical Damage",
                "type": "rune",
            },
        ]
    )

    service = setup_stats_combined_df_tests(ref_df, lang_df)

    result = service.stats_combined_df()

    pd.testing.assert_frame_equal(result, expected)


def test_stats_combined_df_missing_part_ref():
    ref_df = pd.DataFrame(
        [
            {
                "id": "explicit.stat_1050105434",
                "text": "# to maximum Mana",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3299347043",
                "text": "# to maximum Life",
                "type": "explicit",
            },
            {
                "id": "rune.stat_1509134228",
                "text": "#% increased Physical Damage",
                "type": "rune",
            },
        ]
    )
    lang_df = pd.DataFrame(
        [
            {
                "id": "explicit.stat_1050105434",
                "text": "# to maximum Mana",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3299347043",
                "text": "# to maximum Life",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3372524247",
                "text": "#% to Fire Resistance",
                "type": "explicit",
            },
            {
                "id": "rune.stat_3523867985",
                "text": "#% increased Armour, Evasion and Energy Shield",
                "type": "rune",
            },
            {
                "id": "rune.stat_1509134228",
                "text": "#% increased Physical Damage",
                "type": "rune",
            },
        ]
    )
    expected = pd.DataFrame(
        [
            {
                "id": "explicit.stat_1050105434",
                "text": "# to maximum Mana",
                "ref": "# to maximum Mana",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3299347043",
                "text": "# to maximum Life",
                "ref": "# to maximum Life",
                "type": "explicit",
            },
            {
                "id": "rune.stat_1509134228",
                "text": "#% increased Physical Damage",
                "ref": "#% increased Physical Damage",
                "type": "rune",
            },
        ]
    )

    service = setup_stats_combined_df_tests(ref_df, lang_df)

    result = service.stats_combined_df()

    pd.testing.assert_frame_equal(result, expected)


def test_stats_combined_df_missing_part_lang():
    ref_df = pd.DataFrame(
        [
            {
                "id": "explicit.stat_1050105434",
                "text": "# to maximum Mana",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3299347043",
                "text": "# to maximum Life",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3372524247",
                "text": "#% to Fire Resistance",
                "type": "explicit",
            },
            {
                "id": "rune.stat_3523867985",
                "text": "#% increased Armour, Evasion and Energy Shield",
                "type": "rune",
            },
            {
                "id": "rune.stat_1509134228",
                "text": "#% increased Physical Damage",
                "type": "rune",
            },
        ]
    )
    lang_df = pd.DataFrame(
        [
            {
                "id": "explicit.stat_1050105434",
                "text": "# to maximum Mana",
                "type": "explicit",
            },
            {
                "id": "rune.stat_3523867985",
                "text": "#% increased Armour, Evasion and Energy Shield",
                "type": "rune",
            },
            {
                "id": "rune.stat_1509134228",
                "text": "#% increased Physical Damage",
                "type": "rune",
            },
        ]
    )
    expected = pd.DataFrame(
        [
            {
                "id": "explicit.stat_1050105434",
                "text": "# to maximum Mana",
                "ref": "# to maximum Mana",
                "type": "explicit",
            },
            {
                "id": "rune.stat_3523867985",
                "text": "#% increased Armour, Evasion and Energy Shield",
                "ref": "#% increased Armour, Evasion and Energy Shield",
                "type": "rune",
            },
            {
                "id": "rune.stat_1509134228",
                "text": "#% increased Physical Damage",
                "ref": "#% increased Physical Damage",
                "type": "rune",
            },
        ]
    )

    service = setup_stats_combined_df_tests(ref_df, lang_df)

    result = service.stats_combined_df()

    pd.testing.assert_frame_equal(result, expected)


def test_stats_combined_df_missing_part_both():
    ref_df = pd.DataFrame(
        [
            {
                "id": "explicit.stat_3299347043",
                "text": "# to maximum Life",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3372524247",
                "text": "#% to Fire Resistance",
                "type": "explicit",
            },
            {
                "id": "rune.stat_3523867985",
                "text": "#% increased Armour, Evasion and Energy Shield",
                "type": "rune",
            },
            {
                "id": "rune.stat_1509134228",
                "text": "#% increased Physical Damage",
                "type": "rune",
            },
        ]
    )
    lang_df = pd.DataFrame(
        [
            {
                "id": "explicit.stat_1050105434",
                "text": "# to maximum Mana",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3299347043",
                "text": "# to maximum Life",
                "type": "explicit",
            },
            {
                "id": "rune.stat_3523867985",
                "text": "#% increased Armour, Evasion and Energy Shield",
                "type": "rune",
            },
            {
                "id": "rune.stat_1509134228",
                "text": "#% increased Physical Damage",
                "type": "rune",
            },
        ]
    )
    expected = pd.DataFrame(
        [
            {
                "id": "explicit.stat_3299347043",
                "text": "# to maximum Life",
                "ref": "# to maximum Life",
                "type": "explicit",
            },
            {
                "id": "rune.stat_3523867985",
                "text": "#% increased Armour, Evasion and Energy Shield",
                "ref": "#% increased Armour, Evasion and Energy Shield",
                "type": "rune",
            },
            {
                "id": "rune.stat_1509134228",
                "text": "#% increased Physical Damage",
                "ref": "#% increased Physical Damage",
                "type": "rune",
            },
        ]
    )

    service = setup_stats_combined_df_tests(ref_df, lang_df)

    result = service.stats_combined_df()

    pd.testing.assert_frame_equal(result, expected)


def test_stats_combined_df_correct_sides():
    ref_df = pd.DataFrame(
        [
            {
                "id": "explicit.stat_1050105434",
                "text": "# to maximum Mana",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3299347043",
                "text": "# to maximum Life",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3372524247",
                "text": "#% to Fire Resistance",
                "type": "explicit",
            },
            {
                "id": "rune.stat_3523867985",
                "text": "#% increased Armour, Evasion and Energy Shield",
                "type": "rune",
            },
            {
                "id": "rune.stat_1509134228",
                "text": "#% increased Physical Damage",
                "type": "rune",
            },
        ]
    )
    lang_df = pd.DataFrame(
        [
            {
                "id": "explicit.stat_1050105434",
                "text": "# к максимуму маны",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3299347043",
                "text": "# к максимуму здоровья",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3372524247",
                "text": "#% к сопротивлению огню",
                "type": "explicit",
            },
            {
                "id": "rune.stat_3523867985",
                "text": "#% повышение брони, уклонения и энергетического щита",
                "type": "rune",
            },
            {
                "id": "rune.stat_1509134228",
                "text": "#% увеличение физического урона",
                "type": "rune",
            },
        ]
    )
    expected = pd.DataFrame(
        [
            {
                "id": "explicit.stat_1050105434",
                "text": "# к максимуму маны",
                "ref": "# to maximum Mana",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3299347043",
                "text": "# к максимуму здоровья",
                "ref": "# to maximum Life",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3372524247",
                "text": "#% к сопротивлению огню",
                "ref": "#% to Fire Resistance",
                "type": "explicit",
            },
            {
                "id": "rune.stat_3523867985",
                "text": "#% повышение брони, уклонения и энергетического щита",
                "ref": "#% increased Armour, Evasion and Energy Shield",
                "type": "rune",
            },
            {
                "id": "rune.stat_1509134228",
                "text": "#% увеличение физического урона",
                "ref": "#% increased Physical Damage",
                "type": "rune",
            },
        ]
    )

    service = setup_stats_combined_df_tests(ref_df, lang_df)

    result = service.stats_combined_df()

    pd.testing.assert_frame_equal(result, expected)


def test_valueless_trade_stats_df_filters_value_stats():
    service = setup_stats_combined_df_tests(
        pd.DataFrame(
            [
                {
                    "id": "explicit.stat_1050105434",
                    "text": "# to maximum Mana",
                    "type": "explicit",
                },
                {
                    "id": "explicit.stat_3299347043|1",
                    "text": "# to maximum Life",
                    "type": "explicit",
                },
            ]
        ),
        pd.DataFrame(
            [
                {"id": "explicit.stat_1050105434", "text": "# к максимуму маны"},
                {"id": "explicit.stat_3299347043|1", "text": "# к максимуму здоровья"},
            ]
        ),
    )
    result = service.valueless_trade_stats_df()
    assert all("|" not in i for i in result["id"])


def test_value_trade_stats_df_extracts_hashes():
    service = setup_stats_combined_df_tests(
        pd.DataFrame(
            [
                {
                    "id": "explicit.stat_1050105434|7",
                    "text": "# to maximum Mana",
                    "type": "explicit",
                }
            ]
        ),
        pd.DataFrame(
            [{"id": "explicit.stat_1050105434|7", "text": "# к максимуму маны"}]
        ),
    )
    result = service.value_trade_stats_df()
    assert result.iloc[0]["value"] == "7"
    assert result.iloc[0]["hash"] == 1050105434


def test_clean_up_ndjson_drops_hash_and_sorts():
    service = NdBuilderService("ru", "new")
    df = pd.DataFrame(
        [
            {
                "ref": "b",
                "dp": "",
                "better": None,
                "matchers": [],
                "trade": {},
                "fromAreaMods": None,
                "id": "1",
                "hash": 1,
            },
            {
                "ref": "a",
                "dp": "",
                "better": 0,
                "matchers": [],
                "trade": {},
                "fromAreaMods": None,
                "id": "2",
                "hash": 2,
            },
        ]
    )
    out = service.clean_up_ndjson(df)
    assert list(out["ref"]) == ["a", "b"]
    assert "hash" not in out.columns
    assert out["better"].dtype == int


def test_get_output_ready_trade_stats_calls_methods_in_order():
    service = NdBuilderService("ru", "new")
    service.valueless_trade_stats_df = MagicMock(return_value="valueless")
    service.group_trade_stats = MagicMock(return_value="grouped")
    service.add_hash_to_trade_stats = MagicMock(return_value="hashed")
    service.convert_to_trade_out = MagicMock(return_value="converted")

    result = service.get_output_ready_trade_stats()

    service.valueless_trade_stats_df.assert_called_once()
    service.group_trade_stats.assert_called_once_with("valueless")
    service.add_hash_to_trade_stats.assert_called_once_with("grouped")
    service.convert_to_trade_out.assert_called_once_with("hashed")
    assert result == "converted"


@patch("services.nd_builder_service.MOD_TYPES", ["explicit", "crafted"])
def test_convert_to_trade_out_drops_mod_types_and_builds_trade_dict():
    service = NdBuilderService("ru", "new")
    df = pd.DataFrame(
        [
            {
                "ref": "test",
                "explicit": ["explicit.stat_1"],
                "crafted": ["crafted.stat_2"],
                "hash": [1],
            }
        ]
    )
    result = service.convert_to_trade_out(df)

    assert set(result.columns) == {"ref", "hash", "trade"}
    assert result.iloc[0]["trade"] == {
        "ids": {"explicit": ["explicit.stat_1"], "crafted": ["crafted.stat_2"]}
    }


@patch("services.nd_builder_service.MOD_TYPES", ["explicit", "implicit", "enchant"])
@pytest.mark.parametrize(
    "row_data,expected_ids",
    [
        (
            {"explicit": ["explicit.stat_1"], "implicit": [], "enchant": []},
            {"explicit": ["explicit.stat_1"]},
        ),
        (
            {"explicit": [], "implicit": ["implicit.stat_2"], "enchant": []},
            {"implicit": ["implicit.stat_2"]},
        ),
        (
            {
                "explicit": ["explicit.stat_1"],
                "implicit": ["implicit.stat_2"],
                "enchant": [],
            },
            {"explicit": ["explicit.stat_1"], "implicit": ["implicit.stat_2"]},
        ),
        (
            {
                "explicit": ["explicit.stat_1"],
                "implicit": [],
                "enchant": ["enchant.stat_3"],
            },
            {"explicit": ["explicit.stat_1"], "enchant": ["enchant.stat_3"]},
        ),
        (
            {
                "explicit": ["explicit.stat_1"],
                "implicit": ["implicit.stat_2"],
                "enchant": ["enchant.stat_3"],
            },
            {
                "explicit": ["explicit.stat_1"],
                "implicit": ["implicit.stat_2"],
                "enchant": ["enchant.stat_3"],
            },
        ),
    ],
)
def test_convert_to_trade_out_various_mod_type_combinations(row_data, expected_ids):
    service = NdBuilderService("ru", "new")
    row_data["ref"] = "x"
    row_data["hash"] = [1]
    df = pd.DataFrame([row_data])
    result = service.convert_to_trade_out(df)
    assert result.iloc[0]["trade"] == {"ids": expected_ids}


@patch("services.nd_builder_service.MOD_TYPES", ["explicit", "crafted"])
def test_add_hash_to_trade_stats_extracts_hashes_correctly():
    service = NdBuilderService("ru", "new")
    df = pd.DataFrame(
        [
            {
                "ref": "x",
                "explicit": ["explicit.stat_111", "explicit.stat_222"],
                "crafted": ["crafted.stat_333"],
            }
        ]
    )
    result = service.add_hash_to_trade_stats(df)
    assert result["hash"].tolist() == [[111, 222, 333]]


@patch("services.nd_builder_service.MOD_TYPES", ["explicit", "enchant", "crafted"])
def test_group_trade_stats_pivots_and_fills_correctly():
    service = NdBuilderService("ru", "new")
    df = pd.DataFrame(
        [
            {
                "id": "explicit.stat_1",
                "text": "text1",
                "ref": "Ref Text A",
                "type": "explicit",
            },
            {
                "id": "enchant.stat_2",
                "text": "text2",
                "ref": "Ref Text A",
                "type": "enchant",
            },
            {
                "id": "crafted.stat_3",
                "text": "text3",
                "ref": "Ref Text B",
                "type": "crafted",
            },
        ]
    )
    result = service.group_trade_stats(df)[["ref", "explicit", "enchant", "crafted"]]
    print(result)

    expected = pd.DataFrame(
        [
            {
                "ref": "Ref Text A",
                "explicit": ["explicit.stat_1"],
                "enchant": ["enchant.stat_2"],
                "crafted": [],
            },
            {
                "ref": "Ref Text B",
                "explicit": [],
                "enchant": [],
                "crafted": ["crafted.stat_3"],
            },
        ]
    )
    print(expected)
    pd.testing.assert_frame_equal(
        result.sort_values("ref").reset_index(drop=True),
        expected.sort_values("ref").reset_index(drop=True),
        check_names=False,
    )


def test_value_trade_stats_df_extracts_values_and_hashes():
    service = NdBuilderService("ru", "new")
    service.stats_combined_df = MagicMock(
        return_value=pd.DataFrame(
            [
                {
                    "id": "explicit.stat_123456|10",
                    "text": "x",
                    "ref": "y",
                    "type": "explicit",
                },
                {"id": "rune.stat_654321|99", "text": "a", "ref": "b", "type": "rune"},
                {
                    "id": "explicit.stat_111111",
                    "text": "z",
                    "ref": "w",
                    "type": "explicit",
                },
            ]
        )
    )

    result = service.value_trade_stats_df()

    expected = pd.DataFrame(
        [
            {
                "id": "explicit.stat_123456",
                "text": "x",
                "ref": "y",
                "type": "explicit",
                "value": "10",
                "hash": 123456,
            },
            {
                "id": "rune.stat_654321",
                "text": "a",
                "ref": "b",
                "type": "rune",
                "value": "99",
                "hash": 654321,
            },
        ]
    )

    pd.testing.assert_frame_equal(
        result.sort_values("id").reset_index(drop=True),
        expected.sort_values("id").reset_index(drop=True),
    )


def test_valueless_trade_stats_df_filters_out_value_stats():
    service = NdBuilderService("ru", "new")
    service.stats_combined_df = MagicMock(
        return_value=pd.DataFrame(
            [
                {
                    "id": "explicit.stat_123|5",
                    "text": "a",
                    "ref": "b",
                    "type": "explicit",
                },
                {
                    "id": "explicit.stat_456",
                    "text": "c",
                    "ref": "d",
                    "type": "explicit",
                },
                {"id": "rune.stat_789", "text": "e", "ref": "f", "type": "rune"},
            ]
        )
    )

    result = service.valueless_trade_stats_df()

    expected = pd.DataFrame(
        [
            {"id": "explicit.stat_456", "text": "c", "ref": "d", "type": "explicit"},
            {"id": "rune.stat_789", "text": "e", "ref": "f", "type": "rune"},
        ]
    )

    pd.testing.assert_frame_equal(
        result.sort_values("id").reset_index(drop=True),
        expected.sort_values("id").reset_index(drop=True),
    )


def test_stats_combined_df_joins_and_renames_correctly_with_extraneous_columns():
    service = NdBuilderService("ru", "new")
    service.ref_trade_store.stats = lambda: pd.DataFrame(
        [
            {"id": "stat_1", "text": "Ref Text A", "type": "explicit", "extra": "x"},
            {"id": "stat_2", "text": "Ref Text B", "type": "rune", "extra": "y"},
        ]
    )
    service.trade_store.stats = lambda: pd.DataFrame(
        [
            {"id": "stat_1", "text": "User Text A", "type": "explicit", "extra": "1"},
            {"id": "stat_2", "text": "User Text B", "type": "rune", "extra": "2"},
        ]
    )

    result = service.stats_combined_df()

    expected = pd.DataFrame(
        [
            {
                "id": "stat_1",
                "text": "User Text A",
                "ref": "Ref Text A",
                "type": "explicit",
            },
            {
                "id": "stat_2",
                "text": "User Text B",
                "ref": "Ref Text B",
                "type": "rune",
            },
        ]
    )

    pd.testing.assert_frame_equal(result.reset_index(drop=True), expected)


@patch("services.nd_builder_service.TRADE_INVERTED", {111111})
def test_add_trade_inverted_marks_inverted_correctly():
    service = NdBuilderService("ru", "new")
    df = pd.DataFrame(
        [
            {"ref": "a", "trade": {}, "hash": [111111]},
            {"ref": "b", "trade": {}, "hash": [222222]},
            {"ref": "c", "trade": {}, "hash": []},
        ]
    )

    result = service.add_trade_inverted(df)

    expected = pd.DataFrame(
        [
            {"ref": "a", "trade": {"inverted": True}, "hash": [111111]},
            {"ref": "b", "trade": {}, "hash": [222222]},
            {"ref": "c", "trade": {}, "hash": []},
        ]
    )

    pd.testing.assert_frame_equal(
        result.reset_index(drop=True), expected.reset_index(drop=True)
    )


def test_join_trade_and_descriptions_merges_and_groups_correctly():
    service = NdBuilderService("ru", "new")
    trade_stats_df = pd.DataFrame(
        [
            {
                "ref": "Ref A",
                "trade": {"ids": {"explicit": ["explicit.stat_1"]}},
                "id": "explicit.stat_1",
                "hash": [100, 200],
            },
            {
                "ref": "Ref B",
                "trade": {"ids": {"rune": ["rune.stat_2"]}},
                "id": "rune.stat_2",
                "hash": [300],
            },
            {
                "ref": "Ref C",
                "trade": {"ids": {"crafted": ["crafted.stat_3"]}},
                "id": "crafted.stat_3",
                "hash": [400, 500],
            },
        ]
    )
    desc_df = pd.DataFrame(
        [
            {"hash": 100, "dp": None, "extra": 1, "matchers": [{"string": "m1"}]},
            {
                "hash": 200,
                "dp": None,
                "extra": 2,
                "matchers": [{"string": "m2", "negate": True}, {"string": "m2+"}],
            },
            {"hash": 300, "dp": True, "extra": 3, "matchers": [{"string": "m3"}]},
            {
                "hash": 400,
                "dp": None,
                "extra": 11,
                "matchers": [
                    {"string": "a1"},
                    {"string": "a1-", "negate": True},
                ],
            },
            {
                "hash": 500,
                "dp": None,
                "extra": 11,
                "matchers": [
                    {"string": "a1"},
                    {"string": "a1-b", "negate": True},
                ],
            },
        ]
    )

    result = service.join_trade_and_descriptions(trade_stats_df, desc_df)

    expected = pd.DataFrame(
        [
            {
                "ref": "Ref A",
                "trade": {"ids": {"explicit": ["explicit.stat_1"]}},
                "id": "explicit.stat_1",
                "hash": [100, 200],
                "dp": None,
                "extra": 1,
                "matchers": [
                    {"string": "m1"},
                    {"string": "m2", "negate": True},
                    {"string": "m2+"},
                ],
            },
            {
                "ref": "Ref B",
                "trade": {"ids": {"rune": ["rune.stat_2"]}},
                "id": "rune.stat_2",
                "hash": [300],
                "dp": True,
                "extra": 3,
                "matchers": [{"string": "m3"}],
            },
            {
                "ref": "Ref C",
                "trade": {"ids": {"crafted": ["crafted.stat_3"]}},
                "id": "crafted.stat_3",
                "hash": [400, 500],
                "dp": None,
                "extra": 11,
                "matchers": [
                    {"string": "a1"},
                    {"string": "a1-", "negate": True},
                    {"string": "a1-b", "negate": True},
                ],
            },
        ]
    )

    print("result")
    print(result.to_csv())
    print("expected")
    print(expected.to_csv())

    pd.testing.assert_frame_equal(
        result.sort_values("ref").reset_index(drop=True),
        expected.sort_values("ref").reset_index(drop=True),
        check_like=True,
    )
