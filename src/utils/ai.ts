/**
 * @fileoverview AI opponent logic for the Battleship game.
 *
 * The AI uses the classic Hunt/Target approach:
 * - Hunt: fire at a random cell that hasn't been tried yet.
 * - Target: after a hit, queue the neighbouring cells and fire at those
 *   next, so the AI "chases" a ship once it finds one.
 *
 * @module utils/ai
 *
 * INTERVIEW NOTES:
 * - The targetQueue is just an array we use as a FIFO queue (push to add,
 *   shift to take the next one).
 * - When the AI hits, we add the up/down/left/right neighbours to the queue.
 *   It drains that queue before going back to random shots, which is what
 *   makes it smarter than pure guessing.
 * - Each turn returns a NEW state object instead of mutating, matching the
 *   store's immutable data flow.
 */

import { AIHuntState, Board, Position } from '@/types';
import { getUntriedCells, isCellShot, isValidPosition } from './board';

/**
 * Creates the initial AI state: hunting, with nothing queued yet.
 */
export function createAIHuntState(): AIHuntState {
  return {
    mode: 'hunt',
    targetQueue: [],
    hitStack: [],
    shipDirection: null,
  };
}

/**
 * Returns the up/down/left/right neighbours of a cell that are still on
 * the board. Diagonals are excluded because ships are only straight lines.
 */
function getAdjacentCells(pos: Position): Position[] {
  return [
    { row: pos.row - 1, col: pos.col }, // up
    { row: pos.row + 1, col: pos.col }, // down
    { row: pos.row, col: pos.col - 1 }, // left
    { row: pos.row, col: pos.col + 1 }, // right
  ].filter(isValidPosition);
}

/**
 * Picks a random cell that hasn't been shot yet (used when hunting).
 */
function getRandomShot(board: Board): Position {
  const available = getUntriedCells(board);
  // In a real game this never happens (the game ends once all ships are
  // sunk, long before the board fills up), but guard anyway so we never
  // return undefined and crash the next shot.
  if (available.length === 0) {
    return { row: 0, col: 0 };
  }
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Chooses the AI's next shot.
 * - If there are queued targets (cells next to a previous hit), fire at the
 *   first one that hasn't already been shot.
 * - Otherwise fire at a random untried cell.
 */
export function getAIShot(
  board: Board,
  huntState: AIHuntState
): { position: Position; newState: AIHuntState } {
  const targetQueue = [...huntState.targetQueue];

  // Target mode: work through cells next to earlier hits.
  while (targetQueue.length > 0) {
    const target = targetQueue.shift()!; // take the next queued cell
    if (!isCellShot(board, target)) {
      return {
        position: target,
        newState: {
          mode: 'target',
          targetQueue,
          hitStack: huntState.hitStack,
          shipDirection: huntState.shipDirection,
        },
      };
    }
    // Already shot -> skip it and try the next queued cell.
  }

  // Hunt mode: nothing queued, fire at a random untried cell.
  return {
    position: getRandomShot(board),
    newState: { mode: 'hunt', targetQueue: [], hitStack: [], shipDirection: null },
  };
}

/**
 * Updates the AI state after a shot.
 * - On a hit, queue the neighbouring cells (skipping ones already shot or
 *   already queued) so the AI targets them next.
 * - Once two collinear hits establish the ship's axis, prune the queue to
 *   cells along that axis so the AI doesn't waste shots perpendicular to it.
 * - On a sunk ship, clear everything and go back to hunting.
 * - On a miss, leave the queue as-is.
 */
export function updateAIHuntState(
  state: AIHuntState,
  position: Position,
  result: 'hit' | 'miss' | 'sunk',
  board: Board
): AIHuntState {
  // Ship destroyed: stop targeting and reset all tracking state.
  if (result === 'sunk') {
    return { mode: 'hunt', targetQueue: [], hitStack: [], shipDirection: null };
  }

  // Hit: update the hit stack, detect direction, then update the queue.
  if (result === 'hit') {
    const hitStack = [...state.hitStack, position];
    let targetQueue = [...state.targetQueue];
    let { shipDirection } = state;

    // Determine axis once we have two hits on the same ship.
    if (shipDirection === null && hitStack.length >= 2) {
      const first = hitStack[0];
      shipDirection = first.row === position.row ? 'horizontal' : 'vertical';

      // Prune queued cells that don't lie on the detected axis.
      targetQueue = targetQueue.filter((t) =>
        shipDirection === 'horizontal' ? t.row === position.row : t.col === position.col
      );
    }

    // Add neighbours of this hit that are still on the board, untried, and
    // consistent with the known direction (if established).
    for (const adj of getAdjacentCells(position)) {
      if (shipDirection === 'horizontal' && adj.row !== position.row) continue;
      if (shipDirection === 'vertical' && adj.col !== position.col) continue;
      const alreadyQueued = targetQueue.some((t) => t.row === adj.row && t.col === adj.col);
      if (!isCellShot(board, adj) && !alreadyQueued) {
        targetQueue.push(adj);
      }
    }

    return { mode: 'target', targetQueue, hitStack, shipDirection };
  }

  // Miss: keep the state unchanged.
  return state;
}
