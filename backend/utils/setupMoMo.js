const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

/**
 * MTN MoMo API User and API Key Generator
 * This script creates API User and generates API Key for MTN MoMo Collections
 */

// Your MTN MoMo Credentials
const SUBSCRIPTION_KEY = '0f976e0f867d6620ba511c2cbd4168d0'; // Your Primary Key
const ENVIRONMENT = 'sandbox'; // Use 'sandbox' for testing, 'production' for live

// MTN MoMo API Base URLs
const BASE_URL = ENVIRONMENT === 'sandbox'
    ? 'https://sandbox.momodeveloper.mtn.com'
    : 'https://momodeveloper.mtn.com';

// Generate a random UUID for API User
const API_USER = uuidv4();
const CALLBACK_HOST = 'https://webhook.site'; // You can change this to your domain

console.log('🚀 MTN MoMo API Setup Script');
console.log('================================\n');

/**
 * Step 1: Create API User
 */
async function createApiUser() {
    try {
        console.log('📝 Step 1: Creating API User...');
        console.log(`API User ID: ${API_USER}\n`);

        const response = await axios.post(
            `${BASE_URL}/v1_0/apiuser`,
            {
                providerCallbackHost: CALLBACK_HOST
            },
            {
                headers: {
                    'X-Reference-Id': API_USER,
                    'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.status === 201) {
            console.log('✅ API User created successfully!\n');
            return true;
        }
    } catch (error) {
        if (error.response?.status === 409) {
            console.log('⚠️  API User already exists (409 conflict)');
            console.log('This is OK - continuing to next step...\n');
            return true;
        }
        console.error('❌ Error creating API User:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Step 2: Generate API Key
 */
async function generateApiKey() {
    try {
        console.log('🔑 Step 2: Generating API Key...\n');

        const response = await axios.post(
            `${BASE_URL}/v1_0/apiuser/${API_USER}/apikey`,
            {},
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
                }
            }
        );

        if (response.status === 201 && response.data.apiKey) {
            console.log('✅ API Key generated successfully!\n');
            return response.data.apiKey;
        }
    } catch (error) {
        console.error('❌ Error generating API Key:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Step 3: Verify API User
 */
async function verifyApiUser() {
    try {
        console.log('🔍 Step 3: Verifying API User...\n');

        const response = await axios.get(
            `${BASE_URL}/v1_0/apiuser/${API_USER}`,
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
                }
            }
        );

        if (response.status === 200) {
            console.log('✅ API User verified!\n');
            console.log('User Details:');
            console.log(JSON.stringify(response.data, null, 2));
            return true;
        }
    } catch (error) {
        console.error('❌ Error verifying API User:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Main execution
 */
async function setup() {
    console.log('Starting MTN MoMo API setup...\n');
    console.log(`Environment: ${ENVIRONMENT}`);
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Subscription Key: ${SUBSCRIPTION_KEY.substring(0, 10)}...`);
    console.log('\n================================\n');

    // Step 1: Create API User
    const userCreated = await createApiUser();
    if (!userCreated) {
        console.log('\n❌ Setup failed at Step 1');
        return;
    }

    // Wait a bit for the user to be fully created
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Generate API Key
    const apiKey = await generateApiKey();
    if (!apiKey) {
        console.log('\n❌ Setup failed at Step 2');
        return;
    }

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Verify
    await verifyApiUser();

    // Display final credentials
    console.log('\n================================');
    console.log('🎉 SETUP COMPLETE!');
    console.log('================================\n');
    console.log('📋 Your MTN MoMo Credentials:\n');
    console.log(`MOMO_SUBSCRIPTION_KEY=${SUBSCRIPTION_KEY}`);
    console.log(`MOMO_API_USER=${API_USER}`);
    console.log(`MOMO_API_KEY=${apiKey}`);
    console.log(`MOMO_ENVIRONMENT=${ENVIRONMENT}`);
    console.log('\n================================');
    console.log('📝 Next Steps:');
    console.log('1. Copy the credentials above');
    console.log('2. Paste them into your backend/.env file');
    console.log('3. Restart your backend server');
    console.log('4. Test MoMo payment in your app!');
    console.log('================================\n');
}

// Run the setup
setup().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
});
