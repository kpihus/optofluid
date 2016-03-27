var pg = require('pg');
var escape = require('pg-escape');
var conString = process.env.DATABASE_URL || 'postgres://localhost/optofluid';

exports.saveNewSession = function(data, callback){
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

exports.getSession = function(sessid, callback){
  pg.connect(conString, function(err, client, done){
    if(err){
      return callback(err);
    }
    var query = escape('SELECT * FROM session WHERE id = %L', sessid);
    client.query(query, function(err, res){
      done();
      if(res.rowCount > 0){
        callback(err, res.rows[0]);
      }else{
        callback(err, null);
      }
    })
  })
};