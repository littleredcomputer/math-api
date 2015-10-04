
function driven_pendulum() {
  // plot the data in the graph canvas
  var animation, strut, pivot, bob, dx_scale, dy_scale;

  function setup() {
    animation = document.getElementById('pendulum-animation');
    strut = d3.select('#pendulum-frame #strut');
    pivot = d3.select('#pendulum-frame #pivot');
    bob = d3.select('#pendulum-frame #bob');

    var cWidth = animation.clientWidth,
      cHeight = animation.clientHeight,
      smaller = Math.min(cWidth, cHeight);

    dx_scale = d3.scale.linear().domain([-1.2, 1.2]).range([0, smaller]);
    dy_scale = d3.scale.linear().domain([-1.2, 1.2]).range([smaller, 0]);
    strut.attr('x1', dx_scale(0)).attr('y1', dx_scale(0));
    pivot.attr('cx', dx_scale(0)).attr('cy', dy_scale(0));
    d3.select('#pendulum-animation svg')
      .attr('width', cWidth)
      .attr('height', cHeight);
  }

  function diagram(parameters) {
    animate([0, parameters.theta.value, 0]);
  }

  function animate(datum) {
    var y1 = dy_scale(datum[2]),
      x2 = dx_scale(Math.sin(datum[1])),
      y2 = dy_scale(-Math.cos(datum[1]) + datum[2]);

    pivot.attr('cy', y1);
    strut.attr('y1', y1).attr('x2', x2).attr('y2', y2);
    bob.attr('cx', x2).attr('cy', y2);
  }

  return {
    setup: setup,
    diagram: diagram,
    animate: animate
  };
}

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
      templateUrl: '/templates/pendulum/driven-animation.html'
    };
  })
  .controller('DrivenPendulumCtrl', ['$log', '$scope', 'ParameterManager', 'GraphDraw',
    function($log, $scope, ParameterManager, GraphDraw) {
      var dp = driven_pendulum();

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
        theta: {nameHtml: 'θ<sub>0</sub>', min: -3.1416, max: 3.1416, step: 0.1, value: 1},
        thetaDot: {nameHtml: 'θ&prime;<sub>0</sub>', min: -3, max: 3, step: 0.1, value: 0},
        omega: {nameHtml: 'ω', min: 0, max: 50, step: 0.1, value: 2*Math.sqrt(9.8)},
        g: {nameHtml: 'g', min: -2, max: 15, step: 0.1, value: 9.8},
        A: {nameHtml: 'A', min: 0, max: 0.3, step: 0.05, value: 0.1},
        t: {nameHtml: 't', min: 1, max: 100, step: 2, value: 25}};

      var pm = new ParameterManager(this.parameters);

      this.init = function() {
        pm.watch($scope, dp.diagram);
        dp.setup();
      };
      this.set = pm.set;
      this.go = function() {
        var dt = 1/60;
        graph.fetchAnimation({dt: dt}, function(data, parameters) {
          dp.setup();
          graph.draw(data, 0, parameters.t.value);
          return graph.animate(data, dp.animate);
        });
      };
    }])
  .controller('DoublePendulumCtrl', ['$log', '$scope', 'GraphDraw',
    function($log, $scope, GraphDraw) {
      var self = this; // XXX needed?
      this.parameters = {
        // hm. maybe we could get away from namedHtml if we could just use the
        // unicode characters we wanted. Then we could drop angular-sanitize
        l1: {nameHtml: 'l&#x2081', min: 0.1, max: 0.9, step: 0.1, value: 0.3 },
        m1: {nameHtml: 'm&#x2081', min: 0.1, max: 0.9, step: 0.1, value: 0.5 },
        theta: {nameHtml: 'θ&#x2080;', min: -3.1416, max: 3.1416, step: 0.1, value: 1},
        thetaDot: {nameHtml: 'θ&prime;&#x2080;', min: -3, max: 3, step: 0.1, value: 0},
        phi: {nameHtml: 'φ&#x2080;', min: -3.1416, max: 3.1416, step: 0.1, value: -1},
        phiDot: {nameHtml: 'φ&prime;&#x2080;', min: -3, max: 3, step: 0.1, value: 0},
        g: {nameHtml: 'g', min: -2, max: 15, step: 0.1, value: 9.8},
        t: {nameHtml: 't', min: 1, max: 100, step: 2, value: 25},
        h: {nameHtml: 'h', min: 0, max: 1, step: 0.1, value: 0.2, hidden: true} // XXX experiment
      };

      var p = self.parameters;
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
            self.parameters.theta.value = datum[1];
            self.parameters.phi.value = datum[2];
          });
        });
      };
    }]);

