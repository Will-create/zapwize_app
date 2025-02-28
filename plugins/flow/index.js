exports.icon = 'ti ti-network';
exports.name = '@(Flows)';
exports.position = 2;
exports.permissions = [{ id: 'flows', name: 'Flows' }];
exports.visible = user => user.sa || user.permissions.includes('flows');

exports.install = function() {

	ROUTE('+API    ?    -flows                -->    Flows/list');
	ROUTE('+API    ?    -flows_read           -->    Flows/read');
	ROUTE('+API    ?    +flows_create         -->    Flows/create');
	ROUTE('+API    ?    +flows_update         -->    Flows/update');
	ROUTE('+API    ?    -flows_remove         -->    Flows/remove');
	ROUTE('+API    ?    -flows_clone          -->    Flows/clone');
	ROUTE('+API    ?    -flows_editor         -->    Flows/editor');

	// Predefined FlowStream routes
	ROUTE('GET     /private/',        privatefiles);
	ROUTE('GET     /notify/{id}/',    notify);
	ROUTE('POST    /notify/{id}/',    notify);

	// For designer
	ROUTE('+SOCKET  /flows/{id}/   <8MB',     socket); // max. 8 MB

};

function socket($) {
	Flow.socket($.params.id, $);
}

function privatefiles($) {

	var filename = $.query.filename;
	if (filename) {

		filename = filename.replace(/\.{2,}|~|\+|\/|\\/g, '');
		$.nocache();

		var path = PATH.private(filename);

		Total.Fs.lstat(path, function(err, stat) {

			if (err) {
				$.invalid(404);
				return;
			}

			var offset = $.query.offset;
			var opt = {};

			if (offset) {
				offset = U.parseInt(offset);
				opt.start = offset;
			}

			var stream = Total.Fs.createReadStream(path, opt);

			$.nocache();
			$.stream(stream, U.getContentType(U.getExtension(path)), filename, { 'x-size': stat.size, 'last-modified': stat.mtime.toUTCString() });

		});

		return;
	}

	var q = $.query.q;

	U.ls2(PATH.private(), function(files) {
		var arr = [];
		for (var file of files)
			arr.push({ name: file.filename.substring(file.filename.lastIndexOf('/') + 1), size: file.stats.size, modified: file.stats.mtime });
		$.json(arr);
	}, q);
}

function notify($) {
	Flow.notify($, $.params.id);
}