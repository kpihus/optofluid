var fs = require('fs'),
	readline = require('readline');
var q = require('q');
var pg = require('pg');
var escape = require('pg-escape');

var conString = process.env.DATABASE_URL || 'postgres://localhost/optofluid';

var file = 'testfile.txt';

var p = q.defer();
var promises = [p.promise];
var collection = [];

pg.connect(conString, function(err, client, done){
	if(err){
		console.log(JSON.stringify(err));
		process.exit();
	}
	var query = escape('TRUNCATE TABLE sensor');
	client.query(query, function(err, res){
		if(err){
			console.log(JSON.stringify(err));
			process.exit();
		}
		getData(file, p);

	})
});





q.all(promises).done(function(){
	var count = 0;
	setInterval(function(){
		var item = collection[count];
		count++;
		console.log(count); //TODO: Remove
		writeToDb(item, function(err){
			if(err){
				console.log(err);
				console.log('Exiting now ...');
				process.exit();
			}

		});
	}, 2)
});

//Ch1:260RE  Ch2:260ABS Ch3:260FLO Ch4:300RE Ch5:300ABS Ch6:300FLO Ch7:315RE Ch8:315ABS Ch9:315FLO Ch10:370RE Ch11:370ABS Ch12:370FLO
// 0   1   2   3   4   5
//240	254	260	280	297	315

// 1  2  3   4   5   6   7   8   9   10  11  12
//    2          3           4           5


function writeToDb(item, callback){
	console.log(item); //TODO: Remove

	if(typeof item == 'undefined'){
		process.exit();
	}
	pg.connect(conString, function(err, client, done){
		if(err){
			console.log(err); //TODO: Remove
		}
		var now = new Date().getTime();
		var query = escape('INSERT INTO sensor ' +
			'(ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10, ch11, ch12, time) ' +
			'values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)',
			0, item[2], item[6], 0, item[3], item[7], 0, item[4], item[8], 0, item[5], item[9], now);
		console.log(query); //TODO: Remove
		client.query(query, function(err, res){
			done();
			if(err){
				return callback(err);
			} else if(res.rowCount !== 1){
				return callback(new Error('Insert did not went well'));
			}
		})
	});
}

function getData(file, p){
	console.log('getting data'); //TODO: Remove
	var rd = readline.createInterface({
		input: fs.createReadStream(file),
		output: process.stdout,
		terminal: false
	});



	var count = 0;
	rd.on('line', function(line){
		if(count > 3){
			var data = line.split('\t');

			//data.splice(0, 5);
			//data.splice(data.length - 1, 1);
			if(data.length > 2){
				console.log(data); //TODO: Remove
				collection.push(data);
			}
		}
		count++;
	});
	rd.on('close', function(){
		p.resolve();
	})

}