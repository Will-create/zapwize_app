NEWACTION('Settings/read', {
	name: 'Read settings',
	permissions: 'settings',
	action: async function($) {

		var model = {};
		var language = $.user.language;

		for (let key in MAIN.db.config)
			model[key] = MAIN.db.config[key];

		model.items = [];

		for (let key in F.plugins) {

			let plugin = F.plugins[key];
			let cfg = plugin.config;

			if (cfg) {
				var name = TRANSLATE(language, plugin.name);
				model.items.push({ type: 'group', name: name });
				for (let m of cfg) {
					var type = m.type;
					if (!type) {
						if (m.value instanceof Date)
							type = 'date';
						else
							type = typeof(m.value);
					}
					var item = CLONE(m);
					item.name = TRANSLATE(language, m.name);
					item.value = CONF[m.id] || m.value;
					item.type = type;
					model.items.push(item);
				}
			}

		}

		$.callback(model);
	}
});

NEWACTION('Settings/save', {
	name: 'Save settings',
	input: '*name, allow_tms:Boolean, secret_tms, op_reqtoken, op_restoken, totalapi, items:[*id:String, value:Object]',
	permissions: 'settings',
	action: function($, model) {

		for (let key in model) {
			if (key !== 'items')
				MAIN.db.config[key] = model[key];
		}

		for (let m of model.items) {

			if (m.value instanceof Date) {
				m.value = m.value.toISOString();
				m.type = 'date';
			} else {
				if (m.value == null) {
					m.value = '';
					m.type = 'string';
				} else {
					var type = typeof(m.value);
					if (type === 'object') {
						type = 'json';
						m.value = JSON.stringify(m.value);
					} else
						m.value = m.value == null ? '' : m.value.toString();
					m.type = type;
				}
			}

			m.dtupdated = NOW;
			MAIN.db.config[m.id] = m.value;
		}


		DATA.modify('tbl_app', { name: CONF.name }).id(MAIN.id);
		LOADCONFIG(MAIN.db.config);
		MAIN.db.save();
		$.success();
	}
});
