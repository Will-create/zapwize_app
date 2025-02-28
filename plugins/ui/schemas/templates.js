NEWACTION('UI/Templates/list', {
	name: 'List of form templates',
	permissions: 'ui',
	action: function($) {
		DATA.find('tbl_template').where('appid', MAIN.id).sort('name').fields('id,name,icon').callback($);
	}
});

NEWACTION('UI/Templates/read', {
	name: 'Read form',
	input: '*id:String',
	permissions: 'ui',
	action: async function($, model) {
		var response = await DATA.read('tbl_template').fields('data').id(model.id).where('appid', MAIN.id).error(404).promise($);
		$.callback({ editor: response.data });
	}
});

NEWACTION('UI/Templates/save', {
	name: 'Save form',
	input: '*data:Object',
	permissions: 'ui',
	action: async function($, model) {

		var data = model.data;
		var obj = {};
		obj.id = data.id || UID();
		obj.appid = MAIN.id;
		obj.icon = data.icon;
		obj.name = data.name;
		obj.data = JSON.stringify(data);

		if (data.id) {
			obj.dtupdated = NOW;
			DATA.modify('tbl_template', obj, true).id(obj.id);
		} else {
			obj.dtcreated = NOW;
			DATA.insert('tbl_template', obj);
		}

		$.success(obj.id);
	}
});

NEWACTION('UI/Templates/remove', {
	name: 'Remove form',
	input: '*id:String',
	permissions: 'ui',
	action: function($, model) {
		DATA.remove('tbl_template').id(model.id).where('appid', MAIN.id).error(404).callback($.done(model.id));
	}
});