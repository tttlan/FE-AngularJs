/**
 * Config for live server
 */

module.exports = function() {
    const dotenv = require('dotenv');
    const history = require("connect-history-api-fallback");

    // There's no need to check if .env exists, dotenv will check this // for you. It will show a small warning which can be disabled when // using this in production.
    dotenv.load();
    const ENV = dotenv.config().parsed || {};
    const ENV_SETUP = process.env;

    const API_PROTOCOL          = ENV_SETUP.API_PROTOCOL || ENV.API_PROTOCOL || 'http://';
    const API_HOST              = ENV_SETUP.API_HOST || ENV.API_HOST || 'localhost';
    const API_PORT              = ENV_SETUP.API_PORT || ENV.API_PORT || '9090';
    const MANAGEMENT_PORT       = ENV_SETUP.MANAGEMENT_PORT || ENV.MANAGEMENT_PORT || '9090';

    const API_DOMAIN            = ENV_SETUP.API_DOMAIN || 'rest';
    const SERVICE_URL           = API_PROTOCOL + API_HOST + ':' + API_PORT + '/' + API_DOMAIN;
    const LIVE_SERVER_DEV_HOST  = ENV_SETUP.LIVE_SERVER_DEV_HOST || ENV.LIVE_SERVER_DEV_HOST || 'localhost';
    const LIVE_SERVER_DEV_PORT  = ENV_SETUP.LIVE_SERVER_DEV_PORT || ENV.LIVE_SERVER_DEV_PORT || '3000';
    const LIVERLOAD_PORT        = ENV_SETUP.LIVERLOAD_PORT || ENV.LIVERLOAD_PORT || '35720';
    const LIVE_SERVER_TEST_HOST = ENV_SETUP.LIVE_SERVER_TEST_HOST || ENV.LIVE_SERVER_TEST_HOST || 'localhost';
    const LIVE_SERVER_TEST_PORT = ENV_SETUP.LIVE_SERVER_TEST_PORT || ENV.LIVE_SERVER_TEST_PORT || '8080';
    const LIVE_SERVER_PROD_HOST = ENV_SETUP.LIVE_SERVER_PROD_HOST || ENV.LIVE_SERVER_PROD_HOST || 'localhost';
    const LIVE_SERVER_PROD_PORT = ENV_SETUP.LIVE_SERVER_PROD_PORT || ENV.LIVE_SERVER_PROD_PORT || '9090';

    const SESSION_TIMEOUT       = ENV_SETUP.SESSION_TIMEOUT || ENV.SESSION_TIMEOUT || 1800;

    const LIVE_SERVER_DEV = {
        port: LIVE_SERVER_DEV_PORT,
        host: LIVE_SERVER_DEV_HOST,
        root: ['dist'],
        livereload: false,
        middleware: function(connect, opt) {
            return [
                history({})
            ]
        },
        debug: true
    };

    const LIVE_SERVER_TEST = {
        port: LIVE_SERVER_TEST_PORT,
        root: ['build'],
        host: LIVE_SERVER_TEST_HOST,
        wait: 1000,
        livereload: false,
        middleware: function(connect, opt) {
            return [
                history({})
            ]
        }
    };

    const LIVE_SERVER_PROD = {
        port: LIVE_SERVER_PROD_PORT,
        host: LIVE_SERVER_PROD_HOST,
        root: ['build'],
        wait: 1000,
        livereload: false,
        middleware: function(connect, opt) {
            return [
                history({})
            ]
        }
    };

    let config = {
        host_back_end_protocol: API_PROTOCOL,
        host_back_end: API_HOST,
        port_back_end: API_PORT,
        management_port: MANAGEMENT_PORT,
        domain_back_end: API_DOMAIN,
        service_url: SERVICE_URL,
        live_server_dev: LIVE_SERVER_DEV,
        live_server_test: LIVE_SERVER_TEST,
        live_server_prod: LIVE_SERVER_PROD,
        session_timeout: SESSION_TIMEOUT
    };

    return config;
};