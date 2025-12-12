from unittest.mock import MagicMock, patch

import pandas as pd
import pytest

from constants.filenames import (
    BLIGHT_CRAFTING_RECIPES,
    BLIGHT_CRAFTING_RESULTS,
    PASSIVE_SKILLS,
)
from constants.known_stats import (
    ALLOCATES_NOTABLE,
    JEWEL_RADIUS_CHANGE,
    JEWEL_RING_RADIUS,
    SUPPORTED_VALUES,
    TIME_LOST_HISTORIC_JEWEL,
    VALUE_TO_DESCRIPTION_ID,
    VALUE_TO_REF,
)
from services.value_converter_service import ValueConverterService


@pytest.mark.parametrize(
    "hash_val,should_call_simple",
    [
        (JEWEL_RADIUS_CHANGE, True),
        (JEWEL_RING_RADIUS, True),
        (ALLOCATES_NOTABLE, True),
        (TIME_LOST_HISTORIC_JEWEL, False),
        (999999, False),
    ],
)
def test_agg_by_hash_calls_simple_or_not(hash_val, should_call_simple):
    with patch.object(ValueConverterService, "get_blight", return_value={}):
        svc = ValueConverterService(lang=MagicMock())
        svc.simple_agg = MagicMock(return_value=pd.DataFrame([{"called": True}]))
        svc.historic_agg = MagicMock(return_value=pd.DataFrame([{"called": True}]))
        df = pd.DataFrame([{"text": "dummy", "value": 1, "type": "x", "id": 123}])
        df.index = [hash_val]

        out = svc.agg_by_hash(df)

        if should_call_simple:
            svc.simple_agg.assert_called_once_with(df)
            assert out.iloc[0]["called"] == True
        else:
            svc.simple_agg.assert_not_called()


def test_simple_agg_notable_blight_lookup():
    mock_blight = {123: ["oil1", "oil2"]}
    with patch.object(ValueConverterService, "get_blight", return_value=mock_blight):
        svc = ValueConverterService(lang=MagicMock())
        df = pd.DataFrame(
            [{"text": "some text", "value": 123, "type": "mod", "id": 42}]
        )
        df.index = [ALLOCATES_NOTABLE]
        out = svc.simple_agg(df)

        expected = pd.DataFrame(
            [
                {
                    "ref": VALUE_TO_REF[ALLOCATES_NOTABLE],
                    "id": VALUE_TO_DESCRIPTION_ID[ALLOCATES_NOTABLE],
                    "hash": ALLOCATES_NOTABLE,
                    "better": 0,
                    "trade": {"ids": {"mod": [42]}, "option": True},
                    "matchers": [
                        {"string": "some text", "value": 123, "oils": ["oil1", "oil2"]}
                    ],
                }
            ]
        )

        pd.testing.assert_frame_equal(out, expected)


def test_convert_value_stats_to_trade_filters_and_transforms():
    supported_hash = list(SUPPORTED_VALUES)[0]
    df = pd.DataFrame(
        [
            {
                "hash": supported_hash,
                "text": "example",
                "value": 100,
                "type": "mod",
                "id": 1,
            }
        ]
    )

    mock_output = pd.DataFrame(
        [
            {
                "ref": "ref1",
                "id": "desc1",
                "hash": supported_hash,
                "better": 1,
                "matchers": [{"string": "example", "value": 100}],
                "trade": {"ids": {"mod": [1]}},
            }
        ]
    )

    with (
        patch.object(ValueConverterService, "get_blight", return_value={}),
        patch.object(ValueConverterService, "agg_by_hash", return_value=mock_output),
    ):
        svc = ValueConverterService(lang=MagicMock())
        out = svc.convert_value_stats_to_trade(df)

        expected = mock_output.copy()
        expected["dp"] = None
        expected["hash"] = expected["hash"].apply(lambda x: [int(x)])
        expected = expected[["ref", "dp", "better", "matchers", "trade", "id", "hash"]]

        pd.testing.assert_frame_equal(
            out.reset_index(drop=True), expected.reset_index(drop=True)
        )


def test_get_blight_correct_output_structure():
    lang = MagicMock()

    passives_df = pd.DataFrame(
        [
            {
                "_index": 1,
                "PassiveSkillGraphId": 101,
                "column_should_be_dropped_1": "x",
            },
            {
                "_index": 2,
                "PassiveSkillGraphId": 102,
                "column_should_be_dropped_1": "y",
            },
        ]
    )

    blight_results_df = pd.DataFrame(
        [
            {"_index": 10, "PassiveSkill": 1, "column_should_be_dropped_2": "a"},
            {"_index": 20, "PassiveSkill": 2, "column_should_be_dropped_2": "b"},
            {"_index": 30, "PassiveSkill": 999, "column_should_be_dropped_2": "z"},
        ]
    )

    blight_recipes_df = pd.DataFrame(
        [
            {
                "BlightCraftingResult": 10,
                "BlightCraftingItems": [1, 2, 3],
                "column_should_be_dropped_3": "m",
            },
            {
                "BlightCraftingResult": 20,
                "BlightCraftingItems": [4, 5, 6],
                "column_should_be_dropped_3": "n",
            },
            {
                "BlightCraftingResult": 999,
                "BlightCraftingItems": [9, 9, 9],
                "column_should_be_dropped_3": "z",
            },
        ]
    )

    game_store_mock = MagicMock()
    game_store_mock.get.side_effect = lambda key: {
        PASSIVE_SKILLS: passives_df,
        BLIGHT_CRAFTING_RESULTS: blight_results_df,
        BLIGHT_CRAFTING_RECIPES: blight_recipes_df,
    }[key]

    with patch(
        "services.value_converter_service.GameStore", return_value=game_store_mock
    ):
        svc = ValueConverterService(lang)
        out = svc.get_blight()

    assert out == {
        101: "1,2,3",
        102: "4,5,6",
    }


def test_agg_by_hash_called_with_grouped_data():
    # Create mock data
    df = pd.DataFrame(
        [
            {
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "text": "example",
                "ref": "example",
                "value": 100,
                "type": "mod",
                "id": "explicit.stat_3418580811",
            },
            {
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "text": "Something else",
                "ref": "Something else",
                "value": 100,
                "type": "mod",
                "id": "explicit.stat_3418580811",
            },
            {
                "hash": ALLOCATES_NOTABLE,
                "text": "Allocates #",
                "ref": "Allocates #",
                "value": 200,
                "type": "mod",
                "id": "explicit.stat_2954116742",
            },
        ]
    )

    mock_return = pd.DataFrame(
        [
            {
                "ref": "ref1",
                "better": 1,
                "matchers": [{"string": "example", "value": 100}],
                "trade": {"ids": {"mod": [1]}},
                "id": "desc1",
                "hash": TIME_LOST_HISTORIC_JEWEL,
            }
        ]
    )

    expected_df1 = df[df["hash"] == TIME_LOST_HISTORIC_JEWEL].set_index("hash")
    expected_df2 = df[df["hash"] == ALLOCATES_NOTABLE].set_index("hash")

    with patch.multiple(
        ValueConverterService,
        agg_by_hash=MagicMock(return_value=mock_return),
        get_blight=MagicMock(return_value={}),
    ):
        svc = ValueConverterService(lang="en")
        svc.convert_value_stats_to_trade(df)

        # Assert agg_by_hash is called twice
        assert svc.agg_by_hash.call_count == 2

        # Check each call's DataFrame
        first_call_df = svc.agg_by_hash.call_args_list[1][0][0]
        second_call_df = svc.agg_by_hash.call_args_list[0][0][0]

        pd.testing.assert_frame_equal(first_call_df, expected_df1)
        pd.testing.assert_frame_equal(second_call_df, expected_df2)


def test_historic_agg_integration():
    # Create mock data
    df = pd.DataFrame(
        [
            {
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "ref": "Remembrancing # songworthy deeds by the line of Vorana\nPassives in radius are Conquered by the Kalguur",
                "text": "Remembrancing # songworthy deeds by the line of Vorana\nPassives in radius are Conquered by the Kalguur",
                "value": 21,
                "type": "mod",
                "id": "explicit.stat_3418580811",
            },
            {
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "ref": "Remembrancing # songworthy deeds by the line of Medved\nPassives in radius are Conquered by the Kalguur",
                "text": "Remembrancing # songworthy deeds by the line of Medved\nPassives in radius are Conquered by the Kalguur",
                "value": 22,
                "type": "mod",
                "id": "explicit.stat_3418580811",
            },
            {
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "ref": "Remembrancing # songworthy deeds by the line of Olroth\nPassives in radius are Conquered by the Kalguur",
                "text": "Remembrancing # songworthy deeds by the line of Olroth\nPassives in radius are Conquered by the Kalguur",
                "value": 23,
                "type": "mod",
                "id": "explicit.stat_3418580811",
            },
            {
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "ref": "Glorifying the defilement of # souls in tribute to Amanamu\nPassives in radius are Conquered by the Abyssals",
                "text": "Glorifying the defilement of # souls in tribute to Amanamu\nPassives in radius are Conquered by the Abyssals",
                "value": 24,
                "type": "mod",
                "id": "explicit.stat_3418580811",
            },
            {
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "ref": "Glorifying the defilement of # souls in tribute to Kulemak\nPassives in radius are Conquered by the Abyssals",
                "text": "Glorifying the defilement of # souls in tribute to Kulemak\nPassives in radius are Conquered by the Abyssals",
                "value": 25,
                "type": "mod",
                "id": "explicit.stat_3418580811",
            },
            {
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "ref": "Glorifying the defilement of # souls in tribute to Kurgal\nPassives in radius are Conquered by the Abyssals",
                "text": "Glorifying the defilement of # souls in tribute to Kurgal\nPassives in radius are Conquered by the Abyssals",
                "value": 26,
                "type": "mod",
                "id": "explicit.stat_3418580811",
            },
            {
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "ref": "Glorifying the defilement of # souls in tribute to Tecrod\nPassives in radius are Conquered by the Abyssals",
                "text": "Glorifying the defilement of # souls in tribute to Tecrod\nPassives in radius are Conquered by the Abyssals",
                "value": 27,
                "type": "mod",
                "id": "explicit.stat_3418580811",
            },
            {
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "ref": "Glorifying the defilement of # souls in tribute to Ulaman\nPassives in radius are Conquered by the Abyssals",
                "text": "Glorifying the defilement of # souls in tribute to Ulaman\nPassives in radius are Conquered by the Abyssals",
                "value": 28,
                "type": "mod",
                "id": "explicit.stat_3418580811",
            },
        ]
    )

    expected_df = pd.DataFrame(
        [
            {
                "ref": "Remembrancing # songworthy deeds by the line of Vorana",
                "id": "local_unique_jewel_alternate_tree_seed",
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "better": 0,
                "matchers": [
                    {
                        "string": "Remembrancing # songworthy deeds by the line of Vorana\nPassives in radius are Conquered by the Kalguur",
                        "advanced": "Remembrancing # songworthy deeds by the line of Vorana(Vorana-Olroth)\nPassives in radius are Conquered by the Kalguur",
                    }
                ],
                "trade": {"ids": {"explicit": ["explicit.stat_3418580811|21"]}},
            },
            {
                "ref": "Remembrancing # songworthy deeds by the line of Medved",
                "id": "local_unique_jewel_alternate_tree_seed",
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "better": 0,
                "matchers": [
                    {
                        "string": "Remembrancing # songworthy deeds by the line of Medved\nPassives in radius are Conquered by the Kalguur",
                        "advanced": "Remembrancing # songworthy deeds by the line of Medved(Vorana-Olroth)\nPassives in radius are Conquered by the Kalguur",
                    }
                ],
                "trade": {"ids": {"explicit": ["explicit.stat_3418580811|22"]}},
            },
            {
                "ref": "Remembrancing # songworthy deeds by the line of Olroth",
                "id": "local_unique_jewel_alternate_tree_seed",
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "better": 0,
                "matchers": [
                    {
                        "string": "Remembrancing # songworthy deeds by the line of Olroth\nPassives in radius are Conquered by the Kalguur",
                        "advanced": "Remembrancing # songworthy deeds by the line of Olroth(Vorana-Olroth)\nPassives in radius are Conquered by the Kalguur",
                    }
                ],
                "trade": {"ids": {"explicit": ["explicit.stat_3418580811|23"]}},
            },
            {
                "ref": "Glorifying the defilement of # souls in tribute to Amanamu",
                "id": "local_unique_jewel_alternate_tree_seed",
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "better": 0,
                "matchers": [
                    {
                        "string": "Glorifying the defilement of # souls in tribute to Amanamu\nPassives in radius are Conquered by the Abyssals",
                        "advanced": "Glorifying the defilement of # souls in tribute to Amanamu(Amanamu-Ulaman)\nPassives in radius are Conquered by the Abyssals",
                    }
                ],
                "trade": {"ids": {"explicit": ["explicit.stat_3418580811|24"]}},
            },
            {
                "ref": "Glorifying the defilement of # souls in tribute to Kulemak",
                "id": "local_unique_jewel_alternate_tree_seed",
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "better": 0,
                "matchers": [
                    {
                        "string": "Glorifying the defilement of # souls in tribute to Kulemak\nPassives in radius are Conquered by the Abyssals",
                        "advanced": "Glorifying the defilement of # souls in tribute to Kulemak(Amanamu-Ulaman)\nPassives in radius are Conquered by the Abyssals",
                    }
                ],
                "trade": {"ids": {"explicit": ["explicit.stat_3418580811|25"]}},
            },
            {
                "ref": "Glorifying the defilement of # souls in tribute to Kurgal",
                "id": "local_unique_jewel_alternate_tree_seed",
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "better": 0,
                "matchers": [
                    {
                        "string": "Glorifying the defilement of # souls in tribute to Kurgal\nPassives in radius are Conquered by the Abyssals",
                        "advanced": "Glorifying the defilement of # souls in tribute to Kurgal(Amanamu-Ulaman)\nPassives in radius are Conquered by the Abyssals",
                    }
                ],
                "trade": {"ids": {"explicit": ["explicit.stat_3418580811|26"]}},
            },
            {
                "ref": "Glorifying the defilement of # souls in tribute to Tecrod",
                "id": "local_unique_jewel_alternate_tree_seed",
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "better": 0,
                "matchers": [
                    {
                        "string": "Glorifying the defilement of # souls in tribute to Tecrod\nPassives in radius are Conquered by the Abyssals",
                        "advanced": "Glorifying the defilement of # souls in tribute to Tecrod(Amanamu-Ulaman)\nPassives in radius are Conquered by the Abyssals",
                    }
                ],
                "trade": {"ids": {"explicit": ["explicit.stat_3418580811|27"]}},
            },
            {
                "ref": "Glorifying the defilement of # souls in tribute to Ulaman",
                "id": "local_unique_jewel_alternate_tree_seed",
                "hash": TIME_LOST_HISTORIC_JEWEL,
                "better": 0,
                "matchers": [
                    {
                        "string": "Glorifying the defilement of # souls in tribute to Ulaman\nPassives in radius are Conquered by the Abyssals",
                        "advanced": "Glorifying the defilement of # souls in tribute to Ulaman(Amanamu-Ulaman)\nPassives in radius are Conquered by the Abyssals",
                    }
                ],
                "trade": {"ids": {"explicit": ["explicit.stat_3418580811|28"]}},
            },
        ]
    )

    with patch.object(ValueConverterService, "get_blight", return_value={}):
        svc = ValueConverterService(lang="en")
        out = svc.historic_agg(df)

        pd.testing.assert_frame_equal(out, expected_df)
