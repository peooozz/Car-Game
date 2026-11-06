/**
 * src/ui/Loading.jsx
 * Professional, console-quality loading screen for Math Buggy Rush.
 * Features animated speedway track, glowing neon dual-tier progress bar,
 * live stage indicators, and smooth exit transition.
 */
import React, { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';

export function Loading() {
  const { active, progress, item } = useProgress();
  const [visible, setVisible] = useState(true);
  const [displayPct, setDisplayPct] = useState(0);

  // Smoothly interpolate display percentage
  useEffect(() => {
    const target = Math.min(100, Math.round(progress || 0));
    const interval = setInterval(() => {
      setDisplayPct((prev) => {
        if (prev < target) return Math.min(target, prev + 2);
        return prev;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [progress]);

  // Handle smooth fade out when loaded
  useEffect(() => {
    if (!active && displayPct >= 100) {
      const timer = setTimeout(() => setVisible(false), 450);
      return () => clearTimeout(timer);
    }
  }, [active, displayPct]);

  if (!visible && !active) return null;

  // Milestone text
  let statusText = '⚙️ Initializing 3D High-Speed Engine...';
  if (displayPct >= 85) {
    statusText = '🏁 Priming Math MCQ Bubble Challenges...';
  } else if (displayPct >= 60) {
    statusText = '🏎️ Calibrating 6 Custom 3D Racers & Physics...';
  } else if (displayPct >= 30) {
    statusText = '🛣️ Constructing Toon Town Speedway Circuit...';
  }

  const assetName = item ? item.split('/').pop() : '';

  return (
    <div className={`pro-loading-overlay ${!active && displayPct >= 100 ? 'fade-out' : ''}`}>
      {/* Background ambient speed glow */}
      <div className="pro-loading-bg-glow" />

      {/* Main loading dialog */}
      <div className="pro-loading-card">
        {/* Game Logo Badge */}
        <div className="pro-loading-header">
          <div className="pro-speed-badge">
            <span className="pro-badge-dot" />
            <span>SPEEDWAY GRAND PRIX</span>
          </div>
          <h1 className="pro-loading-title">MATH BUGGY RUSH</h1>
          <div className="pro-loading-divider" />
        </div>

        {/* Dynamic Racing Track Animation */}
        <div className="pro-track-container">
          <div className="pro-track-road">
            <div className="pro-track-stripes" />
            <div
              className="pro-track-car"
              style={{ left: `calc(${displayPct}% - 24px)` }}
            >
              🏎️
              <div className="pro-car-exhaust-flame" />
            </div>
          </div>
        </div>

        {/* High-tech Progress Bar */}
        <div className="pro-progress-wrapper">
          <div className="pro-progress-bar-bg">
            <div
              className="pro-progress-bar-fill"
              style={{ width: `${displayPct}%` }}
            >
              <div className="pro-progress-bar-shine" />
            </div>
          </div>
          <div className="pro-progress-readout">
            <span className="pro-progress-stage">{statusText}</span>
            <span className="pro-progress-percent">{displayPct}%</span>
          </div>
        </div>

        {/* Loading details */}
        {assetName && (
          <div className="pro-loading-file">
            <span>Loading asset:</span> <code>{assetName}</code>
          </div>
        )}
      </div>
    </div>
  );
}
