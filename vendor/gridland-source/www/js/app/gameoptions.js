define(['jquery'], function($) {

	var OPTIONS_KEY = "darma:games:gridland:v1:options";
	
	var gameOptions = {
		musicVolume: 1,
		effectsVolume: 1,
		casualMode: false
	};
	
	var GameOptions = {
		get: function(optionName, defaultValue) {
			return gameOptions[optionName] == null ? defaultValue : gameOptions[optionName];
		},
		
		set: function(optionName, value) {
			gameOptions[optionName] = value;
			if(typeof Storage != 'undefined' && localStorage) {
				localStorage[OPTIONS_KEY] = JSON.stringify(gameOptions);
			}
			return value;
		},
		
		load: function() {
			try {
				var savedOptions = JSON.parse(localStorage[OPTIONS_KEY]);
				if(savedOptions) {
					$.extend(gameOptions, savedOptions);
				}
			} catch(e) {
				// Nothing
			}
		}
	};
	
	return GameOptions;
});