const axios = require('axios');

class PiPaymentService {
    constructor() {
        this.PI_API_URL = process.env.PI_API_URL || 'https://api.minepi.com';
        this.PI_API_KEY = process.env.PI_API_KEY;
    }

    async createPayment(amount, memo, uid) {
        try {
            const response = await axios.post(
                `${this.PI_API_URL}/v2/payments`,
                {
                    amount,
                    memo,
                    metadata: { uid },
                    uid
                },
                {
                    headers: {
                        'Authorization': `Key ${this.PI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error creating Pi payment:', error);
            throw new Error('Failed to create payment');
        }
    }

    async completePayment(paymentId) {
        try {
            const response = await axios.post(
                `${this.PI_API_URL}/v2/payments/${paymentId}/complete`,
                {},
                {
                    headers: {
                        'Authorization': `Key ${this.PI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error completing Pi payment:', error);
            throw new Error('Failed to complete payment');
        }
    }

    async getPaymentStatus(paymentId) {
        try {
            const response = await axios.get(
                `${this.PI_API_URL}/v2/payments/${paymentId}`,
                {
                    headers: {
                        'Authorization': `Key ${this.PI_API_KEY}`
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error getting payment status:', error);
            throw new Error('Failed to get payment status');
        }
    }

    async cancelPayment(paymentId) {
        try {
            const response = await axios.post(
                `${this.PI_API_URL}/v2/payments/${paymentId}/cancel`,
                {},
                {
                    headers: {
                        'Authorization': `Key ${this.PI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error canceling payment:', error);
            throw new Error('Failed to cancel payment');
        }
    }
}

module.exports = new PiPaymentService();
