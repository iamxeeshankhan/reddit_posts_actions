/**
 * Reddit Posts Actions - Popup Script
 * Handles UI interactions and communication with content script
 */

// DOM elements
const unsaveBtn = document.getElementById("unsaveBtn");

const resetBtn = document.getElementById("resetBtn");
const totalProcessedEl = document.getElementById("totalProcessed");

const totalBatchesEl = document.getElementById("totalBatches");
const statusMessage = document.getElementById("statusMessage");

// State
let isRunning = false;

function updateStats(stats) {
  totalProcessedEl.textContent = stats.totalProcessed || 0;

  totalBatchesEl.textContent = stats.totalBatches || 0;
  isRunning = stats.isRunning || false;
  updateButtonStates();
}

/**
 * Update status message display
 * @param {string} message - Status message text
 * @param {string} type - Message type (info, success, error, warning)
 */
function updateStatus(message, type = "info") {
  const icons = {
    info: "ℹ️",
    success: "✅",
    error: "❌",
    warning: "⚠️",
  };

  const icon = statusMessage.querySelector(".status-icon");
  const text = statusMessage.querySelector(".status-text");

  icon.textContent = icons[type] || icons.info;
  text.textContent = message;

  // Update status message styling
  statusMessage.className = "status-message " + type;
}

/**
 * Update button states based on automation status
 */
function updateButtonStates() {
  if (isRunning) {
    unsaveBtn.disabled = true;
    unsaveBtn.style.opacity = "0.5";
    unsaveBtn.textContent = "Running...";
  } else {
    unsaveBtn.disabled = false;
    unsaveBtn.style.opacity = "1";
    unsaveBtn.textContent = "Unsave Posts";
  }
}

// Send message to active tab's content script
async function sendMessageToActiveTab(message) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      throw new Error("No active tab found");
    }

    // Check if tab is on Reddit
    if (!tab.url || !tab.url.includes("reddit.com")) {
      throw new Error("Please navigate to Reddit first");
    }

    const response = await chrome.tabs.sendMessage(tab.id, message);
    return response;
  } catch (error) {
    const expectedErrors = [
      "Please navigate to Reddit first",
      "No active tab found",
    ];

    // Check for "Could not establish connection" error (common after extension reload)
    if (
      error.message.includes("Could not establish connection") ||
      error.message.includes("Receiving end does not exist")
    ) {
      throw new Error(
        "Please refresh this Reddit page to enable the extension."
      );
    }

    if (!expectedErrors.includes(error.message)) {
      console.log("Error sending message:", error);
    }
    throw error;
  }
}

// unsave posts handler
async function handleUnsave() {
  try {
    updateStatus("Unsaving posts...", "info");
    const response = await sendMessageToActiveTab({ type: "UNSAVE_POSTS" });

    if (response && response.success) {
      isRunning = true;
      updateButtonStates();
      updateStatus("Posts unsaved successfully", "success");
    } else {
      throw new Error("Failed to unsave posts");
    }
  } catch (error) {
    updateStatus(
      error.message || "Failed to unsave posts. Make sure you are on Reddit.",
      "error"
    );
    console.log("Unsave error:", error);
  }
}

// reset stats handler
async function handleReset() {
  try {
    // Reset local popup statistics (works even without Reddit tab)
    updateStats({
      totalProcessed: 0,
      currentBatch: 0,
      totalBatches: 0,
      isRunning: false,
    });
    updateStatus("Statistics reset", "info");

    // Try to also reset content script stats if on Reddit (optional)
    try {
      await sendMessageToActiveTab({ type: "RESET_STATS" });
    } catch (error) {
      // Silently ignore if not on Reddit - local stats are already reset
      console.log("Could not reset content script stats:", error.message);
    }
  } catch (error) {
    updateStatus(error.message || "Failed to reset stats", "error");
    console.log("Reset error:", error);
  }
}

// get stats handler
async function getStats() {
  try {
    const response = await sendMessageToActiveTab({ type: "GET_STATS" });

    if (response && response.success && response.data) {
      updateStats(response.data);
    }
  } catch (error) {
    // Silently fail if tab is not on Reddit or content script not loaded
    console.log("Could not get stats:", error.message);
  }
}

// listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "STATS_UPDATE") {
    updateStats(message.data);
  } else if (message.type === "STATUS_UPDATE") {
    updateStatus(message.data.message, message.data.type);
  }

  sendResponse({ received: true });
  return true;
});

// Event listeners
unsaveBtn.addEventListener("click", handleUnsave);
resetBtn.addEventListener("click", handleReset);

// Initialize popup
document.addEventListener("DOMContentLoaded", () => {
  updateButtonStates();
  getStats(); // Try to get current stats when popup opens

  // Check if we're on Reddit
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.url || !tab.url.includes("reddit.com")) {
      updateStatus("Navigate to Reddit to use this extension", "warning");
    }
  });
});
