import { Router } from "express";
import { createSesion, getSesionByCupon } from '../controllers/sesiones.controller.js';

const router = Router()

//Obtener sesion
router.post('/sesiones', createSesion)
router.get('/sesiones/cupon/:cupon', getSesionByCupon)

export default router;