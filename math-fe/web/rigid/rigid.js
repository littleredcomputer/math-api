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
    };
  })
  .factory('Axes', ['$log', function($log) {
    $log.debug('axes factory');
    var origin = new THREE.Vector3();
    // perhaps Axes should be a subclass of Group. Then it would
    // acquire all of the methods.
    function Axes(len) {
      $log.debug('axes constructor');
      this.group = new THREE.Group();
      var x = new THREE.Geometry();
      x.vertices.push(origin);
      x.vertices.push(new THREE.Vector3(len,0,0));
      this.group.add(new THREE.Line(x, new THREE.LineBasicMaterial({color: 0xff0000})));
      var y = new THREE.Geometry();
      y.vertices.push(origin);
      y.vertices.push(new THREE.Vector3(0,len,0));
      this.group.add(new THREE.Line(y, new THREE.LineBasicMaterial({color: 0x00ff00})));
      var z = new THREE.Geometry();
      z.vertices.push(origin);
      z.vertices.push(new THREE.Vector3(0,0,len));
      this.group.add(new THREE.Line(z, new THREE.LineBasicMaterial({color: 0x0000ff})));
    }
    Axes.prototype.getGroup = function() {
      return this.group;
    };
    return Axes;
  }])
  .factory('EulerAngles', ['$log', function($log) {
    $log.debug('EA factory');
    var pi = Math.PI;
    function EulerAngles() {
      $log.debug('EA constructor');
      this.gimbals = [{
        radius: 1.2,
        color: 0x555588,
        rotation: new THREE.Euler(0, 0, 0),
        circle: null,
        dot: null
      }, {
        radius: 1.1,
        color: 0x885555,
        rotation: new THREE.Euler(0, pi / 2, 0),
        circle: null,
        dot: null
      }, {
        radius: 1.0,
        color: 0x555588,
        rotation: new THREE.Euler(0, 0, 0),
        circle: null,
        dot: null
      }];
      this.group = new THREE.Group();
      for (var i = 0; i < this.gimbals.length; ++i) {
        var g = this.gimbals[i];
        var circleGeo = new THREE.CircleGeometry(g.radius, 50, 0, 2 * pi);
        circleGeo.vertices.shift();
        g.circle = new THREE.Line(circleGeo, new THREE.LineBasicMaterial({color: g.color}));
        g.circle.setRotationFromEuler(g.rotation);
        this.group.add(g.circle);
        var dotGeo = new THREE.SphereGeometry(0.05, 10, 10);
        g.dot = new THREE.Mesh(dotGeo, new THREE.MeshPhongMaterial({color: g.color}));
        this.group.add(g.dot);
      }
    }

    EulerAngles.prototype.setEulerAngles = function (theta, phi, psi) {
      this.gimbals[0].dot.position.set(this.gimbals[0].radius * Math.cos(psi),
        this.gimbals[0].radius * Math.sin(psi), 0);
      this.gimbals[1].dot.position.set(0, this.gimbals[1].radius * Math.cos(theta),
        this.gimbals[1].radius * Math.sin(theta));
      this.gimbals[2].dot.position.set(this.gimbals[2].radius * Math.cos(phi),
        this.gimbals[2].radius * Math.sin(phi), 0);
    };

    EulerAngles.prototype.getGroup = function() {
      return this.group;
    };

    return EulerAngles;
  }])
  .factory('RigidMotion', ['$log', 'Axes', 'EulerAngles', function($log, Axes, EulerAngles) {
    var origin = new THREE.Vector3();
    var r1 = new THREE.Matrix4(),
      r2 = new THREE.Matrix4(),
      r3 = new THREE.Matrix4();
    function RigidMotion(element_id) {
      var element = document.getElementById(element_id);
      $log.debug('animation container w/h', element.offsetWidth, element.offsetHeight);
      this.renderer = new THREE.WebGLRenderer({antialias: true});
      this.renderer.setSize(element.offsetWidth, element.offsetHeight);
      element.appendChild(this.renderer.domElement);
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(45, element.offsetWidth / element.offsetHeight, 1, 10000);
      this.camera.position.set(3,2,2.5);
      this.camera.up.set(0,0,1);
      this.camera.lookAt(origin);
      this.camera.updateProjectionMatrix();
      this.scene.add(this.camera); // XXX check if this is needed.
      var light = new THREE.DirectionalLight(0xffffff, 1.5);
      light.position.set(6,6,0);
      this.scene.add(light);

      this.angular_momentum = new THREE.Vector3();
      this.L = new THREE.Geometry();
      this.L.vertices.push(origin);
      this.L.vertices.push(this.angular_momentum);
      this.scene.add(new THREE.Line(this.L, new THREE.LineBasicMaterial({color: 0xffff00})));

      this.euler_angles = new EulerAngles();
      this.scene.add(this.euler_angles.getGroup());
      var a = new Axes(3);
      this.scene.add(a.getGroup());

      var material = new THREE.MeshPhongMaterial();
      material.opacity = 0.5;
      material.transparent = true;

      // http://www.wolframalpha.com/input/?i=solve+b%5E2%2Bc%5E2%3D1%2C+a%5E2%2Bc%5E2%3DSqrt%5B2%5D%2C+a%5E2%2Bb%5E2%3D2
      var geometry = new THREE.BoxGeometry(1.09868,0.890446,0.455090);
      this.cube = new THREE.Mesh(geometry, material);
      this.cube.matrixAutoUpdate = false;
      this.scene.add(this.cube);
      this.render();
    }

    RigidMotion.prototype.setEulerAngles = function(datum) {
      var theta = datum[1], phi = datum[2], psi = datum[3];
      this.euler_angles.setEulerAngles(theta, phi, psi);
      // convert from ZXZ euler angles to rotation matrix
      // (sigh)
      r1.makeRotationZ(phi);
      r2.makeRotationX(theta);
      r3.makeRotationZ(psi);
      this.cube.matrix.multiplyMatrices(r1, r2);
      this.cube.matrix.multiply(r3);
      if (datum[4]) {
        var am = datum[4];
        this.angular_momentum.set(am[0], am[1], am[2]);
        this.angular_momentum.normalize();
        // this is said to be expensive, but what else to do?
        this.L.verticesNeedUpdate = true;
      }
      this.render();
    };

    RigidMotion.prototype.render = function() { // wut -- do we need this
      this.renderer.render(this.scene, this.camera);
    };

    return RigidMotion;
  }])
  .controller('RigidCtrl', ['$scope', '$log', 'ParameterManager', 'GraphDraw', 'RigidMotion',
    function($scope, $log, ParameterManager, GraphDraw, RigidMotion) {
      var rigid;
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
      var pm = new ParameterManager(this, '/api/sicm/rigid/evolve');
      var graph = new GraphDraw({
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
        rigid = new RigidMotion('rigid-animation');
        pm.watch($scope, function(parameters) {
          rigid.setEulerAngles([0, parameters.theta0.value, parameters.phi0.value, parameters.psi0.value]);
        });
      };
      this.set = pm.set;
      this.go = function() {
        var dt = this.parameters.t.value/500;
        console.log('dt computed as ', dt, 't', this.parameters.t.value);
        pm.fetch({dt: dt, A: 1, B: Math.sqrt(2), C: 2}, function(data, url_params) {
          graph.draw(data, 0, url_params.t);
          return graph.animate(data, url_params.dt, rigid.setEulerAngles.bind(rigid));
        })
      }
    }]);

