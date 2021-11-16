// See https://pokemongo.fandom.com/wiki/List_of_legacy_moves
// Plus some adjustments for other known changes, e.g. Techno Blast on Genesect (Burn).
module.exports = {
  movesetChanges: [
    {
      pokemonName: "Chansey",
      chargedMoveIds: {
        add: ["PSYBEAM"],
      },
    },
    {
      pokemonName: "Delibird",
      fastMoveIds: {
        add: ["QUICK_ATTACK_FAST"],
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
      pokemonName: "Genesect (Shock)",
      chargedMoveIds: {
        add: ["TECHNO_BLAST_SHOCK"],
      },
    },
    {
      pokemonName: "Genesect (Burn)",
      chargedMoveIds: {
        add: ["TECHNO_BLAST_BURN"],
      },
    },
    {
      pokemonName: "Genesect (Chill)",
      chargedMoveIds: {
        add: ["TECHNO_BLAST_CHILL"],
      },
    },
    {
      pokemonName: "Genesect (Douse)",
      chargedMoveIds: {
        add: ["TECHNO_BLAST_WATER"],
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
      pokemonName: "Luxray",
      chargedMoveIds: {
        add: ["PSYCHIC_FANGS"],
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
