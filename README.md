# GlowKind - Clean Beauty Finder

GlowKind is a pastel-themed beauty sustainability app that helps you:

- Search products with typeahead suggestions
- Filter by category (`Fragrances`, `Lip Care`, `Skin Care`, `Eye Makeup`)
- Get estimated `Overall`, `Body Friendly`, and `Eco Friendly` scores
- See ingredient watch-outs (including possible endocrine-disruptor signals)
- Discover cleaner alternatives in the same product category, filtered to avoid additional risk flags
- Read a rotating sustainability fun snippet

The app pulls live product data from [Open Beauty Facts](https://world.openbeautyfacts.org/) and Makeup API.

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- Open Beauty Facts API (public, open-source data)
- Makeup API (open product catalog)
- In-browser weighted scoring/ranking model (ML-style feature weighting + percentile normalization, no external LLM dependency at runtime)

## Scoring Method

- `Body Friendly` score: starts from a baseline, then applies penalties for flagged risk ingredients (endocrine, irritant, preservative risk) and bonuses for beneficial ingredients.
- `Eco Friendly` score: combines ingredient and packaging signals (microplastic-linked ingredients, eco labels, packaging tags, eco grade when available).
- `Clean Score`: blended body+eco score with extra penalties for risk flags and bonuses for positive markers.
- `Risk Index`: severity-oriented aggregate based on risk count and weighted risk families.
- `Model Ranking`: percentile-normalized feature model used to compare candidates and prioritize alternatives with stronger clean/risk profiles.

## Alternative Selection Rules

- Alternatives are restricted to the same product category scope.
- Alternatives are filtered to prevent introducing extra risk flags versus the selected product.
- If no safer-or-equal candidate is found in current data, the app shows no cleaner alternative instead of forcing a worse match.


## Notes

- Scores are data-driven heuristic estimates from available public data, not medical advice.
- Some products may have incomplete ingredient disclosures, lowering confidence.
