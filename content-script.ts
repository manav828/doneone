// Content script injected into all webpages for FlowBoard quick-add functionality

declare var chrome: any;

let modalContainer: HTMLDivElement | null = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
  if (message.action === "show-quick-add") {
    showQuickAddModal(message.data);
    sendResponse({ success: true });
  }
  return true;
});

// Show floating quick-add modal
function showQuickAddModal(data: { url: string; selectedText: string; linkUrl?: string; srcUrl?: string }) {
  // Remove existing modal if any
  removeModal();

  // Create modal container
  modalContainer = document.createElement("div");
  modalContainer.id = "flowboard-quick-add-modal";
  modalContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // Create modal content
  const modal = document.createElement("div");
  modal.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2px;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
  `;

  const modalInner = document.createElement("div");
  modalInner.style.cssText = `
    background: white;
    border-radius: 14px;
    padding: 24px;
  `;

  // Title
  const title = document.createElement("h2");
  title.textContent = "📋 Add Task to FlowBoard";
  title.style.cssText = `
    margin: 0 0 20px 0;
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
  `;

  // Task title input
  const taskTitle = data.selectedText || document.title;
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Task title...";
  input.value = taskTitle;
  input.style.cssText = `
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 12px;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  `;
  input.onfocus = () => { input.style.borderColor = "#667eea"; };
  input.onfocus = () => { input.style.borderColor = "#e5e7eb"; };

  // Description textarea (pre-filled with URL)
  const description = document.createElement("textarea");
  description.placeholder = "Description (optional)...";
  description.value = `📎 From: ${data.url}`;
  description.style.cssText = `
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 16px;
    outline: none;
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
    box-sizing: border-box;
  `;
  description.onfocus = () => { description.style.borderColor = "#667eea"; };
  description.onblur = () => { description.style.borderColor = "#e5e7eb"; };

  // Captured data info
  const capturedInfo = document.createElement("div");
  capturedInfo.style.cssText = `
    background: #f3f4f6;
    padding: 10px 12px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 12px;
    color: #6b7280;
  `;
  capturedInfo.innerHTML = `
    <div style="margin-bottom: 4px;">📎 <strong>Captured from:</strong></div>
    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${data.url}</div>
  `;

  // Buttons container
  const buttonsContainer = document.createElement("div");
  buttonsContainer.style.cssText = `
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  `;

  // Cancel button
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.cssText = `
    padding: 10px 20px;
    border: 2px solid #e5e7eb;
    background: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  `;
  cancelBtn.onmouseenter = () => { cancelBtn.style.background = "#f9fafb"; };
  cancelBtn.onmouseleave = () => { cancelBtn.style.background = "white"; };
  cancelBtn.onclick = removeModal;

  // Add task button
  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Task";
  addBtn.style.cssText = `
    padding: 10px 20px;
    border: none;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  `;
  addBtn.onmouseenter = () => { addBtn.style.transform = "scale(1.05)"; };
  addBtn.onmouseleave = () => { addBtn.style.transform = "scale(1)"; };
  addBtn.onclick = () => {
    const taskData = {
      title: input.value.trim(),
      description: description.value.trim(),
      capturedUrl: data.url,
      capturedText: data.selectedText,
      linkUrl: data.linkUrl,
      srcUrl: data.srcUrl
    };

    if (taskData.title) {
      // Save to Chrome storage for the main app to pick up
      chrome.storage.local.get(["pendingTasks"], (result: any) => {
        const pendingTasks = result.pendingTasks || [];
        pendingTasks.push({
          ...taskData,
          timestamp: Date.now()
        });
        chrome.storage.local.set({ pendingTasks }, () => {
          showSuccessMessage();
          removeModal();
        });
      });
    }
  };

  // Assemble modal
  buttonsContainer.appendChild(cancelBtn);
  buttonsContainer.appendChild(addBtn);

  modalInner.appendChild(title);
  modalInner.appendChild(input);
  modalInner.appendChild(description);
  modalInner.appendChild(capturedInfo);
  modalInner.appendChild(buttonsContainer);

  modal.appendChild(modalInner);
  modalContainer.appendChild(modal);

  document.body.appendChild(modalContainer);

  // Focus input
  setTimeout(() => input.focus(), 100);

  // Close on Escape key
  const escapeHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      removeModal();
      document.removeEventListener("keydown", escapeHandler);
    }
  };
  document.addEventListener("keydown", escapeHandler);

  // Close on backdrop click
  modalContainer.addEventListener("click", (e) => {
    if (e.target === modalContainer) {
      removeModal();
    }
  });

  // Submit on Enter (in input only)
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      addBtn.click();
    }
  });
}

// Remove modal
function removeModal() {
  if (modalContainer) {
    modalContainer.remove();
    modalContainer = null;
  }
}

// Show success message
function showSuccessMessage() {
  const toast = document.createElement("div");
  toast.textContent = "✅ Task added to FlowBoard!";
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // Add keyframe animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(toast);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Prevent content script from running in extension pages
if (!window.location.href.startsWith("chrome-extension://")) {
  console.log("FlowBoard content script loaded");
}
