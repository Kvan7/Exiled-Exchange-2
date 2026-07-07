export const TOMES = [
  "Fire",
  "Cold",
  "Lightning",
  "Tempest",
  "Momentum",
  "Bloodletting",
  "Stone",
  "Adaptive",
  "Arcane",
  "Toxic",
  "Electrocuting",
  "Protective",
  "Cyclonic",
  "Vision",
  "Tidal",
  "Rebirth",
  "Prismatic",
  "Gasp",
  "Moon",
  "Celestial",
  "Opulent",
  "Rage",
  "Wisdom",
  "Sky",
  "Earth",
  "Life",
  "Bond",
  "Ward",
  "Soul",
  "Death",
  "Oath",
  "Time",
  "Power",
];
export const TOME_SIZE_RATIO = 32;
export const TOP_LEFT_TOME_TOP_RATIO = 7;
export const TOP_LEFT_TOME_LEFT_RATIO = 19;
export const TOME_GAP_RATIO = 167.6;
export const RECIPE_TOP_RATIO = 7.1;
export const RECIPE_LEFT_RATIO = 21.1;
export const RECIPE_WIDTH_RATIO = 2.19;
export const RECIPE_HEIGHT_RATIO = 26.6;

export const GENERATED_DIR = "./data/generated/";

export const BG_IMG_NAME =
  "Art@2DArt@UIImages@InGame@Expedition@Tome@TomeRuneBgRegular.png";
export const ACTIVE_BG_IMG_NAME =
  "Art@2DArt@UIImages@InGame@Expedition@Tome@TomeRuneBgActive.png";
export const TOME_IMG_NAME =
  "Art@2DArt@UIImages@InGame@Expedition@Tome@TomeRune{0}.png";
export const ACTIVE_BG_JOINED_NAME = "together.png";
export const PREPROCESSED_TOME_BG = `${GENERATED_DIR}bg.png`;
export const PREPROCESSED_ACTIVE_TOME_BG = `${GENERATED_DIR}active_bg.png`;
export const PREPROCESSED_MATCH_LIST = `${GENERATED_DIR}match_list.png`;

export const NORMAL_TOME_FILTER = {
  hueMax: 120,
  hueAdd: -60,
  saturationAdd: 40,
  valueAdd: 40,
};

export const ACTIVE_TOME_FILTER = {
  hueMax: 180,
  saturationAdd: 40,
};

export const USUAL_SCALES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
export const FINE_TUNE_SCALES = [-15, -10, -5, 0, 5, 10, 15];
export const ULTRA_FINE_TUNE_SCALES = [-3, -2, -1, 0, 1, 2, 3];

export const ROW_TOLERANCE = 2;
export const EXPECTED_SLOP_X = 16;
export const EXPECTED_SLOP_Y = 8;
export const MISSING_TOME_TOLERANCE = 0.5;
