/**
 * Quick MTN MoMo API Credentials Generator
 * Run this once to get your API_USER and API_KEY
 */

const axios = require('axios');
const crypto = require('crypto');

// YOUR MTN MOMO CREDENTIALS (from screenshot)
const SUBSCRIPTION_KEY = '0f976e0f867d4620ba511c2cbd4168d0'; // Primary key
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
        console.log('\n═══════════════════════════════════════');
        console.log('🎉 SUCCESS! Copy these to your .env file:');
        console.log('═══════════════════════════════════════\n');

        console.log('MOMO_SUBSCRIPTION_KEY=' + SUBSCRIPTION_KEY);
        console.log('MOMO_API_USER=' + apiUser);
        console.log('MOMO_API_KEY=' + apiKey);
        console.log('MOMO_ENVIRONMENT=sandbox');

        console.log('\n═══════════════════════════════════════');
        console.log('📝 Next steps:');
        console.log('1. Open backend/.env file');
        console.log('2. Paste the lines above into the MoMo section');
        console.log('3. Save the file');
        console.log('4. Restart your backend server');
        console.log('5. Test MoMo payment! 🎉');
        console.log('═══════════════════════════════════════\n');

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
