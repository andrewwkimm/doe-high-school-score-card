const { loadSchoolsData } = require('./googleSheets');
const { getTransitTime } = require('./googleMaps');

const COLUMN_RENAMES = {
  'Borough': 'School Borough',
  'Transit Time': 'Transit Time (minutes)',
  '% Graduation Rate (2019)': '% Graduation Rate'
};

const FIELDS = [
  'Rating', 'DBN', 'School Name', 'School Link', 'School Address', 'Borough', 'Transit Time',
  'Enrollment', '% Graduation Rate (2019)', '% Freshman 10 credit accumulation',
  'School Type', 'Admissions Criteria', 'College and Career Readiness',
  '% Students Reporting Frequent Bullying', '% Female', '% Male', '% ELL',
  '% Students with Disabilities', '% Sophomore 10 credit accumulation',
  '% Junior 10 credit accumulation', '% Asian', '% Black', '% Hispanic',
  '% White', '% Native American', '% Multiracial'
];

function parseNumber(str) {
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function transformField(field, value) {
  if (value === undefined) return '';
  if (typeof value === 'string' && value.trim() === '') return '';
  if (field.startsWith('%') || typeof value === 'number') {
    const num = parseFloat(value);
    return isNaN(num) ? '0.0' : num.toFixed(1);
  }
  return value;
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
    if (i + batchSize < schools.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function filterSchools(filters) {
  let schools = await loadSchoolsData();

  if (filters.boroughs && filters.boroughs.length > 0) {
    schools = schools.filter(s => filters.boroughs.includes(s['Borough']));
  }

  if (filters.schoolType && filters.schoolType !== 'No Preference') {
    schools = schools.filter(s => s['School Type'] === filters.schoolType);
  }

  if (filters.gradRate) {
    const minGrad = parseFloat(filters.gradRate);
    schools = schools.filter(s => parseNumber(s['% Graduation Rate (2019)']) >= minGrad);
  }

  if (filters.creditRate) {
    const minCredit = parseFloat(filters.creditRate);
    schools = schools.filter(s => parseNumber(s['% Freshman 10 credit accumulation']) >= minCredit);
  }

  if (filters.admissionsType === 'Yes') {
    schools = schools.filter(s => {
      const criteria = s['Admissions Criteria'] || '';
      return criteria.includes('Open') || criteria.includes('Ed. Opt');
    });
  }

  if (filters.address && filters.address.trim()) {
    await addTransitTimes(schools, filters.address.trim());
  } else {
    schools.forEach(s => s['Transit Time'] = 'N/A');
  }

  return schools.map(s => {
    const result = {};
    for (const field of FIELDS) {
      const renamed = COLUMN_RENAMES[field] || field;
      result[renamed] = transformField(field, s[field]);
    }
    return result;
  });
}

module.exports = {
  filterSchools
};
