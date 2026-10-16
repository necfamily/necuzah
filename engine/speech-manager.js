/**
 * NECUZAH Super Abacus
 * Speech output and optional speech recognition.
 *
 * Uses browser capabilities when available.
 * Text input remains available when speech recognition is unsupported.
 */

export function getSpeechCapabilities() {
  return {
    speechOutput:
      typeof window !== "undefined" &&
      "speechSynthesis" in window,

    speechInput:
      typeof window !== "undefined" &&
      (
        "SpeechRecognition" in window ||
        "webkitSpeechRecognition" in window
      )
  };
}

export function speak(text, options = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return {
      supported: false,
      message: "Speech output is not available in this browser."
    };
  }

  const message = String(text ?? "").trim();

  if (!message) {
    return {
      supported: true,
      message: "There is nothing to speak."
    };
  }

  const {
    language = "en",
    rate = 0.9,
    pitch = 1,
    volume = 1
  } = options;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = language;
  utterance.rate = clamp(rate, 0.5, 1.5);
  utterance.pitch = clamp(pitch, 0.5, 2);
  utterance.volume = clamp(volume, 0, 1);

  window.speechSynthesis.speak(utterance);

  return {
    supported: true,
    message: "Speech started."
  };
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function listenOnce(options = {}) {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Speech recognition requires a browser.")
    );
  }

  const Recognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!Recognition) {
    return Promise.reject(
      new Error("Speech input is unavailable. Please type your answer.")
    );
  }

  const {
    language = "en",
    timeout = 10000
  } = options;

  return new Promise((resolve, reject) => {
    const recognition = new Recognition();
    let settled = false;

    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      recognition.stop();
      reject(new Error("No speech detected. Please try again or type."));
    }, clamp(timeout, 2000, 20000));

    recognition.onresult = (event) => {
      if (settled) return;

      const transcript =
        event.results?.[0]?.[0]?.transcript?.trim() ?? "";

      if (!transcript) {
        settled = true;
        window.clearTimeout(timer);
        reject(new Error("I could not understand that. Please try again."));
        return;
      }

      settled = true;
      window.clearTimeout(timer);

      resolve({
        transcript,
        confidence: event.results[0][0].confidence ?? null
      });
    };

    recognition.onerror = (event) => {
      if (settled) return;

      settled = true;
      window.clearTimeout(timer);

      reject(
        new Error(
          event.error === "not-allowed"
            ? "Microphone access was denied. You can type your answer."
            : "Speech recognition failed. Please try again or type."
        )
      );
    };

    recognition.onend = () => {
      if (settled) return;

      settled = true;
      window.clearTimeout(timer);
      reject(new Error("Listening ended. Please try again or type."));
    };

    try {
      recognition.start();
    } catch {
      settled = true;
      window.clearTimeout(timer);
      reject(new Error("Could not start listening. Please try again."));
    }
  });
}

export function parseSpokenNumber(transcript) {
  const text = String(transcript ?? "")
    .toLowerCase()
    .trim()
    .replace(/,/g, "")
    .replace(/[.!?]/g, "");

  if (!text) return null;

  const numeric = Number(text);

  if (Number.isFinite(numeric)) {
    return numeric;
  }

  const words = {
    zero: 0,
    oh: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100,
    thousand: 1000
  };

  const tokens = text
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter((word) => word !== "and");

  if (!tokens.every((word) => word in words)) {
    return null;
  }

  let total = 0;
  let current = 0;

  for (const token of tokens) {
    const value = words[token];

    if (value === 100) {
      current = Math.max(1, current) * 100;
    } else if (value === 1000) {
      total += Math.max(1, current) * 1000;
      current = 0;
    } else {
      current += value;
    }
  }

  return total + current;
}

function clamp(value, minimum, maximum) {
  const number = Number(value);

  if (!Number.isFinite(number)) return minimum;

  return Math.max(minimum, Math.min(maximum, number));
}
