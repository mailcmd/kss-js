////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

document.currentScript.async = false;

Object.defineProperty(Array.prototype, 'remove', {
    value: function(i) {return this.splice(i, 1)},
    enumerable: false
});

////////////////////////////////////////////////////////////////////////////////////////

function KSS(object, root_element) {
    const _this = this;
    const VARKEY_REGEX_RELATIVE = /\$\$([a-z0-9_\.<]+)/ig;
    const VARKEY_REGEX_ABSOLUTE = /\#\#([a-z0-9_\.<]+)/ig;

    ////////////////////////////////////////////////////////////////////////////////////////
    // GETs
    ////////////////////////////////////////////////////////////////////////////////////////
    const get_foreachs = function(elem) {
        return elem.querySelectorAll(':scope [\\:foreach]:not(template):not(template):not(kss-sandbox):not(:scope kss-sandbox *)');
    };
    
    const get_ifs = function(elem) {
        return elem.querySelectorAll(':scope [\\:if]:not(template):not(template):not(kss-sandbox):not(:scope kss-sandbox *)');
    };
    
    const get_attributes = function(elem) {
        return [elem, ...elem.querySelectorAll(':scope *:not(template):not(kss-sandbox):not(:scope kss-sandbox *)')].map( el => {
            return Object.values(el.attributes)
                .filter(a => {
                    return (
                        a.localName[0] != ':' &&
                        a.value.match(/[\{|\[](.*(\$\$|\#\#).+?)[\}|\]]/)
                    );
                })
                .map(a => [{attr: a.localName, elem: el, value: a.value}][0]);
        }).flat();
    };
    
    const get_texts = function(elem) {
        return elem.querySelectorAll(':scope text:not(:scope kss-sandbox *)');
    };
    
    const get_text_nodes = function(elem) {
        const children = [];
        const walker = document.createTreeWalker(elem, NodeFilter.SHOW_TEXT);
        while(walker.nextNode()) {
            const node = walker.currentNode;
            if (node.textContent.trim().length == 0)
                continue;
            if (!node.textContent.match(/\{(.+?)\}/g))
                continue;
            if (node.parentElement.tagName == 'STYLE')
                continue;
            children.push(node);
        }
        return children;
    };

    const get_bounds = function(elem) {
        return elem.querySelectorAll(':not(template) [\\:bind]');
    };
    
    
    ////////////////////////////////////////////////////////////////////////////////////////
    // Tools
    ////////////////////////////////////////////////////////////////////////////////////////
    const log = console.log;

    const kss_push = function(object, key, item) {
        object[key] = object[key] ?? [];
        if (
            !object[key].some( o => o.type == item.type && o.elem == item.elem && o.expr == item.expr)
        ) object[key].push(item);
    };
    
    /*
    expr: "...{kss_expr}...{kss_expr}..."
    kss_expr:
        - "5 + $$value + 1"
        - "'hola' + $$name"
    */
    const kss_eval = function(expr, context, context_alias = null) {
        expr = context_alias
            ? expr.replace(new RegExp('\\$\\$'+context_alias, 'g'), '##'+context.slice(1)+'')
            : expr;

        // extract every kss_expr
        const arr_expr = expr.matchAll(/\{(.+?)\}/g).toArray();
            
        // make the replace in every expr with the real value
        const result = arr_expr.reduce((acc, [full, exp]) => {
            exp = exp
                .replaceAll(VARKEY_REGEX_RELATIVE, (_1, m) => {
                    const value = deep_proxy.get(context+'.'+m);
                    if (typeof value.valueOf() == 'string') {
                        return "'"+value.valueOf()+"'";
                    } else {
                        return value.valueOf();
                   }
                })
                .replaceAll(VARKEY_REGEX_ABSOLUTE, (_1, m) => {
                    const value = deep_proxy.get('.'+m);
                    if (typeof value.valueOf() == 'string') {
                        return "'"+value.valueOf()+"'";
                    } else {
                        return value.valueOf();
                  }
                });
            try {
                exp = exp == '' ? exp : eval(exp);
            } catch(e) {
                // console.log(e)
            }
            return acc.replace(full, exp);
        }, expr);
    
        return result;
    };

    const kss_run = function(expr, context) {
        expr = expr
            .match(/\[(.+)\]/)[1]
            .replace(/\$\$/g, '')
            .replace(/\#\#/g, 'this.');
            
        const fun = new Function('context', `
            with (context) {
                ${expr};
            }
        `);
        fun.bind(_this.deep_proxy)(_this.deep_proxy.get(context));
    };
    ////////////////////////////////////////////////////////////////////////////////////////
    // Processors
    ////////////////////////////////////////////////////////////////////////////////////////
    const process_foreach = function(elem, parent, context) {
        let loopvar = elem.getAttribute(':foreach');
        if (parent.context_alias) {
            const re = new RegExp('\\$\\$'+parent.context_alias, 'g');
            loopvar = loopvar.replace(re, '##'+context.slice(1));
        }
        loopvar = loopvar
            .replace(/\$\$/g, context+'.')
            .replace(/\#\#/g, '.');
        const tpl = document.createElement('TEMPLATE');
        tpl.setAttribute(':as', elem.getAttribute(':as') ?? 'item');
        tpl.setAttribute(':foreach', loopvar);
        elem.removeAttribute(':foreach');
        elem.removeAttribute(':as');
        const force_key = elem.getAttribute(':force-key');
        elem.removeAttribute(':force-key');
        tpl.innerHTML = elem.outerHTML;
        elem.before(tpl);
        elem.remove();
        kss_push(_this.renderizable_objects, loopvar, {
            type: 'foreach',
            elem: tpl,
            parent: parent,
            context: context,
            item: tpl.getAttribute(':as')
        });
        if (force_key) {
            kss_push(_this.renderizable_objects, force_key, {
                type: 'foreach',
                elem: tpl,
                parent: parent,
                context: context,
                item: tpl.getAttribute(':as')
            });
        }
    };

    const process_if = function(elem, parent, context) {
        let expr = elem.getAttribute(':if');
        expr = expr.match(/\{(.+\})/) ? expr : '{'+expr.trim()+'}';

        const keys = [];
        expr.matchAll(/\$\$(.+?)( |\(|\)|$)/g).toArray().forEach( ([_, m]) => {
            const key = context+'.'+m;
            keys.push(key);
        });
        expr.matchAll(/\#\#(.+?)( |\(|\)|$)/g).toArray().forEach( ([_, m]) => {
            const key = '.'+m;
            keys.push(key);
        });
        
        const else_ref = elem.getAttribute(':else-ref');
        const if_tpl = document.createElement('TEMPLATE');
        if_tpl.setAttribute(':if', expr);
        elem.removeAttribute(':if');
        elem.removeAttribute(':else-ref');
        const force_key = elem.getAttribute(':force-key');
        elem.removeAttribute(':force-key');
        if_tpl.innerHTML = elem.outerHTML;
        elem.before(if_tpl);
        keys.forEach( key => {
            kss_push(_this.renderizable_objects, key, {
                type: 'if',
                elem: if_tpl,
                parent: parent,
                context: context,
                value: 'true'
            });
        });
        if (force_key) {
            kss_push(_this.renderizable_objects, force_key, {
                type: 'if',
                elem: if_tpl,
                parent: parent,
                context: context,
                value: 'true'
            });
        }
        elem.remove();
        
        if (else_ref) {
            elem = document.querySelector('[\\:else="'+else_ref+'"]');
            const else_tpl = document.createElement('TEMPLATE');
            else_tpl.setAttribute(':if', '!('+expr+')');
            elem.removeAttribute(':else');
            else_tpl.innerHTML = elem.outerHTML;
            elem.before(else_tpl);
            keys.forEach( key => {
                kss_push(_this.renderizable_objects, key, {
                    type: 'if',
                    elem: else_tpl,
                    parent: parent,
                    context: context,
                    value: 'false'
                });
            });
            if (force_key) {
                kss_push(_this.renderizable_objects, force_key, {
                    type: 'if',
                    elem: else_tpl,
                    parent: parent,
                    context: context,
                    value: 'false'
                });
            }
            elem.remove();
        }
        
    };
    
    const process_attr = function(attr, parent, context) {
        const keys = new Set();
        attr.value.matchAll(VARKEY_REGEX_RELATIVE).toArray().forEach( ([_, m]) => {
            const len = parent.context_alias?.length ?? 0;
            const key = m.slice(0, len) != parent.context_alias
                ? context+'.'+m
                : context + m.slice(len);
            keys.add(key);
        });
        attr.value.matchAll(VARKEY_REGEX_ABSOLUTE).toArray().forEach( ([_, m]) => {
            const key = '.'+m;
            keys.add(key);
        });
        
        [...keys].forEach( key => {
            kss_push(_this.renderizable_objects, key, {
                type: 'attr',
                elem: attr.elem,
                attr: attr.attr,
                expr: attr.value,
                parent: parent,
                context: context
            });
        });
        const force_key = attr.elem.getAttribute(':force-key');
        if (force_key) {
            [...keys].forEach( key => {
                kss_push(_this.renderizable_objects, force_key, {
                    type: 'attr',
                    elem: attr.elem,
                    attr: attr.attr,
                    expr: attr.value,
                    parent: parent,
                    context: context
                });
            });
        }
    };
    
    const process_text = function(elem, parent, context) {
        let expr = elem.getAttribute(':content');
        elem.removeAttribute(':content');
        expr = expr.match(/\{(.+\})/) ? expr : '{'+expr.trim()+'}';

        const keys = new Set();
        expr.matchAll(VARKEY_REGEX_RELATIVE).toArray().forEach( ([_, m]) => {
            const len = parent.context_alias?.length ?? 0;
            const key = m.slice(0, len) != parent.context_alias
                ? context+'.'+m
                : context + m.slice(len);
            keys.add(key);
        });
        expr.matchAll(VARKEY_REGEX_ABSOLUTE).toArray().forEach( ([_, m]) => {
            const key = '.'+m;
            keys.add(key);
        });
        [...keys].forEach( key => {
            kss_push(_this.renderizable_objects, key, {
                type: 'text',
                elem: elem,
                parent: parent,
                context: context,
                expr: expr
            });
        });
        const force_key = elem.getAttribute(':force-key');
        if (force_key) {
            [...keys].forEach( key => {
                kss_push(_this.renderizable_objects, force_key, {
                    type: 'text',
                    elem: elem,
                    parent: parent,
                    context: context,
                    expr: expr
                });
            });
        }
    };
    
    const process_bind = function(elem, parent, context) {
        let expr = elem.getAttribute(':bind');
        const keys = new Set();
        expr.matchAll(VARKEY_REGEX_RELATIVE).toArray().forEach( ([_, m]) => {
            const len = parent.context_alias?.length ?? 0;
            const key = m.slice(0, len) != parent.context_alias
                ? context+'.'+m
                : context + m.slice(len);
            keys.add(key);
        });
        expr.matchAll(VARKEY_REGEX_ABSOLUTE).toArray().forEach( ([_, m]) => {
            const key = '.'+m;
            keys.add(key);
        });
        [...keys].forEach( key => {
            kss_push(_this.renderizable_objects, key, {
                type: 'bind',
                elem: elem,
                parent: parent,
                context: context,
                expr: expr
            });
        });
    };
    
    ////////////////////////////////////////////////////////////////////////////////////////
    // renderers
    ////////////////////////////////////////////////////////////////////////////////////////
    const render_foreach = function(foreach_obj) {
        const loopvar = foreach_obj.elem.getAttribute(':foreach');
        const iterator_key = loopvar
            .replace(/\$\$/g, foreach_obj.context+'.')
            .replace(/\#\#/g, '.');
        const iterator = deep_proxy.get(iterator_key);
        try {
            foreach_obj.elem.parentElement.querySelectorAll('[foreach_row="'+loopvar+'"]')
                .forEach( e => e.remove() );
            for (const i in iterator) {
                const item = iterator[i];
                const el = foreach_obj.elem.content.children[0].cloneNode(true);
                el.context_alias = foreach_obj.item;
                el.setAttribute('foreach_row', loopvar);
                el.setAttribute('foreach_row_index', i);
                foreach_obj.elem.parentNode.lastElementChild.after(el);
                refresh(el, iterator_key+'.'+i);
            }
        } catch(e) {
            console.warn(`KSS_ERROR: Problems at rendering foreach '${loopvar}' (${e.message})`);
        }
    };
    
    const render_if = function(if_obj) {
        const expr = if_obj.elem.getAttribute(':if');
        const result = eval(kss_eval(expr, if_obj.context));
        
        if (![true, false].includes(result)) {
            console.warn(
                'KSS_ERROR: Bad IF expression, ' +
                `must to eval to 'true' or 'false' (${expr}) -> ${result}`
            );
            return;
        }
        if (result) {
            if (!if_obj.elem.nextElementSibling ||
                if_obj.elem.nextElementSibling.getAttribute(':if') != if_obj.value) {
                const el = if_obj.elem.content.children[0].cloneNode(true);
                el.setAttribute(':if', if_obj.value);
                el.context_alias = if_obj.parent.context_alias;
                if_obj.elem.after(el);
                refresh(el, if_obj.context);
            }
        } else {
            if (if_obj.elem?.nextElementSibling.getAttribute(':if') == if_obj.value)
                if_obj.elem.nextElementSibling.remove();
        }
    };
    
    const render_attr = function(attr_obj) {
        if (attr_obj.expr.match(/\[(.+)\]/)) {
            attr_obj.elem.kss_runner = attr_obj.elem.kss_runner ?? {};
            attr_obj.elem.kss_runner[attr_obj.attr] = {
                context: attr_obj.context,
                expr: attr_obj.expr,
                kss: _this
            };
            attr_obj.elem.setAttribute(attr_obj.attr, "KSS.run('"+attr_obj.attr+"', this)");
        } else {
            const value = kss_eval(
                attr_obj.expr,
                attr_obj.context,
                attr_obj.parent.context_alias
            );
            attr_obj.elem.setAttribute(attr_obj.attr, value);
        }
    };

    const render_text = function(text_obj) {
        text_obj.elem.innerHTML = kss_eval(
            text_obj.expr,
            text_obj.context,
            text_obj.parent.context_alias
        );
    };

    const render_bind = function(bind_obj) {
        if (!bind_obj.elem.oninput) {
            const key = bind_obj.expr
                .replace('$$', '.'+bind_obj.context)
                .replace('##', '.');
            bind_obj.elem.oninput = bind_obj.elem.onchange = function() {
                _this.set(key, bind_obj.elem.value);
                return true;
            };
        }
        bind_obj.elem.value = kss_eval(
            '{'+bind_obj.expr.trim()+'}',
            bind_obj.context,
            bind_obj.parent.context_alias
        );
    };

    ////////////////////////////////////////////////////////////////////////////////////////
    // Main processes
    ////////////////////////////////////////////////////////////////////////////////////////
    /*
    1- Process foreach (inside process if before)
    2- Process if (inside process foreach before)
    3- Process attributes (skip templates)
    3- Process nodes (skip templates)
    */
    
    const refresh = function(elem, context) {
        process(elem, context);
        render_by_elem(elem);
    };
    
    const process = function(elem, context) {
        get_text_nodes(elem).forEach(n => {
            const t = document.createElement('text');
            t.setAttribute(':content', n.textContent);
            n.replaceWith(t);
        });
        get_foreachs(elem).forEach(fe => process_foreach(fe, elem, context));
        get_ifs(elem).forEach(i => process_if(i, elem, context));
        get_attributes(elem).forEach(a => process_attr(a, elem, context));
        get_texts(elem).forEach(t => process_text(t, elem, context));
        get_bounds(elem).forEach(b => process_bind(b, elem, context));
    };
    
    const render_by_elem = function(elem = null, key = null) {
        const rendered_objects = [];
        const removables = [];
        const renderizable_objects = key
            ? {[key]: _this.renderizable_objects[key]}
            : _this.renderizable_objects;
        for (const k in renderizable_objects) {
            (_this.renderizable_objects[k]??[]).reverse().forEach( (obj,i) => {
                if (!obj.elem.isConnected) {
                    _this.renderizable_objects[k].remove(i);
                    return;
                }
                if (elem && obj.parent != elem) return;
                
                if (rendered_objects.some(
                    o => o.type == obj.type && o.elem == obj.elem && o.expr == obj.expr)
                ) return;
                
                if (obj.type == 'foreach') render_foreach(obj);
                if (obj.type == 'if') render_if(obj);
                if (obj.type == 'attr') render_attr(obj);
                if (obj.type == 'text') render_text(obj);
                if (obj.type == 'bind') render_bind(obj);
                rendered_objects.push(obj);
            });
        }
    };
    
    const render_by_key = function(key, extra) {
        if (extra == '__removed__') {
            key = key.split('.').slice(0, -1).join('.');
        } else if (extra == '__insert__') {
            key = key.split('.').slice(0, -1).join('.');
        } else if (extra == '__push__') {
            key = key.split('.').slice(0, -1).join('.');
        }
        // console.log('KSS_UPDATE', key, _this.get(key));
        if (_this.renderizable_objects[key])
            render_by_elem(null, key);
    };
    
    ///////////////////////////////////////////////////////////////////////////////////////
    this.init = function(force = false) {
        if (!this.sandboxed_element.isConnected) return;
        if (!this.initialized || force) {
            refresh(this.sandboxed_element, '');
            if (this.sandboxed_element.oninit) {
                this.sandboxed_element.oninit.bind(this.deep_proxy)();
            }
            this.initialized = true;
        }
    };
    
    this.append_to = function(el) {
        el.append(this.sandboxed_element);
        this.init(true);
    };

    this.sandboxed_element = root_element;
    this.renderizable_objects = {};
    
    const deep_proxy = new DProxy(object, render_by_key);
    this.merge = deep_proxy.merge;
    this.set = deep_proxy.set;
    this.upd = deep_proxy.upd;
    this.get = deep_proxy.get;
    this.rmv = deep_proxy.rmv;
    this.ins = deep_proxy.ins;
    this.deep_proxy = deep_proxy;
    this.render_key = render_by_key;
    this.render_elem = render_by_elem;
    this.run = kss_run;
    this.initialized = false;
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Statics props and methods
///////////////////////////////////////////////////////////////////////////////////////////////
KSS.sandboxes = {};

KSS.fetch = async function(url, result_type = 'text') {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`KSS_ERROR: Response status: ${response.status}`);
        }

        const result = await response[result_type]();
        return result;

    } catch (error) {
        console.error('KSS_ERROR: '+error.message);
        return false;
    }
};

KSS.loadtpl = async function(template, name = undefined) {
    const html = await KSS.fetch(template);
    const tmp = document.createElement('span');
    tmp.innerHTML = html;
    const tag = tmp.querySelector('*').localName.toLowerCase();
    if (!name && tag != 'template') {
        console.warn(`KSS_ERROR: Bad template content ('${template}'), please add 'name' `+
                     `to raw html content or use <template ...></template> to close content`);
        return false;
    }
    if (tag == 'template') {
        document.body.append(tmp.querySelector('template'));
    } else {
        const tpl = document.createElement('template');
        tpl.innerHTML = tmp.innerHTML;
        tpl.setAttribute('kss-tpl-id', name);
        document.body.append(tpl);
    }
    return true;
};

KSS.include = async function(module, config = {}) {
    if (module.slice(-3) != '.js') module += '.js';
    try {
        const js = `
        (function(config){
        const sandbox = {};
        ${await KSS.fetch(module)}
        return sandbox;
        })(config);
        `;
        const mod = eval(js);
        // if we need to load templates before, we do it
        const preload_tpls = mod.preload_tpls ?? [];
        for (let tpl of preload_tpls) {
            if ((/\//).test(tpl)) {
                await KSS.loadtpl(tpl);
            } else {
                tpl = module.split('/').slice(0, -1).join('/') + '/' + tpl;    
                await KSS.loadtpl(tpl);
            }
        }
        // Now we can add the sandbox
        KSS.add_sandbox(mod.name, mod.datas, {
            html: mod.html,
            tpl_id: mod.tpl_id,
            target: mod.target,
            oninit: mod.oninit
        });
    } catch(e) {
        console.warn(`KSS_ERROR: Problems including module '${module}' (${e.message})`);
    }
};

KSS.loadmod = KSS.include;

KSS.add_sandbox = function(name, data_object, elem) {
    let root_elem;
    if (typeof(elem) == 'string') {
        root_elem = document.querySelector('[kss-id="'+elem+'"]');
    } else if (elem?.tpl_id) {
        const tpl = document.querySelector('[kss-tpl-id="'+elem.tpl_id+'"]');
        if (!tpl) {
            console.warn(`KSS_ERROR: Template '${elem.tpl_id}' does not exists or is not loaded!`, elem);
            return;
        }
        root_elem = document.createElement('kss-sandbox');
        root_elem.setAttribute('kss-id', name);
        root_elem.append(tpl.cloneNode(true).content);
        if (elem.target) elem.target.append(root_elem);
    } else if (elem?.html) {
        root_elem = document.createElement('kss-sandbox');
        root_elem.setAttribute('kss-id', name);
        root_elem.innerHTML = elem.html;
        if (elem.target) elem.target.append(root_elem);
    } else {
        root_elem = elem;
    }

    // if (!root_elem.isConnected || !root_elem?.querySelectorAll) {
    //     console.warn(`KSS_ERROR: Sandbox '${name}': '${elem}' is not a reference to a valid DOM element!`, elem);
    //     return;
    // }
    root_elem.oninit = elem.oninit;
    
    KSS.sandboxes[name] = {
        sb: new KSS(data_object, root_elem),
        name: name,
        data_object: data_object,
        elem: root_elem
    };
    KSS.sandboxes[name].sb.init();
};

KSS.run = function(attr, elem) {
    const runner = elem.kss_runner[attr];
    runner.kss.run(runner.expr, runner.context);
};

KSS.get = function(name) {
    return KSS.sandboxes[name];
};

KSS.getSandbox = function(name) {
    if (KSS.sandboxes[name]) return KSS.sandboxes[name].sb;
    console.warn(`KSS_ERROR: Does not exists a sandbox named '${name}'!`);
};

KSS.init = function() {
    Object.values(KSS.sandboxes).forEach( c => c.sb.init() );
    const kssReadyEvent = new CustomEvent('kssready', { detail: { ksssandboxes: KSS.sandboxes } });
    window.dispatchEvent(kssReadyEvent);
};

KSS.ready = KSS.init;

///////////////////////////////////////////////////////////////////////////////////////////////
// Statics for websocket 
///////////////////////////////////////////////////////////////////////////////////////////////

KSS.connection = null;

KSS.connect = function(config) {
    /////////////////////////////////////////////////////////////////////////////////
    // Internals 
    /////////////////////////////////////////////////////////////////////////////////
    const onerror = function(error) {
        console.error('KSS Websocket error!', error);
        if (conn.config.reconnect !== false) check_status();
    };

    const onclose = function(msg) {
        console.warn('KSS Websocket closed!');
        const kssWSCloseEvent = new CustomEvent('ksswebsocketclosed',
                                                 { detail: { kssConnection: conn } });
        window.dispatchEvent(kssWSCloseEvent);
        if (conn.config.reconnect !== false) check_status();
    };

    const check_status = function() {
        if (conn.socket.readyState == WebSocket.CLOSED
            || conn.socket.readyState === 0) {
            console.warn('KSS Websocket not connected!');
            if (conn.config.reconnect !== false)
                setTimeout(connect, conn.config.reconnect_delay ?? 1000);
            return false;
        } else if (conn.socket.readyState == WebSocket.CONNECTING) {
            console.log('KSS EventSource: connecting...');
            return false;
        }
        clearTimeout(to);
        console.log('KSS Websocket: connected!');
        const kssWSReadyEvent = new CustomEvent('ksswebsocketready',
                                                 { detail: { kssConnection: conn} });
        window.dispatchEvent(kssWSReadyEvent);
        conn.socket.onerror = onerror;
        conn.socket.onmessage = onmessage;
        conn.socket.onclose = onclose;
        return true;
    };
    
    const send = function(message, callback = function(){}) {
        if (message.msg_id) {
            conn.callbacks[message.msg_id] = callback;
        }
        message = typeof message != 'string' ? JSON.stringify(message) : message;
        conn.socket.send(message);
    };
    
    const close = function() {
        conn.socket.close();
    };
    
    const connect = function() {
        if (conn.socket) close();
        console.log('KSS Websocket: connecting...');
        conn.socket = new WebSocket(config.url);
        to = setTimeout(check_status, 1000);
    };
    
    const onmessage = function({data, timeStamp}) {
        console.log('KSS_WS_MSG:', data);
        let msg;
        try {
            msg = JSON.parse(data);
        } catch(e) {
            msg = data;
        }        
        // normalize msg
        if (typeof msg != 'object')
            msg = {action: 'unknown', data: msg}

        // if msg has msg_id look for callback
        if (msg.msg_id && conn.callbacks && conn.callbacks[msg.msg_id]) {
            conn.callbacks[msg.msg_id](msg);
            return;
        }
        msg.action = msg.action ? msg.action : 'unknown';
        
        if (msg.action == 'upd') {
            KSS.getSandbox(msg.sandbox).upd(msg.key, msg.data);
        } else if (msg.action == 'merge') {
            KSS.getSandbox(msg.sandbox).merge(msg.data);
        } else if (msg.action == 'set') {
            KSS.getSandbox(msg.sandbox).set(msg.key, msg.data);
        } else if (msg.action == 'rmv') {
            KSS.getSandbox(msg.sandbox).rmv(msg.key);
        } else if (msg.action == 'ins') {
            KSS.getSandbox(msg.sandbox).ins(msg.key, msg.data);
        } 
    };
    
    /////////////////////////////////////////////////////////////////////////////////
    // Init
    /////////////////////////////////////////////////////////////////////////////////
    let to;
    
    const conn = {
        config: config,
        callbacks: {}
    };
    
    connect();
    
    KSS.send = send;
    KSS.disconnect = close;
    KSS.connection = conn;
    return conn;
};

////////////////////////////////////////////////////////////////////////////////////////
// Before to go ahead, if bundle load is enabled, load dproxy auxiliar library.

if (document.currentScript.getAttribute('load') == 'bundle') {
    const dproxy = document.createElement('SCRIPT'); 
    dproxy.async = false;
    dproxy.src = document.currentScript.src.replace('kss.js', 'dproxy.js');
    document.currentScript.before(dproxy);
}
