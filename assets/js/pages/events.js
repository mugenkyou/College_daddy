let events = [];

const API_URL = "https://webdevharsha.github.io/open-hackathons-api/data.json";

/* ── Bootstrap ────────────────────────────────────────────────── */
async function loadEventsFromAPI() {
  showSkeletons();

  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    events = data.hackathons.map(item => ({
      title:     item.title                || "Untitled Event",
      platform:  item.organization_name   || "Hackathon",
      startDate: item.submission_period_dates
        ? item.submission_period_dates.split(' - ')[0] : "",
      endDate:   item.submission_period_dates
        ? item.submission_period_dates.split(' - ')[1] : "",
      link:      item.url                 || "#",
      prize:     item.prizeText           || "",
      location:  item.displayed_location  || "",
      isOpen:    item.isOpen              || false,
    }));

    renderEvents();
    updateStats();
  } catch (err) {
    console.error("API failed:", err);
    const grid = document.getElementById("eventsGrid");
    if (grid) {
      grid.innerHTML = `
        <div class="events-empty">
          <div class="empty-icon">⚡</div>
          <p>Couldn't load events right now. Please check back soon!</p>
        </div>`;
    }
  }
}

/* ── Status helpers ───────────────────────────────────────────── */
function getStatus(start, end, isOpen) {
  if (isOpen === false) return "ended";

  const now  = new Date();
  if (!start || !end) return "upcoming";

  const startDate = new Date(start);
  const endDate   = new Date(end);

  if (now < startDate) return "upcoming";
  if (now > endDate)   return "ended";
  return "ongoing";
}

function getCountdown(end, status) {
  if (!end || status === "ended") return "";

  const diff = new Date(end) - new Date();
  if (diff <= 0) return "";

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0)  return `⏱ ${days}d ${hours}h left`;
  if (hours > 0) return `⏱ ${hours}h left`;
  return "⏱ Ends today";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Skeleton loading ─────────────────────────────────────────── */
function showSkeletons(count = 6) {
  const grid = document.getElementById("eventsGrid");
  if (!grid) return;
  grid.innerHTML = Array.from({ length: count }, () => `
    <div class="event-card skeleton">
      <div class="event-card-top">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line short" style="width:60px"></div>
      </div>
      <div class="skeleton-line tall"></div>
      <div class="skeleton-line medium"></div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line short" style="width:55%"></div>
      </div>
      <div class="skeleton-line full"></div>
    </div>`).join("");
}

/* ── Render ───────────────────────────────────────────────────── */
function renderEvents(filter = "all") {
  const grid = document.getElementById("eventsGrid");
  if (!grid) return;

  const filtered = events.filter(ev => {
    const status = getStatus(ev.startDate, ev.endDate, ev.isOpen);
    return filter === "all" || status === filter;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="events-empty">
        <div class="empty-icon">🔍</div>
        <p>No ${filter === "all" ? "" : filter + " "}events found right now. Check back soon!</p>
      </div>`;
    return;
  }

  grid.innerHTML = "";

  filtered.forEach((ev, index) => {
    const status    = getStatus(ev.startDate, ev.endDate, ev.isOpen);
    const countdown = getCountdown(ev.endDate, status);
    const card      = document.createElement("div");
    card.className  = "event-card";
    card.style.animationDelay = `${index * 0.06}s`;

    const dateRange = (ev.startDate || ev.endDate)
      ? `<div class="event-meta-row">
           <span class="meta-icon">📅</span>
           ${formatDate(ev.startDate)}${ev.endDate ? " – " + formatDate(ev.endDate) : ""}
         </div>`
      : "";

    const locationRow = ev.location
      ? `<div class="event-meta-row">
           <span class="meta-icon">📍</span>
           ${ev.location}
         </div>`
      : "";

    const prizeRow = ev.prize
      ? `<div class="event-meta-row">
           <span class="meta-icon">🏆</span>
           ${ev.prize}
         </div>`
      : "";

    const countdownHtml = countdown
      ? `<div class="countdown">${countdown}</div>`
      : "";

    card.innerHTML = `
      <div class="event-card-top">
        <div class="event-platform">${ev.platform}</div>
        <div class="event-badge ${status}">${status.toUpperCase()}</div>
      </div>

      <div class="event-title">${ev.title}</div>

      <div class="event-meta">
        ${dateRange}
        ${locationRow}
        ${prizeRow}
      </div>

      ${countdownHtml}

      <div class="event-card-divider"></div>

      <a href="${ev.link}" target="_blank" rel="noopener noreferrer" class="event-link">
        View Details <span class="arrow">→</span>
      </a>`;

    grid.appendChild(card);
  });
}

/* ── Stats counter ────────────────────────────────────────────── */
function updateStats() {
  let total = 0, ongoing = 0, upcoming = 0;

  events.forEach(ev => {
    const s = getStatus(ev.startDate, ev.endDate, ev.isOpen);
    total++;
    if (s === "ongoing")  ongoing++;
    if (s === "upcoming") upcoming++;
  });

  animateCount("statTotal",    total);
  animateCount("statOngoing",  ongoing);
  animateCount("statUpcoming", upcoming);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(interval);
  }, 30);
}

/* ── Filter ───────────────────────────────────────────────────── */
function filterEvents(type, el) {
  document.querySelectorAll(".event-filters button")
    .forEach(btn => btn.classList.remove("active"));
  if (el) el.classList.add("active");
  renderEvents(type);
}

/* ── Init ─────────────────────────────────────────────────────── */
loadEventsFromAPI();