// Enhanced OPD Management with Integration
class EnhancedOPD {
    constructor() {
        this.currentPatient = null;
        this.selectedPatient = null;
        this.doctorList = [];
        this.integration = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDoctors();
        this.setupIntegration();
        this.initializeForm();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('opdForm')?.addEventListener('submit', (e) => {
            this.handleFormSubmit(e);
        });

        // Patient search
        document.getElementById('patientSearchInput')?.addEventListener('input', (e) => {
            if (e.target.value.length >= 3) {
                this.searchPatients(e.target.value);
            }
        });

        // Doctor selection change - update fee
        document.getElementById('doctor')?.addEventListener('change', (e) => {
            this.updateConsultationFee(e.target.value);
        });

        // Phone number input - suggest existing patients
        document.getElementById('phone')?.addEventListener('input', (e) => {
            if (e.target.value.length === 10) {
                this.suggestExistingPatient(e.target.value);
            }
        });
    }

    setupIntegration() {
        // Wait for integration system to load
        if (window.hospitalIntegration) {
            this.integration = window.hospitalIntegration;
        } else {
            // Retry after a short delay
            setTimeout(() => this.setupIntegration(), 1000);
        }
    }

    loadDoctors() {
        try {
            const doctors = JSON.parse(localStorage.getItem('hospital_doctors') || '[]');
            this.doctorList = doctors.filter(d => d.status === 'Active');
            this.populateDoctorSelect();
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
    }

    populateDoctorSelect() {
        const doctorSelect = document.getElementById('doctor');
        if (!doctorSelect) return;

        doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
        
        this.doctorList.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor.name;
            option.textContent = `Dr. ${doctor.name} - ${doctor.specialization}`;
            option.dataset.fee = doctor.consultationFee;
            doctorSelect.appendChild(option);
        });
    }

    updateConsultationFee(doctorName) {
        const doctor = this.doctorList.find(d => d.name === doctorName);
        if (doctor) {
            document.getElementById('consultationFee').value = doctor.consultationFee;
        }
    }

    initializeForm() {
        // Set current date and time
        const now = new Date();
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-IN');
        
        // Clear any existing data
        this.clearForm();
    }

    async searchPatients(query) {
        if (!this.integration) return;

        try {
            const results = this.integration.searchPatient(query);
            this.displaySearchResults(results);
        } catch (error) {
            console.error('Error searching patients:', error);
        }
    }

    displaySearchResults(results) {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">No patients found</p>';
            return;
        }

        resultsContainer.innerHTML = results.slice(0, 5).map(patient => `
            <div class="search-result-item" onclick="selectPatient('${patient.uhid}')">
                <div class="patient-basic-info">
                    <h5>${patient.name}</h5>
                    <p><strong>UHID:</strong> ${patient.uhid} | <strong>Phone:</strong> ${patient.phone}</p>
                    <p><strong>Last Visit:</strong> ${patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}</p>
                    <p><strong>Total Visits:</strong> ${patient.totalVisits || 0}</p>
                </div>
                <div class="patient-actions">
                    <button type="button" class="btn btn-sm btn-primary">Select</button>
                </div>
            </div>
        `).join('');
    }

    selectPatient(uhid) {
        if (!this.integration) return;

        const patient = this.integration.findPatientByUHID(uhid);
        if (!patient) return;

        this.selectedPatient = patient;
        this.populatePatientForm(patient);
        this.showPatientHistory(patient);
        this.checkIPDConversionNeed(patient);
        
        // Hide search results
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('patientSearchSection').style.display = 'none';
        
        this.showAlert(`Patient ${patient.name} selected successfully!`, 'success');
    }

    populatePatientForm(patient) {
        // Populate form fields with patient data
        document.getElementById('uhid').value = patient.uhid;
        document.getElementById('name').value = patient.name;
        document.getElementById('age').value = patient.age;
        document.getElementById('gender').value = patient.gender;
        document.getElementById('phone').value = patient.phone;
        document.getElementById('email').value = patient.email || '';
        document.getElementById('bloodGroup').value = patient.bloodGroup || '';
        document.getElementById('address').value = patient.address || '';
        document.getElementById('allergies').value = patient.allergies || '';
        document.getElementById('emergencyContact').value = patient.emergencyContact || '';
        document.getElementById('emergencyPhone').value = patient.emergencyPhone || '';

        // Show patient info display
        document.getElementById('selectedPatientName').textContent = patient.name;
        document.getElementById('selectedPatientUHID').textContent = patient.uhid;
        document.getElementById('selectedPatientLastVisit').textContent = 
            patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never';
        document.getElementById('selectedPatientVisits').textContent = patient.totalVisits || 0;
        
        document.getElementById('patientInfoDisplay').style.display = 'block';
    }

    showPatientHistory(patient) {
        if (!this.integration) return;

        const journey = this.integration.getPatientJourney(patient.uhid);
        if (!journey || journey.timeline.length === 0) return;

        const recentVisits = journey.timeline.slice(-3);
        const historyHtml = recentVisits.map(visit => `
            <div class="visit-item">
                <div class="visit-type">${visit.type}</div>
                <div class="visit-date">${new Date(visit.date || visit.admissionDate).toLocaleDateString()}</div>
                <div class="visit-doctor">Dr. ${visit.doctor}</div>
                <div class="visit-diagnosis">${visit.diagnosis || visit.complaint || 'N/A'}</div>
            </div>
        `).join('');

        document.getElementById('previousVisitsDisplay').innerHTML = `
            <h5>Recent Visits</h5>
            <div class="visits-list">${historyHtml}</div>
        `;
        document.getElementById('previousVisitSection').style.display = 'block';
    }

    checkIPDConversionNeed(patient) {
        if (!this.integration) return;

        const journey = this.integration.getPatientJourney(patient.uhid);
        if (journey && journey.riskLevel === 'High') {
            document.getElementById('ipdSuggestion').style.display = 'block';
        }
    }

    suggestExistingPatient(phone) {
        if (!this.integration) return;

        const results = this.integration.searchPatient(phone);
        if (results.length > 0) {
            const patient = results[0];
            if (confirm(`Found existing patient: ${patient.name}. Would you like to select this patient?`)) {
                this.selectPatient(patient.uhid);
            }
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const patientData = Object.fromEntries(formData);
        
        // Validation
        if (!this.validateForm(patientData)) {
            return;
        }

        // Process OPD registration
        try {
            let savedPatient;
            
            if (this.selectedPatient) {
                // Update existing patient visit
                savedPatient = this.addVisitToExistingPatient(patientData);
            } else {
                // Register new patient
                savedPatient = this.registerNewPatient(patientData);
            }

            if (savedPatient) {
                this.showAlert(`Patient registered successfully! Token: ${savedPatient.id}`, 'success');
                this.clearForm();
                this.updatePatientsList();
                
                // Emit event for other modules
                if (window.hmsEmit) {
                    window.hmsEmit('opdRegistration', { patient: savedPatient });
                }
            }
        } catch (error) {
            console.error('Error registering patient:', error);
            this.showAlert('Error registering patient. Please try again.', 'error');
        }
    }

    validateForm(data) {
        const required = ['name', 'age', 'gender', 'phone', 'doctor', 'consultationFee', 'complaint'];
        
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

        // Age validation
        if (isNaN(data.age) || data.age < 0 || data.age > 120) {
            this.showAlert('Please enter a valid age', 'error');
            return false;
        }

        return true;
    }

    registerNewPatient(patientData) {
        // Save to today's OPD list
        const today = new Date().toISOString().split('T')[0];
        const patients = JSON.parse(localStorage.getItem('opd_patients_' + today) || '[]');
        
        const patient = {
            ...patientData,
            id: patients.length + 1,
            localId: Date.now(),
            date: today,
            time: new Date().toLocaleTimeString('en-IN', { hour12: true }),
            createdAt: new Date().toISOString(),
            uhid: patientData.uhid || this.generateUHID()
        };

        patients.push(patient);
        localStorage.setItem('opd_patients_' + today, JSON.stringify(patients));

        // Add to integration system
        if (this.integration) {
            this.integration.integrateOPDVisit(patient, today);
        }

        return patient;
    }

    addVisitToExistingPatient(patientData) {
        // Create visit record for existing patient
        const today = new Date().toISOString().split('T')[0];
        const patients = JSON.parse(localStorage.getItem('opd_patients_' + today) || '[]');
        
        const visit = {
            ...patientData,
            id: patients.length + 1,
            localId: Date.now(),
            date: today,
            time: new Date().toLocaleTimeString('en-IN', { hour12: true }),
            createdAt: new Date().toISOString(),
            uhid: this.selectedPatient.uhid,
            isReturnVisit: true
        };

        patients.push(visit);
        localStorage.setItem('opd_patients_' + today, JSON.stringify(patients));

        // Update integration system
        if (this.integration) {
            this.integration.integrateOPDVisit(visit, today);
        }

        return visit;
    }

    generateUHID() {
        const year = new Date().getFullYear().toString().slice(-2);
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const sequence = Date.now().toString().slice(-4);
        return `UH${year}${month}${sequence}`;
    }

    clearForm() {
        const form = document.getElementById('opdForm');
        if (form) {
            form.reset();
        }
        
        this.selectedPatient = null;
        document.getElementById('patientInfoDisplay').style.display = 'none';
        document.getElementById('previousVisitSection').style.display = 'none';
        document.getElementById('ipdSuggestion').style.display = 'none';
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('patientSearchSection').style.display = 'none';
        
        // Reset consultation fee to default
        document.getElementById('consultationFee').value = '500';
    }

    clearSelectedPatient() {
        this.clearForm();
        this.showAlert('Patient selection cleared', 'info');
    }

    showPatientSearch() {
        const searchSection = document.getElementById('patientSearchSection');
        if (searchSection.style.display === 'none') {
            searchSection.style.display = 'block';
            document.getElementById('patientSearchInput').focus();
        } else {
            searchSection.style.display = 'none';
        }
    }

    showIPDConversionModal() {
        if (!this.selectedPatient) {
            this.showAlert('Please select a patient first', 'error');
            return;
        }

        // Populate conversion summary
        document.getElementById('conversionPatientSummary').innerHTML = `
            <div class="conversion-summary">
                <h5>Patient: ${this.selectedPatient.name}</h5>
                <p><strong>UHID:</strong> ${this.selectedPatient.uhid}</p>
                <p><strong>Current Complaint:</strong> ${document.getElementById('complaint').value}</p>
                <p><strong>Consulting Doctor:</strong> ${document.getElementById('doctor').value}</p>
            </div>
        `;

        document.getElementById('ipdConversionModal').style.display = 'block';
    }

    processIPDConversion() {
        const department = document.getElementById('conversionDepartment').value;
        const wardType = document.getElementById('conversionWardType').value;
        const reason = document.getElementById('conversionReason').value;

        if (!department || !wardType || !reason) {
            this.showAlert('Please fill all required fields for IPD conversion', 'error');
            return;
        }

        if (!this.integration) {
            this.showAlert('Integration system not available', 'error');
            return;
        }

        try {
            const admissionDetails = {
                department: department,
                wardType: wardType,
                doctor: document.getElementById('doctor').value,
                diagnosis: reason,
                admissionDate: new Date().toISOString(),
                bedNumber: this.generateBedNumber(wardType)
            };

            const admission = this.integration.convertOPDToIPD(this.selectedPatient, admissionDetails);
            
            if (admission) {
                this.showAlert('Patient successfully converted to IPD admission!', 'success');
                this.closeIPDConversionModal();
                
                // Emit conversion event
                if (window.hmsEmit) {
                    window.hmsEmit('opdToIpdConversion', { patient: this.selectedPatient, admission });
                }
            }
        } catch (error) {
            console.error('Error converting to IPD:', error);
            this.showAlert('Error converting patient to IPD. Please try again.', 'error');
        }
    }

    generateBedNumber(wardType) {
        // Simple bed number generation based on ward type
        const prefix = {
            'General': 'GW',
            'Private': 'PR',
            'ICU': 'IC'
        };
        
        const number = Math.floor(Math.random() * 100) + 1;
        return `${prefix[wardType] || 'GW'}${number.toString().padStart(2, '0')}`;
    }

    closeIPDConversionModal() {
        document.getElementById('ipdConversionModal').style.display = 'none';
        document.getElementById('ipdConversionForm').reset();
    }

    updatePatientsList() {
        // Trigger update of patients list if the function exists
        if (typeof displayPatients === 'function') {
            displayPatients();
        }
    }

    previewRegistration() {
        const formData = new FormData(document.getElementById('opdForm'));
        const patientData = Object.fromEntries(formData);
        
        // Create preview modal content
        const previewContent = `
            <div class="registration-preview">
                <h4>Registration Preview</h4>
                <div class="preview-section">
                    <h5>Patient Information</h5>
                    <p><strong>Name:</strong> ${patientData.name}</p>
                    <p><strong>Age/Gender:</strong> ${patientData.age}/${patientData.gender}</p>
                    <p><strong>Phone:</strong> ${patientData.phone}</p>
                    <p><strong>Email:</strong> ${patientData.email || 'N/A'}</p>
                </div>
                <div class="preview-section">
                    <h5>Medical Information</h5>
                    <p><strong>Doctor:</strong> ${patientData.doctor}</p>
                    <p><strong>Consultation Fee:</strong> ₹${patientData.consultationFee}</p>
                    <p><strong>Chief Complaint:</strong> ${patientData.complaint}</p>
                </div>
            </div>
        `;
        
        // Show preview in alert or modal
        alert('Registration Preview:\n\n' + 
              `Name: ${patientData.name}\n` +
              `Age/Gender: ${patientData.age}/${patientData.gender}\n` +
              `Phone: ${patientData.phone}\n` +
              `Doctor: ${patientData.doctor}\n` +
              `Fee: ₹${patientData.consultationFee}\n` +
              `Complaint: ${patientData.complaint}`);
    }

    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert-message');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-message`;
        alertDiv.innerHTML = `
            <span>${message}</span>
            <button type="button" class="alert-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Global functions for HTML onclick events
function selectPatient(uhid) {
    if (window.enhancedOPD) {
        window.enhancedOPD.selectPatient(uhid);
    }
}

function showPatientSearch() {
    if (window.enhancedOPD) {
        window.enhancedOPD.showPatientSearch();
    }
}

function clearSelectedPatient() {
    if (window.enhancedOPD) {
        window.enhancedOPD.clearSelectedPatient();
    }
}

function showIPDConversionModal() {
    if (window.enhancedOPD) {
        window.enhancedOPD.showIPDConversionModal();
    }
}

function processIPDConversion() {
    if (window.enhancedOPD) {
        window.enhancedOPD.processIPDConversion();
    }
}

function closeIPDConversionModal() {
    if (window.enhancedOPD) {
        window.enhancedOPD.closeIPDConversionModal();
    }
}

function previewRegistration() {
    if (window.enhancedOPD) {
        window.enhancedOPD.previewRegistration();
    }
}

function clearForm() {
    if (window.enhancedOPD) {
        window.enhancedOPD.clearForm();
    }
}

// Initialize Enhanced OPD when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedOPD = new EnhancedOPD();
});
