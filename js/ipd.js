// Constants
const WARDS = {
    'General': { beds: 20, charges: 1000 },
    'Semi-Private': { beds: 10, charges: 2000 },
    'Private': { beds: 5, charges: 3500 },
    'ICU': { beds: 8, charges: 5000 }
};

const DOCTORS_BY_DEPT = {
    'General Medicine': [
        { id: 1, name: 'Dr. Rajesh Kumar', speciality: 'Internal Medicine' },
        { id: 2, name: 'Dr. Priya Sharma', speciality: 'General Physician' }
    ],
    'Surgery': [
        { id: 3, name: 'Dr. Suresh Patel', speciality: 'General Surgery' },
        { id: 4, name: 'Dr. Meera Reddy', speciality: 'Laparoscopic Surgery' }
    ],
    'Pediatrics': [
        { id: 5, name: 'Dr. Amit Singh', speciality: 'General Pediatrics' },
        { id: 6, name: 'Dr. Neha Gupta', speciality: 'Neonatology' }
    ],
    'Orthopedics': [
        { id: 7, name: 'Dr. Vikram Mehta', speciality: 'Joint Replacement' },
        { id: 8, name: 'Dr. Sanjay Verma', speciality: 'Spine Surgery' }
    ],
    'Gynecology': [
        { id: 9, name: 'Dr. Anjali Desai', speciality: 'Obstetrics' },
        { id: 10, name: 'Dr. Ritu Malhotra', speciality: 'Gynecology' }
    ]
};

let currentAdmission = null;
let currentPatientView = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeWardMap();
    loadCurrentPatients();
    setupEventListeners();
    updateBedStatistics();
});

// Initialize ward map
function initializeWardMap() {
    const wardMap = document.getElementById('wardMap');
    let bedCounter = 1;

    Object.entries(WARDS).forEach(([wardType, config]) => {
        for (let i = 1; i <= config.beds; i++) {
            const bedNumber = `${wardType.charAt(0)}${String(bedCounter).padStart(2, '0')}`;
            const bedStatus = getBedStatus(bedNumber);
            
            const bedCard = createBedCard(bedNumber, wardType, bedStatus);
            wardMap.appendChild(bedCard);
            bedCounter++;
        }
    });
}

// Create bed card element
function createBedCard(bedNumber, wardType, status) {
    const div = document.createElement('div');
    div.className = `bed-card ${status.toLowerCase()}`;
    div.onclick = () => showBedDetails(bedNumber);

    const patient = getPatientByBed(bedNumber);
    
    div.innerHTML = `
        <div class="bed-number">${bedNumber}</div>
        <div class="bed-type">${wardType}</div>
        <div class="bed-status status-${status.toLowerCase()}">${status}</div>
        ${patient ? `
            <div class="patient-info">
                ${patient.patientName}<br>
                <small>${patient.days} days</small>
            </div>
        ` : ''}
    `;

    return div;
}

// Get bed status
function getBedStatus(bedNumber) {
    const admissions = getAllAdmissions();
    const admission = admissions.find(a => a.bedNumber === bedNumber && a.status === 'Admitted');
    
    if (admission) return 'Occupied';
    
    const maintenance = getBedMaintenance();
    if (maintenance.includes(bedNumber)) return 'Maintenance';
    
    return 'Available';
}

// Show bed details
function showBedDetails(bedNumber) {
    const status = getBedStatus(bedNumber);
    const patient = getPatientByBed(bedNumber);
    
    if (patient) {
        showPatientView(patient.admissionId);
    } else {
        showBedManagementModal(bedNumber);
    }
}

// Patient Admission Process
function showAdmissionModal() {
    document.getElementById('admissionModal').style.display = 'block';
    document.getElementById('admissionDate').value = new Date().toISOString().slice(0, 16);
    updateAvailableBeds();
}

// Update available beds based on ward type
function updateAvailableBeds() {
    const wardType = document.getElementById('wardType').value;
    const bedSelect = document.getElementById('bedNumber');
    bedSelect.innerHTML = '<option value="">Select Bed</option>';
    
    if (!wardType) return;

    const occupiedBeds = getAllAdmissions()
        .filter(a => a.status === 'Admitted')
        .map(a => a.bedNumber);
    
    const maintenanceBeds = getBedMaintenance();
    
    const prefix = wardType.charAt(0);
    for (let i = 1; i <= WARDS[wardType].beds; i++) {
        const bedNumber = `${prefix}${String(i).padStart(2, '0')}`;
        if (!occupiedBeds.includes(bedNumber) && !maintenanceBeds.includes(bedNumber)) {
            bedSelect.innerHTML += `<option value="${bedNumber}">${bedNumber}</option>`;
        }
    }
}

// Search patient
async function searchPatient() {
    const uhid = document.getElementById('patientUHID').value;
    if (!uhid) {
        showAlert('Please enter UHID', 'error');
        return;
    }

    const patients = JSON.parse(localStorage.getItem('patients') || '[]');
    const patient = patients.find(p => p.uhid === uhid);
    
    if (patient) {
        document.getElementById('patientName').value = `${patient.firstName} ${patient.lastName}`;
        document.getElementById('patientAge').value = calculateAge(patient.dob);
        
        // Check if patient is already admitted
        const activeAdmission = getActiveAdmission(uhid);
        if (activeAdmission) {
            showAlert('Patient is already admitted in bed ' + activeAdmission.bedNumber, 'warning');
        }
    } else {
        showAlert('Patient not found', 'error');
    }
}

// Handle admission form submission
document.getElementById('admissionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        admissionId: generateAdmissionId(),
        uhid: document.getElementById('patientUHID').value,
        patientName: document.getElementById('patientName').value,
        admissionDate: document.getElementById('admissionDate').value,
        department: document.getElementById('department').value,
        doctor: document.getElementById('doctor').value,
        wardType: document.getElementById('wardType').value,
        bedNumber: document.getElementById('bedNumber').value,
        expectedStay: document.getElementById('expectedStay').value,
        diagnosis: document.getElementById('diagnosis').value,
        presentingComplaints: document.getElementById('presenting_complaints').value,
        vitals: {
            bp: document.getElementById('vitals_bp').value,
            pulse: document.getElementById('vitals_pulse').value,
            temp: document.getElementById('vitals_temp').value,
            spo2: document.getElementById('vitals_spo2').value
        },
        paymentType: document.getElementById('paymentType').value,
        advanceAmount: parseFloat(document.getElementById('advanceAmount').value),
        paymentMode: document.getElementById('paymentMode').value,
        status: 'Admitted',
        createdBy: 'Manish-Arora-9',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    saveAdmission(formData);
    createInitialTreatmentPlan(formData.admissionId);
    recordPayment(formData);
    
    closeAdmissionModal();
    showAlert('Patient admitted successfully', 'success');
    loadCurrentPatients();
    updateBedStatistics();
});

// Save admission
function saveAdmission(admission) {
    const admissions = getAllAdmissions();
    admissions.push(admission);
    localStorage.setItem('ipd_admissions', JSON.stringify(admissions));
    
    // Update bed status
    updateBedStatus(admission.bedNumber, 'Occupied');
}

// Create initial treatment plan
function createInitialTreatmentPlan(admissionId) {
    const plan = {
        admissionId: admissionId,
        medications: [],
        investigations: [],
        diet: 'Regular',
        specialInstructions: '',
        createdBy: 'Manish-Arora-9',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    saveTreatmentPlan(plan);
}

// Record payment
function recordPayment(admission) {
    const payment = {
        transactionId: generateTransactionId(),
        admissionId: admission.admissionId,
        uhid: admission.uhid,
        type: 'income',
        category: 'IPD Advance',
        amount: admission.advanceAmount,
        paymentMode: admission.paymentMode,
        status: 'Completed',
        department: 'IPD',
        description: `Admission advance for ${admission.patientName}`,
        createdBy: 'Manish-Arora-9',
        createdAt: new Date().toISOString()
    };
    
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.push(payment);
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Load current patients
function loadCurrentPatients() {
    const admissions = getAllAdmissions()
        .filter(a => a.status === 'Admitted')
        .sort((a, b) => new Date(b.admissionDate) - new Date(a.admissionDate));
    
    const tbody = document.getElementById('ipdPatientsList');
    tbody.innerHTML = admissions.map(admission => {
        const days = calculateStayDays(admission.admissionDate);
        return `
            <tr>
                <td>${admission.uhid}</td>
                <td>${admission.patientName}</td>
                <td>${admission.bedNumber}</td>
                <td>${admission.department}</td>
                <td>${admission.doctor}</td>
                <td>${formatDateTime(admission.admissionDate)}</td>
                <td>${days}</td>
                <td>
                    <span class="status-badge status-${admission.status.toLowerCase()}">
                        ${admission.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="showPatientView('${admission.admissionId}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="showDischargeModal('${admission.admissionId}')">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Show patient view
function showPatientView(admissionId) {
    const admission = getAdmission(admissionId);
    if (!admission) return;

    currentPatientView = admission;
    document.getElementById('patientViewModal').style.display = 'block';
    loadPatientTab('overview');
}

// Load patient tab content
function loadPatientTab(tab) {
    const content = document.getElementById('patientTabContent');
    
    switch(tab) {
        case 'overview':
            content.innerHTML = generateOverviewContent();
            break;
        case 'progress':
            content.innerHTML = generateProgressNotesContent();
            loadProgressNotes();
            break;
        case 'treatment':
            content.innerHTML = generateTreatmentContent();
            loadTreatmentPlan();
            break;
        case 'vitals':
            content.innerHTML = generateVitalsContent();
            loadVitalsChart();
            break;
        case 'investigations':
            content.innerHTML = generateInvestigationsContent();
            loadInvestigations();
            break;
        case 'billing':
            content.innerHTML = generateBillingContent();
            loadBillingDetails();
            break;
    }
}

// Generate tab contents
function generateOverviewContent() {
    const admission = currentPatientView;
    const days = calculateStayDays(admission.admissionDate);
    
    return `
        <div class="patient-overview">
            <div class="overview-header">
                <h3>${admission.patientName}</h3>
                <span class="uhid">UHID: ${admission.uhid}</span>
            </div>
            <div class="overview-grid">
                <div class="info-group">
                    <label>Admission Date</label>
                    <div>${formatDateTime(admission.admissionDate)}</div>
                </div>
                <div class="info-group">
                    <label>Length of Stay</label>
                    <div>${days} days</div>
                </div>
                <div class="info-group">
                    <label>Department</label>
                    <div>${admission.department}</div>
                </div>
                <div class="info-group">
                    <label>Doctor</label>
                    <div>${admission.doctor}</div>
                </div>
                <div class="info-group">
                    <label>Ward/Bed</label>
                    <div>${admission.wardType} - ${admission.bedNumber}</div>
                </div>
                <div class="info-group">
                    <label>Diagnosis</label>
                    <div>${admission.diagnosis}</div>
                </div>
            </div>
            <div class="vital-summary">
                <h4>Latest Vitals</h4>
                <div class="vitals-grid">
                    ${generateLatestVitals()}
                </div>
            </div>
        </div>
    `;
}

// Utility functions
function getAllAdmissions() {
    return JSON.parse(localStorage.getItem('ipd_admissions') || '[]');
}

function getAdmission(admissionId) {
    const admissions = getAllAdmissions();
    return admissions.find(a => a.admissionId === admissionId);
}

function getActiveAdmission(uhid) {
    const admissions = getAllAdmissions();
    return admissions.find(a => a.uhid === uhid && a.status === 'Admitted');
}

function generateAdmissionId() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const admissions = getAllAdmissions();
    const todayAdmissions = admissions.filter(a => 
        a.admissionId.startsWith(`ADM${year}${month}${day}`)
    );
    
    const sequence = (todayAdmissions.length + 1).toString().padStart(3, '0');
    return `ADM${year}${month}${day}${sequence}`;
}

function generateTransactionId() {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5);
}

function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

function calculateStayDays(admissionDate) {
    const admission = new Date(admissionDate);
    const today = new Date();
    const diffTime = Math.abs(today - admission);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    document.querySelector('.container').insertBefore(alert, document.querySelector('.ward-overview'));
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}