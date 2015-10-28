exports.up = function(pgm){
	pgm.dropColumns('sensor', 'time');
	pgm.addColumns('sensor', {time: {type: 'bigint'}});
};

exports.down = function(pgm){

};
