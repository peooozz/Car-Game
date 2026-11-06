/**
 * src/game/CartoonTown.jsx
 * High-performance, rich cartoon town environment directly inspired by the user's reference image:
 * - Town Clock Tower with circular clock face & awning
 * - Blue Skyscraper / Toon City Hall with white window frames & stepped art-deco roof
 * - Burger Diner with a giant 3D cartoon cheeseburger on the roof
 * - Pizza Palace with a giant 3D cartoon pepperoni pizza slice on the roof
 * - Donut Bakery with a giant pink-frosted sprinkled donut on the roof
 * - Round Mushroom & Barrel Cottages with terracotta roofs & smoke chimneys
 * - Pastel Village Cottages with colorful gabled roofs & dormers
 * - Animated Dutch Windmill with rotating blades
 * - Floating Hot Air Balloons in the sky
 * - Town Square Water Fountain with splashing jets
 * - Cafe Patios, Direction Signs, Gumdrop Trees, Puffy Trees, Fences, and Lamps
 * - Rolling green terrain with lush cartoon grass
 * - Encircling horizon wall of fluffy 3D cartoon cumulus clouds
 */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getCartoonGrassTexture } from './roadTextures';

// ==========================================
// 1. CLOCK TOWER
// ==========================================
export function ClockTower({ position = [0, 0, 0], rotationY = 0, scale = 1 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[7.2, 2.4, 7.2]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      <mesh position={[0, 9, 0]}>
        <boxGeometry args={[6.2, 13.5, 6.2]} />
        <meshStandardMaterial color="#dc2626" roughness={0.7} />
      </mesh>
      <mesh position={[0, 4.6, 3.25]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[4.2, 0.5, 1.8]} />
        <meshStandardMaterial color="#10b981" roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.6, 3.12]}>
        <boxGeometry args={[2.4, 3.2, 0.2]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      <mesh position={[0, 16.2, 0]}>
        <boxGeometry args={[7.0, 1.2, 7.0]} />
        <meshStandardMaterial color="#fef08a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 19.5, 0]}>
        <boxGeometry args={[6.4, 5.4, 6.4]} />
        <meshStandardMaterial color="#fffbeb" roughness={0.6} />
      </mesh>
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((rot, idx) => (
        <group key={idx} rotation={[0, rot, 0]}>
          <mesh position={[0, 19.5, 3.24]}>
            <cylinderGeometry args={[1.75, 1.75, 0.12, 20]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          <mesh position={[0, 19.5, 3.28]}>
            <torusGeometry args={[1.75, 0.12, 8, 20]} />
            <meshStandardMaterial color="#b45309" roughness={0.5} />
          </mesh>
          <mesh position={[0.3, 19.8, 3.33]} rotation={[0, 0, -0.6]}>
            <boxGeometry args={[0.22, 1.3, 0.08]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
          <mesh position={[-0.4, 19.5, 3.33]} rotation={[0, 0, 1.2]}>
            <boxGeometry args={[0.18, 1.0, 0.08]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 25.2, 0]}>
        <coneGeometry args={[5.2, 6.2, 4]} />
        <meshStandardMaterial color="#581c87" roughness={0.5} />
      </mesh>
      <mesh position={[0, 29.2, 0]}>
        <cylinderGeometry args={[0.08, 0.18, 2.2, 8]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0, 30.5, 0]}>
        <sphereGeometry args={[0.42, 10, 10]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ==========================================
// 2. BLUE SKYSCRAPER / TOON CITY HALL
// ==========================================
export function BlueSkyscraper({ position = [0, 0, 0], rotationY = 0, scale = 1 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[13.2, 1.8, 10.5]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>
      <mesh position={[0, 5.8, 0]}>
        <boxGeometry args={[12.0, 8.0, 9.5]} />
        <meshStandardMaterial color="#2563eb" roughness={0.6} />
      </mesh>
      <mesh position={[0, 10.0, 0]}>
        <boxGeometry args={[12.6, 0.8, 10.1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh position={[0, 14.5, 0]}>
        <boxGeometry args={[10.5, 8.2, 8.2]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 18.8, 0]}>
        <boxGeometry args={[11.1, 0.8, 8.8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh position={[0, 22.8, 0]}>
        <boxGeometry args={[9.0, 7.2, 7.0]} />
        <meshStandardMaterial color="#2563eb" roughness={0.6} />
      </mesh>
      <mesh position={[0, 26.6, 0]}>
        <boxGeometry args={[9.6, 0.8, 7.6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh position={[0, 28.5, 0]}>
        <boxGeometry args={[5.8, 3.0, 4.8]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.5} />
      </mesh>
      <mesh position={[0, 31.0, 0]}>
        <boxGeometry args={[3.2, 2.4, 2.8]} />
        <meshStandardMaterial color="#60a5fa" roughness={0.4} />
      </mesh>
      <mesh position={[0, 33.0, 0]}>
        <boxGeometry args={[1.4, 1.8, 1.4]} />
        <meshStandardMaterial color="#93c5fd" roughness={0.3} />
      </mesh>
      {[-3.6, 0, 3.6].map((wx, i) =>
        [4.5, 7.5, 12.5, 16.0, 21.0, 24.5].map((wy, j) => (
          <group key={`${i}_${j}`} position={[wx, wy, 4.8]}>
            <mesh>
              <boxGeometry args={[1.5, 1.9, 0.15]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.08]}>
              <boxGeometry args={[1.2, 1.5, 0.08]} />
              <meshStandardMaterial color="#93c5fd" emissive="#38bdf8" emissiveIntensity={0.25} roughness={0.2} />
            </mesh>
          </group>
        ))
      )}
      <mesh position={[0, 2.5, 4.82]}>
        <boxGeometry args={[3.0, 3.4, 0.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ==========================================
// 3. BURGER DINER (Giant 3D Burger on Roof)
// ==========================================
export function BurgerDiner({ position = [0, 0, 0], rotationY = 0, scale = 1 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh position={[0, 3.0, 0]}>
        <boxGeometry args={[9.2, 6.0, 7.8]} />
        <meshStandardMaterial color="#f97316" roughness={0.6} />
      </mesh>
      <mesh position={[0, 4.8, 4.3]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[8.4, 0.5, 2.0]} />
        <meshStandardMaterial color="#ef4444" roughness={0.4} />
      </mesh>
      <mesh position={[-2.4, 2.8, 3.95]}>
        <boxGeometry args={[2.8, 2.4, 0.1]} />
        <meshStandardMaterial color="#e0f2fe" roughness={0.2} />
      </mesh>
      <mesh position={[2.4, 2.8, 3.95]}>
        <boxGeometry args={[2.8, 2.4, 0.1]} />
        <meshStandardMaterial color="#e0f2fe" roughness={0.2} />
      </mesh>

      <group position={[0, 8.2, 0]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[3.4, 3.1, 0.8, 20]} />
          <meshStandardMaterial color="#d97706" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[3.5, 3.5, 0.7, 20]} />
          <meshStandardMaterial color="#451a03" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.25, 0]} rotation={[0, 0.4, 0]}>
          <boxGeometry args={[5.2, 0.22, 5.2]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[3.7, 3.6, 0.35, 18]} />
          <meshStandardMaterial color="#22c55e" roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.85, 0]}>
          <cylinderGeometry args={[3.3, 3.3, 0.35, 18]} />
          <meshStandardMaterial color="#ef4444" roughness={0.4} />
        </mesh>
        <mesh position={[0, 2.7, 0]}>
          <sphereGeometry args={[3.4, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.55} />
        </mesh>
        {[
          [0.8, 3.9, 0.6], [-0.9, 3.8, 0.8], [0.3, 4.0, -0.9],
          [-0.7, 3.7, -0.8], [1.2, 3.6, -0.3], [-1.2, 3.5, -0.1]
        ].map(([sx, sy, sz], idx) => (
          <mesh key={idx} position={[sx, sy, sz]} rotation={[0.2, idx, 0.3]}>
            <boxGeometry args={[0.18, 0.08, 0.28]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ==========================================
// 4. PIZZA PALACE (Giant Pizza Slice on Roof)
// ==========================================
export function PizzaPalace({ position = [0, 0, 0], rotationY = 0, scale = 1 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh position={[0, 2.7, 0]}>
        <boxGeometry args={[8.5, 5.4, 7.5]} />
        <meshStandardMaterial color="#eab308" roughness={0.65} />
      </mesh>
      <mesh position={[0, 5.5, 0]}>
        <boxGeometry args={[8.9, 0.5, 7.9]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} />
      </mesh>
      <group position={[0, 8.2, 0]} rotation={[0.4, 0.3, 0.2]}>
        <mesh>
          <coneGeometry args={[3.6, 5.5, 3]} />
          <meshStandardMaterial color="#facc15" roughness={0.5} />
        </mesh>
        <mesh position={[0, -2.4, 0]}>
          <boxGeometry args={[4.2, 0.9, 1.2]} />
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>
        {[
          [0, -1.2, 0.75], [-0.7, 0.2, 0.6], [0.6, 0.1, 0.6], [0, 1.4, 0.45]
        ].map(([px, py, pz], idx) => (
          <mesh key={idx} position={[px, py, pz]}>
            <cylinderGeometry args={[0.55, 0.55, 0.12, 12]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ==========================================
// 5. DONUT BAKERY (Giant Frosted Donut on Roof)
// ==========================================
export function DonutBakery({ position = [0, 0, 0], rotationY = 0, scale = 1 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh position={[0, 2.6, 0]}>
        <boxGeometry args={[8.0, 5.2, 7.5]} />
        <meshStandardMaterial color="#a855f7" roughness={0.6} />
      </mesh>
      <mesh position={[0, 5.3, 0]}>
        <boxGeometry args={[8.4, 0.5, 7.9]} />
        <meshStandardMaterial color="#f472b6" roughness={0.4} />
      </mesh>
      <group position={[0, 8.4, 0]} rotation={[0.3, 0.4, 0.2]}>
        <mesh>
          <torusGeometry args={[2.6, 1.1, 12, 24]} />
          <meshStandardMaterial color="#d97706" roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <torusGeometry args={[2.6, 1.15, 12, 24, Math.PI * 1.6]} />
          <meshStandardMaterial color="#ec4899" roughness={0.3} metalness={0.1} />
        </mesh>
        {[
          { pos: [1.6, 1.1, 0.3], col: '#38bdf8', rot: 0.6 },
          { pos: [-1.4, 1.1, 0.5], col: '#facc15', rot: -0.8 },
          { pos: [0.2, 1.2, 1.5], col: '#ffffff', rot: 1.2 },
          { pos: [-0.3, 1.2, -1.4], col: '#4ade80', rot: -0.4 },
          { pos: [1.2, 1.0, -1.1], col: '#f43f5e', rot: 0.3 }
        ].map((s, idx) => (
          <mesh key={idx} position={s.pos} rotation={[0, s.rot, 0]}>
            <boxGeometry args={[0.18, 0.12, 0.55]} />
            <meshBasicMaterial color={s.col} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ==========================================
// 6. ROUND MUSHROOM / BARREL COTTAGE
// ==========================================
export function RoundMushroomCottage({ position = [0, 0, 0], rotationY = 0, scale = 1 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[4.4, 4.6, 1.2, 16]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.8, 0]}>
        <cylinderGeometry args={[4.2, 4.3, 5.4, 16]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.7} />
      </mesh>
      <mesh position={[0, 7.8, 0]}>
        <coneGeometry args={[5.8, 4.4, 16]} />
        <meshStandardMaterial color="#c2410c" roughness={0.6} />
      </mesh>
      <mesh position={[2.2, 9.4, 0.8]}>
        <cylinderGeometry args={[0.55, 0.65, 2.6, 8]} />
        <meshStandardMaterial color="#78716c" roughness={0.9} />
      </mesh>
      <mesh position={[2.4, 11.2, 0.9]}>
        <sphereGeometry args={[0.65, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, 2.2, 4.2]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.9, 2.8, 0.3]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ==========================================
// 7. PASTEL VILLAGE COTTAGE
// ==========================================
export function VillageHouse({
  position = [0, 0, 0],
  rotationY = 0,
  scale = 1,
  bodyColor = '#38bdf8',
  roofColor = '#7c3aed'
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh position={[0, 3.2, 0]}>
        <boxGeometry args={[7.8, 6.4, 6.8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.65} />
      </mesh>
      <mesh position={[0, 8.4, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[6.2, 4.4, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.8, 3.42]}>
        <boxGeometry args={[1.8, 2.8, 0.2]} />
        <meshStandardMaterial color="#92400e" roughness={0.8} />
      </mesh>
      {[-2.2, 2.2].map((wx, idx) => (
        <mesh key={idx} position={[wx, 3.6, 3.42]}>
          <boxGeometry args={[1.5, 1.6, 0.15]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ==========================================
// 8. ANIMATED WINDMILL
// ==========================================
export function Windmill({ position = [0, 0, 0], rotationY = 0, scale = 1 }) {
  const bladesRef = useRef();

  useFrame((_, delta) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.z += delta * 1.1;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh position={[0, 5.0, 0]}>
        <cylinderGeometry args={[3.8, 5.4, 10.0, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.8} />
      </mesh>
      <mesh position={[0, 9.8, 0]}>
        <cylinderGeometry args={[4.6, 4.6, 0.6, 16]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      <mesh position={[0, 12.2, 0]}>
        <cylinderGeometry args={[3.2, 3.6, 4.4, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.8} />
      </mesh>
      <mesh position={[0, 15.6, 0]}>
        <coneGeometry args={[4.2, 3.6, 16]} />
        <meshStandardMaterial color="#c2410c" roughness={0.65} />
      </mesh>

      <group position={[0, 14.0, 3.4]} ref={bladesRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 0.8, 12]} />
          <meshStandardMaterial color="#d97706" roughness={0.4} />
        </mesh>
        {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((rot, idx) => (
          <group key={idx} rotation={[0, 0, rot]}>
            <mesh position={[0, 4.8, 0]}>
              <boxGeometry args={[0.22, 9.6, 0.15]} />
              <meshStandardMaterial color="#451a03" roughness={0.7} />
            </mesh>
            <mesh position={[0.75, 5.5, 0]}>
              <boxGeometry args={[1.5, 7.5, 0.08]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} transparent opacity={0.9} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// ==========================================
// 9. ANIMATED HOT AIR BALLOON
// ==========================================
export function HotAirBalloon({ position = [0, 50, 0], scale = 1, color1 = '#ef4444', color2 = '#fde047', phase = 0 }) {
  const balloonRef = useRef();

  useFrame(({ clock }) => {
    if (!balloonRef.current) return;
    const t = clock.getElapsedTime();
    balloonRef.current.position.y = position[1] + Math.sin(t * 1.1 + phase) * 2.8;
    balloonRef.current.rotation.y = Math.sin(t * 0.4 + phase) * 0.15;
  });

  return (
    <group ref={balloonRef} position={position} scale={scale}>
      <mesh position={[0, 7.5, 0]}>
        <sphereGeometry args={[5.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.85]} />
        <meshStandardMaterial color={color1} roughness={0.45} />
      </mesh>
      <mesh position={[0, 3.2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[3.8, 4.2, 16]} />
        <meshStandardMaterial color={color2} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.6, 0]}>
        <boxGeometry args={[1.8, 1.4, 1.8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      {[-0.7, 0.7].map((rx) =>
        [-0.7, 0.7].map((rz) => (
          <mesh key={`${rx}_${rz}`} position={[rx * 0.8, 0.8, rz * 0.8]}>
            <cylinderGeometry args={[0.03, 0.03, 1.8, 4]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))
      )}
    </group>
  );
}

// ==========================================
// 10. TOWN SQUARE WATER FOUNTAIN
// ==========================================
export function TownFountain({ position = [0, 0, 0], scale = 1 }) {
  const waterRef = useRef();

  useFrame(({ clock }) => {
    if (waterRef.current) {
      const s = 1.0 + Math.sin(clock.getElapsedTime() * 4.5) * 0.08;
      waterRef.current.scale.set(s, 1.0 + Math.cos(clock.getElapsedTime() * 4.5) * 0.12, s);
    }
  });

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[6.5, 7.0, 1.2, 8]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[5.8, 5.8, 0.2, 16]} />
        <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.2} transparent opacity={0.88} />
      </mesh>
      <mesh position={[0, 2.0, 0]}>
        <cylinderGeometry args={[1.4, 1.8, 2.0, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[3.2, 2.2, 0.8, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      <mesh position={[0, 4.4, 0]}>
        <cylinderGeometry args={[0.5, 0.8, 1.8, 8]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh ref={waterRef} position={[0, 5.2, 0]}>
        <coneGeometry args={[1.2, 2.6, 8]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.6} transparent opacity={0.75} />
      </mesh>
    </group>
  );
}

// ==========================================
// 11. CAFE PATIO UMBRELLA SET
// ==========================================
export function CafePatio({ position = [0, 0, 0], rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 2.8, 0]}>
        <coneGeometry args={[2.5, 1.1, 10]} />
        <meshStandardMaterial color="#f43f5e" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 2.8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 0.08, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.9, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>
      {[-1.3, 1.3].map((cx, idx) => (
        <group key={idx} position={[cx, 0, 0]} rotation={[0, idx === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.65, 0.08, 0.65]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.9, -0.28]}>
            <boxGeometry args={[0.65, 0.75, 0.06]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ==========================================
// 12. ROADSIDE DIRECTION SIGNPOST
// ==========================================
export function RoadSignpost({ position = [0, 0, 0], rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 3.2, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      <mesh position={[0.7, 2.7, 0]} rotation={[0, 0, 0.05]}>
        <boxGeometry args={[1.5, 0.45, 0.08]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.6} />
      </mesh>
      <mesh position={[-0.7, 2.1, 0]} rotation={[0, 0, -0.05]}>
        <boxGeometry args={[1.5, 0.45, 0.08]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.6} />
      </mesh>
    </group>
  );
}

// ==========================================
// 13. TREES, FOLIAGE & STREET PROPS
// ==========================================
export function GumdropTree({ position = [0, 0, 0], scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.35, 0.55, 2.4, 8]} />
        <meshStandardMaterial color="#5c3818" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <coneGeometry args={[2.2, 2.8, 8]} />
        <meshStandardMaterial color="#15803d" roughness={0.65} />
      </mesh>
      <mesh position={[0, 4.8, 0]}>
        <coneGeometry args={[1.75, 2.5, 8]} />
        <meshStandardMaterial color="#16a34a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 6.2, 0]}>
        <coneGeometry args={[1.2, 2.2, 8]} />
        <meshStandardMaterial color="#22c55e" roughness={0.55} />
      </mesh>
    </group>
  );
}

export function PuffyTree({ position = [0, 0, 0], scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.4, 0.6, 3.0, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.4, 0]}>
        <sphereGeometry args={[2.2, 10, 10]} />
        <meshStandardMaterial color="#84cc16" roughness={0.6} />
      </mesh>
      <mesh position={[1.1, 4.8, 0.3]} scale={0.75}>
        <sphereGeometry args={[2.0, 10, 10]} />
        <meshStandardMaterial color="#65a30d" roughness={0.6} />
      </mesh>
      <mesh position={[-1.0, 4.9, -0.4]} scale={0.78}>
        <sphereGeometry args={[2.0, 10, 10]} />
        <meshStandardMaterial color="#4d7c0f" roughness={0.6} />
      </mesh>
    </group>
  );
}

export function StreetLamp({ position = [0, 0, 0], rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.1, 0.18, 4.8, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 5.0, 0]}>
        <cylinderGeometry args={[0.42, 0.28, 0.9, 6]} />
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 4.85, 0]}>
        <sphereGeometry args={[0.34, 10, 10]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#f59e0b"
          emissiveIntensity={1.2}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

export function PicketFence({ position = [0, 0, 0], rotationY = 0, length = 8 }) {
  const pickets = Math.floor(length / 0.85);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[length * 0.5, 0.45, 0]}>
        <boxGeometry args={[length, 0.12, 0.1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      <mesh position={[length * 0.5, 1.05, 0]}>
        <boxGeometry args={[length, 0.12, 0.1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      {Array.from({ length: pickets }).map((_, i) => (
        <mesh key={i} position={[i * 0.85 + 0.4, 0.75, 0]}>
          <boxGeometry args={[0.22, 1.45, 0.08]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ==========================================
// 14. HORIZON CLOUD WALL
// ==========================================
export function HorizonCloudRing() {
  const cloudCount = 28;
  const radius = 390;

  const clouds = useMemo(() => {
    const list = [];
    for (let i = 0; i < cloudCount; i++) {
      const angle = (i / cloudCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 38 + Math.sin(i * 1.7) * 12;
      const scale = 14 + (Math.sin(i * 3.3) * 0.5 + 0.5) * 8;
      list.push({ x, y, z, scale, angle });
    }
    return list;
  }, []);

  return (
    <group name="HorizonClouds">
      {clouds.map((c, idx) => (
        <group key={idx} position={[c.x, c.y, c.z]} scale={c.scale}>
          <mesh>
            <sphereGeometry args={[1.5, 10, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
          <mesh position={[-1.2, -0.3, 0]} scale={0.82}>
            <sphereGeometry args={[1.3, 8, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
          <mesh position={[1.3, -0.2, 0.2]} scale={0.88}>
            <sphereGeometry args={[1.3, 8, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
          <mesh position={[0.2, 0.8, -0.1]} scale={0.78}>
            <sphereGeometry args={[1.2, 8, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ==========================================
// 15. MASTER TOON TOWN ENVIRONMENT
// ==========================================
export function CartoonTownEnvironment() {
  const grassTex = useMemo(() => getCartoonGrassTexture(), []);

  return (
    <group name="CartoonTownMaster">
      {/* Brilliant Cartoon Sky & Atmospheric Fog */}
      <fog attach="fog" args={['#aee0ff', 160, 520]} />

      {/* Lush Green Rolling Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -160]}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial
          color="#52b724"
          map={grassTex}
          roughness={0.88}
          metalness={0.02}
        />
      </mesh>

      {/* Rolling Hill Mounds */}
      {[
        { pos: [-160, -2, -180], scale: [85, 18, 75] },
        { pos: [170, -2, -140], scale: [95, 22, 85] },
        { pos: [0, -3, -340], scale: [120, 26, 90] },
        { pos: [-240, -2, 20], scale: [90, 20, 80] },
        { pos: [220, -2, 40], scale: [100, 24, 80] }
      ].map((hill, idx) => (
        <mesh key={idx} position={hill.pos} scale={hill.scale}>
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial color="#48a81d" roughness={0.92} />
        </mesh>
      ))}

      {/* --- TOWN SQUARE ANIMATED WATER FOUNTAIN --- */}
      <TownFountain position={[0, 0, -155]} scale={1.15} />

      {/* --- ANIMATED WINDMILL ON SCENIC HILL --- */}
      <Windmill position={[185, 0, -135]} rotationY={-Math.PI * 0.4} scale={1.1} />

      {/* --- FLOATING HOT AIR BALLOONS IN THE SKY --- */}
      <HotAirBalloon position={[-110, 48, -110]} scale={1.1} color1="#ef4444" color2="#facc15" phase={0} />
      <HotAirBalloon position={[150, 55, -230]} scale={0.95} color1="#38bdf8" color2="#ffffff" phase={1.8} />
      <HotAirBalloon position={[-30, 62, -280]} scale={1.05} color1="#ec4899" color2="#fde047" phase={3.4} />

      {/* --- NORTH STRAIGHT (MAIN STREET / TOON DOWNTOWN) --- */}
      <ClockTower position={[60, 0, 18]} rotationY={Math.PI} scale={1.15} />
      <BlueSkyscraper position={[-60, 0, 20]} rotationY={Math.PI * 0.05} scale={1.05} />
      <BurgerDiner position={[140, 0, 19]} rotationY={Math.PI * 0.95} scale={1.1} />
      <PizzaPalace position={[-130, 0, 18]} rotationY={Math.PI * 1.05} scale={1.1} />
      <DonutBakery position={[0, 0, -74]} rotationY={0} scale={1.1} />
      <RoundMushroomCottage position={[95, 0, -75]} rotationY={0.2} scale={1.0} />
      <RoundMushroomCottage position={[-85, 0, -75]} rotationY={-0.3} scale={1.0} />
      <VillageHouse position={[190, 0, 8]} rotationY={Math.PI * 0.85} bodyColor="#38bdf8" roofColor="#7c3aed" />
      <VillageHouse position={[-185, 0, 6]} rotationY={Math.PI * 1.15} bodyColor="#f472b6" roofColor="#ea580c" />

      {/* Cafe Patios outside Diner & Bakery */}
      <CafePatio position={[140, 0, 28]} rotationY={0} />
      <CafePatio position={[-5, 0, -62]} rotationY={Math.PI} />

      {/* Direction Signs */}
      <RoadSignpost position={[-25, 0, -3]} rotationY={0.1} />
      <RoadSignpost position={[165, 0, -318]} rotationY={-Math.PI * 0.3} />

      {/* --- EAST CAROUSEL CURVE (SUBURBAN ORCHARD) --- */}
      <BlueSkyscraper position={[335, 0, -150]} rotationY={-Math.PI / 2} scale={0.95} />
      <BurgerDiner position={[325, 0, -225]} rotationY={-Math.PI * 0.4} scale={1.0} />
      <RoundMushroomCottage position={[210, 0, -160]} rotationY={Math.PI / 2} scale={1.1} />
      <VillageHouse position={[328, 0, -90]} rotationY={-Math.PI * 0.65} bodyColor="#4ade80" roofColor="#c2410c" />

      {/* --- SOUTH STRAIGHTAWAY (FOOD PLAZA & SHOPS) --- */}
      <ClockTower position={[-30, 0, -355]} rotationY={0} scale={1.05} />
      <PizzaPalace position={[80, 0, -350]} rotationY={0} scale={1.1} />
      <DonutBakery position={[-110, 0, -350]} rotationY={0.1} scale={1.05} />
      <BurgerDiner position={[-190, 0, -345]} rotationY={0.25} scale={1.0} />
      <RoundMushroomCottage position={[160, 0, -345]} rotationY={-0.2} scale={1.05} />
      <VillageHouse position={[40, 0, -248]} rotationY={Math.PI} bodyColor="#facc15" roofColor="#6366f1" />
      <VillageHouse position={[-50, 0, -248]} rotationY={Math.PI} bodyColor="#fb7185" roofColor="#0284c7" />

      {/* --- WEST HAIRPIN (COZY VILLAGE GREEN) --- */}
      <BlueSkyscraper position={[-335, 0, -160]} rotationY={Math.PI / 2} scale={0.95} />
      <RoundMushroomCottage position={[-328, 0, -225]} rotationY={Math.PI * 0.4} scale={1.1} />
      <VillageHouse position={[-325, 0, -95]} rotationY={Math.PI * 0.65} bodyColor="#38bdf8" roofColor="#f59e0b" />
      <PizzaPalace position={[-205, 0, -160]} rotationY={-Math.PI / 2} scale={1.0} />

      {/* --- STREETLAMPS ALONG THE WIDE TRACK --- */}
      {[
        [-15, 0, -4], [40, 0, -4], [95, 0, -4], [150, 0, -8],
        [260, 0, -75], [268, 0, -150], [260, 0, -240],
        [150, 0, -320], [50, 0, -320], [-50, 0, -320], [-150, 0, -320],
        [-260, 0, -240], [-268, 0, -150], [-260, 0, -75]
      ].map((pos, idx) => (
        <StreetLamp key={`lamp_${idx}`} position={pos} rotationY={idx % 2 === 0 ? 0 : Math.PI} />
      ))}

      {/* --- PICKET FENCES ALONG CURVES --- */}
      {[
        { pos: [175, 0, -6], rot: -0.2, len: 14 },
        { pos: [320, 0, -95], rot: 0.8, len: 16 },
        { pos: [320, 0, -225], rot: 2.3, len: 16 },
        { pos: [-170, 0, -322], rot: 0.1, len: 16 },
        { pos: [-320, 0, -225], rot: -2.3, len: 16 },
        { pos: [-320, 0, -95], rot: -0.8, len: 16 }
      ].map((f, idx) => (
        <PicketFence key={`fence_${idx}`} position={f.pos} rotationY={f.rot} length={f.len} />
      ))}

      {/* --- GUMDROP CYPRESS TREES (In rows & groves) --- */}
      {[
        [-35, 0, 4], [15, 0, 4], [70, 0, 4], [120, 0, 2],
        [-35, 0, -56], [15, 0, -56], [70, 0, -56], [120, 0, -54],
        [325, 0, -65], [330, 0, -125], [330, 0, -190], [325, 0, -250],
        [110, 0, -330], [20, 0, -330], [-70, 0, -330], [-130, 0, -330],
        [-325, 0, -65], [-330, 0, -125], [-330, 0, -190], [-325, 0, -250],
        [-20, 0, -140], [30, 0, -135], [75, 0, -150], [-60, 0, -165]
      ].map((pos, idx) => (
        <GumdropTree key={`gtree_${idx}`} position={pos} scale={1.0 + (idx % 3) * 0.15} />
      ))}

      {/* --- PUFFY CARTOON TREES --- */}
      {[
        [-90, 0, 5], [35, 0, 5], [110, 0, 5], [165, 0, -8],
        [250, 0, -50], [260, 0, -260],
        [70, 0, -325], [-25, 0, -325], [-105, 0, -325],
        [-250, 0, -50], [-260, 0, -260],
        [0, 0, -160], [20, 0, -180], [-30, 0, -180]
      ].map((pos, idx) => (
        <PuffyTree key={`ptree_${idx}`} position={pos} scale={1.0 + (idx % 2) * 0.2} />
      ))}

      {/* --- HORIZON CLOUD WALL --- */}
      <HorizonCloudRing />
    </group>
  );
}
