const specialPokemonBaseNames = {
  BRUTEBONNET: "Brute Bonnet",
  CHIENPAO: "Chien-Pao",
  CHIYU: "Chi-Yu",
  FARFETCHD: "Farfetch’d",
  FLABEBE: "Flabébé",
  FLUTTERMANE: "Flutter Mane",
  GOUGINGFIRE: "Gouging Fire",
  GREATTUSK: "Great Tusk",
  HAKAMO_O: "Hakamo-o",
  HO_OH: "Ho-Oh",
  IRONBOULDER: "Iron Boulder",
  IRONBUNDLE: "Iron Bundle",
  IRONCROWN: "Iron Crown",
  IRONHANDS: "Iron Hands",
  IRONJUGULIS: "Iron Jugulis",
  IRONLEAVES: "Iron Leaves",
  IRONMOTH: "Iron Moth",
  IRONTHORNS: "Iron Thorns",
  IRONTREADS: "Iron Treads",
  IRONVALIANT: "Iron Valiant",
  JANGMO_O: "Jangmo-o",
  KOMMO_O: "Kommo-o",
  MIME_JR: "Mime Jr.",
  MR_MIME: "Mr. Mime",
  MR_RIME: "Mr. Rime",
  NIDORAN_FEMALE: "Nidoran♀",
  NIDORAN_MALE: "Nidoran♂",
  PORYGON_Z: "Porygon-Z",
  RAGINGBOLT: "Raging Bolt",
  ROARINGMOON: "Roaring Moon",
  SANDYSHOCKS: "Sandy Shocks",
  SCREAMTAIL: "Scream Tail",
  SIRFETCHD: "Sirfetch’d",
  SLITHERWING: "Slither Wing",
  TINGLU: "Ting-Lu",
  TYPE_NULL: "Type: Null",
  WALKINGWAKE: "Walking Wake",
  WOCHIEN: "Wo-Chien",
};

const specialPokemonFormNames = {
  DARMANITAN_GALARIAN_STANDARD: "Galarian",
  EISCUE_NOICE: "Noice Face",
  GOURGEIST_AVERAGE: "Average Size",
  GOURGEIST_LARGE: "Large Size",
  GOURGEIST_SUPER: "Super Size",
  MEWTWO_A: "Armoured",
  MINIOR_BLUE: "Core",
  ORICORIO_PAU: "Pa’u",
  ORICORIO_POMPOM: "Pom-Pom",
  PIKACHU_DOCTOR: "Ph.D.",
  PIKACHU_FLYING_01: "Flying",
  PIKACHU_FLYING_5TH_ANNIV: "Flying",
  PIKACHU_GOFEST_2022: "Shaymin Scarf",
  PIKACHU_VS_2019: "Libre",
  PUMPKABOO_AVERAGE: "Average Size",
  PUMPKABOO_LARGE: "Large Size",
  PUMPKABOO_SUPER: "Super Size",
  ZACIAN_HERO: "Hero of Many Battles",
  ZAMAZENTA_HERO: "Hero of Many Battles",
  ZYGARDE_COMPLETE_TEN_PERCENT: "10%",
};

const defaultPokemonFormNames = {
  CHERRIM: "Overcast",
  EISCUE: "Ice Face",
  ENAMORUS: "Incarnate",
  GIRATINA: "Altered",
  GOURGEIST: "Small Size",
  HOOPA: "Confined",
  INDEEDEE: "Male",
  LANDORUS: "Incarnate",
  LYCANROC: "Midday",
  MEOWSTIC: "Male",
  MORPEKO: "Full Belly",
  OINKOLOGNE: "Male",
  ORICORIO: "Baile",
  PALAFIN: "Zero",
  PUMPKABOO: "Small Size",
  SILVALLY: "Normal",
  TORNADUS: "Incarnate",
  THUNDURUS: "Incarnate",
  WISHIWASHI: "Solo",
  ZYGARDE: "50%",
};

const specialMoveNames = {
  FUTURESIGHT: "Future Sight",
  LOCK_ON_FAST: "Lock-On",
  MYST_FIRE: "Mystical Fire",
  NATURES_MADNESS: "Nature’s Madness",
  POWER_UP_PUNCH: "Power-Up Punch",
  ROAR_OF_TIME: "Roar of Time",
  SUPER_POWER: "Superpower",
  V_CREATE: "V-create",
  VICE_GRIP: "Vise Grip",
  X_SCISSOR: "X-Scissor",
};

const multipleVersionMoveIds = [
  "AURA_WHEEL",
  "HYDRO_PUMP",
  "SCALD",
  "TECHNO_BLAST",
  "WATER_GUN_FAST",
  "WEATHER_BALL",
  "WRAP",
];

export function pvpokeNameFix(moves) {
  for (const [id, name] of Object.entries(specialMoveNames)) {
    const move = moves[id];
    if (!move) {
      continue;
    }
    moves[id].name = name;
  }

  for (const multiId of multipleVersionMoveIds) {
    for (const [id, move] of Object.entries(moves)) {
      if (id.startsWith(multiId)) {
        move.name = getSpecialMoveName(multiId) || getDefaultMoveName(multiId);
      }
    }
  }
}

export function getPokemonName(template) {
  const id = template.pokemonId.toString();
  const form = template.form?.toString();
  const baseName = getPokemonBaseName(id);
  const formName = getPokemonFormName(id, form);
  return formName ? `${baseName} (${formName})` : baseName;
}

function getPokemonBaseName(id) {
  return getPokemonSpecialBaseName(id) || getPokemonDefaultBaseName(id);
}

function getPokemonSpecialBaseName(id) {
  return specialPokemonBaseNames[id];
}

function getPokemonDefaultBaseName(id) {
  return toSentenceCase(id);
}

function getPokemonFormName(id, form) {
  return (
    getSpecialPokemonFormName(id, form) || getDefaultPokemonFormName(id, form)
  );
}

function getSpecialPokemonFormName(id, form) {
  return form ? specialPokemonFormNames[form] : defaultPokemonFormNames[id];
}

function getDefaultPokemonFormName(id, form) {
  if (!form) {
    return undefined;
  }
  const formPart = form.replace(`${id}_`, "");
  if (formPart === "ALOLA") {
    return "Alolan";
  }
  return toSentenceCase(formPart);
}

export function getMoveName(template) {
  const id = template.vfxName.toUpperCase();
  return getSpecialMoveName(id) || getDefaultMoveName(id);
}

function getSpecialMoveName(id) {
  const multipleVersionMoveId = multipleVersionMoveIds.find((moveId) =>
    id.startsWith(`${moveId}_`),
  );
  if (multipleVersionMoveId) {
    return getDefaultMoveName(multipleVersionMoveId);
  }
  return specialMoveNames[id];
}

function getDefaultMoveName(id) {
  return toSentenceCase(id.replace(/_FAST$/, ""));
}

export function getTempEvoName(template, tempEvoTemplate) {
  const pokemonName = getPokemonName(template);
  const evoName = toSentenceCase(
    tempEvoTemplate.tempEvoId.replace(/^TEMP_EVOLUTION_/, ""),
  );
  return `${pokemonName} (${evoName})`;
}

function toSentenceCase(id) {
  return id
    .split("_")
    .filter((word) => !!word)
    .map((word) => word[0].toUpperCase() + word.substring(1).toLowerCase())
    .join(" ");
}
