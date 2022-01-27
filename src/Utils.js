// eslint-disable-next-line no-unused-vars
export default class Utils {
  static modelName(name) {
    name = name.toLowerCase();
    if (name.endsWith('.zip')) {
      name = name.slice(0, -4) + '.rwx';
    } else {
      if (!name.endsWith('.rwx')) {
        name += '.rwx';
      }
    }
    return name;
  }
}
