// Patient Master Management System
class PatientMaster {
    constructor() {
        this.patients = this.loadPatients();
        this.currentPatient = null;
        this.filteredPatients = [...this.patients];
        this.currentPage = 1;
        this.patientsPerPage = 10;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.displayPatients();
        this.updateStats();
        this.populateFilters();
        this.setDefaultDates();
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.searchPatients(e.target.value);
        });

        // Filter functionality
        document.getElementById('filterBloodGroup')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('filterGender')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('filterAgeRange')?.addEventListener('change', () => {
            this.applyFilters();
        });

        // Form submission
        document.getElementById('patientForm')?.addEventListener('submit', (e) => {
            this.handleFormSubmit(e);
        });

        // Export functionality
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportData();
        });

        // Print functionality
        document.getElementById('printBtn')?.addEventListener('click', () => {
            this.printPatientList();
        });

        // Modal close functionality
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Pagination
        document.getElementById('prevPageBtn')?.addEventListener('click', () => {
            this.previousPage();
        });

        document.getElementById('nextPageBtn')?.addEventListener('click', () => {
            this.nextPage();
        });
    }

    loadPatients() {
        try {
            const stored = localStorage.getItem('hospital_patients');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading patients:', error);
            return [];
        }
    }

    savePatients() {
        try {
            localStorage.setItem('hospital_patients', JSON.stringify(this.patients));
        } catch (error) {
            console.error('Error saving patients:', error);
        }
    }

    generateUHID() {
        const year = new Date().getFullYear().toString().slice(-2);
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const sequence = (this.patients.length + 1).toString().padStart(4, '0');
        return `UH${year}${month}${sequence}`;
    }

    addPatient(patientData) {
        const patient = {
            ...patientData,
            uhid: this.generateUHID(),
            registrationDate: new Date().toISOString(),
            lastVisit: new Date().toISOString(),
            totalVisits: 1,
            totalBilled: 0,
            status: 'Active'
        };

        this.patients.unshift(patient);
        this.savePatients();
        this.displayPatients();
        this.updateStats();
        
        this.showAlert('Patient registered successfully!', 'success');
        return patient;
    }

    updatePatient(uhid, updatedData) {
        const index = this.patients.findIndex(p => p.uhid === uhid);
        if (index !== -1) {
            this.patients[index] = { ...this.patients[index], ...updatedData };
            this.savePatients();
            this.displayPatients();
            this.showAlert('Patient updated successfully!', 'success');
            return true;
        }
        return false;
    }

    deletePatient(uhid) {
        if (confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
            const index = this.patients.findIndex(p => p.uhid === uhid);
            if (index !== -1) {
                this.patients.splice(index, 1);
                this.savePatients();
                this.displayPatients();
                this.updateStats();
                this.showAlert('Patient deleted successfully!', 'success');
                return true;
            }
        }
        return false;
    }

    searchPatients(query) {
        if (!query.trim()) {
            this.filteredPatients = [...this.patients];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredPatients = this.patients.filter(patient => 
                patient.name?.toLowerCase().includes(searchTerm) ||
                patient.uhid?.toLowerCase().includes(searchTerm) ||
                patient.phone?.includes(searchTerm) ||
                patient.email?.toLowerCase().includes(searchTerm) ||
                patient.address?.toLowerCase().includes(searchTerm)
            );
        }
        this.currentPage = 1;
        this.displayPatients();
    }

    applyFilters() {
        const bloodGroup = document.getElementById('filterBloodGroup')?.value;
        const gender = document.getElementById('filterGender')?.value;
        const ageRange = document.getElementById('filterAgeRange')?.value;

        this.filteredPatients = this.patients.filter(patient => {
            let matches = true;

            if (bloodGroup && patient.bloodGroup !== bloodGroup) {
                matches = false;
            }

            if (gender && patient.gender !== gender) {
                matches = false;
            }

            if (ageRange) {
                const age = parseInt(patient.age);
                switch (ageRange) {
                    case '0-18':
                        matches = matches && age >= 0 && age <= 18;
                        break;
                    case '19-35':
                        matches = matches && age >= 19 && age <= 35;
                        break;
                    case '36-60':
                        matches = matches && age >= 36 && age <= 60;
                        break;
                    case '60+':
                        matches = matches && age > 60;
                        break;
                }
            }

            return matches;
        });

        this.currentPage = 1;
        this.displayPatients();
    }

    displayPatients() {
        const startIndex = (this.currentPage - 1) * this.patientsPerPage;
        const endIndex = startIndex + this.patientsPerPage;
        const paginatedPatients = this.filteredPatients.slice(startIndex, endIndex);

        const tbody = document.getElementById('patientsTableBody');
        if (!tbody) return;

        if (paginatedPatients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">No patients found</td>
                </tr>
            `;
            this.updatePaginationInfo();
            return;
        }

        tbody.innerHTML = paginatedPatients.map(patient => `
            <tr>
                <td>${patient.uhid}</td>
                <td>
                    <div class="patient-info">
                        <strong>${patient.name}</strong>
                        <small>${patient.email || 'N/A'}</small>
                    </div>
                </td>
                <td>${patient.age}/${patient.gender}</td>
                <td>${patient.phone}</td>
                <td>
                    <span class="blood-group">${patient.bloodGroup || 'N/A'}</span>
                </td>
                <td>
                    <small>${new Date(patient.registrationDate).toLocaleDateString()}</small>
                </td>
                <td>
                    <small>${new Date(patient.lastVisit).toLocaleDateString()}</small>
                </td>
                <td>
                    <span class="visit-count">${patient.totalVisits || 1}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-info" onclick="patientMaster.viewPatient('${patient.uhid}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="patientMaster.editPatient('${patient.uhid}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="patientMaster.deletePatient('${patient.uhid}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.updatePaginationInfo();
    }

    updatePaginationInfo() {
        const totalPages = Math.ceil(this.filteredPatients.length / this.patientsPerPage);
        const startItem = (this.currentPage - 1) * this.patientsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.patientsPerPage, this.filteredPatients.length);

        document.getElementById('paginationInfo').textContent = 
            `Showing ${startItem}-${endItem} of ${this.filteredPatients.length} patients`;

        document.getElementById('prevPageBtn').disabled = this.currentPage === 1;
        document.getElementById('nextPageBtn').disabled = this.currentPage === totalPages;
        
        document.getElementById('currentPage').textContent = this.currentPage;
        document.getElementById('totalPages').textContent = totalPages;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.displayPatients();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredPatients.length / this.patientsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.displayPatients();
        }
    }

    updateStats() {
        const stats = this.calculateStats();
        
        document.getElementById('totalPatients').textContent = stats.total;
        document.getElementById('activePatients').textContent = stats.active;
        document.getElementById('todayRegistrations').textContent = stats.todayRegistrations;
        document.getElementById('totalRevenue').textContent = `₹${stats.totalRevenue.toLocaleString()}`;
    }

    calculateStats() {
        const today = new Date().toDateString();
        
        return {
            total: this.patients.length,
            active: this.patients.filter(p => p.status === 'Active').length,
            todayRegistrations: this.patients.filter(p => 
                new Date(p.registrationDate).toDateString() === today
            ).length,
            totalRevenue: this.patients.reduce((sum, p) => sum + (p.totalBilled || 0), 0)
        };
    }

    populateFilters() {
        // Blood group filter
        const bloodGroups = [...new Set(this.patients.map(p => p.bloodGroup).filter(Boolean))];
        const bloodGroupSelect = document.getElementById('filterBloodGroup');
        if (bloodGroupSelect) {
            bloodGroupSelect.innerHTML = '<option value="">All Blood Groups</option>' +
                bloodGroups.map(bg => `<option value="${bg}">${bg}</option>`).join('');
        }
    }

    setDefaultDates() {
        const today = new Date();
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!input.value) {
                input.value = today.toISOString().split('T')[0];
            }
        });
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const patientData = Object.fromEntries(formData);
        
        // Validation
        if (!this.validateForm(patientData)) {
            return;
        }

        if (this.currentPatient) {
            // Update existing patient
            this.updatePatient(this.currentPatient.uhid, patientData);
        } else {
            // Add new patient
            this.addPatient(patientData);
        }

        this.clearForm();
        this.hideModal('patientModal');
    }

    validateForm(data) {
        const required = ['name', 'age', 'gender', 'phone'];
        
        for (let field of required) {
            if (!data[field] || data[field].trim() === '') {
                this.showAlert(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`, 'error');
                return false;
            }
        }

        // Phone validation
        if (!/^\d{10}$/.test(data.phone)) {
            this.showAlert('Please enter a valid 10-digit phone number', 'error');
            return false;
        }

        // Email validation
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            this.showAlert('Please enter a valid email address', 'error');
            return false;
        }

        return true;
    }

    showAddPatientModal() {
        this.currentPatient = null;
        this.clearForm();
        document.getElementById('modalTitle').textContent = 'Add New Patient';
        document.getElementById('patientModal').style.display = 'block';
    }

    editPatient(uhid) {
        const patient = this.patients.find(p => p.uhid === uhid);
        if (!patient) return;

        this.currentPatient = patient;
        this.populateForm(patient);
        document.getElementById('modalTitle').textContent = 'Edit Patient';
        document.getElementById('patientModal').style.display = 'block';
    }

    viewPatient(uhid) {
        const patient = this.patients.find(p => p.uhid === uhid);
        if (!patient) return;

        this.populateViewModal(patient);
        document.getElementById('viewModal').style.display = 'block';
    }

    populateForm(patient) {
        Object.keys(patient).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                input.value = patient[key] || '';
            }
        });
    }

    populateViewModal(patient) {
        const viewContent = document.getElementById('viewContent');
        if (!viewContent) return;

        const visitHistory = this.getPatientVisitHistory(patient.uhid);
        
        viewContent.innerHTML = `
            <div class="patient-details">
                <div class="detail-section">
                    <h3>Personal Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>UHID:</label>
                            <span>${patient.uhid}</span>
                        </div>
                        <div class="detail-item">
                            <label>Name:</label>
                            <span>${patient.name}</span>
                        </div>
                        <div class="detail-item">
                            <label>Age/Gender:</label>
                            <span>${patient.age} years / ${patient.gender}</span>
                        </div>
                        <div class="detail-item">
                            <label>Blood Group:</label>
                            <span>${patient.bloodGroup || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Phone:</label>
                            <span>${patient.phone}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${patient.email || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Address:</label>
                            <span>${patient.address || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>Registration Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Registration Date:</label>
                            <span>${new Date(patient.registrationDate).toLocaleDateString()}</span>
                        </div>
                        <div class="detail-item">
                            <label>Last Visit:</label>
                            <span>${new Date(patient.lastVisit).toLocaleDateString()}</span>
                        </div>
                        <div class="detail-item">
                            <label>Total Visits:</label>
                            <span>${patient.totalVisits || 1}</span>
                        </div>
                        <div class="detail-item">
                            <label>Total Billed:</label>
                            <span>₹${(patient.totalBilled || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>Visit History</h3>
                    <div class="visit-history">
                        ${visitHistory.length > 0 ? 
                            visitHistory.map(visit => `
                                <div class="visit-item">
                                    <div class="visit-date">${new Date(visit.date).toLocaleDateString()}</div>
                                    <div class="visit-type">${visit.type}</div>
                                    <div class="visit-doctor">${visit.doctor}</div>
                                    <div class="visit-amount">₹${visit.amount}</div>
                                </div>
                            `).join('') :
                            '<p>No visit history available</p>'
                        }
                    </div>
                </div>
            </div>
        `;
    }

    getPatientVisitHistory(uhid) {
        // Get visit history from OPD and IPD records
        const opdVisits = this.getOPDVisits(uhid);
        const ipdVisits = this.getIPDVisits(uhid);
        
        return [...opdVisits, ...ipdVisits].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getOPDVisits(uhid) {
        const visits = [];
        
        // Check all OPD records
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('opd_patients_')) {
                try {
                    const patients = JSON.parse(localStorage.getItem(key));
                    const patientVisits = patients.filter(p => p.uhid === uhid || p.name === uhid);
                    visits.push(...patientVisits.map(v => ({
                        date: v.date || v.createdAt,
                        type: 'OPD',
                        doctor: v.doctor,
                        amount: v.consultationFee || 0
                    })));
                } catch (error) {
                    console.error('Error parsing OPD data:', error);
                }
            }
        }
        
        return visits;
    }

    getIPDVisits(uhid) {
        const visits = [];
        
        try {
            const ipdPatients = JSON.parse(localStorage.getItem('ipd_patients') || '[]');
            const patientVisits = ipdPatients.filter(p => p.uhid === uhid);
            visits.push(...patientVisits.map(v => ({
                date: v.admissionDate,
                type: 'IPD',
                doctor: v.doctor,
                amount: v.totalBill || 0
            })));
        } catch (error) {
            console.error('Error parsing IPD data:', error);
        }
        
        return visits;
    }

    clearForm() {
        const form = document.getElementById('patientForm');
        if (form) {
            form.reset();
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    exportData() {
        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `patient_master_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    generateCSV() {
        const headers = ['UHID', 'Name', 'Age', 'Gender', 'Phone', 'Email', 'Blood Group', 'Address', 'Registration Date', 'Total Visits', 'Total Billed'];
        
        const rows = this.filteredPatients.map(patient => [
            patient.uhid,
            patient.name,
            patient.age,
            patient.gender,
            patient.phone,
            patient.email || '',
            patient.bloodGroup || '',
            patient.address || '',
            new Date(patient.registrationDate).toLocaleDateString(),
            patient.totalVisits || 1,
            patient.totalBilled || 0
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    printPatientList() {
        const printContent = this.generatePrintContent();
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }

    generatePrintContent() {
        const stats = this.calculateStats();
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Patient Master Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .stats { display: flex; justify-content: space-around; margin-bottom: 30px; }
                    .stat-item { text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .print-date { text-align: right; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>BTL Charitale Hospital</h1>
                    <h2>Patient Master Report</h2>
                </div>
                
                <div class="print-date">
                    Generated on: ${new Date().toLocaleDateString()}
                </div>

                <div class="stats">
                    <div class="stat-item">
                        <h3>${stats.total}</h3>
                        <p>Total Patients</p>
                    </div>
                    <div class="stat-item">
                        <h3>${stats.active}</h3>
                        <p>Active Patients</p>
                    </div>
                    <div class="stat-item">
                        <h3>${stats.todayRegistrations}</h3>
                        <p>Today's Registrations</p>
                    </div>
                    <div class="stat-item">
                        <h3>₹${stats.totalRevenue.toLocaleString()}</h3>
                        <p>Total Revenue</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>UHID</th>
                            <th>Name</th>
                            <th>Age/Gender</th>
                            <th>Phone</th>
                            <th>Blood Group</th>
                            <th>Registration Date</th>
                            <th>Total Visits</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.filteredPatients.map(patient => `
                            <tr>
                                <td>${patient.uhid}</td>
                                <td>${patient.name}</td>
                                <td>${patient.age}/${patient.gender}</td>
                                <td>${patient.phone}</td>
                                <td>${patient.bloodGroup || 'N/A'}</td>
                                <td>${new Date(patient.registrationDate).toLocaleDateString()}</td>
                                <td>${patient.totalVisits || 1}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
    }

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <span>${message}</span>
            <button type="button" class="alert-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Initialize Patient Master when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.patientMaster = new PatientMaster();
});
