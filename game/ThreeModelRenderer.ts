// @ts-nocheck
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ThreeModelRenderer {
  canvas: HTMLCanvasElement;
  // `glCanvas` is used by Three/WebGL. `canvas` is a 2D canvas copied from the WebGL output
  private renderer: THREE.WebGLRenderer;
  private glCanvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private mixer: THREE.AnimationMixer | null = null;
  private clock = new THREE.Clock();

  constructor(width = 256, height = 256) {
    // 2D canvas (Phaser expects a 2D canvas for addCanvas)
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    // WebGL canvas used by Three.js renderer
    this.glCanvas = document.createElement('canvas');
    this.glCanvas.width = width;
    this.glCanvas.height = height;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.glCanvas, alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.5, 3);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7);
    this.scene.add(dir);
  }

  async load(url: string) {
    const loader = new GLTFLoader();
    return new Promise<void>((resolve, reject) => {
      loader.load(
          url,
          (gltf: any) => {
            const model = gltf.scene;
            model.rotation.y = Math.PI; // face forward
            this.scene.add(model);

            if (gltf.animations && gltf.animations.length) {
              this.mixer = new THREE.AnimationMixer(model);
              const action = this.mixer.clipAction(gltf.animations[0]);
              action.play();
            }

            resolve();
          },
          undefined,
          (err: any) => reject(err)
        );
    });
  }

  render() {
    const delta = this.clock.getDelta();
    if (this.mixer) this.mixer.update(delta);
    this.renderer.render(this.scene, this.camera);
    // copy WebGL canvas into the 2D canvas so Phaser can read pixels
    try {
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.drawImage(this.glCanvas, 0, 0);
      }
    } catch (e) {
      // ignore copy errors
    }
  }
}
