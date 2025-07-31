ALTER TABLE patients
  ADD COLUMN registration_date DATE,
  ADD COLUMN blood_group VARCHAR(10),
  ADD COLUMN city VARCHAR(100),
  ADD COLUMN state VARCHAR(100),
  ADD COLUMN pincode VARCHAR(20),
  ADD COLUMN allergies TEXT,
  ADD COLUMN chronic_diseases TEXT,
  ADD COLUMN medications TEXT,
  ADD COLUMN emergency_name VARCHAR(100),
  ADD COLUMN emergency_relation VARCHAR(50),
  ADD COLUMN emergency_phone VARCHAR(20),
  ADD COLUMN age INT;