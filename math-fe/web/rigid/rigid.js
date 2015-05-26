function rigid_animation($log) {
  var animation, renderer, scene, camera, cube,
    pi = Math.PI;
  function wrap_pi(angle) {
    var pi = Math.PI;
    var a = angle;
    if (-pi > angle || angle >= pi) {
      a = angle - 2 * pi * Math.floor(angle / 2.0 / pi);
      a = a < pi ? a : a - 2 * pi;
    }
    return a;
  }
  function setup() {
    setup_animation();
    setup_graph();
  }
  function setup_graph() {
  }
  function setup_animation() {
    console.log('setup');
    animation = document.getElementById('rigid-animation');
    $log.debug('animation container w/h', animation.offsetWidth, animation.offsetHeight);
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(animation.offsetWidth, animation.offsetHeight);
    animation.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    console.log('scene', scene);
    camera = new THREE.PerspectiveCamera(45, animation.offsetWidth / animation.offsetHeight, 1, 10000);
    var origin = new THREE.Vector3(0, 0, 0);
    camera.position.set(2,2,2);
    camera.lookAt(origin);
    camera.updateProjectionMatrix();
    $log.debug('camera', camera);
    scene.add(camera); // XXX check if this is needed.
    var light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(6,6,0);
    scene.add(light);

    var x = new THREE.Geometry();
    x.vertices.push(new THREE.Vector3());
    x.vertices.push(new THREE.Vector3(3,0,0));
    scene.add(new THREE.Line(x, new THREE.LineBasicMaterial({color: 0xff0000})));
    var y = new THREE.Geometry();
    y.vertices.push(new THREE.Vector3());
    y.vertices.push(new THREE.Vector3(0,3,0));
    scene.add(new THREE.Line(y, new THREE.LineBasicMaterial({lineWidth: 3, color: 0x00ff00})));
    var z = new THREE.Geometry();
    z.vertices.push(new THREE.Vector3());
    z.vertices.push(new THREE.Vector3(0,0,3));
    scene.add(new THREE.Line(z, new THREE.LineBasicMaterial({color: 0x0000ff})));

    var material = new THREE.MeshPhongMaterial();
    material.opacity = 0.5;
    material.transparent = true;

    // http://www.wolframalpha.com/input/?i=solve+b%5E2%2Bc%5E2%3D1%2C+a%5E2%2Bc%5E2%3DSqrt%5B2%5D%2C+a%5E2%2Bb%5E2%3D2
    var geometry = new THREE.BoxGeometry(1.09868,0.890446,0.455090);
    cube = new THREE.Mesh(geometry, material);
    cube.rotateX(Math.PI/5);
    cube.rotateY(Math.PI/5);
    scene.add(cube);
  }

  function draw(data, parameters) {
    $log.debug('data received');

    var margin = { left: 40, right: 20, top: 20, bottom: 25},
      c = document.getElementById('rigid-graph'),
      cWidth = c.clientWidth,
      cHeight = c.clientHeight,
      width = cWidth - margin.left - margin.right,
      height = cHeight - margin.top - margin.bottom,
      x_scale = d3.scale.linear().domain([0, parameters.t]).range([0, width]),
      y_scale = d3.scale.linear().domain([-pi, pi]).range([height, 0]),
      x_axis = d3.svg.axis().scale(x_scale).orient('bottom'),
      y_axis = d3.svg.axis().scale(y_scale).orient('left');

    d3.select('#rigid-graph svg').remove();
    var svg = d3.select('#rigid-graph')
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
      .style('fill', '#400');

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
      .style('fill', '#040');

    svg.selectAll('circle.psi')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', function(d) {
        return x_scale(d[0]);
      })
      .attr('cy', function(d) {
        return y_scale(wrap_pi(d[3]));
      })
      .classed('graph-point psi', true)
      .attr('r', 1)
      .style('fill', '#004');
  }

  function animate($interval, data, parameters) {
    $log.debug('animate');
    var i = 0;
    var t0 = new Date();
    var theta_points = d3.selectAll('#rigid-graph circle.theta')[0];
    var phi_points = d3.selectAll('#rigid-graph circle.phi')[0];
    var psi_points = d3.selectAll('#rigid-graph circle.psi')[0];

    var timer = $interval(function() {
      var d = data[i];
      // convert from ZXZ euler angles to rotation matrix
      // (sigh)
      var m = new THREE.Matrix4();
      var r1 = new THREE.Matrix4();
      var r2 = new THREE.Matrix4();
      var r3 = new THREE.Matrix4();
      r1.makeRotationZ(d[2]);
      r2.makeRotationX(d[1]);
      r3.makeRotationZ(d[3]);
      m.multiplyMatrices(r1, r2);
      m.multiply(r3);
      cube.rotation.setFromRotationMatrix(m);
      //cube.rotation.set(i,0,0,"XYZ");
      renderer.render(scene, camera);

      theta_points[i].setAttribute('r', 3);
      phi_points[i].setAttribute('r', 3);
      psi_points[i].setAttribute('r', 3);
      if (i > 0) {
        theta_points[i-1].setAttribute('r', 1);
        phi_points[i-1].setAttribute('r', 1);
        psi_points[i-1].setAttribute('r', 1);
      }

      ++i;
    }, 1000 * parameters.dt, data.length, false);
    timer.then(function() {
      $log.debug('interval complete');
      var ms = new Date() - t0;
      $log.debug(data.length, 'points in', ms, 'msec', 1000 * data.length/ms, 'Hz');
    });
    return timer;
  }

  function run() {
  }


  return {
    setup: setup,
    draw: draw,
    animate: animate,
    run: run
  }
}
angular.module('Rigid', ['ngMaterial', 'ngSanitize', 'cmServices'])
  .directive('rigidAnimation', function() {
    return {
      restrict: 'E',
      templateUrl: '/templates/rigid/rigid-animation.html'
    };
  })
  .directive('valueSliders', function() {
    return {
      restrict: 'E',
      templateUrl: '/templates/rigid/value-sliders.html'
    }
  })
  .factory()
  .controller('RigidCtrl', ['$log', '$interval', 'parameterManager', function($log, $interval, parameterManager) {
    var rigid = rigid_animation($log);
    this.parameters = {
      alphaDot0: {nameHtml: 'α&#x307;<sub>0</sub>', min: -1, max: 1, step: 0.1, default: 0.1},
      betaDot0: {nameHtml: 'β&#x307;<sub>0</sub>', min: -1, max: 1, step: 0.1, default: 0.1},
      gammaDot0: {nameHtml: 'γ&#x307;<sub>0</sub>', min: -1, max: 1, step: 0.1, default: 0.1},
      t: {nameHtml: 't', min: 1, max: 100, step: 2, default: 25},
    };
    var pm = new parameterManager(this, '/api/sicm/rigid/evolve');
    this.busy = 0;
    this.init = rigid.setup;
    this.set = pm.set;
    this.go = function() {
      pm.fetch({dt: 1/60, A: 1, B: Math.sqrt(2), C: 2}, function(data, url_params) {
        rigid.draw(data, url_params);
        return rigid.animate($interval, data, url_params)
      })
    }
  }]);

