CREATE TABLE security_settings (id TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
CREATE TABLE security_rate_limits (id TEXT PRIMARY KEY NOT NULL, scope TEXT NOT NULL, attempts INTEGER NOT NULL, reset_at INTEGER NOT NULL);
CREATE INDEX idx_security_rate_reset ON security_rate_limits(reset_at);
UPDATE sessions SET expires_at=MIN(expires_at,(CAST(strftime('%s','now') AS INTEGER)+2592000)*1000);
UPDATE admin_sessions SET expires_at=MIN(expires_at,(CAST(strftime('%s','now') AS INTEGER)+3600)*1000);

