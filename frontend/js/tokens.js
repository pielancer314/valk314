class TokenService {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api/tokens';
    }

    async getBalance(accountId) {
        try {
            const response = await fetch(`${this.apiUrl}/balance/${accountId}`);
            const data = await response.json();
            return data.balance;
        } catch (error) {
            console.error('Error getting token balance:', error);
            throw error;
        }
    }

    async transferTokens(fromSecret, toPublicKey, amount) {
        try {
            const response = await fetch(`${this.apiUrl}/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fromSecret, toPublicKey, amount })
            });
            return await response.json();
        } catch (error) {
            console.error('Error transferring tokens:', error);
            throw error;
        }
    }

    async createTrustline(accountSecret) {
        try {
            const response = await fetch(`${this.apiUrl}/trustline`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accountSecret })
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating trustline:', error);
            throw error;
        }
    }
}

// Initialize token service
const tokenService = new TokenService();

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const transferForm = document.getElementById('transferTokenForm');
    const trustlineForm = document.getElementById('trustlineForm');
    const balanceBtn = document.getElementById('checkBalanceBtn');

    if (transferForm) {
        transferForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fromSecret = document.getElementById('fromSecret').value;
            const toPublicKey = document.getElementById('toPublicKey').value;
            const amount = document.getElementById('amount').value;

            try {
                const result = await tokenService.transferTokens(fromSecret, toPublicKey, amount);
                alert('Tokens transferred successfully!');
                updateTokenBalance();
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to transfer tokens. Please try again.');
            }
        });
    }

    if (trustlineForm) {
        trustlineForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const accountSecret = document.getElementById('accountSecret').value;

            try {
                const result = await tokenService.createTrustline(accountSecret);
                alert('Trustline created successfully!');
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to create trustline. Please try again.');
            }
        });
    }

    if (balanceBtn) {
        balanceBtn.addEventListener('click', updateTokenBalance);
    }
});

async function updateTokenBalance() {
    try {
        const auth = await Pi.authenticate(['payments'], onIncompletePayment);
        if (auth) {
            const balance = await tokenService.getBalance(auth.user.uid);
            const balanceDisplay = document.getElementById('tokenBalance');
            if (balanceDisplay) {
                balanceDisplay.textContent = `${balance} VALK`;
            }
        }
    } catch (error) {
        console.error('Error updating balance:', error);
        alert('Failed to update token balance. Please try again.');
    }
}

function showTransactionResult(result) {
    const resultDiv = document.getElementById('transactionResult');
    if (resultDiv) {
        resultDiv.innerHTML = `
            <div class="alert alert-success">
                <h5>Transaction Successful!</h5>
                <p>Transaction ID: ${result.transaction.id}</p>
            </div>
        `;
    }
}
