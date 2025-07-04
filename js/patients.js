// Constants
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let filteredPatients = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    setDefaultDates();
    loadDoctors();
    loadPatients();
});

// Set default date range (last 30 days)
function setDefaultDates() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
}

// Load all patients within date range
function loadPatients() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const doctorFilter = document.getElementById('doctorFilter').value;
    
    filteredPatients = [];
    let currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    while (currentDate <= endDateObj) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const patients = JSON.parse(localStorage.getItem('opd_patients_' + dateKey) || '[]');
        filteredPatients.push(...patients);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Apply doctor filter if selected
    if (doctorFilter) {
        filteredPatients = filteredPatients.filter(p => p.doctor === doctorFilter);
    }

    // Sort by date and time
    filteredPatients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    updateStatistics();
    displayPatients();
    updatePagination();
}

// Display patients for current page
function displayPatients() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const patientsToShow = filteredPatients.slice(start, end);
    
    const tbody = document.getElementById('patientsList');
    tbody.innerHTML = patientsToShow.map(patient => `
        <tr>
            <td>#${patient.id}</td>
            <td>${patient.patientName}</td>
            <td>${patient.age} / ${patient.gender}</td>
            <td>${patient.doctor}</td>
            <td>${new Date(patient.createdAt).toLocaleDateString()}</td>
            <td>₹${patient.consultationFee}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editPatient(${patient.localId})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deletePatient(${patient.localId})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
    const pagination = document.getElementById('pagination');
    
    let html = '';
    if (totalPages > 1) {
        html += `
            <button onclick="changePage(1)" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-angle-double-left"></i>
            </button>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <button onclick="changePage(${i})" 
                        class="${currentPage === i ? 'active' : ''}">
                    ${i}
                </button>
            `;
        }
        
        html += `
            <button onclick="changePage(${totalPages})" 
                    ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-angle-double-right"></i>
            </button>
        `;
    }
    
    pagination.innerHTML = html;
}

// Change current page
function changePage(page) {
    currentPage = page;
    displayPatients();
    updatePagination();
}

// Update statistics
function updateStatistics() {
    const stats = {
        totalPatients: filteredPatients.length,
        totalRevenue: filteredPatients.reduce((sum, p) => sum + parseInt(p.consultationFee || 0), 0),
        uniquePatients: new Set(filteredPatients.map(p => p.phone)).size,
        avgFee: 0
    };
    
    stats.avgFee = stats.totalPatients > 0 ? Math.round(stats.totalRevenue / stats.totalPatients) : 0;
    
    document.getElementById('statsContainer').innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${stats.totalPatients}</div>
            <div class="stat-label">Total Visits</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.uniquePatients}</div>
            <div class="stat-label">Unique Patients</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">₹${stats.totalRevenue}</div>
            <div class="stat-label">Total Revenue</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">₹${stats.avgFee}</div>
            <div class="stat-label">Average Fee</div>
        </div>
    `;
}

// Load unique doctors for filter
function loadDoctors() {
    const doctors = new Set();
    const allPatients = getAllPatients();
    
    allPatients.forEach(patient => {
        if (patient.doctor) {
            doctors.add(patient.doctor);
        }
    });
    
    const doctorFilter = document.getElementById('doctorFilter');
    doctorFilter.innerHTML = `
        <option value="">All Doctors</option>
        ${[...doctors].map(doctor => `
            <option value="${doctor}">${doctor}</option>
        `).join('')}
    `;
}

// Apply filters
function applyFilters() {
    currentPage = 1;
    loadPatients();
}