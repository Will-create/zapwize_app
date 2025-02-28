var initialized = false;

exports.install = function() {
	ROUTE('+GET /*', index);
};

function index($) {

	var plugins = [];

	for (var key in F.plugins) {
		var item = F.plugins[key];
		if (!item.visible || item.visible($.user)) {
			var obj = {};
			obj.id = item.id;
			obj.routes = item.routes;
			obj.position = item.position;
			obj.name = TRANSLATE($.user.language || '', item.name);
			obj.icon = item.icon;
			obj.import = item.import;
			obj.hidden = item.hidden;
			plugins.push(obj);
		}
	}

	if (!initialized) {
		MAIN.db.url = $.hostname();
		MAIN.db.save();
		DATA.modify('tbl_app', { id: MAIN.id, url: MAIN.db.url, name: CONF.name, dtping: NOW }, true).id(MAIN.id);
		initialized = true;
	}

	plugins.quicksort('position');
	$.view('admin', plugins);
}

ON('service', function(counter) {

	if (counter % 1440 === 0)
		initialized = false;

	// Ping
	DATA.modify('tbl_app', { dtping: NOW }).id(MAIN.id);

});
