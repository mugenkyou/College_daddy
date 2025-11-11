document.addEventListener('DOMContentLoaded', async () => {
  const semesterSelect = document.getElementById('semester');
  const branchSelect = document.getElementById('branch');
  const subjectSelect = document.getElementById('subject');
  const result = document.getElementById('result');
  const materialsDiv = document.getElementById('materials');

  let notesData;
  async function loadNotesData() {
    try {
      const res = await fetch('/data/notes-data.json?_=' + Date.now());
      notesData = await res.json();
    } catch (e) {
      result.textContent = 'Failed to load notes data.';
      result.className = 'error';
      return false;
    }
    return true;
  }

  function getSelectedSubject() {
    const sem = notesData.semesters.find(s => s.id == semesterSelect.value);
    if (!sem) return null;
    const branch = sem.branches.find(b => b.id == branchSelect.value);
    if (!branch) return null;
    return branch.subjects.find(sub => sub.id == subjectSelect.value) || null;
  }

  function renderMaterials() {
    const subject = getSelectedSubject();
    if (!subject || !subject.materials || subject.materials.length === 0) {
      materialsDiv.innerHTML = '<div style="color:var(--text-tertiary);">No materials uploaded yet.</div>';
      return;
    }
    materialsDiv.innerHTML = subject.materials.slice(-5).reverse().map(mat => `
      <div class="material-item">
        <div class="material-title">${mat.title}</div>
        <div class="material-desc">${mat.description}</div>
        <div class="material-date">${mat.uploadDate || ''}</div>
        <a class="material-link" href="${mat.downloadUrl}" target="_blank">Download</a>
      </div>
    `).join('');
  }

  async function populateDropdownsAndMaterials() {
    const ok = await loadNotesData();
    if (!ok) return;
    // Populate semesters
    semesterSelect.innerHTML = '';
    notesData.semesters.forEach(sem => {
      const opt = document.createElement('option');
      opt.value = sem.id;
      opt.textContent = sem.name;
      semesterSelect.appendChild(opt);
    });
    populateBranches();
  }

  function populateBranches() {
    branchSelect.innerHTML = '';
    subjectSelect.innerHTML = '';
    const sem = notesData.semesters.find(s => s.id == semesterSelect.value);
    if (!sem) return;
    sem.branches.forEach(branch => {
      const opt = document.createElement('option');
      opt.value = branch.id;
      opt.textContent = branch.name;
      branchSelect.appendChild(opt);
    });
    populateSubjects();
  }

  function populateSubjects() {
    subjectSelect.innerHTML = '';
    const sem = notesData.semesters.find(s => s.id == semesterSelect.value);
    if (!sem) return;
    const branch = sem.branches.find(b => b.id == branchSelect.value);
    if (!branch) return;
    branch.subjects.forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub.id;
      opt.textContent = sub.name;
      subjectSelect.appendChild(opt);
    });
    renderMaterials();
  }

  semesterSelect.addEventListener('change', () => {
    populateBranches();
    renderMaterials();
  });
  branchSelect.addEventListener('change', () => {
    populateSubjects();
    renderMaterials();
  });
  subjectSelect.addEventListener('change', renderMaterials);

  // Initial population
  await populateDropdownsAndMaterials();

  // Show upload result and update materials list
  const form = document.getElementById('uploadForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    result.textContent = 'Uploading...';
    result.className = '';
    const formData = new FormData(form);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        result.textContent = data.message;
        result.className = 'success';
        form.reset();
        await populateDropdownsAndMaterials();
        // Set dropdowns back to previous selection
        renderMaterials();
      } else {
        result.textContent = data.message || 'Upload failed.';
        result.className = 'error';
      }
    } catch (err) {
      result.textContent = 'Upload failed.';
      result.className = 'error';
    }
  });
}); 

