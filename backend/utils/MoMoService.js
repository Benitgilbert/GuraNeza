const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class MoMoService {
    constructor() {
        this.subscriptionKey = process.env.MOMO_SUBSCRIPTION_KEY;
        this.apiUser = process.env.MOMO_API_USER;
        this.apiKey = process.env.MOMO_API_KEY;
        this.environment = process.env.MOMO_ENVIRONMENT || 'sandbox';
        this.baseURL = this.environment === 'production'
            ? 'https://proxy.momoapi.mtn.com'
            : 'https://sandbox.momodeveloper.mtn.com';

        this.token = null;
        this.tokenExpiry = null;
    }

    /**
     * Get or refresh MoMo access token
     */
    async getAccessToken() {
        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        try {
            const auth = Buffer.from(`${this.apiUser}:${this.apiKey}`).toString('base64');
            const response = await axios.post(
                `${this.baseURL}/collection/token/`,
                {},
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Ocp-Apim-Subscription-Key': this.subscriptionKey
                    }
                }
            );

            this.token = response.data.access_token;
            // Set expiry to 1 minute before actual expiry (usually 3600s)
            this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;

            return this.token;
        } catch (error) {
            console.error('MoMo Get Access Token Error:', error.response?.data || error.message);
            throw new Error('Failed to get MoMo access token');
        }
    }

    /**
     * Request to pay (Collection)
     */
    async requestToPay(amount, phoneNumber, externalId, payeeNote = '') {
        try {
            const token = await this.getAccessToken();
            const referenceId = uuidv4();

            await axios.post(
                `${this.baseURL}/collection/v1_0/requesttopay`,
                {
                    amount: amount.toString(),
                    currency: this.environment === 'production' ? 'RWF' : 'EUR',
                    externalId: externalId.toString(),
                    payer: {
                        partyIdType: 'MSISDN',
                        partyId: phoneNumber
                    },
                    payerMessage: `Payment for Order ${externalId}`,
                    payeeNote: payeeNote || `Order ${externalId} payment`
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Reference-Id': referenceId,
                        'X-Target-Environment': this.environment,
                        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                referenceId
            };
        } catch (error) {
            console.error('MoMo RequestToPay Error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Check transaction status
     */
    async getTransactionStatus(referenceId) {
        try {
            const token = await this.getAccessToken();

            const response = await axios.get(
                `${this.baseURL}/collection/v1_0/requesttopay/${referenceId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Target-Environment': this.environment,
                        'Ocp-Apim-Subscription-Key': this.subscriptionKey
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('MoMo Get Transaction Status Error:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new MoMoService();
