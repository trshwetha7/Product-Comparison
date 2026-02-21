import math
import random
import re
from typing import Any, Dict, List, Set, Tuple

import httpx

API_BASE = "https://world.openbeautyfacts.org/cgi/search.pl"
MAKEUP_API_BASE = "https://makeup-api.herokuapp.com/api/v1/products.json"

CATEGORY_KEYWORDS = {
    "all": [],
    "fragrances": ["perfume", "fragrance", "deodorant", "cologne", "eau de", "body mist", "parfum"],
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
        "spf",
    ],
    "eye-makeup": ["eyeliner", "mascara", "eyeshadow", "eye shadow", "brow", "kajal", "eye pencil"],
}

CATEGORY_TAG_HINTS = {
    "fragrances": ["perfume", "fragrance", "deodorant", "cologne", "parfum"],
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
        "spf",
    ],
    "eye-makeup": ["eye-makeup", "eyeliner", "mascara", "eyeshadow", "kajal", "brow"],
}

ALT_SEARCH_TERMS = {
    "all": "beauty makeup lipstick skincare fragrance clean",
    "fragrances": "perfume fragrance eau de parfum body mist deodorant",
    "lip-care": "lip balm lipstick lip gloss lip tint",
    "skin-care": "skin care cleanser moisturizer serum body wash sunscreen spf",
    "eye-makeup": "eyeliner mascara kajal eyeshadow brow pencil",
}

MAKEUP_TYPE_BY_CATEGORY = {
    "all": [],
    "fragrances": [],
    "lip-care": ["lipstick", "lip_liner"],
    "skin-care": ["foundation", "bb_cc", "concealer", "powder"],
    "eye-makeup": ["eyeliner", "eyeshadow", "mascara", "eyebrow", "pencil"],
}

CLEAN_TAG_HINTS = [
    "natural",
    "organic",
    "vegan",
    "cruelty free",
    "ecocert",
    "certclean",
    "chemical free",
    "silicone free",
    "oil free",
    "ewg verified",
]

RISK_INGREDIENTS = [
    {"key": "paraben", "penalty": 13, "note": "Parabens can act as endocrine disruptor candidates."},
    {"key": "phthalate", "penalty": 15, "note": "Phthalates are often flagged for hormone-disruption concerns."},
    {"key": "triclosan", "penalty": 16, "note": "Triclosan may impact hormones and aquatic systems."},
    {"key": "oxybenzone", "penalty": 17, "note": "Oxybenzone is linked to coral and hormone concerns."},
    {"key": "octinoxate", "penalty": 15, "note": "Octinoxate may harm reefs and show hormonal activity."},
    {"key": "formaldehyde", "penalty": 18, "note": "Formaldehyde and releasers are higher-risk irritants."},
    {"key": "dmdm hydantoin", "penalty": 16, "note": "DMDM hydantoin is a formaldehyde-releasing preservative."},
    {"key": "quaternium-15", "penalty": 16, "note": "Quaternium-15 is a formaldehyde-releasing preservative."},
    {"key": "imidazolidinyl urea", "penalty": 14, "note": "Imidazolidinyl urea can release formaldehyde."},
    {"key": "diazolidinyl urea", "penalty": 14, "note": "Diazolidinyl urea can release formaldehyde."},
    {"key": "bha", "penalty": 10, "note": "BHA may be irritating and debated for long-term use."},
    {"key": "bht", "penalty": 9, "note": "BHT has mixed safety signals in long-term exposure studies."},
    {"key": "sodium lauryl sulfate", "penalty": 8, "note": "SLS can be harsh for sensitive skin."},
    {"key": "sodium laureth sulfate", "penalty": 7, "note": "SLES may irritate some skin types."},
    {"key": "peg-", "penalty": 7, "note": "PEG ingredients can raise contamination/process concerns."},
    {"key": "fragrance", "penalty": 7, "note": "Fragrance mixes can hide allergens and sensitizers."},
    {"key": "parfum", "penalty": 7, "note": "Parfum is broad and can include sensitizing compounds."},
    {"key": "polyethylene", "penalty": 8, "note": "Polyethylene can indicate microplastic-linked ingredients."},
    {"key": "polypropylene", "penalty": 7, "note": "Polypropylene contributes to persistence concerns."},
    {"key": "nylon-12", "penalty": 8, "note": "Nylon polymers can increase microplastic footprint."},
    {"key": "acrylates copolymer", "penalty": 8, "note": "Acrylate polymers are tied to environmental persistence."},
]

ENDOCRINE_RISK_KEYS = ["paraben", "phthalate", "triclosan", "oxybenzone", "octinoxate", "bha", "bht"]
ENVIRONMENT_RISK_KEYS = [
    "polyethylene",
    "polypropylene",
    "nylon-12",
    "acrylates copolymer",
    "oxybenzone",
    "octinoxate",
    "triclosan",
]
HIGH_IRRITANT_KEYS = [
    "formaldehyde",
    "dmdm hydantoin",
    "quaternium-15",
    "imidazolidinyl urea",
    "diazolidinyl urea",
    "sodium lauryl sulfate",
    "sodium laureth sulfate",
]

MODEL_WEIGHTS = {
    "bodyPct": 1.35,
    "ecoPct": 1.2,
    "cleanPct": 1.45,
    "hazardPct": -1.6,
    "endocrinePct": -1.45,
    "ecoRiskPct": -1.2,
    "irritantPct": -0.95,
    "positivePct": 0.9,
    "confidencePct": 0.7,
}

BENEFICIAL_INGREDIENTS = [
    "hyaluronic acid",
    "niacinamide",
    "ceramide",
    "glycerin",
    "squalane",
    "aloe vera",
    "panthenol",
    "vitamin e",
    "green tea",
    "zinc oxide",
]

ECO_LABEL_SIGNALS = ["organic", "ecocert", "fair trade", "cruelty free", "vegan", "recyclable", "fsc"]

FUN_FACTS = {
    "quick": [
        "Refillable beauty packaging can reduce packaging waste by up to 70% across repeated purchases.",
        "Using one multi-purpose product can reduce both waste and overconsumption.",
        "Picking concentrated formulas often cuts water-heavy packaging and transport weight.",
        "Choosing larger refill packs usually lowers plastic use per milliliter.",
        "Ingredient transparency helps shoppers avoid repeated trial-and-error purchases.",
    ],
    "eco": [
        "Choosing refill packs and recycled-material bottles lowers lifecycle plastic demand.",
        "Microplastic-linked polymers can persist for years, so polymer-free formulas matter.",
        "Cruelty-free + transparent sourcing labels make eco-comparisons easier.",
        "Recyclable mono-material packaging is easier to process than mixed plastics.",
        "Buying only what you can finish is one of the most sustainable beauty habits.",
    ],
    "body": [
        "Fragrance-free options can be gentler for reactive or sensitized skin barriers.",
        "Shorter ingredient lists can make sensitivity tracking and patch-testing easier.",
        "Barrier-supporting ingredients like ceramides and glycerin can improve tolerance.",
        "Patch-testing new products can prevent unnecessary irritation and waste.",
        "Lower-irritant formulas can support long-term skin comfort for sensitive users.",
    ],
}


def clamp(value: float, min_value: float, max_value: float) -> float:
    return min(max_value, max(min_value, value))


def sigmoid(value: float) -> float:
    return 1 / (1 + math.exp(-value))


def category_terms(category: str) -> List[str]:
    return list(CATEGORY_KEYWORDS.get(category, [])) + list(CATEGORY_TAG_HINTS.get(category, []))


def category_blob(product: Dict[str, Any]) -> str:
    tags = " ".join(product.get("categoriesTags", []) if isinstance(product.get("categoriesTags"), list) else [])
    return f"{product.get('name', '')} {product.get('categories', '')} {tags}".lower()


def category_match(product: Dict[str, Any], category: str) -> bool:
    if category == "all":
        return True
    blob = category_blob(product)
    return any(term in blob for term in category_terms(category))


def category_label(product: Dict[str, Any]) -> str:
    if category_match(product, "fragrances"):
        return "Fragrances"
    if category_match(product, "lip-care"):
        return "Lip Care"
    if category_match(product, "eye-makeup"):
        return "Eye Makeup"
    if category_match(product, "skin-care"):
        return "Skin Care"
    return "Beauty"


def primary_category_key(product: Dict[str, Any]) -> str:
    for key in ["fragrances", "lip-care", "skin-care", "eye-makeup"]:
        if category_match(product, key):
            return key
    return "all"


def category_from_text(text: str) -> str:
    probe = {"name": text or "", "categories": "", "categoriesTags": []}
    for key in ["fragrances", "lip-care", "skin-care", "eye-makeup"]:
        if category_match(probe, key):
            return key
    return "all"


def resolve_alternative_category(product: Dict[str, Any], query: str, active_category: str) -> str:
    from_product = primary_category_key(product)
    if from_product != "all":
        return from_product
    from_query = category_from_text(query)
    if from_query != "all":
        return from_query
    if active_category != "all":
        return active_category
    return "all"


def safe_url(raw_url: str) -> str:
    if not raw_url or not isinstance(raw_url, str):
        return ""
    if raw_url.startswith("http://") or raw_url.startswith("https://"):
        return raw_url
    return ""


def is_likely_product_image(url: str) -> bool:
    if not url:
        return False
    lower = url.lower()
    blocked_hints = ["qr", "barcode", "datamatrix", "code-", "ingredients", "nutrition"]
    return not any(hint in lower for hint in blocked_hints)


def pick_best_image(candidates: List[str]) -> str:
    safe_candidates = [safe_url(value) for value in candidates if safe_url(value)]
    for candidate in safe_candidates:
        if is_likely_product_image(candidate):
            return candidate
    return safe_candidates[0] if safe_candidates else ""


def query_tokens(query: str) -> List[str]:
    return [term.strip() for term in re.split(r"[^a-z0-9]+", (query or "").lower()) if len(term.strip()) >= 2]


def token_set(text: str) -> Set[str]:
    return {
        token.strip()
        for token in re.split(r"[^a-z0-9]+", (text or "").lower())
        if len(token.strip()) >= 3
    }


def jaccard_similarity(set_a: Set[str], set_b: Set[str]) -> float:
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a.intersection(set_b))
    union = len(set_a.union(set_b))
    return (intersection / union) if union else 0.0


def percentile(values: List[float], value: float) -> float:
    if not values:
        return 0.5
    sorted_values = sorted(values)
    count = sum(1 for current in sorted_values if current <= value)
    return clamp(count / len(sorted_values), 0, 1)


def has_clean_tag(tags: List[str]) -> bool:
    blob = " ".join(tags or []).lower()
    return any(hint in blob for hint in CLEAN_TAG_HINTS)


def normalize_open_beauty_product(raw_product: Dict[str, Any]) -> Dict[str, Any] | None:
    name = (raw_product.get("product_name") or "").strip()
    if not name:
        return None

    ingredients_text = (
        raw_product.get("ingredients_text_en")
        or raw_product.get("ingredients_text")
        or ""
    ).strip()

    ingredients_tags = raw_product.get("ingredients_tags") if isinstance(raw_product.get("ingredients_tags"), list) else []
    ingredients_tags_text = " ".join(ingredients_tags)

    packaging = raw_product.get("packaging_tags") if isinstance(raw_product.get("packaging_tags"), list) else []
    labels = raw_product.get("labels_tags") if isinstance(raw_product.get("labels_tags"), list) else []
    categories_tags = raw_product.get("categories_tags") if isinstance(raw_product.get("categories_tags"), list) else []

    image_candidates = [
        raw_product.get("image_front_url") or "",
        raw_product.get("image_url") or "",
        raw_product.get("image_front_small_url") or "",
        raw_product.get("image_small_url") or "",
    ]

    code = raw_product.get("code") or raw_product.get("id") or f"obf-{random.randint(100000, 999999)}"
    brands = (raw_product.get("brands") or "Unknown brand").split(",")[0].strip()

    return {
        "id": str(code),
        "name": name,
        "brand": brands,
        "categories": raw_product.get("categories") or "",
        "categoriesTags": categories_tags,
        "ingredientsText": ingredients_text,
        "searchableIngredients": f"{ingredients_text} {ingredients_tags_text}".lower(),
        "ecoGrade": (raw_product.get("ecoscore_grade") or "").lower(),
        "packaging": packaging,
        "labels": labels,
        "imageUrl": pick_best_image(image_candidates),
        "sourceUrl": raw_product.get("url") or f"https://world.openbeautyfacts.org/product/{code}",
        "source": "open_beauty_facts",
        "cleanTagBoost": has_clean_tag(labels),
    }


def normalize_makeup_product(raw_product: Dict[str, Any]) -> Dict[str, Any] | None:
    name = (raw_product.get("name") or "").strip()
    if not name:
        return None

    tag_list = raw_product.get("tag_list") if isinstance(raw_product.get("tag_list"), list) else []
    brand = (raw_product.get("brand") or "Unknown brand").strip()
    product_type = (raw_product.get("product_type") or "").replace("_", " ")
    product_category = (raw_product.get("category") or "").replace("_", " ")

    categories_tags = [product_type, product_category, *tag_list]
    categories_tags = [str(value).lower().strip() for value in categories_tags if str(value).strip()]

    ingredient_list = (raw_product.get("ingredient_list") or "").strip()
    labels = [f"en:{str(tag).lower()}" for tag in tag_list]
    image_candidates = [raw_product.get("api_featured_image") or "", raw_product.get("image_link") or ""]

    raw_id = raw_product.get("id")
    product_id = f"makeup-{raw_id}" if raw_id is not None else f"makeup-{random.randint(100000, 999999)}"

    return {
        "id": product_id,
        "name": name,
        "brand": brand,
        "categories": ", ".join([value for value in [product_type, product_category] if value]),
        "categoriesTags": categories_tags,
        "ingredientsText": ingredient_list,
        "searchableIngredients": f"{ingredient_list} {' '.join(tag_list)}".lower(),
        "ecoGrade": "",
        "packaging": [],
        "labels": labels,
        "imageUrl": pick_best_image(image_candidates),
        "sourceUrl": raw_product.get("product_link") or raw_product.get("website_link") or "",
        "source": "makeup_api",
        "cleanTagBoost": has_clean_tag([str(tag) for tag in tag_list]),
    }


def eco_grade_to_score(grade: str) -> float | None:
    mapping = {"a": 100, "b": 82, "c": 60, "d": 36, "e": 15}
    return mapping.get(grade)


def ingredient_match(text: str, key: str) -> bool:
    if key in {"bha", "bht"}:
        return re.search(rf"\\b{re.escape(key)}\\b", text or "") is not None
    return key in (text or "")


def matched_risk_count(risks: List[Dict[str, Any]], keys: List[str]) -> int:
    return sum(1 for risk in risks if any(key in risk["key"] for key in keys))


def risk_severity(risks: List[Dict[str, Any]], keys: List[str]) -> float:
    return sum(risk["penalty"] for risk in risks if any(key in risk["key"] for key in keys))


def analysis_key(analysis: Dict[str, Any]) -> str:
    product = analysis["product"]
    fallback = f"{product['name'].lower()}::{product['brand'].lower()}"
    return f"{product['id']}::{fallback}" if product.get("id") else fallback


def unique_products(products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    output = []
    seen = set()
    for product in products:
        key = f"{product.get('name', '').lower()}::{product.get('brand', '').lower()}"
        if key in seen:
            continue
        seen.add(key)
        output.append(product)
    return output


def unique_analyses(analyses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    output = []
    seen = set()
    for analysis in analyses:
        key = analysis_key(analysis)
        if key in seen:
            continue
        seen.add(key)
        output.append(analysis)
    return output


def infer_makeup_types_from_query(query: str) -> List[str]:
    q = (query or "").lower()
    matches: List[str] = []
    if "lip" in q:
        matches.extend(["lipstick", "lip_liner"])
    if any(term in q for term in ["eye", "liner", "mascara"]):
        matches.extend(["eyeliner", "eyeshadow", "mascara"])
    if "brow" in q:
        matches.append("eyebrow")
    if "foundation" in q or "concealer" in q:
        matches.extend(["foundation", "concealer"])
    return list(dict.fromkeys(matches))


def makeup_relevance(raw_product: Dict[str, Any], query: str) -> float:
    q = (query or "").lower().strip()
    tokens = query_tokens(query)
    name = (raw_product.get("name") or "").lower()
    brand = (raw_product.get("brand") or "").lower()
    product_type = (raw_product.get("product_type") or "").lower()
    category = (raw_product.get("category") or "").lower()

    points = 0.0
    if q and (q in name or q in brand):
        points += 9.0
    for token in tokens:
        if token in name:
            points += 2.5
        if token in brand:
            points += 2.0
        if token in product_type or token in category:
            points += 1.3
    return points


def relevance_score(product: Dict[str, Any], query: str, active_category: str = "all") -> float:
    q = (query or "").strip().lower()
    if not q:
        return 0.0

    product_name = (product.get("name") or "").lower()
    brand_name = (product.get("brand") or "").lower()
    categories = (product.get("categories") or "").lower()
    category_tags = " ".join(product.get("categoriesTags", []) if isinstance(product.get("categoriesTags"), list) else []).lower()
    tokens = query_tokens(query)

    points = 0.0
    if product_name == q:
        points += 24
    elif product_name.startswith(q):
        points += 18
    elif q in product_name:
        points += 12

    if brand_name == q:
        points += 18
    elif brand_name.startswith(q):
        points += 14
    elif q in brand_name:
        points += 9

    if q in categories or q in category_tags:
        points += 7

    token_hits = 0.0
    for token in tokens:
        if token in product_name:
            token_hits += 1.8
        if token in brand_name:
            token_hits += 1.5
        if token in categories or token in category_tags:
            token_hits += 1.1
    points += token_hits * 3.4

    if active_category != "all" and category_match(product, active_category):
        points += 4

    return points


def fetch_open_beauty_products(query: str, page_size: int = 30, pages: int = 1) -> List[Dict[str, Any]]:
    all_products: List[Dict[str, Any]] = []
    seen_codes: Set[str] = set()

    with httpx.Client(timeout=16.0) as client:
        for page in range(1, pages + 1):
            params = {
                "search_terms": query,
                "search_simple": "1",
                "action": "process",
                "json": "1",
                "page_size": str(page_size),
                "page": str(page),
                "fields": "code,id,product_name,brands,categories,categories_tags,ingredients_text,ingredients_text_en,ingredients_tags,ecoscore_grade,image_front_url,image_front_small_url,image_url,image_small_url,url,labels_tags,packaging_tags",
            }
            try:
                response = client.get(API_BASE, params=params)
                response.raise_for_status()
                payload = response.json()
            except Exception:
                continue

            rows = payload.get("products") if isinstance(payload, dict) else []
            if not isinstance(rows, list):
                continue

            for row in rows:
                code = str(row.get("code") or row.get("id") or f"{row.get('product_name', '')}-{random.randint(1000, 9999)}")
                if code in seen_codes:
                    continue
                seen_codes.add(code)
                normalized = normalize_open_beauty_product(row)
                if normalized:
                    all_products.append(normalized)

    return all_products


def fetch_makeup_products(query: str, category: str = "all") -> List[Dict[str, Any]]:
    token_list = query_tokens(query)
    brand_candidate = " ".join(token_list[:2]).strip()
    first_token = token_list[0] if token_list else ""
    second_token = token_list[1] if len(token_list) > 1 else ""
    category_types = MAKEUP_TYPE_BY_CATEGORY.get(category, [])
    inferred_types = infer_makeup_types_from_query(query)
    types = list(dict.fromkeys([*category_types, *inferred_types]))[:4]

    brand_variants = [
        brand_candidate,
        brand_candidate.replace(" ", "-"),
        brand_candidate.replace(" ", ""),
        first_token,
        second_token,
        " ".join(token_list[:3]).strip(),
    ]
    brand_variants = [value.strip() for value in brand_variants if value and value.strip()]

    request_urls: List[str] = []
    seen_brand_variants: Set[str] = set()
    for brand in brand_variants:
        if brand in seen_brand_variants:
            continue
        seen_brand_variants.add(brand)
        request_urls.append(f"{MAKEUP_API_BASE}?brand={httpx.QueryParams({'x': brand})['x']}")
    for product_type in types:
        request_urls.append(f"{MAKEUP_API_BASE}?product_type={httpx.QueryParams({'x': product_type})['x']}")
    if not request_urls:
        request_urls.append(MAKEUP_API_BASE)

    merged: List[Dict[str, Any]] = []
    seen_ids: Set[str] = set()

    with httpx.Client(timeout=14.0) as client:
        for url in request_urls:
            try:
                response = client.get(url)
                if response.status_code != 200:
                    continue
                payload = response.json()
            except Exception:
                continue

            if not isinstance(payload, list):
                continue

            for row in payload:
                row_id = row.get("id")
                stable_id = f"makeup-{row_id}" if row_id is not None else f"{row.get('name', '')}-{row.get('brand', '')}"
                if stable_id in seen_ids:
                    continue
                seen_ids.add(stable_id)
                merged.append(row)

    scored = [
        {"row": row, "score": makeup_relevance(row, query)}
        for row in merged
    ]
    scored = [item for item in scored if item["score"] > 1.3]
    scored.sort(key=lambda item: item["score"], reverse=True)

    output = []
    for item in scored[:120]:
        normalized = normalize_makeup_product(item["row"])
        if normalized:
            output.append(normalized)

    return output


def fetch_products(query: str, page_size: int = 40, pages: int = 2, category: str = "all") -> List[Dict[str, Any]]:
    open_beauty_products = fetch_open_beauty_products(query, page_size, pages)
    makeup_products = fetch_makeup_products(query, category)
    return unique_products([*open_beauty_products, *makeup_products])


def analyze_product(product: Dict[str, Any]) -> Dict[str, Any]:
    body_score = 96.0
    eco_score = 92.0
    risks: List[Dict[str, Any]] = []
    positives: List[str] = []

    text = product.get("searchableIngredients", "")
    for risk in RISK_INGREDIENTS:
        if ingredient_match(text, risk["key"]):
            risks.append(risk)
            body_penalty = risk["penalty"] * 1.08
            eco_penalty = risk["penalty"] * 0.58

            if any(key in risk["key"] for key in ENDOCRINE_RISK_KEYS):
                body_penalty += 6
                eco_penalty += 3
            if any(key in risk["key"] for key in ENVIRONMENT_RISK_KEYS):
                eco_penalty += 8
            if any(key in risk["key"] for key in HIGH_IRRITANT_KEYS):
                body_penalty += 4
            if risk["key"] in {"fragrance", "parfum"}:
                body_penalty += 2.5
                eco_penalty += 1.2

            body_score -= body_penalty
            eco_score -= eco_penalty

    seen_positive: Set[str] = set()
    for ingredient in BENEFICIAL_INGREDIENTS:
        if ingredient in text and ingredient not in seen_positive:
            positives.append(ingredient)
            seen_positive.add(ingredient)

    body_score += min(10, len(positives) * 2.2)
    eco_score += min(7, len(positives) * 1.2)

    ingredients_text = product.get("ingredientsText", "")
    if not ingredients_text:
        body_score -= 22
        eco_score -= 12
    elif len(ingredients_text) < 20:
        body_score -= 8
        eco_score -= 4

    eco_from_grade = eco_grade_to_score(product.get("ecoGrade", ""))
    if eco_from_grade is not None:
        eco_score = eco_from_grade
    else:
        eco_score -= 16

    if product.get("cleanTagBoost"):
        body_score += 2
        eco_score += 7

    packaging_text = " ".join(product.get("packaging", [])).lower()
    if "plastic" in packaging_text:
        eco_score -= 16
    if "single-use" in packaging_text:
        eco_score -= 8
    if "glass" in packaging_text:
        eco_score += 2
    if "aluminum" in packaging_text:
        eco_score += 6
    if "recycled" in packaging_text:
        eco_score += 10
    if "refill" in packaging_text:
        eco_score += 12

    label_text = " ".join(product.get("labels", [])).lower()
    label_bonus = sum(4 for label in ECO_LABEL_SIGNALS if label in label_text)
    eco_score += min(20, label_bonus)

    hormone_hits = matched_risk_count(risks, ENDOCRINE_RISK_KEYS)
    environment_hits = matched_risk_count(risks, ENVIRONMENT_RISK_KEYS)
    irritant_hits = matched_risk_count(risks, HIGH_IRRITANT_KEYS)
    hormone_severity = risk_severity(risks, ENDOCRINE_RISK_KEYS)
    environment_severity = risk_severity(risks, ENVIRONMENT_RISK_KEYS)
    irritant_severity = risk_severity(risks, HIGH_IRRITANT_KEYS)

    body_score -= hormone_hits * 2.5
    eco_score -= environment_hits * 2.4
    body_score -= irritant_hits * 1.5

    body_score = int(clamp(round(body_score), 1, 99))
    eco_score = int(clamp(round(eco_score), 1, 99))
    overall_score = int(round(body_score * 0.52 + eco_score * 0.48))

    clean_score = int(
        clamp(
            round(
                body_score * 0.56
                + eco_score * 0.44
                - hormone_hits * 5
                - environment_hits * 2.8
                - irritant_hits * 2.1
                - len(risks) * 1.6
                + len(positives) * 1.4
            ),
            1,
            99,
        )
    )

    hazard_score = int(
        clamp(
            round(
                hormone_severity * 1.35
                + environment_severity * 1.1
                + irritant_severity * 0.95
                + len(risks) * 4
            ),
            0,
            160,
        )
    )

    confidence = 25
    if ingredients_text:
        confidence += 35
    if product.get("ecoGrade"):
        confidence += 20
    if product.get("labels"):
        confidence += 5
    if product.get("packaging"):
        confidence += 5
    if product.get("source") == "makeup_api" and not ingredients_text:
        confidence -= 8
    confidence = int(clamp(confidence, 15, 95))

    ingredient_token_count = len(token_set(ingredients_text))
    positive_density = (len(positives) / ingredient_token_count) if ingredient_token_count else 0

    profile_tokens = token_set(f"{product.get('name', '')} {product.get('brand', '')} {product.get('categories', '')} {ingredients_text}")
    identity_tokens = token_set(f"{product.get('name', '')} {product.get('categories', '')}")

    return {
        "product": product,
        "risks": risks,
        "positives": positives,
        "hormoneHits": hormone_hits,
        "environmentHits": environment_hits,
        "irritantHits": irritant_hits,
        "hormoneSeverity": hormone_severity,
        "environmentSeverity": environment_severity,
        "irritantSeverity": irritant_severity,
        "hazardScore": hazard_score,
        "positiveDensity": positive_density,
        "profileTokens": profile_tokens,
        "identityTokens": identity_tokens,
        "bodyScore": body_score,
        "ecoScore": eco_score,
        "overallScore": overall_score,
        "cleanScore": clean_score,
        "confidence": confidence,
    }


def apply_model_ranking(analyses: List[Dict[str, Any]]) -> None:
    if not analyses:
        return

    body_values = [analysis["bodyScore"] for analysis in analyses]
    eco_values = [analysis["ecoScore"] for analysis in analyses]
    clean_values = [analysis["cleanScore"] for analysis in analyses]
    hazard_values = [analysis["hazardScore"] for analysis in analyses]
    endocrine_values = [analysis["hormoneSeverity"] for analysis in analyses]
    eco_risk_values = [analysis["environmentSeverity"] for analysis in analyses]
    irritant_values = [analysis["irritantSeverity"] for analysis in analyses]
    positive_values = [analysis["positiveDensity"] for analysis in analyses]
    confidence_values = [analysis["confidence"] for analysis in analyses]

    for analysis in analyses:
        body_pct = percentile(body_values, analysis["bodyScore"])
        eco_pct = percentile(eco_values, analysis["ecoScore"])
        clean_pct = percentile(clean_values, analysis["cleanScore"])
        hazard_pct = percentile(hazard_values, analysis["hazardScore"])
        endocrine_pct = percentile(endocrine_values, analysis["hormoneSeverity"])
        eco_risk_pct = percentile(eco_risk_values, analysis["environmentSeverity"])
        irritant_pct = percentile(irritant_values, analysis["irritantSeverity"])
        positive_pct = percentile(positive_values, analysis["positiveDensity"])
        confidence_pct = percentile(confidence_values, analysis["confidence"])

        raw_model_score = (
            body_pct * MODEL_WEIGHTS["bodyPct"]
            + eco_pct * MODEL_WEIGHTS["ecoPct"]
            + clean_pct * MODEL_WEIGHTS["cleanPct"]
            + hazard_pct * MODEL_WEIGHTS["hazardPct"]
            + endocrine_pct * MODEL_WEIGHTS["endocrinePct"]
            + eco_risk_pct * MODEL_WEIGHTS["ecoRiskPct"]
            + irritant_pct * MODEL_WEIGHTS["irritantPct"]
            + positive_pct * MODEL_WEIGHTS["positivePct"]
            + confidence_pct * MODEL_WEIGHTS["confidencePct"]
        )

        model_clean_score = int(clamp(round(sigmoid(raw_model_score * 2.25 - 2.2) * 100), 1, 99))
        model_risk_index = int(
            clamp(
                round(analysis["hazardScore"] * 0.7 + hazard_pct * 38 + endocrine_pct * 20 + eco_risk_pct * 16),
                0,
                180,
            )
        )

        analysis["modelSignals"] = {
            "bodyPct": body_pct,
            "ecoPct": eco_pct,
            "cleanPct": clean_pct,
            "hazardPct": hazard_pct,
            "endocrinePct": endocrine_pct,
            "ecoRiskPct": eco_risk_pct,
            "irritantPct": irritant_pct,
            "positivePct": positive_pct,
            "confidencePct": confidence_pct,
            "rawModelScore": raw_model_score,
        }
        analysis["modelCleanScore"] = model_clean_score
        analysis["modelRiskIndex"] = model_risk_index


def rank_alternative_candidates(
    selected_analysis: Dict[str, Any],
    analyses: List[Dict[str, Any]],
    category_key: str,
) -> List[Dict[str, Any]]:
    selected_brand = selected_analysis["product"]["brand"].lower()
    selected_key = analysis_key(selected_analysis)
    selected_risk_count = len(selected_analysis["risks"])
    selected_hormone_hits = selected_analysis.get("hormoneHits", 0)
    selected_environment_hits = selected_analysis.get("environmentHits", 0)
    selected_irritant_hits = selected_analysis.get("irritantHits", 0)
    selected_model_clean = selected_analysis.get("modelCleanScore", selected_analysis["cleanScore"])
    selected_model_risk = selected_analysis.get("modelRiskIndex", selected_analysis["hazardScore"])
    selected_tokens = selected_analysis.get("profileTokens", set())
    selected_identity_tokens = selected_analysis.get("identityTokens", token_set(selected_analysis["product"]["name"]))

    ranked: List[Dict[str, Any]] = []
    for analysis in analyses:
        if analysis_key(analysis) == selected_key:
            continue
        if category_key != "all" and not category_match(analysis["product"], category_key):
            continue

        candidate_model_clean = analysis.get("modelCleanScore", analysis["cleanScore"])
        candidate_model_risk = analysis.get("modelRiskIndex", analysis["hazardScore"])

        clean_delta = candidate_model_clean - selected_model_clean
        risk_index_reduction = selected_model_risk - candidate_model_risk
        risk_reduction = selected_risk_count - len(analysis["risks"])
        hormone_reduction = selected_hormone_hits - analysis.get("hormoneHits", 0)
        environment_reduction = selected_environment_hits - analysis.get("environmentHits", 0)
        irritant_reduction = selected_irritant_hits - analysis.get("irritantHits", 0)
        no_new_risk_flags = (
            len(analysis["risks"]) <= selected_risk_count
            and analysis.get("hormoneHits", 0) <= selected_hormone_hits
            and analysis.get("environmentHits", 0) <= selected_environment_hits
            and analysis.get("irritantHits", 0) <= selected_irritant_hits
        )

        different_brand = analysis["product"]["brand"].lower() != selected_brand
        similarity = jaccard_similarity(selected_tokens, analysis.get("profileTokens", set()))
        identity_similarity = jaccard_similarity(selected_identity_tokens, analysis.get("identityTokens", set()))

        rank_value = (
            clean_delta * 3.1
            + risk_index_reduction * 0.26
            + risk_reduction * 1.5
            + hormone_reduction * 3.9
            + environment_reduction * 2.9
            + irritant_reduction * 3.2
            + (analysis["bodyScore"] - selected_analysis["bodyScore"]) * 0.72
            + (analysis["ecoScore"] - selected_analysis["ecoScore"]) * 0.78
            + similarity * 10
            + identity_similarity * 26
            + candidate_model_clean * 0.07
            + (2 if different_brand else 0)
            + (3.5 if no_new_risk_flags else -6.5)
            + analysis["confidence"] * 0.05
        )

        ranked.append(
            {
                "analysis": analysis,
                "cleanDelta": clean_delta,
                "riskIndexReduction": risk_index_reduction,
                "riskReduction": risk_reduction,
                "hormoneReduction": hormone_reduction,
                "environmentReduction": environment_reduction,
                "irritantReduction": irritant_reduction,
                "noNewRiskFlags": no_new_risk_flags,
                "similarity": similarity,
                "identitySimilarity": identity_similarity,
                "differentBrand": different_brand,
                "rankValue": rank_value,
            }
        )

    ranked.sort(key=lambda item: item["rankValue"], reverse=True)

    compatible_ranked = [entry for entry in ranked if category_key != "all" or entry["identitySimilarity"] >= 0.12]
    safer_ranked = [
        entry
        for entry in compatible_ranked
        if entry["noNewRiskFlags"] and entry["riskIndexReduction"] >= 0 and entry["cleanDelta"] >= 0
    ]

    cleaner = [
        entry
        for entry in safer_ranked
        if (
            entry["cleanDelta"] >= 3
            or entry["riskIndexReduction"] >= 4
            or entry["riskReduction"] >= 1
            or entry["hormoneReduction"] >= 1
            or entry["environmentReduction"] >= 1
            or entry["irritantReduction"] >= 1
            or (entry["identitySimilarity"] >= 0.1 and entry["cleanDelta"] >= 1)
        )
    ][:4]

    if len(cleaner) >= 3:
        return cleaner[:3]

    picked = list(cleaner)
    seen = {analysis_key(item["analysis"]) for item in picked}
    for entry in safer_ranked:
        entry_key = analysis_key(entry["analysis"])
        if entry_key in seen:
            continue
        picked.append(entry)
        seen.add(entry_key)
        if len(picked) == 3:
            break

    return picked


def serialize_analysis(analysis: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "product": analysis["product"],
        "risks": analysis["risks"],
        "positives": analysis["positives"],
        "hormoneHits": analysis["hormoneHits"],
        "environmentHits": analysis["environmentHits"],
        "irritantHits": analysis["irritantHits"],
        "hormoneSeverity": analysis["hormoneSeverity"],
        "environmentSeverity": analysis["environmentSeverity"],
        "irritantSeverity": analysis["irritantSeverity"],
        "hazardScore": analysis["hazardScore"],
        "positiveDensity": analysis["positiveDensity"],
        "bodyScore": analysis["bodyScore"],
        "ecoScore": analysis["ecoScore"],
        "overallScore": analysis["overallScore"],
        "cleanScore": analysis["cleanScore"],
        "confidence": analysis["confidence"],
        "modelSignals": analysis.get("modelSignals", {}),
        "modelCleanScore": analysis.get("modelCleanScore", analysis["cleanScore"]),
        "modelRiskIndex": analysis.get("modelRiskIndex", analysis["hazardScore"]),
    }


def serialize_alt_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "analysisId": entry["analysis"]["product"]["id"],
        "cleanDelta": int(round(entry["cleanDelta"])),
        "riskIndexReduction": int(round(entry["riskIndexReduction"])),
        "riskReduction": int(round(entry["riskReduction"])),
        "hormoneReduction": int(round(entry["hormoneReduction"])),
        "environmentReduction": int(round(entry["environmentReduction"])),
        "irritantReduction": int(round(entry["irritantReduction"])),
        "differentBrand": bool(entry["differentBrand"]),
        "similarity": float(entry["similarity"]),
        "identitySimilarity": float(entry["identitySimilarity"]),
        "rankValue": float(entry["rankValue"]),
    }


def suggest_query(query: str, category: str = "all", limit: int = 8) -> Dict[str, Any]:
    query = (query or "").strip()
    if len(query) < 2:
        return {"items": []}

    rows = fetch_products(query, 20, 1, category)
    filtered = [product for product in rows if category_match(product, category)]

    unique: List[Dict[str, Any]] = []
    key_set: Set[str] = set()
    for item in filtered:
        key = f"{item.get('name', '').lower()}::{item.get('brand', '').lower()}"
        if key in key_set:
            continue
        key_set.add(key)
        unique.append(item)

    unique.sort(key=lambda product: relevance_score(product, query, category), reverse=True)
    items = unique[: max(1, min(limit, 12))]
    return {"items": items}


def analyze_query(query: str, category: str = "all", preferred: str = "") -> Dict[str, Any]:
    query = (query or "").strip()
    if not query:
        return {
            "analyses": [],
            "selectedId": None,
            "alternativesById": {},
            "statusText": "Enter a product name to analyze.",
        }

    rows = fetch_products(query, 60, 3, category)
    products = [product for product in rows if category_match(product, category)]

    if not products:
        return {
            "analyses": [],
            "selectedId": None,
            "alternativesById": {},
            "statusText": "No matching beauty products found. Try another spelling or wider term.",
        }

    analyses = unique_analyses([analyze_product(product) for product in products])
    apply_model_ranking(analyses)

    preferred_lower = (preferred or "").lower()

    def ranked_value(analysis: Dict[str, Any]) -> float:
        preferred_boost = 6 if preferred_lower and preferred_lower in analysis["product"]["name"].lower() else 0
        model_clean = analysis.get("modelCleanScore", analysis["cleanScore"])
        model_risk = analysis.get("modelRiskIndex", analysis["hazardScore"])
        return (
            relevance_score(analysis["product"], query, category) * 1.05
            + model_clean * 0.58
            - model_risk * 0.045
            + analysis["confidence"] * 0.12
            + preferred_boost
        )

    analyses.sort(key=ranked_value, reverse=True)

    alternatives_by_id: Dict[str, List[Dict[str, Any]]] = {}
    for selected_analysis in analyses:
        category_key = resolve_alternative_category(selected_analysis["product"], query, category)
        ranked = rank_alternative_candidates(selected_analysis, analyses, category_key)[:3]
        alternatives_by_id[selected_analysis["product"]["id"]] = [serialize_alt_entry(item) for item in ranked]

    serialized_analyses = [serialize_analysis(analysis) for analysis in analyses]
    selected_id = analyses[0]["product"]["id"]

    makeup_count = sum(1 for analysis in analyses if analysis["product"].get("source") == "makeup_api")
    obf_count = len(analyses) - makeup_count

    return {
        "analyses": serialized_analyses,
        "selectedId": selected_id,
        "alternativesById": alternatives_by_id,
        "statusText": f"Analyzed {len(analyses)} products ({obf_count} Open Beauty Facts + {makeup_count} Makeup API).",
    }


def next_fact(fact_type: str, previous: str = "") -> Dict[str, str]:
    if fact_type == "random":
        pool = [*FUN_FACTS["quick"], *FUN_FACTS["eco"], *FUN_FACTS["body"]]
    else:
        pool = FUN_FACTS.get(fact_type, FUN_FACTS["quick"])

    if not pool:
        return {"fact": ""}

    if len(pool) == 1:
        return {"fact": pool[0]}

    filtered = [item for item in pool if item != previous]
    choice_pool = filtered or pool
    return {"fact": random.choice(choice_pool)}
