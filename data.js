
var Handler = function (sessid) {
  var self = this;
  self.sessid = sessid;
  self.lastDataTime = 0;
  self.started = false;
  self.startphase = 0;
  self.raw = [];
  self.mean = [];
  self.abs1 = [];
  self.abs2 = [];

  self.c0 = 0;

  var dataset = {

    c0: 0,
    ct: 0,
    spKtVb: 0,
    eKtVb: 0,
    RR: 0

  };


  var _300abs = [];
  var _300med = [];
  var _300der = [];

  var coef = {
    a0: -2.32,
    a1_260: -0.54,
    a2_300: 8.53,
    a3_315: -1.85,
    a4_370: -1.22,
    f1_260: -0.74,
    f2_300: 1.49,
    f3_315: -11.48,
    f4_370: 23.60
  };
  self.cleanAll = function () {
    //TODO:
  };

  //Math functions
  self.sumArr = function (arr) {
    var sum = 0;
    for (var i = 0; i < arr.length; i++) {
      sum = sum + arr[i];
    }
    return sum;
  };
  self.median = function (arr) {
    arr.sort();
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
  self.average = function(arr){
    var sum = 0;
    for(var i= 0; i<arr.length; i++){
      sum+=arr[i];
    }
    return sum/arr.length;
  };

  //Handler handling
  var mapData = function(data){
    return { //Raw sensor data
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
  };

  self.addRaw = function (data) {
    self.lastDataTime = data.time;
    if(!self.started){
      startPhase(data);
    }else{
      self.raw.push(mapData(data));
    }
  };
  var startPhase = function(data){
    switch (self.startphase){
      case 0:
        if(findPhaseOne(data)){
          self.startphase =1;
          _300abs = [];
          _300med = [];
          _300der = [];
        }
        break;
      case 1:
        if(findPhaseTwo(data)){
          self.startphase=2;
          _300abs = [];
          _300med = [];
          _300der = [];
        }
        break;
      case 2:
        if(findPhaseThree(data)){
          self.startphase = 3;
          self.started = true;
          self.raw.push(mapData(data));
        }

        break;
      case 3:

        break;
    }
  };

  var checkDerivative = function(arr, fall){
      for(var i=0; i<arr.length; i++){
        if(fall){
          if(arr[i]>0){
            return false;
          }
        }else{
          if(arr[i]<0){
            return false;
          }
        }
      }
      return true;
  };

  var findPhaseOne = function(data){
    _300abs.push(data.ch5);
    var items = _300abs.slice(_300abs.length-5);
    _300med.push(self.median(items));
    _300der.push(_300med[_300med.length-1]-_300med[_300med.length-2]);
    if(_300der.length>15){
      return checkDerivative(_300der.slice(_300der.length-15), true);
    }
    return false;
  };

  var findPhaseTwo = function(data){
   _300abs.push(data.ch5);
    var items = _300abs.slice(_300abs.length-5);
    _300med.push(self.median(items));
    _300der.push(_300med[_300med.length-1]-_300med[_300med.length-2]);
    if(_300der.length>5){
      return checkDerivative(_300der.slice(_300der.length-5), false);
    }
    return false;

  };
  var findPhaseThree = function(data){
    _300abs.push(data.ch5);
    var items = _300abs.slice(_300abs.length -5);
    _300med.push(self.average(items));
    _300der.push(_300med[_300med.length-1]-_300med[_300med.length-2]);
    if(_300der.length>5){
      return checkDerivative(_300der.slice(_300der.length-5), true);
    }
  };


  var calcMean = function () {
    var items = self.raw[self.raw.length - 1];
    var data = {
      'F_MEAN': {
        260: items._260flo / items._260re,
        300: items._300flo / items._300re,
        315: items._315flo / items._315re,
        370: items._370flo / items._370re
      },
      'MEAN': {
        260: items._260abs,
        300: items._300abs,
        315: items._315abs,
        370: items._370abs
      }
    };
    self.mean.push(data);
  };

  /* get last mean value */
  var getMean = function (type, pos) {
    switch (pos) {
      case 'first':
        return self.mean[0].MEAN[type];
        break;
      case 'last':
        return self.mean[self.mean.length - 1].MEAN[type];
        break;
    }

  };

  var calcAbs1 = function () {
    var item = {
      260: (Math.log(getMean(260, 'last') - self.getShift(260)) / Math.LN10) * -1,
      300: (Math.log(getMean(300, 'last') - self.getShift(300)) / Math.LN10) * -1
    };
    self.abs1.push(item);
  };

  var calcAbs2 = function () {
    var item = {
      ABS260: self.abs1[self.abs1.length - 1][260] - self.abs1[0][260],
      ABS300: self.abs1[self.abs1.length - 1][300] - self.abs1[0][300],
      ABS315: Math.log(getMean(315, 'first') / getMean(325, 'last'), 10),
      ABS370: Math.log(getMean(370, 'first') / getMean(370, 'last'), 10)
    };
    self.abs2.push(item);
  };

  /*Get Mean over Time */
  self.getMOT = function (type) {
    var mid = Math.floor(self.mean.length / 2);
    return {
      first: self.mean[0].MEAN[type],
      middle: self.mean[mid].MEAN[type],
      last: self.mean[self.mean.length - 1].MEAN[type]
    }
  };
  /* Get shift */
  self.getShift = function (type) {
    return (self.getMOT(type).first * self.getMOT(type).last - Math.pow(self.getMOT(type).middle, 2)) / (self.getMOT(type).first + self.getMOT(type).last - 2 * self.getMOT(type).middle);
  };

  //a0+a1*A260+a2*A300+a3*A315+a4*A370+f1*f260+f2*f300+f3*F315+f4*F370
  self.urea = function () {
    if(!self.started){
      throw new Error('Session not started yet');
    }

    if (self.raw.length > 0) {
      var item = self.raw[self.raw.length - 1];
      var urea = coef.a0 +
        coef.a1_260 * item._260abs +
        coef.a2_300 * item._300abs +
        coef.a3_315 * item._315abs +
        coef.a4_370 * item._370abs +
        coef.f1_260 * item._260flo +
        coef.f2_300 * item._300flo +
        coef.f3_315 * item._315flo +
        coef.f4_370 * item._370flo;
      if(self.c0==0){
        self.c0=urea;
      }
      return parseFloat(Math.round(urea * 10) / 10);
    } else {
      return 0;
    }

  }


};

exports.Handler = Handler;