const axios = require('axios');
const https = require('https');
const rateLimit = require('axios-rate-limit');
const readlineSync = require('readline-sync');
const fs = require('fs');
const qs = require('qs');
const crypto = require('crypto');
const path = require('path');
const Table = require('cli-table3');
require('dotenv').config();

const configPath = path.join(__dirname, '..', 'config.json');
const configPathEnc = path.join(__dirname, '..', 'config.enc');

const http = rateLimit(axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false,
    }),
}), { maxRequests: 1, perMilliseconds: 250 });

/**
 * Prompt for Thingpark Enterprise baseUrl
 * @returns Thingpark Enterprise baseUrl
 */
const askBaseUrl = () => {
    let baseUrl = readlineSync.question('Enter the base URL of your Thingpark Enterprise (must start with http(s):// and not end with /): ');
    while (!baseUrl.match(/^https?:\/\/.+[^\/]$/)) {
        console.log('Invalid base URL. Please try again.');
        baseUrl = readlineSync.question('Enter the base URL of your Thingpark Enterprise (must start with http(s):// and not end with /): ');
    }
    return baseUrl;
};

/**
 * Prompt for Thingpark Enterprise client_id
 * @returns Thingpark Enterprise client_id
 */
const askClientId = () => {
    let clientId = readlineSync.question('Enter your Client ID (email): ');
    const emailRegex = /^[\w-]+(\.[\w-]+)*(\+[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    while (!emailRegex.test(clientId)) {
        console.log('Invalid email format. Please try again.');
        clientId = readlineSync.question('Enter your Client ID (email): ');
    }
    return clientId;
};

/**
 * Prompt for Thingpark Enterprise client_secret
 * @returns Thingpark Enterprise client_secret
 */
const askClientSecret = () => {
    return readlineSync.question('Enter your Client Secret (password): ', { hideEchoBack: true });
};

const encrypt = (text) => {
    const cipher = crypto.createCipheriv('aes-256-cbc', process.env.ENCRYPTION_KEY, '0123456789abcdef');
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};

const decrypt = (encrypted) => {
    const decipher = crypto.createDecipheriv('aes-256-cbc', process.env.ENCRYPTION_KEY, '0123456789abcdef');
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

/**
 * POST method using axios to receive access_token
 * 
 */
const getToken = async (baseUrl, clientId, clientSecret) => {
    try {

        const response = await http.post(`${baseUrl}/thingpark/dx/admin/latest/api/oauth/token`, qs.stringify({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            renewToken: true,
            validityPeriod: '90days',
        }), {
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { client_id, expires_in, access_token } = response.data;

        const config = { baseUrl, expires_in, client_id, access_token };
        fs.writeFileSync(configPath, JSON.stringify(config));

        console.log('Successfully logged in!');

        return config;
    } catch (error) {
        console.error('Error obtaining token:', error.message);
        return null;
    }
};

const printTokenData = (tokenData) => {
    const table = new Table({
        head: ['Client ID', 'Expires In', 'Access Token'],
        colWidths: [45, 20, 45],
    });

    const clientId = tokenData.client_id;
    const expiresInDate = new Date(Date.now() + tokenData.expires_in * 1000);
    const formattedExpiresIn = expiresInDate.toISOString().slice(0, 10);
    const truncatedAccessToken = tokenData.access_token.slice(0, 40) + '...';

    table.push([clientId, formattedExpiresIn, truncatedAccessToken]);
    console.log(table.toString());
};


const loginAction = async () => {
    const baseUrl = await askBaseUrl();
    const clientId = await askClientId();
    const clientSecret = await askClientSecret();

    const tokenData = await getToken(baseUrl, clientId, clientSecret);
    if (!tokenData) {
        console.log('Please try logging in again.');
    } else {
        printTokenData(tokenData);

        const clientIdEnc = encrypt(clientId);
        const clientSecretEnc = encrypt(clientSecret);

        const configEnc = { clientIdEnc, clientSecretEnc };
        fs.writeFileSync(configPathEnc, JSON.stringify(configEnc));
    }
};

module.exports = loginAction;