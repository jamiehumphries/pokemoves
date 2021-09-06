const fs = require("fs");
const sass = require("node-sass");
const nunjucks = require("nunjucks");
const { join } = require("path");

const gameMaster = require("./data/latest.json");

const { setEq } = require("./helpers/collections");
const { exclusions } = require("./helpers/exclusions");
const { getPokemonName, getMoveName } = require("./helpers/names");

const root = "docs";

const views = join(__dirname, "views");
nunjucks.configure(views);

function build() {
  const html = buildHtml();
  fs.writeFileSync(join(root, "index.html"), html);
  const css = buildCss();
  fs.writeFileSync(join(root, "css", "main.css"), css);
}

function buildHtml() {
  const pokemon = getTemplates("pokemonSettings").map(buildPokemon);
  const moves = getTemplates("combatMove").map(buildMove);
  const list = buildList(pokemon, moves);
  return nunjucks.render("list.njk", { list });
}

function buildCss() {
  const { css } = sass.renderSync({
    file: join(__dirname, "styles", "main.scss"),
    outputStyle: "compressed",
  });
  return css;
}

function getTemplates(property) {
  return gameMaster
    .filter(({ data }) => data[property])
    .map(({ data }) => data[property]);
}

function buildPokemon(template) {
  return {
    id: template.pokemonId,
    name: getPokemonName(template),
    types: getTypes(template),
    fastMoveIds: getPokemonFastMoveIds(template),
    chargedMoveIds: getPokemonChargedMoveIds(template),
  };
}

function buildMove(template) {
  return {
    id: template.uniqueId,
    name: getMoveName(template),
    type: getTypes(template)[0],
    energy: getMoveEnergy(template),
    turns: getMoveTurns(template),
  };
}

function buildList(pokemon, moves) {
  const getMove = (id) => moves.find((m) => m.id === id);
  return deduplicate(pokemon)
    .filter((p) => {
      return !exclusions.includes(p.name);
    })
    .map((p) => {
      const { name, types, fastMoveIds, chargedMoveIds } = p;
      const fastMoves = fastMoveIds
        .map(getMove)
        .sort((m1, m2) => m1.name.localeCompare(m2.name));
      const chargedMoves = chargedMoveIds
        .map(getMove)
        .sort(
          (m1, m2) => m2.energy - m1.energy || m1.name.localeCompare(m2.name)
        );
      const counts = chargedMoves.map((chargedMove) =>
        buildCounts(chargedMove, fastMoves)
      );
      return { name, types, counts };
    })
    .sort((p1, p2) => p1.name.localeCompare(p2.name));
}

function deduplicate(pokemon) {
  return pokemon.filter((pkm, i, arr) => {
    return (
      arr.findIndex(({ id, fastMoveIds, chargedMoveIds }) => {
        return (
          id === pkm.id &&
          setEq(fastMoveIds, pkm.fastMoveIds) &&
          setEq(chargedMoveIds, pkm.chargedMoveIds)
        );
      }) === i
    );
  });
}

function buildCounts(chargedMove, fastMoves) {
  return {
    chargedMove,
    fastMoves: fastMoves.map((fastMove) => {
      return {
        ...fastMove,
        counts: getCounts(chargedMove, fastMove),
      };
    }),
  };
}

function getPokemonFastMoveIds(template) {
  if (template.pokemonId === "MEW") {
    return [
      "SHADOW_CLAW_FAST",
      "VOLT_SWITCH_FAST",
      "SNARL_FAST",
      "POISON_JAB_FAST",
      "INFESTATION_FAST",
      "DRAGON_TAIL_FAST",
    ];
  }
  return [...(template.quickMoves || []), ...(template.eliteQuickMove || [])];
}

function getPokemonChargedMoveIds(template) {
  return [
    ...(template.cinematicMoves || []),
    ...(template.eliteCinematicMove || []),
    "RETURN",
  ];
}

function getTypes(template) {
  return [template.type, template.type2]
    .filter((t) => !!t)
    .map((t) => t.replace(/^POKEMON_TYPE_/, "").toLowerCase());
}

function getMoveEnergy(template) {
  return template.energyDelta;
}

function getMoveTurns(template) {
  if (!template.uniqueId.endsWith("_FAST")) {
    return undefined;
  }
  return (template.durationTurns || 0) + 1;
}

function getCounts(chargedMove, fastMove) {
  const cost = -chargedMove.energy;
  const gain = fastMove.energy;
  const counts = [];
  let energy = 0;
  for (let n = 1; n <= 4; n++) {
    const count = Math.ceil((cost - energy) / gain);
    counts.push(count);
    energy += count * gain - cost;
  }
  return counts;
}

build();
