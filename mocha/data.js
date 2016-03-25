var data = require('../data.js');
var expect = require('expect.js');

describe('Math functions', function () {
  var handler = new data.Handler(1);
  describe('Sum of array', function () {
    it('Should get 15 for [1,2,3,4,5]', function (done) {
      var arr = [1, 2, 3, 4, 5];
      expect(handler.sumArr(arr)).to.be.equal(15);
      done();
    });
  });
  describe('Median', function () {
    it('Shpould get 3 for [1,2,3,4,5]', function (done) {
      expect(handler.median([1, 2, 3, 4, 5])).to.be.equal(3);
      done();
    });
    it('Shpould get 3.5 for [1,2,3,4,5,6]', function (done) {
      expect(handler.median([1, 2, 3, 4, 5, 6])).to.be.equal(3.5);
      done();
    });
  });
  describe('Average', function () {
    it('Should get 5,5 for [1,2,3,4,5,6,7,8,9,10]', function () {
      expect(handler.average([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).to.be.equal(5.5);
    })
  })
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
      ch12: arr[7]
    }
  };
  describe('Start phases', function () {
    var dataset = require('./data.json');
    var results = require('./dataresults.json');
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


  describe('With real data', function () {
    var dataset = require('./data.json');
    var results = require('./dataresults.json');
    it('Should give valid urea', function (done) {
      var handler = new data.Handler(1);
      for (var i = 0; i < dataset.length; i++) {
        handler.addRaw(format(dataset[i]));
        if (handler.started) {
          var urea = handler.urea();
          var control = results[i];
          //We will allow error <0.2
          expect(Math.abs(urea - control)).to.be.below(0.2);
        }


      }
      console.log(handler.started);
      done();
    })
  });
});
describe('Detect session start', function () {
  it('Should find starting point', function () {


  });
});

