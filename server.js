const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Function to convert Excel or CSV to JSON
function convertFileToJson(filePath, titleRow) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Extract titles and data
    const titles = jsonData[titleRow - 1];
    const data = jsonData.slice(titleRow).map(row => {
        const obj = {};
        titles.forEach((title, index) => {
            obj[title] = row[index];
        });
        return obj;
    });

    return data;
}

// Endpoint to handle file uploads
app.post('/upload', upload.single('file'), (req, res) => {
    const { titleRow } = req.body;
    const filePath = req.file.path;

    try {
        console.log(`Processing file with title row: ${titleRow}`);
        const jsonData = convertFileToJson(filePath, parseInt(titleRow, 10));
        console.log('File processed successfully.');

        // Delete the temporary file
        fs.unlinkSync(filePath);
        console.log('Temporary file deleted.');

        res.json(jsonData);
    } catch (error) {
        console.error('Error processing file:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to handle reading files from the same domain
app.get('/same-domain', (req, res) => {
    const { filePath, titleRow } = req.query;

    try {
        console.log(`Reading file from same domain: ${filePath} with title row: ${titleRow}`);
        const jsonData = convertFileToJson(path.join(__dirname, 'public', filePath), parseInt(titleRow, 10));
        console.log('File read successfully.');
        res.json(jsonData);
    } catch (error) {
        console.error('Error reading file:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Function to convert Google Sheet to JSON
async function convertGoogleSheetToJson(url, titleRow) {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = xlsx.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Extract titles and data
    const titles = jsonData[titleRow - 1];
    const data = jsonData.slice(titleRow).map(row => {
        const obj = {};
        titles.forEach((title, index) => {
            obj[title] = row[index];
        });
        return obj;
    });

    return data;
}

// Endpoint to handle Google Sheet URL
app.get('/google-sheet', async (req, res) => {
    const { url, titleRow } = req.query;

    try {
        console.log(`Fetching Google Sheet from URL: ${url} with title row: ${titleRow}`);
        const jsonData = await convertGoogleSheetToJson(url, parseInt(titleRow, 10));
        console.log('Google Sheet processed successfully.');
        res.json(jsonData);
    } catch (error) {
        console.error('Error processing Google Sheet:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
