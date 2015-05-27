function rigid_animation($log) {
  var animation, renderer, scene, camera, cube;
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

  function animate(datum) {
    // convert from ZXZ euler angles to rotation matrix
    // (sigh)
    var m = new THREE.Matrix4();
    var r1 = new THREE.Matrix4();
    var r2 = new THREE.Matrix4();
    var r3 = new THREE.Matrix4();
    r1.makeRotationZ(datum[2]);
    r2.makeRotationX(datum[1]);
    r3.makeRotationZ(datum[3]);
    m.multiplyMatrices(r1, r2);
    m.multiply(r3);
    cube.rotation.setFromRotationMatrix(m);
    renderer.render(scene, camera);
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
  .controller('RigidCtrl', ['$log', 'parameterManager', 'graphDraw',
    function($log, parameterManager, graphDraw) {
    var rigid = rigid_animation($log);
    this.parameters = {
      alphaDot0: {nameHtml: 'α&#x307;<sub>0</sub>', min: -1, max: 1, step: 0.1, default: 0.1},
      betaDot0: {nameHtml: 'β&#x307;<sub>0</sub>', min: -1, max: 1, step: 0.1, default: 0.1},
      gammaDot0: {nameHtml: 'γ&#x307;<sub>0</sub>', min: -1, max: 1, step: 0.1, default: 0.1},
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
    this.init = rigid.setup;
    this.set = pm.set;
    this.go = function() {
      pm.fetch({dt: 1/60, A: 1, B: Math.sqrt(2), C: 2}, function(data, url_params) {
        graph.draw(data, 0, url_params.t);
        return graph.animate(data, url_params.dt, rigid.animate);
      })
    }
  }]);

