
// Navigation state management
let navigationState = {
    semester: null,
    branch: null,
    subject: null
};

function updateBreadcrumb(currentPage) {
    const breadcrumb = document.getElementById('breadcrumb');
    const parts = ['<a href="#" onclick="goHome()">Home</a>'];
    
    if (navigationState.semester) {
        parts.push(`<a href="#" onclick="goToSemester(${navigationState.semester})">Semester ${navigationState.semester}</a>`);
    }
    
    if (navigationState.branch) {
        parts.push(`<a href="#" onclick="goToBranch('${navigationState.branch}')">${navigationState.branch.toUpperCase()}</a>`);
    }
    
    if (navigationState.subject) {
        parts.push(navigationState.subject);
    }
    
    breadcrumb.innerHTML = parts.join(' > ');
}

function goHome() {
    navigationState = {
        semester: null,
        branch: null,
        subject: null
    };
    displaySemesters();
}

function goToSemester(semesterId) {
    navigationState.semester = semesterId;
    navigationState.branch = null;
    navigationState.subject = null;
    displayBranches(semesterId);
}

function goToBranch(branchId) {
    navigationState.branch = branchId;
    navigationState.subject = null;
    displaySubjects(navigationState.semester, branchId);
}

