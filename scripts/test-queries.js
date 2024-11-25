require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const DatabaseService = require('../backend/services/databaseService');
const User = require('../backend/models/User');
const Contract = require('../backend/models/Contract');
const Transaction = require('../backend/models/Transaction');

async function generateTestData() {
    // Create test users
    const users = await Promise.all([
        new User({
            piWalletId: 'wallet_test1',
            username: 'test_user1',
            encryptedData: 'encrypted1',
            publicKey: 'pubkey1',
            nonce: 'nonce1',
            role: 'user',
            status: 'active',
            riskProfile: {
                score: 85,
                lastUpdated: new Date(),
                factors: [
                    { type: 'TRADING_HISTORY', score: 90, weight: 0.3 },
                    { type: 'TRADING_VOLUME', score: 80, weight: 0.2 }
                ]
            },
            portfolio: {
                totalValue: 2000,
                lastUpdated: new Date(),
                assets: [
                    { type: 'PI', amount: 1500, value: 1500 },
                    { type: 'BTC', amount: 500, value: 500 }
                ]
            }
        }).save(),
        new User({
            piWalletId: 'wallet_test2',
            username: 'test_user2',
            encryptedData: 'encrypted2',
            publicKey: 'pubkey2',
            nonce: 'nonce2',
            role: 'user',
            status: 'active',
            riskProfile: {
                score: 65,
                lastUpdated: new Date(),
                factors: [
                    { type: 'TRADING_HISTORY', score: 70, weight: 0.3 },
                    { type: 'TRADING_VOLUME', score: 60, weight: 0.2 }
                ]
            },
            portfolio: {
                totalValue: 1000,
                lastUpdated: new Date(),
                assets: [
                    { type: 'PI', amount: 800, value: 800 },
                    { type: 'ETH', amount: 200, value: 200 }
                ]
            }
        }).save()
    ]);

    // Create test contracts
    const contracts = await Promise.all([
        new Contract({
            templateId: 'template_test1',
            type: 'ESCROW',
            status: 'ACTIVE',
            parties: [{
                userId: users[0]._id,
                role: 'INITIATOR',
                status: 'APPROVED',
                encryptedData: crypto.randomBytes(32).toString('hex'),
                publicKey: crypto.randomBytes(32).toString('hex')
            }],
            parameters: {
                amount: 500,
                currency: 'PI',
                duration: '30d'
            },
            security: {
                encryptionKey: crypto.randomBytes(32).toString('hex'),
                nonce: crypto.randomBytes(16).toString('hex')
            }
        }).save(),
        new Contract({
            templateId: 'template_test2',
            type: 'SWAP',
            status: 'PENDING_APPROVAL',
            parties: [{
                userId: users[1]._id,
                role: 'INITIATOR',
                status: 'PENDING',
                encryptedData: crypto.randomBytes(32).toString('hex'),
                publicKey: crypto.randomBytes(32).toString('hex')
            }],
            parameters: {
                amount: 200,
                currency: 'PI',
                duration: '7d'
            },
            security: {
                encryptionKey: crypto.randomBytes(32).toString('hex'),
                nonce: crypto.randomBytes(16).toString('hex')
            }
        }).save()
    ]);

    // Create test transactions
    const transactions = await Promise.all([
        new Transaction({
            transactionId: 'tx_test1',
            type: 'TRANSFER',
            status: 'COMPLETED',
            sender: {
                userId: users[0]._id,
                walletAddress: 'wallet_test1'
            },
            recipient: {
                userId: users[1]._id,
                walletAddress: 'wallet_test2'
            },
            amount: {
                value: 300,
                currency: 'PI'
            },
            fee: {
                value: 0.1,
                currency: 'PI'
            },
            blockchain: {
                network: 'PI_MAINNET',
                blockNumber: 12345,
                blockHash: crypto.randomBytes(32).toString('hex'),
                transactionHash: crypto.randomBytes(32).toString('hex'),
                confirmations: 6
            },
            security: {
                signature: crypto.randomBytes(64).toString('hex'),
                zkProof: crypto.randomBytes(128).toString('hex'),
                encryptedData: crypto.randomBytes(32).toString('hex')
            },
            metadata: {
                purpose: 'Test transaction 1',
                notes: 'Direct transfer between users',
                tags: ['test', 'transfer']
            }
        }).save(),
        new Transaction({
            transactionId: 'tx_test2',
            type: 'SWAP',
            status: 'PENDING',
            sender: {
                userId: users[1]._id,
                walletAddress: 'wallet_test2'
            },
            recipient: {
                userId: users[0]._id,
                walletAddress: 'wallet_test1'
            },
            amount: {
                value: 150,
                currency: 'PI'
            },
            fee: {
                value: 0.1,
                currency: 'PI'
            },
            blockchain: {
                network: 'PI_MAINNET',
                blockNumber: 12346,
                blockHash: crypto.randomBytes(32).toString('hex'),
                transactionHash: crypto.randomBytes(32).toString('hex'),
                confirmations: 1
            },
            security: {
                signature: crypto.randomBytes(64).toString('hex'),
                zkProof: crypto.randomBytes(128).toString('hex'),
                encryptedData: crypto.randomBytes(32).toString('hex')
            },
            metadata: {
                purpose: 'Test transaction 2',
                notes: 'Contract-based transfer',
                tags: ['test', 'contract']
            }
        }).save()
    ]);

    return { users, contracts, transactions };
}

async function testQueries() {
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

        // Clean up any existing test data
        console.log('\nCleaning up existing test data...');
        await Promise.all([
            User.deleteMany({ username: { $in: ['test_user1', 'test_user2'] } }),
            User.deleteMany({ piWalletId: { $in: ['wallet_test1', 'wallet_test2'] } }),
            Contract.deleteMany({ templateId: { $in: ['template_test1', 'template_test2'] } }),
            Transaction.deleteMany({ transactionId: { $in: ['tx_test1', 'tx_test2'] } })
        ]);
        console.log('Existing test data cleaned up');

        // Generate test data
        console.log('\nGenerating test data...');
        const testData = await generateTestData();
        console.log('Test data generated successfully');

        // Test user queries
        console.log('\nTesting user queries...');
        const usersByRisk = await DatabaseService.findUsersByRiskScore(60, 90);
        console.log('Users by risk score:', usersByRisk.length);

        const usersWithPI = await DatabaseService.findUsersWithAssetType('PI');
        console.log('Users with PI:', usersWithPI.length);

        const portfolioStats = await DatabaseService.aggregateUserPortfolios();
        console.log('Portfolio statistics:', portfolioStats);

        // Test contract queries
        console.log('\nTesting contract queries...');
        const activeContracts = await DatabaseService.findActiveContractsByUser(testData.users[0]._id);
        console.log('Active contracts:', activeContracts.length);

        const contractsByValue = await DatabaseService.findContractsByValue(100, 1000);
        console.log('Contracts by value:', contractsByValue.length);

        const contractStats = await DatabaseService.aggregateContractsByType();
        console.log('Contract statistics:', contractStats);

        // Test transaction queries
        console.log('\nTesting transaction queries...');
        const userTransactions = await DatabaseService.findTransactionsByUser(testData.users[0]._id);
        console.log('User transactions:', userTransactions.length);

        const transactionVolume = await DatabaseService.aggregateTransactionVolume('daily');
        console.log('Transaction volume:', transactionVolume);

        // Test analytics
        console.log('\nTesting analytics...');
        const userAnalytics = await DatabaseService.getUserAnalytics(testData.users[0]._id);
        console.log('User analytics:', userAnalytics);

        const systemAnalytics = await DatabaseService.getSystemAnalytics();
        console.log('System analytics:', systemAnalytics);

        // Clean up test data
        console.log('\nCleaning up test data...');
        await Promise.all([
            User.deleteMany({ username: { $in: ['test_user1', 'test_user2'] } }),
            Contract.deleteMany({ templateId: { $in: ['template_test1', 'template_test2'] } }),
            Transaction.deleteMany({ transactionId: { $in: ['tx_test1', 'tx_test2'] } })
        ]);
        console.log('Test data cleaned up successfully');

    } catch (error) {
        console.error('Error during query testing:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

testQueries().catch(console.error);
