const API_BASE = "https://world.openbeautyfacts.org/cgi/search.pl";
const CATEGORY_KEYWORDS = {
  all: [],
  fragrances: ["perfume", "fragrance", "deodorant", "cologne", "eau de", "body mist", "parfum"],
  "lip-care": ["lip", "lipstick", "lip balm", "lip gloss", "lip care", "lipliner", "lipstick"],
  "skin-care": ["cream", "cleanser", "serum", "moisturizer", "lotion", "body wash", "face wash", "mask", "toner"],
  "eye-makeup": ["eyeliner", "mascara", "eyeshadow", "eye shadow", "brow", "kajal", "eye pencil"]
};

const CATEGORY_TAG_HINTS = {
  fragrances: ["perfume", "fragrance", "deodorant", "cologne", "parfum"],
  "lip-care": ["lip", "lipstick", "lip-balm", "lip-gloss", "lip-care"],
  "skin-care": ["skin-care", "body-wash", "cleanser", "moisturizer", "serum", "lotion", "face-wash", "cream"],
  "eye-makeup": ["eye-makeup", "eyeliner", "mascara", "eyeshadow", "kajal", "brow"]
};

const ALT_SEARCH_TERMS = {
  all: "beauty makeup skincare fragrance",
  fragrances: "perfume fragrance eau de parfum body mist deodorant",
  "lip-care": "lip balm lipstick lip gloss lip tint",
  "skin-care": "skin care cleanser moisturizer serum body wash",
  "eye-makeup": "eyeliner mascara kajal eyeshadow brow pencil"
};

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

function primaryCategoryKey(product) {
  const order = ["fragrances", "lip-care", "skin-care", "eye-makeup"];
  for (const key of order) {
    if (categoryMatch(product, key)) return key;
  }
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
  const categoriesTags = Array.isArray(rawProduct.categories_tags) ? rawProduct.categories_tags : [];

  return {
    id: rawProduct.code || rawProduct.id || `${name}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    brand: (rawProduct.brands || "Unknown brand").split(",")[0].trim(),
    categories: rawProduct.categories || "",
    categoriesTags,
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

function ingredientMatch(text, key) {
  if (key === "bha" || key === "bht") {
    return new RegExp(`\\b${key}\\b`).test(text);
  }
  return text.includes(key);
}

function analyzeProduct(product) {
  let bodyScore = 88;
  let ecoScore = 76;
  const risks = [];
  const positives = [];

  const text = product.searchableIngredients;
  for (const risk of RISK_INGREDIENTS) {
    if (ingredientMatch(text, risk.key)) {
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

function rankAlternativeCandidates(selectedAnalysis, analyses, categoryKey) {
  const selectedBrand = selectedAnalysis.product.brand.toLowerCase();
  const selectedKey = analysisKey(selectedAnalysis);

  const ranked = analyses
    .filter((analysis) => analysisKey(analysis) !== selectedKey)
    .filter((analysis) => categoryKey === "all" || categoryMatch(analysis.product, categoryKey))
    .map((analysis) => {
      const delta = analysis.overallScore - selectedAnalysis.overallScore;
      const differentBrand = analysis.product.brand.toLowerCase() !== selectedBrand;
      const rankValue =
        analysis.overallScore +
        (differentBrand ? 4 : 0) +
        (delta > 0 ? delta * 0.45 : delta * 0.12) +
        analysis.confidence * 0.03;

      return {
        analysis,
        delta,
        differentBrand,
        rankValue
      };
    })
    .sort((a, b) => b.rankValue - a.rankValue);

  const cleaner = ranked.filter((entry) => entry.delta >= 1).slice(0, 3);
  if (cleaner.length >= 3) return cleaner;

  const picked = [...cleaner];
  for (const entry of ranked) {
    if (picked.some((p) => analysisKey(p.analysis) === analysisKey(entry.analysis))) continue;
    picked.push(entry);
    if (picked.length === 3) break;
  }
  return picked;
}

async function fetchBroaderAlternatives(selectedAnalysis, categoryKey) {
  const cacheKey = categoryKey;
  if (state.alternativeCache[cacheKey]) {
    return state.alternativeCache[cacheKey];
  }

  const selectedNameHint = selectedAnalysis.product.name.split(" ").slice(0, 2).join(" ");
  const query = ALT_SEARCH_TERMS[categoryKey] || `${selectedNameHint} beauty`;
  const rows = await fetchProducts(query, 50, 2);
  const analyses = rows
    .map(normalizeProduct)
    .filter(Boolean)
    .filter((product) => categoryKey === "all" || categoryMatch(product, categoryKey))
    .map(analyzeProduct);

  const deduped = uniqueAnalyses(analyses);
  state.alternativeCache[cacheKey] = deduped;
  return deduped;
}

async function renderAlternatives(selectedAnalysis, allAnalyses) {
  const requestId = ++state.alternativeRequestId;
  refs.alternativesGrid.innerHTML = `<p class="empty-state">Scanning for cleaner alternatives...</p>`;

  const categoryKey = primaryCategoryKey(selectedAnalysis.product);
  let ranked = rankAlternativeCandidates(selectedAnalysis, uniqueAnalyses(allAnalyses), categoryKey);

  if (ranked.length < 3) {
    try {
      const broader = await fetchBroaderAlternatives(selectedAnalysis, categoryKey);
      if (requestId !== state.alternativeRequestId) return;
      ranked = rankAlternativeCandidates(selectedAnalysis, uniqueAnalyses([...allAnalyses, ...broader]), categoryKey);
    } catch (error) {
      if (requestId !== state.alternativeRequestId) return;
    }
  }

  const alternatives = ranked.slice(0, 3);
  if (!alternatives.length) {
    refs.alternativesGrid.innerHTML = `<p class="empty-state">No alternatives were found yet. Try a broader product or category search.</p>`;
    return;
  }

  refs.alternativesGrid.innerHTML = alternatives
    .map(({ analysis, delta, differentBrand }) => {
      const badge = delta >= 1 ? `Cleaner +${delta}` : differentBrand ? "Similar Option" : "Alternative";
      return `
      <article class="alt-card">
        <h3>${escapeHtml(analysis.product.name)}</h3>
        <p>${escapeHtml(analysis.product.brand)}</p>
        <span class="alt-badge">${badge} · Score ${analysis.overallScore}</span>
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
        <span class="match-score">Score ${entry.overallScore}</span>
      </button>
    `
    )
    .join("");
}

function renderSelectedAnalysis(analysis, allAnalyses) {
  state.selectedId = analysis.product.id;
  renderProduct(analysis);
  renderScores(analysis);
  renderInsightLists(analysis);
  renderAlternatives(analysis, allAnalyses);
  renderMatches(allAnalyses, analysis.product.id);
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
  refs.matchesGrid.innerHTML = `<p class="empty-state">Your matching products will appear here after search.</p>`;
  refs.riskList.innerHTML = "";
  refs.goodList.innerHTML = "";
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

async function fetchProducts(query, pageSize = 30, pages = 1) {
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
        "code,id,product_name,brands,categories,categories_tags,ingredients_text,ingredients_text_en,ingredients_tags,ecoscore_grade,image_front_url,image_url,url,labels_tags,packaging_tags"
    });

    const response = await fetch(`${API_BASE}?${params.toString()}`);
    if (!response.ok) throw new Error("Unable to fetch product records.");
    const payload = await response.json();
    const rows = Array.isArray(payload.products) ? payload.products : [];

    for (const row of rows) {
      const code = row.code || row.id || `${row.product_name || ""}-${Math.random()}`;
      if (!seenCodes.has(code)) {
        seenCodes.add(code);
        allProducts.push(row);
      }
    }
  }

  return allProducts;
}

async function loadSuggestions(query) {
  if (query.trim().length < 2) {
    refs.suggestions.classList.add("hidden");
    return;
  }

  try {
    const rows = await fetchProducts(query, 20, 1);
    const list = rows
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
    const rows = await fetchProducts(query, 50, 2);
    const products = rows
      .map(normalizeProduct)
      .filter(Boolean)
      .filter(matchesActiveCategory);

    if (!products.length) {
      setStatus("No matching beauty products found. Try another spelling or wider term.");
      renderEmptyState("No matching beauty products found yet.");
      return;
    }

    const analyses = uniqueAnalyses(products.map(analyzeProduct));

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

    state.lastAnalyses = analyses;
    const selected = analyses[0];
    renderSelectedAnalysis(selected, analyses);
    renderFunFact(state.factType);
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
  renderFunFact("quick");
  setupEvents();
  window.setInterval(() => {
    renderFunFact(state.factType);
  }, 12000);
}

init();
