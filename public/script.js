// === State ===
let currentSortColumn = 'Rating';
let currentSortDirection = 'desc';
let currentSchools = [];
let selectedBoroughs = [];

// === DOM References ===
const boroughOptions = document.getElementById('borough-options');
const boroughDisplay = document.getElementById('borough-display');
const boroughTags = document.getElementById('borough-tags');
const resultsDiv = document.getElementById('results');
const exportBtn = document.getElementById('exportBtn');

// === Borough Multi-select ===
function toggleDropdown() {
  boroughOptions.style.display = boroughOptions.style.display === 'block' ? 'none' : 'block';
}

function updateBoroughSelection() {
  selectedBoroughs = Array.from(boroughOptions.querySelectorAll('input[type="checkbox"]'))
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value);

  updateBoroughDisplay();
}

function updateBoroughDisplay() {
  if (selectedBoroughs.length === 0) {
    boroughDisplay.textContent = 'No Preference';
    boroughDisplay.style.display = 'block';
    boroughTags.innerHTML = '';
  } else {
    boroughDisplay.style.display = 'none';
    boroughTags.innerHTML = selectedBoroughs
      .map(borough => `<span class="tag">${borough} <span class="tag-remove" data-borough="${borough}">×</span></span>`)
      .join('');
  }
}

function removeBoroughTag(borough) {
  const checkbox = boroughOptions.querySelector(`input[value="${borough}"]`);
  if (checkbox) {
    checkbox.checked = false;
    updateBoroughSelection();
  }
}

// === Event Listeners ===
document.addEventListener('click', (e) => {
  if (!document.querySelector('.multi-select-container')?.contains(e.target)) {
    boroughOptions.style.display = 'none';
  }

  if (e.target.classList.contains('tag-remove')) {
    const borough = e.target.dataset.borough;
    removeBoroughTag(borough);
  }
});

document.getElementById('borough-dropdown').addEventListener('click', toggleDropdown);
boroughOptions.addEventListener('change', updateBoroughSelection);

document.getElementById('filtersForm').addEventListener('submit', e => e.preventDefault());
document.querySelector('button[onclick="findSchools()"]').addEventListener('click', findSchools);
exportBtn.addEventListener('click', exportToCSV);

// === Filtering Logic ===
async function findSchools() {
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

    currentSchools = await response.json();
    displayResults(currentSchools);

    if (currentSchools.length > 0) {
      exportBtn.style.display = 'inline-block';
    }
  } catch (error) {
    showError(error);
  }
}

// === Sorting & Rendering ===
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

    if (!isNaN(valueA) && !isNaN(valueB)) {
      valueA = parseFloat(valueA);
      valueB = parseFloat(valueB);
    }

    return currentSortDirection === 'asc' ? valueA > valueB ? 1 : -1 : valueA < valueB ? 1 : -1;
  });

  displayResults(currentSchools);
}

function displayResults(schools) {
  if (!schools) {
    resultsDiv.innerHTML = '<p class="error">Error: No data received from server</p>';
    return;
  }

  if (schools.length === 0) {
    resultsDiv.innerHTML = '<p>No schools found matching your criteria.</p>';
    return;
  }

  const headers = [
    'Rating', 'DBN', 'School Name', 'School Address', 'Borough', 'Transit Time',
    'Enrollment', '% Graduation Rate (2019)', '% Freshman 10 credit accumulation',
    'School Type', 'Admissions Criteria', 'College and Career Readiness',
    '% Students Reporting Frequent Bullying', '% Female', '% Male', '% ELL',
    '% Students with Disabilities', '% Sophomore 10 credit accumulation',
    '% Junior 10 credit accumulation', '% Asian', '% Black', '% Hispanic',
    '% White', '% Native American', '% Multiracial'
  ];

  const headerHtml = headers.map(header => {
    const sortClass = currentSortColumn === header ? `sort-${currentSortDirection}` : '';
    const label = header === 'Transit Time' ? 'Transit Time (minutes)' : header;
    return `<th onclick="sortData('${header}')" class="${sortClass}">${label}</th>`;
  }).join('');

  const rowHtml = schools.map(school => {
    const schoolNameCell = school['School Link']
      ? `<a href="${school['School Link']}" target="_blank">${school['School Name']}</a>`
      : school['School Name'];

    return `<tr>${headers.map(h => {
      const val = h === 'School Name' ? schoolNameCell : school[h] || '';
      return `<td>${val}</td>`;
    }).join('')}</tr>`;
  }).join('');

  resultsDiv.innerHTML = `<div class="results"><table><tr>${headerHtml}</tr>${rowHtml}</table></div>`;
}

// === CSV Export ===
function exportToCSV() {
  if (!currentSchools || currentSchools.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = [
    'Rating', 'DBN', 'School Name', 'School Address', 'Borough', 'Transit Time (minutes)',
    'Enrollment', '% Graduation Rate (2019)', '% Freshman 10 credit accumulation',
    'School Type', 'Admissions Criteria', 'College and Career Readiness',
    '% Students Reporting Frequent Bullying', '% Female', '% Male', '% ELL',
    '% Students with Disabilities', '% Sophomore 10 credit accumulation',
    '% Junior 10 credit accumulation', '% Asian', '% Black', '% Hispanic',
    '% White', '% Native American', '% Multiracial'
  ];

  const csvContent = [
    headers.join(','),
    ...currentSchools.map(school =>
      headers.map(h => {
        let value = school[h === 'Transit Time (minutes)' ? 'Transit Time' : h] || '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'nyc_high_schools.csv';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// === Error Display ===
function showError(error) {
  resultsDiv.innerHTML = `
    <div class="error">
      <p>An error occurred:</p>
      <p>${error.message || error}</p>
      <p>Please check the following:</p>
      <ul>
        <li>Verify that all form fields have valid values</li>
        <li>Make sure the spreadsheet ID is correctly set</li>
        <li>Check that the "Data" sheet exists in your spreadsheet</li>
        <li>Verify that all required columns exist in your spreadsheet</li>
      </ul>
    </div>
  `;
}
