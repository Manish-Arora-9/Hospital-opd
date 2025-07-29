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
    loadDoctorsIntoSelect();
    setDefaultAdmissionDate();
});

// Load doctors into department select
function loadDoctorsIntoSelect() {
    const deptSelect = document.getElementById('department');
    const doctorSelect = document.getElementById('doctor');
    
    if (deptSelect) {
        deptSelect.addEventListener('change', function() {
            const selectedDept = this.value;
            doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
            
            if (selectedDept && DOCTORS_BY_DEPT[selectedDept]) {
                DOCTORS_BY_DEPT[selectedDept].forEach(doctor => {
                    const option = document.createElement('option');
                    option.value = doctor.id;
                    option.textContent = `${doctor.name} - ${doctor.speciality}`;
                    doctorSelect.appendChild(option);
                });
            }
        });
    }
}

// Set default admission date to current date
function setDefaultAdmissionDate() {
    const admissionDateInput = document.getElementById('admissionDate');
    if (admissionDateInput) {
        const now = new Date();
        const dateString = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
        admissionDateInput.value = dateString;
    }
}

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

// Modal Functions
function showAdmissionModal() {
    const modal = document.getElementById('admissionModal');
    if (modal) {
        modal.style.display = 'block';
        setDefaultAdmissionDate();
        generateNewUHID();
    }
}

function closeAdmissionModal() {
    const modal = document.getElementById('admissionModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('admissionForm').reset();
    }
}

function showBedManagementModal() {
    const modal = document.getElementById('bedManagementModal');
    if (modal) {
        modal.style.display = 'block';
        loadBedManagementData();
    }
}

function showBedTab(tabName) {
    // Hide all bed tab contents
    document.querySelectorAll('.bed-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.bed-management-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`bed${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
    event.target.classList.add('active');
}

function loadBedManagementData() {
    loadBedStatusGrid();
    loadMaintenanceBeds();
}

function loadBedStatusGrid() {
    const grid = document.getElementById('bedStatusGrid');
    const beds = getAllBeds();
    
    grid.innerHTML = beds.map(bed => `
        <div class="bed-card ${bed.status.toLowerCase()}">
            <div class="bed-number">${bed.number}</div>
            <div class="bed-type">${bed.wardType}</div>
            <div class="bed-status status-${bed.status.toLowerCase()}">${bed.status}</div>
            ${bed.patient ? `<div class="patient-info">${bed.patient}</div>` : ''}
        </div>
    `).join('');
}

function loadMaintenanceBeds() {
    const select = document.getElementById('maintenanceBed');
    const beds = getAllBeds().filter(bed => bed.status === 'Available');
    
    select.innerHTML = '<option value="">Select Bed</option>' + 
        beds.map(bed => `<option value="${bed.number}">${bed.number} - ${bed.wardType}</option>`).join('');
}

function searchPatient() {
    const uhid = document.getElementById('patientUHID').value;
    if (!uhid) {
        showAlert('Please enter UHID', 'warning');
        return;
    }
    
    // Mock patient search - in real app, this would call an API
    const mockPatients = [
        { uhid: 'BTL001', name: 'John Doe', age: 35, gender: 'Male', phone: '9876543210' },
        { uhid: 'BTL002', name: 'Jane Smith', age: 28, gender: 'Female', phone: '9876543211' },
        { uhid: 'BTL003', name: 'Robert Johnson', age: 45, gender: 'Male', phone: '9876543212' }
    ];
    
    const patient = mockPatients.find(p => p.uhid === uhid);
    
    if (patient) {
        document.getElementById('patientName').value = patient.name;
        document.getElementById('patientAge').value = patient.age;
        showAlert('Patient found successfully', 'success');
    } else {
        showAlert('Patient not found', 'error');
        document.getElementById('patientName').value = '';
        document.getElementById('patientAge').value = '';
    }
}

function generateNewUHID() {
    const uhidInput = document.getElementById('patientUHID');
    if (uhidInput && !uhidInput.value) {
        const timestamp = Date.now().toString().slice(-6);
        uhidInput.value = `BTL${timestamp}`;
    }
}

function getAllBeds() {
    const storedBeds = localStorage.getItem('hospital_beds');
    if (storedBeds) {
        return JSON.parse(storedBeds);
    }
    
    // Initialize default beds
    const defaultBeds = [];
    let bedCounter = 1;
    
    Object.entries(WARDS).forEach(([wardType, config]) => {
        for (let i = 1; i <= config.beds; i++) {
            const bedNumber = `${wardType.charAt(0)}${String(bedCounter).padStart(2, '0')}`;
            defaultBeds.push({
                number: bedNumber,
                wardType: wardType,
                status: 'Available',
                patient: null,
                admissionId: null
            });
            bedCounter++;
        }
    });
    
    localStorage.setItem('hospital_beds', JSON.stringify(defaultBeds));
    return defaultBeds;
}

// Printing Functions
function printAdmissionForm() {
    const formData = getAdmissionFormData();
    if (!formData) {
        showAlert('Please fill all required fields', 'warning');
        return;
    }
    
    const printContent = generateAdmissionPrintContent(formData);
    openPrintWindow(printContent, 'IPD Admission Form');
}

function printIPDReport() {
    const patients = getAllAdmissions();
    const reportContent = generateIPDReportContent(patients);
    openPrintWindow(reportContent, 'IPD Status Report');
}

function getAdmissionFormData() {
    const form = document.getElementById('admissionForm');
    const formData = new FormData(form);
    const data = {};
    
    // Get all form inputs
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        data[input.id] = input.value;
    });
    
    // Validate required fields
    const required = ['patientUHID', 'patientName', 'admissionDate', 'department', 'doctor', 'wardType', 'bedNumber', 'diagnosis', 'presenting_complaints', 'paymentType', 'advanceAmount', 'paymentMode'];
    
    for (let field of required) {
        if (!data[field]) {
            return null;
        }
    }
    
    return data;
}

function generateAdmissionPrintContent(data) {
    const currentDate = new Date().toLocaleDateString('en-IN');
    const currentTime = new Date().toLocaleTimeString('en-IN');
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>IPD Admission Form</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                .row { display: flex; margin-bottom: 10px; }
                .col { flex: 1; margin-right: 20px; }
                .label { font-weight: bold; }
                .section { margin-bottom: 20px; border: 1px solid #ccc; padding: 10px; }
                .section-title { font-size: 16px; font-weight: bold; background: #f0f0f0; padding: 5px; margin: -10px -10px 10px -10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Hospital Management System</h1>
                <h2>IPD Admission Form</h2>
                <p>Date: ${currentDate} | Time: ${currentTime}</p>
            </div>
            
            <div class="section">
                <div class="section-title">Patient Information</div>
                <div class="row">
                    <div class="col"><span class="label">UHID:</span> ${data.patientUHID}</div>
                    <div class="col"><span class="label">Name:</span> ${data.patientName}</div>
                    <div class="col"><span class="label">Age:</span> ${data.patientAge}</div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Admission Details</div>
                <div class="row">
                    <div class="col"><span class="label">Admission Date:</span> ${new Date(data.admissionDate).toLocaleString('en-IN')}</div>
                    <div class="col"><span class="label">Department:</span> ${data.department}</div>
                </div>
                <div class="row">
                    <div class="col"><span class="label">Doctor:</span> ${getDoctorName(data.doctor)}</div>
                    <div class="col"><span class="label">Ward Type:</span> ${data.wardType}</div>
                    <div class="col"><span class="label">Bed Number:</span> ${data.bedNumber}</div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Clinical Information</div>
                <div class="row">
                    <div class="col"><span class="label">Diagnosis:</span> ${data.diagnosis}</div>
                </div>
                <div class="row">
                    <div class="col"><span class="label">Presenting Complaints:</span> ${data.presenting_complaints}</div>
                </div>
                <div class="row">
                    <div class="col"><span class="label">BP:</span> ${data.vitals_bp || 'N/A'}</div>
                    <div class="col"><span class="label">Pulse:</span> ${data.vitals_pulse || 'N/A'}</div>
                    <div class="col"><span class="label">Temp:</span> ${data.vitals_temp || 'N/A'}</div>
                    <div class="col"><span class="label">SpO2:</span> ${data.vitals_spo2 || 'N/A'}</div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Payment Information</div>
                <div class="row">
                    <div class="col"><span class="label">Payment Type:</span> ${data.paymentType}</div>
                    <div class="col"><span class="label">Advance Amount:</span> ₹${data.advanceAmount}</div>
                    <div class="col"><span class="label">Payment Mode:</span> ${data.paymentMode}</div>
                </div>
            </div>
            
            <div style="margin-top: 40px;">
                <div style="float: left;">
                    <p>Patient/Guardian Signature: ___________________</p>
                </div>
                <div style="float: right;">
                    <p>Doctor Signature: ___________________</p>
                </div>
                <div style="clear: both;"></div>
            </div>
        </body>
        </html>
    `;
}

function generateIPDReportContent(patients) {
    const currentDate = new Date().toLocaleDateString('en-IN');
    const currentTime = new Date().toLocaleTimeString('en-IN');
    
    const stats = {
        total: patients.length,
        admitted: patients.filter(p => p.status === 'Admitted').length,
        discharged: patients.filter(p => p.status === 'Discharged').length
    };
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>IPD Status Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .stats { display: flex; justify-content: space-around; margin: 20px 0; }
                .stat-box { border: 1px solid #ccc; padding: 10px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Hospital Management System</h1>
                <h2>IPD Status Report</h2>
                <p>Generated on: ${currentDate} at ${currentTime}</p>
            </div>
            
            <div class="stats">
                <div class="stat-box">
                    <h3>${stats.total}</h3>
                    <p>Total Patients</p>
                </div>
                <div class="stat-box">
                    <h3>${stats.admitted}</h3>
                    <p>Currently Admitted</p>
                </div>
                <div class="stat-box">
                    <h3>${stats.discharged}</h3>
                    <p>Discharged</p>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>UHID</th>
                        <th>Patient Name</th>
                        <th>Bed No.</th>
                        <th>Department</th>
                        <th>Doctor</th>
                        <th>Admission Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${patients.map(patient => `
                        <tr>
                            <td>${patient.uhid}</td>
                            <td>${patient.patientName}</td>
                            <td>${patient.bedNumber}</td>
                            <td>${patient.department}</td>
                            <td>${getDoctorName(patient.doctor)}</td>
                            <td>${new Date(patient.admissionDate).toLocaleDateString('en-IN')}</td>
                            <td>${patient.status}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `;
}

function getDoctorName(doctorId) {
    for (let dept in DOCTORS_BY_DEPT) {
        const doctor = DOCTORS_BY_DEPT[dept].find(d => d.id == doctorId);
        if (doctor) return doctor.name;
    }
    return 'Unknown Doctor';
}

function openPrintWindow(content, title) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Close modals when clicking close button
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('close')) {
        e.target.closest('.modal').style.display = 'none';
    }
});