import logging
import os
import subprocess


class GameDataProvider:
    def __init__(self):
        self.vendor_dir: str = os.path.join(
            os.path.dirname(__file__), "../../data/vendor"
        )

    def run_export(self):
        try:
            _ = subprocess.run(
                ["pathofexile-dat"], cwd=self.vendor_dir, check=True, shell=True
            )
            logging.info(f"Exported game data to: {self.vendor_dir}")
        except subprocess.CalledProcessError as e:
            logging.error(f"Game data export failed: {e}")
