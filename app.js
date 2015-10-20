require('dotenv').load();
var Hapi = require('hapi');
var Good = require('good');
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var services = require('./services');
//var worker = require('./worker');
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

		services.saveSession(request.payload, function(err, res){
			if(err){
				server.log(err)
			}
			if(res.sessId){
				reply('200');
				if(!working){
					emitter.emit('session_start', res);
					working = true;
				}
			} else{
				reply('500');
			}
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

emitter.on('session_start', function sessionStart(data){
	var sessId = data.sessId;
	server.log('Started session:', data.sessId);
	console.log(data);
	var duration = data.duration * 60;
	var count = 0;
	var lastData = data.start;
	sesint = setInterval(function(){
		count++;
		console.log('Iteration:', count);
		//Get latest dataset
		services.getLastData(lastData, sessId, function(err, res){
			if(err){
				server.log(err);
			}
			if(res){
				services.updateLastData(sessId, res.id, function(err, res){
					if(err){
						server.log(err);
					}
				});


				var _260re = res.ch1;
				var _260abs = res.ch2;
				var _260flo = res.ch3;
				var _300re = res.ch4;
				var _300abs = res.ch5;
				var _300flo = res.ch6;
				var _315re = res.ch7;
				var _315abs = res.ch8;
				var _315flo = res.ch9;
				var _370re = res.ch10;
				var _370abs = res.ch11;
				var _370flo = res.ch12;

				var urea = _260abs+_300abs+_315abs+_370abs+_260flo+_300flo+_315flo+_370flo;

				var sessiondata = {
					urea: urea
				};




				lastData = res.time;
				console.log(res); //TODO: Remove
			}
		});

		if(count > duration){
			server.log('Session ended:', data.sessId);
			clearInterval(sesint);
			working = false;
		}
	}, 1000);
});

exports.server = server;
exports.emitter = emitter;


