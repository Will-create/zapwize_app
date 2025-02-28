var Flow = null;
var Main = { ready: false };

var template = Tangular.compile(`<scr` + `ipt total>
exports.` + `id = '{{ uid }}';
exports.` + `group = '{{ group }}';
exports.` + `icon = '{{ icon }}';
exports.` + `name = '{{ name }}';
exports.` + `version = '{{ version }}';
exports.` + `parentid = '{{ parentid }}';
exports.` + `meta = { readonly: true, protected: true };
exports.` + `config = { ua: '', ip: '' };
exports.uistudio = true;
{{ if inputs }}
exports.` + `inputs = [{{ inputs }}];
{{ fi }}
{{ if outputs }}
exports.` + `outputs = [{{ outputs }}];
{{ fi }}

exports.make = function(instance, config) {
	instance.message = function($) {

		if (!$.refs.controller) {
			$.destroy();
			return;
		}

		var meta = $.refs.uistudio || {};

		if (config.ua)
			U.set($.data, config.ua, meta.ua);

		if (config.ip)
			U.set($.data, config.ip, meta.ip);

		if (meta.output) {
			var output = meta.output;
			meta.output = undefined;
			$.send(output, $.data);
		} else {
			meta.parent = meta.id;
			meta.id = instance.id;
			meta.url = '{{ url }}';
			meta.data = $.data;
			meta.input = $.input;
			meta.output = undefined;
			meta.user = undefined;
			$.refs.controller.json(meta);
			$.refs.controller = null;
			$.destroy();
		}
	};
};
</scr` + `ipt>
<rea` + `dme>{{ description }}</rea` + `dme>
<sett` + `ings>
<div class="padding">
	<div class="grid-2">
		<div class="m">
			<ui-component name="input" path="?.ua" config="monospace:1;placeholder:ua">Assign user-agent</ui-component>
		</div>
		<div class="m">
			<ui-component name="input" path="?.ip" config="monospace:1;placeholder:ip">Assign IP address</ui-component>
		</div>
	</div>
</div>
</sett` + `ings>
<bo` + `dy>
<header>
	<i class="ICON"></i>NAME
</header>
</bo` + `dy>`);

var template_nav = (`<scr` + `ipt total>

	exports.id = '{id}';
	exports.name = '{name}';
	exports.icon = '{icon}';
	exports.color = '{color}';
	exports.author = 'Total.js';
	exports.version = '1';
	exports.group = 'Navigation';
	exports.outputs = [{ id: 'start', name: 'Start' }, { id: 'logger', name: 'Logger' }];
	exports.meta = { readonly: true, singleton: true, protected: true };
	exports.` + `parentid = '{{ parentid }}';
	exports.uistudio = true;

	exports.make = function(instance, config) {

		instance.navid = '{id}';
		instance.navroute = function($) {

			var query = $.query;
			var body = $.body;
			var meta = {};
			var next;
			var log;
			var ssid = query.ssid || query.openplatformid || query.session || query.token;

			meta.id = body.id || '';
			meta.parent = body.parent;
			meta.query = body.query || {};
			meta.output = body.output || '';
			meta.user = $.user;
			meta.ip = $.ip;
			meta.ua = $.ua;

			var payload = body.data || {};

			if (instance.connections.logger) {

				log = CLONE(meta);

				if (meta.id) {
					next = instance.main.meta.flow[meta.id];
					if (next)
						log.name = next.module.name;
				}

				log.data = CLONE(payload);
				instance.newmessage(log).send('logger');
			}

			if (meta.id) {

				if (!next)
					next = instance.main.meta.flow[meta.id];

				if (next && next.module.uistudio) {
					var msg = next.newmessage(payload);
					msg.refs.controller = $;
					msg.refs.uistudio = meta;

					var output = meta.output;
					meta.output = undefined;

					if (next.config.ua)
						U.set(msg.data, next.config.ua, meta.ua);

					if (next.config.ip)
						U.set(msg.data, next.config.ip, meta.ip);

					msg.send(output);
					return;
				}
			}

			var msg = instance.newmessage(payload);
			msg.refs.controller = $;
			msg.refs.uistudio = meta;
			msg.send('start');
		};

	};

</scr` + `ipt>

<readme>
The component triggers the design process for UI apps designed with UI Studio.
</readme>

<body>
	<header>
		<i class="$ICON"></i>$NAME
	</header>
</body>`);

var refresh = function(ui, nav) {

	var processed = {};
	var components = [];

	for (let item of ui) {

		item.group = 'User interface';

		let tmp = ["{ id: 'render', name: 'No data' }"];

		if (item.inputs) {
			for (var m of item.inputs) {
				if (m.componentid === 'flowinput')
					tmp.push("{ id: '{0}', name: '{1}' }".format(m.id, m.name));
			}
		}

		item.inputs = tmp.join(', ');

		if (item.outputs) {
			tmp = [];
			for (var m of item.outputs) {
				if (m.componentid === 'flowoutput')
					tmp.push("{ id: '{0}', name: '{1}' }".format(m.id, m.name));
			}
			item.outputs = tmp.length ? tmp.join(', ') : '';
		}

		item.url = '/data/' + item.id + '.json';
		item.parentid = 'internal';
		item.uid = 'ui' + item.id;

		processed[item.uid] = 1;
		components.push({ id: item.uid, html: template(item) });
	}

	for (let item of nav) {
		item.parentid = 'internal';
		item.id = 'uinav' + item.id;
		processed[item.id] = 1;
		components.push({ id: item.id, html: template_nav.arg(item) });
	}

	// Reads first Flow
	// Create components
	components.wait(function(item, next) {
		Flow.add(item.id, item.html, ERROR('UI.' + item.id));
		setTimeout(next, 100);
	}, function() {

		var db = Flow.meta.components;
		var remove = [];

		for (var key in db) {
			var com = db[key];
			if (com.uistudio && com.parentid === 'internal') {
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

	ROUTE('POST /', function($) {

		var instances = flow.meta.flow;
		var id = $.query.id || '';

		for (let key in instances) {
			let instance = instances[key];
			let uid = 'uinav' + id;
			if (instance.navroute && uid === instance.component) {
				instance.navroute($);
				return;
			}
		}

		$.invalid(404);
	});
};

global.REFRESHUI = async function(appid) {
	if (Main.ready) {
		var ui = await DATA.find('tbl_ui').fields('id,icon,group,name,type,inputs,outputs').where('appid', appid).where('data IS NOT NULL').promise();
		var nav = await DATA.find('tbl_nav').fields('id,icon,color,name').where('appid', appid).promise();
		refresh(ui, nav);
	} else {
		Main.timeout && clearTimeout(Main.timeout);
		Main.timeout = setTimeout(global.REFRESHDB, 1000, appid);
	}
};