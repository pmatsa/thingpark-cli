const axios = require('axios');
const https = require('https');
const rateLimit = require('axios-rate-limit');
const fs = require('fs');
const { parse } = require('csv-parse');
const readline = require('readline-sync');
const config = require('../../config.json');

/* TODO: change those headers to exist in the cli command in the first place */
/* tpe device update --csv */
const ACCEPTABLE_HEADERS = ['eui', 'name', 'geoLatitude', 'geoLongitude', 'routeRefs'];

// Set up a rate-limited axios instance, with SSL ignorance
const http = rateLimit(axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false,
    }),
}), { maxRequests: 1, perMilliseconds: 10 });

/**
 * Finds ACCEPTABLE_HEADERS in the csv, and iterates to update devices
 * Use delimiters ";" or ":" for routeRefs to create an array of routeRefs for device.
 * @param {*} options csvFile path
 * @returns 
 */
const updateDevices = async (options) => {

    const csvPath = options.csv;

    if (!config) {
        console.log('Please log in first using the "tpe login" command.');
        return;
    }

    try {
        const records = await readCSV(csvPath);
        const headers = records[0];

        const euiIndex = headers.indexOf('eui');
        if (euiIndex === -1) {
            console.error('The "eui" header is required in the CSV file.');
            return;
        }

        const acceptableHeaderIndexes = headers
            .map((header, index) => (ACCEPTABLE_HEADERS.includes(header) ? index : -1))
            .filter((index) => index !== -1);

        if (acceptableHeaderIndexes.length <= 1) {
            console.error('At least one additional acceptable header is required in the CSV file.');
            return;
        }

        let successCount = 0;
        let failureCount = 0;


        // Move the prompt outside of the loop
        console.log('Found CSV acceptable headers:');
        for (const index of acceptableHeaderIndexes) {
            if (index !== euiIndex) {
                const header = headers[index];
                console.log(`- ${header}`);
            }
        }

        const answer = readline.question('Proceed with the update? (Y/n): ');
        const shouldUpdate = answer.toLowerCase() === 'y' || answer === '';

        if (!shouldUpdate) {
            console.log('Update aborted.');
            return;
        }

        for (let i = 1; i < records.length; i++) {
            const record = records[i];
            const eui = record[euiIndex].replace(/-/g, '');

            if (eui.length !== 16) {
                console.error(`Invalid EUI format: ${record[euiIndex]}`);
                failureCount++;
                continue;
            }

            try {
                const ref = await getDeviceRef(eui);
                const updateData = {};

                for (const index of acceptableHeaderIndexes) {
                    if (index !== euiIndex) {
                        const header = headers[index];
                        let value = record[index];

                        // Check if the value contains ";" or ":" delimiter and process the value as an array
                        if (value.includes(';') || value.includes(':')) {
                            const delimiter = value.includes(';') ? ';' : ':';
                            value = value.split(delimiter).map(item => item.trim());
                        }

                        updateData[header] = value;
                    }
                }

                if (shouldUpdate) {
                    await updateDevice(ref, updateData);
                }

                console.log(`Successfully updated device with EUI: ${eui}`);
                successCount++;
            } catch (error) {
                console.error(`Failed to update device with EUI: ${eui}`, error.message);
                failureCount++;
            }
        }

        console.log(`Update summary: ${successCount} successful, ${failureCount} failed.`);
    } catch (error) {
        console.error('Error processing CSV file:', error.message);
    }
};

const readCSV = (csvPath) => {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(csvPath)
            .pipe(parse({ columns: false, trim: true }))
            .on('data', (row) => {
                rows.push(row);
            })
            .on('end', () => {
                resolve(rows);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

const getDeviceRef = async (eui) => {
    const response = await http.get(`${config.baseUrl}/thingpark/dx/core/latest/api/devices`, {
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${config.access_token}`,
        },
        params: {
            deviceEUI: eui,
        },
    });

    return response.data[0].ref;
};

const updateDevice = async (ref, updateData) => {
    try {
        await http.put(`${config.baseUrl}/thingpark/dx/core/latest/api/devices/${ref}`, updateData, {
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.access_token}`,
            },
        });
    } catch (error) {
        throw new Error('Error updating device: ' + error.message);
    }
};

module.exports = {
    updateDevices,
};