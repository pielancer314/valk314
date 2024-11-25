require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const paymentService = require('./services/paymentService');
const autonomousBankingService = require('./services/autonomousBankingService');

const app = express();

// Enhanced error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
};

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Connection handling
const server = require('http').createServer(app);

// Basic health check route with enhanced info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Valk314 API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Payment routes with improved error handling
app.post('/api/payments', async (req, res, next) => {
  try {
    const { amount, memo, metadata } = req.body;
    if (!amount || amount <= 0) {
      throw new Error('Invalid payment amount');
    }
    const payment = await paymentService.createPayment(amount, memo, metadata);
    res.json(payment);
  } catch (error) {
    next(error);
  }
});

app.post('/api/payments/:paymentId/complete', async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { txid } = req.body;
    const payment = await paymentService.completePayment(paymentId, txid);
    res.json(payment);
  } catch (error) {
    next(error);
  }
});

app.get('/api/payments/:paymentId', async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = await paymentService.getPaymentStatus(paymentId);
    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }
    res.json(payment);
  } catch (error) {
    next(error);
  }
});

app.post('/api/payments/:paymentId/cancel', async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = await paymentService.cancelPayment(paymentId);
    res.json(payment);
  } catch (error) {
    next(error);
  }
});

app.get('/api/users/:userId/payments', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const payments = await paymentService.getPaymentHistory(userId);
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

// Autonomous Banking Routes
app.post('/api/banking/accounts', async (req, res, next) => {
  try {
    const { userId, initialBalance } = req.body;
    const account = await autonomousBankingService.createAccount(userId, initialBalance);
    res.json(account);
  } catch (error) {
    next(error);
  }
});

app.get('/api/banking/accounts/:accountId/balance', async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const balance = await autonomousBankingService.getAccountBalance(accountId);
    res.json({ balance });
  } catch (error) {
    next(error);
  }
});

app.post('/api/banking/smart-contracts', async (req, res, next) => {
  try {
    const { accountId, contractType, parameters } = req.body;
    const contract = await autonomousBankingService.deploySmartContract(
      accountId,
      contractType,
      parameters
    );
    res.json(contract);
  } catch (error) {
    next(error);
  }
});

app.post('/api/banking/transactions', async (req, res, next) => {
  try {
    const { fromAccountId, toAccountId, amount, type } = req.body;
    const transaction = await autonomousBankingService.processAutonomousTransaction(
      fromAccountId,
      toAccountId,
      amount,
      type
    );
    res.json(transaction);
  } catch (error) {
    next(error);
  }
});

app.post('/api/banking/investment-strategies', async (req, res, next) => {
  try {
    const { accountId, strategy } = req.body;
    const investmentStrategy = await autonomousBankingService.createInvestmentStrategy(
      accountId,
      strategy
    );
    res.json(investmentStrategy);
  } catch (error) {
    next(error);
  }
});

app.get('/api/banking/accounts/:accountId/analytics', async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const analytics = await autonomousBankingService.generateAccountAnalytics(accountId);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

app.post('/api/banking/transactions/:transactionId/risk-assessment', async (req, res, next) => {
  try {
    const transaction = req.body;
    const riskAssessment = await autonomousBankingService.assessTransactionRisk(transaction);
    res.json(riskAssessment);
  } catch (error) {
    next(error);
  }
});

// Blockchain operations with improved error handling
app.get('/api/blockchain/accounts/:publicKey', async (req, res, next) => {
  try {
    const { publicKey } = req.params;
    // Mock response for now
    res.json({
      publicKey,
      balance: '100 Pi',
      transactions: []
    });
  } catch (error) {
    next(error);
  }
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

// Dynamic port assignment with fallback
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});
