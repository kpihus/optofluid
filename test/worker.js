var Code = require('code');   // assertion library
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var services = require('../services');
var pg = require('pg');
var escape = require('pg-escape');
var conString = process.env.DATABASE_URL;
var worker = require('../worker.js');


lab.experiment('Helper functions', function(){
  lab.test('Check median from odd', function(done){
    var median = worker.median([5,2,4,3,1,7,6]);
    Code.expect(median).to.be.equal(4);
    done();
  });

  lab.test('Check median from even', function(done){
    var median = worker.median([5,2,4,3,1,7,6,8]);
    Code.expect(median).to.be.equal(4.5);
    done();
  });
});

