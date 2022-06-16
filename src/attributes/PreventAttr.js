export class PreventAttr extends Attr {
  onEvent(e) {
    e.preventDefault();
  }
}