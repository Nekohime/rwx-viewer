import {
  Group,
  AmbientLight,
} from 'three';

export default class Environment extends Group {
  constructor() {
    super();
    // this.point = new PointLight(0xFFFFFF, 1, 10, 1);
    // this.point.position.set(1, 1, 1);
    // this.point.intensity = 0.05;
    // this.dir = new SpotLight(0xFFEEDD);
    // dir.position.set(5, 1, 2);
    // this.dir.position.set(0, 0, 1);
    // dir.target.position.set(0, 0, 0);
    this.ambi = new AmbientLight(0xFFFFFF);
    // const hemi = new HemisphereLight(0xffffbb, 0x080820, 0.66);


    // this.cloudParticles = [];
    // this.flash = null;


    // this.add(ambi); //point, ambi, hemi, dir)
  }


  // TODO: CC0 Cloud asset
  init() {
    /*
      this.flash = new PointLight(0x062d89, 30, 500, 1.7);
      this.flash.position.set(200,300,100);
      this.add(this.flash);

      let that = this;
      let texLoader = new TextureLoader();
      texLoader.load("src/smoke.png", function(texture) {

      let cloudGeo = new PlaneGeometry(500, 500);
      let cloudMaterial = new MeshLambertMaterial({ //new MeshLambertMaterial({
      map: texture,
      transparent: true,

      //This fixes that annoying bug with the weird transparency overlaps
      depthWrite: false
      });

      for (let p = 0; p < 25; p++) {
      let cloud = new Mesh(cloudGeo, cloudMaterial);
      cloud.position.set(
      Math.random() * 800 - 400,
      500,
      Math.random() * 500 - 450
      );
      cloud.rotation.x = 1.16;
      cloud.rotation.y = -0.12;
      cloud.rotation.z = Math.random() * 360;
      cloud.material.opacity = 0.6;

      that.cloudParticles.push(cloud);


      }

      that.cloudParticles.forEach(function(cloud) {
      //console.log(cloud)
      that.add(cloud)
      })
      });
    */

    this.add(this.ambi);
  }
  update(delta) {
    /*
        if (Math.random() > 0.99 || this.flash.power > 100) {
        if (this.flash.power < 100) {
        this.flash.position.set(Math.random()*400,
        300+Math.random()*200,
        100);
        }

        this.flash.power = 50 + Math.random() * 500;
        }

        this.cloudParticles.forEach(p => {
        p.rotation.z += delta / 80;
        });
        */

  }
}
