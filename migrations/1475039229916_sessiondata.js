exports.up = function(pgm) {
  pgm.sql("ALTER TABLE session_data RENAME 'sessionId' to sess`ionid;")
};

exports.down = function(pgm) {
  pgm.sql("ALTER TABLE session_data RENAME 'sessionid' to sessionId;")
};
