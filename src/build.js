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
import { exclusions } from "./data/adjustments/exclusions.js";
import {
  HIDDEN_POWER,
  MEW_FAST_MOVES,
  moveNameFixes,
  RETURN,
  SPLASH,
  STRUGGLE,
} from "./data/adjustments/moves.js";
import { MEW, pokemonNameFixes } from "./data/adjustments/pokemon.js";
import { typeFixes } from "./data/adjustments/types.js";
import { getEffectivenessStages } from "./data/effectivess.js";
import { computeCmp } from "./helpers/cmp.js";
import { setEq } from "./helpers/collections.js";

const src = import.meta.dirname;
const root = "docs";
const views = join(src, "views");
const env = nunjucks.configure(views);

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
  const moves = buildMoves();

  const pokemon = buildPokemon()
    .map(({ name, types, fastMoveIds, chargedMoveIds, stats }) => ({
      name,
      types,
      fastMoveIds: fastMoveIds.sort(fastMoveSort(moves)),
      chargedMoveIds: chargedMoveIds.sort(chargedMoveSort(moves)),
      cmp: computeCmp(stats),
    }))
    .sort((p1, p2) => p1.name.localeCompare(p2.name));

  const counts = buildCounts(pokemon, moves);

  return { pokemon, moves, counts };
}

function buildMoves() {
  const json = readPvpokeJson("moves.json");

  const hiddenPower = Object.assign(
    {},
    json.find((move) => move.moveId.startsWith(HIDDEN_POWER)),
    { moveId: HIDDEN_POWER, name: "Hidden Power", type: "unknown" },
  );

  const entries = json
    .filter((move) => !move.moveId.startsWith(HIDDEN_POWER))
    .concat(hiddenPower)
    .map((data) => [
      data.moveId,
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

  return sortObject(moves);
}

function buildPokemon() {
  const json = readPvpokeJson("pokemon.json").map(({ speciesId, ...props }) => {
    return { id: speciesId.toUpperCase(), ...props };
  });

  const unnecessaryExclusions = exclusions.filter(
    (exclusion) => !json.find((pokemon) => pokemon.id === exclusion),
  );

  for (const exclusion of unnecessaryExclusions) {
    console.warn(`${exclusion} is already excluded`);
  }

  const entries = json
    .filter((data) => !exclusions.includes(data.id))
    .filter((data) => !data.tags?.includes("shadow"))
    .filter((data) => !data.tags?.includes("duplicate"))
    .map((data) => [
      data.id,
      {
        id: data.id,
        dex: data.dex,
        name: data.speciesName,
        types: data.types.filter((type) => type != "none"),
        fastMoveIds: getFastMoveIds(data),
        chargedMoveIds: getChargedMoveIds(data),
        stats: data.baseStats,
      },
    ]);

  const pokemon = Object.fromEntries(entries);
  fixPokemonNames(pokemon);
  fixTypes(pokemon);

  return deduplicate(Object.values(pokemon));
}

function getFastMoveIds(data) {
  if (data.id === MEW) {
    return MEW_FAST_MOVES;
  }

  const fastMoveIds = data.fastMoves
    .map((id) => (id.startsWith(HIDDEN_POWER) ? HIDDEN_POWER : id))
    .map((id) => (id === STRUGGLE ? SPLASH : id));

  return [...new Set(fastMoveIds)];
}

function getChargedMoveIds(data) {
  const chargedMoveIds = data.chargedMoves;
  if (data.tags?.includes("shadoweligible")) {
    chargedMoveIds.push(RETURN);
  }

  return chargedMoveIds;
}

function fastMoveSort(moves) {
  return (m1, m2) => {
    const move1 = moves[m1];
    const move2 = moves[m2];
    return move1.name.localeCompare(move2.name);
  };
}

function chargedMoveSort(moves) {
  return (m1, m2) => {
    const move1 = moves[m1];
    const move2 = moves[m2];
    return move1.energy - move2.energy || move1.name.localeCompare(move2.name);
  };
}

function deduplicate(pokemon) {
  return pokemon.filter((p, i, arr) => {
    return (
      arr.findIndex(({ dex, types, fastMoveIds, chargedMoveIds, stats }) => {
        return (
          dex === p.dex &&
          setEq(types, p.types) &&
          setEq(fastMoveIds, p.fastMoveIds) &&
          setEq(chargedMoveIds, p.chargedMoveIds) &&
          stats.atk === p.stats.atk &&
          stats.def === p.stats.def &&
          stats.hp === p.stats.hp
        );
      }) === i
    );
  });
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

function fixMoveNames(moves) {
  fixNames(moves, moveNameFixes);
}

function fixPokemonNames(pokemon) {
  fixNames(pokemon, pokemonNameFixes);
}

function fixNames(data, fixes) {
  fixProperty("name", data, fixes);
}

function fixTypes(types) {
  fixProperty("types", types, typeFixes);
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

function readPvpokeJson(filename) {
  return JSON.parse(readFileSync(join(src, "data/pvpoke", filename)));
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
    .replaceAll("♂", "-m")
    .replaceAll("♀", "-f")
    .replaceAll(/[^A-Za-z0-9]+/g, "-")
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
