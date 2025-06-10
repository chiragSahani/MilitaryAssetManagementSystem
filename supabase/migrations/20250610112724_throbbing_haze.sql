-- Military Asset Management System Seed Data

-- Insert bases
INSERT INTO bases (name, code, location) VALUES
('Fort Liberty', 'FL001', 'North Carolina, USA'),
('Camp Pendleton', 'CP002', 'California, USA'),
('Joint Base Andrews', 'JBA003', 'Maryland, USA');

-- Insert asset types
INSERT INTO asset_types (name, category, unit) VALUES
('M4A1 Carbine', 'Weapons', 'piece'),
('M16A4 Rifle', 'Weapons', 'piece'),
('Humvee', 'Vehicles', 'piece'),
('M1 Abrams Tank', 'Vehicles', 'piece'),
('5.56mm Ammunition', 'Ammunition', 'rounds'),
('7.62mm Ammunition', 'Ammunition', 'rounds'),
('Night Vision Goggles', 'Equipment', 'piece'),
('Radio Equipment', 'Communications', 'piece'),
('Body Armor', 'Protection', 'piece'),
('First Aid Kit', 'Medical', 'piece');

-- Insert admin user (password: AdminPass123!)
INSERT INTO users (username, email, password_hash, first_name, last_name, role, base_id) VALUES
('admin', 'admin@military.gov', '$2a$10$YourHashedPasswordHere', 'System', 'Administrator', 'admin', 1);

-- Insert base commanders (password: Commander123!)
INSERT INTO users (username, email, password_hash, first_name, last_name, role, base_id) VALUES
('cmd.liberty', 'commander.fl@military.gov', '$2a$10$YourHashedPasswordHere', 'John', 'Smith', 'base_commander', 1),
('cmd.pendleton', 'commander.cp@military.gov', '$2a$10$YourHashedPasswordHere', 'Sarah', 'Johnson', 'base_commander', 2),
('cmd.andrews', 'commander.jba@military.gov', '$2a$10$YourHashedPasswordHere', 'Michael', 'Davis', 'base_commander', 3);

-- Insert logistics officers (password: Logistics123!)
INSERT INTO users (username, email, password_hash, first_name, last_name, role, base_id) VALUES
('log.liberty', 'logistics.fl@military.gov', '$2a$10$YourHashedPasswordHere', 'Emma', 'Wilson', 'logistics_officer', 1),
('log.pendleton', 'logistics.cp@military.gov', '$2a$10$YourHashedPasswordHere', 'David', 'Brown', 'logistics_officer', 2),
('log.andrews', 'logistics.jba@military.gov', '$2a$10$YourHashedPasswordHere', 'Lisa', 'Taylor', 'logistics_officer', 3);

-- Update base commanders
UPDATE bases SET commander_id = 2 WHERE id = 1;
UPDATE bases SET commander_id = 3 WHERE id = 2;
UPDATE bases SET commander_id = 4 WHERE id = 3;

-- Insert initial asset inventory
INSERT INTO assets (asset_type_id, base_id, quantity, unit_cost, condition) VALUES
-- Fort Liberty
(1, 1, 150, 1200.00, 'excellent'), -- M4A1 Carbines
(2, 1, 75, 1100.00, 'good'), -- M16A4 Rifles
(3, 1, 25, 85000.00, 'good'), -- Humvees
(5, 1, 50000, 0.50, 'excellent'), -- 5.56mm Ammo
(7, 1, 100, 3500.00, 'good'), -- Night Vision
(9, 1, 200, 800.00, 'excellent'), -- Body Armor

-- Camp Pendleton
(1, 2, 200, 1200.00, 'excellent'), -- M4A1 Carbines
(4, 2, 5, 4500000.00, 'excellent'), -- M1 Abrams Tanks
(6, 2, 25000, 0.75, 'excellent'), -- 7.62mm Ammo
(8, 2, 50, 2500.00, 'good'), -- Radio Equipment
(10, 2, 150, 125.00, 'excellent'), -- First Aid Kits

-- Joint Base Andrews
(1, 3, 100, 1200.00, 'good'), -- M4A1 Carbines
(3, 3, 15, 85000.00, 'excellent'), -- Humvees
(5, 3, 30000, 0.50, 'excellent'), -- 5.56mm Ammo
(7, 3, 75, 3500.00, 'excellent'), -- Night Vision
(8, 3, 75, 2500.00, 'excellent'); -- Radio Equipment

-- Insert sample personnel
INSERT INTO personnel (service_number, first_name, last_name, rank, unit, base_id) VALUES
('12345678', 'James', 'Anderson', 'Sergeant', '1st Infantry Division', 1),
('23456789', 'Maria', 'Rodriguez', 'Corporal', '2nd Armored Division', 1),
('34567890', 'Robert', 'Williams', 'Staff Sergeant', '3rd Marines', 2),
('45678901', 'Jennifer', 'Jones', 'Lieutenant', '4th Air Wing', 3),
('56789012', 'Christopher', 'Miller', 'Captain', '5th Special Forces', 1);

-- Insert sample purchases
INSERT INTO purchases (asset_type_id, base_id, quantity, unit_cost, total_cost, supplier, purchase_date, received_date, purchase_order_number, status, created_by) VALUES
(1, 1, 50, 1200.00, 60000.00, 'Colt Defense LLC', '2024-01-15', '2024-01-25', 'PO-2024-001', 'received', 2),
(5, 2, 100000, 0.50, 50000.00, 'Federal Premium', '2024-01-20', '2024-01-30', 'PO-2024-002', 'received', 3),
(3, 3, 5, 85000.00, 425000.00, 'AM General', '2024-02-01', NULL, 'PO-2024-003', 'pending', 4);

-- Insert sample transfers
INSERT INTO transfers (asset_type_id, from_base_id, to_base_id, quantity, transfer_date, status, reason, initiated_by, approved_by) VALUES
(1, 1, 2, 25, '2024-02-15', 'completed', 'Redeployment support', 2, 1),
(7, 3, 1, 15, '2024-02-20', 'in_transit', 'Training exercise requirements', 4, 1);

-- Insert sample assignments
INSERT INTO assignments (asset_type_id, personnel_id, base_id, quantity, assigned_date, status, purpose, assigned_by) VALUES
(1, 1, 1, 1, '2024-01-10', 'active', 'Standard issue weapon', 2),
(7, 2, 1, 1, '2024-01-15', 'active', 'Night operations training', 2),
(1, 3, 2, 1, '2024-02-01', 'active', 'Combat deployment', 3);

-- Insert sample expenditures
INSERT INTO expenditures (asset_type_id, base_id, quantity, expenditure_date, purpose, operation_name, authorized_by, recorded_by, unit_cost, total_cost) VALUES
(5, 1, 5000, '2024-01-25', 'Training Exercise', 'Operation Thunder', 2, 5, 0.50, 2500.00),
(6, 2, 2000, '2024-02-10', 'Live Fire Exercise', 'Operation Storm', 3, 6, 0.75, 1500.00);