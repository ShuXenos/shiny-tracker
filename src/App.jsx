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

  const [recentShinies, setRecentShinies] =
    React.useState([]);
  const [visibleCount, setVisibleCount] = React.useState(3);
  const [hasMoreShinies, setHasMoreShinies] = React.useState(false);

  React.useEffect(() => {
    loadPlayers();
    loadTracker();
  }, []);

  React.useEffect(() => {
    loadRecentShinies();
  }, [visibleCount]);

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
    const formatted = {};

    pokemonList.forEach((pokemon) => {
      formatted[pokemon.id] = {};
    });

    let allData = [];
    let from = 0;
    const pageSize = 500;

    while (true) {
      const { data, error } = await supabase
        .from('shiny_catches')
        .select('pokemon_id, player_id')
        .order('pokemon_id', { ascending: true })
        .order('player_id', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('Erreur chargement Shiny :', error);
        return;
      }

      allData = [...allData, ...(data || [])];

      if (!data || data.length < pageSize) {
        break;
      }

      from += pageSize;
    }

    allData.forEach((entry) => {
      if (!formatted[entry.pokemon_id]) {
        formatted[entry.pokemon_id] = {};
      }

      formatted[entry.pokemon_id][entry.player_id] = true;
    });

    setTracker(formatted);
  };



  // =========================
  // LOAD RECENT SHINIES
  // =========================

  const loadRecentShinies = async () => {
    const { data, error } = await supabase
      .from('shiny_catches')
      .select('*')
      .order('obtained_at', { ascending: false })
      .limit(visibleCount + 1);

    if (error) {
      console.error(error);
      return;
    }

    setHasMoreShinies((data || []).length > visibleCount);
    setRecentShinies((data || []).slice(0, visibleCount));
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

  if (currentlyOwned) {
    const { error } = await supabase
      .from('shiny_catches')
      .delete()
      .eq('pokemon_id', pokemonId)
      .eq('player_id', playerId);

    if (error) {
      console.error(error);
    } else {
      loadRecentShinies();
    }
  } else {
    const { error } = await supabase
      .from('shiny_catches')
      .insert({
        pokemon_id: pokemonId,
        player_id: playerId,
        obtained_at: new Date().toISOString(),
      });

    if (error) {
      console.error(error);
    } else {
      loadRecentShinies();
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

        <div className="mb-10 text-center">
          <h1 
            className="flex flex-wrap items-center justify-center gap-4 text-4xl md:text-6xl font-black"
            style={{
              fontFamily: '"Pokemon Solid", sans-serif',
              color: '#FFCB05',
              WebkitTextStroke: '2px #2A75BB',
              textShadow: '3px 4px 0px #1D3F78',
              lineHeight: '1.8',
              margin: 0,
            }}
          >
            <img
              src="/pokeball.svg"
              alt="Poké Ball"
              className="w-12 h-12 md:w-16 md:h-16"
            />

            
            <span>Shiny Tracker Pokémon</span>
          </h1>

          <p className="text-zinc-400 text-lg mt-2">
            Si sa brille pas, DEHOOOORS!
          </p>
        </div>


<div className="mb-8 bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
  <h2 className="text-2xl font-bold mb-4">
    🏆 Derniers shiny obtenus
  </h2>

  {recentShinies.length === 0 ? (
    <p className="text-zinc-400">
      Aucun shiny enregistré.
    </p>
  ) : (
    <div className="space-y-3">
      {recentShinies.map((entry) => {
        const pokemon = pokemonList.find(
          (p) => p.id === entry.pokemon_id
        );

        const player = players.find(
          (p) => p.id === entry.player_id
        );

        return (
          <div
            key={`${entry.player_id}-${entry.pokemon_id}-${entry.obtained_at}`}
            className="flex items-center justify-between bg-zinc-800 rounded-xl p-3"
          >
            <div className="flex items-center gap-3">
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${entry.pokemon_id}.png`}
                alt={pokemon?.name}
                className="w-12 h-12"
              />

              <div>
                <div className="font-semibold">
                  {pokemon?.name}
                </div>

                <div
                  className="text-sm font-semibold"
                  style={{
                    color: player?.color,
                  }}
                >
                  {player?.name}
                </div>
              </div>
            </div>

            <div className="text-sm text-zinc-400">
              {new Date(
                entry.obtained_at
              ).toLocaleDateString('fr-FR')}
            </div>
          </div>
        );
      })}
     </div>
  )}

  {(hasMoreShinies || visibleCount > 3) && (
    <div className="flex justify-center gap-3 mt-6">

      {hasMoreShinies && (
        <button
          type="button"
          onClick={() => setVisibleCount((prev) => prev + 10)}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl transition"
        >
          ✨ Voir plus
        </button>
      )}

      {visibleCount > 3 && (
        <button
          type="button"
          onClick={() => setVisibleCount(3)}
          className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          Voir moins
        </button>
      )}

    </div>
  )}
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
