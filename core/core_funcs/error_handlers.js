'use strict';


function validationErrorMessage({ message, params, instancePath, keyword }, context) {
    if (keyword) {
        if (keyword.toLowerCase() === 'errormessage') {
            return message;
        }

        if (keyword.toLowerCase() === 'required' && context && context.toLowerCase() === 'body' && params && params.missingProperty) {
            return `Missing required property ${params.missingProperty}`;
        }
    }

    let prefix = '';
    if (instancePath && context) {
        if (context === 'params') {
            prefix = instancePath.split('/')[1]?.replace(/^\w/, (c) => c.toUpperCase()) || '';
        } else {
            prefix = instancePath.split('/')[2]?.replace(/^\w/, (c) => c.toUpperCase()) || instancePath.split('/')[1]?.replace(/^\w/, (c) => c.toUpperCase()) || '';
        }
    }

    const paddedPrefix = prefix ? `${prefix} ` : `${context || ""} `;
    let allowedValues = '';
    if (params && Array.isArray(params.allowedValues) && params.allowedValues.length) {
        allowedValues = `: '${params.allowedValues.join("', '")}'`;
    }

    return `${paddedPrefix}${message || 'Something went wrong'}${allowedValues}`;
}

const errorHandler = (error, request, reply) => {
    if (error && error.validation && Array.isArray(error.validation) && error.validation.length) {
        error.validation = Object.values(error.validation.reduce((acc, curr) => {
            if (curr.schemaPath && !acc[curr.schemaPath]) {
                acc[curr.schemaPath] = curr;
            }
            return acc;
        }, {}));
    }

    const body = {
        type: 'error',
        status: error?.status || false,
        code: error?.code || 400,
        statusCode: error?.statusCode || 400,
        message: error.name && error.name.toLowerCase() === 'syntaxerror' ? 'Invalid payload schema' : (Array.isArray(error.validation)
            ? error.validation.map(err => validationErrorMessage(err, error.validationContext)).join(",")
            : error.message || "Unable to read exception"),
        message_ll: error.message_ll || error.message || "Unable to read exception",
        error: error.stack || 'Error'
    };

    reply.type('application/json');

    try {
        reply.code(body.code);
        return reply.send(body);
    } catch (error1) {
        reply.code(400);
        return reply.send(body);
    }
}

function QPerrorParser(error, data = null, statusCode = null, code = null) {
    // Validate and handle the `message` input
    if (typeof error === 'string' && error.trim()) {
        // If `message` is a non-empty string, create a new error
        error = new Error(error);
    }

    // Add optional properties
    if (data) {
        error.data = data instanceof Error
            ? JSON.parse(JSON.stringify(data, Object.getOwnPropertyNames(data)))
            : data;
    }
    if (statusCode) {
        error.statusCode = statusCode;
    }
    if (code) {
        error.code = code;
    }

    // Ensure consistent error structure
    error.name = 'error';
    if (!error.error) {
        error.error = 'error';
    }

    return error;
}

const replyWithErrorMessage = (reply, errorObject, error, dynamicProperties = {}) => {

    if (!errorObject) {
        errorObject = {};
    }

    errorObject.status = false;
    errorObject.type = 'error';
    errorObject.statusCode = errorObject?.statusCode || 400;
    errorObject.message = errorObject.message || 'Something went wrong. Please try again';

    if (Object.keys(dynamicProperties).length > 0) {
        errorObject.dynamicProperties = dynamicProperties;
    }
    const logData = {
        ...errorObject,
        ...parseException(error),
        ...error
    };
    return reply.code(400).send(logData);
}


function replyWithSuccessMessage(reply, result, addOnProperties = {}) {

    const response = {
        status: true,
        success: true,
        count: 1,
        data: result || {},
        type: 'object',
        ...addOnProperties
    }

    if (result && Array.isArray(result)) {
        response.count = result.length;
        response.type = 'array'
    }
    return reply.code(200).send(response);
}

function parseException(error) {
    return {
        exception: error?.message || 'Exception details not available',
        error_stack: error?.stack || ''
    }
}
module.exports = {
    errorHandler,
    QPerrorParser,
    replyWithErrorMessage,
    validationErrorMessage,
    replyWithSuccessMessage
};
