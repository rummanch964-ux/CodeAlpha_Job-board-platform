# 💼 Job Board Platform
 
A backend platform connecting employers and job candidates. Employers can post job listings and review applications, while candidates can search for jobs, apply with a resume upload, and track their application status.
 
## Features
 
- Employer registration and job posting
- Candidate registration
- Job search with filters (title, location, job type)
- Apply for jobs with resume upload (via Multer)
- Duplicate application prevention
- Application status tracking (Pending / Shortlisted / Rejected)
- Employer view of all applicants for a job
- Candidate view of their submitted applications
- Simple, tabbed web interface
## Tech Stack
 
- **Backend:** Node.js, Express.js
- **Database:** SQLite
- **File Uploads:** Multer
- **Frontend:** HTML, CSS, JavaScript (vanilla)
## Project Structure
 
```
job-board/
├── public/
│   └── index.html            # Frontend UI
├── uploads/                     # Uploaded resumes (not tracked in git)
├── app.js                     # Express server and routes
├── db.js                      # Database connection and schema
├── package.json
└── jobboard.db                  # SQLite database (generated at runtime)
```
 
## Database Schema
 
**employers**
| Column        | Type    | Description         |
|---------------|---------|----------------------|
| id            | INTEGER | Primary key          |
| company_name  | TEXT    | Employer's company    |
| email         | TEXT    | Unique employer email |
 
**jobs**
| Column        | Type    | Description                     |
|---------------|---------|-----------------------------------|
| id            | INTEGER | Primary key                       |
| employer_id   | INTEGER | Foreign key → employers.id        |
| title         | TEXT    | Job title                         |
| description   | TEXT    | Job description                   |
| location      | TEXT    | Job location                      |
| salary        | TEXT    | Salary range                      |
| job_type      | TEXT    | Full-time / Part-time / Remote / Internship |
 
**candidates**
| Column | Type    | Description             |
|--------|---------|---------------------------|
| id     | INTEGER | Primary key               |
| name   | TEXT    | Candidate's full name      |
| email  | TEXT    | Unique candidate email     |
 
**applications**
| Column        | Type    | Description                          |
|---------------|---------|----------------------------------------|
| id            | INTEGER | Primary key                            |
| job_id        | INTEGER | Foreign key → jobs.id                   |
| candidate_id  | INTEGER | Foreign key → candidates.id             |
| resume_path   | TEXT    | Path to the uploaded resume file        |
| status        | TEXT    | Pending / Shortlisted / Rejected (default: Pending) |
 
## API Endpoints
 
| Method | Endpoint                          | Description                                   |
|--------|-------------------------------------|--------------------------------------------------|
| POST   | `/employers`                       | Register a new employer                          |
| POST   | `/jobs`                            | Post a new job                                    |
| GET    | `/jobs`                            | List jobs (supports `title`, `location`, `job_type` filters) |
| GET    | `/jobs/:id`                        | Get details of a single job                       |
| POST   | `/candidates`                      | Register a new candidate                           |
| POST   | `/jobs/:id/apply`                  | Apply for a job (multipart form, includes resume)  |
| GET    | `/jobs/:id/applications`           | List all applications for a job (employer view)    |
| PATCH  | `/applications/:id`                | Update an application's status                     |
| GET    | `/candidates/:id/applications`     | List all applications by a candidate                |
 
### Example: Search Jobs with Filters
 
```
GET /jobs?location=Lahore&job_type=Full-time
```
 
### Example: Apply for a Job
 
Sent as `multipart/form-data`:
```
candidate_id: 3
resume: <file>
```
 
## Setup & Installation
 
1. Clone the repository
```
   git clone https://github.com/rummanch964-ux/job-board-platform.git
   cd job-board-platform
```
2. Install dependencies
```
   npm install
```
3. Create the uploads folder (if not already present)
```
   mkdir uploads
```
4. Start the server
```
   node app.js
```
5. Open in browser
```
   http://localhost:3002
```
 
## Notes
 
This project was built as part of a backend development internship task.
 
