let currentSortColumn = 'Rating';
let currentSortDirection = 'desc';
let currentSchools = [];
let selectedBoroughs = [];

const HEADERS = [
  'Rating', 'DBN', 'School Name', 'School Address', 'School Borough', 'Transit Time (minutes)',
  'Enrollment', '% Graduation Rate', '% Freshman 10 credit accumulation',
  'School Type', 'Admissions Criteria', 'College and Career Readiness',
  '% Students Reporting Frequent Bullying', '% Female', '% Male', '% ELL',
  '% Students with Disabilities', '% Sophomore 10 credit accumulation',
  '% Junior 10 credit accumulation', '% Asian', '% Black', '% Hispanic',
  '% White', '% Native American', '% Multiracial'
];

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

    if (schools.length > 0) {
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
    if (!isNaN(valueA) && !isNaN(valueB)) {
      valueA = parseFloat(valueA);
      valueB = parseFloat(valueB);
    }
    return currentSortDirection === 'asc'
      ? valueA > valueB ? 1 : -1
      : valueA < valueB ? 1 : -1;
  });

  displayResults(currentSchools);
}

function displayResults(schools) {
  const resultsDiv = document.getElementById('results');
  if (!schools || schools.length === 0) {
    resultsDiv.innerHTML = '<p>No schools found matching your criteria.</p>';
    return;
  }

  let html = `<div class="results"><table><tr>`;
  html += HEADERS.map(h =>
    `<th onclick="sortData('${h}')" class="${currentSortColumn === h ? `sort-${currentSortDirection}` : ''}">${h}</th>`
  ).join('');
  html += `</tr>`;

  for (const school of schools) {
    html += `<tr>`;
    for (const header of HEADERS) {
      const value = header === 'School Name' && school['School Link']
        ? `<a href="${school['School Link']}" target="_blank">${school['School Name']}</a>`
        : school[header] || '';
      html += `<td>${value}</td>`;
    }
    html += `</tr>`;
  }

  html += `</table></div>`;
  resultsDiv.innerHTML = html;
}

function exportToCSV() {
  if (!currentSchools.length) {
    alert('No data to export');
    return;
  }

  const csv = [
    HEADERS.join(','),
    ...currentSchools.map(school =>
      HEADERS.map(h => {
        let v = school[h] || '';
        if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) {
          v = `"${v.replace(/"/g, '""')}"`;
        }
        return v;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'nyc_high_schools.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function showError(error) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = `
    <div class="error">
      <p>An error occurred:</p>
      <p>${error.message || error}</p>
    </div>
  `;
}
