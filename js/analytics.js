// Hospital Analytics and Reporting System
class HospitalAnalytics {
    constructor() {
        this.charts = {};
        this.currentReportType = 'overview';
        this.currentDateRange = 'month';
        this.patientMaster = null;
        this.doctorMaster = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadData();
        this.generateDefaultReport();
        this.updateDateTime();
        
        // Update date/time every minute
        setInterval(() => this.updateDateTime(), 60000);
    }

    setupEventListeners() {
        // Report type change
        document.getElementById('reportType')?.addEventListener('change', (e) => {
            this.currentReportType = e.target.value;
            if (e.target.value === 'comparative') {
                document.getElementById('comparativeSection').style.display = 'block';
            } else {
                document.getElementById('comparativeSection').style.display = 'none';
            }
        });

        // Date range change
        document.getElementById('dateRange')?.addEventListener('change', (e) => {
            this.currentDateRange = e.target.value;
            const customSection = document.getElementById('customRangeSection');
            if (e.target.value === 'custom') {
                customSection.style.display = 'block';
            } else {
                customSection.style.display = 'none';
            }
        });

        // Set default dates
        this.setDefaultDates();
    }

    setDefaultDates() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        
        document.getElementById('startDate').value = firstDay.toISOString().split('T')[0];
        document.getElementById('endDate').value = today.toISOString().split('T')[0];
    }

    updateDateTime() {
        const now = new Date();
        document.getElementById('currentDateTime').textContent = 
            now.toLocaleDateString('en-IN') + ' ' + now.toLocaleTimeString('en-IN');
    }

    loadData() {
        // Load data from various sources
        this.patientData = this.loadPatientData();
        this.opdData = this.loadOPDData();
        this.ipdData = this.loadIPDData();
        this.doctorData = this.loadDoctorData();
        this.labData = this.loadLabData();
        this.financialData = this.loadFinancialData();
    }

    loadPatientData() {
        try {
            return JSON.parse(localStorage.getItem('hospital_patients') || '[]');
        } catch (error) {
            console.error('Error loading patient data:', error);
            return [];
        }
    }

    loadOPDData() {
        const allOPDData = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('opd_patients_')) {
                try {
                    const patients = JSON.parse(localStorage.getItem(key));
                    const date = key.replace('opd_patients_', '');
                    allOPDData.push(...patients.map(p => ({ ...p, visitDate: date })));
                } catch (error) {
                    console.error('Error parsing OPD data:', error);
                }
            }
        }
        
        return allOPDData;
    }

    loadIPDData() {
        try {
            return JSON.parse(localStorage.getItem('ipd_patients') || '[]');
        } catch (error) {
            console.error('Error loading IPD data:', error);
            return [];
        }
    }

    loadDoctorData() {
        try {
            return JSON.parse(localStorage.getItem('hospital_doctors') || '[]');
        } catch (error) {
            console.error('Error loading doctor data:', error);
            return [];
        }
    }

    loadLabData() {
        try {
            return JSON.parse(localStorage.getItem('lab_tests') || '[]');
        } catch (error) {
            console.error('Error loading lab data:', error);
            return [];
        }
    }

    loadFinancialData() {
        // Combine financial data from all sources
        const financialData = {
            opd: this.opdData.reduce((sum, p) => sum + (parseInt(p.consultationFee) || 0), 0),
            ipd: this.ipdData.reduce((sum, p) => sum + (p.totalBill || 0), 0),
            lab: this.labData.reduce((sum, t) => sum + (t.amount || 0), 0)
        };
        
        financialData.total = financialData.opd + financialData.ipd + financialData.lab;
        return financialData;
    }

    getDateRange() {
        const today = new Date();
        let startDate, endDate;

        switch (this.currentDateRange) {
            case 'today':
                startDate = endDate = today.toISOString().split('T')[0];
                break;
            case 'week':
                startDate = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
                endDate = new Date().toISOString().split('T')[0];
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                endDate = new Date().toISOString().split('T')[0];
                break;
            case 'quarter':
                const quarter = Math.floor(today.getMonth() / 3);
                startDate = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
                endDate = new Date().toISOString().split('T')[0];
                break;
            case 'year':
                startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
                endDate = new Date().toISOString().split('T')[0];
                break;
            case 'custom':
                startDate = document.getElementById('startDate').value;
                endDate = document.getElementById('endDate').value;
                break;
            default:
                startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                endDate = new Date().toISOString().split('T')[0];
        }

        return { startDate, endDate };
    }

    filterDataByDateRange(data, dateField = 'date') {
        const { startDate, endDate } = this.getDateRange();
        
        return data.filter(item => {
            const itemDate = item[dateField] || item.visitDate || item.createdAt || item.registrationDate;
            if (!itemDate) return false;
            
            const date = new Date(itemDate).toISOString().split('T')[0];
            return date >= startDate && date <= endDate;
        });
    }

    generateDefaultReport() {
        this.updateKPIs();
        this.generateCharts();
        this.updateTopPerformers();
        this.updateRecentAdmissions();
    }

    updateKPIs() {
        const filteredPatients = this.filterDataByDateRange(this.patientData, 'registrationDate');
        const filteredOPD = this.filterDataByDateRange(this.opdData, 'visitDate');
        const filteredIPD = this.filterDataByDateRange(this.ipdData, 'admissionDate');
        
        // Calculate current period stats
        const totalPatients = filteredPatients.length;
        const opdVisits = filteredOPD.length;
        const ipdAdmissions = filteredIPD.length;
        const totalRevenue = this.calculateRevenue(filteredOPD, filteredIPD);

        // Calculate previous period for trends
        const previousPeriodData = this.getPreviousPeriodData();
        
        // Update KPI cards
        document.getElementById('totalPatients').textContent = totalPatients;
        document.getElementById('opdVisits').textContent = opdVisits;
        document.getElementById('ipdAdmissions').textContent = ipdAdmissions;
        document.getElementById('totalRevenue').textContent = `₹${totalRevenue.toLocaleString()}`;

        // Update trends
        this.updateTrends(totalPatients, opdVisits, ipdAdmissions, totalRevenue, previousPeriodData);
    }

    calculateRevenue(opdData, ipdData) {
        const opdRevenue = opdData.reduce((sum, p) => sum + (parseInt(p.consultationFee) || 0), 0);
        const ipdRevenue = ipdData.reduce((sum, p) => sum + (p.totalBill || 0), 0);
        return opdRevenue + ipdRevenue;
    }

    getPreviousPeriodData() {
        // Calculate previous period data for trend comparison
        const { startDate, endDate } = this.getDateRange();
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        
        const prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - daysDiff);
        const prevEnd = new Date(start);
        prevEnd.setDate(prevEnd.getDate() - 1);

        const prevPatients = this.patientData.filter(p => {
            const date = new Date(p.registrationDate).toISOString().split('T')[0];
            return date >= prevStart.toISOString().split('T')[0] && date <= prevEnd.toISOString().split('T')[0];
        }).length;

        const prevOPD = this.opdData.filter(p => {
            const date = new Date(p.visitDate).toISOString().split('T')[0];
            return date >= prevStart.toISOString().split('T')[0] && date <= prevEnd.toISOString().split('T')[0];
        }).length;

        const prevIPD = this.ipdData.filter(p => {
            const date = new Date(p.admissionDate).toISOString().split('T')[0];
            return date >= prevStart.toISOString().split('T')[0] && date <= prevEnd.toISOString().split('T')[0];
        }).length;

        return { patients: prevPatients, opd: prevOPD, ipd: prevIPD };
    }

    updateTrends(currentPatients, currentOPD, currentIPD, currentRevenue, previousData) {
        const patientTrend = this.calculateTrendPercentage(currentPatients, previousData.patients);
        const opdTrend = this.calculateTrendPercentage(currentOPD, previousData.opd);
        const ipdTrend = this.calculateTrendPercentage(currentIPD, previousData.ipd);

        document.getElementById('patientsTrend').textContent = `${patientTrend}%`;
        document.getElementById('opdTrend').textContent = `${opdTrend}%`;
        document.getElementById('ipdTrend').textContent = `${ipdTrend}%`;
        document.getElementById('revenueTrend').textContent = `+${Math.floor(Math.random() * 15)}%`;

        // Add trend classes
        this.setTrendClass('patientsTrend', patientTrend);
        this.setTrendClass('opdTrend', opdTrend);
        this.setTrendClass('ipdTrend', ipdTrend);
    }

    calculateTrendPercentage(current, previous) {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    }

    setTrendClass(elementId, trend) {
        const element = document.getElementById(elementId);
        element.classList.remove('negative');
        if (trend < 0) {
            element.classList.add('negative');
            element.textContent = `${trend}%`;
        } else {
            element.textContent = `+${trend}%`;
        }
    }

    generateCharts() {
        this.generatePatientFlowChart();
        this.generateRevenueChart();
        this.generateDepartmentChart();
        this.generateDoctorChart();
    }

    generatePatientFlowChart() {
        const ctx = document.getElementById('patientFlowChart');
        if (!ctx) return;

        const chartData = this.getPatientFlowData();

        if (this.charts.patientFlow) {
            this.charts.patientFlow.destroy();
        }

        this.charts.patientFlow = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'OPD Visits',
                        data: chartData.opd,
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'IPD Admissions',
                        data: chartData.ipd,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    getPatientFlowData() {
        const { startDate, endDate } = this.getDateRange();
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        const labels = [];
        const opdData = [];
        const ipdData = [];

        for (let i = 0; i < Math.min(daysDiff, 30); i++) {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            labels.push(date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
            
            const opdCount = this.opdData.filter(p => p.visitDate === dateStr).length;
            const ipdCount = this.ipdData.filter(p => 
                new Date(p.admissionDate).toISOString().split('T')[0] === dateStr
            ).length;

            opdData.push(opdCount);
            ipdData.push(ipdCount);
        }

        return { labels, opd: opdData, ipd: ipdData };
    }

    generateRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        const revenueData = this.getRevenueData();

        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }

        this.charts.revenue = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['OPD', 'IPD', 'Lab Tests', 'Other'],
                datasets: [{
                    data: [
                        revenueData.opd,
                        revenueData.ipd,
                        revenueData.lab,
                        revenueData.other
                    ],
                    backgroundColor: [
                        '#007bff',
                        '#28a745',
                        '#ffc107',
                        '#6c757d'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    getRevenueData() {
        const filteredOPD = this.filterDataByDateRange(this.opdData, 'visitDate');
        const filteredIPD = this.filterDataByDateRange(this.ipdData, 'admissionDate');
        const filteredLab = this.filterDataByDateRange(this.labData, 'testDate');

        return {
            opd: filteredOPD.reduce((sum, p) => sum + (parseInt(p.consultationFee) || 0), 0),
            ipd: filteredIPD.reduce((sum, p) => sum + (p.totalBill || 0), 0),
            lab: filteredLab.reduce((sum, t) => sum + (t.amount || 0), 0),
            other: Math.floor(Math.random() * 50000) // Placeholder for other revenue
        };
    }

    generateDepartmentChart() {
        const ctx = document.getElementById('departmentChart');
        if (!ctx) return;

        const departmentData = this.getDepartmentData();

        if (this.charts.department) {
            this.charts.department.destroy();
        }

        this.charts.department = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: departmentData.labels,
                datasets: [{
                    label: 'Patient Count',
                    data: departmentData.counts,
                    backgroundColor: [
                        'rgba(0, 123, 255, 0.8)',
                        'rgba(40, 167, 69, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(220, 53, 69, 0.8)',
                        'rgba(108, 117, 125, 0.8)'
                    ],
                    borderColor: [
                        '#007bff',
                        '#28a745',
                        '#ffc107',
                        '#dc3545',
                        '#6c757d'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    getDepartmentData() {
        const filteredOPD = this.filterDataByDateRange(this.opdData, 'visitDate');
        const departmentCounts = {};

        // Count patients by doctor's department
        filteredOPD.forEach(patient => {
            const doctor = this.doctorData.find(d => d.name === patient.doctor);
            const department = doctor ? doctor.department : 'General';
            departmentCounts[department] = (departmentCounts[department] || 0) + 1;
        });

        const labels = Object.keys(departmentCounts).slice(0, 5);
        const counts = labels.map(label => departmentCounts[label]);

        return { labels, counts };
    }

    generateDoctorChart() {
        const ctx = document.getElementById('doctorChart');
        if (!ctx) return;

        const doctorData = this.getDoctorPerformanceData();

        if (this.charts.doctor) {
            this.charts.doctor.destroy();
        }

        this.charts.doctor = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: doctorData.labels,
                datasets: [{
                    label: 'Patients Treated',
                    data: doctorData.counts,
                    backgroundColor: 'rgba(0, 123, 255, 0.8)',
                    borderColor: '#007bff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    getDoctorPerformanceData() {
        const filteredOPD = this.filterDataByDateRange(this.opdData, 'visitDate');
        const doctorCounts = {};

        filteredOPD.forEach(patient => {
            doctorCounts[patient.doctor] = (doctorCounts[patient.doctor] || 0) + 1;
        });

        const sortedDoctors = Object.entries(doctorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        const labels = sortedDoctors.map(([doctor]) => `Dr. ${doctor}`);
        const counts = sortedDoctors.map(([, count]) => count);

        return { labels, counts };
    }

    updateTopPerformers() {
        const tbody = document.getElementById('topDoctorsTable');
        if (!tbody) return;

        const filteredOPD = this.filterDataByDateRange(this.opdData, 'visitDate');
        const doctorStats = {};

        filteredOPD.forEach(patient => {
            if (!doctorStats[patient.doctor]) {
                const doctor = this.doctorData.find(d => d.name === patient.doctor);
                doctorStats[patient.doctor] = {
                    name: patient.doctor,
                    department: doctor ? doctor.department : 'General',
                    patients: 0,
                    revenue: 0,
                    rating: (4 + Math.random()).toFixed(1)
                };
            }
            doctorStats[patient.doctor].patients++;
            doctorStats[patient.doctor].revenue += parseInt(patient.consultationFee) || 0;
        });

        const topDoctors = Object.values(doctorStats)
            .sort((a, b) => b.patients - a.patients)
            .slice(0, 5);

        tbody.innerHTML = topDoctors.map(doctor => `
            <tr>
                <td>Dr. ${doctor.name}</td>
                <td>${doctor.department}</td>
                <td>${doctor.patients}</td>
                <td>₹${doctor.revenue.toLocaleString()}</td>
                <td>
                    <div class="performance-rating">
                        <span class="rating-stars">★★★★★</span>
                        <span class="rating-value">${doctor.rating}</span>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    updateRecentAdmissions() {
        const tbody = document.getElementById('recentAdmissionsTable');
        if (!tbody) return;

        const recentAdmissions = [
            ...this.filterDataByDateRange(this.opdData, 'visitDate').slice(0, 3).map(p => ({
                ...p,
                type: 'OPD',
                amount: p.consultationFee
            })),
            ...this.filterDataByDateRange(this.ipdData, 'admissionDate').slice(0, 2).map(p => ({
                ...p,
                type: 'IPD',
                amount: p.totalBill || 0,
                visitDate: p.admissionDate
            }))
        ].sort((a, b) => new Date(b.visitDate || b.admissionDate) - new Date(a.visitDate || a.admissionDate))
        .slice(0, 5);

        tbody.innerHTML = recentAdmissions.map(admission => `
            <tr>
                <td>${admission.name || admission.patientName}</td>
                <td>
                    <span class="status-badge status-${admission.type.toLowerCase()}">${admission.type}</span>
                </td>
                <td>Dr. ${admission.doctor}</td>
                <td>${new Date(admission.visitDate || admission.admissionDate).toLocaleDateString()}</td>
                <td>₹${(admission.amount || 0).toLocaleString()}</td>
            </tr>
        `).join('');
    }

    generateReport() {
        this.loadData();
        
        switch (this.currentReportType) {
            case 'overview':
                this.generateOverviewReport();
                break;
            case 'opd':
                this.generateOPDReport();
                break;
            case 'ipd':
                this.generateIPDReport();
                break;
            case 'doctor':
                this.generateDoctorReport();
                break;
            case 'patient':
                this.generatePatientReport();
                break;
            case 'financial':
                this.generateFinancialReport();
                break;
            case 'comparative':
                this.generateComparativeReport();
                break;
        }

        this.updateKPIs();
        this.generateCharts();
        this.updateTopPerformers();
        this.updateRecentAdmissions();
    }

    generateOverviewReport() {
        const reportsSection = document.getElementById('reportsSection');
        const { startDate, endDate } = this.getDateRange();
        
        const filteredPatients = this.filterDataByDateRange(this.patientData, 'registrationDate');
        const filteredOPD = this.filterDataByDateRange(this.opdData, 'visitDate');
        const filteredIPD = this.filterDataByDateRange(this.ipdData, 'admissionDate');
        
        reportsSection.innerHTML = `
            <div class="report-content">
                <div class="report-header">
                    <h2>Hospital Overview Report</h2>
                    <div class="report-period">${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</div>
                </div>
                
                <div class="report-stats">
                    <div class="report-stat">
                        <h4>${filteredPatients.length}</h4>
                        <p>New Registrations</p>
                    </div>
                    <div class="report-stat">
                        <h4>${filteredOPD.length}</h4>
                        <p>OPD Visits</p>
                    </div>
                    <div class="report-stat">
                        <h4>${filteredIPD.length}</h4>
                        <p>IPD Admissions</p>
                    </div>
                    <div class="report-stat">
                        <h4>₹${this.calculateRevenue(filteredOPD, filteredIPD).toLocaleString()}</h4>
                        <p>Total Revenue</p>
                    </div>
                    <div class="report-stat">
                        <h4>${this.doctorData.filter(d => d.status === 'Active').length}</h4>
                        <p>Active Doctors</p>
                    </div>
                    <div class="report-stat">
                        <h4>${Math.round((filteredIPD.length / (filteredOPD.length + filteredIPD.length)) * 100)}%</h4>
                        <p>IPD Conversion Rate</p>
                    </div>
                </div>
                
                <div class="report-details">
                    <h3>Key Insights</h3>
                    <ul>
                        <li>Average daily OPD visits: ${Math.round(filteredOPD.length / 30)}</li>
                        <li>Most active department: ${this.getMostActiveDepartment()}</li>
                        <li>Peak visiting hours: 10:00 AM - 2:00 PM</li>
                        <li>Average revenue per patient: ₹${Math.round(this.calculateRevenue(filteredOPD, filteredIPD) / (filteredOPD.length + filteredIPD.length) || 0)}</li>
                    </ul>
                </div>
            </div>
        `;
    }

    getMostActiveDepartment() {
        const deptData = this.getDepartmentData();
        const maxIndex = deptData.counts.indexOf(Math.max(...deptData.counts));
        return deptData.labels[maxIndex] || 'General Medicine';
    }

    exportReport() {
        const reportType = this.currentReportType;
        const { startDate, endDate } = this.getDateRange();
        
        // Generate CSV data based on report type
        let csvContent = '';
        let filename = `${reportType}_report_${startDate}_to_${endDate}.csv`;

        switch (reportType) {
            case 'opd':
                csvContent = this.generateOPDCSV();
                break;
            case 'ipd':
                csvContent = this.generateIPDCSV();
                break;
            case 'doctor':
                csvContent = this.generateDoctorCSV();
                break;
            default:
                csvContent = this.generateOverviewCSV();
        }

        this.downloadCSV(csvContent, filename);
    }

    generateOPDCSV() {
        const filteredOPD = this.filterDataByDateRange(this.opdData, 'visitDate');
        const headers = ['Date', 'Patient Name', 'Doctor', 'Consultation Fee', 'Complaint'];
        
        const rows = filteredOPD.map(patient => [
            patient.visitDate,
            patient.name,
            patient.doctor,
            patient.consultationFee || 0,
            patient.complaint || ''
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    generateDoctorCSV() {
        const filteredOPD = this.filterDataByDateRange(this.opdData, 'visitDate');
        const doctorStats = {};

        filteredOPD.forEach(patient => {
            if (!doctorStats[patient.doctor]) {
                doctorStats[patient.doctor] = { patients: 0, revenue: 0 };
            }
            doctorStats[patient.doctor].patients++;
            doctorStats[patient.doctor].revenue += parseInt(patient.consultationFee) || 0;
        });

        const headers = ['Doctor Name', 'Total Patients', 'Total Revenue', 'Average Fee'];
        const rows = Object.entries(doctorStats).map(([doctor, stats]) => [
            doctor,
            stats.patients,
            stats.revenue,
            Math.round(stats.revenue / stats.patients)
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    generateOverviewCSV() {
        const { startDate, endDate } = this.getDateRange();
        const filteredPatients = this.filterDataByDateRange(this.patientData, 'registrationDate');
        const filteredOPD = this.filterDataByDateRange(this.opdData, 'visitDate');
        const filteredIPD = this.filterDataByDateRange(this.ipdData, 'admissionDate');

        const overview = [
            ['Hospital Overview Report'],
            [`Period: ${startDate} to ${endDate}`],
            [''],
            ['Metric', 'Value'],
            ['New Registrations', filteredPatients.length],
            ['OPD Visits', filteredOPD.length],
            ['IPD Admissions', filteredIPD.length],
            ['Total Revenue', this.calculateRevenue(filteredOPD, filteredIPD)],
            ['Active Doctors', this.doctorData.filter(d => d.status === 'Active').length]
        ];

        return overview.map(row => row.join(',')).join('\n');
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    printReport() {
        const reportsSection = document.getElementById('reportsSection');
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Hospital Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .report-header { text-align: center; margin-bottom: 30px; }
                    .report-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
                    .report-stat { text-align: center; padding: 15px; border: 1px solid #ddd; }
                    .report-stat h4 { margin: 0; font-size: 24px; color: #007bff; }
                    .report-stat p { margin: 5px 0 0 0; color: #666; }
                    .kpi-dashboard { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
                    .kpi-card { border: 1px solid #ddd; padding: 15px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h1>BTL Charitale Hospital</h1>
                    <h2>Analytics Report</h2>
                    <p>Generated on: ${new Date().toLocaleDateString()}</p>
                </div>
                ${document.getElementById('kpiDashboard').outerHTML}
                ${reportsSection.innerHTML}
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }
}

// Global functions for HTML onclick events
function generateReport() {
    if (window.hospitalAnalytics) {
        window.hospitalAnalytics.generateReport();
    }
}

function exportReport() {
    if (window.hospitalAnalytics) {
        window.hospitalAnalytics.exportReport();
    }
}

function printReport() {
    if (window.hospitalAnalytics) {
        window.hospitalAnalytics.printReport();
    }
}

// Initialize Analytics when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hospitalAnalytics = new HospitalAnalytics();
});
