import { pool } from "../db.js";
import log from "../helpers/logToFile.js";
import { sendSuccess, sendError } from "../helpers/standarResponse.js";

export const createSesion = async (req, res) => {
  try {
    const sesion = req.body;

    log(`Sesion: ${JSON.stringify(sesion)}`);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { tipoJuego, codigoAcceso, factura, usuarioIngreso } = sesion;
      const query = {
        text: "INSERT INTO sesiones (tipo_juego , codigo_acceso, factura, es_activo, usuario_ingreso, fecha_ingreso) VALUES ($1, $2, $3, 'S', $4, CURRENT_TIMESTAMP) RETURNING id_sesion",
        values: [tipoJuego, codigoAcceso, factura, usuarioIngreso],
      };

      const { rows: insertedRows } = await client.query(query);
      const idSesion = insertedRows[0].id_sesion;
      await client.query("COMMIT");

      return sendSuccess(res, "Sesion creada", { idSesion });
    } catch (error) {
      await client.query("ROLLBACK");
      return sendError(res, `Error al crear sesion ${error}`);
    } finally {
      client.release();
    }
  } catch (error) {
    return sendError(res, `Error Sistema: ${error}`);
  }
};

export const getSesionByCupon = async (req, res) => {
  try {
    const { cupon } = req.params;
    const sesion = req.body;
    log(`Sesion: ${JSON.stringify(sesion)}`);

    const { tipoJuego, codigoAcceso, factura, usuarioIngreso } = sesion;

    const cuponValido = await validarSesion;

    if (cuponValido) {
      const updateQuery = {
        text: `UPDATE sesiones SET 
                      tipo_juego = $1,
                      factura = $2, 
                      es_usado = 'S', 
                      usuario_ingreso = $3, 
                      fecha_ingreso = CURRENT_TIMESTAMP 
                WHERE codigo_acceso = $4 
            RETURNING id_sesion`,
        values: [tipoJuego, factura, usuarioIngreso, cupon],
      };

      const { rows: updatedRows } = await pool.query(updateQuery);
      const idSesion = updatedRows[0].id_sesion;

      return sendSuccess(res, "Acceso concedido", {
        continuar: true,
        idSesion,
      });
    }

    return sendSuccess(res, "Acceso denegado", {
      continuar: false,
      idSesion,
    });
  } catch (error) {
    return sendError(res, `Error Sistema: ${error}`);
  }
};

const validarSesion = async (res, { idSesion }) => {
  const query = {
    text: `SELECT * FROM sesiones WHERE codigo_acceso = $1 AND es_activo = 'S' AND es_usado = 'N'`,
    values: idSesion,
  };

  const { rows } = await pool.query(query);

  if (rows.length > 0) {
    return true;
  }

  return false;
};
