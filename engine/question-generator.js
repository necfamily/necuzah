/**
 * NECUZAH Super Abacus
 * Creates age-appropriate arithmetic practice questions.
 */

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateQuestion(options = {}) {
  const {
    operation = "addition",
    difficulty = 1,
    maxNumber = null,
    allowNegative = false
  } = options;

  const level = Math.max(1, Math.min(10, Number(difficulty) || 1));
  const limit = maxNumber === null
    ? Math.min(9 * level, 999)
    : Math.max(1, Math.min(9999, Number(maxNumber) || 9));

  let a = randomInteger(0, limit);
  let b = randomInteger(0, limit);
  let symbol;

  switch (operation) {
    case "addition":
      symbol = "+";
      break;

    case "subtraction":
      symbol = "−";
      if (!allowNegative && b > a) {
        [a, b] = [b, a];
      }
      break;

    case "mixed":
      if (Math.random() < 0.5) {
        symbol = "+";
      } else {
        symbol = "−";
        if (!allowNegative && b > a) {
          [a, b] = [b, a];
        }
      }
      break;

    default:
      throw new Error("Choose addition, subtraction, or mixed practice.");
  }

  const answer = symbol === "+" ? a + b : a - b;

  // Keep the existing symbol and expression unchanged.
  // Provide a consistent spoken operation for compatible pages.
  const spokenSymbol = symbol === "−" ? "minus" : "plus";

  return Object.freeze({
    id: createQuestionId(),
    a,
    b,
    symbol,
    spokenSymbol,
    answer,
    expression: `${a} ${symbol} ${b}`,
    difficulty: level,
    createdAt: new Date().toISOString()
  });
}

function createQuestionId() {
  return `nec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function checkAnswer(question, response) {
  if (!question || !Number.isFinite(question.answer)) {
    return {
      valid: false,
      correct: false,
      message: "This question is not valid. Please try another."
    };
  }

  const text = String(response).trim().replace(/,/g, "");
  if (text === "") {
    return {
      valid: false,
      correct: false,
      message: "Enter your answer first."
    };
  }

  const answer = Number(text);
  if (!Number.isFinite(answer)) {
    return {
      valid: false,
      correct: false,
      message: "Please enter a number."
    };
  }

  const correct = answer === question.answer;

  return {
    valid: true,
    correct,
    expectedAnswer: question.answer,
    message: correct
      ? "Excellent! You got it right."
      : "Good try! Let's work it out together."
  };
}
