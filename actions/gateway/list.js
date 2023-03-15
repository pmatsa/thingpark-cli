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

const listGateways = async (pageIndex) => {

    if (!config) {
        console.log('Please log in first using the "tpe login" command.');
        return;
    }

    // Set default pageIndex value to 1 if it's not a number
    pageIndex = typeof pageIndex === 'number' ? pageIndex : 1;

    try {
        const response = await http.get(`${config.baseUrl}/thingpark/dx/core/latest/api/baseStations`, {
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${config.access_token}`,
            },
            params: {
                pageIndex: parseInt(pageIndex, 10),
            },
        });

        const gateways = response.data;
        const startIndex = (pageIndex - 1) * gateways.length + 1;

        displayGatewaysTable(gateways, startIndex);

        // Check if there are more gateways and ask the user if they want to view the next page
        if (gateways.length > 99) {
            const nextPage = readline.question('Do you want to view the next page? (Y/n): ');
            if (nextPage.toLowerCase() === 'y' || nextPage === '') {
                listGateways(pageIndex + 1);
            }
        } else {
            console.log('No more gateways found.');
        }
    } catch (error) {
        if (error.response) {
            console.error('Error fetching gateways:', error.response.data);
        } else {
            console.error('Error fetching gateways:', error.message);
        }
    }
};

const displayGatewaysTable = (gateways, startIndex) => {
    const table = new Table({
        head: ['A/A', 'Name', 'Ref', 'Id', 'UUID', 'Base Station Profile Id', 'Health State'],
        colWidths: [10, 35, 15, 15, 30, 20, 25],
    });

    gateways.forEach((gateway, index) => {
        table.push([
            startIndex + index,
            gateway.name,
            gateway.ref,
            gateway.id,
            gateway.uuid,
            gateway.baseStationProfileId,
            gateway.statistics?.healthState,
        ]);
    });

    console.log(table.toString());
};

module.exports = { listGateways }