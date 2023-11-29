import * as fflate from 'fflate';
import {
  Group, Mesh, CanvasTexture,
  LoadingManager,
  TextureLoader, SRGBColorSpace, Color,
  VideoTexture, MathUtils,
} from 'three';
import RWXLoader, {
  RWXMaterialManager,
  pictureTag,
  signTag,
} from 'three-rwx-loader';
import {AWActionParser} from 'aw-action-parser';
import formatSignLines, {makeSignHTML, makeSignCanvas} from '../sign-utils.js';

// WIP
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// import { VRMLLoader } from 'three/addons/loaders/VRMLLoader.js';

const unknownObjectName = '_unknown_';
const unknownObjectAxisAlignment = 'zorienty';
const maxCanvasWidth = 512;
const maxCanvasHeight = 512;

import Utils from '../Utils.js';

export default class Object extends Group {
  constructor(
      scene,
      modelName = 'aw-unknown.rwx',
      description = '',
      action = '',
      pos = [0, 0, 0],
      rot = [0, 0, 0],
      scale = [1, 1, 1],
  ) {
    super();

    this.scene = scene;
    this.actionParser = new AWActionParser();

    this.sceneDescription = this.scene.sceneDescription;
    this.path = this.scene.path;
    this.imageService = this.scene.imageService || '';

    this.modelName = Utils.modelName(modelName);
    this.action = action;
    this.description = description;

    this.newPosition = pos;
    this.newRotation = rot;
    this.newScale = scale;

    if (this.modelName.includes('ground')) {
      // this.newPosition = [0, , 0];
    }

    this.loadingManager = new LoadingManager();
    this.materialManager = null;
    this.loader = null;

    this.textureColorSpace = SRGBColorSpace;
    this.pictureLoader = new TextureLoader();
    this.pictureLoader.textureColorSpace = SRGBColorSpace;

    this.init();
  }

  init() {
    // Scripted Transforms
    this.scriptedRotation = {speed: {x: 0, y: 0, z: 0}};
    this.scriptedMove = {distance: {x: 0, y: 0, z: 0}};
    this.scriptedScale = {factor: {x: 1, y: 1, z: 1}};

    // Pointless to limit in viewer.
    // this.newScale.x = Utils.clampScale(this.newScale.x);
    // this.newScale.y = Utils.clampScale(this.newScale.y);
    // this.newScale.z = Utils.clampScale(this.newScale.z);

    // Utils.modelName normalizes a model's filename into a .rwx
    //  If a given filename has no extension, or is a .zip, (or a .rwx)
    //   It will give us the model's name with the .rwx extension
    //    We can add more conditions to setup new model loaders.
    if (this.modelName.endsWith('.rwx')) {
      this.materialManager = new RWXMaterialManager(this.path + 'textures',
          '.jpg', '.zip', fflate, false, this.textureColorSpace);
      this.loader = (new RWXLoader(this.loadingManager))
          .setRWXMaterialManager(this.materialManager)
          .setPath(this.path + 'rwx').setFlatten(true);
    }

    this.loader.load(this.modelName, (model) => {
      model.name = this.modelName;
      // Object Transform Data
      model.position.set(
          this.newPosition[0],
          this.newPosition[1],
          this.newPosition[2],
      );
      model.rotation.set(
          MathUtils.degToRad(this.newRotation[0]),
          MathUtils.degToRad(this.newRotation[1]),
          MathUtils.degToRad(this.newRotation[2]),
      );

      model.scale.set(
          this.newScale[0],
          this.newScale[1],
          this.newScale[2],
      );

      // Billboard support
      this.axisAlignment = model.userData.rwx.axisAlignment || 'none';

      model.userData.desc = this.description;
      this.add(model);
      if (this.action) {
        try {
          this.applyActionString(model, this.action);
        } catch (e) {
          console.error(e);
        }
      }
    });
  }

  /**
   * Apply action string to the given 3D prop
   * @param {Object3D} obj3d - 3D asset to apply the action string to.
   * @param {string} actionString - Content of the action string.
   */
  applyActionString(obj3d, actionString) {
    this.applyActionsRecursive(obj3d, this.actionParser.parse(actionString));
  }
  /**
   * Recursively apply parsed action commands to the given 3D prop,
   * for internal use by {@link applyActionString}
   * @param {Object3D} obj3d - 3D asset to apply the action string to.
   * @param {string} actions - Parsed action commands.
   */
  applyActionsRecursive(obj3d, actions) {
    if (obj3d instanceof Group) {
      // We are dealing with a group, this means we must
      // perform a recursive call to its children
      // console.log(actions)
      for (const child of actions.children) {
        this.applyActionsRecursive(child, actions);
      }

      return;
    } else if (!(obj3d instanceof Mesh)) {
      // If the object is neither a Group nor a Mesh, then it's invalid
      throw new Error('Invalid object type provided for action parsing');
    }


    // We only care for 'create' actions for the moment.
    const createActions = actions.create ? actions.create : [];

    if (!actions.create) return;
    const materials = [];

    let materialChanged = false;

    // This is a placeholder object, nothing to do
    if (obj3d.name === unknownObjectName) return;

    for (const material of obj3d.material) {
      if (!material.userData.rwx) {
        throw new Error('Material is missing RWX metadata');
      }

      const rwxMaterial = material.userData.rwx.material.clone();
      const originalSignature = material.name;

      let texture = null;
      let color = null;
      let solid = true;
      let visible = true;
      let picture = null;
      let sign = null;
      let scale = null;
      let opacity = null;

      for (const action of createActions) {
        switch (action.commandType) {
          case 'color':
            color = [action.color.r / 255.0,
              action.color.g / 255.0,
              action.color.b / 255.0];
            break;

          case 'texture':
            texture = action;
            break;

          case 'visible':
            visible = action.value;
            break;

          case 'solid':
            solid = action.value;
            break;

          case 'picture':
            picture = action;
            break;

          case 'sign':
            sign = action;
            console.log(obj3d);
            sign.text = action.text || obj3d.userData.desc;
            break;

          case 'scale':
            scale = action;
            break;

          case 'opacity':
            opacity = action;
            break;

          default:
            // No action, we do nothing.
            break;
        }
      }

      if (texture) {
        rwxMaterial.texture = texture.texture;
        rwxMaterial.mask = texture.mask;
      } else if (color) {
        rwxMaterial.color = color;
        rwxMaterial.texture = null;
        rwxMaterial.mask = null;
      } else {
        // Nothing.
      }

      if (scale) obj3d.scale.copy(scale.factor);

      if (opacity) rwxMaterial.opacity = opacity.opacity;

      obj3d.userData.rwx.solid = solid;
      obj3d.visible = visible;
      obj3d.userData.invisible = !visible;

      const newSignature = rwxMaterial.getMatSignature();

      if (newSignature != originalSignature) materialChanged = true;

      if (!this.materialManager.hasThreeMaterialPack(newSignature)) {
        // Material with those properties does not exist yet, we create it
        this.materialManager.addRWXMaterial(rwxMaterial, newSignature);
      }

      const lastMatId = materials.length;
      materials.push(this.materialManager.getThreeMaterialPack(newSignature)
          .threeMat);

      // Check if we need to apply a picture
      // and if said picture can be applied here to begin with...
      if (picture?.resource && obj3d.userData.taggedMaterials[pictureTag]
          ?.includes(lastMatId)) {
        const url = this.imageService + picture.resource;
        // Doing the above ensures us the new array of materials
        // will be updated, so if a picture is applied:
        // it will actually be visible
        materialChanged = true;

        this.pictureLoader.load(url, (image) => {
          image.colorSpace = SRGBColorSpace;

          materials[lastMatId] = materials[lastMatId].clone();
          materials[lastMatId].color = new Color(1.0, 1.0, 1.0);
          materials[lastMatId].map = image;
          materials[lastMatId].transparent = true;
          materials[lastMatId].needsUpdate = true;
        });
      }

      // Check if we need to apply a sign
      // and if said sign can be applied here to begin with...
      if (sign && obj3d.userData.taggedMaterials[signTag]
          ?.includes(lastMatId)) {
        materialChanged = true;

        materials[lastMatId] = materials[lastMatId].clone();
        materials[lastMatId].color = new Color(1.0, 1.0, 1.0);
        this.writeTextToCanvas(
            materials[lastMatId],
            sign.text,
            sign.color,
            sign.bcolor,
        );
      }
    }

    if (materialChanged) obj3d.material = materials;
  }

  createElementFromHTML(htmlString) {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
  }

  // tags: 100 = sign; 200 = picture
  makeMedia(item, url) { // Unfinished, but works
    const uid = Math.random().toString(36).substr(4, 12);
    // TODO: Clean this up.
    /* eslint-disable max-len */
    const videoHTML = `
    <video id='video#${uid}' crossOrigin='anonymous' playsinline style='display:none'>
      <source src='${url}' type='video/mp4'>
    </video>`;
    /* eslint-enable max-len */

    document.body.appendChild(this.createElementFromHTML(videoHTML));
    // HTMLVideoElement;
    const video = document.getElementById('video#' + uid);
    video.muted = false;
    // video.play();
    const videoTexture = new VideoTexture(video);
    item.traverse((child) => {
      if (child instanceof Mesh) {
        const newMaterials = [];
        newMaterials.push(...child.material);
        if (item.userData.taggedMaterials[signTag]) {
          for (const i of item.userData.taggedMaterials[signTag]) {
            newMaterials[i] = child.material[i].clone();
            newMaterials[i].color = new Color(1, 1, 1);
            newMaterials[i].map = videoTexture;
            newMaterials[i].map.colorSpace = SRGBColorSpace;
          }
        } else {
          if (item.userData.taggedMaterials[pictureTag]) {
            for (const i of item.userData.taggedMaterials[pictureTag]) {
              newMaterials[i] = child.material[i].clone();
              newMaterials[i].color = new Color(1, 1, 1);
              newMaterials[i].map = videoTexture;
              newMaterials[i].map.textureColorSpace = SRGBColorSpace;
            }
          }
        }
        child.material = newMaterials;
        child.material.needsUpdate = true;
      }
    });
    const mediaPlayer = [];
    mediaPlayer.videoTexture = videoTexture;
    mediaPlayer.videoElement = video;
    item.userData.mediaPlayer = mediaPlayer;
  }

  useHtmlSignRendering() {
    return false;
  }

  writeTextToCanvas(material, text = '',
      textColor = {r: 255, g: 255, b: 255},
      backgroundColor = {r: 0, g: 0, b: 255}) {
    const ratio = material.userData?.ratio ? material.userData.ratio : 1.0;
    const canvas = document.createElement('canvas');
    const canvasWidth = ratio > 1 ? maxCanvasWidth : maxCanvasWidth * ratio;
    const canvasHeight = ratio > 1 ? maxCanvasHeight / ratio : maxCanvasHeight;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const {r, g, b} = backgroundColor;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const {lines, fontSize, maxLineWidth} = formatSignLines(text, ctx);

    if (this.useHtmlSignRendering() && this.rasterizeHTML) {
      // HTML rasterization rendering
      const {r, g, b} = textColor;

      this.rasterizeHTML.drawHTML(
          makeSignHTML(lines, fontSize, canvasWidth, canvasHeight, r, g, b),
          canvas).then(
          (res) => {
            material.map = new CanvasTexture(canvas);
            material.map.colorSpace = SRGBColorSpace;
            material.needsUpdate = true;
          },
          (e) => {
            console.log(e);
          },
      );
    } else {
      // Bare canvas rendering
      const {r, g, b} = textColor;

      makeSignCanvas(ctx, lines, fontSize, maxLineWidth, r, g, b);
      material.map = new CanvasTexture(canvas);
      material.map.colorSpace = SRGBColorSpace;
      material.needsUpdate = true;
    }
  }

  update(delta) {
    // Scripted Scaling
    if (this.scriptedScale.factor) {
      this.scale.set(
          this.scriptedScale.factor.x,
          this.scriptedScale.factor.y,
          this.scriptedScale.factor.z,
      );
    }
    // Imperfect, but simple.
    if (this.axisAlignment !== 'none') {
      this.rotation.y = Math.atan2(
          (this.scene.camera.position.x - this.position.x),
          (this.scene.camera.position.z - this.position.z),
      );
    }
  }
}
