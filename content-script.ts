// Content script injected into all webpages for DoneOne quick-add functionality

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
  modalContainer.id = "doneone-quick-add-modal";
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
  title.textContent = "📋 Add Task to DoneOne";
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
  input.onblur = () => { input.style.borderColor = "#e5e7eb"; };

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
    margin-bottom: 12px;
    outline: none;
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
    box-sizing: border-box;
  `;
  description.onfocus = () => { description.style.borderColor = "#667eea"; };
  description.onblur = () => { description.style.borderColor = "#e5e7eb"; };

  // Dropdowns Container
  const dropdownsContainer = document.createElement("div");
  dropdownsContainer.style.cssText = `
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  `;

  // Project Select
  const projectSelect = document.createElement("select");
  projectSelect.id = "doneone-project-select";
  projectSelect.style.cssText = `
    flex: 1;
    padding: 10px 12px;
    height: 42px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    cursor: pointer;
    background: white;
    box-sizing: border-box;
    color: #1f2937;
  `;
  projectSelect.innerHTML = `<option value="" disabled selected>Select Project *</option>`;

  // Assignee Select
  const assigneeSelect = document.createElement("select");
  assigneeSelect.id = "doneone-assignee-select";
  assigneeSelect.disabled = true; // Disabled by default
  assigneeSelect.style.cssText = `
    flex: 1;
    padding: 10px 12px;
    height: 42px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    cursor: not-allowed;
    background: #f9fafb;
    box-sizing: border-box;
    color: #9ca3af;
  `;
  assigneeSelect.innerHTML = `<option value="" selected>Assignee (Select Project First)</option>`;

  // State to hold data
  let availableProjects: any[] = [];
  let availableUsers: any[] = [];
  let currentUserId: string | null = null;

  // Load data from storage
  chrome.storage.local.get(['cachedProjects', 'cachedUsers', 'cachedCurrentUser'], (result: any) => {
    availableProjects = result.cachedProjects || [];
    availableUsers = result.cachedUsers || [];
    currentUserId = result.cachedCurrentUser ? result.cachedCurrentUser.id : null;

    // Populate Projects
    availableProjects.forEach((p: any) => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.name;
      projectSelect.appendChild(option);
    });

    // If only one project, select it automatically
    if (availableProjects.length === 1) {
      projectSelect.value = availableProjects[0].id;
      updateAssignees(availableProjects[0].id);
    }
  });

  // Function to update assignees based on project
  const updateAssignees = (projectId: string) => {
    assigneeSelect.innerHTML = `<option value="" disabled>Select Assignee</option>`;
    assigneeSelect.disabled = false;
    assigneeSelect.style.cursor = 'pointer';
    assigneeSelect.style.background = 'white';
    assigneeSelect.style.color = '#1f2937';

    const project = availableProjects.find(p => p.id === projectId);
    if (!project) return;

    // Collect all member IDs
    const memberIds = new Set([
      project.managerId,
      ...(project.leadIds || []),
      ...(project.resourceIds || [])
    ]);

    // Filter users
    const projectMembers = availableUsers.filter(u => memberIds.has(u.id));

    // Populate Option
    // Add "Assign to me" as first option if I am a member
    let meFound = false;

    // Sort: Me first, then alphabetical
    projectMembers.sort((a, b) => {
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;
      return a.name.localeCompare(b.name);
    });

    projectMembers.forEach((u: any) => {
      const option = document.createElement("option");
      option.value = u.id;
      option.textContent = u.name;

      if (currentUserId && u.id === currentUserId) {
        option.textContent = "Assign to Me"; // Friendlier text
        meFound = true;
      }

      assigneeSelect.appendChild(option);
    });

    // Auto-select Me
    if (meFound && currentUserId) {
      assigneeSelect.value = currentUserId;
    }
  };

  // Event Listener for Project Change
  projectSelect.addEventListener('change', (e: any) => {
    updateAssignees(e.target.value);
  });

  dropdownsContainer.appendChild(projectSelect);
  dropdownsContainer.appendChild(assigneeSelect);


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

  const submitTask = () => {
    // Validate
    if (!projectSelect.value) {
      projectSelect.style.borderColor = "#ef4444";
      return;
    }

    const taskData = {
      title: input.value.trim(),
      description: description.value.trim(),
      projectId: projectSelect.value,
      assigneeId: assigneeSelect.value || undefined,
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

  addBtn.onclick = submitTask;

  // Assemble modal
  buttonsContainer.appendChild(cancelBtn);
  buttonsContainer.appendChild(addBtn);

  modalInner.appendChild(title);
  modalInner.appendChild(input);
  modalInner.appendChild(description);
  modalInner.appendChild(dropdownsContainer);
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
      submitTask();
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
  toast.textContent = "✅ Task added to DoneOne!";
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
  console.log("DoneOne content script loaded");
}
