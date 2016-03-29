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
  var sensorData = function(){
    
  };
  before(function(done){
    worker.startSession(function(err, res){
      expect(err).to.be.equal(null);
      expect(res.sessId).to.be.above(1);
      

      done();
    })
  });

  it('Publish processed data', function(done){
    this.timeout(10000);
    worker.handleData();


    setTimeout(function(){
      done();
    },8000);
  });
});