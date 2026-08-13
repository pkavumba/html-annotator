import * as annotator from "html-annotator/browser";
import { chromeStorage } from "./storage.js";

let app = null;

async function enable() {
  if (app) {
    return;
  }

  app = new annotator.App()
    .include(annotator.ui.main, {
      element: document.body,
      viewerExtensions: [annotator.ui.markdown.viewerExtension],
    })
    .include(chromeStorage);

  await app.start();
  await app.annotations.load({ uri: window.location.href });
}

async function disable() {
  if (!app) {
    return;
  }

  await app.destroy();
  app = null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "toggle") {
    return false;
  }

  (app ? disable() : enable())
    .then(() => sendResponse({ enabled: Boolean(app) }))
    .catch((error) => sendResponse({ error: error.message }));

  return true;
});
