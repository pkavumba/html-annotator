chrome.action.onClicked.addListener(async (tab) => {
  if (typeof tab.id !== "number") {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "toggle" });
  } catch (error) {
    // Chrome pages, extension pages, and other restricted URLs do not receive
    // content scripts. Keep the action harmless on those pages.
    console.warn("HTML Annotator is unavailable on this page.", error);
  }
});
