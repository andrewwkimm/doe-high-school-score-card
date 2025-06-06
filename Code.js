function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('NYC High School Finder')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Change this URL to reflect the official At the Table Google Sheets location.
const SPREADSHEET_ID = '1oFTdwgiSGBwfHPZtXoyANBcwMMmdcgLDu4df1yX5pUs';

function getTransitTime(origin, destination) {
  try {
    // Check for valid input addresses
    if (!origin || !destination || origin.trim() === "" || destination.trim() === "") {
      return "N/A";
    }

    // Clean addresses
    origin = origin.trim();
    destination = destination.trim();

    // Create a cache key
    const cacheKey = createCacheKey(origin, destination);

    // Try to get from cache first
    const cache = CacheService.getScriptCache();
    const cachedTime = cache.get(cacheKey);

    if (cachedTime) {
      console.log(`Cache hit for ${origin} to ${destination}`);
      return cachedTime;
    }

    console.log(`Cache miss for ${origin} to ${destination}, calling Maps API`);

    // Not in cache, call the Maps API
    const maps = Maps.newDirectionFinder()
      .setOrigin(origin)
      .setDestination(destination)
      .setMode(Maps.DirectionFinder.Mode.TRANSIT)
      .getDirections();

    if (maps && maps.routes && maps.routes.length > 0 &&
        maps.routes[0].legs && maps.routes[0].legs.length > 0 &&
        maps.routes[0].legs[0].duration) {
      const durationValue = maps.routes[0].legs[0].duration.value; // This is in seconds
      const durationMinutes = Math.round(durationValue / 60); // Convert to minutes

      // Store in cache for 6 hours (21600 seconds)
      cache.put(cacheKey, durationMinutes.toString(), 21600);

      return durationMinutes.toString();
    }
    return "N/A";
  } catch (error) {
    console.error('Error getting transit time:', error);
    return "N/A";
  }
}

function loadData() {
  try {
    Logger.log('Starting to load data');

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!ss) {
      throw new Error('Could not open spreadsheet. Check SPREADSHEET_ID');
    }

    // Load main data
    const dataSheet = ss.getSheetByName('Data');
    if (!dataSheet) {
      throw new Error('Could not find sheet named "Data"');
    }
    const data = dataSheet.getDataRange().getValues();

    // Load bullying data
    const bullyingSheet = ss.getSheetByName('Bullying Survey Data');
    if (!bullyingSheet) {
      throw new Error('Could not find sheet named "Bullying Survey Data"');
    }
    const bullyingData = bullyingSheet.getDataRange().getValues();

    // Load School Links data for proper URLs
    const linksSheet = ss.getSheetByName('School Links');
    if (!linksSheet) {
      throw new Error('Could not find sheet named "School Links"');
    }
    const linksData = linksSheet.getDataRange().getValues();

    // Create URL lookup object
    const urlLookup = {};
    linksData.slice(1).forEach(row => {
      if (row[0] && row[4]) {
        urlLookup[row[0]] = row[4];
      }
    });

    // Create bullying lookup object
    const bullyingLookup = {};
    bullyingData.slice(1).forEach(row => {
      bullyingLookup[row[0]] = row[5];
    });

    // Process and combine data
    const headers = data[0];
    const rows = data.slice(1);

    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });

      // Add proper URL
      const dbn = obj['DBN'];
      if (urlLookup[dbn]) {
        obj['School Link'] = urlLookup[dbn];
      }

      // Calculate rating
      const gradRate = parseFloat(obj['% Graduation Rate (2019)']) || 0;
      const freshmanCredits = parseFloat(obj['% Freshman 10 credit accumulation']) || 0;
      const sophomoreCredits = parseFloat(obj['% Sophomore 10 credit accumulation']) || 0;
      obj['Rating'] = (gradRate * 0.5 + ((freshmanCredits + sophomoreCredits) / 2) * 0.5).toFixed(1);

      // Add bullying percentage
      obj['% Students Reporting Frequent Bullying'] = bullyingLookup[dbn] ?
        (parseFloat(bullyingLookup[dbn]) * 100).toFixed(1) : "0.0";

      return obj;
    });
  } catch (error) {
    Logger.log('Error in loadData: ' + error.toString());
    throw new Error('Failed to load data: ' + error.message);
  }
}

// Create a cache key based on origin and destination
function createCacheKey(origin, destination) {
  return `transit_${origin.trim().replace(/\s+/g, '_')}_to_${destination.trim().replace(/\s+/g, '_')}`;
}

// Process transit times in batches
function processTransitTimesInBatches(schools, userAddress) {
  // Process in batches of 10 to avoid hitting rate limits
  const batchSize = 10;

  for (let i = 0; i < schools.length; i += batchSize) {
    const batch = schools.slice(i, i + batchSize);

    batch.forEach(school => {
      const schoolAddressWithBorough = `${school['School Address']} ${school['Borough']}`;
      school['Transit Time'] = getTransitTime(userAddress, schoolAddressWithBorough);
    });

    // Add a small delay between batches to avoid rate limits
    if (i + batchSize < schools.length) {
      Utilities.sleep(1000);
    }
  }

  return schools;
}

function filterSchools(filters) {
  try {
    const data = loadData();

    const filteredSchools = data.filter(school => {
      // Multi-borough filter
      if (filters.boroughs && filters.boroughs.length > 0 &&
          !filters.boroughs.includes(school['Borough'])) {
        return false;
      }

      if (filters.schoolType && filters.schoolType !== 'No Preference' &&
          school['School Type'] !== filters.schoolType) {
        return false;
      }

      const gradRate = parseFloat(school['% Graduation Rate (2019)']) || 0;
      if (filters.gradRate && gradRate < parseFloat(filters.gradRate)) {
        return false;
      }

      const creditRate = parseFloat(school['% Freshman 10 credit accumulation']) || 0;
      if (filters.creditRate && creditRate < parseFloat(filters.creditRate)) {
        return false;
      }

      if (filters.admissionsType && filters.admissionsType !== 'No Preference') {
        const admissionsCriteria = school['Admissions Criteria'];
        if (filters.admissionsType === 'Yes') {
          if (!admissionsCriteria.includes('Ed. Opt') && !admissionsCriteria.includes('Open')) {
            return false;
          }
        }
      }

      return true;
    });

    // Calculate transit times if address is provided
    if (filters.address && filters.address.trim() !== '') {
      // Use batch processing for transit times
      processTransitTimesInBatches(filteredSchools, filters.address);
    } else {
      filteredSchools.forEach(school => {
        school['Transit Time'] = 'N/A';
      });
    }

    return filteredSchools.map(school => ({
      'Rating': school['Rating'],
      'DBN': school['DBN'],
      'School Name': school['School Name'],
      'School Link': school['School Link'],
      'School Address': school['School Address'],
      'Borough': school['Borough'],
      'Transit Time': school['Transit Time'],
      'Enrollment': school['Enrollment'],
      '% Graduation Rate (2019)': parseFloat(school['% Graduation Rate (2019)'] || 0).toFixed(1),
      '% Freshman 10 credit accumulation': parseFloat(school['% Freshman 10 credit accumulation'] || 0).toFixed(1),
      'School Type': school['School Type'],
      'Admissions Criteria': school['Admissions Criteria'],
      'College and Career Readiness': parseFloat(school['College and Career Readiness'] || 0).toFixed(1),
      '% Students Reporting Frequent Bullying': school['% Students Reporting Frequent Bullying'],
      '% Female': parseFloat(school['% Female'] || 0).toFixed(1),
      '% Male': parseFloat(school['% Male'] || 0).toFixed(1),
      '% ELL': parseFloat(school['% ELL'] || 0).toFixed(1),
      '% Students with Disabilities': parseFloat(school['% Students with Disabilities'] || 0).toFixed(1),
      '% Sophomore 10 credit accumulation': parseFloat(school['% Sophomore 10 credit accumulation'] || 0).toFixed(1),
      '% Junior 10 credit accumulation': parseFloat(school['% Junior 10 credit accumulation'] || 0).toFixed(1),
      '% Asian': parseFloat(school['% Asian'] || 0).toFixed(1),
      '% Black': parseFloat(school['% Black'] || 0).toFixed(1),
      '% Hispanic': parseFloat(school['% Hispanic'] || 0).toFixed(1),
      '% White': parseFloat(school['% White'] || 0).toFixed(1),
      '% Native American': parseFloat(school['% Native American'] || 0).toFixed(1),
      '% Multiracial': parseFloat(school['% Multiracial'] || 0).toFixed(1)
    }));
  } catch (error) {
    Logger.log('Error in filterSchools: ' + error.toString());
    throw new Error('Failed to filter schools: ' + error.message);
  }
}
