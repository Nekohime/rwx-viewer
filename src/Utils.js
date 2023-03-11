export default class Utils {
  // Utils.modelName normalizes a model's filename into a .rwx
  //  If a given filename has no extension, or is a .zip, (or a .rwx)
  //   It will give us the model's name with the .rwx extension
  static modelName(name) {
    const hasExtensionRegex = /^.*\.[^\\]+$/i;

    name = name.toLowerCase();
    if (name.endsWith('.zip')) {
      name = name.replace(/\.[^/.]+$/, '.rwx');
    }

    // No extension?
    if (!hasExtensionRegex.test(name)) {
      name = name + '.rwx';
    }

    return name;
  }

  static clampScale(value) {
    const SCALE_MIN = 0.2;
    const SCALE_MAX = 10;
    if (value > 0) {
      return Math.max(Math.min(value, SCALE_MAX), SCALE_MIN);
    } else {
      return 1;
    }
  }
}
