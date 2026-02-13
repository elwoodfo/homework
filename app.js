// ==============================
// CONFIG
// ==============================
const API_BASE = "https://script.google.com/macros/s/AKfycbwL5UzU_B4tSj911TPI1ZJTAALkX35mYlfoNMOQ97dC4bQ6BbFWvqz4-yWO_spxOuWZnw/exec";
const FETCH_TIMEOUT_MS = 12_000;

// ==============================
// THEME
// ==============================
function initTheme() {
  const saved = localStorage.getItem("theme");
  document.documentElement.dataset.theme = saved || "dark";

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme || "dark";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  });
}



// ==============================
// CLOCK
// ==============================
function startClock() {
  const timeEl = document.getElementById("time");
  const dateEl = document.getElementById("date");

  function tick() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString("ru-RU", { hour12: false });
    dateEl.textContent = now.toLocaleDateString("ru-RU", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  tick();
  setInterval(tick, 1000);
}

// ==============================
// UTIL
// ==============================

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTodayShortRu() {
  const full = new Date().toLocaleDateString("ru-RU", { weekday: "long" }).toLowerCase();
  const map = {
    "понедельник": "пн",
    "вторник": "вт",
    "среда": "ср",
    "четверг": "чт",
    "пятница": "пт",
    "суббота": "сб",
    "воскресенье": "вс",
  };
  return map[full] || full.slice(0, 2);
}

function getTodayRu() {
  return new Date().toLocaleDateString("ru-RU", {
    weekday: "long"
  }).toLowerCase();
}

function formatDateShort(v) {
  const s = String(v ?? "").trim();
  if (!s) return "--";
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
  }
  return s;
}

// ==============================
// MODAL
// ==============================
function initModal() {
  const overlay = document.getElementById("modalOverlay");
  if (!overlay) return;

  // гарантированно закрыто при старте
  overlay.hidden = true;
  document.body.style.overflow = "";

  const closeBtn = document.getElementById("modalClose");
  const cancelBtn = document.getElementById("modalCancel");

  const hide = () => {
    overlay.hidden = true;
    document.body.style.overflow = "";
  };

  // клик по фону (вне .modal) закрывает
  overlay.addEventListener("click", (e) => {
    if (!e.target.closest(".modal")) hide();
  });

  closeBtn?.addEventListener("click", hide);
  cancelBtn?.addEventListener("click", hide);

  window.addEventListener("keydown", (e) => {
    if (!overlay.hidden && e.key === "Escape") hide();
  });
}

function showLinkModal({ title, subtitle, body, url }) {
  const overlay = document.getElementById("modalOverlay");

  const titleEl = document.getElementById("modalTitle");
  const subtitleEl = document.getElementById("modalSubtitle");
  const bodyEl = document.getElementById("modalBody");
  const openBtn = document.getElementById("modalOpenLink");

  // ВАЖНО — возвращаем кнопку
  openBtn.style.display = "";

  titleEl.textContent = title || "Ссылка";
  subtitleEl.textContent = subtitle || "";
  bodyEl.textContent = body || "";

  openBtn.href = url || "#";

  overlay.hidden = false;
  document.body.style.overflow = "hidden";
}

// ==============================
// RENDER: SUBJECT BUTTON
// ==============================
function showHomeworkModal(subjectName, homeworkText) {
  const overlay = document.getElementById("modalOverlay");
  if (!overlay) return;

  const titleEl = document.getElementById("modalTitle");
  const subtitleEl = document.getElementById("modalSubtitle");
  const bodyEl = document.getElementById("modalBody");
  const openBtn = document.getElementById("modalOpenLink");
  const copyBtn = document.getElementById("modalCopy");

  titleEl.textContent = subjectName || "Домашнее задание";
  subtitleEl.textContent = "Домашнее задание";
  bodyEl.textContent = homeworkText || "ДЗ отсутствует";

  // скрываем кнопку "Открыть"
  openBtn.style.display = "none";

  // копирование текста ДЗ
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(homeworkText || "");
      copyBtn.textContent = "Скопировано ✅";
      setTimeout(() => {
        copyBtn.textContent = "Скопировать";
      }, 1200);
    } catch {
      copyBtn.textContent = "Ошибка";
      setTimeout(() => {
        copyBtn.textContent = "Скопировать";
      }, 1200);
    }
  };

  overlay.hidden = false;
  document.body.style.overflow = "hidden";
}


function linkBtn(label, url, subjectName) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn-primary";
  btn.textContent = label;

  const finalUrl = String(url || "").trim();

  if (!finalUrl) {
    btn.classList.remove("btn-primary");
    btn.style.opacity = "0.55";
    btn.disabled = true;
    btn.textContent = `${label} (нет)`;
    return btn;
  }

  btn.addEventListener("click", () => {
    showLinkModal({
      title: subjectName || "Предмет",
      subtitle: label,
      body: `Откроется ссылка:\n${finalUrl}`,
      url: finalUrl,
    });
  });

  return btn;
}

// ==============================
// RENDER
// ==============================
function renderSubjects(rows) {
  const root = document.getElementById("subjects");
  root.innerHTML = "";

  if (!rows.length) {
    root.innerHTML = `<div class="skeleton">Нет предметов.</div>`;
    return;
  }

  rows.forEach((r) => {
    const name = String(r.subject || "").trim();
    if (!name) return;

    const row = document.createElement("div");
    row.className = "row";

    const left = document.createElement("div");
    left.innerHTML = `<div class="name">${escapeHtml(name)}</div>`;

    const actions = document.createElement("div");
    actions.className = "actions";
    const hwBtn = document.createElement("button");
hwBtn.type = "button";
hwBtn.className = "btn btn-primary";
hwBtn.textContent = "ДЗ";

hwBtn.addEventListener("click", () => {
  showHomeworkModal(name, r.hw_text);
});

actions.appendChild(hwBtn);
    actions.appendChild(linkBtn("Для автомата", r.auto_url, name));
    actions.appendChild(linkBtn("Вступить в группу", r.group_url, name));

    row.appendChild(left);
    row.appendChild(actions);
    root.appendChild(row);
  });
}

function renderInfo(rows) {
  const map = Object.fromEntries(rows.map((r) => [String(r.key || "").trim(), String(r.value ?? "")]));
  const upd = map.updated_at ? formatDateShort(map.updated_at) : "";
  document.getElementById("infoUpdated").textContent = upd ? `Обновлено: ${upd}` : "";
  document.getElementById("infoMessage").textContent = map.message || "Нет актуальной информации.";
}

function formatTimeOnly(value) {
  const s = String(value ?? "").trim();
  if (!s) return "--";

  // если это ISO дата-время
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  }

  // если там уже строка типа "10:30" или "10:30-12:00"
  return s;
}

function renderSchedule(rows) {
  const root = document.getElementById("schedule");
  root.innerHTML = "";

  if (!rows.length) {
    root.innerHTML = `<div class="skeleton">Нет расписания.</div>`;
    return;
  }

  const byDay = new Map();
  rows.forEach((r) => {
    const day = String(r.day || "").trim();
    if (!day) return;
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(r);
  });

  for (const [day, lessons] of byDay.entries()) {
    const dayBox = document.createElement("div");
    dayBox.className = "day";

    const title = document.createElement("div");
title.className = "day-title";
title.textContent = day;

const todayShort = getTodayShortRu();

if (String(day).trim().toLowerCase() === todayShort) {
  title.classList.add("today-highlight");
}

dayBox.appendChild(title);


    lessons.forEach((l) => {
      const leftVal = formatTimeOnly(l.time);
      const subj = String(l.subject || "").trim() || "—";
      const room = String(l.room || "").trim();
      const note = String(l.note || "").trim();
      const meta = [room ? `ауд. ${room}` : "", note].filter(Boolean).join(" • ");

      const lesson = document.createElement("div");
      lesson.className = "lesson";
      lesson.innerHTML = `
        <div class="t">${escapeHtml(leftVal)}</div>
        <div>
          <div class="s">${escapeHtml(subj)}</div>
          <div class="meta">${escapeHtml(meta)}</div>
        </div>
      `;
      dayBox.appendChild(lesson);
    });

    root.appendChild(dayBox);
  }
}

// ==============================
// LOAD (ONE REQUEST)
// ==============================
async function loadAll() {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = `${API_BASE}?mode=all&_ts=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });

    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "API error");

    renderSubjects(data.subjects || []);
    renderSchedule(data.schedule || []);
    renderInfo(data.info || []);
  } finally {
    clearTimeout(t);
  }
}

// ==============================
// INIT
// ==============================
async function init() {
  initTheme();
  startClock();
  initModal();

  if (!API_BASE || API_BASE.includes("PASTE")) {
    document.getElementById("subjects").innerHTML = `<div class="skeleton">Укажи API_BASE в app.js</div>`;
    document.getElementById("schedule").innerHTML = `<div class="skeleton">Укажи API_BASE в app.js</div>`;
    document.getElementById("infoMessage").textContent = "Укажи API_BASE в app.js";
    return;
  }

  try {
    await loadAll();
  } catch (e) {
    const err = e?.message ? e.message : String(e);
    document.getElementById("subjects").innerHTML = `<div class="skeleton">Ошибка: ${escapeHtml(err)}</div>`;
    document.getElementById("schedule").innerHTML = `<div class="skeleton">Ошибка: ${escapeHtml(err)}</div>`;
    document.getElementById("infoMessage").textContent = `Ошибка: ${err}`;
  }
}

init();
