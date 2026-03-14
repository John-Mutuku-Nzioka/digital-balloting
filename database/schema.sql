CREATE DATABASE IF NOT EXISTS digital_balloting;
USE digital_balloting;


CREATE TABLE admins (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE voters (
  voter_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  reg_number VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  otp_code VARCHAR(10),
  otp_expires_at DATETIME,
  voted_flag TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE elections (
  election_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  status ENUM('created','active','closed','archived') DEFAULT 'created',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(admin_id)
);


CREATE TABLE positions (
  position_id INT AUTO_INCREMENT PRIMARY KEY,
  election_id INT NOT NULL,
  position_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (election_id) REFERENCES elections(election_id) ON DELETE CASCADE
);


CREATE TABLE candidates (
  candidate_id INT AUTO_INCREMENT PRIMARY KEY,
  position_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (position_id) REFERENCES positions(position_id) ON DELETE CASCADE
);


CREATE TABLE votes (
  vote_id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  election_id INT NOT NULL,
  position_id INT NOT NULL,
  encrypted_vote TEXT NOT NULL,
  cast_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (election_id) REFERENCES elections(election_id),
  FOREIGN KEY (position_id) REFERENCES positions(position_id)
);


CREATE TABLE audit_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  user_type ENUM('admin','voter') NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_election_id ON positions(election_id);
CREATE INDEX idx_position_id ON candidates(position_id);
CREATE INDEX idx_votes_election ON votes(election_id);