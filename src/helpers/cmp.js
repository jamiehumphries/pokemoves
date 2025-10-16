import { getCpmForLevel } from "../data/cpm.js";

const MAX_LEVEL = 51;
const MAX_IV = 15;

const maxCpm = getCpmForLevel(MAX_LEVEL);
const cache = new Map();

export function computeCmp(baseStats) {
  const key = JSON.stringify(baseStats);
  if (cache.has(key)) {
    return cache.get(key);
  }

  const leagues = [
    new League("little", 500),
    new League("great", 1500),
    new League("ultra", 2500),
    new League("master", Infinity),
  ];

  for (const league of leagues) {
    league.compute(baseStats);
  }

  const cmp = Object.fromEntries(leagues.map((league) => league.toEntry()));

  cache.set(key, cmp);
  return cmp;
}

class League {
  constructor(name, cpLimit) {
    this.name = name;
    this.cpLimit = cpLimit;
    this.maxStatProduct = 0;
    this.attackForMaxStatProduct = 0;
    this.maxAttack = 0;
  }

  compute(baseStats) {
    if (this.maxStatsUpdate(baseStats, maxCpm)) return;
    for (let level = 1; level <= MAX_LEVEL; level += 0.5) {
      const cpm = getCpmForLevel(level);
      if (this.maxStatsUpdate(baseStats, cpm)) continue;
      if (!this.minStatsUpdate(baseStats, cpm)) break;
      for (let atkIV = 0; atkIV <= MAX_IV; atkIV++) {
        const attack = (baseStats.atk + atkIV) * cpm;
        if (this.maxStatsUpdate(baseStats, cpm, attack)) continue;
        if (!this.minStatsUpdate(baseStats, cpm, attack)) break;
        for (let defIV = 0; defIV <= MAX_IV; defIV++) {
          const defense = (baseStats.def + defIV) * cpm;
          if (this.maxStatsUpdate(baseStats, cpm, attack, defense)) continue;
          if (!this.minStatsUpdate(baseStats, cpm, attack, defense)) break;
          const partialCp = calculatePartialCp(attack, defense);
          const partialStatProduct = attack * defense;
          for (let hpIV = 1; hpIV < MAX_IV; hpIV++) {
            const stamina = (baseStats.hp + hpIV) * cpm;
            const cp = calculateCpFromPartial(partialCp, stamina);
            const statProduct = partialStatProduct * Math.floor(stamina);
            if (!this.update(cp, statProduct, attack)) break;
          }
        }
      }
    }
  }

  update(cp, statProduct, attack) {
    if (cp > this.cpLimit) {
      return false;
    }
    if (statProduct > this.maxStatProduct) {
      this.maxStatProduct = statProduct;
      this.attackForMaxStatProduct = attack;
    }
    if (attack > this.maxAttack) {
      this.maxAttack = attack;
    }
    return true;
  }

  maxStatsUpdate(baseStats, cpm, attack, defense) {
    const maxStats = getMaxStats(baseStats, cpm, attack, defense);
    return this.update(maxStats.cp, maxStats.statProduct, maxStats.attack);
  }

  minStatsUpdate(baseStats, cpm, attack, defense) {
    const minStats = getMinStats(baseStats, cpm, attack, defense);
    return this.update(minStats.cp, minStats.statProduct, minStats.attack);
  }

  toEntry() {
    const key = this.name;
    const value = {
      rankOne: this.attackForMaxStatProduct,
      max: this.maxAttack,
    };
    return [key, value];
  }
}

function getMaxStats(baseStats, cpm, attack, defense) {
  return getConstantIvStats(baseStats, cpm, MAX_IV, attack, defense);
}

function getMinStats(baseStats, cpm, attack, defense) {
  return getConstantIvStats(baseStats, cpm, 0, attack, defense);
}

function getConstantIvStats(baseStats, cpm, iv, attack, defense) {
  const { atk, def, hp } = baseStats;
  attack ||= (atk + iv) * cpm;
  defense ||= (def + iv) * cpm;
  const stamina = (hp + iv) * cpm;
  const statProduct = attack * defense * Math.floor(stamina);
  const cp = calculateCp(attack, defense, stamina);
  return { cp, statProduct, attack };
}

function calculateCp(attack, defense, stamina) {
  const partialCp = calculatePartialCp(attack, defense);
  return calculateCpFromPartial(partialCp, stamina);
}

function calculatePartialCp(attack, defense) {
  return attack * Math.sqrt(defense);
}

function calculateCpFromPartial(partialCp, stamina) {
  return Math.max(10, Math.floor((partialCp * Math.sqrt(stamina)) / 10));
}
