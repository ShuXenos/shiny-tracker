import React from 'react';
import pokemonList from './pokemon';
import { supabase } from './supabase';

export default function App() {
  const generations = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const [players, setPlayers] = React.useState([]);
  const [tracker, setTracker] = React.useState({});
  const [search, setSearch] = React.useState('');
  const [selectedGeneration, setSelectedGeneration] =
    React.useState('all');

  React.useEffect(() => {
    loadPlayers();
    loadTracker();
  }, []);

  // =========================
  // LOAD PLAYERS
  // =========================

  const loadPlayers = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('id');

    if (error) {
      console.error(error);
      return;
    }

    setPlayers(data || []);
  };

  // =========================
  // LOAD TRACKER
  // =========================

  const loadTracker = async () => {
    const { data, error } = await supabase
      .from('shiny_catches')
      .select('*');

    if (error) {
      console.error(error);
      return;
    }

    const formatted = {};

    pokemonList.forEach((pokemon) => {
      formatted[pokemon.id] = {};
    });

    data.forEach((entry) => {
      formatted[entry.pokemon_id][entry.player_id] =
        true;
    });

    setTracker(formatted);
  };

  // =========================
  // TOGGLE POKEMON
  // =========================

  const togglePokemon = async (
    pokemonId,
    playerId
  ) => {
    const currentlyOwned =
      tracker[pokemonId]?.[playerId] || false;

    // UPDATE LOCAL STATE

    setTracker((prev) => ({
      ...prev,
      [pokemonId]: {
        ...prev[pokemonId],
        [playerId]: !currentlyOwned,
      },
    }));

    // REMOVE

    if (currentlyOwned) {
      const { error } = await supabase
        .from('shiny_catches')
        .delete()
        .eq('pokemon_id', pokemonId)
        .eq('player_id', playerId);

      if (error) {
        console.error(error);
      }
    }

    // ADD

    else {
      const { error } = await supabase
        .from('shiny_catches')
        .insert({
          pokemon_id: pokemonId,
          player_id: playerId,
        });

      if (error) {
        console.error(error);
      }
    }
  };

  // =========================
  // GLOBAL COUNTERS
  // =========================

  const TOTAL_POKEMON = pokemonList.length;

  const getPlayerCount = (playerId) => {
    return Object.values(tracker).filter(
      (p) => p[playerId]
    ).length;
  };

  const getPlayerPercentage = (playerId) => {
    return (
      (getPlayerCount(playerId) /
        TOTAL_POKEMON) *
      100
    ).toFixed(1);
  };

  const uniqueCount = Object.values(tracker).filter(
    (pokemon) =>
      Object.values(pokemon).some(Boolean)
  ).length;

  // =========================
  // GENERATION COUNTERS
  // =========================

  const getGenerationTotal = (generation) => {
    return pokemonList.filter(
      (pokemon) =>
        pokemon.generation === generation
    ).length;
  };

  const getGenerationCount = (
    playerId,
    generation
  ) => {
    return pokemonList.filter(
      (pokemon) =>
        pokemon.generation === generation &&
        tracker[pokemon.id]?.[playerId]
    ).length;
  };

  const getGenerationPercentage = (
    playerId,
    generation
  ) => {
    return (
      (getGenerationCount(
        playerId,
        generation
      ) /
        getGenerationTotal(generation)) *
      100
    ).toFixed(1);
  };

  const getGenerationUniqueCount = (
    generation
  ) => {
    return pokemonList.filter(
      (pokemon) =>
        pokemon.generation === generation &&
        Object.values(
          tracker[pokemon.id] || {}
        ).some(Boolean)
    ).length;
  };

  // =========================
  // FILTERS
  // =========================

  const filteredPokemon = pokemonList.filter(
    (pokemon) => {
      const matchesSearch = pokemon.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesGeneration =
        selectedGeneration === 'all' ||
        pokemon.generation ===
          Number(selectedGeneration);

      return (
        matchesSearch &&
        matchesGeneration
      );
    }
  );

  // =========================
  // RENDER
  // =========================

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            ✨ Shiny Tracker Pokémon
          </h1>

          <p className="text-zinc-400">
            Tracker collaboratif
          </p>
        </div>

        {/* GLOBAL STATS */}

        <div className="grid md:grid-cols-4 gap-4 mb-8">

          {players.map((player) => (
            <div
              key={player.id}
              className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800"
            >
              <h2 className="text-xl font-semibold mb-2">
                {player.name}
              </h2>

              <p
                className="text-3xl font-bold"
                style={{
                  color: player.color,
                }}
              >
                {getPlayerCount(player.id)}
              </p>

              <p className="text-zinc-400 text-sm mt-1">
                Pokémon chromatiques
              </p>

              <div className="mt-4">

                <div className="flex justify-between text-sm mb-1 text-zinc-400">
                  <span>Complétion</span>

                  <span>
                    {getPlayerPercentage(player.id)}%
                  </span>
                </div>

                <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">

                  <div
                    className="h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${getPlayerPercentage(
                        player.id
                      )}%`,
                      backgroundColor:
                        player.color,
                    }}
                  />

                </div>
              </div>
            </div>
          ))}

          {/* UNIQUE */}

          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-5 text-black">

            <h2 className="text-xl font-semibold mb-2">
              Total Unique
            </h2>

            <p className="text-3xl font-bold">
              {uniqueCount}
            </p>

            <p className="text-sm mt-1">
              Shiny uniques du groupe
            </p>
          </div>
        </div>

        {/* GENERATIONS */}

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
                  ✨ {getGenerationUniqueCount(gen)}
                </div>
              </div>

              {players.map((player) => (
                <div
                  key={player.id}
                  className="mb-4"
                >

                  <div className="flex justify-between text-sm">

                    <span>{player.name}</span>

                    <span>
                      {getGenerationCount(
                        player.id,
                        gen
                      )}{' '}
                      /{' '}
                      {getGenerationTotal(gen)}
                    </span>
                  </div>

                  <div className="w-full bg-zinc-800 rounded-full h-2 mt-1">

                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${getGenerationPercentage(
                          player.id,
                          gen
                        )}%`,
                        backgroundColor:
                          player.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* FILTERS */}

        <div className="mb-6 flex flex-col md:flex-row gap-4">

          <input
            type="text"
            placeholder="Rechercher un Pokémon..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3"
          />

          <select
            value={selectedGeneration}
            onChange={(e) =>
              setSelectedGeneration(
                e.target.value
              )
            }
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3"
          >
            <option value="all">
              Toutes les générations
            </option>

            {generations.map((gen) => (
              <option key={gen} value={gen}>
                Génération {gen}
              </option>
            ))}
          </select>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto rounded-2xl border border-zinc-800">

          <table className="w-full border-collapse">

            <thead>
              <tr className="bg-zinc-900 text-left">

                <th className="p-4">#</th>
                <th className="p-4">Sprite</th>
                <th className="p-4">Pokémon</th>

                {players.map((player) => (
                  <th
                    key={player.id}
                    className="p-4 text-center"
                  >
                    {player.name}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>

              {filteredPokemon.map((pokemon) => (
                <tr
                  key={pokemon.id}
                  className="border-t border-zinc-800 hover:bg-zinc-900/50"
                >

                  <td className="p-4 text-zinc-400">
                    {pokemon.id
                      .toString()
                      .padStart(3, '0')}
                  </td>

                  <td className="p-4">
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.id}.png`}
                      alt={pokemon.name}
                      className="w-16 h-16"
                    />
                  </td>

                  <td className="p-4 font-medium">
                    {pokemon.name}
                  </td>

                  {players.map((player) => (
                    <td
                      key={player.id}
                      className="p-4 text-center"
                    >

                      <input
                        type="checkbox"
                        checked={
                          tracker[pokemon.id]?.[
                            player.id
                          ] || false
                        }
                        onChange={() =>
                          togglePokemon(
                            pokemon.id,
                            player.id
                          )
                        }
                        className="w-6 h-6 cursor-pointer"
                        style={{
                          accentColor:
                            player.color,
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}