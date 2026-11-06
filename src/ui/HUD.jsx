/**
 * src/ui/HUD.jsx
 * In-race DOM overlay:
 * - Position (2/6), Lap (1/3), Coins, Streak (flame icon at 3+)
 * - Held Weapon Slot with fire button prompt
 * - Speed Bar & km/h readout
 * - Countdown 3-2-1-GO banner
 * - Pause modal overlay
 */
import React from 'react';
import { GAME_CONFIG, TRACKS } from '../config';
import { useGameStore, raceRuntime } from '../store/gameStore';
import { QuestionBanner } from './QuestionBanner';
import { MCQModal } from './MCQModal';
import { MinimapTracker } from './MinimapTracker';

export function HUD() {
  const lap = useGameStore((s) => s.lap);
  const position = useGameStore((s) => s.position);
  const raceCoins = useGameStore((s) => s.raceCoins);
  const streak = useGameStore((s) => s.streak);
  const weapon = useGameStore((s) => s.weapon);
  const shieldActive = useGameStore((s) => s.shieldActive);
  const boostActive = useGameStore((s) => s.boostActive);
  const speedDisplay = useGameStore((s) => s.speedDisplay);
  const countdown = useGameStore((s) => s.countdown);
  const paused = useGameStore((s) => s.paused);
  const activeMCQ = useGameStore((s) => s.activeMCQ);
  const debugMode = useGameStore((s) => s.debugMode);
  const selectedTrackIndex = useGameStore((s) => s.selectedTrackIndex);
  const togglePause = useGameStore((s) => s.togglePause);
  const startRace = useGameStore((s) => s.startRace);
  const setScreen = useGameStore((s) => s.setScreen);
  const muted = useGameStore((s) => s.muted);
  const toggleMute = useGameStore((s) => s.toggleMute);

  const weaponCfg = weapon ? GAME_CONFIG.weapons[weapon] : null;
  const speedPercent = Math.min(100, Math.round((speedDisplay / 110) * 100));
  const track = TRACKS[selectedTrackIndex] || TRACKS[0];

  const handleFireClick = () => {
    raceRuntime.controls.fire = true;
  };

  return (
    <div className="hud-overlay">
      {/* Top Bar: Position, Lap, Coins, Streak, Weapon Slot, Pause */}
      <div className="hud-top-bar">
        <div className="hud-stat-group">
          <div className="hud-pill pos-pill">
            <span className="hud-label">POS</span>
            <span className="hud-value">
              {position}<small>/{GAME_CONFIG.totalCars}</small>
            </span>
          </div>

          <div className="hud-pill lap-pill">
            <span className="hud-label">LAP</span>
            <span className="hud-value">
              {lap}<small>/{GAME_CONFIG.totalLaps}</small>
            </span>
          </div>

          <div className="hud-pill coin-pill">
            <span className="hud-label">COINS</span>
            <span className="hud-value">🪙 {raceCoins}</span>
          </div>

          <div className={`hud-pill streak-pill ${streak >= 3 ? 'streak-hot' : ''}`}>
            <span className="hud-label">STREAK</span>
            <span className="hud-value">
              {streak >= 3 ? '🔥 ' : ''}{streak}
            </span>
          </div>
        </div>

        {/* Held Weapon Slot */}
        <div className="hud-center-slot">
          <button
            type="button"
            className={`weapon-slot-btn ${weaponCfg ? 'weapon-ready' : ''}`}
            onClick={handleFireClick}
            title="Press E / Ctrl or Click to Fire Weapon"
          >
            {weaponCfg ? (
              <>
                <span className="weapon-icon">{weaponCfg.icon}</span>
                <div className="weapon-meta">
                  <span className="weapon-name">{weaponCfg.name}</span>
                  <span className="weapon-hint">PRESS [E] OR TAP TO FIRE!</span>
                </div>
              </>
            ) : (
              <span className="weapon-empty">🫧 HIT '?' BUBBLES TO UNLEASH SUPER POWERS!</span>
            )}
          </button>

          {shieldActive && <div className="status-badge shield-badge">🛡️ SHIELD ON</div>}
          {boostActive && <div className="status-badge boost-badge">⚡ MEGA BOOST</div>}
        </div>

        {/* Right Controls: Mute & Pause */}
        <div className="hud-actions">
          <button type="button" className="icon-btn" onClick={toggleMute} title="Toggle Audio">
            {muted ? '🔇' : '🔊'}
          </button>
          <button type="button" className="icon-btn" onClick={togglePause} title="Pause (P)">
            ⏸️
          </button>
        </div>
      </div>

      {/* Prominent Real-Time 2D Circuit Minimap Tracker */}
      <MinimapTracker />

      {/* Question Banner & Answer Feedback */}
      <QuestionBanner />

      {/* Center 3-2-1-GO Countdown */}
      {countdown >= 0 && (
        <div className="countdown-banner">
          {countdown === 0 ? 'GO!' : countdown}
        </div>
      )}

      {/* Bottom Speedometer Bar & Track Topic Label */}
      <div className="hud-bottom-bar">
        <div className="track-badge-mini">
          <strong>{track.name}</strong> • {track.topicLabel}
          {debugMode && <span className="debug-tag"> [F2 DEBUG ON]</span>}
        </div>

        <div className="speedometer-box">
          <div className="speed-bar-bg">
            <div
              className={`speed-bar-fill ${boostActive ? 'speed-boost' : ''}`}
              style={{ width: `${speedPercent}%` }}
            />
          </div>
          <div className="speed-readout">
            <strong>{speedDisplay}</strong> <span>KM/H</span>
          </div>
        </div>
      </div>

      {/* Active MCQ Challenge Modal (pauses race when hitting a '?' bubble) */}
      <MCQModal />

      {/* Pause Modal (only when manually paused by player) */}
      {paused && !activeMCQ && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>RACE PAUSED</h2>
            <p>{track.name} — {track.subtitle}</p>
            <div className="modal-buttons">
              <button type="button" className="btn-primary" onClick={togglePause}>
                ▶ RESUME RACE
              </button>
              <button type="button" className="btn-secondary" onClick={() => startRace()}>
                🔄 RESTART TRACK
              </button>
              <button type="button" className="btn-outline" onClick={() => setScreen('menu')}>
                🏠 MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
