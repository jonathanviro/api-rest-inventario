import 'dotenv/config'
import pkg from 'pg'
import log from './helpers/logToFile.js'

const { Pool } = pkg;

export const pool = new Pool({
    allowExitOnIdle: true,
})

try {
    await pool.query('SELECT NOW()')
    log("Base de Datos Conectada")
} catch (error) {
    log(error)
}