// Based on code from https://github.com/7185/lemuria/blob/dev/src/app/world/object.service.ts
import { forkJoin, Subject } from 'rxjs'
import { Group, Mesh, BufferAttribute, BufferGeometry, LoadingManager, MeshBasicMaterial, CanvasTexture, TextureLoader, sRGBEncoding, Color } from 'three';
import { MeshPhongMaterial, Object3D, MathUtils } from 'three'
import RWXLoader, { RWXMaterial, RWXMaterialManager, LightSampling, GeometrySampling, TextureMode, MaterialMode } from 'three-rwx-loader';
import { AWActionParser } from 'aw-action-parser';
import * as JSZip from 'jszip'
import JSZipUtils from 'jszip-utils'

export default class MainObject extends Group {
  constructor(scene) {
    super();
    this.json = require("../object.json")
    this.scene = scene
    this.model = this.json.model.endsWith(".rwx") ? this.json.model : this.json.model + ".rwx"
    this.description = this.json.description
    this.action = this.json.action;
    this.parser = new AWActionParser();
    this.result  = this.parser.parse(this.action);
    this.objectAppliedRotation = { speed: {x: 0, y: 0, z: 0} }
    this.objectAppliedMove = { distance: {x: 0, y: 0, z: 0} }
    this.objectAppliedScale = { factor: {x: 1, y: 1, z: 1} }
    this.objectPosition = this.json.position
    this.objectRotation = this.json.rotation
    this.objectScale = this.json.scale; this.objectScale[0] = this.resolveScalingFactor(this.objectScale[0]); this.objectScale[1] = this.resolveScalingFactor(this.objectScale[1]); this.objectScale[2] = this.resolveScalingFactor(this.objectScale[2])
    this.rwxLoader = new RWXLoader();
    this.curRWX = null

    this.path = scene.json.path.base
    this.path_models = this.path + scene.json.path.models
    this.path_textures = this.path + scene.json.path.textures

    this.rwxLoader.setPath(this.path_models).setResourcePath(this.path_textures).setJSZip(JSZip, JSZipUtils).setWaitFullLoad(true).setFlatten(true).setTextureEncoding(sRGBEncoding)//.setUseBasicMaterial(true)
    //
    this.rwxLoader.load(this.model, (rwx) => {
      //Object Data
      rwx.position.set(this.objectPosition[0], this.objectPosition[1], this.objectPosition[2])
      rwx.rotation.set(MathUtils.degToRad(this.objectRotation[0]), MathUtils.degToRad(this.objectRotation[1]), MathUtils.degToRad(this.objectRotation[2]))
      rwx.scale.set(this.objectScale[0], this.objectScale[1], this.objectScale[1]) //This is not currently implemented in any universe tech, but is here because I think it would be pretty cool.

      this.axisAlignment = rwx.userData.rwx.axisAlignment || 'none'
      this.execActions(this, rwx)
      this.add(rwx);
    });
  }

resolveScalingFactor(factor) {
  let [minScale, maxScale] = [0.1, 10];
  if (factor <= 0)
    factor = 1;
  factor = factor < 0.1 ? 0.1 : factor
  return factor
}

execActions(item, rwx) {
  var textured = false
  var texturing = null
  let result = item.result
  if (result.create != null) {
    for (const cmd of result.create) {
      if (cmd.commandType === 'texture' || cmd.commandType === 'color') {
        textured = true
      }
    }
    for (const cmd of result.create) {
      if (cmd.commandType === 'visible') {
        this.visible = cmd.value
      } else {
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
        if (!textured) {
          //sign
          if (cmd.commandType === 'sign') {
            this.makeSign(this, rwx, cmd.color, cmd.bcolor) //NYI
          }
          //picture
        }
      }
      if (cmd.commandType === 'rotate') {
        this.objectAppliedRotation.speed = cmd.speed
      }
      if (cmd.commandType === 'move') {
        this.objectAppliedMove.distance = cmd.distance,
        this.objectAppliedMove.time = cmd.time
      }
      if (cmd.commandType === 'scale') {
        this.objectAppliedScale.factor = cmd.factor //TODO: Implement properly once Scaling gets merged into aw-action-parser
      }
    }
  }

  if (textured) {
  texturing.subscribe(() => {
    for (const cmd of result.create) {
      if (cmd.commandType === 'sign') {
        this.makeSign(this, rwx, cmd.color, cmd.bcolor)
      }
      if (cmd.commandType === 'picture') {
        this.makePicture(rwx, cmd.resource)
      }
      if (cmd.commandType === 'media') {
        this.makeMedia(rwx, cmd.resource)
      }
    }
  })
}

}

makeSign(item, rwx, color, bcolor) {
    if (color == null) {
      color = {r: 255, g: 255, b: 255}
    }
    if (bcolor == null) {
      bcolor = {r: 0, g: 0, b: 255}
    }
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = `rgb(${bcolor.r},${bcolor.g},${bcolor.b})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    let txt = ''
    if (item.description != null) {
      txt = item.description
    }

    const fontSizes = [120, 50, 40, 30, 20, 10, 5]
    let fontIndex = 0

    const words = txt.split(/([ \n])/)
    let lines = ['']
    const maxWidth = canvas.width * 0.9
    const maxHeight = canvas.height * 0.9

    ctx.font = `${fontSizes[fontIndex]}px Arial`

    // TODO: use a proper way to get line height from font size
    const fontSizeToHeightRatio = 1.2
    let lineHeight = fontSizes[fontIndex] * fontSizeToHeightRatio

    let curWordIndex = 0

    let tentativeWord
    let tentativeLine

    while (curWordIndex < words.length) {
      const curLine = lines.length - 1

      if (words[curWordIndex] === '\n') {
        tentativeWord = ''
      } else {
        tentativeWord = words[curWordIndex]
      }

      if (lines[curLine].length > 0) {
        tentativeLine = lines[curLine] + tentativeWord
      } else {
        tentativeLine = tentativeWord
      }

      if (words[curWordIndex] !== '\n' && ctx.measureText(tentativeLine).width <= maxWidth) {
        // TODO: use actualBoundingBoxLeft and actualBoundingBoxRight instead of .width
        // Adding word to end of line
        lines[curLine] = tentativeLine
        curWordIndex += 1
      } else if (ctx.measureText(tentativeWord).width <= maxWidth && lineHeight * (curLine + 1) <= maxHeight) {
        // Adding word as a new line
        lines.push(tentativeWord)
        curWordIndex += 1
      } else if (fontIndex < fontSizes.length - 1) {
        // Retry all with smaller font size
        fontIndex += 1
        ctx.font = `${fontSizes[fontIndex]}px Arial`
        lineHeight = fontSizes[fontIndex] * fontSizeToHeightRatio
        lines = ['']
        curWordIndex = 0
      } else {
        // Min font size reached, add word as new line anyway
        lines.push(tentativeWord)
        curWordIndex += 1
      }
    }

    lines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, canvas.height / 2 + i * lineHeight - (lines.length - 1) * lineHeight / 2)
    })

    rwx.traverse((child) => {
      if (child instanceof Mesh) {
        const newMaterials = []
        newMaterials.push(...child.material)
        if (rwx.userData.taggedMaterials[100]) {
          for (const i of rwx.userData.taggedMaterials[100]) {
            newMaterials[i] = child.material[i].clone()
            newMaterials[i].color = new Color(1, 1, 1)
            newMaterials[i].map = new CanvasTexture(canvas)
            newMaterials[i].map.encoding = sRGBEncoding
          }
        }
        child.material = newMaterials
        child.material.needsUpdate = true
      }
    })
  }

  update(timeStamp) {
    if (this.objectAppliedRotation.speed != null) {
      this.rotation.set(
        this.rotation.x = MathUtils.degToRad(this.objectAppliedRotation.speed.x * timeStamp / 120),
        this.rotation.y = MathUtils.degToRad(this.objectAppliedRotation.speed.y * timeStamp / 120),
        this.rotation.z = MathUtils.degToRad(this.objectAppliedRotation.speed.z * timeStamp / 120))
    }
    if (this.objectAppliedMove.distance != null) {
      this.position.set(
        this.position.x = this.objectAppliedMove.distance.x * (timeStamp / 120),
        this.position.y = this.objectAppliedMove.distance.y * (timeStamp / 120),
        this.position.z = this.objectAppliedMove.distance.z * (timeStamp / 120))
    }
    if (this.objectAppliedScale.factor) {
      this.scale.set(this.objectAppliedScale.factor.x, this.objectAppliedScale.factor.y, this.objectAppliedScale.factor.z) // Scripted Scaling
      //console.log(this.objectAppliedScale.factor.x, this.objectAppliedScale.factor.y, this.objectAppliedScale.factor.z)
    }
    if (this.axisAlignment !== 'none') {
      // Couldn't find Lemuria's code for this. Or it didn't work with OrbitControls
      this.rotation.y = Math.atan2(
        (this.scene.camera.position.x - this.position.x),
        (this.scene.camera.position.z - this.position.z));
    }
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
          if (m.map != null) {
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
}
