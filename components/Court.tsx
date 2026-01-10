import React from 'react';
import { Player, CourtSide, PlayerID } from '../types';
import { COLORS } from '../constants';

interface CourtProps {
  owner: Player;
  isActive: boolean; // Does this team have the serve?
  activeSide: CourtSide; // For Singles: Where is the player standing?
  players?: [PlayerID, PlayerID]; // For Doubles: [RightPlayer, LeftPlayer]
  activeServerId?: PlayerID; // For Doubles: Who specifically has the ball?
  isRotated?: boolean;
}

const Court: React.FC<CourtProps> = ({ 
  owner, 
  isActive, 
  activeSide, 
  players, 
  activeServerId,
  isRotated = false 
}) => {
  
  const accentColor = owner === 'me' ? COLORS.myAccent : COLORS.opponentAccent;
  const borderColor = owner === 'me' ? COLORS.myBorder : COLORS.opponentBorder;
  const glowClass = owner === 'me' ? 'neon-border-blue' : 'neon-border-green';

  // Render a single court box
  // index 0 = Right Court, index 1 = Left Court
  const CourtBox = ({ side, index }: { side: CourtSide, index: number }) => {
    let hasBall = false;
    let label: PlayerID = '';

    if (players) {
      // Doubles Logic
      label = players[index];
      if (isActive && activeServerId === label) {
        hasBall = true;
      }
    } else {
      // Singles Logic
      if (isActive && side === activeSide) {
        hasBall = true;
      }
    }

    return (
      <div 
        className={`
          flex-1 h-full border-2 ${COLORS.courtLine} 
          flex items-center justify-center relative
          ${hasBall ? `bg-gray-800 bg-opacity-40` : 'bg-transparent'}
        `}
      >
        {label && (
           <span className={`text-xl font-bold opacity-50 ${owner === 'me' ? 'text-cyan-200' : 'text-green-200'}`}>
             {label}
           </span>
        )}
        {hasBall && (
          <div className={`absolute w-6 h-6 rounded-full ${COLORS.ball} shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse`} />
        )}
      </div>
    );
  };

  return (
    <div 
      className={`
        w-48 h-24 flex border-4 ${borderColor} rounded-lg ${glowClass}
        ${isRotated ? 'rotate-180' : ''}
        transition-all duration-300 relative
      `}
    >
      {/* 
        Court Mapping:
        Visual Left = Logical Left (Odd)
        Visual Right = Logical Right (Even)
        
        Note: The 'players' array is [Right(Even), Left(Odd)].
        So index 1 goes to Visual Left. Index 0 goes to Visual Right.
      */}
      
      {/* Visual Left Box (Odd Side) -> Index 1 */}
      <CourtBox side="left" index={1} />
      
      {/* Center Net/Line */}
      <div className={`w-1 h-full ${COLORS.courtLine}`} />
      
      {/* Visual Right Box (Even Side) -> Index 0 */}
      <CourtBox side="right" index={0} />
    </div>
  );
};

export default Court;