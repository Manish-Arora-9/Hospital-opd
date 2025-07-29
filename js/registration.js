// Constants
const UHID_PREFIX = 'BTL';
let currentYear = new Date().getFullYear().toString().substr(-2);
let currentCount = 0;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setDefaultDates();
    loadLastUHID();
    setupFormValidation();
});

// Set default dates
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('registrationDate').value = today;
    document.getElementById('registrationDate').max = today;
}

// Load last UHID
function loadLastUHID() {
    const lastUHID = localStorage.getItem('last_uhid_' + currentYear);
    if (lastUHID) {
        currentCount = parseInt(lastUHID.split('-')[2]);
    }
    generateNewUHID();
}

// Generate new UHID
function generateNewUHID() {
    currentCount++;
    const uhid = `${UHID_PREFIX}-${currentYear}-${currentCount.toString().padStart(4, '0')}`;
    document.getElementById('uhid').value = uhid;
    localStorage.setItem('last_uhid_' + currentYear, uhid);
}

// Setup form validation
function setupFormValidation() {
    const form = document.getElementById('registrationForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateForm()) {
            savePatient();
        }
    });

    // Age calculation on DOB change
    document.getElementById('dob').addEventListener('change', function() {
        calculateAge(this.value);
    });
}

// Calculate age
function calculateAge(dob) {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    // Display age somewhere if needed
    console.log('Age:', age);
}

// Validate form
function validateForm() {
    const requiredFields = [
        'firstName',
        'lastName',
        'dob',
        'gender',
        'mobile'
    ];

    let isValid = true;
    const missingFields = [];
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field);
        if (!element.value.trim()) {
            element.classList.add('error');
            missingFields.push(element.getAttribute('placeholder') || field);
            isValid = false;
        } else {
            element.classList.remove('error');
        }
    });

    if (missingFields.length > 0) {
        showNotification(`Please fill in required fields: ${missingFields.join(', ')}`, 'error');
        return false;
    }

    // Mobile validation
    const mobile = document.getElementById('mobile');
    if (mobile.value && !mobile.value.match(/^[0-9]{10}$/)) {
        mobile.classList.add('error');
        showNotification('Please enter a valid 10-digit mobile number', 'error');
        return false;
    } else {
        mobile.classList.remove('error');
    }

    // Email validation if provided
    const email = document.getElementById('email');
    if (email.value && !email.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        email.classList.add('error');
        showNotification('Please enter a valid email address', 'error');
        return false;
    } else {
        email.classList.remove('error');
    }

    // Check for duplicate mobile number if using HMS data store
    if (window.hmsData) {
        const existingPatient = window.hmsData.patients.find(p => p.mobile === mobile.value);
        if (existingPatient) {
            mobile.classList.add('error');
            showNotification('A patient with this mobile number already exists', 'warning');
            return false;
        }
    }

    return isValid;
}

// Save patient data
function savePatient() {
    const formData = {
        registrationDate: document.getElementById('registrationDate').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        dob: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        bloodGroup: document.getElementById('bloodGroup').value,
        mobile: document.getElementById('mobile').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        pincode: document.getElementById('pincode').value,
        allergies: document.getElementById('allergies').value,
        chronicDiseases: document.getElementById('chronicDiseases').value,
        medications: document.getElementById('medications').value,
        emergencyName: document.getElementById('emergencyName').value,
        emergencyRelation: document.getElementById('emergencyRelation').value,
        emergencyPhone: document.getElementById('emergencyPhone').value
    };

    // Calculate age if DOB is provided
    if (formData.dob) {
        const today = new Date();
        const birthDate = new Date(formData.dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        formData.age = age;
    }

    try {
        // Check if HMSDataStore is available
        if (window.hmsData) {
            // Use the integrated data store
            const savedPatient = window.hmsData.addPatient(formData);
            showNotification(`Patient registered successfully! UHID: ${savedPatient.uhid}`, 'success');
            
            // Auto-print option
            setTimeout(() => {
                if (confirm('Would you like to print the patient registration card?')) {
                    printPatientCard(savedPatient);
                }
            }, 1000);
        } else {
            // Fallback to old localStorage method
            formData.uhid = document.getElementById('uhid').value;
            formData.createdAt = new Date().toISOString();
            formData.lastUpdated = new Date().toISOString();
            
            const patients = JSON.parse(localStorage.getItem('patients') || '[]');
            patients.push(formData);
            localStorage.setItem('patients', JSON.stringify(patients));
            
            showSuccess('Patient registered successfully!');
        }
        
        clearForm();
        if (!window.hmsData) {
            generateNewUHID();
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Error registering patient. Please try again.', 'error');
    }
}

// Print patient card
function printPatientCard(patient) {
    const cardHTML = generatePatientCardHTML(patient);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(cardHTML);
    printWindow.document.close();
    
    printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
    };
}

function generatePatientCardHTML(patient) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Patient Registration Card - ${patient.uhid}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    background: #f0f0f0;
                }
                .card-container {
                    background: white;
                    max-width: 500px;
                    margin: 0 auto;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
                .card-header { 
                    background: linear-gradient(135deg, #1e293b, #3b82f6);
                    color: white; 
                    padding: 20px; 
                    text-align: center; 
                }
                .hospital-name { 
                    font-size: 20px; 
                    font-weight: bold; 
                    margin-bottom: 5px; 
                }
                .card-subtitle { 
                    font-size: 14px; 
                    opacity: 0.9; 
                }
                .card-body { 
                    padding: 25px; 
                }
                .patient-name { 
                    font-size: 24px; 
                    font-weight: bold; 
                    color: #1e293b;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .uhid-section {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .uhid { 
                    font-size: 18px; 
                    font-weight: bold; 
                    color: #3b82f6; 
                    letter-spacing: 2px;
                }
                .patient-info { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 15px; 
                    margin-bottom: 20px; 
                }
                .info-item { 
                    display: flex; 
                    flex-direction: column; 
                }
                .info-label { 
                    font-size: 12px; 
                    font-weight: bold; 
                    color: #6b7280; 
                    text-transform: uppercase; 
                }
                .info-value { 
                    font-size: 14px; 
                    color: #1e293b; 
                    margin-top: 2px; 
                }
                .emergency-section { 
                    background: #fef2f2; 
                    border: 1px solid #fecaca;
                    padding: 15px; 
                    border-radius: 8px; 
                    margin-top: 20px; 
                }
                .emergency-title { 
                    font-size: 14px; 
                    font-weight: bold; 
                    color: #dc2626; 
                    margin-bottom: 10px; 
                }
                .card-footer { 
                    background: #f8f9fa; 
                    padding: 15px; 
                    text-align: center; 
                    font-size: 12px; 
                    color: #6b7280; 
                }
                @media print {
                    body { margin: 0; background: white; }
                    .card-container { box-shadow: none; }
                }
            </style>
        </head>
        <body>
            <div class="card-container">
                <div class="card-header">
                    <div class="hospital-name">BTL Charitale Hospital</div>
                    <div class="card-subtitle">Patient Registration Card</div>
                </div>
                
                <div class="card-body">
                    <div class="patient-name">${patient.firstName} ${patient.lastName}</div>
                    
                    <div class="uhid-section">
                        <div class="uhid">${patient.uhid}</div>
                        <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Unique Hospital ID</div>
                    </div>
                    
                    <div class="patient-info">
                        <div class="info-item">
                            <span class="info-label">Age/Gender</span>
                            <span class="info-value">${patient.age || 'N/A'} years / ${patient.gender}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Blood Group</span>
                            <span class="info-value">${patient.bloodGroup || 'Not specified'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Mobile</span>
                            <span class="info-value">${patient.mobile}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Registration Date</span>
                            <span class="info-value">${formatDate(patient.registrationDate)}</span>
                        </div>
                    </div>
                    
                    ${patient.allergies ? `
                    <div style="background: #fff7ed; border: 1px solid #fed7aa; padding: 10px; border-radius: 6px; margin: 15px 0;">
                        <strong style="color: #ea580c; font-size: 12px;">ALLERGIES:</strong>
                        <div style="color: #ea580c; font-size: 14px; margin-top: 5px;">${patient.allergies}</div>
                    </div>
                    ` : ''}
                    
                    ${patient.emergencyName ? `
                    <div class="emergency-section">
                        <div class="emergency-title">Emergency Contact</div>
                        <div style="font-size: 14px;">
                            <strong>${patient.emergencyName}</strong> (${patient.emergencyRelation || 'Contact'})
                            <br>Phone: ${patient.emergencyPhone || 'Not provided'}
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="card-footer">
                    Generated on: ${new Date().toLocaleString()}
                    <br>For any queries, contact hospital administration
                </div>
            </div>
        </body>
        </html>
    `;
}

// Clear form
function clearForm() {
    document.getElementById('registrationForm').reset();
    setDefaultDates();
}

// Print form
function printForm() {
    window.print();
}

// Show success message
function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.textContent = message;
    
    document.querySelector('.container').insertBefore(alert, document.querySelector('.registration-form'));
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}