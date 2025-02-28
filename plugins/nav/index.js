exports.icon = 'ti ti-align-justify';
exports.name = '@(Navigation)';
exports.position = 3;
exports.permissions = [{ id: 'nav', name: 'Navigation' }];
exports.visible = user => user.sa || user.permissions.includes('nav');

exports.install = function() {
	ROUTE('+API    ?    -nav_list          --> Nav/list');
	ROUTE('+API    ?    +nav_read          --> Nav/read');
	ROUTE('+API    ?    +nav_create        --> Nav/create');
	ROUTE('+API    ?    +nav_update        --> Nav/update');
	ROUTE('+API    ?    +nav_remove        --> Nav/remove');
	ROUTE('+API    ?    +nav_sort          --> Nav/sort');
};