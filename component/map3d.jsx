// components/Map3D.jsx
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default function Map3D() {
  const gltf = useLoader(GLTFLoader, '/assets/images/models/free_fire_burmuda_map_the_circuit_3d_model.glb');

  return (
    <primitive
      object={gltf.scene}
      scale={0.5}
      position={[0, -5, 0]}
    />
  );
}
