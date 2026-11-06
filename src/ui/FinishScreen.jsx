/**
 * src/ui/FinishScreen.jsx
 * Displays final race results: Position, Accuracy %, Best Streak, Coins Earned breakdown,
 * Restart button, and Next Track button.
 */
import React from 'react';
import { TRACKS } from '../config';
import { useGameStore } from '../store/gameStore';

export function FinishScreen() {
  const summary = useGameStore((s) => s.finishSummary);
  const startRace = useGameStore((s) => s.startRace);
  const selectTrack = useGameStore((s) => s.selectTrack);
  const setScreen = useGameStore((s) => s.setScreen);

  if (!summary) return null;

  const ordinal = (n) => {
    if (n === 1) return '1st 🥇';
    if (n === 2) return '2nd 🥈';
    if (n === 3) return '3rd 🥉';
    return `${n}th`;
  };

  const handleNextTrack = () => {
    selectTrack(summary.nextTrackIndex);
    startRace(summary.nextTrackIndex);
  };

  return (
    <div className="screen-overlay finish-screen">
      <div className="finish-card">
        <div className="finish-badge">RACE COMPLETE!</div>
        <h2>{summary.trackName}</h2>

        <div className="finish-position-banner">
          <span>FINAL POSITION</span>
          <strong>{ordinal(summary.position)}</strong>
        </div>

        <div className="finish-stats-grid">
          <div className="finish-stat-box">
            <span>MATH ACCURACY</span>
            <strong>{summary.accuracy}%</strong>
            <small>
              ({summary.questionsCorrect} / {summary.questionsAttempted} Correct)
            </small>
          </div>
          <div className="finish-stat-box">
            <span>BEST STREAK</span>
            <strong>🔥 {summary.bestStreak}</strong>
            <small>In a Row</small>
          </div>
          <div className="finish-stat-box">
            <span>ANSWER COINS</span>
            <strong>+{summary.answerCoins} 🪙</strong>
            <small>+1 per Correct Answer</small>
          </div>
          <div className="finish-stat-box">
            <span>POSITION BONUS</span>
            <strong>+{summary.positionBonusCoins} 🪙</strong>
            <small>+{summary.positionsGained} Positions Gained (×10)</small>
          </div>
        </div>

        <div className="finish-total-coins">
          TOTAL COINS EARNED: <strong>+{summary.totalEarnedCoins} 🪙</strong>
        </div>

        <div className="finish-actions">
          <button type="button" className="btn-secondary" onClick={() => startRace()}>
            🔄 RESTART TRACK
          </button>
          <button type="button" className="btn-primary" onClick={handleNextTrack}>
            ⏭️ NEXT TRACK ({TRACKS[summary.nextTrackIndex]?.name})
          </button>
          <button type="button" className="btn-outline" onClick={() => setScreen('menu')}>
            🏠 MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
