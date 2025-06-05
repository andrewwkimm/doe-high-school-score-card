let currentSortColumn = 'Rating';
let currentSortDirection = 'desc';
let currentSchools = [];
let selectedBoroughs = [];

// Multi-select borough functionality
function toggleDropdown() {
const options = document.getElementById('borough-options');
options.style.display = options.style.display === 'block' ? 'none' : 'block';
}

function updateBoroughSelection() {
const checkboxes = document.querySelectorAll('#borough-options input[type="checkbox"]');
selectedBoroughs = [];

checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
    selectedBoroughs.push(checkbox.value);
    }
});

updateBoroughDisplay();
}

function updateBoroughDisplay() {
const display = document.getElementById('borough-display');
const tagsContainer = document.getElementById('borough-tags');

if (selectedBoroughs.length === 0) {
    display.textContent = 'No Preference';
    display.style.display = 'block';
    tagsContainer.innerHTML = '';
} else {
    display.style.display = 'none';
    tagsContainer.innerHTML = selectedBoroughs.map(borough => 
    `<span class="tag">${borough} <span class="tag-remove" onclick="removeBoroughTag('${borough}')">×</span></span>`
    ).join('');
}
}

function removeBoroughTag(borough) {
const checkbox = document.querySelector(`#borough-options input[value="${borough}"]`);
if (checkbox) {
    checkbox.checked = false;
    updateBoroughSelection();
}
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
const container = document.querySelector('.multi-select-container');
if (!container.contains(event.target)) {
    document.getElementById('borough-options').style.display = 'none';
}
});

async function findSchools() {
const resultsDiv = document.getElementById('results');
const exportBtn = document.getElementById('exportBtn');
resultsDiv.innerHTML = '<p>Searching for schools... Please be patient as it can take a few minutes for the results to load. Thank you!</p>';
exportBtn.style.display = 'none';

const filters = {
    boroughs: selectedBoroughs,
    schoolType: document.getElementById('schoolType').value,
    gradRate: document.getElementById('gradRate').value,
    creditRate: document.getElementById('creditRate').value,
    admissionsType: document.getElementById('admissionsType').value,
    address: document.getElementById('address').value
};

try {
const response = await fetch('/api/filterSchools', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(filters)
});

if (!response.ok) throw new Error('Failed to fetch school data');

const schools = await response.json();
currentSchools = schools;
displayResults(schools);

if (schools && schools.length > 0) {
exportBtn.style.display = 'inline-block';
}
} catch (error) {
showError(error);
}
}

function sortData(column) {
if (currentSortColumn === column) {
    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
} else {
    currentSortColumn = column;
    currentSortDirection = 'asc';
}

currentSchools.sort((a, b) => {
    let valueA = a[column];
    let valueB = b[column];

    // Handle numeric values
    if (!isNaN(valueA) && !isNaN(valueB)) {
    valueA = parseFloat(valueA);
    valueB = parseFloat(valueB);
    }

    if (currentSortDirection === 'asc') {
    return valueA > valueB ? 1 : -1;
    } else {
    return valueA < valueB ? 1 : -1;
    }
});

displayResults(currentSchools);
}

function displayResults(schools) {
const resultsDiv = document.getElementById('results');

if (!schools) {
    resultsDiv.innerHTML = '<p class="error">Error: No data received from server</p>';
    return;
}

if (schools.length === 0) {
    resultsDiv.innerHTML = '<p>No schools found matching your criteria.</p>';
    return;
}

let html = `
    <div class="results">
    <table>
        <tr>
        <th onclick="sortData('Rating')" class="${currentSortColumn === 'Rating' ? `sort-${currentSortDirection}` : ''}">RATING</th>
        <th onclick="sortData('DBN')" class="${currentSortColumn === 'DBN' ? `sort-${currentSortDirection}` : ''}">DBN</th>
        <th onclick="sortData('School Name')" class="${currentSortColumn === 'School Name' ? `sort-${currentSortDirection}` : ''}">School Name</th>
        <th onclick="sortData('School Address')" class="${currentSortColumn === 'School Address' ? `sort-${currentSortDirection}` : ''}">Address</th>
        <th onclick="sortData('Borough')" class="${currentSortColumn === 'Borough' ? `sort-${currentSortDirection}` : ''}">School Borough</th>
        <th onclick="sortData('Transit Time')" class="${currentSortColumn === 'Transit Time' ? `sort-${currentSortDirection}` : ''}">Transit Time (minutes)</th>
        <th onclick="sortData('Enrollment')" class="${currentSortColumn === 'Enrollment' ? `sort-${currentSortDirection}` : ''}">Number of Students</th>
        <th onclick="sortData('% Graduation Rate (2019)')" class="${currentSortColumn === '% Graduation Rate (2019)' ? `sort-${currentSortDirection}` : ''}">% Graduation Rate</th>
        <th onclick="sortData('% Freshman 10 credit accumulation')" class="${currentSortColumn === '% Freshman 10 credit accumulation' ? `sort-${currentSortDirection}` : ''}">% Freshman 10 credit accumulation</th>
        <th onclick="sortData('School Type')" class="${currentSortColumn === 'School Type' ? `sort-${currentSortDirection}` : ''}">General or Career Technical School</th>
        <th onclick="sortData('Admissions Criteria')" class="${currentSortColumn === 'Admissions Criteria' ? `sort-${currentSortDirection}` : ''}">Admissions Criteria</th>
        <th onclick="sortData('College and Career Readiness')" class="${currentSortColumn === 'College and Career Readiness' ? `sort-${currentSortDirection}` : ''}">College Readiness Score (%)</th>
        <th onclick="sortData('% Students Reporting Frequent Bullying')" class="${currentSortColumn === '% Students Reporting Frequent Bullying' ? `sort-${currentSortDirection}` : ''}">% of Students Reporting Frequent Bullying</th>
        <th onclick="sortData('% Female')" class="${currentSortColumn === '% Female' ? `sort-${currentSortDirection}` : ''}">% Female</th>
        <th onclick="sortData('% Male')" class="${currentSortColumn === '% Male' ? `sort-${currentSortDirection}` : ''}">% Male</th>
        <th onclick="sortData('% ELL')" class="${currentSortColumn === '% ELL' ? `sort-${currentSortDirection}` : ''}">% ELL</th>
        <th onclick="sortData('% Students with Disabilities')" class="${currentSortColumn === '% Students with Disabilities' ? `sort-${currentSortDirection}` : ''}">% Students with Disabilities</th>
        <th onclick="sortData('% Sophomore 10 credit accumulation')" class="${currentSortColumn === '% Sophomore 10 credit accumulation' ? `sort-${currentSortDirection}` : ''}">% Sophomore 10 credit accumulation</th>
        <th onclick="sortData('% Junior 10 credit accumulation')" class="${currentSortColumn === '% Junior 10 credit accumulation' ? `sort-${currentSortDirection}` : ''}">% Junior 10 credit accumulation</th>
        <th onclick="sortData('% Asian')" class="${currentSortColumn === '% Asian' ? `sort-${currentSortDirection}` : ''}">% Asian</th>
        <th onclick="sortData('% Black')" class="${currentSortColumn === '% Black' ? `sort-${currentSortDirection}` : ''}">% Black</th>
        <th onclick="sortData('% Hispanic')" class="${currentSortColumn === '% Hispanic' ? `sort-${currentSortDirection}` : ''}">% Hispanic</th>
        <th onclick="sortData('% White')" class="${currentSortColumn === '% White' ? `sort-${currentSortDirection}` : ''}">% White</th>
        <th onclick="sortData('% Native American')" class="${currentSortColumn === '% Native American' ? `sort-${currentSortDirection}` : ''}">% Native American</th>
        <th onclick="sortData('% Multiracial')" class="${currentSortColumn === '% Multiracial' ? `sort-${currentSortDirection}` : ''}">% Native Hawaiian / Pacific Islander</th>
        </tr>`;

schools.forEach(school => {
    const schoolNameCell = school['School Link'] ? 
    `<a href="${school['School Link']}" target="_blank">${school['School Name']}</a>` : 
    school['School Name'];

    html += `
    <tr>
        <td>${school['Rating']}</td>
        <td>${school['DBN']}</td>
        <td>${schoolNameCell}</td>
        <td>${school['School Address']}</td>
        <td>${school['Borough']}</td>
        <td>${school['Transit Time']}</td>
        <td>${school['Enrollment']}</td>
        <td>${school['% Graduation Rate (2019)']}</td>
        <td>${school['% Freshman 10 credit accumulation']}</td>
        <td>${school['School Type']}</td>
        <td>${school['Admissions Criteria']}</td>
        <td>${school['College and Career Readiness']}</td>
        <td>${school['% Students Reporting Frequent Bullying']}</td>
        <td>${school['% Female']}</td>
        <td>${school['% Male']}</td>
        <td>${school['% ELL']}</td>
        <td>${school['% Students with Disabilities']}</td>
        <td>${school['% Sophomore 10 credit accumulation']}</td>
        <td>${school['% Junior 10 credit accumulation']}</td>
        <td>${school['% Asian']}</td>
        <td>${school['% Black']}</td>
        <td>${school['% Hispanic']}</td>
        <td>${school['% White']}</td>
        <td>${school['% Native American']}</td>
        <td>${school['% Multiracial']}</td>
    </tr>`;
});

html += '</table></div>';
resultsDiv.innerHTML = html;
}

function exportToCSV() {
if (!currentSchools || currentSchools.length === 0) {
    alert('No data to export');
    return;
}

// Get all column headers
const headers = [
    'Rating', 'DBN', 'School Name', 'School Address', 'Borough', 'Transit Time (minutes)',
    'Enrollment', '% Graduation Rate (2019)', '% Freshman 10 credit accumulation',
    'School Type', 'Admissions Criteria', 'College and Career Readiness',
    '% Students Reporting Frequent Bullying', '% Female', '% Male', '% ELL',
    '% Students with Disabilities', '% Sophomore 10 credit accumulation',
    '% Junior 10 credit accumulation', '% Asian', '% Black', '% Hispanic',
    '% White', '% Native American', '% Multiracial'
];

// Create CSV content
let csvContent = headers.join(',') + '\n';

currentSchools.forEach(school => {
    const row = headers.map(header => {
    let value = school[header === 'Transit Time (minutes)' ? 'Transit Time' : header] || '';
    // Escape commas and quotes in CSV
    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
    });
    csvContent += row.join(',') + '\n';
});

// Create and download file
const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
const link = document.createElement('a');
const url = URL.createObjectURL(blob);
link.setAttribute('href', url);
link.setAttribute('download', 'nyc_high_schools.csv');
link.style.visibility = 'hidden';
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
}

function showError(error) {
console.error('Server error:', error);
const resultsDiv = document.getElementById('results');
resultsDiv.innerHTML = `
    <div class="error">
    <p>An error occurred:</p>
    <p>${error.message || error}</p>
    <p>Please check the following:</p>
    <ul>
        <li>Verify that all form fields have valid values</li>
        <li>Make sure the spreadsheet ID is correctly set in Code.gs</li>
        <li>Check that the "Data" sheet exists in your spreadsheet</li>
        <li>Verify that all required columns exist in your spreadsheet</li>
    </ul>
    </div>
`;
}
