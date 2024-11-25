require('dotenv').config();
const { MongoClient } = require('mongodb');

async function initializeDatabase() {
    // Properly encode the password for the URI
    const password = encodeURIComponent(process.env.DB_PASSWORD);
    const uri = process.env.MONGODB_URI.replace(/:[^:@]+@/, `:${password}@`);
    
    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas');

        // Create database
        const db = client.db(process.env.DB_NAME);
        
        console.log('Creating collections with validators...');

        // Create collections with validators
        await db.createCollection('users', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['piWalletId', 'username', 'encryptedData', 'publicKey', 'nonce'],
                    properties: {
                        piWalletId: { bsonType: 'string' },
                        username: { bsonType: 'string' },
                        encryptedData: { bsonType: 'string' },
                        publicKey: { bsonType: 'string' },
                        nonce: { bsonType: 'string' }
                    }
                }
            }
        }).catch(err => {
            if (err.code !== 48) { // Skip if collection already exists
                throw err;
            }
            console.log('Users collection already exists');
        });

        await db.createCollection('contracts', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['templateId', 'type', 'status', 'parties', 'parameters'],
                    properties: {
                        templateId: { bsonType: 'string' },
                        type: { bsonType: 'string' },
                        status: { bsonType: 'string' },
                        parties: { bsonType: 'array' },
                        parameters: { bsonType: 'object' }
                    }
                }
            }
        }).catch(err => {
            if (err.code !== 48) {
                throw err;
            }
            console.log('Contracts collection already exists');
        });

        await db.createCollection('transactions', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['transactionId', 'type', 'status', 'sender', 'recipient', 'amount'],
                    properties: {
                        transactionId: { bsonType: 'string' },
                        type: { bsonType: 'string' },
                        status: { bsonType: 'string' },
                        sender: { bsonType: 'object' },
                        recipient: { bsonType: 'object' },
                        amount: { bsonType: 'object' }
                    }
                }
            }
        }).catch(err => {
            if (err.code !== 48) {
                throw err;
            }
            console.log('Transactions collection already exists');
        });

        console.log('Collections created successfully');

        console.log('Creating indexes...');
        // Create indexes
        const users = db.collection('users');
        await users.createIndex({ 'piWalletId': 1 }, { unique: true });
        await users.createIndex({ 'username': 1 }, { unique: true });

        const contracts = db.collection('contracts');
        await contracts.createIndex({ 'type': 1, 'status': 1 });
        await contracts.createIndex({ 'parties.userId': 1 });

        const transactions = db.collection('transactions');
        await transactions.createIndex({ 'transactionId': 1 }, { unique: true });
        await transactions.createIndex({ 'sender.userId': 1, 'recipient.userId': 1 });
        await transactions.createIndex({ 'blockchain.transactionHash': 1 });

        console.log('Indexes created successfully');
        console.log('Database initialization completed successfully');

    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('Database connection closed');
    }
}

initializeDatabase().catch(console.error);
