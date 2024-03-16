import app from './app.js';
import { PORT } from './config.js';
import log from './helpers/logToFile.js'

app.listen(PORT);
log(`Escuchando en el puerto ${PORT}`)