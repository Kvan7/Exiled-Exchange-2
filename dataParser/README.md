# DataStore

Current process to run stuff:

1. Run `npm run fetch-json`
2. Run `npm run get-game-data`
3. Run `npm run run-all`
4. In `renderer` run `npm run make-index-files`

This can all be handled by running `npm run update-data` in the `dataParser` folder.

Before finalising the export, make sure to fetch the images with `dataParser/data/fetchImages.py`. It might take a long time since this fetches directly from POE's Trade Site.
