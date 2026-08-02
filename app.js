const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3002;

app.use(express.json());
app.use(express.static('public'));

// Configure where and how uploaded resumes will be stored
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// EMPLOYER ROUTES

app.post('/employers', (req, res) => {
    const { company_name, email } = req.body;

    if (!company_name || !email) {
        return res.status(400).json({ error: 'company_name and email are required' });
    }

    db.run(
        `INSERT INTO employers (company_name, email) VALUES (?, ?)`,
        [company_name, email],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'This email is already registered' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, company_name, email });
        }
    );
});

//  JOB ROUTES 

app.post('/jobs', (req, res) => {
    const { employer_id, title, description, location, salary, job_type } = req.body;

    if (!employer_id || !title || !location) {
        return res.status(400).json({ error: 'employer_id, title, and location are required' });
    }

    db.get(`SELECT * FROM employers WHERE id = ?`, [employer_id], (err, employer) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!employer) {
            return res.status(404).json({ error: 'Employer not found' });
        }

        db.run(
            `INSERT INTO jobs (employer_id, title, description, location, salary, job_type) VALUES (?, ?, ?, ?, ?, ?)`,
            [employer_id, title, description || '', location, salary || '', job_type || ''],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({
                    id: this.lastID,
                    employer_id,
                    title,
                    description,
                    location,
                    salary,
                    job_type
                });
            }
        );
    });
});

app.get('/jobs', (req, res) => {
    const { title, location, job_type } = req.query;

    let query = `SELECT jobs.*, employers.company_name FROM jobs JOIN employers ON jobs.employer_id = employers.id WHERE 1=1`;
    const params = [];

    if (title) {
        query += ` AND jobs.title LIKE ?`;
        params.push(`%${title}%`);
    }
    if (location) {
        query += ` AND jobs.location LIKE ?`;
        params.push(`%${location}%`);
    }
    if (job_type) {
        query += ` AND jobs.job_type = ?`;
        params.push(job_type);
    }

    query += ` ORDER BY jobs.created_at DESC`;

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.get('/jobs/:id', (req, res) => {
    const { id } = req.params;

    db.get(
        `SELECT jobs.*, employers.company_name FROM jobs JOIN employers ON jobs.employer_id = employers.id WHERE jobs.id = ?`,
        [id],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!row) {
                return res.status(404).json({ error: 'Job not found' });
            }
            res.json(row);
        }
    );
});

// CANDIDATE ROUTES

app.post('/candidates', (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'name and email are required' });
    }

    db.run(
        `INSERT INTO candidates (name, email) VALUES (?, ?)`,
        [name, email],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'This email is already registered' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, name, email });
        }
    );
});

// APPLICATION ROUTES

app.post('/jobs/:id/apply', upload.single('resume'), (req, res) => {
    const { id } = req.params;
    const { candidate_id } = req.body;

    if (!candidate_id) {
        return res.status(400).json({ error: 'candidate_id is required' });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'Resume file is required' });
    }

    const resume_path = req.file.path;

    db.get(`SELECT * FROM jobs WHERE id = ?`, [id], (err, job) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        db.get(`SELECT * FROM candidates WHERE id = ?`, [candidate_id], (err, candidate) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!candidate) {
                return res.status(404).json({ error: 'Candidate not found' });
            }

            db.get(
                `SELECT * FROM applications WHERE job_id = ? AND candidate_id = ?`,
                [id, candidate_id],
                (err, existing) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    if (existing) {
                        return res.status(400).json({ error: 'You have already applied for this job' });
                    }

                    db.run(
                        `INSERT INTO applications (job_id, candidate_id, resume_path) VALUES (?, ?, ?)`,
                        [id, candidate_id, resume_path],
                        function (err) {
                            if (err) {
                                return res.status(500).json({ error: err.message });
                            }
                            res.status(201).json({
                                id: this.lastID,
                                job_id: id,
                                job_title: job.title,
                                candidate_id,
                                candidate_name: candidate.name,
                                status: 'Pending',
                                message: 'Application submitted successfully ✅'
                            });
                        }
                    );
                }
            );
        });
    });
});

app.get('/jobs/:id/applications', (req, res) => {
    const { id } = req.params;

    db.all(
        `SELECT applications.*, candidates.name AS candidate_name, candidates.email AS candidate_email
     FROM applications
     JOIN candidates ON applications.candidate_id = candidates.id
     WHERE applications.job_id = ?`,
        [id],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

app.patch('/applications/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Pending', 'Shortlisted', 'Rejected'];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'status must be Pending, Shortlisted, or Rejected' });
    }

    db.run(
        `UPDATE applications SET status = ? WHERE id = ?`,
        [status, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Application not found' });
            }
            res.json({ message: `Application status updated to ${status}` });
        }
    );
});

app.get('/candidates/:id/applications', (req, res) => {
    const { id } = req.params;

    db.all(
        `SELECT applications.*, jobs.title AS job_title, jobs.location
     FROM applications
     JOIN jobs ON applications.job_id = jobs.id
     WHERE applications.candidate_id = ?`,
        [id],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server running at: http://localhost:${PORT}`);
});