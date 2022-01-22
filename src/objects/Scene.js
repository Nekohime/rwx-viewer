import * as JSZip from 'jszip'
import JSZipUtils from 'jszip-utils'
import RWXLoader from 'three-rwx-loader';
import { Group, Mesh, BufferAttribute, BufferGeometry, LoadingManager, MeshBasicMaterial, CanvasTexture, TextureLoader, sRGBEncoding } from 'three';
import { MeshPhongMaterial, Object3D, AmbientLight } from 'three'
import BasicLights from './Lights';
import MainObject from './Object';

export default class MainScene extends Group {
  constructor(camera) {
    super();
    this.camera = camera
    this.json = require("../scene.json")
    this.lights = new BasicLights(this);
    this.object = new MainObject(this);

    this.groundLoader = new RWXLoader();
    this.path = this.json.path.base
    this.path_models = this.path + this.json.path.models
    this.path_textures = this.path + this.json.path.textures
    this.ground_model = this.json.ground.endsWith(".rwx") ? this.json.ground : this.json.ground + ".rwx"

    this.groundLoader.setPath(this.path_models).setResourcePath(this.path_textures).setJSZip(JSZip, JSZipUtils).setWaitFullLoad(true).setFlatten(true).setUseBasicMaterial(true).setTextureEncoding(sRGBEncoding)
    this.groundLoader.load(this.ground_model, (ground) => {
      this.add(ground)
    })

    this.add(this.object);
    this.add(this.lights);
  }

  update(timeStamp) {
    this.object.update(timeStamp) // speed * timeStamp / 2500
  }
}
