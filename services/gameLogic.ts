import { GameState, Player, GameMode, PlayerID, ScoringType } from '../types';
import { WIN_SCORE, WIN_BY } from '../constants';

/**
 * ============================================================================
 * GAME LOGIC SERVICE
 * ============================================================================
 * Handles all state transitions for the Pickleball Scorer.
 * Supports two distinct scoring modes:
 * 
 * 1. RALLY SCORING (2026 Proposal):
 *    - Point awarded on every rally.
 *    - No "Second Server".
 *    - Server switches sides on point win.
 *    - Receiver stays fixed.
 * 
 * 2. TRADITIONAL SIDE-OUT SCORING:
 *    - Only serving team scores.
 *    - "Second Server" rule applies.
 *    - Positional rules strict (Rule 1 & 5: Side-out always starts Right).
 * ============================================================================
 */

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


/**
 * Initializes the game state based on selected mode.
 * 
 * @param mode 'singles' or 'doubles'
 * @param scoringType 'rally' or 'sideout'
 * @returns Initial GameState
 */
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
    isFirstServer: (mode === 'doubles' && scoringType === 'sideout') ? true : false,
    servingTeamStartScore: 0,
  };
};

/**
 * Handles the logic when a rally is finished (someone won the point).
 * Dispatches to specific scoring logic based on `scoringType`.
 */
export const handleRallyWin = (currentState: GameState, winner: Player): GameState => {
  let newState = cloneState(currentState);

  // Snapshot for Undo
  const historyState = { ...currentState, history: [] };
  newState.history = [...currentState.history, historyState];

  if (newState.winner) return newState;

  const isServer = newState.server === winner;

  // ==========================================================================
  // LOGIC BRANCH: RALLY SCORING vs TRADITIONAL SIDE-OUT
  // ==========================================================================

  if (newState.scoringType === 'rally') {
    // ------------------------------------------------------------------------
    // RALLY SCORING LOGIC (2026)
    // - Points on every turn.
    // - No "Server 2".
    // ------------------------------------------------------------------------
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
    // ------------------------------------------------------------------------
    // TRADITIONAL SIDE-OUT SCORING LOGIC
    // - Only server scores.
    // - Server 1 -> Server 2 -> Side Out.
    // - Strict Positioning Rules (Rule 1 & 5).
    // ------------------------------------------------------------------------
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
      // Rule 2 & 4: Service Sequence & Positioning
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
          newState.isFirstServer = false; // Side out occurred, exception over

          // Rule 3: 0-0-2 Exception handled via init state, this resets it for normal flow.

          // Capture the start score for the new serving team
          newState.servingTeamStartScore = newState.server === 'me' ? newState.myScore : newState.opponentScore;
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

/**
 * Determines which player ID (A, B, C, D) is currently holding the ball.
 * 
 * LOGIC:
 * - Singles: Straightforward.
 * - Rally Doubles: Even score = Right, Odd score = Left.
 * - Side-out Doubles:
 *   - Use Relative Scoring (Current - Start).
 *   - 0 relative points (Game Start / Side-out Start) -> Right.
 *   - 1 relative point -> Left.
 */
export const getActiveServerID = (state: GameState): PlayerID => {
  if (state.mode === 'singles') return '';

  const players = state.server === 'me' ? state.myPlayers : state.opponentPlayers;
  // players = [RightPlayer, LeftPlayer]

  // ==========================================================================
  // RALLY SCORING (Absolute Positioning)
  // ==========================================================================
  if (state.scoringType === 'rally') {
    const score = state.server === 'me' ? state.myScore : state.opponentScore;
    const isEven = score % 2 === 0;
    return isEven ? players[0] : players[1];
  }

  // ==========================================================================
  // SIDE-OUT SCORING (Relative Positioning)
  // ==========================================================================
  else {
    const currentScore = state.server === 'me' ? state.myScore : state.opponentScore;
    // Rule 1 & 5: Side-out ALWAYS starts from the Right (Relative Scoring)
    // We ignore absolute score parity for the *Start Position* of a new inning.
    const startScore = state.servingTeamStartScore ?? 0;
    const pointsScoredInInning = currentScore - startScore;
    const isRelativeEven = pointsScoredInInning % 2 === 0;

    if (state.serverNumber === 1) {
      // Server 1: Determined by Relative Parity
      // 0 pts (Start) -> Right. 1 pt -> Left.
      return isRelativeEven ? players[0] : players[1];
    } else {
      // Server 2
      // Rule 3: 0-0-2 Exception (Game Start)
      // "Skip Server 1", so Server 2 serves as First Server (Start Right)
      if (state.isFirstServer) {
        return isRelativeEven ? players[0] : players[1];
      }

      // Standard Server 2: Inverted logic
      // Server 1 is "Correct" (Relative Parity).
      // Server 2 is partner -> "Incorrect" spot coverage (Left for 0 pts/Right for 1 pt relative).
      return isRelativeEven ? players[1] : players[0];
    }
  }
};