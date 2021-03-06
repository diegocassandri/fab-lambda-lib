const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const distDir = path.resolve(__dirname, '../dist/');

function clearDistDir() {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(distDir)) {
            rimraf(path.resolve(__dirname, '../dist/'),
                error => (error ? reject(error) : resolve()));
        }
    });
}

function createDistDir() {
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir);
    }
}

clearDistDir()
    .then(createDistDir)
    .catch((error) => {
        throw new Error(`Error while clearing dist directory: ${error}`);
    });
