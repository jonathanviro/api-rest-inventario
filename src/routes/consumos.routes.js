import { Router } from "express";
import { createConsumo, updateConsumo/*, getConsumosByCodigo, getArchivoConsumosByFecha, anularConsumoByCodigoAcceso*/ } from '../controllers/consumos.controller.js';

const router = Router()

router.post('/consumos', createConsumo);
router.patch('/consumos', updateConsumo);
// router.get('/consumosByCodigo', getConsumosByCodigo);
// router.get('/generarArchivoConsumosByFecha', getArchivoConsumosByFecha);
// router.get('/anularConsumoByCodigoAcceso', anularConsumoByCodigoAcceso);

export default router;