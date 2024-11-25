require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../backend/models/User');
const Contract = require('../backend/models/Contract');
const Transaction = require('../backend/models/Transaction');
const crypto = require('crypto');

async function testDatabase() {
    try {
        // Connect to MongoDB
        const password = encodeURIComponent(process.env.DB_PASSWORD);
        const uri = process.env.MONGODB_URI.replace(/:[^:@]+@/, `:${password}@`);
        
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: process.env.DB_NAME
        });

        console.log('Connected to MongoDB Atlas');

        // Create test user
        const testUser = new User({
            piWalletId: `wallet_${Date.now()}`,
            username: `user_${Date.now()}`,
            encryptedData: crypto.randomBytes(32).toString('hex'),
            publicKey: crypto.randomBytes(32).toString('hex'),
            nonce: crypto.randomBytes(16).toString('hex'),
            role: 'user',
            status: 'active',
            riskProfile: {
                score: 75,
                lastUpdated: new Date(),
                factors: [
                    {
                        type: 'TRADING_HISTORY',
                        score: 80,
                        weight: 0.3
                    },
                    {
                        type: 'TRADING_VOLUME',
                        score: 70,
                        weight: 0.2
                    }
                ]
            },
            portfolio: {
                totalValue: 1000,
                lastUpdated: new Date(),
                assets: [
                    {
                        type: 'PI',
                        amount: 1000,
                        value: 1000
                    },
                    {
                        type: 'BTC',
                        amount: 500,
                        value: 500
                    }
                ]
            }
        });

        const savedUser = await testUser.save();
        console.log('Test user created:', savedUser.username);

        // Create test contract
        const testContract = new Contract({
            templateId: `template_${Date.now()}`,
            type: 'ESCROW',
            status: 'DRAFT',
            parties: [{
                userId: savedUser._id,
                role: 'INITIATOR',
                status: 'PENDING',
                encryptedData: crypto.randomBytes(32).toString('hex'),
                publicKey: crypto.randomBytes(32).toString('hex')
            }],
            parameters: {
                amount: 100,
                currency: 'PI',
                duration: '30d'
            },
            security: {
                encryptionKey: crypto.randomBytes(32).toString('hex'),
                nonce: crypto.randomBytes(16).toString('hex')
            }
        });

        const savedContract = await testContract.save();
        console.log('Test contract created:', savedContract._id);

        // Create test transaction
        const testTransaction = new Transaction({
            transactionId: `tx_${Date.now()}`,
            type: 'TRANSFER',
            status: 'PENDING',
            sender: {
                userId: savedUser._id,
                walletAddress: 'sender_wallet_address'
            },
            recipient: {
                userId: savedUser._id,
                walletAddress: 'recipient_wallet_address'
            },
            amount: {
                value: 100,
                currency: 'PI'
            },
            fee: {
                value: 1,
                currency: 'PI'
            },
            blockchain: {
                network: 'PI_TESTNET',
                blockNumber: 12345
            },
            security: {
                signature: crypto.randomBytes(64).toString('hex'),
                encryptedData: crypto.randomBytes(32).toString('hex')
            }
        });

        const savedTransaction = await testTransaction.save();
        console.log('Test transaction created:', savedTransaction.transactionId);

        // Test queries
        console.log('\nTesting queries...');

        // Test user query
        const foundUser = await User.findOne({ username: savedUser.username })
            .select('username portfolio.totalValue riskProfile.score');
        console.log('Found user:', {
            username: foundUser.username,
            portfolioValue: foundUser.portfolio.totalValue,
            riskScore: foundUser.riskProfile.score
        });

        // Test contract query
        const foundContract = await Contract.findOne({ 'parties.userId': savedUser._id })
            .select('type status parameters');
        console.log('Found contract:', {
            type: foundContract.type,
            status: foundContract.status,
            amount: foundContract.parameters.amount
        });

        // Test transaction query
        const foundTransaction = await Transaction.findOne({ 
            'sender.userId': savedUser._id,
            type: 'TRANSFER'
        }).select('transactionId type status amount');
        console.log('Found transaction:', {
            id: foundTransaction.transactionId,
            type: foundTransaction.type,
            status: foundTransaction.status,
            amount: foundTransaction.amount
        });

        // Clean up test data
        console.log('\nCleaning up test data...');
        await User.deleteOne({ _id: savedUser._id });
        await Contract.deleteOne({ _id: savedContract._id });
        await Transaction.deleteOne({ _id: savedTransaction._id });
        console.log('Test data cleaned up successfully');

    } catch (error) {
        console.error('Error during database testing:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

testDatabase().catch(console.error);
