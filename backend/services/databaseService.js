const User = require('../models/User');
const Contract = require('../models/Contract');
const Transaction = require('../models/Transaction');

class DatabaseService {
    // User Queries
    static async findUserByWallet(piWalletId, projection = {}) {
        return User.findOne({ piWalletId })
            .select(projection)
            .lean();
    }

    static async findUsersByRiskScore(minScore, maxScore) {
        return User.find({
            'riskProfile.score': { $gte: minScore, $lte: maxScore }
        })
        .select('username riskProfile portfolio')
        .lean();
    }

    static async findUsersWithAssetType(assetType) {
        return User.find({
            'portfolio.assets': {
                $elemMatch: { type: assetType }
            }
        })
        .select('username portfolio')
        .lean();
    }

    static async aggregateUserPortfolios() {
        return User.aggregate([
            { $unwind: '$portfolio.assets' },
            {
                $group: {
                    _id: '$portfolio.assets.type',
                    totalValue: { $sum: '$portfolio.assets.value' },
                    totalAmount: { $sum: '$portfolio.assets.amount' },
                    userCount: { $sum: 1 }
                }
            },
            { $sort: { totalValue: -1 } }
        ]);
    }

    // Contract Queries
    static async findActiveContractsByUser(userId, status = ['ACTIVE', 'PENDING']) {
        return Contract.find({
            'parties.userId': userId,
            status: { $in: status }
        })
        .select('type status parameters parties')
        .lean();
    }

    static async findContractsByValue(minValue, maxValue) {
        return Contract.find({
            'parameters.amount': { $gte: minValue, $lte: maxValue }
        })
        .select('type status parameters parties')
        .lean();
    }

    static async aggregateContractsByType() {
        return Contract.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$parameters.amount' }
                }
            },
            { $sort: { count: -1 } }
        ]);
    }

    // Transaction Queries
    static async findTransactionsByDateRange(startDate, endDate) {
        return Transaction.find({
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        })
        .select('transactionId type status amount')
        .lean();
    }

    static async findTransactionsByUser(userId, type = null) {
        const query = {
            $or: [
                { 'sender.userId': userId },
                { 'recipient.userId': userId }
            ]
        };
        if (type) query.type = type;

        return Transaction.find(query)
            .select('transactionId type status amount')
            .lean();
    }

    static async aggregateTransactionVolume(timeframe = 'daily') {
        const groupByDate = {
            daily: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            weekly: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } },
            monthly: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
        };

        return Transaction.aggregate([
            {
                $group: {
                    _id: { date: groupByDate[timeframe], currency: '$amount.currency' },
                    volume: { $sum: '$amount.value' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.date': -1 } }
        ]);
    }

    // Analytics Queries
    static async getUserAnalytics(userId) {
        const [user, contracts, transactions] = await Promise.all([
            User.findById(userId).select('analytics portfolio').lean(),
            this.findActiveContractsByUser(userId),
            this.findTransactionsByUser(userId)
        ]);

        const totalTransactionVolume = transactions.reduce((sum, tx) => 
            sum + (tx.amount?.value || 0), 0);

        return {
            user,
            activeContracts: contracts.length,
            totalTransactions: transactions.length,
            transactionVolume: totalTransactionVolume,
            portfolioValue: user.portfolio.totalValue,
            performanceMetrics: user.analytics.performanceMetrics
        };
    }

    static async getSystemAnalytics() {
        const [
            userStats,
            contractStats,
            transactionStats
        ] = await Promise.all([
            User.aggregate([
                {
                    $group: {
                        _id: null,
                        totalUsers: { $sum: 1 },
                        avgRiskScore: { $avg: '$riskProfile.score' },
                        totalPortfolioValue: { $sum: '$portfolio.totalValue' }
                    }
                }
            ]),
            this.aggregateContractsByType(),
            this.aggregateTransactionVolume('monthly')
        ]);

        return {
            userStats: userStats[0],
            contractStats,
            transactionStats
        };
    }
}

module.exports = DatabaseService;
