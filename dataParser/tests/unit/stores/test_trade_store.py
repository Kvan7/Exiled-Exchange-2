import json

import pandas as pd
import pytest

from stores.trade_store import TradeStore


@pytest.fixture
def mock_trade_data_items(tmp_path, monkeypatch):
    mock_json = {
        "result": [
            {
                "id": "group.id",
                "label": "Group Label",
                "entries": [
                    {"type": "Ruby Ring"},
                    {"type": "prop", "name": "Power", "flags": {"unique": True}},
                ],
            },
            {
                "id": "group2",
                "label": "Group Label 2",
                "entries": [
                    {"type": "Some Item"},
                    {
                        "type": "Key",
                        "text": "My Key",
                        "name": "My",
                        "flags": {"unique": True},
                    },
                ],
            },
        ]
    }

    data_dir = tmp_path / "data" / "json" / "en"
    data_dir.mkdir(parents=True)
    file_path = data_dir / "items.json"
    file_path.write_text(json.dumps(mock_json), encoding="utf-8")

    monkeypatch.setattr("constants.lang.LANG", str)
    monkeypatch.setattr("constants.filenames.ITEMS_JSON", "items.json")

    store = TradeStore("en")
    store.data_dir = str(data_dir)

    return store, pd.DataFrame(
        [
            {
                "id": "group.id",
                "label": "Group Label",
                "type": "Ruby Ring",
                "text": None,
                "name": None,
                "unique": False,
            },
            {
                "id": "group.id",
                "label": "Group Label",
                "type": "prop",
                "text": None,
                "name": "Power",
                "unique": True,
            },
            {
                "id": "group2",
                "label": "Group Label 2",
                "type": "Some Item",
                "text": None,
                "name": None,
                "unique": False,
            },
            {
                "id": "group2",
                "label": "Group Label 2",
                "type": "Key",
                "text": "My Key",
                "name": "My",
                "unique": True,
            },
        ]
    )


def test_items_method(mock_trade_data_items):
    store, expected_df = mock_trade_data_items
    result_df = store.items().reset_index(drop=True)
    pd.testing.assert_frame_equal(result_df, expected_df.reset_index(drop=True))


@pytest.fixture
def mock_trade_data_stats(tmp_path, monkeypatch):
    mock_json = {
        "result": [
            {
                "id": "explicit",
                "label": "Explicit",
                "entries": [
                    {
                        "id": "explicit.stat_1050105434",
                        "text": "# to maximum Mana",
                        "type": "explicit",
                    },
                    {
                        "id": "explicit.stat_3299347043",
                        "text": "# to maximum Life THIS ONE SHOULD BE DROPPED AS DUPLICATE",
                        "type": "explicit",
                    },
                    {
                        "id": "explicit.stat_3372524247",
                        "text": "#% to Fire Resistance",
                        "type": "explicit",
                    },
                    {
                        "id": "explicit.stat_3299347043",
                        "text": "# to maximum Life",
                        "type": "explicit",
                    },
                ],
            },
            {
                "id": "rune",
                "label": "",
                "entries": [
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
                ],
            },
        ]
    }

    data_dir = tmp_path / "data" / "json" / "en"
    data_dir.mkdir(parents=True)
    file_path = data_dir / "stats.json"
    file_path.write_text(json.dumps(mock_json), encoding="utf-8")

    monkeypatch.setattr("constants.lang.LANG", str)
    monkeypatch.setattr("constants.filenames.STATS_JSON", "stats.json")

    store = TradeStore("en")
    store.data_dir = str(data_dir)

    return store, pd.DataFrame(
        [
            {
                "id": "explicit.stat_1050105434",
                "text": "# to maximum Mana",
                "type": "explicit",
            },
            {
                "id": "explicit.stat_3372524247",
                "text": "#% to Fire Resistance",
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


def test_stats_method(mock_trade_data_stats):
    store, expected_df = mock_trade_data_stats
    result_df = store.stats().reset_index(drop=True)
    pd.testing.assert_frame_equal(result_df, expected_df.reset_index(drop=True))


@pytest.fixture
def mock_static_data_stats(tmp_path, monkeypatch):
    mock_json = {
        "result": [
            {
                "id": "Currency",
                "label": "Currency",
                "entries": [
                    {
                        "id": "transmutation-shard",
                        "text": "Transmutation Shard",
                        "image": "/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQ3VycmVuY3lVcGdyYWRlVG9NYWdpY1NoYXJkIiwic2NhbGUiOjEsInJlYWxtIjoicG9lMiJ9XQ/e67bca229b/CurrencyUpgradeToMagicShard.png",
                    },
                ],
            },
            {
                "id": "Fragments",
                "label": "Fragments",
                "entries": [
                    {
                        "id": "breach-splinter",
                        "text": "Breach Splinter",
                        "image": "/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQnJlYWNoL0JyZWFjaHN0b25lU3BsaW50ZXIiLCJzY2FsZSI6MSwicmVhbG0iOiJwb2UyIn1d/4abb17ea8e/BreachstoneSplinter.png",
                    },
                    {
                        "id": "breachstone",
                        "text": "Breachstone",
                        "image": "/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQnJlYWNoL0JyZWFjaHN0b25lIiwic2NhbGUiOjEsInJlYWxtIjoicG9lMiJ9XQ/d60587d724/Breachstone.png",
                    },
                    {
                        "id": "simulacrum-splinter",
                        "text": "Simulacrum Splinter",
                        "image": "/gen/image/WzI4LDE0LHsiZiI6IjJESXRlbXMvTWFwcy9EZWxpcml1bVNwbGludGVyIiwic2NhbGUiOjEsInJlYWxtIjoicG9lMiJ9XQ/296e6ffc57/DeliriumSplinter.png",
                    },
                ],
            },
        ]
    }

    data_dir = tmp_path / "data" / "json" / "en"
    data_dir.mkdir(parents=True)
    file_path = data_dir / "static.json"
    file_path.write_text(json.dumps(mock_json), encoding="utf-8")

    monkeypatch.setattr("constants.lang.LANG", str)
    monkeypatch.setattr("constants.filenames.STATIC_JSON", "static.json")

    store = TradeStore("en")
    store.data_dir = str(data_dir)

    return store, pd.DataFrame(
        [
            {
                "type": "Currency",
                "tradeTag": "transmutation-shard",
                "text": "Transmutation Shard",
                "image": "/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQ3VycmVuY3lVcGdyYWRlVG9NYWdpY1NoYXJkIiwic2NhbGUiOjEsInJlYWxtIjoicG9lMiJ9XQ/e67bca229b/CurrencyUpgradeToMagicShard.png",
            },
            {
                "type": "Fragments",
                "tradeTag": "breach-splinter",
                "text": "Breach Splinter",
                "image": "/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQnJlYWNoL0JyZWFjaHN0b25lU3BsaW50ZXIiLCJzY2FsZSI6MSwicmVhbG0iOiJwb2UyIn1d/4abb17ea8e/BreachstoneSplinter.png",
            },
            {
                "type": "Fragments",
                "tradeTag": "breachstone",
                "text": "Breachstone",
                "image": "/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQnJlYWNoL0JyZWFjaHN0b25lIiwic2NhbGUiOjEsInJlYWxtIjoicG9lMiJ9XQ/d60587d724/Breachstone.png",
            },
            {
                "type": "Fragments",
                "tradeTag": "simulacrum-splinter",
                "text": "Simulacrum Splinter",
                "image": "/gen/image/WzI4LDE0LHsiZiI6IjJESXRlbXMvTWFwcy9EZWxpcml1bVNwbGludGVyIiwic2NhbGUiOjEsInJlYWxtIjoicG9lMiJ9XQ/296e6ffc57/DeliriumSplinter.png",
            },
        ]
    )


def test_static_method(mock_static_data_stats):
    store, expected_df = mock_static_data_stats
    result_df = store.static().reset_index(drop=True)
    pd.testing.assert_frame_equal(result_df, expected_df.reset_index(drop=True))
