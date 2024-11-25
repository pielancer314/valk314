const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainService');

// Create a new account
router.post('/accounts', async (req, res) => {
    try {
        const { startingBalance } = req.body;
        const account = await blockchainService.createAccount(startingBalance);
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get account information
router.get('/accounts/:publicKey', async (req, res) => {
    try {
        const accountInfo = await blockchainService.getAccountInfo(req.params.publicKey);
        res.json(accountInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get transaction history
router.get('/accounts/:publicKey/transactions', async (req, res) => {
    try {
        const transactions = await blockchainService.getTransactionHistory(req.params.publicKey);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get payment operations
router.get('/accounts/:publicKey/payments', async (req, res) => {
    try {
        const payments = await blockchainService.getPaymentOperations(req.params.publicKey);
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submit a transaction
router.post('/transactions', async (req, res) => {
    try {
        const { xdr } = req.body;
        const result = await blockchainService.submitTransaction(xdr);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get latest ledger info
router.get('/ledger', async (req, res) => {
    try {
        const ledgerInfo = await blockchainService.getLedgerInfo();
        res.json(ledgerInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// WebSocket endpoint for account monitoring
router.ws('/accounts/:publicKey/monitor', (ws, req) => {
    const { publicKey } = req.params;
    
    const eventSource = blockchainService.monitorAccount(publicKey, (error, payment) => {
        if (error) {
            ws.send(JSON.stringify({ type: 'error', error: error.message }));
        } else {
            ws.send(JSON.stringify({ type: 'payment', payment }));
        }
    });

    ws.on('close', () => {
        if (eventSource) {
            eventSource.close();
        }
    });
});

module.exports = router;
