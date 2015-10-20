var app = require('./app');
console.log('Worker started...'); //TODO: Remove
app.emitter.on('session_start', function sessionStart(){
	console.log('Session started...')
});

