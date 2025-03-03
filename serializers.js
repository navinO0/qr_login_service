'use strict';

const R = require('ramda');
const { redactor } = require('./qpf_redactor');
const asyncHooks = require('async_hooks');

const checkIsEmpty = data => (R.isEmpty(data) ? undefined : data);

const requestSerializer = reqSerializer => req => {
    const { ip, headers } = req.raw;

    const reqHeaders = {
        "user-agent": headers["user-agent"],
        origin: headers.origin,
        "qp-language-code": headers["qp-language-code"],
        user_id: headers.user_id,
        citizen_id: headers.citizen_id
    }
    return {
        ...reqSerializer(req),
        ip,
        req_id: req.id,
        aid: asyncHooks.executionAsyncId(),
        ...reqHeaders
    };
};

const responseSerializer = resSerializer => res => {
    const resObj = {
        ...resSerializer(res),
        body: redactor(res.raw.payload)
    };
    return delete resObj.headers, delete resObj.body?.paths, delete resObj.body?.data, resObj;
};

const errorSerializer = error => {
    if (!error || (!error.message && !error.stack)) return {};
    return {
        message: error.message,
        name: error.name,
        description: error.description,
        number: error.number,
        fileName: error.fileName,
        lineNumber: error.lineNumber,
        columnNumber: error.columnNumber,
        statusCode: error.statusCode,
        options: error.options,
        stack: error.stack,
        errorType: error.errorType,
        code: error.code,
        errorData: error.errorData
    };
};

const httpRequestSerializer = options => {
    return {
        body: redactor(options.json || options.form || options.body),
        method: options.method,
        headers: redactor(options.headers),
        url: options.url
    };
};

const httpResponseSerializer = response => {
    return {
        response: {
            statusCode: response.statusCode,
            message: response.statusMessage,
            body: redactor(response.body),
            headers: response.headers,
            timings: response.timings,
            timeTaken: response?.timings?.phases?.total
        },
        request: {
            body: redactor(
                response?.request?.options?.json || redactor(response?.request?.options?.form)
            ),
            method: response.request.options.method,
            headers: redactor(response.request.options.headers),
            url: response.url,
            ip: response.ip
        }
    };
};

const enrichHttpError = error => {
    const errorResponseBody = error?.response?.body;

    /* eslint-disable no-param-reassign */
    error.statusCode = error?.response?.statusCode || error?.code;
    error.name = 'HTTP_STATUS_CODE_ERROR';
    error.responseBody = errorResponseBody;
    error.context = {
        method: error?.options?.method,
        headers: redactor(error?.options?.headers),
        url: error?.request?.requestUrl,
        stack: error?.stack,
        timings: error?.timings,
        timeTaken: error?.timings?.phases?.total
    };
    /* eslint-disable no-param-reassign */

    return error;
};

module.exports = {
    requestSerializer,
    responseSerializer,
    errorSerializer,
    httpRequestSerializer,
    httpResponseSerializer,
    enrichHttpError,
    checkIsEmpty
};
