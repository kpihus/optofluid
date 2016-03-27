var pg = require('pg');
var escape = require('pg-escape');
var conString = process.env.DATABASE_URL || 'postgres://localhost/optofluid';


exports.startSession = function(data, callback){
  
};


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

			return callback(null, data);
		})
	});
};

exports.getLastData = function(timestamp, callback){
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
			callback(null, true);
		})
	})
};
exports.saveSessionData = function(sessid, data, callback){
	pg.connect(conString, function(err, client, done){
		if(err){
			return callback(err);
		}
		var query = escape('INSERT INTO session_data (time, sessionId, data) VALUES(%s, %L, %L)', data.time, sessid, JSON.stringify(data));
		client.query(query, function(err, res){
			done();
			if(err){
				return callback(err);
			}
			if(res.rowCount>0){
				callback(null, true);
			}else{
				callback(null, false);
			}
		})
	})
};

exports.getSessionData = function(data, callback){
	console.log(data); //TODO: Remove
	pg.connect(conString, function(err, client, done){
		if(err){
			return callback(err);
		}
		var query = escape('SELECT * FROM session_data WHERE time > %s AND sessionId = %L', data.lastItem, data.sessid);
		client.query(query, function(err, res){
			done();
			if(err){
				return callback(err);
			}
			callback(null, res.rows);
		})
	})
};

exports.endSession = function(sessionid, callback){
	pg.connect(conString, function(err, client, done){
		if(err){
			return callback(err);
		}
		var query = escape('SELECT data FROM session WHERE ID = %L', sessionid);
		client.query(query, function(err, res){
			if(err){
				done();
				return callback(err);
			}
			var data = res.rows[0].data;
			data.end = new Date().getTime();
			data.status = 'stopped';
			var query = escape('UPDATE session SET data = %L WHERE id = %L', JSON.stringify(data), sessionid);
			client.query(query, function(err, res){
				done();
				if(err){
					return callback(err);
				}
				callback(null, res.rowCount);
			});
		})
	})
}