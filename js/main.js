// Global constants
const UTC_FORMAT = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
};

// Hospital Management System Data Store
class HMSDataStore {
    constructor() {
        this.patients = this.getFromStorage('hms_patients') || [];
        this.doctors = this.getFromStorage('hms_doctors') || [];
        this.departments = this.getFromStorage('hms_departments') || this.getDefaultDepartments();
        this.medicines = this.getFromStorage('hms_medicines') || [];
        this.tests = this.getFromStorage('hms_tests') || this.getDefaultTests();
        this.appointments = this.getFromStorage('hms_appointments') || [];
        this.admissions = this.getFromStorage('hms_admissions') || [];
        this.labReports = this.getFromStorage('hms_lab_reports') || [];
        
        // Initialize integration system
        this.initializeIntegration();
    }

    initializeIntegration() {
        // Load integration scripts if not already loaded
        this.loadIntegrationScripts();
        
        // Set up cross-module communication
        this.setupCrossModuleCommunication();
    }

    loadIntegrationScripts() {
        const scripts = [
            '/js/hospital-integration.js',
            '/js/patient-master.js',
            '/js/doctor-master.js',
            '/js/analytics.js'
        ];

        scripts.forEach(script => {
            if (!document.querySelector(`script[src="${script}"]`)) {
                const scriptElement = document.createElement('script');
                scriptElement.src = script;
                scriptElement.async = true;
                document.head.appendChild(scriptElement);
            }
        });
    }

    setupCrossModuleCommunication() {
        // Event system for cross-module communication
        this.eventBus = new EventTarget();
        
        // Global event emitter
        window.hmsEmit = (eventType, data) => {
            this.eventBus.dispatchEvent(new CustomEvent(eventType, { detail: data }));
        };

        // Global event listener
        window.hmsListen = (eventType, callback) => {
            this.eventBus.addEventListener(eventType, callback);
        };
    }

    getFromStorage(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (e) {
            console.warn(`Error loading ${key} from storage:`, e);
            return null;
        }
    }

    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Error saving ${key} to storage:`, e);
        }
    }

    getDefaultDepartments() {
        return [
            { id: '1', name: 'Cardiology', head: '', status: 'Active' },
            { id: '2', name: 'Neurology', head: '', status: 'Active' },
            { id: '3', name: 'Orthopedics', head: '', status: 'Active' },
            { id: '4', name: 'Pediatrics', head: '', status: 'Active' },
            { id: '5', name: 'General Medicine', head: '', status: 'Active' },
            { id: '6', name: 'Surgery', head: '', status: 'Active' },
            { id: '7', name: 'Gynecology', head: '', status: 'Active' },
            { id: '8', name: 'ENT', head: '', status: 'Active' },
            { id: '9', name: 'Dermatology', head: '', status: 'Active' },
            { id: '10', name: 'Psychiatry', head: '', status: 'Active' }
        ];
    }

    getDefaultTests() {
        return [
            { id: '1', name: 'Complete Blood Count (CBC)', category: 'Hematology', price: 500, status: 'Active' },
            { id: '2', name: 'Blood Sugar Fasting', category: 'Biochemistry', price: 200, status: 'Active' },
            { id: '3', name: 'Lipid Profile', category: 'Biochemistry', price: 800, status: 'Active' },
            { id: '4', name: 'Liver Function Test', category: 'Biochemistry', price: 600, status: 'Active' },
            { id: '5', name: 'Kidney Function Test', category: 'Biochemistry', price: 600, status: 'Active' },
            { id: '6', name: 'Thyroid Profile', category: 'Endocrinology', price: 1000, status: 'Active' },
            { id: '7', name: 'ECG', category: 'Cardiology', price: 300, status: 'Active' },
            { id: '8', name: 'Chest X-Ray', category: 'Radiology', price: 400, status: 'Active' },
            { id: '9', name: 'Urine Routine', category: 'Clinical Pathology', price: 200, status: 'Active' },
            { id: '10', name: 'HbA1c', category: 'Biochemistry', price: 600, status: 'Active' }
        ];
    }

    // Patient methods
    addPatient(patient) {
        patient.id = patient.id || this.generateId('patient');
        patient.uhid = patient.uhid || this.generateUHID();
        this.patients.push(patient);
        this.saveToStorage('hms_patients', this.patients);
        return patient;
    }

    updatePatient(patientId, updates) {
        const index = this.patients.findIndex(p => p.id === patientId);
        if (index !== -1) {
            this.patients[index] = { ...this.patients[index], ...updates };
            this.saveToStorage('hms_patients', this.patients);
            return this.patients[index];
        }
        return null;
    }

    getPatient(patientId) {
        return this.patients.find(p => p.id === patientId);
    }

    searchPatients(query) {
        const searchTerm = query.toLowerCase();
        return this.patients.filter(patient => 
            patient.firstName.toLowerCase().includes(searchTerm) ||
            patient.lastName.toLowerCase().includes(searchTerm) ||
            patient.uhid.toLowerCase().includes(searchTerm) ||
            patient.mobile.includes(searchTerm)
        );
    }

    // Doctor methods
    addDoctor(doctor) {
        doctor.id = doctor.id || this.generateId('doctor');
        doctor.doctorCode = doctor.doctorCode || this.generateDoctorCode();
        this.doctors.push(doctor);
        this.saveToStorage('hms_doctors', this.doctors);
        return doctor;
    }

    // Utility methods
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateUHID() {
        const year = new Date().getFullYear().toString().substr(-2);
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const sequence = (this.patients.length + 1).toString().padStart(4, '0');
        return `UH${year}${month}${sequence}`;
    }

    generateDoctorCode() {
        const sequence = (this.doctors.length + 1).toString().padStart(3, '0');
        return `DOC${sequence}`;
    }
}

// Global data store instance
window.hmsData = new HMSDataStore();

// Initialize main application
document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    initializeSidebarSections();
});

// Update date time display
function updateDateTime() {
    const now = new Date();
    const formatted = now.toLocaleString('en-US', UTC_FORMAT)
        .replace(',', '')
        .replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2');
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = formatted;
    }
}

// Sidebar section toggle functionality
function toggleSection(sectionId) {
    const section = document.querySelector(`[data-section="${sectionId}"]`);
    if (section) {
        section.classList.toggle('collapsed');
        // Save state to localStorage
        const collapsedSections = JSON.parse(localStorage.getItem('collapsedSections') || '[]');
        if (section.classList.contains('collapsed')) {
            if (!collapsedSections.includes(sectionId)) {
                collapsedSections.push(sectionId);
            }
        } else {
            const index = collapsedSections.indexOf(sectionId);
            if (index > -1) {
                collapsedSections.splice(index, 1);
            }
        }
        localStorage.setItem('collapsedSections', JSON.stringify(collapsedSections));
    }
}

// Initialize sidebar sections state
function initializeSidebarSections() {
    const collapsedSections = JSON.parse(localStorage.getItem('collapsedSections') || '[]');
    collapsedSections.forEach(sectionId => {
        const section = document.querySelector(`[data-section="${sectionId}"]`);
        if (section) {
            section.classList.add('collapsed');
        }
    });
}

// Sidebar functionality
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const toggleBtn = document.getElementById('toggleSidebar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');

    // Desktop toggle functionality
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (window.innerWidth > 768) {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('expanded');
            }
        });
    }

    // Mobile menu functionality
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && 
                !mobileMenuBtn?.contains(e.target) &&
                !toggleBtn?.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('open');
        } else {
            sidebar.classList.remove('collapsed');
            if (mainContent) {
                mainContent.classList.remove('expanded');
            }
        }
    });

    // Active page highlighting
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === currentPage) {
            item.classList.add('active');
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Common form validation
function validateForm(formId, requiredFields) {
    const form = document.getElementById(formId);
    if (!form) return false;

    const errors = [];
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field || !field.value.trim()) {
            errors.push(fieldId);
        }
    });

    if (errors.length > 0) {
        showNotification(`Please fill in all required fields: ${errors.join(', ')}`, 'error');
        return false;
    }

    return true;
}

// Common notification system
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Add notification styles if not already present
    if (!document.getElementById('notificationStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationStyles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                max-width: 400px;
                padding: 16px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                animation: slideInRight 0.3s ease-out;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            }
            .notification-success { background: linear-gradient(135deg, #22c55e, #16a34a); }
            .notification-error { background: linear-gradient(135deg, #ef4444, #dc2626); }
            .notification-info { background: linear-gradient(135deg, #3b82f6, #2563eb); }
            .notification-warning { background: linear-gradient(135deg, #f59e0b, #d97706); }
            .notification-content { display: flex; align-items: center; gap: 12px; }
            .notification-close { 
                background: none; border: none; color: white; cursor: pointer; 
                padding: 4px; border-radius: 4px; margin-left: auto;
            }
            .notification-close:hover { background: rgba(255,255,255,0.2); }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto-remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
}

// Common utility functions
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
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