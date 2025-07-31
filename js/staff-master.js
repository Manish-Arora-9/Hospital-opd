// Staff Master Management System
class StaffMaster {
    constructor() {
        this.staffData = [];
        this.currentStaffId = null;
        this.filteredData = [];
        this.init();
    }

    init() {
        this.loadStaffData();
        this.setupEventListeners();
        this.generateStaffCode();
        this.updateStats();
        this.calculateTotalSalary();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('staffForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveStaff();
        });

        // Search functionality
        document.getElementById('searchStaff').addEventListener('input', (e) => {
            this.searchStaff(e.target.value);
        });

        // Modal close events
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Window click to close modal
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Salary calculation
        ['basicSalary', 'allowances'].forEach(id => {
            document.getElementById(id).addEventListener('input', this.calculateTotalSalary);
        });

        // Role-based field updates
        document.getElementById('role').addEventListener('change', this.updateRoleFields);
    }

    loadStaffData() {
        // Load from localStorage or initialize with sample data
        const savedData = localStorage.getItem('staffData');
        if (savedData) {
            this.staffData = JSON.parse(savedData);
        } else {
            this.staffData = this.getSampleData();
            this.saveToStorage();
        }
        this.filteredData = [...this.staffData];
        this.renderStaffList();
        this.updateStats();
    }

    getSampleData() {
        return [
            {
                id: 1,
                staffCode: 'STF001',
                employeeId: 'EMP001',
                firstName: 'Dr. Priya',
                lastName: 'Sharma',
                role: 'Doctor',
                department: 'Cardiology',
                qualification: 'MBBS, MD Cardiology',
                experience: 8,
                mobile: '9876543210',
                email: 'priya.sharma@hospital.com',
                shift: 'Day',
                status: 'Active',
                joiningDate: '2020-01-15',
                basicSalary: 80000,
                allowances: 20000,
                totalSalary: 100000
            },
            {
                id: 2,
                staffCode: 'STF002',
                employeeId: 'EMP002',
                firstName: 'Sister Mary',
                lastName: 'Joseph',
                role: 'Nurse',
                department: 'ICU',
                qualification: 'BSc Nursing',
                experience: 5,
                mobile: '9876543211',
                email: 'mary.joseph@hospital.com',
                shift: 'Night',
                status: 'Active',
                joiningDate: '2021-03-10',
                basicSalary: 35000,
                allowances: 8000,
                totalSalary: 43000
            },
            {
                id: 3,
                staffCode: 'STF003',
                employeeId: 'EMP003',
                firstName: 'Ramesh',
                lastName: 'Kumar',
                role: 'Helper',
                department: 'IPD',
                qualification: '12th Pass',
                experience: 3,
                mobile: '9876543212',
                email: 'ramesh.kumar@hospital.com',
                shift: 'Day',
                status: 'Active',
                joiningDate: '2022-06-20',
                basicSalary: 18000,
                allowances: 2000,
                totalSalary: 20000
            }
        ];
    }

    generateStaffCode() {
        const nextId = this.staffData.length > 0 ? 
            Math.max(...this.staffData.map(s => parseInt(s.staffCode.slice(3)))) + 1 : 1;
        document.getElementById('staffCode').value = `STF${nextId.toString().padStart(3, '0')}`;
    }

    saveStaff() {
        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            return;
        }

        if (this.currentStaffId) {
            // Update existing staff
            const index = this.staffData.findIndex(s => s.id === this.currentStaffId);
            if (index !== -1) {
                this.staffData[index] = { ...formData, id: this.currentStaffId };
                this.showNotification('Staff updated successfully!', 'success');
            }
        } else {
            // Add new staff
            const newId = this.staffData.length > 0 ? 
                Math.max(...this.staffData.map(s => s.id)) + 1 : 1;
            this.staffData.push({ ...formData, id: newId });
            this.showNotification('Staff added successfully!', 'success');
        }

        this.saveToStorage();
        this.renderStaffList();
        this.updateStats();
        this.closeStaffModal();
        this.resetForm();
    }

    getFormData() {
        const workingDays = Array.from(document.querySelectorAll('#workingDays input:checked'))
            .map(cb => cb.value);

        return {
            staffCode: document.getElementById('staffCode').value,
            employeeId: document.getElementById('employeeId').value,
            title: document.getElementById('title').value,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            dob: document.getElementById('dob').value,
            gender: document.getElementById('gender').value,
            bloodGroup: document.getElementById('bloodGroup').value,
            role: document.getElementById('role').value,
            department: document.getElementById('department').value,
            designation: document.getElementById('designation').value,
            qualification: document.getElementById('qualification').value,
            experience: parseInt(document.getElementById('experience').value) || 0,
            licenseNumber: document.getElementById('licenseNumber').value,
            specialization: document.getElementById('specialization').value,
            languages: document.getElementById('languages').value,
            mobile: document.getElementById('mobile').value,
            email: document.getElementById('email').value,
            alternatePhone: document.getElementById('alternatePhone').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            pincode: document.getElementById('pincode').value,
            shift: document.getElementById('shift').value,
            workingDays: workingDays,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            basicSalary: parseFloat(document.getElementById('basicSalary').value) || 0,
            allowances: parseFloat(document.getElementById('allowances').value) || 0,
            totalSalary: parseFloat(document.getElementById('totalSalary').value) || 0,
            emergencyContactName: document.getElementById('emergencyContactName').value,
            emergencyContactRelation: document.getElementById('emergencyContactRelation').value,
            emergencyContactPhone: document.getElementById('emergencyContactPhone').value,
            status: document.getElementById('status').value,
            workLocation: document.getElementById('workLocation').value,
            notes: document.getElementById('notes').value,
            joiningDate: document.getElementById('joiningDate').value
        };
    }

    validateForm(data) {
        const required = ['firstName', 'lastName', 'gender', 'role', 'department', 'qualification', 'mobile', 'email', 'shift', 'joiningDate'];
        
        for (let field of required) {
            if (!data[field]) {
                this.showNotification(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required!`, 'error');
                return false;
            }
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            this.showNotification('Please enter a valid email address!', 'error');
            return false;
        }

        // Mobile validation
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(data.mobile)) {
            this.showNotification('Please enter a valid 10-digit mobile number!', 'error');
            return false;
        }

        return true;
    }

    renderStaffList() {
        const tbody = document.getElementById('staffList');
        tbody.innerHTML = '';

        this.filteredData.forEach(staff => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="staff-photo">
                        <i class="fas fa-user-circle" style="font-size: 32px; color: #3498db;"></i>
                    </div>
                </td>
                <td><strong>${staff.staffCode}</strong></td>
                <td>
                    <div class="staff-name">
                        <strong>${staff.firstName} ${staff.lastName}</strong>
                        <small>${staff.title || ''}</small>
                    </div>
                </td>
                <td>
                    <span class="role-badge role-${staff.role.toLowerCase()}">${staff.role}</span>
                </td>
                <td>${staff.department}</td>
                <td>${staff.qualification}</td>
                <td>${staff.experience} years</td>
                <td>
                    <div class="contact-info">
                        <div><i class="fas fa-phone"></i> ${staff.mobile}</div>
                        <div><i class="fas fa-envelope"></i> ${staff.email}</div>
                    </div>
                </td>
                <td>
                    <span class="shift-badge shift-${staff.shift.toLowerCase()}">${staff.shift}</span>
                </td>
                <td>
                    <span class="status-badge status-${staff.status.toLowerCase().replace(' ', '-')}">${staff.status}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-info" onclick="staffMaster.viewStaff(${staff.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="staffMaster.editStaff(${staff.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="staffMaster.deleteStaff(${staff.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateStats() {
        const totalStaff = this.staffData.length;
        const totalDoctors = this.staffData.filter(s => s.role === 'Doctor').length;
        const totalNurses = this.staffData.filter(s => s.role === 'Nurse').length;
        const totalHelpers = this.staffData.filter(s => ['Helper', 'Technician', 'Security', 'Housekeeping'].includes(s.role)).length;

        document.getElementById('totalStaff').textContent = totalStaff;
        document.getElementById('totalDoctors').textContent = totalDoctors;
        document.getElementById('totalNurses').textContent = totalNurses;
        document.getElementById('totalHelpers').textContent = totalHelpers;
    }

    searchStaff(query) {
        if (!query.trim()) {
            this.filteredData = [...this.staffData];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredData = this.staffData.filter(staff => 
                staff.firstName.toLowerCase().includes(searchTerm) ||
                staff.lastName.toLowerCase().includes(searchTerm) ||
                staff.staffCode.toLowerCase().includes(searchTerm) ||
                staff.mobile.includes(searchTerm) ||
                staff.email.toLowerCase().includes(searchTerm) ||
                staff.role.toLowerCase().includes(searchTerm) ||
                staff.department.toLowerCase().includes(searchTerm)
            );
        }
        this.renderStaffList();
    }

    applyStaffFilters() {
        const roleFilter = document.getElementById('roleFilter').value;
        const departmentFilter = document.getElementById('departmentFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        this.filteredData = this.staffData.filter(staff => {
            return (!roleFilter || staff.role === roleFilter) &&
                   (!departmentFilter || staff.department === departmentFilter) &&
                   (!statusFilter || staff.status === statusFilter);
        });

        this.renderStaffList();
    }

    showAddStaffModal() {
        this.currentStaffId = null;
        this.resetForm();
        this.generateStaffCode();
        document.getElementById('staffModalTitle').textContent = 'Add New Staff';
        document.getElementById('staffModal').style.display = 'block';
    }

    editStaff(id) {
        const staff = this.staffData.find(s => s.id === id);
        if (!staff) return;

        this.currentStaffId = id;
        this.populateForm(staff);
        document.getElementById('staffModalTitle').textContent = 'Edit Staff';
        document.getElementById('staffModal').style.display = 'block';
    }

    populateForm(staff) {
        Object.keys(staff).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = staff[key];
                } else {
                    element.value = staff[key] || '';
                }
            }
        });

        // Handle working days checkboxes
        if (staff.workingDays && Array.isArray(staff.workingDays)) {
            document.querySelectorAll('#workingDays input[type="checkbox"]').forEach(cb => {
                cb.checked = staff.workingDays.includes(cb.value);
            });
        }
    }

    viewStaff(id) {
        const staff = this.staffData.find(s => s.id === id);
        if (!staff) return;

        const content = this.generateStaffDetailsHTML(staff);
        document.getElementById('staffDetailsContent').innerHTML = content;
        document.getElementById('staffViewModal').style.display = 'block';
    }

    generateStaffDetailsHTML(staff) {
        return `
            <div class="staff-details">
                <div class="staff-header">
                    <div class="staff-photo-large">
                        <i class="fas fa-user-circle" style="font-size: 80px; color: #3498db;"></i>
                    </div>
                    <div class="staff-basic-info">
                        <h2>${staff.firstName} ${staff.lastName}</h2>
                        <p><strong>Staff ID:</strong> ${staff.staffCode}</p>
                        <p><strong>Role:</strong> ${staff.role}</p>
                        <p><strong>Department:</strong> ${staff.department}</p>
                        <span class="status-badge status-${staff.status.toLowerCase().replace(' ', '-')}">${staff.status}</span>
                    </div>
                </div>

                <div class="details-grid">
                    <div class="detail-section">
                        <h3>Personal Information</h3>
                        <p><strong>Employee ID:</strong> ${staff.employeeId || 'N/A'}</p>
                        <p><strong>Date of Birth:</strong> ${staff.dob ? new Date(staff.dob).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Gender:</strong> ${staff.gender}</p>
                        <p><strong>Blood Group:</strong> ${staff.bloodGroup || 'N/A'}</p>
                        <p><strong>Joining Date:</strong> ${new Date(staff.joiningDate).toLocaleDateString()}</p>
                    </div>

                    <div class="detail-section">
                        <h3>Professional Information</h3>
                        <p><strong>Qualification:</strong> ${staff.qualification}</p>
                        <p><strong>Experience:</strong> ${staff.experience} years</p>
                        <p><strong>Specialization:</strong> ${staff.specialization || 'N/A'}</p>
                        <p><strong>License Number:</strong> ${staff.licenseNumber || 'N/A'}</p>
                        <p><strong>Languages:</strong> ${staff.languages || 'N/A'}</p>
                    </div>

                    <div class="detail-section">
                        <h3>Contact Information</h3>
                        <p><strong>Mobile:</strong> ${staff.mobile}</p>
                        <p><strong>Email:</strong> ${staff.email}</p>
                        <p><strong>Alternate Phone:</strong> ${staff.alternatePhone || 'N/A'}</p>
                        <p><strong>Address:</strong> ${staff.address || 'N/A'}</p>
                        <p><strong>City:</strong> ${staff.city || 'N/A'}, ${staff.state || 'N/A'} - ${staff.pincode || 'N/A'}</p>
                    </div>

                    <div class="detail-section">
                        <h3>Work Schedule</h3>
                        <p><strong>Shift:</strong> ${staff.shift}</p>
                        <p><strong>Working Days:</strong> ${staff.workingDays ? staff.workingDays.join(', ') : 'N/A'}</p>
                        <p><strong>Work Hours:</strong> ${staff.startTime || 'N/A'} - ${staff.endTime || 'N/A'}</p>
                        <p><strong>Work Location:</strong> ${staff.workLocation || 'N/A'}</p>
                    </div>

                    <div class="detail-section">
                        <h3>Salary Information</h3>
                        <p><strong>Basic Salary:</strong> ₹${staff.basicSalary ? staff.basicSalary.toLocaleString() : '0'}</p>
                        <p><strong>Allowances:</strong> ₹${staff.allowances ? staff.allowances.toLocaleString() : '0'}</p>
                        <p><strong>Total Salary:</strong> ₹${staff.totalSalary ? staff.totalSalary.toLocaleString() : '0'}</p>
                    </div>

                    <div class="detail-section">
                        <h3>Emergency Contact</h3>
                        <p><strong>Name:</strong> ${staff.emergencyContactName || 'N/A'}</p>
                        <p><strong>Relationship:</strong> ${staff.emergencyContactRelation || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${staff.emergencyContactPhone || 'N/A'}</p>
                    </div>
                </div>

                ${staff.notes ? `
                    <div class="detail-section">
                        <h3>Notes</h3>
                        <p>${staff.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    deleteStaff(id) {
        if (confirm('Are you sure you want to delete this staff member?')) {
            this.staffData = this.staffData.filter(s => s.id !== id);
            this.filteredData = this.filteredData.filter(s => s.id !== id);
            this.saveToStorage();
            this.renderStaffList();
            this.updateStats();
            this.showNotification('Staff deleted successfully!', 'success');
        }
    }

    calculateTotalSalary() {
        const basicSalary = parseFloat(document.getElementById('basicSalary').value) || 0;
        const allowances = parseFloat(document.getElementById('allowances').value) || 0;
        document.getElementById('totalSalary').value = basicSalary + allowances;
    }

    updateRoleFields() {
        const role = document.getElementById('role').value;
        const designationSelect = document.getElementById('designation');
        
        // Clear existing options
        designationSelect.innerHTML = '<option value="">Select Designation</option>';
        
        // Add role-specific designations
        let designations = [];
        switch(role) {
            case 'Doctor':
                designations = ['Junior Doctor', 'Senior Resident', 'Assistant Professor', 'Associate Professor', 'Professor', 'Head of Department'];
                break;
            case 'Nurse':
                designations = ['Staff Nurse', 'Senior Nurse', 'Charge Nurse', 'Nursing Supervisor', 'Chief Nursing Officer'];
                break;
            case 'Technician':
                designations = ['Junior Technician', 'Senior Technician', 'Lab Supervisor', 'Chief Technician'];
                break;
            default:
                designations = ['Junior', 'Senior', 'Assistant', 'Associate', 'Head', 'Chief'];
        }
        
        designations.forEach(designation => {
            const option = document.createElement('option');
            option.value = designation;
            option.textContent = designation;
            designationSelect.appendChild(option);
        });
    }

    closeStaffModal() {
        document.getElementById('staffModal').style.display = 'none';
    }

    resetForm() {
        document.getElementById('staffForm').reset();
        this.currentStaffId = null;
        
        // Clear checkboxes
        document.querySelectorAll('#workingDays input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        
        // Reset total salary
        document.getElementById('totalSalary').value = '';
    }

    saveToStorage() {
        localStorage.setItem('staffData', JSON.stringify(this.staffData));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="close-notification">&times;</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
        
        // Close button functionality
        notification.querySelector('.close-notification').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    printStaffList() {
        const printContent = this.generateStaffListPrintHTML();
        this.printDocument(printContent, 'Staff_List');
    }

    printStaffDetails() {
        if (!this.currentStaffId) return;
        
        const staff = this.staffData.find(s => s.id === this.currentStaffId);
        if (!staff) return;
        
        const printContent = this.generateStaffIDCardHTML(staff);
        this.printDocument(printContent, `Staff_ID_Card_${staff.staffCode}`);
    }

    generateStaffListPrintHTML() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Staff List</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2c3e50; padding-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; font-weight: bold; }
                    .role-badge { padding: 2px 6px; border-radius: 3px; font-size: 12px; }
                    .role-doctor { background-color: #e8f5e8; color: #2e7d32; }
                    .role-nurse { background-color: #e3f2fd; color: #1565c0; }
                    .role-helper { background-color: #fff3e0; color: #ef6c00; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Hospital Management System</h1>
                    <h2>Staff List Report</h2>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Staff ID</th>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Department</th>
                            <th>Contact</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.filteredData.map(staff => `
                            <tr>
                                <td>${staff.staffCode}</td>
                                <td>${staff.firstName} ${staff.lastName}</td>
                                <td><span class="role-badge role-${staff.role.toLowerCase()}">${staff.role}</span></td>
                                <td>${staff.department}</td>
                                <td>${staff.mobile}<br/>${staff.email}</td>
                                <td>${staff.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
                    <p>Total Staff: ${this.filteredData.length}</p>
                    <p>Hospital Management System - Staff Report</p>
                </div>
            </body>
            </html>
        `;
    }

    generateStaffIDCardHTML(staff) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Staff ID Card - ${staff.staffCode}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .id-card { width: 350px; margin: 0 auto; border: 2px solid #2c3e50; border-radius: 10px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                    .hospital-name { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
                    .staff-photo { text-align: center; margin: 15px 0; }
                    .staff-info { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 10px 0; }
                    .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
                    .label { font-weight: bold; }
                    .emergency { background: #e74c3c; padding: 10px; border-radius: 5px; margin-top: 15px; text-align: center; font-size: 12px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="id-card">
                    <div class="hospital-name">HOSPITAL MANAGEMENT SYSTEM</div>
                    <div class="staff-photo">
                        <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                            <i class="fas fa-user" style="font-size: 40px;"></i>
                        </div>
                    </div>
                    <div class="staff-info">
                        <div class="info-row">
                            <span class="label">Name:</span>
                            <span>${staff.firstName} ${staff.lastName}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Staff ID:</span>
                            <span>${staff.staffCode}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Role:</span>
                            <span>${staff.role}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Department:</span>
                            <span>${staff.department}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Contact:</span>
                            <span>${staff.mobile}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Blood Group:</span>
                            <span>${staff.bloodGroup || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="emergency">
                        In case of emergency, contact: ${staff.emergencyContactPhone || 'N/A'}
                    </div>
                    <div style="text-align: center; margin-top: 15px; font-size: 10px;">
                        Valid from: ${new Date(staff.joiningDate).toLocaleDateString()}
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    exportStaffData() {
        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `staff_data_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    generateCSV() {
        const headers = ['Staff ID', 'Name', 'Role', 'Department', 'Qualification', 'Experience', 'Mobile', 'Email', 'Status', 'Joining Date'];
        const rows = this.filteredData.map(staff => [
            staff.staffCode,
            `${staff.firstName} ${staff.lastName}`,
            staff.role,
            staff.department,
            staff.qualification,
            staff.experience,
            staff.mobile,
            staff.email,
            staff.status,
            staff.joiningDate
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    printDocument(content, filename) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(content);
        printWindow.document.close();
        
        printWindow.onload = function() {
            printWindow.focus();
            printWindow.print();
        };
    }
}

// Global functions for onclick events
function showAddStaffModal() {
    staffMaster.showAddStaffModal();
}

function applyStaffFilters() {
    staffMaster.applyStaffFilters();
}

function printStaffList() {
    staffMaster.printStaffList();
}

function exportStaffData() {
    staffMaster.exportStaffData();
}

function closeStaffModal() {
    staffMaster.closeStaffModal();
}

function printStaffDetails() {
    staffMaster.printStaffDetails();
}

function updateRoleFields() {
    staffMaster.updateRoleFields();
}

// Initialize staff master when DOM is loaded
let staffMaster;
document.addEventListener('DOMContentLoaded', function() {
    staffMaster = new StaffMaster();
});