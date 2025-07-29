// Enhanced OPD/IPD Integration System
class HospitalIntegration {
    constructor() {
        this.patientDatabase = new Map(); // Centralized patient database
        this.visitHistory = new Map(); // Patient visit history
        this.doctorSchedule = new Map(); // Doctor schedules
        this.bedManagement = new Map(); // Bed allocation
        this.billing = new Map(); // Centralized billing
        
        this.init();
    }

    init() {
        this.loadExistingData();
        this.setupCrossModuleIntegration();
        this.initializePatientDatabase();
        this.setupRealTimeSync();
    }

    loadExistingData() {
        // Load and consolidate data from all modules
        this.loadPatientMasterData();
        this.loadDoctorMasterData();
        this.loadOPDData();
        this.loadIPDData();
        this.loadLabData();
    }

    loadPatientMasterData() {
        try {
            const patients = JSON.parse(localStorage.getItem('hospital_patients') || '[]');
            patients.forEach(patient => {
                this.patientDatabase.set(patient.uhid, {
                    ...patient,
                    visits: [],
                    totalBilled: 0,
                    lastVisit: null,
                    currentStatus: 'Registered'
                });
            });
        } catch (error) {
            console.error('Error loading patient master data:', error);
        }
    }

    loadDoctorMasterData() {
        try {
            const doctors = JSON.parse(localStorage.getItem('hospital_doctors') || '[]');
            doctors.forEach(doctor => {
                this.doctorSchedule.set(doctor.doctorId, {
                    ...doctor,
                    currentPatients: [],
                    todaySchedule: this.generateDoctorSchedule(doctor),
                    availableSlots: this.calculateAvailableSlots(doctor)
                });
            });
        } catch (error) {
            console.error('Error loading doctor master data:', error);
        }
    }

    loadOPDData() {
        try {
            // Load all OPD data from different dates
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('opd_patients_')) {
                    const patients = JSON.parse(localStorage.getItem(key));
                    const date = key.replace('opd_patients_', '');
                    
                    patients.forEach(patient => {
                        this.integrateOPDVisit(patient, date);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading OPD data:', error);
        }
    }

    loadIPDData() {
        try {
            const ipdPatients = JSON.parse(localStorage.getItem('ipd_patients') || '[]');
            ipdPatients.forEach(patient => {
                this.integrateIPDAdmission(patient);
            });
        } catch (error) {
            console.error('Error loading IPD data:', error);
        }
    }

    loadLabData() {
        try {
            const labTests = JSON.parse(localStorage.getItem('lab_tests') || '[]');
            labTests.forEach(test => {
                this.integrateLabTest(test);
            });
        } catch (error) {
            console.error('Error loading lab data:', error);
        }
    }

    integrateOPDVisit(opdVisit, visitDate) {
        // Find or create patient record
        let patient = this.findPatientByDetails(opdVisit);
        
        if (!patient) {
            // Create new patient if not found
            patient = this.createPatientFromOPD(opdVisit);
        }

        // Add visit to patient history
        const visit = {
            type: 'OPD',
            date: visitDate,
            time: opdVisit.time,
            doctor: opdVisit.doctor,
            complaint: opdVisit.complaint,
            diagnosis: opdVisit.diagnosis,
            fee: parseInt(opdVisit.consultationFee) || 0,
            status: 'Completed'
        };

        if (!this.visitHistory.has(patient.uhid)) {
            this.visitHistory.set(patient.uhid, []);
        }
        this.visitHistory.get(patient.uhid).push(visit);

        // Update patient summary
        patient.totalVisits = (patient.totalVisits || 0) + 1;
        patient.totalBilled += visit.fee;
        patient.lastVisit = visitDate;
        patient.currentStatus = 'OPD Patient';

        this.patientDatabase.set(patient.uhid, patient);
    }

    integrateIPDAdmission(ipdAdmission) {
        // Find or create patient record
        let patient = this.findPatientByUHID(ipdAdmission.uhid);
        
        if (!patient) {
            // Create new patient if not found
            patient = this.createPatientFromIPD(ipdAdmission);
        }

        // Add admission to patient history
        const admission = {
            type: 'IPD',
            admissionDate: ipdAdmission.admissionDate,
            bedNumber: ipdAdmission.bedNumber,
            department: ipdAdmission.department,
            doctor: ipdAdmission.doctor,
            diagnosis: ipdAdmission.diagnosis,
            status: ipdAdmission.status || 'Admitted',
            expectedStay: ipdAdmission.expectedStay,
            totalBill: ipdAdmission.totalBill || 0
        };

        if (!this.visitHistory.has(patient.uhid)) {
            this.visitHistory.set(patient.uhid, []);
        }
        this.visitHistory.get(patient.uhid).push(admission);

        // Update patient summary
        patient.currentStatus = 'IPD Patient';
        patient.currentBed = ipdAdmission.bedNumber;
        patient.totalBilled += admission.totalBill;

        this.patientDatabase.set(patient.uhid, patient);

        // Update bed management
        this.updateBedOccupancy(ipdAdmission.bedNumber, patient.uhid);
    }

    integrateLabTest(labTest) {
        const patient = this.findPatientByUHID(labTest.uhid) || this.findPatientByDetails(labTest);
        
        if (patient) {
            const test = {
                type: 'LAB',
                date: labTest.testDate,
                testName: labTest.testName,
                amount: labTest.amount || 0,
                status: labTest.status || 'Completed',
                results: labTest.results
            };

            if (!this.visitHistory.has(patient.uhid)) {
                this.visitHistory.set(patient.uhid, []);
            }
            this.visitHistory.get(patient.uhid).push(test);

            // Update billing
            patient.totalBilled += test.amount;
            this.patientDatabase.set(patient.uhid, patient);
        }
    }

    findPatientByUHID(uhid) {
        return this.patientDatabase.get(uhid);
    }

    findPatientByDetails(patientData) {
        // Try to find patient by name and phone
        for (let [uhid, patient] of this.patientDatabase) {
            if (patient.name === patientData.name && patient.phone === patientData.phone) {
                return patient;
            }
        }
        return null;
    }

    createPatientFromOPD(opdData) {
        const uhid = this.generateUHID();
        const patient = {
            uhid: uhid,
            name: opdData.name,
            age: opdData.age,
            gender: opdData.gender,
            phone: opdData.phone,
            email: opdData.email,
            address: opdData.address,
            bloodGroup: opdData.bloodGroup,
            allergies: opdData.allergies,
            emergencyContact: opdData.emergencyContact,
            emergencyPhone: opdData.emergencyPhone,
            registrationDate: new Date().toISOString(),
            source: 'OPD',
            totalVisits: 0,
            totalBilled: 0,
            currentStatus: 'Registered'
        };

        this.patientDatabase.set(uhid, patient);
        this.savePatientToMaster(patient);
        return patient;
    }

    createPatientFromIPD(ipdData) {
        const uhid = ipdData.uhid || this.generateUHID();
        const patient = {
            uhid: uhid,
            name: ipdData.patientName,
            age: ipdData.patientAge,
            gender: ipdData.gender,
            phone: ipdData.phone,
            address: ipdData.address,
            registrationDate: new Date().toISOString(),
            source: 'IPD',
            totalVisits: 0,
            totalBilled: 0,
            currentStatus: 'Registered'
        };

        this.patientDatabase.set(uhid, patient);
        this.savePatientToMaster(patient);
        return patient;
    }

    generateUHID() {
        const year = new Date().getFullYear().toString().slice(-2);
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const sequence = (this.patientDatabase.size + 1).toString().padStart(4, '0');
        return `UH${year}${month}${sequence}`;
    }

    savePatientToMaster(patient) {
        try {
            const existingPatients = JSON.parse(localStorage.getItem('hospital_patients') || '[]');
            existingPatients.push(patient);
            localStorage.setItem('hospital_patients', JSON.stringify(existingPatients));
        } catch (error) {
            console.error('Error saving patient to master:', error);
        }
    }

    // Enhanced Patient Search
    searchPatient(query) {
        const results = [];
        const searchTerm = query.toLowerCase();

        for (let [uhid, patient] of this.patientDatabase) {
            if (
                patient.uhid.toLowerCase().includes(searchTerm) ||
                patient.name.toLowerCase().includes(searchTerm) ||
                patient.phone.includes(searchTerm) ||
                (patient.email && patient.email.toLowerCase().includes(searchTerm))
            ) {
                const patientWithHistory = {
                    ...patient,
                    visitHistory: this.visitHistory.get(uhid) || [],
                    recentVisits: this.getRecentVisits(uhid, 5)
                };
                results.push(patientWithHistory);
            }
        }

        return results.sort((a, b) => new Date(b.lastVisit || b.registrationDate) - new Date(a.lastVisit || a.registrationDate));
    }

    getRecentVisits(uhid, limit = 10) {
        const visits = this.visitHistory.get(uhid) || [];
        return visits
            .sort((a, b) => new Date(b.date || b.admissionDate) - new Date(a.date || a.admissionDate))
            .slice(0, limit);
    }

    // Patient Journey Tracking
    getPatientJourney(uhid) {
        const patient = this.patientDatabase.get(uhid);
        if (!patient) return null;

        const visits = this.visitHistory.get(uhid) || [];
        const journey = {
            patient: patient,
            totalVisits: visits.length,
            opdVisits: visits.filter(v => v.type === 'OPD').length,
            ipdAdmissions: visits.filter(v => v.type === 'IPD').length,
            labTests: visits.filter(v => v.type === 'LAB').length,
            totalSpent: visits.reduce((sum, v) => sum + (v.fee || v.totalBill || v.amount || 0), 0),
            timeline: visits.sort((a, b) => new Date(a.date || a.admissionDate) - new Date(b.date || b.admissionDate)),
            currentStatus: patient.currentStatus,
            riskLevel: this.calculateRiskLevel(visits),
            recommendations: this.generateRecommendations(patient, visits)
        };

        return journey;
    }

    calculateRiskLevel(visits) {
        const recentVisits = visits.filter(v => {
            const visitDate = new Date(v.date || v.admissionDate);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return visitDate >= thirtyDaysAgo;
        });

        if (recentVisits.length >= 3) return 'High';
        if (recentVisits.length >= 2) return 'Medium';
        return 'Low';
    }

    generateRecommendations(patient, visits) {
        const recommendations = [];
        
        // Frequency-based recommendations
        if (visits.filter(v => v.type === 'OPD').length >= 3) {
            recommendations.push('Consider comprehensive health checkup');
        }

        // Age-based recommendations
        if (patient.age >= 60) {
            recommendations.push('Regular senior citizen health monitoring');
        }

        // Chronic condition follow-up
        const recentDiagnoses = visits.slice(-3).map(v => v.diagnosis).filter(Boolean);
        if (recentDiagnoses.some(d => d.toLowerCase().includes('diabetes'))) {
            recommendations.push('Regular diabetes monitoring required');
        }

        return recommendations;
    }

    // OPD to IPD Conversion
    convertOPDToIPD(opdPatient, admissionDetails) {
        const patient = this.findPatientByDetails(opdPatient) || this.createPatientFromOPD(opdPatient);
        
        const admission = {
            uhid: patient.uhid,
            patientName: patient.name,
            patientAge: patient.age,
            gender: patient.gender,
            phone: patient.phone,
            address: patient.address,
            ...admissionDetails,
            conversionFromOPD: true,
            originalOPDDate: opdPatient.date
        };

        this.integrateIPDAdmission(admission);
        
        // Save to IPD storage
        try {
            const ipdPatients = JSON.parse(localStorage.getItem('ipd_patients') || '[]');
            ipdPatients.push(admission);
            localStorage.setItem('ipd_patients', JSON.stringify(ipdPatients));
        } catch (error) {
            console.error('Error saving IPD conversion:', error);
        }

        return admission;
    }

    // Bed Management Integration
    updateBedOccupancy(bedNumber, uhid) {
        this.bedManagement.set(bedNumber, {
            occupied: true,
            patientUHID: uhid,
            occupiedSince: new Date().toISOString()
        });
    }

    releaseBed(bedNumber) {
        this.bedManagement.set(bedNumber, {
            occupied: false,
            patientUHID: null,
            lastOccupied: new Date().toISOString()
        });
    }

    getBedStatus() {
        const status = {
            total: 50, // Default bed count
            occupied: 0,
            available: 0,
            occupancyRate: 0
        };

        for (let [bed, info] of this.bedManagement) {
            if (info.occupied) {
                status.occupied++;
            }
        }

        status.available = status.total - status.occupied;
        status.occupancyRate = Math.round((status.occupied / status.total) * 100);

        return status;
    }

    // Doctor Performance Integration
    getDoctorPerformance(doctorName, dateRange) {
        const { startDate, endDate } = dateRange;
        const performance = {
            doctor: doctorName,
            opdConsultations: 0,
            ipdPatients: 0,
            totalRevenue: 0,
            patientSatisfaction: 0,
            avgConsultationTime: 0
        };

        // Calculate from visit history
        for (let [uhid, visits] of this.visitHistory) {
            const doctorVisits = visits.filter(v => 
                v.doctor === doctorName &&
                this.isDateInRange(v.date || v.admissionDate, startDate, endDate)
            );

            performance.opdConsultations += doctorVisits.filter(v => v.type === 'OPD').length;
            performance.ipdPatients += doctorVisits.filter(v => v.type === 'IPD').length;
            performance.totalRevenue += doctorVisits.reduce((sum, v) => sum + (v.fee || v.totalBill || 0), 0);
        }

        // Calculate satisfaction (placeholder - would come from actual feedback)
        performance.patientSatisfaction = 4.2 + Math.random() * 0.8;
        performance.avgConsultationTime = 15 + Math.random() * 10; // minutes

        return performance;
    }

    isDateInRange(date, startDate, endDate) {
        const checkDate = new Date(date);
        return checkDate >= new Date(startDate) && checkDate <= new Date(endDate);
    }

    // Real-time Synchronization
    setupRealTimeSync() {
        // Listen for storage changes to sync data across modules
        window.addEventListener('storage', (e) => {
            if (e.key.startsWith('opd_patients_') || e.key === 'ipd_patients' || e.key === 'lab_tests') {
                this.loadExistingData();
            }
        });

        // Periodic sync every 30 seconds
        setInterval(() => {
            this.syncData();
        }, 30000);
    }

    syncData() {
        // Sync patient database with master
        try {
            const masterPatients = Array.from(this.patientDatabase.values());
            localStorage.setItem('hospital_patients', JSON.stringify(masterPatients));
        } catch (error) {
            console.error('Error syncing patient data:', error);
        }
    }

    // Financial Integration
    generateBill(uhid, services = []) {
        const patient = this.patientDatabase.get(uhid);
        if (!patient) return null;

        const visits = this.visitHistory.get(uhid) || [];
        const recentServices = visits.filter(v => {
            const serviceDate = new Date(v.date || v.admissionDate);
            const today = new Date();
            return serviceDate.toDateString() === today.toDateString();
        });

        const bill = {
            billNumber: this.generateBillNumber(),
            patient: patient,
            services: [...recentServices, ...services],
            subtotal: 0,
            tax: 0,
            total: 0,
            date: new Date().toISOString(),
            status: 'Generated'
        };

        bill.subtotal = bill.services.reduce((sum, s) => sum + (s.fee || s.totalBill || s.amount || 0), 0);
        bill.tax = Math.round(bill.subtotal * 0.18); // 18% GST
        bill.total = bill.subtotal + bill.tax;

        this.billing.set(bill.billNumber, bill);
        return bill;
    }

    generateBillNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const sequence = (this.billing.size + 1).toString().padStart(4, '0');
        return `BILL${year}${month}${day}${sequence}`;
    }

    // Cross-module Integration Setup
    setupCrossModuleIntegration() {
        // Make integration methods available globally
        window.hospitalIntegration = this;

        // Extend existing modules with integration capabilities
        this.enhanceOPDModule();
        this.enhanceIPDModule();
        this.enhancePatientMaster();
        this.enhanceDoctorMaster();
    }

    enhanceOPDModule() {
        // Add patient search functionality to OPD
        if (typeof window !== 'undefined') {
            window.searchPatientForOPD = (query) => {
                return this.searchPatient(query);
            };

            window.getPatientHistory = (uhid) => {
                return this.getPatientJourney(uhid);
            };

            window.suggestIPDConversion = (patient) => {
                const journey = this.getPatientJourney(patient.uhid);
                return journey && journey.riskLevel === 'High';
            };
        }
    }

    enhanceIPDModule() {
        // Add bed management integration
        if (typeof window !== 'undefined') {
            window.getBedAvailability = () => {
                return this.getBedStatus();
            };

            window.admitPatientFromOPD = (opdPatient, admissionDetails) => {
                return this.convertOPDToIPD(opdPatient, admissionDetails);
            };

            window.getPatientForAdmission = (uhid) => {
                return this.patientDatabase.get(uhid);
            };
        }
    }

    enhancePatientMaster() {
        if (typeof window !== 'undefined') {
            window.getCompletePatientRecord = (uhid) => {
                return this.getPatientJourney(uhid);
            };

            window.updatePatientFromIntegration = (uhid, updates) => {
                const patient = this.patientDatabase.get(uhid);
                if (patient) {
                    Object.assign(patient, updates);
                    this.patientDatabase.set(uhid, patient);
                    return true;
                }
                return false;
            };
        }
    }

    enhanceDoctorMaster() {
        if (typeof window !== 'undefined') {
            window.getDoctorDashboard = (doctorName) => {
                const dateRange = {
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0]
                };
                return this.getDoctorPerformance(doctorName, dateRange);
            };
        }
    }

    // Public API Methods
    getSystemStats() {
        return {
            totalPatients: this.patientDatabase.size,
            totalVisits: Array.from(this.visitHistory.values()).reduce((sum, visits) => sum + visits.length, 0),
            activeDoctors: this.doctorSchedule.size,
            bedOccupancy: this.getBedStatus(),
            revenueToday: this.calculateDailyRevenue(),
            lastSyncTime: new Date().toISOString()
        };
    }

    calculateDailyRevenue() {
        const today = new Date().toISOString().split('T')[0];
        let revenue = 0;

        for (let [uhid, visits] of this.visitHistory) {
            const todayVisits = visits.filter(v => (v.date || v.admissionDate) === today);
            revenue += todayVisits.reduce((sum, v) => sum + (v.fee || v.totalBill || v.amount || 0), 0);
        }

        return revenue;
    }

    initializePatientDatabase() {
        // Initialize with some sample data if empty
        if (this.patientDatabase.size === 0) {
            console.log('Initializing patient database with existing data...');
            this.loadExistingData();
        }
    }
}

// Initialize Integration System
document.addEventListener('DOMContentLoaded', () => {
    if (!window.hospitalIntegration) {
        window.hospitalIntegration = new HospitalIntegration();
        console.log('Hospital Integration System initialized');
    }
});
