angular.module('DrivenPendulum', ['ngMaterial', 'ngSanitize'])
.controller('PendulumCtrl', ['$http', '$q', function($http, $q) {
  this.go = function() {
    console.log('go!', this);
    var url_params = {};
    for (var pi = 0; pi < this.parameters.length; ++pi) {
      var p = this.parameters[pi];
      url_params[p.name] = p.value;
    }
    console.log(url_params);
    $http.get('/api/sicm/pendulum/evolve',
              {params: url_params}).success(function(data) {
                console.log('OK', data);
              }).error(function(data, status) {
                console.log('ERR', data, status);
              });
  };
  this.parameters = [{nameHtml: 'θ<sub>0</sub>',
                      name: 'theta0',
                      min: -3.1416,
                      max: 3.1416,
                      step: 0.1,
                      value: 1},
                     {nameHtml: 'θ&#x307;<sub>0</sub>',
                      name: 'thetaDot0',
                      min: -3,
                      max: 3,
                      step: 0.1,
                      value: 0},
                     {nameHtml: 'ω',
                      name: 'omega',
                      min: -2,
                      max: 15,
                      step: 0.1,
                      value: 9.8},
                     {nameHtml: 'g',
                      name: 'g',
                      min: -2,
                      max: 15,
                      step: 0.1,
                      value: 9.8},
                     {nameHtml: 'A',
                      name: 'A',
                      min: 0,
                      max: 1,
                      step: 0.05,
                      value: 0.1},
                     {nameHtml: 't',
                      name: 't',
                      min: 1,
                      max: 10,
                      step: 0.1,
                      value: 5}];
}])
.directive('valueSliders', function() {
  console.log('valuesliders');
  return {
    restrict: 'E',
    templateUrl: 'value-sliders.html'
  };
});
