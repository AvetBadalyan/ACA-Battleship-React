import { Cell as CellType, Position } from '@/types';
import { motion } from 'framer-motion';
import { memo } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import styles from './Cell.module.css';

interface CellProps {
  cell: CellType;
  // These callbacks take the cell's position so the parent can pass ONE
  // stable function to every cell instead of creating a new closure per
  // cell on each render. That's what lets React.memo below actually skip
  // re-rendering cells that didn't change (200 cells across two boards).
  onClick?: (position: Position) => void;
  onMouseEnter?: (position: Position) => void;
  onMouseLeave?: () => void;
  isPreview?: boolean;
  isValidPreview?: boolean;
  isPlayerBoard?: boolean;
  showShips?: boolean;
  disabled?: boolean;
}

function CellComponent({
  cell,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isPreview = false,
  isValidPreview = true,
  isPlayerBoard = false,
  showShips = false,
  disabled = false,
}: CellProps) {
  const { state } = cell;
  const { row, col } = cell.position;

  const getClassName = () => {
    const classes = [styles.cell];

    if (disabled) classes.push(styles.disabled);
    if (isPreview) classes.push(isValidPreview ? styles.previewValid : styles.previewInvalid);

    switch (state) {
      case 'ship':
        if (showShips || isPlayerBoard) classes.push(styles.ship);
        break;
      case 'hit':
        classes.push(styles.hit);
        break;
      case 'miss':
        classes.push(styles.miss);
        break;
      case 'sunk':
        classes.push(styles.sunk);
        break;
    }

    if (!disabled && onClick && state !== 'hit' && state !== 'miss' && state !== 'sunk') {
      classes.push(styles.clickable);
    }

    return classes.join(' ');
  };

  const isResolved = state === 'hit' || state === 'miss' || state === 'sunk';
  const isInteractive = !disabled && !!onClick && !isResolved;

  const handleClick = () => {
    if (isInteractive) {
      onClick!(cell.position);
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (isInteractive && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick!(cell.position);
    }
  };

  const coord = `${String.fromCharCode(65 + col)}${row + 1}`;
  const ariaLabel = isInteractive ? `Fire at ${coord}` : `Cell ${coord}, ${state}`;

  return (
    <motion.div
      className={getClassName()}
      onClick={handleClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      onMouseEnter={onMouseEnter ? () => onMouseEnter(cell.position) : undefined}
      onMouseLeave={onMouseLeave}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={onClick ? ariaLabel : undefined}
      aria-disabled={onClick && !isInteractive ? true : undefined}
      whileHover={isInteractive ? { scale: 1.05 } : undefined}
      whileTap={isInteractive ? { scale: 0.95 } : undefined}
    >
      {/* Water animation */}
      <div className={styles.water}>
        <div className={styles.wave} />
      </div>

      {/* Hit marker */}
      {state === 'hit' && (
        <motion.div
          className={styles.hitMarker}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className={styles.explosion} />
          <span className={styles.hitIcon}>💥</span>
        </motion.div>
      )}

      {/* Miss marker */}
      {state === 'miss' && (
        <motion.div
          className={styles.missMarker}
          initial={{ scale: 0, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className={styles.splash} />
        </motion.div>
      )}

      {/* Sunk marker */}
      {state === 'sunk' && (
        <motion.div
          className={styles.sunkMarker}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <span className={styles.sunkIcon}>🔥</span>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Only re-render a cell when something it actually shows has changed.
 *
 * This custom compare is needed because every shot rebuilds the whole board
 * with fresh cell objects (immutable update), so the default shallow compare
 * would see a new `cell` reference for all 100 cells and re-render every one.
 * We compare the fields that affect what's drawn instead of the object
 * reference. Return true to SKIP the re-render.
 */
function areEqual(prev: CellProps, next: CellProps): boolean {
  return (
    prev.cell.state === next.cell.state &&
    prev.cell.shipId === next.cell.shipId &&
    prev.isPreview === next.isPreview &&
    prev.isValidPreview === next.isValidPreview &&
    prev.isPlayerBoard === next.isPlayerBoard &&
    prev.showShips === next.showShips &&
    prev.disabled === next.disabled &&
    prev.onClick === next.onClick &&
    prev.onMouseEnter === next.onMouseEnter &&
    prev.onMouseLeave === next.onMouseLeave
  );
}

// Every shot updates just a couple of cells; this memo stops the other
// ~98 from re-rendering. See areEqual for why a custom compare is required.
export const Cell = memo(CellComponent, areEqual);
