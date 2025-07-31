-- =========================
-- Hospital Management System: PostgreSQL Schema
-- =========================

-- MASTER DATA MODULE

CREATE TABLE staff (
    staff_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(50),
    contact_info JSONB,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE patients (
    patient_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    dob DATE,
    gender VARCHAR(10),
    contact_info JSONB,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_items (
    item_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    quantity INT DEFAULT 0,
    unit VARCHAR(20),
    reorder_level INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE test_catalog (
    test_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- OPD MODULE

CREATE TABLE opd_visits (
    visit_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(patient_id) ON DELETE CASCADE,
    visit_date TIMESTAMP NOT NULL,
    doctor_id INT REFERENCES staff(staff_id),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled'
);

CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id INT REFERENCES staff(staff_id),
    scheduled_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IPD MODULE

CREATE TABLE beds (
    bed_id SERIAL PRIMARY KEY,
    ward VARCHAR(50),
    bed_number VARCHAR(10) NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE
);

CREATE TABLE admissions (
    admission_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(patient_id) ON DELETE CASCADE,
    bed_id INT REFERENCES beds(bed_id),
    admitted_on TIMESTAMP NOT NULL,
    discharged_on TIMESTAMP,
    attending_doctor_id INT REFERENCES staff(staff_id),
    status VARCHAR(20) DEFAULT 'admitted'
);

CREATE TABLE nursing_rounds (
    round_id SERIAL PRIMARY KEY,
    admission_id INT REFERENCES admissions(admission_id) ON DELETE CASCADE,
    nurse_id INT REFERENCES staff(staff_id),
    round_time TIMESTAMP NOT NULL,
    notes TEXT
);

-- LAB TEST MODULE

CREATE TABLE lab_orders (
    order_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(patient_id) ON DELETE CASCADE,
    test_id INT REFERENCES test_catalog(test_id),
    ordered_by INT REFERENCES staff(staff_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ordered'
);

CREATE TABLE lab_results (
    result_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES lab_orders(order_id) ON DELETE CASCADE,
    result_data JSONB,
    result_date TIMESTAMP,
    verified_by INT REFERENCES staff(staff_id),
    quality_check BOOLEAN DEFAULT FALSE
);

-- BILLING MODULE

CREATE TABLE invoices (
    invoice_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(patient_id) ON DELETE CASCADE,
    admission_id INT REFERENCES admissions(admission_id),
    total_amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE insurance_policies (
    policy_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(patient_id) ON DELETE CASCADE,
    provider VARCHAR(100),
    policy_number VARCHAR(50) UNIQUE,
    valid_from DATE,
    valid_to DATE
);

CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    invoice_id INT REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    method VARCHAR(30),
    insurance_policy_id INT REFERENCES insurance_policies(policy_id)
);

-- AUDIT & SECURITY

CREATE TABLE user_accounts (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    staff_id INT REFERENCES staff(staff_id),
    role VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- Indexes & Constraints
-- =========================

CREATE INDEX idx_patient_name ON patients(last_name, first_name);
CREATE INDEX idx_appointment_time ON appointments(scheduled_time);
CREATE INDEX idx_bed_ward ON beds(ward);

-- =========================
-- End of Schema
-- =========================