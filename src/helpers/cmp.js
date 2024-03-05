const { getCpmForLevel } = require("../data/cpm");

function computeCmp({ baseAttack, baseDefense, baseStamina }) {
  const leagues = [
    new League("little", 500),
    new League("great", 1500),
    new League("ultra", 2500),
    new League("master", Infinity),
  ];

  for (let attackIV = 0; attackIV <= 15; attackIV++) {
    for (let defenseIV = 0; defenseIV <= 15; defenseIV++) {
      for (let staminaIV = 0; staminaIV <= 15; staminaIV++) {
        for (let level = 1; level <= 51; level += 0.5) {
          const cpm = getCpmForLevel(level);
          const attack = (baseAttack + attackIV) * cpm;
          const defense = (baseDefense + defenseIV) * cpm;
          const stamina = (baseStamina + staminaIV) * cpm;
          const cp = calculateCp(attack, defense, stamina);
          const statProduct = attack * defense * Math.floor(stamina);
          for (const league of leagues) {
            league.update(cp, statProduct, attack);
          }
        }
      }
    }
  }

  return Object.fromEntries(leagues.map((league) => league.toEntry()));
}

class League {
  constructor(name, cpLimit) {
    this.name = name;
    this.cpLimit = cpLimit;
    this.maxStatProduct = 0;
    this.attackForMaxStatProduct = 0;
    this.maxAttack = 0;
  }

  update(cp, statProduct, attack) {
    if (cp > this.cpLimit) {
      return;
    }
    if (statProduct > this.maxStatProduct) {
      this.maxStatProduct = statProduct;
      this.attackForMaxStatProduct = attack;
    }
    if (attack > this.maxAttack) {
      this.maxAttack = attack;
    }
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

function calculateCp(attack, defense, stamina) {
  return Math.max(10, Math.floor((attack * Math.sqrt(defense * stamina)) / 10));
}

module.exports = {
  computeCmp,
};
