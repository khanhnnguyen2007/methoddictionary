// ===== DATA =====
const methods = [
  "X", "Z", "NESS", "ESS", "ALLY", "ISM", "LLA", "MANY", "PERB", "HL", "IVY",
  "VY", "TS",
  "TSU", "OO", "NGA", "APHY", "ACHI", "AHO", "ULI", "ALOP", "BAH", "AHU", "ILI", "HYAL",
  "SZ", "BH", "ALIN", "ASHT", "AEL", "YLE", "AVY", "THRA", "HAIS", "SIO", "PF", "MH", "UI",
  "PSO", "ZH", "WEH", "PEZ", "EZ", "AZ", "SD", "ESSO", "DH", "ARMA", "SIDH", "DHA", "SADH",
  "KUS", "LW", "TCHA", "SF", "YC", "YCLE", "YP", "TZE", "AYA", "ASCA", "FD", "GYMS", "OSO",
  "AZI", "BK", "HD", "CW", "WP", "CCH", "PK", "PD", "GD", "NSE", "FB", "SSE", "MG", "HANA",
  "ACUS", "LH", "DII", "NK", "IKH", "IOS", "IOR", "TRAK", "ELFS", "RG", "ABUG", "THS",
  "SSO", "ETTE", "LV", "KTE", "OBBI", "NJA", "YD"
];

let dictionary = [];
let cachedStartList = [];
let validMethods = [];
const buttons = {};


// ===== DOM =====
const buttonsDiv = document.getElementById("buttons");
const results = document.getElementById("results");
const startInput = document.getElementById("start");
const endInput = document.getElementById("endInput");
const capBtn = document.getElementById("capBtn");
const clearBtn = document.getElementById("clearBtn");
const sortMode = document.getElementById("sortMode");
const minLenInput = document.getElementById("minLen");
const quickFireBtn = document.getElementById("quickFireBtn");


// ===== STATE =====
let capEnabled = true;
let quickFire = false;


// ===== INIT =====
loadDictionary();
createMethodButtons();
setupEventListeners();


// ===== LOAD DICTIONARY =====
function loadDictionary() {
  fetch("https://raw.githubusercontent.com/dwyl/english-words/refs/heads/master/words_alpha.txt")
    .then(res => res.text())
    .then(text => {
      dictionary = text
        .split("\n")
        .map(w => w.trim().toLowerCase());

      runFullSearch();
    });
}


// ===== CREATE METHOD BUTTONS =====
function createMethodButtons() {
  methods.forEach(method => {
    const btn = document.createElement("button");
    btn.textContent = method;
    btn.type = "button";

    btn.addEventListener("click", () => {
      endInput.value = method;
      renderResults();
    });

    buttonsDiv.appendChild(btn);
    buttons[method] = btn;
  });
}


// ===== EVENT LISTENERS =====
function setupEventListeners() {

  capBtn.textContent = "Cap: 10";
  capBtn.addEventListener("click", toggleCap);

  clearBtn.addEventListener("click", clearEnd);

  [startInput, endInput, minLenInput].forEach(input => {
    input.addEventListener("keydown", handleEnter);
  });

  sortMode.addEventListener("change", renderResults);

  document.addEventListener("keydown", handleTab);

  quickFireBtn.addEventListener("click", toggleQuickFire);
}


// ===== EVENT HANDLERS =====

// toggle cap
function toggleCap() {
  capEnabled = !capEnabled;
  capBtn.textContent = capEnabled ? "Cap: 10" : "Cap: 200";
  renderResults();
}

// clear ending
function clearEnd() {
  endInput.value = "";
  renderResults();
}

// ONLY Enter in start triggers full search
function handleEnter(e) {
  if (e.key === "Enter" && (e.target === startInput || e.target === endInput)) {
    runFullSearch(e);
  }
}

// tab shortcut
function handleTab(e) {
  if (e.key === "Tab") {
    e.preventDefault();
    startInput.focus();
    startInput.value = "";
  }
}

// toggle quick fire + lock end input
function toggleQuickFire() {
  quickFire = !quickFire;

  quickFireBtn.textContent = quickFire
    ? "quick fire: on"
    : "quick fire: off";

  endInput.disabled = quickFire;

  if (quickFire) {
    document.addEventListener("keydown", handleShiftAdvance);
  } else {
    document.removeEventListener("keydown", handleShiftAdvance);
  }
}

// shift to advance quick fire selection
function handleShiftAdvance(e) {
  if (e.key === "Shift" && validMethods.length > 0) {
    quickFireIndex++;
    endInput.value = validMethods[quickFireIndex];
    renderResults();
  }
}

// ===== SEARCH =====

// full (expensive)
function runFullSearch() {
  const start = startInput.value.toLowerCase();
  const minLen = parseInt(minLenInput.value);

  cacheStartList(start, minLen);
  updateHeatmap();

  quickFireIndex = 0;
  renderResults();

}

// ===== CACHE BUILD =====
function cacheStartList(start, minLen) {
  cachedStartList = dictionary.filter(w =>
    (start === "" || w.startsWith(start)) &&
    (isNaN(minLen) || w.length >= minLen)
  );
}


// ===== HEATMAP + VALID METHODS =====
function updateHeatmap() {
  validMethods = [];

  methods.forEach(m => {
    let count = 0;

    for (let i = 0; i < cachedStartList.length; i++) {
      if (cachedStartList[i].endsWith(m)) {
        count++;
        if (count >= 20) break;
      }
    }

    if (count === 0) {
      buttons[m].style.backgroundColor = "#2a2a2a";
      return;
    }

    // add to FRONT (reverse priority)
    validMethods.unshift(m);

    const ratio = count / 20;
    const r = Math.floor(255 * (1 - ratio));
    const g = Math.floor(255 * ratio);

    buttons[m].style.backgroundColor = `rgb(${r},${g},0)`;
  });
}

// ===== RENDER RESULTS =====
function renderResults() {
  const ending = endInput.value.toLowerCase();

  results.innerHTML = "";

  const filtered = cachedStartList
    .filter(w => ending === "" || w.endsWith(ending))
    .sort(sortWords)
    .slice(0, capEnabled ? 10 : 200);

  filtered.forEach(word => {
    const li = document.createElement("li");

    if (ending) {
      const split = word.length - ending.length;
      li.innerHTML = `${word.slice(0, split)}<span>${word.slice(split)}</span>`;
    } else {
      li.textContent = word;
    }

    results.appendChild(li);
  });
}


// ===== SORT =====
function sortWords(a, b) {
  const mode = sortMode.value;

  if (mode === "short") return a.length - b.length || a.localeCompare(b);
  if (mode === "long") return b.length - a.length || a.localeCompare(b);
  if (mode === "alpha") return a.localeCompare(b);

  return 0;
}