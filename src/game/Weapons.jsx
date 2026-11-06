/**
 * src/game/Weapons.jsx
 * Pooled visual rendering for all active projectiles in `raceRuntime.projectiles`:
 * - Coconut (straight projectile, speed 80, 1.5s stun)
 * - Homing Rocket (tracks nearest rival ahead, max turn rate ~2 rad/s, lifetime 4s, 2s stun)
 * - Shockwave (expanding ring up to radius 25, hits all rivals within radius, 2s stun)
 * - Mega Crab Claw (streak of 3 reward: 3s stun + speed boost for player)
 */
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { raceRuntime } from '../store/gameStore';

export function Weapons() {
  const meshRefs = useRef([]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const pool = raceRuntime.projectiles;

    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      const grp = meshRefs.current[i];
      if (!grp) continue;

      if (!p.active) {
        grp.visible = false;
        continue;
      }

      grp.visible = true;
      grp.position.set(p.x, p.y, p.z);

      const coconutMesh = grp.children[0];
      const rocketMesh = grp.children[1];
      const shockwaveMesh = grp.children[2];
      const clawMesh = grp.children[3];

      coconutMesh.visible = p.type === 'coconut';
      rocketMesh.visible = p.type === 'rocket';
      shockwaveMesh.visible = p.type === 'shockwave';
      clawMesh.visible = p.type === 'megaclaw';

      if (p.type === 'coconut') {
        grp.rotation.x += dt * 12;
        grp.rotation.y = p.yaw;
        grp.scale.setScalar(1);
      } else if (p.type === 'rocket') {
        grp.rotation.set(0, p.yaw, 0);
        grp.scale.setScalar(1);
      } else if (p.type === 'shockwave') {
        grp.rotation.set(-Math.PI / 2, 0, 0);
        grp.scale.setScalar(Math.max(0.5, p.radius));
      } else if (p.type === 'megaclaw') {
        grp.rotation.set(0, p.yaw, Math.sin(p.age * 18) * 0.25);
        grp.scale.setScalar(1.25);
      }
    }
  });

  return (
    <group name="ProjectilesPool">
      {raceRuntime.projectiles.map((p, idx) => (
        <group
          key={p.id}
          ref={(el) => {
            meshRefs.current[idx] = el;
          }}
          visible={false}
        >
          {/* 0: Coconut */}
          <mesh>
            <sphereGeometry args={[0.55, 10, 10]} />
            <meshStandardMaterial color="#7c471e" roughness={0.85} />
          </mesh>

          {/* 1: Homing Rocket */}
          <group>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.25, 0.35, 1.5, 8]} />
              <meshStandardMaterial color="#ff3b30" emissive="#ff3b30" emissiveIntensity={0.35} />
            </mesh>
            <mesh position={[0, 0, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.32, 0.65, 8]} />
              <meshStandardMaterial color="#fde047" />
            </mesh>
          </group>

          {/* 2: Shockwave Expanding Ring */}
          <mesh>
            <ringGeometry args={[0.82, 1.0, 24]} />
            <meshBasicMaterial color="#00e5ff" side={2} transparent opacity={0.85} />
          </mesh>

          {/* 3: Mega Crab Claw */}
          <group>
            <mesh>
              <torusGeometry args={[0.65, 0.26, 8, 14, Math.PI * 1.45]} />
              <meshStandardMaterial
                color="#ff1e6d"
                emissive="#ff1e6d"
                emissiveIntensity={0.45}
                roughness={0.25}
              />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
