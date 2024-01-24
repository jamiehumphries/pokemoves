// See: https://p337.info/pokemongo/pages/legacy-moves/
// Plus some adjustments for other known changes, e.g. Techno Blast on Genesect forms.
module.exports = {
  movesetChanges: [
    {
      pokemonName: "Chansey",
      chargedMoveIds: {
        add: ["PSYBEAM"],
      },
    },
    {
      pokemonName: "Diglett",
      fastMoveIds: {
        add: ["MUD_SHOT_FAST"],
      },
    },
    {
      pokemonName: "Dugtrio",
      fastMoveIds: {
        add: ["MUD_SHOT_FAST"],
      },
    },
    {
      pokemonName: "Gastrodon",
      chargedMoveIds: {
        add: ["EARTHQUAKE"],
      },
    },
    {
      pokemonName: "Genesect",
      chargedMoveIds: {
        add: ["TECHNO_BLAST_NORMAL"],
      },
    },
    {
      pokemonName: "Golem",
      fastMoveIds: {
        add: ["MUD_SHOT_FAST"],
      },
    },
    {
      pokemonName: "Graveler",
      fastMoveIds: {
        add: ["MUD_SHOT_FAST"],
      },
    },
    {
      pokemonName: "Grimer",
      fastMoveIds: {
        add: ["ACID_FAST"],
      },
    },
    {
      pokemonName: "Kirlia",
      chargedMoveIds: {
        add: ["DRAINING_KISS"],
      },
    },
    {
      pokemonName: "Koffing",
      fastMoveIds: {
        add: ["ACID_FAST"],
      },
    },
    {
      pokemonName: "Lileep",
      fastMoveIds: {
        add: ["BULLET_SEED_FAST"],
      },
    },
    {
      pokemonName: "Muk",
      fastMoveIds: {
        add: ["ACID_FAST"],
      },
    },
    {
      pokemonName: "Pichu",
      fastMoveIds: {
        add: ["QUICK_ATTACK_FAST"],
      },
    },
    {
      pokemonName: "Pikachu (GO Fest 2022)",
      chargedMoveIds: {
        add: ["GRASS_KNOT"],
      },
    },
    {
      pokemonName: "Porygon",
      fastMoveIds: {
        add: ["QUICK_ATTACK_FAST"],
      },
    },
    {
      pokemonName: "Pyroar",
      fastMoveIds: {
        remove: ["EMBER_FAST"],
      },
    },
    {
      pokemonName: "Shaymin (Land)",
      fastMoveIds: {
        add: ["MAGICAL_LEAF_FAST"],
      },
    },
    {
      pokemonName: "Shaymin (Sky)",
      fastMoveIds: {
        add: ["MAGICAL_LEAF_FAST"],
      },
    },
    {
      pokemonName: "Starmie",
      fastMoveIds: {
        add: ["QUICK_ATTACK_FAST"],
      },
      chargedMoveIds: {
        add: ["PSYBEAM"],
      },
    },
    {
      pokemonName: "Staryu",
      fastMoveIds: {
        add: ["QUICK_ATTACK_FAST"],
      },
    },
    {
      pokemonName: "Weezing",
      fastMoveIds: {
        add: ["ACID_FAST"],
      },
    },
  ],
};
