// Constants
const UHID_PREFIX = 'HMS';
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
    requiredFields.forEach(field => {
        const element = document.getElementById(field);
        if (!element.value.trim()) {
            element.classList.add('error');
            isValid = false;
        } else {
            element.classList.remove('error');
        }
    });

    // Mobile validation
    const mobile = document.getElementById('mobile');
    if (mobile.value && !mobile.value.match(/^[0-9]{10}$/)) {
        mobile.classList.add('error');
        isValid = false;
    }

    // Email validation if provided
    const email = document.getElementById('email');
    if (email.value && !email.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        email.classList.add('error');
        isValid = false;
    }

    return isValid;
}

// Save patient data
function savePatient() {
    const formData = {
        uhid: document.getElementById('uhid').value,
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
        emergencyPhone: document.getElementById('emergencyPhone').value,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };

    // Save to localStorage
    const patients = JSON.parse(localStorage.getItem('patients') || '[]');
    patients.push(formData);
    localStorage.setItem('patients', JSON.stringify(patients));

    // Save registration date wise
    const dateKey = formData.registrationDate;
    const datePatients = JSON.parse(localStorage.getItem('patients_' + dateKey) || '[]');
    datePatients.push(formData);
    localStorage.setItem('patients_' + dateKey, JSON.stringify(datePatients));

    showSuccess('Patient registered successfully!');
    clearForm();
    generateNewUHID();
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