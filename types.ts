export type Player = 'me' | 'opponent';
export type CourtSide = 'left' | 'right';
export type GameMode = 'singles' | 'doubles';
export type PlayerID = 'A' | 'B' | 'C' | 'D' | '';
export type ScoringType = 'sideout' | 'rally';

export interface GameState {
  mode: GameMode;
  scoringType: ScoringType;
  myScore: number;
  opponentScore: number;
  server: Player;
  serverNumber: 1 | 2; // Only used in doubles

  // Position Tracking
  // Singles: Derived from score.
  // Doubles: [RightPlayer, LeftPlayer]. Index 0 is Right (Even), Index 1 is Left (Odd).
  myPlayers: [PlayerID, PlayerID];
  opponentPlayers: [PlayerID, PlayerID];

  // For singles visual compatibility
  myPosition: CourtSide;
  opponentPosition: CourtSide;

  winner: Player | null;
  history: GameState[];
}

export const INITIAL_STATE: GameState = {
  mode: 'doubles',
  scoringType: 'rally', // Default to rally, but usually set by init
  myScore: 0,
  opponentScore: 0,
  server: 'me',
  serverNumber: 2,
  // Default Doubles Start: A/C on Right, B/D on Left
  myPlayers: ['A', 'B'],
  opponentPlayers: ['C', 'D'],
  myPosition: 'right',
  opponentPosition: 'right',
  winner: null,
  history: [],
};