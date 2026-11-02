/* v: 0.1.4 */

Object.defineProperty(String.prototype, 'capitalize', {
  value: function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  },
  enumerable: false
});

function DProxy(obj, callback) {
    const _this = this;
    
    const is_numeric = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    const _set = function(fullKey, val) {
        const arrKeys = fullKey.slice(1).split('.');
        let [key, keys] = [arrKeys.pop(), arrKeys];
        const obj = keys.reduce((o, k) => {
            return o[k];
        }, this);
        obj[key] = val;
    };

    const _get = function(fullKey) {
        if (fullKey == '') return this;
        if (fullKey == '.') return this;
        const arrKeys = fullKey.slice(1).split(/[\.<]/);
        let [key, keys] = [arrKeys.pop(), arrKeys];
        const objs = [];
        const obj = keys.reduce((o, k) => {
            if (k === '') return objs.pop();
            objs.push(o);
            return o ? o[k] : undefined;
        }, this);
        try {
            return obj[key];
        } catch(e) {
            console.warn(`KSS_ERROR: Can not get '${fullKey}' value!`)
        }
    };

    const merge = function(obj, pobj, robj, bkey = '') {
        pobj = pobj ?? this.p;
        robj = robj ?? this.r;
        for (let key in obj) {
            if (robj == this.r) pobj[key]; // force a get
            if (robj[key] === undefined) continue;
            if (typeof obj[key] == 'object') {
                merge(obj[key], pobj[key], robj[key], bkey+'.'+key);
            } else {
                _this.fullKey = bkey;
                pobj[key] = obj[key];
            }
        }
    };
    
    // Generic proxy handler
    const handler = {
        get(obj, key, _) {
            // return the background real object
            if (obj == _this.mainObject && key == '_object') {
                return _this.mainObject;
            }
            // Special function set
            if (obj == _this.mainObject && key == 'set') {
                return _set.bind(_this.mainProxy);
            }
            if (obj == _this.mainObject && key == 'get') {
                return _get.bind(_this.mainProxy);
            }
            // Special function merge
            if (obj == _this.mainObject && key == 'merge') {
                return merge.bind({p: _this.mainProxy, r: _this.mainObject});
            }
            // Ask if it is a Proxy, return always true
            if (key == '__isProxy') return true;
            
            // clear fullKey because is the start of the chain of keys
            if (obj == _this.mainObject) _this.fullKey = '';
            
            // simulate array
            if (Object.getOwnPropertyNames(Array.prototype).includes(key)
                && Object.keys(obj).every(n=>is_numeric)) {
                return Object.values(obj)[key];
            }

            if (key == 'ownIndex') return obj[key];

            // it is an object so I return a Proxy
            if (typeof(obj[key]) == 'object') {
                _this.fullKey += '.'+key;
                Object.defineProperty(obj[key], 'ownIndex', {value: key, enumerable: false});
                return new Proxy(obj[key], handler);
            }
            
            // clear fullKey because is the end of the chain of keys
            _this.fullKey = '';

            // default action
            if (obj[key] == undefined) return undefined;
            if (typeof(obj[key]) == 'function') return obj[key];
            
            const value = obj[key];
            const type = typeof(obj[key]);
            const Constructor = eval(type.capitalize());
            const tmp_obj = new Constructor(obj[key]);
            return Object.defineProperty(tmp_obj, 'ownIndex', {value: key, enumerable: false});
            
            // return obj[key];
        },
        set(obj, key, val) {
            if (typeof val == 'object') {
                merge(val, _this.mainProxy.get(_this.fullKey+'.'+key), obj[key], _this.fullKey);
            } else {
                obj[key] = val;
                _this.callback(_this.fullKey+'.'+key, val, obj);
            }
        }
    };
    
    _this.callback = callback;
    _this.fullKey = '';
    _this.mainObject = obj;
    _this.mainProxy = new Proxy(obj, handler);
    return _this.mainProxy;
}


