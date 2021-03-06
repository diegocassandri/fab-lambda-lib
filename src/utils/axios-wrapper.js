const handleSuccess = response => response.data;

const handleError = responseError => {
    const msg = `Não foi possível realizar requisição: ${responseError}`;
    console.log(msg);
    return Promise.reject(responseError);
};

const responseErrorUrlDetailHandler = url =>
    responseError => {
        const msg = `Não foi possível realizar requisição para a: ${responseError}`;
        console.log(msg);
        return Promise.reject({
            ...responseError,
            toString() {
                return `${msg}.\nResponse: ${JSON.stringify(responseError.response.data)}`;
            }
        });
    };


class AxiosWrapper {

    constructor(axios) {
        this._axios = axios;
    }

    platformGet(event, uri, config) {
        return this.get(`${event.platformUrl}${uri}`, this._configToken(event, config));
    }

    platformDelete(event, uri, config) {
        return this.delete(`${event.platformUrl}${uri}`, this._configToken(event, config));
    }

    platformHead(event, uri, config) {
        return this.head(`${event.platformUrl}${uri}`, this._configToken(event, config));
    }

    platformPost(uri, event, data, config) {
        return this.post(`${event.platformUrl}${uri}`, data, this._configToken(event, config));
    }

    platformPut(uri, event, data, config) {
        return this.put(`${event.platformUrl}${uri}`, data, this._configToken(event, config));
    }

    platformPatch(uri, event, data, config) {
        return this.patch(`${event.platformUrl}${uri}`, data, this._configToken(event, config));
    }

    get(url, config) {
        return this.doWithRequest(url, this._axios.get(url, config));
    }

    delete(url, config) {
        return this.doWithRequest(url, this._axios.delete(url, config));
    }

    head(url, config) {
        return this.doWithRequest(url, this._axios.head(url, config));
    }

    post(url, data, config) {
        return this.doWithRequest(url, this._axios.post(url, data, config));
    }

    put(url, data, config) {
        return this.doWithRequest(url, this._axios.put(url, data, config));
    }

    patch(url, data, config) {
        return this.doWithRequest(url, this._axios.patch(url, data, config));
    }

    doWithRequest(url, requestPromise) {
        return requestPromise
            .then(handleSuccess)
            .catch(responseErrorUrlDetailHandler(url));
    }

    _configToken(event, config) {
        config = config || {};

        if (!config.headers) {
            config.headers = {};
        }

        if (!config.headers['Authorization'] && event.platformToken) {
            config.headers['Authorization'] = event.platformToken;
        }

        return config;
    }

}

AxiosWrapper.handleSuccess = handleSuccess;
AxiosWrapper.handleError = handleError;

module.exports = AxiosWrapper;
