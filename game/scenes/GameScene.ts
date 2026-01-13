import Phaser from 'phaser';
import { Socket } from 'socket.io-client';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { OrbitControls } from 'three-stdlib';

export class GameScene extends Phaser.Scene {
  private socket!: Socket;
  private playerId!: string;

  private threeScene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
  public threeRenderer: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private clock = new THREE.Clock();

  private map3D!: THREE.Object3D;
  private avatar!: THREE.Object3D;
  private mixer!: THREE.AnimationMixer;

  constructor() {
    super({ key: 'GameScene' });
    this.threeRenderer = new THREE.WebGLRenderer({ antialias: true });
  }

  init(data: { socket: Socket; playerId: string }) {
    this.socket = data.socket;
    this.playerId = data.playerId;
  }

  create() {
    this.setup3D();
    this.loadMap();
    this.loadAvatar();
    this.animate();
  }

  private setup3D() {
    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '100',
    });

    this.game.canvas.style.position = 'absolute';
    this.game.canvas.style.zIndex = '1';

    this.game.canvas.parentNode?.appendChild(container);
    container.appendChild(this.threeRenderer.domElement);

    this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
    this.threeRenderer.setClearColor(0x87ceeb, 1);

    this.threeScene.background = new THREE.Color(0x87ceeb);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(50, 100, 50);
    this.threeScene.add(ambient, sun);

    this.camera.position.set(0, 300, 500);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.threeRenderer.domElement);
    this.controls.enableDamping = true;

    window.addEventListener('resize', this.onWindowResize);
  }

  private loadMap() {
    console.log('Starting to load the map...');
    new GLTFLoader().load(
      'game/scenes/free_fire_burmuda_map_the_circuit_3d_model.glb',
      (gltf) => {
        console.log('Map loaded successfully:', gltf.scene);
        this.map3D = gltf.scene;

        // Ensure consistent scaling and positioning for the 3D map
        const box = new THREE.Box3().setFromObject(this.map3D);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        this.map3D.position.sub(center);
        const scale = 400 / Math.max(size.x, size.y, size.z);
        this.map3D.scale.setScalar(scale);

        console.log('3D map scaled and positioned:', this.map3D);

        this.map3D.position.y = 0;

        this.threeScene.add(this.map3D);
        console.log('✅ Map loaded and visible');
      },
      (progress) => {
        console.log(`Map loading progress: ${(progress.loaded / progress.total) * 100}%`);
      },
      (error) => {
        console.error('Error loading map:', error);
      }
    );
  }

  private loadAvatar() {
    console.log('Starting to load the avatar...');
    new GLTFLoader().load('game/scenes/ninja_-fortnite.glb', (gltf) => {
      console.log('Avatar loaded successfully:', gltf.scene);
      this.avatar = gltf.scene;
      this.avatar.scale.set(5, 5, 5);
      this.avatar.position.set(0, 0, 0);
      this.threeScene.add(this.avatar);

      this.mixer = new THREE.AnimationMixer(this.avatar);
      if (gltf.animations.length > 0) {
        const action = this.mixer.clipAction(gltf.animations[0]);
        action.play();
      }
    });
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    if (this.mixer) this.mixer.update(delta);

    this.controls.update();
    this.threeRenderer.render(this.threeScene, this.camera);
  };

  destroy() {
    super.destroy(); // Call Phaser's destroy method

    // Dispose of Three.js objects
    if (this.threeRenderer) {
      this.threeRenderer.dispose();
      console.log('Three.js renderer disposed');
    }

    if (this.controls) {
      this.controls.dispose();
      console.log('OrbitControls disposed');
    }

    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize);

    console.log('GameScene destroyed');
  }

  private onWindowResize = () => {
    if (this.camera && this.threeRenderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
    }
  };
}
