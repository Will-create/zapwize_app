var QBPG = require('querybuilderpg');

// A default REST connection
NEWDB('default', function(filter, callback) {
	var opt = {};
	opt.url = CONF.database;
	opt.method = 'POST';
	opt.type = 'json';
	opt.keepalive = true;
	opt.body = JSON.stringify(filter);
	opt.callback = function(err, response) {
		if (err) {
			callback(err);
		} else {
			var data = response.body.parseJSON();
			var iserr = response.status !== 200;
			callback(iserr ? (data instanceof Array ? data[0].error : data) : null, iserr ? null : data);
		}
	};
	REQUEST(opt);
});

if (CONF.database) {
	if (!CONF.database.isURL())
		QBPG.init('', CONF.database);
} else {
	PATH.fs.readFile(PATH.root('config'), 'utf8', function(err, response) {
		LOADCONFIG(response);
		if (!CONF.database.isURL())
			QBPG.init('', CONF.database);
	});
}