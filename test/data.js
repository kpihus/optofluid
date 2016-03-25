var Code = require('code');   // assertion library
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var services = require('../services');
var pg = require('pg');
var escape = require('pg-escape');
var conString = process.env.DATABASE_URL;
var data = require('../data');
var fs = require('fs'),
	readline = require('readline');
var path = require('path');

var sumObj = function(obj){
	var sum = 0;
	for(var key in obj){
		sum = sum + obj[key];
	}
	return sum;
};

lab.test('Test obj sum', function(done){
	var obj = {1: 1, 2: 2, 3: 3, 4: 4};
	Code.expect(sumObj(obj)).to.be.equal(10);
	done()
});

lab.experiment('Handle data', function(){
	var now = new Date().getTime();
	var singleSensor = {
		id: 0,
		sessionid: null,
		ch1: 3985.0,
		ch2: 7542.1,
		ch3: 179.4,
		ch4: 3987.7,
		ch5: 3615.0,
		ch6: 480.2,
		ch7: 5132.0,
		ch8: 5798.1,
		ch9: 933.9,
		ch10: 6218.0,
		ch11: 14403.9,
		ch12: 1799.1,
		time: now
	};

	lab.test('Handler initialization', function(done){
		var Data = new data.Handler(123);
		Code.expect(Data.sessid).to.be.equal(123);
		done();
	});

	lab.test('Set raw data', function(done){
		var count = 0;

		var items = new data.Handler(123);
		for(var i = 0; i < 10; i++){
			count++;
			var sensor = {
				id: 0,
				sessionid: null,
				ch1: count,
				ch2: count,
				ch3: count,
				ch4: count,
				ch5: count,
				ch6: count,
				ch7: count,
				ch8: count,
				ch9: count,
				ch10: count,
				ch11: count,
				ch12: count,
				time: now
			};
			items.addRaw(sensor);
		}

		Code.expect(items.raw.length).to.be.equal(10);
		Code.expect(items.lastDataTime).to.be.equal(now);
		//TODO: Assert abs1

		//Verify mean data

		done();
	});
	lab.test('With real data', function(done){
		var items = new data.Handler(123);
		var collection = [];
		var rd = readline.createInterface({
			input: fs.createReadStream(path.join(__dirname, '4.txt')),
			output: process.stdout,
			terminal: false
		});
		var count = 0;
		rd.on('line', function(line){
			if(count > 3){
				var data = line.split(' ');
				data.splice(0, 5);
				data.splice(data.length - 1, 1);
				if(data.length > 2){
					var sensor = {
						id: 0,
						sessionid: null,
						ch1: data[0],
						ch2: data[1],
						ch3: data[2],
						ch4: data[3],
						ch5: data[4],
						ch6: data[5],
						ch7: data[6],
						ch8: data[7],
						ch9: data[8],
						ch10: data[9],
						ch11: data[10],
						ch12: data[11],
						time: now
					};
					items.addRaw(sensor);

				}
			}

			count++;
		});
		rd.on('close', function(){
			done();
		})

	});

	lab.test('Calculate Urea', function(done){
    var handler = new data.Handler(123);

    var sensor = {
      id: 0,
      sessionid: null,
      ch1: 0,
      ch2: 2.35,
      ch3: 0.705,
      ch4: 0,
      ch5: 1.248,
      ch6: 0.9984,
      ch7: 0,
      ch8: 0.203,
      ch9: 0.0203,
      ch10: 0,
      ch11: 0.1015,
      ch12: 0.00508,
      time: new Date().getTime()
    };
    handler.addRaw(sensor);
    var urea = handler.urea();
    Code.expect(urea).to.be.equal(7.4);
    done();
  });

  lab.test('Check satart', function(done){
    var handler = new data.Handler(123);

    for(var i=35;i>=0; i--){
      var sensor = {
        id: i,
        sessionid: null,
        ch1: i,
        ch2: i,
        ch3: i,
        ch4: i,
        ch5: i,
        ch6: i,
        ch7: i,
        ch8: i,
        ch9: i,
        ch10: i,
        ch11: i,
        ch12: i,
        time: new Date().getTime()
      };
      handler.addRaw(sensor);
    }
    done();

  });

});

lab.experiment('Mathematcal functions', function(){
  var handler = new data.Handler(123);
  lab.test('Sum of array', function(done){

		Code.expect(handler.sumArr([1, 2, 3, 4, 5])).to.be.equal(15);
		done();
	});

  lab.test('Median odd', function(done){
    Code.expect(handler.median([5,2,4,3,1,7,6])).to.be.equal(4);
    done();
  });
  lab.test('Median even', function(done){
    Code.expect(handler.median([5,2,4,3,1,7,6,8])).to.be.equal(4.5);
    done();
  });
});




