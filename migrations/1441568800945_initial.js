exports.up = function(pgm) {
	pgm.createTable('sensor',{
		id: {type: 'bigserial', notNull: true, primaryKey: true},
		time: { type: 'timestamp', notNull: true },
		sessionid: {type: 'integer'},
		ch1: {type: 'float'},
		ch2: {type: 'float'},
		ch3: {type: 'float'},
		ch4: {type: 'float'},
		ch5: {type: 'float'},
		ch6: {type: 'float'},
		ch7: {type: 'float'},
		ch8: {type: 'float'},
		ch9: {type: 'float'},
		ch10: {type: 'float'},
		ch11: {type: 'float'},
		ch12: {type: 'float'}
	})
};

exports.down = function(pgm) {
	pgm.dropTable('sensor');
};
