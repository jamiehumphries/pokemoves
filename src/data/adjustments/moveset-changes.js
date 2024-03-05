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
      pokemonName: "Grimer",
      fastMoveIds: {
        add: ["ACID_FAST"],
      },
    },
    {
      pokemonName: "Koffing",
      fastMoveIds: {
        add: ["ACID_FAST"],
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
      pokemonName: "Pikachu (Shaymin Scarf)",
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
