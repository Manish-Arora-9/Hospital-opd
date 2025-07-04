// Constants
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let filteredTransactions = [];

// Category definitions
const CATEGORIES = {
    income: [
        'Consultation Fee',
        'Lab Tests',
        'Procedures',
        'Pharmacy Sales',
        'Room Charges',
        'Registration Fee',
        'Insurance Claims',
        'Other Income'
    ],
    expense: [
        'Salaries',
        'Medicines',
        'Equipment',
        'Utilities',
        'Maintenance',
        'Office Supplies',
        'Marketing',
        'Other Expense'
    ]
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setDefaultDates();
    loadTransactions();
    setupEventListeners();
    initializeCharts();
});

// Set default dates (current month)
function setDefaultDates() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    document.getElementById('startDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('endDate').value = now.toISOString().split('T')[0];
}

// Load transactions
function loadTransactions() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const department = document.getElementById('departmentFilter').value;
    
    filteredTransactions = getAllTransactions().filter(transaction => {
        const transactionDate = transaction.date.split('T')[0];
        return (
            transactionDate >= startDate &&
            transactionDate <= endDate &&
            (!department || transaction.department === department)
        );
    });
    
    updateSummary();
    updateCharts();
    displayTransactions();
    updatePagination();
}

// Get all transactions
function getAllTransactions() {
    return JSON.parse(localStorage.getItem('transactions') || '[]');
}

// Update summary cards
function updateSummary() {
    const summary = filteredTransactions.reduce((acc, transaction) => {
        const amount = parseFloat(transaction.amount);
        if (transaction.type === 'income') {
            acc.income += amount;
            if (transaction.status === 'Pending') {
                acc.pending += amount;
            }
        } else {
            acc.expense += amount;
        }
        return acc;
    }, { income: 0, expense: 0, pending: 0 });

    document.getElementById('totalIncome').textContent = formatCurrency(summary.income);
    document.getElementById('totalExpense').textContent = formatCurrency(summary.expense);
    document.getElementById('netBalance').textContent = formatCurrency(summary.income - summary.expense);
    document.getElementById('pendingAmount').textContent = formatCurrency(summary.pending);
}

// Display transactions
function displayTransactions() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const transactionsToShow = filteredTransactions.slice(start, end);
    
    const tbody = document.getElementById('transactionsList');
    tbody.innerHTML = transactionsToShow.map(transaction => `
        <tr>
            <td>${formatDateTime(transaction.date)}</td>
            <td>
                <span class="transaction-type type-${transaction.type}">
                    ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                </span>
            </td>
            <td>${transaction.department}</td>
            <td>${transaction.category}</td>
            <td>${transaction.description || '-'}</td>
            <td>${formatCurrency(transaction.amount)}</td>
            <td>${transaction.paymentMode}</td>
            <td>
                <span class="status-badge status-${transaction.status.toLowerCase()}">
                    ${transaction.status}
                </span>
            </td>
            <td class="actions-column">
                <button class="btn btn-sm btn-warning" onclick="editTransaction('${transaction.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteTransaction('${transaction.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Initialize charts
function initializeCharts() {
    // Trend Chart
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    window.trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Income',
                    borderColor: '#10b981',
                    backgroundColor: '#d1fae5',
                    data: []
                },
                {
                    label: 'Expense',
                    borderColor: '#ef4444',
                    backgroundColor: '#fee2e2',
                    data: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Department Chart
    const deptCtx = document.getElementById('deptChart').getContext('2d');
    window.deptChart = new Chart(deptCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Update charts
function updateCharts() {
    updateTrendChart();
    updateDepartmentChart();
}

// Update trend chart
function updateTrendChart() {
    const dateRange = getDatesInRange(
        document.getElementById('startDate').value,
        document.getElementById('endDate').value
    );

    const data = dateRange.map(date => {
        const dayTransactions = filteredTransactions.filter(t => 
            t.date.startsWith(date)
        );

        return {
            date,
            income: dayTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0),
            expense: dayTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0)
        };
    });

    window.trendChart.data.labels = data.map(d => formatDate(d.date));
    window.trendChart.data.datasets[0].data = data.map(d => d.income);
    window.trendChart.data.datasets[1].data = data.map(d => d.expense);
    window.trendChart.update();
}

// Update department chart
function updateDepartmentChart() {
    const deptRevenue = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => {
            acc[t.department] = (acc[t.department] || 0) + parseFloat(t.amount);
            return acc;
        }, {});

    window.deptChart.data.labels = Object.keys(deptRevenue);
    window.deptChart.data.datasets[0].data = Object.values(deptRevenue);
    window.deptChart.update();
}

// Show transaction modal
function showTransactionModal(type) {
    document.getElementById('transactionType').value = type;
    document.getElementById('modalTitle').textContent = 
        `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    // Set current date and time
    const now = new Date().toISOString().slice(0, 16);
    document.getElementById('transactionDate').value = now;
    
    // Populate categories based on type
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = CATEGORIES[type]
        .map(cat => `<option value="${cat}">${cat}</option>`)
        .join('');
    
    document.getElementById('transactionModal').style.display = 'block';
}

// Close transaction modal
function closeTransactionModal() {
    document.getElementById('transactionModal').style.display = 'none';
    document.getElementById('transactionForm').reset();
}

// Save transaction
function saveTransaction(formData) {
    const transactions = getAllTransactions();
    
    const transaction = {
        id: formData.id || generateId(),
        type: formData.type,
        date: formData.date,
        department: formData.department,
        category: formData.category,
        amount: parseFloat(formData.amount),
        paymentMode: formData.paymentMode,
        status: formData.status,
        description: formData.description,
        reference: formData.reference,
        createdAt: formData.id ? formData.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (formData.id) {
        const index = transactions.findIndex(t => t.id === formData.id);
        transactions[index] = transaction;
    } else {
        transactions.push(transaction);
    }

    localStorage.setItem('transactions', JSON.stringify(transactions));
    loadTransactions();
}

// Setup event listeners
function setupEventListeners() {
    // Transaction form submission
    document.getElementById('transactionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            type: document.getElementById('transactionType').value,
            date: document.getElementById('transactionDate').value,
            department: document.getElementById('department').value,
            category: document.getElementById('category').value,
            amount: document.getElementById('amount').value,
            paymentMode: document.getElementById('paymentMode').value,
            status: document.getElementById('status').value,
            description: document.getElementById('description').value,
            reference: document.getElementById('reference').value
        };

        saveTransaction(formData);
        closeTransactionModal();
        showAlert('Transaction saved successfully', 'success');
    });

    // Close modal on click outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('transactionModal');
        if (e.target === modal) {
            closeTransactionModal();
        }
    });
}

// Utility functions
function formatCurrency(amount) {
    return '₹' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short'
    });
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function generateId() {
    return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getDatesInRange(start, end) {
    const dates = [];
    let current = new Date(start);
    const endDate = new Date(end);
    
    while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    
    return dates;
}

function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    document.querySelector('.container').insertBefore(alert, document.querySelector('.filters-section'));
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}