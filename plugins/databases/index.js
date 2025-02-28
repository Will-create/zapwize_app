exports.icon = 'ti ti-database-alt';
exports.name = '@(Databases)';
exports.position = 3;
exports.permissions = [{ id: 'db', name: 'Databases' }];
exports.visible = user => user.sa || user.permissions.includes('db');

exports.install = function() {

	ROUTE('+API    ?    -db                      --> Databases/list');
	ROUTE('+API    ?    +db_create               --> Databases/create');
	ROUTE('+API    ?    +db_read                 --> Databases/read');
	ROUTE('+API    ?    +db_clone                --> Databases/clone');
	ROUTE('+API    ?    +db_update               --> Databases/update');
	ROUTE('+API    ?    +db_remove               --> Databases/remove');
	ROUTE('+API    ?    +db_data_list            --> Databases/datalist');
	ROUTE('+API    ?    +db_data_read            --> Databases/dataread');
	ROUTE('+API    ?    +db_data_export          --> Databases/dataexport');
	ROUTE('+API    ?    +db_data_remove          --> Databases/dataremove');
	ROUTE('+API    ?    +db_data_save            --> Databases/datasave');

};

ON('start', function() {
	setTimeout(() => ACTION('Databases/init').callback(ERROR('Databases.init')), 2000);
});
