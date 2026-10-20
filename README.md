# Pantheon — Global Intelligence Feed

AI-powered news dashboard with a 3D globe.

## Quick start

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Stack

- **React 18** + **Vite**
- **Three.js** — 3D globe with WebGL renderer
- **world-atlas** — real country outlines fetched from CDN on first load

## Project structure

```
src/
  App.jsx              # Root layout + shared state (activeRegion)
  styles.css           # All CSS variables and component styles
  main.jsx             # ReactDOM entry point
  data/
    news.js            # Fake news articles (replace with real API)
  utils/
    geo.js             # TopoJSON decoder + equirectangular renderer + texture builder
  components/
    Globe.jsx          # Three.js globe (useEffect mount, ResizeObserver, raycaster)
    Header.jsx         # Logo + live UTC clock
    LeftPanel.jsx      # News feed by category with live-bump animation
    RightPanel.jsx     # News feed sorted by importance score
    NewsItem.jsx       # Individual article card
    Ticker.jsx         # Scrolling breaking-news ticker
```

## Swapping in real data

Replace the `NEWS` array in `src/data/news.js` with your API response.
Each article needs: `id`, `headline`, `summary`, `category`, `region`, `lat`, `lon`, `importance` (1-10), `level` (breaking/high/medium/low), `source`, `time`.
