const API_BASE = "https://world.openbeautyfacts.org/cgi/search.pl";
const CATEGORY_KEYWORDS = {
  all: [],
  fragrances: ["perfume", "fragrance", "deodorant", "cologne", "eau de", "body mist"],
  "lip-care": ["lip", "lipstick", "lip balm", "lip gloss", "lip care"],
  "skin-care": ["cream", "cleanser", "serum", "moisturizer", "lotion", "body wash", "face wash", "mask"],
  "eye-makeup": ["eyeliner", "mascara", "eyeshadow", "eye shadow", "brow", "kajal"]
};

const BEAUTY_HINTS = [
  ...CATEGORY_KEYWORDS.fragrances,
  ...CATEGORY_KEYWORDS["lip-care"],
  ...CATEGORY_KEYWORDS["skin-care"],
  ...CATEGORY_KEYWORDS["eye-makeup"],
  "makeup",
  "cosmetic",
  "beauty"
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

const FUN_FACTS = [
  "Refillable beauty packaging can reduce packaging waste by up to 70% across repeated purchases.",
  "Synthetic fragrance blends can contain dozens of compounds, so transparency labels matter for sensitivity tracking.",
  "Even small swaps to fragrance-free or low-irritant formulas can reduce cumulative skin barrier stress over time.",
  "Products with clear ingredient disclosure make it easier to compare safety and sustainability side by side.",
  "Using one multi-purpose product (like lip-cheek tint) can reduce both packaging and total consumption."
];

const state = {
  activeCategory: "all",
  suggestionItems: [],
  lastAnalyses: [],
  selectedId: null
};

const refs = {
  input: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  suggestions: document.getElementById("suggestions"),
  statusText: document.getElementById("statusText"),
  categoryRow: document.getElementById("categoryRow"),
  productPanel: document.getElementById("productPanel"),
  scoreGrid: document.getElementById("scoreGrid"),
  riskList: document.getElementById("riskList"),
  goodList: document.getElementById("goodList"),
  alternativesGrid: document.getElementById("alternativesGrid"),
  funFact: document.getElementById("funFact")
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

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function setStatus(text) {
  refs.statusText.textContent = text;
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

function toTitleCase(text) {
  return text
    .split(" ")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function categoryLabel(product) {
  const haystack = `${product.name} ${product.categories}`.toLowerCase();
  if (CATEGORY_KEYWORDS.fragrances.some((term) => haystack.includes(term))) return "Fragrances";
  if (CATEGORY_KEYWORDS["lip-care"].some((term) => haystack.includes(term))) return "Lip Care";
  if (CATEGORY_KEYWORDS["eye-makeup"].some((term) => haystack.includes(term))) return "Eye Makeup";
  if (CATEGORY_KEYWORDS["skin-care"].some((term) => haystack.includes(term))) return "Skin Care";
  return "Beauty";
}

function matchesActiveCategory(product) {
  if (state.activeCategory === "all") return true;
  const haystack = `${product.name} ${product.categories}`.toLowerCase();
  return CATEGORY_KEYWORDS[state.activeCategory].some((term) => haystack.includes(term));
}

function isBeautyCandidate(rawProduct) {
  const name = (rawProduct.product_name || "").toLowerCase();
  const categories = (rawProduct.categories || "").toLowerCase();
  const blob = `${name} ${categories}`;
  return BEAUTY_HINTS.some((term) => blob.includes(term));
}

function normalizeProduct(rawProduct) {
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

  return {
    id: rawProduct.code || rawProduct.id || `${name}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    brand: (rawProduct.brands || "Unknown brand").split(",")[0].trim(),
    categories: rawProduct.categories || "",
    ingredientsText,
    searchableIngredients: `${ingredientsText} ${ingredientsTagsText}`.toLowerCase(),
    ecoGrade: (rawProduct.ecoscore_grade || "").toLowerCase(),
    packaging,
    labels,
    imageUrl: rawProduct.image_front_url || rawProduct.image_url || "",
    sourceUrl: rawProduct.url || `https://world.openbeautyfacts.org/product/${rawProduct.code || ""}`
  };
}

function ecoGradeToScore(grade) {
  const map = { a: 94, b: 80, c: 65, d: 46, e: 28 };
  return map[grade] || null;
}

function analyzeProduct(product) {
  let bodyScore = 88;
  let ecoScore = 76;
  const risks = [];
  const positives = [];

  const text = product.searchableIngredients;
  for (const risk of RISK_INGREDIENTS) {
    if (text.includes(risk.key)) {
      risks.push(risk);
      bodyScore -= risk.penalty;
      if (
        risk.key === "polyethylene" ||
        risk.key === "polypropylene" ||
        risk.key === "nylon-12" ||
        risk.key === "acrylates copolymer"
      ) {
        ecoScore -= 8;
      }
      if (risk.key === "oxybenzone" || risk.key === "octinoxate" || risk.key === "triclosan") {
        ecoScore -= 10;
      }
    }
  }

  const seenPositive = new Set();
  for (const good of BENEFICIAL_INGREDIENTS) {
    if (text.includes(good) && !seenPositive.has(good)) {
      positives.push(good);
      seenPositive.add(good);
    }
  }

  bodyScore += Math.min(10, positives.length * 2);

  if (!product.ingredientsText) {
    bodyScore -= 10;
  }

  const ecoFromGrade = ecoGradeToScore(product.ecoGrade);
  if (ecoFromGrade !== null) ecoScore = ecoFromGrade;
  else ecoScore -= 8;

  const packagingText = product.packaging.join(" ").toLowerCase();
  if (packagingText.includes("plastic")) ecoScore -= 10;
  if (packagingText.includes("glass")) ecoScore += 4;
  if (packagingText.includes("recycled")) ecoScore += 8;
  if (packagingText.includes("refill")) ecoScore += 8;

  const labelText = product.labels.join(" ").toLowerCase();
  let labelBonus = 0;
  for (const label of ECO_LABEL_SIGNALS) {
    if (labelText.includes(label)) labelBonus += 3;
  }
  ecoScore += Math.min(12, labelBonus);

  bodyScore = clamp(Math.round(bodyScore), 5, 98);
  ecoScore = clamp(Math.round(ecoScore), 8, 98);
  const overallScore = Math.round(bodyScore * 0.56 + ecoScore * 0.44);

  let confidence = 30;
  if (product.ingredientsText) confidence += 35;
  if (product.ecoGrade) confidence += 20;
  if (product.labels.length) confidence += 5;
  if (product.packaging.length) confidence += 5;
  confidence = clamp(confidence, 20, 95);

  return {
    product,
    risks,
    positives,
    bodyScore,
    ecoScore,
    overallScore,
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

  return `${product.name} (${product.brand}) scores ${overallScore}/100 (${tone}). ${riskSummary} Confidence: ${confidence}% based on ingredient and labeling completeness.`;
}

function renderProduct(analysis) {
  const { product } = analysis;
  const safeName = escapeHtml(product.name);
  const safeBrand = escapeHtml(product.brand);
  const safeCategory = escapeHtml(categoryLabel(product));
  const safeOverview = escapeHtml(buildOverview(analysis));
  const sourceUrl = safeUrl(product.sourceUrl);
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
        <p><a href="${sourceUrl}" target="_blank" rel="noreferrer">View source listing</a></p>
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
  refs.scoreGrid.innerHTML = `
    ${scoreCardHtml("Overall", analysis.overallScore, scoreTone(analysis.overallScore), "#ff98bb")}
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

function renderAlternatives(selectedAnalysis, allAnalyses) {
  const alternatives = allAnalyses
    .filter((entry) => entry.product.id !== selectedAnalysis.product.id)
    .filter((entry) => entry.overallScore >= selectedAnalysis.overallScore + 4)
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 3);

  if (!alternatives.length) {
    refs.alternativesGrid.innerHTML = `<p class="empty-state">No stronger alternatives found in this result set yet. Try a broader search term.</p>`;
    return;
  }

  refs.alternativesGrid.innerHTML = alternatives
    .map(
      (alt) => `
      <article class="alt-card">
        <h3>${escapeHtml(alt.product.name)}</h3>
        <p>${escapeHtml(alt.product.brand)}</p>
        <span class="alt-badge">Score ${alt.overallScore}</span>
        <p>${escapeHtml(buildOverview(alt))}</p>
      </article>
    `
    )
    .join("");
}

function relevanceScore(product, query) {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const productName = product.name.toLowerCase();
  const brandName = product.brand.toLowerCase();
  let points = 0;
  if (productName === q) points += 8;
  if (productName.includes(q)) points += 5;
  if (brandName.includes(q)) points += 2;
  points += Math.min(3, productName.split(" ").filter((w) => q.includes(w)).length);
  return points;
}

function renderEmptyState(message) {
  refs.productPanel.innerHTML = `<h2>Product Overview</h2><p class="empty-state">${escapeHtml(message)}</p>`;
  refs.scoreGrid.innerHTML = `<p class="empty-state">Scores appear after product analysis.</p>`;
  refs.riskList.innerHTML = "";
  refs.goodList.innerHTML = "";
  refs.alternativesGrid.innerHTML =
    `<p class="empty-state">When a better option is found in the same search set, it will appear here.</p>`;
}

async function fetchProducts(query, pageSize = 28) {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: String(pageSize),
    fields:
      "code,id,product_name,brands,categories,ingredients_text,ingredients_text_en,ingredients_tags,ecoscore_grade,image_front_url,image_url,url,labels_tags,packaging_tags"
  });

  const response = await fetch(`${API_BASE}?${params.toString()}`);
  if (!response.ok) throw new Error("Unable to fetch product records.");
  const payload = await response.json();
  return Array.isArray(payload.products) ? payload.products : [];
}

async function loadSuggestions(query) {
  if (query.trim().length < 2) {
    refs.suggestions.classList.add("hidden");
    return;
  }

  try {
    const rows = await fetchProducts(query, 10);
    const list = rows
      .filter(isBeautyCandidate)
      .map(normalizeProduct)
      .filter(Boolean)
      .filter(matchesActiveCategory);

    const unique = [];
    const keySet = new Set();
    for (const item of list) {
      const key = `${item.name.toLowerCase()}::${item.brand.toLowerCase()}`;
      if (!keySet.has(key)) {
        keySet.add(key);
        unique.push(item);
      }
    }

    state.suggestionItems = unique.slice(0, 7);

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
    const rows = await fetchProducts(query, 36);
    const products = rows
      .filter(isBeautyCandidate)
      .map(normalizeProduct)
      .filter(Boolean)
      .filter(matchesActiveCategory);

    if (!products.length) {
      setStatus("No matching beauty products found. Try another spelling or wider term.");
      renderEmptyState("No matching beauty products found yet.");
      return;
    }

    const analyses = products.map(analyzeProduct);
    state.lastAnalyses = analyses;

    analyses.sort((a, b) => {
      const preferredBoostA = preferredProductName &&
        a.product.name.toLowerCase().includes(preferredProductName.toLowerCase())
        ? 6
        : 0;
      const preferredBoostB = preferredProductName &&
        b.product.name.toLowerCase().includes(preferredProductName.toLowerCase())
        ? 6
        : 0;
      const rankA = relevanceScore(a.product, query) + preferredBoostA + a.overallScore * 0.02;
      const rankB = relevanceScore(b.product, query) + preferredBoostB + b.overallScore * 0.02;
      return rankB - rankA;
    });

    const selected = analyses[0];
    state.selectedId = selected.product.id;
    renderProduct(selected);
    renderScores(selected);
    renderInsightLists(selected);
    renderAlternatives(selected, analyses);
    setStatus(`Analyzed ${products.length} products from Open Beauty Facts.`);
  } catch (error) {
    setStatus("Could not load product data right now. Please retry in a moment.");
    renderEmptyState("Could not load product data right now.");
  }
}

function setActiveCategory(category) {
  state.activeCategory = category;
  const buttons = Array.from(refs.categoryRow.querySelectorAll(".category-pill"));
  for (const button of buttons) {
    button.classList.toggle("active", button.dataset.category === category);
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

  refs.categoryRow.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    setActiveCategory(button.dataset.category);

    const query = refs.input.value.trim();
    if (query.length >= 2) {
      loadSuggestions(query);
      analyzeQuery(query);
    }
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
  refs.funFact.textContent = randomItem(FUN_FACTS);
  setupEvents();
}

init();
