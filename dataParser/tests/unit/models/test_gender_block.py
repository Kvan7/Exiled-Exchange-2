from models.client_string import ClientString


def test_replace_gender_if_block_when_none():
    ccs = ClientString("", [""])

    my_line = "line"

    assert ccs.replace_gender_if_block(my_line) == "line"


def test_replace_gender_if_block_when_double_curly():
    ccs = ClientString("", [""])

    my_line = "<if:MS>{{Außergewöhnlicher}}<elif:FS>{{Außergewöhnliche}}<elif:NS>{{Außergewöhnliches}}<elif:MP>{{Außergewöhnliche}}<elif:FP>{{Außergewöhnliche}}<elif:NP>{{Außergewöhnliche}}"

    assert ccs.replace_gender_if_block(my_line) == "Außergewöhnliches"


def test_replace_gender_if_block_when_else():
    ccs = ClientString("", [""])

    my_line = "<if:MS>{{Außergewöhnlicher}}<elif:FS>{{Außergewöhnliche}}<elif:FP>{{Außergewöhnliches}}<elif:MP>{{Außergewöhnliche}}<elif:NS>{{Außergewöhnliche}}<else>{{Außergewöhnliche}}"

    assert ccs.replace_gender_if_block(my_line) == "Außergewöhnliche"


def test_replace_gender_if_block_when_single_curly():
    ccs = ClientString("", [""])

    my_line = "<if:MS>{Außergewöhnlicher}<elif:FS>{Außergewöhnliche}<elif:FP>{Außergewöhnliches}<elif:MP>{Außergewöhnliche}<elif:NS>{Außergewöhnliche}<else>{Außergewöhnliche}"

    assert ccs.replace_gender_if_block(my_line) == "Außergewöhnliche"


def test_replace_gender_if_block_when_extra_text():
    ccs = ClientString("", [""])

    my_line = "You must encounter {0} to unlock <if:M>{{him}}<elif:F>{{her}}<elif:O>{{it}}<else>{{them}} in your Hideout."

    assert (
        ccs.replace_gender_if_block(my_line)
        == "You must encounter {0} to unlock it in your Hideout."
    )


def test_replace_gender_if_block_when_placeholder():
    ccs = ClientString("", [""])

    my_line = "<if:MS>{{Außergewöhnlicher}}<elif:FS>{{Außergewöhnliche}}<elif:NS>{{Außergewöhnliches}}<elif:MP>{{Außergewöhnliche}}<elif:FP>{{Außergewöhnliche}}<elif:NP>{{Außergewöhnliche}} {}"

    assert ccs.replace_gender_if_block(my_line) == "Außergewöhnliches {}"
