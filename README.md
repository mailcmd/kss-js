***WORK IN PROGRESS***

# KSS-js 
## What is this?
A small web reactive lib to do small projects without depend of big frameworks. 
As the saying goes: *“Don't use a sledgehammer to kill a fly.”*

## TODO
- [ ] Array pop does not work

## DOC
Someday...

## Example

**index.html**
```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KSS WebSocket</title>
</head>

<body>
  <div id="main"></div>

  <!-- load="bundle" force load of dproxy lib before go ahead -->
  <script src="kss.js" load="bundle"></script>
  <script src="index.js"></script>
</body>
```

**index.js**
```javascript
// Event fired after KSS.init
window.addEventListener('kssready', function(e){
    console.log('rfsready event triggered!', e);
});

// Main process
(async function(){
    await KSS.loadtpl('tpls/bigtable.html');
    await KSS.include('mods/bigtable.js');
    KSS.init();
})();
```

**tpls/bigtable.html**
```html
<template kss-tpl-id="table">
  <style>
    .cell {
      display: inline-block;
      width: 40px;
      aspect-ratio: 1;
      text-align: center;
      border: 2px solid black;
      margin: 2px;
      line-height: 2.5;
      border-radius: 8px;
      corner-shape: scoop;
      padding: 3px;
      outline-offset: 1px;
    }
    .filled {
      animation-name: paint;
      animation-duration: 0.3s;
      animation-fill-mode: none;
    }

    @keyframes paint {
      0% {
      }
      100% {
        background-color: firebrick;
        color: white;
      }
    }
  </style>
  <button onclick="[$$change()]">CHANGE</button><br>
  <div :foreach="$$table" :as="row">
    <div :foreach="$$row" :as="col" class="cell {$$col.c}">
      {$$col.v} - {$$ownIndex}
    </div>
  </div>
</template>
```

**mods/bigtable.js**
```javascript
const ROWS = 12, COLS = 28;

sandbox.datas = {
    table: [...Array(ROWS).keys()].map( r =>
        [...Array(COLS).keys().map(c => [{c: '', v: r}][0])]
    ),
    change: function() {
        const r = Math.trunc(Math.random()*ROWS);
        const c = Math.trunc(Math.random()*COLS);
        this.table[r][c] = {c: 'filled', v: +(Math.random()*9).toFixed(0)};
        setTimeout(()=>{
            this.table[r][c].c = '';
        }, 500);
        setTimeout(()=>this.change(), 500);
    }
};
sandbox.tpl_id = 'table';
sandbox.name = 'main';
sandbox.target = document.querySelector('#main');
```

---- o -----

## My notes for future doc
### About the name
- KSS is pronounced 'keys' (kiːz)
- KSS means "keep small and simple"
- The name of this tool/library has nothing to do with what it does, but rather with its 
  philosophy.
- I thought about naming it FARO (F*ck Angular, React and Others), but it was too much :-P. 

### Deps
- Before doing KSS I made [DProxy](https://github.com/mailcmd/dproxy-js) (deep proxy) to make it possible for KSS to work the way I wanted 
  it to. I keep both as sepated libs because DProxy can be used in many other projects. 
- So, KSS depends only of [DProxy](https://github.com/mailcmd/dproxy-js).

### Special attributes
- :foreach
- :as
- :index
- :if
- :else-ref
- :else 
- :content

### Rest of attributes
- When the value of the attribute has any expression starting with '$$' it is processed by KISS.
- If the expresion is closed inside {...} it will be rendered as string.
- If the expresion is closed inside [...] it will be rendered as javascript code but NOT RUNNED.

### Var references
- $$ -> it is replaced by the relative context
- ## -> it is replaced by the root context


# TODO
- [x] Load templates (includes).
- [x] Make a way to create sandbox as small modules and integrate them in one APP.
- [ ] Check nested structures.
- [ ] Maybe add text nodes?
- [ ] Improve elements index and search strategy.
- [x] Resolve remove and insert into arrays and iterable objects.