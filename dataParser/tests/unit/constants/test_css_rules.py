import pytest

from constants.css_rules import tag_rule


@pytest.mark.parametrize(
    "include,exclude,tags,result",
    [
        (["a"], None, ["a"], True),
        (["a"], None, ["b"], False),
        (["a"], None, ["a", "b"], True),
        (["a"], ["b"], ["a"], True),
        (["a"], ["b"], ["b"], False),
        (["a"], ["b"], ["a", "b"], False),
        (["a"], ["b"], ["a", "c"], True),
        (["a"], ["b"], ["c", "b"], False),
        (["a"], ["b"], ["c", "d"], False),
        (["a"], ["b"], ["c"], False),
        (["a"], ["b"], ["d"], False),
        (["a"], ["b"], [], False),
        (["a", "b"], ["c"], ["a"], False),
        (["a", "b"], ["c"], ["b"], False),
        (["a", "b"], ["c"], ["a", "b"], True),
        (["a", "b"], ["c"], ["a", "c"], False),
        (["a", "b"], ["c"], ["c", "b"], False),
        (["a", "b"], ["c"], ["a", "b", "c"], False),
        (["a"], ["b", "c"], ["a"], True),
        (["a"], ["b", "c"], ["b"], False),
        (["a"], ["b", "c"], ["a", "c"], False),
    ],
)
def test_tag_rule(include, exclude, tags, result):
    assert tag_rule(include, exclude)("ref", hash, tags, id) == result
