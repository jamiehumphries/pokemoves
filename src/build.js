const fs = require("fs");
const { minify } = require("html-minifier");
const sass = require("node-sass");
const nunjucks = require("nunjucks");
const { join } = require("path");

const { setEq } = require("./helpers/collections");
const { exclusions } = require("./data/adjustments/exclusions");
const { movesetChanges } = require("./data/adjustments/moveset-changes");
const { getPokemonName, getMoveName } = require("./helpers/names");

const gameMaster = require("./data/pokeminers/latest.json");
const timestamp = parseInt(
  fs.readFileSync(join(__dirname, "data/pokeminers/timestamp.txt"))
);

const root = "docs";

const views = join(__dirname, "views");
nunjucks.configure(views);

function build() {
  const { css, cacheBuster } = buildCss();
  const cssRoot = join(root, "css");
  fs.rmdirSync(cssRoot, { recursive: true, force: true });
  fs.mkdirSync(cssRoot);
  fs.writeFileSync(join(cssRoot, `main.${cacheBuster}.css`), css);

  const html = buildHtml(cacheBuster);
  fs.writeFileSync(join(root, "index.html"), html);
}

function buildHtml(cacheBuster) {
  const pokemon = getTemplates("pokemonSettings").map(buildPokemon);
  const moves = getTemplates("combatMove").map(buildMove);
  const list = buildList(pokemon, moves);
  const lastUpdated = new Date(timestamp).toUTCString();
  const html = nunjucks.render("list.njk", { list, lastUpdated, cacheBuster });
  return minify(html, {
    collapseWhitespace: true,
    removeAttributeQuotes: true,
    removeOptionalTags: true,
    minifyJS: true,
  });
}

function buildCss() {
  const file = join(__dirname, "styles", "main.scss");
  const cacheBuster = Math.floor(fs.statSync(file).mtimeMs);
  const { css } = sass.renderSync({
    file: file,
    outputStyle: "compressed",
  });
  return { css, cacheBuster };
}

function getTemplates(property) {
  return gameMaster.map(({ data }) => data[property]).filter((t) => !!t);
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
  const deduplicatedPokemon = deduplicate(pokemon);
  applyMovesetChanges(deduplicatedPokemon, pokemon);
  return deduplicatedPokemon
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

function applyMovesetChanges(deduplicatedPokemon, allPokemonForms) {
  addReturnToPurifiablePokemon(deduplicatedPokemon, allPokemonForms);
  for (const changeset of movesetChanges) {
    const pokemon = deduplicatedPokemon.find(
      (p) => p.name === changeset.pokemonName
    );
    for (const movesKey of ["fastMoveIds", "chargedMoveIds"]) {
      const changes = changeset[movesKey];
      if (!changes) {
        continue;
      }
      const moves = new Set(pokemon[movesKey]);
      changes.add?.forEach((m) => moves.add(m));
      changes.remove?.forEach((m) => moves.delete(m));
      pokemon[movesKey] = [...moves];
    }
  }
}

function addReturnToPurifiablePokemon(deduplicatedPokemon, allPokemonForms) {
  const shadows = allPokemonForms
    .filter((p) => p.name.endsWith(" (Shadow)"))
    .map((p) => p.name.replace(/ \(Shadow\)$/, ""));
  let found = 0;
  for (const p of deduplicatedPokemon) {
    const nonShadowName = p.name.replace(/ \((Normal|Shadow|Purified)\)$/, "");
    if (shadows.includes(nonShadowName)) {
      p.chargedMoveIds.push("RETURN");
      found++;
    }
  }
  if (found !== shadows.length) {
    throw new Error(`Expected ${shadows.length} shadows, but found ${found}.`);
  }
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
    // Only show some of Mew’s fast moves.
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
