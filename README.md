# RWX Viewer

Model Viewer for RenderWare Script (RWX) files with extensions from a Virtual Worlds program from the 90s!

## How to Use

* Rename or copy `./src/scene.example.json` to `./src/scene.json`, then change values.
* Install dependencies with `npm install`
* `npm run start` and have fun!
  * You don't need to restart when changing configs or code. Saving automatically refreshes the page.
  * Change `path` in `scene.json` to the folder where your assets reside
    * Models must be unzipped and placed in the `rwx` folder.
    * Zip support planned.
* Click around, move the camera scroll :)
  * Enjoy!
* An alternative config mode is available.
  * At the moment, the viewer still requires the config file to be correct.
  * You can override the config file with URL Query Parameters
    * `?model=sign1.rwx&description=hej&action=create sign bcolor%3Dblack`

## Features

* Color, Texture, Picture, Sign, Move (moves forever), Rotate, Scale, Visible, ~~Media (click to play/pause)~~, Opacity
* Ground
* Environment (Partially)
  * Lighting

Planned:

* Animated Textures, Skyboxes
* Shear

## Licenses

This project makes use of:

* [aw-action-parser (MIT)](https://github.com/Heldroe/aw-action-parser/blob/main/LICENSE)
* [three-rwx-loader (MIT)](https://github.com/Blaxar/three-rwx-loader)
* And code from [WideWorlds (MIT)!](https://github.com/Blaxar/WideWorlds)
