// Initialize statistics tracker
const stats = new Statistics();

// Control flags
let isAutomationRunning = false;

// Scroll tracking
let previousHeight = 0;
let sameHeightCount = 0;

function loadArticles() {
  try {
    // Select the shadow element and get the second slot (parent of saved posts)
    const feedRoot =
      document.querySelector("shreddit-feed")?.shadowRoot?.children[2];

    if (!feedRoot) {
      log(
        "Feed root not found. Make sure you are on the Reddit saved posts page.",
        "warning"
      );
      return [];
    }

    // Get the 2nd slot element/children
    const assigned = Array.from(feedRoot.assignedElements({ flatten: true }));

    // Check posts directly in the slot
    let articles = assigned.filter(
      (el) => el.tagName.toLowerCase() === "article"
    );

    // Check elements in faceplate-batch of the slot
    if (articles.length === 0) {
      articles = assigned
        .filter((el) => el.tagName.toLowerCase() === "faceplate-batch")
        .flatMap((batch) => Array.from(batch.querySelectorAll("article")));
    }

    return articles;
  } catch (error) {
    log(`Error loading articles: ${error.message}`, "error");
    return [];
  }
}

async function unsavePost(article) {
  try {
    // Navigate through Shadow DOM hierarchy to find the unsave button
    const post = article.querySelector("shreddit-post")?.shadowRoot;
    if (!post) return false;

    const creditBarSlot = post.querySelector('slot[name="credit-bar"]');
    if (!creditBarSlot) return false;

    const creditBarSlotChild = creditBarSlot.assignedElements({
      flatten: true,
    })[0];
    if (!creditBarSlotChild) return false;

    const targetSpan = creditBarSlotChild.querySelector(
      "span.flex.items-center.pl-xs"
    );
    if (!targetSpan) return false;

    const shredditPostOverflowMenu = targetSpan.querySelector(
      "shreddit-post-overflow-menu"
    )?.shadowRoot;
    if (!shredditPostOverflowMenu) return false;

    const overflowButton = shredditPostOverflowMenu.children[0];
    const rplDropDown =
      overflowButton.querySelector("rpl-dropdown")?.shadowRoot;
    if (!rplDropDown) return false;

    const rplPopper = rplDropDown.querySelector("rpl-popper")?.shadowRoot;
    if (!rplPopper) return false;

    const activePopper = rplPopper.querySelector(
      "div.popup.popup--active, div.popup"
    );
    if (!activePopper) return false;

    const popperSlot = activePopper.querySelector("slot");
    const popperSlotContent = popperSlot.assignedElements({ flatten: true })[0];
    if (!popperSlotContent) return false;

    const hoverCard = popperSlotContent
      .querySelector("slot")
      .assignedElements({ flatten: true })[0];
    if (!hoverCard) return false;

    const liBtnSave = hoverCard.querySelector("li[id='post-overflow-save']");
    if (!liBtnSave) return false;

    // Get the text content of the button
    const btnText = liBtnSave
      .querySelector("div[role='menuitem']")
      ?.querySelector("span.flex.items-center.gap-xs.min-w-0.shrink")
      ?.querySelector("span.flex.flex-col.justify-center.min-w-0.shrink")
      ?.querySelector("span.text-14")?.textContent;

    // Click the button only if the post is currently saved
    if (btnText === "Remove from saved") {
      liBtnSave.querySelector("div[role='menuitem']").click();
      return true;
    } else {
      log("Post is already unsaved", "info");
      return false;
    }
  } catch (error) {
    log(`Failed to unsave post: ${error.message}`, "warning");
    return false;
  }
}

async function unsaveBatch() {
  const articles = loadArticles();
  const batchSize = articles.length;

  if (batchSize === 0) {
    log("No articles found to unsave", "warning");
    sendStatusToPopup("No more posts found", "warning");
    return false;
  }

  stats.incrementBatch();
  log(
    `\n📦 Batch #${stats.totalBatches}: Found ${batchSize} posts to unsave`,
    "info"
  );
  sendStatusToPopup(
    `Processing batch #${stats.totalBatches} (${batchSize} posts)`,
    "info"
  );

  for (const article of articles) {
    const unsaved = await unsavePost(article);

    if (unsaved) {
      stats.incrementProcessed();
      log(
        `✓ Unsaved post ${stats.currentBatch}/${batchSize} (Total: ${stats.totalProcessed})`,
        "success"
      );
      sendStatsToPopup(stats);

      // Wait a random delay before next iteration (human-like behavior)
      await waitRandom(500, 1500); // 0.5–1.5 seconds
    }
  }

  log(
    `✅ Batch #${stats.totalBatches} complete: ${stats.currentBatch}/${batchSize} posts unsaved`,
    "success"
  );
  sendStatsToPopup(stats);
  return true;
}

async function autoScroll() {
  if (!isAutomationRunning) {
    return;
  }

  // Unsave all currently loaded posts first
  await unsaveBatch();

  log("⬇️ Scrolling to load more posts...\n", "info");
  sendStatusToPopup("Scrolling for more posts...", "info");

  // Get current scroll height before scrolling
  const currentHeight = document.body.scrollHeight;

  // Check if we've been at the same height for multiple attempts
  if (currentHeight === previousHeight) {
    sameHeightCount++;

    // If height hasn't changed after 3 attempts, we've reached the end
    if (sameHeightCount >= 3) {
      log("✅ All posts processed. No more posts to load.", "success");
      sendStatusToPopup(
        `Completed! Unsaved ${stats.totalProcessed} posts`,
        "success"
      );
      isAutomationRunning = false;
      stats.isRunning = false;
      return;
    }
  } else {
    // Height changed, reset counter
    sameHeightCount = 0;
    previousHeight = currentHeight;
  }

  // Scroll to bottom smoothly
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });

  // Wait for the scroll to render and posts to load
  await new Promise((r) => setTimeout(r, 2000));

  // Random delay before next scroll (1–3 seconds)
  const delay = 1000 + Math.random() * 2000;
  setTimeout(autoScroll, delay);
}

function startUnsaving() {
  if (isAutomationRunning) {
    log("Unsaving is already running", "warning");
    return;
  }

  // Check if we're on the Reddit saved posts page
  if (!window.location.href.includes("/saved")) {
    log("Please navigate to your Reddit saved posts page first", "error");
    sendStatusToPopup("Please go to your saved posts page", "error");
    return;
  }

  isAutomationRunning = true;

  stats.isRunning = true;

  log("🚀 Starting Reddit unsave automation...", "success");
  sendStatusToPopup("Starting automation...", "info");
  sendStatsToPopup(stats);

  autoScroll();
}

function resetStats() {
  stats.reset();
  previousHeight = 0;
  sameHeightCount = 0;
  sendStatsToPopup(stats);
  log("Statistics reset", "info");
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "UNSAVE_POSTS":
      startUnsaving();
      sendResponse({ success: true });
      break;

    case "GET_STATS":
      sendResponse({ success: true, data: stats.toJSON() });
      break;

    case "RESET_STATS":
      resetStats();
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: "Unknown message type" });
  }

  return true; // Keep message channel open for async response
});

// Log when content script is loaded
log("Reddit Posts Actions extension loaded", "success");
