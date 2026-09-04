# chord_formatter_v2
Application to format and key change chord sheets

## Environment Setup

1. Install Node.js from https://nodejs.org/en
2. Run `npm install`

## Development

Run `npm run dev` and open the URL printed by Vite.

## Production Build

Run `npm run build` to create the deployable files in `dist/`.

## Unit Testing

Run `npm test`.

The application is a browser-based Vite app. DOCX files are generated client-side, configuration is stored in `localStorage`, and example/configuration data is bundled as browser assets.

## Offline Installation

The production build is a Progressive Web App. Open the published site once while online, then use the browser's **Install** or **Add to Home Screen** option. After the first successful load, the app shell and generated assets are cached for offline use.

DOCX generation works offline because it runs entirely in the browser. Configuration changes remain available through `localStorage` on the installed browser/device.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and deploys the app automatically whenever changes are pushed to `main`.

To enable it in GitHub:

1. Open the repository's **Settings** page.
2. Select **Pages** under **Code and automation**.
3. Set **Source** to **GitHub Actions**.
4. Push changes to `main` or run the **Deploy Vite app to GitHub Pages** workflow manually.

For this repository, the published site will be available at:

`https://andowt.github.io/awmt-chord-formatter/`