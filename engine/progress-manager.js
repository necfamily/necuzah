/**
 * NECUZAH Super Abacus
 * Learner progress and achievement manager.
 *
 * Stores progress locally on the current device.
 * Cloud synchronisation can be added through a secure backend later.
 */

const STORAGE_KEY = "necuzah.learner-progress.v1";

const DEFAULT_PROGRESS = {
  learnerId: null,
  totalQuestions: 0,
  correctAnswers: 0,
  stars: 0,
  coins: 0,
  completedSkills: [],
  skillStats: {},
  achievements: [],
  updatedAt: null
};

function createId() {
  return `learner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normaliseProgress(value = {}) {
  return {
    ...DEFAULT_PROGRESS,
    ...value,
    completedSkills: Array.isArray(value.completedSkills)
      ? value.completedSkills
      : [],
    skillStats: value.skillStats && typeof value.skillStats === "object"
      ? value.skillStats
      : {},
    achievements: Array.isArray(value.achievements)
      ? value.achievements
      : []
  };
}

function getStorage() {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export function createProgress(learnerId = null) {
  return normaliseProgress({
    learnerId: learnerId || createId(),
    updatedAt: new Date().toISOString()
  });
}

export function loadProgress(learnerId = null) {
  const storage = getStorage();

  if (!storage) {
    return createProgress(learnerId);
  }

  try {
    const saved = storage.getItem(STORAGE_KEY);

    if (!saved) {
      return createProgress(learnerId);
    }

    const progress = normaliseProgress(JSON.parse(saved));

    if (learnerId && progress.learnerId !== learnerId) {
      return createProgress(learnerId);
    }

    return progress;
  } catch {
    return createProgress(learnerId);
  }
}

export function saveProgress(progress) {
  const updated = normaliseProgress({
    ...progress,
    updatedAt: new Date().toISOString()
  });

  const storage = getStorage();

  if (!storage) {
    return {
      saved: false,
      progress: updated,
      message: "Local storage is unavailable on this device."
    };
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return {
      saved: true,
      progress: updated,
      message: "Progress saved on this device."
    };
  } catch {
    return {
      saved: false,
      progress: updated,
      message: "Progress could not be saved. Check device storage."
    };
  }
}

export function recordAnswer(progress, {
  skillId = "general",
  correct = false
} = {}) {
  const current = normaliseProgress(progress);
  const previous = current.skillStats[skillId] || {
    attempts: 0,
    correct: 0,
    streak: 0
  };

  const wasCorrect = Boolean(correct);

  const skillStats = {
    ...current.skillStats,
    [skillId]: {
      attempts: previous.attempts + 1,
      correct: previous.correct + (wasCorrect ? 1 : 0),
      streak: wasCorrect ? previous.streak + 1 : 0
    }
  };

  const next = {
    ...current,
    totalQuestions: current.totalQuestions + 1,
    correctAnswers: current.correctAnswers + (wasCorrect ? 1 : 0),
    stars: current.stars + (wasCorrect ? 1 : 0),
    coins: current.coins + (wasCorrect ? 5 : 0),
    skillStats
  };

  const achievements = [...next.achievements];

  if (
    next.correctAnswers >= 10 &&
    !achievements.includes("first-ten-correct")
  ) {
    achievements.push("first-ten-correct");
  }

  if (
    next.correctAnswers >= 50 &&
    !achievements.includes("fifty-correct")
  ) {
    achievements.push("fifty-correct");
  }

  next.achievements = achievements;

  return normaliseProgress(next);
}

export function completeSkill(progress, skillId) {
  if (!skillId) return normaliseProgress(progress);

  const current = normaliseProgress(progress);

  if (current.completedSkills.includes(skillId)) {
    return current;
  }

  return normaliseProgress({
    ...current,
    completedSkills: [...current.completedSkills, skillId]
  });
}

export function getProgressSummary(progress) {
  const current = normaliseProgress(progress);

  const accuracy = current.totalQuestions > 0
    ? Math.round(
        (current.correctAnswers / current.totalQuestions) * 100
      )
    : 0;

  return {
    totalQuestions: current.totalQuestions,
    correctAnswers: current.correctAnswers,
    accuracy,
    stars: current.stars,
    coins: current.coins,
    completedSkills: current.completedSkills.length,
    achievements: [...current.achievements]
  };
}

export function resetProgress(learnerId = null) {
  const fresh = createProgress(learnerId);
  const result = saveProgress(fresh);

  return {
    ...result,
    message: result.saved
      ? "Progress reset on this device."
      : "New progress created, but could not be saved."
  };
}
