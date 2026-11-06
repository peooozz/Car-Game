/**
 * src/game/PlayerCar.jsx
 * Wrapper for player car (index 0 in raceRuntime.cars).
 */
import React from 'react';
import { Car } from './Car';

export function PlayerCar() {
  return <Car carIndex={0} />;
}
