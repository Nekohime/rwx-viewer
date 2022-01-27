import { Group, sRGBEncoding } from 'three';
import RWXLoader from 'three-rwx-loader';
import * as JSZip from 'jszip';
import JSZipUtils from 'jszip-utils';

import BasicLights from './Lights';
import MainObject from './Object';
import Utils from '../Utils';

export default class MainScene extends Group {
  constructor(camera) {
    super();
    this.camera = camera;
    this.json = require("../scene.json");
    this.lights = new BasicLights();
    this.object = new MainObject(this);
    this.strict_mode = this.json.strict; //WIP - Makes certain behaviours more Lemuria-compliant
    this.groundLoader = new RWXLoader();
    this.path = this.json.path.base;
    this.path_models = this.path + this.json.path.models;
    this.path_textures = this.path + this.json.path.textures;
    this.ground_model = Utils.modelName(this.json.ground);

    this.groundLoader.setPath(this.path_models).setResourcePath(this.path_textures).setJSZip(JSZip, JSZipUtils).setWaitFullLoad(true).setFlatten(true).setTextureEncoding(sRGBEncoding);//.setUseBasicMaterial(true)
    this.groundLoader.load(this.ground_model, (ground) => {
      this.add(ground);
    });

    this.add(this.object);
    this.add(this.lights);
  }

  update(timeStamp) {
    this.object.update(timeStamp); // speed * timeStamp / 2500
  }
}
