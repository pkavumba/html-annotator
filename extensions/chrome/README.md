# HTML Annotator Chrome extension

This is a Manifest V3 Chrome extension package for HTML-Annotator. It loads
the annotation UI on webpages only after the toolbar action is clicked and
stores annotations in `chrome.storage.local`, keyed by page URL.

## Build

From the repository root:

```sh
npm run install:chrome
npm run build:chrome
```

The extension package depends on the checked-out library, so the root install
must be completed first. Then, from this directory, you can install only the
extension build dependency and build it:

```sh
npm --prefix ../.. ci
npm ci
npm run build
```

The build writes `dist/content.js`. The `dist` directory is generated and is
not committed.

## Load locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this `extensions/chrome` directory.
5. Open a normal webpage and click the extension toolbar action.

The extension cannot run on Chrome-internal pages such as `chrome://extensions`
or the Chrome Web Store.
