-- Initial Migration for FC2X
-- Run this SQL in your Neon database to create the users table

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    twitter_user_id VARCHAR(50),
    farcaster_username VARCHAR(100),
    profile_image_url TEXT,
    twitter_access_token TEXT,
    twitter_refresh_token TEXT,
    twitter_token_expires_at TIMESTAMP,
    fid BIGINT,
    twitter_oauth_token VARCHAR(255),
    twitter_oauth_token_secret VARCHAR(255),
    is_online BOOLEAN DEFAULT true,
    signer_uuid VARCHAR(255),
    twitter_username VARCHAR(100),
    display_name VARCHAR(255),
    twitter_access_token_secret TEXT,
    UNIQUE (twitter_user_id)
);



