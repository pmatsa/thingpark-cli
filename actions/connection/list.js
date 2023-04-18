import axios from 'axios';
import https from 'https';
import rateLimit from 'axios-rate-limit';
import Table from 'cli-table3';
import readline from 'readline-sync';
import config from '../../config.json';

const http = rateLimit(axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false,
    }),
}), { maxRequests: 1, perMilliseconds: 250 });

const listConnections = async (pageIndex) => {

    if (!config) {
        console.log('Please log in first using the "tpe login" command.');
        return;
    }

    // Set default pageIndex value to 1 if it's not a number
    pageIndex = typeof pageIndex === 'number' ? pageIndex : 1;

    try {
        const response = await http.get(`${config.baseUrl}/thingpark/dx/core/latest/api/connections`, {
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${config.access_token}`,
            },
            params: {
                pageIndex: parseInt(pageIndex, 10),
            },
        });

        const connections = response.data;
        const startIndex = (pageIndex - 1) * connections.length + 1;

        displayConnectionsTable(connections, startIndex);

        // Check if there are more connections and ask the user if they want to view the next page
        if (connections.length > 99) {
            const nextPage = readline.question('Do you want to view the next page? (Y/n): ');
            if (nextPage.toLowerCase() === 'y' || nextPage === '') {
                listConnections(pageIndex + 1);
            }
        } else {
            console.log('No more connections found.');
        }
    } catch (error) {
        if (error.response) {
            console.error('Error fetching connections:', error.response.data);
        } else {
            console.error('Error fetching connections:', error.message);
        }
    }
};

const displayConnectionsTable = (connections, startIndex) => {
    const table = new Table({
        head: ['A/A', 'Id', 'Connector Id', 'Name', 'Startup Time', 'State'],
        colWidths: [10, 20, 25, 35, 30, 15],
    });

    connections.forEach((connection, index) => {
        table.push([
            startIndex + index,
            connection.id,
            connection.connectorId,
            connection.name,
            connection.startupTime,
            connection.state,
        ]);
    });

    console.log(table.toString());
};

export default listConnections;