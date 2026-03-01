/**
 * attendance.js
 * Attendance Tracker – College Daddy
 *
 * Responsibilities:
 *  - CRUD operations on subjects (add / edit / delete / clear-all)
 *  - Attendance percentage calculation & status classification
 *  - Recovery hint computation (classes needed to reach 75%)
 *  - Summary stats (overall %, safe/warning/danger counts)
 *  - localStorage persistence (key: "cd_attendance")
 *  - Dark-mode sync with the rest of the site (key: "theme")
 *  - Mobile nav toggle
 *  - Edit modal (keyboard-accessible, focus-trapped)
 */

/* ============================================================
   CONSTANTS
   ============================================================ */

/** Minimum safe attendance threshold (percentage) */
const SAFE_THRESHOLD = 75;

/** localStorage key for subjects */
const STORAGE_KEY   = "cd_attendance";

/* ============================================================
   TYPES  (JSDoc for clarity – no TypeScript required)
   ============================================================ */

/**
 * @typedef {Object} Subject
 * @property {string} id         - UUID-like unique identifier
 * @property {string} name       - Subject display name
 * @property {number} total      - Total classes held
 * @property {number} attended   - Classes attended by student
 */

/* ============================================================
   STATE
   ============================================================ */

/** @type {Subject[]} */
let subjects = [];

/** @type {string|null} ID of the subject currently being edited */
let editingId = null;

/* ============================================================
   DOM REFERENCES
   ============================================================ */

const subjectsGrid      = document.getElementById("subjects-grid");
const emptyState        = document.getElementById("empty-state");
const clearAllBtn       = document.getElementById("clear-all-btn");
const addSubjectBtn     = document.getElementById("add-subject-btn");
const formError         = document.getElementById("form-error");

// Add-form inputs
const inputName         = document.getElementById("subject-name");
const inputTotal        = document.getElementById("total-classes");
const inputAttended     = document.getElementById("attended-classes");

// Summary elements
const summaryOverall    = document.getElementById("summary-overall");
const summarySafe       = document.getElementById("summary-safe");
const summaryWarning    = document.getElementById("summary-warning");
const summaryDanger     = document.getElementById("summary-danger");

// Edit modal
const editModal         = document.getElementById("edit-modal");
const editName          = document.getElementById("edit-subject-name");
const editTotal         = document.getElementById("edit-total-classes");
const editAttended      = document.getElementById("edit-attended-classes");
const saveEditBtn       = document.getElementById("save-edit-btn");
const cancelEditBtn     = document.getElementById("cancel-edit-btn");
const editFormError     = document.getElementById("edit-form-error");

// NOTE: nav toggle and theme toggle are handled by navigation.js

/* ============================================================
   STORAGE HELPERS
   ============================================================ */

/**
 * Load subjects array from localStorage.
 * Returns an empty array if nothing is stored or JSON is corrupt.
 * @returns {Subject[]}
 */
function loadSubjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persist the current subjects array to localStorage.
 */
function saveSubjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
}

/* ============================================================
   UNIQUE ID GENERATOR
   ============================================================ */

/**
 * Generate a simple unique ID using Math.random + Date.now.
 * Using crypto.randomUUID() where available, falling back gracefully.
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/* ============================================================
   ATTENDANCE CALCULATIONS
   ============================================================ */

/**
 * Compute the attendance percentage for a subject.
 * Returns 0 if total is 0 to avoid division by zero.
 * @param {Subject} subject
 * @returns {number} Rounded to one decimal place
 */
function getPercentage(subject) {
  if (subject.total <= 0) return 0;
  return Math.round((subject.attended / subject.total) * 1000) / 10;
}

/**
 * Determine the status of a subject based on its attendance percentage.
 * @param {number} percentage
 * @returns {"safe"|"warning"|"danger"}
 */
function getStatus(percentage) {
  if (percentage >= SAFE_THRESHOLD) return "safe";
  if (percentage >= 65)              return "warning";
  return "danger";
}

/**
 * Calculate how many consecutive classes a student must attend
 * (without missing any) to reach the SAFE_THRESHOLD.
 *
 * Formula: solve for x in ((attended + x) / (total + x)) >= 0.75
 *   → x >= (0.75 * total - attended) / 0.25
 *
 * Returns 0 if already at or above the threshold.
 * Returns null if it is mathematically impossible (100% future attendance
 * cannot save them — this happens when attended / total is already
 * permanently below threshold, but in practice this is always solvable).
 *
 * @param {Subject} subject
 * @returns {number}
 */
function classesNeededToRecover(subject) {
  const { total, attended } = subject;
  if (total <= 0) return 0;

  const pct = getPercentage(subject);
  if (pct >= SAFE_THRESHOLD) return 0;

  // (attended + x) / (total + x) = SAFE_THRESHOLD / 100
  // attended + x = (SAFE_THRESHOLD / 100) * (total + x)
  // attended + x = threshold * total + threshold * x
  // x - threshold * x = threshold * total - attended
  // x(1 - threshold) = threshold * total - attended
  // x = (threshold * total - attended) / (1 - threshold)
  const threshold = SAFE_THRESHOLD / 100;
  const needed = Math.ceil(
    (threshold * total - attended) / (1 - threshold)
  );
  return Math.max(0, needed);
}

/**
 * How many classes can be skipped while staying above the threshold.
 * @param {Subject} subject
 * @returns {number}
 */
function classesCanSkip(subject) {
  const { total, attended } = subject;
  if (total <= 0) return 0;
  const threshold = SAFE_THRESHOLD / 100;
  // (attended) / (total + x) >= threshold
  // attended >= threshold * (total + x)
  // total + x <= attended / threshold
  // x <= attended / threshold - total
  const canSkip = Math.floor(attended / threshold - total);
  return Math.max(0, canSkip);
}

/* ============================================================
   RENDER
   ============================================================ */

/**
 * Re-render all subject cards and update the summary section.
 * Called after every state mutation.
 */
function render() {
  // Toggle empty-state visibility
  const hasSubjects = subjects.length > 0;
  emptyState.style.display = hasSubjects ? "none" : "flex";
  clearAllBtn.hidden        = !hasSubjects;

  // Remove all existing cards (leave emptyState in DOM)
  const existingCards = subjectsGrid.querySelectorAll(".subject-card");
  existingCards.forEach((card) => card.remove());

  // Render each subject
  subjects.forEach((subject) => {
    const card = buildSubjectCard(subject);
    subjectsGrid.appendChild(card);
  });

  // Update summary
  updateSummary();
}

/**
 * Build and return a subject card DOM element.
 * @param {Subject} subject
 * @returns {HTMLElement}
 */
function buildSubjectCard(subject) {
  const pct     = getPercentage(subject);
  const status  = getStatus(pct);
  const clamp   = Math.min(100, pct); // for progress bar width

  // Hint text
  let hintText = "";
  if (status === "safe") {
    const canSkip = classesCanSkip(subject);
    hintText = canSkip > 0
      ? `You can afford to miss ${canSkip} more class${canSkip !== 1 ? "es" : ""}.`
      : "Attend all upcoming classes to stay safe.";
  } else {
    const needed = classesNeededToRecover(subject);
    hintText = needed > 0
      ? `Attend the next ${needed} consecutive class${needed !== 1 ? "es" : ""} to reach 75%.`
      : "Attend all upcoming classes to recover.";
  }

  // Status label
  const statusLabels = {
    safe:    "🟢 Safe",
    warning: "🟡 Warning",
    danger:  "🔴 Danger",
  };

  // Build card element
  const card = document.createElement("article");
  card.className         = "subject-card";
  card.dataset.status    = status;
  card.dataset.id        = subject.id;
  card.setAttribute("aria-label", `${subject.name}: ${pct}% attendance, status ${status}`);

  card.innerHTML = `
    <div class="subject-card__header">
      <h3 class="subject-card__name">${escapeHtml(subject.name)}</h3>
      <div class="subject-card__actions" role="group" aria-label="Actions for ${escapeHtml(subject.name)}">
        <button
          class="btn btn--icon"
          aria-label="Edit ${escapeHtml(subject.name)}"
          data-action="edit"
          data-id="${subject.id}"
          title="Edit"
        >✏️</button>
        <button
          class="btn btn--icon"
          aria-label="Delete ${escapeHtml(subject.name)}"
          data-action="delete"
          data-id="${subject.id}"
          title="Delete"
        >🗑️</button>
      </div>
    </div>

    <div class="subject-card__stats">
      <span>Attended: <strong>${subject.attended}</strong></span>
      <span>Total: <strong>${subject.total}</strong></span>
      <span class="subject-card__percentage">${pct}%</span>
    </div>

    <div class="progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Attendance progress">
      <div class="progress-bar__fill" style="width: ${clamp}%;"></div>
    </div>

    <div>
      <span class="subject-card__badge">${statusLabels[status]}</span>
    </div>

    <p class="subject-card__hint">${hintText}</p>
  `;

  return card;
}

/**
 * Recompute and display summary statistics.
 */
function updateSummary() {
  if (subjects.length === 0) {
    summaryOverall.textContent = "—";
    summarySafe.textContent    = "0";
    summaryWarning.textContent = "0";
    summaryDanger.textContent  = "0";
    return;
  }

  let totalHeld     = 0;
  let totalAttended = 0;
  let safeCount     = 0;
  let warningCount  = 0;
  let dangerCount   = 0;

  subjects.forEach((subject) => {
    totalHeld     += subject.total;
    totalAttended += subject.attended;

    const status = getStatus(getPercentage(subject));
    if (status === "safe")    safeCount++;
    else if (status === "warning") warningCount++;
    else                      dangerCount++;
  });

  const overallPct = totalHeld > 0
    ? Math.round((totalAttended / totalHeld) * 1000) / 10
    : 0;

  summaryOverall.textContent = `${overallPct}%`;
  summarySafe.textContent    = safeCount;
  summaryWarning.textContent = warningCount;
  summaryDanger.textContent  = dangerCount;
}

/* 
   VALIDATION
    */

/**
 * Validate add/edit form inputs.
 * Returns an error message string, or null if inputs are valid.
 *
 * @param {string} name
 * @param {string} totalStr
 * @param {string} attendedStr
 * @returns {string|null}
 */
function validateInputs(name, totalStr, attendedStr) {
  if (!name.trim()) {
    return "Subject name cannot be empty.";
  }

  const total    = parseInt(totalStr, 10);
  const attended = parseInt(attendedStr, 10);

  if (isNaN(total) || total < 1) {
    return "Total classes must be a positive number.";
  }

  if (isNaN(attended) || attended < 0) {
    return "Attended classes cannot be negative.";
  }

  if (attended > total) {
    return "Attended classes cannot exceed total classes held.";
  }

  return null;
}

/* 
   CRUD OPERATIONS
    */

/**
 * Add a new subject from the add-form inputs.
 */
function addSubject() {
  const name      = inputName.value;
  const totalStr  = inputTotal.value;
  const attendStr = inputAttended.value;

  const error = validateInputs(name, totalStr, attendStr);
  if (error) {
    showError(formError, error);
    return;
  }

  hideError(formError);

  /** @type {Subject} */
  const subject = {
    id:       generateId(),
    name:     name.trim(),
    total:    parseInt(totalStr, 10),
    attended: parseInt(attendStr, 10),
  };

  subjects.push(subject);
  saveSubjects();
  render();

  // Reset form
  inputName.value     = "";
  inputTotal.value    = "";
  inputAttended.value = "";
  inputName.focus();
}

/**
 * Delete a subject by its ID.
 * @param {string} id
 */
function deleteSubject(id) {
  subjects = subjects.filter((s) => s.id !== id);
  saveSubjects();
  render();
}

/**
 * Open the edit modal pre-filled with the subject's current values.
 * @param {string} id
 */
function openEditModal(id) {
  const subject = subjects.find((s) => s.id === id);
  if (!subject) return;

  editingId               = id;
  editName.value          = subject.name;
  editTotal.value         = subject.total;
  editAttended.value      = subject.attended;

  hideError(editFormError);
  editModal.hidden = false;
  editName.focus();
}

/** Close the edit modal without saving. */
function closeEditModal() {
  editModal.hidden = true;
  editingId        = null;
}

/**
 * Save edits from the modal back to the subjects array.
 */
function saveEdit() {
  const name      = editName.value;
  const totalStr  = editTotal.value;
  const attendStr = editAttended.value;

  const error = validateInputs(name, totalStr, attendStr);
  if (error) {
    showError(editFormError, error);
    return;
  }

  hideError(editFormError);

  subjects = subjects.map((s) => {
    if (s.id !== editingId) return s;
    return {
      ...s,
      name:     name.trim(),
      total:    parseInt(totalStr, 10),
      attended: parseInt(attendStr, 10),
    };
  });

  saveSubjects();
  render();
  closeEditModal();
}

/**
 * Clear all subjects after a confirmation prompt.
 */
function clearAllSubjects() {
  if (!window.confirm("Are you sure you want to remove all subjects? This cannot be undone.")) {
    return;
  }
  subjects = [];
  saveSubjects();
  render();
}

/* 
   ERROR DISPLAY HELPERS
    */

/**
 * @param {HTMLElement} el
 * @param {string} message
 */
function showError(el, message) {
  el.textContent = message;
  el.hidden      = false;
}

/** @param {HTMLElement} el */
function hideError(el) {
  el.textContent = "";
  el.hidden      = true;
}

/* 
   SECURITY HELPER
    */

/**
 * Escape user-provided text before injecting into innerHTML.
 * Prevents stored-XSS from subject names.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* 
   EVENT LISTENERS
    */

// Add subject button
addSubjectBtn.addEventListener("click", addSubject);

// Allow Enter key in any input to submit the add form
[inputName, inputTotal, inputAttended].forEach((input) => {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addSubject();
  });
});

// Event delegation for edit / delete buttons on subject cards
subjectsGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const { action, id } = btn.dataset;
  if (action === "edit")   openEditModal(id);
  if (action === "delete") deleteSubject(id);
});

// Clear all
clearAllBtn.addEventListener("click", clearAllSubjects);

// Edit modal – save
saveEditBtn.addEventListener("click", saveEdit);

// Edit modal – cancel
cancelEditBtn.addEventListener("click", closeEditModal);

// Edit modal – close on overlay click
editModal.addEventListener("click", (e) => {
  if (e.target === editModal) closeEditModal();
});

// Edit modal – close on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !editModal.hidden) closeEditModal();
});

// Save edit on Enter inside modal inputs
[editName, editTotal, editAttended].forEach((input) => {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveEdit();
  });
});

/* 
   INITIALISE
    */

(function init() {
  subjects = loadSubjects();
  render();
})();