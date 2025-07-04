// Constants for discharge
const DISCHARGE_TYPES = {
    'Normal': 'Regular discharge with doctor\'s approval',
    'LAMA': 'Left against medical advice',
    'Referred': 'Referred to another facility',
    'Expired': 'Death of patient'
};

// Initialize discharge process
function initializeDischarge(admissionId) {
    const admission = getAdmission(admissionId);
    if (!admission) return;

    const billing = getBilling(admissionId);
    const summary = calculateBillSummary(billing);

    return {
        admissionId: admissionId,
        uhid: admission.uhid,
        patientName: admission.patientName,
        admissionDate: admission.admissionDate,
        stayDuration: calculateStayDays(admission.admissionDate),
        billing: summary,
        status: 'Initiated',
        createdAt: '2025-07-04 08:17:52',
        createdBy: 'Manish-Arora-9'
    };
}

// Show discharge modal
function showDischargeModal(admissionId) {
    const discharge = initializeDischarge(admissionId);
    if (!discharge) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'dischargeModal';
    
    modal.innerHTML = `
        <div class="modal-content modal-lg">
            <div class="modal-header">
                <h2>Patient Discharge</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="dischargeForm">
                    <input type="hidden" id="dischargeAdmissionId" value="${admissionId}">
                    
                    <!-- Patient Information -->
                    <div class="form-section">
                        <h3>Patient Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Patient Name</label>
                                <div>${discharge.patientName}</div>
                            </div>
                            <div class="info-item">
                                <label>UHID</label>
                                <div>${discharge.uhid}</div>
                            </div>
                            <div class="info-item">
                                <label>Admission Date</label>
                                <div>${formatDateTime(discharge.admissionDate)}</div>
                            </div>
                            <div class="info-item">
                                <label>Stay Duration</label>
                                <div>${discharge.stayDuration} days</div>
                            </div>
                        </div>
                    </div>

                    <!-- Billing Summary -->
                    <div class="form-section">
                        <h3>Billing Summary</h3>
                        <div class="billing-grid">
                            <div class="billing-item">
                                <label>Total Charges</label>
                                <div>₹${discharge.billing.totalCharges.toFixed(2)}</div>
                            </div>
                            <div class="billing-item">
                                <label>Total Payments</label>
                                <div>₹${discharge.billing.totalPayments.toFixed(2)}</div>
                            </div>
                            <div class="billing-item highlight">
                                <label>Balance Amount</label>
                                <div>₹${discharge.billing.balance.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Discharge Details -->
                    <div class="form-section">
                        <h3>Discharge Details</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="dischargeDate">Discharge Date *</label>
                                <input type="datetime-local" id="dischargeDate" required>
                            </div>
                            <div class="form-group">
                                <label for="dischargeType">Discharge Type *</label>
                                <select id="dischargeType" required>
                                    ${Object.entries(DISCHARGE_TYPES).map(([key, value]) => 
                                        `<option value="${key}">${key} - ${value}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="dischargeSummary">Discharge Summary *</label>
                            <textarea id="dischargeSummary" rows="4" required></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="dischargeInstructions">Discharge Instructions *</label>
                            <textarea id="dischargeInstructions" rows="4" required></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="followupDate">Follow-up Date</label>
                                <input type="date" id="followupDate">
                            </div>
                            <div class="form-group">
                                <label for="followupDoctor">Follow-up Doctor</label>
                                <select id="followupDoctor">
                                    <option value="">Select Doctor</option>
                                    ${Object.values(DOCTORS_BY_DEPT).flat().map(doctor => 
                                        `<option value="${doctor.id}">${doctor.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            Complete Discharge
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="closeDischargeModal()">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('dischargeDate').value = new Date().toISOString().slice(0, 16);
    
    // Add event listeners
    modal.querySelector('.close').onclick = closeDischargeModal;
    document.getElementById('dischargeForm').onsubmit = processDischarge;
}

// Process discharge
async function processDischarge(e) {
    e.preventDefault();
    
    const admissionId = document.getElementById('dischargeAdmissionId').value;
    const admission = getAdmission(admissionId);
    if (!admission) return;

    // Collect discharge data
    const dischargeData = {
        admissionId: admissionId,
        dischargeDate: document.getElementById('dischargeDate').value,
        dischargeType: document.getElementById('dischargeType').value,
        dischargeSummary: document.getElementById('dischargeSummary').value,
        dischargeInstructions: document.getElementById('dischargeInstructions').value,
        followupDate: document.getElementById('followupDate').value,
        followupDoctor: document.getElementById('followupDoctor').value,
        status: 'Completed',
        createdAt: '2025-07-04 08:17:52',
        createdBy: 'Manish-Arora-9'
    };

    try {
        // Update admission status
        admission.status = 'Discharged';
        admission.dischargeDate = dischargeData.dischargeDate;
        admission.updatedAt = '2025-07-04 08:17:52';
        
        // Save discharge summary
        saveDischarge(dischargeData);
        
        // Update bed status
        updateBedStatus(admission.bedNumber, 'Available');
        
        // Generate final bill
        const finalBill = generateDetailedBill(admissionId);
        
        // Update admission
        saveAdmission(admission);
        
        // Close modal and refresh view
        closeDischargeModal();
        loadCurrentPatients();
        updateBedStatistics();
        
        // Show success message
        showAlert('Patient discharged successfully', 'success');
        
        // Print discharge summary
        printDischargeSummary(dischargeData, finalBill);
        
    } catch (error) {
        showAlert('Error processing discharge: ' + error.message, 'error');
    }
}

// Save discharge data
function saveDischarge(discharge) {
    const discharges = JSON.parse(localStorage.getItem('ipd_discharges') || '[]');
    discharges.push(discharge);
    localStorage.setItem('ipd_discharges', JSON.stringify(discharges));
}

// Print discharge summary
function printDischargeSummary(discharge, bill) {
    const admission = getAdmission(discharge.admissionId);
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Discharge Summary - ${admission.patientName}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .section { margin-bottom: 20px; }
                .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
                .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .footer { margin-top: 50px; }
                @media print {
                    .no-print { display: none; }
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Hospital Management System</h1>
                <h2>Discharge Summary</h2>
            </div>

            <div class="section">
                <h3>Patient Information</h3>
                <div class="grid">
                    <div>Patient Name: ${admission.patientName}</div>
                    <div>UHID: ${admission.uhid}</div>
                    <div>Age/Gender: ${admission.age} years/${admission.gender}</div>
                    <div>Admission ID: ${admission.admissionId}</div>
                    <div>Admission Date: ${formatDateTime(admission.admissionDate)}</div>
                    <div>Discharge Date: ${formatDateTime(discharge.dischargeDate)}</div>
                    <div>Stay Duration: ${calculateStayDays(admission.admissionDate)} days</div>
                    <div>Ward/Bed: ${admission.wardType}/${admission.bedNumber}</div>
                </div>
            </div>

            <div class="section">
                <h3>Clinical Information</h3>
                <p><strong>Diagnosis:</strong> ${admission.diagnosis}</p>
                <p><strong>Discharge Type:</strong> ${discharge.dischargeType}</p>
                <p><strong>Discharge Summary:</strong> ${discharge.dischargeSummary}</p>
                <p><strong>Discharge Instructions:</strong> ${discharge.dischargeInstructions}</p>
            </div>

            <div class="section">
                <h3>Follow-up Details</h3>
                <p><strong>Follow-up Date:</strong> ${discharge.followupDate || 'Not specified'}</p>
                <p><strong>Follow-up Doctor:</strong> ${discharge.followupDoctor || 'Not specified'}</p>
            </div>

            <div class="section">
                <h3>Billing Summary</h3>
                <table class="table">
                    <tr>
                        <th>Description</th>
                        <th>Amount</th>
                    </tr>
                    ${Object.entries(bill.summary.categories).map(([category, amount]) => `
                        <tr>
                            <td>${category}</td>
                            <td>₹${amount.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                    <tr>
                        <th>Total Charges</th>
                        <td>₹${bill.summary.totalCharges.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <th>Total Payments</th>
                        <td>₹${bill.summary.totalPayments.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <th>Balance Amount</th>
                        <td>₹${bill.summary.balance.toFixed(2)}</td>
                    </tr>
                </table>
            </div>

            <div class="footer">
                <p>Discharge Summary generated by: ${discharge.createdBy}</p>
                <p>Generated on: ${formatDateTime(discharge.createdAt)}</p>
            </div>

            <div class="no-print" style="margin-top: 20px; text-align: center;">
                <button onclick="window.print()">Print</button>
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();
}