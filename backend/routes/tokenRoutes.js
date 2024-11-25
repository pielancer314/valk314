const express = require('express');
const router = express.Router();
const tokenizationService = require('../services/tokenizationService');

// Create new tokens
router.post('/create', async (req, res) => {
    try {
        const { amount, recipient } = req.body;
        const result = await tokenizationService.createToken(amount, recipient);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get token balance
router.get('/balance/:accountId', async (req, res) => {
    try {
        const balance = await tokenizationService.getTokenBalance(req.params.accountId);
        res.json({ balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Transfer tokens
router.post('/transfer', async (req, res) => {
    try {
        const { fromSecret, toPublicKey, amount } = req.body;
        const result = await tokenizationService.transferTokens(fromSecret, toPublicKey, amount);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create trustline
router.post('/trustline', async (req, res) => {
    try {
        const { accountSecret } = req.body;
        const result = await tokenizationService.createTrustline(accountSecret);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
