
function rigid_animation($log) {
  var pi = Math.PI;
  var animation, renderer, scene, camera, cube;
  var angular_momentum = new THREE.Vector3(), L;
  var origin = new THREE.Vector3(0, 0, 0);
  var gimbals = [{
    radius: 1.2,
    color: 0x555588,
    rotation: new THREE.Euler(0, 0, 0),
    circle: null,
    dot: null
  }, {
    radius: 1.1,
    color: 0x885555,
    rotation: new THREE.Euler(0, pi/2, 0),
    circle: null,
    dot: null
  }, {
    radius: 1.0,
    color: 0x555588,
    rotation: new THREE.Euler(0, 0, 0),
    circle: null,
    dot: null
  }];


  function setup() {
    animation = document.getElementById('rigid-animation');
    $log.debug('animation container w/h', animation.offsetWidth, animation.offsetHeight);
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(animation.offsetWidth, animation.offsetHeight);
    animation.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, animation.offsetWidth / animation.offsetHeight, 1, 10000);
    camera.position.set(3,2,2.5);
    camera.up.set(0,0,1);
    camera.lookAt(origin);
    camera.updateProjectionMatrix();
    $log.debug('camera', camera);
    scene.add(camera); // XXX check if this is needed.
    var light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(6,6,0);
    scene.add(light);

    var x = new THREE.Geometry();
    x.vertices.push(origin);
    x.vertices.push(new THREE.Vector3(3,0,0));
    scene.add(new THREE.Line(x, new THREE.LineBasicMaterial({color: 0xff0000})));
    var y = new THREE.Geometry();
    y.vertices.push(origin);
    y.vertices.push(new THREE.Vector3(0,3,0));
    scene.add(new THREE.Line(y, new THREE.LineBasicMaterial({color: 0x00ff00})));
    var z = new THREE.Geometry();
    z.vertices.push(origin);
    z.vertices.push(new THREE.Vector3(0,0,3));
    scene.add(new THREE.Line(z, new THREE.LineBasicMaterial({color: 0x0000ff})));
    L = new THREE.Geometry();
    L.vertices.push(origin);
    L.vertices.push(angular_momentum);
    scene.add(new THREE.Line(L, new THREE.LineBasicMaterial({color: 0xffff00})));


    for (var i = 0; i < gimbals.length; ++i) {
      var g = gimbals[i];
      var circleGeo = new THREE.CircleGeometry(g.radius, 50, 0, 2*pi);
      circleGeo.vertices.shift();
      g.circle = new THREE.Line(circleGeo, new THREE.LineBasicMaterial({color: g.color}));
      g.circle.setRotationFromEuler(g.rotation);
      scene.add(g.circle);
      var dotGeo = new THREE.SphereGeometry(0.05, 10, 10);
      g.dot = new THREE.Mesh(dotGeo, new THREE.MeshPhongMaterial({color: g.color}));
      scene.add(g.dot);
    }

    var material = new THREE.MeshPhongMaterial();
    material.opacity = 0.5;
    material.transparent = true;

    // http://www.wolframalpha.com/input/?i=solve+b%5E2%2Bc%5E2%3D1%2C+a%5E2%2Bc%5E2%3DSqrt%5B2%5D%2C+a%5E2%2Bb%5E2%3D2
    var geometry = new THREE.BoxGeometry(1.09868,0.890446,0.455090);
    cube = new THREE.Mesh(geometry, material);
    cube.matrixAutoUpdate = false;
    scene.add(cube);
    renderer.render(scene, camera);
  }

  var m = new THREE.Matrix4(),
    r1 = new THREE.Matrix4(),
    r2 = new THREE.Matrix4(),
    r3 = new THREE.Matrix4();

  function animate(datum) {
    // convert from ZXZ euler angles to rotation matrix
    // (sigh)
    var theta = datum[1], phi = datum[2], psi = datum[3];
    //thetaCircle.rotation.set(0, pi/2, datum[3], 'ZYX');
    //thetaCircle.updateMatrix();

    gimbals[0].dot.position.set(gimbals[0].radius*Math.cos(psi),
      gimbals[0].radius*Math.sin(psi), 0);
    gimbals[1].dot.position.set(0, gimbals[1].radius*Math.cos(theta),
      gimbals[1].radius*Math.sin(theta));
    gimbals[2].dot.position.set(gimbals[2].radius*Math.cos(phi),
      gimbals[2].radius*Math.sin(phi), 0);

    r1.makeRotationZ(datum[2]);
    r2.makeRotationX(datum[1]);
    r3.makeRotationZ(datum[3]);
    cube.matrix.multiplyMatrices(r1, r2);
    cube.matrix.multiply(r3);
    if (datum[4]) {
      var am = datum[4];
      angular_momentum.set(am[0], am[1], am[2]);
      angular_momentum.normalize();
      // this is said to be expensive, but what else to do?
      L.verticesNeedUpdate = true;
    }
    renderer.render(scene, camera);
    //$log.debug(datum);
  }

  return {
    setup: setup,
    animate: animate
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
  .factory('EulerAngle', ['$log', function() {
    // inputs?
    // ORDER, intrinsic vs. extrinsic
    // ranges are: 0..2pi, -pi/2 .. pi/2, 0..2pi
    //

  }])
  .controller('RigidCtrl', ['$scope', '$log', 'parameterManager', 'graphDraw',
    function($scope, $log, parameterManager, graphDraw) {
      var rigid = rigid_animation($log);
      var pi = Math.PI;
      this.parameters = {
        theta0: {nameHtml: 'θ<sub>0</sub>', min: -pi/2, max: pi/2, step: 0.05, default: 0},
        phi0: {nameHtml: 'φ<sub>0</sub>', min: 0, max: 2*pi, step: 0.1, default: 0},
        psi0: {nameHtml: 'ψ<sub>0</sub>', min: 0, max: 2*pi, step: 0.1, default: 0},
        thetaDot0: {nameHtml: 'θ&prime;<sub>0</sub>', min: -1, max: 1, step: 0.1, default: 0.1},
        phiDot0: {nameHtml: 'φ&prime;<sub>0</sub>', min: -1, max: 1, step: 0.1, default: 0.1},
        psiDot0: {nameHtml: 'ψ&prime;<sub>0</sub>', min: -1, max: 1, step: 0.1, default: 0.1},
        t: {nameHtml: 't', min: 1, max: 100, step: 2, default: 25}
      };
      var pm = new parameterManager(this, '/api/sicm/rigid/evolve');
      var graph = new graphDraw({
        element: 'rigid-graph',
        x: function(d) { return d[0]; },
        y_min: -Math.PI,
        y_max: Math.PI,
        wrap_pi: true,
        traces: {
          theta: {y: function(d) { return d[1]; }, color: '#400'},
          phi: {y: function(d) { return d[2]; }, color: '#040'},
          psi: {y: function(d) { return d[3]; }, color: '#004'}
        }
      });
      this.busy = 0;
      this.init = function() {
        pm.watch($scope, function(parameters) {
          rigid.animate([0, parameters.theta0.value, parameters.phi0.value, parameters.psi0.value]);
        });
        rigid.setup();
      };
      this.set = pm.set;
      this.go = function() {
        var dt = this.parameters.t.value/500;
        console.log('dt computed as ', dt, 't', this.parameters.t.value);
        pm.fetch({dt: dt, A: 1, B: Math.sqrt(2), C: 2}, function(data, url_params) {
          graph.draw(data, 0, url_params.t);
          return graph.animate(data, url_params.dt, rigid.animate);
        })
      }
    }]);

