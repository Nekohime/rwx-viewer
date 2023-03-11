# RWX Viewer

Model Viewer for RenderWare Script (RWX) files with extensions from a Metaverse program from the 90s!

## How to Use

* Rename or copy `./src/{scene, object}.example.json` to `./src/{scene, object}.json` to change the Scene and Object and their properties
* Change `path.base` in `scene.json` to the base folder where your assets reside
* Change `path.models` and `path.textures` to the folders where these types of assets reside in the base folder
  * Models must be unzipped.
* Install dependencies with `npm install`
* `npm run start` and have fun!
  * You don't need to restart when changing configs or code. Saving automatically refreshes the page.
* Click around, move the camera scroll :)
  * Enjoy!

## Features

* Create: Color, Texture, Picture, Sign, Move (moves forever), Rotate, Scale, Visible, Media (click to play/pause)
* Ground
* Environment (Partially)
  * Lighting

Planned:

* Interactivity, Opacity, Animated Textures, Skyboxes

Maybe:

* Shear
* Terrain
* Clouds, Fog

## Licenses

This project makes use of:

* [aw-action-parser (MIT)](https://github.com/Heldroe/aw-action-parser/blob/main/LICENSE)
* [three-rwx-loader (MIT)](https://github.com/Blaxar/three-rwx-loader)
* And code from [Lemuria (MIT)!](https://github.com/7185/lemuria)
* [rxjs (Apache 2.0)](https://github.com/ReactiveX/rxjs/blob/master/LICENSE.txt)
