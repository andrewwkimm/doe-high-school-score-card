const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');

const SHEET_ID = process.env.SHEET_ID;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_SHEETS_CREDENTIALS,
  scopes: SCOPES
});

async function loadSheet(sheetName) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}`,
  });

  return response.data.values;
}

function arrayToObject(array, keyIndex, valueIndex) {
  const result = {};
  array.slice(1).forEach(row => {
    const key = row[keyIndex];
    const value = row[valueIndex];
    if (key && value) result[key] = value;
  });
  return result;
}

function parseNumber(str, fallback = 0) {
  const num = parseFloat(str);
  return isNaN(num) ? fallback : num;
}

async function loadSchoolsData() {
  const [data, bullyingData, linksData] = await Promise.all([
    loadSheet('Data'),
    loadSheet('Bullying Survey Data'),
    loadSheet('School Links')
  ]);

  const headers = data[0];
  const bullyingLookup = arrayToObject(bullyingData, 0, 5);
  const urlLookup = arrayToObject(linksData, 0, 4);

  const schools = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((key, i) => {
      obj[key] = row[i];
    });

    const dbn = obj['DBN'];
    obj['% Students Reporting Frequent Bullying'] =
      bullyingLookup[dbn] ? (parseFloat(bullyingLookup[dbn])).toFixed(1) : '0';
    obj['School Link'] = urlLookup[dbn] || '';

    // Calculate rating
    const gradRate = parseNumber(obj['% Graduation Rate (2019)']);
    const freshman = parseNumber(obj['% Freshman 10 credit accumulation']);
    const sophomore = parseNumber(obj['% Sophomore 10 credit accumulation']);
    obj['Rating'] = ((gradRate * 0.5 + ((freshman + sophomore) / 2) * 0.5)).toFixed(1);

    return obj;
  });

  return schools;
}

module.exports = {
  loadSchoolsData
};
