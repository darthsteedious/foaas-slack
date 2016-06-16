const request = require('request'),
    Hapi = require('hapi'),
    Boom = require('boom'),
    server = new Hapi.Server();

const foaasClient = request.defaults({baseUrl: 'http://foaas.com', json: true});
const routes = require('./routes');

server.connection({port: +process.env.PORT || 3000});

const replaceTokens = (url, params) => {
    var i = 0;
    return url.replace(/(\/[\w{]+})/gi, (match, segment) => {
        return segment.includes('{')
            ? `/${params[i++] || ''}`
            : match;
    });
};

server.route({
    method: 'POST',
    path: '/slack',
    handler(req, reply) {
        let payload = JSON.parse(req.payload || {});
        if (!payload || !payload.text) {
            return reply(Boom.badRequest('Bad Request'));
        }

        let [method, ...params] = payload.text.split(' ');

        let url = '/You/Buddy';
        if (routes[method]) {
            url = replaceTokens(routes[method], params);
            console.log(url);
        }

        foaasClient({ method: 'GET', url }, (err, res, body) => {
            if (err) return reply(Boom.badImplementation(err));

            reply(body);
        });
    }
});

server.start(err => {
    if (err) console.log(err);

    console.log(`server started at ${server.info.uri}`);
});

