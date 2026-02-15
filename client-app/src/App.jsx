import { useState, useEffect } from 'react';
import { socket } from './socket';
import GameBoard from './components/GameBoard';
import { useSound } from './utils/sound';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
    const [gameState, setGameState] = useState('lobby'); // lobby, playing, finished
    const [roomId, setRoomId] = useState('');
    const [joinId, setJoinId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [players, setPlayers] = useState([]);
    const [grid, setGrid] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [myPlayerId, setMyPlayerId] = useState(null);
    const [winner, setWinner] = useState(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const { playPop, playExplosion, playJoin, playWin, playError } = useSound();

    useEffect(() => {
        socket.on('connect', () => {
            setMyPlayerId(socket.id);
        });

        socket.on('roomCreated', ({ roomId, player }) => {
            setRoomId(roomId);
            setPlayers([player]);
            setGameState('lobby');
            playJoin();
        });

        socket.on('roomJoined', ({ roomId }) => {
            setRoomId(roomId);
            setGameState('lobby');
            playJoin();
        });

        socket.on('playerJoined', ({ players }) => {
            setPlayers(players);
            playJoin();
        });

        socket.on('gameStarted', ({ grid, currentPlayer }) => {
            setGrid(grid);
            setCurrentPlayer(currentPlayer);
            setGameState('playing');
            playPop();
        });

        socket.on('updateGame', ({ grid, currentPlayer }) => {
            setGrid(grid);
            setCurrentPlayer(currentPlayer);
            playPop(); // Simple pop for any update, ideally differentiate explosions logic
        });

        socket.on('gameOver', ({ winner }) => {
            setWinner(winner);
            setGameState('finished');
            playWin();
        });

        socket.on('error', (msg) => {
            setError(msg);
            playError();
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
    }, [playJoin, playPop, playWin, playError]);

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
        setRoomId('');
        setJoinId('');
        setPlayers([]);
    };

    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-purple-500 selection:text-white">
            <motion.h1
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-5xl md:text-6xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"
            >
                CHAIN REACTION
            </motion.h1>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-4 bg-red-500/90 backdrop-blur text-white px-6 py-3 rounded-full shadow-lg border border-red-400 font-bold z-50"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full max-w-md relative z-10">
                {gameState === 'lobby' && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-800 ring-1 ring-white/10"
                    >
                        {!roomId ? (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-gray-400 text-sm font-bold uppercase tracking-wider ml-1">Player Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your name..."
                                        className="w-full bg-gray-800/50 p-4 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700 transition-all"
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 pt-2">
                                    <button
                                        onClick={createRoom}
                                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Create New Room
                                    </button>

                                    <div className="relative flex items-center gap-2">
                                        <div className="flex-1 h-px bg-gray-700"></div>
                                        <span className="text-gray-500 text-sm font-bold">OR</span>
                                        <div className="flex-1 h-px bg-gray-700"></div>
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter Room ID"
                                            className="flex-1 bg-gray-800/50 p-4 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700 font-mono uppercase tracking-widest text-center"
                                            value={joinId}
                                            onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                                        />
                                        <button
                                            onClick={joinRoom}
                                            className="bg-gray-700 hover:bg-gray-600 p-4 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all px-6"
                                        >
                                            Join
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="text-center space-y-2">
                                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Room Code</span>
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="text-4xl font-mono font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-yellow-600 drop-shadow-sm select-all">
                                            {roomId}
                                        </div>
                                        <button
                                            onClick={copyRoomId}
                                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                                            title="Copy Room ID"
                                        >
                                            {copied ? (
                                                <span className="text-green-400 font-bold text-xs">COPIED</span>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
                                    <div className="flex justify-between items-center mb-4 px-2">
                                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Players</h3>
                                        <span className="bg-gray-700 text-xs px-2 py-1 rounded-full text-gray-300 font-mono">{players.length}/8</span>
                                    </div>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        <AnimatePresence mode="popLayout">
                                            {players.map((p) => (
                                                <motion.div
                                                    key={p.id}
                                                    initial={{ x: -20, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    exit={{ scale: 0.5, opacity: 0 }}
                                                    className="flex items-center gap-3 p-3 bg-gray-700/40 rounded-xl border border-gray-600/30"
                                                >
                                                    <div
                                                        className="w-8 h-8 rounded-full shadow-[0_0_10px_currentColor] flex items-center justify-center text-[10px] font-bold text-gray-900 border-2 border-white/20"
                                                        style={{ backgroundColor: p.color, color: p.color }}
                                                    >
                                                    </div>
                                                    <span className="font-medium text-sm">{p.name} {p.id === myPlayerId && <span className="text-gray-500 text-xs ml-1">(You)</span>}</span>
                                                    {players[0].id === p.id && <span className="ml-auto text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded border border-yellow-500/20">HOST</span>}
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {players.length >= 2 && players[0].id === myPlayerId && (
                                    <button
                                        onClick={startGame}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 p-4 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all text-white"
                                    >
                                        Start Game
                                    </button>
                                )}

                                {players.length < 2 && (
                                    <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                        <div className="animate-pulse flex justify-center mb-2">
                                            <span className="w-2 h-2 bg-blue-400 rounded-full mx-1"></span>
                                            <span className="w-2 h-2 bg-blue-400 rounded-full mx-1 animation-delay-200"></span>
                                            <span className="w-2 h-2 bg-blue-400 rounded-full mx-1 animation-delay-400"></span>
                                        </div>
                                        <p className="text-blue-300 text-sm font-medium">Waiting for at least 1 more player...</p>
                                    </div>
                                )}

                                <button
                                    onClick={resetGame}
                                    className="w-full text-gray-500 hover:text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-500/5 p-3 rounded-lg transition-colors"
                                >
                                    Leave Room
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {gameState === 'playing' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full max-w-4xl flex flex-col items-center"
                >
                    <div className="flex flex-col md:flex-row items-center justify-between w-full mb-6 px-4 gap-4">
                        <div className="flex items-center gap-3 bg-gray-800/80 p-2 pr-6 rounded-full border border-gray-700 backdrop-blur-md">
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider pl-4">Turn</span>
                            <div
                                className="px-4 py-1.5 rounded-full font-bold shadow-lg transition-all duration-300 flex items-center gap-2"
                                style={{
                                    backgroundColor: players.find(p => p.id === currentPlayer)?.color + '20',
                                    color: players.find(p => p.id === currentPlayer)?.color,
                                    border: `1px solid ${players.find(p => p.id === currentPlayer)?.color}`
                                }}
                            >
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'currentColor' }}></div>
                                {players.find(p => p.id === currentPlayer)?.name}
                            </div>
                        </div>
                        <div className="text-gray-500 text-xs font-mono bg-gray-900 px-3 py-1 rounded border border-gray-800">Room: {roomId}</div>
                    </div>

                    <div className="relative p-1 bg-gradient-to-b from-gray-700/50 to-gray-800/50 rounded-2xl border border-gray-700 shadow-2xl backdrop-blur-sm">
                        <GameBoard
                            grid={grid}
                            onCellClick={(r, c) => socket.emit('makeMove', { roomId, row: r, col: c })}
                            players={players}
                        />
                    </div>
                </motion.div>
            )}

            <AnimatePresence>
                {gameState === 'finished' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 flex items-center justify-center backdrop-blur-md z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.5, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-gray-900 p-12 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center border border-gray-800 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none"></div>

                            <h2 className="text-6xl md:text-7xl font-black mb-2 text-white drop-shadow-lg tracking-tighter">
                                GAME OVER
                            </h2>
                            <div className="text-gray-400 uppercase tracking-widest text-sm mb-10 font-bold">And the winner is</div>

                            <motion.div
                                animate={{
                                    boxShadow: [`0 0 20px ${winner.color}`, `0 0 60px ${winner.color}`, `0 0 20px ${winner.color}`],
                                    scale: [1, 1.05, 1]
                                }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-5xl font-bold px-10 py-6 rounded-2xl mb-12 inline-flex items-center gap-4 bg-gray-800 border-2"
                                style={{
                                    color: winner.color,
                                    borderColor: winner.color
                                }}
                            >
                                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: winner.color }}></div>
                                {winner.name}
                            </motion.div>

                            <div>
                                <button
                                    onClick={resetGame}
                                    className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all shadow-xl"
                                >
                                    Back to Lobby
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;
