/**
 * src/ui/MCQModal.jsx
 * Interactive MCQ challenge popup that pauses the race when hitting a Math Bubble.
 * Offers 3-4 clickable answer buttons with keyboard shortcuts (1, 2, 3 / A, B, C).
 * Solving it resumes the race and unleashes a super power (Takedown crash, Nitro, or Shield)!
 */
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { handleMCQAnswer } from '../logic/answering';
import { soundEngine } from '../audio/audio';

export function MCQModal() {
  const activeMCQ = useGameStore((s) => s.activeMCQ);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    setSelectedIdx(null);
    setIsEvaluating(false);
  }, [activeMCQ]);

  // Keyboard shortcut support (1, 2, 3 or A, B, C)
  useEffect(() => {
    if (!activeMCQ || isEvaluating) return;

    const handleKey = (e) => {
      const k = e.key.toLowerCase();
      let chosen = -1;
      if (k === '1' || k === 'a') chosen = 0;
      else if (k === '2' || k === 'b') chosen = 1;
      else if (k === '3' || k === 'c') chosen = 2;
      else if (k === '4' || k === 'd') chosen = 3;

      if (chosen >= 0 && chosen < (activeMCQ.choices?.length || 0)) {
        e.preventDefault();
        onSelectAnswer(chosen);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeMCQ, isEvaluating]);

  if (!activeMCQ) return null;

  const onSelectAnswer = (idx) => {
    if (isEvaluating) return;
    soundEngine.unlock();
    setSelectedIdx(idx);
    setIsEvaluating(true);
    handleMCQAnswer(idx);
  };

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="mcq-modal-backdrop">
      <div className="mcq-modal-card">
        <div className="mcq-header">
          <span className="mcq-bubble-icon">🫧</span>
          <span className="mcq-badge">MATH BUBBLE CHALLENGE</span>
          <span className={`mcq-tier-pill tier-${activeMCQ.difficulty || 'medium'}`}>
            {(activeMCQ.difficulty || 'MEDIUM').toUpperCase()}
          </span>
        </div>

        <div className="mcq-prompt-box">
          <h2>{activeMCQ.prompt}</h2>
        </div>

        <div className="mcq-choices-grid">
          {(activeMCQ.choices || []).map((choice, idx) => {
            const isSelected = selectedIdx === idx;
            const isCorrect = idx === activeMCQ.correctLane;
            let statusClass = '';
            if (isEvaluating) {
              if (isCorrect) statusClass = 'choice-correct';
              else if (isSelected) statusClass = 'choice-wrong';
            }

            return (
              <button
                key={idx}
                type="button"
                className={`mcq-choice-btn ${isSelected ? 'selected' : ''} ${statusClass}`}
                onClick={() => onSelectAnswer(idx)}
                disabled={isEvaluating}
              >
                <span className="choice-key-badge">{letters[idx]}</span>
                <span className="choice-val">{choice}</span>
              </button>
            );
          })}
        </div>

        <div className="mcq-hint-footer">
          <span>💡 Tap or press <strong>A</strong>, <strong>B</strong>, <strong>C</strong> to answer & unleash Power!</span>
        </div>
      </div>
    </div>
  );
}

