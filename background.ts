declare var chrome: any;

// When extension icon is clicked -> Open DoneOne in new tab
chrome.action.onClicked.addListener((tab: any) => {
  chrome.tabs.create({ url: "index.html", pinned: true });
});

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-to-doneone",
    title: "📋 Add to DoneOne",
    contexts: ["page", "selection", "link", "image"]
  });

  chrome.contextMenus.create({
    id: "open-dashboard",
    title: "🚀 Open Dashboard",
    contexts: ["action"]
  });
});

// Helper to inject script and send message
const injectAndShowModal = (tabId: number, data: any) => {
  chrome.tabs.sendMessage(tabId, {
    action: "show-quick-add",
    data: data
  }, (response: any) => {
    if (chrome.runtime.lastError) {
      console.log("Injecting content script...");
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content-script.js']
      }, () => {
        // Retry after injection
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            action: "show-quick-add",
            data: data
          });
        }, 100);
      });
    }
  });
};

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info: any, tab: any) => {
  if (info.menuItemId === "add-to-doneone") {
    injectAndShowModal(tab.id, {
      url: info.pageUrl,
      selectedText: info.selectionText || "",
      linkUrl: info.linkUrl || "",
      srcUrl: info.srcUrl || ""
    });
  } else if (info.menuItemId === "open-dashboard") {
    chrome.tabs.create({ url: "index.html", pinned: true });
  }
});

// Handle Keyboard Shortcuts
chrome.commands.onCommand.addListener((command: string, tab: any) => {
  if (command === "quick-add-task") {
    // Get the active tab if 'tab' is not provided (sometimes it is null in commands)
    if (!tab) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        if (tabs && tabs[0]) {
          injectAndShowModal(tabs[0].id, {
            url: tabs[0].url,
            title: tabs[0].title,
            selectedText: "" // Can't easily get selection from background without injection
          });
        }
      });
    } else {
      injectAndShowModal(tab.id, {
        url: tab.url,
        title: tab.title,
        selectedText: ""
      });
    }
  }
});
