import * as THREE from 'three';

/**
 * GLTFLoader plugin supporting KHR_materials_pbrSpecularGlossiness
 * Converts legacy specular-glossiness materials to standard Three.js MeshStandardMaterial.
 */
export class GLTFMaterialsPbrSpecularGlossinessExtension {
  constructor(parser) {
    this.name = 'KHR_materials_pbrSpecularGlossiness';
    this.parser = parser;
  }

  getMaterialType(materialIndex) {
    const parser = this.parser;
    const materialDef = parser.json.materials[materialIndex];
    if (!materialDef.extensions || !materialDef.extensions[this.name]) return null;
    return THREE.MeshStandardMaterial;
  }

  extendMaterialParams(materialIndex, materialParams) {
    const parser = this.parser;
    const materialDef = parser.json.materials[materialIndex];
    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    const pending = [];
    const extension = materialDef.extensions[this.name];

    materialParams.color = new THREE.Color(1.0, 1.0, 1.0);
    materialParams.opacity = 1.0;

    const diffuseFactor = extension.diffuseFactor;
    if (Array.isArray(diffuseFactor)) {
      materialParams.color.fromArray(diffuseFactor);
      materialParams.opacity = diffuseFactor[3] !== undefined ? diffuseFactor[3] : 1.0;
    }

    if (materialParams.opacity < 1.0) {
      materialParams.transparent = true;
    }

    if (extension.diffuseTexture !== undefined) {
      pending.push(
        parser.assignTexture(materialParams, 'map', extension.diffuseTexture).then(() => {
          if (materialParams.map) {
            materialParams.map.colorSpace = THREE.SRGBColorSpace;
          }
        })
      );
    }

    const gloss = extension.glossinessFactor !== undefined ? extension.glossinessFactor : 1.0;
    materialParams.roughness = Math.max(0.04, Math.min(1.0, 1.0 - gloss));
    materialParams.metalness = 0.08;

    return Promise.all(pending);
  }
}
