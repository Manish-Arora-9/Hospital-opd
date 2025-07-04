// Test categories and tests data
const TEST_CATEGORIES = [
    {
        id: 1,
        name: 'Hematology',
        tests: [
            { id: 101, name: 'Complete Blood Count', price: 500, parameters: [
                { name: 'Hemoglobin', unit: 'g/dL', reference: '13.5-17.5' },
                { name: 'WBC Count', unit: '10³/µL', reference: '4.5-11.0' },
                { name: 'RBC Count', unit: '10⁶/µL', reference: '4.5-5.9' },
                { name: 'Platelet Count', unit: '10³/µL', reference: '150-450' }
            ]},
            { id: 102, name: 'ESR', price: 200, parameters: [
                { name: 'ESR', unit: 'mm/hr', reference: '0-22' }
            ]},
            // Add more tests
        ]
    },
    {
        id: 2,
        name: 'Biochemistry',
        tests: [
            { id: 201, name: 'Liver Function Test', price: 800, parameters: [
                { name: 'Total Bilirubin', unit: 'mg/dL', reference: '0.3-1.2' },
                { name: 'SGPT', unit: 'U/L', reference: '7-56' },
                { name: 'SGOT', unit: 'U/L', reference: '5-40' },
                { name: 'Alkaline Phosphatase', unit: 'U/L', reference: '44-147' }
            ]},
            // Add more tests
        ]
    },
    // Add more categories
];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeTestCatalog();
    loadPendingTests();
    setupEventListeners();
});

// Initialize test catalog
function initializeTestCatalog() {
    const container = document.getElementById('testCategories');
    container.innerHTML = TEST_CATEGORIES.map(category => `
        <div class="test-category">
            <div class="category-header" onclick="toggleCategory(${category.id})">
                <span>${category.name}</span>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="category-tests" id="category-${category.id}">
                ${category.tests.map(test => `
                    <div class="test-item" onclick="addTest(${test.id})">
                        <span>${test.name}</span>
                        <span class="test-price">₹${test.price}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Toggle category expansion
function toggleCategory(categoryId) {
    const element = document.getElementById(`category-${categoryId}`);
    element.style.display = element.style.display === 'none' ? 'block' : 'none';
}

// Add test to selection
function addTest(testId) {
    const test = findTest(testId);
    if (!test) return;

    const selectedTests = document.getElementById('selectedTests');
    const existingTest = selectedTests.querySelector(`[data-test-id="${testId}"]`);
    
    if (existingTest) {
        showAlert('Test already added', 'warning');
        return;
    }

    selectedTests.insertAdjacentHTML('beforeend', `
        <div class="selected-test" data-test-id="${test.id}">
            <span>${test.name}</span>
            <span>₹${test.price}</span>
            <i class="fas fa-times remove-test" onclick="removeTest(${test.id})"></i>
        </div>
    `);

    updateTotalAmount();
}

// Remove test from selection
function removeTest(testId) {
    const element = document.querySelector(`.selected-test[data-test-id="${testId}"]`);
    if (element) {
        element.remove();
        updateTotalAmount();
    }
}

// Update total amount
function updateTotalAmount() {
    const selectedTests = document.querySelectorAll('.selected-test');
    const total = Array.from(selectedTests).reduce((sum, test) => {
        const testId = test.dataset.testId;
        const testData = findTest(parseInt(testId));
        return sum + (testData ? testData.price : 0);
    }, 0);

    document.getElementById('totalAmount').value = total;
    updateNetAmount();
}

// Update net amount
function updateNetAmount() {
    const total = parseFloat(document.getElementById('totalAmount').value) || 0;
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const net = total - (total * discount / 100);
    document.getElementById('netAmount').value = net.toFixed(2);
}

// Find test by ID
function findTest(testId) {
    for (const category of TEST_CATEGORIES) {
        const test = category.tests.find(t => t.id === testId);
        if (test) return test;
    }
    return null;
}

// Search patient
function searchPatient() {
    const uhid = document.getElementById('patientUHID').value;
    if (!uhid) {
        showAlert('Please enter UHID', 'error');
        return;
    }

    const patients = JSON.parse(localStorage.getItem('patients') || '[]');
    const patient = patients.find(p => p.uhid === uhid);
    
    if (patient) {
        document.getElementById('patientName').value = `${patient.firstName} ${patient.lastName}`;
    } else {
        showAlert('Patient not found', 'error');
    }
}

// Submit test request
document.getElementById('testRequestForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const selectedTests = document.querySelectorAll('.selected-test');
    if (selectedTests.length === 0) {
        showAlert('Please select at least one test', 'error');
        return;
    }

    const request = {
        requestId: generateRequestId(),
        uhid: document.getElementById('patientUHID').value,
        patientName: document.getElementById('patientName').value,
        requestDate: document.getElementById('requestDate').value,
        tests: Array.from(selectedTests).map(test => ({
            id: parseInt(test.dataset.testId),
            name: test.querySelector('span').textContent,
            price: parseFloat(test.querySelector('span:nth-child(2)').textContent.replace('₹', '')),
            status: 'pending'
        })),
        totalAmount: parseFloat(document.getElementById('totalAmount').value),
        discount: parseFloat(document.getElementById('discount').value),
        netAmount: parseFloat(document.getElementById('netAmount').value),
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    saveTestRequest(request);
    clearTestForm();
    showAlert('Test request submitted successfully', 'success');
});

// Generate request ID
function generateRequestId() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const requests = JSON.parse(localStorage.getItem('lab_requests') || '[]');
    const todayRequests = requests.filter(r => r.requestId.startsWith(`LR${year}${month}${day}`));
    const sequence = (todayRequests.length + 1).toString().padStart(3, '0');
    
    return `LR${year}${month}${day}${sequence}`;
}

// Save test request
function saveTestRequest(request) {
    const requests = JSON.parse(localStorage.getItem('lab_requests') || '[]');
    requests.push(request);
    localStorage.setItem('lab_requests', JSON.stringify(requests));
    loadPendingTests();
}

// Load pending tests
function loadPendingTests() {
    const requests = JSON.parse(localStorage.getItem('lab_requests') || '[]');
    const pendingRequests = requests.filter(r => r.status === 'pending');
    
    const tbody = document.getElementById('pendingTestsList');
    tbody.innerHTML = pendingRequests.map(request => `
        <tr>
            <td>${request.requestId}</td>
            <td>${request.uhid}</td>
            <td>${request.patientName}</td>
            <td>${request.tests.map(t => t.name).join(', ')}</td>
            <td>${new Date(request.requestDate).toLocaleString()}</td>
            <td><span class="result-status status-${request.status}">${request.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showResultEntry('${request.requestId}')">
                    Enter Results
                </button>
                <button class="btn btn-sm btn-info" onclick="printRequest('${request.requestId}')">
                    Print
                </button>
            </td>
        </tr>
    `).join('');
}

// Show result entry modal
function showResultEntry(requestId) {
    const requests = JSON.parse(localStorage.getItem('lab_requests') || '[]');
    const request = requests.find(r => r.requestId === requestId);
    
    if (!request) return;

    document.getElementById('resultRequestId').value = requestId;
    const resultFields = document.getElementById('resultFields');
    
    resultFields.innerHTML = request.tests.map(test => {
        const testData = findTest(test.id);
        if (!testData) return '';

        return `
            <div class="result-field">
                <h4>${test.name}</h4>
                ${testData.parameters.map(param => `
                    <div class="form-group">
                        <label>${param.name} (${param.unit})</label>
                        <input type="text" name="${test.id}_${param.name.replace(/\s+/g, '_')}" 
                               required>
                        <div class="reference">Reference Range: ${param.reference}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');

    document.getElementById('resultModal').style.display = 'block';
}

// Close result modal
function closeResultModal() {
    document.getElementById('resultModal').style.display = 'none';
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('discount').addEventListener('input', updateNetAmount);
    
    document.querySelector('.close').addEventListener('click', closeResultModal);
    
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('resultModal');
        if (e.target === modal) {
            closeResultModal();
        }
    });
}

// Show alert
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    document.querySelector('.container').insertBefore(alert, document.querySelector('.form-section'));
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}