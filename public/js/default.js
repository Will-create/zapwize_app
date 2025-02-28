FUNC.code = function(opt, callback) {
	SET('*form2', 'formcode');
	EXEC(true, 'formcode/init', opt, callback);
};

COMPONENT('designer', 'url:https://uibuilder.totaljs.com;left:0;top:0;margin:0', function(self, config, cls) {

	var self = this;
	var iframe;

	self.readonly();

	self.make = function() {

		self.aclass(cls + ' hidden');
		self.css({ position: 'absolute', 'z-index': 10, left: config.left, top: config.top, right: 0, bottom: 0 });
		self.on('resize + resize2', self.resize);

		$(W).on('message', function(e) {

			if (!iframe)
				return;

			e = e.originalEvent;

			if (e.source !== iframe.contentWindow)
				return;

			var data = e.data;

			if (typeof(data) === 'string')
				data = PARSE(data);

			if (!data.uibuilder)
				return;

			switch (data.TYPE) {
				case 'close':
					setTimeout(self.hide, 200);
					break;
				case 'ready':
					var msg = { TYPE: 'init', data: self.get(), upload: config.upload, groups: config.groups ? GET(self.makepath(config.groups)) : null, apps: config.apps ? GET(self.makepath(config.apps)) : null, paths: config.paths ? GET(self.makepath(config.paths)) : null, codes: config.codes ? GET(self.makepath(config.codes)) : null, views: config.views ? GET(self.makepath(config.views)) : null, uibuilder: 1 };
					iframe.contentWindow.postMessage(STRINGIFY(msg), '*');
					break;
				case 'save':
					self.EXEC(config.save, data.data);
					break;
				case 'publish':
					self.EXEC(config.publish, data.data);
					break;
				case 'render':
					self.EXEC(config.render, data.data);
					break;
			}
		});
	};

	self.hide = function() {
		if (iframe) {
			self.find('iframe').remove();
			iframe = null;
			self.aclass('hidden');
			config.close && self.EXEC(config.close);
		}
	};

	self.make_iframe = function() {
		iframe && self.find('iframe').remove();
		self.append('<iframe src="{0}?hideclose=1" scrolling="no" frameborder="0" allow="geolocation *; microphone *; camera *; midi *; encrypted-media *"></iframe>'.format(config.url));
		iframe = self.find('iframe')[0];
		self.resize();
		self.rclass('hidden');
	};

	self.refresh = function(skippath) {
		if (skippath && self.path === skippath)
			return;
		var msg = { TYPE: 'refresh', groups: config.groups ? GET(self.makepath(config.groups)) : null, apps: config.apps ? GET(self.makepath(config.apps)) : null, paths: config.paths ? GET(self.makepath(config.paths)) : null, codes: config.codes ? GET(self.makepath(config.codes)) : null, views: config.views ? GET(self.makepath(config.views)) : null, uibuilder: 1 };
		iframe.contentWindow.postMessage(STRINGIFY(msg), '*');
	};

	self.resize = function() {

		if (!iframe)
			return;

		var css = {};
		css.width = WW - config.left;
		css.height = WH - config.top - config.margin;
		self.css(css);
		$(iframe).css(css);
	};

	self.setter = function(value) {

		if (value) {
			self.make_iframe();
			self.rclass('hidden');
		} else if (iframe)
			self.hide();
	};

});

COMPONENT('flow', 'left:0;top:60;margin:0', function(self, config, cls) {

	var self = this;
	var iframe;

	self.readonly();

	self.make = function() {

		self.aclass(cls + ' hidden');
		self.css({ position: 'absolute', 'z-index': 10, left: config.left, top: config.top, right: 0, bottom: 0 });
		self.on('resize + resize2', self.resize);

		$(W).on('message', function(e) {

			if (!iframe)
				return;

			e = e.originalEvent;

			if (e.source !== iframe.contentWindow)
				return;

			var data = e.data;

			if (typeof(data) === 'string')
				data = PARSE(data);

			switch (data.TYPE) {
				case 'close':
					self.set(null);
					break;
			}
		});
	};

	self.hide = function() {
		if (iframe) {
			self.find('iframe').remove();
			iframe = null;
			self.aclass('hidden');
			config.close && self.EXEC(config.close);
		}
	};

	self.make_iframe = function() {
		iframe && self.find('iframe').remove();
		self.append('<iframe src="{0}&hideclose=1" scrolling="no" frameborder="0" allow="geolocation *; microphone *; camera *; midi *; encrypted-media *"></iframe>'.format(self.get()));
		iframe = self.find('iframe')[0];
		self.resize();
		self.rclass('hidden');
	};

	self.resize = function() {

		if (!iframe)
			return;

		var css = {};
		css.width = WW - config.left;
		css.height = WH - config.top - config.margin;
		self.css(css);
		$(iframe).css(css);
	};

	self.setter = function(value) {
		if (value) {
			self.make_iframe();
			self.rclass('hidden');
		} else if (iframe)
			self.hide();
	};

});