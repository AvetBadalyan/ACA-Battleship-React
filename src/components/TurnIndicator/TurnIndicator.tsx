import { Player, Position } from '@/types';
import { motion } from 'framer-motion';
import styles from './TurnIndicator.module.css';

interface TurnIndicatorProps {
  currentTurn: Player;
  lastShot?: { position: Position; result: 'hit' | 'miss' | 'sunk' } | null;
}

export function TurnIndicator({ currentTurn, lastShot }: TurnIndicatorProps) {
  const isPlayerTurn = currentTurn === 'player';

  const getLastShotMessage = () => {
    if (!lastShot) return null;
    switch (lastShot.result) {
      case 'hit':
        return '💥 Hit!';
      case 'miss':
        return '💨 Miss';
      case 'sunk':
        return '🔥 Ship Sunk!';
    }
  };

  return (
    <motion.div
      className={styles.container}
      // Announce turn changes and shot results to screen readers as they happen.
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.turnInfo}>
        <motion.div
          key={currentTurn}
          className={`${styles.turnBadge} ${isPlayerTurn ? styles.player : styles.ai}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <span className={styles.turnIcon}>{isPlayerTurn ? '🎯' : '🤖'}</span>
          <span className={styles.turnText}>{isPlayerTurn ? 'Your Turn' : 'AI Thinking...'}</span>
        </motion.div>
      </div>

      {/* Always rendered so its height is reserved from the first frame —
          prevents the boards from jumping down when the first shot result appears. */}
      <div className={styles.lastShotWrapper}>
        {lastShot && (
          <motion.div
            key={`${lastShot.position.row}-${lastShot.position.col}`}
            className={`${styles.lastShot} ${styles[lastShot.result]}`}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {getLastShotMessage()}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
