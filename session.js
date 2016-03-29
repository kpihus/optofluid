var Handler = require('./data.js').Handler;
var dao = require('./dao.js');
var Worker = function (sessiondata) {
  var self = this;
  var handler;
  var session = sessiondata;


  self.startSession = function (callback) {
    dao.saveNewSession(session, function (err, res) {
      if (err) {
        callback(new Error('Unable to start session', JSON.stringify(err)));
      }
      session = res;
      handler = new Handler(
        session.sessId,
        session.totaluf,
        session.weight,
        session.duration,
        session.dialflow
      );
      callback(null, res);
    });
  };

  // var Handler = function (sessid, uftot, weight, duration, qd) {

  self.handleData = function () {

    fetchData(session.sessId, function(err, data){
      if(err){
        throw err;

      }
      handler.addRaw(data, function(err, processed){
        if(processed){
          console.log(processed)
        }
      });
    });
  };

  var fetchData = function (sessionid, callback) {
    dao.getReading(sessionid, function (err, res) {
      if (err) {
        return callback(
          new Error('Unable to get sensor reading', JSON.stringify(err))
        );
      }
      return callback(null, res);
    });
  };


};

exports.Worker = Worker;
