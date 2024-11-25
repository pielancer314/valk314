const mongoose = require('mongoose');
const crypto = require('crypto');

const contractSchema = new mongoose.Schema({
    templateId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['ESCROW', 'SWAP', 'LOAN', 'INVESTMENT', 'CUSTOM'],
        index: true
    },
    status: {
        type: String,
        required: true,
        enum: ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'COMPLETED', 'FAILED', 'CANCELLED'],
        default: 'DRAFT',
        index: true
    },
    parties: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING'
        },
        signature: String,
        encryptedData: String,
        publicKey: String
    }],
    parameters: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    conditions: [{
        type: {
            type: String,
            required: true
        },
        parameters: mongoose.Schema.Types.Mixed,
        status: {
            type: String,
            enum: ['PENDING', 'MET', 'FAILED'],
            default: 'PENDING'
        },
        evaluatedAt: Date
    }],
    actions: [{
        type: {
            type: String,
            required: true
        },
        parameters: mongoose.Schema.Types.Mixed,
        status: {
            type: String,
            enum: ['PENDING', 'COMPLETED', 'FAILED'],
            default: 'PENDING'
        },
        executedAt: Date,
        result: mongoose.Schema.Types.Mixed
    }],
    security: {
        zkProof: String,
        encryptionKey: {
            type: String,
            required: true
        },
        nonce: {
            type: String,
            required: true
        },
        signatures: Map
    },
    execution: {
        startTime: Date,
        endTime: Date,
        nextExecutionTime: Date,
        attempts: [{
            timestamp: Date,
            status: String,
            error: String
        }]
    },
    history: [{
        event: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        data: mongoose.Schema.Types.Mixed,
        initiator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    metrics: {
        executionTime: Number,
        gasUsed: Number,
        cost: Number,
        successRate: Number
    },
    validation: {
        lastValidated: Date,
        validUntil: Date,
        validators: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            timestamp: Date,
            signature: String,
            result: Boolean
        }]
    }
}, {
    timestamps: true
});

// Indexes
contractSchema.index({ 'type': 1, 'status': 1 });
contractSchema.index({ 'parties.userId': 1 });
contractSchema.index({ 'createdAt': -1 });
contractSchema.index({ 'execution.nextExecutionTime': 1 }, { sparse: true });

// Methods
contractSchema.methods.generateContractKey = async function() {
    const key = crypto.randomBytes(32);
    const nonce = crypto.randomBytes(16);
    return {
        key: key.toString('hex'),
        nonce: nonce.toString('hex')
    };
};

contractSchema.methods.validateContract = async function() {
    // Validate all conditions are met
    const conditions = await Promise.all(
        this.conditions.map(condition => this.evaluateCondition(condition))
    );

    return conditions.every(condition => condition.status === 'MET');
};

contractSchema.methods.evaluateCondition = async function(condition) {
    try {
        // Implementation of condition evaluation logic
        const result = await this.executeConditionLogic(condition);
        
        condition.status = result ? 'MET' : 'FAILED';
        condition.evaluatedAt = new Date();
        
        await this.save();
        return condition;
    } catch (error) {
        condition.status = 'FAILED';
        condition.evaluatedAt = new Date();
        await this.save();
        throw error;
    }
};

contractSchema.methods.executeAction = async function(action) {
    try {
        // Implementation of action execution logic
        const result = await this.executeActionLogic(action);
        
        action.status = 'COMPLETED';
        action.executedAt = new Date();
        action.result = result;
        
        await this.save();
        return action;
    } catch (error) {
        action.status = 'FAILED';
        action.executedAt = new Date();
        await this.save();
        throw error;
    }
};

contractSchema.methods.addPartySignature = async function(userId, signature) {
    const party = this.parties.find(p => p.userId.toString() === userId.toString());
    if (!party) {
        throw new Error('Party not found in contract');
    }

    party.signature = signature;
    party.status = 'APPROVED';
    
    // Check if all parties have approved
    const allApproved = this.parties.every(p => p.status === 'APPROVED');
    if (allApproved) {
        this.status = 'ACTIVE';
    }

    await this.save();
    return this;
};

contractSchema.methods.executeConditionLogic = async function(condition) {
    // This would be replaced with actual condition evaluation logic
    return true; // Placeholder
};

contractSchema.methods.executeActionLogic = async function(action) {
    // This would be replaced with actual action execution logic
    return { success: true }; // Placeholder
};

const Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;
