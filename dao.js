var pg = require('pg');
var escape = require('pg-escape');
var conString = process.env.DATABASE_URL || 'postgres://localhost/optofluid';

/**************************************
 *             SESSION                *
 **************************************/

/**
 * Save new session
 * @param data
 * @param callback
 */
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
/**
 * Get session by session ID
 * @param sessid
 * @param callback
 */
exports.getSession = function(sessid, callback){
  pg.connect(conString, function(err, client, done){
    if(err){return callback(err);}
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

/**
 * Update given session
 * @param sessId
 * @param data
 * @param callback
 */
exports.updateSession = function(sessId, data, callback){
  pg.connect(conString, function(err, client, done){
    if(err){return callback(err);}
    var query = escape('UPDATE session SET data = %L WHERE id = %L', JSON.stringify(data), sessId);
    client.query(query, function(err, res){
      done();
      callback(err, (res.rowCount==1));
    })
  });
};

/**************************************
 *             Sensor                 *
 **************************************/

/**
 * Get next unhandled sensor reading
 * @param sessionid
 * @param callback
 */

exports.getReading = function(sessionid, callback){
  var data;
  pg.connect(conString, function(err, client, done){
    if(err){return callback(err)}
    var query = escape('SELECT * FROM sensor WHERE sessionid IS NULL ORDER BY time ASC LIMIT 1');
    client.query(query, function(err, res){
      if(err){return callback(err)}
      data = res.rows[0];
      query = escape('UPDATE sensor SET sessionid = %s WHERE id=%s', sessionid, data.id);
      client.query(query, function(err, res){
        if(err){return callback(err)}
        if(res.rowCount!=1){
          return callback(new Error('Unable to set session id to data'));
        }
        callback(null, data);
      });


    })
  })
};

/**
 * @deprecated
 * @todo: remove
 * @param dataid
 * @param sessid
 * @param callback
 */

exports.setSessionId = function(dataid, sessid, callback){
  pg.connect(conString, function(err, client, done){
    if(err){
      return callback(err);
    }
    var query = escape('UPDATE sensor SET sessionid = %s WHERE id = %s', sessid, dataid);
    client.query(query, function(err, res){
      done();
      if(err){
        return callback(err);
      }
      callback(null, res.rowCount==1);
    })
  })
};




