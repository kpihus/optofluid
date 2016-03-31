require('dotenv').load();
var Hapi = require('hapi');
var Good = require('good');
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var services = require('./services');


var working = false;
var sesint;
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
	path: '/savesession',
	handler: function(request, reply){
		emitter.emit('session_end');
		services.saveSession(request.payload, function(err, res){
			if(err){
				server.log(err)
			}
			if(res.sessId){
				reply({sessid:res.sessId});
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

