// Search functionality
const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', debounce(handleSearch, 300));

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    if (!searchTerm) {
        displaySemesters();
        return;
    }

    const results = searchNotes(searchTerm);
    displaySearchResults(results);
}

function searchNotes(term) {
    const results = [];

    window.notesData.semesters.forEach(semester => {
        semester.branches.forEach(branch => {
            branch.subjects.forEach(subject => {
                subject.materials.forEach(material => {
                    if (material.title.toLowerCase().includes(term) ||
                        material.description.toLowerCase().includes(term) ||
                        (material.keywords && material.keywords.some(keyword =>
                            keyword.toLowerCase().includes(term)
                        ))) {
                        results.push({
                            semester: semester.name,
                            semesterId: semester.id,
                            branch: branch.name,
                            branchId: branch.id,
                            subject: subject.name,
                            material: material
                        });
                    }
                });
            });
        });
    });

    return results;
}

function displaySearchResults(results) {
    const content = document.getElementById('content');
    content.innerHTML = '';
    content.className = 'search-results-container';

    if (results.length === 0) {
        content.innerHTML = '<div class="no-results">No results found</div>';
        return;
    }

    // Add results count
    const resultCount = document.createElement('div');
    resultCount.className = 'result-count';
    resultCount.textContent = `Found ${results.length} results`;
    content.appendChild(resultCount);

    results.forEach(result => {
        const card = document.createElement('div');
        card.className = 'card search-result material-card';

        // Format the date if it exists
        const uploadDate = result.material.uploadDate ?
            new Date(result.material.uploadDate).toLocaleDateString() : 'N/A';
        const fileUrl = getMaterialFileUrl(result.material.path || '');
        const contextText = `${result.semester} | ${result.branch} | ${result.subject}`;

        card.innerHTML = `
            <div class="card-content">
                <h3>${sanitizeHTML(result.material.title || 'Untitled notes')}</h3>
                <p class="description">${sanitizeHTML(result.material.description || 'No description available.')}</p>
                <div class="metadata">
                    <span class="material-path">${sanitizeHTML(contextText)}</span>
                    <span class="file-info">${sanitizeHTML((result.material.type || 'pdf').toUpperCase())} &bull; ${sanitizeHTML(result.material.size || 'Unknown')} &bull; Upload: ${uploadDate}</span>
                </div>
            </div>
            ${createPdfPreviewHTML(result.material, fileUrl)}
            <div class="card-actions">
                ${createNoteActionsHTML(result.material, contextText)}
            </div>
        `;

        // Remove cursor pointer style
        card.style.cursor = 'default';

        content.appendChild(card);
        setupMaterialCardInteractions(card);
    });
}

// Utility function to prevent too many search operations while typing
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}
