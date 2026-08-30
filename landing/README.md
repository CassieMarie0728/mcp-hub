# MCP Hub website

This directory is the static GitHub Pages site for MCP Hub.

## Pages

- `index.html` — landing page, product preview, FAQ, and open-source CTA
- `docs.html` — practical setup, connection, execution, status, and troubleshooting guide
- `demos.html` — directory for the three interactive product previews
- `demo-*.html` — self-contained browser demos
- `404.html` — branded missing-page fallback

Shared styles, behavior, images, and the favicon live in `assets/`. Keep internal links relative so the site works beneath the GitHub Pages `/mcp-hub/` project path.

## Preview locally

```bash
python -m http.server 4173 --directory landing
```

Open `http://127.0.0.1:4173/`.

## Deployment

`.github/workflows/static.yml` publishes this directory to GitHub Pages after a change beneath `landing/` reaches `main`. The repository intentionally uses one Pages deployment workflow to avoid concurrent deployments fighting over the same environment.
