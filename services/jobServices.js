import db from '../config/db.js';

const getAllJobs = () => {
    return new Promise((resolve, reject) => {
        const query = "SELECT * FROM jobs";
        db.query(query, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

const getJobById = (id) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT * FROM jobs WHERE id = ?";
        db.query(query, [id], (err, results) => {
            if (err) return reject(err);
            resolve(results[0]);
        });
    });
};

const createJob = (jobData) => {
    return new Promise((resolve, reject) => {
        const q = `
            INSERT INTO jobs 
            (company, logo_url, time_posted, position, description, location) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [
            jobData.company,
            jobData.logo_url,
            jobData.time_posted,
            jobData.position,
            jobData.description,
            jobData.location
        ];

        db.query(q, values, (err, result) => {
            if (err) return reject(err);
            resolve(result.insertId);
        });
    });
};

export default {
    getAllJobs,
    getJobById,
    createJob
};