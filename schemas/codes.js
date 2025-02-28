NEWACTION('Codes/list', {
	name: 'List of code lists',
	action: function($) {
		DATA.find('tbl_db').fields('id,name').where('appid', MAIN.id).sort('name').callback($);
	}
});

NEWACTION('Codes/find', {
	name: 'Find in the codelist',
	query: 'search:String',
	input: '*id',
	action: async function($, model) {
		var item = await DATA.read('tbl_db').fields('id').id(model.id).where('appid', MAIN.id).promise($);
		if (item) {
			var builder = DATA.find('db.db' + MAIN.id + item.id).fields('id,name').sort('name');
			$.query.search && builder.search('name', $.query.search);
			builder.take(50);
			builder.callback($);
		} else
			$.callback(EMPTYARRAY);
	}
});

NEWACTION('Codes/db', {
	name: 'DB listing',
	input: '*id',
	action: async function($, model) {
		var item = await DATA.read('tbl_db').fields('id,columns').id(model.id).where('appid', MAIN.id).promise($);
		if (item) {
			var filter = ['id,name'];
			for (var m of item.columns)
				filter.push(m.id + ':' + m.type);
			DATA.list('db.db' + MAIN.id + item.id).autoquery($.query, filter.join(','), 'dtcreated_desc').callback($);
		} else
			$.callback({ items: [], pages: 0, page: 1, count: 0 });
	}
});

NEWACTION('Codes/read', {
	name: 'Read codelist',
	input: '*id,*rowid',
	action: async function($, model) {
		var item = await DATA.read('tbl_db').fields('id').id(model.id).where('appid', MAIN.id).promise($);
		if (item)
			DATA.read('db.db' + MAIN.id + item.id).fields('id,name').id(model.rowid).callback($);
		else
			$.callback(null);
	}
});