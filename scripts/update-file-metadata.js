const fs = require('fs');
const path = require('path');

// Read the JSON file
const jsonPath = path.join(__dirname, '../data/notes-data.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const notesDir = path.join(__dirname, '../data/notes');

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function generateKeywords(filename, subjectName) {
    const name = filename.toLowerCase().replace('.pdf', '');
    const keywords = [];
    
    // Add subject abbreviation
    if (subjectName.toLowerCase().includes('computer network')) keywords.push('cn');
    else if (subjectName.toLowerCase().includes('research methodology')) keywords.push('rm');
    else if (subjectName.toLowerCase().includes('sepm')) keywords.push('sepm');
    else if (subjectName.toLowerCase().includes('theory of computation')) keywords.push('toc');
    else if (subjectName.toLowerCase().includes('dbms')) keywords.push('dbms');
    else if (subjectName.toLowerCase().includes('ada')) keywords.push('ada');
    
    // Add module/unit keywords
    if (name.includes('mod') || name.includes('module')) {
        const match = name.match(/(mod|module)\s*(\d+|[ivx]+)/i);
        if (match) keywords.push(`mod ${match[2]}`);
    }
    if (name.includes('unit')) {
        const match = name.match(/unit\s*(\d+)/i);
        if (match) keywords.push(`unit ${match[1]}`);
    }
    
    // Add common keywords
    if (name.includes('lab')) keywords.push('lab manual');
    if (name.includes('notes')) keywords.push('notes');
    
    return keywords.length ? keywords : [subjectName.toLowerCase().split(' ')[0]];
}

function createMaterialFromFile(filePath, stats) {
    const relativePath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
    const filename = path.basename(filePath, '.pdf');
    const pathParts = relativePath.split('/');
    const subjectName = pathParts[pathParts.length - 2] || 'Unknown';
    
    return {
        title: filename,
        description: `${subjectName} notes`,
        path: `../data/notes/${relativePath.split('data/notes/')[1]}`,
        type: 'pdf',
        size: formatFileSize(stats.size),
        uploadDate: stats.mtime.toISOString().split('T')[0],
        downloadUrl: `../data/notes/${relativePath.split('data/notes/')[1]}`,
        keywords: generateKeywords(filename, subjectName)
    };
}

function findSubjectByPath(filePath) {
    const pathParts = filePath.split(path.sep);
    const semesterMatch = pathParts.find(part => part.startsWith('semester-'));
    const branchMatch = pathParts.find(part => ['cse', 'ai', 'physics'].includes(part));
    const subjectMatch = pathParts[pathParts.length - 2];
    
    if (!semesterMatch || !branchMatch || !subjectMatch) return null;
    
    const semesterNum = parseInt(semesterMatch.split('-')[1]);
    const semester = data.semesters.find(s => s.id === semesterNum);
    if (!semester) return null;
    
    const branch = semester.branches.find(b => b.id === branchMatch);
    if (!branch) return null;
    
    // Enhanced subject matching
    const subjectLower = subjectMatch.toLowerCase();
    const subject = branch.subjects.find(s => {
        const subjectName = s.name.toLowerCase();
        
        // Direct matches
        if (subjectName === subjectLower) return true;
        if (subjectName.includes(subjectLower)) return true;
        if (subjectLower.includes(subjectName)) return true;
        
        // Special mappings
        const mappings = {
            'computer network': ['computer network', 'cn'],
            'research methadology': ['research methodology', 'rm'],
            'theory of computation': ['theory of computation', 'toc'],
            'operating-system': ['operating system', 'os'],
            'graph-theory': ['graph theory'],
            'microcontroller': ['microcontroller'],
            'manuals': ['lab manual'],
            'question': ['question papers', 'pyq'],
            'syllabus': ['syllabus'],
            'pyq': ['pyq', 'question papers'],
            'evs': ['evs'],
            'ai': ['ai'],
            'sepm': ['sepm']
        };
        
        for (const [folder, subjects] of Object.entries(mappings)) {
            if (subjectLower === folder && subjects.some(sub => subjectName.includes(sub))) {
                return true;
            }
        }
        
        return false;
    });
    
    return subject;
}

function scanForNewFiles() {
    const existingPaths = new Set();
    
    // Collect existing file paths
    data.semesters.forEach(semester => {
        semester.branches.forEach(branch => {
            branch.subjects.forEach(subject => {
                subject.materials.forEach(material => {
                    existingPaths.add(material.path);
                });
            });
        });
    });
    
    // Scan directory for PDF files
    function scanDirectory(dir) {
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
                scanDirectory(fullPath);
            } else if (item.endsWith('.pdf')) {
                const relativePath = path.relative(path.join(__dirname, '..'), fullPath).replace(/\\/g, '/');
                const materialPath = `../${relativePath}`;
                
                if (!existingPaths.has(materialPath)) {
                    const subject = findSubjectByPath(fullPath);
                    if (subject) {
                        const newMaterial = createMaterialFromFile(fullPath, stats);
                        subject.materials.push(newMaterial);
                        console.log(`Added: ${newMaterial.title} to ${subject.name}`);
                    } else {
                        console.log(`No subject found for: ${relativePath}`);
                    }
                }
            }
        });
    }
    
    scanDirectory(notesDir);
}

function updateMaterialMetadata(material) {
    let filePath = material.path;
    if (filePath.startsWith('../data/')) {
        filePath = path.join(__dirname, '..', filePath.substring(3));
    } else if (filePath.startsWith('/data/')) {
        filePath = path.join(__dirname, '..', filePath.substring(1));
    }
    
    try {
        const stats = fs.statSync(filePath);
        material.size = formatFileSize(stats.size);
        material.uploadDate = stats.mtime.toISOString().split('T')[0];
        console.log(`Updated: ${material.title} - ${material.size}`);
    } catch (error) {
        console.log(`File not found: ${filePath}`);
    }
}

// Scan for new files first
scanForNewFiles();

// Update metadata for all materials
data.semesters.forEach(semester => {
    semester.branches.forEach(branch => {
        branch.subjects.forEach(subject => {
            subject.materials.forEach(updateMaterialMetadata);
        });
    });
});

// Write back to file
fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
console.log('File metadata updated successfully!');