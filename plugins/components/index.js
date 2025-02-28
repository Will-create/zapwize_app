exports.icon = 'ti ti-layout';
exports.name = '@(UI components)';
exports.position = 6;
exports.permissions = [{ id: 'components', name: 'Components' }];
exports.visible = user => user.sa || user.permissions.includes('components');

exports.config = [
	{ id: 'minify', name: 'Minify HTML', value: false, type: 'boolean' },
	{ id: 'dircomponents', name: 'Directory', value: '/fs-db/components/', type: 'string' }
];

exports.install = function() {

	ROUTE('+API    ?    -components                 -->    Components/list');
	ROUTE('+API    ?    +components_mkdir           -->    Components/mkdir');
	ROUTE('+API    ?    +components_update    <5MB  -->    Components/update');
	ROUTE('+API    ?    +components_clone           -->    Components/clone');
	ROUTE('+API    ?    +components_remove          -->    Components/remove');
	ROUTE('+API    ?    +components_read            -->    Components/read');
	ROUTE('+API    ?    +components_rename          -->    Components/rename');

	ROUTE('+GET    ?components/download/            -->    Components/download');
	ROUTE('+POST   ?components/restore/      <10MB  -->    Components/restore');
	ROUTE('+POST   ?components/upload/       <5MB   -->    Components/upload');

	ROUTE('FILE    /ui/*', files);

};

ON('componentator', function(meta) {
	if (meta.name === 'ui' && !meta.components.includes('folder'))
		meta.components += ',folder';
});

ON('reload', function() {
	if (!CONF.dircomponents)
		CONF.dircomponents = '/fs-db/components/';
	setTimeout(() => exports.rebuild(), 1000);
});

function readdir(path) {
	return new Promise(resolve => F.Fs.readdir(path, (err, response) => resolve(err ? [] : response)));
}

exports.rebuild = async function(db) {

	if (!db) {
		let folders = await readdir(PATH.databases(CONF.dircomponents));
		for (let folder of folders)
			await exports.rebuild(folder);
		return;
	}

	var path = PATH.databases(CONF.dircomponents + '/' + db);
	var components = await readdir(path);
	var url = CONF.url || '';
	var editor = {};
	var render = [];

	for (let dir of components) {
		editor[dir] = url + '/ui/' + db + '/' + dir + '/editor.html';

		var frender = await F.readfile(PATH.join(path, dir, 'render.html'), 'utf8');

		if (!frender)
			frender = await F.readfile(PATH.join(path, dir, 'editor.html'), 'utf8');

		render.push('UIBuilder.component(\'{0}\', \'base64 {1}\');'.format(dir, Buffer.from(encodeURIComponent(frender), 'utf8').toString('base64')));
	}

	var pathjs = PATH.databases('ui_' + db + '.js');
	var pathjson = PATH.databases('ui_' + db + '.json');

	if (components.length) {
		F.Fs.writeFile(pathjs, render.join('\n'), NOOP);
		F.Fs.writeFile(pathjson, JSON.stringify(editor, null, '\t'), NOOP);
	} else {
		F.Fs.unlink(pathjs, NOOP);
		F.Fs.unlink(pathjson, NOOP);
	}

	TOUCH('/ui/{0}.json'.format(db));
	TOUCH('/ui/{0}.js'.format(db));

};

function js($) {
	var filename = PATH.databases('ui_' + $.split[1]);
	$.response.minify = false;
	$.file(filename);
}

function json($) {
	var filename = PATH.databases('ui_' + $.split[1]);
	$.file(filename);
}

function html($) {

	var filename = PATH.databases(CONF.dircomponents + '/' + $.split[1] + '/' + $.split[2] + '/' + $.split[3]);

	$.response.minify = CONF.minify == true;

	if ($.split[3] === 'render.html') {
		$.file(filename);
		return;
	}

	var httpcache = false;

	F.Fs.lstat(filename, function(err, stats) {

		if (err) {
			$.invalid(404);
			return;
		}

		if (httpcache && $.notmodified(stats.mtime))
			return;

		F.temporary.tmp[$.uri.key] = { date: stats.mtime.toUTCString(), size: stats.size };

		F.Fs.readFile(filename, 'utf8', function(err, response) {

			if (err) {
				$.invalid(404);
				return;
			}

			// response = response.replace(/exports\.render.*?;/, text => text.replace('auto', '/ui/' + $.split[1] + '/' + $.split[2] + '/render.html'));
			// response = response.replace(/exports\.settings.*?;/, text => text.replace('auto', '/ui/' + $.split[1] + '/' + $.split[2] + '/settings.html'));

			httpcache && $.httpcache(stats.mtime);
			$.html(response);
		});
	});
}

function files($) {
	var arr = $.split;

	// @TODO: check DB
	var db = arr[1];

	if (arr.length === 2) {
		if ($.ext === 'js')
			js($);
		else
			json($);
	} else if (arr.length === 4)
		html($);
	else
		$.invalid(404);
}