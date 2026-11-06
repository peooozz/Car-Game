/**
 * src/ui/Garage.jsx
 * Data-driven Garage displaying all 6 Formula 3D racers from `/public/assets/manifest.json`.
 * Allows unlocking cars with coins and selecting active buggy.
 */
import React from 'react';
import { useGameStore } from '../store/gameStore';

export function Garage() {
  const manifest = useGameStore((s) => s.manifest);
  const coins = useGameStore((s) => s.coins);
  const unlockedCars = useGameStore((s) => s.unlockedCars);
  const selectedCarId = useGameStore((s) => s.selectedCarId);
  const selectOrUnlockCar = useGameStore((s) => s.selectOrUnlockCar);
  const setScreen = useGameStore((s) => s.setScreen);

  const cars = manifest?.cars || [];

  return (
    <div className="screen-overlay sub-screen">
      <div className="sub-screen-panel">
        <div className="sub-header">
          <button type="button" className="btn-back" onClick={() => setScreen('menu')}>
            ⬅ BACK
          </button>
          <h2>SPEEDWAY RACING GARAGE</h2>
          <div className="coin-balance-pill">🪙 {coins} COINS</div>
        </div>

        <div className="garage-grid">
          {cars.map((car) => {
            const isUnlocked = unlockedCars.includes(car.id);
            const isSelected = selectedCarId === car.id;
            const canAfford = coins >= (car.unlockCost || 0);
            const speedPct = Math.min(100, Math.round(((car.stats?.maxSpeed || 40) / 46) * 100));
            const accelPct = Math.min(100, Math.round(((car.stats?.acceleration || 25) / 32) * 100));
            const handlPct = Math.min(100, Math.round(((car.stats?.handling || 2.75) / 3.4) * 100));
            const boostPct = Math.min(100, Math.round((((car.stats?.driftBoost || 1.15) - 1.0) / 0.3) * 100));

            return (
              <div
                key={car.id}
                className={`garage-card ${isSelected ? 'selected' : ''}`}
              >
                <div
                  className="garage-color-swatch"
                  style={{
                    background: `linear-gradient(135deg, ${car.color || '#e10600'}, ${car.accentColor || '#111827'})`
                  }}
                >
                  <span className="car-file-tag">{car.file.split('/').pop()}</span>
                </div>

                <h3>{car.name}</h3>

                <div className="stat-bars">
                  <div className="stat-row">
                    <span>Top Speed ({car.stats?.maxSpeed} u/s)</span>
                    <div className="stat-track">
                      <div className="stat-fill" style={{ width: `${speedPct}%` }} />
                    </div>
                  </div>
                  <div className="stat-row">
                    <span>Acceleration ({car.stats?.acceleration})</span>
                    <div className="stat-track">
                      <div className="stat-fill" style={{ width: `${accelPct}%` }} />
                    </div>
                  </div>
                  <div className="stat-row">
                    <span>Handling ({car.stats?.handling})</span>
                    <div className="stat-track">
                      <div className="stat-fill" style={{ width: `${handlPct}%` }} />
                    </div>
                  </div>
                  <div className="stat-row">
                    <span>Drift Turbo ({car.stats?.driftBoost}x)</span>
                    <div className="stat-track">
                      <div className="stat-fill" style={{ width: `${boostPct}%`, backgroundColor: '#ff9800' }} />
                    </div>
                  </div>
                </div>

                <div className="garage-action">
                  {isSelected ? (
                    <button type="button" className="btn-selected full-width" disabled>
                      ✅ EQUIPPED
                    </button>
                  ) : isUnlocked ? (
                    <button
                      type="button"
                      className="btn-primary full-width"
                      onClick={() => selectOrUnlockCar(car.id)}
                    >
                      SELECT RACER
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`btn-unlock full-width ${!canAfford ? 'disabled' : ''}`}
                      disabled={!canAfford}
                      onClick={() => selectOrUnlockCar(car.id)}
                    >
                      🔓 UNLOCK FOR 🪙 {car.unlockCost}
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
