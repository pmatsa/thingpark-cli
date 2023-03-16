const fs = require('fs');
const path = require('path');
const axios = require('axios');
const rateLimit = require('axios-rate-limit');
const https = require('https');
const dotenv = require('dotenv');
const Table = require('cli-table3');
const moment = require('moment');
dotenv.config();

const configPath = path.join(__dirname, '..', 'config.json');

const http = rateLimit(axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false,
    }),
}), { maxRequests: 1, perMilliseconds: 250 });

const checkStatus = async () => {
    if (!fs.existsSync(configPath)) {
        console.log('No configuration file found. Please log in with "tpx login".');
        return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    if (!config.access_token) {
        console.log('No access token found. Please log in with "tpx login".');
        return;
    }

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

        const tokenInfo = response.data;
        const table = new Table({
            head: ['Expires In', 'Client ID', 'Customer ID', 'Operator ID', 'Token Type'],
        });

        table.push([
            moment().add(tokenInfo.expires_in, 'seconds').format('Y-MM-DD HH:mm'),
            tokenInfo.client_id,
            tokenInfo.customer_id,
            tokenInfo.operator_id,
            tokenInfo.token_type,
        ]);

        console.log(table.toString());
    } catch (error) {
        console.error('Error fetching token info:', error.message);
        console.log('Please log in with "tpx login".');
    }
};

module.exports = checkStatus;