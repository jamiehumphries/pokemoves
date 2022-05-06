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
      pokemonName: "Exeggutor (Alolan)",
      chargedMoveIds: {
        add: ["DRACO_METEOR"],
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
      pokemonName: "Latias",
      chargedMoveIds: {
        add: ["MIST_BALL"],
      },
    },
    {
      pokemonName: "Latias (Mega)",
      chargedMoveIds: {
        add: ["MIST_BALL"],
      },
    },
    {
      pokemonName: "Latios",
      chargedMoveIds: {
        add: ["LUSTER_PURGE"],
      },
    },
    {
      pokemonName: "Latios (Mega)",
      chargedMoveIds: {
        add: ["LUSTER_PURGE"],
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
