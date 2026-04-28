-- 1. Alter existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_apply INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_limit INTEGER DEFAULT 10;
ALTER TABLE users ADD COLUMN IF NOT EXISTS min_score INTEGER DEFAULT 75;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(255);

-- 2. Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    target_roles TEXT,
    locations TEXT,
    linkedin_cookie TEXT,
    indeed_cookie TEXT,
    CONSTRAINT fk_user_preferences_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_user_preferences_user_id ON user_preferences(user_id);

-- 3. Create job_listings table
CREATE TABLE IF NOT EXISTS job_listings (
    id SERIAL PRIMARY KEY,
    url_hash VARCHAR(255) NOT NULL UNIQUE,
    url TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    platform VARCHAR(50),
    easy_apply VARCHAR(10) DEFAULT 'False',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_job_listings_url_hash ON job_listings(url_hash);

-- 4. Create applications table
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    match_score INTEGER,
    match_reason TEXT,
    skip_reason TEXT,
    cover_letter TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    applied_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_applications_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_applications_job_id FOREIGN KEY (job_id) REFERENCES job_listings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS ix_applications_job_id ON applications(job_id);

-- 5. UPGRADE EXISTING DEPLOYMENT
-- If you already ran the previous script before this Cookie upgrade, just run the following two lines:
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS linkedin_cookie TEXT;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS indeed_cookie TEXT;
