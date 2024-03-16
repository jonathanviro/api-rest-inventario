import { promises as fs } from 'fs';
import path from 'path';
import { descripcionProductos } from '../documents/globales/descripcion-productos.js'

let error = ""
const rutaDirectorioRaiz = process.cwd();
const rutaArchivoConfiguracion = path.join(rutaDirectorioRaiz, 'config.json');

export const obtenerParametrosSistema = async () => {
    if (!(await archivoExiste(rutaArchivoConfiguracion))) {
        throw new Error('El archivo de configuración no existe');
    }

    try {
        const data = await fs.readFile(rutaArchivoConfiguracion, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        throw new Error(`Error al leer el archivo de configuración: ${error}`);
    }
};

const archivoExiste = async (ruta) => {
    try {
        await fs.access(ruta);
        return true;
    } catch (error) {
        return false;
    }
};

const copiarArchivo = async (rutaOrigen, rutaDestino) => {
    const data = await fs.readFile(rutaOrigen, 'utf-8');
    await fs.writeFile(rutaDestino, data, 'utf-8');
    console.log(`Archivo copiado exitosamente a ${rutaDestino}`);
};

const moverArchivo = async (rutaOrigen, rutaDestino) => {
    try {
        await fs.rename(rutaOrigen, rutaDestino);
        console.log(`Archivo movido exitosamente a ${rutaDestino}`);
    } catch (error) {
        console.error(`Error al mover el archivo: ${error}`);
        throw error;
    }
};

const validarInventario = (inventario) => {
    if (!Array.isArray(inventario)) {
        return 'El archivo no contiene una lista válida.';
    }

    for (let i = 0; i < inventario.length; i++) {
        const producto = inventario[i];

        if (typeof producto !== 'object') {
            return `Error en la línea ${i + 1}: El formato del producto no es un objeto.`;
        }

        if (typeof producto.codigoLocal !== 'string' || !/^[a-zA-Z0-9]+$/.test(producto.codigoLocal)) {
            return `Error en la línea ${i + 1}: El formato del campo 'codigoLocal' en el producto no es válido. -> ${JSON.stringify(producto)}`;
        }

        if (typeof producto.codigoProducto !== 'string' || !/^[0-9]+$/.test(producto.codigoProducto)) {
            return `Error en la línea ${i + 1}: El formato del campo 'codigoProducto' en el producto no es válido. -> ${JSON.stringify(producto)}`;
        }

        if (typeof producto.stockProducto !== 'number') {
            return `Error en la línea ${i + 1}: El formato del campo 'stockProducto' en el producto no es válido. -> ${JSON.stringify(producto)}`;
        }
    }

    return 'La lista de inventario es válida.';
};

export const getFechaActual = () => {
    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = ('0' + (fechaActual.getMonth() + 1)).slice(-2);
    const dia = ('0' + fechaActual.getDate()).slice(-2);
    return `${anio}${mes}${dia}`
}

export const getCopiarArchivoInventario = async (codigoLocal, rutaCarpetaCompartida) => {
    if (codigoLocal && rutaCarpetaCompartida) {
        if (rutaCarpetaCompartida) {
            const nombreArchivo = `${codigoLocal}_${getFechaActual()}_stock.js`;
            const rutaCarpetaInventario = path.join(rutaCarpetaCompartida, 'INVENTARIOS');
            const rutaArchivoOrigen = path.join(rutaCarpetaInventario, nombreArchivo);
            const rutaCarpetaDestinoEnProyecto = './src/documents/inventarios-procesados/';
            const rutaCarpetaInventarioProcesado = path.join(rutaCarpetaInventario, 'PROCESADOS');
            
            const rutaArchivoDestinoEnProyecto = path.join(rutaCarpetaDestinoEnProyecto, nombreArchivo);
            const rutaArchivoDestinoRespaldoCliente = path.join(rutaCarpetaInventarioProcesado, nombreArchivo);



            if (await archivoExiste(rutaArchivoOrigen)) {
                await copiarArchivo(rutaArchivoOrigen, rutaArchivoDestinoEnProyecto);
                await moverArchivo(rutaArchivoOrigen, rutaArchivoDestinoRespaldoCliente);
                try {
                    const { inventario: listaProductos } = await import(`../documents/inventarios-procesados/${nombreArchivo}`);
                    const mensajeValidacion = validarInventario(listaProductos);
                    if (mensajeValidacion.includes('Error')) {
                        const error = `Error al leer el archivo ${nombreArchivo}: ${mensajeValidacion}`
                        console.log(error);

                        return {
                            status: 'error',
                            message: error,
                            listaProductos: []
                        }
                    } else {
                        return {
                            status: 'success',
                            error,
                            listaProductos
                        };
                    }
                } catch (e) {
                    const error = `Error al importar el archivo ${nombreArchivo}: ${e.stack}`
                    console.log(error);

                    return {
                        status: 'error',
                        message: error,
                        listaProductos: []
                    }
                }
            } else {
                const error = `No se ha encontrado el archivo ${nombreArchivo} en la ruta ${rutaArchivoOrigen}`
                console.log(error);

                return {
                    status: 'error',
                    message: error,
                    listaProductos: []
                }
            }

        } else {
            return {
                status: 'error',
                message: `Fallo al obtener la configuración de la ruta de la carpeta compartida`,
                listaProductos: []
            }
        }
    } else {
        const error = `No esta configurado el codigo del local. Verifique el archivo de configuración`
        console.log(error);

        return {
            status: 'error',
            message: error,
            listaProductos: []
        }
    }
};

export const getDescripcionProducto = (codigoProducto) => {
    return descripcionProductos.find((obj) => obj.codigoProducto === codigoProducto)
}

export const guardarConsumosEnArchivo = async (esDiaAnterior, consumos) => {
    let fechaActual = new Date()
    if (esDiaAnterior) {
        console.log(`Es Dia Anterior`);
        fechaActual.setDate(fechaActual.getDate() - 1)
    }

    const { codigoLocal, rutaCarpetaCompartida } = await obtenerParametrosSistema()
    if (codigoLocal && rutaCarpetaCompartida) {
        const rutaCarpetaConsumos = path.join(rutaCarpetaCompartida, 'CONSUMO');
        const nombreArchivo = `${codigoLocal}_${getFechaActual()}_consumos.json`;
        const rutaArchivo = path.join(rutaCarpetaConsumos, nombreArchivo);
        try {
            // Verificar si la carpeta de destino existe
            try {
                await fs.access(rutaCarpetaConsumos);
            } catch (error) {
                // Si no existe, crea la carpeta
                await fs.mkdir(rutaCarpetaConsumos, { recursive: true });
            }

            // Escribir el archivo
            await fs.writeFile(rutaArchivo, JSON.stringify(consumos, null, 2), 'utf-8');
            console.log(`Archivo de consumos guardado exitosamente en: ${rutaArchivo}`);
            return {
                status: 'success',
                message: `Archivo de consumos guardado exitosamente en: ${rutaArchivo}`
            };
        } catch (error) {
            console.error(`Error al guardar el archivo de consumos: ${error}`);
            throw error;
        }
    } else {
        return {
            status: 'error',
            message: `Se han encontrado erroes en el archivo de cofiguracion`
        };
    }
};