var server = require('./app').server;
var emitter = require('./app').emitter;
var services = require('./services');
var q = require('q');
var intervalId;
server.log('Worker started...'); //TODO: Remove
var sessId;
var dataset = [];
var urea_all = [];
var lastUreaDiff = 0;
var ureaMaxArr = [];
var endTime;
var lastDataTime;
var started = false;

var SDhist = [];
var SD2hist = [];
var ShiftHist = [];
var Abs1Hist = [];
var Abs2Hist = [];
var median300 = [];

//Urea coefficents
var a0 = -2.32;
var a1_260 = -0.54;
var a2_300 = 8.53;
var a3_315 = -1.85;
var a4_370 = -1.22;
var f1_260 = -0.74;
var f2_300 = 1.49;
var f3_315 = -11.48;
var f4_370 = 23.60;

//var a0 =-2.32;
//var a1_260=-0.54;
//var a2_300=8.53;
//var a3_315=-1.85;
//var a4_370=-1.22;
//var f1_260=-0.74;
//var f2_300=1.49;
//var f3_315=-11.48;
//var f4_370=23.60;

emitter.on('session_start', function (data) {
  var duration = data.duration * 60 * 1000; //Minutes to millis
  lastDataTime = new Date().getTime();
  var startTime = data.start;
  endTime = startTime + duration;
  server.log('Started session:', data.sessId);
  sessId = data.sessId;
  started = true;
  emitter.emit('get_last_data');
});

emitter.on('last_data_got', function () {
  var now = new Date().getTime();
  var prom = [];
  setTimeout(function () {
    if (now >= endTime && started) {
      emitter.emit('session_end');
    } else {
      q.all(prom).done(function(){
        var p = q.defer;
        prom.push(p.promise);
        emitter.emit('get_last_data', p);
      })

    }
  }, 20);
});

emitter.on('get_last_data', function (p) {
  services.getLastData(lastDataTime, function (err, newData) {
    if (err) {
      server.log('Error fetching last data', err);
    } else if (newData) {
      services.updateLastData(sessId, newData.id, function (err) {
        if (err) {
          server.log('Error updating last data', err);
        }
        emitter.emit('last_data_got');
      });
      emitter.emit('new_data', newData, p);

    } else {
      emitter.emit('last_data_got');
    }

  });
});

emitter.on('session_end', function () {
  if (sessId) {
    dataset = [];
    ureaMaxArr = [];
    lastUreaDiff = 0;
    SDhist = [];
    SD2hist = [];
    ShiftHist = [];
    Abs1Hist = [];
    Abs2Hist = [];
    services.endSession(sessId, function (err, res) {
      if (err) {
        server.log(err);
      }
      started = false;
      server.log('Current session ended', sessId);
    });
  } else {
    server.log('Session not running');
  }
});

emitter.on('new_data', function haldleNewData(data, p) {
  exports.handleData(data, function (err, res) {
    if (err) {
      server.log(err);
    } else {
      services.saveSessionData(sessId, res, function (err) {
        if (err) {
          server.log(err);
        }
        p.resolve();
      });
    }
  });
});

exports.handleData = function (data, callback) {
  var dataString = JSON.stringify(data);
  var sma20 = simple_moving_averager(20);
  var ureaMax = 0;

  //Get latest dataset
  //Ch1:260RE  Ch2:260ABS Ch3:260FLO Ch4:300RE Ch5:300ABS Ch6:300FLO Ch7:315RE Ch8:315ABS Ch9:315FLO Ch10:370RE Ch11:370ABS Ch12:370FLO

  var SD = { //Raw sensor data
    _260re: data.ch1,
    _260abs: data.ch2,
    _260flo: data.ch3,
    _300re: data.ch4,
    _300abs: data.ch5,
    _300flo: data.ch6,
    _315re: data.ch7,
    _315abs: data.ch8,
    _315flo: data.ch9,
    _370re: data.ch10,
    _370abs: data.ch11,
    _370flo: data.ch12
  };
  SDhist.push(SD);

  var last5 = SDhist.slice(SDhist.length-4);

  console.log('LAST5',last5);


  var SD2 = { //F_mean and Mean data
    F_MEAN260: SD._260abs * 0.91,
    F_MEAN300: SD._300abs * 1.36,
    F_MEAN315: SD._315abs * 0.128,
    F_MEAN370: SD._370abs * 0.043,
    MEAN260: SD._260abs,
    MEAN300: SD._300abs,
    MEAN315: SD._315abs,
    MEAN370: SD._370abs
  };
  SD2hist.push(SD2);




  var Abs2 = {
    ABS260: SD._260abs,
    ABS300: SD._300abs,
    ABS315: SD._315abs,
    ABS370: SD._370abs
  };
  Abs2Hist.push(Abs2);


  //urea_current = a0 + a1_260 * _260abs + a2_300 * _300abs + a3_315 * _315abs + a4_370 * _370abs + f1_260 * _260flo + f2_300 * _300flo + f3_315 * _315flo + f4_370 * _370flo;
  if (SDhist.length > 1) {
    urea_current = a0 + a1_260 * Abs2.ABS260 + a2_300 * Abs2.ABS300 + a3_315 * Abs2.ABS315 + a4_370 * Abs2.ABS370 + f1_260 * SD2.F_MEAN260 + f2_300 * SD2.F_MEAN300 + f3_315 * SD2.F_MEAN315 + f4_370 * SD2.F_MEAN370;
  } else {
    urea_current = 0;
  }

  var urea_avg = sma20(urea_current, urea_all);


  var sessiondata = {
    time: new Date().getTime(),
    urea: urea_current,
    urea_avg: urea_avg,
    urea_max: ureaMax,
    ektv: null
  };

  callback(null, sessiondata);

  //TODO: Publish new data to UI
  //server.log('New Handler', sessiondata);
};

function simple_moving_averager(period) {
  return function (num, all) {
    all.push(num);
    if (all.length > period)
      all.splice(0, 1);  // remove the first element of the array
    var sum = 0;
    for (var i in all)
      sum += all[i];
    var n = period;
    if (all.length < period)
      n = all.length;
    return (sum / n);
  }
}

exports.median = function (arr) {
  arr.sort();
  console.log(arr);
  var median = 0;
  switch (arr.length % 2) {
    case 0:
      var med1 = arr[Math.ceil(arr.length / 2) - 1];
      var med2 = arr[Math.ceil(arr.length / 2)];
      median = (med1 + med2) / 2;
      break;
    case 1:
      median = arr[Math.ceil(arr.length / 2) - 1];
      break;
  }
  return median;
};



