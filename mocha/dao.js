var expect = require('expect.js');
var dao = require('../dao.js');
var pg = require('pg');
var escape = require('pg-escape');
var conString = process.env.DATABASE_URL || 'postgres://localhost/optofluid';

describe('Session Methods', function () {
  var sessid, dbData;
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
  after(function (done) {
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
  it('Should write new session into database', function (done) {
    dao.saveNewSession(data, function(err, res){
      expect(err).to.be.equal(null);
      expect(res.sessId).to.be.above(1);
      sessid = res.sessId;

      done();
    });
  });
  it('Should return return session item', function(done){
    dao.getSession(sessid, function(err, res){
      expect(err).to.be.equal(null);
      expect(res.data.start).to.be.equal(data.start);
      dbData = res.data;
      done();
    });
  });
  it('Should update session item', function(done){
    dbData.status = 'stopped';
    dao.updateSession(sessid, dbData, function(err, res){
      expect(err).to.be.equal(null);
      expect(res).to.be.equal(true);
      dao.getSession(sessid, function(err, res){
        expect(err).to.be.equal(null);
        expect(res.data.status).to.be.equal('stopped');
        done();
      })

    })
  })
});

describe('Sensor functions', function(){
  var testid;
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
  after(function(done){
    pg.connect(conString, function(err, client, doneDb){
      expect(err).to.be.equal(null);
      var query = escape('DELETE FROM sensor WHERE id = %L', testid);
      client.query(query, function(err, res){
        doneDb();
        expect(err).to.be.equal(null);
        expect(res.rowCount).to.be.equal(1);
        done();
      })
    });
  });
  it('Should get next unhandled reading', function(done){
    dao.getReading(7, function(err, res){
      expect(err).to.be.equal(null);
      expect(res.ch1).to.be.equal(6);
      done();
    });
  });

});