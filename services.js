var pg = require('pg');
var escape = require('pg-escape');
var conString = process.env.DATABASE_URL || 'postgres://localhost/optofluid';

exports.getPatients = function(callback){
	pg.connect(conString, function(err, client, done){
		if(err){
			return callback(err);
		}
		var query = escape('SELECT * FROM patient');
		client.query(query, function(err, res){
			done();
			callback(err, res.rows);
		})
	})
};
exports.saveSession = function(data, callback){
	var now = new Date().getTime();
	pg.connect(conString, function(err, client, done){
		if(err){
			return callback(err);
		}
		var query = escape('INSERT INTO session (time, data) VALUES(%s, %L) RETURNING id', now, JSON.stringify(data));
		client.query(query, function(err, res){
			done();
			if(err){
				return callback(err);
			}
			data.sessId = res.rows[0].id;

			return callback(err, data);
		})
	});
};

exports.getLastData = function(timestamp, sessid, callback){
	pg.connect(conString, function(err, client, done){
		if(err){
			return callback(err);
		}
		var query = escape('SELECT * FROM sensor WHERE time > %s AND sessionid IS NULL ORDER BY time ASC LIMIT 1', timestamp);
		client.query(query, function(err, res){
			done();
			if(err){
				return callback(err);
			}
			var output = (res.rowCount>0)? res.rows[0] : null;
			callback(null, output);
		})
	});
};

exports.updateLastData = function(sessid, dataid, callback){
	pg.connect(conString, function(err, client, done){
		if(err){
			return callback(err);
		}
		var query = escape('UPDATE sensor SET sessionid = %L WHERE id = %L', sessid, dataid);
		client.query(query, function(err, res){
			done();
			if(err){
				return callback(err);
			}
			console.log('Updated: ',res.rowCount);
			callback(null, true);
		})
	})
};