class SmartContract {
    constructor(name, type, parties) {
        this.name = name;
        this.type = type;
        this.parties = parties;
        this.state = 'PENDING';
        this.terms = [];
        this.transactions = [];
        this.createdAt = Date.now();
        this.lastUpdated = Date.now();
    }

    addTerm(term) {
        this.terms.push({
            ...term,
            id: this.terms.length + 1,
            status: 'PENDING'
        });
        this.lastUpdated = Date.now();
    }

    validateTerm(termId) {
        const term = this.terms.find(t => t.id === termId);
        if (term) {
            term.status = 'VALIDATED';
            this.lastUpdated = Date.now();
            this.checkContractStatus();
        }
    }

    checkContractStatus() {
        if (this.terms.every(term => term.status === 'VALIDATED')) {
            this.state = 'ACTIVE';
        }
    }

    executeTransaction(transaction) {
        if (this.state !== 'ACTIVE') {
            throw new Error('Contract must be active to execute transactions');
        }
        this.transactions.push({
            ...transaction,
            timestamp: Date.now(),
            status: 'COMPLETED'
        });
        this.lastUpdated = Date.now();
    }
}

class SmartContractUI {
    constructor() {
        this.contracts = [];
        this.initEventListeners();
        this.updateContractList();
    }

    initEventListeners() {
        // Create Contract Form
        document.getElementById('createContractBtn').addEventListener('click', () => {
            const name = document.getElementById('contractName').value;
            const type = document.getElementById('contractType').value;
            const party1 = document.getElementById('party1').value;
            const party2 = document.getElementById('party2').value;

            if (name && type && party1 && party2) {
                const contract = new SmartContract(name, type, [party1, party2]);
                this.contracts.push(contract);
                this.updateContractList();
                this.clearContractForm();
            }
        });

        // Add Term Form
        document.getElementById('addTermBtn').addEventListener('click', () => {
            const contractId = document.getElementById('termContractSelect').value;
            const description = document.getElementById('termDescription').value;
            const value = document.getElementById('termValue').value;

            if (contractId && description) {
                const contract = this.contracts[contractId];
                contract.addTerm({ description, value });
                this.updateContractList();
                this.clearTermForm();
            }
        });
    }

    clearContractForm() {
        document.getElementById('contractName').value = '';
        document.getElementById('contractType').value = '';
        document.getElementById('party1').value = '';
        document.getElementById('party2').value = '';
    }

    clearTermForm() {
        document.getElementById('termDescription').value = '';
        document.getElementById('termValue').value = '';
    }

    updateContractList() {
        const contractList = document.getElementById('contractList');
        const contractSelect = document.getElementById('termContractSelect');
        
        // Update contract list
        contractList.innerHTML = '';
        contractSelect.innerHTML = '<option value="">Select Contract</option>';

        this.contracts.forEach((contract, index) => {
            // Add to contract list
            const contractElement = this.createContractElement(contract, index);
            contractList.appendChild(contractElement);

            // Add to select dropdown
            const option = document.createElement('option');
            option.value = index;
            option.textContent = contract.name;
            contractSelect.appendChild(option);
        });
    }

    createContractElement(contract, index) {
        const contractDiv = document.createElement('div');
        contractDiv.className = 'bg-white rounded-lg p-6 mb-6 shadow-lg';

        const statusColor = contract.state === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500';

        contractDiv.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-xl font-bold">${contract.name}</h3>
                    <p class="text-gray-600">Type: ${contract.type}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-white text-sm ${statusColor}">
                    ${contract.state}
                </span>
            </div>
            
            <div class="mb-4">
                <h4 class="font-semibold mb-2">Parties</h4>
                <div class="space-y-1">
                    ${contract.parties.map(party => `
                        <p class="text-gray-600">${party}</p>
                    `).join('')}
                </div>
            </div>

            <div class="mb-4">
                <h4 class="font-semibold mb-2">Terms</h4>
                <div class="space-y-2">
                    ${contract.terms.map(term => `
                        <div class="bg-gray-50 p-3 rounded flex justify-between items-center">
                            <div>
                                <p class="text-gray-700">${term.description}</p>
                                ${term.value ? `<p class="text-gray-600 text-sm">Value: ${term.value}</p>` : ''}
                            </div>
                            <span class="px-2 py-1 rounded text-sm ${term.status === 'VALIDATED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                ${term.status}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${contract.transactions.length > 0 ? `
                <div>
                    <h4 class="font-semibold mb-2">Transactions</h4>
                    <div class="space-y-2">
                        ${contract.transactions.map(tx => `
                            <div class="bg-gray-50 p-3 rounded">
                                <p class="text-gray-700">Amount: ${tx.amount}</p>
                                <p class="text-gray-600 text-sm">
                                    ${new Date(tx.timestamp).toLocaleString()}
                                </p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="mt-4 text-sm text-gray-500">
                Created: ${new Date(contract.createdAt).toLocaleString()}
                <br>
                Last Updated: ${new Date(contract.lastUpdated).toLocaleString()}
            </div>
        `;

        // Add validate term buttons
        if (contract.state !== 'ACTIVE') {
            const pendingTerms = contract.terms.filter(term => term.status === 'PENDING');
            if (pendingTerms.length > 0) {
                const validateDiv = document.createElement('div');
                validateDiv.className = 'mt-4 pt-4 border-t';
                validateDiv.innerHTML = `
                    <h4 class="font-semibold mb-2">Validate Terms</h4>
                    <div class="flex flex-wrap gap-2">
                        ${pendingTerms.map(term => `
                            <button
                                class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                onclick="window.smartContractDemo.validateTerm(${index}, ${term.id})"
                            >
                                Validate Term ${term.id}
                            </button>
                        `).join('')}
                    </div>
                `;
                contractDiv.appendChild(validateDiv);
            }
        }

        return contractDiv;
    }

    validateTerm(contractIndex, termId) {
        const contract = this.contracts[contractIndex];
        contract.validateTerm(termId);
        this.updateContractList();
    }
}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.smartContractDemo = new SmartContractUI();
});
