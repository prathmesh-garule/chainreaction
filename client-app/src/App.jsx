import { useState, useEffect } from 'react';
import { socket } from './socket';
import GameBoard from './components/GameBoard';

function App() {
  const [gameState, setGameState] = useState('lobby'); // lobby, playing, finished
  const [roomId, setRoomId] = useState(''); // The active room ID
  const [joinId, setJoinId] = useState(''); // The input value for joining
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [grid, setGrid] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected:', socket.id);
      setMyPlayerId(socket.id);
    });

    socket.on('roomCreated', ({ roomId, player }) => {
      setRoomId(roomId);
      setPlayers([player]);
      setGameState('lobby');
    });

    socket.on('roomJoined', ({ roomId }) => {
      setRoomId(roomId);
      setGameState('lobby');
    });

    socket.on('playerJoined', ({ players }) => {
      setPlayers(players);
    });

    socket.on('gameStarted', ({ grid, currentPlayer }) => {
      setGrid(grid);
      setCurrentPlayer(currentPlayer);
      setGameState('playing');
    });

    socket.on('updateGame', ({ grid, currentPlayer }) => {
      setGrid(grid);
      setCurrentPlayer(currentPlayer);
    });

    socket.on('gameOver', ({ winner }) => {
      setWinner(winner);
      setGameState('finished');
    });

    socket.on('error', (msg) => {
      setError(msg);
      setTimeout(() => setError(''), 3000);
    });

    return () => {
      socket.off('connect');
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('playerJoined');
      socket.off('gameStarted');
      socket.off('updateGame');
      socket.off('gameOver');
      socket.off('error');
    };
  }, []);

  const createRoom = () => {
    if (!playerName) return setError('Enter name');
    socket.emit('createRoom', { playerName });
  };

  const joinRoom = () => {
    if (!playerName || !joinId) return setError('Enter name and room ID');
    socket.emit('joinRoom', { roomId: joinId, playerName });
  };

  const startGame = () => {
    socket.emit('startGame', { roomId });
  };

  const resetGame = () => {
    setGameState('lobby');
    setWinner(null);
    setGrid([]);
    setRoomId(''); // Clear room ID to go back to input screen
    setJoinId('');
    setPlayers([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
        Chain Reaction
      </h1>

      {error && (
        <div className="absolute top-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg animate-bounce">
          {error}
        </div>
      )}

      {gameState === 'lobby' && (
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
          {!roomId ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter Name"
                className="w-full bg-gray-700 p-3 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={createRoom}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded font-bold hover:scale-105 transition-transform"
                >
                  Create Room
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Room ID"
                  className="flex-1 bg-gray-700 p-3 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                />
                <button
                  onClick={joinRoom}
                  className="bg-green-500 p-3 rounded font-bold hover:scale-105 transition-transform"
                >
                  Join
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-gray-400">Room ID:</span>
                <div className="text-3xl font-mono font-bold tracking-widest text-yellow-400 my-2">
                  {roomId}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-gray-400 text-sm uppercase tracking-wider">Players ({players.length}/8)</h3>
                <div className="space-y-1">
                  {players.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                      <div
                        className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                        style={{ backgroundColor: p.color, color: p.color }}
                      ></div>
                      <span>{p.name} {p.id === myPlayerId && '(You)'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {players.length >= 2 && players[0].id === myPlayerId && (
                <button
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-purple-500/20"
                >
                  Start Game
                </button>
              )}

              {players.length < 2 && (
                <div className="text-center text-gray-400 italic text-sm">Waiting for players...</div>
              )}

              <button
                onClick={resetGame}
                className="w-full mt-4 text-gray-400 hover:text-white text-sm underline"
              >
                Leave Room
              </button>
            </div>
          )}
        </div>
      )}

      {gameState === 'playing' && (
        <div className="w-full max-w-4xl flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-4 px-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Current Turn:</span>
              <div
                className="px-3 py-1 rounded-full font-bold shadow-lg transition-all duration-300"
                style={{
                  backgroundColor: players.find(p => p.id === currentPlayer)?.color + '20',
                  color: players.find(p => p.id === currentPlayer)?.color,
                  border: `1px solid ${players.find(p => p.id === currentPlayer)?.color}`
                }}
              >
                {players.find(p => p.id === currentPlayer)?.name}
              </div>
            </div>
            <div className="text-gray-500 text-sm font-mono">Room: {roomId}</div>
          </div>

          <GameBoard
            grid={grid}
            onCellClick={(r, c) => socket.emit('makeMove', { roomId, row: r, col: c })}
            players={players}
          />
        </div>
      )}

      {gameState === 'finished' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm z-50">
          <div className="bg-gray-800 p-10 rounded-2xl shadow-2xl text-center border border-gray-700 transform transition-all scale-100">
            <h2 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
              Game Over!
            </h2>
            <div className="text-2xl mb-8 flex flex-col items-center gap-4">
              <div>Winner</div>
              <div
                className="text-4xl font-bold px-6 py-2 rounded-full shadow-[0_0_20px_currentColor]"
                style={{
                  backgroundColor: winner.color + '20',
                  color: winner.color,
                  border: `2px solid ${winner.color}`
                }}
              >
                {winner.name}
              </div>
            </div>
            <button
              onClick={resetGame}
              className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
