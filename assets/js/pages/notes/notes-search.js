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

    // Detect if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    results.forEach(result => {
        const card = document.createElement('div');
        card.className = 'card search-result material-card';
        
        // Format the date if it exists
        const uploadDate = result.material.uploadDate ? 
            new Date(result.material.uploadDate).toLocaleDateString() : 'N/A';
        
        // Use path directly for the file path
        const filePath = result.material.path || '';
        
        // Get absolute path for PDF files
        let absoluteFilePath = filePath;
        if (filePath.startsWith('/')) {
            absoluteFilePath = window.location.origin + filePath;
        }
        
        // Create a safe download filename
        const safeFileName = result.material.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
        
        card.innerHTML = `
            <div class="card-content">
                <h3>${result.material.title}</h3>
                <p class="description">${result.material.description}</p>
                <div class="metadata">
                    <span class="material-path">${result.semester} | ${result.branch} | ${result.subject}</span>
                    <span class="file-info">${result.material.type.toUpperCase()} • ${result.material.size || 'Unknown'} • Upload: ${uploadDate}</span>
                </div>
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
}

// Utility function to prevent too many search operations while typing
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

