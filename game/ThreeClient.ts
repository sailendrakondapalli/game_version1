// @ts-nocheck
import * as THREE from 'three';
import { GAME_CONFIG } from './config';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class ThreeClient {
  container: HTMLDivElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  mixers: Map<string, THREE.AnimationMixer> = new Map();
  playerMap: Map<string, THREE.Object3D> = new Map();
  houses: THREE.Mesh[] = [];
  housePositions: Array<{ x: number; z: number }> = [];
  defaultAvatar: THREE.Group | null = null;
  localPlayerId?: string;
  socket: any = null;
  bulletMap: Map<number, THREE.Mesh> = new Map();
  hudEl: HTMLDivElement | null = null;
  keys: any = { W: false, A: false, S: false, D: false };
  lastEmit = 0;
  cameraHeight = 10;
  // Disable playing GLTF animation clips at runtime; use simple bobbing instead
  enableAnimations = false;
  clock = new THREE.Clock();
  templateGltf: any = null;
  controls: any = null;

  constructor(parentId = 'phaser-game') {
    this.container = document.getElementById(parentId) as HTMLDivElement;
    if (!this.container) {
      throw new Error('Parent element not found: ' + parentId);
    }

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100000);
    // position camera to view the whole map center
    const center = (GAME_CONFIG && GAME_CONFIG.MAP_SIZE) ? GAME_CONFIG.MAP_SIZE / 2 : 1000;
    this.cameraHeight = Math.max(50, (GAME_CONFIG.MAP_SIZE / 10));
    const camZ = center + Math.max(50, GAME_CONFIG.MAP_SIZE / 6);
    this.camera.position.set(center, this.cameraHeight, camZ);
    this.camera.lookAt(new THREE.Vector3(center, 0, center));

    // orbit controls to allow rotating the map in all dimensions
    // allow full rotation by not restricting polar angle
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    this.scene.add(hemi);
    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(5, 10, 7);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 50;
    // use a reasonably sized orthographic shadow camera for top-down style
    const d = 15;
    dir.shadow.camera.left = -d;
    dir.shadow.camera.right = d;
    dir.shadow.camera.top = d;
    dir.shadow.camera.bottom = -d;
    dir.shadow.bias = -0.0005;
    this.scene.add(dir);

    const mapSize = (GAME_CONFIG && GAME_CONFIG.MAP_SIZE) || 2000;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(mapSize, mapSize),
      new THREE.MeshStandardMaterial({ color: 0x3d5a27 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // add a few simple house models to the map at random positions
    this.housePositions = [];
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * mapSize;
      const z = Math.random() * mapSize;
      this.housePositions.push({ x, z });
      this.addHouse(x, z);
    }

    // create a reusable default avatar for non-user players
    this.defaultAvatar = this.createSimpleHuman();
    // scale default avatar relative to map
    const avatarScale = (GAME_CONFIG && GAME_CONFIG.PLAYER_SIZE) ? GAME_CONFIG.PLAYER_SIZE / 20 : 1;
    this.defaultAvatar.scale.setScalar(avatarScale);
    this.defaultAvatar.traverse((c: any) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    window.addEventListener('resize', () => this.onResize());

    this.animate();
  }

  setLocalPlayerId(id: string) {
    this.localPlayerId = id;
  }

  setSocket(socket: any) {
    this.socket = socket;
    // register handlers
    try {
      this.socket.off && this.socket.off('gameState');
      this.socket.on('gameState', (state: any) => {
        this.updatePlayers(state.players || []);
        this.updateHUD(state);
        // sync bullets if provided
        if (state.bullets) this._syncBullets(state.bullets);
      });

      this.socket.off && this.socket.off('playerShot');
      this.socket.on('playerShot', (data: any) => {
        if (data && data.bullets) this._createBullets(data.bullets);
      });

      this.socket.off && this.socket.off('playerHit');
      this.socket.on('playerHit', (d: any) => {
        // simple visual: log or tint
        console.log('playerHit', d);
      });

      this.socket.off && this.socket.off('playerKilled');
      this.socket.on('playerKilled', (d: any) => {
        console.log('playerKilled', d);
      });

    } catch (e) {
      console.warn('socket registration failed', e);
    }

    this._createHUD();
    this._setupInputListeners();
  }

  private _createHUD() {
    if (!this.container) return;
    // create outer wrapper (hudEl) and an inner element with id 'three-hud'
    const outer = document.createElement('div');
    outer.style.position = 'absolute';
    outer.style.left = '10px';
    outer.style.top = '10px';
    outer.style.color = 'white';
    outer.style.zIndex = '10000';
    outer.style.fontFamily = 'sans-serif';
    outer.id = 'three-hud-container';

    const inner = document.createElement('div');
    inner.id = 'three-hud';

    const healthWrap = document.createElement('div');
    healthWrap.style.width = '180px';
    healthWrap.style.background = 'rgba(0,0,0,0.5)';
    healthWrap.style.padding = '6px';
    healthWrap.style.marginBottom = '6px';
    const healthLabel = document.createElement('div');
    healthLabel.innerText = 'Health';
    healthLabel.style.fontSize = '12px';
    healthLabel.style.marginBottom = '4px';
    const healthBar = document.createElement('div');
    healthBar.style.width = '100%';
    healthBar.style.height = '12px';
    healthBar.style.background = '#333';
    const healthFill = document.createElement('div');
    healthFill.id = 'hud-health-fill';
    healthFill.style.width = '100%';
    healthFill.style.height = '100%';
    healthFill.style.background = '#e74c3c';
    healthBar.appendChild(healthFill);
    healthWrap.appendChild(healthLabel);
    healthWrap.appendChild(healthBar);

    const ammoWrap = document.createElement('div');
    ammoWrap.style.width = '180px';
    ammoWrap.style.background = 'rgba(0,0,0,0.5)';
    ammoWrap.style.padding = '6px';
    ammoWrap.style.marginBottom = '6px';
    const ammoLabel = document.createElement('div');
    ammoLabel.innerText = 'Ammo';
    ammoLabel.style.fontSize = '12px';
    ammoLabel.style.marginBottom = '4px';
    const ammoBar = document.createElement('div');
    ammoBar.style.width = '100%';
    ammoBar.style.height = '12px';
    ammoBar.style.background = '#333';
    const ammoFill = document.createElement('div');
    ammoFill.id = 'hud-ammo-fill';
    ammoFill.style.width = '100%';
    ammoFill.style.height = '100%';
    ammoFill.style.background = '#f1c40f';
    ammoBar.appendChild(ammoFill);
    ammoWrap.appendChild(ammoLabel);
    ammoWrap.appendChild(ammoBar);

    const kills = document.createElement('div');
    kills.id = 'hud-kills';
    kills.style.marginTop = '6px';
    kills.style.fontSize = '14px';
    kills.innerText = 'Kills: 0';

    inner.appendChild(healthWrap);
    inner.appendChild(ammoWrap);
    inner.appendChild(kills);

    outer.appendChild(inner);

    this.container.style.position = 'relative';
    this.container.appendChild(outer);
    this.hudEl = outer as HTMLDivElement;
  }

  private _setWalkingState(playerId: string, walking: boolean) {
    // if animations are enabled, toggle clip playback; otherwise use bobbing
    if (this.enableAnimations) {
      const mixer = this.mixers.get(playerId);
      if (mixer && this.templateGltf && this.templateGltf.animations) {
        const anims = this.templateGltf.animations;
        const idle = anims.find((a: any) => /idle/i.test(a.name));
        const run = anims.find((a: any) => /run|walk|walkcycle/i.test(a.name));
        try {
          if (walking && run) {
            mixer.stopAllAction();
            mixer.clipAction(run).play();
          } else if (idle) {
            mixer.stopAllAction();
            mixer.clipAction(idle).play();
          }
        } catch (e) { /* ignore */ }
      }
    }
    // for fallback avatars, set a flag so we can bob them
    const obj = this.playerMap.get(playerId);
    if (obj) {
      (obj as any).userData = (obj as any).userData || {};
      (obj as any).userData.walking = walking;
    }
  }

  private updateHUD(state: any) {
    if (!this.hudEl) return;
    const players = state.players || [];
    const me = players.find((p: any) => p.id === this.localPlayerId) || players[0] || null;
    if (!me) return;
    const healthPercent = Math.max(0, Math.min(100, Math.floor(me.health || 0)));
    const ammoNow = me.isReloading ? 0 : (me.ammo || 0);
    const ammoMax = me.maxAmmo || 1;
    const ammoPercent = Math.floor((ammoNow / ammoMax) * 100);
    const hf = this.hudEl.querySelector('#hud-health-fill') as HTMLDivElement;
    const af = this.hudEl.querySelector('#hud-ammo-fill') as HTMLDivElement;
    const k = this.hudEl.querySelector('#hud-kills') as HTMLDivElement;
    if (hf) hf.style.width = `${healthPercent}%`;
    if (af) af.style.width = `${ammoPercent}%`;
    if (k) k.innerText = `Kills: ${me.kills || 0}`;
  }

  private _setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toUpperCase();
      if (k in this.keys) this.keys[k] = true;
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.toUpperCase();
      if (k in this.keys) this.keys[k] = false;
    });
    this.renderer.domElement.addEventListener('pointerdown', (ev) => {
      // compute world coords and emit shoot
      const rect = this.renderer.domElement.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      // raycast to plane y=0
      const vec = new THREE.Vector3(x, y, 0.5).unproject(this.camera);
      const dir = vec.sub(this.camera.position).normalize();
      const distance = - this.camera.position.y / dir.y;
      const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
      // emit playerShoot with angle from local player to pos
      const localObj = this._getLocalObject();
      if (!localObj) return;
      const dx = pos.x - localObj.position.x;
      const dz = pos.z - localObj.position.z;
      const angle = Math.atan2(dz, dx);
      this.socket && this.socket.emit && this.socket.emit('playerShoot', { angle });
    });
  }

  private _getLocalObject(): THREE.Object3D | null {
    if (!this.localPlayerId) return null;
    return this.playerMap.get(this.localPlayerId) || null;
  }

  private _syncBullets(bullets: any[]) {
    // remove bullets not present
    const ids = new Set(bullets.map(b => b.id));
    for (const id of Array.from(this.bulletMap.keys())) {
      if (!ids.has(id)) {
        const m = this.bulletMap.get(id)!;
        this.scene.remove(m);
        this.bulletMap.delete(id);
      }
    }
    // update/create bullets
    console.debug('syncBullets', bullets.length, bullets.slice(0,5));
    bullets.forEach((b: any) => {
      if (!this.bulletMap.has(b.id)) {
        // create a small cone oriented along velocity for visibility
        const geom = new THREE.ConeGeometry(0.12, 0.4, 8);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xff6600, emissiveIntensity: 0.6 });
        const s = new THREE.Mesh(geom, mat);
        s.position.set(b.x, 0.15, b.y);
        // orient cone along velocity
        const angle = Math.atan2(b.velocityY, b.velocityX);
        s.rotation.y = -angle + Math.PI / 2;
        this.scene.add(s);
        this.bulletMap.set(b.id, s);
      } else {
        const s = this.bulletMap.get(b.id)!;
        s.position.set(b.x, 0.15, b.y);
        const angle = Math.atan2(b.velocityY, b.velocityX);
        s.rotation.y = -angle + Math.PI / 2;
      }
    });
  }

  private _createBullets(bullets: any[]) {
    bullets.forEach((b: any) => {
      if (this.bulletMap.has(b.id)) return;
      const geom = new THREE.ConeGeometry(0.12, 0.4, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xff6600, emissiveIntensity: 0.6 });
      const s = new THREE.Mesh(geom, mat);
      s.position.set(b.x, 0.15, b.y);
      const angle = Math.atan2(b.velocityY, b.velocityX);
      s.rotation.y = -angle + Math.PI / 2;
      this.scene.add(s);
      this.bulletMap.set(b.id, s);
    });
  }

  addHouse(x: number, z: number) {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.2, 2.5),
      new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
    );
    base.position.set(x, 0.6, z);
    base.castShadow = true;
    base.receiveShadow = true;

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(1.6, 1, 4),
      new THREE.MeshStandardMaterial({ color: 0x7b1f1f })
    );
    roof.position.set(x, 1.4, z);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    roof.receiveShadow = true;

    this.scene.add(base);
    this.scene.add(roof);
    this.houses.push(base);
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  async loadModel(url?: string) {
    const loader = new GLTFLoader();
    // try local model first, then fallback to a well-known sample
    const local = '/models/Soldier.glb';
    const fallback = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb';
    const modelUrl = url || local;

    const tryLoad = (src: string) => new Promise<any>((resolve, reject) => {
      loader.load(src, (gltf) => resolve(gltf), undefined, (err) => reject(err));
    });

    try {
      this.templateGltf = await tryLoad(modelUrl);
      this._postProcessLoadedModel(this.templateGltf);
      return;
    } catch (e) {
      // fallback
      try {
        this.templateGltf = await tryLoad(fallback);
        this._postProcessLoadedModel(this.templateGltf);
        return;
      } catch (err) {
        throw err;
      }
    }
  }

  createSimpleHuman() {
    const group = new THREE.Group();

    const material = new THREE.MeshStandardMaterial({ color: 0xdddddd });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.3), material);
    torso.position.y = 1.0;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), material);
    head.position.y = 1.8;
    group.add(head);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 0.15), material);
    leftArm.position.set(-0.45, 1.05, 0);
    group.add(leftArm);

    const rightArm = leftArm.clone();
    rightArm.position.x = 0.45;
    group.add(rightArm);

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), material);
    leftLeg.position.set(-0.15, 0.2, 0);
    group.add(leftLeg);

    const rightLeg = leftLeg.clone();
    rightLeg.position.x = 0.15;
    group.add(rightLeg);

    return group;
  }

  private _postProcessLoadedModel(gltf: any) {
    // compute a scale so the model stands roughly 1.8 units tall
    try {
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = new THREE.Vector3();
      box.getSize(size);
      const desired = 1.8;
      const scale = size.y > 0 ? desired / size.y : 0.02;
      gltf.userData = gltf.userData || {};
      gltf.userData.scaleFactor = scale;
    } catch (e) {
      // ignore
    }
  }

  private _enableShadowsOnGltf(sceneObj: THREE.Object3D) {
    sceneObj.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // ensure standard material supports shadows
        if (child.material && child.material.isMaterial) {
          // nothing to change for now; keep existing material
        }
      }
    });
  }

  /**
   * Load a Ready Player Me avatar by either full GLB URL or by avatar id.
   * If an id is provided, the method will try common Ready Player Me model URL patterns.
   */
  async loadReadyPlayerMeAvatar(idOrUrl: string) {
    if (!idOrUrl) return;
    // if it's already a URL, delegate to loadModel
    if (idOrUrl.includes('http')) {
      await this.loadModel(idOrUrl);
      return;
    }

    const candidates = [
      `https://models.readyplayer.me/${idOrUrl}.glb`,
      `https://models.readyplayer.me/${idOrUrl}/glb`,
      `https://readyplayer.me/avatar/${idOrUrl}.glb`,
    ];

    for (const url of candidates) {
      try {
        await this.loadModel(url);
        console.log('Loaded Ready Player Me avatar from', url);
        return;
      } catch (e) {
        console.warn('Tried RPM URL and failed:', url);
      }
    }

    throw new Error('Unable to load Ready Player Me avatar for id: ' + idOrUrl);
  }

  async promptAndLoadReadyPlayerMe() {
    try {
      const url = window.prompt('Paste your Ready Player Me avatar GLB URL (or cancel):');
      if (url && url.length > 0) {
        await this.loadModel(url);
        console.log('Loaded Ready Player Me avatar from', url);
      }
    } catch (e) {
      console.warn('Failed to load Ready Player Me avatar', e);
    }
  }

  isNearHouse(x: number, z: number, radius = 3) {
    for (const p of this.housePositions) {
      const dx = x - p.x;
      const dz = z - p.z;
      if (dx * dx + dz * dz <= radius * radius) return true;
    }
    return false;
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    if (this.enableAnimations) this.mixers.forEach((m) => m.update(delta));
    if (this.controls) this.controls.update();

    // handle simple WASD movement for local player
    const local = this._getLocalObject();
    if (local) {
      const now = Date.now();
      let vx = 0, vz = 0;
      if (this.keys.W) vz -= 1;
      if (this.keys.S) vz += 1;
      if (this.keys.A) vx -= 1;
      if (this.keys.D) vx += 1;
        const moving = (vx !== 0 || vz !== 0);
        if (moving) this._setWalkingState(this.localPlayerId! , true);
        else this._setWalkingState(this.localPlayerId! , false);

        if (moving) {
        const len = Math.sqrt(vx*vx + vz*vz);
        vx = (vx/len) * (GAME_CONFIG?.PLAYER_SPEED || 150) * delta;
        vz = (vz/len) * (GAME_CONFIG?.PLAYER_SPEED || 150) * delta;
        local.position.x += vx;
        local.position.z += vz;
        // emit move periodically
        if (this.socket && Date.now() - this.lastEmit > 50) {
          this.socket.emit && this.socket.emit('playerMove', { x: local.position.x, y: local.position.z, rotation: local.rotation.y });
          this.lastEmit = Date.now();
        }
      }
      // camera follow local
      this.camera.position.lerp(new THREE.Vector3(local.position.x, local.position.y + this.cameraHeight, local.position.z + (GAME_CONFIG.MAP_SIZE/6)), 0.08);
      this.camera.lookAt(local.position.x, local.position.y + 1.5, local.position.z);
    }
    // interpolate remote players toward their target positions for smooth motion
    for (const [id, obj] of this.playerMap.entries()) {
      if (id === this.localPlayerId) continue;
      const ud = (obj as any).userData || {};
      if (ud.targetX !== undefined && ud.targetZ !== undefined) {
        // lerp position
        obj.position.x += (ud.targetX - obj.position.x) * 0.15;
        obj.position.z += (ud.targetZ - obj.position.z) * 0.15;
        // lerp rotation
        const current = obj.rotation.y || 0;
        const target = ud.targetRot || current;
        obj.rotation.y += (target - current) * 0.15;
        // apply bobbing for fallback if walking
        if (ud.walking) {
          const bob = Math.sin(Date.now() * 0.01 + (id.length || 0)) * 0.15;
          obj.position.y = 0.5 + bob;
        } else {
          obj.position.y = 0;
        }
      }
    }

    // update bullets positions (already updated by sync calls)
    this.renderer.render(this.scene, this.camera);
  };

  private cloneGltf(gltf: any) {
    try {
      // Prefer SkeletonUtils.clone for skinned meshes and animations
      if (gltf && gltf.scene) {
        return SkeletonUtils.clone(gltf.scene);
      }
      return SkeletonUtils.clone(gltf);
    } catch (e) {
      // fallback to a deep clone
      return gltf.scene ? gltf.scene.clone(true) : (gltf.clone ? gltf.clone(true) : gltf);
    }
  }

  updatePlayers(playersData: any[]) {
    const currentIds = new Set(playersData.map(p => p.id));
    // remove missing
    for (const id of Array.from(this.playerMap.keys())) {
      if (!currentIds.has(id)) {
        const obj = this.playerMap.get(id)!;
        this.scene.remove(obj);
        this.playerMap.delete(id);
        this.mixers.delete(id);
      }
    }

    playersData.forEach((p) => {
      if (!this.playerMap.has(p.id)) {
        // create
        if (this.templateGltf) {
          const clone = this.cloneGltf(this.templateGltf);
          // position clone and apply scale factor if computed
          const scaleFactor = this.templateGltf?.userData?.scaleFactor || 0.02;
          clone.scale.setScalar(scaleFactor);
          // shift so feet sit on y=0 using bounding box
          try {
            const box = new THREE.Box3().setFromObject(clone);
            const min = box.min.y;
            clone.position.set(p.x, -min * scaleFactor, p.y);
          } catch (e) {
            clone.position.set(p.x, 0, p.y);
          }
          this._enableShadowsOnGltf(clone);
          this.scene.add(clone);

          if (this.enableAnimations && this.templateGltf.animations && this.templateGltf.animations.length) {
            const mixer = new THREE.AnimationMixer(clone);
            // prefer 'Idle' animation if present
            const idle = this.templateGltf.animations.find((a: any) => /idle/i.test(a.name));
            if (idle) mixer.clipAction(idle).play();
            else mixer.clipAction(this.templateGltf.animations[0]).play();
            this.mixers.set(p.id, mixer);
          }

          // mark safe if close to a house
          const safe = this.isNearHouse(p.x, p.y);
          clone.userData.safe = safe;
          if (safe) {
            clone.traverse((c: any) => {
              if (c.isMesh && c.material) {
                if (c.material.color) c.material.color.setHex(0x88ff88);
              }
            });
          }

          this.playerMap.set(p.id, clone);
        } else {
          // fallback: use shared default avatar (clone it)
          let instance: THREE.Object3D;
          if (this.defaultAvatar) {
            try {
              instance = SkeletonUtils.clone(this.defaultAvatar);
            } catch (e) {
              instance = this.defaultAvatar.clone(true);
            }
          } else {
            instance = this.createSimpleHuman();
          }

          instance.position.set(p.x, 0, p.y);
          instance.traverse((c: any) => {
            if (c.isMesh) {
              c.castShadow = true;
              c.receiveShadow = true;
              // tint non-local players differently
              try {
                if (c.material && c.material.color) {
                  const isLocal = this.localPlayerId && p.id === this.localPlayerId;
                  c.material.color.setHex(isLocal ? 0x88ccff : 0x00ff00);
                }
              } catch (e) { /* ignore color set errors */ }
            }
          });

          this.scene.add(instance);
          this.playerMap.set(p.id, instance);
        }
      } else {
        const obj = this.playerMap.get(p.id)!;
        // set target for interpolation (convert y->z)
        (obj as any).userData = (obj as any).userData || {};
        (obj as any).userData.targetX = p.x;
        (obj as any).userData.targetZ = p.y;
        (obj as any).userData.targetRot = -p.rotation || 0;
        // update safe indicator if this object corresponds to a clone or box
        const safeNow = this.isNearHouse(p.x, p.y);
        if ((obj as any).isMesh && (obj as any).material) {
          // box mesh
          (obj as THREE.Mesh).material.color.setHex(safeNow ? 0x88ff88 : 0x00ff00);
        } else if ((obj as any).traverse) {
          // GLTF clone
          if (obj.userData.safe !== safeNow) {
            obj.userData.safe = safeNow;
            obj.traverse((c: any) => {
              if (c.isMesh && c.material && c.material.color) c.material.color.setHex(safeNow ? 0x88ff88 : 0xffffff);
            });
          }
        }
      }
    });
  }
}
