const CATEGORIES = [
  "Self Development", "Finance", "Success", "Fiction", "Fantasy",
  "Classic", "Science Fiction", "Thriller", "Productivity", "History",
];

const CATEGORY_COLORS = {
  "Self Development": "#6366f1",
  "Finance": "#0ea5e9",
  "Success": "#f59e0b",
  "Fiction": "#ec4899",
  "Fantasy": "#8b5cf6",
  "Classic": "#b45309",
  "Science Fiction": "#06b6d4",
  "Thriller": "#ef4444",
  "Productivity": "#14b8a6",
  "History": "#65a30d",
};

const DEFAULT_BOOKS = [
  { title: "Atomic Habits", author: "James Clear", category: "Self Development" },
  { title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", category: "Finance" },
  { title: "The Psychology of Money", author: "Morgan Housel", category: "Finance" },
  { title: "Think and Grow Rich", author: "Napoleon Hill", category: "Success" },
  { title: "The Alchemist", author: "Paulo Coelho", category: "Fiction" },
  { title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", category: "Fantasy" },
  { title: "The Hobbit", author: "J.R.R. Tolkien", category: "Fantasy" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", category: "Classic" },
  { title: "To Kill a Mockingbird", author: "Harper Lee", category: "Classic" },
  { title: "1984", author: "George Orwell", category: "Science Fiction" },
  { title: "The Silent Patient", author: "Alex Michaelides", category: "Thriller" },
  { title: "Ikigai", author: "Hector Garcia", category: "Self Development" },
  { title: "Deep Work", author: "Cal Newport", category: "Productivity" },
  { title: "Sapiens", author: "Yuval Noah Harari", category: "History" },
  { title: "The Power of Now", author: "Eckhart Tolle", category: "Self Development" },
];

const LS_BOOKS = "BookNest.books";
const LS_HISTORY = "BookNest.history";
const LS_THEME = "BookNest.theme";

let books = [];
let history = [];
let activeCategory = "All";
let searchTerm = "";

const $ = (sel) => document.querySelector(sel);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const save = () => {
  localStorage.setItem(LS_BOOKS, JSON.stringify(books));
  localStorage.setItem(LS_HISTORY, JSON.stringify(history));
};
const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

function loadData() {
  try {
    const stored = JSON.parse(localStorage.getItem(LS_BOOKS));
    if (Array.isArray(stored) && stored.length) {
      books = stored;
    } else {
      books = DEFAULT_BOOKS.map((b) => ({ id: uid(), borrowed: false, ...b }));
    }
  } catch {
    books = DEFAULT_BOOKS.map((b) => ({ id: uid(), borrowed: false, ...b }));
  }
  try {
    history = JSON.parse(localStorage.getItem(LS_HISTORY)) || [];
  } catch {
    history = [];
  }
}

function toast(message, type = "success") {
  const wrap = $("#toastWrap");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="bar"></span><span>${message}</span>`;
  wrap.appendChild(el);
  setTimeout(() => {
    el.classList.add("out");
    el.addEventListener("animationend", () => el.remove());
  }, 2600);
}

function renderStats() {
  const total = books.length;
  const borrowed = books.filter((b) => b.borrowed).length;
  const available = total - borrowed;
  const cats = new Set(books.map((b) => b.category)).size;

  const data = [
    { label: "Total Books", num: total, color: "#6366f1", icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>' },
    { label: "Available", num: available, color: "#14b8a6", icon: '<path d="M20 6 9 17l-5-5"/>' },
    { label: "Borrowed", num: borrowed, color: "#ef4444", icon: '<path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>' },
    { label: "Categories", num: cats, color: "#f59e0b", icon: '<path d="M3 7h18M3 12h18M3 17h18"/>' },
  ];

  $("#stats").innerHTML = data.map((d, i) => `
    <div class="stat" style="animation-delay:${i * 60}ms">
      <div class="stat-top">
        <span class="stat-label">${d.label}</span>
        <span class="stat-ico" style="background:${d.color}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d.icon}</svg>
        </span>
      </div>
      <div class="stat-num">${d.num}</div>
    </div>`).join("");
}

function renderFilters() {
  const all = ["All", ...CATEGORIES];
  $("#filters").innerHTML = all.map((c) =>
    `<button class="chip ${activeCategory === c ? "active" : ""}" data-cat="${c}">${c}</button>`
  ).join("");
  $("#filters").querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      activeCategory = chip.dataset.cat;
      renderFilters();
      renderBooks();
    });
  });
}

function renderBooks() {
  const term = searchTerm.trim().toLowerCase();
  const filtered = books.filter((b) => {
    const matchCat = activeCategory === "All" || b.category === activeCategory;
    const matchSearch = !term || b.title.toLowerCase().includes(term) || b.author.toLowerCase().includes(term);
    return matchCat && matchSearch;
  });

  const grid = $("#bookGrid");
  $("#emptyState").classList.toggle("hidden", filtered.length !== 0);

  grid.innerHTML = filtered.map((b, i) => {
    const color = b.color || CATEGORY_COLORS[b.category] || "#6366f1";
    return `
    <article class="card" style="animation-delay:${Math.min(i * 45, 400)}ms">
      <div class="cover" style="background:linear-gradient(150deg, ${color}, ${shade(color, -28)})">
        <span class="cat-badge">${b.category}</span>
        <span class="status-dot ${b.borrowed ? "borrowed" : "available"}">${b.borrowed ? "Borrowed" : "Available"}</span>
        <span class="cover-title">${escapeHtml(b.title)}</span>
      </div>
      <div class="card-body">
        <span class="card-author">by ${escapeHtml(b.author)}</span>
        <div class="card-actions">
          ${b.borrowed
            ? `<button class="act act-return" data-return="${b.id}">
                 <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 5 5v6"/></svg>Return</button>`
            : `<button class="act act-borrow" data-borrow="${b.id}">
                 <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>Borrow</button>`}
          <button class="act act-del" data-del="${b.id}" title="Delete" aria-label="Delete ${escapeHtml(b.title)}">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>
    </article>`;
  }).join("");

  grid.querySelectorAll("[data-borrow]").forEach((el) => el.addEventListener("click", () => borrowBook(el.dataset.borrow)));
  grid.querySelectorAll("[data-return]").forEach((el) => el.addEventListener("click", () => returnBook(el.dataset.return)));
  grid.querySelectorAll("[data-del]").forEach((el) => el.addEventListener("click", () => deleteBook(el.dataset.del)));
}

function borrowBook(id) {
  const b = books.find((x) => x.id === id);
  if (!b || b.borrowed) return;
  b.borrowed = true;
  history.unshift({ id: uid(), title: b.title, action: "borrowed", at: Date.now() });
  save(); renderAll();
  toast(`Borrowed “${b.title}”`, "success");
}

function returnBook(id) {
  const b = books.find((x) => x.id === id);
  if (!b || !b.borrowed) return;
  b.borrowed = false;
  history.unshift({ id: uid(), title: b.title, action: "returned", at: Date.now() });
  save(); renderAll();
  toast(`Returned “${b.title}”`, "info");
}

function deleteBook(id) {
  const b = books.find((x) => x.id === id);
  if (!b) return;
  books = books.filter((x) => x.id !== id);
  save(); renderAll();
  toast(`Deleted “${b.title}”`, "error");
}

function addBook(data) {
  books.unshift({ id: uid(), borrowed: false, ...data });
  save(); renderAll();
  toast(`Added “${data.title}”`, "success");
}

function renderHistory() {
  const list = $("#historyList");
  if (!history.length) {
    list.innerHTML = `<p class="hist-empty">No borrow activity yet.</p>`;
    return;
  }
  list.innerHTML = history.map((h) => `
    <div class="hist-item">
      <div class="hist-title">${escapeHtml(h.title)}</div>
      <div class="hist-meta">
        <span class="hist-tag ${h.action}">${h.action}</span>
        <span>${fmtDate(h.at)}</span>
      </div>
    </div>`).join("");
}

function renderAll() {
  renderStats();
  renderBooks();
  renderHistory();
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(LS_THEME, theme);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme");
  applyTheme(cur === "dark" ? "light" : "dark");
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function shade(hex, percent) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0xff) + percent;
  let b = (num & 0xff) + percent;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function openModal() {
  $("#addModal").classList.remove("hidden");
  $("#fTitle").focus();
}
function closeModalFn() {
  $("#addModal").classList.add("hidden");
  $("#addForm").reset();
  $("#fColor").value = "#6366f1";
}
function openHistory() { renderHistory(); $("#historyDrawer").classList.remove("hidden"); }
function closeHistoryFn() { $("#historyDrawer").classList.add("hidden"); }

function init() {
  applyTheme(localStorage.getItem(LS_THEME) || "dark");
  loadData();

  $("#fCategory").innerHTML = CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");

  renderFilters();
  renderAll();

  $("#searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderBooks();
  });

  $("#themeToggle").addEventListener("click", toggleTheme);

  $("#addBtn").addEventListener("click", openModal);
  $("#closeModal").addEventListener("click", closeModalFn);
  $("#cancelAdd").addEventListener("click", closeModalFn);
  $("#addModal").addEventListener("click", (e) => { if (e.target.id === "addModal") closeModalFn(); });
  $("#addForm").addEventListener("submit", (e) => {
    e.preventDefault();
    addBook({
      title: $("#fTitle").value.trim(),
      author: $("#fAuthor").value.trim(),
      category: $("#fCategory").value,
      color: $("#fColor").value,
    });
    closeModalFn();
  });

  $("#historyBtn").addEventListener("click", openHistory);
  $("#closeHistory").addEventListener("click", closeHistoryFn);
  $("#historyDrawer").addEventListener("click", (e) => { if (e.target.id === "historyDrawer") closeHistoryFn(); });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeModalFn(); closeHistoryFn(); }
  });
}

document.addEventListener("DOMContentLoaded", init);