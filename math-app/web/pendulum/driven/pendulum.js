
function wrap_pi(angle) {
  var pi = Math.PI;
  var a = angle;
  if (-pi > angle || angle >= pi) {
    a = angle - 2 * pi * Math.floor(angle / 2.0 / pi);
    a = a < pi ? a : a - 2 * pi;
  }
  return a;
}

function driven_pendulum() {
  // plot the data in the graph canvas
  var margin = { left: 40, right: 20, top: 20, bottom: 25},
    animation, strut, pivot, bob, dx_scale, dy_scale;

  function setup() {
    animation = document.getElementById('pendulum-animation');
    strut = d3.select('#pendulum-frame #strut');
    pivot = d3.select('#pendulum-frame #pivot');
    bob = d3.select('#pendulum-frame #bob');

    var cWidth = animation.clientWidth,
      cHeight = animation.clientHeight,
      width = cWidth - margin.left - margin.top,
      height = cHeight - margin.top - margin.bottom,
      smaller = Math.min(width, height);

    dx_scale = d3.scale.linear().domain([-1.2, 1.2]).range([0, smaller]);
    dy_scale = d3.scale.linear().domain([-1.2, 1.2]).range([smaller, 0]);
    strut.attr('x1', dx_scale(0)).attr('y1', dx_scale(0));
    pivot.attr('cx', dx_scale(0)).attr('cy', dy_scale(0));
    d3.select('#pendulum-frame')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
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

  function draw(data, parameters) {
    var pi = Math.PI,
      c = document.getElementById('pendulum-graph'),
      cWidth = c.clientWidth,
      cHeight = c.clientHeight,
      width = cWidth - margin.left - margin.right,
      height = cHeight - margin.top - margin.bottom,
      x_scale = d3.scale.linear().domain([0, parameters.t]).range([0, width]),
      y_scale = d3.scale.linear().domain([-pi, pi]).range([height, 0]),
      x_axis = d3.svg.axis().scale(x_scale).orient('bottom'),
      y_axis = d3.svg.axis().scale(y_scale).orient('left');

    d3.select('#pendulum-graph svg').remove();
    var svg = d3.select('#pendulum-graph')
      .append('svg')
      .attr('width', cWidth)
      .attr('height', cHeight)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg.append('g')
      .attr('class','x_axis')
      .attr('transform','translate(0,'+height+')')
      .call(x_axis);
    svg.append('g')
      .attr('class', 'y_axis')
      .call(y_axis);

    svg.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', function(d) { return x_scale(d[0]); })
      .attr('cy', function(d) { return y_scale(wrap_pi(d[1])) })
      .attr('class', 'graph-point')
      .attr('r', 1)
      .transition()
      .delay(function(d) {return d[0] * 1000.;})
      .duration(100)
      .style('fill', 'red')
      .attr('r', 3)
      .transition()
      .duration(100)
      .style('fill', 'black')
      .attr('r', 1);

    for (var i = 0; i < data.length; ++i) {
      var d = data[i];
      var delay = d[0] * 1000.,
        y1 = dy_scale(d[2]),
        x2 = dx_scale(Math.sin(d[1])),
        y2 = dy_scale(-Math.cos(d[1]) + d[2]);

      strut.transition()
        .delay(delay)
        .duration(10)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2);
      pivot.transition().delay(delay).duration(10).attr('cy', y1);
      bob.transition().delay(delay).duration(10).attr('cx', x2).attr('cy', y2);
    }
  }

  return {
    setup: setup,
    diagram: diagram,
    draw: draw
  };

}

function double_pendulum() {
  var pi = Math.PI,
    margin = { left: 40, right: 20, top: 20, bottom: 25},
    animation, strut1, strut2, pivot, bob1, bob2,
    dx_scale, dy_scale;

  function setup() {
    animation = document.getElementById('pendulum-animation');
    strut1 = d3.select('#pendulum-frame #strut1');
    strut2 = d3.select('#pendulum-frame #strut2');
    pivot = d3.select('#pendulum-frame #pivot');
    bob1 = d3.select('#pendulum-frame #bob1');
    bob2 = d3.select('#pendulum-frame #bob2');

    var cWidth = animation.clientWidth,
      cHeight = animation.clientHeight,
      width = cWidth - margin.left - margin.top,
      height = cHeight - margin.top - margin.bottom,
      smaller = Math.min(width, height);

    dx_scale = d3.scale.linear().domain([-1.2, 1.2]).range([0, smaller]);
    dy_scale = d3.scale.linear().domain([-1.2, 1.2]).range([smaller, 0]);
    strut1.attr('x1', dx_scale(0)).attr('y1', dx_scale(0));
    pivot.attr('cx', dx_scale(0)).attr('cy', dy_scale(0));
    d3.select('#pendulum-frame')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    d3.select('#pendulum-animation svg')
      .attr('width', cWidth)
      .attr('height', cHeight);
  }

  function diagram(parameters) {
    var l1 = parameters.l1.value,
      l2 = 1.0 - l1,
      xa = l1 * Math.sin(parameters.theta0.value),
      xA = dx_scale(xa),
      ya = - l1 * Math.cos(parameters.theta0.value),
      yA = dy_scale(ya),
      xB = dx_scale(xa + l2 * Math.sin(parameters.phi0.value)),
      yB = dy_scale(ya - l2 * Math.cos(parameters.phi0.value));

    strut1.attr('x2', xA).attr('y2', yA);
    strut2.attr('x1', xA).attr('y1', yA).attr('x2', xB).attr('y2', yB);
    bob1.attr('cx', xA).attr('cy', yA);
    bob2.attr('cx', xB).attr('cy', yB);
  }

  function draw(data, parameters) {
    // plot the data in the graph canvas

    var c = document.getElementById('pendulum-graph'),
      cWidth = c.clientWidth,
      cHeight = c.clientHeight,
      width = cWidth - margin.left - margin.right,
      height = cHeight - margin.top - margin.bottom,
      x_scale = d3.scale.linear().domain([0, parameters.t]).range([0, width]),
      y_scale = d3.scale.linear().domain([-pi, pi]).range([height, 0]),
      x_axis = d3.svg.axis().scale(x_scale).orient('bottom'),
      y_axis = d3.svg.axis().scale(y_scale).orient('left');

    d3.select('#pendulum-graph svg').remove();
    var svg = d3.select('#pendulum-graph')
      .append('svg')
      .attr('width', cWidth)
      .attr('height', cHeight)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg.append('g')
      .attr('class', 'x_axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(x_axis);
    svg.append('g')
      .attr('class', 'y_axis')
      .call(y_axis);

    svg.selectAll('circle.theta')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', function(d) {
        return x_scale(d[0]);
      })
      .attr('cy', function(d) {
        return y_scale(wrap_pi(d[1]));
      })
      .classed('graph-point theta', true)
      .attr('r', 1)
      .style('fill', '#400')
      .transition()
      .delay(function(d) {
        return d[0] * 1000.;
      })
      .duration(100)
      .style('fill', 'red')
      .attr('r', 3)
      .transition()
      .duration(100)
      .style('fill', '#400')
      .attr('r', 1);

    svg.selectAll('circle.phi')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', function(d) {
        return x_scale(d[0]);
      })
      .attr('cy', function(d) {
        return y_scale(wrap_pi(d[2]));
      })
      .classed('graph-point phi', true)
      .attr('r', 1)
      .style('fill', '#040')
      .transition()
      .delay(function(d) {
        return d[0] * 1000.;
      })
      .duration(100)
      .style('fill', 'green')
      .attr('r', 3)
      .transition()
      .duration(100)
      .style('fill', '#040')
      .attr('r', 1);

    for (var i = 0; i < data.length; ++i) {
      var d = data[i];
      var delay = d[0] * 1000.,
        xa = parameters['l1'] * Math.sin(d[1]),
        xA = dx_scale(xa),
        ya = -parameters['l1'] * Math.cos(d[1]),
        yA = dy_scale(ya),
        xB = dx_scale(xa + parameters.l2 * Math.sin(d[2])),
        yB = dy_scale(ya - parameters.l2 * Math.cos(d[2]));

      strut1.transition()
        .delay(delay)
        .duration(10)
        .attr('x2', xA)
        .attr('y2', yA);
      strut2.transition()
        .delay(delay)
        .duration(10)
        .attr('x1', xA)
        .attr('y1', yA)
        .attr('x2', xB)
        .attr('y2', yB);
      bob1.transition()
        .delay(delay)
        .duration(10)
        .attr('cx', xA)
        .attr('cy', yA);
      bob2.transition()
        .delay(delay)
        .duration(10)
        .attr('cx', xB)
        .attr('cy', yB);
    }
  }

  return {
    setup: setup,
    diagram: diagram,
    draw: draw
  };
}

angular.module('Pendulum', ['ngMaterial', 'ngSanitize'])
  .directive('valueSliders', function() {
    return {
      restrict: 'E',
      templateUrl: '/templates/value-sliders.html'
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
  .controller('DrivenPendulumCtrl', ['$log', '$scope', '$http', function($log, $scope, $http) {
    var self = this;
    var dp = driven_pendulum();
    this.parameters = {
      theta0: {nameHtml: 'θ<sub>0</sub>', min: -3.1416, max: 3.1416, step: 0.1, value: 1},
      thetaDot0: {nameHtml: 'θ&#x307;<sub>0</sub>', min: -3, max: 3, step: 0.1, value: 0},
      omega: {nameHtml: 'ω', min: 0, max: 50, step: 0.1, value: 2*Math.sqrt(9.8)},
      g: {nameHtml: 'g', min: -2, max: 15, step: 0.1, value: 9.8},
      A: {nameHtml: 'A', min: 0, max: 0.3, step: 0.05, value: 0.1},
      t: {nameHtml: 't', min: 1, max: 100, step: 2, value: 25}};
    this.init = function() {
      angular.forEach(['theta0'], function(param) {
        $scope.$watch(function() {
          return self.parameters[param].value;
        }, function() {
          dp.diagram(self.parameters);
        })
      });
      dp.setup();
    }
    this.go = function() {
      var url_params = {};
      angular.forEach(this.parameters, function(value, name) {
        url_params[name] = value.value;
      });
      $http.get('/api/sicm/pendulum/driven/evolve', {params: url_params})
        .success(function(data) {
          dp.draw(data, url_params);
        })
        .error(function(data, status) {
          $log.error(data, status);
        })
        .finally(function() {
          $log.debug('FINALLY');
        });
    };
  }])
  .controller('DoublePendulumCtrl', ['$log', '$scope', '$http', function($log, $scope, $http) {
    var self = this;
    var dp = double_pendulum();
    this.parameters = {
      l1: {nameHtml: 'l<sub>1</sub>', min: 0.1, max: 0.9, step: 0.1, value: 0.3 },
      m1: {nameHtml: 'm<sub>1</sub>', min: 0.1, max: 0.9, step: 0.1, value: 0.5 },
      theta0: {nameHtml: 'θ<sub>0</sub>', min: -3.1416, max: 3.1416, step: 0.1, value: 1},
      thetaDot0: {nameHtml: 'θ&#x307;<sub>0</sub>', min: -3, max: 3, step: 0.1, value: 0},
      phi0: {nameHtml: 'φ<sub>0</sub>', min: -3.1416, max: 3.1416, step: 0.1, value: -1},
      phiDot0: {nameHtml: 'φ&#x307;<sub>0</sub>', min: -3, max: 3, step: 0.1, value: 0},
      g: {nameHtml: 'g', min: -2, max: 15, step: 0.1, value: 9.8},
      t: {nameHtml: 't', min: 1, max: 100, step: 2, value: 25}};
    this.init = function() {
      $log.debug('LOADED');
      angular.forEach(['l1', 'm1', 'theta0', 'phi0'], function(param) {
        $scope.$watch(function() {
          return self.parameters[param].value;
        }, function() {
          dp.diagram(self.parameters);
        });
      });
      dp.setup();
    }
    this.go = function() {
      var url_params = {};
      angular.forEach(this.parameters, function(value, name) {
        url_params[name] = value.value;
      });
      url_params.l2 = 1 - url_params['l1'];
      url_params.m2 = 1 - url_params['m1'];
      $http.get('/api/sicm/pendulum/double/evolve', {params: url_params})
        .success(function(data) {
          dp.draw(data, url_params);
        })
        .error(function(data, status) {
          $log.error(data, status);
        })
        .finally(function() {
          $log.debug('FINALLY');
        });
    };
  }]);

