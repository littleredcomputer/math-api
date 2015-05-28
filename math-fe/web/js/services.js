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
  .constant('margin', { left: 40, right: 20, top: 20, bottom: 25 })
  .factory('graphDraw', ['$interval', 'margin', function($interval, margin) {
    function id(x) { return x; }
    function wrap_pi(angle) {
      var pi = Math.PI;
      var a = angle;
      if (-pi > angle || angle >= pi) {
        a = angle - 2 * pi * Math.floor(angle / 2.0 / pi);
        a = a < pi ? a : a - 2 * pi;
      }
      return a;
    }
    var GraphDraw = function(options) {
      this.options = options;
    };

    GraphDraw.prototype.draw = function(data, x_min, x_max) {
      var options = this.options;
      var container = document.getElementById(options.element);
      var cWidth = container.clientWidth;
      var cHeight = container.clientHeight;
      var height = cHeight - margin.top - margin.bottom;
      var width = cWidth - margin.left - margin.right;
      var x_scale = d3.scale.linear().domain([x_min, x_max]).range([0, width]);
      var y_scale = d3.scale.linear().domain([options.y_min, options.y_max]).range([height, 0]);
      var x_axis = d3.svg.axis().scale(x_scale).orient('bottom');
      var y_axis = d3.svg.axis().scale(y_scale).orient('left');


      d3.select('#' + options.element + ' svg').remove();
      var svg = d3.select('#' + options.element)
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

      var wrapper = options.wrap_pi ? wrap_pi : id;

      angular.forEach(options.traces, function(trace, t) {
        svg.selectAll('circle.' + t)
          .data(data)
          .enter()
          .append('circle')
          .attr('cx', function(d) {
            return x_scale(options.x(d));
          })
          .attr('cy', function(d) {
            return y_scale(wrapper(trace.y(d)));
          })
          .classed('graph-point ' + t, true)
          .attr('r', 1)
          .style('fill', trace.color);
      });
    };

    GraphDraw.prototype.animate = function(data, dt, action) {
      var options = this.options;
      var i = 0;
      var dot_sets = [];
      angular.forEach(this.options.traces, function(trace, t) {
        dot_sets.push(d3.selectAll('#' + options.element + ' circle.' + t)[0]);
      });
      console.log('dt', dt);
      console.log(dot_sets.length, 'dot sets');
      angular.forEach(dot_sets, function(dot_set) {
        console.log('dot set length', dot_set.length);
      });
      var data_length = data.length;
      //var wpn = window.performance.now;
      var t0 = new Date();
      var timer = $interval(function() {
        var t01 = window.performance.now();
        action(data[i]);
        var t02 = window.performance.now();
        //console.log('action in', t02-t01, 'ms');
        angular.forEach(dot_sets, function(dot_set) {
          dot_set[i].setAttribute('r', 3);
        });
        var t03 = window.performance.now();
        //console.log('set attr in', t03-t02, 'ms');
        if (i > 0) {
          angular.forEach(dot_sets, function(dot_set) {
            dot_set[i-1].setAttribute('r', 1);
          });
        }
        var t04 = window.performance.now();
        //console.log('unset attr in', t04-t03, 'ms');
        //console.log('total in', t04-t01, 'ms');

        i++;
      }, 1000 * dt, data_length, false);
      timer.then(function() {
        console.log('interval complete');
        var ms = new Date() - t0;
        console.log(data.length, 'points in', ms, 'msec', 1000 * data.length/ms, 'Hz');
      });
      return timer;
    };

    return GraphDraw;
  }]);

