CREATE DATABASE IF NOT EXISTS student_system;
USE student_system;

-- ========= NEW BRANCHES TABLE =========
CREATE TABLE IF NOT EXISTS branches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    branch VARCHAR(100)
);

INSERT INTO branches (branch) VALUES
('CSE'), ('IT'), ('AI&DS'), ('ECE');


-- ========= UPDATED STUDENTS TABLE =========
DROP TABLE IF EXISTS students;

CREATE TABLE students (
    roll VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100),
    branch_id INT,
    course VARCHAR(50),
    attendance INT(3),
    FOREIGN KEY (branch_id) REFERENCES branches(id)
);
