// Initialize Pi SDK
const Pi = window.Pi;
Pi.init({ version: "2.0", sandbox: true });

// DOM Elements
const connectPiBtn = document.getElementById('connectPiBtn');

// Event Listeners
connectPiBtn.addEventListener('click', handlePiAuth);

async function handlePiAuth() {
    try {
        const scopes = ['payments', 'username'];
        const auth = await Pi.authenticate(scopes, onIncompletePayment);
        
        if (auth) {
            connectPiBtn.textContent = `Connected: ${auth.user.username}`;
            connectPiBtn.disabled = true;
        }
    } catch (error) {
        console.error('Pi Authentication Error:', error);
        alert('Failed to connect to Pi Network');
    }
}

function onIncompletePayment(payment) {
    console.log('Incomplete payment:', payment);
    // Handle incomplete payment
}
