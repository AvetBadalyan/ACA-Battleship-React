import { Cell } from '@/components/Cell';
import { Board as BoardType, Orientation, Position, ShipType } from '@/types';
import { canPlaceShip, getShipPositions } from '@/utils/board';
import { motion } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import styles from './Board.module.css';

interface BoardProps {
  board: BoardType;
  title: string;
  isPlayerBoard?: boolean;
  showShips?: boolean;
  disabled?: boolean;
  onCellClick?: (position: Position) => void;
  // Ship placement props
  selectedShip?: ShipType | null;
  shipOrientation?: Orientation;
  onShipPlace?: (position: Position) => void;
  placedShipIds?: string[];
}

const LABELS = {
  cols: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  rows: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
};

export function Board({
  board,
  title,
  isPlayerBoard = false,
  showShips = false,
  disabled = false,
  onCellClick,
  selectedShip,
  shipOrientation = 'horizontal',
  onShipPlace,
  placedShipIds = [],
}: BoardProps) {
  const [hoverPos, setHoverPos] = useState<Position | null>(null);

  // The cells the selected ship would occupy at the hovered position, and
  // whether that placement is valid. Recomputed with useMemo only when an
  // input changes. previewKeys is a Set of "row-col" strings for O(1) lookup
  // per cell (instead of scanning the positions array for all 100 cells).
  const { previewKeys, isValidPlacement } = useMemo(() => {
    if (!selectedShip || !hoverPos) {
      return { previewKeys: new Set<string>(), isValidPlacement: false };
    }

    const positions = getShipPositions(hoverPos, selectedShip.size, shipOrientation);
    const isPlaced = placedShipIds.includes(selectedShip.id);
    const isValid = canPlaceShip(
      board,
      hoverPos,
      selectedShip.size,
      shipOrientation,
      isPlaced ? selectedShip.id : undefined
    );

    return {
      previewKeys: new Set(positions.map((p) => `${p.row}-${p.col}`)),
      isValidPlacement: isValid,
    };
  }, [selectedShip, hoverPos, shipOrientation, board, placedShipIds]);

  // The three handlers below are wrapped in useCallback so each keeps the
  // same identity between renders. That stable identity is what lets the
  // memoized Cell skip re-rendering when nothing about that cell changed.
  const handleCellClick = useCallback(
    (position: Position) => {
      if (disabled) return;

      if (selectedShip && onShipPlace) {
        onShipPlace(position);
      } else if (onCellClick) {
        onCellClick(position);
      }
    },
    [disabled, selectedShip, onShipPlace, onCellClick]
  );

  const handleMouseEnter = useCallback(
    (position: Position) => {
      if (selectedShip) {
        setHoverPos(position);
      }
    },
    [selectedShip]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverPos(null);
  }, []);

  return (
    <motion.div
      className={styles.boardContainer}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className={styles.title}>{title}</h2>

      <div className={styles.boardWrapper}>
        {/* Column labels */}
        <div className={styles.colLabels}>
          <div className={styles.cornerLabel} />
          {LABELS.cols.map((label) => (
            <div key={label} className={styles.label}>
              {label}
            </div>
          ))}
        </div>

        {/* Board grid with row labels */}
        <div className={styles.gridContainer}>
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.row}>
              <div className={styles.rowLabel}>{LABELS.rows[rowIndex]}</div>
              {row.map((cell, colIndex) => (
                <Cell
                  key={`${rowIndex}-${colIndex}`}
                  cell={cell}
                  onClick={handleCellClick}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  isPreview={previewKeys.has(`${rowIndex}-${colIndex}`)}
                  isValidPreview={isValidPlacement}
                  isPlayerBoard={isPlayerBoard}
                  showShips={showShips}
                  disabled={disabled}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
