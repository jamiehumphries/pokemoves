const specialPokemonBaseNames = {
  FARFETCHD: "Farfetch’d",
  FLABEBE: "Flabébé",
  HO_OH: "Ho-Oh",
  MIME_JR: "Mime Jr.",
  MR_MIME: "Mr. Mime",
  NIDORAN_FEMALE: "Nidoran♀",
  NIDORAN_MALE: "Nidoran♂",
  PORYGON_Z: "Porygon-Z",
};

const specialPokemonFormNames = {
  DARMANITAN_GALARIAN_STANDARD: "Galarian",
  MEWTWO_A: "Armoured",
  PIKACHU_FLYING_5TH_ANNIV: "Flying",
  PIKACHU_VS_2019: "Libre",
};

const specialMoveNames = {
  POWER_UP_PUNCH: "Power-Up Punch",
};

function getPokemonName(template) {
  const { pokemonId: id, form } = template;
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
  if (form && form.startsWith("NIDORAN_")) {
    return getDefaultPokemonFormName("NIDORAN", form);
  }
  if (["MEOWSTIC", "INDEEDEE"].includes(id) && form === undefined) {
    return "Male";
  }
  return specialPokemonFormNames[form];
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

function getMoveName(template) {
  const { uniqueId: id } = template;
  return getSpecialMoveName(id) || getDefaultMoveName(id);
}

function getSpecialMoveName(id) {
  if (id.startsWith("WEATHER_BALL")) {
    return "Weather Ball";
  }
  return specialMoveNames[id];
}

function getDefaultMoveName(id) {
  return toSentenceCase(id.replace(/_FAST$/, ""));
}

function toSentenceCase(id) {
  return id
    .split("_")
    .filter((word) => !!word)
    .map((word) => word[0].toUpperCase() + word.substring(1).toLowerCase())
    .join(" ");
}

module.exports = {
  getPokemonName,
  getMoveName,
};
