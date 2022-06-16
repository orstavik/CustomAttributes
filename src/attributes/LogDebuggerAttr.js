export class LogAttr extends Attr{
  onEvent(e){
    console.log("----- Log: " + this.value);

    console.log(e, e.currentTarget);
  }
}

export class DebuggerAttr extends Attr {
  onEvent(e) {
    console.log(e, e.currentTarget);
    debugger;
  }
}