import { createHash } from "crypto";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { minify as minifyHtml } from "html-minifier-terser";
import nunjucks from "nunjucks";
import { join, parse } from "path";
import { compileString as compileSassString } from "sass";
import { minify as minifyJs } from "uglify-js";
import { moveExclusions } from "./data/adjustments/moves/exclusions.js";
import {
  moveNameFixes,
  moveTypeFixes,
  RETURN,
} from "./data/adjustments/moves/fixes.js";
import { pokemonExclusions } from "./data/adjustments/pokemon/exclusions.js";
import {
  pokemonNameFixes,
  pokemonTypeFixes,
} from "./data/adjustments/pokemon/fixes.js";
import { getEffectivenessStages } from "./data/effectivess.js";
import { computeCmp } from "./helpers/cmp.js";
import { setEq } from "./helpers/collections.js";

const src = import.meta.dirname;
const root = "docs";
const views = join(src, "views");
const env = nunjucks.configure(views);

const movesJson = readMoves();
const pokemonJson = readPokemon();
const rankingsJson = readRankings();

const MAX_FAST_MOVES = 6;

async function build() {
  const data = buildData();

  const json = JSON.stringify(data, null, 2);
  writeFileSync(join(root, "data.json"), json);

  const css = buildCss();
  const js = buildJs();

  const resources = {
    ...writeCacheBustedFiles("css", css),
    ...writeCacheBustedFiles("js", js),
  };

  const html = await buildHtml(data, resources);
  writeFileSync(join(root, "index.html"), html);

  console.log();
  console.log("Build complete.");
}

function buildData() {
  const timeLabel = "Build data";
  console.time(timeLabel);
  const moves = buildMoves();
  const pokemon = buildPokemon(moves);
  const counts = buildCounts(pokemon, moves);
  console.timeEnd(timeLabel);
  return { pokemon, moves, counts };
}

function buildMoves() {
  const entries = movesJson.map((data) => [
    data.id,
    {
      name: data.name,
      type: data.type,
      energy: data.energy,
      energyGain: data.energyGain,
      power: data.power,
      turns: data.cooldown / 500,
    },
  ]);

  const moves = Object.fromEntries(entries);
  fixMoveNames(moves);
  fixMoveTypes(moves);

  return sortObject(moves);
}

function fixMoveNames(moves) {
  fixProperty("name", moves, moveNameFixes);
}

function fixMoveTypes(moves) {
  fixProperty("type", moves, moveTypeFixes);
}

function buildPokemon(moves) {
  const entries = deduplicate(pokemonJson).map((data) => [
    data.id,
    {
      name: data.speciesName,
      types: data.types.filter((type) => type !== "none"),
      ...getFastMoveIds(data, moves),
      chargedMoveIds: getChargedMoveIds(data, moves),
      cmp: computeCmp(data.baseStats),
    },
  ]);

  const pokemon = Object.fromEntries(entries);
  fixPokemonNames(pokemon);
  fixPokemonTypes(pokemon);

  return Object.values(pokemon).sort((p1, p2) =>
    p1.name.localeCompare(p2.name),
  );
}

function fixPokemonNames(pokemon) {
  fixProperty("name", pokemon, pokemonNameFixes);
}

function fixPokemonTypes(pokemon) {
  fixProperty("types", pokemon, pokemonTypeFixes);
}

function deduplicate(pokemon) {
  return pokemon.filter((p, i, arr) => {
    return (
      arr.findIndex(({ dex, types, fastMoves, chargedMoves, baseStats }) => {
        return (
          dex === p.dex &&
          setEq(types, p.types) &&
          setEq(fastMoves, p.fastMoves) &&
          setEq(chargedMoves, p.chargedMoves) &&
          baseStats.atk === p.baseStats.atk &&
          baseStats.def === p.baseStats.def &&
          baseStats.hp === p.baseStats.hp
        );
      }) === i
    );
  });
}

function getFastMoveIds(data, moves) {
  const allFastMoveIds = data.fastMoves.filter(
    (id) => !moveExclusions.includes(id),
  );

  const truncate = allFastMoveIds.length > MAX_FAST_MOVES;
  if (truncate) {
    allFastMoveIds.sort(fastMoveSortByRanking(data));
  }

  const fastMoveIds = allFastMoveIds
    .slice(0, MAX_FAST_MOVES)
    .sort(fastMoveSortByName(moves));

  return { fastMoveIds, fastMovesTruncated: truncate || undefined };
}

function fastMoveSortByRanking(data) {
  const rankedPokemon = rankingsJson.find((p) => p.id === data.id);
  if (!rankedPokemon) {
    console.warn(`Could not rank fast moves for ${data.id}`);
    return () => 0;
  }

  const fastMoveRankings = rankedPokemon.moves.fastMoves;
  return (m1, m2) => {
    const ranking1 = fastMoveRankings.find((r) => r.moveId === m1);
    const ranking2 = fastMoveRankings.find((r) => r.moveId === m2);
    return ranking2.uses - ranking1.uses;
  };
}

function fastMoveSortByName(moves) {
  return (m1, m2) => {
    const move1 = moves[m1];
    const move2 = moves[m2];
    return move1.name.localeCompare(move2.name);
  };
}

function getChargedMoveIds(data, moves) {
  return data.chargedMoves
    .filter((id) => !moveExclusions.includes(id))
    .concat(data.tags?.includes("shadoweligible") ? [RETURN] : [])
    .sort(chargedMoveSortByName(moves));
}

function chargedMoveSortByName(moves) {
  return (m1, m2) => {
    const move1 = moves[m1];
    const move2 = moves[m2];
    return move1.energy - move2.energy || move1.name.localeCompare(move2.name);
  };
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

  for (const [fastMoveId, chargedMoveCounts] of Object.entries(counts)) {
    counts[fastMoveId] = sortObject(chargedMoveCounts);
  }

  return sortObject(counts);
}

function getCounts(fastMove, chargedMove) {
  const cost = chargedMove.energy;
  const gain = fastMove.energyGain;

  if (gain === 0) {
    return [-1];
  }

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
  const style = "compressed";
  const transform = (data) => compileSassString(data, { style }).css;
  return buildResources("styles", transform, ".css");
}

function buildJs() {
  const transform = (data) => minifyJs(data).code;
  return buildResources("scripts", transform);
}

function buildResources(sourceDirName, transform, ext) {
  const sourceDir = join(src, sourceDirName);
  return readdirSync(sourceDir)
    .filter((file) => file !== "eslint.config.mjs")
    .map((file) => {
      const path = join(sourceDir, file);
      const data = transform(readFileSync(path).toString());
      const newFile = ext ? parse(file).name + ext : file;
      return { file: newFile, data };
    });
}

function writeCacheBustedFiles(destDirName, files) {
  const destDir = join(root, destDirName);
  rmSync(destDir, { recursive: true, force: true });
  mkdirSync(destDir);

  const fileMap = {};
  const webPath = (file) => `/${destDirName}/${file}`;
  for (const { file, data } of files) {
    const { name, ext } = parse(file);
    const hash = createHash("md5").update(data).digest("hex");
    const cacheBustedFile = `${name}.${hash}${ext}`;
    writeFileSync(join(destDir, cacheBustedFile), data);
    fileMap[webPath(file)] = webPath(cacheBustedFile);
  }

  return fileMap;
}

function buildHtml(data, resources) {
  const html = nunjucks.render("list.njk", { data, resources });
  return minifyHtml(html, {
    collapseWhitespace: true,
    removeAttributeQuotes: true,
    removeOptionalTags: true,
  });
}

function readMoves() {
  return readJson("moves.json", "moveId", moveExclusions);
}

function readPokemon() {
  return readJson("pokemon.json", "speciesId", pokemonExclusions)
    .filter((data) => !data.tags?.includes("shadow"))
    .filter((data) => !data.tags?.includes("duplicate"));
}

function readRankings() {
  const idProp = "speciesId";
  return [
    ...readJson("rankings-10000.json", idProp),
    ...readJson("rankings-2500.json", idProp),
    ...readJson("rankings-1500.json", idProp),
    ...readJson("rankings-500.json", idProp),
  ];
}

function readJson(filename, idProperty, exclusions = []) {
  const path = join(src, "data/pvpoke", filename);
  const json = JSON.parse(readFileSync(path)).map((data) => {
    const id = data[idProperty].toUpperCase();
    return { ...data, id };
  });

  const unnecessaryExclusions = exclusions.filter(
    (exclusion) => !json.find((data) => data.id === exclusion),
  );

  for (const exclusion of unnecessaryExclusions) {
    console.warn(`${exclusion} is already excluded`);
  }

  return json.filter((data) => !exclusions.includes(data.id));
}

function fixProperty(property, data, fixes) {
  for (const [id, newValue] of Object.entries(fixes)) {
    const object = data[id];
    if (!object) {
      console.warn(`Could not find ${id} when trying to fix ${property}`);
      continue;
    }

    const oldValueJson = JSON.stringify(object[property]);
    const newValueJson = JSON.stringify(newValue);
    if (oldValueJson === newValueJson) {
      console.warn(`${id} already has correct ${property} (${oldValueJson})`);
      continue;
    }

    object[property] = newValue;
  }
}

function sortObject(object) {
  const entries = Object.entries(object);
  const sortedEntries = entries.sort(([k1], [k2]) => k1.localeCompare(k2));
  return Object.fromEntries(sortedEntries);
}

env.addFilter("fixed", (number, digits) => {
  return (+number).toFixed(digits);
});

env.addFilter("adjustedPower", (move, pokemon) => {
  const stabMultiplier = pokemon.types.includes(move.type) ? 1.2 : 1;
  return move.power * stabMultiplier;
});

env.addFilter("effectivenessSummary", (power, type) => {
  return getEffectivenessStages(type)
    .map((n) => {
      const arrows = effectivenessArrows(n);
      const multiplier = 1.6 ** n;
      const effectivePower = power * multiplier;
      const roundedPower = +effectivePower.toFixed(1);
      return `${arrows} ${roundedPower}`;
    })
    .join(" | ");
});

env.addFilter("id", (pokemon) => {
  return pokemon.name
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .replaceAll("♂", "-m")
    .replaceAll("♀", "-f")
    .replaceAll(" ", "-")
    .replaceAll(/[^A-Za-z0-9-]+/g, "")
    .replaceAll(/(?:^-|-$)/g, "")
    .toLowerCase();
});

function effectivenessArrows(n) {
  if (n < 0) {
    return "↓".repeat(-n);
  }
  if (n > 0) {
    return "↑".repeat(n);
  }
  return "↔";
}

await build();
