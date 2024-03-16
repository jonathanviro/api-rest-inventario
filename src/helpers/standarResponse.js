import log from '../helpers/logToFile.js'

export const sendSuccess = (res, message, data) => {
    log(message);
    return res.status(200).json({
        status: 'success',
        message,
        data,
    });
}

export const sendError = (res, message) => {
    log(message);
    return res.status(500).json({
        status: 'error',
        message,
    });
}