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
    // In Rally Scoring, doubles server is always just "The Server".
    // We use serverNumber: 1 internally for compatibility, but logic won't use 2.
    serverNumber: 1,

    // Doubles Init: [Right, Left]
    myPlayers: ['A', 'B'],
    opponentPlayers: ['C', 'D'],

    // Singles Init (Visual)
    myPosition: 'right',
    opponentPosition: 'right', // Server starts on Right (Even 0)

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

  // --- RALLY SCORING LOGIC ---
  // A point is awarded to the winner of the rally, regardless of who served.

  if (winner === 'me') {
    newState.myScore++;
  } else {
    newState.opponentScore++;
  }

  const isServer = newState.server === winner;

  if (newState.mode === 'singles') {
    // --- SINGLES ---
    if (!isServer) {
      newState.server = winner; // Side Out
    }
    // Update visual positions based on NEW score
    updateSinglesPositions(newState);
  } else {
    // --- DOUBLES ---
    if (isServer) {
      // Point Won on Serve -> Switch Sides
      if (winner === 'me') {
        const [right, left] = newState.myPlayers;
        newState.myPlayers = [left, right];
      } else {
        const [right, left] = newState.opponentPlayers;
        newState.opponentPlayers = [left, right];
      }
    } else {
      // Side Out -> No Switch, just server change
      newState.server = winner;
      // In Rally Scoring, server is determined by the score (Even/Right, Odd/Left).
      // Players physically stay in their last positions, so we don't swap arrays here.
      // We just verify who is "serving" in getActiveServerID based on score.
    }

    // Reset server number to 1 (conceptually unused in pure rally, but for consistency)
    newState.serverNumber = 1;
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
// Helper to determine exactly who (A, B, C, D) has the ball for UI
export const getActiveServerID = (state: GameState): PlayerID => {
  if (state.mode === 'singles') return '';

  // Rally Scoring Rule:
  // The server is determined by the serving team's score.
  // Even Score -> Player on Right serves.
  // Odd Score -> Player on Left serves.

  const players = state.server === 'me' ? state.myPlayers : state.opponentPlayers;
  // players = [RightPlayer, LeftPlayer]

  const score = state.server === 'me' ? state.myScore : state.opponentScore;
  const isEven = score % 2 === 0;

  return isEven ? players[0] : players[1];
};