from unittest.mock import MagicMock, mock_open, patch

from constants.lang import ENGLISH
from providers.trade_api import TradeApiProvider


def test_pull():
    with (
        patch("builtins.open", new_callable=mock_open) as mock_file,
        patch("providers.trade_api.cloudscraper.create_scraper") as mock_create_scraper,
        patch("os.path.join", side_effect=lambda *args: "/".join(args)),
        patch("os.path.dirname", return_value="/fake_dir"),
        patch("logging.info"),
        patch("logging.error"),
        patch("os.path.exists", return_value=True),
    ):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"result": []}

        mock_scraper = MagicMock()
        mock_scraper.get.return_value = mock_response
        mock_create_scraper.return_value = mock_scraper

        provider = TradeApiProvider(ENGLISH)

        provider.pull()

        assert mock_scraper.get.call_count == 4
        mock_file().write.assert_called_with("}")


def test_pull_error_path():
    with (
        patch("builtins.open", new_callable=mock_open),
        patch("providers.trade_api.cloudscraper.create_scraper") as mock_create_scraper,
        patch("os.path.join", side_effect=lambda *args: "/".join(args)),
        patch("os.path.dirname", return_value="/fake_dir"),
        patch("logging.info"),
        patch("logging.error") as mock_log_error,
        patch("os.path.exists", return_value=True),
    ):
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.json.return_value = {}

        mock_scraper = MagicMock()
        mock_scraper.get.return_value = mock_response
        mock_create_scraper.return_value = mock_scraper

        provider = TradeApiProvider(ENGLISH)
        provider.pull()

        assert mock_log_error.call_count == 4
