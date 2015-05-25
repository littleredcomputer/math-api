angular.module('cmServices', [])
  .factory('parameterManager', ['$log', '$interval', '$http', function($log, $interval, $http) {
    var ParameterManager = function(controller, endpoint) {
      this.controller = controller;
      this.parameters = controller.parameters;
      this.endpoint = endpoint;
      this.interval = undefined;
      angular.forEach(this.parameters, function(value) {
        value.value = value.default;
      });
    };

    ParameterManager.prototype.watch = function($scope, action) {
      var self = this;
      angular.forEach(this.parameters, function(value) {
        $scope.$watch(function() {
          return value.value;
        }, function() {
          action(self.parameters);
        })
      });
    };

    ParameterManager.prototype.set = function(ps) {
      angular.forEach(this.parameters, function(value, key) {
        if (ps[key] !== undefined) {
          value.value = ps[key];
        } else {
          value.value = value.default;
        }
      });
    };

    ParameterManager.prototype.fetch = function(extra_params, action) {
      var self = this;
      if (this.interval) {
        $log.debug('cancelling interval');
        $interval.cancel(this.interval);
      }
      var url_params = {};
      angular.forEach(this.parameters, function(value, name) {
        url_params[name] = value.value;
      });
      angular.extend(url_params, extra_params);
      ++self.controller.busy;
      $log.debug('busy', self.controller.busy);
      $http.get(this.endpoint, {params: url_params})
        .success(function(data) {
          self.interval = action(data, url_params);
          self.interval.then(function() {
            $log.debug('interval complete');
            self.interval = undefined;
          }, function() {
            $log.debug('interval cancelled');
            self.interval = undefined;
          })
        })
        .error(function(data, status) {
          $log.error(data, status);
        })
        .finally(function() {
          --self.controller.busy;
          $log.debug('busy', self.controller.busy);
        });
    };
    return ParameterManager;
  }])
