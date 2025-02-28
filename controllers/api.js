exports.install = function() {

	// API
	ROUTE('+API  ?  -account    -->  Account/session');
	ROUTE('+API  ?  -cl_list    -->  Codes/list');
	ROUTE('+API  ?  +cl_find    -->  Codes/find');
	ROUTE('+API  ?  +cl_read    -->  Codes/read');
	ROUTE('+API  ?  +cl_db      -->  Codes/db');

	ROUTE('+POST    /upload/  @upload <5MB', upload); // Max. 5 MB

	// Files
	ROUTE('FILE     /download/*.*', download);
	ROUTE('FILE     /data/*.json', json);

};

async function upload($) {

	var output = [];
	var hostname = $.hostname();

	MAIN.db.url = hostname;
	NOW = new Date();

	for (var file of $.files) {
		var response = await file.fs('files', UID());
		response.url = hostname + '/download/{0}.{1}'.format(response.id.sign(MAIN.id), response.ext);

		var meta ={};
		meta.id = response.id;
		meta.ext = response.ext;
		meta.size = response.size;
		meta.dtcreated = NOW;
		meta.width = response.width;
		meta.height = response.height;
		meta.name = response.name;
		meta.appid = MAIN.id;
		meta.url = MAIN.db.url + '/download/' + meta.id.sign(meta.appid) + '.' + meta.ext;
		await DATA.insert('tbl_file', meta).promise();

		output.push(response);
	}

	$.json(output);
}

function download($) {

	var name = $.split[1];
	var index = name.lastIndexOf('-');
	var id = name.substring(0, index);

	name = name.substring(0, name.lastIndexOf('.'));

	if (name === id.sign(MAIN.id))
		$.filefs('files', id);
	else
		$.invalid(404);
}

function json($) {

	var filename = $.split[1];
	var index = filename.lastIndexOf('.');
	var id = filename.substring(0, index);

	index = id.indexOf('_');

	if (index !== -1)
		id = id.substring(0, index);

	DATA.read('tbl_ui').id(id).where('appid', MAIN.id).fields((index === -1 ? 'data' : 'editor') + '::text AS data,name').error(404).callback(function(err, response) {
		if (err || !response.data)
			$.invalid(404);
		else
			$.jsonstring(response.data);
	});
}