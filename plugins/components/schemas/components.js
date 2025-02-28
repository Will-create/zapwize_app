var rebuilder = {};

function RebuildForce(db) {
	rebuilder[db] && clearTimeout(rebuilder[db]);
	delete rebuilder[db];
	PLUGINS.components.rebuild(db);
}

function Rebuild(db) {
	rebuilder[db] && clearTimeout(rebuilder[db]);
	rebuilder[db] = setTimeout(RebuildForce, 5000, db);
}

function Path(path = '') {
	return PATH.databases(CONF.dircomponents + path);
}

NEWACTION('Components/list', {
	name: 'List of components',
	input: 'path:Lower',
	permissions: 'components',
	action: async function($, model) {

		F.Fs.readdir(Path(model.path), { withFileTypes: true }, function(err, response) {

			if (!response)
				response = [];

			for (let item of response) {
				item.type = item.isDirectory() ? 1 : 2;
				item.icon = item.type === 1 ? 'folder' : 'file';
			}

			$.callback(response);

		});

	}
});

NEWACTION('Components/read', {
	name: 'Read asset',
	input: '*path',
	permissions: 'components',
	action: async function($, model) {
		F.Fs.readFile(Path(model.path), 'utf8', function(err, response) {

			if (err) {
				$.invalid(404);
				return;
			}

			if ($.controller) {
				$.controller.text(response);
				$.cancel();
			} else
				$.callback(response);
		});
	}
});

NEWACTION('Components/rename', {
	name: 'Rename asset',
	input: '*path,*newpath',
	permissions: 'components',
	action: async function($, model) {
		F.Fs.rename(Path(model.path), Path(model.newpath), $.successful(function() {
			var db = model.newpath.split('/')[1];
			Rebuild(db);
			$.success();
		}));
	}
});

NEWACTION('Components/remove', {
	name: 'Remove asset',
	input: '*path',
	permissions: 'components',
	action: function($, model) {
		var path = Path(model.path);
		F.Fs.lstat(path, function(err, response) {

			if (err) {
				$.invalid(404);
				return;
			}

			var done = function() {
				var db = model.path.split('/')[1];
				Rebuild(db);
				$.success();
			};

			if (response.isDirectory())
				F.Fs.rm(path, { recursive: true }, $.successful(done));
			else
				F.Fs.unlink(path, $.successful(done));

		});

	}
});

NEWACTION('Components/mkdir', {
	name: 'Create directory',
	input: '*path:String',
	permissions: 'components',
	action: function($, model) {
		var path = Path(model.path);
		F.Fs.mkdir(path, { recursive: true }, $.done());
	}
});

NEWACTION('Components/clone', {
	name: 'Clone directory',
	input: '*path:String,*newpath:String',
	permissions: 'components',
	action: function($, model) {
		var path = Path(model.path);
		F.Fs.cp(path, Path(model.newpath), { recursive: true }, $.done());
	}
});

NEWACTION('Components/update', {
	name: 'Save file',
	input: '*path:String,body',
	permissions: 'components',
	action: function($, model) {
		var path = Path(model.path);
		var dir = F.Path.dirname(path);
		F.Fs.mkdir(dir, { recursive: true }, function() {
			F.Fs.writeFile(path, model.body || '', $.successful(function() {
				$.success();
				var db = model.path.split('/')[1];
				Rebuild(db);
			}));
		});
	}
});

NEWACTION('Components/download', {
	query: '*db:String',
	permissions: 'components',
	action: function($) {

		var model = $.query;
		var spawn = F.Child.spawn('zip', ['-r', '-', model.db], { cwd: Path() });

		$.controller.stream('application/zip', spawn.stdout, model.db + '.zip');
		$.cancel();

	}
});

NEWACTION('Components/restore', {
	permissions: 'components',
	action: function($) {

		var file = $.files[0];
		if (!file) {
			$.invalid('@(Invalid file)');
			return;
		}

		SHELL('unzip -u {0} -d {1}'.format(file.path, Path()), function() {
			$.success();
			PLUGINS.components.rebuild();
		});
	}
});

NEWACTION('Components/upload', {
	permissions: 'components',
	input: '*path',
	action: function($, model) {
		var file = $.files[0];
		if (file) {
			file.move(Path(PATH.join(model.path, file.filename)), $.done());
		} else
			$.invalid('@(Invalid file)');
	}
});