import { GameState, Player, GameMode, PlayerID } from '../types';
import { WIN_SCORE, WIN_BY } from '../constants';

// Deep copy helper
const cloneState = (state: GameState): GameState => {
  return JSON.parse(JSON.stringify(state));
};

const checkWinner = (state: GameState): GameState => {
  const { myScore, opponentScore } = state;
  if (myScore >= WIN_SCORE && myScore >= opponentScore + WIN_BY) {
    state.winner = 'me';
  } else if (opponentScore >= WIN_SCORE && opponentScore >= myScore + WIN_BY) {
    state.winner = 'opponent';
  }
  return state;
};

// Update logical positions for Singles (visual only)
const updateSinglesPositions = (state: GameState) => {
  state.myPosition = state.myScore % 2 === 0 ? 'right' : 'left';
  state.opponentPosition = state.opponentScore % 2 === 0 ? 'right' : 'left';
};

export const initializeGame = (mode: GameMode): GameState => {
  return {
    mode,
    myScore: 0,
    opponentScore: 0,
    server: 'me',
    // In Doubles, start 0-0-2.
    // In Singles, start 0-0.
    serverNumber: mode === 'doubles' ? 2 : 1,
    
    // Doubles Init: [Right, Left]
    myPlayers: ['A', 'B'],
    opponentPlayers: ['C', 'D'],
    
    // Singles Init (Visual)
    myPosition: 'right',
    opponentPosition: 'right',
    
    winner: null,
    history: [],
  };
};

export const handleRallyWin = (currentState: GameState, winner: Player): GameState => {
  let newState = cloneState(currentState);
  
  // Save history
  const historyState = { ...currentState, history: [] };
  newState.history = [...currentState.history, historyState];

  if (newState.winner) return newState;

  const isServer = newState.server === winner;

  if (newState.mode === 'singles') {
    // --- SINGLES LOGIC ---
    if (isServer) {
      if (winner === 'me') newState.myScore++;
      else newState.opponentScore++;
    } else {
      // Side Out
      newState.server = winner;
    }
    updateSinglesPositions(newState);
  } 
  else { 
    // --- DOUBLES LOGIC ---
    if (isServer) {
      // 1. Point Won
      if (winner === 'me') {
        newState.myScore++;
        // Swap positions for serving team (Me)
        const [right, left] = newState.myPlayers;
        newState.myPlayers = [left, right];
      } else {
        newState.opponentScore++;
        // Swap positions for serving team (Opponent)
        const [right, left] = newState.opponentPlayers;
        newState.opponentPlayers = [left, right];
      }
      // Note: In Doubles, the same person continues serving after a point, 
      // but they have physically swapped sides.
    } else {
      // 2. Rally Lost (Hand-over or Side-out)
      // Players DO NOT swap positions on a fault/loss.
      
      if (newState.serverNumber === 1) {
        // First server lost -> Second server
        newState.serverNumber = 2;
        // Serve stays with the team, but technically moves to the partner.
        // Visually, the partner is in the 'other' box.
      } else {
        // Second server lost -> Side Out
        newState.server = newState.server === 'me' ? 'opponent' : 'me';
        newState.serverNumber = 1;
        
        // When Side Out occurs in Pickleball, the ball goes to the player
        // currently residing in the Right (Even) court.
      }
    }
  }

  return checkWinner(newState);
};

export const undoLastAction = (currentState: GameState): GameState => {
  if (currentState.history.length === 0) return currentState;
  const previousState = currentState.history[currentState.history.length - 1];
  previousState.history = currentState.history.slice(0, -1);
  return previousState;
};

// Helper to determine exactly who (A, B, C, D) has the ball for UI
export const getActiveServerID = (state: GameState): PlayerID => {
  if (state.mode === 'singles') return '';
  
  // In doubles, we need to know who is serving.
  // Rules:
  // 1. If Side Out just happened (Server 1), the person in the Right court serves.
  // 2. If Point won, players swapped, same person serves (now from other side).
  // 3. If Server 1 lost (becoming Server 2), the partner serves.
  
  const players = state.server === 'me' ? state.myPlayers : state.opponentPlayers;
  // players = [RightPlayer, LeftPlayer]
  
  if (state.serverNumber === 1) {
    // Server 1 is always the person currently in the Right court (due to side-out rule)
    // UNLESS they just scored odd points? No, the side-out rule places ball in Right court.
    // However, if we scored points, we swapped. 
    // Actually, simple logic: 
    // If we track positions correctly, Server 1 is ALWAYS the person who was in the Right court at the start of the sequence?
    // No. 
    
    // Let's use the visual state. 
    // If it is Server 1, and the score is Even, they are on Right. 
    // If it is Server 1, and the score is Odd, they are on Left.
    const score = state.server === 'me' ? state.myScore : state.opponentScore;
    const isEven = score % 2 === 0;
    
    // If score is even, Server 1 is in Right box (index 0).
    // If score is odd, Server 1 is in Left box (index 1).
    return isEven ? players[0] : players[1];
  } else {
    // Server 2.
    // If score is Even, Server 1 was Right, so Server 2 is Left (index 1).
    // If score is Odd, Server 1 was Left, so Server 2 is Right (index 0).
    const score = state.server === 'me' ? state.myScore : state.opponentScore;
    const isEven = score % 2 === 0;
    return isEven ? players[1] : players[0];
  }
};