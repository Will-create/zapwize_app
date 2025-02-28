NEWACTION('UI/editor', {
	name: 'Get editor URL address',
	action: function($) {
		$.success(CONF.uibuilder);
	}
});

NEWACTION('UI/list', {
	name: 'List of items',
	action: function($) {
		DATA.find('tbl_ui').fields('id,type,name,icon,color,inputs,outputs,group,dtcreated,dtupdated').where('appid', MAIN.id).sort('dtcreated').callback($);
	}
});

NEWACTION('UI/inputs', {
	name: 'List of Flow inputs',
	action: function($) {
		DATA.find('tbl_nav').fields('id,name,color,icon').sort('sortindex').where('appid', MAIN.id).callback($);
	}
});

NEWACTION('UI/save', {
	name: 'Save item',
	input: 'data:Object',
	action: function($, model) {
		var data = model.data;
		var item = {};

		item.data = data.compiled;
		delete data.compiled;

		if (!item.data)
			item.data = null;

		item.id = data.id;
		item.dtupdated = NOW;
		item.appid = MAIN.id;
		item.name = data.name;
		item.icon = data.icon;
		item.color = data.color;
		item.type = data.type;
		item.group = data.group;
		item.inputs = JSON.stringify(data.inputs);
		item.outputs = JSON.stringify(data.outputs);
		item.editor = JSON.stringify(data);

		DATA.modify('tbl_ui', item, true).id(item.id).where('appid', MAIN.id).callback(function(err) {
			if (err) {
				$.invalid(err);
			} else {
				$.success(item.id);
				item.data && setTimeout2('UIRebuild', () => ACTION('UI/rebuild').callback(NOOP), 1000);
			}
		});

	}
});

NEWACTION('UI/clone', {
	name: 'Clone item',
	input: '*id',
	action: async function($, model) {

		var item = await DATA.read('tbl_ui').id(model.id).where('appid', MAIN.id).error(404).promise($);

		item.id = Date.now().toString(36) + GUID(5);
		item.name += ' (CLONED)';
		item.dtcreated = item.dtupdated = NOW;
		item.outputs = JSON.stringify(item.outputs);
		item.inputs = JSON.stringify(item.inputs);

		item.editor.id = item.id;

		if (item.data)
			item.data.id = item.id;

		item.editor = JSON.stringify(item.editor);
		item.data = JSON.stringify(item.data);

		DATA.insert('tbl_ui', item).callback($.done(item.id));
	}
});

NEWACTION('UI/remove', {
	name: 'Remove item',
	input: '*id',
	action: async function($, model) {
		await DATA.remove('tbl_ui').id(model.id).where('appid', MAIN.id).error(404).promise($);
		$.success(model.id);
		setTimeout2('UIRebuild', () => ACTION('UI/rebuild').callback(NOOP), 1000);
	}
});

NEWACTION('UI/export', {
	name: 'List of builds',
	action: function($) {
		DATA.find('tbl_ui').fields('id,icon,group,name,type,inputs,outputs').where('appid', MAIN.id).where('data IS NOT NULL').callback($);
	}
});

NEWACTION('UI/rebuild', {
	name: 'Rebuild Flow',
	action: async function($) {

		var permissions = [];
		var response = await DATA.find('tbl_ui').fields('id,name,type').where('appid', MAIN.id).where('data IS NOT NULL').promise($);

		for (var m of response) {
			if (m.type !== 'part')
				permissions.push({ id: m.id, name: m.name, type: 'app' });
		}

		OpenPlatform.permissions = OpenPlatform.permissions.remove('type', 'app');

		if (permissions.length)
			OpenPlatform.permissions.push.apply(OpenPlatform.permissions, permissions);

		Flow.instances.ui && Flow.instances.ui.cmd('REFRESHUI', MAIN.id);
		$.success();
	}
});

NEWACTION('UI/flow', {
	name: 'UI Flow',
	action: function($) {
		var socket = encodeURIComponent($.controller.hostname('/flows/ui/?token=' + (CONF.flowtoken || '')));
		var url = CONF.floweditor + '/?socket=' + socket;
		$.success(url);
	}
});

NEWACTION('UI/views', {
	name: 'List of data views',
	action: async function($) {
		var response = await DATA.find('tbl_view').fields('id,flowid,name,icon,color').where('appid', MAIN.id).sort('name').promise($);
		for (var m of response) {
			m.id = '/{flowid}/{id}/'.args(m);
			m.flowid = undefined;
		}
		$.callback(response);
	}
});