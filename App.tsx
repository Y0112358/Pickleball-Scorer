import React, { useState, useEffect } from 'react';
import { GameMode, GameState, INITIAL_STATE, ScoringType } from './types';
import { initializeGame, handleRallyWin, undoLastAction, getActiveServerID } from './services/gameLogic';
import Court from './components/Court';
import WinnerModal from './components/WinnerModal';
import { COLORS } from './constants';
import { Undo, RotateCcw, ChevronLeft, Users, User } from 'lucide-react';

const App: React.FC = () => {
  const [inGame, setInGame] = useState(false);
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [scoringType, setScoringType] = useState<ScoringType>('rally');

  // Prevent browser zoom on double tap
  useEffect(() => {
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    return () => document.removeEventListener('gesturestart', (e) => e.preventDefault());
  }, []);

  const startGame = (mode: GameMode) => {
    setGameState(initializeGame(mode, scoringType));
    setInGame(true);
  };

  const handleAreaClick = (area: 'top' | 'bottom') => {
    if (!inGame || gameState.winner) return;

    if (area === 'top') {
      // Opponent won the rally
      setGameState(prev => handleRallyWin(prev, 'opponent'));
    } else {
      // Player won the rally
      setGameState(prev => handleRallyWin(prev, 'me'));
    }
  };

  const handleUndo = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent double firing on some touch devices
    setGameState(prev => undoLastAction(prev));
  };

  const handleReset = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm('Reset current game?')) {
      setGameState(initializeGame(gameState.mode, gameState.scoringType));
    }
  };

  const handleExit = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm('Exit to Main Menu?')) {
      setInGame(false);
    }
  };

  const getCallString = () => {
    const { server, myScore, opponentScore, serverNumber, mode } = gameState;

    // Format: ServerScore - ReceiverScore - (ServerNumber if Doubles)
    let sScore, rScore;

    if (server === 'me') {
      sScore = myScore;
      rScore = opponentScore;
    } else {
      sScore = opponentScore;
      rScore = myScore;
    }

    if (mode === 'doubles') {
      if (gameState.scoringType === 'sideout') {
        return `${sScore} - ${rScore} - ${serverNumber}`;
      }
      return `${sScore} - ${rScore}`;
    } else {
      return `${sScore} - ${rScore}`;
    }
  };

  // Helper to get active server ID safely for Doubles
  const activeServerId = gameState.mode === 'doubles' ? getActiveServerID(gameState) : undefined;

  // --- RENDERING ---

  if (!inGame) {
    return (
      <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-center p-6 gap-6 select-none">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
            NEON PICKLE
          </h1>
          <p className="text-gray-400 text-sm tracking-widest uppercase">Mobile Scorer</p>
        </div>

        {/* Scoring Type Selection */}
        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800 mb-2">
          <button
            onClick={() => setScoringType('rally')}
            className={`px-4 py-2 rounded-md text-sm font-bold tracking-wider transition-all ${scoringType === 'rally' ? 'bg-gradient-to-r from-green-400 to-blue-500 text-black shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-white'}`}
          >
            RALLY SCORING (2025)
          </button>
          <button
            onClick={() => setScoringType('sideout')}
            className={`px-4 py-2 rounded-md text-sm font-bold tracking-wider transition-all ${scoringType === 'sideout' ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-black shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:text-white'}`}
          >
            TRADITIONAL (SIDE-OUT)
          </button>
        </div>

        <button
          onClick={() => startGame('singles')}
          className="w-full max-w-sm h-32 rounded-2xl bg-gray-900 border-2 border-gray-700 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all hover:border-cyan-400 group"
        >
          <User className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-bold tracking-widest text-white">SINGLES</span>
        </button>

        <button
          onClick={() => startGame('doubles')}
          className="w-full max-w-sm h-32 rounded-2xl bg-gray-900 border-2 border-gray-700 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all hover:border-green-400 group"
        >
          <Users className="w-10 h-10 text-green-400 group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-bold tracking-widest text-white">DOUBLES</span>
          <span className={`text-xs ${scoringType === 'sideout' ? 'text-orange-400' : 'text-gray-500'}`}>
            {scoringType === 'sideout' ? 'Starts 0-0-2 (Traditional)' : 'Starts 0-0 (Rally Scoring)'}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black flex flex-col select-none touch-manipulation overflow-hidden">

      <WinnerModal
        winner={gameState.winner}
        onRematch={() => setGameState(initializeGame(gameState.mode, gameState.scoringType))}
        onMenu={() => setInGame(false)}
      />

      {/* TOP SECTION: OPPONENT */}
      <div
        onClick={() => handleAreaClick('top')}
        className={`
          flex-1 w-full bg-gray-950 relative flex flex-col items-center justify-center
          border-b-4 border-gray-800 active:bg-gray-900 transition-colors cursor-pointer
        `}
      >
        <div className="rotate-180 flex flex-col items-center gap-4">
          <span className={`text-8xl font-black ${COLORS.opponentAccent} neon-text-green`}>
            {gameState.opponentScore}
          </span>
          <Court
            owner="opponent"
            isActive={gameState.server === 'opponent'}
            activeSide={gameState.opponentPosition}
            players={gameState.mode === 'doubles' ? gameState.opponentPlayers : undefined}
            activeServerId={activeServerId}
          />
          <span className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold mt-2">Opponent</span>
        </div>
      </div>

      {/* MIDDLE SECTION: CONTROLS & DASHBOARD */}
      {/* Increased Z-Index to 50 to ensure buttons work over other layers */}
      <div className="h-[20%] min-h-[140px] bg-black border-y border-gray-800 flex items-center justify-between px-4 relative z-50 shadow-2xl">

        {/* Left Controls */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleExit}
            onTouchEnd={handleExit}
            className="p-4 rounded-full bg-gray-900 text-gray-400 hover:text-white active:bg-gray-800 active:scale-95 transition-all"
          >
            <ChevronLeft size={28} />
          </button>
        </div>

        {/* Score Call Display */}
        <div className="flex flex-col items-center justify-center flex-1 mx-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Current Call</span>
          <div className="text-4xl font-mono font-bold text-white tracking-wider bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-800 text-center w-full">
            {getCallString()}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${gameState.server === 'me' ? 'bg-cyan-400' : 'bg-gray-700'}`} />
            <span className="text-[10px] text-gray-400">SERVE</span>
            <div className={`w-2 h-2 rounded-full ${gameState.server === 'opponent' ? 'bg-green-400' : 'bg-gray-700'}`} />
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleUndo}
            onTouchEnd={handleUndo}
            disabled={gameState.history.length === 0}
            className={`p-4 rounded-full active:scale-95 transition-all ${gameState.history.length === 0 ? 'text-gray-700 bg-gray-900' : 'bg-gray-800 text-yellow-400 active:bg-gray-700'}`}
          >
            <Undo size={28} />
          </button>
          <button
            onClick={handleReset}
            onTouchEnd={handleReset}
            className="p-4 rounded-full bg-gray-900 text-gray-400 hover:text-red-400 active:bg-gray-800 active:scale-95 transition-all"
          >
            <RotateCcw size={28} />
          </button>
        </div>
      </div>

      {/* BOTTOM SECTION: PLAYER (ME) */}
      <div
        onClick={() => handleAreaClick('bottom')}
        className={`
          flex-1 w-full bg-gray-950 relative flex flex-col items-center justify-center
          border-t-4 border-gray-800 active:bg-gray-900 transition-colors cursor-pointer
        `}
      >
        <div className="flex flex-col items-center gap-4">
          <span className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">My Score</span>
          <Court
            owner="me"
            isActive={gameState.server === 'me'}
            activeSide={gameState.myPosition}
            players={gameState.mode === 'doubles' ? gameState.myPlayers : undefined}
            activeServerId={activeServerId}
          />
          <span className={`text-9xl font-black ${COLORS.myAccent} neon-text-blue`}>
            {gameState.myScore}
          </span>
        </div>
      </div>
    </div>
  );
};

export default App;