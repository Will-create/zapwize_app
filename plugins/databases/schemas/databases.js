const RESERVED = ['id', 'name', 'dtcreated', 'table', 'on', 'where', 'left', 'join', 'right', 'inner', 'null', 'number', 'text', 'boolean', 'object', 'over', 'primary', 'index', 'temp', 'switch', 'case', 'json'];

NEWSCHEMA('@Databases/Columns', '*id:Lower,*name:String,*type:Lower,used:Boolean,required:Boolean,sortindex:Number');
NEWSCHEMA('@Databases', 'id,*name:String,category:String,icon:Icon,color:Color,columns:[@Databases/Columns]');

function checkcolumns($, columns) {

	for (var m of columns) {
		m.id = m.id.replace(/[^a-z0-9]/g, '');

		if (RESERVED.includes(m.id)) {
			$.error.replace('@', m.id);
			$.invalid('@(You can not use "@" reserved keyword as column name)');
			return false;
		}

	}

	return true;
}

NEWACTION('Databases/list', {
	name: 'List of dbs',
	permissions: 'db',
	action: function($) {
		var appid = MAIN.id;
		DATA.find('tbl_db').fields('id,name,category,icon,color,dtcreated,dtupdated').where('appid', appid).sort('dtcreated').callback($);
	}
});

NEWACTION('Databases/read', {
	name: 'Read db',
	input: '*id:String',
	permissions: 'db',
	action: function($, model) {
		DATA.read('tbl_db').id(model.id).where('appid', MAIN.id).error(404).callback($);
	}
});

NEWACTION('Databases/create', {
	name: 'Create db',
	input: '@Databases',
	permissions: 'db',
	action: function($, model) {

		if (!model.columns)
			model.columns = [];

		if (!checkcolumns($, model.columns))
			return;

		model.id = U.random_number(3) + '';
		model.appid = MAIN.id;
		model.dtcreated = NOW;

		pg_check(model, async function() {
			model.columns = JSON.stringify(model.columns);
			await DATA.insert('tbl_db', model).promise($);
			$.success();
			for (var key in Flow.instances)
				Flow.instances[key].cmd('REFRESHDB', MAIN.id);
		});
	}
});

NEWACTION('Databases/update', {
	name: 'Update db',
	input: '@Databases',
	permissions: 'db',
	action: async function($, model) {

		if (!model.id) {
			$.invalid('@(Invalid identifier)');
			return;
		}

		if (!model.columns)
			model.columns = [];

		if (!checkcolumns($, model.columns))
			return;

		var appid = MAIN.id;

		model.appid = appid;
		model.dtupdated = NOW;

		var data = CLONE(model);
		data.columns = JSON.stringify(data.columns);
		await DATA.modify('tbl_db', data).id(model.id).where('appid', appid).error(404).promise($);

		pg_check(model, async function() {
			$.success();
			for (var key in Flow.instances)
				Flow.instances[key].cmd('REFRESHDB', appid);
		});
	}
});

NEWACTION('Databases/clone', {
	name: 'Clone db',
	input: '*id',
	permissions: 'db',
	action: async function($, model) {

		var item = await DATA.read('tbl_db').id(model.id).where('appid', MAIN.id).error(404).promise($);
		var columns = item.columns;

		item.id = U.random_number(3) + '';
		item.name += ' (cloned)';
		item.dtupdated = null;
		item.dtcreated = NOW;
		item.columns = JSON.stringify(item.columns);
		await DATA.insert('tbl_db', item).promise($);

		item.columns = columns;
		pg_check(item, async function() {
			$.success();
			for (var key in Flow.instances)
				Flow.instances[key].cmd('REFRESHDB', MAIN.id);
		});
	}
});

NEWACTION('Databases/remove', {
	name: 'Remove db',
	input: '*id',
	permissions: 'db',
	action: async function($, model) {

		await DATA.remove('tbl_db').id(model.id).where('appid', MAIN.id).error(404).promise($);

		// Drop table
		DATA.query('DROP TABLE db.{0}'.format(MAIN.id + model.id));

		$.success(model.id);

		for (var key in Flow.instances)
			Flow.instances[key].cmd('REFRESHDB', MAIN.id);
	}
});

NEWACTION('Databases/datalist', {
	name: 'List of data',
	input: '*id',
	permissions: 'db',
	action: async function($, model) {

		var item = await DATA.read('tbl_db').id(model.id).where('appid', MAIN.id).error(404).promise($);
		var builder = ['id,name'];

		for (var col of item.columns) {
			var type = col.type;
			switch (type) {
				case 'string':
				case 'number':
				case 'date':
				case 'boolean':
				case 'json':
					break;
				default:
				type = 'string';
				break;
			}
			builder.push(col.id + ':' + type);
		}

		builder.push('dtcreated:date');
		DATA.list('db.db' + MAIN.id + item.id).autoquery($.query, builder.join(','), 'dtcreated_desc', 100).callback($);
	}
});

NEWACTION('Databases/dataread', {
	name: 'Read data',
	input: '*id,*rowid',
	permissions: 'db',
	action: async function($, model) {
		await DATA.check('tbl_db').id(model.id).where('appid', MAIN.id).error(404).promise($);
		DATA.read('db.db' + MAIN.id + model.id).id(model.rowid).error(404).callback($);
	}
});

NEWACTION('Databases/dataexport', {
	name: 'Read data',
	input: '*id,*rowid',
	permissions: 'db',
	action: async function($, model) {
		await DATA.check('tbl_db').id(model.id).where('appid', MAIN.id).error(404).promise($);
		DATA.read('db.db' + MAIN.id + model.id).id(model.rowid).error(404).callback($);
	}
});

NEWACTION('Databases/dataremove', {
	name: 'Remove data',
	input: '*id,*rowid',
	permissions: 'db',
	action: async function($, model) {
		await DATA.check('tbl_db').id(model.id).where('appid', MAIN.id).error(404).promise($);
		DATA.remove('db.db' + MAIN.id + model.id).id(model.rowid).error(404).callback($.done(model.rowid));
	}
});

NEWACTION('Databases/init', {
	name: 'Init DB structures',
	action: async function($) {
		var appid = MAIN.id;
		var response = await DATA.find('tbl_db').where('appid', appid).promise($);
		response.wait(function(item, next) {
			pg_check(item, next);
		}, function() {

			for (var key in Flow.instances)
				Flow.instances[key].cmd('REFRESHDB', appid);

			$.success();
		});
	}
});

NEWACTION('Databases/datasave', {
	name: 'Save data',
	input: '*id:String,data:Object',
	action: async function($, model) {

		var type = await DATA.read('tbl_db').fields('columns').id(model.id).where('appid', MAIN.id).error('@(Database not found)').promise($);
		var schema = ['id:string,name:string'];

		for (var m of type.columns) {
			switch (m.type) {
				case 'boolean':
				case 'string':
				case 'date':
				case 'number':
				case 'json':
					break;
				case 'json':
					model.data[m.id] = model.data[m.id] ? JSON.stringify(model.data[m.id]) : null;
					break;
				default:
					m.type = 'string';
					break;
			}
			schema.push(m.id + ':' + m.type);
		}

		var jsonschema = schema.join(',').toJSONSchema();
		var response = jsonschema.transform(model);

		if (response.error) {
			$.invalid(response.error);
			return;
		}

		var data = model.data;
		var id = MAIN.id + model.id;

		if (data.id) {
			DATA.modify('db.db' + id, data).id(data.id).error(404).callback($.done(data.id));
		} else {
			data.id = UID();
			DATA.insert('db.db' + id, data).callback($.done(data.id));
		}
	}
});

function makepgtype(type) {
	switch (type) {
		case 'date':
			return 'TIMESTAMP';
		case 'date2':
			return 'DATE';
		case 'int2':
		case 'smallint':
			return 'SMALLINT';
		case 'int4':
		case 'integer':
			return 'INTEGER';
		case 'number':
			return 'NUMERIC';
		case 'boolean':
			return 'BOOLEAN';
	}
	return 'TEXT';
}

async function pg_check(type, callback) {

	var schema = 'db';
	var id = 'db' + MAIN.id + type.id;
	var columns = await DATA.query('SELECT "column_name" as id, UPPER("data_type") as type FROM information_schema.columns WHERE table_schema = \'{0}\' AND table_name=\'{1}\''.format(schema, id)).promise();
	var sql = [];
	var comments = [];

	if (columns.length) {

		var processed = {};

		for (var col of columns) {

			if (col.id === 'id' || col.id === 'name' || col.id === 'dtcreated') {
				processed[col.id] = 1;
				continue;
			}

			var t = type.columns.findItem('id', col.id);
			if (t) {

				var index = col.type.indexOf(' ');
				if (index !== -1)
					col.type = col.type.substring(0, index);

				var pgtype = makepgtype(t.type);

				if (col.type !== pgtype)
					sql.push('ALTER TABLE {0} ALTER COLUMN {1} TYPE {2} USING ({1}::{2})'.format(schema + '.' + id, t.id, pgtype));

				comments.push('COMMENT ON COLUMN "{0}"."{1}"."{2}" IS {3}'.format(schema, id, t.id, PG_ESCAPE(t.name)));

			} else {
				// remove
				sql.push('ALTER TABLE {0} DROP COLUMN "{1}"'.format(schema + '.' + id, col.id));
			}

			processed[col.id] = 1;
		}

		// Add missing fields
		for (var t of type.columns) {
			if (!processed[t.id]) {
				sql.push('ALTER TABLE {0} ADD COLUMN {1} {2}'.format(schema + '.' + id, t.id, makepgtype(t.type)));
				comments.push('COMMENT ON COLUMN "{0}"."{1}"."{2}" IS {3}'.format(schema, id, t.id, PG_ESCAPE(t.name)));
			}
		}

		if (!processed.dtcreated)
			sql.push('ALTER TABLE {0} ADD COLUMN dtcreated TIMESTAMP DEFAULT timezone(\'utc\'::text, now())'.format(schema + '.' + id));

	} else {
		// Creates table
		var builder = ['id TEXT', 'name TEXT', 'dtcreated TIMESTAMP DEFAULT timezone(\'utc\'::text, now())'];

		for (var col of type.columns) {
			builder.push('"' + col.id + '" ' + makepgtype(col.type));
			comments.push('COMMENT ON COLUMN "{0}"."{1}"."{2}" IS {3}'.format(schema, id, col.id, PG_ESCAPE(col.name)));
		}

		sql.push('CREATE TABLE {0} ('.format(schema + '.' + id) + builder.join(', ') + ', PRIMARY KEY (id))');
	}

	var done = function() {
		comments.length && DATA.query(comments.join(';\n'));
		callback && callback();
	};

	if (sql.length)
		DATA.query(sql.join(';\n') + ';').callback(function(err) {
			err && console.error(type.id + ':', err);
			done();
		});
	else
		done();
}

NEWACTION('createdb', {
	name: 'Create database',
	input: '*id:String, *name:String, category:String, icon:Icon, color:Color, columns:[*id:Lower, *name:String, *type:Lower, required:Boolean, sortindex:Number, locked:Boolean]',
	action: async function($, model) {

		var item = await DATA.read('tbl_db').id(model.id).where('appid', MAIN.id).promise($);

		if (item) {
			$.success(model.id);
			return;
		}

		model.appid = MAIN.id;

		pg_check(model, async function() {
			model.columns = JSON.stringify(model.columns);
			await DATA.insert('tbl_db', model).promise($);

			$.success(model.id);

			for (var key in Flow.instances)
				Flow.instances[key].cmd('REFRESHDB', appid);
		});

	}
});
