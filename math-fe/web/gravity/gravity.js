function gravity() {
  // plot the data in the graph canvas
  var animation, strut, pivot, bob, dx_scale, dy_scale;

  function setup() {
    animation = document.getElementById('gravity-animation');

    var cWidth = animation.clientWidth,
      cHeight = animation.clientHeight,
      smaller = Math.min(cWidth, cHeight);

    dx_scale = d3.scale.linear().domain([-1.2, 1.2]).range([0, smaller]);
    dy_scale = d3.scale.linear().domain([-1.2, 1.2]).range([smaller, 0]);
    //strut.attr('x1', dx_scale(0)).attr('y1', dx_scale(0));
    //pivot.attr('cx', dx_scale(0)).attr('cy', dy_scale(0));
    d3.select('#pendulum-animation svg')
      .attr('width', cWidth)
      .attr('height', cHeight);
  }

  function diagram(parameters) {
    var xa = Math.sin(parameters.theta.value),
      xA = dx_scale(xa),
      ya = - Math.cos(parameters.theta.value),
      yA = dy_scale(ya);

    //strut.attr('x2', xA).attr('y2', yA);
    //bob.attr('cx', xA).attr('cy', yA);
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

angular.module('Gravity', ['ngMaterial', 'ngSanitize', 'cmServices'])
  .directive('valueSliders', function() {
    return {
      restrict: 'E',
      templateUrl: '/templates/pendulum/value-sliders.html'
    };
  })
  .directive('gravityAnimation', function() {
    return {
      restrict: 'E',
      templateUrl: '/templates/pendulum/double-animation.html'
    };
  })
  .controller('GravityCtrl', ['$log', '$scope', 'ParameterManager',
    function($log, $scope, ParameterManager) {
      var g = gravity();

      this.busy = 0;
      this.parameters = {
        theta: {nameHtml: 'θ<sub>0</sub>', min: -3.1416, max: 3.1416, step: 0.1, value: 1},
        thetaDot: {nameHtml: 'θ&prime;<sub>0</sub>', min: -3, max: 3, step: 0.1, value: 0},
        omega: {nameHtml: 'ω', min: 0, max: 50, step: 0.1, value: 2*Math.sqrt(9.8)},
        g: {nameHtml: 'g', min: -2, max: 15, step: 0.1, value: 9.8},
        A: {nameHtml: 'A', min: 0, max: 0.3, step: 0.05, value: 0.1},
        t: {nameHtml: 't', min: 1, max: 100, step: 2, value: 25}};

      var pm = new ParameterManager(this, '/api/sicm/pendulum/gravity/evolve');

      this.init = function() {
        pm.watch($scope, g.diagram);
        g.setup();
      };
      this.set = pm.set;
      this.go = function() {
        pm.fetchAnimation({dt: 1/60}, function(data, url_params) {
          dp.setup();
          graph.draw(data, 0, url_params.t);
          return graph.animate(data, url_params.dt, dp.animate);
        });
      };
    }]);

