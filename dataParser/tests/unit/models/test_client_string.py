from constants.lang import ENGLISH
from models.client_string import ClientString


def test_copy_client_string():
    ccs = ClientString("KEY_VALUE", ["text2"])

    def get(x):
        return "test"

    assert ccs.string(get, ENGLISH) == "  // [text2]\n  KEY_VALUE: 'test',"
