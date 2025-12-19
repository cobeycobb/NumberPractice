const state = {
  currentNumber: null,
  currentMode: null,
  expectedKana: "",
  expectedRomaji: "",
  expectedDigits: "",
  readyForNext: false,
};

const elements = {
  mode: document.getElementById("mode"),
  min: document.getElementById("min"),
  max: document.getElementById("max"),
  allowRomaji: document.getElementById("allowRomaji"),
  newPrompt: document.getElementById("newPrompt"),
  prompt: document.getElementById("prompt"),
  direction: document.getElementById("direction"),
  answerForm: document.getElementById("answerForm"),
  answerInput: document.getElementById("answerInput"),
  feedback: document.getElementById("feedback"),
  answerKey: document.getElementById("answerKey"),
  reveal: document.getElementById("reveal"),
};

const onesKana = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"];
const onesRomaji = ["", "ichi", "ni", "san", "yon", "go", "roku", "nana", "hachi", "kyuu"];

function numberToJapaneseBelow10000(num) {
  const partsKana = [];
  const partsRomaji = [];

  const thousands = Math.floor(num / 1000);
  const hundreds = Math.floor((num % 1000) / 100);
  const tens = Math.floor((num % 100) / 10);
  const ones = num % 10;

  if (thousands) {
    if (thousands === 1) {
      partsKana.push("せん");
      partsRomaji.push("sen");
    } else if (thousands === 3) {
      partsKana.push("さんぜん");
      partsRomaji.push("sanzen");
    } else if (thousands === 8) {
      partsKana.push("はっせん");
      partsRomaji.push("hassen");
    } else {
      partsKana.push(`${onesKana[thousands]}せん`);
      partsRomaji.push(`${onesRomaji[thousands]}sen`);
    }
  }

  if (hundreds) {
    if (hundreds === 1) {
      partsKana.push("ひゃく");
      partsRomaji.push("hyaku");
    } else if (hundreds === 3) {
      partsKana.push("さんびゃく");
      partsRomaji.push("sanbyaku");
    } else if (hundreds === 6) {
      partsKana.push("ろっぴゃく");
      partsRomaji.push("roppyaku");
    } else if (hundreds === 8) {
      partsKana.push("はっぴゃく");
      partsRomaji.push("happyaku");
    } else {
      partsKana.push(`${onesKana[hundreds]}ひゃく`);
      partsRomaji.push(`${onesRomaji[hundreds]}hyaku`);
    }
  }

  if (tens) {
    if (tens === 1) {
      partsKana.push("じゅう");
      partsRomaji.push("juu");
    } else {
      partsKana.push(`${onesKana[tens]}じゅう`);
      partsRomaji.push(`${onesRomaji[tens]}juu`);
    }
  }

  if (ones) {
    partsKana.push(onesKana[ones]);
    partsRomaji.push(onesRomaji[ones]);
  }

  return {
    kana: partsKana.join(""),
    romaji: partsRomaji.join(""),
  };
}

function numberToJapanese(num) {
  if (num === 0) {
    return { kana: "れい", romaji: "rei", altRomaji: "zero" };
  }

  if (num < 10000) {
    return numberToJapaneseBelow10000(num);
  }

  const man = Math.floor(num / 10000);
  const remainder = num % 10000;
  const manPart = numberToJapaneseBelow10000(man);
  const remainderPart = remainder ? numberToJapaneseBelow10000(remainder) : { kana: "", romaji: "" };

  const kana = `${man === 1 ? "いち" : manPart.kana}まん${remainderPart.kana}`;
  const romaji = `${man === 1 ? "ichi" : manPart.romaji}man${remainderPart.romaji}`;

  return { kana, romaji };
}

function normalizeAnswer(value) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[-_]/g, "");
}

function normalizeDigits(value) {
  return value.replace(/[,\s]/g, "");
}

function formatNumber(value) {
  return value.toLocaleString("en-US");
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getMode() {
  const selected = elements.mode.value;
  if (selected === "mixed") {
    return Math.random() < 0.5 ? "digitsToJapanese" : "japaneseToDigits";
  }
  return selected;
}

function clearFeedback() {
  elements.feedback.textContent = "";
  elements.feedback.className = "feedback";
  elements.answerKey.textContent = "";
}

function setFeedback(isCorrect, message) {
  elements.feedback.textContent = message;
  elements.feedback.className = `feedback ${isCorrect ? "success" : "error"}`;
}

function updatePrompt() {
  const min = Number(elements.min.value);
  const max = Number(elements.max.value);

  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    min < 0 ||
    max < 0 ||
    max > 20000000 ||
    min > max
  ) {
    setFeedback(false, "Please enter a valid range within 0–20,000,000.");
    return;
  }

  const mode = getMode();
  const number = randomInt(min, max);
  const japanese = numberToJapanese(number);

  state.currentNumber = number;
  state.currentMode = mode;
  state.expectedKana = japanese.kana;
  state.expectedRomaji = japanese.romaji;
  state.expectedDigits = String(number);
  state.readyForNext = false;

  if (mode === "digitsToJapanese") {
    elements.prompt.textContent = formatNumber(number);
    elements.direction.textContent = "Type the Japanese reading (hiragana or romaji).";
  } else {
    elements.prompt.textContent = japanese.kana;
    elements.direction.textContent = "Type the number using digits.";
  }

  elements.answerInput.value = "";
  elements.answerInput.focus();
  clearFeedback();
}

function revealAnswer() {
  if (state.currentNumber === null) {
    return;
  }

  if (state.currentMode === "digitsToJapanese") {
    const romajiText = `romaji: ${state.expectedRomaji}`;
    elements.answerKey.textContent = `Answer: ${state.expectedKana} (${romajiText})`;
  } else {
    elements.answerKey.textContent = `Answer: ${formatNumber(state.currentNumber)}`;
  }
}

function checkAnswer(event) {
  event.preventDefault();

  if (state.readyForNext) {
    updatePrompt();
    return;
  }

  if (state.currentNumber === null) {
    setFeedback(false, "Press “New prompt” to start.");
    return;
  }

  const raw = elements.answerInput.value.trim();
  if (!raw) {
    setFeedback(false, "Type an answer before checking.");
    return;
  }

  const normalized = normalizeAnswer(raw);
  const allowRomaji = elements.allowRomaji.checked;

  let correct = false;

  if (state.currentMode === "digitsToJapanese") {
    const expectedKana = normalizeAnswer(state.expectedKana);
    const expectedRomaji = normalizeAnswer(state.expectedRomaji);
    const expectedAlt = normalizeAnswer("zero");

    if (normalized === expectedKana) {
      correct = true;
    } else if (allowRomaji && normalized === expectedRomaji) {
      correct = true;
    } else if (allowRomaji && state.expectedRomaji === "rei" && normalized === expectedAlt) {
      correct = true;
    }
  } else {
    correct = normalizeDigits(normalized) === state.expectedDigits;
  }

  if (correct) {
    setFeedback(true, "Correct! Great job.");
    state.readyForNext = true;
  } else {
    setFeedback(false, "Not quite. Check the answer and try another.");
    state.readyForNext = false;
  }

  revealAnswer();
}

elements.newPrompt.addEventListener("click", updatePrompt);
elements.answerForm.addEventListener("submit", checkAnswer);
elements.reveal.addEventListener("click", revealAnswer);
