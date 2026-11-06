/**
 * src/ui/Menu.jsx
 * Professional, console-quality Homepage for Math Buggy Rush:
 * - Dynamic Hero Header with golden badge and high-impact "START RACE" CTA
 * - Live Loadout Cards for active Track & Racer with quick-switch actions
 * - Live Player Stats strip (Coins, Best Streak, Cars Unlocked)
 * - Clear, visual controls cheatsheet
 */
import React from 'react';
import { TRACKS } from '../config';
import { useGameStore } from '../store/gameStore';
import { soundEngine } from '../audio/audio';

export function Menu() {
  const coins = useGameStore((s) => s.coins);
  const selectedTrackIndex = useGameStore((s) => s.selectedTrackIndex);
  const selectedCarId = useGameStore((s) => s.selectedCarId);
  const manifest = useGameStore((s) => s.manifest);
  const unlockedCars = useGameStore((s) => s.unlockedCars);
  const muted = useGameStore((s) => s.muted);
  const startRace = useGameStore((s) => s.startRace);
  const setScreen = useGameStore((s) => s.setScreen);
  const toggleMute = useGameStore((s) => s.toggleMute);

  const track = TRACKS[selectedTrackIndex] || TRACKS[0];
  const car = manifest.cars.find((c) => c.id === selectedCarId) || manifest.cars[0];

  const handlePlay = () => {
    soundEngine.unlock();
    startRace();
  };

  const speedPct = Math.min(100, Math.round(((car?.stats?.maxSpeed || 40) / 46) * 100));
  const handlPct = Math.min(100, Math.round(((car?.stats?.handling || 2.8) / 3.4) * 100));

  return (
    <div className="screen-overlay menu-screen">
      {/* Top Bar with Balance & Controls */}
      <div className="pro-menu-topbar">
        <div className="pro-stats-group">
          <div className="coin-balance-pill">🪙 {coins} COINS</div>
          <div className="unlocked-pill">🏎️ {unlockedCars.length}/{manifest.cars.length} CARS</div>
        </div>
        <button type="button" className="btn-mute-pill" onClick={toggleMute}>
          {muted ? '🔇 SOUND OFF' : '🔊 SOUND ON'}
        </button>
      </div>

      {/* Main Glassmorphic Hero Panel */}
      <div className="pro-menu-card">
        {/* Title Header */}
        <div className="pro-hero-header">
          <div className="pro-title-badge">
            <span>🏆 3D ARCADE SPEEDWAY RACER</span>
          </div>
          <h1 className="pro-game-title">MATH BUGGY RUSH</h1>
          <p className="pro-game-subtitle">
            Surge forward at top speed! Smash into floating <strong>'?' Math Bubbles</strong>,
            answer MCQs correctly to unleash <strong>Takedown Strikes</strong>,
            <strong>Super Nitro Boosts</strong>, and <strong>Mega Ram Shields</strong>!
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="pro-cta-container">
          <button type="button" className="pro-btn-race-giant" onClick={handlePlay}>
            <span className="pro-btn-glow" />
            <span className="pro-btn-content">
              <span className="pro-btn-icon">🏁</span>
              <span className="pro-btn-text">START RACE NOW</span>
              <span className="pro-btn-sub">AUTO-CRUISE ON • INSTANT 60 FPS</span>
            </span>
          </button>
        </div>

        {/* Active Setup Cards (Track & Racer) */}
        <div className="pro-loadout-grid">
          {/* Active Track Card */}
          <div className="pro-loadout-card">
            <div className="pro-loadout-header">
              <span className="pro-card-label">ACTIVE RACE LEVEL {selectedTrackIndex + 1}</span>
              <span className="pro-badge-diff">{track.difficulty || 'EASY'}</span>
            </div>
            <div className="pro-card-body">
              <div className="pro-circuit-icon">🏁</div>
              <div className="pro-circuit-info">
                <h3>{track.name}</h3>
                <p>{track.topicLabel}</p>
                <span className="pro-track-width-tag">Grand {track.trackWidth || 38}m Multi-Lane Highway</span>
              </div>
            </div>
            <button
              type="button"
              className="pro-btn-sub-action"
              onClick={() => setScreen('tracks')}
            >
              SELECT LEVEL ➔
            </button>
          </div>

          {/* Active Racer Card */}
          <div className="pro-loadout-card">
            <div className="pro-loadout-header">
              <span className="pro-card-label">EQUIPPED BUGGY</span>
              <span className="pro-badge-car">TIER 1</span>
            </div>
            <div className="pro-card-body">
              <div
                className="pro-car-swatch-badge"
                style={{
                  background: `linear-gradient(135deg, ${car?.color || '#f59e0b'}, ${car?.accentColor || '#ef4444'})`
                }}
              >
                🏎️
              </div>
              <div className="pro-car-info">
                <h3>{car?.name}</h3>
                <div className="pro-mini-stats">
                  <div className="pro-mini-stat">
                    <span>Speed</span>
                    <div className="pro-mini-bar">
                      <div className="pro-mini-bar-fill" style={{ width: `${speedPct}%` }} />
                    </div>
                  </div>
                  <div className="pro-mini-stat">
                    <span>Handling</span>
                    <div className="pro-mini-bar">
                      <div className="pro-mini-bar-fill" style={{ width: `${handlPct}%`, backgroundColor: '#00e1ff' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="pro-btn-sub-action"
              onClick={() => setScreen('garage')}
            >
              OPEN GARAGE ({manifest.cars.length} CARS) ➔
            </button>
          </div>
        </div>

        {/* Secondary Navigation Strip */}
        <div className="pro-secondary-nav">
          <button type="button" className="pro-nav-btn" onClick={() => setScreen('garage')}>
            🏎️ GARAGE & UPGRADES
          </button>
          <button type="button" className="pro-nav-btn" onClick={() => setScreen('tracks')}>
            🏝️ CIRCUIT SELECTOR
          </button>
          <button type="button" className="pro-nav-btn" onClick={() => setScreen('credits')}>
            📜 CREDITS & 3D MODELS
          </button>
        </div>

        {/* Visual Controls Guide */}
        <div className="pro-controls-cheatsheet">
          <div className="pro-control-item">
            <span className="pro-key-badge">A / D</span>
            <span className="pro-control-desc">Steer Left & Right (Car Cruises Forward Automatically)</span>
          </div>
          <div className="pro-control-item">
            <span className="pro-key-badge">S / ↓</span>
            <span className="pro-control-desc">Brake & Dive</span>
          </div>
          <div className="pro-control-item">
            <span className="pro-key-badge">SPACE</span>
            <span className="pro-control-desc">Drift Power-Slide & Spark Turbo</span>
          </div>
          <div className="pro-control-item">
            <span className="pro-key-badge">🫧 '?'</span>
            <span className="pro-control-desc">Hit Bubble to solve MCQ for Takedown & Nitro</span>
          </div>
        </div>
      </div>
    </div>
  );
}
