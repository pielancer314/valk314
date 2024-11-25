const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    piWalletId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    encryptedData: {
        type: String,
        required: true
    },
    publicKey: {
        type: String,
        required: true
    },
    nonce: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'locked'],
        default: 'active'
    },
    riskProfile: {
        score: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        },
        factors: [{
            type: {
                type: String,
                enum: ['TRADING_HISTORY', 'TRADING_VOLUME', 'ACCOUNT_AGE', 'VERIFICATION_LEVEL']
            },
            score: {
                type: Number,
                required: true,
                min: 0,
                max: 100
            },
            weight: {
                type: Number,
                required: true,
                min: 0,
                max: 1
            }
        }]
    },
    portfolio: {
        totalValue: {
            type: Number,
            required: true,
            min: 0
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        },
        assets: [{
            type: {
                type: String,
                enum: ['PI', 'BTC', 'ETH', 'USDT']
            },
            amount: {
                type: Number,
                required: true,
                min: 0
            },
            value: {
                type: Number,
                required: true,
                min: 0
            }
        }]
    },
    contracts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract'
    }],
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }],
    analytics: {
        performanceMetrics: {
            returns: {
                daily: Number,
                weekly: Number,
                monthly: Number,
                yearly: Number
            },
            risk: {
                volatility: Number,
                sharpeRatio: Number,
                maxDrawdown: Number
            }
        },
        tradingHistory: [{
            date: Date,
            type: String,
            amount: Number,
            success: Boolean
        }]
    },
    settings: {
        autoTrade: {
            type: Boolean,
            default: false
        },
        riskTolerance: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        notifications: {
            email: Boolean,
            push: Boolean,
            sms: Boolean
        },
        tradingLimits: {
            daily: Number,
            monthly: Number
        }
    },
    security: {
        twoFactorEnabled: {
            type: Boolean,
            default: false
        },
        lastLogin: Date,
        loginAttempts: {
            count: {
                type: Number,
                default: 0
            },
            lastAttempt: Date
        },
        devices: [{
            deviceId: String,
            lastAccess: Date,
            ipAddress: String,
            userAgent: String
        }]
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ 'piWalletId': 1, 'username': 1 });
userSchema.index({ 'status': 1 });
userSchema.index({ 'role': 1 });
userSchema.index({ 'portfolio.totalValue': -1 });

// Methods
userSchema.methods.generateEncryptionKey = async function() {
    const salt = crypto.randomBytes(16);
    const key = await crypto.pbkdf2Sync(this.piWalletId, salt, 100000, 32, 'sha512');
    return { key: key.toString('hex'), salt: salt.toString('hex') };
};

userSchema.methods.updateRiskProfile = async function() {
    // Implementation of risk profile update logic
    const riskFactors = [
        { type: 'TRADING_HISTORY', weight: 0.3 },
        { type: 'TRADING_VOLUME', weight: 0.2 },
        { type: 'ACCOUNT_AGE', weight: 0.2 },
        { type: 'VERIFICATION_LEVEL', weight: 0.15 },
        { type: 'COMPLIANCE_HISTORY', weight: 0.15 }
    ];

    let totalScore = 0;
    const factors = [];

    for (const factor of riskFactors) {
        const score = await this.calculateRiskFactor(factor.type);
        totalScore += score * factor.weight;
        factors.push({
            type: factor.type,
            score: score,
            weight: factor.weight
        });
    }

    this.riskProfile = {
        score: totalScore,
        lastUpdated: new Date(),
        factors: factors
    };

    await this.save();
    return this.riskProfile;
};

userSchema.methods.calculateRiskFactor = async function(factorType) {
    // Implementation of risk factor calculation
    // This would be replaced with actual risk calculation logic
    return Math.random(); // Placeholder
};

userSchema.methods.updatePortfolio = async function() {
    // Implementation of portfolio update logic
    const assets = await Promise.all(
        this.portfolio.assets.map(async asset => {
            const currentPrice = await this.getCurrentPrice(asset.type);
            return {
                ...asset,
                value: asset.amount * currentPrice
            };
        })
    );

    this.portfolio = {
        ...this.portfolio,
        assets,
        totalValue: assets.reduce((total, asset) => total + asset.value, 0),
        lastUpdated: new Date()
    };

    await this.save();
    return this.portfolio;
};

userSchema.methods.getCurrentPrice = async function(assetType) {
    // Implementation of price fetching logic
    // This would be replaced with actual price fetching from an oracle or exchange
    return 100; // Placeholder
};

const User = mongoose.model('User', userSchema);

module.exports = User;
