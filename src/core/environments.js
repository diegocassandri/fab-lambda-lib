const environments = Object.freeze({
    production: {
        basePlatformUrl: 'https://platform.senior.com.br/t/senior.com.br/bridge/1.0/rest'
    },
    homologx: {
        basePlatformUrl: 'https://platform-homologx.senior.com.br/t/senior.com.br/bridge/1.0/rest'
    },
    leaf: {
        basePlatformUrl: 'https://leaf.interno.senior.com.br:8243/t/senior.com.br/bridge/1.0/rest'
    },
    development: {
        basePlatformUrl: 'https://demo4616619.mockable.io',
        bearerToken: 'Bearer 15c2a9eca2e0f3faac36de609c7d05ca'
    }
});

module.exports = environments;
