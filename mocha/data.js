var data = require('../data.js');
var expect = require('expect.js');
var q = require('q');

describe('Math functions', function () {
  var handler = new data.Handler(1, 2, 77.3, 240, 500);
  it('Sum of array should get 15 for [1,2,3,4,5]', function (done) {
    var arr = [1, 2, 3, 4, 5];
    expect(handler.sumArr(arr)).to.be.equal(15);
    done();
  });
  it('Median should get 3 for [1,2,3,4,5]', function (done) {
    expect(handler.median([1, 2, 3, 4, 5])).to.be.equal(3);
    done();
  });
  it('Median should get 3.5 for [1,2,3,4,5,6]', function (done) {
    expect(handler.median([1, 2, 3, 4, 5, 6])).to.be.equal(3.5);
    done();
  });
  it('Average should get 5,5 for [1,2,3,4,5,6,7,8,9,10]', function () {
    expect(handler.average([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).to.be.equal(5.5);
  });
  it('SpKtVb should give 1,48', function () {
    var spktvb = handler.calcSpKtVb(7.6, 1.9, 0.45333);
    expect(spktvb).to.be.equal(1.48);
  });
  it('EKtV sould give -0,88', function(){
    var ektv = handler.calcEKtVb(1.45, 22.1/60);
    expect(ektv).to.be.equal(-0.88);
  });
  it('TR should give 63.4', function(){
    var tr = handler.calcTR(4.59, 27.2, 500, 8.33);
    var control = tr-63.4;
    expect(Math.abs(control)).to.be.below(0.2);
  });
  it('RR should give 23.26', function(){
    var rr = handler.calcRR(7.58, 5.81);
    var control = rr-23.26;
    expect(Math.abs(control)).to.be.below(0.2);
  });

});

describe('Handle data', function () {
  /**
   * arr =
   *     [0] - A260
   *     [1] - A300
   *     [2] - A315
   *     [3] - A370
   *     [4] - F260
   *     [5] - F300
   *     [6] - F315
   *     [7] - F370
   * @param arr
   */
  var format = function (arr) {
    return {
      ch1: null,
      ch2: arr[0],
      ch3: arr[4],
      ch4: null,
      ch5: arr[1],
      ch6: arr[5],
      ch7: null,
      ch8: arr[2],
      ch9: arr[6],
      ch10: null,
      ch11: arr[3],
      ch12: arr[7],
      time: new Date().getTime()
    }
  };
  var report = function(key, wanted, actual){
    console.log(key, '=> Wanted:', wanted, 'Actual:', actual,'\n');
  };
  describe('Start phases', function () {
    var dataset = require('./data.json');
    it('From phase 0 to 1', function (done) {
      var handler = new data.Handler(1);
      expect(handler.startphase).to.be.equal(0);
      for (var i = 0; i < 35; i++) {
        handler.addRaw(format(dataset[i]));
      }
      expect(handler.startphase).to.be.equal(1);
      done();
    });

    it('From phase 1 to 2', function (done) {
      var handler = new data.Handler(1);
      handler.startphase = 1;
      expect(handler.startphase).to.be.equal(1);
      for (var i = 35; i < 54; i++) {
        handler.addRaw(format(dataset[i]));
      }
      expect(handler.startphase).to.be.equal(2);
      done();
    });
    it('From phase 2 to 3', function (done) {
      var handler = new data.Handler(1);
      handler.startphase = 2;
      expect(handler.startphase).to.be.equal(2);

      for (var i = 54; i < dataset.length; i++) {
        handler.addRaw(format(dataset[i]));
      }
      expect(handler.startphase).to.be.equal(3);
      done();
    });
  });

  describe('Get latest', function(){
    var handler = new data.Handler(1, 2, 77.3, 240);
    before(function(){
      for(var i=0; i<=10;i++){
        handler.dataset.urea.push(i);
      }
      handler.dataset.c0=6;
    });
    it('Should give value by key', function(){
      var urea = handler.latest('urea');
      expect(urea).to.be.equal(10);
    });
    it('Should give item itself if not array', function(){
      var c0 = handler.latest('c0');
      expect(c0).to.be.equal(6);
    });
    it('Should give error for non exists key', function(){
      var test = handler.latest('test');
      expect(test).to.be.equal(false);
    });
    it('Should give all if no key is specified', function(){
      var data = handler.latest();
      expect(typeof data).to.be.equal('object');
      expect(data.urea).to.be.equal(10);
    })

  });
  describe('With real data', function () {
    var dataset = require('./data2.json');
    var handler = new data.Handler(1, 2, 77.3, 240, 500);
    var res = {
      urea: 0.8,
      ct: 0.9,
      time: 238.7,
      rr: 84.87,
      spKtVb: 2.21,
      eKtVb: 1.91,
      cmean: 2.91,
      tr: 352.6
    };
    var error = {
      urea: 0.1,
      ct: 0.1,
      time: 0.1,
      rr: 0.7,
      spKtVb: 0.2,
      eKtVb: 0.1,
      cmean: 0.1,
      tr: 0.1
    };
    before(function(done){

      var promises = [];
      var add = function(data, p){
        handler.addRaw(format(data), function(err, res){
          p.resolve();
        });
      };



      for(var i=0; i<dataset.length; i++){
        var p = q.defer();
        promises.push(p.promise);
        add(dataset[i], p);
      }

      q.all(promises).done(function(){
        done();
      });


    });


    it('Should give valid urea', function (done) {
      var key = 'urea';
      var value = handler.latest(key);
      var control = res.urea;
      report(key, control, value);
      expect(Math.abs(value - control)).to.be.below(error[key]);
      done();
    });

    it('Should give valid ct', function(done){
      var key = 'ct';
      var value = handler.latest(key);
      var control = res[key];
      report(key, control, value);
      expect(Math.abs(value - control)).to.be.below(error[key]);
      done();
    });

    it('Should give valid spKtVb', function(done){
      var key = 'spKtVb';
      var value = handler.latest(key);
      var control = res[key];
      report(key, control, value);
      expect(Math.abs(value - control)).to.be.below(error[key]);
      done();
    });
    it('Should give valid eKtVb', function(done){
      var key = 'eKtVb';
      var value = handler.latest(key);
      var control = res[key];
      report(key, control, value);
      expect(Math.abs(value - control)).to.be.below(error[key]);
      done();
    });
    it('Should give valid rr', function(done){
      var key = 'rr';
      var value = handler.latest(key);
      var control = res[key];
      report(key, control, value);
      expect(Math.abs(value - control)).to.be.below(error[key]);
      done();
    });
    it('Should give valid cmean', function(done){
      var key = 'cmean';
      var value = handler.latest(key);
      var control = res[key];
      report(key, control, value);
      expect(Math.abs(value - control)).to.be.below(error[key]);
      done();
    });
    it('Should give valid tr', function(done){
      var key = 'tr';
      var value = handler.latest(key);
      var control = res[key];
      report(key, control, value);
      expect(Math.abs(value - control)).to.be.below(error[key]);
      done();
    });


  });
});


