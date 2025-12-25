/**
 * Reddit Posts Actions - Utility Functions
 * Shared helper functions for the extension
 */

/**
 * Wait for a random duration between min and max milliseconds
 * @param {number} min - Minimum delay in milliseconds
 * @param {number} max - Maximum delay in milliseconds
 * @returns {Promise} Resolves after random delay
 */
function waitRandom(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Statistics tracking class for monitoring unsave operations
 */
class Statistics {
  constructor() {
    this.totalProcessed = 0;
    this.currentBatch = 0;
    this.totalBatches = 0;
    this.isRunning = false;
  }

  reset() {
    this.totalProcessed = 0;
    this.currentBatch = 0;
    this.totalBatches = 0;
    this.isRunning = false;
  }

  incrementBatch() {
    this.totalBatches++;
    this.currentBatch = 0;
  }

  incrementProcessed() {
    this.currentBatch++;
    this.totalProcessed++;
  }

  toJSON() {
    return {
      totalProcessed: this.totalProcessed,
      currentBatch: this.currentBatch,
      totalBatches: this.totalBatches,
      isRunning: this.isRunning,
    };
  }
}

/**
 * Send message to popup with current statistics
 * @param {Statistics} stats - Statistics object to send
 */
function sendStatsToPopup(stats) {
  chrome.runtime
    .sendMessage({
      type: "STATS_UPDATE",
      data: stats.toJSON(),
    })
    .catch(() => {
      // Popup might be closed, ignore error
    });
}

/**
 * Send status message to popup
 * @param {string} status - Status message
 * @param {string} type - Message type (info, success, error, warning)
 */
function sendStatusToPopup(status, type = "info") {
  chrome.runtime
    .sendMessage({
      type: "STATUS_UPDATE",
      data: { message: status, type },
    })
    .catch(() => {
      // Popup might be closed, ignore error
    });
}

/**
 * Log message to console with emoji prefix
 * @param {string} message - Message to log
 * @param {string} level - Log level (info, success, error, warning)
 */
function log(message, level = "info") {
  const prefixes = {
    info: "ℹ️",
    success: "✅",
    error: "❌",
    warning: "⚠️",
  };
  const prefix = prefixes[level] || "ℹ️";
  console.log(`${prefix} ${message}`);
}
