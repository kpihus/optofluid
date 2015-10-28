exports.up = function(pgm) {
	pgm.createTable('patient', {
		id: {type: 'bigserial', notNull: true, primaryKey: true},
		firstname: {type: 'string', notNull: true},
		lastname: {type: 'string', notNull: true},
		idcode: {type: 'bigint', notNull: true}
	})
};

exports.down = function(pgm) {
	pgm.dropTable('patient');
};
