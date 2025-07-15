export const RETURN = "RETURN";

export const moveNameFixes = {
  // Special characters
  LOCK_ON: "Lock-On",
  NATURES_MADNESS: "Nature’s Madness",
  V_CREATE: "V-create",

  // Multiple types
  ...multipleTypes(
    "TECHNO_BLAST",
    ["BURN", "CHILL", "DOUSE", "NORMAL", "SHOCK"],
    "Techno Blast",
  ),
  ...multipleTypes(
    "WEATHER_BALL",
    ["FIRE", "ICE", "NORMAL", "ROCK", "WATER"],
    "Weather Ball",
  ),

  // Hidden Power
  HIDDEN_POWER_BUG: "Hidden Power",
};

export const moveTypeFixes = {
  // Hidden Power
  HIDDEN_POWER_BUG: "hidden",
};

function multipleTypes(prefix, suffixes, name) {
  return Object.fromEntries(
    suffixes.map((suffix) => [`${prefix}_${suffix}`, name]),
  );
}
