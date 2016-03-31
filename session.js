var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var Handler = require('./data.js').Handler;
var dao = require('./dao.js');
var q = require('q');



var Worker = function (sessiondata) {
  var self = this;
  handler = null;
  var session = sessiondata;
  started = false;
  var sessionStartTime;
  var promises = [];



  /*
   ADD TEST DATA
   */

  var datafile = require('./mocha/data2.json');
  var addToDb = function(item, time){
    var conString = process.env.DATABASE_URL || 'postgres://localhost/optofluid';
    var pg = require('pg');
    var escape = require('pg-escape');
    pg.connect(conString, function(err, client, doneDb){
      if(err){
        console.log(err); //TODO: Remove
      }
      var query = escape('INSERT INTO sensor ' +
        '(ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10, ch11, ch12, time) ' +
        'values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)',
        0, item[0], item[4], 0, item[1], item[5], 0, item[2], item[6], 0, item[3], item[7], time);
      client.query(query, function(err, res){
        doneDb();
        if(err){
          console.log(err)
        }
      })
    });
  };
  var clearTable = function(table, callback){
    var conString = process.env.DATABASE_URL || 'postgres://localhost/optofluid';
    var pg = require('pg');
    var escape = require('pg-escape');
    pg.connect(conString, function(err, client, doneDb){
      var query = escape('TRUNCATE TABLE %I', table);
      client.query(query, function(err, res){
        query = escape('SELECT count(*) FROM %I', table);
        client.query(query, function(err, res){
          doneDb();
          return callback(err, res);
        })
      })
    });
  };
  var sensorData = function(){
    clearTable('sensor',function(err){
      var count = 0;
      for(var i=0; i<datafile.length; i++){
        setTimeout(function(){
          var item = datafile[count++];
          addToDb(item, count);
        },1);

      }

    });

  };
  /*
   ADD TEST DATA
   */
  

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
      sensorData();
      callback(null, res);
    });
  };

  emitter.on('next_data', function(){
    setTimeout(function(){
      self.handleData();  
    }, 1000);
    
  });
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
      }, 30);
      
      if (data) {
        handler.addRaw(data, function (err, processed) {

          if (processed) {
            dao.saveSessionData(session.sessId, processed, function(err, res){
              if(err || !res){
                console.log('Session data save failed');
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
