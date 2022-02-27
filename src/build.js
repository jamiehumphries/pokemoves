const crypto = require("crypto");
const fs = require("fs");
const { minify } = require("html-minifier");
const sass = require("node-sass");
const nunjucks = require("nunjucks");
const { join, parse } = require("path");
const UglifyJs = require("uglify-js");

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
const env = nunjucks.configure(views);

function build() {
  const list = buildList();
  const moves = getSimplifiedMoves(list);
  const json = JSON.stringify(moves, null, 2);
  fs.writeFileSync(join(root, "moves.json"), json);

  const css = buildCss();
  const js = buildJs();

  const resources = {
    ...writeCacheBustedFiles("css", css),
    ...writeCacheBustedFiles("js", js),
  };

  const html = buildHtml(list, resources);
  fs.writeFileSync(join(root, "index.html"), html);

  console.log();
  console.log("Build complete.");
}

function buildList() {
  const pokemon = getTemplates("pokemonSettings").map(buildPokemon);
  const moves = getTemplates("combatMove").map(buildMove);
  const getMove = (id) => moves.find((m) => m.id === id);
  const deduplicatedPokemon = deduplicate(pokemon);
  applyMovesetChanges(deduplicatedPokemon, pokemon);
  return deduplicatedPokemon
    .filter(({ name }) => !exclusions.includes(name))
    .filter(({ fastMoveIds }) => !fastMoveIds.includes("STRUGGLE"))
    .map(({ name, types, fastMoveIds, chargedMoveIds }) => {
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
    damage: getMoveDamage(template),
    turns: getMoveTurns(template),
  };
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

function applyMovesetChanges(deduplicatedPokemon) {
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
      changes.add?.forEach((m) => {
        if (moves.has(m)) {
          console.warn(
            "\x1b[33m%s\x1b[0m", // Yellow text.
            `${pokemon.name} already knows ${m}.`
          );
        } else {
          moves.add(m);
        }
      });
      changes.remove?.forEach((m) => moves.delete(m));
      pokemon[movesKey] = [...moves];
    }
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
  const moves = [
    ...(template.cinematicMoves || []),
    ...(template.eliteCinematicMove || []),
  ];
  if (template.shadow) {
    moves.push(template.shadow.purifiedChargeMove);
  }
  return moves;
}

function getTypes(template) {
  return [template.type, template.type2]
    .filter((t) => !!t)
    .map((t) => t.replace(/^POKEMON_TYPE_/, "").toLowerCase());
}

function getMoveEnergy(template) {
  return template.energyDelta;
}

function getMoveDamage(template) {
  return template.power || 0;
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

function getSimplifiedMoves(list) {
  return Object.fromEntries(
    list.map(({ name, counts }) => {
      const moves = [
        ...counts[0].fastMoves.map((f) => f.name),
        ...counts.map((c) => c.chargedMove.name),
      ];
      return [name, moves];
    })
  );
}

function buildCss() {
  const outputStyle = "compressed";
  const transform = (data) => sass.renderSync({ data, outputStyle }).css;
  return buildResources("styles", transform, ".css");
}

function buildJs() {
  const transform = (data) => UglifyJs.minify(data).code;
  return buildResources("scripts", transform);
}

function buildResources(sourceDirName, transform, ext) {
  const sourceDir = join(__dirname, sourceDirName);
  return fs.readdirSync(sourceDir).map((file) => {
    const path = join(sourceDir, file);
    const data = transform(fs.readFileSync(path).toString());
    const newFile = ext ? parse(file).name + ext : file;
    return { file: newFile, data };
  });
}

function writeCacheBustedFiles(destDirName, files) {
  const destDir = join(root, destDirName);
  fs.rmSync(destDir, { recursive: true, force: true });
  fs.mkdirSync(destDir);
  const fileMap = {};
  const webPath = (file) => `/${destDirName}/${file}`;
  for (const { file, data } of files) {
    const { name, ext } = parse(file);
    const hash = crypto.createHash("md5").update(data).digest("hex");
    const cacheBustedFile = `${name}.${hash}${ext}`;
    fs.writeFileSync(join(destDir, cacheBustedFile), data);
    fileMap[webPath(file)] = webPath(cacheBustedFile);
  }
  return fileMap;
}

function buildHtml(list, resources) {
  const lastUpdated = new Date(timestamp).toUTCString();
  const html = nunjucks.render("list.njk", { list, lastUpdated, resources });
  return minify(html, {
    collapseWhitespace: true,
    removeAttributeQuotes: true,
    removeOptionalTags: true,
  });
}

env.addFilter("adjustedDamage", (move, pokemon) => {
  const stabMultiplier = pokemon.types.includes(move.type) ? 1.2 : 1;
  return move.damage * stabMultiplier;
});

build();
