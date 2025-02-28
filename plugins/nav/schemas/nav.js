function refresh() {
	Flow.instances.ui && Flow.instances.ui.cmd('REFRESHUI', MAIN.id);
}

NEWACTION('Nav/list', {
	name: 'List of navigation items',
	permissions: 'nav',
	action: function($) {
		DATA.find('tbl_nav').fields('id,name,icon,color,sortindex').where('appid', MAIN.id).sort('sortindex').callback($);
	}
});

NEWACTION('Nav/create', {
	name: 'Create a navigation item',
	input: '*name,icon:Icon,color:Color',
	permissions: 'nav',
	action: async function($, model) {
		model.id = UID();
		model.dtcreated = NOW;
		model.sortindex = await DATA.count('tbl_nav').where('appid', MAIN.id).promise($);
		model.appid = MAIN.id;
		await DATA.insert('tbl_nav', model).error(404).promise($);
		$.success(model.id);
		refresh();
	}
});

NEWACTION('Nav/update', {
	name: 'Update a navigation item',
	input: '*id:UID,*name,icon:Icon,color:Color',
	permissions: 'nav',
	action: async function($, model) {
		await DATA.update('tbl_nav', model).id(model.id).where('appid', MAIN.id).error(404).promise($);
		$.success(model.id);
		refresh();
	}
});

NEWACTION('Nav/read', {
	name: 'Read a navigation item',
	input: '*id:UID',
	permissions: 'nav',
	action: function($, model) {
		DATA.one('tbl_nav').id(model.id).where('appid', MAIN.id).error(404).callback($);
	}
});

NEWACTION('Nav/remove', {
	name: 'Remove a navigation item',
	input: '*id:UID',
	permissions: 'nav',
	action: async function($, model) {
		await DATA.remove('tbl_nav').id(model.id).where('appid', MAIN.id).error(404).promise($);
		refresh();
		$.success(model.id);
	}
});

NEWACTION('Nav/sort', {
	name: 'Save positioning of nav items',
	input: '*id',
	permissions: 'nav',
	action: async function($, model) {

		var arr = model.id.split(',');

		for (let i = 0; i < arr.length; i++) {
			let id = arr[i];
			await DATA.modify('tbl_nav', { sortindex: i }).where('appid', MAIN.id).id(id).promise();
		}

		refresh();
		$.success();
	}
});