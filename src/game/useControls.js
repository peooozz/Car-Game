/**
 * src/game/useControls.js
 * Keyboard, focus/blur auto-pause, and F2 debug toggle listener.
 * StrictMode-safe: cleans up all listeners on unmount and resets control flags.
 */
import { useEffect } from 'react';
import { raceRuntime, useGameStore } from '../store/gameStore';
import { soundEngine } from '../audio/audio';

export function useControls() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      soundEngine.unlock();
      const code = e.code;
      const key = e.key?.toLowerCase();

      if (code === 'F2') {
        e.preventDefault();
        useGameStore.getState().toggleDebugMode();
        return;
      }

      if (code === 'KeyP' || code === 'Escape') {
        const st = useGameStore.getState();
        if (st.screen === 'racing') {
          e.preventDefault();
          st.togglePause();
        }
        return;
      }

      const c = raceRuntime.controls;
      if (code === 'KeyW' || code === 'ArrowUp' || key === 'w') {
        c.accelerate = true;
      }
      if (code === 'KeyS' || code === 'ArrowDown' || key === 's') {
        c.brake = true;
      }
      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a') {
        c.left = true;
      }
      if (code === 'KeyD' || code === 'ArrowRight' || key === 'd') {
        c.right = true;
      }
      if (code === 'Space') {
        c.drift = true;
      }
      if (code === 'KeyE' || code === 'ControlLeft' || code === 'ControlRight' || key === 'e') {
        c.fire = true;
      }
    };

    const handleKeyUp = (e) => {
      const code = e.code;
      const key = e.key?.toLowerCase();
      const c = raceRuntime.controls;

      if (code === 'KeyW' || code === 'ArrowUp' || key === 'w') {
        c.accelerate = false;
      }
      if (code === 'KeyS' || code === 'ArrowDown' || key === 's') {
        c.brake = false;
      }
      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a') {
        c.left = false;
      }
      if (code === 'KeyD' || code === 'ArrowRight' || key === 'd') {
        c.right = false;
      }
      if (code === 'Space') {
        c.drift = false;
      }
      if (code === 'KeyE' || code === 'ControlLeft' || code === 'ControlRight' || key === 'e') {
        c.fire = false;
      }
    };

    const handleBlur = () => {
      const c = raceRuntime.controls;
      c.accelerate = false;
      c.brake = false;
      c.left = false;
      c.right = false;
      c.drift = false;
      c.fire = false;
      const st = useGameStore.getState();
      if (st.screen === 'racing' && !st.paused) {
        st.setPaused(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBlur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
