/**
 * NECUZAH Super Abacus
 * Adaptive learning engine.
 *
 * Adjusts practice difficulty using recent learner performance.
 * Encourages mastery without punishing mistakes.
 */

const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;
const HISTORY_LIMIT = 20;

export function createLearningState(initialDifficulty = 1) {
  return {
    difficulty: clampDifficulty(initialDifficulty),
    attempts: 0,
    correct: 0,
    streak: 0,
    recentResults: [],
    masteredSkills: []
  };
}

export function recordResult(state, isCorrect, skillId = "general") {
  const next = {
    ...state,
    attempts: state.attempts + 1,
    correct: state.correct + (isCorrect ? 1 : 0),
    streak: isCorrect ? state.streak + 1 : 0,
    recentResults: [
      ...state.recentResults,
      Boolean(isCorrect)
    ].slice(-HISTORY_LIMIT)
  };

  const accuracy = getRecentAccuracy(next);
  let difficulty = next.difficulty;

  // Increase gradually after a consistent run of correct answers.
  if (
    next.streak >= 3 &&
    next.recentResults.length >= 3 &&
    accuracy >= 0.8
  ) {
    difficulty += 1;
    next.streak = 0;
  }

  // Reduce difficulty gently when the learner needs more practice.
  else if (
    next.recentResults.length >= 5 &&
    accuracy < 0.4
  ) {
    difficulty -= 1;
    next.streak = 0;
  }

  next.difficulty = clampDifficulty(difficulty);

  if (
    skillId &&
    next.recentResults.length >= 5 &&
    accuracy >= 0.8 &&
    !next.masteredSkills.includes(skillId)
  ) {
    next.masteredSkills = [...next.masteredSkills, skillId];
  }

  return next;
}

export function getRecentAccuracy(state) {
  const results = state.recentResults || [];

  if (results.length === 0) return 0;

  const correctCount = results.filter(Boolean).length;
  return correctCount / results.length;
}

export function getLearningFeedback(state) {
  const accuracy = getRecentAccuracy(state);

  if (state.attempts === 0) {
    return {
      level: "starting",
      message: "Let's learn together. Take your time!"
    };
  }

  if (state.streak >= 3) {
    return {
      level: "excellent",
      message: "Wonderful work! You're building confidence."
    };
  }

  if (accuracy < 0.4 && state.recentResults.length >= 5) {
    return {
      level: "support",
      message: "Let's slow down and practise this skill together."
    };
  }

  if (accuracy >= 0.8) {
    return {
      level: "progress",
      message: "Great progress! Keep up the careful thinking."
    };
  }

  return {
    level: "encouragement",
    message: "Every question helps you learn. Keep going!"
  };
}

export function hasMasteredSkill(state, skillId) {
  return (state.masteredSkills || []).includes(skillId);
}

function clampDifficulty(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return MIN_DIFFICULTY;

  return Math.max(
    MIN_DIFFICULTY,
    Math.min(MAX_DIFFICULTY, Math.round(number))
  );
}
