const { loadSchoolsData } = require('./googleSheets');
const { getTransitTime } = require('./googleMaps');

function parseNumber(str) {
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

async function addTransitTimes(schools, userAddress) {
  const batchSize = 10;
  for (let i = 0; i < schools.length; i += batchSize) {
    const batch = schools.slice(i, i + batchSize);
    await Promise.all(batch.map(async school => {
      const origin = userAddress;
      const destination = school['School Address'];
      school['Transit Time'] = await getTransitTime(origin, destination);
    }));

    // delay between batches to be gentle on API
    if (i + batchSize < schools.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function filterSchools(filters) {
  let schools = await loadSchoolsData();

  // Boroughs filter
  if (filters.boroughs && filters.boroughs.length > 0) {
    schools = schools.filter(s => filters.boroughs.includes(s['Borough']));
  }

  // School Type
  if (filters.schoolType && filters.schoolType !== 'No Preference') {
    schools = schools.filter(s => s['School Type'] === filters.schoolType);
  }

  // Graduation Rate
  if (filters.gradRate) {
    const minGrad = parseFloat(filters.gradRate);
    schools = schools.filter(s => parseNumber(s['% Graduation Rate (2019)']) >= minGrad);
  }

  // Credit Accumulation
  if (filters.creditRate) {
    const minCredit = parseFloat(filters.creditRate);
    schools = schools.filter(s => parseNumber(s['% Freshman 10 credit accumulation']) >= minCredit);
  }

  // Admissions
  if (filters.admissionsType === 'Yes') {
    schools = schools.filter(s => {
      const criteria = s['Admissions Criteria'] || '';
      return criteria.includes('Open') || criteria.includes('Ed. Opt');
    });
  }

  // Transit times
  if (filters.address && filters.address.trim()) {
    await addTransitTimes(schools, filters.address.trim());
  } else {
    schools.forEach(s => s['Transit Time'] = 'N/A');
  }

  return schools.map(s => ({
    'Rating': s['Rating'],
    'DBN': s['DBN'],
    'School Name': s['School Name'],
    'School Link': s['School Link'],
    'School Address': s['School Address'],
    'Borough': s['Borough'],
    'Transit Time': s['Transit Time'],
    'Enrollment': s['Enrollment'],
    '% Graduation Rate (2019)': parseFloat(s['% Graduation Rate (2019)'] || 0).toFixed(1),
    '% Freshman 10 credit accumulation': parseFloat(s['% Freshman 10 credit accumulation'] || 0).toFixed(1),
    'School Type': s['School Type'],
    'Admissions Criteria': s['Admissions Criteria'],
    'College and Career Readiness': parseFloat(s['College and Career Readiness'] || 0).toFixed(1),
    '% Students Reporting Frequent Bullying': s['% Students Reporting Frequent Bullying'],
    '% Female': parseFloat(s['% Female'] || 0).toFixed(1),
    '% Male': parseFloat(s['% Male'] || 0).toFixed(1),
    '% ELL': parseFloat(s['% ELL'] || 0).toFixed(1),
    '% Students with Disabilities': parseFloat(s['% Students with Disabilities'] || 0).toFixed(1),
    '% Sophomore 10 credit accumulation': parseFloat(s['% Sophomore 10 credit accumulation'] || 0).toFixed(1),
    '% Junior 10 credit accumulation': parseFloat(s['% Junior 10 credit accumulation'] || 0).toFixed(1),
    '% Asian': parseFloat(s['% Asian'] || 0).toFixed(1),
    '% Black': parseFloat(s['% Black'] || 0).toFixed(1),
    '% Hispanic': parseFloat(s['% Hispanic'] || 0).toFixed(1),
    '% White': parseFloat(s['% White'] || 0).toFixed(1),
    '% Native American': parseFloat(s['% Native American'] || 0).toFixed(1),
    '% Multiracial': parseFloat(s['% Multiracial'] || 0).toFixed(1)
  }));
}

module.exports = {
  filterSchools
};
