// Test Master JavaScript
class TestMaster {
    constructor() {
        this.tests = [];
        this.filteredTests = [];
        this.currentTest = null;
        this.isEditing = false;
        this.currentFilters = {
            search: '',
            category: '',
            status: ''
        };
        this.init();
    }

    init() {
        this.loadTests();
        this.setupEventListeners();
        this.updateStats();
        this.renderTests();
    }

    loadTests() {
        if (window.hmsData) {
            this.tests = window.hmsData.tests;
        } else {
            // Fallback to localStorage
            this.tests = JSON.parse(localStorage.getItem('lab_tests') || '[]');
        }
        this.filteredTests = [...this.tests];
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('addTestForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTest();
            });
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value;
                this.applyFilters();
            });
        }

        // Filter dropdowns
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.applyFilters();
            });
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.applyFilters();
            });
        }

        // Test code validation - auto uppercase
        const testCodeField = document.getElementById('testCode');
        if (testCodeField) {
            testCodeField.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            });
        }

        // Price validation
        const priceField = document.getElementById('price');
        if (priceField) {
            priceField.addEventListener('input', (e) => {
                if (e.target.value < 0) {
                    e.target.value = 0;
                }
            });
        }
    }

    saveTest() {
        // Validate required fields
        const requiredFields = ['testCode', 'testName', 'category', 'price'];
        if (!validateForm('addTestForm', requiredFields)) {
            return;
        }

        // Collect form data
        const formData = this.collectFormData();
        
        // Additional validation
        if (!this.validateTestData(formData)) {
            return;
        }

        try {
            if (this.isEditing && this.currentTest) {
                // Update existing test
                if (window.hmsData) {
                    const updated = window.hmsData.updateTest(this.currentTest.id, formData);
                    if (updated) {
                        showNotification('Test updated successfully!', 'success');
                    } else {
                        showNotification('Error updating test', 'error');
                        return;
                    }
                } else {
                    // Fallback to localStorage
                    const index = this.tests.findIndex(t => t.id === this.currentTest.id);
                    if (index !== -1) {
                        this.tests[index] = { ...this.currentTest, ...formData, lastUpdated: new Date().toISOString() };
                        localStorage.setItem('lab_tests', JSON.stringify(this.tests));
                        showNotification('Test updated successfully!', 'success');
                    }
                }
                this.isEditing = false;
                this.currentTest = null;
                document.getElementById('formTitleText').textContent = 'Add New Test';
            } else {
                // Add new test
                if (window.hmsData) {
                    const savedTest = window.hmsData.addTest(formData);
                    showNotification(`Test added successfully! Code: ${savedTest.code}`, 'success');
                } else {
                    // Fallback to localStorage
                    const newTest = {
                        ...formData,
                        id: 'TEST' + Date.now(),
                        createdAt: new Date().toISOString(),
                        lastUpdated: new Date().toISOString()
                    };
                    this.tests.push(newTest);
                    localStorage.setItem('lab_tests', JSON.stringify(this.tests));
                    showNotification(`Test added successfully! Code: ${newTest.code}`, 'success');
                }
            }

            // Clear form and refresh
            this.clearForm();
            this.loadTests();
            this.updateStats();
            this.applyFilters();

        } catch (error) {
            console.error('Error saving test:', error);
            showNotification('Error saving test. Please try again.', 'error');
        }
    }

    collectFormData() {
        return {
            code: document.getElementById('testCode').value.trim().toUpperCase(),
            name: document.getElementById('testName').value.trim(),
            category: document.getElementById('category').value,
            price: parseFloat(document.getElementById('price').value) || 0,
            sampleType: document.getElementById('sampleType').value,
            normalRange: document.getElementById('normalRange').value.trim(),
            reportingTime: document.getElementById('reportingTime').value,
            status: document.getElementById('status').value || 'Active',
            description: document.getElementById('description').value.trim(),
            preparation: document.getElementById('preparation').value.trim()
        };
    }

    validateTestData(data) {
        // Test code validation
        if (!/^[A-Z0-9]{3,10}$/.test(data.code)) {
            showNotification('Test code should be 3-10 characters (letters and numbers only)', 'error');
            return false;
        }

        // Check for duplicate test code (exclude current test if editing)
        const existingTest = this.tests.find(t => 
            t.code === data.code && 
            (!this.isEditing || t.id !== this.currentTest.id)
        );
        if (existingTest) {
            showNotification('A test with this code already exists', 'warning');
            return false;
        }

        // Price validation
        if (data.price < 0) {
            showNotification('Price cannot be negative', 'error');
            return false;
        }

        return true;
    }

    applyFilters() {
        this.filteredTests = this.tests.filter(test => {
            // Search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search.toLowerCase();
                const searchableText = `${test.code} ${test.name} ${test.category}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            // Category filter
            if (this.currentFilters.category && test.category !== this.currentFilters.category) {
                return false;
            }

            // Status filter
            if (this.currentFilters.status && test.status !== this.currentFilters.status) {
                return false;
            }

            return true;
        });

        this.renderTests();
    }

    updateStats() {
        const totalTests = this.tests.length;
        const activeTests = this.tests.filter(t => t.status === 'Active').length;
        const categories = [...new Set(this.tests.map(t => t.category))].length;
        const avgPrice = this.tests.length > 0 ? 
            Math.round(this.tests.reduce((sum, t) => sum + t.price, 0) / this.tests.length) : 0;

        // Update DOM
        const totalElement = document.getElementById('totalTests');
        if (totalElement) totalElement.textContent = totalTests;

        const activeElement = document.getElementById('activeTests');
        if (activeElement) activeElement.textContent = activeTests;

        const categoriesElement = document.getElementById('totalCategories');
        if (categoriesElement) categoriesElement.textContent = categories;

        const avgPriceElement = document.getElementById('avgPrice');
        if (avgPriceElement) avgPriceElement.textContent = `₹${avgPrice}`;
    }

    renderTests() {
        const tbody = document.getElementById('testsTableBody');
        if (!tbody) return;

        if (this.filteredTests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-microscope"></i>
                        </div>
                        <div>No tests found</div>
                        ${this.tests.length === 0 ? 
                            '<div style="margin-top: 10px;">Add your first test using the form above</div>' : 
                            '<div style="margin-top: 10px;">Try adjusting your search or filters</div>'
                        }
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredTests.map(test => `
            <tr>
                <td class="test-code">${test.code}</td>
                <td class="test-name">${test.name}</td>
                <td>
                    <span class="category-badge category-${test.category.toLowerCase()}">
                        ${test.category}
                    </span>
                </td>
                <td class="test-price">₹${test.price}</td>
                <td>${test.sampleType || 'Not specified'}</td>
                <td>${test.reportingTime || 'Not specified'}</td>
                <td>
                    <span class="status-badge status-${test.status.toLowerCase()}">
                        ${test.status}
                    </span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn btn-edit" onclick="editTest('${test.id || test.code}')" title="Edit Test">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn btn-delete" onclick="deleteTest('${test.id || test.code}')" title="Delete Test">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    editTest(testId) {
        const test = this.tests.find(t => t.id === testId || t.code === testId);
        if (!test) {
            showNotification('Test not found', 'error');
            return;
        }

        this.currentTest = test;
        this.isEditing = true;

        // Populate form fields
        document.getElementById('testCode').value = test.code;
        document.getElementById('testName').value = test.name;
        document.getElementById('category').value = test.category;
        document.getElementById('price').value = test.price;
        document.getElementById('sampleType').value = test.sampleType || '';
        document.getElementById('normalRange').value = test.normalRange || '';
        document.getElementById('reportingTime').value = test.reportingTime || '';
        document.getElementById('status').value = test.status || 'Active';
        document.getElementById('description').value = test.description || '';
        document.getElementById('preparation').value = test.preparation || '';

        // Update form title
        document.getElementById('formTitleText').textContent = 'Edit Test';

        // Show form if hidden
        const form = document.getElementById('testForm');
        if (form.classList.contains('form-hidden')) {
            this.toggleForm();
        }

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
    }

    deleteTest(testId) {
        const test = this.tests.find(t => t.id === testId || t.code === testId);
        if (!test) {
            showNotification('Test not found', 'error');
            return;
        }

        if (!confirm(`Are you sure you want to delete test "${test.name}" (${test.code})? This action cannot be undone.`)) {
            return;
        }

        try {
            if (window.hmsData) {
                const deleted = window.hmsData.deleteTest(testId);
                if (deleted) {
                    showNotification('Test deleted successfully', 'success');
                } else {
                    showNotification('Error deleting test', 'error');
                    return;
                }
            } else {
                // Fallback to localStorage
                const index = this.tests.findIndex(t => t.id === testId || t.code === testId);
                if (index !== -1) {
                    this.tests.splice(index, 1);
                    localStorage.setItem('lab_tests', JSON.stringify(this.tests));
                    showNotification('Test deleted successfully', 'success');
                }
            }

            this.loadTests();
            this.updateStats();
            this.applyFilters();

        } catch (error) {
            console.error('Error deleting test:', error);
            showNotification('Error deleting test', 'error');
        }
    }

    clearForm() {
        const form = document.getElementById('addTestForm');
        if (form) {
            form.reset();
            // Reset default values
            document.getElementById('status').value = 'Active';
        }
        
        this.isEditing = false;
        this.currentTest = null;
        document.getElementById('formTitleText').textContent = 'Add New Test';
    }

    clearFilters() {
        // Reset filter inputs
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('statusFilter').value = '';

        // Reset filter state
        this.currentFilters = {
            search: '',
            category: '',
            status: ''
        };

        // Apply filters (will show all tests)
        this.applyFilters();
        showNotification('Filters cleared', 'info');
    }

    toggleForm() {
        const form = document.getElementById('testForm');
        const toggleBtn = document.getElementById('toggleFormBtn');
        
        if (form.classList.contains('form-hidden')) {
            form.classList.remove('form-hidden');
            toggleBtn.innerHTML = '<i class="fas fa-minus"></i> Hide Form';
        } else {
            form.classList.add('form-hidden');
            toggleBtn.innerHTML = '<i class="fas fa-plus"></i> Show Form';
            
            // Clear form if hiding and not editing
            if (!this.isEditing) {
                this.clearForm();
            }
        }
    }

    exportTests() {
        if (this.filteredTests.length === 0) {
            showNotification('No tests to export', 'warning');
            return;
        }

        // Create CSV content
        const headers = ['Code', 'Name', 'Category', 'Price', 'Sample Type', 'Normal Range', 'Reporting Time', 'Status', 'Description'];
        const csvContent = [
            headers.join(','),
            ...this.filteredTests.map(test => [
                test.code,
                test.name,
                test.category,
                test.price,
                test.sampleType || '',
                test.normalRange || '',
                test.reportingTime || '',
                test.status || 'Active',
                test.description || ''
            ].map(field => `"${field}"`).join(','))
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lab_tests_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('Test data exported successfully', 'success');
    }
}

// Global functions
function editTest(testId) {
    window.testMaster.editTest(testId);
}

function deleteTest(testId) {
    window.testMaster.deleteTest(testId);
}

function toggleForm() {
    window.testMaster.toggleForm();
}

function clearForm() {
    window.testMaster.clearForm();
}

function clearFilters() {
    window.testMaster.clearFilters();
}

function exportTests() {
    window.testMaster.exportTests();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.testMaster = new TestMaster();
});
