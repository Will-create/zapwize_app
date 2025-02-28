// Flow.cmd('', 'SYNCDATA', model);

NEWACTION('Flows/editor', {
	name: 'Get Flow editor',
	action: function($) {
		var socket = encodeURIComponent($.controller.hostname('/flows/---/?token=' + (MAIN.db.token || ''))).replace(/---/, '{0}');
		var url = CONF.floweditor + '/?socket=' + socket;
		$.success(url);
	}
});

NEWACTION('Flows/list', {
	name: 'List of FlowStreams',
	action: function($) {
		var arr = [];
		for (var key in Flow.db) {
			var item = Flow.db[key];
			if (key !== 'ui')
				arr.push({ id: key, icon: item.icon, color: item.color, name: item.name, running: Flow.instances[key] ? true : false, dtcreated: item.dtcreated, dtupdated: item.dtupdated, group: item.group });
		}
		arr.quicksort('name');
		$.callback(arr);
	}
});

NEWACTION('Flows/read', {
	name: 'Read FlowStream meta',
	input: '*id',
	action: function($, model) {

		var item = Flow.db[model.id];

		if (!item) {
			$.invalid(404);
			return;
		}

		var model = {};
		model.id = item.id;
		model.icon = item.icon;
		model.color = item.color;
		model.name = item.name;
		model.group = item.group;

		$.callback(model);

	}
});

NEWACTION('Flows/create', {
	name: 'Create a new FlowStream',
	input: '*name:String,icon:Icon,group:String,color:Color',
	action: function($, model) {

		PATH.fs.readFile(PATH.templates('template-flow.json'), function(err, response) {

			response = response.toString('utf8').parseJSON(true);
			response.id = GUID(10);
			response.icon = model.icon;
			response.color = model.color;
			response.name = model.name;
			response.group = model.group;
			response.dtcreated = new Date();
			response.proxypath = '/{0}/'.format(response.id);

			Flow.save(response);
			Flow.load(response, function() {
				setTimeout(() => Flow.instances[response.id] && Flow.instances[response.id].cmd('REFRESHDB', MAIN.id), 2000);
				$.success(response.id);
			});
		});

	}
});

NEWACTION('Flows/update', {
	name: 'Update FlowStream',
	input: '*id,*name,icon:Icon,group,color:Color',
	action: function($, model) {

		if (model.id === 'ui') {
			$.invalid(404);
			return;
		}

		var flow = Flow.db[model.id];
		if (!flow) {
			$.invalid(404);
			return;
		}

		for (let key in model)
			flow[key] = model[key];

		Flow.save(flow);
		Flow.reload(flow);
		$.success(model.id);
	}
});

NEWACTION('Flows/clone', {
	name: 'Clone flow',
	input: '*id',
	action: function($, model) {

		var item = Flow.db[model.id];

		if (!item || item.id === 'ui') {
			$.invalid(404);
			return;
		}

		var newbie = CLONE(item);

		newbie.id = GUID(10);
		newbie.name += ' (CLONED)';
		newbie.dtcreated = newbie.dtupdated = NOW;
		newbie.proxypath = '/{0}/'.format(newbie.id);

		Flow.save(newbie);
		Flow.load(newbie, $.done(newbie.id));
	}
});

NEWACTION('Flows/remove', {
	name: 'Remove FlowStream',
	input: '*id',
	action: function($, model) {

		if (model.id === 'ui') {
			$.invalid(404);
			return;
		}

		if (Flow.db[model.id]) {
			Flow.remove(model.id);
			DATA.remove('tbl_flow').id(model.id).where('appid', MAIN.id).callback($.done(model.id));
		} else
			$.invalid(404);
	}
});