var Worker = require('../session').Worker;
var expect = require('expect.js');
var pg = require('pg');
var escape = require('pg-escape');
var dao = require('../dao.js');

var conString = process.env.DATABASE_URL || 'postgres://localhost/optofluid';

var data = {
  "end": null,
  "start": new Date().getTime(),
  "status": "started",
  "weight": 79,
  "patient": "1",
  "totaluf": 1.9,
  "dialflow": 500,
  "duration": 240,
  "bloodflow": 300
};
var clearTable = function(table, callback){
  pg.connect(conString, function(err, client, doneDb){
    expect(err).to.be.equal(null);
    var query = escape('TRUNCATE TABLE %I', table);
    client.query(query, function(err, res){
      expect(err).to.be.equal(null);
      query = escape('SELECT count(*) FROM %I', table);
      client.query(query, function(err, res){
        doneDb();
        return callback(err, res);
      })
    })
  });
};

describe('Test truncate', function(){
  before(function(done){
    pg.connect(conString, function(err, client, doneDb){
      expect(err).to.be.equal(null);
      var query = escape('INSERT INTO sensor ' +
        '(ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10, ch11, ch12, time) ' +
        'values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id',
        6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 1);
      client.query(query, function(err, res){
        doneDb();
        expect(err).to.be.equal(null);
        expect(res.rowCount).to.be.equal(1);
        testid = res.rows[0].id;
        done();
      });
    });
  });
  it('Table should go empty', function(done){
    clearTable('sensor', function(err, res){
      expect(err).to.be.equal(null);
      expect(res.rows[0].count).to.be.equal('0');

      done();
    })
  })
});

describe('Start new session', function(){
  var sessid;
  after(function(done){
    pg.connect(conString, function(err, client, doneDb){
      expect(err).to.be.equal(null);
      var query = escape('DELETE FROM session WHERE id = %L', sessid);
      client.query(query, function(err, res){
        doneDb();
        expect(err).to.be.equal(null);
        expect(res.rowCount).to.be.equal(1);
        dao.getSession(sessid, function(err, res){
          expect(err).to.be.equal(null);
          expect(res).to.be.equal(null);
          done();
        });
      })
    });
  });

  var worker = new Worker(data);
  before(function(){
    worker.startSession()
  });
  it('Should start new session', function(done){
    worker.startSession(data, function(err, res){
      expect(err).to.be.equal(null);
      expect(res.status).to.be.equal('started');
      console.log(res);
      sessid = res.sessId;
      done();
    });
  });
});

describe('Handle session data', function(){
  var worker = new Worker(data);
  var datafile = require('./data2.json');
  var addToDb = function(item, time){
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

  var sensorData = function(callback){
    clearTable('sensor',function(err){
      expect(err).to.be.equal(null);
      var count = 0;
      for(var i=0; i<datafile.length; i++){
        setTimeout(function(){
          var item = datafile[count++];
          addToDb(item, count);
        },1);

      }
      callback();
    });
   
  };
  before(function(done){
    worker.startSession(function(err, res){
      expect(err).to.be.equal(null);
      expect(res.sessId).to.be.above(1);
      sensorData(function(){
        done();
      });
    })
  });

  /*
  THIS IS A LONG TEST
   */
  it('Publish processed data', function(done){
    this.timeout(60000);
    worker.startProcessing();


    setTimeout(function(){
      worker.stopProcessing();
      done();
    },50000);
  });
});