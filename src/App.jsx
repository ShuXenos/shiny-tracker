import pokemonList from './pokemon';
import React from 'react';
import { supabase } from './supabase';

export default function App() {
  const [players, setPlayers] = React.useState([]);

  const loadPlayers = async () => {
  const { data } = await supabase
    .from('players')
    .select('*');

  setPlayers(data);
};

  const generations = [1, 2, 3, 4, 5, 6, 7, 8, 9];

 

  const [tracker, setTracker] = React.useState({});
  const [search, setSearch] = React.useState('');
  React.useEffect(() => {
  loadPlayers();
  loadTracker();
}, []);
  const [selectedGeneration, setSelectedGeneration] = React.useState('all');

  const loadTracker = async () => {
  const { data, error } = await supabase
    .from('shiny_tracker')
    .select('*');

  if (error) {
    console.error(error);
    return;
  }

  const formatted = {};

  pokemonList.forEach((pokemon) => {
    formatted[pokemon.id] = {
      Alex: false,
      Lolo: false,
      Sky: false,
    };
  });

  data.forEach((entry) => {
    formatted[entry.pokemon_id] = {
      Alex: entry.Alex,
      Lolo: entry.Lolo,
      Sky: entry.Sky,
    };
  });

  setTracker(formatted);
};

const togglePokemon = async (pokemonId, player) => {
  const newValue = !tracker[pokemonId]?.[player];

  setTracker((prev) => ({
    ...prev,
    [pokemonId]: {
      ...prev[pokemonId],
      [player]: newValue,
    },
  }));

  const updatedPokemon = {
    pokemon_id: pokemonId,
    Alex:
      player === 'Alex'
        ? newValue
        : tracker[pokemonId]?.Alex || false,

    Lolo:
      player === 'Lolo'
        ? newValue
        : tracker[pokemonId]?.Lolo || false,

    Sky:
      player === 'Sky'
        ? newValue
        : tracker[pokemonId]?.Sky || false,
  };

  const { error } = await supabase
    .from('shiny_tracker')
    .upsert(updatedPokemon, {
      onConflict: 'pokemon_id',
    });

  if (error) {
    console.error(error);
  }
};

  const TOTAL_POKEMON = pokemonList.length;

  const getPlayerCount = (player) => {
    return Object.values(tracker).filter((p) => p[player]).length;
  };
const getPlayerPercentage = (player) => {
  return ((getPlayerCount(player) / TOTAL_POKEMON) * 100).toFixed(1);
};

const getGenerationCount = (player, generation) => {
  return pokemonList.filter(
    (pokemon) =>
      pokemon.generation === generation &&
      tracker[pokemon.id]?.[player]
  ).length;
};

const getGenerationTotal = (generation) => {
  return pokemonList.filter(
    (pokemon) => pokemon.generation === generation
  ).length;
};

const getGenerationPercentage = (player, generation) => {
  return (
    (getGenerationCount(player, generation) /
      getGenerationTotal(generation)) *
    100
  ).toFixed(1);
};
const getGenerationUniqueCount = (generation) => {
  return pokemonList.filter(
    (pokemon) =>
      pokemon.generation === generation &&
      (
        tracker[pokemon.id]?.Alex ||
        tracker[pokemon.id]?.Lolo ||
        tracker[pokemon.id]?.Sky
      )
  ).length;
};
  const uniqueCount = Object.values(tracker).filter(
    (p) => p.Alex || p.Lolo || p.Sky
  ).length;

  const filteredPokemon = pokemonList.filter((pokemon) => {
  const matchesSearch = pokemon.name
    .toLowerCase()
    .includes(search.toLowerCase());

  const matchesGeneration =
    selectedGeneration === 'all' ||
    pokemon.generation === Number(selectedGeneration);

  return matchesSearch && matchesGeneration;
});

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            ✨ Shiny Tracker Pokémon
          </h1>
          <p className="text-zinc-400">
            Tracker collaboratif pour Alex, Lolo et Sky
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {players.map((player) => (
            <div
              key={player}
              className="bg-zinc-900 rounded-2xl p-5 shadow-lg border border-zinc-800"
            >
              <h2 className="text-xl font-semibold mb-2">{player}</h2>
              <p className="text-3xl font-bold text-yellow-400">
                {getPlayerCount(player)}
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                Pokémon chromatiques
              </p>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1 text-zinc-400">
                  <span>Complétion</span>
                  <span>{getPlayerPercentage(player)}%</span>
                </div>

                <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${getPlayerPercentage(player)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-5 text-black shadow-lg">
            <h2 className="text-xl font-semibold mb-2">
              Total Unique
            </h2>
            <p className="text-3xl font-bold">{uniqueCount}</p>
            <p className="text-sm mt-1">
              Shiny uniques du groupe
            </p>
          </div>
        </div>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {generations.map((gen) => (
              <div
                key={gen}
                className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800"
              >
               <div className="flex justify-between items-center mb-4">
  <h2 className="text-xl font-bold">
    Génération {gen}
  </h2>

  <div className="text-sm text-yellow-400 font-semibold">
    ✨ {getGenerationUniqueCount(gen)} uniques
  </div>
</div>

                {players.map((player) => (
                 <div key={player} className="mb-4">
                    <div className="flex justify-between text-sm">
                      <span>{player}</span>

                      <span>
                       {getGenerationCount(player, gen)} /{' '}
                        {getGenerationTotal(gen)}
                      </span>
                    </div>

                   <div className="w-full bg-zinc-800 rounded-full h-2 mt-1">
                     <div
                       className="bg-yellow-400 h-2 rounded-full"
                       style={{
                          width: `${getGenerationPercentage(player,gen)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        <div className="mb-6 flex flex-col md:flex-row gap-4">
  <input
    type="text"
    placeholder="Rechercher un Pokémon..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
  />

  <select
    value={selectedGeneration}
    onChange={(e) => setSelectedGeneration(e.target.value)}
    className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
  >
    <option value="all">Toutes les générations</option>

    {generations.map((gen) => (
      <option key={gen} value={gen}>
        Génération {gen}
      </option>
    ))}
  </select>
</div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-zinc-900 text-left">
                <th className="p-4">#</th>
                <th className="p-4">Sprite</th>
                <th className="p-4">Pokémon</th>
                {players.map((player) => (
                  <th key={player} className="p-4 text-center">
                    {player}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredPokemon.map((pokemon) => (
                <tr
                  key={pokemon.id}
                  className="border-t border-zinc-800 hover:bg-zinc-900/50 transition"
                >
                  <td className="p-4 text-zinc-400">
                    {pokemon.id.toString().padStart(3, '0')}
                  </td>

                  <td className="p-4">
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.id}.png`}
                      alt={pokemon.name}
                      className="w-16 h-16 image-rendering-pixel"
                    />
                  </td>

                  <td className="p-4 font-medium">
                    {pokemon.name}
                  </td>

                  {players.map((player) => (
                    <td key={player} className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={tracker[pokemon.id]?.[player] || false}
                        onChange={() =>
                          togglePokemon(pokemon.id, player)
                        }
                        className="w-6 h-6 accent-yellow-400 cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <h2 className="text-2xl font-bold mb-3">
            🚀 Améliorations futures
          </h2>

          <ul className="space-y-2 text-zinc-300">
            <li>• Ajout des 1025 Pokémon automatiquement</li>
            <li>• Gestion des formes régionales</li>
            <li>• Filtres avancés</li>
            <li>• Synchronisation entre plusieurs PC</li>
            <li>• Pourcentage du Shiny Dex complété</li>
            <li>• Import / export des sauvegardes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
