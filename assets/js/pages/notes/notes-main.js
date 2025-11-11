// Main application logic
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadData();
        displaySemesters();
        updateBreadcrumb();
    } catch (error) {
        showError('Failed to load data');
    }
});

async function loadData() {
    try {
        const response = await fetch('../data/notes-data.json');
        if (!response.ok) throw new Error('Failed to load data');
        window.notesData = await response.json();
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load data. Please try again later.');
    }
}

function displaySemesters() {
    const content = document.getElementById('content');
    content.className = 'grid';
    content.innerHTML = '';

    window.notesData.semesters.forEach(semester => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h2>Semester ${semester.id}</h2>`;
        card.onclick = () => displayBranches(semester.id);
        content.appendChild(card);
    });
}

function displayBranches(semesterId) {
    const semester = window.notesData.semesters.find(s => s.id === semesterId);
    const content = document.getElementById('content');
    content.innerHTML = '';

    semester.branches.forEach(branch => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h2>${branch.name}</h2>`;
        card.onclick = () => displaySubjects(semesterId, branch.id);
        content.appendChild(card);
    });

    navigationState.semester = semesterId;
    updateBreadcrumb();
}

function displaySubjects(semesterId, branchId) {
    const semester = window.notesData.semesters.find(s => s.id === semesterId);
    const branch = semester.branches.find(b => b.id === branchId);
    const content = document.getElementById('content');
    content.innerHTML = '';

    branch.subjects.forEach(subject => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h2>${subject.name}</h2>`;
        card.onclick = () => displayMaterials(semesterId, branchId, subject.id);
        content.appendChild(card);
    });

    navigationState.semester = semesterId;
    navigationState.branch = branchId;
    updateBreadcrumb();
}

function displayMaterials(semesterId, branchId, subjectId) {
    const semester = window.notesData.semesters.find(s => s.id === semesterId);
    const branch = semester.branches.find(b => b.id === branchId);
    const subject = branch.subjects.find(s => s.id === subjectId);
    const content = document.getElementById('content');
    content.innerHTML = '';
    content.className = 'materials-container'; // Remove grid class to prevent cards from being clickable

    // Detect if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    subject.materials.forEach(material => {
        const card = document.createElement('div');
        card.className = 'card material-card'; // Add specific class for material cards

        // Get the material data
        const filePath = material.path || '';

        // Get absolute path for PDF files
        let absoluteFilePath = filePath;
        if (filePath.startsWith('/')) {
            absoluteFilePath = window.location.origin + filePath;
        }

        const uploadDate = material.uploadDate ? new Date(material.uploadDate).toLocaleDateString() : 'Unknown';

        // Create a safe download filename
        const safeFileName = material.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';

        // Get thumbnail URL if available
        const thumbnailUrl = material.thumbnailUrl || '';
        const hasThumbnail = thumbnailUrl && thumbnailUrl.length > 0;

        // Create the card content with thumbnail if available
        let thumbnailHTML = '';
        if (hasThumbnail) {
            thumbnailHTML = `
                <div class="thumbnail-container">
                    <img src="${thumbnailUrl}" alt="PDF Preview" class="material-thumbnail" 
                         onerror="this.style.display='none'">
                </div>
            `;
        }

        // Create the card content - important: no onclick attribute
        card.innerHTML = `
            ${thumbnailHTML}
            <div class="card-header">
                <h3>${material.title}</h3>
                <p>${material.description}</p>
                <p><span class="meta-label">Size:</span> ${material.size || 'Unknown'}</p>
                <p><span class="meta-label">Uploaded:</span> ${uploadDate}</p>
            </div>
            <div class="card-actions">
                <a href="${absoluteFilePath}" 
                   target="_blank" class="view-btn">
                    View PDF
                </a>
                <a href="${absoluteFilePath}" download="${safeFileName}" class="download-btn">
                    Download
                </a>
            </div>
        `;

        // Remove cursor pointer style
        card.style.cursor = 'default';

        content.appendChild(card);
    });

    navigationState.semester = semesterId;
    navigationState.branch = branchId;
    navigationState.subject = subjectId;
    updateBreadcrumb();
}

// Function to safely add new material and prevent duplicates
function addMaterial(semesterId, branchName, subjectName, newMaterial) {
    // Find the correct subject in the data
    const semester = window.notesData.semesters.find(s => s.id === semesterId);
    if (!semester) {
        showError('Semester not found.');
        return;
    }

    const branch = semester.branches.find(b => b.name.toLowerCase() === branchName.toLowerCase() || b.id.toLowerCase() === branchName.toLowerCase());
    if (!branch) {
        showError('Branch not found.');
        return;
    }

    const subject = branch.subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase() || s.id.toLowerCase() === subjectName.toLowerCase());
    if (!subject) {
        showError('Subject not found.');
        return;
    }

    // Check for duplicate material by title or file path
    const duplicate = subject.materials.find(material =>
        material.title.trim().toLowerCase() === newMaterial.title.trim().toLowerCase() ||
        material.path.trim().toLowerCase() === newMaterial.path.trim().toLowerCase()
    );

    if (duplicate) {
        showError(`Duplicate file "${newMaterial.title}" detected. Upload skipped.`);
        return;
    }

    // If not duplicate, add it safely
    subject.materials.push(newMaterial);

    // Optionally save or update JSON file (depends on backend)
    console.log(`Added material "${newMaterial.title}" successfully.`);
}


