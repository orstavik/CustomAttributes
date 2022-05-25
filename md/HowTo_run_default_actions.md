# Alternative was to create default actions without framework.

alternative for default action, it should work, fancy pancy, and gives a nice use interface, but is probably a little slower as it require a promise otherwise not used.

## WhatIs: `sleep(ms)`

```javascript
async function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

//minified version, and you can inline the body of this function if you would like/are comfortable reading it.
async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
```

## HowTo: use `sleep(ms)`

```javascript
async function DoSomethingStrange() {
  console.log("here is start", "now we wait");
  await sleep(2000);
  console.log("done waiting");
}
```

Sleep is an alternative way to achieve the same outcome as setTimeout.

```javascript
async function oneWay() {
  console.log(1);
  await sleep(50);
  console.log(2);
}

function anotherWay(){
  console.log(1);
  setTimeout(function(){
    console.log(2);
  }, 50);
}
```


## WhatIs: `nextTick(cb)`

```javascript
function nextTick(cb) {
  const audio = document.createElement("audio");
  audio.onratechange = cb;
  audio.playbackRate = 2;
}
```

## HowTo: make a `nextTick()` the "sleep-way"

If you call the below function, you will just await until the next available slot in the event loop.

```javascript
async function tick() {
  return new Promise(function (resolve) {
    const audio = document.createElement("audio");
    audio.onratechange = resolve;
    audio.playbackRate = 2;
  });
}
```

## HowTo: use `await tick()` to implement default action?

```javascript
async function someFunctionThatNeedsADefaultAction(e) {
  if (e.defaultPrevented || await tick() || e.defaultPrevented)
    return;
  e.preventDefault();
  //do the default action functionality here
  console.log("this log is a default action");
}
```

Or, you can implement the check as a utility function, like so:

```javascript
async function runDA(e, action) {
  if (e.defaultPrevented)
    return;
  await tick();
  if (e.defaultPrevented)
    return;
  e.preventDefault();
  action();
}
```
