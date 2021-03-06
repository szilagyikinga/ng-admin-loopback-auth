(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var ngAdminJWTAuthService = function($http, ngAdminJWTAuthConfigurator) {

	return {
		authenticate: function(data, successCallback, errorCallback) {
			var url = ngAdminJWTAuthConfigurator.getAuthURL();

			return $http({
				url: url,
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				data: data
			}).then(function(response) {
				localStorage.userToken = response.data.id;

				successCallback(response);

				var customAuthHeader = ngAdminJWTAuthConfigurator.getCustomAuthHeader();
				if (customAuthHeader) {
					$http.defaults.headers.common[customAuthHeader.name] = customAuthHeader.template.replace('{{token}}', response.data.token);
				} else {
					$http.defaults.headers.common.Authorization = response.data.id;
				}
			} , errorCallback);
		},

		isAuthenticated: function() {
			return !!localStorage.userToken;
		},

		logout: function() {
			localStorage.removeItem('userToken');
			return true;
		}
	}

};

ngAdminJWTAuthService.$inject = ['$http', 'ngAdminJWTAuthConfigurator'];

module.exports = ngAdminJWTAuthService;

},{}],2:[function(require,module,exports){
var ngAdminJWTAuthConfiguratorProvider = function() {
	var authConfigs = {
		_nonProtectedStates: ['login']
	};

	this.setJWTAuthURL = function(url){
		authConfigs._authUrl = url;
	};

	this.setCustomLoginTemplate = function(url) {
		authConfigs._customLoginTemplate = url;
	}

	this.setLoginSuccessCallback = function(callback) {
		authConfigs._loginSuccessCallback = callback;
	}

	this.setLoginErrorCallback = function(callback) {
		authConfigs._loginErrorCallback = callback;
	}

	this.setCustomAuthHeader = function(obj) {
		return authConfigs._customAuthHeader = obj;
	}

	this.setNonProtectedStates = function(states) {
		states.push('login');
		authConfigs._nonProtectedStates = states;
	}

  this.setCheckEveryResponseForAuthHeader = function() {
    authConfigs._checkEveryResponseForAuthHeader = true;
  }

	this.$get = function() {
		return {
			getAuthURL: function(){
				return authConfigs._authUrl;
			},
			getCustomLoginTemplate: function() {
				return authConfigs._customLoginTemplate;
			},
			getLoginSuccessCallback: function() {
				return authConfigs._loginSuccessCallback;
			},
			getLoginErrorCallback: function() {
				return authConfigs._loginErrorCallback;
			},
			getCustomAuthHeader: function() {
				return authConfigs._customAuthHeader;
			},
			getNonProtectedStates: function() {
				return authConfigs._nonProtectedStates;
			},
      getCheckEveryResponseForAuthHeader: function() {
				return !!authConfigs._checkEveryResponseForAuthHeader;
			},
		};
	}

};

module.exports = ngAdminJWTAuthConfiguratorProvider;

},{}],3:[function(require,module,exports){
var loginController = function($scope, $rootScope, ngAdminJWTAuthService, ngAdminJWTAuthConfigurator, notification, $location) {
	this.$scope = $scope;
	this.$rootScope = $rootScope;
	this.ngAdminJWTAuthService = ngAdminJWTAuthService;
	this.ngAdminJWTAuthConfigurator = ngAdminJWTAuthConfigurator;
	this.notification = notification;
	this.$location = $location;
};

loginController.prototype.login = function() {
	var that = this;

	var success = this.ngAdminJWTAuthConfigurator.getLoginSuccessCallback() || function(response) {
		that.notification.log("Successful login", { addnCls: 'humane-flatty-success' });
		that.$location.path('/dashboard');
	};
	var error = this.ngAdminJWTAuthConfigurator.getLoginErrorCallback() || function(response) {
		that.notification.log(response.data.error.message, { addnCls: 'humane-flatty-error' });
	};



	this.ngAdminJWTAuthService.authenticate(this.data, success, error);

};

loginController.$inject = ['$rootScope', '$scope', 'ngAdminJWTAuthService', 'ngAdminJWTAuthConfigurator', 'notification', '$location'];

module.exports = loginController;

},{}],4:[function(require,module,exports){
var loginTemplate = '<div class=\"container\">\n    <form style=\"max-width: 330px; padding: 15px; margin: 0 auto;\" class=\"form-login\" name=\"loginController.form\"  ng-submit=\"loginController.login()\">\n        <h2 class=\"form-login-heading\">Please log in<\/h2>\n        <div class=\"form-group\">\n            <label for=\"inputLogin\" class=\"sr-only\">Login<\/label>\n            <input type=\"text\" id=\"inputLogin\" class=\"form-control\" placeholder=\"Login\" ng-model=\"loginController.data.login\" ng-required=\"true\" ng-minlength=\"3\" ng-enter=\"loginController.login()\">\n        <\/div>\n        <div class=\"form-group\">\n            <label for=\"inputPassword\" class=\"sr-only\">Password<\/label>\n            <input type=\"password\" id=\"inputPassword\" class=\"form-control\" placeholder=\"Password\" ng-model=\"loginController.data.password\" ng-required=\"true\" ng-minlength=\"4\" ng-enter=\"loginController.login()\">\n        <\/div>\n\n        <button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" ng-disabled=\"loginController.form.$invalid\">Login<\/button>\n    <\/form>\n<\/div>';

module.exports = loginTemplate;
},{}],5:[function(require,module,exports){
var logoutController = function($scope, ngAdminJWTAuthService, $location) {
	ngAdminJWTAuthService.logout();
	$location.path('/login');
};

logoutController.$inject = ['$scope', 'ngAdminJWTAuthService', '$location'];

module.exports = logoutController;
},{}],6:[function(require,module,exports){
'use strict';

var ngAdminJWTAuth = angular.module('ng-admin.jwt-auth', []);

ngAdminJWTAuth.config(['$stateProvider', '$httpProvider', function ($stateProvider, $httpProvider) {

	$stateProvider.state('login', {
		parent: '',
		url: '/login',
		controller: 'loginController',
		controllerAs: 'loginController',
		templateProvider: ['ngAdminJWTAuthConfigurator', '$http', 'notification', function(configurator, $http, notification) {
			var template = configurator.getCustomLoginTemplate();

			if (!template) {
				return require('./loginTemplate');
			}

			if (!template.endsWith('.html')) {
				return template;
			}

			return $http.get(template).then(function(response){
				return response.data;
			}, function(response){
				notification.log('Error in template loading', { addnCls: 'humane-flatty-error' });
			});
		}],
	});

	$stateProvider.state('logout', {
		parent: '',
		url: '/logout',
		controller: 'logoutController',
		controllerAs: 'logoutController',
	});

}]);

ngAdminJWTAuth.run(['$q', 'Restangular', 'ngAdminJWTAuthService', '$http', '$location', '$state', '$rootScope', 'ngAdminJWTAuthConfigurator', function($q, Restangular, ngAdminJWTAuthService, $http, $location, $state, $rootScope ,ngAdminJWTAuthConfigurator){

	$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
		if (!ngAdminJWTAuthService.isAuthenticated()) {
			var nonProtectedStates = ngAdminJWTAuthConfigurator.getNonProtectedStates();
			if (nonProtectedStates.indexOf(toState.name) == -1) {
				event.preventDefault();
				var changeState = $state.go('login');
				changeState.then(function(){
					$rootScope.$broadcast('$stateChangeSuccess', toState.self, toParams, fromState.self, fromParams);
				});
			}
			return true;
		}
		return true;
	});

	Restangular.setErrorInterceptor(function(response, deferred, responseHandler) {
    if(response.status === 401) {
			localStorage.removeItem('userToken');
			$location.path('/login');

			return false;
    }

    return true; // error not handled
	});

	Restangular.addFullRequestInterceptor(function(response, deferred, responseHandler) {
		if (ngAdminJWTAuthService.isAuthenticated()) {
				var customAuthHeader = ngAdminJWTAuthConfigurator.getCustomAuthHeader();
				if (customAuthHeader) {
					$http.defaults.headers.common[customAuthHeader.name] = customAuthHeader.template.replace('{{token}}', localStorage.userToken);
				} else {
					$http.defaults.headers.common.Authorization = localStorage.userToken;
				}
		}
	});

  if(ngAdminJWTAuthConfigurator.getCheckEveryResponseForAuthHeader()) {
    Restangular.addResponseInterceptor(function(data, operation, what, url, response) {
      if (ngAdminJWTAuthService.isAuthenticated()) {
              var token;
        var customAuthHeader = ngAdminJWTAuthConfigurator.getCustomAuthHeader();
        if (customAuthHeader && response.headers(customAuthHeader.name)) {
                  token = response.headers(customAuthHeader.name);
                  token = token.replace(customAuthHeader.template.replace('{{token}}', ''), '');
        } else if(response.headers('Authorization')) {
                  token = response.headers('Authorization');
                  token = token.replace('Basic ', '');
        }
              if (token) {
                localStorage.userToken = token;
              }
      }
      return data;
    });
  }

}]);


ngAdminJWTAuth.controller('loginController', require('./loginController'));
ngAdminJWTAuth.controller('logoutController', require('./logoutController'));

ngAdminJWTAuth.provider('ngAdminJWTAuthConfigurator', require('./configuratorProvider'));

ngAdminJWTAuth.service('ngAdminJWTAuthService', require('./authService'));

},{"./authService":1,"./configuratorProvider":2,"./loginController":3,"./loginTemplate":4,"./logoutController":5}]},{},[1,2,3,4,5,6]);
