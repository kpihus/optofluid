var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var Handler = require('./data.js').Handler;
var dao = require('./dao.js');
var q = require('q');

var testData = require('./test/testdata');


var Worker = function (sessiondata, comSocket) {
  var self = this;
  handler = null;
  var session = sessiondata;
  started = false;
  var sessionStartTime;
  var promises = [];



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
      testData.addSensorData(res.start);
      callback(null, res);
    });
  };
  
  self.stopSession = function(callback){
    
  };


  self.startProcessing = function(){
    started=true;
    sessionStartTime=new Date().getTime();
    console.log('START PROCESSING');
    // emitter.emit('next_data');
    self.handleData();
  };

  self.stopProcessing = function(){
    started = false;
  };

  self.handleData = function () {
    fetchData(session.sessId, function(err, data){
      if(err){
        throw err;
      }
      // emitter.emit('next_data');
      setTimeout(function(){
        self.handleData();  
      }, 500);
      
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
