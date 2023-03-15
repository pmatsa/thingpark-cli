const axios = require('axios');
const https = require('https');
const rateLimit = require('axios-rate-limit');
const Table = require('cli-table3');
const readline = require('readline-sync');
const config = require('../../config.json');

const http = rateLimit(axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false,
    }),
}), { maxRequests: 1, perMilliseconds: 250 });

const listDevices = async (pageIndex) => {

    if (!config) {
        console.log('Please log in first using the "tpe login" command.');
        return;
    }

    // Set default pageIndex value to 1 if it's not a number
    pageIndex = typeof pageIndex === 'number' ? pageIndex : 1;
    console.log(pageIndex)

    try {
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
        const startIndex = (pageIndex - 1) * devices.length + 1;


        displayDevicesTable(devices, startIndex);

        // Check if there are more devices and ask the user if they want to view the next page
        if (devices.length > 0) {
            const nextPage = readline.question('Do you want to view the next page? (Y/n): ');
            if (nextPage.toLowerCase() === 'y' || nextPage === '') {
                listDevices(pageIndex + 1);
            }
        } else {
            console.log('No more devices found.');
        }
    } catch (error) {
        if (error.response) {
            console.error('Error fetching devices:', error.response.data);
        } else {
            console.error('Error fetching devices:', error.message);
        }
    }
};

const displayDevicesTable = (devices, startIndex) => {
    const table = new Table({
        head: ['A/A', 'Ref', 'Name', 'EUI', 'Health State', 'Latitude', 'Longitude'],
        colWidths: [10, 20, 25, 25, 20, 20, 20],
    });

    devices.forEach((device, index) => {
        table.push([
            startIndex + index,
            device.ref,
            device.name,
            device.EUI,
            device.statistics?.healthState,
            device.geoLatitude,
            device.geoLongitude,
        ]);
    });

    console.log(table.toString());
};

module.exports = { listDevices } 