var expect = require('expect.js');
var dao = require('../dao.js');
var pg = require('pg');
var escape = require('pg-escape');
var conString = process.env.DATABASE_URL || 'postgres://localhost/optofluid';

describe('Save new session', function () {
  var sessid;
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
      done();
    });
  });
});