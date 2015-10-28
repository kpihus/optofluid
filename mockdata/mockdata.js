var fs = require('fs'),
	readline = require('readline');
var q = require('q');
var pg = require('pg');
var escape = require('pg-escape');

var conString = process.env.DATABASE_URL || 'postgres://localhost/optofluid';

var file = '3.txt';

var p = q.defer();
var promises = [p.promise];
var collection = [];
getData(file, p);

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
	}, 20)
});

function writeToDb(item, callback){
	pg.connect(conString, function(err, client, done){
		if(err){
			console.log(err); //TODO: Remove
		}
		var now = new Date().getTime();
		var query = escape('INSERT INTO sensor ' +
			'(ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10, ch11, ch12, time) ' +
			'values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)',
			item[0]/1000, item[1]/1000, item[2]/1000, item[3]/1000, item[4]/1000, item[5]/1000, item[6]/1000, item[7]/1000, item[8]/1000, item[9]/1000, item[10]/1000, item[11]/1000, now);
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
			var data = line.split(' ');
			data.splice(0, 5);
			data.splice(data.length - 1, 1);
			if(data.length > 2){
				collection.push(data);
			}
		}
		count++;
	});
	rd.on('close', function(){
		p.resolve();
	})

}