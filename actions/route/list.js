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

const listRoutes = async (pageIndex) => {

    if (!config) {
        console.log('Please log in first using the "tpe login" command.');
        return;
    }

    // Set default pageIndex value to 1 if it's not a number
    pageIndex = typeof pageIndex === 'number' ? pageIndex : 1;

    try {
        const response = await http.get(`${config.baseUrl}/thingpark/dx/core/latest/api/routes`, {
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${config.access_token}`,
            },
            params: {
                pageIndex: parseInt(pageIndex, 10),
            },
        });

        const routes = response.data;
        const startIndex = (pageIndex - 1) * routes.length + 1;

        displayRoutesTable(routes, startIndex);

        // Check if there are more routes and ask the user if they want to view the next page
        if (routes.length > 99) {
            const nextPage = readline.question('Do you want to view the next page? (Y/n): ');
            if (nextPage.toLowerCase() === 'y' || nextPage === '') {
                listRoutes(pageIndex + 1);
            }
        } else {
            console.log('No more routes found.');
        }
    } catch (error) {
        if (error.response) {
            console.error('Error fetching routes:', error.response.data);
        } else {
            console.error('Error fetching routes:', error.message);
        }
    }
};

const displayRoutesTable = (routes, startIndex) => {
    const table = new Table({
        head: ['A/A', 'Ref', 'Name', 'AS ID', 'Connector Class', 'Content Type', 'Strategy'],
        colWidths: [10, 10, 25, 30, 30, 15],
    });

    routes.forEach((route, index) => {
        table.push([
            startIndex + index,
            route.ref,
            route.name,
            route.asId,
            route.connectorClass,
            route.contentType,
            route.strategy,
        ]);
    });

    console.log(table.toString());
};

module.exports = { listRoutes }