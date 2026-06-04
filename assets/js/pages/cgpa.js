// Chart variables
let progressChart = null;
let semesterChart = null;

// Company data
const companyTiers = {
    'S+': { minCGPA: 8.0, companies: [], ctc: '₹30+ LPA' },
    'A+': { minCGPA: 7.5, companies: [], ctc: '₹20-30 LPA' },
    'A': { minCGPA: 7.5, companies: [], ctc: '₹10-20 LPA' },
    'B': { minCGPA: 7.0, companies: [], ctc: '₹5-10 LPA' },
    'C': { minCGPA: 6.0, companies: [], ctc: 'Below ₹5 LPA' }
};

const companyData = [
    // S+ Tier Companies (₹30+ LPA)
    { name: 'McKinsey & Company', tier: 'S+', cgpa: 8.0 },
    { name: 'Boston Consulting Group', tier: 'S+', cgpa: 8.0 },
    { name: 'Bain & Company', tier: 'S+', cgpa: 8.0 },
    { name: 'Goldman Sachs', tier: 'S+', cgpa: 8.0 },
    { name: 'Morgan Stanley', tier: 'S+', cgpa: 8.0 },
    { name: 'Tower Research Capital', tier: 'S+', cgpa: 8.0 },
    { name: 'Jane Street', tier: 'S+', cgpa: 8.0 },
    { name: 'Google', tier: 'S+', cgpa: 8.0 },
    { name: 'Facebook', tier: 'S+', cgpa: 8.0 },
    { name: 'Apple', tier: 'S+', cgpa: 8.0 },
    { name: 'Microsoft', tier: 'S+', cgpa: 7.5 },
    { name: 'Amazon (for select roles)', tier: 'S+', cgpa: 7.5 },
    { name: 'Uber (for select roles)', tier: 'S+', cgpa: 7.5 },
    { name: 'DE Shaw & Co.', tier: 'S+', cgpa: 8.0 },
    { name: 'WorldQuant', tier: 'S+', cgpa: 8.0 },
    { name: 'BlackRock', tier: 'S+', cgpa: 7.5 },

    // A+ Tier Companies (₹20-30 LPA)
    { name: 'Adobe', tier: 'A+', cgpa: 7.5 },
    { name: 'Oracle', tier: 'A+', cgpa: 7.5 },
    { name: 'SAP Labs', tier: 'A+', cgpa: 7.5 },
    { name: 'Cisco Systems', tier: 'A+', cgpa: 7.5 },
    { name: 'Qualcomm', tier: 'A+', cgpa: 7.5 },
    { name: 'Intel', tier: 'A+', cgpa: 7.5 },
    { name: 'Samsung R&D', tier: 'A+', cgpa: 7.5 },
    { name: 'Flipkart', tier: 'A+', cgpa: 7.5 },
    { name: 'Myntra', tier: 'A+', cgpa: 7.5 },
    { name: 'Ola Cabs', tier: 'A+', cgpa: 7.5 },
    { name: 'Paytm', tier: 'A+', cgpa: 7.5 },
    { name: 'Zomato', tier: 'A+', cgpa: 7.5 },
    { name: 'Swiggy', tier: 'A+', cgpa: 7.5 },
    { name: 'Infosys (for select roles)', tier: 'A+', cgpa: 7.5 },
    { name: 'Wipro (for select roles)', tier: 'A+', cgpa: 7.5 },
    { name: 'Tata Consultancy Services (for select roles)', tier: 'A+', cgpa: 7.5 },
    { name: 'Reliance Industries (for select roles)', tier: 'A+', cgpa: 7.5 },

    // A Tier Companies (₹10-20 LPA)
    { name: 'IBM India', tier: 'A', cgpa: 7.5 },
    { name: 'HCL Technologies', tier: 'A', cgpa: 7.5 },
    { name: 'Tech Mahindra', tier: 'A', cgpa: 7.5 },
    { name: 'Cognizant', tier: 'A', cgpa: 7.5 },
    { name: 'Capgemini', tier: 'A', cgpa: 7.5 },
    { name: 'Mindtree', tier: 'A', cgpa: 7.0 },
    { name: 'Mphasis', tier: 'A', cgpa: 7.0 },
    { name: 'Hexaware Technologies', tier: 'A', cgpa: 7.0 },
    { name: 'Birlasoft', tier: 'A', cgpa: 7.0 },
    { name: 'Cyient', tier: 'A', cgpa: 7.0 },
    { name: 'KPIT Technologies', tier: 'A', cgpa: 7.0 },
    { name: 'L&T Infotech', tier: 'A', cgpa: 7.5 },
    { name: 'Sonata Software', tier: 'A', cgpa: 7.0 },
    { name: 'Sasken Technologies', tier: 'A', cgpa: 7.0 },

    // B Tier Companies (₹5-10 LPA)
    { name: 'Small startups or entry-level roles in various industries', tier: 'B', cgpa: 6.0 },
    { name: 'ABC Tech Solutions', tier: 'B', cgpa: 6.0 },
    { name: 'XYZ Innovations', tier: 'B', cgpa: 6.0 },
    { name: 'PQR Software', tier: 'B', cgpa: 6.0 },
    { name: 'Startup A', tier: 'B', cgpa: 6.0 },
    { name: 'Tech Co.', tier: 'B', cgpa: 6.0 },
    { name: 'Data Systems', tier: 'B', cgpa: 6.0 },
    { name: 'Future Tech', tier: 'B', cgpa: 6.0 },
    { name: 'Innovate Solutions', tier: 'B', cgpa: 6.0 },
    { name: 'Creative Labs', tier: 'B', cgpa: 6.0 },
    { name: 'WNS Global Services', tier: 'B', cgpa: 7.5 },
    { name: 'EXL Service', tier: 'B', cgpa: 7.5 },
    { name: 'Genpact', tier: 'B', cgpa: 7.5 },
    { name: 'Hinduja Global Solutions', tier: 'B', cgpa: 7.5 },

    // C Tier Companies (Below ₹5 LPA)
    { name: 'Firstsource Solutions', tier: 'C', cgpa: 6.0 },
    { name: 'Concentrix', tier: 'C', cgpa: 6.0 },
    { name: 'Sutherland Global Services', tier: 'C', cgpa: 6.0 },
    { name: 'Teleperformance', tier: 'C', cgpa: 6.0 },
    { name: 'Infosys BPM', tier: 'C', cgpa: 6.0 },
    { name: 'Wipro BPS', tier: 'C', cgpa: 6.0 },
    { name: 'TCS BPS', tier: 'C', cgpa: 6.0 },
    { name: 'HGS', tier: 'C', cgpa: 6.0 },
    { name: 'Tech Mahindra BPS', tier: 'C', cgpa: 6.0 },
    { name: 'Accenture Operations', tier: 'C', cgpa: 6.0 },
    { name: 'Capgemini BPO', tier: 'C', cgpa: 6.0 },
    { name: 'Genpact Headstrong', tier: 'C', cgpa: 6.0 },
    { name: 'IBM Global Process Services', tier: 'C', cgpa: 6.0 },
    { name: 'Cognizant BPS', tier: 'C', cgpa: 6.0 },
    { name: 'Dell International Services', tier: 'C', cgpa: 6.0 },
    { name: 'Wipro Technologies', tier: 'C', cgpa: 6.0 },
    { name: 'Tata Elxsi', tier: 'C', cgpa: 6.0 },
    { name: 'Sasken Communication Technologies', tier: 'C', cgpa: 6.0 },
    { name: 'Mphasis Limited', tier: 'C', cgpa: 6.0 },
    { name: 'Oracle Financial Services Software', tier: 'C', cgpa: 6.0 },
    { name: 'Siemens Information Systems', tier: 'C', cgpa: 6.0 },
    { name: 'Robert Bosch Engineering', tier: 'C', cgpa: 6.0 },
    { name: 'Honeywell Technology Solutions', tier: 'C', cgpa: 6.0 },
    { name: 'GE India Technology Centre', tier: 'C', cgpa: 6.0 }
];


// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function () {
    // Hide all result sections initially
    hideAllSections();

    // Initialize data and event listeners
    initializeAll();

    // Add calculate button event listener
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculate);
    }
});

function hideAllSections() {
    const sectionsToHide = [
        'result',
        'charts-section',
        'company-eligibility',
        'error'
    ];

    sectionsToHide.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });

    // Hide visual dashboard
    const dashboard = document.getElementById('visual-dashboard');
    if (dashboard) {
        dashboard.classList.remove('visible');
    }
}

function initializeAll() {
    initializeTooltips();
    initializeCompanyData();
}

function initializeTooltips() {
    document.querySelectorAll('.tooltip i').forEach(tooltip => {
        const title = tooltip.getAttribute('title');

        tooltip.addEventListener('mouseenter', (e) => {
            const tooltipDiv = document.createElement('div');
            tooltipDiv.className = 'tooltip-content';
            tooltipDiv.textContent = title;
            tooltip.parentNode.appendChild(tooltipDiv);
            tooltip.removeAttribute('title');
        });

        tooltip.addEventListener('mouseleave', (e) => {
            const tooltipDiv = e.target.parentNode.querySelector('.tooltip-content');
            if (tooltipDiv) {
                tooltip.setAttribute('title', tooltipDiv.textContent);
                tooltipDiv.remove();
            }
        });
    });
}

function initializeCompanyData() {
    companyData.forEach(company => {
        companyTiers[company.tier].companies.push(company);
    });
}

function calculate() {
    // Reset display
    hideAllSections();

    // Get input values
    const scale = parseFloat(document.getElementById('cgpaScale').value);
    const currentCGPA = parseFloat(document.getElementById('currentCGPA').value);
    const completedSem = parseInt(document.getElementById('completedSem').value);
    const targetCGPA = parseFloat(document.getElementById('targetCGPA').value);

    // Validate inputs
    if (!validateInputs(currentCGPA, completedSem, targetCGPA)) {
        return;
    }

    // Calculate CGPA requirements
    const remainingSem = 8 - completedSem;
    const requiredCGPA = calculateRequiredCGPA(currentCGPA, completedSem, targetCGPA, remainingSem);

    if (replaceCGPA > scale) {
       const maxPossible = ((currentCGPA * completedSem + scale * remainingSem) / 8).toFixed(2);;
        showError(`Target CGPA is not achievable. Maximum possible CGPA is ${maxPossible}`);
        return;
    }

    // Show and update all sections
    showResults(requiredCGPA, remainingSem, currentCGPA);
}

function validateInputs(currentCGPA, completedSem, targetCGPA) {
    if (isNaN(currentCGPA) || isNaN(completedSem) || isNaN(targetCGPA)) {
        showError('Please fill in all fields with valid numbers');
        return false;
    }
if (currentCGPA < 0 || currentCGPA > scale || targetCGPA < 0 || targetCGPA > scale) {
    showError(`CGPA must be between 0 and ${scale}`);
        return false;
    }

    if (completedSem < 1 || completedSem >= 8) {
        showError('Completed semesters must be between 1 and 7');
        return false;
    }

    // FIX: Validate that target CGPA is greater than current CGPA
    if (targetCGPA <= currentCGPA) {
        showError(`Target CGPA (${targetCGPA}) must be greater than your Current CGPA (${currentCGPA}). Please set a higher goal.`);
        return false;
    }

    return true;
}

function calculateRequiredCGPA(currentCGPA, completedSem, targetCGPA, remainingSem) {
    return ((targetCGPA * 8) - (currentCGPA * completedSem)) / remainingSem;
}

function showResults(requiredCGPA, remainingSem, currentCGPA) {
    // Show all result sections
    const resultDiv = document.getElementById('result');
    const chartsSection = document.getElementById('charts-section');
    const companyEligibility = document.getElementById('company-eligibility');

    if (resultDiv) resultDiv.style.display = 'block';
    if (chartsSection) chartsSection.style.display = 'block';
    if (companyEligibility) companyEligibility.style.display = 'block';

    // Update results
    document.getElementById('requiredCGPA').textContent = requiredCGPA.toFixed(2);
    document.getElementById('remainingSem').textContent = remainingSem;

    // Update placement eligibility indicator
    updatePlacementEligibility(currentCGPA);

    // Update charts and company info
    updateCharts();
    updateCompanyEligibility(currentCGPA);

    // Update visual dashboard
    const targetCGPA = parseFloat(document.getElementById('targetCGPA').value);
    if (window.CGPADashboard) {
        window.CGPADashboard.render({
            currentCGPA: currentCGPA,
            targetCGPA: targetCGPA,
            requiredCGPA: requiredCGPA
        });
    }
}

function updateCompanyEligibility(cgpa) {
    let eligibleCount = 0;
    const tierCounts = {
        'S+': 0, 'A+': 0, 'A': 0, 'B': 0, 'C': 0
    };

    companyData.forEach(company => {
        if (cgpa >= company.cgpa) {
            eligibleCount++;
            tierCounts[company.tier]++;
        }
    });

    document.getElementById('eligibleCount').textContent = `${eligibleCount}/${companyData.length}`;
    document.getElementById('userCGPA').textContent = cgpa.toFixed(2);

    // Update tier counts
    Object.keys(tierCounts).forEach(tier => {
        const element = document.getElementById(`${tier.toLowerCase().replace('+', 'Plus')}Tier`);
        if (element) {
            element.textContent = tierCounts[tier];
        }
    });
}

function updatePlacementEligibility(cgpa) {
    const badgesContainer = document.getElementById('eligibilityBadges');
    if (!badgesContainer) return;

    // Clear existing badges
    badgesContainer.innerHTML = '';

    // Define eligibility criteria
    const eligibilityCriteria = [
        {
            threshold: 8.5,
            icon: '🟢',
            title: 'Eligible for Tier-1 Companies',
            subtitle: 'CGPA ≥ 8.5 - Top tech companies, consulting firms, and high-paying roles',
            class: 'badge-tier1'
        },
        {
            threshold: 7.0,
            icon: '🟡',
            title: 'Eligible for Tier-2 Companies',
            subtitle: 'CGPA ≥ 7.0 - Mid-tier companies, product-based startups, and service companies',
            class: 'badge-tier2'
        },
        {
            threshold: 0,
            icon: '🔴',
            title: 'Below Common Placement Criteria',
            subtitle: 'CGPA < 7.0 - Limited placement opportunities, focus on improving CGPA',
            class: 'badge-tier3'
        }
    ];

    // Determine which badges to show based on CGPA
    eligibilityCriteria.forEach(criteria => {
        if (cgpa >= criteria.threshold) {
            const badge = createEligibilityBadge(criteria);
            badgesContainer.appendChild(badge);

            // Only show the highest matching tier
            if (criteria.threshold > 0) return;
        }
    });

    // If CGPA is below 7.0, show the warning badge
    if (cgpa < 7.0) {
        const warningCriteria = eligibilityCriteria[2];
        const badge = createEligibilityBadge(warningCriteria);
        badgesContainer.appendChild(badge);
    }

    // Update eligible companies list
    updateEligibleCompaniesList(cgpa);
}

function updateEligibleCompaniesList(cgpa) {
    const companiesGrid = document.getElementById('companiesGrid');
    const eligibleCompaniesSection = document.getElementById('eligibleCompaniesSection');

    if (!companiesGrid || !eligibleCompaniesSection) return;

    // Clear existing companies
    companiesGrid.innerHTML = '';

    // Filter eligible companies
    const eligibleCompanies = companyData.filter(company => cgpa >= company.cgpa);

    // Count companies by tier
    const tierCounts = {
        'all': eligibleCompanies.length,
        'S+': 0,
        'A+': 0,
        'A': 0,
        'B': 0,
        'C': 0
    };

    eligibleCompanies.forEach(company => {
        tierCounts[company.tier]++;
    });

    // Update filter button counts
    document.getElementById('allCount').textContent = tierCounts.all;
    document.getElementById('sPlusCount').textContent = tierCounts['S+'];
    document.getElementById('aPlusCount').textContent = tierCounts['A+'];
    document.getElementById('aCount').textContent = tierCounts['A'];
    document.getElementById('bCount').textContent = tierCounts['B'];
    document.getElementById('cCount').textContent = tierCounts['C'];

    // Show/hide section based on eligible companies
    if (eligibleCompanies.length === 0) {
        eligibleCompaniesSection.style.display = 'none';
        return;
    } else {
        eligibleCompaniesSection.style.display = 'block';
    }

    // Create company cards
    eligibleCompanies.forEach(company => {
        const card = createCompanyCard(company);
        companiesGrid.appendChild(card);
    });

    // Initialize filter functionality
    initializeCompanyFilters();
}

function createCompanyCard(company) {
    const card = document.createElement('div');
    card.className = 'company-card';
    card.setAttribute('data-tier', company.tier);

    // Get tier icon
    const tierIcons = {
        'S+': '🏆',
        'A+': '⭐',
        'A': '💼',
        'B': '🏢',
        'C': '🏭'
    };

    card.innerHTML = `
        <div class="company-icon">${tierIcons[company.tier] || '🏢'}</div>
        <div class="company-info">
            <div class="company-name">${company.name}</div>
            <div class="company-tier">${company.tier} Tier - ${companyTiers[company.tier].ctc}</div>
            <div class="company-cgpa">Min CGPA: ${company.cgpa.toFixed(1)}</div>
        </div>
    `;

    return card;
}

function initializeCompanyFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const companyCards = document.querySelectorAll('.company-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Get selected tier
            const selectedTier = button.getAttribute('data-tier');

            // Filter companies
            companyCards.forEach(card => {
                const cardTier = card.getAttribute('data-tier');

                if (selectedTier === 'all' || cardTier === selectedTier) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}

function createEligibilityBadge(criteria) {
    const badge = document.createElement('div');
    badge.className = `eligibility-badge ${criteria.class}`;

    badge.innerHTML = `
        <div class="badge-icon">${criteria.icon}</div>
        <div class="badge-content">
            <div class="badge-title">${criteria.title}</div>
            <div class="badge-subtitle">${criteria.subtitle}</div>
        </div>
    `;

    return badge;
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

/**
 * Returns chart text and grid colours based on the active theme.
 * Called at render time so toggling theme then re-calculating
 * always produces correctly coloured charts.
 */
function getThemeChartColors() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    return {
        text: isLight ? '#1a1a2e' : '#ffffff',
        grid: isLight ? '#d0d4dc' : '#333333'
    };
}

function updateCharts() {
    const currentCGPA = parseFloat(document.getElementById('currentCGPA').value);
    const completedSem = parseInt(document.getElementById('completedSem').value);
    const targetCGPA = parseFloat(document.getElementById('targetCGPA').value);
    const requiredCGPA = calculateRequiredCGPA(currentCGPA, completedSem, targetCGPA, 8 - completedSem);
    const remainingSem = 8 - completedSem;

    // Read theme colours once and pass them through — no more hardcoded '#fff' / '#333'
    const c = getThemeChartColors();

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: c.text }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 10,
                grid: { color: c.grid },
                ticks: { color: c.text }
            },
            x: {
                grid: { color: c.grid },
                ticks: { color: c.text }
            }
        }
    };

    updateProgressChart(currentCGPA, targetCGPA, chartOptions, c.text);
    updateSemesterChart(completedSem, remainingSem, requiredCGPA, chartOptions, c.text);
}

function updateProgressChart(currentCGPA, targetCGPA, chartOptions, titleColor) {
    const ctxProgress = document.getElementById('progressChart');
    if (progressChart) {
        progressChart.destroy();
    }

    if (ctxProgress) {
        progressChart = new Chart(ctxProgress.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Current', 'Target'],
                datasets: [{
                    label: 'CGPA Progress',
                    data: [currentCGPA, targetCGPA],
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                ...chartOptions,
                plugins: {
                    ...chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'CGPA Progress Trajectory',
                        color: titleColor      // was hardcoded '#fff'
                    }
                }
            }
        });
    }
}

const feedbackLink = document.querySelector('.feedback-link');

if (feedbackLink) {
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
}

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

function updateSemesterChart(completedSem, remainingSem, requiredCGPA, chartOptions, titleColor) {
    const ctxSemester = document.getElementById('semesterChart');
    if (semesterChart) {
        semesterChart.destroy();
    }

    if (ctxSemester) {
        const semesterLabels = Array.from(
            { length: remainingSem },
            (_, i) => `Sem ${completedSem + i + 1}`
        );

        semesterChart = new Chart(ctxSemester.getContext('2d'), {
            type: 'bar',
            data: {
                labels: semesterLabels,
                datasets: [{
                    label: 'Required CGPA',
                    data: Array(remainingSem).fill(requiredCGPA),
                    backgroundColor: '#009dff',
                    borderColor: '#0088cc',
                    borderWidth: 1
                }]
            },
            options: {
                ...chartOptions,
                plugins: {
                    ...chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Required CGPA per Semester',
                        color: titleColor      // was hardcoded '#fff'
                    }
                }
            }
        });
    }
}
