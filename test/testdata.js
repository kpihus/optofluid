var datafile = require('../mocha/data2.json');
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
exports.addSensorData = function(starttime){
  clearTable('sensor',function(err){
    if(err){
      console.log('CLEAR ERROR', JSON.stringify(err))
    }
    var count = starttime;
    var ic =0;
    for(var i=0; i<datafile.length; i++){
      setTimeout(function(){
        count = count+30000;
        var item = datafile[ic++];
        addToDb(item, count);
      },1);

    }

  });

};