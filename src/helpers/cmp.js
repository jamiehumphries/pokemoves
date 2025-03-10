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

  const { cp, statProduct, attack } = getMaxStats(baseStats, maxCpm);
  const leaguesToCompute = leagues.filter(
    (league) => !league.update(cp, statProduct, attack),
  );

  for (const league of leaguesToCompute) {
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
    const { atk, def, hp } = baseStats;

    for (let level = 1; level <= MAX_LEVEL; level += 0.5) {
      const cpm = getCpmForLevel(level);

      const maxStats = getMaxStats(baseStats, cpm);
      if (this.update(maxStats.cp, maxStats.statProduct, maxStats.attack)) {
        continue;
      }

      const minStats = getMinStats(baseStats, cpm);
      if (minStats.cp > this.cpLimit) {
        return;
      }

      for (let atkIV = 0; atkIV <= MAX_IV; atkIV++) {
        const attack = (atk + atkIV) * cpm;
        for (let defIV = 0; defIV <= MAX_IV; defIV++) {
          const defense = (def + defIV) * cpm;
          const partialCp = calculatePartialCp(attack, defense);
          const partialStatProduct = attack * defense;
          for (let hpIV = 0; hpIV <= MAX_IV; hpIV++) {
            const stamina = (hp + hpIV) * cpm;
            const cp = calculateCpFromPartial(partialCp, stamina);
            const statProduct = partialStatProduct * Math.floor(stamina);
            this.update(cp, statProduct, attack);
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

  toEntry() {
    const key = this.name;
    const value = {
      rankOne: this.attackForMaxStatProduct,
      max: this.maxAttack,
    };
    return [key, value];
  }
}

function getMaxStats(baseStats, cpm) {
  return getConstantIvStats(baseStats, cpm, MAX_IV);
}

function getMinStats(baseStats, cpm) {
  return getConstantIvStats(baseStats, cpm, 0);
}

function getConstantIvStats(baseStats, cpm, iv) {
  const { atk, def, hp } = baseStats;
  const attack = (atk + iv) * cpm;
  const defense = (def + iv) * cpm;
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
