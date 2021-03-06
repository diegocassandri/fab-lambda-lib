const environments = require('./environments');

function parseBody(event) {
    if (typeof event.body === 'string') {
        return JSON.parse(event.body);
    }
    return event.body || {};
}

function createEventInfo(event, environmentData) {
    const environment = getEnvironment(event);
    const development = environment === 'development';
    environmentData = environmentData || environments[environment] || {};

    return {
        environment,
        development,
        production: !development,
        platformUrl: environmentData.basePlatformUrl,
        platformToken: getToken(event, development, environmentData.defaultToken),
        originalEvent: event
    };
}

function getEnvironment(event) {
    return event.environment || (event.development ? 'development' : 'production');
}

function getToken(event, isDevelopment, defaultToken) {
    if (isDevelopment) {
        return defaultToken || environments.development.bearerToken;
    }

    let token;
    if (event.headers) {
        token = event.headers['X-Senior-Token'];
    }

    return token || defaultToken || '';
}

module.exports = {
    parseBody,
    createEventInfo
};
