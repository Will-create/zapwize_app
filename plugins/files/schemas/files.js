NEWACTION('Files/list', {
	name: 'List of files',
	permissions: 'files',
	action: function($) {
		DATA.list('tbl_file').autoquery($.query, 'id,url,name,ext,size:Number,width:Number,height:Number,dtcreated:Date', 'dtcreated_desc', 100).where('appid', MAIN.id).callback($);
	}
});

NEWACTION('Files/remove', {
	name: 'Remove file',
	input: '*id:UID',
	permissions: 'files',
	action: async function($, model) {
		await DATA.remove('tbl_file').id(model.id).where('appid', MAIN.id).error(404).promise($);
		FILESTORAGE('files').remove(model.id, NOOP);
		$.success();
	}
});