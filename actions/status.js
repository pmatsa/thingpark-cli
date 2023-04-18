import axios from 'axios';
import https from 'https';
import rateLimit from 'axios-rate-limit';
import fs from 'fs';
import path from 'path';
import Table from 'cli-table3';
import moment from 'moment';
import { fileURLToPath } from 'url';

// Configure axios-rate-limit
const http = rateLimit(axios.create({ httpsAgent: new https.Agent({ rejectUnauthorized: false }) }), { maxRPS: 10 });

// Load credentials from creds.json
async function loadCredentials() {
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const filePath = path.resolve(dirname, '..', 'creds.json');

    if (fs.existsSync(filePath)) {
        const creds = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return creds;
    } else {
        console.log('Credentials not found. Please log in with "tpx login".');
        process.exit(1);
    }
}

// Fetch token info from API
async function fetchTokenInfo(config) {
    const tokenInfoUrl = `${config.baseUrl}/thingpark/dx/admin/latest/api/oauth/tokeninfo`;

    try {
        const response = await http.get(tokenInfoUrl, {
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${config.access_token}`,
            },
            params: {
                access_token: config.access_token,
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching token info:', error.message);
        throw error;
    }
}

// Display token info in a CLI table
function displayTokenInfo(config, tokenInfo) {
    const table = new Table({
        head: ['Base URL', 'Expires In', 'Client ID', 'Customer ID', 'Operator ID', 'Token Type'],
    });

    table.push([
        config.baseUrl,
        moment().add(tokenInfo.expires_in, 'seconds').format('Y-MM-DD HH:mm'),
        tokenInfo.client_id,
        tokenInfo.customer_id,
        tokenInfo.operator_id,
        tokenInfo.token_type,
    ]);

    console.log(table.toString());
}

// Main function to execute the check status process
async function checkStatus() {
    try {
        const config = await loadCredentials();

        if (!config.access_token) {
            console.log('Access token not found. Please log in with "tpx login".');
            process.exit(1);
        }

        const tokenInfo = await fetchTokenInfo(config);
        displayTokenInfo(config, tokenInfo);
    } catch (error) {
        console.error('Error during check status process:', error.message);
    }
}

// Export the checkStatus function
export default checkStatus;