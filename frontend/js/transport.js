class TransportService {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api/transport';
    }

    async createRide(pickupLocation, dropoffLocation, userId) {
        try {
            const estimateResponse = await fetch(`${this.apiUrl}/rides/estimate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pickupLocation, dropoffLocation })
            });
            const { estimatedPrice } = await estimateResponse.json();

            const response = await fetch(`${this.apiUrl}/rides`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pickupLocation,
                    dropoffLocation,
                    userId,
                    estimatedPrice
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating ride:', error);
            throw error;
        }
    }

    async confirmRide(rideId) {
        try {
            const response = await fetch(`${this.apiUrl}/rides/${rideId}/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error confirming ride:', error);
            throw error;
        }
    }

    async cancelRide(rideId) {
        try {
            const response = await fetch(`${this.apiUrl}/rides/${rideId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error canceling ride:', error);
            throw error;
        }
    }

    async getUserRides(userId) {
        try {
            const response = await fetch(`${this.apiUrl}/users/${userId}/rides`);
            return await response.json();
        } catch (error) {
            console.error('Error getting user rides:', error);
            throw error;
        }
    }
}

// Initialize transport service
const transportService = new TransportService();

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const bookRideForm = document.getElementById('bookRideForm');
    if (bookRideForm) {
        bookRideForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pickupLocation = document.getElementById('pickupLocation').value;
            const dropoffLocation = document.getElementById('dropoffLocation').value;
            
            try {
                const auth = await Pi.authenticate(['payments'], onIncompletePayment);
                if (auth) {
                    const ride = await transportService.createRide(
                        pickupLocation,
                        dropoffLocation,
                        auth.user.uid
                    );
                    showRideDetails(ride);
                }
            } catch (error) {
                console.error('Error booking ride:', error);
                alert('Failed to book ride. Please try again.');
            }
        });
    }
});

function showRideDetails(ride) {
    const rideDetailsDiv = document.getElementById('rideDetails');
    if (rideDetailsDiv) {
        rideDetailsDiv.innerHTML = `
            <div class="card mt-3">
                <div class="card-body">
                    <h5 class="card-title">Ride Details</h5>
                    <p>From: ${ride.pickupLocation}</p>
                    <p>To: ${ride.dropoffLocation}</p>
                    <p>Price: ${ride.estimatedPrice} Pi</p>
                    <p>Status: ${ride.status}</p>
                    <button onclick="confirmRide('${ride.id}')" class="btn btn-success">Confirm Ride</button>
                    <button onclick="cancelRide('${ride.id}')" class="btn btn-danger">Cancel Ride</button>
                </div>
            </div>
        `;
    }
}

async function confirmRide(rideId) {
    try {
        const ride = await transportService.confirmRide(rideId);
        alert('Ride confirmed successfully!');
        showRideDetails(ride);
    } catch (error) {
        console.error('Error confirming ride:', error);
        alert('Failed to confirm ride. Please try again.');
    }
}

async function cancelRide(rideId) {
    try {
        const ride = await transportService.cancelRide(rideId);
        alert('Ride cancelled successfully!');
        showRideDetails(ride);
    } catch (error) {
        console.error('Error canceling ride:', error);
        alert('Failed to cancel ride. Please try again.');
    }
}

function onIncompletePayment(payment) {
    console.log('Incomplete payment:', payment);
    alert('Payment incomplete. Please try again.');
}
