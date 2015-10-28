exports.up = function(pgm) {
	pgm.createTable('session_data',{
		id: {type: 'bigserial', notNull: true, primaryKey: true},
		time: {type: 'bigint', notNull: true},
		sessionId: {type: 'bigint'},
		data: {type: 'jsonb'}
	})
};

exports.down = function(pgm) {
	pgm.dropTable('session_data');
};
