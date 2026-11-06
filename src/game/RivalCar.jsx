/**
 * src/game/RivalCar.jsx
 * Wrapper for AI rival car (indices 1..5 in raceRuntime.cars).
 */
import React from 'react';
import { Car } from './Car';

export function RivalCar({ carIndex }) {
  return <Car carIndex={carIndex} />;
}
