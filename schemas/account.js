NEWACTION('Account/session', {
	name: 'Read account data',
	action: async function($) {
		$.callback($.user.json ? $.user.json() : $.user);
	}
});