# RWX Viewer

For those pesky RWX Models. The ones that everyone forgot about.

## How to Use

* Click around and scroll :)
* Rename or copy `./src/{scene, object}.example.json` to `./src/{scene, object}.json` to change the Scene and Object and their properties
* `ln -s /path/to/object/path/ path`
* Install dependencies with `npm install`
* `npm run start` and have fun!
  * You don't need to restart when changing configs or code, it does it automatically (and fast!)

## Features

Present:

* Create, Color, Texture, Sign, Move, Rotate, Scale, Visible

Planned:

* Activate, Picture, Opacity\*
  * We have Scaling as Object Data but not as Action Commands, PR to `aw-action-parser` Pending
  * No Opacity in AWAP yet :-(
* Animated Textures
* Scene Lighting (Works but unfinished)
  * Point, Spot, Ambient, Hemisphere
  * Colours, Positions
* Skybox, Fog

Maybe:

* Sound, Media, Shear

Won't add:

* Name, Teleport, etc.

## Licenses

This project makes use of:

* [aw-action-parser (MIT)](https://github.com/Heldroe/aw-action-parser/blob/main/LICENSE)
* [three-rwx-loader (MIT)](https://github.com/Blaxar/three-rwx-loader)
* [three-seed (MIT)](https://github.com/edwinwebb/three-seed/blob/master/LICENSE)
* And code from [Lemuria (MIT)!](https://github.com/7185/lemuria)
