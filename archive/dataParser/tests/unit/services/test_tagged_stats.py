from unittest.mock import MagicMock, patch

import pandas as pd
import pytest

from constants.filenames import MODS, STAT_DESCRIPTIONS, STATS, TAGS
from services.tagged_stats import TaggedStats


def test_get_trade_stats_returns_correctly():
    nd = MagicMock()
    nd.add_hash_to_trade_stats = MagicMock(
        return_value=pd.DataFrame(
            [
                {"ref": "a", "hash": [1], "column": ["value"]},
                {"ref": "b", "hash": [2], "column": ["text"]},
                {"ref": "c", "hash": [3, 4], "column": ["apple"]},
                {"ref": "d", "hash": [], "column": ["value"]},
            ]
        )
    )
    service = TaggedStats()
    service.nd = nd
    result = service.get_trade_stats()

    expected = pd.DataFrame(
        [
            {"ref": "a", "hash": 1},
            {"ref": "b", "hash": 2},
            {"ref": "c", "hash": 3},
            {"ref": "c", "hash": 4},
        ]
    )

    pd.testing.assert_frame_equal(result, expected)


def mock_get(filename: str):
    if filename == MODS:
        return pd.DataFrame(
            [
                {
                    "_index": 0,
                    "Id": "Something1",
                    "ImplicitTags": [1, 5],
                    "Stat1": 1,
                    "Stat2": 2,
                    "Stat3": None,
                    "Stat4": None,
                    "Stat5": None,
                    "Stat6": None,
                },
                {
                    "_index": 0,
                    "Id": "Yarn",
                    "ImplicitTags": [],
                    "Stat1": 8,
                    "Stat2": None,
                    "Stat3": None,
                    "Stat4": None,
                    "Stat5": None,
                    "Stat6": None,
                },
            ]
        )
    elif filename == TAGS:
        return pd.DataFrame(
            [
                {"_index": 0, "Id": "Physical"},
                {"_index": 1, "Id": "Attack"},
                {"_index": 2, "Id": "Critical"},
                {"_index": 3, "Id": "Defense"},
                {"_index": 4, "Id": "Elemental"},
                {"_index": 5, "Id": "Fire"},
            ]
        )
    elif filename == STATS:
        return pd.DataFrame(
            [
                {"_index": 0, "Id": "some_stat_id"},
                {"_index": 1, "Id": "added_to_attacks_min"},
                {"_index": 2, "Id": "added_to_attacks_max"},
                {"_index": 3, "Id": "accuracy"},
                {"_index": 4, "Id": "defense"},
                {"_index": 5, "Id": "barn"},
                {"_index": 6, "Id": "purple"},
                {"_index": 7, "Id": "resistance_%"},
                {"_index": 8, "Id": "%_increased"},
            ]
        )


def test_get_stats_with_tags():
    game_store = MagicMock()
    game_store.get = mock_get
    ts = TaggedStats()
    ts.game_store = game_store

    result = ts.get_stats_with_tags()

    expected = pd.DataFrame(
        [
            {"Stat": 1, "Tags": ["Attack", "Fire"]},
            {"Stat": 8, "Tags": []},
            {"Stat": 2, "Tags": ["Attack", "Fire"]},
        ]
    ).set_index("Stat", drop=True)

    pd.testing.assert_frame_equal(result, expected)


def test_get_stat_by_hash():
    game_store = MagicMock()
    game_store.get = mock_get
    game_store.get_description = MagicMock(
        return_value=pd.DataFrame(
            [
                {"id": "some_stat_id", "hash": 8888},
                {"id": "added_to_attacks_min", "hash": 9999},
                {"id": "testing", "hash": 2002},
                {"id": "resistance_%", "hash": 1000},
                {"id": "%_increased", "hash": 1001},
            ]
        )
    )
    ts = TaggedStats()
    ts.game_store = game_store

    result = ts.get_stat_by_hash()

    expected = pd.DataFrame(
        [
            {"_index": 0, "id": "some_stat_id", "hash": 8888},
            {"_index": 1, "id": "added_to_attacks_min", "hash": 9999},
            {"_index": 7, "id": "resistance_%", "hash": 1000},
            {"_index": 8, "id": "%_increased", "hash": 1001},
        ]
    ).set_index("_index", drop=True)

    pd.testing.assert_frame_equal(result, expected)
