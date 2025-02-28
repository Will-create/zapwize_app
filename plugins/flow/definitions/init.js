Flow.viewscache = {};

function skip(key, value) {
	return key === 'unixsocket' || key === 'env' ? undefined : value;
}

Flow.on('save', function(flow) {

	flow.dtupdated = NOW = new Date();
	flow.size = Buffer.byteLength(JSON.stringify(flow));

	var id = flow.id;
	var views = [];
	var appid = MAIN.id;

	for (var key in flow.design) {
		var instance = flow.design[key];
		if (instance.component === 'viewreq')
			views.push({ id: key, flowid: id, appid: appid, name: instance.config.name, url: flow.origin + flow.proxypath + instance.id + '/', dtupdated: NOW });
	}

	var pk = id;

	DATA.modify('tbl_flow', { id: pk, appid: appid, group: flow.group, name: flow.name, icon: flow.icon, color: flow.color, proxy: flow.proxypath, origin: flow.origin, size: flow.size, data: JSON.stringify(flow, skip), dtupdated: NOW }, true).id(pk).where('appid', appid);

	var hash = HASH(JSON.stringify(views)).toString(36);
	var cache = Flow.viewscache[id];

	if (cache && cache === hash)
		return;

	Flow.viewscache[id] = hash;
	var viewid = [];

	views.wait(function(item, next) {
		viewid.push(item.id);
		DATA.modify('tbl_view', item, true).id(item.id).where('appid', appid).callback(next);
	}, function() {
		var builder = DATA.modify('tbl_view', { isremoved: true, dtremoved: NOW }).where('appid', appid).where('flowid', id);
		if (viewid.length)
			builder.notin('id', viewid);
	});

	if (id === 'ui') {

		var permissions = [];

		for (var key in flow.design) {
			var item = flow.design[key];
			if (item && item.component.substring(0, 5) === 'uinav')
				permissions.push({ id: item.id, name: item.config.name, type: 'app' });
		}

		OpenPlatform.permissions = OpenPlatform.permissions.remove('type', 'app');

		if (permissions.length)
			OpenPlatform.permissions.push.apply(OpenPlatform.permissions, permissions);
	}

});

ON('start', function() {
	DATA.find('tbl_flow').fields('data').where('appid', MAIN.id).data(function(items) {
		items.wait(function(item, next) {
			item.data.worker = 'fork';
			Flow.load(item.data, next);
		}, function() {
			// Creates automatically UI Flow
			if (!Flow.db.ui) {
				PATH.fs.readFile(PATH.templates('template-flow-ui.json'), 'utf8', function(err, response) {
					Flow.load(response.parseJSON(true), NOOP);
				});
			}
		});
	});
});
