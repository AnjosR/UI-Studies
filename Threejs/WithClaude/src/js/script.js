import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
  Mesh,
  BoxGeometry,
  MeshStandardMaterial,
  Box3,
  Vector3,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const computerUrl = new URL("../assets/models/Computer.glb", import.meta.url);
const monitorUrl = new URL("../assets/models/Monitor.glb", import.meta.url);

// ---------- Renderer dentro do container ----------
const container = document.getElementById("scene-container");

const renderer = new WebGLRenderer({ antialias: true, alpha: true }); // alpha: fundo transparente
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const scene = new Scene();

// ---------- Câmera ----------
const camera = new PerspectiveCamera(
  35,
  container.clientWidth / container.clientHeight,
  0.1,
  100,
);
camera.position.set(9, 8, 9);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.target.set(0, 1.8, 0); // olha para o meio do cômodo
orbit.enablePan = false;
orbit.minDistance = 8;
orbit.maxDistance = 25;
orbit.minAzimuthAngle = 0; // de frente...
orbit.maxAzimuthAngle = Math.PI / 1.7; // ...até o lado direito
orbit.maxPolarAngle = Math.PI / 2.2; // não deixa ir para baixo do chão
orbit.update();

// ---------- Luzes ----------
scene.add(new AmbientLight(0xffffff, 0.6));

const sun = new DirectionalLight(0xffffff, 3);
sun.position.set(5, 10, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -8;
sun.shadow.camera.right = 8;
sun.shadow.camera.top = 8;
sun.shadow.camera.bottom = -8;
scene.add(sun);

// ---------- Cômodo ----------
const ROOM = { w: 8, d: 8, h: 5, t: 0.2 }; // largura, profundidade, altura, espessura

const wallMat = new MeshStandardMaterial({ color: 0xe8e2d9 });
const floorMat = new MeshStandardMaterial({ color: 0x9c8468 });
const deskMat = new MeshStandardMaterial({ color: 0x5b4636 });

function makeBlock(w, h, d, material, x, y, z) {
  const mesh = new Mesh(new BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

const { w, d, h, t } = ROOM;

// Chão: topo em y = 0
makeBlock(w + t, t, d + t, floorMat, -t / 2, -t / 2, -t / 2);
// Parede do fundo
makeBlock(w + t, h, t, wallMat, -t / 2, h / 2, -d / 2 - t / 2);
// Parede da esquerda
makeBlock(t, h, d, wallMat, -w / 2 - t / 2, h / 2, 0);

// ---------- Mesa simples (tampo + 4 pernas) ----------
const DESK = { w: 3.4, d: 1.6, h: 1.4, top: 0.12 };
const deskZ = -d / 2 + DESK.d / 2 + 0.3;

makeBlock(DESK.w, DESK.top, DESK.d, deskMat, 0, DESK.h, deskZ);
for (const sx of [-1, 1]) {
  for (const sz of [-1, 1]) {
    makeBlock(
      0.12,
      DESK.h,
      0.12,
      deskMat,
      sx * (DESK.w / 2 - 0.15),
      DESK.h / 2,
      deskZ + sz * (DESK.d / 2 - 0.15),
    );
  }
}
const deskTopY = DESK.h + DESK.top / 2; // altura da superfície da mesa

// ---------- Modelos GLB ----------
function fitModel(model, targetSize) {
  const box = new Box3().setFromObject(model);
  const size = box.getSize(new Vector3());
  model.scale.setScalar(targetSize / Math.max(size.x, size.y, size.z));

  // centraliza em X/Z e apoia a base em y = 0
  box.setFromObject(model);
  const center = box.getCenter(new Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= box.min.y;
}

const loader = new GLTFLoader();

async function loadModel(url, targetSize, x, y, z) {
  const gltf = await loader.loadAsync(url.href);
  const model = gltf.scene;
  fitModel(model, targetSize);
  model.position.x += x;
  model.position.y += y;
  model.position.z += z;
  model.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  scene.add(model);
  return model;
}

async function init() {
  // ajuste os tamanhos e posições conforme o visual dos seus modelos
  await loadModel(computerUrl, 1.2, -1.0, deskTopY, deskZ);
  await loadModel(monitorUrl, 1.4, 0.8, deskTopY, deskZ);
}
init();

// ---------- Loop e resize ----------
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});

new ResizeObserver(() => {
  const { clientWidth, clientHeight } = container;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
}).observe(container);

// -------- Desloca a imaem para o lado desejado -----------

function updateView() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  // offset positivo move a cena para a esquerda/cima
  camera.setViewOffset(w, h, w * 0.25, h * 0.2, w, h);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

new ResizeObserver(updateView).observe(container);
updateView();

