// Based on code from https://github.com/7185/lemuria/blob/dev/src/app/world/object.service.ts

import {forkJoin, Subject} from 'rxjs'
import { Group, Mesh, BufferAttribute, BufferGeometry, LoadingManager, MeshBasicMaterial,
  CanvasTexture, TextureLoader, sRGBEncoding, VideoTexture } from 'three';
import {MeshPhongMaterial, Object3D} from 'three'
import BasicLights from './Lights';
import RWXLoader, { RWXMaterial, RWXMaterialManager, LightSampling, GeometrySampling, TextureMode, MaterialMode } from 'three-rwx-loader';
import { AWActionParser } from 'aw-action-parser';
import * as JSZip from 'jszip'
import JSZipUtils from 'jszip-utils'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'

export default class MainScene extends Group {


  constructor(controls) {
    super();

    const lights = new BasicLights();
    const parser = new AWActionParser();
    var name = "zjuke"
    var description = "No sign support yet"
    var action = "_create textures wood2";

    var result = parser.parse(action);
    let rwxLoader = new RWXLoader();
    let groundLoader = new RWXLoader();

    groundLoader.setPath('./path/rwx').setResourcePath('./path/textures').setJSZip(JSZip, JSZipUtils).setWaitFullLoad(true).setFlatten(true).setUseBasicMaterial(true)
    groundLoader.load("ground1.rwx", (ground) => {
      this.add(ground)
    })
    rwxLoader.setPath('./path/rwx').setResourcePath('./path/textures').setJSZip(JSZip, JSZipUtils).setWaitFullLoad(true).setFlatten(true).setUseBasicMaterial(true)
    rwxLoader.load(name + ".rwx", (rwx) => {

      //controls.attach(rwx) //for TransformControls
      var textured = false
      var texturing = null
      if (result.create != null) {
        for (const cmd of result.create) {
          if (cmd.commandType === 'texture' || cmd.commandType === 'color') {
            textured = true
          }
        }
        for (const cmd of result.create) {
          if (cmd.commandType === 'color') {
            texturing = this.applyTexture(rwx, null, null, cmd.color)
          } else {
            if (cmd.commandType === 'texture') {
              if (cmd.texture) {
                cmd.texture = cmd.texture.lastIndexOf('.') !== -1 ? cmd.texture.substring(0, cmd.texture.lastIndexOf('.')) : cmd.texture
                if (cmd.mask) {
                  cmd.mask = cmd.mask.lastIndexOf('.') !== -1 ? cmd.mask.substring(0, cmd.mask.lastIndexOf('.')) : cmd.mask
                }
              }
              texturing = this.applyTexture(rwx, cmd.texture, cmd.mask)
            }
          }
        }
      }
      this.add(rwx);
    });
    this.add(lights);
  }

  applyTexture(item, textureName, maskName, color) {
    const rwxMaterialManager = new RWXMaterialManager("./path/textures", 'jpg', 'zip', JSZip, JSZipUtils, true, sRGBEncoding);
    const promises = []
    item.traverse((child) => {



      if (child instanceof Mesh) {
        const newMaterials = []
        child.material.forEach((m) => {

          if (m.userData.rwx.material != null) {

            const newRWXMat = m.userData.rwx.material.clone()
            newRWXMat.texture = textureName
            newRWXMat.mask = maskName
            if (color != null) {
              newRWXMat.color = [color.r / 255.0, color.g / 255.0, color.b / 255.0]
            }
            rwxMaterialManager.currentRWXMaterial = newRWXMat
            const curMat = rwxMaterialManager.getCurrentMaterial()
            newMaterials.push(curMat.threeMat)
            promises.push(forkJoin(curMat.loadingPromises))
          }
          if (m.alphaMap != null) {
            m.alphaMap.dispose()
          }
          if (m.map !=null) {
            m.map.dispose()
          }
          m.dispose()
        })
        child.material = newMaterials
        child.material.needsUpdate = true
      }
    })
    rwxMaterialManager.resetCurrentMaterialList()
    return forkJoin(promises)
  }
  update(timeStamp) {
    //this.rotation.y = timeStamp / 2500; //Unnecessary with OrbitControls
  }
}
