// Constants for billing
const WARD_CHARGES = {
    'General': 1000,      // Per day
    'Semi-Private': 2000, // Per day
    'Private': 3500,      // Per day
    'ICU': 5000          // Per day
};

const SERVICE_CHARGES = {
    'Doctor Visit': 500,
    'Nursing Care': 300,
    'Dressing': 200,
    'IV Line': 150,
    'ECG': 400,
    'Oxygen': 800,
    'Nebulization': 250,
    'Physiotherapy': 400
};

// Initialize billing
function initializeBilling(admissionId) {
    const admission = getAdmission(admissionId);
    if (!admission) return;

    const billing = {
        admissionId: admissionId,
        uhid: admission.uhid,
        charges: [],
        payments: [],
        status: 'Active',
        createdAt: '2025-07-04 08:17:52',
        updatedAt: '2025-07-04 08:17:52',
        createdBy: 'Manish-Arora-9'
    };

    // Add initial charges
    addCharge(billing, {
        type: 'Admission',
        description: 'Admission Charges',
        amount: 1000,
        date: admission.admissionDate
    });

    saveBilling(billing);
    return billing;
}

// Add new charge
function addCharge(billing, charge) {
    const newCharge = {
        id: generateChargeId(),
        ...charge,
        status: 'Active',
        createdAt: '2025-07-04 08:17:52',
        createdBy: 'Manish-Arora-9'
    };

    billing.charges.push(newCharge);
    billing.updatedAt = '2025-07-04 08:17:52';
    saveBilling(billing);
}

// Add payment
function addPayment(billing, payment) {
    const newPayment = {
        id: generatePaymentId(),
        ...payment,
        status: 'Completed',
        createdAt: '2025-07-04 08:17:52',
        createdBy: 'Manish-Arora-9'
    };

    billing.payments.push(newPayment);
    billing.updatedAt = '2025-07-04 08:17:52';
    saveBilling(billing);

    // Record in transactions
    recordTransaction({
        transactionId: newPayment.id,
        type: 'income',
        category: 'IPD Payment',
        amount: payment.amount,
        paymentMode: payment.mode,
        department: 'IPD',
        description: `IPD Payment - ${payment.remarks}`,
        status: 'Completed',
        admissionId: billing.admissionId,
        uhid: billing.uhid,
        createdAt: '2025-07-04 08:17:52',
        createdBy: 'Manish-Arora-9'
    });
}

// Calculate bill summary
function calculateBillSummary(billing) {
    const charges = billing.charges.reduce((acc, charge) => {
        if (charge.status === 'Active') {
            acc.totalCharges += charge.amount;
            acc.categories[charge.type] = (acc.categories[charge.type] || 0) + charge.amount;
        }
        return acc;
    }, { totalCharges: 0, categories: {} });

    const payments = billing.payments.reduce((acc, payment) => {
        if (payment.status === 'Completed') {
            acc += payment.amount;
        }
        return acc;
    }, 0);

    return {
        totalCharges: charges.totalCharges,
        totalPayments: payments,
        balance: charges.totalCharges - payments,
        categories: charges.categories
    };
}

// Generate detailed bill
function generateDetailedBill(admissionId) {
    const billing = getBilling(admissionId);
    const admission = getAdmission(admissionId);
    if (!billing || !admission) return null;

    const summary = calculateBillSummary(billing);
    const stayDays = calculateStayDays(admission.admissionDate);

    return {
        billNumber: generateBillNumber(),
        admissionId: admissionId,
        uhid: admission.uhid,
        patientName: admission.patientName,
        admissionDate: admission.admissionDate,
        dischargeDate: admission.dischargeDate || '2025-07-04 08:17:52',
        wardType: admission.wardType,
        bedNumber: admission.bedNumber,
        doctor: admission.doctor,
        stayDuration: stayDays,
        charges: billing.charges,
        payments: billing.payments,
        summary: summary,
        generatedAt: '2025-07-04 08:17:52',
        generatedBy: 'Manish-Arora-9'
    };
}

// Save billing data
function saveBilling(billing) {
    const billings = getAllBillings();
    const index = billings.findIndex(b => b.admissionId === billing.admissionId);
    
    if (index !== -1) {
        billings[index] = billing;
    } else {
        billings.push(billing);
    }
    
    localStorage.setItem('ipd_billings', JSON.stringify(billings));
}