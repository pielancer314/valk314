const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['TRANSFER', 'SWAP', 'STAKE', 'UNSTAKE', 'LOAN_REPAYMENT', 'YIELD_CLAIM'],
        index: true
    },
    status: {
        type: String,
        required: true,
        enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
        default: 'PENDING',
        index: true
    },
    sender: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        walletAddress: {
            type: String,
            required: true
        }
    },
    recipient: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        walletAddress: {
            type: String,
            required: true
        }
    },
    amount: {
        value: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            required: true
        }
    },
    fee: {
        value: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            required: true
        }
    },
    contractId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract'
    },
    blockchain: {
        network: {
            type: String,
            required: true
        },
        blockNumber: Number,
        blockHash: String,
        transactionHash: String,
        confirmations: Number
    },
    security: {
        signature: {
            type: String,
            required: true
        },
        zkProof: String,
        encryptedData: String
    },
    metadata: {
        purpose: String,
        notes: String,
        tags: [String]
    },
    execution: {
        startTime: Date,
        endTime: Date,
        attempts: [{
            timestamp: Date,
            status: String,
            error: String
        }]
    },
    validation: {
        isValid: {
            type: Boolean,
            default: false
        },
        validatedBy: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            timestamp: Date,
            signature: String
        }]
    }
}, {
    timestamps: true
});

// Indexes
transactionSchema.index({ 'sender.userId': 1, 'recipient.userId': 1 });
transactionSchema.index({ 'blockchain.transactionHash': 1 });
transactionSchema.index({ 'createdAt': -1 });
transactionSchema.index({ 'status': 1, 'type': 1 });

// Methods
transactionSchema.methods.validateTransaction = async function() {
    try {
        // Implement validation logic here
        const isValid = await this.performValidation();
        
        this.validation.isValid = isValid;
        await this.save();
        
        return isValid;
    } catch (error) {
        this.status = 'FAILED';
        await this.save();
        throw error;
    }
};

transactionSchema.methods.processTransaction = async function() {
    try {
        this.status = 'PROCESSING';
        this.execution.startTime = new Date();
        
        // Implement transaction processing logic here
        const result = await this.executeTransaction();
        
        this.status = 'COMPLETED';
        this.execution.endTime = new Date();
        this.blockchain = {
            ...this.blockchain,
            ...result
        };
        
        await this.save();
        return this;
    } catch (error) {
        this.status = 'FAILED';
        this.execution.attempts.push({
            timestamp: new Date(),
            status: 'FAILED',
            error: error.message
        });
        await this.save();
        throw error;
    }
};

transactionSchema.methods.performValidation = async function() {
    // This would be replaced with actual validation logic
    return true; // Placeholder
};

transactionSchema.methods.executeTransaction = async function() {
    // This would be replaced with actual transaction execution logic
    return {
        blockNumber: 12345,
        blockHash: '0x...',
        transactionHash: '0x...',
        confirmations: 1
    }; // Placeholder
};

transactionSchema.methods.addValidation = async function(validator) {
    this.validation.validatedBy.push({
        userId: validator.userId,
        timestamp: new Date(),
        signature: validator.signature
    });
    
    await this.save();
    return this;
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
