import { promises as fs } from 'fs';
import path from 'path';

const getSystemParams = async () => {
    try {
        const rutaDirectorioRaiz = process.cwd();
        const rutaArchivoConfiguracion = path.join(rutaDirectorioRaiz, 'config.json');
        const data = await fs.readFile(rutaArchivoConfiguracion, 'utf-8');

        return JSON.parse(data);
    } catch (error) {
        throw new Error(`Error al leer el archivo de configuración: ${error}`);
    }
}

export default getSystemParams