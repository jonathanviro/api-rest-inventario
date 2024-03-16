import os from 'os';
import path from 'path';
import log from "../helpers/logToFile.js";
import ExcelJS from 'exceljs';

const applyStyles = (cell, isHeader, columnIndex) => {
    cell.font = isHeader ? { bold: true } : {};
    cell.alignment = { horizontal: 'center' };
    if (isHeader && columnIndex <= 4) {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF00' } // Color de fondo amarillo
        };
    }
};

const generateExcel = async (datos, nombreArchivo, fecha, esCerrado) => {
    const rutaDocumentos = path.join(os.homedir(), 'Documents');
    const rutaArchivo = path.join(rutaDocumentos, `/ReportesJuegos/${nombreArchivo}.xlsx`);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventario');

    // Establecer anchos de columna
    worksheet.columns = [
        { width: 50 },
        { width: 25 },
        { width: 25 },
        { width: 25 }
    ];

    worksheet.getCell('B1').value = 'FECHA INGRESO:';
    worksheet.getCell('C1').value = fecha;

    worksheet.getCell('B2').value = 'ESTADO INVENTARIO:';
    worksheet.getCell('C2').value = esCerrado === 'S' ? 'CERRADO' : 'SIN CERRAR';

    worksheet.getCell('B1').font = { bold: true };
    worksheet.getCell('B2').font = { bold: true };

    worksheet.getCell('A5').value = 'NOMBRE PRODUCTO';
    worksheet.getCell('B5').value = 'CANTIDAD INGRESO';
    worksheet.getCell('C5').value = 'CANTIDAD CONSUMIDA';
    worksheet.getCell('D5').value = 'CANTIDAD CIERRE';

    // Congelar la fila del encabezado
    worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 5, topLeftCell: 'A6' }
    ];

    // Aplicar estilos al encabezado
    worksheet.getRow(5).eachCell({ includeEmpty: true }, (cell, colNumber) => {
        applyStyles(cell, true, colNumber);
    });

    // Aplicar estilos al contenido
    datos.forEach(({ nombre_producto, cantidad_ingreso, cantidad_consumida, cantidad_cierre }) => {
        const row = worksheet.addRow([nombre_producto, cantidad_ingreso, cantidad_consumida, cantidad_cierre]);
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            applyStyles(cell, false, colNumber);
        });
    });

    // Guardar el archivo Excel
    await workbook.xlsx.writeFile(rutaArchivo);
    log(`Archivo Excel "${nombreArchivo}" generado correctamente`);
    return rutaArchivo;
};

export default generateExcel;
