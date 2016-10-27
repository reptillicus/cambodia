
// var THREE = require('../components/three.js/build/three.js');
// var geotiff = require('../components/geotiff/src/geotiff.js');
var utils = require('./utils.js');
module.exports = mesh_view;

function mesh_view () {
  'use strict';
  // SCENE
  var scene, camera, renderer, 
      container, controls, 
      customUniforms, grid, raycaster, 
      map_width, map_height, plane,
      mouse = new THREE.Vector2();

  function onDocumentMouseMove( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  }
  document.addEventListener( 'mousemove', onDocumentMouseMove, false );


  raycaster = new THREE.Raycaster();
  scene = new THREE.Scene();
  // CAMERA
  var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
  var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
  camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene.add(camera);
  camera.position.set(0,2000,1000);
  camera.lookAt(scene.position);  
  // RENDERER
  
  renderer = new THREE.WebGLRenderer( {antialias:true} );
 
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  container = document.getElementById( 'map' );
  container.appendChild( renderer.domElement );
  // EVENTS
  // THREEx.WindowResize(renderer, camera);
  // THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
  // CONTROLS
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  
  // LIGHT
  var light = new THREE.AmbientLight(0xffffff);
  light.position.set(0,1000,0);
  scene.add(light);
  
   // // LIGHT
  // var light2 = new THREE.PointLight(0xffffff);
  // light2.position.set(1000,1000,1000);
  // scene.add(light2);
  // FLOOR
  // var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
  // floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
  // floorTexture.repeat.set( 10, 10 );
  // var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
  // var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
  // var floor = new THREE.Mesh(floorGeometry, floorMaterial);
  // floor.position.y = -0.5;
  // floor.rotation.x = Math.PI / 2;
  // scene.add(floor);
  // SKYBOX
  // var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
  // var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
  // var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
  // scene.add(skyBox);
  var axisHelper = new THREE.AxisHelper( 20 );
  scene.add( axisHelper );
  ////////////
  // CUSTOM //
  ////////////
  
  // texture used to generate "bumpiness"
  var loader = new THREE.TextureLoader();
  loader.load('images/cambodia_heightmap.png', function (bumpTexture) {
    map_width = bumpTexture.image.width;
    map_height = bumpTexture.image.height;
    // the extents are hard coded from the geoTIFF header info. Probably could load the geoTiff itself
    // to be more robust, but this is one-off. 
    grid = new utils.grid2d(map_width, map_height, 
                [14.9082, 100.95], [10.01653529, 108.64166]);
    grid.set_scene_size(SCREEN_WIDTH, SCREEN_HEIGHT);
    

    bumpTexture.minFilter = THREE.LinearFilter;
    // bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping; 
    // magnitude of normal displacement
    var bumpScale   = 60.0;
    
    // use "this." to create global object
    customUniforms = {
      bumpTexture:  { type: "t", value: bumpTexture },
      bumpScale:      { type: "f", value: bumpScale },
    };
    
    // create custom material from the shader code above
    //   that is within specially labelled script tags
    var customMaterial = new THREE.ShaderMaterial( 
    {
      uniforms: customUniforms,
      vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
      fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
      side: THREE.DoubleSide
    });
    
    var planeGeo = new THREE.PlaneGeometry( bumpTexture.image.width, bumpTexture.image.height, 500, 400 );
    plane = new THREE.Mesh( planeGeo, customMaterial );
    console.log(plane)
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0;
    plane.position.x = 0;
    scene.add( plane );
    
    add_markers(scene);
    
    add_marker(11.5449, 104.8922, plane);
  });

  function add_marker(lat, lon, plane) {
    var scene_pos = grid.latlon2scene(lat, lon);
    var p1 = new THREE.Vector3(-scene_pos[0], 0, scene_pos[1]);
    var p2 = new THREE.Vector3(-scene_pos[0], 20000, scene_pos[1]);
    var arrow = new THREE.ArrowHelper(p2.clone().normalize(), p1, 100, 0xFFFFFF);
    var direction = new THREE.Vector3 (0, -1, 0);
    raycaster = new THREE.Raycaster(p1, direction);
    var myIntersects = raycaster.intersectObject(plane);
    console.log(myIntersects);
    scene.add(arrow);
  }
  // console.log(material) 

  function add_markers() {
    d3.csv('data/positions.csv', function (d) {
      return {
        datetime_utc: new Date(d.datetime_utc),
        lat: +d.lat,
        lon: +d.lon
      };
    }, function (data) {
      data = data.slice(0, 100);
      console.log(data)
      data.forEach(function (d) {
        add_marker(d.lat, d.lon, plane);
      });
    });
  }
  // d3.csv('data/positions.csv', function (d) {
  //   return {
  //     datetime_utc: new Date(d.datetime_utc),
  //     lat: +d.lat,
  //     lon: +d.lon
  //   }
  // }, function (data) {
   
  //   var group_by_date = d3.nest()
  //     .key(function (d) {return d.datetime_utc.toDateString()})
  //     .entries(data);

    
  //   function render_points (group) {
  //     var pc_geometry = new THREE.Geometry();
  //     var pc_material = new THREE.PointsMaterial(
  //       {size: 0.3, color:0xff0000, transparent:true, opacity:0.8}
  //     );
  //     var particles = new THREE.Points( pc_geometry, pc_material); 
  //     var vertical_marker_group = new THREE.Object3D();
  //     var circle_marker_group = new THREE.Object3D();

    
  //     group.values.forEach(function (d) {

  //       var vec = latlon2vector(d.lat, d.lon, EARTH_RADIUS, 0)
  //       pc_geometry.vertices.push(vec);
  //       var vm = new THREE.Mesh( vertical_marker_geom, vertical_marker_mesh );
  //       vm.position.set(vec.x, vec.y, vec.z - 5)
  //       vertical_marker_group.add(vm);

  //       var cm = new THREE.Mesh(circ_geom, circ_mat);
  //       cm.position.set(vec.x, vec.y, vec.z)
  //       circle_marker_group.add(cm)
  //     })
  //     // console.log(group)
  //     earth.add(particles)
  //     earth.add(vertical_marker_group)
  //     earth.add(circle_marker_group)

  //     return setTimeout( function () {
  //       earth.remove(vertical_marker_group);
  //       earth.remove(circle_marker_group);
  //     }, 20)
  //   }


  //   var num_dates = group_by_date.length;
  //   var loop_count = 0;
  //   function animation_loop () {
  //     setTimeout(function () {
  //       var group = group_by_date[loop_count];
  //       render_points(group);
  //       loop_count++;
  //       if (loop_count < num_dates) {
  //         animation_loop();
  //       }
  //     }, 20)
  //   }
  //   animation_loop();
  // })



  var render = function () {
      requestAnimationFrame(render);
      renderer.render(scene, camera);
  };

  render();
}

