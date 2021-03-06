require('dotenv').load();
var Hapi = require('hapi');
var Good = require('good');
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var services = require('./services');
var apiPort = process.env.API_PORT || 3003

//Create hapi server
var server = new Hapi.Server({
  connections: {
    routes: {
      cors: {
        matchOrigin: false,
        origin: ['*']
      }
    }
  }
});
server.connection({port: apiPort});

//Socket.io
var io = require('socket.io')(server.listener);
var comSocket;
io.on('connection', function (socket) {
  comSocket = socket;
  console.log('Client Connected...');
  socket.emit('greeting');
  socket.on('disconnect', function () {
    console.log('...Client disconnected');
    comSocket = null;
  });
});

// Send heartbeat
setInterval(function () {
  if (comSocket) {
    comSocket.emit('keepalive', new Date().getTime());
  }
}, 1000);


server.route({
  method: 'GET',
  path: '/patients',
  handler: function (request, reply) {
    services.getPatients(function (err, res) {
      if (err) {
        server.log(err);
        return reply('Error');
      }
      reply(res);
    });
  }
});

server.route({
  method: 'POST',
  path: '/addpatient',
  handler: function (request, reply) {
    services.addPatient(request.payload, function (err, res) {
      if (err) {
        server.log(err);
        return reply('Error:' + JSON.stringify(err));
      }
      services.getPatients(function (err, res) {
        if (err) {
          server.log(err);
          return reply('Error');
        }
        reply(res);
      });
    })
  }
})

server.route({
  method: 'POST',
  path: '/savesession',
  handler: function (request, reply) {
    services.saveSession(request.payload, comSocket, emitter, function (err, res) {
      if (err) {
        server.log(err)
      }
      if (res.sessId) {
        reply({sessid: res.sessId, start: res.start});
      } else if(!comSocket) {
        reply('500')
      } else {
        reply('500');
      }
    })
  }
});

server.route({
  method: 'GET',
  path: '/lastsession',
  handler: function (request, reply){
    console.log('QUERY', request.query)
    services.getLastSession(request.query.patient, function(err, res){
      if(err){
        server.log(err)
        reply('ERROR: '+JSON.stringify(err))
      }
      reply(res)
    })
  }
})

server.route({
  method: 'GET',
  path: '/stopsession',
  handler: function (request, reply) {
    emitter.emit('session_end');
    reply('done');
  }
});

server.route({
  method: 'GET',
  path: '/getsessiondata',
  handler: function (request, reply) {
    services.getSessionData(request.query, function (err, res) {
      if (err) {
        server.log(err);
      }
      reply(res);
    })
  }
});

server.register({
  register: Good,
  options: {
    reporters: [{
      reporter: require('good-console'),
      events: {
        response: '*',
        log: '*'
      }
    }]
  }
}, function (err) {
  if (err) {
    throw err;
  }
  server.start(function () {
    server.log('Server running at:', server.info.uri);
  });
});


exports.server = server;
exports.emitter = emitter;

