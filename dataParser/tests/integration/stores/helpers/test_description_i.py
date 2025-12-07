import pandas as pd
import pytest

from stores.helpers.description import Description


@pytest.mark.parametrize(
    "file_name,expected",
    [
        ("one_description_test.csd", "one_description_test_integration.json"),
        (
            "one_description_multi_lines_test.csd",
            "one_description_multi_lines_test_integration.json",
        ),
        ("two_description_test.csd", "two_description_test_integration.json"),
        (
            "two_description_one_no_description_test.csd",
            "two_description_test_integration.json",
        ),
        ("case_empty.csd", pytest.raises(ValueError)),
        ("case_only_no_description.csd", pytest.raises(ValueError)),
        (
            "one_description_with_flags_test.csd",
            "one_description_with_flags_test_integration.json",
        ),
        (
            "one_description_multiple_matchers_test.csd",
            "one_description_multiple_matchers_test_integration.json",
        ),
        (
            "case_bleeding_edge_case.csd",
            "case_bleeding_edge_case_integration.json",
        ),
    ],
    ids=[
        "One Description",
        "One Description, Multi Line Data",
        "Two Descriptions",
        "Two Descriptions, One No Description",
        "Empty File",
        "Only No Descriptions",
        "One Description with Flags",
        "One Description, Multiple Matchers",
        "Edge Case, Attacks cannot cause Bleeding",
    ],
)
def test_description_integration_test(tmp_path, file_name, expected):
    from pathlib import Path

    src = Path("tests/data/cases") / file_name
    dst = tmp_path / file_name
    dst.write_text(src.read_text(encoding="utf-8"), encoding="utf-16")

    desc = Description("en", dst.name)
    desc.data_dir = tmp_path

    if isinstance(expected, str):
        desc.load()
        df = desc.to_dataframe()
        print("ACTUAL:")
        print(df.head())
        with open(Path("tests/data/expected") / expected, "r", encoding="utf-8") as f:
            expected_df = pd.read_json(f)
            print("EXPECTED:")
            print(expected_df.head())
            pd.testing.assert_frame_equal(
                df.reset_index(drop=True), expected_df.reset_index(drop=True)
            )
    else:
        with expected:
            desc.load()


def test_description_integration_test_hard(tmp_path):
    from pathlib import Path

    filename = "case_very_hard_encompassing_test.csd"
    src = Path("tests/data/cases") / filename
    dst = tmp_path / filename
    dst.write_text(src.read_text(encoding="utf-8"), encoding="utf-16")

    desc = Description("ko", dst.name)
    desc.data_dir = tmp_path

    desc.load()
    df = desc.to_dataframe()
    print("ACTUAL:")
    print(df.head())
    with open(
        Path("tests/data/expected")
        / "case_very_hard_encompassing_test_integration.json",
        "r",
        encoding="utf-8",
    ) as f:
        expected_df = pd.read_json(f)
        print("EXPECTED:")
        print(expected_df.head())
        pd.testing.assert_frame_equal(
            df.reset_index(drop=True), expected_df.reset_index(drop=True)
        )


def test_description_integration_missing_matchers_edge_case(tmp_path):
    from pathlib import Path

    filename = "case_uneven_lines_per_lang.csd"
    src = Path("tests/data/cases") / filename
    dst = tmp_path / filename
    dst.write_text(src.read_text(encoding="utf-8"), encoding="utf-16")

    desc = Description("ko", dst.name)
    desc.data_dir = tmp_path

    desc.load()
    df = desc.to_dataframe()
    print("ACTUAL:")
    print(df.head())
    with open(
        Path("tests/data/expected")
        / "case_uneven_lines_per_lang_test_integration.json",
        "r",
        encoding="utf-8",
    ) as f:
        expected_df = pd.read_json(f)
        print("EXPECTED:")
        print(expected_df.head())
        pd.testing.assert_frame_equal(
            df.reset_index(drop=True), expected_df.reset_index(drop=True)
        )


def test_description_integration_missing_lang(tmp_path):
    from pathlib import Path

    filename = "case_missing_lang.csd"
    src = Path("tests/data/cases") / filename
    dst = tmp_path / filename
    dst.write_text(src.read_text(encoding="utf-8"), encoding="utf-16")

    desc = Description("ko", dst.name)
    desc.data_dir = tmp_path

    desc.load()

    df = desc.to_dataframe()

    print("ACTUAL:")
    print(df.head())
    with open(
        Path("tests/data/expected") / "case_missing_lang_test_integration.json",
        "r",
        encoding="utf-8",
    ) as f:
        expected_df = pd.read_json(f)
        print("EXPECTED:")
        print(expected_df.head())
        pd.testing.assert_frame_equal(
            df.reset_index(drop=True), expected_df.reset_index(drop=True)
        )
