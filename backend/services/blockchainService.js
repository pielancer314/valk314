const { StellarSdk } = require('stellar-sdk');
const axios = require('axios');

class BlockchainService {
    constructor() {
        this.network = process.env.PI_NETWORK || 'testnet';
        this.server = new StellarSdk.Server(
            this.network === 'mainnet'
                ? 'https://api.mainnet.minepi.com'
                : 'https://api.testnet.minepi.com'
        );
        this.networkPassphrase = this.network === 'mainnet'
            ? StellarSdk.Networks.PUBLIC
            : StellarSdk.Networks.TESTNET;
    }

    async createAccount(startingBalance = '1') {
        const keypair = StellarSdk.Keypair.random();
        const issuerKeypair = StellarSdk.Keypair.fromSecret(process.env.PI_WALLET_PRIVATE_KEY);

        try {
            const issuerAccount = await this.server.loadAccount(issuerKeypair.publicKey());
            const transaction = new StellarSdk.TransactionBuilder(issuerAccount, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: this.networkPassphrase
            })
            .addOperation(StellarSdk.Operation.createAccount({
                destination: keypair.publicKey(),
                startingBalance
            }))
            .setTimeout(30)
            .build();

            transaction.sign(issuerKeypair);
            await this.server.submitTransaction(transaction);

            return {
                publicKey: keypair.publicKey(),
                secretKey: keypair.secret()
            };
        } catch (error) {
            console.error('Error creating account:', error);
            throw new Error('Failed to create account');
        }
    }

    async getAccountInfo(publicKey) {
        try {
            const account = await this.server.loadAccount(publicKey);
            return {
                balances: account.balances,
                sequence: account.sequence,
                subentryCount: account.subentry_count,
                lastModified: account.last_modified_time
            };
        } catch (error) {
            console.error('Error getting account info:', error);
            throw new Error('Failed to get account info');
        }
    }

    async getTransactionHistory(publicKey) {
        try {
            const transactions = await this.server
                .transactions()
                .forAccount(publicKey)
                .order('desc')
                .limit(10)
                .call();

            return transactions.records.map(tx => ({
                id: tx.id,
                hash: tx.hash,
                ledger: tx.ledger,
                createdAt: tx.created_at,
                sourceAccount: tx.source_account,
                successful: tx.successful
            }));
        } catch (error) {
            console.error('Error getting transaction history:', error);
            throw new Error('Failed to get transaction history');
        }
    }

    async submitTransaction(xdr) {
        try {
            const transaction = new StellarSdk.Transaction(
                xdr,
                this.networkPassphrase
            );
            const result = await this.server.submitTransaction(transaction);
            return result;
        } catch (error) {
            console.error('Error submitting transaction:', error);
            throw new Error('Failed to submit transaction');
        }
    }

    async getPaymentOperations(publicKey) {
        try {
            const payments = await this.server
                .payments()
                .forAccount(publicKey)
                .order('desc')
                .limit(10)
                .call();

            return payments.records.map(payment => ({
                id: payment.id,
                type: payment.type,
                from: payment.from,
                to: payment.to,
                amount: payment.amount,
                asset: payment.asset_type === 'native' ? 'Pi' : payment.asset_code,
                createdAt: payment.created_at
            }));
        } catch (error) {
            console.error('Error getting payment operations:', error);
            throw new Error('Failed to get payment operations');
        }
    }

    async getLedgerInfo() {
        try {
            const latestLedger = await this.server.ledgers().order('desc').limit(1).call();
            return latestLedger.records[0];
        } catch (error) {
            console.error('Error getting ledger info:', error);
            throw new Error('Failed to get ledger info');
        }
    }

    async monitorAccount(publicKey, callback) {
        try {
            const es = this.server.payments()
                .forAccount(publicKey)
                .cursor('now')
                .stream({
                    onmessage: payment => {
                        callback(null, payment);
                    },
                    onerror: error => {
                        callback(error);
                    }
                });
            return es;
        } catch (error) {
            console.error('Error monitoring account:', error);
            throw new Error('Failed to monitor account');
        }
    }
}

module.exports = new BlockchainService();
