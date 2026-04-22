import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

function getAuth() {
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    return new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
  }
  // fallback local
  import path from 'path';
  return new google.auth.GoogleAuth({
    keyFile: path.resolve('credentials/google-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
}

const auth = getAuth();
const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

export async function readSheet(range) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range
  });
  return res.data.values || [];
}

export async function appendRow(sheet, values) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheet}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] }
  });
}

export async function updateCell(range, value) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value]] }
  });
}

export { SPREADSHEET_ID };