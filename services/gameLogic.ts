import { GameState, Player, GameMode, PlayerID, ScoringType } from '../types';
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

export const initializeGame = (mode: GameMode, scoringType: ScoringType = 'rally'): GameState => {
  return {
    mode,
    scoringType,
    myScore: 0,
    opponentScore: 0,
    server: 'me',
    // In Rally Scoring, serverNumber is unused (always 1).
    // In Side-out Scoring (Doubles), starts at 2.
    serverNumber: (mode === 'doubles' && scoringType === 'sideout') ? 2 : 1,

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

  const isServer = newState.server === winner;

  // --- SCORING LOGIC SPLIT ---
  if (newState.scoringType === 'rally') {
    // === RALLY SCORING (2025/2026) ===
    if (winner === 'me') {
      newState.myScore++;
    } else {
      newState.opponentScore++;
    }

    if (newState.mode === 'singles') {
      if (!isServer) newState.server = winner; // Side Out
      updateSinglesPositions(newState);
    } else {
      // Doubles Rally
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
      }
      newState.serverNumber = 1; // Always 1 in pure rally
    }

  } else {
    // === TRADITIONAL SIDE-OUT SCORING ===
    if (newState.mode === 'singles') {
      if (isServer) {
        if (winner === 'me') newState.myScore++;
        else newState.opponentScore++;
      } else {
        newState.server = winner;
      }
      updateSinglesPositions(newState);
    } else {
      // Doubles Side-out
      if (isServer) {
        if (winner === 'me') {
          newState.myScore++;
          const [right, left] = newState.myPlayers;
          newState.myPlayers = [left, right];
        } else {
          newState.opponentScore++;
          const [right, left] = newState.opponentPlayers;
          newState.opponentPlayers = [left, right];
        }
      } else {
        // Side Out / Hand Over
        if (newState.serverNumber === 1) {
          newState.serverNumber = 2;
        } else {
          newState.server = newState.server === 'me' ? 'opponent' : 'me';
          newState.serverNumber = 1;
        }
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
// Helper to determine exactly who (A, B, C, D) has the ball for UI
export const getActiveServerID = (state: GameState): PlayerID => {
  if (state.mode === 'singles') return '';

  const players = state.server === 'me' ? state.myPlayers : state.opponentPlayers;
  // players = [RightPlayer, LeftPlayer]

  // === RALLY SCORING ===
  if (state.scoringType === 'rally') {
    const score = state.server === 'me' ? state.myScore : state.opponentScore;
    const isEven = score % 2 === 0;
    return isEven ? players[0] : players[1];
  }

  // === SIDE-OUT SCORING ===
  else {
    if (state.serverNumber === 1) {
      // In Side-out, if score is Even, Server 1 is in Right (index 0).
      // If score is Odd, Server 1 is in Left (index 1).
      const score = state.server === 'me' ? state.myScore : state.opponentScore;
      const isEven = score % 2 === 0;
      return isEven ? players[0] : players[1];
    } else {
      // Server 2
      const score = state.server === 'me' ? state.myScore : state.opponentScore;
      const isEven = score % 2 === 0;
      return isEven ? players[1] : players[0];
    }
  }
};