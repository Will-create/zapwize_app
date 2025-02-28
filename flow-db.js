require('querybuilderpg');

var Flow = null;
var Main = { ready: false };
var template = Tangular.compile(`<scr` + `ipt total>
exports.` + `id = '{{ uid }}';
exports.` + `group = '{{ group }}';
exports.` + `icon = '{{ icon }}';
exports.` + `name = '{{ name }}';
exports.` + `version = '{{ version }}';
exports.` + `parentid = '{{ parentid }}';
exports.` + `config = { code: 'return READ().where(\\'id\\', \\'=\\', \\'123456\\');' };
exports.` + `meta = { readonly: true, protected: true, settingswidth: 980 };
exports.dbextension = true;
exports.` + `inputs = [{{ inputs }}];
exports.` + `outputs = [{{ outputs }}];
exports.` + `columns = {{ columns | raw }};

exports.make = function(instance, config) {

	const AsyncFunction = async function () {}.constructor;

	instance.columns = {};
	instance.fn = null;
	for (var m of instance.module.columns)
		instance.columns[m.id] = m;
	instance.columns.id = { id: 'id', name: 'Identifier', type: 'string' };
	instance.columns.name = { id: 'name', name: 'Name', type: 'string' };
	instance.message = FUNC.db_exec;
	instance.configure = function() {
		try {
			instance.fn = new AsyncFunction('db', 'data', 'var LIST=()=>db.list(),FIND=()=>db.find(),READ=()=>db.read(),UPDATE=(a,b)=>db.update(a,b),INSERT=(a)=>db.insert(a),REMOVE=()=>db.remove();\\n' + FUNC.prepareasync(config.code));
		} catch (e) {
			instance.throw(e);
		}
	};
	instance.configure();
};
</scr` + `ipt>
<style>
	.CLASS-settings .CodeMirror { border: 0; border-radius: 0 !important; }
	.CLASS footer { padding: 10px; font-size: 12px; }
</style>
<sett` + `ings>
	<div class="CLASS-settings">
		<ui-component name="codemirror" path="?.code" config="type:javascript;parent:auto;border:0"></ui-component>
	</div>
</sett` +`ings>
<rea` + `dme>
# {{ name }} \`db{{ id }}\`

In this component, the __{{ name }}__ database structure is manipulated. Every predefined method can only be used on its own line.

---

{{ description }}

### Properties

- \`data\` represents a message data

### Methods

- \`READ()\` returns the only the one row
- \`FIND()\` returns array of rows
- \`LIST()\` returns list
- \`INSERT(data)\` inserts row
- \`UPDATE(data)\` updates row
- \`REMOVE()\` removes row
</rea` + `dme>
<bo` + `dy>
<header>
	<i class="ICON"></i>NAME
	<footer>
		Database: <span class="badge badge-color">db.db{{ id }}</span>
	</footer>
</header>
</bo` + `dy>`);

var templateViewRequest = `<script total>

	exports.`+ `id = 'viewreq';
	exports.`+ `name = 'View endpoint';
	exports.`+ `color = '#CCCB41';
	exports.`+ `icon = 'ti ti-database-alt';
	exports.`+ `author = 'Total.js';
	exports.`+ `version = '1';
	exports.`+ `group = 'Databases';
	exports.`+ `config = { name: 'View' };
	exports.`+ `outputs = [{ id: 'output', name: 'Request' }];
	exports.` + `meta = { readonly: true, protected: true, settingswidth: 600 };

	exports.make = function(instance, config) {

		var route = ROUTE('GET /{0}/'.format(instance.id), function($) {
			var msg = instance.newmessage({ user: $.user, query: $.query });
			msg.refs.controller = $;
			msg.send('output');
		});

		instance.close = function() {
			route && route.remove();
			route = null;
		};

	};

</script>

<readme>
The component registers a new data view handler for UI Builder.
</readme>

<settings>
	<div class="padding">
		<ui-component name="input" path="?.name" config="required:1">View name</ui-component>
	</div>
</settings>

<body>
	<header>
		<i class="ICON" style="background-color:#CCCB41"></i><ui-bind path="CONFIG.name" config="text"></ui-bind>
	</header>
</body>`;

var templateViewResponse = `<script total>

	exports.`+ `id = 'viewres';
	exports.`+ `name = 'View response';
	exports.`+ `color = '#CCCB41';
	exports.`+ `icon = 'ti ti-database-alt';
	exports.`+ `author = 'Total.js';
	exports.`+ `version = '1';
	exports.`+ `group = 'Databases';
	exports.`+ `inputs = [{ id: 'input', name: 'Response' }];
	exports.` + `meta = { readonly: true, protected: true };

	exports.make = function(instance, config) {

		instance.message = function($) {
			$.refs.controller && $.refs.controller.json($.data);
			$.destroy();
		};

	};

</script>

<readme>
The component responds to a view request.
</readme>

<body>
	<header>
		<i class="ICON" style="background-color:#CCCB41"></i>NAME
	</header>
</body>`;

var refresh = function(response) {

	var processed = {};
	var components = [];

	for (var item of response) {

		item.id = item.appid + item.id;
		item.group = 'Databases';
		var tmp = [];
		tmp.push("{ id: 'input', name: 'Input' }");
		item.inputs = tmp.join(', ');
		tmp = [];
		tmp.push("{ id: 'output', name: 'Output' }");
		tmp.push("{ id: 'error', name: 'Error' }");
		item.outputs = tmp.join(', ');
		item.parentid = 'internal';

		var readme = ['### Columns'];

		readme.push('- `id {string}` __required__');
		readme.push('- `name {string}` __required__');

		for (var m of item.columns)
			readme.push('- `{0} {{2}}` {1}{3}'.format(m.id, m.name, m.type[0] === '@' ? 'string' : m.type, m.required ? ' __required__' : ''));

		item.description = readme.join('\n');
		item.columns = JSON.stringify(item.columns);

		if (!item.icon)
			item.icon = 'ti ti-database';

		item.uid = 'db' + item.id;

		processed[item.uid] = 1;
		var html = template(item);
		components.push({ id: item.uid, html: html });
	}

	if (Flow.id !== 'ui') {
		components.push({ id: 'viewreq', html: templateViewRequest });
		components.push({ id: 'viewres', html: templateViewResponse });
	}

	// Reads first Flow
	// Create components
	components.wait(function(item, next) {
		Flow.add(item.id, item.html, () => setTimeout(next, 100));
	}, function() {

		var db = Flow.meta.components;
		var remove = [];

		for (var key in db) {
			var com = db[key];
			if (com.dbextension && com.parentid === 'internal') {
				if (!processed[com.id])
					remove.push(com.id);
			}
		}

		remove.wait(function(id, next) {
			Flow.unregister(id, next);
		}, function() {
			Flow.save();
			Flow.redraw();
		});
	});
};

exports.install = function(flow) {
	Flow = flow;
	setTimeout(() => Main.ready = true, 1000);
};

global.REFRESHDB = function(appid) {
	if (Main.ready) {
		DATA.find('tbl_db').where('appid', appid).data(refresh);
	} else {
		Main.timeout && clearTimeout(Main.timeout);
		Main.timeout = setTimeout(global.REFRESHDB, 1000, appid);
	}
};

global.SYNCDATA = function(msg) {
	for (var key in Flow.meta.flow) {
		var instance = Flow.meta.flow[key];
		if (instance.driver)
			instance.send(msg.output, msg.data);
	}
};

function Helpers(id, columns) {
	this.id = 'db' + id;
	this.columns = columns;
}

Helpers.prototype.read = function() {
	return DATA.read('db.' + this.id);
};

Helpers.prototype.find = function() {
	return DATA.find('db.' + this.id);
};

Helpers.prototype.list = function() {
	return DATA.list('db.' + this.id);
};

Helpers.prototype.count = function() {
	return DATA.count('db.' + this.id);
};

Helpers.prototype.insert = function(model) {

	if (!model.id)
		model.id = UID();

	var t = this;

	for (var key in model) {
		if (!t.columns[key])
			delete model[key];
	}

	return DATA.insert('db.' + this.id, model).returning('id');
};

Helpers.prototype.update = function(model, upsert) {

	var t = this;

	for (var key in model) {
		if (!t.columns[key])
			delete model[key];
	}

	return DATA.update('db.' + t.id, model, upsert);
};

FUNC.prepareasync = function(code) {

	var lines = code.split('\n');

	for (var i = 0; i < lines.length; i++) {

		var line = lines[i];
		var is = false;

		line = line.replace(/(READ|FIND|REMOVE|UPDATE|LIST|INSERT)+\(/g, function(text) {
			is = true;
			return 'await ' + text;
		});

		if (is)
			lines[i] = (line + '.promise();').replace(/;\./, '.');
	}

	return lines.join('\n');
};

const QueryBuilder = Total.TQueryBuilder.QueryBuilder;

QueryBuilder.prototype.db = function(name) {
	var t = this;
	t.iscustom = true;

	var c = name.charAt(0);
	var key = 'table_' + name;

	if (!TEMP[key]) {
		if (c !== 't' && c !== 'v' && name.indexOf('.') === -1)
			name = 'db.' + name;
		TEMP[key] = name;
	}

	t.options.table = TEMP[key];
	return t;
};

QueryBuilder.prototype.payload = function(model) {
	this.options.payload = model;
	return this;
};

FUNC.db_exec = async function($) {
	var instance = $.instance;
	try {
		var response = await instance.fn(new Helpers(instance.module.id.substring(2), instance.columns), $.data);
		if (response !== undefined)
			$.data = response;
	} catch (e) {
		instance.send('error', e instanceof Array ? e[0].error : e.toString());
		return;
	}
	$.send('output');
};

// Load OpenPlatform
require(PATH.modules('openplatform.js'));

const USER = { id: 'admin', sa: true, name: 'Admin' };

USER.json = function() {
	return this;
};

AUTH(function($) {
	if (CONF.op_reqtoken && CONF.op_restoken)
		OpenPlatform.auth($);
	else
		$.success(USER);
});