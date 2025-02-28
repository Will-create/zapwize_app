exports.icon = 'ti ti-folder';
exports.name = '@(Files)';
exports.position = 6;
exports.permissions = [{ id: 'files', name: 'Files' }];
exports.visible = user => user.sa || user.permissions.includes('files');

exports.install = function() {
	ROUTE('+API   ?   -files                -->   Files/list');
	ROUTE('+API   ?   -files_remove         -->   Files/remove');
};