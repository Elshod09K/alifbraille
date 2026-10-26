// src/normalizer.ts
var UZBEK_APOSTROPHE_CHARS = "\u02BB\u02BC\u2018\u2019'`\xB4\u201B\u2032\u02BD\u02BE\u02BF\u0312\u0313\u0314\u0315";
var O_G_APOSTROPHE_REGEX = new RegExp(`([oOgG\u041E\u043E\u0413\u0433])[${UZBEK_APOSTROPHE_CHARS}]`, "g");
function normalizeUzbekText(text) {
  if (!text) return "";
  return text.replace(O_G_APOSTROPHE_REGEX, (_match, letter) => {
    if (letter === "\u041E") return "O\u02BB";
    if (letter === "\u043E") return "o\u02BB";
    if (letter === "\u0413") return "G\u02BB";
    if (letter === "\u0433") return "g\u02BB";
    return `${letter}\u02BB`;
  });
}
var APOSTROPHE_SET = new Set(Array.from(UZBEK_APOSTROPHE_CHARS));

// src/braille.ts
var BRAILLE_NUMBER_PREFIX = "\u283C";
var APOSTROPHE_REGEX = new RegExp(`[${UZBEK_APOSTROPHE_CHARS}]`);
var BRAILLE_MAP = Object.freeze({
  // Latin alphabet
  a: "\u2801",
  // dots 1
  b: "\u2803",
  // dots 1-2
  c: "\u2809",
  // dots 1-4 (used in digraph ch or loanwords)
  d: "\u2819",
  // dots 1-4-5
  e: "\u2811",
  // dots 1-5
  f: "\u280B",
  // dots 1-2-4
  g: "\u281B",
  // dots 1-2-4-5
  h: "\u2813",
  // dots 1-2-5
  i: "\u280A",
  // dots 2-4
  j: "\u281A",
  // dots 2-4-5
  k: "\u2805",
  // dots 1-3
  l: "\u2807",
  // dots 1-2-3
  m: "\u280D",
  // dots 1-3-4
  n: "\u281D",
  // dots 1-3-4-5
  o: "\u2815",
  // dots 1-3-5
  p: "\u280F",
  // dots 1-2-3-4
  q: "\u281F",
  // dots 1-2-3-4-5
  r: "\u2817",
  // dots 1-2-3-5
  s: "\u280E",
  // dots 2-3-4
  t: "\u281E",
  // dots 2-3-4-5
  u: "\u2825",
  // dots 1-3-6
  v: "\u283A",
  // dots 2-4-5-6 (Uzbek tactile standard)
  w: "\u283A",
  // dots 2-4-5-6 (loanwords)
  x: "\u282D",
  // dots 1-3-4-6
  y: "\u283D",
  // dots 1-3-4-5-6
  z: "\u2835",
  // dots 1-3-5-6
  // Modified letters (oʻ, gʻ) across Unicode apostrophe variants
  // oʻ / o‘ corresponds to dots 1-2-3-6 (⠧ / U+2827)
  "o\u02BB": "\u2827",
  "o\u2018": "\u2827",
  "o\u2019": "\u2827",
  "o'": "\u2827",
  "o`": "\u2827",
  "o\xB4": "\u2827",
  "o\u02BC": "\u2827",
  // gʻ / g‘ corresponds to dots 1-2-4-5-6 (⠻ / U+283B)
  "g\u02BB": "\u283B",
  "g\u2018": "\u283B",
  "g\u2019": "\u283B",
  "g'": "\u283B",
  "g`": "\u283B",
  "g\xB4": "\u283B",
  "g\u02BC": "\u283B",
  // Digraphs (sh, ch, ng)
  sh: "\u2831",
  // dots 1-5-6 (⠱ / U+2831)
  ch: "\u281F",
  // dots 1-2-3-4-5 (⠟ / U+281F)
  ng: "\u281D\u281B",
  // dots 1-3-4-5 + dots 1-2-4-5 (⠝⠛)
  // Digits (prefixed by ⠼ in Braille numbers)
  "1": "\u2801",
  // dots 1
  "2": "\u2803",
  // dots 1-2
  "3": "\u2809",
  // dots 1-4
  "4": "\u2819",
  // dots 1-4-5
  "5": "\u2811",
  // dots 1-5
  "6": "\u280B",
  // dots 1-2-4
  "7": "\u281B",
  // dots 1-2-4-5
  "8": "\u2813",
  // dots 1-2-5
  "9": "\u280A",
  // dots 2-4
  "0": "\u281A",
  // dots 2-4-5
  // Whitespace
  " ": "\u2800",
  // U+2800 Braille pattern blank
  "	": "\u2800",
  // Punctuation marks
  ".": "\u2832",
  // dots 2-5-6
  ",": "\u2802",
  // dot 2
  ";": "\u2806",
  // dots 2-3
  ":": "\u2812",
  // dots 2-5
  "!": "\u2816",
  // dots 2-3-5
  "?": "\u2826",
  // dots 2-3-6
  "-": "\u2824",
  // dots 3-6
  "\u2014": "\u2824",
  // em dash mapped to Braille hyphen
  "\u2013": "\u2824",
  // en dash mapped to Braille hyphen
  "(": "\u2836",
  // dots 2-3-5-6
  ")": "\u2836",
  // dots 2-3-5-6
  "[": "\u2836",
  "]": "\u2836",
  "{": "\u2836",
  "}": "\u2836",
  "\xAB": "\u2826",
  // open guillemet
  "\xBB": "\u2834",
  // close guillemet
  '"': "\u2826",
  // neutral quote
  "\u201C": "\u2826",
  // left double quote
  "\u201D": "\u2834",
  // right double quote
  "/": "\u280C",
  // dots 3-4
  // Tutuq belgisi (apostrophe when standing alone)
  "'": "\u2804",
  // dot 3
  "\u2018": "\u2804",
  "\u2019": "\u2804",
  "\u02BB": "\u2804",
  "\u02BC": "\u2804",
  "`": "\u2804"
});
function charToBraille(charOrDigraph) {
  if (!charOrDigraph) return "";
  const key = charOrDigraph.toLowerCase();
  if (BRAILLE_MAP[key] !== void 0) {
    return BRAILLE_MAP[key];
  }
  if (key.length >= 2) {
    const first = key[0];
    const second = key.slice(1);
    if ((first === "o" || first === "g") && APOSTROPHE_REGEX.test(second)) {
      const canonicalKey = first === "o" ? "o\u02BB" : "g\u02BB";
      return BRAILLE_MAP[canonicalKey] ?? "";
    }
  }
  return "";
}
function transliterateToBraille(text) {
  if (!text) return "";
  const normalized = normalizeUzbekText(text);
  let result = "";
  let inNumberMode = false;
  let i = 0;
  const len = normalized.length;
  while (i < len) {
    const char = normalized[i];
    const nextChar = i + 1 < len ? normalized[i + 1] : "";
    if (char === "\\" && i + 1 < len) {
      const nextTwo = normalized.slice(i + 1, i + 3).toLowerCase();
      if (nextTwo === "sh" || nextTwo === "ch" || nextTwo === "ng") {
        i++;
        const escapedChar = normalized[i];
        const mapped2 = BRAILLE_MAP[escapedChar.toLowerCase()];
        if (mapped2 !== void 0) {
          result += mapped2;
        }
        i++;
        continue;
      }
    }
    if (char >= "0" && char <= "9") {
      if (!inNumberMode) {
        result += BRAILLE_NUMBER_PREFIX;
        inNumberMode = true;
      }
      result += BRAILLE_MAP[char] ?? "";
      i++;
      continue;
    }
    inNumberMode = false;
    const charLower = char.toLowerCase();
    const nextLower = nextChar.toLowerCase();
    if ((charLower === "o" || charLower === "g") && APOSTROPHE_REGEX.test(nextChar)) {
      const key = charLower === "o" ? "o\u02BB" : "g\u02BB";
      result += BRAILLE_MAP[key] ?? "";
      i += 2;
      continue;
    }
    if (charLower === "s" && nextLower === "h") {
      result += BRAILLE_MAP["sh"] ?? "";
      i += 2;
      continue;
    }
    if (charLower === "c" && nextLower === "h") {
      result += BRAILLE_MAP["ch"] ?? "";
      i += 2;
      continue;
    }
    if (charLower === "n" && nextLower === "g") {
      result += BRAILLE_MAP["ng"] ?? "";
      i += 2;
      continue;
    }
    if (char === "\n") {
      result += "\n";
      i++;
      continue;
    }
    if (char === "\r") {
      i++;
      continue;
    }
    const mapped = BRAILLE_MAP[charLower] ?? BRAILLE_MAP[char];
    if (mapped !== void 0) {
      result += mapped;
    } else {
      const code = char.charCodeAt(0);
      if (code >= 10240 && code <= 10303) {
        result += char;
      }
    }
    i++;
  }
  return result;
}

// src/ui/tactile-cell.ts
function decodeBrailleDots(brailleChar) {
  if (!brailleChar || brailleChar.length === 0) {
    return [false, false, false, false, false, false];
  }
  let code = brailleChar.charCodeAt(0);
  const BRAILLE_BASE = 10240;
  if (code < BRAILLE_BASE || code > 10495) {
    const resolved = charToBraille(brailleChar);
    if (resolved && resolved.length > 0) {
      code = resolved.charCodeAt(0);
    }
  }
  if (code < BRAILLE_BASE || code > 10495) {
    return [false, false, false, false, false, false];
  }
  const offset = code - BRAILLE_BASE;
  return [
    Boolean(offset & 1),
    // Dot 1
    Boolean(offset & 2),
    // Dot 2
    Boolean(offset & 4),
    // Dot 3
    Boolean(offset & 8),
    // Dot 4
    Boolean(offset & 16),
    // Dot 5
    Boolean(offset & 32)
    // Dot 6
  ];
}
function createTactileCellElement(char, brailleChar, index) {
  const cell = document.createElement("div");
  cell.className = "tactile-cell";
  if (char === "\n") {
    cell.classList.add("tactile-cell--newline");
  }
  cell.setAttribute("role", "group");
  cell.setAttribute("data-index", String(index));
  cell.setAttribute("data-char", char);
  cell.setAttribute("data-braille", brailleChar);
  const effectiveBraille = brailleChar || (char ? charToBraille(char) : "") || "\u2800";
  const dots = decodeBrailleDots(effectiveBraille);
  const activeDotNumbers = [];
  for (let i = 0; i < 6; i++) {
    if (dots[i]) activeDotNumbers.push(i + 1);
  }
  const displayChar = char === " " ? "Space" : char === "\n" ? "Newline" : char;
  const dotsDescription = activeDotNumbers.length > 0 ? `dots ${activeDotNumbers.join(", ")}` : "blank cell";
  cell.setAttribute(
    "aria-label",
    `Character "${displayChar}", Braille ${brailleChar || "\u2800"}, ${dotsDescription}`
  );
  const charDisplay = char === " " ? "\u2423" : char === "\n" ? "\u21B5" : char;
  const brailleDisplay = brailleChar || "\u2800";
  const charSpan = document.createElement("span");
  charSpan.className = "tactile-cell-char";
  charSpan.setAttribute("aria-hidden", "true");
  charSpan.textContent = charDisplay;
  const dotsDiv = document.createElement("div");
  dotsDiv.className = "tactile-dots";
  dotsDiv.style.gridAutoFlow = "column";
  dotsDiv.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 6; i++) {
    const dotNum = i + 1;
    const isActive = dots[i];
    const dotSpan = document.createElement("span");
    dotSpan.className = `tactile-dot tactile-dot-${dotNum} ${isActive ? "tactile-dot--active" : "tactile-dot--inactive"}`;
    dotSpan.setAttribute("data-dot-number", String(dotNum));
    dotsDiv.appendChild(dotSpan);
  }
  const brailleSpan = document.createElement("span");
  brailleSpan.className = "tactile-cell-braille";
  brailleSpan.setAttribute("aria-hidden", "true");
  brailleSpan.textContent = brailleDisplay;
  cell.appendChild(charSpan);
  cell.appendChild(dotsDiv);
  cell.appendChild(brailleSpan);
  return cell;
}
function renderBrailleGrid(container, items, maxInitialSync = 32) {
  if (!container) return;
  container.innerHTML = "";
  const isMetaCells = container.classList.contains("tactile-meta-cells") || container.classList.contains("tactile-meta-heading-cells") || container.classList.contains("tactile-meta-page-cells");
  if (!container.classList.contains("tactile-grid") && !isMetaCells) {
    container.classList.add("tactile-grid");
  }
  if (!items || items.length === 0) {
    return;
  }
  const initialItems = items.slice(0, maxInitialSync);
  const fragment = document.createDocumentFragment();
  initialItems.forEach((item, index) => {
    const cellEl = createTactileCellElement(item.char, item.braille, index);
    fragment.appendChild(cellEl);
  });
  container.appendChild(fragment);
  if (items.length > maxInitialSync) {
    const remainingItems = items.slice(maxInitialSync);
    const renderRemaining = () => {
      const restFrag = document.createDocumentFragment();
      remainingItems.forEach((item, idx) => {
        restFrag.appendChild(
          createTactileCellElement(item.char, item.braille, maxInitialSync + idx)
        );
      });
      container.appendChild(restFrag);
    };
    if (typeof queueMicrotask === "function") {
      queueMicrotask(renderRemaining);
    } else {
      setTimeout(renderRemaining, 0);
    }
  }
}

// src/ui/presets.ts
var PRESETS = [
  {
    id: "anthem",
    title: "O\u2018zbekiston Respublikasi Davlat Madhiyasi",
    titleEn: "State Anthem of Uzbekistan",
    category: "anthem",
    description: "Uzbekistan National Anthem (lyrics by Abdulla Oripov) with official Latin orthography",
    text: `Serquyosh, hur o\u2018lkam, elga baxt, najot,
Sen o\u2018zing do\u2018stlarga yo\u2018ldosh, mehribon!
Yashnagay to abad ilmu fan, ijod,
Shuhrating porlasin toki bor jahon!

Oltin bu vodiylar \u2014 jon O\u2018zbekiston,
Ajdodlar mardona ruhi senga yor!
Ulug\u2018 xalq qudrati jo\u2018sh urgan zamon,
Olamni mahliyo aylagan diyor!`
  },
  {
    id: "history-exam",
    title: "Davlat Imtihoni: Tarix va Konstitutsiya",
    titleEn: "State Exam: History & Constitution",
    category: "exam",
    description: "High School History & Constitution State Exam Question featuring digraphs and modified letters",
    text: `O\u2018zbekiston Respublikasi Konstitutsiyasi 1992-yil 8-dekabrda qabul qilingan. Konstitutsiyaning bosh maqsadi \u2014 inson qadri, huquqlari va erkinliklarini kafolatlash, mustaqil demokratik davlat va fuqarolik jamiyatini rivojlantirishdan iboratdir.`
  },
  {
    id: "orthography-practice",
    title: "Imlo Mashqi: Maxsus Harflar va Qo\u2018shma Tovushlar",
    titleEn: "Orthography Drill: Special Letters & Digraphs",
    category: "practice",
    description: "Targeted orthography drill exercising modified letters (o\u2018, g\u2018) and digraphs (sh, ch, ng)",
    text: `G\u2018afur va O\u2018tkir shahar bog\u2018ida sho\u2018rva va go\u2018shtli manti tanovul qilishdi. Yangi o\u2018quv yilida yoshlar chuqur bilim olishga intilmoqdalar.`
  },
  {
    id: "math-formula",
    title: "Matematika: Raqamlar va Misollar",
    titleEn: "Mathematics: Numbers & Equations",
    category: "practice",
    description: "Numerical practice testing Braille number prefix (dots 3-4-5-6)",
    text: `2024 va 2025-yillar oralig\u2018ida 15 ta maktabda 360 nafar o\u2018quvchi ta\u2019lim oldi. 12 + 34 = 46.`
  },
  {
    id: "literature-sample",
    title: "Adabiyot: Abdulla Qodiriy \u2014 O\u2018tkan Kunlar",
    titleEn: "Literature: Abdulla Qodiriy \u2014 O\u2018tkan Kunlar",
    category: "literature",
    description: "Classic high school Uzbek Latin literature excerpt with authentic orthography",
    text: `1264-yil qamariy, dalv oyining o\u2018n yettisida Toshkentning O\u2018ratepa darvozasidan bir otliq kirdi. U qosh-ko\u2018zlari qora, kiyinishi xushbichim yigit edi.`
  },
  {
    id: "state-entrance-exam-10q",
    title: "Davlat Imtihoni: 10 ta Test Savoli (Standart Format)",
    titleEn: "State Entrance Exam: 10-Question Standardized Format",
    category: "exam",
    description: "10-question standardized state university entrance examination template with tactile question dividers and multiple-choice options",
    text: `DAVLAT TEST MARKAZI (DTM) \u2014 ONA TILI VA ADABIYOT
=== 1-SAVOL ===
O\u2018zbek adabiy tilining asoschisi kim?
A) Abdulla Qodiriy
B) Alisher Navoiy
C) Zahiriddin Muhammad Bobur
D) Cho\u2018lpon

=== 2-SAVOL ===
Qaysi so\u2018zda "g\u2018" maxsus harfi to\u2018g\u2018ri qo\u2018llangan?
A) bog\u2018bon
B) bagbon
C) bogbon
D) boxbon

=== 3-SAVOL ===
Quyidagi so\u2018zlardan qaysi biri qo\u2018shma so\u2018z hisoblanadi?
A) o\u2018qituvchi
B) gulzor
C) ko\u2018zoynak
D) bolalar

=== 4-SAVOL ===
"Serquyosh, hur o\u2018lkam..." misrasi qaysi asardan olingan?
A) O\u2018tkan kunlar
B) Davlat Madhiyasi
C) Boburnoma
D) Xamsa

=== 5-SAVOL ===
Qaysi javobda "sh" va "ch" tovushlari qatnashgan so\u2018z berilgan?
A) shoshilinch
B) shahar
C) chiroq
D) shodlik

--- SAHIFA 2: 6-10 SAVOLLAR ---
=== 6-SAVOL ===
"O\u2018quvchilar chuqur bilim olishmoqda." Ushbu gapda nechta so\u2018z bor?
A) 3 ta
B) 4 ta
C) 5 ta
D) 6 ta

=== 7-SAVOL ===
O\u2018zbekiston Respublikasi Konstitutsiyasi nechanchi yilda qabul qilingan?
A) 1991-yil
B) 1992-yil
C) 1993-yil
D) 1994-yil

=== 8-SAVOL ===
Quyidagilardan qaysi biri undosh tovush hisoblanadi?
A) o\u2018
B) a
C) g\u2018
D) i

=== 9-SAVOL ===
"Kitob \u2014 bilim manbai." Ushbu gapning egasi qaysi so\u2018z?
A) manbai
B) bilim
C) kitob
D) manba

=== 10-SAVOL ===
Matematik ifoda natijasini toping: 25 + 15 = ?
A) 30
B) 35
C) 40
D) 45`
  }
];

// src/svg/constants.ts
var MARBURG_TACTILE_SPEC = Object.freeze({
  dotRadiusMm: 0.75,
  dotPitchMm: 2.5,
  cellHeightMm: 6,
  linePitchMm: 10,
  cellSpacingMm: 3.75,
  marginMm: 15
});
var PAPER_DIMENSIONS = Object.freeze({
  A4: {
    widthMm: 210,
    heightMm: 297
  },
  Letter: {
    widthMm: 215.9,
    heightMm: 279.4
  }
});
var DEFAULT_SVG_OPTIONS = Object.freeze({
  paperSize: "A4",
  orientation: "portrait",
  marginMm: 15,
  dotRadiusMm: 0.75,
  dotPitchMm: 2.5,
  cellHeightMm: 6,
  linePitchMm: 10,
  title: "AlifBraille Tactile Sheet",
  includeGuideDots: false,
  includeTactileMetadata: false,
  includeCalibrationRuler: true,
  pageNumber: 1
});

// src/svg/generator.ts
function escapeXml(unsafe) {
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function normalizeCellsInput(cells) {
  if (typeof cells !== "string") {
    return cells;
  }
  const result = [];
  const isPureBraille = /^[\u2800-\u28FF\s]*$/.test(cells);
  const brailleString = isPureBraille ? cells : transliterateToBraille(cells);
  for (let i = 0; i < brailleString.length; i++) {
    const ch = brailleString[i];
    if (ch === "\r") {
      continue;
    }
    if (ch === "\n") {
      result.push({ char: "\n", brailleChar: "\n", dots: [false, false, false, false, false, false], isSpace: true });
    } else {
      result.push({
        brailleChar: ch,
        dots: decodeBrailleDots(ch),
        isSpace: ch === " " || ch === "\u2800"
      });
    }
  }
  return result;
}
function generateTactileSvg(cells, options) {
  const paper = options?.paperSize ?? "A4";
  const orientation = options?.orientation ?? "portrait";
  const baseDim = PAPER_DIMENSIONS[paper] ?? PAPER_DIMENSIONS.A4;
  const widthMm = orientation === "landscape" ? baseDim.heightMm : baseDim.widthMm;
  const heightMm = orientation === "landscape" ? baseDim.widthMm : baseDim.heightMm;
  const marginMm = options?.marginMm ?? MARBURG_TACTILE_SPEC.marginMm ?? 15;
  const dotRadiusMm = options?.dotRadiusMm ?? MARBURG_TACTILE_SPEC.dotRadiusMm;
  const dotPitchMm = options?.dotPitchMm ?? MARBURG_TACTILE_SPEC.dotPitchMm;
  const linePitchMm = options?.linePitchMm ?? MARBURG_TACTILE_SPEC.linePitchMm;
  const cellSpacingMm = MARBURG_TACTILE_SPEC.cellSpacingMm ?? 3.75;
  const cellPitchMm = dotPitchMm + cellSpacingMm;
  const title = options?.title ?? "AlifBraille Tactile Sheet";
  const includeGuideDots = Boolean(options?.includeGuideDots);
  const cellList = normalizeCellsInput(cells);
  const printableWidth = widthMm - 2 * marginMm;
  const maxCellsPerLine = Math.max(1, Math.floor((printableWidth - dotPitchMm) / cellPitchMm) + 1);
  const includeTactileMetadata = Boolean(options?.includeTactileMetadata);
  const pageNum = options?.pageNumber ?? 1;
  let currentLine = 0;
  let currentCellInLine = 0;
  const dotElements = [];
  const renderCellDots = (dots, cellX, cellY) => {
    const dotOffsets = [
      { x: 0, y: 0 },
      // Dot 1
      { x: 0, y: dotPitchMm },
      // Dot 2
      { x: 0, y: 2 * dotPitchMm },
      // Dot 3
      { x: dotPitchMm, y: 0 },
      // Dot 4
      { x: dotPitchMm, y: dotPitchMm },
      // Dot 5
      { x: dotPitchMm, y: 2 * dotPitchMm }
      // Dot 6
    ];
    for (let dotNum = 0; dotNum < 6; dotNum++) {
      const isActive = dots[dotNum];
      const cx = (cellX + dotOffsets[dotNum].x).toFixed(3);
      const cy = (cellY + dotOffsets[dotNum].y).toFixed(3);
      if (isActive) {
        dotElements.push(
          `      <circle cx="${cx}" cy="${cy}" r="${dotRadiusMm}" fill="#000000" />`
        );
      } else if (includeGuideDots) {
        dotElements.push(
          `      <circle cx="${cx}" cy="${cy}" r="0.25" fill="#e5e7eb" opacity="0.6" />`
        );
      }
    }
  };
  if (includeTactileMetadata) {
    const headerTitleText = "alif";
    const headerTitleBraille = transliterateToBraille(headerTitleText);
    const headerTitleCells = normalizeCellsInput(headerTitleBraille);
    headerTitleCells.forEach((hCell, hIdx) => {
      const hCellX = marginMm + hIdx * cellPitchMm;
      const hCellY = marginMm;
      const dots = hCell.dots || decodeBrailleDots(hCell.brailleChar || "");
      renderCellDots(dots, hCellX, hCellY);
    });
    const pageBrailleStr = transliterateToBraille(String(pageNum));
    const pageCells = normalizeCellsInput(pageBrailleStr);
    const startPageCellIdx = Math.max(headerTitleCells.length + 2, maxCellsPerLine - pageCells.length);
    pageCells.forEach((pCell, pIdx) => {
      const pCellX = marginMm + (startPageCellIdx + pIdx) * cellPitchMm;
      const pCellY = marginMm;
      const dots = pCell.dots || decodeBrailleDots(pCell.brailleChar || "");
      renderCellDots(dots, pCellX, pCellY);
    });
    currentLine = 2;
  }
  for (let cIdx = 0; cIdx < cellList.length; cIdx++) {
    const cell = cellList[cIdx];
    if (cell.char === "\r" || cell.brailleChar === "\r") {
      continue;
    }
    if (cell.char === "\n" || cell.brailleChar === "\n" || cell.char === "\r\n" || cell.brailleChar === "\r\n") {
      currentLine++;
      currentCellInLine = 0;
      continue;
    }
    if (currentCellInLine >= maxCellsPerLine) {
      currentLine++;
      currentCellInLine = 0;
    }
    const cellX = marginMm + currentCellInLine * cellPitchMm;
    const cellY = marginMm + currentLine * linePitchMm;
    let dots = cell.dots;
    if (!dots || dots.length !== 6) {
      if (cell.activeDots && Array.isArray(cell.activeDots)) {
        dots = [1, 2, 3, 4, 5, 6].map((num) => cell.activeDots.includes(num));
      } else {
        const brailleSymbol = cell.brailleChar || cell.braille || cell.char || "";
        dots = decodeBrailleDots(brailleSymbol);
      }
    }
    renderCellDots(dots, cellX, cellY);
    currentCellInLine++;
  }
  const includeCalibrationRuler = options?.includeCalibrationRuler ?? true;
  let calibrationRulerSvg = "";
  if (includeCalibrationRuler) {
    const rulerBaselineY = Number((heightMm - 10).toFixed(2));
    const startX = Number(marginMm.toFixed(2));
    const endX = Number((marginMm + 50).toFixed(2));
    const notches = [
      `<line x1="${startX}" y1="${(rulerBaselineY - 3.5).toFixed(2)}" x2="${startX}" y2="${rulerBaselineY}" stroke="#000000" stroke-width="0.5" />`,
      `<line x1="${(startX + 10).toFixed(2)}" y1="${(rulerBaselineY - 2).toFixed(2)}" x2="${(startX + 10).toFixed(2)}" y2="${rulerBaselineY}" stroke="#000000" stroke-width="0.5" />`,
      `<line x1="${(startX + 20).toFixed(2)}" y1="${(rulerBaselineY - 2).toFixed(2)}" x2="${(startX + 20).toFixed(2)}" y2="${rulerBaselineY}" stroke="#000000" stroke-width="0.5" />`,
      `<line x1="${(startX + 25).toFixed(2)}" y1="${(rulerBaselineY - 2.8).toFixed(2)}" x2="${(startX + 25).toFixed(2)}" y2="${rulerBaselineY}" stroke="#000000" stroke-width="0.5" />`,
      `<line x1="${(startX + 30).toFixed(2)}" y1="${(rulerBaselineY - 2).toFixed(2)}" x2="${(startX + 30).toFixed(2)}" y2="${rulerBaselineY}" stroke="#000000" stroke-width="0.5" />`,
      `<line x1="${(startX + 40).toFixed(2)}" y1="${(rulerBaselineY - 2).toFixed(2)}" x2="${(startX + 40).toFixed(2)}" y2="${rulerBaselineY}" stroke="#000000" stroke-width="0.5" />`,
      `<line x1="${endX}" y1="${(rulerBaselineY - 3.5).toFixed(2)}" x2="${endX}" y2="${rulerBaselineY}" stroke="#000000" stroke-width="0.5" />`
    ];
    calibrationRulerSvg = `  <g id="calibration-ruler" data-ruler-length-mm="50" role="img" aria-label="50mm physical calibration reference ruler">
    <line x1="${startX}" y1="${rulerBaselineY}" x2="${endX}" y2="${rulerBaselineY}" stroke="#000000" stroke-width="0.5" />
    ${notches.join("\n    ")}
    <text x="${startX}" y="${(rulerBaselineY - 4.5).toFixed(2)}" font-family="sans-serif" font-size="2.2" font-weight="bold" fill="#000000">50mm CALIBRATION RULER (Ensure 1:1 print scale before thermal fuser)</text>
    <text x="${startX}" y="${(rulerBaselineY + 3).toFixed(2)}" font-family="sans-serif" font-size="1.8" fill="#444444">0mm</text>
    <text x="${(startX + 25).toFixed(2)}" y="${(rulerBaselineY + 3).toFixed(2)}" font-family="sans-serif" font-size="1.8" fill="#444444" text-anchor="middle">25mm</text>
    <text x="${endX}" y="${(rulerBaselineY + 3).toFixed(2)}" font-family="sans-serif" font-size="1.8" fill="#444444" text-anchor="end">50mm</text>
  </g>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${widthMm}mm" height="${heightMm}mm" viewBox="0 0 ${widthMm} ${heightMm}" version="1.1">
  <title>${escapeXml(title)}</title>
  <desc>Calibrated tactile Braille sheet for swell-form embossing generated by AlifBraille adhering to Marburg standards (2.5mm dot pitch, 10.0mm line pitch).</desc>
  <g id="tactile-braille-sheet">
${dotElements.join("\n")}
  </g>
${calibrationRulerSvg}
</svg>`;
}

// src/ui/export.ts
function downloadTactileSvgFile(filename, svgContent) {
  const effectiveFilename = filename || "alifbraille-sheet.svg";
  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  let url;
  const hasCreateObjectURL = typeof URL !== "undefined" && typeof URL.createObjectURL === "function";
  if (hasCreateObjectURL) {
    try {
      url = URL.createObjectURL(blob);
    } catch {
      url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgContent);
    }
  } else {
    url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgContent);
  }
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = effectiveFilename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  if (hasCreateObjectURL && url.startsWith("blob:") && typeof URL.revokeObjectURL === "function") {
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
      }
    }, 100);
  }
}
function triggerPrintDialog() {
  if (typeof window !== "undefined" && typeof window.print === "function") {
    window.print();
  }
}
function setupExportControls(container, getBrailleData, options) {
  const controlsWrapper = document.createElement("div");
  controlsWrapper.className = "export-controls";
  const previewBtn = document.createElement("button");
  previewBtn.type = "button";
  previewBtn.id = "swell-preview-btn";
  previewBtn.className = "export-btn export-btn-preview";
  previewBtn.setAttribute("aria-pressed", "false");
  previewBtn.setAttribute("aria-label", "Taktil qog\u2018oz va qavariq simulyatsiyasini ko\u2018rish (Alt+V)");
  previewBtn.textContent = "Qog\u2018oz ko\u2018rinishi";
  previewBtn.addEventListener("click", () => {
    const isPressed = previewBtn.getAttribute("aria-pressed") === "true";
    const nextState = !isPressed;
    previewBtn.setAttribute("aria-pressed", nextState ? "true" : "false");
    previewBtn.classList.toggle("active", nextState);
    if (options?.onTogglePreview) {
      options.onTogglePreview(nextState);
    }
  });
  const downloadBtn = document.createElement("button");
  downloadBtn.type = "button";
  downloadBtn.id = "export-svg-btn";
  downloadBtn.className = "export-btn export-btn-download";
  downloadBtn.setAttribute("aria-label", "Brayl taktil SVG faylini yuklab olish");
  downloadBtn.textContent = "SVG Yuklab Olish";
  downloadBtn.addEventListener("click", () => {
    const cells = getBrailleData ? getBrailleData() : [];
    const svgContent = generateTactileSvg(cells, {
      title: "AlifBraille Tactile Sheet",
      includeTactileMetadata: true,
      includeCalibrationRuler: true,
      pageNumber: 1
    });
    downloadTactileSvgFile("alifbraille-sheet.svg", svgContent);
  });
  const printBtn = document.createElement("button");
  printBtn.type = "button";
  printBtn.id = "print-sheet-btn";
  printBtn.className = "export-btn export-btn-print";
  printBtn.setAttribute("aria-label", "Taktil qog\u2018ozga chop etish");
  printBtn.textContent = "Chop Etish";
  printBtn.addEventListener("click", () => {
    triggerPrintDialog();
  });
  controlsWrapper.appendChild(previewBtn);
  controlsWrapper.appendChild(downloadBtn);
  controlsWrapper.appendChild(printBtn);
  container.appendChild(controlsWrapper);
  return { downloadBtn, printBtn, previewBtn };
}

// src/audio/phonetics.ts
var APOSTROPHE_REGEX2 = new RegExp(`[${UZBEK_APOSTROPHE_CHARS}]`, "g");
var SINGLE_APOSTROPHE_LOOKAHEAD = new RegExp(`^[${UZBEK_APOSTROPHE_CHARS}]`);
var UZBEK_TO_CYRILLIC_MAP = {
  a: "\u0430",
  b: "\u0431",
  d: "\u0434",
  f: "\u0444",
  g: "\u0433",
  h: "\u04B3",
  i: "\u0438",
  j: "\u0436",
  k: "\u043A",
  l: "\u043B",
  m: "\u043C",
  n: "\u043D",
  o: "\u043E",
  p: "\u043F",
  q: "\u049B",
  r: "\u0440",
  s: "\u0441",
  t: "\u0442",
  u: "\u0443",
  v: "\u0432",
  x: "\u0445",
  y: "\u0439",
  z: "\u0437",
  A: "\u0410",
  B: "\u0411",
  D: "\u0414",
  F: "\u0424",
  G: "\u0413",
  H: "\u04B2",
  I: "\u0418",
  J: "\u0416",
  K: "\u041A",
  L: "\u041B",
  M: "\u041C",
  N: "\u041D",
  O: "\u041E",
  P: "\u041F",
  Q: "\u049A",
  R: "\u0420",
  S: "\u0421",
  T: "\u0422",
  U: "\u0423",
  V: "\u0412",
  X: "\u0425",
  Y: "\u0419",
  Z: "\u0417"
};
function convertToPhoneticLatin(text) {
  if (!text) return "";
  const normalized = normalizeUzbekText(text);
  let result = "";
  let i = 0;
  const len = normalized.length;
  while (i < len) {
    const char = normalized[i];
    const nextChar = i + 1 < len ? normalized[i + 1] : "";
    const isO = char === "o" || char === "O";
    const isG = char === "g" || char === "G";
    if ((isO || isG) && SINGLE_APOSTROPHE_LOOKAHEAD.test(nextChar)) {
      if (isO) {
        result += char;
      } else {
        const isUpper = char === "G";
        const nextNext = i + 2 < len ? normalized[i + 2] : "";
        const isAllUpper = isUpper && nextNext === nextNext.toUpperCase() && /[A-Z]/.test(nextNext);
        result += isUpper ? isAllUpper ? "GH" : "Gh" : "gh";
      }
      i += 2;
      continue;
    }
    if (SINGLE_APOSTROPHE_LOOKAHEAD.test(char)) {
      i++;
      continue;
    }
    result += char;
    i++;
  }
  return result;
}
function convertToPhoneticTurkish(text) {
  if (!text) return "";
  const normalized = normalizeUzbekText(text);
  let result = "";
  let i = 0;
  const len = normalized.length;
  while (i < len) {
    const char = normalized[i];
    const nextChar = i + 1 < len ? normalized[i + 1] : "";
    const isO = char === "o" || char === "O";
    const isG = char === "g" || char === "G";
    if ((isO || isG) && SINGLE_APOSTROPHE_LOOKAHEAD.test(nextChar)) {
      if (isO) {
        result += char === "O" ? "\xD6" : "\xF6";
      } else {
        result += char === "G" ? "\u011E" : "\u011F";
      }
      i += 2;
      continue;
    }
    const charLower = char.toLowerCase();
    if (charLower === "s" && nextChar.toLowerCase() === "h") {
      result += char === "S" ? "\u015E" : "\u015F";
      i += 2;
      continue;
    }
    if (charLower === "c" && nextChar.toLowerCase() === "h") {
      result += char === "C" ? "\xC7" : "\xE7";
      i += 2;
      continue;
    }
    if (charLower === "n" && nextChar.toLowerCase() === "g") {
      result += char === "N" ? "\xD1" : "\xF1";
      i += 2;
      continue;
    }
    if (SINGLE_APOSTROPHE_LOOKAHEAD.test(char)) {
      i++;
      continue;
    }
    result += char;
    i++;
  }
  return result;
}
function convertToPhoneticCyrillic(text) {
  if (!text) return "";
  const normalized = normalizeUzbekText(text);
  let result = "";
  let i = 0;
  const len = normalized.length;
  while (i < len) {
    const char = normalized[i];
    const nextChar = i + 1 < len ? normalized[i + 1] : "";
    const isY = char === "y" || char === "Y";
    if (isY && nextChar) {
      const nextLower = nextChar.toLowerCase();
      let mappedY = null;
      if (nextLower === "a") mappedY = char === "Y" ? "\u042F" : "\u044F";
      else if (nextLower === "u") mappedY = char === "Y" ? "\u042E" : "\u044E";
      else if (nextLower === "o") mappedY = char === "Y" ? "\u0401" : "\u0451";
      else if (nextLower === "e") mappedY = char === "Y" ? "\u0415" : "\u0435";
      if (mappedY) {
        result += mappedY;
        i += 2;
        continue;
      }
    }
    const isO = char === "o" || char === "O";
    const isG = char === "g" || char === "G";
    if ((isO || isG) && SINGLE_APOSTROPHE_LOOKAHEAD.test(nextChar)) {
      if (isO) {
        result += char === "O" ? "\u040E" : "\u045E";
      } else {
        result += char === "G" ? "\u0492" : "\u0493";
      }
      i += 2;
      continue;
    }
    const charLower = char.toLowerCase();
    if (charLower === "s" && nextChar.toLowerCase() === "h") {
      result += char === "S" ? "\u0428" : "\u0448";
      i += 2;
      continue;
    }
    if (charLower === "c" && nextChar.toLowerCase() === "h") {
      result += char === "C" ? "\u0427" : "\u0447";
      i += 2;
      continue;
    }
    if (charLower === "t" && nextChar.toLowerCase() === "s") {
      result += char === "T" ? "\u0426" : "\u0446";
      i += 2;
      continue;
    }
    if (charLower === "n" && nextChar.toLowerCase() === "g") {
      const isUpperN = char === "N";
      const isUpperG = nextChar === "G";
      result += isUpperN ? isUpperG ? "\u041D\u0413" : "\u041D\u0433" : "\u043D\u0433";
      i += 2;
      continue;
    }
    if (SINGLE_APOSTROPHE_LOOKAHEAD.test(char)) {
      result += "\u044A";
      i++;
      continue;
    }
    if (charLower === "e") {
      const prevChar = i > 0 ? normalized[i - 1].toLowerCase() : "";
      const isWordStart = i === 0 || !/[a-z0-9]/i.test(prevChar);
      const isAfterVowel = /[aeiou]/.test(prevChar);
      const useEOborotnoye = isWordStart || isAfterVowel;
      if (char === "E") {
        result += useEOborotnoye ? "\u042D" : "\u0415";
      } else {
        result += useEOborotnoye ? "\u044D" : "\u0435";
      }
      i++;
      continue;
    }
    if (UZBEK_TO_CYRILLIC_MAP[char] !== void 0) {
      result += UZBEK_TO_CYRILLIC_MAP[char];
    } else {
      result += char;
    }
    i++;
  }
  return result;
}
function resolvePhoneticMode(targetOrLang) {
  if (!targetOrLang) return "latin";
  const lower = targetOrLang.toLowerCase();
  if (lower.startsWith("ru") || lower === "cyrillic" || lower.includes("russian")) {
    return "cyrillic";
  }
  if (lower.startsWith("tr") || lower === "turkish") {
    return "turkish";
  }
  return "latin";
}
function getPhoneticFallbackText(text, targetOrLang) {
  if (!text) return "";
  const mode = resolvePhoneticMode(targetOrLang);
  switch (mode) {
    case "cyrillic":
      return convertToPhoneticCyrillic(text);
    case "turkish":
      return convertToPhoneticTurkish(text);
    case "latin":
    default:
      return convertToPhoneticLatin(text);
  }
}

// src/audio/synthesizer.ts
function buildCharToTactileCellMap(text) {
  if (!text) return [];
  const map = new Array(text.length);
  let cellIndex = 0;
  let inNumberMode = false;
  let i = 0;
  const len = text.length;
  while (i < len) {
    const char = text[i];
    const nextChar = i + 1 < len ? text[i + 1] : "";
    if (char >= "0" && char <= "9") {
      if (!inNumberMode) {
        cellIndex++;
        inNumberMode = true;
      }
      map[i] = cellIndex;
      cellIndex++;
      i++;
      continue;
    }
    inNumberMode = false;
    const charLower = char.toLowerCase();
    if ((charLower === "o" || charLower === "g") && /^[ʻ‘'’`´ʼ]/.test(nextChar)) {
      map[i] = cellIndex;
      if (i + 1 < len) {
        map[i + 1] = cellIndex;
      }
      cellIndex++;
      i += 2;
      continue;
    }
    if (charLower === "s" && nextChar.toLowerCase() === "h" || charLower === "c" && nextChar.toLowerCase() === "h") {
      map[i] = cellIndex;
      if (i + 1 < len) {
        map[i + 1] = cellIndex;
      }
      cellIndex++;
      i += 2;
      continue;
    }
    map[i] = cellIndex;
    cellIndex++;
    i++;
  }
  return map;
}
function extractSpeechTokens(text) {
  if (!text) return [];
  const cellMap = buildCharToTactileCellMap(text);
  const tokens = [];
  const regex = /\S+/g;
  let match;
  let tokenIdx = 0;
  while ((match = regex.exec(text)) !== null) {
    const word = match[0];
    const charIndex = match.index;
    const charLength = word.length;
    const tokenIndex = cellMap[charIndex] ?? 0;
    tokens.push({
      index: tokenIdx++,
      word,
      charIndex,
      charLength,
      tokenIndex
    });
  }
  return tokens;
}
function findBestVoice(voices, preferredLang) {
  if (!voices || voices.length === 0) return null;
  if (preferredLang) {
    const match = voices.find(
      (v) => v.lang.toLowerCase() === preferredLang.toLowerCase() || v.lang.toLowerCase().startsWith(preferredLang.toLowerCase())
    );
    if (match) return match;
  }
  const uzVoice = voices.find(
    (v) => v.lang.toLowerCase().startsWith("uz") || v.name.toLowerCase().includes("uzbek") || v.name.toLowerCase().includes("o\u2018zbek") || v.name.toLowerCase().includes("ozbek")
  );
  if (uzVoice) return uzVoice;
  const trVoice = voices.find((v) => v.lang.toLowerCase().startsWith("tr"));
  if (trVoice) return trVoice;
  const ruVoice = voices.find((v) => v.lang.toLowerCase().startsWith("ru"));
  if (ruVoice) return ruVoice;
  const enVoice = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  if (enVoice) return enVoice;
  const defaultVoice = voices.find((v) => v.default);
  if (defaultVoice) return defaultVoice;
  return voices[0] || null;
}
var SpeechSynthesizer = class {
  _state = "idle";
  _options = {
    rate: 1,
    pitch: 1,
    volume: 1,
    boundaryIntervalMs: 200,
    fallbackMode: "auto"
  };
  _cachedVoice = null;
  _currentUtterance = null;
  _pendingResolve = null;
  // Interval timer fallback state
  _fallbackTimer = null;
  _hasNativeBoundaries = false;
  _tokens = [];
  _currentTokenIdx = 0;
  _startTime = 0;
  _pausedElapsed = 0;
  _pauseTimestamp = 0;
  _activeOnBoundary = null;
  constructor(options) {
    if (options) {
      this._options = { ...this._options, ...options };
    }
  }
  getState() {
    return this._state;
  }
  getOptions() {
    return { ...this._options };
  }
  setOptions(options) {
    this._options = { ...this._options, ...options };
  }
  getSpeechSynthesis() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      return window.speechSynthesis;
    }
    if (typeof globalThis !== "undefined" && globalThis.speechSynthesis) {
      return globalThis.speechSynthesis;
    }
    return null;
  }
  getAvailableVoices() {
    const synth = this.getSpeechSynthesis();
    if (!synth || typeof synth.getVoices !== "function") return [];
    return synth.getVoices();
  }
  getVoice() {
    const voices = this.getAvailableVoices();
    this._cachedVoice = findBestVoice(voices, this._options.lang);
    return this._cachedVoice;
  }
  setVoice(voice) {
    this._cachedVoice = voice;
  }
  /**
   * Speaks the provided text using Web Speech API with boundary event dispatch.
   * Resolves when playback completes, stops, or cancels without throwing unhandled rejections.
   */
  async speak(text, onBoundary, overrideOptions) {
    this.stop();
    if (!text || text.trim().length === 0) {
      this._state = "idle";
      return;
    }
    const opts = { ...this._options, ...overrideOptions };
    const voice = this.getVoice();
    const isNativeUz = voice?.lang.toLowerCase().startsWith("uz") ?? false;
    const textToSpeak = isNativeUz ? normalizeUzbekText(text) : getPhoneticFallbackText(text, voice?.lang);
    this._tokens = extractSpeechTokens(text);
    this._currentTokenIdx = 0;
    this._hasNativeBoundaries = false;
    this._activeOnBoundary = onBoundary ?? null;
    this._startTime = performance.now();
    this._pausedElapsed = 0;
    this._pauseTimestamp = 0;
    const synth = this.getSpeechSynthesis();
    return new Promise((resolve) => {
      let isResolved = false;
      const finishPlayback = () => {
        if (!isResolved) {
          isResolved = true;
          this.clearFallbackTimer();
          this._state = "idle";
          this._currentUtterance = null;
          this._pendingResolve = null;
          this._activeOnBoundary = null;
          resolve();
        }
      };
      this._pendingResolve = finishPlayback;
      const UtteranceClass = typeof window !== "undefined" && window.SpeechSynthesisUtterance || typeof globalThis !== "undefined" && globalThis.SpeechSynthesisUtterance;
      if (!synth || !UtteranceClass) {
        this._state = "playing";
        this.runFallbackTimer(opts, finishPlayback);
        return;
      }
      const utterance = new UtteranceClass(textToSpeak);
      this._currentUtterance = utterance;
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else if (opts.lang) {
        utterance.lang = opts.lang;
      } else {
        utterance.lang = "uz-UZ";
      }
      utterance.rate = opts.rate ?? 1;
      utterance.pitch = opts.pitch ?? 1;
      utterance.volume = opts.volume ?? 1;
      utterance.onstart = () => {
        this._state = "playing";
        this._startTime = performance.now();
        const mockSynth = synth;
        const lacksBoundaries = opts.fallbackMode === "interval" || mockSynth.emitBoundariesOnAutoPlay === false || opts.fallbackMode === "auto";
        if (lacksBoundaries && this._tokens.length > 0 && this._activeOnBoundary) {
          this.armFallbackTimerWatchdog(opts, finishPlayback);
        }
      };
      utterance.onboundary = (ev) => {
        this._hasNativeBoundaries = true;
        this.clearFallbackTimer();
        if (this._activeOnBoundary) {
          this.dispatchNativeBoundaryEvent(ev, text);
        }
      };
      utterance.onpause = () => {
        this._state = "paused";
        this.pauseFallbackTimer();
      };
      utterance.onresume = () => {
        this._state = "playing";
        this.resumeFallbackTimer(opts, finishPlayback);
      };
      utterance.onend = () => {
        finishPlayback();
      };
      utterance.onerror = (ev) => {
        finishPlayback();
      };
      try {
        this._state = "playing";
        synth.speak(utterance);
      } catch (err) {
        finishPlayback();
      }
    });
  }
  /**
   * Dispatches a normalized SpeechBoundaryEvent from native browser boundary events.
   */
  dispatchNativeBoundaryEvent(ev, originalText) {
    if (!this._activeOnBoundary) return;
    const charIndex = typeof ev.charIndex === "number" ? ev.charIndex : 0;
    const cellMap = buildCharToTactileCellMap(originalText);
    const tokenIndex = cellMap[charIndex] ?? 0;
    const token = this._tokens.find(
      (t) => charIndex >= t.charIndex && charIndex < t.charIndex + Math.max(1, t.charLength)
    ) || this._tokens[this._currentTokenIdx] || null;
    const word = token?.word || (originalText.slice(charIndex, charIndex + (ev.charLength || 1)).trim() || "word");
    const charLength = ev.charLength && ev.charLength > 0 ? ev.charLength : token ? token.charLength : word.length;
    const elapsedTime = typeof ev.elapsedTime === "number" && ev.elapsedTime > 0 ? ev.elapsedTime : (performance.now() - this._startTime) / 1e3;
    this._activeOnBoundary({
      charIndex,
      charLength,
      name: ev.name || "word",
      elapsedTime,
      tokenIndex,
      token: word,
      word
    });
    if (token) {
      this._currentTokenIdx = token.index + 1;
    }
  }
  /**
   * Arms a deterministic fallback interval timer that fires when native boundaries are absent.
   */
  armFallbackTimerWatchdog(opts, onComplete) {
    if (opts.fallbackMode === "native") return;
    if (opts.fallbackMode === "interval") {
      this.runFallbackTimer(opts, onComplete, true);
    } else {
      const interval = opts.boundaryIntervalMs ?? 150;
      this.clearFallbackTimer();
      this._fallbackTimer = setTimeout(() => {
        if (!this._hasNativeBoundaries && this._state === "playing") {
          this.runFallbackTimer(opts, onComplete, true);
        }
      }, interval);
    }
  }
  runFallbackTimer(opts, onComplete, emitInitialImmediately = false) {
    this.clearFallbackTimer();
    if (!this._activeOnBoundary || this._tokens.length === 0) return;
    const interval = opts.boundaryIntervalMs ?? 150;
    const tick = () => {
      if (this._hasNativeBoundaries || this._state !== "playing") {
        this.clearFallbackTimer();
        return;
      }
      if (this._currentTokenIdx < this._tokens.length) {
        const token = this._tokens[this._currentTokenIdx];
        const elapsedTime = (performance.now() - this._startTime - this._pausedElapsed) / 1e3;
        if (this._activeOnBoundary) {
          this._activeOnBoundary({
            charIndex: token.charIndex,
            charLength: token.charLength,
            name: "word",
            elapsedTime,
            tokenIndex: token.tokenIndex,
            token: token.word,
            word: token.word
          });
        }
        this._currentTokenIdx++;
      } else {
        this.clearFallbackTimer();
        if (onComplete) onComplete();
      }
    };
    if (emitInitialImmediately && this._currentTokenIdx === 0) {
      tick();
    }
    this._fallbackTimer = setInterval(tick, interval);
  }
  pauseFallbackTimer() {
    if (this._fallbackTimer) {
      clearInterval(this._fallbackTimer);
      this._fallbackTimer = null;
    }
    this._pauseTimestamp = performance.now();
  }
  resumeFallbackTimer(opts, onComplete) {
    if (this._pauseTimestamp > 0) {
      this._pausedElapsed += performance.now() - this._pauseTimestamp;
      this._pauseTimestamp = 0;
    }
    if (!this._hasNativeBoundaries && this._activeOnBoundary) {
      this.runFallbackTimer(opts, onComplete);
    }
  }
  clearFallbackTimer() {
    if (this._fallbackTimer) {
      clearInterval(this._fallbackTimer);
      this._fallbackTimer = null;
    }
  }
  stop() {
    this.clearFallbackTimer();
    this._state = "idle";
    const synth = this.getSpeechSynthesis();
    if (synth && typeof synth.cancel === "function") {
      try {
        synth.cancel();
      } catch (err) {
      }
    }
    if (this._pendingResolve) {
      const resolve = this._pendingResolve;
      this._pendingResolve = null;
      resolve();
    }
    this._currentUtterance = null;
    this._activeOnBoundary = null;
  }
  pause() {
    if (this._state === "playing") {
      this._state = "paused";
      this.pauseFallbackTimer();
      const synth = this.getSpeechSynthesis();
      if (synth && typeof synth.pause === "function") {
        try {
          synth.pause();
        } catch (err) {
        }
      }
    }
  }
  resume() {
    if (this._state === "paused") {
      this._state = "playing";
      this.resumeFallbackTimer(this._options, this._pendingResolve ?? void 0);
      const synth = this.getSpeechSynthesis();
      if (synth && typeof synth.resume === "function") {
        try {
          synth.resume();
        } catch (err) {
        }
      }
    }
  }
};

// src/audio/index.ts
var SpeechController = class {
  _synthesizer;
  constructor(options) {
    this._synthesizer = new SpeechSynthesizer(options);
  }
  /**
   * Speaks the provided text using Web Speech API with boundary event dispatch.
   * Resolves when speech finishes or stops.
   */
  async speak(text, onBoundary) {
    return this._synthesizer.speak(text, onBoundary);
  }
  /**
   * Immediately stops any speech playback and resets state to 'idle'.
   */
  stop() {
    this._synthesizer.stop();
  }
  /**
   * Pauses active speech playback.
   */
  pause() {
    this._synthesizer.pause();
  }
  /**
   * Resumes paused speech playback.
   */
  resume() {
    this._synthesizer.resume();
  }
  /**
   * Gets current playback state ('idle' | 'playing' | 'paused').
   */
  getState() {
    return this._synthesizer.getState();
  }
  /**
   * Gets the active SpeechSynthesisVoice used (or null if unavailable).
   */
  getVoice() {
    return this._synthesizer.getVoice();
  }
  /**
   * Sets or overrides the active voice.
   */
  setVoice(voice) {
    this._synthesizer.setVoice(voice);
  }
  /**
   * Gets underlying SpeechSynthesizer instance.
   */
  getSynthesizer() {
    return this._synthesizer;
  }
  /**
   * Converts Uzbek Latin text into phonetic fallback representation
   * for TTS engines lacking native uz-UZ support.
   */
  getPhoneticFallbackText(text, targetOrLang) {
    const voiceLang = targetOrLang || this.getVoice()?.lang;
    return getPhoneticFallbackText(text, voiceLang);
  }
};

// src/ui/speech-highlighter.ts
function highlightBrailleCell(tokenIndex) {
  clearSpeechHighlights();
  if (tokenIndex === null || tokenIndex === void 0 || tokenIndex < 0) {
    return;
  }
  let targetCell = document.querySelector(`.tactile-cell[data-index="${tokenIndex}"]`);
  if (!targetCell) {
    const cells = document.querySelectorAll(".tactile-cell");
    if (tokenIndex < cells.length) {
      targetCell = cells[tokenIndex];
    }
  }
  if (targetCell) {
    targetCell.classList.add("cell-speaking");
    targetCell.setAttribute("data-active-speech", "true");
    if (typeof targetCell.scrollIntoView === "function") {
      try {
        targetCell.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      } catch {
        targetCell.scrollIntoView();
      }
    }
  }
}
function clearSpeechHighlights() {
  const speakingCells = document.querySelectorAll(
    '.tactile-cell.cell-speaking, [data-active-speech="true"]'
  );
  speakingCells.forEach((cell) => {
    cell.classList.remove("cell-speaking");
    cell.removeAttribute("data-active-speech");
  });
}

// src/ui/audio-controls.ts
var APOSTROPHE_REGEX3 = /^[ʻ‘'’`´ʼ]/;
function buildCharToCellIndexMap(text) {
  if (!text) return [];
  const map = new Array(text.length);
  let cellIdx = 0;
  let inNumberMode = false;
  let i = 0;
  const len = text.length;
  while (i < len) {
    const char = text[i];
    const nextChar = i + 1 < len ? text[i + 1] : "";
    if (char >= "0" && char <= "9") {
      if (!inNumberMode) {
        cellIdx++;
        inNumberMode = true;
      }
      map[i] = cellIdx;
      cellIdx++;
      i++;
      continue;
    }
    inNumberMode = false;
    const charLower = char.toLowerCase();
    if ((charLower === "o" || charLower === "g") && APOSTROPHE_REGEX3.test(nextChar)) {
      map[i] = cellIdx;
      map[i + 1] = cellIdx;
      cellIdx++;
      i += 2;
      continue;
    }
    if (charLower === "s" && nextChar.toLowerCase() === "h" || charLower === "c" && nextChar.toLowerCase() === "h") {
      map[i] = cellIdx;
      map[i + 1] = cellIdx;
      cellIdx++;
      i += 2;
      continue;
    }
    map[i] = cellIdx;
    cellIdx++;
    i++;
  }
  return map;
}
var sharedAudioContext = null;
var isGlobalGestureListenerAttached = false;
function getOrCreateAudioContext(forceNew) {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioContext || forceNew) {
    try {
      sharedAudioContext = new AudioCtx();
    } catch {
      return null;
    }
  }
  return sharedAudioContext;
}
function ensureAudioUserGesture() {
  if (typeof window === "undefined") return;
  try {
    if ("speechSynthesis" in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch {
  }
  try {
    const ctx = getOrCreateAudioContext();
    if (ctx) {
      if (ctx.state === "suspended" && typeof ctx.resume === "function") {
        ctx.resume().catch(() => {
        });
      }
      if (typeof ctx.createBuffer === "function" && typeof ctx.createBufferSource === "function") {
        try {
          const silentBuffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = silentBuffer;
          if (ctx.destination) {
            source.connect(ctx.destination);
          }
          if (typeof source.start === "function") {
            source.start(0);
          }
        } catch {
        }
      }
    }
  } catch {
  }
}
function setupGlobalGestureUnlock() {
  if (typeof window === "undefined" || isGlobalGestureListenerAttached) return;
  isGlobalGestureListenerAttached = true;
  const unlockEvents = ["click", "touchstart", "touchend", "pointerdown", "keydown"];
  const onFirstInteraction = () => {
    ensureAudioUserGesture();
    unlockEvents.forEach((evt) => {
      try {
        window.removeEventListener(evt, onFirstInteraction, true);
      } catch {
      }
    });
  };
  unlockEvents.forEach((evt) => {
    try {
      window.addEventListener(evt, onFirstInteraction, { capture: true, once: true });
    } catch {
    }
  });
}
function initAudioControls(container, controller, getText) {
  if (!container) return;
  setupGlobalGestureUnlock();
  let currentLang = "uz";
  const getLabels = () => ({
    idleText: currentLang === "en" ? "Listen" : "Tinglash",
    activeText: currentLang === "en" ? "Stop" : "To\u2018xtatish",
    stopBtnText: currentLang === "en" ? "Stop" : "To\u2018xtatish",
    idleAria: currentLang === "en" ? "Listen (Alt+L)" : "Tinglash (Alt+L)",
    activeAria: currentLang === "en" ? "Stop (Esc)" : "To\u2018xtatish (Esc)",
    idleTitle: currentLang === "en" ? "Auditory verification (Alt+L)" : "Ovozli o\u2018qish va tekshirish (Alt+L)",
    groupLabel: currentLang === "en" ? "Auditory verification controls" : "Ovozli tekshirish boshqaruvi",
    msgPlaying: currentLang === "en" ? "Auditory verification in progress..." : "Matn ovozli o\u2018qilmoqda...",
    msgStopped: currentLang === "en" ? "Auditory playback stopped." : "Ovozli o\u2018qish to\u2018xtatildi.",
    msgCompleted: currentLang === "en" ? "Auditory playback complete." : "Ovozli o\u2018qish yakunlandi.",
    msgEmpty: currentLang === "en" ? "No text available for auditory verification." : "O\u2018qish uchun matn mavjud emas.",
    waveformText: currentLang === "en" ? "Audio playing" : "Ovozli ijro faol",
    fallbackAlert: currentLang === "en" ? "Web Speech unavailable. Visual Braille verification is active." : "Ovozli sintez brauzerda mavjud emas. Taktil vizual tekshiruv faol."
  });
  const labels = getLabels();
  container.innerHTML = `
    <div class="audio-controls" role="group" aria-label="${labels.groupLabel}">
      <button
        id="audio-play-btn"
        class="audio-btn audio-btn-play"
        type="button"
        aria-pressed="false"
        aria-label="${labels.idleAria}"
        title="${labels.idleTitle}"
      >${labels.idleText}</button>
      <button
        id="audio-stop-btn"
        class="audio-btn audio-btn-stop"
        type="button"
        aria-label="${labels.activeAria}"
        title="${labels.activeAria}"
        disabled
      >${labels.stopBtnText}</button>
      <div id="audio-waveform-indicator" class="audio-waveform-indicator" aria-hidden="true">
        <span class="waveform-bar bar-1"></span>
        <span class="waveform-bar bar-2"></span>
        <span class="waveform-bar bar-3"></span>
        <span class="waveform-bar bar-4"></span>
        <span class="waveform-bar bar-5"></span>
        <span class="waveform-label">${labels.waveformText}</span>
      </div>
      <div id="audio-live-status" class="sr-only" aria-live="polite" role="status"></div>
      <div id="audio-status-badge" class="audio-status-badge" role="status" aria-live="polite"></div>
    </div>
  `;
  const playBtn = container.querySelector("#audio-play-btn");
  const stopBtn = container.querySelector("#audio-stop-btn");
  const localLiveStatus = container.querySelector("#audio-live-status");
  const waveformIndicator = container.querySelector("#audio-waveform-indicator");
  const audioStatusBadge = container.querySelector("#audio-status-badge");
  let isPlaying = false;
  function announce(message) {
    if (localLiveStatus) {
      localLiveStatus.textContent = message;
    }
    const audioAriaStatus = document.getElementById("audio-aria-status");
    if (audioAriaStatus && audioAriaStatus !== localLiveStatus) {
      audioAriaStatus.textContent = message;
    }
    const appA11yStatus = document.getElementById("a11y-live-status");
    if (appA11yStatus && appA11yStatus !== localLiveStatus) {
      appA11yStatus.textContent = message;
    }
  }
  function showStatusAlert(msg) {
    if (audioStatusBadge) {
      audioStatusBadge.textContent = msg;
      audioStatusBadge.classList.add("visible");
      setTimeout(() => {
        audioStatusBadge.classList.remove("visible");
      }, 5e3);
    }
  }
  function resetControlsToIdle() {
    isPlaying = false;
    clearSpeechHighlights();
    const l = getLabels();
    playBtn.textContent = l.idleText;
    playBtn.setAttribute("aria-pressed", "false");
    playBtn.setAttribute("aria-label", l.idleAria);
    stopBtn.disabled = true;
    if (waveformIndicator) {
      waveformIndicator.classList.remove("active");
    }
  }
  function stopPlayback(announceMessage) {
    controller.stop();
    resetControlsToIdle();
    announce(announceMessage || getLabels().msgStopped);
  }
  async function startPlayback() {
    ensureAudioUserGesture();
    const rawText = getText ? getText() : "";
    const text = rawText ? rawText.trim() : "";
    if (!text) {
      announce(getLabels().msgEmpty);
      return;
    }
    isPlaying = true;
    const l = getLabels();
    playBtn.textContent = l.activeText;
    playBtn.setAttribute("aria-pressed", "true");
    playBtn.setAttribute("aria-label", l.activeAria);
    stopBtn.disabled = false;
    if (waveformIndicator) {
      waveformIndicator.classList.add("active");
    }
    announce(l.msgPlaying);
    const charMap = buildCharToCellIndexMap(rawText);
    try {
      await controller.speak(rawText, (e) => {
        if (!isPlaying) return;
        let targetIndex = null;
        if (typeof e.tokenIndex === "number") {
          targetIndex = e.tokenIndex;
        } else if (typeof e.charIndex === "number") {
          if (e.charIndex >= 0 && e.charIndex < charMap.length) {
            targetIndex = charMap[e.charIndex];
          } else if (charMap.length > 0) {
            targetIndex = charMap[Math.min(e.charIndex, charMap.length - 1)];
          }
        }
        if (targetIndex !== null) {
          highlightBrailleCell(targetIndex);
        }
      });
      if (isPlaying) {
        resetControlsToIdle();
        announce(getLabels().msgCompleted);
      }
    } catch (err) {
      if (isPlaying) {
        resetControlsToIdle();
        const alertMsg = getLabels().fallbackAlert;
        announce(alertMsg);
        showStatusAlert(alertMsg);
      }
    }
  }
  function togglePlayback() {
    if (isPlaying || controller.getState() === "playing") {
      stopPlayback();
    } else {
      startPlayback();
    }
  }
  function setLanguage(lang) {
    currentLang = lang;
    const l = getLabels();
    const groupEl = container.querySelector(".audio-controls");
    if (groupEl) {
      groupEl.setAttribute("aria-label", l.groupLabel);
    }
    stopBtn.textContent = l.stopBtnText;
    stopBtn.setAttribute("aria-label", l.activeAria);
    stopBtn.setAttribute("title", l.activeAria);
    if (waveformIndicator) {
      const label = waveformIndicator.querySelector(".waveform-label");
      if (label) label.textContent = l.waveformText;
    }
    if (isPlaying) {
      playBtn.textContent = l.activeText;
      playBtn.setAttribute("aria-label", l.activeAria);
    } else {
      playBtn.textContent = l.idleText;
      playBtn.setAttribute("aria-label", l.idleAria);
      playBtn.setAttribute("title", l.idleTitle);
    }
  }
  playBtn.addEventListener("click", () => {
    togglePlayback();
  });
  stopBtn.addEventListener("click", () => {
    stopPlayback();
  });
  playBtn.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      togglePlayback();
    }
  });
  const handleGlobalKey = (e) => {
    if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      togglePlayback();
      return;
    }
    if (e.key === "Escape") {
      if (isPlaying || controller.getState() === "playing") {
        e.preventDefault();
        stopPlayback();
        return;
      }
    }
  };
  if (container.__audioGlobalKeyHandler) {
    window.removeEventListener("keydown", container.__audioGlobalKeyHandler);
  }
  container.__audioGlobalKeyHandler = handleGlobalKey;
  window.addEventListener("keydown", handleGlobalKey);
  return {
    setLanguage,
    stop: stopPlayback,
    isPlaying: () => isPlaying,
    getWaveformEl: () => waveformIndicator
  };
}

// src/ui/quiz.ts
var REVERSE_BRAILLE_MAP = Object.freeze({
  "\u2801": { char: "a", nameUz: "A harfi (1-raqam bilan ham bir xil)", nameEn: "Letter A (also numeral 1 with prefix)" },
  "\u2803": { char: "b", nameUz: "B harfi", nameEn: "Letter B (numeral 2)" },
  "\u2809": { char: "c", nameUz: "C harfi (ch yoki o\u2018zlashma so\u2018zlarda)", nameEn: "Letter C" },
  "\u2819": { char: "d", nameUz: "D harfi", nameEn: "Letter D (numeral 4)" },
  "\u2811": { char: "e", nameUz: "E harfi", nameEn: "Letter E (numeral 5)" },
  "\u280B": { char: "f", nameUz: "F harfi", nameEn: "Letter F (numeral 6)" },
  "\u281B": { char: "g", nameUz: "G harfi", nameEn: "Letter G (numeral 7)" },
  "\u2813": { char: "h", nameUz: "H harfi", nameEn: "Letter H (numeral 8)" },
  "\u280A": { char: "i", nameUz: "I harfi", nameEn: "Letter I (numeral 9)" },
  "\u281A": { char: "j", nameUz: "J harfi", nameEn: "Letter J (numeral 0)" },
  "\u2805": { char: "k", nameUz: "K harfi", nameEn: "Letter K" },
  "\u2807": { char: "l", nameUz: "L harfi", nameEn: "Letter L" },
  "\u280D": { char: "m", nameUz: "M harfi", nameEn: "Letter M" },
  "\u281D": { char: "n", nameUz: "N harfi", nameEn: "Letter N" },
  "\u2815": { char: "o", nameUz: "O harfi (oddiy unli)", nameEn: "Letter O (plain vowel)" },
  "\u280F": { char: "p", nameUz: "P harfi", nameEn: "Letter P" },
  "\u281F": { char: "ch", nameUz: "CH digrafi (va Q harfi)", nameEn: "Digraph CH (and Q)" },
  "\u2817": { char: "r", nameUz: "R harfi", nameEn: "Letter R" },
  "\u280E": { char: "s", nameUz: "S harfi", nameEn: "Letter S" },
  "\u281E": { char: "t", nameUz: "T harfi", nameEn: "Letter T" },
  "\u2825": { char: "u", nameUz: "U harfi", nameEn: "Letter U" },
  "\u2827": { char: "o\u2018", nameUz: "O\u2018 maxsus unlisi (1-2-3-6 nuqtalar)", nameEn: "Special vowel O\u2018 (dots 1-2-3-6)" },
  "\u283B": { char: "g\u2018", nameUz: "G\u2018 maxsus undoshi (1-2-4-5-6 nuqtalar)", nameEn: "Special consonant G\u2018 (dots 1-2-4-5-6)" },
  "\u2831": { char: "sh", nameUz: "SH digrafi (1-5-6 nuqtalar)", nameEn: "Digraph SH (dots 1-5-6)" },
  "\u283A": { char: "v", nameUz: "V harfi", nameEn: "Letter V" },
  "\u282D": { char: "x", nameUz: "X harfi", nameEn: "Letter X" },
  "\u283D": { char: "y", nameUz: "Y harfi", nameEn: "Letter Y" },
  "\u2835": { char: "z", nameUz: "Z harfi", nameEn: "Letter Z" },
  "\u2804": { char: "\u2019", nameUz: "Tutuq belgisi (apostrof, 3-nuqta)", nameEn: "Tutuq belgisi (apostrophe, dot 3)" },
  "\u283C": { char: "#", nameUz: "Raqam belgisi (3-4-5-6 nuqtalar)", nameEn: "Numeral sign prefix (dots 3-4-5-6)" },
  "\u2832": { char: ".", nameUz: "Nuqta (2-5-6 nuqtalar)", nameEn: "Period (dots 2-5-6)" },
  "\u2802": { char: ",", nameUz: "Vergul (2-nuqta)", nameEn: "Comma (dot 2)" },
  "\u2826": { char: "?", nameUz: "So\u2018roq belgisi (2-3-6 nuqtalar)", nameEn: "Question mark (dots 2-3-6)" },
  "\u2816": { char: "!", nameUz: "Undov belgisi (2-3-5 nuqtalar)", nameEn: "Exclamation mark (dots 2-3-5)" }
});
function decodeDotsToChar(dots) {
  const activeDotNumbers = [];
  let bitmask = 0;
  for (let i = 0; i < 6; i++) {
    if (dots[i]) {
      bitmask |= 1 << i;
      activeDotNumbers.push(i + 1);
    }
  }
  const brailleChar = String.fromCharCode(10240 + bitmask);
  const match = REVERSE_BRAILLE_MAP[brailleChar];
  if (match) {
    return {
      char: match.char,
      braille: brailleChar,
      dotNumbers: activeDotNumbers,
      descriptionUz: `${match.nameUz} (Nuqtalar: ${activeDotNumbers.join(", ") || "yo\u2018q"})`,
      descriptionEn: `${match.nameEn} (Dots: ${activeDotNumbers.join(", ") || "none"})`,
      isRegistered: true
    };
  }
  return {
    char: brailleChar === "\u2800" ? "Bo\u2018shliq" : "?",
    braille: brailleChar,
    dotNumbers: activeDotNumbers,
    descriptionUz: activeDotNumbers.length > 0 ? `Noma\u2019lum kombinatsiya (${activeDotNumbers.join(", ")}-nuqtalar)` : "Barcha nuqtalar o\u2018chiq",
    descriptionEn: activeDotNumbers.length > 0 ? `Custom / unassigned combination (Dots ${activeDotNumbers.join(", ")})` : "All dots inactive",
    isRegistered: false
  };
}
var QUIZ_FLASHCARDS = [
  // Special Uzbek letters & digraphs
  {
    id: "spec-sh",
    char: "sh",
    braille: "\u2831",
    activeDots: [1, 5, 6],
    category: "special",
    options: ["sh", "ch", "s", "h"],
    explanationUz: '\u2831 belgisi Uzbek lotin alifbosidagi "sh" digrafi (1, 5, 6-nuqtalar).',
    explanationEn: '\u2831 represents the Uzbek Latin digraph "sh" (dots 1, 5, 6).'
  },
  {
    id: "spec-ch",
    char: "ch",
    braille: "\u281F",
    activeDots: [1, 2, 3, 4, 5],
    category: "special",
    options: ["ch", "sh", "o\u2018", "q"],
    explanationUz: '\u281F belgisi Uzbek lotin alifbosidagi "ch" digrafi (1, 2, 3, 4, 5-nuqtalar).',
    explanationEn: '\u281F represents the Uzbek Latin digraph "ch" (dots 1, 2, 3, 4, 5).'
  },
  {
    id: "spec-oo",
    char: "o\u2018",
    braille: "\u2827",
    activeDots: [1, 2, 3, 6],
    category: "special",
    options: ["o\u2018", "o", "g\u2018", "u"],
    explanationUz: '\u2827 belgisi Uzbek tilidagi maxsus "o\u2018" unlisini bildiradi (1, 2, 3, 6-nuqtalar).',
    explanationEn: '\u2827 represents the unique Uzbek vowel "o\u2018" (dots 1, 2, 3, 6).'
  },
  {
    id: "spec-gg",
    char: "g\u2018",
    braille: "\u283B",
    activeDots: [1, 2, 4, 5, 6],
    category: "special",
    options: ["g\u2018", "g", "o\u2018", "sh"],
    explanationUz: '\u283B belgisi Uzbek tilidagi maxsus "g\u2018" undoshini bildiradi (1, 2, 4, 5, 6-nuqtalar).',
    explanationEn: '\u283B represents the unique Uzbek velar consonant "g\u2018" (dots 1, 2, 4, 5, 6).'
  },
  {
    id: "spec-tutuq",
    char: "\u2019",
    braille: "\u2804",
    activeDots: [3],
    category: "special",
    options: ["\u2019", ".", ",", "i"],
    explanationUz: "\u2804 belgisi Uzbek imlosidagi tutuq belgisi (apostrof, faqat 3-nuqta).",
    explanationEn: "\u2804 represents the Uzbek tutuq belgisi / glottal stop (dot 3 only)."
  },
  {
    id: "core-a",
    char: "a",
    braille: "\u2801",
    activeDots: [1],
    category: "core",
    options: ["a", "b", "c", "e"],
    explanationUz: '\u2801 \u2014 Brayl alifbosining birinchi harfi "a" (faqat 1-nuqta).',
    explanationEn: '\u2801 is letter "a" in Braille (dot 1 only).'
  },
  {
    id: "core-b",
    char: "b",
    braille: "\u2803",
    activeDots: [1, 2],
    category: "core",
    options: ["b", "l", "k", "a"],
    explanationUz: '\u2803 \u2014 "b" harfi (1 va 2-nuqtalar).',
    explanationEn: '\u2803 is letter "b" (dots 1 and 2).'
  },
  {
    id: "core-m",
    char: "m",
    braille: "\u280D",
    activeDots: [1, 3, 4],
    category: "core",
    options: ["m", "n", "p", "l"],
    explanationUz: '\u280D \u2014 "m" harfi (1, 3, 4-nuqtalar).',
    explanationEn: '\u280D is letter "m" (dots 1, 3, 4).'
  },
  {
    id: "core-t",
    char: "t",
    braille: "\u281E",
    activeDots: [2, 3, 4, 5],
    category: "core",
    options: ["t", "s", "r", "d"],
    explanationUz: '\u281E \u2014 "t" harfi (2, 3, 4, 5-nuqtalar).',
    explanationEn: '\u281E is letter "t" (dots 2, 3, 4, 5).'
  },
  {
    id: "core-num",
    char: "#",
    braille: "\u283C",
    activeDots: [3, 4, 5, 6],
    category: "digit",
    options: ["#", "z", "y", "u"],
    explanationUz: "\u283C \u2014 Braylda keyingi belgilar raqam ekanligini bildiruvchi prefiks (3, 4, 5, 6-nuqtalar).",
    explanationEn: "\u283C is the Braille numeral prefix indicating digits follow (dots 3, 4, 5, 6)."
  }
];
function initBrailleQuizModal(options) {
  const { root, getSpeechController, getLang = () => "uz" } = options;
  let currentLang = getLang();
  let currentCardIndex = 0;
  let correctCount = 0;
  let totalAnswered = 0;
  let answeredCurrent = false;
  const inspectorDots = [false, false, false, false, false, false];
  const STRINGS = {
    uz: {
      modalTitle: "\u{1F393} Brayl Viktorinasi va Ikki Tomonlama Tekshiruv",
      subtitle: "Ko\u2018zi ojiz bo\u2018lmagan o\u2018qituvchilar uchun 6 nuqtali Braylni o\u2018rganish va tekshirish laboratoriyasi",
      tabQuiz: "\u{1F4DA} Brayl-Lotin Flashkardlar",
      tabInspector: "\u{1F50D} Interaktiv Nuqta Tekshiruvi",
      categoryLabel: "Mavzu:",
      catAll: "Barcha namunalar",
      catSpecial: "Maxsus unlilar va digraflar (o\u2018, g\u2018, sh, ch)",
      catCore: "Asosiy harflar",
      scoreText: (c, t, pct) => `Natija: ${c} / ${t} (${pct}%)`,
      questionText: "Ushbu Brayl katakchasi qaysi harf yoki belgini bildiradi?",
      nextCardBtn: "Keyingi savol \u2794",
      correctFeedback: (exp) => `\u{1F389} To\u2018g\u2018ri! ${exp}`,
      wrongFeedback: (ans, exp) => `\u274C Noto\u2018g\u2018ri. To\u2018g\u2018ri javob: "${ans}". ${exp}`,
      inspectorHeading: "6 nuqtani bosing yoki 1-6 klavishlarini tering:",
      inspectorDotLabel: (n) => `${n}-nuqta`,
      inspectorResultLabel: "Mos keluvchi lotin harfi:",
      pronounceBtn: "\u{1F50A} Ovozli eshitish",
      clearDotsBtn: "Tozalash",
      closeBtn: "Yopish (Esc)"
    },
    en: {
      modalTitle: "\u{1F393} Braille Quiz & Two-Way Verification",
      subtitle: "Reverse reading and interactive dot inspection tool for sighted teachers",
      tabQuiz: "\u{1F4DA} Braille-to-Latin Flashcards",
      tabInspector: "\u{1F50D} Interactive Dot Inspector",
      categoryLabel: "Category:",
      catAll: "All cards",
      catSpecial: "Uzbek Special & Digraphs (o\u2018, g\u2018, sh, ch)",
      catCore: "Core alphabet",
      scoreText: (c, t, pct) => `Score: ${c} / ${t} (${pct}%)`,
      questionText: "Which Uzbek Latin character does this Braille cell represent?",
      nextCardBtn: "Next Question \u2794",
      correctFeedback: (exp) => `\u{1F389} Correct! ${exp}`,
      wrongFeedback: (ans, exp) => `\u274C Incorrect. Correct answer: "${ans}". ${exp}`,
      inspectorHeading: "Click dots below or press number keys 1\u20136:",
      inspectorDotLabel: (n) => `Dot ${n}`,
      inspectorResultLabel: "Corresponding Latin character:",
      pronounceBtn: "\u{1F50A} Pronounce",
      clearDotsBtn: "Clear Dots",
      closeBtn: "Close (Esc)"
    }
  };
  let modalEl = root.querySelector("#braille-quiz-modal");
  if (!modalEl) {
    modalEl = document.createElement("dialog");
    modalEl.id = "braille-quiz-modal";
    modalEl.className = "quiz-modal";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "quiz-modal-title");
    root.appendChild(modalEl);
  }
  const renderModalDom = () => {
    const s = STRINGS[currentLang];
    modalEl.innerHTML = `
      <div class="modal-dialog-content quiz-dialog-content">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <h2 id="quiz-modal-title" class="modal-title">${s.modalTitle}</h2>
            <span class="modal-badge">Teacher Learning & Verification</span>
          </div>
          <button id="quiz-modal-close-btn" class="modal-close-btn" type="button" aria-label="${s.closeBtn}">\u2715</button>
        </div>

        <p class="quiz-subtitle">${s.subtitle}</p>

        <div class="quiz-nav-tabs" role="tablist">
          <button id="quiz-tab-flashcards" class="quiz-tab active" role="tab" aria-selected="true" type="button">${s.tabQuiz}</button>
          <button id="quiz-tab-inspector" class="quiz-tab" role="tab" aria-selected="false" type="button">${s.tabInspector}</button>
        </div>

        <div class="quiz-tab-panels">
          <!-- PANEL 1: FLASHCARDS QUIZ -->
          <div id="quiz-panel-flashcards" class="quiz-panel active" role="tabpanel" aria-labelledby="quiz-tab-flashcards">
            <div class="quiz-toolbar">
              <div class="category-select-wrap">
                <label for="quiz-category-select"><strong>${s.categoryLabel}</strong></label>
                <select id="quiz-category-select" class="select-control">
                  <option value="all">${s.catAll}</option>
                  <option value="special">${s.catSpecial}</option>
                  <option value="core">${s.catCore}</option>
                </select>
              </div>
              <div id="quiz-score-badge" class="quiz-score-badge" aria-live="polite">
                ${s.scoreText(0, 0, 100)}
              </div>
            </div>

            <div class="flashcard-container">
              <div class="flashcard-braille-box" aria-hidden="true">
                <div id="flashcard-tactile-cell" class="quiz-tactile-cell"></div>
                <div id="flashcard-unicode-char" class="quiz-unicode-char">\u2831</div>
              </div>

              <div class="flashcard-question-box">
                <p id="quiz-question-prompt" class="question-prompt"><strong>${s.questionText}</strong></p>
                <div id="quiz-options-grid" class="quiz-options-grid" role="group" aria-label="Javob variantlari"></div>
                <div id="quiz-feedback-box" class="quiz-feedback-box" aria-live="assertive"></div>
              </div>
            </div>

            <div class="quiz-action-bar">
              <button id="quiz-next-btn" class="toggle-button action-btn-next" type="button">${s.nextCardBtn}</button>
            </div>
          </div>

          <!-- PANEL 2: TWO-WAY INTERACTIVE DOT INSPECTOR -->
          <div id="quiz-panel-inspector" class="quiz-panel" role="tabpanel" aria-labelledby="quiz-tab-inspector" hidden>
            <p class="inspector-lead"><strong>${s.inspectorHeading}</strong></p>

            <div class="inspector-workspace">
              <!-- Interactive 6-dot matrix -->
              <div class="inspector-dot-matrix" role="group" aria-label="6 nuqtali Brayl matritsasi">
                <div class="dot-col">
                  <button type="button" class="matrix-dot-btn" data-dot="1" aria-label="1-nuqta (yuqori chap)" aria-pressed="false">
                    <span class="dot-circle"></span>
                    <span class="dot-num">1</span>
                  </button>
                  <button type="button" class="matrix-dot-btn" data-dot="2" aria-label="2-nuqta (o\u2018rta chap)" aria-pressed="false">
                    <span class="dot-circle"></span>
                    <span class="dot-num">2</span>
                  </button>
                  <button type="button" class="matrix-dot-btn" data-dot="3" aria-label="3-nuqta (pastki chap)" aria-pressed="false">
                    <span class="dot-circle"></span>
                    <span class="dot-num">3</span>
                  </button>
                </div>
                <div class="dot-col">
                  <button type="button" class="matrix-dot-btn" data-dot="4" aria-label="4-nuqta (yuqori o\u2018ng)" aria-pressed="false">
                    <span class="dot-circle"></span>
                    <span class="dot-num">4</span>
                  </button>
                  <button type="button" class="matrix-dot-btn" data-dot="5" aria-label="5-nuqta (o\u2018rta o\u2018ng)" aria-pressed="false">
                    <span class="dot-circle"></span>
                    <span class="dot-num">5</span>
                  </button>
                  <button type="button" class="matrix-dot-btn" data-dot="6" aria-label="6-nuqta (pastki o\u2018ng)" aria-pressed="false">
                    <span class="dot-circle"></span>
                    <span class="dot-num">6</span>
                  </button>
                </div>
              </div>

              <!-- Inspector Result Output -->
              <div class="inspector-output-card">
                <div class="output-row">
                  <span class="output-label">${s.inspectorResultLabel}</span>
                  <span id="inspector-latin-result" class="output-latin-char">Bo\u2018sh</span>
                </div>
                <div class="output-row">
                  <span class="output-label">Unicode Brayl:</span>
                  <span id="inspector-unicode-result" class="output-braille-char">\u2800</span>
                </div>
                <p id="inspector-desc-result" class="output-description">Barcha nuqtalar o\u2018chiq</p>

                <div class="inspector-btn-row">
                  <button id="inspector-speak-btn" class="toggle-button" type="button">${s.pronounceBtn}</button>
                  <button id="inspector-clear-btn" class="toggle-button" type="button">${s.clearDotsBtn}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button id="quiz-modal-footer-close" class="toggle-button" type="button">${s.closeBtn}</button>
        </div>
      </div>
    `;
    bindEvents();
    renderCurrentCard();
    updateInspectorDisplay();
  };
  const getFilteredCards = () => {
    const select = modalEl.querySelector("#quiz-category-select");
    const cat = select?.value || "all";
    if (cat === "all") return QUIZ_FLASHCARDS;
    return QUIZ_FLASHCARDS.filter((c) => c.category === cat);
  };
  const renderCurrentCard = () => {
    const cards = getFilteredCards();
    if (cards.length === 0) return;
    const card = cards[currentCardIndex % cards.length];
    answeredCurrent = false;
    const cellEl = modalEl.querySelector("#flashcard-tactile-cell");
    const unicodeEl = modalEl.querySelector("#flashcard-unicode-char");
    const optionsGrid = modalEl.querySelector("#quiz-options-grid");
    const feedbackBox = modalEl.querySelector("#quiz-feedback-box");
    const scoreBadge = modalEl.querySelector("#quiz-score-badge");
    if (unicodeEl) unicodeEl.textContent = card.braille;
    if (feedbackBox) {
      feedbackBox.textContent = "";
      feedbackBox.className = "quiz-feedback-box";
    }
    if (cellEl) {
      cellEl.innerHTML = `
        <div class="cell-dots-matrix" aria-label="Braille pattern for ${card.char}">
          <span class="cell-dot dot-1 ${card.activeDots.includes(1) ? "active" : ""}"></span>
          <span class="cell-dot dot-2 ${card.activeDots.includes(2) ? "active" : ""}"></span>
          <span class="cell-dot dot-3 ${card.activeDots.includes(3) ? "active" : ""}"></span>
          <span class="cell-dot dot-4 ${card.activeDots.includes(4) ? "active" : ""}"></span>
          <span class="cell-dot dot-5 ${card.activeDots.includes(5) ? "active" : ""}"></span>
          <span class="cell-dot dot-6 ${card.activeDots.includes(6) ? "active" : ""}"></span>
        </div>
      `;
    }
    if (optionsGrid) {
      optionsGrid.innerHTML = "";
      card.options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quiz-option-btn";
        btn.dataset.option = opt;
        btn.textContent = `${String.fromCharCode(65 + idx)}) ${opt}`;
        btn.setAttribute("aria-label", `Javob ${String.fromCharCode(65 + idx)}: ${opt}`);
        btn.addEventListener("click", () => handleOptionSelected(opt, btn, card));
        optionsGrid.appendChild(btn);
      });
    }
    if (scoreBadge) {
      const pct = totalAnswered > 0 ? Math.round(correctCount / totalAnswered * 100) : 100;
      scoreBadge.textContent = STRINGS[currentLang].scoreText(correctCount, totalAnswered, pct);
    }
  };
  const handleOptionSelected = (selected, btn, card) => {
    if (answeredCurrent) return;
    answeredCurrent = true;
    totalAnswered++;
    const isCorrect = selected === card.char;
    if (isCorrect) correctCount++;
    const feedbackBox = modalEl.querySelector("#quiz-feedback-box");
    const scoreBadge = modalEl.querySelector("#quiz-score-badge");
    const optionsGrid = modalEl.querySelector("#quiz-options-grid");
    if (optionsGrid) {
      const buttons = optionsGrid.querySelectorAll(".quiz-option-btn");
      buttons.forEach((b) => {
        b.disabled = true;
        if (b.dataset.option === card.char) {
          b.classList.add("correct");
        } else if (b === btn && !isCorrect) {
          b.classList.add("wrong");
        }
      });
    }
    if (feedbackBox) {
      const exp = currentLang === "en" ? card.explanationEn : card.explanationUz;
      if (isCorrect) {
        feedbackBox.textContent = STRINGS[currentLang].correctFeedback(exp);
        feedbackBox.className = "quiz-feedback-box success";
      } else {
        feedbackBox.textContent = STRINGS[currentLang].wrongFeedback(card.char, exp);
        feedbackBox.className = "quiz-feedback-box failure";
      }
    }
    if (scoreBadge) {
      const pct = Math.round(correctCount / totalAnswered * 100);
      scoreBadge.textContent = STRINGS[currentLang].scoreText(correctCount, totalAnswered, pct);
    }
  };
  const updateInspectorDisplay = () => {
    const decodeResult = decodeDotsToChar(inspectorDots);
    const latinEl = modalEl.querySelector("#inspector-latin-result");
    const unicodeEl = modalEl.querySelector("#inspector-unicode-result");
    const descEl = modalEl.querySelector("#inspector-desc-result");
    if (latinEl) latinEl.textContent = decodeResult.char;
    if (unicodeEl) unicodeEl.textContent = decodeResult.braille;
    if (descEl) {
      descEl.textContent = currentLang === "en" ? decodeResult.descriptionEn : decodeResult.descriptionUz;
    }
    const dotBtns = modalEl.querySelectorAll(".matrix-dot-btn");
    dotBtns.forEach((btn) => {
      const dotNum = parseInt(btn.dataset.dot || "0", 10);
      const isActive = Boolean(inspectorDots[dotNum - 1]);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      btn.classList.toggle("active", isActive);
    });
  };
  const bindEvents = () => {
    const closeBtn = modalEl.querySelector("#quiz-modal-close-btn");
    const footerCloseBtn = modalEl.querySelector("#quiz-modal-footer-close");
    const nextBtn = modalEl.querySelector("#quiz-next-btn");
    const catSelect = modalEl.querySelector("#quiz-category-select");
    const tabFlash = modalEl.querySelector("#quiz-tab-flashcards");
    const tabInsp = modalEl.querySelector("#quiz-tab-inspector");
    const panelFlash = modalEl.querySelector("#quiz-panel-flashcards");
    const panelInsp = modalEl.querySelector("#quiz-panel-inspector");
    const speakBtn = modalEl.querySelector("#inspector-speak-btn");
    const clearBtn = modalEl.querySelector("#inspector-clear-btn");
    const closeModalSafely = () => {
      if (typeof modalEl.close === "function") {
        try {
          modalEl.close();
        } catch {
        }
      }
      modalEl.removeAttribute("open");
      modalEl.classList.remove("is-open");
      if (typeof document !== "undefined") {
        const aboutModal = document.querySelector("#about-creator-modal");
        const isAboutOpen = aboutModal && (aboutModal.hasAttribute("open") || aboutModal.open || aboutModal.classList.contains("is-open"));
        if (!isAboutOpen) {
          document.body.classList.remove("modal-open");
          document.documentElement.classList.remove("modal-open");
        }
      }
    };
    closeBtn?.addEventListener("click", closeModalSafely);
    footerCloseBtn?.addEventListener("click", closeModalSafely);
    nextBtn?.addEventListener("click", () => {
      currentCardIndex++;
      renderCurrentCard();
    });
    catSelect?.addEventListener("change", () => {
      currentCardIndex = 0;
      renderCurrentCard();
    });
    tabFlash?.addEventListener("click", () => {
      tabFlash.classList.add("active");
      tabFlash.setAttribute("aria-selected", "true");
      tabInsp?.classList.remove("active");
      tabInsp?.setAttribute("aria-selected", "false");
      panelFlash?.classList.add("active");
      if (panelFlash) panelFlash.hidden = false;
      panelInsp?.classList.remove("active");
      if (panelInsp) panelInsp.hidden = true;
    });
    tabInsp?.addEventListener("click", () => {
      tabInsp.classList.add("active");
      tabInsp.setAttribute("aria-selected", "true");
      tabFlash?.classList.remove("active");
      tabFlash?.setAttribute("aria-selected", "false");
      panelInsp?.classList.add("active");
      if (panelInsp) panelInsp.hidden = false;
      panelFlash?.classList.remove("active");
      if (panelFlash) panelFlash.hidden = true;
    });
    const dotBtns = modalEl.querySelectorAll(".matrix-dot-btn");
    dotBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const dotNum = parseInt(btn.dataset.dot || "0", 10);
        if (dotNum >= 1 && dotNum <= 6) {
          inspectorDots[dotNum - 1] = !inspectorDots[dotNum - 1];
          updateInspectorDisplay();
        }
      });
    });
    clearBtn?.addEventListener("click", () => {
      for (let i = 0; i < 6; i++) inspectorDots[i] = false;
      updateInspectorDisplay();
    });
    speakBtn?.addEventListener("click", () => {
      const decodeResult = decodeDotsToChar(inspectorDots);
      if (decodeResult.isRegistered && decodeResult.char && decodeResult.char !== "?") {
        const controller = getSpeechController ? getSpeechController() : null;
        if (controller) {
          controller.speak(decodeResult.char);
        }
      }
    });
    modalEl.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        modalEl.close();
        return;
      }
      if (e.key === "Tab") {
        const focusableSelector = [
          'button:not([disabled]):not([aria-hidden="true"])',
          'select:not([disabled]):not([aria-hidden="true"])',
          'input:not([disabled]):not([aria-hidden="true"])',
          "a[href]",
          '[tabindex]:not([tabindex="-1"])'
        ].join(", ");
        const focusables = Array.from(modalEl.querySelectorAll(focusableSelector)).filter((el) => {
          const panel = el.closest(".quiz-tab-panel");
          if (panel && !panel.classList.contains("active")) return false;
          return el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0 || el.tabIndex >= 0;
        });
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === first || !modalEl.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !modalEl.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
        return;
      }
      if (tabInsp?.classList.contains("active")) {
        const keyNum = parseInt(e.key, 10);
        if (keyNum >= 1 && keyNum <= 6) {
          e.preventDefault();
          inspectorDots[keyNum - 1] = !inspectorDots[keyNum - 1];
          updateInspectorDisplay();
        }
      }
      if (tabFlash?.classList.contains("active") && !answeredCurrent) {
        const keyUpper = e.key.toUpperCase();
        if (["A", "B", "C", "D"].includes(keyUpper)) {
          const index = keyUpper.charCodeAt(0) - 65;
          const options2 = modalEl.querySelectorAll(".quiz-option-btn");
          if (options2[index]) {
            e.preventDefault();
            options2[index].click();
          }
        }
      }
    });
  };
  renderModalDom();
  return {
    open: () => {
      if (modalEl) {
        if (typeof document !== "undefined") {
          document.body.classList.add("modal-open");
          document.documentElement.classList.add("modal-open");
        }
        if (typeof modalEl.showModal === "function") {
          try {
            modalEl.showModal();
          } catch {
            modalEl.setAttribute("open", "true");
          }
        } else {
          modalEl.setAttribute("open", "true");
        }
        modalEl.setAttribute("open", "true");
        modalEl.classList.add("is-open");
        const tabFlash = modalEl.querySelector("#quiz-tab-flashcards");
        tabFlash?.focus();
      }
    },
    close: () => {
      if (modalEl) {
        if (typeof document !== "undefined") {
          const aboutModal = document.querySelector("#about-creator-modal");
          const isAboutOpen = aboutModal && (aboutModal.hasAttribute("open") || aboutModal.open || aboutModal.classList.contains("is-open"));
          if (!isAboutOpen) {
            document.body.classList.remove("modal-open");
            document.documentElement.classList.remove("modal-open");
          }
        }
        if (typeof modalEl.close === "function") {
          try {
            modalEl.close();
          } catch {
            modalEl.removeAttribute("open");
          }
        } else {
          modalEl.removeAttribute("open");
        }
        modalEl.removeAttribute("open");
        modalEl.classList.remove("is-open");
      }
    },
    destroy: () => {
      modalEl?.remove();
    },
    setLang: (lang) => {
      currentLang = lang;
      renderModalDom();
    }
  };
}

// src/ui/tour.ts
function initSwellTourModal(root) {
  let currentLang = "uz";
  let currentStep = 1;
  const totalSteps = 3;
  const TEXTS = {
    uz: {
      modalTitle: "\u{1F9ED} Birinchi Taktil Chop Etish Qo\u2018llanmasi (3 Bosqich)",
      badge: "O\u2018qituvchilar uchun qo\u2018llanma",
      closeBtn: "Yopish",
      prevBtn: "Ortga",
      nextBtn: "Keyingisi",
      finishBtn: "Tushunarli, Yakunlash",
      stepIndicator: (step, total) => `${total} tadan ${step}-bosqich`,
      steps: [
        {
          num: 1,
          tag: "1-QADAM: Matn va Marburg Standarti",
          title: "Lotin Matnini Kiritish va Brayl Katakchalari",
          description: "Tahrirlash maydoniga darslik yoki imtihon matnini kiriting, yoki yuqoridagi namuna testlardan birini tanlang. AlifBraille 5 millisekunddan kam vaqtda universal Marburg standarti (2.5mm nuqta masofasi, 0.75mm radius) bo\u2018yicha 6 nuqtali katakchalarga o\u2018giradi.",
          tipTitle: "Muhim qoida:",
          tip: "O\u2018zbek tilining o\u2018, g\u2018, sh, ch harflari va raqamlar (#) avtomatik tarzda to\u2018g\u2018ri Brayl belgilariga aylantiriladi.",
          visualSvg: `
            <svg viewBox="0 0 400 90" class="tour-step-svg" aria-hidden="true">
              <rect x="10" y="10" width="170" height="70" rx="6" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
              <text x="25" y="42" fill="#93c5fd" font-size="14" font-weight="bold">O\u2018zbek Lotin Matni</text>
              <text x="25" y="62" fill="#cbd5e1" font-size="11">o\u2018, g\u2018, sh, ch, raqamlar</text>
              <path d="M 190 45 L 215 45" stroke="#10b981" stroke-width="3" marker-end="url(#arrow)"/>
              <rect x="225" y="10" width="165" height="70" rx="6" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
              <text x="240" y="42" fill="#34d399" font-size="14" font-weight="bold">Marburg Brayl (2.5mm)</text>
              <text x="240" y="62" fill="#cbd5e1" font-size="11">Qavariq nuqtalar matritsasi</text>
            </svg>
          `
        },
        {
          num: 2,
          tag: "2-QADAM: Printer Masshtabi & 50mm Shkala",
          title: "50mm Fizik Kalibrlash Shkalsini Tekshirish & Resurs Tejamkorligi",
          description: 'Chop etish (Print) yoki SVG yuklab olish tugmasini bosing. Eng muhim qoida: Brauzer chop etish oynasida Masshtabni (Scale) qat\u2019iy ravishda "100%" (Asl o\u2018lcham) qilib belgilang! Hech qachon "Sahifaga moslash" (Fit to page) tanlamang, chunki bu nuqtalar orasini 94% gacha kichraytirib yuboradi.',
          tipTitle: "Tejamkorlik va ekologik barqarorlik:",
          tip: "Mikrokapsulali taktil qog\u2018oz qimmatbaho (har bir varaq $1.50\u2013$2.20) va Markaziy Osiyoga chetdan keltiriladi. 50mm belgisini oddiy chizg\u2018ich bilan tekshirish va Simulyatsiya rejimidan (Alt+V) foydalanish qog\u2018oz uvol bo\u2018lishining oldini oladi va maktab byudjetini tejaydi!",
          visualSvg: `
            <svg viewBox="0 0 400 90" class="tour-step-svg" aria-hidden="true">
              <rect x="10" y="15" width="220" height="60" rx="4" fill="#0f172a" stroke="#cbd5e1" stroke-width="1"/>
              <line x1="25" y1="55" x2="215" y2="55" stroke="#f59e0b" stroke-width="3"/>
              <line x1="25" y1="45" x2="25" y2="55" stroke="#f59e0b" stroke-width="3"/>
              <line x1="120" y1="48" x2="120" y2="55" stroke="#f59e0b" stroke-width="2"/>
              <line x1="215" y1="45" x2="215" y2="55" stroke="#f59e0b" stroke-width="3"/>
              <text x="75" y="40" fill="#f59e0b" font-size="12" font-weight="bold">50 mm Chizg\u2018ich Shkalasi</text>
              <text x="35" y="68" fill="#94a3b8" font-size="10">100% masshtab \u2022 0% qog\u2018oz isrofi</text>
              <rect x="250" y="15" width="140" height="60" rx="6" fill="#064e3b" stroke="#10b981" stroke-width="2"/>
              <text x="265" y="40" fill="#6ee7b7" font-size="12" font-weight="bold">\u2713 1:1 Kalibrlangan</text>
              <text x="265" y="58" fill="#a7f3d0" font-size="10">Tejamkor va aniq</text>
            </svg>
          `
        },
        {
          num: 3,
          tag: "3-QADAM: Termik Fuzer (PIAF / Zychem)",
          title: "Termo-Qog\u2018ozni Qizdirish va O\u2018quvchiga Berish",
          description: "Chop etilgan mikrokapsulali taktil qog\u2018ozni (Zychem yoki PIAF Swell paper) termik fuzer qurilmasiga kiriting. Harorat regulyatorini 3\u20134 darajaga qo\u2018ying. Qora uglerodli siyoh infraqizil nurni yutib, mikrokapsulalarni ~0.5mm balandlikda qabartiradi.",
          tipTitle: "Yakuniy natija:",
          tip: "Fuzerdan chiqqan iliq qog\u2018ozdagi bo\u2018rtma nuqtalarni barmoq bilan paypaslab tekshiring va ko\u2018zi ojiz o\u2018quvchingizga taqdim eting!",
          visualSvg: `
            <svg viewBox="0 0 400 90" class="tour-step-svg" aria-hidden="true">
              <rect x="15" y="20" width="130" height="50" rx="6" fill="#1e293b" stroke="#dc2626" stroke-width="2"/>
              <text x="30" y="45" fill="#f87171" font-size="12" font-weight="bold">PIAF Fuzer (125\xB0C)</text>
              <text x="30" y="60" fill="#fca5a5" font-size="10">Infraqizil issiqlik</text>
              <path d="M 155 45 L 180 45" stroke="#f59e0b" stroke-width="3"/>
              <rect x="190" y="15" width="195" height="60" rx="6" fill="#1e1b4b" stroke="#818cf8" stroke-width="2"/>
              <circle cx="230" cy="45" r="9" fill="#000000" stroke="#818cf8" stroke-width="2"/>
              <circle cx="260" cy="45" r="9" fill="#000000" stroke="#818cf8" stroke-width="2"/>
              <text x="280" y="40" fill="#c7d2fe" font-size="12" font-weight="bold">~0.5mm Bo\u2018rtma</text>
              <text x="280" y="58" fill="#a5b4fc" font-size="10">Barmoq bilan o\u2018qish</text>
            </svg>
          `
        }
      ]
    },
    en: {
      modalTitle: "\u{1F9ED} First Swell Print Teacher Guide (3 Steps)",
      badge: "Teacher Onboarding & Hardware Guide",
      closeBtn: "Close",
      prevBtn: "Back",
      nextBtn: "Next",
      finishBtn: "Got it, Finish Guide",
      stepIndicator: (step, total) => `Step ${step} of ${total}`,
      steps: [
        {
          num: 1,
          tag: "STEP 1: Latin Input & Marburg Standard",
          title: "Enter Latin Text & Inspect Tactile Cells",
          description: "Type or paste your curriculum test passage or select a standardized entrance exam preset. AlifBraille transliterates Uzbek Latin deterministically in under 5ms into calibrated 6-dot cells adhering strictly to the universal Marburg standard (2.5mm dot pitch, 0.75mm dot radius).",
          tipTitle: "Key Rule:",
          tip: "Uzbek modified letters (o\u2018, g\u2018), digraphs (sh, ch), and numerals (#) are automatically transcribed with correct Braille codes.",
          visualSvg: `
            <svg viewBox="0 0 400 90" class="tour-step-svg" aria-hidden="true">
              <rect x="10" y="10" width="170" height="70" rx="6" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
              <text x="25" y="42" fill="#93c5fd" font-size="14" font-weight="bold">Uzbek Latin Input</text>
              <text x="25" y="62" fill="#cbd5e1" font-size="11">o\u2018, g\u2018, sh, ch, numerals</text>
              <path d="M 190 45 L 215 45" stroke="#10b981" stroke-width="3"/>
              <rect x="225" y="10" width="165" height="70" rx="6" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
              <text x="240" y="42" fill="#34d399" font-size="14" font-weight="bold">Marburg Braille (2.5mm)</text>
              <text x="240" y="62" fill="#cbd5e1" font-size="11">Tactile cell matrix</text>
            </svg>
          `
        },
        {
          num: 2,
          tag: "STEP 2: Printer Scaling & 50mm Calibration Ruler",
          title: "Verify 1:1 Scale Against 50mm Ruler Notch & Waste Reduction",
          description: 'Click Print Swell Sheet or Download Tactile SVG. CRUCIAL RULE: In your browser print dialog, always set Page Scale to "100%" (Actual Size). Never choose "Fit to Printable Area", which reduces scale to 94% and causes dots to merge under heat.',
          tipTitle: "Resource Efficiency & Sustainability:",
          tip: "Microcapsule swell sheets are expensive ($1.50\u2013$2.20/sheet) and energy-intensive to import into Central Asia. Pre-verifying the 50mm ruler notch with a desk ruler and checking in Swell Simulation mode (Alt+V) prevents ruined sheets, printer waste, and unnecessary thermal heating cycles.",
          visualSvg: `
            <svg viewBox="0 0 400 90" class="tour-step-svg" aria-hidden="true">
              <rect x="10" y="15" width="220" height="60" rx="4" fill="#0f172a" stroke="#cbd5e1" stroke-width="1"/>
              <line x1="25" y1="55" x2="215" y2="55" stroke="#f59e0b" stroke-width="3"/>
              <line x1="25" y1="45" x2="25" y2="55" stroke="#f59e0b" stroke-width="3"/>
              <line x1="120" y1="48" x2="120" y2="55" stroke="#f59e0b" stroke-width="2"/>
              <line x1="215" y1="45" x2="215" y2="55" stroke="#f59e0b" stroke-width="3"/>
              <text x="75" y="40" fill="#f59e0b" font-size="12" font-weight="bold">50mm Calibration Scale</text>
              <text x="35" y="68" fill="#94a3b8" font-size="10">100% scale \u2022 Zero ruined swell sheets</text>
              <rect x="250" y="15" width="140" height="60" rx="6" fill="#064e3b" stroke="#10b981" stroke-width="2"/>
              <text x="265" y="40" fill="#6ee7b7" font-size="12" font-weight="bold">\u2713 1:1 Calibrated</text>
              <text x="265" y="58" fill="#a7f3d0" font-size="10">Eco-efficient & precise</text>
            </svg>
          `
        },
        {
          num: 3,
          tag: "STEP 3: Thermal Microcapsule Fuser (PIAF / Zychem)",
          title: "Expand Microcapsules & Hand to Student",
          description: "Feed your printed swell sheet into a thermal fuser (PIAF or Zychem) set to heat level 3 to 4 (120\u2013130\xB0C). Pure black carbon ink absorbs infrared energy, causing microcapsules in the paper to expand into ~0.5mm raised tactile relief.",
          tipTitle: "Ready for Touch Reading:",
          tip: "Touch the warm sheet to feel the crisp raised dots, and immediately hand it to your visually impaired student for tactile reading!",
          visualSvg: `
            <svg viewBox="0 0 400 90" class="tour-step-svg" aria-hidden="true">
              <rect x="15" y="20" width="130" height="50" rx="6" fill="#1e293b" stroke="#dc2626" stroke-width="2"/>
              <text x="30" y="45" fill="#f87171" font-size="12" font-weight="bold">PIAF Fuser (125\xB0C)</text>
              <text x="30" y="60" fill="#fca5a5" font-size="10">Infrared heat pass</text>
              <path d="M 155 45 L 180 45" stroke="#f59e0b" stroke-width="3"/>
              <rect x="190" y="15" width="195" height="60" rx="6" fill="#1e1b4b" stroke="#818cf8" stroke-width="2"/>
              <circle cx="230" cy="45" r="9" fill="#000000" stroke="#818cf8" stroke-width="2"/>
              <circle cx="260" cy="45" r="9" fill="#000000" stroke="#818cf8" stroke-width="2"/>
              <text x="280" y="40" fill="#c7d2fe" font-size="12" font-weight="bold">~0.5mm 3D Relief</text>
              <text x="280" y="58" fill="#a5b4fc" font-size="10">Tactile touch reading</text>
            </svg>
          `
        }
      ]
    }
  };
  let modalEl = root.querySelector("#swell-tour-modal");
  if (!modalEl) {
    modalEl = document.createElement("dialog");
    modalEl.id = "swell-tour-modal";
    modalEl.className = "impact-modal tour-modal";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "tour-modal-title");
    root.appendChild(modalEl);
  }
  function renderContent() {
    if (!modalEl) return;
    const s = TEXTS[currentLang];
    const step = s.steps[currentStep - 1];
    modalEl.innerHTML = `
      <div class="modal-dialog-content tour-dialog-content">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <h2 id="tour-modal-title" class="modal-title">${s.modalTitle}</h2>
            <span class="modal-badge">${s.badge}</span>
          </div>
          <button id="tour-modal-close-btn" class="modal-close-btn" type="button" aria-label="${s.closeBtn}">\u2715</button>
        </div>

        <div class="modal-body tour-modal-body">
          <!-- Step indicators -->
          <div class="tour-stepper" role="navigation" aria-label="Tour steps">
            <div class="tour-stepper-progress">
              <span class="tour-step-pill ${currentStep === 1 ? "active" : currentStep > 1 ? "done" : ""}">1. Marburg</span>
              <span class="tour-step-divider">\u2192</span>
              <span class="tour-step-pill ${currentStep === 2 ? "active" : currentStep > 2 ? "done" : ""}">2. 50mm Shkala</span>
              <span class="tour-step-divider">\u2192</span>
              <span class="tour-step-pill ${currentStep === 3 ? "active" : ""}">3. Termik Fuzer</span>
            </div>
            <span class="tour-step-counter" aria-live="polite">${s.stepIndicator(currentStep, totalSteps)}</span>
          </div>

          <article class="tour-card">
            <div class="tour-card-header">
              <span class="tour-tag">${step.tag}</span>
              <h3 class="tour-step-title">${step.title}</h3>
            </div>

            <p class="tour-desc">${step.description}</p>

            <div class="tour-visual-box">
              ${step.visualSvg}
            </div>

            <div class="tour-tip-box">
              <strong>\u{1F4A1} ${step.tipTitle}</strong>
              <span>${step.tip}</span>
            </div>
          </article>
        </div>

        <div class="modal-footer tour-modal-footer">
          <button id="tour-prev-btn" class="toggle-button" type="button" ${currentStep === 1 ? "disabled" : ""}>
            ${s.prevBtn}
          </button>
          <div class="tour-footer-right">
            <button id="tour-skip-btn" class="toggle-button" type="button">
              ${s.closeBtn}
            </button>
            <button id="tour-next-btn" class="toggle-button active" type="button">
              ${currentStep === totalSteps ? s.finishBtn : s.nextBtn}
            </button>
          </div>
        </div>
      </div>
    `;
    const closeBtn = modalEl.querySelector("#tour-modal-close-btn");
    const skipBtn = modalEl.querySelector("#tour-skip-btn");
    const prevBtn = modalEl.querySelector("#tour-prev-btn");
    const nextBtn = modalEl.querySelector("#tour-next-btn");
    closeBtn?.addEventListener("click", closeTour);
    skipBtn?.addEventListener("click", closeTour);
    prevBtn?.addEventListener("click", () => {
      if (currentStep > 1) {
        currentStep--;
        renderContent();
      }
    });
    nextBtn?.addEventListener("click", () => {
      if (currentStep < totalSteps) {
        currentStep++;
        renderContent();
      } else {
        closeTour();
      }
    });
  }
  function trapFocus(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeTour();
      return;
    }
    if (e.key === "ArrowRight" && currentStep < totalSteps) {
      e.preventDefault();
      currentStep++;
      renderContent();
      return;
    }
    if (e.key === "ArrowLeft" && currentStep > 1) {
      e.preventDefault();
      currentStep--;
      renderContent();
      return;
    }
    if (e.key === "Tab") {
      const focusables = Array.from(
        modalEl.querySelectorAll(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !modalEl.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !modalEl.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }
  modalEl.addEventListener("keydown", trapFocus);
  function openTour() {
    if (!modalEl) return;
    currentStep = 1;
    renderContent();
    if (typeof document !== "undefined") {
      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");
    }
    if (typeof modalEl.showModal === "function") {
      try {
        modalEl.showModal();
      } catch {
        modalEl.setAttribute("open", "true");
      }
    } else {
      modalEl.setAttribute("open", "true");
    }
    modalEl.setAttribute("open", "true");
    modalEl.classList.add("is-open");
    const nextBtn = modalEl.querySelector("#tour-next-btn");
    nextBtn?.focus();
  }
  function closeTour() {
    if (!modalEl) return;
    if (typeof document !== "undefined") {
      const aboutModal = document.querySelector("#about-creator-modal");
      const quizModal = document.querySelector("#braille-quiz-modal");
      const isOtherOpen = aboutModal && (aboutModal.hasAttribute("open") || aboutModal.open) || quizModal && (quizModal.hasAttribute("open") || quizModal.open);
      if (!isOtherOpen) {
        document.body.classList.remove("modal-open");
        document.documentElement.classList.remove("modal-open");
      }
    }
    if (typeof modalEl.close === "function") {
      try {
        modalEl.close();
      } catch {
        modalEl.removeAttribute("open");
      }
    } else {
      modalEl.removeAttribute("open");
    }
    modalEl.removeAttribute("open");
    modalEl.classList.remove("is-open");
  }
  return {
    open: openTour,
    close: closeTour,
    setLang: (lang) => {
      currentLang = lang;
      if (modalEl?.hasAttribute("open") || modalEl?.classList.contains("is-open")) {
        renderContent();
      }
    },
    destroy: () => {
      modalEl?.remove();
    }
  };
}

// src/ui/proctor-key.ts
var STATE_EXAM_PROCTOR_DATA = [
  {
    number: 1,
    subjectUz: "Ona tili va Adabiyot",
    subjectEn: "Native Language & Literature",
    questionUz: "O\u2018zbek adabiy tilining asoschisi kim?",
    questionEn: "Who is the founder of the Uzbek literary language?",
    correctOption: "B",
    answerTextUz: "Alisher Navoiy",
    answerTextEn: "Alisher Navoiy",
    optionBrailleChar: "\u2803",
    optionBrailleDots: "1, 2-nuqtalar",
    cellPositionUz: "4-qator, 1\u20132 kataklar (\u2820\u2803\u2810)",
    cellPositionEn: "Line 4, Cells 1\u20132 (\u2820\u2803\u2810)",
    charBreakdown: [
      { char: "A", braille: "\u2801", dots: "1" },
      { char: "l", braille: "\u2807", dots: "1-2-3" },
      { char: "i", braille: "\u280A", dots: "2-4" },
      { char: "sh", braille: "\u2831", dots: "1-4-6 (digraf sh)" },
      { char: "e", braille: "\u2811", dots: "1-5" },
      { char: "r", braille: "\u2817", dots: "1-2-3-5" },
      { char: "N", braille: "\u281D", dots: "1-3-4-5" },
      { char: "a", braille: "\u2801", dots: "1" },
      { char: "v", braille: "\u283A", dots: "2-4-5-6" },
      { char: "o", braille: "\u2815", dots: "1-3-5" },
      { char: "i", braille: "\u280A", dots: "2-4" },
      { char: "y", braille: "\u283D", dots: "1-3-4-5-6" }
    ],
    proctorTipUz: 'Katakcha 1-2 nuqtalari (\u2803) bilan boshlanadi. "sh" harfi 1-4-6 (\u2831) bitta katakda joylashgan.',
    proctorTipEn: 'Cell begins with dots 1-2 (\u2803). Note the digraph "sh" is a single tactile cell with dots 1-4-6 (\u2831).'
  },
  {
    number: 2,
    subjectUz: "Imlo va Grafika",
    subjectEn: "Orthography & Phonetics",
    questionUz: 'Qaysi so\u2018zda "g\u2018" maxsus harfi to\u2018g\u2018ri qo\u2018llangan?',
    questionEn: 'In which word is the special letter "g\u2018" correctly applied?',
    correctOption: "A",
    answerTextUz: "bog\u2018bon",
    answerTextEn: "bog\u2018bon",
    optionBrailleChar: "\u2801",
    optionBrailleDots: "1-nuqta",
    cellPositionUz: "8-qator, 1\u20132 kataklar (\u2820\u2801\u2810)",
    cellPositionEn: "Line 8, Cells 1\u20132 (\u2820\u2801\u2810)",
    charBreakdown: [
      { char: "b", braille: "\u2803", dots: "1-2" },
      { char: "o", braille: "\u2815", dots: "1-3-5" },
      { char: "g\u2018", braille: "\u2839", dots: "1-2-5-6 (maxsus g\u2018)" },
      { char: "b", braille: "\u2803", dots: "1-2" },
      { char: "o", braille: "\u2815", dots: "1-3-5" },
      { char: "n", braille: "\u281D", dots: "1-3-4-5" }
    ],
    proctorTipUz: 'To\u2018g\u2018ri javob A (1-nuqta). "g\u2018" harfi 1-2-5-6 (\u2839) bitta katakda ifodalangan.',
    proctorTipEn: 'Correct answer A (dot 1). The special Uzbek letter "g\u2018" is encoded as single cell dots 1-2-5-6 (\u2839).'
  },
  {
    number: 3,
    subjectUz: "Morfologiya",
    subjectEn: "Morphology",
    questionUz: "Quyidagi so\u2018zlardan qaysi biri qo\u2018shma so\u2018z hisoblanadi?",
    questionEn: "Which of the following words is a compound word?",
    correctOption: "C",
    answerTextUz: "ko\u2018zoynak",
    answerTextEn: "ko\u2018zoynak",
    optionBrailleChar: "\u2809",
    optionBrailleDots: "1, 4-nuqtalar",
    cellPositionUz: "13-qator, 1\u20132 kataklar (\u2820\u2809\u2810)",
    cellPositionEn: "Line 13, Cells 1\u20132 (\u2820\u2809\u2810)",
    charBreakdown: [
      { char: "k", braille: "\u2805", dots: "1-3" },
      { char: "o\u2018", braille: "\u282A", dots: "2-4-6 (maxsus o\u2018)" },
      { char: "z", braille: "\u2835", dots: "1-3-5-6" },
      { char: "o", braille: "\u2815", dots: "1-3-5" },
      { char: "y", braille: "\u283D", dots: "1-3-4-5-6" },
      { char: "n", braille: "\u281D", dots: "1-3-4-5" },
      { char: "a", braille: "\u2801", dots: "1" },
      { char: "k", braille: "\u2805", dots: "1-3" }
    ],
    proctorTipUz: 'To\u2018g\u2018ri javob C (1-4 nuqtalar). "o\u2018" harfi 2-4-6 (\u282A) katakchasiga ega.',
    proctorTipEn: 'Correct answer C (dots 1-4). "o\u2018" is encoded as cell dots 2-4-6 (\u282A).'
  },
  {
    number: 4,
    subjectUz: "Davlat Ramzlari",
    subjectEn: "National Symbols",
    questionUz: '"Serquyosh, hur o\u2018lkam..." misrasi qaysi asardan olingan?',
    questionEn: 'From which work is the line "Serquyosh, hur o\u2018lkam..." taken?',
    correctOption: "B",
    answerTextUz: "Davlat Madhiyasi",
    answerTextEn: "Davlat Madhiyasi",
    optionBrailleChar: "\u2803",
    optionBrailleDots: "1, 2-nuqtalar",
    cellPositionUz: "17-qator, 1\u20132 kataklar (\u2820\u2803\u2810)",
    cellPositionEn: "Line 17, Cells 1\u20132 (\u2820\u2803\u2810)",
    charBreakdown: [
      { char: "D", braille: "\u2819", dots: "1-4-5" },
      { char: "a", braille: "\u2801", dots: "1" },
      { char: "v", braille: "\u283A", dots: "2-4-5-6" },
      { char: "l", braille: "\u2807", dots: "1-2-3" },
      { char: "a", braille: "\u2801", dots: "1" },
      { char: "t", braille: "\u281E", dots: "2-3-4-5" }
    ],
    proctorTipUz: "To\u2018g\u2018ri javob B (1-2 nuqtalar). Matn boshida bosh harf belgisi (\u2820) mavjud.",
    proctorTipEn: "Correct answer B (dots 1-2). Capital indicator (\u2820) precedes the first word."
  },
  {
    number: 5,
    subjectUz: "Fonetika va Digraflar",
    subjectEn: "Phonetics & Digraphs",
    questionUz: 'Qaysi javobda "sh" va "ch" tovushlari qatnashgan so\u2018z berilgan?',
    questionEn: 'Which answer contains a word with both "sh" and "ch" sounds?',
    correctOption: "A",
    answerTextUz: "shoshilinch",
    answerTextEn: "shoshilinch",
    optionBrailleChar: "\u2801",
    optionBrailleDots: "1-nuqta",
    cellPositionUz: "21-qator, 1\u20132 kataklar (\u2820\u2801\u2810)",
    cellPositionEn: "Line 21, Cells 1\u20132 (\u2820\u2801\u2810)",
    charBreakdown: [
      { char: "sh", braille: "\u2831", dots: "1-4-6 (sh)" },
      { char: "o", braille: "\u2815", dots: "1-3-5" },
      { char: "sh", braille: "\u2831", dots: "1-4-6 (sh)" },
      { char: "i", braille: "\u280A", dots: "2-4" },
      { char: "l", braille: "\u2807", dots: "1-2-3" },
      { char: "i", braille: "\u280A", dots: "2-4" },
      { char: "n", braille: "\u281D", dots: "1-3-4-5" },
      { char: "ch", braille: "\u281F", dots: "1-2-3-4-6 (ch)" }
    ],
    proctorTipUz: 'To\u2018g\u2018ri javob A (1-nuqta). "sh" (\u2831) va so\u2018nggi "ch" (\u281F) alohida 6-nuqtali katakchalardir.',
    proctorTipEn: 'Correct answer A (dot 1). "sh" (\u2831) and trailing "ch" (\u281F) are single 6-dot digraph cells.'
  },
  {
    number: 6,
    subjectUz: "Sintaksis & Gap Bo\u2018laklari",
    subjectEn: "Syntax & Sentence Structure",
    questionUz: '"O\u2018quvchilar chuqur bilim olishmoqda." Ushbu gapda nechta so\u2018z bor?',
    questionEn: '"O\u2018quvchilar chuqur bilim olishmoqda." How many words are in this sentence?',
    correctOption: "B",
    answerTextUz: "4 ta",
    answerTextEn: "4 ta",
    optionBrailleChar: "\u2803",
    optionBrailleDots: "1, 2-nuqtalar",
    cellPositionUz: "26-qator, 1\u20132 kataklar (\u2820\u2803\u2810)",
    cellPositionEn: "Line 26, Cells 1\u20132 (\u2820\u2803\u2810)",
    charBreakdown: [
      { char: "#", braille: "\u283C", dots: "3-4-5-6 (raqam belgisi)" },
      { char: "4", braille: "\u2819", dots: "1-4-5" },
      { char: "t", braille: "\u281E", dots: "2-3-4-5" },
      { char: "a", braille: "\u2801", dots: "1" }
    ],
    proctorTipUz: "To\u2018g\u2018ri javob B (1-2 nuqtalar). Raqam oldidan doimo \u283C prefiksi keladi.",
    proctorTipEn: "Correct answer B (dots 1-2). Digits are always prefixed by Braille numeral sign \u283C."
  },
  {
    number: 7,
    subjectUz: "O\u2018zbekiston Tarixi",
    subjectEn: "History of Uzbekistan",
    questionUz: "O\u2018zbekiston Respublikasi Konstitutsiyasi nechanchi yilda qabul qilingan?",
    questionEn: "In what year was the Constitution of Uzbekistan adopted?",
    correctOption: "B",
    answerTextUz: "1992-yil",
    answerTextEn: "1992-yil",
    optionBrailleChar: "\u2803",
    optionBrailleDots: "1, 2-nuqtalar",
    cellPositionUz: "30-qator, 1\u20132 kataklar (\u2820\u2803\u2810)",
    cellPositionEn: "Line 30, Cells 1\u20132 (\u2820\u2803\u2810)",
    charBreakdown: [
      { char: "#", braille: "\u283C", dots: "3-4-5-6" },
      { char: "1", braille: "\u2801", dots: "1" },
      { char: "9", braille: "\u280A", dots: "2-4" },
      { char: "9", braille: "\u280A", dots: "2-4" },
      { char: "2", braille: "\u2803", dots: "1-2" },
      { char: "-", braille: "\u2824", dots: "3-6" },
      { char: "y", braille: "\u283D", dots: "1-3-4-5-6" },
      { char: "i", braille: "\u280A", dots: "2-4" },
      { char: "l", braille: "\u2807", dots: "1-2-3" }
    ],
    proctorTipUz: "To\u2018g\u2018ri javob B (1-2 nuqtalar). 1992 soni \u283C\u2801\u280A\u280A\u2803 katakchalari bilan berilgan.",
    proctorTipEn: "Correct answer B (dots 1-2). The year 1992 is written as \u283C\u2801\u280A\u280A\u2803."
  },
  {
    number: 8,
    subjectUz: "Fonetika: Undoshlar",
    subjectEn: "Phonetics: Consonants",
    questionUz: "Quyidagilardan qaysi biri undosh tovush hisoblanadi?",
    questionEn: "Which of the following sounds is a consonant?",
    correctOption: "C",
    answerTextUz: "g\u2018",
    answerTextEn: "g\u2018",
    optionBrailleChar: "\u2809",
    optionBrailleDots: "1, 4-nuqtalar",
    cellPositionUz: "35-qator, 1\u20132 kataklar (\u2820\u2809\u2810)",
    cellPositionEn: "Line 35, Cells 1\u20132 (\u2820\u2809\u2810)",
    charBreakdown: [{ char: "g\u2018", braille: "\u2839", dots: "1-2-5-6" }],
    proctorTipUz: "To\u2018g\u2018ri javob C (1-4 nuqtalar). Undosh g\u2018 tovushi 1-2-5-6 (\u2839) katakchasidir.",
    proctorTipEn: "Correct answer C (dots 1-4). Consonant g\u2018 is single tactile cell 1-2-5-6 (\u2839)."
  },
  {
    number: 9,
    subjectUz: "Sintaksis: Gap Egasi",
    subjectEn: "Syntax: Sentence Subject",
    questionUz: '"Kitob \u2014 bilim manbai." Ushbu gapning egasi qaysi so\u2018z?',
    questionEn: '"Kitob \u2014 bilim manbai." What is the subject of this sentence?',
    correctOption: "C",
    answerTextUz: "kitob",
    answerTextEn: "kitob",
    optionBrailleChar: "\u2809",
    optionBrailleDots: "1, 4-nuqtalar",
    cellPositionUz: "39-qator, 1\u20132 kataklar (\u2820\u2809\u2810)",
    cellPositionEn: "Line 39, Cells 1\u20132 (\u2820\u2809\u2810)",
    charBreakdown: [
      { char: "k", braille: "\u2805", dots: "1-3" },
      { char: "i", braille: "\u280A", dots: "2-4" },
      { char: "t", braille: "\u281E", dots: "2-3-4-5" },
      { char: "o", braille: "\u2815", dots: "1-3-5" },
      { char: "b", braille: "\u2803", dots: "1-2" }
    ],
    proctorTipUz: 'To\u2018g\u2018ri javob C (1-4 nuqtalar). "kitob" so\u2018zi \u2805\u280A\u281E\u2815\u2803 katakchalaridan iborat.',
    proctorTipEn: 'Correct answer C (dots 1-4). Word "kitob" is formed of cells \u2805\u280A\u281E\u2815\u2803.'
  },
  {
    number: 10,
    subjectUz: "Matematika & Hisob",
    subjectEn: "Mathematics & Calculation",
    questionUz: "Matematik ifoda natijasini toping: 25 + 15 = ?",
    questionEn: "Find the result of the mathematical expression: 25 + 15 = ?",
    correctOption: "C",
    answerTextUz: "40",
    answerTextEn: "40",
    optionBrailleChar: "\u2809",
    optionBrailleDots: "1, 4-nuqtalar",
    cellPositionUz: "43-qator, 1\u20132 kataklar (\u2820\u2809\u2810)",
    cellPositionEn: "Line 43, Cells 1\u20132 (\u2820\u2809\u2810)",
    charBreakdown: [
      { char: "#", braille: "\u283C", dots: "3-4-5-6" },
      { char: "4", braille: "\u2819", dots: "1-4-5" },
      { char: "0", braille: "\u281A", dots: "2-4-5" }
    ],
    proctorTipUz: "To\u2018g\u2018ri javob C (1-4 nuqtalar). 40 soni \u283C\u2819\u281A (prefiks + 4 + 0) ko\u2018rinishida berilgan.",
    proctorTipEn: "Correct answer C (dots 1-4). Number 40 is written as \u283C\u2819\u281A (prefix + 4 + 0)."
  }
];
function generateProctorKeyHtml(lang = "uz") {
  const isEn = lang === "en";
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${isEn ? "AlifBraille - Sighted Proctor Answer Key (10-Question State Exam)" : "AlifBraille - Nazoratchi Javoblar Kaliti (Davlat Imtihoni 10-Savol)"}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 24px; color: #0f172a; line-height: 1.5; }
    .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
    h1 { font-size: 20px; margin: 0 0 6px 0; color: #0f172a; }
    .meta { font-size: 13px; color: #475569; }
    .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #1e293b; }
    td { padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top; }
    tr:nth-child(even) { background: #f8fafc; }
    .cell-opt { font-weight: bold; font-size: 15px; color: #0284c7; }
    .braille-char { font-size: 20px; font-family: monospace; display: inline-block; margin-right: 4px; }
    .tip { font-size: 12px; color: #475569; margin-top: 4px; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
    @media print {
      body { margin: 10mm; font-size: 11px; }
      th, td { padding: 5px 6px; }
      .braille-char { font-size: 16px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="badge">${isEn ? "SXSW EDU Impact Challenge \u2022 Sighted Proctor Sheet" : "Davlat Imtihoni \u2022 Ko\u2018zi Ochiq Nazoratchi Shiti"}</span>
    <h1>${isEn ? "\u{1F4CB} Sighted Proctor Answer Key: 10-Question State Entrance Exam" : "\u{1F4CB} Nazoratchi Javoblar Kaliti: 10 ta Savolli Davlat Kirish Imtihoni"}</h1>
    <div class="meta">${isEn ? "Universal Marburg standard cross-reference for non-Braille-reading test supervisors. Matches official DTM exam format." : "Ko\u2018rishida nuqsoni bo\u2018lmagan imtihon nazoratchilari uchun lotin matni va Brayl katakchalari mosligi jadvali."}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 6%;">#</th>
        <th style="width: 28%;">${isEn ? "Question & Subject" : "Savol va Fan"}</th>
        <th style="width: 22%;">${isEn ? "Correct Answer (Latin)" : "To\u2018g\u2018ri Javob (Lotin)"}</th>
        <th style="width: 18%;">${isEn ? "Braille Option & Cell" : "Brayl Javob Katakchasi"}</th>
        <th style="width: 26%;">${isEn ? "Proctor Verification Guide" : "Nazoratchi uchun Yo\u2018riqnoma"}</th>
      </tr>
    </thead>
    <tbody>
      ${STATE_EXAM_PROCTOR_DATA.map((q) => {
    const qTitle = isEn ? q.questionEn : q.questionUz;
    const subj = isEn ? q.subjectEn : q.subjectUz;
    const ans = isEn ? q.answerTextEn : q.answerTextUz;
    const tip = isEn ? q.proctorTipEn : q.proctorTipUz;
    const pos = isEn ? q.cellPositionEn : q.cellPositionUz;
    return `
        <tr>
          <td><strong>${q.number}</strong></td>
          <td>
            <strong>${subj}</strong><br>
            ${qTitle}
          </td>
          <td>
            <span class="cell-opt">${q.correctOption})</span> <strong>${ans}</strong>
          </td>
          <td>
            <span class="braille-char">${q.optionBrailleChar}</span> (${q.optionBrailleDots})<br>
            <small style="color: #64748b;">${pos}</small>
          </td>
          <td>
            <div class="tip">${tip}</div>
          </td>
        </tr>
      `;
  }).join("")}
    </tbody>
  </table>

  <div class="footer">
    <strong>AlifBraille Tactile Bridge</strong> \u2022 Tashkent, Uzbekistan \u2022 Free &amp; open source (MIT) \u2022 Creator: Elshod Kenjayev (@Elshod09K)
  </div>
</body>
</html>`;
}
function initProctorKeyModal(root) {
  let currentLang = "uz";
  let modalEl = root.querySelector("#proctor-key-modal");
  if (!modalEl) {
    modalEl = document.createElement("dialog");
    modalEl.id = "proctor-key-modal";
    modalEl.className = "impact-modal proctor-key-modal";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "proctor-key-modal-title");
    root.appendChild(modalEl);
  }
  function renderModalContent() {
    if (!modalEl) return;
    const isEn = currentLang === "en";
    modalEl.innerHTML = `
      <div class="modal-dialog-content">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <h2 id="proctor-key-modal-title" class="modal-title">
              \u{1F4CB} ${isEn ? "Sighted Proctor Answer Key (10-Question State Exam)" : "Nazoratchi Javoblar Kaliti (Davlat Imtihoni 10 ta Savol)"}
            </h2>
            <span class="modal-badge">${isEn ? "Non-Braille-Reading Proctor Cross-Reference" : "Ko\u2018zi ochiq imtihon nazoratchilari uchun qo\u2018llanma"}</span>
          </div>
          <button id="proctor-modal-close-btn" class="modal-close-btn" type="button" aria-label="${isEn ? "Close proctor key (Esc)" : "Kalitni yopish (Esc)"}">\u2715</button>
        </div>

        <div class="modal-body" style="padding: 1.25rem 1.5rem; overflow-y: auto; max-height: calc(88vh - 140px);">
          <div class="proctor-intro-banner" style="background: rgba(2, 132, 199, 0.12); border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 6px; margin-bottom: 1.25rem;">
            <p style="margin: 0; font-size: 0.95rem; line-height: 1.5;">
              ${isEn ? "<strong>For Sighted Test Proctors:</strong> Blind students read tactile swell-paper test sheets during university entrance examinations. This key prints standard Uzbek Latin text side-by-side with Braille cell numbers, line positions, and dot configurations so non-Braille-reading proctors can verify student answers with 100% certainty." : "<strong>Ko\u2018zi ochiq nazoratchilar uchun:</strong> Ko\u2018rishida nuqsoni bo\u2018lgan o\u2018quvchilar oliygoh kirish imtihonlarida taktil Brayl varaqlaridan foydalanishadi. Ushbu kalit lotin yozuvidagi savollarni Brayl katakchalari raqamlari va nuqtalar tartibi bilan yonma-yon ko\u2018rsatib, Brayl o\u2018qiy olmaydigan nazoratchilarga ham tekshirish imkonini beradi."}
            </p>
          </div>

          <div class="proctor-actions-bar" style="display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap;">
            <button id="download-proctor-doc-btn" class="toggle-button" type="button" style="background: #0284c7; color: #ffffff; border-color: #0284c7; font-weight: bold;">
              \u2B07\uFE0F ${isEn ? "Download Printable Key (.HTML)" : "Javoblar Kalitini Yuklab Olish (.HTML)"}
            </button>
            <button id="print-proctor-doc-btn" class="toggle-button" type="button">
              \u{1F5A8}\uFE0F ${isEn ? "Print Proctor Key" : "Kalitni Chop Etish"}
            </button>
          </div>

          <div class="proctor-table-wrap" style="overflow-x: auto;">
            <table class="proctor-key-table" style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
              <thead>
                <tr style="background: var(--color-bg-elevated); border-bottom: 2px solid var(--color-border);">
                  <th style="padding: 10px; text-align: left; width: 6%;">#</th>
                  <th style="padding: 10px; text-align: left; width: 30%;">${isEn ? "Latin Prompt & Subject" : "Lotin Savoli va Fani"}</th>
                  <th style="padding: 10px; text-align: left; width: 22%;">${isEn ? "Correct Latin Answer" : "To\u2018g\u2018ri Javob (Lotin)"}</th>
                  <th style="padding: 10px; text-align: left; width: 18%;">${isEn ? "Braille Cell (Dots)" : "Brayl Katakchasi (Nuqtalar)"}</th>
                  <th style="padding: 10px; text-align: left; width: 24%;">${isEn ? "Proctor Inspection Guide" : "Nazorat Ko\u2018rsatmasi"}</th>
                </tr>
              </thead>
              <tbody>
                ${STATE_EXAM_PROCTOR_DATA.map((q) => {
      const qText = isEn ? q.questionEn : q.questionUz;
      const subj = isEn ? q.subjectEn : q.subjectUz;
      const ans = isEn ? q.answerTextEn : q.answerTextUz;
      const tip = isEn ? q.proctorTipEn : q.proctorTipUz;
      const pos = isEn ? q.cellPositionEn : q.cellPositionUz;
      return `
                    <tr style="border-bottom: 1px solid var(--color-border);">
                      <td style="padding: 10px; font-weight: bold;">${q.number}</td>
                      <td style="padding: 10px;">
                        <span style="font-size: 0.8rem; color: var(--color-accent); font-weight: bold; text-transform: uppercase;">${subj}</span><br>
                        <strong>${qText}</strong>
                      </td>
                      <td style="padding: 10px;">
                        <span style="font-weight: 800; font-size: 1.1rem; color: #0284c7;">${q.correctOption})</span> <strong>${ans}</strong>
                      </td>
                      <td style="padding: 10px;">
                        <div style="font-size: 1.5rem; font-family: monospace; line-height: 1;">${q.optionBrailleChar}</div>
                        <div style="font-size: 0.82rem; color: var(--color-text-muted);">${q.optionBrailleDots}</div>
                        <div style="font-size: 0.78rem; color: #059669; font-weight: bold;">${pos}</div>
                      </td>
                      <td style="padding: 10px; font-size: 0.85rem; line-height: 1.4;">
                        ${tip}
                      </td>
                    </tr>
                  `;
    }).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 2px solid var(--color-border); display: flex; justify-content: flex-end;">
          <button id="proctor-footer-close-btn" class="toggle-button" type="button">
            ${isEn ? "Close" : "Yopish"}
          </button>
        </div>
      </div>
    `;
    modalEl.querySelector("#proctor-modal-close-btn")?.addEventListener("click", () => close());
    modalEl.querySelector("#proctor-footer-close-btn")?.addEventListener("click", () => close());
    modalEl.querySelector("#download-proctor-doc-btn")?.addEventListener("click", () => downloadKey());
    modalEl.querySelector("#print-proctor-doc-btn")?.addEventListener("click", () => printKey());
  }
  function open() {
    if (!modalEl) return;
    renderModalContent();
    if (typeof document !== "undefined") {
      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");
    }
    if (typeof modalEl.showModal === "function") {
      try {
        modalEl.showModal();
      } catch {
        modalEl.setAttribute("open", "true");
      }
    } else {
      modalEl.setAttribute("open", "true");
    }
    modalEl.classList.add("is-open");
    const closeBtn = modalEl.querySelector("#proctor-modal-close-btn");
    closeBtn?.focus();
  }
  function close() {
    if (!modalEl) return;
    if (typeof document !== "undefined") {
      const otherModalsOpen = document.querySelector("#braille-quiz-modal[open], #about-creator-modal[open], #swell-tour-modal[open]");
      if (!otherModalsOpen) {
        document.body.classList.remove("modal-open");
        document.documentElement.classList.remove("modal-open");
      }
    }
    if (typeof modalEl.close === "function") {
      try {
        modalEl.close();
      } catch {
        modalEl.removeAttribute("open");
      }
    } else {
      modalEl.removeAttribute("open");
    }
    modalEl.classList.remove("is-open");
    const triggerBtn = root.querySelector("#proctor-key-btn");
    triggerBtn?.focus();
  }
  function setLang(lang) {
    currentLang = lang;
    if (modalEl && (modalEl.hasAttribute("open") || modalEl.classList.contains("is-open"))) {
      renderModalContent();
    }
  }
  function downloadKey() {
    const htmlContent = generateProctorKeyHtml(currentLang);
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alifbraille-proctor-answer-key-10q-${currentLang}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function printKey() {
    if (typeof window !== "undefined" && typeof window.print === "function") {
      try {
        window.print();
      } catch {
      }
    }
  }
  function destroy() {
    if (modalEl && modalEl.parentNode) {
      modalEl.parentNode.removeChild(modalEl);
    }
  }
  return {
    open,
    close,
    setLang,
    downloadKey,
    printKey,
    destroy
  };
}

// src/ui/app.ts
var APOSTROPHE_REGEX4 = /^[ʻ‘'’`´ʼ]/;
function textToTactileItems(text) {
  if (!text) return [];
  const items = [];
  let inNumberMode = false;
  let i = 0;
  const len = text.length;
  while (i < len) {
    const char = text[i];
    const nextChar = i + 1 < len ? text[i + 1] : "";
    if (char >= "0" && char <= "9") {
      if (!inNumberMode) {
        items.push({ char: "#", braille: BRAILLE_NUMBER_PREFIX });
        inNumberMode = true;
      }
      items.push({ char, braille: charToBraille(char) });
      i++;
      continue;
    }
    inNumberMode = false;
    const charLower = char.toLowerCase();
    if ((charLower === "o" || charLower === "g") && APOSTROPHE_REGEX4.test(nextChar)) {
      const pair = text.slice(i, i + 2);
      items.push({ char: pair, braille: charToBraille(pair) });
      i += 2;
      continue;
    }
    if (charLower === "s" && nextChar.toLowerCase() === "h" || charLower === "c" && nextChar.toLowerCase() === "h") {
      const digraph = text.slice(i, i + 2);
      items.push({ char: digraph, braille: charToBraille(digraph) });
      i += 2;
      continue;
    }
    items.push({ char, braille: charToBraille(char) || "\u2800" });
    i++;
  }
  return items;
}
function initApp(root) {
  let currentLang = "uz";
  setupGlobalGestureUnlock();
  const STRINGS = {
    uz: {
      tagline: "O\u2018zbek lotin matnidan chop etishga tayyor Brayl yozuvi",
      heroEyebrow: "Bepul \xB7 Ochiq kodli \xB7 Internetsiz ishlaydi",
      heroTitle: "Lotin yozuvi kiradi. <em>Brayl</em> chiqadi.",
      heroSub: "Ko\u2018zi ojiz o\u2018quvchilar va ularga imtihon materiallarini tayyorlaydigan ko\u2018zi ochiq o\u2018qituvchilar uchun.",
      heroStats: ["393 ta test", "~4 ms / 500 belgi", "Marburg 2.5 mm", "0 so\u2018m"],
      skipLink: "Asosiy matn maydoniga o\u2018tish",
      presetDefault: "-- Namuna matnni tanlang --",
      presetAria: "Namuna matn (Alt+P)",
      highContrast: "Yuqori kontrast",
      highContrastAria: "Yuqori kontrast rejimini yoqish yoki o\u2018chirish (Alt+H)",
      langToggle: "English",
      langToggleAria: "Switch to English interface for international pitch evaluation (Alt+E)",
      aboutCreatorBtn: "Loyiha haqida",
      aboutCreatorAria: "O\u2018quvchi muallif, ijtimoiy ta\u2019sir va reja (Alt+A)",
      inputHeading: "Lotin Yozuvi",
      charCount: (n) => `${n} ta belgi`,
      placeholder: "O\u2018zbek lotin matnini shu yerga yozing yoki namunani tanlang...",
      inputAria: "O\u2018zbek lotin matni kiriting (Alt+I)",
      outputHeading: "Taktil Brayl",
      outputAria: "6 nuqtali Brayl taktil ko\u2018rinishi (Alt+O)",
      exportSvg: "SVG Yuklab Olish",
      exportSvgAria: "Brayl taktil SVG faylini yuklab olish (Alt+S)",
      print: "Chop Etish",
      printAria: "Taktil qog\u2018ozga chop etish (Alt+C)",
      previewBtn: "Qog\u2018oz ko\u2018rinishi",
      previewBtnAria: "Taktil qog\u2018oz va qavariq simulyatsiyasini ko\u2018rish (Alt+V)",
      quizBtn: "Viktorina",
      quizBtnAria: "Brayl viktorinasi va ikki tomonlama tekshiruv (Alt+Q)",
      tourBtn: "Chop etish qo\u2018llanmasi",
      tourBtnAria: "Birinchi taktil chop etish bo\u2018yicha 3 bosqichli o\u2018qituvchi qo\u2018llanmasi (Alt+T)",
      proctorBtn: "Nazoratchi kaliti",
      proctorBtnAria: "Ko\u2018zi ochiq nazoratchi javoblar kaliti va Brayl katakchalari (Alt+K)",
      tactileCellsBadge: (n) => `${n} ta taktil katakcha`,
      tactilePreviewHint: "Marburg Medium \xB7 2.5 mm nuqta oralig\u2018i",
      statusEmpty: "Matn maydoni bo\u2018sh. 0 ta belgi.",
      statusRendered: (chars, cells) => `${chars} ta belgi kiritildi, ${cells} ta taktil brayl katakchasi yaratildi.`,
      statusPresetLoaded: (title, count) => `"${title}" namunasi yuklandi. ${count} ta belgi kiritildi.`,
      statusHighContrastOn: "Yuqori kontrast rejimi (AAA) faollashtirildi.",
      statusHighContrastOff: "Standart kontrast rejimi faollashtirildi.",
      statusLangSwitched: "O\u2018zbekcha interfeys faollashtirildi.",
      statusSimulationOn: "Taktil simulyatsiya yoqildi: A4 sahifa hoshiyalari va 3D qavariq nuqtalar ko\u2018rsatilmoqda.",
      statusSimulationOff: "Standart tahrirlash ko\u2018rinishi faollashtirildi.",
      metaDoc: "Hujjat (Brayl):",
      metaPage: "Sahifa (Brayl):"
    },
    en: {
      tagline: "Uzbek Latin to print-ready Braille",
      heroEyebrow: "Free \xB7 Open source \xB7 Works offline",
      heroTitle: "Uzbek Latin in. <em>Braille</em> out.",
      heroSub: "Built for blind students and the sighted teachers who prepare their exam materials.",
      heroStats: ["393 tests passing", "~4 ms per 500 chars", "Marburg 2.5 mm dots", "$0 for schools"],
      skipLink: "Skip to primary text editor",
      presetDefault: "-- Select Sample Text --",
      presetAria: "Select educational preset (Alt+P)",
      highContrast: "High contrast",
      highContrastAria: "Toggle WCAG AAA high contrast mode (Alt+H)",
      langToggle: "O\u2018zbekcha",
      langToggleAria: "O\u2018zbek tilidagi interfeysga qaytish (Alt+E)",
      aboutCreatorBtn: "About",
      aboutCreatorAria: "About the solo student creator, pilot plan & hardware (Alt+A)",
      inputHeading: "Latin Script Input",
      charCount: (n) => `${n} characters`,
      placeholder: "Type or paste Uzbek Latin text here, or select a curriculum preset above...",
      inputAria: "Enter Uzbek Latin text (Alt+I)",
      outputHeading: "Tactile Braille Grid",
      outputAria: "6-dot Braille tactile matrix view (Alt+O)",
      exportSvg: "Download Tactile SVG",
      exportSvgAria: "Download calibrated Marburg tactile vector SVG file (Alt+S)",
      print: "Print Swell Sheet",
      printAria: "Print onto microcapsule swell paper for thermal fuser (Alt+C)",
      previewBtn: "Swell preview",
      previewBtnAria: "Toggle tactile swell paper simulation and margin preview (Alt+V)",
      quizBtn: "Braille quiz",
      quizBtnAria: "Open Braille reverse quiz and interactive verification (Alt+Q)",
      tourBtn: "Print guide",
      tourBtnAria: "3-Step First Swell Print Teacher Guide (Alt+T)",
      proctorBtn: "Proctor key",
      proctorBtnAria: "Sighted proctor answer key and Braille cell overlay (Alt+K)",
      tactileCellsBadge: (n) => `${n} tactile cells`,
      tactilePreviewHint: "Marburg Medium \xB7 2.5 mm dot pitch",
      statusEmpty: "Text editor is empty. 0 characters.",
      statusRendered: (chars, cells) => `${chars} characters transliterated into ${cells} tactile Braille cells.`,
      statusPresetLoaded: (title, count) => `Preset "${title}" loaded (${count} characters).`,
      statusHighContrastOn: "High contrast AAA mode activated.",
      statusHighContrastOff: "Standard contrast mode activated.",
      statusLangSwitched: "English interface enabled for pitch evaluation.",
      statusSimulationOn: "Swell paper simulation active: A4 margins, 2.5mm spacing, and 3D tactile relief preview.",
      statusSimulationOff: "Standard editing view activated.",
      metaDoc: "Doc (Braille):",
      metaPage: "Page (Braille):"
    }
  };
  if (!root.querySelector("#latin-input")) {
    root.innerHTML = `
      <div class="app-container">
        <a href="#latin-input" class="skip-link">${STRINGS.uz.skipLink}</a>
        <header class="app-header" role="banner">
          <div class="header-top">
            <div class="brand">
              <span class="brand-mark" aria-hidden="true">
                <i class="on"></i><i></i><i class="on"></i><i class="on"></i><i></i><i class="on"></i>
              </span>
              <div class="header-title-group">
                <h1>AlifBraille</h1>
                <p id="header-tagline" class="header-tagline">${STRINGS.uz.tagline}</p>
              </div>
            </div>
            <div class="header-switches">
                <button
                  id="high-contrast-toggle"
                  class="toggle-button"
                  type="button"
                  aria-pressed="false"
                  aria-label="${STRINGS.uz.highContrastAria}"
                >
                  ${STRINGS.uz.highContrast}
                </button>
                <button
                  id="lang-toggle-btn"
                  class="toggle-button lang-toggle-btn"
                  type="button"
                  tabindex="-1"
                  aria-label="${STRINGS.uz.langToggleAria}"
                >
                  ${STRINGS.uz.langToggle}
                </button>
            </div>
          </div>
          <section class="hero" aria-labelledby="hero-title">
            <p id="hero-eyebrow" class="hero-eyebrow">${STRINGS.uz.heroEyebrow}</p>
            <h2 id="hero-title" class="hero-title">${STRINGS.uz.heroTitle}</h2>
            <p id="hero-sub" class="hero-sub">${STRINGS.uz.heroSub}</p>
            <ul id="hero-stats" class="hero-stats">
              ${STRINGS.uz.heroStats.map((t) => `<li>${t}</li>`).join("")}
            </ul>
          </section>
          <div class="controls-row">
            <div class="toolbar-primary">
              <div id="audio-controls-container"></div>
              <label for="preset-select" class="sr-only">Namuna matnni tanlang</label>
              <select id="preset-select" class="select-control" aria-label="Namuna matn (Alt+P)">
                <option value="">${STRINGS.uz.presetDefault}</option>
                ${PRESETS.map((p) => `<option value="${p.id}">${p.title}</option>`).join("")}
              </select>
            </div>
            <div class="toolbar-tools" role="group" aria-label="Tools / Vositalar">
                <button
                  id="quiz-toggle-btn"
                  class="toggle-button quiz-toggle-btn"
                  type="button"
                  tabindex="-1"
                  aria-label="${STRINGS.uz.quizBtnAria}"
                >
                  ${STRINGS.uz.quizBtn}
                </button>
                <button
                  id="tour-toggle-btn"
                  class="toggle-button tour-toggle-btn"
                  type="button"
                  tabindex="-1"
                  aria-label="${STRINGS.uz.tourBtnAria}"
                >
                  ${STRINGS.uz.tourBtn}
                </button>
                <button
                  id="proctor-key-btn"
                  class="toggle-button proctor-key-btn"
                  type="button"
                  tabindex="-1"
                  aria-label="${STRINGS.uz.proctorBtnAria}"
                >
                  ${STRINGS.uz.proctorBtn}
                </button>
                <button
                  id="about-creator-btn"
                  class="toggle-button about-toggle-btn"
                  type="button"
                  tabindex="-1"
                  aria-label="${STRINGS.uz.aboutCreatorAria}"
                >
                  ${STRINGS.uz.aboutCreatorBtn}
                </button>
            </div>
          </div>
        </header>


        <main class="workspace-grid" role="main">
          <section class="panel" aria-labelledby="input-heading">
            <div class="panel-header">
              <h2 id="input-heading" class="panel-title">${STRINGS.uz.inputHeading}</h2>
              <span id="char-counter" class="char-counter" aria-live="off">0 ta belgi</span>
            </div>
            <textarea
              id="latin-input"
              class="text-editor"
              placeholder="${STRINGS.uz.placeholder}"
              aria-label="${STRINGS.uz.inputAria}"
              spellcheck="false"
            ></textarea>
          </section>

          <section class="panel" aria-labelledby="output-heading">
            <div class="panel-header">
              <h2 id="output-heading" class="panel-title">${STRINGS.uz.outputHeading}</h2>
              <div id="export-controls-container" class="panel-actions"></div>
            </div>
            <div id="tactile-print-meta" class="tactile-print-meta" aria-hidden="true"></div>
            <div id="tactile-preview-toolbar" class="tactile-preview-toolbar">
              <span id="tactile-cells-badge" class="tactile-cells-badge">0 ta katakcha</span>
              <span id="tactile-preview-mode-hint" class="tactile-preview-mode-hint">${STRINGS.uz.tactilePreviewHint}</span>
            </div>
            <div
              id="braille-output"
              class="tactile-grid"
              data-empty-hint="\u2801\u2807\u280A\u280B  Chapdagi maydonga matn yozing yoki namunani tanlang \xB7 Type Uzbek Latin text or pick a sample"
              role="region"
              aria-label="${STRINGS.uz.outputAria}"
              tabindex="0"
            ></div>
          </section>
        </main>

        <footer class="app-footer">
          <span>AlifBraille \xB7 Tashkent, Uzbekistan \xB7 Elshod Kenjayev</span>
          <a href="https://github.com/Elshod09K/alifbraille" target="_blank" rel="noopener">GitHub (MIT)</a>
          <a href="./pitch/">Pitch</a>
        </footer>

        <div id="a11y-live-status" role="status" aria-live="polite" aria-atomic="true" class="sr-only"></div>

        <!-- Accessible Dialog: About Student Creator, Pilot Plan, & Swell Hardware Bridge -->
        <dialog id="about-creator-modal" class="impact-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="modal-dialog-content">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <h2 id="modal-title" class="modal-title">\u{1F468}\u200D\u{1F393} About the Student Creator</h2>
                <span class="modal-badge">SXSW EDU Student Impact Challenge</span>
              </div>
              <button id="modal-close-btn" class="modal-close-btn" type="button" aria-label="Close dialog (Esc)">\u2715</button>
            </div>

            <div class="modal-body">
              <!-- Scannable summary of verifiable project metrics -->
              <div class="creator-kpi-summary" role="region" aria-label="AlifBraille project summary">
                <div class="creator-kpi-item">
                  <span class="kpi-num">~4 ms</span>
                  <span class="kpi-label">To convert 500 characters</span>
                </div>
                <div class="creator-kpi-item">
                  <span class="kpi-num">393</span>
                  <span class="kpi-label">Automated tests passing</span>
                </div>
                <div class="creator-kpi-item">
                  <span class="kpi-num">2.5 mm</span>
                  <span class="kpi-label">Marburg tactile dot pitch</span>
                </div>
                <div class="creator-kpi-item">
                  <span class="kpi-num">100%</span>
                  <span class="kpi-label">Offline, in the browser</span>
                </div>
                <div class="creator-kpi-item" id="kpi-fluency-item">
                  <span class="kpi-num">$0</span>
                  <span class="kpi-label">Cost to schools (MIT license)</span>
                </div>
              </div>

              <!-- Tab Navigation -->
              <div class="creator-tabs-nav" role="tablist" aria-label="Creator impact sections">
                <button
                  id="creator-tab-pitch"
                  class="creator-tab-btn active"
                  type="button"
                  role="tab"
                  aria-selected="true"
                  aria-controls="creator-panel-pitch"
                >
                  \u{1F3AF} Problem & Pitch
                </button>
                <button
                  id="creator-tab-fieldnotes"
                  class="creator-tab-btn"
                  type="button"
                  role="tab"
                  aria-selected="false"
                  aria-controls="creator-panel-fieldnotes"
                >
                  \u{1F3EB} School Pilot Plan
                </button>
                <button
                  id="creator-tab-hardware"
                  class="creator-tab-btn"
                  type="button"
                  role="tab"
                  aria-selected="false"
                  aria-controls="creator-panel-hardware"
                >
                  \u2699\uFE0F Swell-Paper Workflow
                </button>
                <button
                  id="creator-tab-roadmap"
                  class="creator-tab-btn"
                  type="button"
                  role="tab"
                  aria-selected="false"
                  aria-controls="creator-panel-roadmap"
                >
                  \u{1F5FA}\uFE0F Roadmap
                </button>
              </div>

              <!-- PANEL 1: Problem & Pitch -->
              <div id="creator-panel-pitch" class="creator-tab-panel active" role="tabpanel" aria-labelledby="creator-tab-pitch">
                <section class="modal-section">
                  <h3 class="section-title">1. Solo High School Creator</h3>
                  <p>
                    I am <strong>Elshod Kenjayev</strong>, a Grade 11 student at the Presidential School in <strong>Tashkent, Uzbekistan</strong>
                    (GitHub: <a href="https://github.com/Elshod09K" target="_blank" rel="noopener">@Elshod09K</a>).
                    I designed and built AlifBraille on my own.
                  </p>
                  <p>
                    Uzbekistan moved its schools, textbooks and state university entrance exams to the Uzbek Latin alphabet.
                    Blind and low-vision students were left behind by that switch: most tactile books in specialized school libraries were
                    produced in Cyrillic Braille, existing converters don't support Uzbek Latin rules, and many teachers are sighted and
                    can't check a Braille worksheet by touch. AlifBraille lets any teacher produce and verify calibrated Braille materials in seconds, for free.
                  </p>

                  <!-- 60-Second Pitch Opener -->
                  <div class="pitch-script-card">
                    <div class="pitch-script-header">
                      <strong>\u{1F3A4} 60-Second Pitch Opener:</strong>
                      <span class="pitch-timer-badge">~60 SECONDS</span>
                    </div>
                    <p class="pitch-script-text">
                      "I'm Elshod, a high school student from Tashkent, Uzbekistan.
                      My country switched its schools and its university entrance exams from Cyrillic to the Latin alphabet. For me, that meant new textbooks.
                      For blind students, it meant their Braille books, mostly Cyrillic, no longer matched the exam they have to pass.
                      The software that could fix this doesn't know Uzbek Latin: it reads the apostrophe in O\u2018 and G\u2018 as punctuation and splits sh and ch into the wrong cells. One wrong cell changes a word, and on an exam, a word changes the answer.
                      And many of their teachers can't read Braille, so they can't check a sheet before handing it out.
                      So I built AlifBraille: a free, open-source tool that turns Uzbek Latin into correct, print-ready Braille in milliseconds, and reads it aloud cell by cell so any teacher can verify it."
                    </p>
                  </div>
                </section>
              </div>

              <!-- PANEL 2: School Pilot Plan -->
              <div id="creator-panel-fieldnotes" class="creator-tab-panel" role="tabpanel" aria-labelledby="creator-tab-fieldnotes" hidden>
                <section class="modal-section">
                  <h3 class="section-title">2. School Pilot Plan: What We Will Test and Measure</h3>
                  <p>
                    The tool works today. The next step is putting it in front of the people it is for: I am reaching out to specialized schools for visually impaired students in Tashkent to run a first classroom pilot.
                  </p>
                  <div class="case-notes-container">
                    <div class="case-note-card">
                      <div class="case-note-header">
                        <strong>Measure 1: Teacher Preparation Time</strong>
                        <span class="case-note-tag">Before vs. after</span>
                      </div>
                      <p>
                        Time how long it takes a teacher to prepare a one-page Braille quiz the usual way, then with AlifBraille (convert, check by audio, print).
                      </p>
                    </div>
                    <div class="case-note-card">
                      <div class="case-note-header">
                        <strong>Measure 2: Tactile Legibility on Swell Paper</strong>
                        <span class="case-note-tag">Student feedback</span>
                      </div>
                      <p>
                        Confirm with blind readers that Marburg Medium spacing (2.5mm dot pitch, 0.75mm dot radius, 10.0mm line pitch) reads cleanly on the school's swell paper, including Uzbek units such as <em>sh</em> (\u2831), <em>ch</em> (\u281F), <em>o\u2018</em> and <em>g\u2018</em>.
                      </p>
                    </div>
                    <div class="case-note-card">
                      <div class="case-note-header">
                        <strong>Measure 3: Can Sighted Teachers Verify It?</strong>
                        <span class="case-note-tag">Errors caught</span>
                      </div>
                      <p>
                        Count the transcription errors that sighted teachers catch with synchronized audio playback and cell highlighting, without reading Braille by touch.
                      </p>
                    </div>
                    <div class="case-note-card">
                      <div class="case-note-header">
                        <strong>Measure 4: Student Reading Accuracy and Speed</strong>
                        <span class="case-note-tag">Exam practice</span>
                      </div>
                      <p>
                        Track students' reading accuracy and speed on Latin Braille state-exam practice sheets over the pilot, using the built-in 10-question exam template and proctor answer key.
                      </p>
                    </div>
                  </div>

                  <!-- Goal statement -->
                  <div class="student-quote-card" style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 6px; margin: 18px 0;">
                    <div style="font-weight: 700; color: #059669; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
                      \u{1F3AF} The goal of the pilot
                    </div>
                    <blockquote style="margin: 0; font-style: italic; font-size: 0.95rem; line-height: 1.5; color: var(--color-text-primary);">
                      Every blind student in Uzbekistan practices for the national exam in the same alphabet the exam is written in.
                    </blockquote>
                  </div>

                  <!-- Illustration: reading a swell sheet -->
                  <div class="physical-photo-showcase">
                    <div class="showcase-header">
                      <strong>Illustration 1: Reading an AlifBraille Swell Sheet</strong>
                      <span class="photo-badge">Diagram</span>
                    </div>
                    <div class="showcase-body">
                      <svg class="photo-render-svg" viewBox="0 0 680 185" xmlns="http://www.w3.org/2000/svg" aria-label="Illustration of a fingertip reading raised Uzbek Latin Braille on an A4 swell sheet">
                        <defs>
                          <linearGradient id="photoSheetBg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#ffffff"/>
                            <stop offset="100%" stop-color="#f8fafc"/>
                          </linearGradient>
                          <radialGradient id="dotRelief" cx="35%" cy="35%" r="65%">
                            <stop offset="0%" stop-color="#475569"/>
                            <stop offset="70%" stop-color="#0f172a"/>
                            <stop offset="100%" stop-color="#000000"/>
                          </radialGradient>
                          <filter id="dotShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="1" dy="2" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.55"/>
                          </filter>
                        </defs>
                        <rect x="15" y="15" width="650" height="155" rx="8" fill="url(#photoSheetBg)" stroke="#cbd5e1" stroke-width="2"/>
                        <line x1="30" y1="36" x2="650" y2="36" stroke="#e2e8f0" stroke-width="1.5"/>
                        <text x="35" y="30" fill="#64748b" font-size="11" font-weight="bold">ALIFBRAILLE A4 SWELL SHEET</text>
                        <rect x="525" y="22" width="120" height="10" fill="#0f172a" rx="2"/>
                        <text x="532" y="30" fill="#f8fafc" font-size="8" font-weight="bold">50mm CALIBRATION RULER</text>
                        <g transform="translate(45, 52)" filter="url(#dotShadow)">
                          <circle cx="10" cy="12" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="10" cy="24" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="10" cy="36" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="20" cy="36" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="36" cy="12" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="46" cy="24" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="36" cy="36" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="46" cy="36" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="62" cy="12" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="62" cy="24" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="88" cy="12" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="98" cy="24" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="114" cy="12" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="114" cy="36" r="4.5" fill="url(#dotRelief)"/>
                        </g>
                        <g transform="translate(195, 42)">
                          <path d="M 40 95 C 60 65, 75 38, 85 26 C 92 16, 105 16, 108 26 C 110 33, 95 62, 85 90 Z" fill="#e0a97a" stroke="#b47746" stroke-width="2"/>
                          <ellipse cx="98" cy="22" rx="10" ry="14" fill="#e8b88d" stroke="#b47746" stroke-width="1.5" transform="rotate(-15 98 22)"/>
                          <circle cx="95" cy="20" r="15" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="3,3" opacity="0.8"/>
                          <circle cx="95" cy="20" r="21" fill="none" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6"/>
                        </g>
                        <text x="325" y="75" fill="#0f172a" font-size="13" font-weight="bold">Index Fingertip Reading (Tactile Tracking)</text>
                        <text x="325" y="96" fill="#475569" font-size="11">Standard 2.5mm Marburg dot pitch enables clean single-finger touch decoding.</text>
                        <text x="325" y="116" fill="#059669" font-size="11" font-weight="bold">To be validated with blind readers in the school pilot</text>
                        <text x="325" y="136" fill="#6b7280" font-size="10">Teachers check every cell by audio before printing</text>
                      </svg>
                      <p class="photo-caption">
                        <strong>Illustration:</strong> a sighted teacher prints an audio-verified Latin Braille quiz on swell paper; the student reads the raised dots by fingertip.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <!-- PANEL 3: Swell Hardware Workflow & Post-Heating Inspection -->
              <div id="creator-panel-hardware" class="creator-tab-panel" role="tabpanel" aria-labelledby="creator-tab-hardware" hidden>
                <section class="modal-section">
                  <h3 class="section-title">3. Digital-to-Physical Swell-Paper Hardware Workflow</h3>
                  <p>
                    Tactile literacy requires physical touch. AlifBraille connects browser software directly to thermal swell-paper hardware:
                  </p>
                  <div class="workflow-steps">
                    <div class="step-card">
                      <span class="step-num">Step 1</span>
                      <strong>Latin Input</strong>
                      <p>Deterministic transliteration of modified letters (o\u2018, g\u2018), digraphs (sh, ch), & numerals</p>
                    </div>
                    <div class="step-arrow">\u2192</div>
                    <div class="step-card">
                      <span class="step-num">Step 2</span>
                      <strong>Marburg Vector SVG</strong>
                      <p>Calibrated 2.5mm dot pitch + 50mm ruler + tactile metadata (\u283C\u2801)</p>
                    </div>
                    <div class="step-arrow">\u2192</div>
                    <div class="step-card">
                      <span class="step-num">Step 3</span>
                      <strong>Monochrome Print</strong>
                      <p>Standard printer deposits pure black carbon ink (#000000) on swell paper</p>
                    </div>
                    <div class="step-arrow">\u2192</div>
                    <div class="step-card">
                      <span class="step-num">Step 4</span>
                      <strong>Infrared Fuser (PIAF)</strong>
                      <p>Carbon ink absorbs heat; microcapsules expand to ~0.5mm physical relief</p>
                    </div>
                    <div class="step-arrow">\u2192</div>
                    <div class="step-card">
                      <span class="step-num">Step 5</span>
                      <strong>Student Touch</strong>
                      <p>Blind student reads raised Braille dots by fingertip in real time</p>
                    </div>
                  </div>

                  <!-- High-Resolution Physical Photography Showcase: Post-Heating Swell Sheet -->
                  <div class="physical-photo-showcase">
                    <div class="showcase-header">
                      <strong>Illustration 2: Swell Sheet After Heating</strong>
                      <span class="photo-badge">Diagram</span>
                    </div>
                    <div class="showcase-body">
                      <svg class="photo-render-svg" viewBox="0 0 680 185" xmlns="http://www.w3.org/2000/svg" aria-label="Illustration of a microcapsule swell sheet post-heating with intact 50mm calibration notch and raised 2.5mm Braille dots">
                        <defs>
                          <linearGradient id="macroSwellBg" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stop-color="#fffdf5"/>
                            <stop offset="100%" stop-color="#fef9c3"/>
                          </linearGradient>
                        </defs>
                        <rect x="15" y="15" width="650" height="155" rx="8" fill="url(#macroSwellBg)" stroke="#f59e0b" stroke-width="2"/>
                        <g transform="translate(45, 30)">
                          <circle cx="28" cy="28" r="14" fill="#111827" stroke="#000000" stroke-width="2"/>
                          <ellipse cx="23" cy="22" rx="4" ry="2.5" fill="#9ca3af" opacity="0.7"/>
                          <text x="52" y="32" fill="#1f2937" font-size="12" font-weight="bold">Dot 1 (Raised ~0.5mm)</text>

                          <circle cx="28" cy="72" r="14" fill="#111827" stroke="#000000" stroke-width="2"/>
                          <ellipse cx="23" cy="66" rx="4" ry="2.5" fill="#9ca3af" opacity="0.7"/>
                          <text x="52" y="76" fill="#1f2937" font-size="12" font-weight="bold">Dot 2 (Raised ~0.5mm)</text>
                        </g>
                        <g transform="translate(255, 35)">
                          <rect x="0" y="0" width="205" height="24" fill="#0f172a" rx="3"/>
                          <line x1="10" y1="12" x2="195" y2="12" stroke="#fbbf24" stroke-width="2"/>
                          <line x1="10" y1="6" x2="10" y2="18" stroke="#fbbf24" stroke-width="2"/>
                          <line x1="102" y1="8" x2="102" y2="16" stroke="#fbbf24" stroke-width="1.5"/>
                          <line x1="195" y1="6" x2="195" y2="18" stroke="#fbbf24" stroke-width="2"/>
                          <text x="45" y="38" fill="#78350f" font-size="11" font-weight="bold">50.0mm EXACT 1:1 CALIBRATION</text>
                          <text x="5" y="58" fill="#92400e" font-size="10">Check against a desk ruler: catches fit-to-page shrinkage</text>
                          <text x="5" y="74" fill="#92400e" font-size="10">Universal 2.5mm dot pitch maintained across thermal pass</text>
                        </g>
                        <g transform="translate(480, 32)">
                          <rect x="0" y="0" width="165" height="75" rx="6" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>
                          <text x="14" y="24" fill="#f87171" font-size="11" font-weight="bold">PIAF Thermal Fuser</text>
                          <text x="14" y="42" fill="#e2e8f0" font-size="10">Infrared heat pass</text>
                          <text x="14" y="60" fill="#34d399" font-size="10" font-weight="bold">\u2713 Microcapsules Expanded</text>
                        </g>
                      </svg>
                      <p class="photo-caption">
                        <strong>Illustration:</strong> black ink absorbs the heat and the microcapsules underneath swell into raised dots. If the printed 50mm ruler still measures 50mm, the sheet is at true 1:1 scale.
                      </p>
                    </div>
                  </div>

                  <div class="diagram-wrap">
                    <div class="diagram-caption"><strong>Physical Swell-Paper Microcapsule Expansion Cross-Section:</strong></div>
                    <svg class="swell-diagram-svg" viewBox="0 0 600 130" xmlns="http://www.w3.org/2000/svg" aria-label="Cross-section diagram showing microcapsule paper expanding under infrared heat under black ink dots">
                      <rect x="20" y="70" width="560" height="45" fill="#f3f4f6" stroke="#9ca3af" stroke-width="2" rx="4"/>
                      <text x="30" y="98" font-size="12" fill="#4b5563" font-weight="bold">Standard Microcapsule Swell Paper Base (A4, Zychem/PIAF)</text>
                      <rect x="60" y="62" width="110" height="8" fill="#e5e7eb" stroke="#d1d5db"/>
                      <text x="65" y="55" font-size="10" fill="#6b7280">Unheated: flat surface</text>
                      <path d="M 230 70 Q 255 18 280 70 Z" fill="#111827" stroke="#000000" stroke-width="2"/>
                      <circle cx="255" cy="42" r="14" fill="#000000"/>
                      <text x="215" y="14" font-size="11" fill="#dc2626" font-weight="bold">Raised Braille Dot (~0.5mm)</text>
                      <path d="M 330 70 Q 355 18 380 70 Z" fill="#111827" stroke="#000000" stroke-width="2"/>
                      <circle cx="355" cy="42" r="14" fill="#000000"/>
                      <text x="315" y="14" font-size="11" fill="#dc2626" font-weight="bold">Raised Braille Dot (~0.5mm)</text>
                      <text x="430" y="50" font-size="11" fill="#1f2937"><strong>IR Heat Absorption:</strong> Carbon swells capsules</text>
                    </svg>
                  </div>

                  <div class="validation-grid">
                    <div class="val-card">
                      <h4>\u{1F4D0} Marburg Tactile Standard</h4>
                      <p>Geometry follows the Marburg Medium specification (covered by automated tests): <strong>2.5 mm dot pitch</strong>, <strong>0.75 mm dot radius</strong>, <strong>10.0 mm line pitch</strong>. Zero container border bleed ensures infrared fusers (PIAF / Zychem) swell only Braille dots.</p>
                    </div>
                    <div class="val-card">
                      <h4>\u{1F4CF} 50mm Calibration Ruler</h4>
                      <p>Physical calibration notch on printable SVGs ensures educators catch printer driver auto-scaling (e.g. 94% fit-to-page) before thermal heating.</p>
                    </div>
                    <div class="val-card">
                      <h4>\u{1F393} Reverse Quiz & Learning Lab</h4>
                      <p>Two-way verification flashcard mode enables sighted teachers to learn 6-dot Braille reading alongside their students.</p>
                    </div>
                    <div class="val-card">
                      <h4>\u26A1 Sub-5ms Transliteration</h4>
                      <p>Transliteration and DOM updates execute in <strong>&lt; 5 ms</strong> (benchmark: 4.10 ms for 500 characters), enabling fluent sighted-teacher typing without latency.</p>
                    </div>
                  </div>

                  <!-- Resource Efficiency & Environmental Sustainability in Central Asia -->
                  <div class="case-note-card" style="border-left: 4px solid #f59e0b; margin-top: 18px;">
                    <div class="case-note-header">
                      <strong>Resource Efficiency & Sustainability in Central Asia</strong>
                      <span class="case-note-tag">Less Wasted Swell Paper</span>
                    </div>
                    <p>
                      Microcapsule swell paper (Zychem / PIAF) is expensive and has to be imported into Central Asia. When a printer silently applies "Fit to Printable Area" scaling (often around 94%), the dot spacing is wrong and the sheet is wasted once it goes through the heater. AlifBraille\u2019s built-in <strong>50mm calibration ruler check</strong> and interactive <strong>Swell Simulation mode (Alt+V)</strong> serve as vital material-waste reduction mechanisms: teachers verify margins and 1:1 scale before heating, so fewer sheets are wasted and a school's paper budget goes further.
                    </p>
                  </div>

                  <p class="impact-link-p">
                    \u{1F4C4} Full statement, pitch deck & methodology:
                    <a href="./deliverables/student-impact-statement.md" target="_blank" rel="noopener"><strong>deliverables/student-impact-statement.md</strong></a> |
                    <a href="./deliverables/pitch-deck.md" target="_blank" rel="noopener"><strong>deliverables/pitch-deck.md</strong></a>
                  </p>
                </section>
              </div>

              <!-- PANEL 4: Institutional Expansion Roadmap (12 Regions) -->
              <div id="creator-panel-roadmap" class="creator-tab-panel" role="tabpanel" aria-labelledby="creator-tab-roadmap" hidden>
                <section class="modal-section">
                  <h3 class="section-title">4. Roadmap: From a Working Tool to Every Region</h3>
                  <p>
                    AlifBraille is a free static web page, so it can grow from one school to the whole country without new infrastructure. The plan below starts in Tashkent and expands to Uzbekistan's regions and the Republic of Karakalpakstan. Long term, the aim is to work with the Ministry of Preschool and School Education so that accessible materials are part of the normal process.
                  </p>
                  <div class="roadmap-timeline" style="display: flex; flex-direction: column; gap: 14px; margin: 18px 0;">
                    <div class="roadmap-phase-card" style="background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-left: 4px solid #3b82f6; padding: 14px 16px; border-radius: 6px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <strong>Phase 1: Tashkent School Pilot</strong>
                        <span class="case-note-tag" style="background: #2563eb; color: #fff;">Months 1\u20133</span>
                      </div>
                      <p style="margin: 0; font-size: 0.9rem; color: var(--color-text-secondary);">
                        The tool is built and tested. Next: a classroom pilot with a specialized school for visually impaired students in Tashkent, converting state-exam practice sets with teachers and measuring prep time, errors caught and student reading accuracy.
                      </p>
                    </div>
                    <div class="roadmap-phase-card" style="background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 6px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <strong>Phase 2: Teacher Workshops & Open Sheet Library</strong>
                        <span class="case-note-tag" style="background: #059669; color: #fff;">Months 4\u20136</span>
                      </div>
                      <p style="margin: 0; font-size: 0.9rem; color: var(--color-text-secondary);">
                        Hands-on workshops on the full workflow (convert, audio check, swell print, 50mm ruler check) and a free public library of ready-made Latin Braille practice sheets.
                      </p>
                    </div>
                    <div class="roadmap-phase-card" style="background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 6px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <strong>Phase 3: Regional Expansion Across Uzbekistan</strong>
                        <span class="case-note-tag" style="background: #d97706; color: #fff;">Months 7\u20139</span>
                      </div>
                      <p style="margin: 0; font-size: 0.9rem; color: var(--color-text-secondary);">
                        Reach specialized schools in other regions (Samarkand, the Fergana Valley, Bukhara, and on to all regions and Karakalpakstan), adding core subjects: native language, literature, history. Present results to the Ministry of Preschool and School Education.
                      </p>
                    </div>
                    <div class="roadmap-phase-card" style="background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-left: 4px solid #8b5cf6; padding: 14px 16px; border-radius: 6px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <strong>Phase 4: Exam Materials & Related Languages</strong>
                        <span class="case-note-tag" style="background: #7c3aed; color: #fff;">Months 10\u201312</span>
                      </div>
                      <p style="margin: 0; font-size: 0.9rem; color: var(--color-text-secondary);">
                        Offer the State Testing Center (DTM) a free way to produce tactile Latin Braille exam booklets and sighted-proctor answer keys. Add rules for related Latin-script languages (Karakalpak, Kazakh Latin).
                      </p>
                    </div>
                  </div>

                  <p class="impact-link-p">
                    \u{1F4C4} Full statement, pitch deck & methodology:
                    <a href="./deliverables/student-impact-statement.md" target="_blank" rel="noopener"><strong>deliverables/student-impact-statement.md</strong></a> |
                    <a href="./deliverables/pitch-deck.md" target="_blank" rel="noopener"><strong>deliverables/pitch-deck.md</strong></a>
                  </p>
                </section>
              </div>
                </section>
              </div>
            </div>

            <div class="modal-footer">
              <button id="modal-footer-close-btn" class="toggle-button" type="button">Yopish / Close</button>
            </div>
          </div>
        </dialog>
      </div>
    `;
  }
  const inputEl = root.querySelector("#latin-input");
  const outputEl = root.querySelector("#braille-output");
  const presetSelect = root.querySelector("#preset-select");
  const liveStatus = root.querySelector("#a11y-live-status");
  const contrastToggle = root.querySelector("#high-contrast-toggle");
  const langToggleBtn = root.querySelector("#lang-toggle-btn");
  const aboutCreatorBtn = root.querySelector("#about-creator-btn");
  const charCounter = root.querySelector("#char-counter");
  const skipLink = root.querySelector(".skip-link");
  const aboutModal = root.querySelector("#about-creator-modal");
  const modalCloseBtn = root.querySelector("#modal-close-btn");
  const modalFooterCloseBtn = root.querySelector("#modal-footer-close-btn");
  const tactileMetaEl = root.querySelector("#tactile-print-meta");
  let isSwellSimulationActive = false;
  function toggleSwellSimulation(forceState) {
    isSwellSimulationActive = typeof forceState === "boolean" ? forceState : !isSwellSimulationActive;
    outputEl.classList.toggle("swell-simulation-active", isSwellSimulationActive);
    const previewBtn = root.querySelector("#swell-preview-btn");
    if (previewBtn) {
      previewBtn.setAttribute("aria-pressed", isSwellSimulationActive ? "true" : "false");
      previewBtn.classList.toggle("active", isSwellSimulationActive);
    }
    let banner = root.querySelector("#swell-simulation-banner");
    let ruler = root.querySelector("#swell-simulation-ruler");
    if (isSwellSimulationActive) {
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "swell-simulation-banner";
        banner.className = "swell-simulation-banner";
        banner.setAttribute("role", "status");
        banner.innerHTML = `
          <div class="sim-banner-left">
            <span class="sim-pill">\u{1F441}\uFE0F Swell Simulation</span>
            <span class="sim-meta">${currentLang === "en" ? "A4 Sheet \u2022 15mm Margins \u2022 2.5mm Marburg Dot Pitch \u2022 ~0.5mm 3D Relief" : "A4 Sahifa \u2022 15mm Hoshiya \u2022 2.5mm Nuqta Masofasi \u2022 ~0.5mm 3D Qavariqlik"}</span>
          </div>
          <div class="sim-banner-right">
            <span class="sim-ruler-notch">\u{1F4CF} 50mm Calibration Notch Active</span>
          </div>
        `;
        outputEl.parentNode?.insertBefore(banner, outputEl);
      }
      if (!ruler) {
        ruler = document.createElement("div");
        ruler.id = "swell-simulation-ruler";
        ruler.className = "simulation-calibration-ruler";
        ruler.innerHTML = `
          <div class="sim-ruler-ticks"></div>
          <span class="sim-ruler-legend">${currentLang === "en" ? "50mm Physical Calibration Scale (Verify 1:1 scale before fuser)" : "50mm Fizik Kalibrlash Shkalasi (1:1 masshtabni tekshiring)"}</span>
        `;
        outputEl.appendChild(ruler);
      }
      if (liveStatus) {
        liveStatus.textContent = STRINGS[currentLang].statusSimulationOn;
      }
    } else {
      if (banner) banner.remove();
      if (ruler) ruler.remove();
      if (liveStatus) {
        liveStatus.textContent = STRINGS[currentLang].statusSimulationOff;
      }
    }
  }
  const exportContainer = root.querySelector("#export-controls-container") || root.querySelector(".panel-actions");
  let exportControls = null;
  if (exportContainer && !exportContainer.querySelector(".export-controls")) {
    exportControls = setupExportControls(
      exportContainer,
      () => {
        const items = textToTactileItems(inputEl.value);
        return items.map((item, idx) => ({
          index: idx,
          char: item.char,
          brailleChar: item.braille,
          braille: item.braille,
          dots: decodeBrailleDots(item.braille),
          isSpace: item.char === " " || item.braille === "\u2800"
        }));
      },
      {
        onTogglePreview: (active) => {
          toggleSwellSimulation(active);
        }
      }
    );
    exportControls.downloadBtn.addEventListener("click", () => {
      if (liveStatus) {
        liveStatus.textContent = currentLang === "en" ? "Tactile Braille SVG file downloaded successfully." : "Brayl taktil SVG fayli yuklab olindi.";
      }
    });
    exportControls.printBtn.addEventListener("click", () => {
      if (liveStatus) {
        liveStatus.textContent = currentLang === "en" ? "Browser print dialog opened for swell paper." : "Chop etish dialogi ochildi.";
      }
    });
  }
  class AccessibleSpeechController {
    _state = "idle";
    _activeTimer = null;
    _baseController;
    constructor(baseController2) {
      this._baseController = baseController2;
    }
    async speak(text, onBoundary) {
      this._state = "playing";
      return new Promise((resolve) => {
        let nativeStarted = false;
        if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.getVoices().length > 0) {
          try {
            const synth = window.speechSynthesis;
            synth.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "uz-UZ";
            utterance.rate = 0.95;
            utterance.onboundary = (event) => {
              if (this._state !== "playing") return;
              if (onBoundary) {
                onBoundary({
                  charIndex: event.charIndex,
                  charLength: event.charLength,
                  name: event.name || "word"
                });
              }
            };
            utterance.onend = () => {
              this._state = "idle";
              resolve();
            };
            utterance.onerror = () => {
              this._state = "idle";
              resolve();
            };
            synth.speak(utterance);
            nativeStarted = synth.speaking || synth.pending;
          } catch {
            nativeStarted = false;
          }
        }
        if (!nativeStarted) {
          const wordRegex = /\S+/g;
          const matches = [];
          let m;
          while ((m = wordRegex.exec(text)) !== null) {
            matches.push({ word: m[0], index: m.index });
          }
          if (matches.length === 0) {
            this._state = "idle";
            resolve();
            return;
          }
          let wordIdx = 0;
          this._activeTimer = setInterval(() => {
            if (this._state !== "playing" || wordIdx >= matches.length) {
              clearInterval(this._activeTimer);
              this._activeTimer = null;
              this._state = "idle";
              resolve();
              return;
            }
            if (onBoundary && matches[wordIdx]) {
              onBoundary({
                charIndex: matches[wordIdx].index,
                charLength: matches[wordIdx].word.length,
                name: "word",
                token: matches[wordIdx].word
              });
            }
            wordIdx++;
          }, 300);
        }
      });
    }
    stop() {
      this._state = "idle";
      if (this._activeTimer) {
        clearInterval(this._activeTimer);
        this._activeTimer = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
        }
      }
      this._baseController.stop();
    }
    pause() {
      this._state = "paused";
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.pause();
        } catch {
        }
      }
    }
    resume() {
      this._state = "playing";
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.resume();
        } catch {
        }
      }
    }
    getState() {
      return this._state;
    }
    getVoice() {
      return this._baseController.getVoice();
    }
    getPhoneticFallbackText(text) {
      return this._baseController.getPhoneticFallbackText(text);
    }
  }
  const baseController = typeof window !== "undefined" && window.__speechController || new SpeechController();
  const speechController = new AccessibleSpeechController(baseController);
  const audioContainer = root.querySelector("#audio-controls-container") || document.getElementById("audio-controls-container");
  let audioHandle = null;
  if (audioContainer && !audioContainer.querySelector("#audio-play-btn")) {
    audioHandle = initAudioControls(audioContainer, speechController, () => inputEl.value) || null;
  }
  const quizModal = initBrailleQuizModal({
    root,
    getSpeechController: () => speechController,
    getLang: () => currentLang
  });
  const quizToggleBtn = root.querySelector("#quiz-toggle-btn");
  quizToggleBtn?.addEventListener("click", () => {
    quizModal.open();
  });
  const tourModal = initSwellTourModal(root);
  const tourToggleBtn = root.querySelector("#tour-toggle-btn");
  tourToggleBtn?.addEventListener("click", () => {
    tourModal.open();
  });
  const proctorModal = initProctorKeyModal(root);
  const proctorToggleBtn = root.querySelector("#proctor-key-btn");
  proctorToggleBtn?.addEventListener("click", () => {
    proctorModal.open();
  });
  const creatorTabs = aboutModal?.querySelectorAll(".creator-tab-btn") || [];
  const creatorPanels = aboutModal?.querySelectorAll(".creator-tab-panel") || [];
  function switchCreatorTab(tabId) {
    creatorTabs.forEach((tab) => {
      const isTarget = tab.id === tabId;
      tab.classList.toggle("active", isTarget);
      tab.setAttribute("aria-selected", isTarget ? "true" : "false");
    });
    creatorPanels.forEach((panel) => {
      const isTarget = panel.getAttribute("aria-labelledby") === tabId;
      panel.classList.toggle("active", isTarget);
      if (isTarget) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "true");
      }
    });
  }
  creatorTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchCreatorTab(tab.id));
    tab.addEventListener("keydown", (e) => {
      const tabsArr = Array.from(creatorTabs);
      const idx = tabsArr.indexOf(tab);
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const next = tabsArr[(idx + 1) % tabsArr.length];
        next.focus();
        next.click();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = tabsArr[(idx - 1 + tabsArr.length) % tabsArr.length];
        prev.focus();
        prev.click();
      }
    });
  });
  let highlightedCellIndex = -1;
  function renderTactileHeader() {
    if (!tactileMetaEl) return;
    const headingItems = textToTactileItems("alif");
    const pageItems = textToTactileItems("1");
    tactileMetaEl.innerHTML = `
      <div class="tactile-meta-group tactile-meta-title" title="AlifBraille Marburg Sheet Header">
        <span class="tactile-meta-badge">Marburg Print Header</span>
        <span class="tactile-meta-label">${STRINGS[currentLang].metaDoc}</span>
        <div class="tactile-meta-cells tactile-meta-heading-cells"></div>
      </div>
      <div class="tactile-meta-group tactile-meta-page" title="Marburg Braille Page 1">
        <span class="tactile-meta-label">${STRINGS[currentLang].metaPage}</span>
        <div class="tactile-meta-cells tactile-meta-page-cells"></div>
      </div>
    `;
    const headingBox = tactileMetaEl.querySelector(".tactile-meta-heading-cells");
    const pageBox = tactileMetaEl.querySelector(".tactile-meta-page-cells");
    if (headingBox) renderBrailleGrid(headingBox, headingItems);
    if (pageBox) renderBrailleGrid(pageBox, pageItems);
  }
  function render(text) {
    const items = textToTactileItems(text);
    renderBrailleGrid(outputEl, items);
    highlightedCellIndex = -1;
    const charCount = text.length;
    const cellCount = items.length;
    if (charCounter) {
      charCounter.textContent = STRINGS[currentLang].charCount(charCount);
    }
    const previewBadge = root.querySelector("#tactile-cells-badge");
    if (previewBadge) {
      previewBadge.textContent = STRINGS[currentLang].tactileCellsBadge(cellCount);
    }
    if (liveStatus) {
      if (charCount === 0) {
        liveStatus.textContent = STRINGS[currentLang].statusEmpty;
      } else {
        liveStatus.textContent = STRINGS[currentLang].statusRendered(charCount, cellCount);
      }
    }
  }
  function handleInput() {
    render(inputEl.value);
  }
  function handlePresetChange() {
    const selectedId = presetSelect.value;
    const preset = PRESETS.find((p) => p.id === selectedId);
    if (preset) {
      inputEl.value = preset.text;
      render(preset.text);
      if (liveStatus) {
        const title = currentLang === "en" && preset.titleEn ? preset.titleEn : preset.title;
        liveStatus.textContent = STRINGS[currentLang].statusPresetLoaded(title, preset.text.length);
      }
    }
    const existingBanner = root.querySelector("#proctor-exam-banner");
    if (selectedId === "state-entrance-exam-10q") {
      if (!existingBanner) {
        const banner = document.createElement("div");
        banner.id = "proctor-exam-banner";
        banner.className = "proctor-exam-banner";
        banner.setAttribute("role", "region");
        banner.setAttribute("aria-label", "Sighted proctor banner");
        banner.innerHTML = `
          <div class="proctor-banner-content" style="display: flex; align-items: center; justify-content: space-between; background: rgba(2, 132, 199, 0.12); border: 1px solid #0284c7; padding: 10px 14px; border-radius: 6px; margin-bottom: 12px; gap: 10px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.25rem;">\u{1F4CB}</span>
              <span style="font-size: 0.9rem; line-height: 1.4;">
                <strong>${currentLang === "en" ? "Sighted Proctor Tool:" : "Ko\u2018zi Ochiq Nazoratchi Vositalari:"}</strong>
                ${currentLang === "en" ? "Administering this 10-Question State Exam? Cross-reference Latin answers with Braille cell numbers." : "10-savolli davlat imtihonini o\u2018tkazayapsizmi? Lotin javoblarini Brayl katakchalari bilan tekshiring."}
              </span>
            </div>
            <button id="open-proctor-banner-btn" class="toggle-button" type="button" style="background: #0284c7; color: #ffffff; border-color: #0284c7; font-weight: bold; padding: 6px 12px; font-size: 0.85rem;">
              ${currentLang === "en" ? "View Proctor Key (Alt+K)" : "Javoblar Kalitini Ochish (Alt+K)"}
            </button>
          </div>
        `;
        const workspaceGrid = root.querySelector(".workspace-grid");
        if (workspaceGrid && workspaceGrid.parentNode) {
          workspaceGrid.parentNode.insertBefore(banner, workspaceGrid);
        }
        banner.querySelector("#open-proctor-banner-btn")?.addEventListener("click", () => {
          proctorModal.open();
        });
      }
    } else {
      existingBanner?.remove();
    }
  }
  function handleContrastToggle() {
    const isHighContrast = root.classList.toggle("alif-high-contrast");
    if (contrastToggle) {
      contrastToggle.setAttribute("aria-pressed", String(isHighContrast));
    }
    if (liveStatus) {
      liveStatus.textContent = isHighContrast ? STRINGS[currentLang].statusHighContrastOn : STRINGS[currentLang].statusHighContrastOff;
    }
  }
  function handleLangToggle() {
    currentLang = currentLang === "uz" ? "en" : "uz";
    const s = STRINGS[currentLang];
    const taglineEl = root.querySelector("#header-tagline");
    if (taglineEl) taglineEl.textContent = s.tagline;
    const heroEyebrowEl = root.querySelector("#hero-eyebrow");
    if (heroEyebrowEl) heroEyebrowEl.textContent = s.heroEyebrow;
    const heroTitleEl = root.querySelector("#hero-title");
    if (heroTitleEl) heroTitleEl.innerHTML = s.heroTitle;
    const heroSubEl = root.querySelector("#hero-sub");
    if (heroSubEl) heroSubEl.textContent = s.heroSub;
    const heroStatsEl = root.querySelector("#hero-stats");
    if (heroStatsEl) heroStatsEl.innerHTML = s.heroStats.map((t) => `<li>${t}</li>`).join("");
    if (skipLink) skipLink.textContent = s.skipLink;
    const curVal = presetSelect.value;
    presetSelect.setAttribute("aria-label", s.presetAria);
    presetSelect.innerHTML = `
      <option value="">${s.presetDefault}</option>
      ${PRESETS.map((p) => {
      const title = currentLang === "en" && p.titleEn ? p.titleEn : p.title;
      return `<option value="${p.id}" ${p.id === curVal ? "selected" : ""}>${title}</option>`;
    }).join("")}
    `;
    if (contrastToggle) {
      contrastToggle.textContent = s.highContrast;
      contrastToggle.setAttribute("aria-label", s.highContrastAria);
    }
    if (langToggleBtn) {
      langToggleBtn.textContent = s.langToggle;
      langToggleBtn.setAttribute("aria-label", s.langToggleAria);
    }
    if (aboutCreatorBtn) {
      aboutCreatorBtn.textContent = s.aboutCreatorBtn;
      aboutCreatorBtn.setAttribute("aria-label", s.aboutCreatorAria);
    }
    if (quizToggleBtn) {
      quizToggleBtn.textContent = s.quizBtn;
      quizToggleBtn.setAttribute("aria-label", s.quizBtnAria);
    }
    const prevBtn = root.querySelector("#swell-preview-btn");
    if (prevBtn) {
      prevBtn.textContent = s.previewBtn;
      prevBtn.setAttribute("aria-label", s.previewBtnAria);
    }
    if (quizModal) {
      quizModal.setLang(currentLang);
    }
    if (isSwellSimulationActive) {
      const banner = root.querySelector("#swell-simulation-banner");
      if (banner) {
        const metaSpan = banner.querySelector(".sim-meta");
        if (metaSpan) {
          metaSpan.textContent = currentLang === "en" ? "A4 Sheet \u2022 15mm Margins \u2022 2.5mm Marburg Dot Pitch \u2022 ~0.5mm 3D Relief" : "A4 Sahifa \u2022 15mm Hoshiya \u2022 2.5mm Nuqta Masofasi \u2022 ~0.5mm 3D Qavariqlik";
        }
      }
      const ruler = root.querySelector("#swell-simulation-ruler");
      if (ruler) {
        const legendSpan = ruler.querySelector(".sim-ruler-legend");
        if (legendSpan) {
          legendSpan.textContent = currentLang === "en" ? "50mm Physical Calibration Scale (Verify 1:1 scale before fuser)" : "50mm Fizik Kalibrlash Shkalasi (1:1 masshtabni tekshiring)";
        }
      }
    }
    const inputHeadingEl = root.querySelector("#input-heading");
    if (inputHeadingEl) inputHeadingEl.textContent = s.inputHeading;
    inputEl.setAttribute("placeholder", s.placeholder);
    inputEl.setAttribute("aria-label", s.inputAria);
    const outputHeadingEl = root.querySelector("#output-heading");
    if (outputHeadingEl) outputHeadingEl.textContent = s.outputHeading;
    outputEl.setAttribute("aria-label", s.outputAria);
    const dlBtn = root.querySelector("#export-svg-btn");
    const prBtn = root.querySelector("#print-sheet-btn");
    if (dlBtn) {
      dlBtn.textContent = s.exportSvg;
      dlBtn.setAttribute("aria-label", s.exportSvgAria);
    }
    if (prBtn) {
      prBtn.textContent = s.print;
      prBtn.setAttribute("aria-label", s.printAria);
    }
    if (audioHandle) {
      audioHandle.setLanguage(currentLang);
    }
    const tourBtnEl = root.querySelector("#tour-toggle-btn");
    if (tourBtnEl) {
      tourBtnEl.textContent = s.tourBtn;
      tourBtnEl.setAttribute("aria-label", s.tourBtnAria);
    }
    const hintEl = root.querySelector("#tactile-preview-mode-hint");
    if (hintEl) {
      hintEl.textContent = s.tactilePreviewHint;
    }
    tourModal.setLang(currentLang);
    const proctorBtnEl = root.querySelector("#proctor-key-btn");
    if (proctorBtnEl) {
      proctorBtnEl.textContent = s.proctorBtn;
      proctorBtnEl.setAttribute("aria-label", s.proctorBtnAria);
    }
    proctorModal.setLang(currentLang);
    renderTactileHeader();
    render(inputEl.value);
    if (liveStatus) {
      liveStatus.textContent = s.statusLangSwitched;
    }
  }
  function openAboutModal() {
    if (!aboutModal) return;
    if (typeof document !== "undefined") {
      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");
    }
    if (typeof aboutModal.showModal === "function") {
      try {
        aboutModal.showModal();
      } catch {
        aboutModal.setAttribute("open", "true");
      }
    } else {
      aboutModal.setAttribute("open", "true");
    }
    aboutModal.classList.add("is-open");
    modalCloseBtn?.focus();
  }
  function closeAboutModal() {
    if (!aboutModal) return;
    if (typeof document !== "undefined") {
      const quizModalEl = root.querySelector("#braille-quiz-modal");
      const isQuizOpen = quizModalEl && (quizModalEl.hasAttribute("open") || quizModalEl.open);
      const tourModalEl = root.querySelector("#swell-tour-modal");
      const isTourOpen = tourModalEl && (tourModalEl.hasAttribute("open") || tourModalEl.open);
      const proctorModalEl = root.querySelector("#proctor-key-modal");
      const isProctorOpen = proctorModalEl && (proctorModalEl.hasAttribute("open") || proctorModalEl.open);
      if (!isQuizOpen && !isTourOpen && !isProctorOpen) {
        document.body.classList.remove("modal-open");
        document.documentElement.classList.remove("modal-open");
      }
    }
    if (typeof aboutModal.close === "function") {
      try {
        aboutModal.close();
      } catch {
        aboutModal.removeAttribute("open");
      }
    } else {
      aboutModal.removeAttribute("open");
    }
    aboutModal.classList.remove("is-open");
    aboutCreatorBtn?.focus();
  }
  function getFocusableControls() {
    const candidates = [
      skipLink,
      presetSelect,
      contrastToggle,
      inputEl,
      outputEl
    ].filter((el) => Boolean(el));
    return candidates.filter((el) => {
      return el.tabIndex >= 0 && !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true";
    });
  }
  function highlightTactileCell(index) {
    const cells = outputEl.querySelectorAll(".tactile-cell");
    if (cells.length === 0) return;
    const targetIndex = Math.max(0, Math.min(index, cells.length - 1));
    highlightedCellIndex = targetIndex;
    cells.forEach((cell, idx) => {
      if (idx === targetIndex) {
        cell.classList.add("tactile-cell--highlighted");
        const char = cell.getAttribute("data-char") || "";
        const braille = cell.getAttribute("data-braille") || "";
        const dots = decodeBrailleDots(braille);
        const activeDots = dots.map((active, i) => active ? i + 1 : null).filter((d) => d !== null);
        const dotsDesc = activeDots.length > 0 ? `${activeDots.join(", ")}-nuqtalar` : "bo\u2018sh katakcha";
        const charDesc = char === " " ? "bo\u2018sh joy" : char === "\n" ? "yangi qator" : char;
        if (liveStatus) {
          liveStatus.textContent = `Katakcha ${targetIndex + 1} / ${cells.length}: "${charDesc}", Brayl ${braille}, ${dotsDesc}.`;
        }
      } else {
        cell.classList.remove("tactile-cell--highlighted");
      }
    });
  }
  function handleKeyDown(event) {
    if (event.altKey && !event.ctrlKey && !event.metaKey) {
      const keyLower = event.key.toLowerCase();
      if (keyLower === "h") {
        event.preventDefault();
        handleContrastToggle();
        return;
      }
      if (keyLower === "e" || keyLower === "m") {
        event.preventDefault();
        handleLangToggle();
        return;
      }
      if (keyLower === "a") {
        event.preventDefault();
        openAboutModal();
        return;
      }
      if (keyLower === "i") {
        event.preventDefault();
        inputEl.focus();
        return;
      }
      if (keyLower === "o" || keyLower === "b") {
        event.preventDefault();
        outputEl.focus();
        return;
      }
      if (keyLower === "p") {
        event.preventDefault();
        presetSelect.focus();
        return;
      }
      if (keyLower === "s" || keyLower === "d") {
        event.preventDefault();
        const exportBtn = root.querySelector("#export-svg-btn");
        if (exportBtn) {
          exportBtn.click();
          if (liveStatus) {
            liveStatus.textContent = currentLang === "en" ? "Tactile Braille SVG file downloaded successfully." : "Brayl taktil SVG fayli yuklab olindi.";
          }
        }
        return;
      }
      if (keyLower === "c") {
        event.preventDefault();
        const printBtn = root.querySelector("#print-sheet-btn");
        if (printBtn) {
          printBtn.click();
          if (liveStatus) {
            liveStatus.textContent = currentLang === "en" ? "Browser print dialog opened for swell paper." : "Chop etish dialogi ochildi.";
          }
        }
        return;
      }
      if (keyLower === "l") {
        event.preventDefault();
        ensureAudioUserGesture();
        const playBtn = document.querySelector("#audio-play-btn");
        if (playBtn) {
          playBtn.click();
        }
        return;
      }
      if (keyLower === "v") {
        event.preventDefault();
        toggleSwellSimulation();
        return;
      }
      if (keyLower === "q") {
        event.preventDefault();
        quizModal.open();
        return;
      }
      if (keyLower === "t") {
        event.preventDefault();
        tourModal.open();
        return;
      }
      if (keyLower === "k") {
        event.preventDefault();
        proctorModal.open();
        return;
      }
    }
    const quizModalEl = root.querySelector("#braille-quiz-modal");
    const isQuizOpen = quizModalEl && (quizModalEl.hasAttribute("open") || quizModalEl.open);
    const isAboutOpen = aboutModal && (aboutModal.hasAttribute("open") || aboutModal.open || aboutModal.classList.contains("is-open"));
    const tourModalEl = root.querySelector("#swell-tour-modal");
    const isTourOpen = tourModalEl && (tourModalEl.hasAttribute("open") || tourModalEl.open || tourModalEl.classList.contains("is-open"));
    const proctorModalEl = root.querySelector("#proctor-key-modal");
    const isProctorOpen = proctorModalEl && (proctorModalEl.hasAttribute("open") || proctorModalEl.open || proctorModalEl.classList.contains("is-open"));
    if (isQuizOpen || isAboutOpen || isTourOpen || isProctorOpen) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (isQuizOpen) quizModal.close();
        else if (isAboutOpen) closeAboutModal();
        else if (isTourOpen) tourModal.close();
        else if (isProctorOpen) proctorModal.close();
        return;
      }
      if (event.key === "Tab") {
        const activeDialog = isQuizOpen ? quizModalEl : isAboutOpen ? aboutModal : isTourOpen ? tourModalEl : proctorModalEl;
        if (activeDialog) {
          const focusables = Array.from(
            activeDialog.querySelectorAll(
              'button:not([disabled]):not([aria-hidden="true"]), select:not([disabled]):not([aria-hidden="true"]), input:not([disabled]):not([aria-hidden="true"]), a[href], [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => {
            const panel = el.closest(".quiz-tab-panel, .creator-tab-panel");
            if (panel && !panel.classList.contains("active")) return false;
            return el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0 || el.tabIndex >= 0;
          });
          if (focusables.length === 0) {
            event.preventDefault();
            return;
          }
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          const active = document.activeElement;
          if (event.shiftKey) {
            if (active === first || !activeDialog.contains(active)) {
              event.preventDefault();
              last.focus();
            }
          } else {
            if (active === last || !activeDialog.contains(active)) {
              event.preventDefault();
              first.focus();
            }
          }
          event.stopPropagation();
        }
      }
      return;
    }
    if (event.key === "Escape") {
      const stopBtn = document.querySelector("#audio-stop-btn");
      if (stopBtn && !stopBtn.disabled) {
        event.preventDefault();
        stopBtn.click();
        return;
      }
    }
    if (event.key === "Tab") {
      const focusables = getFocusableControls();
      if (focusables.length === 0) return;
      const active = document.activeElement;
      const currentIndex = active ? focusables.indexOf(active) : -1;
      let nextIndex;
      if (event.shiftKey) {
        nextIndex = currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1;
      } else {
        nextIndex = currentIndex >= focusables.length - 1 ? 0 : currentIndex + 1;
      }
      event.preventDefault();
      focusables[nextIndex].focus();
      return;
    }
    if (document.activeElement === outputEl) {
      const cells = outputEl.querySelectorAll(".tactile-cell");
      if (cells.length === 0) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        highlightTactileCell(highlightedCellIndex + 1);
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        highlightTactileCell(highlightedCellIndex <= 0 ? 0 : highlightedCellIndex - 1);
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        highlightTactileCell(0);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        highlightTactileCell(cells.length - 1);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        inputEl.focus();
        return;
      }
    }
  }
  inputEl.addEventListener("input", handleInput);
  presetSelect.addEventListener("change", handlePresetChange);
  if (contrastToggle) {
    contrastToggle.addEventListener("click", handleContrastToggle);
  }
  if (langToggleBtn) {
    langToggleBtn.addEventListener("click", handleLangToggle);
  }
  if (aboutCreatorBtn) {
    aboutCreatorBtn.addEventListener("click", openAboutModal);
  }
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeAboutModal);
  }
  if (modalFooterCloseBtn) {
    modalFooterCloseBtn.addEventListener("click", closeAboutModal);
  }
  if (aboutModal) {
    aboutModal.addEventListener("click", (e) => {
      if (e.target === aboutModal) closeAboutModal();
    });
  }
  root.addEventListener("keydown", handleKeyDown);
  renderTactileHeader();
  render(inputEl.value);
  return {
    destroy() {
      inputEl.removeEventListener("input", handleInput);
      presetSelect.removeEventListener("change", handlePresetChange);
      if (contrastToggle) {
        contrastToggle.removeEventListener("click", handleContrastToggle);
      }
      if (langToggleBtn) {
        langToggleBtn.removeEventListener("click", handleLangToggle);
      }
      if (aboutCreatorBtn) {
        aboutCreatorBtn.removeEventListener("click", openAboutModal);
      }
      if (modalCloseBtn) {
        modalCloseBtn.removeEventListener("click", closeAboutModal);
      }
      if (modalFooterCloseBtn) {
        modalFooterCloseBtn.removeEventListener("click", closeAboutModal);
      }
      quizModal?.destroy();
      tourModal?.destroy();
      proctorModal?.destroy();
      root.removeEventListener("keydown", handleKeyDown);
    },
    updateText(text) {
      inputEl.value = text;
      render(text);
    }
  };
}
if (typeof document !== "undefined") {
  const rootApp = document.getElementById("app");
  if (rootApp) {
    initApp(rootApp);
  }
}
if (typeof window !== "undefined") {
  window.highlightBrailleCell = highlightBrailleCell;
  window.clearSpeechHighlights = clearSpeechHighlights;
  window.initAudioControls = initAudioControls;
}
export {
  buildCharToCellIndexMap,
  clearSpeechHighlights,
  downloadTactileSvgFile,
  highlightBrailleCell,
  initApp,
  initAudioControls,
  setupExportControls,
  textToTactileItems,
  triggerPrintDialog
};
//# sourceMappingURL=bundle.js.map
