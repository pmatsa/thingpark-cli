import axios from 'axios';
import https from 'https';
import rateLimit from 'axios-rate-limit';
import fs from 'fs';
import { parse } from 'csv-parse';
import inquirer from 'inquirer';
import path from 'path';
import { fileURLToPath } from 'url';
import loginAction from '../login.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const credsPath = path.resolve(dirname, '../../creds.json');

const getConfig = async () => {
    if (!fs.existsSync(credsPath)) {
        console.log('Please log in with "tpx login".');
        await loginAction();
    }

    const config = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));

    if (!config.access_token) {
        console.log('Please log in with "tpx login".');
        await loginAction();
    }

    return config;
};

const http = rateLimit(axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false,
    }),
}), { maxRequests: 1, perMilliseconds: 10 });

const ACCEPTABLE_HEADERS = ['eui', 'name', 'geoLatitude', 'geoLongitude', 'routeRefs'];

const updateDevices = async (options) => {
    
    const csvPath = options.csv;

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

        const { shouldUpdate } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'shouldUpdate',
                message: 'Proceed with the update?',
                default: true,
            },
        ]);

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
    const config = await getConfig();
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
    const config = await getConfig();
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

export default updateDevices;