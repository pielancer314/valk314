const piPaymentService = require('./piPaymentService');

class TransportService {
    constructor() {
        this.rides = new Map(); // In-memory storage for demo. Replace with database in production
    }

    async createRide(data) {
        const {
            pickupLocation,
            dropoffLocation,
            userId,
            estimatedPrice
        } = data;

        const rideId = Date.now().toString();
        const ride = {
            id: rideId,
            userId,
            pickupLocation,
            dropoffLocation,
            estimatedPrice,
            status: 'PENDING',
            createdAt: new Date(),
            payment: null
        };

        // Create Pi payment for the ride
        try {
            const payment = await piPaymentService.createPayment(
                estimatedPrice,
                `Ride from ${pickupLocation} to ${dropoffLocation}`,
                rideId
            );
            ride.payment = payment;
            this.rides.set(rideId, ride);
            return ride;
        } catch (error) {
            console.error('Error creating ride:', error);
            throw new Error('Failed to create ride');
        }
    }

    async confirmRide(rideId) {
        const ride = this.rides.get(rideId);
        if (!ride) {
            throw new Error('Ride not found');
        }

        try {
            const payment = await piPaymentService.completePayment(ride.payment.identifier);
            ride.status = 'CONFIRMED';
            ride.payment = payment;
            this.rides.set(rideId, ride);
            return ride;
        } catch (error) {
            console.error('Error confirming ride:', error);
            throw new Error('Failed to confirm ride');
        }
    }

    async cancelRide(rideId) {
        const ride = this.rides.get(rideId);
        if (!ride) {
            throw new Error('Ride not found');
        }

        try {
            if (ride.payment) {
                await piPaymentService.cancelPayment(ride.payment.identifier);
            }
            ride.status = 'CANCELLED';
            this.rides.set(rideId, ride);
            return ride;
        } catch (error) {
            console.error('Error canceling ride:', error);
            throw new Error('Failed to cancel ride');
        }
    }

    getRide(rideId) {
        const ride = this.rides.get(rideId);
        if (!ride) {
            throw new Error('Ride not found');
        }
        return ride;
    }

    getUserRides(userId) {
        return Array.from(this.rides.values())
            .filter(ride => ride.userId === userId)
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    calculateEstimatedPrice(pickupLocation, dropoffLocation) {
        // Simplified price calculation for demo
        // In production, implement actual distance and pricing logic
        const basePrice = 1; // 1 Pi
        const distanceMultiplier = 0.5; // 0.5 Pi per km
        const mockDistanceKm = 5; // Mock distance for demo

        return basePrice + (distanceMultiplier * mockDistanceKm);
    }
}

module.exports = new TransportService();
