/**
 * src/ui/TouchControls.jsx
 * Multi-touch on-screen controls for mobile/tablet and touch-enabled devices:
 * - Left / Right steering buttons
 * - Auto-accelerate toggle (enabled automatically when touch is used)
 * - Drift (hold) button & Fire Weapon button
 */
import React from 'react';
import { raceRuntime, useGameStore } from '../store/gameStore';
import { soundEngine } from '../audio/audio';

export function TouchControls() {
  const weapon = useGameStore((s) => s.weapon);

  const setControl = (key, val) => (e) => {
    if (e.cancelable) e.preventDefault();
    soundEngine.unlock();
    raceRuntime.controls.isTouch = true;
    raceRuntime.controls[key] = val;
  };

  const handleFire = (e) => {
    if (e.cancelable) e.preventDefault();
    soundEngine.unlock();
    raceRuntime.controls.isTouch = true;
    raceRuntime.controls.fire = true;
  };

  return (
    <div className="touch-controls-container">
      {/* Left Side: Steer Left & Steer Right */}
      <div className="touch-pad-left">
        <button
          type="button"
          className="touch-btn steer-btn"
          onTouchStart={setControl('left', true)}
          onTouchEnd={setControl('left', false)}
          onTouchCancel={setControl('left', false)}
          onMouseDown={setControl('left', true)}
          onMouseUp={setControl('left', false)}
          onMouseLeave={setControl('left', false)}
          aria-label="Steer Left"
        >
          ◀
        </button>
        <button
          type="button"
          className="touch-btn steer-btn"
          onTouchStart={setControl('right', true)}
          onTouchEnd={setControl('right', false)}
          onTouchCancel={setControl('right', false)}
          onMouseDown={setControl('right', true)}
          onMouseUp={setControl('right', false)}
          onMouseLeave={setControl('right', false)}
          aria-label="Steer Right"
        >
          ▶
        </button>
      </div>

      {/* Right Side: Fire Weapon, Drift, Brake */}
      <div className="touch-pad-right">
        <button
          type="button"
          className={`touch-btn fire-btn ${weapon ? 'fire-active' : ''}`}
          onTouchStart={handleFire}
          onClick={handleFire}
          aria-label="Fire Weapon"
        >
          🚀 FIRE
        </button>
        <button
          type="button"
          className="touch-btn drift-btn"
          onTouchStart={setControl('drift', true)}
          onTouchEnd={setControl('drift', false)}
          onTouchCancel={setControl('drift', false)}
          onMouseDown={setControl('drift', true)}
          onMouseUp={setControl('drift', false)}
          onMouseLeave={setControl('drift', false)}
          aria-label="Hold to Drift"
        >
          💨 DRIFT
        </button>
        <button
          type="button"
          className="touch-btn brake-btn"
          onTouchStart={setControl('brake', true)}
          onTouchEnd={setControl('brake', false)}
          onTouchCancel={setControl('brake', false)}
          onMouseDown={setControl('brake', true)}
          onMouseUp={setControl('brake', false)}
          onMouseLeave={setControl('brake', false)}
          aria-label="Brake"
        >
          🛑 BRAKE
        </button>
      </div>
    </div>
  );
}
