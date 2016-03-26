var Code = require('code');   // assertion library
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var services = require('../services');
var pg = require('pg');
var escape = require('pg-escape');
var conString = process.env.DATABASE_URL;

lab.experiment('Get patients', function(){
   lab.test('Fetch patients list', function(done){
      services.getPatients(function(err, res){
          Code.expect(err).to.be.null();
          Code.expect(res.length).to.be.above(0);
          console.log(res);
          done();
      })
   });
});

lab.experiment('Get last data with data', function(){
	var dataId;
	var before = new Date().getTime();
	lab.before(function(done){
		pg.connect(conString, function(err, client, doneDb){
			Code.expect(err).to.be.null();
			setTimeout(function(){
				var now = new Date().getTime();
			var query = escape('INSERT INTO sensor ' +
				'(ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10, ch11, ch12, time) ' +
				'values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id',
				666, 666, 666, 666, 666, 666, 666, 666, 666, 666, 666, 666, now);

				client.query(query, function(err, res){
					doneDb();
					Code.expect(err).to.be.null();
					Code.expect(res.rows[0].id).to.be.above(0);
					dataId = res.rows[0].id;
					done();
				});
			}, 100);


		});
	});
	lab.after(function(done){
		pg.connect(conString, function(err, client, doneDb){
			Code.expect(err).to.be.null();
			var query = escape('DELETE FROM sensor WHERE id=%L', dataId);
			client.query(query, function(err, res){
				doneDb();
				Code.expect(err).to.be.null();
				Code.expect(res.rowCount).to.be.equal(1);
				done();
			});
		});
	});
	lab.test('Get last data should go well', function(done){

			services.getLastData(before, function(err, res){
				Code.expect(err).to.be.null();
				Code.expect(res.ch1).to.be.equal(666);
				done();
			});

	});

});

lab.experiment('Get last data with no data', function(){

});

lab.experiment('End session', function(){
	var start = new Date().getTime();
 var sessId;
	var data = {
		"end": null,
		"start": 1445639731489,
		"status": "started",
		"weight": 79,
		"patient": "3",
		"totaluf": 1.9,
		"dialflow": 500,
		"time": 240,
		"bloodflow": 300
	};

	lab.before(function(done){
		//create new session
		services.saveSession(data,function(err, res){
			Code.expect(err).to.be.null();
			sessId = res.sessId;
			done();
		});
	});
	lab.after(function(done){
		//Clean up test data
		pg.connect(conString, function(err, client, doneDb){
			Code.expect(err).to.be.null();
			var query = escape('DELETE FROM session WHERE id=%L', sessId);
			client.query(query, function(err, res){
				doneDb();
				Code.expect(err).to.be.null();
				Code.expect(res.rowCount).to.be.equal(1);
				done();
			});
		});
	});
	lab.test('End session should go well', function(done){
		services.endSession(sessId, function(err, res){
			Code.expect(err).to.be.null();
			Code.expect(res).to.be.equal(1);
			pg.connect(conString, function(err, client, doneDb){
				var query = escape('SELECT data FROM session WHERE id= %L', sessId);
				client.query(query, function(err, res){
					doneDb();
					Code.expect(err).to.be.null();
					Code.expect(res.rows[0].data.status).to.be.equal('stopped');
					var now = new Date().getTime();
					Code.expect(res.rows[0].data.end).to.be.within(start, now);
					done();
				});
			});

		})
	});
});