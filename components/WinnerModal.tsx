import React from 'react';
import { Player } from '../types';

interface WinnerModalProps {
  winner: Player | null;
  onRematch: () => void;
  onMenu: () => void;
}

const WinnerModal: React.FC<WinnerModalProps> = ({ winner, onRematch, onMenu }) => {
  if (!winner) return null;

  const message = winner === 'me' ? 'YOU WON!' : 'OPPONENT WON';
  const colorClass = winner === 'me' ? 'text-cyan-400 border-cyan-400' : 'text-green-400 border-green-400';

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <div className={`text-5xl font-black mb-8 ${colorClass} tracking-wider text-center neon-text`}>
        {message}
      </div>
      
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button 
          onClick={onRematch}
          className="w-full bg-white text-black font-bold py-4 rounded-xl text-xl uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-transform"
        >
          Rematch
        </button>
        
        <button 
          onClick={onMenu}
          className="w-full border-2 border-white text-white font-bold py-4 rounded-xl text-xl uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-transform"
        >
          Main Menu
        </button>
      </div>
    </div>
  );
};

export default WinnerModal;