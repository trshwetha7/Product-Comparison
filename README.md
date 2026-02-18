# GlowKind - Clean Beauty Finder

GlowKind is a pastel-themed beauty sustainability app that helps you:

- Search products with typeahead suggestions
- Filter by category (`Fragrances`, `Lip Care`, `Skin Care`, `Eye Makeup`)
- Get estimated `Overall`, `Body Friendly`, and `Eco Friendly` scores
- See ingredient watch-outs (including possible endocrine-disruptor signals)
- Discover cleaner alternatives when available in the same search results
- Read a rotating sustainability fun snippet

The app pulls live product data from [Open Beauty Facts](https://world.openbeautyfacts.org/).

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- Open Beauty Facts API (public, open-source data)

## Run Locally

From the project folder:

```bash
python3 -m http.server 5173
```

Then open:

[http://localhost:5173](http://localhost:5173)

## Deploy to Vercel

1. Push this project to GitHub.
2. In Vercel, click **Add New Project** and import your repository.
3. Framework preset: **Other** (static site).
4. Build command: leave empty.
5. Output directory: leave empty (root).
6. Deploy.

## Push to GitHub (if needed)

```bash
git init
git add .
git commit -m "Create GlowKind clean beauty app"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Notes

- Scores are heuristic estimates from available public data, not medical advice.
- Some products may have incomplete ingredient disclosures, lowering confidence.
