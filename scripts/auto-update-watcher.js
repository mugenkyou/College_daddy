const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const notesDir = path.join(__dirname, '../data/notes');
let updateTimeout;

function isAppRunning() {
    return new Promise((resolve) => {
        exec('tasklist /FI "IMAGENAME eq python.exe" /FO CSV', (error, stdout) => {
            if (error) {
                resolve(false);
                return;
            }
            const isRunning = stdout.includes('app.py') || stdout.includes('python.exe');
            resolve(isRunning);
        });
    });
}

function updateMetadata() {
    exec('node update-file-metadata.js', { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error('Error updating metadata:', error);
        } else {
            console.log('Metadata updated automatically!');
        }
    });
}

console.log('Starting file watcher synced with app.py...');

// Watch for file changes in the notes directory
fs.watch(notesDir, { recursive: true }, async (eventType, filename) => {
    if (filename && filename.endsWith('.pdf')) {
        console.log(`File ${eventType}: ${filename}`);
        
        // Clear existing timeout
        if (updateTimeout) clearTimeout(updateTimeout);
        
        // Check if app.py is running before updating
        updateTimeout = setTimeout(async () => {
            const appRunning = await isAppRunning();
            if (appRunning) {
                console.log('App.py detected running - updating metadata...');
                updateMetadata();
            } else {
                console.log('App.py not running - skipping metadata update');
            }
        }, 2000);
    }
});

console.log(`Watching ${notesDir} for PDF file changes (synced with app.py)...`);