
import axios from 'axios';
import https from 'https';
import rateLimit from 'axios-rate-limit';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import Table from 'cli-table3';
import qs from 'qs';
import { fileURLToPath } from 'url';

// Configure axios-rate-limit
const http = rateLimit(axios.create({ httpsAgent: new https.Agent({ rejectUnauthorized: false }) }), { maxRPS: 10 });

// Validate base URL
const validateBaseUrl = url => {
    return /^http(s)?:\/\/.+[^/]$/.test(url) ? true : 'Please enter a valid URL.';
};

// Validate email address
const validateEmail = email => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? true : 'Please enter a valid email address.';
};

// Prompt user for input
async function getUserInput() {
    const questions = [
        {
            type: 'input',
            name: 'baseUrl',
            message: 'Enter the base URL of your Thingpark Enterprise (must start with http(s):// and not end with /):',
            validate: validateBaseUrl,
        },
        {
            type: 'input',
            name: 'clientId',
            message: 'Enter your Client ID (email):',
            validate: validateEmail,
        },
        {
            type: 'password',
            name: 'clientSecret',
            message: 'Enter your Client Secret (password):',
            mask: '*',
        },
    ];

    return await inquirer.prompt(questions);
}

// Retrieve token from API
async function retrieveToken(baseUrl, clientId, clientSecret) {
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
        return { client_id, expires_in, access_token };
    } catch (error) {
        console.error('Error retrieving token:', error.message);
        throw error;
    }
}

// Save credentials to creds.json
function saveCredentials(baseUrl, credentials) {
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const filePath = path.resolve(dirname, '../creds.json');
    fs.writeFileSync(filePath, JSON.stringify({ ...credentials, baseUrl }, null, 2));
    console.log('Credentials saved to', filePath);
}

// Helper function to convert seconds to human-readable format
function secondsToHumanReadable(seconds) {
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Display token data in a CLI table
function displayTokenData(tokenData) {
    const table = new Table({
        head: ['ClientID', 'Expires In', 'Access Token'],
        colWidths: [45, 20, 45],
    });

    table.push([tokenData.client_id, secondsToHumanReadable(tokenData.expires_in) , tokenData.access_token]);
    console.log(table.toString());
}

// Main function to execute the login process
async function loginAction() {
    try {
        const userInput = await getUserInput();
        const tokenData = await retrieveToken(userInput.baseUrl, userInput.clientId, userInput.clientSecret);
        saveCredentials(userInput.baseUrl, tokenData);
        displayTokenData(tokenData);
    } catch (error) {
        console.error('Error during login process:', error.message);
    }
}

export default loginAction;