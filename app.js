require('dotenv').load();
var Hapi = require('hapi');
var Good = require('good');
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var services = require('./services');

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
server.connection({port: 3000});

//Socket.io
var io = require('socket.io')(server.listener);
var comSocket;
io.on('connection', function(socket){
  comSocket = socket;
  console.log('Client Connected...');
  socket.emit('greeting');
	socket.on('disconnect', function(){
		console.log('...Client disconnected');
		comSocket = null;
	});
});

//Send current time
setInterval(function(){
	if (comSocket) {
      var t = new Date();
      var seconds = (t.getSeconds() < 10) ? '0' + t.getSeconds() : t.getSeconds();
      var minutes = (t.getMinutes() < 10) ? '0' + t.getMinutes() : t.getMinutes();
      var hours = (t.getHours() < 10) ? '0' + t.getHours() : t.getHours();
      var time = hours + ':' + minutes + ':' + seconds;
      comSocket.emit('time', {time: time, timestamp: new Date().getTime()});
    }
}, 1000);

server.route({
	method: 'GET',
	path: '/patients',
	handler: function(request, reply){
		services.getPatients(function(err, res){
			if(err){
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
	handler: function (request, reply){
		reply(200)
	}
})

server.route({
	method: 'POST',
	path: '/savesession',
	handler: function(request, reply){
		emitter.emit('session_end');
		services.saveSession(request.payload, comSocket, function(err, res){
			if(err){
				server.log(err)
			}
			if(res.sessId){
				reply({sessid:res.sessId, start: res.start});
			} else{
				reply('500');
			}
		})
	}
});
server.route({
	method: 'GET',
	path: '/stopsession',
	handler: function(request, reply){
		emitter.emit('session_end');
		reply('done');
	}
});

server.route({
	method: 'GET',
	path: '/getsessiondata',
	handler: function(request, reply){
		services.getSessionData(request.query, function(err, res){
			if(err){
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
}, function(err){
	if(err){
		throw err;
	}
	server.start(function(){
		server.log('Server running at:', server.info.uri);
	});
});


exports.server = server;
exports.emitter = emitter;

