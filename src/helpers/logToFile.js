import fs from 'fs';
import getSystemParams from './getSystemParams.js';
import getToday from './getToday.js';

const logToFile = async (message) => {
    try {
        // const { rutaLog } = await getSystemParams();
        // const logFilePath = `${rutaLog}/log-${getToday()}.log`;

        // const now = new Date();
        // const options = {
        //     year: 'numeric',
        //     month: '2-digit',
        //     day: '2-digit',
        //     hour: '2-digit',
        //     minute: '2-digit',
        //     second: '2-digit',
        //     fractionalSecondDigits: 3,
        //     hour12: false,
        // };
        // const timestamp = now.toLocaleString('es-ES', options);
        // const logMessage = `${timestamp}: ${message}\n`;
        // console.log(logMessage)
        console.log(message)


        // await fs.promises.access(logFilePath, fs.constants.F_OK)
        //     .catch(async () => {
        //         // El archivo no existe, así que lo creamos
        //         await fs.promises.writeFile(logFilePath, '');
        //     });

        // await fs.promises.appendFile(logFilePath, logMessage);
    } catch (error) {
        console.error('Error al escribir en el archivo de log:', error);
    }
};

export default logToFile;
