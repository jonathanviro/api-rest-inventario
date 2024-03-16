import { pool } from "../db.js";
import log from "../helpers/logToFile.js";
import getSystemParams from "../helpers/getSystemParams.js";
import { sendSuccess, sendError } from "../helpers/standarResponse.js";
// import { guardarConsumosEnArchivo } from "../utils/configuracion-deprati.js";

export const createConsumo = async (req, res) => {
  try {
    const consumo = req.body;
    log(`Consumo: ${JSON.stringify(consumo)}`);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const { idInventario, idSesion, tipoJuego, cantidadConsumida, usuarioIngreso } = consumo;
      const query = {
        text: `INSERT into consumos (id_inventario, id_sesion, tipo_juego, cantidad_consumida, es_cerrado, es_activo, usuario_ingreso, fecha_ingreso) VALUES ($1, $2, $3, $4, 'N', 'S', $5, CURRENT_TIMESTAMP)`,
        values: [idInventario, idSesion, tipoJuego, cantidadConsumida, usuarioIngreso],
      };

      await client.query(query);
      await client.query("COMMIT");

      return sendSuccess(res, "Consumo registrado exitosamente");
    } catch (error) {
      await client.query("ROLLBACK");
      return sendError(res, `Error al ingresar consumo: ${error}`);
    } finally {
      client.release();
    }
  } catch (error) {
    return sendError(res, `Error API: ${ error }`);
  }
};

export const updateConsumo = async (req, res) => {
  try {
    const parametros = req.body;
    log(`Parametros: ${JSON.stringify(parametros)}`);

    const { esCerrado, usuarioModificacion, tipoJuego, fecha } = parametros;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      
      const query = {
        text: `UPDATE consumos SET es_cerrado = $1, usuario_modificacion = $2, fecha_modificacion = CURRENT_TIMESTAMP WHERE tipo_juego = $3 AND DATE(fecha_ingreso) = $4 AND es_activo = 'S' AND es_cerrado = 'N'`,
        values: [ esCerrado, usuarioModificacion, tipoJuego, fecha ],
      };

      await client.query(query);
      await client.query("COMMIT");

      return sendSuccess(res, "Consumo actualizado exitosamente");
    } catch (error) {
      await client.query("ROLLBACK");
      return sendError(res, `Error al actualizar consumo: ${error}`);
    } finally {
      client.release();
    }
  } catch (error) {
    return sendError(res, `Error API: ${ error }`);
  }
};


// export const getConsumosByCodigo = async (req, res) => {
//   const { codigoAcceso } = req.query;

//   try {
//     const client = await pool.connect();
//     const query = {
//       text: `SELECT i.codigo_categoria, i.nombre_producto
//                      FROM inventarios i
//                     INNER JOIN consumos c ON i.id_inventario = c.id_inventario
//                     INNER JOIN sesiones s ON c.id_sesion = s.id_sesion
//                     WHERE s.codigo_acceso = $1
//                       AND s.es_activo = 'N'
//                       AND s.factura IS NOT NULL
//                       AND c.es_anulado = 'N';`,
//       values: [codigoAcceso],
//     };

//     const { rows } = await client.query(query);
//     client.release();

//     if (rows.length > 0) {
//       const { codigo_categoria: categoria, nombre_producto: producto } =
//         rows[0];
//       res.status(200).json({
//         status: "success",
//         message: `El premio del código: ${codigoAcceso} es ${producto}`,
//       });
//     } else {
//       res.status(200).json({
//         status: "error",
//         message: `No se ha encontrado un premio asociado al código: ${codigoAcceso}`,
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       status: "error",
//       message: `Error al obtener la lista de productos. Pantalla Girar Ruleta: ${error}`,
//     });
//   }
// };

// export const anularConsumoByCodigoAcceso = async (req, res) => {
//   const { codigoAcceso } = req.query;

//   try {
//     const client = await pool.connect();

//     const queryAnularConsumo = {
//       text: `UPDATE consumos SET es_anulado = 'S', fecha_anulacion = CURRENT_TIMESTAMP
//                     WHERE id_sesion IN ( SELECT id_sesion FROM sesiones WHERE codigo_acceso = $1);`,
//       values: [codigoAcceso],
//     };

//     const { rows } = await client.query(queryAnularConsumo);
//     client.release();

//     return res.status(200).json({
//       status: "success",
//       message: "Consumo anulado",
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: "error",
//       message: `Error al anular consumo. Pantalla Consultar Premio: ${error}`,
//     });
//   }
// };

// export const getArchivoConsumosByFecha = async (req, res) => {
//   const { fecha } = req.query;

//   try {
//     const client = await pool.connect();
//     const queryConsumosHoy = `SELECT * FROM consumos WHERE consumo_enviado = 'S' AND DATE(fecha_ingreso) = CURRENT_DATE`;

//     const { rows: rowsHoy } = await client.query(queryConsumosHoy);

//     if (rowsHoy.length > 0) {
//       res.status(200).json({
//         status: "error",
//         message: `El Consumo del día de hoy ya fue generado y enviado`,
//         listaProductos: [],
//       });
//     } else {
//       const queryConsumos = `SELECT * FROM consumos WHERE consumo_enviado = 'N' AND DATE(fecha_ingreso) = CURRENT_DATE - 1`;
//       const { rows } = await client.query(queryConsumos);

//       if (rows.length > 0) {
//         console.log(`aqui`);
//         const queryConsumosAyer = {
//           text: `SELECT i.codigo_local as "codigoLocal", i.codigo_producto as "codigoProducto", s.factura, c.consumo_producto as "consumoProducto"
//                          FROM inventarios i
//                         INNER JOIN consumos c ON i.id_inventario = c.id_inventario
//                         INNER JOIN sesiones s ON c.id_sesion = s.id_sesion
//                         WHERE DATE(i.fecha_ingreso) = CURRENT_DATE - 1
//                           AND s.factura IS NOT NULL
//                           AND c.es_anulado = 'N'
//                           AND c.consumo_enviado = 'N';`,
//         };

//         const { rows } = await client.query(queryConsumosAyer);
//         const { status, message } = await guardarConsumosEnArchivo(true, rows);

//         if (status === "success") {
//           const updateQuery = `UPDATE consumos SET consumo_enviado = 'S', fecha_envio = CURRENT_TIMESTAMP WHERE DATE(fecha_ingreso) = CURRENT_DATE - 1 `;
//           await client.query(updateQuery);

//           res.status(200).json({
//             status: "success",
//             message,
//             listaProductos: rows,
//           });
//         }
//       } else {
//         const query = {
//           text: "SELECT * FROM inventarios WHERE DATE(fecha_ingreso) = $1::DATE",
//           values: [fecha],
//         };

//         const { rows } = await client.query(query);

//         if (rows.length > 0) {
//           const query = {
//             text: `SELECT i.codigo_local as "codigoLocal", i.codigo_producto as "codigoProducto", s.factura, c.consumo_producto as "consumoProducto"
//                              FROM inventarios i
//                             INNER JOIN consumos c ON i.id_inventario = c.id_inventario
//                             INNER JOIN sesiones s ON c.id_sesion = s.id_sesion
//                             WHERE DATE(i.fecha_ingreso) = $1
//                               AND s.factura IS NOT NULL
//                               AND c.es_anulado = 'N'
//                               AND c.consumo_enviado = 'N';`,
//             values: [fecha],
//           };

//           const { rows } = await client.query(query);
//           const { status, message } = await guardarConsumosEnArchivo(
//             false,
//             rows
//           );

//           if (status === "success") {
//             const updateQuery = {
//               text: `UPDATE consumos SET consumo_enviado = 'S', fecha_envio = CURRENT_TIMESTAMP WHERE DATE(fecha_ingreso) = $1`,
//               values: [fecha],
//             };

//             await client.query(updateQuery);

//             res.status(200).json({
//               status: "success",
//               message,
//               listaProductos: rows,
//             });
//           }
//         } else {
//           res.status(200).json({
//             status: "error",
//             message: "No ha descargado el inventario del día de hoy",
//           });
//         }
//       }
//     }
//     client.release();
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       status: "error",
//       message: `Error al Generar Archivo de Consumo. Pantalla Configuracion: ${error}`,
//     });
//   }
// };