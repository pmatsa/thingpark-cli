import axios from 'axios';
import https from 'https';
import rateLimit from 'axios-rate-limit';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import loginAction from '../login.js';

const http = rateLimit(axios.create({ httpsAgent: new https.Agent({ rejectUnauthorized: false }) }), { maxRPS: 10 });

const dirname = path.dirname(fileURLToPath(import.meta.url));
const credsPath = path.resolve(dirname, '../../creds.json');

async function getConfig() {
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
}

async function listDevices() {
    try {
        const config = await getConfig();
        let pageIndex = 1;
        let deviceCount = 0;
        let hasMorePages = true;

        while (hasMorePages) {
            const response = await http.get(`${config.baseUrl}/thingpark/dx/core/latest/api/devices`, {
                headers: {
                    accept: 'application/json',
                    Authorization: `Bearer ${config.access_token}`,
                },
                params: {
                    pageIndex: parseInt(pageIndex, 10),
                },
            });

            const devices = response.data;
            const table = new Table({
                head: ['A/A', 'Ref', 'Name', 'EUI', 'Health State', 'Device Profile ID', 'Latitude', 'Longitude'],
                colWidths: [10, 20, 25, 25, 20, 30, 20, 20],
            });

            devices.forEach(device => {
                deviceCount++;
                table.push([
                    deviceCount,
                    device.ref,
                    device.name,
                    device.EUI,
                    device.statistics?.healthState,
                    device.deviceProfileId,
                    device.geoLatitude,
                    device.geoLongitude,
                ]);
            });

            console.log(table.toString());

            if (devices.length < 100) {
                hasMorePages = false;
            } else {
                const { nextPage } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'nextPage',
                        message: 'Do you want to view the next page? (Y/n):',
                        default: false,
                    },
                ]);
                hasMorePages = nextPage;
            }

            pageIndex++;
        }
    } catch (error) {
        console.error('Error fetching device list:', error.message);
    }
}

export default listDevices;