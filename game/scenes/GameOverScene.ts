import Phaser from 'phaser';
import { Socket } from 'socket.io-client';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { OrbitControls } from 'three-stdlib';

export class GameScene extends Phaser.Scene {
  private socket!: Socket;
  private playerId!: string;

  private scene3D = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
  public renderer = new THREE.WebGLRenderer({ antialias: true });
  private controls!: OrbitControls;
  private clock = new THREE.Clock();

  private map3D!: THREE.Object3D;
  private avatar!: THREE.Object3D;
  private mixer!: THREE.AnimationMixer;

  constructor() {
    super({ key: 'GameScene' });
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
    container.appendChild(this.renderer.domElement);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87ceeb, 1);

    this.scene3D.background = new THREE.Color(0x87ceeb);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(50, 100, 50);
    this.scene3D.add(ambient, sun);

    this.camera.position.set(0, 200, 400);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
  }

  private loadMap() {
    new GLTFLoader().load(
      'game/scenes/free_fire_burmuda_map_the_circuit_3d_model.glb',
      (gltf) => {
        this.map3D = gltf.scene;

        const box = new THREE.Box3().setFromObject(this.map3D);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        this.map3D.position.sub(center);
        const scale = 400 / Math.max(size.x, size.y, size.z);
        this.map3D.scale.setScalar(scale);

        this.scene3D.add(this.map3D);
      },
      undefined,
      (err) => console.error('Map load error:', err)
    );
  }

  private loadAvatar() {
    new GLTFLoader().load(
      'game/scenes/ninja_-fortnite.glb',
      (gltf) => {
        this.avatar = gltf.scene;
        this.avatar.scale.set(10, 10, 10);
        this.avatar.position.set(0, 0, 0);
        this.scene3D.add(this.avatar);

        if (gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.avatar);
          this.mixer.clipAction(gltf.animations[0]).play();
        }
      },
      undefined,
      (err) => console.error('Avatar load error:', err)
    );
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    if (this.mixer) this.mixer.update(delta);

    this.controls.update();
    this.renderer.render(this.scene3D, this.camera);
  };
}
