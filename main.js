// select the shadow element
const feedRoot = document.querySelector("shreddit-feed").shadowRoot;
// console.log(feedRoot.children);

// Get the second slot as it is the parent of the saved posts.
const slot2 = feedRoot.children[2];

// Get all elements assigned to the slot
const assignedElements = slot2.assignedElements({ flatten: true });

// Filter for article element ('articles' will be the array of all the currently loaded posts. Each item inside this array is an object/dom element inside which we need to dig further to find the 'Remove from Saved' button and click it)
const articles = assignedElements.filter(
  (el) => el.tagName.toLowerCase() === "article"
);

// ===================== Loop from here ==============
// Select the shreddit-post shadow element of all currently loaded posts
const singlepost = articles[0].querySelector("shreddit-post").shadowRoot;
// console.log(singlepost.children);

// Get the credit-bar slot
const creditBarSlot = singlepost.querySelector('slot[name="credit-bar"]');
const creditBarSlotChild = creditBarSlot.assignedElements({ flatten: true })[0];

// Select the nested span inside the assigned element
const targetSpan = creditBarSlotChild.querySelector(
  "span.flex.items-center.pl-xs"
);

// shreddit-async-loader gives us another shadow element
const shredditPostOverflowMenu = targetSpan.querySelector(
  "shreddit-post-overflow-menu"
).shadowRoot;
// console.log(shredditAsyncLoader.children);

const overflowButton = shredditPostOverflowMenu.children[0];
// const overflowButton = shredditPostOverflowMenu.querySelector(
//   "div[data-post-click-location='overflow-button']"
// );

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

const liBtnSave = hoverCard.querySelector("li[ id='post-overflow-save']");

// Click the button (not the libtnsave - it is just an item)
liBtnSave.querySelector("div[role='menuitem']").click();
