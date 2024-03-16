import { pool } from "../db.js";
import log from "../helpers/logToFile.js";
import getSystemParams from "../helpers/getSystemParams.js";
import { sendSuccess, sendError } from "../helpers/standarResponse.js";
import generateExcel from '../helpers/generateExcel.js';
/*import { obtenerParametrosSistema, getCopiarArchivoInventario, getDescripcionProducto } from '../utils/configuracion-deprati.js'*/

export const createInventario = async (req, res) => {
  try {
    const inventario = req.body;
    // const { codigoLocal } = await getSystemParams();
    const codigoLocal  = 'T0001';

    log(`Inventario: ${JSON.stringify(inventario)}`);

    if (!codigoLocal) {
      return sendError(res, "No se encuentra el parametro");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const element of inventario) {
        const { tipoJuego, codigoCategoria, codigoProducto, nombreProducto, cantidadIngreso, usuarioIngreso} = element;
        const query = {
          text: "INSERT INTO inventarios (tipo_juego, codigo_local, codigo_categoria, codigo_producto, nombre_producto, cantidad_ingreso, cantidad_consumida, cantidad_cierre, usuario_ingreso, es_activo, es_cerrado, fecha_ingreso) VALUES ($1, $2, $3, $4, $5, $6, 0, 0, $7, 'S', 'N', CURRENT_TIMESTAMP)",
          values: [
            tipoJuego,
            codigoLocal,
            codigoCategoria,
            codigoProducto,
            nombreProducto,
            cantidadIngreso,
            usuarioIngreso,
          ],
        };

        await client.query(query);
      }

      await client.query("COMMIT");

      return sendSuccess(
        res,
        "Inventario ingresado exitosamente. Serás redirigido en unos segundos"
      );
    } catch (error) {
      await client.query("ROLLBACK");
      return sendError(res, `Error al ingresar inventario: ${error}`);
    } finally {
      client.release();
    }
  } catch (error) {
    return sendError(res, `Error Sistema: ${error}`);
  }
};

export const updateInventario = async (req, res) => {
  try {
    const parametros = req.body;
    log(`Parametros: ${JSON.stringify(parametros)}`);

    const { esCerrado, usuarioModificacion, tipoJuego, fecha } = parametros;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      
      const lstInventario = await getInventarioByFecha(res, fecha, tipoJuego, 'S', 'N');
      for (const { id_inventario, codigo_local, codigo_producto, cantidad_consumida, cantidad_restante } of lstInventario) {
        const queryUpdateInventario = {
          text: `UPDATE inventarios SET
                        cantidad_consumida = $1,
                        cantidad_cierre = $2,
                        es_cerrado = $3, 
                        usuario_modificacion = $4, 
                        fecha_modificacion = CURRENT_TIMESTAMP 
                  WHERE id_inventario = $5
                    AND codigo_local = $6
                    AND tipo_juego = $7
                    AND codigo_producto = $8
                    AND DATE(fecha_ingreso) = $9
                    AND es_activo = 'S' 
                    AND es_cerrado = 'N'`,
          values: [ cantidad_consumida, cantidad_restante, esCerrado, usuarioModificacion, id_inventario, codigo_local, tipoJuego, codigo_producto, fecha ],
        };

        await client.query(queryUpdateInventario);

        const queryUpdateConsumos = {
          text: `UPDATE consumos SET
                        es_cerrado = $1, 
                        usuario_modificacion = $2, 
                        fecha_modificacion = CURRENT_TIMESTAMP 
                  WHERE id_inventario = $3
                    AND tipo_juego = $4
                    AND DATE(fecha_ingreso) = $5
                    AND es_activo = 'S' 
                    AND es_cerrado = 'N'`,
          values: [ esCerrado, usuarioModificacion, id_inventario, tipoJuego, fecha ],
        };

        await client.query(queryUpdateConsumos);
      };

      await client.query("COMMIT");

      return sendSuccess(res, "Inventario actualizado exitosamente");
    } catch (error) {
      await client.query("ROLLBACK");
      return sendError(res, `Error al actualizar inventario: ${error}`);
    } finally {
      client.release();
    }
  } catch (error) {
    return sendError(res, `Error Sistema: ${ error }`);
  }
};

export const getInventarios = async (req, res) => {
  try {
    const { fecha, tipoJuego, esActivo, esCerrado } = req.query;
    const rows = await getInventarioByFecha(res, fecha, tipoJuego, esActivo, esCerrado);

    if (rows.length > 0) {
      return sendSuccess(res, `Si hay inventario`, rows);
    } else {
      return sendSuccess(res, `No se ha encontrado inventario`, rows);
    }
  } catch (error) {
    return sendError(res, `Error Sistema: ${error}`);
  }
};

export const getStock = async (req, res, fecha) => {
  try {
    const { fecha } = req.query;
    const query = {
      text: `SELECT SUM(cantidad_restante) AS suma_total_cantidad_restante
                    FROM (SELECT i.*, CAST(i.cantidad_ingreso - COALESCE(c.cantidad_consumida, 0) AS INTEGER) AS cantidad_restante
                            FROM inventarios i
                        LEFT JOIN (SELECT id_inventario, COALESCE(SUM(cantidad_consumida), 0) AS cantidad_consumida
                                     FROM consumos
                                    WHERE DATE(fecha_ingreso) = $1::DATE
                                      AND es_activo = 'S'
                                      AND es_cerrado = 'N'
                                    GROUP BY id_inventario) c ON i.id_inventario = c.id_inventario
                        WHERE DATE(i.fecha_ingreso) = $2::DATE
                          AND es_activo = 'S'
                          AND es_cerrado = 'N' ) as subquery;`,
      values: [fecha, fecha],
    };

    const client = await pool.connect();
    try {
      const { rows } = await client.query(query);
      const sumaTotalStockRestante = rows[0].suma_total_cantidad_restante || 0;

      return sendSuccess(
        res,
        `Total stock restante ${ sumaTotalStockRestante }`,
        { stockRestante: sumaTotalStockRestante }
      );
    } catch (error) {
      return sendError(res, `Error al consultar el stock: ${error}`);
    } finally {
      client.release();
    }
  } catch (error) {
    return sendError(res, `Error Sistema`, { error });
  }
};

const getInventarioByFecha = async (res, fecha, tipoJuego, esActivo, esCerrado) => {
  try {
    const query = {
      text: `SELECT i.*,
                    CAST(i.cantidad_ingreso - COALESCE(c.cantidad_consumida, 0) AS INTEGER) AS cantidad_restante,
                    CAST(COALESCE(c.cantidad_consumida, 0) AS INTEGER) AS cantidad_consumida
               FROM inventarios i
               LEFT JOIN (SELECT id_inventario, COALESCE(SUM(cantidad_consumida), 0) AS cantidad_consumida
                           FROM consumos
                          WHERE DATE(fecha_ingreso) = $1::DATE
                            AND tipo_juego = $2
                            AND es_activo = $3
                            AND es_cerrado = COALESCE($4, es_cerrado)
                          GROUP BY id_inventario) c ON i.id_inventario = c.id_inventario
              WHERE DATE(i.fecha_ingreso) = $1::DATE
                AND tipo_juego = $2
                AND es_activo = $3
                AND es_cerrado = COALESCE($4, es_cerrado)
              ORDER BY i.id_inventario;`,
      values: [fecha, tipoJuego, esActivo, esCerrado],
    };

    const client = await pool.connect();
    try {
      const { rows } = await client.query(query);
      return rows;
    } catch (error) {
      return sendError(res, `Error al ingresar inventario: ${error}`);
    } finally {
      client.release();
    }
  } catch (error) {
    return [];
  }
};

export const generarReporte = async (req, res) => {
    try {
      const { fecha, tipoJuego, esActivo, esCerrado } = req.query;
  
      const client = await pool.connect();
      try {
        
        const lstInventario = await getInventarioByFecha(res, fecha, tipoJuego, esActivo, esCerrado);

        if(lstInventario.length === 0){
          return sendSuccess(res, `No se encontro inventario para la fecha indicada: ${ fecha }`);
        }

        const rutaArchivo = await generateExcel(lstInventario, `reporte-${ tipoJuego }-${ fecha }`, fecha, esCerrado)
  
        return sendSuccess(res, `Reporte Excel generado correctamente en ${rutaArchivo}`);
      } catch (error) {
        await client.query("ROLLBACK");
        return sendError(res, `Error al generar reporte de inventario: ${error}`);
      } finally {
        client.release();
      }
    } catch (error) {
      return sendError(res, `Error Sistema: ${ error }`);
    }
  };
  