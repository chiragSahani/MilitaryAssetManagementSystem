-- Military Asset Management System Database Schema

-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'base_commander', 'logistics_officer')),
    base_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bases table
CREATE TABLE IF NOT EXISTS bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    location VARCHAR(200),
    commander_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset types table
CREATE TABLE IF NOT EXISTS asset_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assets inventory table
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    asset_type_id INTEGER NOT NULL,
    base_id INTEGER NOT NULL,
    serial_number VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_cost DECIMAL(12,2),
    condition VARCHAR(20) DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_type_id) REFERENCES asset_types(id),
    FOREIGN KEY (base_id) REFERENCES bases(id)
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    asset_type_id INTEGER NOT NULL,
    base_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    supplier VARCHAR(200),
    purchase_date DATE NOT NULL,
    received_date DATE,
    purchase_order_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'received', 'cancelled')),
    created_by INTEGER NOT NULL,
    approved_by INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_type_id) REFERENCES asset_types(id),
    FOREIGN KEY (base_id) REFERENCES bases(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Transfers table
CREATE TABLE IF NOT EXISTS transfers (
    id SERIAL PRIMARY KEY,
    asset_type_id INTEGER NOT NULL,
    from_base_id INTEGER NOT NULL,
    to_base_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    transfer_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
    reason TEXT,
    initiated_by INTEGER NOT NULL,
    approved_by INTEGER,
    received_by INTEGER,
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (asset_type_id) REFERENCES asset_types(id),
    FOREIGN KEY (from_base_id) REFERENCES bases(id),
    FOREIGN KEY (to_base_id) REFERENCES bases(id),
    FOREIGN KEY (initiated_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
);

-- Personnel table (for assignments)
CREATE TABLE IF NOT EXISTS personnel (
    id SERIAL PRIMARY KEY,
    service_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    rank VARCHAR(50) NOT NULL,
    unit VARCHAR(100),
    base_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (base_id) REFERENCES bases(id)
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    asset_type_id INTEGER NOT NULL,
    personnel_id INTEGER NOT NULL,
    base_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    assigned_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'returned', 'lost', 'damaged')),
    purpose TEXT,
    assigned_by INTEGER NOT NULL,
    serial_numbers TEXT[], -- Array of serial numbers
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_type_id) REFERENCES asset_types(id),
    FOREIGN KEY (personnel_id) REFERENCES personnel(id),
    FOREIGN KEY (base_id) REFERENCES bases(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- Expenditures table
CREATE TABLE IF NOT EXISTS expenditures (
    id SERIAL PRIMARY KEY,
    asset_type_id INTEGER NOT NULL,
    base_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    expenditure_date DATE NOT NULL,
    purpose VARCHAR(200) NOT NULL,
    operation_name VARCHAR(100),
    authorized_by INTEGER NOT NULL,
    recorded_by INTEGER NOT NULL,
    unit_cost DECIMAL(12,2),
    total_cost DECIMAL(12,2),
    justification TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_type_id) REFERENCES asset_types(id),
    FOREIGN KEY (base_id) REFERENCES bases(id),
    FOREIGN KEY (authorized_by) REFERENCES users(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- API logs table for audit trail
CREATE TABLE IF NOT EXISTS api_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    endpoint VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_body JSONB,
    response_status INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_users_base FOREIGN KEY (base_id) REFERENCES bases(id);
ALTER TABLE bases ADD CONSTRAINT fk_bases_commander FOREIGN KEY (commander_id) REFERENCES users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assets_base_id ON assets(base_id);
CREATE INDEX IF NOT EXISTS idx_assets_asset_type_id ON assets(asset_type_id);
CREATE INDEX IF NOT EXISTS idx_purchases_base_id ON purchases(base_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_transfers_from_base ON transfers(from_base_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_base ON transfers(to_base_id);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers(created_at);
CREATE INDEX IF NOT EXISTS idx_assignments_base_id ON assignments(base_id);
CREATE INDEX IF NOT EXISTS idx_assignments_personnel_id ON assignments(personnel_id);
CREATE INDEX IF NOT EXISTS idx_expenditures_base_id ON expenditures(base_id);
CREATE INDEX IF NOT EXISTS idx_expenditures_expenditure_date ON expenditures(expenditure_date);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at);