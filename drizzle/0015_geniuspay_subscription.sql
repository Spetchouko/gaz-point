-- GeniusPay Integration: Vendor Subscriptions and Payment Transactions
-- Migration 0015

-- Vendor Subscription table
CREATE TABLE IF NOT EXISTS vendor_subscription (
    id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'inactive' NOT NULL, -- 'active' | 'inactive' | 'past_due' | 'cancelled'
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancelled_at TIMESTAMP,
    last_payment_at TIMESTAMP,
    last_payment_reference TEXT,
    amount INTEGER DEFAULT 5000 NOT NULL,
    currency TEXT DEFAULT 'XAF' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Payment Transaction table
CREATE TABLE IF NOT EXISTS payment_transaction (
    id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    geniuspay_reference TEXT NOT NULL UNIQUE, -- MTX-XXXXXXXXXX
    geniuspay_id INTEGER,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'XAF' NOT NULL,
    fees INTEGER,
    net_amount INTEGER,
    status TEXT NOT NULL, -- 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'refunded'
    payment_method TEXT,
    payment_provider TEXT,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    checkout_url TEXT,
    success_url TEXT,
    error_url TEXT,
    metadata TEXT, -- JSON string
    environment TEXT NOT NULL, -- 'sandbox' | 'live'
    initiated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP,
    webhook_received_at TIMESTAMP,
    webhook_verified BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for vendor_subscription
CREATE INDEX IF NOT EXISTS vendor_subscription_vendor_id_idx ON vendor_subscription(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_subscription_status_idx ON vendor_subscription(status);

-- Indexes for payment_transaction
CREATE INDEX IF NOT EXISTS payment_transaction_vendor_id_idx ON payment_transaction(vendor_id);
CREATE INDEX IF NOT EXISTS payment_transaction_geniuspay_reference_idx ON payment_transaction(geniuspay_reference);
CREATE INDEX IF NOT EXISTS payment_transaction_status_idx ON payment_transaction(status);
CREATE INDEX IF NOT EXISTS payment_transaction_created_at_idx ON payment_transaction(created_at);

-- Trigger for updated_at on vendor_subscription
CREATE OR REPLACE FUNCTION update_vendor_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vendor_subscription_updated_at ON vendor_subscription;
CREATE TRIGGER trigger_vendor_subscription_updated_at
    BEFORE UPDATE ON vendor_subscription
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_subscription_updated_at();

-- Trigger for updated_at on payment_transaction
CREATE OR REPLACE FUNCTION update_payment_transaction_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_payment_transaction_updated_at ON payment_transaction;
CREATE TRIGGER trigger_payment_transaction_updated_at
    BEFORE UPDATE ON payment_transaction
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_transaction_updated_at();