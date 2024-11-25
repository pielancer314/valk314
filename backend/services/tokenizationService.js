const axios = require('axios');
const { StellarSdk } = require('stellar-sdk');

class TokenizationService {
    constructor() {
        this.network = process.env.PI_NETWORK || 'testnet';
        this.server = new StellarSdk.Server(
            this.network === 'mainnet' 
                ? 'https://api.mainnet.minepi.com' 
                : 'https://api.testnet.minepi.com'
        );
        this.assetCode = 'VALK';
        this.issuerKeypair = StellarSdk.Keypair.fromSecret(process.env.PI_WALLET_PRIVATE_KEY);
    }

    async createToken(amount, recipient) {
        try {
            const issuerAccount = await this.server.loadAccount(this.issuerKeypair.publicKey());
            const asset = new StellarSdk.Asset(this.assetCode, this.issuerKeypair.publicKey());

            const transaction = new StellarSdk.TransactionBuilder(issuerAccount, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: this.network === 'mainnet' 
                    ? StellarSdk.Networks.PUBLIC 
                    : StellarSdk.Networks.TESTNET
            })
            .addOperation(StellarSdk.Operation.payment({
                destination: recipient,
                asset: asset,
                amount: amount.toString()
            }))
            .setTimeout(30)
            .build();

            transaction.sign(this.issuerKeypair);
            const result = await this.server.submitTransaction(transaction);
            
            return {
                success: true,
                transaction: result,
                asset: {
                    code: this.assetCode,
                    issuer: this.issuerKeypair.publicKey()
                }
            };
        } catch (error) {
            console.error('Error creating token:', error);
            throw new Error('Failed to create token');
        }
    }

    async getTokenBalance(accountId) {
        try {
            const account = await this.server.loadAccount(accountId);
            const balance = account.balances.find(
                balance => balance.asset_code === this.assetCode && 
                          balance.asset_issuer === this.issuerKeypair.publicKey()
            );
            
            return balance ? balance.balance : '0';
        } catch (error) {
            console.error('Error getting token balance:', error);
            throw new Error('Failed to get token balance');
        }
    }

    async transferTokens(fromSecret, toPublicKey, amount) {
        try {
            const fromKeypair = StellarSdk.Keypair.fromSecret(fromSecret);
            const fromAccount = await this.server.loadAccount(fromKeypair.publicKey());
            const asset = new StellarSdk.Asset(this.assetCode, this.issuerKeypair.publicKey());

            const transaction = new StellarSdk.TransactionBuilder(fromAccount, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: this.network === 'mainnet' 
                    ? StellarSdk.Networks.PUBLIC 
                    : StellarSdk.Networks.TESTNET
            })
            .addOperation(StellarSdk.Operation.payment({
                destination: toPublicKey,
                asset: asset,
                amount: amount.toString()
            }))
            .setTimeout(30)
            .build();

            transaction.sign(fromKeypair);
            const result = await this.server.submitTransaction(transaction);
            
            return {
                success: true,
                transaction: result
            };
        } catch (error) {
            console.error('Error transferring tokens:', error);
            throw new Error('Failed to transfer tokens');
        }
    }

    async createTrustline(accountSecret) {
        try {
            const accountKeypair = StellarSdk.Keypair.fromSecret(accountSecret);
            const account = await this.server.loadAccount(accountKeypair.publicKey());
            const asset = new StellarSdk.Asset(this.assetCode, this.issuerKeypair.publicKey());

            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: this.network === 'mainnet' 
                    ? StellarSdk.Networks.PUBLIC 
                    : StellarSdk.Networks.TESTNET
            })
            .addOperation(StellarSdk.Operation.changeTrust({
                asset: asset
            }))
            .setTimeout(30)
            .build();

            transaction.sign(accountKeypair);
            const result = await this.server.submitTransaction(transaction);
            
            return {
                success: true,
                transaction: result
            };
        } catch (error) {
            console.error('Error creating trustline:', error);
            throw new Error('Failed to create trustline');
        }
    }
}

module.exports = new TokenizationService();
