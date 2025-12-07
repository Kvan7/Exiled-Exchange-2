from unittest.mock import MagicMock, patch

import pandas as pd

from constants.filenames import STAT_DESCRIPTION_FILES
from stores.game_store import GameStore


@patch("stores.game_store.os.path.join")
@patch("stores.game_store.pd.read_json")
def test_get(mock_read_json, mock_path_join):
    mock_path_join.return_value = "/fake/path/file.json"
    mock_df = pd.DataFrame({"col": [1, 2]})
    mock_read_json.return_value = mock_df

    store = GameStore("en")
    result = store.get("some_file.json")

    mock_path_join.assert_called()
    mock_read_json.assert_called_with("/fake/path/file.json")
    pd.testing.assert_frame_equal(result, mock_df)


@patch("stores.game_store.Description")
def test_get_description(mock_description_cls):
    mock_desc = MagicMock()
    mock_df = pd.DataFrame({"desc": ["a", "b"]})
    mock_desc.to_dataframe.return_value = mock_df
    mock_description_cls.return_value = mock_desc

    store = GameStore("en")
    result = store.get_description("desc_file.json")

    mock_desc.load.assert_called()
    mock_desc.to_dataframe.assert_called()
    pd.testing.assert_frame_equal(result, mock_df)


@patch("stores.game_store.GameStore.get_description")
@patch("stores.game_store.STAT_DESCRIPTION_FILES", new=["file1.json", "file2.json"])
def test_get_all_descriptions(mock_get_description):
    # Mock data to simulate the descriptions
    mock_df1 = pd.DataFrame({"desc": ["description1", "description2"]})
    mock_df2 = pd.DataFrame({"desc": ["description3", "description4"]})

    # Set the side effect of the mock to the list of mock DataFrames
    mock_get_description.side_effect = [mock_df1, mock_df2]

    # Create an instance of GameStore
    store = GameStore("en")

    # Call the method under test
    result = store.get_all_descriptions()

    # Concatenate the mock DataFrames to form the expected result
    expected_result = pd.concat([mock_df1, mock_df2])

    # Assert that the result matches the expected DataFrame
    pd.testing.assert_frame_equal(result, expected_result)
