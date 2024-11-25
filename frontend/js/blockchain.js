class BlockchainUI {
    constructor() {
        this.initializeWebSocket();
        this.setupEventListeners();
    }

    initializeWebSocket() {
        // Initialize WebSocket connection when an account is selected
        this.ws = null;
    }

    setupEventListeners() {
        // Create Account
        document.getElementById('createAccountBtn').addEventListener('click', async () => {
            try {
                const response = await fetch('/api/blockchain/accounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ startingBalance: '1' })
                });
                const account = await response.json();
                this.displayMessage('success', `Account created! Public Key: ${account.publicKey}`);
                this.updateAccountInfo(account.publicKey);
            } catch (error) {
                this.displayMessage('error', error.message);
            }
        });

        // View Account Info
        document.getElementById('viewAccountBtn').addEventListener('click', async () => {
            const publicKey = document.getElementById('accountPublicKey').value;
            await this.updateAccountInfo(publicKey);
        });

        // View Transaction History
        document.getElementById('viewTransactionsBtn').addEventListener('click', async () => {
            const publicKey = document.getElementById('accountPublicKey').value;
            await this.updateTransactionHistory(publicKey);
        });

        // Monitor Account
        document.getElementById('monitorAccountBtn').addEventListener('click', () => {
            const publicKey = document.getElementById('accountPublicKey').value;
            this.startAccountMonitoring(publicKey);
        });
    }

    async updateAccountInfo(publicKey) {
        try {
            const response = await fetch(`/api/blockchain/accounts/${publicKey}`);
            const accountInfo = await response.json();
            
            const accountInfoHtml = `
                <h4>Account Information</h4>
                <p>Balances:</p>
                <ul>
                    ${accountInfo.balances.map(balance => `
                        <li>${balance.asset_type === 'native' ? 'Pi' : balance.asset_code}: 
                            ${balance.balance}
                        </li>
                    `).join('')}
                </ul>
                <p>Last Modified: ${new Date(accountInfo.lastModified).toLocaleString()}</p>
            `;
            
            document.getElementById('accountInfo').innerHTML = accountInfoHtml;
        } catch (error) {
            this.displayMessage('error', error.message);
        }
    }

    async updateTransactionHistory(publicKey) {
        try {
            const response = await fetch(`/api/blockchain/accounts/${publicKey}/transactions`);
            const transactions = await response.json();
            
            const transactionsHtml = `
                <h4>Transaction History</h4>
                <ul>
                    ${transactions.map(tx => `
                        <li>
                            Transaction ID: ${tx.id}<br>
                            Created: ${new Date(tx.createdAt).toLocaleString()}<br>
                            Status: ${tx.successful ? 'Success' : 'Failed'}
                        </li>
                    `).join('')}
                </ul>
            `;
            
            document.getElementById('transactionHistory').innerHTML = transactionsHtml;
        } catch (error) {
            this.displayMessage('error', error.message);
        }
    }

    startAccountMonitoring(publicKey) {
        // Close existing WebSocket connection if any
        if (this.ws) {
            this.ws.close();
        }

        // Create new WebSocket connection
        this.ws = new WebSocket(`ws://${window.location.host}/api/blockchain/accounts/${publicKey}/monitor`);
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'payment') {
                this.displayMessage('info', `New payment received: ${data.payment.amount} ${data.payment.asset}`);
                this.updateAccountInfo(publicKey);
            } else if (data.type === 'error') {
                this.displayMessage('error', data.error);
            }
        };

        this.ws.onclose = () => {
            this.displayMessage('info', 'Account monitoring stopped');
        };

        this.displayMessage('success', 'Account monitoring started');
    }

    displayMessage(type, message) {
        const messageDiv = document.getElementById('messages');
        const messageElement = document.createElement('div');
        messageElement.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
        messageElement.textContent = message;
        messageDiv.appendChild(messageElement);
        
        // Remove message after 5 seconds
        setTimeout(() => messageElement.remove(), 5000);
    }
}

// Initialize blockchain UI when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.blockchainUI = new BlockchainUI();
});
