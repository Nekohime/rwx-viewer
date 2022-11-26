// Based on code from https:// github.com/7185/lemuria/blob/dev/src/app/world/object.service.ts
import { forkJoin } from 'rxjs';
import { Group, Mesh, CanvasTexture, TextureLoader, sRGBEncoding, Color,
  VideoTexture, MathUtils } from 'three';
import RWXLoader, { RWXMaterialManager, pictureTag, signTag } from 'three-rwx-loader';
import { AWActionParser } from 'aw-action-parser';
import * as JSZip from 'jszip';
import JSZipUtils from 'jszip-utils';
import Utils from '../Utils';

export default class MainObject extends Group {
  constructor(scene) {
    super();
    this.json = require("../object.json");
    this.scene = scene;
    this.model = Utils.modelName(this.json.model);
    this.description = this.json.description;
    this.action = this.json.action;
    this.parser = new AWActionParser();
    this.actionResult = this.parser.parse(this.action);
    this.objectAppliedRotation = { speed: { x: 0, y: 0, z: 0 } };
    this.objectAppliedMove = { distance: { x: 0, y: 0, z: 0 } };
    this.objectAppliedScale = { factor: { x: 1, y: 1, z: 1 } };
    this.objectPosition = this.json.position;
    this.objectRotation = this.json.rotation;
    this.objectScale = this.json.scale;
    this.objectScale[0] = this.clampScale(this.objectScale[0]);
    this.objectScale[1] = this.clampScale(this.objectScale[1]);
    this.objectScale[2] = this.clampScale(this.objectScale[2]);
    this.rwxLoader = new RWXLoader();
    this.curRWX = null;

    this.path = scene.json.path.base;
    this.path_models = this.path + scene.json.path.models;
    this.path_textures = this.path + scene.json.path.textures;

    this.rwxLoader.setPath(this.path_models).setResourcePath(this.path_textures).setJSZip(JSZip, JSZipUtils).setWaitFullLoad(true).setFlatten(true).setTextureEncoding(sRGBEncoding); // .setUseBasicMaterial(true)
    this.rwxLoader.load(this.model, (rwx) => {
      // Object Data
      // BUG: Pivot point doesn't automatically changed - which gave me an idea: "Orbit" command (N(Y)I)
      rwx.position.set(this.objectPosition[0], this.objectPosition[1], this.objectPosition[2]);
      rwx.rotation.set(MathUtils.degToRad(this.objectRotation[0]), MathUtils.degToRad(this.objectRotation[1]), MathUtils.degToRad(this.objectRotation[2]));
      rwx.scale.set(this.objectScale[0], this.objectScale[1], this.objectScale[1]); // This is not currently implemented in any universe tech, but is here because I think it would be pretty cool.
      this.axisAlignment = rwx.userData.rwx.axisAlignment || 'none'; // Billboard support
      rwx.userData.desc = this.description;
      this.execActions(rwx);
      this.add(rwx);
    });
  }

  clampScale(value) { // For Object Data Scaling (A feature not currently in Lemuria)
    let SCALE_MIN = this.scene.strict_mode ? 0.2 : 0.1; // Lemuria compat. The scripting way *will* clamp SCALE_MIN to 0.2!
    let SCALE_MAX = 10;
    if (value > 0) {
      return Math.max(Math.min(value, SCALE_MAX), SCALE_MIN);
    } else {
      return 1;
    }
  }

  execActions(rwx) {

      let textured = false;
      let texturing = null;
      const result = this.actionResult;
      //console.log(result);
      if (result.create != null) {
          for (const cmd of result.create) {
              if (cmd.commandType === 'texture' || cmd.commandType === 'color') {
                  textured = true;
              }
          }
          for (const cmd of result.create) {
              if (cmd.commandType === 'solid') {
                  rwx.userData.notSolid = !cmd.value;
              }
              if (cmd.commandType === 'visible') {
                  rwx.visible = cmd.value;
              } else if (cmd.commandType === 'color') {
                  this.applyTexture(rwx, null, null, cmd.color);
              } else if (cmd.commandType === 'texture') {
                  if (cmd.texture) {
                      cmd.texture = cmd.texture.lastIndexOf('.') !== -1 ? cmd.texture.substring(0, cmd.texture.lastIndexOf('.')) : cmd.texture;
                      if (cmd.mask) {
                          cmd.mask = cmd.mask.lastIndexOf('.') !== -1 ? cmd.mask.substring(0, cmd.mask.lastIndexOf('.')) : cmd.mask;
                      }
                  }
                  texturing = this.applyTexture(rwx, cmd.texture, cmd.mask);
              }
              if (!textured) {
                  if (cmd.commandType === 'sign') {
                      this.makeSign(rwx, cmd.text, cmd.color, cmd.bcolor);
                      //this.makeSign(rwx, "hey!", {r: 255, g: 255, b: 255}, {r: 0, g: 0, b: 0})

                  }
                  if (cmd.commandType === 'picture') {
                      this.makePicture(rwx, cmd.resource);
                  }
                  if (cmd.commandType === 'media') {
                      this.makeMedia(rwx, cmd.resource);
                  }

              }
              if (cmd.commandType === 'rotate') {
                  this.objectAppliedRotation.speed = cmd.speed;
              }
              if (cmd.commandType === 'move') {
                  this.objectAppliedMove.distance = cmd.distance,
                      this.objectAppliedMove.time = cmd.time;
              }
              if (cmd.commandType === 'scale') {
                  this.objectAppliedScale.factor = cmd.factor;
              }
          }
      }
      if (result.activate != null) {
          for (const cmd of result.activate) {
              rwx.userData.clickable = true;
              if (cmd.commandType === 'teleport') {
                  rwx.userData.teleportClick = cmd.coordinates[0];
              }
          }
      }
      if (!textured) {
          return;
      }
      if (texturing != null) {
          // there are textures, we wait for them to load
          texturing.subscribe(() => {
              for (const cmd of result.create) {
                  if (cmd.commandType === 'sign') {
                      this.makeSign(rwx, cmd.text, cmd.color, cmd.bcolor);
                  }
                  if (cmd.commandType === 'picture') {
                      this.makePicture(rwx, cmd.resource);
                  }
                  if (cmd.commandType === 'media') {
                      this.makeMedia(rwx, cmd.resource);
                  }
              }
          });
      } else {
          // color, no need to wait
          for (const cmd of result.create) {
              if (cmd.commandType === 'sign') {
                  this.makeSign(rwx, cmd.text, cmd.color, cmd.bcolor);
              }
              if (cmd.commandType === 'picture') {
                  this.makePicture(rwx, cmd.resource);
              }
          }
      }
  }

  makePicture(item, url) {
      url = `https://images.weserv.nl/?url=${url}`;
      this.pictureLoader = new TextureLoader();
      this.pictureLoader.load(url, (image) => {
          image.encoding = sRGBEncoding;
          item.traverse((child) => {
              if (child instanceof Mesh) {
                  const newMaterials = [];
                  newMaterials.push(...child.material);
                  if (item.userData.taggedMaterials[pictureTag]) {
                      for (const i of item.userData.taggedMaterials[pictureTag]) {
                          newMaterials[i] = child.material[i].clone();
                          newMaterials[i].map = image;
                          newMaterials[i].needsUpdate = true;
                      }
                  }
                  child.material = newMaterials;
                  child.material.needsUpdate = true;
              }
          });
      });
  }

  createElementFromHTML(htmlString) {
      var div = document.createElement('div');
      div.innerHTML = htmlString.trim();
      return div.firstChild;
  }

  // tags: 100 = sign; 200 = picture
  makeMedia(item, url) { // Unfinished, but works
      const uid = Math.random().toString(36).substr(4, 12);
      //TODO: Clean this up.
      let videoHTML = `
      <video id="video#${uid}" crossOrigin="anonymous" playsinline style="display:none">
        <source src="${url}" type="video/mp4">
      </video>`;

      document.body.appendChild(this.createElementFromHTML(videoHTML));
      const video = document.getElementById('video#' + uid); // as HTMLVideoElement;
      video.muted = false;
      //video.play();
      let videoTexture = new VideoTexture(video);
      item.traverse((child) => {
          if (child instanceof Mesh) {
              const newMaterials = [];
              newMaterials.push(...child.material);
              if (item.userData.taggedMaterials[signTag]) {
                  for (const i of item.userData.taggedMaterials[signTag]) {
                      newMaterials[i] = child.material[i].clone();
                      newMaterials[i].color = new Color(1, 1, 1);
                      newMaterials[i].map = videoTexture;
                      newMaterials[i].map.encoding = sRGBEncoding;
                  }
              } else {
                  if (item.userData.taggedMaterials[pictureTag]) {
                      for (const i of item.userData.taggedMaterials[pictureTag]) {
                          newMaterials[i] = child.material[i].clone();
                          newMaterials[i].color = new Color(1, 1, 1);
                          newMaterials[i].map = videoTexture;
                          newMaterials[i].map.encoding = sRGBEncoding;
                      }
                  }
              }
              child.material = newMaterials;
              child.material.needsUpdate = true;
          }
      });
      let mediaPlayer = [];
      mediaPlayer.videoTexture = videoTexture;
      mediaPlayer.videoElement = video;
      item.userData.mediaPlayer = mediaPlayer;
  }

  textCanvas(text, ratio = 1, color, bcolor) {
      const canvas = document.createElement('canvas');
      if (ratio > 1.0) {
          canvas.width = 256;
          canvas.height = 256 / ratio;
      } else {
          canvas.width = 256 * ratio;
          canvas.height = 256;
      }
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = `rgb(${bcolor.r},${bcolor.g},${bcolor.b})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const fontSizes = [120, 50, 40, 30, 20, 10, 5];
      let fontIndex = 0;

      const words = text.split(/([ \n])/);
      let lines = [''];
      const maxWidth = canvas.width * 0.95;
      const maxHeight = canvas.height * 0.95;

      ctx.font = `${fontSizes[fontIndex]}px Arial`;

      // TODO: use a proper way to get line height from font size
      const fontSizeToHeightRatio = 1;
      let lineHeight = fontSizes[fontIndex] * fontSizeToHeightRatio;

      let curWordIndex = 0;

      let tentativeWord;
      let tentativeLine;

      while (curWordIndex < words.length) {
          const curLine = lines.length - 1;

          if (words[curWordIndex] === '\n') {
              tentativeWord = '';
          } else {
              tentativeWord = words[curWordIndex];
          }

          if (lines[curLine].length > 0) {
              tentativeLine = lines[curLine] + tentativeWord;
          } else {
              tentativeLine = tentativeWord;
          }

          if (words[curWordIndex] !== '\n' && ctx.measureText(tentativeLine).width <= maxWidth) {
              // TODO: use actualBoundingBoxLeft and actualBoundingBoxRight instead of .width
              // Adding word to end of line
              lines[curLine] = tentativeLine;
              curWordIndex += 1;
          } else if (ctx.measureText(tentativeWord).width <= maxWidth && lineHeight * (curLine + 1) <= maxHeight) {
              // Adding word as a new line
              lines.push(tentativeWord);
              curWordIndex += 1;
          } else if (fontIndex < fontSizes.length - 1) {
              // Retry all with smaller font size
              fontIndex += 1;
              ctx.font = `${fontSizes[fontIndex]}px Arial`;
              lineHeight = fontSizes[fontIndex] * fontSizeToHeightRatio;
              lines = [''];
              curWordIndex = 0;
          } else {
              // Min font size reached, add word as new line anyway
              lines.push(tentativeWord);
              curWordIndex += 1;
          }
      }

      lines.forEach((line, i) => {
          ctx.fillText(line, canvas.width / 2, canvas.height / 2 + i * lineHeight - (lines.length - 1) * lineHeight / 2);
      });

      return canvas;
  }
  makeSign(item, text, color, bcolor) {
      if (text == null) {
          text = item.userData.desc != null ? item.userData.desc : '';
          //text = this.description;
      }
      if (color == null) {
          color = {
              r: 255,
              g: 255,
              b: 255
          };
      }
      if (bcolor == null) {
          bcolor = {
              r: 0,
              g: 0,
              b: 255
          };
      }

      item.traverse((child) => {
          if (child instanceof Mesh) {
              const newMaterials = [];
              newMaterials.push(...child.material);
              if (item.userData.taggedMaterials[signTag]) {
                  for (const i of item.userData.taggedMaterials[signTag]) {
                      newMaterials[i] = child.material[i].clone();
                      newMaterials[i].color = new Color(1, 1, 1);
                      newMaterials[i].map = new CanvasTexture(this.textCanvas(text, newMaterials[i].userData.ratio, color, bcolor));
                      newMaterials[i].map.encoding = sRGBEncoding;
                  }
              }
              child.material = newMaterials;
              child.material.needsUpdate = true;
          }
      });
  }

  update(delta) {

    if (this.objectAppliedRotation.speed != null) {
      this.rotation.set(
        this.rotation.x += MathUtils.degToRad(this.objectAppliedRotation.speed.x * 6) * delta,
        this.rotation.y += MathUtils.degToRad(this.objectAppliedRotation.speed.y * 6) * delta,
        this.rotation.z += MathUtils.degToRad(this.objectAppliedRotation.speed.z * 6) * delta
      );
    }
    if (this.objectAppliedMove.distance != null) {
      this.position.set(
        this.position.x += this.objectAppliedMove.distance.x * 6 * delta,
        this.position.y += this.objectAppliedMove.distance.y * 6 * delta,
        this.position.z += this.objectAppliedMove.distance.z * 6 * delta);
    }
    if (this.objectAppliedScale.factor) {
      this.scale.set(this.objectAppliedScale.factor.x, this.objectAppliedScale.factor.y, this.objectAppliedScale.factor.z); // Scripted Scaling
      // console.log(this.objectAppliedScale.factor.x, this.objectAppliedScale.factor.y, this.objectAppliedScale.factor.z)
    }
    if (this.axisAlignment !== 'none') {
      this.rotation.y = Math.atan2(
        (this.scene.camera.position.x - this.position.x),
        (this.scene.camera.position.z - this.position.z));
    }
  }
  applyTexture(item, textureName, maskName, color) {
      const rwxMaterialManager = new RWXMaterialManager(this.path_textures, '.jpg', 'zip', JSZip, JSZipUtils, true, sRGBEncoding);
      const promises = [];
      item.traverse((child) => {
          if (child instanceof Mesh) {
              const newMaterials = [];
              child.material.forEach((m) => {
                  if (m.userData.rwx.material != null) {
                      const newRWXMat = m.userData.rwx.material.clone();
                      newRWXMat.texture = textureName;
                      newRWXMat.mask = maskName;
                      if (color != null) {
                          newRWXMat.color = [color.r / 255.0, color.g / 255.0, color.b / 255.0];
                      }
                      const signature = newRWXMat.getMatSignature();
                      rwxMaterialManager.addRWXMaterial(newRWXMat, signature);
                      const curMat = rwxMaterialManager.getThreeMaterialPack(signature);

                      newMaterials.push(curMat.threeMat);
                      promises.push(forkJoin(curMat.loadingPromises));
                  }
                  if (m.alphaMap != null) {
                      m.alphaMap.dispose();
                  }
                  if (m.map != null) {
                      m.map.dispose();
                  }
                  m.dispose();
              });
              child.material = newMaterials;
              child.material.needsUpdate = true;
          }
      });
      return forkJoin(promises);
  }

}
