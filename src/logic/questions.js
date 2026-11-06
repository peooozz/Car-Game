/**
 * src/logic/questions.js
 * Comprehensive K-8 curriculum math question generator covering ALL math concepts:
 * 1. add_sub_50: Addition, Subtraction & Place Values (≤ 50)
 * 2. mult_div_12: Multiplication Tables (2-12) & Division Facts
 * 3. fractions_decimals: Fractions, Decimals & Percentages (1/2, 1/4, 3/4, 50%, 25%, 10%, decimals)
 * 4. pre_algebra: Equations (2x + 5 = 19) & Order of Operations (PEMDAS)
 * 5. geometry_measure: Perimeter, Area, Triangle Angles (180°) & Metric Units
 * 6. math_grand_prix: Ultimate mixed championship speed challenges
 */

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildPlausibleChoices(correctAnswer, candidateOffsets = [-10, -3, -2, -1, 1, 2, 3, 10], allowNegative = false) {
  const distractors = new Set();
  const shuffledOffsets = shuffleArray(candidateOffsets);

  for (const offset of shuffledOffsets) {
    if (distractors.size >= 2) break;
    const candidate = correctAnswer + offset;
    if (candidate === correctAnswer) continue;
    if (!allowNegative && candidate < 0) continue;
    distractors.add(candidate);
  }

  let step = 1;
  while (distractors.size < 2) {
    const candPlus = correctAnswer + step;
    if (candPlus !== correctAnswer && (allowNegative || candPlus >= 0)) {
      distractors.add(candPlus);
    }
    if (distractors.size >= 2) break;
    const candMinus = correctAnswer - step;
    if (candMinus !== correctAnswer && (allowNegative || candMinus >= 0)) {
      distractors.add(candMinus);
    }
    step++;
  }

  const dList = Array.from(distractors).slice(0, 2);
  const allChoices = shuffleArray([correctAnswer, dList[0], dList[1]]);
  const correctLane = allChoices.indexOf(correctAnswer);

  return {
    choices: allChoices,
    correctLane
  };
}

let questionCounter = 1;

export function generateQuestion(topicId = 'add_sub_50', preferredDifficulty = null) {
  const difficulties = ['easy', 'medium', 'hard'];
  const difficulty = preferredDifficulty || difficulties[Math.floor(Math.random() * difficulties.length)];

  // Resolve mixed championship topic
  let resolvedTopic = topicId;
  if (topicId === 'math_grand_prix') {
    const allTopics = ['add_sub_50', 'mult_div_12', 'fractions_decimals', 'pre_algebra', 'geometry_measure'];
    resolvedTopic = allTopics[Math.floor(Math.random() * allTopics.length)];
  }

  let prompt = '';
  let expressionText = '';
  let answer = 0;
  let offsets = [-3, -2, -1, 1, 2, 3, 5, -5];

  switch (resolvedTopic) {
    case 'add_sub_50': {
      if (difficulty === 'easy') {
        if (Math.random() < 0.6) {
          const a = randInt(4, 20);
          const b = randInt(3, 18);
          answer = a + b;
          prompt = `${a} + ${b} = ?`;
          expressionText = `${a} + ${b}`;
        } else {
          const a = randInt(12, 30);
          const b = randInt(2, a - 2);
          answer = a - b;
          prompt = `${a} - ${b} = ?`;
          expressionText = `${a} - ${b}`;
        }
        offsets = [-2, -1, 1, 2, 3, -3];
      } else if (difficulty === 'medium') {
        if (Math.random() < 0.5) {
          const a = randInt(16, 36);
          const b = randInt(12, 50 - a);
          answer = a + b;
          prompt = `${a} + ${b} = ?`;
          expressionText = `${a} + ${b}`;
        } else {
          const a = randInt(28, 50);
          const b = randInt(9, a - 5);
          answer = a - b;
          prompt = `${a} - ${b} = ?`;
          expressionText = `${a} - ${b}`;
        }
        offsets = [-10, -2, -1, 1, 2, 10];
      } else {
        // Missing operand or 3-step
        if (Math.random() < 0.5) {
          const a = randInt(12, 28);
          const diff = randInt(6, 18);
          const c = a + diff;
          answer = diff;
          prompt = `${a} + ? = ${c}`;
          expressionText = `${a} + ${diff} = ${c}`;
        } else {
          const a = randInt(20, 35);
          const b = randInt(8, 15);
          const c = randInt(4, 12);
          answer = a + b - c;
          prompt = `${a} + ${b} - ${c} = ?`;
          expressionText = `${a} + ${b} - ${c}`;
        }
        offsets = [-4, -2, -1, 1, 2, 4];
      }
      break;
    }

    case 'mult_div_12':
    case 'mult_12': {
      if (difficulty === 'easy') {
        const isDiv = Math.random() < 0.4;
        if (!isDiv) {
          const a = randInt(2, 6);
          const b = randInt(2, 9);
          answer = a * b;
          prompt = `${a} × ${b} = ?`;
          expressionText = `${a} × ${b}`;
          offsets = [-a, a, -2, 2, -1, 1];
        } else {
          const b = randInt(2, 6);
          const q = randInt(2, 8);
          const total = b * q;
          answer = q;
          prompt = `${total} ÷ ${b} = ?`;
          expressionText = `${total} ÷ ${b}`;
          offsets = [-2, -1, 1, 2];
        }
      } else if (difficulty === 'medium') {
        const isDiv = Math.random() < 0.45;
        if (!isDiv) {
          const a = randInt(6, 9);
          const b = randInt(6, 10);
          answer = a * b;
          prompt = `${a} × ${b} = ?`;
          expressionText = `${a} × ${b}`;
          offsets = [-a, a, -b, b, -3, 3];
        } else {
          const b = randInt(6, 9);
          const q = randInt(4, 9);
          const total = b * q;
          answer = q;
          prompt = `${total} ÷ ${b} = ?`;
          expressionText = `${total} ÷ ${b}`;
          offsets = [-2, -1, 1, 2, 3];
        }
      } else {
        const a = randInt(7, 12);
        const b = randInt(8, 12);
        answer = a * b;
        prompt = `${a} × ${b} = ?`;
        expressionText = `${a} × ${b}`;
        offsets = [-a, a, -b, b, -4, 4];
      }
      break;
    }

    case 'fractions_decimals':
    case 'squares_fractions': {
      if (difficulty === 'easy') {
        // Halves and Quarters of whole numbers
        const type = Math.random();
        if (type < 0.5) {
          const halfs = [6, 8, 10, 12, 16, 20, 24, 30, 40, 50];
          const total = halfs[randInt(0, halfs.length - 1)];
          answer = total / 2;
          prompt = `1/2 of ${total} = ?`;
          expressionText = `1/2 of ${total}`;
          offsets = [-2, -1, 1, 2, 4];
        } else {
          const quarters = [8, 12, 16, 20, 24, 28, 32, 40];
          const total = quarters[randInt(0, quarters.length - 1)];
          answer = total / 4;
          prompt = `1/4 of ${total} = ?`;
          expressionText = `1/4 of ${total}`;
          offsets = [-2, -1, 1, 2];
        }
      } else if (difficulty === 'medium') {
        // 3/4 or Percentages: 50%, 25%, 10%
        const roll = Math.random();
        if (roll < 0.4) {
          const quarters = [12, 16, 20, 24, 28, 36, 40];
          const total = quarters[randInt(0, quarters.length - 1)];
          answer = (total / 4) * 3;
          prompt = `3/4 of ${total} = ?`;
          expressionText = `3/4 of ${total}`;
          offsets = [-3, -1, 1, 3, 6];
        } else if (roll < 0.7) {
          const val = [20, 40, 60, 80, 100, 120][randInt(0, 5)];
          answer = val * 0.5;
          prompt = `50% of ${val} = ?`;
          expressionText = `50% of ${val}`;
          offsets = [-5, -2, 2, 5, 10];
        } else {
          const val = [30, 50, 70, 90, 120, 150][randInt(0, 5)];
          answer = val * 0.1;
          prompt = `10% of ${val} = ?`;
          expressionText = `10% of ${val}`;
          offsets = [-2, -1, 1, 2, 5];
        }
      } else {
        // Square roots & decimal sums
        if (Math.random() < 0.5) {
          const root = randInt(5, 12);
          const sq = root * root;
          answer = root;
          prompt = `√${sq} = ?`;
          expressionText = `√${sq}`;
          offsets = [-2, -1, 1, 2, 3];
        } else {
          const n = randInt(4, 11);
          answer = n * n;
          prompt = `${n}² = ?`;
          expressionText = `${n}²`;
          offsets = [-n, n, -4, 4];
        }
      }
      break;
    }

    case 'pre_algebra':
    case 'equations': {
      if (difficulty === 'easy') {
        const x = randInt(3, 16);
        const b = randInt(4, 15);
        const sum = x + b;
        answer = x;
        prompt = `x + ${b} = ${sum},  x = ?`;
        expressionText = `x = ${x}`;
        offsets = [-3, -2, -1, 1, 2, 3];
      } else if (difficulty === 'medium') {
        const a = randInt(2, 6);
        const x = randInt(3, 9);
        const b = randInt(2, 10);
        const result = a * x + b;
        answer = x;
        prompt = `${a}x + ${b} = ${result},  x = ?`;
        expressionText = `x = ${x}`;
        offsets = [-3, -2, -1, 1, 2, 3];
      } else {
        // Order of Operations (PEMDAS)
        const roll = Math.random();
        if (roll < 0.5) {
          const a = randInt(4, 12);
          const b = randInt(3, 7);
          const c = randInt(2, 6);
          answer = a + b * c;
          prompt = `${a} + ${b} × ${c} = ?`;
          expressionText = `${a} + ${b} × ${c}`;
          offsets = [-(b * c), (a + b) * c - answer, -3, 3, -5, 5];
        } else {
          const a = randInt(20, 45);
          const b = randInt(2, 5);
          const c = randInt(3, 6);
          answer = a - b * c;
          prompt = `${a} - ${b} × ${c} = ?`;
          expressionText = `${a} - ${b} × ${c}`;
          offsets = [-4, -2, 2, 4, 6];
        }
      }
      break;
    }

    case 'geometry_measure': {
      if (difficulty === 'easy') {
        // Perimeter of a square or rectangle
        if (Math.random() < 0.5) {
          const side = randInt(3, 12);
          answer = side * 4;
          prompt = `Square side = ${side}m,  Perimeter = ?`;
          expressionText = `4 × ${side}m`;
          offsets = [-side, side, -4, 4];
        } else {
          const len = randInt(5, 12);
          const wid = randInt(2, 6);
          answer = 2 * (len + wid);
          prompt = `Rectangle ${len}m × ${wid}m,  Perimeter = ?`;
          expressionText = `2 × (${len} + ${wid})`;
          offsets = [-4, -2, 2, 4, 6];
        }
      } else if (difficulty === 'medium') {
        // Area of rectangle or square
        if (Math.random() < 0.55) {
          const len = randInt(4, 10);
          const wid = randInt(3, 8);
          answer = len * wid;
          prompt = `Rectangle ${len}m × ${wid}m,  Area = ?`;
          expressionText = `${len} × ${wid}`;
          offsets = [-len, len, -wid, wid, -4, 4];
        } else {
          const side = randInt(4, 10);
          answer = side * side;
          prompt = `Square side = ${side}m,  Area = ?`;
          expressionText = `${side}²`;
          offsets = [-side, side, -3, 3];
        }
      } else {
        // Triangle Angles sum to 180°
        if (Math.random() < 0.6) {
          const a = randInt(40, 75);
          const b = randInt(35, 75);
          answer = 180 - a - b;
          prompt = `Triangle angles ${a}° and ${b}°,  3rd angle = ?`;
          expressionText = `180° - (${a}° + ${b}°)`;
          offsets = [-10, 10, -5, 5, -2, 2];
        } else {
          // Unit conversion
          const km = randInt(2, 9);
          answer = km * 1000;
          prompt = `${km} Kilometers = ? Meters`;
          expressionText = `${km} × 1000m`;
          offsets = [-1000, 1000, -500, 500, -200];
        }
      }
      break;
    }

    default: {
      const a = randInt(5, 20);
      const b = randInt(3, 15);
      answer = a + b;
      prompt = `${a} + ${b} = ?`;
      expressionText = `${a} + ${b}`;
      offsets = [-2, -1, 1, 2];
      break;
    }
  }

  const { choices, correctLane } = buildPlausibleChoices(answer, offsets, false);

  return {
    id: `q_${questionCounter++}`,
    topicId,
    difficulty,
    prompt,
    expressionText,
    revealText: prompt.includes('x = ?')
      ? `${prompt.replace(',  x = ?', '')}  ⇒  x = ${answer}`
      : `${expressionText} = ${answer}`,
    answer,
    choices,
    correctLane,
    tryNumber: 1
  };
}

export function buildRetryQuestion(question) {
  const { choices, correctLane } = buildPlausibleChoices(
    question.answer,
    [-4, -2, -1, 1, 2, 4],
    false
  );
  return {
    ...question,
    choices,
    correctLane,
    tryNumber: 2
  };
}
