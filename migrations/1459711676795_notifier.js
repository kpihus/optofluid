exports.up = function(pgm) {
  pgm.sql("CREATE FUNCTION notify_trigger() RETURNS trigger AS $$ " +
    "DECLARE " +
    "BEGIN " +
    "PERFORM pg_notify('watchers', TG_TABLE_NAME || ',id,' || NEW.id ); " +
    "RETURN new; " +
    "END; " +
    "$$ LANGUAGE plpgsql; " +
    "CREATE TRIGGER watched_table_trigger AFTER INSERT ON sensor " +
    "FOR EACH ROW EXECUTE PROCEDURE notify_trigger()");
};

exports.down = function(pgm) {
    pgm.sql("DROP TRIGGER watched_table_trigger ON sensor;")
};
