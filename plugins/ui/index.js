exports.icon = 'ti ti-pencil-paintbrush';
exports.name = '@(User interface)';
exports.position = 1;
exports.permissions = [{ id: 'ui', name: 'UI' }];
exports.visible = user => user.sa || user.permissions.includes('ui');

exports.install = function() {

	ROUTE('+API    ?    -apps                    --> UI/inputs');
	ROUTE('+API    ?    -ui                      --> UI/list');
	ROUTE('+API    ?    -ui_flow                 --> UI/flow');
	ROUTE('+API    ?    -ui_views                --> UI/views');
	ROUTE('+API    ?    +ui_save                 --> UI/save', 1024 * 10); // Max. 10 MB
	ROUTE('+API    ?    +ui_clone                --> UI/clone');
	ROUTE('+API    ?    +ui_publish              --> UI/publish');
	ROUTE('+API    ?    +ui_remove               --> UI/remove');
	ROUTE('+API    ?    -ui_editor               --> UI/editor');
	ROUTE('+API    ?    -ui_templates            --> UI/Templates/list');
	ROUTE('+API    ?    +ui_templates_save       --> UI/Templates/save');
	ROUTE('+API    ?    +ui_templates_read       --> UI/Templates/read');
	ROUTE('+API    ?    +ui_templates_remove     --> UI/Templates/remove');

	ROUTE('FILE  /components/*.*', uicomponents);

};

ON('start', function() {

	CORS(CONF.uibuilder);

	DATA.count('tbl_template').where('appid', MAIN.id).data(function(count) {

		if (count)
			return;

		PATH.fs.readFile(PATH.plugins('/ui/public/ui.json'), 'utf8', function(err, response) {

			var data = response.parseJSON(true);
			var obj = {};

			obj.id = UID();
			obj.appid = MAIN.id;
			obj.icon = data.icon;
			obj.name = data.name;
			obj.data = JSON.stringify(data);

			DATA.insert('tbl_template', obj);

		});
	});
});

Flow.on('load', function(instance) {
	if (instance.id === 'ui')
		setTimeout(() => ACTION('UI/rebuild').callback(ERROR('UI.rebuild')), 1000);
});

function uicomponents($) {
	if (CONF.uicomponents)
		$.proxy({ url: CONF.uicomponents });
	else
		$.continue();
}