import fs from 'fs';

const TOTAL_POKEMON = 1025;

function getGeneration(id) {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  if (id <= 649) return 5;
  if (id <= 721) return 6;
  if (id <= 809) return 7;
  if (id <= 905) return 8;
  return 9;
}

async function fetchPokemon() {
  const pokemonList = [];

  for (let i = 1; i <= TOTAL_POKEMON; i++) {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon-species/${i}`
    );

    const data = await response.json();

    const frenchName =
      data.names.find((n) => n.language.name === 'fr')?.name ||
      data.name;

    pokemonList.push({
      id: i,
      name: frenchName,
      generation: getGeneration(i),
    });

    console.log(`Pokémon ${i} récupéré`);
  }

  const output = `const pokemonList = ${JSON.stringify(
    pokemonList,
    null,
    2
  )};

export default pokemonList;
`;

  fs.writeFileSync('./src/pokemon.js', output);

  console.log('pokemon.js généré avec succès !');
}

fetchPokemon();