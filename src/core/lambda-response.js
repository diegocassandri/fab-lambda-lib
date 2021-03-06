function success(body) {
    return response(200, body);
}

function internalError(body) {
    return response(417, body, '[FSW-ERROR] ');
}

function validationError(errorMessage) {
    return response(400, errorMessage);
}

function response(statusCode, body, bodyPrefix) {
    const isJsonBody = typeof body === 'object';
    if (isJsonBody) {
        body = JSON.stringify(body);
    }
    if (bodyPrefix) {
        body = `${bodyPrefix}${body}`;
    }

    return {
        statusCode,
        headers: {
            'Content-Type': isJsonBody ? 'application/json' : 'text/plain',
            'X-Senior-FSW': 'Customizacao'
        },
        body
    };
}

module.exports = {
    response,
    success,
    internalError,
    validationError
};
