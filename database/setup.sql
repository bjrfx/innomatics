-- Innomatics Recordings Database Setup
-- Run this SQL script in your MySQL database

USE innomatics;

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create recordings table
CREATE TABLE IF NOT EXISTS recordings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    youtube_url VARCHAR(500) NOT NULL,
    youtube_video_id VARCHAR(20) NOT NULL,
    description TEXT,
    duration VARCHAR(20),
    upload_date DATE,
    thumbnail_url VARCHAR(500),
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    INDEX idx_subject_id (subject_id),
    INDEX idx_youtube_video_id (youtube_video_id)
);

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT INTO admin_users (email, username, password, full_name) 
VALUES (
    'kiran.bjrfx1@gmail.com', 
    'kiran2456', 
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- This is hashed 'K143iran'
    'Kiran Admin'
) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert sample subjects
INSERT INTO subjects (name, description, color) VALUES
('Python Programming', 'Complete Python programming course from basics to advanced', '#3776ab'),
('Data Science', 'Data Science and Machine Learning concepts', '#ff6b35'),
('SQL Database', 'SQL queries and database management', '#00758f'),
('Web Development', 'HTML, CSS, JavaScript and frameworks', '#61dafb'),
('Machine Learning', 'ML algorithms and practical implementations', '#ff6f00')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Create view for recordings with subject details
CREATE OR REPLACE VIEW recordings_with_subject AS
SELECT 
    r.id,
    r.title,
    r.youtube_url,
    r.youtube_video_id,
    r.description,
    r.duration,
    r.upload_date,
    r.thumbnail_url,
    r.view_count,
    r.created_at as recording_created_at,
    s.id as subject_id,
    s.name as subject_name,
    s.description as subject_description,
    s.color as subject_color
FROM recordings r
JOIN subjects s ON r.subject_id = s.id
ORDER BY s.name, r.upload_date DESC;