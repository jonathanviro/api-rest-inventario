import { Router } from "express";
import { createInventario, updateInventario, getInventarios, getStock, generarReporte} from "../controllers/inventarios.controller.js";

const router = Router();

router.post("/inventarios", createInventario);
// router.patch("/inventarios", updateInventario);
router.patch("/inventarios/:idInventario", updateInventario);

router.get("/inventarios", getInventarios);
router.get("/inventarios/stock", getStock);
router.get("/inventarios/reporte", generarReporte)

// router.get('/inventariosByFecha', getInventariosByFecha);
// router.post('/inventarios', createInventario)
// router.get('/validarExisteInventario', getValidarExisteInventario);
// router.get('/obtenerTotalStockRestante', getTotalStockRestante);

export default router;
