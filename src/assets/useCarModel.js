/**
 * src/assets/useCarModel.js
 * Loads a car GLB with DRACOLoader + MeshoptDecoder + SpecularGlossiness support,
 * normalizes it, and falls back cleanly to createProceduralBuggy if missing.
 */
import { useState, useEffect } from 'react';
import { GLTFLoader, DRACOLoader, MeshoptDecoder } from 'three-stdlib';
import { normalizeModel, createProceduralBuggy } from './normalizeModel';
import { GLTFMaterialsPbrSpecularGlossinessExtension } from './specularGlossinessPlugin';

const gltfCache = new Map();
let sharedLoader = null;

function getSharedGLTFLoader() {
  if (sharedLoader) return sharedLoader;
  const loader = new GLTFLoader();
  try {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    loader.setDRACOLoader(dracoLoader);
  } catch (err) {}
  try {
    if (MeshoptDecoder) {
      loader.setMeshoptDecoder(MeshoptDecoder);
    }
  } catch (err) {}
  try {
    loader.register((parser) => new GLTFMaterialsPbrSpecularGlossinessExtension(parser));
  } catch (err) {}
  sharedLoader = loader;
  return loader;
}

export function preloadCarModels(cars = []) {
  const loader = getSharedGLTFLoader();
  cars.forEach((car) => {
    if (!car?.file || gltfCache.has(car.file)) return;
    loader.load(
      car.file,
      (gltf) => {
        gltfCache.set(car.file, gltf.scene);
      },
      undefined,
      (err) => {
        console.warn(`[useCarModel] Preload warning for "${car.file}":`, err?.message || err);
      }
    );
  });
}

export function useCarModel(carEntry, overrideColor = null) {
  const [modelData, setModelData] = useState(() =>
    createProceduralBuggy(
      overrideColor || carEntry?.color || '#e10600',
      carEntry?.accentColor || '#ffd000'
    )
  );

  useEffect(() => {
    let active = true;
    const file = carEntry?.file;
    const color = overrideColor || carEntry?.color || '#e10600';
    const accent = carEntry?.accentColor || '#ffd000';

    if (!file) {
      setModelData(createProceduralBuggy(color, accent));
      return () => { active = false; };
    }

    if (gltfCache.has(file)) {
      try {
        const norm = normalizeModel(gltfCache.get(file), {
          targetLength: 4.4,
          manifestScale: carEntry?.scale,
          manifestRotationY: carEntry?.rotationY,
          wheelNodeNames: carEntry?.wheelNodeNames || [],
          tintColor: overrideColor,
          isCar: true
        });
        if (active) setModelData(norm);
      } catch (err) {
        console.warn(`[useCarModel] Failed to normalize cached model "${file}":`, err);
        if (active) setModelData(createProceduralBuggy(color, accent));
      }
      return () => { active = false; };
    }

    const loader = getSharedGLTFLoader();
    loader.load(
      file,
      (gltf) => {
        if (!active) return;
        try {
          gltfCache.set(file, gltf.scene);
          const norm = normalizeModel(gltf.scene, {
            targetLength: 4.4,
            manifestScale: carEntry?.scale,
            manifestRotationY: carEntry?.rotationY,
            wheelNodeNames: carEntry?.wheelNodeNames || [],
            tintColor: overrideColor,
            isCar: true
          });
          setModelData(norm);
        } catch (err) {
          console.warn(`[useCarModel] Error normalizing "${file}":`, err);
          setModelData(createProceduralBuggy(color, accent));
        }
      },
      undefined,
      (err) => {
        console.warn(`[useCarModel] Could not load "${file}", using procedural buggy placeholder:`, err?.message || err);
        if (active) {
          setModelData(createProceduralBuggy(color, accent));
        }
      }
    );

    return () => {
      active = false;
    };
  }, [carEntry?.file, carEntry?.scale, carEntry?.rotationY, carEntry?.color, overrideColor]);

  return modelData;
}
