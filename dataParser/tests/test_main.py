from unittest.mock import patch

from main import main


def test_main_does_not_throw():
    main()


def test_main_pulls():
    with (
        patch("providers.trade_api.TradeApiProvider.pull") as mock_trade_pull,
        patch("providers.game_api.GameDataProvider.run_export") as mock_game_pull,
    ):
        main(pull=True)

        mock_trade_pull.assert_called()
        mock_game_pull.assert_called_once()
