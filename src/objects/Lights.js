import { Group, SpotLight, PointLight, AmbientLight, HemisphereLight } from 'three';

export default class BasicLights extends Group {
  constructor() {
    super();

    const point = new PointLight(0xFFFFFF, 1, 10, 1);
    const dir = new SpotLight(0xFFFFFF, 0.8, 7, 0.8, 1, 1);
    const ambi = new AmbientLight(0xFFFFFF, 0.66);
    const hemi = new HemisphereLight(0xffffbb, 0x080820, 0.66);

    dir.position.set(5, 1, 2);
    dir.target.position.set(0, 0, 0);

    point.position.set(1, 1, 1);
    point.intensity = 0.05;

    this.add(ambi, hemi); //point, ambi, hemi, dir)
  }
}
