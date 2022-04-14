/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/jxword-creator/dist/jxwordcreator.js":
/*!***********************************************************!*\
  !*** ./node_modules/jxword-creator/dist/jxwordcreator.js ***!
  \***********************************************************/
/***/ ((module) => {


(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
'use strict';

function noop() { }
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
    if (store == null) {
        return noop;
    }
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
}
function set_store_value(store, ret, value) {
    store.set(value);
    return ret;
}
function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function to_number(value) {
    return value === '' ? null : +value;
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;
}
function set_input_value(input, value) {
    input.value = value == null ? '' : value;
}
function set_style(node, key, value, important) {
    if (value === null) {
        node.style.removeProperty(key);
    }
    else {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail, bubbles = false) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, bubbles, false, detail);
    return e;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error('Function called outside component initialization');
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function createEventDispatcher() {
    const component = get_current_component();
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}
// TODO figure out if we still want to support
// shorthand events, or if we want to implement
// a real bubbling mechanism
function bubble(component, event) {
    const callbacks = component.$$.callbacks[event.type];
    if (callbacks) {
        // @ts-ignore
        callbacks.slice().forEach(fn => fn.call(this, event));
    }
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function tick() {
    schedule_update();
    return resolved_promise;
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function add_flush_callback(fn) {
    flush_callbacks.push(fn);
}
// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();
let flushidx = 0; // Do *not* move this inside the flush() function
function flush() {
    const saved_component = current_component;
    do {
        // first, call beforeUpdate functions
        // and update components
        while (flushidx < dirty_components.length) {
            const component = dirty_components[flushidx];
            flushidx++;
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        flushidx = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    seen_callbacks.clear();
    set_current_component(saved_component);
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}

function bind(component, name, callback) {
    const index = component.$$.props[name];
    if (index !== undefined) {
        component.$$.bound[index] = callback;
        callback(component.$$.ctx[index]);
    }
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor, customElement) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
    }
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false,
        root: options.target || parent_component.$$.root
    };
    append_styles && append_styles($$.root);
    let ready = false;
    $$.ctx = instance
        ? instance(component, options.props || {}, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor, options.customElement);
        flush();
    }
    set_current_component(parent_component);
}
/**
 * Base class for Svelte components. Used when dev=false.
 */
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

const subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = new Set();
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (const subscriber of subscribers) {
                    subscriber[1]();
                    subscriber_queue.push(subscriber, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.add(subscriber);
        if (subscribers.size === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            subscribers.delete(subscriber);
            if (subscribers.size === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

const isEditingQuestion = writable(false);
const questionsAcross = writable([]);
const questionsDown = writable([]);
const currentDirection = writable("across");
const currentQuestion = writable({});

/* src/Menu.svelte generated by Svelte v3.46.4 */

function create_fragment$5(ctx) {
	let main;
	let nav;
	let div;
	let input;
	let t0;
	let span0;
	let t1;
	let span1;
	let t2;
	let span2;
	let t3;
	let ul;
	let a0;
	let t5;
	let li1;
	let t6;
	let a1;
	let mounted;
	let dispose;

	return {
		c() {
			main = element("main");
			nav = element("nav");
			div = element("div");
			input = element("input");
			t0 = space();
			span0 = element("span");
			t1 = space();
			span1 = element("span");
			t2 = space();
			span2 = element("span");
			t3 = space();
			ul = element("ul");
			a0 = element("a");
			a0.innerHTML = `<li class="svelte-1hgibzg">Instructions</li>`;
			t5 = space();
			li1 = element("li");
			li1.innerHTML = `<hr/>`;
			t6 = space();
			a1 = element("a");
			a1.innerHTML = `<li class="svelte-1hgibzg">Reset</li>`;
			attr(input, "type", "checkbox");
			attr(input, "class", "svelte-1hgibzg");
			attr(span0, "class", "jxword-hamberder svelte-1hgibzg");
			attr(span1, "class", "jxword-hamberder svelte-1hgibzg");
			attr(span2, "class", "jxword-hamberder svelte-1hgibzg");
			attr(a0, "href", "instructions");
			attr(a0, "class", "jxword-button svelte-1hgibzg");
			attr(li1, "class", "jxword-menu-break svelte-1hgibzg");
			attr(a1, "href", "#");
			attr(a1, "class", "jxword-button svelte-1hgibzg");
			attr(ul, "class", "jxword-menu svelte-1hgibzg");
			attr(div, "class", "jxword-menu-toggle svelte-1hgibzg");
			attr(nav, "class", "jxword-controls");
		},
		m(target, anchor) {
			insert(target, main, anchor);
			append(main, nav);
			append(nav, div);
			append(div, input);
			input.checked = /*showMenu*/ ctx[0];
			append(div, t0);
			append(div, span0);
			append(div, t1);
			append(div, span1);
			append(div, t2);
			append(div, span2);
			append(div, t3);
			append(div, ul);
			append(ul, a0);
			append(ul, t5);
			append(ul, li1);
			append(ul, t6);
			append(ul, a1);

			if (!mounted) {
				dispose = [
					listen(input, "change", /*input_change_handler*/ ctx[3]),
					listen(a0, "click", /*handleInstructions*/ ctx[2]),
					listen(a1, "click", /*handleReset*/ ctx[1])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*showMenu*/ 1) {
				input.checked = /*showMenu*/ ctx[0];
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(main);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	const dispatch = createEventDispatcher();
	let showMenu = false;

	function handleReset(e) {
		e.preventDefault();
		dispatch('reset');
		$$invalidate(0, showMenu = false);
	}

	function handleInstructions(e) {
		e.preventDefault();
		dispatch('instructions');
		$$invalidate(0, showMenu = false);
	}

	function input_change_handler() {
		showMenu = this.checked;
		$$invalidate(0, showMenu);
	}

	return [showMenu, handleReset, handleInstructions, input_change_handler];
}

class Menu extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});
	}
}

var words = ["the","of","and","to","a","in","for","is","on","that","by","this","with","i","you","it","not","or","be","are","from","at","as","your","all","have","new","more","an","was","we","will","home","can","us","about","if","page","my","has","search","free","but","our","one","other","do","no","information","time","they","site","he","up","may","what","which","their","news","out","use","any","there","see","only","so","his","when","contact","here","business","who","web","also","now","help","get","pm","view","online","c","e","first","am","been","would","how","were","me","s","services","some","these","click","its","like","service","x","than","find","price","date","back","top","people","had","list","name","just","over","state","year","day","into","email","two","health","n","world","re","next","used","go","b","work","last","most","products","music","buy","data","make","them","should","product","system","post","her","city","t","add","policy","number","such","please","available","copyright","support","message","after","best","software","then","jan","good","video","well","d","where","info","rights","public","books","high","school","through","m","each","links","she","review","years","order","very","privacy","book","items","company","r","read","group","need","many","user","said","de","does","set","under","general","research","university","january","mail","full","map","reviews","program","life","know","games","way","days","management","p","part","could","great","united","hotel","real","f","item","international","center","ebay","must","store","travel","comments","made","development","report","off","member","details","line","terms","before","hotels","did","send","right","type","because","local","those","using","results","office","education","national","car","design","take","posted","internet","address","community","within","states","area","want","phone","dvd","shipping","reserved","subject","between","forum","family","l","long","based","w","code","show","o","even","black","check","special","prices","website","index","being","women","much","sign","file","link","open","today","technology","south","case","project","same","pages","uk","version","section","own","found","sports","house","related","security","both","g","county","american","photo","game","members","power","while","care","network","down","computer","systems","three","total","place","end","following","download","h","him","without","per","access","think","north","resources","current","posts","big","media","law","control","water","history","pictures","size","art","personal","since","including","guide","shop","directory","board","location","change","white","text","small","rating","rate","government","children","during","usa","return","students","v","shopping","account","times","sites","level","digital","profile","previous","form","events","love","old","john","main","call","hours","image","department","title","description","non","k","y","insurance","another","why","shall","property","class","cd","still","money","quality","every","listing","content","country","private","little","visit","save","tools","low","reply","customer","december","compare","movies","include","college","value","article","york","man","card","jobs","provide","j","food","source","author","different","press","u","learn","sale","around","print","course","job","canada","process","teen","room","stock","training","too","credit","point","join","science","men","categories","advanced","west","sales","look","english","left","team","estate","box","conditions","select","windows","photos","gay","thread","week","category","note","live","large","gallery","table","register","however","june","october","november","market","library","really","action","start","series","model","features","air","industry","plan","human","provided","tv","yes","required","second","hot","accessories","cost","movie","forums","march","la","september","better","say","questions","july","yahoo","going","medical","test","friend","come","dec","server","pc","study","application","cart","staff","articles","san","feedback","again","play","looking","issues","april","never","users","complete","street","topic","comment","financial","things","working","against","standard","tax","person","below","mobile","less","got","blog","party","payment","equipment","login","student","let","programs","offers","legal","above","recent","park","stores","side","act","problem","red","give","memory","performance","social","q","august","quote","language","story","sell","options","experience","rates","create","key","body","young","america","important","field","few","east","paper","single","ii","age","activities","club","example","girls","additional","password","z","latest","something","road","gift","question","changes","night","ca","hard","texas","oct","pay","four","poker","status","browse","issue","range","building","seller","court","february","always","result","audio","light","write","war","nov","offer","blue","groups","al","easy","given","files","event","release","analysis","request","fax","china","making","picture","needs","possible","might","professional","yet","month","major","star","areas","future","space","committee","hand","sun","cards","problems","london","washington","meeting","rss","become","interest","id","child","keep","enter","california","share","similar","garden","schools","million","added","reference","companies","listed","baby","learning","energy","run","delivery","net","popular","term","film","stories","put","computers","journal","reports","co","try","welcome","central","images","president","notice","original","head","radio","until","cell","color","self","council","away","includes","track","australia","discussion","archive","once","others","entertainment","agreement","format","least","society","months","log","safety","friends","sure","faq","trade","edition","cars","messages","marketing","tell","further","updated","association","able","having","provides","david","fun","already","green","studies","close","common","drive","specific","several","gold","feb","living","sep","collection","called","short","arts","lot","ask","display","limited","powered","solutions","means","director","daily","beach","past","natural","whether","due","et","electronics","five","upon","period","planning","database","says","official","weather","mar","land","average","done","technical","window","france","pro","region","island","record","direct","microsoft","conference","environment","records","st","district","calendar","costs","style","url","front","statement","update","parts","aug","ever","downloads","early","miles","sound","resource","present","applications","either","ago","document","word","works","material","bill","apr","written","talk","federal","hosting","rules","final","adult","tickets","thing","centre","requirements","via","cheap","kids","finance","true","minutes","else","mark","third","rock","gifts","europe","reading","topics","bad","individual","tips","plus","auto","cover","usually","edit","together","videos","percent","fast","function","fact","unit","getting","global","tech","meet","far","economic","en","player","projects","lyrics","often","subscribe","submit","germany","amount","watch","included","feel","though","bank","risk","thanks","everything","deals","various","words","linux","jul","production","commercial","james","weight","town","heart","advertising","received","choose","treatment","newsletter","archives","points","knowledge","magazine","error","camera","jun","girl","currently","construction","toys","registered","clear","golf","receive","domain","methods","chapter","makes","protection","policies","loan","wide","beauty","manager","india","position","taken","sort","listings","models","michael","known","half","cases","step","engineering","florida","simple","quick","none","wireless","license","paul","friday","lake","whole","annual","published","later","basic","sony","shows","corporate","google","church","method","purchase","customers","active","response","practice","hardware","figure","materials","fire","holiday","chat","enough","designed","along","among","death","writing","speed","html","countries","loss","face","brand","discount","higher","effects","created","remember","standards","oil","bit","yellow","political","increase","advertise","kingdom","base","near","environmental","thought","stuff","french","storage","oh","japan","doing","loans","shoes","entry","stay","nature","orders","availability","africa","summary","turn","mean","growth","notes","agency","king","monday","european","activity","copy","although","drug","pics","western","income","force","cash","employment","overall","bay","river","commission","ad","package","contents","seen","players","engine","port","album","regional","stop","supplies","started","administration","bar","institute","views","plans","double","dog","build","screen","exchange","types","soon","sponsored","lines","electronic","continue","across","benefits","needed","season","apply","someone","held","ny","anything","printer","condition","effective","believe","organization","effect","asked","eur","mind","sunday","selection","casino","pdf","lost","tour","menu","volume","cross","anyone","mortgage","hope","silver","corporation","wish","inside","solution","mature","role","rather","weeks","addition","came","supply","nothing","certain","usr","executive","running","lower","necessary","union","jewelry","according","dc","clothing","mon","com","particular","fine","names","robert","homepage","hour","gas","skills","six","bush","islands","advice","career","military","rental","decision","leave","british","teens","pre","huge","sat","woman","facilities","zip","bid","kind","sellers","middle","move","cable","opportunities","taking","values","division","coming","tuesday","object","lesbian","appropriate","machine","logo","length","actually","nice","score","statistics","client","ok","returns","capital","follow","sample","investment","sent","shown","saturday","christmas","england","culture","band","flash","ms","lead","george","choice","went","starting","registration","fri","thursday","courses","consumer","hi","airport","foreign","artist","outside","furniture","levels","channel","letter","mode","phones","ideas","wednesday","structure","fund","summer","allow","degree","contract","button","releases","wed","homes","super","male","matter","custom","virginia","almost","took","located","multiple","asian","distribution","editor","inn","industrial","cause","potential","song","cnet","ltd","los","hp","focus","late","fall","featured","idea","rooms","female","responsible","inc","communications","win","associated","thomas","primary","cancer","numbers","reason","tool","browser","spring","foundation","answer","voice","eg","friendly","schedule","documents","communication","purpose","feature","bed","comes","police","everyone","independent","ip","approach","cameras","brown","physical","operating","hill","maps","medicine","deal","hold","ratings","chicago","forms","glass","happy","tue","smith","wanted","developed","thank","safe","unique","survey","prior","telephone","sport","ready","feed","animal","sources","mexico","population","pa","regular","secure","navigation","operations","therefore","simply","evidence","station","christian","round","paypal","favorite","understand","option","master","valley","recently","probably","thu","rentals","sea","built","publications","blood","cut","worldwide","improve","connection","publisher","hall","larger","anti","networks","earth","parents","nokia","impact","transfer","introduction","kitchen","strong","tel","carolina","wedding","properties","hospital","ground","overview","ship","accommodation","owners","disease","tx","excellent","paid","italy","perfect","hair","opportunity","kit","classic","basis","command","cities","william","express","award","distance","tree","peter","assessment","ensure","thus","wall","ie","involved","el","extra","especially","interface","partners","budget","rated","guides","success","maximum","ma","operation","existing","quite","selected","boy","amazon","patients","restaurants","beautiful","warning","wine","locations","horse","vote","forward","flowers","stars","significant","lists","technologies","owner","retail","animals","useful","directly","manufacturer","ways","est","son","providing","rule","mac","housing","takes","iii","gmt","bring","catalog","searches","max","trying","mother","authority","considered","told","xml","traffic","programme","joined","input","strategy","feet","agent","valid","bin","modern","senior","ireland","teaching","door","grand","testing","trial","charge","units","instead","canadian","cool","normal","wrote","enterprise","ships","entire","educational","md","leading","metal","positive","fl","fitness","chinese","opinion","mb","asia","football","abstract","uses","output","funds","mr","greater","likely","develop","employees","artists","alternative","processing","responsibility","resolution","java","guest","seems","publication","pass","relations","trust","van","contains","session","multi","photography","republic","fees","components","vacation","century","academic","assistance","completed","skin","graphics","indian","prev","ads","mary","il","expected","ring","grade","dating","pacific","mountain","organizations","pop","filter","mailing","vehicle","longer","consider","int","northern","behind","panel","floor","german","buying","match","proposed","default","require","iraq","boys","outdoor","deep","morning","otherwise","allows","rest","protein","plant","reported","hit","transportation","mm","pool","mini","politics","partner","disclaimer","authors","boards","faculty","parties","fish","membership","mission","eye","string","sense","modified","pack","released","stage","internal","goods","recommended","born","unless","richard","detailed","japanese","race","approved","background","target","except","character","usb","maintenance","ability","maybe","functions","ed","moving","brands","places","php","pretty","trademarks","phentermine","spain","southern","yourself","etc","winter","battery","youth","pressure","submitted","boston","debt","keywords","medium","television","interested","core","break","purposes","throughout","sets","dance","wood","msn","itself","defined","papers","playing","awards","fee","studio","reader","virtual","device","established","answers","rent","las","remote","dark","programming","external","apple","le","regarding","instructions","min","offered","theory","enjoy","remove","aid","surface","minimum","visual","host","variety","teachers","isbn","martin","manual","block","subjects","agents","increased","repair","fair","civil","steel","understanding","songs","fixed","wrong","beginning","hands","associates","finally","az","updates","desktop","classes","paris","ohio","gets","sector","capacity","requires","jersey","un","fat","fully","father","electric","saw","instruments","quotes","officer","driver","businesses","dead","respect","unknown","specified","restaurant","mike","trip","pst","worth","mi","procedures","poor","teacher","eyes","relationship","workers","farm","georgia","peace","traditional","campus","tom","showing","creative","coast","benefit","progress","funding","devices","lord","grant","sub","agree","fiction","hear","sometimes","watches","careers","beyond","goes","families","led","museum","themselves","fan","transport","interesting","blogs","wife","evaluation","accepted","former","implementation","ten","hits","zone","complex","th","cat","galleries","references","die","presented","jack","flat","flow","agencies","literature","respective","parent","spanish","michigan","columbia","setting","dr","scale","stand","economy","highest","helpful","monthly","critical","frame","musical","definition","secretary","angeles","networking","path","australian","employee","chief","gives","kb","bottom","magazines","packages","detail","francisco","laws","changed","pet","heard","begin","individuals","colorado","royal","clean","switch","russian","largest","african","guy","titles","relevant","guidelines","justice","connect","bible","dev","cup","basket","applied","weekly","vol","installation","described","demand","pp","suite","vegas","na","square","chris","attention","advance","skip","diet","army","auction","gear","lee","os","difference","allowed","correct","charles","nation","selling","lots","piece","sheet","firm","seven","older","illinois","regulations","elements","species","jump","cells","module","resort","facility","random","pricing","dvds","certificate","minister","motion","looks","fashion","directions","visitors","documentation","monitor","trading","forest","calls","whose","coverage","couple","giving","chance","vision","ball","ending","clients","actions","listen","discuss","accept","automotive","naked","goal","successful","sold","wind","communities","clinical","situation","sciences","markets","lowest","highly","publishing","appear","emergency","developing","lives","currency","leather","determine","temperature","palm","announcements","patient","actual","historical","stone","bob","commerce","ringtones","perhaps","persons","difficult","scientific","satellite","fit","tests","village","accounts","amateur","ex","met","pain","xbox","particularly","factors","coffee","www","settings","buyer","cultural","steve","easily","oral","ford","poster","edge","functional","root","au","fi","closed","holidays","ice","pink","zealand","balance","monitoring","graduate","replies","shot","nc","architecture","initial","label","thinking","scott","llc","sec","recommend","canon","league","waste","minute","bus","provider","optional","dictionary","cold","accounting","manufacturing","sections","chair","fishing","effort","phase","fields","bag","fantasy","po","letters","motor","va","professor","context","install","shirt","apparel","generally","continued","foot","mass","crime","count","breast","techniques","ibm","rd","johnson","sc","quickly","dollars","websites","religion","claim","driving","permission","surgery","patch","heat","wild","measures","generation","kansas","miss","chemical","doctor","task","reduce","brought","himself","nor","component","enable","exercise","bug","santa","mid","guarantee","leader","diamond","israel","se","processes","soft","servers","alone","meetings","seconds","jones","arizona","keyword","interests","flight","congress","fuel","username","walk","produced","italian","paperback","classifieds","wait","supported","pocket","saint","rose","freedom","argument","competition","creating","jim","drugs","joint","premium","providers","fresh","characters","attorney","upgrade","di","factor","growing","thousands","km","stream","apartments","pick","hearing","eastern","auctions","therapy","entries","dates","generated","signed","upper","administrative","serious","prime","samsung","limit","began","louis","steps","errors","shops","del","efforts","informed","ga","ac","thoughts","creek","ft","worked","quantity","urban","practices","sorted","reporting","essential","myself","tours","platform","load","affiliate","labor","immediately","admin","nursing","defense","machines","designated","tags","heavy","covered","recovery","joe","guys","integrated","configuration","merchant","comprehensive","expert","universal","protect","drop","solid","cds","presentation","languages","became","orange","compliance","vehicles","prevent","theme","rich","im","campaign","marine","improvement","vs","guitar","finding","pennsylvania","examples","ipod","saying","spirit","ar","claims","challenge","motorola","acceptance","strategies","mo","seem","affairs","touch","intended","towards","sa","goals","hire","election","suggest","branch","charges","serve","affiliates","reasons","magic","mount","smart","talking","gave","ones","latin","multimedia","xp","avoid","certified","manage","corner","rank","computing","oregon","element","birth","virus","abuse","interactive","requests","separate","quarter","procedure","leadership","tables","define","racing","religious","facts","breakfast","kong","column","plants","faith","chain","developer","identify","avenue","missing","died","approximately","domestic","sitemap","recommendations","moved","houston","reach","comparison","mental","viewed","moment","extended","sequence","inch","attack","sorry","centers","opening","damage","lab","reserve","recipes","cvs","gamma","plastic","produce","snow","placed","truth","counter","failure","follows","eu","weekend","dollar","camp","ontario","automatically","des","minnesota","films","bridge","native","fill","williams","movement","printing","baseball","owned","approval","draft","chart","played","contacts","cc","jesus","readers","clubs","lcd","wa","jackson","equal","adventure","matching","offering","shirts","profit","leaders","posters","institutions","assistant","variable","ave","dj","advertisement","expect","parking","headlines","yesterday","compared","determined","wholesale","workshop","russia","gone","codes","kinds","extension","seattle","statements","golden","completely","teams","fort","cm","wi","lighting","senate","forces","funny","brother","gene","turned","portable","tried","electrical","applicable","disc","returned","pattern","ct","boat","named","theatre","laser","earlier","manufacturers","sponsor","classical","icon","warranty","dedicated","indiana","direction","harry","basketball","objects","ends","delete","evening","assembly","nuclear","taxes","mouse","signal","criminal","issued","brain","sexual","wisconsin","powerful","dream","obtained","false","da","cast","flower","felt","personnel","passed","supplied","identified","falls","pic","soul","aids","opinions","promote","stated","stats","hawaii","professionals","appears","carry","flag","decided","nj","covers","hr","em","advantage","hello","designs","maintain","tourism","priority","newsletters","adults","clips","savings","iv","graphic","atom","payments","rw","estimated","binding","brief","ended","winning","eight","anonymous","iron","straight","script","served","wants","miscellaneous","prepared","void","dining","alert","integration","atlanta","dakota","tag","interview","mix","framework","disk","installed","queen","vhs","credits","clearly","fix","handle","sweet","desk","criteria","pubmed","dave","massachusetts","diego","hong","vice","associate","ne","truck","behavior","enlarge","ray","frequently","revenue","measure","changing","votes","du","duty","looked","discussions","bear","gain","festival","laboratory","ocean","flights","experts","signs","lack","depth","iowa","whatever","logged","laptop","vintage","train","exactly","dry","explore","maryland","spa","concept","nearly","eligible","checkout","reality","forgot","handling","origin","knew","gaming","feeds","billion","destination","scotland","faster","intelligence","dallas","bought","con","ups","nations","route","followed","specifications","broken","tripadvisor","frank","alaska","zoom","blow","battle","residential","anime","speak","decisions","industries","protocol","query","clip","partnership","editorial","nt","expression","es","equity","provisions","speech","wire","principles","suggestions","rural","shared","sounds","replacement","tape","strategic","judge","spam","economics","acid","bytes","cent","forced","compatible","fight","apartment","height","null","zero","speaker","filed","gb","netherlands","obtain","bc","consulting","recreation","offices","designer","remain","managed","pr","failed","marriage","roll","korea","banks","fr","participants","secret","bath","aa","kelly","leads","negative","austin","favorites","toronto","theater","springs","missouri","andrew","var","perform","healthy","translation","estimates","font","assets","injury","mt","joseph","ministry","drivers","lawyer","figures","married","protected","proposal","sharing","philadelphia","portal","waiting","birthday","beta","fail","gratis","banking","officials","brian","toward","won","slightly","assist","conduct","contained","lingerie","legislation","calling","parameters","jazz","serving","bags","profiles","miami","comics","matters","houses","doc","postal","relationships","tennessee","wear","controls","breaking","combined","ultimate","wales","representative","frequency","introduced","minor","finish","departments","residents","noted","displayed","mom","reduced","physics","rare","spent","performed","extreme","samples","davis","daniel","bars","reviewed","row","oz","forecast","removed","helps","singles","administrator","cycle","amounts","contain","accuracy","dual","rise","usd","sleep","mg","bird","pharmacy","brazil","creation","static","scene","hunter","addresses","lady","crystal","famous","writer","chairman","violence","fans","oklahoma","speakers","drink","academy","dynamic","gender","eat","permanent","agriculture","dell","cleaning","constitutes","portfolio","practical","delivered","collectibles","infrastructure","exclusive","seat","concerns","colour","vendor","originally","intel","utilities","philosophy","regulation","officers","reduction","aim","bids","referred","supports","nutrition","recording","regions","junior","toll","les","cape","ann","rings","meaning","tip","secondary","wonderful","mine","ladies","henry","ticket","announced","guess","agreed","prevention","whom","ski","soccer","math","import","posting","presence","instant","mentioned","automatic","healthcare","viewing","maintained","ch","increasing","majority","connected","christ","dan","dogs","sd","directors","aspects","austria","ahead","moon","participation","scheme","utility","preview","fly","manner","matrix","containing","combination","devel","amendment","despite","strength","guaranteed","turkey","libraries","proper","distributed","degrees","singapore","enterprises","delta","fear","seeking","inches","phoenix","rs","convention","shares","principal","daughter","standing","comfort","colors","wars","cisco","ordering","kept","alpha","appeal","cruise","bonus","certification","previously","hey","bookmark","buildings","specials","beat","disney","household","batteries","adobe","smoking","bbc","becomes","drives","arms","alabama","tea","improved","trees","avg","achieve","positions","dress","subscription","dealer","contemporary","sky","utah","nearby","rom","carried","happen","exposure","panasonic","hide","permalink","signature","gambling","refer","miller","provision","outdoors","clothes","caused","luxury","babes","frames","certainly","indeed","newspaper","toy","circuit","layer","printed","slow","removal","easier","src","liability","trademark","hip","printers","faqs","nine","adding","kentucky","mostly","eric","spot","taylor","trackback","prints","spend","factory","interior","revised","grow","americans","optical","promotion","relative","amazing","clock","dot","hiv","identity","suites","conversion","feeling","hidden","reasonable","victoria","serial","relief","revision","broadband","influence","ratio","pda","importance","rain","onto","dsl","planet","webmaster","copies","recipe","zum","permit","seeing","proof","dna","diff","tennis","bass","prescription","bedroom","empty","instance","hole","pets","ride","licensed","orlando","specifically","tim","bureau","maine","sql","represent","conservation","pair","ideal","specs","recorded","don","pieces","finished","parks","dinner","lawyers","sydney","stress","cream","ss","runs","trends","yeah","discover","ap","patterns","boxes","louisiana","hills","javascript","fourth","nm","advisor","mn","marketplace","nd","evil","aware","wilson","shape","evolution","irish","certificates","objectives","stations","suggested","gps","op","remains","acc","greatest","firms","concerned","euro","operator","structures","generic","encyclopedia","usage","cap","ink","charts","continuing","mixed","census","interracial","peak","tn","competitive","exist","wheel","transit","suppliers","salt","compact","poetry","lights","tracking","angel","bell","keeping","preparation","attempt","receiving","matches","accordance","width","noise","engines","forget","array","discussed","accurate","stephen","elizabeth","climate","reservations","pin","playstation","alcohol","greek","instruction","managing","annotation","sister","raw","differences","walking","explain","smaller","newest","establish","gnu","happened","expressed","jeff","extent","sharp","lesbians","ben","lane","paragraph","kill","mathematics","aol","compensation","ce","export","managers","aircraft","modules","sweden","conflict","conducted","versions","employer","occur","percentage","knows","mississippi","describe","concern","backup","requested","citizens","connecticut","heritage","personals","immediate","holding","trouble","spread","coach","kevin","agricultural","expand","supporting","audience","assigned","jordan","collections","ages","participate","plug","specialist","cook","affect","virgin","experienced","investigation","raised","hat","institution","directed","dealers","searching","sporting","helping","perl","affected","lib","bike","totally","plate","expenses","indicate","blonde","ab","proceedings","favourite","transmission","anderson","utc","characteristics","der","lose","organic","seek","experiences","albums","cheats","extremely","verzeichnis","contracts","guests","hosted","diseases","concerning","developers","equivalent","chemistry","tony","neighborhood","nevada","kits","thailand","variables","agenda","anyway","continues","tracks","advisory","cam","curriculum","logic","template","prince","circle","soil","grants","anywhere","psychology","responses","atlantic","wet","circumstances","edward","investor","identification","ram","leaving","wildlife","appliances","matt","elementary","cooking","speaking","sponsors","fox","unlimited","respond","sizes","plain","exit","entered","iran","arm","keys","launch","wave","checking","costa","belgium","printable","holy","acts","guidance","mesh","trail","enforcement","symbol","crafts","highway","buddy","hardcover","observed","dean","setup","poll","booking","glossary","fiscal","celebrity","styles","denver","unix","filled","bond","channels","ericsson","appendix","notify","blues","chocolate","pub","portion","scope","hampshire","supplier","cables","cotton","bluetooth","controlled","requirement","authorities","biology","dental","killed","border","ancient","debate","representatives","starts","pregnancy","causes","arkansas","biography","leisure","attractions","learned","transactions","notebook","explorer","historic","attached","opened","tm","husband","disabled","authorized","crazy","upcoming","britain","concert","retirement","scores","financing","efficiency","sp","comedy","adopted","efficient","weblog","linear","commitment","specialty","bears","jean","hop","carrier","edited","constant","visa","mouth","jewish","meter","linked","portland","interviews","concepts","nh","gun","reflect","pure","deliver","wonder","lessons","fruit","begins","qualified","reform","lens","alerts","treated","discovery","draw","mysql","classified","relating","assume","confidence","alliance","fm","confirm","warm","neither","lewis","howard","offline","leaves","engineer","lifestyle","consistent","replace","clearance","connections","inventory","converter","organisation","babe","checks","reached","becoming","safari","objective","indicated","sugar","crew","legs","sam","stick","securities","allen","pdt","relation","enabled","genre","slide","montana","volunteer","tested","rear","democratic","enhance","switzerland","exact","bound","parameter","adapter","processor","node","formal","dimensions","contribute","lock","hockey","storm","micro","colleges","laptops","mile","showed","challenges","editors","mens","threads","bowl","supreme","brothers","recognition","presents","ref","tank","submission","dolls","estimate","encourage","navy","kid","regulatory","inspection","consumers","cancel","limits","territory","transaction","manchester","weapons","paint","delay","pilot","outlet","contributions","continuous","db","czech","resulting","cambridge","initiative","novel","pan","execution","disability","increases","ultra","winner","idaho","contractor","ph","episode","examination","potter","dish","plays","bulletin","ia","pt","indicates","modify","oxford","adam","truly","epinions","painting","committed","extensive","affordable","universe","candidate","databases","patent","slot","psp","outstanding","ha","eating","perspective","planned","watching","lodge","messenger","mirror","tournament","consideration","ds","discounts","sterling","sessions","kernel","stocks","buyers","journals","gray","catalogue","ea","jennifer","antonio","charged","broad","taiwan","und","chosen","demo","greece","lg","swiss","sarah","clark","labour","hate","terminal","publishers","nights","behalf","caribbean","liquid","rice","nebraska","loop","salary","reservation","foods","gourmet","guard","properly","orleans","saving","nfl","remaining","empire","resume","twenty","newly","raise","prepare","avatar","gary","depending","illegal","expansion","vary","hundreds","rome","arab","lincoln","helped","premier","tomorrow","purchased","milk","decide","consent","drama","visiting","performing","downtown","keyboard","contest","collected","nw","bands","boot","suitable","ff","absolutely","millions","lunch","audit","push","chamber","guinea","findings","muscle","featuring","iso","implement","clicking","scheduled","polls","typical","tower","yours","sum","misc","calculator","significantly","chicken","temporary","attend","shower","alan","sending","jason","tonight","dear","sufficient","holdem","shell","province","catholic","oak","vat","awareness","vancouver","governor","beer","seemed","contribution","measurement","swimming","spyware","formula","constitution","packaging","solar","jose","catch","jane","pakistan","ps","reliable","consultation","northwest","sir","doubt","earn","finder","unable","periods","classroom","tasks","democracy","attacks","kim","wallpaper","merchandise","const","resistance","doors","symptoms","resorts","biggest","memorial","visitor","twin","forth","insert","baltimore","gateway","ky","dont","alumni","drawing","candidates","charlotte","ordered","biological","fighting","transition","happens","preferences","spy","romance","instrument","bruce","split","themes","powers","heaven","br","bits","pregnant","twice","classification","focused","egypt","physician","hollywood","bargain","wikipedia","cellular","norway","vermont","asking","blocks","normally","lo","spiritual","hunting","diabetes","suit","ml","shift","chip","res","sit","bodies","photographs","cutting","wow","simon","writers","marks","flexible","loved","favourites","mapping","numerous","relatively","birds","satisfaction","represents","char","indexed","pittsburgh","superior","preferred","saved","paying","cartoon","shots","intellectual","moore","granted","choices","carbon","spending","comfortable","magnetic","interaction","listening","effectively","registry","crisis","outlook","massive","denmark","employed","bright","treat","header","cs","poverty","formed","piano","echo","que","grid","sheets","patrick","experimental","puerto","revolution","consolidation","displays","plasma","allowing","earnings","voip","mystery","landscape","dependent","mechanical","journey","delaware","bidding","consultants","risks","banner","applicant","charter","fig","barbara","cooperation","counties","acquisition","ports","implemented","sf","directories","recognized","dreams","blogger","notification","kg","licensing","stands","teach","occurred","textbooks","rapid","pull","hairy","diversity","cleveland","ut","reverse","deposit","seminar","investments","latina","nasa","wheels","sexcam","specify","accessibility","dutch","sensitive","templates","formats","tab","depends","boots","holds","router","concrete","si","editing","poland","folder","womens","css","completion","upload","pulse","universities","technique","contractors","milfhunter","voting","courts","notices","subscriptions","calculate","mc","detroit","alexander","broadcast","converted","metro","toshiba","anniversary","improvements","strip","specification","pearl","accident","nick","accessible","accessory","resident","plot","qty","possibly","airline","typically","representation","regard","pump","exists","arrangements","smooth","conferences","uniprotkb","strike","consumption","birmingham","flashing","lp","narrow","afternoon","threat","surveys","sitting","putting","consultant","controller","ownership","committees","legislative","researchers","vietnam","trailer","anne","castle","gardens","missed","malaysia","unsubscribe","antique","labels","willing","bio","molecular","acting","heads","stored","exam","logos","residence","attorneys","milfs","antiques","density","hundred","ryan","operators","strange","sustainable","philippines","statistical","beds","mention","innovation","pcs","employers","grey","parallel","honda","amended","operate","bills","bold","bathroom","stable","opera","definitions","von","doctors","lesson","cinema","asset","ag","scan","elections","drinking","reaction","blank","enhanced","entitled","severe","generate","stainless","newspapers","hospitals","vi","deluxe","humor","aged","monitors","exception","lived","duration","bulk","successfully","indonesia","pursuant","sci","fabric","edt","visits","primarily","tight","domains","capabilities","pmid","contrast","recommendation","flying","recruitment","sin","berlin","cute","organized","ba","para","siemens","adoption","improving","cr","expensive","meant","capture","pounds","buffalo","organisations","plane","pg","explained","seed","programmes","desire","expertise","mechanism","camping","ee","jewellery","meets","welfare","peer","caught","eventually","marked","driven","measured","medline","bottle","agreements","considering","innovative","marshall","massage","rubber","conclusion","closing","tampa","thousand","meat","legend","grace","susan","ing","ks","adams","python","monster","alex","bang","villa","bone","columns","disorders","bugs","collaboration","hamilton","detection","ftp","cookies","inner","formation","tutorial","med","engineers","entity","cruises","gate","holder","proposals","moderator","sw","tutorials","settlement","portugal","lawrence","roman","duties","valuable","tone","collectables","ethics","forever","dragon","busy","captain","fantastic","imagine","brings","heating","leg","neck","hd","wing","governments","purchasing","scripts","abc","stereo","appointed","taste","dealing","commit","tiny","operational","rail","airlines","liberal","livecam","jay","trips","gap","sides","tube","turns","corresponding","descriptions","cache","belt","jacket","determination","animation","oracle","er","matthew","lease","productions","aviation","hobbies","proud","excess","disaster","console","commands","jr","telecommunications","instructor","giant","achieved","injuries","shipped","seats","approaches","biz","alarm","voltage","anthony","nintendo","usual","loading","stamps","appeared","franklin","angle","rob","vinyl","highlights","mining","designers","melbourne","ongoing","worst","imaging","betting","scientists","liberty","wyoming","blackjack","argentina","era","convert","possibility","analyst","commissioner","dangerous","garage","exciting","reliability","thongs","gcc","unfortunately","respectively","volunteers","attachment","ringtone","finland","morgan","derived","pleasure","honor","asp","oriented","eagle","desktops","pants","columbus","nurse","prayer","appointment","workshops","hurricane","quiet","luck","postage","producer","represented","mortgages","dial","responsibilities","cheese","comic","carefully","jet","productivity","investors","crown","par","underground","diagnosis","maker","crack","principle","picks","vacations","gang","semester","calculated","fetish","applies","casinos","appearance","smoke","apache","filters","incorporated","nv","craft","cake","notebooks","apart","fellow","blind","lounge","mad","algorithm","semi","coins","andy","gross","strongly","cafe","valentine","hilton","ken","proteins","horror","su","exp","familiar","capable","douglas","debian","till","involving","pen","investing","christopher","admission","epson","shoe","elected","carrying","victory","sand","madison","terrorism","joy","editions","cpu","mainly","ethnic","ran","parliament","actor","finds","seal","situations","fifth","allocated","citizen","vertical","corrections","structural","municipal","describes","prize","sr","occurs","jon","absolute","disabilities","consists","anytime","substance","prohibited","addressed","lies","pipe","soldiers","nr","guardian","lecture","simulation","layout","initiatives","ill","concentration","classics","lbs","lay","interpretation","horses","lol","dirty","deck","wayne","donate","taught","bankruptcy","mp","worker","optimization","alive","temple","substances","prove","discovered","wings","breaks","genetic","restrictions","participating","waters","promise","thin","exhibition","prefer","ridge","cabinet","modem","harris","mph","bringing","sick","dose","evaluate","tiffany","tropical","collect","bet","composition","toyota","streets","nationwide","vector","definitely","shaved","turning","buffer","purple","existence","commentary","larry","limousines","developments","def","immigration","destinations","lets","mutual","pipeline","necessarily","syntax","li","attribute","prison","skill","chairs","nl","everyday","apparently","surrounding","mountains","moves","popularity","inquiry","ethernet","checked","exhibit","throw","trend","sierra","visible","cats","desert","postposted","ya","oldest","rhode","nba","coordinator","obviously","mercury","steven","handbook","greg","navigate","worse","summit","victims","epa","spaces","fundamental","burning","escape","coupons","somewhat","receiver","substantial","tr","progressive","cialis","bb","boats","glance","scottish","championship","arcade","richmond","sacramento","impossible","ron","russell","tells","obvious","fiber","depression","graph","covering","platinum","judgment","bedrooms","talks","filing","foster","modeling","passing","awarded","testimonials","trials","tissue","nz","memorabilia","clinton","masters","bonds","cartridge","alberta","explanation","folk","org","commons","cincinnati","subsection","fraud","electricity","permitted","spectrum","arrival","okay","pottery","emphasis","roger","aspect","workplace","awesome","mexican","confirmed","counts","priced","wallpapers","hist","crash","lift","desired","inter","closer","assumes","heights","shadow","riding","infection","firefox","lisa","expense","grove","eligibility","venture","clinic","korean","healing","princess","mall","entering","packet","spray","studios","involvement","dad","buttons","placement","observations","vbulletin","funded","thompson","winners","extend","roads","subsequent","pat","dublin","rolling","fell","motorcycle","yard","disclosure","establishment","memories","nelson","te","arrived","creates","faces","tourist","av","mayor","murder","sean","adequate","senator","yield","presentations","grades","cartoons","pour","digest","reg","lodging","tion","dust","hence","wiki","entirely","replaced","radar","rescue","undergraduate","losses","combat","reducing","stopped","occupation","lakes","donations","associations","citysearch","closely","radiation","diary","seriously","kings","shooting","kent","adds","nsw","ear","flags","pci","baker","launched","elsewhere","pollution","conservative","guestbook","shock","effectiveness","walls","abroad","ebony","tie","ward","drawn","arthur","ian","visited","roof","walker","demonstrate","atmosphere","suggests","kiss","beast","ra","operated","experiment","targets","overseas","purchases","dodge","counsel","federation","pizza","invited","yards","assignment","chemicals","gordon","mod","farmers","rc","queries","bmw","rush","ukraine","absence","nearest","cluster","vendors","mpeg","whereas","yoga","serves","woods","surprise","lamp","rico","partial","shoppers","phil","everybody","couples","nashville","ranking","jokes","cst","http","ceo","simpson","twiki","sublime","counseling","palace","acceptable","satisfied","glad","wins","measurements","verify","globe","trusted","copper","milwaukee","rack","medication","warehouse","shareware","ec","rep","dicke","kerry","receipt","supposed","ordinary","nobody","ghost","violation","configure","stability","mit","applying","southwest","boss","pride","institutional","expectations","independence","knowing","reporter","metabolism","keith","champion","cloudy","linda","ross","personally","chile","anna","plenty","solo","sentence","throat","ignore","maria","uniform","excellence","wealth","tall","rm","somewhere","vacuum","dancing","attributes","recognize","brass","writes","plaza","pdas","outcomes","survival","quest","publish","sri","screening","toe","thumbnail","trans","jonathan","whenever","nova","lifetime","api","pioneer","booty","forgotten","acrobat","plates","acres","venue","athletic","thermal","essays","behaviour","vital","telling","fairly","coastal","config","cf","charity","intelligent","edinburgh","vt","excel","modes","obligation","campbell","wake","stupid","harbor","hungary","traveler","urw","segment","realize","regardless","lan","enemy","puzzle","rising","aluminum","wells","wishlist","opens","insight","sms","restricted","republican","secrets","lucky","latter","merchants","thick","trailers","repeat","syndrome","philips","attendance","penalty","drum","glasses","enables","nec","iraqi","builder","vista","jessica","chips","terry","flood","foto","ease","arguments","amsterdam","arena","adventures","pupils","stewart","announcement","tabs","outcome","appreciate","expanded","casual","grown","polish","lovely","extras","gm","centres","jerry","clause","smile","lands","ri","troops","indoor","bulgaria","armed","broker","charger","regularly","believed","pine","cooling","tend","gulf","rt","rick","trucks","cp","mechanisms","divorce","laura","shopper","tokyo","partly","nikon","customize","tradition","candy","pills","tiger","donald","folks","sensor","exposed","telecom","hunt","angels","deputy","indicators","sealed","thai","emissions","physicians","loaded","fred","complaint","scenes","experiments","afghanistan","dd","boost","spanking","scholarship","governance","mill","founded","supplements","chronic","icons","moral","den","catering","aud","finger","keeps","pound","locate","camcorder","pl","trained","burn","implementing","roses","labs","ourselves","bread","tobacco","wooden","motors","tough","roberts","incident","gonna","dynamics","lie","crm","rf","conversation","decrease","cumshots","chest","pension","billy","revenues","emerging","worship","capability","ak","fe","craig","herself","producing","churches","precision","damages","reserves","contributed","solve","shorts","reproduction","minority","td","diverse","amp","ingredients","sb","ah","johnny","sole","franchise","recorder","complaints","facing","sm","nancy","promotions","tones","passion","rehabilitation","maintaining","sight","laid","clay","defence","patches","weak","refund","usc","towns","environments","trembl","divided","blvd","reception","amd","wise","emails","cyprus","wv","odds","correctly","insider","seminars","consequences","makers","hearts","geography","appearing","integrity","worry","ns","discrimination","eve","carter","legacy","marc","pleased","danger","vitamin","widely","processed","phrase","genuine","raising","implications","functionality","paradise","hybrid","reads","roles","intermediate","emotional","sons","leaf","pad","glory","platforms","ja","bigger","billing","diesel","versus","combine","overnight","geographic","exceed","bs","rod","saudi","fault","cuba","hrs","preliminary","districts","introduce","silk","promotional","kate","chevrolet","babies","bi","karen","compiled","romantic","revealed","specialists","generator","albert","examine","jimmy","graham","suspension","bristol","margaret","compaq","sad","correction","wolf","slowly","authentication","communicate","rugby","supplement","showtimes","cal","portions","infant","promoting","sectors","samuel","fluid","grounds","fits","kick","regards","meal","ta","hurt","machinery","bandwidth","unlike","equation","baskets","probability","pot","dimension","wright","img","barry","proven","schedules","admissions","cached","warren","slip","studied","reviewer","involves","quarterly","rpm","profits","devil","grass","comply","marie","florist","illustrated","cherry","continental","alternate","deutsch","achievement","limitations","kenya","webcam","cuts","funeral","nutten","earrings","enjoyed","automated","chapters","pee","charlie","quebec","passenger","convenient","dennis","mars","francis","tvs","sized","manga","noticed","socket","silent","literary","egg","mhz","signals","caps","orientation","pill","theft","childhood","swing","symbols","lat","meta","humans","analog","facial","choosing","talent","dated","flexibility","seeker","wisdom","shoot","boundary","mint","packard","offset","payday","philip","elite","gi","spin","holders","believes","swedish","poems","deadline","jurisdiction","robot","displaying","witness","collins","equipped","stages","encouraged","sur","winds","powder","broadway","acquired","assess","wash","cartridges","stones","entrance","gnome","roots","declaration","losing","attempts","gadgets","noble","glasgow","automation","impacts","rev","gospel","advantages","shore","loves","induced","ll","knight","preparing","loose","aims","recipient","linking","extensions","appeals","cl","earned","illness","islamic","athletics","southeast","ieee","ho","alternatives","pending","parker","determining","lebanon","corp","personalized","kennedy","gt","sh","conditioning","teenage","soap","ae","triple","cooper","nyc","vincent","jam","secured","unusual","answered","partnerships","destruction","slots","increasingly","migration","disorder","routine","toolbar","basically","rocks","conventional","titans","applicants","wearing","axis","sought","genes","mounted","habitat","firewall","median","guns","scanner","herein","occupational","animated","judicial","rio","hs","adjustment","hero","integer","treatments","bachelor","attitude","camcorders","engaged","falling","basics","montreal","carpet","rv","struct","lenses","binary","genetics","attended","difficulty","punk","collective","coalition","pi","dropped","enrollment","duke","walter","ai","pace","besides","wage","producers","ot","collector","arc","hosts","interfaces","advertisers","moments","atlas","strings","dawn","representing","observation","feels","torture","carl","deleted","coat","mitchell","mrs","rica","restoration","convenience","returning","ralph","opposition","container","yr","defendant","warner","confirmation","app","embedded","inkjet","supervisor","wizard","corps","actors","liver","peripherals","liable","brochure","morris","bestsellers","petition","eminem","recall","antenna","picked","assumed","departure","minneapolis","belief","killing","bikini","memphis","shoulder","decor","lookup","texts","harvard","brokers","roy","ion","diameter","ottawa","doll","ic","podcast","seasons","peru","interactions","refine","bidder","singer","evans","herald","literacy","fails","aging","nike","intervention","fed","plugin","attraction","diving","invite","modification","alice","latinas","suppose","customized","reed","involve","moderate","terror","younger","thirty","mice","opposite","understood","rapidly","dealtime","ban","temp","intro","mercedes","zus","assurance","clerk","happening","vast","mills","outline","amendments","tramadol","holland","receives","jeans","metropolitan","compilation","verification","fonts","ent","odd","wrap","refers","mood","favor","veterans","quiz","mx","sigma","gr","attractive","xhtml","occasion","recordings","jefferson","victim","demands","sleeping","careful","ext","beam","gardening","obligations","arrive","orchestra","sunset","tracked","moreover","minimal","polyphonic","lottery","tops","framed","aside","outsourcing","licence","adjustable","allocation","michelle","essay","discipline","amy","ts","demonstrated","dialogue","identifying","alphabetical","camps","declared","dispatched","aaron","handheld","trace","disposal","shut","florists","packs","ge","installing","switches","romania","voluntary","ncaa","thou","consult","phd","greatly","blogging","mask","cycling","midnight","ng","commonly","pe","photographer","inform","turkish","coal","cry","messaging","pentium","quantum","murray","intent","tt","zoo","largely","pleasant","announce","constructed","additions","requiring","spoke","aka","arrow","engagement","sampling","rough","weird","tee","refinance","lion","inspired","holes","weddings","blade","suddenly","oxygen","cookie","meals","canyon","goto","meters","merely","calendars","arrangement","conclusions","passes","bibliography","pointer","compatibility","stretch","durham","furthermore","permits","cooperative","muslim","xl","neil","sleeve","netscape","cleaner","cricket","beef","feeding","stroke","township","rankings","measuring","cad","hats","robin","robinson","jacksonville","strap","headquarters","sharon","crowd","tcp","transfers","surf","olympic","transformation","remained","attachments","dv","dir","entities","customs","administrators","personality","rainbow","hook","roulette","decline","gloves","israeli","medicare","cord","skiing","cloud","facilitate","subscriber","valve","val","hewlett","explains","proceed","flickr","feelings","knife","jamaica","priorities","shelf","bookstore","timing","liked","parenting","adopt","denied","fotos","incredible","britney","freeware","donation","outer","crop","deaths","rivers","commonwealth","pharmaceutical","manhattan","tales","katrina","workforce","islam","nodes","tu","fy","thumbs","seeds","cited","lite","ghz","hub","targeted","organizational","skype","realized","twelve","founder","decade","gamecube","rr","dispute","portuguese","tired","titten","adverse","everywhere","excerpt","eng","steam","discharge","ef","drinks","ace","voices","acute","halloween","climbing","stood","sing","tons","perfume","carol","honest","albany","hazardous","restore","stack","methodology","somebody","sue","ep","housewares","reputation","resistant","democrats","recycling","hang","gbp","curve","creator","amber","qualifications","museums","coding","slideshow","tracker","variation","passage","transferred","trunk","hiking","lb","pierre","jelsoft","headset","photograph","oakland","colombia","waves","camel","distributor","lamps","underlying","hood","wrestling","suicide","archived","photoshop","jp","chi","bt","arabia","gathering","projection","juice","chase","mathematical","logical","sauce","fame","extract","specialized","diagnostic","panama","indianapolis","af","payable","corporations","courtesy","criticism","automobile","confidential","rfc","statutory","accommodations","athens","northeast","downloaded","judges","sl","seo","retired","isp","remarks","detected","decades","paintings","walked","arising","nissan","bracelet","ins","eggs","juvenile","injection","yorkshire","populations","protective","afraid","acoustic","railway","cassette","initially","indicator","pointed","hb","jpg","causing","mistake","norton","locked","eliminate","tc","fusion","mineral","sunglasses","ruby","steering","beads","fortune","preference","canvas","threshold","parish","claimed","screens","cemetery","planner","croatia","flows","stadium","venezuela","exploration","mins","fewer","sequences","coupon","nurses","ssl","stem","proxy","astronomy","lanka","opt","edwards","drew","contests","flu","translate","announces","mlb","costume","tagged","berkeley","voted","killer","bikes","gates","adjusted","rap","tune","bishop","pulled","corn","gp","shaped","compression","seasonal","establishing","farmer","counters","puts","constitutional","grew","perfectly","tin","slave","instantly","cultures","norfolk","coaching","examined","trek","encoding","litigation","submissions","oem","heroes","painted","lycos","ir","zdnet","broadcasting","horizontal","artwork","cosmetic","resulted","portrait","terrorist","informational","ethical","carriers","ecommerce","mobility","floral","builders","ties","struggle","schemes","suffering","neutral","fisher","rat","spears","prospective","bedding","ultimately","joining","heading","equally","artificial","bearing","spectacular","coordination","connector","brad","combo","seniors","worlds","guilty","affiliated","activation","naturally","haven","tablet","jury","dos","tail","subscribers","charm","lawn","violent","mitsubishi","underwear","basin","soup","potentially","ranch","constraints","crossing","inclusive","dimensional","cottage","drunk","considerable","crimes","resolved","mozilla","byte","toner","nose","latex","branches","anymore","oclc","delhi","holdings","alien","locator","selecting","processors","pantyhose","plc","broke","nepal","zimbabwe","difficulties","juan","complexity","msg","constantly","browsing","resolve","barcelona","presidential","documentary","cod","territories","melissa","moscow","thesis","thru","jews","nylon","palestinian","discs","rocky","bargains","frequent","trim","nigeria","ceiling","pixels","ensuring","hispanic","cv","cb","legislature","hospitality","gen","anybody","procurement","diamonds","espn","fleet","untitled","bunch","totals","marriott","singing","theoretical","afford","exercises","starring","referral","nhl","surveillance","optimal","quit","distinct","protocols","lung","highlight","substitute","inclusion","hopefully","brilliant","turner","sucking","cents","reuters","ti","fc","gel","todd","spoken","omega","evaluated","stayed","civic","assignments","fw","manuals","doug","sees","termination","watched","saver","thereof","grill","households","gs","redeem","rogers","grain","aaa","authentic","regime","wanna","wishes","bull","montgomery","architectural","louisville","depend","differ","macintosh","movements","ranging","monica","repairs","breath","amenities","virtually","cole","mart","candle","hanging","colored","authorization","tale","verified","lynn","formerly","projector","bp","situated","comparative","std","seeks","herbal","loving","strictly","routing","docs","stanley","psychological","surprised","retailer","vitamins","elegant","gains","renewal","vid","genealogy","opposed","deemed","scoring","expenditure","brooklyn","liverpool","sisters","critics","connectivity","spots","oo","algorithms","hacker","madrid","similarly","margin","coin","solely","fake","salon","collaborative","norman","fda","excluding","turbo","headed","voters","cure","madonna","commander","arch","ni","murphy","thinks","thats","suggestion","hdtv","soldier","phillips","asin","aimed","justin","bomb","harm","interval","mirrors","spotlight","tricks","reset","brush","investigate","thy","expansys","panels","repeated","assault","connecting","spare","logistics","deer","kodak","tongue","bowling","tri","danish","pal","monkey","proportion","filename","skirt","florence","invest","honey","um","analyses","drawings","significance","scenario","ye","fs","lovers","atomic","approx","symposium","arabic","gauge","essentials","junction","protecting","nn","faced","mat","rachel","solving","transmitted","weekends","screenshots","produces","oven","ted","intensive","chains","kingston","sixth","engage","deviant","noon","switching","quoted","adapters","correspondence","farms","imports","supervision","cheat","bronze","expenditures","sandy","separation","testimony","suspect","celebrities","macro","sender","mandatory","boundaries","crucial","syndication","gym","celebration","kde","adjacent","filtering","tuition","spouse","exotic","viewer","signup","threats","luxembourg","puzzles","reaching","vb","damaged","cams","receptor","laugh","joel","surgical","destroy","citation","pitch","autos","yo","premises","perry","proved","offensive","imperial","dozen","benjamin","deployment","teeth","cloth","studying","colleagues","stamp","lotus","salmon","olympus","separated","proc","cargo","tan","directive","fx","salem","mate","dl","starter","upgrades","likes","butter","pepper","weapon","luggage","burden","chef","tapes","zones","races","isle","stylish","slim","maple","luke","grocery","offshore","governing","retailers","depot","kenneth","comp","alt","pie","blend","harrison","ls","julie","occasionally","cbs","attending","emission","pete","spec","finest","realty","janet","bow","penn","recruiting","apparent","instructional","phpbb","autumn","traveling","probe","midi","permissions","biotechnology","toilet","ranked","jackets","routes","packed","excited","outreach","helen","mounting","recover","tied","lopez","balanced","prescribed","catherine","timely","talked","upskirts","debug","delayed","chuck","reproduced","hon","dale","explicit","calculation","villas","ebook","consolidated","exclude","peeing","occasions","brooks","equations","newton","oils","sept","exceptional","anxiety","bingo","whilst","spatial","respondents","unto","lt","ceramic","prompt","precious","minds","annually","considerations","scanners","atm","xanax","eq","pays","fingers","sunny","ebooks","delivers","je","queensland","necklace","musicians","leeds","composite","unavailable","cedar","arranged","lang","theaters","advocacy","raleigh","stud","fold","essentially","designing","threaded","uv","qualify","blair","hopes","assessments","cms","mason","diagram","burns","pumps","footwear","sg","vic","beijing","peoples","victor","mario","pos","attach","licenses","utils","removing","advised","brunswick","spider","phys","ranges","pairs","sensitivity","trails","preservation","hudson","isolated","calgary","interim","assisted","divine","streaming","approve","chose","compound","intensity","technological","syndicate","abortion","dialog","venues","blast","wellness","calcium","newport","antivirus","addressing","pole","discounted","indians","shield","harvest","membrane","prague","previews","bangladesh","constitute","locally","concluded","pickup","desperate","mothers","nascar","iceland","demonstration","governmental","manufactured","candles","graduation","mega","bend","sailing","variations","moms","sacred","addiction","morocco","chrome","tommy","springfield","refused","brake","exterior","greeting","ecology","oliver","congo","glen","botswana","nav","delays","synthesis","olive","undefined","unemployment","cyber","verizon","scored","enhancement","newcastle","clone","dicks","velocity","lambda","relay","composed","tears","performances","oasis","baseline","cab","angry","fa","societies","silicon","brazilian","identical","petroleum","compete","ist","norwegian","lover","belong","honolulu","beatles","lips","retention","exchanges","pond","rolls","thomson","barnes","soundtrack","wondering","malta","daddy","lc","ferry","rabbit","profession","seating","dam","cnn","separately","physiology","lil","collecting","das","exports","omaha","tire","participant","scholarships","recreational","dominican","chad","electron","loads","friendship","heather","passport","motel","unions","treasury","warrant","sys","solaris","frozen","occupied","josh","royalty","scales","rally","observer","sunshine","strain","drag","ceremony","somehow","arrested","expanding","provincial","investigations","icq","ripe","yamaha","rely","medications","hebrew","gained","rochester","dying","laundry","stuck","solomon","placing","stops","homework","adjust","assessed","advertiser","enabling","encryption","filling","downloadable","sophisticated","imposed","silence","scsi","focuses","soviet","possession","cu","laboratories","treaty","vocal","trainer","organ","stronger","volumes","advances","vegetables","lemon","toxic","dns","thumbnails","darkness","pty","ws","nuts","nail","bizrate","vienna","implied","span","stanford","sox","stockings","joke","respondent","packing","statute","rejected","satisfy","destroyed","shelter","chapel","gamespot","manufacture","layers","wordpress","guided","vulnerability","accountability","celebrate","accredited","appliance","compressed","bahamas","powell","mixture","bench","univ","tub","rider","scheduling","radius","perspectives","mortality","logging","hampton","christians","borders","therapeutic","pads","butts","inns","bobby","impressive","sheep","accordingly","architect","railroad","lectures","challenging","wines","nursery","harder","cups","ash","microwave","cheapest","accidents","travesti","relocation","stuart","contributors","salvador","ali","salad","np","monroe","tender","violations","foam","temperatures","paste","clouds","competitions","discretion","tft","tanzania","preserve","jvc","poem","unsigned","staying","cosmetics","easter","theories","repository","praise","jeremy","venice","jo","concentrations","vibrators","estonia","christianity","veteran","streams","landing","signing","executed","katie","negotiations","realistic","dt","cgi","showcase","integral","asks","relax","namibia","generating","christina","congressional","synopsis","hardly","prairie","reunion","composer","bean","sword","absent","photographic","sells","ecuador","hoping","accessed","spirits","modifications","coral","pixel","float","colin","bias","imported","paths","bubble","por","acquire","contrary","millennium","tribune","vessel","acids","focusing","viruses","cheaper","admitted","dairy","admit","mem","fancy","equality","samoa","gc","achieving","tap","stickers","fisheries","exceptions","reactions","leasing","lauren","beliefs","ci","macromedia","companion","squad","analyze","ashley","scroll","relate","divisions","swim","wages","additionally","suffer","forests","fellowship","nano","invalid","concerts","martial","males","victorian","retain","colours","execute","tunnel","genres","cambodia","patents","copyrights","yn","chaos","lithuania","mastercard","wheat","chronicles","obtaining","beaver","updating","distribute","readings","decorative","kijiji","confused","compiler","enlargement","eagles","bases","vii","accused","bee","campaigns","unity","loud","conjunction","bride","rats","defines","airports","instances","indigenous","begun","cfr","brunette","packets","anchor","socks","validation","parade","corruption","stat","trigger","incentives","cholesterol","gathered","essex","slovenia","notified","differential","beaches","folders","dramatic","surfaces","terrible","routers","cruz","pendant","dresses","baptist","scientist","starsmerchant","hiring","clocks","arthritis","bios","females","wallace","nevertheless","reflects","taxation","fever","pmc","cuisine","surely","practitioners","transcript","myspace","theorem","inflation","thee","nb","ruth","pray","stylus","compounds","pope","drums","contracting","arnold","structured","reasonably","jeep","chicks","bare","hung","cattle","mba","radical","graduates","rover","recommends","controlling","treasure","reload","distributors","flame","levitra","tanks","assuming","monetary","elderly","pit","arlington","mono","particles","floating","extraordinary","tile","indicating","bolivia","spell","hottest","stevens","coordinate","kuwait","exclusively","emily","alleged","limitation","widescreen","compile","squirting","webster","struck","rx","illustration","plymouth","warnings","construct","apps","inquiries","bridal","annex","mag","gsm","inspiration","tribal","curious","affecting","freight","rebate","meetup","eclipse","sudan","ddr","downloading","rec","shuttle","aggregate","stunning","cycles","affects","forecasts","detect","actively","ciao","ampland","knee","prep","pb","complicated","chem","fastest","butler","shopzilla","injured","decorating","payroll","cookbook","expressions","ton","courier","uploaded","shakespeare","hints","collapse","americas","connectors","twinks","unlikely","oe","gif","pros","conflicts","techno","beverage","tribute","wired","elvis","immune","latvia","travelers","forestry","barriers","cant","jd","rarely","gpl","infected","offerings","martha","genesis","barrier","argue","incorrect","trains","metals","bicycle","furnishings","letting","arise","guatemala","celtic","thereby","irc","jamie","particle","perception","minerals","advise","humidity","bottles","boxing","wy","dm","bangkok","renaissance","pathology","sara","bra","ordinance","hughes","photographers","infections","jeffrey","chess","operates","brisbane","configured","survive","oscar","festivals","menus","joan","possibilities","duck","reveal","canal","amino","phi","contributing","herbs","clinics","mls","cow","manitoba","analytical","missions","watson","lying","costumes","strict","dive","saddam","circulation","drill","offense","bryan","cet","protest","assumption","jerusalem","hobby","tries","transexuales","invention","nickname","fiji","technician","inline","executives","enquiries","washing","audi","staffing","cognitive","exploring","trick","enquiry","closure","raid","ppc","timber","volt","intense","div","playlist","registrar","showers","supporters","ruling","steady","dirt","statutes","withdrawal","myers","drops","predicted","wider","saskatchewan","jc","cancellation","plugins","enrolled","sensors","screw","ministers","publicly","hourly","blame","geneva","freebsd","veterinary","acer","prostores","reseller","dist","handed","suffered","intake","informal","relevance","incentive","butterfly","tucson","mechanics","heavily","swingers","fifty","headers","mistakes","numerical","ons","geek","uncle","defining","xnxx","counting","reflection","sink","accompanied","assure","invitation","devoted","princeton","jacob","sodium","randy","spirituality","hormone","meanwhile","proprietary","timothy","childrens","brick","grip","naval","thumbzilla","medieval","porcelain","avi","bridges","pichunter","captured","watt","thehun","decent","casting","dayton","translated","shortly","cameron","columnists","pins","carlos","reno","donna","andreas","warrior","diploma","cabin","innocent","scanning","ide","consensus","polo","valium","copying","rpg","delivering","cordless","patricia","horn","eddie","uganda","fired","journalism","pd","prot","trivia","adidas","perth","frog","grammar","intention","syria","disagree","klein","harvey","tires","logs","undertaken","tgp","hazard","retro","leo","livesex","statewide","semiconductor","gregory","episodes","boolean","circular","anger","diy","mainland","illustrations","suits","chances","interact","snap","happiness","arg","substantially","bizarre","glenn","ur","auckland","olympics","fruits","identifier","geo","worldsex","ribbon","calculations","doe","jpeg","conducting","startup","suzuki","trinidad","ati","kissing","wal","handy","swap","exempt","crops","reduces","accomplished","calculators","geometry","impression","abs","slovakia","flip","guild","correlation","gorgeous","capitol","sim","dishes","rna","barbados","chrysler","nervous","refuse","extends","fragrance","mcdonald","replica","plumbing","brussels","tribe","neighbors","trades","superb","buzz","transparent","nuke","rid","trinity","charleston","handled","legends","boom","calm","champions","floors","selections","projectors","inappropriate","exhaust","comparing","shanghai","speaks","burton","vocational","davidson","copied","scotia","farming","gibson","pharmacies","fork","troy","ln","roller","introducing","batch","organize","appreciated","alter","nicole","latino","ghana","edges","uc","mixing","handles","skilled","fitted","albuquerque","harmony","distinguished","asthma","projected","assumptions","shareholders","twins","developmental","rip","zope","regulated","triangle","amend","anticipated","oriental","reward","windsor","zambia","completing","gmbh","buf","ld","hydrogen","webshots","sprint","comparable","chick","advocate","sims","confusion","copyrighted","tray","inputs","warranties","genome","escorts","documented","thong","medal","paperbacks","coaches","vessels","harbour","walks","sol","keyboards","sage","knives","eco","vulnerable","arrange","artistic","bat","honors","booth","indie","reflected","unified","bones","breed","detector","ignored","polar","fallen","precise","sussex","respiratory","notifications","msgid","transexual","mainstream","invoice","evaluating","lip","subcommittee","sap","gather","suse","maternity","backed","alfred","colonial","mf","carey","motels","forming","embassy","cave","journalists","danny","rebecca","slight","proceeds","indirect","amongst","wool","foundations","msgstr","arrest","volleyball","mw","adipex","horizon","nu","deeply","toolbox","ict","marina","liabilities","prizes","bosnia","browsers","decreased","patio","dp","tolerance","surfing","creativity","lloyd","describing","optics","pursue","lightning","overcome","eyed","ou","quotations","grab","inspector","attract","brighton","beans","bookmarks","ellis","disable","snake","succeed","leonard","lending","oops","reminder","xi","searched","behavioral","riverside","bathrooms","plains","sku","ht","raymond","insights","abilities","initiated","sullivan","za","midwest","karaoke","trap","lonely","fool","ve","nonprofit","lancaster","suspended","hereby","observe","julia","containers","attitudes","karl","berry","collar","simultaneously","racial","integrate","bermuda","amanda","sociology","mobiles","screenshot","exhibitions","kelkoo","confident","retrieved","exhibits","officially","consortium","dies","terrace","bacteria","pts","replied","seafood","novels","rh","rrp","recipients","ought","delicious","traditions","fg","jail","safely","finite","kidney","periodically","fixes","sends","durable","mazda","allied","throws","moisture","hungarian","roster","referring","symantec","spencer","wichita","nasdaq","uruguay","ooo","hz","transform","timer","tablets","tuning","gotten","educators","tyler","futures","vegetable","verse","highs","humanities","independently","wanting","custody","scratch","launches","ipaq","alignment","masturbating","henderson","bk","britannica","comm","ellen","competitors","nhs","rocket","aye","bullet","towers","racks","lace","nasty","visibility","latitude","consciousness","ste","tumor","ugly","deposits","beverly","mistress","encounter","trustees","watts","duncan","reprints","hart","bernard","resolutions","ment","accessing","forty","tubes","attempted","col","midlands","priest","floyd","ronald","analysts","queue","dx","sk","trance","locale","nicholas","biol","yu","bundle","hammer","invasion","witnesses","runner","rows","administered","notion","sq","skins","mailed","oc","fujitsu","spelling","arctic","exams","rewards","beneath","strengthen","defend","aj","frederick","medicaid","treo","infrared","seventh","gods","une","welsh","belly","aggressive","tex","advertisements","quarters","stolen","cia","sublimedirectory","soonest","haiti","disturbed","determines","sculpture","poly","ears","dod","wp","fist","naturals","neo","motivation","lenders","pharmacology","fitting","fixtures","bloggers","mere","agrees","passengers","quantities","petersburg","consistently","powerpoint","cons","surplus","elder","sonic","obituaries","cheers","dig","taxi","punishment","appreciation","subsequently","om","belarus","nat","zoning","gravity","providence","thumb","restriction","incorporate","backgrounds","treasurer","guitars","essence","flooring","lightweight","ethiopia","tp","mighty","athletes","humanity","transcription","jm","holmes","complications","scholars","dpi","scripting","gis","remembered","galaxy","chester","snapshot","caring","loc","worn","synthetic","shaw","vp","segments","testament","expo","dominant","twist","specifics","itunes","stomach","partially","buried","cn","newbie","minimize","darwin","ranks","wilderness","debut","generations","tournaments","bradley","deny","anatomy","bali","judy","sponsorship","headphones","fraction","trio","proceeding","cube","defects","volkswagen","uncertainty","breakdown","milton","marker","reconstruction","subsidiary","strengths","clarity","rugs","sandra","adelaide","encouraging","furnished","monaco","settled","folding","emirates","terrorists","airfare","comparisons","beneficial","distributions","vaccine","belize","fate","viewpicture","promised","volvo","penny","robust","bookings","threatened","minolta","republicans","discusses","gui","porter","gras","jungle","ver","rn","responded","rim","abstracts","zen","ivory","alpine","dis","prediction","pharmaceuticals","andale","fabulous","remix","alias","thesaurus","individually","battlefield","literally","newer","kay","ecological","spice","oval","implies","cg","soma","ser","cooler","appraisal","consisting","maritime","periodic","submitting","overhead","ascii","prospect","shipment","breeding","citations","geographical","donor","mozambique","tension","href","benz","trash","shapes","wifi","tier","fwd","earl","manor","envelope","diane","homeland","disclaimers","championships","excluded","andrea","breeds","rapids","disco","sheffield","bailey","aus","endif","finishing","emotions","wellington","incoming","prospects","lexmark","cleaners","bulgarian","hwy","eternal","cashiers","guam","cite","aboriginal","remarkable","rotation","nam","preventing","productive","boulevard","eugene","ix","gdp","pig","metric","compliant","minus","penalties","bennett","imagination","hotmail","refurbished","joshua","armenia","varied","grande","closest","activated","actress","mess","conferencing","assign","armstrong","politicians","trackbacks","lit","accommodate","tigers","aurora","una","slides","milan","premiere","lender","villages","shade","chorus","christine","rhythm","digit","argued","dietary","symphony","clarke","sudden","accepting","precipitation","marilyn","lions","findlaw","ada","pools","tb","lyric","claire","isolation","speeds","sustained","matched","approximate","rope","carroll","rational","programmer","fighters","chambers","dump","greetings","inherited","warming","incomplete","vocals","chronicle","fountain","chubby","grave","legitimate","biographies","burner","yrs","foo","investigator","gba","plaintiff","finnish","gentle","bm","prisoners","deeper","muslims","hose","mediterranean","nightlife","footage","howto","worthy","reveals","architects","saints","entrepreneur","carries","sig","freelance","duo","excessive","devon","screensaver","helena","saves","regarded","valuation","unexpected","cigarette","fog","characteristic","marion","lobby","egyptian","tunisia","metallica","outlined","consequently","headline","treating","punch","appointments","str","gotta","cowboy","narrative","bahrain","enormous","karma","consist","betty","queens","academics","pubs","quantitative","shemales","lucas","screensavers","subdivision","tribes","vip","defeat","clicks","distinction","honduras","naughty","hazards","insured","harper","livestock","mardi","exemption","tenant","sustainability","cabinets","tattoo","shake","algebra","shadows","holly","formatting","silly","nutritional","yea","mercy","hartford","freely","marcus","sunrise","wrapping","mild","fur","nicaragua","weblogs","timeline","tar","belongs","rj","readily","affiliation","soc","fence","nudist","infinite","diana","ensures","relatives","lindsay","clan","legally","shame","satisfactory","revolutionary","bracelets","sync","civilian","telephony","mesa","fatal","remedy","realtors","breathing","briefly","thickness","adjustments","graphical","genius","discussing","aerospace","fighter","meaningful","flesh","retreat","adapted","barely","wherever","estates","rug","democrat","borough","maintains","failing","shortcuts","ka","retained","voyeurweb","pamela","andrews","marble","extending","jesse","specifies","hull","logitech","surrey","briefing","belkin","dem","accreditation","wav","blackberry","highland","meditation","modular","microphone","macedonia","combining","brandon","instrumental","giants","organizing","shed","balloon","moderators","winston","memo","ham","solved","tide","kazakhstan","hawaiian","standings","partition","invisible","gratuit","consoles","funk","fbi","qatar","magnet","translations","porsche","cayman","jaguar","reel","sheer","commodity","posing","kilometers","rp","bind","thanksgiving","rand","hopkins","urgent","guarantees","infants","gothic","cylinder","witch","buck","indication","eh","congratulations","tba","cohen","sie","usgs","puppy","kathy","acre","graphs","surround","cigarettes","revenge","expires","enemies","lows","controllers","aqua","chen","emma","consultancy","finances","accepts","enjoying","conventions","eva","patrol","smell","pest","hc","italiano","coordinates","rca","fp","carnival","roughly","sticker","promises","responding","reef","physically","divide","stakeholders","hydrocodone","gst","consecutive","cornell","satin","bon","deserve","attempting","mailto","promo","jj","representations","chan","worried","tunes","garbage","competing","combines","mas","beth","bradford","len","phrases","kai","peninsula","chelsea","boring","reynolds","dom","jill","accurately","speeches","reaches","schema","considers","sofa","catalogs","ministries","vacancies","quizzes","parliamentary","obj","prefix","lucia","savannah","barrel","typing","nerve","dans","planets","deficit","boulder","pointing","renew","coupled","viii","myanmar","metadata","harold","circuits","floppy","texture","handbags","jar","ev","somerset","incurred","acknowledge","thoroughly","antigua","nottingham","thunder","tent","caution","identifies","questionnaire","qualification","locks","modelling","namely","miniature","dept","hack","dare","euros","interstate","pirates","aerial","hawk","consequence","rebel","systematic","perceived","origins","hired","makeup","textile","lamb","madagascar","nathan","tobago","presenting","cos","troubleshooting","uzbekistan","indexes","pac","rl","erp","centuries","gl","magnitude","ui","richardson","hindu","dh","fragrances","vocabulary","licking","earthquake","vpn","fundraising","fcc","markers","weights","albania","geological","assessing","lasting","wicked","eds","introduces","kills","roommate","webcams","pushed","webmasters","ro","df","computational","acdbentity","participated","junk","handhelds","wax","lucy","answering","hans","impressed","slope","reggae","failures","poet","conspiracy","surname","theology","nails","evident","whats","rides","rehab","epic","saturn","organizer","nut","allergy","sake","twisted","combinations","preceding","merit","enzyme","cumulative","zshops","planes","edmonton","tackle","disks","condo","pokemon","amplifier","ambien","arbitrary","prominent","retrieve","lexington","vernon","sans","worldcat","titanium","irs","fairy","builds","contacted","shaft","lean","bye","cdt","recorders","occasional","leslie","casio","deutsche","ana","postings","innovations","kitty","postcards","dude","drain","monte","fires","algeria","blessed","luis","reviewing","cardiff","cornwall","favors","potato","panic","explicitly","sticks","leone","transsexual","ez","citizenship","excuse","reforms","basement","onion","strand","pf","sandwich","uw","lawsuit","alto","informative","girlfriend","bloomberg","cheque","hierarchy","influenced","banners","reject","eau","abandoned","bd","circles","italic","beats","merry","mil","scuba","gore","complement","cult","dash","passive","mauritius","valued","cage","checklist","bangbus","requesting","courage","verde","lauderdale","scenarios","gazette","hitachi","divx","extraction","batman","elevation","hearings","coleman","hugh","lap","utilization","beverages","calibration","jake","eval","efficiently","anaheim","ping","textbook","dried","entertaining","prerequisite","luther","frontier","settle","stopping","refugees","knights","hypothesis","palmer","medicines","flux","derby","sao","peaceful","altered","pontiac","regression","doctrine","scenic","trainers","muze","enhancements","renewable","intersection","passwords","sewing","consistency","collectors","conclude","recognised","munich","oman","celebs","gmc","propose","hh","azerbaijan","lighter","rage","adsl","uh","prix","astrology","advisors","pavilion","tactics","trusts","occurring","supplemental","travelling","talented","annie","pillow","induction","derek","precisely","shorter","harley","spreading","provinces","relying","finals","paraguay","steal","parcel","refined","fd","bo","fifteen","widespread","incidence","fears","predict","boutique","acrylic","rolled","tuner","avon","incidents","peterson","rays","asn","shannon","toddler","enhancing","flavor","alike","walt","homeless","horrible","hungry","metallic","acne","blocked","interference","warriors","palestine","listprice","libs","undo","cadillac","atmospheric","malawi","wm","pk","sagem","knowledgestorm","dana","halo","ppm","curtis","parental","referenced","strikes","lesser","publicity","marathon","ant","proposition","gays","pressing","gasoline","apt","dressed","scout","belfast","exec","dealt","niagara","inf","eos","warcraft","charms","catalyst","trader","bucks","allowance","vcr","denial","uri","designation","thrown","prepaid","raises","gem","duplicate","electro","criterion","badge","wrist","civilization","analyzed","vietnamese","heath","tremendous","ballot","lexus","varying","remedies","validity","trustee","maui","handjobs","weighted","angola","squirt","performs","plastics","realm","corrected","jenny","helmet","salaries","postcard","elephant","yemen","encountered","tsunami","scholar","nickel","internationally","surrounded","psi","buses","expedia","geology","pct","wb","creatures","coating","commented","wallet","cleared","smilies","vids","accomplish","boating","drainage","shakira","corners","broader","vegetarian","rouge","yeast","yale","newfoundland","sn","qld","pas","clearing","investigated","dk","ambassador","coated","intend","stephanie","contacting","vegetation","doom","findarticles","louise","kenny","specially","owen","routines","hitting","yukon","beings","bite","issn","aquatic","reliance","habits","striking","myth","infectious","podcasts","singh","gig","gilbert","sas","ferrari","continuity","brook","fu","outputs","phenomenon","ensemble","insulin","assured","biblical","weed","conscious","accent","mysimon","eleven","wives","ambient","utilize","mileage","oecd","prostate","adaptor","auburn","unlock","hyundai","pledge","vampire","angela","relates","nitrogen","xerox","dice","merger","softball","referrals","quad","dock","differently","firewire","mods","nextel","framing","organised","musician","blocking","rwanda","sorts","integrating","vsnet","limiting","dispatch","revisions","papua","restored","hint","armor","riders","chargers","remark","dozens","varies","msie","reasoning","wn","liz","rendered","picking","charitable","guards","annotated","ccd","sv","convinced","openings","buys","burlington","replacing","researcher","watershed","councils","occupations","acknowledged","kruger","pockets","granny","pork","zu","equilibrium","viral","inquire","pipes","characterized","laden","aruba","cottages","realtor","merge","privilege","edgar","develops","qualifying","chassis","dubai","estimation","barn","pushing","llp","fleece","pediatric","boc","fare","dg","asus","pierce","allan","dressing","techrepublic","sperm","vg","bald","filme","craps","fuji","frost","leon","institutes","mold","dame","fo","sally","yacht","tracy","prefers","drilling","brochures","herb","tmp","alot","ate","breach","whale","traveller","appropriations","suspected","tomatoes","benchmark","beginners","instructors","highlighted","bedford","stationery","idle","mustang","unauthorized","clusters","antibody","competent","momentum","fin","wiring","io","pastor","mud","calvin","uni","shark","contributor","demonstrates","phases","grateful","emerald","gradually","laughing","grows","cliff","desirable","tract","ul","ballet","ol","journalist","abraham","js","bumper","afterwards","webpage","religions","garlic","hostels","shine","senegal","explosion","pn","banned","wendy","briefs","signatures","diffs","cove","mumbai","ozone","disciplines","casa","mu","daughters","conversations","radios","tariff","nvidia","opponent","pasta","simplified","muscles","serum","wrapped","swift","motherboard","runtime","inbox","focal","bibliographic","eden","distant","incl","champagne","ala","decimal","hq","deviation","superintendent","propecia","dip","nbc","samba","hostel","housewives","employ","mongolia","penguin","magical","influences","inspections","irrigation","miracle","manually","reprint","reid","wt","hydraulic","centered","robertson","flex","yearly","penetration","wound","belle","rosa","conviction","hash","omissions","writings","hamburg","lazy","mv","mpg","retrieval","qualities","cindy","fathers","carb","charging","cas","marvel","lined","cio","dow","prototype","importantly","rb","petite","apparatus","upc","terrain","dui","pens","explaining","yen","strips","gossip","rangers","nomination","empirical","mh","rotary","worm","dependence","discrete","beginner","boxed","lid","sexuality","polyester","cubic","deaf","commitments","suggesting","sapphire","kinase","skirts","mats","remainder","crawford","labeled","privileges","televisions","specializing","marking","commodities","pvc","serbia","sheriff","griffin","declined","guyana","spies","blah","mime","neighbor","motorcycles","elect","highways","thinkpad","concentrate","intimate","reproductive","preston","deadly","feof","bunny","chevy","molecules","rounds","longest","refrigerator","tions","intervals","sentences","dentists","usda","exclusion","workstation","holocaust","keen","flyer","peas","dosage","receivers","urls","customise","disposition","variance","navigator","investigators","cameroon","baking","marijuana","adaptive","computed","needle","baths","enb","gg","cathedral","brakes","og","nirvana","ko","fairfield","owns","til","invision","sticky","destiny","generous","madness","emacs","climb","blowing","fascinating","landscapes","heated","lafayette","jackie","wto","computation","hay","cardiovascular","ww","sparc","cardiac","salvation","dover","adrian","predictions","accompanying","vatican","brutal","learners","gd","selective","arbitration","configuring","token","editorials","zinc","sacrifice","seekers","guru","isa","removable","convergence","yields","gibraltar","levy","suited","numeric","anthropology","skating","kinda","aberdeen","emperor","grad","malpractice","dylan","bras","belts","blacks","educated","rebates","reporters","burke","proudly","pix","necessity","rendering","mic","inserted","pulling","basename","kyle","obesity","curves","suburban","touring","clara","vertex","bw","hepatitis","nationally","tomato","andorra","waterproof","expired","mj","travels","flush","waiver","pale","specialties","hayes","humanitarian","invitations","functioning","delight","survivor","garcia","cingular","economies","alexandria","bacterial","moses","counted","undertake","declare","continuously","johns","valves","gaps","impaired","achievements","donors","tear","jewel","teddy","lf","convertible","ata","teaches","ventures","nil","bufing","stranger","tragedy","julian","nest","pam","dryer","painful","velvet","tribunal","ruled","nato","pensions","prayers","funky","secretariat","nowhere","cop","paragraphs","gale","joins","adolescent","nominations","wesley","dim","lately","cancelled","scary","mattress","mpegs","brunei","likewise","banana","introductory","slovak","cakes","stan","reservoir","occurrence","idol","mixer","remind","wc","worcester","sbjct","demographic","charming","mai","tooth","disciplinary","annoying","respected","stays","disclose","affair","drove","washer","upset","restrict","springer","beside","mines","portraits","rebound","logan","mentor","interpreted","evaluations","fought","baghdad","elimination","metres","hypothetical","immigrants","complimentary","helicopter","pencil","freeze","hk","performer","abu","titled","commissions","sphere","powerseller","moss","ratios","concord","graduated","endorsed","ty","surprising","walnut","lance","ladder","italia","unnecessary","dramatically","liberia","sherman","cork","maximize","cj","hansen","senators","workout","mali","yugoslavia","bleeding","characterization","colon","likelihood","lanes","purse","fundamentals","contamination","mtv","endangered","compromise","masturbation","optimize","stating","dome","caroline","leu","expiration","namespace","align","peripheral","bless","engaging","negotiation","crest","opponents","triumph","nominated","confidentiality","electoral","changelog","welding","deferred","alternatively","heel","alloy","condos","plots","polished","yang","gently","greensboro","tulsa","locking","casey","controversial","draws","fridge","blanket","bloom","qc","simpsons","lou","elliott","recovered","fraser","justify","upgrading","blades","pgp","loops","surge","frontpage","trauma","aw","tahoe","advert","possess","demanding","defensive","sip","flashers","subaru","forbidden","tf","vanilla","programmers","pj","monitored","installations","deutschland","picnic","souls","arrivals","spank","cw","practitioner","motivated","wr","dumb","smithsonian","hollow","vault","securely","examining","fioricet","groove","revelation","rg","pursuit","delegation","wires","bl","dictionaries","mails","backing","greenhouse","sleeps","vc","blake","transparency","dee","travis","wx","endless","figured","orbit","currencies","niger","bacon","survivors","positioning","heater","colony","cannon","circus","promoted","forbes","mae","moldova","mel","descending","paxil","spine","trout","enclosed","feat","temporarily","ntsc","cooked","thriller","transmit","apnic","fatty","gerald","pressed","frequencies","scanned","reflections","hunger","mariah","sic","municipality","usps","joyce","detective","surgeon","cement","experiencing","fireplace","endorsement","bg","planners","disputes","textiles","missile","intranet","closes","seq","psychiatry","persistent","deborah","conf","marco","assists","summaries","glow","gabriel","auditor","wma","aquarium","violin","prophet","cir","bracket","looksmart","isaac","oxide","oaks","magnificent","erik","colleague","naples","promptly","modems","adaptation","hu","harmful","paintball","prozac","sexually","enclosure","acm","dividend","newark","kw","paso","glucose","phantom","norm","playback","supervisors","westminster","turtle","ips","distances","absorption","treasures","dsc","warned","neural","ware","fossil","mia","hometown","badly","transcripts","apollo","wan","disappointed","persian","continually","communist","collectible","handmade","greene","entrepreneurs","robots","grenada","creations","jade","scoop","acquisitions","foul","keno","gtk","earning","mailman","sanyo","nested","biodiversity","excitement","somalia","movers","verbal","blink","presently","seas","carlo","workflow","mysterious","novelty","bryant","tiles","voyuer","librarian","subsidiaries","switched","stockholm","tamil","garmin","ru","pose","fuzzy","indonesian","grams","therapist","richards","mrna","budgets","toolkit","promising","relaxation","goat","render","carmen","ira","sen","thereafter","hardwood","erotica","temporal","sail","forge","commissioners","dense","dts","brave","forwarding","qt","awful","nightmare","airplane","reductions","southampton","istanbul","impose","organisms","sega","telescope","viewers","asbestos","portsmouth","cdna","meyer","enters","pod","savage","advancement","wu","harassment","willow","resumes","bolt","gage","throwing","existed","generators","lu","wagon","barbie","dat","favour","soa","knock","urge","smtp","generates","potatoes","thorough","replication","inexpensive","kurt","receptors","peers","roland","optimum","neon","interventions","quilt","huntington","creature","ours","mounts","syracuse","internship","lone","refresh","aluminium","snowboard","beastality","webcast","michel","evanescence","subtle","coordinated","notre","shipments","maldives","stripes","firmware","antarctica","cope","shepherd","lm","canberra","cradle","chancellor","mambo","lime","kirk","flour","controversy","legendary","bool","sympathy","choir","avoiding","beautifully","blond","expects","cho","jumping","fabrics","antibodies","polymer","hygiene","wit","poultry","virtue","burst","examinations","surgeons","bouquet","immunology","promotes","mandate","wiley","departmental","bbs","spas","ind","corpus","johnston","terminology","gentleman","fibre","reproduce","convicted","shades","jets","indices","roommates","adware","qui","intl","threatening","spokesman","zoloft","activists","frankfurt","prisoner","daisy","halifax","encourages","ultram","cursor","assembled","earliest","donated","stuffed","restructuring","insects","terminals","crude","morrison","maiden","simulations","cz","sufficiently","examines","viking","myrtle","bored","cleanup","yarn","knit","conditional","mug","crossword","bother","budapest","conceptual","knitting","attacked","hl","bhutan","liechtenstein","mating","compute","redhead","arrives","translator","automobiles","tractor","allah","continent","ob","unwrap","fares","longitude","resist","challenged","telecharger","hoped","pike","safer","insertion","instrumentation","ids","hugo","wagner","constraint","groundwater","touched","strengthening","cologne","gzip","wishing","ranger","smallest","insulation","newman","marsh","ricky","ctrl","scared","theta","infringement","bent","laos","subjective","monsters","asylum","lightbox","robbie","stake","cocktail","outlets","swaziland","varieties","arbor","mediawiki","configurations","poison",""];

/* 
 Ask for word suggestions that would fit in a certain pattern.
 The pattern is defined by using ?'s for the blank letters
 A maximum of three and a minimum of no words are returned.
 If the resulting set is more than three words, the resulting three 
 will be selected randomly.
 eg. "?x??r?" might suggest "jxword"
*/
function suggest(pattern) {
    pattern = pattern.toLowerCase();
    // First let's just consider words of the correct length
    let matches = words.filter(word => word.length === pattern.length);
    for (let i = 0; i < pattern.length; i++) {
        if (pattern[i] !== "?") {
            matches = matches.filter(word => word[i] === pattern[i]);
        }
    }
    if (matches.length <= 3) return matches;
    let result = [];
    for (let i = 0; i < 3; i++) {
        let index = Math.random() * matches.length;
        result.push(...matches.splice(index, 1));
    }
    return result;
}

/* src/Question.svelte generated by Svelte v3.46.4 */

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[16] = list[i];
	return child_ctx;
}

// (82:4) {:else}
function create_else_block$1(ctx) {
	let div;
	let t0_value = /*question*/ ctx[0].num + "";
	let t0;
	let t1;
	let t2_value = (/*question*/ ctx[0].question || "No question set") + "";
	let t2;
	let t3;
	let t4_value = /*question*/ ctx[0].answer + "";
	let t4;
	let t5;
	let mounted;
	let dispose;
	let if_block = /*suggestions*/ ctx[1].length && create_if_block_1$1(ctx);

	return {
		c() {
			div = element("div");
			t0 = text(t0_value);
			t1 = text(": ");
			t2 = text(t2_value);
			t3 = text(" ~ ");
			t4 = text(t4_value);
			t5 = space();
			if (if_block) if_block.c();
			attr(div, "class", "jxword-question svelte-1bhhin7");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t0);
			append(div, t1);
			append(div, t2);
			append(div, t3);
			append(div, t4);
			append(div, t5);
			if (if_block) if_block.m(div, null);

			if (!mounted) {
				dispose = listen(div, "dblclick", function () {
					if (is_function(/*editQuestion*/ ctx[3](/*question*/ ctx[0]))) /*editQuestion*/ ctx[3](/*question*/ ctx[0]).apply(this, arguments);
				});

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*question*/ 1 && t0_value !== (t0_value = /*question*/ ctx[0].num + "")) set_data(t0, t0_value);
			if (dirty & /*question*/ 1 && t2_value !== (t2_value = (/*question*/ ctx[0].question || "No question set") + "")) set_data(t2, t2_value);
			if (dirty & /*question*/ 1 && t4_value !== (t4_value = /*question*/ ctx[0].answer + "")) set_data(t4, t4_value);

			if (/*suggestions*/ ctx[1].length) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_1$1(ctx);
					if_block.c();
					if_block.m(div, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			if (if_block) if_block.d();
			mounted = false;
			dispose();
		}
	};
}

// (71:4) {#if question.editing}
function create_if_block$1(ctx) {
	let div3;
	let div0;
	let span;
	let t0_value = /*question*/ ctx[0].num + "";
	let t0;
	let t1;
	let input;
	let t2;
	let div1;
	let t3_value = /*question*/ ctx[0].answer + "";
	let t3;
	let t4;
	let div2;
	let mounted;
	let dispose;

	return {
		c() {
			div3 = element("div");
			div0 = element("div");
			span = element("span");
			t0 = text(t0_value);
			t1 = space();
			input = element("input");
			t2 = space();
			div1 = element("div");
			t3 = text(t3_value);
			t4 = space();
			div2 = element("div");
			div2.textContent = "Save";
			attr(div0, "class", "jxword-question-number");
			attr(input, "type", "text");
			attr(input, "class", "jxword-question-text");
			input.autofocus = true;
			attr(div1, "class", "jxword-question-answer");
			attr(div2, "class", "btn svelte-1bhhin7");
			attr(div3, "class", "jxword-question jxword-question-editing svelte-1bhhin7");
		},
		m(target, anchor) {
			insert(target, div3, anchor);
			append(div3, div0);
			append(div0, span);
			append(span, t0);
			append(div3, t1);
			append(div3, input);
			set_input_value(input, /*question*/ ctx[0].question);
			append(div3, t2);
			append(div3, div1);
			append(div1, t3);
			append(div3, t4);
			append(div3, div2);
			input.focus();

			if (!mounted) {
				dispose = [
					listen(input, "input", /*input_input_handler*/ ctx[12]),
					listen(input, "keydown", /*handleKeydown*/ ctx[5]),
					listen(div2, "click", function () {
						if (is_function(/*saveQuestion*/ ctx[4](/*question*/ ctx[0]))) /*saveQuestion*/ ctx[4](/*question*/ ctx[0]).apply(this, arguments);
					})
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*question*/ 1 && t0_value !== (t0_value = /*question*/ ctx[0].num + "")) set_data(t0, t0_value);

			if (dirty & /*question*/ 1 && input.value !== /*question*/ ctx[0].question) {
				set_input_value(input, /*question*/ ctx[0].question);
			}

			if (dirty & /*question*/ 1 && t3_value !== (t3_value = /*question*/ ctx[0].answer + "")) set_data(t3, t3_value);
		},
		d(detaching) {
			if (detaching) detach(div3);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (84:4) {#if suggestions.length}
function create_if_block_1$1(ctx) {
	let each_1_anchor;
	let each_value = /*suggestions*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*useSuggestion, suggestions*/ 66) {
				each_value = /*suggestions*/ ctx[1];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		d(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

// (85:8) {#each suggestions as suggestion}
function create_each_block$2(ctx) {
	let span;
	let t_value = /*suggestion*/ ctx[16] + "";
	let t;
	let mounted;
	let dispose;

	return {
		c() {
			span = element("span");
			t = text(t_value);
			attr(span, "class", "suggestion svelte-1bhhin7");
		},
		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t);

			if (!mounted) {
				dispose = listen(span, "click", function () {
					if (is_function(/*useSuggestion*/ ctx[6](/*suggestion*/ ctx[16]))) /*useSuggestion*/ ctx[6](/*suggestion*/ ctx[16]).apply(this, arguments);
				});

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*suggestions*/ 2 && t_value !== (t_value = /*suggestion*/ ctx[16] + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(span);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$4(ctx) {
	let main;

	function select_block_type(ctx, dirty) {
		if (/*question*/ ctx[0].editing) return create_if_block$1;
		return create_else_block$1;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			main = element("main");
			if_block.c();
			attr(main, "class", "svelte-1bhhin7");
			toggle_class(main, "current", /*is_current_question*/ ctx[2]);
		},
		m(target, anchor) {
			insert(target, main, anchor);
			if_block.m(main, null);
		},
		p(ctx, [dirty]) {
			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(main, null);
				}
			}

			if (dirty & /*is_current_question*/ 4) {
				toggle_class(main, "current", /*is_current_question*/ ctx[2]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(main);
			if_block.d();
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let $currentDirection;
	let $currentQuestion;
	let $questionsAcross;
	let $questionsDown;
	component_subscribe($$self, currentDirection, $$value => $$invalidate(10, $currentDirection = $$value));
	component_subscribe($$self, currentQuestion, $$value => $$invalidate(11, $currentQuestion = $$value));
	component_subscribe($$self, questionsAcross, $$value => $$invalidate(13, $questionsAcross = $$value));
	component_subscribe($$self, questionsDown, $$value => $$invalidate(14, $questionsDown = $$value));
	const dispatch = createEventDispatcher();
	let { questions_across = [] } = $$props;
	let { questions_down = [] } = $$props;
	let { question } = $$props;
	let { direction } = $$props;

	// Private props
	let suggestions = [];

	function editQuestion(question) {
		question.editing = true;
		isEditingQuestion.set(true);

		if (direction == "across") {
			questionsAcross.set(questions_across);
		} else {
			questionsDown.set(questions_down);
		}
	}

	function saveQuestion(question) {
		if (direction == "across") {
			questionsAcross.set(questions_across);
		} else {
			questionsDown.set(questions_down);
		}

		isEditingQuestion.set(false);
		question.editing = false;
		dispatch("save", { question, direction });
		dispatch("change");
	}

	function handleKeydown(e) {
		if (e.key == "Enter") {
			saveQuestion(question);
		}
	}

	function useSuggestion(suggestion) {
		suggestion = suggestion.toUpperCase();
		let qs = $questionsDown;

		if (question.direction === "across") {
			qs = $questionsAcross;
		}

		qs[qs.findIndex(q => q.num === question.num)];
		let q = qs.find(q => q.num === question.num);
		dispatch("update_question", { suggestion, question: q });
	}

	let is_current_question = false;

	function input_input_handler() {
		question.question = this.value;
		$$invalidate(0, question);
	}

	$$self.$$set = $$props => {
		if ('questions_across' in $$props) $$invalidate(7, questions_across = $$props.questions_across);
		if ('questions_down' in $$props) $$invalidate(8, questions_down = $$props.questions_down);
		if ('question' in $$props) $$invalidate(0, question = $$props.question);
		if ('direction' in $$props) $$invalidate(9, direction = $$props.direction);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*question, $currentQuestion, $currentDirection*/ 3073) {
			{
				let suggestion_query = question.answer.replace(/\ /g, "?");

				if (!suggestion_query.includes("?")) {
					$$invalidate(1, suggestions = []);
				} else {
					$$invalidate(1, suggestions = suggest(suggestion_query));
				}

				$$invalidate(2, is_current_question = $currentQuestion.num === question.num && $currentDirection === question.direction);
			}
		}
	};

	return [
		question,
		suggestions,
		is_current_question,
		editQuestion,
		saveQuestion,
		handleKeydown,
		useSuggestion,
		questions_across,
		questions_down,
		direction,
		$currentDirection,
		$currentQuestion,
		input_input_handler
	];
}

class Question extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
			questions_across: 7,
			questions_down: 8,
			question: 0,
			direction: 9
		});
	}
}

/* src/Questions.svelte generated by Svelte v3.46.4 */

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i];
	return child_ctx;
}

function get_each_context_1$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i];
	return child_ctx;
}

// (5:16) {#each questions_across as question}
function create_each_block_1$1(ctx) {
	let question;
	let current;

	question = new Question({
			props: {
				question: /*question*/ ctx[6],
				direction: "across",
				questions_across: /*questions_across*/ ctx[0]
			}
		});

	question.$on("change", /*change_handler*/ ctx[2]);
	question.$on("update_question", /*update_question_handler*/ ctx[3]);

	return {
		c() {
			create_component(question.$$.fragment);
		},
		m(target, anchor) {
			mount_component(question, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const question_changes = {};
			if (dirty & /*questions_across*/ 1) question_changes.question = /*question*/ ctx[6];
			if (dirty & /*questions_across*/ 1) question_changes.questions_across = /*questions_across*/ ctx[0];
			question.$set(question_changes);
		},
		i(local) {
			if (current) return;
			transition_in(question.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(question.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(question, detaching);
		}
	};
}

// (11:16) {#each questions_down as question}
function create_each_block$1(ctx) {
	let question;
	let current;

	question = new Question({
			props: {
				question: /*question*/ ctx[6],
				direction: "down",
				questions_down: /*questions_down*/ ctx[1]
			}
		});

	question.$on("change", /*change_handler_1*/ ctx[4]);
	question.$on("update_question", /*update_question_handler_1*/ ctx[5]);

	return {
		c() {
			create_component(question.$$.fragment);
		},
		m(target, anchor) {
			mount_component(question, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const question_changes = {};
			if (dirty & /*questions_down*/ 2) question_changes.question = /*question*/ ctx[6];
			if (dirty & /*questions_down*/ 2) question_changes.questions_down = /*questions_down*/ ctx[1];
			question.$set(question_changes);
		},
		i(local) {
			if (current) return;
			transition_in(question.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(question.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(question, detaching);
		}
	};
}

function create_fragment$3(ctx) {
	let main;
	let div2;
	let div0;
	let h40;
	let t1;
	let t2;
	let div1;
	let h41;
	let t4;
	let current;
	let each_value_1 = /*questions_across*/ ctx[0];
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
	}

	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
		each_blocks_1[i] = null;
	});

	let each_value = /*questions_down*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			main = element("main");
			div2 = element("div");
			div0 = element("div");
			h40 = element("h4");
			h40.textContent = "Across";
			t1 = space();

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t2 = space();
			div1 = element("div");
			h41 = element("h4");
			h41.textContent = "Down";
			t4 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(div0, "class", "jxword-questions-direction jxword-questions-across svelte-1jm0aq5");
			attr(div1, "class", "jxword-questions-direction jxword-questions-across svelte-1jm0aq5");
			attr(div2, "class", "jxword-questions svelte-1jm0aq5");
			attr(main, "class", "svelte-1jm0aq5");
		},
		m(target, anchor) {
			insert(target, main, anchor);
			append(main, div2);
			append(div2, div0);
			append(div0, h40);
			append(div0, t1);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(div0, null);
			}

			append(div2, t2);
			append(div2, div1);
			append(div1, h41);
			append(div1, t4);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div1, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (dirty & /*questions_across*/ 1) {
				each_value_1 = /*questions_across*/ ctx[0];
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
						transition_in(each_blocks_1[i], 1);
					} else {
						each_blocks_1[i] = create_each_block_1$1(child_ctx);
						each_blocks_1[i].c();
						transition_in(each_blocks_1[i], 1);
						each_blocks_1[i].m(div0, null);
					}
				}

				group_outros();

				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			if (dirty & /*questions_down*/ 2) {
				each_value = /*questions_down*/ ctx[1];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div1, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out_1(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value_1.length; i += 1) {
				transition_in(each_blocks_1[i]);
			}

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks_1 = each_blocks_1.filter(Boolean);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				transition_out(each_blocks_1[i]);
			}

			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(main);
			destroy_each(each_blocks_1, detaching);
			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let questions_across = [];
	let questions_down = [];

	questionsAcross.subscribe(value => {
		$$invalidate(0, questions_across = value);
	});

	questionsDown.subscribe(value => {
		$$invalidate(1, questions_down = value);
	});

	function change_handler(event) {
		bubble.call(this, $$self, event);
	}

	function update_question_handler(event) {
		bubble.call(this, $$self, event);
	}

	function change_handler_1(event) {
		bubble.call(this, $$self, event);
	}

	function update_question_handler_1(event) {
		bubble.call(this, $$self, event);
	}

	return [
		questions_across,
		questions_down,
		change_handler,
		update_question_handler,
		change_handler_1,
		update_question_handler_1
	];
}

class Questions extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});
	}
}

/* src/Grid.svelte generated by Svelte v3.46.4 */

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[60] = list[i];
	child_ctx[62] = i;
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[63] = list[i];
	child_ctx[65] = i;
	return child_ctx;
}

// (462:28) {:else}
function create_else_block(ctx) {
	let rect;
	let rect_y_value;
	let rect_x_value;
	let text_1;
	let t_value = /*letter*/ ctx[63] + "";
	let t;
	let text_1_x_value;
	let text_1_y_value;
	let mounted;
	let dispose;

	return {
		c() {
			rect = svg_element("rect");
			text_1 = svg_element("text");
			t = text(t_value);
			attr(rect, "class", "jxword-cell-rect svelte-1013j5m");
			attr(rect, "role", "cell");
			attr(rect, "tabindex", "-1");
			attr(rect, "aria-label", "");
			attr(rect, "y", rect_y_value = /*cellWidth*/ ctx[18] * /*y*/ ctx[62] + /*margin*/ ctx[9]);
			attr(rect, "x", rect_x_value = /*cellHeight*/ ctx[22] * /*x*/ ctx[65] + /*margin*/ ctx[9]);
			attr(rect, "width", /*cellWidth*/ ctx[18]);
			attr(rect, "height", /*cellHeight*/ ctx[22]);
			attr(rect, "stroke", /*innerBorderColour*/ ctx[11]);
			attr(rect, "stroke-width", /*innerBorderWidth*/ ctx[8]);
			attr(rect, "fill", /*backgroundColour*/ ctx[13]);
			attr(rect, "data-col", /*x*/ ctx[65]);
			attr(rect, "data-row", /*y*/ ctx[62]);
			attr(text_1, "id", "jxword-letter-" + /*x*/ ctx[65] + "-" + /*y*/ ctx[62]);
			attr(text_1, "x", text_1_x_value = /*cellWidth*/ ctx[18] * /*x*/ ctx[65] + /*margin*/ ctx[9] + /*cellWidth*/ ctx[18] / 2);
			attr(text_1, "y", text_1_y_value = /*cellHeight*/ ctx[22] * /*y*/ ctx[62] + /*margin*/ ctx[9] + /*cellHeight*/ ctx[22] - /*cellHeight*/ ctx[22] * 0.1);
			attr(text_1, "text-anchor", "middle");
			attr(text_1, "font-size", /*fontSize*/ ctx[20]);
			attr(text_1, "width", /*cellWidth*/ ctx[18]);
			attr(text_1, "class", "svelte-1013j5m");
		},
		m(target, anchor) {
			insert(target, rect, anchor);
			insert(target, text_1, anchor);
			append(text_1, t);

			if (!mounted) {
				dispose = [
					listen(rect, "focus", /*handleFocus*/ ctx[26]),
					listen(text_1, "focus", /*handleFocus*/ ctx[26])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*cellWidth, margin*/ 262656 && rect_y_value !== (rect_y_value = /*cellWidth*/ ctx[18] * /*y*/ ctx[62] + /*margin*/ ctx[9])) {
				attr(rect, "y", rect_y_value);
			}

			if (dirty[0] & /*cellHeight, margin*/ 4194816 && rect_x_value !== (rect_x_value = /*cellHeight*/ ctx[22] * /*x*/ ctx[65] + /*margin*/ ctx[9])) {
				attr(rect, "x", rect_x_value);
			}

			if (dirty[0] & /*cellWidth*/ 262144) {
				attr(rect, "width", /*cellWidth*/ ctx[18]);
			}

			if (dirty[0] & /*cellHeight*/ 4194304) {
				attr(rect, "height", /*cellHeight*/ ctx[22]);
			}

			if (dirty[0] & /*innerBorderColour*/ 2048) {
				attr(rect, "stroke", /*innerBorderColour*/ ctx[11]);
			}

			if (dirty[0] & /*innerBorderWidth*/ 256) {
				attr(rect, "stroke-width", /*innerBorderWidth*/ ctx[8]);
			}

			if (dirty[0] & /*backgroundColour*/ 8192) {
				attr(rect, "fill", /*backgroundColour*/ ctx[13]);
			}

			if (dirty[0] & /*grid*/ 1 && t_value !== (t_value = /*letter*/ ctx[63] + "")) set_data(t, t_value);

			if (dirty[0] & /*cellWidth, margin*/ 262656 && text_1_x_value !== (text_1_x_value = /*cellWidth*/ ctx[18] * /*x*/ ctx[65] + /*margin*/ ctx[9] + /*cellWidth*/ ctx[18] / 2)) {
				attr(text_1, "x", text_1_x_value);
			}

			if (dirty[0] & /*cellHeight, margin*/ 4194816 && text_1_y_value !== (text_1_y_value = /*cellHeight*/ ctx[22] * /*y*/ ctx[62] + /*margin*/ ctx[9] + /*cellHeight*/ ctx[22] - /*cellHeight*/ ctx[22] * 0.1)) {
				attr(text_1, "y", text_1_y_value);
			}

			if (dirty[0] & /*fontSize*/ 1048576) {
				attr(text_1, "font-size", /*fontSize*/ ctx[20]);
			}

			if (dirty[0] & /*cellWidth*/ 262144) {
				attr(text_1, "width", /*cellWidth*/ ctx[18]);
			}
		},
		d(detaching) {
			if (detaching) detach(rect);
			if (detaching) detach(text_1);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (457:28) {#if letter=="#"}
function create_if_block_1(ctx) {
	let rect;
	let rect_y_value;
	let rect_x_value;
	let line0;
	let line0_y__value;
	let line0_x__value;
	let line0_y__value_1;
	let line0_x__value_1;
	let line1;
	let line1_y__value;
	let line1_x__value;
	let line1_y__value_1;
	let line1_x__value_1;
	let line1_transform_value;
	let mounted;
	let dispose;

	return {
		c() {
			rect = svg_element("rect");
			line0 = svg_element("line");
			line1 = svg_element("line");
			attr(rect, "class", "jxword-cell-rect svelte-1013j5m");
			attr(rect, "role", "cell");
			attr(rect, "tabindex", "-1");
			attr(rect, "aria-label", "blank");
			attr(rect, "y", rect_y_value = /*cellWidth*/ ctx[18] * /*y*/ ctx[62] + /*margin*/ ctx[9]);
			attr(rect, "x", rect_x_value = /*cellHeight*/ ctx[22] * /*x*/ ctx[65] + /*margin*/ ctx[9]);
			attr(rect, "width", /*cellWidth*/ ctx[18]);
			attr(rect, "height", /*cellHeight*/ ctx[22]);
			attr(rect, "stroke", /*innerBorderColour*/ ctx[11]);
			attr(rect, "stroke-width", /*innerBorderWidth*/ ctx[8]);
			attr(rect, "fill", /*fillColour*/ ctx[12]);
			attr(rect, "data-col", /*y*/ ctx[62]);
			attr(rect, "data-row", /*x*/ ctx[65]);
			attr(line0, "class", "jxword-cell-line svelte-1013j5m");
			attr(line0, "role", "cell");
			attr(line0, "tabindex", "-1");
			attr(line0, "y1", line0_y__value = /*cellHeight*/ ctx[22] * /*y*/ ctx[62] + /*margin*/ ctx[9] + /*innerBorderWidth*/ ctx[8]);
			attr(line0, "x1", line0_x__value = /*cellWidth*/ ctx[18] * /*x*/ ctx[65] + /*margin*/ ctx[9] + /*innerBorderWidth*/ ctx[8]);
			attr(line0, "y2", line0_y__value_1 = /*cellHeight*/ ctx[22] * /*y*/ ctx[62] + /*innerBorderWidth*/ ctx[8] * /*y*/ ctx[62] + /*cellHeight*/ ctx[22]);
			attr(line0, "x2", line0_x__value_1 = /*cellWidth*/ ctx[18] * /*x*/ ctx[65] + /*innerBorderWidth*/ ctx[8] * /*y*/ ctx[62] + /*cellWidth*/ ctx[18]);
			attr(line0, "stroke", /*innerBorderColour*/ ctx[11]);
			attr(line0, "stroke-width", /*innerBorderWidth*/ ctx[8]);
			attr(line0, "data-col", /*y*/ ctx[62]);
			attr(line0, "data-row", /*x*/ ctx[65]);
			attr(line1, "class", "jxword-cell-line svelte-1013j5m");
			attr(line1, "role", "cell");
			attr(line1, "tabindex", "-1");
			attr(line1, "y1", line1_y__value = /*cellHeight*/ ctx[22] * /*y*/ ctx[62] + /*margin*/ ctx[9] + /*innerBorderWidth*/ ctx[8]);
			attr(line1, "x1", line1_x__value = /*cellWidth*/ ctx[18] * /*x*/ ctx[65] + /*margin*/ ctx[9] + /*innerBorderWidth*/ ctx[8]);
			attr(line1, "y2", line1_y__value_1 = /*cellHeight*/ ctx[22] * /*y*/ ctx[62] + /*innerBorderWidth*/ ctx[8] * /*y*/ ctx[62] + /*cellHeight*/ ctx[22]);
			attr(line1, "x2", line1_x__value_1 = /*cellWidth*/ ctx[18] * /*x*/ ctx[65] + /*innerBorderWidth*/ ctx[8] * /*y*/ ctx[62] + /*cellWidth*/ ctx[18]);
			attr(line1, "stroke", /*innerBorderColour*/ ctx[11]);
			attr(line1, "stroke-width", /*innerBorderWidth*/ ctx[8]);
			attr(line1, "data-col", /*y*/ ctx[62]);
			attr(line1, "data-row", /*x*/ ctx[65]);
			attr(line1, "transform", line1_transform_value = "rotate(90, " + (/*cellWidth*/ ctx[18] * /*x*/ ctx[65] + /*margin*/ ctx[9] + /*cellWidth*/ ctx[18] / 2) + ", " + (/*cellHeight*/ ctx[22] * /*y*/ ctx[62] + /*margin*/ ctx[9] + /*cellWidth*/ ctx[18] / 2) + ")");
		},
		m(target, anchor) {
			insert(target, rect, anchor);
			insert(target, line0, anchor);
			insert(target, line1, anchor);

			if (!mounted) {
				dispose = [
					listen(rect, "focus", /*handleFocus*/ ctx[26]),
					listen(line0, "focus", /*handleFocus*/ ctx[26]),
					listen(line1, "focus", /*handleFocus*/ ctx[26])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*cellWidth, margin*/ 262656 && rect_y_value !== (rect_y_value = /*cellWidth*/ ctx[18] * /*y*/ ctx[62] + /*margin*/ ctx[9])) {
				attr(rect, "y", rect_y_value);
			}

			if (dirty[0] & /*cellHeight, margin*/ 4194816 && rect_x_value !== (rect_x_value = /*cellHeight*/ ctx[22] * /*x*/ ctx[65] + /*margin*/ ctx[9])) {
				attr(rect, "x", rect_x_value);
			}

			if (dirty[0] & /*cellWidth*/ 262144) {
				attr(rect, "width", /*cellWidth*/ ctx[18]);
			}

			if (dirty[0] & /*cellHeight*/ 4194304) {
				attr(rect, "height", /*cellHeight*/ ctx[22]);
			}

			if (dirty[0] & /*innerBorderColour*/ 2048) {
				attr(rect, "stroke", /*innerBorderColour*/ ctx[11]);
			}

			if (dirty[0] & /*innerBorderWidth*/ 256) {
				attr(rect, "stroke-width", /*innerBorderWidth*/ ctx[8]);
			}

			if (dirty[0] & /*fillColour*/ 4096) {
				attr(rect, "fill", /*fillColour*/ ctx[12]);
			}

			if (dirty[0] & /*cellHeight, margin, innerBorderWidth*/ 4195072 && line0_y__value !== (line0_y__value = /*cellHeight*/ ctx[22] * /*y*/ ctx[62] + /*margin*/ ctx[9] + /*innerBorderWidth*/ ctx[8])) {
				attr(line0, "y1", line0_y__value);
			}

			if (dirty[0] & /*cellWidth, margin, innerBorderWidth*/ 262912 && line0_x__value !== (line0_x__value = /*cellWidth*/ ctx[18] * /*x*/ ctx[65] + /*margin*/ ctx[9] + /*innerBorderWidth*/ ctx[8])) {
				attr(line0, "x1", line0_x__value);
			}

			if (dirty[0] & /*cellHeight, innerBorderWidth*/ 4194560 && line0_y__value_1 !== (line0_y__value_1 = /*cellHeight*/ ctx[22] * /*y*/ ctx[62] + /*innerBorderWidth*/ ctx[8] * /*y*/ ctx[62] + /*cellHeight*/ ctx[22])) {
				attr(line0, "y2", line0_y__value_1);
			}

			if (dirty[0] & /*cellWidth, innerBorderWidth*/ 262400 && line0_x__value_1 !== (line0_x__value_1 = /*cellWidth*/ ctx[18] * /*x*/ ctx[65] + /*innerBorderWidth*/ ctx[8] * /*y*/ ctx[62] + /*cellWidth*/ ctx[18])) {
				attr(line0, "x2", line0_x__value_1);
			}

			if (dirty[0] & /*innerBorderColour*/ 2048) {
				attr(line0, "stroke", /*innerBorderColour*/ ctx[11]);
			}

			if (dirty[0] & /*innerBorderWidth*/ 256) {
				attr(line0, "stroke-width", /*innerBorderWidth*/ ctx[8]);
			}

			if (dirty[0] & /*cellHeight, margin, innerBorderWidth*/ 4195072 && line1_y__value !== (line1_y__value = /*cellHeight*/ ctx[22] * /*y*/ ctx[62] + /*margin*/ ctx[9] + /*innerBorderWidth*/ ctx[8])) {
				attr(line1, "y1", line1_y__value);
			}

			if (dirty[0] & /*cellWidth, margin, innerBorderWidth*/ 262912 && line1_x__value !== (line1_x__value = /*cellWidth*/ ctx[18] * /*x*/ ctx[65] + /*margin*/ ctx[9] + /*innerBorderWidth*/ ctx[8])) {
				attr(line1, "x1", line1_x__value);
			}

			if (dirty[0] & /*cellHeight, innerBorderWidth*/ 4194560 && line1_y__value_1 !== (line1_y__value_1 = /*cellHeight*/ ctx[22] * /*y*/ ctx[62] + /*innerBorderWidth*/ ctx[8] * /*y*/ ctx[62] + /*cellHeight*/ ctx[22])) {
				attr(line1, "y2", line1_y__value_1);
			}

			if (dirty[0] & /*cellWidth, innerBorderWidth*/ 262400 && line1_x__value_1 !== (line1_x__value_1 = /*cellWidth*/ ctx[18] * /*x*/ ctx[65] + /*innerBorderWidth*/ ctx[8] * /*y*/ ctx[62] + /*cellWidth*/ ctx[18])) {
				attr(line1, "x2", line1_x__value_1);
			}

			if (dirty[0] & /*innerBorderColour*/ 2048) {
				attr(line1, "stroke", /*innerBorderColour*/ ctx[11]);
			}

			if (dirty[0] & /*innerBorderWidth*/ 256) {
				attr(line1, "stroke-width", /*innerBorderWidth*/ ctx[8]);
			}

			if (dirty[0] & /*cellWidth, margin, cellHeight*/ 4456960 && line1_transform_value !== (line1_transform_value = "rotate(90, " + (/*cellWidth*/ ctx[18] * /*x*/ ctx[65] + /*margin*/ ctx[9] + /*cellWidth*/ ctx[18] / 2) + ", " + (/*cellHeight*/ ctx[22] * /*y*/ ctx[62] + /*margin*/ ctx[9] + /*cellWidth*/ ctx[18] / 2) + ")")) {
				attr(line1, "transform", line1_transform_value);
			}
		},
		d(detaching) {
			if (detaching) detach(rect);
			if (detaching) detach(line0);
			if (detaching) detach(line1);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (466:28) {#if (number_grid[y][x] != null && letter!=="#")}
function create_if_block(ctx) {
	let text_1;
	let t_value = /*number_grid*/ ctx[17][/*y*/ ctx[62]][/*x*/ ctx[65]] + "";
	let t;
	let text_1_x_value;
	let text_1_y_value;
	let mounted;
	let dispose;

	return {
		c() {
			text_1 = svg_element("text");
			t = text(t_value);
			attr(text_1, "x", text_1_x_value = /*cellWidth*/ ctx[18] * /*x*/ ctx[65] + /*margin*/ ctx[9] + 2);
			attr(text_1, "y", text_1_y_value = /*cellHeight*/ ctx[22] * /*y*/ ctx[62] + /*margin*/ ctx[9] + /*numFontSize*/ ctx[21]);
			attr(text_1, "text-anchor", "left");
			attr(text_1, "font-size", /*numFontSize*/ ctx[21]);
			attr(text_1, "class", "svelte-1013j5m");
		},
		m(target, anchor) {
			insert(target, text_1, anchor);
			append(text_1, t);

			if (!mounted) {
				dispose = listen(text_1, "focus", /*handleFocus*/ ctx[26]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*number_grid*/ 131072 && t_value !== (t_value = /*number_grid*/ ctx[17][/*y*/ ctx[62]][/*x*/ ctx[65]] + "")) set_data(t, t_value);

			if (dirty[0] & /*cellWidth, margin*/ 262656 && text_1_x_value !== (text_1_x_value = /*cellWidth*/ ctx[18] * /*x*/ ctx[65] + /*margin*/ ctx[9] + 2)) {
				attr(text_1, "x", text_1_x_value);
			}

			if (dirty[0] & /*cellHeight, margin, numFontSize*/ 6291968 && text_1_y_value !== (text_1_y_value = /*cellHeight*/ ctx[22] * /*y*/ ctx[62] + /*margin*/ ctx[9] + /*numFontSize*/ ctx[21])) {
				attr(text_1, "y", text_1_y_value);
			}

			if (dirty[0] & /*numFontSize*/ 2097152) {
				attr(text_1, "font-size", /*numFontSize*/ ctx[21]);
			}
		},
		d(detaching) {
			if (detaching) detach(text_1);
			mounted = false;
			dispose();
		}
	};
}

// (455:20) {#each col_data as letter, x}
function create_each_block_1(ctx) {
	let g;
	let if_block0_anchor;
	let mounted;
	let dispose;

	function select_block_type(ctx, dirty) {
		if (/*letter*/ ctx[63] == "#") return create_if_block_1;
		return create_else_block;
	}

	let current_block_type = select_block_type(ctx);
	let if_block0 = current_block_type(ctx);
	let if_block1 = /*number_grid*/ ctx[17][/*y*/ ctx[62]][/*x*/ ctx[65]] != null && /*letter*/ ctx[63] !== "#" && create_if_block(ctx);

	function click_handler() {
		return /*click_handler*/ ctx[44](/*x*/ ctx[65], /*y*/ ctx[62]);
	}

	function dblclick_handler() {
		return /*dblclick_handler*/ ctx[45](/*x*/ ctx[65], /*y*/ ctx[62]);
	}

	return {
		c() {
			g = svg_element("g");
			if_block0.c();
			if_block0_anchor = empty();
			if (if_block1) if_block1.c();
			attr(g, "id", "jxword-cell-" + /*x*/ ctx[65] + "-" + /*y*/ ctx[62]);
			attr(g, "class", "jxword-cell svelte-1013j5m");
			set_style(g, "z-index", "20");
			toggle_class(g, "selected", /*current_y*/ ctx[2] === /*y*/ ctx[62] && /*current_x*/ ctx[1] === /*x*/ ctx[65]);
			toggle_class(g, "active", /*marked_word_grid*/ ctx[19][/*y*/ ctx[62]][/*x*/ ctx[65]]);
		},
		m(target, anchor) {
			insert(target, g, anchor);
			if_block0.m(g, null);
			append(g, if_block0_anchor);
			if (if_block1) if_block1.m(g, null);

			if (!mounted) {
				dispose = [
					listen(g, "click", click_handler),
					listen(g, "dblclick", dblclick_handler),
					listen(g, "keydown", /*handleKeydown*/ ctx[16])
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
				if_block0.p(ctx, dirty);
			} else {
				if_block0.d(1);
				if_block0 = current_block_type(ctx);

				if (if_block0) {
					if_block0.c();
					if_block0.m(g, if_block0_anchor);
				}
			}

			if (/*number_grid*/ ctx[17][/*y*/ ctx[62]][/*x*/ ctx[65]] != null && /*letter*/ ctx[63] !== "#") {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block(ctx);
					if_block1.c();
					if_block1.m(g, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (dirty[0] & /*current_y, current_x*/ 6) {
				toggle_class(g, "selected", /*current_y*/ ctx[2] === /*y*/ ctx[62] && /*current_x*/ ctx[1] === /*x*/ ctx[65]);
			}

			if (dirty[0] & /*marked_word_grid*/ 524288) {
				toggle_class(g, "active", /*marked_word_grid*/ ctx[19][/*y*/ ctx[62]][/*x*/ ctx[65]]);
			}
		},
		d(detaching) {
			if (detaching) detach(g);
			if_block0.d();
			if (if_block1) if_block1.d();
			mounted = false;
			run_all(dispose);
		}
	};
}

// (454:16) {#each grid as col_data, y}
function create_each_block(ctx) {
	let each_1_anchor;
	let each_value_1 = /*col_data*/ ctx[60];
	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*current_y, current_x, marked_word_grid, setCurrentPos, handleDoubleclick, handleKeydown, cellWidth, margin, cellHeight, numFontSize, handleFocus, number_grid, grid, innerBorderWidth, innerBorderColour, fillColour, fontSize, backgroundColour*/ 109034247) {
				each_value_1 = /*col_data*/ ctx[60];
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_1.length;
			}
		},
		d(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

function create_fragment$2(ctx) {
	let main;
	let div;
	let input;
	let t0;
	let svg;
	let g;
	let rect;
	let t1;
	let questions;
	let current;
	let mounted;
	let dispose;
	let each_value = /*grid*/ ctx[0];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	questions = new Questions({});
	questions.$on("change", /*change_handler*/ ctx[47]);
	questions.$on("update_question", /*handleUpdateQuestion*/ ctx[27]);

	return {
		c() {
			main = element("main");
			div = element("div");
			input = element("input");
			t0 = space();
			svg = svg_element("svg");
			g = svg_element("g");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			rect = svg_element("rect");
			t1 = space();
			create_component(questions.$$.fragment);
			attr(input, "type", "text");
			attr(input, "class", "svelte-1013j5m");
			attr(rect, "x", /*margin*/ ctx[9]);
			attr(rect, "y", /*margin*/ ctx[9]);
			attr(rect, "width", /*totalWidth*/ ctx[5]);
			attr(rect, "height", /*totalHeight*/ ctx[6]);
			attr(rect, "stroke", /*outerBorderColour*/ ctx[10]);
			attr(rect, "stroke-width", /*outerBorderWidth*/ ctx[7]);
			attr(rect, "fill", "none");
			attr(rect, "class", "svelte-1013j5m");
			attr(g, "class", "cell-group svelte-1013j5m");
			attr(svg, "class", "jxword-svg svelte-1013j5m");
			attr(svg, "min-x", "0");
			attr(svg, "min-y", "0");
			attr(svg, "width", /*viewbox_width*/ ctx[23]);
			attr(svg, "height", /*viewbox_height*/ ctx[24]);
			attr(div, "class", "jxword-svg-container svelte-1013j5m");
			attr(main, "class", "svelte-1013j5m");
		},
		m(target, anchor) {
			insert(target, main, anchor);
			append(main, div);
			append(div, input);
			/*input_binding*/ ctx[43](input);
			append(div, t0);
			append(div, svg);
			append(svg, g);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(g, null);
			}

			append(g, rect);
			/*div_binding*/ ctx[46](div);
			append(main, t1);
			mount_component(questions, main, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(input, "keydown", /*handleKeydown*/ ctx[16]),
					listen(rect, "focus", /*handleFocus*/ ctx[26]),
					listen(main, "move", /*handleMove*/ ctx[14])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*grid, current_y, current_x, marked_word_grid, setCurrentPos, handleDoubleclick, handleKeydown, cellWidth, margin, cellHeight, numFontSize, handleFocus, number_grid, innerBorderWidth, innerBorderColour, fillColour, fontSize, backgroundColour*/ 109034247) {
				each_value = /*grid*/ ctx[0];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(g, rect);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (!current || dirty[0] & /*margin*/ 512) {
				attr(rect, "x", /*margin*/ ctx[9]);
			}

			if (!current || dirty[0] & /*margin*/ 512) {
				attr(rect, "y", /*margin*/ ctx[9]);
			}

			if (!current || dirty[0] & /*totalWidth*/ 32) {
				attr(rect, "width", /*totalWidth*/ ctx[5]);
			}

			if (!current || dirty[0] & /*totalHeight*/ 64) {
				attr(rect, "height", /*totalHeight*/ ctx[6]);
			}

			if (!current || dirty[0] & /*outerBorderColour*/ 1024) {
				attr(rect, "stroke", /*outerBorderColour*/ ctx[10]);
			}

			if (!current || dirty[0] & /*outerBorderWidth*/ 128) {
				attr(rect, "stroke-width", /*outerBorderWidth*/ ctx[7]);
			}

			if (!current || dirty[0] & /*viewbox_width*/ 8388608) {
				attr(svg, "width", /*viewbox_width*/ ctx[23]);
			}

			if (!current || dirty[0] & /*viewbox_height*/ 16777216) {
				attr(svg, "height", /*viewbox_height*/ ctx[24]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(questions.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(questions.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(main);
			/*input_binding*/ ctx[43](null);
			destroy_each(each_blocks, detaching);
			/*div_binding*/ ctx[46](null);
			destroy_component(questions);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let $currentDirection;
	let $questionsDown;
	let $questionsAcross;
	component_subscribe($$self, currentDirection, $$value => $$invalidate(48, $currentDirection = $$value));
	component_subscribe($$self, questionsDown, $$value => $$invalidate(49, $questionsDown = $$value));
	component_subscribe($$self, questionsAcross, $$value => $$invalidate(50, $questionsAcross = $$value));
	const dispatch = createEventDispatcher();

	// Private properties
	let number_grid = [];

	let marked_word_grid = [];
	let fontSize;
	let numFontSize;
	let cellWidth;
	let cellHeight;
	let viewbox_width;
	let viewbox_height;
	let { Container } = $$props;
	let { Input } = $$props;
	let { grid = [] } = $$props;
	let { size = 10 } = $$props;
	let { current_x = 0 } = $$props;
	let { current_y = 0 } = $$props;
	let { totalWidth = 500 } = $$props;
	let { totalHeight = 500 } = $$props;
	let { outerBorderWidth = 1.5 } = $$props;
	let { innerBorderWidth = 1 } = $$props;
	let { margin = 3 } = $$props;
	let { outerBorderColour = "black" } = $$props;
	let { innerBorderColour = "black" } = $$props;
	let { fillColour = "black" } = $$props;
	let { backgroundColour = "white" } = $$props;
	const fontRatio = 0.7;
	const numRatio = 0.33;

	function selectCell(e) {
		$$invalidate(1, current_x = e.srcElement.getAttribute("data-col"));
		$$invalidate(2, current_y = e.srcElement.getAttribute("data-row"));
		drawMarkedWordGrid();
		dispatch("change");
	}

	function isStartOfAcross(x, y) {
		if (grid[y][x] === "#") return false;
		if (x >= size) return false;
		let word = getWord(x, y, "across");
		if (word.length <= 1) return false;
		return x === 0 || grid[y][x - 1] == "#";
	}

	function isStartOfDown(x, y) {
		if (grid[y][x] === "#") return false;
		if (y >= size) return false;
		let word = getWord(x, y, "down");
		if (word.length <= 1) return false;
		return y === 0 || grid[y - 1][x] == "#";
	}

	function getQuestion(num, x, y, direction, question) {
		const answer = getWord(x, y, direction);

		if (direction === "across") {
			for (let i = 0; i < $questionsAcross.length; i++) {
				if ($questionsAcross[i].answer === answer && $questionsAcross[i].direction === direction) {
					return {
						...$questionsAcross[i],
						answer,
						num,
						x,
						y
					};
				}

				if ($questionsAcross[i].num === num && $questionsAcross[i].direction === direction) {
					return { ...$questionsAcross[i], answer, x, y };
				}
			}

			return {
				num,
				x,
				y,
				question,
				answer,
				editing: false,
				direction
			};
		} else {
			for (let i = 0; i < $questionsDown.length; i++) {
				if ($questionsDown[i].answer === answer && $questionsDown[i].direction === direction) {
					return { ...$questionsDown[i], answer, num, x, y };
				}

				if ($questionsDown[i].num === num && $questionsDown[i].direction === direction) {
					return set_store_value(questionsDown, $questionsDown[i] = { ...$questionsDown[i], answer, x, y }, $questionsDown);
				}
			}

			return set_store_value(
				questionsDown,
				$questionsDown = {
					num,
					x,
					y,
					question,
					answer,
					editing: false,
					direction
				},
				$questionsDown
			);
		}
	}

	function getCurrentQuestion() {
		let { x, y } = getCurrentPos();
		let selected_question;

		let questions = $currentDirection === "across"
		? $questionsAcross
		: $questionsDown;

		if (!questions.length) return;

		if ($currentDirection === "across") {
			selected_question = questions.find(q => y === q.y && x >= q.x && x <= q.x + q.answer.length - 1);
		} else {
			selected_question = questions.find(q => x === q.x && y >= q.y && y <= q.y + q.answer.length - 1);
		}

		return selected_question;
	}

	function getStartOfWord(x, y, direction) {
		if (direction === "across") {
			while (x > 0 && grid[y][x - 1] !== "#") {
				x--;
			}
		} else {
			while (y > 0 && grid[y - 1][x] !== "#") {
				y--;
			}
		}

		return { x, y };
	}

	function getEndOfWord(x, y, direction) {
		if (direction === "across") {
			while (x < size - 1 && grid[y][x + 1] !== "#") {
				x++;
			}
		} else {
			while (y < size - 1 && grid[y + 1][x] !== "#") {
				y++;
			}
		}

		return { x, y };
	}

	function getWord(x, y, direction) {
		let start = getStartOfWord(x, y, direction);
		let end = getEndOfWord(x, y, direction);
		let word = "";

		if (direction === "across") {
			for (let i = start.x; i <= end.x; i++) {
				word += grid[y][i] || " ";
			}
		} else {
			for (let i = start.y; i <= end.y; i++) {
				word += grid[i][x] || " ";
			}
		}

		return word;
	}

	function drawMarkedWordGrid() {
		$$invalidate(19, marked_word_grid = Array(size).fill(false).map(() => Array(size).fill(false)));

		if ($currentDirection === "across") {
			for (let x = current_x; x < size; x++) {
				if (!grid[current_y]) break;

				if (grid[current_y][x] === "#") {
					break;
				}

				$$invalidate(19, marked_word_grid[current_y][x] = true, marked_word_grid);
			}

			for (let x = current_x; x >= 0; x--) {
				if (!grid[current_y]) break;

				if (grid[current_y][x] === "#") {
					break;
				}

				$$invalidate(19, marked_word_grid[current_y][x] = true, marked_word_grid);
			}
		} else {
			// down
			for (let y = current_y; y < size; y++) {
				if (!grid[y]) break;

				if (grid[y][current_x] === "#") {
					break;
				}

				$$invalidate(19, marked_word_grid[y][current_x] = true, marked_word_grid);
			}

			for (let y = current_y; y >= 0; y--) {
				if (!grid[y]) break;

				if (grid[y][current_x] === "#") {
					break;
				}

				$$invalidate(19, marked_word_grid[y][current_x] = true, marked_word_grid);
			}
		}
	}

	function moveUp() {
		if (current_y > 0) {
			$$invalidate(2, current_y--, current_y);
			dispatch("change");
			drawMarkedWordGrid();
		}
	}

	function moveDown() {
		if (current_y < size - 1) {
			$$invalidate(2, current_y++, current_y);
			dispatch("change");
			drawMarkedWordGrid();
		}
	}

	function moveLeft() {
		if (current_x > 0) {
			$$invalidate(1, current_x--, current_x);
			dispatch("change");
			drawMarkedWordGrid();
		} else {
			if (current_y > 0) {
				$$invalidate(2, current_y--, current_y);
				$$invalidate(1, current_x = size - 1);
				dispatch("change");
				drawMarkedWordGrid();
			}
		}
	}

	function moveRight() {
		if (current_x < size - 1) {
			$$invalidate(1, current_x++, current_x);
			dispatch("change");
			drawMarkedWordGrid();
		} else {
			if (current_y < size - 1) {
				$$invalidate(2, current_y++, current_y);
				$$invalidate(1, current_x = 0);
				dispatch("change");
				drawMarkedWordGrid();
			}
		}
	}

	function moveStartOfRow() {
		$$invalidate(1, current_x = 0);
		dispatch("change");
		drawMarkedWordGrid();
	}

	function moveEndOfRow() {
		$$invalidate(1, current_x = size - 1);
		dispatch("change");
		drawMarkedWordGrid();
	}

	function moveStartOfCol() {
		$$invalidate(2, current_y = 0);
		dispatch("change");
		drawMarkedWordGrid();
	}

	function moveEndOfCol() {
		$$invalidate(2, current_y = size - 1);
		dispatch("change");
		drawMarkedWordGrid();
	}

	function handleMove(dir) {
		if (dir === "up") {
			moveUp();
		}

		if (dir === "down") {
			moveDown();
		}

		if (dir === "left") {
			moveLeft();
		}

		if (dir === "right") {
			moveRight();
		}

		if (dir === "backsapce") {
			backspace();
		}
	}

	function toggleDir() {
		if ($currentDirection === "across") {
			currentDirection.set("down");
		} else {
			currentDirection.set("across");
		}

		dispatch("change");
		drawMarkedWordGrid();
	}

	function setDir(direction) {
		if (direction === "across") {
			currentDirection.set("across");
		} else {
			currentDirection.set("down");
		}

		dispatch("change");
		drawMarkedWordGrid();
	}

	function getCurrentPos() {
		return { x: current_x, y: current_y };
	}

	function setCurrentPos(x, y) {
		$$invalidate(1, current_x = x);
		$$invalidate(2, current_y = y);
		dispatch("change");
		drawMarkedWordGrid();
	}

	function handleDoubleclick(x, y) {
		toggleDir();
	} // let selected_question;
	// let questions = $currentDirection === "across" ? $questionsAcross : $questionsDown;

	function handleKeydown(e) {
		e.preventDefault();
		const keycode = e.keyCode;
		if (e.metaKey) return;

		if (keycode > 64 && keycode < 91) {
			dispatch("letter", e.key.toUpperCase());
		} else if (keycode === 51) {
			// #
			dispatch("letter", "#");
		} else if (keycode === 8) {
			// Backspace
			dispatch("backspace");
		} else if (keycode == 32) {
			// Space
			dispatch("letter", " ");
		} else if (keycode === 9) {
			// Enter
			if (e.shiftKey) {
				dispatch("move", "prev-word");
			} else {
				dispatch("move", "next-word");
			}
		} else if (keycode === 13) {
			// Enter
			dispatch("enter");
		} else if (keycode === 37) {
			dispatch("move", "left");
		} else if (keycode === 38) {
			dispatch("move", "up");
		} else if (keycode === 39) {
			dispatch("move", "right");
		} else if (keycode === 40) {
			dispatch("move", "down");
		}

		handleFocus();
	}

	function handleFocus(e) {
		Input.focus();
	}

	function handleUpdateQuestion(e) {
		const { question, suggestion } = e.detail;

		if (question.direction === "across") {
			for (let i = 0; i < suggestion.length; i++) {
				$$invalidate(0, grid[question.y][i + question.x] = suggestion[i], grid);
			}
		} else {
			for (let i = 0; i < suggestion.length; i++) {
				$$invalidate(0, grid[i + question.y][question.x] = suggestion[i], grid);
			}
		}
	}

	function input_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			Input = $$value;
			$$invalidate(4, Input);
		});
	}

	const click_handler = (x, y) => {
		setCurrentPos(x, y);
	};

	const dblclick_handler = (x, y) => {
		handleDoubleclick();
	};

	function div_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			Container = $$value;
			$$invalidate(3, Container);
		});
	}

	function change_handler(event) {
		bubble.call(this, $$self, event);
	}

	$$self.$$set = $$props => {
		if ('Container' in $$props) $$invalidate(3, Container = $$props.Container);
		if ('Input' in $$props) $$invalidate(4, Input = $$props.Input);
		if ('grid' in $$props) $$invalidate(0, grid = $$props.grid);
		if ('size' in $$props) $$invalidate(28, size = $$props.size);
		if ('current_x' in $$props) $$invalidate(1, current_x = $$props.current_x);
		if ('current_y' in $$props) $$invalidate(2, current_y = $$props.current_y);
		if ('totalWidth' in $$props) $$invalidate(5, totalWidth = $$props.totalWidth);
		if ('totalHeight' in $$props) $$invalidate(6, totalHeight = $$props.totalHeight);
		if ('outerBorderWidth' in $$props) $$invalidate(7, outerBorderWidth = $$props.outerBorderWidth);
		if ('innerBorderWidth' in $$props) $$invalidate(8, innerBorderWidth = $$props.innerBorderWidth);
		if ('margin' in $$props) $$invalidate(9, margin = $$props.margin);
		if ('outerBorderColour' in $$props) $$invalidate(10, outerBorderColour = $$props.outerBorderColour);
		if ('innerBorderColour' in $$props) $$invalidate(11, innerBorderColour = $$props.innerBorderColour);
		if ('fillColour' in $$props) $$invalidate(12, fillColour = $$props.fillColour);
		if ('backgroundColour' in $$props) $$invalidate(13, backgroundColour = $$props.backgroundColour);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*size, totalWidth, margin, outerBorderWidth, totalHeight, cellWidth, grid, number_grid, current_x, current_y*/ 268829415) {
			{
				if (size < 2) {
					$$invalidate(28, size = 2);
				}

				if (size > 30) {
					$$invalidate(28, size = 30);
				}

				$$invalidate(23, viewbox_width = totalWidth + margin + outerBorderWidth);
				$$invalidate(24, viewbox_height = totalHeight + margin + outerBorderWidth);
				$$invalidate(18, cellWidth = totalWidth / size);
				$$invalidate(22, cellHeight = totalHeight / size);
				$$invalidate(20, fontSize = cellWidth * fontRatio);
				$$invalidate(21, numFontSize = cellWidth * numRatio);
				let questions_across = [];
				let questions_down = [];
				let num = 1;

				// Grow grid if necessary
				if (grid.length - 1 < size) {
					for (let i = 0; i < size; i++) {
						$$invalidate(0, grid[i] = grid[i] || Array(size).map(() => " "), grid);
						$$invalidate(17, number_grid[i] = number_grid[i] || Array(size).map(() => " "), number_grid);
					}
				}

				// Shrink grid if necessary
				while (grid.length > size) {
					for (let i = 0; i < grid.length; i++) {
						while (grid[i].length > size) {
							grid[i].pop();
							number_grid[i].pop();
						}
					}

					grid.pop();
					number_grid.pop();
				}

				// Make sure we're still in the grid
				if (current_x >= size) {
					$$invalidate(1, current_x = size - 1);
				}

				if (current_y >= size) {
					$$invalidate(2, current_y = size - 1);
				}

				for (let y = 0; y < size; y++) {
					if (!number_grid[y]) {
						$$invalidate(17, number_grid[y] = Array(size), number_grid);
					}

					for (let x = 0; x < size; x++) {
						$$invalidate(0, grid[y][x] = grid[y][x] || " ", grid);
						if (grid[y][x] === "#") continue;
						let found = false;

						if (isStartOfAcross(x, y)) {
							questions_across.push(getQuestion(num, x, y, "across", ""));
							found = true;
						}

						if (isStartOfDown(x, y)) {
							questions_down.push(getQuestion(num, x, y, "down", ""));
							found = true;
						}

						if (!found) {
							$$invalidate(17, number_grid[y][x] = null, number_grid);
						} else {
							$$invalidate(17, number_grid[y][x] = num++, number_grid);
						}
					}
				}

				// questions_across.sort();
				// questions_down.sort();
				questionsAcross.set(questions_across);

				questionsDown.set(questions_down);

				// Find the current question
				const current_question = getCurrentQuestion();

				// console.log(current_question);
				currentQuestion.set(current_question);

				drawMarkedWordGrid();
			}
		}
	};

	return [
		grid,
		current_x,
		current_y,
		Container,
		Input,
		totalWidth,
		totalHeight,
		outerBorderWidth,
		innerBorderWidth,
		margin,
		outerBorderColour,
		innerBorderColour,
		fillColour,
		backgroundColour,
		handleMove,
		setCurrentPos,
		handleKeydown,
		number_grid,
		cellWidth,
		marked_word_grid,
		fontSize,
		numFontSize,
		cellHeight,
		viewbox_width,
		viewbox_height,
		handleDoubleclick,
		handleFocus,
		handleUpdateQuestion,
		size,
		fontRatio,
		numRatio,
		selectCell,
		moveUp,
		moveDown,
		moveLeft,
		moveRight,
		moveStartOfRow,
		moveEndOfRow,
		moveStartOfCol,
		moveEndOfCol,
		toggleDir,
		setDir,
		getCurrentPos,
		input_binding,
		click_handler,
		dblclick_handler,
		div_binding,
		change_handler
	];
}

class Grid extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$2,
			create_fragment$2,
			safe_not_equal,
			{
				Container: 3,
				Input: 4,
				grid: 0,
				size: 28,
				current_x: 1,
				current_y: 2,
				totalWidth: 5,
				totalHeight: 6,
				outerBorderWidth: 7,
				innerBorderWidth: 8,
				margin: 9,
				outerBorderColour: 10,
				innerBorderColour: 11,
				fillColour: 12,
				backgroundColour: 13,
				fontRatio: 29,
				numRatio: 30,
				selectCell: 31,
				moveUp: 32,
				moveDown: 33,
				moveLeft: 34,
				moveRight: 35,
				moveStartOfRow: 36,
				moveEndOfRow: 37,
				moveStartOfCol: 38,
				moveEndOfCol: 39,
				handleMove: 14,
				toggleDir: 40,
				setDir: 41,
				getCurrentPos: 42,
				setCurrentPos: 15,
				handleKeydown: 16
			},
			null,
			[-1, -1, -1]
		);
	}

	get fontRatio() {
		return this.$$.ctx[29];
	}

	get numRatio() {
		return this.$$.ctx[30];
	}

	get selectCell() {
		return this.$$.ctx[31];
	}

	get moveUp() {
		return this.$$.ctx[32];
	}

	get moveDown() {
		return this.$$.ctx[33];
	}

	get moveLeft() {
		return this.$$.ctx[34];
	}

	get moveRight() {
		return this.$$.ctx[35];
	}

	get moveStartOfRow() {
		return this.$$.ctx[36];
	}

	get moveEndOfRow() {
		return this.$$.ctx[37];
	}

	get moveStartOfCol() {
		return this.$$.ctx[38];
	}

	get moveEndOfCol() {
		return this.$$.ctx[39];
	}

	get handleMove() {
		return this.$$.ctx[14];
	}

	get toggleDir() {
		return this.$$.ctx[40];
	}

	get setDir() {
		return this.$$.ctx[41];
	}

	get getCurrentPos() {
		return this.$$.ctx[42];
	}

	get setCurrentPos() {
		return this.$$.ctx[15];
	}

	get handleKeydown() {
		return this.$$.ctx[16];
	}
}

/* src/Instructions.svelte generated by Svelte v3.46.4 */

function create_fragment$1(ctx) {
	let main;
	let div;
	let t1;
	let h2;
	let t3;
	let p0;
	let t5;
	let p1;
	let t7;
	let p2;
	let t9;
	let p3;
	let t11;
	let p4;
	let t13;
	let p5;
	let mounted;
	let dispose;

	return {
		c() {
			main = element("main");
			div = element("div");
			div.textContent = "×";
			t1 = space();
			h2 = element("h2");
			h2.textContent = "Instructions";
			t3 = space();
			p0 = element("p");
			p0.textContent = "Use \"#\" to create a blank square.";
			t5 = space();
			p1 = element("p");
			p1.textContent = "Hit Enter or double-click the question on the right to set an answer.";
			t7 = space();
			p2 = element("p");
			p2.textContent = "Use Space to change directions.";
			t9 = space();
			p3 = element("p");
			p3.textContent = "Use arrow keys to navigate.";
			t11 = space();
			p4 = element("p");
			p4.textContent = "Hint: Complete the words before starting on the answers, because you might have to change something!";
			t13 = space();
			p5 = element("p");
			p5.innerHTML = `Note: This Crossword Creator is in Alpha. <a href="https://github.com/j-norwood-young/jxword-creator/issues">Please report bugs here</a>.`;
			attr(div, "class", "close svelte-n4k5p1");
			attr(main, "class", "svelte-n4k5p1");
			toggle_class(main, "visible", /*visible*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, main, anchor);
			append(main, div);
			append(main, t1);
			append(main, h2);
			append(main, t3);
			append(main, p0);
			append(main, t5);
			append(main, p1);
			append(main, t7);
			append(main, p2);
			append(main, t9);
			append(main, p3);
			append(main, t11);
			append(main, p4);
			append(main, t13);
			append(main, p5);

			if (!mounted) {
				dispose = listen(div, "click", /*hideInstructions*/ ctx[1]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*visible*/ 1) {
				toggle_class(main, "visible", /*visible*/ ctx[0]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(main);
			mounted = false;
			dispose();
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let { visible = false } = $$props;

	function hideInstructions() {
		$$invalidate(0, visible = false);
	}

	$$self.$$set = $$props => {
		if ('visible' in $$props) $$invalidate(0, visible = $$props.visible);
	};

	return [visible, hideInstructions];
}

class Instructions extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { visible: 0 });
	}
}

function saveState(state) {
    let stateString = JSON.stringify(state);
    localStorage.setItem('jxword-creator', stateString);
}

function restoreState() {
    let stateString = localStorage.getItem('jxword-creator');
    if (stateString) {
        let state = JSON.parse(stateString);
        return state;
    } else {
        return null;
    }
}

function clearState() {
    localStorage.clear();
}

const format_date = (date) => new Date(date).toISOString().slice(0, 10);

function XDEncode(obj) {
    let str = "";
    if (obj.title) {
        str += `Title: ${obj.title}\n`;
    }
    if (obj.author) {
        str += `Author: ${obj.author}\n`;
    }
    if (obj.editor) {
        str += `Editor: ${obj.editor}\n`;
    }
    if (obj.date) {
        str += `Date: ${format_date(obj.date)}\n`;
    }
    str += `\n\n`;
    for (let y = 0; y < obj.grid.length; y++) {
        for(let x = 0; x < obj.grid[y].length; x++) {
            str += `${obj.grid[y][x]}`;
        }
        str += `\n`;
    }
    str += `\n\n`;
    for (let q of obj.questions_across) {
        str += `A${q.num}. ${q.question} ~ ${q.answer}\n`;
    }
    str += `\n`;
    for (let q of obj.questions_down) {
        str += `D${q.num}. ${q.question} ~ ${q.answer}\n`;
    }
    return str;
}

// A library for converting .xd Crossword data to JSON (as defined by Saul Pwanson - http://xd.saul.pw) written by Jason Norwood-Young

function XDParser(data) {
    function processData(data) {
        // Split into parts
        let parts = data.split(/^$^$/gm).filter(s => s !== "\n");
        if (parts.length > 4) {
            // console.log(JSON.stringify(data));
            parts = data.split(/\r\n\r\n/g).filter(s => (s.trim()));
            for(let i = 0; i < parts.length; i++) {
                parts[i] = parts[i].replace(/\r\n/g, "\n");
            }
        }
        if (parts.length !== 4) throw (`Too many parts - expected 4, found ${parts.length}`);
        const rawMeta = parts[0];
        const rawGrid = parts[1];
        const rawAcross = parts[2];
        const rawDown = parts[3];
        const meta = processMeta(rawMeta);
        const grid = processGrid(rawGrid);
        const across = processClues(rawAcross);
        const down = processClues(rawDown);
        return { meta, grid, across, down, rawGrid, rawAcross, rawDown, rawMeta, };
    }

    function processMeta(rawMeta) {
        const metaLines = rawMeta.split("\n").filter(s => (s) && s !== "\n");
        let meta = {};
        metaLines.forEach(metaLine => {
            const lineParts = metaLine.split(": ");
            meta[lineParts[0]] = lineParts[1];
        });
        return meta;
    }

    function processGrid(rawGrid) {
        let result = [];
        const lines = rawGrid.split("\n").filter(s => (s) && s !== "\n");
        for (let x = 0; x < lines.length; x++) {
            result[x] = lines[x].split("");
        }
        return result;
    }

    function processClues(rawClues) {
        let result = [];
        const lines = rawClues.split("\n").filter(s => (s) && s !== "\n");
        const regex = /(^.\d*)\.\s(.*)\s~\s(.*)/;
        for (let x = 0; x < lines.length; x++) {
            if (!lines[x].trim()) continue;
            const parts = lines[x].match(regex);
            if (parts.length !== 4) throw (`Could not parse question ${lines[x]}`);
            // Unescape string
            const question = parts[2].replace(/\\/g, "");
            result[x] = {
                num: parts[1],
                question: question,
                answer: parts[3]
            };
        }
        return result;
    }

    return processData(data);
}

var xdCrosswordParser = XDParser;

/* src/JXWordCreator.svelte generated by Svelte v3.46.4 */

function create_fragment(ctx) {
	let main;
	let instructions;
	let updating_visible;
	let t0;
	let div2;
	let label0;
	let t2;
	let input0;
	let t3;
	let label1;
	let t5;
	let input1;
	let t6;
	let label2;
	let t8;
	let input2;
	let t9;
	let label3;
	let t11;
	let input3;
	let t12;
	let label4;
	let t14;
	let input4;
	let t15;
	let div1;
	let div0;
	let menu;
	let t16;
	let grid_1;
	let updating_Container;
	let t17;
	let label5;
	let t19;
	let input5;
	let t20;
	let textarea;
	let current;
	let mounted;
	let dispose;

	function instructions_visible_binding(value) {
		/*instructions_visible_binding*/ ctx[21](value);
	}

	let instructions_props = {};

	if (/*instructionsVisible*/ ctx[11] !== void 0) {
		instructions_props.visible = /*instructionsVisible*/ ctx[11];
	}

	instructions = new Instructions({ props: instructions_props });
	binding_callbacks.push(() => bind(instructions, 'visible', instructions_visible_binding));
	menu = new Menu({});
	menu.$on("reset", /*handleReset*/ ctx[17]);
	menu.$on("instructions", /*handleInstructions*/ ctx[19]);

	function grid_1_Container_binding(value) {
		/*grid_1_Container_binding*/ ctx[28](value);
	}

	let grid_1_props = {
		size: /*size*/ ctx[9],
		grid: /*grid*/ ctx[1]
	};

	if (/*gridComponentContainer*/ ctx[8] !== void 0) {
		grid_1_props.Container = /*gridComponentContainer*/ ctx[8];
	}

	grid_1 = new Grid({ props: grid_1_props });
	/*grid_1_binding*/ ctx[27](grid_1);
	binding_callbacks.push(() => bind(grid_1, 'Container', grid_1_Container_binding));
	grid_1.$on("change", /*handleStateChange*/ ctx[16]);
	grid_1.$on("move", /*handleMove*/ ctx[12]);
	grid_1.$on("letter", /*handleLetter*/ ctx[13]);
	grid_1.$on("backspace", /*handleBackspace*/ ctx[15]);
	grid_1.$on("enter", /*handleEnter*/ ctx[14]);

	return {
		c() {
			main = element("main");
			create_component(instructions.$$.fragment);
			t0 = space();
			div2 = element("div");
			label0 = element("label");
			label0.textContent = "Title";
			t2 = space();
			input0 = element("input");
			t3 = space();
			label1 = element("label");
			label1.textContent = "Author";
			t5 = space();
			input1 = element("input");
			t6 = space();
			label2 = element("label");
			label2.textContent = "Editor";
			t8 = space();
			input2 = element("input");
			t9 = space();
			label3 = element("label");
			label3.textContent = "Date";
			t11 = space();
			input3 = element("input");
			t12 = space();
			label4 = element("label");
			label4.textContent = "Size";
			t14 = space();
			input4 = element("input");
			t15 = space();
			div1 = element("div");
			div0 = element("div");
			create_component(menu.$$.fragment);
			t16 = space();
			create_component(grid_1.$$.fragment);
			t17 = space();
			label5 = element("label");
			label5.textContent = "Upload an XD file (optional)";
			t19 = space();
			input5 = element("input");
			t20 = space();
			textarea = element("textarea");
			attr(label0, "for", "title");
			attr(label0, "class", "svelte-vsl3gf");
			attr(input0, "id", "title");
			attr(input0, "name", "title");
			attr(input0, "type", "text");
			attr(input0, "class", "svelte-vsl3gf");
			attr(label1, "for", "author");
			attr(label1, "class", "svelte-vsl3gf");
			attr(input1, "id", "author");
			attr(input1, "name", "author");
			attr(input1, "type", "text");
			attr(input1, "class", "svelte-vsl3gf");
			attr(label2, "for", "editor");
			attr(label2, "class", "svelte-vsl3gf");
			attr(input2, "id", "editor");
			attr(input2, "name", "editor");
			attr(input2, "type", "text");
			attr(input2, "class", "svelte-vsl3gf");
			attr(label3, "for", "date");
			attr(label3, "class", "svelte-vsl3gf");
			attr(input3, "id", "date");
			attr(input3, "name", "date");
			attr(input3, "type", "date");
			attr(input3, "class", "svelte-vsl3gf");
			attr(label4, "for", "size");
			attr(label4, "class", "svelte-vsl3gf");
			attr(input4, "type", "number");
			attr(input4, "name", "size");
			attr(input4, "id", "size");
			attr(input4, "placeholder", "size");
			attr(input4, "default", "5");
			attr(input4, "min", "2");
			attr(input4, "class", "svelte-vsl3gf");
			attr(div0, "class", "jxword-header");
			attr(div1, "class", "jxword-container svelte-vsl3gf");
			attr(label5, "for", "file");
			attr(label5, "class", "svelte-vsl3gf");
			attr(input5, "class", "drop_zone svelte-vsl3gf");
			attr(input5, "type", "file");
			attr(input5, "id", "file");
			attr(input5, "name", "files");
			attr(input5, "accept", ".xd");
			attr(textarea, "id", "xd");
			attr(textarea, "name", "xd");
			attr(textarea, "class", "jxword-xd-textarea svelte-vsl3gf");
			set_style(textarea, "display", /*displayXd*/ ctx[6] ? 'block' : 'none', false);
			attr(div2, "class", "jxword-form-container svelte-vsl3gf");
			attr(main, "class", "svelte-vsl3gf");
		},
		m(target, anchor) {
			insert(target, main, anchor);
			mount_component(instructions, main, null);
			append(main, t0);
			append(main, div2);
			append(div2, label0);
			append(div2, t2);
			append(div2, input0);
			set_input_value(input0, /*title*/ ctx[2]);
			append(div2, t3);
			append(div2, label1);
			append(div2, t5);
			append(div2, input1);
			set_input_value(input1, /*author*/ ctx[3]);
			append(div2, t6);
			append(div2, label2);
			append(div2, t8);
			append(div2, input2);
			set_input_value(input2, /*editor*/ ctx[4]);
			append(div2, t9);
			append(div2, label3);
			append(div2, t11);
			append(div2, input3);
			set_input_value(input3, /*date*/ ctx[5]);
			append(div2, t12);
			append(div2, label4);
			append(div2, t14);
			append(div2, input4);
			set_input_value(input4, /*size*/ ctx[9]);
			append(div2, t15);
			append(div2, div1);
			append(div1, div0);
			mount_component(menu, div0, null);
			append(div1, t16);
			mount_component(grid_1, div1, null);
			append(div2, t17);
			append(div2, label5);
			append(div2, t19);
			append(div2, input5);
			/*input5_binding*/ ctx[29](input5);
			append(div2, t20);
			append(div2, textarea);
			set_input_value(textarea, /*xd*/ ctx[0]);
			current = true;

			if (!mounted) {
				dispose = [
					listen(input0, "input", /*input0_input_handler*/ ctx[22]),
					listen(input0, "change", /*handleStateChange*/ ctx[16]),
					listen(input1, "input", /*input1_input_handler*/ ctx[23]),
					listen(input1, "change", /*handleStateChange*/ ctx[16]),
					listen(input2, "input", /*input2_input_handler*/ ctx[24]),
					listen(input2, "change", /*handleStateChange*/ ctx[16]),
					listen(input3, "input", /*input3_input_handler*/ ctx[25]),
					listen(input3, "change", /*handleStateChange*/ ctx[16]),
					listen(input4, "input", /*input4_input_handler*/ ctx[26]),
					listen(input5, "change", /*handleFileSelect*/ ctx[18]),
					listen(textarea, "input", /*textarea_input_handler*/ ctx[30])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			const instructions_changes = {};

			if (!updating_visible && dirty[0] & /*instructionsVisible*/ 2048) {
				updating_visible = true;
				instructions_changes.visible = /*instructionsVisible*/ ctx[11];
				add_flush_callback(() => updating_visible = false);
			}

			instructions.$set(instructions_changes);

			if (dirty[0] & /*title*/ 4 && input0.value !== /*title*/ ctx[2]) {
				set_input_value(input0, /*title*/ ctx[2]);
			}

			if (dirty[0] & /*author*/ 8 && input1.value !== /*author*/ ctx[3]) {
				set_input_value(input1, /*author*/ ctx[3]);
			}

			if (dirty[0] & /*editor*/ 16 && input2.value !== /*editor*/ ctx[4]) {
				set_input_value(input2, /*editor*/ ctx[4]);
			}

			if (dirty[0] & /*date*/ 32) {
				set_input_value(input3, /*date*/ ctx[5]);
			}

			if (dirty[0] & /*size*/ 512 && to_number(input4.value) !== /*size*/ ctx[9]) {
				set_input_value(input4, /*size*/ ctx[9]);
			}

			const grid_1_changes = {};
			if (dirty[0] & /*size*/ 512) grid_1_changes.size = /*size*/ ctx[9];
			if (dirty[0] & /*grid*/ 2) grid_1_changes.grid = /*grid*/ ctx[1];

			if (!updating_Container && dirty[0] & /*gridComponentContainer*/ 256) {
				updating_Container = true;
				grid_1_changes.Container = /*gridComponentContainer*/ ctx[8];
				add_flush_callback(() => updating_Container = false);
			}

			grid_1.$set(grid_1_changes);

			if (dirty[0] & /*xd*/ 1) {
				set_input_value(textarea, /*xd*/ ctx[0]);
			}

			if (dirty[0] & /*displayXd*/ 64) {
				set_style(textarea, "display", /*displayXd*/ ctx[6] ? 'block' : 'none', false);
			}
		},
		i(local) {
			if (current) return;
			transition_in(instructions.$$.fragment, local);
			transition_in(menu.$$.fragment, local);
			transition_in(grid_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(instructions.$$.fragment, local);
			transition_out(menu.$$.fragment, local);
			transition_out(grid_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(main);
			destroy_component(instructions);
			destroy_component(menu);
			/*grid_1_binding*/ ctx[27](null);
			destroy_component(grid_1);
			/*input5_binding*/ ctx[29](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let $questionsDown;
	let $questionsAcross;
	let $currentDirection;
	component_subscribe($$self, questionsDown, $$value => $$invalidate(32, $questionsDown = $$value));
	component_subscribe($$self, questionsAcross, $$value => $$invalidate(33, $questionsAcross = $$value));
	component_subscribe($$self, currentDirection, $$value => $$invalidate(34, $currentDirection = $$value));
	const save_state = true;
	let { xd } = $$props;
	let { grid = [...Array(10)].map(e => Array(10)) } = $$props;
	let { title } = $$props;
	let { author } = $$props;
	let { editor } = $$props;
	let { date } = $$props;
	let { displayXd = true } = $$props;

	// State
	let gridComponent;

	let gridComponentContainer;
	let size = grid.length;

	let state = {
		grid,
		size,
		current_x: 0,
		current_y: 0,
		direction: "across",
		questions_across: $questionsAcross,
		questions_down: $questionsDown
	};

	let getState = () => {
		let { x: current_x, y: current_y } = gridComponent.getCurrentPos();

		return {
			grid,
			size,
			current_x,
			current_y,
			direction: $currentDirection,
			questions_across: $questionsAcross,
			questions_down: $questionsDown,
			title,
			author,
			editor,
			date
		};
	};

	function handleMove(event) {
		const direction = event.detail;
		let newDir;

		if (direction === "down" || direction === "up") {
			newDir = "down";
		}

		if (direction === "left" || direction === "right") {
			newDir = "across";
		}

		if (newDir !== $currentDirection) {
			gridComponent.setDir(newDir);
		} else {
			gridComponent.handleMove(direction);
		}
	}

	function handleLetter(event) {
		event.preventDefault();
		const letter = event.detail;

		if (letter === " ") {
			gridComponent.toggleDir();
			return;
		}

		let { x, y } = gridComponent.getCurrentPos();
		$$invalidate(1, grid[y][x] = letter, grid);

		if ($currentDirection === "across") {
			gridComponent.moveRight();
		} else {
			gridComponent.moveDown();
		}
	}

	function handleEnter(event) {
		let { x, y } = gridComponent.getCurrentPos();
		let selected_question;

		let questions = $currentDirection === "across"
		? $questionsAcross
		: $questionsDown;

		if ($currentDirection === "across") {
			selected_question = questions.find(q => y === q.y && x >= q.x && x <= q.x + q.answer.length - 1);

			if (selected_question) {
				selected_question.editing = true;
				set_store_value(questionsAcross, $questionsAcross = questions, $questionsAcross);
			}
		} else {
			selected_question = questions.find(q => x === q.x && y >= q.y && y <= q.y + q.answer.length - 1);

			if (selected_question) {
				selected_question.editing = true;
				set_store_value(questionsDown, $questionsDown = questions, $questionsDown);
			}
		}
	}

	function handleBackspace(event) {
		event.preventDefault();
		let { x, y } = gridComponent.getCurrentPos();
		$$invalidate(1, grid[y][x] = "", grid);

		if ($currentDirection === "across") {
			gridComponent.moveLeft();
		} else {
			gridComponent.moveUp();
		}
	}

	function handleStateChange() {
		saveState(getState());
		$$invalidate(0, xd = XDEncode(getState()));
	}

	onMount(() => {
		if (xd) {
			loadXd(xd);
		} else {
			{
				state = restoreState() || state;
			}

			$$invalidate(1, grid = state.grid);
			$$invalidate(9, size = state.size);
			$$invalidate(3, author = state.author);
			$$invalidate(4, editor = state.editor);
			$$invalidate(5, date = state.date);
			$$invalidate(2, title = state.title);
			questionsAcross.set(state.questions_across);
			questionsDown.set(state.questions_down);
			gridComponent.setDir(state.direction);
			gridComponent.setCurrentPos(state.current_x, state.current_y);
		}
	});

	function handleReset() {
		clearState();
		$$invalidate(9, size = 10);
		gridComponent.setDir("across");
		gridComponent.setCurrentPos(0, 0);
		$$invalidate(2, title = "");
		$$invalidate(3, author = "");
		$$invalidate(4, editor = "");
		$$invalidate(5, date = "");
		$$invalidate(1, grid = [...Array(10)].map(e => Array(10)));
		questionsAcross.set([]);
		clearState();
		questionsDown.set([]);
		clearState();
		$$invalidate(0, xd = "");
		clearState();
	}

	async function loadXd(xd) {
		const data = xdCrosswordParser(xd);
		console.log(data);
		$$invalidate(1, grid = data.grid);
		$$invalidate(9, size = data.grid.length);
		$$invalidate(3, author = data.meta.Author);
		$$invalidate(4, editor = data.meta.Editor);
		$$invalidate(5, date = data.meta.Date);
		$$invalidate(2, title = data.meta.Title);
		gridComponent.setDir("across");
		gridComponent.setCurrentPos(0, 0);
		await tick();
		let questions_across = $questionsAcross;

		for (let question of questions_across) {
			let matching_question = data.across.find(q => q.num === `A${question.num}`);

			// console.log(matching_question);
			if (matching_question) {
				question.question = matching_question.question;
			}
		}

		questionsAcross.set(questions_across);
		let questions_down = $questionsDown;

		for (let question of questions_down) {
			let matching_question = data.down.find(q => q.num === `D${question.num}`);

			// console.log(matching_question);
			if (matching_question) {
				question.question = matching_question.question;
			}
		}

		questionsDown.set(questions_down);
		handleStateChange();
	}

	let fileInput;

	function handleFileSelect() {
		const reader = new FileReader();

		reader.onload = (function () {
			return async function (e) {
				try {
					await loadXd(e.target.result);
				} catch(err) {
					console.error(err);
					throw "Unable to parse file";
				}
			};
		})(fileInput.files[0]);

		// Read in the image file as a data URL.
		reader.readAsText(fileInput.files[0]);
	}

	let instructionsVisible;

	function handleInstructions() {
		$$invalidate(11, instructionsVisible = true);
	}

	function instructions_visible_binding(value) {
		instructionsVisible = value;
		$$invalidate(11, instructionsVisible);
	}

	function input0_input_handler() {
		title = this.value;
		$$invalidate(2, title);
	}

	function input1_input_handler() {
		author = this.value;
		$$invalidate(3, author);
	}

	function input2_input_handler() {
		editor = this.value;
		$$invalidate(4, editor);
	}

	function input3_input_handler() {
		date = this.value;
		$$invalidate(5, date);
	}

	function input4_input_handler() {
		size = to_number(this.value);
		$$invalidate(9, size);
	}

	function grid_1_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			gridComponent = $$value;
			$$invalidate(7, gridComponent);
		});
	}

	function grid_1_Container_binding(value) {
		gridComponentContainer = value;
		$$invalidate(8, gridComponentContainer);
	}

	function input5_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			fileInput = $$value;
			$$invalidate(10, fileInput);
		});
	}

	function textarea_input_handler() {
		xd = this.value;
		$$invalidate(0, xd);
	}

	$$self.$$set = $$props => {
		if ('xd' in $$props) $$invalidate(0, xd = $$props.xd);
		if ('grid' in $$props) $$invalidate(1, grid = $$props.grid);
		if ('title' in $$props) $$invalidate(2, title = $$props.title);
		if ('author' in $$props) $$invalidate(3, author = $$props.author);
		if ('editor' in $$props) $$invalidate(4, editor = $$props.editor);
		if ('date' in $$props) $$invalidate(5, date = $$props.date);
		if ('displayXd' in $$props) $$invalidate(6, displayXd = $$props.displayXd);
	};

	return [
		xd,
		grid,
		title,
		author,
		editor,
		date,
		displayXd,
		gridComponent,
		gridComponentContainer,
		size,
		fileInput,
		instructionsVisible,
		handleMove,
		handleLetter,
		handleEnter,
		handleBackspace,
		handleStateChange,
		handleReset,
		handleFileSelect,
		handleInstructions,
		save_state,
		instructions_visible_binding,
		input0_input_handler,
		input1_input_handler,
		input2_input_handler,
		input3_input_handler,
		input4_input_handler,
		grid_1_binding,
		grid_1_Container_binding,
		input5_binding,
		textarea_input_handler
	];
}

class JXWordCreator extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance,
			create_fragment,
			safe_not_equal,
			{
				save_state: 20,
				xd: 0,
				grid: 1,
				title: 2,
				author: 3,
				editor: 4,
				date: 5,
				displayXd: 6
			},
			null,
			[-1, -1]
		);
	}

	get save_state() {
		return this.$$.ctx[20];
	}
}

function dist (target, props) {
    return new JXWordCreator({
        target,
        props
    });
}

module.exports = dist;


/***/ }),

/***/ "./node_modules/jxword-creator/dist/dist.css":
/*!***************************************************!*\
  !*** ./node_modules/jxword-creator/dist/dist.css ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!************************!*\
  !*** ./src/creator.js ***!
  \************************/
const Creator = __webpack_require__(/*! jxword-creator/dist/jxwordcreator.js */ "./node_modules/jxword-creator/dist/jxwordcreator.js");
__webpack_require__(/*! jxword-creator/dist/dist.css */ "./node_modules/jxword-creator/dist/dist.css");
const el = document.getElementById("crosswordengine-creator-container");
const props = {
    save_state: false,
};
if (typeof xd !== 'undefined') {
    props.xd = xd;
}
Creator(el, props);
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Jvc3N3b3JkZW5naW5lLmNyZWF0b3IuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNBLGtCQUFrQix3REFBd0QsK0JBQStCLGFBQWEscUdBQXFHLDJCQUEyQixrREFBa0Q7QUFDeFM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsdUJBQXVCO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLDZCQUE2QjtBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLCtDQUErQztBQUMzRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaURBQWlEO0FBQ2pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxHQUFHO0FBQ2QsV0FBVyxtQkFBbUI7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0NBQW9DLDZCQUE2QjtBQUNqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQzs7QUFFbkM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsdUVBQXVFO0FBQ3ZFO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLG9CQUFvQjtBQUN4QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsT0FBTztBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsV0FBVztBQUNYO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQVc7QUFDWDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047O0FBRUE7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQVc7QUFDWDtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxpQkFBaUIsdUJBQXVCO0FBQ3hDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLG1CQUFtQix3QkFBd0I7QUFDM0M7QUFDQTs7QUFFQTtBQUNBLEdBQUc7QUFDSDtBQUNBLG1CQUFtQix3QkFBd0I7QUFDM0M7QUFDQTs7QUFFQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxnQkFBZ0IsdUJBQXVCO0FBQ3ZDOztBQUVBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxXQUFXLHdCQUF3QjtBQUNuQztBQUNBOztBQUVBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQVc7QUFDWDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyx3QkFBd0I7QUFDL0IsT0FBTyxzQkFBc0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sWUFBWTs7QUFFbkI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHFCQUFxQixxQkFBcUI7QUFDMUM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGdDQUFnQyx5QkFBeUI7QUFDekQ7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxXQUFXO0FBQ1g7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsWUFBWTtBQUNaO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGlCQUFpQix5QkFBeUI7QUFDMUM7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsRUFBRTs7QUFFRjtBQUNBOztBQUVBLGlCQUFpQix1QkFBdUI7QUFDeEM7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsRUFBRTs7QUFFRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1CQUFtQiwwQkFBMEI7QUFDN0M7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1CQUFtQix3QkFBd0I7QUFDM0M7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsbUJBQW1CLDBCQUEwQjtBQUM3QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1CQUFtQix3QkFBd0I7QUFDM0M7QUFDQTs7QUFFQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxnQkFBZ0IseUJBQXlCO0FBQ3pDOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUEsa0NBQWtDLDBCQUEwQjtBQUM1RDtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLGdCQUFnQix1QkFBdUI7QUFDdkM7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQSxnQ0FBZ0Msd0JBQXdCO0FBQ3hEO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBOztBQUVBLG1CQUFtQix5QkFBeUI7QUFDNUM7QUFDQTs7QUFFQSxtQkFBbUIsdUJBQXVCO0FBQzFDO0FBQ0E7O0FBRUE7QUFDQSxHQUFHO0FBQ0g7QUFDQTs7QUFFQSxtQkFBbUIsMEJBQTBCO0FBQzdDO0FBQ0E7O0FBRUE7O0FBRUEsbUJBQW1CLHdCQUF3QjtBQUMzQztBQUNBOztBQUVBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsRUFBRTs7QUFFRjtBQUNBO0FBQ0EsRUFBRTs7QUFFRjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLHVFQUF1RTtBQUN2RTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsaUJBQWlCLHlCQUF5QjtBQUMxQztBQUNBOztBQUVBO0FBQ0E7QUFDQSxtQkFBbUIsd0JBQXdCO0FBQzNDO0FBQ0E7O0FBRUE7QUFDQSxHQUFHO0FBQ0g7QUFDQSxtQkFBbUIsd0JBQXdCO0FBQzNDO0FBQ0E7O0FBRUE7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsZ0JBQWdCLHlCQUF5QjtBQUN6Qzs7QUFFQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsV0FBVyx3QkFBd0I7QUFDbkM7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsaUJBQWlCLHVCQUF1QjtBQUN4QztBQUNBOztBQUVBLDZCQUE2QjtBQUM3QjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsbUJBQW1CLHdCQUF3QjtBQUMzQztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1CQUFtQix3QkFBd0I7QUFDM0M7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGdCQUFnQix1QkFBdUI7QUFDdkM7O0FBRUE7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQVcsd0JBQXdCO0FBQ25DO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU8sWUFBWTtBQUNuQixPQUFPLFFBQVE7QUFDZixPQUFPLFlBQVk7QUFDbkIsT0FBTyxZQUFZO0FBQ25CLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sbUJBQW1CO0FBQzFCLE9BQU8sb0JBQW9CO0FBQzNCLE9BQU8seUJBQXlCO0FBQ2hDLE9BQU8sdUJBQXVCO0FBQzlCLE9BQU8sYUFBYTtBQUNwQixPQUFPLDhCQUE4QjtBQUNyQyxPQUFPLDhCQUE4QjtBQUNyQyxPQUFPLHVCQUF1QjtBQUM5QixPQUFPLDZCQUE2QjtBQUNwQztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsbUJBQW1CLDZCQUE2QjtBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxjQUFjO0FBQ2Q7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0osbUJBQW1CLDJCQUEyQjtBQUM5QztBQUNBLGNBQWM7QUFDZDs7QUFFQTtBQUNBLGlFQUFpRSxvQ0FBb0M7QUFDckc7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFFBQVEsT0FBTztBQUNmOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQVc7QUFDWDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQVc7QUFDWDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLHlCQUF5QixZQUFZO0FBQ3JDO0FBQ0E7QUFDQSxJQUFJO0FBQ0oseUJBQXlCLFlBQVk7QUFDckM7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLDJCQUEyQixVQUFVO0FBQ3JDOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBLDJCQUEyQixRQUFRO0FBQ25DOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0EsMkJBQTJCLFVBQVU7QUFDckM7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsMkJBQTJCLFFBQVE7QUFDbkM7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsV0FBVztBQUNYOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBLElBQUk7QUFDSjtBQUNBLElBQUk7QUFDSjtBQUNBLElBQUk7QUFDSjtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsVUFBVSx1QkFBdUI7O0FBRWpDO0FBQ0EsbUJBQW1CLHVCQUF1QjtBQUMxQztBQUNBO0FBQ0EsSUFBSTtBQUNKLG1CQUFtQix1QkFBdUI7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EscUJBQXFCLFVBQVU7QUFDL0I7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHFCQUFxQixpQkFBaUI7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLG9CQUFvQixVQUFVO0FBQzlCO0FBQ0E7QUFDQTs7QUFFQSxxQkFBcUIsVUFBVTtBQUMvQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsT0FBTyxrQkFBa0I7O0FBRXpCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx1RUFBdUUsWUFBWTtBQUNuRjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUIsVUFBVTtBQUNuQztBQUNBO0FBQ0EsMEJBQTBCLFdBQVc7QUFDckM7QUFDQTtBQUNBLDBCQUEwQixXQUFXO0FBQ3JDO0FBQ0E7QUFDQSx3QkFBd0Isc0JBQXNCO0FBQzlDO0FBQ0E7QUFDQSxvQkFBb0IscUJBQXFCO0FBQ3pDLHVCQUF1Qix3QkFBd0I7QUFDL0Msc0JBQXNCLGVBQWU7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixNQUFNLElBQUksWUFBWSxJQUFJLFNBQVM7QUFDdEQ7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLE1BQU0sSUFBSSxZQUFZLElBQUksU0FBUztBQUN0RDtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsa0JBQWtCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBLDZFQUE2RSxhQUFhO0FBQzFGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGtCQUFrQjtBQUMxQztBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixrQkFBa0I7QUFDMUM7QUFDQTtBQUNBLHVFQUF1RSxTQUFTO0FBQ2hGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBLG1DQUFtQywyQkFBMkI7QUFDOUQ7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLHFCQUFxQixxQkFBcUI7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU8sS0FBSztBQUNaLE9BQU8sNENBQTRDO0FBQ25ELE9BQU8sUUFBUTtBQUNmLE9BQU8sU0FBUztBQUNoQixPQUFPLFNBQVM7QUFDaEIsT0FBTyxPQUFPO0FBQ2QsT0FBTyxtQkFBbUI7O0FBRTFCO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxRQUFRLDZCQUE2Qjs7QUFFckM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsUUFBUSxPQUFPO0FBQ2Y7O0FBRUE7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxRQUFRLE9BQU87QUFDZjs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFFBQVEsT0FBTztBQUNmOztBQUVBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7O0FBRUY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLCtEQUErRCxhQUFhOztBQUU1RTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSw2REFBNkQsYUFBYTs7QUFFMUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTs7Ozs7Ozs7Ozs7OztBQ2ptSEE7Ozs7Ozs7VUNBQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQ3RCQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0Q7Ozs7Ozs7Ozs7QUNOQSxnQkFBZ0IsbUJBQU8sQ0FBQyxpR0FBc0M7QUFDOUQsbUJBQU8sQ0FBQyxpRkFBOEI7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQiIsInNvdXJjZXMiOlsid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvLi9ub2RlX21vZHVsZXMvanh3b3JkLWNyZWF0b3IvZGlzdC9qeHdvcmRjcmVhdG9yLmpzIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvLi9ub2RlX21vZHVsZXMvanh3b3JkLWNyZWF0b3IvZGlzdC9kaXN0LmNzcz9mNzgwIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvLi9zcmMvY3JlYXRvci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcbihmdW5jdGlvbihsLCByKSB7IGlmICghbCB8fCBsLmdldEVsZW1lbnRCeUlkKCdsaXZlcmVsb2Fkc2NyaXB0JykpIHJldHVybjsgciA9IGwuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7IHIuYXN5bmMgPSAxOyByLnNyYyA9ICcvLycgKyAoc2VsZi5sb2NhdGlvbi5ob3N0IHx8ICdsb2NhbGhvc3QnKS5zcGxpdCgnOicpWzBdICsgJzozNTcyOS9saXZlcmVsb2FkLmpzP3NuaXB2ZXI9MSc7IHIuaWQgPSAnbGl2ZXJlbG9hZHNjcmlwdCc7IGwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChyKSB9KShzZWxmLmRvY3VtZW50KTtcbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gbm9vcCgpIHsgfVxuZnVuY3Rpb24gcnVuKGZuKSB7XG4gICAgcmV0dXJuIGZuKCk7XG59XG5mdW5jdGlvbiBibGFua19vYmplY3QoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5jcmVhdGUobnVsbCk7XG59XG5mdW5jdGlvbiBydW5fYWxsKGZucykge1xuICAgIGZucy5mb3JFYWNoKHJ1bik7XG59XG5mdW5jdGlvbiBpc19mdW5jdGlvbih0aGluZykge1xuICAgIHJldHVybiB0eXBlb2YgdGhpbmcgPT09ICdmdW5jdGlvbic7XG59XG5mdW5jdGlvbiBzYWZlX25vdF9lcXVhbChhLCBiKSB7XG4gICAgcmV0dXJuIGEgIT0gYSA/IGIgPT0gYiA6IGEgIT09IGIgfHwgKChhICYmIHR5cGVvZiBhID09PSAnb2JqZWN0JykgfHwgdHlwZW9mIGEgPT09ICdmdW5jdGlvbicpO1xufVxuZnVuY3Rpb24gaXNfZW1wdHkob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwO1xufVxuZnVuY3Rpb24gc3Vic2NyaWJlKHN0b3JlLCAuLi5jYWxsYmFja3MpIHtcbiAgICBpZiAoc3RvcmUgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICB9XG4gICAgY29uc3QgdW5zdWIgPSBzdG9yZS5zdWJzY3JpYmUoLi4uY2FsbGJhY2tzKTtcbiAgICByZXR1cm4gdW5zdWIudW5zdWJzY3JpYmUgPyAoKSA9PiB1bnN1Yi51bnN1YnNjcmliZSgpIDogdW5zdWI7XG59XG5mdW5jdGlvbiBjb21wb25lbnRfc3Vic2NyaWJlKGNvbXBvbmVudCwgc3RvcmUsIGNhbGxiYWNrKSB7XG4gICAgY29tcG9uZW50LiQkLm9uX2Rlc3Ryb3kucHVzaChzdWJzY3JpYmUoc3RvcmUsIGNhbGxiYWNrKSk7XG59XG5mdW5jdGlvbiBzZXRfc3RvcmVfdmFsdWUoc3RvcmUsIHJldCwgdmFsdWUpIHtcbiAgICBzdG9yZS5zZXQodmFsdWUpO1xuICAgIHJldHVybiByZXQ7XG59XG5mdW5jdGlvbiBhcHBlbmQodGFyZ2V0LCBub2RlKSB7XG4gICAgdGFyZ2V0LmFwcGVuZENoaWxkKG5vZGUpO1xufVxuZnVuY3Rpb24gaW5zZXJ0KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgdGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCBhbmNob3IgfHwgbnVsbCk7XG59XG5mdW5jdGlvbiBkZXRhY2gobm9kZSkge1xuICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lfZWFjaChpdGVyYXRpb25zLCBkZXRhY2hpbmcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZXJhdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKGl0ZXJhdGlvbnNbaV0pXG4gICAgICAgICAgICBpdGVyYXRpb25zW2ldLmQoZGV0YWNoaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBlbGVtZW50KG5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKTtcbn1cbmZ1bmN0aW9uIHN2Z19lbGVtZW50KG5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIG5hbWUpO1xufVxuZnVuY3Rpb24gdGV4dChkYXRhKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpO1xufVxuZnVuY3Rpb24gc3BhY2UoKSB7XG4gICAgcmV0dXJuIHRleHQoJyAnKTtcbn1cbmZ1bmN0aW9uIGVtcHR5KCkge1xuICAgIHJldHVybiB0ZXh0KCcnKTtcbn1cbmZ1bmN0aW9uIGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucykge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG59XG5mdW5jdGlvbiBhdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgICBlbHNlIGlmIChub2RlLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpICE9PSB2YWx1ZSlcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiB0b19udW1iZXIodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09ICcnID8gbnVsbCA6ICt2YWx1ZTtcbn1cbmZ1bmN0aW9uIGNoaWxkcmVuKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShlbGVtZW50LmNoaWxkTm9kZXMpO1xufVxuZnVuY3Rpb24gc2V0X2RhdGEodGV4dCwgZGF0YSkge1xuICAgIGRhdGEgPSAnJyArIGRhdGE7XG4gICAgaWYgKHRleHQud2hvbGVUZXh0ICE9PSBkYXRhKVxuICAgICAgICB0ZXh0LmRhdGEgPSBkYXRhO1xufVxuZnVuY3Rpb24gc2V0X2lucHV0X3ZhbHVlKGlucHV0LCB2YWx1ZSkge1xuICAgIGlucHV0LnZhbHVlID0gdmFsdWUgPT0gbnVsbCA/ICcnIDogdmFsdWU7XG59XG5mdW5jdGlvbiBzZXRfc3R5bGUobm9kZSwga2V5LCB2YWx1ZSwgaW1wb3J0YW50KSB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgIG5vZGUuc3R5bGUucmVtb3ZlUHJvcGVydHkoa2V5KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG5vZGUuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSwgaW1wb3J0YW50ID8gJ2ltcG9ydGFudCcgOiAnJyk7XG4gICAgfVxufVxuZnVuY3Rpb24gdG9nZ2xlX2NsYXNzKGVsZW1lbnQsIG5hbWUsIHRvZ2dsZSkge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0W3RvZ2dsZSA/ICdhZGQnIDogJ3JlbW92ZSddKG5hbWUpO1xufVxuZnVuY3Rpb24gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCwgYnViYmxlcyA9IGZhbHNlKSB7XG4gICAgY29uc3QgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGUuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIGJ1YmJsZXMsIGZhbHNlLCBkZXRhaWwpO1xuICAgIHJldHVybiBlO1xufVxuXG5sZXQgY3VycmVudF9jb21wb25lbnQ7XG5mdW5jdGlvbiBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KSB7XG4gICAgY3VycmVudF9jb21wb25lbnQgPSBjb21wb25lbnQ7XG59XG5mdW5jdGlvbiBnZXRfY3VycmVudF9jb21wb25lbnQoKSB7XG4gICAgaWYgKCFjdXJyZW50X2NvbXBvbmVudClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGdW5jdGlvbiBjYWxsZWQgb3V0c2lkZSBjb21wb25lbnQgaW5pdGlhbGl6YXRpb24nKTtcbiAgICByZXR1cm4gY3VycmVudF9jb21wb25lbnQ7XG59XG5mdW5jdGlvbiBvbk1vdW50KGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQub25fbW91bnQucHVzaChmbik7XG59XG5mdW5jdGlvbiBjcmVhdGVFdmVudERpc3BhdGNoZXIoKSB7XG4gICAgY29uc3QgY29tcG9uZW50ID0gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCk7XG4gICAgcmV0dXJuICh0eXBlLCBkZXRhaWwpID0+IHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gY29tcG9uZW50LiQkLmNhbGxiYWNrc1t0eXBlXTtcbiAgICAgICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICAgICAgLy8gVE9ETyBhcmUgdGhlcmUgc2l0dWF0aW9ucyB3aGVyZSBldmVudHMgY291bGQgYmUgZGlzcGF0Y2hlZFxuICAgICAgICAgICAgLy8gaW4gYSBzZXJ2ZXIgKG5vbi1ET00pIGVudmlyb25tZW50P1xuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsKTtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5zbGljZSgpLmZvckVhY2goZm4gPT4ge1xuICAgICAgICAgICAgICAgIGZuLmNhbGwoY29tcG9uZW50LCBldmVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59XG4vLyBUT0RPIGZpZ3VyZSBvdXQgaWYgd2Ugc3RpbGwgd2FudCB0byBzdXBwb3J0XG4vLyBzaG9ydGhhbmQgZXZlbnRzLCBvciBpZiB3ZSB3YW50IHRvIGltcGxlbWVudFxuLy8gYSByZWFsIGJ1YmJsaW5nIG1lY2hhbmlzbVxuZnVuY3Rpb24gYnViYmxlKGNvbXBvbmVudCwgZXZlbnQpIHtcbiAgICBjb25zdCBjYWxsYmFja3MgPSBjb21wb25lbnQuJCQuY2FsbGJhY2tzW2V2ZW50LnR5cGVdO1xuICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IGZuLmNhbGwodGhpcywgZXZlbnQpKTtcbiAgICB9XG59XG5cbmNvbnN0IGRpcnR5X2NvbXBvbmVudHMgPSBbXTtcbmNvbnN0IGJpbmRpbmdfY2FsbGJhY2tzID0gW107XG5jb25zdCByZW5kZXJfY2FsbGJhY2tzID0gW107XG5jb25zdCBmbHVzaF9jYWxsYmFja3MgPSBbXTtcbmNvbnN0IHJlc29sdmVkX3Byb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbmxldCB1cGRhdGVfc2NoZWR1bGVkID0gZmFsc2U7XG5mdW5jdGlvbiBzY2hlZHVsZV91cGRhdGUoKSB7XG4gICAgaWYgKCF1cGRhdGVfc2NoZWR1bGVkKSB7XG4gICAgICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSB0cnVlO1xuICAgICAgICByZXNvbHZlZF9wcm9taXNlLnRoZW4oZmx1c2gpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRpY2soKSB7XG4gICAgc2NoZWR1bGVfdXBkYXRlKCk7XG4gICAgcmV0dXJuIHJlc29sdmVkX3Byb21pc2U7XG59XG5mdW5jdGlvbiBhZGRfcmVuZGVyX2NhbGxiYWNrKGZuKSB7XG4gICAgcmVuZGVyX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGFkZF9mbHVzaF9jYWxsYmFjayhmbikge1xuICAgIGZsdXNoX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbi8vIGZsdXNoKCkgY2FsbHMgY2FsbGJhY2tzIGluIHRoaXMgb3JkZXI6XG4vLyAxLiBBbGwgYmVmb3JlVXBkYXRlIGNhbGxiYWNrcywgaW4gb3JkZXI6IHBhcmVudHMgYmVmb3JlIGNoaWxkcmVuXG4vLyAyLiBBbGwgYmluZDp0aGlzIGNhbGxiYWNrcywgaW4gcmV2ZXJzZSBvcmRlcjogY2hpbGRyZW4gYmVmb3JlIHBhcmVudHMuXG4vLyAzLiBBbGwgYWZ0ZXJVcGRhdGUgY2FsbGJhY2tzLCBpbiBvcmRlcjogcGFyZW50cyBiZWZvcmUgY2hpbGRyZW4uIEVYQ0VQVFxuLy8gICAgZm9yIGFmdGVyVXBkYXRlcyBjYWxsZWQgZHVyaW5nIHRoZSBpbml0aWFsIG9uTW91bnQsIHdoaWNoIGFyZSBjYWxsZWQgaW5cbi8vICAgIHJldmVyc2Ugb3JkZXI6IGNoaWxkcmVuIGJlZm9yZSBwYXJlbnRzLlxuLy8gU2luY2UgY2FsbGJhY2tzIG1pZ2h0IHVwZGF0ZSBjb21wb25lbnQgdmFsdWVzLCB3aGljaCBjb3VsZCB0cmlnZ2VyIGFub3RoZXJcbi8vIGNhbGwgdG8gZmx1c2goKSwgdGhlIGZvbGxvd2luZyBzdGVwcyBndWFyZCBhZ2FpbnN0IHRoaXM6XG4vLyAxLiBEdXJpbmcgYmVmb3JlVXBkYXRlLCBhbnkgdXBkYXRlZCBjb21wb25lbnRzIHdpbGwgYmUgYWRkZWQgdG8gdGhlXG4vLyAgICBkaXJ0eV9jb21wb25lbnRzIGFycmF5IGFuZCB3aWxsIGNhdXNlIGEgcmVlbnRyYW50IGNhbGwgdG8gZmx1c2goKS4gQmVjYXVzZVxuLy8gICAgdGhlIGZsdXNoIGluZGV4IGlzIGtlcHQgb3V0c2lkZSB0aGUgZnVuY3Rpb24sIHRoZSByZWVudHJhbnQgY2FsbCB3aWxsIHBpY2tcbi8vICAgIHVwIHdoZXJlIHRoZSBlYXJsaWVyIGNhbGwgbGVmdCBvZmYgYW5kIGdvIHRocm91Z2ggYWxsIGRpcnR5IGNvbXBvbmVudHMuIFRoZVxuLy8gICAgY3VycmVudF9jb21wb25lbnQgdmFsdWUgaXMgc2F2ZWQgYW5kIHJlc3RvcmVkIHNvIHRoYXQgdGhlIHJlZW50cmFudCBjYWxsIHdpbGxcbi8vICAgIG5vdCBpbnRlcmZlcmUgd2l0aCB0aGUgXCJwYXJlbnRcIiBmbHVzaCgpIGNhbGwuXG4vLyAyLiBiaW5kOnRoaXMgY2FsbGJhY2tzIGNhbm5vdCB0cmlnZ2VyIG5ldyBmbHVzaCgpIGNhbGxzLlxuLy8gMy4gRHVyaW5nIGFmdGVyVXBkYXRlLCBhbnkgdXBkYXRlZCBjb21wb25lbnRzIHdpbGwgTk9UIGhhdmUgdGhlaXIgYWZ0ZXJVcGRhdGVcbi8vICAgIGNhbGxiYWNrIGNhbGxlZCBhIHNlY29uZCB0aW1lOyB0aGUgc2Vlbl9jYWxsYmFja3Mgc2V0LCBvdXRzaWRlIHRoZSBmbHVzaCgpXG4vLyAgICBmdW5jdGlvbiwgZ3VhcmFudGVlcyB0aGlzIGJlaGF2aW9yLlxuY29uc3Qgc2Vlbl9jYWxsYmFja3MgPSBuZXcgU2V0KCk7XG5sZXQgZmx1c2hpZHggPSAwOyAvLyBEbyAqbm90KiBtb3ZlIHRoaXMgaW5zaWRlIHRoZSBmbHVzaCgpIGZ1bmN0aW9uXG5mdW5jdGlvbiBmbHVzaCgpIHtcbiAgICBjb25zdCBzYXZlZF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICBkbyB7XG4gICAgICAgIC8vIGZpcnN0LCBjYWxsIGJlZm9yZVVwZGF0ZSBmdW5jdGlvbnNcbiAgICAgICAgLy8gYW5kIHVwZGF0ZSBjb21wb25lbnRzXG4gICAgICAgIHdoaWxlIChmbHVzaGlkeCA8IGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBkaXJ0eV9jb21wb25lbnRzW2ZsdXNoaWR4XTtcbiAgICAgICAgICAgIGZsdXNoaWR4Kys7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShjb21wb25lbnQuJCQpO1xuICAgICAgICB9XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgZGlydHlfY29tcG9uZW50cy5sZW5ndGggPSAwO1xuICAgICAgICBmbHVzaGlkeCA9IDA7XG4gICAgICAgIHdoaWxlIChiaW5kaW5nX2NhbGxiYWNrcy5sZW5ndGgpXG4gICAgICAgICAgICBiaW5kaW5nX2NhbGxiYWNrcy5wb3AoKSgpO1xuICAgICAgICAvLyB0aGVuLCBvbmNlIGNvbXBvbmVudHMgYXJlIHVwZGF0ZWQsIGNhbGxcbiAgICAgICAgLy8gYWZ0ZXJVcGRhdGUgZnVuY3Rpb25zLiBUaGlzIG1heSBjYXVzZVxuICAgICAgICAvLyBzdWJzZXF1ZW50IHVwZGF0ZXMuLi5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZW5kZXJfY2FsbGJhY2tzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHJlbmRlcl9jYWxsYmFja3NbaV07XG4gICAgICAgICAgICBpZiAoIXNlZW5fY2FsbGJhY2tzLmhhcyhjYWxsYmFjaykpIHtcbiAgICAgICAgICAgICAgICAvLyAuLi5zbyBndWFyZCBhZ2FpbnN0IGluZmluaXRlIGxvb3BzXG4gICAgICAgICAgICAgICAgc2Vlbl9jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlbmRlcl9jYWxsYmFja3MubGVuZ3RoID0gMDtcbiAgICB9IHdoaWxlIChkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCk7XG4gICAgd2hpbGUgKGZsdXNoX2NhbGxiYWNrcy5sZW5ndGgpIHtcbiAgICAgICAgZmx1c2hfY2FsbGJhY2tzLnBvcCgpKCk7XG4gICAgfVxuICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSBmYWxzZTtcbiAgICBzZWVuX2NhbGxiYWNrcy5jbGVhcigpO1xuICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChzYXZlZF9jb21wb25lbnQpO1xufVxuZnVuY3Rpb24gdXBkYXRlKCQkKSB7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICQkLnVwZGF0ZSgpO1xuICAgICAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgICAgICBjb25zdCBkaXJ0eSA9ICQkLmRpcnR5O1xuICAgICAgICAkJC5kaXJ0eSA9IFstMV07XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LnAoJCQuY3R4LCBkaXJ0eSk7XG4gICAgICAgICQkLmFmdGVyX3VwZGF0ZS5mb3JFYWNoKGFkZF9yZW5kZXJfY2FsbGJhY2spO1xuICAgIH1cbn1cbmNvbnN0IG91dHJvaW5nID0gbmV3IFNldCgpO1xubGV0IG91dHJvcztcbmZ1bmN0aW9uIGdyb3VwX291dHJvcygpIHtcbiAgICBvdXRyb3MgPSB7XG4gICAgICAgIHI6IDAsXG4gICAgICAgIGM6IFtdLFxuICAgICAgICBwOiBvdXRyb3MgLy8gcGFyZW50IGdyb3VwXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNoZWNrX291dHJvcygpIHtcbiAgICBpZiAoIW91dHJvcy5yKSB7XG4gICAgICAgIHJ1bl9hbGwob3V0cm9zLmMpO1xuICAgIH1cbiAgICBvdXRyb3MgPSBvdXRyb3MucDtcbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25faW4oYmxvY2ssIGxvY2FsKSB7XG4gICAgaWYgKGJsb2NrICYmIGJsb2NrLmkpIHtcbiAgICAgICAgb3V0cm9pbmcuZGVsZXRlKGJsb2NrKTtcbiAgICAgICAgYmxvY2suaShsb2NhbCk7XG4gICAgfVxufVxuZnVuY3Rpb24gdHJhbnNpdGlvbl9vdXQoYmxvY2ssIGxvY2FsLCBkZXRhY2gsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGJsb2NrICYmIGJsb2NrLm8pIHtcbiAgICAgICAgaWYgKG91dHJvaW5nLmhhcyhibG9jaykpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIG91dHJvaW5nLmFkZChibG9jayk7XG4gICAgICAgIG91dHJvcy5jLnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgb3V0cm9pbmcuZGVsZXRlKGJsb2NrKTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmIChkZXRhY2gpXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmQoMSk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGJsb2NrLm8obG9jYWwpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYmluZChjb21wb25lbnQsIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgaW5kZXggPSBjb21wb25lbnQuJCQucHJvcHNbbmFtZV07XG4gICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29tcG9uZW50LiQkLmJvdW5kW2luZGV4XSA9IGNhbGxiYWNrO1xuICAgICAgICBjYWxsYmFjayhjb21wb25lbnQuJCQuY3R4W2luZGV4XSk7XG4gICAgfVxufVxuZnVuY3Rpb24gY3JlYXRlX2NvbXBvbmVudChibG9jaykge1xuICAgIGJsb2NrICYmIGJsb2NrLmMoKTtcbn1cbmZ1bmN0aW9uIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIHRhcmdldCwgYW5jaG9yLCBjdXN0b21FbGVtZW50KSB7XG4gICAgY29uc3QgeyBmcmFnbWVudCwgb25fbW91bnQsIG9uX2Rlc3Ryb3ksIGFmdGVyX3VwZGF0ZSB9ID0gY29tcG9uZW50LiQkO1xuICAgIGZyYWdtZW50ICYmIGZyYWdtZW50Lm0odGFyZ2V0LCBhbmNob3IpO1xuICAgIGlmICghY3VzdG9tRWxlbWVudCkge1xuICAgICAgICAvLyBvbk1vdW50IGhhcHBlbnMgYmVmb3JlIHRoZSBpbml0aWFsIGFmdGVyVXBkYXRlXG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV3X29uX2Rlc3Ryb3kgPSBvbl9tb3VudC5tYXAocnVuKS5maWx0ZXIoaXNfZnVuY3Rpb24pO1xuICAgICAgICAgICAgaWYgKG9uX2Rlc3Ryb3kpIHtcbiAgICAgICAgICAgICAgICBvbl9kZXN0cm95LnB1c2goLi4ubmV3X29uX2Rlc3Ryb3kpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gRWRnZSBjYXNlIC0gY29tcG9uZW50IHdhcyBkZXN0cm95ZWQgaW1tZWRpYXRlbHksXG4gICAgICAgICAgICAgICAgLy8gbW9zdCBsaWtlbHkgYXMgYSByZXN1bHQgb2YgYSBiaW5kaW5nIGluaXRpYWxpc2luZ1xuICAgICAgICAgICAgICAgIHJ1bl9hbGwobmV3X29uX2Rlc3Ryb3kpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29tcG9uZW50LiQkLm9uX21vdW50ID0gW107XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhZnRlcl91cGRhdGUuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lfY29tcG9uZW50KGNvbXBvbmVudCwgZGV0YWNoaW5nKSB7XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQ7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgIHJ1bl9hbGwoJCQub25fZGVzdHJveSk7XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmQoZGV0YWNoaW5nKTtcbiAgICAgICAgLy8gVE9ETyBudWxsIG91dCBvdGhlciByZWZzLCBpbmNsdWRpbmcgY29tcG9uZW50LiQkIChidXQgbmVlZCB0b1xuICAgICAgICAvLyBwcmVzZXJ2ZSBmaW5hbCBzdGF0ZT8pXG4gICAgICAgICQkLm9uX2Rlc3Ryb3kgPSAkJC5mcmFnbWVudCA9IG51bGw7XG4gICAgICAgICQkLmN0eCA9IFtdO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1ha2VfZGlydHkoY29tcG9uZW50LCBpKSB7XG4gICAgaWYgKGNvbXBvbmVudC4kJC5kaXJ0eVswXSA9PT0gLTEpIHtcbiAgICAgICAgZGlydHlfY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgICAgICBjb21wb25lbnQuJCQuZGlydHkuZmlsbCgwKTtcbiAgICB9XG4gICAgY29tcG9uZW50LiQkLmRpcnR5WyhpIC8gMzEpIHwgMF0gfD0gKDEgPDwgKGkgJSAzMSkpO1xufVxuZnVuY3Rpb24gaW5pdChjb21wb25lbnQsIG9wdGlvbnMsIGluc3RhbmNlLCBjcmVhdGVfZnJhZ21lbnQsIG5vdF9lcXVhbCwgcHJvcHMsIGFwcGVuZF9zdHlsZXMsIGRpcnR5ID0gWy0xXSkge1xuICAgIGNvbnN0IHBhcmVudF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICBjb25zdCAkJCA9IGNvbXBvbmVudC4kJCA9IHtcbiAgICAgICAgZnJhZ21lbnQ6IG51bGwsXG4gICAgICAgIGN0eDogbnVsbCxcbiAgICAgICAgLy8gc3RhdGVcbiAgICAgICAgcHJvcHMsXG4gICAgICAgIHVwZGF0ZTogbm9vcCxcbiAgICAgICAgbm90X2VxdWFsLFxuICAgICAgICBib3VuZDogYmxhbmtfb2JqZWN0KCksXG4gICAgICAgIC8vIGxpZmVjeWNsZVxuICAgICAgICBvbl9tb3VudDogW10sXG4gICAgICAgIG9uX2Rlc3Ryb3k6IFtdLFxuICAgICAgICBvbl9kaXNjb25uZWN0OiBbXSxcbiAgICAgICAgYmVmb3JlX3VwZGF0ZTogW10sXG4gICAgICAgIGFmdGVyX3VwZGF0ZTogW10sXG4gICAgICAgIGNvbnRleHQ6IG5ldyBNYXAob3B0aW9ucy5jb250ZXh0IHx8IChwYXJlbnRfY29tcG9uZW50ID8gcGFyZW50X2NvbXBvbmVudC4kJC5jb250ZXh0IDogW10pKSxcbiAgICAgICAgLy8gZXZlcnl0aGluZyBlbHNlXG4gICAgICAgIGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KCksXG4gICAgICAgIGRpcnR5LFxuICAgICAgICBza2lwX2JvdW5kOiBmYWxzZSxcbiAgICAgICAgcm9vdDogb3B0aW9ucy50YXJnZXQgfHwgcGFyZW50X2NvbXBvbmVudC4kJC5yb290XG4gICAgfTtcbiAgICBhcHBlbmRfc3R5bGVzICYmIGFwcGVuZF9zdHlsZXMoJCQucm9vdCk7XG4gICAgbGV0IHJlYWR5ID0gZmFsc2U7XG4gICAgJCQuY3R4ID0gaW5zdGFuY2VcbiAgICAgICAgPyBpbnN0YW5jZShjb21wb25lbnQsIG9wdGlvbnMucHJvcHMgfHwge30sIChpLCByZXQsIC4uLnJlc3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcmVzdC5sZW5ndGggPyByZXN0WzBdIDogcmV0O1xuICAgICAgICAgICAgaWYgKCQkLmN0eCAmJiBub3RfZXF1YWwoJCQuY3R4W2ldLCAkJC5jdHhbaV0gPSB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoISQkLnNraXBfYm91bmQgJiYgJCQuYm91bmRbaV0pXG4gICAgICAgICAgICAgICAgICAgICQkLmJvdW5kW2ldKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAocmVhZHkpXG4gICAgICAgICAgICAgICAgICAgIG1ha2VfZGlydHkoY29tcG9uZW50LCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0pXG4gICAgICAgIDogW107XG4gICAgJCQudXBkYXRlKCk7XG4gICAgcmVhZHkgPSB0cnVlO1xuICAgIHJ1bl9hbGwoJCQuYmVmb3JlX3VwZGF0ZSk7XG4gICAgLy8gYGZhbHNlYCBhcyBhIHNwZWNpYWwgY2FzZSBvZiBubyBET00gY29tcG9uZW50XG4gICAgJCQuZnJhZ21lbnQgPSBjcmVhdGVfZnJhZ21lbnQgPyBjcmVhdGVfZnJhZ21lbnQoJCQuY3R4KSA6IGZhbHNlO1xuICAgIGlmIChvcHRpb25zLnRhcmdldCkge1xuICAgICAgICBpZiAob3B0aW9ucy5oeWRyYXRlKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlcyA9IGNoaWxkcmVuKG9wdGlvbnMudGFyZ2V0KTtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5sKG5vZGVzKTtcbiAgICAgICAgICAgIG5vZGVzLmZvckVhY2goZGV0YWNoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5jKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuaW50cm8pXG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGNvbXBvbmVudC4kJC5mcmFnbWVudCk7XG4gICAgICAgIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIG9wdGlvbnMudGFyZ2V0LCBvcHRpb25zLmFuY2hvciwgb3B0aW9ucy5jdXN0b21FbGVtZW50KTtcbiAgICAgICAgZmx1c2goKTtcbiAgICB9XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHBhcmVudF9jb21wb25lbnQpO1xufVxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBTdmVsdGUgY29tcG9uZW50cy4gVXNlZCB3aGVuIGRldj1mYWxzZS5cbiAqL1xuY2xhc3MgU3ZlbHRlQ29tcG9uZW50IHtcbiAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgZGVzdHJveV9jb21wb25lbnQodGhpcywgMSk7XG4gICAgICAgIHRoaXMuJGRlc3Ryb3kgPSBub29wO1xuICAgIH1cbiAgICAkb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdIHx8ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSA9IFtdKSk7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgJHNldCgkJHByb3BzKSB7XG4gICAgICAgIGlmICh0aGlzLiQkc2V0ICYmICFpc19lbXB0eSgkJHByb3BzKSkge1xuICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuJCRzZXQoJCRwcm9wcyk7XG4gICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuY29uc3Qgc3Vic2NyaWJlcl9xdWV1ZSA9IFtdO1xuLyoqXG4gKiBDcmVhdGUgYSBgV3JpdGFibGVgIHN0b3JlIHRoYXQgYWxsb3dzIGJvdGggdXBkYXRpbmcgYW5kIHJlYWRpbmcgYnkgc3Vic2NyaXB0aW9uLlxuICogQHBhcmFtIHsqPX12YWx1ZSBpbml0aWFsIHZhbHVlXG4gKiBAcGFyYW0ge1N0YXJ0U3RvcE5vdGlmaWVyPX1zdGFydCBzdGFydCBhbmQgc3RvcCBub3RpZmljYXRpb25zIGZvciBzdWJzY3JpcHRpb25zXG4gKi9cbmZ1bmN0aW9uIHdyaXRhYmxlKHZhbHVlLCBzdGFydCA9IG5vb3ApIHtcbiAgICBsZXQgc3RvcDtcbiAgICBjb25zdCBzdWJzY3JpYmVycyA9IG5ldyBTZXQoKTtcbiAgICBmdW5jdGlvbiBzZXQobmV3X3ZhbHVlKSB7XG4gICAgICAgIGlmIChzYWZlX25vdF9lcXVhbCh2YWx1ZSwgbmV3X3ZhbHVlKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBuZXdfdmFsdWU7XG4gICAgICAgICAgICBpZiAoc3RvcCkgeyAvLyBzdG9yZSBpcyByZWFkeVxuICAgICAgICAgICAgICAgIGNvbnN0IHJ1bl9xdWV1ZSA9ICFzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHN1YnNjcmliZXIgb2Ygc3Vic2NyaWJlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlclsxXSgpO1xuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyX3F1ZXVlLnB1c2goc3Vic2NyaWJlciwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocnVuX3F1ZXVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3Vic2NyaWJlcl9xdWV1ZS5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlcl9xdWV1ZVtpXVswXShzdWJzY3JpYmVyX3F1ZXVlW2kgKyAxXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlcl9xdWV1ZS5sZW5ndGggPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiB1cGRhdGUoZm4pIHtcbiAgICAgICAgc2V0KGZuKHZhbHVlKSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHN1YnNjcmliZShydW4sIGludmFsaWRhdGUgPSBub29wKSB7XG4gICAgICAgIGNvbnN0IHN1YnNjcmliZXIgPSBbcnVuLCBpbnZhbGlkYXRlXTtcbiAgICAgICAgc3Vic2NyaWJlcnMuYWRkKHN1YnNjcmliZXIpO1xuICAgICAgICBpZiAoc3Vic2NyaWJlcnMuc2l6ZSA9PT0gMSkge1xuICAgICAgICAgICAgc3RvcCA9IHN0YXJ0KHNldCkgfHwgbm9vcDtcbiAgICAgICAgfVxuICAgICAgICBydW4odmFsdWUpO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlcnMuZGVsZXRlKHN1YnNjcmliZXIpO1xuICAgICAgICAgICAgaWYgKHN1YnNjcmliZXJzLnNpemUgPT09IDApIHtcbiAgICAgICAgICAgICAgICBzdG9wKCk7XG4gICAgICAgICAgICAgICAgc3RvcCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7IHNldCwgdXBkYXRlLCBzdWJzY3JpYmUgfTtcbn1cblxuY29uc3QgaXNFZGl0aW5nUXVlc3Rpb24gPSB3cml0YWJsZShmYWxzZSk7XG5jb25zdCBxdWVzdGlvbnNBY3Jvc3MgPSB3cml0YWJsZShbXSk7XG5jb25zdCBxdWVzdGlvbnNEb3duID0gd3JpdGFibGUoW10pO1xuY29uc3QgY3VycmVudERpcmVjdGlvbiA9IHdyaXRhYmxlKFwiYWNyb3NzXCIpO1xuY29uc3QgY3VycmVudFF1ZXN0aW9uID0gd3JpdGFibGUoe30pO1xuXG4vKiBzcmMvTWVudS5zdmVsdGUgZ2VuZXJhdGVkIGJ5IFN2ZWx0ZSB2My40Ni40ICovXG5cbmZ1bmN0aW9uIGNyZWF0ZV9mcmFnbWVudCQ1KGN0eCkge1xuXHRsZXQgbWFpbjtcblx0bGV0IG5hdjtcblx0bGV0IGRpdjtcblx0bGV0IGlucHV0O1xuXHRsZXQgdDA7XG5cdGxldCBzcGFuMDtcblx0bGV0IHQxO1xuXHRsZXQgc3BhbjE7XG5cdGxldCB0Mjtcblx0bGV0IHNwYW4yO1xuXHRsZXQgdDM7XG5cdGxldCB1bDtcblx0bGV0IGEwO1xuXHRsZXQgdDU7XG5cdGxldCBsaTE7XG5cdGxldCB0Njtcblx0bGV0IGExO1xuXHRsZXQgbW91bnRlZDtcblx0bGV0IGRpc3Bvc2U7XG5cblx0cmV0dXJuIHtcblx0XHRjKCkge1xuXHRcdFx0bWFpbiA9IGVsZW1lbnQoXCJtYWluXCIpO1xuXHRcdFx0bmF2ID0gZWxlbWVudChcIm5hdlwiKTtcblx0XHRcdGRpdiA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRpbnB1dCA9IGVsZW1lbnQoXCJpbnB1dFwiKTtcblx0XHRcdHQwID0gc3BhY2UoKTtcblx0XHRcdHNwYW4wID0gZWxlbWVudChcInNwYW5cIik7XG5cdFx0XHR0MSA9IHNwYWNlKCk7XG5cdFx0XHRzcGFuMSA9IGVsZW1lbnQoXCJzcGFuXCIpO1xuXHRcdFx0dDIgPSBzcGFjZSgpO1xuXHRcdFx0c3BhbjIgPSBlbGVtZW50KFwic3BhblwiKTtcblx0XHRcdHQzID0gc3BhY2UoKTtcblx0XHRcdHVsID0gZWxlbWVudChcInVsXCIpO1xuXHRcdFx0YTAgPSBlbGVtZW50KFwiYVwiKTtcblx0XHRcdGEwLmlubmVySFRNTCA9IGA8bGkgY2xhc3M9XCJzdmVsdGUtMWhnaWJ6Z1wiPkluc3RydWN0aW9uczwvbGk+YDtcblx0XHRcdHQ1ID0gc3BhY2UoKTtcblx0XHRcdGxpMSA9IGVsZW1lbnQoXCJsaVwiKTtcblx0XHRcdGxpMS5pbm5lckhUTUwgPSBgPGhyLz5gO1xuXHRcdFx0dDYgPSBzcGFjZSgpO1xuXHRcdFx0YTEgPSBlbGVtZW50KFwiYVwiKTtcblx0XHRcdGExLmlubmVySFRNTCA9IGA8bGkgY2xhc3M9XCJzdmVsdGUtMWhnaWJ6Z1wiPlJlc2V0PC9saT5gO1xuXHRcdFx0YXR0cihpbnB1dCwgXCJ0eXBlXCIsIFwiY2hlY2tib3hcIik7XG5cdFx0XHRhdHRyKGlucHV0LCBcImNsYXNzXCIsIFwic3ZlbHRlLTFoZ2liemdcIik7XG5cdFx0XHRhdHRyKHNwYW4wLCBcImNsYXNzXCIsIFwianh3b3JkLWhhbWJlcmRlciBzdmVsdGUtMWhnaWJ6Z1wiKTtcblx0XHRcdGF0dHIoc3BhbjEsIFwiY2xhc3NcIiwgXCJqeHdvcmQtaGFtYmVyZGVyIHN2ZWx0ZS0xaGdpYnpnXCIpO1xuXHRcdFx0YXR0cihzcGFuMiwgXCJjbGFzc1wiLCBcImp4d29yZC1oYW1iZXJkZXIgc3ZlbHRlLTFoZ2liemdcIik7XG5cdFx0XHRhdHRyKGEwLCBcImhyZWZcIiwgXCJpbnN0cnVjdGlvbnNcIik7XG5cdFx0XHRhdHRyKGEwLCBcImNsYXNzXCIsIFwianh3b3JkLWJ1dHRvbiBzdmVsdGUtMWhnaWJ6Z1wiKTtcblx0XHRcdGF0dHIobGkxLCBcImNsYXNzXCIsIFwianh3b3JkLW1lbnUtYnJlYWsgc3ZlbHRlLTFoZ2liemdcIik7XG5cdFx0XHRhdHRyKGExLCBcImhyZWZcIiwgXCIjXCIpO1xuXHRcdFx0YXR0cihhMSwgXCJjbGFzc1wiLCBcImp4d29yZC1idXR0b24gc3ZlbHRlLTFoZ2liemdcIik7XG5cdFx0XHRhdHRyKHVsLCBcImNsYXNzXCIsIFwianh3b3JkLW1lbnUgc3ZlbHRlLTFoZ2liemdcIik7XG5cdFx0XHRhdHRyKGRpdiwgXCJjbGFzc1wiLCBcImp4d29yZC1tZW51LXRvZ2dsZSBzdmVsdGUtMWhnaWJ6Z1wiKTtcblx0XHRcdGF0dHIobmF2LCBcImNsYXNzXCIsIFwianh3b3JkLWNvbnRyb2xzXCIpO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0aW5zZXJ0KHRhcmdldCwgbWFpbiwgYW5jaG9yKTtcblx0XHRcdGFwcGVuZChtYWluLCBuYXYpO1xuXHRcdFx0YXBwZW5kKG5hdiwgZGl2KTtcblx0XHRcdGFwcGVuZChkaXYsIGlucHV0KTtcblx0XHRcdGlucHV0LmNoZWNrZWQgPSAvKnNob3dNZW51Ki8gY3R4WzBdO1xuXHRcdFx0YXBwZW5kKGRpdiwgdDApO1xuXHRcdFx0YXBwZW5kKGRpdiwgc3BhbjApO1xuXHRcdFx0YXBwZW5kKGRpdiwgdDEpO1xuXHRcdFx0YXBwZW5kKGRpdiwgc3BhbjEpO1xuXHRcdFx0YXBwZW5kKGRpdiwgdDIpO1xuXHRcdFx0YXBwZW5kKGRpdiwgc3BhbjIpO1xuXHRcdFx0YXBwZW5kKGRpdiwgdDMpO1xuXHRcdFx0YXBwZW5kKGRpdiwgdWwpO1xuXHRcdFx0YXBwZW5kKHVsLCBhMCk7XG5cdFx0XHRhcHBlbmQodWwsIHQ1KTtcblx0XHRcdGFwcGVuZCh1bCwgbGkxKTtcblx0XHRcdGFwcGVuZCh1bCwgdDYpO1xuXHRcdFx0YXBwZW5kKHVsLCBhMSk7XG5cblx0XHRcdGlmICghbW91bnRlZCkge1xuXHRcdFx0XHRkaXNwb3NlID0gW1xuXHRcdFx0XHRcdGxpc3RlbihpbnB1dCwgXCJjaGFuZ2VcIiwgLyppbnB1dF9jaGFuZ2VfaGFuZGxlciovIGN0eFszXSksXG5cdFx0XHRcdFx0bGlzdGVuKGEwLCBcImNsaWNrXCIsIC8qaGFuZGxlSW5zdHJ1Y3Rpb25zKi8gY3R4WzJdKSxcblx0XHRcdFx0XHRsaXN0ZW4oYTEsIFwiY2xpY2tcIiwgLypoYW5kbGVSZXNldCovIGN0eFsxXSlcblx0XHRcdFx0XTtcblxuXHRcdFx0XHRtb3VudGVkID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHAoY3R4LCBbZGlydHldKSB7XG5cdFx0XHRpZiAoZGlydHkgJiAvKnNob3dNZW51Ki8gMSkge1xuXHRcdFx0XHRpbnB1dC5jaGVja2VkID0gLypzaG93TWVudSovIGN0eFswXTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGk6IG5vb3AsXG5cdFx0bzogbm9vcCxcblx0XHRkKGRldGFjaGluZykge1xuXHRcdFx0aWYgKGRldGFjaGluZykgZGV0YWNoKG1haW4pO1xuXHRcdFx0bW91bnRlZCA9IGZhbHNlO1xuXHRcdFx0cnVuX2FsbChkaXNwb3NlKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGluc3RhbmNlJDUoJCRzZWxmLCAkJHByb3BzLCAkJGludmFsaWRhdGUpIHtcblx0Y29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKTtcblx0bGV0IHNob3dNZW51ID0gZmFsc2U7XG5cblx0ZnVuY3Rpb24gaGFuZGxlUmVzZXQoZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRkaXNwYXRjaCgncmVzZXQnKTtcblx0XHQkJGludmFsaWRhdGUoMCwgc2hvd01lbnUgPSBmYWxzZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVJbnN0cnVjdGlvbnMoZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRkaXNwYXRjaCgnaW5zdHJ1Y3Rpb25zJyk7XG5cdFx0JCRpbnZhbGlkYXRlKDAsIHNob3dNZW51ID0gZmFsc2UpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5wdXRfY2hhbmdlX2hhbmRsZXIoKSB7XG5cdFx0c2hvd01lbnUgPSB0aGlzLmNoZWNrZWQ7XG5cdFx0JCRpbnZhbGlkYXRlKDAsIHNob3dNZW51KTtcblx0fVxuXG5cdHJldHVybiBbc2hvd01lbnUsIGhhbmRsZVJlc2V0LCBoYW5kbGVJbnN0cnVjdGlvbnMsIGlucHV0X2NoYW5nZV9oYW5kbGVyXTtcbn1cblxuY2xhc3MgTWVudSBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudCB7XG5cdGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcblx0XHRzdXBlcigpO1xuXHRcdGluaXQodGhpcywgb3B0aW9ucywgaW5zdGFuY2UkNSwgY3JlYXRlX2ZyYWdtZW50JDUsIHNhZmVfbm90X2VxdWFsLCB7fSk7XG5cdH1cbn1cblxudmFyIHdvcmRzID0gW1widGhlXCIsXCJvZlwiLFwiYW5kXCIsXCJ0b1wiLFwiYVwiLFwiaW5cIixcImZvclwiLFwiaXNcIixcIm9uXCIsXCJ0aGF0XCIsXCJieVwiLFwidGhpc1wiLFwid2l0aFwiLFwiaVwiLFwieW91XCIsXCJpdFwiLFwibm90XCIsXCJvclwiLFwiYmVcIixcImFyZVwiLFwiZnJvbVwiLFwiYXRcIixcImFzXCIsXCJ5b3VyXCIsXCJhbGxcIixcImhhdmVcIixcIm5ld1wiLFwibW9yZVwiLFwiYW5cIixcIndhc1wiLFwid2VcIixcIndpbGxcIixcImhvbWVcIixcImNhblwiLFwidXNcIixcImFib3V0XCIsXCJpZlwiLFwicGFnZVwiLFwibXlcIixcImhhc1wiLFwic2VhcmNoXCIsXCJmcmVlXCIsXCJidXRcIixcIm91clwiLFwib25lXCIsXCJvdGhlclwiLFwiZG9cIixcIm5vXCIsXCJpbmZvcm1hdGlvblwiLFwidGltZVwiLFwidGhleVwiLFwic2l0ZVwiLFwiaGVcIixcInVwXCIsXCJtYXlcIixcIndoYXRcIixcIndoaWNoXCIsXCJ0aGVpclwiLFwibmV3c1wiLFwib3V0XCIsXCJ1c2VcIixcImFueVwiLFwidGhlcmVcIixcInNlZVwiLFwib25seVwiLFwic29cIixcImhpc1wiLFwid2hlblwiLFwiY29udGFjdFwiLFwiaGVyZVwiLFwiYnVzaW5lc3NcIixcIndob1wiLFwid2ViXCIsXCJhbHNvXCIsXCJub3dcIixcImhlbHBcIixcImdldFwiLFwicG1cIixcInZpZXdcIixcIm9ubGluZVwiLFwiY1wiLFwiZVwiLFwiZmlyc3RcIixcImFtXCIsXCJiZWVuXCIsXCJ3b3VsZFwiLFwiaG93XCIsXCJ3ZXJlXCIsXCJtZVwiLFwic1wiLFwic2VydmljZXNcIixcInNvbWVcIixcInRoZXNlXCIsXCJjbGlja1wiLFwiaXRzXCIsXCJsaWtlXCIsXCJzZXJ2aWNlXCIsXCJ4XCIsXCJ0aGFuXCIsXCJmaW5kXCIsXCJwcmljZVwiLFwiZGF0ZVwiLFwiYmFja1wiLFwidG9wXCIsXCJwZW9wbGVcIixcImhhZFwiLFwibGlzdFwiLFwibmFtZVwiLFwianVzdFwiLFwib3ZlclwiLFwic3RhdGVcIixcInllYXJcIixcImRheVwiLFwiaW50b1wiLFwiZW1haWxcIixcInR3b1wiLFwiaGVhbHRoXCIsXCJuXCIsXCJ3b3JsZFwiLFwicmVcIixcIm5leHRcIixcInVzZWRcIixcImdvXCIsXCJiXCIsXCJ3b3JrXCIsXCJsYXN0XCIsXCJtb3N0XCIsXCJwcm9kdWN0c1wiLFwibXVzaWNcIixcImJ1eVwiLFwiZGF0YVwiLFwibWFrZVwiLFwidGhlbVwiLFwic2hvdWxkXCIsXCJwcm9kdWN0XCIsXCJzeXN0ZW1cIixcInBvc3RcIixcImhlclwiLFwiY2l0eVwiLFwidFwiLFwiYWRkXCIsXCJwb2xpY3lcIixcIm51bWJlclwiLFwic3VjaFwiLFwicGxlYXNlXCIsXCJhdmFpbGFibGVcIixcImNvcHlyaWdodFwiLFwic3VwcG9ydFwiLFwibWVzc2FnZVwiLFwiYWZ0ZXJcIixcImJlc3RcIixcInNvZnR3YXJlXCIsXCJ0aGVuXCIsXCJqYW5cIixcImdvb2RcIixcInZpZGVvXCIsXCJ3ZWxsXCIsXCJkXCIsXCJ3aGVyZVwiLFwiaW5mb1wiLFwicmlnaHRzXCIsXCJwdWJsaWNcIixcImJvb2tzXCIsXCJoaWdoXCIsXCJzY2hvb2xcIixcInRocm91Z2hcIixcIm1cIixcImVhY2hcIixcImxpbmtzXCIsXCJzaGVcIixcInJldmlld1wiLFwieWVhcnNcIixcIm9yZGVyXCIsXCJ2ZXJ5XCIsXCJwcml2YWN5XCIsXCJib29rXCIsXCJpdGVtc1wiLFwiY29tcGFueVwiLFwiclwiLFwicmVhZFwiLFwiZ3JvdXBcIixcIm5lZWRcIixcIm1hbnlcIixcInVzZXJcIixcInNhaWRcIixcImRlXCIsXCJkb2VzXCIsXCJzZXRcIixcInVuZGVyXCIsXCJnZW5lcmFsXCIsXCJyZXNlYXJjaFwiLFwidW5pdmVyc2l0eVwiLFwiamFudWFyeVwiLFwibWFpbFwiLFwiZnVsbFwiLFwibWFwXCIsXCJyZXZpZXdzXCIsXCJwcm9ncmFtXCIsXCJsaWZlXCIsXCJrbm93XCIsXCJnYW1lc1wiLFwid2F5XCIsXCJkYXlzXCIsXCJtYW5hZ2VtZW50XCIsXCJwXCIsXCJwYXJ0XCIsXCJjb3VsZFwiLFwiZ3JlYXRcIixcInVuaXRlZFwiLFwiaG90ZWxcIixcInJlYWxcIixcImZcIixcIml0ZW1cIixcImludGVybmF0aW9uYWxcIixcImNlbnRlclwiLFwiZWJheVwiLFwibXVzdFwiLFwic3RvcmVcIixcInRyYXZlbFwiLFwiY29tbWVudHNcIixcIm1hZGVcIixcImRldmVsb3BtZW50XCIsXCJyZXBvcnRcIixcIm9mZlwiLFwibWVtYmVyXCIsXCJkZXRhaWxzXCIsXCJsaW5lXCIsXCJ0ZXJtc1wiLFwiYmVmb3JlXCIsXCJob3RlbHNcIixcImRpZFwiLFwic2VuZFwiLFwicmlnaHRcIixcInR5cGVcIixcImJlY2F1c2VcIixcImxvY2FsXCIsXCJ0aG9zZVwiLFwidXNpbmdcIixcInJlc3VsdHNcIixcIm9mZmljZVwiLFwiZWR1Y2F0aW9uXCIsXCJuYXRpb25hbFwiLFwiY2FyXCIsXCJkZXNpZ25cIixcInRha2VcIixcInBvc3RlZFwiLFwiaW50ZXJuZXRcIixcImFkZHJlc3NcIixcImNvbW11bml0eVwiLFwid2l0aGluXCIsXCJzdGF0ZXNcIixcImFyZWFcIixcIndhbnRcIixcInBob25lXCIsXCJkdmRcIixcInNoaXBwaW5nXCIsXCJyZXNlcnZlZFwiLFwic3ViamVjdFwiLFwiYmV0d2VlblwiLFwiZm9ydW1cIixcImZhbWlseVwiLFwibFwiLFwibG9uZ1wiLFwiYmFzZWRcIixcIndcIixcImNvZGVcIixcInNob3dcIixcIm9cIixcImV2ZW5cIixcImJsYWNrXCIsXCJjaGVja1wiLFwic3BlY2lhbFwiLFwicHJpY2VzXCIsXCJ3ZWJzaXRlXCIsXCJpbmRleFwiLFwiYmVpbmdcIixcIndvbWVuXCIsXCJtdWNoXCIsXCJzaWduXCIsXCJmaWxlXCIsXCJsaW5rXCIsXCJvcGVuXCIsXCJ0b2RheVwiLFwidGVjaG5vbG9neVwiLFwic291dGhcIixcImNhc2VcIixcInByb2plY3RcIixcInNhbWVcIixcInBhZ2VzXCIsXCJ1a1wiLFwidmVyc2lvblwiLFwic2VjdGlvblwiLFwib3duXCIsXCJmb3VuZFwiLFwic3BvcnRzXCIsXCJob3VzZVwiLFwicmVsYXRlZFwiLFwic2VjdXJpdHlcIixcImJvdGhcIixcImdcIixcImNvdW50eVwiLFwiYW1lcmljYW5cIixcInBob3RvXCIsXCJnYW1lXCIsXCJtZW1iZXJzXCIsXCJwb3dlclwiLFwid2hpbGVcIixcImNhcmVcIixcIm5ldHdvcmtcIixcImRvd25cIixcImNvbXB1dGVyXCIsXCJzeXN0ZW1zXCIsXCJ0aHJlZVwiLFwidG90YWxcIixcInBsYWNlXCIsXCJlbmRcIixcImZvbGxvd2luZ1wiLFwiZG93bmxvYWRcIixcImhcIixcImhpbVwiLFwid2l0aG91dFwiLFwicGVyXCIsXCJhY2Nlc3NcIixcInRoaW5rXCIsXCJub3J0aFwiLFwicmVzb3VyY2VzXCIsXCJjdXJyZW50XCIsXCJwb3N0c1wiLFwiYmlnXCIsXCJtZWRpYVwiLFwibGF3XCIsXCJjb250cm9sXCIsXCJ3YXRlclwiLFwiaGlzdG9yeVwiLFwicGljdHVyZXNcIixcInNpemVcIixcImFydFwiLFwicGVyc29uYWxcIixcInNpbmNlXCIsXCJpbmNsdWRpbmdcIixcImd1aWRlXCIsXCJzaG9wXCIsXCJkaXJlY3RvcnlcIixcImJvYXJkXCIsXCJsb2NhdGlvblwiLFwiY2hhbmdlXCIsXCJ3aGl0ZVwiLFwidGV4dFwiLFwic21hbGxcIixcInJhdGluZ1wiLFwicmF0ZVwiLFwiZ292ZXJubWVudFwiLFwiY2hpbGRyZW5cIixcImR1cmluZ1wiLFwidXNhXCIsXCJyZXR1cm5cIixcInN0dWRlbnRzXCIsXCJ2XCIsXCJzaG9wcGluZ1wiLFwiYWNjb3VudFwiLFwidGltZXNcIixcInNpdGVzXCIsXCJsZXZlbFwiLFwiZGlnaXRhbFwiLFwicHJvZmlsZVwiLFwicHJldmlvdXNcIixcImZvcm1cIixcImV2ZW50c1wiLFwibG92ZVwiLFwib2xkXCIsXCJqb2huXCIsXCJtYWluXCIsXCJjYWxsXCIsXCJob3Vyc1wiLFwiaW1hZ2VcIixcImRlcGFydG1lbnRcIixcInRpdGxlXCIsXCJkZXNjcmlwdGlvblwiLFwibm9uXCIsXCJrXCIsXCJ5XCIsXCJpbnN1cmFuY2VcIixcImFub3RoZXJcIixcIndoeVwiLFwic2hhbGxcIixcInByb3BlcnR5XCIsXCJjbGFzc1wiLFwiY2RcIixcInN0aWxsXCIsXCJtb25leVwiLFwicXVhbGl0eVwiLFwiZXZlcnlcIixcImxpc3RpbmdcIixcImNvbnRlbnRcIixcImNvdW50cnlcIixcInByaXZhdGVcIixcImxpdHRsZVwiLFwidmlzaXRcIixcInNhdmVcIixcInRvb2xzXCIsXCJsb3dcIixcInJlcGx5XCIsXCJjdXN0b21lclwiLFwiZGVjZW1iZXJcIixcImNvbXBhcmVcIixcIm1vdmllc1wiLFwiaW5jbHVkZVwiLFwiY29sbGVnZVwiLFwidmFsdWVcIixcImFydGljbGVcIixcInlvcmtcIixcIm1hblwiLFwiY2FyZFwiLFwiam9ic1wiLFwicHJvdmlkZVwiLFwialwiLFwiZm9vZFwiLFwic291cmNlXCIsXCJhdXRob3JcIixcImRpZmZlcmVudFwiLFwicHJlc3NcIixcInVcIixcImxlYXJuXCIsXCJzYWxlXCIsXCJhcm91bmRcIixcInByaW50XCIsXCJjb3Vyc2VcIixcImpvYlwiLFwiY2FuYWRhXCIsXCJwcm9jZXNzXCIsXCJ0ZWVuXCIsXCJyb29tXCIsXCJzdG9ja1wiLFwidHJhaW5pbmdcIixcInRvb1wiLFwiY3JlZGl0XCIsXCJwb2ludFwiLFwiam9pblwiLFwic2NpZW5jZVwiLFwibWVuXCIsXCJjYXRlZ29yaWVzXCIsXCJhZHZhbmNlZFwiLFwid2VzdFwiLFwic2FsZXNcIixcImxvb2tcIixcImVuZ2xpc2hcIixcImxlZnRcIixcInRlYW1cIixcImVzdGF0ZVwiLFwiYm94XCIsXCJjb25kaXRpb25zXCIsXCJzZWxlY3RcIixcIndpbmRvd3NcIixcInBob3Rvc1wiLFwiZ2F5XCIsXCJ0aHJlYWRcIixcIndlZWtcIixcImNhdGVnb3J5XCIsXCJub3RlXCIsXCJsaXZlXCIsXCJsYXJnZVwiLFwiZ2FsbGVyeVwiLFwidGFibGVcIixcInJlZ2lzdGVyXCIsXCJob3dldmVyXCIsXCJqdW5lXCIsXCJvY3RvYmVyXCIsXCJub3ZlbWJlclwiLFwibWFya2V0XCIsXCJsaWJyYXJ5XCIsXCJyZWFsbHlcIixcImFjdGlvblwiLFwic3RhcnRcIixcInNlcmllc1wiLFwibW9kZWxcIixcImZlYXR1cmVzXCIsXCJhaXJcIixcImluZHVzdHJ5XCIsXCJwbGFuXCIsXCJodW1hblwiLFwicHJvdmlkZWRcIixcInR2XCIsXCJ5ZXNcIixcInJlcXVpcmVkXCIsXCJzZWNvbmRcIixcImhvdFwiLFwiYWNjZXNzb3JpZXNcIixcImNvc3RcIixcIm1vdmllXCIsXCJmb3J1bXNcIixcIm1hcmNoXCIsXCJsYVwiLFwic2VwdGVtYmVyXCIsXCJiZXR0ZXJcIixcInNheVwiLFwicXVlc3Rpb25zXCIsXCJqdWx5XCIsXCJ5YWhvb1wiLFwiZ29pbmdcIixcIm1lZGljYWxcIixcInRlc3RcIixcImZyaWVuZFwiLFwiY29tZVwiLFwiZGVjXCIsXCJzZXJ2ZXJcIixcInBjXCIsXCJzdHVkeVwiLFwiYXBwbGljYXRpb25cIixcImNhcnRcIixcInN0YWZmXCIsXCJhcnRpY2xlc1wiLFwic2FuXCIsXCJmZWVkYmFja1wiLFwiYWdhaW5cIixcInBsYXlcIixcImxvb2tpbmdcIixcImlzc3Vlc1wiLFwiYXByaWxcIixcIm5ldmVyXCIsXCJ1c2Vyc1wiLFwiY29tcGxldGVcIixcInN0cmVldFwiLFwidG9waWNcIixcImNvbW1lbnRcIixcImZpbmFuY2lhbFwiLFwidGhpbmdzXCIsXCJ3b3JraW5nXCIsXCJhZ2FpbnN0XCIsXCJzdGFuZGFyZFwiLFwidGF4XCIsXCJwZXJzb25cIixcImJlbG93XCIsXCJtb2JpbGVcIixcImxlc3NcIixcImdvdFwiLFwiYmxvZ1wiLFwicGFydHlcIixcInBheW1lbnRcIixcImVxdWlwbWVudFwiLFwibG9naW5cIixcInN0dWRlbnRcIixcImxldFwiLFwicHJvZ3JhbXNcIixcIm9mZmVyc1wiLFwibGVnYWxcIixcImFib3ZlXCIsXCJyZWNlbnRcIixcInBhcmtcIixcInN0b3Jlc1wiLFwic2lkZVwiLFwiYWN0XCIsXCJwcm9ibGVtXCIsXCJyZWRcIixcImdpdmVcIixcIm1lbW9yeVwiLFwicGVyZm9ybWFuY2VcIixcInNvY2lhbFwiLFwicVwiLFwiYXVndXN0XCIsXCJxdW90ZVwiLFwibGFuZ3VhZ2VcIixcInN0b3J5XCIsXCJzZWxsXCIsXCJvcHRpb25zXCIsXCJleHBlcmllbmNlXCIsXCJyYXRlc1wiLFwiY3JlYXRlXCIsXCJrZXlcIixcImJvZHlcIixcInlvdW5nXCIsXCJhbWVyaWNhXCIsXCJpbXBvcnRhbnRcIixcImZpZWxkXCIsXCJmZXdcIixcImVhc3RcIixcInBhcGVyXCIsXCJzaW5nbGVcIixcImlpXCIsXCJhZ2VcIixcImFjdGl2aXRpZXNcIixcImNsdWJcIixcImV4YW1wbGVcIixcImdpcmxzXCIsXCJhZGRpdGlvbmFsXCIsXCJwYXNzd29yZFwiLFwielwiLFwibGF0ZXN0XCIsXCJzb21ldGhpbmdcIixcInJvYWRcIixcImdpZnRcIixcInF1ZXN0aW9uXCIsXCJjaGFuZ2VzXCIsXCJuaWdodFwiLFwiY2FcIixcImhhcmRcIixcInRleGFzXCIsXCJvY3RcIixcInBheVwiLFwiZm91clwiLFwicG9rZXJcIixcInN0YXR1c1wiLFwiYnJvd3NlXCIsXCJpc3N1ZVwiLFwicmFuZ2VcIixcImJ1aWxkaW5nXCIsXCJzZWxsZXJcIixcImNvdXJ0XCIsXCJmZWJydWFyeVwiLFwiYWx3YXlzXCIsXCJyZXN1bHRcIixcImF1ZGlvXCIsXCJsaWdodFwiLFwid3JpdGVcIixcIndhclwiLFwibm92XCIsXCJvZmZlclwiLFwiYmx1ZVwiLFwiZ3JvdXBzXCIsXCJhbFwiLFwiZWFzeVwiLFwiZ2l2ZW5cIixcImZpbGVzXCIsXCJldmVudFwiLFwicmVsZWFzZVwiLFwiYW5hbHlzaXNcIixcInJlcXVlc3RcIixcImZheFwiLFwiY2hpbmFcIixcIm1ha2luZ1wiLFwicGljdHVyZVwiLFwibmVlZHNcIixcInBvc3NpYmxlXCIsXCJtaWdodFwiLFwicHJvZmVzc2lvbmFsXCIsXCJ5ZXRcIixcIm1vbnRoXCIsXCJtYWpvclwiLFwic3RhclwiLFwiYXJlYXNcIixcImZ1dHVyZVwiLFwic3BhY2VcIixcImNvbW1pdHRlZVwiLFwiaGFuZFwiLFwic3VuXCIsXCJjYXJkc1wiLFwicHJvYmxlbXNcIixcImxvbmRvblwiLFwid2FzaGluZ3RvblwiLFwibWVldGluZ1wiLFwicnNzXCIsXCJiZWNvbWVcIixcImludGVyZXN0XCIsXCJpZFwiLFwiY2hpbGRcIixcImtlZXBcIixcImVudGVyXCIsXCJjYWxpZm9ybmlhXCIsXCJzaGFyZVwiLFwic2ltaWxhclwiLFwiZ2FyZGVuXCIsXCJzY2hvb2xzXCIsXCJtaWxsaW9uXCIsXCJhZGRlZFwiLFwicmVmZXJlbmNlXCIsXCJjb21wYW5pZXNcIixcImxpc3RlZFwiLFwiYmFieVwiLFwibGVhcm5pbmdcIixcImVuZXJneVwiLFwicnVuXCIsXCJkZWxpdmVyeVwiLFwibmV0XCIsXCJwb3B1bGFyXCIsXCJ0ZXJtXCIsXCJmaWxtXCIsXCJzdG9yaWVzXCIsXCJwdXRcIixcImNvbXB1dGVyc1wiLFwiam91cm5hbFwiLFwicmVwb3J0c1wiLFwiY29cIixcInRyeVwiLFwid2VsY29tZVwiLFwiY2VudHJhbFwiLFwiaW1hZ2VzXCIsXCJwcmVzaWRlbnRcIixcIm5vdGljZVwiLFwib3JpZ2luYWxcIixcImhlYWRcIixcInJhZGlvXCIsXCJ1bnRpbFwiLFwiY2VsbFwiLFwiY29sb3JcIixcInNlbGZcIixcImNvdW5jaWxcIixcImF3YXlcIixcImluY2x1ZGVzXCIsXCJ0cmFja1wiLFwiYXVzdHJhbGlhXCIsXCJkaXNjdXNzaW9uXCIsXCJhcmNoaXZlXCIsXCJvbmNlXCIsXCJvdGhlcnNcIixcImVudGVydGFpbm1lbnRcIixcImFncmVlbWVudFwiLFwiZm9ybWF0XCIsXCJsZWFzdFwiLFwic29jaWV0eVwiLFwibW9udGhzXCIsXCJsb2dcIixcInNhZmV0eVwiLFwiZnJpZW5kc1wiLFwic3VyZVwiLFwiZmFxXCIsXCJ0cmFkZVwiLFwiZWRpdGlvblwiLFwiY2Fyc1wiLFwibWVzc2FnZXNcIixcIm1hcmtldGluZ1wiLFwidGVsbFwiLFwiZnVydGhlclwiLFwidXBkYXRlZFwiLFwiYXNzb2NpYXRpb25cIixcImFibGVcIixcImhhdmluZ1wiLFwicHJvdmlkZXNcIixcImRhdmlkXCIsXCJmdW5cIixcImFscmVhZHlcIixcImdyZWVuXCIsXCJzdHVkaWVzXCIsXCJjbG9zZVwiLFwiY29tbW9uXCIsXCJkcml2ZVwiLFwic3BlY2lmaWNcIixcInNldmVyYWxcIixcImdvbGRcIixcImZlYlwiLFwibGl2aW5nXCIsXCJzZXBcIixcImNvbGxlY3Rpb25cIixcImNhbGxlZFwiLFwic2hvcnRcIixcImFydHNcIixcImxvdFwiLFwiYXNrXCIsXCJkaXNwbGF5XCIsXCJsaW1pdGVkXCIsXCJwb3dlcmVkXCIsXCJzb2x1dGlvbnNcIixcIm1lYW5zXCIsXCJkaXJlY3RvclwiLFwiZGFpbHlcIixcImJlYWNoXCIsXCJwYXN0XCIsXCJuYXR1cmFsXCIsXCJ3aGV0aGVyXCIsXCJkdWVcIixcImV0XCIsXCJlbGVjdHJvbmljc1wiLFwiZml2ZVwiLFwidXBvblwiLFwicGVyaW9kXCIsXCJwbGFubmluZ1wiLFwiZGF0YWJhc2VcIixcInNheXNcIixcIm9mZmljaWFsXCIsXCJ3ZWF0aGVyXCIsXCJtYXJcIixcImxhbmRcIixcImF2ZXJhZ2VcIixcImRvbmVcIixcInRlY2huaWNhbFwiLFwid2luZG93XCIsXCJmcmFuY2VcIixcInByb1wiLFwicmVnaW9uXCIsXCJpc2xhbmRcIixcInJlY29yZFwiLFwiZGlyZWN0XCIsXCJtaWNyb3NvZnRcIixcImNvbmZlcmVuY2VcIixcImVudmlyb25tZW50XCIsXCJyZWNvcmRzXCIsXCJzdFwiLFwiZGlzdHJpY3RcIixcImNhbGVuZGFyXCIsXCJjb3N0c1wiLFwic3R5bGVcIixcInVybFwiLFwiZnJvbnRcIixcInN0YXRlbWVudFwiLFwidXBkYXRlXCIsXCJwYXJ0c1wiLFwiYXVnXCIsXCJldmVyXCIsXCJkb3dubG9hZHNcIixcImVhcmx5XCIsXCJtaWxlc1wiLFwic291bmRcIixcInJlc291cmNlXCIsXCJwcmVzZW50XCIsXCJhcHBsaWNhdGlvbnNcIixcImVpdGhlclwiLFwiYWdvXCIsXCJkb2N1bWVudFwiLFwid29yZFwiLFwid29ya3NcIixcIm1hdGVyaWFsXCIsXCJiaWxsXCIsXCJhcHJcIixcIndyaXR0ZW5cIixcInRhbGtcIixcImZlZGVyYWxcIixcImhvc3RpbmdcIixcInJ1bGVzXCIsXCJmaW5hbFwiLFwiYWR1bHRcIixcInRpY2tldHNcIixcInRoaW5nXCIsXCJjZW50cmVcIixcInJlcXVpcmVtZW50c1wiLFwidmlhXCIsXCJjaGVhcFwiLFwia2lkc1wiLFwiZmluYW5jZVwiLFwidHJ1ZVwiLFwibWludXRlc1wiLFwiZWxzZVwiLFwibWFya1wiLFwidGhpcmRcIixcInJvY2tcIixcImdpZnRzXCIsXCJldXJvcGVcIixcInJlYWRpbmdcIixcInRvcGljc1wiLFwiYmFkXCIsXCJpbmRpdmlkdWFsXCIsXCJ0aXBzXCIsXCJwbHVzXCIsXCJhdXRvXCIsXCJjb3ZlclwiLFwidXN1YWxseVwiLFwiZWRpdFwiLFwidG9nZXRoZXJcIixcInZpZGVvc1wiLFwicGVyY2VudFwiLFwiZmFzdFwiLFwiZnVuY3Rpb25cIixcImZhY3RcIixcInVuaXRcIixcImdldHRpbmdcIixcImdsb2JhbFwiLFwidGVjaFwiLFwibWVldFwiLFwiZmFyXCIsXCJlY29ub21pY1wiLFwiZW5cIixcInBsYXllclwiLFwicHJvamVjdHNcIixcImx5cmljc1wiLFwib2Z0ZW5cIixcInN1YnNjcmliZVwiLFwic3VibWl0XCIsXCJnZXJtYW55XCIsXCJhbW91bnRcIixcIndhdGNoXCIsXCJpbmNsdWRlZFwiLFwiZmVlbFwiLFwidGhvdWdoXCIsXCJiYW5rXCIsXCJyaXNrXCIsXCJ0aGFua3NcIixcImV2ZXJ5dGhpbmdcIixcImRlYWxzXCIsXCJ2YXJpb3VzXCIsXCJ3b3Jkc1wiLFwibGludXhcIixcImp1bFwiLFwicHJvZHVjdGlvblwiLFwiY29tbWVyY2lhbFwiLFwiamFtZXNcIixcIndlaWdodFwiLFwidG93blwiLFwiaGVhcnRcIixcImFkdmVydGlzaW5nXCIsXCJyZWNlaXZlZFwiLFwiY2hvb3NlXCIsXCJ0cmVhdG1lbnRcIixcIm5ld3NsZXR0ZXJcIixcImFyY2hpdmVzXCIsXCJwb2ludHNcIixcImtub3dsZWRnZVwiLFwibWFnYXppbmVcIixcImVycm9yXCIsXCJjYW1lcmFcIixcImp1blwiLFwiZ2lybFwiLFwiY3VycmVudGx5XCIsXCJjb25zdHJ1Y3Rpb25cIixcInRveXNcIixcInJlZ2lzdGVyZWRcIixcImNsZWFyXCIsXCJnb2xmXCIsXCJyZWNlaXZlXCIsXCJkb21haW5cIixcIm1ldGhvZHNcIixcImNoYXB0ZXJcIixcIm1ha2VzXCIsXCJwcm90ZWN0aW9uXCIsXCJwb2xpY2llc1wiLFwibG9hblwiLFwid2lkZVwiLFwiYmVhdXR5XCIsXCJtYW5hZ2VyXCIsXCJpbmRpYVwiLFwicG9zaXRpb25cIixcInRha2VuXCIsXCJzb3J0XCIsXCJsaXN0aW5nc1wiLFwibW9kZWxzXCIsXCJtaWNoYWVsXCIsXCJrbm93blwiLFwiaGFsZlwiLFwiY2FzZXNcIixcInN0ZXBcIixcImVuZ2luZWVyaW5nXCIsXCJmbG9yaWRhXCIsXCJzaW1wbGVcIixcInF1aWNrXCIsXCJub25lXCIsXCJ3aXJlbGVzc1wiLFwibGljZW5zZVwiLFwicGF1bFwiLFwiZnJpZGF5XCIsXCJsYWtlXCIsXCJ3aG9sZVwiLFwiYW5udWFsXCIsXCJwdWJsaXNoZWRcIixcImxhdGVyXCIsXCJiYXNpY1wiLFwic29ueVwiLFwic2hvd3NcIixcImNvcnBvcmF0ZVwiLFwiZ29vZ2xlXCIsXCJjaHVyY2hcIixcIm1ldGhvZFwiLFwicHVyY2hhc2VcIixcImN1c3RvbWVyc1wiLFwiYWN0aXZlXCIsXCJyZXNwb25zZVwiLFwicHJhY3RpY2VcIixcImhhcmR3YXJlXCIsXCJmaWd1cmVcIixcIm1hdGVyaWFsc1wiLFwiZmlyZVwiLFwiaG9saWRheVwiLFwiY2hhdFwiLFwiZW5vdWdoXCIsXCJkZXNpZ25lZFwiLFwiYWxvbmdcIixcImFtb25nXCIsXCJkZWF0aFwiLFwid3JpdGluZ1wiLFwic3BlZWRcIixcImh0bWxcIixcImNvdW50cmllc1wiLFwibG9zc1wiLFwiZmFjZVwiLFwiYnJhbmRcIixcImRpc2NvdW50XCIsXCJoaWdoZXJcIixcImVmZmVjdHNcIixcImNyZWF0ZWRcIixcInJlbWVtYmVyXCIsXCJzdGFuZGFyZHNcIixcIm9pbFwiLFwiYml0XCIsXCJ5ZWxsb3dcIixcInBvbGl0aWNhbFwiLFwiaW5jcmVhc2VcIixcImFkdmVydGlzZVwiLFwia2luZ2RvbVwiLFwiYmFzZVwiLFwibmVhclwiLFwiZW52aXJvbm1lbnRhbFwiLFwidGhvdWdodFwiLFwic3R1ZmZcIixcImZyZW5jaFwiLFwic3RvcmFnZVwiLFwib2hcIixcImphcGFuXCIsXCJkb2luZ1wiLFwibG9hbnNcIixcInNob2VzXCIsXCJlbnRyeVwiLFwic3RheVwiLFwibmF0dXJlXCIsXCJvcmRlcnNcIixcImF2YWlsYWJpbGl0eVwiLFwiYWZyaWNhXCIsXCJzdW1tYXJ5XCIsXCJ0dXJuXCIsXCJtZWFuXCIsXCJncm93dGhcIixcIm5vdGVzXCIsXCJhZ2VuY3lcIixcImtpbmdcIixcIm1vbmRheVwiLFwiZXVyb3BlYW5cIixcImFjdGl2aXR5XCIsXCJjb3B5XCIsXCJhbHRob3VnaFwiLFwiZHJ1Z1wiLFwicGljc1wiLFwid2VzdGVyblwiLFwiaW5jb21lXCIsXCJmb3JjZVwiLFwiY2FzaFwiLFwiZW1wbG95bWVudFwiLFwib3ZlcmFsbFwiLFwiYmF5XCIsXCJyaXZlclwiLFwiY29tbWlzc2lvblwiLFwiYWRcIixcInBhY2thZ2VcIixcImNvbnRlbnRzXCIsXCJzZWVuXCIsXCJwbGF5ZXJzXCIsXCJlbmdpbmVcIixcInBvcnRcIixcImFsYnVtXCIsXCJyZWdpb25hbFwiLFwic3RvcFwiLFwic3VwcGxpZXNcIixcInN0YXJ0ZWRcIixcImFkbWluaXN0cmF0aW9uXCIsXCJiYXJcIixcImluc3RpdHV0ZVwiLFwidmlld3NcIixcInBsYW5zXCIsXCJkb3VibGVcIixcImRvZ1wiLFwiYnVpbGRcIixcInNjcmVlblwiLFwiZXhjaGFuZ2VcIixcInR5cGVzXCIsXCJzb29uXCIsXCJzcG9uc29yZWRcIixcImxpbmVzXCIsXCJlbGVjdHJvbmljXCIsXCJjb250aW51ZVwiLFwiYWNyb3NzXCIsXCJiZW5lZml0c1wiLFwibmVlZGVkXCIsXCJzZWFzb25cIixcImFwcGx5XCIsXCJzb21lb25lXCIsXCJoZWxkXCIsXCJueVwiLFwiYW55dGhpbmdcIixcInByaW50ZXJcIixcImNvbmRpdGlvblwiLFwiZWZmZWN0aXZlXCIsXCJiZWxpZXZlXCIsXCJvcmdhbml6YXRpb25cIixcImVmZmVjdFwiLFwiYXNrZWRcIixcImV1clwiLFwibWluZFwiLFwic3VuZGF5XCIsXCJzZWxlY3Rpb25cIixcImNhc2lub1wiLFwicGRmXCIsXCJsb3N0XCIsXCJ0b3VyXCIsXCJtZW51XCIsXCJ2b2x1bWVcIixcImNyb3NzXCIsXCJhbnlvbmVcIixcIm1vcnRnYWdlXCIsXCJob3BlXCIsXCJzaWx2ZXJcIixcImNvcnBvcmF0aW9uXCIsXCJ3aXNoXCIsXCJpbnNpZGVcIixcInNvbHV0aW9uXCIsXCJtYXR1cmVcIixcInJvbGVcIixcInJhdGhlclwiLFwid2Vla3NcIixcImFkZGl0aW9uXCIsXCJjYW1lXCIsXCJzdXBwbHlcIixcIm5vdGhpbmdcIixcImNlcnRhaW5cIixcInVzclwiLFwiZXhlY3V0aXZlXCIsXCJydW5uaW5nXCIsXCJsb3dlclwiLFwibmVjZXNzYXJ5XCIsXCJ1bmlvblwiLFwiamV3ZWxyeVwiLFwiYWNjb3JkaW5nXCIsXCJkY1wiLFwiY2xvdGhpbmdcIixcIm1vblwiLFwiY29tXCIsXCJwYXJ0aWN1bGFyXCIsXCJmaW5lXCIsXCJuYW1lc1wiLFwicm9iZXJ0XCIsXCJob21lcGFnZVwiLFwiaG91clwiLFwiZ2FzXCIsXCJza2lsbHNcIixcInNpeFwiLFwiYnVzaFwiLFwiaXNsYW5kc1wiLFwiYWR2aWNlXCIsXCJjYXJlZXJcIixcIm1pbGl0YXJ5XCIsXCJyZW50YWxcIixcImRlY2lzaW9uXCIsXCJsZWF2ZVwiLFwiYnJpdGlzaFwiLFwidGVlbnNcIixcInByZVwiLFwiaHVnZVwiLFwic2F0XCIsXCJ3b21hblwiLFwiZmFjaWxpdGllc1wiLFwiemlwXCIsXCJiaWRcIixcImtpbmRcIixcInNlbGxlcnNcIixcIm1pZGRsZVwiLFwibW92ZVwiLFwiY2FibGVcIixcIm9wcG9ydHVuaXRpZXNcIixcInRha2luZ1wiLFwidmFsdWVzXCIsXCJkaXZpc2lvblwiLFwiY29taW5nXCIsXCJ0dWVzZGF5XCIsXCJvYmplY3RcIixcImxlc2JpYW5cIixcImFwcHJvcHJpYXRlXCIsXCJtYWNoaW5lXCIsXCJsb2dvXCIsXCJsZW5ndGhcIixcImFjdHVhbGx5XCIsXCJuaWNlXCIsXCJzY29yZVwiLFwic3RhdGlzdGljc1wiLFwiY2xpZW50XCIsXCJva1wiLFwicmV0dXJuc1wiLFwiY2FwaXRhbFwiLFwiZm9sbG93XCIsXCJzYW1wbGVcIixcImludmVzdG1lbnRcIixcInNlbnRcIixcInNob3duXCIsXCJzYXR1cmRheVwiLFwiY2hyaXN0bWFzXCIsXCJlbmdsYW5kXCIsXCJjdWx0dXJlXCIsXCJiYW5kXCIsXCJmbGFzaFwiLFwibXNcIixcImxlYWRcIixcImdlb3JnZVwiLFwiY2hvaWNlXCIsXCJ3ZW50XCIsXCJzdGFydGluZ1wiLFwicmVnaXN0cmF0aW9uXCIsXCJmcmlcIixcInRodXJzZGF5XCIsXCJjb3Vyc2VzXCIsXCJjb25zdW1lclwiLFwiaGlcIixcImFpcnBvcnRcIixcImZvcmVpZ25cIixcImFydGlzdFwiLFwib3V0c2lkZVwiLFwiZnVybml0dXJlXCIsXCJsZXZlbHNcIixcImNoYW5uZWxcIixcImxldHRlclwiLFwibW9kZVwiLFwicGhvbmVzXCIsXCJpZGVhc1wiLFwid2VkbmVzZGF5XCIsXCJzdHJ1Y3R1cmVcIixcImZ1bmRcIixcInN1bW1lclwiLFwiYWxsb3dcIixcImRlZ3JlZVwiLFwiY29udHJhY3RcIixcImJ1dHRvblwiLFwicmVsZWFzZXNcIixcIndlZFwiLFwiaG9tZXNcIixcInN1cGVyXCIsXCJtYWxlXCIsXCJtYXR0ZXJcIixcImN1c3RvbVwiLFwidmlyZ2luaWFcIixcImFsbW9zdFwiLFwidG9va1wiLFwibG9jYXRlZFwiLFwibXVsdGlwbGVcIixcImFzaWFuXCIsXCJkaXN0cmlidXRpb25cIixcImVkaXRvclwiLFwiaW5uXCIsXCJpbmR1c3RyaWFsXCIsXCJjYXVzZVwiLFwicG90ZW50aWFsXCIsXCJzb25nXCIsXCJjbmV0XCIsXCJsdGRcIixcImxvc1wiLFwiaHBcIixcImZvY3VzXCIsXCJsYXRlXCIsXCJmYWxsXCIsXCJmZWF0dXJlZFwiLFwiaWRlYVwiLFwicm9vbXNcIixcImZlbWFsZVwiLFwicmVzcG9uc2libGVcIixcImluY1wiLFwiY29tbXVuaWNhdGlvbnNcIixcIndpblwiLFwiYXNzb2NpYXRlZFwiLFwidGhvbWFzXCIsXCJwcmltYXJ5XCIsXCJjYW5jZXJcIixcIm51bWJlcnNcIixcInJlYXNvblwiLFwidG9vbFwiLFwiYnJvd3NlclwiLFwic3ByaW5nXCIsXCJmb3VuZGF0aW9uXCIsXCJhbnN3ZXJcIixcInZvaWNlXCIsXCJlZ1wiLFwiZnJpZW5kbHlcIixcInNjaGVkdWxlXCIsXCJkb2N1bWVudHNcIixcImNvbW11bmljYXRpb25cIixcInB1cnBvc2VcIixcImZlYXR1cmVcIixcImJlZFwiLFwiY29tZXNcIixcInBvbGljZVwiLFwiZXZlcnlvbmVcIixcImluZGVwZW5kZW50XCIsXCJpcFwiLFwiYXBwcm9hY2hcIixcImNhbWVyYXNcIixcImJyb3duXCIsXCJwaHlzaWNhbFwiLFwib3BlcmF0aW5nXCIsXCJoaWxsXCIsXCJtYXBzXCIsXCJtZWRpY2luZVwiLFwiZGVhbFwiLFwiaG9sZFwiLFwicmF0aW5nc1wiLFwiY2hpY2Fnb1wiLFwiZm9ybXNcIixcImdsYXNzXCIsXCJoYXBweVwiLFwidHVlXCIsXCJzbWl0aFwiLFwid2FudGVkXCIsXCJkZXZlbG9wZWRcIixcInRoYW5rXCIsXCJzYWZlXCIsXCJ1bmlxdWVcIixcInN1cnZleVwiLFwicHJpb3JcIixcInRlbGVwaG9uZVwiLFwic3BvcnRcIixcInJlYWR5XCIsXCJmZWVkXCIsXCJhbmltYWxcIixcInNvdXJjZXNcIixcIm1leGljb1wiLFwicG9wdWxhdGlvblwiLFwicGFcIixcInJlZ3VsYXJcIixcInNlY3VyZVwiLFwibmF2aWdhdGlvblwiLFwib3BlcmF0aW9uc1wiLFwidGhlcmVmb3JlXCIsXCJzaW1wbHlcIixcImV2aWRlbmNlXCIsXCJzdGF0aW9uXCIsXCJjaHJpc3RpYW5cIixcInJvdW5kXCIsXCJwYXlwYWxcIixcImZhdm9yaXRlXCIsXCJ1bmRlcnN0YW5kXCIsXCJvcHRpb25cIixcIm1hc3RlclwiLFwidmFsbGV5XCIsXCJyZWNlbnRseVwiLFwicHJvYmFibHlcIixcInRodVwiLFwicmVudGFsc1wiLFwic2VhXCIsXCJidWlsdFwiLFwicHVibGljYXRpb25zXCIsXCJibG9vZFwiLFwiY3V0XCIsXCJ3b3JsZHdpZGVcIixcImltcHJvdmVcIixcImNvbm5lY3Rpb25cIixcInB1Ymxpc2hlclwiLFwiaGFsbFwiLFwibGFyZ2VyXCIsXCJhbnRpXCIsXCJuZXR3b3Jrc1wiLFwiZWFydGhcIixcInBhcmVudHNcIixcIm5va2lhXCIsXCJpbXBhY3RcIixcInRyYW5zZmVyXCIsXCJpbnRyb2R1Y3Rpb25cIixcImtpdGNoZW5cIixcInN0cm9uZ1wiLFwidGVsXCIsXCJjYXJvbGluYVwiLFwid2VkZGluZ1wiLFwicHJvcGVydGllc1wiLFwiaG9zcGl0YWxcIixcImdyb3VuZFwiLFwib3ZlcnZpZXdcIixcInNoaXBcIixcImFjY29tbW9kYXRpb25cIixcIm93bmVyc1wiLFwiZGlzZWFzZVwiLFwidHhcIixcImV4Y2VsbGVudFwiLFwicGFpZFwiLFwiaXRhbHlcIixcInBlcmZlY3RcIixcImhhaXJcIixcIm9wcG9ydHVuaXR5XCIsXCJraXRcIixcImNsYXNzaWNcIixcImJhc2lzXCIsXCJjb21tYW5kXCIsXCJjaXRpZXNcIixcIndpbGxpYW1cIixcImV4cHJlc3NcIixcImF3YXJkXCIsXCJkaXN0YW5jZVwiLFwidHJlZVwiLFwicGV0ZXJcIixcImFzc2Vzc21lbnRcIixcImVuc3VyZVwiLFwidGh1c1wiLFwid2FsbFwiLFwiaWVcIixcImludm9sdmVkXCIsXCJlbFwiLFwiZXh0cmFcIixcImVzcGVjaWFsbHlcIixcImludGVyZmFjZVwiLFwicGFydG5lcnNcIixcImJ1ZGdldFwiLFwicmF0ZWRcIixcImd1aWRlc1wiLFwic3VjY2Vzc1wiLFwibWF4aW11bVwiLFwibWFcIixcIm9wZXJhdGlvblwiLFwiZXhpc3RpbmdcIixcInF1aXRlXCIsXCJzZWxlY3RlZFwiLFwiYm95XCIsXCJhbWF6b25cIixcInBhdGllbnRzXCIsXCJyZXN0YXVyYW50c1wiLFwiYmVhdXRpZnVsXCIsXCJ3YXJuaW5nXCIsXCJ3aW5lXCIsXCJsb2NhdGlvbnNcIixcImhvcnNlXCIsXCJ2b3RlXCIsXCJmb3J3YXJkXCIsXCJmbG93ZXJzXCIsXCJzdGFyc1wiLFwic2lnbmlmaWNhbnRcIixcImxpc3RzXCIsXCJ0ZWNobm9sb2dpZXNcIixcIm93bmVyXCIsXCJyZXRhaWxcIixcImFuaW1hbHNcIixcInVzZWZ1bFwiLFwiZGlyZWN0bHlcIixcIm1hbnVmYWN0dXJlclwiLFwid2F5c1wiLFwiZXN0XCIsXCJzb25cIixcInByb3ZpZGluZ1wiLFwicnVsZVwiLFwibWFjXCIsXCJob3VzaW5nXCIsXCJ0YWtlc1wiLFwiaWlpXCIsXCJnbXRcIixcImJyaW5nXCIsXCJjYXRhbG9nXCIsXCJzZWFyY2hlc1wiLFwibWF4XCIsXCJ0cnlpbmdcIixcIm1vdGhlclwiLFwiYXV0aG9yaXR5XCIsXCJjb25zaWRlcmVkXCIsXCJ0b2xkXCIsXCJ4bWxcIixcInRyYWZmaWNcIixcInByb2dyYW1tZVwiLFwiam9pbmVkXCIsXCJpbnB1dFwiLFwic3RyYXRlZ3lcIixcImZlZXRcIixcImFnZW50XCIsXCJ2YWxpZFwiLFwiYmluXCIsXCJtb2Rlcm5cIixcInNlbmlvclwiLFwiaXJlbGFuZFwiLFwidGVhY2hpbmdcIixcImRvb3JcIixcImdyYW5kXCIsXCJ0ZXN0aW5nXCIsXCJ0cmlhbFwiLFwiY2hhcmdlXCIsXCJ1bml0c1wiLFwiaW5zdGVhZFwiLFwiY2FuYWRpYW5cIixcImNvb2xcIixcIm5vcm1hbFwiLFwid3JvdGVcIixcImVudGVycHJpc2VcIixcInNoaXBzXCIsXCJlbnRpcmVcIixcImVkdWNhdGlvbmFsXCIsXCJtZFwiLFwibGVhZGluZ1wiLFwibWV0YWxcIixcInBvc2l0aXZlXCIsXCJmbFwiLFwiZml0bmVzc1wiLFwiY2hpbmVzZVwiLFwib3BpbmlvblwiLFwibWJcIixcImFzaWFcIixcImZvb3RiYWxsXCIsXCJhYnN0cmFjdFwiLFwidXNlc1wiLFwib3V0cHV0XCIsXCJmdW5kc1wiLFwibXJcIixcImdyZWF0ZXJcIixcImxpa2VseVwiLFwiZGV2ZWxvcFwiLFwiZW1wbG95ZWVzXCIsXCJhcnRpc3RzXCIsXCJhbHRlcm5hdGl2ZVwiLFwicHJvY2Vzc2luZ1wiLFwicmVzcG9uc2liaWxpdHlcIixcInJlc29sdXRpb25cIixcImphdmFcIixcImd1ZXN0XCIsXCJzZWVtc1wiLFwicHVibGljYXRpb25cIixcInBhc3NcIixcInJlbGF0aW9uc1wiLFwidHJ1c3RcIixcInZhblwiLFwiY29udGFpbnNcIixcInNlc3Npb25cIixcIm11bHRpXCIsXCJwaG90b2dyYXBoeVwiLFwicmVwdWJsaWNcIixcImZlZXNcIixcImNvbXBvbmVudHNcIixcInZhY2F0aW9uXCIsXCJjZW50dXJ5XCIsXCJhY2FkZW1pY1wiLFwiYXNzaXN0YW5jZVwiLFwiY29tcGxldGVkXCIsXCJza2luXCIsXCJncmFwaGljc1wiLFwiaW5kaWFuXCIsXCJwcmV2XCIsXCJhZHNcIixcIm1hcnlcIixcImlsXCIsXCJleHBlY3RlZFwiLFwicmluZ1wiLFwiZ3JhZGVcIixcImRhdGluZ1wiLFwicGFjaWZpY1wiLFwibW91bnRhaW5cIixcIm9yZ2FuaXphdGlvbnNcIixcInBvcFwiLFwiZmlsdGVyXCIsXCJtYWlsaW5nXCIsXCJ2ZWhpY2xlXCIsXCJsb25nZXJcIixcImNvbnNpZGVyXCIsXCJpbnRcIixcIm5vcnRoZXJuXCIsXCJiZWhpbmRcIixcInBhbmVsXCIsXCJmbG9vclwiLFwiZ2VybWFuXCIsXCJidXlpbmdcIixcIm1hdGNoXCIsXCJwcm9wb3NlZFwiLFwiZGVmYXVsdFwiLFwicmVxdWlyZVwiLFwiaXJhcVwiLFwiYm95c1wiLFwib3V0ZG9vclwiLFwiZGVlcFwiLFwibW9ybmluZ1wiLFwib3RoZXJ3aXNlXCIsXCJhbGxvd3NcIixcInJlc3RcIixcInByb3RlaW5cIixcInBsYW50XCIsXCJyZXBvcnRlZFwiLFwiaGl0XCIsXCJ0cmFuc3BvcnRhdGlvblwiLFwibW1cIixcInBvb2xcIixcIm1pbmlcIixcInBvbGl0aWNzXCIsXCJwYXJ0bmVyXCIsXCJkaXNjbGFpbWVyXCIsXCJhdXRob3JzXCIsXCJib2FyZHNcIixcImZhY3VsdHlcIixcInBhcnRpZXNcIixcImZpc2hcIixcIm1lbWJlcnNoaXBcIixcIm1pc3Npb25cIixcImV5ZVwiLFwic3RyaW5nXCIsXCJzZW5zZVwiLFwibW9kaWZpZWRcIixcInBhY2tcIixcInJlbGVhc2VkXCIsXCJzdGFnZVwiLFwiaW50ZXJuYWxcIixcImdvb2RzXCIsXCJyZWNvbW1lbmRlZFwiLFwiYm9yblwiLFwidW5sZXNzXCIsXCJyaWNoYXJkXCIsXCJkZXRhaWxlZFwiLFwiamFwYW5lc2VcIixcInJhY2VcIixcImFwcHJvdmVkXCIsXCJiYWNrZ3JvdW5kXCIsXCJ0YXJnZXRcIixcImV4Y2VwdFwiLFwiY2hhcmFjdGVyXCIsXCJ1c2JcIixcIm1haW50ZW5hbmNlXCIsXCJhYmlsaXR5XCIsXCJtYXliZVwiLFwiZnVuY3Rpb25zXCIsXCJlZFwiLFwibW92aW5nXCIsXCJicmFuZHNcIixcInBsYWNlc1wiLFwicGhwXCIsXCJwcmV0dHlcIixcInRyYWRlbWFya3NcIixcInBoZW50ZXJtaW5lXCIsXCJzcGFpblwiLFwic291dGhlcm5cIixcInlvdXJzZWxmXCIsXCJldGNcIixcIndpbnRlclwiLFwiYmF0dGVyeVwiLFwieW91dGhcIixcInByZXNzdXJlXCIsXCJzdWJtaXR0ZWRcIixcImJvc3RvblwiLFwiZGVidFwiLFwia2V5d29yZHNcIixcIm1lZGl1bVwiLFwidGVsZXZpc2lvblwiLFwiaW50ZXJlc3RlZFwiLFwiY29yZVwiLFwiYnJlYWtcIixcInB1cnBvc2VzXCIsXCJ0aHJvdWdob3V0XCIsXCJzZXRzXCIsXCJkYW5jZVwiLFwid29vZFwiLFwibXNuXCIsXCJpdHNlbGZcIixcImRlZmluZWRcIixcInBhcGVyc1wiLFwicGxheWluZ1wiLFwiYXdhcmRzXCIsXCJmZWVcIixcInN0dWRpb1wiLFwicmVhZGVyXCIsXCJ2aXJ0dWFsXCIsXCJkZXZpY2VcIixcImVzdGFibGlzaGVkXCIsXCJhbnN3ZXJzXCIsXCJyZW50XCIsXCJsYXNcIixcInJlbW90ZVwiLFwiZGFya1wiLFwicHJvZ3JhbW1pbmdcIixcImV4dGVybmFsXCIsXCJhcHBsZVwiLFwibGVcIixcInJlZ2FyZGluZ1wiLFwiaW5zdHJ1Y3Rpb25zXCIsXCJtaW5cIixcIm9mZmVyZWRcIixcInRoZW9yeVwiLFwiZW5qb3lcIixcInJlbW92ZVwiLFwiYWlkXCIsXCJzdXJmYWNlXCIsXCJtaW5pbXVtXCIsXCJ2aXN1YWxcIixcImhvc3RcIixcInZhcmlldHlcIixcInRlYWNoZXJzXCIsXCJpc2JuXCIsXCJtYXJ0aW5cIixcIm1hbnVhbFwiLFwiYmxvY2tcIixcInN1YmplY3RzXCIsXCJhZ2VudHNcIixcImluY3JlYXNlZFwiLFwicmVwYWlyXCIsXCJmYWlyXCIsXCJjaXZpbFwiLFwic3RlZWxcIixcInVuZGVyc3RhbmRpbmdcIixcInNvbmdzXCIsXCJmaXhlZFwiLFwid3JvbmdcIixcImJlZ2lubmluZ1wiLFwiaGFuZHNcIixcImFzc29jaWF0ZXNcIixcImZpbmFsbHlcIixcImF6XCIsXCJ1cGRhdGVzXCIsXCJkZXNrdG9wXCIsXCJjbGFzc2VzXCIsXCJwYXJpc1wiLFwib2hpb1wiLFwiZ2V0c1wiLFwic2VjdG9yXCIsXCJjYXBhY2l0eVwiLFwicmVxdWlyZXNcIixcImplcnNleVwiLFwidW5cIixcImZhdFwiLFwiZnVsbHlcIixcImZhdGhlclwiLFwiZWxlY3RyaWNcIixcInNhd1wiLFwiaW5zdHJ1bWVudHNcIixcInF1b3Rlc1wiLFwib2ZmaWNlclwiLFwiZHJpdmVyXCIsXCJidXNpbmVzc2VzXCIsXCJkZWFkXCIsXCJyZXNwZWN0XCIsXCJ1bmtub3duXCIsXCJzcGVjaWZpZWRcIixcInJlc3RhdXJhbnRcIixcIm1pa2VcIixcInRyaXBcIixcInBzdFwiLFwid29ydGhcIixcIm1pXCIsXCJwcm9jZWR1cmVzXCIsXCJwb29yXCIsXCJ0ZWFjaGVyXCIsXCJleWVzXCIsXCJyZWxhdGlvbnNoaXBcIixcIndvcmtlcnNcIixcImZhcm1cIixcImdlb3JnaWFcIixcInBlYWNlXCIsXCJ0cmFkaXRpb25hbFwiLFwiY2FtcHVzXCIsXCJ0b21cIixcInNob3dpbmdcIixcImNyZWF0aXZlXCIsXCJjb2FzdFwiLFwiYmVuZWZpdFwiLFwicHJvZ3Jlc3NcIixcImZ1bmRpbmdcIixcImRldmljZXNcIixcImxvcmRcIixcImdyYW50XCIsXCJzdWJcIixcImFncmVlXCIsXCJmaWN0aW9uXCIsXCJoZWFyXCIsXCJzb21ldGltZXNcIixcIndhdGNoZXNcIixcImNhcmVlcnNcIixcImJleW9uZFwiLFwiZ29lc1wiLFwiZmFtaWxpZXNcIixcImxlZFwiLFwibXVzZXVtXCIsXCJ0aGVtc2VsdmVzXCIsXCJmYW5cIixcInRyYW5zcG9ydFwiLFwiaW50ZXJlc3RpbmdcIixcImJsb2dzXCIsXCJ3aWZlXCIsXCJldmFsdWF0aW9uXCIsXCJhY2NlcHRlZFwiLFwiZm9ybWVyXCIsXCJpbXBsZW1lbnRhdGlvblwiLFwidGVuXCIsXCJoaXRzXCIsXCJ6b25lXCIsXCJjb21wbGV4XCIsXCJ0aFwiLFwiY2F0XCIsXCJnYWxsZXJpZXNcIixcInJlZmVyZW5jZXNcIixcImRpZVwiLFwicHJlc2VudGVkXCIsXCJqYWNrXCIsXCJmbGF0XCIsXCJmbG93XCIsXCJhZ2VuY2llc1wiLFwibGl0ZXJhdHVyZVwiLFwicmVzcGVjdGl2ZVwiLFwicGFyZW50XCIsXCJzcGFuaXNoXCIsXCJtaWNoaWdhblwiLFwiY29sdW1iaWFcIixcInNldHRpbmdcIixcImRyXCIsXCJzY2FsZVwiLFwic3RhbmRcIixcImVjb25vbXlcIixcImhpZ2hlc3RcIixcImhlbHBmdWxcIixcIm1vbnRobHlcIixcImNyaXRpY2FsXCIsXCJmcmFtZVwiLFwibXVzaWNhbFwiLFwiZGVmaW5pdGlvblwiLFwic2VjcmV0YXJ5XCIsXCJhbmdlbGVzXCIsXCJuZXR3b3JraW5nXCIsXCJwYXRoXCIsXCJhdXN0cmFsaWFuXCIsXCJlbXBsb3llZVwiLFwiY2hpZWZcIixcImdpdmVzXCIsXCJrYlwiLFwiYm90dG9tXCIsXCJtYWdhemluZXNcIixcInBhY2thZ2VzXCIsXCJkZXRhaWxcIixcImZyYW5jaXNjb1wiLFwibGF3c1wiLFwiY2hhbmdlZFwiLFwicGV0XCIsXCJoZWFyZFwiLFwiYmVnaW5cIixcImluZGl2aWR1YWxzXCIsXCJjb2xvcmFkb1wiLFwicm95YWxcIixcImNsZWFuXCIsXCJzd2l0Y2hcIixcInJ1c3NpYW5cIixcImxhcmdlc3RcIixcImFmcmljYW5cIixcImd1eVwiLFwidGl0bGVzXCIsXCJyZWxldmFudFwiLFwiZ3VpZGVsaW5lc1wiLFwianVzdGljZVwiLFwiY29ubmVjdFwiLFwiYmlibGVcIixcImRldlwiLFwiY3VwXCIsXCJiYXNrZXRcIixcImFwcGxpZWRcIixcIndlZWtseVwiLFwidm9sXCIsXCJpbnN0YWxsYXRpb25cIixcImRlc2NyaWJlZFwiLFwiZGVtYW5kXCIsXCJwcFwiLFwic3VpdGVcIixcInZlZ2FzXCIsXCJuYVwiLFwic3F1YXJlXCIsXCJjaHJpc1wiLFwiYXR0ZW50aW9uXCIsXCJhZHZhbmNlXCIsXCJza2lwXCIsXCJkaWV0XCIsXCJhcm15XCIsXCJhdWN0aW9uXCIsXCJnZWFyXCIsXCJsZWVcIixcIm9zXCIsXCJkaWZmZXJlbmNlXCIsXCJhbGxvd2VkXCIsXCJjb3JyZWN0XCIsXCJjaGFybGVzXCIsXCJuYXRpb25cIixcInNlbGxpbmdcIixcImxvdHNcIixcInBpZWNlXCIsXCJzaGVldFwiLFwiZmlybVwiLFwic2V2ZW5cIixcIm9sZGVyXCIsXCJpbGxpbm9pc1wiLFwicmVndWxhdGlvbnNcIixcImVsZW1lbnRzXCIsXCJzcGVjaWVzXCIsXCJqdW1wXCIsXCJjZWxsc1wiLFwibW9kdWxlXCIsXCJyZXNvcnRcIixcImZhY2lsaXR5XCIsXCJyYW5kb21cIixcInByaWNpbmdcIixcImR2ZHNcIixcImNlcnRpZmljYXRlXCIsXCJtaW5pc3RlclwiLFwibW90aW9uXCIsXCJsb29rc1wiLFwiZmFzaGlvblwiLFwiZGlyZWN0aW9uc1wiLFwidmlzaXRvcnNcIixcImRvY3VtZW50YXRpb25cIixcIm1vbml0b3JcIixcInRyYWRpbmdcIixcImZvcmVzdFwiLFwiY2FsbHNcIixcIndob3NlXCIsXCJjb3ZlcmFnZVwiLFwiY291cGxlXCIsXCJnaXZpbmdcIixcImNoYW5jZVwiLFwidmlzaW9uXCIsXCJiYWxsXCIsXCJlbmRpbmdcIixcImNsaWVudHNcIixcImFjdGlvbnNcIixcImxpc3RlblwiLFwiZGlzY3Vzc1wiLFwiYWNjZXB0XCIsXCJhdXRvbW90aXZlXCIsXCJuYWtlZFwiLFwiZ29hbFwiLFwic3VjY2Vzc2Z1bFwiLFwic29sZFwiLFwid2luZFwiLFwiY29tbXVuaXRpZXNcIixcImNsaW5pY2FsXCIsXCJzaXR1YXRpb25cIixcInNjaWVuY2VzXCIsXCJtYXJrZXRzXCIsXCJsb3dlc3RcIixcImhpZ2hseVwiLFwicHVibGlzaGluZ1wiLFwiYXBwZWFyXCIsXCJlbWVyZ2VuY3lcIixcImRldmVsb3BpbmdcIixcImxpdmVzXCIsXCJjdXJyZW5jeVwiLFwibGVhdGhlclwiLFwiZGV0ZXJtaW5lXCIsXCJ0ZW1wZXJhdHVyZVwiLFwicGFsbVwiLFwiYW5ub3VuY2VtZW50c1wiLFwicGF0aWVudFwiLFwiYWN0dWFsXCIsXCJoaXN0b3JpY2FsXCIsXCJzdG9uZVwiLFwiYm9iXCIsXCJjb21tZXJjZVwiLFwicmluZ3RvbmVzXCIsXCJwZXJoYXBzXCIsXCJwZXJzb25zXCIsXCJkaWZmaWN1bHRcIixcInNjaWVudGlmaWNcIixcInNhdGVsbGl0ZVwiLFwiZml0XCIsXCJ0ZXN0c1wiLFwidmlsbGFnZVwiLFwiYWNjb3VudHNcIixcImFtYXRldXJcIixcImV4XCIsXCJtZXRcIixcInBhaW5cIixcInhib3hcIixcInBhcnRpY3VsYXJseVwiLFwiZmFjdG9yc1wiLFwiY29mZmVlXCIsXCJ3d3dcIixcInNldHRpbmdzXCIsXCJidXllclwiLFwiY3VsdHVyYWxcIixcInN0ZXZlXCIsXCJlYXNpbHlcIixcIm9yYWxcIixcImZvcmRcIixcInBvc3RlclwiLFwiZWRnZVwiLFwiZnVuY3Rpb25hbFwiLFwicm9vdFwiLFwiYXVcIixcImZpXCIsXCJjbG9zZWRcIixcImhvbGlkYXlzXCIsXCJpY2VcIixcInBpbmtcIixcInplYWxhbmRcIixcImJhbGFuY2VcIixcIm1vbml0b3JpbmdcIixcImdyYWR1YXRlXCIsXCJyZXBsaWVzXCIsXCJzaG90XCIsXCJuY1wiLFwiYXJjaGl0ZWN0dXJlXCIsXCJpbml0aWFsXCIsXCJsYWJlbFwiLFwidGhpbmtpbmdcIixcInNjb3R0XCIsXCJsbGNcIixcInNlY1wiLFwicmVjb21tZW5kXCIsXCJjYW5vblwiLFwibGVhZ3VlXCIsXCJ3YXN0ZVwiLFwibWludXRlXCIsXCJidXNcIixcInByb3ZpZGVyXCIsXCJvcHRpb25hbFwiLFwiZGljdGlvbmFyeVwiLFwiY29sZFwiLFwiYWNjb3VudGluZ1wiLFwibWFudWZhY3R1cmluZ1wiLFwic2VjdGlvbnNcIixcImNoYWlyXCIsXCJmaXNoaW5nXCIsXCJlZmZvcnRcIixcInBoYXNlXCIsXCJmaWVsZHNcIixcImJhZ1wiLFwiZmFudGFzeVwiLFwicG9cIixcImxldHRlcnNcIixcIm1vdG9yXCIsXCJ2YVwiLFwicHJvZmVzc29yXCIsXCJjb250ZXh0XCIsXCJpbnN0YWxsXCIsXCJzaGlydFwiLFwiYXBwYXJlbFwiLFwiZ2VuZXJhbGx5XCIsXCJjb250aW51ZWRcIixcImZvb3RcIixcIm1hc3NcIixcImNyaW1lXCIsXCJjb3VudFwiLFwiYnJlYXN0XCIsXCJ0ZWNobmlxdWVzXCIsXCJpYm1cIixcInJkXCIsXCJqb2huc29uXCIsXCJzY1wiLFwicXVpY2tseVwiLFwiZG9sbGFyc1wiLFwid2Vic2l0ZXNcIixcInJlbGlnaW9uXCIsXCJjbGFpbVwiLFwiZHJpdmluZ1wiLFwicGVybWlzc2lvblwiLFwic3VyZ2VyeVwiLFwicGF0Y2hcIixcImhlYXRcIixcIndpbGRcIixcIm1lYXN1cmVzXCIsXCJnZW5lcmF0aW9uXCIsXCJrYW5zYXNcIixcIm1pc3NcIixcImNoZW1pY2FsXCIsXCJkb2N0b3JcIixcInRhc2tcIixcInJlZHVjZVwiLFwiYnJvdWdodFwiLFwiaGltc2VsZlwiLFwibm9yXCIsXCJjb21wb25lbnRcIixcImVuYWJsZVwiLFwiZXhlcmNpc2VcIixcImJ1Z1wiLFwic2FudGFcIixcIm1pZFwiLFwiZ3VhcmFudGVlXCIsXCJsZWFkZXJcIixcImRpYW1vbmRcIixcImlzcmFlbFwiLFwic2VcIixcInByb2Nlc3Nlc1wiLFwic29mdFwiLFwic2VydmVyc1wiLFwiYWxvbmVcIixcIm1lZXRpbmdzXCIsXCJzZWNvbmRzXCIsXCJqb25lc1wiLFwiYXJpem9uYVwiLFwia2V5d29yZFwiLFwiaW50ZXJlc3RzXCIsXCJmbGlnaHRcIixcImNvbmdyZXNzXCIsXCJmdWVsXCIsXCJ1c2VybmFtZVwiLFwid2Fsa1wiLFwicHJvZHVjZWRcIixcIml0YWxpYW5cIixcInBhcGVyYmFja1wiLFwiY2xhc3NpZmllZHNcIixcIndhaXRcIixcInN1cHBvcnRlZFwiLFwicG9ja2V0XCIsXCJzYWludFwiLFwicm9zZVwiLFwiZnJlZWRvbVwiLFwiYXJndW1lbnRcIixcImNvbXBldGl0aW9uXCIsXCJjcmVhdGluZ1wiLFwiamltXCIsXCJkcnVnc1wiLFwiam9pbnRcIixcInByZW1pdW1cIixcInByb3ZpZGVyc1wiLFwiZnJlc2hcIixcImNoYXJhY3RlcnNcIixcImF0dG9ybmV5XCIsXCJ1cGdyYWRlXCIsXCJkaVwiLFwiZmFjdG9yXCIsXCJncm93aW5nXCIsXCJ0aG91c2FuZHNcIixcImttXCIsXCJzdHJlYW1cIixcImFwYXJ0bWVudHNcIixcInBpY2tcIixcImhlYXJpbmdcIixcImVhc3Rlcm5cIixcImF1Y3Rpb25zXCIsXCJ0aGVyYXB5XCIsXCJlbnRyaWVzXCIsXCJkYXRlc1wiLFwiZ2VuZXJhdGVkXCIsXCJzaWduZWRcIixcInVwcGVyXCIsXCJhZG1pbmlzdHJhdGl2ZVwiLFwic2VyaW91c1wiLFwicHJpbWVcIixcInNhbXN1bmdcIixcImxpbWl0XCIsXCJiZWdhblwiLFwibG91aXNcIixcInN0ZXBzXCIsXCJlcnJvcnNcIixcInNob3BzXCIsXCJkZWxcIixcImVmZm9ydHNcIixcImluZm9ybWVkXCIsXCJnYVwiLFwiYWNcIixcInRob3VnaHRzXCIsXCJjcmVla1wiLFwiZnRcIixcIndvcmtlZFwiLFwicXVhbnRpdHlcIixcInVyYmFuXCIsXCJwcmFjdGljZXNcIixcInNvcnRlZFwiLFwicmVwb3J0aW5nXCIsXCJlc3NlbnRpYWxcIixcIm15c2VsZlwiLFwidG91cnNcIixcInBsYXRmb3JtXCIsXCJsb2FkXCIsXCJhZmZpbGlhdGVcIixcImxhYm9yXCIsXCJpbW1lZGlhdGVseVwiLFwiYWRtaW5cIixcIm51cnNpbmdcIixcImRlZmVuc2VcIixcIm1hY2hpbmVzXCIsXCJkZXNpZ25hdGVkXCIsXCJ0YWdzXCIsXCJoZWF2eVwiLFwiY292ZXJlZFwiLFwicmVjb3ZlcnlcIixcImpvZVwiLFwiZ3V5c1wiLFwiaW50ZWdyYXRlZFwiLFwiY29uZmlndXJhdGlvblwiLFwibWVyY2hhbnRcIixcImNvbXByZWhlbnNpdmVcIixcImV4cGVydFwiLFwidW5pdmVyc2FsXCIsXCJwcm90ZWN0XCIsXCJkcm9wXCIsXCJzb2xpZFwiLFwiY2RzXCIsXCJwcmVzZW50YXRpb25cIixcImxhbmd1YWdlc1wiLFwiYmVjYW1lXCIsXCJvcmFuZ2VcIixcImNvbXBsaWFuY2VcIixcInZlaGljbGVzXCIsXCJwcmV2ZW50XCIsXCJ0aGVtZVwiLFwicmljaFwiLFwiaW1cIixcImNhbXBhaWduXCIsXCJtYXJpbmVcIixcImltcHJvdmVtZW50XCIsXCJ2c1wiLFwiZ3VpdGFyXCIsXCJmaW5kaW5nXCIsXCJwZW5uc3lsdmFuaWFcIixcImV4YW1wbGVzXCIsXCJpcG9kXCIsXCJzYXlpbmdcIixcInNwaXJpdFwiLFwiYXJcIixcImNsYWltc1wiLFwiY2hhbGxlbmdlXCIsXCJtb3Rvcm9sYVwiLFwiYWNjZXB0YW5jZVwiLFwic3RyYXRlZ2llc1wiLFwibW9cIixcInNlZW1cIixcImFmZmFpcnNcIixcInRvdWNoXCIsXCJpbnRlbmRlZFwiLFwidG93YXJkc1wiLFwic2FcIixcImdvYWxzXCIsXCJoaXJlXCIsXCJlbGVjdGlvblwiLFwic3VnZ2VzdFwiLFwiYnJhbmNoXCIsXCJjaGFyZ2VzXCIsXCJzZXJ2ZVwiLFwiYWZmaWxpYXRlc1wiLFwicmVhc29uc1wiLFwibWFnaWNcIixcIm1vdW50XCIsXCJzbWFydFwiLFwidGFsa2luZ1wiLFwiZ2F2ZVwiLFwib25lc1wiLFwibGF0aW5cIixcIm11bHRpbWVkaWFcIixcInhwXCIsXCJhdm9pZFwiLFwiY2VydGlmaWVkXCIsXCJtYW5hZ2VcIixcImNvcm5lclwiLFwicmFua1wiLFwiY29tcHV0aW5nXCIsXCJvcmVnb25cIixcImVsZW1lbnRcIixcImJpcnRoXCIsXCJ2aXJ1c1wiLFwiYWJ1c2VcIixcImludGVyYWN0aXZlXCIsXCJyZXF1ZXN0c1wiLFwic2VwYXJhdGVcIixcInF1YXJ0ZXJcIixcInByb2NlZHVyZVwiLFwibGVhZGVyc2hpcFwiLFwidGFibGVzXCIsXCJkZWZpbmVcIixcInJhY2luZ1wiLFwicmVsaWdpb3VzXCIsXCJmYWN0c1wiLFwiYnJlYWtmYXN0XCIsXCJrb25nXCIsXCJjb2x1bW5cIixcInBsYW50c1wiLFwiZmFpdGhcIixcImNoYWluXCIsXCJkZXZlbG9wZXJcIixcImlkZW50aWZ5XCIsXCJhdmVudWVcIixcIm1pc3NpbmdcIixcImRpZWRcIixcImFwcHJveGltYXRlbHlcIixcImRvbWVzdGljXCIsXCJzaXRlbWFwXCIsXCJyZWNvbW1lbmRhdGlvbnNcIixcIm1vdmVkXCIsXCJob3VzdG9uXCIsXCJyZWFjaFwiLFwiY29tcGFyaXNvblwiLFwibWVudGFsXCIsXCJ2aWV3ZWRcIixcIm1vbWVudFwiLFwiZXh0ZW5kZWRcIixcInNlcXVlbmNlXCIsXCJpbmNoXCIsXCJhdHRhY2tcIixcInNvcnJ5XCIsXCJjZW50ZXJzXCIsXCJvcGVuaW5nXCIsXCJkYW1hZ2VcIixcImxhYlwiLFwicmVzZXJ2ZVwiLFwicmVjaXBlc1wiLFwiY3ZzXCIsXCJnYW1tYVwiLFwicGxhc3RpY1wiLFwicHJvZHVjZVwiLFwic25vd1wiLFwicGxhY2VkXCIsXCJ0cnV0aFwiLFwiY291bnRlclwiLFwiZmFpbHVyZVwiLFwiZm9sbG93c1wiLFwiZXVcIixcIndlZWtlbmRcIixcImRvbGxhclwiLFwiY2FtcFwiLFwib250YXJpb1wiLFwiYXV0b21hdGljYWxseVwiLFwiZGVzXCIsXCJtaW5uZXNvdGFcIixcImZpbG1zXCIsXCJicmlkZ2VcIixcIm5hdGl2ZVwiLFwiZmlsbFwiLFwid2lsbGlhbXNcIixcIm1vdmVtZW50XCIsXCJwcmludGluZ1wiLFwiYmFzZWJhbGxcIixcIm93bmVkXCIsXCJhcHByb3ZhbFwiLFwiZHJhZnRcIixcImNoYXJ0XCIsXCJwbGF5ZWRcIixcImNvbnRhY3RzXCIsXCJjY1wiLFwiamVzdXNcIixcInJlYWRlcnNcIixcImNsdWJzXCIsXCJsY2RcIixcIndhXCIsXCJqYWNrc29uXCIsXCJlcXVhbFwiLFwiYWR2ZW50dXJlXCIsXCJtYXRjaGluZ1wiLFwib2ZmZXJpbmdcIixcInNoaXJ0c1wiLFwicHJvZml0XCIsXCJsZWFkZXJzXCIsXCJwb3N0ZXJzXCIsXCJpbnN0aXR1dGlvbnNcIixcImFzc2lzdGFudFwiLFwidmFyaWFibGVcIixcImF2ZVwiLFwiZGpcIixcImFkdmVydGlzZW1lbnRcIixcImV4cGVjdFwiLFwicGFya2luZ1wiLFwiaGVhZGxpbmVzXCIsXCJ5ZXN0ZXJkYXlcIixcImNvbXBhcmVkXCIsXCJkZXRlcm1pbmVkXCIsXCJ3aG9sZXNhbGVcIixcIndvcmtzaG9wXCIsXCJydXNzaWFcIixcImdvbmVcIixcImNvZGVzXCIsXCJraW5kc1wiLFwiZXh0ZW5zaW9uXCIsXCJzZWF0dGxlXCIsXCJzdGF0ZW1lbnRzXCIsXCJnb2xkZW5cIixcImNvbXBsZXRlbHlcIixcInRlYW1zXCIsXCJmb3J0XCIsXCJjbVwiLFwid2lcIixcImxpZ2h0aW5nXCIsXCJzZW5hdGVcIixcImZvcmNlc1wiLFwiZnVubnlcIixcImJyb3RoZXJcIixcImdlbmVcIixcInR1cm5lZFwiLFwicG9ydGFibGVcIixcInRyaWVkXCIsXCJlbGVjdHJpY2FsXCIsXCJhcHBsaWNhYmxlXCIsXCJkaXNjXCIsXCJyZXR1cm5lZFwiLFwicGF0dGVyblwiLFwiY3RcIixcImJvYXRcIixcIm5hbWVkXCIsXCJ0aGVhdHJlXCIsXCJsYXNlclwiLFwiZWFybGllclwiLFwibWFudWZhY3R1cmVyc1wiLFwic3BvbnNvclwiLFwiY2xhc3NpY2FsXCIsXCJpY29uXCIsXCJ3YXJyYW50eVwiLFwiZGVkaWNhdGVkXCIsXCJpbmRpYW5hXCIsXCJkaXJlY3Rpb25cIixcImhhcnJ5XCIsXCJiYXNrZXRiYWxsXCIsXCJvYmplY3RzXCIsXCJlbmRzXCIsXCJkZWxldGVcIixcImV2ZW5pbmdcIixcImFzc2VtYmx5XCIsXCJudWNsZWFyXCIsXCJ0YXhlc1wiLFwibW91c2VcIixcInNpZ25hbFwiLFwiY3JpbWluYWxcIixcImlzc3VlZFwiLFwiYnJhaW5cIixcInNleHVhbFwiLFwid2lzY29uc2luXCIsXCJwb3dlcmZ1bFwiLFwiZHJlYW1cIixcIm9idGFpbmVkXCIsXCJmYWxzZVwiLFwiZGFcIixcImNhc3RcIixcImZsb3dlclwiLFwiZmVsdFwiLFwicGVyc29ubmVsXCIsXCJwYXNzZWRcIixcInN1cHBsaWVkXCIsXCJpZGVudGlmaWVkXCIsXCJmYWxsc1wiLFwicGljXCIsXCJzb3VsXCIsXCJhaWRzXCIsXCJvcGluaW9uc1wiLFwicHJvbW90ZVwiLFwic3RhdGVkXCIsXCJzdGF0c1wiLFwiaGF3YWlpXCIsXCJwcm9mZXNzaW9uYWxzXCIsXCJhcHBlYXJzXCIsXCJjYXJyeVwiLFwiZmxhZ1wiLFwiZGVjaWRlZFwiLFwibmpcIixcImNvdmVyc1wiLFwiaHJcIixcImVtXCIsXCJhZHZhbnRhZ2VcIixcImhlbGxvXCIsXCJkZXNpZ25zXCIsXCJtYWludGFpblwiLFwidG91cmlzbVwiLFwicHJpb3JpdHlcIixcIm5ld3NsZXR0ZXJzXCIsXCJhZHVsdHNcIixcImNsaXBzXCIsXCJzYXZpbmdzXCIsXCJpdlwiLFwiZ3JhcGhpY1wiLFwiYXRvbVwiLFwicGF5bWVudHNcIixcInJ3XCIsXCJlc3RpbWF0ZWRcIixcImJpbmRpbmdcIixcImJyaWVmXCIsXCJlbmRlZFwiLFwid2lubmluZ1wiLFwiZWlnaHRcIixcImFub255bW91c1wiLFwiaXJvblwiLFwic3RyYWlnaHRcIixcInNjcmlwdFwiLFwic2VydmVkXCIsXCJ3YW50c1wiLFwibWlzY2VsbGFuZW91c1wiLFwicHJlcGFyZWRcIixcInZvaWRcIixcImRpbmluZ1wiLFwiYWxlcnRcIixcImludGVncmF0aW9uXCIsXCJhdGxhbnRhXCIsXCJkYWtvdGFcIixcInRhZ1wiLFwiaW50ZXJ2aWV3XCIsXCJtaXhcIixcImZyYW1ld29ya1wiLFwiZGlza1wiLFwiaW5zdGFsbGVkXCIsXCJxdWVlblwiLFwidmhzXCIsXCJjcmVkaXRzXCIsXCJjbGVhcmx5XCIsXCJmaXhcIixcImhhbmRsZVwiLFwic3dlZXRcIixcImRlc2tcIixcImNyaXRlcmlhXCIsXCJwdWJtZWRcIixcImRhdmVcIixcIm1hc3NhY2h1c2V0dHNcIixcImRpZWdvXCIsXCJob25nXCIsXCJ2aWNlXCIsXCJhc3NvY2lhdGVcIixcIm5lXCIsXCJ0cnVja1wiLFwiYmVoYXZpb3JcIixcImVubGFyZ2VcIixcInJheVwiLFwiZnJlcXVlbnRseVwiLFwicmV2ZW51ZVwiLFwibWVhc3VyZVwiLFwiY2hhbmdpbmdcIixcInZvdGVzXCIsXCJkdVwiLFwiZHV0eVwiLFwibG9va2VkXCIsXCJkaXNjdXNzaW9uc1wiLFwiYmVhclwiLFwiZ2FpblwiLFwiZmVzdGl2YWxcIixcImxhYm9yYXRvcnlcIixcIm9jZWFuXCIsXCJmbGlnaHRzXCIsXCJleHBlcnRzXCIsXCJzaWduc1wiLFwibGFja1wiLFwiZGVwdGhcIixcImlvd2FcIixcIndoYXRldmVyXCIsXCJsb2dnZWRcIixcImxhcHRvcFwiLFwidmludGFnZVwiLFwidHJhaW5cIixcImV4YWN0bHlcIixcImRyeVwiLFwiZXhwbG9yZVwiLFwibWFyeWxhbmRcIixcInNwYVwiLFwiY29uY2VwdFwiLFwibmVhcmx5XCIsXCJlbGlnaWJsZVwiLFwiY2hlY2tvdXRcIixcInJlYWxpdHlcIixcImZvcmdvdFwiLFwiaGFuZGxpbmdcIixcIm9yaWdpblwiLFwia25ld1wiLFwiZ2FtaW5nXCIsXCJmZWVkc1wiLFwiYmlsbGlvblwiLFwiZGVzdGluYXRpb25cIixcInNjb3RsYW5kXCIsXCJmYXN0ZXJcIixcImludGVsbGlnZW5jZVwiLFwiZGFsbGFzXCIsXCJib3VnaHRcIixcImNvblwiLFwidXBzXCIsXCJuYXRpb25zXCIsXCJyb3V0ZVwiLFwiZm9sbG93ZWRcIixcInNwZWNpZmljYXRpb25zXCIsXCJicm9rZW5cIixcInRyaXBhZHZpc29yXCIsXCJmcmFua1wiLFwiYWxhc2thXCIsXCJ6b29tXCIsXCJibG93XCIsXCJiYXR0bGVcIixcInJlc2lkZW50aWFsXCIsXCJhbmltZVwiLFwic3BlYWtcIixcImRlY2lzaW9uc1wiLFwiaW5kdXN0cmllc1wiLFwicHJvdG9jb2xcIixcInF1ZXJ5XCIsXCJjbGlwXCIsXCJwYXJ0bmVyc2hpcFwiLFwiZWRpdG9yaWFsXCIsXCJudFwiLFwiZXhwcmVzc2lvblwiLFwiZXNcIixcImVxdWl0eVwiLFwicHJvdmlzaW9uc1wiLFwic3BlZWNoXCIsXCJ3aXJlXCIsXCJwcmluY2lwbGVzXCIsXCJzdWdnZXN0aW9uc1wiLFwicnVyYWxcIixcInNoYXJlZFwiLFwic291bmRzXCIsXCJyZXBsYWNlbWVudFwiLFwidGFwZVwiLFwic3RyYXRlZ2ljXCIsXCJqdWRnZVwiLFwic3BhbVwiLFwiZWNvbm9taWNzXCIsXCJhY2lkXCIsXCJieXRlc1wiLFwiY2VudFwiLFwiZm9yY2VkXCIsXCJjb21wYXRpYmxlXCIsXCJmaWdodFwiLFwiYXBhcnRtZW50XCIsXCJoZWlnaHRcIixcIm51bGxcIixcInplcm9cIixcInNwZWFrZXJcIixcImZpbGVkXCIsXCJnYlwiLFwibmV0aGVybGFuZHNcIixcIm9idGFpblwiLFwiYmNcIixcImNvbnN1bHRpbmdcIixcInJlY3JlYXRpb25cIixcIm9mZmljZXNcIixcImRlc2lnbmVyXCIsXCJyZW1haW5cIixcIm1hbmFnZWRcIixcInByXCIsXCJmYWlsZWRcIixcIm1hcnJpYWdlXCIsXCJyb2xsXCIsXCJrb3JlYVwiLFwiYmFua3NcIixcImZyXCIsXCJwYXJ0aWNpcGFudHNcIixcInNlY3JldFwiLFwiYmF0aFwiLFwiYWFcIixcImtlbGx5XCIsXCJsZWFkc1wiLFwibmVnYXRpdmVcIixcImF1c3RpblwiLFwiZmF2b3JpdGVzXCIsXCJ0b3JvbnRvXCIsXCJ0aGVhdGVyXCIsXCJzcHJpbmdzXCIsXCJtaXNzb3VyaVwiLFwiYW5kcmV3XCIsXCJ2YXJcIixcInBlcmZvcm1cIixcImhlYWx0aHlcIixcInRyYW5zbGF0aW9uXCIsXCJlc3RpbWF0ZXNcIixcImZvbnRcIixcImFzc2V0c1wiLFwiaW5qdXJ5XCIsXCJtdFwiLFwiam9zZXBoXCIsXCJtaW5pc3RyeVwiLFwiZHJpdmVyc1wiLFwibGF3eWVyXCIsXCJmaWd1cmVzXCIsXCJtYXJyaWVkXCIsXCJwcm90ZWN0ZWRcIixcInByb3Bvc2FsXCIsXCJzaGFyaW5nXCIsXCJwaGlsYWRlbHBoaWFcIixcInBvcnRhbFwiLFwid2FpdGluZ1wiLFwiYmlydGhkYXlcIixcImJldGFcIixcImZhaWxcIixcImdyYXRpc1wiLFwiYmFua2luZ1wiLFwib2ZmaWNpYWxzXCIsXCJicmlhblwiLFwidG93YXJkXCIsXCJ3b25cIixcInNsaWdodGx5XCIsXCJhc3Npc3RcIixcImNvbmR1Y3RcIixcImNvbnRhaW5lZFwiLFwibGluZ2VyaWVcIixcImxlZ2lzbGF0aW9uXCIsXCJjYWxsaW5nXCIsXCJwYXJhbWV0ZXJzXCIsXCJqYXp6XCIsXCJzZXJ2aW5nXCIsXCJiYWdzXCIsXCJwcm9maWxlc1wiLFwibWlhbWlcIixcImNvbWljc1wiLFwibWF0dGVyc1wiLFwiaG91c2VzXCIsXCJkb2NcIixcInBvc3RhbFwiLFwicmVsYXRpb25zaGlwc1wiLFwidGVubmVzc2VlXCIsXCJ3ZWFyXCIsXCJjb250cm9sc1wiLFwiYnJlYWtpbmdcIixcImNvbWJpbmVkXCIsXCJ1bHRpbWF0ZVwiLFwid2FsZXNcIixcInJlcHJlc2VudGF0aXZlXCIsXCJmcmVxdWVuY3lcIixcImludHJvZHVjZWRcIixcIm1pbm9yXCIsXCJmaW5pc2hcIixcImRlcGFydG1lbnRzXCIsXCJyZXNpZGVudHNcIixcIm5vdGVkXCIsXCJkaXNwbGF5ZWRcIixcIm1vbVwiLFwicmVkdWNlZFwiLFwicGh5c2ljc1wiLFwicmFyZVwiLFwic3BlbnRcIixcInBlcmZvcm1lZFwiLFwiZXh0cmVtZVwiLFwic2FtcGxlc1wiLFwiZGF2aXNcIixcImRhbmllbFwiLFwiYmFyc1wiLFwicmV2aWV3ZWRcIixcInJvd1wiLFwib3pcIixcImZvcmVjYXN0XCIsXCJyZW1vdmVkXCIsXCJoZWxwc1wiLFwic2luZ2xlc1wiLFwiYWRtaW5pc3RyYXRvclwiLFwiY3ljbGVcIixcImFtb3VudHNcIixcImNvbnRhaW5cIixcImFjY3VyYWN5XCIsXCJkdWFsXCIsXCJyaXNlXCIsXCJ1c2RcIixcInNsZWVwXCIsXCJtZ1wiLFwiYmlyZFwiLFwicGhhcm1hY3lcIixcImJyYXppbFwiLFwiY3JlYXRpb25cIixcInN0YXRpY1wiLFwic2NlbmVcIixcImh1bnRlclwiLFwiYWRkcmVzc2VzXCIsXCJsYWR5XCIsXCJjcnlzdGFsXCIsXCJmYW1vdXNcIixcIndyaXRlclwiLFwiY2hhaXJtYW5cIixcInZpb2xlbmNlXCIsXCJmYW5zXCIsXCJva2xhaG9tYVwiLFwic3BlYWtlcnNcIixcImRyaW5rXCIsXCJhY2FkZW15XCIsXCJkeW5hbWljXCIsXCJnZW5kZXJcIixcImVhdFwiLFwicGVybWFuZW50XCIsXCJhZ3JpY3VsdHVyZVwiLFwiZGVsbFwiLFwiY2xlYW5pbmdcIixcImNvbnN0aXR1dGVzXCIsXCJwb3J0Zm9saW9cIixcInByYWN0aWNhbFwiLFwiZGVsaXZlcmVkXCIsXCJjb2xsZWN0aWJsZXNcIixcImluZnJhc3RydWN0dXJlXCIsXCJleGNsdXNpdmVcIixcInNlYXRcIixcImNvbmNlcm5zXCIsXCJjb2xvdXJcIixcInZlbmRvclwiLFwib3JpZ2luYWxseVwiLFwiaW50ZWxcIixcInV0aWxpdGllc1wiLFwicGhpbG9zb3BoeVwiLFwicmVndWxhdGlvblwiLFwib2ZmaWNlcnNcIixcInJlZHVjdGlvblwiLFwiYWltXCIsXCJiaWRzXCIsXCJyZWZlcnJlZFwiLFwic3VwcG9ydHNcIixcIm51dHJpdGlvblwiLFwicmVjb3JkaW5nXCIsXCJyZWdpb25zXCIsXCJqdW5pb3JcIixcInRvbGxcIixcImxlc1wiLFwiY2FwZVwiLFwiYW5uXCIsXCJyaW5nc1wiLFwibWVhbmluZ1wiLFwidGlwXCIsXCJzZWNvbmRhcnlcIixcIndvbmRlcmZ1bFwiLFwibWluZVwiLFwibGFkaWVzXCIsXCJoZW5yeVwiLFwidGlja2V0XCIsXCJhbm5vdW5jZWRcIixcImd1ZXNzXCIsXCJhZ3JlZWRcIixcInByZXZlbnRpb25cIixcIndob21cIixcInNraVwiLFwic29jY2VyXCIsXCJtYXRoXCIsXCJpbXBvcnRcIixcInBvc3RpbmdcIixcInByZXNlbmNlXCIsXCJpbnN0YW50XCIsXCJtZW50aW9uZWRcIixcImF1dG9tYXRpY1wiLFwiaGVhbHRoY2FyZVwiLFwidmlld2luZ1wiLFwibWFpbnRhaW5lZFwiLFwiY2hcIixcImluY3JlYXNpbmdcIixcIm1ham9yaXR5XCIsXCJjb25uZWN0ZWRcIixcImNocmlzdFwiLFwiZGFuXCIsXCJkb2dzXCIsXCJzZFwiLFwiZGlyZWN0b3JzXCIsXCJhc3BlY3RzXCIsXCJhdXN0cmlhXCIsXCJhaGVhZFwiLFwibW9vblwiLFwicGFydGljaXBhdGlvblwiLFwic2NoZW1lXCIsXCJ1dGlsaXR5XCIsXCJwcmV2aWV3XCIsXCJmbHlcIixcIm1hbm5lclwiLFwibWF0cml4XCIsXCJjb250YWluaW5nXCIsXCJjb21iaW5hdGlvblwiLFwiZGV2ZWxcIixcImFtZW5kbWVudFwiLFwiZGVzcGl0ZVwiLFwic3RyZW5ndGhcIixcImd1YXJhbnRlZWRcIixcInR1cmtleVwiLFwibGlicmFyaWVzXCIsXCJwcm9wZXJcIixcImRpc3RyaWJ1dGVkXCIsXCJkZWdyZWVzXCIsXCJzaW5nYXBvcmVcIixcImVudGVycHJpc2VzXCIsXCJkZWx0YVwiLFwiZmVhclwiLFwic2Vla2luZ1wiLFwiaW5jaGVzXCIsXCJwaG9lbml4XCIsXCJyc1wiLFwiY29udmVudGlvblwiLFwic2hhcmVzXCIsXCJwcmluY2lwYWxcIixcImRhdWdodGVyXCIsXCJzdGFuZGluZ1wiLFwiY29tZm9ydFwiLFwiY29sb3JzXCIsXCJ3YXJzXCIsXCJjaXNjb1wiLFwib3JkZXJpbmdcIixcImtlcHRcIixcImFscGhhXCIsXCJhcHBlYWxcIixcImNydWlzZVwiLFwiYm9udXNcIixcImNlcnRpZmljYXRpb25cIixcInByZXZpb3VzbHlcIixcImhleVwiLFwiYm9va21hcmtcIixcImJ1aWxkaW5nc1wiLFwic3BlY2lhbHNcIixcImJlYXRcIixcImRpc25leVwiLFwiaG91c2Vob2xkXCIsXCJiYXR0ZXJpZXNcIixcImFkb2JlXCIsXCJzbW9raW5nXCIsXCJiYmNcIixcImJlY29tZXNcIixcImRyaXZlc1wiLFwiYXJtc1wiLFwiYWxhYmFtYVwiLFwidGVhXCIsXCJpbXByb3ZlZFwiLFwidHJlZXNcIixcImF2Z1wiLFwiYWNoaWV2ZVwiLFwicG9zaXRpb25zXCIsXCJkcmVzc1wiLFwic3Vic2NyaXB0aW9uXCIsXCJkZWFsZXJcIixcImNvbnRlbXBvcmFyeVwiLFwic2t5XCIsXCJ1dGFoXCIsXCJuZWFyYnlcIixcInJvbVwiLFwiY2FycmllZFwiLFwiaGFwcGVuXCIsXCJleHBvc3VyZVwiLFwicGFuYXNvbmljXCIsXCJoaWRlXCIsXCJwZXJtYWxpbmtcIixcInNpZ25hdHVyZVwiLFwiZ2FtYmxpbmdcIixcInJlZmVyXCIsXCJtaWxsZXJcIixcInByb3Zpc2lvblwiLFwib3V0ZG9vcnNcIixcImNsb3RoZXNcIixcImNhdXNlZFwiLFwibHV4dXJ5XCIsXCJiYWJlc1wiLFwiZnJhbWVzXCIsXCJjZXJ0YWlubHlcIixcImluZGVlZFwiLFwibmV3c3BhcGVyXCIsXCJ0b3lcIixcImNpcmN1aXRcIixcImxheWVyXCIsXCJwcmludGVkXCIsXCJzbG93XCIsXCJyZW1vdmFsXCIsXCJlYXNpZXJcIixcInNyY1wiLFwibGlhYmlsaXR5XCIsXCJ0cmFkZW1hcmtcIixcImhpcFwiLFwicHJpbnRlcnNcIixcImZhcXNcIixcIm5pbmVcIixcImFkZGluZ1wiLFwia2VudHVja3lcIixcIm1vc3RseVwiLFwiZXJpY1wiLFwic3BvdFwiLFwidGF5bG9yXCIsXCJ0cmFja2JhY2tcIixcInByaW50c1wiLFwic3BlbmRcIixcImZhY3RvcnlcIixcImludGVyaW9yXCIsXCJyZXZpc2VkXCIsXCJncm93XCIsXCJhbWVyaWNhbnNcIixcIm9wdGljYWxcIixcInByb21vdGlvblwiLFwicmVsYXRpdmVcIixcImFtYXppbmdcIixcImNsb2NrXCIsXCJkb3RcIixcImhpdlwiLFwiaWRlbnRpdHlcIixcInN1aXRlc1wiLFwiY29udmVyc2lvblwiLFwiZmVlbGluZ1wiLFwiaGlkZGVuXCIsXCJyZWFzb25hYmxlXCIsXCJ2aWN0b3JpYVwiLFwic2VyaWFsXCIsXCJyZWxpZWZcIixcInJldmlzaW9uXCIsXCJicm9hZGJhbmRcIixcImluZmx1ZW5jZVwiLFwicmF0aW9cIixcInBkYVwiLFwiaW1wb3J0YW5jZVwiLFwicmFpblwiLFwib250b1wiLFwiZHNsXCIsXCJwbGFuZXRcIixcIndlYm1hc3RlclwiLFwiY29waWVzXCIsXCJyZWNpcGVcIixcInp1bVwiLFwicGVybWl0XCIsXCJzZWVpbmdcIixcInByb29mXCIsXCJkbmFcIixcImRpZmZcIixcInRlbm5pc1wiLFwiYmFzc1wiLFwicHJlc2NyaXB0aW9uXCIsXCJiZWRyb29tXCIsXCJlbXB0eVwiLFwiaW5zdGFuY2VcIixcImhvbGVcIixcInBldHNcIixcInJpZGVcIixcImxpY2Vuc2VkXCIsXCJvcmxhbmRvXCIsXCJzcGVjaWZpY2FsbHlcIixcInRpbVwiLFwiYnVyZWF1XCIsXCJtYWluZVwiLFwic3FsXCIsXCJyZXByZXNlbnRcIixcImNvbnNlcnZhdGlvblwiLFwicGFpclwiLFwiaWRlYWxcIixcInNwZWNzXCIsXCJyZWNvcmRlZFwiLFwiZG9uXCIsXCJwaWVjZXNcIixcImZpbmlzaGVkXCIsXCJwYXJrc1wiLFwiZGlubmVyXCIsXCJsYXd5ZXJzXCIsXCJzeWRuZXlcIixcInN0cmVzc1wiLFwiY3JlYW1cIixcInNzXCIsXCJydW5zXCIsXCJ0cmVuZHNcIixcInllYWhcIixcImRpc2NvdmVyXCIsXCJhcFwiLFwicGF0dGVybnNcIixcImJveGVzXCIsXCJsb3Vpc2lhbmFcIixcImhpbGxzXCIsXCJqYXZhc2NyaXB0XCIsXCJmb3VydGhcIixcIm5tXCIsXCJhZHZpc29yXCIsXCJtblwiLFwibWFya2V0cGxhY2VcIixcIm5kXCIsXCJldmlsXCIsXCJhd2FyZVwiLFwid2lsc29uXCIsXCJzaGFwZVwiLFwiZXZvbHV0aW9uXCIsXCJpcmlzaFwiLFwiY2VydGlmaWNhdGVzXCIsXCJvYmplY3RpdmVzXCIsXCJzdGF0aW9uc1wiLFwic3VnZ2VzdGVkXCIsXCJncHNcIixcIm9wXCIsXCJyZW1haW5zXCIsXCJhY2NcIixcImdyZWF0ZXN0XCIsXCJmaXJtc1wiLFwiY29uY2VybmVkXCIsXCJldXJvXCIsXCJvcGVyYXRvclwiLFwic3RydWN0dXJlc1wiLFwiZ2VuZXJpY1wiLFwiZW5jeWNsb3BlZGlhXCIsXCJ1c2FnZVwiLFwiY2FwXCIsXCJpbmtcIixcImNoYXJ0c1wiLFwiY29udGludWluZ1wiLFwibWl4ZWRcIixcImNlbnN1c1wiLFwiaW50ZXJyYWNpYWxcIixcInBlYWtcIixcInRuXCIsXCJjb21wZXRpdGl2ZVwiLFwiZXhpc3RcIixcIndoZWVsXCIsXCJ0cmFuc2l0XCIsXCJzdXBwbGllcnNcIixcInNhbHRcIixcImNvbXBhY3RcIixcInBvZXRyeVwiLFwibGlnaHRzXCIsXCJ0cmFja2luZ1wiLFwiYW5nZWxcIixcImJlbGxcIixcImtlZXBpbmdcIixcInByZXBhcmF0aW9uXCIsXCJhdHRlbXB0XCIsXCJyZWNlaXZpbmdcIixcIm1hdGNoZXNcIixcImFjY29yZGFuY2VcIixcIndpZHRoXCIsXCJub2lzZVwiLFwiZW5naW5lc1wiLFwiZm9yZ2V0XCIsXCJhcnJheVwiLFwiZGlzY3Vzc2VkXCIsXCJhY2N1cmF0ZVwiLFwic3RlcGhlblwiLFwiZWxpemFiZXRoXCIsXCJjbGltYXRlXCIsXCJyZXNlcnZhdGlvbnNcIixcInBpblwiLFwicGxheXN0YXRpb25cIixcImFsY29ob2xcIixcImdyZWVrXCIsXCJpbnN0cnVjdGlvblwiLFwibWFuYWdpbmdcIixcImFubm90YXRpb25cIixcInNpc3RlclwiLFwicmF3XCIsXCJkaWZmZXJlbmNlc1wiLFwid2Fsa2luZ1wiLFwiZXhwbGFpblwiLFwic21hbGxlclwiLFwibmV3ZXN0XCIsXCJlc3RhYmxpc2hcIixcImdudVwiLFwiaGFwcGVuZWRcIixcImV4cHJlc3NlZFwiLFwiamVmZlwiLFwiZXh0ZW50XCIsXCJzaGFycFwiLFwibGVzYmlhbnNcIixcImJlblwiLFwibGFuZVwiLFwicGFyYWdyYXBoXCIsXCJraWxsXCIsXCJtYXRoZW1hdGljc1wiLFwiYW9sXCIsXCJjb21wZW5zYXRpb25cIixcImNlXCIsXCJleHBvcnRcIixcIm1hbmFnZXJzXCIsXCJhaXJjcmFmdFwiLFwibW9kdWxlc1wiLFwic3dlZGVuXCIsXCJjb25mbGljdFwiLFwiY29uZHVjdGVkXCIsXCJ2ZXJzaW9uc1wiLFwiZW1wbG95ZXJcIixcIm9jY3VyXCIsXCJwZXJjZW50YWdlXCIsXCJrbm93c1wiLFwibWlzc2lzc2lwcGlcIixcImRlc2NyaWJlXCIsXCJjb25jZXJuXCIsXCJiYWNrdXBcIixcInJlcXVlc3RlZFwiLFwiY2l0aXplbnNcIixcImNvbm5lY3RpY3V0XCIsXCJoZXJpdGFnZVwiLFwicGVyc29uYWxzXCIsXCJpbW1lZGlhdGVcIixcImhvbGRpbmdcIixcInRyb3VibGVcIixcInNwcmVhZFwiLFwiY29hY2hcIixcImtldmluXCIsXCJhZ3JpY3VsdHVyYWxcIixcImV4cGFuZFwiLFwic3VwcG9ydGluZ1wiLFwiYXVkaWVuY2VcIixcImFzc2lnbmVkXCIsXCJqb3JkYW5cIixcImNvbGxlY3Rpb25zXCIsXCJhZ2VzXCIsXCJwYXJ0aWNpcGF0ZVwiLFwicGx1Z1wiLFwic3BlY2lhbGlzdFwiLFwiY29va1wiLFwiYWZmZWN0XCIsXCJ2aXJnaW5cIixcImV4cGVyaWVuY2VkXCIsXCJpbnZlc3RpZ2F0aW9uXCIsXCJyYWlzZWRcIixcImhhdFwiLFwiaW5zdGl0dXRpb25cIixcImRpcmVjdGVkXCIsXCJkZWFsZXJzXCIsXCJzZWFyY2hpbmdcIixcInNwb3J0aW5nXCIsXCJoZWxwaW5nXCIsXCJwZXJsXCIsXCJhZmZlY3RlZFwiLFwibGliXCIsXCJiaWtlXCIsXCJ0b3RhbGx5XCIsXCJwbGF0ZVwiLFwiZXhwZW5zZXNcIixcImluZGljYXRlXCIsXCJibG9uZGVcIixcImFiXCIsXCJwcm9jZWVkaW5nc1wiLFwiZmF2b3VyaXRlXCIsXCJ0cmFuc21pc3Npb25cIixcImFuZGVyc29uXCIsXCJ1dGNcIixcImNoYXJhY3RlcmlzdGljc1wiLFwiZGVyXCIsXCJsb3NlXCIsXCJvcmdhbmljXCIsXCJzZWVrXCIsXCJleHBlcmllbmNlc1wiLFwiYWxidW1zXCIsXCJjaGVhdHNcIixcImV4dHJlbWVseVwiLFwidmVyemVpY2huaXNcIixcImNvbnRyYWN0c1wiLFwiZ3Vlc3RzXCIsXCJob3N0ZWRcIixcImRpc2Vhc2VzXCIsXCJjb25jZXJuaW5nXCIsXCJkZXZlbG9wZXJzXCIsXCJlcXVpdmFsZW50XCIsXCJjaGVtaXN0cnlcIixcInRvbnlcIixcIm5laWdoYm9yaG9vZFwiLFwibmV2YWRhXCIsXCJraXRzXCIsXCJ0aGFpbGFuZFwiLFwidmFyaWFibGVzXCIsXCJhZ2VuZGFcIixcImFueXdheVwiLFwiY29udGludWVzXCIsXCJ0cmFja3NcIixcImFkdmlzb3J5XCIsXCJjYW1cIixcImN1cnJpY3VsdW1cIixcImxvZ2ljXCIsXCJ0ZW1wbGF0ZVwiLFwicHJpbmNlXCIsXCJjaXJjbGVcIixcInNvaWxcIixcImdyYW50c1wiLFwiYW55d2hlcmVcIixcInBzeWNob2xvZ3lcIixcInJlc3BvbnNlc1wiLFwiYXRsYW50aWNcIixcIndldFwiLFwiY2lyY3Vtc3RhbmNlc1wiLFwiZWR3YXJkXCIsXCJpbnZlc3RvclwiLFwiaWRlbnRpZmljYXRpb25cIixcInJhbVwiLFwibGVhdmluZ1wiLFwid2lsZGxpZmVcIixcImFwcGxpYW5jZXNcIixcIm1hdHRcIixcImVsZW1lbnRhcnlcIixcImNvb2tpbmdcIixcInNwZWFraW5nXCIsXCJzcG9uc29yc1wiLFwiZm94XCIsXCJ1bmxpbWl0ZWRcIixcInJlc3BvbmRcIixcInNpemVzXCIsXCJwbGFpblwiLFwiZXhpdFwiLFwiZW50ZXJlZFwiLFwiaXJhblwiLFwiYXJtXCIsXCJrZXlzXCIsXCJsYXVuY2hcIixcIndhdmVcIixcImNoZWNraW5nXCIsXCJjb3N0YVwiLFwiYmVsZ2l1bVwiLFwicHJpbnRhYmxlXCIsXCJob2x5XCIsXCJhY3RzXCIsXCJndWlkYW5jZVwiLFwibWVzaFwiLFwidHJhaWxcIixcImVuZm9yY2VtZW50XCIsXCJzeW1ib2xcIixcImNyYWZ0c1wiLFwiaGlnaHdheVwiLFwiYnVkZHlcIixcImhhcmRjb3ZlclwiLFwib2JzZXJ2ZWRcIixcImRlYW5cIixcInNldHVwXCIsXCJwb2xsXCIsXCJib29raW5nXCIsXCJnbG9zc2FyeVwiLFwiZmlzY2FsXCIsXCJjZWxlYnJpdHlcIixcInN0eWxlc1wiLFwiZGVudmVyXCIsXCJ1bml4XCIsXCJmaWxsZWRcIixcImJvbmRcIixcImNoYW5uZWxzXCIsXCJlcmljc3NvblwiLFwiYXBwZW5kaXhcIixcIm5vdGlmeVwiLFwiYmx1ZXNcIixcImNob2NvbGF0ZVwiLFwicHViXCIsXCJwb3J0aW9uXCIsXCJzY29wZVwiLFwiaGFtcHNoaXJlXCIsXCJzdXBwbGllclwiLFwiY2FibGVzXCIsXCJjb3R0b25cIixcImJsdWV0b290aFwiLFwiY29udHJvbGxlZFwiLFwicmVxdWlyZW1lbnRcIixcImF1dGhvcml0aWVzXCIsXCJiaW9sb2d5XCIsXCJkZW50YWxcIixcImtpbGxlZFwiLFwiYm9yZGVyXCIsXCJhbmNpZW50XCIsXCJkZWJhdGVcIixcInJlcHJlc2VudGF0aXZlc1wiLFwic3RhcnRzXCIsXCJwcmVnbmFuY3lcIixcImNhdXNlc1wiLFwiYXJrYW5zYXNcIixcImJpb2dyYXBoeVwiLFwibGVpc3VyZVwiLFwiYXR0cmFjdGlvbnNcIixcImxlYXJuZWRcIixcInRyYW5zYWN0aW9uc1wiLFwibm90ZWJvb2tcIixcImV4cGxvcmVyXCIsXCJoaXN0b3JpY1wiLFwiYXR0YWNoZWRcIixcIm9wZW5lZFwiLFwidG1cIixcImh1c2JhbmRcIixcImRpc2FibGVkXCIsXCJhdXRob3JpemVkXCIsXCJjcmF6eVwiLFwidXBjb21pbmdcIixcImJyaXRhaW5cIixcImNvbmNlcnRcIixcInJldGlyZW1lbnRcIixcInNjb3Jlc1wiLFwiZmluYW5jaW5nXCIsXCJlZmZpY2llbmN5XCIsXCJzcFwiLFwiY29tZWR5XCIsXCJhZG9wdGVkXCIsXCJlZmZpY2llbnRcIixcIndlYmxvZ1wiLFwibGluZWFyXCIsXCJjb21taXRtZW50XCIsXCJzcGVjaWFsdHlcIixcImJlYXJzXCIsXCJqZWFuXCIsXCJob3BcIixcImNhcnJpZXJcIixcImVkaXRlZFwiLFwiY29uc3RhbnRcIixcInZpc2FcIixcIm1vdXRoXCIsXCJqZXdpc2hcIixcIm1ldGVyXCIsXCJsaW5rZWRcIixcInBvcnRsYW5kXCIsXCJpbnRlcnZpZXdzXCIsXCJjb25jZXB0c1wiLFwibmhcIixcImd1blwiLFwicmVmbGVjdFwiLFwicHVyZVwiLFwiZGVsaXZlclwiLFwid29uZGVyXCIsXCJsZXNzb25zXCIsXCJmcnVpdFwiLFwiYmVnaW5zXCIsXCJxdWFsaWZpZWRcIixcInJlZm9ybVwiLFwibGVuc1wiLFwiYWxlcnRzXCIsXCJ0cmVhdGVkXCIsXCJkaXNjb3ZlcnlcIixcImRyYXdcIixcIm15c3FsXCIsXCJjbGFzc2lmaWVkXCIsXCJyZWxhdGluZ1wiLFwiYXNzdW1lXCIsXCJjb25maWRlbmNlXCIsXCJhbGxpYW5jZVwiLFwiZm1cIixcImNvbmZpcm1cIixcIndhcm1cIixcIm5laXRoZXJcIixcImxld2lzXCIsXCJob3dhcmRcIixcIm9mZmxpbmVcIixcImxlYXZlc1wiLFwiZW5naW5lZXJcIixcImxpZmVzdHlsZVwiLFwiY29uc2lzdGVudFwiLFwicmVwbGFjZVwiLFwiY2xlYXJhbmNlXCIsXCJjb25uZWN0aW9uc1wiLFwiaW52ZW50b3J5XCIsXCJjb252ZXJ0ZXJcIixcIm9yZ2FuaXNhdGlvblwiLFwiYmFiZVwiLFwiY2hlY2tzXCIsXCJyZWFjaGVkXCIsXCJiZWNvbWluZ1wiLFwic2FmYXJpXCIsXCJvYmplY3RpdmVcIixcImluZGljYXRlZFwiLFwic3VnYXJcIixcImNyZXdcIixcImxlZ3NcIixcInNhbVwiLFwic3RpY2tcIixcInNlY3VyaXRpZXNcIixcImFsbGVuXCIsXCJwZHRcIixcInJlbGF0aW9uXCIsXCJlbmFibGVkXCIsXCJnZW5yZVwiLFwic2xpZGVcIixcIm1vbnRhbmFcIixcInZvbHVudGVlclwiLFwidGVzdGVkXCIsXCJyZWFyXCIsXCJkZW1vY3JhdGljXCIsXCJlbmhhbmNlXCIsXCJzd2l0emVybGFuZFwiLFwiZXhhY3RcIixcImJvdW5kXCIsXCJwYXJhbWV0ZXJcIixcImFkYXB0ZXJcIixcInByb2Nlc3NvclwiLFwibm9kZVwiLFwiZm9ybWFsXCIsXCJkaW1lbnNpb25zXCIsXCJjb250cmlidXRlXCIsXCJsb2NrXCIsXCJob2NrZXlcIixcInN0b3JtXCIsXCJtaWNyb1wiLFwiY29sbGVnZXNcIixcImxhcHRvcHNcIixcIm1pbGVcIixcInNob3dlZFwiLFwiY2hhbGxlbmdlc1wiLFwiZWRpdG9yc1wiLFwibWVuc1wiLFwidGhyZWFkc1wiLFwiYm93bFwiLFwic3VwcmVtZVwiLFwiYnJvdGhlcnNcIixcInJlY29nbml0aW9uXCIsXCJwcmVzZW50c1wiLFwicmVmXCIsXCJ0YW5rXCIsXCJzdWJtaXNzaW9uXCIsXCJkb2xsc1wiLFwiZXN0aW1hdGVcIixcImVuY291cmFnZVwiLFwibmF2eVwiLFwia2lkXCIsXCJyZWd1bGF0b3J5XCIsXCJpbnNwZWN0aW9uXCIsXCJjb25zdW1lcnNcIixcImNhbmNlbFwiLFwibGltaXRzXCIsXCJ0ZXJyaXRvcnlcIixcInRyYW5zYWN0aW9uXCIsXCJtYW5jaGVzdGVyXCIsXCJ3ZWFwb25zXCIsXCJwYWludFwiLFwiZGVsYXlcIixcInBpbG90XCIsXCJvdXRsZXRcIixcImNvbnRyaWJ1dGlvbnNcIixcImNvbnRpbnVvdXNcIixcImRiXCIsXCJjemVjaFwiLFwicmVzdWx0aW5nXCIsXCJjYW1icmlkZ2VcIixcImluaXRpYXRpdmVcIixcIm5vdmVsXCIsXCJwYW5cIixcImV4ZWN1dGlvblwiLFwiZGlzYWJpbGl0eVwiLFwiaW5jcmVhc2VzXCIsXCJ1bHRyYVwiLFwid2lubmVyXCIsXCJpZGFob1wiLFwiY29udHJhY3RvclwiLFwicGhcIixcImVwaXNvZGVcIixcImV4YW1pbmF0aW9uXCIsXCJwb3R0ZXJcIixcImRpc2hcIixcInBsYXlzXCIsXCJidWxsZXRpblwiLFwiaWFcIixcInB0XCIsXCJpbmRpY2F0ZXNcIixcIm1vZGlmeVwiLFwib3hmb3JkXCIsXCJhZGFtXCIsXCJ0cnVseVwiLFwiZXBpbmlvbnNcIixcInBhaW50aW5nXCIsXCJjb21taXR0ZWRcIixcImV4dGVuc2l2ZVwiLFwiYWZmb3JkYWJsZVwiLFwidW5pdmVyc2VcIixcImNhbmRpZGF0ZVwiLFwiZGF0YWJhc2VzXCIsXCJwYXRlbnRcIixcInNsb3RcIixcInBzcFwiLFwib3V0c3RhbmRpbmdcIixcImhhXCIsXCJlYXRpbmdcIixcInBlcnNwZWN0aXZlXCIsXCJwbGFubmVkXCIsXCJ3YXRjaGluZ1wiLFwibG9kZ2VcIixcIm1lc3NlbmdlclwiLFwibWlycm9yXCIsXCJ0b3VybmFtZW50XCIsXCJjb25zaWRlcmF0aW9uXCIsXCJkc1wiLFwiZGlzY291bnRzXCIsXCJzdGVybGluZ1wiLFwic2Vzc2lvbnNcIixcImtlcm5lbFwiLFwic3RvY2tzXCIsXCJidXllcnNcIixcImpvdXJuYWxzXCIsXCJncmF5XCIsXCJjYXRhbG9ndWVcIixcImVhXCIsXCJqZW5uaWZlclwiLFwiYW50b25pb1wiLFwiY2hhcmdlZFwiLFwiYnJvYWRcIixcInRhaXdhblwiLFwidW5kXCIsXCJjaG9zZW5cIixcImRlbW9cIixcImdyZWVjZVwiLFwibGdcIixcInN3aXNzXCIsXCJzYXJhaFwiLFwiY2xhcmtcIixcImxhYm91clwiLFwiaGF0ZVwiLFwidGVybWluYWxcIixcInB1Ymxpc2hlcnNcIixcIm5pZ2h0c1wiLFwiYmVoYWxmXCIsXCJjYXJpYmJlYW5cIixcImxpcXVpZFwiLFwicmljZVwiLFwibmVicmFza2FcIixcImxvb3BcIixcInNhbGFyeVwiLFwicmVzZXJ2YXRpb25cIixcImZvb2RzXCIsXCJnb3VybWV0XCIsXCJndWFyZFwiLFwicHJvcGVybHlcIixcIm9ybGVhbnNcIixcInNhdmluZ1wiLFwibmZsXCIsXCJyZW1haW5pbmdcIixcImVtcGlyZVwiLFwicmVzdW1lXCIsXCJ0d2VudHlcIixcIm5ld2x5XCIsXCJyYWlzZVwiLFwicHJlcGFyZVwiLFwiYXZhdGFyXCIsXCJnYXJ5XCIsXCJkZXBlbmRpbmdcIixcImlsbGVnYWxcIixcImV4cGFuc2lvblwiLFwidmFyeVwiLFwiaHVuZHJlZHNcIixcInJvbWVcIixcImFyYWJcIixcImxpbmNvbG5cIixcImhlbHBlZFwiLFwicHJlbWllclwiLFwidG9tb3Jyb3dcIixcInB1cmNoYXNlZFwiLFwibWlsa1wiLFwiZGVjaWRlXCIsXCJjb25zZW50XCIsXCJkcmFtYVwiLFwidmlzaXRpbmdcIixcInBlcmZvcm1pbmdcIixcImRvd250b3duXCIsXCJrZXlib2FyZFwiLFwiY29udGVzdFwiLFwiY29sbGVjdGVkXCIsXCJud1wiLFwiYmFuZHNcIixcImJvb3RcIixcInN1aXRhYmxlXCIsXCJmZlwiLFwiYWJzb2x1dGVseVwiLFwibWlsbGlvbnNcIixcImx1bmNoXCIsXCJhdWRpdFwiLFwicHVzaFwiLFwiY2hhbWJlclwiLFwiZ3VpbmVhXCIsXCJmaW5kaW5nc1wiLFwibXVzY2xlXCIsXCJmZWF0dXJpbmdcIixcImlzb1wiLFwiaW1wbGVtZW50XCIsXCJjbGlja2luZ1wiLFwic2NoZWR1bGVkXCIsXCJwb2xsc1wiLFwidHlwaWNhbFwiLFwidG93ZXJcIixcInlvdXJzXCIsXCJzdW1cIixcIm1pc2NcIixcImNhbGN1bGF0b3JcIixcInNpZ25pZmljYW50bHlcIixcImNoaWNrZW5cIixcInRlbXBvcmFyeVwiLFwiYXR0ZW5kXCIsXCJzaG93ZXJcIixcImFsYW5cIixcInNlbmRpbmdcIixcImphc29uXCIsXCJ0b25pZ2h0XCIsXCJkZWFyXCIsXCJzdWZmaWNpZW50XCIsXCJob2xkZW1cIixcInNoZWxsXCIsXCJwcm92aW5jZVwiLFwiY2F0aG9saWNcIixcIm9ha1wiLFwidmF0XCIsXCJhd2FyZW5lc3NcIixcInZhbmNvdXZlclwiLFwiZ292ZXJub3JcIixcImJlZXJcIixcInNlZW1lZFwiLFwiY29udHJpYnV0aW9uXCIsXCJtZWFzdXJlbWVudFwiLFwic3dpbW1pbmdcIixcInNweXdhcmVcIixcImZvcm11bGFcIixcImNvbnN0aXR1dGlvblwiLFwicGFja2FnaW5nXCIsXCJzb2xhclwiLFwiam9zZVwiLFwiY2F0Y2hcIixcImphbmVcIixcInBha2lzdGFuXCIsXCJwc1wiLFwicmVsaWFibGVcIixcImNvbnN1bHRhdGlvblwiLFwibm9ydGh3ZXN0XCIsXCJzaXJcIixcImRvdWJ0XCIsXCJlYXJuXCIsXCJmaW5kZXJcIixcInVuYWJsZVwiLFwicGVyaW9kc1wiLFwiY2xhc3Nyb29tXCIsXCJ0YXNrc1wiLFwiZGVtb2NyYWN5XCIsXCJhdHRhY2tzXCIsXCJraW1cIixcIndhbGxwYXBlclwiLFwibWVyY2hhbmRpc2VcIixcImNvbnN0XCIsXCJyZXNpc3RhbmNlXCIsXCJkb29yc1wiLFwic3ltcHRvbXNcIixcInJlc29ydHNcIixcImJpZ2dlc3RcIixcIm1lbW9yaWFsXCIsXCJ2aXNpdG9yXCIsXCJ0d2luXCIsXCJmb3J0aFwiLFwiaW5zZXJ0XCIsXCJiYWx0aW1vcmVcIixcImdhdGV3YXlcIixcImt5XCIsXCJkb250XCIsXCJhbHVtbmlcIixcImRyYXdpbmdcIixcImNhbmRpZGF0ZXNcIixcImNoYXJsb3R0ZVwiLFwib3JkZXJlZFwiLFwiYmlvbG9naWNhbFwiLFwiZmlnaHRpbmdcIixcInRyYW5zaXRpb25cIixcImhhcHBlbnNcIixcInByZWZlcmVuY2VzXCIsXCJzcHlcIixcInJvbWFuY2VcIixcImluc3RydW1lbnRcIixcImJydWNlXCIsXCJzcGxpdFwiLFwidGhlbWVzXCIsXCJwb3dlcnNcIixcImhlYXZlblwiLFwiYnJcIixcImJpdHNcIixcInByZWduYW50XCIsXCJ0d2ljZVwiLFwiY2xhc3NpZmljYXRpb25cIixcImZvY3VzZWRcIixcImVneXB0XCIsXCJwaHlzaWNpYW5cIixcImhvbGx5d29vZFwiLFwiYmFyZ2FpblwiLFwid2lraXBlZGlhXCIsXCJjZWxsdWxhclwiLFwibm9yd2F5XCIsXCJ2ZXJtb250XCIsXCJhc2tpbmdcIixcImJsb2Nrc1wiLFwibm9ybWFsbHlcIixcImxvXCIsXCJzcGlyaXR1YWxcIixcImh1bnRpbmdcIixcImRpYWJldGVzXCIsXCJzdWl0XCIsXCJtbFwiLFwic2hpZnRcIixcImNoaXBcIixcInJlc1wiLFwic2l0XCIsXCJib2RpZXNcIixcInBob3RvZ3JhcGhzXCIsXCJjdXR0aW5nXCIsXCJ3b3dcIixcInNpbW9uXCIsXCJ3cml0ZXJzXCIsXCJtYXJrc1wiLFwiZmxleGlibGVcIixcImxvdmVkXCIsXCJmYXZvdXJpdGVzXCIsXCJtYXBwaW5nXCIsXCJudW1lcm91c1wiLFwicmVsYXRpdmVseVwiLFwiYmlyZHNcIixcInNhdGlzZmFjdGlvblwiLFwicmVwcmVzZW50c1wiLFwiY2hhclwiLFwiaW5kZXhlZFwiLFwicGl0dHNidXJnaFwiLFwic3VwZXJpb3JcIixcInByZWZlcnJlZFwiLFwic2F2ZWRcIixcInBheWluZ1wiLFwiY2FydG9vblwiLFwic2hvdHNcIixcImludGVsbGVjdHVhbFwiLFwibW9vcmVcIixcImdyYW50ZWRcIixcImNob2ljZXNcIixcImNhcmJvblwiLFwic3BlbmRpbmdcIixcImNvbWZvcnRhYmxlXCIsXCJtYWduZXRpY1wiLFwiaW50ZXJhY3Rpb25cIixcImxpc3RlbmluZ1wiLFwiZWZmZWN0aXZlbHlcIixcInJlZ2lzdHJ5XCIsXCJjcmlzaXNcIixcIm91dGxvb2tcIixcIm1hc3NpdmVcIixcImRlbm1hcmtcIixcImVtcGxveWVkXCIsXCJicmlnaHRcIixcInRyZWF0XCIsXCJoZWFkZXJcIixcImNzXCIsXCJwb3ZlcnR5XCIsXCJmb3JtZWRcIixcInBpYW5vXCIsXCJlY2hvXCIsXCJxdWVcIixcImdyaWRcIixcInNoZWV0c1wiLFwicGF0cmlja1wiLFwiZXhwZXJpbWVudGFsXCIsXCJwdWVydG9cIixcInJldm9sdXRpb25cIixcImNvbnNvbGlkYXRpb25cIixcImRpc3BsYXlzXCIsXCJwbGFzbWFcIixcImFsbG93aW5nXCIsXCJlYXJuaW5nc1wiLFwidm9pcFwiLFwibXlzdGVyeVwiLFwibGFuZHNjYXBlXCIsXCJkZXBlbmRlbnRcIixcIm1lY2hhbmljYWxcIixcImpvdXJuZXlcIixcImRlbGF3YXJlXCIsXCJiaWRkaW5nXCIsXCJjb25zdWx0YW50c1wiLFwicmlza3NcIixcImJhbm5lclwiLFwiYXBwbGljYW50XCIsXCJjaGFydGVyXCIsXCJmaWdcIixcImJhcmJhcmFcIixcImNvb3BlcmF0aW9uXCIsXCJjb3VudGllc1wiLFwiYWNxdWlzaXRpb25cIixcInBvcnRzXCIsXCJpbXBsZW1lbnRlZFwiLFwic2ZcIixcImRpcmVjdG9yaWVzXCIsXCJyZWNvZ25pemVkXCIsXCJkcmVhbXNcIixcImJsb2dnZXJcIixcIm5vdGlmaWNhdGlvblwiLFwia2dcIixcImxpY2Vuc2luZ1wiLFwic3RhbmRzXCIsXCJ0ZWFjaFwiLFwib2NjdXJyZWRcIixcInRleHRib29rc1wiLFwicmFwaWRcIixcInB1bGxcIixcImhhaXJ5XCIsXCJkaXZlcnNpdHlcIixcImNsZXZlbGFuZFwiLFwidXRcIixcInJldmVyc2VcIixcImRlcG9zaXRcIixcInNlbWluYXJcIixcImludmVzdG1lbnRzXCIsXCJsYXRpbmFcIixcIm5hc2FcIixcIndoZWVsc1wiLFwic2V4Y2FtXCIsXCJzcGVjaWZ5XCIsXCJhY2Nlc3NpYmlsaXR5XCIsXCJkdXRjaFwiLFwic2Vuc2l0aXZlXCIsXCJ0ZW1wbGF0ZXNcIixcImZvcm1hdHNcIixcInRhYlwiLFwiZGVwZW5kc1wiLFwiYm9vdHNcIixcImhvbGRzXCIsXCJyb3V0ZXJcIixcImNvbmNyZXRlXCIsXCJzaVwiLFwiZWRpdGluZ1wiLFwicG9sYW5kXCIsXCJmb2xkZXJcIixcIndvbWVuc1wiLFwiY3NzXCIsXCJjb21wbGV0aW9uXCIsXCJ1cGxvYWRcIixcInB1bHNlXCIsXCJ1bml2ZXJzaXRpZXNcIixcInRlY2huaXF1ZVwiLFwiY29udHJhY3RvcnNcIixcIm1pbGZodW50ZXJcIixcInZvdGluZ1wiLFwiY291cnRzXCIsXCJub3RpY2VzXCIsXCJzdWJzY3JpcHRpb25zXCIsXCJjYWxjdWxhdGVcIixcIm1jXCIsXCJkZXRyb2l0XCIsXCJhbGV4YW5kZXJcIixcImJyb2FkY2FzdFwiLFwiY29udmVydGVkXCIsXCJtZXRyb1wiLFwidG9zaGliYVwiLFwiYW5uaXZlcnNhcnlcIixcImltcHJvdmVtZW50c1wiLFwic3RyaXBcIixcInNwZWNpZmljYXRpb25cIixcInBlYXJsXCIsXCJhY2NpZGVudFwiLFwibmlja1wiLFwiYWNjZXNzaWJsZVwiLFwiYWNjZXNzb3J5XCIsXCJyZXNpZGVudFwiLFwicGxvdFwiLFwicXR5XCIsXCJwb3NzaWJseVwiLFwiYWlybGluZVwiLFwidHlwaWNhbGx5XCIsXCJyZXByZXNlbnRhdGlvblwiLFwicmVnYXJkXCIsXCJwdW1wXCIsXCJleGlzdHNcIixcImFycmFuZ2VtZW50c1wiLFwic21vb3RoXCIsXCJjb25mZXJlbmNlc1wiLFwidW5pcHJvdGtiXCIsXCJzdHJpa2VcIixcImNvbnN1bXB0aW9uXCIsXCJiaXJtaW5naGFtXCIsXCJmbGFzaGluZ1wiLFwibHBcIixcIm5hcnJvd1wiLFwiYWZ0ZXJub29uXCIsXCJ0aHJlYXRcIixcInN1cnZleXNcIixcInNpdHRpbmdcIixcInB1dHRpbmdcIixcImNvbnN1bHRhbnRcIixcImNvbnRyb2xsZXJcIixcIm93bmVyc2hpcFwiLFwiY29tbWl0dGVlc1wiLFwibGVnaXNsYXRpdmVcIixcInJlc2VhcmNoZXJzXCIsXCJ2aWV0bmFtXCIsXCJ0cmFpbGVyXCIsXCJhbm5lXCIsXCJjYXN0bGVcIixcImdhcmRlbnNcIixcIm1pc3NlZFwiLFwibWFsYXlzaWFcIixcInVuc3Vic2NyaWJlXCIsXCJhbnRpcXVlXCIsXCJsYWJlbHNcIixcIndpbGxpbmdcIixcImJpb1wiLFwibW9sZWN1bGFyXCIsXCJhY3RpbmdcIixcImhlYWRzXCIsXCJzdG9yZWRcIixcImV4YW1cIixcImxvZ29zXCIsXCJyZXNpZGVuY2VcIixcImF0dG9ybmV5c1wiLFwibWlsZnNcIixcImFudGlxdWVzXCIsXCJkZW5zaXR5XCIsXCJodW5kcmVkXCIsXCJyeWFuXCIsXCJvcGVyYXRvcnNcIixcInN0cmFuZ2VcIixcInN1c3RhaW5hYmxlXCIsXCJwaGlsaXBwaW5lc1wiLFwic3RhdGlzdGljYWxcIixcImJlZHNcIixcIm1lbnRpb25cIixcImlubm92YXRpb25cIixcInBjc1wiLFwiZW1wbG95ZXJzXCIsXCJncmV5XCIsXCJwYXJhbGxlbFwiLFwiaG9uZGFcIixcImFtZW5kZWRcIixcIm9wZXJhdGVcIixcImJpbGxzXCIsXCJib2xkXCIsXCJiYXRocm9vbVwiLFwic3RhYmxlXCIsXCJvcGVyYVwiLFwiZGVmaW5pdGlvbnNcIixcInZvblwiLFwiZG9jdG9yc1wiLFwibGVzc29uXCIsXCJjaW5lbWFcIixcImFzc2V0XCIsXCJhZ1wiLFwic2NhblwiLFwiZWxlY3Rpb25zXCIsXCJkcmlua2luZ1wiLFwicmVhY3Rpb25cIixcImJsYW5rXCIsXCJlbmhhbmNlZFwiLFwiZW50aXRsZWRcIixcInNldmVyZVwiLFwiZ2VuZXJhdGVcIixcInN0YWlubGVzc1wiLFwibmV3c3BhcGVyc1wiLFwiaG9zcGl0YWxzXCIsXCJ2aVwiLFwiZGVsdXhlXCIsXCJodW1vclwiLFwiYWdlZFwiLFwibW9uaXRvcnNcIixcImV4Y2VwdGlvblwiLFwibGl2ZWRcIixcImR1cmF0aW9uXCIsXCJidWxrXCIsXCJzdWNjZXNzZnVsbHlcIixcImluZG9uZXNpYVwiLFwicHVyc3VhbnRcIixcInNjaVwiLFwiZmFicmljXCIsXCJlZHRcIixcInZpc2l0c1wiLFwicHJpbWFyaWx5XCIsXCJ0aWdodFwiLFwiZG9tYWluc1wiLFwiY2FwYWJpbGl0aWVzXCIsXCJwbWlkXCIsXCJjb250cmFzdFwiLFwicmVjb21tZW5kYXRpb25cIixcImZseWluZ1wiLFwicmVjcnVpdG1lbnRcIixcInNpblwiLFwiYmVybGluXCIsXCJjdXRlXCIsXCJvcmdhbml6ZWRcIixcImJhXCIsXCJwYXJhXCIsXCJzaWVtZW5zXCIsXCJhZG9wdGlvblwiLFwiaW1wcm92aW5nXCIsXCJjclwiLFwiZXhwZW5zaXZlXCIsXCJtZWFudFwiLFwiY2FwdHVyZVwiLFwicG91bmRzXCIsXCJidWZmYWxvXCIsXCJvcmdhbmlzYXRpb25zXCIsXCJwbGFuZVwiLFwicGdcIixcImV4cGxhaW5lZFwiLFwic2VlZFwiLFwicHJvZ3JhbW1lc1wiLFwiZGVzaXJlXCIsXCJleHBlcnRpc2VcIixcIm1lY2hhbmlzbVwiLFwiY2FtcGluZ1wiLFwiZWVcIixcImpld2VsbGVyeVwiLFwibWVldHNcIixcIndlbGZhcmVcIixcInBlZXJcIixcImNhdWdodFwiLFwiZXZlbnR1YWxseVwiLFwibWFya2VkXCIsXCJkcml2ZW5cIixcIm1lYXN1cmVkXCIsXCJtZWRsaW5lXCIsXCJib3R0bGVcIixcImFncmVlbWVudHNcIixcImNvbnNpZGVyaW5nXCIsXCJpbm5vdmF0aXZlXCIsXCJtYXJzaGFsbFwiLFwibWFzc2FnZVwiLFwicnViYmVyXCIsXCJjb25jbHVzaW9uXCIsXCJjbG9zaW5nXCIsXCJ0YW1wYVwiLFwidGhvdXNhbmRcIixcIm1lYXRcIixcImxlZ2VuZFwiLFwiZ3JhY2VcIixcInN1c2FuXCIsXCJpbmdcIixcImtzXCIsXCJhZGFtc1wiLFwicHl0aG9uXCIsXCJtb25zdGVyXCIsXCJhbGV4XCIsXCJiYW5nXCIsXCJ2aWxsYVwiLFwiYm9uZVwiLFwiY29sdW1uc1wiLFwiZGlzb3JkZXJzXCIsXCJidWdzXCIsXCJjb2xsYWJvcmF0aW9uXCIsXCJoYW1pbHRvblwiLFwiZGV0ZWN0aW9uXCIsXCJmdHBcIixcImNvb2tpZXNcIixcImlubmVyXCIsXCJmb3JtYXRpb25cIixcInR1dG9yaWFsXCIsXCJtZWRcIixcImVuZ2luZWVyc1wiLFwiZW50aXR5XCIsXCJjcnVpc2VzXCIsXCJnYXRlXCIsXCJob2xkZXJcIixcInByb3Bvc2Fsc1wiLFwibW9kZXJhdG9yXCIsXCJzd1wiLFwidHV0b3JpYWxzXCIsXCJzZXR0bGVtZW50XCIsXCJwb3J0dWdhbFwiLFwibGF3cmVuY2VcIixcInJvbWFuXCIsXCJkdXRpZXNcIixcInZhbHVhYmxlXCIsXCJ0b25lXCIsXCJjb2xsZWN0YWJsZXNcIixcImV0aGljc1wiLFwiZm9yZXZlclwiLFwiZHJhZ29uXCIsXCJidXN5XCIsXCJjYXB0YWluXCIsXCJmYW50YXN0aWNcIixcImltYWdpbmVcIixcImJyaW5nc1wiLFwiaGVhdGluZ1wiLFwibGVnXCIsXCJuZWNrXCIsXCJoZFwiLFwid2luZ1wiLFwiZ292ZXJubWVudHNcIixcInB1cmNoYXNpbmdcIixcInNjcmlwdHNcIixcImFiY1wiLFwic3RlcmVvXCIsXCJhcHBvaW50ZWRcIixcInRhc3RlXCIsXCJkZWFsaW5nXCIsXCJjb21taXRcIixcInRpbnlcIixcIm9wZXJhdGlvbmFsXCIsXCJyYWlsXCIsXCJhaXJsaW5lc1wiLFwibGliZXJhbFwiLFwibGl2ZWNhbVwiLFwiamF5XCIsXCJ0cmlwc1wiLFwiZ2FwXCIsXCJzaWRlc1wiLFwidHViZVwiLFwidHVybnNcIixcImNvcnJlc3BvbmRpbmdcIixcImRlc2NyaXB0aW9uc1wiLFwiY2FjaGVcIixcImJlbHRcIixcImphY2tldFwiLFwiZGV0ZXJtaW5hdGlvblwiLFwiYW5pbWF0aW9uXCIsXCJvcmFjbGVcIixcImVyXCIsXCJtYXR0aGV3XCIsXCJsZWFzZVwiLFwicHJvZHVjdGlvbnNcIixcImF2aWF0aW9uXCIsXCJob2JiaWVzXCIsXCJwcm91ZFwiLFwiZXhjZXNzXCIsXCJkaXNhc3RlclwiLFwiY29uc29sZVwiLFwiY29tbWFuZHNcIixcImpyXCIsXCJ0ZWxlY29tbXVuaWNhdGlvbnNcIixcImluc3RydWN0b3JcIixcImdpYW50XCIsXCJhY2hpZXZlZFwiLFwiaW5qdXJpZXNcIixcInNoaXBwZWRcIixcInNlYXRzXCIsXCJhcHByb2FjaGVzXCIsXCJiaXpcIixcImFsYXJtXCIsXCJ2b2x0YWdlXCIsXCJhbnRob255XCIsXCJuaW50ZW5kb1wiLFwidXN1YWxcIixcImxvYWRpbmdcIixcInN0YW1wc1wiLFwiYXBwZWFyZWRcIixcImZyYW5rbGluXCIsXCJhbmdsZVwiLFwicm9iXCIsXCJ2aW55bFwiLFwiaGlnaGxpZ2h0c1wiLFwibWluaW5nXCIsXCJkZXNpZ25lcnNcIixcIm1lbGJvdXJuZVwiLFwib25nb2luZ1wiLFwid29yc3RcIixcImltYWdpbmdcIixcImJldHRpbmdcIixcInNjaWVudGlzdHNcIixcImxpYmVydHlcIixcInd5b21pbmdcIixcImJsYWNramFja1wiLFwiYXJnZW50aW5hXCIsXCJlcmFcIixcImNvbnZlcnRcIixcInBvc3NpYmlsaXR5XCIsXCJhbmFseXN0XCIsXCJjb21taXNzaW9uZXJcIixcImRhbmdlcm91c1wiLFwiZ2FyYWdlXCIsXCJleGNpdGluZ1wiLFwicmVsaWFiaWxpdHlcIixcInRob25nc1wiLFwiZ2NjXCIsXCJ1bmZvcnR1bmF0ZWx5XCIsXCJyZXNwZWN0aXZlbHlcIixcInZvbHVudGVlcnNcIixcImF0dGFjaG1lbnRcIixcInJpbmd0b25lXCIsXCJmaW5sYW5kXCIsXCJtb3JnYW5cIixcImRlcml2ZWRcIixcInBsZWFzdXJlXCIsXCJob25vclwiLFwiYXNwXCIsXCJvcmllbnRlZFwiLFwiZWFnbGVcIixcImRlc2t0b3BzXCIsXCJwYW50c1wiLFwiY29sdW1idXNcIixcIm51cnNlXCIsXCJwcmF5ZXJcIixcImFwcG9pbnRtZW50XCIsXCJ3b3Jrc2hvcHNcIixcImh1cnJpY2FuZVwiLFwicXVpZXRcIixcImx1Y2tcIixcInBvc3RhZ2VcIixcInByb2R1Y2VyXCIsXCJyZXByZXNlbnRlZFwiLFwibW9ydGdhZ2VzXCIsXCJkaWFsXCIsXCJyZXNwb25zaWJpbGl0aWVzXCIsXCJjaGVlc2VcIixcImNvbWljXCIsXCJjYXJlZnVsbHlcIixcImpldFwiLFwicHJvZHVjdGl2aXR5XCIsXCJpbnZlc3RvcnNcIixcImNyb3duXCIsXCJwYXJcIixcInVuZGVyZ3JvdW5kXCIsXCJkaWFnbm9zaXNcIixcIm1ha2VyXCIsXCJjcmFja1wiLFwicHJpbmNpcGxlXCIsXCJwaWNrc1wiLFwidmFjYXRpb25zXCIsXCJnYW5nXCIsXCJzZW1lc3RlclwiLFwiY2FsY3VsYXRlZFwiLFwiZmV0aXNoXCIsXCJhcHBsaWVzXCIsXCJjYXNpbm9zXCIsXCJhcHBlYXJhbmNlXCIsXCJzbW9rZVwiLFwiYXBhY2hlXCIsXCJmaWx0ZXJzXCIsXCJpbmNvcnBvcmF0ZWRcIixcIm52XCIsXCJjcmFmdFwiLFwiY2FrZVwiLFwibm90ZWJvb2tzXCIsXCJhcGFydFwiLFwiZmVsbG93XCIsXCJibGluZFwiLFwibG91bmdlXCIsXCJtYWRcIixcImFsZ29yaXRobVwiLFwic2VtaVwiLFwiY29pbnNcIixcImFuZHlcIixcImdyb3NzXCIsXCJzdHJvbmdseVwiLFwiY2FmZVwiLFwidmFsZW50aW5lXCIsXCJoaWx0b25cIixcImtlblwiLFwicHJvdGVpbnNcIixcImhvcnJvclwiLFwic3VcIixcImV4cFwiLFwiZmFtaWxpYXJcIixcImNhcGFibGVcIixcImRvdWdsYXNcIixcImRlYmlhblwiLFwidGlsbFwiLFwiaW52b2x2aW5nXCIsXCJwZW5cIixcImludmVzdGluZ1wiLFwiY2hyaXN0b3BoZXJcIixcImFkbWlzc2lvblwiLFwiZXBzb25cIixcInNob2VcIixcImVsZWN0ZWRcIixcImNhcnJ5aW5nXCIsXCJ2aWN0b3J5XCIsXCJzYW5kXCIsXCJtYWRpc29uXCIsXCJ0ZXJyb3Jpc21cIixcImpveVwiLFwiZWRpdGlvbnNcIixcImNwdVwiLFwibWFpbmx5XCIsXCJldGhuaWNcIixcInJhblwiLFwicGFybGlhbWVudFwiLFwiYWN0b3JcIixcImZpbmRzXCIsXCJzZWFsXCIsXCJzaXR1YXRpb25zXCIsXCJmaWZ0aFwiLFwiYWxsb2NhdGVkXCIsXCJjaXRpemVuXCIsXCJ2ZXJ0aWNhbFwiLFwiY29ycmVjdGlvbnNcIixcInN0cnVjdHVyYWxcIixcIm11bmljaXBhbFwiLFwiZGVzY3JpYmVzXCIsXCJwcml6ZVwiLFwic3JcIixcIm9jY3Vyc1wiLFwiam9uXCIsXCJhYnNvbHV0ZVwiLFwiZGlzYWJpbGl0aWVzXCIsXCJjb25zaXN0c1wiLFwiYW55dGltZVwiLFwic3Vic3RhbmNlXCIsXCJwcm9oaWJpdGVkXCIsXCJhZGRyZXNzZWRcIixcImxpZXNcIixcInBpcGVcIixcInNvbGRpZXJzXCIsXCJuclwiLFwiZ3VhcmRpYW5cIixcImxlY3R1cmVcIixcInNpbXVsYXRpb25cIixcImxheW91dFwiLFwiaW5pdGlhdGl2ZXNcIixcImlsbFwiLFwiY29uY2VudHJhdGlvblwiLFwiY2xhc3NpY3NcIixcImxic1wiLFwibGF5XCIsXCJpbnRlcnByZXRhdGlvblwiLFwiaG9yc2VzXCIsXCJsb2xcIixcImRpcnR5XCIsXCJkZWNrXCIsXCJ3YXluZVwiLFwiZG9uYXRlXCIsXCJ0YXVnaHRcIixcImJhbmtydXB0Y3lcIixcIm1wXCIsXCJ3b3JrZXJcIixcIm9wdGltaXphdGlvblwiLFwiYWxpdmVcIixcInRlbXBsZVwiLFwic3Vic3RhbmNlc1wiLFwicHJvdmVcIixcImRpc2NvdmVyZWRcIixcIndpbmdzXCIsXCJicmVha3NcIixcImdlbmV0aWNcIixcInJlc3RyaWN0aW9uc1wiLFwicGFydGljaXBhdGluZ1wiLFwid2F0ZXJzXCIsXCJwcm9taXNlXCIsXCJ0aGluXCIsXCJleGhpYml0aW9uXCIsXCJwcmVmZXJcIixcInJpZGdlXCIsXCJjYWJpbmV0XCIsXCJtb2RlbVwiLFwiaGFycmlzXCIsXCJtcGhcIixcImJyaW5naW5nXCIsXCJzaWNrXCIsXCJkb3NlXCIsXCJldmFsdWF0ZVwiLFwidGlmZmFueVwiLFwidHJvcGljYWxcIixcImNvbGxlY3RcIixcImJldFwiLFwiY29tcG9zaXRpb25cIixcInRveW90YVwiLFwic3RyZWV0c1wiLFwibmF0aW9ud2lkZVwiLFwidmVjdG9yXCIsXCJkZWZpbml0ZWx5XCIsXCJzaGF2ZWRcIixcInR1cm5pbmdcIixcImJ1ZmZlclwiLFwicHVycGxlXCIsXCJleGlzdGVuY2VcIixcImNvbW1lbnRhcnlcIixcImxhcnJ5XCIsXCJsaW1vdXNpbmVzXCIsXCJkZXZlbG9wbWVudHNcIixcImRlZlwiLFwiaW1taWdyYXRpb25cIixcImRlc3RpbmF0aW9uc1wiLFwibGV0c1wiLFwibXV0dWFsXCIsXCJwaXBlbGluZVwiLFwibmVjZXNzYXJpbHlcIixcInN5bnRheFwiLFwibGlcIixcImF0dHJpYnV0ZVwiLFwicHJpc29uXCIsXCJza2lsbFwiLFwiY2hhaXJzXCIsXCJubFwiLFwiZXZlcnlkYXlcIixcImFwcGFyZW50bHlcIixcInN1cnJvdW5kaW5nXCIsXCJtb3VudGFpbnNcIixcIm1vdmVzXCIsXCJwb3B1bGFyaXR5XCIsXCJpbnF1aXJ5XCIsXCJldGhlcm5ldFwiLFwiY2hlY2tlZFwiLFwiZXhoaWJpdFwiLFwidGhyb3dcIixcInRyZW5kXCIsXCJzaWVycmFcIixcInZpc2libGVcIixcImNhdHNcIixcImRlc2VydFwiLFwicG9zdHBvc3RlZFwiLFwieWFcIixcIm9sZGVzdFwiLFwicmhvZGVcIixcIm5iYVwiLFwiY29vcmRpbmF0b3JcIixcIm9idmlvdXNseVwiLFwibWVyY3VyeVwiLFwic3RldmVuXCIsXCJoYW5kYm9va1wiLFwiZ3JlZ1wiLFwibmF2aWdhdGVcIixcIndvcnNlXCIsXCJzdW1taXRcIixcInZpY3RpbXNcIixcImVwYVwiLFwic3BhY2VzXCIsXCJmdW5kYW1lbnRhbFwiLFwiYnVybmluZ1wiLFwiZXNjYXBlXCIsXCJjb3Vwb25zXCIsXCJzb21ld2hhdFwiLFwicmVjZWl2ZXJcIixcInN1YnN0YW50aWFsXCIsXCJ0clwiLFwicHJvZ3Jlc3NpdmVcIixcImNpYWxpc1wiLFwiYmJcIixcImJvYXRzXCIsXCJnbGFuY2VcIixcInNjb3R0aXNoXCIsXCJjaGFtcGlvbnNoaXBcIixcImFyY2FkZVwiLFwicmljaG1vbmRcIixcInNhY3JhbWVudG9cIixcImltcG9zc2libGVcIixcInJvblwiLFwicnVzc2VsbFwiLFwidGVsbHNcIixcIm9idmlvdXNcIixcImZpYmVyXCIsXCJkZXByZXNzaW9uXCIsXCJncmFwaFwiLFwiY292ZXJpbmdcIixcInBsYXRpbnVtXCIsXCJqdWRnbWVudFwiLFwiYmVkcm9vbXNcIixcInRhbGtzXCIsXCJmaWxpbmdcIixcImZvc3RlclwiLFwibW9kZWxpbmdcIixcInBhc3NpbmdcIixcImF3YXJkZWRcIixcInRlc3RpbW9uaWFsc1wiLFwidHJpYWxzXCIsXCJ0aXNzdWVcIixcIm56XCIsXCJtZW1vcmFiaWxpYVwiLFwiY2xpbnRvblwiLFwibWFzdGVyc1wiLFwiYm9uZHNcIixcImNhcnRyaWRnZVwiLFwiYWxiZXJ0YVwiLFwiZXhwbGFuYXRpb25cIixcImZvbGtcIixcIm9yZ1wiLFwiY29tbW9uc1wiLFwiY2luY2lubmF0aVwiLFwic3Vic2VjdGlvblwiLFwiZnJhdWRcIixcImVsZWN0cmljaXR5XCIsXCJwZXJtaXR0ZWRcIixcInNwZWN0cnVtXCIsXCJhcnJpdmFsXCIsXCJva2F5XCIsXCJwb3R0ZXJ5XCIsXCJlbXBoYXNpc1wiLFwicm9nZXJcIixcImFzcGVjdFwiLFwid29ya3BsYWNlXCIsXCJhd2Vzb21lXCIsXCJtZXhpY2FuXCIsXCJjb25maXJtZWRcIixcImNvdW50c1wiLFwicHJpY2VkXCIsXCJ3YWxscGFwZXJzXCIsXCJoaXN0XCIsXCJjcmFzaFwiLFwibGlmdFwiLFwiZGVzaXJlZFwiLFwiaW50ZXJcIixcImNsb3NlclwiLFwiYXNzdW1lc1wiLFwiaGVpZ2h0c1wiLFwic2hhZG93XCIsXCJyaWRpbmdcIixcImluZmVjdGlvblwiLFwiZmlyZWZveFwiLFwibGlzYVwiLFwiZXhwZW5zZVwiLFwiZ3JvdmVcIixcImVsaWdpYmlsaXR5XCIsXCJ2ZW50dXJlXCIsXCJjbGluaWNcIixcImtvcmVhblwiLFwiaGVhbGluZ1wiLFwicHJpbmNlc3NcIixcIm1hbGxcIixcImVudGVyaW5nXCIsXCJwYWNrZXRcIixcInNwcmF5XCIsXCJzdHVkaW9zXCIsXCJpbnZvbHZlbWVudFwiLFwiZGFkXCIsXCJidXR0b25zXCIsXCJwbGFjZW1lbnRcIixcIm9ic2VydmF0aW9uc1wiLFwidmJ1bGxldGluXCIsXCJmdW5kZWRcIixcInRob21wc29uXCIsXCJ3aW5uZXJzXCIsXCJleHRlbmRcIixcInJvYWRzXCIsXCJzdWJzZXF1ZW50XCIsXCJwYXRcIixcImR1YmxpblwiLFwicm9sbGluZ1wiLFwiZmVsbFwiLFwibW90b3JjeWNsZVwiLFwieWFyZFwiLFwiZGlzY2xvc3VyZVwiLFwiZXN0YWJsaXNobWVudFwiLFwibWVtb3JpZXNcIixcIm5lbHNvblwiLFwidGVcIixcImFycml2ZWRcIixcImNyZWF0ZXNcIixcImZhY2VzXCIsXCJ0b3VyaXN0XCIsXCJhdlwiLFwibWF5b3JcIixcIm11cmRlclwiLFwic2VhblwiLFwiYWRlcXVhdGVcIixcInNlbmF0b3JcIixcInlpZWxkXCIsXCJwcmVzZW50YXRpb25zXCIsXCJncmFkZXNcIixcImNhcnRvb25zXCIsXCJwb3VyXCIsXCJkaWdlc3RcIixcInJlZ1wiLFwibG9kZ2luZ1wiLFwidGlvblwiLFwiZHVzdFwiLFwiaGVuY2VcIixcIndpa2lcIixcImVudGlyZWx5XCIsXCJyZXBsYWNlZFwiLFwicmFkYXJcIixcInJlc2N1ZVwiLFwidW5kZXJncmFkdWF0ZVwiLFwibG9zc2VzXCIsXCJjb21iYXRcIixcInJlZHVjaW5nXCIsXCJzdG9wcGVkXCIsXCJvY2N1cGF0aW9uXCIsXCJsYWtlc1wiLFwiZG9uYXRpb25zXCIsXCJhc3NvY2lhdGlvbnNcIixcImNpdHlzZWFyY2hcIixcImNsb3NlbHlcIixcInJhZGlhdGlvblwiLFwiZGlhcnlcIixcInNlcmlvdXNseVwiLFwia2luZ3NcIixcInNob290aW5nXCIsXCJrZW50XCIsXCJhZGRzXCIsXCJuc3dcIixcImVhclwiLFwiZmxhZ3NcIixcInBjaVwiLFwiYmFrZXJcIixcImxhdW5jaGVkXCIsXCJlbHNld2hlcmVcIixcInBvbGx1dGlvblwiLFwiY29uc2VydmF0aXZlXCIsXCJndWVzdGJvb2tcIixcInNob2NrXCIsXCJlZmZlY3RpdmVuZXNzXCIsXCJ3YWxsc1wiLFwiYWJyb2FkXCIsXCJlYm9ueVwiLFwidGllXCIsXCJ3YXJkXCIsXCJkcmF3blwiLFwiYXJ0aHVyXCIsXCJpYW5cIixcInZpc2l0ZWRcIixcInJvb2ZcIixcIndhbGtlclwiLFwiZGVtb25zdHJhdGVcIixcImF0bW9zcGhlcmVcIixcInN1Z2dlc3RzXCIsXCJraXNzXCIsXCJiZWFzdFwiLFwicmFcIixcIm9wZXJhdGVkXCIsXCJleHBlcmltZW50XCIsXCJ0YXJnZXRzXCIsXCJvdmVyc2Vhc1wiLFwicHVyY2hhc2VzXCIsXCJkb2RnZVwiLFwiY291bnNlbFwiLFwiZmVkZXJhdGlvblwiLFwicGl6emFcIixcImludml0ZWRcIixcInlhcmRzXCIsXCJhc3NpZ25tZW50XCIsXCJjaGVtaWNhbHNcIixcImdvcmRvblwiLFwibW9kXCIsXCJmYXJtZXJzXCIsXCJyY1wiLFwicXVlcmllc1wiLFwiYm13XCIsXCJydXNoXCIsXCJ1a3JhaW5lXCIsXCJhYnNlbmNlXCIsXCJuZWFyZXN0XCIsXCJjbHVzdGVyXCIsXCJ2ZW5kb3JzXCIsXCJtcGVnXCIsXCJ3aGVyZWFzXCIsXCJ5b2dhXCIsXCJzZXJ2ZXNcIixcIndvb2RzXCIsXCJzdXJwcmlzZVwiLFwibGFtcFwiLFwicmljb1wiLFwicGFydGlhbFwiLFwic2hvcHBlcnNcIixcInBoaWxcIixcImV2ZXJ5Ym9keVwiLFwiY291cGxlc1wiLFwibmFzaHZpbGxlXCIsXCJyYW5raW5nXCIsXCJqb2tlc1wiLFwiY3N0XCIsXCJodHRwXCIsXCJjZW9cIixcInNpbXBzb25cIixcInR3aWtpXCIsXCJzdWJsaW1lXCIsXCJjb3Vuc2VsaW5nXCIsXCJwYWxhY2VcIixcImFjY2VwdGFibGVcIixcInNhdGlzZmllZFwiLFwiZ2xhZFwiLFwid2luc1wiLFwibWVhc3VyZW1lbnRzXCIsXCJ2ZXJpZnlcIixcImdsb2JlXCIsXCJ0cnVzdGVkXCIsXCJjb3BwZXJcIixcIm1pbHdhdWtlZVwiLFwicmFja1wiLFwibWVkaWNhdGlvblwiLFwid2FyZWhvdXNlXCIsXCJzaGFyZXdhcmVcIixcImVjXCIsXCJyZXBcIixcImRpY2tlXCIsXCJrZXJyeVwiLFwicmVjZWlwdFwiLFwic3VwcG9zZWRcIixcIm9yZGluYXJ5XCIsXCJub2JvZHlcIixcImdob3N0XCIsXCJ2aW9sYXRpb25cIixcImNvbmZpZ3VyZVwiLFwic3RhYmlsaXR5XCIsXCJtaXRcIixcImFwcGx5aW5nXCIsXCJzb3V0aHdlc3RcIixcImJvc3NcIixcInByaWRlXCIsXCJpbnN0aXR1dGlvbmFsXCIsXCJleHBlY3RhdGlvbnNcIixcImluZGVwZW5kZW5jZVwiLFwia25vd2luZ1wiLFwicmVwb3J0ZXJcIixcIm1ldGFib2xpc21cIixcImtlaXRoXCIsXCJjaGFtcGlvblwiLFwiY2xvdWR5XCIsXCJsaW5kYVwiLFwicm9zc1wiLFwicGVyc29uYWxseVwiLFwiY2hpbGVcIixcImFubmFcIixcInBsZW50eVwiLFwic29sb1wiLFwic2VudGVuY2VcIixcInRocm9hdFwiLFwiaWdub3JlXCIsXCJtYXJpYVwiLFwidW5pZm9ybVwiLFwiZXhjZWxsZW5jZVwiLFwid2VhbHRoXCIsXCJ0YWxsXCIsXCJybVwiLFwic29tZXdoZXJlXCIsXCJ2YWN1dW1cIixcImRhbmNpbmdcIixcImF0dHJpYnV0ZXNcIixcInJlY29nbml6ZVwiLFwiYnJhc3NcIixcIndyaXRlc1wiLFwicGxhemFcIixcInBkYXNcIixcIm91dGNvbWVzXCIsXCJzdXJ2aXZhbFwiLFwicXVlc3RcIixcInB1Ymxpc2hcIixcInNyaVwiLFwic2NyZWVuaW5nXCIsXCJ0b2VcIixcInRodW1ibmFpbFwiLFwidHJhbnNcIixcImpvbmF0aGFuXCIsXCJ3aGVuZXZlclwiLFwibm92YVwiLFwibGlmZXRpbWVcIixcImFwaVwiLFwicGlvbmVlclwiLFwiYm9vdHlcIixcImZvcmdvdHRlblwiLFwiYWNyb2JhdFwiLFwicGxhdGVzXCIsXCJhY3Jlc1wiLFwidmVudWVcIixcImF0aGxldGljXCIsXCJ0aGVybWFsXCIsXCJlc3NheXNcIixcImJlaGF2aW91clwiLFwidml0YWxcIixcInRlbGxpbmdcIixcImZhaXJseVwiLFwiY29hc3RhbFwiLFwiY29uZmlnXCIsXCJjZlwiLFwiY2hhcml0eVwiLFwiaW50ZWxsaWdlbnRcIixcImVkaW5idXJnaFwiLFwidnRcIixcImV4Y2VsXCIsXCJtb2Rlc1wiLFwib2JsaWdhdGlvblwiLFwiY2FtcGJlbGxcIixcIndha2VcIixcInN0dXBpZFwiLFwiaGFyYm9yXCIsXCJodW5nYXJ5XCIsXCJ0cmF2ZWxlclwiLFwidXJ3XCIsXCJzZWdtZW50XCIsXCJyZWFsaXplXCIsXCJyZWdhcmRsZXNzXCIsXCJsYW5cIixcImVuZW15XCIsXCJwdXp6bGVcIixcInJpc2luZ1wiLFwiYWx1bWludW1cIixcIndlbGxzXCIsXCJ3aXNobGlzdFwiLFwib3BlbnNcIixcImluc2lnaHRcIixcInNtc1wiLFwicmVzdHJpY3RlZFwiLFwicmVwdWJsaWNhblwiLFwic2VjcmV0c1wiLFwibHVja3lcIixcImxhdHRlclwiLFwibWVyY2hhbnRzXCIsXCJ0aGlja1wiLFwidHJhaWxlcnNcIixcInJlcGVhdFwiLFwic3luZHJvbWVcIixcInBoaWxpcHNcIixcImF0dGVuZGFuY2VcIixcInBlbmFsdHlcIixcImRydW1cIixcImdsYXNzZXNcIixcImVuYWJsZXNcIixcIm5lY1wiLFwiaXJhcWlcIixcImJ1aWxkZXJcIixcInZpc3RhXCIsXCJqZXNzaWNhXCIsXCJjaGlwc1wiLFwidGVycnlcIixcImZsb29kXCIsXCJmb3RvXCIsXCJlYXNlXCIsXCJhcmd1bWVudHNcIixcImFtc3RlcmRhbVwiLFwiYXJlbmFcIixcImFkdmVudHVyZXNcIixcInB1cGlsc1wiLFwic3Rld2FydFwiLFwiYW5ub3VuY2VtZW50XCIsXCJ0YWJzXCIsXCJvdXRjb21lXCIsXCJhcHByZWNpYXRlXCIsXCJleHBhbmRlZFwiLFwiY2FzdWFsXCIsXCJncm93blwiLFwicG9saXNoXCIsXCJsb3ZlbHlcIixcImV4dHJhc1wiLFwiZ21cIixcImNlbnRyZXNcIixcImplcnJ5XCIsXCJjbGF1c2VcIixcInNtaWxlXCIsXCJsYW5kc1wiLFwicmlcIixcInRyb29wc1wiLFwiaW5kb29yXCIsXCJidWxnYXJpYVwiLFwiYXJtZWRcIixcImJyb2tlclwiLFwiY2hhcmdlclwiLFwicmVndWxhcmx5XCIsXCJiZWxpZXZlZFwiLFwicGluZVwiLFwiY29vbGluZ1wiLFwidGVuZFwiLFwiZ3VsZlwiLFwicnRcIixcInJpY2tcIixcInRydWNrc1wiLFwiY3BcIixcIm1lY2hhbmlzbXNcIixcImRpdm9yY2VcIixcImxhdXJhXCIsXCJzaG9wcGVyXCIsXCJ0b2t5b1wiLFwicGFydGx5XCIsXCJuaWtvblwiLFwiY3VzdG9taXplXCIsXCJ0cmFkaXRpb25cIixcImNhbmR5XCIsXCJwaWxsc1wiLFwidGlnZXJcIixcImRvbmFsZFwiLFwiZm9sa3NcIixcInNlbnNvclwiLFwiZXhwb3NlZFwiLFwidGVsZWNvbVwiLFwiaHVudFwiLFwiYW5nZWxzXCIsXCJkZXB1dHlcIixcImluZGljYXRvcnNcIixcInNlYWxlZFwiLFwidGhhaVwiLFwiZW1pc3Npb25zXCIsXCJwaHlzaWNpYW5zXCIsXCJsb2FkZWRcIixcImZyZWRcIixcImNvbXBsYWludFwiLFwic2NlbmVzXCIsXCJleHBlcmltZW50c1wiLFwiYWZnaGFuaXN0YW5cIixcImRkXCIsXCJib29zdFwiLFwic3BhbmtpbmdcIixcInNjaG9sYXJzaGlwXCIsXCJnb3Zlcm5hbmNlXCIsXCJtaWxsXCIsXCJmb3VuZGVkXCIsXCJzdXBwbGVtZW50c1wiLFwiY2hyb25pY1wiLFwiaWNvbnNcIixcIm1vcmFsXCIsXCJkZW5cIixcImNhdGVyaW5nXCIsXCJhdWRcIixcImZpbmdlclwiLFwia2VlcHNcIixcInBvdW5kXCIsXCJsb2NhdGVcIixcImNhbWNvcmRlclwiLFwicGxcIixcInRyYWluZWRcIixcImJ1cm5cIixcImltcGxlbWVudGluZ1wiLFwicm9zZXNcIixcImxhYnNcIixcIm91cnNlbHZlc1wiLFwiYnJlYWRcIixcInRvYmFjY29cIixcIndvb2RlblwiLFwibW90b3JzXCIsXCJ0b3VnaFwiLFwicm9iZXJ0c1wiLFwiaW5jaWRlbnRcIixcImdvbm5hXCIsXCJkeW5hbWljc1wiLFwibGllXCIsXCJjcm1cIixcInJmXCIsXCJjb252ZXJzYXRpb25cIixcImRlY3JlYXNlXCIsXCJjdW1zaG90c1wiLFwiY2hlc3RcIixcInBlbnNpb25cIixcImJpbGx5XCIsXCJyZXZlbnVlc1wiLFwiZW1lcmdpbmdcIixcIndvcnNoaXBcIixcImNhcGFiaWxpdHlcIixcImFrXCIsXCJmZVwiLFwiY3JhaWdcIixcImhlcnNlbGZcIixcInByb2R1Y2luZ1wiLFwiY2h1cmNoZXNcIixcInByZWNpc2lvblwiLFwiZGFtYWdlc1wiLFwicmVzZXJ2ZXNcIixcImNvbnRyaWJ1dGVkXCIsXCJzb2x2ZVwiLFwic2hvcnRzXCIsXCJyZXByb2R1Y3Rpb25cIixcIm1pbm9yaXR5XCIsXCJ0ZFwiLFwiZGl2ZXJzZVwiLFwiYW1wXCIsXCJpbmdyZWRpZW50c1wiLFwic2JcIixcImFoXCIsXCJqb2hubnlcIixcInNvbGVcIixcImZyYW5jaGlzZVwiLFwicmVjb3JkZXJcIixcImNvbXBsYWludHNcIixcImZhY2luZ1wiLFwic21cIixcIm5hbmN5XCIsXCJwcm9tb3Rpb25zXCIsXCJ0b25lc1wiLFwicGFzc2lvblwiLFwicmVoYWJpbGl0YXRpb25cIixcIm1haW50YWluaW5nXCIsXCJzaWdodFwiLFwibGFpZFwiLFwiY2xheVwiLFwiZGVmZW5jZVwiLFwicGF0Y2hlc1wiLFwid2Vha1wiLFwicmVmdW5kXCIsXCJ1c2NcIixcInRvd25zXCIsXCJlbnZpcm9ubWVudHNcIixcInRyZW1ibFwiLFwiZGl2aWRlZFwiLFwiYmx2ZFwiLFwicmVjZXB0aW9uXCIsXCJhbWRcIixcIndpc2VcIixcImVtYWlsc1wiLFwiY3lwcnVzXCIsXCJ3dlwiLFwib2Rkc1wiLFwiY29ycmVjdGx5XCIsXCJpbnNpZGVyXCIsXCJzZW1pbmFyc1wiLFwiY29uc2VxdWVuY2VzXCIsXCJtYWtlcnNcIixcImhlYXJ0c1wiLFwiZ2VvZ3JhcGh5XCIsXCJhcHBlYXJpbmdcIixcImludGVncml0eVwiLFwid29ycnlcIixcIm5zXCIsXCJkaXNjcmltaW5hdGlvblwiLFwiZXZlXCIsXCJjYXJ0ZXJcIixcImxlZ2FjeVwiLFwibWFyY1wiLFwicGxlYXNlZFwiLFwiZGFuZ2VyXCIsXCJ2aXRhbWluXCIsXCJ3aWRlbHlcIixcInByb2Nlc3NlZFwiLFwicGhyYXNlXCIsXCJnZW51aW5lXCIsXCJyYWlzaW5nXCIsXCJpbXBsaWNhdGlvbnNcIixcImZ1bmN0aW9uYWxpdHlcIixcInBhcmFkaXNlXCIsXCJoeWJyaWRcIixcInJlYWRzXCIsXCJyb2xlc1wiLFwiaW50ZXJtZWRpYXRlXCIsXCJlbW90aW9uYWxcIixcInNvbnNcIixcImxlYWZcIixcInBhZFwiLFwiZ2xvcnlcIixcInBsYXRmb3Jtc1wiLFwiamFcIixcImJpZ2dlclwiLFwiYmlsbGluZ1wiLFwiZGllc2VsXCIsXCJ2ZXJzdXNcIixcImNvbWJpbmVcIixcIm92ZXJuaWdodFwiLFwiZ2VvZ3JhcGhpY1wiLFwiZXhjZWVkXCIsXCJic1wiLFwicm9kXCIsXCJzYXVkaVwiLFwiZmF1bHRcIixcImN1YmFcIixcImhyc1wiLFwicHJlbGltaW5hcnlcIixcImRpc3RyaWN0c1wiLFwiaW50cm9kdWNlXCIsXCJzaWxrXCIsXCJwcm9tb3Rpb25hbFwiLFwia2F0ZVwiLFwiY2hldnJvbGV0XCIsXCJiYWJpZXNcIixcImJpXCIsXCJrYXJlblwiLFwiY29tcGlsZWRcIixcInJvbWFudGljXCIsXCJyZXZlYWxlZFwiLFwic3BlY2lhbGlzdHNcIixcImdlbmVyYXRvclwiLFwiYWxiZXJ0XCIsXCJleGFtaW5lXCIsXCJqaW1teVwiLFwiZ3JhaGFtXCIsXCJzdXNwZW5zaW9uXCIsXCJicmlzdG9sXCIsXCJtYXJnYXJldFwiLFwiY29tcGFxXCIsXCJzYWRcIixcImNvcnJlY3Rpb25cIixcIndvbGZcIixcInNsb3dseVwiLFwiYXV0aGVudGljYXRpb25cIixcImNvbW11bmljYXRlXCIsXCJydWdieVwiLFwic3VwcGxlbWVudFwiLFwic2hvd3RpbWVzXCIsXCJjYWxcIixcInBvcnRpb25zXCIsXCJpbmZhbnRcIixcInByb21vdGluZ1wiLFwic2VjdG9yc1wiLFwic2FtdWVsXCIsXCJmbHVpZFwiLFwiZ3JvdW5kc1wiLFwiZml0c1wiLFwia2lja1wiLFwicmVnYXJkc1wiLFwibWVhbFwiLFwidGFcIixcImh1cnRcIixcIm1hY2hpbmVyeVwiLFwiYmFuZHdpZHRoXCIsXCJ1bmxpa2VcIixcImVxdWF0aW9uXCIsXCJiYXNrZXRzXCIsXCJwcm9iYWJpbGl0eVwiLFwicG90XCIsXCJkaW1lbnNpb25cIixcIndyaWdodFwiLFwiaW1nXCIsXCJiYXJyeVwiLFwicHJvdmVuXCIsXCJzY2hlZHVsZXNcIixcImFkbWlzc2lvbnNcIixcImNhY2hlZFwiLFwid2FycmVuXCIsXCJzbGlwXCIsXCJzdHVkaWVkXCIsXCJyZXZpZXdlclwiLFwiaW52b2x2ZXNcIixcInF1YXJ0ZXJseVwiLFwicnBtXCIsXCJwcm9maXRzXCIsXCJkZXZpbFwiLFwiZ3Jhc3NcIixcImNvbXBseVwiLFwibWFyaWVcIixcImZsb3Jpc3RcIixcImlsbHVzdHJhdGVkXCIsXCJjaGVycnlcIixcImNvbnRpbmVudGFsXCIsXCJhbHRlcm5hdGVcIixcImRldXRzY2hcIixcImFjaGlldmVtZW50XCIsXCJsaW1pdGF0aW9uc1wiLFwia2VueWFcIixcIndlYmNhbVwiLFwiY3V0c1wiLFwiZnVuZXJhbFwiLFwibnV0dGVuXCIsXCJlYXJyaW5nc1wiLFwiZW5qb3llZFwiLFwiYXV0b21hdGVkXCIsXCJjaGFwdGVyc1wiLFwicGVlXCIsXCJjaGFybGllXCIsXCJxdWViZWNcIixcInBhc3NlbmdlclwiLFwiY29udmVuaWVudFwiLFwiZGVubmlzXCIsXCJtYXJzXCIsXCJmcmFuY2lzXCIsXCJ0dnNcIixcInNpemVkXCIsXCJtYW5nYVwiLFwibm90aWNlZFwiLFwic29ja2V0XCIsXCJzaWxlbnRcIixcImxpdGVyYXJ5XCIsXCJlZ2dcIixcIm1oelwiLFwic2lnbmFsc1wiLFwiY2Fwc1wiLFwib3JpZW50YXRpb25cIixcInBpbGxcIixcInRoZWZ0XCIsXCJjaGlsZGhvb2RcIixcInN3aW5nXCIsXCJzeW1ib2xzXCIsXCJsYXRcIixcIm1ldGFcIixcImh1bWFuc1wiLFwiYW5hbG9nXCIsXCJmYWNpYWxcIixcImNob29zaW5nXCIsXCJ0YWxlbnRcIixcImRhdGVkXCIsXCJmbGV4aWJpbGl0eVwiLFwic2Vla2VyXCIsXCJ3aXNkb21cIixcInNob290XCIsXCJib3VuZGFyeVwiLFwibWludFwiLFwicGFja2FyZFwiLFwib2Zmc2V0XCIsXCJwYXlkYXlcIixcInBoaWxpcFwiLFwiZWxpdGVcIixcImdpXCIsXCJzcGluXCIsXCJob2xkZXJzXCIsXCJiZWxpZXZlc1wiLFwic3dlZGlzaFwiLFwicG9lbXNcIixcImRlYWRsaW5lXCIsXCJqdXJpc2RpY3Rpb25cIixcInJvYm90XCIsXCJkaXNwbGF5aW5nXCIsXCJ3aXRuZXNzXCIsXCJjb2xsaW5zXCIsXCJlcXVpcHBlZFwiLFwic3RhZ2VzXCIsXCJlbmNvdXJhZ2VkXCIsXCJzdXJcIixcIndpbmRzXCIsXCJwb3dkZXJcIixcImJyb2Fkd2F5XCIsXCJhY3F1aXJlZFwiLFwiYXNzZXNzXCIsXCJ3YXNoXCIsXCJjYXJ0cmlkZ2VzXCIsXCJzdG9uZXNcIixcImVudHJhbmNlXCIsXCJnbm9tZVwiLFwicm9vdHNcIixcImRlY2xhcmF0aW9uXCIsXCJsb3NpbmdcIixcImF0dGVtcHRzXCIsXCJnYWRnZXRzXCIsXCJub2JsZVwiLFwiZ2xhc2dvd1wiLFwiYXV0b21hdGlvblwiLFwiaW1wYWN0c1wiLFwicmV2XCIsXCJnb3NwZWxcIixcImFkdmFudGFnZXNcIixcInNob3JlXCIsXCJsb3Zlc1wiLFwiaW5kdWNlZFwiLFwibGxcIixcImtuaWdodFwiLFwicHJlcGFyaW5nXCIsXCJsb29zZVwiLFwiYWltc1wiLFwicmVjaXBpZW50XCIsXCJsaW5raW5nXCIsXCJleHRlbnNpb25zXCIsXCJhcHBlYWxzXCIsXCJjbFwiLFwiZWFybmVkXCIsXCJpbGxuZXNzXCIsXCJpc2xhbWljXCIsXCJhdGhsZXRpY3NcIixcInNvdXRoZWFzdFwiLFwiaWVlZVwiLFwiaG9cIixcImFsdGVybmF0aXZlc1wiLFwicGVuZGluZ1wiLFwicGFya2VyXCIsXCJkZXRlcm1pbmluZ1wiLFwibGViYW5vblwiLFwiY29ycFwiLFwicGVyc29uYWxpemVkXCIsXCJrZW5uZWR5XCIsXCJndFwiLFwic2hcIixcImNvbmRpdGlvbmluZ1wiLFwidGVlbmFnZVwiLFwic29hcFwiLFwiYWVcIixcInRyaXBsZVwiLFwiY29vcGVyXCIsXCJueWNcIixcInZpbmNlbnRcIixcImphbVwiLFwic2VjdXJlZFwiLFwidW51c3VhbFwiLFwiYW5zd2VyZWRcIixcInBhcnRuZXJzaGlwc1wiLFwiZGVzdHJ1Y3Rpb25cIixcInNsb3RzXCIsXCJpbmNyZWFzaW5nbHlcIixcIm1pZ3JhdGlvblwiLFwiZGlzb3JkZXJcIixcInJvdXRpbmVcIixcInRvb2xiYXJcIixcImJhc2ljYWxseVwiLFwicm9ja3NcIixcImNvbnZlbnRpb25hbFwiLFwidGl0YW5zXCIsXCJhcHBsaWNhbnRzXCIsXCJ3ZWFyaW5nXCIsXCJheGlzXCIsXCJzb3VnaHRcIixcImdlbmVzXCIsXCJtb3VudGVkXCIsXCJoYWJpdGF0XCIsXCJmaXJld2FsbFwiLFwibWVkaWFuXCIsXCJndW5zXCIsXCJzY2FubmVyXCIsXCJoZXJlaW5cIixcIm9jY3VwYXRpb25hbFwiLFwiYW5pbWF0ZWRcIixcImp1ZGljaWFsXCIsXCJyaW9cIixcImhzXCIsXCJhZGp1c3RtZW50XCIsXCJoZXJvXCIsXCJpbnRlZ2VyXCIsXCJ0cmVhdG1lbnRzXCIsXCJiYWNoZWxvclwiLFwiYXR0aXR1ZGVcIixcImNhbWNvcmRlcnNcIixcImVuZ2FnZWRcIixcImZhbGxpbmdcIixcImJhc2ljc1wiLFwibW9udHJlYWxcIixcImNhcnBldFwiLFwicnZcIixcInN0cnVjdFwiLFwibGVuc2VzXCIsXCJiaW5hcnlcIixcImdlbmV0aWNzXCIsXCJhdHRlbmRlZFwiLFwiZGlmZmljdWx0eVwiLFwicHVua1wiLFwiY29sbGVjdGl2ZVwiLFwiY29hbGl0aW9uXCIsXCJwaVwiLFwiZHJvcHBlZFwiLFwiZW5yb2xsbWVudFwiLFwiZHVrZVwiLFwid2FsdGVyXCIsXCJhaVwiLFwicGFjZVwiLFwiYmVzaWRlc1wiLFwid2FnZVwiLFwicHJvZHVjZXJzXCIsXCJvdFwiLFwiY29sbGVjdG9yXCIsXCJhcmNcIixcImhvc3RzXCIsXCJpbnRlcmZhY2VzXCIsXCJhZHZlcnRpc2Vyc1wiLFwibW9tZW50c1wiLFwiYXRsYXNcIixcInN0cmluZ3NcIixcImRhd25cIixcInJlcHJlc2VudGluZ1wiLFwib2JzZXJ2YXRpb25cIixcImZlZWxzXCIsXCJ0b3J0dXJlXCIsXCJjYXJsXCIsXCJkZWxldGVkXCIsXCJjb2F0XCIsXCJtaXRjaGVsbFwiLFwibXJzXCIsXCJyaWNhXCIsXCJyZXN0b3JhdGlvblwiLFwiY29udmVuaWVuY2VcIixcInJldHVybmluZ1wiLFwicmFscGhcIixcIm9wcG9zaXRpb25cIixcImNvbnRhaW5lclwiLFwieXJcIixcImRlZmVuZGFudFwiLFwid2FybmVyXCIsXCJjb25maXJtYXRpb25cIixcImFwcFwiLFwiZW1iZWRkZWRcIixcImlua2pldFwiLFwic3VwZXJ2aXNvclwiLFwid2l6YXJkXCIsXCJjb3Jwc1wiLFwiYWN0b3JzXCIsXCJsaXZlclwiLFwicGVyaXBoZXJhbHNcIixcImxpYWJsZVwiLFwiYnJvY2h1cmVcIixcIm1vcnJpc1wiLFwiYmVzdHNlbGxlcnNcIixcInBldGl0aW9uXCIsXCJlbWluZW1cIixcInJlY2FsbFwiLFwiYW50ZW5uYVwiLFwicGlja2VkXCIsXCJhc3N1bWVkXCIsXCJkZXBhcnR1cmVcIixcIm1pbm5lYXBvbGlzXCIsXCJiZWxpZWZcIixcImtpbGxpbmdcIixcImJpa2luaVwiLFwibWVtcGhpc1wiLFwic2hvdWxkZXJcIixcImRlY29yXCIsXCJsb29rdXBcIixcInRleHRzXCIsXCJoYXJ2YXJkXCIsXCJicm9rZXJzXCIsXCJyb3lcIixcImlvblwiLFwiZGlhbWV0ZXJcIixcIm90dGF3YVwiLFwiZG9sbFwiLFwiaWNcIixcInBvZGNhc3RcIixcInNlYXNvbnNcIixcInBlcnVcIixcImludGVyYWN0aW9uc1wiLFwicmVmaW5lXCIsXCJiaWRkZXJcIixcInNpbmdlclwiLFwiZXZhbnNcIixcImhlcmFsZFwiLFwibGl0ZXJhY3lcIixcImZhaWxzXCIsXCJhZ2luZ1wiLFwibmlrZVwiLFwiaW50ZXJ2ZW50aW9uXCIsXCJmZWRcIixcInBsdWdpblwiLFwiYXR0cmFjdGlvblwiLFwiZGl2aW5nXCIsXCJpbnZpdGVcIixcIm1vZGlmaWNhdGlvblwiLFwiYWxpY2VcIixcImxhdGluYXNcIixcInN1cHBvc2VcIixcImN1c3RvbWl6ZWRcIixcInJlZWRcIixcImludm9sdmVcIixcIm1vZGVyYXRlXCIsXCJ0ZXJyb3JcIixcInlvdW5nZXJcIixcInRoaXJ0eVwiLFwibWljZVwiLFwib3Bwb3NpdGVcIixcInVuZGVyc3Rvb2RcIixcInJhcGlkbHlcIixcImRlYWx0aW1lXCIsXCJiYW5cIixcInRlbXBcIixcImludHJvXCIsXCJtZXJjZWRlc1wiLFwienVzXCIsXCJhc3N1cmFuY2VcIixcImNsZXJrXCIsXCJoYXBwZW5pbmdcIixcInZhc3RcIixcIm1pbGxzXCIsXCJvdXRsaW5lXCIsXCJhbWVuZG1lbnRzXCIsXCJ0cmFtYWRvbFwiLFwiaG9sbGFuZFwiLFwicmVjZWl2ZXNcIixcImplYW5zXCIsXCJtZXRyb3BvbGl0YW5cIixcImNvbXBpbGF0aW9uXCIsXCJ2ZXJpZmljYXRpb25cIixcImZvbnRzXCIsXCJlbnRcIixcIm9kZFwiLFwid3JhcFwiLFwicmVmZXJzXCIsXCJtb29kXCIsXCJmYXZvclwiLFwidmV0ZXJhbnNcIixcInF1aXpcIixcIm14XCIsXCJzaWdtYVwiLFwiZ3JcIixcImF0dHJhY3RpdmVcIixcInhodG1sXCIsXCJvY2Nhc2lvblwiLFwicmVjb3JkaW5nc1wiLFwiamVmZmVyc29uXCIsXCJ2aWN0aW1cIixcImRlbWFuZHNcIixcInNsZWVwaW5nXCIsXCJjYXJlZnVsXCIsXCJleHRcIixcImJlYW1cIixcImdhcmRlbmluZ1wiLFwib2JsaWdhdGlvbnNcIixcImFycml2ZVwiLFwib3JjaGVzdHJhXCIsXCJzdW5zZXRcIixcInRyYWNrZWRcIixcIm1vcmVvdmVyXCIsXCJtaW5pbWFsXCIsXCJwb2x5cGhvbmljXCIsXCJsb3R0ZXJ5XCIsXCJ0b3BzXCIsXCJmcmFtZWRcIixcImFzaWRlXCIsXCJvdXRzb3VyY2luZ1wiLFwibGljZW5jZVwiLFwiYWRqdXN0YWJsZVwiLFwiYWxsb2NhdGlvblwiLFwibWljaGVsbGVcIixcImVzc2F5XCIsXCJkaXNjaXBsaW5lXCIsXCJhbXlcIixcInRzXCIsXCJkZW1vbnN0cmF0ZWRcIixcImRpYWxvZ3VlXCIsXCJpZGVudGlmeWluZ1wiLFwiYWxwaGFiZXRpY2FsXCIsXCJjYW1wc1wiLFwiZGVjbGFyZWRcIixcImRpc3BhdGNoZWRcIixcImFhcm9uXCIsXCJoYW5kaGVsZFwiLFwidHJhY2VcIixcImRpc3Bvc2FsXCIsXCJzaHV0XCIsXCJmbG9yaXN0c1wiLFwicGFja3NcIixcImdlXCIsXCJpbnN0YWxsaW5nXCIsXCJzd2l0Y2hlc1wiLFwicm9tYW5pYVwiLFwidm9sdW50YXJ5XCIsXCJuY2FhXCIsXCJ0aG91XCIsXCJjb25zdWx0XCIsXCJwaGRcIixcImdyZWF0bHlcIixcImJsb2dnaW5nXCIsXCJtYXNrXCIsXCJjeWNsaW5nXCIsXCJtaWRuaWdodFwiLFwibmdcIixcImNvbW1vbmx5XCIsXCJwZVwiLFwicGhvdG9ncmFwaGVyXCIsXCJpbmZvcm1cIixcInR1cmtpc2hcIixcImNvYWxcIixcImNyeVwiLFwibWVzc2FnaW5nXCIsXCJwZW50aXVtXCIsXCJxdWFudHVtXCIsXCJtdXJyYXlcIixcImludGVudFwiLFwidHRcIixcInpvb1wiLFwibGFyZ2VseVwiLFwicGxlYXNhbnRcIixcImFubm91bmNlXCIsXCJjb25zdHJ1Y3RlZFwiLFwiYWRkaXRpb25zXCIsXCJyZXF1aXJpbmdcIixcInNwb2tlXCIsXCJha2FcIixcImFycm93XCIsXCJlbmdhZ2VtZW50XCIsXCJzYW1wbGluZ1wiLFwicm91Z2hcIixcIndlaXJkXCIsXCJ0ZWVcIixcInJlZmluYW5jZVwiLFwibGlvblwiLFwiaW5zcGlyZWRcIixcImhvbGVzXCIsXCJ3ZWRkaW5nc1wiLFwiYmxhZGVcIixcInN1ZGRlbmx5XCIsXCJveHlnZW5cIixcImNvb2tpZVwiLFwibWVhbHNcIixcImNhbnlvblwiLFwiZ290b1wiLFwibWV0ZXJzXCIsXCJtZXJlbHlcIixcImNhbGVuZGFyc1wiLFwiYXJyYW5nZW1lbnRcIixcImNvbmNsdXNpb25zXCIsXCJwYXNzZXNcIixcImJpYmxpb2dyYXBoeVwiLFwicG9pbnRlclwiLFwiY29tcGF0aWJpbGl0eVwiLFwic3RyZXRjaFwiLFwiZHVyaGFtXCIsXCJmdXJ0aGVybW9yZVwiLFwicGVybWl0c1wiLFwiY29vcGVyYXRpdmVcIixcIm11c2xpbVwiLFwieGxcIixcIm5laWxcIixcInNsZWV2ZVwiLFwibmV0c2NhcGVcIixcImNsZWFuZXJcIixcImNyaWNrZXRcIixcImJlZWZcIixcImZlZWRpbmdcIixcInN0cm9rZVwiLFwidG93bnNoaXBcIixcInJhbmtpbmdzXCIsXCJtZWFzdXJpbmdcIixcImNhZFwiLFwiaGF0c1wiLFwicm9iaW5cIixcInJvYmluc29uXCIsXCJqYWNrc29udmlsbGVcIixcInN0cmFwXCIsXCJoZWFkcXVhcnRlcnNcIixcInNoYXJvblwiLFwiY3Jvd2RcIixcInRjcFwiLFwidHJhbnNmZXJzXCIsXCJzdXJmXCIsXCJvbHltcGljXCIsXCJ0cmFuc2Zvcm1hdGlvblwiLFwicmVtYWluZWRcIixcImF0dGFjaG1lbnRzXCIsXCJkdlwiLFwiZGlyXCIsXCJlbnRpdGllc1wiLFwiY3VzdG9tc1wiLFwiYWRtaW5pc3RyYXRvcnNcIixcInBlcnNvbmFsaXR5XCIsXCJyYWluYm93XCIsXCJob29rXCIsXCJyb3VsZXR0ZVwiLFwiZGVjbGluZVwiLFwiZ2xvdmVzXCIsXCJpc3JhZWxpXCIsXCJtZWRpY2FyZVwiLFwiY29yZFwiLFwic2tpaW5nXCIsXCJjbG91ZFwiLFwiZmFjaWxpdGF0ZVwiLFwic3Vic2NyaWJlclwiLFwidmFsdmVcIixcInZhbFwiLFwiaGV3bGV0dFwiLFwiZXhwbGFpbnNcIixcInByb2NlZWRcIixcImZsaWNrclwiLFwiZmVlbGluZ3NcIixcImtuaWZlXCIsXCJqYW1haWNhXCIsXCJwcmlvcml0aWVzXCIsXCJzaGVsZlwiLFwiYm9va3N0b3JlXCIsXCJ0aW1pbmdcIixcImxpa2VkXCIsXCJwYXJlbnRpbmdcIixcImFkb3B0XCIsXCJkZW5pZWRcIixcImZvdG9zXCIsXCJpbmNyZWRpYmxlXCIsXCJicml0bmV5XCIsXCJmcmVld2FyZVwiLFwiZG9uYXRpb25cIixcIm91dGVyXCIsXCJjcm9wXCIsXCJkZWF0aHNcIixcInJpdmVyc1wiLFwiY29tbW9ud2VhbHRoXCIsXCJwaGFybWFjZXV0aWNhbFwiLFwibWFuaGF0dGFuXCIsXCJ0YWxlc1wiLFwia2F0cmluYVwiLFwid29ya2ZvcmNlXCIsXCJpc2xhbVwiLFwibm9kZXNcIixcInR1XCIsXCJmeVwiLFwidGh1bWJzXCIsXCJzZWVkc1wiLFwiY2l0ZWRcIixcImxpdGVcIixcImdoelwiLFwiaHViXCIsXCJ0YXJnZXRlZFwiLFwib3JnYW5pemF0aW9uYWxcIixcInNreXBlXCIsXCJyZWFsaXplZFwiLFwidHdlbHZlXCIsXCJmb3VuZGVyXCIsXCJkZWNhZGVcIixcImdhbWVjdWJlXCIsXCJyclwiLFwiZGlzcHV0ZVwiLFwicG9ydHVndWVzZVwiLFwidGlyZWRcIixcInRpdHRlblwiLFwiYWR2ZXJzZVwiLFwiZXZlcnl3aGVyZVwiLFwiZXhjZXJwdFwiLFwiZW5nXCIsXCJzdGVhbVwiLFwiZGlzY2hhcmdlXCIsXCJlZlwiLFwiZHJpbmtzXCIsXCJhY2VcIixcInZvaWNlc1wiLFwiYWN1dGVcIixcImhhbGxvd2VlblwiLFwiY2xpbWJpbmdcIixcInN0b29kXCIsXCJzaW5nXCIsXCJ0b25zXCIsXCJwZXJmdW1lXCIsXCJjYXJvbFwiLFwiaG9uZXN0XCIsXCJhbGJhbnlcIixcImhhemFyZG91c1wiLFwicmVzdG9yZVwiLFwic3RhY2tcIixcIm1ldGhvZG9sb2d5XCIsXCJzb21lYm9keVwiLFwic3VlXCIsXCJlcFwiLFwiaG91c2V3YXJlc1wiLFwicmVwdXRhdGlvblwiLFwicmVzaXN0YW50XCIsXCJkZW1vY3JhdHNcIixcInJlY3ljbGluZ1wiLFwiaGFuZ1wiLFwiZ2JwXCIsXCJjdXJ2ZVwiLFwiY3JlYXRvclwiLFwiYW1iZXJcIixcInF1YWxpZmljYXRpb25zXCIsXCJtdXNldW1zXCIsXCJjb2RpbmdcIixcInNsaWRlc2hvd1wiLFwidHJhY2tlclwiLFwidmFyaWF0aW9uXCIsXCJwYXNzYWdlXCIsXCJ0cmFuc2ZlcnJlZFwiLFwidHJ1bmtcIixcImhpa2luZ1wiLFwibGJcIixcInBpZXJyZVwiLFwiamVsc29mdFwiLFwiaGVhZHNldFwiLFwicGhvdG9ncmFwaFwiLFwib2FrbGFuZFwiLFwiY29sb21iaWFcIixcIndhdmVzXCIsXCJjYW1lbFwiLFwiZGlzdHJpYnV0b3JcIixcImxhbXBzXCIsXCJ1bmRlcmx5aW5nXCIsXCJob29kXCIsXCJ3cmVzdGxpbmdcIixcInN1aWNpZGVcIixcImFyY2hpdmVkXCIsXCJwaG90b3Nob3BcIixcImpwXCIsXCJjaGlcIixcImJ0XCIsXCJhcmFiaWFcIixcImdhdGhlcmluZ1wiLFwicHJvamVjdGlvblwiLFwianVpY2VcIixcImNoYXNlXCIsXCJtYXRoZW1hdGljYWxcIixcImxvZ2ljYWxcIixcInNhdWNlXCIsXCJmYW1lXCIsXCJleHRyYWN0XCIsXCJzcGVjaWFsaXplZFwiLFwiZGlhZ25vc3RpY1wiLFwicGFuYW1hXCIsXCJpbmRpYW5hcG9saXNcIixcImFmXCIsXCJwYXlhYmxlXCIsXCJjb3Jwb3JhdGlvbnNcIixcImNvdXJ0ZXN5XCIsXCJjcml0aWNpc21cIixcImF1dG9tb2JpbGVcIixcImNvbmZpZGVudGlhbFwiLFwicmZjXCIsXCJzdGF0dXRvcnlcIixcImFjY29tbW9kYXRpb25zXCIsXCJhdGhlbnNcIixcIm5vcnRoZWFzdFwiLFwiZG93bmxvYWRlZFwiLFwianVkZ2VzXCIsXCJzbFwiLFwic2VvXCIsXCJyZXRpcmVkXCIsXCJpc3BcIixcInJlbWFya3NcIixcImRldGVjdGVkXCIsXCJkZWNhZGVzXCIsXCJwYWludGluZ3NcIixcIndhbGtlZFwiLFwiYXJpc2luZ1wiLFwibmlzc2FuXCIsXCJicmFjZWxldFwiLFwiaW5zXCIsXCJlZ2dzXCIsXCJqdXZlbmlsZVwiLFwiaW5qZWN0aW9uXCIsXCJ5b3Jrc2hpcmVcIixcInBvcHVsYXRpb25zXCIsXCJwcm90ZWN0aXZlXCIsXCJhZnJhaWRcIixcImFjb3VzdGljXCIsXCJyYWlsd2F5XCIsXCJjYXNzZXR0ZVwiLFwiaW5pdGlhbGx5XCIsXCJpbmRpY2F0b3JcIixcInBvaW50ZWRcIixcImhiXCIsXCJqcGdcIixcImNhdXNpbmdcIixcIm1pc3Rha2VcIixcIm5vcnRvblwiLFwibG9ja2VkXCIsXCJlbGltaW5hdGVcIixcInRjXCIsXCJmdXNpb25cIixcIm1pbmVyYWxcIixcInN1bmdsYXNzZXNcIixcInJ1YnlcIixcInN0ZWVyaW5nXCIsXCJiZWFkc1wiLFwiZm9ydHVuZVwiLFwicHJlZmVyZW5jZVwiLFwiY2FudmFzXCIsXCJ0aHJlc2hvbGRcIixcInBhcmlzaFwiLFwiY2xhaW1lZFwiLFwic2NyZWVuc1wiLFwiY2VtZXRlcnlcIixcInBsYW5uZXJcIixcImNyb2F0aWFcIixcImZsb3dzXCIsXCJzdGFkaXVtXCIsXCJ2ZW5lenVlbGFcIixcImV4cGxvcmF0aW9uXCIsXCJtaW5zXCIsXCJmZXdlclwiLFwic2VxdWVuY2VzXCIsXCJjb3Vwb25cIixcIm51cnNlc1wiLFwic3NsXCIsXCJzdGVtXCIsXCJwcm94eVwiLFwiYXN0cm9ub215XCIsXCJsYW5rYVwiLFwib3B0XCIsXCJlZHdhcmRzXCIsXCJkcmV3XCIsXCJjb250ZXN0c1wiLFwiZmx1XCIsXCJ0cmFuc2xhdGVcIixcImFubm91bmNlc1wiLFwibWxiXCIsXCJjb3N0dW1lXCIsXCJ0YWdnZWRcIixcImJlcmtlbGV5XCIsXCJ2b3RlZFwiLFwia2lsbGVyXCIsXCJiaWtlc1wiLFwiZ2F0ZXNcIixcImFkanVzdGVkXCIsXCJyYXBcIixcInR1bmVcIixcImJpc2hvcFwiLFwicHVsbGVkXCIsXCJjb3JuXCIsXCJncFwiLFwic2hhcGVkXCIsXCJjb21wcmVzc2lvblwiLFwic2Vhc29uYWxcIixcImVzdGFibGlzaGluZ1wiLFwiZmFybWVyXCIsXCJjb3VudGVyc1wiLFwicHV0c1wiLFwiY29uc3RpdHV0aW9uYWxcIixcImdyZXdcIixcInBlcmZlY3RseVwiLFwidGluXCIsXCJzbGF2ZVwiLFwiaW5zdGFudGx5XCIsXCJjdWx0dXJlc1wiLFwibm9yZm9sa1wiLFwiY29hY2hpbmdcIixcImV4YW1pbmVkXCIsXCJ0cmVrXCIsXCJlbmNvZGluZ1wiLFwibGl0aWdhdGlvblwiLFwic3VibWlzc2lvbnNcIixcIm9lbVwiLFwiaGVyb2VzXCIsXCJwYWludGVkXCIsXCJseWNvc1wiLFwiaXJcIixcInpkbmV0XCIsXCJicm9hZGNhc3RpbmdcIixcImhvcml6b250YWxcIixcImFydHdvcmtcIixcImNvc21ldGljXCIsXCJyZXN1bHRlZFwiLFwicG9ydHJhaXRcIixcInRlcnJvcmlzdFwiLFwiaW5mb3JtYXRpb25hbFwiLFwiZXRoaWNhbFwiLFwiY2FycmllcnNcIixcImVjb21tZXJjZVwiLFwibW9iaWxpdHlcIixcImZsb3JhbFwiLFwiYnVpbGRlcnNcIixcInRpZXNcIixcInN0cnVnZ2xlXCIsXCJzY2hlbWVzXCIsXCJzdWZmZXJpbmdcIixcIm5ldXRyYWxcIixcImZpc2hlclwiLFwicmF0XCIsXCJzcGVhcnNcIixcInByb3NwZWN0aXZlXCIsXCJiZWRkaW5nXCIsXCJ1bHRpbWF0ZWx5XCIsXCJqb2luaW5nXCIsXCJoZWFkaW5nXCIsXCJlcXVhbGx5XCIsXCJhcnRpZmljaWFsXCIsXCJiZWFyaW5nXCIsXCJzcGVjdGFjdWxhclwiLFwiY29vcmRpbmF0aW9uXCIsXCJjb25uZWN0b3JcIixcImJyYWRcIixcImNvbWJvXCIsXCJzZW5pb3JzXCIsXCJ3b3JsZHNcIixcImd1aWx0eVwiLFwiYWZmaWxpYXRlZFwiLFwiYWN0aXZhdGlvblwiLFwibmF0dXJhbGx5XCIsXCJoYXZlblwiLFwidGFibGV0XCIsXCJqdXJ5XCIsXCJkb3NcIixcInRhaWxcIixcInN1YnNjcmliZXJzXCIsXCJjaGFybVwiLFwibGF3blwiLFwidmlvbGVudFwiLFwibWl0c3ViaXNoaVwiLFwidW5kZXJ3ZWFyXCIsXCJiYXNpblwiLFwic291cFwiLFwicG90ZW50aWFsbHlcIixcInJhbmNoXCIsXCJjb25zdHJhaW50c1wiLFwiY3Jvc3NpbmdcIixcImluY2x1c2l2ZVwiLFwiZGltZW5zaW9uYWxcIixcImNvdHRhZ2VcIixcImRydW5rXCIsXCJjb25zaWRlcmFibGVcIixcImNyaW1lc1wiLFwicmVzb2x2ZWRcIixcIm1vemlsbGFcIixcImJ5dGVcIixcInRvbmVyXCIsXCJub3NlXCIsXCJsYXRleFwiLFwiYnJhbmNoZXNcIixcImFueW1vcmVcIixcIm9jbGNcIixcImRlbGhpXCIsXCJob2xkaW5nc1wiLFwiYWxpZW5cIixcImxvY2F0b3JcIixcInNlbGVjdGluZ1wiLFwicHJvY2Vzc29yc1wiLFwicGFudHlob3NlXCIsXCJwbGNcIixcImJyb2tlXCIsXCJuZXBhbFwiLFwiemltYmFid2VcIixcImRpZmZpY3VsdGllc1wiLFwianVhblwiLFwiY29tcGxleGl0eVwiLFwibXNnXCIsXCJjb25zdGFudGx5XCIsXCJicm93c2luZ1wiLFwicmVzb2x2ZVwiLFwiYmFyY2Vsb25hXCIsXCJwcmVzaWRlbnRpYWxcIixcImRvY3VtZW50YXJ5XCIsXCJjb2RcIixcInRlcnJpdG9yaWVzXCIsXCJtZWxpc3NhXCIsXCJtb3Njb3dcIixcInRoZXNpc1wiLFwidGhydVwiLFwiamV3c1wiLFwibnlsb25cIixcInBhbGVzdGluaWFuXCIsXCJkaXNjc1wiLFwicm9ja3lcIixcImJhcmdhaW5zXCIsXCJmcmVxdWVudFwiLFwidHJpbVwiLFwibmlnZXJpYVwiLFwiY2VpbGluZ1wiLFwicGl4ZWxzXCIsXCJlbnN1cmluZ1wiLFwiaGlzcGFuaWNcIixcImN2XCIsXCJjYlwiLFwibGVnaXNsYXR1cmVcIixcImhvc3BpdGFsaXR5XCIsXCJnZW5cIixcImFueWJvZHlcIixcInByb2N1cmVtZW50XCIsXCJkaWFtb25kc1wiLFwiZXNwblwiLFwiZmxlZXRcIixcInVudGl0bGVkXCIsXCJidW5jaFwiLFwidG90YWxzXCIsXCJtYXJyaW90dFwiLFwic2luZ2luZ1wiLFwidGhlb3JldGljYWxcIixcImFmZm9yZFwiLFwiZXhlcmNpc2VzXCIsXCJzdGFycmluZ1wiLFwicmVmZXJyYWxcIixcIm5obFwiLFwic3VydmVpbGxhbmNlXCIsXCJvcHRpbWFsXCIsXCJxdWl0XCIsXCJkaXN0aW5jdFwiLFwicHJvdG9jb2xzXCIsXCJsdW5nXCIsXCJoaWdobGlnaHRcIixcInN1YnN0aXR1dGVcIixcImluY2x1c2lvblwiLFwiaG9wZWZ1bGx5XCIsXCJicmlsbGlhbnRcIixcInR1cm5lclwiLFwic3Vja2luZ1wiLFwiY2VudHNcIixcInJldXRlcnNcIixcInRpXCIsXCJmY1wiLFwiZ2VsXCIsXCJ0b2RkXCIsXCJzcG9rZW5cIixcIm9tZWdhXCIsXCJldmFsdWF0ZWRcIixcInN0YXllZFwiLFwiY2l2aWNcIixcImFzc2lnbm1lbnRzXCIsXCJmd1wiLFwibWFudWFsc1wiLFwiZG91Z1wiLFwic2Vlc1wiLFwidGVybWluYXRpb25cIixcIndhdGNoZWRcIixcInNhdmVyXCIsXCJ0aGVyZW9mXCIsXCJncmlsbFwiLFwiaG91c2Vob2xkc1wiLFwiZ3NcIixcInJlZGVlbVwiLFwicm9nZXJzXCIsXCJncmFpblwiLFwiYWFhXCIsXCJhdXRoZW50aWNcIixcInJlZ2ltZVwiLFwid2FubmFcIixcIndpc2hlc1wiLFwiYnVsbFwiLFwibW9udGdvbWVyeVwiLFwiYXJjaGl0ZWN0dXJhbFwiLFwibG91aXN2aWxsZVwiLFwiZGVwZW5kXCIsXCJkaWZmZXJcIixcIm1hY2ludG9zaFwiLFwibW92ZW1lbnRzXCIsXCJyYW5naW5nXCIsXCJtb25pY2FcIixcInJlcGFpcnNcIixcImJyZWF0aFwiLFwiYW1lbml0aWVzXCIsXCJ2aXJ0dWFsbHlcIixcImNvbGVcIixcIm1hcnRcIixcImNhbmRsZVwiLFwiaGFuZ2luZ1wiLFwiY29sb3JlZFwiLFwiYXV0aG9yaXphdGlvblwiLFwidGFsZVwiLFwidmVyaWZpZWRcIixcImx5bm5cIixcImZvcm1lcmx5XCIsXCJwcm9qZWN0b3JcIixcImJwXCIsXCJzaXR1YXRlZFwiLFwiY29tcGFyYXRpdmVcIixcInN0ZFwiLFwic2Vla3NcIixcImhlcmJhbFwiLFwibG92aW5nXCIsXCJzdHJpY3RseVwiLFwicm91dGluZ1wiLFwiZG9jc1wiLFwic3RhbmxleVwiLFwicHN5Y2hvbG9naWNhbFwiLFwic3VycHJpc2VkXCIsXCJyZXRhaWxlclwiLFwidml0YW1pbnNcIixcImVsZWdhbnRcIixcImdhaW5zXCIsXCJyZW5ld2FsXCIsXCJ2aWRcIixcImdlbmVhbG9neVwiLFwib3Bwb3NlZFwiLFwiZGVlbWVkXCIsXCJzY29yaW5nXCIsXCJleHBlbmRpdHVyZVwiLFwiYnJvb2tseW5cIixcImxpdmVycG9vbFwiLFwic2lzdGVyc1wiLFwiY3JpdGljc1wiLFwiY29ubmVjdGl2aXR5XCIsXCJzcG90c1wiLFwib29cIixcImFsZ29yaXRobXNcIixcImhhY2tlclwiLFwibWFkcmlkXCIsXCJzaW1pbGFybHlcIixcIm1hcmdpblwiLFwiY29pblwiLFwic29sZWx5XCIsXCJmYWtlXCIsXCJzYWxvblwiLFwiY29sbGFib3JhdGl2ZVwiLFwibm9ybWFuXCIsXCJmZGFcIixcImV4Y2x1ZGluZ1wiLFwidHVyYm9cIixcImhlYWRlZFwiLFwidm90ZXJzXCIsXCJjdXJlXCIsXCJtYWRvbm5hXCIsXCJjb21tYW5kZXJcIixcImFyY2hcIixcIm5pXCIsXCJtdXJwaHlcIixcInRoaW5rc1wiLFwidGhhdHNcIixcInN1Z2dlc3Rpb25cIixcImhkdHZcIixcInNvbGRpZXJcIixcInBoaWxsaXBzXCIsXCJhc2luXCIsXCJhaW1lZFwiLFwianVzdGluXCIsXCJib21iXCIsXCJoYXJtXCIsXCJpbnRlcnZhbFwiLFwibWlycm9yc1wiLFwic3BvdGxpZ2h0XCIsXCJ0cmlja3NcIixcInJlc2V0XCIsXCJicnVzaFwiLFwiaW52ZXN0aWdhdGVcIixcInRoeVwiLFwiZXhwYW5zeXNcIixcInBhbmVsc1wiLFwicmVwZWF0ZWRcIixcImFzc2F1bHRcIixcImNvbm5lY3RpbmdcIixcInNwYXJlXCIsXCJsb2dpc3RpY3NcIixcImRlZXJcIixcImtvZGFrXCIsXCJ0b25ndWVcIixcImJvd2xpbmdcIixcInRyaVwiLFwiZGFuaXNoXCIsXCJwYWxcIixcIm1vbmtleVwiLFwicHJvcG9ydGlvblwiLFwiZmlsZW5hbWVcIixcInNraXJ0XCIsXCJmbG9yZW5jZVwiLFwiaW52ZXN0XCIsXCJob25leVwiLFwidW1cIixcImFuYWx5c2VzXCIsXCJkcmF3aW5nc1wiLFwic2lnbmlmaWNhbmNlXCIsXCJzY2VuYXJpb1wiLFwieWVcIixcImZzXCIsXCJsb3ZlcnNcIixcImF0b21pY1wiLFwiYXBwcm94XCIsXCJzeW1wb3NpdW1cIixcImFyYWJpY1wiLFwiZ2F1Z2VcIixcImVzc2VudGlhbHNcIixcImp1bmN0aW9uXCIsXCJwcm90ZWN0aW5nXCIsXCJublwiLFwiZmFjZWRcIixcIm1hdFwiLFwicmFjaGVsXCIsXCJzb2x2aW5nXCIsXCJ0cmFuc21pdHRlZFwiLFwid2Vla2VuZHNcIixcInNjcmVlbnNob3RzXCIsXCJwcm9kdWNlc1wiLFwib3ZlblwiLFwidGVkXCIsXCJpbnRlbnNpdmVcIixcImNoYWluc1wiLFwia2luZ3N0b25cIixcInNpeHRoXCIsXCJlbmdhZ2VcIixcImRldmlhbnRcIixcIm5vb25cIixcInN3aXRjaGluZ1wiLFwicXVvdGVkXCIsXCJhZGFwdGVyc1wiLFwiY29ycmVzcG9uZGVuY2VcIixcImZhcm1zXCIsXCJpbXBvcnRzXCIsXCJzdXBlcnZpc2lvblwiLFwiY2hlYXRcIixcImJyb256ZVwiLFwiZXhwZW5kaXR1cmVzXCIsXCJzYW5keVwiLFwic2VwYXJhdGlvblwiLFwidGVzdGltb255XCIsXCJzdXNwZWN0XCIsXCJjZWxlYnJpdGllc1wiLFwibWFjcm9cIixcInNlbmRlclwiLFwibWFuZGF0b3J5XCIsXCJib3VuZGFyaWVzXCIsXCJjcnVjaWFsXCIsXCJzeW5kaWNhdGlvblwiLFwiZ3ltXCIsXCJjZWxlYnJhdGlvblwiLFwia2RlXCIsXCJhZGphY2VudFwiLFwiZmlsdGVyaW5nXCIsXCJ0dWl0aW9uXCIsXCJzcG91c2VcIixcImV4b3RpY1wiLFwidmlld2VyXCIsXCJzaWdudXBcIixcInRocmVhdHNcIixcImx1eGVtYm91cmdcIixcInB1enpsZXNcIixcInJlYWNoaW5nXCIsXCJ2YlwiLFwiZGFtYWdlZFwiLFwiY2Ftc1wiLFwicmVjZXB0b3JcIixcImxhdWdoXCIsXCJqb2VsXCIsXCJzdXJnaWNhbFwiLFwiZGVzdHJveVwiLFwiY2l0YXRpb25cIixcInBpdGNoXCIsXCJhdXRvc1wiLFwieW9cIixcInByZW1pc2VzXCIsXCJwZXJyeVwiLFwicHJvdmVkXCIsXCJvZmZlbnNpdmVcIixcImltcGVyaWFsXCIsXCJkb3plblwiLFwiYmVuamFtaW5cIixcImRlcGxveW1lbnRcIixcInRlZXRoXCIsXCJjbG90aFwiLFwic3R1ZHlpbmdcIixcImNvbGxlYWd1ZXNcIixcInN0YW1wXCIsXCJsb3R1c1wiLFwic2FsbW9uXCIsXCJvbHltcHVzXCIsXCJzZXBhcmF0ZWRcIixcInByb2NcIixcImNhcmdvXCIsXCJ0YW5cIixcImRpcmVjdGl2ZVwiLFwiZnhcIixcInNhbGVtXCIsXCJtYXRlXCIsXCJkbFwiLFwic3RhcnRlclwiLFwidXBncmFkZXNcIixcImxpa2VzXCIsXCJidXR0ZXJcIixcInBlcHBlclwiLFwid2VhcG9uXCIsXCJsdWdnYWdlXCIsXCJidXJkZW5cIixcImNoZWZcIixcInRhcGVzXCIsXCJ6b25lc1wiLFwicmFjZXNcIixcImlzbGVcIixcInN0eWxpc2hcIixcInNsaW1cIixcIm1hcGxlXCIsXCJsdWtlXCIsXCJncm9jZXJ5XCIsXCJvZmZzaG9yZVwiLFwiZ292ZXJuaW5nXCIsXCJyZXRhaWxlcnNcIixcImRlcG90XCIsXCJrZW5uZXRoXCIsXCJjb21wXCIsXCJhbHRcIixcInBpZVwiLFwiYmxlbmRcIixcImhhcnJpc29uXCIsXCJsc1wiLFwianVsaWVcIixcIm9jY2FzaW9uYWxseVwiLFwiY2JzXCIsXCJhdHRlbmRpbmdcIixcImVtaXNzaW9uXCIsXCJwZXRlXCIsXCJzcGVjXCIsXCJmaW5lc3RcIixcInJlYWx0eVwiLFwiamFuZXRcIixcImJvd1wiLFwicGVublwiLFwicmVjcnVpdGluZ1wiLFwiYXBwYXJlbnRcIixcImluc3RydWN0aW9uYWxcIixcInBocGJiXCIsXCJhdXR1bW5cIixcInRyYXZlbGluZ1wiLFwicHJvYmVcIixcIm1pZGlcIixcInBlcm1pc3Npb25zXCIsXCJiaW90ZWNobm9sb2d5XCIsXCJ0b2lsZXRcIixcInJhbmtlZFwiLFwiamFja2V0c1wiLFwicm91dGVzXCIsXCJwYWNrZWRcIixcImV4Y2l0ZWRcIixcIm91dHJlYWNoXCIsXCJoZWxlblwiLFwibW91bnRpbmdcIixcInJlY292ZXJcIixcInRpZWRcIixcImxvcGV6XCIsXCJiYWxhbmNlZFwiLFwicHJlc2NyaWJlZFwiLFwiY2F0aGVyaW5lXCIsXCJ0aW1lbHlcIixcInRhbGtlZFwiLFwidXBza2lydHNcIixcImRlYnVnXCIsXCJkZWxheWVkXCIsXCJjaHVja1wiLFwicmVwcm9kdWNlZFwiLFwiaG9uXCIsXCJkYWxlXCIsXCJleHBsaWNpdFwiLFwiY2FsY3VsYXRpb25cIixcInZpbGxhc1wiLFwiZWJvb2tcIixcImNvbnNvbGlkYXRlZFwiLFwiZXhjbHVkZVwiLFwicGVlaW5nXCIsXCJvY2Nhc2lvbnNcIixcImJyb29rc1wiLFwiZXF1YXRpb25zXCIsXCJuZXd0b25cIixcIm9pbHNcIixcInNlcHRcIixcImV4Y2VwdGlvbmFsXCIsXCJhbnhpZXR5XCIsXCJiaW5nb1wiLFwid2hpbHN0XCIsXCJzcGF0aWFsXCIsXCJyZXNwb25kZW50c1wiLFwidW50b1wiLFwibHRcIixcImNlcmFtaWNcIixcInByb21wdFwiLFwicHJlY2lvdXNcIixcIm1pbmRzXCIsXCJhbm51YWxseVwiLFwiY29uc2lkZXJhdGlvbnNcIixcInNjYW5uZXJzXCIsXCJhdG1cIixcInhhbmF4XCIsXCJlcVwiLFwicGF5c1wiLFwiZmluZ2Vyc1wiLFwic3VubnlcIixcImVib29rc1wiLFwiZGVsaXZlcnNcIixcImplXCIsXCJxdWVlbnNsYW5kXCIsXCJuZWNrbGFjZVwiLFwibXVzaWNpYW5zXCIsXCJsZWVkc1wiLFwiY29tcG9zaXRlXCIsXCJ1bmF2YWlsYWJsZVwiLFwiY2VkYXJcIixcImFycmFuZ2VkXCIsXCJsYW5nXCIsXCJ0aGVhdGVyc1wiLFwiYWR2b2NhY3lcIixcInJhbGVpZ2hcIixcInN0dWRcIixcImZvbGRcIixcImVzc2VudGlhbGx5XCIsXCJkZXNpZ25pbmdcIixcInRocmVhZGVkXCIsXCJ1dlwiLFwicXVhbGlmeVwiLFwiYmxhaXJcIixcImhvcGVzXCIsXCJhc3Nlc3NtZW50c1wiLFwiY21zXCIsXCJtYXNvblwiLFwiZGlhZ3JhbVwiLFwiYnVybnNcIixcInB1bXBzXCIsXCJmb290d2VhclwiLFwic2dcIixcInZpY1wiLFwiYmVpamluZ1wiLFwicGVvcGxlc1wiLFwidmljdG9yXCIsXCJtYXJpb1wiLFwicG9zXCIsXCJhdHRhY2hcIixcImxpY2Vuc2VzXCIsXCJ1dGlsc1wiLFwicmVtb3ZpbmdcIixcImFkdmlzZWRcIixcImJydW5zd2lja1wiLFwic3BpZGVyXCIsXCJwaHlzXCIsXCJyYW5nZXNcIixcInBhaXJzXCIsXCJzZW5zaXRpdml0eVwiLFwidHJhaWxzXCIsXCJwcmVzZXJ2YXRpb25cIixcImh1ZHNvblwiLFwiaXNvbGF0ZWRcIixcImNhbGdhcnlcIixcImludGVyaW1cIixcImFzc2lzdGVkXCIsXCJkaXZpbmVcIixcInN0cmVhbWluZ1wiLFwiYXBwcm92ZVwiLFwiY2hvc2VcIixcImNvbXBvdW5kXCIsXCJpbnRlbnNpdHlcIixcInRlY2hub2xvZ2ljYWxcIixcInN5bmRpY2F0ZVwiLFwiYWJvcnRpb25cIixcImRpYWxvZ1wiLFwidmVudWVzXCIsXCJibGFzdFwiLFwid2VsbG5lc3NcIixcImNhbGNpdW1cIixcIm5ld3BvcnRcIixcImFudGl2aXJ1c1wiLFwiYWRkcmVzc2luZ1wiLFwicG9sZVwiLFwiZGlzY291bnRlZFwiLFwiaW5kaWFuc1wiLFwic2hpZWxkXCIsXCJoYXJ2ZXN0XCIsXCJtZW1icmFuZVwiLFwicHJhZ3VlXCIsXCJwcmV2aWV3c1wiLFwiYmFuZ2xhZGVzaFwiLFwiY29uc3RpdHV0ZVwiLFwibG9jYWxseVwiLFwiY29uY2x1ZGVkXCIsXCJwaWNrdXBcIixcImRlc3BlcmF0ZVwiLFwibW90aGVyc1wiLFwibmFzY2FyXCIsXCJpY2VsYW5kXCIsXCJkZW1vbnN0cmF0aW9uXCIsXCJnb3Zlcm5tZW50YWxcIixcIm1hbnVmYWN0dXJlZFwiLFwiY2FuZGxlc1wiLFwiZ3JhZHVhdGlvblwiLFwibWVnYVwiLFwiYmVuZFwiLFwic2FpbGluZ1wiLFwidmFyaWF0aW9uc1wiLFwibW9tc1wiLFwic2FjcmVkXCIsXCJhZGRpY3Rpb25cIixcIm1vcm9jY29cIixcImNocm9tZVwiLFwidG9tbXlcIixcInNwcmluZ2ZpZWxkXCIsXCJyZWZ1c2VkXCIsXCJicmFrZVwiLFwiZXh0ZXJpb3JcIixcImdyZWV0aW5nXCIsXCJlY29sb2d5XCIsXCJvbGl2ZXJcIixcImNvbmdvXCIsXCJnbGVuXCIsXCJib3Rzd2FuYVwiLFwibmF2XCIsXCJkZWxheXNcIixcInN5bnRoZXNpc1wiLFwib2xpdmVcIixcInVuZGVmaW5lZFwiLFwidW5lbXBsb3ltZW50XCIsXCJjeWJlclwiLFwidmVyaXpvblwiLFwic2NvcmVkXCIsXCJlbmhhbmNlbWVudFwiLFwibmV3Y2FzdGxlXCIsXCJjbG9uZVwiLFwiZGlja3NcIixcInZlbG9jaXR5XCIsXCJsYW1iZGFcIixcInJlbGF5XCIsXCJjb21wb3NlZFwiLFwidGVhcnNcIixcInBlcmZvcm1hbmNlc1wiLFwib2FzaXNcIixcImJhc2VsaW5lXCIsXCJjYWJcIixcImFuZ3J5XCIsXCJmYVwiLFwic29jaWV0aWVzXCIsXCJzaWxpY29uXCIsXCJicmF6aWxpYW5cIixcImlkZW50aWNhbFwiLFwicGV0cm9sZXVtXCIsXCJjb21wZXRlXCIsXCJpc3RcIixcIm5vcndlZ2lhblwiLFwibG92ZXJcIixcImJlbG9uZ1wiLFwiaG9ub2x1bHVcIixcImJlYXRsZXNcIixcImxpcHNcIixcInJldGVudGlvblwiLFwiZXhjaGFuZ2VzXCIsXCJwb25kXCIsXCJyb2xsc1wiLFwidGhvbXNvblwiLFwiYmFybmVzXCIsXCJzb3VuZHRyYWNrXCIsXCJ3b25kZXJpbmdcIixcIm1hbHRhXCIsXCJkYWRkeVwiLFwibGNcIixcImZlcnJ5XCIsXCJyYWJiaXRcIixcInByb2Zlc3Npb25cIixcInNlYXRpbmdcIixcImRhbVwiLFwiY25uXCIsXCJzZXBhcmF0ZWx5XCIsXCJwaHlzaW9sb2d5XCIsXCJsaWxcIixcImNvbGxlY3RpbmdcIixcImRhc1wiLFwiZXhwb3J0c1wiLFwib21haGFcIixcInRpcmVcIixcInBhcnRpY2lwYW50XCIsXCJzY2hvbGFyc2hpcHNcIixcInJlY3JlYXRpb25hbFwiLFwiZG9taW5pY2FuXCIsXCJjaGFkXCIsXCJlbGVjdHJvblwiLFwibG9hZHNcIixcImZyaWVuZHNoaXBcIixcImhlYXRoZXJcIixcInBhc3Nwb3J0XCIsXCJtb3RlbFwiLFwidW5pb25zXCIsXCJ0cmVhc3VyeVwiLFwid2FycmFudFwiLFwic3lzXCIsXCJzb2xhcmlzXCIsXCJmcm96ZW5cIixcIm9jY3VwaWVkXCIsXCJqb3NoXCIsXCJyb3lhbHR5XCIsXCJzY2FsZXNcIixcInJhbGx5XCIsXCJvYnNlcnZlclwiLFwic3Vuc2hpbmVcIixcInN0cmFpblwiLFwiZHJhZ1wiLFwiY2VyZW1vbnlcIixcInNvbWVob3dcIixcImFycmVzdGVkXCIsXCJleHBhbmRpbmdcIixcInByb3ZpbmNpYWxcIixcImludmVzdGlnYXRpb25zXCIsXCJpY3FcIixcInJpcGVcIixcInlhbWFoYVwiLFwicmVseVwiLFwibWVkaWNhdGlvbnNcIixcImhlYnJld1wiLFwiZ2FpbmVkXCIsXCJyb2NoZXN0ZXJcIixcImR5aW5nXCIsXCJsYXVuZHJ5XCIsXCJzdHVja1wiLFwic29sb21vblwiLFwicGxhY2luZ1wiLFwic3RvcHNcIixcImhvbWV3b3JrXCIsXCJhZGp1c3RcIixcImFzc2Vzc2VkXCIsXCJhZHZlcnRpc2VyXCIsXCJlbmFibGluZ1wiLFwiZW5jcnlwdGlvblwiLFwiZmlsbGluZ1wiLFwiZG93bmxvYWRhYmxlXCIsXCJzb3BoaXN0aWNhdGVkXCIsXCJpbXBvc2VkXCIsXCJzaWxlbmNlXCIsXCJzY3NpXCIsXCJmb2N1c2VzXCIsXCJzb3ZpZXRcIixcInBvc3Nlc3Npb25cIixcImN1XCIsXCJsYWJvcmF0b3JpZXNcIixcInRyZWF0eVwiLFwidm9jYWxcIixcInRyYWluZXJcIixcIm9yZ2FuXCIsXCJzdHJvbmdlclwiLFwidm9sdW1lc1wiLFwiYWR2YW5jZXNcIixcInZlZ2V0YWJsZXNcIixcImxlbW9uXCIsXCJ0b3hpY1wiLFwiZG5zXCIsXCJ0aHVtYm5haWxzXCIsXCJkYXJrbmVzc1wiLFwicHR5XCIsXCJ3c1wiLFwibnV0c1wiLFwibmFpbFwiLFwiYml6cmF0ZVwiLFwidmllbm5hXCIsXCJpbXBsaWVkXCIsXCJzcGFuXCIsXCJzdGFuZm9yZFwiLFwic294XCIsXCJzdG9ja2luZ3NcIixcImpva2VcIixcInJlc3BvbmRlbnRcIixcInBhY2tpbmdcIixcInN0YXR1dGVcIixcInJlamVjdGVkXCIsXCJzYXRpc2Z5XCIsXCJkZXN0cm95ZWRcIixcInNoZWx0ZXJcIixcImNoYXBlbFwiLFwiZ2FtZXNwb3RcIixcIm1hbnVmYWN0dXJlXCIsXCJsYXllcnNcIixcIndvcmRwcmVzc1wiLFwiZ3VpZGVkXCIsXCJ2dWxuZXJhYmlsaXR5XCIsXCJhY2NvdW50YWJpbGl0eVwiLFwiY2VsZWJyYXRlXCIsXCJhY2NyZWRpdGVkXCIsXCJhcHBsaWFuY2VcIixcImNvbXByZXNzZWRcIixcImJhaGFtYXNcIixcInBvd2VsbFwiLFwibWl4dHVyZVwiLFwiYmVuY2hcIixcInVuaXZcIixcInR1YlwiLFwicmlkZXJcIixcInNjaGVkdWxpbmdcIixcInJhZGl1c1wiLFwicGVyc3BlY3RpdmVzXCIsXCJtb3J0YWxpdHlcIixcImxvZ2dpbmdcIixcImhhbXB0b25cIixcImNocmlzdGlhbnNcIixcImJvcmRlcnNcIixcInRoZXJhcGV1dGljXCIsXCJwYWRzXCIsXCJidXR0c1wiLFwiaW5uc1wiLFwiYm9iYnlcIixcImltcHJlc3NpdmVcIixcInNoZWVwXCIsXCJhY2NvcmRpbmdseVwiLFwiYXJjaGl0ZWN0XCIsXCJyYWlscm9hZFwiLFwibGVjdHVyZXNcIixcImNoYWxsZW5naW5nXCIsXCJ3aW5lc1wiLFwibnVyc2VyeVwiLFwiaGFyZGVyXCIsXCJjdXBzXCIsXCJhc2hcIixcIm1pY3Jvd2F2ZVwiLFwiY2hlYXBlc3RcIixcImFjY2lkZW50c1wiLFwidHJhdmVzdGlcIixcInJlbG9jYXRpb25cIixcInN0dWFydFwiLFwiY29udHJpYnV0b3JzXCIsXCJzYWx2YWRvclwiLFwiYWxpXCIsXCJzYWxhZFwiLFwibnBcIixcIm1vbnJvZVwiLFwidGVuZGVyXCIsXCJ2aW9sYXRpb25zXCIsXCJmb2FtXCIsXCJ0ZW1wZXJhdHVyZXNcIixcInBhc3RlXCIsXCJjbG91ZHNcIixcImNvbXBldGl0aW9uc1wiLFwiZGlzY3JldGlvblwiLFwidGZ0XCIsXCJ0YW56YW5pYVwiLFwicHJlc2VydmVcIixcImp2Y1wiLFwicG9lbVwiLFwidW5zaWduZWRcIixcInN0YXlpbmdcIixcImNvc21ldGljc1wiLFwiZWFzdGVyXCIsXCJ0aGVvcmllc1wiLFwicmVwb3NpdG9yeVwiLFwicHJhaXNlXCIsXCJqZXJlbXlcIixcInZlbmljZVwiLFwiam9cIixcImNvbmNlbnRyYXRpb25zXCIsXCJ2aWJyYXRvcnNcIixcImVzdG9uaWFcIixcImNocmlzdGlhbml0eVwiLFwidmV0ZXJhblwiLFwic3RyZWFtc1wiLFwibGFuZGluZ1wiLFwic2lnbmluZ1wiLFwiZXhlY3V0ZWRcIixcImthdGllXCIsXCJuZWdvdGlhdGlvbnNcIixcInJlYWxpc3RpY1wiLFwiZHRcIixcImNnaVwiLFwic2hvd2Nhc2VcIixcImludGVncmFsXCIsXCJhc2tzXCIsXCJyZWxheFwiLFwibmFtaWJpYVwiLFwiZ2VuZXJhdGluZ1wiLFwiY2hyaXN0aW5hXCIsXCJjb25ncmVzc2lvbmFsXCIsXCJzeW5vcHNpc1wiLFwiaGFyZGx5XCIsXCJwcmFpcmllXCIsXCJyZXVuaW9uXCIsXCJjb21wb3NlclwiLFwiYmVhblwiLFwic3dvcmRcIixcImFic2VudFwiLFwicGhvdG9ncmFwaGljXCIsXCJzZWxsc1wiLFwiZWN1YWRvclwiLFwiaG9waW5nXCIsXCJhY2Nlc3NlZFwiLFwic3Bpcml0c1wiLFwibW9kaWZpY2F0aW9uc1wiLFwiY29yYWxcIixcInBpeGVsXCIsXCJmbG9hdFwiLFwiY29saW5cIixcImJpYXNcIixcImltcG9ydGVkXCIsXCJwYXRoc1wiLFwiYnViYmxlXCIsXCJwb3JcIixcImFjcXVpcmVcIixcImNvbnRyYXJ5XCIsXCJtaWxsZW5uaXVtXCIsXCJ0cmlidW5lXCIsXCJ2ZXNzZWxcIixcImFjaWRzXCIsXCJmb2N1c2luZ1wiLFwidmlydXNlc1wiLFwiY2hlYXBlclwiLFwiYWRtaXR0ZWRcIixcImRhaXJ5XCIsXCJhZG1pdFwiLFwibWVtXCIsXCJmYW5jeVwiLFwiZXF1YWxpdHlcIixcInNhbW9hXCIsXCJnY1wiLFwiYWNoaWV2aW5nXCIsXCJ0YXBcIixcInN0aWNrZXJzXCIsXCJmaXNoZXJpZXNcIixcImV4Y2VwdGlvbnNcIixcInJlYWN0aW9uc1wiLFwibGVhc2luZ1wiLFwibGF1cmVuXCIsXCJiZWxpZWZzXCIsXCJjaVwiLFwibWFjcm9tZWRpYVwiLFwiY29tcGFuaW9uXCIsXCJzcXVhZFwiLFwiYW5hbHl6ZVwiLFwiYXNobGV5XCIsXCJzY3JvbGxcIixcInJlbGF0ZVwiLFwiZGl2aXNpb25zXCIsXCJzd2ltXCIsXCJ3YWdlc1wiLFwiYWRkaXRpb25hbGx5XCIsXCJzdWZmZXJcIixcImZvcmVzdHNcIixcImZlbGxvd3NoaXBcIixcIm5hbm9cIixcImludmFsaWRcIixcImNvbmNlcnRzXCIsXCJtYXJ0aWFsXCIsXCJtYWxlc1wiLFwidmljdG9yaWFuXCIsXCJyZXRhaW5cIixcImNvbG91cnNcIixcImV4ZWN1dGVcIixcInR1bm5lbFwiLFwiZ2VucmVzXCIsXCJjYW1ib2RpYVwiLFwicGF0ZW50c1wiLFwiY29weXJpZ2h0c1wiLFwieW5cIixcImNoYW9zXCIsXCJsaXRodWFuaWFcIixcIm1hc3RlcmNhcmRcIixcIndoZWF0XCIsXCJjaHJvbmljbGVzXCIsXCJvYnRhaW5pbmdcIixcImJlYXZlclwiLFwidXBkYXRpbmdcIixcImRpc3RyaWJ1dGVcIixcInJlYWRpbmdzXCIsXCJkZWNvcmF0aXZlXCIsXCJraWppamlcIixcImNvbmZ1c2VkXCIsXCJjb21waWxlclwiLFwiZW5sYXJnZW1lbnRcIixcImVhZ2xlc1wiLFwiYmFzZXNcIixcInZpaVwiLFwiYWNjdXNlZFwiLFwiYmVlXCIsXCJjYW1wYWlnbnNcIixcInVuaXR5XCIsXCJsb3VkXCIsXCJjb25qdW5jdGlvblwiLFwiYnJpZGVcIixcInJhdHNcIixcImRlZmluZXNcIixcImFpcnBvcnRzXCIsXCJpbnN0YW5jZXNcIixcImluZGlnZW5vdXNcIixcImJlZ3VuXCIsXCJjZnJcIixcImJydW5ldHRlXCIsXCJwYWNrZXRzXCIsXCJhbmNob3JcIixcInNvY2tzXCIsXCJ2YWxpZGF0aW9uXCIsXCJwYXJhZGVcIixcImNvcnJ1cHRpb25cIixcInN0YXRcIixcInRyaWdnZXJcIixcImluY2VudGl2ZXNcIixcImNob2xlc3Rlcm9sXCIsXCJnYXRoZXJlZFwiLFwiZXNzZXhcIixcInNsb3ZlbmlhXCIsXCJub3RpZmllZFwiLFwiZGlmZmVyZW50aWFsXCIsXCJiZWFjaGVzXCIsXCJmb2xkZXJzXCIsXCJkcmFtYXRpY1wiLFwic3VyZmFjZXNcIixcInRlcnJpYmxlXCIsXCJyb3V0ZXJzXCIsXCJjcnV6XCIsXCJwZW5kYW50XCIsXCJkcmVzc2VzXCIsXCJiYXB0aXN0XCIsXCJzY2llbnRpc3RcIixcInN0YXJzbWVyY2hhbnRcIixcImhpcmluZ1wiLFwiY2xvY2tzXCIsXCJhcnRocml0aXNcIixcImJpb3NcIixcImZlbWFsZXNcIixcIndhbGxhY2VcIixcIm5ldmVydGhlbGVzc1wiLFwicmVmbGVjdHNcIixcInRheGF0aW9uXCIsXCJmZXZlclwiLFwicG1jXCIsXCJjdWlzaW5lXCIsXCJzdXJlbHlcIixcInByYWN0aXRpb25lcnNcIixcInRyYW5zY3JpcHRcIixcIm15c3BhY2VcIixcInRoZW9yZW1cIixcImluZmxhdGlvblwiLFwidGhlZVwiLFwibmJcIixcInJ1dGhcIixcInByYXlcIixcInN0eWx1c1wiLFwiY29tcG91bmRzXCIsXCJwb3BlXCIsXCJkcnVtc1wiLFwiY29udHJhY3RpbmdcIixcImFybm9sZFwiLFwic3RydWN0dXJlZFwiLFwicmVhc29uYWJseVwiLFwiamVlcFwiLFwiY2hpY2tzXCIsXCJiYXJlXCIsXCJodW5nXCIsXCJjYXR0bGVcIixcIm1iYVwiLFwicmFkaWNhbFwiLFwiZ3JhZHVhdGVzXCIsXCJyb3ZlclwiLFwicmVjb21tZW5kc1wiLFwiY29udHJvbGxpbmdcIixcInRyZWFzdXJlXCIsXCJyZWxvYWRcIixcImRpc3RyaWJ1dG9yc1wiLFwiZmxhbWVcIixcImxldml0cmFcIixcInRhbmtzXCIsXCJhc3N1bWluZ1wiLFwibW9uZXRhcnlcIixcImVsZGVybHlcIixcInBpdFwiLFwiYXJsaW5ndG9uXCIsXCJtb25vXCIsXCJwYXJ0aWNsZXNcIixcImZsb2F0aW5nXCIsXCJleHRyYW9yZGluYXJ5XCIsXCJ0aWxlXCIsXCJpbmRpY2F0aW5nXCIsXCJib2xpdmlhXCIsXCJzcGVsbFwiLFwiaG90dGVzdFwiLFwic3RldmVuc1wiLFwiY29vcmRpbmF0ZVwiLFwia3V3YWl0XCIsXCJleGNsdXNpdmVseVwiLFwiZW1pbHlcIixcImFsbGVnZWRcIixcImxpbWl0YXRpb25cIixcIndpZGVzY3JlZW5cIixcImNvbXBpbGVcIixcInNxdWlydGluZ1wiLFwid2Vic3RlclwiLFwic3RydWNrXCIsXCJyeFwiLFwiaWxsdXN0cmF0aW9uXCIsXCJwbHltb3V0aFwiLFwid2FybmluZ3NcIixcImNvbnN0cnVjdFwiLFwiYXBwc1wiLFwiaW5xdWlyaWVzXCIsXCJicmlkYWxcIixcImFubmV4XCIsXCJtYWdcIixcImdzbVwiLFwiaW5zcGlyYXRpb25cIixcInRyaWJhbFwiLFwiY3VyaW91c1wiLFwiYWZmZWN0aW5nXCIsXCJmcmVpZ2h0XCIsXCJyZWJhdGVcIixcIm1lZXR1cFwiLFwiZWNsaXBzZVwiLFwic3VkYW5cIixcImRkclwiLFwiZG93bmxvYWRpbmdcIixcInJlY1wiLFwic2h1dHRsZVwiLFwiYWdncmVnYXRlXCIsXCJzdHVubmluZ1wiLFwiY3ljbGVzXCIsXCJhZmZlY3RzXCIsXCJmb3JlY2FzdHNcIixcImRldGVjdFwiLFwiYWN0aXZlbHlcIixcImNpYW9cIixcImFtcGxhbmRcIixcImtuZWVcIixcInByZXBcIixcInBiXCIsXCJjb21wbGljYXRlZFwiLFwiY2hlbVwiLFwiZmFzdGVzdFwiLFwiYnV0bGVyXCIsXCJzaG9wemlsbGFcIixcImluanVyZWRcIixcImRlY29yYXRpbmdcIixcInBheXJvbGxcIixcImNvb2tib29rXCIsXCJleHByZXNzaW9uc1wiLFwidG9uXCIsXCJjb3VyaWVyXCIsXCJ1cGxvYWRlZFwiLFwic2hha2VzcGVhcmVcIixcImhpbnRzXCIsXCJjb2xsYXBzZVwiLFwiYW1lcmljYXNcIixcImNvbm5lY3RvcnNcIixcInR3aW5rc1wiLFwidW5saWtlbHlcIixcIm9lXCIsXCJnaWZcIixcInByb3NcIixcImNvbmZsaWN0c1wiLFwidGVjaG5vXCIsXCJiZXZlcmFnZVwiLFwidHJpYnV0ZVwiLFwid2lyZWRcIixcImVsdmlzXCIsXCJpbW11bmVcIixcImxhdHZpYVwiLFwidHJhdmVsZXJzXCIsXCJmb3Jlc3RyeVwiLFwiYmFycmllcnNcIixcImNhbnRcIixcImpkXCIsXCJyYXJlbHlcIixcImdwbFwiLFwiaW5mZWN0ZWRcIixcIm9mZmVyaW5nc1wiLFwibWFydGhhXCIsXCJnZW5lc2lzXCIsXCJiYXJyaWVyXCIsXCJhcmd1ZVwiLFwiaW5jb3JyZWN0XCIsXCJ0cmFpbnNcIixcIm1ldGFsc1wiLFwiYmljeWNsZVwiLFwiZnVybmlzaGluZ3NcIixcImxldHRpbmdcIixcImFyaXNlXCIsXCJndWF0ZW1hbGFcIixcImNlbHRpY1wiLFwidGhlcmVieVwiLFwiaXJjXCIsXCJqYW1pZVwiLFwicGFydGljbGVcIixcInBlcmNlcHRpb25cIixcIm1pbmVyYWxzXCIsXCJhZHZpc2VcIixcImh1bWlkaXR5XCIsXCJib3R0bGVzXCIsXCJib3hpbmdcIixcInd5XCIsXCJkbVwiLFwiYmFuZ2tva1wiLFwicmVuYWlzc2FuY2VcIixcInBhdGhvbG9neVwiLFwic2FyYVwiLFwiYnJhXCIsXCJvcmRpbmFuY2VcIixcImh1Z2hlc1wiLFwicGhvdG9ncmFwaGVyc1wiLFwiaW5mZWN0aW9uc1wiLFwiamVmZnJleVwiLFwiY2hlc3NcIixcIm9wZXJhdGVzXCIsXCJicmlzYmFuZVwiLFwiY29uZmlndXJlZFwiLFwic3Vydml2ZVwiLFwib3NjYXJcIixcImZlc3RpdmFsc1wiLFwibWVudXNcIixcImpvYW5cIixcInBvc3NpYmlsaXRpZXNcIixcImR1Y2tcIixcInJldmVhbFwiLFwiY2FuYWxcIixcImFtaW5vXCIsXCJwaGlcIixcImNvbnRyaWJ1dGluZ1wiLFwiaGVyYnNcIixcImNsaW5pY3NcIixcIm1sc1wiLFwiY293XCIsXCJtYW5pdG9iYVwiLFwiYW5hbHl0aWNhbFwiLFwibWlzc2lvbnNcIixcIndhdHNvblwiLFwibHlpbmdcIixcImNvc3R1bWVzXCIsXCJzdHJpY3RcIixcImRpdmVcIixcInNhZGRhbVwiLFwiY2lyY3VsYXRpb25cIixcImRyaWxsXCIsXCJvZmZlbnNlXCIsXCJicnlhblwiLFwiY2V0XCIsXCJwcm90ZXN0XCIsXCJhc3N1bXB0aW9uXCIsXCJqZXJ1c2FsZW1cIixcImhvYmJ5XCIsXCJ0cmllc1wiLFwidHJhbnNleHVhbGVzXCIsXCJpbnZlbnRpb25cIixcIm5pY2tuYW1lXCIsXCJmaWppXCIsXCJ0ZWNobmljaWFuXCIsXCJpbmxpbmVcIixcImV4ZWN1dGl2ZXNcIixcImVucXVpcmllc1wiLFwid2FzaGluZ1wiLFwiYXVkaVwiLFwic3RhZmZpbmdcIixcImNvZ25pdGl2ZVwiLFwiZXhwbG9yaW5nXCIsXCJ0cmlja1wiLFwiZW5xdWlyeVwiLFwiY2xvc3VyZVwiLFwicmFpZFwiLFwicHBjXCIsXCJ0aW1iZXJcIixcInZvbHRcIixcImludGVuc2VcIixcImRpdlwiLFwicGxheWxpc3RcIixcInJlZ2lzdHJhclwiLFwic2hvd2Vyc1wiLFwic3VwcG9ydGVyc1wiLFwicnVsaW5nXCIsXCJzdGVhZHlcIixcImRpcnRcIixcInN0YXR1dGVzXCIsXCJ3aXRoZHJhd2FsXCIsXCJteWVyc1wiLFwiZHJvcHNcIixcInByZWRpY3RlZFwiLFwid2lkZXJcIixcInNhc2thdGNoZXdhblwiLFwiamNcIixcImNhbmNlbGxhdGlvblwiLFwicGx1Z2luc1wiLFwiZW5yb2xsZWRcIixcInNlbnNvcnNcIixcInNjcmV3XCIsXCJtaW5pc3RlcnNcIixcInB1YmxpY2x5XCIsXCJob3VybHlcIixcImJsYW1lXCIsXCJnZW5ldmFcIixcImZyZWVic2RcIixcInZldGVyaW5hcnlcIixcImFjZXJcIixcInByb3N0b3Jlc1wiLFwicmVzZWxsZXJcIixcImRpc3RcIixcImhhbmRlZFwiLFwic3VmZmVyZWRcIixcImludGFrZVwiLFwiaW5mb3JtYWxcIixcInJlbGV2YW5jZVwiLFwiaW5jZW50aXZlXCIsXCJidXR0ZXJmbHlcIixcInR1Y3NvblwiLFwibWVjaGFuaWNzXCIsXCJoZWF2aWx5XCIsXCJzd2luZ2Vyc1wiLFwiZmlmdHlcIixcImhlYWRlcnNcIixcIm1pc3Rha2VzXCIsXCJudW1lcmljYWxcIixcIm9uc1wiLFwiZ2Vla1wiLFwidW5jbGVcIixcImRlZmluaW5nXCIsXCJ4bnh4XCIsXCJjb3VudGluZ1wiLFwicmVmbGVjdGlvblwiLFwic2lua1wiLFwiYWNjb21wYW5pZWRcIixcImFzc3VyZVwiLFwiaW52aXRhdGlvblwiLFwiZGV2b3RlZFwiLFwicHJpbmNldG9uXCIsXCJqYWNvYlwiLFwic29kaXVtXCIsXCJyYW5keVwiLFwic3Bpcml0dWFsaXR5XCIsXCJob3Jtb25lXCIsXCJtZWFud2hpbGVcIixcInByb3ByaWV0YXJ5XCIsXCJ0aW1vdGh5XCIsXCJjaGlsZHJlbnNcIixcImJyaWNrXCIsXCJncmlwXCIsXCJuYXZhbFwiLFwidGh1bWJ6aWxsYVwiLFwibWVkaWV2YWxcIixcInBvcmNlbGFpblwiLFwiYXZpXCIsXCJicmlkZ2VzXCIsXCJwaWNodW50ZXJcIixcImNhcHR1cmVkXCIsXCJ3YXR0XCIsXCJ0aGVodW5cIixcImRlY2VudFwiLFwiY2FzdGluZ1wiLFwiZGF5dG9uXCIsXCJ0cmFuc2xhdGVkXCIsXCJzaG9ydGx5XCIsXCJjYW1lcm9uXCIsXCJjb2x1bW5pc3RzXCIsXCJwaW5zXCIsXCJjYXJsb3NcIixcInJlbm9cIixcImRvbm5hXCIsXCJhbmRyZWFzXCIsXCJ3YXJyaW9yXCIsXCJkaXBsb21hXCIsXCJjYWJpblwiLFwiaW5ub2NlbnRcIixcInNjYW5uaW5nXCIsXCJpZGVcIixcImNvbnNlbnN1c1wiLFwicG9sb1wiLFwidmFsaXVtXCIsXCJjb3B5aW5nXCIsXCJycGdcIixcImRlbGl2ZXJpbmdcIixcImNvcmRsZXNzXCIsXCJwYXRyaWNpYVwiLFwiaG9yblwiLFwiZWRkaWVcIixcInVnYW5kYVwiLFwiZmlyZWRcIixcImpvdXJuYWxpc21cIixcInBkXCIsXCJwcm90XCIsXCJ0cml2aWFcIixcImFkaWRhc1wiLFwicGVydGhcIixcImZyb2dcIixcImdyYW1tYXJcIixcImludGVudGlvblwiLFwic3lyaWFcIixcImRpc2FncmVlXCIsXCJrbGVpblwiLFwiaGFydmV5XCIsXCJ0aXJlc1wiLFwibG9nc1wiLFwidW5kZXJ0YWtlblwiLFwidGdwXCIsXCJoYXphcmRcIixcInJldHJvXCIsXCJsZW9cIixcImxpdmVzZXhcIixcInN0YXRld2lkZVwiLFwic2VtaWNvbmR1Y3RvclwiLFwiZ3JlZ29yeVwiLFwiZXBpc29kZXNcIixcImJvb2xlYW5cIixcImNpcmN1bGFyXCIsXCJhbmdlclwiLFwiZGl5XCIsXCJtYWlubGFuZFwiLFwiaWxsdXN0cmF0aW9uc1wiLFwic3VpdHNcIixcImNoYW5jZXNcIixcImludGVyYWN0XCIsXCJzbmFwXCIsXCJoYXBwaW5lc3NcIixcImFyZ1wiLFwic3Vic3RhbnRpYWxseVwiLFwiYml6YXJyZVwiLFwiZ2xlbm5cIixcInVyXCIsXCJhdWNrbGFuZFwiLFwib2x5bXBpY3NcIixcImZydWl0c1wiLFwiaWRlbnRpZmllclwiLFwiZ2VvXCIsXCJ3b3JsZHNleFwiLFwicmliYm9uXCIsXCJjYWxjdWxhdGlvbnNcIixcImRvZVwiLFwianBlZ1wiLFwiY29uZHVjdGluZ1wiLFwic3RhcnR1cFwiLFwic3V6dWtpXCIsXCJ0cmluaWRhZFwiLFwiYXRpXCIsXCJraXNzaW5nXCIsXCJ3YWxcIixcImhhbmR5XCIsXCJzd2FwXCIsXCJleGVtcHRcIixcImNyb3BzXCIsXCJyZWR1Y2VzXCIsXCJhY2NvbXBsaXNoZWRcIixcImNhbGN1bGF0b3JzXCIsXCJnZW9tZXRyeVwiLFwiaW1wcmVzc2lvblwiLFwiYWJzXCIsXCJzbG92YWtpYVwiLFwiZmxpcFwiLFwiZ3VpbGRcIixcImNvcnJlbGF0aW9uXCIsXCJnb3JnZW91c1wiLFwiY2FwaXRvbFwiLFwic2ltXCIsXCJkaXNoZXNcIixcInJuYVwiLFwiYmFyYmFkb3NcIixcImNocnlzbGVyXCIsXCJuZXJ2b3VzXCIsXCJyZWZ1c2VcIixcImV4dGVuZHNcIixcImZyYWdyYW5jZVwiLFwibWNkb25hbGRcIixcInJlcGxpY2FcIixcInBsdW1iaW5nXCIsXCJicnVzc2Vsc1wiLFwidHJpYmVcIixcIm5laWdoYm9yc1wiLFwidHJhZGVzXCIsXCJzdXBlcmJcIixcImJ1enpcIixcInRyYW5zcGFyZW50XCIsXCJudWtlXCIsXCJyaWRcIixcInRyaW5pdHlcIixcImNoYXJsZXN0b25cIixcImhhbmRsZWRcIixcImxlZ2VuZHNcIixcImJvb21cIixcImNhbG1cIixcImNoYW1waW9uc1wiLFwiZmxvb3JzXCIsXCJzZWxlY3Rpb25zXCIsXCJwcm9qZWN0b3JzXCIsXCJpbmFwcHJvcHJpYXRlXCIsXCJleGhhdXN0XCIsXCJjb21wYXJpbmdcIixcInNoYW5naGFpXCIsXCJzcGVha3NcIixcImJ1cnRvblwiLFwidm9jYXRpb25hbFwiLFwiZGF2aWRzb25cIixcImNvcGllZFwiLFwic2NvdGlhXCIsXCJmYXJtaW5nXCIsXCJnaWJzb25cIixcInBoYXJtYWNpZXNcIixcImZvcmtcIixcInRyb3lcIixcImxuXCIsXCJyb2xsZXJcIixcImludHJvZHVjaW5nXCIsXCJiYXRjaFwiLFwib3JnYW5pemVcIixcImFwcHJlY2lhdGVkXCIsXCJhbHRlclwiLFwibmljb2xlXCIsXCJsYXRpbm9cIixcImdoYW5hXCIsXCJlZGdlc1wiLFwidWNcIixcIm1peGluZ1wiLFwiaGFuZGxlc1wiLFwic2tpbGxlZFwiLFwiZml0dGVkXCIsXCJhbGJ1cXVlcnF1ZVwiLFwiaGFybW9ueVwiLFwiZGlzdGluZ3Vpc2hlZFwiLFwiYXN0aG1hXCIsXCJwcm9qZWN0ZWRcIixcImFzc3VtcHRpb25zXCIsXCJzaGFyZWhvbGRlcnNcIixcInR3aW5zXCIsXCJkZXZlbG9wbWVudGFsXCIsXCJyaXBcIixcInpvcGVcIixcInJlZ3VsYXRlZFwiLFwidHJpYW5nbGVcIixcImFtZW5kXCIsXCJhbnRpY2lwYXRlZFwiLFwib3JpZW50YWxcIixcInJld2FyZFwiLFwid2luZHNvclwiLFwiemFtYmlhXCIsXCJjb21wbGV0aW5nXCIsXCJnbWJoXCIsXCJidWZcIixcImxkXCIsXCJoeWRyb2dlblwiLFwid2Vic2hvdHNcIixcInNwcmludFwiLFwiY29tcGFyYWJsZVwiLFwiY2hpY2tcIixcImFkdm9jYXRlXCIsXCJzaW1zXCIsXCJjb25mdXNpb25cIixcImNvcHlyaWdodGVkXCIsXCJ0cmF5XCIsXCJpbnB1dHNcIixcIndhcnJhbnRpZXNcIixcImdlbm9tZVwiLFwiZXNjb3J0c1wiLFwiZG9jdW1lbnRlZFwiLFwidGhvbmdcIixcIm1lZGFsXCIsXCJwYXBlcmJhY2tzXCIsXCJjb2FjaGVzXCIsXCJ2ZXNzZWxzXCIsXCJoYXJib3VyXCIsXCJ3YWxrc1wiLFwic29sXCIsXCJrZXlib2FyZHNcIixcInNhZ2VcIixcImtuaXZlc1wiLFwiZWNvXCIsXCJ2dWxuZXJhYmxlXCIsXCJhcnJhbmdlXCIsXCJhcnRpc3RpY1wiLFwiYmF0XCIsXCJob25vcnNcIixcImJvb3RoXCIsXCJpbmRpZVwiLFwicmVmbGVjdGVkXCIsXCJ1bmlmaWVkXCIsXCJib25lc1wiLFwiYnJlZWRcIixcImRldGVjdG9yXCIsXCJpZ25vcmVkXCIsXCJwb2xhclwiLFwiZmFsbGVuXCIsXCJwcmVjaXNlXCIsXCJzdXNzZXhcIixcInJlc3BpcmF0b3J5XCIsXCJub3RpZmljYXRpb25zXCIsXCJtc2dpZFwiLFwidHJhbnNleHVhbFwiLFwibWFpbnN0cmVhbVwiLFwiaW52b2ljZVwiLFwiZXZhbHVhdGluZ1wiLFwibGlwXCIsXCJzdWJjb21taXR0ZWVcIixcInNhcFwiLFwiZ2F0aGVyXCIsXCJzdXNlXCIsXCJtYXRlcm5pdHlcIixcImJhY2tlZFwiLFwiYWxmcmVkXCIsXCJjb2xvbmlhbFwiLFwibWZcIixcImNhcmV5XCIsXCJtb3RlbHNcIixcImZvcm1pbmdcIixcImVtYmFzc3lcIixcImNhdmVcIixcImpvdXJuYWxpc3RzXCIsXCJkYW5ueVwiLFwicmViZWNjYVwiLFwic2xpZ2h0XCIsXCJwcm9jZWVkc1wiLFwiaW5kaXJlY3RcIixcImFtb25nc3RcIixcIndvb2xcIixcImZvdW5kYXRpb25zXCIsXCJtc2dzdHJcIixcImFycmVzdFwiLFwidm9sbGV5YmFsbFwiLFwibXdcIixcImFkaXBleFwiLFwiaG9yaXpvblwiLFwibnVcIixcImRlZXBseVwiLFwidG9vbGJveFwiLFwiaWN0XCIsXCJtYXJpbmFcIixcImxpYWJpbGl0aWVzXCIsXCJwcml6ZXNcIixcImJvc25pYVwiLFwiYnJvd3NlcnNcIixcImRlY3JlYXNlZFwiLFwicGF0aW9cIixcImRwXCIsXCJ0b2xlcmFuY2VcIixcInN1cmZpbmdcIixcImNyZWF0aXZpdHlcIixcImxsb3lkXCIsXCJkZXNjcmliaW5nXCIsXCJvcHRpY3NcIixcInB1cnN1ZVwiLFwibGlnaHRuaW5nXCIsXCJvdmVyY29tZVwiLFwiZXllZFwiLFwib3VcIixcInF1b3RhdGlvbnNcIixcImdyYWJcIixcImluc3BlY3RvclwiLFwiYXR0cmFjdFwiLFwiYnJpZ2h0b25cIixcImJlYW5zXCIsXCJib29rbWFya3NcIixcImVsbGlzXCIsXCJkaXNhYmxlXCIsXCJzbmFrZVwiLFwic3VjY2VlZFwiLFwibGVvbmFyZFwiLFwibGVuZGluZ1wiLFwib29wc1wiLFwicmVtaW5kZXJcIixcInhpXCIsXCJzZWFyY2hlZFwiLFwiYmVoYXZpb3JhbFwiLFwicml2ZXJzaWRlXCIsXCJiYXRocm9vbXNcIixcInBsYWluc1wiLFwic2t1XCIsXCJodFwiLFwicmF5bW9uZFwiLFwiaW5zaWdodHNcIixcImFiaWxpdGllc1wiLFwiaW5pdGlhdGVkXCIsXCJzdWxsaXZhblwiLFwiemFcIixcIm1pZHdlc3RcIixcImthcmFva2VcIixcInRyYXBcIixcImxvbmVseVwiLFwiZm9vbFwiLFwidmVcIixcIm5vbnByb2ZpdFwiLFwibGFuY2FzdGVyXCIsXCJzdXNwZW5kZWRcIixcImhlcmVieVwiLFwib2JzZXJ2ZVwiLFwianVsaWFcIixcImNvbnRhaW5lcnNcIixcImF0dGl0dWRlc1wiLFwia2FybFwiLFwiYmVycnlcIixcImNvbGxhclwiLFwic2ltdWx0YW5lb3VzbHlcIixcInJhY2lhbFwiLFwiaW50ZWdyYXRlXCIsXCJiZXJtdWRhXCIsXCJhbWFuZGFcIixcInNvY2lvbG9neVwiLFwibW9iaWxlc1wiLFwic2NyZWVuc2hvdFwiLFwiZXhoaWJpdGlvbnNcIixcImtlbGtvb1wiLFwiY29uZmlkZW50XCIsXCJyZXRyaWV2ZWRcIixcImV4aGliaXRzXCIsXCJvZmZpY2lhbGx5XCIsXCJjb25zb3J0aXVtXCIsXCJkaWVzXCIsXCJ0ZXJyYWNlXCIsXCJiYWN0ZXJpYVwiLFwicHRzXCIsXCJyZXBsaWVkXCIsXCJzZWFmb29kXCIsXCJub3ZlbHNcIixcInJoXCIsXCJycnBcIixcInJlY2lwaWVudHNcIixcIm91Z2h0XCIsXCJkZWxpY2lvdXNcIixcInRyYWRpdGlvbnNcIixcImZnXCIsXCJqYWlsXCIsXCJzYWZlbHlcIixcImZpbml0ZVwiLFwia2lkbmV5XCIsXCJwZXJpb2RpY2FsbHlcIixcImZpeGVzXCIsXCJzZW5kc1wiLFwiZHVyYWJsZVwiLFwibWF6ZGFcIixcImFsbGllZFwiLFwidGhyb3dzXCIsXCJtb2lzdHVyZVwiLFwiaHVuZ2FyaWFuXCIsXCJyb3N0ZXJcIixcInJlZmVycmluZ1wiLFwic3ltYW50ZWNcIixcInNwZW5jZXJcIixcIndpY2hpdGFcIixcIm5hc2RhcVwiLFwidXJ1Z3VheVwiLFwib29vXCIsXCJoelwiLFwidHJhbnNmb3JtXCIsXCJ0aW1lclwiLFwidGFibGV0c1wiLFwidHVuaW5nXCIsXCJnb3R0ZW5cIixcImVkdWNhdG9yc1wiLFwidHlsZXJcIixcImZ1dHVyZXNcIixcInZlZ2V0YWJsZVwiLFwidmVyc2VcIixcImhpZ2hzXCIsXCJodW1hbml0aWVzXCIsXCJpbmRlcGVuZGVudGx5XCIsXCJ3YW50aW5nXCIsXCJjdXN0b2R5XCIsXCJzY3JhdGNoXCIsXCJsYXVuY2hlc1wiLFwiaXBhcVwiLFwiYWxpZ25tZW50XCIsXCJtYXN0dXJiYXRpbmdcIixcImhlbmRlcnNvblwiLFwiYmtcIixcImJyaXRhbm5pY2FcIixcImNvbW1cIixcImVsbGVuXCIsXCJjb21wZXRpdG9yc1wiLFwibmhzXCIsXCJyb2NrZXRcIixcImF5ZVwiLFwiYnVsbGV0XCIsXCJ0b3dlcnNcIixcInJhY2tzXCIsXCJsYWNlXCIsXCJuYXN0eVwiLFwidmlzaWJpbGl0eVwiLFwibGF0aXR1ZGVcIixcImNvbnNjaW91c25lc3NcIixcInN0ZVwiLFwidHVtb3JcIixcInVnbHlcIixcImRlcG9zaXRzXCIsXCJiZXZlcmx5XCIsXCJtaXN0cmVzc1wiLFwiZW5jb3VudGVyXCIsXCJ0cnVzdGVlc1wiLFwid2F0dHNcIixcImR1bmNhblwiLFwicmVwcmludHNcIixcImhhcnRcIixcImJlcm5hcmRcIixcInJlc29sdXRpb25zXCIsXCJtZW50XCIsXCJhY2Nlc3NpbmdcIixcImZvcnR5XCIsXCJ0dWJlc1wiLFwiYXR0ZW1wdGVkXCIsXCJjb2xcIixcIm1pZGxhbmRzXCIsXCJwcmllc3RcIixcImZsb3lkXCIsXCJyb25hbGRcIixcImFuYWx5c3RzXCIsXCJxdWV1ZVwiLFwiZHhcIixcInNrXCIsXCJ0cmFuY2VcIixcImxvY2FsZVwiLFwibmljaG9sYXNcIixcImJpb2xcIixcInl1XCIsXCJidW5kbGVcIixcImhhbW1lclwiLFwiaW52YXNpb25cIixcIndpdG5lc3Nlc1wiLFwicnVubmVyXCIsXCJyb3dzXCIsXCJhZG1pbmlzdGVyZWRcIixcIm5vdGlvblwiLFwic3FcIixcInNraW5zXCIsXCJtYWlsZWRcIixcIm9jXCIsXCJmdWppdHN1XCIsXCJzcGVsbGluZ1wiLFwiYXJjdGljXCIsXCJleGFtc1wiLFwicmV3YXJkc1wiLFwiYmVuZWF0aFwiLFwic3RyZW5ndGhlblwiLFwiZGVmZW5kXCIsXCJhalwiLFwiZnJlZGVyaWNrXCIsXCJtZWRpY2FpZFwiLFwidHJlb1wiLFwiaW5mcmFyZWRcIixcInNldmVudGhcIixcImdvZHNcIixcInVuZVwiLFwid2Vsc2hcIixcImJlbGx5XCIsXCJhZ2dyZXNzaXZlXCIsXCJ0ZXhcIixcImFkdmVydGlzZW1lbnRzXCIsXCJxdWFydGVyc1wiLFwic3RvbGVuXCIsXCJjaWFcIixcInN1YmxpbWVkaXJlY3RvcnlcIixcInNvb25lc3RcIixcImhhaXRpXCIsXCJkaXN0dXJiZWRcIixcImRldGVybWluZXNcIixcInNjdWxwdHVyZVwiLFwicG9seVwiLFwiZWFyc1wiLFwiZG9kXCIsXCJ3cFwiLFwiZmlzdFwiLFwibmF0dXJhbHNcIixcIm5lb1wiLFwibW90aXZhdGlvblwiLFwibGVuZGVyc1wiLFwicGhhcm1hY29sb2d5XCIsXCJmaXR0aW5nXCIsXCJmaXh0dXJlc1wiLFwiYmxvZ2dlcnNcIixcIm1lcmVcIixcImFncmVlc1wiLFwicGFzc2VuZ2Vyc1wiLFwicXVhbnRpdGllc1wiLFwicGV0ZXJzYnVyZ1wiLFwiY29uc2lzdGVudGx5XCIsXCJwb3dlcnBvaW50XCIsXCJjb25zXCIsXCJzdXJwbHVzXCIsXCJlbGRlclwiLFwic29uaWNcIixcIm9iaXR1YXJpZXNcIixcImNoZWVyc1wiLFwiZGlnXCIsXCJ0YXhpXCIsXCJwdW5pc2htZW50XCIsXCJhcHByZWNpYXRpb25cIixcInN1YnNlcXVlbnRseVwiLFwib21cIixcImJlbGFydXNcIixcIm5hdFwiLFwiem9uaW5nXCIsXCJncmF2aXR5XCIsXCJwcm92aWRlbmNlXCIsXCJ0aHVtYlwiLFwicmVzdHJpY3Rpb25cIixcImluY29ycG9yYXRlXCIsXCJiYWNrZ3JvdW5kc1wiLFwidHJlYXN1cmVyXCIsXCJndWl0YXJzXCIsXCJlc3NlbmNlXCIsXCJmbG9vcmluZ1wiLFwibGlnaHR3ZWlnaHRcIixcImV0aGlvcGlhXCIsXCJ0cFwiLFwibWlnaHR5XCIsXCJhdGhsZXRlc1wiLFwiaHVtYW5pdHlcIixcInRyYW5zY3JpcHRpb25cIixcImptXCIsXCJob2xtZXNcIixcImNvbXBsaWNhdGlvbnNcIixcInNjaG9sYXJzXCIsXCJkcGlcIixcInNjcmlwdGluZ1wiLFwiZ2lzXCIsXCJyZW1lbWJlcmVkXCIsXCJnYWxheHlcIixcImNoZXN0ZXJcIixcInNuYXBzaG90XCIsXCJjYXJpbmdcIixcImxvY1wiLFwid29yblwiLFwic3ludGhldGljXCIsXCJzaGF3XCIsXCJ2cFwiLFwic2VnbWVudHNcIixcInRlc3RhbWVudFwiLFwiZXhwb1wiLFwiZG9taW5hbnRcIixcInR3aXN0XCIsXCJzcGVjaWZpY3NcIixcIml0dW5lc1wiLFwic3RvbWFjaFwiLFwicGFydGlhbGx5XCIsXCJidXJpZWRcIixcImNuXCIsXCJuZXdiaWVcIixcIm1pbmltaXplXCIsXCJkYXJ3aW5cIixcInJhbmtzXCIsXCJ3aWxkZXJuZXNzXCIsXCJkZWJ1dFwiLFwiZ2VuZXJhdGlvbnNcIixcInRvdXJuYW1lbnRzXCIsXCJicmFkbGV5XCIsXCJkZW55XCIsXCJhbmF0b215XCIsXCJiYWxpXCIsXCJqdWR5XCIsXCJzcG9uc29yc2hpcFwiLFwiaGVhZHBob25lc1wiLFwiZnJhY3Rpb25cIixcInRyaW9cIixcInByb2NlZWRpbmdcIixcImN1YmVcIixcImRlZmVjdHNcIixcInZvbGtzd2FnZW5cIixcInVuY2VydGFpbnR5XCIsXCJicmVha2Rvd25cIixcIm1pbHRvblwiLFwibWFya2VyXCIsXCJyZWNvbnN0cnVjdGlvblwiLFwic3Vic2lkaWFyeVwiLFwic3RyZW5ndGhzXCIsXCJjbGFyaXR5XCIsXCJydWdzXCIsXCJzYW5kcmFcIixcImFkZWxhaWRlXCIsXCJlbmNvdXJhZ2luZ1wiLFwiZnVybmlzaGVkXCIsXCJtb25hY29cIixcInNldHRsZWRcIixcImZvbGRpbmdcIixcImVtaXJhdGVzXCIsXCJ0ZXJyb3Jpc3RzXCIsXCJhaXJmYXJlXCIsXCJjb21wYXJpc29uc1wiLFwiYmVuZWZpY2lhbFwiLFwiZGlzdHJpYnV0aW9uc1wiLFwidmFjY2luZVwiLFwiYmVsaXplXCIsXCJmYXRlXCIsXCJ2aWV3cGljdHVyZVwiLFwicHJvbWlzZWRcIixcInZvbHZvXCIsXCJwZW5ueVwiLFwicm9idXN0XCIsXCJib29raW5nc1wiLFwidGhyZWF0ZW5lZFwiLFwibWlub2x0YVwiLFwicmVwdWJsaWNhbnNcIixcImRpc2N1c3Nlc1wiLFwiZ3VpXCIsXCJwb3J0ZXJcIixcImdyYXNcIixcImp1bmdsZVwiLFwidmVyXCIsXCJyblwiLFwicmVzcG9uZGVkXCIsXCJyaW1cIixcImFic3RyYWN0c1wiLFwiemVuXCIsXCJpdm9yeVwiLFwiYWxwaW5lXCIsXCJkaXNcIixcInByZWRpY3Rpb25cIixcInBoYXJtYWNldXRpY2Fsc1wiLFwiYW5kYWxlXCIsXCJmYWJ1bG91c1wiLFwicmVtaXhcIixcImFsaWFzXCIsXCJ0aGVzYXVydXNcIixcImluZGl2aWR1YWxseVwiLFwiYmF0dGxlZmllbGRcIixcImxpdGVyYWxseVwiLFwibmV3ZXJcIixcImtheVwiLFwiZWNvbG9naWNhbFwiLFwic3BpY2VcIixcIm92YWxcIixcImltcGxpZXNcIixcImNnXCIsXCJzb21hXCIsXCJzZXJcIixcImNvb2xlclwiLFwiYXBwcmFpc2FsXCIsXCJjb25zaXN0aW5nXCIsXCJtYXJpdGltZVwiLFwicGVyaW9kaWNcIixcInN1Ym1pdHRpbmdcIixcIm92ZXJoZWFkXCIsXCJhc2NpaVwiLFwicHJvc3BlY3RcIixcInNoaXBtZW50XCIsXCJicmVlZGluZ1wiLFwiY2l0YXRpb25zXCIsXCJnZW9ncmFwaGljYWxcIixcImRvbm9yXCIsXCJtb3phbWJpcXVlXCIsXCJ0ZW5zaW9uXCIsXCJocmVmXCIsXCJiZW56XCIsXCJ0cmFzaFwiLFwic2hhcGVzXCIsXCJ3aWZpXCIsXCJ0aWVyXCIsXCJmd2RcIixcImVhcmxcIixcIm1hbm9yXCIsXCJlbnZlbG9wZVwiLFwiZGlhbmVcIixcImhvbWVsYW5kXCIsXCJkaXNjbGFpbWVyc1wiLFwiY2hhbXBpb25zaGlwc1wiLFwiZXhjbHVkZWRcIixcImFuZHJlYVwiLFwiYnJlZWRzXCIsXCJyYXBpZHNcIixcImRpc2NvXCIsXCJzaGVmZmllbGRcIixcImJhaWxleVwiLFwiYXVzXCIsXCJlbmRpZlwiLFwiZmluaXNoaW5nXCIsXCJlbW90aW9uc1wiLFwid2VsbGluZ3RvblwiLFwiaW5jb21pbmdcIixcInByb3NwZWN0c1wiLFwibGV4bWFya1wiLFwiY2xlYW5lcnNcIixcImJ1bGdhcmlhblwiLFwiaHd5XCIsXCJldGVybmFsXCIsXCJjYXNoaWVyc1wiLFwiZ3VhbVwiLFwiY2l0ZVwiLFwiYWJvcmlnaW5hbFwiLFwicmVtYXJrYWJsZVwiLFwicm90YXRpb25cIixcIm5hbVwiLFwicHJldmVudGluZ1wiLFwicHJvZHVjdGl2ZVwiLFwiYm91bGV2YXJkXCIsXCJldWdlbmVcIixcIml4XCIsXCJnZHBcIixcInBpZ1wiLFwibWV0cmljXCIsXCJjb21wbGlhbnRcIixcIm1pbnVzXCIsXCJwZW5hbHRpZXNcIixcImJlbm5ldHRcIixcImltYWdpbmF0aW9uXCIsXCJob3RtYWlsXCIsXCJyZWZ1cmJpc2hlZFwiLFwiam9zaHVhXCIsXCJhcm1lbmlhXCIsXCJ2YXJpZWRcIixcImdyYW5kZVwiLFwiY2xvc2VzdFwiLFwiYWN0aXZhdGVkXCIsXCJhY3RyZXNzXCIsXCJtZXNzXCIsXCJjb25mZXJlbmNpbmdcIixcImFzc2lnblwiLFwiYXJtc3Ryb25nXCIsXCJwb2xpdGljaWFuc1wiLFwidHJhY2tiYWNrc1wiLFwibGl0XCIsXCJhY2NvbW1vZGF0ZVwiLFwidGlnZXJzXCIsXCJhdXJvcmFcIixcInVuYVwiLFwic2xpZGVzXCIsXCJtaWxhblwiLFwicHJlbWllcmVcIixcImxlbmRlclwiLFwidmlsbGFnZXNcIixcInNoYWRlXCIsXCJjaG9ydXNcIixcImNocmlzdGluZVwiLFwicmh5dGhtXCIsXCJkaWdpdFwiLFwiYXJndWVkXCIsXCJkaWV0YXJ5XCIsXCJzeW1waG9ueVwiLFwiY2xhcmtlXCIsXCJzdWRkZW5cIixcImFjY2VwdGluZ1wiLFwicHJlY2lwaXRhdGlvblwiLFwibWFyaWx5blwiLFwibGlvbnNcIixcImZpbmRsYXdcIixcImFkYVwiLFwicG9vbHNcIixcInRiXCIsXCJseXJpY1wiLFwiY2xhaXJlXCIsXCJpc29sYXRpb25cIixcInNwZWVkc1wiLFwic3VzdGFpbmVkXCIsXCJtYXRjaGVkXCIsXCJhcHByb3hpbWF0ZVwiLFwicm9wZVwiLFwiY2Fycm9sbFwiLFwicmF0aW9uYWxcIixcInByb2dyYW1tZXJcIixcImZpZ2h0ZXJzXCIsXCJjaGFtYmVyc1wiLFwiZHVtcFwiLFwiZ3JlZXRpbmdzXCIsXCJpbmhlcml0ZWRcIixcIndhcm1pbmdcIixcImluY29tcGxldGVcIixcInZvY2Fsc1wiLFwiY2hyb25pY2xlXCIsXCJmb3VudGFpblwiLFwiY2h1YmJ5XCIsXCJncmF2ZVwiLFwibGVnaXRpbWF0ZVwiLFwiYmlvZ3JhcGhpZXNcIixcImJ1cm5lclwiLFwieXJzXCIsXCJmb29cIixcImludmVzdGlnYXRvclwiLFwiZ2JhXCIsXCJwbGFpbnRpZmZcIixcImZpbm5pc2hcIixcImdlbnRsZVwiLFwiYm1cIixcInByaXNvbmVyc1wiLFwiZGVlcGVyXCIsXCJtdXNsaW1zXCIsXCJob3NlXCIsXCJtZWRpdGVycmFuZWFuXCIsXCJuaWdodGxpZmVcIixcImZvb3RhZ2VcIixcImhvd3RvXCIsXCJ3b3J0aHlcIixcInJldmVhbHNcIixcImFyY2hpdGVjdHNcIixcInNhaW50c1wiLFwiZW50cmVwcmVuZXVyXCIsXCJjYXJyaWVzXCIsXCJzaWdcIixcImZyZWVsYW5jZVwiLFwiZHVvXCIsXCJleGNlc3NpdmVcIixcImRldm9uXCIsXCJzY3JlZW5zYXZlclwiLFwiaGVsZW5hXCIsXCJzYXZlc1wiLFwicmVnYXJkZWRcIixcInZhbHVhdGlvblwiLFwidW5leHBlY3RlZFwiLFwiY2lnYXJldHRlXCIsXCJmb2dcIixcImNoYXJhY3RlcmlzdGljXCIsXCJtYXJpb25cIixcImxvYmJ5XCIsXCJlZ3lwdGlhblwiLFwidHVuaXNpYVwiLFwibWV0YWxsaWNhXCIsXCJvdXRsaW5lZFwiLFwiY29uc2VxdWVudGx5XCIsXCJoZWFkbGluZVwiLFwidHJlYXRpbmdcIixcInB1bmNoXCIsXCJhcHBvaW50bWVudHNcIixcInN0clwiLFwiZ290dGFcIixcImNvd2JveVwiLFwibmFycmF0aXZlXCIsXCJiYWhyYWluXCIsXCJlbm9ybW91c1wiLFwia2FybWFcIixcImNvbnNpc3RcIixcImJldHR5XCIsXCJxdWVlbnNcIixcImFjYWRlbWljc1wiLFwicHVic1wiLFwicXVhbnRpdGF0aXZlXCIsXCJzaGVtYWxlc1wiLFwibHVjYXNcIixcInNjcmVlbnNhdmVyc1wiLFwic3ViZGl2aXNpb25cIixcInRyaWJlc1wiLFwidmlwXCIsXCJkZWZlYXRcIixcImNsaWNrc1wiLFwiZGlzdGluY3Rpb25cIixcImhvbmR1cmFzXCIsXCJuYXVnaHR5XCIsXCJoYXphcmRzXCIsXCJpbnN1cmVkXCIsXCJoYXJwZXJcIixcImxpdmVzdG9ja1wiLFwibWFyZGlcIixcImV4ZW1wdGlvblwiLFwidGVuYW50XCIsXCJzdXN0YWluYWJpbGl0eVwiLFwiY2FiaW5ldHNcIixcInRhdHRvb1wiLFwic2hha2VcIixcImFsZ2VicmFcIixcInNoYWRvd3NcIixcImhvbGx5XCIsXCJmb3JtYXR0aW5nXCIsXCJzaWxseVwiLFwibnV0cml0aW9uYWxcIixcInllYVwiLFwibWVyY3lcIixcImhhcnRmb3JkXCIsXCJmcmVlbHlcIixcIm1hcmN1c1wiLFwic3VucmlzZVwiLFwid3JhcHBpbmdcIixcIm1pbGRcIixcImZ1clwiLFwibmljYXJhZ3VhXCIsXCJ3ZWJsb2dzXCIsXCJ0aW1lbGluZVwiLFwidGFyXCIsXCJiZWxvbmdzXCIsXCJyalwiLFwicmVhZGlseVwiLFwiYWZmaWxpYXRpb25cIixcInNvY1wiLFwiZmVuY2VcIixcIm51ZGlzdFwiLFwiaW5maW5pdGVcIixcImRpYW5hXCIsXCJlbnN1cmVzXCIsXCJyZWxhdGl2ZXNcIixcImxpbmRzYXlcIixcImNsYW5cIixcImxlZ2FsbHlcIixcInNoYW1lXCIsXCJzYXRpc2ZhY3RvcnlcIixcInJldm9sdXRpb25hcnlcIixcImJyYWNlbGV0c1wiLFwic3luY1wiLFwiY2l2aWxpYW5cIixcInRlbGVwaG9ueVwiLFwibWVzYVwiLFwiZmF0YWxcIixcInJlbWVkeVwiLFwicmVhbHRvcnNcIixcImJyZWF0aGluZ1wiLFwiYnJpZWZseVwiLFwidGhpY2tuZXNzXCIsXCJhZGp1c3RtZW50c1wiLFwiZ3JhcGhpY2FsXCIsXCJnZW5pdXNcIixcImRpc2N1c3NpbmdcIixcImFlcm9zcGFjZVwiLFwiZmlnaHRlclwiLFwibWVhbmluZ2Z1bFwiLFwiZmxlc2hcIixcInJldHJlYXRcIixcImFkYXB0ZWRcIixcImJhcmVseVwiLFwid2hlcmV2ZXJcIixcImVzdGF0ZXNcIixcInJ1Z1wiLFwiZGVtb2NyYXRcIixcImJvcm91Z2hcIixcIm1haW50YWluc1wiLFwiZmFpbGluZ1wiLFwic2hvcnRjdXRzXCIsXCJrYVwiLFwicmV0YWluZWRcIixcInZveWV1cndlYlwiLFwicGFtZWxhXCIsXCJhbmRyZXdzXCIsXCJtYXJibGVcIixcImV4dGVuZGluZ1wiLFwiamVzc2VcIixcInNwZWNpZmllc1wiLFwiaHVsbFwiLFwibG9naXRlY2hcIixcInN1cnJleVwiLFwiYnJpZWZpbmdcIixcImJlbGtpblwiLFwiZGVtXCIsXCJhY2NyZWRpdGF0aW9uXCIsXCJ3YXZcIixcImJsYWNrYmVycnlcIixcImhpZ2hsYW5kXCIsXCJtZWRpdGF0aW9uXCIsXCJtb2R1bGFyXCIsXCJtaWNyb3Bob25lXCIsXCJtYWNlZG9uaWFcIixcImNvbWJpbmluZ1wiLFwiYnJhbmRvblwiLFwiaW5zdHJ1bWVudGFsXCIsXCJnaWFudHNcIixcIm9yZ2FuaXppbmdcIixcInNoZWRcIixcImJhbGxvb25cIixcIm1vZGVyYXRvcnNcIixcIndpbnN0b25cIixcIm1lbW9cIixcImhhbVwiLFwic29sdmVkXCIsXCJ0aWRlXCIsXCJrYXpha2hzdGFuXCIsXCJoYXdhaWlhblwiLFwic3RhbmRpbmdzXCIsXCJwYXJ0aXRpb25cIixcImludmlzaWJsZVwiLFwiZ3JhdHVpdFwiLFwiY29uc29sZXNcIixcImZ1bmtcIixcImZiaVwiLFwicWF0YXJcIixcIm1hZ25ldFwiLFwidHJhbnNsYXRpb25zXCIsXCJwb3JzY2hlXCIsXCJjYXltYW5cIixcImphZ3VhclwiLFwicmVlbFwiLFwic2hlZXJcIixcImNvbW1vZGl0eVwiLFwicG9zaW5nXCIsXCJraWxvbWV0ZXJzXCIsXCJycFwiLFwiYmluZFwiLFwidGhhbmtzZ2l2aW5nXCIsXCJyYW5kXCIsXCJob3BraW5zXCIsXCJ1cmdlbnRcIixcImd1YXJhbnRlZXNcIixcImluZmFudHNcIixcImdvdGhpY1wiLFwiY3lsaW5kZXJcIixcIndpdGNoXCIsXCJidWNrXCIsXCJpbmRpY2F0aW9uXCIsXCJlaFwiLFwiY29uZ3JhdHVsYXRpb25zXCIsXCJ0YmFcIixcImNvaGVuXCIsXCJzaWVcIixcInVzZ3NcIixcInB1cHB5XCIsXCJrYXRoeVwiLFwiYWNyZVwiLFwiZ3JhcGhzXCIsXCJzdXJyb3VuZFwiLFwiY2lnYXJldHRlc1wiLFwicmV2ZW5nZVwiLFwiZXhwaXJlc1wiLFwiZW5lbWllc1wiLFwibG93c1wiLFwiY29udHJvbGxlcnNcIixcImFxdWFcIixcImNoZW5cIixcImVtbWFcIixcImNvbnN1bHRhbmN5XCIsXCJmaW5hbmNlc1wiLFwiYWNjZXB0c1wiLFwiZW5qb3lpbmdcIixcImNvbnZlbnRpb25zXCIsXCJldmFcIixcInBhdHJvbFwiLFwic21lbGxcIixcInBlc3RcIixcImhjXCIsXCJpdGFsaWFub1wiLFwiY29vcmRpbmF0ZXNcIixcInJjYVwiLFwiZnBcIixcImNhcm5pdmFsXCIsXCJyb3VnaGx5XCIsXCJzdGlja2VyXCIsXCJwcm9taXNlc1wiLFwicmVzcG9uZGluZ1wiLFwicmVlZlwiLFwicGh5c2ljYWxseVwiLFwiZGl2aWRlXCIsXCJzdGFrZWhvbGRlcnNcIixcImh5ZHJvY29kb25lXCIsXCJnc3RcIixcImNvbnNlY3V0aXZlXCIsXCJjb3JuZWxsXCIsXCJzYXRpblwiLFwiYm9uXCIsXCJkZXNlcnZlXCIsXCJhdHRlbXB0aW5nXCIsXCJtYWlsdG9cIixcInByb21vXCIsXCJqalwiLFwicmVwcmVzZW50YXRpb25zXCIsXCJjaGFuXCIsXCJ3b3JyaWVkXCIsXCJ0dW5lc1wiLFwiZ2FyYmFnZVwiLFwiY29tcGV0aW5nXCIsXCJjb21iaW5lc1wiLFwibWFzXCIsXCJiZXRoXCIsXCJicmFkZm9yZFwiLFwibGVuXCIsXCJwaHJhc2VzXCIsXCJrYWlcIixcInBlbmluc3VsYVwiLFwiY2hlbHNlYVwiLFwiYm9yaW5nXCIsXCJyZXlub2xkc1wiLFwiZG9tXCIsXCJqaWxsXCIsXCJhY2N1cmF0ZWx5XCIsXCJzcGVlY2hlc1wiLFwicmVhY2hlc1wiLFwic2NoZW1hXCIsXCJjb25zaWRlcnNcIixcInNvZmFcIixcImNhdGFsb2dzXCIsXCJtaW5pc3RyaWVzXCIsXCJ2YWNhbmNpZXNcIixcInF1aXp6ZXNcIixcInBhcmxpYW1lbnRhcnlcIixcIm9ialwiLFwicHJlZml4XCIsXCJsdWNpYVwiLFwic2F2YW5uYWhcIixcImJhcnJlbFwiLFwidHlwaW5nXCIsXCJuZXJ2ZVwiLFwiZGFuc1wiLFwicGxhbmV0c1wiLFwiZGVmaWNpdFwiLFwiYm91bGRlclwiLFwicG9pbnRpbmdcIixcInJlbmV3XCIsXCJjb3VwbGVkXCIsXCJ2aWlpXCIsXCJteWFubWFyXCIsXCJtZXRhZGF0YVwiLFwiaGFyb2xkXCIsXCJjaXJjdWl0c1wiLFwiZmxvcHB5XCIsXCJ0ZXh0dXJlXCIsXCJoYW5kYmFnc1wiLFwiamFyXCIsXCJldlwiLFwic29tZXJzZXRcIixcImluY3VycmVkXCIsXCJhY2tub3dsZWRnZVwiLFwidGhvcm91Z2hseVwiLFwiYW50aWd1YVwiLFwibm90dGluZ2hhbVwiLFwidGh1bmRlclwiLFwidGVudFwiLFwiY2F1dGlvblwiLFwiaWRlbnRpZmllc1wiLFwicXVlc3Rpb25uYWlyZVwiLFwicXVhbGlmaWNhdGlvblwiLFwibG9ja3NcIixcIm1vZGVsbGluZ1wiLFwibmFtZWx5XCIsXCJtaW5pYXR1cmVcIixcImRlcHRcIixcImhhY2tcIixcImRhcmVcIixcImV1cm9zXCIsXCJpbnRlcnN0YXRlXCIsXCJwaXJhdGVzXCIsXCJhZXJpYWxcIixcImhhd2tcIixcImNvbnNlcXVlbmNlXCIsXCJyZWJlbFwiLFwic3lzdGVtYXRpY1wiLFwicGVyY2VpdmVkXCIsXCJvcmlnaW5zXCIsXCJoaXJlZFwiLFwibWFrZXVwXCIsXCJ0ZXh0aWxlXCIsXCJsYW1iXCIsXCJtYWRhZ2FzY2FyXCIsXCJuYXRoYW5cIixcInRvYmFnb1wiLFwicHJlc2VudGluZ1wiLFwiY29zXCIsXCJ0cm91Ymxlc2hvb3RpbmdcIixcInV6YmVraXN0YW5cIixcImluZGV4ZXNcIixcInBhY1wiLFwicmxcIixcImVycFwiLFwiY2VudHVyaWVzXCIsXCJnbFwiLFwibWFnbml0dWRlXCIsXCJ1aVwiLFwicmljaGFyZHNvblwiLFwiaGluZHVcIixcImRoXCIsXCJmcmFncmFuY2VzXCIsXCJ2b2NhYnVsYXJ5XCIsXCJsaWNraW5nXCIsXCJlYXJ0aHF1YWtlXCIsXCJ2cG5cIixcImZ1bmRyYWlzaW5nXCIsXCJmY2NcIixcIm1hcmtlcnNcIixcIndlaWdodHNcIixcImFsYmFuaWFcIixcImdlb2xvZ2ljYWxcIixcImFzc2Vzc2luZ1wiLFwibGFzdGluZ1wiLFwid2lja2VkXCIsXCJlZHNcIixcImludHJvZHVjZXNcIixcImtpbGxzXCIsXCJyb29tbWF0ZVwiLFwid2ViY2Ftc1wiLFwicHVzaGVkXCIsXCJ3ZWJtYXN0ZXJzXCIsXCJyb1wiLFwiZGZcIixcImNvbXB1dGF0aW9uYWxcIixcImFjZGJlbnRpdHlcIixcInBhcnRpY2lwYXRlZFwiLFwianVua1wiLFwiaGFuZGhlbGRzXCIsXCJ3YXhcIixcImx1Y3lcIixcImFuc3dlcmluZ1wiLFwiaGFuc1wiLFwiaW1wcmVzc2VkXCIsXCJzbG9wZVwiLFwicmVnZ2FlXCIsXCJmYWlsdXJlc1wiLFwicG9ldFwiLFwiY29uc3BpcmFjeVwiLFwic3VybmFtZVwiLFwidGhlb2xvZ3lcIixcIm5haWxzXCIsXCJldmlkZW50XCIsXCJ3aGF0c1wiLFwicmlkZXNcIixcInJlaGFiXCIsXCJlcGljXCIsXCJzYXR1cm5cIixcIm9yZ2FuaXplclwiLFwibnV0XCIsXCJhbGxlcmd5XCIsXCJzYWtlXCIsXCJ0d2lzdGVkXCIsXCJjb21iaW5hdGlvbnNcIixcInByZWNlZGluZ1wiLFwibWVyaXRcIixcImVuenltZVwiLFwiY3VtdWxhdGl2ZVwiLFwienNob3BzXCIsXCJwbGFuZXNcIixcImVkbW9udG9uXCIsXCJ0YWNrbGVcIixcImRpc2tzXCIsXCJjb25kb1wiLFwicG9rZW1vblwiLFwiYW1wbGlmaWVyXCIsXCJhbWJpZW5cIixcImFyYml0cmFyeVwiLFwicHJvbWluZW50XCIsXCJyZXRyaWV2ZVwiLFwibGV4aW5ndG9uXCIsXCJ2ZXJub25cIixcInNhbnNcIixcIndvcmxkY2F0XCIsXCJ0aXRhbml1bVwiLFwiaXJzXCIsXCJmYWlyeVwiLFwiYnVpbGRzXCIsXCJjb250YWN0ZWRcIixcInNoYWZ0XCIsXCJsZWFuXCIsXCJieWVcIixcImNkdFwiLFwicmVjb3JkZXJzXCIsXCJvY2Nhc2lvbmFsXCIsXCJsZXNsaWVcIixcImNhc2lvXCIsXCJkZXV0c2NoZVwiLFwiYW5hXCIsXCJwb3N0aW5nc1wiLFwiaW5ub3ZhdGlvbnNcIixcImtpdHR5XCIsXCJwb3N0Y2FyZHNcIixcImR1ZGVcIixcImRyYWluXCIsXCJtb250ZVwiLFwiZmlyZXNcIixcImFsZ2VyaWFcIixcImJsZXNzZWRcIixcImx1aXNcIixcInJldmlld2luZ1wiLFwiY2FyZGlmZlwiLFwiY29ybndhbGxcIixcImZhdm9yc1wiLFwicG90YXRvXCIsXCJwYW5pY1wiLFwiZXhwbGljaXRseVwiLFwic3RpY2tzXCIsXCJsZW9uZVwiLFwidHJhbnNzZXh1YWxcIixcImV6XCIsXCJjaXRpemVuc2hpcFwiLFwiZXhjdXNlXCIsXCJyZWZvcm1zXCIsXCJiYXNlbWVudFwiLFwib25pb25cIixcInN0cmFuZFwiLFwicGZcIixcInNhbmR3aWNoXCIsXCJ1d1wiLFwibGF3c3VpdFwiLFwiYWx0b1wiLFwiaW5mb3JtYXRpdmVcIixcImdpcmxmcmllbmRcIixcImJsb29tYmVyZ1wiLFwiY2hlcXVlXCIsXCJoaWVyYXJjaHlcIixcImluZmx1ZW5jZWRcIixcImJhbm5lcnNcIixcInJlamVjdFwiLFwiZWF1XCIsXCJhYmFuZG9uZWRcIixcImJkXCIsXCJjaXJjbGVzXCIsXCJpdGFsaWNcIixcImJlYXRzXCIsXCJtZXJyeVwiLFwibWlsXCIsXCJzY3ViYVwiLFwiZ29yZVwiLFwiY29tcGxlbWVudFwiLFwiY3VsdFwiLFwiZGFzaFwiLFwicGFzc2l2ZVwiLFwibWF1cml0aXVzXCIsXCJ2YWx1ZWRcIixcImNhZ2VcIixcImNoZWNrbGlzdFwiLFwiYmFuZ2J1c1wiLFwicmVxdWVzdGluZ1wiLFwiY291cmFnZVwiLFwidmVyZGVcIixcImxhdWRlcmRhbGVcIixcInNjZW5hcmlvc1wiLFwiZ2F6ZXR0ZVwiLFwiaGl0YWNoaVwiLFwiZGl2eFwiLFwiZXh0cmFjdGlvblwiLFwiYmF0bWFuXCIsXCJlbGV2YXRpb25cIixcImhlYXJpbmdzXCIsXCJjb2xlbWFuXCIsXCJodWdoXCIsXCJsYXBcIixcInV0aWxpemF0aW9uXCIsXCJiZXZlcmFnZXNcIixcImNhbGlicmF0aW9uXCIsXCJqYWtlXCIsXCJldmFsXCIsXCJlZmZpY2llbnRseVwiLFwiYW5haGVpbVwiLFwicGluZ1wiLFwidGV4dGJvb2tcIixcImRyaWVkXCIsXCJlbnRlcnRhaW5pbmdcIixcInByZXJlcXVpc2l0ZVwiLFwibHV0aGVyXCIsXCJmcm9udGllclwiLFwic2V0dGxlXCIsXCJzdG9wcGluZ1wiLFwicmVmdWdlZXNcIixcImtuaWdodHNcIixcImh5cG90aGVzaXNcIixcInBhbG1lclwiLFwibWVkaWNpbmVzXCIsXCJmbHV4XCIsXCJkZXJieVwiLFwic2FvXCIsXCJwZWFjZWZ1bFwiLFwiYWx0ZXJlZFwiLFwicG9udGlhY1wiLFwicmVncmVzc2lvblwiLFwiZG9jdHJpbmVcIixcInNjZW5pY1wiLFwidHJhaW5lcnNcIixcIm11emVcIixcImVuaGFuY2VtZW50c1wiLFwicmVuZXdhYmxlXCIsXCJpbnRlcnNlY3Rpb25cIixcInBhc3N3b3Jkc1wiLFwic2V3aW5nXCIsXCJjb25zaXN0ZW5jeVwiLFwiY29sbGVjdG9yc1wiLFwiY29uY2x1ZGVcIixcInJlY29nbmlzZWRcIixcIm11bmljaFwiLFwib21hblwiLFwiY2VsZWJzXCIsXCJnbWNcIixcInByb3Bvc2VcIixcImhoXCIsXCJhemVyYmFpamFuXCIsXCJsaWdodGVyXCIsXCJyYWdlXCIsXCJhZHNsXCIsXCJ1aFwiLFwicHJpeFwiLFwiYXN0cm9sb2d5XCIsXCJhZHZpc29yc1wiLFwicGF2aWxpb25cIixcInRhY3RpY3NcIixcInRydXN0c1wiLFwib2NjdXJyaW5nXCIsXCJzdXBwbGVtZW50YWxcIixcInRyYXZlbGxpbmdcIixcInRhbGVudGVkXCIsXCJhbm5pZVwiLFwicGlsbG93XCIsXCJpbmR1Y3Rpb25cIixcImRlcmVrXCIsXCJwcmVjaXNlbHlcIixcInNob3J0ZXJcIixcImhhcmxleVwiLFwic3ByZWFkaW5nXCIsXCJwcm92aW5jZXNcIixcInJlbHlpbmdcIixcImZpbmFsc1wiLFwicGFyYWd1YXlcIixcInN0ZWFsXCIsXCJwYXJjZWxcIixcInJlZmluZWRcIixcImZkXCIsXCJib1wiLFwiZmlmdGVlblwiLFwid2lkZXNwcmVhZFwiLFwiaW5jaWRlbmNlXCIsXCJmZWFyc1wiLFwicHJlZGljdFwiLFwiYm91dGlxdWVcIixcImFjcnlsaWNcIixcInJvbGxlZFwiLFwidHVuZXJcIixcImF2b25cIixcImluY2lkZW50c1wiLFwicGV0ZXJzb25cIixcInJheXNcIixcImFzblwiLFwic2hhbm5vblwiLFwidG9kZGxlclwiLFwiZW5oYW5jaW5nXCIsXCJmbGF2b3JcIixcImFsaWtlXCIsXCJ3YWx0XCIsXCJob21lbGVzc1wiLFwiaG9ycmlibGVcIixcImh1bmdyeVwiLFwibWV0YWxsaWNcIixcImFjbmVcIixcImJsb2NrZWRcIixcImludGVyZmVyZW5jZVwiLFwid2FycmlvcnNcIixcInBhbGVzdGluZVwiLFwibGlzdHByaWNlXCIsXCJsaWJzXCIsXCJ1bmRvXCIsXCJjYWRpbGxhY1wiLFwiYXRtb3NwaGVyaWNcIixcIm1hbGF3aVwiLFwid21cIixcInBrXCIsXCJzYWdlbVwiLFwia25vd2xlZGdlc3Rvcm1cIixcImRhbmFcIixcImhhbG9cIixcInBwbVwiLFwiY3VydGlzXCIsXCJwYXJlbnRhbFwiLFwicmVmZXJlbmNlZFwiLFwic3RyaWtlc1wiLFwibGVzc2VyXCIsXCJwdWJsaWNpdHlcIixcIm1hcmF0aG9uXCIsXCJhbnRcIixcInByb3Bvc2l0aW9uXCIsXCJnYXlzXCIsXCJwcmVzc2luZ1wiLFwiZ2Fzb2xpbmVcIixcImFwdFwiLFwiZHJlc3NlZFwiLFwic2NvdXRcIixcImJlbGZhc3RcIixcImV4ZWNcIixcImRlYWx0XCIsXCJuaWFnYXJhXCIsXCJpbmZcIixcImVvc1wiLFwid2FyY3JhZnRcIixcImNoYXJtc1wiLFwiY2F0YWx5c3RcIixcInRyYWRlclwiLFwiYnVja3NcIixcImFsbG93YW5jZVwiLFwidmNyXCIsXCJkZW5pYWxcIixcInVyaVwiLFwiZGVzaWduYXRpb25cIixcInRocm93blwiLFwicHJlcGFpZFwiLFwicmFpc2VzXCIsXCJnZW1cIixcImR1cGxpY2F0ZVwiLFwiZWxlY3Ryb1wiLFwiY3JpdGVyaW9uXCIsXCJiYWRnZVwiLFwid3Jpc3RcIixcImNpdmlsaXphdGlvblwiLFwiYW5hbHl6ZWRcIixcInZpZXRuYW1lc2VcIixcImhlYXRoXCIsXCJ0cmVtZW5kb3VzXCIsXCJiYWxsb3RcIixcImxleHVzXCIsXCJ2YXJ5aW5nXCIsXCJyZW1lZGllc1wiLFwidmFsaWRpdHlcIixcInRydXN0ZWVcIixcIm1hdWlcIixcImhhbmRqb2JzXCIsXCJ3ZWlnaHRlZFwiLFwiYW5nb2xhXCIsXCJzcXVpcnRcIixcInBlcmZvcm1zXCIsXCJwbGFzdGljc1wiLFwicmVhbG1cIixcImNvcnJlY3RlZFwiLFwiamVubnlcIixcImhlbG1ldFwiLFwic2FsYXJpZXNcIixcInBvc3RjYXJkXCIsXCJlbGVwaGFudFwiLFwieWVtZW5cIixcImVuY291bnRlcmVkXCIsXCJ0c3VuYW1pXCIsXCJzY2hvbGFyXCIsXCJuaWNrZWxcIixcImludGVybmF0aW9uYWxseVwiLFwic3Vycm91bmRlZFwiLFwicHNpXCIsXCJidXNlc1wiLFwiZXhwZWRpYVwiLFwiZ2VvbG9neVwiLFwicGN0XCIsXCJ3YlwiLFwiY3JlYXR1cmVzXCIsXCJjb2F0aW5nXCIsXCJjb21tZW50ZWRcIixcIndhbGxldFwiLFwiY2xlYXJlZFwiLFwic21pbGllc1wiLFwidmlkc1wiLFwiYWNjb21wbGlzaFwiLFwiYm9hdGluZ1wiLFwiZHJhaW5hZ2VcIixcInNoYWtpcmFcIixcImNvcm5lcnNcIixcImJyb2FkZXJcIixcInZlZ2V0YXJpYW5cIixcInJvdWdlXCIsXCJ5ZWFzdFwiLFwieWFsZVwiLFwibmV3Zm91bmRsYW5kXCIsXCJzblwiLFwicWxkXCIsXCJwYXNcIixcImNsZWFyaW5nXCIsXCJpbnZlc3RpZ2F0ZWRcIixcImRrXCIsXCJhbWJhc3NhZG9yXCIsXCJjb2F0ZWRcIixcImludGVuZFwiLFwic3RlcGhhbmllXCIsXCJjb250YWN0aW5nXCIsXCJ2ZWdldGF0aW9uXCIsXCJkb29tXCIsXCJmaW5kYXJ0aWNsZXNcIixcImxvdWlzZVwiLFwia2VubnlcIixcInNwZWNpYWxseVwiLFwib3dlblwiLFwicm91dGluZXNcIixcImhpdHRpbmdcIixcInl1a29uXCIsXCJiZWluZ3NcIixcImJpdGVcIixcImlzc25cIixcImFxdWF0aWNcIixcInJlbGlhbmNlXCIsXCJoYWJpdHNcIixcInN0cmlraW5nXCIsXCJteXRoXCIsXCJpbmZlY3Rpb3VzXCIsXCJwb2RjYXN0c1wiLFwic2luZ2hcIixcImdpZ1wiLFwiZ2lsYmVydFwiLFwic2FzXCIsXCJmZXJyYXJpXCIsXCJjb250aW51aXR5XCIsXCJicm9va1wiLFwiZnVcIixcIm91dHB1dHNcIixcInBoZW5vbWVub25cIixcImVuc2VtYmxlXCIsXCJpbnN1bGluXCIsXCJhc3N1cmVkXCIsXCJiaWJsaWNhbFwiLFwid2VlZFwiLFwiY29uc2Npb3VzXCIsXCJhY2NlbnRcIixcIm15c2ltb25cIixcImVsZXZlblwiLFwid2l2ZXNcIixcImFtYmllbnRcIixcInV0aWxpemVcIixcIm1pbGVhZ2VcIixcIm9lY2RcIixcInByb3N0YXRlXCIsXCJhZGFwdG9yXCIsXCJhdWJ1cm5cIixcInVubG9ja1wiLFwiaHl1bmRhaVwiLFwicGxlZGdlXCIsXCJ2YW1waXJlXCIsXCJhbmdlbGFcIixcInJlbGF0ZXNcIixcIm5pdHJvZ2VuXCIsXCJ4ZXJveFwiLFwiZGljZVwiLFwibWVyZ2VyXCIsXCJzb2Z0YmFsbFwiLFwicmVmZXJyYWxzXCIsXCJxdWFkXCIsXCJkb2NrXCIsXCJkaWZmZXJlbnRseVwiLFwiZmlyZXdpcmVcIixcIm1vZHNcIixcIm5leHRlbFwiLFwiZnJhbWluZ1wiLFwib3JnYW5pc2VkXCIsXCJtdXNpY2lhblwiLFwiYmxvY2tpbmdcIixcInJ3YW5kYVwiLFwic29ydHNcIixcImludGVncmF0aW5nXCIsXCJ2c25ldFwiLFwibGltaXRpbmdcIixcImRpc3BhdGNoXCIsXCJyZXZpc2lvbnNcIixcInBhcHVhXCIsXCJyZXN0b3JlZFwiLFwiaGludFwiLFwiYXJtb3JcIixcInJpZGVyc1wiLFwiY2hhcmdlcnNcIixcInJlbWFya1wiLFwiZG96ZW5zXCIsXCJ2YXJpZXNcIixcIm1zaWVcIixcInJlYXNvbmluZ1wiLFwid25cIixcImxpelwiLFwicmVuZGVyZWRcIixcInBpY2tpbmdcIixcImNoYXJpdGFibGVcIixcImd1YXJkc1wiLFwiYW5ub3RhdGVkXCIsXCJjY2RcIixcInN2XCIsXCJjb252aW5jZWRcIixcIm9wZW5pbmdzXCIsXCJidXlzXCIsXCJidXJsaW5ndG9uXCIsXCJyZXBsYWNpbmdcIixcInJlc2VhcmNoZXJcIixcIndhdGVyc2hlZFwiLFwiY291bmNpbHNcIixcIm9jY3VwYXRpb25zXCIsXCJhY2tub3dsZWRnZWRcIixcImtydWdlclwiLFwicG9ja2V0c1wiLFwiZ3Jhbm55XCIsXCJwb3JrXCIsXCJ6dVwiLFwiZXF1aWxpYnJpdW1cIixcInZpcmFsXCIsXCJpbnF1aXJlXCIsXCJwaXBlc1wiLFwiY2hhcmFjdGVyaXplZFwiLFwibGFkZW5cIixcImFydWJhXCIsXCJjb3R0YWdlc1wiLFwicmVhbHRvclwiLFwibWVyZ2VcIixcInByaXZpbGVnZVwiLFwiZWRnYXJcIixcImRldmVsb3BzXCIsXCJxdWFsaWZ5aW5nXCIsXCJjaGFzc2lzXCIsXCJkdWJhaVwiLFwiZXN0aW1hdGlvblwiLFwiYmFyblwiLFwicHVzaGluZ1wiLFwibGxwXCIsXCJmbGVlY2VcIixcInBlZGlhdHJpY1wiLFwiYm9jXCIsXCJmYXJlXCIsXCJkZ1wiLFwiYXN1c1wiLFwicGllcmNlXCIsXCJhbGxhblwiLFwiZHJlc3NpbmdcIixcInRlY2hyZXB1YmxpY1wiLFwic3Blcm1cIixcInZnXCIsXCJiYWxkXCIsXCJmaWxtZVwiLFwiY3JhcHNcIixcImZ1amlcIixcImZyb3N0XCIsXCJsZW9uXCIsXCJpbnN0aXR1dGVzXCIsXCJtb2xkXCIsXCJkYW1lXCIsXCJmb1wiLFwic2FsbHlcIixcInlhY2h0XCIsXCJ0cmFjeVwiLFwicHJlZmVyc1wiLFwiZHJpbGxpbmdcIixcImJyb2NodXJlc1wiLFwiaGVyYlwiLFwidG1wXCIsXCJhbG90XCIsXCJhdGVcIixcImJyZWFjaFwiLFwid2hhbGVcIixcInRyYXZlbGxlclwiLFwiYXBwcm9wcmlhdGlvbnNcIixcInN1c3BlY3RlZFwiLFwidG9tYXRvZXNcIixcImJlbmNobWFya1wiLFwiYmVnaW5uZXJzXCIsXCJpbnN0cnVjdG9yc1wiLFwiaGlnaGxpZ2h0ZWRcIixcImJlZGZvcmRcIixcInN0YXRpb25lcnlcIixcImlkbGVcIixcIm11c3RhbmdcIixcInVuYXV0aG9yaXplZFwiLFwiY2x1c3RlcnNcIixcImFudGlib2R5XCIsXCJjb21wZXRlbnRcIixcIm1vbWVudHVtXCIsXCJmaW5cIixcIndpcmluZ1wiLFwiaW9cIixcInBhc3RvclwiLFwibXVkXCIsXCJjYWx2aW5cIixcInVuaVwiLFwic2hhcmtcIixcImNvbnRyaWJ1dG9yXCIsXCJkZW1vbnN0cmF0ZXNcIixcInBoYXNlc1wiLFwiZ3JhdGVmdWxcIixcImVtZXJhbGRcIixcImdyYWR1YWxseVwiLFwibGF1Z2hpbmdcIixcImdyb3dzXCIsXCJjbGlmZlwiLFwiZGVzaXJhYmxlXCIsXCJ0cmFjdFwiLFwidWxcIixcImJhbGxldFwiLFwib2xcIixcImpvdXJuYWxpc3RcIixcImFicmFoYW1cIixcImpzXCIsXCJidW1wZXJcIixcImFmdGVyd2FyZHNcIixcIndlYnBhZ2VcIixcInJlbGlnaW9uc1wiLFwiZ2FybGljXCIsXCJob3N0ZWxzXCIsXCJzaGluZVwiLFwic2VuZWdhbFwiLFwiZXhwbG9zaW9uXCIsXCJwblwiLFwiYmFubmVkXCIsXCJ3ZW5keVwiLFwiYnJpZWZzXCIsXCJzaWduYXR1cmVzXCIsXCJkaWZmc1wiLFwiY292ZVwiLFwibXVtYmFpXCIsXCJvem9uZVwiLFwiZGlzY2lwbGluZXNcIixcImNhc2FcIixcIm11XCIsXCJkYXVnaHRlcnNcIixcImNvbnZlcnNhdGlvbnNcIixcInJhZGlvc1wiLFwidGFyaWZmXCIsXCJudmlkaWFcIixcIm9wcG9uZW50XCIsXCJwYXN0YVwiLFwic2ltcGxpZmllZFwiLFwibXVzY2xlc1wiLFwic2VydW1cIixcIndyYXBwZWRcIixcInN3aWZ0XCIsXCJtb3RoZXJib2FyZFwiLFwicnVudGltZVwiLFwiaW5ib3hcIixcImZvY2FsXCIsXCJiaWJsaW9ncmFwaGljXCIsXCJlZGVuXCIsXCJkaXN0YW50XCIsXCJpbmNsXCIsXCJjaGFtcGFnbmVcIixcImFsYVwiLFwiZGVjaW1hbFwiLFwiaHFcIixcImRldmlhdGlvblwiLFwic3VwZXJpbnRlbmRlbnRcIixcInByb3BlY2lhXCIsXCJkaXBcIixcIm5iY1wiLFwic2FtYmFcIixcImhvc3RlbFwiLFwiaG91c2V3aXZlc1wiLFwiZW1wbG95XCIsXCJtb25nb2xpYVwiLFwicGVuZ3VpblwiLFwibWFnaWNhbFwiLFwiaW5mbHVlbmNlc1wiLFwiaW5zcGVjdGlvbnNcIixcImlycmlnYXRpb25cIixcIm1pcmFjbGVcIixcIm1hbnVhbGx5XCIsXCJyZXByaW50XCIsXCJyZWlkXCIsXCJ3dFwiLFwiaHlkcmF1bGljXCIsXCJjZW50ZXJlZFwiLFwicm9iZXJ0c29uXCIsXCJmbGV4XCIsXCJ5ZWFybHlcIixcInBlbmV0cmF0aW9uXCIsXCJ3b3VuZFwiLFwiYmVsbGVcIixcInJvc2FcIixcImNvbnZpY3Rpb25cIixcImhhc2hcIixcIm9taXNzaW9uc1wiLFwid3JpdGluZ3NcIixcImhhbWJ1cmdcIixcImxhenlcIixcIm12XCIsXCJtcGdcIixcInJldHJpZXZhbFwiLFwicXVhbGl0aWVzXCIsXCJjaW5keVwiLFwiZmF0aGVyc1wiLFwiY2FyYlwiLFwiY2hhcmdpbmdcIixcImNhc1wiLFwibWFydmVsXCIsXCJsaW5lZFwiLFwiY2lvXCIsXCJkb3dcIixcInByb3RvdHlwZVwiLFwiaW1wb3J0YW50bHlcIixcInJiXCIsXCJwZXRpdGVcIixcImFwcGFyYXR1c1wiLFwidXBjXCIsXCJ0ZXJyYWluXCIsXCJkdWlcIixcInBlbnNcIixcImV4cGxhaW5pbmdcIixcInllblwiLFwic3RyaXBzXCIsXCJnb3NzaXBcIixcInJhbmdlcnNcIixcIm5vbWluYXRpb25cIixcImVtcGlyaWNhbFwiLFwibWhcIixcInJvdGFyeVwiLFwid29ybVwiLFwiZGVwZW5kZW5jZVwiLFwiZGlzY3JldGVcIixcImJlZ2lubmVyXCIsXCJib3hlZFwiLFwibGlkXCIsXCJzZXh1YWxpdHlcIixcInBvbHllc3RlclwiLFwiY3ViaWNcIixcImRlYWZcIixcImNvbW1pdG1lbnRzXCIsXCJzdWdnZXN0aW5nXCIsXCJzYXBwaGlyZVwiLFwia2luYXNlXCIsXCJza2lydHNcIixcIm1hdHNcIixcInJlbWFpbmRlclwiLFwiY3Jhd2ZvcmRcIixcImxhYmVsZWRcIixcInByaXZpbGVnZXNcIixcInRlbGV2aXNpb25zXCIsXCJzcGVjaWFsaXppbmdcIixcIm1hcmtpbmdcIixcImNvbW1vZGl0aWVzXCIsXCJwdmNcIixcInNlcmJpYVwiLFwic2hlcmlmZlwiLFwiZ3JpZmZpblwiLFwiZGVjbGluZWRcIixcImd1eWFuYVwiLFwic3BpZXNcIixcImJsYWhcIixcIm1pbWVcIixcIm5laWdoYm9yXCIsXCJtb3RvcmN5Y2xlc1wiLFwiZWxlY3RcIixcImhpZ2h3YXlzXCIsXCJ0aGlua3BhZFwiLFwiY29uY2VudHJhdGVcIixcImludGltYXRlXCIsXCJyZXByb2R1Y3RpdmVcIixcInByZXN0b25cIixcImRlYWRseVwiLFwiZmVvZlwiLFwiYnVubnlcIixcImNoZXZ5XCIsXCJtb2xlY3VsZXNcIixcInJvdW5kc1wiLFwibG9uZ2VzdFwiLFwicmVmcmlnZXJhdG9yXCIsXCJ0aW9uc1wiLFwiaW50ZXJ2YWxzXCIsXCJzZW50ZW5jZXNcIixcImRlbnRpc3RzXCIsXCJ1c2RhXCIsXCJleGNsdXNpb25cIixcIndvcmtzdGF0aW9uXCIsXCJob2xvY2F1c3RcIixcImtlZW5cIixcImZseWVyXCIsXCJwZWFzXCIsXCJkb3NhZ2VcIixcInJlY2VpdmVyc1wiLFwidXJsc1wiLFwiY3VzdG9taXNlXCIsXCJkaXNwb3NpdGlvblwiLFwidmFyaWFuY2VcIixcIm5hdmlnYXRvclwiLFwiaW52ZXN0aWdhdG9yc1wiLFwiY2FtZXJvb25cIixcImJha2luZ1wiLFwibWFyaWp1YW5hXCIsXCJhZGFwdGl2ZVwiLFwiY29tcHV0ZWRcIixcIm5lZWRsZVwiLFwiYmF0aHNcIixcImVuYlwiLFwiZ2dcIixcImNhdGhlZHJhbFwiLFwiYnJha2VzXCIsXCJvZ1wiLFwibmlydmFuYVwiLFwia29cIixcImZhaXJmaWVsZFwiLFwib3duc1wiLFwidGlsXCIsXCJpbnZpc2lvblwiLFwic3RpY2t5XCIsXCJkZXN0aW55XCIsXCJnZW5lcm91c1wiLFwibWFkbmVzc1wiLFwiZW1hY3NcIixcImNsaW1iXCIsXCJibG93aW5nXCIsXCJmYXNjaW5hdGluZ1wiLFwibGFuZHNjYXBlc1wiLFwiaGVhdGVkXCIsXCJsYWZheWV0dGVcIixcImphY2tpZVwiLFwid3RvXCIsXCJjb21wdXRhdGlvblwiLFwiaGF5XCIsXCJjYXJkaW92YXNjdWxhclwiLFwid3dcIixcInNwYXJjXCIsXCJjYXJkaWFjXCIsXCJzYWx2YXRpb25cIixcImRvdmVyXCIsXCJhZHJpYW5cIixcInByZWRpY3Rpb25zXCIsXCJhY2NvbXBhbnlpbmdcIixcInZhdGljYW5cIixcImJydXRhbFwiLFwibGVhcm5lcnNcIixcImdkXCIsXCJzZWxlY3RpdmVcIixcImFyYml0cmF0aW9uXCIsXCJjb25maWd1cmluZ1wiLFwidG9rZW5cIixcImVkaXRvcmlhbHNcIixcInppbmNcIixcInNhY3JpZmljZVwiLFwic2Vla2Vyc1wiLFwiZ3VydVwiLFwiaXNhXCIsXCJyZW1vdmFibGVcIixcImNvbnZlcmdlbmNlXCIsXCJ5aWVsZHNcIixcImdpYnJhbHRhclwiLFwibGV2eVwiLFwic3VpdGVkXCIsXCJudW1lcmljXCIsXCJhbnRocm9wb2xvZ3lcIixcInNrYXRpbmdcIixcImtpbmRhXCIsXCJhYmVyZGVlblwiLFwiZW1wZXJvclwiLFwiZ3JhZFwiLFwibWFscHJhY3RpY2VcIixcImR5bGFuXCIsXCJicmFzXCIsXCJiZWx0c1wiLFwiYmxhY2tzXCIsXCJlZHVjYXRlZFwiLFwicmViYXRlc1wiLFwicmVwb3J0ZXJzXCIsXCJidXJrZVwiLFwicHJvdWRseVwiLFwicGl4XCIsXCJuZWNlc3NpdHlcIixcInJlbmRlcmluZ1wiLFwibWljXCIsXCJpbnNlcnRlZFwiLFwicHVsbGluZ1wiLFwiYmFzZW5hbWVcIixcImt5bGVcIixcIm9iZXNpdHlcIixcImN1cnZlc1wiLFwic3VidXJiYW5cIixcInRvdXJpbmdcIixcImNsYXJhXCIsXCJ2ZXJ0ZXhcIixcImJ3XCIsXCJoZXBhdGl0aXNcIixcIm5hdGlvbmFsbHlcIixcInRvbWF0b1wiLFwiYW5kb3JyYVwiLFwid2F0ZXJwcm9vZlwiLFwiZXhwaXJlZFwiLFwibWpcIixcInRyYXZlbHNcIixcImZsdXNoXCIsXCJ3YWl2ZXJcIixcInBhbGVcIixcInNwZWNpYWx0aWVzXCIsXCJoYXllc1wiLFwiaHVtYW5pdGFyaWFuXCIsXCJpbnZpdGF0aW9uc1wiLFwiZnVuY3Rpb25pbmdcIixcImRlbGlnaHRcIixcInN1cnZpdm9yXCIsXCJnYXJjaWFcIixcImNpbmd1bGFyXCIsXCJlY29ub21pZXNcIixcImFsZXhhbmRyaWFcIixcImJhY3RlcmlhbFwiLFwibW9zZXNcIixcImNvdW50ZWRcIixcInVuZGVydGFrZVwiLFwiZGVjbGFyZVwiLFwiY29udGludW91c2x5XCIsXCJqb2huc1wiLFwidmFsdmVzXCIsXCJnYXBzXCIsXCJpbXBhaXJlZFwiLFwiYWNoaWV2ZW1lbnRzXCIsXCJkb25vcnNcIixcInRlYXJcIixcImpld2VsXCIsXCJ0ZWRkeVwiLFwibGZcIixcImNvbnZlcnRpYmxlXCIsXCJhdGFcIixcInRlYWNoZXNcIixcInZlbnR1cmVzXCIsXCJuaWxcIixcImJ1ZmluZ1wiLFwic3RyYW5nZXJcIixcInRyYWdlZHlcIixcImp1bGlhblwiLFwibmVzdFwiLFwicGFtXCIsXCJkcnllclwiLFwicGFpbmZ1bFwiLFwidmVsdmV0XCIsXCJ0cmlidW5hbFwiLFwicnVsZWRcIixcIm5hdG9cIixcInBlbnNpb25zXCIsXCJwcmF5ZXJzXCIsXCJmdW5reVwiLFwic2VjcmV0YXJpYXRcIixcIm5vd2hlcmVcIixcImNvcFwiLFwicGFyYWdyYXBoc1wiLFwiZ2FsZVwiLFwiam9pbnNcIixcImFkb2xlc2NlbnRcIixcIm5vbWluYXRpb25zXCIsXCJ3ZXNsZXlcIixcImRpbVwiLFwibGF0ZWx5XCIsXCJjYW5jZWxsZWRcIixcInNjYXJ5XCIsXCJtYXR0cmVzc1wiLFwibXBlZ3NcIixcImJydW5laVwiLFwibGlrZXdpc2VcIixcImJhbmFuYVwiLFwiaW50cm9kdWN0b3J5XCIsXCJzbG92YWtcIixcImNha2VzXCIsXCJzdGFuXCIsXCJyZXNlcnZvaXJcIixcIm9jY3VycmVuY2VcIixcImlkb2xcIixcIm1peGVyXCIsXCJyZW1pbmRcIixcIndjXCIsXCJ3b3JjZXN0ZXJcIixcInNiamN0XCIsXCJkZW1vZ3JhcGhpY1wiLFwiY2hhcm1pbmdcIixcIm1haVwiLFwidG9vdGhcIixcImRpc2NpcGxpbmFyeVwiLFwiYW5ub3lpbmdcIixcInJlc3BlY3RlZFwiLFwic3RheXNcIixcImRpc2Nsb3NlXCIsXCJhZmZhaXJcIixcImRyb3ZlXCIsXCJ3YXNoZXJcIixcInVwc2V0XCIsXCJyZXN0cmljdFwiLFwic3ByaW5nZXJcIixcImJlc2lkZVwiLFwibWluZXNcIixcInBvcnRyYWl0c1wiLFwicmVib3VuZFwiLFwibG9nYW5cIixcIm1lbnRvclwiLFwiaW50ZXJwcmV0ZWRcIixcImV2YWx1YXRpb25zXCIsXCJmb3VnaHRcIixcImJhZ2hkYWRcIixcImVsaW1pbmF0aW9uXCIsXCJtZXRyZXNcIixcImh5cG90aGV0aWNhbFwiLFwiaW1taWdyYW50c1wiLFwiY29tcGxpbWVudGFyeVwiLFwiaGVsaWNvcHRlclwiLFwicGVuY2lsXCIsXCJmcmVlemVcIixcImhrXCIsXCJwZXJmb3JtZXJcIixcImFidVwiLFwidGl0bGVkXCIsXCJjb21taXNzaW9uc1wiLFwic3BoZXJlXCIsXCJwb3dlcnNlbGxlclwiLFwibW9zc1wiLFwicmF0aW9zXCIsXCJjb25jb3JkXCIsXCJncmFkdWF0ZWRcIixcImVuZG9yc2VkXCIsXCJ0eVwiLFwic3VycHJpc2luZ1wiLFwid2FsbnV0XCIsXCJsYW5jZVwiLFwibGFkZGVyXCIsXCJpdGFsaWFcIixcInVubmVjZXNzYXJ5XCIsXCJkcmFtYXRpY2FsbHlcIixcImxpYmVyaWFcIixcInNoZXJtYW5cIixcImNvcmtcIixcIm1heGltaXplXCIsXCJjalwiLFwiaGFuc2VuXCIsXCJzZW5hdG9yc1wiLFwid29ya291dFwiLFwibWFsaVwiLFwieXVnb3NsYXZpYVwiLFwiYmxlZWRpbmdcIixcImNoYXJhY3Rlcml6YXRpb25cIixcImNvbG9uXCIsXCJsaWtlbGlob29kXCIsXCJsYW5lc1wiLFwicHVyc2VcIixcImZ1bmRhbWVudGFsc1wiLFwiY29udGFtaW5hdGlvblwiLFwibXR2XCIsXCJlbmRhbmdlcmVkXCIsXCJjb21wcm9taXNlXCIsXCJtYXN0dXJiYXRpb25cIixcIm9wdGltaXplXCIsXCJzdGF0aW5nXCIsXCJkb21lXCIsXCJjYXJvbGluZVwiLFwibGV1XCIsXCJleHBpcmF0aW9uXCIsXCJuYW1lc3BhY2VcIixcImFsaWduXCIsXCJwZXJpcGhlcmFsXCIsXCJibGVzc1wiLFwiZW5nYWdpbmdcIixcIm5lZ290aWF0aW9uXCIsXCJjcmVzdFwiLFwib3Bwb25lbnRzXCIsXCJ0cml1bXBoXCIsXCJub21pbmF0ZWRcIixcImNvbmZpZGVudGlhbGl0eVwiLFwiZWxlY3RvcmFsXCIsXCJjaGFuZ2Vsb2dcIixcIndlbGRpbmdcIixcImRlZmVycmVkXCIsXCJhbHRlcm5hdGl2ZWx5XCIsXCJoZWVsXCIsXCJhbGxveVwiLFwiY29uZG9zXCIsXCJwbG90c1wiLFwicG9saXNoZWRcIixcInlhbmdcIixcImdlbnRseVwiLFwiZ3JlZW5zYm9yb1wiLFwidHVsc2FcIixcImxvY2tpbmdcIixcImNhc2V5XCIsXCJjb250cm92ZXJzaWFsXCIsXCJkcmF3c1wiLFwiZnJpZGdlXCIsXCJibGFua2V0XCIsXCJibG9vbVwiLFwicWNcIixcInNpbXBzb25zXCIsXCJsb3VcIixcImVsbGlvdHRcIixcInJlY292ZXJlZFwiLFwiZnJhc2VyXCIsXCJqdXN0aWZ5XCIsXCJ1cGdyYWRpbmdcIixcImJsYWRlc1wiLFwicGdwXCIsXCJsb29wc1wiLFwic3VyZ2VcIixcImZyb250cGFnZVwiLFwidHJhdW1hXCIsXCJhd1wiLFwidGFob2VcIixcImFkdmVydFwiLFwicG9zc2Vzc1wiLFwiZGVtYW5kaW5nXCIsXCJkZWZlbnNpdmVcIixcInNpcFwiLFwiZmxhc2hlcnNcIixcInN1YmFydVwiLFwiZm9yYmlkZGVuXCIsXCJ0ZlwiLFwidmFuaWxsYVwiLFwicHJvZ3JhbW1lcnNcIixcInBqXCIsXCJtb25pdG9yZWRcIixcImluc3RhbGxhdGlvbnNcIixcImRldXRzY2hsYW5kXCIsXCJwaWNuaWNcIixcInNvdWxzXCIsXCJhcnJpdmFsc1wiLFwic3BhbmtcIixcImN3XCIsXCJwcmFjdGl0aW9uZXJcIixcIm1vdGl2YXRlZFwiLFwid3JcIixcImR1bWJcIixcInNtaXRoc29uaWFuXCIsXCJob2xsb3dcIixcInZhdWx0XCIsXCJzZWN1cmVseVwiLFwiZXhhbWluaW5nXCIsXCJmaW9yaWNldFwiLFwiZ3Jvb3ZlXCIsXCJyZXZlbGF0aW9uXCIsXCJyZ1wiLFwicHVyc3VpdFwiLFwiZGVsZWdhdGlvblwiLFwid2lyZXNcIixcImJsXCIsXCJkaWN0aW9uYXJpZXNcIixcIm1haWxzXCIsXCJiYWNraW5nXCIsXCJncmVlbmhvdXNlXCIsXCJzbGVlcHNcIixcInZjXCIsXCJibGFrZVwiLFwidHJhbnNwYXJlbmN5XCIsXCJkZWVcIixcInRyYXZpc1wiLFwid3hcIixcImVuZGxlc3NcIixcImZpZ3VyZWRcIixcIm9yYml0XCIsXCJjdXJyZW5jaWVzXCIsXCJuaWdlclwiLFwiYmFjb25cIixcInN1cnZpdm9yc1wiLFwicG9zaXRpb25pbmdcIixcImhlYXRlclwiLFwiY29sb255XCIsXCJjYW5ub25cIixcImNpcmN1c1wiLFwicHJvbW90ZWRcIixcImZvcmJlc1wiLFwibWFlXCIsXCJtb2xkb3ZhXCIsXCJtZWxcIixcImRlc2NlbmRpbmdcIixcInBheGlsXCIsXCJzcGluZVwiLFwidHJvdXRcIixcImVuY2xvc2VkXCIsXCJmZWF0XCIsXCJ0ZW1wb3JhcmlseVwiLFwibnRzY1wiLFwiY29va2VkXCIsXCJ0aHJpbGxlclwiLFwidHJhbnNtaXRcIixcImFwbmljXCIsXCJmYXR0eVwiLFwiZ2VyYWxkXCIsXCJwcmVzc2VkXCIsXCJmcmVxdWVuY2llc1wiLFwic2Nhbm5lZFwiLFwicmVmbGVjdGlvbnNcIixcImh1bmdlclwiLFwibWFyaWFoXCIsXCJzaWNcIixcIm11bmljaXBhbGl0eVwiLFwidXNwc1wiLFwiam95Y2VcIixcImRldGVjdGl2ZVwiLFwic3VyZ2VvblwiLFwiY2VtZW50XCIsXCJleHBlcmllbmNpbmdcIixcImZpcmVwbGFjZVwiLFwiZW5kb3JzZW1lbnRcIixcImJnXCIsXCJwbGFubmVyc1wiLFwiZGlzcHV0ZXNcIixcInRleHRpbGVzXCIsXCJtaXNzaWxlXCIsXCJpbnRyYW5ldFwiLFwiY2xvc2VzXCIsXCJzZXFcIixcInBzeWNoaWF0cnlcIixcInBlcnNpc3RlbnRcIixcImRlYm9yYWhcIixcImNvbmZcIixcIm1hcmNvXCIsXCJhc3Npc3RzXCIsXCJzdW1tYXJpZXNcIixcImdsb3dcIixcImdhYnJpZWxcIixcImF1ZGl0b3JcIixcIndtYVwiLFwiYXF1YXJpdW1cIixcInZpb2xpblwiLFwicHJvcGhldFwiLFwiY2lyXCIsXCJicmFja2V0XCIsXCJsb29rc21hcnRcIixcImlzYWFjXCIsXCJveGlkZVwiLFwib2Frc1wiLFwibWFnbmlmaWNlbnRcIixcImVyaWtcIixcImNvbGxlYWd1ZVwiLFwibmFwbGVzXCIsXCJwcm9tcHRseVwiLFwibW9kZW1zXCIsXCJhZGFwdGF0aW9uXCIsXCJodVwiLFwiaGFybWZ1bFwiLFwicGFpbnRiYWxsXCIsXCJwcm96YWNcIixcInNleHVhbGx5XCIsXCJlbmNsb3N1cmVcIixcImFjbVwiLFwiZGl2aWRlbmRcIixcIm5ld2Fya1wiLFwia3dcIixcInBhc29cIixcImdsdWNvc2VcIixcInBoYW50b21cIixcIm5vcm1cIixcInBsYXliYWNrXCIsXCJzdXBlcnZpc29yc1wiLFwid2VzdG1pbnN0ZXJcIixcInR1cnRsZVwiLFwiaXBzXCIsXCJkaXN0YW5jZXNcIixcImFic29ycHRpb25cIixcInRyZWFzdXJlc1wiLFwiZHNjXCIsXCJ3YXJuZWRcIixcIm5ldXJhbFwiLFwid2FyZVwiLFwiZm9zc2lsXCIsXCJtaWFcIixcImhvbWV0b3duXCIsXCJiYWRseVwiLFwidHJhbnNjcmlwdHNcIixcImFwb2xsb1wiLFwid2FuXCIsXCJkaXNhcHBvaW50ZWRcIixcInBlcnNpYW5cIixcImNvbnRpbnVhbGx5XCIsXCJjb21tdW5pc3RcIixcImNvbGxlY3RpYmxlXCIsXCJoYW5kbWFkZVwiLFwiZ3JlZW5lXCIsXCJlbnRyZXByZW5ldXJzXCIsXCJyb2JvdHNcIixcImdyZW5hZGFcIixcImNyZWF0aW9uc1wiLFwiamFkZVwiLFwic2Nvb3BcIixcImFjcXVpc2l0aW9uc1wiLFwiZm91bFwiLFwia2Vub1wiLFwiZ3RrXCIsXCJlYXJuaW5nXCIsXCJtYWlsbWFuXCIsXCJzYW55b1wiLFwibmVzdGVkXCIsXCJiaW9kaXZlcnNpdHlcIixcImV4Y2l0ZW1lbnRcIixcInNvbWFsaWFcIixcIm1vdmVyc1wiLFwidmVyYmFsXCIsXCJibGlua1wiLFwicHJlc2VudGx5XCIsXCJzZWFzXCIsXCJjYXJsb1wiLFwid29ya2Zsb3dcIixcIm15c3RlcmlvdXNcIixcIm5vdmVsdHlcIixcImJyeWFudFwiLFwidGlsZXNcIixcInZveXVlclwiLFwibGlicmFyaWFuXCIsXCJzdWJzaWRpYXJpZXNcIixcInN3aXRjaGVkXCIsXCJzdG9ja2hvbG1cIixcInRhbWlsXCIsXCJnYXJtaW5cIixcInJ1XCIsXCJwb3NlXCIsXCJmdXp6eVwiLFwiaW5kb25lc2lhblwiLFwiZ3JhbXNcIixcInRoZXJhcGlzdFwiLFwicmljaGFyZHNcIixcIm1ybmFcIixcImJ1ZGdldHNcIixcInRvb2xraXRcIixcInByb21pc2luZ1wiLFwicmVsYXhhdGlvblwiLFwiZ29hdFwiLFwicmVuZGVyXCIsXCJjYXJtZW5cIixcImlyYVwiLFwic2VuXCIsXCJ0aGVyZWFmdGVyXCIsXCJoYXJkd29vZFwiLFwiZXJvdGljYVwiLFwidGVtcG9yYWxcIixcInNhaWxcIixcImZvcmdlXCIsXCJjb21taXNzaW9uZXJzXCIsXCJkZW5zZVwiLFwiZHRzXCIsXCJicmF2ZVwiLFwiZm9yd2FyZGluZ1wiLFwicXRcIixcImF3ZnVsXCIsXCJuaWdodG1hcmVcIixcImFpcnBsYW5lXCIsXCJyZWR1Y3Rpb25zXCIsXCJzb3V0aGFtcHRvblwiLFwiaXN0YW5idWxcIixcImltcG9zZVwiLFwib3JnYW5pc21zXCIsXCJzZWdhXCIsXCJ0ZWxlc2NvcGVcIixcInZpZXdlcnNcIixcImFzYmVzdG9zXCIsXCJwb3J0c21vdXRoXCIsXCJjZG5hXCIsXCJtZXllclwiLFwiZW50ZXJzXCIsXCJwb2RcIixcInNhdmFnZVwiLFwiYWR2YW5jZW1lbnRcIixcInd1XCIsXCJoYXJhc3NtZW50XCIsXCJ3aWxsb3dcIixcInJlc3VtZXNcIixcImJvbHRcIixcImdhZ2VcIixcInRocm93aW5nXCIsXCJleGlzdGVkXCIsXCJnZW5lcmF0b3JzXCIsXCJsdVwiLFwid2Fnb25cIixcImJhcmJpZVwiLFwiZGF0XCIsXCJmYXZvdXJcIixcInNvYVwiLFwia25vY2tcIixcInVyZ2VcIixcInNtdHBcIixcImdlbmVyYXRlc1wiLFwicG90YXRvZXNcIixcInRob3JvdWdoXCIsXCJyZXBsaWNhdGlvblwiLFwiaW5leHBlbnNpdmVcIixcImt1cnRcIixcInJlY2VwdG9yc1wiLFwicGVlcnNcIixcInJvbGFuZFwiLFwib3B0aW11bVwiLFwibmVvblwiLFwiaW50ZXJ2ZW50aW9uc1wiLFwicXVpbHRcIixcImh1bnRpbmd0b25cIixcImNyZWF0dXJlXCIsXCJvdXJzXCIsXCJtb3VudHNcIixcInN5cmFjdXNlXCIsXCJpbnRlcm5zaGlwXCIsXCJsb25lXCIsXCJyZWZyZXNoXCIsXCJhbHVtaW5pdW1cIixcInNub3dib2FyZFwiLFwiYmVhc3RhbGl0eVwiLFwid2ViY2FzdFwiLFwibWljaGVsXCIsXCJldmFuZXNjZW5jZVwiLFwic3VidGxlXCIsXCJjb29yZGluYXRlZFwiLFwibm90cmVcIixcInNoaXBtZW50c1wiLFwibWFsZGl2ZXNcIixcInN0cmlwZXNcIixcImZpcm13YXJlXCIsXCJhbnRhcmN0aWNhXCIsXCJjb3BlXCIsXCJzaGVwaGVyZFwiLFwibG1cIixcImNhbmJlcnJhXCIsXCJjcmFkbGVcIixcImNoYW5jZWxsb3JcIixcIm1hbWJvXCIsXCJsaW1lXCIsXCJraXJrXCIsXCJmbG91clwiLFwiY29udHJvdmVyc3lcIixcImxlZ2VuZGFyeVwiLFwiYm9vbFwiLFwic3ltcGF0aHlcIixcImNob2lyXCIsXCJhdm9pZGluZ1wiLFwiYmVhdXRpZnVsbHlcIixcImJsb25kXCIsXCJleHBlY3RzXCIsXCJjaG9cIixcImp1bXBpbmdcIixcImZhYnJpY3NcIixcImFudGlib2RpZXNcIixcInBvbHltZXJcIixcImh5Z2llbmVcIixcIndpdFwiLFwicG91bHRyeVwiLFwidmlydHVlXCIsXCJidXJzdFwiLFwiZXhhbWluYXRpb25zXCIsXCJzdXJnZW9uc1wiLFwiYm91cXVldFwiLFwiaW1tdW5vbG9neVwiLFwicHJvbW90ZXNcIixcIm1hbmRhdGVcIixcIndpbGV5XCIsXCJkZXBhcnRtZW50YWxcIixcImJic1wiLFwic3Bhc1wiLFwiaW5kXCIsXCJjb3JwdXNcIixcImpvaG5zdG9uXCIsXCJ0ZXJtaW5vbG9neVwiLFwiZ2VudGxlbWFuXCIsXCJmaWJyZVwiLFwicmVwcm9kdWNlXCIsXCJjb252aWN0ZWRcIixcInNoYWRlc1wiLFwiamV0c1wiLFwiaW5kaWNlc1wiLFwicm9vbW1hdGVzXCIsXCJhZHdhcmVcIixcInF1aVwiLFwiaW50bFwiLFwidGhyZWF0ZW5pbmdcIixcInNwb2tlc21hblwiLFwiem9sb2Z0XCIsXCJhY3RpdmlzdHNcIixcImZyYW5rZnVydFwiLFwicHJpc29uZXJcIixcImRhaXN5XCIsXCJoYWxpZmF4XCIsXCJlbmNvdXJhZ2VzXCIsXCJ1bHRyYW1cIixcImN1cnNvclwiLFwiYXNzZW1ibGVkXCIsXCJlYXJsaWVzdFwiLFwiZG9uYXRlZFwiLFwic3R1ZmZlZFwiLFwicmVzdHJ1Y3R1cmluZ1wiLFwiaW5zZWN0c1wiLFwidGVybWluYWxzXCIsXCJjcnVkZVwiLFwibW9ycmlzb25cIixcIm1haWRlblwiLFwic2ltdWxhdGlvbnNcIixcImN6XCIsXCJzdWZmaWNpZW50bHlcIixcImV4YW1pbmVzXCIsXCJ2aWtpbmdcIixcIm15cnRsZVwiLFwiYm9yZWRcIixcImNsZWFudXBcIixcInlhcm5cIixcImtuaXRcIixcImNvbmRpdGlvbmFsXCIsXCJtdWdcIixcImNyb3Nzd29yZFwiLFwiYm90aGVyXCIsXCJidWRhcGVzdFwiLFwiY29uY2VwdHVhbFwiLFwia25pdHRpbmdcIixcImF0dGFja2VkXCIsXCJobFwiLFwiYmh1dGFuXCIsXCJsaWVjaHRlbnN0ZWluXCIsXCJtYXRpbmdcIixcImNvbXB1dGVcIixcInJlZGhlYWRcIixcImFycml2ZXNcIixcInRyYW5zbGF0b3JcIixcImF1dG9tb2JpbGVzXCIsXCJ0cmFjdG9yXCIsXCJhbGxhaFwiLFwiY29udGluZW50XCIsXCJvYlwiLFwidW53cmFwXCIsXCJmYXJlc1wiLFwibG9uZ2l0dWRlXCIsXCJyZXNpc3RcIixcImNoYWxsZW5nZWRcIixcInRlbGVjaGFyZ2VyXCIsXCJob3BlZFwiLFwicGlrZVwiLFwic2FmZXJcIixcImluc2VydGlvblwiLFwiaW5zdHJ1bWVudGF0aW9uXCIsXCJpZHNcIixcImh1Z29cIixcIndhZ25lclwiLFwiY29uc3RyYWludFwiLFwiZ3JvdW5kd2F0ZXJcIixcInRvdWNoZWRcIixcInN0cmVuZ3RoZW5pbmdcIixcImNvbG9nbmVcIixcImd6aXBcIixcIndpc2hpbmdcIixcInJhbmdlclwiLFwic21hbGxlc3RcIixcImluc3VsYXRpb25cIixcIm5ld21hblwiLFwibWFyc2hcIixcInJpY2t5XCIsXCJjdHJsXCIsXCJzY2FyZWRcIixcInRoZXRhXCIsXCJpbmZyaW5nZW1lbnRcIixcImJlbnRcIixcImxhb3NcIixcInN1YmplY3RpdmVcIixcIm1vbnN0ZXJzXCIsXCJhc3lsdW1cIixcImxpZ2h0Ym94XCIsXCJyb2JiaWVcIixcInN0YWtlXCIsXCJjb2NrdGFpbFwiLFwib3V0bGV0c1wiLFwic3dhemlsYW5kXCIsXCJ2YXJpZXRpZXNcIixcImFyYm9yXCIsXCJtZWRpYXdpa2lcIixcImNvbmZpZ3VyYXRpb25zXCIsXCJwb2lzb25cIixcIlwiXTtcblxuLyogXG4gQXNrIGZvciB3b3JkIHN1Z2dlc3Rpb25zIHRoYXQgd291bGQgZml0IGluIGEgY2VydGFpbiBwYXR0ZXJuLlxuIFRoZSBwYXR0ZXJuIGlzIGRlZmluZWQgYnkgdXNpbmcgPydzIGZvciB0aGUgYmxhbmsgbGV0dGVyc1xuIEEgbWF4aW11bSBvZiB0aHJlZSBhbmQgYSBtaW5pbXVtIG9mIG5vIHdvcmRzIGFyZSByZXR1cm5lZC5cbiBJZiB0aGUgcmVzdWx0aW5nIHNldCBpcyBtb3JlIHRoYW4gdGhyZWUgd29yZHMsIHRoZSByZXN1bHRpbmcgdGhyZWUgXG4gd2lsbCBiZSBzZWxlY3RlZCByYW5kb21seS5cbiBlZy4gXCI/eD8/cj9cIiBtaWdodCBzdWdnZXN0IFwianh3b3JkXCJcbiovXG5mdW5jdGlvbiBzdWdnZXN0KHBhdHRlcm4pIHtcbiAgICBwYXR0ZXJuID0gcGF0dGVybi50b0xvd2VyQ2FzZSgpO1xuICAgIC8vIEZpcnN0IGxldCdzIGp1c3QgY29uc2lkZXIgd29yZHMgb2YgdGhlIGNvcnJlY3QgbGVuZ3RoXG4gICAgbGV0IG1hdGNoZXMgPSB3b3Jkcy5maWx0ZXIod29yZCA9PiB3b3JkLmxlbmd0aCA9PT0gcGF0dGVybi5sZW5ndGgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0dGVybi5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocGF0dGVybltpXSAhPT0gXCI/XCIpIHtcbiAgICAgICAgICAgIG1hdGNoZXMgPSBtYXRjaGVzLmZpbHRlcih3b3JkID0+IHdvcmRbaV0gPT09IHBhdHRlcm5baV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChtYXRjaGVzLmxlbmd0aCA8PSAzKSByZXR1cm4gbWF0Y2hlcztcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgICAgbGV0IGluZGV4ID0gTWF0aC5yYW5kb20oKSAqIG1hdGNoZXMubGVuZ3RoO1xuICAgICAgICByZXN1bHQucHVzaCguLi5tYXRjaGVzLnNwbGljZShpbmRleCwgMSkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKiBzcmMvUXVlc3Rpb24uc3ZlbHRlIGdlbmVyYXRlZCBieSBTdmVsdGUgdjMuNDYuNCAqL1xuXG5mdW5jdGlvbiBnZXRfZWFjaF9jb250ZXh0JDIoY3R4LCBsaXN0LCBpKSB7XG5cdGNvbnN0IGNoaWxkX2N0eCA9IGN0eC5zbGljZSgpO1xuXHRjaGlsZF9jdHhbMTZdID0gbGlzdFtpXTtcblx0cmV0dXJuIGNoaWxkX2N0eDtcbn1cblxuLy8gKDgyOjQpIHs6ZWxzZX1cbmZ1bmN0aW9uIGNyZWF0ZV9lbHNlX2Jsb2NrJDEoY3R4KSB7XG5cdGxldCBkaXY7XG5cdGxldCB0MF92YWx1ZSA9IC8qcXVlc3Rpb24qLyBjdHhbMF0ubnVtICsgXCJcIjtcblx0bGV0IHQwO1xuXHRsZXQgdDE7XG5cdGxldCB0Ml92YWx1ZSA9ICgvKnF1ZXN0aW9uKi8gY3R4WzBdLnF1ZXN0aW9uIHx8IFwiTm8gcXVlc3Rpb24gc2V0XCIpICsgXCJcIjtcblx0bGV0IHQyO1xuXHRsZXQgdDM7XG5cdGxldCB0NF92YWx1ZSA9IC8qcXVlc3Rpb24qLyBjdHhbMF0uYW5zd2VyICsgXCJcIjtcblx0bGV0IHQ0O1xuXHRsZXQgdDU7XG5cdGxldCBtb3VudGVkO1xuXHRsZXQgZGlzcG9zZTtcblx0bGV0IGlmX2Jsb2NrID0gLypzdWdnZXN0aW9ucyovIGN0eFsxXS5sZW5ndGggJiYgY3JlYXRlX2lmX2Jsb2NrXzEkMShjdHgpO1xuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdGRpdiA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHR0MCA9IHRleHQodDBfdmFsdWUpO1xuXHRcdFx0dDEgPSB0ZXh0KFwiOiBcIik7XG5cdFx0XHR0MiA9IHRleHQodDJfdmFsdWUpO1xuXHRcdFx0dDMgPSB0ZXh0KFwiIH4gXCIpO1xuXHRcdFx0dDQgPSB0ZXh0KHQ0X3ZhbHVlKTtcblx0XHRcdHQ1ID0gc3BhY2UoKTtcblx0XHRcdGlmIChpZl9ibG9jaykgaWZfYmxvY2suYygpO1xuXHRcdFx0YXR0cihkaXYsIFwiY2xhc3NcIiwgXCJqeHdvcmQtcXVlc3Rpb24gc3ZlbHRlLTFiaGhpbjdcIik7XG5cdFx0fSxcblx0XHRtKHRhcmdldCwgYW5jaG9yKSB7XG5cdFx0XHRpbnNlcnQodGFyZ2V0LCBkaXYsIGFuY2hvcik7XG5cdFx0XHRhcHBlbmQoZGl2LCB0MCk7XG5cdFx0XHRhcHBlbmQoZGl2LCB0MSk7XG5cdFx0XHRhcHBlbmQoZGl2LCB0Mik7XG5cdFx0XHRhcHBlbmQoZGl2LCB0Myk7XG5cdFx0XHRhcHBlbmQoZGl2LCB0NCk7XG5cdFx0XHRhcHBlbmQoZGl2LCB0NSk7XG5cdFx0XHRpZiAoaWZfYmxvY2spIGlmX2Jsb2NrLm0oZGl2LCBudWxsKTtcblxuXHRcdFx0aWYgKCFtb3VudGVkKSB7XG5cdFx0XHRcdGRpc3Bvc2UgPSBsaXN0ZW4oZGl2LCBcImRibGNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRpZiAoaXNfZnVuY3Rpb24oLyplZGl0UXVlc3Rpb24qLyBjdHhbM10oLypxdWVzdGlvbiovIGN0eFswXSkpKSAvKmVkaXRRdWVzdGlvbiovIGN0eFszXSgvKnF1ZXN0aW9uKi8gY3R4WzBdKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRtb3VudGVkID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHAobmV3X2N0eCwgZGlydHkpIHtcblx0XHRcdGN0eCA9IG5ld19jdHg7XG5cdFx0XHRpZiAoZGlydHkgJiAvKnF1ZXN0aW9uKi8gMSAmJiB0MF92YWx1ZSAhPT0gKHQwX3ZhbHVlID0gLypxdWVzdGlvbiovIGN0eFswXS5udW0gKyBcIlwiKSkgc2V0X2RhdGEodDAsIHQwX3ZhbHVlKTtcblx0XHRcdGlmIChkaXJ0eSAmIC8qcXVlc3Rpb24qLyAxICYmIHQyX3ZhbHVlICE9PSAodDJfdmFsdWUgPSAoLypxdWVzdGlvbiovIGN0eFswXS5xdWVzdGlvbiB8fCBcIk5vIHF1ZXN0aW9uIHNldFwiKSArIFwiXCIpKSBzZXRfZGF0YSh0MiwgdDJfdmFsdWUpO1xuXHRcdFx0aWYgKGRpcnR5ICYgLypxdWVzdGlvbiovIDEgJiYgdDRfdmFsdWUgIT09ICh0NF92YWx1ZSA9IC8qcXVlc3Rpb24qLyBjdHhbMF0uYW5zd2VyICsgXCJcIikpIHNldF9kYXRhKHQ0LCB0NF92YWx1ZSk7XG5cblx0XHRcdGlmICgvKnN1Z2dlc3Rpb25zKi8gY3R4WzFdLmxlbmd0aCkge1xuXHRcdFx0XHRpZiAoaWZfYmxvY2spIHtcblx0XHRcdFx0XHRpZl9ibG9jay5wKGN0eCwgZGlydHkpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGlmX2Jsb2NrID0gY3JlYXRlX2lmX2Jsb2NrXzEkMShjdHgpO1xuXHRcdFx0XHRcdGlmX2Jsb2NrLmMoKTtcblx0XHRcdFx0XHRpZl9ibG9jay5tKGRpdiwgbnVsbCk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoaWZfYmxvY2spIHtcblx0XHRcdFx0aWZfYmxvY2suZCgxKTtcblx0XHRcdFx0aWZfYmxvY2sgPSBudWxsO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaChkaXYpO1xuXHRcdFx0aWYgKGlmX2Jsb2NrKSBpZl9ibG9jay5kKCk7XG5cdFx0XHRtb3VudGVkID0gZmFsc2U7XG5cdFx0XHRkaXNwb3NlKCk7XG5cdFx0fVxuXHR9O1xufVxuXG4vLyAoNzE6NCkgeyNpZiBxdWVzdGlvbi5lZGl0aW5nfVxuZnVuY3Rpb24gY3JlYXRlX2lmX2Jsb2NrJDEoY3R4KSB7XG5cdGxldCBkaXYzO1xuXHRsZXQgZGl2MDtcblx0bGV0IHNwYW47XG5cdGxldCB0MF92YWx1ZSA9IC8qcXVlc3Rpb24qLyBjdHhbMF0ubnVtICsgXCJcIjtcblx0bGV0IHQwO1xuXHRsZXQgdDE7XG5cdGxldCBpbnB1dDtcblx0bGV0IHQyO1xuXHRsZXQgZGl2MTtcblx0bGV0IHQzX3ZhbHVlID0gLypxdWVzdGlvbiovIGN0eFswXS5hbnN3ZXIgKyBcIlwiO1xuXHRsZXQgdDM7XG5cdGxldCB0NDtcblx0bGV0IGRpdjI7XG5cdGxldCBtb3VudGVkO1xuXHRsZXQgZGlzcG9zZTtcblxuXHRyZXR1cm4ge1xuXHRcdGMoKSB7XG5cdFx0XHRkaXYzID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdGRpdjAgPSBlbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0c3BhbiA9IGVsZW1lbnQoXCJzcGFuXCIpO1xuXHRcdFx0dDAgPSB0ZXh0KHQwX3ZhbHVlKTtcblx0XHRcdHQxID0gc3BhY2UoKTtcblx0XHRcdGlucHV0ID0gZWxlbWVudChcImlucHV0XCIpO1xuXHRcdFx0dDIgPSBzcGFjZSgpO1xuXHRcdFx0ZGl2MSA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHR0MyA9IHRleHQodDNfdmFsdWUpO1xuXHRcdFx0dDQgPSBzcGFjZSgpO1xuXHRcdFx0ZGl2MiA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRkaXYyLnRleHRDb250ZW50ID0gXCJTYXZlXCI7XG5cdFx0XHRhdHRyKGRpdjAsIFwiY2xhc3NcIiwgXCJqeHdvcmQtcXVlc3Rpb24tbnVtYmVyXCIpO1xuXHRcdFx0YXR0cihpbnB1dCwgXCJ0eXBlXCIsIFwidGV4dFwiKTtcblx0XHRcdGF0dHIoaW5wdXQsIFwiY2xhc3NcIiwgXCJqeHdvcmQtcXVlc3Rpb24tdGV4dFwiKTtcblx0XHRcdGlucHV0LmF1dG9mb2N1cyA9IHRydWU7XG5cdFx0XHRhdHRyKGRpdjEsIFwiY2xhc3NcIiwgXCJqeHdvcmQtcXVlc3Rpb24tYW5zd2VyXCIpO1xuXHRcdFx0YXR0cihkaXYyLCBcImNsYXNzXCIsIFwiYnRuIHN2ZWx0ZS0xYmhoaW43XCIpO1xuXHRcdFx0YXR0cihkaXYzLCBcImNsYXNzXCIsIFwianh3b3JkLXF1ZXN0aW9uIGp4d29yZC1xdWVzdGlvbi1lZGl0aW5nIHN2ZWx0ZS0xYmhoaW43XCIpO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0aW5zZXJ0KHRhcmdldCwgZGl2MywgYW5jaG9yKTtcblx0XHRcdGFwcGVuZChkaXYzLCBkaXYwKTtcblx0XHRcdGFwcGVuZChkaXYwLCBzcGFuKTtcblx0XHRcdGFwcGVuZChzcGFuLCB0MCk7XG5cdFx0XHRhcHBlbmQoZGl2MywgdDEpO1xuXHRcdFx0YXBwZW5kKGRpdjMsIGlucHV0KTtcblx0XHRcdHNldF9pbnB1dF92YWx1ZShpbnB1dCwgLypxdWVzdGlvbiovIGN0eFswXS5xdWVzdGlvbik7XG5cdFx0XHRhcHBlbmQoZGl2MywgdDIpO1xuXHRcdFx0YXBwZW5kKGRpdjMsIGRpdjEpO1xuXHRcdFx0YXBwZW5kKGRpdjEsIHQzKTtcblx0XHRcdGFwcGVuZChkaXYzLCB0NCk7XG5cdFx0XHRhcHBlbmQoZGl2MywgZGl2Mik7XG5cdFx0XHRpbnB1dC5mb2N1cygpO1xuXG5cdFx0XHRpZiAoIW1vdW50ZWQpIHtcblx0XHRcdFx0ZGlzcG9zZSA9IFtcblx0XHRcdFx0XHRsaXN0ZW4oaW5wdXQsIFwiaW5wdXRcIiwgLyppbnB1dF9pbnB1dF9oYW5kbGVyKi8gY3R4WzEyXSksXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0LCBcImtleWRvd25cIiwgLypoYW5kbGVLZXlkb3duKi8gY3R4WzVdKSxcblx0XHRcdFx0XHRsaXN0ZW4oZGl2MiwgXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHRpZiAoaXNfZnVuY3Rpb24oLypzYXZlUXVlc3Rpb24qLyBjdHhbNF0oLypxdWVzdGlvbiovIGN0eFswXSkpKSAvKnNhdmVRdWVzdGlvbiovIGN0eFs0XSgvKnF1ZXN0aW9uKi8gY3R4WzBdKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdF07XG5cblx0XHRcdFx0bW91bnRlZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRwKG5ld19jdHgsIGRpcnR5KSB7XG5cdFx0XHRjdHggPSBuZXdfY3R4O1xuXHRcdFx0aWYgKGRpcnR5ICYgLypxdWVzdGlvbiovIDEgJiYgdDBfdmFsdWUgIT09ICh0MF92YWx1ZSA9IC8qcXVlc3Rpb24qLyBjdHhbMF0ubnVtICsgXCJcIikpIHNldF9kYXRhKHQwLCB0MF92YWx1ZSk7XG5cblx0XHRcdGlmIChkaXJ0eSAmIC8qcXVlc3Rpb24qLyAxICYmIGlucHV0LnZhbHVlICE9PSAvKnF1ZXN0aW9uKi8gY3R4WzBdLnF1ZXN0aW9uKSB7XG5cdFx0XHRcdHNldF9pbnB1dF92YWx1ZShpbnB1dCwgLypxdWVzdGlvbiovIGN0eFswXS5xdWVzdGlvbik7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eSAmIC8qcXVlc3Rpb24qLyAxICYmIHQzX3ZhbHVlICE9PSAodDNfdmFsdWUgPSAvKnF1ZXN0aW9uKi8gY3R4WzBdLmFuc3dlciArIFwiXCIpKSBzZXRfZGF0YSh0MywgdDNfdmFsdWUpO1xuXHRcdH0sXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaChkaXYzKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdHJ1bl9hbGwoZGlzcG9zZSk7XG5cdFx0fVxuXHR9O1xufVxuXG4vLyAoODQ6NCkgeyNpZiBzdWdnZXN0aW9ucy5sZW5ndGh9XG5mdW5jdGlvbiBjcmVhdGVfaWZfYmxvY2tfMSQxKGN0eCkge1xuXHRsZXQgZWFjaF8xX2FuY2hvcjtcblx0bGV0IGVhY2hfdmFsdWUgPSAvKnN1Z2dlc3Rpb25zKi8gY3R4WzFdO1xuXHRsZXQgZWFjaF9ibG9ja3MgPSBbXTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGVhY2hfdmFsdWUubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRlYWNoX2Jsb2Nrc1tpXSA9IGNyZWF0ZV9lYWNoX2Jsb2NrJDIoZ2V0X2VhY2hfY29udGV4dCQyKGN0eCwgZWFjaF92YWx1ZSwgaSkpO1xuXHR9XG5cblx0cmV0dXJuIHtcblx0XHRjKCkge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX2Jsb2Nrcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5jKCk7XG5cdFx0XHR9XG5cblx0XHRcdGVhY2hfMV9hbmNob3IgPSBlbXB0eSgpO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX2Jsb2Nrcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5tKHRhcmdldCwgYW5jaG9yKTtcblx0XHRcdH1cblxuXHRcdFx0aW5zZXJ0KHRhcmdldCwgZWFjaF8xX2FuY2hvciwgYW5jaG9yKTtcblx0XHR9LFxuXHRcdHAoY3R4LCBkaXJ0eSkge1xuXHRcdFx0aWYgKGRpcnR5ICYgLyp1c2VTdWdnZXN0aW9uLCBzdWdnZXN0aW9ucyovIDY2KSB7XG5cdFx0XHRcdGVhY2hfdmFsdWUgPSAvKnN1Z2dlc3Rpb25zKi8gY3R4WzFdO1xuXHRcdFx0XHRsZXQgaTtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgZWFjaF92YWx1ZS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdGNvbnN0IGNoaWxkX2N0eCA9IGdldF9lYWNoX2NvbnRleHQkMihjdHgsIGVhY2hfdmFsdWUsIGkpO1xuXG5cdFx0XHRcdFx0aWYgKGVhY2hfYmxvY2tzW2ldKSB7XG5cdFx0XHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5wKGNoaWxkX2N0eCwgZGlydHkpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXSA9IGNyZWF0ZV9lYWNoX2Jsb2NrJDIoY2hpbGRfY3R4KTtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldLmMoKTtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldLm0oZWFjaF8xX2FuY2hvci5wYXJlbnROb2RlLCBlYWNoXzFfYW5jaG9yKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmb3IgKDsgaSA8IGVhY2hfYmxvY2tzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0uZCgxKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGVhY2hfYmxvY2tzLmxlbmd0aCA9IGVhY2hfdmFsdWUubGVuZ3RoO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGRlc3Ryb3lfZWFjaChlYWNoX2Jsb2NrcywgZGV0YWNoaW5nKTtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaChlYWNoXzFfYW5jaG9yKTtcblx0XHR9XG5cdH07XG59XG5cbi8vICg4NTo4KSB7I2VhY2ggc3VnZ2VzdGlvbnMgYXMgc3VnZ2VzdGlvbn1cbmZ1bmN0aW9uIGNyZWF0ZV9lYWNoX2Jsb2NrJDIoY3R4KSB7XG5cdGxldCBzcGFuO1xuXHRsZXQgdF92YWx1ZSA9IC8qc3VnZ2VzdGlvbiovIGN0eFsxNl0gKyBcIlwiO1xuXHRsZXQgdDtcblx0bGV0IG1vdW50ZWQ7XG5cdGxldCBkaXNwb3NlO1xuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdHNwYW4gPSBlbGVtZW50KFwic3BhblwiKTtcblx0XHRcdHQgPSB0ZXh0KHRfdmFsdWUpO1xuXHRcdFx0YXR0cihzcGFuLCBcImNsYXNzXCIsIFwic3VnZ2VzdGlvbiBzdmVsdGUtMWJoaGluN1wiKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGluc2VydCh0YXJnZXQsIHNwYW4sIGFuY2hvcik7XG5cdFx0XHRhcHBlbmQoc3BhbiwgdCk7XG5cblx0XHRcdGlmICghbW91bnRlZCkge1xuXHRcdFx0XHRkaXNwb3NlID0gbGlzdGVuKHNwYW4sIFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGlmIChpc19mdW5jdGlvbigvKnVzZVN1Z2dlc3Rpb24qLyBjdHhbNl0oLypzdWdnZXN0aW9uKi8gY3R4WzE2XSkpKSAvKnVzZVN1Z2dlc3Rpb24qLyBjdHhbNl0oLypzdWdnZXN0aW9uKi8gY3R4WzE2XSkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0bW91bnRlZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRwKG5ld19jdHgsIGRpcnR5KSB7XG5cdFx0XHRjdHggPSBuZXdfY3R4O1xuXHRcdFx0aWYgKGRpcnR5ICYgLypzdWdnZXN0aW9ucyovIDIgJiYgdF92YWx1ZSAhPT0gKHRfdmFsdWUgPSAvKnN1Z2dlc3Rpb24qLyBjdHhbMTZdICsgXCJcIikpIHNldF9kYXRhKHQsIHRfdmFsdWUpO1xuXHRcdH0sXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaChzcGFuKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdGRpc3Bvc2UoKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZV9mcmFnbWVudCQ0KGN0eCkge1xuXHRsZXQgbWFpbjtcblxuXHRmdW5jdGlvbiBzZWxlY3RfYmxvY2tfdHlwZShjdHgsIGRpcnR5KSB7XG5cdFx0aWYgKC8qcXVlc3Rpb24qLyBjdHhbMF0uZWRpdGluZykgcmV0dXJuIGNyZWF0ZV9pZl9ibG9jayQxO1xuXHRcdHJldHVybiBjcmVhdGVfZWxzZV9ibG9jayQxO1xuXHR9XG5cblx0bGV0IGN1cnJlbnRfYmxvY2tfdHlwZSA9IHNlbGVjdF9ibG9ja190eXBlKGN0eCk7XG5cdGxldCBpZl9ibG9jayA9IGN1cnJlbnRfYmxvY2tfdHlwZShjdHgpO1xuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdG1haW4gPSBlbGVtZW50KFwibWFpblwiKTtcblx0XHRcdGlmX2Jsb2NrLmMoKTtcblx0XHRcdGF0dHIobWFpbiwgXCJjbGFzc1wiLCBcInN2ZWx0ZS0xYmhoaW43XCIpO1xuXHRcdFx0dG9nZ2xlX2NsYXNzKG1haW4sIFwiY3VycmVudFwiLCAvKmlzX2N1cnJlbnRfcXVlc3Rpb24qLyBjdHhbMl0pO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0aW5zZXJ0KHRhcmdldCwgbWFpbiwgYW5jaG9yKTtcblx0XHRcdGlmX2Jsb2NrLm0obWFpbiwgbnVsbCk7XG5cdFx0fSxcblx0XHRwKGN0eCwgW2RpcnR5XSkge1xuXHRcdFx0aWYgKGN1cnJlbnRfYmxvY2tfdHlwZSA9PT0gKGN1cnJlbnRfYmxvY2tfdHlwZSA9IHNlbGVjdF9ibG9ja190eXBlKGN0eCkpICYmIGlmX2Jsb2NrKSB7XG5cdFx0XHRcdGlmX2Jsb2NrLnAoY3R4LCBkaXJ0eSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZl9ibG9jay5kKDEpO1xuXHRcdFx0XHRpZl9ibG9jayA9IGN1cnJlbnRfYmxvY2tfdHlwZShjdHgpO1xuXG5cdFx0XHRcdGlmIChpZl9ibG9jaykge1xuXHRcdFx0XHRcdGlmX2Jsb2NrLmMoKTtcblx0XHRcdFx0XHRpZl9ibG9jay5tKG1haW4sIG51bGwpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eSAmIC8qaXNfY3VycmVudF9xdWVzdGlvbiovIDQpIHtcblx0XHRcdFx0dG9nZ2xlX2NsYXNzKG1haW4sIFwiY3VycmVudFwiLCAvKmlzX2N1cnJlbnRfcXVlc3Rpb24qLyBjdHhbMl0pO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0aTogbm9vcCxcblx0XHRvOiBub29wLFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2gobWFpbik7XG5cdFx0XHRpZl9ibG9jay5kKCk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBpbnN0YW5jZSQ0KCQkc2VsZiwgJCRwcm9wcywgJCRpbnZhbGlkYXRlKSB7XG5cdGxldCAkY3VycmVudERpcmVjdGlvbjtcblx0bGV0ICRjdXJyZW50UXVlc3Rpb247XG5cdGxldCAkcXVlc3Rpb25zQWNyb3NzO1xuXHRsZXQgJHF1ZXN0aW9uc0Rvd247XG5cdGNvbXBvbmVudF9zdWJzY3JpYmUoJCRzZWxmLCBjdXJyZW50RGlyZWN0aW9uLCAkJHZhbHVlID0+ICQkaW52YWxpZGF0ZSgxMCwgJGN1cnJlbnREaXJlY3Rpb24gPSAkJHZhbHVlKSk7XG5cdGNvbXBvbmVudF9zdWJzY3JpYmUoJCRzZWxmLCBjdXJyZW50UXVlc3Rpb24sICQkdmFsdWUgPT4gJCRpbnZhbGlkYXRlKDExLCAkY3VycmVudFF1ZXN0aW9uID0gJCR2YWx1ZSkpO1xuXHRjb21wb25lbnRfc3Vic2NyaWJlKCQkc2VsZiwgcXVlc3Rpb25zQWNyb3NzLCAkJHZhbHVlID0+ICQkaW52YWxpZGF0ZSgxMywgJHF1ZXN0aW9uc0Fjcm9zcyA9ICQkdmFsdWUpKTtcblx0Y29tcG9uZW50X3N1YnNjcmliZSgkJHNlbGYsIHF1ZXN0aW9uc0Rvd24sICQkdmFsdWUgPT4gJCRpbnZhbGlkYXRlKDE0LCAkcXVlc3Rpb25zRG93biA9ICQkdmFsdWUpKTtcblx0Y29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKTtcblx0bGV0IHsgcXVlc3Rpb25zX2Fjcm9zcyA9IFtdIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBxdWVzdGlvbnNfZG93biA9IFtdIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBxdWVzdGlvbiB9ID0gJCRwcm9wcztcblx0bGV0IHsgZGlyZWN0aW9uIH0gPSAkJHByb3BzO1xuXG5cdC8vIFByaXZhdGUgcHJvcHNcblx0bGV0IHN1Z2dlc3Rpb25zID0gW107XG5cblx0ZnVuY3Rpb24gZWRpdFF1ZXN0aW9uKHF1ZXN0aW9uKSB7XG5cdFx0cXVlc3Rpb24uZWRpdGluZyA9IHRydWU7XG5cdFx0aXNFZGl0aW5nUXVlc3Rpb24uc2V0KHRydWUpO1xuXG5cdFx0aWYgKGRpcmVjdGlvbiA9PSBcImFjcm9zc1wiKSB7XG5cdFx0XHRxdWVzdGlvbnNBY3Jvc3Muc2V0KHF1ZXN0aW9uc19hY3Jvc3MpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRxdWVzdGlvbnNEb3duLnNldChxdWVzdGlvbnNfZG93bik7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gc2F2ZVF1ZXN0aW9uKHF1ZXN0aW9uKSB7XG5cdFx0aWYgKGRpcmVjdGlvbiA9PSBcImFjcm9zc1wiKSB7XG5cdFx0XHRxdWVzdGlvbnNBY3Jvc3Muc2V0KHF1ZXN0aW9uc19hY3Jvc3MpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRxdWVzdGlvbnNEb3duLnNldChxdWVzdGlvbnNfZG93bik7XG5cdFx0fVxuXG5cdFx0aXNFZGl0aW5nUXVlc3Rpb24uc2V0KGZhbHNlKTtcblx0XHRxdWVzdGlvbi5lZGl0aW5nID0gZmFsc2U7XG5cdFx0ZGlzcGF0Y2goXCJzYXZlXCIsIHsgcXVlc3Rpb24sIGRpcmVjdGlvbiB9KTtcblx0XHRkaXNwYXRjaChcImNoYW5nZVwiKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZUtleWRvd24oZSkge1xuXHRcdGlmIChlLmtleSA9PSBcIkVudGVyXCIpIHtcblx0XHRcdHNhdmVRdWVzdGlvbihxdWVzdGlvbik7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gdXNlU3VnZ2VzdGlvbihzdWdnZXN0aW9uKSB7XG5cdFx0c3VnZ2VzdGlvbiA9IHN1Z2dlc3Rpb24udG9VcHBlckNhc2UoKTtcblx0XHRsZXQgcXMgPSAkcXVlc3Rpb25zRG93bjtcblxuXHRcdGlmIChxdWVzdGlvbi5kaXJlY3Rpb24gPT09IFwiYWNyb3NzXCIpIHtcblx0XHRcdHFzID0gJHF1ZXN0aW9uc0Fjcm9zcztcblx0XHR9XG5cblx0XHRxc1txcy5maW5kSW5kZXgocSA9PiBxLm51bSA9PT0gcXVlc3Rpb24ubnVtKV07XG5cdFx0bGV0IHEgPSBxcy5maW5kKHEgPT4gcS5udW0gPT09IHF1ZXN0aW9uLm51bSk7XG5cdFx0ZGlzcGF0Y2goXCJ1cGRhdGVfcXVlc3Rpb25cIiwgeyBzdWdnZXN0aW9uLCBxdWVzdGlvbjogcSB9KTtcblx0fVxuXG5cdGxldCBpc19jdXJyZW50X3F1ZXN0aW9uID0gZmFsc2U7XG5cblx0ZnVuY3Rpb24gaW5wdXRfaW5wdXRfaGFuZGxlcigpIHtcblx0XHRxdWVzdGlvbi5xdWVzdGlvbiA9IHRoaXMudmFsdWU7XG5cdFx0JCRpbnZhbGlkYXRlKDAsIHF1ZXN0aW9uKTtcblx0fVxuXG5cdCQkc2VsZi4kJHNldCA9ICQkcHJvcHMgPT4ge1xuXHRcdGlmICgncXVlc3Rpb25zX2Fjcm9zcycgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDcsIHF1ZXN0aW9uc19hY3Jvc3MgPSAkJHByb3BzLnF1ZXN0aW9uc19hY3Jvc3MpO1xuXHRcdGlmICgncXVlc3Rpb25zX2Rvd24nIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSg4LCBxdWVzdGlvbnNfZG93biA9ICQkcHJvcHMucXVlc3Rpb25zX2Rvd24pO1xuXHRcdGlmICgncXVlc3Rpb24nIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSgwLCBxdWVzdGlvbiA9ICQkcHJvcHMucXVlc3Rpb24pO1xuXHRcdGlmICgnZGlyZWN0aW9uJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoOSwgZGlyZWN0aW9uID0gJCRwcm9wcy5kaXJlY3Rpb24pO1xuXHR9O1xuXG5cdCQkc2VsZi4kJC51cGRhdGUgPSAoKSA9PiB7XG5cdFx0aWYgKCQkc2VsZi4kJC5kaXJ0eSAmIC8qcXVlc3Rpb24sICRjdXJyZW50UXVlc3Rpb24sICRjdXJyZW50RGlyZWN0aW9uKi8gMzA3Mykge1xuXHRcdFx0e1xuXHRcdFx0XHRsZXQgc3VnZ2VzdGlvbl9xdWVyeSA9IHF1ZXN0aW9uLmFuc3dlci5yZXBsYWNlKC9cXCAvZywgXCI/XCIpO1xuXG5cdFx0XHRcdGlmICghc3VnZ2VzdGlvbl9xdWVyeS5pbmNsdWRlcyhcIj9cIikpIHtcblx0XHRcdFx0XHQkJGludmFsaWRhdGUoMSwgc3VnZ2VzdGlvbnMgPSBbXSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JCRpbnZhbGlkYXRlKDEsIHN1Z2dlc3Rpb25zID0gc3VnZ2VzdChzdWdnZXN0aW9uX3F1ZXJ5KSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQkJGludmFsaWRhdGUoMiwgaXNfY3VycmVudF9xdWVzdGlvbiA9ICRjdXJyZW50UXVlc3Rpb24ubnVtID09PSBxdWVzdGlvbi5udW0gJiYgJGN1cnJlbnREaXJlY3Rpb24gPT09IHF1ZXN0aW9uLmRpcmVjdGlvbik7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiBbXG5cdFx0cXVlc3Rpb24sXG5cdFx0c3VnZ2VzdGlvbnMsXG5cdFx0aXNfY3VycmVudF9xdWVzdGlvbixcblx0XHRlZGl0UXVlc3Rpb24sXG5cdFx0c2F2ZVF1ZXN0aW9uLFxuXHRcdGhhbmRsZUtleWRvd24sXG5cdFx0dXNlU3VnZ2VzdGlvbixcblx0XHRxdWVzdGlvbnNfYWNyb3NzLFxuXHRcdHF1ZXN0aW9uc19kb3duLFxuXHRcdGRpcmVjdGlvbixcblx0XHQkY3VycmVudERpcmVjdGlvbixcblx0XHQkY3VycmVudFF1ZXN0aW9uLFxuXHRcdGlucHV0X2lucHV0X2hhbmRsZXJcblx0XTtcbn1cblxuY2xhc3MgUXVlc3Rpb24gZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuXHRjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG5cdFx0c3VwZXIoKTtcblxuXHRcdGluaXQodGhpcywgb3B0aW9ucywgaW5zdGFuY2UkNCwgY3JlYXRlX2ZyYWdtZW50JDQsIHNhZmVfbm90X2VxdWFsLCB7XG5cdFx0XHRxdWVzdGlvbnNfYWNyb3NzOiA3LFxuXHRcdFx0cXVlc3Rpb25zX2Rvd246IDgsXG5cdFx0XHRxdWVzdGlvbjogMCxcblx0XHRcdGRpcmVjdGlvbjogOVxuXHRcdH0pO1xuXHR9XG59XG5cbi8qIHNyYy9RdWVzdGlvbnMuc3ZlbHRlIGdlbmVyYXRlZCBieSBTdmVsdGUgdjMuNDYuNCAqL1xuXG5mdW5jdGlvbiBnZXRfZWFjaF9jb250ZXh0JDEoY3R4LCBsaXN0LCBpKSB7XG5cdGNvbnN0IGNoaWxkX2N0eCA9IGN0eC5zbGljZSgpO1xuXHRjaGlsZF9jdHhbNl0gPSBsaXN0W2ldO1xuXHRyZXR1cm4gY2hpbGRfY3R4O1xufVxuXG5mdW5jdGlvbiBnZXRfZWFjaF9jb250ZXh0XzEkMShjdHgsIGxpc3QsIGkpIHtcblx0Y29uc3QgY2hpbGRfY3R4ID0gY3R4LnNsaWNlKCk7XG5cdGNoaWxkX2N0eFs2XSA9IGxpc3RbaV07XG5cdHJldHVybiBjaGlsZF9jdHg7XG59XG5cbi8vICg1OjE2KSB7I2VhY2ggcXVlc3Rpb25zX2Fjcm9zcyBhcyBxdWVzdGlvbn1cbmZ1bmN0aW9uIGNyZWF0ZV9lYWNoX2Jsb2NrXzEkMShjdHgpIHtcblx0bGV0IHF1ZXN0aW9uO1xuXHRsZXQgY3VycmVudDtcblxuXHRxdWVzdGlvbiA9IG5ldyBRdWVzdGlvbih7XG5cdFx0XHRwcm9wczoge1xuXHRcdFx0XHRxdWVzdGlvbjogLypxdWVzdGlvbiovIGN0eFs2XSxcblx0XHRcdFx0ZGlyZWN0aW9uOiBcImFjcm9zc1wiLFxuXHRcdFx0XHRxdWVzdGlvbnNfYWNyb3NzOiAvKnF1ZXN0aW9uc19hY3Jvc3MqLyBjdHhbMF1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRxdWVzdGlvbi4kb24oXCJjaGFuZ2VcIiwgLypjaGFuZ2VfaGFuZGxlciovIGN0eFsyXSk7XG5cdHF1ZXN0aW9uLiRvbihcInVwZGF0ZV9xdWVzdGlvblwiLCAvKnVwZGF0ZV9xdWVzdGlvbl9oYW5kbGVyKi8gY3R4WzNdKTtcblxuXHRyZXR1cm4ge1xuXHRcdGMoKSB7XG5cdFx0XHRjcmVhdGVfY29tcG9uZW50KHF1ZXN0aW9uLiQkLmZyYWdtZW50KTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdG1vdW50X2NvbXBvbmVudChxdWVzdGlvbiwgdGFyZ2V0LCBhbmNob3IpO1xuXHRcdFx0Y3VycmVudCA9IHRydWU7XG5cdFx0fSxcblx0XHRwKGN0eCwgZGlydHkpIHtcblx0XHRcdGNvbnN0IHF1ZXN0aW9uX2NoYW5nZXMgPSB7fTtcblx0XHRcdGlmIChkaXJ0eSAmIC8qcXVlc3Rpb25zX2Fjcm9zcyovIDEpIHF1ZXN0aW9uX2NoYW5nZXMucXVlc3Rpb24gPSAvKnF1ZXN0aW9uKi8gY3R4WzZdO1xuXHRcdFx0aWYgKGRpcnR5ICYgLypxdWVzdGlvbnNfYWNyb3NzKi8gMSkgcXVlc3Rpb25fY2hhbmdlcy5xdWVzdGlvbnNfYWNyb3NzID0gLypxdWVzdGlvbnNfYWNyb3NzKi8gY3R4WzBdO1xuXHRcdFx0cXVlc3Rpb24uJHNldChxdWVzdGlvbl9jaGFuZ2VzKTtcblx0XHR9LFxuXHRcdGkobG9jYWwpIHtcblx0XHRcdGlmIChjdXJyZW50KSByZXR1cm47XG5cdFx0XHR0cmFuc2l0aW9uX2luKHF1ZXN0aW9uLiQkLmZyYWdtZW50LCBsb2NhbCk7XG5cdFx0XHRjdXJyZW50ID0gdHJ1ZTtcblx0XHR9LFxuXHRcdG8obG9jYWwpIHtcblx0XHRcdHRyYW5zaXRpb25fb3V0KHF1ZXN0aW9uLiQkLmZyYWdtZW50LCBsb2NhbCk7XG5cdFx0XHRjdXJyZW50ID0gZmFsc2U7XG5cdFx0fSxcblx0XHRkKGRldGFjaGluZykge1xuXHRcdFx0ZGVzdHJveV9jb21wb25lbnQocXVlc3Rpb24sIGRldGFjaGluZyk7XG5cdFx0fVxuXHR9O1xufVxuXG4vLyAoMTE6MTYpIHsjZWFjaCBxdWVzdGlvbnNfZG93biBhcyBxdWVzdGlvbn1cbmZ1bmN0aW9uIGNyZWF0ZV9lYWNoX2Jsb2NrJDEoY3R4KSB7XG5cdGxldCBxdWVzdGlvbjtcblx0bGV0IGN1cnJlbnQ7XG5cblx0cXVlc3Rpb24gPSBuZXcgUXVlc3Rpb24oe1xuXHRcdFx0cHJvcHM6IHtcblx0XHRcdFx0cXVlc3Rpb246IC8qcXVlc3Rpb24qLyBjdHhbNl0sXG5cdFx0XHRcdGRpcmVjdGlvbjogXCJkb3duXCIsXG5cdFx0XHRcdHF1ZXN0aW9uc19kb3duOiAvKnF1ZXN0aW9uc19kb3duKi8gY3R4WzFdXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0cXVlc3Rpb24uJG9uKFwiY2hhbmdlXCIsIC8qY2hhbmdlX2hhbmRsZXJfMSovIGN0eFs0XSk7XG5cdHF1ZXN0aW9uLiRvbihcInVwZGF0ZV9xdWVzdGlvblwiLCAvKnVwZGF0ZV9xdWVzdGlvbl9oYW5kbGVyXzEqLyBjdHhbNV0pO1xuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdGNyZWF0ZV9jb21wb25lbnQocXVlc3Rpb24uJCQuZnJhZ21lbnQpO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0bW91bnRfY29tcG9uZW50KHF1ZXN0aW9uLCB0YXJnZXQsIGFuY2hvcik7XG5cdFx0XHRjdXJyZW50ID0gdHJ1ZTtcblx0XHR9LFxuXHRcdHAoY3R4LCBkaXJ0eSkge1xuXHRcdFx0Y29uc3QgcXVlc3Rpb25fY2hhbmdlcyA9IHt9O1xuXHRcdFx0aWYgKGRpcnR5ICYgLypxdWVzdGlvbnNfZG93biovIDIpIHF1ZXN0aW9uX2NoYW5nZXMucXVlc3Rpb24gPSAvKnF1ZXN0aW9uKi8gY3R4WzZdO1xuXHRcdFx0aWYgKGRpcnR5ICYgLypxdWVzdGlvbnNfZG93biovIDIpIHF1ZXN0aW9uX2NoYW5nZXMucXVlc3Rpb25zX2Rvd24gPSAvKnF1ZXN0aW9uc19kb3duKi8gY3R4WzFdO1xuXHRcdFx0cXVlc3Rpb24uJHNldChxdWVzdGlvbl9jaGFuZ2VzKTtcblx0XHR9LFxuXHRcdGkobG9jYWwpIHtcblx0XHRcdGlmIChjdXJyZW50KSByZXR1cm47XG5cdFx0XHR0cmFuc2l0aW9uX2luKHF1ZXN0aW9uLiQkLmZyYWdtZW50LCBsb2NhbCk7XG5cdFx0XHRjdXJyZW50ID0gdHJ1ZTtcblx0XHR9LFxuXHRcdG8obG9jYWwpIHtcblx0XHRcdHRyYW5zaXRpb25fb3V0KHF1ZXN0aW9uLiQkLmZyYWdtZW50LCBsb2NhbCk7XG5cdFx0XHRjdXJyZW50ID0gZmFsc2U7XG5cdFx0fSxcblx0XHRkKGRldGFjaGluZykge1xuXHRcdFx0ZGVzdHJveV9jb21wb25lbnQocXVlc3Rpb24sIGRldGFjaGluZyk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVfZnJhZ21lbnQkMyhjdHgpIHtcblx0bGV0IG1haW47XG5cdGxldCBkaXYyO1xuXHRsZXQgZGl2MDtcblx0bGV0IGg0MDtcblx0bGV0IHQxO1xuXHRsZXQgdDI7XG5cdGxldCBkaXYxO1xuXHRsZXQgaDQxO1xuXHRsZXQgdDQ7XG5cdGxldCBjdXJyZW50O1xuXHRsZXQgZWFjaF92YWx1ZV8xID0gLypxdWVzdGlvbnNfYWNyb3NzKi8gY3R4WzBdO1xuXHRsZXQgZWFjaF9ibG9ja3NfMSA9IFtdO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF92YWx1ZV8xLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0ZWFjaF9ibG9ja3NfMVtpXSA9IGNyZWF0ZV9lYWNoX2Jsb2NrXzEkMShnZXRfZWFjaF9jb250ZXh0XzEkMShjdHgsIGVhY2hfdmFsdWVfMSwgaSkpO1xuXHR9XG5cblx0Y29uc3Qgb3V0ID0gaSA9PiB0cmFuc2l0aW9uX291dChlYWNoX2Jsb2Nrc18xW2ldLCAxLCAxLCAoKSA9PiB7XG5cdFx0ZWFjaF9ibG9ja3NfMVtpXSA9IG51bGw7XG5cdH0pO1xuXG5cdGxldCBlYWNoX3ZhbHVlID0gLypxdWVzdGlvbnNfZG93biovIGN0eFsxXTtcblx0bGV0IGVhY2hfYmxvY2tzID0gW107XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX3ZhbHVlLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0ZWFjaF9ibG9ja3NbaV0gPSBjcmVhdGVfZWFjaF9ibG9jayQxKGdldF9lYWNoX2NvbnRleHQkMShjdHgsIGVhY2hfdmFsdWUsIGkpKTtcblx0fVxuXG5cdGNvbnN0IG91dF8xID0gaSA9PiB0cmFuc2l0aW9uX291dChlYWNoX2Jsb2Nrc1tpXSwgMSwgMSwgKCkgPT4ge1xuXHRcdGVhY2hfYmxvY2tzW2ldID0gbnVsbDtcblx0fSk7XG5cblx0cmV0dXJuIHtcblx0XHRjKCkge1xuXHRcdFx0bWFpbiA9IGVsZW1lbnQoXCJtYWluXCIpO1xuXHRcdFx0ZGl2MiA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRkaXYwID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdGg0MCA9IGVsZW1lbnQoXCJoNFwiKTtcblx0XHRcdGg0MC50ZXh0Q29udGVudCA9IFwiQWNyb3NzXCI7XG5cdFx0XHR0MSA9IHNwYWNlKCk7XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF9ibG9ja3NfMS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRlYWNoX2Jsb2Nrc18xW2ldLmMoKTtcblx0XHRcdH1cblxuXHRcdFx0dDIgPSBzcGFjZSgpO1xuXHRcdFx0ZGl2MSA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRoNDEgPSBlbGVtZW50KFwiaDRcIik7XG5cdFx0XHRoNDEudGV4dENvbnRlbnQgPSBcIkRvd25cIjtcblx0XHRcdHQ0ID0gc3BhY2UoKTtcblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX2Jsb2Nrcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5jKCk7XG5cdFx0XHR9XG5cblx0XHRcdGF0dHIoZGl2MCwgXCJjbGFzc1wiLCBcImp4d29yZC1xdWVzdGlvbnMtZGlyZWN0aW9uIGp4d29yZC1xdWVzdGlvbnMtYWNyb3NzIHN2ZWx0ZS0xam0wYXE1XCIpO1xuXHRcdFx0YXR0cihkaXYxLCBcImNsYXNzXCIsIFwianh3b3JkLXF1ZXN0aW9ucy1kaXJlY3Rpb24ganh3b3JkLXF1ZXN0aW9ucy1hY3Jvc3Mgc3ZlbHRlLTFqbTBhcTVcIik7XG5cdFx0XHRhdHRyKGRpdjIsIFwiY2xhc3NcIiwgXCJqeHdvcmQtcXVlc3Rpb25zIHN2ZWx0ZS0xam0wYXE1XCIpO1xuXHRcdFx0YXR0cihtYWluLCBcImNsYXNzXCIsIFwic3ZlbHRlLTFqbTBhcTVcIik7XG5cdFx0fSxcblx0XHRtKHRhcmdldCwgYW5jaG9yKSB7XG5cdFx0XHRpbnNlcnQodGFyZ2V0LCBtYWluLCBhbmNob3IpO1xuXHRcdFx0YXBwZW5kKG1haW4sIGRpdjIpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIGRpdjApO1xuXHRcdFx0YXBwZW5kKGRpdjAsIGg0MCk7XG5cdFx0XHRhcHBlbmQoZGl2MCwgdDEpO1xuXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGVhY2hfYmxvY2tzXzEubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0ZWFjaF9ibG9ja3NfMVtpXS5tKGRpdjAsIG51bGwpO1xuXHRcdFx0fVxuXG5cdFx0XHRhcHBlbmQoZGl2MiwgdDIpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIGRpdjEpO1xuXHRcdFx0YXBwZW5kKGRpdjEsIGg0MSk7XG5cdFx0XHRhcHBlbmQoZGl2MSwgdDQpO1xuXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGVhY2hfYmxvY2tzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdGVhY2hfYmxvY2tzW2ldLm0oZGl2MSwgbnVsbCk7XG5cdFx0XHR9XG5cblx0XHRcdGN1cnJlbnQgPSB0cnVlO1xuXHRcdH0sXG5cdFx0cChjdHgsIFtkaXJ0eV0pIHtcblx0XHRcdGlmIChkaXJ0eSAmIC8qcXVlc3Rpb25zX2Fjcm9zcyovIDEpIHtcblx0XHRcdFx0ZWFjaF92YWx1ZV8xID0gLypxdWVzdGlvbnNfYWNyb3NzKi8gY3R4WzBdO1xuXHRcdFx0XHRsZXQgaTtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgZWFjaF92YWx1ZV8xLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0Y29uc3QgY2hpbGRfY3R4ID0gZ2V0X2VhY2hfY29udGV4dF8xJDEoY3R4LCBlYWNoX3ZhbHVlXzEsIGkpO1xuXG5cdFx0XHRcdFx0aWYgKGVhY2hfYmxvY2tzXzFbaV0pIHtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzXzFbaV0ucChjaGlsZF9jdHgsIGRpcnR5KTtcblx0XHRcdFx0XHRcdHRyYW5zaXRpb25faW4oZWFjaF9ibG9ja3NfMVtpXSwgMSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzXzFbaV0gPSBjcmVhdGVfZWFjaF9ibG9ja18xJDEoY2hpbGRfY3R4KTtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzXzFbaV0uYygpO1xuXHRcdFx0XHRcdFx0dHJhbnNpdGlvbl9pbihlYWNoX2Jsb2Nrc18xW2ldLCAxKTtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzXzFbaV0ubShkaXYwLCBudWxsKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRncm91cF9vdXRyb3MoKTtcblxuXHRcdFx0XHRmb3IgKGkgPSBlYWNoX3ZhbHVlXzEubGVuZ3RoOyBpIDwgZWFjaF9ibG9ja3NfMS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdG91dChpKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNoZWNrX291dHJvcygpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHkgJiAvKnF1ZXN0aW9uc19kb3duKi8gMikge1xuXHRcdFx0XHRlYWNoX3ZhbHVlID0gLypxdWVzdGlvbnNfZG93biovIGN0eFsxXTtcblx0XHRcdFx0bGV0IGk7XG5cblx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGVhY2hfdmFsdWUubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRjb25zdCBjaGlsZF9jdHggPSBnZXRfZWFjaF9jb250ZXh0JDEoY3R4LCBlYWNoX3ZhbHVlLCBpKTtcblxuXHRcdFx0XHRcdGlmIChlYWNoX2Jsb2Nrc1tpXSkge1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0ucChjaGlsZF9jdHgsIGRpcnR5KTtcblx0XHRcdFx0XHRcdHRyYW5zaXRpb25faW4oZWFjaF9ibG9ja3NbaV0sIDEpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXSA9IGNyZWF0ZV9lYWNoX2Jsb2NrJDEoY2hpbGRfY3R4KTtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldLmMoKTtcblx0XHRcdFx0XHRcdHRyYW5zaXRpb25faW4oZWFjaF9ibG9ja3NbaV0sIDEpO1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0ubShkaXYxLCBudWxsKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRncm91cF9vdXRyb3MoKTtcblxuXHRcdFx0XHRmb3IgKGkgPSBlYWNoX3ZhbHVlLmxlbmd0aDsgaSA8IGVhY2hfYmxvY2tzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0b3V0XzEoaSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjaGVja19vdXRyb3MoKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGkobG9jYWwpIHtcblx0XHRcdGlmIChjdXJyZW50KSByZXR1cm47XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF92YWx1ZV8xLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdHRyYW5zaXRpb25faW4oZWFjaF9ibG9ja3NfMVtpXSk7XG5cdFx0XHR9XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF92YWx1ZS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHR0cmFuc2l0aW9uX2luKGVhY2hfYmxvY2tzW2ldKTtcblx0XHRcdH1cblxuXHRcdFx0Y3VycmVudCA9IHRydWU7XG5cdFx0fSxcblx0XHRvKGxvY2FsKSB7XG5cdFx0XHRlYWNoX2Jsb2Nrc18xID0gZWFjaF9ibG9ja3NfMS5maWx0ZXIoQm9vbGVhbik7XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF9ibG9ja3NfMS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHR0cmFuc2l0aW9uX291dChlYWNoX2Jsb2Nrc18xW2ldKTtcblx0XHRcdH1cblxuXHRcdFx0ZWFjaF9ibG9ja3MgPSBlYWNoX2Jsb2Nrcy5maWx0ZXIoQm9vbGVhbik7XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF9ibG9ja3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0dHJhbnNpdGlvbl9vdXQoZWFjaF9ibG9ja3NbaV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRjdXJyZW50ID0gZmFsc2U7XG5cdFx0fSxcblx0XHRkKGRldGFjaGluZykge1xuXHRcdFx0aWYgKGRldGFjaGluZykgZGV0YWNoKG1haW4pO1xuXHRcdFx0ZGVzdHJveV9lYWNoKGVhY2hfYmxvY2tzXzEsIGRldGFjaGluZyk7XG5cdFx0XHRkZXN0cm95X2VhY2goZWFjaF9ibG9ja3MsIGRldGFjaGluZyk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBpbnN0YW5jZSQzKCQkc2VsZiwgJCRwcm9wcywgJCRpbnZhbGlkYXRlKSB7XG5cdGxldCBxdWVzdGlvbnNfYWNyb3NzID0gW107XG5cdGxldCBxdWVzdGlvbnNfZG93biA9IFtdO1xuXG5cdHF1ZXN0aW9uc0Fjcm9zcy5zdWJzY3JpYmUodmFsdWUgPT4ge1xuXHRcdCQkaW52YWxpZGF0ZSgwLCBxdWVzdGlvbnNfYWNyb3NzID0gdmFsdWUpO1xuXHR9KTtcblxuXHRxdWVzdGlvbnNEb3duLnN1YnNjcmliZSh2YWx1ZSA9PiB7XG5cdFx0JCRpbnZhbGlkYXRlKDEsIHF1ZXN0aW9uc19kb3duID0gdmFsdWUpO1xuXHR9KTtcblxuXHRmdW5jdGlvbiBjaGFuZ2VfaGFuZGxlcihldmVudCkge1xuXHRcdGJ1YmJsZS5jYWxsKHRoaXMsICQkc2VsZiwgZXZlbnQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlX3F1ZXN0aW9uX2hhbmRsZXIoZXZlbnQpIHtcblx0XHRidWJibGUuY2FsbCh0aGlzLCAkJHNlbGYsIGV2ZW50KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNoYW5nZV9oYW5kbGVyXzEoZXZlbnQpIHtcblx0XHRidWJibGUuY2FsbCh0aGlzLCAkJHNlbGYsIGV2ZW50KTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZV9xdWVzdGlvbl9oYW5kbGVyXzEoZXZlbnQpIHtcblx0XHRidWJibGUuY2FsbCh0aGlzLCAkJHNlbGYsIGV2ZW50KTtcblx0fVxuXG5cdHJldHVybiBbXG5cdFx0cXVlc3Rpb25zX2Fjcm9zcyxcblx0XHRxdWVzdGlvbnNfZG93bixcblx0XHRjaGFuZ2VfaGFuZGxlcixcblx0XHR1cGRhdGVfcXVlc3Rpb25faGFuZGxlcixcblx0XHRjaGFuZ2VfaGFuZGxlcl8xLFxuXHRcdHVwZGF0ZV9xdWVzdGlvbl9oYW5kbGVyXzFcblx0XTtcbn1cblxuY2xhc3MgUXVlc3Rpb25zIGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50IHtcblx0Y29uc3RydWN0b3Iob3B0aW9ucykge1xuXHRcdHN1cGVyKCk7XG5cdFx0aW5pdCh0aGlzLCBvcHRpb25zLCBpbnN0YW5jZSQzLCBjcmVhdGVfZnJhZ21lbnQkMywgc2FmZV9ub3RfZXF1YWwsIHt9KTtcblx0fVxufVxuXG4vKiBzcmMvR3JpZC5zdmVsdGUgZ2VuZXJhdGVkIGJ5IFN2ZWx0ZSB2My40Ni40ICovXG5cbmZ1bmN0aW9uIGdldF9lYWNoX2NvbnRleHQoY3R4LCBsaXN0LCBpKSB7XG5cdGNvbnN0IGNoaWxkX2N0eCA9IGN0eC5zbGljZSgpO1xuXHRjaGlsZF9jdHhbNjBdID0gbGlzdFtpXTtcblx0Y2hpbGRfY3R4WzYyXSA9IGk7XG5cdHJldHVybiBjaGlsZF9jdHg7XG59XG5cbmZ1bmN0aW9uIGdldF9lYWNoX2NvbnRleHRfMShjdHgsIGxpc3QsIGkpIHtcblx0Y29uc3QgY2hpbGRfY3R4ID0gY3R4LnNsaWNlKCk7XG5cdGNoaWxkX2N0eFs2M10gPSBsaXN0W2ldO1xuXHRjaGlsZF9jdHhbNjVdID0gaTtcblx0cmV0dXJuIGNoaWxkX2N0eDtcbn1cblxuLy8gKDQ2MjoyOCkgezplbHNlfVxuZnVuY3Rpb24gY3JlYXRlX2Vsc2VfYmxvY2soY3R4KSB7XG5cdGxldCByZWN0O1xuXHRsZXQgcmVjdF95X3ZhbHVlO1xuXHRsZXQgcmVjdF94X3ZhbHVlO1xuXHRsZXQgdGV4dF8xO1xuXHRsZXQgdF92YWx1ZSA9IC8qbGV0dGVyKi8gY3R4WzYzXSArIFwiXCI7XG5cdGxldCB0O1xuXHRsZXQgdGV4dF8xX3hfdmFsdWU7XG5cdGxldCB0ZXh0XzFfeV92YWx1ZTtcblx0bGV0IG1vdW50ZWQ7XG5cdGxldCBkaXNwb3NlO1xuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdHJlY3QgPSBzdmdfZWxlbWVudChcInJlY3RcIik7XG5cdFx0XHR0ZXh0XzEgPSBzdmdfZWxlbWVudChcInRleHRcIik7XG5cdFx0XHR0ID0gdGV4dCh0X3ZhbHVlKTtcblx0XHRcdGF0dHIocmVjdCwgXCJjbGFzc1wiLCBcImp4d29yZC1jZWxsLXJlY3Qgc3ZlbHRlLTEwMTNqNW1cIik7XG5cdFx0XHRhdHRyKHJlY3QsIFwicm9sZVwiLCBcImNlbGxcIik7XG5cdFx0XHRhdHRyKHJlY3QsIFwidGFiaW5kZXhcIiwgXCItMVwiKTtcblx0XHRcdGF0dHIocmVjdCwgXCJhcmlhLWxhYmVsXCIsIFwiXCIpO1xuXHRcdFx0YXR0cihyZWN0LCBcInlcIiwgcmVjdF95X3ZhbHVlID0gLypjZWxsV2lkdGgqLyBjdHhbMThdICogLyp5Ki8gY3R4WzYyXSArIC8qbWFyZ2luKi8gY3R4WzldKTtcblx0XHRcdGF0dHIocmVjdCwgXCJ4XCIsIHJlY3RfeF92YWx1ZSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0pO1xuXHRcdFx0YXR0cihyZWN0LCBcIndpZHRoXCIsIC8qY2VsbFdpZHRoKi8gY3R4WzE4XSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwiaGVpZ2h0XCIsIC8qY2VsbEhlaWdodCovIGN0eFsyMl0pO1xuXHRcdFx0YXR0cihyZWN0LCBcInN0cm9rZVwiLCAvKmlubmVyQm9yZGVyQ29sb3VyKi8gY3R4WzExXSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwic3Ryb2tlLXdpZHRoXCIsIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwiZmlsbFwiLCAvKmJhY2tncm91bmRDb2xvdXIqLyBjdHhbMTNdKTtcblx0XHRcdGF0dHIocmVjdCwgXCJkYXRhLWNvbFwiLCAvKngqLyBjdHhbNjVdKTtcblx0XHRcdGF0dHIocmVjdCwgXCJkYXRhLXJvd1wiLCAvKnkqLyBjdHhbNjJdKTtcblx0XHRcdGF0dHIodGV4dF8xLCBcImlkXCIsIFwianh3b3JkLWxldHRlci1cIiArIC8qeCovIGN0eFs2NV0gKyBcIi1cIiArIC8qeSovIGN0eFs2Ml0pO1xuXHRcdFx0YXR0cih0ZXh0XzEsIFwieFwiLCB0ZXh0XzFfeF92YWx1ZSA9IC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAqIC8qeCovIGN0eFs2NV0gKyAvKm1hcmdpbiovIGN0eFs5XSArIC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAvIDIpO1xuXHRcdFx0YXR0cih0ZXh0XzEsIFwieVwiLCB0ZXh0XzFfeV92YWx1ZSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKnkqLyBjdHhbNjJdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdIC0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIDAuMSk7XG5cdFx0XHRhdHRyKHRleHRfMSwgXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKTtcblx0XHRcdGF0dHIodGV4dF8xLCBcImZvbnQtc2l6ZVwiLCAvKmZvbnRTaXplKi8gY3R4WzIwXSk7XG5cdFx0XHRhdHRyKHRleHRfMSwgXCJ3aWR0aFwiLCAvKmNlbGxXaWR0aCovIGN0eFsxOF0pO1xuXHRcdFx0YXR0cih0ZXh0XzEsIFwiY2xhc3NcIiwgXCJzdmVsdGUtMTAxM2o1bVwiKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGluc2VydCh0YXJnZXQsIHJlY3QsIGFuY2hvcik7XG5cdFx0XHRpbnNlcnQodGFyZ2V0LCB0ZXh0XzEsIGFuY2hvcik7XG5cdFx0XHRhcHBlbmQodGV4dF8xLCB0KTtcblxuXHRcdFx0aWYgKCFtb3VudGVkKSB7XG5cdFx0XHRcdGRpc3Bvc2UgPSBbXG5cdFx0XHRcdFx0bGlzdGVuKHJlY3QsIFwiZm9jdXNcIiwgLypoYW5kbGVGb2N1cyovIGN0eFsyNl0pLFxuXHRcdFx0XHRcdGxpc3Rlbih0ZXh0XzEsIFwiZm9jdXNcIiwgLypoYW5kbGVGb2N1cyovIGN0eFsyNl0pXG5cdFx0XHRcdF07XG5cblx0XHRcdFx0bW91bnRlZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRwKGN0eCwgZGlydHkpIHtcblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbFdpZHRoLCBtYXJnaW4qLyAyNjI2NTYgJiYgcmVjdF95X3ZhbHVlICE9PSAocmVjdF95X3ZhbHVlID0gLypjZWxsV2lkdGgqLyBjdHhbMThdICogLyp5Ki8gY3R4WzYyXSArIC8qbWFyZ2luKi8gY3R4WzldKSkge1xuXHRcdFx0XHRhdHRyKHJlY3QsIFwieVwiLCByZWN0X3lfdmFsdWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxIZWlnaHQsIG1hcmdpbiovIDQxOTQ4MTYgJiYgcmVjdF94X3ZhbHVlICE9PSAocmVjdF94X3ZhbHVlID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeCovIGN0eFs2NV0gKyAvKm1hcmdpbiovIGN0eFs5XSkpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcInhcIiwgcmVjdF94X3ZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsV2lkdGgqLyAyNjIxNDQpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcIndpZHRoXCIsIC8qY2VsbFdpZHRoKi8gY3R4WzE4XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbEhlaWdodCovIDQxOTQzMDQpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcImhlaWdodFwiLCAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLyppbm5lckJvcmRlckNvbG91ciovIDIwNDgpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcInN0cm9rZVwiLCAvKmlubmVyQm9yZGVyQ29sb3VyKi8gY3R4WzExXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qaW5uZXJCb3JkZXJXaWR0aCovIDI1Nikge1xuXHRcdFx0XHRhdHRyKHJlY3QsIFwic3Ryb2tlLXdpZHRoXCIsIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qYmFja2dyb3VuZENvbG91ciovIDgxOTIpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcImZpbGxcIiwgLypiYWNrZ3JvdW5kQ29sb3VyKi8gY3R4WzEzXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qZ3JpZCovIDEgJiYgdF92YWx1ZSAhPT0gKHRfdmFsdWUgPSAvKmxldHRlciovIGN0eFs2M10gKyBcIlwiKSkgc2V0X2RhdGEodCwgdF92YWx1ZSk7XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbFdpZHRoLCBtYXJnaW4qLyAyNjI2NTYgJiYgdGV4dF8xX3hfdmFsdWUgIT09ICh0ZXh0XzFfeF92YWx1ZSA9IC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAqIC8qeCovIGN0eFs2NV0gKyAvKm1hcmdpbiovIGN0eFs5XSArIC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAvIDIpKSB7XG5cdFx0XHRcdGF0dHIodGV4dF8xLCBcInhcIiwgdGV4dF8xX3hfdmFsdWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxIZWlnaHQsIG1hcmdpbiovIDQxOTQ4MTYgJiYgdGV4dF8xX3lfdmFsdWUgIT09ICh0ZXh0XzFfeV92YWx1ZSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKnkqLyBjdHhbNjJdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdIC0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIDAuMSkpIHtcblx0XHRcdFx0YXR0cih0ZXh0XzEsIFwieVwiLCB0ZXh0XzFfeV92YWx1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qZm9udFNpemUqLyAxMDQ4NTc2KSB7XG5cdFx0XHRcdGF0dHIodGV4dF8xLCBcImZvbnQtc2l6ZVwiLCAvKmZvbnRTaXplKi8gY3R4WzIwXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbFdpZHRoKi8gMjYyMTQ0KSB7XG5cdFx0XHRcdGF0dHIodGV4dF8xLCBcIndpZHRoXCIsIC8qY2VsbFdpZHRoKi8gY3R4WzE4XSk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRkKGRldGFjaGluZykge1xuXHRcdFx0aWYgKGRldGFjaGluZykgZGV0YWNoKHJlY3QpO1xuXHRcdFx0aWYgKGRldGFjaGluZykgZGV0YWNoKHRleHRfMSk7XG5cdFx0XHRtb3VudGVkID0gZmFsc2U7XG5cdFx0XHRydW5fYWxsKGRpc3Bvc2UpO1xuXHRcdH1cblx0fTtcbn1cblxuLy8gKDQ1NzoyOCkgeyNpZiBsZXR0ZXI9PVwiI1wifVxuZnVuY3Rpb24gY3JlYXRlX2lmX2Jsb2NrXzEoY3R4KSB7XG5cdGxldCByZWN0O1xuXHRsZXQgcmVjdF95X3ZhbHVlO1xuXHRsZXQgcmVjdF94X3ZhbHVlO1xuXHRsZXQgbGluZTA7XG5cdGxldCBsaW5lMF95X192YWx1ZTtcblx0bGV0IGxpbmUwX3hfX3ZhbHVlO1xuXHRsZXQgbGluZTBfeV9fdmFsdWVfMTtcblx0bGV0IGxpbmUwX3hfX3ZhbHVlXzE7XG5cdGxldCBsaW5lMTtcblx0bGV0IGxpbmUxX3lfX3ZhbHVlO1xuXHRsZXQgbGluZTFfeF9fdmFsdWU7XG5cdGxldCBsaW5lMV95X192YWx1ZV8xO1xuXHRsZXQgbGluZTFfeF9fdmFsdWVfMTtcblx0bGV0IGxpbmUxX3RyYW5zZm9ybV92YWx1ZTtcblx0bGV0IG1vdW50ZWQ7XG5cdGxldCBkaXNwb3NlO1xuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdHJlY3QgPSBzdmdfZWxlbWVudChcInJlY3RcIik7XG5cdFx0XHRsaW5lMCA9IHN2Z19lbGVtZW50KFwibGluZVwiKTtcblx0XHRcdGxpbmUxID0gc3ZnX2VsZW1lbnQoXCJsaW5lXCIpO1xuXHRcdFx0YXR0cihyZWN0LCBcImNsYXNzXCIsIFwianh3b3JkLWNlbGwtcmVjdCBzdmVsdGUtMTAxM2o1bVwiKTtcblx0XHRcdGF0dHIocmVjdCwgXCJyb2xlXCIsIFwiY2VsbFwiKTtcblx0XHRcdGF0dHIocmVjdCwgXCJ0YWJpbmRleFwiLCBcIi0xXCIpO1xuXHRcdFx0YXR0cihyZWN0LCBcImFyaWEtbGFiZWxcIiwgXCJibGFua1wiKTtcblx0XHRcdGF0dHIocmVjdCwgXCJ5XCIsIHJlY3RfeV92YWx1ZSA9IC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAqIC8qeSovIGN0eFs2Ml0gKyAvKm1hcmdpbiovIGN0eFs5XSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwieFwiLCByZWN0X3hfdmFsdWUgPSAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogLyp4Ki8gY3R4WzY1XSArIC8qbWFyZ2luKi8gY3R4WzldKTtcblx0XHRcdGF0dHIocmVjdCwgXCJ3aWR0aFwiLCAvKmNlbGxXaWR0aCovIGN0eFsxOF0pO1xuXHRcdFx0YXR0cihyZWN0LCBcImhlaWdodFwiLCAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdKTtcblx0XHRcdGF0dHIocmVjdCwgXCJzdHJva2VcIiwgLyppbm5lckJvcmRlckNvbG91ciovIGN0eFsxMV0pO1xuXHRcdFx0YXR0cihyZWN0LCBcInN0cm9rZS13aWR0aFwiLCAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0pO1xuXHRcdFx0YXR0cihyZWN0LCBcImZpbGxcIiwgLypmaWxsQ29sb3VyKi8gY3R4WzEyXSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwiZGF0YS1jb2xcIiwgLyp5Ki8gY3R4WzYyXSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwiZGF0YS1yb3dcIiwgLyp4Ki8gY3R4WzY1XSk7XG5cdFx0XHRhdHRyKGxpbmUwLCBcImNsYXNzXCIsIFwianh3b3JkLWNlbGwtbGluZSBzdmVsdGUtMTAxM2o1bVwiKTtcblx0XHRcdGF0dHIobGluZTAsIFwicm9sZVwiLCBcImNlbGxcIik7XG5cdFx0XHRhdHRyKGxpbmUwLCBcInRhYmluZGV4XCIsIFwiLTFcIik7XG5cdFx0XHRhdHRyKGxpbmUwLCBcInkxXCIsIGxpbmUwX3lfX3ZhbHVlID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeSovIGN0eFs2Ml0gKyAvKm1hcmdpbiovIGN0eFs5XSArIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSk7XG5cdFx0XHRhdHRyKGxpbmUwLCBcIngxXCIsIGxpbmUwX3hfX3ZhbHVlID0gLypjZWxsV2lkdGgqLyBjdHhbMThdICogLyp4Ki8gY3R4WzY1XSArIC8qbWFyZ2luKi8gY3R4WzldICsgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdKTtcblx0XHRcdGF0dHIobGluZTAsIFwieTJcIiwgbGluZTBfeV9fdmFsdWVfMSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKnkqLyBjdHhbNjJdICsgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdICogLyp5Ki8gY3R4WzYyXSArIC8qY2VsbEhlaWdodCovIGN0eFsyMl0pO1xuXHRcdFx0YXR0cihsaW5lMCwgXCJ4MlwiLCBsaW5lMF94X192YWx1ZV8xID0gLypjZWxsV2lkdGgqLyBjdHhbMThdICogLyp4Ki8gY3R4WzY1XSArIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSAqIC8qeSovIGN0eFs2Ml0gKyAvKmNlbGxXaWR0aCovIGN0eFsxOF0pO1xuXHRcdFx0YXR0cihsaW5lMCwgXCJzdHJva2VcIiwgLyppbm5lckJvcmRlckNvbG91ciovIGN0eFsxMV0pO1xuXHRcdFx0YXR0cihsaW5lMCwgXCJzdHJva2Utd2lkdGhcIiwgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdKTtcblx0XHRcdGF0dHIobGluZTAsIFwiZGF0YS1jb2xcIiwgLyp5Ki8gY3R4WzYyXSk7XG5cdFx0XHRhdHRyKGxpbmUwLCBcImRhdGEtcm93XCIsIC8qeCovIGN0eFs2NV0pO1xuXHRcdFx0YXR0cihsaW5lMSwgXCJjbGFzc1wiLCBcImp4d29yZC1jZWxsLWxpbmUgc3ZlbHRlLTEwMTNqNW1cIik7XG5cdFx0XHRhdHRyKGxpbmUxLCBcInJvbGVcIiwgXCJjZWxsXCIpO1xuXHRcdFx0YXR0cihsaW5lMSwgXCJ0YWJpbmRleFwiLCBcIi0xXCIpO1xuXHRcdFx0YXR0cihsaW5lMSwgXCJ5MVwiLCBsaW5lMV95X192YWx1ZSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKnkqLyBjdHhbNjJdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0pO1xuXHRcdFx0YXR0cihsaW5lMSwgXCJ4MVwiLCBsaW5lMV94X192YWx1ZSA9IC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAqIC8qeCovIGN0eFs2NV0gKyAvKm1hcmdpbiovIGN0eFs5XSArIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSk7XG5cdFx0XHRhdHRyKGxpbmUxLCBcInkyXCIsIGxpbmUxX3lfX3ZhbHVlXzEgPSAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogLyp5Ki8gY3R4WzYyXSArIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSAqIC8qeSovIGN0eFs2Ml0gKyAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdKTtcblx0XHRcdGF0dHIobGluZTEsIFwieDJcIiwgbGluZTFfeF9fdmFsdWVfMSA9IC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAqIC8qeCovIGN0eFs2NV0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0gKiAvKnkqLyBjdHhbNjJdICsgLypjZWxsV2lkdGgqLyBjdHhbMThdKTtcblx0XHRcdGF0dHIobGluZTEsIFwic3Ryb2tlXCIsIC8qaW5uZXJCb3JkZXJDb2xvdXIqLyBjdHhbMTFdKTtcblx0XHRcdGF0dHIobGluZTEsIFwic3Ryb2tlLXdpZHRoXCIsIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSk7XG5cdFx0XHRhdHRyKGxpbmUxLCBcImRhdGEtY29sXCIsIC8qeSovIGN0eFs2Ml0pO1xuXHRcdFx0YXR0cihsaW5lMSwgXCJkYXRhLXJvd1wiLCAvKngqLyBjdHhbNjVdKTtcblx0XHRcdGF0dHIobGluZTEsIFwidHJhbnNmb3JtXCIsIGxpbmUxX3RyYW5zZm9ybV92YWx1ZSA9IFwicm90YXRlKDkwLCBcIiArICgvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmNlbGxXaWR0aCovIGN0eFsxOF0gLyAyKSArIFwiLCBcIiArICgvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogLyp5Ki8gY3R4WzYyXSArIC8qbWFyZ2luKi8gY3R4WzldICsgLypjZWxsV2lkdGgqLyBjdHhbMThdIC8gMikgKyBcIilcIik7XG5cdFx0fSxcblx0XHRtKHRhcmdldCwgYW5jaG9yKSB7XG5cdFx0XHRpbnNlcnQodGFyZ2V0LCByZWN0LCBhbmNob3IpO1xuXHRcdFx0aW5zZXJ0KHRhcmdldCwgbGluZTAsIGFuY2hvcik7XG5cdFx0XHRpbnNlcnQodGFyZ2V0LCBsaW5lMSwgYW5jaG9yKTtcblxuXHRcdFx0aWYgKCFtb3VudGVkKSB7XG5cdFx0XHRcdGRpc3Bvc2UgPSBbXG5cdFx0XHRcdFx0bGlzdGVuKHJlY3QsIFwiZm9jdXNcIiwgLypoYW5kbGVGb2N1cyovIGN0eFsyNl0pLFxuXHRcdFx0XHRcdGxpc3RlbihsaW5lMCwgXCJmb2N1c1wiLCAvKmhhbmRsZUZvY3VzKi8gY3R4WzI2XSksXG5cdFx0XHRcdFx0bGlzdGVuKGxpbmUxLCBcImZvY3VzXCIsIC8qaGFuZGxlRm9jdXMqLyBjdHhbMjZdKVxuXHRcdFx0XHRdO1xuXG5cdFx0XHRcdG1vdW50ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cChjdHgsIGRpcnR5KSB7XG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxXaWR0aCwgbWFyZ2luKi8gMjYyNjU2ICYmIHJlY3RfeV92YWx1ZSAhPT0gKHJlY3RfeV92YWx1ZSA9IC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAqIC8qeSovIGN0eFs2Ml0gKyAvKm1hcmdpbiovIGN0eFs5XSkpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcInlcIiwgcmVjdF95X3ZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsSGVpZ2h0LCBtYXJnaW4qLyA0MTk0ODE2ICYmIHJlY3RfeF92YWx1ZSAhPT0gKHJlY3RfeF92YWx1ZSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0pKSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJ4XCIsIHJlY3RfeF92YWx1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbFdpZHRoKi8gMjYyMTQ0KSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJ3aWR0aFwiLCAvKmNlbGxXaWR0aCovIGN0eFsxOF0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxIZWlnaHQqLyA0MTk0MzA0KSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJoZWlnaHRcIiwgLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qaW5uZXJCb3JkZXJDb2xvdXIqLyAyMDQ4KSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJzdHJva2VcIiwgLyppbm5lckJvcmRlckNvbG91ciovIGN0eFsxMV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmlubmVyQm9yZGVyV2lkdGgqLyAyNTYpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcInN0cm9rZS13aWR0aFwiLCAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmZpbGxDb2xvdXIqLyA0MDk2KSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJmaWxsXCIsIC8qZmlsbENvbG91ciovIGN0eFsxMl0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxIZWlnaHQsIG1hcmdpbiwgaW5uZXJCb3JkZXJXaWR0aCovIDQxOTUwNzIgJiYgbGluZTBfeV9fdmFsdWUgIT09IChsaW5lMF95X192YWx1ZSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKnkqLyBjdHhbNjJdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0pKSB7XG5cdFx0XHRcdGF0dHIobGluZTAsIFwieTFcIiwgbGluZTBfeV9fdmFsdWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxXaWR0aCwgbWFyZ2luLCBpbm5lckJvcmRlcldpZHRoKi8gMjYyOTEyICYmIGxpbmUwX3hfX3ZhbHVlICE9PSAobGluZTBfeF9fdmFsdWUgPSAvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0pKSB7XG5cdFx0XHRcdGF0dHIobGluZTAsIFwieDFcIiwgbGluZTBfeF9fdmFsdWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxIZWlnaHQsIGlubmVyQm9yZGVyV2lkdGgqLyA0MTk0NTYwICYmIGxpbmUwX3lfX3ZhbHVlXzEgIT09IChsaW5lMF95X192YWx1ZV8xID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeSovIGN0eFs2Ml0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0gKiAvKnkqLyBjdHhbNjJdICsgLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSkpIHtcblx0XHRcdFx0YXR0cihsaW5lMCwgXCJ5MlwiLCBsaW5lMF95X192YWx1ZV8xKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsV2lkdGgsIGlubmVyQm9yZGVyV2lkdGgqLyAyNjI0MDAgJiYgbGluZTBfeF9fdmFsdWVfMSAhPT0gKGxpbmUwX3hfX3ZhbHVlXzEgPSAvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKngqLyBjdHhbNjVdICsgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdICogLyp5Ki8gY3R4WzYyXSArIC8qY2VsbFdpZHRoKi8gY3R4WzE4XSkpIHtcblx0XHRcdFx0YXR0cihsaW5lMCwgXCJ4MlwiLCBsaW5lMF94X192YWx1ZV8xKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLyppbm5lckJvcmRlckNvbG91ciovIDIwNDgpIHtcblx0XHRcdFx0YXR0cihsaW5lMCwgXCJzdHJva2VcIiwgLyppbm5lckJvcmRlckNvbG91ciovIGN0eFsxMV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmlubmVyQm9yZGVyV2lkdGgqLyAyNTYpIHtcblx0XHRcdFx0YXR0cihsaW5lMCwgXCJzdHJva2Utd2lkdGhcIiwgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsSGVpZ2h0LCBtYXJnaW4sIGlubmVyQm9yZGVyV2lkdGgqLyA0MTk1MDcyICYmIGxpbmUxX3lfX3ZhbHVlICE9PSAobGluZTFfeV9fdmFsdWUgPSAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogLyp5Ki8gY3R4WzYyXSArIC8qbWFyZ2luKi8gY3R4WzldICsgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdKSkge1xuXHRcdFx0XHRhdHRyKGxpbmUxLCBcInkxXCIsIGxpbmUxX3lfX3ZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsV2lkdGgsIG1hcmdpbiwgaW5uZXJCb3JkZXJXaWR0aCovIDI2MjkxMiAmJiBsaW5lMV94X192YWx1ZSAhPT0gKGxpbmUxX3hfX3ZhbHVlID0gLypjZWxsV2lkdGgqLyBjdHhbMThdICogLyp4Ki8gY3R4WzY1XSArIC8qbWFyZ2luKi8gY3R4WzldICsgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdKSkge1xuXHRcdFx0XHRhdHRyKGxpbmUxLCBcIngxXCIsIGxpbmUxX3hfX3ZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsSGVpZ2h0LCBpbm5lckJvcmRlcldpZHRoKi8gNDE5NDU2MCAmJiBsaW5lMV95X192YWx1ZV8xICE9PSAobGluZTFfeV9fdmFsdWVfMSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKnkqLyBjdHhbNjJdICsgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdICogLyp5Ki8gY3R4WzYyXSArIC8qY2VsbEhlaWdodCovIGN0eFsyMl0pKSB7XG5cdFx0XHRcdGF0dHIobGluZTEsIFwieTJcIiwgbGluZTFfeV9fdmFsdWVfMSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbFdpZHRoLCBpbm5lckJvcmRlcldpZHRoKi8gMjYyNDAwICYmIGxpbmUxX3hfX3ZhbHVlXzEgIT09IChsaW5lMV94X192YWx1ZV8xID0gLypjZWxsV2lkdGgqLyBjdHhbMThdICogLyp4Ki8gY3R4WzY1XSArIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSAqIC8qeSovIGN0eFs2Ml0gKyAvKmNlbGxXaWR0aCovIGN0eFsxOF0pKSB7XG5cdFx0XHRcdGF0dHIobGluZTEsIFwieDJcIiwgbGluZTFfeF9fdmFsdWVfMSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qaW5uZXJCb3JkZXJDb2xvdXIqLyAyMDQ4KSB7XG5cdFx0XHRcdGF0dHIobGluZTEsIFwic3Ryb2tlXCIsIC8qaW5uZXJCb3JkZXJDb2xvdXIqLyBjdHhbMTFdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLyppbm5lckJvcmRlcldpZHRoKi8gMjU2KSB7XG5cdFx0XHRcdGF0dHIobGluZTEsIFwic3Ryb2tlLXdpZHRoXCIsIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbFdpZHRoLCBtYXJnaW4sIGNlbGxIZWlnaHQqLyA0NDU2OTYwICYmIGxpbmUxX3RyYW5zZm9ybV92YWx1ZSAhPT0gKGxpbmUxX3RyYW5zZm9ybV92YWx1ZSA9IFwicm90YXRlKDkwLCBcIiArICgvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmNlbGxXaWR0aCovIGN0eFsxOF0gLyAyKSArIFwiLCBcIiArICgvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogLyp5Ki8gY3R4WzYyXSArIC8qbWFyZ2luKi8gY3R4WzldICsgLypjZWxsV2lkdGgqLyBjdHhbMThdIC8gMikgKyBcIilcIikpIHtcblx0XHRcdFx0YXR0cihsaW5lMSwgXCJ0cmFuc2Zvcm1cIiwgbGluZTFfdHJhbnNmb3JtX3ZhbHVlKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2gocmVjdCk7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2gobGluZTApO1xuXHRcdFx0aWYgKGRldGFjaGluZykgZGV0YWNoKGxpbmUxKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdHJ1bl9hbGwoZGlzcG9zZSk7XG5cdFx0fVxuXHR9O1xufVxuXG4vLyAoNDY2OjI4KSB7I2lmIChudW1iZXJfZ3JpZFt5XVt4XSAhPSBudWxsICYmIGxldHRlciE9PVwiI1wiKX1cbmZ1bmN0aW9uIGNyZWF0ZV9pZl9ibG9jayhjdHgpIHtcblx0bGV0IHRleHRfMTtcblx0bGV0IHRfdmFsdWUgPSAvKm51bWJlcl9ncmlkKi8gY3R4WzE3XVsvKnkqLyBjdHhbNjJdXVsvKngqLyBjdHhbNjVdXSArIFwiXCI7XG5cdGxldCB0O1xuXHRsZXQgdGV4dF8xX3hfdmFsdWU7XG5cdGxldCB0ZXh0XzFfeV92YWx1ZTtcblx0bGV0IG1vdW50ZWQ7XG5cdGxldCBkaXNwb3NlO1xuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdHRleHRfMSA9IHN2Z19lbGVtZW50KFwidGV4dFwiKTtcblx0XHRcdHQgPSB0ZXh0KHRfdmFsdWUpO1xuXHRcdFx0YXR0cih0ZXh0XzEsIFwieFwiLCB0ZXh0XzFfeF92YWx1ZSA9IC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAqIC8qeCovIGN0eFs2NV0gKyAvKm1hcmdpbiovIGN0eFs5XSArIDIpO1xuXHRcdFx0YXR0cih0ZXh0XzEsIFwieVwiLCB0ZXh0XzFfeV92YWx1ZSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKnkqLyBjdHhbNjJdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKm51bUZvbnRTaXplKi8gY3R4WzIxXSk7XG5cdFx0XHRhdHRyKHRleHRfMSwgXCJ0ZXh0LWFuY2hvclwiLCBcImxlZnRcIik7XG5cdFx0XHRhdHRyKHRleHRfMSwgXCJmb250LXNpemVcIiwgLypudW1Gb250U2l6ZSovIGN0eFsyMV0pO1xuXHRcdFx0YXR0cih0ZXh0XzEsIFwiY2xhc3NcIiwgXCJzdmVsdGUtMTAxM2o1bVwiKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGluc2VydCh0YXJnZXQsIHRleHRfMSwgYW5jaG9yKTtcblx0XHRcdGFwcGVuZCh0ZXh0XzEsIHQpO1xuXG5cdFx0XHRpZiAoIW1vdW50ZWQpIHtcblx0XHRcdFx0ZGlzcG9zZSA9IGxpc3Rlbih0ZXh0XzEsIFwiZm9jdXNcIiwgLypoYW5kbGVGb2N1cyovIGN0eFsyNl0pO1xuXHRcdFx0XHRtb3VudGVkID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHAoY3R4LCBkaXJ0eSkge1xuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypudW1iZXJfZ3JpZCovIDEzMTA3MiAmJiB0X3ZhbHVlICE9PSAodF92YWx1ZSA9IC8qbnVtYmVyX2dyaWQqLyBjdHhbMTddWy8qeSovIGN0eFs2Ml1dWy8qeCovIGN0eFs2NV1dICsgXCJcIikpIHNldF9kYXRhKHQsIHRfdmFsdWUpO1xuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxXaWR0aCwgbWFyZ2luKi8gMjYyNjU2ICYmIHRleHRfMV94X3ZhbHVlICE9PSAodGV4dF8xX3hfdmFsdWUgPSAvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAyKSkge1xuXHRcdFx0XHRhdHRyKHRleHRfMSwgXCJ4XCIsIHRleHRfMV94X3ZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsSGVpZ2h0LCBtYXJnaW4sIG51bUZvbnRTaXplKi8gNjI5MTk2OCAmJiB0ZXh0XzFfeV92YWx1ZSAhPT0gKHRleHRfMV95X3ZhbHVlID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeSovIGN0eFs2Ml0gKyAvKm1hcmdpbiovIGN0eFs5XSArIC8qbnVtRm9udFNpemUqLyBjdHhbMjFdKSkge1xuXHRcdFx0XHRhdHRyKHRleHRfMSwgXCJ5XCIsIHRleHRfMV95X3ZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypudW1Gb250U2l6ZSovIDIwOTcxNTIpIHtcblx0XHRcdFx0YXR0cih0ZXh0XzEsIFwiZm9udC1zaXplXCIsIC8qbnVtRm9udFNpemUqLyBjdHhbMjFdKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2godGV4dF8xKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdGRpc3Bvc2UoKTtcblx0XHR9XG5cdH07XG59XG5cbi8vICg0NTU6MjApIHsjZWFjaCBjb2xfZGF0YSBhcyBsZXR0ZXIsIHh9XG5mdW5jdGlvbiBjcmVhdGVfZWFjaF9ibG9ja18xKGN0eCkge1xuXHRsZXQgZztcblx0bGV0IGlmX2Jsb2NrMF9hbmNob3I7XG5cdGxldCBtb3VudGVkO1xuXHRsZXQgZGlzcG9zZTtcblxuXHRmdW5jdGlvbiBzZWxlY3RfYmxvY2tfdHlwZShjdHgsIGRpcnR5KSB7XG5cdFx0aWYgKC8qbGV0dGVyKi8gY3R4WzYzXSA9PSBcIiNcIikgcmV0dXJuIGNyZWF0ZV9pZl9ibG9ja18xO1xuXHRcdHJldHVybiBjcmVhdGVfZWxzZV9ibG9jaztcblx0fVxuXG5cdGxldCBjdXJyZW50X2Jsb2NrX3R5cGUgPSBzZWxlY3RfYmxvY2tfdHlwZShjdHgpO1xuXHRsZXQgaWZfYmxvY2swID0gY3VycmVudF9ibG9ja190eXBlKGN0eCk7XG5cdGxldCBpZl9ibG9jazEgPSAvKm51bWJlcl9ncmlkKi8gY3R4WzE3XVsvKnkqLyBjdHhbNjJdXVsvKngqLyBjdHhbNjVdXSAhPSBudWxsICYmIC8qbGV0dGVyKi8gY3R4WzYzXSAhPT0gXCIjXCIgJiYgY3JlYXRlX2lmX2Jsb2NrKGN0eCk7XG5cblx0ZnVuY3Rpb24gY2xpY2tfaGFuZGxlcigpIHtcblx0XHRyZXR1cm4gLypjbGlja19oYW5kbGVyKi8gY3R4WzQ0XSgvKngqLyBjdHhbNjVdLCAvKnkqLyBjdHhbNjJdKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGRibGNsaWNrX2hhbmRsZXIoKSB7XG5cdFx0cmV0dXJuIC8qZGJsY2xpY2tfaGFuZGxlciovIGN0eFs0NV0oLyp4Ki8gY3R4WzY1XSwgLyp5Ki8gY3R4WzYyXSk7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdGMoKSB7XG5cdFx0XHRnID0gc3ZnX2VsZW1lbnQoXCJnXCIpO1xuXHRcdFx0aWZfYmxvY2swLmMoKTtcblx0XHRcdGlmX2Jsb2NrMF9hbmNob3IgPSBlbXB0eSgpO1xuXHRcdFx0aWYgKGlmX2Jsb2NrMSkgaWZfYmxvY2sxLmMoKTtcblx0XHRcdGF0dHIoZywgXCJpZFwiLCBcImp4d29yZC1jZWxsLVwiICsgLyp4Ki8gY3R4WzY1XSArIFwiLVwiICsgLyp5Ki8gY3R4WzYyXSk7XG5cdFx0XHRhdHRyKGcsIFwiY2xhc3NcIiwgXCJqeHdvcmQtY2VsbCBzdmVsdGUtMTAxM2o1bVwiKTtcblx0XHRcdHNldF9zdHlsZShnLCBcInotaW5kZXhcIiwgXCIyMFwiKTtcblx0XHRcdHRvZ2dsZV9jbGFzcyhnLCBcInNlbGVjdGVkXCIsIC8qY3VycmVudF95Ki8gY3R4WzJdID09PSAvKnkqLyBjdHhbNjJdICYmIC8qY3VycmVudF94Ki8gY3R4WzFdID09PSAvKngqLyBjdHhbNjVdKTtcblx0XHRcdHRvZ2dsZV9jbGFzcyhnLCBcImFjdGl2ZVwiLCAvKm1hcmtlZF93b3JkX2dyaWQqLyBjdHhbMTldWy8qeSovIGN0eFs2Ml1dWy8qeCovIGN0eFs2NV1dKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGluc2VydCh0YXJnZXQsIGcsIGFuY2hvcik7XG5cdFx0XHRpZl9ibG9jazAubShnLCBudWxsKTtcblx0XHRcdGFwcGVuZChnLCBpZl9ibG9jazBfYW5jaG9yKTtcblx0XHRcdGlmIChpZl9ibG9jazEpIGlmX2Jsb2NrMS5tKGcsIG51bGwpO1xuXG5cdFx0XHRpZiAoIW1vdW50ZWQpIHtcblx0XHRcdFx0ZGlzcG9zZSA9IFtcblx0XHRcdFx0XHRsaXN0ZW4oZywgXCJjbGlja1wiLCBjbGlja19oYW5kbGVyKSxcblx0XHRcdFx0XHRsaXN0ZW4oZywgXCJkYmxjbGlja1wiLCBkYmxjbGlja19oYW5kbGVyKSxcblx0XHRcdFx0XHRsaXN0ZW4oZywgXCJrZXlkb3duXCIsIC8qaGFuZGxlS2V5ZG93biovIGN0eFsxNl0pXG5cdFx0XHRcdF07XG5cblx0XHRcdFx0bW91bnRlZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRwKG5ld19jdHgsIGRpcnR5KSB7XG5cdFx0XHRjdHggPSBuZXdfY3R4O1xuXG5cdFx0XHRpZiAoY3VycmVudF9ibG9ja190eXBlID09PSAoY3VycmVudF9ibG9ja190eXBlID0gc2VsZWN0X2Jsb2NrX3R5cGUoY3R4KSkgJiYgaWZfYmxvY2swKSB7XG5cdFx0XHRcdGlmX2Jsb2NrMC5wKGN0eCwgZGlydHkpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWZfYmxvY2swLmQoMSk7XG5cdFx0XHRcdGlmX2Jsb2NrMCA9IGN1cnJlbnRfYmxvY2tfdHlwZShjdHgpO1xuXG5cdFx0XHRcdGlmIChpZl9ibG9jazApIHtcblx0XHRcdFx0XHRpZl9ibG9jazAuYygpO1xuXHRcdFx0XHRcdGlmX2Jsb2NrMC5tKGcsIGlmX2Jsb2NrMF9hbmNob3IpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICgvKm51bWJlcl9ncmlkKi8gY3R4WzE3XVsvKnkqLyBjdHhbNjJdXVsvKngqLyBjdHhbNjVdXSAhPSBudWxsICYmIC8qbGV0dGVyKi8gY3R4WzYzXSAhPT0gXCIjXCIpIHtcblx0XHRcdFx0aWYgKGlmX2Jsb2NrMSkge1xuXHRcdFx0XHRcdGlmX2Jsb2NrMS5wKGN0eCwgZGlydHkpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGlmX2Jsb2NrMSA9IGNyZWF0ZV9pZl9ibG9jayhjdHgpO1xuXHRcdFx0XHRcdGlmX2Jsb2NrMS5jKCk7XG5cdFx0XHRcdFx0aWZfYmxvY2sxLm0oZywgbnVsbCk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoaWZfYmxvY2sxKSB7XG5cdFx0XHRcdGlmX2Jsb2NrMS5kKDEpO1xuXHRcdFx0XHRpZl9ibG9jazEgPSBudWxsO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmN1cnJlbnRfeSwgY3VycmVudF94Ki8gNikge1xuXHRcdFx0XHR0b2dnbGVfY2xhc3MoZywgXCJzZWxlY3RlZFwiLCAvKmN1cnJlbnRfeSovIGN0eFsyXSA9PT0gLyp5Ki8gY3R4WzYyXSAmJiAvKmN1cnJlbnRfeCovIGN0eFsxXSA9PT0gLyp4Ki8gY3R4WzY1XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qbWFya2VkX3dvcmRfZ3JpZCovIDUyNDI4OCkge1xuXHRcdFx0XHR0b2dnbGVfY2xhc3MoZywgXCJhY3RpdmVcIiwgLyptYXJrZWRfd29yZF9ncmlkKi8gY3R4WzE5XVsvKnkqLyBjdHhbNjJdXVsvKngqLyBjdHhbNjVdXSk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRkKGRldGFjaGluZykge1xuXHRcdFx0aWYgKGRldGFjaGluZykgZGV0YWNoKGcpO1xuXHRcdFx0aWZfYmxvY2swLmQoKTtcblx0XHRcdGlmIChpZl9ibG9jazEpIGlmX2Jsb2NrMS5kKCk7XG5cdFx0XHRtb3VudGVkID0gZmFsc2U7XG5cdFx0XHRydW5fYWxsKGRpc3Bvc2UpO1xuXHRcdH1cblx0fTtcbn1cblxuLy8gKDQ1NDoxNikgeyNlYWNoIGdyaWQgYXMgY29sX2RhdGEsIHl9XG5mdW5jdGlvbiBjcmVhdGVfZWFjaF9ibG9jayhjdHgpIHtcblx0bGV0IGVhY2hfMV9hbmNob3I7XG5cdGxldCBlYWNoX3ZhbHVlXzEgPSAvKmNvbF9kYXRhKi8gY3R4WzYwXTtcblx0bGV0IGVhY2hfYmxvY2tzID0gW107XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX3ZhbHVlXzEubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRlYWNoX2Jsb2Nrc1tpXSA9IGNyZWF0ZV9lYWNoX2Jsb2NrXzEoZ2V0X2VhY2hfY29udGV4dF8xKGN0eCwgZWFjaF92YWx1ZV8xLCBpKSk7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdGMoKSB7XG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGVhY2hfYmxvY2tzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdGVhY2hfYmxvY2tzW2ldLmMoKTtcblx0XHRcdH1cblxuXHRcdFx0ZWFjaF8xX2FuY2hvciA9IGVtcHR5KCk7XG5cdFx0fSxcblx0XHRtKHRhcmdldCwgYW5jaG9yKSB7XG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGVhY2hfYmxvY2tzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdGVhY2hfYmxvY2tzW2ldLm0odGFyZ2V0LCBhbmNob3IpO1xuXHRcdFx0fVxuXG5cdFx0XHRpbnNlcnQodGFyZ2V0LCBlYWNoXzFfYW5jaG9yLCBhbmNob3IpO1xuXHRcdH0sXG5cdFx0cChjdHgsIGRpcnR5KSB7XG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmN1cnJlbnRfeSwgY3VycmVudF94LCBtYXJrZWRfd29yZF9ncmlkLCBzZXRDdXJyZW50UG9zLCBoYW5kbGVEb3VibGVjbGljaywgaGFuZGxlS2V5ZG93biwgY2VsbFdpZHRoLCBtYXJnaW4sIGNlbGxIZWlnaHQsIG51bUZvbnRTaXplLCBoYW5kbGVGb2N1cywgbnVtYmVyX2dyaWQsIGdyaWQsIGlubmVyQm9yZGVyV2lkdGgsIGlubmVyQm9yZGVyQ29sb3VyLCBmaWxsQ29sb3VyLCBmb250U2l6ZSwgYmFja2dyb3VuZENvbG91ciovIDEwOTAzNDI0Nykge1xuXHRcdFx0XHRlYWNoX3ZhbHVlXzEgPSAvKmNvbF9kYXRhKi8gY3R4WzYwXTtcblx0XHRcdFx0bGV0IGk7XG5cblx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGVhY2hfdmFsdWVfMS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdGNvbnN0IGNoaWxkX2N0eCA9IGdldF9lYWNoX2NvbnRleHRfMShjdHgsIGVhY2hfdmFsdWVfMSwgaSk7XG5cblx0XHRcdFx0XHRpZiAoZWFjaF9ibG9ja3NbaV0pIHtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldLnAoY2hpbGRfY3R4LCBkaXJ0eSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldID0gY3JlYXRlX2VhY2hfYmxvY2tfMShjaGlsZF9jdHgpO1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0uYygpO1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0ubShlYWNoXzFfYW5jaG9yLnBhcmVudE5vZGUsIGVhY2hfMV9hbmNob3IpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvciAoOyBpIDwgZWFjaF9ibG9ja3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5kKDEpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZWFjaF9ibG9ja3MubGVuZ3RoID0gZWFjaF92YWx1ZV8xLmxlbmd0aDtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRkZXN0cm95X2VhY2goZWFjaF9ibG9ja3MsIGRldGFjaGluZyk7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2goZWFjaF8xX2FuY2hvcik7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVfZnJhZ21lbnQkMihjdHgpIHtcblx0bGV0IG1haW47XG5cdGxldCBkaXY7XG5cdGxldCBpbnB1dDtcblx0bGV0IHQwO1xuXHRsZXQgc3ZnO1xuXHRsZXQgZztcblx0bGV0IHJlY3Q7XG5cdGxldCB0MTtcblx0bGV0IHF1ZXN0aW9ucztcblx0bGV0IGN1cnJlbnQ7XG5cdGxldCBtb3VudGVkO1xuXHRsZXQgZGlzcG9zZTtcblx0bGV0IGVhY2hfdmFsdWUgPSAvKmdyaWQqLyBjdHhbMF07XG5cdGxldCBlYWNoX2Jsb2NrcyA9IFtdO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF92YWx1ZS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdGVhY2hfYmxvY2tzW2ldID0gY3JlYXRlX2VhY2hfYmxvY2soZ2V0X2VhY2hfY29udGV4dChjdHgsIGVhY2hfdmFsdWUsIGkpKTtcblx0fVxuXG5cdHF1ZXN0aW9ucyA9IG5ldyBRdWVzdGlvbnMoe30pO1xuXHRxdWVzdGlvbnMuJG9uKFwiY2hhbmdlXCIsIC8qY2hhbmdlX2hhbmRsZXIqLyBjdHhbNDddKTtcblx0cXVlc3Rpb25zLiRvbihcInVwZGF0ZV9xdWVzdGlvblwiLCAvKmhhbmRsZVVwZGF0ZVF1ZXN0aW9uKi8gY3R4WzI3XSk7XG5cblx0cmV0dXJuIHtcblx0XHRjKCkge1xuXHRcdFx0bWFpbiA9IGVsZW1lbnQoXCJtYWluXCIpO1xuXHRcdFx0ZGl2ID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdGlucHV0ID0gZWxlbWVudChcImlucHV0XCIpO1xuXHRcdFx0dDAgPSBzcGFjZSgpO1xuXHRcdFx0c3ZnID0gc3ZnX2VsZW1lbnQoXCJzdmdcIik7XG5cdFx0XHRnID0gc3ZnX2VsZW1lbnQoXCJnXCIpO1xuXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGVhY2hfYmxvY2tzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdGVhY2hfYmxvY2tzW2ldLmMoKTtcblx0XHRcdH1cblxuXHRcdFx0cmVjdCA9IHN2Z19lbGVtZW50KFwicmVjdFwiKTtcblx0XHRcdHQxID0gc3BhY2UoKTtcblx0XHRcdGNyZWF0ZV9jb21wb25lbnQocXVlc3Rpb25zLiQkLmZyYWdtZW50KTtcblx0XHRcdGF0dHIoaW5wdXQsIFwidHlwZVwiLCBcInRleHRcIik7XG5cdFx0XHRhdHRyKGlucHV0LCBcImNsYXNzXCIsIFwic3ZlbHRlLTEwMTNqNW1cIik7XG5cdFx0XHRhdHRyKHJlY3QsIFwieFwiLCAvKm1hcmdpbiovIGN0eFs5XSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwieVwiLCAvKm1hcmdpbiovIGN0eFs5XSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwid2lkdGhcIiwgLyp0b3RhbFdpZHRoKi8gY3R4WzVdKTtcblx0XHRcdGF0dHIocmVjdCwgXCJoZWlnaHRcIiwgLyp0b3RhbEhlaWdodCovIGN0eFs2XSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwic3Ryb2tlXCIsIC8qb3V0ZXJCb3JkZXJDb2xvdXIqLyBjdHhbMTBdKTtcblx0XHRcdGF0dHIocmVjdCwgXCJzdHJva2Utd2lkdGhcIiwgLypvdXRlckJvcmRlcldpZHRoKi8gY3R4WzddKTtcblx0XHRcdGF0dHIocmVjdCwgXCJmaWxsXCIsIFwibm9uZVwiKTtcblx0XHRcdGF0dHIocmVjdCwgXCJjbGFzc1wiLCBcInN2ZWx0ZS0xMDEzajVtXCIpO1xuXHRcdFx0YXR0cihnLCBcImNsYXNzXCIsIFwiY2VsbC1ncm91cCBzdmVsdGUtMTAxM2o1bVwiKTtcblx0XHRcdGF0dHIoc3ZnLCBcImNsYXNzXCIsIFwianh3b3JkLXN2ZyBzdmVsdGUtMTAxM2o1bVwiKTtcblx0XHRcdGF0dHIoc3ZnLCBcIm1pbi14XCIsIFwiMFwiKTtcblx0XHRcdGF0dHIoc3ZnLCBcIm1pbi15XCIsIFwiMFwiKTtcblx0XHRcdGF0dHIoc3ZnLCBcIndpZHRoXCIsIC8qdmlld2JveF93aWR0aCovIGN0eFsyM10pO1xuXHRcdFx0YXR0cihzdmcsIFwiaGVpZ2h0XCIsIC8qdmlld2JveF9oZWlnaHQqLyBjdHhbMjRdKTtcblx0XHRcdGF0dHIoZGl2LCBcImNsYXNzXCIsIFwianh3b3JkLXN2Zy1jb250YWluZXIgc3ZlbHRlLTEwMTNqNW1cIik7XG5cdFx0XHRhdHRyKG1haW4sIFwiY2xhc3NcIiwgXCJzdmVsdGUtMTAxM2o1bVwiKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGluc2VydCh0YXJnZXQsIG1haW4sIGFuY2hvcik7XG5cdFx0XHRhcHBlbmQobWFpbiwgZGl2KTtcblx0XHRcdGFwcGVuZChkaXYsIGlucHV0KTtcblx0XHRcdC8qaW5wdXRfYmluZGluZyovIGN0eFs0M10oaW5wdXQpO1xuXHRcdFx0YXBwZW5kKGRpdiwgdDApO1xuXHRcdFx0YXBwZW5kKGRpdiwgc3ZnKTtcblx0XHRcdGFwcGVuZChzdmcsIGcpO1xuXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGVhY2hfYmxvY2tzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdGVhY2hfYmxvY2tzW2ldLm0oZywgbnVsbCk7XG5cdFx0XHR9XG5cblx0XHRcdGFwcGVuZChnLCByZWN0KTtcblx0XHRcdC8qZGl2X2JpbmRpbmcqLyBjdHhbNDZdKGRpdik7XG5cdFx0XHRhcHBlbmQobWFpbiwgdDEpO1xuXHRcdFx0bW91bnRfY29tcG9uZW50KHF1ZXN0aW9ucywgbWFpbiwgbnVsbCk7XG5cdFx0XHRjdXJyZW50ID0gdHJ1ZTtcblxuXHRcdFx0aWYgKCFtb3VudGVkKSB7XG5cdFx0XHRcdGRpc3Bvc2UgPSBbXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0LCBcImtleWRvd25cIiwgLypoYW5kbGVLZXlkb3duKi8gY3R4WzE2XSksXG5cdFx0XHRcdFx0bGlzdGVuKHJlY3QsIFwiZm9jdXNcIiwgLypoYW5kbGVGb2N1cyovIGN0eFsyNl0pLFxuXHRcdFx0XHRcdGxpc3RlbihtYWluLCBcIm1vdmVcIiwgLypoYW5kbGVNb3ZlKi8gY3R4WzE0XSlcblx0XHRcdFx0XTtcblxuXHRcdFx0XHRtb3VudGVkID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHAoY3R4LCBkaXJ0eSkge1xuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypncmlkLCBjdXJyZW50X3ksIGN1cnJlbnRfeCwgbWFya2VkX3dvcmRfZ3JpZCwgc2V0Q3VycmVudFBvcywgaGFuZGxlRG91YmxlY2xpY2ssIGhhbmRsZUtleWRvd24sIGNlbGxXaWR0aCwgbWFyZ2luLCBjZWxsSGVpZ2h0LCBudW1Gb250U2l6ZSwgaGFuZGxlRm9jdXMsIG51bWJlcl9ncmlkLCBpbm5lckJvcmRlcldpZHRoLCBpbm5lckJvcmRlckNvbG91ciwgZmlsbENvbG91ciwgZm9udFNpemUsIGJhY2tncm91bmRDb2xvdXIqLyAxMDkwMzQyNDcpIHtcblx0XHRcdFx0ZWFjaF92YWx1ZSA9IC8qZ3JpZCovIGN0eFswXTtcblx0XHRcdFx0bGV0IGk7XG5cblx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGVhY2hfdmFsdWUubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRjb25zdCBjaGlsZF9jdHggPSBnZXRfZWFjaF9jb250ZXh0KGN0eCwgZWFjaF92YWx1ZSwgaSk7XG5cblx0XHRcdFx0XHRpZiAoZWFjaF9ibG9ja3NbaV0pIHtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldLnAoY2hpbGRfY3R4LCBkaXJ0eSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldID0gY3JlYXRlX2VhY2hfYmxvY2soY2hpbGRfY3R4KTtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldLmMoKTtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldLm0oZywgcmVjdCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Zm9yICg7IGkgPCBlYWNoX2Jsb2Nrcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldLmQoMSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRlYWNoX2Jsb2Nrcy5sZW5ndGggPSBlYWNoX3ZhbHVlLmxlbmd0aDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFjdXJyZW50IHx8IGRpcnR5WzBdICYgLyptYXJnaW4qLyA1MTIpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcInhcIiwgLyptYXJnaW4qLyBjdHhbOV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWN1cnJlbnQgfHwgZGlydHlbMF0gJiAvKm1hcmdpbiovIDUxMikge1xuXHRcdFx0XHRhdHRyKHJlY3QsIFwieVwiLCAvKm1hcmdpbiovIGN0eFs5XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghY3VycmVudCB8fCBkaXJ0eVswXSAmIC8qdG90YWxXaWR0aCovIDMyKSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJ3aWR0aFwiLCAvKnRvdGFsV2lkdGgqLyBjdHhbNV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWN1cnJlbnQgfHwgZGlydHlbMF0gJiAvKnRvdGFsSGVpZ2h0Ki8gNjQpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcImhlaWdodFwiLCAvKnRvdGFsSGVpZ2h0Ki8gY3R4WzZdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFjdXJyZW50IHx8IGRpcnR5WzBdICYgLypvdXRlckJvcmRlckNvbG91ciovIDEwMjQpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcInN0cm9rZVwiLCAvKm91dGVyQm9yZGVyQ29sb3VyKi8gY3R4WzEwXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghY3VycmVudCB8fCBkaXJ0eVswXSAmIC8qb3V0ZXJCb3JkZXJXaWR0aCovIDEyOCkge1xuXHRcdFx0XHRhdHRyKHJlY3QsIFwic3Ryb2tlLXdpZHRoXCIsIC8qb3V0ZXJCb3JkZXJXaWR0aCovIGN0eFs3XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghY3VycmVudCB8fCBkaXJ0eVswXSAmIC8qdmlld2JveF93aWR0aCovIDgzODg2MDgpIHtcblx0XHRcdFx0YXR0cihzdmcsIFwid2lkdGhcIiwgLyp2aWV3Ym94X3dpZHRoKi8gY3R4WzIzXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghY3VycmVudCB8fCBkaXJ0eVswXSAmIC8qdmlld2JveF9oZWlnaHQqLyAxNjc3NzIxNikge1xuXHRcdFx0XHRhdHRyKHN2ZywgXCJoZWlnaHRcIiwgLyp2aWV3Ym94X2hlaWdodCovIGN0eFsyNF0pO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0aShsb2NhbCkge1xuXHRcdFx0aWYgKGN1cnJlbnQpIHJldHVybjtcblx0XHRcdHRyYW5zaXRpb25faW4ocXVlc3Rpb25zLiQkLmZyYWdtZW50LCBsb2NhbCk7XG5cdFx0XHRjdXJyZW50ID0gdHJ1ZTtcblx0XHR9LFxuXHRcdG8obG9jYWwpIHtcblx0XHRcdHRyYW5zaXRpb25fb3V0KHF1ZXN0aW9ucy4kJC5mcmFnbWVudCwgbG9jYWwpO1xuXHRcdFx0Y3VycmVudCA9IGZhbHNlO1xuXHRcdH0sXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaChtYWluKTtcblx0XHRcdC8qaW5wdXRfYmluZGluZyovIGN0eFs0M10obnVsbCk7XG5cdFx0XHRkZXN0cm95X2VhY2goZWFjaF9ibG9ja3MsIGRldGFjaGluZyk7XG5cdFx0XHQvKmRpdl9iaW5kaW5nKi8gY3R4WzQ2XShudWxsKTtcblx0XHRcdGRlc3Ryb3lfY29tcG9uZW50KHF1ZXN0aW9ucyk7XG5cdFx0XHRtb3VudGVkID0gZmFsc2U7XG5cdFx0XHRydW5fYWxsKGRpc3Bvc2UpO1xuXHRcdH1cblx0fTtcbn1cblxuZnVuY3Rpb24gaW5zdGFuY2UkMigkJHNlbGYsICQkcHJvcHMsICQkaW52YWxpZGF0ZSkge1xuXHRsZXQgJGN1cnJlbnREaXJlY3Rpb247XG5cdGxldCAkcXVlc3Rpb25zRG93bjtcblx0bGV0ICRxdWVzdGlvbnNBY3Jvc3M7XG5cdGNvbXBvbmVudF9zdWJzY3JpYmUoJCRzZWxmLCBjdXJyZW50RGlyZWN0aW9uLCAkJHZhbHVlID0+ICQkaW52YWxpZGF0ZSg0OCwgJGN1cnJlbnREaXJlY3Rpb24gPSAkJHZhbHVlKSk7XG5cdGNvbXBvbmVudF9zdWJzY3JpYmUoJCRzZWxmLCBxdWVzdGlvbnNEb3duLCAkJHZhbHVlID0+ICQkaW52YWxpZGF0ZSg0OSwgJHF1ZXN0aW9uc0Rvd24gPSAkJHZhbHVlKSk7XG5cdGNvbXBvbmVudF9zdWJzY3JpYmUoJCRzZWxmLCBxdWVzdGlvbnNBY3Jvc3MsICQkdmFsdWUgPT4gJCRpbnZhbGlkYXRlKDUwLCAkcXVlc3Rpb25zQWNyb3NzID0gJCR2YWx1ZSkpO1xuXHRjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpO1xuXG5cdC8vIFByaXZhdGUgcHJvcGVydGllc1xuXHRsZXQgbnVtYmVyX2dyaWQgPSBbXTtcblxuXHRsZXQgbWFya2VkX3dvcmRfZ3JpZCA9IFtdO1xuXHRsZXQgZm9udFNpemU7XG5cdGxldCBudW1Gb250U2l6ZTtcblx0bGV0IGNlbGxXaWR0aDtcblx0bGV0IGNlbGxIZWlnaHQ7XG5cdGxldCB2aWV3Ym94X3dpZHRoO1xuXHRsZXQgdmlld2JveF9oZWlnaHQ7XG5cdGxldCB7IENvbnRhaW5lciB9ID0gJCRwcm9wcztcblx0bGV0IHsgSW5wdXQgfSA9ICQkcHJvcHM7XG5cdGxldCB7IGdyaWQgPSBbXSB9ID0gJCRwcm9wcztcblx0bGV0IHsgc2l6ZSA9IDEwIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBjdXJyZW50X3ggPSAwIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBjdXJyZW50X3kgPSAwIH0gPSAkJHByb3BzO1xuXHRsZXQgeyB0b3RhbFdpZHRoID0gNTAwIH0gPSAkJHByb3BzO1xuXHRsZXQgeyB0b3RhbEhlaWdodCA9IDUwMCB9ID0gJCRwcm9wcztcblx0bGV0IHsgb3V0ZXJCb3JkZXJXaWR0aCA9IDEuNSB9ID0gJCRwcm9wcztcblx0bGV0IHsgaW5uZXJCb3JkZXJXaWR0aCA9IDEgfSA9ICQkcHJvcHM7XG5cdGxldCB7IG1hcmdpbiA9IDMgfSA9ICQkcHJvcHM7XG5cdGxldCB7IG91dGVyQm9yZGVyQ29sb3VyID0gXCJibGFja1wiIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBpbm5lckJvcmRlckNvbG91ciA9IFwiYmxhY2tcIiB9ID0gJCRwcm9wcztcblx0bGV0IHsgZmlsbENvbG91ciA9IFwiYmxhY2tcIiB9ID0gJCRwcm9wcztcblx0bGV0IHsgYmFja2dyb3VuZENvbG91ciA9IFwid2hpdGVcIiB9ID0gJCRwcm9wcztcblx0Y29uc3QgZm9udFJhdGlvID0gMC43O1xuXHRjb25zdCBudW1SYXRpbyA9IDAuMzM7XG5cblx0ZnVuY3Rpb24gc2VsZWN0Q2VsbChlKSB7XG5cdFx0JCRpbnZhbGlkYXRlKDEsIGN1cnJlbnRfeCA9IGUuc3JjRWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNvbFwiKSk7XG5cdFx0JCRpbnZhbGlkYXRlKDIsIGN1cnJlbnRfeSA9IGUuc3JjRWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXJvd1wiKSk7XG5cdFx0ZHJhd01hcmtlZFdvcmRHcmlkKCk7XG5cdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdH1cblxuXHRmdW5jdGlvbiBpc1N0YXJ0T2ZBY3Jvc3MoeCwgeSkge1xuXHRcdGlmIChncmlkW3ldW3hdID09PSBcIiNcIikgcmV0dXJuIGZhbHNlO1xuXHRcdGlmICh4ID49IHNpemUpIHJldHVybiBmYWxzZTtcblx0XHRsZXQgd29yZCA9IGdldFdvcmQoeCwgeSwgXCJhY3Jvc3NcIik7XG5cdFx0aWYgKHdvcmQubGVuZ3RoIDw9IDEpIHJldHVybiBmYWxzZTtcblx0XHRyZXR1cm4geCA9PT0gMCB8fCBncmlkW3ldW3ggLSAxXSA9PSBcIiNcIjtcblx0fVxuXG5cdGZ1bmN0aW9uIGlzU3RhcnRPZkRvd24oeCwgeSkge1xuXHRcdGlmIChncmlkW3ldW3hdID09PSBcIiNcIikgcmV0dXJuIGZhbHNlO1xuXHRcdGlmICh5ID49IHNpemUpIHJldHVybiBmYWxzZTtcblx0XHRsZXQgd29yZCA9IGdldFdvcmQoeCwgeSwgXCJkb3duXCIpO1xuXHRcdGlmICh3b3JkLmxlbmd0aCA8PSAxKSByZXR1cm4gZmFsc2U7XG5cdFx0cmV0dXJuIHkgPT09IDAgfHwgZ3JpZFt5IC0gMV1beF0gPT0gXCIjXCI7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRRdWVzdGlvbihudW0sIHgsIHksIGRpcmVjdGlvbiwgcXVlc3Rpb24pIHtcblx0XHRjb25zdCBhbnN3ZXIgPSBnZXRXb3JkKHgsIHksIGRpcmVjdGlvbik7XG5cblx0XHRpZiAoZGlyZWN0aW9uID09PSBcImFjcm9zc1wiKSB7XG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8ICRxdWVzdGlvbnNBY3Jvc3MubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKCRxdWVzdGlvbnNBY3Jvc3NbaV0uYW5zd2VyID09PSBhbnN3ZXIgJiYgJHF1ZXN0aW9uc0Fjcm9zc1tpXS5kaXJlY3Rpb24gPT09IGRpcmVjdGlvbikge1xuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHQuLi4kcXVlc3Rpb25zQWNyb3NzW2ldLFxuXHRcdFx0XHRcdFx0YW5zd2VyLFxuXHRcdFx0XHRcdFx0bnVtLFxuXHRcdFx0XHRcdFx0eCxcblx0XHRcdFx0XHRcdHlcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCRxdWVzdGlvbnNBY3Jvc3NbaV0ubnVtID09PSBudW0gJiYgJHF1ZXN0aW9uc0Fjcm9zc1tpXS5kaXJlY3Rpb24gPT09IGRpcmVjdGlvbikge1xuXHRcdFx0XHRcdHJldHVybiB7IC4uLiRxdWVzdGlvbnNBY3Jvc3NbaV0sIGFuc3dlciwgeCwgeSB9O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdG51bSxcblx0XHRcdFx0eCxcblx0XHRcdFx0eSxcblx0XHRcdFx0cXVlc3Rpb24sXG5cdFx0XHRcdGFuc3dlcixcblx0XHRcdFx0ZWRpdGluZzogZmFsc2UsXG5cdFx0XHRcdGRpcmVjdGlvblxuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCAkcXVlc3Rpb25zRG93bi5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAoJHF1ZXN0aW9uc0Rvd25baV0uYW5zd2VyID09PSBhbnN3ZXIgJiYgJHF1ZXN0aW9uc0Rvd25baV0uZGlyZWN0aW9uID09PSBkaXJlY3Rpb24pIHtcblx0XHRcdFx0XHRyZXR1cm4geyAuLi4kcXVlc3Rpb25zRG93bltpXSwgYW5zd2VyLCBudW0sIHgsIHkgfTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICgkcXVlc3Rpb25zRG93bltpXS5udW0gPT09IG51bSAmJiAkcXVlc3Rpb25zRG93bltpXS5kaXJlY3Rpb24gPT09IGRpcmVjdGlvbikge1xuXHRcdFx0XHRcdHJldHVybiBzZXRfc3RvcmVfdmFsdWUocXVlc3Rpb25zRG93biwgJHF1ZXN0aW9uc0Rvd25baV0gPSB7IC4uLiRxdWVzdGlvbnNEb3duW2ldLCBhbnN3ZXIsIHgsIHkgfSwgJHF1ZXN0aW9uc0Rvd24pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBzZXRfc3RvcmVfdmFsdWUoXG5cdFx0XHRcdHF1ZXN0aW9uc0Rvd24sXG5cdFx0XHRcdCRxdWVzdGlvbnNEb3duID0ge1xuXHRcdFx0XHRcdG51bSxcblx0XHRcdFx0XHR4LFxuXHRcdFx0XHRcdHksXG5cdFx0XHRcdFx0cXVlc3Rpb24sXG5cdFx0XHRcdFx0YW5zd2VyLFxuXHRcdFx0XHRcdGVkaXRpbmc6IGZhbHNlLFxuXHRcdFx0XHRcdGRpcmVjdGlvblxuXHRcdFx0XHR9LFxuXHRcdFx0XHQkcXVlc3Rpb25zRG93blxuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRDdXJyZW50UXVlc3Rpb24oKSB7XG5cdFx0bGV0IHsgeCwgeSB9ID0gZ2V0Q3VycmVudFBvcygpO1xuXHRcdGxldCBzZWxlY3RlZF9xdWVzdGlvbjtcblxuXHRcdGxldCBxdWVzdGlvbnMgPSAkY3VycmVudERpcmVjdGlvbiA9PT0gXCJhY3Jvc3NcIlxuXHRcdD8gJHF1ZXN0aW9uc0Fjcm9zc1xuXHRcdDogJHF1ZXN0aW9uc0Rvd247XG5cblx0XHRpZiAoIXF1ZXN0aW9ucy5sZW5ndGgpIHJldHVybjtcblxuXHRcdGlmICgkY3VycmVudERpcmVjdGlvbiA9PT0gXCJhY3Jvc3NcIikge1xuXHRcdFx0c2VsZWN0ZWRfcXVlc3Rpb24gPSBxdWVzdGlvbnMuZmluZChxID0+IHkgPT09IHEueSAmJiB4ID49IHEueCAmJiB4IDw9IHEueCArIHEuYW5zd2VyLmxlbmd0aCAtIDEpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZWxlY3RlZF9xdWVzdGlvbiA9IHF1ZXN0aW9ucy5maW5kKHEgPT4geCA9PT0gcS54ICYmIHkgPj0gcS55ICYmIHkgPD0gcS55ICsgcS5hbnN3ZXIubGVuZ3RoIC0gMSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHNlbGVjdGVkX3F1ZXN0aW9uO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0U3RhcnRPZldvcmQoeCwgeSwgZGlyZWN0aW9uKSB7XG5cdFx0aWYgKGRpcmVjdGlvbiA9PT0gXCJhY3Jvc3NcIikge1xuXHRcdFx0d2hpbGUgKHggPiAwICYmIGdyaWRbeV1beCAtIDFdICE9PSBcIiNcIikge1xuXHRcdFx0XHR4LS07XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHdoaWxlICh5ID4gMCAmJiBncmlkW3kgLSAxXVt4XSAhPT0gXCIjXCIpIHtcblx0XHRcdFx0eS0tO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB7IHgsIHkgfTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldEVuZE9mV29yZCh4LCB5LCBkaXJlY3Rpb24pIHtcblx0XHRpZiAoZGlyZWN0aW9uID09PSBcImFjcm9zc1wiKSB7XG5cdFx0XHR3aGlsZSAoeCA8IHNpemUgLSAxICYmIGdyaWRbeV1beCArIDFdICE9PSBcIiNcIikge1xuXHRcdFx0XHR4Kys7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHdoaWxlICh5IDwgc2l6ZSAtIDEgJiYgZ3JpZFt5ICsgMV1beF0gIT09IFwiI1wiKSB7XG5cdFx0XHRcdHkrKztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4geyB4LCB5IH07XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRXb3JkKHgsIHksIGRpcmVjdGlvbikge1xuXHRcdGxldCBzdGFydCA9IGdldFN0YXJ0T2ZXb3JkKHgsIHksIGRpcmVjdGlvbik7XG5cdFx0bGV0IGVuZCA9IGdldEVuZE9mV29yZCh4LCB5LCBkaXJlY3Rpb24pO1xuXHRcdGxldCB3b3JkID0gXCJcIjtcblxuXHRcdGlmIChkaXJlY3Rpb24gPT09IFwiYWNyb3NzXCIpIHtcblx0XHRcdGZvciAobGV0IGkgPSBzdGFydC54OyBpIDw9IGVuZC54OyBpKyspIHtcblx0XHRcdFx0d29yZCArPSBncmlkW3ldW2ldIHx8IFwiIFwiO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKGxldCBpID0gc3RhcnQueTsgaSA8PSBlbmQueTsgaSsrKSB7XG5cdFx0XHRcdHdvcmQgKz0gZ3JpZFtpXVt4XSB8fCBcIiBcIjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gd29yZDtcblx0fVxuXG5cdGZ1bmN0aW9uIGRyYXdNYXJrZWRXb3JkR3JpZCgpIHtcblx0XHQkJGludmFsaWRhdGUoMTksIG1hcmtlZF93b3JkX2dyaWQgPSBBcnJheShzaXplKS5maWxsKGZhbHNlKS5tYXAoKCkgPT4gQXJyYXkoc2l6ZSkuZmlsbChmYWxzZSkpKTtcblxuXHRcdGlmICgkY3VycmVudERpcmVjdGlvbiA9PT0gXCJhY3Jvc3NcIikge1xuXHRcdFx0Zm9yIChsZXQgeCA9IGN1cnJlbnRfeDsgeCA8IHNpemU7IHgrKykge1xuXHRcdFx0XHRpZiAoIWdyaWRbY3VycmVudF95XSkgYnJlYWs7XG5cblx0XHRcdFx0aWYgKGdyaWRbY3VycmVudF95XVt4XSA9PT0gXCIjXCIpIHtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgxOSwgbWFya2VkX3dvcmRfZ3JpZFtjdXJyZW50X3ldW3hdID0gdHJ1ZSwgbWFya2VkX3dvcmRfZ3JpZCk7XG5cdFx0XHR9XG5cblx0XHRcdGZvciAobGV0IHggPSBjdXJyZW50X3g7IHggPj0gMDsgeC0tKSB7XG5cdFx0XHRcdGlmICghZ3JpZFtjdXJyZW50X3ldKSBicmVhaztcblxuXHRcdFx0XHRpZiAoZ3JpZFtjdXJyZW50X3ldW3hdID09PSBcIiNcIikge1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0JCRpbnZhbGlkYXRlKDE5LCBtYXJrZWRfd29yZF9ncmlkW2N1cnJlbnRfeV1beF0gPSB0cnVlLCBtYXJrZWRfd29yZF9ncmlkKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gZG93blxuXHRcdFx0Zm9yIChsZXQgeSA9IGN1cnJlbnRfeTsgeSA8IHNpemU7IHkrKykge1xuXHRcdFx0XHRpZiAoIWdyaWRbeV0pIGJyZWFrO1xuXG5cdFx0XHRcdGlmIChncmlkW3ldW2N1cnJlbnRfeF0gPT09IFwiI1wiKSB7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQkJGludmFsaWRhdGUoMTksIG1hcmtlZF93b3JkX2dyaWRbeV1bY3VycmVudF94XSA9IHRydWUsIG1hcmtlZF93b3JkX2dyaWQpO1xuXHRcdFx0fVxuXG5cdFx0XHRmb3IgKGxldCB5ID0gY3VycmVudF95OyB5ID49IDA7IHktLSkge1xuXHRcdFx0XHRpZiAoIWdyaWRbeV0pIGJyZWFrO1xuXG5cdFx0XHRcdGlmIChncmlkW3ldW2N1cnJlbnRfeF0gPT09IFwiI1wiKSB7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQkJGludmFsaWRhdGUoMTksIG1hcmtlZF93b3JkX2dyaWRbeV1bY3VycmVudF94XSA9IHRydWUsIG1hcmtlZF93b3JkX2dyaWQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIG1vdmVVcCgpIHtcblx0XHRpZiAoY3VycmVudF95ID4gMCkge1xuXHRcdFx0JCRpbnZhbGlkYXRlKDIsIGN1cnJlbnRfeS0tLCBjdXJyZW50X3kpO1xuXHRcdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdFx0XHRkcmF3TWFya2VkV29yZEdyaWQoKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBtb3ZlRG93bigpIHtcblx0XHRpZiAoY3VycmVudF95IDwgc2l6ZSAtIDEpIHtcblx0XHRcdCQkaW52YWxpZGF0ZSgyLCBjdXJyZW50X3krKywgY3VycmVudF95KTtcblx0XHRcdGRpc3BhdGNoKFwiY2hhbmdlXCIpO1xuXHRcdFx0ZHJhd01hcmtlZFdvcmRHcmlkKCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gbW92ZUxlZnQoKSB7XG5cdFx0aWYgKGN1cnJlbnRfeCA+IDApIHtcblx0XHRcdCQkaW52YWxpZGF0ZSgxLCBjdXJyZW50X3gtLSwgY3VycmVudF94KTtcblx0XHRcdGRpc3BhdGNoKFwiY2hhbmdlXCIpO1xuXHRcdFx0ZHJhd01hcmtlZFdvcmRHcmlkKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmIChjdXJyZW50X3kgPiAwKSB7XG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgyLCBjdXJyZW50X3ktLSwgY3VycmVudF95KTtcblx0XHRcdFx0JCRpbnZhbGlkYXRlKDEsIGN1cnJlbnRfeCA9IHNpemUgLSAxKTtcblx0XHRcdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdFx0XHRcdGRyYXdNYXJrZWRXb3JkR3JpZCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIG1vdmVSaWdodCgpIHtcblx0XHRpZiAoY3VycmVudF94IDwgc2l6ZSAtIDEpIHtcblx0XHRcdCQkaW52YWxpZGF0ZSgxLCBjdXJyZW50X3grKywgY3VycmVudF94KTtcblx0XHRcdGRpc3BhdGNoKFwiY2hhbmdlXCIpO1xuXHRcdFx0ZHJhd01hcmtlZFdvcmRHcmlkKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmIChjdXJyZW50X3kgPCBzaXplIC0gMSkge1xuXHRcdFx0XHQkJGludmFsaWRhdGUoMiwgY3VycmVudF95KyssIGN1cnJlbnRfeSk7XG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgxLCBjdXJyZW50X3ggPSAwKTtcblx0XHRcdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdFx0XHRcdGRyYXdNYXJrZWRXb3JkR3JpZCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIG1vdmVTdGFydE9mUm93KCkge1xuXHRcdCQkaW52YWxpZGF0ZSgxLCBjdXJyZW50X3ggPSAwKTtcblx0XHRkaXNwYXRjaChcImNoYW5nZVwiKTtcblx0XHRkcmF3TWFya2VkV29yZEdyaWQoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIG1vdmVFbmRPZlJvdygpIHtcblx0XHQkJGludmFsaWRhdGUoMSwgY3VycmVudF94ID0gc2l6ZSAtIDEpO1xuXHRcdGRpc3BhdGNoKFwiY2hhbmdlXCIpO1xuXHRcdGRyYXdNYXJrZWRXb3JkR3JpZCgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gbW92ZVN0YXJ0T2ZDb2woKSB7XG5cdFx0JCRpbnZhbGlkYXRlKDIsIGN1cnJlbnRfeSA9IDApO1xuXHRcdGRpc3BhdGNoKFwiY2hhbmdlXCIpO1xuXHRcdGRyYXdNYXJrZWRXb3JkR3JpZCgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gbW92ZUVuZE9mQ29sKCkge1xuXHRcdCQkaW52YWxpZGF0ZSgyLCBjdXJyZW50X3kgPSBzaXplIC0gMSk7XG5cdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdFx0ZHJhd01hcmtlZFdvcmRHcmlkKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVNb3ZlKGRpcikge1xuXHRcdGlmIChkaXIgPT09IFwidXBcIikge1xuXHRcdFx0bW92ZVVwKCk7XG5cdFx0fVxuXG5cdFx0aWYgKGRpciA9PT0gXCJkb3duXCIpIHtcblx0XHRcdG1vdmVEb3duKCk7XG5cdFx0fVxuXG5cdFx0aWYgKGRpciA9PT0gXCJsZWZ0XCIpIHtcblx0XHRcdG1vdmVMZWZ0KCk7XG5cdFx0fVxuXG5cdFx0aWYgKGRpciA9PT0gXCJyaWdodFwiKSB7XG5cdFx0XHRtb3ZlUmlnaHQoKTtcblx0XHR9XG5cblx0XHRpZiAoZGlyID09PSBcImJhY2tzYXBjZVwiKSB7XG5cdFx0XHRiYWNrc3BhY2UoKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiB0b2dnbGVEaXIoKSB7XG5cdFx0aWYgKCRjdXJyZW50RGlyZWN0aW9uID09PSBcImFjcm9zc1wiKSB7XG5cdFx0XHRjdXJyZW50RGlyZWN0aW9uLnNldChcImRvd25cIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGN1cnJlbnREaXJlY3Rpb24uc2V0KFwiYWNyb3NzXCIpO1xuXHRcdH1cblxuXHRcdGRpc3BhdGNoKFwiY2hhbmdlXCIpO1xuXHRcdGRyYXdNYXJrZWRXb3JkR3JpZCgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gc2V0RGlyKGRpcmVjdGlvbikge1xuXHRcdGlmIChkaXJlY3Rpb24gPT09IFwiYWNyb3NzXCIpIHtcblx0XHRcdGN1cnJlbnREaXJlY3Rpb24uc2V0KFwiYWNyb3NzXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjdXJyZW50RGlyZWN0aW9uLnNldChcImRvd25cIik7XG5cdFx0fVxuXG5cdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdFx0ZHJhd01hcmtlZFdvcmRHcmlkKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRDdXJyZW50UG9zKCkge1xuXHRcdHJldHVybiB7IHg6IGN1cnJlbnRfeCwgeTogY3VycmVudF95IH07XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRDdXJyZW50UG9zKHgsIHkpIHtcblx0XHQkJGludmFsaWRhdGUoMSwgY3VycmVudF94ID0geCk7XG5cdFx0JCRpbnZhbGlkYXRlKDIsIGN1cnJlbnRfeSA9IHkpO1xuXHRcdGRpc3BhdGNoKFwiY2hhbmdlXCIpO1xuXHRcdGRyYXdNYXJrZWRXb3JkR3JpZCgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlRG91YmxlY2xpY2soeCwgeSkge1xuXHRcdHRvZ2dsZURpcigpO1xuXHR9IC8vIGxldCBzZWxlY3RlZF9xdWVzdGlvbjtcblx0Ly8gbGV0IHF1ZXN0aW9ucyA9ICRjdXJyZW50RGlyZWN0aW9uID09PSBcImFjcm9zc1wiID8gJHF1ZXN0aW9uc0Fjcm9zcyA6ICRxdWVzdGlvbnNEb3duO1xuXG5cdGZ1bmN0aW9uIGhhbmRsZUtleWRvd24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRjb25zdCBrZXljb2RlID0gZS5rZXlDb2RlO1xuXHRcdGlmIChlLm1ldGFLZXkpIHJldHVybjtcblxuXHRcdGlmIChrZXljb2RlID4gNjQgJiYga2V5Y29kZSA8IDkxKSB7XG5cdFx0XHRkaXNwYXRjaChcImxldHRlclwiLCBlLmtleS50b1VwcGVyQ2FzZSgpKTtcblx0XHR9IGVsc2UgaWYgKGtleWNvZGUgPT09IDUxKSB7XG5cdFx0XHQvLyAjXG5cdFx0XHRkaXNwYXRjaChcImxldHRlclwiLCBcIiNcIik7XG5cdFx0fSBlbHNlIGlmIChrZXljb2RlID09PSA4KSB7XG5cdFx0XHQvLyBCYWNrc3BhY2Vcblx0XHRcdGRpc3BhdGNoKFwiYmFja3NwYWNlXCIpO1xuXHRcdH0gZWxzZSBpZiAoa2V5Y29kZSA9PSAzMikge1xuXHRcdFx0Ly8gU3BhY2Vcblx0XHRcdGRpc3BhdGNoKFwibGV0dGVyXCIsIFwiIFwiKTtcblx0XHR9IGVsc2UgaWYgKGtleWNvZGUgPT09IDkpIHtcblx0XHRcdC8vIEVudGVyXG5cdFx0XHRpZiAoZS5zaGlmdEtleSkge1xuXHRcdFx0XHRkaXNwYXRjaChcIm1vdmVcIiwgXCJwcmV2LXdvcmRcIik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRkaXNwYXRjaChcIm1vdmVcIiwgXCJuZXh0LXdvcmRcIik7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChrZXljb2RlID09PSAxMykge1xuXHRcdFx0Ly8gRW50ZXJcblx0XHRcdGRpc3BhdGNoKFwiZW50ZXJcIik7XG5cdFx0fSBlbHNlIGlmIChrZXljb2RlID09PSAzNykge1xuXHRcdFx0ZGlzcGF0Y2goXCJtb3ZlXCIsIFwibGVmdFwiKTtcblx0XHR9IGVsc2UgaWYgKGtleWNvZGUgPT09IDM4KSB7XG5cdFx0XHRkaXNwYXRjaChcIm1vdmVcIiwgXCJ1cFwiKTtcblx0XHR9IGVsc2UgaWYgKGtleWNvZGUgPT09IDM5KSB7XG5cdFx0XHRkaXNwYXRjaChcIm1vdmVcIiwgXCJyaWdodFwiKTtcblx0XHR9IGVsc2UgaWYgKGtleWNvZGUgPT09IDQwKSB7XG5cdFx0XHRkaXNwYXRjaChcIm1vdmVcIiwgXCJkb3duXCIpO1xuXHRcdH1cblxuXHRcdGhhbmRsZUZvY3VzKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVGb2N1cyhlKSB7XG5cdFx0SW5wdXQuZm9jdXMoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZVVwZGF0ZVF1ZXN0aW9uKGUpIHtcblx0XHRjb25zdCB7IHF1ZXN0aW9uLCBzdWdnZXN0aW9uIH0gPSBlLmRldGFpbDtcblxuXHRcdGlmIChxdWVzdGlvbi5kaXJlY3Rpb24gPT09IFwiYWNyb3NzXCIpIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgc3VnZ2VzdGlvbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHQkJGludmFsaWRhdGUoMCwgZ3JpZFtxdWVzdGlvbi55XVtpICsgcXVlc3Rpb24ueF0gPSBzdWdnZXN0aW9uW2ldLCBncmlkKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzdWdnZXN0aW9uLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgwLCBncmlkW2kgKyBxdWVzdGlvbi55XVtxdWVzdGlvbi54XSA9IHN1Z2dlc3Rpb25baV0sIGdyaWQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGlucHV0X2JpbmRpbmcoJCR2YWx1ZSkge1xuXHRcdGJpbmRpbmdfY2FsbGJhY2tzWyQkdmFsdWUgPyAndW5zaGlmdCcgOiAncHVzaCddKCgpID0+IHtcblx0XHRcdElucHV0ID0gJCR2YWx1ZTtcblx0XHRcdCQkaW52YWxpZGF0ZSg0LCBJbnB1dCk7XG5cdFx0fSk7XG5cdH1cblxuXHRjb25zdCBjbGlja19oYW5kbGVyID0gKHgsIHkpID0+IHtcblx0XHRzZXRDdXJyZW50UG9zKHgsIHkpO1xuXHR9O1xuXG5cdGNvbnN0IGRibGNsaWNrX2hhbmRsZXIgPSAoeCwgeSkgPT4ge1xuXHRcdGhhbmRsZURvdWJsZWNsaWNrKCk7XG5cdH07XG5cblx0ZnVuY3Rpb24gZGl2X2JpbmRpbmcoJCR2YWx1ZSkge1xuXHRcdGJpbmRpbmdfY2FsbGJhY2tzWyQkdmFsdWUgPyAndW5zaGlmdCcgOiAncHVzaCddKCgpID0+IHtcblx0XHRcdENvbnRhaW5lciA9ICQkdmFsdWU7XG5cdFx0XHQkJGludmFsaWRhdGUoMywgQ29udGFpbmVyKTtcblx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNoYW5nZV9oYW5kbGVyKGV2ZW50KSB7XG5cdFx0YnViYmxlLmNhbGwodGhpcywgJCRzZWxmLCBldmVudCk7XG5cdH1cblxuXHQkJHNlbGYuJCRzZXQgPSAkJHByb3BzID0+IHtcblx0XHRpZiAoJ0NvbnRhaW5lcicgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDMsIENvbnRhaW5lciA9ICQkcHJvcHMuQ29udGFpbmVyKTtcblx0XHRpZiAoJ0lucHV0JyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoNCwgSW5wdXQgPSAkJHByb3BzLklucHV0KTtcblx0XHRpZiAoJ2dyaWQnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSgwLCBncmlkID0gJCRwcm9wcy5ncmlkKTtcblx0XHRpZiAoJ3NpemUnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSgyOCwgc2l6ZSA9ICQkcHJvcHMuc2l6ZSk7XG5cdFx0aWYgKCdjdXJyZW50X3gnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSgxLCBjdXJyZW50X3ggPSAkJHByb3BzLmN1cnJlbnRfeCk7XG5cdFx0aWYgKCdjdXJyZW50X3knIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSgyLCBjdXJyZW50X3kgPSAkJHByb3BzLmN1cnJlbnRfeSk7XG5cdFx0aWYgKCd0b3RhbFdpZHRoJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoNSwgdG90YWxXaWR0aCA9ICQkcHJvcHMudG90YWxXaWR0aCk7XG5cdFx0aWYgKCd0b3RhbEhlaWdodCcgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDYsIHRvdGFsSGVpZ2h0ID0gJCRwcm9wcy50b3RhbEhlaWdodCk7XG5cdFx0aWYgKCdvdXRlckJvcmRlcldpZHRoJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoNywgb3V0ZXJCb3JkZXJXaWR0aCA9ICQkcHJvcHMub3V0ZXJCb3JkZXJXaWR0aCk7XG5cdFx0aWYgKCdpbm5lckJvcmRlcldpZHRoJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoOCwgaW5uZXJCb3JkZXJXaWR0aCA9ICQkcHJvcHMuaW5uZXJCb3JkZXJXaWR0aCk7XG5cdFx0aWYgKCdtYXJnaW4nIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSg5LCBtYXJnaW4gPSAkJHByb3BzLm1hcmdpbik7XG5cdFx0aWYgKCdvdXRlckJvcmRlckNvbG91cicgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDEwLCBvdXRlckJvcmRlckNvbG91ciA9ICQkcHJvcHMub3V0ZXJCb3JkZXJDb2xvdXIpO1xuXHRcdGlmICgnaW5uZXJCb3JkZXJDb2xvdXInIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSgxMSwgaW5uZXJCb3JkZXJDb2xvdXIgPSAkJHByb3BzLmlubmVyQm9yZGVyQ29sb3VyKTtcblx0XHRpZiAoJ2ZpbGxDb2xvdXInIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSgxMiwgZmlsbENvbG91ciA9ICQkcHJvcHMuZmlsbENvbG91cik7XG5cdFx0aWYgKCdiYWNrZ3JvdW5kQ29sb3VyJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoMTMsIGJhY2tncm91bmRDb2xvdXIgPSAkJHByb3BzLmJhY2tncm91bmRDb2xvdXIpO1xuXHR9O1xuXG5cdCQkc2VsZi4kJC51cGRhdGUgPSAoKSA9PiB7XG5cdFx0aWYgKCQkc2VsZi4kJC5kaXJ0eVswXSAmIC8qc2l6ZSwgdG90YWxXaWR0aCwgbWFyZ2luLCBvdXRlckJvcmRlcldpZHRoLCB0b3RhbEhlaWdodCwgY2VsbFdpZHRoLCBncmlkLCBudW1iZXJfZ3JpZCwgY3VycmVudF94LCBjdXJyZW50X3kqLyAyNjg4Mjk0MTUpIHtcblx0XHRcdHtcblx0XHRcdFx0aWYgKHNpemUgPCAyKSB7XG5cdFx0XHRcdFx0JCRpbnZhbGlkYXRlKDI4LCBzaXplID0gMik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoc2l6ZSA+IDMwKSB7XG5cdFx0XHRcdFx0JCRpbnZhbGlkYXRlKDI4LCBzaXplID0gMzApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0JCRpbnZhbGlkYXRlKDIzLCB2aWV3Ym94X3dpZHRoID0gdG90YWxXaWR0aCArIG1hcmdpbiArIG91dGVyQm9yZGVyV2lkdGgpO1xuXHRcdFx0XHQkJGludmFsaWRhdGUoMjQsIHZpZXdib3hfaGVpZ2h0ID0gdG90YWxIZWlnaHQgKyBtYXJnaW4gKyBvdXRlckJvcmRlcldpZHRoKTtcblx0XHRcdFx0JCRpbnZhbGlkYXRlKDE4LCBjZWxsV2lkdGggPSB0b3RhbFdpZHRoIC8gc2l6ZSk7XG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgyMiwgY2VsbEhlaWdodCA9IHRvdGFsSGVpZ2h0IC8gc2l6ZSk7XG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgyMCwgZm9udFNpemUgPSBjZWxsV2lkdGggKiBmb250UmF0aW8pO1xuXHRcdFx0XHQkJGludmFsaWRhdGUoMjEsIG51bUZvbnRTaXplID0gY2VsbFdpZHRoICogbnVtUmF0aW8pO1xuXHRcdFx0XHRsZXQgcXVlc3Rpb25zX2Fjcm9zcyA9IFtdO1xuXHRcdFx0XHRsZXQgcXVlc3Rpb25zX2Rvd24gPSBbXTtcblx0XHRcdFx0bGV0IG51bSA9IDE7XG5cblx0XHRcdFx0Ly8gR3JvdyBncmlkIGlmIG5lY2Vzc2FyeVxuXHRcdFx0XHRpZiAoZ3JpZC5sZW5ndGggLSAxIDwgc2l6ZSkge1xuXHRcdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG5cdFx0XHRcdFx0XHQkJGludmFsaWRhdGUoMCwgZ3JpZFtpXSA9IGdyaWRbaV0gfHwgQXJyYXkoc2l6ZSkubWFwKCgpID0+IFwiIFwiKSwgZ3JpZCk7XG5cdFx0XHRcdFx0XHQkJGludmFsaWRhdGUoMTcsIG51bWJlcl9ncmlkW2ldID0gbnVtYmVyX2dyaWRbaV0gfHwgQXJyYXkoc2l6ZSkubWFwKCgpID0+IFwiIFwiKSwgbnVtYmVyX2dyaWQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFNocmluayBncmlkIGlmIG5lY2Vzc2FyeVxuXHRcdFx0XHR3aGlsZSAoZ3JpZC5sZW5ndGggPiBzaXplKSB7XG5cdFx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBncmlkLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHR3aGlsZSAoZ3JpZFtpXS5sZW5ndGggPiBzaXplKSB7XG5cdFx0XHRcdFx0XHRcdGdyaWRbaV0ucG9wKCk7XG5cdFx0XHRcdFx0XHRcdG51bWJlcl9ncmlkW2ldLnBvcCgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGdyaWQucG9wKCk7XG5cdFx0XHRcdFx0bnVtYmVyX2dyaWQucG9wKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBNYWtlIHN1cmUgd2UncmUgc3RpbGwgaW4gdGhlIGdyaWRcblx0XHRcdFx0aWYgKGN1cnJlbnRfeCA+PSBzaXplKSB7XG5cdFx0XHRcdFx0JCRpbnZhbGlkYXRlKDEsIGN1cnJlbnRfeCA9IHNpemUgLSAxKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChjdXJyZW50X3kgPj0gc2l6ZSkge1xuXHRcdFx0XHRcdCQkaW52YWxpZGF0ZSgyLCBjdXJyZW50X3kgPSBzaXplIC0gMSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmb3IgKGxldCB5ID0gMDsgeSA8IHNpemU7IHkrKykge1xuXHRcdFx0XHRcdGlmICghbnVtYmVyX2dyaWRbeV0pIHtcblx0XHRcdFx0XHRcdCQkaW52YWxpZGF0ZSgxNywgbnVtYmVyX2dyaWRbeV0gPSBBcnJheShzaXplKSwgbnVtYmVyX2dyaWQpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGZvciAobGV0IHggPSAwOyB4IDwgc2l6ZTsgeCsrKSB7XG5cdFx0XHRcdFx0XHQkJGludmFsaWRhdGUoMCwgZ3JpZFt5XVt4XSA9IGdyaWRbeV1beF0gfHwgXCIgXCIsIGdyaWQpO1xuXHRcdFx0XHRcdFx0aWYgKGdyaWRbeV1beF0gPT09IFwiI1wiKSBjb250aW51ZTtcblx0XHRcdFx0XHRcdGxldCBmb3VuZCA9IGZhbHNlO1xuXG5cdFx0XHRcdFx0XHRpZiAoaXNTdGFydE9mQWNyb3NzKHgsIHkpKSB7XG5cdFx0XHRcdFx0XHRcdHF1ZXN0aW9uc19hY3Jvc3MucHVzaChnZXRRdWVzdGlvbihudW0sIHgsIHksIFwiYWNyb3NzXCIsIFwiXCIpKTtcblx0XHRcdFx0XHRcdFx0Zm91bmQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAoaXNTdGFydE9mRG93bih4LCB5KSkge1xuXHRcdFx0XHRcdFx0XHRxdWVzdGlvbnNfZG93bi5wdXNoKGdldFF1ZXN0aW9uKG51bSwgeCwgeSwgXCJkb3duXCIsIFwiXCIpKTtcblx0XHRcdFx0XHRcdFx0Zm91bmQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAoIWZvdW5kKSB7XG5cdFx0XHRcdFx0XHRcdCQkaW52YWxpZGF0ZSgxNywgbnVtYmVyX2dyaWRbeV1beF0gPSBudWxsLCBudW1iZXJfZ3JpZCk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHQkJGludmFsaWRhdGUoMTcsIG51bWJlcl9ncmlkW3ldW3hdID0gbnVtKyssIG51bWJlcl9ncmlkKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBxdWVzdGlvbnNfYWNyb3NzLnNvcnQoKTtcblx0XHRcdFx0Ly8gcXVlc3Rpb25zX2Rvd24uc29ydCgpO1xuXHRcdFx0XHRxdWVzdGlvbnNBY3Jvc3Muc2V0KHF1ZXN0aW9uc19hY3Jvc3MpO1xuXG5cdFx0XHRcdHF1ZXN0aW9uc0Rvd24uc2V0KHF1ZXN0aW9uc19kb3duKTtcblxuXHRcdFx0XHQvLyBGaW5kIHRoZSBjdXJyZW50IHF1ZXN0aW9uXG5cdFx0XHRcdGNvbnN0IGN1cnJlbnRfcXVlc3Rpb24gPSBnZXRDdXJyZW50UXVlc3Rpb24oKTtcblxuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyhjdXJyZW50X3F1ZXN0aW9uKTtcblx0XHRcdFx0Y3VycmVudFF1ZXN0aW9uLnNldChjdXJyZW50X3F1ZXN0aW9uKTtcblxuXHRcdFx0XHRkcmF3TWFya2VkV29yZEdyaWQoKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIFtcblx0XHRncmlkLFxuXHRcdGN1cnJlbnRfeCxcblx0XHRjdXJyZW50X3ksXG5cdFx0Q29udGFpbmVyLFxuXHRcdElucHV0LFxuXHRcdHRvdGFsV2lkdGgsXG5cdFx0dG90YWxIZWlnaHQsXG5cdFx0b3V0ZXJCb3JkZXJXaWR0aCxcblx0XHRpbm5lckJvcmRlcldpZHRoLFxuXHRcdG1hcmdpbixcblx0XHRvdXRlckJvcmRlckNvbG91cixcblx0XHRpbm5lckJvcmRlckNvbG91cixcblx0XHRmaWxsQ29sb3VyLFxuXHRcdGJhY2tncm91bmRDb2xvdXIsXG5cdFx0aGFuZGxlTW92ZSxcblx0XHRzZXRDdXJyZW50UG9zLFxuXHRcdGhhbmRsZUtleWRvd24sXG5cdFx0bnVtYmVyX2dyaWQsXG5cdFx0Y2VsbFdpZHRoLFxuXHRcdG1hcmtlZF93b3JkX2dyaWQsXG5cdFx0Zm9udFNpemUsXG5cdFx0bnVtRm9udFNpemUsXG5cdFx0Y2VsbEhlaWdodCxcblx0XHR2aWV3Ym94X3dpZHRoLFxuXHRcdHZpZXdib3hfaGVpZ2h0LFxuXHRcdGhhbmRsZURvdWJsZWNsaWNrLFxuXHRcdGhhbmRsZUZvY3VzLFxuXHRcdGhhbmRsZVVwZGF0ZVF1ZXN0aW9uLFxuXHRcdHNpemUsXG5cdFx0Zm9udFJhdGlvLFxuXHRcdG51bVJhdGlvLFxuXHRcdHNlbGVjdENlbGwsXG5cdFx0bW92ZVVwLFxuXHRcdG1vdmVEb3duLFxuXHRcdG1vdmVMZWZ0LFxuXHRcdG1vdmVSaWdodCxcblx0XHRtb3ZlU3RhcnRPZlJvdyxcblx0XHRtb3ZlRW5kT2ZSb3csXG5cdFx0bW92ZVN0YXJ0T2ZDb2wsXG5cdFx0bW92ZUVuZE9mQ29sLFxuXHRcdHRvZ2dsZURpcixcblx0XHRzZXREaXIsXG5cdFx0Z2V0Q3VycmVudFBvcyxcblx0XHRpbnB1dF9iaW5kaW5nLFxuXHRcdGNsaWNrX2hhbmRsZXIsXG5cdFx0ZGJsY2xpY2tfaGFuZGxlcixcblx0XHRkaXZfYmluZGluZyxcblx0XHRjaGFuZ2VfaGFuZGxlclxuXHRdO1xufVxuXG5jbGFzcyBHcmlkIGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50IHtcblx0Y29uc3RydWN0b3Iob3B0aW9ucykge1xuXHRcdHN1cGVyKCk7XG5cblx0XHRpbml0KFxuXHRcdFx0dGhpcyxcblx0XHRcdG9wdGlvbnMsXG5cdFx0XHRpbnN0YW5jZSQyLFxuXHRcdFx0Y3JlYXRlX2ZyYWdtZW50JDIsXG5cdFx0XHRzYWZlX25vdF9lcXVhbCxcblx0XHRcdHtcblx0XHRcdFx0Q29udGFpbmVyOiAzLFxuXHRcdFx0XHRJbnB1dDogNCxcblx0XHRcdFx0Z3JpZDogMCxcblx0XHRcdFx0c2l6ZTogMjgsXG5cdFx0XHRcdGN1cnJlbnRfeDogMSxcblx0XHRcdFx0Y3VycmVudF95OiAyLFxuXHRcdFx0XHR0b3RhbFdpZHRoOiA1LFxuXHRcdFx0XHR0b3RhbEhlaWdodDogNixcblx0XHRcdFx0b3V0ZXJCb3JkZXJXaWR0aDogNyxcblx0XHRcdFx0aW5uZXJCb3JkZXJXaWR0aDogOCxcblx0XHRcdFx0bWFyZ2luOiA5LFxuXHRcdFx0XHRvdXRlckJvcmRlckNvbG91cjogMTAsXG5cdFx0XHRcdGlubmVyQm9yZGVyQ29sb3VyOiAxMSxcblx0XHRcdFx0ZmlsbENvbG91cjogMTIsXG5cdFx0XHRcdGJhY2tncm91bmRDb2xvdXI6IDEzLFxuXHRcdFx0XHRmb250UmF0aW86IDI5LFxuXHRcdFx0XHRudW1SYXRpbzogMzAsXG5cdFx0XHRcdHNlbGVjdENlbGw6IDMxLFxuXHRcdFx0XHRtb3ZlVXA6IDMyLFxuXHRcdFx0XHRtb3ZlRG93bjogMzMsXG5cdFx0XHRcdG1vdmVMZWZ0OiAzNCxcblx0XHRcdFx0bW92ZVJpZ2h0OiAzNSxcblx0XHRcdFx0bW92ZVN0YXJ0T2ZSb3c6IDM2LFxuXHRcdFx0XHRtb3ZlRW5kT2ZSb3c6IDM3LFxuXHRcdFx0XHRtb3ZlU3RhcnRPZkNvbDogMzgsXG5cdFx0XHRcdG1vdmVFbmRPZkNvbDogMzksXG5cdFx0XHRcdGhhbmRsZU1vdmU6IDE0LFxuXHRcdFx0XHR0b2dnbGVEaXI6IDQwLFxuXHRcdFx0XHRzZXREaXI6IDQxLFxuXHRcdFx0XHRnZXRDdXJyZW50UG9zOiA0Mixcblx0XHRcdFx0c2V0Q3VycmVudFBvczogMTUsXG5cdFx0XHRcdGhhbmRsZUtleWRvd246IDE2XG5cdFx0XHR9LFxuXHRcdFx0bnVsbCxcblx0XHRcdFstMSwgLTEsIC0xXVxuXHRcdCk7XG5cdH1cblxuXHRnZXQgZm9udFJhdGlvKCkge1xuXHRcdHJldHVybiB0aGlzLiQkLmN0eFsyOV07XG5cdH1cblxuXHRnZXQgbnVtUmF0aW8oKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzMwXTtcblx0fVxuXG5cdGdldCBzZWxlY3RDZWxsKCkge1xuXHRcdHJldHVybiB0aGlzLiQkLmN0eFszMV07XG5cdH1cblxuXHRnZXQgbW92ZVVwKCkge1xuXHRcdHJldHVybiB0aGlzLiQkLmN0eFszMl07XG5cdH1cblxuXHRnZXQgbW92ZURvd24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzMzXTtcblx0fVxuXG5cdGdldCBtb3ZlTGVmdCgpIHtcblx0XHRyZXR1cm4gdGhpcy4kJC5jdHhbMzRdO1xuXHR9XG5cblx0Z2V0IG1vdmVSaWdodCgpIHtcblx0XHRyZXR1cm4gdGhpcy4kJC5jdHhbMzVdO1xuXHR9XG5cblx0Z2V0IG1vdmVTdGFydE9mUm93KCkge1xuXHRcdHJldHVybiB0aGlzLiQkLmN0eFszNl07XG5cdH1cblxuXHRnZXQgbW92ZUVuZE9mUm93KCkge1xuXHRcdHJldHVybiB0aGlzLiQkLmN0eFszN107XG5cdH1cblxuXHRnZXQgbW92ZVN0YXJ0T2ZDb2woKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzM4XTtcblx0fVxuXG5cdGdldCBtb3ZlRW5kT2ZDb2woKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzM5XTtcblx0fVxuXG5cdGdldCBoYW5kbGVNb3ZlKCkge1xuXHRcdHJldHVybiB0aGlzLiQkLmN0eFsxNF07XG5cdH1cblxuXHRnZXQgdG9nZ2xlRGlyKCkge1xuXHRcdHJldHVybiB0aGlzLiQkLmN0eFs0MF07XG5cdH1cblxuXHRnZXQgc2V0RGlyKCkge1xuXHRcdHJldHVybiB0aGlzLiQkLmN0eFs0MV07XG5cdH1cblxuXHRnZXQgZ2V0Q3VycmVudFBvcygpIHtcblx0XHRyZXR1cm4gdGhpcy4kJC5jdHhbNDJdO1xuXHR9XG5cblx0Z2V0IHNldEN1cnJlbnRQb3MoKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzE1XTtcblx0fVxuXG5cdGdldCBoYW5kbGVLZXlkb3duKCkge1xuXHRcdHJldHVybiB0aGlzLiQkLmN0eFsxNl07XG5cdH1cbn1cblxuLyogc3JjL0luc3RydWN0aW9ucy5zdmVsdGUgZ2VuZXJhdGVkIGJ5IFN2ZWx0ZSB2My40Ni40ICovXG5cbmZ1bmN0aW9uIGNyZWF0ZV9mcmFnbWVudCQxKGN0eCkge1xuXHRsZXQgbWFpbjtcblx0bGV0IGRpdjtcblx0bGV0IHQxO1xuXHRsZXQgaDI7XG5cdGxldCB0Mztcblx0bGV0IHAwO1xuXHRsZXQgdDU7XG5cdGxldCBwMTtcblx0bGV0IHQ3O1xuXHRsZXQgcDI7XG5cdGxldCB0OTtcblx0bGV0IHAzO1xuXHRsZXQgdDExO1xuXHRsZXQgcDQ7XG5cdGxldCB0MTM7XG5cdGxldCBwNTtcblx0bGV0IG1vdW50ZWQ7XG5cdGxldCBkaXNwb3NlO1xuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdG1haW4gPSBlbGVtZW50KFwibWFpblwiKTtcblx0XHRcdGRpdiA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRkaXYudGV4dENvbnRlbnQgPSBcIsOXXCI7XG5cdFx0XHR0MSA9IHNwYWNlKCk7XG5cdFx0XHRoMiA9IGVsZW1lbnQoXCJoMlwiKTtcblx0XHRcdGgyLnRleHRDb250ZW50ID0gXCJJbnN0cnVjdGlvbnNcIjtcblx0XHRcdHQzID0gc3BhY2UoKTtcblx0XHRcdHAwID0gZWxlbWVudChcInBcIik7XG5cdFx0XHRwMC50ZXh0Q29udGVudCA9IFwiVXNlIFxcXCIjXFxcIiB0byBjcmVhdGUgYSBibGFuayBzcXVhcmUuXCI7XG5cdFx0XHR0NSA9IHNwYWNlKCk7XG5cdFx0XHRwMSA9IGVsZW1lbnQoXCJwXCIpO1xuXHRcdFx0cDEudGV4dENvbnRlbnQgPSBcIkhpdCBFbnRlciBvciBkb3VibGUtY2xpY2sgdGhlIHF1ZXN0aW9uIG9uIHRoZSByaWdodCB0byBzZXQgYW4gYW5zd2VyLlwiO1xuXHRcdFx0dDcgPSBzcGFjZSgpO1xuXHRcdFx0cDIgPSBlbGVtZW50KFwicFwiKTtcblx0XHRcdHAyLnRleHRDb250ZW50ID0gXCJVc2UgU3BhY2UgdG8gY2hhbmdlIGRpcmVjdGlvbnMuXCI7XG5cdFx0XHR0OSA9IHNwYWNlKCk7XG5cdFx0XHRwMyA9IGVsZW1lbnQoXCJwXCIpO1xuXHRcdFx0cDMudGV4dENvbnRlbnQgPSBcIlVzZSBhcnJvdyBrZXlzIHRvIG5hdmlnYXRlLlwiO1xuXHRcdFx0dDExID0gc3BhY2UoKTtcblx0XHRcdHA0ID0gZWxlbWVudChcInBcIik7XG5cdFx0XHRwNC50ZXh0Q29udGVudCA9IFwiSGludDogQ29tcGxldGUgdGhlIHdvcmRzIGJlZm9yZSBzdGFydGluZyBvbiB0aGUgYW5zd2VycywgYmVjYXVzZSB5b3UgbWlnaHQgaGF2ZSB0byBjaGFuZ2Ugc29tZXRoaW5nIVwiO1xuXHRcdFx0dDEzID0gc3BhY2UoKTtcblx0XHRcdHA1ID0gZWxlbWVudChcInBcIik7XG5cdFx0XHRwNS5pbm5lckhUTUwgPSBgTm90ZTogVGhpcyBDcm9zc3dvcmQgQ3JlYXRvciBpcyBpbiBBbHBoYS4gPGEgaHJlZj1cImh0dHBzOi8vZ2l0aHViLmNvbS9qLW5vcndvb2QteW91bmcvanh3b3JkLWNyZWF0b3IvaXNzdWVzXCI+UGxlYXNlIHJlcG9ydCBidWdzIGhlcmU8L2E+LmA7XG5cdFx0XHRhdHRyKGRpdiwgXCJjbGFzc1wiLCBcImNsb3NlIHN2ZWx0ZS1uNGs1cDFcIik7XG5cdFx0XHRhdHRyKG1haW4sIFwiY2xhc3NcIiwgXCJzdmVsdGUtbjRrNXAxXCIpO1xuXHRcdFx0dG9nZ2xlX2NsYXNzKG1haW4sIFwidmlzaWJsZVwiLCAvKnZpc2libGUqLyBjdHhbMF0pO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0aW5zZXJ0KHRhcmdldCwgbWFpbiwgYW5jaG9yKTtcblx0XHRcdGFwcGVuZChtYWluLCBkaXYpO1xuXHRcdFx0YXBwZW5kKG1haW4sIHQxKTtcblx0XHRcdGFwcGVuZChtYWluLCBoMik7XG5cdFx0XHRhcHBlbmQobWFpbiwgdDMpO1xuXHRcdFx0YXBwZW5kKG1haW4sIHAwKTtcblx0XHRcdGFwcGVuZChtYWluLCB0NSk7XG5cdFx0XHRhcHBlbmQobWFpbiwgcDEpO1xuXHRcdFx0YXBwZW5kKG1haW4sIHQ3KTtcblx0XHRcdGFwcGVuZChtYWluLCBwMik7XG5cdFx0XHRhcHBlbmQobWFpbiwgdDkpO1xuXHRcdFx0YXBwZW5kKG1haW4sIHAzKTtcblx0XHRcdGFwcGVuZChtYWluLCB0MTEpO1xuXHRcdFx0YXBwZW5kKG1haW4sIHA0KTtcblx0XHRcdGFwcGVuZChtYWluLCB0MTMpO1xuXHRcdFx0YXBwZW5kKG1haW4sIHA1KTtcblxuXHRcdFx0aWYgKCFtb3VudGVkKSB7XG5cdFx0XHRcdGRpc3Bvc2UgPSBsaXN0ZW4oZGl2LCBcImNsaWNrXCIsIC8qaGlkZUluc3RydWN0aW9ucyovIGN0eFsxXSk7XG5cdFx0XHRcdG1vdW50ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cChjdHgsIFtkaXJ0eV0pIHtcblx0XHRcdGlmIChkaXJ0eSAmIC8qdmlzaWJsZSovIDEpIHtcblx0XHRcdFx0dG9nZ2xlX2NsYXNzKG1haW4sIFwidmlzaWJsZVwiLCAvKnZpc2libGUqLyBjdHhbMF0pO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0aTogbm9vcCxcblx0XHRvOiBub29wLFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2gobWFpbik7XG5cdFx0XHRtb3VudGVkID0gZmFsc2U7XG5cdFx0XHRkaXNwb3NlKCk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBpbnN0YW5jZSQxKCQkc2VsZiwgJCRwcm9wcywgJCRpbnZhbGlkYXRlKSB7XG5cdGxldCB7IHZpc2libGUgPSBmYWxzZSB9ID0gJCRwcm9wcztcblxuXHRmdW5jdGlvbiBoaWRlSW5zdHJ1Y3Rpb25zKCkge1xuXHRcdCQkaW52YWxpZGF0ZSgwLCB2aXNpYmxlID0gZmFsc2UpO1xuXHR9XG5cblx0JCRzZWxmLiQkc2V0ID0gJCRwcm9wcyA9PiB7XG5cdFx0aWYgKCd2aXNpYmxlJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoMCwgdmlzaWJsZSA9ICQkcHJvcHMudmlzaWJsZSk7XG5cdH07XG5cblx0cmV0dXJuIFt2aXNpYmxlLCBoaWRlSW5zdHJ1Y3Rpb25zXTtcbn1cblxuY2xhc3MgSW5zdHJ1Y3Rpb25zIGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50IHtcblx0Y29uc3RydWN0b3Iob3B0aW9ucykge1xuXHRcdHN1cGVyKCk7XG5cdFx0aW5pdCh0aGlzLCBvcHRpb25zLCBpbnN0YW5jZSQxLCBjcmVhdGVfZnJhZ21lbnQkMSwgc2FmZV9ub3RfZXF1YWwsIHsgdmlzaWJsZTogMCB9KTtcblx0fVxufVxuXG5mdW5jdGlvbiBzYXZlU3RhdGUoc3RhdGUpIHtcbiAgICBsZXQgc3RhdGVTdHJpbmcgPSBKU09OLnN0cmluZ2lmeShzdGF0ZSk7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2p4d29yZC1jcmVhdG9yJywgc3RhdGVTdHJpbmcpO1xufVxuXG5mdW5jdGlvbiByZXN0b3JlU3RhdGUoKSB7XG4gICAgbGV0IHN0YXRlU3RyaW5nID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2p4d29yZC1jcmVhdG9yJyk7XG4gICAgaWYgKHN0YXRlU3RyaW5nKSB7XG4gICAgICAgIGxldCBzdGF0ZSA9IEpTT04ucGFyc2Uoc3RhdGVTdHJpbmcpO1xuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjbGVhclN0YXRlKCkge1xuICAgIGxvY2FsU3RvcmFnZS5jbGVhcigpO1xufVxuXG5jb25zdCBmb3JtYXRfZGF0ZSA9IChkYXRlKSA9PiBuZXcgRGF0ZShkYXRlKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcblxuZnVuY3Rpb24gWERFbmNvZGUob2JqKSB7XG4gICAgbGV0IHN0ciA9IFwiXCI7XG4gICAgaWYgKG9iai50aXRsZSkge1xuICAgICAgICBzdHIgKz0gYFRpdGxlOiAke29iai50aXRsZX1cXG5gO1xuICAgIH1cbiAgICBpZiAob2JqLmF1dGhvcikge1xuICAgICAgICBzdHIgKz0gYEF1dGhvcjogJHtvYmouYXV0aG9yfVxcbmA7XG4gICAgfVxuICAgIGlmIChvYmouZWRpdG9yKSB7XG4gICAgICAgIHN0ciArPSBgRWRpdG9yOiAke29iai5lZGl0b3J9XFxuYDtcbiAgICB9XG4gICAgaWYgKG9iai5kYXRlKSB7XG4gICAgICAgIHN0ciArPSBgRGF0ZTogJHtmb3JtYXRfZGF0ZShvYmouZGF0ZSl9XFxuYDtcbiAgICB9XG4gICAgc3RyICs9IGBcXG5cXG5gO1xuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgb2JqLmdyaWQubGVuZ3RoOyB5KyspIHtcbiAgICAgICAgZm9yKGxldCB4ID0gMDsgeCA8IG9iai5ncmlkW3ldLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICBzdHIgKz0gYCR7b2JqLmdyaWRbeV1beF19YDtcbiAgICAgICAgfVxuICAgICAgICBzdHIgKz0gYFxcbmA7XG4gICAgfVxuICAgIHN0ciArPSBgXFxuXFxuYDtcbiAgICBmb3IgKGxldCBxIG9mIG9iai5xdWVzdGlvbnNfYWNyb3NzKSB7XG4gICAgICAgIHN0ciArPSBgQSR7cS5udW19LiAke3EucXVlc3Rpb259IH4gJHtxLmFuc3dlcn1cXG5gO1xuICAgIH1cbiAgICBzdHIgKz0gYFxcbmA7XG4gICAgZm9yIChsZXQgcSBvZiBvYmoucXVlc3Rpb25zX2Rvd24pIHtcbiAgICAgICAgc3RyICs9IGBEJHtxLm51bX0uICR7cS5xdWVzdGlvbn0gfiAke3EuYW5zd2VyfVxcbmA7XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59XG5cbi8vIEEgbGlicmFyeSBmb3IgY29udmVydGluZyAueGQgQ3Jvc3N3b3JkIGRhdGEgdG8gSlNPTiAoYXMgZGVmaW5lZCBieSBTYXVsIFB3YW5zb24gLSBodHRwOi8veGQuc2F1bC5wdykgd3JpdHRlbiBieSBKYXNvbiBOb3J3b29kLVlvdW5nXG5cbmZ1bmN0aW9uIFhEUGFyc2VyKGRhdGEpIHtcbiAgICBmdW5jdGlvbiBwcm9jZXNzRGF0YShkYXRhKSB7XG4gICAgICAgIC8vIFNwbGl0IGludG8gcGFydHNcbiAgICAgICAgbGV0IHBhcnRzID0gZGF0YS5zcGxpdCgvXiReJC9nbSkuZmlsdGVyKHMgPT4gcyAhPT0gXCJcXG5cIik7XG4gICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPiA0KSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICAgICAgICBwYXJ0cyA9IGRhdGEuc3BsaXQoL1xcclxcblxcclxcbi9nKS5maWx0ZXIocyA9PiAocy50cmltKCkpKTtcbiAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHBhcnRzW2ldID0gcGFydHNbaV0ucmVwbGFjZSgvXFxyXFxuL2csIFwiXFxuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJ0cy5sZW5ndGggIT09IDQpIHRocm93IChgVG9vIG1hbnkgcGFydHMgLSBleHBlY3RlZCA0LCBmb3VuZCAke3BhcnRzLmxlbmd0aH1gKTtcbiAgICAgICAgY29uc3QgcmF3TWV0YSA9IHBhcnRzWzBdO1xuICAgICAgICBjb25zdCByYXdHcmlkID0gcGFydHNbMV07XG4gICAgICAgIGNvbnN0IHJhd0Fjcm9zcyA9IHBhcnRzWzJdO1xuICAgICAgICBjb25zdCByYXdEb3duID0gcGFydHNbM107XG4gICAgICAgIGNvbnN0IG1ldGEgPSBwcm9jZXNzTWV0YShyYXdNZXRhKTtcbiAgICAgICAgY29uc3QgZ3JpZCA9IHByb2Nlc3NHcmlkKHJhd0dyaWQpO1xuICAgICAgICBjb25zdCBhY3Jvc3MgPSBwcm9jZXNzQ2x1ZXMocmF3QWNyb3NzKTtcbiAgICAgICAgY29uc3QgZG93biA9IHByb2Nlc3NDbHVlcyhyYXdEb3duKTtcbiAgICAgICAgcmV0dXJuIHsgbWV0YSwgZ3JpZCwgYWNyb3NzLCBkb3duLCByYXdHcmlkLCByYXdBY3Jvc3MsIHJhd0Rvd24sIHJhd01ldGEsIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc01ldGEocmF3TWV0YSkge1xuICAgICAgICBjb25zdCBtZXRhTGluZXMgPSByYXdNZXRhLnNwbGl0KFwiXFxuXCIpLmZpbHRlcihzID0+IChzKSAmJiBzICE9PSBcIlxcblwiKTtcbiAgICAgICAgbGV0IG1ldGEgPSB7fTtcbiAgICAgICAgbWV0YUxpbmVzLmZvckVhY2gobWV0YUxpbmUgPT4ge1xuICAgICAgICAgICAgY29uc3QgbGluZVBhcnRzID0gbWV0YUxpbmUuc3BsaXQoXCI6IFwiKTtcbiAgICAgICAgICAgIG1ldGFbbGluZVBhcnRzWzBdXSA9IGxpbmVQYXJ0c1sxXTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBtZXRhO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NHcmlkKHJhd0dyaWQpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgICAgICBjb25zdCBsaW5lcyA9IHJhd0dyaWQuc3BsaXQoXCJcXG5cIikuZmlsdGVyKHMgPT4gKHMpICYmIHMgIT09IFwiXFxuXCIpO1xuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGxpbmVzLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICByZXN1bHRbeF0gPSBsaW5lc1t4XS5zcGxpdChcIlwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NDbHVlcyhyYXdDbHVlcykge1xuICAgICAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgICAgIGNvbnN0IGxpbmVzID0gcmF3Q2x1ZXMuc3BsaXQoXCJcXG5cIikuZmlsdGVyKHMgPT4gKHMpICYmIHMgIT09IFwiXFxuXCIpO1xuICAgICAgICBjb25zdCByZWdleCA9IC8oXi5cXGQqKVxcLlxccyguKilcXHN+XFxzKC4qKS87XG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgbGluZXMubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIGlmICghbGluZXNbeF0udHJpbSgpKSBjb250aW51ZTtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gbGluZXNbeF0ubWF0Y2gocmVnZXgpO1xuICAgICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCAhPT0gNCkgdGhyb3cgKGBDb3VsZCBub3QgcGFyc2UgcXVlc3Rpb24gJHtsaW5lc1t4XX1gKTtcbiAgICAgICAgICAgIC8vIFVuZXNjYXBlIHN0cmluZ1xuICAgICAgICAgICAgY29uc3QgcXVlc3Rpb24gPSBwYXJ0c1syXS5yZXBsYWNlKC9cXFxcL2csIFwiXCIpO1xuICAgICAgICAgICAgcmVzdWx0W3hdID0ge1xuICAgICAgICAgICAgICAgIG51bTogcGFydHNbMV0sXG4gICAgICAgICAgICAgICAgcXVlc3Rpb246IHF1ZXN0aW9uLFxuICAgICAgICAgICAgICAgIGFuc3dlcjogcGFydHNbM11cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvY2Vzc0RhdGEoZGF0YSk7XG59XG5cbnZhciB4ZENyb3Nzd29yZFBhcnNlciA9IFhEUGFyc2VyO1xuXG4vKiBzcmMvSlhXb3JkQ3JlYXRvci5zdmVsdGUgZ2VuZXJhdGVkIGJ5IFN2ZWx0ZSB2My40Ni40ICovXG5cbmZ1bmN0aW9uIGNyZWF0ZV9mcmFnbWVudChjdHgpIHtcblx0bGV0IG1haW47XG5cdGxldCBpbnN0cnVjdGlvbnM7XG5cdGxldCB1cGRhdGluZ192aXNpYmxlO1xuXHRsZXQgdDA7XG5cdGxldCBkaXYyO1xuXHRsZXQgbGFiZWwwO1xuXHRsZXQgdDI7XG5cdGxldCBpbnB1dDA7XG5cdGxldCB0Mztcblx0bGV0IGxhYmVsMTtcblx0bGV0IHQ1O1xuXHRsZXQgaW5wdXQxO1xuXHRsZXQgdDY7XG5cdGxldCBsYWJlbDI7XG5cdGxldCB0ODtcblx0bGV0IGlucHV0Mjtcblx0bGV0IHQ5O1xuXHRsZXQgbGFiZWwzO1xuXHRsZXQgdDExO1xuXHRsZXQgaW5wdXQzO1xuXHRsZXQgdDEyO1xuXHRsZXQgbGFiZWw0O1xuXHRsZXQgdDE0O1xuXHRsZXQgaW5wdXQ0O1xuXHRsZXQgdDE1O1xuXHRsZXQgZGl2MTtcblx0bGV0IGRpdjA7XG5cdGxldCBtZW51O1xuXHRsZXQgdDE2O1xuXHRsZXQgZ3JpZF8xO1xuXHRsZXQgdXBkYXRpbmdfQ29udGFpbmVyO1xuXHRsZXQgdDE3O1xuXHRsZXQgbGFiZWw1O1xuXHRsZXQgdDE5O1xuXHRsZXQgaW5wdXQ1O1xuXHRsZXQgdDIwO1xuXHRsZXQgdGV4dGFyZWE7XG5cdGxldCBjdXJyZW50O1xuXHRsZXQgbW91bnRlZDtcblx0bGV0IGRpc3Bvc2U7XG5cblx0ZnVuY3Rpb24gaW5zdHJ1Y3Rpb25zX3Zpc2libGVfYmluZGluZyh2YWx1ZSkge1xuXHRcdC8qaW5zdHJ1Y3Rpb25zX3Zpc2libGVfYmluZGluZyovIGN0eFsyMV0odmFsdWUpO1xuXHR9XG5cblx0bGV0IGluc3RydWN0aW9uc19wcm9wcyA9IHt9O1xuXG5cdGlmICgvKmluc3RydWN0aW9uc1Zpc2libGUqLyBjdHhbMTFdICE9PSB2b2lkIDApIHtcblx0XHRpbnN0cnVjdGlvbnNfcHJvcHMudmlzaWJsZSA9IC8qaW5zdHJ1Y3Rpb25zVmlzaWJsZSovIGN0eFsxMV07XG5cdH1cblxuXHRpbnN0cnVjdGlvbnMgPSBuZXcgSW5zdHJ1Y3Rpb25zKHsgcHJvcHM6IGluc3RydWN0aW9uc19wcm9wcyB9KTtcblx0YmluZGluZ19jYWxsYmFja3MucHVzaCgoKSA9PiBiaW5kKGluc3RydWN0aW9ucywgJ3Zpc2libGUnLCBpbnN0cnVjdGlvbnNfdmlzaWJsZV9iaW5kaW5nKSk7XG5cdG1lbnUgPSBuZXcgTWVudSh7fSk7XG5cdG1lbnUuJG9uKFwicmVzZXRcIiwgLypoYW5kbGVSZXNldCovIGN0eFsxN10pO1xuXHRtZW51LiRvbihcImluc3RydWN0aW9uc1wiLCAvKmhhbmRsZUluc3RydWN0aW9ucyovIGN0eFsxOV0pO1xuXG5cdGZ1bmN0aW9uIGdyaWRfMV9Db250YWluZXJfYmluZGluZyh2YWx1ZSkge1xuXHRcdC8qZ3JpZF8xX0NvbnRhaW5lcl9iaW5kaW5nKi8gY3R4WzI4XSh2YWx1ZSk7XG5cdH1cblxuXHRsZXQgZ3JpZF8xX3Byb3BzID0ge1xuXHRcdHNpemU6IC8qc2l6ZSovIGN0eFs5XSxcblx0XHRncmlkOiAvKmdyaWQqLyBjdHhbMV1cblx0fTtcblxuXHRpZiAoLypncmlkQ29tcG9uZW50Q29udGFpbmVyKi8gY3R4WzhdICE9PSB2b2lkIDApIHtcblx0XHRncmlkXzFfcHJvcHMuQ29udGFpbmVyID0gLypncmlkQ29tcG9uZW50Q29udGFpbmVyKi8gY3R4WzhdO1xuXHR9XG5cblx0Z3JpZF8xID0gbmV3IEdyaWQoeyBwcm9wczogZ3JpZF8xX3Byb3BzIH0pO1xuXHQvKmdyaWRfMV9iaW5kaW5nKi8gY3R4WzI3XShncmlkXzEpO1xuXHRiaW5kaW5nX2NhbGxiYWNrcy5wdXNoKCgpID0+IGJpbmQoZ3JpZF8xLCAnQ29udGFpbmVyJywgZ3JpZF8xX0NvbnRhaW5lcl9iaW5kaW5nKSk7XG5cdGdyaWRfMS4kb24oXCJjaGFuZ2VcIiwgLypoYW5kbGVTdGF0ZUNoYW5nZSovIGN0eFsxNl0pO1xuXHRncmlkXzEuJG9uKFwibW92ZVwiLCAvKmhhbmRsZU1vdmUqLyBjdHhbMTJdKTtcblx0Z3JpZF8xLiRvbihcImxldHRlclwiLCAvKmhhbmRsZUxldHRlciovIGN0eFsxM10pO1xuXHRncmlkXzEuJG9uKFwiYmFja3NwYWNlXCIsIC8qaGFuZGxlQmFja3NwYWNlKi8gY3R4WzE1XSk7XG5cdGdyaWRfMS4kb24oXCJlbnRlclwiLCAvKmhhbmRsZUVudGVyKi8gY3R4WzE0XSk7XG5cblx0cmV0dXJuIHtcblx0XHRjKCkge1xuXHRcdFx0bWFpbiA9IGVsZW1lbnQoXCJtYWluXCIpO1xuXHRcdFx0Y3JlYXRlX2NvbXBvbmVudChpbnN0cnVjdGlvbnMuJCQuZnJhZ21lbnQpO1xuXHRcdFx0dDAgPSBzcGFjZSgpO1xuXHRcdFx0ZGl2MiA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRsYWJlbDAgPSBlbGVtZW50KFwibGFiZWxcIik7XG5cdFx0XHRsYWJlbDAudGV4dENvbnRlbnQgPSBcIlRpdGxlXCI7XG5cdFx0XHR0MiA9IHNwYWNlKCk7XG5cdFx0XHRpbnB1dDAgPSBlbGVtZW50KFwiaW5wdXRcIik7XG5cdFx0XHR0MyA9IHNwYWNlKCk7XG5cdFx0XHRsYWJlbDEgPSBlbGVtZW50KFwibGFiZWxcIik7XG5cdFx0XHRsYWJlbDEudGV4dENvbnRlbnQgPSBcIkF1dGhvclwiO1xuXHRcdFx0dDUgPSBzcGFjZSgpO1xuXHRcdFx0aW5wdXQxID0gZWxlbWVudChcImlucHV0XCIpO1xuXHRcdFx0dDYgPSBzcGFjZSgpO1xuXHRcdFx0bGFiZWwyID0gZWxlbWVudChcImxhYmVsXCIpO1xuXHRcdFx0bGFiZWwyLnRleHRDb250ZW50ID0gXCJFZGl0b3JcIjtcblx0XHRcdHQ4ID0gc3BhY2UoKTtcblx0XHRcdGlucHV0MiA9IGVsZW1lbnQoXCJpbnB1dFwiKTtcblx0XHRcdHQ5ID0gc3BhY2UoKTtcblx0XHRcdGxhYmVsMyA9IGVsZW1lbnQoXCJsYWJlbFwiKTtcblx0XHRcdGxhYmVsMy50ZXh0Q29udGVudCA9IFwiRGF0ZVwiO1xuXHRcdFx0dDExID0gc3BhY2UoKTtcblx0XHRcdGlucHV0MyA9IGVsZW1lbnQoXCJpbnB1dFwiKTtcblx0XHRcdHQxMiA9IHNwYWNlKCk7XG5cdFx0XHRsYWJlbDQgPSBlbGVtZW50KFwibGFiZWxcIik7XG5cdFx0XHRsYWJlbDQudGV4dENvbnRlbnQgPSBcIlNpemVcIjtcblx0XHRcdHQxNCA9IHNwYWNlKCk7XG5cdFx0XHRpbnB1dDQgPSBlbGVtZW50KFwiaW5wdXRcIik7XG5cdFx0XHR0MTUgPSBzcGFjZSgpO1xuXHRcdFx0ZGl2MSA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRkaXYwID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdGNyZWF0ZV9jb21wb25lbnQobWVudS4kJC5mcmFnbWVudCk7XG5cdFx0XHR0MTYgPSBzcGFjZSgpO1xuXHRcdFx0Y3JlYXRlX2NvbXBvbmVudChncmlkXzEuJCQuZnJhZ21lbnQpO1xuXHRcdFx0dDE3ID0gc3BhY2UoKTtcblx0XHRcdGxhYmVsNSA9IGVsZW1lbnQoXCJsYWJlbFwiKTtcblx0XHRcdGxhYmVsNS50ZXh0Q29udGVudCA9IFwiVXBsb2FkIGFuIFhEIGZpbGUgKG9wdGlvbmFsKVwiO1xuXHRcdFx0dDE5ID0gc3BhY2UoKTtcblx0XHRcdGlucHV0NSA9IGVsZW1lbnQoXCJpbnB1dFwiKTtcblx0XHRcdHQyMCA9IHNwYWNlKCk7XG5cdFx0XHR0ZXh0YXJlYSA9IGVsZW1lbnQoXCJ0ZXh0YXJlYVwiKTtcblx0XHRcdGF0dHIobGFiZWwwLCBcImZvclwiLCBcInRpdGxlXCIpO1xuXHRcdFx0YXR0cihsYWJlbDAsIFwiY2xhc3NcIiwgXCJzdmVsdGUtdnNsM2dmXCIpO1xuXHRcdFx0YXR0cihpbnB1dDAsIFwiaWRcIiwgXCJ0aXRsZVwiKTtcblx0XHRcdGF0dHIoaW5wdXQwLCBcIm5hbWVcIiwgXCJ0aXRsZVwiKTtcblx0XHRcdGF0dHIoaW5wdXQwLCBcInR5cGVcIiwgXCJ0ZXh0XCIpO1xuXHRcdFx0YXR0cihpbnB1dDAsIFwiY2xhc3NcIiwgXCJzdmVsdGUtdnNsM2dmXCIpO1xuXHRcdFx0YXR0cihsYWJlbDEsIFwiZm9yXCIsIFwiYXV0aG9yXCIpO1xuXHRcdFx0YXR0cihsYWJlbDEsIFwiY2xhc3NcIiwgXCJzdmVsdGUtdnNsM2dmXCIpO1xuXHRcdFx0YXR0cihpbnB1dDEsIFwiaWRcIiwgXCJhdXRob3JcIik7XG5cdFx0XHRhdHRyKGlucHV0MSwgXCJuYW1lXCIsIFwiYXV0aG9yXCIpO1xuXHRcdFx0YXR0cihpbnB1dDEsIFwidHlwZVwiLCBcInRleHRcIik7XG5cdFx0XHRhdHRyKGlucHV0MSwgXCJjbGFzc1wiLCBcInN2ZWx0ZS12c2wzZ2ZcIik7XG5cdFx0XHRhdHRyKGxhYmVsMiwgXCJmb3JcIiwgXCJlZGl0b3JcIik7XG5cdFx0XHRhdHRyKGxhYmVsMiwgXCJjbGFzc1wiLCBcInN2ZWx0ZS12c2wzZ2ZcIik7XG5cdFx0XHRhdHRyKGlucHV0MiwgXCJpZFwiLCBcImVkaXRvclwiKTtcblx0XHRcdGF0dHIoaW5wdXQyLCBcIm5hbWVcIiwgXCJlZGl0b3JcIik7XG5cdFx0XHRhdHRyKGlucHV0MiwgXCJ0eXBlXCIsIFwidGV4dFwiKTtcblx0XHRcdGF0dHIoaW5wdXQyLCBcImNsYXNzXCIsIFwic3ZlbHRlLXZzbDNnZlwiKTtcblx0XHRcdGF0dHIobGFiZWwzLCBcImZvclwiLCBcImRhdGVcIik7XG5cdFx0XHRhdHRyKGxhYmVsMywgXCJjbGFzc1wiLCBcInN2ZWx0ZS12c2wzZ2ZcIik7XG5cdFx0XHRhdHRyKGlucHV0MywgXCJpZFwiLCBcImRhdGVcIik7XG5cdFx0XHRhdHRyKGlucHV0MywgXCJuYW1lXCIsIFwiZGF0ZVwiKTtcblx0XHRcdGF0dHIoaW5wdXQzLCBcInR5cGVcIiwgXCJkYXRlXCIpO1xuXHRcdFx0YXR0cihpbnB1dDMsIFwiY2xhc3NcIiwgXCJzdmVsdGUtdnNsM2dmXCIpO1xuXHRcdFx0YXR0cihsYWJlbDQsIFwiZm9yXCIsIFwic2l6ZVwiKTtcblx0XHRcdGF0dHIobGFiZWw0LCBcImNsYXNzXCIsIFwic3ZlbHRlLXZzbDNnZlwiKTtcblx0XHRcdGF0dHIoaW5wdXQ0LCBcInR5cGVcIiwgXCJudW1iZXJcIik7XG5cdFx0XHRhdHRyKGlucHV0NCwgXCJuYW1lXCIsIFwic2l6ZVwiKTtcblx0XHRcdGF0dHIoaW5wdXQ0LCBcImlkXCIsIFwic2l6ZVwiKTtcblx0XHRcdGF0dHIoaW5wdXQ0LCBcInBsYWNlaG9sZGVyXCIsIFwic2l6ZVwiKTtcblx0XHRcdGF0dHIoaW5wdXQ0LCBcImRlZmF1bHRcIiwgXCI1XCIpO1xuXHRcdFx0YXR0cihpbnB1dDQsIFwibWluXCIsIFwiMlwiKTtcblx0XHRcdGF0dHIoaW5wdXQ0LCBcImNsYXNzXCIsIFwic3ZlbHRlLXZzbDNnZlwiKTtcblx0XHRcdGF0dHIoZGl2MCwgXCJjbGFzc1wiLCBcImp4d29yZC1oZWFkZXJcIik7XG5cdFx0XHRhdHRyKGRpdjEsIFwiY2xhc3NcIiwgXCJqeHdvcmQtY29udGFpbmVyIHN2ZWx0ZS12c2wzZ2ZcIik7XG5cdFx0XHRhdHRyKGxhYmVsNSwgXCJmb3JcIiwgXCJmaWxlXCIpO1xuXHRcdFx0YXR0cihsYWJlbDUsIFwiY2xhc3NcIiwgXCJzdmVsdGUtdnNsM2dmXCIpO1xuXHRcdFx0YXR0cihpbnB1dDUsIFwiY2xhc3NcIiwgXCJkcm9wX3pvbmUgc3ZlbHRlLXZzbDNnZlwiKTtcblx0XHRcdGF0dHIoaW5wdXQ1LCBcInR5cGVcIiwgXCJmaWxlXCIpO1xuXHRcdFx0YXR0cihpbnB1dDUsIFwiaWRcIiwgXCJmaWxlXCIpO1xuXHRcdFx0YXR0cihpbnB1dDUsIFwibmFtZVwiLCBcImZpbGVzXCIpO1xuXHRcdFx0YXR0cihpbnB1dDUsIFwiYWNjZXB0XCIsIFwiLnhkXCIpO1xuXHRcdFx0YXR0cih0ZXh0YXJlYSwgXCJpZFwiLCBcInhkXCIpO1xuXHRcdFx0YXR0cih0ZXh0YXJlYSwgXCJuYW1lXCIsIFwieGRcIik7XG5cdFx0XHRhdHRyKHRleHRhcmVhLCBcImNsYXNzXCIsIFwianh3b3JkLXhkLXRleHRhcmVhIHN2ZWx0ZS12c2wzZ2ZcIik7XG5cdFx0XHRzZXRfc3R5bGUodGV4dGFyZWEsIFwiZGlzcGxheVwiLCAvKmRpc3BsYXlYZCovIGN0eFs2XSA/ICdibG9jaycgOiAnbm9uZScsIGZhbHNlKTtcblx0XHRcdGF0dHIoZGl2MiwgXCJjbGFzc1wiLCBcImp4d29yZC1mb3JtLWNvbnRhaW5lciBzdmVsdGUtdnNsM2dmXCIpO1xuXHRcdFx0YXR0cihtYWluLCBcImNsYXNzXCIsIFwic3ZlbHRlLXZzbDNnZlwiKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGluc2VydCh0YXJnZXQsIG1haW4sIGFuY2hvcik7XG5cdFx0XHRtb3VudF9jb21wb25lbnQoaW5zdHJ1Y3Rpb25zLCBtYWluLCBudWxsKTtcblx0XHRcdGFwcGVuZChtYWluLCB0MCk7XG5cdFx0XHRhcHBlbmQobWFpbiwgZGl2Mik7XG5cdFx0XHRhcHBlbmQoZGl2MiwgbGFiZWwwKTtcblx0XHRcdGFwcGVuZChkaXYyLCB0Mik7XG5cdFx0XHRhcHBlbmQoZGl2MiwgaW5wdXQwKTtcblx0XHRcdHNldF9pbnB1dF92YWx1ZShpbnB1dDAsIC8qdGl0bGUqLyBjdHhbMl0pO1xuXHRcdFx0YXBwZW5kKGRpdjIsIHQzKTtcblx0XHRcdGFwcGVuZChkaXYyLCBsYWJlbDEpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIHQ1KTtcblx0XHRcdGFwcGVuZChkaXYyLCBpbnB1dDEpO1xuXHRcdFx0c2V0X2lucHV0X3ZhbHVlKGlucHV0MSwgLyphdXRob3IqLyBjdHhbM10pO1xuXHRcdFx0YXBwZW5kKGRpdjIsIHQ2KTtcblx0XHRcdGFwcGVuZChkaXYyLCBsYWJlbDIpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIHQ4KTtcblx0XHRcdGFwcGVuZChkaXYyLCBpbnB1dDIpO1xuXHRcdFx0c2V0X2lucHV0X3ZhbHVlKGlucHV0MiwgLyplZGl0b3IqLyBjdHhbNF0pO1xuXHRcdFx0YXBwZW5kKGRpdjIsIHQ5KTtcblx0XHRcdGFwcGVuZChkaXYyLCBsYWJlbDMpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIHQxMSk7XG5cdFx0XHRhcHBlbmQoZGl2MiwgaW5wdXQzKTtcblx0XHRcdHNldF9pbnB1dF92YWx1ZShpbnB1dDMsIC8qZGF0ZSovIGN0eFs1XSk7XG5cdFx0XHRhcHBlbmQoZGl2MiwgdDEyKTtcblx0XHRcdGFwcGVuZChkaXYyLCBsYWJlbDQpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIHQxNCk7XG5cdFx0XHRhcHBlbmQoZGl2MiwgaW5wdXQ0KTtcblx0XHRcdHNldF9pbnB1dF92YWx1ZShpbnB1dDQsIC8qc2l6ZSovIGN0eFs5XSk7XG5cdFx0XHRhcHBlbmQoZGl2MiwgdDE1KTtcblx0XHRcdGFwcGVuZChkaXYyLCBkaXYxKTtcblx0XHRcdGFwcGVuZChkaXYxLCBkaXYwKTtcblx0XHRcdG1vdW50X2NvbXBvbmVudChtZW51LCBkaXYwLCBudWxsKTtcblx0XHRcdGFwcGVuZChkaXYxLCB0MTYpO1xuXHRcdFx0bW91bnRfY29tcG9uZW50KGdyaWRfMSwgZGl2MSwgbnVsbCk7XG5cdFx0XHRhcHBlbmQoZGl2MiwgdDE3KTtcblx0XHRcdGFwcGVuZChkaXYyLCBsYWJlbDUpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIHQxOSk7XG5cdFx0XHRhcHBlbmQoZGl2MiwgaW5wdXQ1KTtcblx0XHRcdC8qaW5wdXQ1X2JpbmRpbmcqLyBjdHhbMjldKGlucHV0NSk7XG5cdFx0XHRhcHBlbmQoZGl2MiwgdDIwKTtcblx0XHRcdGFwcGVuZChkaXYyLCB0ZXh0YXJlYSk7XG5cdFx0XHRzZXRfaW5wdXRfdmFsdWUodGV4dGFyZWEsIC8qeGQqLyBjdHhbMF0pO1xuXHRcdFx0Y3VycmVudCA9IHRydWU7XG5cblx0XHRcdGlmICghbW91bnRlZCkge1xuXHRcdFx0XHRkaXNwb3NlID0gW1xuXHRcdFx0XHRcdGxpc3RlbihpbnB1dDAsIFwiaW5wdXRcIiwgLyppbnB1dDBfaW5wdXRfaGFuZGxlciovIGN0eFsyMl0pLFxuXHRcdFx0XHRcdGxpc3RlbihpbnB1dDAsIFwiY2hhbmdlXCIsIC8qaGFuZGxlU3RhdGVDaGFuZ2UqLyBjdHhbMTZdKSxcblx0XHRcdFx0XHRsaXN0ZW4oaW5wdXQxLCBcImlucHV0XCIsIC8qaW5wdXQxX2lucHV0X2hhbmRsZXIqLyBjdHhbMjNdKSxcblx0XHRcdFx0XHRsaXN0ZW4oaW5wdXQxLCBcImNoYW5nZVwiLCAvKmhhbmRsZVN0YXRlQ2hhbmdlKi8gY3R4WzE2XSksXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0MiwgXCJpbnB1dFwiLCAvKmlucHV0Ml9pbnB1dF9oYW5kbGVyKi8gY3R4WzI0XSksXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0MiwgXCJjaGFuZ2VcIiwgLypoYW5kbGVTdGF0ZUNoYW5nZSovIGN0eFsxNl0pLFxuXHRcdFx0XHRcdGxpc3RlbihpbnB1dDMsIFwiaW5wdXRcIiwgLyppbnB1dDNfaW5wdXRfaGFuZGxlciovIGN0eFsyNV0pLFxuXHRcdFx0XHRcdGxpc3RlbihpbnB1dDMsIFwiY2hhbmdlXCIsIC8qaGFuZGxlU3RhdGVDaGFuZ2UqLyBjdHhbMTZdKSxcblx0XHRcdFx0XHRsaXN0ZW4oaW5wdXQ0LCBcImlucHV0XCIsIC8qaW5wdXQ0X2lucHV0X2hhbmRsZXIqLyBjdHhbMjZdKSxcblx0XHRcdFx0XHRsaXN0ZW4oaW5wdXQ1LCBcImNoYW5nZVwiLCAvKmhhbmRsZUZpbGVTZWxlY3QqLyBjdHhbMThdKSxcblx0XHRcdFx0XHRsaXN0ZW4odGV4dGFyZWEsIFwiaW5wdXRcIiwgLyp0ZXh0YXJlYV9pbnB1dF9oYW5kbGVyKi8gY3R4WzMwXSlcblx0XHRcdFx0XTtcblxuXHRcdFx0XHRtb3VudGVkID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHAoY3R4LCBkaXJ0eSkge1xuXHRcdFx0Y29uc3QgaW5zdHJ1Y3Rpb25zX2NoYW5nZXMgPSB7fTtcblxuXHRcdFx0aWYgKCF1cGRhdGluZ192aXNpYmxlICYmIGRpcnR5WzBdICYgLyppbnN0cnVjdGlvbnNWaXNpYmxlKi8gMjA0OCkge1xuXHRcdFx0XHR1cGRhdGluZ192aXNpYmxlID0gdHJ1ZTtcblx0XHRcdFx0aW5zdHJ1Y3Rpb25zX2NoYW5nZXMudmlzaWJsZSA9IC8qaW5zdHJ1Y3Rpb25zVmlzaWJsZSovIGN0eFsxMV07XG5cdFx0XHRcdGFkZF9mbHVzaF9jYWxsYmFjaygoKSA9PiB1cGRhdGluZ192aXNpYmxlID0gZmFsc2UpO1xuXHRcdFx0fVxuXG5cdFx0XHRpbnN0cnVjdGlvbnMuJHNldChpbnN0cnVjdGlvbnNfY2hhbmdlcyk7XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qdGl0bGUqLyA0ICYmIGlucHV0MC52YWx1ZSAhPT0gLyp0aXRsZSovIGN0eFsyXSkge1xuXHRcdFx0XHRzZXRfaW5wdXRfdmFsdWUoaW5wdXQwLCAvKnRpdGxlKi8gY3R4WzJdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLyphdXRob3IqLyA4ICYmIGlucHV0MS52YWx1ZSAhPT0gLyphdXRob3IqLyBjdHhbM10pIHtcblx0XHRcdFx0c2V0X2lucHV0X3ZhbHVlKGlucHV0MSwgLyphdXRob3IqLyBjdHhbM10pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmVkaXRvciovIDE2ICYmIGlucHV0Mi52YWx1ZSAhPT0gLyplZGl0b3IqLyBjdHhbNF0pIHtcblx0XHRcdFx0c2V0X2lucHV0X3ZhbHVlKGlucHV0MiwgLyplZGl0b3IqLyBjdHhbNF0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmRhdGUqLyAzMikge1xuXHRcdFx0XHRzZXRfaW5wdXRfdmFsdWUoaW5wdXQzLCAvKmRhdGUqLyBjdHhbNV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKnNpemUqLyA1MTIgJiYgdG9fbnVtYmVyKGlucHV0NC52YWx1ZSkgIT09IC8qc2l6ZSovIGN0eFs5XSkge1xuXHRcdFx0XHRzZXRfaW5wdXRfdmFsdWUoaW5wdXQ0LCAvKnNpemUqLyBjdHhbOV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBncmlkXzFfY2hhbmdlcyA9IHt9O1xuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypzaXplKi8gNTEyKSBncmlkXzFfY2hhbmdlcy5zaXplID0gLypzaXplKi8gY3R4WzldO1xuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypncmlkKi8gMikgZ3JpZF8xX2NoYW5nZXMuZ3JpZCA9IC8qZ3JpZCovIGN0eFsxXTtcblxuXHRcdFx0aWYgKCF1cGRhdGluZ19Db250YWluZXIgJiYgZGlydHlbMF0gJiAvKmdyaWRDb21wb25lbnRDb250YWluZXIqLyAyNTYpIHtcblx0XHRcdFx0dXBkYXRpbmdfQ29udGFpbmVyID0gdHJ1ZTtcblx0XHRcdFx0Z3JpZF8xX2NoYW5nZXMuQ29udGFpbmVyID0gLypncmlkQ29tcG9uZW50Q29udGFpbmVyKi8gY3R4WzhdO1xuXHRcdFx0XHRhZGRfZmx1c2hfY2FsbGJhY2soKCkgPT4gdXBkYXRpbmdfQ29udGFpbmVyID0gZmFsc2UpO1xuXHRcdFx0fVxuXG5cdFx0XHRncmlkXzEuJHNldChncmlkXzFfY2hhbmdlcyk7XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qeGQqLyAxKSB7XG5cdFx0XHRcdHNldF9pbnB1dF92YWx1ZSh0ZXh0YXJlYSwgLyp4ZCovIGN0eFswXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qZGlzcGxheVhkKi8gNjQpIHtcblx0XHRcdFx0c2V0X3N0eWxlKHRleHRhcmVhLCBcImRpc3BsYXlcIiwgLypkaXNwbGF5WGQqLyBjdHhbNl0gPyAnYmxvY2snIDogJ25vbmUnLCBmYWxzZSk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRpKGxvY2FsKSB7XG5cdFx0XHRpZiAoY3VycmVudCkgcmV0dXJuO1xuXHRcdFx0dHJhbnNpdGlvbl9pbihpbnN0cnVjdGlvbnMuJCQuZnJhZ21lbnQsIGxvY2FsKTtcblx0XHRcdHRyYW5zaXRpb25faW4obWVudS4kJC5mcmFnbWVudCwgbG9jYWwpO1xuXHRcdFx0dHJhbnNpdGlvbl9pbihncmlkXzEuJCQuZnJhZ21lbnQsIGxvY2FsKTtcblx0XHRcdGN1cnJlbnQgPSB0cnVlO1xuXHRcdH0sXG5cdFx0byhsb2NhbCkge1xuXHRcdFx0dHJhbnNpdGlvbl9vdXQoaW5zdHJ1Y3Rpb25zLiQkLmZyYWdtZW50LCBsb2NhbCk7XG5cdFx0XHR0cmFuc2l0aW9uX291dChtZW51LiQkLmZyYWdtZW50LCBsb2NhbCk7XG5cdFx0XHR0cmFuc2l0aW9uX291dChncmlkXzEuJCQuZnJhZ21lbnQsIGxvY2FsKTtcblx0XHRcdGN1cnJlbnQgPSBmYWxzZTtcblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2gobWFpbik7XG5cdFx0XHRkZXN0cm95X2NvbXBvbmVudChpbnN0cnVjdGlvbnMpO1xuXHRcdFx0ZGVzdHJveV9jb21wb25lbnQobWVudSk7XG5cdFx0XHQvKmdyaWRfMV9iaW5kaW5nKi8gY3R4WzI3XShudWxsKTtcblx0XHRcdGRlc3Ryb3lfY29tcG9uZW50KGdyaWRfMSk7XG5cdFx0XHQvKmlucHV0NV9iaW5kaW5nKi8gY3R4WzI5XShudWxsKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdHJ1bl9hbGwoZGlzcG9zZSk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBpbnN0YW5jZSgkJHNlbGYsICQkcHJvcHMsICQkaW52YWxpZGF0ZSkge1xuXHRsZXQgJHF1ZXN0aW9uc0Rvd247XG5cdGxldCAkcXVlc3Rpb25zQWNyb3NzO1xuXHRsZXQgJGN1cnJlbnREaXJlY3Rpb247XG5cdGNvbXBvbmVudF9zdWJzY3JpYmUoJCRzZWxmLCBxdWVzdGlvbnNEb3duLCAkJHZhbHVlID0+ICQkaW52YWxpZGF0ZSgzMiwgJHF1ZXN0aW9uc0Rvd24gPSAkJHZhbHVlKSk7XG5cdGNvbXBvbmVudF9zdWJzY3JpYmUoJCRzZWxmLCBxdWVzdGlvbnNBY3Jvc3MsICQkdmFsdWUgPT4gJCRpbnZhbGlkYXRlKDMzLCAkcXVlc3Rpb25zQWNyb3NzID0gJCR2YWx1ZSkpO1xuXHRjb21wb25lbnRfc3Vic2NyaWJlKCQkc2VsZiwgY3VycmVudERpcmVjdGlvbiwgJCR2YWx1ZSA9PiAkJGludmFsaWRhdGUoMzQsICRjdXJyZW50RGlyZWN0aW9uID0gJCR2YWx1ZSkpO1xuXHRjb25zdCBzYXZlX3N0YXRlID0gdHJ1ZTtcblx0bGV0IHsgeGQgfSA9ICQkcHJvcHM7XG5cdGxldCB7IGdyaWQgPSBbLi4uQXJyYXkoMTApXS5tYXAoZSA9PiBBcnJheSgxMCkpIH0gPSAkJHByb3BzO1xuXHRsZXQgeyB0aXRsZSB9ID0gJCRwcm9wcztcblx0bGV0IHsgYXV0aG9yIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBlZGl0b3IgfSA9ICQkcHJvcHM7XG5cdGxldCB7IGRhdGUgfSA9ICQkcHJvcHM7XG5cdGxldCB7IGRpc3BsYXlYZCA9IHRydWUgfSA9ICQkcHJvcHM7XG5cblx0Ly8gU3RhdGVcblx0bGV0IGdyaWRDb21wb25lbnQ7XG5cblx0bGV0IGdyaWRDb21wb25lbnRDb250YWluZXI7XG5cdGxldCBzaXplID0gZ3JpZC5sZW5ndGg7XG5cblx0bGV0IHN0YXRlID0ge1xuXHRcdGdyaWQsXG5cdFx0c2l6ZSxcblx0XHRjdXJyZW50X3g6IDAsXG5cdFx0Y3VycmVudF95OiAwLFxuXHRcdGRpcmVjdGlvbjogXCJhY3Jvc3NcIixcblx0XHRxdWVzdGlvbnNfYWNyb3NzOiAkcXVlc3Rpb25zQWNyb3NzLFxuXHRcdHF1ZXN0aW9uc19kb3duOiAkcXVlc3Rpb25zRG93blxuXHR9O1xuXG5cdGxldCBnZXRTdGF0ZSA9ICgpID0+IHtcblx0XHRsZXQgeyB4OiBjdXJyZW50X3gsIHk6IGN1cnJlbnRfeSB9ID0gZ3JpZENvbXBvbmVudC5nZXRDdXJyZW50UG9zKCk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Z3JpZCxcblx0XHRcdHNpemUsXG5cdFx0XHRjdXJyZW50X3gsXG5cdFx0XHRjdXJyZW50X3ksXG5cdFx0XHRkaXJlY3Rpb246ICRjdXJyZW50RGlyZWN0aW9uLFxuXHRcdFx0cXVlc3Rpb25zX2Fjcm9zczogJHF1ZXN0aW9uc0Fjcm9zcyxcblx0XHRcdHF1ZXN0aW9uc19kb3duOiAkcXVlc3Rpb25zRG93bixcblx0XHRcdHRpdGxlLFxuXHRcdFx0YXV0aG9yLFxuXHRcdFx0ZWRpdG9yLFxuXHRcdFx0ZGF0ZVxuXHRcdH07XG5cdH07XG5cblx0ZnVuY3Rpb24gaGFuZGxlTW92ZShldmVudCkge1xuXHRcdGNvbnN0IGRpcmVjdGlvbiA9IGV2ZW50LmRldGFpbDtcblx0XHRsZXQgbmV3RGlyO1xuXG5cdFx0aWYgKGRpcmVjdGlvbiA9PT0gXCJkb3duXCIgfHwgZGlyZWN0aW9uID09PSBcInVwXCIpIHtcblx0XHRcdG5ld0RpciA9IFwiZG93blwiO1xuXHRcdH1cblxuXHRcdGlmIChkaXJlY3Rpb24gPT09IFwibGVmdFwiIHx8IGRpcmVjdGlvbiA9PT0gXCJyaWdodFwiKSB7XG5cdFx0XHRuZXdEaXIgPSBcImFjcm9zc1wiO1xuXHRcdH1cblxuXHRcdGlmIChuZXdEaXIgIT09ICRjdXJyZW50RGlyZWN0aW9uKSB7XG5cdFx0XHRncmlkQ29tcG9uZW50LnNldERpcihuZXdEaXIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRncmlkQ29tcG9uZW50LmhhbmRsZU1vdmUoZGlyZWN0aW9uKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVMZXR0ZXIoZXZlbnQpIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGNvbnN0IGxldHRlciA9IGV2ZW50LmRldGFpbDtcblxuXHRcdGlmIChsZXR0ZXIgPT09IFwiIFwiKSB7XG5cdFx0XHRncmlkQ29tcG9uZW50LnRvZ2dsZURpcigpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGxldCB7IHgsIHkgfSA9IGdyaWRDb21wb25lbnQuZ2V0Q3VycmVudFBvcygpO1xuXHRcdCQkaW52YWxpZGF0ZSgxLCBncmlkW3ldW3hdID0gbGV0dGVyLCBncmlkKTtcblxuXHRcdGlmICgkY3VycmVudERpcmVjdGlvbiA9PT0gXCJhY3Jvc3NcIikge1xuXHRcdFx0Z3JpZENvbXBvbmVudC5tb3ZlUmlnaHQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Z3JpZENvbXBvbmVudC5tb3ZlRG93bigpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZUVudGVyKGV2ZW50KSB7XG5cdFx0bGV0IHsgeCwgeSB9ID0gZ3JpZENvbXBvbmVudC5nZXRDdXJyZW50UG9zKCk7XG5cdFx0bGV0IHNlbGVjdGVkX3F1ZXN0aW9uO1xuXG5cdFx0bGV0IHF1ZXN0aW9ucyA9ICRjdXJyZW50RGlyZWN0aW9uID09PSBcImFjcm9zc1wiXG5cdFx0PyAkcXVlc3Rpb25zQWNyb3NzXG5cdFx0OiAkcXVlc3Rpb25zRG93bjtcblxuXHRcdGlmICgkY3VycmVudERpcmVjdGlvbiA9PT0gXCJhY3Jvc3NcIikge1xuXHRcdFx0c2VsZWN0ZWRfcXVlc3Rpb24gPSBxdWVzdGlvbnMuZmluZChxID0+IHkgPT09IHEueSAmJiB4ID49IHEueCAmJiB4IDw9IHEueCArIHEuYW5zd2VyLmxlbmd0aCAtIDEpO1xuXG5cdFx0XHRpZiAoc2VsZWN0ZWRfcXVlc3Rpb24pIHtcblx0XHRcdFx0c2VsZWN0ZWRfcXVlc3Rpb24uZWRpdGluZyA9IHRydWU7XG5cdFx0XHRcdHNldF9zdG9yZV92YWx1ZShxdWVzdGlvbnNBY3Jvc3MsICRxdWVzdGlvbnNBY3Jvc3MgPSBxdWVzdGlvbnMsICRxdWVzdGlvbnNBY3Jvc3MpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZWxlY3RlZF9xdWVzdGlvbiA9IHF1ZXN0aW9ucy5maW5kKHEgPT4geCA9PT0gcS54ICYmIHkgPj0gcS55ICYmIHkgPD0gcS55ICsgcS5hbnN3ZXIubGVuZ3RoIC0gMSk7XG5cblx0XHRcdGlmIChzZWxlY3RlZF9xdWVzdGlvbikge1xuXHRcdFx0XHRzZWxlY3RlZF9xdWVzdGlvbi5lZGl0aW5nID0gdHJ1ZTtcblx0XHRcdFx0c2V0X3N0b3JlX3ZhbHVlKHF1ZXN0aW9uc0Rvd24sICRxdWVzdGlvbnNEb3duID0gcXVlc3Rpb25zLCAkcXVlc3Rpb25zRG93bik7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlQmFja3NwYWNlKGV2ZW50KSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRsZXQgeyB4LCB5IH0gPSBncmlkQ29tcG9uZW50LmdldEN1cnJlbnRQb3MoKTtcblx0XHQkJGludmFsaWRhdGUoMSwgZ3JpZFt5XVt4XSA9IFwiXCIsIGdyaWQpO1xuXG5cdFx0aWYgKCRjdXJyZW50RGlyZWN0aW9uID09PSBcImFjcm9zc1wiKSB7XG5cdFx0XHRncmlkQ29tcG9uZW50Lm1vdmVMZWZ0KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGdyaWRDb21wb25lbnQubW92ZVVwKCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlU3RhdGVDaGFuZ2UoKSB7XG5cdFx0c2F2ZVN0YXRlKGdldFN0YXRlKCkpO1xuXHRcdCQkaW52YWxpZGF0ZSgwLCB4ZCA9IFhERW5jb2RlKGdldFN0YXRlKCkpKTtcblx0fVxuXG5cdG9uTW91bnQoKCkgPT4ge1xuXHRcdGlmICh4ZCkge1xuXHRcdFx0bG9hZFhkKHhkKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0e1xuXHRcdFx0XHRzdGF0ZSA9IHJlc3RvcmVTdGF0ZSgpIHx8IHN0YXRlO1xuXHRcdFx0fVxuXG5cdFx0XHQkJGludmFsaWRhdGUoMSwgZ3JpZCA9IHN0YXRlLmdyaWQpO1xuXHRcdFx0JCRpbnZhbGlkYXRlKDksIHNpemUgPSBzdGF0ZS5zaXplKTtcblx0XHRcdCQkaW52YWxpZGF0ZSgzLCBhdXRob3IgPSBzdGF0ZS5hdXRob3IpO1xuXHRcdFx0JCRpbnZhbGlkYXRlKDQsIGVkaXRvciA9IHN0YXRlLmVkaXRvcik7XG5cdFx0XHQkJGludmFsaWRhdGUoNSwgZGF0ZSA9IHN0YXRlLmRhdGUpO1xuXHRcdFx0JCRpbnZhbGlkYXRlKDIsIHRpdGxlID0gc3RhdGUudGl0bGUpO1xuXHRcdFx0cXVlc3Rpb25zQWNyb3NzLnNldChzdGF0ZS5xdWVzdGlvbnNfYWNyb3NzKTtcblx0XHRcdHF1ZXN0aW9uc0Rvd24uc2V0KHN0YXRlLnF1ZXN0aW9uc19kb3duKTtcblx0XHRcdGdyaWRDb21wb25lbnQuc2V0RGlyKHN0YXRlLmRpcmVjdGlvbik7XG5cdFx0XHRncmlkQ29tcG9uZW50LnNldEN1cnJlbnRQb3Moc3RhdGUuY3VycmVudF94LCBzdGF0ZS5jdXJyZW50X3kpO1xuXHRcdH1cblx0fSk7XG5cblx0ZnVuY3Rpb24gaGFuZGxlUmVzZXQoKSB7XG5cdFx0Y2xlYXJTdGF0ZSgpO1xuXHRcdCQkaW52YWxpZGF0ZSg5LCBzaXplID0gMTApO1xuXHRcdGdyaWRDb21wb25lbnQuc2V0RGlyKFwiYWNyb3NzXCIpO1xuXHRcdGdyaWRDb21wb25lbnQuc2V0Q3VycmVudFBvcygwLCAwKTtcblx0XHQkJGludmFsaWRhdGUoMiwgdGl0bGUgPSBcIlwiKTtcblx0XHQkJGludmFsaWRhdGUoMywgYXV0aG9yID0gXCJcIik7XG5cdFx0JCRpbnZhbGlkYXRlKDQsIGVkaXRvciA9IFwiXCIpO1xuXHRcdCQkaW52YWxpZGF0ZSg1LCBkYXRlID0gXCJcIik7XG5cdFx0JCRpbnZhbGlkYXRlKDEsIGdyaWQgPSBbLi4uQXJyYXkoMTApXS5tYXAoZSA9PiBBcnJheSgxMCkpKTtcblx0XHRxdWVzdGlvbnNBY3Jvc3Muc2V0KFtdKTtcblx0XHRjbGVhclN0YXRlKCk7XG5cdFx0cXVlc3Rpb25zRG93bi5zZXQoW10pO1xuXHRcdGNsZWFyU3RhdGUoKTtcblx0XHQkJGludmFsaWRhdGUoMCwgeGQgPSBcIlwiKTtcblx0XHRjbGVhclN0YXRlKCk7XG5cdH1cblxuXHRhc3luYyBmdW5jdGlvbiBsb2FkWGQoeGQpIHtcblx0XHRjb25zdCBkYXRhID0geGRDcm9zc3dvcmRQYXJzZXIoeGQpO1xuXHRcdGNvbnNvbGUubG9nKGRhdGEpO1xuXHRcdCQkaW52YWxpZGF0ZSgxLCBncmlkID0gZGF0YS5ncmlkKTtcblx0XHQkJGludmFsaWRhdGUoOSwgc2l6ZSA9IGRhdGEuZ3JpZC5sZW5ndGgpO1xuXHRcdCQkaW52YWxpZGF0ZSgzLCBhdXRob3IgPSBkYXRhLm1ldGEuQXV0aG9yKTtcblx0XHQkJGludmFsaWRhdGUoNCwgZWRpdG9yID0gZGF0YS5tZXRhLkVkaXRvcik7XG5cdFx0JCRpbnZhbGlkYXRlKDUsIGRhdGUgPSBkYXRhLm1ldGEuRGF0ZSk7XG5cdFx0JCRpbnZhbGlkYXRlKDIsIHRpdGxlID0gZGF0YS5tZXRhLlRpdGxlKTtcblx0XHRncmlkQ29tcG9uZW50LnNldERpcihcImFjcm9zc1wiKTtcblx0XHRncmlkQ29tcG9uZW50LnNldEN1cnJlbnRQb3MoMCwgMCk7XG5cdFx0YXdhaXQgdGljaygpO1xuXHRcdGxldCBxdWVzdGlvbnNfYWNyb3NzID0gJHF1ZXN0aW9uc0Fjcm9zcztcblxuXHRcdGZvciAobGV0IHF1ZXN0aW9uIG9mIHF1ZXN0aW9uc19hY3Jvc3MpIHtcblx0XHRcdGxldCBtYXRjaGluZ19xdWVzdGlvbiA9IGRhdGEuYWNyb3NzLmZpbmQocSA9PiBxLm51bSA9PT0gYEEke3F1ZXN0aW9uLm51bX1gKTtcblxuXHRcdFx0Ly8gY29uc29sZS5sb2cobWF0Y2hpbmdfcXVlc3Rpb24pO1xuXHRcdFx0aWYgKG1hdGNoaW5nX3F1ZXN0aW9uKSB7XG5cdFx0XHRcdHF1ZXN0aW9uLnF1ZXN0aW9uID0gbWF0Y2hpbmdfcXVlc3Rpb24ucXVlc3Rpb247XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cXVlc3Rpb25zQWNyb3NzLnNldChxdWVzdGlvbnNfYWNyb3NzKTtcblx0XHRsZXQgcXVlc3Rpb25zX2Rvd24gPSAkcXVlc3Rpb25zRG93bjtcblxuXHRcdGZvciAobGV0IHF1ZXN0aW9uIG9mIHF1ZXN0aW9uc19kb3duKSB7XG5cdFx0XHRsZXQgbWF0Y2hpbmdfcXVlc3Rpb24gPSBkYXRhLmRvd24uZmluZChxID0+IHEubnVtID09PSBgRCR7cXVlc3Rpb24ubnVtfWApO1xuXG5cdFx0XHQvLyBjb25zb2xlLmxvZyhtYXRjaGluZ19xdWVzdGlvbik7XG5cdFx0XHRpZiAobWF0Y2hpbmdfcXVlc3Rpb24pIHtcblx0XHRcdFx0cXVlc3Rpb24ucXVlc3Rpb24gPSBtYXRjaGluZ19xdWVzdGlvbi5xdWVzdGlvbjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRxdWVzdGlvbnNEb3duLnNldChxdWVzdGlvbnNfZG93bik7XG5cdFx0aGFuZGxlU3RhdGVDaGFuZ2UoKTtcblx0fVxuXG5cdGxldCBmaWxlSW5wdXQ7XG5cblx0ZnVuY3Rpb24gaGFuZGxlRmlsZVNlbGVjdCgpIHtcblx0XHRjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXG5cdFx0cmVhZGVyLm9ubG9hZCA9IChmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gYXN5bmMgZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRhd2FpdCBsb2FkWGQoZS50YXJnZXQucmVzdWx0KTtcblx0XHRcdFx0fSBjYXRjaChlcnIpIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0XHRcdFx0dGhyb3cgXCJVbmFibGUgdG8gcGFyc2UgZmlsZVwiO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH0pKGZpbGVJbnB1dC5maWxlc1swXSk7XG5cblx0XHQvLyBSZWFkIGluIHRoZSBpbWFnZSBmaWxlIGFzIGEgZGF0YSBVUkwuXG5cdFx0cmVhZGVyLnJlYWRBc1RleHQoZmlsZUlucHV0LmZpbGVzWzBdKTtcblx0fVxuXG5cdGxldCBpbnN0cnVjdGlvbnNWaXNpYmxlO1xuXG5cdGZ1bmN0aW9uIGhhbmRsZUluc3RydWN0aW9ucygpIHtcblx0XHQkJGludmFsaWRhdGUoMTEsIGluc3RydWN0aW9uc1Zpc2libGUgPSB0cnVlKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGluc3RydWN0aW9uc192aXNpYmxlX2JpbmRpbmcodmFsdWUpIHtcblx0XHRpbnN0cnVjdGlvbnNWaXNpYmxlID0gdmFsdWU7XG5cdFx0JCRpbnZhbGlkYXRlKDExLCBpbnN0cnVjdGlvbnNWaXNpYmxlKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlucHV0MF9pbnB1dF9oYW5kbGVyKCkge1xuXHRcdHRpdGxlID0gdGhpcy52YWx1ZTtcblx0XHQkJGludmFsaWRhdGUoMiwgdGl0bGUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5wdXQxX2lucHV0X2hhbmRsZXIoKSB7XG5cdFx0YXV0aG9yID0gdGhpcy52YWx1ZTtcblx0XHQkJGludmFsaWRhdGUoMywgYXV0aG9yKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlucHV0Ml9pbnB1dF9oYW5kbGVyKCkge1xuXHRcdGVkaXRvciA9IHRoaXMudmFsdWU7XG5cdFx0JCRpbnZhbGlkYXRlKDQsIGVkaXRvcik7XG5cdH1cblxuXHRmdW5jdGlvbiBpbnB1dDNfaW5wdXRfaGFuZGxlcigpIHtcblx0XHRkYXRlID0gdGhpcy52YWx1ZTtcblx0XHQkJGludmFsaWRhdGUoNSwgZGF0ZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBpbnB1dDRfaW5wdXRfaGFuZGxlcigpIHtcblx0XHRzaXplID0gdG9fbnVtYmVyKHRoaXMudmFsdWUpO1xuXHRcdCQkaW52YWxpZGF0ZSg5LCBzaXplKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdyaWRfMV9iaW5kaW5nKCQkdmFsdWUpIHtcblx0XHRiaW5kaW5nX2NhbGxiYWNrc1skJHZhbHVlID8gJ3Vuc2hpZnQnIDogJ3B1c2gnXSgoKSA9PiB7XG5cdFx0XHRncmlkQ29tcG9uZW50ID0gJCR2YWx1ZTtcblx0XHRcdCQkaW52YWxpZGF0ZSg3LCBncmlkQ29tcG9uZW50KTtcblx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdyaWRfMV9Db250YWluZXJfYmluZGluZyh2YWx1ZSkge1xuXHRcdGdyaWRDb21wb25lbnRDb250YWluZXIgPSB2YWx1ZTtcblx0XHQkJGludmFsaWRhdGUoOCwgZ3JpZENvbXBvbmVudENvbnRhaW5lcik7XG5cdH1cblxuXHRmdW5jdGlvbiBpbnB1dDVfYmluZGluZygkJHZhbHVlKSB7XG5cdFx0YmluZGluZ19jYWxsYmFja3NbJCR2YWx1ZSA/ICd1bnNoaWZ0JyA6ICdwdXNoJ10oKCkgPT4ge1xuXHRcdFx0ZmlsZUlucHV0ID0gJCR2YWx1ZTtcblx0XHRcdCQkaW52YWxpZGF0ZSgxMCwgZmlsZUlucHV0KTtcblx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIHRleHRhcmVhX2lucHV0X2hhbmRsZXIoKSB7XG5cdFx0eGQgPSB0aGlzLnZhbHVlO1xuXHRcdCQkaW52YWxpZGF0ZSgwLCB4ZCk7XG5cdH1cblxuXHQkJHNlbGYuJCRzZXQgPSAkJHByb3BzID0+IHtcblx0XHRpZiAoJ3hkJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoMCwgeGQgPSAkJHByb3BzLnhkKTtcblx0XHRpZiAoJ2dyaWQnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSgxLCBncmlkID0gJCRwcm9wcy5ncmlkKTtcblx0XHRpZiAoJ3RpdGxlJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoMiwgdGl0bGUgPSAkJHByb3BzLnRpdGxlKTtcblx0XHRpZiAoJ2F1dGhvcicgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDMsIGF1dGhvciA9ICQkcHJvcHMuYXV0aG9yKTtcblx0XHRpZiAoJ2VkaXRvcicgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDQsIGVkaXRvciA9ICQkcHJvcHMuZWRpdG9yKTtcblx0XHRpZiAoJ2RhdGUnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSg1LCBkYXRlID0gJCRwcm9wcy5kYXRlKTtcblx0XHRpZiAoJ2Rpc3BsYXlYZCcgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDYsIGRpc3BsYXlYZCA9ICQkcHJvcHMuZGlzcGxheVhkKTtcblx0fTtcblxuXHRyZXR1cm4gW1xuXHRcdHhkLFxuXHRcdGdyaWQsXG5cdFx0dGl0bGUsXG5cdFx0YXV0aG9yLFxuXHRcdGVkaXRvcixcblx0XHRkYXRlLFxuXHRcdGRpc3BsYXlYZCxcblx0XHRncmlkQ29tcG9uZW50LFxuXHRcdGdyaWRDb21wb25lbnRDb250YWluZXIsXG5cdFx0c2l6ZSxcblx0XHRmaWxlSW5wdXQsXG5cdFx0aW5zdHJ1Y3Rpb25zVmlzaWJsZSxcblx0XHRoYW5kbGVNb3ZlLFxuXHRcdGhhbmRsZUxldHRlcixcblx0XHRoYW5kbGVFbnRlcixcblx0XHRoYW5kbGVCYWNrc3BhY2UsXG5cdFx0aGFuZGxlU3RhdGVDaGFuZ2UsXG5cdFx0aGFuZGxlUmVzZXQsXG5cdFx0aGFuZGxlRmlsZVNlbGVjdCxcblx0XHRoYW5kbGVJbnN0cnVjdGlvbnMsXG5cdFx0c2F2ZV9zdGF0ZSxcblx0XHRpbnN0cnVjdGlvbnNfdmlzaWJsZV9iaW5kaW5nLFxuXHRcdGlucHV0MF9pbnB1dF9oYW5kbGVyLFxuXHRcdGlucHV0MV9pbnB1dF9oYW5kbGVyLFxuXHRcdGlucHV0Ml9pbnB1dF9oYW5kbGVyLFxuXHRcdGlucHV0M19pbnB1dF9oYW5kbGVyLFxuXHRcdGlucHV0NF9pbnB1dF9oYW5kbGVyLFxuXHRcdGdyaWRfMV9iaW5kaW5nLFxuXHRcdGdyaWRfMV9Db250YWluZXJfYmluZGluZyxcblx0XHRpbnB1dDVfYmluZGluZyxcblx0XHR0ZXh0YXJlYV9pbnB1dF9oYW5kbGVyXG5cdF07XG59XG5cbmNsYXNzIEpYV29yZENyZWF0b3IgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuXHRjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG5cdFx0c3VwZXIoKTtcblxuXHRcdGluaXQoXG5cdFx0XHR0aGlzLFxuXHRcdFx0b3B0aW9ucyxcblx0XHRcdGluc3RhbmNlLFxuXHRcdFx0Y3JlYXRlX2ZyYWdtZW50LFxuXHRcdFx0c2FmZV9ub3RfZXF1YWwsXG5cdFx0XHR7XG5cdFx0XHRcdHNhdmVfc3RhdGU6IDIwLFxuXHRcdFx0XHR4ZDogMCxcblx0XHRcdFx0Z3JpZDogMSxcblx0XHRcdFx0dGl0bGU6IDIsXG5cdFx0XHRcdGF1dGhvcjogMyxcblx0XHRcdFx0ZWRpdG9yOiA0LFxuXHRcdFx0XHRkYXRlOiA1LFxuXHRcdFx0XHRkaXNwbGF5WGQ6IDZcblx0XHRcdH0sXG5cdFx0XHRudWxsLFxuXHRcdFx0Wy0xLCAtMV1cblx0XHQpO1xuXHR9XG5cblx0Z2V0IHNhdmVfc3RhdGUoKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzIwXTtcblx0fVxufVxuXG5mdW5jdGlvbiBkaXN0ICh0YXJnZXQsIHByb3BzKSB7XG4gICAgcmV0dXJuIG5ldyBKWFdvcmRDcmVhdG9yKHtcbiAgICAgICAgdGFyZ2V0LFxuICAgICAgICBwcm9wc1xuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRpc3Q7XG4iLCIvLyBleHRyYWN0ZWQgYnkgbWluaS1jc3MtZXh0cmFjdC1wbHVnaW5cbmV4cG9ydCB7fTsiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiY29uc3QgQ3JlYXRvciA9IHJlcXVpcmUoXCJqeHdvcmQtY3JlYXRvci9kaXN0L2p4d29yZGNyZWF0b3IuanNcIik7XG5yZXF1aXJlKFwianh3b3JkLWNyZWF0b3IvZGlzdC9kaXN0LmNzc1wiKTtcbmNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjcm9zc3dvcmRlbmdpbmUtY3JlYXRvci1jb250YWluZXJcIik7XG5jb25zdCBwcm9wcyA9IHtcbiAgICBzYXZlX3N0YXRlOiBmYWxzZSxcbn07XG5pZiAodHlwZW9mIHhkICE9PSAndW5kZWZpbmVkJykge1xuICAgIHByb3BzLnhkID0geGQ7XG59XG5DcmVhdG9yKGVsLCBwcm9wcyk7Il0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9