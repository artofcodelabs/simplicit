export default class Component {
  ref(name) {
    return this.element.querySelector(`[data-ref="${name}"]`);
  }
}
