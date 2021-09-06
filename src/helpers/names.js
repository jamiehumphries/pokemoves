const specialBaseNames = {
  FARFETCHD: "Farfetch'd",
  FLABEBE: "Flabébé",
  HO_OH: "Ho-Oh",
  MIME_JR: "Mime Jr.",
  MR_MIME: "Mr. Mime",
  NIDORAN_FEMALE: "Nidoran♀",
  NIDORAN_MALE: "Nidoran♂",
  PORYGON_Z: "Porygon-Z",
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
  return specialBaseNames[id];
}

function getPokemonDefaultBaseName(id) {
  return toSentenceCase(id);
}

function getPokemonFormName(id, form) {
  if (!form) {
    return undefined;
  }
  return getSpecialPokemonFormName(form) || getDefaultPokemonFormName(id, form);
}

function getSpecialPokemonFormName(form) {
  if (form && form.startsWith("NIDORAN_")) {
    return getDefaultPokemonFormName("NIDORAN", form);
  }
  return undefined;
}

function getDefaultPokemonFormName(id, form) {
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
  return undefined;
}

function getDefaultMoveName(id) {
  return toSentenceCase(id.replace(/_FAST$/, ""));
}

function toSentenceCase(id) {
  return id
    .split("_")
    .map((word) => {
      if (!word) {
        return "";
      }
      return word[0].toUpperCase() + word.substring(1).toLowerCase();
    })
    .join(" ");
}

module.exports = {
  getPokemonName,
  getMoveName,
};
