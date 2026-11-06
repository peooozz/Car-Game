/**
 * src/logic/answering.js
 * Handles MCQ answering, game pause/resume, and granting powers:
 * - Takedown Strike: Crashes rival in front and propels our car ahead!
 * - Super Nitro Booster: High-speed turbo burst with flame trails!
 * - Mega Ram Shield: Invincibility shield knocking opponents aside!
 */
import { GAME_CONFIG } from '../config';
import { soundEngine } from '../audio/audio';
import { raceRuntime, useGameStore } from '../store/gameStore';

let powerCycleIdx = 0;

export function handleMCQAnswer(chosenIndex) {
  const store = useGameStore;
  const state = store.getState();
  const q = state.activeMCQ;
  if (!q) return;

  const isCorrect = chosenIndex === q.correctLane;
  const player = raceRuntime.cars[0];

  if (isCorrect) {
    soundEngine.playCorrectChime();
    const newStreak = state.streak + 1;
    const newBestStreak = Math.max(state.bestStreakInRace, newStreak);
    const newCoins = state.raceCoins + GAME_CONFIG.correctAnswerCoinReward;

    // Cycle or pick power: takedown, nitro, shield
    const powerTypes = ['takedown', 'nitro', 'shield'];
    const chosenPower = powerTypes[powerCycleIdx % powerTypes.length];
    powerCycleIdx++;

    let feedbackTitle = '🎉 CORRECT!';
    let feedbackSub = '+2 COINS EARNED!';

    if (chosenPower === 'takedown' && player) {
      // Find the rival car directly in front of the player
      let targetRival = null;
      let minAheadDelta = Infinity;

      for (let i = 1; i < raceRuntime.cars.length; i++) {
        const rival = raceRuntime.cars[i];
        const delta = rival.totalProgress - player.totalProgress;
        if (delta > 0 && delta < minAheadDelta) {
          minAheadDelta = delta;
          targetRival = rival;
        }
      }

      if (targetRival) {
        // Crash the rival ahead
        targetRival.stunTimer = 2.6;
        targetRival.speed = 0;
        targetRival.spinAngle += 12.0;

        // Big explosion & sparks on that rival
        raceRuntime.spawnParticleBurst(targetRival.worldPos, '#ff4500', 36, 1.4, 'burst');
        soundEngine.playHitExplosion();

        // Propel our car directly in front of the crashed rival!
        player.totalProgress = targetRival.totalProgress + 0.012;
        player.speed = Math.max(player.speed, 34);
        player.boostTimer = 2.0;
        player.boostKind = 'super';
        raceRuntime.spawnParticleBurst(player.worldPos, '#00e1ff', 24, 1.2, 'burst');

        feedbackTitle = `🎯 TAKEDOWN! OVERTAKEN ${targetRival.name.toUpperCase()}!`;
        feedbackSub = `Rival crashed & spun out! You surged into P${targetRival.positionRank}!`;
      } else {
        // Already in 1st place! Grant Super Nitro Boost
        player.boostTimer = 2.8;
        player.boostKind = 'super';
        player.speed = 38;
        soundEngine.playTurboBoost();
        feedbackTitle = `🚀 SUPER NITRO BOOST!`;
        feedbackSub = `Leading the race! Pulling further ahead at top speed!`;
      }
    } else if (chosenPower === 'nitro' && player) {
      player.boostTimer = 3.2;
      player.boostKind = 'super';
      player.speed = 39;
      soundEngine.playTurboBoost();
      raceRuntime.spawnParticleBurst(player.worldPos, '#00e1ff', 28, 1.3, 'burst');

      feedbackTitle = `🚀 SUPER NITRO BOOST!`;
      feedbackSub = `Rocketing ahead with maximum turbo propulsion!`;
    } else if (player) {
      // Shield
      player.shieldTimer = 6.0;
      player.boostTimer = 2.0;
      player.speed = 34;
      soundEngine.playTurboBoost();
      raceRuntime.spawnParticleBurst(player.worldPos, '#ffd000', 24, 1.2, 'burst');

      feedbackTitle = `🛡️ MEGA RAM SHIELD!`;
      feedbackSub = `Invincible golden bubble active! Ram past rivals!`;
    }

    // Brief delay so user sees button turn green, then resume race seamlessly
    setTimeout(() => {
      store.setState({
        streak: newStreak,
        bestStreakInRace: newBestStreak,
        raceCoins: newCoins,
        questionsAttempted: state.questionsAttempted + 1,
        questionsCorrect: state.questionsCorrect + 1,
        paused: false,
        activeMCQ: null,
        feedback: {
          text: feedbackTitle,
          subtext: feedbackSub,
          kind: 'correct',
          expiresAt: performance.now() + 2200
        }
      });
    }, 450);
  } else {
    // Wrong answer
    soundEngine.playWrongBuzz();
    if (player) {
      player.slowTimer = GAME_CONFIG.driving.wrongAnswerDuration;
      player.speed = Math.max(12, player.speed * GAME_CONFIG.driving.wrongAnswerSlowFactor);
    }

    setTimeout(() => {
      store.setState({
        streak: 0,
        questionsAttempted: state.questionsAttempted + 1,
        paused: false,
        activeMCQ: null,
        feedback: {
          text: `CORRECT ANSWER: ${q.answer}`,
          subtext: q.revealText || `Keep racing! Next Math Bubble ahead!`,
          kind: 'wrong',
          expiresAt: performance.now() + 2200
        }
      });
    }, 1100);
  }
}
