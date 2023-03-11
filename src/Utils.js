export default class Utils {
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
