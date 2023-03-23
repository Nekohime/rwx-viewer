import {
  Group, LoadingManager, Vector2, Raycaster,
} from 'three';

import Environment from './Environment';
import Object from './Object';
import Utils from '../Utils';

// const hasExtensionRegex = /^.*\.[^\\]+$/i;

export default class MainScene extends Group {
  constructor(camera) {
    super();
    // Scene JSON Setup
    this.json = require('../scene.json');
    this.path = this.json.path.base + '/';
    this.modelName = Utils.modelName(this.json.ground);

    // World Setup
    this.camera = camera;
    this.environment = new Environment();
    this.groundObject = new Object(this, this.json.ground, null, null);

    this.mainObjectName = Utils.modelName(this.json.object.model);
    this.mainObjectAction = this.json.object.action;
    this.mainObjectDescription = this.json.object.description;
    if ($_GET['model']) this.mainObjectName = Utils.modelName($_GET['model']);
    if ($_GET['desc']) this.mainObjectDescription = $_GET['desc'];
    if ($_GET['action']) this.mainObjectAction = $_GET['action'];

    this.mainObject = new Object(this,
        this.mainObjectName,
        this.mainObjectDescription,
        this.mainObjectAction);

    // Loader Setup
    this.loadingManager = new LoadingManager();
    this.materialManager = null;
    this.loader = null;

    // Raycasting Setup
    this.pointer = new Vector2();
    this.raycaster = new Raycaster();
  }

  init() {
    this.environment.init();
    this.groundObject.init();
    this.mainObject.init();
    this.add(this.environment);
    this.add(this.groundObject);
    this.add(this.mainObject);
  }

  update(delta) {
    this.raycaster.setFromCamera(this.pointer, this.camera);


    this.environment.update(delta);
    this.groundObject.update(delta); // speed * timeStamp / 2500
    this.mainObject.update(delta); // speed * timeStamp / 2500
  }
}
