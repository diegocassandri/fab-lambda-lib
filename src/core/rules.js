/**
 * Executor de regras de validação com execução assíncrona.
 *
 * Possui dois métodos principais para validação:
 * - {@link AsyncRuleValidator#validate}
 * - {@link AsyncRuleValidator#validateOneByOne}
 *
 * As regras de validação precisam obedecer à seguinte interface:
 * {@code
 * function (body, event) {
 *     return 'Mensagem de erro';
 * }
 * // Ou
 * function (body, event) {
 *     return ['Uma mensagem de erro', 'Outra mensagem de erro'];
 * }
 * // Ou
 * async function (body, event) {
 *     return 'Mensagem de erro';
 * }
 * }
 *
 * Onde o parâmetro 'body' é o payload da requisição convertido no formato
 * objeto JSON e 'event' é o objeto de evento original da função lambda.
 *
 * Cada regra de validação pode ser síncrona ou assíncrona, entretanto,
 * a execução sempre será assíncrona.
 *
 * @author Luiz.Nazari
 */
class AsyncRuleValidator {

    /**
     * Executor de regras de validação com execução assíncrona.
     *
     * @param {*} body o payload da requisição convertido no formato objeto JSON
     * @param {*} eventInfo objeto com informações sobre a execução do evento
     */
    constructor(body, eventInfo) {
        this._body = body;
        this._eventInfo = eventInfo;
        this._requireFunction = requireRuleValidationFunction;
    }

    /**
     * Atribui a função para carregra as regras.
     *
     * Exemplo:
     * {@code
     * function requireRuleValidationFunction(rule) {
     *     if (typeof rule === 'string') {
     *         return require(`src/rules/${rule}`);
     *     }
     *     return rule;
     * }
     * }
     *
     * @param {*} requireFunction a função para carregar as regras
     */
    withRequireRulefunction(requireFunction) {
        this._requireFunction = requireFunction;
        return this;
    }

    /**
     * Executa uma série de regras de validação de forma assíncrona.
     *
     * Cada regra de validação pode ser síncrona ou assíncrona, entretanto,
     * a execução sempre será assíncrona, ou seja, as regras serão executadas
     * ao mesmo tempo, e o resultado será apresentado apenas quando todas as
     * regras terminarem sua execução.
     *
     * Aceita dois formatos de parâmetros:
     *
     * 1) O nome da regra. Nesse caso, a regra será carregada de um arquivo
     * no diretório fixo 'src/rules'. Por exeplo: 'rf01' será requerido do
     * arquivo 'src/rules/rf01.js'. O arquivo da regra deve obedecer a arquitetura
     * de módulos, exportando a função para validação:
     * {@code module.exports = async (body, event) => {} }
     *
     * 2) A função para execução das regras, podendo conter zero, um ou dois
     * parâmetros e retornar uma mensagem ou uma {@link Promise}.
     *
     * Exemplo:
     * {@code
     * asyncRuleValidator
     *   .validate([
     *       'rf01',
     *       () => 'Mensagem de erro',
     *       async (body, event) => ... ,
     *       function (body) {  ...  }
     *   ]).then(...);
     * }
     *
     * @param {*} rules lista das regras de validação, onde cada elemento pode
     *             ser uma string com o nome da regra ou uma função.
     * @returns uma Promise contendo o ValidationResult de todas as regras.
     * @see AsyncRuleValidator#validateOneByOne
     */
    validate(rules) {
        return Promise
            .all(this._executeValidationRulesAsync(rules))
            .then(this._concatAllValidationResultErrors);
    }

    /**
     * Executa uma série de regras de validação, mas executando uma por vez.
     *
     * Cada regra de validação pode ser síncrona ou assíncrona, entretanto,
     * a execução sempre terá comportamento síncrono. A primeira regra que
     * retornar uma mensagem de validação excerrará a execução da cadeia de
     * regras.
     *
     * Aceita dois formatos de parâmetros:
     *
     * 1) O nome da regra. Nesse caso, a regra será carregada de um arquivo
     * no diretório fixo 'src/rules'. Por exeplo: 'rf01' será requerido do
     * arquivo 'src/rules/rf01.js'. O arquivo da regra deve obedecer a arquitetura
     * de módulos, exportando a função para validação:
     * {@code module.exports = async (body, event) => {} }
     *
     * 2) A função para execução das regras, podendo conter zero, um ou dois
     * parâmetros e retornar uma mensagem ou uma {@link Promise}.
     *
     * Exemplo:
     * {@code
     * asyncRuleValidator
     *   .validateOneByOne([
     *       'rf01',
     *       () => 'Mensagem de erro',
     *       async (body, event) => ... ,
     *       function (body) {  ...  }
     *   ]).then(...);
     * }
     *
     * @param {*} rules lista das regras de validação, onde cada elemento pode
     *             ser uma string com o nome da regra ou uma função.
     * @returns uma Promise contendo o ValidationResult de todas as regras.
     * @see AsyncRuleValidator#validate
     */
    async validateOneByOne(rules) {
        for (const ruleName of rules) {
            const validationResult = await this._executeValidationRuleAsync(ruleName)
                .then(this._concatAllValidationResultErrors);

            if (validationResult.hasErrors()) {
                return validationResult;
            }
        }

        return new ValidationResult([]);
    }

    _executeValidationRulesAsync(rules) {
        if (!Array.isArray(rules)) {
            rules = [rules];
        }

        return rules.map(rule => this._executeValidationRuleAsync(rule));
    }

    _executeValidationRuleAsync(rule) {
        const validationFunction = this._requireFunction(rule);

        if (typeof validationFunction !== 'function') {
            throw Error(`Could not execute validation rule "${rule}".`);
        }

        try {
            return toPromise(validationFunction(this._body, this._eventInfo))
                .catch(error => Promise.reject(`Falha ao executar regra ${rule}: ${error}`));
        }
        catch (error) {
            return Promise.reject(`Falha ao executar regra ${rule}: ${error}`);
        }
    }

    _concatAllValidationResultErrors(allValidationRuleResultErrors) {
        const validationErrors = [];
        if (Array.isArray(allValidationRuleResultErrors)) {
            allValidationRuleResultErrors.forEach(resultError => addAllToArray(validationErrors, resultError));
        }
        else if (allValidationRuleResultErrors) {
            validationErrors.push(allValidationRuleResultErrors);
        }
        return new ValidationResult(validationErrors);
    }

}

const _require = eval('typeof require === "undefined" ? undefined : require');

function requireRuleValidationFunction(rule) {
    if (typeof rule === 'string') {
        return _require(`src/rules/${rule}`);
    }
    return rule;
}

function toPromise(result) {
    if (result instanceof Promise) {
        return result;
    }
    return Promise.resolve(result);
}

function addAllToArray(array, value) {
    if (Array.isArray(value)) {
        value.forEach(e => array.push(e));
    }
    else if (value) {
        array.push(value);
    }
}

/**
 * Resultado da execução de regras de validação. Armazena todas as mensagens
 * retornadas por regras de validação e possui métodos auxiliares para
 * posterior tratamento das mensagens.
 *
 * @author Luiz.Nazari
 */
class ValidationResult {

    constructor(validationErrors) {
        this._validationErrors = validationErrors;
    }

    /**
     * Havalia se houveram erros de validação.
     *
     * @returns {@code true} caso haja mensagens de validação,
     *      {@code false} caso não houveram erros de validação.
     */
    hasErrors() {
        return this._validationErrors.length > 0;
    }

    /**
     * @returns um objeto contendo todas as mensagens de erro de validação.
     */
    getErrors() {
        return {
            errors: this._validationErrors
        };
    }

    /**
     * @returns uma string concatenando todas as mensagens de erro de
     *          validação separadas pelo caractere quebra de linha '\n'.
     */
    getErrorsAsString() {
        return this._validationErrors.join('\n');
    }

}

module.exports = {
    AsyncRuleValidator,
    ValidationResult,
};
