
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
    var xa = Math.sin(parameters.theta0.value),
      xA = dx_scale(xa),
      ya = - Math.cos(parameters.theta0.value),
      yA = dy_scale(ya);

    strut.attr('x2', xA).attr('y2', yA);
    bob.attr('cx', xA).attr('cy', yA);
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

function double_pendulum() {
  var animation, strut1, strut2, pivot, bob1, bob2,
    dx_scale, dy_scale, m_scale;

  function setup() {
    animation = document.getElementById('pendulum-animation');
    strut1 = d3.select('#pendulum-frame #strut1');
    strut2 = d3.select('#pendulum-frame #strut2');
    pivot = d3.select('#pendulum-frame #pivot');
    bob1 = d3.select('#pendulum-frame #bob1');
    bob2 = d3.select('#pendulum-frame #bob2');
    m_scale = d3.scale.linear().domain([0,1]).range([4,12]);

    var cWidth = animation.clientWidth,
      cHeight = animation.clientHeight,
      smaller = Math.min(cWidth, cHeight);

    dx_scale = d3.scale.linear().domain([-1.2, 1.2]).range([0, smaller]);
    dy_scale = d3.scale.linear().domain([-1.2, 1.2]).range([smaller, 0]);
    strut1.attr('x1', dx_scale(0)).attr('y1', dx_scale(0));
    pivot.attr('cx', dx_scale(0)).attr('cy', dy_scale(0));
    d3.select('#pendulum-animation svg')
      .attr('width', cWidth)
      .attr('height', cHeight);
  }

  function diagram(parameters) {
    var l1 = parameters.l1.value,
      l2 = 1 - l1,
      m1 = parameters.m1.value,
      m2 = 1 - m1,
      xa = l1 * Math.sin(parameters.theta0.value),
      xA = dx_scale(xa),
      ya = - l1 * Math.cos(parameters.theta0.value),
      yA = dy_scale(ya),
      xB = dx_scale(xa + l2 * Math.sin(parameters.phi0.value)),
      yB = dy_scale(ya - l2 * Math.cos(parameters.phi0.value));

    strut1.attr('x2', xA).attr('y2', yA);
    strut2.attr('x1', xA).attr('y1', yA).attr('x2', xB).attr('y2', yB);
    bob1.attr('cx', xA).attr('cy', yA).attr('r', m_scale(m1));
    bob2.attr('cx', xB).attr('cy', yB).attr('r', m_scale(m2));
  }

  function animate(datum, parameters) {
    var l1 = parameters['l1'];
    var l2 = parameters['l2'];
    var m1 = parameters['m1'];
    var m2 = parameters['m2'];
    var xa = l1 * Math.sin(datum[1]),
      xA = dx_scale(xa),
      ya = -l1 * Math.cos(datum[1]),
      yA = dy_scale(ya),
      xB = dx_scale(xa + l2 * Math.sin(datum[2])),
      yB = dy_scale(ya - l2 * Math.cos(datum[2]));

    strut1.attr('x2', xA).attr('y2', yA);
    strut2.attr('x1', xA).attr('y1', yA).attr('x2', xB).attr('y2', yB);
    bob1.attr('cx', xA).attr('cy', yA).attr('r', m_scale(m1));
    bob2.attr('cx', xB).attr('cy', yB).attr('r', m_scale(m2));
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

      var graph = new GraphDraw({
        element: 'pendulum-graph',
        x: function(d) { return d[0]; },
        y_min: -Math.PI,
        y_max: Math.PI,
        wrap_pi: true,
        traces: {
          theta: {y: function(d) { return d[1]; }, color: '#f00'}

        }
      });
      this.busy = 0;
      this.parameters = {
        theta0: {nameHtml: 'θ<sub>0</sub>', min: -3.1416, max: 3.1416, step: 0.1, value: 1},
        thetaDot0: {nameHtml: 'θ&prime;<sub>0</sub>', min: -3, max: 3, step: 0.1, value: 0},
        omega: {nameHtml: 'ω', min: 0, max: 50, step: 0.1, value: 2*Math.sqrt(9.8)},
        g: {nameHtml: 'g', min: -2, max: 15, step: 0.1, value: 9.8},
        A: {nameHtml: 'A', min: 0, max: 0.3, step: 0.05, value: 0.1},
        t: {nameHtml: 't', min: 1, max: 100, step: 2, value: 25}};

      var pm = new ParameterManager(this, '/api/sicm/pendulum/driven/evolve');

      this.init = function() {
        pm.watch($scope, dp.diagram);
        dp.setup();
      };
      this.set = pm.set;
      this.go = function() {
        pm.fetchAnimation({dt: 1/60}, function(data, url_params) {
          dp.setup();
          graph.draw(data, 0, url_params.t);
          return graph.animate(data, url_params.dt, dp.animate);
        });
      };
    }])
  .controller('DoublePendulumCtrl', ['$log', '$scope', 'ParameterManager', 'GraphDraw',
    function($log, $scope, ParameterManager, GraphDraw) {
      var dp = double_pendulum();
      var graph = new GraphDraw({
        element: 'pendulum-graph',
        x: function(d) { return d[0]; },
        y_min: -Math.PI,
        y_max: Math.PI,
        wrap_pi: true,
        traces: {
          theta: {y: function(d) { return d[1]; }, color: '#400'},
          phi: {y: function(d) { return d[2]; }, color: '#040'}
        }
      });
      this.busy = 0;
      this.parameters = {
        l1: {nameHtml: 'l<sub>1</sub>', min: 0.1, max: 0.9, step: 0.1, value: 0.3 },
        m1: {nameHtml: 'm<sub>1</sub>', min: 0.1, max: 0.9, step: 0.1, value: 0.5 },
        theta0: {nameHtml: 'θ<sub>0</sub>', min: -3.1416, max: 3.1416, step: 0.1, value: 1},
        thetaDot0: {nameHtml: 'θ&prime;<sub>0</sub>', min: -3, max: 3, step: 0.1, value: 0},
        phi0: {nameHtml: 'φ<sub>0</sub>', min: -3.1416, max: 3.1416, step: 0.1, value: -1},
        phiDot0: {nameHtml: 'φ&prime;<sub>0</sub>', min: -3, max: 3, step: 0.1, value: 0},
        g: {nameHtml: 'g', min: -2, max: 15, step: 0.1, value: 9.8},
        t: {nameHtml: 't', min: 1, max: 100, step: 2, value: 25}};
      var pm = new ParameterManager(this, '/api/sicm/pendulum/double/evolve');
      this.init = function() {
        pm.watch($scope, dp.diagram);
        dp.setup();
      };
      this.set = pm.set;
      this.go = function() {
        pm.fetchAnimation({
          dt: 1 / 60,
          l2: 1 - this.parameters.l1.value,
          m2: 1 - this.parameters.m1.value
        }, function(data, url_params) {
          dp.setup();
          graph.draw(data, 0, url_params.t);
          return graph.animate(data, url_params.dt, function(datum) { dp.animate(datum, url_params); });
        });
      };
    }]);

