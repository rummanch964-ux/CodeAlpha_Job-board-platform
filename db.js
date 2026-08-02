const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./jobboard.db', (err) => {
    if (err) {
        console.error('Database error:', err.message);
    } else {
        console.log('Database connected successfully');
    }
});

// Employers table
db.run(`
  CREATE TABLE IF NOT EXISTS employers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Jobs table
db.run(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employer_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    salary TEXT,
    job_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employer_id) REFERENCES employers(id)
  )
`);

// Candidates table
db.run(`
  CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Applications table
db.run(`
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    candidate_id INTEGER NOT NULL,
    resume_path TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id)
  )
`);

module.exports = db;