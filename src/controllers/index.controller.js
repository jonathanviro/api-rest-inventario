import { pool } from '../db.js';

export const getPing = async (_, res) => {
    try {
        const {rows} = await pool.query("SELECT * FROM inventarios");
        res.json(rows)
    } catch (error) {
        console.log(error);
    }
};