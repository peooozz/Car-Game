/**
 * src/ui/TrackSelect.jsx
 * Progressive 6-Level Campaign covering all K-8 Math Concepts:
 * Level 1: Toon Town Speedway (Addition & Subtraction ≤ 50)
 * Level 2: Palm Jungle Boulevard (Multiplication & Division Tables 2-12)
 * Level 3: Coral Reef Highway (Fractions, Decimals & Percentages)
 * Level 4: Crab Cove Ruins (Pre-Algebra & Order of Operations)
 * Level 5: Volcano Speedway (Geometry, Area, Perimeter & Triangle Angles)
 * Level 6: Championship Grand Prix (Ultimate All-Math Master Challenge)
 */
import React from 'react';
import { TRACKS } from '../config';
import { useGameStore } from '../store/gameStore';
import { soundEngine } from '../audio/audio';

export function TrackSelect() {
  const unlockedTracks = useGameStore((s) => s.unlockedTracks);
  const selectedTrackIndex = useGameStore((s) => s.selectedTrackIndex);
  const bestResults = useGameStore((s) => s.bestResults);
  const selectTrack = useGameStore((s) => s.selectTrack);
  const unlockAllLevels = useGameStore((s) => s.unlockAllLevels);
  const startRace = useGameStore((s) => s.startRace);
  const setScreen = useGameStore((s) => s.setScreen);

  const handleLaunchTrack = (idx) => {
    if (!unlockedTracks.includes(idx)) return;
    soundEngine.unlock();
    selectTrack(idx);
    startRace(idx);
  };

  const topicIcons = ['➕', '✖️', '🍰', '📐', '📏', '🏆'];

  return (
    <div className="screen-overlay sub-screen">
      <div className="sub-screen-panel">
        <div className="sub-header">
          <button type="button" className="btn-back" onClick={() => setScreen('menu')}>
            ⬅ BACK
          </button>
          <div className="sub-title-center">
            <h2>SELECT RACE LEVEL & MATH TOPIC</h2>
            <p className="sub-caption">Master all 6 Levels to claim the Grand Prix Golden Trophy!</p>
          </div>
          <button
            type="button"
            className="btn-unlock-all"
            onClick={() => {
              soundEngine.playCorrectChime();
              unlockAllLevels();
            }}
            title="Instant access to all 6 levels"
          >
            ⚡ UNLOCK ALL
          </button>
        </div>

        <div className="track-cards-grid">
          {TRACKS.map((t, idx) => {
            const isUnlocked = unlockedTracks.includes(idx);
            const isSelected = selectedTrackIndex === idx;
            const best = bestResults[t.id];

            let stars = '☆☆☆';
            if (best) {
              if (best.bestPosition === 1) stars = '⭐⭐⭐';
              else if (best.bestPosition <= 3) stars = '⭐⭐☆';
              else stars = '⭐☆☆';
            }

            return (
              <div
                key={t.id}
                className={`track-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`}
                onClick={() => isUnlocked && selectTrack(idx)}
              >
                <div
                  className="track-card-banner"
                  style={{
                    background: `linear-gradient(135deg, ${t.skyTop}, ${t.roadEdgeColor})`
                  }}
                >
                  <span className="track-num">
                    {topicIcons[idx % topicIcons.length]} LEVEL {idx + 1}
                  </span>
                  <span className="track-diff">{t.difficulty}</span>
                </div>

                <div className="track-card-body">
                  <h3>{t.name}</h3>
                  <div className="track-topic-pill">{t.topicLabel}</div>
                  <p className="track-topic-desc">{t.subtitle}</p>

                  <div className="track-features">
                    <span>🛣️ {t.trackWidth}m Wide Highway</span>
                    {t.hasRamps && <span>• ⏫ Ramps</span>}
                    {t.hasLava && <span>• 🌋 Lava</span>}
                  </div>

                  {best ? (
                    <div className="track-best-row">
                      <span>{stars}</span>
                      <span>🏆 Best: #{best.bestPosition}</span>
                      <span>🎯 {best.bestAccuracy}%</span>
                    </div>
                  ) : (
                    <div className="track-best-row muted">
                      <span>{stars}</span>
                      <span>Not completed yet</span>
                    </div>
                  )}

                  {isUnlocked ? (
                    <button
                      type="button"
                      className="btn-primary full-width"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLaunchTrack(idx);
                      }}
                    >
                      🏁 PLAY LEVEL {idx + 1}
                    </button>
                  ) : (
                    <button type="button" className="btn-locked full-width" disabled>
                      🔒 COMPLETE LEVEL {idx} TO UNLOCK
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
