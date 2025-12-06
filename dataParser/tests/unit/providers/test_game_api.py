from subprocess import CalledProcessError
from unittest.mock import patch

from providers.game_api import GameDataProvider


@patch("subprocess.run")
@patch("os.path.dirname", return_value="/fake_dir")
@patch("logging.info")
def test_run_export_success(mock_log, mock_dirname, mock_run):
    GameDataProvider().run_export()
    mock_run.assert_called_once_with(
        ["pathofexile-dat"], cwd="/fake_dir\\../../data/vendor", check=True, shell=True
    )
    mock_log.assert_called_once()


@patch("logging.error")
@patch("subprocess.run", side_effect=CalledProcessError(1, "pathofexile-dat"))
@patch("os.path.dirname", return_value="/fake_dir")
def test_run_export_failure(mock_dirname, mock_run, mock_log):
    GameDataProvider().run_export()
    mock_log.assert_called_once()
