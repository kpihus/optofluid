exports.up = function(pgm) {
	pgm.createTable('session',{
		id: {type: 'bigserial', notNull: true, primaryKey: true},
		time: {type: 'bigint', notNull: true},
		data: {type: 'jsonb'}
	})
};

exports.down = function(pgm) {
	pgm.dropTable('session');
};
