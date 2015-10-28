var server = require('./app').server;
var emitter = require('./app').emitter;
var services = require('./services');
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
//
var a0 = 0;//-2.32;
var a1_260 = 1;//-0.54;
var a2_300 = 1;//8.53;
var a3_315 = 1;//-1.85;
var a4_370 = 1;//-1.22;
var f1_260 = 1;//-0.74;
var f2_300 = 1;//1.49;
var f3_315 = 1;//-11.48;
var f4_370 = 1;//23.60;

//var a0 =-2.32;
//var a1_260=-0.54;
//var a2_300=8.53;
//var a3_315=-1.85;
//var a4_370=-1.22;
//var f1_260=-0.74;
//var f2_300=1.49;
//var f3_315=-11.48;
//var f4_370=23.60;

emitter.on('session_start', function(data){
	var duration = data.duration * 60 * 1000; //Minutes to millis
	lastDataTime = new Date().getTime();
	var startTime = data.start;
	endTime = startTime + duration;
	server.log('Started session:', data.sessId);
	sessId = data.sessId;
	started = true;
	emitter.emit('get_last_data');
});

emitter.on('last_data_got', function(){
	var now = new Date().getTime();
	setTimeout(function(){
		if(now >= endTime && started){
			emitter.emit('session_end');
		} else{
			emitter.emit('get_last_data');
		}
	}, 20);
});

emitter.on('get_last_data', function(){
	services.getLastData(lastDataTime, function(err, newData){
		if(err){
			server.log('Error fetching last data', err);
		} else if(newData){
			services.updateLastData(sessId, newData.id, function(err){
				if(err){
					server.log('Error updating last data', err);
				}
				emitter.emit('last_data_got');
			});
			emitter.emit('new_data', newData);

		} else{
			emitter.emit('last_data_got');
		}

	});
});

emitter.on('session_end', function(){
	if(sessId){
		dataset = [];
		ureaMaxArr = [];
		lastUreaDiff = 0;
		SDhist = [];
		SD2hist = [];
		ShiftHist = [];
		Abs1Hist = [];
		Abs2Hist = [];
		services.endSession(sessId, function(err, res){
			if(err){
				server.log(err);
			}
			started = false;
			server.log('Current session ended', sessId);
		});
	} else{
		server.log('Session not running');
	}
});

emitter.on('new_data', function haldleNewData(data){
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

	var SD2 = { //F_mean and Mean data
		F_MEAN260: SD._260flo / SD._260re,
		F_MEAN300: SD._300flo / SD._300re,
		F_MEAN315: SD._315flo / SD._315re,
		F_MEAN370: SD._370flo / SD._370re,
		MEAN260: SD._260abs,
		MEAN300: SD._300abs,
		MEAN315: SD._315abs,
		MEAN370: SD._370abs
	};
	SD2hist.push(SD2);

	//Mean 260values
	var firstMean260 = SD2hist[0].MEAN260;
	var lastMean260 = SD2hist[SD2hist.length - 1].MEAN260;
	var middleMean260 = SD2hist[SD2hist.length / 2].MEAN260;

	//Mean 300values
	var firstMean300 = SD2hist[0].MEAN300;
	var lastMean300 = SD2hist[SD2hist.length - 1].MEAN300;
	var middleMean300 = SD2hist[SD2hist.length / 2].MEAN300;

	//Mean 315values
	var firstMean315 = SD2hist[0].MEAN315;
	var lastMean315 = SD2hist[SD2hist.length - 1].MEAN315;
	var middleMean315 = SD2hist[SD2hist.length / 2].MEAN315;

	//Mean 370values
	var firstMean370 = SD2hist[0].MEAN370;
	var lastMean370 = SD2hist[SD2hist.length - 1].MEAN370;
	var middleMean370 = SD2hist[SD2hist.length / 2].MEAN370;

	var Shift = {
		SHIFT260: (firstMean260 * lastMean260 - Math.pow(middleMean260, 2)) / (firstMean260 + lastMean260 - 2 * middleMean260),
		SHIFT300: (firstMean300 * lastMean300 - Math.pow(middleMean300, 2)) / (firstMean300 + lastMean300 - 2 * middleMean300),
		SHIFT315: (firstMean315 * lastMean315 - Math.pow(middleMean315, 2)) / (firstMean315 + lastMean315 - 2 * middleMean315),
		SHIFT370: (firstMean370 * lastMean370 - Math.pow(middleMean370, 2)) / (firstMean370 + lastMean370 - 2 * middleMean370)
	};

	var Abs1 = {
		ABS260: (Math.log(SD2.MEAN260 - Shift.SHIFT260) / Math.LN10) * -1,
		ABS300: (Math.log(SD2.MEAN300 - Shift.SHIFT300) / Math.LN10) * -1
	};

	Abs1Hist.push(Abs1);

	var Abs2 = {
		ABS260: Abs1.ABS260 - Abs1Hist[0].ABS260,
		ABS300: Abs1.ABS300 - Abs1Hist[0].ABS300,
		ABS315: Math.log10(SD2hist[0].MEAN315/SD2.MEAN315),
		ABS370: Math.log10(SD2hist[0].MEAN370/SD2.MEAN370)
	}

	Abs2Hist.push(Abs2);

	urea_current = a0 + a1_260 * _260abs + a2_300 * _300abs + a3_315 * _315abs + a4_370 * _370abs + f1_260 * _260flo + f2_300 * _300flo + f3_315 * _315flo + f4_370 * _370flo;

	var urea_avg = sma20(urea_current, urea_all);

//	var nr2 = urea_all[urea_all.length-1];
//	var nr1 = urea_all[urea_all.length-2];
//	var diff = nr2-nr1;
//
//	if(lastUreaDiff>0 && diff <0){
//		ureaMaxArr.push(urea_avg);
//		for(var i = 0; i<ureaMaxArr.length; i++){
//			if(ureaMaxArr[i]>ureaMax){
//				ureaMax = ureaMaxArr[i];
//				console.log('Urea MAX',ureaMax); //TODO: Remove
//			}
//		}
//	}
//
//	lastUreaDiff=diff;
//console.log(lastUreaDiff); //TODO: Remove

	var sessiondata = {
		time: new Date().getTime(),
		urea: urea_current,
		urea_avg: urea_avg,
		urea_max: ureaMax,
		ektv: null
	};

	services.saveSessionData(sessId, sessiondata, function(err){
		if(err){
			server.log(err);
		}
	});
	//TODO: Publish new data to UI
	//server.log('New Data', sessiondata);
});

function simple_moving_averager(period){
	return function(num, all){
		all.push(num);
		if(all.length > period)
			all.splice(0, 1);  // remove the first element of the array
		var sum = 0;
		for(var i in all)
			sum += all[i];
		var n = period;
		if(all.length < period)
			n = all.length;
		return (sum / n);
	}
}



