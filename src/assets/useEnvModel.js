/**
 * src/assets/useEnvModel.js
 * Loads environment GLBs (scene or prop) with DRACOLoader + SpecularGlossiness support
 * and graceful fallback to procedural geometries.
 */
import { useState, useEffect } from 'react';
import { GLTFLoader, DRACOLoader, MeshoptDecoder } from 'three-stdlib';
import { normalizeModel, createProceduralProp } from './normalizeModel';
import { GLTFMaterialsPbrSpecularGlossinessExtension } from './specularGlossinessPlugin';

const envCache = new Map();
let envLoader = null;

function getLoader() {
  if (envLoader) return envLoader;
  const loader = new GLTFLoader();
  try {
    const draco = new DRACOLoader();
    draco.setDecoderPath('/draco/');
    loader.setDRACOLoader(draco);
  } catch (e) {}
  try {
    if (MeshoptDecoder) loader.setMeshoptDecoder(MeshoptDecoder);
  } catch (e) {}
  try {
    loader.register((parser) => new GLTFMaterialsPbrSpecularGlossinessExtension(parser));
  } catch (e) {}
  envLoader = loader;
  return loader;
}

export function useEnvModel(envEntry) {
  const [sceneObj, setSceneObj] = useState(() => createProceduralProp(envEntry?.id || 'palm_tree'));

  useEffect(() => {
    let active = true;
    const file = envEntry?.file;
    if (!file) {
      setSceneObj(createProceduralProp(envEntry?.id));
      return () => { active = false; };
    }

    if (envCache.has(file)) {
      try {
        const norm = normalizeModel(envCache.get(file), {
          targetLength: 4.0,
          manifestScale: envEntry?.scale || 1.0,
          manifestRotationY: envEntry?.rotationY || 0,
          isCar: false
        });
        if (active) setSceneObj(norm.root);
      } catch (err) {
        if (active) setSceneObj(createProceduralProp(envEntry?.id));
      }
      return () => { active = false; };
    }

    getLoader().load(
      file,
      (gltf) => {
        if (!active) return;
        try {
          envCache.set(file, gltf.scene);
          const norm = normalizeModel(gltf.scene, {
            targetLength: 4.0,
            manifestScale: envEntry?.scale || 1.0,
            manifestRotationY: envEntry?.rotationY || 0,
            isCar: false
          });
          setSceneObj(norm.root);
        } catch (err) {
          console.warn(`[useEnvModel] Failed to normalize "${file}", using procedural fallback:`, err);
          setSceneObj(createProceduralProp(envEntry?.id));
        }
      },
      undefined,
      (err) => {
        console.warn(`[useEnvModel] Missing/invalid environment GLB "${file}", using procedural fallback:`, err?.message || err);
        if (active) setSceneObj(createProceduralProp(envEntry?.id));
      }
    );

    return () => { active = false; };
  }, [envEntry?.file, envEntry?.scale, envEntry?.rotationY, envEntry?.id]);

  return sceneObj;
}
