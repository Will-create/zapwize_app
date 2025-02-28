var db = MAIN.db = MEMORIZE('data');

if (!db.id)
	db.id = CONF.id || U.random_number(3);

if (!db.token)
	db.token = GUID(40);

if (!db.config)
	db.config = {};

// Assign ID
MAIN.id = CONF.id = db.id;

// Fixed settings
CONF.allow_custom_titles = true;
CONF.op_path = '/admin/';

if (!CONF.version)
	CONF.version = '1';

if (!CONF.op_icon)
	CONF.op_icon = 'ti ti-totaljs';

ON('service', function(counter) {
	// Pregenerates token
	if (counter % 2880 === 0) {
		db.token = GUID(40);
		MAIN.db.save();
	}
});

PAUSESERVER('Engine');

// Permissions
ON('start', function() {

	// UI components
	COMPONENTATOR('ui', 'exec,parts,configuration,edit,locale,aselected,page,datepicker,navlayout,miniform,viewbox,input,importer,box,validate,loading,selected,intranetcss,notify,message,errorhandler,empty,menu,ready,fileuploader,choose,wysiwyg,movable,minheight,colorpicker,icons,directory,enter,datagrid,approve,qrcode,printer,searchinput,search,listform,filereader,windows,clipboard,tangular-filesize,uistudio,autofill,title,cloudeditor,prompt,cl,datasource', true);

	// Modifies meta
	DATA.modify('tbl_app', { id: db.id, name: CONF.name, isflow: true }, true).id(db.id);

	for (var key in F.plugins) {
		var item = F.plugins[key];
		if (item.permissions)
			OpenPlatform.permissions.push.apply(OpenPlatform.permissions, item.permissions);
	}

	setTimeout(() => PAUSESERVER('Engine'), 2100);

});

function reconfigure() {
	DATA.find('cl_config').data(function(response) {

		for (var key in MAIN.db.config)
			response.push({ id: key, value: MAIN.db.config[key] });

		LOADCONFIG(response);
		EMIT('start');
	});
}

async function init() {

	var op_tables = await DATA.query("SELECT 1 AS config FROM pg_tables WHERE schemaname='public' AND tablename='cl_config' LIMIT 1").promise();

	if (op_tables.length) {
		reconfigure();
		return;
	}

	// DB is empty
	F.Fs.readFile(PATH.root('database.sql'), async function(err, buffer) {

		var sql = buffer.toString('utf8');

		// Run SQL
		await DATA.query(sql).promise();
		reconfigure();
	});

}

setTimeout(init, 1000);