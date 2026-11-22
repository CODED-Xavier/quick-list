const STORAGE_KEY = "quicklist_items_v1";

const DEFAULT_ITEMS = [
  { id: "1", name: "Pão de forma", completed: false },
  { id: "2", name: "Café preto", completed: false },
  { id: "3", name: "Suco de laranja", completed: false },
  { id: "4", name: "Bolacha", completed: false }
];

const form = document.getElementById("add-item-form");
const input = document.getElementById("item-input");
const listElement = document.getElementById("shopping-list");
const emptyState = document.getElementById("empty-state");
const itemsCounter = document.getElementById("items-counter");
const toastAlert = document.getElementById("toast-alert");
const toastMessage = document.getElementById("toast-message");
const toastUndoBtn = document.getElementById("toast-undo");
const toastCloseBtn = document.getElementById("toast-close");

let items = loadItems();
let lastDeleted = null;
let toastTimer = null;

function loadItems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      return JSON.parse(saved);
    }
  } catch (error) {
    return [...DEFAULT_ITEMS];
  }
  saveItems(DEFAULT_ITEMS);
  return [...DEFAULT_ITEMS];
}

function saveItems(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    return;
  }
}

function updateCounter() {
  const total = items.length;
  const completedCount = items.filter((item) => item.completed).length;
  if (total === 0) {
    itemsCounter.textContent = "0 itens";
    return;
  }
  const label = total === 1 ? "item" : "itens";
  itemsCounter.textContent = `${completedCount} de ${total} ${label}`;
}

function createDeleteIcon() {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "18");
  svg.setAttribute("height", "18");
  svg.setAttribute("viewBox", "0 0 18 18");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute(
    "d",
    "M3.75 5.25H14.25M7.5 8.25V12.75M10.5 8.25V12.75M4.5 5.25L5.25 14.25C5.25 14.6478 5.40804 15.0294 5.68934 15.3107C5.97064 15.592 6.35218 15.75 6.75 15.75H11.25C11.6478 15.75 12.0294 15.592 12.3107 15.3107C12.592 15.0294 12.75 14.6478 12.75 14.25L13.5 5.25M6.75 5.25V3C6.75 2.80109 6.82902 2.61032 6.96967 2.46967C7.11032 2.32902 7.30109 2.25 7.5 2.25H10.5C10.6989 2.25 10.8897 2.32902 11.0303 2.46967C11.171 2.61032 11.25 2.80109 11.25 3V5.25"
  );
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1.4");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");

  svg.appendChild(path);
  return svg;
}

function renderList() {
  listElement.innerHTML = "";
  emptyState.hidden = items.length > 0;
  updateCounter();

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "shopping-item";
    if (item.completed) {
      li.classList.add("completed");
    }
    li.dataset.id = item.id;

    const label = document.createElement("label");
    label.className = "item-label";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "item-checkbox";
    checkbox.checked = item.completed;
    checkbox.addEventListener("change", () => toggleItem(item.id));

    const span = document.createElement("span");
    span.className = "item-text";
    span.textContent = item.name;

    label.appendChild(checkbox);
    label.appendChild(span);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-delete";
    deleteBtn.setAttribute("aria-label", `Remover ${item.name}`);
    deleteBtn.appendChild(createDeleteIcon());
    deleteBtn.addEventListener("click", () => removeItem(item.id, li));

    li.appendChild(label);
    li.appendChild(deleteBtn);
    listElement.appendChild(li);
  });
}

function addItem(name) {
  const trimmed = name.trim();
  if (!trimmed) {
    input.classList.remove("input-error");
    void input.offsetWidth;
    input.classList.add("input-error");
    input.focus();
    return;
  }

  const newItem = {
    id: String(Date.now()) + Math.random().toString(16).slice(2, 6),
    name: trimmed,
    completed: false
  };

  items.unshift(newItem);
  saveItems(items);
  renderList();
  input.value = "";
  input.focus();
}

function toggleItem(id) {
  items = items.map((item) =>
    item.id === id ? { ...item, completed: !item.completed } : item
  );
  saveItems(items);
  renderList();
}

function showToast(itemName) {
  toastMessage.textContent = `"${itemName}" foi removido da lista`;
  toastAlert.hidden = false;

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(() => {
    hideToast();
  }, 4000);
}

function hideToast() {
  toastAlert.hidden = true;
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
}

function removeItem(id, listItemElement) {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) {
    return;
  }

  const removedItem = items[index];
  lastDeleted = { item: removedItem, index };

  listItemElement.classList.add("removing");

  setTimeout(() => {
    items = items.filter((item) => item.id !== id);
    saveItems(items);
    renderList();
    showToast(removedItem.name);
  }, 220);
}

function undoRemove() {
  if (!lastDeleted) {
    return;
  }

  const { item, index } = lastDeleted;
  const targetIndex = Math.min(index, items.length);
  items.splice(targetIndex, 0, item);
  lastDeleted = null;

  saveItems(items);
  renderList();
  hideToast();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  addItem(input.value);
});

input.addEventListener("input", () => {
  if (input.classList.contains("input-error")) {
    input.classList.remove("input-error");
  }
});

toastUndoBtn.addEventListener("click", undoRemove);
toastCloseBtn.addEventListener("click", hideToast);

renderList();
