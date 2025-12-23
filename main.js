///////////////////////////// Some Analysis Notes /////////////////////////////
// Get all elements assigned to the slot and filter for 'article' element
// 'article' element is the actual post
// All the 'article' or posts are loaded in the shreddit-feed shadow DOM element
// 'articles' will be the array of all the loaded posts
// Each item inside this array is an object/dom element inside which
// we need to dig further to find the 'Remove from Saved' button and click it
// the article elements or posts in the 2nd slot are loaded initially but it gets erased and when scrolled-
// the new elements gets loaded in the same 2nd slot but inside another element called faceplate-batch
///////////////////////////////////////////////////////////////////////////////////

// Select the shadow element and get the second slot as it is the parent of the saved posts.
const feedRoot = document.querySelector("shreddit-feed").shadowRoot.children[2];

///////////////////////////////////
// Load Articles - needs to be called on every scroll
///////////////////////////////////
const loadArticles = () => {
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
};

///////////////////////////////////
// Helper - random delay between min and max ms
///////////////////////////////////
function waitRandom(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

///////////////////////////////////
// Start Unsaving posts
///////////////////////////////////
const unsave_posts = async function () {
  const articles = loadArticles();

  for (const el of articles) {
    // Select the shreddit-post shadow element of the post
    const post = el.querySelector("shreddit-post").shadowRoot;

    // Get the credit-bar slot
    const creditBarSlot = post.querySelector('slot[name="credit-bar"]');

    // Get credit-bar slot children
    const creditBarSlotChild = creditBarSlot.assignedElements({
      flatten: true,
    })[0];

    // Select the nested span inside the assigned element
    const targetSpan = creditBarSlotChild.querySelector(
      "span.flex.items-center.pl-xs"
    );

    // shreddit-async-loader gives us another shadow element
    const shredditPostOverflowMenu = targetSpan.querySelector(
      "shreddit-post-overflow-menu"
    ).shadowRoot;

    const overflowButton = shredditPostOverflowMenu.children[0];
    const rplDropDown = overflowButton.querySelector("rpl-dropdown").shadowRoot;
    const rplPopper = rplDropDown.querySelector("rpl-popper").shadowRoot;

    const activePopper = rplPopper.querySelector(
      "div.popup.popup--active, div.popup"
    );
    const popperSlot = activePopper.querySelector("slot");
    const popperSlotContent = popperSlot.assignedElements({ flatten: true })[0];

    const hoverCard = popperSlotContent
      .querySelector("slot")
      .assignedElements({ flatten: true })[0];

    const liBtnSave = hoverCard.querySelector("li[id='post-overflow-save']");

    // Click the button
    liBtnSave.querySelector("div[role='menuitem']").click();

    // Wait a random delay before next iteration
    await waitRandom(500, 1500); // 0.5–1.5 seconds
  }
};
