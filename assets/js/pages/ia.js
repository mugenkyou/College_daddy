
// Grade scale definition
const gradeScale = [
    { grade: 'O', points: 10, minMarks: 90 },
    { grade: 'A+', points: 9, minMarks: 80 },
    { grade: 'A', points: 8, minMarks: 70 },
    { grade: 'B+', points: 7, minMarks: 60 },
    { grade: 'C+', points: 6, minMarks: 50 },
    { grade: 'C', points: 5, minMarks: 40 },
    { grade: 'F', points: 0, minMarks: 0 }
];

// Utility function to safely get input values with error handling
function getInputValue(id) {
    try {
        const input = document.getElementById(id);
        if (!input) {
            console.warn(`Input element with id '${id}' not found`);
            return 0;
        }
        const value = input.value.trim();
        if (!value) return 0;
        
        const numValue = parseFloat(value);
        return isNaN(numValue) ? 0 : numValue;
    } catch (error) {
        console.error(`Error getting input value for ${id}:`, error);
        return 0;
    }
}

// Toggle lab assessment section visibility
function toggleLabSection() {
    try {
        const isLabMode = document.getElementById('labMode')?.checked || false;
        const labSection = document.getElementById('labSection');
        const labResults = document.getElementById('labResults');
        const totalMarks = document.getElementById('totalMarks');
        const gradeTable = document.getElementById('gradeTable');
        const resultsSection = document.getElementById('results');

        if (labSection) {
            labSection.style.display = isLabMode ? 'block' : 'none';
        }
        if (labResults) {
            labResults.style.display = isLabMode ? 'block' : 'none';
        }
        if (totalMarks) {
            totalMarks.textContent = `0/${isLabMode ? '75' : '50'}`;
        }
        if (gradeTable) {
            const thirdHeader = gradeTable.querySelector('thead th:last-child');
            if (thirdHeader) {
                thirdHeader.textContent = isLabMode ? 'Achievable Grade' : 'Required SEE Marks';
            }
            gradeTable.style.display = 'none';
        }
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }

        // Reset form
        document.getElementById('marksForm').reset();
        
        // Reset all result displays
        resetDisplays();
    } catch (error) {
        console.error('Error in toggleLabSection:', error);
    }
}

// Reset all displays
function resetDisplays() {
    try {
        const elements = {
            'scaledSeries': '0/30',
            'scaledAssignments': '0/10',
            'scaledModules': '0/10',
            'graceMarksDisplay': '0',
            'labInternalMarks': '0/25',
            'labExternalMarks': '0/25'
        };

        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }

        const eligibilityDiv = document.getElementById('eligibility');
        if (eligibilityDiv) {
            eligibilityDiv.innerHTML = '';
            eligibilityDiv.className = 'eligibility';
        }
    } catch (error) {
        console.error('Error in resetDisplays:', error);
    }
}

// Calculate marks based on the selected mode
function calculateMarks(event) {
    try {
        if (event) {
            event.preventDefault();
        }

        const isLabMode = document.getElementById('labMode')?.checked || false;
        const resultsSection = document.getElementById('results');
        
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }

        isLabMode ? calculateLabMode() : calculateRegularMode();
    } catch (error) {
        console.error('Error in calculateMarks:', error);
    }
}

function calculateRegularMode() {
    try {
        const series1 = getInputValue('series1');
        const series2 = getInputValue('series2');
        const series3 = getInputValue('series3');
        const assignment1 = getInputValue('assignment1');
        const assignment2 = getInputValue('assignment2');
        const module1 = getInputValue('module1');
        const module2 = getInputValue('module2');
        const module3 = getInputValue('module3');
        const graceMarks = getInputValue('graceMarks');

        // Calculate scaled marks
        const seriesAvg = (series1 + series2 + series3) / 3;
        const scaledSeries = (seriesAvg / 50) * 30;
0
        const assignmentTotal = assignment1 + assignment2;
        const scaledAssignments = (assignmentTotal / 20) * 10;

        const moduleTotal = module1 + module2 + module3;
        const scaledModules = (moduleTotal / 30) * 10;

        // Update displays
        updateScaledMarksDisplay(scaledSeries, scaledAssignments, scaledModules, graceMarks);

        // Calculate total
        const total = scaledSeries + scaledAssignments + scaledModules + graceMarks;
        
        const totalMarksElement = document.getElementById('totalMarks');
        if (totalMarksElement) {
            totalMarksElement.textContent = `${total.toFixed(2)}/50`;
        }

        // Calculate raw total for eligibility
        const rawTotal = series1 + series2 + series3 + assignment1 + assignment2 + 
                        module1 + module2 + module3;
        const maxPossible = 150; // 50 + 20 + 30 = 100 total possible raw marks
        const percentage = (rawTotal / maxPossible) * 100;

        // Check eligibility using total scaled marks (out of 50)
        const isEligible = total >= 20;

        const eligibilityDiv = document.getElementById('eligibility');
        const gradeTable = document.getElementById('gradeTable');
        
        if (eligibilityDiv) {
            eligibilityDiv.className = `eligibility ${isEligible ? 'eligible' : 'not-eligible'}`;
            eligibilityDiv.innerHTML = isEligible ?
                '<i class="fas fa-check-circle"></i> Eligible to attempt SEE exam' :
                '<i class="fas fa-times-circle"></i> Not eligible to attempt SEE exam';
        }

        if (gradeTable) {
            gradeTable.style.display = isEligible ? 'table' : 'none';
            if (isEligible) {
                displayGradeTable(total, false);
            }
        }
    } catch (error) {
        console.error('Error in calculateRegularMode:', error);
    }
}

function calculateLabMode() {
    try {
        // Get all marks
        const series1 = getInputValue('series1');
        const series2 = getInputValue('series2');
        const series3 = getInputValue('series3');
        const assignment1 = getInputValue('assignment1');
        const assignment2 = getInputValue('assignment2');
        const module1 = getInputValue('module1');
        const module2 = getInputValue('module2');
        const module3 = getInputValue('module3');
        const labInternal = getInputValue('labInternal');
        const labExternal = getInputValue('labExternal');

        // Calculate internal components first (for eligibility)
        const seriesAvg = (series1 + series2 + series3) / 3;
        const scaledSeries = (seriesAvg / 50) * 30;

        const assignmentTotal = assignment1 + assignment2;
        const scaledAssignments = (assignmentTotal / 20) * 10;

        const moduleTotal = module1 + module2 + module3;
        const scaledModules = (moduleTotal / 30) * 10;

        // Calculate total internal marks (out of 50 for eligibility check)
        const totalInternal = scaledSeries + scaledAssignments + scaledModules;

        // Lab components (each out of 25)
        const labInternalMarks = labInternal / 2;
        const labExternalMarks = labExternal / 2;

        // Calculate final total (out of 75)
        const total = (totalInternal / 2) + labInternalMarks + labExternalMarks;

        // Update displays
        updateScaledMarksDisplay(scaledSeries, scaledAssignments, scaledModules, 0);
        updateLabMarksDisplay(labInternalMarks, labExternalMarks);

        // Update total marks display
        const totalMarksElement = document.getElementById('totalMarks');
        if (totalMarksElement) {
            totalMarksElement.textContent = `${total.toFixed(2)}/75`;
        }

        // Check eligibility based on internal marks (must be >= 20 out of 50)
        const isEligible = totalInternal >= 20;

        // Update eligibility display
        const eligibilityDiv = document.getElementById('eligibility');
        if (eligibilityDiv) {
            eligibilityDiv.className = `eligibility ${isEligible ? 'eligible' : 'not-eligible'}`;
            eligibilityDiv.innerHTML = isEligible ?
                '<i class="fas fa-check-circle"></i> Eligible for SEE exam' :
                '<i class="fas fa-times-circle"></i> Not eligible for SEE exam';
        }

        // Show grade table for eligible students
        const gradeTable = document.getElementById('gradeTable');
        if (gradeTable) {
            gradeTable.style.display = isEligible ? 'table' : 'none';
            if (isEligible) {
                const percentage = (total / 75) * 100;
                displayGradeTable(percentage, true);
            }
        }
    } catch (error) {
        console.error('Error in calculateLabMode:', error);
        alert('An error occurred while calculating marks. Please check your inputs and try again.');
    }
}

function updateScaledMarksDisplay(series, assignments, modules, grace) {
    try {
        const elements = {
            'scaledSeries': `${series.toFixed(2)}/30`,
            'scaledAssignments': `${assignments.toFixed(2)}/10`,
            'scaledModules': `${modules.toFixed(2)}/10`,
            'graceMarksDisplay': grace.toFixed(2)
        };

        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }
    } catch (error) {
        console.error('Error in updateScaledMarksDisplay:', error);
    }
}

function updateLabMarksDisplay(internal, external) {
    try {
        const elements = {
            'labInternalMarks': `${internal.toFixed(2)}/25`,
            'labExternalMarks': `${external.toFixed(2)}/25`
        };

        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }
    } catch (error) {
        console.error('Error in updateLabMarksDisplay:', error);
    }
}

function displayGradeTable(currentMarks, isLabMode) {
    try {
        const tbody = document.getElementById('gradeTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        gradeScale.forEach(({ grade, points, minMarks }) => {
            if (isLabMode) {
                // For lab mode, calculate required SEE marks
                // Current marks are out of 75, need to convert to percentage
                const currentPercentage = (currentMarks / 75) * 50; // Convert to 50 marks scale
                const requiredSEE = Math.ceil((minMarks - currentPercentage) * 2);
                
                // Only show grades that are achievable (SEE marks <= 100)
                if (requiredSEE <= 100 && requiredSEE > 0) {
                    addGradeRow(tbody, grade, points, requiredSEE);
                }
            } else {
                // Regular mode calculation remains the same
                const requiredSEE = Math.ceil((minMarks - currentMarks) * 2);
                if (requiredSEE <= 100 && requiredSEE > 0) {
                    addGradeRow(tbody, grade, points, requiredSEE);
                }
            }
        });
    } catch (error) {
        console.error('Error in displayGradeTable:', error);
    }
}

function addGradeRow(tbody, grade, points, marks) {
    try {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${grade}</td>
            <td>${points}</td>
            <td>${marks}</td>
        `;
        tbody.appendChild(row);
    } catch (error) {
        console.error('Error in addGradeRow:', error);
    }
}

function validateInput(input) {
    try {
        if (!input) return;
        
        if (input.value.trim() === '') {
            input.value = '';
            return;
        }

        const min = parseFloat(input.min) || 0;
        const max = parseFloat(input.max) || 100;
        const step = parseFloat(input.step) || 0.5;
        let value = parseFloat(input.value);

        if (!isNaN(value)) {
            value = Math.round(value / step) * step;
            value = Math.min(Math.max(value, min), max);
            input.value = value;
        }
    } catch (error) {
        console.error('Error in validateInput:', error);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    try {
        const menuButton = document.querySelector('.menu-button');
        const navLinks = document.querySelector('.nav-links');

        if (menuButton && navLinks) {
            menuButton.addEventListener('click', function() {
                navLinks.classList.toggle('active');
                this.setAttribute('aria-expanded', navLinks.classList.contains('active'));
            });
        }

        const form = document.getElementById('marksForm');
        if (form) {
            form.addEventListener('submit', calculateMarks);
        }

        const labMode = document.getElementById('labMode');
        if (labMode) {
            labMode.addEventListener('change', toggleLabSection);
        }

        const inputs = document.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                validateInput(this);
            });
        });
        const feedbackLink = document.querySelector('.feedback-link');

        feedbackLink.addEventListener('click', (e) => {
            const ripple = document.createElement('div');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            ripple.style.width = '20px';
            ripple.style.height = '20px';
            ripple.style.transform = 'translate(-50%, -50%)';
            ripple.style.animation = 'ripple 0.6s linear';
            ripple.style.left = `${e.clientX - e.target.offsetLeft}px`;
            ripple.style.top = `${e.clientY - e.target.offsetTop}px`;
        
            feedbackLink.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                0% {
                    width: 0;
                    height: 0;
                    opacity: 0.5;
                }
                100% {
                    width: 200px;
                    height: 200px;
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        toggleLabSection();
    } catch (error) {
        console.error('Error in initialization:', error);
    }
});

/* back to top */
const backToTopBtn = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    backToTopBtn.style.display = "flex";
  } else {
    backToTopBtn.style.display = "none";
  }
});

backToTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}); 