const API_ROOT =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "";
const API_BASE = "https://world.openbeautyfacts.org/cgi/search.pl";
const MAKEUP_API_BASE = "https://makeup-api.herokuapp.com/api/v1/products.json";
const CATEGORY_KEYWORDS = {
  all: [],
  fragrances: ["perfume", "fragrance", "deodorant", "cologne", "eau de", "body mist", "parfum"],
  "lip-care": ["lip", "lipstick", "lip balm", "lip gloss", "lip care", "lipliner", "lipstick"],
  "skin-care": [
    "cream",
    "cleanser",
    "serum",
    "moisturizer",
    "lotion",
    "body wash",
    "face wash",
    "mask",
    "toner",
    "sunscreen",
    "sun screen",
    "sunblock",
    "spf"
  ],
  "eye-makeup": ["eyeliner", "mascara", "eyeshadow", "eye shadow", "brow", "kajal", "eye pencil"]
};

const CATEGORY_TAG_HINTS = {
  fragrances: ["perfume", "fragrance", "deodorant", "cologne", "parfum"],
  "lip-care": ["lip", "lipstick", "lip-balm", "lip-gloss", "lip-care"],
  "skin-care": [
    "skin-care",
    "body-wash",
    "cleanser",
    "moisturizer",
    "serum",
    "lotion",
    "face-wash",
    "cream",
    "sunscreen",
    "sun-protection",
    "spf"
  ],
  "eye-makeup": ["eye-makeup", "eyeliner", "mascara", "eyeshadow", "kajal", "brow"]
};

const ALT_SEARCH_TERMS = {
  all: "beauty makeup lipstick skincare fragrance clean",
  fragrances: "perfume fragrance eau de parfum body mist deodorant",
  "lip-care": "lip balm lipstick lip gloss lip tint",
  "skin-care": "skin care cleanser moisturizer serum body wash sunscreen spf",
  "eye-makeup": "eyeliner mascara kajal eyeshadow brow pencil"
};

const MAKEUP_TYPE_BY_CATEGORY = {
  all: [],
  fragrances: [],
  "lip-care": ["lipstick", "lip_liner"],
  "skin-care": ["foundation", "bb_cc", "concealer", "powder"],
  "eye-makeup": ["eyeliner", "eyeshadow", "mascara", "eyebrow", "pencil"]
};

const CLEAN_TAG_HINTS = [
  "natural",
  "organic",
  "vegan",
  "cruelty free",
  "ecocert",
  "certclean",
  "chemical free",
  "silicone free",
  "oil free",
  "ewg verified"
];

const RISK_INGREDIENTS = [
  { key: "paraben", penalty: 13, note: "Parabens can act as endocrine disruptor candidates." },
  { key: "phthalate", penalty: 15, note: "Phthalates are often flagged for hormone-disruption concerns." },
  { key: "triclosan", penalty: 16, note: "Triclosan may impact hormones and aquatic systems." },
  { key: "oxybenzone", penalty: 17, note: "Oxybenzone is linked to coral and hormone concerns." },
  { key: "octinoxate", penalty: 15, note: "Octinoxate may harm reefs and show hormonal activity." },
  { key: "formaldehyde", penalty: 18, note: "Formaldehyde and releasers are higher-risk irritants." },
  { key: "dmdm hydantoin", penalty: 16, note: "DMDM hydantoin is a formaldehyde-releasing preservative." },
  { key: "quaternium-15", penalty: 16, note: "Quaternium-15 is a formaldehyde-releasing preservative." },
  { key: "imidazolidinyl urea", penalty: 14, note: "Imidazolidinyl urea can release formaldehyde." },
  { key: "diazolidinyl urea", penalty: 14, note: "Diazolidinyl urea can release formaldehyde." },
  { key: "bha", penalty: 10, note: "BHA may be irritating and debated for long-term use." },
  { key: "bht", penalty: 9, note: "BHT has mixed safety signals in long-term exposure studies." },
  { key: "sodium lauryl sulfate", penalty: 8, note: "SLS can be harsh for sensitive skin." },
  { key: "sodium laureth sulfate", penalty: 7, note: "SLES may irritate some skin types." },
  { key: "peg-", penalty: 7, note: "PEG ingredients can raise contamination/process concerns." },
  { key: "fragrance", penalty: 7, note: "Fragrance mixes can hide allergens and sensitizers." },
  { key: "parfum", penalty: 7, note: "Parfum is broad and can include sensitizing compounds." },
  { key: "polyethylene", penalty: 8, note: "Polyethylene can indicate microplastic-linked ingredients." },
  { key: "polypropylene", penalty: 7, note: "Polypropylene contributes to persistence concerns." },
  { key: "nylon-12", penalty: 8, note: "Nylon polymers can increase microplastic footprint." },
  { key: "acrylates copolymer", penalty: 8, note: "Acrylate polymers are tied to environmental persistence." }
];

const ENDOCRINE_RISK_KEYS = [
  "paraben",
  "phthalate",
  "triclosan",
  "oxybenzone",
  "octinoxate",
  "bha",
  "bht"
];

const ENVIRONMENT_RISK_KEYS = [
  "polyethylene",
  "polypropylene",
  "nylon-12",
  "acrylates copolymer",
  "oxybenzone",
  "octinoxate",
  "triclosan"
];

const HIGH_IRRITANT_KEYS = [
  "formaldehyde",
  "dmdm hydantoin",
  "quaternium-15",
  "imidazolidinyl urea",
  "diazolidinyl urea",
  "sodium lauryl sulfate",
  "sodium laureth sulfate"
];

const MODEL_WEIGHTS = {
  bodyPct: 1.35,
  ecoPct: 1.2,
  cleanPct: 1.45,
  hazardPct: -1.6,
  endocrinePct: -1.45,
  ecoRiskPct: -1.2,
  irritantPct: -0.95,
  positivePct: 0.9,
  confidencePct: 0.7
};

const BENEFICIAL_INGREDIENTS = [
  "hyaluronic acid",
  "niacinamide",
  "ceramide",
  "glycerin",
  "squalane",
  "aloe vera",
  "panthenol",
  "vitamin e",
  "green tea",
  "zinc oxide"
];

const ECO_LABEL_SIGNALS = [
  "organic",
  "ecocert",
  "fair trade",
  "cruelty free",
  "vegan",
  "recyclable",
  "fsc"
];

const FUN_FACTS = {
  quick: [
    "Refillable beauty packaging can reduce packaging waste by up to 70% across repeated purchases.",
    "Using one multi-purpose product can reduce both waste and overconsumption.",
    "Picking concentrated formulas often cuts water-heavy packaging and transport weight.",
    "Choosing larger refill packs usually lowers plastic use per milliliter.",
    "Ingredient transparency helps shoppers avoid repeated trial-and-error purchases."
  ],
  eco: [
    "Choosing refill packs and recycled-material bottles lowers lifecycle plastic demand.",
    "Microplastic-linked polymers can persist for years, so polymer-free formulas matter.",
    "Cruelty-free + transparent sourcing labels make eco-comparisons easier.",
    "Recyclable mono-material packaging is easier to process than mixed plastics.",
    "Buying only what you can finish is one of the most sustainable beauty habits."
  ],
  body: [
    "Fragrance-free options can be gentler for reactive or sensitized skin barriers.",
    "Shorter ingredient lists can make sensitivity tracking and patch-testing easier.",
    "Barrier-supporting ingredients like ceramides and glycerin can improve tolerance.",
    "Patch-testing new products can prevent unnecessary irritation and waste.",
    "Lower-irritant formulas can support long-term skin comfort for sensitive users."
  ]
};

const state = {
  activeCategory: "all",
  suggestionItems: [],
  lastAnalyses: [],
  alternativesById: {},
  selectedId: null,
  factType: "quick",
  lastFactText: "",
  alternativeRequestId: 0,
  alternativeCache: {}
};

const refs = {
  input: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  suggestions: document.getElementById("suggestions"),
  statusText: document.getElementById("statusText"),
  categoryRow: document.getElementById("categoryRow"),
  productPanel: document.getElementById("productPanel"),
  scoreGrid: document.getElementById("scoreGrid"),
  matchesGrid: document.getElementById("matchesGrid"),
  riskList: document.getElementById("riskList"),
  goodList: document.getElementById("goodList"),
  alternativesGrid: document.getElementById("alternativesGrid"),
  comparePanel: document.getElementById("comparePanel"),
  lookForTitle: document.getElementById("lookForTitle"),
  lookForList: document.getElementById("lookForList"),
  summaryTitle: document.getElementById("summaryTitle"),
  summaryRows: document.getElementById("summaryRows"),
  funFact: document.getElementById("funFact"),
  factButtons: document.getElementById("factButtons")
};

function debounce(fn, delay = 300) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomItemExcluding(items, previous) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  const filtered = items.filter((item) => item !== previous);
  return filtered.length ? randomItem(filtered) : randomItem(items);
}

function setStatus(text) {
  refs.statusText.textContent = text;
}

function apiUrl(path, params = {}) {
  const base = API_ROOT || "";
  const url = new URL(path, `${base || window.location.origin}`);
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    const asString = String(value).trim();
    if (!asString.length) continue;
    url.searchParams.set(key, asString);
  }
  return base ? url.href : `${url.pathname}${url.search}`;
}

async function apiGet(path, params = {}) {
  const response = await fetch(apiUrl(path, params));
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}

function categoryTerms(category) {
  return [...(CATEGORY_KEYWORDS[category] || []), ...(CATEGORY_TAG_HINTS[category] || [])];
}

function categoryBlob(product) {
  const tags = Array.isArray(product.categoriesTags) ? product.categoriesTags.join(" ") : "";
  return `${product.name} ${product.categories} ${tags}`.toLowerCase();
}

function categoryMatch(product, category) {
  if (category === "all") return true;
  const blob = categoryBlob(product);
  return categoryTerms(category).some((term) => blob.includes(term));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "#";
  } catch (error) {
    return "#";
  }
}

function isLikelyProductImage(url) {
  if (!url || url === "#") return false;
  const lower = url.toLowerCase();
  const blockedHints = ["qr", "barcode", "datamatrix", "code-", "ingredients", "nutrition"];
  return !blockedHints.some((hint) => lower.includes(hint));
}

function pickBestImage(candidates) {
  const safeCandidates = (candidates || [])
    .map((value) => safeUrl(value))
    .filter((value) => value !== "#");

  for (const candidate of safeCandidates) {
    if (isLikelyProductImage(candidate)) return candidate;
  }
  return safeCandidates[0] || "";
}

function toTitleCase(text) {
  return text
    .split(" ")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function categoryLabel(product) {
  if (categoryMatch(product, "fragrances")) return "Fragrances";
  if (categoryMatch(product, "lip-care")) return "Lip Care";
  if (categoryMatch(product, "eye-makeup")) return "Eye Makeup";
  if (categoryMatch(product, "skin-care")) return "Skin Care";
  return "Beauty";
}

function categoryGuidance(categoryKey) {
  const byCategory = {
    fragrances: {
      title: "What to Look for in Cleaner Fragrances",
      lookFor: [
        "Fragrance transparency and fewer undisclosed blends",
        "Phthalate-free formulas and lower allergen load",
        "Refillable bottles or recycled packaging"
      ]
    },
    "lip-care": {
      title: "What to Look for in Cleaner, Healthier Lip Balms",
      lookFor: [
        "Plant-derived waxes and nourishing oils/butters",
        "Lower fragrance load if lips are sensitive",
        "Vegan/refillable/plastic-reduced packaging",
        "Fewer endocrine-risk preservatives and additives"
      ]
    },
    "skin-care": {
      title: "What to Look for in Cleaner Skincare",
      lookFor: [
        "Barrier-supporting ingredients like glycerin and ceramides",
        "Lower irritation risk and fewer harsh surfactants",
        "Fragrance-minimized options for sensitive skin",
        "Refill/recycled packaging with clear labels"
      ]
    },
    "eye-makeup": {
      title: "What to Look for in Cleaner Eye Makeup",
      lookFor: [
        "Lower-irritant formulas for eye-area sensitivity",
        "Fewer synthetic fragrance additives",
        "Avoidance of known endocrine-risk preservatives",
        "More sustainable packaging and clear ingredient disclosure"
      ]
    },
    all: {
      title: "What to Look for in Cleaner Products",
      lookFor: [
        "Lower endocrine-risk and irritation-risk ingredients",
        "Transparent ingredient labels and fewer hidden blends",
        "Refill/recycled packaging and lower plastic footprint",
        "Higher nourishing-ingredient density"
      ]
    }
  };
  return byCategory[categoryKey] || byCategory.all;
}

function primaryCategoryKey(product) {
  const order = ["fragrances", "lip-care", "skin-care", "eye-makeup"];
  for (const key of order) {
    if (categoryMatch(product, key)) return key;
  }
  return "all";
}

function categoryFromText(text) {
  const probe = {
    name: String(text || ""),
    categories: "",
    categoriesTags: []
  };
  const order = ["fragrances", "lip-care", "skin-care", "eye-makeup"];
  for (const key of order) {
    if (categoryMatch(probe, key)) return key;
  }
  return "all";
}

function resolveAlternativeCategory(product) {
  const fromProduct = primaryCategoryKey(product);
  if (fromProduct !== "all") return fromProduct;

  const fromQuery = categoryFromText(refs.input?.value || "");
  if (fromQuery !== "all") return fromQuery;

  if (state.activeCategory !== "all") return state.activeCategory;
  return "all";
}

function matchesActiveCategory(product) {
  return categoryMatch(product, state.activeCategory);
}

function analysisKey(analysis) {
  const fallback = `${analysis.product.name.toLowerCase()}::${analysis.product.brand.toLowerCase()}`;
  return analysis.product.id ? `${analysis.product.id}::${fallback}` : fallback;
}

function uniqueAnalyses(analyses) {
  const unique = [];
  const keySet = new Set();
  for (const analysis of analyses) {
    const key = analysisKey(analysis);
    if (!keySet.has(key)) {
      keySet.add(key);
      unique.push(analysis);
    }
  }
  return unique;
}

function hasCleanTag(tags) {
  const blob = (tags || []).join(" ").toLowerCase();
  return CLEAN_TAG_HINTS.some((hint) => blob.includes(hint));
}

function normalizeOpenBeautyProduct(rawProduct) {
  const name = (rawProduct.product_name || "").trim();
  if (!name) return null;

  const ingredientsText = (
    rawProduct.ingredients_text_en ||
    rawProduct.ingredients_text ||
    ""
  ).trim();

  const ingredientsTagsText = Array.isArray(rawProduct.ingredients_tags)
    ? rawProduct.ingredients_tags.join(" ")
    : "";

  const packaging = Array.isArray(rawProduct.packaging_tags) ? rawProduct.packaging_tags : [];
  const labels = Array.isArray(rawProduct.labels_tags) ? rawProduct.labels_tags : [];
  const categoriesTags = Array.isArray(rawProduct.categories_tags) ? rawProduct.categories_tags : [];

  const imageCandidates = [
    rawProduct.image_front_url,
    rawProduct.image_url,
    rawProduct.image_front_small_url,
    rawProduct.image_small_url
  ];

  return {
    id: rawProduct.code || rawProduct.id || `obf-${name}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    brand: (rawProduct.brands || "Unknown brand").split(",")[0].trim(),
    categories: rawProduct.categories || "",
    categoriesTags,
    ingredientsText,
    searchableIngredients: `${ingredientsText} ${ingredientsTagsText}`.toLowerCase(),
    ecoGrade: (rawProduct.ecoscore_grade || "").toLowerCase(),
    packaging,
    labels,
    imageUrl: pickBestImage(imageCandidates),
    sourceUrl: rawProduct.url || `https://world.openbeautyfacts.org/product/${rawProduct.code || ""}`,
    source: "open_beauty_facts",
    cleanTagBoost: hasCleanTag(labels)
  };
}

function normalizeMakeupApiProduct(rawProduct) {
  const name = (rawProduct.name || "").trim();
  if (!name) return null;

  const tagList = Array.isArray(rawProduct.tag_list) ? rawProduct.tag_list : [];
  const brand = (rawProduct.brand || "Unknown brand").trim();
  const productType = (rawProduct.product_type || "").replace(/_/g, " ");
  const productCategory = (rawProduct.category || "").replace(/_/g, " ");
  const categoriesTags = [productType, productCategory, ...tagList]
    .map((value) => String(value || "").toLowerCase().trim())
    .filter(Boolean);

  const ingredientList = (rawProduct.ingredient_list || "").trim();
  const labels = tagList.map((tag) => `en:${String(tag).toLowerCase()}`);
  const imageCandidates = [rawProduct.api_featured_image, rawProduct.image_link];

  return {
    id: rawProduct.id ? `makeup-${rawProduct.id}` : `makeup-${name}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    brand,
    categories: [productType, productCategory].filter(Boolean).join(", "),
    categoriesTags,
    ingredientsText: ingredientList,
    searchableIngredients: `${ingredientList} ${tagList.join(" ")}`.toLowerCase(),
    ecoGrade: "",
    packaging: [],
    labels,
    imageUrl: pickBestImage(imageCandidates),
    sourceUrl: rawProduct.product_link || rawProduct.website_link || "",
    source: "makeup_api",
    cleanTagBoost: hasCleanTag(tagList)
  };
}

function ecoGradeToScore(grade) {
  const map = { a: 100, b: 82, c: 60, d: 36, e: 15 };
  return map[grade] || null;
}

function ingredientMatch(text, key) {
  if (key === "bha" || key === "bht") {
    return new RegExp(`\\b${key}\\b`).test(text);
  }
  return text.includes(key);
}

function matchedRiskCount(risks, keys) {
  return risks.filter((risk) => keys.some((key) => risk.key.includes(key))).length;
}

function riskSeverity(risks, keys) {
  return risks.reduce((total, risk) => {
    if (!keys.some((key) => risk.key.includes(key))) return total;
    return total + risk.penalty;
  }, 0);
}

function percentile(values, value) {
  if (!values.length) return 0.5;
  const sorted = [...values].sort((a, b) => a - b);
  let count = 0;
  for (const current of sorted) {
    if (current <= value) count += 1;
  }
  return clamp(count / sorted.length, 0, 1);
}

function tokenSet(text) {
  return new Set(
    String(text || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3)
  );
}

function jaccardSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union ? intersection / union : 0;
}

function analyzeProduct(product) {
  let bodyScore = 96;
  let ecoScore = 92;
  const risks = [];
  const positives = [];

  const text = product.searchableIngredients;
  for (const risk of RISK_INGREDIENTS) {
    if (ingredientMatch(text, risk.key)) {
      risks.push(risk);
      let bodyPenalty = risk.penalty * 1.08;
      let ecoPenalty = risk.penalty * 0.58;

      if (ENDOCRINE_RISK_KEYS.some((key) => risk.key.includes(key))) {
        bodyPenalty += 6;
        ecoPenalty += 3;
      }
      if (ENVIRONMENT_RISK_KEYS.some((key) => risk.key.includes(key))) {
        ecoPenalty += 8;
      }
      if (HIGH_IRRITANT_KEYS.some((key) => risk.key.includes(key))) {
        bodyPenalty += 4;
      }
      if (risk.key === "fragrance" || risk.key === "parfum") {
        bodyPenalty += 2.5;
        ecoPenalty += 1.2;
      }

      bodyScore -= bodyPenalty;
      ecoScore -= ecoPenalty;
    }
  }

  const seenPositive = new Set();
  for (const good of BENEFICIAL_INGREDIENTS) {
    if (text.includes(good) && !seenPositive.has(good)) {
      positives.push(good);
      seenPositive.add(good);
    }
  }

  bodyScore += Math.min(10, positives.length * 2.2);
  ecoScore += Math.min(7, positives.length * 1.2);

  if (!product.ingredientsText) {
    bodyScore -= 22;
    ecoScore -= 12;
  } else if (product.ingredientsText.length < 20) {
    bodyScore -= 8;
    ecoScore -= 4;
  }

  const ecoFromGrade = ecoGradeToScore(product.ecoGrade);
  if (ecoFromGrade !== null) ecoScore = ecoFromGrade;
  else ecoScore -= 16;

  if (product.cleanTagBoost) {
    bodyScore += 2;
    ecoScore += 7;
  }

  const packagingText = product.packaging.join(" ").toLowerCase();
  if (packagingText.includes("plastic")) ecoScore -= 16;
  if (packagingText.includes("single-use")) ecoScore -= 8;
  if (packagingText.includes("glass")) ecoScore += 2;
  if (packagingText.includes("aluminum")) ecoScore += 6;
  if (packagingText.includes("recycled")) ecoScore += 10;
  if (packagingText.includes("refill")) ecoScore += 12;

  const labelText = product.labels.join(" ").toLowerCase();
  let labelBonus = 0;
  for (const label of ECO_LABEL_SIGNALS) {
    if (labelText.includes(label)) labelBonus += 4;
  }
  ecoScore += Math.min(20, labelBonus);

  const hormoneHits = matchedRiskCount(risks, ENDOCRINE_RISK_KEYS);
  const environmentHits = matchedRiskCount(risks, ENVIRONMENT_RISK_KEYS);
  const irritantHits = matchedRiskCount(risks, HIGH_IRRITANT_KEYS);
  const hormoneSeverity = riskSeverity(risks, ENDOCRINE_RISK_KEYS);
  const environmentSeverity = riskSeverity(risks, ENVIRONMENT_RISK_KEYS);
  const irritantSeverity = riskSeverity(risks, HIGH_IRRITANT_KEYS);

  bodyScore -= hormoneHits * 2.5;
  ecoScore -= environmentHits * 2.4;
  bodyScore -= irritantHits * 1.5;

  bodyScore = clamp(Math.round(bodyScore), 1, 99);
  ecoScore = clamp(Math.round(ecoScore), 1, 99);
  const overallScore = Math.round(bodyScore * 0.52 + ecoScore * 0.48);
  const cleanScore = clamp(
    Math.round(
      bodyScore * 0.56 +
      ecoScore * 0.44 -
      hormoneHits * 5 -
      environmentHits * 2.8 -
      irritantHits * 2.1 -
      risks.length * 1.6 +
      positives.length * 1.4
    ),
    1,
    99
  );

  const hazardScore = clamp(
    Math.round(
      hormoneSeverity * 1.35 +
      environmentSeverity * 1.1 +
      irritantSeverity * 0.95 +
      risks.length * 4
    ),
    0,
    160
  );

  let confidence = 25;
  if (product.ingredientsText) confidence += 35;
  if (product.ecoGrade) confidence += 20;
  if (product.labels.length) confidence += 5;
  if (product.packaging.length) confidence += 5;
  if (product.source === "makeup_api" && !product.ingredientsText) confidence -= 8;
  confidence = clamp(confidence, 15, 95);
  const ingredientTokenCount = tokenSet(product.ingredientsText).size;
  const positiveDensity = ingredientTokenCount ? positives.length / ingredientTokenCount : 0;
  const profileTokens = tokenSet(`${product.name} ${product.brand} ${product.categories} ${product.ingredientsText}`);
  const identityTokens = tokenSet(`${product.name} ${product.categories}`);

  return {
    product,
    risks,
    positives,
    hormoneHits,
    environmentHits,
    irritantHits,
    hormoneSeverity,
    environmentSeverity,
    irritantSeverity,
    hazardScore,
    positiveDensity,
    profileTokens,
    identityTokens,
    bodyScore,
    ecoScore,
    overallScore,
    cleanScore,
    confidence
  };
}

function scoreTone(score) {
  if (score >= 82) return "Excellent";
  if (score >= 68) return "Good";
  if (score >= 52) return "Mixed";
  return "Needs caution";
}

function buildOverview(analysis) {
  const { product, overallScore, confidence, risks } = analysis;
  const tone = scoreTone(overallScore);
  const riskSummary = risks.length
    ? `Detected ${risks.length} notable ingredient watch-outs.`
    : "No major watch-out ingredients were flagged from available data.";

  const sourceText = product.source === "makeup_api" ? "Makeup API" : "Open Beauty Facts";
  const cleanScore = analysis.cleanScore;
  const hazard = analysis.hazardScore;
  return `${product.name} (${product.brand}) scores ${overallScore}/100 (${tone}), with Clean Score ${cleanScore}/100 and risk index ${hazard}. ${riskSummary} Confidence: ${confidence}% from ingredient + label data (${sourceText}).`;
}

function renderProduct(analysis) {
  const { product } = analysis;
  const safeName = escapeHtml(product.name);
  const safeBrand = escapeHtml(product.brand);
  const safeCategory = escapeHtml(categoryLabel(product));
  const safeOverview = escapeHtml(buildOverview(analysis));
  const sourceUrl = safeUrl(product.sourceUrl);
  const sourceLabel = product.source === "makeup_api" ? "Makeup API" : "Open Beauty Facts";
  const image = product.imageUrl
    ? `<img class="product-image" src="${safeUrl(product.imageUrl)}" alt="${safeName}" />`
    : `<div class="product-image" aria-hidden="true"></div>`;

  refs.productPanel.innerHTML = `
    <h2>Product Overview</h2>
    <div class="product-top">
      ${image}
      <div class="product-meta">
        <h3>${safeName}</h3>
        <p><strong>Brand:</strong> ${safeBrand}</p>
        <p><strong>Category:</strong> ${safeCategory}</p>
        <p><strong>Source:</strong> ${sourceUrl === "#" ? escapeHtml(sourceLabel) : `<a href="${sourceUrl}" target="_blank" rel="noreferrer">${escapeHtml(sourceLabel)}</a>`}</p>
      </div>
    </div>
    <p class="overview">${safeOverview}</p>
  `;
}

function scoreCardHtml(label, value, caption, color) {
  return `
    <div class="score-card">
      <div class="dial" style="--value: ${value}; --dial-color: ${color};">
        <span>${value}</span>
      </div>
      <h4>${label}</h4>
      <p class="score-caption">${caption}</p>
    </div>
  `;
}

function renderScores(analysis) {
  const cleanScore = analysis.cleanScore;
  const hazardIndex = analysis.hazardScore;
  refs.scoreGrid.innerHTML = `
    ${scoreCardHtml("Clean Score", cleanScore, `Risk ${hazardIndex}`, "#ff98bb")}
    ${scoreCardHtml("Body Friendly", analysis.bodyScore, "Hormone + skin signal", "#ffbe9a")}
    ${scoreCardHtml("Eco Friendly", analysis.ecoScore, "Packaging + formula signal", "#6fc39a")}
  `;
}

function renderInsightLists(analysis) {
  if (!analysis.risks.length) {
    refs.riskList.innerHTML = `<li>No major watch-outs flagged.</li>`;
  } else {
    refs.riskList.innerHTML = analysis.risks
      .slice(0, 7)
      .map((risk) => `<li title="${risk.note}">${toTitleCase(risk.key)}</li>`)
      .join("");
  }

  if (!analysis.positives.length) {
    refs.goodList.classList.add("good");
    refs.goodList.innerHTML = `<li>Ingredient list had limited positive markers.</li>`;
  } else {
    refs.goodList.classList.add("good");
    refs.goodList.innerHTML = analysis.positives
      .slice(0, 7)
      .map((good) => `<li>${toTitleCase(good)}</li>`)
      .join("");
  }
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function featureLabelFromScore(score) {
  if (score >= 80) return "Excellent";
  if (score >= 68) return "Good";
  if (score >= 52) return "Moderate";
  return "Needs caution";
}

function endocrineLabel(hits) {
  if (hits <= 0) return "Low concern";
  if (hits === 1) return "Moderate concern";
  return "Higher concern";
}

function ecoPackagingLabel(analysis) {
  const text = analysis.product.packaging.join(" ").toLowerCase();
  if (text.includes("refill") || text.includes("recycled")) return "Refill/recycled positive";
  if (text.includes("plastic")) return "Plastic-heavy";
  if (analysis.ecoScore >= 72) return "Generally better";
  return "Mixed";
}

function moistureSealLabel(analysis) {
  const text = analysis.product.searchableIngredients;
  const occlusives = ["petrolatum", "mineral oil", "beeswax", "cera alba", "dimethicone", "lanolin", "castor oil"];
  const hit = occlusives.some((key) => text.includes(key));
  return hit ? "Good" : "Limited";
}

function nourishingLabel(analysis) {
  if (analysis.positives.length >= 2) return "Better";
  if (analysis.positives.length === 1) return "Moderate";
  return "Limited";
}

function bodyFriendlyLabel(analysis) {
  if (analysis.hormoneHits + analysis.irritantHits === 0 && analysis.bodyScore >= 70) return "Minimal irritants";
  if (analysis.bodyScore >= 58) return "Moderate concern";
  return "Higher concern";
}

function renderComparisonPanel(selectedAnalysis, alternativeEntries, categoryKey) {
  const guidance = categoryGuidance(categoryKey);
  refs.lookForTitle.textContent = guidance.title;
  refs.lookForList.innerHTML = guidance.lookFor.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  refs.summaryTitle.textContent = `Summary: ${selectedAnalysis.product.name} vs Cleaner Options`;
  const alternatives = alternativeEntries.map((entry) => entry.analysis);

  if (!alternatives.length) {
    refs.summaryRows.innerHTML = `
      <tr>
        <td>Availability</td>
        <td>${escapeHtml(selectedAnalysis.product.name)}</td>
        <td>No strong cleaner alternatives found yet in current data</td>
      </tr>
    `;
    return;
  }

  const altBody = mean(alternatives.map((alt) => alt.bodyScore));
  const altEco = mean(alternatives.map((alt) => alt.ecoScore));
  const altClean = mean(alternatives.map((alt) => alt.cleanScore));
  const altHormone = mean(alternatives.map((alt) => alt.hormoneHits));
  const altRisks = mean(alternatives.map((alt) => alt.risks.length));

  const rows = [
    {
      feature: "Moisture Seal",
      selected: moistureSealLabel(selectedAnalysis),
      cleaner: moistureSealLabel(alternatives[0])
    },
    {
      feature: "Nourishing",
      selected: nourishingLabel(selectedAnalysis),
      cleaner: nourishingLabel(alternatives[0])
    },
    {
      feature: "Body-friendly",
      selected: bodyFriendlyLabel(selectedAnalysis),
      cleaner: featureLabelFromScore(Math.round(altBody))
    },
    {
      feature: "Eco / Sustainable",
      selected: ecoPackagingLabel(selectedAnalysis),
      cleaner: ecoPackagingLabel(alternatives[0])
    },
    {
      feature: "Endocrine-risk signal",
      selected: endocrineLabel(selectedAnalysis.hormoneHits),
      cleaner: endocrineLabel(Math.round(altHormone))
    },
    {
      feature: "Clean Score",
      selected: `${selectedAnalysis.cleanScore}/100`,
      cleaner: `~${Math.round(altClean)}/100`
    },
    {
      feature: "Risk flags",
      selected: `${selectedAnalysis.risks.length} flagged`,
      cleaner: `~${Math.round(altRisks)} flagged`
    },
    {
      feature: "Eco Score",
      selected: `${selectedAnalysis.ecoScore}/100`,
      cleaner: `~${Math.round(altEco)}/100`
    }
  ];

  refs.summaryRows.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.feature)}</td>
        <td>${escapeHtml(row.selected)}</td>
        <td>${escapeHtml(row.cleaner)}</td>
      </tr>
    `
    )
    .join("");
}

function applyModelRanking(analyses) {
  if (!analyses.length) return;

  const bodyValues = analyses.map((analysis) => analysis.bodyScore);
  const ecoValues = analyses.map((analysis) => analysis.ecoScore);
  const cleanValues = analyses.map((analysis) => analysis.cleanScore);
  const hazardValues = analyses.map((analysis) => analysis.hazardScore);
  const endocrineValues = analyses.map((analysis) => analysis.hormoneSeverity);
  const ecoRiskValues = analyses.map((analysis) => analysis.environmentSeverity);
  const irritantValues = analyses.map((analysis) => analysis.irritantSeverity);
  const positiveValues = analyses.map((analysis) => analysis.positiveDensity);
  const confidenceValues = analyses.map((analysis) => analysis.confidence);

  for (const analysis of analyses) {
    const bodyPct = percentile(bodyValues, analysis.bodyScore);
    const ecoPct = percentile(ecoValues, analysis.ecoScore);
    const cleanPct = percentile(cleanValues, analysis.cleanScore);
    const hazardPct = percentile(hazardValues, analysis.hazardScore);
    const endocrinePct = percentile(endocrineValues, analysis.hormoneSeverity);
    const ecoRiskPct = percentile(ecoRiskValues, analysis.environmentSeverity);
    const irritantPct = percentile(irritantValues, analysis.irritantSeverity);
    const positivePct = percentile(positiveValues, analysis.positiveDensity);
    const confidencePct = percentile(confidenceValues, analysis.confidence);

    const rawModelScore =
      bodyPct * MODEL_WEIGHTS.bodyPct +
      ecoPct * MODEL_WEIGHTS.ecoPct +
      cleanPct * MODEL_WEIGHTS.cleanPct +
      hazardPct * MODEL_WEIGHTS.hazardPct +
      endocrinePct * MODEL_WEIGHTS.endocrinePct +
      ecoRiskPct * MODEL_WEIGHTS.ecoRiskPct +
      irritantPct * MODEL_WEIGHTS.irritantPct +
      positivePct * MODEL_WEIGHTS.positivePct +
      confidencePct * MODEL_WEIGHTS.confidencePct;

    const modelCleanScore = clamp(Math.round(sigmoid(rawModelScore * 2.25 - 2.2) * 100), 1, 99);
    const modelRiskIndex = clamp(
      Math.round(analysis.hazardScore * 0.7 + hazardPct * 38 + endocrinePct * 20 + ecoRiskPct * 16),
      0,
      180
    );

    analysis.modelSignals = {
      bodyPct,
      ecoPct,
      cleanPct,
      hazardPct,
      endocrinePct,
      ecoRiskPct,
      irritantPct,
      positivePct,
      confidencePct,
      rawModelScore
    };
    analysis.modelCleanScore = modelCleanScore;
    analysis.modelRiskIndex = modelRiskIndex;
  }
}

function rankAlternativeCandidates(selectedAnalysis, analyses, categoryKey) {
  const selectedBrand = selectedAnalysis.product.brand.toLowerCase();
  const selectedKey = analysisKey(selectedAnalysis);
  const selectedRiskCount = selectedAnalysis.risks.length;
  const selectedHormoneHits = selectedAnalysis.hormoneHits || 0;
  const selectedEnvironmentHits = selectedAnalysis.environmentHits || 0;
  const selectedIrritantHits = selectedAnalysis.irritantHits || 0;
  const selectedModelClean = selectedAnalysis.modelCleanScore || selectedAnalysis.cleanScore;
  const selectedModelRisk = selectedAnalysis.modelRiskIndex || selectedAnalysis.hazardScore;
  const selectedTokens = selectedAnalysis.profileTokens || new Set();
  const selectedIdentityTokens = selectedAnalysis.identityTokens || tokenSet(selectedAnalysis.product.name);

  const ranked = analyses
    .filter((analysis) => analysisKey(analysis) !== selectedKey)
    .filter((analysis) => categoryKey === "all" || categoryMatch(analysis.product, categoryKey))
    .map((analysis) => {
      const candidateModelClean = analysis.modelCleanScore || analysis.cleanScore;
      const candidateModelRisk = analysis.modelRiskIndex || analysis.hazardScore;
      const cleanDelta = candidateModelClean - selectedModelClean;
      const riskIndexReduction = selectedModelRisk - candidateModelRisk;
      const riskReduction = selectedRiskCount - analysis.risks.length;
      const hormoneReduction = selectedHormoneHits - (analysis.hormoneHits || 0);
      const environmentReduction = selectedEnvironmentHits - (analysis.environmentHits || 0);
      const irritantReduction = selectedIrritantHits - (analysis.irritantHits || 0);
      const noNewRiskFlags =
        analysis.risks.length <= selectedRiskCount &&
        (analysis.hormoneHits || 0) <= selectedHormoneHits &&
        (analysis.environmentHits || 0) <= selectedEnvironmentHits &&
        (analysis.irritantHits || 0) <= selectedIrritantHits;
      const differentBrand = analysis.product.brand.toLowerCase() !== selectedBrand;
      const similarity = jaccardSimilarity(selectedTokens, analysis.profileTokens || new Set());
      const identitySimilarity = jaccardSimilarity(selectedIdentityTokens, analysis.identityTokens || new Set());
      const rankValue =
        cleanDelta * 3.1 +
        riskIndexReduction * 0.26 +
        riskReduction * 1.5 +
        hormoneReduction * 3.9 +
        environmentReduction * 2.9 +
        irritantReduction * 3.2 +
        (analysis.bodyScore - selectedAnalysis.bodyScore) * 0.72 +
        (analysis.ecoScore - selectedAnalysis.ecoScore) * 0.78 +
        similarity * 10 +
        identitySimilarity * 26 +
        candidateModelClean * 0.07 +
        (differentBrand ? 2 : 0) +
        (noNewRiskFlags ? 3.5 : -6.5) +
        analysis.confidence * 0.05;

      return {
        analysis,
        cleanDelta,
        riskIndexReduction,
        riskReduction,
        hormoneReduction,
        environmentReduction,
        irritantReduction,
        noNewRiskFlags,
        similarity,
        identitySimilarity,
        differentBrand,
        rankValue
      };
    })
    .sort((a, b) => b.rankValue - a.rankValue);

  const compatibleRanked = ranked.filter((entry) => categoryKey !== "all" || entry.identitySimilarity >= 0.12);
  const saferRanked = compatibleRanked.filter(
    (entry) => entry.noNewRiskFlags && entry.riskIndexReduction >= 0 && entry.cleanDelta >= 0
  );
  const cleaner = saferRanked
    .filter(
      (entry) =>
        entry.cleanDelta >= 3 ||
        entry.riskIndexReduction >= 4 ||
        entry.riskReduction >= 1 ||
        entry.hormoneReduction >= 1 ||
        entry.environmentReduction >= 1 ||
        entry.irritantReduction >= 1 ||
        (entry.identitySimilarity >= 0.1 && entry.cleanDelta >= 1)
    )
    .slice(0, 4);
  if (cleaner.length >= 3) return cleaner.slice(0, 3);

  const picked = [...cleaner];
  for (const entry of saferRanked) {
    if (picked.some((p) => analysisKey(p.analysis) === analysisKey(entry.analysis))) continue;
    picked.push(entry);
    if (picked.length === 3) break;
  }
  return picked;
}

async function fetchBroaderAlternatives(selectedAnalysis, categoryKey) {
  const cacheKey = `${categoryKey}::alt`;
  if (state.alternativeCache[cacheKey]) {
    return state.alternativeCache[cacheKey];
  }

  const query = ALT_SEARCH_TERMS[categoryKey] || ALT_SEARCH_TERMS.all;
  const rows = await fetchProducts(query, 60, 2, categoryKey);
  const analyses = rows
    .filter((product) => categoryKey === "all" || categoryMatch(product, categoryKey))
    .map(analyzeProduct);

  const deduped = uniqueAnalyses(analyses);
  applyModelRanking(deduped);
  state.alternativeCache[cacheKey] = deduped;
  return deduped;
}

function alternativeReason(selectedAnalysis, entry) {
  const reasons = [];
  if (entry.cleanDelta >= 1) reasons.push(`clean score +${entry.cleanDelta}`);
  if (entry.riskIndexReduction >= 1) reasons.push(`hazard index -${entry.riskIndexReduction}`);
  if (entry.hormoneReduction >= 1) reasons.push(`${entry.hormoneReduction} fewer endocrine flags`);
  if (entry.environmentReduction >= 1) reasons.push(`${entry.environmentReduction} fewer eco-risk flags`);
  if (entry.riskReduction >= 1) reasons.push(`${entry.riskReduction} fewer risk flag${entry.riskReduction > 1 ? "s" : ""}`);
  if (entry.analysis.bodyScore > selectedAnalysis.bodyScore) reasons.push(`better body profile`);
  if (entry.analysis.ecoScore > selectedAnalysis.ecoScore) reasons.push(`better eco profile`);
  if (entry.differentBrand) reasons.push("different brand option");
  return reasons.slice(0, 3).join(" • ") || "similar profile alternative";
}

function renderAlternatives(selectedAnalysis, alternatives = []) {
  const categoryKey = resolveAlternativeCategory(selectedAnalysis.product);
  renderComparisonPanel(selectedAnalysis, alternatives, categoryKey);
  if (!alternatives.length) {
    refs.alternativesGrid.innerHTML = `<p class="empty-state">No alternatives were found yet. Try a broader product or category search.</p>`;
    return;
  }

  refs.alternativesGrid.innerHTML = alternatives
    .map((entry) => {
      const { analysis, cleanDelta } = entry;
      const safeName = escapeHtml(analysis.product.name);
      const safeImageUrl = safeUrl(analysis.product.imageUrl);
      const cleanScore = analysis.cleanScore;
      const badge = cleanDelta >= 1 ? `Cleaner +${cleanDelta}` : "Alternative";
      const reason = alternativeReason(selectedAnalysis, entry);
      const imageMarkup = safeImageUrl !== "#"
        ? `<img class="alt-image" src="${safeImageUrl}" alt="${safeName}" loading="lazy" />`
        : `<div class="alt-image alt-image-placeholder" aria-hidden="true"></div>`;
      return `
      <article class="alt-card">
        ${imageMarkup}
        <h3>${safeName}</h3>
        <p>${escapeHtml(analysis.product.brand)}</p>
        <span class="alt-badge">${badge} · Clean ${cleanScore}</span>
        <p>${escapeHtml(reason)}</p>
        <p>${escapeHtml(buildOverview(analysis))}</p>
      </article>
    `;
    })
    .join("");
}

function renderMatches(analyses, selectedId = null) {
  const rows = analyses.slice(0, 16);
  if (!rows.length) {
    refs.matchesGrid.innerHTML = `<p class="empty-state">Your matching products will appear here after search.</p>`;
    return;
  }

  refs.matchesGrid.innerHTML = rows
    .map(
      (entry, index) => `
      <button type="button" class="match-card ${entry.product.id === selectedId ? "active" : ""}" data-midx="${index}">
        <p class="match-name">${escapeHtml(entry.product.name)}</p>
        <p class="match-brand">${escapeHtml(entry.product.brand)}</p>
        <span class="match-score">Clean ${entry.cleanScore}</span>
      </button>
    `
    )
    .join("");
}

function renderSelectedAnalysis(analysis, allAnalyses) {
  state.selectedId = analysis.product.id;
  const alternatives = state.alternativesById[analysis.product.id] || [];
  renderProduct(analysis);
  renderScores(analysis);
  renderInsightLists(analysis);
  renderAlternatives(analysis, alternatives);
  renderMatches(allAnalyses, analysis.product.id);
}

function relevanceScore(product, query) {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const productName = (product.name || "").toLowerCase();
  const brandName = (product.brand || "").toLowerCase();
  const categories = (product.categories || "").toLowerCase();
  const categoryTags = Array.isArray(product.categoriesTags)
    ? product.categoriesTags.join(" ").toLowerCase()
    : "";
  const tokens = queryTokens(query);

  let points = 0;

  if (productName === q) points += 24;
  else if (productName.startsWith(q)) points += 18;
  else if (productName.includes(q)) points += 12;

  if (brandName === q) points += 18;
  else if (brandName.startsWith(q)) points += 14;
  else if (brandName.includes(q)) points += 9;

  if (categories.includes(q) || categoryTags.includes(q)) points += 7;

  let tokenHits = 0;
  for (const token of tokens) {
    if (productName.includes(token)) tokenHits += 1.8;
    if (brandName.includes(token)) tokenHits += 1.5;
    if (categories.includes(token) || categoryTags.includes(token)) tokenHits += 1.1;
  }
  points += tokenHits * 3.4;

  if (state.activeCategory !== "all" && categoryMatch(product, state.activeCategory)) {
    points += 4;
  }

  return points;
}

function renderEmptyState(message) {
  refs.productPanel.innerHTML = `<h2>Product Overview</h2><p class="empty-state">${escapeHtml(message)}</p>`;
  refs.scoreGrid.innerHTML = `<p class="empty-state">Scores appear after product analysis.</p>`;
  refs.matchesGrid.innerHTML = `<p class="empty-state">Your matching products will appear here after search.</p>`;
  refs.riskList.innerHTML = "";
  refs.goodList.innerHTML = "";
  refs.lookForTitle.textContent = "What to Look for in Cleaner Options";
  refs.lookForList.innerHTML = `<li>Search a product to get tailored cleaner guidance.</li>`;
  refs.summaryTitle.textContent = "Summary: Selected vs Cleaner Options";
  refs.summaryRows.innerHTML = "";
  refs.alternativesGrid.innerHTML =
    `<p class="empty-state">When a better option is found in the same search set, it will appear here.</p>`;
}

function factPool(type) {
  if (type === "random") {
    return [...FUN_FACTS.quick, ...FUN_FACTS.eco, ...FUN_FACTS.body];
  }
  return FUN_FACTS[type] || FUN_FACTS.quick;
}

function renderFunFact(type = state.factType) {
  const pool = factPool(type);
  const selectedFact = randomItemExcluding(pool, state.lastFactText);
  state.lastFactText = selectedFact;
  refs.funFact.textContent = selectedFact;
}

function queryTokens(query) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);
}

function inferMakeupTypesFromQuery(query) {
  const q = query.toLowerCase();
  const matches = [];
  if (q.includes("lip")) matches.push("lipstick", "lip_liner");
  if (q.includes("eye") || q.includes("liner") || q.includes("mascara")) matches.push("eyeliner", "eyeshadow", "mascara");
  if (q.includes("brow")) matches.push("eyebrow");
  if (q.includes("foundation") || q.includes("concealer")) matches.push("foundation", "concealer");
  return [...new Set(matches)];
}

async function fetchOpenBeautyProducts(query, pageSize = 30, pages = 1) {
  const allProducts = [];
  const seenCodes = new Set();

  for (let page = 1; page <= pages; page += 1) {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: String(pageSize),
      page: String(page),
      fields:
        "code,id,product_name,brands,categories,categories_tags,ingredients_text,ingredients_text_en,ingredients_tags,ecoscore_grade,image_front_url,image_front_small_url,image_url,image_small_url,url,labels_tags,packaging_tags"
    });

    const response = await fetch(`${API_BASE}?${params.toString()}`);
    if (!response.ok) throw new Error("Unable to fetch Open Beauty Facts records.");
    const payload = await response.json();
    const rows = Array.isArray(payload.products) ? payload.products : [];

    for (const row of rows) {
      const code = row.code || row.id || `${row.product_name || ""}-${Math.random()}`;
      if (!seenCodes.has(code)) {
        seenCodes.add(code);
        const normalized = normalizeOpenBeautyProduct(row);
        if (normalized) allProducts.push(normalized);
      }
    }
  }

  return allProducts;
}

function makeupRelevance(rawProduct, query) {
  const q = query.toLowerCase().trim();
  const tokens = queryTokens(query);
  const name = (rawProduct.name || "").toLowerCase();
  const brand = (rawProduct.brand || "").toLowerCase();
  const productType = (rawProduct.product_type || "").toLowerCase();
  const category = (rawProduct.category || "").toLowerCase();

  let points = 0;
  if (name.includes(q) || brand.includes(q)) points += 9;
  for (const token of tokens) {
    if (name.includes(token)) points += 2.5;
    if (brand.includes(token)) points += 2;
    if (productType.includes(token) || category.includes(token)) points += 1.3;
  }
  return points;
}

async function fetchMakeupProducts(query, category = "all") {
  const tokenList = queryTokens(query);
  const brandCandidate = tokenList.slice(0, 2).join(" ");
  const firstToken = tokenList[0] || "";
  const secondToken = tokenList[1] || "";
  const categoryTypes = MAKEUP_TYPE_BY_CATEGORY[category] || [];
  const inferredTypes = inferMakeupTypesFromQuery(query);
  const types = [...new Set([...categoryTypes, ...inferredTypes])].slice(0, 4);

  const requests = [];
  const brandVariants = [
    brandCandidate,
    brandCandidate.replace(/\s+/g, "-"),
    brandCandidate.replace(/\s+/g, ""),
    firstToken,
    secondToken,
    tokenList.slice(0, 3).join(" ")
  ]
    .map((value) => value.trim())
    .filter(Boolean);
  const seenBrandVariants = new Set();
  for (const brand of brandVariants) {
    if (seenBrandVariants.has(brand)) continue;
    seenBrandVariants.add(brand);
    requests.push(`${MAKEUP_API_BASE}?brand=${encodeURIComponent(brand)}`);
  }
  for (const type of types) {
    requests.push(`${MAKEUP_API_BASE}?product_type=${encodeURIComponent(type)}`);
  }
  if (!requests.length) requests.push(MAKEUP_API_BASE);

  const settled = await Promise.allSettled(
    requests.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) return [];
      const payload = await response.json();
      return Array.isArray(payload) ? payload : [];
    })
  );

  const merged = [];
  const seen = new Set();
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const row of result.value) {
      const id = row.id ? `makeup-${row.id}` : `${row.name || ""}-${row.brand || ""}`;
      if (seen.has(id)) continue;
      seen.add(id);
      merged.push(row);
    }
  }

  return merged
    .map((row) => ({ row, score: makeupRelevance(row, query) }))
    .filter((item) => item.score > 1.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 120)
    .map((item) => normalizeMakeupApiProduct(item.row))
    .filter(Boolean);
}

function uniqueProducts(products) {
  const unique = [];
  const seen = new Set();
  for (const product of products) {
    const key = `${product.name.toLowerCase()}::${product.brand.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(product);
  }
  return unique;
}

async function fetchProducts(query, pageSize = 40, pages = 2, category = state.activeCategory) {
  const [openBeautyResult, makeupResult] = await Promise.allSettled([
    fetchOpenBeautyProducts(query, pageSize, pages),
    fetchMakeupProducts(query, category)
  ]);

  const openBeautyProducts = openBeautyResult.status === "fulfilled" ? openBeautyResult.value : [];
  const makeupProducts = makeupResult.status === "fulfilled" ? makeupResult.value : [];
  return uniqueProducts([...openBeautyProducts, ...makeupProducts]);
}

async function loadSuggestions(query) {
  if (query.trim().length < 2) {
    refs.suggestions.classList.add("hidden");
    return;
  }

  try {
    const payload = await apiGet("/api/suggest", {
      query,
      category: state.activeCategory,
      limit: 8
    });
    const rows = Array.isArray(payload.items) ? payload.items : [];
    state.suggestionItems = rows.slice(0, 8);

    if (!state.suggestionItems.length) {
      refs.suggestions.classList.add("hidden");
      return;
    }

    refs.suggestions.innerHTML = state.suggestionItems
      .map(
        (item, idx) => `
        <li>
          <button type="button" data-sidx="${idx}">
            <strong>${escapeHtml(item.name)}</strong>
            <div class="suggestion-brand">${escapeHtml(item.brand)} • ${escapeHtml(categoryLabel(item))}</div>
          </button>
        </li>
      `
      )
      .join("");
    refs.suggestions.classList.remove("hidden");
  } catch (error) {
    refs.suggestions.classList.add("hidden");
  }
}

async function analyzeQuery(query, preferredProductName = "") {
  if (!query.trim()) {
    setStatus("Enter a product name to analyze.");
    return;
  }

  setStatus("Analyzing product data...");
  refs.suggestions.classList.add("hidden");

  try {
    const payload = await apiGet("/api/analyze", {
      query,
      category: state.activeCategory,
      preferred: preferredProductName
    });
    const analyses = Array.isArray(payload.analyses) ? payload.analyses : [];
    const alternativesByIdRaw = payload.alternativesById && typeof payload.alternativesById === "object"
      ? payload.alternativesById
      : {};

    if (!analyses.length) {
      setStatus("No matching beauty products found. Try another spelling or wider term.");
      renderEmptyState("No matching beauty products found yet.");
      return;
    }

    state.lastAnalyses = analyses;
    state.alternativesById = {};
    const analysisById = new Map(analyses.map((item) => [item.product.id, item]));
    for (const [selectedId, entries] of Object.entries(alternativesByIdRaw)) {
      const parsed = Array.isArray(entries) ? entries : [];
      state.alternativesById[selectedId] = parsed
        .map((entry) => {
          const altAnalysis = analysisById.get(entry.analysisId);
          if (!altAnalysis) return null;
          return {
            analysis: altAnalysis,
            cleanDelta: Number(entry.cleanDelta || 0),
            riskIndexReduction: Number(entry.riskIndexReduction || 0),
            riskReduction: Number(entry.riskReduction || 0),
            hormoneReduction: Number(entry.hormoneReduction || 0),
            environmentReduction: Number(entry.environmentReduction || 0),
            irritantReduction: Number(entry.irritantReduction || 0),
            differentBrand: Boolean(entry.differentBrand),
            similarity: Number(entry.similarity || 0),
            identitySimilarity: Number(entry.identitySimilarity || 0),
            rankValue: Number(entry.rankValue || 0)
          };
        })
        .filter(Boolean)
        .slice(0, 3);
    }

    const selectedId = payload.selectedId || analyses[0].product.id;
    const selected = analysisById.get(selectedId) || analyses[0];
    renderSelectedAnalysis(selected, analyses);
    renderFunFact(state.factType);
    if (payload.statusText) {
      setStatus(payload.statusText);
    } else {
      setStatus(`Analyzed ${analyses.length} products.`);
    }
  } catch (error) {
    setStatus("Could not load product data right now. Please retry in a moment.");
    renderEmptyState("Could not load product data right now.");
  }
}

function setActiveCategory(category) {
  state.activeCategory = category;
  state.alternativeCache = {};
  state.alternativesById = {};
  const buttons = Array.from(refs.categoryRow.querySelectorAll(".category-pill"));
  for (const button of buttons) {
    const active = button.dataset.category === category;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  }
}

const debouncedSuggestions = debounce((value) => loadSuggestions(value), 300);

function setupEvents() {
  refs.input.addEventListener("input", (event) => {
    debouncedSuggestions(event.target.value);
  });

  refs.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      analyzeQuery(refs.input.value);
    }
  });

  refs.searchBtn.addEventListener("click", () => {
    analyzeQuery(refs.input.value);
  });

  refs.suggestions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-sidx]");
    if (!button) return;
    const idx = Number(button.dataset.sidx);
    const selected = state.suggestionItems[idx];
    if (!selected) return;
    refs.input.value = selected.name;
    analyzeQuery(`${selected.name} ${selected.brand}`, selected.name);
  });

  refs.matchesGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-midx]");
    if (!button) return;
    const index = Number(button.dataset.midx);
    const selected = state.lastAnalyses[index];
    if (!selected) return;
    renderSelectedAnalysis(selected, state.lastAnalyses);
    setStatus(`Viewing ${selected.product.name}.`);
  });

  refs.categoryRow.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    setActiveCategory(button.dataset.category);

    const query = refs.input.value.trim();
    if (query.length >= 2) {
      loadSuggestions(query);
      analyzeQuery(query);
    } else {
      setStatus(`Category: ${button.textContent}. Type a product name to analyze.`);
    }
  });

  refs.factButtons.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-fact-type]");
    if (!button) return;

    const type = button.dataset.factType;
    if (type === "refresh") {
      renderFunFact(state.factType);
      return;
    }
    state.factType = type;

    const allButtons = Array.from(refs.factButtons.querySelectorAll(".fact-btn[data-fact-type]"));
    for (const factButton of allButtons) {
      if (factButton.dataset.factType === "refresh") continue;
      factButton.classList.toggle("active", factButton.dataset.factType === type);
    }
    renderFunFact(type);
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (
      target !== refs.input &&
      !refs.suggestions.contains(target)
    ) {
      refs.suggestions.classList.add("hidden");
    }
  });
}

function init() {
  renderEmptyState("Search to see product details, ingredient signals, and impact notes.");
  renderFunFact("quick");
  setupEvents();
  window.setInterval(() => {
    renderFunFact(state.factType);
  }, 12000);
}

init();
