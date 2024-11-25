const axios = require('axios');

class PaymentService {
    constructor() {
        this.piNetwork = process.env.PI_NETWORK || 'sandbox';
        this.apiKey = process.env.PI_API_KEY;
        this.baseUrl = this.piNetwork === 'mainnet' 
            ? 'https://api.minepi.com'
            : 'https://api.sandbox.minepi.com';
        this.payments = new Map(); // In-memory storage for payments
    }

    // Create a new payment
    async createPayment(amount, memo, metadata = {}) {
        try {
            const payment = {
                amount,
                memo,
                metadata,
                status: 'pending',
                created_at: new Date().toISOString(),
                identifier: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            this.payments.set(payment.identifier, payment);
            return payment;
        } catch (error) {
            console.error('Error creating payment:', error);
            throw new Error('Failed to create payment');
        }
    }

    // Complete a payment
    async completePayment(paymentId, txid) {
        try {
            const payment = this.payments.get(paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }

            // Verify the transaction with Pi Network
            const response = await axios.post(
                `${this.baseUrl}/v2/payments/${paymentId}/complete`,
                { txid },
                {
                    headers: {
                        'Authorization': `Key ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status === 'completed') {
                payment.status = 'completed';
                payment.txid = txid;
                payment.completed_at = new Date().toISOString();
                this.payments.set(paymentId, payment);
            }

            return payment;
        } catch (error) {
            console.error('Error completing payment:', error);
            throw new Error('Failed to complete payment');
        }
    }

    // Get payment status
    async getPaymentStatus(paymentId) {
        try {
            const payment = this.payments.get(paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }
            return payment;
        } catch (error) {
            console.error('Error getting payment status:', error);
            throw new Error('Failed to get payment status');
        }
    }

    // Get payment history for a user
    async getPaymentHistory(userId) {
        try {
            // Convert Map to Array and filter by userId
            const userPayments = Array.from(this.payments.values())
                .filter(payment => payment.metadata.userId === userId)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return userPayments;
        } catch (error) {
            console.error('Error getting payment history:', error);
            throw new Error('Failed to get payment history');
        }
    }

    // Cancel a payment
    async cancelPayment(paymentId) {
        try {
            const payment = this.payments.get(paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }

            // Only pending payments can be cancelled
            if (payment.status !== 'pending') {
                throw new Error('Payment cannot be cancelled');
            }

            payment.status = 'cancelled';
            payment.cancelled_at = new Date().toISOString();
            this.payments.set(paymentId, payment);

            return payment;
        } catch (error) {
            console.error('Error cancelling payment:', error);
            throw new Error('Failed to cancel payment');
        }
    }

    // Verify a payment with Pi Network
    async verifyPayment(paymentId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/v2/payments/${paymentId}`,
                {
                    headers: {
                        'Authorization': `Key ${this.apiKey}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error verifying payment:', error);
            throw new Error('Failed to verify payment');
        }
    }
}

module.exports = new PaymentService();
