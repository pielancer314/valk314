const express = require('express');
const router = express.Router();
const transportService = require('../services/transportService');

// Create a new ride
router.post('/rides', async (req, res) => {
    try {
        const ride = await transportService.createRide(req.body);
        res.json(ride);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Confirm a ride
router.post('/rides/:rideId/confirm', async (req, res) => {
    try {
        const ride = await transportService.confirmRide(req.params.rideId);
        res.json(ride);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel a ride
router.post('/rides/:rideId/cancel', async (req, res) => {
    try {
        const ride = await transportService.cancelRide(req.params.rideId);
        res.json(ride);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a specific ride
router.get('/rides/:rideId', async (req, res) => {
    try {
        const ride = transportService.getRide(req.params.rideId);
        res.json(ride);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Get user's rides
router.get('/users/:userId/rides', async (req, res) => {
    try {
        const rides = transportService.getUserRides(req.params.userId);
        res.json(rides);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get estimated price
router.post('/rides/estimate', async (req, res) => {
    try {
        const { pickupLocation, dropoffLocation } = req.body;
        const estimatedPrice = transportService.calculateEstimatedPrice(
            pickupLocation,
            dropoffLocation
        );
        res.json({ estimatedPrice });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
