/**
 * Quick MTN MoMo API Credentials Generator
 * Run this once to get your API_USER and API_KEY
 */

const axios = require('axios');
const crypto = require('crypto');

// YOUR MTN MOMO CREDENTIALS (from screenshot)
const SUBSCRIPTION_KEY = '964918e7098741708f697016221ce743'; // Primary key from screenshot
const BASE_URL = 'https://sandbox.momodeveloper.mtn.com';

// Generate a random UUID v4
function generateUUID() {
    return crypto.randomUUID();
}

// Create Bearer Token (Basic Auth)
function createBasicAuth(apiUser, apiKey) {
    const credentials = `${apiUser}:${apiKey}`;
    return Buffer.from(credentials).toString('base64');
}

async function setupMoMoCredentials() {
    console.log('\n🚀 MTN MoMo API Setup\n');
    console.log('═══════════════════════════════════════\n');

    // Step 1: Generate API User ID
    const apiUser = generateUUID();
    console.log('✅ Step 1: Generated API User');
    console.log(`   UUID: ${apiUser}\n`);

    try {
        // Step 2: Create API User
        console.log('⏳ Step 2: Creating API User on MTN server...');

        await axios.post(
            `${BASE_URL}/v1_0/apiuser`,
            { providerCallbackHost: 'www.guraneza.com' },
            {
                headers: {
                    'X-Reference-Id': apiUser,
                    'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ API User created successfully!\n');

        // Wait 2 seconds for user to be registered
        console.log('⏳ Waiting 2 seconds for registration...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 3: Generate API Key
        console.log('⏳ Step 3: Generating API Key...');

        const response = await axios.post(
            `${BASE_URL}/v1_0/apiuser/${apiUser}/apikey`,
            {},
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
                }
            }
        );

        const apiKey = response.data.apiKey;
        console.log('✅ API Key generated successfully!\n');

        // Display credentials
        const creds = `MOMO_SUBSCRIPTION_KEY=${SUBSCRIPTION_KEY}\nMOMO_API_USER=${apiUser}\nMOMO_API_KEY=${apiKey}\nMOMO_ENVIRONMENT=sandbox`;
        require('fs').writeFileSync('momo_creds.txt', creds);
        console.log('--- CREDENTIALS WRITTEN TO momo_creds.txt ---');
        console.log(creds);
        console.log('--- CREDENTIALS END ---');

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        console.log('\n💡 If this fails, try Method 2 below:\n');
        console.log('Method 2: Manual UUID Generation');
        console.log('────────────────────────────────────');
        console.log('1. Go to: https://www.uuidgenerator.net/');
        console.log('2. Click "Generate" twice to get 2 UUIDs');
        console.log('3. Use them as:');
        console.log('   - First UUID  = MOMO_API_USER');
        console.log('   - Second UUID = MOMO_API_KEY\n');
    }
}

// Run the setup
console.log('\nStarting MTN MoMo credential generation...');
setupMoMoCredentials();
