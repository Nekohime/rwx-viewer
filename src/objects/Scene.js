import {
  Group, LoadingManager, Vector2, Raycaster,
} from 'three';

import Environment from './Environment.js';
import Object from './Object.js';
import Utils from '../Utils.js';
// const hasExtensionRegex = /^.*\.[^\\]+$/i;

const stripTrailingSlash = (str) => {
  return str.endsWith('/') ?
    str.slice(0, -1) :
    str;
};

export default class MainScene extends Group {
  constructor(camera) {
    super();
    // JSON Scene Description Setup
    this.sceneDescription = {
      'path': 'http://localhost/3d/path3d/',
      'ground': 'aw-ground1.rwx',
      'groundY': -100, // TODO
      'object': {
        'model': 'aw-unknown.rwx',
        'description': '',
        'action': '',
        'position': [0, 0, 0], // TODO: URL Override
        'rotation': [0, 0, 0], // TODO: URL Override
        'scale': [1, 1, 1], // Use create scale if you need to change in url
      },
    };
    // World Setup
    this.camera = camera;
    this.environment = new Environment();
    this.groundEnabled = true;
    if ($_GET['groundenabled'] === 'false') {
      this.groundEnabled = false;
    }

    this.path = stripTrailingSlash(this.sceneDescription.path) + '/';
    if ($_GET['path']) {
      console.log($_GET['path']);
      this.path = $_GET['path'];
    }

    if (this.groundEnabled) {
      this.groundObject = new Object(
          this, // Scene
          $_GET['ground'] ?? this.sceneDescription.ground, // Model: String
          null, // Description: String
          null, // Action: String
          [
            0,
            $_GET['groundy'] ?? this.sceneDescription.groundY,
            0,
          ], // Position: Array[int, int, int]
          [0, 0, 0], // Rotation: Array[int, int, int]
          [1, 1, 1], // Scale: Array[int, int, int]
      );
    }

    this.mainObjectName = Utils.modelName(this.sceneDescription.object.model);
    this.mainObjectAction = this.sceneDescription.object.action;
    this.mainObjectDescription = this.sceneDescription.object.description;
    if ($_GET['model']) {
      this.mainObjectName = Utils.modelName($_GET['model']);
    }
    // TODO: Find a better way to handle the + to space thing
    if ($_GET['desc']) {
      this.mainObjectDescription = $_GET['desc'].replace(/\+/g, ' ');
    }
    if ($_GET['action']) {
      this.mainObjectAction = $_GET['action'].replace(/\+/g, ' ');
    }

    this.mainObject = new Object(
        this, // Scene
        this.mainObjectName, // Model: String
        this.mainObjectDescription, // Description: String
        this.mainObjectAction, // Action: String
        this.sceneDescription.object.position, // Position: Array[int, int, int]
        this.sceneDescription.object.rotation, // Rotation: Array[int, int, int]
        this.sceneDescription.object.scale, // Scale: Array[int, int, int]
    );

    // Raycasting Setup
    this.pointer = new Vector2();
    this.raycaster = new Raycaster();
  }

  init() {
    this.environment.init();
    if (this.groundEnabled) this.groundObject.init();
    this.mainObject.init();
    this.add(this.environment);
    if (this.groundEnabled) this.add(this.groundObject);
    this.add(this.mainObject);
  }

  update(delta) {
    this.raycaster.setFromCamera(this.pointer, this.camera);


    this.environment.update(delta);
    // speed * timeStamp / 2500
    if (this.groundEnabled) this.groundObject.update(delta);
    // speed * timeStamp / 2500
    this.mainObject.update(delta);
  }
}
