import sql from '../config/db.js';

const getAllJobs = async () => {
    return await sql`SELECT * FROM jobs`;
};

const getJobById = async (id) => {
    const results = await sql`SELECT * FROM jobs WHERE id = ${id}`;
    return results[0];
};

const createJob = async (jobData) => {
    const result = await sql`
        INSERT INTO jobs 
        (company, logo_url, time_posted, position, description, location) 
        VALUES (
            ${jobData.company}, 
            ${jobData.logo_url}, 
            ${jobData.time_posted}, 
            ${jobData.position}, 
            ${jobData.description}, 
            ${jobData.location}
        )
        RETURNING id
    `;
    return result[0].id;
};

export default {
    getAllJobs,
    getJobById,
    createJob
};