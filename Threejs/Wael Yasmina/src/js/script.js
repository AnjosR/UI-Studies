import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "dat.gui";

const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

const orbit = new OrbitControls(camera, renderer.domElement);

const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);

camera.position.set(0, 0, 0);
orbit.update();

const sphereGeometry = new THREE.SphereGeometry(4, 20, 20);
const SphereMaterial = new THREE.MeshBasicMaterial({
  color: 0x0000ff,
  wireframe: true,
});
const sphere = new THREE.Mesh(sphereGeometry, SphereMaterial);
scene.add(sphere);

sphere.position.set(-10, 10, 0);

const gui = new GUI();
const options = {
  sphereColor: "#ffea00",
};

gui.addColor(options, "sphereColor").onChange(function (e) {
  sphere.material.color.set(e);
});

function animate() {
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
