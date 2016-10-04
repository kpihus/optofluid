var Handler = require('./data.js').Handler;
var dao = require('./dao.js');
var q = require('q');
var server = require('./app.js').server;

var testData = require('./test/testdata');


var Worker = function (sessiondata, comSocket, emitter) {
  var self = this;
  var handler = null;
  var session = sessiondata;
  var started = false;
  var dataHandler;
  var sessionStartTime;
  var sessionEndTime;
  var timeNow;
  var promises = [];

  emitter.on('session_end', function(){
    started = false
    console.log('end session')
  })

  setInterval(function () {
    if (comSocket) {
      var t = (timeNow) ? new Date(timeNow): new Date();
      var seconds = (t.getSeconds() < 10) ? '0' + t.getSeconds() : t.getSeconds();
      var minutes = (t.getMinutes() < 10) ? '0' + t.getMinutes() : t.getMinutes();
      var hours = (t.getHours() < 10) ? '0' + t.getHours() : t.getHours();
      var time = hours + ':' + minutes + ':' + seconds;
      comSocket.emit('time', {
        time: time,
        timestamp: timeNow
      });
    }
  }, 1000);



  self.startSession = function (callback) {
    dao.saveNewSession(session, function (err, res) {
      if (err) {
        return callback(new Error('Unable to start session', JSON.stringify(err)));
      }
      session = res;
      handler = new Handler(
        session.sessId,
        session.totaluf,
        session.weight,
        session.duration,
        session.dialflow
      );
      sessionStartTime=new Date().getTime();
      sessionEndTime = session.duration * 60 *1000+sessionStartTime;
      testData.addSensorData(res.start);
      callback(null, res);
    });
  };
  
  self.stopSession = function(callback){
    started = false;
    session.status = 'stopped'
    session.end = timeNow
    clearTimeout(dataHandler)

    dao.updateSession(session.sessId, session, function(err, res){
      if(err){
        throw new Error('Unable to end session', err)
      }
      if(res){
        comSocket.emit('status', 'endex')
        handler = null
      }
    })
  };


  self.startProcessing = function(){
    started=true;
    console.log('START PROCESSING');
    // emitter.emit('next_data');
    comSocket.emit('status', 'started')
    dataHandler = setInterval(function(){
      if (started) {
        self.handleData();
      } else {
        self.stopSession()
      }
    }, 1000);
  };

  self.handleData = function () {
    fetchData(session.sessId, function(err, data){
      if(err){
        throw err;
      }
      timeNow = parseInt(data.time);
      // emitter.emit('next_data');
      if (data) {
        handler.addRaw(data, function (err, processed) {
          comSocket.emit('newdata', processed);
          if (processed && processed.timestamp) {

            dao.saveSessionData(session.sessId, processed, function(err, res){
              if(err || !res){
                console.log('Session data save failed', err);
              }
            })
          }
        });
      }
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
