CREATE DATABASE IF NOT EXISTS github_analyzer;
USE github_analyzer;

CREATE TABLE IF NOT EXISTS github_profiles(
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200),
    bio TEXT,
    company VARCHAR(200),
    location VARCHAR(200),
    email VARCHAR(200),
    blog VARCHAR(300),
    twitter_username VARCHAR(100),
    avatar_url TEXT,
    github_url TEXT,

    public_repos INT DEFAULT 0,
    public_gists INT DEFAULT 0,
    followers INT DEFAULT 0,
    following INT DEFAULT 0,

    total_stars INT DEFAULT 0,
    total_forks INT DEFAULT 0,
    top_language VARCHAR(100),
    languages_used TEXT,
    account_age_days INT DEFAULT 0,
    avg_stars_per_repo DECIMAL(10,2) DEFAULT 0,
    has_readme_profile BOOLEAN DEFAULT FALSE,

    github_score INT DEFAULT 0,
    
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updayed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_username(username),
    INDEX idx_score(github_score DESC),
    INDEX idx_analyzed_at (analyzed_at DESC)

);

CREATE TABLE IF NOT EXISTS top_repositories(
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id INT NOT NULL,
    username VARCHAR(100) NOT NULL,
    repo_name VARCHAR(200) NOT NULL,
    description TEXT,
    language VARCHAR(100),
    stars INT DEFAULT 0,
    forks INT DEFAULT 0,
    watchers INT DEFAULT 0,
    repo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (profile_id) REFERENCES github_profiles(id) ON DELETE CASCADE,
    INDEX idx_profile_id (profile_id)
);