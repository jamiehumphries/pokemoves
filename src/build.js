const crypto = require("crypto");
const fs = require("fs");
const { minify } = require("html-minifier");
const sass = require("node-sass");
const nunjucks = require("nunjucks");
const { join, parse } = require("path");
const UglifyJs = require("uglify-js");

const { exclusions } = require("./data/adjustments/exclusions");
const { movesetChanges } = require("./data/adjustments/moveset-changes");
const { getEffectivenessStages } = require("./data/type-effectivess");
const { computeCmp } = require("./helpers/cmp");
const { setEq } = require("./helpers/collections");
const {
  getPokemonName,
  getMoveName,
  getTempEvoName,
} = require("./helpers/names");

const gameMaster = require("./data/pokeminers/latest.json");
const timestamp = parseInt(
  fs.readFileSync(join(__dirname, "data/pokeminers/timestamp.txt"))
);

const root = "docs";

const views = join(__dirname, "views");
const env = nunjucks.configure(views);

function build() {
  const data = buildData();
  const json = JSON.stringify({ timestamp, ...data }, null, 2);
  fs.writeFileSync(join(root, "data.json"), json);

  const css = buildCss();
  const js = buildJs();

  const resources = {
    ...writeCacheBustedFiles("css", css),
    ...writeCacheBustedFiles("js", js),
  };

  const html = buildHtml(data, resources);
  fs.writeFileSync(join(root, "index.html"), html);

  console.log();
  console.log("Build complete.");
}

function buildData() {
  const moves = fromEntries(getTemplates("combatMove").map(buildMoveEntry));
  const pokemon = getTemplates("pokemonSettings").flatMap((t) =>
    buildPokemon(t, moves)
  );
  const deduplicatedPokemon = deduplicate(pokemon);
  applyMovesetChanges(deduplicatedPokemon);
  const list = deduplicatedPokemon
    .filter(({ name }) => !exclusions.includes(name))
    .map(({ name, types, fastMoveIds, chargedMoveIds, stats }) => {
      fastMoveIds.sort((m1, m2) => {
        const move1 = moves[m1];
        const move2 = moves[m2];
        return move1.name.localeCompare(move2.name);
      });
      chargedMoveIds.sort((m1, m2) => {
        const move1 = moves[m1];
        const move2 = moves[m2];
        return (
          move2.energy - move1.energy || move1.name.localeCompare(move2.name)
        );
      });
      const cmp = computeCmp(stats);
      return { name, types, fastMoveIds, chargedMoveIds, cmp };
    })
    .sort((p1, p2) => p1.name.localeCompare(p2.name));
  const counts = buildCounts(pokemon, moves);
  return { pokemon: list, moves, counts };
}

function getTemplates(property) {
  return gameMaster.map(({ data }) => data[property]).filter((t) => !!t);
}

function buildPokemon(template, moves) {
  const basePokemon = {
    id: template.pokemonId,
    name: getPokemonName(template),
    types: getTypes(template),
    fastMoveIds: getPokemonFastMoveIds(template).filter((id) => {
      return !!moves[id] && id.endsWith("_FAST");
    }),
    chargedMoveIds: getPokemonChargedMoveIds(template).filter((id) => {
      return !!moves[id] && !id.endsWith("_FAST");
    }),
    stats: template.stats,
  };
  const tempEvoTemplates =
    template.tempEvoOverrides?.filter((t) => !!t.tempEvoId) || [];
  return [
    basePokemon,
    ...tempEvoTemplates.map((tempEvoTemplate) => {
      return Object.assign({}, basePokemon, {
        name: getTempEvoName(template, tempEvoTemplate),
        types: getTypes(tempEvoTemplate),
        stats: tempEvoTemplate.stats,
      });
    }),
  ];
}

function buildMoveEntry(template) {
  const id = template.uniqueId;
  const move = {
    name: getMoveName(template),
    type: getTypes(template)[0],
    energy: getMoveEnergy(template),
    damage: getMoveDamage(template),
    turns: getMoveTurns(template),
  };
  return [id, move];
}

function deduplicate(pokemon) {
  return pokemon.filter((pkm, i, arr) => {
    return (
      arr.findIndex(({ id, types, fastMoveIds, chargedMoveIds, stats }) => {
        return (
          id === pkm.id &&
          setEq(types, pkm.types) &&
          setEq(fastMoveIds, pkm.fastMoveIds) &&
          setEq(chargedMoveIds, pkm.chargedMoveIds) &&
          stats.baseStamina === pkm.stats.baseStamina &&
          stats.baseAttack === pkm.stats.baseAttack &&
          stats.baseDefense === pkm.stats.baseDefense
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

function buildCounts(pokemon, moves) {
  const counts = {};
  for (const p of pokemon) {
    for (const fastMoveId of p.fastMoveIds) {
      const fastMove = moves[fastMoveId];
      if (!counts[fastMoveId]) {
        counts[fastMoveId] = {};
      }
      for (const chargedMoveId of p.chargedMoveIds) {
        if (counts[fastMoveId][chargedMoveId]) {
          continue;
        }
        const chargedMove = moves[chargedMoveId];
        counts[fastMoveId][chargedMoveId] = getCounts(fastMove, chargedMove);
      }
    }
  }
  return fromEntries(
    Object.entries(counts).map(([key, value]) => [
      key,
      fromEntries(Object.entries(value)),
    ])
  );
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
  return [
    template.type,
    template.type2,
    template.typeOverride1,
    template.typeOverride2,
  ]
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

function getCounts(fastMove, chargedMove) {
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

function buildHtml(data, resources) {
  const lastUpdated = new Date(timestamp).toUTCString();
  const html = nunjucks.render("list.njk", { data, resources, lastUpdated });
  return minify(html, {
    collapseWhitespace: true,
    removeAttributeQuotes: true,
    removeOptionalTags: true,
  });
}

function fromEntries(entries) {
  return Object.fromEntries(entries.sort(([m1], [m2]) => m1.localeCompare(m2)));
}

env.addFilter("fixed", (number, digits) => {
  return (+number).toFixed(digits);
});

env.addFilter("adjustedDamage", (move, pokemon) => {
  const stabMultiplier = pokemon.types.includes(move.type) ? 1.2 : 1;
  return move.damage * stabMultiplier;
});

env.addFilter("effectivenessSummary", (damage, type) => {
  return getEffectivenessStages(type)
    .map((n) => {
      const arrows = effectivenessArrows(n);
      const multiplier = 1.6 ** n;
      const effectiveDamage = damage * multiplier;
      const roundedDamage = +effectiveDamage.toFixed(1);
      return `${arrows} ${roundedDamage}`;
    })
    .join(" | ");
});

function effectivenessArrows(n) {
  if (n < 0) {
    return "↓".repeat(-n);
  }
  if (n === 0) {
    return "↔";
  }
  return "↑".repeat(n);
}

build();
