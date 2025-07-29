// Doctor Master Management System
class DoctorMaster {
    constructor() {
        this.doctors = this.loadDoctors();
        this.currentDoctor = null;
        this.filteredDoctors = [...this.doctors];
        this.currentPage = 1;
        this.doctorsPerPage = 10;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.displayDoctors();
        this.updateStats();
        this.populateFilters();
        this.initializeDefaultDoctors();
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.searchDoctors(e.target.value);
        });

        // Filter functionality
        document.getElementById('filterDepartment')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('filterSpecialization')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('filterStatus')?.addEventListener('change', () => {
            this.applyFilters();
        });

        // Form submission
        document.getElementById('doctorForm')?.addEventListener('submit', (e) => {
            this.handleFormSubmit(e);
        });

        // Schedule form submission
        document.getElementById('scheduleForm')?.addEventListener('submit', (e) => {
            this.handleScheduleSubmit(e);
        });

        // Export functionality
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportData();
        });

        // Print functionality
        document.getElementById('printBtn')?.addEventListener('click', () => {
            this.printDoctorList();
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

    loadDoctors() {
        try {
            const stored = localStorage.getItem('hospital_doctors');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading doctors:', error);
            return [];
        }
    }

    saveDoctors() {
        try {
            localStorage.setItem('hospital_doctors', JSON.stringify(this.doctors));
            // Also update the select options in other forms
            this.updateDoctorSelects();
        } catch (error) {
            console.error('Error saving doctors:', error);
        }
    }

    updateDoctorSelects() {
        // Update all doctor select elements across the application
        const doctorSelects = document.querySelectorAll('select[id*="doctor"], select[name*="doctor"]');
        doctorSelects.forEach(select => {
            const currentValue = select.value;
            const defaultOption = select.querySelector('option[value=""]');
            
            select.innerHTML = '';
            if (defaultOption) {
                select.appendChild(defaultOption);
            }
            
            this.doctors.filter(d => d.status === 'Active').forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.name;
                option.textContent = `Dr. ${doctor.name} - ${doctor.specialization}`;
                select.appendChild(option);
            });
            
            select.value = currentValue;
        });
    }

    generateDoctorId() {
        const year = new Date().getFullYear().toString().slice(-2);
        const sequence = (this.doctors.length + 1).toString().padStart(3, '0');
        return `DOC${year}${sequence}`;
    }

    initializeDefaultDoctors() {
        if (this.doctors.length === 0) {
            const defaultDoctors = [
                {
                    doctorId: 'DOC001',
                    name: 'Rajesh Kumar',
                    specialization: 'General Medicine',
                    department: 'General Medicine',
                    qualification: 'MBBS, MD',
                    experience: '15 years',
                    phone: '9876543210',
                    email: 'dr.rajesh@hospital.com',
                    consultationFee: 500,
                    status: 'Active',
                    joinDate: '2020-01-15',
                    schedule: {
                        monday: { start: '09:00', end: '17:00', slots: 16 },
                        tuesday: { start: '09:00', end: '17:00', slots: 16 },
                        wednesday: { start: '09:00', end: '17:00', slots: 16 },
                        thursday: { start: '09:00', end: '17:00', slots: 16 },
                        friday: { start: '09:00', end: '17:00', slots: 16 },
                        saturday: { start: '09:00', end: '13:00', slots: 8 }
                    }
                },
                {
                    doctorId: 'DOC002',
                    name: 'Priya Sharma',
                    specialization: 'Pediatrics',
                    department: 'Pediatrics',
                    qualification: 'MBBS, MD (Pediatrics)',
                    experience: '12 years',
                    phone: '9876543211',
                    email: 'dr.priya@hospital.com',
                    consultationFee: 600,
                    status: 'Active',
                    joinDate: '2021-03-01',
                    schedule: {
                        monday: { start: '10:00', end: '18:00', slots: 16 },
                        tuesday: { start: '10:00', end: '18:00', slots: 16 },
                        wednesday: { start: '10:00', end: '18:00', slots: 16 },
                        thursday: { start: '10:00', end: '18:00', slots: 16 },
                        friday: { start: '10:00', end: '18:00', slots: 16 },
                        saturday: { start: '10:00', end: '14:00', slots: 8 }
                    }
                },
                {
                    doctorId: 'DOC003',
                    name: 'Amit Patel',
                    specialization: 'Orthopedics',
                    department: 'Surgery',
                    qualification: 'MBBS, MS (Orthopedics)',
                    experience: '18 years',
                    phone: '9876543212',
                    email: 'dr.amit@hospital.com',
                    consultationFee: 800,
                    status: 'Active',
                    joinDate: '2019-06-15',
                    schedule: {
                        monday: { start: '08:00', end: '16:00', slots: 16 },
                        tuesday: { start: '08:00', end: '16:00', slots: 16 },
                        wednesday: { start: '08:00', end: '16:00', slots: 16 },
                        thursday: { start: '08:00', end: '16:00', slots: 16 },
                        friday: { start: '08:00', end: '16:00', slots: 16 }
                    }
                },
                {
                    doctorId: 'DOC004',
                    name: 'Sunita Verma',
                    specialization: 'Gynecology',
                    department: 'Gynecology',
                    qualification: 'MBBS, MD (Gynecology)',
                    experience: '20 years',
                    phone: '9876543213',
                    email: 'dr.sunita@hospital.com',
                    consultationFee: 700,
                    status: 'Active',
                    joinDate: '2018-01-10',
                    schedule: {
                        monday: { start: '09:00', end: '17:00', slots: 16 },
                        tuesday: { start: '09:00', end: '17:00', slots: 16 },
                        wednesday: { start: '09:00', end: '17:00', slots: 16 },
                        thursday: { start: '09:00', end: '17:00', slots: 16 },
                        friday: { start: '09:00', end: '17:00', slots: 16 },
                        saturday: { start: '09:00', end: '13:00', slots: 8 }
                    }
                }
            ];

            this.doctors = defaultDoctors;
            this.saveDoctors();
        }
    }

    addDoctor(doctorData) {
        const doctor = {
            ...doctorData,
            doctorId: this.generateDoctorId(),
            joinDate: new Date().toISOString().split('T')[0],
            status: 'Active',
            totalPatients: 0,
            totalRevenue: 0,
            schedule: this.generateDefaultSchedule()
        };

        this.doctors.unshift(doctor);
        this.saveDoctors();
        this.displayDoctors();
        this.updateStats();
        
        this.showAlert('Doctor added successfully!', 'success');
        return doctor;
    }

    updateDoctor(doctorId, updatedData) {
        const index = this.doctors.findIndex(d => d.doctorId === doctorId);
        if (index !== -1) {
            this.doctors[index] = { ...this.doctors[index], ...updatedData };
            this.saveDoctors();
            this.displayDoctors();
            this.showAlert('Doctor updated successfully!', 'success');
            return true;
        }
        return false;
    }

    deleteDoctor(doctorId) {
        if (confirm('Are you sure you want to delete this doctor? This action cannot be undone.')) {
            const index = this.doctors.findIndex(d => d.doctorId === doctorId);
            if (index !== -1) {
                this.doctors.splice(index, 1);
                this.saveDoctors();
                this.displayDoctors();
                this.updateStats();
                this.showAlert('Doctor deleted successfully!', 'success');
                return true;
            }
        }
        return false;
    }

    generateDefaultSchedule() {
        return {
            monday: { start: '09:00', end: '17:00', slots: 16 },
            tuesday: { start: '09:00', end: '17:00', slots: 16 },
            wednesday: { start: '09:00', end: '17:00', slots: 16 },
            thursday: { start: '09:00', end: '17:00', slots: 16 },
            friday: { start: '09:00', end: '17:00', slots: 16 },
            saturday: { start: '09:00', end: '13:00', slots: 8 }
        };
    }

    searchDoctors(query) {
        if (!query.trim()) {
            this.filteredDoctors = [...this.doctors];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredDoctors = this.doctors.filter(doctor => 
                doctor.name?.toLowerCase().includes(searchTerm) ||
                doctor.doctorId?.toLowerCase().includes(searchTerm) ||
                doctor.specialization?.toLowerCase().includes(searchTerm) ||
                doctor.department?.toLowerCase().includes(searchTerm) ||
                doctor.phone?.includes(searchTerm) ||
                doctor.email?.toLowerCase().includes(searchTerm)
            );
        }
        this.currentPage = 1;
        this.displayDoctors();
    }

    applyFilters() {
        const department = document.getElementById('filterDepartment')?.value;
        const specialization = document.getElementById('filterSpecialization')?.value;
        const status = document.getElementById('filterStatus')?.value;

        this.filteredDoctors = this.doctors.filter(doctor => {
            let matches = true;

            if (department && doctor.department !== department) {
                matches = false;
            }

            if (specialization && doctor.specialization !== specialization) {
                matches = false;
            }

            if (status && doctor.status !== status) {
                matches = false;
            }

            return matches;
        });

        this.currentPage = 1;
        this.displayDoctors();
    }

    displayDoctors() {
        const startIndex = (this.currentPage - 1) * this.doctorsPerPage;
        const endIndex = startIndex + this.doctorsPerPage;
        const paginatedDoctors = this.filteredDoctors.slice(startIndex, endIndex);

        const tbody = document.getElementById('doctorsTableBody');
        if (!tbody) return;

        if (paginatedDoctors.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No doctors found</td>
                </tr>
            `;
            this.updatePaginationInfo();
            return;
        }

        tbody.innerHTML = paginatedDoctors.map(doctor => `
            <tr>
                <td>${doctor.doctorId}</td>
                <td>
                    <div class="doctor-info">
                        <strong>Dr. ${doctor.name}</strong>
                        <small>${doctor.qualification}</small>
                    </div>
                </td>
                <td>${doctor.specialization}</td>
                <td>${doctor.department}</td>
                <td>${doctor.phone}</td>
                <td>₹${doctor.consultationFee}</td>
                <td>
                    <span class="status-badge status-${doctor.status.toLowerCase()}">${doctor.status}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-info" onclick="doctorMaster.viewDoctor('${doctor.doctorId}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="doctorMaster.editDoctor('${doctor.doctorId}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="doctorMaster.manageSchedule('${doctor.doctorId}')" title="Schedule">
                            <i class="fas fa-calendar-alt"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="doctorMaster.deleteDoctor('${doctor.doctorId}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.updatePaginationInfo();
    }

    updatePaginationInfo() {
        const totalPages = Math.ceil(this.filteredDoctors.length / this.doctorsPerPage);
        const startItem = (this.currentPage - 1) * this.doctorsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.doctorsPerPage, this.filteredDoctors.length);

        document.getElementById('paginationInfo').textContent = 
            `Showing ${startItem}-${endItem} of ${this.filteredDoctors.length} doctors`;

        document.getElementById('prevPageBtn').disabled = this.currentPage === 1;
        document.getElementById('nextPageBtn').disabled = this.currentPage === totalPages;
        
        document.getElementById('currentPage').textContent = this.currentPage;
        document.getElementById('totalPages').textContent = totalPages;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.displayDoctors();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredDoctors.length / this.doctorsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.displayDoctors();
        }
    }

    updateStats() {
        const stats = this.calculateStats();
        
        document.getElementById('totalDoctors').textContent = stats.total;
        document.getElementById('activeDoctors').textContent = stats.active;
        document.getElementById('departments').textContent = stats.departments;
        document.getElementById('avgConsultationFee').textContent = `₹${stats.avgFee}`;
    }

    calculateStats() {
        const activeDoctors = this.doctors.filter(d => d.status === 'Active');
        const departments = [...new Set(this.doctors.map(d => d.department))];
        const avgFee = activeDoctors.length > 0 ? 
            Math.round(activeDoctors.reduce((sum, d) => sum + (d.consultationFee || 0), 0) / activeDoctors.length) : 0;
        
        return {
            total: this.doctors.length,
            active: activeDoctors.length,
            departments: departments.length,
            avgFee
        };
    }

    populateFilters() {
        // Department filter
        const departments = [...new Set(this.doctors.map(d => d.department).filter(Boolean))];
        const departmentSelect = document.getElementById('filterDepartment');
        if (departmentSelect) {
            departmentSelect.innerHTML = '<option value="">All Departments</option>' +
                departments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
        }

        // Specialization filter
        const specializations = [...new Set(this.doctors.map(d => d.specialization).filter(Boolean))];
        const specializationSelect = document.getElementById('filterSpecialization');
        if (specializationSelect) {
            specializationSelect.innerHTML = '<option value="">All Specializations</option>' +
                specializations.map(spec => `<option value="${spec}">${spec}</option>`).join('');
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const doctorData = Object.fromEntries(formData);
        
        // Validation
        if (!this.validateForm(doctorData)) {
            return;
        }

        if (this.currentDoctor) {
            // Update existing doctor
            this.updateDoctor(this.currentDoctor.doctorId, doctorData);
        } else {
            // Add new doctor
            this.addDoctor(doctorData);
        }

        this.clearForm();
        this.hideModal('doctorModal');
    }

    handleScheduleSubmit(e) {
        e.preventDefault();
        
        if (!this.currentDoctor) return;

        const formData = new FormData(e.target);
        const schedule = {};

        // Parse schedule data
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        days.forEach(day => {
            const enabled = formData.get(`${day}_enabled`);
            if (enabled) {
                schedule[day] = {
                    start: formData.get(`${day}_start`),
                    end: formData.get(`${day}_end`),
                    slots: parseInt(formData.get(`${day}_slots`)) || 8
                };
            }
        });

        this.updateDoctor(this.currentDoctor.doctorId, { schedule });
        this.hideModal('scheduleModal');
        this.showAlert('Schedule updated successfully!', 'success');
    }

    validateForm(data) {
        const required = ['name', 'specialization', 'department', 'qualification', 'phone', 'consultationFee'];
        
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

        // Consultation fee validation
        if (isNaN(data.consultationFee) || data.consultationFee <= 0) {
            this.showAlert('Please enter a valid consultation fee', 'error');
            return false;
        }

        return true;
    }

    showAddDoctorModal() {
        this.currentDoctor = null;
        this.clearForm();
        document.getElementById('modalTitle').textContent = 'Add New Doctor';
        document.getElementById('doctorModal').style.display = 'block';
    }

    editDoctor(doctorId) {
        const doctor = this.doctors.find(d => d.doctorId === doctorId);
        if (!doctor) return;

        this.currentDoctor = doctor;
        this.populateForm(doctor);
        document.getElementById('modalTitle').textContent = 'Edit Doctor';
        document.getElementById('doctorModal').style.display = 'block';
    }

    viewDoctor(doctorId) {
        const doctor = this.doctors.find(d => d.doctorId === doctorId);
        if (!doctor) return;

        this.populateViewModal(doctor);
        document.getElementById('viewModal').style.display = 'block';
    }

    manageSchedule(doctorId) {
        const doctor = this.doctors.find(d => d.doctorId === doctorId);
        if (!doctor) return;

        this.currentDoctor = doctor;
        this.populateScheduleForm(doctor);
        document.getElementById('scheduleModal').style.display = 'block';
    }

    populateForm(doctor) {
        Object.keys(doctor).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                input.value = doctor[key] || '';
            }
        });
    }

    populateScheduleForm(doctor) {
        const schedule = doctor.schedule || {};
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        days.forEach(day => {
            const dayData = schedule[day];
            const enabledCheckbox = document.getElementById(`${day}_enabled`);
            const startInput = document.getElementById(`${day}_start`);
            const endInput = document.getElementById(`${day}_end`);
            const slotsInput = document.getElementById(`${day}_slots`);

            if (enabledCheckbox) enabledCheckbox.checked = !!dayData;
            if (startInput) startInput.value = dayData?.start || '09:00';
            if (endInput) endInput.value = dayData?.end || '17:00';
            if (slotsInput) slotsInput.value = dayData?.slots || 8;
        });
    }

    populateViewModal(doctor) {
        const viewContent = document.getElementById('viewContent');
        if (!viewContent) return;

        const patientStats = this.getDoctorPatientStats(doctor.doctorId);
        
        viewContent.innerHTML = `
            <div class="doctor-details">
                <div class="detail-section">
                    <h3>Personal Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Doctor ID:</label>
                            <span>${doctor.doctorId}</span>
                        </div>
                        <div class="detail-item">
                            <label>Name:</label>
                            <span>Dr. ${doctor.name}</span>
                        </div>
                        <div class="detail-item">
                            <label>Specialization:</label>
                            <span>${doctor.specialization}</span>
                        </div>
                        <div class="detail-item">
                            <label>Department:</label>
                            <span>${doctor.department}</span>
                        </div>
                        <div class="detail-item">
                            <label>Qualification:</label>
                            <span>${doctor.qualification}</span>
                        </div>
                        <div class="detail-item">
                            <label>Experience:</label>
                            <span>${doctor.experience}</span>
                        </div>
                        <div class="detail-item">
                            <label>Phone:</label>
                            <span>${doctor.phone}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${doctor.email || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>Professional Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Join Date:</label>
                            <span>${new Date(doctor.joinDate).toLocaleDateString()}</span>
                        </div>
                        <div class="detail-item">
                            <label>Consultation Fee:</label>
                            <span>₹${doctor.consultationFee}</span>
                        </div>
                        <div class="detail-item">
                            <label>Status:</label>
                            <span class="status-badge status-${doctor.status.toLowerCase()}">${doctor.status}</span>
                        </div>
                        <div class="detail-item">
                            <label>Total Patients:</label>
                            <span>${patientStats.totalPatients}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>Weekly Schedule</h3>
                    <div class="schedule-grid">
                        ${this.generateScheduleDisplay(doctor.schedule)}
                    </div>
                </div>

                <div class="detail-section">
                    <h3>Recent Patient Statistics</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <h4>${patientStats.todayPatients}</h4>
                            <p>Today's Patients</p>
                        </div>
                        <div class="stat-item">
                            <h4>${patientStats.weeklyPatients}</h4>
                            <p>This Week</p>
                        </div>
                        <div class="stat-item">
                            <h4>${patientStats.monthlyPatients}</h4>
                            <p>This Month</p>
                        </div>
                        <div class="stat-item">
                            <h4>₹${patientStats.totalRevenue.toLocaleString()}</h4>
                            <p>Total Revenue</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateScheduleDisplay(schedule) {
        if (!schedule) return '<p>No schedule set</p>';

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        return days.map((day, index) => {
            const dayData = schedule[day];
            if (!dayData) return `
                <div class="schedule-day">
                    <strong>${dayNames[index]}</strong>
                    <span class="schedule-off">Off</span>
                </div>
            `;

            return `
                <div class="schedule-day">
                    <strong>${dayNames[index]}</strong>
                    <span>${dayData.start} - ${dayData.end}</span>
                    <small>${dayData.slots} slots</small>
                </div>
            `;
        }).join('');
    }

    getDoctorPatientStats(doctorId) {
        const doctor = this.doctors.find(d => d.doctorId === doctorId);
        const doctorName = doctor ? doctor.name : '';
        
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        let todayPatients = 0;
        let weeklyPatients = 0;
        let monthlyPatients = 0;
        let totalRevenue = 0;

        // Check OPD records
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('opd_patients_')) {
                try {
                    const patients = JSON.parse(localStorage.getItem(key));
                    const doctorPatients = patients.filter(p => p.doctor === doctorName);
                    
                    const dateFromKey = key.replace('opd_patients_', '');
                    
                    if (dateFromKey === today) {
                        todayPatients += doctorPatients.length;
                    }
                    
                    if (new Date(dateFromKey) >= weekAgo) {
                        weeklyPatients += doctorPatients.length;
                    }
                    
                    if (new Date(dateFromKey) >= monthAgo) {
                        monthlyPatients += doctorPatients.length;
                        totalRevenue += doctorPatients.reduce((sum, p) => sum + (parseInt(p.consultationFee) || 0), 0);
                    }
                } catch (error) {
                    console.error('Error parsing OPD data:', error);
                }
            }
        }

        // Check IPD records
        try {
            const ipdPatients = JSON.parse(localStorage.getItem('ipd_patients') || '[]');
            const doctorIPDPatients = ipdPatients.filter(p => p.doctor === doctorName);
            monthlyPatients += doctorIPDPatients.length;
            totalRevenue += doctorIPDPatients.reduce((sum, p) => sum + (p.totalBill || 0), 0);
        } catch (error) {
            console.error('Error parsing IPD data:', error);
        }

        return {
            todayPatients,
            weeklyPatients,
            monthlyPatients,
            totalPatients: monthlyPatients,
            totalRevenue
        };
    }

    clearForm() {
        const form = document.getElementById('doctorForm');
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
        link.download = `doctor_master_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    generateCSV() {
        const headers = ['Doctor ID', 'Name', 'Specialization', 'Department', 'Qualification', 'Experience', 'Phone', 'Email', 'Consultation Fee', 'Status', 'Join Date'];
        
        const rows = this.filteredDoctors.map(doctor => [
            doctor.doctorId,
            doctor.name,
            doctor.specialization,
            doctor.department,
            doctor.qualification,
            doctor.experience,
            doctor.phone,
            doctor.email || '',
            doctor.consultationFee,
            doctor.status,
            new Date(doctor.joinDate).toLocaleDateString()
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    printDoctorList() {
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
                <title>Doctor Master Report</title>
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
                    <h2>Doctor Master Report</h2>
                </div>
                
                <div class="print-date">
                    Generated on: ${new Date().toLocaleDateString()}
                </div>

                <div class="stats">
                    <div class="stat-item">
                        <h3>${stats.total}</h3>
                        <p>Total Doctors</p>
                    </div>
                    <div class="stat-item">
                        <h3>${stats.active}</h3>
                        <p>Active Doctors</p>
                    </div>
                    <div class="stat-item">
                        <h3>${stats.departments}</h3>
                        <p>Departments</p>
                    </div>
                    <div class="stat-item">
                        <h3>₹${stats.avgFee}</h3>
                        <p>Avg Consultation Fee</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Doctor ID</th>
                            <th>Name</th>
                            <th>Specialization</th>
                            <th>Department</th>
                            <th>Phone</th>
                            <th>Consultation Fee</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.filteredDoctors.map(doctor => `
                            <tr>
                                <td>${doctor.doctorId}</td>
                                <td>Dr. ${doctor.name}</td>
                                <td>${doctor.specialization}</td>
                                <td>${doctor.department}</td>
                                <td>${doctor.phone}</td>
                                <td>₹${doctor.consultationFee}</td>
                                <td>${doctor.status}</td>
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

    // Get doctor by name for other modules
    getDoctorByName(name) {
        return this.doctors.find(d => d.name === name && d.status === 'Active');
    }

    // Get all active doctors for dropdowns
    getActiveDoctors() {
        return this.doctors.filter(d => d.status === 'Active');
    }

    // Get doctors by department
    getDoctorsByDepartment(department) {
        return this.doctors.filter(d => d.department === department && d.status === 'Active');
    }
}

// Initialize Doctor Master when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.doctorMaster = new DoctorMaster();
});
