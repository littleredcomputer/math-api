angular.module('Pendulum', ['ngMaterial', 'ngSanitize', 'cmServices'])
  .config(function($mdThemingProvider) {
  })
  .directive('valueSliders', function() {
    return {
      restrict: 'E',
      templateUrl: '/templates/pendulum/value-sliders.html'
    };
  })
  .directive('doublePendulumAnimation', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/templates/pendulum/double-animation.html'
    };
  })
  .directive('drivenPendulumAnimation', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/templates/pendulum/driven-animation.html'
    };
  })
  .controller('DrivenPendulumCtrl', ['$log', '$scope', 'GraphDraw', 'wrap_pi',
    function($log, $scope, GraphDraw, wrap_pi) {
      var self = this;
      this.y = 0;
      this.t = 0;
      var graph = new GraphDraw(this, {
        element: 'pendulum-graph',
        x: function(d) { return d[0]; },
        y_min: -Math.PI,
        y_max: Math.PI,
        wrap_pi: true,
        traces: {
          theta: {y: function(d) { return d[1]; }, color: '#f00'}
        },
        endpoint: '/api/sicm/pendulum/driven/evolve'
      });
      this.busy = 0;
      this.parameters = {
        theta: {nameHtml: 'θ&#x2080;', min: -3.1416, max: 3.1416, step: 0.1, value: 1},
        thetaDot: {nameHtml: 'θ&prime;&#x2080;', min: -3, max: 3, step: 0.1, value: 0},
        omega: {nameHtml: 'ω', min: 0, max: 50, step: 0.1, value: 2*Math.sqrt(9.8)},
        g: {nameHtml: 'g', min: -2, max: 15, step: 0.1, value: 9.8},
        A: {nameHtml: 'A', min: 0, max: 0.3, step: 0.05, value: 0.1},
        t: {nameHtml: 't', min: 1, max: 100, step: 2, value: 25}};
      var p = self.parameters;
      var defaults = {};
      angular.forEach(p, function(value, key) {
        defaults[key] = value.value;
      });
      this.set = function(dict) {
        angular.forEach(Object.keys(p), function(key) {
          p[key].value = dict[key] !== undefined ? dict[key] : defaults[key];
        });
      };
      this.x1 = function() { return Math.sin(p.theta.value); };
      this.y1 = function() { return self.y + Math.cos(p.theta.value); };
      this.go = function() {
        graph.fetchAnimation({}, function(data, parameters) {
          graph.draw(data, 0, parameters.t.value);
          return graph.animate(data, function(datum) {
            self.t = datum[0];
            self.parameters.theta.value = wrap_pi(datum[1]);
            self.y = -datum[2];
          });
        });
      };
    }])
  .controller('DoublePendulumCtrl', ['$log', '$scope', 'GraphDraw', 'wrap_pi',
    function($log, $scope, GraphDraw, wrap_pi) {
      var self = this;
      this.parameters = {
        l1: {nameHtml: 'l&#x2081', min: 0.1, max: 0.9, step: 0.1, value: 0.3},
        m1: {nameHtml: 'm&#x2081', min: 0.1, max: 0.9, step: 0.1, value: 0.5},
        theta: {nameHtml: 'θ&#x2080;', min: -3.1416, max: 3.1416, step: 0.1, value: 1},
        thetaDot: {nameHtml: 'θ&prime;&#x2080;', min: -3, max: 3, step: 0.1, value: 0},
        phi: {nameHtml: 'φ&#x2080;', min: -3.1416, max: 3.1416, step: 0.1, value: -1},
        phiDot: {nameHtml: 'φ&prime;&#x2080;', min: -3, max: 3, step: 0.1, value: 0},
        g: {nameHtml: 'g', min: -2, max: 15, step: 0.1, value: 9.8},
        t: {nameHtml: 't', min: 1, max: 100, step: 2, value: 25},
        h: {nameHtml: 'h', min: 0, max: 1, step: 0.1, value: 0.2, hidden: true} // XXX experiment
      };
      var p = self.parameters;
      var defaults = {};
      angular.forEach(p, function(value, key) {
        defaults[key] = value.value;
      });
      this.set = function(dict) {
        angular.forEach(Object.keys(p), function(key) {
          p[key].value = dict[key] !== undefined ? dict[key] : defaults[key];
        });
      };

      this.x1 = function() { return p.l1.value * Math.sin(p.theta.value); };
      this.y1 = function() { return p.l1.value * Math.cos(p.theta.value); };
      this.x2 = function() { return self.x1() + (1-p.l1.value) * Math.sin(p.phi.value); };
      this.y2 = function() { return self.y1() + (1-p.l1.value) * Math.cos(p.phi.value); };
      var m_scale = d3.scale.linear().domain([0,1]).range([0.04,0.08]);
      this.m1r = function() { return m_scale(p.m1.value); };
      this.m2r = function() { return m_scale(1 - p.m1.value); };

      var graph = new GraphDraw(this, {
        element: 'pendulum-graph',
        x: function(d) { return d[0]; },
        y_min: -Math.PI,
        y_max: Math.PI,
        wrap_pi: true,
        traces: {
          theta: {y: function(d) { return d[1]; }, color: '#400'},
          phi: {y: function(d) { return d[2]; }, color: '#040'}
        },
        endpoint: '/api/sicm/pendulum/double/evolve'
      });
      this.busy = 0;
      this.go = function() {
        graph.fetchAnimation({
          l2: 1 - this.parameters.l1.value,
          m2: 1 - this.parameters.m1.value
        }, function(data, parameters) {
          console.log('p', parameters);
          graph.draw(data, 0, parameters.t.value);
          return graph.animate(data, function(datum) {
            self.t = datum[0];
            // BUG: we need to call wrap_pi around these arguments, so we'll have to make that
            // a service.
            p.theta.value = wrap_pi(datum[1]);
            p.phi.value = wrap_pi(datum[2]);
          });
        });
      };
    }]);

