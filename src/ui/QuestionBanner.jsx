/**
 * src/ui/QuestionBanner.jsx
 * Displays the large Math Question banner (~60 units before a Math Zone gate)
 * with the 3 lane choices and any active retry/correct-answer feedback toast.
 */
import React from 'react';
import { useGameStore } from '../store/gameStore';

export function QuestionBanner() {
  const activeQuestion = useGameStore((s) => s.activeQuestion);
  const feedback = useGameStore((s) => s.feedback);

  return (
    <div className="question-banner-wrapper">
      {activeQuestion && (
        <div className={`question-card tier-${activeQuestion.difficulty}`}>
          <div className="question-badges">
            <span className="badge-tier">
              {activeQuestion.difficulty.toUpperCase()} QUESTION
            </span>
            {activeQuestion.tryNumber === 2 && (
              <span className="badge-retry">2ND TRY (RETRY GATE)</span>
            )}
          </div>
          <div className="question-prompt">{activeQuestion.prompt}</div>
          <div className="question-lanes-preview">
            {activeQuestion.choices.map((val, idx) => (
              <div key={idx} className="lane-pill">
                <span className="lane-label">
                  {idx === 0 ? '⬅ LEFT' : idx === 1 ? '⬆ CENTER' : '➡ RIGHT'}
                </span>
                <span className="lane-value">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {feedback && (
        <div className={`feedback-toast feedback-${feedback.kind}`}>
          <div className="feedback-title">{feedback.text}</div>
          {feedback.subtext && <div className="feedback-sub">{feedback.subtext}</div>}
        </div>
      )}
    </div>
  );
}
