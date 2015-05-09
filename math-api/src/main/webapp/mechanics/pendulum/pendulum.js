

function draw(data, t) {
  // plot the data in the graph canvas
  var margin = { left: 40, right: 20, top: 20, bottom: 25},
    pi = Math.PI,
    c = document.getElementById('pendulum-graph'),
    cWidth = c.clientWidth,
    cHeight = c.clientHeight,
    width = cWidth - margin.left - margin.right,
    height = cHeight - margin.top - margin.bottom,
    x_scale = d3.scale.linear().domain([0, t]).range([0, width]),
    y_scale = d3.scale.linear().domain([-pi, pi]).range([height, 0]),
    x_axis = d3.svg.axis().scale(x_scale).orient('bottom'),
    y_axis = d3.svg.axis().scale(y_scale).orient('left'),
    smaller = Math.min(width, height),
    dx_scale = d3.scale.linear().domain([-1.2, 1.2]).range([0, smaller]),
    dy_scale = d3.scale.linear().domain([-1.2, 1.2]).range([smaller, 0]);

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
  var circles = svg.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', function(d) { return x_scale(d[0]); })
    .attr('cy', function(d) {
      var y = d[1], y2;
      if (-pi > y || y >= pi) {
        y2 = y - 2 * pi * Math.floor(y / 2.0 / pi);
        y2 = y2 < pi ? y2 : y2 - 2 * pi;
      } else {
        y2 = y;
      }
      return y_scale(y2);
    })
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

  d3.select('#pendulum-animation svg').remove();
  var anim = d3.select('#pendulum-animation')
    .append('svg')
    .attr('width', cWidth)
    .attr('height', cHeight)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var strut = anim.append('line')
    .attr('class', 'pendulum-strut')
    .attr('x1', dx_scale(0));

  var spot = anim.append('circle')
    .attr('fill','red')
    .attr('cx', dx_scale(0))
    .attr('cy', dy_scale(0))
    .attr('r', 3);

  var bot = anim.append('circle')
    .attr('fill','blue')
    .attr('cx', dx_scale(0))
    .attr('cy', dy_scale(-1))
    .attr('r', 3);

  var rt = anim.append('circle')
    .attr('fill', 'green')
    .attr('cx', dx_scale(1))
    .attr('cy', dy_scale(0))
    .attr('r', 3);

  for (var i = 0; i < data.length; ++i) {
    var d = data[i];
    strut.transition()
      .delay(d[0] * 1000.)
      .duration(0)
      .attr('y1', dy_scale(d[2]))
      .attr('x2', dx_scale(Math.sin(d[1])))
      .attr('y2', dy_scale(-Math.cos(d[1]) + d[2]));
  }
}

angular.module('DrivenPendulum', ['ngMaterial', 'ngSanitize'])
  .controller('PendulumCtrl', ['$http', function($http) {
    this.go = function() {
      console.log('go!', this);
      var url_params = {};
      angular.forEach(this.parameters, function(p) {
        url_params[p.name] = p.value;
      });
      $http.get('/api/sicm/pendulum/evolve', {params: url_params})
        .success(function(data) {
          console.log('OK', data);
          draw(data, url_params.t);
        }).error(function(data, status) {
          console.log('ERR', data, status);
        });
    };
    this.parameters = [
      {nameHtml: 'θ<sub>0</sub>', name: 'theta0', min: -3.1416, max: 3.1416, step: 0.1, value: 1},
      {nameHtml: 'θ&#x307;<sub>0</sub>', name: 'thetaDot0', min: -3, max: 3, step: 0.1, value: 0},
      {nameHtml: 'ω', name: 'omega', min: 0, max: 15, step: 0.1, value: 2*Math.sqrt(9.8)},
      {nameHtml: 'g', name: 'g', min: -2, max: 15, step: 0.1, value: 9.8},
      {nameHtml: 'A', name: 'A', min: 0, max: 1, step: 0.05, value: 0.1},
      {nameHtml: 't', name: 't', min: 1, max: 100, step: 2, value: 25}];
  }])
  .directive('valueSliders', function() {
    console.log('valuesliders');
    return {
      restrict: 'E',
      templateUrl: 'value-sliders.html'
    };
  });

