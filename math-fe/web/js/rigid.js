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
    var pi = Math.PI;
    var axes = [
      {color: 0xff0000, rot: function(a) {return a.rotateZ(-pi/2);}},
      {color: 0x00ff00, rot: function(a) {return a;}},
      {color: 0x0000ff, rot: function(a) {return a.rotateX(pi/2);}}
    ];
    function Axes(len) {
      $log.debug('axes constructor');
      var yScale = new THREE.Vector3(1, len, 1);
      angular.forEach(axes, function(axis) {
        var ax = new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 0.01, 1, 16, 32),
          new THREE.MeshPhongMaterial({color: axis.color})
        );
        ax.scale.copy(yScale);
        this.add(axis.rot(ax).translateY(len/2));
      }, this);
    }
    Axes.prototype = new THREE.Group();
    Axes.constructor = Axes;
    return Axes;
  }])
  .factory('EulerAngles', ['$log', function($log) {
    $log.debug('EA factory');
    var pi = Math.PI;
    var no_rotation = new THREE.Euler(0, 0, 0);
    var about_y = new THREE.Euler(0, pi/2, 0);
    function EulerAngles() {
      $log.debug('EA constructor');
      this.gimbals = [{
        radius: 1.3,
        color: 0x555588,
        rotation: no_rotation,
        circle: null,
        dot: null
      }, {
        radius: 1.2,
        color: 0x885555,
        rotation: about_y,
        circle: null,
        dot: null
      }, {
        radius: 1.1,
        color: 0x555588,
        rotation: no_rotation,
        circle: null,
        dot: null
      }];
      for (var i = 0; i < this.gimbals.length; ++i) {
        var g = this.gimbals[i];
        var circleGeo = new THREE.CircleGeometry(g.radius, 50, 0, 2 * pi);
        circleGeo.vertices.shift();
        g.circle = new THREE.Line(circleGeo, new THREE.LineBasicMaterial({color: g.color}));
        g.circle.setRotationFromEuler(g.rotation);
        this.add(g.circle);
        var dotGeo = new THREE.SphereGeometry(0.05, 10, 10);
        g.dot = new THREE.Mesh(dotGeo, new THREE.MeshPhongMaterial({color: g.color}));
        this.add(g.dot);
      }
    }
    EulerAngles.prototype = new THREE.Group();
    EulerAngles.constructor = EulerAngles;

    EulerAngles.prototype.setEulerAngles = function (theta, phi, psi) {
      this.gimbals[0].dot.position.set(this.gimbals[0].radius * Math.cos(psi),
        this.gimbals[0].radius * Math.sin(psi), 0);
      this.gimbals[1].dot.position.set(0, this.gimbals[1].radius * Math.cos(theta),
        this.gimbals[1].radius * Math.sin(theta));
      this.gimbals[2].dot.position.set(this.gimbals[2].radius * Math.cos(phi),
        this.gimbals[2].radius * Math.sin(phi), 0);
    };

    return EulerAngles;
  }])
  .factory('Arrow', ['$log', function($log) {
    // A unit-length arrow, initially invisible, formed from a cylinder and a
    // cone. Use pointToward to make the arrow appear and point in the direction
    // (x,y,z) starting from the origin.
    var direction = new THREE.Vector3();
    var axis = new THREE.Vector3();
    var yHat = new THREE.Vector3(0, 1, 0);
    $log.debug('arrow factory');
    function Arrow() {
      $log.debug('arrow constructor');
      this.add(new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 1, 16, 32),
        new THREE.MeshPhongMaterial({color: 0xffff00})
      ).translateY(0.5));
      this.add(new THREE.Mesh(
        new THREE.CylinderGeometry(0, 0.05, 0.1, 16, 16),
        new THREE.MeshPhongMaterial({color: 0xffff00})
      ).translateY(1));
      this.visible = false;
    }
    Arrow.prototype = new THREE.Group();
    Arrow.constructor = Arrow;
    Arrow.prototype.pointToward = function(x, y, z) {
      direction.set(x, y, z);
      direction.normalize();
      // XXX what if yHat and direction are parallel, or antiparallel?
      axis.crossVectors(yHat,direction);
      axis.normalize();
      var angle = yHat.angleTo(direction);
      this.matrix.makeRotationAxis(axis, angle);
      this.matrixAutoUpdate = false;
      this.visible = true;
    };
    return Arrow;
  }])
  .factory('RigidMotion', ['$log', 'Axes', 'Arrow', 'EulerAngles', function($log, Axes, Arrow, EulerAngles) {
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
      var light = new THREE.DirectionalLight(0xffffff, 1.5);
      light.position.set(0,0,6);
      this.scene.add(light);
      var light2 = new THREE.DirectionalLight(0xaaaaaa, 0.75);
      light2.position.set(6,6,-2);
      this.scene.add(light2);

      this.euler_angles = new EulerAngles();
      this.scene.add(this.euler_angles);
      var a = new Axes(4);
      this.scene.add(a);

      this.angularMomentum = new Arrow();
      this.scene.add(this.angularMomentum);

      // for debugging
      //this.Ldot = new THREE.Mesh(
      //  new THREE.SphereGeometry(0.1, 16, 16),
      //  new THREE.MeshPhongMaterial({color: 0x883300}));
      //this.scene.add(Ldot);

      var material = new THREE.MeshPhongMaterial();
      material.opacity = 0.75;
      material.transparent = true;

      // http://www.wolframalpha.com/input/?i=solve+b%5E2%2Bc%5E2%3D1%2C+a%5E2%2Bc%5E2%3DSqrt%5B2%5D%2C+a%5E2%2Bb%5E2%3D2
      var geometry = new THREE.BoxGeometry(1.09868,0.890446,0.455090);
      this.cube = new THREE.Mesh(geometry, material);
      this.cube.matrixAutoUpdate = false;
      this.scene.add(this.cube);
    }

    RigidMotion.prototype.setEulerAngles = function(datum) {
      var theta = datum[1], phi = datum[2], psi = datum[3];
      this.euler_angles.setEulerAngles(theta, phi, psi);
      // convert from ZXZ euler angles to rotation matrix
      r1.makeRotationZ(phi);
      r2.makeRotationX(theta);
      r3.makeRotationZ(psi);
      this.cube.matrix.multiplyMatrices(r1, r2);
      this.cube.matrix.multiply(r3);
      if (datum[4]) {
        var am = datum[4];
        this.angularMomentum.pointToward(am[0], am[1], am[2]);
      }
      this.render();
    };

    RigidMotion.prototype.render = function() {
      this.renderer.render(this.scene, this.camera);
    };

    return RigidMotion;
  }])
  .controller('RigidCtrl', ['$scope', '$log', 'ParameterManager', 'GraphDraw', 'RigidMotion',
    function($scope, $log, ParameterManager, GraphDraw, RigidMotion) {
      var rigid;
      var pi = Math.PI;
      this.parameters = {
        theta0: {nameHtml: 'θ<sub>0</sub>', min: -pi/2, max: pi/2, step: 0.05, value: 0},
        phi0: {nameHtml: 'φ<sub>0</sub>', min: 0, max: 2*pi, step: 0.1, value: 0},
        psi0: {nameHtml: 'ψ<sub>0</sub>', min: 0, max: 2*pi, step: 0.1, value: 0},
        thetaDot0: {nameHtml: 'θ&prime;<sub>0</sub>', min: -1, max: 1, step: 0.1, value: 0.1},
        phiDot0: {nameHtml: 'φ&prime;<sub>0</sub>', min: -1, max: 1, step: 0.1, value: 0.1},
        psiDot0: {nameHtml: 'ψ&prime;<sub>0</sub>', min: -1, max: 1, step: 0.1, value: 0.1},
        t: {nameHtml: 't', min: 1, max: 100, step: 2, value: 25}
      };
      var pm = new ParameterManager(this.parameters);
      var graph = new GraphDraw(this, {
        element: 'rigid-graph',
        x: function(d) { return d[0]; },
        y_min: -Math.PI,
        y_max: Math.PI,
        wrap_pi: true,
        traces: {
          theta: {y: function(d) { return d[1]; }, color: '#400'},
          phi: {y: function(d) { return d[2]; }, color: '#040'},
          psi: {y: function(d) { return d[3]; }, color: '#004'}
        },
        endpoint: '/api/sicm/rigid/evolve'
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
        graph.fetchAnimation({A: 1, B: Math.sqrt(2), C: 2}, function(data, parameters) {
          graph.draw(data, 0, parameters.t.value);
          return graph.animate(data, rigid.setEulerAngles.bind(rigid));
        })
      }
    }])
  .controller('EulerCtrl', ['$scope', '$log', 'ParameterManager', 'RigidMotion',
    function($scope, $log, ParameterManager, RigidMotion) {
      var rigid;
      var pi = Math.PI;
      this.parameters = {
        theta: {nameHtml: 'θ', min: -pi/2, max: pi/2, step: 0.05, value: 0},
        phi: {nameHtml: 'φ', min: 0, max: 2*pi, step: 0.1, value: 0},
        psi: {nameHtml: 'ψ', min: 0, max: 2*pi, step: 0.1, value: 0}
      };
      var pm = new ParameterManager(this);
      this.init = function() {
        rigid = new RigidMotion();
        pm.watch($scope, function(parameters) {
          rigid.setEulerAngles([0, parameters.theta.value, parameters.phi.value, parameters.psi.value])
        })
      }
    }]);

