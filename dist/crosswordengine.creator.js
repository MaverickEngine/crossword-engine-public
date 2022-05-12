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

// (84:4) {:else}
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

// (73:4) {#if question.editing}
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

// (86:4) {#if suggestions.length}
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

// (87:8) {#each suggestions as suggestion}
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

				if ($currentQuestion) {
					$$invalidate(2, is_current_question = $currentQuestion.num === question.num && $currentDirection === question.direction);
				}
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Jvc3N3b3JkZW5naW5lLmNyZWF0b3IuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNBLGtCQUFrQix3REFBd0QsK0JBQStCLGFBQWEscUdBQXFHLDJCQUEyQixrREFBa0Q7QUFDeFM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsdUJBQXVCO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLDZCQUE2QjtBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLCtDQUErQztBQUMzRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaURBQWlEO0FBQ2pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxHQUFHO0FBQ2QsV0FBVyxtQkFBbUI7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0NBQW9DLDZCQUE2QjtBQUNqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQzs7QUFFbkM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsdUVBQXVFO0FBQ3ZFO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLG9CQUFvQjtBQUN4QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsT0FBTztBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsV0FBVztBQUNYO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQVc7QUFDWDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047O0FBRUE7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQVc7QUFDWDtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxpQkFBaUIsdUJBQXVCO0FBQ3hDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLG1CQUFtQix3QkFBd0I7QUFDM0M7QUFDQTs7QUFFQTtBQUNBLEdBQUc7QUFDSDtBQUNBLG1CQUFtQix3QkFBd0I7QUFDM0M7QUFDQTs7QUFFQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxnQkFBZ0IsdUJBQXVCO0FBQ3ZDOztBQUVBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxXQUFXLHdCQUF3QjtBQUNuQztBQUNBOztBQUVBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQVc7QUFDWDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyx3QkFBd0I7QUFDL0IsT0FBTyxzQkFBc0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sWUFBWTs7QUFFbkI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHFCQUFxQixxQkFBcUI7QUFDMUM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGdDQUFnQyx5QkFBeUI7QUFDekQ7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsV0FBVztBQUNYO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxpQkFBaUIseUJBQXlCO0FBQzFDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEVBQUU7O0FBRUY7QUFDQTs7QUFFQSxpQkFBaUIsdUJBQXVCO0FBQ3hDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEVBQUU7O0FBRUY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxtQkFBbUIsMEJBQTBCO0FBQzdDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxtQkFBbUIsd0JBQXdCO0FBQzNDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1CQUFtQiwwQkFBMEI7QUFDN0M7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxtQkFBbUIsd0JBQXdCO0FBQzNDO0FBQ0E7O0FBRUE7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsZ0JBQWdCLHlCQUF5QjtBQUN6Qzs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBLGtDQUFrQywwQkFBMEI7QUFDNUQ7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxnQkFBZ0IsdUJBQXVCO0FBQ3ZDOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUEsZ0NBQWdDLHdCQUF3QjtBQUN4RDtBQUNBOztBQUVBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTs7QUFFQSxtQkFBbUIseUJBQXlCO0FBQzVDO0FBQ0E7O0FBRUEsbUJBQW1CLHVCQUF1QjtBQUMxQztBQUNBOztBQUVBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7O0FBRUEsbUJBQW1CLDBCQUEwQjtBQUM3QztBQUNBOztBQUVBOztBQUVBLG1CQUFtQix3QkFBd0I7QUFDM0M7QUFDQTs7QUFFQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEVBQUU7O0FBRUY7QUFDQTtBQUNBLEVBQUU7O0FBRUY7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx1RUFBdUU7QUFDdkU7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBOztBQUVBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGlCQUFpQix5QkFBeUI7QUFDMUM7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsbUJBQW1CLHdCQUF3QjtBQUMzQztBQUNBOztBQUVBO0FBQ0EsR0FBRztBQUNIO0FBQ0EsbUJBQW1CLHdCQUF3QjtBQUMzQztBQUNBOztBQUVBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGdCQUFnQix5QkFBeUI7QUFDekM7O0FBRUE7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQVcsd0JBQXdCO0FBQ25DO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGlCQUFpQix1QkFBdUI7QUFDeEM7QUFDQTs7QUFFQSw2QkFBNkI7QUFDN0I7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1CQUFtQix3QkFBd0I7QUFDM0M7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxtQkFBbUIsd0JBQXdCO0FBQzNDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxnQkFBZ0IsdUJBQXVCO0FBQ3ZDOztBQUVBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxXQUFXLHdCQUF3QjtBQUNuQztBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLFlBQVk7QUFDbkIsT0FBTyxRQUFRO0FBQ2YsT0FBTyxZQUFZO0FBQ25CLE9BQU8sWUFBWTtBQUNuQixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLG1CQUFtQjtBQUMxQixPQUFPLG9CQUFvQjtBQUMzQixPQUFPLHlCQUF5QjtBQUNoQyxPQUFPLHVCQUF1QjtBQUM5QixPQUFPLGFBQWE7QUFDcEIsT0FBTyw4QkFBOEI7QUFDckMsT0FBTyw4QkFBOEI7QUFDckMsT0FBTyx1QkFBdUI7QUFDOUIsT0FBTyw2QkFBNkI7QUFDcEM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLG1CQUFtQiw2QkFBNkI7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKLG1CQUFtQiwyQkFBMkI7QUFDOUM7QUFDQSxjQUFjO0FBQ2Q7O0FBRUE7QUFDQSxpRUFBaUUsb0NBQW9DO0FBQ3JHO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxRQUFRLE9BQU87QUFDZjs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxXQUFXO0FBQ1g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxXQUFXO0FBQ1g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSx5QkFBeUIsWUFBWTtBQUNyQztBQUNBO0FBQ0EsSUFBSTtBQUNKLHlCQUF5QixZQUFZO0FBQ3JDO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSwyQkFBMkIsVUFBVTtBQUNyQzs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSwyQkFBMkIsUUFBUTtBQUNuQzs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBLDJCQUEyQixVQUFVO0FBQ3JDOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBLDJCQUEyQixRQUFRO0FBQ25DOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFdBQVc7QUFDWDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQSxJQUFJO0FBQ0o7QUFDQSxJQUFJO0FBQ0o7QUFDQSxJQUFJO0FBQ0o7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFVBQVUsdUJBQXVCOztBQUVqQztBQUNBLG1CQUFtQix1QkFBdUI7QUFDMUM7QUFDQTtBQUNBLElBQUk7QUFDSixtQkFBbUIsdUJBQXVCO0FBQzFDO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHFCQUFxQixVQUFVO0FBQy9CO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxxQkFBcUIsaUJBQWlCO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxvQkFBb0IsVUFBVTtBQUM5QjtBQUNBO0FBQ0E7O0FBRUEscUJBQXFCLFVBQVU7QUFDL0I7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLE9BQU8sa0JBQWtCOztBQUV6QjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsdUVBQXVFLFlBQVk7QUFDbkY7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0EseUJBQXlCLFVBQVU7QUFDbkM7QUFDQTtBQUNBLDBCQUEwQixXQUFXO0FBQ3JDO0FBQ0E7QUFDQSwwQkFBMEIsV0FBVztBQUNyQztBQUNBO0FBQ0Esd0JBQXdCLHNCQUFzQjtBQUM5QztBQUNBO0FBQ0Esb0JBQW9CLHFCQUFxQjtBQUN6Qyx1QkFBdUIsd0JBQXdCO0FBQy9DLHNCQUFzQixlQUFlO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsTUFBTSxJQUFJLFlBQVksSUFBSSxTQUFTO0FBQ3REO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixNQUFNLElBQUksWUFBWSxJQUFJLFNBQVM7QUFDdEQ7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGtCQUFrQjtBQUM3QztBQUNBO0FBQ0E7QUFDQSw2RUFBNkUsYUFBYTtBQUMxRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixrQkFBa0I7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0Isa0JBQWtCO0FBQzFDO0FBQ0E7QUFDQSx1RUFBdUUsU0FBUztBQUNoRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxtQ0FBbUMsMkJBQTJCO0FBQzlEO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxxQkFBcUIscUJBQXFCO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLEtBQUs7QUFDWixPQUFPLDRDQUE0QztBQUNuRCxPQUFPLFFBQVE7QUFDZixPQUFPLFNBQVM7QUFDaEIsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sT0FBTztBQUNkLE9BQU8sbUJBQW1COztBQUUxQjtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsUUFBUSw2QkFBNkI7O0FBRXJDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFFBQVEsT0FBTztBQUNmOztBQUVBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBOztBQUVBO0FBQ0EsUUFBUSxPQUFPO0FBQ2Y7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxRQUFRLE9BQU87QUFDZjs7QUFFQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFOztBQUVGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSwrREFBK0QsYUFBYTs7QUFFNUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsNkRBQTZELGFBQWE7O0FBRTFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUE7Ozs7Ozs7Ozs7Ozs7QUNubUhBOzs7Ozs7O1VDQUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7O0FDTkEsZ0JBQWdCLG1CQUFPLENBQUMsaUdBQXNDO0FBQzlELG1CQUFPLENBQUMsaUZBQThCO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUIiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vbm9kZV9tb2R1bGVzL2p4d29yZC1jcmVhdG9yL2Rpc3Qvanh3b3JkY3JlYXRvci5qcyIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vbm9kZV9tb2R1bGVzL2p4d29yZC1jcmVhdG9yL2Rpc3QvZGlzdC5jc3M/Zjc4MCIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vc3JjL2NyZWF0b3IuanMiXSwic291cmNlc0NvbnRlbnQiOlsiXG4oZnVuY3Rpb24obCwgcikgeyBpZiAoIWwgfHwgbC5nZXRFbGVtZW50QnlJZCgnbGl2ZXJlbG9hZHNjcmlwdCcpKSByZXR1cm47IHIgPSBsLmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpOyByLmFzeW5jID0gMTsgci5zcmMgPSAnLy8nICsgKHNlbGYubG9jYXRpb24uaG9zdCB8fCAnbG9jYWxob3N0Jykuc3BsaXQoJzonKVswXSArICc6MzU3MjkvbGl2ZXJlbG9hZC5qcz9zbmlwdmVyPTEnOyByLmlkID0gJ2xpdmVyZWxvYWRzY3JpcHQnOyBsLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQocikgfSkoc2VsZi5kb2N1bWVudCk7XG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7IH1cbmZ1bmN0aW9uIHJ1bihmbikge1xuICAgIHJldHVybiBmbigpO1xufVxuZnVuY3Rpb24gYmxhbmtfb2JqZWN0KCkge1xuICAgIHJldHVybiBPYmplY3QuY3JlYXRlKG51bGwpO1xufVxuZnVuY3Rpb24gcnVuX2FsbChmbnMpIHtcbiAgICBmbnMuZm9yRWFjaChydW4pO1xufVxuZnVuY3Rpb24gaXNfZnVuY3Rpb24odGhpbmcpIHtcbiAgICByZXR1cm4gdHlwZW9mIHRoaW5nID09PSAnZnVuY3Rpb24nO1xufVxuZnVuY3Rpb24gc2FmZV9ub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiIHx8ICgoYSAmJiB0eXBlb2YgYSA9PT0gJ29iamVjdCcpIHx8IHR5cGVvZiBhID09PSAnZnVuY3Rpb24nKTtcbn1cbmZ1bmN0aW9uIGlzX2VtcHR5KG9iaikge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMDtcbn1cbmZ1bmN0aW9uIHN1YnNjcmliZShzdG9yZSwgLi4uY2FsbGJhY2tzKSB7XG4gICAgaWYgKHN0b3JlID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgfVxuICAgIGNvbnN0IHVuc3ViID0gc3RvcmUuc3Vic2NyaWJlKC4uLmNhbGxiYWNrcyk7XG4gICAgcmV0dXJuIHVuc3ViLnVuc3Vic2NyaWJlID8gKCkgPT4gdW5zdWIudW5zdWJzY3JpYmUoKSA6IHVuc3ViO1xufVxuZnVuY3Rpb24gY29tcG9uZW50X3N1YnNjcmliZShjb21wb25lbnQsIHN0b3JlLCBjYWxsYmFjaykge1xuICAgIGNvbXBvbmVudC4kJC5vbl9kZXN0cm95LnB1c2goc3Vic2NyaWJlKHN0b3JlLCBjYWxsYmFjaykpO1xufVxuZnVuY3Rpb24gc2V0X3N0b3JlX3ZhbHVlKHN0b3JlLCByZXQsIHZhbHVlKSB7XG4gICAgc3RvcmUuc2V0KHZhbHVlKTtcbiAgICByZXR1cm4gcmV0O1xufVxuZnVuY3Rpb24gYXBwZW5kKHRhcmdldCwgbm9kZSkge1xuICAgIHRhcmdldC5hcHBlbmRDaGlsZChub2RlKTtcbn1cbmZ1bmN0aW9uIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgYW5jaG9yIHx8IG51bGwpO1xufVxuZnVuY3Rpb24gZGV0YWNoKG5vZGUpIHtcbiAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2VhY2goaXRlcmF0aW9ucywgZGV0YWNoaW5nKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVyYXRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChpdGVyYXRpb25zW2ldKVxuICAgICAgICAgICAgaXRlcmF0aW9uc1tpXS5kKGRldGFjaGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XG59XG5mdW5jdGlvbiBzdmdfZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBuYW1lKTtcbn1cbmZ1bmN0aW9uIHRleHQoZGF0YSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKTtcbn1cbmZ1bmN0aW9uIHNwYWNlKCkge1xuICAgIHJldHVybiB0ZXh0KCcgJyk7XG59XG5mdW5jdGlvbiBlbXB0eSgpIHtcbiAgICByZXR1cm4gdGV4dCgnJyk7XG59XG5mdW5jdGlvbiBsaXN0ZW4obm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpIHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgIHJldHVybiAoKSA9PiBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xufVxuZnVuY3Rpb24gYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZSk7XG4gICAgZWxzZSBpZiAobm9kZS5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKSAhPT0gdmFsdWUpXG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZSwgdmFsdWUpO1xufVxuZnVuY3Rpb24gdG9fbnVtYmVyKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSAnJyA/IG51bGwgOiArdmFsdWU7XG59XG5mdW5jdGlvbiBjaGlsZHJlbihlbGVtZW50KSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oZWxlbWVudC5jaGlsZE5vZGVzKTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhKHRleHQsIGRhdGEpIHtcbiAgICBkYXRhID0gJycgKyBkYXRhO1xuICAgIGlmICh0ZXh0Lndob2xlVGV4dCAhPT0gZGF0YSlcbiAgICAgICAgdGV4dC5kYXRhID0gZGF0YTtcbn1cbmZ1bmN0aW9uIHNldF9pbnB1dF92YWx1ZShpbnB1dCwgdmFsdWUpIHtcbiAgICBpbnB1dC52YWx1ZSA9IHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlO1xufVxuZnVuY3Rpb24gc2V0X3N0eWxlKG5vZGUsIGtleSwgdmFsdWUsIGltcG9ydGFudCkge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICBub2RlLnN0eWxlLnJlbW92ZVByb3BlcnR5KGtleSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBub2RlLnN0eWxlLnNldFByb3BlcnR5KGtleSwgdmFsdWUsIGltcG9ydGFudCA/ICdpbXBvcnRhbnQnIDogJycpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRvZ2dsZV9jbGFzcyhlbGVtZW50LCBuYW1lLCB0b2dnbGUpIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdFt0b2dnbGUgPyAnYWRkJyA6ICdyZW1vdmUnXShuYW1lKTtcbn1cbmZ1bmN0aW9uIGN1c3RvbV9ldmVudCh0eXBlLCBkZXRhaWwsIGJ1YmJsZXMgPSBmYWxzZSkge1xuICAgIGNvbnN0IGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgICBlLmluaXRDdXN0b21FdmVudCh0eXBlLCBidWJibGVzLCBmYWxzZSwgZGV0YWlsKTtcbiAgICByZXR1cm4gZTtcbn1cblxubGV0IGN1cnJlbnRfY29tcG9uZW50O1xuZnVuY3Rpb24gc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCkge1xuICAgIGN1cnJlbnRfY29tcG9uZW50ID0gY29tcG9uZW50O1xufVxuZnVuY3Rpb24gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkge1xuICAgIGlmICghY3VycmVudF9jb21wb25lbnQpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRnVuY3Rpb24gY2FsbGVkIG91dHNpZGUgY29tcG9uZW50IGluaXRpYWxpemF0aW9uJyk7XG4gICAgcmV0dXJuIGN1cnJlbnRfY29tcG9uZW50O1xufVxuZnVuY3Rpb24gb25Nb3VudChmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX21vdW50LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCkge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgIHJldHVybiAodHlwZSwgZGV0YWlsKSA9PiB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbdHlwZV07XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gYXJlIHRoZXJlIHNpdHVhdGlvbnMgd2hlcmUgZXZlbnRzIGNvdWxkIGJlIGRpc3BhdGNoZWRcbiAgICAgICAgICAgIC8vIGluIGEgc2VydmVyIChub24tRE9NKSBlbnZpcm9ubWVudD9cbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCk7XG4gICAgICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IHtcbiAgICAgICAgICAgICAgICBmbi5jYWxsKGNvbXBvbmVudCwgZXZlbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuLy8gVE9ETyBmaWd1cmUgb3V0IGlmIHdlIHN0aWxsIHdhbnQgdG8gc3VwcG9ydFxuLy8gc2hvcnRoYW5kIGV2ZW50cywgb3IgaWYgd2Ugd2FudCB0byBpbXBsZW1lbnRcbi8vIGEgcmVhbCBidWJibGluZyBtZWNoYW5pc21cbmZ1bmN0aW9uIGJ1YmJsZShjb21wb25lbnQsIGV2ZW50KSB7XG4gICAgY29uc3QgY2FsbGJhY2tzID0gY29tcG9uZW50LiQkLmNhbGxiYWNrc1tldmVudC50eXBlXTtcbiAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY2FsbGJhY2tzLnNsaWNlKCkuZm9yRWFjaChmbiA9PiBmbi5jYWxsKHRoaXMsIGV2ZW50KSk7XG4gICAgfVxufVxuXG5jb25zdCBkaXJ0eV9jb21wb25lbnRzID0gW107XG5jb25zdCBiaW5kaW5nX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgcmVuZGVyX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgZmx1c2hfY2FsbGJhY2tzID0gW107XG5jb25zdCByZXNvbHZlZF9wcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5sZXQgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xuZnVuY3Rpb24gc2NoZWR1bGVfdXBkYXRlKCkge1xuICAgIGlmICghdXBkYXRlX3NjaGVkdWxlZCkge1xuICAgICAgICB1cGRhdGVfc2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgICAgcmVzb2x2ZWRfcHJvbWlzZS50aGVuKGZsdXNoKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0aWNrKCkge1xuICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgIHJldHVybiByZXNvbHZlZF9wcm9taXNlO1xufVxuZnVuY3Rpb24gYWRkX3JlbmRlcl9jYWxsYmFjayhmbikge1xuICAgIHJlbmRlcl9jYWxsYmFja3MucHVzaChmbik7XG59XG5mdW5jdGlvbiBhZGRfZmx1c2hfY2FsbGJhY2soZm4pIHtcbiAgICBmbHVzaF9jYWxsYmFja3MucHVzaChmbik7XG59XG4vLyBmbHVzaCgpIGNhbGxzIGNhbGxiYWNrcyBpbiB0aGlzIG9yZGVyOlxuLy8gMS4gQWxsIGJlZm9yZVVwZGF0ZSBjYWxsYmFja3MsIGluIG9yZGVyOiBwYXJlbnRzIGJlZm9yZSBjaGlsZHJlblxuLy8gMi4gQWxsIGJpbmQ6dGhpcyBjYWxsYmFja3MsIGluIHJldmVyc2Ugb3JkZXI6IGNoaWxkcmVuIGJlZm9yZSBwYXJlbnRzLlxuLy8gMy4gQWxsIGFmdGVyVXBkYXRlIGNhbGxiYWNrcywgaW4gb3JkZXI6IHBhcmVudHMgYmVmb3JlIGNoaWxkcmVuLiBFWENFUFRcbi8vICAgIGZvciBhZnRlclVwZGF0ZXMgY2FsbGVkIGR1cmluZyB0aGUgaW5pdGlhbCBvbk1vdW50LCB3aGljaCBhcmUgY2FsbGVkIGluXG4vLyAgICByZXZlcnNlIG9yZGVyOiBjaGlsZHJlbiBiZWZvcmUgcGFyZW50cy5cbi8vIFNpbmNlIGNhbGxiYWNrcyBtaWdodCB1cGRhdGUgY29tcG9uZW50IHZhbHVlcywgd2hpY2ggY291bGQgdHJpZ2dlciBhbm90aGVyXG4vLyBjYWxsIHRvIGZsdXNoKCksIHRoZSBmb2xsb3dpbmcgc3RlcHMgZ3VhcmQgYWdhaW5zdCB0aGlzOlxuLy8gMS4gRHVyaW5nIGJlZm9yZVVwZGF0ZSwgYW55IHVwZGF0ZWQgY29tcG9uZW50cyB3aWxsIGJlIGFkZGVkIHRvIHRoZVxuLy8gICAgZGlydHlfY29tcG9uZW50cyBhcnJheSBhbmQgd2lsbCBjYXVzZSBhIHJlZW50cmFudCBjYWxsIHRvIGZsdXNoKCkuIEJlY2F1c2Vcbi8vICAgIHRoZSBmbHVzaCBpbmRleCBpcyBrZXB0IG91dHNpZGUgdGhlIGZ1bmN0aW9uLCB0aGUgcmVlbnRyYW50IGNhbGwgd2lsbCBwaWNrXG4vLyAgICB1cCB3aGVyZSB0aGUgZWFybGllciBjYWxsIGxlZnQgb2ZmIGFuZCBnbyB0aHJvdWdoIGFsbCBkaXJ0eSBjb21wb25lbnRzLiBUaGVcbi8vICAgIGN1cnJlbnRfY29tcG9uZW50IHZhbHVlIGlzIHNhdmVkIGFuZCByZXN0b3JlZCBzbyB0aGF0IHRoZSByZWVudHJhbnQgY2FsbCB3aWxsXG4vLyAgICBub3QgaW50ZXJmZXJlIHdpdGggdGhlIFwicGFyZW50XCIgZmx1c2goKSBjYWxsLlxuLy8gMi4gYmluZDp0aGlzIGNhbGxiYWNrcyBjYW5ub3QgdHJpZ2dlciBuZXcgZmx1c2goKSBjYWxscy5cbi8vIDMuIER1cmluZyBhZnRlclVwZGF0ZSwgYW55IHVwZGF0ZWQgY29tcG9uZW50cyB3aWxsIE5PVCBoYXZlIHRoZWlyIGFmdGVyVXBkYXRlXG4vLyAgICBjYWxsYmFjayBjYWxsZWQgYSBzZWNvbmQgdGltZTsgdGhlIHNlZW5fY2FsbGJhY2tzIHNldCwgb3V0c2lkZSB0aGUgZmx1c2goKVxuLy8gICAgZnVuY3Rpb24sIGd1YXJhbnRlZXMgdGhpcyBiZWhhdmlvci5cbmNvbnN0IHNlZW5fY2FsbGJhY2tzID0gbmV3IFNldCgpO1xubGV0IGZsdXNoaWR4ID0gMDsgLy8gRG8gKm5vdCogbW92ZSB0aGlzIGluc2lkZSB0aGUgZmx1c2goKSBmdW5jdGlvblxuZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgY29uc3Qgc2F2ZWRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgZG8ge1xuICAgICAgICAvLyBmaXJzdCwgY2FsbCBiZWZvcmVVcGRhdGUgZnVuY3Rpb25zXG4gICAgICAgIC8vIGFuZCB1cGRhdGUgY29tcG9uZW50c1xuICAgICAgICB3aGlsZSAoZmx1c2hpZHggPCBkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gZGlydHlfY29tcG9uZW50c1tmbHVzaGlkeF07XG4gICAgICAgICAgICBmbHVzaGlkeCsrO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgICAgICAgICB1cGRhdGUoY29tcG9uZW50LiQkKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQobnVsbCk7XG4gICAgICAgIGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoID0gMDtcbiAgICAgICAgZmx1c2hpZHggPSAwO1xuICAgICAgICB3aGlsZSAoYmluZGluZ19jYWxsYmFja3MubGVuZ3RoKVxuICAgICAgICAgICAgYmluZGluZ19jYWxsYmFja3MucG9wKCkoKTtcbiAgICAgICAgLy8gdGhlbiwgb25jZSBjb21wb25lbnRzIGFyZSB1cGRhdGVkLCBjYWxsXG4gICAgICAgIC8vIGFmdGVyVXBkYXRlIGZ1bmN0aW9ucy4gVGhpcyBtYXkgY2F1c2VcbiAgICAgICAgLy8gc3Vic2VxdWVudCB1cGRhdGVzLi4uXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVuZGVyX2NhbGxiYWNrcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2sgPSByZW5kZXJfY2FsbGJhY2tzW2ldO1xuICAgICAgICAgICAgaWYgKCFzZWVuX2NhbGxiYWNrcy5oYXMoY2FsbGJhY2spKSB7XG4gICAgICAgICAgICAgICAgLy8gLi4uc28gZ3VhcmQgYWdhaW5zdCBpbmZpbml0ZSBsb29wc1xuICAgICAgICAgICAgICAgIHNlZW5fY2FsbGJhY2tzLmFkZChjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZW5kZXJfY2FsbGJhY2tzLmxlbmd0aCA9IDA7XG4gICAgfSB3aGlsZSAoZGlydHlfY29tcG9uZW50cy5sZW5ndGgpO1xuICAgIHdoaWxlIChmbHVzaF9jYWxsYmFja3MubGVuZ3RoKSB7XG4gICAgICAgIGZsdXNoX2NhbGxiYWNrcy5wb3AoKSgpO1xuICAgIH1cbiAgICB1cGRhdGVfc2NoZWR1bGVkID0gZmFsc2U7XG4gICAgc2Vlbl9jYWxsYmFja3MuY2xlYXIoKTtcbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQoc2F2ZWRfY29tcG9uZW50KTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZSgkJCkge1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAkJC51cGRhdGUoKTtcbiAgICAgICAgcnVuX2FsbCgkJC5iZWZvcmVfdXBkYXRlKTtcbiAgICAgICAgY29uc3QgZGlydHkgPSAkJC5kaXJ0eTtcbiAgICAgICAgJCQuZGlydHkgPSBbLTFdO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5wKCQkLmN0eCwgZGlydHkpO1xuICAgICAgICAkJC5hZnRlcl91cGRhdGUuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbiAgICB9XG59XG5jb25zdCBvdXRyb2luZyA9IG5ldyBTZXQoKTtcbmxldCBvdXRyb3M7XG5mdW5jdGlvbiBncm91cF9vdXRyb3MoKSB7XG4gICAgb3V0cm9zID0ge1xuICAgICAgICByOiAwLFxuICAgICAgICBjOiBbXSxcbiAgICAgICAgcDogb3V0cm9zIC8vIHBhcmVudCBncm91cFxuICAgIH07XG59XG5mdW5jdGlvbiBjaGVja19vdXRyb3MoKSB7XG4gICAgaWYgKCFvdXRyb3Mucikge1xuICAgICAgICBydW5fYWxsKG91dHJvcy5jKTtcbiAgICB9XG4gICAgb3V0cm9zID0gb3V0cm9zLnA7XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uX2luKGJsb2NrLCBsb2NhbCkge1xuICAgIGlmIChibG9jayAmJiBibG9jay5pKSB7XG4gICAgICAgIG91dHJvaW5nLmRlbGV0ZShibG9jayk7XG4gICAgICAgIGJsb2NrLmkobG9jYWwpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25fb3V0KGJsb2NrLCBsb2NhbCwgZGV0YWNoLCBjYWxsYmFjaykge1xuICAgIGlmIChibG9jayAmJiBibG9jay5vKSB7XG4gICAgICAgIGlmIChvdXRyb2luZy5oYXMoYmxvY2spKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBvdXRyb2luZy5hZGQoYmxvY2spO1xuICAgICAgICBvdXRyb3MuYy5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgIG91dHJvaW5nLmRlbGV0ZShibG9jayk7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoZGV0YWNoKVxuICAgICAgICAgICAgICAgICAgICBibG9jay5kKDEpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBibG9jay5vKGxvY2FsKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGJpbmQoY29tcG9uZW50LCBuYW1lLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGluZGV4ID0gY29tcG9uZW50LiQkLnByb3BzW25hbWVdO1xuICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbXBvbmVudC4kJC5ib3VuZFtpbmRleF0gPSBjYWxsYmFjaztcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50LiQkLmN0eFtpbmRleF0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNyZWF0ZV9jb21wb25lbnQoYmxvY2spIHtcbiAgICBibG9jayAmJiBibG9jay5jKCk7XG59XG5mdW5jdGlvbiBtb3VudF9jb21wb25lbnQoY29tcG9uZW50LCB0YXJnZXQsIGFuY2hvciwgY3VzdG9tRWxlbWVudCkge1xuICAgIGNvbnN0IHsgZnJhZ21lbnQsIG9uX21vdW50LCBvbl9kZXN0cm95LCBhZnRlcl91cGRhdGUgfSA9IGNvbXBvbmVudC4kJDtcbiAgICBmcmFnbWVudCAmJiBmcmFnbWVudC5tKHRhcmdldCwgYW5jaG9yKTtcbiAgICBpZiAoIWN1c3RvbUVsZW1lbnQpIHtcbiAgICAgICAgLy8gb25Nb3VudCBoYXBwZW5zIGJlZm9yZSB0aGUgaW5pdGlhbCBhZnRlclVwZGF0ZVxuICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5ld19vbl9kZXN0cm95ID0gb25fbW91bnQubWFwKHJ1bikuZmlsdGVyKGlzX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGlmIChvbl9kZXN0cm95KSB7XG4gICAgICAgICAgICAgICAgb25fZGVzdHJveS5wdXNoKC4uLm5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEVkZ2UgY2FzZSAtIGNvbXBvbmVudCB3YXMgZGVzdHJveWVkIGltbWVkaWF0ZWx5LFxuICAgICAgICAgICAgICAgIC8vIG1vc3QgbGlrZWx5IGFzIGEgcmVzdWx0IG9mIGEgYmluZGluZyBpbml0aWFsaXNpbmdcbiAgICAgICAgICAgICAgICBydW5fYWxsKG5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbXBvbmVudC4kJC5vbl9tb3VudCA9IFtdO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2NvbXBvbmVudChjb21wb25lbnQsIGRldGFjaGluZykge1xuICAgIGNvbnN0ICQkID0gY29tcG9uZW50LiQkO1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICBydW5fYWxsKCQkLm9uX2Rlc3Ryb3kpO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5kKGRldGFjaGluZyk7XG4gICAgICAgIC8vIFRPRE8gbnVsbCBvdXQgb3RoZXIgcmVmcywgaW5jbHVkaW5nIGNvbXBvbmVudC4kJCAoYnV0IG5lZWQgdG9cbiAgICAgICAgLy8gcHJlc2VydmUgZmluYWwgc3RhdGU/KVxuICAgICAgICAkJC5vbl9kZXN0cm95ID0gJCQuZnJhZ21lbnQgPSBudWxsO1xuICAgICAgICAkJC5jdHggPSBbXTtcbiAgICB9XG59XG5mdW5jdGlvbiBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSkge1xuICAgIGlmIChjb21wb25lbnQuJCQuZGlydHlbMF0gPT09IC0xKSB7XG4gICAgICAgIGRpcnR5X2NvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICAgICAgICBzY2hlZHVsZV91cGRhdGUoKTtcbiAgICAgICAgY29tcG9uZW50LiQkLmRpcnR5LmZpbGwoMCk7XG4gICAgfVxuICAgIGNvbXBvbmVudC4kJC5kaXJ0eVsoaSAvIDMxKSB8IDBdIHw9ICgxIDw8IChpICUgMzEpKTtcbn1cbmZ1bmN0aW9uIGluaXQoY29tcG9uZW50LCBvcHRpb25zLCBpbnN0YW5jZSwgY3JlYXRlX2ZyYWdtZW50LCBub3RfZXF1YWwsIHByb3BzLCBhcHBlbmRfc3R5bGVzLCBkaXJ0eSA9IFstMV0pIHtcbiAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQgPSB7XG4gICAgICAgIGZyYWdtZW50OiBudWxsLFxuICAgICAgICBjdHg6IG51bGwsXG4gICAgICAgIC8vIHN0YXRlXG4gICAgICAgIHByb3BzLFxuICAgICAgICB1cGRhdGU6IG5vb3AsXG4gICAgICAgIG5vdF9lcXVhbCxcbiAgICAgICAgYm91bmQ6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICAvLyBsaWZlY3ljbGVcbiAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICBvbl9kZXN0cm95OiBbXSxcbiAgICAgICAgb25fZGlzY29ubmVjdDogW10sXG4gICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICBhZnRlcl91cGRhdGU6IFtdLFxuICAgICAgICBjb250ZXh0OiBuZXcgTWFwKG9wdGlvbnMuY29udGV4dCB8fCAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSksXG4gICAgICAgIC8vIGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICBjYWxsYmFja3M6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICBkaXJ0eSxcbiAgICAgICAgc2tpcF9ib3VuZDogZmFsc2UsXG4gICAgICAgIHJvb3Q6IG9wdGlvbnMudGFyZ2V0IHx8IHBhcmVudF9jb21wb25lbnQuJCQucm9vdFxuICAgIH07XG4gICAgYXBwZW5kX3N0eWxlcyAmJiBhcHBlbmRfc3R5bGVzKCQkLnJvb3QpO1xuICAgIGxldCByZWFkeSA9IGZhbHNlO1xuICAgICQkLmN0eCA9IGluc3RhbmNlXG4gICAgICAgID8gaW5zdGFuY2UoY29tcG9uZW50LCBvcHRpb25zLnByb3BzIHx8IHt9LCAoaSwgcmV0LCAuLi5yZXN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHJlc3QubGVuZ3RoID8gcmVzdFswXSA6IHJldDtcbiAgICAgICAgICAgIGlmICgkJC5jdHggJiYgbm90X2VxdWFsKCQkLmN0eFtpXSwgJCQuY3R4W2ldID0gdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEkJC5za2lwX2JvdW5kICYmICQkLmJvdW5kW2ldKVxuICAgICAgICAgICAgICAgICAgICAkJC5ib3VuZFtpXSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlYWR5KVxuICAgICAgICAgICAgICAgICAgICBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9KVxuICAgICAgICA6IFtdO1xuICAgICQkLnVwZGF0ZSgpO1xuICAgIHJlYWR5ID0gdHJ1ZTtcbiAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgIC8vIGBmYWxzZWAgYXMgYSBzcGVjaWFsIGNhc2Ugb2Ygbm8gRE9NIGNvbXBvbmVudFxuICAgICQkLmZyYWdtZW50ID0gY3JlYXRlX2ZyYWdtZW50ID8gY3JlYXRlX2ZyYWdtZW50KCQkLmN0eCkgOiBmYWxzZTtcbiAgICBpZiAob3B0aW9ucy50YXJnZXQpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaHlkcmF0ZSkge1xuICAgICAgICAgICAgY29uc3Qgbm9kZXMgPSBjaGlsZHJlbihvcHRpb25zLnRhcmdldCk7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQubChub2Rlcyk7XG4gICAgICAgICAgICBub2Rlcy5mb3JFYWNoKGRldGFjaCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQuYygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmludHJvKVxuICAgICAgICAgICAgdHJhbnNpdGlvbl9pbihjb21wb25lbnQuJCQuZnJhZ21lbnQpO1xuICAgICAgICBtb3VudF9jb21wb25lbnQoY29tcG9uZW50LCBvcHRpb25zLnRhcmdldCwgb3B0aW9ucy5hbmNob3IsIG9wdGlvbnMuY3VzdG9tRWxlbWVudCk7XG4gICAgICAgIGZsdXNoKCk7XG4gICAgfVxuICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChwYXJlbnRfY29tcG9uZW50KTtcbn1cbi8qKlxuICogQmFzZSBjbGFzcyBmb3IgU3ZlbHRlIGNvbXBvbmVudHMuIFVzZWQgd2hlbiBkZXY9ZmFsc2UuXG4gKi9cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgJGRlc3Ryb3koKSB7XG4gICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KHRoaXMsIDEpO1xuICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICB9XG4gICAgJG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSB8fCAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gPSBbXSkpO1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgICRzZXQoJCRwcm9wcykge1xuICAgICAgICBpZiAodGhpcy4kJHNldCAmJiAhaXNfZW1wdHkoJCRwcm9wcykpIHtcbiAgICAgICAgICAgIHRoaXMuJCQuc2tpcF9ib3VuZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLiQkc2V0KCQkcHJvcHMpO1xuICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNvbnN0IHN1YnNjcmliZXJfcXVldWUgPSBbXTtcbi8qKlxuICogQ3JlYXRlIGEgYFdyaXRhYmxlYCBzdG9yZSB0aGF0IGFsbG93cyBib3RoIHVwZGF0aW5nIGFuZCByZWFkaW5nIGJ5IHN1YnNjcmlwdGlvbi5cbiAqIEBwYXJhbSB7Kj19dmFsdWUgaW5pdGlhbCB2YWx1ZVxuICogQHBhcmFtIHtTdGFydFN0b3BOb3RpZmllcj19c3RhcnQgc3RhcnQgYW5kIHN0b3Agbm90aWZpY2F0aW9ucyBmb3Igc3Vic2NyaXB0aW9uc1xuICovXG5mdW5jdGlvbiB3cml0YWJsZSh2YWx1ZSwgc3RhcnQgPSBub29wKSB7XG4gICAgbGV0IHN0b3A7XG4gICAgY29uc3Qgc3Vic2NyaWJlcnMgPSBuZXcgU2V0KCk7XG4gICAgZnVuY3Rpb24gc2V0KG5ld192YWx1ZSkge1xuICAgICAgICBpZiAoc2FmZV9ub3RfZXF1YWwodmFsdWUsIG5ld192YWx1ZSkpIHtcbiAgICAgICAgICAgIHZhbHVlID0gbmV3X3ZhbHVlO1xuICAgICAgICAgICAgaWYgKHN0b3ApIHsgLy8gc3RvcmUgaXMgcmVhZHlcbiAgICAgICAgICAgICAgICBjb25zdCBydW5fcXVldWUgPSAhc3Vic2NyaWJlcl9xdWV1ZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzdWJzY3JpYmVyIG9mIHN1YnNjcmliZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJbMV0oKTtcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlcl9xdWV1ZS5wdXNoKHN1YnNjcmliZXIsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJ1bl9xdWV1ZSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1YnNjcmliZXJfcXVldWUubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJfcXVldWVbaV1bMF0oc3Vic2NyaWJlcl9xdWV1ZVtpICsgMV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJfcXVldWUubGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gdXBkYXRlKGZuKSB7XG4gICAgICAgIHNldChmbih2YWx1ZSkpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzdWJzY3JpYmUocnVuLCBpbnZhbGlkYXRlID0gbm9vcCkge1xuICAgICAgICBjb25zdCBzdWJzY3JpYmVyID0gW3J1biwgaW52YWxpZGF0ZV07XG4gICAgICAgIHN1YnNjcmliZXJzLmFkZChzdWJzY3JpYmVyKTtcbiAgICAgICAgaWYgKHN1YnNjcmliZXJzLnNpemUgPT09IDEpIHtcbiAgICAgICAgICAgIHN0b3AgPSBzdGFydChzZXQpIHx8IG5vb3A7XG4gICAgICAgIH1cbiAgICAgICAgcnVuKHZhbHVlKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIHN1YnNjcmliZXJzLmRlbGV0ZShzdWJzY3JpYmVyKTtcbiAgICAgICAgICAgIGlmIChzdWJzY3JpYmVycy5zaXplID09PSAwKSB7XG4gICAgICAgICAgICAgICAgc3RvcCgpO1xuICAgICAgICAgICAgICAgIHN0b3AgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4geyBzZXQsIHVwZGF0ZSwgc3Vic2NyaWJlIH07XG59XG5cbmNvbnN0IGlzRWRpdGluZ1F1ZXN0aW9uID0gd3JpdGFibGUoZmFsc2UpO1xuY29uc3QgcXVlc3Rpb25zQWNyb3NzID0gd3JpdGFibGUoW10pO1xuY29uc3QgcXVlc3Rpb25zRG93biA9IHdyaXRhYmxlKFtdKTtcbmNvbnN0IGN1cnJlbnREaXJlY3Rpb24gPSB3cml0YWJsZShcImFjcm9zc1wiKTtcbmNvbnN0IGN1cnJlbnRRdWVzdGlvbiA9IHdyaXRhYmxlKHt9KTtcblxuLyogc3JjL01lbnUuc3ZlbHRlIGdlbmVyYXRlZCBieSBTdmVsdGUgdjMuNDYuNCAqL1xuXG5mdW5jdGlvbiBjcmVhdGVfZnJhZ21lbnQkNShjdHgpIHtcblx0bGV0IG1haW47XG5cdGxldCBuYXY7XG5cdGxldCBkaXY7XG5cdGxldCBpbnB1dDtcblx0bGV0IHQwO1xuXHRsZXQgc3BhbjA7XG5cdGxldCB0MTtcblx0bGV0IHNwYW4xO1xuXHRsZXQgdDI7XG5cdGxldCBzcGFuMjtcblx0bGV0IHQzO1xuXHRsZXQgdWw7XG5cdGxldCBhMDtcblx0bGV0IHQ1O1xuXHRsZXQgbGkxO1xuXHRsZXQgdDY7XG5cdGxldCBhMTtcblx0bGV0IG1vdW50ZWQ7XG5cdGxldCBkaXNwb3NlO1xuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdG1haW4gPSBlbGVtZW50KFwibWFpblwiKTtcblx0XHRcdG5hdiA9IGVsZW1lbnQoXCJuYXZcIik7XG5cdFx0XHRkaXYgPSBlbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0aW5wdXQgPSBlbGVtZW50KFwiaW5wdXRcIik7XG5cdFx0XHR0MCA9IHNwYWNlKCk7XG5cdFx0XHRzcGFuMCA9IGVsZW1lbnQoXCJzcGFuXCIpO1xuXHRcdFx0dDEgPSBzcGFjZSgpO1xuXHRcdFx0c3BhbjEgPSBlbGVtZW50KFwic3BhblwiKTtcblx0XHRcdHQyID0gc3BhY2UoKTtcblx0XHRcdHNwYW4yID0gZWxlbWVudChcInNwYW5cIik7XG5cdFx0XHR0MyA9IHNwYWNlKCk7XG5cdFx0XHR1bCA9IGVsZW1lbnQoXCJ1bFwiKTtcblx0XHRcdGEwID0gZWxlbWVudChcImFcIik7XG5cdFx0XHRhMC5pbm5lckhUTUwgPSBgPGxpIGNsYXNzPVwic3ZlbHRlLTFoZ2liemdcIj5JbnN0cnVjdGlvbnM8L2xpPmA7XG5cdFx0XHR0NSA9IHNwYWNlKCk7XG5cdFx0XHRsaTEgPSBlbGVtZW50KFwibGlcIik7XG5cdFx0XHRsaTEuaW5uZXJIVE1MID0gYDxoci8+YDtcblx0XHRcdHQ2ID0gc3BhY2UoKTtcblx0XHRcdGExID0gZWxlbWVudChcImFcIik7XG5cdFx0XHRhMS5pbm5lckhUTUwgPSBgPGxpIGNsYXNzPVwic3ZlbHRlLTFoZ2liemdcIj5SZXNldDwvbGk+YDtcblx0XHRcdGF0dHIoaW5wdXQsIFwidHlwZVwiLCBcImNoZWNrYm94XCIpO1xuXHRcdFx0YXR0cihpbnB1dCwgXCJjbGFzc1wiLCBcInN2ZWx0ZS0xaGdpYnpnXCIpO1xuXHRcdFx0YXR0cihzcGFuMCwgXCJjbGFzc1wiLCBcImp4d29yZC1oYW1iZXJkZXIgc3ZlbHRlLTFoZ2liemdcIik7XG5cdFx0XHRhdHRyKHNwYW4xLCBcImNsYXNzXCIsIFwianh3b3JkLWhhbWJlcmRlciBzdmVsdGUtMWhnaWJ6Z1wiKTtcblx0XHRcdGF0dHIoc3BhbjIsIFwiY2xhc3NcIiwgXCJqeHdvcmQtaGFtYmVyZGVyIHN2ZWx0ZS0xaGdpYnpnXCIpO1xuXHRcdFx0YXR0cihhMCwgXCJocmVmXCIsIFwiaW5zdHJ1Y3Rpb25zXCIpO1xuXHRcdFx0YXR0cihhMCwgXCJjbGFzc1wiLCBcImp4d29yZC1idXR0b24gc3ZlbHRlLTFoZ2liemdcIik7XG5cdFx0XHRhdHRyKGxpMSwgXCJjbGFzc1wiLCBcImp4d29yZC1tZW51LWJyZWFrIHN2ZWx0ZS0xaGdpYnpnXCIpO1xuXHRcdFx0YXR0cihhMSwgXCJocmVmXCIsIFwiI1wiKTtcblx0XHRcdGF0dHIoYTEsIFwiY2xhc3NcIiwgXCJqeHdvcmQtYnV0dG9uIHN2ZWx0ZS0xaGdpYnpnXCIpO1xuXHRcdFx0YXR0cih1bCwgXCJjbGFzc1wiLCBcImp4d29yZC1tZW51IHN2ZWx0ZS0xaGdpYnpnXCIpO1xuXHRcdFx0YXR0cihkaXYsIFwiY2xhc3NcIiwgXCJqeHdvcmQtbWVudS10b2dnbGUgc3ZlbHRlLTFoZ2liemdcIik7XG5cdFx0XHRhdHRyKG5hdiwgXCJjbGFzc1wiLCBcImp4d29yZC1jb250cm9sc1wiKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGluc2VydCh0YXJnZXQsIG1haW4sIGFuY2hvcik7XG5cdFx0XHRhcHBlbmQobWFpbiwgbmF2KTtcblx0XHRcdGFwcGVuZChuYXYsIGRpdik7XG5cdFx0XHRhcHBlbmQoZGl2LCBpbnB1dCk7XG5cdFx0XHRpbnB1dC5jaGVja2VkID0gLypzaG93TWVudSovIGN0eFswXTtcblx0XHRcdGFwcGVuZChkaXYsIHQwKTtcblx0XHRcdGFwcGVuZChkaXYsIHNwYW4wKTtcblx0XHRcdGFwcGVuZChkaXYsIHQxKTtcblx0XHRcdGFwcGVuZChkaXYsIHNwYW4xKTtcblx0XHRcdGFwcGVuZChkaXYsIHQyKTtcblx0XHRcdGFwcGVuZChkaXYsIHNwYW4yKTtcblx0XHRcdGFwcGVuZChkaXYsIHQzKTtcblx0XHRcdGFwcGVuZChkaXYsIHVsKTtcblx0XHRcdGFwcGVuZCh1bCwgYTApO1xuXHRcdFx0YXBwZW5kKHVsLCB0NSk7XG5cdFx0XHRhcHBlbmQodWwsIGxpMSk7XG5cdFx0XHRhcHBlbmQodWwsIHQ2KTtcblx0XHRcdGFwcGVuZCh1bCwgYTEpO1xuXG5cdFx0XHRpZiAoIW1vdW50ZWQpIHtcblx0XHRcdFx0ZGlzcG9zZSA9IFtcblx0XHRcdFx0XHRsaXN0ZW4oaW5wdXQsIFwiY2hhbmdlXCIsIC8qaW5wdXRfY2hhbmdlX2hhbmRsZXIqLyBjdHhbM10pLFxuXHRcdFx0XHRcdGxpc3RlbihhMCwgXCJjbGlja1wiLCAvKmhhbmRsZUluc3RydWN0aW9ucyovIGN0eFsyXSksXG5cdFx0XHRcdFx0bGlzdGVuKGExLCBcImNsaWNrXCIsIC8qaGFuZGxlUmVzZXQqLyBjdHhbMV0pXG5cdFx0XHRcdF07XG5cblx0XHRcdFx0bW91bnRlZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRwKGN0eCwgW2RpcnR5XSkge1xuXHRcdFx0aWYgKGRpcnR5ICYgLypzaG93TWVudSovIDEpIHtcblx0XHRcdFx0aW5wdXQuY2hlY2tlZCA9IC8qc2hvd01lbnUqLyBjdHhbMF07XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRpOiBub29wLFxuXHRcdG86IG5vb3AsXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaChtYWluKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdHJ1bl9hbGwoZGlzcG9zZSk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBpbnN0YW5jZSQ1KCQkc2VsZiwgJCRwcm9wcywgJCRpbnZhbGlkYXRlKSB7XG5cdGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCk7XG5cdGxldCBzaG93TWVudSA9IGZhbHNlO1xuXG5cdGZ1bmN0aW9uIGhhbmRsZVJlc2V0KGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0ZGlzcGF0Y2goJ3Jlc2V0Jyk7XG5cdFx0JCRpbnZhbGlkYXRlKDAsIHNob3dNZW51ID0gZmFsc2UpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlSW5zdHJ1Y3Rpb25zKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0ZGlzcGF0Y2goJ2luc3RydWN0aW9ucycpO1xuXHRcdCQkaW52YWxpZGF0ZSgwLCBzaG93TWVudSA9IGZhbHNlKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlucHV0X2NoYW5nZV9oYW5kbGVyKCkge1xuXHRcdHNob3dNZW51ID0gdGhpcy5jaGVja2VkO1xuXHRcdCQkaW52YWxpZGF0ZSgwLCBzaG93TWVudSk7XG5cdH1cblxuXHRyZXR1cm4gW3Nob3dNZW51LCBoYW5kbGVSZXNldCwgaGFuZGxlSW5zdHJ1Y3Rpb25zLCBpbnB1dF9jaGFuZ2VfaGFuZGxlcl07XG59XG5cbmNsYXNzIE1lbnUgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuXHRjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG5cdFx0c3VwZXIoKTtcblx0XHRpbml0KHRoaXMsIG9wdGlvbnMsIGluc3RhbmNlJDUsIGNyZWF0ZV9mcmFnbWVudCQ1LCBzYWZlX25vdF9lcXVhbCwge30pO1xuXHR9XG59XG5cbnZhciB3b3JkcyA9IFtcInRoZVwiLFwib2ZcIixcImFuZFwiLFwidG9cIixcImFcIixcImluXCIsXCJmb3JcIixcImlzXCIsXCJvblwiLFwidGhhdFwiLFwiYnlcIixcInRoaXNcIixcIndpdGhcIixcImlcIixcInlvdVwiLFwiaXRcIixcIm5vdFwiLFwib3JcIixcImJlXCIsXCJhcmVcIixcImZyb21cIixcImF0XCIsXCJhc1wiLFwieW91clwiLFwiYWxsXCIsXCJoYXZlXCIsXCJuZXdcIixcIm1vcmVcIixcImFuXCIsXCJ3YXNcIixcIndlXCIsXCJ3aWxsXCIsXCJob21lXCIsXCJjYW5cIixcInVzXCIsXCJhYm91dFwiLFwiaWZcIixcInBhZ2VcIixcIm15XCIsXCJoYXNcIixcInNlYXJjaFwiLFwiZnJlZVwiLFwiYnV0XCIsXCJvdXJcIixcIm9uZVwiLFwib3RoZXJcIixcImRvXCIsXCJub1wiLFwiaW5mb3JtYXRpb25cIixcInRpbWVcIixcInRoZXlcIixcInNpdGVcIixcImhlXCIsXCJ1cFwiLFwibWF5XCIsXCJ3aGF0XCIsXCJ3aGljaFwiLFwidGhlaXJcIixcIm5ld3NcIixcIm91dFwiLFwidXNlXCIsXCJhbnlcIixcInRoZXJlXCIsXCJzZWVcIixcIm9ubHlcIixcInNvXCIsXCJoaXNcIixcIndoZW5cIixcImNvbnRhY3RcIixcImhlcmVcIixcImJ1c2luZXNzXCIsXCJ3aG9cIixcIndlYlwiLFwiYWxzb1wiLFwibm93XCIsXCJoZWxwXCIsXCJnZXRcIixcInBtXCIsXCJ2aWV3XCIsXCJvbmxpbmVcIixcImNcIixcImVcIixcImZpcnN0XCIsXCJhbVwiLFwiYmVlblwiLFwid291bGRcIixcImhvd1wiLFwid2VyZVwiLFwibWVcIixcInNcIixcInNlcnZpY2VzXCIsXCJzb21lXCIsXCJ0aGVzZVwiLFwiY2xpY2tcIixcIml0c1wiLFwibGlrZVwiLFwic2VydmljZVwiLFwieFwiLFwidGhhblwiLFwiZmluZFwiLFwicHJpY2VcIixcImRhdGVcIixcImJhY2tcIixcInRvcFwiLFwicGVvcGxlXCIsXCJoYWRcIixcImxpc3RcIixcIm5hbWVcIixcImp1c3RcIixcIm92ZXJcIixcInN0YXRlXCIsXCJ5ZWFyXCIsXCJkYXlcIixcImludG9cIixcImVtYWlsXCIsXCJ0d29cIixcImhlYWx0aFwiLFwiblwiLFwid29ybGRcIixcInJlXCIsXCJuZXh0XCIsXCJ1c2VkXCIsXCJnb1wiLFwiYlwiLFwid29ya1wiLFwibGFzdFwiLFwibW9zdFwiLFwicHJvZHVjdHNcIixcIm11c2ljXCIsXCJidXlcIixcImRhdGFcIixcIm1ha2VcIixcInRoZW1cIixcInNob3VsZFwiLFwicHJvZHVjdFwiLFwic3lzdGVtXCIsXCJwb3N0XCIsXCJoZXJcIixcImNpdHlcIixcInRcIixcImFkZFwiLFwicG9saWN5XCIsXCJudW1iZXJcIixcInN1Y2hcIixcInBsZWFzZVwiLFwiYXZhaWxhYmxlXCIsXCJjb3B5cmlnaHRcIixcInN1cHBvcnRcIixcIm1lc3NhZ2VcIixcImFmdGVyXCIsXCJiZXN0XCIsXCJzb2Z0d2FyZVwiLFwidGhlblwiLFwiamFuXCIsXCJnb29kXCIsXCJ2aWRlb1wiLFwid2VsbFwiLFwiZFwiLFwid2hlcmVcIixcImluZm9cIixcInJpZ2h0c1wiLFwicHVibGljXCIsXCJib29rc1wiLFwiaGlnaFwiLFwic2Nob29sXCIsXCJ0aHJvdWdoXCIsXCJtXCIsXCJlYWNoXCIsXCJsaW5rc1wiLFwic2hlXCIsXCJyZXZpZXdcIixcInllYXJzXCIsXCJvcmRlclwiLFwidmVyeVwiLFwicHJpdmFjeVwiLFwiYm9va1wiLFwiaXRlbXNcIixcImNvbXBhbnlcIixcInJcIixcInJlYWRcIixcImdyb3VwXCIsXCJuZWVkXCIsXCJtYW55XCIsXCJ1c2VyXCIsXCJzYWlkXCIsXCJkZVwiLFwiZG9lc1wiLFwic2V0XCIsXCJ1bmRlclwiLFwiZ2VuZXJhbFwiLFwicmVzZWFyY2hcIixcInVuaXZlcnNpdHlcIixcImphbnVhcnlcIixcIm1haWxcIixcImZ1bGxcIixcIm1hcFwiLFwicmV2aWV3c1wiLFwicHJvZ3JhbVwiLFwibGlmZVwiLFwia25vd1wiLFwiZ2FtZXNcIixcIndheVwiLFwiZGF5c1wiLFwibWFuYWdlbWVudFwiLFwicFwiLFwicGFydFwiLFwiY291bGRcIixcImdyZWF0XCIsXCJ1bml0ZWRcIixcImhvdGVsXCIsXCJyZWFsXCIsXCJmXCIsXCJpdGVtXCIsXCJpbnRlcm5hdGlvbmFsXCIsXCJjZW50ZXJcIixcImViYXlcIixcIm11c3RcIixcInN0b3JlXCIsXCJ0cmF2ZWxcIixcImNvbW1lbnRzXCIsXCJtYWRlXCIsXCJkZXZlbG9wbWVudFwiLFwicmVwb3J0XCIsXCJvZmZcIixcIm1lbWJlclwiLFwiZGV0YWlsc1wiLFwibGluZVwiLFwidGVybXNcIixcImJlZm9yZVwiLFwiaG90ZWxzXCIsXCJkaWRcIixcInNlbmRcIixcInJpZ2h0XCIsXCJ0eXBlXCIsXCJiZWNhdXNlXCIsXCJsb2NhbFwiLFwidGhvc2VcIixcInVzaW5nXCIsXCJyZXN1bHRzXCIsXCJvZmZpY2VcIixcImVkdWNhdGlvblwiLFwibmF0aW9uYWxcIixcImNhclwiLFwiZGVzaWduXCIsXCJ0YWtlXCIsXCJwb3N0ZWRcIixcImludGVybmV0XCIsXCJhZGRyZXNzXCIsXCJjb21tdW5pdHlcIixcIndpdGhpblwiLFwic3RhdGVzXCIsXCJhcmVhXCIsXCJ3YW50XCIsXCJwaG9uZVwiLFwiZHZkXCIsXCJzaGlwcGluZ1wiLFwicmVzZXJ2ZWRcIixcInN1YmplY3RcIixcImJldHdlZW5cIixcImZvcnVtXCIsXCJmYW1pbHlcIixcImxcIixcImxvbmdcIixcImJhc2VkXCIsXCJ3XCIsXCJjb2RlXCIsXCJzaG93XCIsXCJvXCIsXCJldmVuXCIsXCJibGFja1wiLFwiY2hlY2tcIixcInNwZWNpYWxcIixcInByaWNlc1wiLFwid2Vic2l0ZVwiLFwiaW5kZXhcIixcImJlaW5nXCIsXCJ3b21lblwiLFwibXVjaFwiLFwic2lnblwiLFwiZmlsZVwiLFwibGlua1wiLFwib3BlblwiLFwidG9kYXlcIixcInRlY2hub2xvZ3lcIixcInNvdXRoXCIsXCJjYXNlXCIsXCJwcm9qZWN0XCIsXCJzYW1lXCIsXCJwYWdlc1wiLFwidWtcIixcInZlcnNpb25cIixcInNlY3Rpb25cIixcIm93blwiLFwiZm91bmRcIixcInNwb3J0c1wiLFwiaG91c2VcIixcInJlbGF0ZWRcIixcInNlY3VyaXR5XCIsXCJib3RoXCIsXCJnXCIsXCJjb3VudHlcIixcImFtZXJpY2FuXCIsXCJwaG90b1wiLFwiZ2FtZVwiLFwibWVtYmVyc1wiLFwicG93ZXJcIixcIndoaWxlXCIsXCJjYXJlXCIsXCJuZXR3b3JrXCIsXCJkb3duXCIsXCJjb21wdXRlclwiLFwic3lzdGVtc1wiLFwidGhyZWVcIixcInRvdGFsXCIsXCJwbGFjZVwiLFwiZW5kXCIsXCJmb2xsb3dpbmdcIixcImRvd25sb2FkXCIsXCJoXCIsXCJoaW1cIixcIndpdGhvdXRcIixcInBlclwiLFwiYWNjZXNzXCIsXCJ0aGlua1wiLFwibm9ydGhcIixcInJlc291cmNlc1wiLFwiY3VycmVudFwiLFwicG9zdHNcIixcImJpZ1wiLFwibWVkaWFcIixcImxhd1wiLFwiY29udHJvbFwiLFwid2F0ZXJcIixcImhpc3RvcnlcIixcInBpY3R1cmVzXCIsXCJzaXplXCIsXCJhcnRcIixcInBlcnNvbmFsXCIsXCJzaW5jZVwiLFwiaW5jbHVkaW5nXCIsXCJndWlkZVwiLFwic2hvcFwiLFwiZGlyZWN0b3J5XCIsXCJib2FyZFwiLFwibG9jYXRpb25cIixcImNoYW5nZVwiLFwid2hpdGVcIixcInRleHRcIixcInNtYWxsXCIsXCJyYXRpbmdcIixcInJhdGVcIixcImdvdmVybm1lbnRcIixcImNoaWxkcmVuXCIsXCJkdXJpbmdcIixcInVzYVwiLFwicmV0dXJuXCIsXCJzdHVkZW50c1wiLFwidlwiLFwic2hvcHBpbmdcIixcImFjY291bnRcIixcInRpbWVzXCIsXCJzaXRlc1wiLFwibGV2ZWxcIixcImRpZ2l0YWxcIixcInByb2ZpbGVcIixcInByZXZpb3VzXCIsXCJmb3JtXCIsXCJldmVudHNcIixcImxvdmVcIixcIm9sZFwiLFwiam9oblwiLFwibWFpblwiLFwiY2FsbFwiLFwiaG91cnNcIixcImltYWdlXCIsXCJkZXBhcnRtZW50XCIsXCJ0aXRsZVwiLFwiZGVzY3JpcHRpb25cIixcIm5vblwiLFwia1wiLFwieVwiLFwiaW5zdXJhbmNlXCIsXCJhbm90aGVyXCIsXCJ3aHlcIixcInNoYWxsXCIsXCJwcm9wZXJ0eVwiLFwiY2xhc3NcIixcImNkXCIsXCJzdGlsbFwiLFwibW9uZXlcIixcInF1YWxpdHlcIixcImV2ZXJ5XCIsXCJsaXN0aW5nXCIsXCJjb250ZW50XCIsXCJjb3VudHJ5XCIsXCJwcml2YXRlXCIsXCJsaXR0bGVcIixcInZpc2l0XCIsXCJzYXZlXCIsXCJ0b29sc1wiLFwibG93XCIsXCJyZXBseVwiLFwiY3VzdG9tZXJcIixcImRlY2VtYmVyXCIsXCJjb21wYXJlXCIsXCJtb3ZpZXNcIixcImluY2x1ZGVcIixcImNvbGxlZ2VcIixcInZhbHVlXCIsXCJhcnRpY2xlXCIsXCJ5b3JrXCIsXCJtYW5cIixcImNhcmRcIixcImpvYnNcIixcInByb3ZpZGVcIixcImpcIixcImZvb2RcIixcInNvdXJjZVwiLFwiYXV0aG9yXCIsXCJkaWZmZXJlbnRcIixcInByZXNzXCIsXCJ1XCIsXCJsZWFyblwiLFwic2FsZVwiLFwiYXJvdW5kXCIsXCJwcmludFwiLFwiY291cnNlXCIsXCJqb2JcIixcImNhbmFkYVwiLFwicHJvY2Vzc1wiLFwidGVlblwiLFwicm9vbVwiLFwic3RvY2tcIixcInRyYWluaW5nXCIsXCJ0b29cIixcImNyZWRpdFwiLFwicG9pbnRcIixcImpvaW5cIixcInNjaWVuY2VcIixcIm1lblwiLFwiY2F0ZWdvcmllc1wiLFwiYWR2YW5jZWRcIixcIndlc3RcIixcInNhbGVzXCIsXCJsb29rXCIsXCJlbmdsaXNoXCIsXCJsZWZ0XCIsXCJ0ZWFtXCIsXCJlc3RhdGVcIixcImJveFwiLFwiY29uZGl0aW9uc1wiLFwic2VsZWN0XCIsXCJ3aW5kb3dzXCIsXCJwaG90b3NcIixcImdheVwiLFwidGhyZWFkXCIsXCJ3ZWVrXCIsXCJjYXRlZ29yeVwiLFwibm90ZVwiLFwibGl2ZVwiLFwibGFyZ2VcIixcImdhbGxlcnlcIixcInRhYmxlXCIsXCJyZWdpc3RlclwiLFwiaG93ZXZlclwiLFwianVuZVwiLFwib2N0b2JlclwiLFwibm92ZW1iZXJcIixcIm1hcmtldFwiLFwibGlicmFyeVwiLFwicmVhbGx5XCIsXCJhY3Rpb25cIixcInN0YXJ0XCIsXCJzZXJpZXNcIixcIm1vZGVsXCIsXCJmZWF0dXJlc1wiLFwiYWlyXCIsXCJpbmR1c3RyeVwiLFwicGxhblwiLFwiaHVtYW5cIixcInByb3ZpZGVkXCIsXCJ0dlwiLFwieWVzXCIsXCJyZXF1aXJlZFwiLFwic2Vjb25kXCIsXCJob3RcIixcImFjY2Vzc29yaWVzXCIsXCJjb3N0XCIsXCJtb3ZpZVwiLFwiZm9ydW1zXCIsXCJtYXJjaFwiLFwibGFcIixcInNlcHRlbWJlclwiLFwiYmV0dGVyXCIsXCJzYXlcIixcInF1ZXN0aW9uc1wiLFwianVseVwiLFwieWFob29cIixcImdvaW5nXCIsXCJtZWRpY2FsXCIsXCJ0ZXN0XCIsXCJmcmllbmRcIixcImNvbWVcIixcImRlY1wiLFwic2VydmVyXCIsXCJwY1wiLFwic3R1ZHlcIixcImFwcGxpY2F0aW9uXCIsXCJjYXJ0XCIsXCJzdGFmZlwiLFwiYXJ0aWNsZXNcIixcInNhblwiLFwiZmVlZGJhY2tcIixcImFnYWluXCIsXCJwbGF5XCIsXCJsb29raW5nXCIsXCJpc3N1ZXNcIixcImFwcmlsXCIsXCJuZXZlclwiLFwidXNlcnNcIixcImNvbXBsZXRlXCIsXCJzdHJlZXRcIixcInRvcGljXCIsXCJjb21tZW50XCIsXCJmaW5hbmNpYWxcIixcInRoaW5nc1wiLFwid29ya2luZ1wiLFwiYWdhaW5zdFwiLFwic3RhbmRhcmRcIixcInRheFwiLFwicGVyc29uXCIsXCJiZWxvd1wiLFwibW9iaWxlXCIsXCJsZXNzXCIsXCJnb3RcIixcImJsb2dcIixcInBhcnR5XCIsXCJwYXltZW50XCIsXCJlcXVpcG1lbnRcIixcImxvZ2luXCIsXCJzdHVkZW50XCIsXCJsZXRcIixcInByb2dyYW1zXCIsXCJvZmZlcnNcIixcImxlZ2FsXCIsXCJhYm92ZVwiLFwicmVjZW50XCIsXCJwYXJrXCIsXCJzdG9yZXNcIixcInNpZGVcIixcImFjdFwiLFwicHJvYmxlbVwiLFwicmVkXCIsXCJnaXZlXCIsXCJtZW1vcnlcIixcInBlcmZvcm1hbmNlXCIsXCJzb2NpYWxcIixcInFcIixcImF1Z3VzdFwiLFwicXVvdGVcIixcImxhbmd1YWdlXCIsXCJzdG9yeVwiLFwic2VsbFwiLFwib3B0aW9uc1wiLFwiZXhwZXJpZW5jZVwiLFwicmF0ZXNcIixcImNyZWF0ZVwiLFwia2V5XCIsXCJib2R5XCIsXCJ5b3VuZ1wiLFwiYW1lcmljYVwiLFwiaW1wb3J0YW50XCIsXCJmaWVsZFwiLFwiZmV3XCIsXCJlYXN0XCIsXCJwYXBlclwiLFwic2luZ2xlXCIsXCJpaVwiLFwiYWdlXCIsXCJhY3Rpdml0aWVzXCIsXCJjbHViXCIsXCJleGFtcGxlXCIsXCJnaXJsc1wiLFwiYWRkaXRpb25hbFwiLFwicGFzc3dvcmRcIixcInpcIixcImxhdGVzdFwiLFwic29tZXRoaW5nXCIsXCJyb2FkXCIsXCJnaWZ0XCIsXCJxdWVzdGlvblwiLFwiY2hhbmdlc1wiLFwibmlnaHRcIixcImNhXCIsXCJoYXJkXCIsXCJ0ZXhhc1wiLFwib2N0XCIsXCJwYXlcIixcImZvdXJcIixcInBva2VyXCIsXCJzdGF0dXNcIixcImJyb3dzZVwiLFwiaXNzdWVcIixcInJhbmdlXCIsXCJidWlsZGluZ1wiLFwic2VsbGVyXCIsXCJjb3VydFwiLFwiZmVicnVhcnlcIixcImFsd2F5c1wiLFwicmVzdWx0XCIsXCJhdWRpb1wiLFwibGlnaHRcIixcIndyaXRlXCIsXCJ3YXJcIixcIm5vdlwiLFwib2ZmZXJcIixcImJsdWVcIixcImdyb3Vwc1wiLFwiYWxcIixcImVhc3lcIixcImdpdmVuXCIsXCJmaWxlc1wiLFwiZXZlbnRcIixcInJlbGVhc2VcIixcImFuYWx5c2lzXCIsXCJyZXF1ZXN0XCIsXCJmYXhcIixcImNoaW5hXCIsXCJtYWtpbmdcIixcInBpY3R1cmVcIixcIm5lZWRzXCIsXCJwb3NzaWJsZVwiLFwibWlnaHRcIixcInByb2Zlc3Npb25hbFwiLFwieWV0XCIsXCJtb250aFwiLFwibWFqb3JcIixcInN0YXJcIixcImFyZWFzXCIsXCJmdXR1cmVcIixcInNwYWNlXCIsXCJjb21taXR0ZWVcIixcImhhbmRcIixcInN1blwiLFwiY2FyZHNcIixcInByb2JsZW1zXCIsXCJsb25kb25cIixcIndhc2hpbmd0b25cIixcIm1lZXRpbmdcIixcInJzc1wiLFwiYmVjb21lXCIsXCJpbnRlcmVzdFwiLFwiaWRcIixcImNoaWxkXCIsXCJrZWVwXCIsXCJlbnRlclwiLFwiY2FsaWZvcm5pYVwiLFwic2hhcmVcIixcInNpbWlsYXJcIixcImdhcmRlblwiLFwic2Nob29sc1wiLFwibWlsbGlvblwiLFwiYWRkZWRcIixcInJlZmVyZW5jZVwiLFwiY29tcGFuaWVzXCIsXCJsaXN0ZWRcIixcImJhYnlcIixcImxlYXJuaW5nXCIsXCJlbmVyZ3lcIixcInJ1blwiLFwiZGVsaXZlcnlcIixcIm5ldFwiLFwicG9wdWxhclwiLFwidGVybVwiLFwiZmlsbVwiLFwic3Rvcmllc1wiLFwicHV0XCIsXCJjb21wdXRlcnNcIixcImpvdXJuYWxcIixcInJlcG9ydHNcIixcImNvXCIsXCJ0cnlcIixcIndlbGNvbWVcIixcImNlbnRyYWxcIixcImltYWdlc1wiLFwicHJlc2lkZW50XCIsXCJub3RpY2VcIixcIm9yaWdpbmFsXCIsXCJoZWFkXCIsXCJyYWRpb1wiLFwidW50aWxcIixcImNlbGxcIixcImNvbG9yXCIsXCJzZWxmXCIsXCJjb3VuY2lsXCIsXCJhd2F5XCIsXCJpbmNsdWRlc1wiLFwidHJhY2tcIixcImF1c3RyYWxpYVwiLFwiZGlzY3Vzc2lvblwiLFwiYXJjaGl2ZVwiLFwib25jZVwiLFwib3RoZXJzXCIsXCJlbnRlcnRhaW5tZW50XCIsXCJhZ3JlZW1lbnRcIixcImZvcm1hdFwiLFwibGVhc3RcIixcInNvY2lldHlcIixcIm1vbnRoc1wiLFwibG9nXCIsXCJzYWZldHlcIixcImZyaWVuZHNcIixcInN1cmVcIixcImZhcVwiLFwidHJhZGVcIixcImVkaXRpb25cIixcImNhcnNcIixcIm1lc3NhZ2VzXCIsXCJtYXJrZXRpbmdcIixcInRlbGxcIixcImZ1cnRoZXJcIixcInVwZGF0ZWRcIixcImFzc29jaWF0aW9uXCIsXCJhYmxlXCIsXCJoYXZpbmdcIixcInByb3ZpZGVzXCIsXCJkYXZpZFwiLFwiZnVuXCIsXCJhbHJlYWR5XCIsXCJncmVlblwiLFwic3R1ZGllc1wiLFwiY2xvc2VcIixcImNvbW1vblwiLFwiZHJpdmVcIixcInNwZWNpZmljXCIsXCJzZXZlcmFsXCIsXCJnb2xkXCIsXCJmZWJcIixcImxpdmluZ1wiLFwic2VwXCIsXCJjb2xsZWN0aW9uXCIsXCJjYWxsZWRcIixcInNob3J0XCIsXCJhcnRzXCIsXCJsb3RcIixcImFza1wiLFwiZGlzcGxheVwiLFwibGltaXRlZFwiLFwicG93ZXJlZFwiLFwic29sdXRpb25zXCIsXCJtZWFuc1wiLFwiZGlyZWN0b3JcIixcImRhaWx5XCIsXCJiZWFjaFwiLFwicGFzdFwiLFwibmF0dXJhbFwiLFwid2hldGhlclwiLFwiZHVlXCIsXCJldFwiLFwiZWxlY3Ryb25pY3NcIixcImZpdmVcIixcInVwb25cIixcInBlcmlvZFwiLFwicGxhbm5pbmdcIixcImRhdGFiYXNlXCIsXCJzYXlzXCIsXCJvZmZpY2lhbFwiLFwid2VhdGhlclwiLFwibWFyXCIsXCJsYW5kXCIsXCJhdmVyYWdlXCIsXCJkb25lXCIsXCJ0ZWNobmljYWxcIixcIndpbmRvd1wiLFwiZnJhbmNlXCIsXCJwcm9cIixcInJlZ2lvblwiLFwiaXNsYW5kXCIsXCJyZWNvcmRcIixcImRpcmVjdFwiLFwibWljcm9zb2Z0XCIsXCJjb25mZXJlbmNlXCIsXCJlbnZpcm9ubWVudFwiLFwicmVjb3Jkc1wiLFwic3RcIixcImRpc3RyaWN0XCIsXCJjYWxlbmRhclwiLFwiY29zdHNcIixcInN0eWxlXCIsXCJ1cmxcIixcImZyb250XCIsXCJzdGF0ZW1lbnRcIixcInVwZGF0ZVwiLFwicGFydHNcIixcImF1Z1wiLFwiZXZlclwiLFwiZG93bmxvYWRzXCIsXCJlYXJseVwiLFwibWlsZXNcIixcInNvdW5kXCIsXCJyZXNvdXJjZVwiLFwicHJlc2VudFwiLFwiYXBwbGljYXRpb25zXCIsXCJlaXRoZXJcIixcImFnb1wiLFwiZG9jdW1lbnRcIixcIndvcmRcIixcIndvcmtzXCIsXCJtYXRlcmlhbFwiLFwiYmlsbFwiLFwiYXByXCIsXCJ3cml0dGVuXCIsXCJ0YWxrXCIsXCJmZWRlcmFsXCIsXCJob3N0aW5nXCIsXCJydWxlc1wiLFwiZmluYWxcIixcImFkdWx0XCIsXCJ0aWNrZXRzXCIsXCJ0aGluZ1wiLFwiY2VudHJlXCIsXCJyZXF1aXJlbWVudHNcIixcInZpYVwiLFwiY2hlYXBcIixcImtpZHNcIixcImZpbmFuY2VcIixcInRydWVcIixcIm1pbnV0ZXNcIixcImVsc2VcIixcIm1hcmtcIixcInRoaXJkXCIsXCJyb2NrXCIsXCJnaWZ0c1wiLFwiZXVyb3BlXCIsXCJyZWFkaW5nXCIsXCJ0b3BpY3NcIixcImJhZFwiLFwiaW5kaXZpZHVhbFwiLFwidGlwc1wiLFwicGx1c1wiLFwiYXV0b1wiLFwiY292ZXJcIixcInVzdWFsbHlcIixcImVkaXRcIixcInRvZ2V0aGVyXCIsXCJ2aWRlb3NcIixcInBlcmNlbnRcIixcImZhc3RcIixcImZ1bmN0aW9uXCIsXCJmYWN0XCIsXCJ1bml0XCIsXCJnZXR0aW5nXCIsXCJnbG9iYWxcIixcInRlY2hcIixcIm1lZXRcIixcImZhclwiLFwiZWNvbm9taWNcIixcImVuXCIsXCJwbGF5ZXJcIixcInByb2plY3RzXCIsXCJseXJpY3NcIixcIm9mdGVuXCIsXCJzdWJzY3JpYmVcIixcInN1Ym1pdFwiLFwiZ2VybWFueVwiLFwiYW1vdW50XCIsXCJ3YXRjaFwiLFwiaW5jbHVkZWRcIixcImZlZWxcIixcInRob3VnaFwiLFwiYmFua1wiLFwicmlza1wiLFwidGhhbmtzXCIsXCJldmVyeXRoaW5nXCIsXCJkZWFsc1wiLFwidmFyaW91c1wiLFwid29yZHNcIixcImxpbnV4XCIsXCJqdWxcIixcInByb2R1Y3Rpb25cIixcImNvbW1lcmNpYWxcIixcImphbWVzXCIsXCJ3ZWlnaHRcIixcInRvd25cIixcImhlYXJ0XCIsXCJhZHZlcnRpc2luZ1wiLFwicmVjZWl2ZWRcIixcImNob29zZVwiLFwidHJlYXRtZW50XCIsXCJuZXdzbGV0dGVyXCIsXCJhcmNoaXZlc1wiLFwicG9pbnRzXCIsXCJrbm93bGVkZ2VcIixcIm1hZ2F6aW5lXCIsXCJlcnJvclwiLFwiY2FtZXJhXCIsXCJqdW5cIixcImdpcmxcIixcImN1cnJlbnRseVwiLFwiY29uc3RydWN0aW9uXCIsXCJ0b3lzXCIsXCJyZWdpc3RlcmVkXCIsXCJjbGVhclwiLFwiZ29sZlwiLFwicmVjZWl2ZVwiLFwiZG9tYWluXCIsXCJtZXRob2RzXCIsXCJjaGFwdGVyXCIsXCJtYWtlc1wiLFwicHJvdGVjdGlvblwiLFwicG9saWNpZXNcIixcImxvYW5cIixcIndpZGVcIixcImJlYXV0eVwiLFwibWFuYWdlclwiLFwiaW5kaWFcIixcInBvc2l0aW9uXCIsXCJ0YWtlblwiLFwic29ydFwiLFwibGlzdGluZ3NcIixcIm1vZGVsc1wiLFwibWljaGFlbFwiLFwia25vd25cIixcImhhbGZcIixcImNhc2VzXCIsXCJzdGVwXCIsXCJlbmdpbmVlcmluZ1wiLFwiZmxvcmlkYVwiLFwic2ltcGxlXCIsXCJxdWlja1wiLFwibm9uZVwiLFwid2lyZWxlc3NcIixcImxpY2Vuc2VcIixcInBhdWxcIixcImZyaWRheVwiLFwibGFrZVwiLFwid2hvbGVcIixcImFubnVhbFwiLFwicHVibGlzaGVkXCIsXCJsYXRlclwiLFwiYmFzaWNcIixcInNvbnlcIixcInNob3dzXCIsXCJjb3Jwb3JhdGVcIixcImdvb2dsZVwiLFwiY2h1cmNoXCIsXCJtZXRob2RcIixcInB1cmNoYXNlXCIsXCJjdXN0b21lcnNcIixcImFjdGl2ZVwiLFwicmVzcG9uc2VcIixcInByYWN0aWNlXCIsXCJoYXJkd2FyZVwiLFwiZmlndXJlXCIsXCJtYXRlcmlhbHNcIixcImZpcmVcIixcImhvbGlkYXlcIixcImNoYXRcIixcImVub3VnaFwiLFwiZGVzaWduZWRcIixcImFsb25nXCIsXCJhbW9uZ1wiLFwiZGVhdGhcIixcIndyaXRpbmdcIixcInNwZWVkXCIsXCJodG1sXCIsXCJjb3VudHJpZXNcIixcImxvc3NcIixcImZhY2VcIixcImJyYW5kXCIsXCJkaXNjb3VudFwiLFwiaGlnaGVyXCIsXCJlZmZlY3RzXCIsXCJjcmVhdGVkXCIsXCJyZW1lbWJlclwiLFwic3RhbmRhcmRzXCIsXCJvaWxcIixcImJpdFwiLFwieWVsbG93XCIsXCJwb2xpdGljYWxcIixcImluY3JlYXNlXCIsXCJhZHZlcnRpc2VcIixcImtpbmdkb21cIixcImJhc2VcIixcIm5lYXJcIixcImVudmlyb25tZW50YWxcIixcInRob3VnaHRcIixcInN0dWZmXCIsXCJmcmVuY2hcIixcInN0b3JhZ2VcIixcIm9oXCIsXCJqYXBhblwiLFwiZG9pbmdcIixcImxvYW5zXCIsXCJzaG9lc1wiLFwiZW50cnlcIixcInN0YXlcIixcIm5hdHVyZVwiLFwib3JkZXJzXCIsXCJhdmFpbGFiaWxpdHlcIixcImFmcmljYVwiLFwic3VtbWFyeVwiLFwidHVyblwiLFwibWVhblwiLFwiZ3Jvd3RoXCIsXCJub3Rlc1wiLFwiYWdlbmN5XCIsXCJraW5nXCIsXCJtb25kYXlcIixcImV1cm9wZWFuXCIsXCJhY3Rpdml0eVwiLFwiY29weVwiLFwiYWx0aG91Z2hcIixcImRydWdcIixcInBpY3NcIixcIndlc3Rlcm5cIixcImluY29tZVwiLFwiZm9yY2VcIixcImNhc2hcIixcImVtcGxveW1lbnRcIixcIm92ZXJhbGxcIixcImJheVwiLFwicml2ZXJcIixcImNvbW1pc3Npb25cIixcImFkXCIsXCJwYWNrYWdlXCIsXCJjb250ZW50c1wiLFwic2VlblwiLFwicGxheWVyc1wiLFwiZW5naW5lXCIsXCJwb3J0XCIsXCJhbGJ1bVwiLFwicmVnaW9uYWxcIixcInN0b3BcIixcInN1cHBsaWVzXCIsXCJzdGFydGVkXCIsXCJhZG1pbmlzdHJhdGlvblwiLFwiYmFyXCIsXCJpbnN0aXR1dGVcIixcInZpZXdzXCIsXCJwbGFuc1wiLFwiZG91YmxlXCIsXCJkb2dcIixcImJ1aWxkXCIsXCJzY3JlZW5cIixcImV4Y2hhbmdlXCIsXCJ0eXBlc1wiLFwic29vblwiLFwic3BvbnNvcmVkXCIsXCJsaW5lc1wiLFwiZWxlY3Ryb25pY1wiLFwiY29udGludWVcIixcImFjcm9zc1wiLFwiYmVuZWZpdHNcIixcIm5lZWRlZFwiLFwic2Vhc29uXCIsXCJhcHBseVwiLFwic29tZW9uZVwiLFwiaGVsZFwiLFwibnlcIixcImFueXRoaW5nXCIsXCJwcmludGVyXCIsXCJjb25kaXRpb25cIixcImVmZmVjdGl2ZVwiLFwiYmVsaWV2ZVwiLFwib3JnYW5pemF0aW9uXCIsXCJlZmZlY3RcIixcImFza2VkXCIsXCJldXJcIixcIm1pbmRcIixcInN1bmRheVwiLFwic2VsZWN0aW9uXCIsXCJjYXNpbm9cIixcInBkZlwiLFwibG9zdFwiLFwidG91clwiLFwibWVudVwiLFwidm9sdW1lXCIsXCJjcm9zc1wiLFwiYW55b25lXCIsXCJtb3J0Z2FnZVwiLFwiaG9wZVwiLFwic2lsdmVyXCIsXCJjb3Jwb3JhdGlvblwiLFwid2lzaFwiLFwiaW5zaWRlXCIsXCJzb2x1dGlvblwiLFwibWF0dXJlXCIsXCJyb2xlXCIsXCJyYXRoZXJcIixcIndlZWtzXCIsXCJhZGRpdGlvblwiLFwiY2FtZVwiLFwic3VwcGx5XCIsXCJub3RoaW5nXCIsXCJjZXJ0YWluXCIsXCJ1c3JcIixcImV4ZWN1dGl2ZVwiLFwicnVubmluZ1wiLFwibG93ZXJcIixcIm5lY2Vzc2FyeVwiLFwidW5pb25cIixcImpld2VscnlcIixcImFjY29yZGluZ1wiLFwiZGNcIixcImNsb3RoaW5nXCIsXCJtb25cIixcImNvbVwiLFwicGFydGljdWxhclwiLFwiZmluZVwiLFwibmFtZXNcIixcInJvYmVydFwiLFwiaG9tZXBhZ2VcIixcImhvdXJcIixcImdhc1wiLFwic2tpbGxzXCIsXCJzaXhcIixcImJ1c2hcIixcImlzbGFuZHNcIixcImFkdmljZVwiLFwiY2FyZWVyXCIsXCJtaWxpdGFyeVwiLFwicmVudGFsXCIsXCJkZWNpc2lvblwiLFwibGVhdmVcIixcImJyaXRpc2hcIixcInRlZW5zXCIsXCJwcmVcIixcImh1Z2VcIixcInNhdFwiLFwid29tYW5cIixcImZhY2lsaXRpZXNcIixcInppcFwiLFwiYmlkXCIsXCJraW5kXCIsXCJzZWxsZXJzXCIsXCJtaWRkbGVcIixcIm1vdmVcIixcImNhYmxlXCIsXCJvcHBvcnR1bml0aWVzXCIsXCJ0YWtpbmdcIixcInZhbHVlc1wiLFwiZGl2aXNpb25cIixcImNvbWluZ1wiLFwidHVlc2RheVwiLFwib2JqZWN0XCIsXCJsZXNiaWFuXCIsXCJhcHByb3ByaWF0ZVwiLFwibWFjaGluZVwiLFwibG9nb1wiLFwibGVuZ3RoXCIsXCJhY3R1YWxseVwiLFwibmljZVwiLFwic2NvcmVcIixcInN0YXRpc3RpY3NcIixcImNsaWVudFwiLFwib2tcIixcInJldHVybnNcIixcImNhcGl0YWxcIixcImZvbGxvd1wiLFwic2FtcGxlXCIsXCJpbnZlc3RtZW50XCIsXCJzZW50XCIsXCJzaG93blwiLFwic2F0dXJkYXlcIixcImNocmlzdG1hc1wiLFwiZW5nbGFuZFwiLFwiY3VsdHVyZVwiLFwiYmFuZFwiLFwiZmxhc2hcIixcIm1zXCIsXCJsZWFkXCIsXCJnZW9yZ2VcIixcImNob2ljZVwiLFwid2VudFwiLFwic3RhcnRpbmdcIixcInJlZ2lzdHJhdGlvblwiLFwiZnJpXCIsXCJ0aHVyc2RheVwiLFwiY291cnNlc1wiLFwiY29uc3VtZXJcIixcImhpXCIsXCJhaXJwb3J0XCIsXCJmb3JlaWduXCIsXCJhcnRpc3RcIixcIm91dHNpZGVcIixcImZ1cm5pdHVyZVwiLFwibGV2ZWxzXCIsXCJjaGFubmVsXCIsXCJsZXR0ZXJcIixcIm1vZGVcIixcInBob25lc1wiLFwiaWRlYXNcIixcIndlZG5lc2RheVwiLFwic3RydWN0dXJlXCIsXCJmdW5kXCIsXCJzdW1tZXJcIixcImFsbG93XCIsXCJkZWdyZWVcIixcImNvbnRyYWN0XCIsXCJidXR0b25cIixcInJlbGVhc2VzXCIsXCJ3ZWRcIixcImhvbWVzXCIsXCJzdXBlclwiLFwibWFsZVwiLFwibWF0dGVyXCIsXCJjdXN0b21cIixcInZpcmdpbmlhXCIsXCJhbG1vc3RcIixcInRvb2tcIixcImxvY2F0ZWRcIixcIm11bHRpcGxlXCIsXCJhc2lhblwiLFwiZGlzdHJpYnV0aW9uXCIsXCJlZGl0b3JcIixcImlublwiLFwiaW5kdXN0cmlhbFwiLFwiY2F1c2VcIixcInBvdGVudGlhbFwiLFwic29uZ1wiLFwiY25ldFwiLFwibHRkXCIsXCJsb3NcIixcImhwXCIsXCJmb2N1c1wiLFwibGF0ZVwiLFwiZmFsbFwiLFwiZmVhdHVyZWRcIixcImlkZWFcIixcInJvb21zXCIsXCJmZW1hbGVcIixcInJlc3BvbnNpYmxlXCIsXCJpbmNcIixcImNvbW11bmljYXRpb25zXCIsXCJ3aW5cIixcImFzc29jaWF0ZWRcIixcInRob21hc1wiLFwicHJpbWFyeVwiLFwiY2FuY2VyXCIsXCJudW1iZXJzXCIsXCJyZWFzb25cIixcInRvb2xcIixcImJyb3dzZXJcIixcInNwcmluZ1wiLFwiZm91bmRhdGlvblwiLFwiYW5zd2VyXCIsXCJ2b2ljZVwiLFwiZWdcIixcImZyaWVuZGx5XCIsXCJzY2hlZHVsZVwiLFwiZG9jdW1lbnRzXCIsXCJjb21tdW5pY2F0aW9uXCIsXCJwdXJwb3NlXCIsXCJmZWF0dXJlXCIsXCJiZWRcIixcImNvbWVzXCIsXCJwb2xpY2VcIixcImV2ZXJ5b25lXCIsXCJpbmRlcGVuZGVudFwiLFwiaXBcIixcImFwcHJvYWNoXCIsXCJjYW1lcmFzXCIsXCJicm93blwiLFwicGh5c2ljYWxcIixcIm9wZXJhdGluZ1wiLFwiaGlsbFwiLFwibWFwc1wiLFwibWVkaWNpbmVcIixcImRlYWxcIixcImhvbGRcIixcInJhdGluZ3NcIixcImNoaWNhZ29cIixcImZvcm1zXCIsXCJnbGFzc1wiLFwiaGFwcHlcIixcInR1ZVwiLFwic21pdGhcIixcIndhbnRlZFwiLFwiZGV2ZWxvcGVkXCIsXCJ0aGFua1wiLFwic2FmZVwiLFwidW5pcXVlXCIsXCJzdXJ2ZXlcIixcInByaW9yXCIsXCJ0ZWxlcGhvbmVcIixcInNwb3J0XCIsXCJyZWFkeVwiLFwiZmVlZFwiLFwiYW5pbWFsXCIsXCJzb3VyY2VzXCIsXCJtZXhpY29cIixcInBvcHVsYXRpb25cIixcInBhXCIsXCJyZWd1bGFyXCIsXCJzZWN1cmVcIixcIm5hdmlnYXRpb25cIixcIm9wZXJhdGlvbnNcIixcInRoZXJlZm9yZVwiLFwic2ltcGx5XCIsXCJldmlkZW5jZVwiLFwic3RhdGlvblwiLFwiY2hyaXN0aWFuXCIsXCJyb3VuZFwiLFwicGF5cGFsXCIsXCJmYXZvcml0ZVwiLFwidW5kZXJzdGFuZFwiLFwib3B0aW9uXCIsXCJtYXN0ZXJcIixcInZhbGxleVwiLFwicmVjZW50bHlcIixcInByb2JhYmx5XCIsXCJ0aHVcIixcInJlbnRhbHNcIixcInNlYVwiLFwiYnVpbHRcIixcInB1YmxpY2F0aW9uc1wiLFwiYmxvb2RcIixcImN1dFwiLFwid29ybGR3aWRlXCIsXCJpbXByb3ZlXCIsXCJjb25uZWN0aW9uXCIsXCJwdWJsaXNoZXJcIixcImhhbGxcIixcImxhcmdlclwiLFwiYW50aVwiLFwibmV0d29ya3NcIixcImVhcnRoXCIsXCJwYXJlbnRzXCIsXCJub2tpYVwiLFwiaW1wYWN0XCIsXCJ0cmFuc2ZlclwiLFwiaW50cm9kdWN0aW9uXCIsXCJraXRjaGVuXCIsXCJzdHJvbmdcIixcInRlbFwiLFwiY2Fyb2xpbmFcIixcIndlZGRpbmdcIixcInByb3BlcnRpZXNcIixcImhvc3BpdGFsXCIsXCJncm91bmRcIixcIm92ZXJ2aWV3XCIsXCJzaGlwXCIsXCJhY2NvbW1vZGF0aW9uXCIsXCJvd25lcnNcIixcImRpc2Vhc2VcIixcInR4XCIsXCJleGNlbGxlbnRcIixcInBhaWRcIixcIml0YWx5XCIsXCJwZXJmZWN0XCIsXCJoYWlyXCIsXCJvcHBvcnR1bml0eVwiLFwia2l0XCIsXCJjbGFzc2ljXCIsXCJiYXNpc1wiLFwiY29tbWFuZFwiLFwiY2l0aWVzXCIsXCJ3aWxsaWFtXCIsXCJleHByZXNzXCIsXCJhd2FyZFwiLFwiZGlzdGFuY2VcIixcInRyZWVcIixcInBldGVyXCIsXCJhc3Nlc3NtZW50XCIsXCJlbnN1cmVcIixcInRodXNcIixcIndhbGxcIixcImllXCIsXCJpbnZvbHZlZFwiLFwiZWxcIixcImV4dHJhXCIsXCJlc3BlY2lhbGx5XCIsXCJpbnRlcmZhY2VcIixcInBhcnRuZXJzXCIsXCJidWRnZXRcIixcInJhdGVkXCIsXCJndWlkZXNcIixcInN1Y2Nlc3NcIixcIm1heGltdW1cIixcIm1hXCIsXCJvcGVyYXRpb25cIixcImV4aXN0aW5nXCIsXCJxdWl0ZVwiLFwic2VsZWN0ZWRcIixcImJveVwiLFwiYW1hem9uXCIsXCJwYXRpZW50c1wiLFwicmVzdGF1cmFudHNcIixcImJlYXV0aWZ1bFwiLFwid2FybmluZ1wiLFwid2luZVwiLFwibG9jYXRpb25zXCIsXCJob3JzZVwiLFwidm90ZVwiLFwiZm9yd2FyZFwiLFwiZmxvd2Vyc1wiLFwic3RhcnNcIixcInNpZ25pZmljYW50XCIsXCJsaXN0c1wiLFwidGVjaG5vbG9naWVzXCIsXCJvd25lclwiLFwicmV0YWlsXCIsXCJhbmltYWxzXCIsXCJ1c2VmdWxcIixcImRpcmVjdGx5XCIsXCJtYW51ZmFjdHVyZXJcIixcIndheXNcIixcImVzdFwiLFwic29uXCIsXCJwcm92aWRpbmdcIixcInJ1bGVcIixcIm1hY1wiLFwiaG91c2luZ1wiLFwidGFrZXNcIixcImlpaVwiLFwiZ210XCIsXCJicmluZ1wiLFwiY2F0YWxvZ1wiLFwic2VhcmNoZXNcIixcIm1heFwiLFwidHJ5aW5nXCIsXCJtb3RoZXJcIixcImF1dGhvcml0eVwiLFwiY29uc2lkZXJlZFwiLFwidG9sZFwiLFwieG1sXCIsXCJ0cmFmZmljXCIsXCJwcm9ncmFtbWVcIixcImpvaW5lZFwiLFwiaW5wdXRcIixcInN0cmF0ZWd5XCIsXCJmZWV0XCIsXCJhZ2VudFwiLFwidmFsaWRcIixcImJpblwiLFwibW9kZXJuXCIsXCJzZW5pb3JcIixcImlyZWxhbmRcIixcInRlYWNoaW5nXCIsXCJkb29yXCIsXCJncmFuZFwiLFwidGVzdGluZ1wiLFwidHJpYWxcIixcImNoYXJnZVwiLFwidW5pdHNcIixcImluc3RlYWRcIixcImNhbmFkaWFuXCIsXCJjb29sXCIsXCJub3JtYWxcIixcIndyb3RlXCIsXCJlbnRlcnByaXNlXCIsXCJzaGlwc1wiLFwiZW50aXJlXCIsXCJlZHVjYXRpb25hbFwiLFwibWRcIixcImxlYWRpbmdcIixcIm1ldGFsXCIsXCJwb3NpdGl2ZVwiLFwiZmxcIixcImZpdG5lc3NcIixcImNoaW5lc2VcIixcIm9waW5pb25cIixcIm1iXCIsXCJhc2lhXCIsXCJmb290YmFsbFwiLFwiYWJzdHJhY3RcIixcInVzZXNcIixcIm91dHB1dFwiLFwiZnVuZHNcIixcIm1yXCIsXCJncmVhdGVyXCIsXCJsaWtlbHlcIixcImRldmVsb3BcIixcImVtcGxveWVlc1wiLFwiYXJ0aXN0c1wiLFwiYWx0ZXJuYXRpdmVcIixcInByb2Nlc3NpbmdcIixcInJlc3BvbnNpYmlsaXR5XCIsXCJyZXNvbHV0aW9uXCIsXCJqYXZhXCIsXCJndWVzdFwiLFwic2VlbXNcIixcInB1YmxpY2F0aW9uXCIsXCJwYXNzXCIsXCJyZWxhdGlvbnNcIixcInRydXN0XCIsXCJ2YW5cIixcImNvbnRhaW5zXCIsXCJzZXNzaW9uXCIsXCJtdWx0aVwiLFwicGhvdG9ncmFwaHlcIixcInJlcHVibGljXCIsXCJmZWVzXCIsXCJjb21wb25lbnRzXCIsXCJ2YWNhdGlvblwiLFwiY2VudHVyeVwiLFwiYWNhZGVtaWNcIixcImFzc2lzdGFuY2VcIixcImNvbXBsZXRlZFwiLFwic2tpblwiLFwiZ3JhcGhpY3NcIixcImluZGlhblwiLFwicHJldlwiLFwiYWRzXCIsXCJtYXJ5XCIsXCJpbFwiLFwiZXhwZWN0ZWRcIixcInJpbmdcIixcImdyYWRlXCIsXCJkYXRpbmdcIixcInBhY2lmaWNcIixcIm1vdW50YWluXCIsXCJvcmdhbml6YXRpb25zXCIsXCJwb3BcIixcImZpbHRlclwiLFwibWFpbGluZ1wiLFwidmVoaWNsZVwiLFwibG9uZ2VyXCIsXCJjb25zaWRlclwiLFwiaW50XCIsXCJub3J0aGVyblwiLFwiYmVoaW5kXCIsXCJwYW5lbFwiLFwiZmxvb3JcIixcImdlcm1hblwiLFwiYnV5aW5nXCIsXCJtYXRjaFwiLFwicHJvcG9zZWRcIixcImRlZmF1bHRcIixcInJlcXVpcmVcIixcImlyYXFcIixcImJveXNcIixcIm91dGRvb3JcIixcImRlZXBcIixcIm1vcm5pbmdcIixcIm90aGVyd2lzZVwiLFwiYWxsb3dzXCIsXCJyZXN0XCIsXCJwcm90ZWluXCIsXCJwbGFudFwiLFwicmVwb3J0ZWRcIixcImhpdFwiLFwidHJhbnNwb3J0YXRpb25cIixcIm1tXCIsXCJwb29sXCIsXCJtaW5pXCIsXCJwb2xpdGljc1wiLFwicGFydG5lclwiLFwiZGlzY2xhaW1lclwiLFwiYXV0aG9yc1wiLFwiYm9hcmRzXCIsXCJmYWN1bHR5XCIsXCJwYXJ0aWVzXCIsXCJmaXNoXCIsXCJtZW1iZXJzaGlwXCIsXCJtaXNzaW9uXCIsXCJleWVcIixcInN0cmluZ1wiLFwic2Vuc2VcIixcIm1vZGlmaWVkXCIsXCJwYWNrXCIsXCJyZWxlYXNlZFwiLFwic3RhZ2VcIixcImludGVybmFsXCIsXCJnb29kc1wiLFwicmVjb21tZW5kZWRcIixcImJvcm5cIixcInVubGVzc1wiLFwicmljaGFyZFwiLFwiZGV0YWlsZWRcIixcImphcGFuZXNlXCIsXCJyYWNlXCIsXCJhcHByb3ZlZFwiLFwiYmFja2dyb3VuZFwiLFwidGFyZ2V0XCIsXCJleGNlcHRcIixcImNoYXJhY3RlclwiLFwidXNiXCIsXCJtYWludGVuYW5jZVwiLFwiYWJpbGl0eVwiLFwibWF5YmVcIixcImZ1bmN0aW9uc1wiLFwiZWRcIixcIm1vdmluZ1wiLFwiYnJhbmRzXCIsXCJwbGFjZXNcIixcInBocFwiLFwicHJldHR5XCIsXCJ0cmFkZW1hcmtzXCIsXCJwaGVudGVybWluZVwiLFwic3BhaW5cIixcInNvdXRoZXJuXCIsXCJ5b3Vyc2VsZlwiLFwiZXRjXCIsXCJ3aW50ZXJcIixcImJhdHRlcnlcIixcInlvdXRoXCIsXCJwcmVzc3VyZVwiLFwic3VibWl0dGVkXCIsXCJib3N0b25cIixcImRlYnRcIixcImtleXdvcmRzXCIsXCJtZWRpdW1cIixcInRlbGV2aXNpb25cIixcImludGVyZXN0ZWRcIixcImNvcmVcIixcImJyZWFrXCIsXCJwdXJwb3Nlc1wiLFwidGhyb3VnaG91dFwiLFwic2V0c1wiLFwiZGFuY2VcIixcIndvb2RcIixcIm1zblwiLFwiaXRzZWxmXCIsXCJkZWZpbmVkXCIsXCJwYXBlcnNcIixcInBsYXlpbmdcIixcImF3YXJkc1wiLFwiZmVlXCIsXCJzdHVkaW9cIixcInJlYWRlclwiLFwidmlydHVhbFwiLFwiZGV2aWNlXCIsXCJlc3RhYmxpc2hlZFwiLFwiYW5zd2Vyc1wiLFwicmVudFwiLFwibGFzXCIsXCJyZW1vdGVcIixcImRhcmtcIixcInByb2dyYW1taW5nXCIsXCJleHRlcm5hbFwiLFwiYXBwbGVcIixcImxlXCIsXCJyZWdhcmRpbmdcIixcImluc3RydWN0aW9uc1wiLFwibWluXCIsXCJvZmZlcmVkXCIsXCJ0aGVvcnlcIixcImVuam95XCIsXCJyZW1vdmVcIixcImFpZFwiLFwic3VyZmFjZVwiLFwibWluaW11bVwiLFwidmlzdWFsXCIsXCJob3N0XCIsXCJ2YXJpZXR5XCIsXCJ0ZWFjaGVyc1wiLFwiaXNiblwiLFwibWFydGluXCIsXCJtYW51YWxcIixcImJsb2NrXCIsXCJzdWJqZWN0c1wiLFwiYWdlbnRzXCIsXCJpbmNyZWFzZWRcIixcInJlcGFpclwiLFwiZmFpclwiLFwiY2l2aWxcIixcInN0ZWVsXCIsXCJ1bmRlcnN0YW5kaW5nXCIsXCJzb25nc1wiLFwiZml4ZWRcIixcIndyb25nXCIsXCJiZWdpbm5pbmdcIixcImhhbmRzXCIsXCJhc3NvY2lhdGVzXCIsXCJmaW5hbGx5XCIsXCJhelwiLFwidXBkYXRlc1wiLFwiZGVza3RvcFwiLFwiY2xhc3Nlc1wiLFwicGFyaXNcIixcIm9oaW9cIixcImdldHNcIixcInNlY3RvclwiLFwiY2FwYWNpdHlcIixcInJlcXVpcmVzXCIsXCJqZXJzZXlcIixcInVuXCIsXCJmYXRcIixcImZ1bGx5XCIsXCJmYXRoZXJcIixcImVsZWN0cmljXCIsXCJzYXdcIixcImluc3RydW1lbnRzXCIsXCJxdW90ZXNcIixcIm9mZmljZXJcIixcImRyaXZlclwiLFwiYnVzaW5lc3Nlc1wiLFwiZGVhZFwiLFwicmVzcGVjdFwiLFwidW5rbm93blwiLFwic3BlY2lmaWVkXCIsXCJyZXN0YXVyYW50XCIsXCJtaWtlXCIsXCJ0cmlwXCIsXCJwc3RcIixcIndvcnRoXCIsXCJtaVwiLFwicHJvY2VkdXJlc1wiLFwicG9vclwiLFwidGVhY2hlclwiLFwiZXllc1wiLFwicmVsYXRpb25zaGlwXCIsXCJ3b3JrZXJzXCIsXCJmYXJtXCIsXCJnZW9yZ2lhXCIsXCJwZWFjZVwiLFwidHJhZGl0aW9uYWxcIixcImNhbXB1c1wiLFwidG9tXCIsXCJzaG93aW5nXCIsXCJjcmVhdGl2ZVwiLFwiY29hc3RcIixcImJlbmVmaXRcIixcInByb2dyZXNzXCIsXCJmdW5kaW5nXCIsXCJkZXZpY2VzXCIsXCJsb3JkXCIsXCJncmFudFwiLFwic3ViXCIsXCJhZ3JlZVwiLFwiZmljdGlvblwiLFwiaGVhclwiLFwic29tZXRpbWVzXCIsXCJ3YXRjaGVzXCIsXCJjYXJlZXJzXCIsXCJiZXlvbmRcIixcImdvZXNcIixcImZhbWlsaWVzXCIsXCJsZWRcIixcIm11c2V1bVwiLFwidGhlbXNlbHZlc1wiLFwiZmFuXCIsXCJ0cmFuc3BvcnRcIixcImludGVyZXN0aW5nXCIsXCJibG9nc1wiLFwid2lmZVwiLFwiZXZhbHVhdGlvblwiLFwiYWNjZXB0ZWRcIixcImZvcm1lclwiLFwiaW1wbGVtZW50YXRpb25cIixcInRlblwiLFwiaGl0c1wiLFwiem9uZVwiLFwiY29tcGxleFwiLFwidGhcIixcImNhdFwiLFwiZ2FsbGVyaWVzXCIsXCJyZWZlcmVuY2VzXCIsXCJkaWVcIixcInByZXNlbnRlZFwiLFwiamFja1wiLFwiZmxhdFwiLFwiZmxvd1wiLFwiYWdlbmNpZXNcIixcImxpdGVyYXR1cmVcIixcInJlc3BlY3RpdmVcIixcInBhcmVudFwiLFwic3BhbmlzaFwiLFwibWljaGlnYW5cIixcImNvbHVtYmlhXCIsXCJzZXR0aW5nXCIsXCJkclwiLFwic2NhbGVcIixcInN0YW5kXCIsXCJlY29ub215XCIsXCJoaWdoZXN0XCIsXCJoZWxwZnVsXCIsXCJtb250aGx5XCIsXCJjcml0aWNhbFwiLFwiZnJhbWVcIixcIm11c2ljYWxcIixcImRlZmluaXRpb25cIixcInNlY3JldGFyeVwiLFwiYW5nZWxlc1wiLFwibmV0d29ya2luZ1wiLFwicGF0aFwiLFwiYXVzdHJhbGlhblwiLFwiZW1wbG95ZWVcIixcImNoaWVmXCIsXCJnaXZlc1wiLFwia2JcIixcImJvdHRvbVwiLFwibWFnYXppbmVzXCIsXCJwYWNrYWdlc1wiLFwiZGV0YWlsXCIsXCJmcmFuY2lzY29cIixcImxhd3NcIixcImNoYW5nZWRcIixcInBldFwiLFwiaGVhcmRcIixcImJlZ2luXCIsXCJpbmRpdmlkdWFsc1wiLFwiY29sb3JhZG9cIixcInJveWFsXCIsXCJjbGVhblwiLFwic3dpdGNoXCIsXCJydXNzaWFuXCIsXCJsYXJnZXN0XCIsXCJhZnJpY2FuXCIsXCJndXlcIixcInRpdGxlc1wiLFwicmVsZXZhbnRcIixcImd1aWRlbGluZXNcIixcImp1c3RpY2VcIixcImNvbm5lY3RcIixcImJpYmxlXCIsXCJkZXZcIixcImN1cFwiLFwiYmFza2V0XCIsXCJhcHBsaWVkXCIsXCJ3ZWVrbHlcIixcInZvbFwiLFwiaW5zdGFsbGF0aW9uXCIsXCJkZXNjcmliZWRcIixcImRlbWFuZFwiLFwicHBcIixcInN1aXRlXCIsXCJ2ZWdhc1wiLFwibmFcIixcInNxdWFyZVwiLFwiY2hyaXNcIixcImF0dGVudGlvblwiLFwiYWR2YW5jZVwiLFwic2tpcFwiLFwiZGlldFwiLFwiYXJteVwiLFwiYXVjdGlvblwiLFwiZ2VhclwiLFwibGVlXCIsXCJvc1wiLFwiZGlmZmVyZW5jZVwiLFwiYWxsb3dlZFwiLFwiY29ycmVjdFwiLFwiY2hhcmxlc1wiLFwibmF0aW9uXCIsXCJzZWxsaW5nXCIsXCJsb3RzXCIsXCJwaWVjZVwiLFwic2hlZXRcIixcImZpcm1cIixcInNldmVuXCIsXCJvbGRlclwiLFwiaWxsaW5vaXNcIixcInJlZ3VsYXRpb25zXCIsXCJlbGVtZW50c1wiLFwic3BlY2llc1wiLFwianVtcFwiLFwiY2VsbHNcIixcIm1vZHVsZVwiLFwicmVzb3J0XCIsXCJmYWNpbGl0eVwiLFwicmFuZG9tXCIsXCJwcmljaW5nXCIsXCJkdmRzXCIsXCJjZXJ0aWZpY2F0ZVwiLFwibWluaXN0ZXJcIixcIm1vdGlvblwiLFwibG9va3NcIixcImZhc2hpb25cIixcImRpcmVjdGlvbnNcIixcInZpc2l0b3JzXCIsXCJkb2N1bWVudGF0aW9uXCIsXCJtb25pdG9yXCIsXCJ0cmFkaW5nXCIsXCJmb3Jlc3RcIixcImNhbGxzXCIsXCJ3aG9zZVwiLFwiY292ZXJhZ2VcIixcImNvdXBsZVwiLFwiZ2l2aW5nXCIsXCJjaGFuY2VcIixcInZpc2lvblwiLFwiYmFsbFwiLFwiZW5kaW5nXCIsXCJjbGllbnRzXCIsXCJhY3Rpb25zXCIsXCJsaXN0ZW5cIixcImRpc2N1c3NcIixcImFjY2VwdFwiLFwiYXV0b21vdGl2ZVwiLFwibmFrZWRcIixcImdvYWxcIixcInN1Y2Nlc3NmdWxcIixcInNvbGRcIixcIndpbmRcIixcImNvbW11bml0aWVzXCIsXCJjbGluaWNhbFwiLFwic2l0dWF0aW9uXCIsXCJzY2llbmNlc1wiLFwibWFya2V0c1wiLFwibG93ZXN0XCIsXCJoaWdobHlcIixcInB1Ymxpc2hpbmdcIixcImFwcGVhclwiLFwiZW1lcmdlbmN5XCIsXCJkZXZlbG9waW5nXCIsXCJsaXZlc1wiLFwiY3VycmVuY3lcIixcImxlYXRoZXJcIixcImRldGVybWluZVwiLFwidGVtcGVyYXR1cmVcIixcInBhbG1cIixcImFubm91bmNlbWVudHNcIixcInBhdGllbnRcIixcImFjdHVhbFwiLFwiaGlzdG9yaWNhbFwiLFwic3RvbmVcIixcImJvYlwiLFwiY29tbWVyY2VcIixcInJpbmd0b25lc1wiLFwicGVyaGFwc1wiLFwicGVyc29uc1wiLFwiZGlmZmljdWx0XCIsXCJzY2llbnRpZmljXCIsXCJzYXRlbGxpdGVcIixcImZpdFwiLFwidGVzdHNcIixcInZpbGxhZ2VcIixcImFjY291bnRzXCIsXCJhbWF0ZXVyXCIsXCJleFwiLFwibWV0XCIsXCJwYWluXCIsXCJ4Ym94XCIsXCJwYXJ0aWN1bGFybHlcIixcImZhY3RvcnNcIixcImNvZmZlZVwiLFwid3d3XCIsXCJzZXR0aW5nc1wiLFwiYnV5ZXJcIixcImN1bHR1cmFsXCIsXCJzdGV2ZVwiLFwiZWFzaWx5XCIsXCJvcmFsXCIsXCJmb3JkXCIsXCJwb3N0ZXJcIixcImVkZ2VcIixcImZ1bmN0aW9uYWxcIixcInJvb3RcIixcImF1XCIsXCJmaVwiLFwiY2xvc2VkXCIsXCJob2xpZGF5c1wiLFwiaWNlXCIsXCJwaW5rXCIsXCJ6ZWFsYW5kXCIsXCJiYWxhbmNlXCIsXCJtb25pdG9yaW5nXCIsXCJncmFkdWF0ZVwiLFwicmVwbGllc1wiLFwic2hvdFwiLFwibmNcIixcImFyY2hpdGVjdHVyZVwiLFwiaW5pdGlhbFwiLFwibGFiZWxcIixcInRoaW5raW5nXCIsXCJzY290dFwiLFwibGxjXCIsXCJzZWNcIixcInJlY29tbWVuZFwiLFwiY2Fub25cIixcImxlYWd1ZVwiLFwid2FzdGVcIixcIm1pbnV0ZVwiLFwiYnVzXCIsXCJwcm92aWRlclwiLFwib3B0aW9uYWxcIixcImRpY3Rpb25hcnlcIixcImNvbGRcIixcImFjY291bnRpbmdcIixcIm1hbnVmYWN0dXJpbmdcIixcInNlY3Rpb25zXCIsXCJjaGFpclwiLFwiZmlzaGluZ1wiLFwiZWZmb3J0XCIsXCJwaGFzZVwiLFwiZmllbGRzXCIsXCJiYWdcIixcImZhbnRhc3lcIixcInBvXCIsXCJsZXR0ZXJzXCIsXCJtb3RvclwiLFwidmFcIixcInByb2Zlc3NvclwiLFwiY29udGV4dFwiLFwiaW5zdGFsbFwiLFwic2hpcnRcIixcImFwcGFyZWxcIixcImdlbmVyYWxseVwiLFwiY29udGludWVkXCIsXCJmb290XCIsXCJtYXNzXCIsXCJjcmltZVwiLFwiY291bnRcIixcImJyZWFzdFwiLFwidGVjaG5pcXVlc1wiLFwiaWJtXCIsXCJyZFwiLFwiam9obnNvblwiLFwic2NcIixcInF1aWNrbHlcIixcImRvbGxhcnNcIixcIndlYnNpdGVzXCIsXCJyZWxpZ2lvblwiLFwiY2xhaW1cIixcImRyaXZpbmdcIixcInBlcm1pc3Npb25cIixcInN1cmdlcnlcIixcInBhdGNoXCIsXCJoZWF0XCIsXCJ3aWxkXCIsXCJtZWFzdXJlc1wiLFwiZ2VuZXJhdGlvblwiLFwia2Fuc2FzXCIsXCJtaXNzXCIsXCJjaGVtaWNhbFwiLFwiZG9jdG9yXCIsXCJ0YXNrXCIsXCJyZWR1Y2VcIixcImJyb3VnaHRcIixcImhpbXNlbGZcIixcIm5vclwiLFwiY29tcG9uZW50XCIsXCJlbmFibGVcIixcImV4ZXJjaXNlXCIsXCJidWdcIixcInNhbnRhXCIsXCJtaWRcIixcImd1YXJhbnRlZVwiLFwibGVhZGVyXCIsXCJkaWFtb25kXCIsXCJpc3JhZWxcIixcInNlXCIsXCJwcm9jZXNzZXNcIixcInNvZnRcIixcInNlcnZlcnNcIixcImFsb25lXCIsXCJtZWV0aW5nc1wiLFwic2Vjb25kc1wiLFwiam9uZXNcIixcImFyaXpvbmFcIixcImtleXdvcmRcIixcImludGVyZXN0c1wiLFwiZmxpZ2h0XCIsXCJjb25ncmVzc1wiLFwiZnVlbFwiLFwidXNlcm5hbWVcIixcIndhbGtcIixcInByb2R1Y2VkXCIsXCJpdGFsaWFuXCIsXCJwYXBlcmJhY2tcIixcImNsYXNzaWZpZWRzXCIsXCJ3YWl0XCIsXCJzdXBwb3J0ZWRcIixcInBvY2tldFwiLFwic2FpbnRcIixcInJvc2VcIixcImZyZWVkb21cIixcImFyZ3VtZW50XCIsXCJjb21wZXRpdGlvblwiLFwiY3JlYXRpbmdcIixcImppbVwiLFwiZHJ1Z3NcIixcImpvaW50XCIsXCJwcmVtaXVtXCIsXCJwcm92aWRlcnNcIixcImZyZXNoXCIsXCJjaGFyYWN0ZXJzXCIsXCJhdHRvcm5leVwiLFwidXBncmFkZVwiLFwiZGlcIixcImZhY3RvclwiLFwiZ3Jvd2luZ1wiLFwidGhvdXNhbmRzXCIsXCJrbVwiLFwic3RyZWFtXCIsXCJhcGFydG1lbnRzXCIsXCJwaWNrXCIsXCJoZWFyaW5nXCIsXCJlYXN0ZXJuXCIsXCJhdWN0aW9uc1wiLFwidGhlcmFweVwiLFwiZW50cmllc1wiLFwiZGF0ZXNcIixcImdlbmVyYXRlZFwiLFwic2lnbmVkXCIsXCJ1cHBlclwiLFwiYWRtaW5pc3RyYXRpdmVcIixcInNlcmlvdXNcIixcInByaW1lXCIsXCJzYW1zdW5nXCIsXCJsaW1pdFwiLFwiYmVnYW5cIixcImxvdWlzXCIsXCJzdGVwc1wiLFwiZXJyb3JzXCIsXCJzaG9wc1wiLFwiZGVsXCIsXCJlZmZvcnRzXCIsXCJpbmZvcm1lZFwiLFwiZ2FcIixcImFjXCIsXCJ0aG91Z2h0c1wiLFwiY3JlZWtcIixcImZ0XCIsXCJ3b3JrZWRcIixcInF1YW50aXR5XCIsXCJ1cmJhblwiLFwicHJhY3RpY2VzXCIsXCJzb3J0ZWRcIixcInJlcG9ydGluZ1wiLFwiZXNzZW50aWFsXCIsXCJteXNlbGZcIixcInRvdXJzXCIsXCJwbGF0Zm9ybVwiLFwibG9hZFwiLFwiYWZmaWxpYXRlXCIsXCJsYWJvclwiLFwiaW1tZWRpYXRlbHlcIixcImFkbWluXCIsXCJudXJzaW5nXCIsXCJkZWZlbnNlXCIsXCJtYWNoaW5lc1wiLFwiZGVzaWduYXRlZFwiLFwidGFnc1wiLFwiaGVhdnlcIixcImNvdmVyZWRcIixcInJlY292ZXJ5XCIsXCJqb2VcIixcImd1eXNcIixcImludGVncmF0ZWRcIixcImNvbmZpZ3VyYXRpb25cIixcIm1lcmNoYW50XCIsXCJjb21wcmVoZW5zaXZlXCIsXCJleHBlcnRcIixcInVuaXZlcnNhbFwiLFwicHJvdGVjdFwiLFwiZHJvcFwiLFwic29saWRcIixcImNkc1wiLFwicHJlc2VudGF0aW9uXCIsXCJsYW5ndWFnZXNcIixcImJlY2FtZVwiLFwib3JhbmdlXCIsXCJjb21wbGlhbmNlXCIsXCJ2ZWhpY2xlc1wiLFwicHJldmVudFwiLFwidGhlbWVcIixcInJpY2hcIixcImltXCIsXCJjYW1wYWlnblwiLFwibWFyaW5lXCIsXCJpbXByb3ZlbWVudFwiLFwidnNcIixcImd1aXRhclwiLFwiZmluZGluZ1wiLFwicGVubnN5bHZhbmlhXCIsXCJleGFtcGxlc1wiLFwiaXBvZFwiLFwic2F5aW5nXCIsXCJzcGlyaXRcIixcImFyXCIsXCJjbGFpbXNcIixcImNoYWxsZW5nZVwiLFwibW90b3JvbGFcIixcImFjY2VwdGFuY2VcIixcInN0cmF0ZWdpZXNcIixcIm1vXCIsXCJzZWVtXCIsXCJhZmZhaXJzXCIsXCJ0b3VjaFwiLFwiaW50ZW5kZWRcIixcInRvd2FyZHNcIixcInNhXCIsXCJnb2Fsc1wiLFwiaGlyZVwiLFwiZWxlY3Rpb25cIixcInN1Z2dlc3RcIixcImJyYW5jaFwiLFwiY2hhcmdlc1wiLFwic2VydmVcIixcImFmZmlsaWF0ZXNcIixcInJlYXNvbnNcIixcIm1hZ2ljXCIsXCJtb3VudFwiLFwic21hcnRcIixcInRhbGtpbmdcIixcImdhdmVcIixcIm9uZXNcIixcImxhdGluXCIsXCJtdWx0aW1lZGlhXCIsXCJ4cFwiLFwiYXZvaWRcIixcImNlcnRpZmllZFwiLFwibWFuYWdlXCIsXCJjb3JuZXJcIixcInJhbmtcIixcImNvbXB1dGluZ1wiLFwib3JlZ29uXCIsXCJlbGVtZW50XCIsXCJiaXJ0aFwiLFwidmlydXNcIixcImFidXNlXCIsXCJpbnRlcmFjdGl2ZVwiLFwicmVxdWVzdHNcIixcInNlcGFyYXRlXCIsXCJxdWFydGVyXCIsXCJwcm9jZWR1cmVcIixcImxlYWRlcnNoaXBcIixcInRhYmxlc1wiLFwiZGVmaW5lXCIsXCJyYWNpbmdcIixcInJlbGlnaW91c1wiLFwiZmFjdHNcIixcImJyZWFrZmFzdFwiLFwia29uZ1wiLFwiY29sdW1uXCIsXCJwbGFudHNcIixcImZhaXRoXCIsXCJjaGFpblwiLFwiZGV2ZWxvcGVyXCIsXCJpZGVudGlmeVwiLFwiYXZlbnVlXCIsXCJtaXNzaW5nXCIsXCJkaWVkXCIsXCJhcHByb3hpbWF0ZWx5XCIsXCJkb21lc3RpY1wiLFwic2l0ZW1hcFwiLFwicmVjb21tZW5kYXRpb25zXCIsXCJtb3ZlZFwiLFwiaG91c3RvblwiLFwicmVhY2hcIixcImNvbXBhcmlzb25cIixcIm1lbnRhbFwiLFwidmlld2VkXCIsXCJtb21lbnRcIixcImV4dGVuZGVkXCIsXCJzZXF1ZW5jZVwiLFwiaW5jaFwiLFwiYXR0YWNrXCIsXCJzb3JyeVwiLFwiY2VudGVyc1wiLFwib3BlbmluZ1wiLFwiZGFtYWdlXCIsXCJsYWJcIixcInJlc2VydmVcIixcInJlY2lwZXNcIixcImN2c1wiLFwiZ2FtbWFcIixcInBsYXN0aWNcIixcInByb2R1Y2VcIixcInNub3dcIixcInBsYWNlZFwiLFwidHJ1dGhcIixcImNvdW50ZXJcIixcImZhaWx1cmVcIixcImZvbGxvd3NcIixcImV1XCIsXCJ3ZWVrZW5kXCIsXCJkb2xsYXJcIixcImNhbXBcIixcIm9udGFyaW9cIixcImF1dG9tYXRpY2FsbHlcIixcImRlc1wiLFwibWlubmVzb3RhXCIsXCJmaWxtc1wiLFwiYnJpZGdlXCIsXCJuYXRpdmVcIixcImZpbGxcIixcIndpbGxpYW1zXCIsXCJtb3ZlbWVudFwiLFwicHJpbnRpbmdcIixcImJhc2ViYWxsXCIsXCJvd25lZFwiLFwiYXBwcm92YWxcIixcImRyYWZ0XCIsXCJjaGFydFwiLFwicGxheWVkXCIsXCJjb250YWN0c1wiLFwiY2NcIixcImplc3VzXCIsXCJyZWFkZXJzXCIsXCJjbHVic1wiLFwibGNkXCIsXCJ3YVwiLFwiamFja3NvblwiLFwiZXF1YWxcIixcImFkdmVudHVyZVwiLFwibWF0Y2hpbmdcIixcIm9mZmVyaW5nXCIsXCJzaGlydHNcIixcInByb2ZpdFwiLFwibGVhZGVyc1wiLFwicG9zdGVyc1wiLFwiaW5zdGl0dXRpb25zXCIsXCJhc3Npc3RhbnRcIixcInZhcmlhYmxlXCIsXCJhdmVcIixcImRqXCIsXCJhZHZlcnRpc2VtZW50XCIsXCJleHBlY3RcIixcInBhcmtpbmdcIixcImhlYWRsaW5lc1wiLFwieWVzdGVyZGF5XCIsXCJjb21wYXJlZFwiLFwiZGV0ZXJtaW5lZFwiLFwid2hvbGVzYWxlXCIsXCJ3b3Jrc2hvcFwiLFwicnVzc2lhXCIsXCJnb25lXCIsXCJjb2Rlc1wiLFwia2luZHNcIixcImV4dGVuc2lvblwiLFwic2VhdHRsZVwiLFwic3RhdGVtZW50c1wiLFwiZ29sZGVuXCIsXCJjb21wbGV0ZWx5XCIsXCJ0ZWFtc1wiLFwiZm9ydFwiLFwiY21cIixcIndpXCIsXCJsaWdodGluZ1wiLFwic2VuYXRlXCIsXCJmb3JjZXNcIixcImZ1bm55XCIsXCJicm90aGVyXCIsXCJnZW5lXCIsXCJ0dXJuZWRcIixcInBvcnRhYmxlXCIsXCJ0cmllZFwiLFwiZWxlY3RyaWNhbFwiLFwiYXBwbGljYWJsZVwiLFwiZGlzY1wiLFwicmV0dXJuZWRcIixcInBhdHRlcm5cIixcImN0XCIsXCJib2F0XCIsXCJuYW1lZFwiLFwidGhlYXRyZVwiLFwibGFzZXJcIixcImVhcmxpZXJcIixcIm1hbnVmYWN0dXJlcnNcIixcInNwb25zb3JcIixcImNsYXNzaWNhbFwiLFwiaWNvblwiLFwid2FycmFudHlcIixcImRlZGljYXRlZFwiLFwiaW5kaWFuYVwiLFwiZGlyZWN0aW9uXCIsXCJoYXJyeVwiLFwiYmFza2V0YmFsbFwiLFwib2JqZWN0c1wiLFwiZW5kc1wiLFwiZGVsZXRlXCIsXCJldmVuaW5nXCIsXCJhc3NlbWJseVwiLFwibnVjbGVhclwiLFwidGF4ZXNcIixcIm1vdXNlXCIsXCJzaWduYWxcIixcImNyaW1pbmFsXCIsXCJpc3N1ZWRcIixcImJyYWluXCIsXCJzZXh1YWxcIixcIndpc2NvbnNpblwiLFwicG93ZXJmdWxcIixcImRyZWFtXCIsXCJvYnRhaW5lZFwiLFwiZmFsc2VcIixcImRhXCIsXCJjYXN0XCIsXCJmbG93ZXJcIixcImZlbHRcIixcInBlcnNvbm5lbFwiLFwicGFzc2VkXCIsXCJzdXBwbGllZFwiLFwiaWRlbnRpZmllZFwiLFwiZmFsbHNcIixcInBpY1wiLFwic291bFwiLFwiYWlkc1wiLFwib3BpbmlvbnNcIixcInByb21vdGVcIixcInN0YXRlZFwiLFwic3RhdHNcIixcImhhd2FpaVwiLFwicHJvZmVzc2lvbmFsc1wiLFwiYXBwZWFyc1wiLFwiY2FycnlcIixcImZsYWdcIixcImRlY2lkZWRcIixcIm5qXCIsXCJjb3ZlcnNcIixcImhyXCIsXCJlbVwiLFwiYWR2YW50YWdlXCIsXCJoZWxsb1wiLFwiZGVzaWduc1wiLFwibWFpbnRhaW5cIixcInRvdXJpc21cIixcInByaW9yaXR5XCIsXCJuZXdzbGV0dGVyc1wiLFwiYWR1bHRzXCIsXCJjbGlwc1wiLFwic2F2aW5nc1wiLFwiaXZcIixcImdyYXBoaWNcIixcImF0b21cIixcInBheW1lbnRzXCIsXCJyd1wiLFwiZXN0aW1hdGVkXCIsXCJiaW5kaW5nXCIsXCJicmllZlwiLFwiZW5kZWRcIixcIndpbm5pbmdcIixcImVpZ2h0XCIsXCJhbm9ueW1vdXNcIixcImlyb25cIixcInN0cmFpZ2h0XCIsXCJzY3JpcHRcIixcInNlcnZlZFwiLFwid2FudHNcIixcIm1pc2NlbGxhbmVvdXNcIixcInByZXBhcmVkXCIsXCJ2b2lkXCIsXCJkaW5pbmdcIixcImFsZXJ0XCIsXCJpbnRlZ3JhdGlvblwiLFwiYXRsYW50YVwiLFwiZGFrb3RhXCIsXCJ0YWdcIixcImludGVydmlld1wiLFwibWl4XCIsXCJmcmFtZXdvcmtcIixcImRpc2tcIixcImluc3RhbGxlZFwiLFwicXVlZW5cIixcInZoc1wiLFwiY3JlZGl0c1wiLFwiY2xlYXJseVwiLFwiZml4XCIsXCJoYW5kbGVcIixcInN3ZWV0XCIsXCJkZXNrXCIsXCJjcml0ZXJpYVwiLFwicHVibWVkXCIsXCJkYXZlXCIsXCJtYXNzYWNodXNldHRzXCIsXCJkaWVnb1wiLFwiaG9uZ1wiLFwidmljZVwiLFwiYXNzb2NpYXRlXCIsXCJuZVwiLFwidHJ1Y2tcIixcImJlaGF2aW9yXCIsXCJlbmxhcmdlXCIsXCJyYXlcIixcImZyZXF1ZW50bHlcIixcInJldmVudWVcIixcIm1lYXN1cmVcIixcImNoYW5naW5nXCIsXCJ2b3Rlc1wiLFwiZHVcIixcImR1dHlcIixcImxvb2tlZFwiLFwiZGlzY3Vzc2lvbnNcIixcImJlYXJcIixcImdhaW5cIixcImZlc3RpdmFsXCIsXCJsYWJvcmF0b3J5XCIsXCJvY2VhblwiLFwiZmxpZ2h0c1wiLFwiZXhwZXJ0c1wiLFwic2lnbnNcIixcImxhY2tcIixcImRlcHRoXCIsXCJpb3dhXCIsXCJ3aGF0ZXZlclwiLFwibG9nZ2VkXCIsXCJsYXB0b3BcIixcInZpbnRhZ2VcIixcInRyYWluXCIsXCJleGFjdGx5XCIsXCJkcnlcIixcImV4cGxvcmVcIixcIm1hcnlsYW5kXCIsXCJzcGFcIixcImNvbmNlcHRcIixcIm5lYXJseVwiLFwiZWxpZ2libGVcIixcImNoZWNrb3V0XCIsXCJyZWFsaXR5XCIsXCJmb3Jnb3RcIixcImhhbmRsaW5nXCIsXCJvcmlnaW5cIixcImtuZXdcIixcImdhbWluZ1wiLFwiZmVlZHNcIixcImJpbGxpb25cIixcImRlc3RpbmF0aW9uXCIsXCJzY290bGFuZFwiLFwiZmFzdGVyXCIsXCJpbnRlbGxpZ2VuY2VcIixcImRhbGxhc1wiLFwiYm91Z2h0XCIsXCJjb25cIixcInVwc1wiLFwibmF0aW9uc1wiLFwicm91dGVcIixcImZvbGxvd2VkXCIsXCJzcGVjaWZpY2F0aW9uc1wiLFwiYnJva2VuXCIsXCJ0cmlwYWR2aXNvclwiLFwiZnJhbmtcIixcImFsYXNrYVwiLFwiem9vbVwiLFwiYmxvd1wiLFwiYmF0dGxlXCIsXCJyZXNpZGVudGlhbFwiLFwiYW5pbWVcIixcInNwZWFrXCIsXCJkZWNpc2lvbnNcIixcImluZHVzdHJpZXNcIixcInByb3RvY29sXCIsXCJxdWVyeVwiLFwiY2xpcFwiLFwicGFydG5lcnNoaXBcIixcImVkaXRvcmlhbFwiLFwibnRcIixcImV4cHJlc3Npb25cIixcImVzXCIsXCJlcXVpdHlcIixcInByb3Zpc2lvbnNcIixcInNwZWVjaFwiLFwid2lyZVwiLFwicHJpbmNpcGxlc1wiLFwic3VnZ2VzdGlvbnNcIixcInJ1cmFsXCIsXCJzaGFyZWRcIixcInNvdW5kc1wiLFwicmVwbGFjZW1lbnRcIixcInRhcGVcIixcInN0cmF0ZWdpY1wiLFwianVkZ2VcIixcInNwYW1cIixcImVjb25vbWljc1wiLFwiYWNpZFwiLFwiYnl0ZXNcIixcImNlbnRcIixcImZvcmNlZFwiLFwiY29tcGF0aWJsZVwiLFwiZmlnaHRcIixcImFwYXJ0bWVudFwiLFwiaGVpZ2h0XCIsXCJudWxsXCIsXCJ6ZXJvXCIsXCJzcGVha2VyXCIsXCJmaWxlZFwiLFwiZ2JcIixcIm5ldGhlcmxhbmRzXCIsXCJvYnRhaW5cIixcImJjXCIsXCJjb25zdWx0aW5nXCIsXCJyZWNyZWF0aW9uXCIsXCJvZmZpY2VzXCIsXCJkZXNpZ25lclwiLFwicmVtYWluXCIsXCJtYW5hZ2VkXCIsXCJwclwiLFwiZmFpbGVkXCIsXCJtYXJyaWFnZVwiLFwicm9sbFwiLFwia29yZWFcIixcImJhbmtzXCIsXCJmclwiLFwicGFydGljaXBhbnRzXCIsXCJzZWNyZXRcIixcImJhdGhcIixcImFhXCIsXCJrZWxseVwiLFwibGVhZHNcIixcIm5lZ2F0aXZlXCIsXCJhdXN0aW5cIixcImZhdm9yaXRlc1wiLFwidG9yb250b1wiLFwidGhlYXRlclwiLFwic3ByaW5nc1wiLFwibWlzc291cmlcIixcImFuZHJld1wiLFwidmFyXCIsXCJwZXJmb3JtXCIsXCJoZWFsdGh5XCIsXCJ0cmFuc2xhdGlvblwiLFwiZXN0aW1hdGVzXCIsXCJmb250XCIsXCJhc3NldHNcIixcImluanVyeVwiLFwibXRcIixcImpvc2VwaFwiLFwibWluaXN0cnlcIixcImRyaXZlcnNcIixcImxhd3llclwiLFwiZmlndXJlc1wiLFwibWFycmllZFwiLFwicHJvdGVjdGVkXCIsXCJwcm9wb3NhbFwiLFwic2hhcmluZ1wiLFwicGhpbGFkZWxwaGlhXCIsXCJwb3J0YWxcIixcIndhaXRpbmdcIixcImJpcnRoZGF5XCIsXCJiZXRhXCIsXCJmYWlsXCIsXCJncmF0aXNcIixcImJhbmtpbmdcIixcIm9mZmljaWFsc1wiLFwiYnJpYW5cIixcInRvd2FyZFwiLFwid29uXCIsXCJzbGlnaHRseVwiLFwiYXNzaXN0XCIsXCJjb25kdWN0XCIsXCJjb250YWluZWRcIixcImxpbmdlcmllXCIsXCJsZWdpc2xhdGlvblwiLFwiY2FsbGluZ1wiLFwicGFyYW1ldGVyc1wiLFwiamF6elwiLFwic2VydmluZ1wiLFwiYmFnc1wiLFwicHJvZmlsZXNcIixcIm1pYW1pXCIsXCJjb21pY3NcIixcIm1hdHRlcnNcIixcImhvdXNlc1wiLFwiZG9jXCIsXCJwb3N0YWxcIixcInJlbGF0aW9uc2hpcHNcIixcInRlbm5lc3NlZVwiLFwid2VhclwiLFwiY29udHJvbHNcIixcImJyZWFraW5nXCIsXCJjb21iaW5lZFwiLFwidWx0aW1hdGVcIixcIndhbGVzXCIsXCJyZXByZXNlbnRhdGl2ZVwiLFwiZnJlcXVlbmN5XCIsXCJpbnRyb2R1Y2VkXCIsXCJtaW5vclwiLFwiZmluaXNoXCIsXCJkZXBhcnRtZW50c1wiLFwicmVzaWRlbnRzXCIsXCJub3RlZFwiLFwiZGlzcGxheWVkXCIsXCJtb21cIixcInJlZHVjZWRcIixcInBoeXNpY3NcIixcInJhcmVcIixcInNwZW50XCIsXCJwZXJmb3JtZWRcIixcImV4dHJlbWVcIixcInNhbXBsZXNcIixcImRhdmlzXCIsXCJkYW5pZWxcIixcImJhcnNcIixcInJldmlld2VkXCIsXCJyb3dcIixcIm96XCIsXCJmb3JlY2FzdFwiLFwicmVtb3ZlZFwiLFwiaGVscHNcIixcInNpbmdsZXNcIixcImFkbWluaXN0cmF0b3JcIixcImN5Y2xlXCIsXCJhbW91bnRzXCIsXCJjb250YWluXCIsXCJhY2N1cmFjeVwiLFwiZHVhbFwiLFwicmlzZVwiLFwidXNkXCIsXCJzbGVlcFwiLFwibWdcIixcImJpcmRcIixcInBoYXJtYWN5XCIsXCJicmF6aWxcIixcImNyZWF0aW9uXCIsXCJzdGF0aWNcIixcInNjZW5lXCIsXCJodW50ZXJcIixcImFkZHJlc3Nlc1wiLFwibGFkeVwiLFwiY3J5c3RhbFwiLFwiZmFtb3VzXCIsXCJ3cml0ZXJcIixcImNoYWlybWFuXCIsXCJ2aW9sZW5jZVwiLFwiZmFuc1wiLFwib2tsYWhvbWFcIixcInNwZWFrZXJzXCIsXCJkcmlua1wiLFwiYWNhZGVteVwiLFwiZHluYW1pY1wiLFwiZ2VuZGVyXCIsXCJlYXRcIixcInBlcm1hbmVudFwiLFwiYWdyaWN1bHR1cmVcIixcImRlbGxcIixcImNsZWFuaW5nXCIsXCJjb25zdGl0dXRlc1wiLFwicG9ydGZvbGlvXCIsXCJwcmFjdGljYWxcIixcImRlbGl2ZXJlZFwiLFwiY29sbGVjdGlibGVzXCIsXCJpbmZyYXN0cnVjdHVyZVwiLFwiZXhjbHVzaXZlXCIsXCJzZWF0XCIsXCJjb25jZXJuc1wiLFwiY29sb3VyXCIsXCJ2ZW5kb3JcIixcIm9yaWdpbmFsbHlcIixcImludGVsXCIsXCJ1dGlsaXRpZXNcIixcInBoaWxvc29waHlcIixcInJlZ3VsYXRpb25cIixcIm9mZmljZXJzXCIsXCJyZWR1Y3Rpb25cIixcImFpbVwiLFwiYmlkc1wiLFwicmVmZXJyZWRcIixcInN1cHBvcnRzXCIsXCJudXRyaXRpb25cIixcInJlY29yZGluZ1wiLFwicmVnaW9uc1wiLFwianVuaW9yXCIsXCJ0b2xsXCIsXCJsZXNcIixcImNhcGVcIixcImFublwiLFwicmluZ3NcIixcIm1lYW5pbmdcIixcInRpcFwiLFwic2Vjb25kYXJ5XCIsXCJ3b25kZXJmdWxcIixcIm1pbmVcIixcImxhZGllc1wiLFwiaGVucnlcIixcInRpY2tldFwiLFwiYW5ub3VuY2VkXCIsXCJndWVzc1wiLFwiYWdyZWVkXCIsXCJwcmV2ZW50aW9uXCIsXCJ3aG9tXCIsXCJza2lcIixcInNvY2NlclwiLFwibWF0aFwiLFwiaW1wb3J0XCIsXCJwb3N0aW5nXCIsXCJwcmVzZW5jZVwiLFwiaW5zdGFudFwiLFwibWVudGlvbmVkXCIsXCJhdXRvbWF0aWNcIixcImhlYWx0aGNhcmVcIixcInZpZXdpbmdcIixcIm1haW50YWluZWRcIixcImNoXCIsXCJpbmNyZWFzaW5nXCIsXCJtYWpvcml0eVwiLFwiY29ubmVjdGVkXCIsXCJjaHJpc3RcIixcImRhblwiLFwiZG9nc1wiLFwic2RcIixcImRpcmVjdG9yc1wiLFwiYXNwZWN0c1wiLFwiYXVzdHJpYVwiLFwiYWhlYWRcIixcIm1vb25cIixcInBhcnRpY2lwYXRpb25cIixcInNjaGVtZVwiLFwidXRpbGl0eVwiLFwicHJldmlld1wiLFwiZmx5XCIsXCJtYW5uZXJcIixcIm1hdHJpeFwiLFwiY29udGFpbmluZ1wiLFwiY29tYmluYXRpb25cIixcImRldmVsXCIsXCJhbWVuZG1lbnRcIixcImRlc3BpdGVcIixcInN0cmVuZ3RoXCIsXCJndWFyYW50ZWVkXCIsXCJ0dXJrZXlcIixcImxpYnJhcmllc1wiLFwicHJvcGVyXCIsXCJkaXN0cmlidXRlZFwiLFwiZGVncmVlc1wiLFwic2luZ2Fwb3JlXCIsXCJlbnRlcnByaXNlc1wiLFwiZGVsdGFcIixcImZlYXJcIixcInNlZWtpbmdcIixcImluY2hlc1wiLFwicGhvZW5peFwiLFwicnNcIixcImNvbnZlbnRpb25cIixcInNoYXJlc1wiLFwicHJpbmNpcGFsXCIsXCJkYXVnaHRlclwiLFwic3RhbmRpbmdcIixcImNvbWZvcnRcIixcImNvbG9yc1wiLFwid2Fyc1wiLFwiY2lzY29cIixcIm9yZGVyaW5nXCIsXCJrZXB0XCIsXCJhbHBoYVwiLFwiYXBwZWFsXCIsXCJjcnVpc2VcIixcImJvbnVzXCIsXCJjZXJ0aWZpY2F0aW9uXCIsXCJwcmV2aW91c2x5XCIsXCJoZXlcIixcImJvb2ttYXJrXCIsXCJidWlsZGluZ3NcIixcInNwZWNpYWxzXCIsXCJiZWF0XCIsXCJkaXNuZXlcIixcImhvdXNlaG9sZFwiLFwiYmF0dGVyaWVzXCIsXCJhZG9iZVwiLFwic21va2luZ1wiLFwiYmJjXCIsXCJiZWNvbWVzXCIsXCJkcml2ZXNcIixcImFybXNcIixcImFsYWJhbWFcIixcInRlYVwiLFwiaW1wcm92ZWRcIixcInRyZWVzXCIsXCJhdmdcIixcImFjaGlldmVcIixcInBvc2l0aW9uc1wiLFwiZHJlc3NcIixcInN1YnNjcmlwdGlvblwiLFwiZGVhbGVyXCIsXCJjb250ZW1wb3JhcnlcIixcInNreVwiLFwidXRhaFwiLFwibmVhcmJ5XCIsXCJyb21cIixcImNhcnJpZWRcIixcImhhcHBlblwiLFwiZXhwb3N1cmVcIixcInBhbmFzb25pY1wiLFwiaGlkZVwiLFwicGVybWFsaW5rXCIsXCJzaWduYXR1cmVcIixcImdhbWJsaW5nXCIsXCJyZWZlclwiLFwibWlsbGVyXCIsXCJwcm92aXNpb25cIixcIm91dGRvb3JzXCIsXCJjbG90aGVzXCIsXCJjYXVzZWRcIixcImx1eHVyeVwiLFwiYmFiZXNcIixcImZyYW1lc1wiLFwiY2VydGFpbmx5XCIsXCJpbmRlZWRcIixcIm5ld3NwYXBlclwiLFwidG95XCIsXCJjaXJjdWl0XCIsXCJsYXllclwiLFwicHJpbnRlZFwiLFwic2xvd1wiLFwicmVtb3ZhbFwiLFwiZWFzaWVyXCIsXCJzcmNcIixcImxpYWJpbGl0eVwiLFwidHJhZGVtYXJrXCIsXCJoaXBcIixcInByaW50ZXJzXCIsXCJmYXFzXCIsXCJuaW5lXCIsXCJhZGRpbmdcIixcImtlbnR1Y2t5XCIsXCJtb3N0bHlcIixcImVyaWNcIixcInNwb3RcIixcInRheWxvclwiLFwidHJhY2tiYWNrXCIsXCJwcmludHNcIixcInNwZW5kXCIsXCJmYWN0b3J5XCIsXCJpbnRlcmlvclwiLFwicmV2aXNlZFwiLFwiZ3Jvd1wiLFwiYW1lcmljYW5zXCIsXCJvcHRpY2FsXCIsXCJwcm9tb3Rpb25cIixcInJlbGF0aXZlXCIsXCJhbWF6aW5nXCIsXCJjbG9ja1wiLFwiZG90XCIsXCJoaXZcIixcImlkZW50aXR5XCIsXCJzdWl0ZXNcIixcImNvbnZlcnNpb25cIixcImZlZWxpbmdcIixcImhpZGRlblwiLFwicmVhc29uYWJsZVwiLFwidmljdG9yaWFcIixcInNlcmlhbFwiLFwicmVsaWVmXCIsXCJyZXZpc2lvblwiLFwiYnJvYWRiYW5kXCIsXCJpbmZsdWVuY2VcIixcInJhdGlvXCIsXCJwZGFcIixcImltcG9ydGFuY2VcIixcInJhaW5cIixcIm9udG9cIixcImRzbFwiLFwicGxhbmV0XCIsXCJ3ZWJtYXN0ZXJcIixcImNvcGllc1wiLFwicmVjaXBlXCIsXCJ6dW1cIixcInBlcm1pdFwiLFwic2VlaW5nXCIsXCJwcm9vZlwiLFwiZG5hXCIsXCJkaWZmXCIsXCJ0ZW5uaXNcIixcImJhc3NcIixcInByZXNjcmlwdGlvblwiLFwiYmVkcm9vbVwiLFwiZW1wdHlcIixcImluc3RhbmNlXCIsXCJob2xlXCIsXCJwZXRzXCIsXCJyaWRlXCIsXCJsaWNlbnNlZFwiLFwib3JsYW5kb1wiLFwic3BlY2lmaWNhbGx5XCIsXCJ0aW1cIixcImJ1cmVhdVwiLFwibWFpbmVcIixcInNxbFwiLFwicmVwcmVzZW50XCIsXCJjb25zZXJ2YXRpb25cIixcInBhaXJcIixcImlkZWFsXCIsXCJzcGVjc1wiLFwicmVjb3JkZWRcIixcImRvblwiLFwicGllY2VzXCIsXCJmaW5pc2hlZFwiLFwicGFya3NcIixcImRpbm5lclwiLFwibGF3eWVyc1wiLFwic3lkbmV5XCIsXCJzdHJlc3NcIixcImNyZWFtXCIsXCJzc1wiLFwicnVuc1wiLFwidHJlbmRzXCIsXCJ5ZWFoXCIsXCJkaXNjb3ZlclwiLFwiYXBcIixcInBhdHRlcm5zXCIsXCJib3hlc1wiLFwibG91aXNpYW5hXCIsXCJoaWxsc1wiLFwiamF2YXNjcmlwdFwiLFwiZm91cnRoXCIsXCJubVwiLFwiYWR2aXNvclwiLFwibW5cIixcIm1hcmtldHBsYWNlXCIsXCJuZFwiLFwiZXZpbFwiLFwiYXdhcmVcIixcIndpbHNvblwiLFwic2hhcGVcIixcImV2b2x1dGlvblwiLFwiaXJpc2hcIixcImNlcnRpZmljYXRlc1wiLFwib2JqZWN0aXZlc1wiLFwic3RhdGlvbnNcIixcInN1Z2dlc3RlZFwiLFwiZ3BzXCIsXCJvcFwiLFwicmVtYWluc1wiLFwiYWNjXCIsXCJncmVhdGVzdFwiLFwiZmlybXNcIixcImNvbmNlcm5lZFwiLFwiZXVyb1wiLFwib3BlcmF0b3JcIixcInN0cnVjdHVyZXNcIixcImdlbmVyaWNcIixcImVuY3ljbG9wZWRpYVwiLFwidXNhZ2VcIixcImNhcFwiLFwiaW5rXCIsXCJjaGFydHNcIixcImNvbnRpbnVpbmdcIixcIm1peGVkXCIsXCJjZW5zdXNcIixcImludGVycmFjaWFsXCIsXCJwZWFrXCIsXCJ0blwiLFwiY29tcGV0aXRpdmVcIixcImV4aXN0XCIsXCJ3aGVlbFwiLFwidHJhbnNpdFwiLFwic3VwcGxpZXJzXCIsXCJzYWx0XCIsXCJjb21wYWN0XCIsXCJwb2V0cnlcIixcImxpZ2h0c1wiLFwidHJhY2tpbmdcIixcImFuZ2VsXCIsXCJiZWxsXCIsXCJrZWVwaW5nXCIsXCJwcmVwYXJhdGlvblwiLFwiYXR0ZW1wdFwiLFwicmVjZWl2aW5nXCIsXCJtYXRjaGVzXCIsXCJhY2NvcmRhbmNlXCIsXCJ3aWR0aFwiLFwibm9pc2VcIixcImVuZ2luZXNcIixcImZvcmdldFwiLFwiYXJyYXlcIixcImRpc2N1c3NlZFwiLFwiYWNjdXJhdGVcIixcInN0ZXBoZW5cIixcImVsaXphYmV0aFwiLFwiY2xpbWF0ZVwiLFwicmVzZXJ2YXRpb25zXCIsXCJwaW5cIixcInBsYXlzdGF0aW9uXCIsXCJhbGNvaG9sXCIsXCJncmVla1wiLFwiaW5zdHJ1Y3Rpb25cIixcIm1hbmFnaW5nXCIsXCJhbm5vdGF0aW9uXCIsXCJzaXN0ZXJcIixcInJhd1wiLFwiZGlmZmVyZW5jZXNcIixcIndhbGtpbmdcIixcImV4cGxhaW5cIixcInNtYWxsZXJcIixcIm5ld2VzdFwiLFwiZXN0YWJsaXNoXCIsXCJnbnVcIixcImhhcHBlbmVkXCIsXCJleHByZXNzZWRcIixcImplZmZcIixcImV4dGVudFwiLFwic2hhcnBcIixcImxlc2JpYW5zXCIsXCJiZW5cIixcImxhbmVcIixcInBhcmFncmFwaFwiLFwia2lsbFwiLFwibWF0aGVtYXRpY3NcIixcImFvbFwiLFwiY29tcGVuc2F0aW9uXCIsXCJjZVwiLFwiZXhwb3J0XCIsXCJtYW5hZ2Vyc1wiLFwiYWlyY3JhZnRcIixcIm1vZHVsZXNcIixcInN3ZWRlblwiLFwiY29uZmxpY3RcIixcImNvbmR1Y3RlZFwiLFwidmVyc2lvbnNcIixcImVtcGxveWVyXCIsXCJvY2N1clwiLFwicGVyY2VudGFnZVwiLFwia25vd3NcIixcIm1pc3Npc3NpcHBpXCIsXCJkZXNjcmliZVwiLFwiY29uY2VyblwiLFwiYmFja3VwXCIsXCJyZXF1ZXN0ZWRcIixcImNpdGl6ZW5zXCIsXCJjb25uZWN0aWN1dFwiLFwiaGVyaXRhZ2VcIixcInBlcnNvbmFsc1wiLFwiaW1tZWRpYXRlXCIsXCJob2xkaW5nXCIsXCJ0cm91YmxlXCIsXCJzcHJlYWRcIixcImNvYWNoXCIsXCJrZXZpblwiLFwiYWdyaWN1bHR1cmFsXCIsXCJleHBhbmRcIixcInN1cHBvcnRpbmdcIixcImF1ZGllbmNlXCIsXCJhc3NpZ25lZFwiLFwiam9yZGFuXCIsXCJjb2xsZWN0aW9uc1wiLFwiYWdlc1wiLFwicGFydGljaXBhdGVcIixcInBsdWdcIixcInNwZWNpYWxpc3RcIixcImNvb2tcIixcImFmZmVjdFwiLFwidmlyZ2luXCIsXCJleHBlcmllbmNlZFwiLFwiaW52ZXN0aWdhdGlvblwiLFwicmFpc2VkXCIsXCJoYXRcIixcImluc3RpdHV0aW9uXCIsXCJkaXJlY3RlZFwiLFwiZGVhbGVyc1wiLFwic2VhcmNoaW5nXCIsXCJzcG9ydGluZ1wiLFwiaGVscGluZ1wiLFwicGVybFwiLFwiYWZmZWN0ZWRcIixcImxpYlwiLFwiYmlrZVwiLFwidG90YWxseVwiLFwicGxhdGVcIixcImV4cGVuc2VzXCIsXCJpbmRpY2F0ZVwiLFwiYmxvbmRlXCIsXCJhYlwiLFwicHJvY2VlZGluZ3NcIixcImZhdm91cml0ZVwiLFwidHJhbnNtaXNzaW9uXCIsXCJhbmRlcnNvblwiLFwidXRjXCIsXCJjaGFyYWN0ZXJpc3RpY3NcIixcImRlclwiLFwibG9zZVwiLFwib3JnYW5pY1wiLFwic2Vla1wiLFwiZXhwZXJpZW5jZXNcIixcImFsYnVtc1wiLFwiY2hlYXRzXCIsXCJleHRyZW1lbHlcIixcInZlcnplaWNobmlzXCIsXCJjb250cmFjdHNcIixcImd1ZXN0c1wiLFwiaG9zdGVkXCIsXCJkaXNlYXNlc1wiLFwiY29uY2VybmluZ1wiLFwiZGV2ZWxvcGVyc1wiLFwiZXF1aXZhbGVudFwiLFwiY2hlbWlzdHJ5XCIsXCJ0b255XCIsXCJuZWlnaGJvcmhvb2RcIixcIm5ldmFkYVwiLFwia2l0c1wiLFwidGhhaWxhbmRcIixcInZhcmlhYmxlc1wiLFwiYWdlbmRhXCIsXCJhbnl3YXlcIixcImNvbnRpbnVlc1wiLFwidHJhY2tzXCIsXCJhZHZpc29yeVwiLFwiY2FtXCIsXCJjdXJyaWN1bHVtXCIsXCJsb2dpY1wiLFwidGVtcGxhdGVcIixcInByaW5jZVwiLFwiY2lyY2xlXCIsXCJzb2lsXCIsXCJncmFudHNcIixcImFueXdoZXJlXCIsXCJwc3ljaG9sb2d5XCIsXCJyZXNwb25zZXNcIixcImF0bGFudGljXCIsXCJ3ZXRcIixcImNpcmN1bXN0YW5jZXNcIixcImVkd2FyZFwiLFwiaW52ZXN0b3JcIixcImlkZW50aWZpY2F0aW9uXCIsXCJyYW1cIixcImxlYXZpbmdcIixcIndpbGRsaWZlXCIsXCJhcHBsaWFuY2VzXCIsXCJtYXR0XCIsXCJlbGVtZW50YXJ5XCIsXCJjb29raW5nXCIsXCJzcGVha2luZ1wiLFwic3BvbnNvcnNcIixcImZveFwiLFwidW5saW1pdGVkXCIsXCJyZXNwb25kXCIsXCJzaXplc1wiLFwicGxhaW5cIixcImV4aXRcIixcImVudGVyZWRcIixcImlyYW5cIixcImFybVwiLFwia2V5c1wiLFwibGF1bmNoXCIsXCJ3YXZlXCIsXCJjaGVja2luZ1wiLFwiY29zdGFcIixcImJlbGdpdW1cIixcInByaW50YWJsZVwiLFwiaG9seVwiLFwiYWN0c1wiLFwiZ3VpZGFuY2VcIixcIm1lc2hcIixcInRyYWlsXCIsXCJlbmZvcmNlbWVudFwiLFwic3ltYm9sXCIsXCJjcmFmdHNcIixcImhpZ2h3YXlcIixcImJ1ZGR5XCIsXCJoYXJkY292ZXJcIixcIm9ic2VydmVkXCIsXCJkZWFuXCIsXCJzZXR1cFwiLFwicG9sbFwiLFwiYm9va2luZ1wiLFwiZ2xvc3NhcnlcIixcImZpc2NhbFwiLFwiY2VsZWJyaXR5XCIsXCJzdHlsZXNcIixcImRlbnZlclwiLFwidW5peFwiLFwiZmlsbGVkXCIsXCJib25kXCIsXCJjaGFubmVsc1wiLFwiZXJpY3Nzb25cIixcImFwcGVuZGl4XCIsXCJub3RpZnlcIixcImJsdWVzXCIsXCJjaG9jb2xhdGVcIixcInB1YlwiLFwicG9ydGlvblwiLFwic2NvcGVcIixcImhhbXBzaGlyZVwiLFwic3VwcGxpZXJcIixcImNhYmxlc1wiLFwiY290dG9uXCIsXCJibHVldG9vdGhcIixcImNvbnRyb2xsZWRcIixcInJlcXVpcmVtZW50XCIsXCJhdXRob3JpdGllc1wiLFwiYmlvbG9neVwiLFwiZGVudGFsXCIsXCJraWxsZWRcIixcImJvcmRlclwiLFwiYW5jaWVudFwiLFwiZGViYXRlXCIsXCJyZXByZXNlbnRhdGl2ZXNcIixcInN0YXJ0c1wiLFwicHJlZ25hbmN5XCIsXCJjYXVzZXNcIixcImFya2Fuc2FzXCIsXCJiaW9ncmFwaHlcIixcImxlaXN1cmVcIixcImF0dHJhY3Rpb25zXCIsXCJsZWFybmVkXCIsXCJ0cmFuc2FjdGlvbnNcIixcIm5vdGVib29rXCIsXCJleHBsb3JlclwiLFwiaGlzdG9yaWNcIixcImF0dGFjaGVkXCIsXCJvcGVuZWRcIixcInRtXCIsXCJodXNiYW5kXCIsXCJkaXNhYmxlZFwiLFwiYXV0aG9yaXplZFwiLFwiY3JhenlcIixcInVwY29taW5nXCIsXCJicml0YWluXCIsXCJjb25jZXJ0XCIsXCJyZXRpcmVtZW50XCIsXCJzY29yZXNcIixcImZpbmFuY2luZ1wiLFwiZWZmaWNpZW5jeVwiLFwic3BcIixcImNvbWVkeVwiLFwiYWRvcHRlZFwiLFwiZWZmaWNpZW50XCIsXCJ3ZWJsb2dcIixcImxpbmVhclwiLFwiY29tbWl0bWVudFwiLFwic3BlY2lhbHR5XCIsXCJiZWFyc1wiLFwiamVhblwiLFwiaG9wXCIsXCJjYXJyaWVyXCIsXCJlZGl0ZWRcIixcImNvbnN0YW50XCIsXCJ2aXNhXCIsXCJtb3V0aFwiLFwiamV3aXNoXCIsXCJtZXRlclwiLFwibGlua2VkXCIsXCJwb3J0bGFuZFwiLFwiaW50ZXJ2aWV3c1wiLFwiY29uY2VwdHNcIixcIm5oXCIsXCJndW5cIixcInJlZmxlY3RcIixcInB1cmVcIixcImRlbGl2ZXJcIixcIndvbmRlclwiLFwibGVzc29uc1wiLFwiZnJ1aXRcIixcImJlZ2luc1wiLFwicXVhbGlmaWVkXCIsXCJyZWZvcm1cIixcImxlbnNcIixcImFsZXJ0c1wiLFwidHJlYXRlZFwiLFwiZGlzY292ZXJ5XCIsXCJkcmF3XCIsXCJteXNxbFwiLFwiY2xhc3NpZmllZFwiLFwicmVsYXRpbmdcIixcImFzc3VtZVwiLFwiY29uZmlkZW5jZVwiLFwiYWxsaWFuY2VcIixcImZtXCIsXCJjb25maXJtXCIsXCJ3YXJtXCIsXCJuZWl0aGVyXCIsXCJsZXdpc1wiLFwiaG93YXJkXCIsXCJvZmZsaW5lXCIsXCJsZWF2ZXNcIixcImVuZ2luZWVyXCIsXCJsaWZlc3R5bGVcIixcImNvbnNpc3RlbnRcIixcInJlcGxhY2VcIixcImNsZWFyYW5jZVwiLFwiY29ubmVjdGlvbnNcIixcImludmVudG9yeVwiLFwiY29udmVydGVyXCIsXCJvcmdhbmlzYXRpb25cIixcImJhYmVcIixcImNoZWNrc1wiLFwicmVhY2hlZFwiLFwiYmVjb21pbmdcIixcInNhZmFyaVwiLFwib2JqZWN0aXZlXCIsXCJpbmRpY2F0ZWRcIixcInN1Z2FyXCIsXCJjcmV3XCIsXCJsZWdzXCIsXCJzYW1cIixcInN0aWNrXCIsXCJzZWN1cml0aWVzXCIsXCJhbGxlblwiLFwicGR0XCIsXCJyZWxhdGlvblwiLFwiZW5hYmxlZFwiLFwiZ2VucmVcIixcInNsaWRlXCIsXCJtb250YW5hXCIsXCJ2b2x1bnRlZXJcIixcInRlc3RlZFwiLFwicmVhclwiLFwiZGVtb2NyYXRpY1wiLFwiZW5oYW5jZVwiLFwic3dpdHplcmxhbmRcIixcImV4YWN0XCIsXCJib3VuZFwiLFwicGFyYW1ldGVyXCIsXCJhZGFwdGVyXCIsXCJwcm9jZXNzb3JcIixcIm5vZGVcIixcImZvcm1hbFwiLFwiZGltZW5zaW9uc1wiLFwiY29udHJpYnV0ZVwiLFwibG9ja1wiLFwiaG9ja2V5XCIsXCJzdG9ybVwiLFwibWljcm9cIixcImNvbGxlZ2VzXCIsXCJsYXB0b3BzXCIsXCJtaWxlXCIsXCJzaG93ZWRcIixcImNoYWxsZW5nZXNcIixcImVkaXRvcnNcIixcIm1lbnNcIixcInRocmVhZHNcIixcImJvd2xcIixcInN1cHJlbWVcIixcImJyb3RoZXJzXCIsXCJyZWNvZ25pdGlvblwiLFwicHJlc2VudHNcIixcInJlZlwiLFwidGFua1wiLFwic3VibWlzc2lvblwiLFwiZG9sbHNcIixcImVzdGltYXRlXCIsXCJlbmNvdXJhZ2VcIixcIm5hdnlcIixcImtpZFwiLFwicmVndWxhdG9yeVwiLFwiaW5zcGVjdGlvblwiLFwiY29uc3VtZXJzXCIsXCJjYW5jZWxcIixcImxpbWl0c1wiLFwidGVycml0b3J5XCIsXCJ0cmFuc2FjdGlvblwiLFwibWFuY2hlc3RlclwiLFwid2VhcG9uc1wiLFwicGFpbnRcIixcImRlbGF5XCIsXCJwaWxvdFwiLFwib3V0bGV0XCIsXCJjb250cmlidXRpb25zXCIsXCJjb250aW51b3VzXCIsXCJkYlwiLFwiY3plY2hcIixcInJlc3VsdGluZ1wiLFwiY2FtYnJpZGdlXCIsXCJpbml0aWF0aXZlXCIsXCJub3ZlbFwiLFwicGFuXCIsXCJleGVjdXRpb25cIixcImRpc2FiaWxpdHlcIixcImluY3JlYXNlc1wiLFwidWx0cmFcIixcIndpbm5lclwiLFwiaWRhaG9cIixcImNvbnRyYWN0b3JcIixcInBoXCIsXCJlcGlzb2RlXCIsXCJleGFtaW5hdGlvblwiLFwicG90dGVyXCIsXCJkaXNoXCIsXCJwbGF5c1wiLFwiYnVsbGV0aW5cIixcImlhXCIsXCJwdFwiLFwiaW5kaWNhdGVzXCIsXCJtb2RpZnlcIixcIm94Zm9yZFwiLFwiYWRhbVwiLFwidHJ1bHlcIixcImVwaW5pb25zXCIsXCJwYWludGluZ1wiLFwiY29tbWl0dGVkXCIsXCJleHRlbnNpdmVcIixcImFmZm9yZGFibGVcIixcInVuaXZlcnNlXCIsXCJjYW5kaWRhdGVcIixcImRhdGFiYXNlc1wiLFwicGF0ZW50XCIsXCJzbG90XCIsXCJwc3BcIixcIm91dHN0YW5kaW5nXCIsXCJoYVwiLFwiZWF0aW5nXCIsXCJwZXJzcGVjdGl2ZVwiLFwicGxhbm5lZFwiLFwid2F0Y2hpbmdcIixcImxvZGdlXCIsXCJtZXNzZW5nZXJcIixcIm1pcnJvclwiLFwidG91cm5hbWVudFwiLFwiY29uc2lkZXJhdGlvblwiLFwiZHNcIixcImRpc2NvdW50c1wiLFwic3RlcmxpbmdcIixcInNlc3Npb25zXCIsXCJrZXJuZWxcIixcInN0b2Nrc1wiLFwiYnV5ZXJzXCIsXCJqb3VybmFsc1wiLFwiZ3JheVwiLFwiY2F0YWxvZ3VlXCIsXCJlYVwiLFwiamVubmlmZXJcIixcImFudG9uaW9cIixcImNoYXJnZWRcIixcImJyb2FkXCIsXCJ0YWl3YW5cIixcInVuZFwiLFwiY2hvc2VuXCIsXCJkZW1vXCIsXCJncmVlY2VcIixcImxnXCIsXCJzd2lzc1wiLFwic2FyYWhcIixcImNsYXJrXCIsXCJsYWJvdXJcIixcImhhdGVcIixcInRlcm1pbmFsXCIsXCJwdWJsaXNoZXJzXCIsXCJuaWdodHNcIixcImJlaGFsZlwiLFwiY2FyaWJiZWFuXCIsXCJsaXF1aWRcIixcInJpY2VcIixcIm5lYnJhc2thXCIsXCJsb29wXCIsXCJzYWxhcnlcIixcInJlc2VydmF0aW9uXCIsXCJmb29kc1wiLFwiZ291cm1ldFwiLFwiZ3VhcmRcIixcInByb3Blcmx5XCIsXCJvcmxlYW5zXCIsXCJzYXZpbmdcIixcIm5mbFwiLFwicmVtYWluaW5nXCIsXCJlbXBpcmVcIixcInJlc3VtZVwiLFwidHdlbnR5XCIsXCJuZXdseVwiLFwicmFpc2VcIixcInByZXBhcmVcIixcImF2YXRhclwiLFwiZ2FyeVwiLFwiZGVwZW5kaW5nXCIsXCJpbGxlZ2FsXCIsXCJleHBhbnNpb25cIixcInZhcnlcIixcImh1bmRyZWRzXCIsXCJyb21lXCIsXCJhcmFiXCIsXCJsaW5jb2xuXCIsXCJoZWxwZWRcIixcInByZW1pZXJcIixcInRvbW9ycm93XCIsXCJwdXJjaGFzZWRcIixcIm1pbGtcIixcImRlY2lkZVwiLFwiY29uc2VudFwiLFwiZHJhbWFcIixcInZpc2l0aW5nXCIsXCJwZXJmb3JtaW5nXCIsXCJkb3dudG93blwiLFwia2V5Ym9hcmRcIixcImNvbnRlc3RcIixcImNvbGxlY3RlZFwiLFwibndcIixcImJhbmRzXCIsXCJib290XCIsXCJzdWl0YWJsZVwiLFwiZmZcIixcImFic29sdXRlbHlcIixcIm1pbGxpb25zXCIsXCJsdW5jaFwiLFwiYXVkaXRcIixcInB1c2hcIixcImNoYW1iZXJcIixcImd1aW5lYVwiLFwiZmluZGluZ3NcIixcIm11c2NsZVwiLFwiZmVhdHVyaW5nXCIsXCJpc29cIixcImltcGxlbWVudFwiLFwiY2xpY2tpbmdcIixcInNjaGVkdWxlZFwiLFwicG9sbHNcIixcInR5cGljYWxcIixcInRvd2VyXCIsXCJ5b3Vyc1wiLFwic3VtXCIsXCJtaXNjXCIsXCJjYWxjdWxhdG9yXCIsXCJzaWduaWZpY2FudGx5XCIsXCJjaGlja2VuXCIsXCJ0ZW1wb3JhcnlcIixcImF0dGVuZFwiLFwic2hvd2VyXCIsXCJhbGFuXCIsXCJzZW5kaW5nXCIsXCJqYXNvblwiLFwidG9uaWdodFwiLFwiZGVhclwiLFwic3VmZmljaWVudFwiLFwiaG9sZGVtXCIsXCJzaGVsbFwiLFwicHJvdmluY2VcIixcImNhdGhvbGljXCIsXCJvYWtcIixcInZhdFwiLFwiYXdhcmVuZXNzXCIsXCJ2YW5jb3V2ZXJcIixcImdvdmVybm9yXCIsXCJiZWVyXCIsXCJzZWVtZWRcIixcImNvbnRyaWJ1dGlvblwiLFwibWVhc3VyZW1lbnRcIixcInN3aW1taW5nXCIsXCJzcHl3YXJlXCIsXCJmb3JtdWxhXCIsXCJjb25zdGl0dXRpb25cIixcInBhY2thZ2luZ1wiLFwic29sYXJcIixcImpvc2VcIixcImNhdGNoXCIsXCJqYW5lXCIsXCJwYWtpc3RhblwiLFwicHNcIixcInJlbGlhYmxlXCIsXCJjb25zdWx0YXRpb25cIixcIm5vcnRod2VzdFwiLFwic2lyXCIsXCJkb3VidFwiLFwiZWFyblwiLFwiZmluZGVyXCIsXCJ1bmFibGVcIixcInBlcmlvZHNcIixcImNsYXNzcm9vbVwiLFwidGFza3NcIixcImRlbW9jcmFjeVwiLFwiYXR0YWNrc1wiLFwia2ltXCIsXCJ3YWxscGFwZXJcIixcIm1lcmNoYW5kaXNlXCIsXCJjb25zdFwiLFwicmVzaXN0YW5jZVwiLFwiZG9vcnNcIixcInN5bXB0b21zXCIsXCJyZXNvcnRzXCIsXCJiaWdnZXN0XCIsXCJtZW1vcmlhbFwiLFwidmlzaXRvclwiLFwidHdpblwiLFwiZm9ydGhcIixcImluc2VydFwiLFwiYmFsdGltb3JlXCIsXCJnYXRld2F5XCIsXCJreVwiLFwiZG9udFwiLFwiYWx1bW5pXCIsXCJkcmF3aW5nXCIsXCJjYW5kaWRhdGVzXCIsXCJjaGFybG90dGVcIixcIm9yZGVyZWRcIixcImJpb2xvZ2ljYWxcIixcImZpZ2h0aW5nXCIsXCJ0cmFuc2l0aW9uXCIsXCJoYXBwZW5zXCIsXCJwcmVmZXJlbmNlc1wiLFwic3B5XCIsXCJyb21hbmNlXCIsXCJpbnN0cnVtZW50XCIsXCJicnVjZVwiLFwic3BsaXRcIixcInRoZW1lc1wiLFwicG93ZXJzXCIsXCJoZWF2ZW5cIixcImJyXCIsXCJiaXRzXCIsXCJwcmVnbmFudFwiLFwidHdpY2VcIixcImNsYXNzaWZpY2F0aW9uXCIsXCJmb2N1c2VkXCIsXCJlZ3lwdFwiLFwicGh5c2ljaWFuXCIsXCJob2xseXdvb2RcIixcImJhcmdhaW5cIixcIndpa2lwZWRpYVwiLFwiY2VsbHVsYXJcIixcIm5vcndheVwiLFwidmVybW9udFwiLFwiYXNraW5nXCIsXCJibG9ja3NcIixcIm5vcm1hbGx5XCIsXCJsb1wiLFwic3Bpcml0dWFsXCIsXCJodW50aW5nXCIsXCJkaWFiZXRlc1wiLFwic3VpdFwiLFwibWxcIixcInNoaWZ0XCIsXCJjaGlwXCIsXCJyZXNcIixcInNpdFwiLFwiYm9kaWVzXCIsXCJwaG90b2dyYXBoc1wiLFwiY3V0dGluZ1wiLFwid293XCIsXCJzaW1vblwiLFwid3JpdGVyc1wiLFwibWFya3NcIixcImZsZXhpYmxlXCIsXCJsb3ZlZFwiLFwiZmF2b3VyaXRlc1wiLFwibWFwcGluZ1wiLFwibnVtZXJvdXNcIixcInJlbGF0aXZlbHlcIixcImJpcmRzXCIsXCJzYXRpc2ZhY3Rpb25cIixcInJlcHJlc2VudHNcIixcImNoYXJcIixcImluZGV4ZWRcIixcInBpdHRzYnVyZ2hcIixcInN1cGVyaW9yXCIsXCJwcmVmZXJyZWRcIixcInNhdmVkXCIsXCJwYXlpbmdcIixcImNhcnRvb25cIixcInNob3RzXCIsXCJpbnRlbGxlY3R1YWxcIixcIm1vb3JlXCIsXCJncmFudGVkXCIsXCJjaG9pY2VzXCIsXCJjYXJib25cIixcInNwZW5kaW5nXCIsXCJjb21mb3J0YWJsZVwiLFwibWFnbmV0aWNcIixcImludGVyYWN0aW9uXCIsXCJsaXN0ZW5pbmdcIixcImVmZmVjdGl2ZWx5XCIsXCJyZWdpc3RyeVwiLFwiY3Jpc2lzXCIsXCJvdXRsb29rXCIsXCJtYXNzaXZlXCIsXCJkZW5tYXJrXCIsXCJlbXBsb3llZFwiLFwiYnJpZ2h0XCIsXCJ0cmVhdFwiLFwiaGVhZGVyXCIsXCJjc1wiLFwicG92ZXJ0eVwiLFwiZm9ybWVkXCIsXCJwaWFub1wiLFwiZWNob1wiLFwicXVlXCIsXCJncmlkXCIsXCJzaGVldHNcIixcInBhdHJpY2tcIixcImV4cGVyaW1lbnRhbFwiLFwicHVlcnRvXCIsXCJyZXZvbHV0aW9uXCIsXCJjb25zb2xpZGF0aW9uXCIsXCJkaXNwbGF5c1wiLFwicGxhc21hXCIsXCJhbGxvd2luZ1wiLFwiZWFybmluZ3NcIixcInZvaXBcIixcIm15c3RlcnlcIixcImxhbmRzY2FwZVwiLFwiZGVwZW5kZW50XCIsXCJtZWNoYW5pY2FsXCIsXCJqb3VybmV5XCIsXCJkZWxhd2FyZVwiLFwiYmlkZGluZ1wiLFwiY29uc3VsdGFudHNcIixcInJpc2tzXCIsXCJiYW5uZXJcIixcImFwcGxpY2FudFwiLFwiY2hhcnRlclwiLFwiZmlnXCIsXCJiYXJiYXJhXCIsXCJjb29wZXJhdGlvblwiLFwiY291bnRpZXNcIixcImFjcXVpc2l0aW9uXCIsXCJwb3J0c1wiLFwiaW1wbGVtZW50ZWRcIixcInNmXCIsXCJkaXJlY3Rvcmllc1wiLFwicmVjb2duaXplZFwiLFwiZHJlYW1zXCIsXCJibG9nZ2VyXCIsXCJub3RpZmljYXRpb25cIixcImtnXCIsXCJsaWNlbnNpbmdcIixcInN0YW5kc1wiLFwidGVhY2hcIixcIm9jY3VycmVkXCIsXCJ0ZXh0Ym9va3NcIixcInJhcGlkXCIsXCJwdWxsXCIsXCJoYWlyeVwiLFwiZGl2ZXJzaXR5XCIsXCJjbGV2ZWxhbmRcIixcInV0XCIsXCJyZXZlcnNlXCIsXCJkZXBvc2l0XCIsXCJzZW1pbmFyXCIsXCJpbnZlc3RtZW50c1wiLFwibGF0aW5hXCIsXCJuYXNhXCIsXCJ3aGVlbHNcIixcInNleGNhbVwiLFwic3BlY2lmeVwiLFwiYWNjZXNzaWJpbGl0eVwiLFwiZHV0Y2hcIixcInNlbnNpdGl2ZVwiLFwidGVtcGxhdGVzXCIsXCJmb3JtYXRzXCIsXCJ0YWJcIixcImRlcGVuZHNcIixcImJvb3RzXCIsXCJob2xkc1wiLFwicm91dGVyXCIsXCJjb25jcmV0ZVwiLFwic2lcIixcImVkaXRpbmdcIixcInBvbGFuZFwiLFwiZm9sZGVyXCIsXCJ3b21lbnNcIixcImNzc1wiLFwiY29tcGxldGlvblwiLFwidXBsb2FkXCIsXCJwdWxzZVwiLFwidW5pdmVyc2l0aWVzXCIsXCJ0ZWNobmlxdWVcIixcImNvbnRyYWN0b3JzXCIsXCJtaWxmaHVudGVyXCIsXCJ2b3RpbmdcIixcImNvdXJ0c1wiLFwibm90aWNlc1wiLFwic3Vic2NyaXB0aW9uc1wiLFwiY2FsY3VsYXRlXCIsXCJtY1wiLFwiZGV0cm9pdFwiLFwiYWxleGFuZGVyXCIsXCJicm9hZGNhc3RcIixcImNvbnZlcnRlZFwiLFwibWV0cm9cIixcInRvc2hpYmFcIixcImFubml2ZXJzYXJ5XCIsXCJpbXByb3ZlbWVudHNcIixcInN0cmlwXCIsXCJzcGVjaWZpY2F0aW9uXCIsXCJwZWFybFwiLFwiYWNjaWRlbnRcIixcIm5pY2tcIixcImFjY2Vzc2libGVcIixcImFjY2Vzc29yeVwiLFwicmVzaWRlbnRcIixcInBsb3RcIixcInF0eVwiLFwicG9zc2libHlcIixcImFpcmxpbmVcIixcInR5cGljYWxseVwiLFwicmVwcmVzZW50YXRpb25cIixcInJlZ2FyZFwiLFwicHVtcFwiLFwiZXhpc3RzXCIsXCJhcnJhbmdlbWVudHNcIixcInNtb290aFwiLFwiY29uZmVyZW5jZXNcIixcInVuaXByb3RrYlwiLFwic3RyaWtlXCIsXCJjb25zdW1wdGlvblwiLFwiYmlybWluZ2hhbVwiLFwiZmxhc2hpbmdcIixcImxwXCIsXCJuYXJyb3dcIixcImFmdGVybm9vblwiLFwidGhyZWF0XCIsXCJzdXJ2ZXlzXCIsXCJzaXR0aW5nXCIsXCJwdXR0aW5nXCIsXCJjb25zdWx0YW50XCIsXCJjb250cm9sbGVyXCIsXCJvd25lcnNoaXBcIixcImNvbW1pdHRlZXNcIixcImxlZ2lzbGF0aXZlXCIsXCJyZXNlYXJjaGVyc1wiLFwidmlldG5hbVwiLFwidHJhaWxlclwiLFwiYW5uZVwiLFwiY2FzdGxlXCIsXCJnYXJkZW5zXCIsXCJtaXNzZWRcIixcIm1hbGF5c2lhXCIsXCJ1bnN1YnNjcmliZVwiLFwiYW50aXF1ZVwiLFwibGFiZWxzXCIsXCJ3aWxsaW5nXCIsXCJiaW9cIixcIm1vbGVjdWxhclwiLFwiYWN0aW5nXCIsXCJoZWFkc1wiLFwic3RvcmVkXCIsXCJleGFtXCIsXCJsb2dvc1wiLFwicmVzaWRlbmNlXCIsXCJhdHRvcm5leXNcIixcIm1pbGZzXCIsXCJhbnRpcXVlc1wiLFwiZGVuc2l0eVwiLFwiaHVuZHJlZFwiLFwicnlhblwiLFwib3BlcmF0b3JzXCIsXCJzdHJhbmdlXCIsXCJzdXN0YWluYWJsZVwiLFwicGhpbGlwcGluZXNcIixcInN0YXRpc3RpY2FsXCIsXCJiZWRzXCIsXCJtZW50aW9uXCIsXCJpbm5vdmF0aW9uXCIsXCJwY3NcIixcImVtcGxveWVyc1wiLFwiZ3JleVwiLFwicGFyYWxsZWxcIixcImhvbmRhXCIsXCJhbWVuZGVkXCIsXCJvcGVyYXRlXCIsXCJiaWxsc1wiLFwiYm9sZFwiLFwiYmF0aHJvb21cIixcInN0YWJsZVwiLFwib3BlcmFcIixcImRlZmluaXRpb25zXCIsXCJ2b25cIixcImRvY3RvcnNcIixcImxlc3NvblwiLFwiY2luZW1hXCIsXCJhc3NldFwiLFwiYWdcIixcInNjYW5cIixcImVsZWN0aW9uc1wiLFwiZHJpbmtpbmdcIixcInJlYWN0aW9uXCIsXCJibGFua1wiLFwiZW5oYW5jZWRcIixcImVudGl0bGVkXCIsXCJzZXZlcmVcIixcImdlbmVyYXRlXCIsXCJzdGFpbmxlc3NcIixcIm5ld3NwYXBlcnNcIixcImhvc3BpdGFsc1wiLFwidmlcIixcImRlbHV4ZVwiLFwiaHVtb3JcIixcImFnZWRcIixcIm1vbml0b3JzXCIsXCJleGNlcHRpb25cIixcImxpdmVkXCIsXCJkdXJhdGlvblwiLFwiYnVsa1wiLFwic3VjY2Vzc2Z1bGx5XCIsXCJpbmRvbmVzaWFcIixcInB1cnN1YW50XCIsXCJzY2lcIixcImZhYnJpY1wiLFwiZWR0XCIsXCJ2aXNpdHNcIixcInByaW1hcmlseVwiLFwidGlnaHRcIixcImRvbWFpbnNcIixcImNhcGFiaWxpdGllc1wiLFwicG1pZFwiLFwiY29udHJhc3RcIixcInJlY29tbWVuZGF0aW9uXCIsXCJmbHlpbmdcIixcInJlY3J1aXRtZW50XCIsXCJzaW5cIixcImJlcmxpblwiLFwiY3V0ZVwiLFwib3JnYW5pemVkXCIsXCJiYVwiLFwicGFyYVwiLFwic2llbWVuc1wiLFwiYWRvcHRpb25cIixcImltcHJvdmluZ1wiLFwiY3JcIixcImV4cGVuc2l2ZVwiLFwibWVhbnRcIixcImNhcHR1cmVcIixcInBvdW5kc1wiLFwiYnVmZmFsb1wiLFwib3JnYW5pc2F0aW9uc1wiLFwicGxhbmVcIixcInBnXCIsXCJleHBsYWluZWRcIixcInNlZWRcIixcInByb2dyYW1tZXNcIixcImRlc2lyZVwiLFwiZXhwZXJ0aXNlXCIsXCJtZWNoYW5pc21cIixcImNhbXBpbmdcIixcImVlXCIsXCJqZXdlbGxlcnlcIixcIm1lZXRzXCIsXCJ3ZWxmYXJlXCIsXCJwZWVyXCIsXCJjYXVnaHRcIixcImV2ZW50dWFsbHlcIixcIm1hcmtlZFwiLFwiZHJpdmVuXCIsXCJtZWFzdXJlZFwiLFwibWVkbGluZVwiLFwiYm90dGxlXCIsXCJhZ3JlZW1lbnRzXCIsXCJjb25zaWRlcmluZ1wiLFwiaW5ub3ZhdGl2ZVwiLFwibWFyc2hhbGxcIixcIm1hc3NhZ2VcIixcInJ1YmJlclwiLFwiY29uY2x1c2lvblwiLFwiY2xvc2luZ1wiLFwidGFtcGFcIixcInRob3VzYW5kXCIsXCJtZWF0XCIsXCJsZWdlbmRcIixcImdyYWNlXCIsXCJzdXNhblwiLFwiaW5nXCIsXCJrc1wiLFwiYWRhbXNcIixcInB5dGhvblwiLFwibW9uc3RlclwiLFwiYWxleFwiLFwiYmFuZ1wiLFwidmlsbGFcIixcImJvbmVcIixcImNvbHVtbnNcIixcImRpc29yZGVyc1wiLFwiYnVnc1wiLFwiY29sbGFib3JhdGlvblwiLFwiaGFtaWx0b25cIixcImRldGVjdGlvblwiLFwiZnRwXCIsXCJjb29raWVzXCIsXCJpbm5lclwiLFwiZm9ybWF0aW9uXCIsXCJ0dXRvcmlhbFwiLFwibWVkXCIsXCJlbmdpbmVlcnNcIixcImVudGl0eVwiLFwiY3J1aXNlc1wiLFwiZ2F0ZVwiLFwiaG9sZGVyXCIsXCJwcm9wb3NhbHNcIixcIm1vZGVyYXRvclwiLFwic3dcIixcInR1dG9yaWFsc1wiLFwic2V0dGxlbWVudFwiLFwicG9ydHVnYWxcIixcImxhd3JlbmNlXCIsXCJyb21hblwiLFwiZHV0aWVzXCIsXCJ2YWx1YWJsZVwiLFwidG9uZVwiLFwiY29sbGVjdGFibGVzXCIsXCJldGhpY3NcIixcImZvcmV2ZXJcIixcImRyYWdvblwiLFwiYnVzeVwiLFwiY2FwdGFpblwiLFwiZmFudGFzdGljXCIsXCJpbWFnaW5lXCIsXCJicmluZ3NcIixcImhlYXRpbmdcIixcImxlZ1wiLFwibmVja1wiLFwiaGRcIixcIndpbmdcIixcImdvdmVybm1lbnRzXCIsXCJwdXJjaGFzaW5nXCIsXCJzY3JpcHRzXCIsXCJhYmNcIixcInN0ZXJlb1wiLFwiYXBwb2ludGVkXCIsXCJ0YXN0ZVwiLFwiZGVhbGluZ1wiLFwiY29tbWl0XCIsXCJ0aW55XCIsXCJvcGVyYXRpb25hbFwiLFwicmFpbFwiLFwiYWlybGluZXNcIixcImxpYmVyYWxcIixcImxpdmVjYW1cIixcImpheVwiLFwidHJpcHNcIixcImdhcFwiLFwic2lkZXNcIixcInR1YmVcIixcInR1cm5zXCIsXCJjb3JyZXNwb25kaW5nXCIsXCJkZXNjcmlwdGlvbnNcIixcImNhY2hlXCIsXCJiZWx0XCIsXCJqYWNrZXRcIixcImRldGVybWluYXRpb25cIixcImFuaW1hdGlvblwiLFwib3JhY2xlXCIsXCJlclwiLFwibWF0dGhld1wiLFwibGVhc2VcIixcInByb2R1Y3Rpb25zXCIsXCJhdmlhdGlvblwiLFwiaG9iYmllc1wiLFwicHJvdWRcIixcImV4Y2Vzc1wiLFwiZGlzYXN0ZXJcIixcImNvbnNvbGVcIixcImNvbW1hbmRzXCIsXCJqclwiLFwidGVsZWNvbW11bmljYXRpb25zXCIsXCJpbnN0cnVjdG9yXCIsXCJnaWFudFwiLFwiYWNoaWV2ZWRcIixcImluanVyaWVzXCIsXCJzaGlwcGVkXCIsXCJzZWF0c1wiLFwiYXBwcm9hY2hlc1wiLFwiYml6XCIsXCJhbGFybVwiLFwidm9sdGFnZVwiLFwiYW50aG9ueVwiLFwibmludGVuZG9cIixcInVzdWFsXCIsXCJsb2FkaW5nXCIsXCJzdGFtcHNcIixcImFwcGVhcmVkXCIsXCJmcmFua2xpblwiLFwiYW5nbGVcIixcInJvYlwiLFwidmlueWxcIixcImhpZ2hsaWdodHNcIixcIm1pbmluZ1wiLFwiZGVzaWduZXJzXCIsXCJtZWxib3VybmVcIixcIm9uZ29pbmdcIixcIndvcnN0XCIsXCJpbWFnaW5nXCIsXCJiZXR0aW5nXCIsXCJzY2llbnRpc3RzXCIsXCJsaWJlcnR5XCIsXCJ3eW9taW5nXCIsXCJibGFja2phY2tcIixcImFyZ2VudGluYVwiLFwiZXJhXCIsXCJjb252ZXJ0XCIsXCJwb3NzaWJpbGl0eVwiLFwiYW5hbHlzdFwiLFwiY29tbWlzc2lvbmVyXCIsXCJkYW5nZXJvdXNcIixcImdhcmFnZVwiLFwiZXhjaXRpbmdcIixcInJlbGlhYmlsaXR5XCIsXCJ0aG9uZ3NcIixcImdjY1wiLFwidW5mb3J0dW5hdGVseVwiLFwicmVzcGVjdGl2ZWx5XCIsXCJ2b2x1bnRlZXJzXCIsXCJhdHRhY2htZW50XCIsXCJyaW5ndG9uZVwiLFwiZmlubGFuZFwiLFwibW9yZ2FuXCIsXCJkZXJpdmVkXCIsXCJwbGVhc3VyZVwiLFwiaG9ub3JcIixcImFzcFwiLFwib3JpZW50ZWRcIixcImVhZ2xlXCIsXCJkZXNrdG9wc1wiLFwicGFudHNcIixcImNvbHVtYnVzXCIsXCJudXJzZVwiLFwicHJheWVyXCIsXCJhcHBvaW50bWVudFwiLFwid29ya3Nob3BzXCIsXCJodXJyaWNhbmVcIixcInF1aWV0XCIsXCJsdWNrXCIsXCJwb3N0YWdlXCIsXCJwcm9kdWNlclwiLFwicmVwcmVzZW50ZWRcIixcIm1vcnRnYWdlc1wiLFwiZGlhbFwiLFwicmVzcG9uc2liaWxpdGllc1wiLFwiY2hlZXNlXCIsXCJjb21pY1wiLFwiY2FyZWZ1bGx5XCIsXCJqZXRcIixcInByb2R1Y3Rpdml0eVwiLFwiaW52ZXN0b3JzXCIsXCJjcm93blwiLFwicGFyXCIsXCJ1bmRlcmdyb3VuZFwiLFwiZGlhZ25vc2lzXCIsXCJtYWtlclwiLFwiY3JhY2tcIixcInByaW5jaXBsZVwiLFwicGlja3NcIixcInZhY2F0aW9uc1wiLFwiZ2FuZ1wiLFwic2VtZXN0ZXJcIixcImNhbGN1bGF0ZWRcIixcImZldGlzaFwiLFwiYXBwbGllc1wiLFwiY2FzaW5vc1wiLFwiYXBwZWFyYW5jZVwiLFwic21va2VcIixcImFwYWNoZVwiLFwiZmlsdGVyc1wiLFwiaW5jb3Jwb3JhdGVkXCIsXCJudlwiLFwiY3JhZnRcIixcImNha2VcIixcIm5vdGVib29rc1wiLFwiYXBhcnRcIixcImZlbGxvd1wiLFwiYmxpbmRcIixcImxvdW5nZVwiLFwibWFkXCIsXCJhbGdvcml0aG1cIixcInNlbWlcIixcImNvaW5zXCIsXCJhbmR5XCIsXCJncm9zc1wiLFwic3Ryb25nbHlcIixcImNhZmVcIixcInZhbGVudGluZVwiLFwiaGlsdG9uXCIsXCJrZW5cIixcInByb3RlaW5zXCIsXCJob3Jyb3JcIixcInN1XCIsXCJleHBcIixcImZhbWlsaWFyXCIsXCJjYXBhYmxlXCIsXCJkb3VnbGFzXCIsXCJkZWJpYW5cIixcInRpbGxcIixcImludm9sdmluZ1wiLFwicGVuXCIsXCJpbnZlc3RpbmdcIixcImNocmlzdG9waGVyXCIsXCJhZG1pc3Npb25cIixcImVwc29uXCIsXCJzaG9lXCIsXCJlbGVjdGVkXCIsXCJjYXJyeWluZ1wiLFwidmljdG9yeVwiLFwic2FuZFwiLFwibWFkaXNvblwiLFwidGVycm9yaXNtXCIsXCJqb3lcIixcImVkaXRpb25zXCIsXCJjcHVcIixcIm1haW5seVwiLFwiZXRobmljXCIsXCJyYW5cIixcInBhcmxpYW1lbnRcIixcImFjdG9yXCIsXCJmaW5kc1wiLFwic2VhbFwiLFwic2l0dWF0aW9uc1wiLFwiZmlmdGhcIixcImFsbG9jYXRlZFwiLFwiY2l0aXplblwiLFwidmVydGljYWxcIixcImNvcnJlY3Rpb25zXCIsXCJzdHJ1Y3R1cmFsXCIsXCJtdW5pY2lwYWxcIixcImRlc2NyaWJlc1wiLFwicHJpemVcIixcInNyXCIsXCJvY2N1cnNcIixcImpvblwiLFwiYWJzb2x1dGVcIixcImRpc2FiaWxpdGllc1wiLFwiY29uc2lzdHNcIixcImFueXRpbWVcIixcInN1YnN0YW5jZVwiLFwicHJvaGliaXRlZFwiLFwiYWRkcmVzc2VkXCIsXCJsaWVzXCIsXCJwaXBlXCIsXCJzb2xkaWVyc1wiLFwibnJcIixcImd1YXJkaWFuXCIsXCJsZWN0dXJlXCIsXCJzaW11bGF0aW9uXCIsXCJsYXlvdXRcIixcImluaXRpYXRpdmVzXCIsXCJpbGxcIixcImNvbmNlbnRyYXRpb25cIixcImNsYXNzaWNzXCIsXCJsYnNcIixcImxheVwiLFwiaW50ZXJwcmV0YXRpb25cIixcImhvcnNlc1wiLFwibG9sXCIsXCJkaXJ0eVwiLFwiZGVja1wiLFwid2F5bmVcIixcImRvbmF0ZVwiLFwidGF1Z2h0XCIsXCJiYW5rcnVwdGN5XCIsXCJtcFwiLFwid29ya2VyXCIsXCJvcHRpbWl6YXRpb25cIixcImFsaXZlXCIsXCJ0ZW1wbGVcIixcInN1YnN0YW5jZXNcIixcInByb3ZlXCIsXCJkaXNjb3ZlcmVkXCIsXCJ3aW5nc1wiLFwiYnJlYWtzXCIsXCJnZW5ldGljXCIsXCJyZXN0cmljdGlvbnNcIixcInBhcnRpY2lwYXRpbmdcIixcIndhdGVyc1wiLFwicHJvbWlzZVwiLFwidGhpblwiLFwiZXhoaWJpdGlvblwiLFwicHJlZmVyXCIsXCJyaWRnZVwiLFwiY2FiaW5ldFwiLFwibW9kZW1cIixcImhhcnJpc1wiLFwibXBoXCIsXCJicmluZ2luZ1wiLFwic2lja1wiLFwiZG9zZVwiLFwiZXZhbHVhdGVcIixcInRpZmZhbnlcIixcInRyb3BpY2FsXCIsXCJjb2xsZWN0XCIsXCJiZXRcIixcImNvbXBvc2l0aW9uXCIsXCJ0b3lvdGFcIixcInN0cmVldHNcIixcIm5hdGlvbndpZGVcIixcInZlY3RvclwiLFwiZGVmaW5pdGVseVwiLFwic2hhdmVkXCIsXCJ0dXJuaW5nXCIsXCJidWZmZXJcIixcInB1cnBsZVwiLFwiZXhpc3RlbmNlXCIsXCJjb21tZW50YXJ5XCIsXCJsYXJyeVwiLFwibGltb3VzaW5lc1wiLFwiZGV2ZWxvcG1lbnRzXCIsXCJkZWZcIixcImltbWlncmF0aW9uXCIsXCJkZXN0aW5hdGlvbnNcIixcImxldHNcIixcIm11dHVhbFwiLFwicGlwZWxpbmVcIixcIm5lY2Vzc2FyaWx5XCIsXCJzeW50YXhcIixcImxpXCIsXCJhdHRyaWJ1dGVcIixcInByaXNvblwiLFwic2tpbGxcIixcImNoYWlyc1wiLFwibmxcIixcImV2ZXJ5ZGF5XCIsXCJhcHBhcmVudGx5XCIsXCJzdXJyb3VuZGluZ1wiLFwibW91bnRhaW5zXCIsXCJtb3Zlc1wiLFwicG9wdWxhcml0eVwiLFwiaW5xdWlyeVwiLFwiZXRoZXJuZXRcIixcImNoZWNrZWRcIixcImV4aGliaXRcIixcInRocm93XCIsXCJ0cmVuZFwiLFwic2llcnJhXCIsXCJ2aXNpYmxlXCIsXCJjYXRzXCIsXCJkZXNlcnRcIixcInBvc3Rwb3N0ZWRcIixcInlhXCIsXCJvbGRlc3RcIixcInJob2RlXCIsXCJuYmFcIixcImNvb3JkaW5hdG9yXCIsXCJvYnZpb3VzbHlcIixcIm1lcmN1cnlcIixcInN0ZXZlblwiLFwiaGFuZGJvb2tcIixcImdyZWdcIixcIm5hdmlnYXRlXCIsXCJ3b3JzZVwiLFwic3VtbWl0XCIsXCJ2aWN0aW1zXCIsXCJlcGFcIixcInNwYWNlc1wiLFwiZnVuZGFtZW50YWxcIixcImJ1cm5pbmdcIixcImVzY2FwZVwiLFwiY291cG9uc1wiLFwic29tZXdoYXRcIixcInJlY2VpdmVyXCIsXCJzdWJzdGFudGlhbFwiLFwidHJcIixcInByb2dyZXNzaXZlXCIsXCJjaWFsaXNcIixcImJiXCIsXCJib2F0c1wiLFwiZ2xhbmNlXCIsXCJzY290dGlzaFwiLFwiY2hhbXBpb25zaGlwXCIsXCJhcmNhZGVcIixcInJpY2htb25kXCIsXCJzYWNyYW1lbnRvXCIsXCJpbXBvc3NpYmxlXCIsXCJyb25cIixcInJ1c3NlbGxcIixcInRlbGxzXCIsXCJvYnZpb3VzXCIsXCJmaWJlclwiLFwiZGVwcmVzc2lvblwiLFwiZ3JhcGhcIixcImNvdmVyaW5nXCIsXCJwbGF0aW51bVwiLFwianVkZ21lbnRcIixcImJlZHJvb21zXCIsXCJ0YWxrc1wiLFwiZmlsaW5nXCIsXCJmb3N0ZXJcIixcIm1vZGVsaW5nXCIsXCJwYXNzaW5nXCIsXCJhd2FyZGVkXCIsXCJ0ZXN0aW1vbmlhbHNcIixcInRyaWFsc1wiLFwidGlzc3VlXCIsXCJuelwiLFwibWVtb3JhYmlsaWFcIixcImNsaW50b25cIixcIm1hc3RlcnNcIixcImJvbmRzXCIsXCJjYXJ0cmlkZ2VcIixcImFsYmVydGFcIixcImV4cGxhbmF0aW9uXCIsXCJmb2xrXCIsXCJvcmdcIixcImNvbW1vbnNcIixcImNpbmNpbm5hdGlcIixcInN1YnNlY3Rpb25cIixcImZyYXVkXCIsXCJlbGVjdHJpY2l0eVwiLFwicGVybWl0dGVkXCIsXCJzcGVjdHJ1bVwiLFwiYXJyaXZhbFwiLFwib2theVwiLFwicG90dGVyeVwiLFwiZW1waGFzaXNcIixcInJvZ2VyXCIsXCJhc3BlY3RcIixcIndvcmtwbGFjZVwiLFwiYXdlc29tZVwiLFwibWV4aWNhblwiLFwiY29uZmlybWVkXCIsXCJjb3VudHNcIixcInByaWNlZFwiLFwid2FsbHBhcGVyc1wiLFwiaGlzdFwiLFwiY3Jhc2hcIixcImxpZnRcIixcImRlc2lyZWRcIixcImludGVyXCIsXCJjbG9zZXJcIixcImFzc3VtZXNcIixcImhlaWdodHNcIixcInNoYWRvd1wiLFwicmlkaW5nXCIsXCJpbmZlY3Rpb25cIixcImZpcmVmb3hcIixcImxpc2FcIixcImV4cGVuc2VcIixcImdyb3ZlXCIsXCJlbGlnaWJpbGl0eVwiLFwidmVudHVyZVwiLFwiY2xpbmljXCIsXCJrb3JlYW5cIixcImhlYWxpbmdcIixcInByaW5jZXNzXCIsXCJtYWxsXCIsXCJlbnRlcmluZ1wiLFwicGFja2V0XCIsXCJzcHJheVwiLFwic3R1ZGlvc1wiLFwiaW52b2x2ZW1lbnRcIixcImRhZFwiLFwiYnV0dG9uc1wiLFwicGxhY2VtZW50XCIsXCJvYnNlcnZhdGlvbnNcIixcInZidWxsZXRpblwiLFwiZnVuZGVkXCIsXCJ0aG9tcHNvblwiLFwid2lubmVyc1wiLFwiZXh0ZW5kXCIsXCJyb2Fkc1wiLFwic3Vic2VxdWVudFwiLFwicGF0XCIsXCJkdWJsaW5cIixcInJvbGxpbmdcIixcImZlbGxcIixcIm1vdG9yY3ljbGVcIixcInlhcmRcIixcImRpc2Nsb3N1cmVcIixcImVzdGFibGlzaG1lbnRcIixcIm1lbW9yaWVzXCIsXCJuZWxzb25cIixcInRlXCIsXCJhcnJpdmVkXCIsXCJjcmVhdGVzXCIsXCJmYWNlc1wiLFwidG91cmlzdFwiLFwiYXZcIixcIm1heW9yXCIsXCJtdXJkZXJcIixcInNlYW5cIixcImFkZXF1YXRlXCIsXCJzZW5hdG9yXCIsXCJ5aWVsZFwiLFwicHJlc2VudGF0aW9uc1wiLFwiZ3JhZGVzXCIsXCJjYXJ0b29uc1wiLFwicG91clwiLFwiZGlnZXN0XCIsXCJyZWdcIixcImxvZGdpbmdcIixcInRpb25cIixcImR1c3RcIixcImhlbmNlXCIsXCJ3aWtpXCIsXCJlbnRpcmVseVwiLFwicmVwbGFjZWRcIixcInJhZGFyXCIsXCJyZXNjdWVcIixcInVuZGVyZ3JhZHVhdGVcIixcImxvc3Nlc1wiLFwiY29tYmF0XCIsXCJyZWR1Y2luZ1wiLFwic3RvcHBlZFwiLFwib2NjdXBhdGlvblwiLFwibGFrZXNcIixcImRvbmF0aW9uc1wiLFwiYXNzb2NpYXRpb25zXCIsXCJjaXR5c2VhcmNoXCIsXCJjbG9zZWx5XCIsXCJyYWRpYXRpb25cIixcImRpYXJ5XCIsXCJzZXJpb3VzbHlcIixcImtpbmdzXCIsXCJzaG9vdGluZ1wiLFwia2VudFwiLFwiYWRkc1wiLFwibnN3XCIsXCJlYXJcIixcImZsYWdzXCIsXCJwY2lcIixcImJha2VyXCIsXCJsYXVuY2hlZFwiLFwiZWxzZXdoZXJlXCIsXCJwb2xsdXRpb25cIixcImNvbnNlcnZhdGl2ZVwiLFwiZ3Vlc3Rib29rXCIsXCJzaG9ja1wiLFwiZWZmZWN0aXZlbmVzc1wiLFwid2FsbHNcIixcImFicm9hZFwiLFwiZWJvbnlcIixcInRpZVwiLFwid2FyZFwiLFwiZHJhd25cIixcImFydGh1clwiLFwiaWFuXCIsXCJ2aXNpdGVkXCIsXCJyb29mXCIsXCJ3YWxrZXJcIixcImRlbW9uc3RyYXRlXCIsXCJhdG1vc3BoZXJlXCIsXCJzdWdnZXN0c1wiLFwia2lzc1wiLFwiYmVhc3RcIixcInJhXCIsXCJvcGVyYXRlZFwiLFwiZXhwZXJpbWVudFwiLFwidGFyZ2V0c1wiLFwib3ZlcnNlYXNcIixcInB1cmNoYXNlc1wiLFwiZG9kZ2VcIixcImNvdW5zZWxcIixcImZlZGVyYXRpb25cIixcInBpenphXCIsXCJpbnZpdGVkXCIsXCJ5YXJkc1wiLFwiYXNzaWdubWVudFwiLFwiY2hlbWljYWxzXCIsXCJnb3Jkb25cIixcIm1vZFwiLFwiZmFybWVyc1wiLFwicmNcIixcInF1ZXJpZXNcIixcImJtd1wiLFwicnVzaFwiLFwidWtyYWluZVwiLFwiYWJzZW5jZVwiLFwibmVhcmVzdFwiLFwiY2x1c3RlclwiLFwidmVuZG9yc1wiLFwibXBlZ1wiLFwid2hlcmVhc1wiLFwieW9nYVwiLFwic2VydmVzXCIsXCJ3b29kc1wiLFwic3VycHJpc2VcIixcImxhbXBcIixcInJpY29cIixcInBhcnRpYWxcIixcInNob3BwZXJzXCIsXCJwaGlsXCIsXCJldmVyeWJvZHlcIixcImNvdXBsZXNcIixcIm5hc2h2aWxsZVwiLFwicmFua2luZ1wiLFwiam9rZXNcIixcImNzdFwiLFwiaHR0cFwiLFwiY2VvXCIsXCJzaW1wc29uXCIsXCJ0d2lraVwiLFwic3VibGltZVwiLFwiY291bnNlbGluZ1wiLFwicGFsYWNlXCIsXCJhY2NlcHRhYmxlXCIsXCJzYXRpc2ZpZWRcIixcImdsYWRcIixcIndpbnNcIixcIm1lYXN1cmVtZW50c1wiLFwidmVyaWZ5XCIsXCJnbG9iZVwiLFwidHJ1c3RlZFwiLFwiY29wcGVyXCIsXCJtaWx3YXVrZWVcIixcInJhY2tcIixcIm1lZGljYXRpb25cIixcIndhcmVob3VzZVwiLFwic2hhcmV3YXJlXCIsXCJlY1wiLFwicmVwXCIsXCJkaWNrZVwiLFwia2VycnlcIixcInJlY2VpcHRcIixcInN1cHBvc2VkXCIsXCJvcmRpbmFyeVwiLFwibm9ib2R5XCIsXCJnaG9zdFwiLFwidmlvbGF0aW9uXCIsXCJjb25maWd1cmVcIixcInN0YWJpbGl0eVwiLFwibWl0XCIsXCJhcHBseWluZ1wiLFwic291dGh3ZXN0XCIsXCJib3NzXCIsXCJwcmlkZVwiLFwiaW5zdGl0dXRpb25hbFwiLFwiZXhwZWN0YXRpb25zXCIsXCJpbmRlcGVuZGVuY2VcIixcImtub3dpbmdcIixcInJlcG9ydGVyXCIsXCJtZXRhYm9saXNtXCIsXCJrZWl0aFwiLFwiY2hhbXBpb25cIixcImNsb3VkeVwiLFwibGluZGFcIixcInJvc3NcIixcInBlcnNvbmFsbHlcIixcImNoaWxlXCIsXCJhbm5hXCIsXCJwbGVudHlcIixcInNvbG9cIixcInNlbnRlbmNlXCIsXCJ0aHJvYXRcIixcImlnbm9yZVwiLFwibWFyaWFcIixcInVuaWZvcm1cIixcImV4Y2VsbGVuY2VcIixcIndlYWx0aFwiLFwidGFsbFwiLFwicm1cIixcInNvbWV3aGVyZVwiLFwidmFjdXVtXCIsXCJkYW5jaW5nXCIsXCJhdHRyaWJ1dGVzXCIsXCJyZWNvZ25pemVcIixcImJyYXNzXCIsXCJ3cml0ZXNcIixcInBsYXphXCIsXCJwZGFzXCIsXCJvdXRjb21lc1wiLFwic3Vydml2YWxcIixcInF1ZXN0XCIsXCJwdWJsaXNoXCIsXCJzcmlcIixcInNjcmVlbmluZ1wiLFwidG9lXCIsXCJ0aHVtYm5haWxcIixcInRyYW5zXCIsXCJqb25hdGhhblwiLFwid2hlbmV2ZXJcIixcIm5vdmFcIixcImxpZmV0aW1lXCIsXCJhcGlcIixcInBpb25lZXJcIixcImJvb3R5XCIsXCJmb3Jnb3R0ZW5cIixcImFjcm9iYXRcIixcInBsYXRlc1wiLFwiYWNyZXNcIixcInZlbnVlXCIsXCJhdGhsZXRpY1wiLFwidGhlcm1hbFwiLFwiZXNzYXlzXCIsXCJiZWhhdmlvdXJcIixcInZpdGFsXCIsXCJ0ZWxsaW5nXCIsXCJmYWlybHlcIixcImNvYXN0YWxcIixcImNvbmZpZ1wiLFwiY2ZcIixcImNoYXJpdHlcIixcImludGVsbGlnZW50XCIsXCJlZGluYnVyZ2hcIixcInZ0XCIsXCJleGNlbFwiLFwibW9kZXNcIixcIm9ibGlnYXRpb25cIixcImNhbXBiZWxsXCIsXCJ3YWtlXCIsXCJzdHVwaWRcIixcImhhcmJvclwiLFwiaHVuZ2FyeVwiLFwidHJhdmVsZXJcIixcInVyd1wiLFwic2VnbWVudFwiLFwicmVhbGl6ZVwiLFwicmVnYXJkbGVzc1wiLFwibGFuXCIsXCJlbmVteVwiLFwicHV6emxlXCIsXCJyaXNpbmdcIixcImFsdW1pbnVtXCIsXCJ3ZWxsc1wiLFwid2lzaGxpc3RcIixcIm9wZW5zXCIsXCJpbnNpZ2h0XCIsXCJzbXNcIixcInJlc3RyaWN0ZWRcIixcInJlcHVibGljYW5cIixcInNlY3JldHNcIixcImx1Y2t5XCIsXCJsYXR0ZXJcIixcIm1lcmNoYW50c1wiLFwidGhpY2tcIixcInRyYWlsZXJzXCIsXCJyZXBlYXRcIixcInN5bmRyb21lXCIsXCJwaGlsaXBzXCIsXCJhdHRlbmRhbmNlXCIsXCJwZW5hbHR5XCIsXCJkcnVtXCIsXCJnbGFzc2VzXCIsXCJlbmFibGVzXCIsXCJuZWNcIixcImlyYXFpXCIsXCJidWlsZGVyXCIsXCJ2aXN0YVwiLFwiamVzc2ljYVwiLFwiY2hpcHNcIixcInRlcnJ5XCIsXCJmbG9vZFwiLFwiZm90b1wiLFwiZWFzZVwiLFwiYXJndW1lbnRzXCIsXCJhbXN0ZXJkYW1cIixcImFyZW5hXCIsXCJhZHZlbnR1cmVzXCIsXCJwdXBpbHNcIixcInN0ZXdhcnRcIixcImFubm91bmNlbWVudFwiLFwidGFic1wiLFwib3V0Y29tZVwiLFwiYXBwcmVjaWF0ZVwiLFwiZXhwYW5kZWRcIixcImNhc3VhbFwiLFwiZ3Jvd25cIixcInBvbGlzaFwiLFwibG92ZWx5XCIsXCJleHRyYXNcIixcImdtXCIsXCJjZW50cmVzXCIsXCJqZXJyeVwiLFwiY2xhdXNlXCIsXCJzbWlsZVwiLFwibGFuZHNcIixcInJpXCIsXCJ0cm9vcHNcIixcImluZG9vclwiLFwiYnVsZ2FyaWFcIixcImFybWVkXCIsXCJicm9rZXJcIixcImNoYXJnZXJcIixcInJlZ3VsYXJseVwiLFwiYmVsaWV2ZWRcIixcInBpbmVcIixcImNvb2xpbmdcIixcInRlbmRcIixcImd1bGZcIixcInJ0XCIsXCJyaWNrXCIsXCJ0cnVja3NcIixcImNwXCIsXCJtZWNoYW5pc21zXCIsXCJkaXZvcmNlXCIsXCJsYXVyYVwiLFwic2hvcHBlclwiLFwidG9reW9cIixcInBhcnRseVwiLFwibmlrb25cIixcImN1c3RvbWl6ZVwiLFwidHJhZGl0aW9uXCIsXCJjYW5keVwiLFwicGlsbHNcIixcInRpZ2VyXCIsXCJkb25hbGRcIixcImZvbGtzXCIsXCJzZW5zb3JcIixcImV4cG9zZWRcIixcInRlbGVjb21cIixcImh1bnRcIixcImFuZ2Vsc1wiLFwiZGVwdXR5XCIsXCJpbmRpY2F0b3JzXCIsXCJzZWFsZWRcIixcInRoYWlcIixcImVtaXNzaW9uc1wiLFwicGh5c2ljaWFuc1wiLFwibG9hZGVkXCIsXCJmcmVkXCIsXCJjb21wbGFpbnRcIixcInNjZW5lc1wiLFwiZXhwZXJpbWVudHNcIixcImFmZ2hhbmlzdGFuXCIsXCJkZFwiLFwiYm9vc3RcIixcInNwYW5raW5nXCIsXCJzY2hvbGFyc2hpcFwiLFwiZ292ZXJuYW5jZVwiLFwibWlsbFwiLFwiZm91bmRlZFwiLFwic3VwcGxlbWVudHNcIixcImNocm9uaWNcIixcImljb25zXCIsXCJtb3JhbFwiLFwiZGVuXCIsXCJjYXRlcmluZ1wiLFwiYXVkXCIsXCJmaW5nZXJcIixcImtlZXBzXCIsXCJwb3VuZFwiLFwibG9jYXRlXCIsXCJjYW1jb3JkZXJcIixcInBsXCIsXCJ0cmFpbmVkXCIsXCJidXJuXCIsXCJpbXBsZW1lbnRpbmdcIixcInJvc2VzXCIsXCJsYWJzXCIsXCJvdXJzZWx2ZXNcIixcImJyZWFkXCIsXCJ0b2JhY2NvXCIsXCJ3b29kZW5cIixcIm1vdG9yc1wiLFwidG91Z2hcIixcInJvYmVydHNcIixcImluY2lkZW50XCIsXCJnb25uYVwiLFwiZHluYW1pY3NcIixcImxpZVwiLFwiY3JtXCIsXCJyZlwiLFwiY29udmVyc2F0aW9uXCIsXCJkZWNyZWFzZVwiLFwiY3Vtc2hvdHNcIixcImNoZXN0XCIsXCJwZW5zaW9uXCIsXCJiaWxseVwiLFwicmV2ZW51ZXNcIixcImVtZXJnaW5nXCIsXCJ3b3JzaGlwXCIsXCJjYXBhYmlsaXR5XCIsXCJha1wiLFwiZmVcIixcImNyYWlnXCIsXCJoZXJzZWxmXCIsXCJwcm9kdWNpbmdcIixcImNodXJjaGVzXCIsXCJwcmVjaXNpb25cIixcImRhbWFnZXNcIixcInJlc2VydmVzXCIsXCJjb250cmlidXRlZFwiLFwic29sdmVcIixcInNob3J0c1wiLFwicmVwcm9kdWN0aW9uXCIsXCJtaW5vcml0eVwiLFwidGRcIixcImRpdmVyc2VcIixcImFtcFwiLFwiaW5ncmVkaWVudHNcIixcInNiXCIsXCJhaFwiLFwiam9obm55XCIsXCJzb2xlXCIsXCJmcmFuY2hpc2VcIixcInJlY29yZGVyXCIsXCJjb21wbGFpbnRzXCIsXCJmYWNpbmdcIixcInNtXCIsXCJuYW5jeVwiLFwicHJvbW90aW9uc1wiLFwidG9uZXNcIixcInBhc3Npb25cIixcInJlaGFiaWxpdGF0aW9uXCIsXCJtYWludGFpbmluZ1wiLFwic2lnaHRcIixcImxhaWRcIixcImNsYXlcIixcImRlZmVuY2VcIixcInBhdGNoZXNcIixcIndlYWtcIixcInJlZnVuZFwiLFwidXNjXCIsXCJ0b3duc1wiLFwiZW52aXJvbm1lbnRzXCIsXCJ0cmVtYmxcIixcImRpdmlkZWRcIixcImJsdmRcIixcInJlY2VwdGlvblwiLFwiYW1kXCIsXCJ3aXNlXCIsXCJlbWFpbHNcIixcImN5cHJ1c1wiLFwid3ZcIixcIm9kZHNcIixcImNvcnJlY3RseVwiLFwiaW5zaWRlclwiLFwic2VtaW5hcnNcIixcImNvbnNlcXVlbmNlc1wiLFwibWFrZXJzXCIsXCJoZWFydHNcIixcImdlb2dyYXBoeVwiLFwiYXBwZWFyaW5nXCIsXCJpbnRlZ3JpdHlcIixcIndvcnJ5XCIsXCJuc1wiLFwiZGlzY3JpbWluYXRpb25cIixcImV2ZVwiLFwiY2FydGVyXCIsXCJsZWdhY3lcIixcIm1hcmNcIixcInBsZWFzZWRcIixcImRhbmdlclwiLFwidml0YW1pblwiLFwid2lkZWx5XCIsXCJwcm9jZXNzZWRcIixcInBocmFzZVwiLFwiZ2VudWluZVwiLFwicmFpc2luZ1wiLFwiaW1wbGljYXRpb25zXCIsXCJmdW5jdGlvbmFsaXR5XCIsXCJwYXJhZGlzZVwiLFwiaHlicmlkXCIsXCJyZWFkc1wiLFwicm9sZXNcIixcImludGVybWVkaWF0ZVwiLFwiZW1vdGlvbmFsXCIsXCJzb25zXCIsXCJsZWFmXCIsXCJwYWRcIixcImdsb3J5XCIsXCJwbGF0Zm9ybXNcIixcImphXCIsXCJiaWdnZXJcIixcImJpbGxpbmdcIixcImRpZXNlbFwiLFwidmVyc3VzXCIsXCJjb21iaW5lXCIsXCJvdmVybmlnaHRcIixcImdlb2dyYXBoaWNcIixcImV4Y2VlZFwiLFwiYnNcIixcInJvZFwiLFwic2F1ZGlcIixcImZhdWx0XCIsXCJjdWJhXCIsXCJocnNcIixcInByZWxpbWluYXJ5XCIsXCJkaXN0cmljdHNcIixcImludHJvZHVjZVwiLFwic2lsa1wiLFwicHJvbW90aW9uYWxcIixcImthdGVcIixcImNoZXZyb2xldFwiLFwiYmFiaWVzXCIsXCJiaVwiLFwia2FyZW5cIixcImNvbXBpbGVkXCIsXCJyb21hbnRpY1wiLFwicmV2ZWFsZWRcIixcInNwZWNpYWxpc3RzXCIsXCJnZW5lcmF0b3JcIixcImFsYmVydFwiLFwiZXhhbWluZVwiLFwiamltbXlcIixcImdyYWhhbVwiLFwic3VzcGVuc2lvblwiLFwiYnJpc3RvbFwiLFwibWFyZ2FyZXRcIixcImNvbXBhcVwiLFwic2FkXCIsXCJjb3JyZWN0aW9uXCIsXCJ3b2xmXCIsXCJzbG93bHlcIixcImF1dGhlbnRpY2F0aW9uXCIsXCJjb21tdW5pY2F0ZVwiLFwicnVnYnlcIixcInN1cHBsZW1lbnRcIixcInNob3d0aW1lc1wiLFwiY2FsXCIsXCJwb3J0aW9uc1wiLFwiaW5mYW50XCIsXCJwcm9tb3RpbmdcIixcInNlY3RvcnNcIixcInNhbXVlbFwiLFwiZmx1aWRcIixcImdyb3VuZHNcIixcImZpdHNcIixcImtpY2tcIixcInJlZ2FyZHNcIixcIm1lYWxcIixcInRhXCIsXCJodXJ0XCIsXCJtYWNoaW5lcnlcIixcImJhbmR3aWR0aFwiLFwidW5saWtlXCIsXCJlcXVhdGlvblwiLFwiYmFza2V0c1wiLFwicHJvYmFiaWxpdHlcIixcInBvdFwiLFwiZGltZW5zaW9uXCIsXCJ3cmlnaHRcIixcImltZ1wiLFwiYmFycnlcIixcInByb3ZlblwiLFwic2NoZWR1bGVzXCIsXCJhZG1pc3Npb25zXCIsXCJjYWNoZWRcIixcIndhcnJlblwiLFwic2xpcFwiLFwic3R1ZGllZFwiLFwicmV2aWV3ZXJcIixcImludm9sdmVzXCIsXCJxdWFydGVybHlcIixcInJwbVwiLFwicHJvZml0c1wiLFwiZGV2aWxcIixcImdyYXNzXCIsXCJjb21wbHlcIixcIm1hcmllXCIsXCJmbG9yaXN0XCIsXCJpbGx1c3RyYXRlZFwiLFwiY2hlcnJ5XCIsXCJjb250aW5lbnRhbFwiLFwiYWx0ZXJuYXRlXCIsXCJkZXV0c2NoXCIsXCJhY2hpZXZlbWVudFwiLFwibGltaXRhdGlvbnNcIixcImtlbnlhXCIsXCJ3ZWJjYW1cIixcImN1dHNcIixcImZ1bmVyYWxcIixcIm51dHRlblwiLFwiZWFycmluZ3NcIixcImVuam95ZWRcIixcImF1dG9tYXRlZFwiLFwiY2hhcHRlcnNcIixcInBlZVwiLFwiY2hhcmxpZVwiLFwicXVlYmVjXCIsXCJwYXNzZW5nZXJcIixcImNvbnZlbmllbnRcIixcImRlbm5pc1wiLFwibWFyc1wiLFwiZnJhbmNpc1wiLFwidHZzXCIsXCJzaXplZFwiLFwibWFuZ2FcIixcIm5vdGljZWRcIixcInNvY2tldFwiLFwic2lsZW50XCIsXCJsaXRlcmFyeVwiLFwiZWdnXCIsXCJtaHpcIixcInNpZ25hbHNcIixcImNhcHNcIixcIm9yaWVudGF0aW9uXCIsXCJwaWxsXCIsXCJ0aGVmdFwiLFwiY2hpbGRob29kXCIsXCJzd2luZ1wiLFwic3ltYm9sc1wiLFwibGF0XCIsXCJtZXRhXCIsXCJodW1hbnNcIixcImFuYWxvZ1wiLFwiZmFjaWFsXCIsXCJjaG9vc2luZ1wiLFwidGFsZW50XCIsXCJkYXRlZFwiLFwiZmxleGliaWxpdHlcIixcInNlZWtlclwiLFwid2lzZG9tXCIsXCJzaG9vdFwiLFwiYm91bmRhcnlcIixcIm1pbnRcIixcInBhY2thcmRcIixcIm9mZnNldFwiLFwicGF5ZGF5XCIsXCJwaGlsaXBcIixcImVsaXRlXCIsXCJnaVwiLFwic3BpblwiLFwiaG9sZGVyc1wiLFwiYmVsaWV2ZXNcIixcInN3ZWRpc2hcIixcInBvZW1zXCIsXCJkZWFkbGluZVwiLFwianVyaXNkaWN0aW9uXCIsXCJyb2JvdFwiLFwiZGlzcGxheWluZ1wiLFwid2l0bmVzc1wiLFwiY29sbGluc1wiLFwiZXF1aXBwZWRcIixcInN0YWdlc1wiLFwiZW5jb3VyYWdlZFwiLFwic3VyXCIsXCJ3aW5kc1wiLFwicG93ZGVyXCIsXCJicm9hZHdheVwiLFwiYWNxdWlyZWRcIixcImFzc2Vzc1wiLFwid2FzaFwiLFwiY2FydHJpZGdlc1wiLFwic3RvbmVzXCIsXCJlbnRyYW5jZVwiLFwiZ25vbWVcIixcInJvb3RzXCIsXCJkZWNsYXJhdGlvblwiLFwibG9zaW5nXCIsXCJhdHRlbXB0c1wiLFwiZ2FkZ2V0c1wiLFwibm9ibGVcIixcImdsYXNnb3dcIixcImF1dG9tYXRpb25cIixcImltcGFjdHNcIixcInJldlwiLFwiZ29zcGVsXCIsXCJhZHZhbnRhZ2VzXCIsXCJzaG9yZVwiLFwibG92ZXNcIixcImluZHVjZWRcIixcImxsXCIsXCJrbmlnaHRcIixcInByZXBhcmluZ1wiLFwibG9vc2VcIixcImFpbXNcIixcInJlY2lwaWVudFwiLFwibGlua2luZ1wiLFwiZXh0ZW5zaW9uc1wiLFwiYXBwZWFsc1wiLFwiY2xcIixcImVhcm5lZFwiLFwiaWxsbmVzc1wiLFwiaXNsYW1pY1wiLFwiYXRobGV0aWNzXCIsXCJzb3V0aGVhc3RcIixcImllZWVcIixcImhvXCIsXCJhbHRlcm5hdGl2ZXNcIixcInBlbmRpbmdcIixcInBhcmtlclwiLFwiZGV0ZXJtaW5pbmdcIixcImxlYmFub25cIixcImNvcnBcIixcInBlcnNvbmFsaXplZFwiLFwia2VubmVkeVwiLFwiZ3RcIixcInNoXCIsXCJjb25kaXRpb25pbmdcIixcInRlZW5hZ2VcIixcInNvYXBcIixcImFlXCIsXCJ0cmlwbGVcIixcImNvb3BlclwiLFwibnljXCIsXCJ2aW5jZW50XCIsXCJqYW1cIixcInNlY3VyZWRcIixcInVudXN1YWxcIixcImFuc3dlcmVkXCIsXCJwYXJ0bmVyc2hpcHNcIixcImRlc3RydWN0aW9uXCIsXCJzbG90c1wiLFwiaW5jcmVhc2luZ2x5XCIsXCJtaWdyYXRpb25cIixcImRpc29yZGVyXCIsXCJyb3V0aW5lXCIsXCJ0b29sYmFyXCIsXCJiYXNpY2FsbHlcIixcInJvY2tzXCIsXCJjb252ZW50aW9uYWxcIixcInRpdGFuc1wiLFwiYXBwbGljYW50c1wiLFwid2VhcmluZ1wiLFwiYXhpc1wiLFwic291Z2h0XCIsXCJnZW5lc1wiLFwibW91bnRlZFwiLFwiaGFiaXRhdFwiLFwiZmlyZXdhbGxcIixcIm1lZGlhblwiLFwiZ3Vuc1wiLFwic2Nhbm5lclwiLFwiaGVyZWluXCIsXCJvY2N1cGF0aW9uYWxcIixcImFuaW1hdGVkXCIsXCJqdWRpY2lhbFwiLFwicmlvXCIsXCJoc1wiLFwiYWRqdXN0bWVudFwiLFwiaGVyb1wiLFwiaW50ZWdlclwiLFwidHJlYXRtZW50c1wiLFwiYmFjaGVsb3JcIixcImF0dGl0dWRlXCIsXCJjYW1jb3JkZXJzXCIsXCJlbmdhZ2VkXCIsXCJmYWxsaW5nXCIsXCJiYXNpY3NcIixcIm1vbnRyZWFsXCIsXCJjYXJwZXRcIixcInJ2XCIsXCJzdHJ1Y3RcIixcImxlbnNlc1wiLFwiYmluYXJ5XCIsXCJnZW5ldGljc1wiLFwiYXR0ZW5kZWRcIixcImRpZmZpY3VsdHlcIixcInB1bmtcIixcImNvbGxlY3RpdmVcIixcImNvYWxpdGlvblwiLFwicGlcIixcImRyb3BwZWRcIixcImVucm9sbG1lbnRcIixcImR1a2VcIixcIndhbHRlclwiLFwiYWlcIixcInBhY2VcIixcImJlc2lkZXNcIixcIndhZ2VcIixcInByb2R1Y2Vyc1wiLFwib3RcIixcImNvbGxlY3RvclwiLFwiYXJjXCIsXCJob3N0c1wiLFwiaW50ZXJmYWNlc1wiLFwiYWR2ZXJ0aXNlcnNcIixcIm1vbWVudHNcIixcImF0bGFzXCIsXCJzdHJpbmdzXCIsXCJkYXduXCIsXCJyZXByZXNlbnRpbmdcIixcIm9ic2VydmF0aW9uXCIsXCJmZWVsc1wiLFwidG9ydHVyZVwiLFwiY2FybFwiLFwiZGVsZXRlZFwiLFwiY29hdFwiLFwibWl0Y2hlbGxcIixcIm1yc1wiLFwicmljYVwiLFwicmVzdG9yYXRpb25cIixcImNvbnZlbmllbmNlXCIsXCJyZXR1cm5pbmdcIixcInJhbHBoXCIsXCJvcHBvc2l0aW9uXCIsXCJjb250YWluZXJcIixcInlyXCIsXCJkZWZlbmRhbnRcIixcIndhcm5lclwiLFwiY29uZmlybWF0aW9uXCIsXCJhcHBcIixcImVtYmVkZGVkXCIsXCJpbmtqZXRcIixcInN1cGVydmlzb3JcIixcIndpemFyZFwiLFwiY29ycHNcIixcImFjdG9yc1wiLFwibGl2ZXJcIixcInBlcmlwaGVyYWxzXCIsXCJsaWFibGVcIixcImJyb2NodXJlXCIsXCJtb3JyaXNcIixcImJlc3RzZWxsZXJzXCIsXCJwZXRpdGlvblwiLFwiZW1pbmVtXCIsXCJyZWNhbGxcIixcImFudGVubmFcIixcInBpY2tlZFwiLFwiYXNzdW1lZFwiLFwiZGVwYXJ0dXJlXCIsXCJtaW5uZWFwb2xpc1wiLFwiYmVsaWVmXCIsXCJraWxsaW5nXCIsXCJiaWtpbmlcIixcIm1lbXBoaXNcIixcInNob3VsZGVyXCIsXCJkZWNvclwiLFwibG9va3VwXCIsXCJ0ZXh0c1wiLFwiaGFydmFyZFwiLFwiYnJva2Vyc1wiLFwicm95XCIsXCJpb25cIixcImRpYW1ldGVyXCIsXCJvdHRhd2FcIixcImRvbGxcIixcImljXCIsXCJwb2RjYXN0XCIsXCJzZWFzb25zXCIsXCJwZXJ1XCIsXCJpbnRlcmFjdGlvbnNcIixcInJlZmluZVwiLFwiYmlkZGVyXCIsXCJzaW5nZXJcIixcImV2YW5zXCIsXCJoZXJhbGRcIixcImxpdGVyYWN5XCIsXCJmYWlsc1wiLFwiYWdpbmdcIixcIm5pa2VcIixcImludGVydmVudGlvblwiLFwiZmVkXCIsXCJwbHVnaW5cIixcImF0dHJhY3Rpb25cIixcImRpdmluZ1wiLFwiaW52aXRlXCIsXCJtb2RpZmljYXRpb25cIixcImFsaWNlXCIsXCJsYXRpbmFzXCIsXCJzdXBwb3NlXCIsXCJjdXN0b21pemVkXCIsXCJyZWVkXCIsXCJpbnZvbHZlXCIsXCJtb2RlcmF0ZVwiLFwidGVycm9yXCIsXCJ5b3VuZ2VyXCIsXCJ0aGlydHlcIixcIm1pY2VcIixcIm9wcG9zaXRlXCIsXCJ1bmRlcnN0b29kXCIsXCJyYXBpZGx5XCIsXCJkZWFsdGltZVwiLFwiYmFuXCIsXCJ0ZW1wXCIsXCJpbnRyb1wiLFwibWVyY2VkZXNcIixcInp1c1wiLFwiYXNzdXJhbmNlXCIsXCJjbGVya1wiLFwiaGFwcGVuaW5nXCIsXCJ2YXN0XCIsXCJtaWxsc1wiLFwib3V0bGluZVwiLFwiYW1lbmRtZW50c1wiLFwidHJhbWFkb2xcIixcImhvbGxhbmRcIixcInJlY2VpdmVzXCIsXCJqZWFuc1wiLFwibWV0cm9wb2xpdGFuXCIsXCJjb21waWxhdGlvblwiLFwidmVyaWZpY2F0aW9uXCIsXCJmb250c1wiLFwiZW50XCIsXCJvZGRcIixcIndyYXBcIixcInJlZmVyc1wiLFwibW9vZFwiLFwiZmF2b3JcIixcInZldGVyYW5zXCIsXCJxdWl6XCIsXCJteFwiLFwic2lnbWFcIixcImdyXCIsXCJhdHRyYWN0aXZlXCIsXCJ4aHRtbFwiLFwib2NjYXNpb25cIixcInJlY29yZGluZ3NcIixcImplZmZlcnNvblwiLFwidmljdGltXCIsXCJkZW1hbmRzXCIsXCJzbGVlcGluZ1wiLFwiY2FyZWZ1bFwiLFwiZXh0XCIsXCJiZWFtXCIsXCJnYXJkZW5pbmdcIixcIm9ibGlnYXRpb25zXCIsXCJhcnJpdmVcIixcIm9yY2hlc3RyYVwiLFwic3Vuc2V0XCIsXCJ0cmFja2VkXCIsXCJtb3Jlb3ZlclwiLFwibWluaW1hbFwiLFwicG9seXBob25pY1wiLFwibG90dGVyeVwiLFwidG9wc1wiLFwiZnJhbWVkXCIsXCJhc2lkZVwiLFwib3V0c291cmNpbmdcIixcImxpY2VuY2VcIixcImFkanVzdGFibGVcIixcImFsbG9jYXRpb25cIixcIm1pY2hlbGxlXCIsXCJlc3NheVwiLFwiZGlzY2lwbGluZVwiLFwiYW15XCIsXCJ0c1wiLFwiZGVtb25zdHJhdGVkXCIsXCJkaWFsb2d1ZVwiLFwiaWRlbnRpZnlpbmdcIixcImFscGhhYmV0aWNhbFwiLFwiY2FtcHNcIixcImRlY2xhcmVkXCIsXCJkaXNwYXRjaGVkXCIsXCJhYXJvblwiLFwiaGFuZGhlbGRcIixcInRyYWNlXCIsXCJkaXNwb3NhbFwiLFwic2h1dFwiLFwiZmxvcmlzdHNcIixcInBhY2tzXCIsXCJnZVwiLFwiaW5zdGFsbGluZ1wiLFwic3dpdGNoZXNcIixcInJvbWFuaWFcIixcInZvbHVudGFyeVwiLFwibmNhYVwiLFwidGhvdVwiLFwiY29uc3VsdFwiLFwicGhkXCIsXCJncmVhdGx5XCIsXCJibG9nZ2luZ1wiLFwibWFza1wiLFwiY3ljbGluZ1wiLFwibWlkbmlnaHRcIixcIm5nXCIsXCJjb21tb25seVwiLFwicGVcIixcInBob3RvZ3JhcGhlclwiLFwiaW5mb3JtXCIsXCJ0dXJraXNoXCIsXCJjb2FsXCIsXCJjcnlcIixcIm1lc3NhZ2luZ1wiLFwicGVudGl1bVwiLFwicXVhbnR1bVwiLFwibXVycmF5XCIsXCJpbnRlbnRcIixcInR0XCIsXCJ6b29cIixcImxhcmdlbHlcIixcInBsZWFzYW50XCIsXCJhbm5vdW5jZVwiLFwiY29uc3RydWN0ZWRcIixcImFkZGl0aW9uc1wiLFwicmVxdWlyaW5nXCIsXCJzcG9rZVwiLFwiYWthXCIsXCJhcnJvd1wiLFwiZW5nYWdlbWVudFwiLFwic2FtcGxpbmdcIixcInJvdWdoXCIsXCJ3ZWlyZFwiLFwidGVlXCIsXCJyZWZpbmFuY2VcIixcImxpb25cIixcImluc3BpcmVkXCIsXCJob2xlc1wiLFwid2VkZGluZ3NcIixcImJsYWRlXCIsXCJzdWRkZW5seVwiLFwib3h5Z2VuXCIsXCJjb29raWVcIixcIm1lYWxzXCIsXCJjYW55b25cIixcImdvdG9cIixcIm1ldGVyc1wiLFwibWVyZWx5XCIsXCJjYWxlbmRhcnNcIixcImFycmFuZ2VtZW50XCIsXCJjb25jbHVzaW9uc1wiLFwicGFzc2VzXCIsXCJiaWJsaW9ncmFwaHlcIixcInBvaW50ZXJcIixcImNvbXBhdGliaWxpdHlcIixcInN0cmV0Y2hcIixcImR1cmhhbVwiLFwiZnVydGhlcm1vcmVcIixcInBlcm1pdHNcIixcImNvb3BlcmF0aXZlXCIsXCJtdXNsaW1cIixcInhsXCIsXCJuZWlsXCIsXCJzbGVldmVcIixcIm5ldHNjYXBlXCIsXCJjbGVhbmVyXCIsXCJjcmlja2V0XCIsXCJiZWVmXCIsXCJmZWVkaW5nXCIsXCJzdHJva2VcIixcInRvd25zaGlwXCIsXCJyYW5raW5nc1wiLFwibWVhc3VyaW5nXCIsXCJjYWRcIixcImhhdHNcIixcInJvYmluXCIsXCJyb2JpbnNvblwiLFwiamFja3NvbnZpbGxlXCIsXCJzdHJhcFwiLFwiaGVhZHF1YXJ0ZXJzXCIsXCJzaGFyb25cIixcImNyb3dkXCIsXCJ0Y3BcIixcInRyYW5zZmVyc1wiLFwic3VyZlwiLFwib2x5bXBpY1wiLFwidHJhbnNmb3JtYXRpb25cIixcInJlbWFpbmVkXCIsXCJhdHRhY2htZW50c1wiLFwiZHZcIixcImRpclwiLFwiZW50aXRpZXNcIixcImN1c3RvbXNcIixcImFkbWluaXN0cmF0b3JzXCIsXCJwZXJzb25hbGl0eVwiLFwicmFpbmJvd1wiLFwiaG9va1wiLFwicm91bGV0dGVcIixcImRlY2xpbmVcIixcImdsb3Zlc1wiLFwiaXNyYWVsaVwiLFwibWVkaWNhcmVcIixcImNvcmRcIixcInNraWluZ1wiLFwiY2xvdWRcIixcImZhY2lsaXRhdGVcIixcInN1YnNjcmliZXJcIixcInZhbHZlXCIsXCJ2YWxcIixcImhld2xldHRcIixcImV4cGxhaW5zXCIsXCJwcm9jZWVkXCIsXCJmbGlja3JcIixcImZlZWxpbmdzXCIsXCJrbmlmZVwiLFwiamFtYWljYVwiLFwicHJpb3JpdGllc1wiLFwic2hlbGZcIixcImJvb2tzdG9yZVwiLFwidGltaW5nXCIsXCJsaWtlZFwiLFwicGFyZW50aW5nXCIsXCJhZG9wdFwiLFwiZGVuaWVkXCIsXCJmb3Rvc1wiLFwiaW5jcmVkaWJsZVwiLFwiYnJpdG5leVwiLFwiZnJlZXdhcmVcIixcImRvbmF0aW9uXCIsXCJvdXRlclwiLFwiY3JvcFwiLFwiZGVhdGhzXCIsXCJyaXZlcnNcIixcImNvbW1vbndlYWx0aFwiLFwicGhhcm1hY2V1dGljYWxcIixcIm1hbmhhdHRhblwiLFwidGFsZXNcIixcImthdHJpbmFcIixcIndvcmtmb3JjZVwiLFwiaXNsYW1cIixcIm5vZGVzXCIsXCJ0dVwiLFwiZnlcIixcInRodW1ic1wiLFwic2VlZHNcIixcImNpdGVkXCIsXCJsaXRlXCIsXCJnaHpcIixcImh1YlwiLFwidGFyZ2V0ZWRcIixcIm9yZ2FuaXphdGlvbmFsXCIsXCJza3lwZVwiLFwicmVhbGl6ZWRcIixcInR3ZWx2ZVwiLFwiZm91bmRlclwiLFwiZGVjYWRlXCIsXCJnYW1lY3ViZVwiLFwicnJcIixcImRpc3B1dGVcIixcInBvcnR1Z3Vlc2VcIixcInRpcmVkXCIsXCJ0aXR0ZW5cIixcImFkdmVyc2VcIixcImV2ZXJ5d2hlcmVcIixcImV4Y2VycHRcIixcImVuZ1wiLFwic3RlYW1cIixcImRpc2NoYXJnZVwiLFwiZWZcIixcImRyaW5rc1wiLFwiYWNlXCIsXCJ2b2ljZXNcIixcImFjdXRlXCIsXCJoYWxsb3dlZW5cIixcImNsaW1iaW5nXCIsXCJzdG9vZFwiLFwic2luZ1wiLFwidG9uc1wiLFwicGVyZnVtZVwiLFwiY2Fyb2xcIixcImhvbmVzdFwiLFwiYWxiYW55XCIsXCJoYXphcmRvdXNcIixcInJlc3RvcmVcIixcInN0YWNrXCIsXCJtZXRob2RvbG9neVwiLFwic29tZWJvZHlcIixcInN1ZVwiLFwiZXBcIixcImhvdXNld2FyZXNcIixcInJlcHV0YXRpb25cIixcInJlc2lzdGFudFwiLFwiZGVtb2NyYXRzXCIsXCJyZWN5Y2xpbmdcIixcImhhbmdcIixcImdicFwiLFwiY3VydmVcIixcImNyZWF0b3JcIixcImFtYmVyXCIsXCJxdWFsaWZpY2F0aW9uc1wiLFwibXVzZXVtc1wiLFwiY29kaW5nXCIsXCJzbGlkZXNob3dcIixcInRyYWNrZXJcIixcInZhcmlhdGlvblwiLFwicGFzc2FnZVwiLFwidHJhbnNmZXJyZWRcIixcInRydW5rXCIsXCJoaWtpbmdcIixcImxiXCIsXCJwaWVycmVcIixcImplbHNvZnRcIixcImhlYWRzZXRcIixcInBob3RvZ3JhcGhcIixcIm9ha2xhbmRcIixcImNvbG9tYmlhXCIsXCJ3YXZlc1wiLFwiY2FtZWxcIixcImRpc3RyaWJ1dG9yXCIsXCJsYW1wc1wiLFwidW5kZXJseWluZ1wiLFwiaG9vZFwiLFwid3Jlc3RsaW5nXCIsXCJzdWljaWRlXCIsXCJhcmNoaXZlZFwiLFwicGhvdG9zaG9wXCIsXCJqcFwiLFwiY2hpXCIsXCJidFwiLFwiYXJhYmlhXCIsXCJnYXRoZXJpbmdcIixcInByb2plY3Rpb25cIixcImp1aWNlXCIsXCJjaGFzZVwiLFwibWF0aGVtYXRpY2FsXCIsXCJsb2dpY2FsXCIsXCJzYXVjZVwiLFwiZmFtZVwiLFwiZXh0cmFjdFwiLFwic3BlY2lhbGl6ZWRcIixcImRpYWdub3N0aWNcIixcInBhbmFtYVwiLFwiaW5kaWFuYXBvbGlzXCIsXCJhZlwiLFwicGF5YWJsZVwiLFwiY29ycG9yYXRpb25zXCIsXCJjb3VydGVzeVwiLFwiY3JpdGljaXNtXCIsXCJhdXRvbW9iaWxlXCIsXCJjb25maWRlbnRpYWxcIixcInJmY1wiLFwic3RhdHV0b3J5XCIsXCJhY2NvbW1vZGF0aW9uc1wiLFwiYXRoZW5zXCIsXCJub3J0aGVhc3RcIixcImRvd25sb2FkZWRcIixcImp1ZGdlc1wiLFwic2xcIixcInNlb1wiLFwicmV0aXJlZFwiLFwiaXNwXCIsXCJyZW1hcmtzXCIsXCJkZXRlY3RlZFwiLFwiZGVjYWRlc1wiLFwicGFpbnRpbmdzXCIsXCJ3YWxrZWRcIixcImFyaXNpbmdcIixcIm5pc3NhblwiLFwiYnJhY2VsZXRcIixcImluc1wiLFwiZWdnc1wiLFwianV2ZW5pbGVcIixcImluamVjdGlvblwiLFwieW9ya3NoaXJlXCIsXCJwb3B1bGF0aW9uc1wiLFwicHJvdGVjdGl2ZVwiLFwiYWZyYWlkXCIsXCJhY291c3RpY1wiLFwicmFpbHdheVwiLFwiY2Fzc2V0dGVcIixcImluaXRpYWxseVwiLFwiaW5kaWNhdG9yXCIsXCJwb2ludGVkXCIsXCJoYlwiLFwianBnXCIsXCJjYXVzaW5nXCIsXCJtaXN0YWtlXCIsXCJub3J0b25cIixcImxvY2tlZFwiLFwiZWxpbWluYXRlXCIsXCJ0Y1wiLFwiZnVzaW9uXCIsXCJtaW5lcmFsXCIsXCJzdW5nbGFzc2VzXCIsXCJydWJ5XCIsXCJzdGVlcmluZ1wiLFwiYmVhZHNcIixcImZvcnR1bmVcIixcInByZWZlcmVuY2VcIixcImNhbnZhc1wiLFwidGhyZXNob2xkXCIsXCJwYXJpc2hcIixcImNsYWltZWRcIixcInNjcmVlbnNcIixcImNlbWV0ZXJ5XCIsXCJwbGFubmVyXCIsXCJjcm9hdGlhXCIsXCJmbG93c1wiLFwic3RhZGl1bVwiLFwidmVuZXp1ZWxhXCIsXCJleHBsb3JhdGlvblwiLFwibWluc1wiLFwiZmV3ZXJcIixcInNlcXVlbmNlc1wiLFwiY291cG9uXCIsXCJudXJzZXNcIixcInNzbFwiLFwic3RlbVwiLFwicHJveHlcIixcImFzdHJvbm9teVwiLFwibGFua2FcIixcIm9wdFwiLFwiZWR3YXJkc1wiLFwiZHJld1wiLFwiY29udGVzdHNcIixcImZsdVwiLFwidHJhbnNsYXRlXCIsXCJhbm5vdW5jZXNcIixcIm1sYlwiLFwiY29zdHVtZVwiLFwidGFnZ2VkXCIsXCJiZXJrZWxleVwiLFwidm90ZWRcIixcImtpbGxlclwiLFwiYmlrZXNcIixcImdhdGVzXCIsXCJhZGp1c3RlZFwiLFwicmFwXCIsXCJ0dW5lXCIsXCJiaXNob3BcIixcInB1bGxlZFwiLFwiY29yblwiLFwiZ3BcIixcInNoYXBlZFwiLFwiY29tcHJlc3Npb25cIixcInNlYXNvbmFsXCIsXCJlc3RhYmxpc2hpbmdcIixcImZhcm1lclwiLFwiY291bnRlcnNcIixcInB1dHNcIixcImNvbnN0aXR1dGlvbmFsXCIsXCJncmV3XCIsXCJwZXJmZWN0bHlcIixcInRpblwiLFwic2xhdmVcIixcImluc3RhbnRseVwiLFwiY3VsdHVyZXNcIixcIm5vcmZvbGtcIixcImNvYWNoaW5nXCIsXCJleGFtaW5lZFwiLFwidHJla1wiLFwiZW5jb2RpbmdcIixcImxpdGlnYXRpb25cIixcInN1Ym1pc3Npb25zXCIsXCJvZW1cIixcImhlcm9lc1wiLFwicGFpbnRlZFwiLFwibHljb3NcIixcImlyXCIsXCJ6ZG5ldFwiLFwiYnJvYWRjYXN0aW5nXCIsXCJob3Jpem9udGFsXCIsXCJhcnR3b3JrXCIsXCJjb3NtZXRpY1wiLFwicmVzdWx0ZWRcIixcInBvcnRyYWl0XCIsXCJ0ZXJyb3Jpc3RcIixcImluZm9ybWF0aW9uYWxcIixcImV0aGljYWxcIixcImNhcnJpZXJzXCIsXCJlY29tbWVyY2VcIixcIm1vYmlsaXR5XCIsXCJmbG9yYWxcIixcImJ1aWxkZXJzXCIsXCJ0aWVzXCIsXCJzdHJ1Z2dsZVwiLFwic2NoZW1lc1wiLFwic3VmZmVyaW5nXCIsXCJuZXV0cmFsXCIsXCJmaXNoZXJcIixcInJhdFwiLFwic3BlYXJzXCIsXCJwcm9zcGVjdGl2ZVwiLFwiYmVkZGluZ1wiLFwidWx0aW1hdGVseVwiLFwiam9pbmluZ1wiLFwiaGVhZGluZ1wiLFwiZXF1YWxseVwiLFwiYXJ0aWZpY2lhbFwiLFwiYmVhcmluZ1wiLFwic3BlY3RhY3VsYXJcIixcImNvb3JkaW5hdGlvblwiLFwiY29ubmVjdG9yXCIsXCJicmFkXCIsXCJjb21ib1wiLFwic2VuaW9yc1wiLFwid29ybGRzXCIsXCJndWlsdHlcIixcImFmZmlsaWF0ZWRcIixcImFjdGl2YXRpb25cIixcIm5hdHVyYWxseVwiLFwiaGF2ZW5cIixcInRhYmxldFwiLFwianVyeVwiLFwiZG9zXCIsXCJ0YWlsXCIsXCJzdWJzY3JpYmVyc1wiLFwiY2hhcm1cIixcImxhd25cIixcInZpb2xlbnRcIixcIm1pdHN1YmlzaGlcIixcInVuZGVyd2VhclwiLFwiYmFzaW5cIixcInNvdXBcIixcInBvdGVudGlhbGx5XCIsXCJyYW5jaFwiLFwiY29uc3RyYWludHNcIixcImNyb3NzaW5nXCIsXCJpbmNsdXNpdmVcIixcImRpbWVuc2lvbmFsXCIsXCJjb3R0YWdlXCIsXCJkcnVua1wiLFwiY29uc2lkZXJhYmxlXCIsXCJjcmltZXNcIixcInJlc29sdmVkXCIsXCJtb3ppbGxhXCIsXCJieXRlXCIsXCJ0b25lclwiLFwibm9zZVwiLFwibGF0ZXhcIixcImJyYW5jaGVzXCIsXCJhbnltb3JlXCIsXCJvY2xjXCIsXCJkZWxoaVwiLFwiaG9sZGluZ3NcIixcImFsaWVuXCIsXCJsb2NhdG9yXCIsXCJzZWxlY3RpbmdcIixcInByb2Nlc3NvcnNcIixcInBhbnR5aG9zZVwiLFwicGxjXCIsXCJicm9rZVwiLFwibmVwYWxcIixcInppbWJhYndlXCIsXCJkaWZmaWN1bHRpZXNcIixcImp1YW5cIixcImNvbXBsZXhpdHlcIixcIm1zZ1wiLFwiY29uc3RhbnRseVwiLFwiYnJvd3NpbmdcIixcInJlc29sdmVcIixcImJhcmNlbG9uYVwiLFwicHJlc2lkZW50aWFsXCIsXCJkb2N1bWVudGFyeVwiLFwiY29kXCIsXCJ0ZXJyaXRvcmllc1wiLFwibWVsaXNzYVwiLFwibW9zY293XCIsXCJ0aGVzaXNcIixcInRocnVcIixcImpld3NcIixcIm55bG9uXCIsXCJwYWxlc3RpbmlhblwiLFwiZGlzY3NcIixcInJvY2t5XCIsXCJiYXJnYWluc1wiLFwiZnJlcXVlbnRcIixcInRyaW1cIixcIm5pZ2VyaWFcIixcImNlaWxpbmdcIixcInBpeGVsc1wiLFwiZW5zdXJpbmdcIixcImhpc3BhbmljXCIsXCJjdlwiLFwiY2JcIixcImxlZ2lzbGF0dXJlXCIsXCJob3NwaXRhbGl0eVwiLFwiZ2VuXCIsXCJhbnlib2R5XCIsXCJwcm9jdXJlbWVudFwiLFwiZGlhbW9uZHNcIixcImVzcG5cIixcImZsZWV0XCIsXCJ1bnRpdGxlZFwiLFwiYnVuY2hcIixcInRvdGFsc1wiLFwibWFycmlvdHRcIixcInNpbmdpbmdcIixcInRoZW9yZXRpY2FsXCIsXCJhZmZvcmRcIixcImV4ZXJjaXNlc1wiLFwic3RhcnJpbmdcIixcInJlZmVycmFsXCIsXCJuaGxcIixcInN1cnZlaWxsYW5jZVwiLFwib3B0aW1hbFwiLFwicXVpdFwiLFwiZGlzdGluY3RcIixcInByb3RvY29sc1wiLFwibHVuZ1wiLFwiaGlnaGxpZ2h0XCIsXCJzdWJzdGl0dXRlXCIsXCJpbmNsdXNpb25cIixcImhvcGVmdWxseVwiLFwiYnJpbGxpYW50XCIsXCJ0dXJuZXJcIixcInN1Y2tpbmdcIixcImNlbnRzXCIsXCJyZXV0ZXJzXCIsXCJ0aVwiLFwiZmNcIixcImdlbFwiLFwidG9kZFwiLFwic3Bva2VuXCIsXCJvbWVnYVwiLFwiZXZhbHVhdGVkXCIsXCJzdGF5ZWRcIixcImNpdmljXCIsXCJhc3NpZ25tZW50c1wiLFwiZndcIixcIm1hbnVhbHNcIixcImRvdWdcIixcInNlZXNcIixcInRlcm1pbmF0aW9uXCIsXCJ3YXRjaGVkXCIsXCJzYXZlclwiLFwidGhlcmVvZlwiLFwiZ3JpbGxcIixcImhvdXNlaG9sZHNcIixcImdzXCIsXCJyZWRlZW1cIixcInJvZ2Vyc1wiLFwiZ3JhaW5cIixcImFhYVwiLFwiYXV0aGVudGljXCIsXCJyZWdpbWVcIixcIndhbm5hXCIsXCJ3aXNoZXNcIixcImJ1bGxcIixcIm1vbnRnb21lcnlcIixcImFyY2hpdGVjdHVyYWxcIixcImxvdWlzdmlsbGVcIixcImRlcGVuZFwiLFwiZGlmZmVyXCIsXCJtYWNpbnRvc2hcIixcIm1vdmVtZW50c1wiLFwicmFuZ2luZ1wiLFwibW9uaWNhXCIsXCJyZXBhaXJzXCIsXCJicmVhdGhcIixcImFtZW5pdGllc1wiLFwidmlydHVhbGx5XCIsXCJjb2xlXCIsXCJtYXJ0XCIsXCJjYW5kbGVcIixcImhhbmdpbmdcIixcImNvbG9yZWRcIixcImF1dGhvcml6YXRpb25cIixcInRhbGVcIixcInZlcmlmaWVkXCIsXCJseW5uXCIsXCJmb3JtZXJseVwiLFwicHJvamVjdG9yXCIsXCJicFwiLFwic2l0dWF0ZWRcIixcImNvbXBhcmF0aXZlXCIsXCJzdGRcIixcInNlZWtzXCIsXCJoZXJiYWxcIixcImxvdmluZ1wiLFwic3RyaWN0bHlcIixcInJvdXRpbmdcIixcImRvY3NcIixcInN0YW5sZXlcIixcInBzeWNob2xvZ2ljYWxcIixcInN1cnByaXNlZFwiLFwicmV0YWlsZXJcIixcInZpdGFtaW5zXCIsXCJlbGVnYW50XCIsXCJnYWluc1wiLFwicmVuZXdhbFwiLFwidmlkXCIsXCJnZW5lYWxvZ3lcIixcIm9wcG9zZWRcIixcImRlZW1lZFwiLFwic2NvcmluZ1wiLFwiZXhwZW5kaXR1cmVcIixcImJyb29rbHluXCIsXCJsaXZlcnBvb2xcIixcInNpc3RlcnNcIixcImNyaXRpY3NcIixcImNvbm5lY3Rpdml0eVwiLFwic3BvdHNcIixcIm9vXCIsXCJhbGdvcml0aG1zXCIsXCJoYWNrZXJcIixcIm1hZHJpZFwiLFwic2ltaWxhcmx5XCIsXCJtYXJnaW5cIixcImNvaW5cIixcInNvbGVseVwiLFwiZmFrZVwiLFwic2Fsb25cIixcImNvbGxhYm9yYXRpdmVcIixcIm5vcm1hblwiLFwiZmRhXCIsXCJleGNsdWRpbmdcIixcInR1cmJvXCIsXCJoZWFkZWRcIixcInZvdGVyc1wiLFwiY3VyZVwiLFwibWFkb25uYVwiLFwiY29tbWFuZGVyXCIsXCJhcmNoXCIsXCJuaVwiLFwibXVycGh5XCIsXCJ0aGlua3NcIixcInRoYXRzXCIsXCJzdWdnZXN0aW9uXCIsXCJoZHR2XCIsXCJzb2xkaWVyXCIsXCJwaGlsbGlwc1wiLFwiYXNpblwiLFwiYWltZWRcIixcImp1c3RpblwiLFwiYm9tYlwiLFwiaGFybVwiLFwiaW50ZXJ2YWxcIixcIm1pcnJvcnNcIixcInNwb3RsaWdodFwiLFwidHJpY2tzXCIsXCJyZXNldFwiLFwiYnJ1c2hcIixcImludmVzdGlnYXRlXCIsXCJ0aHlcIixcImV4cGFuc3lzXCIsXCJwYW5lbHNcIixcInJlcGVhdGVkXCIsXCJhc3NhdWx0XCIsXCJjb25uZWN0aW5nXCIsXCJzcGFyZVwiLFwibG9naXN0aWNzXCIsXCJkZWVyXCIsXCJrb2Rha1wiLFwidG9uZ3VlXCIsXCJib3dsaW5nXCIsXCJ0cmlcIixcImRhbmlzaFwiLFwicGFsXCIsXCJtb25rZXlcIixcInByb3BvcnRpb25cIixcImZpbGVuYW1lXCIsXCJza2lydFwiLFwiZmxvcmVuY2VcIixcImludmVzdFwiLFwiaG9uZXlcIixcInVtXCIsXCJhbmFseXNlc1wiLFwiZHJhd2luZ3NcIixcInNpZ25pZmljYW5jZVwiLFwic2NlbmFyaW9cIixcInllXCIsXCJmc1wiLFwibG92ZXJzXCIsXCJhdG9taWNcIixcImFwcHJveFwiLFwic3ltcG9zaXVtXCIsXCJhcmFiaWNcIixcImdhdWdlXCIsXCJlc3NlbnRpYWxzXCIsXCJqdW5jdGlvblwiLFwicHJvdGVjdGluZ1wiLFwibm5cIixcImZhY2VkXCIsXCJtYXRcIixcInJhY2hlbFwiLFwic29sdmluZ1wiLFwidHJhbnNtaXR0ZWRcIixcIndlZWtlbmRzXCIsXCJzY3JlZW5zaG90c1wiLFwicHJvZHVjZXNcIixcIm92ZW5cIixcInRlZFwiLFwiaW50ZW5zaXZlXCIsXCJjaGFpbnNcIixcImtpbmdzdG9uXCIsXCJzaXh0aFwiLFwiZW5nYWdlXCIsXCJkZXZpYW50XCIsXCJub29uXCIsXCJzd2l0Y2hpbmdcIixcInF1b3RlZFwiLFwiYWRhcHRlcnNcIixcImNvcnJlc3BvbmRlbmNlXCIsXCJmYXJtc1wiLFwiaW1wb3J0c1wiLFwic3VwZXJ2aXNpb25cIixcImNoZWF0XCIsXCJicm9uemVcIixcImV4cGVuZGl0dXJlc1wiLFwic2FuZHlcIixcInNlcGFyYXRpb25cIixcInRlc3RpbW9ueVwiLFwic3VzcGVjdFwiLFwiY2VsZWJyaXRpZXNcIixcIm1hY3JvXCIsXCJzZW5kZXJcIixcIm1hbmRhdG9yeVwiLFwiYm91bmRhcmllc1wiLFwiY3J1Y2lhbFwiLFwic3luZGljYXRpb25cIixcImd5bVwiLFwiY2VsZWJyYXRpb25cIixcImtkZVwiLFwiYWRqYWNlbnRcIixcImZpbHRlcmluZ1wiLFwidHVpdGlvblwiLFwic3BvdXNlXCIsXCJleG90aWNcIixcInZpZXdlclwiLFwic2lnbnVwXCIsXCJ0aHJlYXRzXCIsXCJsdXhlbWJvdXJnXCIsXCJwdXp6bGVzXCIsXCJyZWFjaGluZ1wiLFwidmJcIixcImRhbWFnZWRcIixcImNhbXNcIixcInJlY2VwdG9yXCIsXCJsYXVnaFwiLFwiam9lbFwiLFwic3VyZ2ljYWxcIixcImRlc3Ryb3lcIixcImNpdGF0aW9uXCIsXCJwaXRjaFwiLFwiYXV0b3NcIixcInlvXCIsXCJwcmVtaXNlc1wiLFwicGVycnlcIixcInByb3ZlZFwiLFwib2ZmZW5zaXZlXCIsXCJpbXBlcmlhbFwiLFwiZG96ZW5cIixcImJlbmphbWluXCIsXCJkZXBsb3ltZW50XCIsXCJ0ZWV0aFwiLFwiY2xvdGhcIixcInN0dWR5aW5nXCIsXCJjb2xsZWFndWVzXCIsXCJzdGFtcFwiLFwibG90dXNcIixcInNhbG1vblwiLFwib2x5bXB1c1wiLFwic2VwYXJhdGVkXCIsXCJwcm9jXCIsXCJjYXJnb1wiLFwidGFuXCIsXCJkaXJlY3RpdmVcIixcImZ4XCIsXCJzYWxlbVwiLFwibWF0ZVwiLFwiZGxcIixcInN0YXJ0ZXJcIixcInVwZ3JhZGVzXCIsXCJsaWtlc1wiLFwiYnV0dGVyXCIsXCJwZXBwZXJcIixcIndlYXBvblwiLFwibHVnZ2FnZVwiLFwiYnVyZGVuXCIsXCJjaGVmXCIsXCJ0YXBlc1wiLFwiem9uZXNcIixcInJhY2VzXCIsXCJpc2xlXCIsXCJzdHlsaXNoXCIsXCJzbGltXCIsXCJtYXBsZVwiLFwibHVrZVwiLFwiZ3JvY2VyeVwiLFwib2Zmc2hvcmVcIixcImdvdmVybmluZ1wiLFwicmV0YWlsZXJzXCIsXCJkZXBvdFwiLFwia2VubmV0aFwiLFwiY29tcFwiLFwiYWx0XCIsXCJwaWVcIixcImJsZW5kXCIsXCJoYXJyaXNvblwiLFwibHNcIixcImp1bGllXCIsXCJvY2Nhc2lvbmFsbHlcIixcImNic1wiLFwiYXR0ZW5kaW5nXCIsXCJlbWlzc2lvblwiLFwicGV0ZVwiLFwic3BlY1wiLFwiZmluZXN0XCIsXCJyZWFsdHlcIixcImphbmV0XCIsXCJib3dcIixcInBlbm5cIixcInJlY3J1aXRpbmdcIixcImFwcGFyZW50XCIsXCJpbnN0cnVjdGlvbmFsXCIsXCJwaHBiYlwiLFwiYXV0dW1uXCIsXCJ0cmF2ZWxpbmdcIixcInByb2JlXCIsXCJtaWRpXCIsXCJwZXJtaXNzaW9uc1wiLFwiYmlvdGVjaG5vbG9neVwiLFwidG9pbGV0XCIsXCJyYW5rZWRcIixcImphY2tldHNcIixcInJvdXRlc1wiLFwicGFja2VkXCIsXCJleGNpdGVkXCIsXCJvdXRyZWFjaFwiLFwiaGVsZW5cIixcIm1vdW50aW5nXCIsXCJyZWNvdmVyXCIsXCJ0aWVkXCIsXCJsb3BlelwiLFwiYmFsYW5jZWRcIixcInByZXNjcmliZWRcIixcImNhdGhlcmluZVwiLFwidGltZWx5XCIsXCJ0YWxrZWRcIixcInVwc2tpcnRzXCIsXCJkZWJ1Z1wiLFwiZGVsYXllZFwiLFwiY2h1Y2tcIixcInJlcHJvZHVjZWRcIixcImhvblwiLFwiZGFsZVwiLFwiZXhwbGljaXRcIixcImNhbGN1bGF0aW9uXCIsXCJ2aWxsYXNcIixcImVib29rXCIsXCJjb25zb2xpZGF0ZWRcIixcImV4Y2x1ZGVcIixcInBlZWluZ1wiLFwib2NjYXNpb25zXCIsXCJicm9va3NcIixcImVxdWF0aW9uc1wiLFwibmV3dG9uXCIsXCJvaWxzXCIsXCJzZXB0XCIsXCJleGNlcHRpb25hbFwiLFwiYW54aWV0eVwiLFwiYmluZ29cIixcIndoaWxzdFwiLFwic3BhdGlhbFwiLFwicmVzcG9uZGVudHNcIixcInVudG9cIixcImx0XCIsXCJjZXJhbWljXCIsXCJwcm9tcHRcIixcInByZWNpb3VzXCIsXCJtaW5kc1wiLFwiYW5udWFsbHlcIixcImNvbnNpZGVyYXRpb25zXCIsXCJzY2FubmVyc1wiLFwiYXRtXCIsXCJ4YW5heFwiLFwiZXFcIixcInBheXNcIixcImZpbmdlcnNcIixcInN1bm55XCIsXCJlYm9va3NcIixcImRlbGl2ZXJzXCIsXCJqZVwiLFwicXVlZW5zbGFuZFwiLFwibmVja2xhY2VcIixcIm11c2ljaWFuc1wiLFwibGVlZHNcIixcImNvbXBvc2l0ZVwiLFwidW5hdmFpbGFibGVcIixcImNlZGFyXCIsXCJhcnJhbmdlZFwiLFwibGFuZ1wiLFwidGhlYXRlcnNcIixcImFkdm9jYWN5XCIsXCJyYWxlaWdoXCIsXCJzdHVkXCIsXCJmb2xkXCIsXCJlc3NlbnRpYWxseVwiLFwiZGVzaWduaW5nXCIsXCJ0aHJlYWRlZFwiLFwidXZcIixcInF1YWxpZnlcIixcImJsYWlyXCIsXCJob3Blc1wiLFwiYXNzZXNzbWVudHNcIixcImNtc1wiLFwibWFzb25cIixcImRpYWdyYW1cIixcImJ1cm5zXCIsXCJwdW1wc1wiLFwiZm9vdHdlYXJcIixcInNnXCIsXCJ2aWNcIixcImJlaWppbmdcIixcInBlb3BsZXNcIixcInZpY3RvclwiLFwibWFyaW9cIixcInBvc1wiLFwiYXR0YWNoXCIsXCJsaWNlbnNlc1wiLFwidXRpbHNcIixcInJlbW92aW5nXCIsXCJhZHZpc2VkXCIsXCJicnVuc3dpY2tcIixcInNwaWRlclwiLFwicGh5c1wiLFwicmFuZ2VzXCIsXCJwYWlyc1wiLFwic2Vuc2l0aXZpdHlcIixcInRyYWlsc1wiLFwicHJlc2VydmF0aW9uXCIsXCJodWRzb25cIixcImlzb2xhdGVkXCIsXCJjYWxnYXJ5XCIsXCJpbnRlcmltXCIsXCJhc3Npc3RlZFwiLFwiZGl2aW5lXCIsXCJzdHJlYW1pbmdcIixcImFwcHJvdmVcIixcImNob3NlXCIsXCJjb21wb3VuZFwiLFwiaW50ZW5zaXR5XCIsXCJ0ZWNobm9sb2dpY2FsXCIsXCJzeW5kaWNhdGVcIixcImFib3J0aW9uXCIsXCJkaWFsb2dcIixcInZlbnVlc1wiLFwiYmxhc3RcIixcIndlbGxuZXNzXCIsXCJjYWxjaXVtXCIsXCJuZXdwb3J0XCIsXCJhbnRpdmlydXNcIixcImFkZHJlc3NpbmdcIixcInBvbGVcIixcImRpc2NvdW50ZWRcIixcImluZGlhbnNcIixcInNoaWVsZFwiLFwiaGFydmVzdFwiLFwibWVtYnJhbmVcIixcInByYWd1ZVwiLFwicHJldmlld3NcIixcImJhbmdsYWRlc2hcIixcImNvbnN0aXR1dGVcIixcImxvY2FsbHlcIixcImNvbmNsdWRlZFwiLFwicGlja3VwXCIsXCJkZXNwZXJhdGVcIixcIm1vdGhlcnNcIixcIm5hc2NhclwiLFwiaWNlbGFuZFwiLFwiZGVtb25zdHJhdGlvblwiLFwiZ292ZXJubWVudGFsXCIsXCJtYW51ZmFjdHVyZWRcIixcImNhbmRsZXNcIixcImdyYWR1YXRpb25cIixcIm1lZ2FcIixcImJlbmRcIixcInNhaWxpbmdcIixcInZhcmlhdGlvbnNcIixcIm1vbXNcIixcInNhY3JlZFwiLFwiYWRkaWN0aW9uXCIsXCJtb3JvY2NvXCIsXCJjaHJvbWVcIixcInRvbW15XCIsXCJzcHJpbmdmaWVsZFwiLFwicmVmdXNlZFwiLFwiYnJha2VcIixcImV4dGVyaW9yXCIsXCJncmVldGluZ1wiLFwiZWNvbG9neVwiLFwib2xpdmVyXCIsXCJjb25nb1wiLFwiZ2xlblwiLFwiYm90c3dhbmFcIixcIm5hdlwiLFwiZGVsYXlzXCIsXCJzeW50aGVzaXNcIixcIm9saXZlXCIsXCJ1bmRlZmluZWRcIixcInVuZW1wbG95bWVudFwiLFwiY3liZXJcIixcInZlcml6b25cIixcInNjb3JlZFwiLFwiZW5oYW5jZW1lbnRcIixcIm5ld2Nhc3RsZVwiLFwiY2xvbmVcIixcImRpY2tzXCIsXCJ2ZWxvY2l0eVwiLFwibGFtYmRhXCIsXCJyZWxheVwiLFwiY29tcG9zZWRcIixcInRlYXJzXCIsXCJwZXJmb3JtYW5jZXNcIixcIm9hc2lzXCIsXCJiYXNlbGluZVwiLFwiY2FiXCIsXCJhbmdyeVwiLFwiZmFcIixcInNvY2lldGllc1wiLFwic2lsaWNvblwiLFwiYnJhemlsaWFuXCIsXCJpZGVudGljYWxcIixcInBldHJvbGV1bVwiLFwiY29tcGV0ZVwiLFwiaXN0XCIsXCJub3J3ZWdpYW5cIixcImxvdmVyXCIsXCJiZWxvbmdcIixcImhvbm9sdWx1XCIsXCJiZWF0bGVzXCIsXCJsaXBzXCIsXCJyZXRlbnRpb25cIixcImV4Y2hhbmdlc1wiLFwicG9uZFwiLFwicm9sbHNcIixcInRob21zb25cIixcImJhcm5lc1wiLFwic291bmR0cmFja1wiLFwid29uZGVyaW5nXCIsXCJtYWx0YVwiLFwiZGFkZHlcIixcImxjXCIsXCJmZXJyeVwiLFwicmFiYml0XCIsXCJwcm9mZXNzaW9uXCIsXCJzZWF0aW5nXCIsXCJkYW1cIixcImNublwiLFwic2VwYXJhdGVseVwiLFwicGh5c2lvbG9neVwiLFwibGlsXCIsXCJjb2xsZWN0aW5nXCIsXCJkYXNcIixcImV4cG9ydHNcIixcIm9tYWhhXCIsXCJ0aXJlXCIsXCJwYXJ0aWNpcGFudFwiLFwic2Nob2xhcnNoaXBzXCIsXCJyZWNyZWF0aW9uYWxcIixcImRvbWluaWNhblwiLFwiY2hhZFwiLFwiZWxlY3Ryb25cIixcImxvYWRzXCIsXCJmcmllbmRzaGlwXCIsXCJoZWF0aGVyXCIsXCJwYXNzcG9ydFwiLFwibW90ZWxcIixcInVuaW9uc1wiLFwidHJlYXN1cnlcIixcIndhcnJhbnRcIixcInN5c1wiLFwic29sYXJpc1wiLFwiZnJvemVuXCIsXCJvY2N1cGllZFwiLFwiam9zaFwiLFwicm95YWx0eVwiLFwic2NhbGVzXCIsXCJyYWxseVwiLFwib2JzZXJ2ZXJcIixcInN1bnNoaW5lXCIsXCJzdHJhaW5cIixcImRyYWdcIixcImNlcmVtb255XCIsXCJzb21laG93XCIsXCJhcnJlc3RlZFwiLFwiZXhwYW5kaW5nXCIsXCJwcm92aW5jaWFsXCIsXCJpbnZlc3RpZ2F0aW9uc1wiLFwiaWNxXCIsXCJyaXBlXCIsXCJ5YW1haGFcIixcInJlbHlcIixcIm1lZGljYXRpb25zXCIsXCJoZWJyZXdcIixcImdhaW5lZFwiLFwicm9jaGVzdGVyXCIsXCJkeWluZ1wiLFwibGF1bmRyeVwiLFwic3R1Y2tcIixcInNvbG9tb25cIixcInBsYWNpbmdcIixcInN0b3BzXCIsXCJob21ld29ya1wiLFwiYWRqdXN0XCIsXCJhc3Nlc3NlZFwiLFwiYWR2ZXJ0aXNlclwiLFwiZW5hYmxpbmdcIixcImVuY3J5cHRpb25cIixcImZpbGxpbmdcIixcImRvd25sb2FkYWJsZVwiLFwic29waGlzdGljYXRlZFwiLFwiaW1wb3NlZFwiLFwic2lsZW5jZVwiLFwic2NzaVwiLFwiZm9jdXNlc1wiLFwic292aWV0XCIsXCJwb3NzZXNzaW9uXCIsXCJjdVwiLFwibGFib3JhdG9yaWVzXCIsXCJ0cmVhdHlcIixcInZvY2FsXCIsXCJ0cmFpbmVyXCIsXCJvcmdhblwiLFwic3Ryb25nZXJcIixcInZvbHVtZXNcIixcImFkdmFuY2VzXCIsXCJ2ZWdldGFibGVzXCIsXCJsZW1vblwiLFwidG94aWNcIixcImRuc1wiLFwidGh1bWJuYWlsc1wiLFwiZGFya25lc3NcIixcInB0eVwiLFwid3NcIixcIm51dHNcIixcIm5haWxcIixcImJpenJhdGVcIixcInZpZW5uYVwiLFwiaW1wbGllZFwiLFwic3BhblwiLFwic3RhbmZvcmRcIixcInNveFwiLFwic3RvY2tpbmdzXCIsXCJqb2tlXCIsXCJyZXNwb25kZW50XCIsXCJwYWNraW5nXCIsXCJzdGF0dXRlXCIsXCJyZWplY3RlZFwiLFwic2F0aXNmeVwiLFwiZGVzdHJveWVkXCIsXCJzaGVsdGVyXCIsXCJjaGFwZWxcIixcImdhbWVzcG90XCIsXCJtYW51ZmFjdHVyZVwiLFwibGF5ZXJzXCIsXCJ3b3JkcHJlc3NcIixcImd1aWRlZFwiLFwidnVsbmVyYWJpbGl0eVwiLFwiYWNjb3VudGFiaWxpdHlcIixcImNlbGVicmF0ZVwiLFwiYWNjcmVkaXRlZFwiLFwiYXBwbGlhbmNlXCIsXCJjb21wcmVzc2VkXCIsXCJiYWhhbWFzXCIsXCJwb3dlbGxcIixcIm1peHR1cmVcIixcImJlbmNoXCIsXCJ1bml2XCIsXCJ0dWJcIixcInJpZGVyXCIsXCJzY2hlZHVsaW5nXCIsXCJyYWRpdXNcIixcInBlcnNwZWN0aXZlc1wiLFwibW9ydGFsaXR5XCIsXCJsb2dnaW5nXCIsXCJoYW1wdG9uXCIsXCJjaHJpc3RpYW5zXCIsXCJib3JkZXJzXCIsXCJ0aGVyYXBldXRpY1wiLFwicGFkc1wiLFwiYnV0dHNcIixcImlubnNcIixcImJvYmJ5XCIsXCJpbXByZXNzaXZlXCIsXCJzaGVlcFwiLFwiYWNjb3JkaW5nbHlcIixcImFyY2hpdGVjdFwiLFwicmFpbHJvYWRcIixcImxlY3R1cmVzXCIsXCJjaGFsbGVuZ2luZ1wiLFwid2luZXNcIixcIm51cnNlcnlcIixcImhhcmRlclwiLFwiY3Vwc1wiLFwiYXNoXCIsXCJtaWNyb3dhdmVcIixcImNoZWFwZXN0XCIsXCJhY2NpZGVudHNcIixcInRyYXZlc3RpXCIsXCJyZWxvY2F0aW9uXCIsXCJzdHVhcnRcIixcImNvbnRyaWJ1dG9yc1wiLFwic2FsdmFkb3JcIixcImFsaVwiLFwic2FsYWRcIixcIm5wXCIsXCJtb25yb2VcIixcInRlbmRlclwiLFwidmlvbGF0aW9uc1wiLFwiZm9hbVwiLFwidGVtcGVyYXR1cmVzXCIsXCJwYXN0ZVwiLFwiY2xvdWRzXCIsXCJjb21wZXRpdGlvbnNcIixcImRpc2NyZXRpb25cIixcInRmdFwiLFwidGFuemFuaWFcIixcInByZXNlcnZlXCIsXCJqdmNcIixcInBvZW1cIixcInVuc2lnbmVkXCIsXCJzdGF5aW5nXCIsXCJjb3NtZXRpY3NcIixcImVhc3RlclwiLFwidGhlb3JpZXNcIixcInJlcG9zaXRvcnlcIixcInByYWlzZVwiLFwiamVyZW15XCIsXCJ2ZW5pY2VcIixcImpvXCIsXCJjb25jZW50cmF0aW9uc1wiLFwidmlicmF0b3JzXCIsXCJlc3RvbmlhXCIsXCJjaHJpc3RpYW5pdHlcIixcInZldGVyYW5cIixcInN0cmVhbXNcIixcImxhbmRpbmdcIixcInNpZ25pbmdcIixcImV4ZWN1dGVkXCIsXCJrYXRpZVwiLFwibmVnb3RpYXRpb25zXCIsXCJyZWFsaXN0aWNcIixcImR0XCIsXCJjZ2lcIixcInNob3djYXNlXCIsXCJpbnRlZ3JhbFwiLFwiYXNrc1wiLFwicmVsYXhcIixcIm5hbWliaWFcIixcImdlbmVyYXRpbmdcIixcImNocmlzdGluYVwiLFwiY29uZ3Jlc3Npb25hbFwiLFwic3lub3BzaXNcIixcImhhcmRseVwiLFwicHJhaXJpZVwiLFwicmV1bmlvblwiLFwiY29tcG9zZXJcIixcImJlYW5cIixcInN3b3JkXCIsXCJhYnNlbnRcIixcInBob3RvZ3JhcGhpY1wiLFwic2VsbHNcIixcImVjdWFkb3JcIixcImhvcGluZ1wiLFwiYWNjZXNzZWRcIixcInNwaXJpdHNcIixcIm1vZGlmaWNhdGlvbnNcIixcImNvcmFsXCIsXCJwaXhlbFwiLFwiZmxvYXRcIixcImNvbGluXCIsXCJiaWFzXCIsXCJpbXBvcnRlZFwiLFwicGF0aHNcIixcImJ1YmJsZVwiLFwicG9yXCIsXCJhY3F1aXJlXCIsXCJjb250cmFyeVwiLFwibWlsbGVubml1bVwiLFwidHJpYnVuZVwiLFwidmVzc2VsXCIsXCJhY2lkc1wiLFwiZm9jdXNpbmdcIixcInZpcnVzZXNcIixcImNoZWFwZXJcIixcImFkbWl0dGVkXCIsXCJkYWlyeVwiLFwiYWRtaXRcIixcIm1lbVwiLFwiZmFuY3lcIixcImVxdWFsaXR5XCIsXCJzYW1vYVwiLFwiZ2NcIixcImFjaGlldmluZ1wiLFwidGFwXCIsXCJzdGlja2Vyc1wiLFwiZmlzaGVyaWVzXCIsXCJleGNlcHRpb25zXCIsXCJyZWFjdGlvbnNcIixcImxlYXNpbmdcIixcImxhdXJlblwiLFwiYmVsaWVmc1wiLFwiY2lcIixcIm1hY3JvbWVkaWFcIixcImNvbXBhbmlvblwiLFwic3F1YWRcIixcImFuYWx5emVcIixcImFzaGxleVwiLFwic2Nyb2xsXCIsXCJyZWxhdGVcIixcImRpdmlzaW9uc1wiLFwic3dpbVwiLFwid2FnZXNcIixcImFkZGl0aW9uYWxseVwiLFwic3VmZmVyXCIsXCJmb3Jlc3RzXCIsXCJmZWxsb3dzaGlwXCIsXCJuYW5vXCIsXCJpbnZhbGlkXCIsXCJjb25jZXJ0c1wiLFwibWFydGlhbFwiLFwibWFsZXNcIixcInZpY3RvcmlhblwiLFwicmV0YWluXCIsXCJjb2xvdXJzXCIsXCJleGVjdXRlXCIsXCJ0dW5uZWxcIixcImdlbnJlc1wiLFwiY2FtYm9kaWFcIixcInBhdGVudHNcIixcImNvcHlyaWdodHNcIixcInluXCIsXCJjaGFvc1wiLFwibGl0aHVhbmlhXCIsXCJtYXN0ZXJjYXJkXCIsXCJ3aGVhdFwiLFwiY2hyb25pY2xlc1wiLFwib2J0YWluaW5nXCIsXCJiZWF2ZXJcIixcInVwZGF0aW5nXCIsXCJkaXN0cmlidXRlXCIsXCJyZWFkaW5nc1wiLFwiZGVjb3JhdGl2ZVwiLFwia2lqaWppXCIsXCJjb25mdXNlZFwiLFwiY29tcGlsZXJcIixcImVubGFyZ2VtZW50XCIsXCJlYWdsZXNcIixcImJhc2VzXCIsXCJ2aWlcIixcImFjY3VzZWRcIixcImJlZVwiLFwiY2FtcGFpZ25zXCIsXCJ1bml0eVwiLFwibG91ZFwiLFwiY29uanVuY3Rpb25cIixcImJyaWRlXCIsXCJyYXRzXCIsXCJkZWZpbmVzXCIsXCJhaXJwb3J0c1wiLFwiaW5zdGFuY2VzXCIsXCJpbmRpZ2Vub3VzXCIsXCJiZWd1blwiLFwiY2ZyXCIsXCJicnVuZXR0ZVwiLFwicGFja2V0c1wiLFwiYW5jaG9yXCIsXCJzb2Nrc1wiLFwidmFsaWRhdGlvblwiLFwicGFyYWRlXCIsXCJjb3JydXB0aW9uXCIsXCJzdGF0XCIsXCJ0cmlnZ2VyXCIsXCJpbmNlbnRpdmVzXCIsXCJjaG9sZXN0ZXJvbFwiLFwiZ2F0aGVyZWRcIixcImVzc2V4XCIsXCJzbG92ZW5pYVwiLFwibm90aWZpZWRcIixcImRpZmZlcmVudGlhbFwiLFwiYmVhY2hlc1wiLFwiZm9sZGVyc1wiLFwiZHJhbWF0aWNcIixcInN1cmZhY2VzXCIsXCJ0ZXJyaWJsZVwiLFwicm91dGVyc1wiLFwiY3J1elwiLFwicGVuZGFudFwiLFwiZHJlc3Nlc1wiLFwiYmFwdGlzdFwiLFwic2NpZW50aXN0XCIsXCJzdGFyc21lcmNoYW50XCIsXCJoaXJpbmdcIixcImNsb2Nrc1wiLFwiYXJ0aHJpdGlzXCIsXCJiaW9zXCIsXCJmZW1hbGVzXCIsXCJ3YWxsYWNlXCIsXCJuZXZlcnRoZWxlc3NcIixcInJlZmxlY3RzXCIsXCJ0YXhhdGlvblwiLFwiZmV2ZXJcIixcInBtY1wiLFwiY3Vpc2luZVwiLFwic3VyZWx5XCIsXCJwcmFjdGl0aW9uZXJzXCIsXCJ0cmFuc2NyaXB0XCIsXCJteXNwYWNlXCIsXCJ0aGVvcmVtXCIsXCJpbmZsYXRpb25cIixcInRoZWVcIixcIm5iXCIsXCJydXRoXCIsXCJwcmF5XCIsXCJzdHlsdXNcIixcImNvbXBvdW5kc1wiLFwicG9wZVwiLFwiZHJ1bXNcIixcImNvbnRyYWN0aW5nXCIsXCJhcm5vbGRcIixcInN0cnVjdHVyZWRcIixcInJlYXNvbmFibHlcIixcImplZXBcIixcImNoaWNrc1wiLFwiYmFyZVwiLFwiaHVuZ1wiLFwiY2F0dGxlXCIsXCJtYmFcIixcInJhZGljYWxcIixcImdyYWR1YXRlc1wiLFwicm92ZXJcIixcInJlY29tbWVuZHNcIixcImNvbnRyb2xsaW5nXCIsXCJ0cmVhc3VyZVwiLFwicmVsb2FkXCIsXCJkaXN0cmlidXRvcnNcIixcImZsYW1lXCIsXCJsZXZpdHJhXCIsXCJ0YW5rc1wiLFwiYXNzdW1pbmdcIixcIm1vbmV0YXJ5XCIsXCJlbGRlcmx5XCIsXCJwaXRcIixcImFybGluZ3RvblwiLFwibW9ub1wiLFwicGFydGljbGVzXCIsXCJmbG9hdGluZ1wiLFwiZXh0cmFvcmRpbmFyeVwiLFwidGlsZVwiLFwiaW5kaWNhdGluZ1wiLFwiYm9saXZpYVwiLFwic3BlbGxcIixcImhvdHRlc3RcIixcInN0ZXZlbnNcIixcImNvb3JkaW5hdGVcIixcImt1d2FpdFwiLFwiZXhjbHVzaXZlbHlcIixcImVtaWx5XCIsXCJhbGxlZ2VkXCIsXCJsaW1pdGF0aW9uXCIsXCJ3aWRlc2NyZWVuXCIsXCJjb21waWxlXCIsXCJzcXVpcnRpbmdcIixcIndlYnN0ZXJcIixcInN0cnVja1wiLFwicnhcIixcImlsbHVzdHJhdGlvblwiLFwicGx5bW91dGhcIixcIndhcm5pbmdzXCIsXCJjb25zdHJ1Y3RcIixcImFwcHNcIixcImlucXVpcmllc1wiLFwiYnJpZGFsXCIsXCJhbm5leFwiLFwibWFnXCIsXCJnc21cIixcImluc3BpcmF0aW9uXCIsXCJ0cmliYWxcIixcImN1cmlvdXNcIixcImFmZmVjdGluZ1wiLFwiZnJlaWdodFwiLFwicmViYXRlXCIsXCJtZWV0dXBcIixcImVjbGlwc2VcIixcInN1ZGFuXCIsXCJkZHJcIixcImRvd25sb2FkaW5nXCIsXCJyZWNcIixcInNodXR0bGVcIixcImFnZ3JlZ2F0ZVwiLFwic3R1bm5pbmdcIixcImN5Y2xlc1wiLFwiYWZmZWN0c1wiLFwiZm9yZWNhc3RzXCIsXCJkZXRlY3RcIixcImFjdGl2ZWx5XCIsXCJjaWFvXCIsXCJhbXBsYW5kXCIsXCJrbmVlXCIsXCJwcmVwXCIsXCJwYlwiLFwiY29tcGxpY2F0ZWRcIixcImNoZW1cIixcImZhc3Rlc3RcIixcImJ1dGxlclwiLFwic2hvcHppbGxhXCIsXCJpbmp1cmVkXCIsXCJkZWNvcmF0aW5nXCIsXCJwYXlyb2xsXCIsXCJjb29rYm9va1wiLFwiZXhwcmVzc2lvbnNcIixcInRvblwiLFwiY291cmllclwiLFwidXBsb2FkZWRcIixcInNoYWtlc3BlYXJlXCIsXCJoaW50c1wiLFwiY29sbGFwc2VcIixcImFtZXJpY2FzXCIsXCJjb25uZWN0b3JzXCIsXCJ0d2lua3NcIixcInVubGlrZWx5XCIsXCJvZVwiLFwiZ2lmXCIsXCJwcm9zXCIsXCJjb25mbGljdHNcIixcInRlY2hub1wiLFwiYmV2ZXJhZ2VcIixcInRyaWJ1dGVcIixcIndpcmVkXCIsXCJlbHZpc1wiLFwiaW1tdW5lXCIsXCJsYXR2aWFcIixcInRyYXZlbGVyc1wiLFwiZm9yZXN0cnlcIixcImJhcnJpZXJzXCIsXCJjYW50XCIsXCJqZFwiLFwicmFyZWx5XCIsXCJncGxcIixcImluZmVjdGVkXCIsXCJvZmZlcmluZ3NcIixcIm1hcnRoYVwiLFwiZ2VuZXNpc1wiLFwiYmFycmllclwiLFwiYXJndWVcIixcImluY29ycmVjdFwiLFwidHJhaW5zXCIsXCJtZXRhbHNcIixcImJpY3ljbGVcIixcImZ1cm5pc2hpbmdzXCIsXCJsZXR0aW5nXCIsXCJhcmlzZVwiLFwiZ3VhdGVtYWxhXCIsXCJjZWx0aWNcIixcInRoZXJlYnlcIixcImlyY1wiLFwiamFtaWVcIixcInBhcnRpY2xlXCIsXCJwZXJjZXB0aW9uXCIsXCJtaW5lcmFsc1wiLFwiYWR2aXNlXCIsXCJodW1pZGl0eVwiLFwiYm90dGxlc1wiLFwiYm94aW5nXCIsXCJ3eVwiLFwiZG1cIixcImJhbmdrb2tcIixcInJlbmFpc3NhbmNlXCIsXCJwYXRob2xvZ3lcIixcInNhcmFcIixcImJyYVwiLFwib3JkaW5hbmNlXCIsXCJodWdoZXNcIixcInBob3RvZ3JhcGhlcnNcIixcImluZmVjdGlvbnNcIixcImplZmZyZXlcIixcImNoZXNzXCIsXCJvcGVyYXRlc1wiLFwiYnJpc2JhbmVcIixcImNvbmZpZ3VyZWRcIixcInN1cnZpdmVcIixcIm9zY2FyXCIsXCJmZXN0aXZhbHNcIixcIm1lbnVzXCIsXCJqb2FuXCIsXCJwb3NzaWJpbGl0aWVzXCIsXCJkdWNrXCIsXCJyZXZlYWxcIixcImNhbmFsXCIsXCJhbWlub1wiLFwicGhpXCIsXCJjb250cmlidXRpbmdcIixcImhlcmJzXCIsXCJjbGluaWNzXCIsXCJtbHNcIixcImNvd1wiLFwibWFuaXRvYmFcIixcImFuYWx5dGljYWxcIixcIm1pc3Npb25zXCIsXCJ3YXRzb25cIixcImx5aW5nXCIsXCJjb3N0dW1lc1wiLFwic3RyaWN0XCIsXCJkaXZlXCIsXCJzYWRkYW1cIixcImNpcmN1bGF0aW9uXCIsXCJkcmlsbFwiLFwib2ZmZW5zZVwiLFwiYnJ5YW5cIixcImNldFwiLFwicHJvdGVzdFwiLFwiYXNzdW1wdGlvblwiLFwiamVydXNhbGVtXCIsXCJob2JieVwiLFwidHJpZXNcIixcInRyYW5zZXh1YWxlc1wiLFwiaW52ZW50aW9uXCIsXCJuaWNrbmFtZVwiLFwiZmlqaVwiLFwidGVjaG5pY2lhblwiLFwiaW5saW5lXCIsXCJleGVjdXRpdmVzXCIsXCJlbnF1aXJpZXNcIixcIndhc2hpbmdcIixcImF1ZGlcIixcInN0YWZmaW5nXCIsXCJjb2duaXRpdmVcIixcImV4cGxvcmluZ1wiLFwidHJpY2tcIixcImVucXVpcnlcIixcImNsb3N1cmVcIixcInJhaWRcIixcInBwY1wiLFwidGltYmVyXCIsXCJ2b2x0XCIsXCJpbnRlbnNlXCIsXCJkaXZcIixcInBsYXlsaXN0XCIsXCJyZWdpc3RyYXJcIixcInNob3dlcnNcIixcInN1cHBvcnRlcnNcIixcInJ1bGluZ1wiLFwic3RlYWR5XCIsXCJkaXJ0XCIsXCJzdGF0dXRlc1wiLFwid2l0aGRyYXdhbFwiLFwibXllcnNcIixcImRyb3BzXCIsXCJwcmVkaWN0ZWRcIixcIndpZGVyXCIsXCJzYXNrYXRjaGV3YW5cIixcImpjXCIsXCJjYW5jZWxsYXRpb25cIixcInBsdWdpbnNcIixcImVucm9sbGVkXCIsXCJzZW5zb3JzXCIsXCJzY3Jld1wiLFwibWluaXN0ZXJzXCIsXCJwdWJsaWNseVwiLFwiaG91cmx5XCIsXCJibGFtZVwiLFwiZ2VuZXZhXCIsXCJmcmVlYnNkXCIsXCJ2ZXRlcmluYXJ5XCIsXCJhY2VyXCIsXCJwcm9zdG9yZXNcIixcInJlc2VsbGVyXCIsXCJkaXN0XCIsXCJoYW5kZWRcIixcInN1ZmZlcmVkXCIsXCJpbnRha2VcIixcImluZm9ybWFsXCIsXCJyZWxldmFuY2VcIixcImluY2VudGl2ZVwiLFwiYnV0dGVyZmx5XCIsXCJ0dWNzb25cIixcIm1lY2hhbmljc1wiLFwiaGVhdmlseVwiLFwic3dpbmdlcnNcIixcImZpZnR5XCIsXCJoZWFkZXJzXCIsXCJtaXN0YWtlc1wiLFwibnVtZXJpY2FsXCIsXCJvbnNcIixcImdlZWtcIixcInVuY2xlXCIsXCJkZWZpbmluZ1wiLFwieG54eFwiLFwiY291bnRpbmdcIixcInJlZmxlY3Rpb25cIixcInNpbmtcIixcImFjY29tcGFuaWVkXCIsXCJhc3N1cmVcIixcImludml0YXRpb25cIixcImRldm90ZWRcIixcInByaW5jZXRvblwiLFwiamFjb2JcIixcInNvZGl1bVwiLFwicmFuZHlcIixcInNwaXJpdHVhbGl0eVwiLFwiaG9ybW9uZVwiLFwibWVhbndoaWxlXCIsXCJwcm9wcmlldGFyeVwiLFwidGltb3RoeVwiLFwiY2hpbGRyZW5zXCIsXCJicmlja1wiLFwiZ3JpcFwiLFwibmF2YWxcIixcInRodW1iemlsbGFcIixcIm1lZGlldmFsXCIsXCJwb3JjZWxhaW5cIixcImF2aVwiLFwiYnJpZGdlc1wiLFwicGljaHVudGVyXCIsXCJjYXB0dXJlZFwiLFwid2F0dFwiLFwidGhlaHVuXCIsXCJkZWNlbnRcIixcImNhc3RpbmdcIixcImRheXRvblwiLFwidHJhbnNsYXRlZFwiLFwic2hvcnRseVwiLFwiY2FtZXJvblwiLFwiY29sdW1uaXN0c1wiLFwicGluc1wiLFwiY2FybG9zXCIsXCJyZW5vXCIsXCJkb25uYVwiLFwiYW5kcmVhc1wiLFwid2FycmlvclwiLFwiZGlwbG9tYVwiLFwiY2FiaW5cIixcImlubm9jZW50XCIsXCJzY2FubmluZ1wiLFwiaWRlXCIsXCJjb25zZW5zdXNcIixcInBvbG9cIixcInZhbGl1bVwiLFwiY29weWluZ1wiLFwicnBnXCIsXCJkZWxpdmVyaW5nXCIsXCJjb3JkbGVzc1wiLFwicGF0cmljaWFcIixcImhvcm5cIixcImVkZGllXCIsXCJ1Z2FuZGFcIixcImZpcmVkXCIsXCJqb3VybmFsaXNtXCIsXCJwZFwiLFwicHJvdFwiLFwidHJpdmlhXCIsXCJhZGlkYXNcIixcInBlcnRoXCIsXCJmcm9nXCIsXCJncmFtbWFyXCIsXCJpbnRlbnRpb25cIixcInN5cmlhXCIsXCJkaXNhZ3JlZVwiLFwia2xlaW5cIixcImhhcnZleVwiLFwidGlyZXNcIixcImxvZ3NcIixcInVuZGVydGFrZW5cIixcInRncFwiLFwiaGF6YXJkXCIsXCJyZXRyb1wiLFwibGVvXCIsXCJsaXZlc2V4XCIsXCJzdGF0ZXdpZGVcIixcInNlbWljb25kdWN0b3JcIixcImdyZWdvcnlcIixcImVwaXNvZGVzXCIsXCJib29sZWFuXCIsXCJjaXJjdWxhclwiLFwiYW5nZXJcIixcImRpeVwiLFwibWFpbmxhbmRcIixcImlsbHVzdHJhdGlvbnNcIixcInN1aXRzXCIsXCJjaGFuY2VzXCIsXCJpbnRlcmFjdFwiLFwic25hcFwiLFwiaGFwcGluZXNzXCIsXCJhcmdcIixcInN1YnN0YW50aWFsbHlcIixcImJpemFycmVcIixcImdsZW5uXCIsXCJ1clwiLFwiYXVja2xhbmRcIixcIm9seW1waWNzXCIsXCJmcnVpdHNcIixcImlkZW50aWZpZXJcIixcImdlb1wiLFwid29ybGRzZXhcIixcInJpYmJvblwiLFwiY2FsY3VsYXRpb25zXCIsXCJkb2VcIixcImpwZWdcIixcImNvbmR1Y3RpbmdcIixcInN0YXJ0dXBcIixcInN1enVraVwiLFwidHJpbmlkYWRcIixcImF0aVwiLFwia2lzc2luZ1wiLFwid2FsXCIsXCJoYW5keVwiLFwic3dhcFwiLFwiZXhlbXB0XCIsXCJjcm9wc1wiLFwicmVkdWNlc1wiLFwiYWNjb21wbGlzaGVkXCIsXCJjYWxjdWxhdG9yc1wiLFwiZ2VvbWV0cnlcIixcImltcHJlc3Npb25cIixcImFic1wiLFwic2xvdmFraWFcIixcImZsaXBcIixcImd1aWxkXCIsXCJjb3JyZWxhdGlvblwiLFwiZ29yZ2VvdXNcIixcImNhcGl0b2xcIixcInNpbVwiLFwiZGlzaGVzXCIsXCJybmFcIixcImJhcmJhZG9zXCIsXCJjaHJ5c2xlclwiLFwibmVydm91c1wiLFwicmVmdXNlXCIsXCJleHRlbmRzXCIsXCJmcmFncmFuY2VcIixcIm1jZG9uYWxkXCIsXCJyZXBsaWNhXCIsXCJwbHVtYmluZ1wiLFwiYnJ1c3NlbHNcIixcInRyaWJlXCIsXCJuZWlnaGJvcnNcIixcInRyYWRlc1wiLFwic3VwZXJiXCIsXCJidXp6XCIsXCJ0cmFuc3BhcmVudFwiLFwibnVrZVwiLFwicmlkXCIsXCJ0cmluaXR5XCIsXCJjaGFybGVzdG9uXCIsXCJoYW5kbGVkXCIsXCJsZWdlbmRzXCIsXCJib29tXCIsXCJjYWxtXCIsXCJjaGFtcGlvbnNcIixcImZsb29yc1wiLFwic2VsZWN0aW9uc1wiLFwicHJvamVjdG9yc1wiLFwiaW5hcHByb3ByaWF0ZVwiLFwiZXhoYXVzdFwiLFwiY29tcGFyaW5nXCIsXCJzaGFuZ2hhaVwiLFwic3BlYWtzXCIsXCJidXJ0b25cIixcInZvY2F0aW9uYWxcIixcImRhdmlkc29uXCIsXCJjb3BpZWRcIixcInNjb3RpYVwiLFwiZmFybWluZ1wiLFwiZ2lic29uXCIsXCJwaGFybWFjaWVzXCIsXCJmb3JrXCIsXCJ0cm95XCIsXCJsblwiLFwicm9sbGVyXCIsXCJpbnRyb2R1Y2luZ1wiLFwiYmF0Y2hcIixcIm9yZ2FuaXplXCIsXCJhcHByZWNpYXRlZFwiLFwiYWx0ZXJcIixcIm5pY29sZVwiLFwibGF0aW5vXCIsXCJnaGFuYVwiLFwiZWRnZXNcIixcInVjXCIsXCJtaXhpbmdcIixcImhhbmRsZXNcIixcInNraWxsZWRcIixcImZpdHRlZFwiLFwiYWxidXF1ZXJxdWVcIixcImhhcm1vbnlcIixcImRpc3Rpbmd1aXNoZWRcIixcImFzdGhtYVwiLFwicHJvamVjdGVkXCIsXCJhc3N1bXB0aW9uc1wiLFwic2hhcmVob2xkZXJzXCIsXCJ0d2luc1wiLFwiZGV2ZWxvcG1lbnRhbFwiLFwicmlwXCIsXCJ6b3BlXCIsXCJyZWd1bGF0ZWRcIixcInRyaWFuZ2xlXCIsXCJhbWVuZFwiLFwiYW50aWNpcGF0ZWRcIixcIm9yaWVudGFsXCIsXCJyZXdhcmRcIixcIndpbmRzb3JcIixcInphbWJpYVwiLFwiY29tcGxldGluZ1wiLFwiZ21iaFwiLFwiYnVmXCIsXCJsZFwiLFwiaHlkcm9nZW5cIixcIndlYnNob3RzXCIsXCJzcHJpbnRcIixcImNvbXBhcmFibGVcIixcImNoaWNrXCIsXCJhZHZvY2F0ZVwiLFwic2ltc1wiLFwiY29uZnVzaW9uXCIsXCJjb3B5cmlnaHRlZFwiLFwidHJheVwiLFwiaW5wdXRzXCIsXCJ3YXJyYW50aWVzXCIsXCJnZW5vbWVcIixcImVzY29ydHNcIixcImRvY3VtZW50ZWRcIixcInRob25nXCIsXCJtZWRhbFwiLFwicGFwZXJiYWNrc1wiLFwiY29hY2hlc1wiLFwidmVzc2Vsc1wiLFwiaGFyYm91clwiLFwid2Fsa3NcIixcInNvbFwiLFwia2V5Ym9hcmRzXCIsXCJzYWdlXCIsXCJrbml2ZXNcIixcImVjb1wiLFwidnVsbmVyYWJsZVwiLFwiYXJyYW5nZVwiLFwiYXJ0aXN0aWNcIixcImJhdFwiLFwiaG9ub3JzXCIsXCJib290aFwiLFwiaW5kaWVcIixcInJlZmxlY3RlZFwiLFwidW5pZmllZFwiLFwiYm9uZXNcIixcImJyZWVkXCIsXCJkZXRlY3RvclwiLFwiaWdub3JlZFwiLFwicG9sYXJcIixcImZhbGxlblwiLFwicHJlY2lzZVwiLFwic3Vzc2V4XCIsXCJyZXNwaXJhdG9yeVwiLFwibm90aWZpY2F0aW9uc1wiLFwibXNnaWRcIixcInRyYW5zZXh1YWxcIixcIm1haW5zdHJlYW1cIixcImludm9pY2VcIixcImV2YWx1YXRpbmdcIixcImxpcFwiLFwic3ViY29tbWl0dGVlXCIsXCJzYXBcIixcImdhdGhlclwiLFwic3VzZVwiLFwibWF0ZXJuaXR5XCIsXCJiYWNrZWRcIixcImFsZnJlZFwiLFwiY29sb25pYWxcIixcIm1mXCIsXCJjYXJleVwiLFwibW90ZWxzXCIsXCJmb3JtaW5nXCIsXCJlbWJhc3N5XCIsXCJjYXZlXCIsXCJqb3VybmFsaXN0c1wiLFwiZGFubnlcIixcInJlYmVjY2FcIixcInNsaWdodFwiLFwicHJvY2VlZHNcIixcImluZGlyZWN0XCIsXCJhbW9uZ3N0XCIsXCJ3b29sXCIsXCJmb3VuZGF0aW9uc1wiLFwibXNnc3RyXCIsXCJhcnJlc3RcIixcInZvbGxleWJhbGxcIixcIm13XCIsXCJhZGlwZXhcIixcImhvcml6b25cIixcIm51XCIsXCJkZWVwbHlcIixcInRvb2xib3hcIixcImljdFwiLFwibWFyaW5hXCIsXCJsaWFiaWxpdGllc1wiLFwicHJpemVzXCIsXCJib3NuaWFcIixcImJyb3dzZXJzXCIsXCJkZWNyZWFzZWRcIixcInBhdGlvXCIsXCJkcFwiLFwidG9sZXJhbmNlXCIsXCJzdXJmaW5nXCIsXCJjcmVhdGl2aXR5XCIsXCJsbG95ZFwiLFwiZGVzY3JpYmluZ1wiLFwib3B0aWNzXCIsXCJwdXJzdWVcIixcImxpZ2h0bmluZ1wiLFwib3ZlcmNvbWVcIixcImV5ZWRcIixcIm91XCIsXCJxdW90YXRpb25zXCIsXCJncmFiXCIsXCJpbnNwZWN0b3JcIixcImF0dHJhY3RcIixcImJyaWdodG9uXCIsXCJiZWFuc1wiLFwiYm9va21hcmtzXCIsXCJlbGxpc1wiLFwiZGlzYWJsZVwiLFwic25ha2VcIixcInN1Y2NlZWRcIixcImxlb25hcmRcIixcImxlbmRpbmdcIixcIm9vcHNcIixcInJlbWluZGVyXCIsXCJ4aVwiLFwic2VhcmNoZWRcIixcImJlaGF2aW9yYWxcIixcInJpdmVyc2lkZVwiLFwiYmF0aHJvb21zXCIsXCJwbGFpbnNcIixcInNrdVwiLFwiaHRcIixcInJheW1vbmRcIixcImluc2lnaHRzXCIsXCJhYmlsaXRpZXNcIixcImluaXRpYXRlZFwiLFwic3VsbGl2YW5cIixcInphXCIsXCJtaWR3ZXN0XCIsXCJrYXJhb2tlXCIsXCJ0cmFwXCIsXCJsb25lbHlcIixcImZvb2xcIixcInZlXCIsXCJub25wcm9maXRcIixcImxhbmNhc3RlclwiLFwic3VzcGVuZGVkXCIsXCJoZXJlYnlcIixcIm9ic2VydmVcIixcImp1bGlhXCIsXCJjb250YWluZXJzXCIsXCJhdHRpdHVkZXNcIixcImthcmxcIixcImJlcnJ5XCIsXCJjb2xsYXJcIixcInNpbXVsdGFuZW91c2x5XCIsXCJyYWNpYWxcIixcImludGVncmF0ZVwiLFwiYmVybXVkYVwiLFwiYW1hbmRhXCIsXCJzb2Npb2xvZ3lcIixcIm1vYmlsZXNcIixcInNjcmVlbnNob3RcIixcImV4aGliaXRpb25zXCIsXCJrZWxrb29cIixcImNvbmZpZGVudFwiLFwicmV0cmlldmVkXCIsXCJleGhpYml0c1wiLFwib2ZmaWNpYWxseVwiLFwiY29uc29ydGl1bVwiLFwiZGllc1wiLFwidGVycmFjZVwiLFwiYmFjdGVyaWFcIixcInB0c1wiLFwicmVwbGllZFwiLFwic2VhZm9vZFwiLFwibm92ZWxzXCIsXCJyaFwiLFwicnJwXCIsXCJyZWNpcGllbnRzXCIsXCJvdWdodFwiLFwiZGVsaWNpb3VzXCIsXCJ0cmFkaXRpb25zXCIsXCJmZ1wiLFwiamFpbFwiLFwic2FmZWx5XCIsXCJmaW5pdGVcIixcImtpZG5leVwiLFwicGVyaW9kaWNhbGx5XCIsXCJmaXhlc1wiLFwic2VuZHNcIixcImR1cmFibGVcIixcIm1hemRhXCIsXCJhbGxpZWRcIixcInRocm93c1wiLFwibW9pc3R1cmVcIixcImh1bmdhcmlhblwiLFwicm9zdGVyXCIsXCJyZWZlcnJpbmdcIixcInN5bWFudGVjXCIsXCJzcGVuY2VyXCIsXCJ3aWNoaXRhXCIsXCJuYXNkYXFcIixcInVydWd1YXlcIixcIm9vb1wiLFwiaHpcIixcInRyYW5zZm9ybVwiLFwidGltZXJcIixcInRhYmxldHNcIixcInR1bmluZ1wiLFwiZ290dGVuXCIsXCJlZHVjYXRvcnNcIixcInR5bGVyXCIsXCJmdXR1cmVzXCIsXCJ2ZWdldGFibGVcIixcInZlcnNlXCIsXCJoaWdoc1wiLFwiaHVtYW5pdGllc1wiLFwiaW5kZXBlbmRlbnRseVwiLFwid2FudGluZ1wiLFwiY3VzdG9keVwiLFwic2NyYXRjaFwiLFwibGF1bmNoZXNcIixcImlwYXFcIixcImFsaWdubWVudFwiLFwibWFzdHVyYmF0aW5nXCIsXCJoZW5kZXJzb25cIixcImJrXCIsXCJicml0YW5uaWNhXCIsXCJjb21tXCIsXCJlbGxlblwiLFwiY29tcGV0aXRvcnNcIixcIm5oc1wiLFwicm9ja2V0XCIsXCJheWVcIixcImJ1bGxldFwiLFwidG93ZXJzXCIsXCJyYWNrc1wiLFwibGFjZVwiLFwibmFzdHlcIixcInZpc2liaWxpdHlcIixcImxhdGl0dWRlXCIsXCJjb25zY2lvdXNuZXNzXCIsXCJzdGVcIixcInR1bW9yXCIsXCJ1Z2x5XCIsXCJkZXBvc2l0c1wiLFwiYmV2ZXJseVwiLFwibWlzdHJlc3NcIixcImVuY291bnRlclwiLFwidHJ1c3RlZXNcIixcIndhdHRzXCIsXCJkdW5jYW5cIixcInJlcHJpbnRzXCIsXCJoYXJ0XCIsXCJiZXJuYXJkXCIsXCJyZXNvbHV0aW9uc1wiLFwibWVudFwiLFwiYWNjZXNzaW5nXCIsXCJmb3J0eVwiLFwidHViZXNcIixcImF0dGVtcHRlZFwiLFwiY29sXCIsXCJtaWRsYW5kc1wiLFwicHJpZXN0XCIsXCJmbG95ZFwiLFwicm9uYWxkXCIsXCJhbmFseXN0c1wiLFwicXVldWVcIixcImR4XCIsXCJza1wiLFwidHJhbmNlXCIsXCJsb2NhbGVcIixcIm5pY2hvbGFzXCIsXCJiaW9sXCIsXCJ5dVwiLFwiYnVuZGxlXCIsXCJoYW1tZXJcIixcImludmFzaW9uXCIsXCJ3aXRuZXNzZXNcIixcInJ1bm5lclwiLFwicm93c1wiLFwiYWRtaW5pc3RlcmVkXCIsXCJub3Rpb25cIixcInNxXCIsXCJza2luc1wiLFwibWFpbGVkXCIsXCJvY1wiLFwiZnVqaXRzdVwiLFwic3BlbGxpbmdcIixcImFyY3RpY1wiLFwiZXhhbXNcIixcInJld2FyZHNcIixcImJlbmVhdGhcIixcInN0cmVuZ3RoZW5cIixcImRlZmVuZFwiLFwiYWpcIixcImZyZWRlcmlja1wiLFwibWVkaWNhaWRcIixcInRyZW9cIixcImluZnJhcmVkXCIsXCJzZXZlbnRoXCIsXCJnb2RzXCIsXCJ1bmVcIixcIndlbHNoXCIsXCJiZWxseVwiLFwiYWdncmVzc2l2ZVwiLFwidGV4XCIsXCJhZHZlcnRpc2VtZW50c1wiLFwicXVhcnRlcnNcIixcInN0b2xlblwiLFwiY2lhXCIsXCJzdWJsaW1lZGlyZWN0b3J5XCIsXCJzb29uZXN0XCIsXCJoYWl0aVwiLFwiZGlzdHVyYmVkXCIsXCJkZXRlcm1pbmVzXCIsXCJzY3VscHR1cmVcIixcInBvbHlcIixcImVhcnNcIixcImRvZFwiLFwid3BcIixcImZpc3RcIixcIm5hdHVyYWxzXCIsXCJuZW9cIixcIm1vdGl2YXRpb25cIixcImxlbmRlcnNcIixcInBoYXJtYWNvbG9neVwiLFwiZml0dGluZ1wiLFwiZml4dHVyZXNcIixcImJsb2dnZXJzXCIsXCJtZXJlXCIsXCJhZ3JlZXNcIixcInBhc3NlbmdlcnNcIixcInF1YW50aXRpZXNcIixcInBldGVyc2J1cmdcIixcImNvbnNpc3RlbnRseVwiLFwicG93ZXJwb2ludFwiLFwiY29uc1wiLFwic3VycGx1c1wiLFwiZWxkZXJcIixcInNvbmljXCIsXCJvYml0dWFyaWVzXCIsXCJjaGVlcnNcIixcImRpZ1wiLFwidGF4aVwiLFwicHVuaXNobWVudFwiLFwiYXBwcmVjaWF0aW9uXCIsXCJzdWJzZXF1ZW50bHlcIixcIm9tXCIsXCJiZWxhcnVzXCIsXCJuYXRcIixcInpvbmluZ1wiLFwiZ3Jhdml0eVwiLFwicHJvdmlkZW5jZVwiLFwidGh1bWJcIixcInJlc3RyaWN0aW9uXCIsXCJpbmNvcnBvcmF0ZVwiLFwiYmFja2dyb3VuZHNcIixcInRyZWFzdXJlclwiLFwiZ3VpdGFyc1wiLFwiZXNzZW5jZVwiLFwiZmxvb3JpbmdcIixcImxpZ2h0d2VpZ2h0XCIsXCJldGhpb3BpYVwiLFwidHBcIixcIm1pZ2h0eVwiLFwiYXRobGV0ZXNcIixcImh1bWFuaXR5XCIsXCJ0cmFuc2NyaXB0aW9uXCIsXCJqbVwiLFwiaG9sbWVzXCIsXCJjb21wbGljYXRpb25zXCIsXCJzY2hvbGFyc1wiLFwiZHBpXCIsXCJzY3JpcHRpbmdcIixcImdpc1wiLFwicmVtZW1iZXJlZFwiLFwiZ2FsYXh5XCIsXCJjaGVzdGVyXCIsXCJzbmFwc2hvdFwiLFwiY2FyaW5nXCIsXCJsb2NcIixcIndvcm5cIixcInN5bnRoZXRpY1wiLFwic2hhd1wiLFwidnBcIixcInNlZ21lbnRzXCIsXCJ0ZXN0YW1lbnRcIixcImV4cG9cIixcImRvbWluYW50XCIsXCJ0d2lzdFwiLFwic3BlY2lmaWNzXCIsXCJpdHVuZXNcIixcInN0b21hY2hcIixcInBhcnRpYWxseVwiLFwiYnVyaWVkXCIsXCJjblwiLFwibmV3YmllXCIsXCJtaW5pbWl6ZVwiLFwiZGFyd2luXCIsXCJyYW5rc1wiLFwid2lsZGVybmVzc1wiLFwiZGVidXRcIixcImdlbmVyYXRpb25zXCIsXCJ0b3VybmFtZW50c1wiLFwiYnJhZGxleVwiLFwiZGVueVwiLFwiYW5hdG9teVwiLFwiYmFsaVwiLFwianVkeVwiLFwic3BvbnNvcnNoaXBcIixcImhlYWRwaG9uZXNcIixcImZyYWN0aW9uXCIsXCJ0cmlvXCIsXCJwcm9jZWVkaW5nXCIsXCJjdWJlXCIsXCJkZWZlY3RzXCIsXCJ2b2xrc3dhZ2VuXCIsXCJ1bmNlcnRhaW50eVwiLFwiYnJlYWtkb3duXCIsXCJtaWx0b25cIixcIm1hcmtlclwiLFwicmVjb25zdHJ1Y3Rpb25cIixcInN1YnNpZGlhcnlcIixcInN0cmVuZ3Roc1wiLFwiY2xhcml0eVwiLFwicnVnc1wiLFwic2FuZHJhXCIsXCJhZGVsYWlkZVwiLFwiZW5jb3VyYWdpbmdcIixcImZ1cm5pc2hlZFwiLFwibW9uYWNvXCIsXCJzZXR0bGVkXCIsXCJmb2xkaW5nXCIsXCJlbWlyYXRlc1wiLFwidGVycm9yaXN0c1wiLFwiYWlyZmFyZVwiLFwiY29tcGFyaXNvbnNcIixcImJlbmVmaWNpYWxcIixcImRpc3RyaWJ1dGlvbnNcIixcInZhY2NpbmVcIixcImJlbGl6ZVwiLFwiZmF0ZVwiLFwidmlld3BpY3R1cmVcIixcInByb21pc2VkXCIsXCJ2b2x2b1wiLFwicGVubnlcIixcInJvYnVzdFwiLFwiYm9va2luZ3NcIixcInRocmVhdGVuZWRcIixcIm1pbm9sdGFcIixcInJlcHVibGljYW5zXCIsXCJkaXNjdXNzZXNcIixcImd1aVwiLFwicG9ydGVyXCIsXCJncmFzXCIsXCJqdW5nbGVcIixcInZlclwiLFwicm5cIixcInJlc3BvbmRlZFwiLFwicmltXCIsXCJhYnN0cmFjdHNcIixcInplblwiLFwiaXZvcnlcIixcImFscGluZVwiLFwiZGlzXCIsXCJwcmVkaWN0aW9uXCIsXCJwaGFybWFjZXV0aWNhbHNcIixcImFuZGFsZVwiLFwiZmFidWxvdXNcIixcInJlbWl4XCIsXCJhbGlhc1wiLFwidGhlc2F1cnVzXCIsXCJpbmRpdmlkdWFsbHlcIixcImJhdHRsZWZpZWxkXCIsXCJsaXRlcmFsbHlcIixcIm5ld2VyXCIsXCJrYXlcIixcImVjb2xvZ2ljYWxcIixcInNwaWNlXCIsXCJvdmFsXCIsXCJpbXBsaWVzXCIsXCJjZ1wiLFwic29tYVwiLFwic2VyXCIsXCJjb29sZXJcIixcImFwcHJhaXNhbFwiLFwiY29uc2lzdGluZ1wiLFwibWFyaXRpbWVcIixcInBlcmlvZGljXCIsXCJzdWJtaXR0aW5nXCIsXCJvdmVyaGVhZFwiLFwiYXNjaWlcIixcInByb3NwZWN0XCIsXCJzaGlwbWVudFwiLFwiYnJlZWRpbmdcIixcImNpdGF0aW9uc1wiLFwiZ2VvZ3JhcGhpY2FsXCIsXCJkb25vclwiLFwibW96YW1iaXF1ZVwiLFwidGVuc2lvblwiLFwiaHJlZlwiLFwiYmVuelwiLFwidHJhc2hcIixcInNoYXBlc1wiLFwid2lmaVwiLFwidGllclwiLFwiZndkXCIsXCJlYXJsXCIsXCJtYW5vclwiLFwiZW52ZWxvcGVcIixcImRpYW5lXCIsXCJob21lbGFuZFwiLFwiZGlzY2xhaW1lcnNcIixcImNoYW1waW9uc2hpcHNcIixcImV4Y2x1ZGVkXCIsXCJhbmRyZWFcIixcImJyZWVkc1wiLFwicmFwaWRzXCIsXCJkaXNjb1wiLFwic2hlZmZpZWxkXCIsXCJiYWlsZXlcIixcImF1c1wiLFwiZW5kaWZcIixcImZpbmlzaGluZ1wiLFwiZW1vdGlvbnNcIixcIndlbGxpbmd0b25cIixcImluY29taW5nXCIsXCJwcm9zcGVjdHNcIixcImxleG1hcmtcIixcImNsZWFuZXJzXCIsXCJidWxnYXJpYW5cIixcImh3eVwiLFwiZXRlcm5hbFwiLFwiY2FzaGllcnNcIixcImd1YW1cIixcImNpdGVcIixcImFib3JpZ2luYWxcIixcInJlbWFya2FibGVcIixcInJvdGF0aW9uXCIsXCJuYW1cIixcInByZXZlbnRpbmdcIixcInByb2R1Y3RpdmVcIixcImJvdWxldmFyZFwiLFwiZXVnZW5lXCIsXCJpeFwiLFwiZ2RwXCIsXCJwaWdcIixcIm1ldHJpY1wiLFwiY29tcGxpYW50XCIsXCJtaW51c1wiLFwicGVuYWx0aWVzXCIsXCJiZW5uZXR0XCIsXCJpbWFnaW5hdGlvblwiLFwiaG90bWFpbFwiLFwicmVmdXJiaXNoZWRcIixcImpvc2h1YVwiLFwiYXJtZW5pYVwiLFwidmFyaWVkXCIsXCJncmFuZGVcIixcImNsb3Nlc3RcIixcImFjdGl2YXRlZFwiLFwiYWN0cmVzc1wiLFwibWVzc1wiLFwiY29uZmVyZW5jaW5nXCIsXCJhc3NpZ25cIixcImFybXN0cm9uZ1wiLFwicG9saXRpY2lhbnNcIixcInRyYWNrYmFja3NcIixcImxpdFwiLFwiYWNjb21tb2RhdGVcIixcInRpZ2Vyc1wiLFwiYXVyb3JhXCIsXCJ1bmFcIixcInNsaWRlc1wiLFwibWlsYW5cIixcInByZW1pZXJlXCIsXCJsZW5kZXJcIixcInZpbGxhZ2VzXCIsXCJzaGFkZVwiLFwiY2hvcnVzXCIsXCJjaHJpc3RpbmVcIixcInJoeXRobVwiLFwiZGlnaXRcIixcImFyZ3VlZFwiLFwiZGlldGFyeVwiLFwic3ltcGhvbnlcIixcImNsYXJrZVwiLFwic3VkZGVuXCIsXCJhY2NlcHRpbmdcIixcInByZWNpcGl0YXRpb25cIixcIm1hcmlseW5cIixcImxpb25zXCIsXCJmaW5kbGF3XCIsXCJhZGFcIixcInBvb2xzXCIsXCJ0YlwiLFwibHlyaWNcIixcImNsYWlyZVwiLFwiaXNvbGF0aW9uXCIsXCJzcGVlZHNcIixcInN1c3RhaW5lZFwiLFwibWF0Y2hlZFwiLFwiYXBwcm94aW1hdGVcIixcInJvcGVcIixcImNhcnJvbGxcIixcInJhdGlvbmFsXCIsXCJwcm9ncmFtbWVyXCIsXCJmaWdodGVyc1wiLFwiY2hhbWJlcnNcIixcImR1bXBcIixcImdyZWV0aW5nc1wiLFwiaW5oZXJpdGVkXCIsXCJ3YXJtaW5nXCIsXCJpbmNvbXBsZXRlXCIsXCJ2b2NhbHNcIixcImNocm9uaWNsZVwiLFwiZm91bnRhaW5cIixcImNodWJieVwiLFwiZ3JhdmVcIixcImxlZ2l0aW1hdGVcIixcImJpb2dyYXBoaWVzXCIsXCJidXJuZXJcIixcInlyc1wiLFwiZm9vXCIsXCJpbnZlc3RpZ2F0b3JcIixcImdiYVwiLFwicGxhaW50aWZmXCIsXCJmaW5uaXNoXCIsXCJnZW50bGVcIixcImJtXCIsXCJwcmlzb25lcnNcIixcImRlZXBlclwiLFwibXVzbGltc1wiLFwiaG9zZVwiLFwibWVkaXRlcnJhbmVhblwiLFwibmlnaHRsaWZlXCIsXCJmb290YWdlXCIsXCJob3d0b1wiLFwid29ydGh5XCIsXCJyZXZlYWxzXCIsXCJhcmNoaXRlY3RzXCIsXCJzYWludHNcIixcImVudHJlcHJlbmV1clwiLFwiY2Fycmllc1wiLFwic2lnXCIsXCJmcmVlbGFuY2VcIixcImR1b1wiLFwiZXhjZXNzaXZlXCIsXCJkZXZvblwiLFwic2NyZWVuc2F2ZXJcIixcImhlbGVuYVwiLFwic2F2ZXNcIixcInJlZ2FyZGVkXCIsXCJ2YWx1YXRpb25cIixcInVuZXhwZWN0ZWRcIixcImNpZ2FyZXR0ZVwiLFwiZm9nXCIsXCJjaGFyYWN0ZXJpc3RpY1wiLFwibWFyaW9uXCIsXCJsb2JieVwiLFwiZWd5cHRpYW5cIixcInR1bmlzaWFcIixcIm1ldGFsbGljYVwiLFwib3V0bGluZWRcIixcImNvbnNlcXVlbnRseVwiLFwiaGVhZGxpbmVcIixcInRyZWF0aW5nXCIsXCJwdW5jaFwiLFwiYXBwb2ludG1lbnRzXCIsXCJzdHJcIixcImdvdHRhXCIsXCJjb3dib3lcIixcIm5hcnJhdGl2ZVwiLFwiYmFocmFpblwiLFwiZW5vcm1vdXNcIixcImthcm1hXCIsXCJjb25zaXN0XCIsXCJiZXR0eVwiLFwicXVlZW5zXCIsXCJhY2FkZW1pY3NcIixcInB1YnNcIixcInF1YW50aXRhdGl2ZVwiLFwic2hlbWFsZXNcIixcImx1Y2FzXCIsXCJzY3JlZW5zYXZlcnNcIixcInN1YmRpdmlzaW9uXCIsXCJ0cmliZXNcIixcInZpcFwiLFwiZGVmZWF0XCIsXCJjbGlja3NcIixcImRpc3RpbmN0aW9uXCIsXCJob25kdXJhc1wiLFwibmF1Z2h0eVwiLFwiaGF6YXJkc1wiLFwiaW5zdXJlZFwiLFwiaGFycGVyXCIsXCJsaXZlc3RvY2tcIixcIm1hcmRpXCIsXCJleGVtcHRpb25cIixcInRlbmFudFwiLFwic3VzdGFpbmFiaWxpdHlcIixcImNhYmluZXRzXCIsXCJ0YXR0b29cIixcInNoYWtlXCIsXCJhbGdlYnJhXCIsXCJzaGFkb3dzXCIsXCJob2xseVwiLFwiZm9ybWF0dGluZ1wiLFwic2lsbHlcIixcIm51dHJpdGlvbmFsXCIsXCJ5ZWFcIixcIm1lcmN5XCIsXCJoYXJ0Zm9yZFwiLFwiZnJlZWx5XCIsXCJtYXJjdXNcIixcInN1bnJpc2VcIixcIndyYXBwaW5nXCIsXCJtaWxkXCIsXCJmdXJcIixcIm5pY2FyYWd1YVwiLFwid2VibG9nc1wiLFwidGltZWxpbmVcIixcInRhclwiLFwiYmVsb25nc1wiLFwicmpcIixcInJlYWRpbHlcIixcImFmZmlsaWF0aW9uXCIsXCJzb2NcIixcImZlbmNlXCIsXCJudWRpc3RcIixcImluZmluaXRlXCIsXCJkaWFuYVwiLFwiZW5zdXJlc1wiLFwicmVsYXRpdmVzXCIsXCJsaW5kc2F5XCIsXCJjbGFuXCIsXCJsZWdhbGx5XCIsXCJzaGFtZVwiLFwic2F0aXNmYWN0b3J5XCIsXCJyZXZvbHV0aW9uYXJ5XCIsXCJicmFjZWxldHNcIixcInN5bmNcIixcImNpdmlsaWFuXCIsXCJ0ZWxlcGhvbnlcIixcIm1lc2FcIixcImZhdGFsXCIsXCJyZW1lZHlcIixcInJlYWx0b3JzXCIsXCJicmVhdGhpbmdcIixcImJyaWVmbHlcIixcInRoaWNrbmVzc1wiLFwiYWRqdXN0bWVudHNcIixcImdyYXBoaWNhbFwiLFwiZ2VuaXVzXCIsXCJkaXNjdXNzaW5nXCIsXCJhZXJvc3BhY2VcIixcImZpZ2h0ZXJcIixcIm1lYW5pbmdmdWxcIixcImZsZXNoXCIsXCJyZXRyZWF0XCIsXCJhZGFwdGVkXCIsXCJiYXJlbHlcIixcIndoZXJldmVyXCIsXCJlc3RhdGVzXCIsXCJydWdcIixcImRlbW9jcmF0XCIsXCJib3JvdWdoXCIsXCJtYWludGFpbnNcIixcImZhaWxpbmdcIixcInNob3J0Y3V0c1wiLFwia2FcIixcInJldGFpbmVkXCIsXCJ2b3lldXJ3ZWJcIixcInBhbWVsYVwiLFwiYW5kcmV3c1wiLFwibWFyYmxlXCIsXCJleHRlbmRpbmdcIixcImplc3NlXCIsXCJzcGVjaWZpZXNcIixcImh1bGxcIixcImxvZ2l0ZWNoXCIsXCJzdXJyZXlcIixcImJyaWVmaW5nXCIsXCJiZWxraW5cIixcImRlbVwiLFwiYWNjcmVkaXRhdGlvblwiLFwid2F2XCIsXCJibGFja2JlcnJ5XCIsXCJoaWdobGFuZFwiLFwibWVkaXRhdGlvblwiLFwibW9kdWxhclwiLFwibWljcm9waG9uZVwiLFwibWFjZWRvbmlhXCIsXCJjb21iaW5pbmdcIixcImJyYW5kb25cIixcImluc3RydW1lbnRhbFwiLFwiZ2lhbnRzXCIsXCJvcmdhbml6aW5nXCIsXCJzaGVkXCIsXCJiYWxsb29uXCIsXCJtb2RlcmF0b3JzXCIsXCJ3aW5zdG9uXCIsXCJtZW1vXCIsXCJoYW1cIixcInNvbHZlZFwiLFwidGlkZVwiLFwia2F6YWtoc3RhblwiLFwiaGF3YWlpYW5cIixcInN0YW5kaW5nc1wiLFwicGFydGl0aW9uXCIsXCJpbnZpc2libGVcIixcImdyYXR1aXRcIixcImNvbnNvbGVzXCIsXCJmdW5rXCIsXCJmYmlcIixcInFhdGFyXCIsXCJtYWduZXRcIixcInRyYW5zbGF0aW9uc1wiLFwicG9yc2NoZVwiLFwiY2F5bWFuXCIsXCJqYWd1YXJcIixcInJlZWxcIixcInNoZWVyXCIsXCJjb21tb2RpdHlcIixcInBvc2luZ1wiLFwia2lsb21ldGVyc1wiLFwicnBcIixcImJpbmRcIixcInRoYW5rc2dpdmluZ1wiLFwicmFuZFwiLFwiaG9wa2luc1wiLFwidXJnZW50XCIsXCJndWFyYW50ZWVzXCIsXCJpbmZhbnRzXCIsXCJnb3RoaWNcIixcImN5bGluZGVyXCIsXCJ3aXRjaFwiLFwiYnVja1wiLFwiaW5kaWNhdGlvblwiLFwiZWhcIixcImNvbmdyYXR1bGF0aW9uc1wiLFwidGJhXCIsXCJjb2hlblwiLFwic2llXCIsXCJ1c2dzXCIsXCJwdXBweVwiLFwia2F0aHlcIixcImFjcmVcIixcImdyYXBoc1wiLFwic3Vycm91bmRcIixcImNpZ2FyZXR0ZXNcIixcInJldmVuZ2VcIixcImV4cGlyZXNcIixcImVuZW1pZXNcIixcImxvd3NcIixcImNvbnRyb2xsZXJzXCIsXCJhcXVhXCIsXCJjaGVuXCIsXCJlbW1hXCIsXCJjb25zdWx0YW5jeVwiLFwiZmluYW5jZXNcIixcImFjY2VwdHNcIixcImVuam95aW5nXCIsXCJjb252ZW50aW9uc1wiLFwiZXZhXCIsXCJwYXRyb2xcIixcInNtZWxsXCIsXCJwZXN0XCIsXCJoY1wiLFwiaXRhbGlhbm9cIixcImNvb3JkaW5hdGVzXCIsXCJyY2FcIixcImZwXCIsXCJjYXJuaXZhbFwiLFwicm91Z2hseVwiLFwic3RpY2tlclwiLFwicHJvbWlzZXNcIixcInJlc3BvbmRpbmdcIixcInJlZWZcIixcInBoeXNpY2FsbHlcIixcImRpdmlkZVwiLFwic3Rha2Vob2xkZXJzXCIsXCJoeWRyb2NvZG9uZVwiLFwiZ3N0XCIsXCJjb25zZWN1dGl2ZVwiLFwiY29ybmVsbFwiLFwic2F0aW5cIixcImJvblwiLFwiZGVzZXJ2ZVwiLFwiYXR0ZW1wdGluZ1wiLFwibWFpbHRvXCIsXCJwcm9tb1wiLFwiampcIixcInJlcHJlc2VudGF0aW9uc1wiLFwiY2hhblwiLFwid29ycmllZFwiLFwidHVuZXNcIixcImdhcmJhZ2VcIixcImNvbXBldGluZ1wiLFwiY29tYmluZXNcIixcIm1hc1wiLFwiYmV0aFwiLFwiYnJhZGZvcmRcIixcImxlblwiLFwicGhyYXNlc1wiLFwia2FpXCIsXCJwZW5pbnN1bGFcIixcImNoZWxzZWFcIixcImJvcmluZ1wiLFwicmV5bm9sZHNcIixcImRvbVwiLFwiamlsbFwiLFwiYWNjdXJhdGVseVwiLFwic3BlZWNoZXNcIixcInJlYWNoZXNcIixcInNjaGVtYVwiLFwiY29uc2lkZXJzXCIsXCJzb2ZhXCIsXCJjYXRhbG9nc1wiLFwibWluaXN0cmllc1wiLFwidmFjYW5jaWVzXCIsXCJxdWl6emVzXCIsXCJwYXJsaWFtZW50YXJ5XCIsXCJvYmpcIixcInByZWZpeFwiLFwibHVjaWFcIixcInNhdmFubmFoXCIsXCJiYXJyZWxcIixcInR5cGluZ1wiLFwibmVydmVcIixcImRhbnNcIixcInBsYW5ldHNcIixcImRlZmljaXRcIixcImJvdWxkZXJcIixcInBvaW50aW5nXCIsXCJyZW5ld1wiLFwiY291cGxlZFwiLFwidmlpaVwiLFwibXlhbm1hclwiLFwibWV0YWRhdGFcIixcImhhcm9sZFwiLFwiY2lyY3VpdHNcIixcImZsb3BweVwiLFwidGV4dHVyZVwiLFwiaGFuZGJhZ3NcIixcImphclwiLFwiZXZcIixcInNvbWVyc2V0XCIsXCJpbmN1cnJlZFwiLFwiYWNrbm93bGVkZ2VcIixcInRob3JvdWdobHlcIixcImFudGlndWFcIixcIm5vdHRpbmdoYW1cIixcInRodW5kZXJcIixcInRlbnRcIixcImNhdXRpb25cIixcImlkZW50aWZpZXNcIixcInF1ZXN0aW9ubmFpcmVcIixcInF1YWxpZmljYXRpb25cIixcImxvY2tzXCIsXCJtb2RlbGxpbmdcIixcIm5hbWVseVwiLFwibWluaWF0dXJlXCIsXCJkZXB0XCIsXCJoYWNrXCIsXCJkYXJlXCIsXCJldXJvc1wiLFwiaW50ZXJzdGF0ZVwiLFwicGlyYXRlc1wiLFwiYWVyaWFsXCIsXCJoYXdrXCIsXCJjb25zZXF1ZW5jZVwiLFwicmViZWxcIixcInN5c3RlbWF0aWNcIixcInBlcmNlaXZlZFwiLFwib3JpZ2luc1wiLFwiaGlyZWRcIixcIm1ha2V1cFwiLFwidGV4dGlsZVwiLFwibGFtYlwiLFwibWFkYWdhc2NhclwiLFwibmF0aGFuXCIsXCJ0b2JhZ29cIixcInByZXNlbnRpbmdcIixcImNvc1wiLFwidHJvdWJsZXNob290aW5nXCIsXCJ1emJla2lzdGFuXCIsXCJpbmRleGVzXCIsXCJwYWNcIixcInJsXCIsXCJlcnBcIixcImNlbnR1cmllc1wiLFwiZ2xcIixcIm1hZ25pdHVkZVwiLFwidWlcIixcInJpY2hhcmRzb25cIixcImhpbmR1XCIsXCJkaFwiLFwiZnJhZ3JhbmNlc1wiLFwidm9jYWJ1bGFyeVwiLFwibGlja2luZ1wiLFwiZWFydGhxdWFrZVwiLFwidnBuXCIsXCJmdW5kcmFpc2luZ1wiLFwiZmNjXCIsXCJtYXJrZXJzXCIsXCJ3ZWlnaHRzXCIsXCJhbGJhbmlhXCIsXCJnZW9sb2dpY2FsXCIsXCJhc3Nlc3NpbmdcIixcImxhc3RpbmdcIixcIndpY2tlZFwiLFwiZWRzXCIsXCJpbnRyb2R1Y2VzXCIsXCJraWxsc1wiLFwicm9vbW1hdGVcIixcIndlYmNhbXNcIixcInB1c2hlZFwiLFwid2VibWFzdGVyc1wiLFwicm9cIixcImRmXCIsXCJjb21wdXRhdGlvbmFsXCIsXCJhY2RiZW50aXR5XCIsXCJwYXJ0aWNpcGF0ZWRcIixcImp1bmtcIixcImhhbmRoZWxkc1wiLFwid2F4XCIsXCJsdWN5XCIsXCJhbnN3ZXJpbmdcIixcImhhbnNcIixcImltcHJlc3NlZFwiLFwic2xvcGVcIixcInJlZ2dhZVwiLFwiZmFpbHVyZXNcIixcInBvZXRcIixcImNvbnNwaXJhY3lcIixcInN1cm5hbWVcIixcInRoZW9sb2d5XCIsXCJuYWlsc1wiLFwiZXZpZGVudFwiLFwid2hhdHNcIixcInJpZGVzXCIsXCJyZWhhYlwiLFwiZXBpY1wiLFwic2F0dXJuXCIsXCJvcmdhbml6ZXJcIixcIm51dFwiLFwiYWxsZXJneVwiLFwic2FrZVwiLFwidHdpc3RlZFwiLFwiY29tYmluYXRpb25zXCIsXCJwcmVjZWRpbmdcIixcIm1lcml0XCIsXCJlbnp5bWVcIixcImN1bXVsYXRpdmVcIixcInpzaG9wc1wiLFwicGxhbmVzXCIsXCJlZG1vbnRvblwiLFwidGFja2xlXCIsXCJkaXNrc1wiLFwiY29uZG9cIixcInBva2Vtb25cIixcImFtcGxpZmllclwiLFwiYW1iaWVuXCIsXCJhcmJpdHJhcnlcIixcInByb21pbmVudFwiLFwicmV0cmlldmVcIixcImxleGluZ3RvblwiLFwidmVybm9uXCIsXCJzYW5zXCIsXCJ3b3JsZGNhdFwiLFwidGl0YW5pdW1cIixcImlyc1wiLFwiZmFpcnlcIixcImJ1aWxkc1wiLFwiY29udGFjdGVkXCIsXCJzaGFmdFwiLFwibGVhblwiLFwiYnllXCIsXCJjZHRcIixcInJlY29yZGVyc1wiLFwib2NjYXNpb25hbFwiLFwibGVzbGllXCIsXCJjYXNpb1wiLFwiZGV1dHNjaGVcIixcImFuYVwiLFwicG9zdGluZ3NcIixcImlubm92YXRpb25zXCIsXCJraXR0eVwiLFwicG9zdGNhcmRzXCIsXCJkdWRlXCIsXCJkcmFpblwiLFwibW9udGVcIixcImZpcmVzXCIsXCJhbGdlcmlhXCIsXCJibGVzc2VkXCIsXCJsdWlzXCIsXCJyZXZpZXdpbmdcIixcImNhcmRpZmZcIixcImNvcm53YWxsXCIsXCJmYXZvcnNcIixcInBvdGF0b1wiLFwicGFuaWNcIixcImV4cGxpY2l0bHlcIixcInN0aWNrc1wiLFwibGVvbmVcIixcInRyYW5zc2V4dWFsXCIsXCJlelwiLFwiY2l0aXplbnNoaXBcIixcImV4Y3VzZVwiLFwicmVmb3Jtc1wiLFwiYmFzZW1lbnRcIixcIm9uaW9uXCIsXCJzdHJhbmRcIixcInBmXCIsXCJzYW5kd2ljaFwiLFwidXdcIixcImxhd3N1aXRcIixcImFsdG9cIixcImluZm9ybWF0aXZlXCIsXCJnaXJsZnJpZW5kXCIsXCJibG9vbWJlcmdcIixcImNoZXF1ZVwiLFwiaGllcmFyY2h5XCIsXCJpbmZsdWVuY2VkXCIsXCJiYW5uZXJzXCIsXCJyZWplY3RcIixcImVhdVwiLFwiYWJhbmRvbmVkXCIsXCJiZFwiLFwiY2lyY2xlc1wiLFwiaXRhbGljXCIsXCJiZWF0c1wiLFwibWVycnlcIixcIm1pbFwiLFwic2N1YmFcIixcImdvcmVcIixcImNvbXBsZW1lbnRcIixcImN1bHRcIixcImRhc2hcIixcInBhc3NpdmVcIixcIm1hdXJpdGl1c1wiLFwidmFsdWVkXCIsXCJjYWdlXCIsXCJjaGVja2xpc3RcIixcImJhbmdidXNcIixcInJlcXVlc3RpbmdcIixcImNvdXJhZ2VcIixcInZlcmRlXCIsXCJsYXVkZXJkYWxlXCIsXCJzY2VuYXJpb3NcIixcImdhemV0dGVcIixcImhpdGFjaGlcIixcImRpdnhcIixcImV4dHJhY3Rpb25cIixcImJhdG1hblwiLFwiZWxldmF0aW9uXCIsXCJoZWFyaW5nc1wiLFwiY29sZW1hblwiLFwiaHVnaFwiLFwibGFwXCIsXCJ1dGlsaXphdGlvblwiLFwiYmV2ZXJhZ2VzXCIsXCJjYWxpYnJhdGlvblwiLFwiamFrZVwiLFwiZXZhbFwiLFwiZWZmaWNpZW50bHlcIixcImFuYWhlaW1cIixcInBpbmdcIixcInRleHRib29rXCIsXCJkcmllZFwiLFwiZW50ZXJ0YWluaW5nXCIsXCJwcmVyZXF1aXNpdGVcIixcImx1dGhlclwiLFwiZnJvbnRpZXJcIixcInNldHRsZVwiLFwic3RvcHBpbmdcIixcInJlZnVnZWVzXCIsXCJrbmlnaHRzXCIsXCJoeXBvdGhlc2lzXCIsXCJwYWxtZXJcIixcIm1lZGljaW5lc1wiLFwiZmx1eFwiLFwiZGVyYnlcIixcInNhb1wiLFwicGVhY2VmdWxcIixcImFsdGVyZWRcIixcInBvbnRpYWNcIixcInJlZ3Jlc3Npb25cIixcImRvY3RyaW5lXCIsXCJzY2VuaWNcIixcInRyYWluZXJzXCIsXCJtdXplXCIsXCJlbmhhbmNlbWVudHNcIixcInJlbmV3YWJsZVwiLFwiaW50ZXJzZWN0aW9uXCIsXCJwYXNzd29yZHNcIixcInNld2luZ1wiLFwiY29uc2lzdGVuY3lcIixcImNvbGxlY3RvcnNcIixcImNvbmNsdWRlXCIsXCJyZWNvZ25pc2VkXCIsXCJtdW5pY2hcIixcIm9tYW5cIixcImNlbGVic1wiLFwiZ21jXCIsXCJwcm9wb3NlXCIsXCJoaFwiLFwiYXplcmJhaWphblwiLFwibGlnaHRlclwiLFwicmFnZVwiLFwiYWRzbFwiLFwidWhcIixcInByaXhcIixcImFzdHJvbG9neVwiLFwiYWR2aXNvcnNcIixcInBhdmlsaW9uXCIsXCJ0YWN0aWNzXCIsXCJ0cnVzdHNcIixcIm9jY3VycmluZ1wiLFwic3VwcGxlbWVudGFsXCIsXCJ0cmF2ZWxsaW5nXCIsXCJ0YWxlbnRlZFwiLFwiYW5uaWVcIixcInBpbGxvd1wiLFwiaW5kdWN0aW9uXCIsXCJkZXJla1wiLFwicHJlY2lzZWx5XCIsXCJzaG9ydGVyXCIsXCJoYXJsZXlcIixcInNwcmVhZGluZ1wiLFwicHJvdmluY2VzXCIsXCJyZWx5aW5nXCIsXCJmaW5hbHNcIixcInBhcmFndWF5XCIsXCJzdGVhbFwiLFwicGFyY2VsXCIsXCJyZWZpbmVkXCIsXCJmZFwiLFwiYm9cIixcImZpZnRlZW5cIixcIndpZGVzcHJlYWRcIixcImluY2lkZW5jZVwiLFwiZmVhcnNcIixcInByZWRpY3RcIixcImJvdXRpcXVlXCIsXCJhY3J5bGljXCIsXCJyb2xsZWRcIixcInR1bmVyXCIsXCJhdm9uXCIsXCJpbmNpZGVudHNcIixcInBldGVyc29uXCIsXCJyYXlzXCIsXCJhc25cIixcInNoYW5ub25cIixcInRvZGRsZXJcIixcImVuaGFuY2luZ1wiLFwiZmxhdm9yXCIsXCJhbGlrZVwiLFwid2FsdFwiLFwiaG9tZWxlc3NcIixcImhvcnJpYmxlXCIsXCJodW5ncnlcIixcIm1ldGFsbGljXCIsXCJhY25lXCIsXCJibG9ja2VkXCIsXCJpbnRlcmZlcmVuY2VcIixcIndhcnJpb3JzXCIsXCJwYWxlc3RpbmVcIixcImxpc3RwcmljZVwiLFwibGlic1wiLFwidW5kb1wiLFwiY2FkaWxsYWNcIixcImF0bW9zcGhlcmljXCIsXCJtYWxhd2lcIixcIndtXCIsXCJwa1wiLFwic2FnZW1cIixcImtub3dsZWRnZXN0b3JtXCIsXCJkYW5hXCIsXCJoYWxvXCIsXCJwcG1cIixcImN1cnRpc1wiLFwicGFyZW50YWxcIixcInJlZmVyZW5jZWRcIixcInN0cmlrZXNcIixcImxlc3NlclwiLFwicHVibGljaXR5XCIsXCJtYXJhdGhvblwiLFwiYW50XCIsXCJwcm9wb3NpdGlvblwiLFwiZ2F5c1wiLFwicHJlc3NpbmdcIixcImdhc29saW5lXCIsXCJhcHRcIixcImRyZXNzZWRcIixcInNjb3V0XCIsXCJiZWxmYXN0XCIsXCJleGVjXCIsXCJkZWFsdFwiLFwibmlhZ2FyYVwiLFwiaW5mXCIsXCJlb3NcIixcIndhcmNyYWZ0XCIsXCJjaGFybXNcIixcImNhdGFseXN0XCIsXCJ0cmFkZXJcIixcImJ1Y2tzXCIsXCJhbGxvd2FuY2VcIixcInZjclwiLFwiZGVuaWFsXCIsXCJ1cmlcIixcImRlc2lnbmF0aW9uXCIsXCJ0aHJvd25cIixcInByZXBhaWRcIixcInJhaXNlc1wiLFwiZ2VtXCIsXCJkdXBsaWNhdGVcIixcImVsZWN0cm9cIixcImNyaXRlcmlvblwiLFwiYmFkZ2VcIixcIndyaXN0XCIsXCJjaXZpbGl6YXRpb25cIixcImFuYWx5emVkXCIsXCJ2aWV0bmFtZXNlXCIsXCJoZWF0aFwiLFwidHJlbWVuZG91c1wiLFwiYmFsbG90XCIsXCJsZXh1c1wiLFwidmFyeWluZ1wiLFwicmVtZWRpZXNcIixcInZhbGlkaXR5XCIsXCJ0cnVzdGVlXCIsXCJtYXVpXCIsXCJoYW5kam9ic1wiLFwid2VpZ2h0ZWRcIixcImFuZ29sYVwiLFwic3F1aXJ0XCIsXCJwZXJmb3Jtc1wiLFwicGxhc3RpY3NcIixcInJlYWxtXCIsXCJjb3JyZWN0ZWRcIixcImplbm55XCIsXCJoZWxtZXRcIixcInNhbGFyaWVzXCIsXCJwb3N0Y2FyZFwiLFwiZWxlcGhhbnRcIixcInllbWVuXCIsXCJlbmNvdW50ZXJlZFwiLFwidHN1bmFtaVwiLFwic2Nob2xhclwiLFwibmlja2VsXCIsXCJpbnRlcm5hdGlvbmFsbHlcIixcInN1cnJvdW5kZWRcIixcInBzaVwiLFwiYnVzZXNcIixcImV4cGVkaWFcIixcImdlb2xvZ3lcIixcInBjdFwiLFwid2JcIixcImNyZWF0dXJlc1wiLFwiY29hdGluZ1wiLFwiY29tbWVudGVkXCIsXCJ3YWxsZXRcIixcImNsZWFyZWRcIixcInNtaWxpZXNcIixcInZpZHNcIixcImFjY29tcGxpc2hcIixcImJvYXRpbmdcIixcImRyYWluYWdlXCIsXCJzaGFraXJhXCIsXCJjb3JuZXJzXCIsXCJicm9hZGVyXCIsXCJ2ZWdldGFyaWFuXCIsXCJyb3VnZVwiLFwieWVhc3RcIixcInlhbGVcIixcIm5ld2ZvdW5kbGFuZFwiLFwic25cIixcInFsZFwiLFwicGFzXCIsXCJjbGVhcmluZ1wiLFwiaW52ZXN0aWdhdGVkXCIsXCJka1wiLFwiYW1iYXNzYWRvclwiLFwiY29hdGVkXCIsXCJpbnRlbmRcIixcInN0ZXBoYW5pZVwiLFwiY29udGFjdGluZ1wiLFwidmVnZXRhdGlvblwiLFwiZG9vbVwiLFwiZmluZGFydGljbGVzXCIsXCJsb3Vpc2VcIixcImtlbm55XCIsXCJzcGVjaWFsbHlcIixcIm93ZW5cIixcInJvdXRpbmVzXCIsXCJoaXR0aW5nXCIsXCJ5dWtvblwiLFwiYmVpbmdzXCIsXCJiaXRlXCIsXCJpc3NuXCIsXCJhcXVhdGljXCIsXCJyZWxpYW5jZVwiLFwiaGFiaXRzXCIsXCJzdHJpa2luZ1wiLFwibXl0aFwiLFwiaW5mZWN0aW91c1wiLFwicG9kY2FzdHNcIixcInNpbmdoXCIsXCJnaWdcIixcImdpbGJlcnRcIixcInNhc1wiLFwiZmVycmFyaVwiLFwiY29udGludWl0eVwiLFwiYnJvb2tcIixcImZ1XCIsXCJvdXRwdXRzXCIsXCJwaGVub21lbm9uXCIsXCJlbnNlbWJsZVwiLFwiaW5zdWxpblwiLFwiYXNzdXJlZFwiLFwiYmlibGljYWxcIixcIndlZWRcIixcImNvbnNjaW91c1wiLFwiYWNjZW50XCIsXCJteXNpbW9uXCIsXCJlbGV2ZW5cIixcIndpdmVzXCIsXCJhbWJpZW50XCIsXCJ1dGlsaXplXCIsXCJtaWxlYWdlXCIsXCJvZWNkXCIsXCJwcm9zdGF0ZVwiLFwiYWRhcHRvclwiLFwiYXVidXJuXCIsXCJ1bmxvY2tcIixcImh5dW5kYWlcIixcInBsZWRnZVwiLFwidmFtcGlyZVwiLFwiYW5nZWxhXCIsXCJyZWxhdGVzXCIsXCJuaXRyb2dlblwiLFwieGVyb3hcIixcImRpY2VcIixcIm1lcmdlclwiLFwic29mdGJhbGxcIixcInJlZmVycmFsc1wiLFwicXVhZFwiLFwiZG9ja1wiLFwiZGlmZmVyZW50bHlcIixcImZpcmV3aXJlXCIsXCJtb2RzXCIsXCJuZXh0ZWxcIixcImZyYW1pbmdcIixcIm9yZ2FuaXNlZFwiLFwibXVzaWNpYW5cIixcImJsb2NraW5nXCIsXCJyd2FuZGFcIixcInNvcnRzXCIsXCJpbnRlZ3JhdGluZ1wiLFwidnNuZXRcIixcImxpbWl0aW5nXCIsXCJkaXNwYXRjaFwiLFwicmV2aXNpb25zXCIsXCJwYXB1YVwiLFwicmVzdG9yZWRcIixcImhpbnRcIixcImFybW9yXCIsXCJyaWRlcnNcIixcImNoYXJnZXJzXCIsXCJyZW1hcmtcIixcImRvemVuc1wiLFwidmFyaWVzXCIsXCJtc2llXCIsXCJyZWFzb25pbmdcIixcInduXCIsXCJsaXpcIixcInJlbmRlcmVkXCIsXCJwaWNraW5nXCIsXCJjaGFyaXRhYmxlXCIsXCJndWFyZHNcIixcImFubm90YXRlZFwiLFwiY2NkXCIsXCJzdlwiLFwiY29udmluY2VkXCIsXCJvcGVuaW5nc1wiLFwiYnV5c1wiLFwiYnVybGluZ3RvblwiLFwicmVwbGFjaW5nXCIsXCJyZXNlYXJjaGVyXCIsXCJ3YXRlcnNoZWRcIixcImNvdW5jaWxzXCIsXCJvY2N1cGF0aW9uc1wiLFwiYWNrbm93bGVkZ2VkXCIsXCJrcnVnZXJcIixcInBvY2tldHNcIixcImdyYW5ueVwiLFwicG9ya1wiLFwienVcIixcImVxdWlsaWJyaXVtXCIsXCJ2aXJhbFwiLFwiaW5xdWlyZVwiLFwicGlwZXNcIixcImNoYXJhY3Rlcml6ZWRcIixcImxhZGVuXCIsXCJhcnViYVwiLFwiY290dGFnZXNcIixcInJlYWx0b3JcIixcIm1lcmdlXCIsXCJwcml2aWxlZ2VcIixcImVkZ2FyXCIsXCJkZXZlbG9wc1wiLFwicXVhbGlmeWluZ1wiLFwiY2hhc3Npc1wiLFwiZHViYWlcIixcImVzdGltYXRpb25cIixcImJhcm5cIixcInB1c2hpbmdcIixcImxscFwiLFwiZmxlZWNlXCIsXCJwZWRpYXRyaWNcIixcImJvY1wiLFwiZmFyZVwiLFwiZGdcIixcImFzdXNcIixcInBpZXJjZVwiLFwiYWxsYW5cIixcImRyZXNzaW5nXCIsXCJ0ZWNocmVwdWJsaWNcIixcInNwZXJtXCIsXCJ2Z1wiLFwiYmFsZFwiLFwiZmlsbWVcIixcImNyYXBzXCIsXCJmdWppXCIsXCJmcm9zdFwiLFwibGVvblwiLFwiaW5zdGl0dXRlc1wiLFwibW9sZFwiLFwiZGFtZVwiLFwiZm9cIixcInNhbGx5XCIsXCJ5YWNodFwiLFwidHJhY3lcIixcInByZWZlcnNcIixcImRyaWxsaW5nXCIsXCJicm9jaHVyZXNcIixcImhlcmJcIixcInRtcFwiLFwiYWxvdFwiLFwiYXRlXCIsXCJicmVhY2hcIixcIndoYWxlXCIsXCJ0cmF2ZWxsZXJcIixcImFwcHJvcHJpYXRpb25zXCIsXCJzdXNwZWN0ZWRcIixcInRvbWF0b2VzXCIsXCJiZW5jaG1hcmtcIixcImJlZ2lubmVyc1wiLFwiaW5zdHJ1Y3RvcnNcIixcImhpZ2hsaWdodGVkXCIsXCJiZWRmb3JkXCIsXCJzdGF0aW9uZXJ5XCIsXCJpZGxlXCIsXCJtdXN0YW5nXCIsXCJ1bmF1dGhvcml6ZWRcIixcImNsdXN0ZXJzXCIsXCJhbnRpYm9keVwiLFwiY29tcGV0ZW50XCIsXCJtb21lbnR1bVwiLFwiZmluXCIsXCJ3aXJpbmdcIixcImlvXCIsXCJwYXN0b3JcIixcIm11ZFwiLFwiY2FsdmluXCIsXCJ1bmlcIixcInNoYXJrXCIsXCJjb250cmlidXRvclwiLFwiZGVtb25zdHJhdGVzXCIsXCJwaGFzZXNcIixcImdyYXRlZnVsXCIsXCJlbWVyYWxkXCIsXCJncmFkdWFsbHlcIixcImxhdWdoaW5nXCIsXCJncm93c1wiLFwiY2xpZmZcIixcImRlc2lyYWJsZVwiLFwidHJhY3RcIixcInVsXCIsXCJiYWxsZXRcIixcIm9sXCIsXCJqb3VybmFsaXN0XCIsXCJhYnJhaGFtXCIsXCJqc1wiLFwiYnVtcGVyXCIsXCJhZnRlcndhcmRzXCIsXCJ3ZWJwYWdlXCIsXCJyZWxpZ2lvbnNcIixcImdhcmxpY1wiLFwiaG9zdGVsc1wiLFwic2hpbmVcIixcInNlbmVnYWxcIixcImV4cGxvc2lvblwiLFwicG5cIixcImJhbm5lZFwiLFwid2VuZHlcIixcImJyaWVmc1wiLFwic2lnbmF0dXJlc1wiLFwiZGlmZnNcIixcImNvdmVcIixcIm11bWJhaVwiLFwib3pvbmVcIixcImRpc2NpcGxpbmVzXCIsXCJjYXNhXCIsXCJtdVwiLFwiZGF1Z2h0ZXJzXCIsXCJjb252ZXJzYXRpb25zXCIsXCJyYWRpb3NcIixcInRhcmlmZlwiLFwibnZpZGlhXCIsXCJvcHBvbmVudFwiLFwicGFzdGFcIixcInNpbXBsaWZpZWRcIixcIm11c2NsZXNcIixcInNlcnVtXCIsXCJ3cmFwcGVkXCIsXCJzd2lmdFwiLFwibW90aGVyYm9hcmRcIixcInJ1bnRpbWVcIixcImluYm94XCIsXCJmb2NhbFwiLFwiYmlibGlvZ3JhcGhpY1wiLFwiZWRlblwiLFwiZGlzdGFudFwiLFwiaW5jbFwiLFwiY2hhbXBhZ25lXCIsXCJhbGFcIixcImRlY2ltYWxcIixcImhxXCIsXCJkZXZpYXRpb25cIixcInN1cGVyaW50ZW5kZW50XCIsXCJwcm9wZWNpYVwiLFwiZGlwXCIsXCJuYmNcIixcInNhbWJhXCIsXCJob3N0ZWxcIixcImhvdXNld2l2ZXNcIixcImVtcGxveVwiLFwibW9uZ29saWFcIixcInBlbmd1aW5cIixcIm1hZ2ljYWxcIixcImluZmx1ZW5jZXNcIixcImluc3BlY3Rpb25zXCIsXCJpcnJpZ2F0aW9uXCIsXCJtaXJhY2xlXCIsXCJtYW51YWxseVwiLFwicmVwcmludFwiLFwicmVpZFwiLFwid3RcIixcImh5ZHJhdWxpY1wiLFwiY2VudGVyZWRcIixcInJvYmVydHNvblwiLFwiZmxleFwiLFwieWVhcmx5XCIsXCJwZW5ldHJhdGlvblwiLFwid291bmRcIixcImJlbGxlXCIsXCJyb3NhXCIsXCJjb252aWN0aW9uXCIsXCJoYXNoXCIsXCJvbWlzc2lvbnNcIixcIndyaXRpbmdzXCIsXCJoYW1idXJnXCIsXCJsYXp5XCIsXCJtdlwiLFwibXBnXCIsXCJyZXRyaWV2YWxcIixcInF1YWxpdGllc1wiLFwiY2luZHlcIixcImZhdGhlcnNcIixcImNhcmJcIixcImNoYXJnaW5nXCIsXCJjYXNcIixcIm1hcnZlbFwiLFwibGluZWRcIixcImNpb1wiLFwiZG93XCIsXCJwcm90b3R5cGVcIixcImltcG9ydGFudGx5XCIsXCJyYlwiLFwicGV0aXRlXCIsXCJhcHBhcmF0dXNcIixcInVwY1wiLFwidGVycmFpblwiLFwiZHVpXCIsXCJwZW5zXCIsXCJleHBsYWluaW5nXCIsXCJ5ZW5cIixcInN0cmlwc1wiLFwiZ29zc2lwXCIsXCJyYW5nZXJzXCIsXCJub21pbmF0aW9uXCIsXCJlbXBpcmljYWxcIixcIm1oXCIsXCJyb3RhcnlcIixcIndvcm1cIixcImRlcGVuZGVuY2VcIixcImRpc2NyZXRlXCIsXCJiZWdpbm5lclwiLFwiYm94ZWRcIixcImxpZFwiLFwic2V4dWFsaXR5XCIsXCJwb2x5ZXN0ZXJcIixcImN1YmljXCIsXCJkZWFmXCIsXCJjb21taXRtZW50c1wiLFwic3VnZ2VzdGluZ1wiLFwic2FwcGhpcmVcIixcImtpbmFzZVwiLFwic2tpcnRzXCIsXCJtYXRzXCIsXCJyZW1haW5kZXJcIixcImNyYXdmb3JkXCIsXCJsYWJlbGVkXCIsXCJwcml2aWxlZ2VzXCIsXCJ0ZWxldmlzaW9uc1wiLFwic3BlY2lhbGl6aW5nXCIsXCJtYXJraW5nXCIsXCJjb21tb2RpdGllc1wiLFwicHZjXCIsXCJzZXJiaWFcIixcInNoZXJpZmZcIixcImdyaWZmaW5cIixcImRlY2xpbmVkXCIsXCJndXlhbmFcIixcInNwaWVzXCIsXCJibGFoXCIsXCJtaW1lXCIsXCJuZWlnaGJvclwiLFwibW90b3JjeWNsZXNcIixcImVsZWN0XCIsXCJoaWdod2F5c1wiLFwidGhpbmtwYWRcIixcImNvbmNlbnRyYXRlXCIsXCJpbnRpbWF0ZVwiLFwicmVwcm9kdWN0aXZlXCIsXCJwcmVzdG9uXCIsXCJkZWFkbHlcIixcImZlb2ZcIixcImJ1bm55XCIsXCJjaGV2eVwiLFwibW9sZWN1bGVzXCIsXCJyb3VuZHNcIixcImxvbmdlc3RcIixcInJlZnJpZ2VyYXRvclwiLFwidGlvbnNcIixcImludGVydmFsc1wiLFwic2VudGVuY2VzXCIsXCJkZW50aXN0c1wiLFwidXNkYVwiLFwiZXhjbHVzaW9uXCIsXCJ3b3Jrc3RhdGlvblwiLFwiaG9sb2NhdXN0XCIsXCJrZWVuXCIsXCJmbHllclwiLFwicGVhc1wiLFwiZG9zYWdlXCIsXCJyZWNlaXZlcnNcIixcInVybHNcIixcImN1c3RvbWlzZVwiLFwiZGlzcG9zaXRpb25cIixcInZhcmlhbmNlXCIsXCJuYXZpZ2F0b3JcIixcImludmVzdGlnYXRvcnNcIixcImNhbWVyb29uXCIsXCJiYWtpbmdcIixcIm1hcmlqdWFuYVwiLFwiYWRhcHRpdmVcIixcImNvbXB1dGVkXCIsXCJuZWVkbGVcIixcImJhdGhzXCIsXCJlbmJcIixcImdnXCIsXCJjYXRoZWRyYWxcIixcImJyYWtlc1wiLFwib2dcIixcIm5pcnZhbmFcIixcImtvXCIsXCJmYWlyZmllbGRcIixcIm93bnNcIixcInRpbFwiLFwiaW52aXNpb25cIixcInN0aWNreVwiLFwiZGVzdGlueVwiLFwiZ2VuZXJvdXNcIixcIm1hZG5lc3NcIixcImVtYWNzXCIsXCJjbGltYlwiLFwiYmxvd2luZ1wiLFwiZmFzY2luYXRpbmdcIixcImxhbmRzY2FwZXNcIixcImhlYXRlZFwiLFwibGFmYXlldHRlXCIsXCJqYWNraWVcIixcInd0b1wiLFwiY29tcHV0YXRpb25cIixcImhheVwiLFwiY2FyZGlvdmFzY3VsYXJcIixcInd3XCIsXCJzcGFyY1wiLFwiY2FyZGlhY1wiLFwic2FsdmF0aW9uXCIsXCJkb3ZlclwiLFwiYWRyaWFuXCIsXCJwcmVkaWN0aW9uc1wiLFwiYWNjb21wYW55aW5nXCIsXCJ2YXRpY2FuXCIsXCJicnV0YWxcIixcImxlYXJuZXJzXCIsXCJnZFwiLFwic2VsZWN0aXZlXCIsXCJhcmJpdHJhdGlvblwiLFwiY29uZmlndXJpbmdcIixcInRva2VuXCIsXCJlZGl0b3JpYWxzXCIsXCJ6aW5jXCIsXCJzYWNyaWZpY2VcIixcInNlZWtlcnNcIixcImd1cnVcIixcImlzYVwiLFwicmVtb3ZhYmxlXCIsXCJjb252ZXJnZW5jZVwiLFwieWllbGRzXCIsXCJnaWJyYWx0YXJcIixcImxldnlcIixcInN1aXRlZFwiLFwibnVtZXJpY1wiLFwiYW50aHJvcG9sb2d5XCIsXCJza2F0aW5nXCIsXCJraW5kYVwiLFwiYWJlcmRlZW5cIixcImVtcGVyb3JcIixcImdyYWRcIixcIm1hbHByYWN0aWNlXCIsXCJkeWxhblwiLFwiYnJhc1wiLFwiYmVsdHNcIixcImJsYWNrc1wiLFwiZWR1Y2F0ZWRcIixcInJlYmF0ZXNcIixcInJlcG9ydGVyc1wiLFwiYnVya2VcIixcInByb3VkbHlcIixcInBpeFwiLFwibmVjZXNzaXR5XCIsXCJyZW5kZXJpbmdcIixcIm1pY1wiLFwiaW5zZXJ0ZWRcIixcInB1bGxpbmdcIixcImJhc2VuYW1lXCIsXCJreWxlXCIsXCJvYmVzaXR5XCIsXCJjdXJ2ZXNcIixcInN1YnVyYmFuXCIsXCJ0b3VyaW5nXCIsXCJjbGFyYVwiLFwidmVydGV4XCIsXCJid1wiLFwiaGVwYXRpdGlzXCIsXCJuYXRpb25hbGx5XCIsXCJ0b21hdG9cIixcImFuZG9ycmFcIixcIndhdGVycHJvb2ZcIixcImV4cGlyZWRcIixcIm1qXCIsXCJ0cmF2ZWxzXCIsXCJmbHVzaFwiLFwid2FpdmVyXCIsXCJwYWxlXCIsXCJzcGVjaWFsdGllc1wiLFwiaGF5ZXNcIixcImh1bWFuaXRhcmlhblwiLFwiaW52aXRhdGlvbnNcIixcImZ1bmN0aW9uaW5nXCIsXCJkZWxpZ2h0XCIsXCJzdXJ2aXZvclwiLFwiZ2FyY2lhXCIsXCJjaW5ndWxhclwiLFwiZWNvbm9taWVzXCIsXCJhbGV4YW5kcmlhXCIsXCJiYWN0ZXJpYWxcIixcIm1vc2VzXCIsXCJjb3VudGVkXCIsXCJ1bmRlcnRha2VcIixcImRlY2xhcmVcIixcImNvbnRpbnVvdXNseVwiLFwiam9obnNcIixcInZhbHZlc1wiLFwiZ2Fwc1wiLFwiaW1wYWlyZWRcIixcImFjaGlldmVtZW50c1wiLFwiZG9ub3JzXCIsXCJ0ZWFyXCIsXCJqZXdlbFwiLFwidGVkZHlcIixcImxmXCIsXCJjb252ZXJ0aWJsZVwiLFwiYXRhXCIsXCJ0ZWFjaGVzXCIsXCJ2ZW50dXJlc1wiLFwibmlsXCIsXCJidWZpbmdcIixcInN0cmFuZ2VyXCIsXCJ0cmFnZWR5XCIsXCJqdWxpYW5cIixcIm5lc3RcIixcInBhbVwiLFwiZHJ5ZXJcIixcInBhaW5mdWxcIixcInZlbHZldFwiLFwidHJpYnVuYWxcIixcInJ1bGVkXCIsXCJuYXRvXCIsXCJwZW5zaW9uc1wiLFwicHJheWVyc1wiLFwiZnVua3lcIixcInNlY3JldGFyaWF0XCIsXCJub3doZXJlXCIsXCJjb3BcIixcInBhcmFncmFwaHNcIixcImdhbGVcIixcImpvaW5zXCIsXCJhZG9sZXNjZW50XCIsXCJub21pbmF0aW9uc1wiLFwid2VzbGV5XCIsXCJkaW1cIixcImxhdGVseVwiLFwiY2FuY2VsbGVkXCIsXCJzY2FyeVwiLFwibWF0dHJlc3NcIixcIm1wZWdzXCIsXCJicnVuZWlcIixcImxpa2V3aXNlXCIsXCJiYW5hbmFcIixcImludHJvZHVjdG9yeVwiLFwic2xvdmFrXCIsXCJjYWtlc1wiLFwic3RhblwiLFwicmVzZXJ2b2lyXCIsXCJvY2N1cnJlbmNlXCIsXCJpZG9sXCIsXCJtaXhlclwiLFwicmVtaW5kXCIsXCJ3Y1wiLFwid29yY2VzdGVyXCIsXCJzYmpjdFwiLFwiZGVtb2dyYXBoaWNcIixcImNoYXJtaW5nXCIsXCJtYWlcIixcInRvb3RoXCIsXCJkaXNjaXBsaW5hcnlcIixcImFubm95aW5nXCIsXCJyZXNwZWN0ZWRcIixcInN0YXlzXCIsXCJkaXNjbG9zZVwiLFwiYWZmYWlyXCIsXCJkcm92ZVwiLFwid2FzaGVyXCIsXCJ1cHNldFwiLFwicmVzdHJpY3RcIixcInNwcmluZ2VyXCIsXCJiZXNpZGVcIixcIm1pbmVzXCIsXCJwb3J0cmFpdHNcIixcInJlYm91bmRcIixcImxvZ2FuXCIsXCJtZW50b3JcIixcImludGVycHJldGVkXCIsXCJldmFsdWF0aW9uc1wiLFwiZm91Z2h0XCIsXCJiYWdoZGFkXCIsXCJlbGltaW5hdGlvblwiLFwibWV0cmVzXCIsXCJoeXBvdGhldGljYWxcIixcImltbWlncmFudHNcIixcImNvbXBsaW1lbnRhcnlcIixcImhlbGljb3B0ZXJcIixcInBlbmNpbFwiLFwiZnJlZXplXCIsXCJoa1wiLFwicGVyZm9ybWVyXCIsXCJhYnVcIixcInRpdGxlZFwiLFwiY29tbWlzc2lvbnNcIixcInNwaGVyZVwiLFwicG93ZXJzZWxsZXJcIixcIm1vc3NcIixcInJhdGlvc1wiLFwiY29uY29yZFwiLFwiZ3JhZHVhdGVkXCIsXCJlbmRvcnNlZFwiLFwidHlcIixcInN1cnByaXNpbmdcIixcIndhbG51dFwiLFwibGFuY2VcIixcImxhZGRlclwiLFwiaXRhbGlhXCIsXCJ1bm5lY2Vzc2FyeVwiLFwiZHJhbWF0aWNhbGx5XCIsXCJsaWJlcmlhXCIsXCJzaGVybWFuXCIsXCJjb3JrXCIsXCJtYXhpbWl6ZVwiLFwiY2pcIixcImhhbnNlblwiLFwic2VuYXRvcnNcIixcIndvcmtvdXRcIixcIm1hbGlcIixcInl1Z29zbGF2aWFcIixcImJsZWVkaW5nXCIsXCJjaGFyYWN0ZXJpemF0aW9uXCIsXCJjb2xvblwiLFwibGlrZWxpaG9vZFwiLFwibGFuZXNcIixcInB1cnNlXCIsXCJmdW5kYW1lbnRhbHNcIixcImNvbnRhbWluYXRpb25cIixcIm10dlwiLFwiZW5kYW5nZXJlZFwiLFwiY29tcHJvbWlzZVwiLFwibWFzdHVyYmF0aW9uXCIsXCJvcHRpbWl6ZVwiLFwic3RhdGluZ1wiLFwiZG9tZVwiLFwiY2Fyb2xpbmVcIixcImxldVwiLFwiZXhwaXJhdGlvblwiLFwibmFtZXNwYWNlXCIsXCJhbGlnblwiLFwicGVyaXBoZXJhbFwiLFwiYmxlc3NcIixcImVuZ2FnaW5nXCIsXCJuZWdvdGlhdGlvblwiLFwiY3Jlc3RcIixcIm9wcG9uZW50c1wiLFwidHJpdW1waFwiLFwibm9taW5hdGVkXCIsXCJjb25maWRlbnRpYWxpdHlcIixcImVsZWN0b3JhbFwiLFwiY2hhbmdlbG9nXCIsXCJ3ZWxkaW5nXCIsXCJkZWZlcnJlZFwiLFwiYWx0ZXJuYXRpdmVseVwiLFwiaGVlbFwiLFwiYWxsb3lcIixcImNvbmRvc1wiLFwicGxvdHNcIixcInBvbGlzaGVkXCIsXCJ5YW5nXCIsXCJnZW50bHlcIixcImdyZWVuc2Jvcm9cIixcInR1bHNhXCIsXCJsb2NraW5nXCIsXCJjYXNleVwiLFwiY29udHJvdmVyc2lhbFwiLFwiZHJhd3NcIixcImZyaWRnZVwiLFwiYmxhbmtldFwiLFwiYmxvb21cIixcInFjXCIsXCJzaW1wc29uc1wiLFwibG91XCIsXCJlbGxpb3R0XCIsXCJyZWNvdmVyZWRcIixcImZyYXNlclwiLFwianVzdGlmeVwiLFwidXBncmFkaW5nXCIsXCJibGFkZXNcIixcInBncFwiLFwibG9vcHNcIixcInN1cmdlXCIsXCJmcm9udHBhZ2VcIixcInRyYXVtYVwiLFwiYXdcIixcInRhaG9lXCIsXCJhZHZlcnRcIixcInBvc3Nlc3NcIixcImRlbWFuZGluZ1wiLFwiZGVmZW5zaXZlXCIsXCJzaXBcIixcImZsYXNoZXJzXCIsXCJzdWJhcnVcIixcImZvcmJpZGRlblwiLFwidGZcIixcInZhbmlsbGFcIixcInByb2dyYW1tZXJzXCIsXCJwalwiLFwibW9uaXRvcmVkXCIsXCJpbnN0YWxsYXRpb25zXCIsXCJkZXV0c2NobGFuZFwiLFwicGljbmljXCIsXCJzb3Vsc1wiLFwiYXJyaXZhbHNcIixcInNwYW5rXCIsXCJjd1wiLFwicHJhY3RpdGlvbmVyXCIsXCJtb3RpdmF0ZWRcIixcIndyXCIsXCJkdW1iXCIsXCJzbWl0aHNvbmlhblwiLFwiaG9sbG93XCIsXCJ2YXVsdFwiLFwic2VjdXJlbHlcIixcImV4YW1pbmluZ1wiLFwiZmlvcmljZXRcIixcImdyb292ZVwiLFwicmV2ZWxhdGlvblwiLFwicmdcIixcInB1cnN1aXRcIixcImRlbGVnYXRpb25cIixcIndpcmVzXCIsXCJibFwiLFwiZGljdGlvbmFyaWVzXCIsXCJtYWlsc1wiLFwiYmFja2luZ1wiLFwiZ3JlZW5ob3VzZVwiLFwic2xlZXBzXCIsXCJ2Y1wiLFwiYmxha2VcIixcInRyYW5zcGFyZW5jeVwiLFwiZGVlXCIsXCJ0cmF2aXNcIixcInd4XCIsXCJlbmRsZXNzXCIsXCJmaWd1cmVkXCIsXCJvcmJpdFwiLFwiY3VycmVuY2llc1wiLFwibmlnZXJcIixcImJhY29uXCIsXCJzdXJ2aXZvcnNcIixcInBvc2l0aW9uaW5nXCIsXCJoZWF0ZXJcIixcImNvbG9ueVwiLFwiY2Fubm9uXCIsXCJjaXJjdXNcIixcInByb21vdGVkXCIsXCJmb3JiZXNcIixcIm1hZVwiLFwibW9sZG92YVwiLFwibWVsXCIsXCJkZXNjZW5kaW5nXCIsXCJwYXhpbFwiLFwic3BpbmVcIixcInRyb3V0XCIsXCJlbmNsb3NlZFwiLFwiZmVhdFwiLFwidGVtcG9yYXJpbHlcIixcIm50c2NcIixcImNvb2tlZFwiLFwidGhyaWxsZXJcIixcInRyYW5zbWl0XCIsXCJhcG5pY1wiLFwiZmF0dHlcIixcImdlcmFsZFwiLFwicHJlc3NlZFwiLFwiZnJlcXVlbmNpZXNcIixcInNjYW5uZWRcIixcInJlZmxlY3Rpb25zXCIsXCJodW5nZXJcIixcIm1hcmlhaFwiLFwic2ljXCIsXCJtdW5pY2lwYWxpdHlcIixcInVzcHNcIixcImpveWNlXCIsXCJkZXRlY3RpdmVcIixcInN1cmdlb25cIixcImNlbWVudFwiLFwiZXhwZXJpZW5jaW5nXCIsXCJmaXJlcGxhY2VcIixcImVuZG9yc2VtZW50XCIsXCJiZ1wiLFwicGxhbm5lcnNcIixcImRpc3B1dGVzXCIsXCJ0ZXh0aWxlc1wiLFwibWlzc2lsZVwiLFwiaW50cmFuZXRcIixcImNsb3Nlc1wiLFwic2VxXCIsXCJwc3ljaGlhdHJ5XCIsXCJwZXJzaXN0ZW50XCIsXCJkZWJvcmFoXCIsXCJjb25mXCIsXCJtYXJjb1wiLFwiYXNzaXN0c1wiLFwic3VtbWFyaWVzXCIsXCJnbG93XCIsXCJnYWJyaWVsXCIsXCJhdWRpdG9yXCIsXCJ3bWFcIixcImFxdWFyaXVtXCIsXCJ2aW9saW5cIixcInByb3BoZXRcIixcImNpclwiLFwiYnJhY2tldFwiLFwibG9va3NtYXJ0XCIsXCJpc2FhY1wiLFwib3hpZGVcIixcIm9ha3NcIixcIm1hZ25pZmljZW50XCIsXCJlcmlrXCIsXCJjb2xsZWFndWVcIixcIm5hcGxlc1wiLFwicHJvbXB0bHlcIixcIm1vZGVtc1wiLFwiYWRhcHRhdGlvblwiLFwiaHVcIixcImhhcm1mdWxcIixcInBhaW50YmFsbFwiLFwicHJvemFjXCIsXCJzZXh1YWxseVwiLFwiZW5jbG9zdXJlXCIsXCJhY21cIixcImRpdmlkZW5kXCIsXCJuZXdhcmtcIixcImt3XCIsXCJwYXNvXCIsXCJnbHVjb3NlXCIsXCJwaGFudG9tXCIsXCJub3JtXCIsXCJwbGF5YmFja1wiLFwic3VwZXJ2aXNvcnNcIixcIndlc3RtaW5zdGVyXCIsXCJ0dXJ0bGVcIixcImlwc1wiLFwiZGlzdGFuY2VzXCIsXCJhYnNvcnB0aW9uXCIsXCJ0cmVhc3VyZXNcIixcImRzY1wiLFwid2FybmVkXCIsXCJuZXVyYWxcIixcIndhcmVcIixcImZvc3NpbFwiLFwibWlhXCIsXCJob21ldG93blwiLFwiYmFkbHlcIixcInRyYW5zY3JpcHRzXCIsXCJhcG9sbG9cIixcIndhblwiLFwiZGlzYXBwb2ludGVkXCIsXCJwZXJzaWFuXCIsXCJjb250aW51YWxseVwiLFwiY29tbXVuaXN0XCIsXCJjb2xsZWN0aWJsZVwiLFwiaGFuZG1hZGVcIixcImdyZWVuZVwiLFwiZW50cmVwcmVuZXVyc1wiLFwicm9ib3RzXCIsXCJncmVuYWRhXCIsXCJjcmVhdGlvbnNcIixcImphZGVcIixcInNjb29wXCIsXCJhY3F1aXNpdGlvbnNcIixcImZvdWxcIixcImtlbm9cIixcImd0a1wiLFwiZWFybmluZ1wiLFwibWFpbG1hblwiLFwic2FueW9cIixcIm5lc3RlZFwiLFwiYmlvZGl2ZXJzaXR5XCIsXCJleGNpdGVtZW50XCIsXCJzb21hbGlhXCIsXCJtb3ZlcnNcIixcInZlcmJhbFwiLFwiYmxpbmtcIixcInByZXNlbnRseVwiLFwic2Vhc1wiLFwiY2FybG9cIixcIndvcmtmbG93XCIsXCJteXN0ZXJpb3VzXCIsXCJub3ZlbHR5XCIsXCJicnlhbnRcIixcInRpbGVzXCIsXCJ2b3l1ZXJcIixcImxpYnJhcmlhblwiLFwic3Vic2lkaWFyaWVzXCIsXCJzd2l0Y2hlZFwiLFwic3RvY2tob2xtXCIsXCJ0YW1pbFwiLFwiZ2FybWluXCIsXCJydVwiLFwicG9zZVwiLFwiZnV6enlcIixcImluZG9uZXNpYW5cIixcImdyYW1zXCIsXCJ0aGVyYXBpc3RcIixcInJpY2hhcmRzXCIsXCJtcm5hXCIsXCJidWRnZXRzXCIsXCJ0b29sa2l0XCIsXCJwcm9taXNpbmdcIixcInJlbGF4YXRpb25cIixcImdvYXRcIixcInJlbmRlclwiLFwiY2FybWVuXCIsXCJpcmFcIixcInNlblwiLFwidGhlcmVhZnRlclwiLFwiaGFyZHdvb2RcIixcImVyb3RpY2FcIixcInRlbXBvcmFsXCIsXCJzYWlsXCIsXCJmb3JnZVwiLFwiY29tbWlzc2lvbmVyc1wiLFwiZGVuc2VcIixcImR0c1wiLFwiYnJhdmVcIixcImZvcndhcmRpbmdcIixcInF0XCIsXCJhd2Z1bFwiLFwibmlnaHRtYXJlXCIsXCJhaXJwbGFuZVwiLFwicmVkdWN0aW9uc1wiLFwic291dGhhbXB0b25cIixcImlzdGFuYnVsXCIsXCJpbXBvc2VcIixcIm9yZ2FuaXNtc1wiLFwic2VnYVwiLFwidGVsZXNjb3BlXCIsXCJ2aWV3ZXJzXCIsXCJhc2Jlc3Rvc1wiLFwicG9ydHNtb3V0aFwiLFwiY2RuYVwiLFwibWV5ZXJcIixcImVudGVyc1wiLFwicG9kXCIsXCJzYXZhZ2VcIixcImFkdmFuY2VtZW50XCIsXCJ3dVwiLFwiaGFyYXNzbWVudFwiLFwid2lsbG93XCIsXCJyZXN1bWVzXCIsXCJib2x0XCIsXCJnYWdlXCIsXCJ0aHJvd2luZ1wiLFwiZXhpc3RlZFwiLFwiZ2VuZXJhdG9yc1wiLFwibHVcIixcIndhZ29uXCIsXCJiYXJiaWVcIixcImRhdFwiLFwiZmF2b3VyXCIsXCJzb2FcIixcImtub2NrXCIsXCJ1cmdlXCIsXCJzbXRwXCIsXCJnZW5lcmF0ZXNcIixcInBvdGF0b2VzXCIsXCJ0aG9yb3VnaFwiLFwicmVwbGljYXRpb25cIixcImluZXhwZW5zaXZlXCIsXCJrdXJ0XCIsXCJyZWNlcHRvcnNcIixcInBlZXJzXCIsXCJyb2xhbmRcIixcIm9wdGltdW1cIixcIm5lb25cIixcImludGVydmVudGlvbnNcIixcInF1aWx0XCIsXCJodW50aW5ndG9uXCIsXCJjcmVhdHVyZVwiLFwib3Vyc1wiLFwibW91bnRzXCIsXCJzeXJhY3VzZVwiLFwiaW50ZXJuc2hpcFwiLFwibG9uZVwiLFwicmVmcmVzaFwiLFwiYWx1bWluaXVtXCIsXCJzbm93Ym9hcmRcIixcImJlYXN0YWxpdHlcIixcIndlYmNhc3RcIixcIm1pY2hlbFwiLFwiZXZhbmVzY2VuY2VcIixcInN1YnRsZVwiLFwiY29vcmRpbmF0ZWRcIixcIm5vdHJlXCIsXCJzaGlwbWVudHNcIixcIm1hbGRpdmVzXCIsXCJzdHJpcGVzXCIsXCJmaXJtd2FyZVwiLFwiYW50YXJjdGljYVwiLFwiY29wZVwiLFwic2hlcGhlcmRcIixcImxtXCIsXCJjYW5iZXJyYVwiLFwiY3JhZGxlXCIsXCJjaGFuY2VsbG9yXCIsXCJtYW1ib1wiLFwibGltZVwiLFwia2lya1wiLFwiZmxvdXJcIixcImNvbnRyb3ZlcnN5XCIsXCJsZWdlbmRhcnlcIixcImJvb2xcIixcInN5bXBhdGh5XCIsXCJjaG9pclwiLFwiYXZvaWRpbmdcIixcImJlYXV0aWZ1bGx5XCIsXCJibG9uZFwiLFwiZXhwZWN0c1wiLFwiY2hvXCIsXCJqdW1waW5nXCIsXCJmYWJyaWNzXCIsXCJhbnRpYm9kaWVzXCIsXCJwb2x5bWVyXCIsXCJoeWdpZW5lXCIsXCJ3aXRcIixcInBvdWx0cnlcIixcInZpcnR1ZVwiLFwiYnVyc3RcIixcImV4YW1pbmF0aW9uc1wiLFwic3VyZ2VvbnNcIixcImJvdXF1ZXRcIixcImltbXVub2xvZ3lcIixcInByb21vdGVzXCIsXCJtYW5kYXRlXCIsXCJ3aWxleVwiLFwiZGVwYXJ0bWVudGFsXCIsXCJiYnNcIixcInNwYXNcIixcImluZFwiLFwiY29ycHVzXCIsXCJqb2huc3RvblwiLFwidGVybWlub2xvZ3lcIixcImdlbnRsZW1hblwiLFwiZmlicmVcIixcInJlcHJvZHVjZVwiLFwiY29udmljdGVkXCIsXCJzaGFkZXNcIixcImpldHNcIixcImluZGljZXNcIixcInJvb21tYXRlc1wiLFwiYWR3YXJlXCIsXCJxdWlcIixcImludGxcIixcInRocmVhdGVuaW5nXCIsXCJzcG9rZXNtYW5cIixcInpvbG9mdFwiLFwiYWN0aXZpc3RzXCIsXCJmcmFua2Z1cnRcIixcInByaXNvbmVyXCIsXCJkYWlzeVwiLFwiaGFsaWZheFwiLFwiZW5jb3VyYWdlc1wiLFwidWx0cmFtXCIsXCJjdXJzb3JcIixcImFzc2VtYmxlZFwiLFwiZWFybGllc3RcIixcImRvbmF0ZWRcIixcInN0dWZmZWRcIixcInJlc3RydWN0dXJpbmdcIixcImluc2VjdHNcIixcInRlcm1pbmFsc1wiLFwiY3J1ZGVcIixcIm1vcnJpc29uXCIsXCJtYWlkZW5cIixcInNpbXVsYXRpb25zXCIsXCJjelwiLFwic3VmZmljaWVudGx5XCIsXCJleGFtaW5lc1wiLFwidmlraW5nXCIsXCJteXJ0bGVcIixcImJvcmVkXCIsXCJjbGVhbnVwXCIsXCJ5YXJuXCIsXCJrbml0XCIsXCJjb25kaXRpb25hbFwiLFwibXVnXCIsXCJjcm9zc3dvcmRcIixcImJvdGhlclwiLFwiYnVkYXBlc3RcIixcImNvbmNlcHR1YWxcIixcImtuaXR0aW5nXCIsXCJhdHRhY2tlZFwiLFwiaGxcIixcImJodXRhblwiLFwibGllY2h0ZW5zdGVpblwiLFwibWF0aW5nXCIsXCJjb21wdXRlXCIsXCJyZWRoZWFkXCIsXCJhcnJpdmVzXCIsXCJ0cmFuc2xhdG9yXCIsXCJhdXRvbW9iaWxlc1wiLFwidHJhY3RvclwiLFwiYWxsYWhcIixcImNvbnRpbmVudFwiLFwib2JcIixcInVud3JhcFwiLFwiZmFyZXNcIixcImxvbmdpdHVkZVwiLFwicmVzaXN0XCIsXCJjaGFsbGVuZ2VkXCIsXCJ0ZWxlY2hhcmdlclwiLFwiaG9wZWRcIixcInBpa2VcIixcInNhZmVyXCIsXCJpbnNlcnRpb25cIixcImluc3RydW1lbnRhdGlvblwiLFwiaWRzXCIsXCJodWdvXCIsXCJ3YWduZXJcIixcImNvbnN0cmFpbnRcIixcImdyb3VuZHdhdGVyXCIsXCJ0b3VjaGVkXCIsXCJzdHJlbmd0aGVuaW5nXCIsXCJjb2xvZ25lXCIsXCJnemlwXCIsXCJ3aXNoaW5nXCIsXCJyYW5nZXJcIixcInNtYWxsZXN0XCIsXCJpbnN1bGF0aW9uXCIsXCJuZXdtYW5cIixcIm1hcnNoXCIsXCJyaWNreVwiLFwiY3RybFwiLFwic2NhcmVkXCIsXCJ0aGV0YVwiLFwiaW5mcmluZ2VtZW50XCIsXCJiZW50XCIsXCJsYW9zXCIsXCJzdWJqZWN0aXZlXCIsXCJtb25zdGVyc1wiLFwiYXN5bHVtXCIsXCJsaWdodGJveFwiLFwicm9iYmllXCIsXCJzdGFrZVwiLFwiY29ja3RhaWxcIixcIm91dGxldHNcIixcInN3YXppbGFuZFwiLFwidmFyaWV0aWVzXCIsXCJhcmJvclwiLFwibWVkaWF3aWtpXCIsXCJjb25maWd1cmF0aW9uc1wiLFwicG9pc29uXCIsXCJcIl07XG5cbi8qIFxuIEFzayBmb3Igd29yZCBzdWdnZXN0aW9ucyB0aGF0IHdvdWxkIGZpdCBpbiBhIGNlcnRhaW4gcGF0dGVybi5cbiBUaGUgcGF0dGVybiBpcyBkZWZpbmVkIGJ5IHVzaW5nID8ncyBmb3IgdGhlIGJsYW5rIGxldHRlcnNcbiBBIG1heGltdW0gb2YgdGhyZWUgYW5kIGEgbWluaW11bSBvZiBubyB3b3JkcyBhcmUgcmV0dXJuZWQuXG4gSWYgdGhlIHJlc3VsdGluZyBzZXQgaXMgbW9yZSB0aGFuIHRocmVlIHdvcmRzLCB0aGUgcmVzdWx0aW5nIHRocmVlIFxuIHdpbGwgYmUgc2VsZWN0ZWQgcmFuZG9tbHkuXG4gZWcuIFwiP3g/P3I/XCIgbWlnaHQgc3VnZ2VzdCBcImp4d29yZFwiXG4qL1xuZnVuY3Rpb24gc3VnZ2VzdChwYXR0ZXJuKSB7XG4gICAgcGF0dGVybiA9IHBhdHRlcm4udG9Mb3dlckNhc2UoKTtcbiAgICAvLyBGaXJzdCBsZXQncyBqdXN0IGNvbnNpZGVyIHdvcmRzIG9mIHRoZSBjb3JyZWN0IGxlbmd0aFxuICAgIGxldCBtYXRjaGVzID0gd29yZHMuZmlsdGVyKHdvcmQgPT4gd29yZC5sZW5ndGggPT09IHBhdHRlcm4ubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdHRlcm4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHBhdHRlcm5baV0gIT09IFwiP1wiKSB7XG4gICAgICAgICAgICBtYXRjaGVzID0gbWF0Y2hlcy5maWx0ZXIod29yZCA9PiB3b3JkW2ldID09PSBwYXR0ZXJuW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobWF0Y2hlcy5sZW5ndGggPD0gMykgcmV0dXJuIG1hdGNoZXM7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgIGxldCBpbmRleCA9IE1hdGgucmFuZG9tKCkgKiBtYXRjaGVzLmxlbmd0aDtcbiAgICAgICAgcmVzdWx0LnB1c2goLi4ubWF0Y2hlcy5zcGxpY2UoaW5kZXgsIDEpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyogc3JjL1F1ZXN0aW9uLnN2ZWx0ZSBnZW5lcmF0ZWQgYnkgU3ZlbHRlIHYzLjQ2LjQgKi9cblxuZnVuY3Rpb24gZ2V0X2VhY2hfY29udGV4dCQyKGN0eCwgbGlzdCwgaSkge1xuXHRjb25zdCBjaGlsZF9jdHggPSBjdHguc2xpY2UoKTtcblx0Y2hpbGRfY3R4WzE2XSA9IGxpc3RbaV07XG5cdHJldHVybiBjaGlsZF9jdHg7XG59XG5cbi8vICg4NDo0KSB7OmVsc2V9XG5mdW5jdGlvbiBjcmVhdGVfZWxzZV9ibG9jayQxKGN0eCkge1xuXHRsZXQgZGl2O1xuXHRsZXQgdDBfdmFsdWUgPSAvKnF1ZXN0aW9uKi8gY3R4WzBdLm51bSArIFwiXCI7XG5cdGxldCB0MDtcblx0bGV0IHQxO1xuXHRsZXQgdDJfdmFsdWUgPSAoLypxdWVzdGlvbiovIGN0eFswXS5xdWVzdGlvbiB8fCBcIk5vIHF1ZXN0aW9uIHNldFwiKSArIFwiXCI7XG5cdGxldCB0Mjtcblx0bGV0IHQzO1xuXHRsZXQgdDRfdmFsdWUgPSAvKnF1ZXN0aW9uKi8gY3R4WzBdLmFuc3dlciArIFwiXCI7XG5cdGxldCB0NDtcblx0bGV0IHQ1O1xuXHRsZXQgbW91bnRlZDtcblx0bGV0IGRpc3Bvc2U7XG5cdGxldCBpZl9ibG9jayA9IC8qc3VnZ2VzdGlvbnMqLyBjdHhbMV0ubGVuZ3RoICYmIGNyZWF0ZV9pZl9ibG9ja18xJDEoY3R4KTtcblxuXHRyZXR1cm4ge1xuXHRcdGMoKSB7XG5cdFx0XHRkaXYgPSBlbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0dDAgPSB0ZXh0KHQwX3ZhbHVlKTtcblx0XHRcdHQxID0gdGV4dChcIjogXCIpO1xuXHRcdFx0dDIgPSB0ZXh0KHQyX3ZhbHVlKTtcblx0XHRcdHQzID0gdGV4dChcIiB+IFwiKTtcblx0XHRcdHQ0ID0gdGV4dCh0NF92YWx1ZSk7XG5cdFx0XHR0NSA9IHNwYWNlKCk7XG5cdFx0XHRpZiAoaWZfYmxvY2spIGlmX2Jsb2NrLmMoKTtcblx0XHRcdGF0dHIoZGl2LCBcImNsYXNzXCIsIFwianh3b3JkLXF1ZXN0aW9uIHN2ZWx0ZS0xYmhoaW43XCIpO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0aW5zZXJ0KHRhcmdldCwgZGl2LCBhbmNob3IpO1xuXHRcdFx0YXBwZW5kKGRpdiwgdDApO1xuXHRcdFx0YXBwZW5kKGRpdiwgdDEpO1xuXHRcdFx0YXBwZW5kKGRpdiwgdDIpO1xuXHRcdFx0YXBwZW5kKGRpdiwgdDMpO1xuXHRcdFx0YXBwZW5kKGRpdiwgdDQpO1xuXHRcdFx0YXBwZW5kKGRpdiwgdDUpO1xuXHRcdFx0aWYgKGlmX2Jsb2NrKSBpZl9ibG9jay5tKGRpdiwgbnVsbCk7XG5cblx0XHRcdGlmICghbW91bnRlZCkge1xuXHRcdFx0XHRkaXNwb3NlID0gbGlzdGVuKGRpdiwgXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0aWYgKGlzX2Z1bmN0aW9uKC8qZWRpdFF1ZXN0aW9uKi8gY3R4WzNdKC8qcXVlc3Rpb24qLyBjdHhbMF0pKSkgLyplZGl0UXVlc3Rpb24qLyBjdHhbM10oLypxdWVzdGlvbiovIGN0eFswXSkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0bW91bnRlZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRwKG5ld19jdHgsIGRpcnR5KSB7XG5cdFx0XHRjdHggPSBuZXdfY3R4O1xuXHRcdFx0aWYgKGRpcnR5ICYgLypxdWVzdGlvbiovIDEgJiYgdDBfdmFsdWUgIT09ICh0MF92YWx1ZSA9IC8qcXVlc3Rpb24qLyBjdHhbMF0ubnVtICsgXCJcIikpIHNldF9kYXRhKHQwLCB0MF92YWx1ZSk7XG5cdFx0XHRpZiAoZGlydHkgJiAvKnF1ZXN0aW9uKi8gMSAmJiB0Ml92YWx1ZSAhPT0gKHQyX3ZhbHVlID0gKC8qcXVlc3Rpb24qLyBjdHhbMF0ucXVlc3Rpb24gfHwgXCJObyBxdWVzdGlvbiBzZXRcIikgKyBcIlwiKSkgc2V0X2RhdGEodDIsIHQyX3ZhbHVlKTtcblx0XHRcdGlmIChkaXJ0eSAmIC8qcXVlc3Rpb24qLyAxICYmIHQ0X3ZhbHVlICE9PSAodDRfdmFsdWUgPSAvKnF1ZXN0aW9uKi8gY3R4WzBdLmFuc3dlciArIFwiXCIpKSBzZXRfZGF0YSh0NCwgdDRfdmFsdWUpO1xuXG5cdFx0XHRpZiAoLypzdWdnZXN0aW9ucyovIGN0eFsxXS5sZW5ndGgpIHtcblx0XHRcdFx0aWYgKGlmX2Jsb2NrKSB7XG5cdFx0XHRcdFx0aWZfYmxvY2sucChjdHgsIGRpcnR5KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRpZl9ibG9jayA9IGNyZWF0ZV9pZl9ibG9ja18xJDEoY3R4KTtcblx0XHRcdFx0XHRpZl9ibG9jay5jKCk7XG5cdFx0XHRcdFx0aWZfYmxvY2subShkaXYsIG51bGwpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKGlmX2Jsb2NrKSB7XG5cdFx0XHRcdGlmX2Jsb2NrLmQoMSk7XG5cdFx0XHRcdGlmX2Jsb2NrID0gbnVsbDtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2goZGl2KTtcblx0XHRcdGlmIChpZl9ibG9jaykgaWZfYmxvY2suZCgpO1xuXHRcdFx0bW91bnRlZCA9IGZhbHNlO1xuXHRcdFx0ZGlzcG9zZSgpO1xuXHRcdH1cblx0fTtcbn1cblxuLy8gKDczOjQpIHsjaWYgcXVlc3Rpb24uZWRpdGluZ31cbmZ1bmN0aW9uIGNyZWF0ZV9pZl9ibG9jayQxKGN0eCkge1xuXHRsZXQgZGl2Mztcblx0bGV0IGRpdjA7XG5cdGxldCBzcGFuO1xuXHRsZXQgdDBfdmFsdWUgPSAvKnF1ZXN0aW9uKi8gY3R4WzBdLm51bSArIFwiXCI7XG5cdGxldCB0MDtcblx0bGV0IHQxO1xuXHRsZXQgaW5wdXQ7XG5cdGxldCB0Mjtcblx0bGV0IGRpdjE7XG5cdGxldCB0M192YWx1ZSA9IC8qcXVlc3Rpb24qLyBjdHhbMF0uYW5zd2VyICsgXCJcIjtcblx0bGV0IHQzO1xuXHRsZXQgdDQ7XG5cdGxldCBkaXYyO1xuXHRsZXQgbW91bnRlZDtcblx0bGV0IGRpc3Bvc2U7XG5cblx0cmV0dXJuIHtcblx0XHRjKCkge1xuXHRcdFx0ZGl2MyA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRkaXYwID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdHNwYW4gPSBlbGVtZW50KFwic3BhblwiKTtcblx0XHRcdHQwID0gdGV4dCh0MF92YWx1ZSk7XG5cdFx0XHR0MSA9IHNwYWNlKCk7XG5cdFx0XHRpbnB1dCA9IGVsZW1lbnQoXCJpbnB1dFwiKTtcblx0XHRcdHQyID0gc3BhY2UoKTtcblx0XHRcdGRpdjEgPSBlbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0dDMgPSB0ZXh0KHQzX3ZhbHVlKTtcblx0XHRcdHQ0ID0gc3BhY2UoKTtcblx0XHRcdGRpdjIgPSBlbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0ZGl2Mi50ZXh0Q29udGVudCA9IFwiU2F2ZVwiO1xuXHRcdFx0YXR0cihkaXYwLCBcImNsYXNzXCIsIFwianh3b3JkLXF1ZXN0aW9uLW51bWJlclwiKTtcblx0XHRcdGF0dHIoaW5wdXQsIFwidHlwZVwiLCBcInRleHRcIik7XG5cdFx0XHRhdHRyKGlucHV0LCBcImNsYXNzXCIsIFwianh3b3JkLXF1ZXN0aW9uLXRleHRcIik7XG5cdFx0XHRpbnB1dC5hdXRvZm9jdXMgPSB0cnVlO1xuXHRcdFx0YXR0cihkaXYxLCBcImNsYXNzXCIsIFwianh3b3JkLXF1ZXN0aW9uLWFuc3dlclwiKTtcblx0XHRcdGF0dHIoZGl2MiwgXCJjbGFzc1wiLCBcImJ0biBzdmVsdGUtMWJoaGluN1wiKTtcblx0XHRcdGF0dHIoZGl2MywgXCJjbGFzc1wiLCBcImp4d29yZC1xdWVzdGlvbiBqeHdvcmQtcXVlc3Rpb24tZWRpdGluZyBzdmVsdGUtMWJoaGluN1wiKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGluc2VydCh0YXJnZXQsIGRpdjMsIGFuY2hvcik7XG5cdFx0XHRhcHBlbmQoZGl2MywgZGl2MCk7XG5cdFx0XHRhcHBlbmQoZGl2MCwgc3Bhbik7XG5cdFx0XHRhcHBlbmQoc3BhbiwgdDApO1xuXHRcdFx0YXBwZW5kKGRpdjMsIHQxKTtcblx0XHRcdGFwcGVuZChkaXYzLCBpbnB1dCk7XG5cdFx0XHRzZXRfaW5wdXRfdmFsdWUoaW5wdXQsIC8qcXVlc3Rpb24qLyBjdHhbMF0ucXVlc3Rpb24pO1xuXHRcdFx0YXBwZW5kKGRpdjMsIHQyKTtcblx0XHRcdGFwcGVuZChkaXYzLCBkaXYxKTtcblx0XHRcdGFwcGVuZChkaXYxLCB0Myk7XG5cdFx0XHRhcHBlbmQoZGl2MywgdDQpO1xuXHRcdFx0YXBwZW5kKGRpdjMsIGRpdjIpO1xuXHRcdFx0aW5wdXQuZm9jdXMoKTtcblxuXHRcdFx0aWYgKCFtb3VudGVkKSB7XG5cdFx0XHRcdGRpc3Bvc2UgPSBbXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0LCBcImlucHV0XCIsIC8qaW5wdXRfaW5wdXRfaGFuZGxlciovIGN0eFsxMl0pLFxuXHRcdFx0XHRcdGxpc3RlbihpbnB1dCwgXCJrZXlkb3duXCIsIC8qaGFuZGxlS2V5ZG93biovIGN0eFs1XSksXG5cdFx0XHRcdFx0bGlzdGVuKGRpdjIsIFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0aWYgKGlzX2Z1bmN0aW9uKC8qc2F2ZVF1ZXN0aW9uKi8gY3R4WzRdKC8qcXVlc3Rpb24qLyBjdHhbMF0pKSkgLypzYXZlUXVlc3Rpb24qLyBjdHhbNF0oLypxdWVzdGlvbiovIGN0eFswXSkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRdO1xuXG5cdFx0XHRcdG1vdW50ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cChuZXdfY3R4LCBkaXJ0eSkge1xuXHRcdFx0Y3R4ID0gbmV3X2N0eDtcblx0XHRcdGlmIChkaXJ0eSAmIC8qcXVlc3Rpb24qLyAxICYmIHQwX3ZhbHVlICE9PSAodDBfdmFsdWUgPSAvKnF1ZXN0aW9uKi8gY3R4WzBdLm51bSArIFwiXCIpKSBzZXRfZGF0YSh0MCwgdDBfdmFsdWUpO1xuXG5cdFx0XHRpZiAoZGlydHkgJiAvKnF1ZXN0aW9uKi8gMSAmJiBpbnB1dC52YWx1ZSAhPT0gLypxdWVzdGlvbiovIGN0eFswXS5xdWVzdGlvbikge1xuXHRcdFx0XHRzZXRfaW5wdXRfdmFsdWUoaW5wdXQsIC8qcXVlc3Rpb24qLyBjdHhbMF0ucXVlc3Rpb24pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHkgJiAvKnF1ZXN0aW9uKi8gMSAmJiB0M192YWx1ZSAhPT0gKHQzX3ZhbHVlID0gLypxdWVzdGlvbiovIGN0eFswXS5hbnN3ZXIgKyBcIlwiKSkgc2V0X2RhdGEodDMsIHQzX3ZhbHVlKTtcblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2goZGl2Myk7XG5cdFx0XHRtb3VudGVkID0gZmFsc2U7XG5cdFx0XHRydW5fYWxsKGRpc3Bvc2UpO1xuXHRcdH1cblx0fTtcbn1cblxuLy8gKDg2OjQpIHsjaWYgc3VnZ2VzdGlvbnMubGVuZ3RofVxuZnVuY3Rpb24gY3JlYXRlX2lmX2Jsb2NrXzEkMShjdHgpIHtcblx0bGV0IGVhY2hfMV9hbmNob3I7XG5cdGxldCBlYWNoX3ZhbHVlID0gLypzdWdnZXN0aW9ucyovIGN0eFsxXTtcblx0bGV0IGVhY2hfYmxvY2tzID0gW107XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX3ZhbHVlLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0ZWFjaF9ibG9ja3NbaV0gPSBjcmVhdGVfZWFjaF9ibG9jayQyKGdldF9lYWNoX2NvbnRleHQkMihjdHgsIGVhY2hfdmFsdWUsIGkpKTtcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF9ibG9ja3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0uYygpO1xuXHRcdFx0fVxuXG5cdFx0XHRlYWNoXzFfYW5jaG9yID0gZW1wdHkoKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF9ibG9ja3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0ubSh0YXJnZXQsIGFuY2hvcik7XG5cdFx0XHR9XG5cblx0XHRcdGluc2VydCh0YXJnZXQsIGVhY2hfMV9hbmNob3IsIGFuY2hvcik7XG5cdFx0fSxcblx0XHRwKGN0eCwgZGlydHkpIHtcblx0XHRcdGlmIChkaXJ0eSAmIC8qdXNlU3VnZ2VzdGlvbiwgc3VnZ2VzdGlvbnMqLyA2Nikge1xuXHRcdFx0XHRlYWNoX3ZhbHVlID0gLypzdWdnZXN0aW9ucyovIGN0eFsxXTtcblx0XHRcdFx0bGV0IGk7XG5cblx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGVhY2hfdmFsdWUubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRjb25zdCBjaGlsZF9jdHggPSBnZXRfZWFjaF9jb250ZXh0JDIoY3R4LCBlYWNoX3ZhbHVlLCBpKTtcblxuXHRcdFx0XHRcdGlmIChlYWNoX2Jsb2Nrc1tpXSkge1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0ucChjaGlsZF9jdHgsIGRpcnR5KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0gPSBjcmVhdGVfZWFjaF9ibG9jayQyKGNoaWxkX2N0eCk7XG5cdFx0XHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5jKCk7XG5cdFx0XHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5tKGVhY2hfMV9hbmNob3IucGFyZW50Tm9kZSwgZWFjaF8xX2FuY2hvcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Zm9yICg7IGkgPCBlYWNoX2Jsb2Nrcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldLmQoMSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRlYWNoX2Jsb2Nrcy5sZW5ndGggPSBlYWNoX3ZhbHVlLmxlbmd0aDtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRkZXN0cm95X2VhY2goZWFjaF9ibG9ja3MsIGRldGFjaGluZyk7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2goZWFjaF8xX2FuY2hvcik7XG5cdFx0fVxuXHR9O1xufVxuXG4vLyAoODc6OCkgeyNlYWNoIHN1Z2dlc3Rpb25zIGFzIHN1Z2dlc3Rpb259XG5mdW5jdGlvbiBjcmVhdGVfZWFjaF9ibG9jayQyKGN0eCkge1xuXHRsZXQgc3Bhbjtcblx0bGV0IHRfdmFsdWUgPSAvKnN1Z2dlc3Rpb24qLyBjdHhbMTZdICsgXCJcIjtcblx0bGV0IHQ7XG5cdGxldCBtb3VudGVkO1xuXHRsZXQgZGlzcG9zZTtcblxuXHRyZXR1cm4ge1xuXHRcdGMoKSB7XG5cdFx0XHRzcGFuID0gZWxlbWVudChcInNwYW5cIik7XG5cdFx0XHR0ID0gdGV4dCh0X3ZhbHVlKTtcblx0XHRcdGF0dHIoc3BhbiwgXCJjbGFzc1wiLCBcInN1Z2dlc3Rpb24gc3ZlbHRlLTFiaGhpbjdcIik7XG5cdFx0fSxcblx0XHRtKHRhcmdldCwgYW5jaG9yKSB7XG5cdFx0XHRpbnNlcnQodGFyZ2V0LCBzcGFuLCBhbmNob3IpO1xuXHRcdFx0YXBwZW5kKHNwYW4sIHQpO1xuXG5cdFx0XHRpZiAoIW1vdW50ZWQpIHtcblx0XHRcdFx0ZGlzcG9zZSA9IGxpc3RlbihzcGFuLCBcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRpZiAoaXNfZnVuY3Rpb24oLyp1c2VTdWdnZXN0aW9uKi8gY3R4WzZdKC8qc3VnZ2VzdGlvbiovIGN0eFsxNl0pKSkgLyp1c2VTdWdnZXN0aW9uKi8gY3R4WzZdKC8qc3VnZ2VzdGlvbiovIGN0eFsxNl0pLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdG1vdW50ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cChuZXdfY3R4LCBkaXJ0eSkge1xuXHRcdFx0Y3R4ID0gbmV3X2N0eDtcblx0XHRcdGlmIChkaXJ0eSAmIC8qc3VnZ2VzdGlvbnMqLyAyICYmIHRfdmFsdWUgIT09ICh0X3ZhbHVlID0gLypzdWdnZXN0aW9uKi8gY3R4WzE2XSArIFwiXCIpKSBzZXRfZGF0YSh0LCB0X3ZhbHVlKTtcblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2goc3Bhbik7XG5cdFx0XHRtb3VudGVkID0gZmFsc2U7XG5cdFx0XHRkaXNwb3NlKCk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVfZnJhZ21lbnQkNChjdHgpIHtcblx0bGV0IG1haW47XG5cblx0ZnVuY3Rpb24gc2VsZWN0X2Jsb2NrX3R5cGUoY3R4LCBkaXJ0eSkge1xuXHRcdGlmICgvKnF1ZXN0aW9uKi8gY3R4WzBdLmVkaXRpbmcpIHJldHVybiBjcmVhdGVfaWZfYmxvY2skMTtcblx0XHRyZXR1cm4gY3JlYXRlX2Vsc2VfYmxvY2skMTtcblx0fVxuXG5cdGxldCBjdXJyZW50X2Jsb2NrX3R5cGUgPSBzZWxlY3RfYmxvY2tfdHlwZShjdHgpO1xuXHRsZXQgaWZfYmxvY2sgPSBjdXJyZW50X2Jsb2NrX3R5cGUoY3R4KTtcblxuXHRyZXR1cm4ge1xuXHRcdGMoKSB7XG5cdFx0XHRtYWluID0gZWxlbWVudChcIm1haW5cIik7XG5cdFx0XHRpZl9ibG9jay5jKCk7XG5cdFx0XHRhdHRyKG1haW4sIFwiY2xhc3NcIiwgXCJzdmVsdGUtMWJoaGluN1wiKTtcblx0XHRcdHRvZ2dsZV9jbGFzcyhtYWluLCBcImN1cnJlbnRcIiwgLyppc19jdXJyZW50X3F1ZXN0aW9uKi8gY3R4WzJdKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGluc2VydCh0YXJnZXQsIG1haW4sIGFuY2hvcik7XG5cdFx0XHRpZl9ibG9jay5tKG1haW4sIG51bGwpO1xuXHRcdH0sXG5cdFx0cChjdHgsIFtkaXJ0eV0pIHtcblx0XHRcdGlmIChjdXJyZW50X2Jsb2NrX3R5cGUgPT09IChjdXJyZW50X2Jsb2NrX3R5cGUgPSBzZWxlY3RfYmxvY2tfdHlwZShjdHgpKSAmJiBpZl9ibG9jaykge1xuXHRcdFx0XHRpZl9ibG9jay5wKGN0eCwgZGlydHkpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWZfYmxvY2suZCgxKTtcblx0XHRcdFx0aWZfYmxvY2sgPSBjdXJyZW50X2Jsb2NrX3R5cGUoY3R4KTtcblxuXHRcdFx0XHRpZiAoaWZfYmxvY2spIHtcblx0XHRcdFx0XHRpZl9ibG9jay5jKCk7XG5cdFx0XHRcdFx0aWZfYmxvY2subShtYWluLCBudWxsKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHkgJiAvKmlzX2N1cnJlbnRfcXVlc3Rpb24qLyA0KSB7XG5cdFx0XHRcdHRvZ2dsZV9jbGFzcyhtYWluLCBcImN1cnJlbnRcIiwgLyppc19jdXJyZW50X3F1ZXN0aW9uKi8gY3R4WzJdKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGk6IG5vb3AsXG5cdFx0bzogbm9vcCxcblx0XHRkKGRldGFjaGluZykge1xuXHRcdFx0aWYgKGRldGFjaGluZykgZGV0YWNoKG1haW4pO1xuXHRcdFx0aWZfYmxvY2suZCgpO1xuXHRcdH1cblx0fTtcbn1cblxuZnVuY3Rpb24gaW5zdGFuY2UkNCgkJHNlbGYsICQkcHJvcHMsICQkaW52YWxpZGF0ZSkge1xuXHRsZXQgJGN1cnJlbnREaXJlY3Rpb247XG5cdGxldCAkY3VycmVudFF1ZXN0aW9uO1xuXHRsZXQgJHF1ZXN0aW9uc0Fjcm9zcztcblx0bGV0ICRxdWVzdGlvbnNEb3duO1xuXHRjb21wb25lbnRfc3Vic2NyaWJlKCQkc2VsZiwgY3VycmVudERpcmVjdGlvbiwgJCR2YWx1ZSA9PiAkJGludmFsaWRhdGUoMTAsICRjdXJyZW50RGlyZWN0aW9uID0gJCR2YWx1ZSkpO1xuXHRjb21wb25lbnRfc3Vic2NyaWJlKCQkc2VsZiwgY3VycmVudFF1ZXN0aW9uLCAkJHZhbHVlID0+ICQkaW52YWxpZGF0ZSgxMSwgJGN1cnJlbnRRdWVzdGlvbiA9ICQkdmFsdWUpKTtcblx0Y29tcG9uZW50X3N1YnNjcmliZSgkJHNlbGYsIHF1ZXN0aW9uc0Fjcm9zcywgJCR2YWx1ZSA9PiAkJGludmFsaWRhdGUoMTMsICRxdWVzdGlvbnNBY3Jvc3MgPSAkJHZhbHVlKSk7XG5cdGNvbXBvbmVudF9zdWJzY3JpYmUoJCRzZWxmLCBxdWVzdGlvbnNEb3duLCAkJHZhbHVlID0+ICQkaW52YWxpZGF0ZSgxNCwgJHF1ZXN0aW9uc0Rvd24gPSAkJHZhbHVlKSk7XG5cdGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCk7XG5cdGxldCB7IHF1ZXN0aW9uc19hY3Jvc3MgPSBbXSB9ID0gJCRwcm9wcztcblx0bGV0IHsgcXVlc3Rpb25zX2Rvd24gPSBbXSB9ID0gJCRwcm9wcztcblx0bGV0IHsgcXVlc3Rpb24gfSA9ICQkcHJvcHM7XG5cdGxldCB7IGRpcmVjdGlvbiB9ID0gJCRwcm9wcztcblxuXHQvLyBQcml2YXRlIHByb3BzXG5cdGxldCBzdWdnZXN0aW9ucyA9IFtdO1xuXG5cdGZ1bmN0aW9uIGVkaXRRdWVzdGlvbihxdWVzdGlvbikge1xuXHRcdHF1ZXN0aW9uLmVkaXRpbmcgPSB0cnVlO1xuXHRcdGlzRWRpdGluZ1F1ZXN0aW9uLnNldCh0cnVlKTtcblxuXHRcdGlmIChkaXJlY3Rpb24gPT0gXCJhY3Jvc3NcIikge1xuXHRcdFx0cXVlc3Rpb25zQWNyb3NzLnNldChxdWVzdGlvbnNfYWNyb3NzKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cXVlc3Rpb25zRG93bi5zZXQocXVlc3Rpb25zX2Rvd24pO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHNhdmVRdWVzdGlvbihxdWVzdGlvbikge1xuXHRcdGlmIChkaXJlY3Rpb24gPT0gXCJhY3Jvc3NcIikge1xuXHRcdFx0cXVlc3Rpb25zQWNyb3NzLnNldChxdWVzdGlvbnNfYWNyb3NzKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cXVlc3Rpb25zRG93bi5zZXQocXVlc3Rpb25zX2Rvd24pO1xuXHRcdH1cblxuXHRcdGlzRWRpdGluZ1F1ZXN0aW9uLnNldChmYWxzZSk7XG5cdFx0cXVlc3Rpb24uZWRpdGluZyA9IGZhbHNlO1xuXHRcdGRpc3BhdGNoKFwic2F2ZVwiLCB7IHF1ZXN0aW9uLCBkaXJlY3Rpb24gfSk7XG5cdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVLZXlkb3duKGUpIHtcblx0XHRpZiAoZS5rZXkgPT0gXCJFbnRlclwiKSB7XG5cdFx0XHRzYXZlUXVlc3Rpb24ocXVlc3Rpb24pO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHVzZVN1Z2dlc3Rpb24oc3VnZ2VzdGlvbikge1xuXHRcdHN1Z2dlc3Rpb24gPSBzdWdnZXN0aW9uLnRvVXBwZXJDYXNlKCk7XG5cdFx0bGV0IHFzID0gJHF1ZXN0aW9uc0Rvd247XG5cblx0XHRpZiAocXVlc3Rpb24uZGlyZWN0aW9uID09PSBcImFjcm9zc1wiKSB7XG5cdFx0XHRxcyA9ICRxdWVzdGlvbnNBY3Jvc3M7XG5cdFx0fVxuXG5cdFx0cXNbcXMuZmluZEluZGV4KHEgPT4gcS5udW0gPT09IHF1ZXN0aW9uLm51bSldO1xuXHRcdGxldCBxID0gcXMuZmluZChxID0+IHEubnVtID09PSBxdWVzdGlvbi5udW0pO1xuXHRcdGRpc3BhdGNoKFwidXBkYXRlX3F1ZXN0aW9uXCIsIHsgc3VnZ2VzdGlvbiwgcXVlc3Rpb246IHEgfSk7XG5cdH1cblxuXHRsZXQgaXNfY3VycmVudF9xdWVzdGlvbiA9IGZhbHNlO1xuXG5cdGZ1bmN0aW9uIGlucHV0X2lucHV0X2hhbmRsZXIoKSB7XG5cdFx0cXVlc3Rpb24ucXVlc3Rpb24gPSB0aGlzLnZhbHVlO1xuXHRcdCQkaW52YWxpZGF0ZSgwLCBxdWVzdGlvbik7XG5cdH1cblxuXHQkJHNlbGYuJCRzZXQgPSAkJHByb3BzID0+IHtcblx0XHRpZiAoJ3F1ZXN0aW9uc19hY3Jvc3MnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSg3LCBxdWVzdGlvbnNfYWNyb3NzID0gJCRwcm9wcy5xdWVzdGlvbnNfYWNyb3NzKTtcblx0XHRpZiAoJ3F1ZXN0aW9uc19kb3duJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoOCwgcXVlc3Rpb25zX2Rvd24gPSAkJHByb3BzLnF1ZXN0aW9uc19kb3duKTtcblx0XHRpZiAoJ3F1ZXN0aW9uJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoMCwgcXVlc3Rpb24gPSAkJHByb3BzLnF1ZXN0aW9uKTtcblx0XHRpZiAoJ2RpcmVjdGlvbicgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDksIGRpcmVjdGlvbiA9ICQkcHJvcHMuZGlyZWN0aW9uKTtcblx0fTtcblxuXHQkJHNlbGYuJCQudXBkYXRlID0gKCkgPT4ge1xuXHRcdGlmICgkJHNlbGYuJCQuZGlydHkgJiAvKnF1ZXN0aW9uLCAkY3VycmVudFF1ZXN0aW9uLCAkY3VycmVudERpcmVjdGlvbiovIDMwNzMpIHtcblx0XHRcdHtcblx0XHRcdFx0bGV0IHN1Z2dlc3Rpb25fcXVlcnkgPSBxdWVzdGlvbi5hbnN3ZXIucmVwbGFjZSgvXFwgL2csIFwiP1wiKTtcblxuXHRcdFx0XHRpZiAoIXN1Z2dlc3Rpb25fcXVlcnkuaW5jbHVkZXMoXCI/XCIpKSB7XG5cdFx0XHRcdFx0JCRpbnZhbGlkYXRlKDEsIHN1Z2dlc3Rpb25zID0gW10pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCQkaW52YWxpZGF0ZSgxLCBzdWdnZXN0aW9ucyA9IHN1Z2dlc3Qoc3VnZ2VzdGlvbl9xdWVyeSkpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCRjdXJyZW50UXVlc3Rpb24pIHtcblx0XHRcdFx0XHQkJGludmFsaWRhdGUoMiwgaXNfY3VycmVudF9xdWVzdGlvbiA9ICRjdXJyZW50UXVlc3Rpb24ubnVtID09PSBxdWVzdGlvbi5udW0gJiYgJGN1cnJlbnREaXJlY3Rpb24gPT09IHF1ZXN0aW9uLmRpcmVjdGlvbik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIFtcblx0XHRxdWVzdGlvbixcblx0XHRzdWdnZXN0aW9ucyxcblx0XHRpc19jdXJyZW50X3F1ZXN0aW9uLFxuXHRcdGVkaXRRdWVzdGlvbixcblx0XHRzYXZlUXVlc3Rpb24sXG5cdFx0aGFuZGxlS2V5ZG93bixcblx0XHR1c2VTdWdnZXN0aW9uLFxuXHRcdHF1ZXN0aW9uc19hY3Jvc3MsXG5cdFx0cXVlc3Rpb25zX2Rvd24sXG5cdFx0ZGlyZWN0aW9uLFxuXHRcdCRjdXJyZW50RGlyZWN0aW9uLFxuXHRcdCRjdXJyZW50UXVlc3Rpb24sXG5cdFx0aW5wdXRfaW5wdXRfaGFuZGxlclxuXHRdO1xufVxuXG5jbGFzcyBRdWVzdGlvbiBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudCB7XG5cdGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcblx0XHRzdXBlcigpO1xuXG5cdFx0aW5pdCh0aGlzLCBvcHRpb25zLCBpbnN0YW5jZSQ0LCBjcmVhdGVfZnJhZ21lbnQkNCwgc2FmZV9ub3RfZXF1YWwsIHtcblx0XHRcdHF1ZXN0aW9uc19hY3Jvc3M6IDcsXG5cdFx0XHRxdWVzdGlvbnNfZG93bjogOCxcblx0XHRcdHF1ZXN0aW9uOiAwLFxuXHRcdFx0ZGlyZWN0aW9uOiA5XG5cdFx0fSk7XG5cdH1cbn1cblxuLyogc3JjL1F1ZXN0aW9ucy5zdmVsdGUgZ2VuZXJhdGVkIGJ5IFN2ZWx0ZSB2My40Ni40ICovXG5cbmZ1bmN0aW9uIGdldF9lYWNoX2NvbnRleHQkMShjdHgsIGxpc3QsIGkpIHtcblx0Y29uc3QgY2hpbGRfY3R4ID0gY3R4LnNsaWNlKCk7XG5cdGNoaWxkX2N0eFs2XSA9IGxpc3RbaV07XG5cdHJldHVybiBjaGlsZF9jdHg7XG59XG5cbmZ1bmN0aW9uIGdldF9lYWNoX2NvbnRleHRfMSQxKGN0eCwgbGlzdCwgaSkge1xuXHRjb25zdCBjaGlsZF9jdHggPSBjdHguc2xpY2UoKTtcblx0Y2hpbGRfY3R4WzZdID0gbGlzdFtpXTtcblx0cmV0dXJuIGNoaWxkX2N0eDtcbn1cblxuLy8gKDU6MTYpIHsjZWFjaCBxdWVzdGlvbnNfYWNyb3NzIGFzIHF1ZXN0aW9ufVxuZnVuY3Rpb24gY3JlYXRlX2VhY2hfYmxvY2tfMSQxKGN0eCkge1xuXHRsZXQgcXVlc3Rpb247XG5cdGxldCBjdXJyZW50O1xuXG5cdHF1ZXN0aW9uID0gbmV3IFF1ZXN0aW9uKHtcblx0XHRcdHByb3BzOiB7XG5cdFx0XHRcdHF1ZXN0aW9uOiAvKnF1ZXN0aW9uKi8gY3R4WzZdLFxuXHRcdFx0XHRkaXJlY3Rpb246IFwiYWNyb3NzXCIsXG5cdFx0XHRcdHF1ZXN0aW9uc19hY3Jvc3M6IC8qcXVlc3Rpb25zX2Fjcm9zcyovIGN0eFswXVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdHF1ZXN0aW9uLiRvbihcImNoYW5nZVwiLCAvKmNoYW5nZV9oYW5kbGVyKi8gY3R4WzJdKTtcblx0cXVlc3Rpb24uJG9uKFwidXBkYXRlX3F1ZXN0aW9uXCIsIC8qdXBkYXRlX3F1ZXN0aW9uX2hhbmRsZXIqLyBjdHhbM10pO1xuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdGNyZWF0ZV9jb21wb25lbnQocXVlc3Rpb24uJCQuZnJhZ21lbnQpO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0bW91bnRfY29tcG9uZW50KHF1ZXN0aW9uLCB0YXJnZXQsIGFuY2hvcik7XG5cdFx0XHRjdXJyZW50ID0gdHJ1ZTtcblx0XHR9LFxuXHRcdHAoY3R4LCBkaXJ0eSkge1xuXHRcdFx0Y29uc3QgcXVlc3Rpb25fY2hhbmdlcyA9IHt9O1xuXHRcdFx0aWYgKGRpcnR5ICYgLypxdWVzdGlvbnNfYWNyb3NzKi8gMSkgcXVlc3Rpb25fY2hhbmdlcy5xdWVzdGlvbiA9IC8qcXVlc3Rpb24qLyBjdHhbNl07XG5cdFx0XHRpZiAoZGlydHkgJiAvKnF1ZXN0aW9uc19hY3Jvc3MqLyAxKSBxdWVzdGlvbl9jaGFuZ2VzLnF1ZXN0aW9uc19hY3Jvc3MgPSAvKnF1ZXN0aW9uc19hY3Jvc3MqLyBjdHhbMF07XG5cdFx0XHRxdWVzdGlvbi4kc2V0KHF1ZXN0aW9uX2NoYW5nZXMpO1xuXHRcdH0sXG5cdFx0aShsb2NhbCkge1xuXHRcdFx0aWYgKGN1cnJlbnQpIHJldHVybjtcblx0XHRcdHRyYW5zaXRpb25faW4ocXVlc3Rpb24uJCQuZnJhZ21lbnQsIGxvY2FsKTtcblx0XHRcdGN1cnJlbnQgPSB0cnVlO1xuXHRcdH0sXG5cdFx0byhsb2NhbCkge1xuXHRcdFx0dHJhbnNpdGlvbl9vdXQocXVlc3Rpb24uJCQuZnJhZ21lbnQsIGxvY2FsKTtcblx0XHRcdGN1cnJlbnQgPSBmYWxzZTtcblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRkZXN0cm95X2NvbXBvbmVudChxdWVzdGlvbiwgZGV0YWNoaW5nKTtcblx0XHR9XG5cdH07XG59XG5cbi8vICgxMToxNikgeyNlYWNoIHF1ZXN0aW9uc19kb3duIGFzIHF1ZXN0aW9ufVxuZnVuY3Rpb24gY3JlYXRlX2VhY2hfYmxvY2skMShjdHgpIHtcblx0bGV0IHF1ZXN0aW9uO1xuXHRsZXQgY3VycmVudDtcblxuXHRxdWVzdGlvbiA9IG5ldyBRdWVzdGlvbih7XG5cdFx0XHRwcm9wczoge1xuXHRcdFx0XHRxdWVzdGlvbjogLypxdWVzdGlvbiovIGN0eFs2XSxcblx0XHRcdFx0ZGlyZWN0aW9uOiBcImRvd25cIixcblx0XHRcdFx0cXVlc3Rpb25zX2Rvd246IC8qcXVlc3Rpb25zX2Rvd24qLyBjdHhbMV1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRxdWVzdGlvbi4kb24oXCJjaGFuZ2VcIiwgLypjaGFuZ2VfaGFuZGxlcl8xKi8gY3R4WzRdKTtcblx0cXVlc3Rpb24uJG9uKFwidXBkYXRlX3F1ZXN0aW9uXCIsIC8qdXBkYXRlX3F1ZXN0aW9uX2hhbmRsZXJfMSovIGN0eFs1XSk7XG5cblx0cmV0dXJuIHtcblx0XHRjKCkge1xuXHRcdFx0Y3JlYXRlX2NvbXBvbmVudChxdWVzdGlvbi4kJC5mcmFnbWVudCk7XG5cdFx0fSxcblx0XHRtKHRhcmdldCwgYW5jaG9yKSB7XG5cdFx0XHRtb3VudF9jb21wb25lbnQocXVlc3Rpb24sIHRhcmdldCwgYW5jaG9yKTtcblx0XHRcdGN1cnJlbnQgPSB0cnVlO1xuXHRcdH0sXG5cdFx0cChjdHgsIGRpcnR5KSB7XG5cdFx0XHRjb25zdCBxdWVzdGlvbl9jaGFuZ2VzID0ge307XG5cdFx0XHRpZiAoZGlydHkgJiAvKnF1ZXN0aW9uc19kb3duKi8gMikgcXVlc3Rpb25fY2hhbmdlcy5xdWVzdGlvbiA9IC8qcXVlc3Rpb24qLyBjdHhbNl07XG5cdFx0XHRpZiAoZGlydHkgJiAvKnF1ZXN0aW9uc19kb3duKi8gMikgcXVlc3Rpb25fY2hhbmdlcy5xdWVzdGlvbnNfZG93biA9IC8qcXVlc3Rpb25zX2Rvd24qLyBjdHhbMV07XG5cdFx0XHRxdWVzdGlvbi4kc2V0KHF1ZXN0aW9uX2NoYW5nZXMpO1xuXHRcdH0sXG5cdFx0aShsb2NhbCkge1xuXHRcdFx0aWYgKGN1cnJlbnQpIHJldHVybjtcblx0XHRcdHRyYW5zaXRpb25faW4ocXVlc3Rpb24uJCQuZnJhZ21lbnQsIGxvY2FsKTtcblx0XHRcdGN1cnJlbnQgPSB0cnVlO1xuXHRcdH0sXG5cdFx0byhsb2NhbCkge1xuXHRcdFx0dHJhbnNpdGlvbl9vdXQocXVlc3Rpb24uJCQuZnJhZ21lbnQsIGxvY2FsKTtcblx0XHRcdGN1cnJlbnQgPSBmYWxzZTtcblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRkZXN0cm95X2NvbXBvbmVudChxdWVzdGlvbiwgZGV0YWNoaW5nKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZV9mcmFnbWVudCQzKGN0eCkge1xuXHRsZXQgbWFpbjtcblx0bGV0IGRpdjI7XG5cdGxldCBkaXYwO1xuXHRsZXQgaDQwO1xuXHRsZXQgdDE7XG5cdGxldCB0Mjtcblx0bGV0IGRpdjE7XG5cdGxldCBoNDE7XG5cdGxldCB0NDtcblx0bGV0IGN1cnJlbnQ7XG5cdGxldCBlYWNoX3ZhbHVlXzEgPSAvKnF1ZXN0aW9uc19hY3Jvc3MqLyBjdHhbMF07XG5cdGxldCBlYWNoX2Jsb2Nrc18xID0gW107XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX3ZhbHVlXzEubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRlYWNoX2Jsb2Nrc18xW2ldID0gY3JlYXRlX2VhY2hfYmxvY2tfMSQxKGdldF9lYWNoX2NvbnRleHRfMSQxKGN0eCwgZWFjaF92YWx1ZV8xLCBpKSk7XG5cdH1cblxuXHRjb25zdCBvdXQgPSBpID0+IHRyYW5zaXRpb25fb3V0KGVhY2hfYmxvY2tzXzFbaV0sIDEsIDEsICgpID0+IHtcblx0XHRlYWNoX2Jsb2Nrc18xW2ldID0gbnVsbDtcblx0fSk7XG5cblx0bGV0IGVhY2hfdmFsdWUgPSAvKnF1ZXN0aW9uc19kb3duKi8gY3R4WzFdO1xuXHRsZXQgZWFjaF9ibG9ja3MgPSBbXTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGVhY2hfdmFsdWUubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRlYWNoX2Jsb2Nrc1tpXSA9IGNyZWF0ZV9lYWNoX2Jsb2NrJDEoZ2V0X2VhY2hfY29udGV4dCQxKGN0eCwgZWFjaF92YWx1ZSwgaSkpO1xuXHR9XG5cblx0Y29uc3Qgb3V0XzEgPSBpID0+IHRyYW5zaXRpb25fb3V0KGVhY2hfYmxvY2tzW2ldLCAxLCAxLCAoKSA9PiB7XG5cdFx0ZWFjaF9ibG9ja3NbaV0gPSBudWxsO1xuXHR9KTtcblxuXHRyZXR1cm4ge1xuXHRcdGMoKSB7XG5cdFx0XHRtYWluID0gZWxlbWVudChcIm1haW5cIik7XG5cdFx0XHRkaXYyID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdGRpdjAgPSBlbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0aDQwID0gZWxlbWVudChcImg0XCIpO1xuXHRcdFx0aDQwLnRleHRDb250ZW50ID0gXCJBY3Jvc3NcIjtcblx0XHRcdHQxID0gc3BhY2UoKTtcblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX2Jsb2Nrc18xLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdGVhY2hfYmxvY2tzXzFbaV0uYygpO1xuXHRcdFx0fVxuXG5cdFx0XHR0MiA9IHNwYWNlKCk7XG5cdFx0XHRkaXYxID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdGg0MSA9IGVsZW1lbnQoXCJoNFwiKTtcblx0XHRcdGg0MS50ZXh0Q29udGVudCA9IFwiRG93blwiO1xuXHRcdFx0dDQgPSBzcGFjZSgpO1xuXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGVhY2hfYmxvY2tzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdGVhY2hfYmxvY2tzW2ldLmMoKTtcblx0XHRcdH1cblxuXHRcdFx0YXR0cihkaXYwLCBcImNsYXNzXCIsIFwianh3b3JkLXF1ZXN0aW9ucy1kaXJlY3Rpb24ganh3b3JkLXF1ZXN0aW9ucy1hY3Jvc3Mgc3ZlbHRlLTFqbTBhcTVcIik7XG5cdFx0XHRhdHRyKGRpdjEsIFwiY2xhc3NcIiwgXCJqeHdvcmQtcXVlc3Rpb25zLWRpcmVjdGlvbiBqeHdvcmQtcXVlc3Rpb25zLWFjcm9zcyBzdmVsdGUtMWptMGFxNVwiKTtcblx0XHRcdGF0dHIoZGl2MiwgXCJjbGFzc1wiLCBcImp4d29yZC1xdWVzdGlvbnMgc3ZlbHRlLTFqbTBhcTVcIik7XG5cdFx0XHRhdHRyKG1haW4sIFwiY2xhc3NcIiwgXCJzdmVsdGUtMWptMGFxNVwiKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGluc2VydCh0YXJnZXQsIG1haW4sIGFuY2hvcik7XG5cdFx0XHRhcHBlbmQobWFpbiwgZGl2Mik7XG5cdFx0XHRhcHBlbmQoZGl2MiwgZGl2MCk7XG5cdFx0XHRhcHBlbmQoZGl2MCwgaDQwKTtcblx0XHRcdGFwcGVuZChkaXYwLCB0MSk7XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF9ibG9ja3NfMS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRlYWNoX2Jsb2Nrc18xW2ldLm0oZGl2MCwgbnVsbCk7XG5cdFx0XHR9XG5cblx0XHRcdGFwcGVuZChkaXYyLCB0Mik7XG5cdFx0XHRhcHBlbmQoZGl2MiwgZGl2MSk7XG5cdFx0XHRhcHBlbmQoZGl2MSwgaDQxKTtcblx0XHRcdGFwcGVuZChkaXYxLCB0NCk7XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF9ibG9ja3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0ubShkaXYxLCBudWxsKTtcblx0XHRcdH1cblxuXHRcdFx0Y3VycmVudCA9IHRydWU7XG5cdFx0fSxcblx0XHRwKGN0eCwgW2RpcnR5XSkge1xuXHRcdFx0aWYgKGRpcnR5ICYgLypxdWVzdGlvbnNfYWNyb3NzKi8gMSkge1xuXHRcdFx0XHRlYWNoX3ZhbHVlXzEgPSAvKnF1ZXN0aW9uc19hY3Jvc3MqLyBjdHhbMF07XG5cdFx0XHRcdGxldCBpO1xuXG5cdFx0XHRcdGZvciAoaSA9IDA7IGkgPCBlYWNoX3ZhbHVlXzEubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRjb25zdCBjaGlsZF9jdHggPSBnZXRfZWFjaF9jb250ZXh0XzEkMShjdHgsIGVhY2hfdmFsdWVfMSwgaSk7XG5cblx0XHRcdFx0XHRpZiAoZWFjaF9ibG9ja3NfMVtpXSkge1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NfMVtpXS5wKGNoaWxkX2N0eCwgZGlydHkpO1xuXHRcdFx0XHRcdFx0dHJhbnNpdGlvbl9pbihlYWNoX2Jsb2Nrc18xW2ldLCAxKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NfMVtpXSA9IGNyZWF0ZV9lYWNoX2Jsb2NrXzEkMShjaGlsZF9jdHgpO1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NfMVtpXS5jKCk7XG5cdFx0XHRcdFx0XHR0cmFuc2l0aW9uX2luKGVhY2hfYmxvY2tzXzFbaV0sIDEpO1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NfMVtpXS5tKGRpdjAsIG51bGwpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGdyb3VwX291dHJvcygpO1xuXG5cdFx0XHRcdGZvciAoaSA9IGVhY2hfdmFsdWVfMS5sZW5ndGg7IGkgPCBlYWNoX2Jsb2Nrc18xLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0b3V0KGkpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2hlY2tfb3V0cm9zKCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eSAmIC8qcXVlc3Rpb25zX2Rvd24qLyAyKSB7XG5cdFx0XHRcdGVhY2hfdmFsdWUgPSAvKnF1ZXN0aW9uc19kb3duKi8gY3R4WzFdO1xuXHRcdFx0XHRsZXQgaTtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgZWFjaF92YWx1ZS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdGNvbnN0IGNoaWxkX2N0eCA9IGdldF9lYWNoX2NvbnRleHQkMShjdHgsIGVhY2hfdmFsdWUsIGkpO1xuXG5cdFx0XHRcdFx0aWYgKGVhY2hfYmxvY2tzW2ldKSB7XG5cdFx0XHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5wKGNoaWxkX2N0eCwgZGlydHkpO1xuXHRcdFx0XHRcdFx0dHJhbnNpdGlvbl9pbihlYWNoX2Jsb2Nrc1tpXSwgMSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldID0gY3JlYXRlX2VhY2hfYmxvY2skMShjaGlsZF9jdHgpO1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0uYygpO1xuXHRcdFx0XHRcdFx0dHJhbnNpdGlvbl9pbihlYWNoX2Jsb2Nrc1tpXSwgMSk7XG5cdFx0XHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5tKGRpdjEsIG51bGwpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGdyb3VwX291dHJvcygpO1xuXG5cdFx0XHRcdGZvciAoaSA9IGVhY2hfdmFsdWUubGVuZ3RoOyBpIDwgZWFjaF9ibG9ja3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRvdXRfMShpKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNoZWNrX291dHJvcygpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0aShsb2NhbCkge1xuXHRcdFx0aWYgKGN1cnJlbnQpIHJldHVybjtcblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX3ZhbHVlXzEubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0dHJhbnNpdGlvbl9pbihlYWNoX2Jsb2Nrc18xW2ldKTtcblx0XHRcdH1cblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX3ZhbHVlLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdHRyYW5zaXRpb25faW4oZWFjaF9ibG9ja3NbaV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRjdXJyZW50ID0gdHJ1ZTtcblx0XHR9LFxuXHRcdG8obG9jYWwpIHtcblx0XHRcdGVhY2hfYmxvY2tzXzEgPSBlYWNoX2Jsb2Nrc18xLmZpbHRlcihCb29sZWFuKTtcblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX2Jsb2Nrc18xLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdHRyYW5zaXRpb25fb3V0KGVhY2hfYmxvY2tzXzFbaV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRlYWNoX2Jsb2NrcyA9IGVhY2hfYmxvY2tzLmZpbHRlcihCb29sZWFuKTtcblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX2Jsb2Nrcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHR0cmFuc2l0aW9uX291dChlYWNoX2Jsb2Nrc1tpXSk7XG5cdFx0XHR9XG5cblx0XHRcdGN1cnJlbnQgPSBmYWxzZTtcblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2gobWFpbik7XG5cdFx0XHRkZXN0cm95X2VhY2goZWFjaF9ibG9ja3NfMSwgZGV0YWNoaW5nKTtcblx0XHRcdGRlc3Ryb3lfZWFjaChlYWNoX2Jsb2NrcywgZGV0YWNoaW5nKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGluc3RhbmNlJDMoJCRzZWxmLCAkJHByb3BzLCAkJGludmFsaWRhdGUpIHtcblx0bGV0IHF1ZXN0aW9uc19hY3Jvc3MgPSBbXTtcblx0bGV0IHF1ZXN0aW9uc19kb3duID0gW107XG5cblx0cXVlc3Rpb25zQWNyb3NzLnN1YnNjcmliZSh2YWx1ZSA9PiB7XG5cdFx0JCRpbnZhbGlkYXRlKDAsIHF1ZXN0aW9uc19hY3Jvc3MgPSB2YWx1ZSk7XG5cdH0pO1xuXG5cdHF1ZXN0aW9uc0Rvd24uc3Vic2NyaWJlKHZhbHVlID0+IHtcblx0XHQkJGludmFsaWRhdGUoMSwgcXVlc3Rpb25zX2Rvd24gPSB2YWx1ZSk7XG5cdH0pO1xuXG5cdGZ1bmN0aW9uIGNoYW5nZV9oYW5kbGVyKGV2ZW50KSB7XG5cdFx0YnViYmxlLmNhbGwodGhpcywgJCRzZWxmLCBldmVudCk7XG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGVfcXVlc3Rpb25faGFuZGxlcihldmVudCkge1xuXHRcdGJ1YmJsZS5jYWxsKHRoaXMsICQkc2VsZiwgZXZlbnQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2hhbmdlX2hhbmRsZXJfMShldmVudCkge1xuXHRcdGJ1YmJsZS5jYWxsKHRoaXMsICQkc2VsZiwgZXZlbnQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlX3F1ZXN0aW9uX2hhbmRsZXJfMShldmVudCkge1xuXHRcdGJ1YmJsZS5jYWxsKHRoaXMsICQkc2VsZiwgZXZlbnQpO1xuXHR9XG5cblx0cmV0dXJuIFtcblx0XHRxdWVzdGlvbnNfYWNyb3NzLFxuXHRcdHF1ZXN0aW9uc19kb3duLFxuXHRcdGNoYW5nZV9oYW5kbGVyLFxuXHRcdHVwZGF0ZV9xdWVzdGlvbl9oYW5kbGVyLFxuXHRcdGNoYW5nZV9oYW5kbGVyXzEsXG5cdFx0dXBkYXRlX3F1ZXN0aW9uX2hhbmRsZXJfMVxuXHRdO1xufVxuXG5jbGFzcyBRdWVzdGlvbnMgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuXHRjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG5cdFx0c3VwZXIoKTtcblx0XHRpbml0KHRoaXMsIG9wdGlvbnMsIGluc3RhbmNlJDMsIGNyZWF0ZV9mcmFnbWVudCQzLCBzYWZlX25vdF9lcXVhbCwge30pO1xuXHR9XG59XG5cbi8qIHNyYy9HcmlkLnN2ZWx0ZSBnZW5lcmF0ZWQgYnkgU3ZlbHRlIHYzLjQ2LjQgKi9cblxuZnVuY3Rpb24gZ2V0X2VhY2hfY29udGV4dChjdHgsIGxpc3QsIGkpIHtcblx0Y29uc3QgY2hpbGRfY3R4ID0gY3R4LnNsaWNlKCk7XG5cdGNoaWxkX2N0eFs2MF0gPSBsaXN0W2ldO1xuXHRjaGlsZF9jdHhbNjJdID0gaTtcblx0cmV0dXJuIGNoaWxkX2N0eDtcbn1cblxuZnVuY3Rpb24gZ2V0X2VhY2hfY29udGV4dF8xKGN0eCwgbGlzdCwgaSkge1xuXHRjb25zdCBjaGlsZF9jdHggPSBjdHguc2xpY2UoKTtcblx0Y2hpbGRfY3R4WzYzXSA9IGxpc3RbaV07XG5cdGNoaWxkX2N0eFs2NV0gPSBpO1xuXHRyZXR1cm4gY2hpbGRfY3R4O1xufVxuXG4vLyAoNDYyOjI4KSB7OmVsc2V9XG5mdW5jdGlvbiBjcmVhdGVfZWxzZV9ibG9jayhjdHgpIHtcblx0bGV0IHJlY3Q7XG5cdGxldCByZWN0X3lfdmFsdWU7XG5cdGxldCByZWN0X3hfdmFsdWU7XG5cdGxldCB0ZXh0XzE7XG5cdGxldCB0X3ZhbHVlID0gLypsZXR0ZXIqLyBjdHhbNjNdICsgXCJcIjtcblx0bGV0IHQ7XG5cdGxldCB0ZXh0XzFfeF92YWx1ZTtcblx0bGV0IHRleHRfMV95X3ZhbHVlO1xuXHRsZXQgbW91bnRlZDtcblx0bGV0IGRpc3Bvc2U7XG5cblx0cmV0dXJuIHtcblx0XHRjKCkge1xuXHRcdFx0cmVjdCA9IHN2Z19lbGVtZW50KFwicmVjdFwiKTtcblx0XHRcdHRleHRfMSA9IHN2Z19lbGVtZW50KFwidGV4dFwiKTtcblx0XHRcdHQgPSB0ZXh0KHRfdmFsdWUpO1xuXHRcdFx0YXR0cihyZWN0LCBcImNsYXNzXCIsIFwianh3b3JkLWNlbGwtcmVjdCBzdmVsdGUtMTAxM2o1bVwiKTtcblx0XHRcdGF0dHIocmVjdCwgXCJyb2xlXCIsIFwiY2VsbFwiKTtcblx0XHRcdGF0dHIocmVjdCwgXCJ0YWJpbmRleFwiLCBcIi0xXCIpO1xuXHRcdFx0YXR0cihyZWN0LCBcImFyaWEtbGFiZWxcIiwgXCJcIik7XG5cdFx0XHRhdHRyKHJlY3QsIFwieVwiLCByZWN0X3lfdmFsdWUgPSAvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKnkqLyBjdHhbNjJdICsgLyptYXJnaW4qLyBjdHhbOV0pO1xuXHRcdFx0YXR0cihyZWN0LCBcInhcIiwgcmVjdF94X3ZhbHVlID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeCovIGN0eFs2NV0gKyAvKm1hcmdpbiovIGN0eFs5XSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwid2lkdGhcIiwgLypjZWxsV2lkdGgqLyBjdHhbMThdKTtcblx0XHRcdGF0dHIocmVjdCwgXCJoZWlnaHRcIiwgLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwic3Ryb2tlXCIsIC8qaW5uZXJCb3JkZXJDb2xvdXIqLyBjdHhbMTFdKTtcblx0XHRcdGF0dHIocmVjdCwgXCJzdHJva2Utd2lkdGhcIiwgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdKTtcblx0XHRcdGF0dHIocmVjdCwgXCJmaWxsXCIsIC8qYmFja2dyb3VuZENvbG91ciovIGN0eFsxM10pO1xuXHRcdFx0YXR0cihyZWN0LCBcImRhdGEtY29sXCIsIC8qeCovIGN0eFs2NV0pO1xuXHRcdFx0YXR0cihyZWN0LCBcImRhdGEtcm93XCIsIC8qeSovIGN0eFs2Ml0pO1xuXHRcdFx0YXR0cih0ZXh0XzEsIFwiaWRcIiwgXCJqeHdvcmQtbGV0dGVyLVwiICsgLyp4Ki8gY3R4WzY1XSArIFwiLVwiICsgLyp5Ki8gY3R4WzYyXSk7XG5cdFx0XHRhdHRyKHRleHRfMSwgXCJ4XCIsIHRleHRfMV94X3ZhbHVlID0gLypjZWxsV2lkdGgqLyBjdHhbMThdICogLyp4Ki8gY3R4WzY1XSArIC8qbWFyZ2luKi8gY3R4WzldICsgLypjZWxsV2lkdGgqLyBjdHhbMThdIC8gMik7XG5cdFx0XHRhdHRyKHRleHRfMSwgXCJ5XCIsIHRleHRfMV95X3ZhbHVlID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeSovIGN0eFs2Ml0gKyAvKm1hcmdpbiovIGN0eFs5XSArIC8qY2VsbEhlaWdodCovIGN0eFsyMl0gLSAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogMC4xKTtcblx0XHRcdGF0dHIodGV4dF8xLCBcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpO1xuXHRcdFx0YXR0cih0ZXh0XzEsIFwiZm9udC1zaXplXCIsIC8qZm9udFNpemUqLyBjdHhbMjBdKTtcblx0XHRcdGF0dHIodGV4dF8xLCBcIndpZHRoXCIsIC8qY2VsbFdpZHRoKi8gY3R4WzE4XSk7XG5cdFx0XHRhdHRyKHRleHRfMSwgXCJjbGFzc1wiLCBcInN2ZWx0ZS0xMDEzajVtXCIpO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0aW5zZXJ0KHRhcmdldCwgcmVjdCwgYW5jaG9yKTtcblx0XHRcdGluc2VydCh0YXJnZXQsIHRleHRfMSwgYW5jaG9yKTtcblx0XHRcdGFwcGVuZCh0ZXh0XzEsIHQpO1xuXG5cdFx0XHRpZiAoIW1vdW50ZWQpIHtcblx0XHRcdFx0ZGlzcG9zZSA9IFtcblx0XHRcdFx0XHRsaXN0ZW4ocmVjdCwgXCJmb2N1c1wiLCAvKmhhbmRsZUZvY3VzKi8gY3R4WzI2XSksXG5cdFx0XHRcdFx0bGlzdGVuKHRleHRfMSwgXCJmb2N1c1wiLCAvKmhhbmRsZUZvY3VzKi8gY3R4WzI2XSlcblx0XHRcdFx0XTtcblxuXHRcdFx0XHRtb3VudGVkID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHAoY3R4LCBkaXJ0eSkge1xuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsV2lkdGgsIG1hcmdpbiovIDI2MjY1NiAmJiByZWN0X3lfdmFsdWUgIT09IChyZWN0X3lfdmFsdWUgPSAvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKnkqLyBjdHhbNjJdICsgLyptYXJnaW4qLyBjdHhbOV0pKSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJ5XCIsIHJlY3RfeV92YWx1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbEhlaWdodCwgbWFyZ2luKi8gNDE5NDgxNiAmJiByZWN0X3hfdmFsdWUgIT09IChyZWN0X3hfdmFsdWUgPSAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogLyp4Ki8gY3R4WzY1XSArIC8qbWFyZ2luKi8gY3R4WzldKSkge1xuXHRcdFx0XHRhdHRyKHJlY3QsIFwieFwiLCByZWN0X3hfdmFsdWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxXaWR0aCovIDI2MjE0NCkge1xuXHRcdFx0XHRhdHRyKHJlY3QsIFwid2lkdGhcIiwgLypjZWxsV2lkdGgqLyBjdHhbMThdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsSGVpZ2h0Ki8gNDE5NDMwNCkge1xuXHRcdFx0XHRhdHRyKHJlY3QsIFwiaGVpZ2h0XCIsIC8qY2VsbEhlaWdodCovIGN0eFsyMl0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmlubmVyQm9yZGVyQ29sb3VyKi8gMjA0OCkge1xuXHRcdFx0XHRhdHRyKHJlY3QsIFwic3Ryb2tlXCIsIC8qaW5uZXJCb3JkZXJDb2xvdXIqLyBjdHhbMTFdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLyppbm5lckJvcmRlcldpZHRoKi8gMjU2KSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJzdHJva2Utd2lkdGhcIiwgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypiYWNrZ3JvdW5kQ29sb3VyKi8gODE5Mikge1xuXHRcdFx0XHRhdHRyKHJlY3QsIFwiZmlsbFwiLCAvKmJhY2tncm91bmRDb2xvdXIqLyBjdHhbMTNdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypncmlkKi8gMSAmJiB0X3ZhbHVlICE9PSAodF92YWx1ZSA9IC8qbGV0dGVyKi8gY3R4WzYzXSArIFwiXCIpKSBzZXRfZGF0YSh0LCB0X3ZhbHVlKTtcblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsV2lkdGgsIG1hcmdpbiovIDI2MjY1NiAmJiB0ZXh0XzFfeF92YWx1ZSAhPT0gKHRleHRfMV94X3ZhbHVlID0gLypjZWxsV2lkdGgqLyBjdHhbMThdICogLyp4Ki8gY3R4WzY1XSArIC8qbWFyZ2luKi8gY3R4WzldICsgLypjZWxsV2lkdGgqLyBjdHhbMThdIC8gMikpIHtcblx0XHRcdFx0YXR0cih0ZXh0XzEsIFwieFwiLCB0ZXh0XzFfeF92YWx1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbEhlaWdodCwgbWFyZ2luKi8gNDE5NDgxNiAmJiB0ZXh0XzFfeV92YWx1ZSAhPT0gKHRleHRfMV95X3ZhbHVlID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeSovIGN0eFs2Ml0gKyAvKm1hcmdpbiovIGN0eFs5XSArIC8qY2VsbEhlaWdodCovIGN0eFsyMl0gLSAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogMC4xKSkge1xuXHRcdFx0XHRhdHRyKHRleHRfMSwgXCJ5XCIsIHRleHRfMV95X3ZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypmb250U2l6ZSovIDEwNDg1NzYpIHtcblx0XHRcdFx0YXR0cih0ZXh0XzEsIFwiZm9udC1zaXplXCIsIC8qZm9udFNpemUqLyBjdHhbMjBdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsV2lkdGgqLyAyNjIxNDQpIHtcblx0XHRcdFx0YXR0cih0ZXh0XzEsIFwid2lkdGhcIiwgLypjZWxsV2lkdGgqLyBjdHhbMThdKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2gocmVjdCk7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2godGV4dF8xKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdHJ1bl9hbGwoZGlzcG9zZSk7XG5cdFx0fVxuXHR9O1xufVxuXG4vLyAoNDU3OjI4KSB7I2lmIGxldHRlcj09XCIjXCJ9XG5mdW5jdGlvbiBjcmVhdGVfaWZfYmxvY2tfMShjdHgpIHtcblx0bGV0IHJlY3Q7XG5cdGxldCByZWN0X3lfdmFsdWU7XG5cdGxldCByZWN0X3hfdmFsdWU7XG5cdGxldCBsaW5lMDtcblx0bGV0IGxpbmUwX3lfX3ZhbHVlO1xuXHRsZXQgbGluZTBfeF9fdmFsdWU7XG5cdGxldCBsaW5lMF95X192YWx1ZV8xO1xuXHRsZXQgbGluZTBfeF9fdmFsdWVfMTtcblx0bGV0IGxpbmUxO1xuXHRsZXQgbGluZTFfeV9fdmFsdWU7XG5cdGxldCBsaW5lMV94X192YWx1ZTtcblx0bGV0IGxpbmUxX3lfX3ZhbHVlXzE7XG5cdGxldCBsaW5lMV94X192YWx1ZV8xO1xuXHRsZXQgbGluZTFfdHJhbnNmb3JtX3ZhbHVlO1xuXHRsZXQgbW91bnRlZDtcblx0bGV0IGRpc3Bvc2U7XG5cblx0cmV0dXJuIHtcblx0XHRjKCkge1xuXHRcdFx0cmVjdCA9IHN2Z19lbGVtZW50KFwicmVjdFwiKTtcblx0XHRcdGxpbmUwID0gc3ZnX2VsZW1lbnQoXCJsaW5lXCIpO1xuXHRcdFx0bGluZTEgPSBzdmdfZWxlbWVudChcImxpbmVcIik7XG5cdFx0XHRhdHRyKHJlY3QsIFwiY2xhc3NcIiwgXCJqeHdvcmQtY2VsbC1yZWN0IHN2ZWx0ZS0xMDEzajVtXCIpO1xuXHRcdFx0YXR0cihyZWN0LCBcInJvbGVcIiwgXCJjZWxsXCIpO1xuXHRcdFx0YXR0cihyZWN0LCBcInRhYmluZGV4XCIsIFwiLTFcIik7XG5cdFx0XHRhdHRyKHJlY3QsIFwiYXJpYS1sYWJlbFwiLCBcImJsYW5rXCIpO1xuXHRcdFx0YXR0cihyZWN0LCBcInlcIiwgcmVjdF95X3ZhbHVlID0gLypjZWxsV2lkdGgqLyBjdHhbMThdICogLyp5Ki8gY3R4WzYyXSArIC8qbWFyZ2luKi8gY3R4WzldKTtcblx0XHRcdGF0dHIocmVjdCwgXCJ4XCIsIHJlY3RfeF92YWx1ZSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0pO1xuXHRcdFx0YXR0cihyZWN0LCBcIndpZHRoXCIsIC8qY2VsbFdpZHRoKi8gY3R4WzE4XSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwiaGVpZ2h0XCIsIC8qY2VsbEhlaWdodCovIGN0eFsyMl0pO1xuXHRcdFx0YXR0cihyZWN0LCBcInN0cm9rZVwiLCAvKmlubmVyQm9yZGVyQ29sb3VyKi8gY3R4WzExXSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwic3Ryb2tlLXdpZHRoXCIsIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwiZmlsbFwiLCAvKmZpbGxDb2xvdXIqLyBjdHhbMTJdKTtcblx0XHRcdGF0dHIocmVjdCwgXCJkYXRhLWNvbFwiLCAvKnkqLyBjdHhbNjJdKTtcblx0XHRcdGF0dHIocmVjdCwgXCJkYXRhLXJvd1wiLCAvKngqLyBjdHhbNjVdKTtcblx0XHRcdGF0dHIobGluZTAsIFwiY2xhc3NcIiwgXCJqeHdvcmQtY2VsbC1saW5lIHN2ZWx0ZS0xMDEzajVtXCIpO1xuXHRcdFx0YXR0cihsaW5lMCwgXCJyb2xlXCIsIFwiY2VsbFwiKTtcblx0XHRcdGF0dHIobGluZTAsIFwidGFiaW5kZXhcIiwgXCItMVwiKTtcblx0XHRcdGF0dHIobGluZTAsIFwieTFcIiwgbGluZTBfeV9fdmFsdWUgPSAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogLyp5Ki8gY3R4WzYyXSArIC8qbWFyZ2luKi8gY3R4WzldICsgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdKTtcblx0XHRcdGF0dHIobGluZTAsIFwieDFcIiwgbGluZTBfeF9fdmFsdWUgPSAvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0pO1xuXHRcdFx0YXR0cihsaW5lMCwgXCJ5MlwiLCBsaW5lMF95X192YWx1ZV8xID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeSovIGN0eFs2Ml0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0gKiAvKnkqLyBjdHhbNjJdICsgLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSk7XG5cdFx0XHRhdHRyKGxpbmUwLCBcIngyXCIsIGxpbmUwX3hfX3ZhbHVlXzEgPSAvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKngqLyBjdHhbNjVdICsgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdICogLyp5Ki8gY3R4WzYyXSArIC8qY2VsbFdpZHRoKi8gY3R4WzE4XSk7XG5cdFx0XHRhdHRyKGxpbmUwLCBcInN0cm9rZVwiLCAvKmlubmVyQm9yZGVyQ29sb3VyKi8gY3R4WzExXSk7XG5cdFx0XHRhdHRyKGxpbmUwLCBcInN0cm9rZS13aWR0aFwiLCAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0pO1xuXHRcdFx0YXR0cihsaW5lMCwgXCJkYXRhLWNvbFwiLCAvKnkqLyBjdHhbNjJdKTtcblx0XHRcdGF0dHIobGluZTAsIFwiZGF0YS1yb3dcIiwgLyp4Ki8gY3R4WzY1XSk7XG5cdFx0XHRhdHRyKGxpbmUxLCBcImNsYXNzXCIsIFwianh3b3JkLWNlbGwtbGluZSBzdmVsdGUtMTAxM2o1bVwiKTtcblx0XHRcdGF0dHIobGluZTEsIFwicm9sZVwiLCBcImNlbGxcIik7XG5cdFx0XHRhdHRyKGxpbmUxLCBcInRhYmluZGV4XCIsIFwiLTFcIik7XG5cdFx0XHRhdHRyKGxpbmUxLCBcInkxXCIsIGxpbmUxX3lfX3ZhbHVlID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeSovIGN0eFs2Ml0gKyAvKm1hcmdpbiovIGN0eFs5XSArIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSk7XG5cdFx0XHRhdHRyKGxpbmUxLCBcIngxXCIsIGxpbmUxX3hfX3ZhbHVlID0gLypjZWxsV2lkdGgqLyBjdHhbMThdICogLyp4Ki8gY3R4WzY1XSArIC8qbWFyZ2luKi8gY3R4WzldICsgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdKTtcblx0XHRcdGF0dHIobGluZTEsIFwieTJcIiwgbGluZTFfeV9fdmFsdWVfMSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKnkqLyBjdHhbNjJdICsgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdICogLyp5Ki8gY3R4WzYyXSArIC8qY2VsbEhlaWdodCovIGN0eFsyMl0pO1xuXHRcdFx0YXR0cihsaW5lMSwgXCJ4MlwiLCBsaW5lMV94X192YWx1ZV8xID0gLypjZWxsV2lkdGgqLyBjdHhbMThdICogLyp4Ki8gY3R4WzY1XSArIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSAqIC8qeSovIGN0eFs2Ml0gKyAvKmNlbGxXaWR0aCovIGN0eFsxOF0pO1xuXHRcdFx0YXR0cihsaW5lMSwgXCJzdHJva2VcIiwgLyppbm5lckJvcmRlckNvbG91ciovIGN0eFsxMV0pO1xuXHRcdFx0YXR0cihsaW5lMSwgXCJzdHJva2Utd2lkdGhcIiwgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdKTtcblx0XHRcdGF0dHIobGluZTEsIFwiZGF0YS1jb2xcIiwgLyp5Ki8gY3R4WzYyXSk7XG5cdFx0XHRhdHRyKGxpbmUxLCBcImRhdGEtcm93XCIsIC8qeCovIGN0eFs2NV0pO1xuXHRcdFx0YXR0cihsaW5lMSwgXCJ0cmFuc2Zvcm1cIiwgbGluZTFfdHJhbnNmb3JtX3ZhbHVlID0gXCJyb3RhdGUoOTAsIFwiICsgKC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAqIC8qeCovIGN0eFs2NV0gKyAvKm1hcmdpbiovIGN0eFs5XSArIC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAvIDIpICsgXCIsIFwiICsgKC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKnkqLyBjdHhbNjJdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmNlbGxXaWR0aCovIGN0eFsxOF0gLyAyKSArIFwiKVwiKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGluc2VydCh0YXJnZXQsIHJlY3QsIGFuY2hvcik7XG5cdFx0XHRpbnNlcnQodGFyZ2V0LCBsaW5lMCwgYW5jaG9yKTtcblx0XHRcdGluc2VydCh0YXJnZXQsIGxpbmUxLCBhbmNob3IpO1xuXG5cdFx0XHRpZiAoIW1vdW50ZWQpIHtcblx0XHRcdFx0ZGlzcG9zZSA9IFtcblx0XHRcdFx0XHRsaXN0ZW4ocmVjdCwgXCJmb2N1c1wiLCAvKmhhbmRsZUZvY3VzKi8gY3R4WzI2XSksXG5cdFx0XHRcdFx0bGlzdGVuKGxpbmUwLCBcImZvY3VzXCIsIC8qaGFuZGxlRm9jdXMqLyBjdHhbMjZdKSxcblx0XHRcdFx0XHRsaXN0ZW4obGluZTEsIFwiZm9jdXNcIiwgLypoYW5kbGVGb2N1cyovIGN0eFsyNl0pXG5cdFx0XHRcdF07XG5cblx0XHRcdFx0bW91bnRlZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRwKGN0eCwgZGlydHkpIHtcblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbFdpZHRoLCBtYXJnaW4qLyAyNjI2NTYgJiYgcmVjdF95X3ZhbHVlICE9PSAocmVjdF95X3ZhbHVlID0gLypjZWxsV2lkdGgqLyBjdHhbMThdICogLyp5Ki8gY3R4WzYyXSArIC8qbWFyZ2luKi8gY3R4WzldKSkge1xuXHRcdFx0XHRhdHRyKHJlY3QsIFwieVwiLCByZWN0X3lfdmFsdWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxIZWlnaHQsIG1hcmdpbiovIDQxOTQ4MTYgJiYgcmVjdF94X3ZhbHVlICE9PSAocmVjdF94X3ZhbHVlID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeCovIGN0eFs2NV0gKyAvKm1hcmdpbiovIGN0eFs5XSkpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcInhcIiwgcmVjdF94X3ZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsV2lkdGgqLyAyNjIxNDQpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcIndpZHRoXCIsIC8qY2VsbFdpZHRoKi8gY3R4WzE4XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbEhlaWdodCovIDQxOTQzMDQpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcImhlaWdodFwiLCAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLyppbm5lckJvcmRlckNvbG91ciovIDIwNDgpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcInN0cm9rZVwiLCAvKmlubmVyQm9yZGVyQ29sb3VyKi8gY3R4WzExXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qaW5uZXJCb3JkZXJXaWR0aCovIDI1Nikge1xuXHRcdFx0XHRhdHRyKHJlY3QsIFwic3Ryb2tlLXdpZHRoXCIsIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qZmlsbENvbG91ciovIDQwOTYpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcImZpbGxcIiwgLypmaWxsQ29sb3VyKi8gY3R4WzEyXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbEhlaWdodCwgbWFyZ2luLCBpbm5lckJvcmRlcldpZHRoKi8gNDE5NTA3MiAmJiBsaW5lMF95X192YWx1ZSAhPT0gKGxpbmUwX3lfX3ZhbHVlID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeSovIGN0eFs2Ml0gKyAvKm1hcmdpbiovIGN0eFs5XSArIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSkpIHtcblx0XHRcdFx0YXR0cihsaW5lMCwgXCJ5MVwiLCBsaW5lMF95X192YWx1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbFdpZHRoLCBtYXJnaW4sIGlubmVyQm9yZGVyV2lkdGgqLyAyNjI5MTIgJiYgbGluZTBfeF9fdmFsdWUgIT09IChsaW5lMF94X192YWx1ZSA9IC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAqIC8qeCovIGN0eFs2NV0gKyAvKm1hcmdpbiovIGN0eFs5XSArIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSkpIHtcblx0XHRcdFx0YXR0cihsaW5lMCwgXCJ4MVwiLCBsaW5lMF94X192YWx1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbEhlaWdodCwgaW5uZXJCb3JkZXJXaWR0aCovIDQxOTQ1NjAgJiYgbGluZTBfeV9fdmFsdWVfMSAhPT0gKGxpbmUwX3lfX3ZhbHVlXzEgPSAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogLyp5Ki8gY3R4WzYyXSArIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSAqIC8qeSovIGN0eFs2Ml0gKyAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdKSkge1xuXHRcdFx0XHRhdHRyKGxpbmUwLCBcInkyXCIsIGxpbmUwX3lfX3ZhbHVlXzEpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxXaWR0aCwgaW5uZXJCb3JkZXJXaWR0aCovIDI2MjQwMCAmJiBsaW5lMF94X192YWx1ZV8xICE9PSAobGluZTBfeF9fdmFsdWVfMSA9IC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAqIC8qeCovIGN0eFs2NV0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0gKiAvKnkqLyBjdHhbNjJdICsgLypjZWxsV2lkdGgqLyBjdHhbMThdKSkge1xuXHRcdFx0XHRhdHRyKGxpbmUwLCBcIngyXCIsIGxpbmUwX3hfX3ZhbHVlXzEpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmlubmVyQm9yZGVyQ29sb3VyKi8gMjA0OCkge1xuXHRcdFx0XHRhdHRyKGxpbmUwLCBcInN0cm9rZVwiLCAvKmlubmVyQm9yZGVyQ29sb3VyKi8gY3R4WzExXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qaW5uZXJCb3JkZXJXaWR0aCovIDI1Nikge1xuXHRcdFx0XHRhdHRyKGxpbmUwLCBcInN0cm9rZS13aWR0aFwiLCAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxIZWlnaHQsIG1hcmdpbiwgaW5uZXJCb3JkZXJXaWR0aCovIDQxOTUwNzIgJiYgbGluZTFfeV9fdmFsdWUgIT09IChsaW5lMV95X192YWx1ZSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKnkqLyBjdHhbNjJdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0pKSB7XG5cdFx0XHRcdGF0dHIobGluZTEsIFwieTFcIiwgbGluZTFfeV9fdmFsdWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxXaWR0aCwgbWFyZ2luLCBpbm5lckJvcmRlcldpZHRoKi8gMjYyOTEyICYmIGxpbmUxX3hfX3ZhbHVlICE9PSAobGluZTFfeF9fdmFsdWUgPSAvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0pKSB7XG5cdFx0XHRcdGF0dHIobGluZTEsIFwieDFcIiwgbGluZTFfeF9fdmFsdWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxIZWlnaHQsIGlubmVyQm9yZGVyV2lkdGgqLyA0MTk0NTYwICYmIGxpbmUxX3lfX3ZhbHVlXzEgIT09IChsaW5lMV95X192YWx1ZV8xID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeSovIGN0eFs2Ml0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0gKiAvKnkqLyBjdHhbNjJdICsgLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSkpIHtcblx0XHRcdFx0YXR0cihsaW5lMSwgXCJ5MlwiLCBsaW5lMV95X192YWx1ZV8xKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsV2lkdGgsIGlubmVyQm9yZGVyV2lkdGgqLyAyNjI0MDAgJiYgbGluZTFfeF9fdmFsdWVfMSAhPT0gKGxpbmUxX3hfX3ZhbHVlXzEgPSAvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKngqLyBjdHhbNjVdICsgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdICogLyp5Ki8gY3R4WzYyXSArIC8qY2VsbFdpZHRoKi8gY3R4WzE4XSkpIHtcblx0XHRcdFx0YXR0cihsaW5lMSwgXCJ4MlwiLCBsaW5lMV94X192YWx1ZV8xKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLyppbm5lckJvcmRlckNvbG91ciovIDIwNDgpIHtcblx0XHRcdFx0YXR0cihsaW5lMSwgXCJzdHJva2VcIiwgLyppbm5lckJvcmRlckNvbG91ciovIGN0eFsxMV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmlubmVyQm9yZGVyV2lkdGgqLyAyNTYpIHtcblx0XHRcdFx0YXR0cihsaW5lMSwgXCJzdHJva2Utd2lkdGhcIiwgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsV2lkdGgsIG1hcmdpbiwgY2VsbEhlaWdodCovIDQ0NTY5NjAgJiYgbGluZTFfdHJhbnNmb3JtX3ZhbHVlICE9PSAobGluZTFfdHJhbnNmb3JtX3ZhbHVlID0gXCJyb3RhdGUoOTAsIFwiICsgKC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAqIC8qeCovIGN0eFs2NV0gKyAvKm1hcmdpbiovIGN0eFs5XSArIC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAvIDIpICsgXCIsIFwiICsgKC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKnkqLyBjdHhbNjJdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmNlbGxXaWR0aCovIGN0eFsxOF0gLyAyKSArIFwiKVwiKSkge1xuXHRcdFx0XHRhdHRyKGxpbmUxLCBcInRyYW5zZm9ybVwiLCBsaW5lMV90cmFuc2Zvcm1fdmFsdWUpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaChyZWN0KTtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaChsaW5lMCk7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2gobGluZTEpO1xuXHRcdFx0bW91bnRlZCA9IGZhbHNlO1xuXHRcdFx0cnVuX2FsbChkaXNwb3NlKTtcblx0XHR9XG5cdH07XG59XG5cbi8vICg0NjY6MjgpIHsjaWYgKG51bWJlcl9ncmlkW3ldW3hdICE9IG51bGwgJiYgbGV0dGVyIT09XCIjXCIpfVxuZnVuY3Rpb24gY3JlYXRlX2lmX2Jsb2NrKGN0eCkge1xuXHRsZXQgdGV4dF8xO1xuXHRsZXQgdF92YWx1ZSA9IC8qbnVtYmVyX2dyaWQqLyBjdHhbMTddWy8qeSovIGN0eFs2Ml1dWy8qeCovIGN0eFs2NV1dICsgXCJcIjtcblx0bGV0IHQ7XG5cdGxldCB0ZXh0XzFfeF92YWx1ZTtcblx0bGV0IHRleHRfMV95X3ZhbHVlO1xuXHRsZXQgbW91bnRlZDtcblx0bGV0IGRpc3Bvc2U7XG5cblx0cmV0dXJuIHtcblx0XHRjKCkge1xuXHRcdFx0dGV4dF8xID0gc3ZnX2VsZW1lbnQoXCJ0ZXh0XCIpO1xuXHRcdFx0dCA9IHRleHQodF92YWx1ZSk7XG5cdFx0XHRhdHRyKHRleHRfMSwgXCJ4XCIsIHRleHRfMV94X3ZhbHVlID0gLypjZWxsV2lkdGgqLyBjdHhbMThdICogLyp4Ki8gY3R4WzY1XSArIC8qbWFyZ2luKi8gY3R4WzldICsgMik7XG5cdFx0XHRhdHRyKHRleHRfMSwgXCJ5XCIsIHRleHRfMV95X3ZhbHVlID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeSovIGN0eFs2Ml0gKyAvKm1hcmdpbiovIGN0eFs5XSArIC8qbnVtRm9udFNpemUqLyBjdHhbMjFdKTtcblx0XHRcdGF0dHIodGV4dF8xLCBcInRleHQtYW5jaG9yXCIsIFwibGVmdFwiKTtcblx0XHRcdGF0dHIodGV4dF8xLCBcImZvbnQtc2l6ZVwiLCAvKm51bUZvbnRTaXplKi8gY3R4WzIxXSk7XG5cdFx0XHRhdHRyKHRleHRfMSwgXCJjbGFzc1wiLCBcInN2ZWx0ZS0xMDEzajVtXCIpO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0aW5zZXJ0KHRhcmdldCwgdGV4dF8xLCBhbmNob3IpO1xuXHRcdFx0YXBwZW5kKHRleHRfMSwgdCk7XG5cblx0XHRcdGlmICghbW91bnRlZCkge1xuXHRcdFx0XHRkaXNwb3NlID0gbGlzdGVuKHRleHRfMSwgXCJmb2N1c1wiLCAvKmhhbmRsZUZvY3VzKi8gY3R4WzI2XSk7XG5cdFx0XHRcdG1vdW50ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cChjdHgsIGRpcnR5KSB7XG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKm51bWJlcl9ncmlkKi8gMTMxMDcyICYmIHRfdmFsdWUgIT09ICh0X3ZhbHVlID0gLypudW1iZXJfZ3JpZCovIGN0eFsxN11bLyp5Ki8gY3R4WzYyXV1bLyp4Ki8gY3R4WzY1XV0gKyBcIlwiKSkgc2V0X2RhdGEodCwgdF92YWx1ZSk7XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbFdpZHRoLCBtYXJnaW4qLyAyNjI2NTYgJiYgdGV4dF8xX3hfdmFsdWUgIT09ICh0ZXh0XzFfeF92YWx1ZSA9IC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAqIC8qeCovIGN0eFs2NV0gKyAvKm1hcmdpbiovIGN0eFs5XSArIDIpKSB7XG5cdFx0XHRcdGF0dHIodGV4dF8xLCBcInhcIiwgdGV4dF8xX3hfdmFsdWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxIZWlnaHQsIG1hcmdpbiwgbnVtRm9udFNpemUqLyA2MjkxOTY4ICYmIHRleHRfMV95X3ZhbHVlICE9PSAodGV4dF8xX3lfdmFsdWUgPSAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogLyp5Ki8gY3R4WzYyXSArIC8qbWFyZ2luKi8gY3R4WzldICsgLypudW1Gb250U2l6ZSovIGN0eFsyMV0pKSB7XG5cdFx0XHRcdGF0dHIodGV4dF8xLCBcInlcIiwgdGV4dF8xX3lfdmFsdWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKm51bUZvbnRTaXplKi8gMjA5NzE1Mikge1xuXHRcdFx0XHRhdHRyKHRleHRfMSwgXCJmb250LXNpemVcIiwgLypudW1Gb250U2l6ZSovIGN0eFsyMV0pO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaCh0ZXh0XzEpO1xuXHRcdFx0bW91bnRlZCA9IGZhbHNlO1xuXHRcdFx0ZGlzcG9zZSgpO1xuXHRcdH1cblx0fTtcbn1cblxuLy8gKDQ1NToyMCkgeyNlYWNoIGNvbF9kYXRhIGFzIGxldHRlciwgeH1cbmZ1bmN0aW9uIGNyZWF0ZV9lYWNoX2Jsb2NrXzEoY3R4KSB7XG5cdGxldCBnO1xuXHRsZXQgaWZfYmxvY2swX2FuY2hvcjtcblx0bGV0IG1vdW50ZWQ7XG5cdGxldCBkaXNwb3NlO1xuXG5cdGZ1bmN0aW9uIHNlbGVjdF9ibG9ja190eXBlKGN0eCwgZGlydHkpIHtcblx0XHRpZiAoLypsZXR0ZXIqLyBjdHhbNjNdID09IFwiI1wiKSByZXR1cm4gY3JlYXRlX2lmX2Jsb2NrXzE7XG5cdFx0cmV0dXJuIGNyZWF0ZV9lbHNlX2Jsb2NrO1xuXHR9XG5cblx0bGV0IGN1cnJlbnRfYmxvY2tfdHlwZSA9IHNlbGVjdF9ibG9ja190eXBlKGN0eCk7XG5cdGxldCBpZl9ibG9jazAgPSBjdXJyZW50X2Jsb2NrX3R5cGUoY3R4KTtcblx0bGV0IGlmX2Jsb2NrMSA9IC8qbnVtYmVyX2dyaWQqLyBjdHhbMTddWy8qeSovIGN0eFs2Ml1dWy8qeCovIGN0eFs2NV1dICE9IG51bGwgJiYgLypsZXR0ZXIqLyBjdHhbNjNdICE9PSBcIiNcIiAmJiBjcmVhdGVfaWZfYmxvY2soY3R4KTtcblxuXHRmdW5jdGlvbiBjbGlja19oYW5kbGVyKCkge1xuXHRcdHJldHVybiAvKmNsaWNrX2hhbmRsZXIqLyBjdHhbNDRdKC8qeCovIGN0eFs2NV0sIC8qeSovIGN0eFs2Ml0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGJsY2xpY2tfaGFuZGxlcigpIHtcblx0XHRyZXR1cm4gLypkYmxjbGlja19oYW5kbGVyKi8gY3R4WzQ1XSgvKngqLyBjdHhbNjVdLCAvKnkqLyBjdHhbNjJdKTtcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdGcgPSBzdmdfZWxlbWVudChcImdcIik7XG5cdFx0XHRpZl9ibG9jazAuYygpO1xuXHRcdFx0aWZfYmxvY2swX2FuY2hvciA9IGVtcHR5KCk7XG5cdFx0XHRpZiAoaWZfYmxvY2sxKSBpZl9ibG9jazEuYygpO1xuXHRcdFx0YXR0cihnLCBcImlkXCIsIFwianh3b3JkLWNlbGwtXCIgKyAvKngqLyBjdHhbNjVdICsgXCItXCIgKyAvKnkqLyBjdHhbNjJdKTtcblx0XHRcdGF0dHIoZywgXCJjbGFzc1wiLCBcImp4d29yZC1jZWxsIHN2ZWx0ZS0xMDEzajVtXCIpO1xuXHRcdFx0c2V0X3N0eWxlKGcsIFwiei1pbmRleFwiLCBcIjIwXCIpO1xuXHRcdFx0dG9nZ2xlX2NsYXNzKGcsIFwic2VsZWN0ZWRcIiwgLypjdXJyZW50X3kqLyBjdHhbMl0gPT09IC8qeSovIGN0eFs2Ml0gJiYgLypjdXJyZW50X3gqLyBjdHhbMV0gPT09IC8qeCovIGN0eFs2NV0pO1xuXHRcdFx0dG9nZ2xlX2NsYXNzKGcsIFwiYWN0aXZlXCIsIC8qbWFya2VkX3dvcmRfZ3JpZCovIGN0eFsxOV1bLyp5Ki8gY3R4WzYyXV1bLyp4Ki8gY3R4WzY1XV0pO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0aW5zZXJ0KHRhcmdldCwgZywgYW5jaG9yKTtcblx0XHRcdGlmX2Jsb2NrMC5tKGcsIG51bGwpO1xuXHRcdFx0YXBwZW5kKGcsIGlmX2Jsb2NrMF9hbmNob3IpO1xuXHRcdFx0aWYgKGlmX2Jsb2NrMSkgaWZfYmxvY2sxLm0oZywgbnVsbCk7XG5cblx0XHRcdGlmICghbW91bnRlZCkge1xuXHRcdFx0XHRkaXNwb3NlID0gW1xuXHRcdFx0XHRcdGxpc3RlbihnLCBcImNsaWNrXCIsIGNsaWNrX2hhbmRsZXIpLFxuXHRcdFx0XHRcdGxpc3RlbihnLCBcImRibGNsaWNrXCIsIGRibGNsaWNrX2hhbmRsZXIpLFxuXHRcdFx0XHRcdGxpc3RlbihnLCBcImtleWRvd25cIiwgLypoYW5kbGVLZXlkb3duKi8gY3R4WzE2XSlcblx0XHRcdFx0XTtcblxuXHRcdFx0XHRtb3VudGVkID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHAobmV3X2N0eCwgZGlydHkpIHtcblx0XHRcdGN0eCA9IG5ld19jdHg7XG5cblx0XHRcdGlmIChjdXJyZW50X2Jsb2NrX3R5cGUgPT09IChjdXJyZW50X2Jsb2NrX3R5cGUgPSBzZWxlY3RfYmxvY2tfdHlwZShjdHgpKSAmJiBpZl9ibG9jazApIHtcblx0XHRcdFx0aWZfYmxvY2swLnAoY3R4LCBkaXJ0eSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZl9ibG9jazAuZCgxKTtcblx0XHRcdFx0aWZfYmxvY2swID0gY3VycmVudF9ibG9ja190eXBlKGN0eCk7XG5cblx0XHRcdFx0aWYgKGlmX2Jsb2NrMCkge1xuXHRcdFx0XHRcdGlmX2Jsb2NrMC5jKCk7XG5cdFx0XHRcdFx0aWZfYmxvY2swLm0oZywgaWZfYmxvY2swX2FuY2hvcik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKC8qbnVtYmVyX2dyaWQqLyBjdHhbMTddWy8qeSovIGN0eFs2Ml1dWy8qeCovIGN0eFs2NV1dICE9IG51bGwgJiYgLypsZXR0ZXIqLyBjdHhbNjNdICE9PSBcIiNcIikge1xuXHRcdFx0XHRpZiAoaWZfYmxvY2sxKSB7XG5cdFx0XHRcdFx0aWZfYmxvY2sxLnAoY3R4LCBkaXJ0eSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aWZfYmxvY2sxID0gY3JlYXRlX2lmX2Jsb2NrKGN0eCk7XG5cdFx0XHRcdFx0aWZfYmxvY2sxLmMoKTtcblx0XHRcdFx0XHRpZl9ibG9jazEubShnLCBudWxsKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChpZl9ibG9jazEpIHtcblx0XHRcdFx0aWZfYmxvY2sxLmQoMSk7XG5cdFx0XHRcdGlmX2Jsb2NrMSA9IG51bGw7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY3VycmVudF95LCBjdXJyZW50X3gqLyA2KSB7XG5cdFx0XHRcdHRvZ2dsZV9jbGFzcyhnLCBcInNlbGVjdGVkXCIsIC8qY3VycmVudF95Ki8gY3R4WzJdID09PSAvKnkqLyBjdHhbNjJdICYmIC8qY3VycmVudF94Ki8gY3R4WzFdID09PSAvKngqLyBjdHhbNjVdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLyptYXJrZWRfd29yZF9ncmlkKi8gNTI0Mjg4KSB7XG5cdFx0XHRcdHRvZ2dsZV9jbGFzcyhnLCBcImFjdGl2ZVwiLCAvKm1hcmtlZF93b3JkX2dyaWQqLyBjdHhbMTldWy8qeSovIGN0eFs2Ml1dWy8qeCovIGN0eFs2NV1dKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2goZyk7XG5cdFx0XHRpZl9ibG9jazAuZCgpO1xuXHRcdFx0aWYgKGlmX2Jsb2NrMSkgaWZfYmxvY2sxLmQoKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdHJ1bl9hbGwoZGlzcG9zZSk7XG5cdFx0fVxuXHR9O1xufVxuXG4vLyAoNDU0OjE2KSB7I2VhY2ggZ3JpZCBhcyBjb2xfZGF0YSwgeX1cbmZ1bmN0aW9uIGNyZWF0ZV9lYWNoX2Jsb2NrKGN0eCkge1xuXHRsZXQgZWFjaF8xX2FuY2hvcjtcblx0bGV0IGVhY2hfdmFsdWVfMSA9IC8qY29sX2RhdGEqLyBjdHhbNjBdO1xuXHRsZXQgZWFjaF9ibG9ja3MgPSBbXTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGVhY2hfdmFsdWVfMS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdGVhY2hfYmxvY2tzW2ldID0gY3JlYXRlX2VhY2hfYmxvY2tfMShnZXRfZWFjaF9jb250ZXh0XzEoY3R4LCBlYWNoX3ZhbHVlXzEsIGkpKTtcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF9ibG9ja3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0uYygpO1xuXHRcdFx0fVxuXG5cdFx0XHRlYWNoXzFfYW5jaG9yID0gZW1wdHkoKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF9ibG9ja3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0ubSh0YXJnZXQsIGFuY2hvcik7XG5cdFx0XHR9XG5cblx0XHRcdGluc2VydCh0YXJnZXQsIGVhY2hfMV9hbmNob3IsIGFuY2hvcik7XG5cdFx0fSxcblx0XHRwKGN0eCwgZGlydHkpIHtcblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY3VycmVudF95LCBjdXJyZW50X3gsIG1hcmtlZF93b3JkX2dyaWQsIHNldEN1cnJlbnRQb3MsIGhhbmRsZURvdWJsZWNsaWNrLCBoYW5kbGVLZXlkb3duLCBjZWxsV2lkdGgsIG1hcmdpbiwgY2VsbEhlaWdodCwgbnVtRm9udFNpemUsIGhhbmRsZUZvY3VzLCBudW1iZXJfZ3JpZCwgZ3JpZCwgaW5uZXJCb3JkZXJXaWR0aCwgaW5uZXJCb3JkZXJDb2xvdXIsIGZpbGxDb2xvdXIsIGZvbnRTaXplLCBiYWNrZ3JvdW5kQ29sb3VyKi8gMTA5MDM0MjQ3KSB7XG5cdFx0XHRcdGVhY2hfdmFsdWVfMSA9IC8qY29sX2RhdGEqLyBjdHhbNjBdO1xuXHRcdFx0XHRsZXQgaTtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgZWFjaF92YWx1ZV8xLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0Y29uc3QgY2hpbGRfY3R4ID0gZ2V0X2VhY2hfY29udGV4dF8xKGN0eCwgZWFjaF92YWx1ZV8xLCBpKTtcblxuXHRcdFx0XHRcdGlmIChlYWNoX2Jsb2Nrc1tpXSkge1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0ucChjaGlsZF9jdHgsIGRpcnR5KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0gPSBjcmVhdGVfZWFjaF9ibG9ja18xKGNoaWxkX2N0eCk7XG5cdFx0XHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5jKCk7XG5cdFx0XHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5tKGVhY2hfMV9hbmNob3IucGFyZW50Tm9kZSwgZWFjaF8xX2FuY2hvcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Zm9yICg7IGkgPCBlYWNoX2Jsb2Nrcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldLmQoMSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRlYWNoX2Jsb2Nrcy5sZW5ndGggPSBlYWNoX3ZhbHVlXzEubGVuZ3RoO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGRlc3Ryb3lfZWFjaChlYWNoX2Jsb2NrcywgZGV0YWNoaW5nKTtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaChlYWNoXzFfYW5jaG9yKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZV9mcmFnbWVudCQyKGN0eCkge1xuXHRsZXQgbWFpbjtcblx0bGV0IGRpdjtcblx0bGV0IGlucHV0O1xuXHRsZXQgdDA7XG5cdGxldCBzdmc7XG5cdGxldCBnO1xuXHRsZXQgcmVjdDtcblx0bGV0IHQxO1xuXHRsZXQgcXVlc3Rpb25zO1xuXHRsZXQgY3VycmVudDtcblx0bGV0IG1vdW50ZWQ7XG5cdGxldCBkaXNwb3NlO1xuXHRsZXQgZWFjaF92YWx1ZSA9IC8qZ3JpZCovIGN0eFswXTtcblx0bGV0IGVhY2hfYmxvY2tzID0gW107XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX3ZhbHVlLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0ZWFjaF9ibG9ja3NbaV0gPSBjcmVhdGVfZWFjaF9ibG9jayhnZXRfZWFjaF9jb250ZXh0KGN0eCwgZWFjaF92YWx1ZSwgaSkpO1xuXHR9XG5cblx0cXVlc3Rpb25zID0gbmV3IFF1ZXN0aW9ucyh7fSk7XG5cdHF1ZXN0aW9ucy4kb24oXCJjaGFuZ2VcIiwgLypjaGFuZ2VfaGFuZGxlciovIGN0eFs0N10pO1xuXHRxdWVzdGlvbnMuJG9uKFwidXBkYXRlX3F1ZXN0aW9uXCIsIC8qaGFuZGxlVXBkYXRlUXVlc3Rpb24qLyBjdHhbMjddKTtcblxuXHRyZXR1cm4ge1xuXHRcdGMoKSB7XG5cdFx0XHRtYWluID0gZWxlbWVudChcIm1haW5cIik7XG5cdFx0XHRkaXYgPSBlbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0aW5wdXQgPSBlbGVtZW50KFwiaW5wdXRcIik7XG5cdFx0XHR0MCA9IHNwYWNlKCk7XG5cdFx0XHRzdmcgPSBzdmdfZWxlbWVudChcInN2Z1wiKTtcblx0XHRcdGcgPSBzdmdfZWxlbWVudChcImdcIik7XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF9ibG9ja3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0uYygpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZWN0ID0gc3ZnX2VsZW1lbnQoXCJyZWN0XCIpO1xuXHRcdFx0dDEgPSBzcGFjZSgpO1xuXHRcdFx0Y3JlYXRlX2NvbXBvbmVudChxdWVzdGlvbnMuJCQuZnJhZ21lbnQpO1xuXHRcdFx0YXR0cihpbnB1dCwgXCJ0eXBlXCIsIFwidGV4dFwiKTtcblx0XHRcdGF0dHIoaW5wdXQsIFwiY2xhc3NcIiwgXCJzdmVsdGUtMTAxM2o1bVwiKTtcblx0XHRcdGF0dHIocmVjdCwgXCJ4XCIsIC8qbWFyZ2luKi8gY3R4WzldKTtcblx0XHRcdGF0dHIocmVjdCwgXCJ5XCIsIC8qbWFyZ2luKi8gY3R4WzldKTtcblx0XHRcdGF0dHIocmVjdCwgXCJ3aWR0aFwiLCAvKnRvdGFsV2lkdGgqLyBjdHhbNV0pO1xuXHRcdFx0YXR0cihyZWN0LCBcImhlaWdodFwiLCAvKnRvdGFsSGVpZ2h0Ki8gY3R4WzZdKTtcblx0XHRcdGF0dHIocmVjdCwgXCJzdHJva2VcIiwgLypvdXRlckJvcmRlckNvbG91ciovIGN0eFsxMF0pO1xuXHRcdFx0YXR0cihyZWN0LCBcInN0cm9rZS13aWR0aFwiLCAvKm91dGVyQm9yZGVyV2lkdGgqLyBjdHhbN10pO1xuXHRcdFx0YXR0cihyZWN0LCBcImZpbGxcIiwgXCJub25lXCIpO1xuXHRcdFx0YXR0cihyZWN0LCBcImNsYXNzXCIsIFwic3ZlbHRlLTEwMTNqNW1cIik7XG5cdFx0XHRhdHRyKGcsIFwiY2xhc3NcIiwgXCJjZWxsLWdyb3VwIHN2ZWx0ZS0xMDEzajVtXCIpO1xuXHRcdFx0YXR0cihzdmcsIFwiY2xhc3NcIiwgXCJqeHdvcmQtc3ZnIHN2ZWx0ZS0xMDEzajVtXCIpO1xuXHRcdFx0YXR0cihzdmcsIFwibWluLXhcIiwgXCIwXCIpO1xuXHRcdFx0YXR0cihzdmcsIFwibWluLXlcIiwgXCIwXCIpO1xuXHRcdFx0YXR0cihzdmcsIFwid2lkdGhcIiwgLyp2aWV3Ym94X3dpZHRoKi8gY3R4WzIzXSk7XG5cdFx0XHRhdHRyKHN2ZywgXCJoZWlnaHRcIiwgLyp2aWV3Ym94X2hlaWdodCovIGN0eFsyNF0pO1xuXHRcdFx0YXR0cihkaXYsIFwiY2xhc3NcIiwgXCJqeHdvcmQtc3ZnLWNvbnRhaW5lciBzdmVsdGUtMTAxM2o1bVwiKTtcblx0XHRcdGF0dHIobWFpbiwgXCJjbGFzc1wiLCBcInN2ZWx0ZS0xMDEzajVtXCIpO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0aW5zZXJ0KHRhcmdldCwgbWFpbiwgYW5jaG9yKTtcblx0XHRcdGFwcGVuZChtYWluLCBkaXYpO1xuXHRcdFx0YXBwZW5kKGRpdiwgaW5wdXQpO1xuXHRcdFx0LyppbnB1dF9iaW5kaW5nKi8gY3R4WzQzXShpbnB1dCk7XG5cdFx0XHRhcHBlbmQoZGl2LCB0MCk7XG5cdFx0XHRhcHBlbmQoZGl2LCBzdmcpO1xuXHRcdFx0YXBwZW5kKHN2ZywgZyk7XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF9ibG9ja3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0ubShnLCBudWxsKTtcblx0XHRcdH1cblxuXHRcdFx0YXBwZW5kKGcsIHJlY3QpO1xuXHRcdFx0LypkaXZfYmluZGluZyovIGN0eFs0Nl0oZGl2KTtcblx0XHRcdGFwcGVuZChtYWluLCB0MSk7XG5cdFx0XHRtb3VudF9jb21wb25lbnQocXVlc3Rpb25zLCBtYWluLCBudWxsKTtcblx0XHRcdGN1cnJlbnQgPSB0cnVlO1xuXG5cdFx0XHRpZiAoIW1vdW50ZWQpIHtcblx0XHRcdFx0ZGlzcG9zZSA9IFtcblx0XHRcdFx0XHRsaXN0ZW4oaW5wdXQsIFwia2V5ZG93blwiLCAvKmhhbmRsZUtleWRvd24qLyBjdHhbMTZdKSxcblx0XHRcdFx0XHRsaXN0ZW4ocmVjdCwgXCJmb2N1c1wiLCAvKmhhbmRsZUZvY3VzKi8gY3R4WzI2XSksXG5cdFx0XHRcdFx0bGlzdGVuKG1haW4sIFwibW92ZVwiLCAvKmhhbmRsZU1vdmUqLyBjdHhbMTRdKVxuXHRcdFx0XHRdO1xuXG5cdFx0XHRcdG1vdW50ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cChjdHgsIGRpcnR5KSB7XG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmdyaWQsIGN1cnJlbnRfeSwgY3VycmVudF94LCBtYXJrZWRfd29yZF9ncmlkLCBzZXRDdXJyZW50UG9zLCBoYW5kbGVEb3VibGVjbGljaywgaGFuZGxlS2V5ZG93biwgY2VsbFdpZHRoLCBtYXJnaW4sIGNlbGxIZWlnaHQsIG51bUZvbnRTaXplLCBoYW5kbGVGb2N1cywgbnVtYmVyX2dyaWQsIGlubmVyQm9yZGVyV2lkdGgsIGlubmVyQm9yZGVyQ29sb3VyLCBmaWxsQ29sb3VyLCBmb250U2l6ZSwgYmFja2dyb3VuZENvbG91ciovIDEwOTAzNDI0Nykge1xuXHRcdFx0XHRlYWNoX3ZhbHVlID0gLypncmlkKi8gY3R4WzBdO1xuXHRcdFx0XHRsZXQgaTtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgZWFjaF92YWx1ZS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdGNvbnN0IGNoaWxkX2N0eCA9IGdldF9lYWNoX2NvbnRleHQoY3R4LCBlYWNoX3ZhbHVlLCBpKTtcblxuXHRcdFx0XHRcdGlmIChlYWNoX2Jsb2Nrc1tpXSkge1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0ucChjaGlsZF9jdHgsIGRpcnR5KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0gPSBjcmVhdGVfZWFjaF9ibG9jayhjaGlsZF9jdHgpO1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0uYygpO1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0ubShnLCByZWN0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmb3IgKDsgaSA8IGVhY2hfYmxvY2tzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0uZCgxKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGVhY2hfYmxvY2tzLmxlbmd0aCA9IGVhY2hfdmFsdWUubGVuZ3RoO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWN1cnJlbnQgfHwgZGlydHlbMF0gJiAvKm1hcmdpbiovIDUxMikge1xuXHRcdFx0XHRhdHRyKHJlY3QsIFwieFwiLCAvKm1hcmdpbiovIGN0eFs5XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghY3VycmVudCB8fCBkaXJ0eVswXSAmIC8qbWFyZ2luKi8gNTEyKSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJ5XCIsIC8qbWFyZ2luKi8gY3R4WzldKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFjdXJyZW50IHx8IGRpcnR5WzBdICYgLyp0b3RhbFdpZHRoKi8gMzIpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcIndpZHRoXCIsIC8qdG90YWxXaWR0aCovIGN0eFs1XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghY3VycmVudCB8fCBkaXJ0eVswXSAmIC8qdG90YWxIZWlnaHQqLyA2NCkge1xuXHRcdFx0XHRhdHRyKHJlY3QsIFwiaGVpZ2h0XCIsIC8qdG90YWxIZWlnaHQqLyBjdHhbNl0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWN1cnJlbnQgfHwgZGlydHlbMF0gJiAvKm91dGVyQm9yZGVyQ29sb3VyKi8gMTAyNCkge1xuXHRcdFx0XHRhdHRyKHJlY3QsIFwic3Ryb2tlXCIsIC8qb3V0ZXJCb3JkZXJDb2xvdXIqLyBjdHhbMTBdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFjdXJyZW50IHx8IGRpcnR5WzBdICYgLypvdXRlckJvcmRlcldpZHRoKi8gMTI4KSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJzdHJva2Utd2lkdGhcIiwgLypvdXRlckJvcmRlcldpZHRoKi8gY3R4WzddKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFjdXJyZW50IHx8IGRpcnR5WzBdICYgLyp2aWV3Ym94X3dpZHRoKi8gODM4ODYwOCkge1xuXHRcdFx0XHRhdHRyKHN2ZywgXCJ3aWR0aFwiLCAvKnZpZXdib3hfd2lkdGgqLyBjdHhbMjNdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFjdXJyZW50IHx8IGRpcnR5WzBdICYgLyp2aWV3Ym94X2hlaWdodCovIDE2Nzc3MjE2KSB7XG5cdFx0XHRcdGF0dHIoc3ZnLCBcImhlaWdodFwiLCAvKnZpZXdib3hfaGVpZ2h0Ki8gY3R4WzI0XSk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRpKGxvY2FsKSB7XG5cdFx0XHRpZiAoY3VycmVudCkgcmV0dXJuO1xuXHRcdFx0dHJhbnNpdGlvbl9pbihxdWVzdGlvbnMuJCQuZnJhZ21lbnQsIGxvY2FsKTtcblx0XHRcdGN1cnJlbnQgPSB0cnVlO1xuXHRcdH0sXG5cdFx0byhsb2NhbCkge1xuXHRcdFx0dHJhbnNpdGlvbl9vdXQocXVlc3Rpb25zLiQkLmZyYWdtZW50LCBsb2NhbCk7XG5cdFx0XHRjdXJyZW50ID0gZmFsc2U7XG5cdFx0fSxcblx0XHRkKGRldGFjaGluZykge1xuXHRcdFx0aWYgKGRldGFjaGluZykgZGV0YWNoKG1haW4pO1xuXHRcdFx0LyppbnB1dF9iaW5kaW5nKi8gY3R4WzQzXShudWxsKTtcblx0XHRcdGRlc3Ryb3lfZWFjaChlYWNoX2Jsb2NrcywgZGV0YWNoaW5nKTtcblx0XHRcdC8qZGl2X2JpbmRpbmcqLyBjdHhbNDZdKG51bGwpO1xuXHRcdFx0ZGVzdHJveV9jb21wb25lbnQocXVlc3Rpb25zKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdHJ1bl9hbGwoZGlzcG9zZSk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBpbnN0YW5jZSQyKCQkc2VsZiwgJCRwcm9wcywgJCRpbnZhbGlkYXRlKSB7XG5cdGxldCAkY3VycmVudERpcmVjdGlvbjtcblx0bGV0ICRxdWVzdGlvbnNEb3duO1xuXHRsZXQgJHF1ZXN0aW9uc0Fjcm9zcztcblx0Y29tcG9uZW50X3N1YnNjcmliZSgkJHNlbGYsIGN1cnJlbnREaXJlY3Rpb24sICQkdmFsdWUgPT4gJCRpbnZhbGlkYXRlKDQ4LCAkY3VycmVudERpcmVjdGlvbiA9ICQkdmFsdWUpKTtcblx0Y29tcG9uZW50X3N1YnNjcmliZSgkJHNlbGYsIHF1ZXN0aW9uc0Rvd24sICQkdmFsdWUgPT4gJCRpbnZhbGlkYXRlKDQ5LCAkcXVlc3Rpb25zRG93biA9ICQkdmFsdWUpKTtcblx0Y29tcG9uZW50X3N1YnNjcmliZSgkJHNlbGYsIHF1ZXN0aW9uc0Fjcm9zcywgJCR2YWx1ZSA9PiAkJGludmFsaWRhdGUoNTAsICRxdWVzdGlvbnNBY3Jvc3MgPSAkJHZhbHVlKSk7XG5cdGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCk7XG5cblx0Ly8gUHJpdmF0ZSBwcm9wZXJ0aWVzXG5cdGxldCBudW1iZXJfZ3JpZCA9IFtdO1xuXG5cdGxldCBtYXJrZWRfd29yZF9ncmlkID0gW107XG5cdGxldCBmb250U2l6ZTtcblx0bGV0IG51bUZvbnRTaXplO1xuXHRsZXQgY2VsbFdpZHRoO1xuXHRsZXQgY2VsbEhlaWdodDtcblx0bGV0IHZpZXdib3hfd2lkdGg7XG5cdGxldCB2aWV3Ym94X2hlaWdodDtcblx0bGV0IHsgQ29udGFpbmVyIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBJbnB1dCB9ID0gJCRwcm9wcztcblx0bGV0IHsgZ3JpZCA9IFtdIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBzaXplID0gMTAgfSA9ICQkcHJvcHM7XG5cdGxldCB7IGN1cnJlbnRfeCA9IDAgfSA9ICQkcHJvcHM7XG5cdGxldCB7IGN1cnJlbnRfeSA9IDAgfSA9ICQkcHJvcHM7XG5cdGxldCB7IHRvdGFsV2lkdGggPSA1MDAgfSA9ICQkcHJvcHM7XG5cdGxldCB7IHRvdGFsSGVpZ2h0ID0gNTAwIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBvdXRlckJvcmRlcldpZHRoID0gMS41IH0gPSAkJHByb3BzO1xuXHRsZXQgeyBpbm5lckJvcmRlcldpZHRoID0gMSB9ID0gJCRwcm9wcztcblx0bGV0IHsgbWFyZ2luID0gMyB9ID0gJCRwcm9wcztcblx0bGV0IHsgb3V0ZXJCb3JkZXJDb2xvdXIgPSBcImJsYWNrXCIgfSA9ICQkcHJvcHM7XG5cdGxldCB7IGlubmVyQm9yZGVyQ29sb3VyID0gXCJibGFja1wiIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBmaWxsQ29sb3VyID0gXCJibGFja1wiIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBiYWNrZ3JvdW5kQ29sb3VyID0gXCJ3aGl0ZVwiIH0gPSAkJHByb3BzO1xuXHRjb25zdCBmb250UmF0aW8gPSAwLjc7XG5cdGNvbnN0IG51bVJhdGlvID0gMC4zMztcblxuXHRmdW5jdGlvbiBzZWxlY3RDZWxsKGUpIHtcblx0XHQkJGludmFsaWRhdGUoMSwgY3VycmVudF94ID0gZS5zcmNFbGVtZW50LmdldEF0dHJpYnV0ZShcImRhdGEtY29sXCIpKTtcblx0XHQkJGludmFsaWRhdGUoMiwgY3VycmVudF95ID0gZS5zcmNFbGVtZW50LmdldEF0dHJpYnV0ZShcImRhdGEtcm93XCIpKTtcblx0XHRkcmF3TWFya2VkV29yZEdyaWQoKTtcblx0XHRkaXNwYXRjaChcImNoYW5nZVwiKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlzU3RhcnRPZkFjcm9zcyh4LCB5KSB7XG5cdFx0aWYgKGdyaWRbeV1beF0gPT09IFwiI1wiKSByZXR1cm4gZmFsc2U7XG5cdFx0aWYgKHggPj0gc2l6ZSkgcmV0dXJuIGZhbHNlO1xuXHRcdGxldCB3b3JkID0gZ2V0V29yZCh4LCB5LCBcImFjcm9zc1wiKTtcblx0XHRpZiAod29yZC5sZW5ndGggPD0gMSkgcmV0dXJuIGZhbHNlO1xuXHRcdHJldHVybiB4ID09PSAwIHx8IGdyaWRbeV1beCAtIDFdID09IFwiI1wiO1xuXHR9XG5cblx0ZnVuY3Rpb24gaXNTdGFydE9mRG93bih4LCB5KSB7XG5cdFx0aWYgKGdyaWRbeV1beF0gPT09IFwiI1wiKSByZXR1cm4gZmFsc2U7XG5cdFx0aWYgKHkgPj0gc2l6ZSkgcmV0dXJuIGZhbHNlO1xuXHRcdGxldCB3b3JkID0gZ2V0V29yZCh4LCB5LCBcImRvd25cIik7XG5cdFx0aWYgKHdvcmQubGVuZ3RoIDw9IDEpIHJldHVybiBmYWxzZTtcblx0XHRyZXR1cm4geSA9PT0gMCB8fCBncmlkW3kgLSAxXVt4XSA9PSBcIiNcIjtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldFF1ZXN0aW9uKG51bSwgeCwgeSwgZGlyZWN0aW9uLCBxdWVzdGlvbikge1xuXHRcdGNvbnN0IGFuc3dlciA9IGdldFdvcmQoeCwgeSwgZGlyZWN0aW9uKTtcblxuXHRcdGlmIChkaXJlY3Rpb24gPT09IFwiYWNyb3NzXCIpIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgJHF1ZXN0aW9uc0Fjcm9zcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAoJHF1ZXN0aW9uc0Fjcm9zc1tpXS5hbnN3ZXIgPT09IGFuc3dlciAmJiAkcXVlc3Rpb25zQWNyb3NzW2ldLmRpcmVjdGlvbiA9PT0gZGlyZWN0aW9uKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdC4uLiRxdWVzdGlvbnNBY3Jvc3NbaV0sXG5cdFx0XHRcdFx0XHRhbnN3ZXIsXG5cdFx0XHRcdFx0XHRudW0sXG5cdFx0XHRcdFx0XHR4LFxuXHRcdFx0XHRcdFx0eVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoJHF1ZXN0aW9uc0Fjcm9zc1tpXS5udW0gPT09IG51bSAmJiAkcXVlc3Rpb25zQWNyb3NzW2ldLmRpcmVjdGlvbiA9PT0gZGlyZWN0aW9uKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHsgLi4uJHF1ZXN0aW9uc0Fjcm9zc1tpXSwgYW5zd2VyLCB4LCB5IH07XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0bnVtLFxuXHRcdFx0XHR4LFxuXHRcdFx0XHR5LFxuXHRcdFx0XHRxdWVzdGlvbixcblx0XHRcdFx0YW5zd2VyLFxuXHRcdFx0XHRlZGl0aW5nOiBmYWxzZSxcblx0XHRcdFx0ZGlyZWN0aW9uXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8ICRxdWVzdGlvbnNEb3duLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmICgkcXVlc3Rpb25zRG93bltpXS5hbnN3ZXIgPT09IGFuc3dlciAmJiAkcXVlc3Rpb25zRG93bltpXS5kaXJlY3Rpb24gPT09IGRpcmVjdGlvbikge1xuXHRcdFx0XHRcdHJldHVybiB7IC4uLiRxdWVzdGlvbnNEb3duW2ldLCBhbnN3ZXIsIG51bSwgeCwgeSB9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCRxdWVzdGlvbnNEb3duW2ldLm51bSA9PT0gbnVtICYmICRxdWVzdGlvbnNEb3duW2ldLmRpcmVjdGlvbiA9PT0gZGlyZWN0aW9uKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHNldF9zdG9yZV92YWx1ZShxdWVzdGlvbnNEb3duLCAkcXVlc3Rpb25zRG93bltpXSA9IHsgLi4uJHF1ZXN0aW9uc0Rvd25baV0sIGFuc3dlciwgeCwgeSB9LCAkcXVlc3Rpb25zRG93bik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHNldF9zdG9yZV92YWx1ZShcblx0XHRcdFx0cXVlc3Rpb25zRG93bixcblx0XHRcdFx0JHF1ZXN0aW9uc0Rvd24gPSB7XG5cdFx0XHRcdFx0bnVtLFxuXHRcdFx0XHRcdHgsXG5cdFx0XHRcdFx0eSxcblx0XHRcdFx0XHRxdWVzdGlvbixcblx0XHRcdFx0XHRhbnN3ZXIsXG5cdFx0XHRcdFx0ZWRpdGluZzogZmFsc2UsXG5cdFx0XHRcdFx0ZGlyZWN0aW9uXG5cdFx0XHRcdH0sXG5cdFx0XHRcdCRxdWVzdGlvbnNEb3duXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGdldEN1cnJlbnRRdWVzdGlvbigpIHtcblx0XHRsZXQgeyB4LCB5IH0gPSBnZXRDdXJyZW50UG9zKCk7XG5cdFx0bGV0IHNlbGVjdGVkX3F1ZXN0aW9uO1xuXG5cdFx0bGV0IHF1ZXN0aW9ucyA9ICRjdXJyZW50RGlyZWN0aW9uID09PSBcImFjcm9zc1wiXG5cdFx0PyAkcXVlc3Rpb25zQWNyb3NzXG5cdFx0OiAkcXVlc3Rpb25zRG93bjtcblxuXHRcdGlmICghcXVlc3Rpb25zLmxlbmd0aCkgcmV0dXJuO1xuXG5cdFx0aWYgKCRjdXJyZW50RGlyZWN0aW9uID09PSBcImFjcm9zc1wiKSB7XG5cdFx0XHRzZWxlY3RlZF9xdWVzdGlvbiA9IHF1ZXN0aW9ucy5maW5kKHEgPT4geSA9PT0gcS55ICYmIHggPj0gcS54ICYmIHggPD0gcS54ICsgcS5hbnN3ZXIubGVuZ3RoIC0gMSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHNlbGVjdGVkX3F1ZXN0aW9uID0gcXVlc3Rpb25zLmZpbmQocSA9PiB4ID09PSBxLnggJiYgeSA+PSBxLnkgJiYgeSA8PSBxLnkgKyBxLmFuc3dlci5sZW5ndGggLSAxKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gc2VsZWN0ZWRfcXVlc3Rpb247XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRTdGFydE9mV29yZCh4LCB5LCBkaXJlY3Rpb24pIHtcblx0XHRpZiAoZGlyZWN0aW9uID09PSBcImFjcm9zc1wiKSB7XG5cdFx0XHR3aGlsZSAoeCA+IDAgJiYgZ3JpZFt5XVt4IC0gMV0gIT09IFwiI1wiKSB7XG5cdFx0XHRcdHgtLTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0d2hpbGUgKHkgPiAwICYmIGdyaWRbeSAtIDFdW3hdICE9PSBcIiNcIikge1xuXHRcdFx0XHR5LS07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHsgeCwgeSB9O1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0RW5kT2ZXb3JkKHgsIHksIGRpcmVjdGlvbikge1xuXHRcdGlmIChkaXJlY3Rpb24gPT09IFwiYWNyb3NzXCIpIHtcblx0XHRcdHdoaWxlICh4IDwgc2l6ZSAtIDEgJiYgZ3JpZFt5XVt4ICsgMV0gIT09IFwiI1wiKSB7XG5cdFx0XHRcdHgrKztcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0d2hpbGUgKHkgPCBzaXplIC0gMSAmJiBncmlkW3kgKyAxXVt4XSAhPT0gXCIjXCIpIHtcblx0XHRcdFx0eSsrO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB7IHgsIHkgfTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldFdvcmQoeCwgeSwgZGlyZWN0aW9uKSB7XG5cdFx0bGV0IHN0YXJ0ID0gZ2V0U3RhcnRPZldvcmQoeCwgeSwgZGlyZWN0aW9uKTtcblx0XHRsZXQgZW5kID0gZ2V0RW5kT2ZXb3JkKHgsIHksIGRpcmVjdGlvbik7XG5cdFx0bGV0IHdvcmQgPSBcIlwiO1xuXG5cdFx0aWYgKGRpcmVjdGlvbiA9PT0gXCJhY3Jvc3NcIikge1xuXHRcdFx0Zm9yIChsZXQgaSA9IHN0YXJ0Lng7IGkgPD0gZW5kLng7IGkrKykge1xuXHRcdFx0XHR3b3JkICs9IGdyaWRbeV1baV0gfHwgXCIgXCI7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAobGV0IGkgPSBzdGFydC55OyBpIDw9IGVuZC55OyBpKyspIHtcblx0XHRcdFx0d29yZCArPSBncmlkW2ldW3hdIHx8IFwiIFwiO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB3b3JkO1xuXHR9XG5cblx0ZnVuY3Rpb24gZHJhd01hcmtlZFdvcmRHcmlkKCkge1xuXHRcdCQkaW52YWxpZGF0ZSgxOSwgbWFya2VkX3dvcmRfZ3JpZCA9IEFycmF5KHNpemUpLmZpbGwoZmFsc2UpLm1hcCgoKSA9PiBBcnJheShzaXplKS5maWxsKGZhbHNlKSkpO1xuXG5cdFx0aWYgKCRjdXJyZW50RGlyZWN0aW9uID09PSBcImFjcm9zc1wiKSB7XG5cdFx0XHRmb3IgKGxldCB4ID0gY3VycmVudF94OyB4IDwgc2l6ZTsgeCsrKSB7XG5cdFx0XHRcdGlmICghZ3JpZFtjdXJyZW50X3ldKSBicmVhaztcblxuXHRcdFx0XHRpZiAoZ3JpZFtjdXJyZW50X3ldW3hdID09PSBcIiNcIikge1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0JCRpbnZhbGlkYXRlKDE5LCBtYXJrZWRfd29yZF9ncmlkW2N1cnJlbnRfeV1beF0gPSB0cnVlLCBtYXJrZWRfd29yZF9ncmlkKTtcblx0XHRcdH1cblxuXHRcdFx0Zm9yIChsZXQgeCA9IGN1cnJlbnRfeDsgeCA+PSAwOyB4LS0pIHtcblx0XHRcdFx0aWYgKCFncmlkW2N1cnJlbnRfeV0pIGJyZWFrO1xuXG5cdFx0XHRcdGlmIChncmlkW2N1cnJlbnRfeV1beF0gPT09IFwiI1wiKSB7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQkJGludmFsaWRhdGUoMTksIG1hcmtlZF93b3JkX2dyaWRbY3VycmVudF95XVt4XSA9IHRydWUsIG1hcmtlZF93b3JkX2dyaWQpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBkb3duXG5cdFx0XHRmb3IgKGxldCB5ID0gY3VycmVudF95OyB5IDwgc2l6ZTsgeSsrKSB7XG5cdFx0XHRcdGlmICghZ3JpZFt5XSkgYnJlYWs7XG5cblx0XHRcdFx0aWYgKGdyaWRbeV1bY3VycmVudF94XSA9PT0gXCIjXCIpIHtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgxOSwgbWFya2VkX3dvcmRfZ3JpZFt5XVtjdXJyZW50X3hdID0gdHJ1ZSwgbWFya2VkX3dvcmRfZ3JpZCk7XG5cdFx0XHR9XG5cblx0XHRcdGZvciAobGV0IHkgPSBjdXJyZW50X3k7IHkgPj0gMDsgeS0tKSB7XG5cdFx0XHRcdGlmICghZ3JpZFt5XSkgYnJlYWs7XG5cblx0XHRcdFx0aWYgKGdyaWRbeV1bY3VycmVudF94XSA9PT0gXCIjXCIpIHtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgxOSwgbWFya2VkX3dvcmRfZ3JpZFt5XVtjdXJyZW50X3hdID0gdHJ1ZSwgbWFya2VkX3dvcmRfZ3JpZCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gbW92ZVVwKCkge1xuXHRcdGlmIChjdXJyZW50X3kgPiAwKSB7XG5cdFx0XHQkJGludmFsaWRhdGUoMiwgY3VycmVudF95LS0sIGN1cnJlbnRfeSk7XG5cdFx0XHRkaXNwYXRjaChcImNoYW5nZVwiKTtcblx0XHRcdGRyYXdNYXJrZWRXb3JkR3JpZCgpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIG1vdmVEb3duKCkge1xuXHRcdGlmIChjdXJyZW50X3kgPCBzaXplIC0gMSkge1xuXHRcdFx0JCRpbnZhbGlkYXRlKDIsIGN1cnJlbnRfeSsrLCBjdXJyZW50X3kpO1xuXHRcdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdFx0XHRkcmF3TWFya2VkV29yZEdyaWQoKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBtb3ZlTGVmdCgpIHtcblx0XHRpZiAoY3VycmVudF94ID4gMCkge1xuXHRcdFx0JCRpbnZhbGlkYXRlKDEsIGN1cnJlbnRfeC0tLCBjdXJyZW50X3gpO1xuXHRcdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdFx0XHRkcmF3TWFya2VkV29yZEdyaWQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKGN1cnJlbnRfeSA+IDApIHtcblx0XHRcdFx0JCRpbnZhbGlkYXRlKDIsIGN1cnJlbnRfeS0tLCBjdXJyZW50X3kpO1xuXHRcdFx0XHQkJGludmFsaWRhdGUoMSwgY3VycmVudF94ID0gc2l6ZSAtIDEpO1xuXHRcdFx0XHRkaXNwYXRjaChcImNoYW5nZVwiKTtcblx0XHRcdFx0ZHJhd01hcmtlZFdvcmRHcmlkKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gbW92ZVJpZ2h0KCkge1xuXHRcdGlmIChjdXJyZW50X3ggPCBzaXplIC0gMSkge1xuXHRcdFx0JCRpbnZhbGlkYXRlKDEsIGN1cnJlbnRfeCsrLCBjdXJyZW50X3gpO1xuXHRcdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdFx0XHRkcmF3TWFya2VkV29yZEdyaWQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKGN1cnJlbnRfeSA8IHNpemUgLSAxKSB7XG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgyLCBjdXJyZW50X3krKywgY3VycmVudF95KTtcblx0XHRcdFx0JCRpbnZhbGlkYXRlKDEsIGN1cnJlbnRfeCA9IDApO1xuXHRcdFx0XHRkaXNwYXRjaChcImNoYW5nZVwiKTtcblx0XHRcdFx0ZHJhd01hcmtlZFdvcmRHcmlkKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gbW92ZVN0YXJ0T2ZSb3coKSB7XG5cdFx0JCRpbnZhbGlkYXRlKDEsIGN1cnJlbnRfeCA9IDApO1xuXHRcdGRpc3BhdGNoKFwiY2hhbmdlXCIpO1xuXHRcdGRyYXdNYXJrZWRXb3JkR3JpZCgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gbW92ZUVuZE9mUm93KCkge1xuXHRcdCQkaW52YWxpZGF0ZSgxLCBjdXJyZW50X3ggPSBzaXplIC0gMSk7XG5cdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdFx0ZHJhd01hcmtlZFdvcmRHcmlkKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBtb3ZlU3RhcnRPZkNvbCgpIHtcblx0XHQkJGludmFsaWRhdGUoMiwgY3VycmVudF95ID0gMCk7XG5cdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdFx0ZHJhd01hcmtlZFdvcmRHcmlkKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBtb3ZlRW5kT2ZDb2woKSB7XG5cdFx0JCRpbnZhbGlkYXRlKDIsIGN1cnJlbnRfeSA9IHNpemUgLSAxKTtcblx0XHRkaXNwYXRjaChcImNoYW5nZVwiKTtcblx0XHRkcmF3TWFya2VkV29yZEdyaWQoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZU1vdmUoZGlyKSB7XG5cdFx0aWYgKGRpciA9PT0gXCJ1cFwiKSB7XG5cdFx0XHRtb3ZlVXAoKTtcblx0XHR9XG5cblx0XHRpZiAoZGlyID09PSBcImRvd25cIikge1xuXHRcdFx0bW92ZURvd24oKTtcblx0XHR9XG5cblx0XHRpZiAoZGlyID09PSBcImxlZnRcIikge1xuXHRcdFx0bW92ZUxlZnQoKTtcblx0XHR9XG5cblx0XHRpZiAoZGlyID09PSBcInJpZ2h0XCIpIHtcblx0XHRcdG1vdmVSaWdodCgpO1xuXHRcdH1cblxuXHRcdGlmIChkaXIgPT09IFwiYmFja3NhcGNlXCIpIHtcblx0XHRcdGJhY2tzcGFjZSgpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHRvZ2dsZURpcigpIHtcblx0XHRpZiAoJGN1cnJlbnREaXJlY3Rpb24gPT09IFwiYWNyb3NzXCIpIHtcblx0XHRcdGN1cnJlbnREaXJlY3Rpb24uc2V0KFwiZG93blwiKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y3VycmVudERpcmVjdGlvbi5zZXQoXCJhY3Jvc3NcIik7XG5cdFx0fVxuXG5cdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdFx0ZHJhd01hcmtlZFdvcmRHcmlkKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBzZXREaXIoZGlyZWN0aW9uKSB7XG5cdFx0aWYgKGRpcmVjdGlvbiA9PT0gXCJhY3Jvc3NcIikge1xuXHRcdFx0Y3VycmVudERpcmVjdGlvbi5zZXQoXCJhY3Jvc3NcIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGN1cnJlbnREaXJlY3Rpb24uc2V0KFwiZG93blwiKTtcblx0XHR9XG5cblx0XHRkaXNwYXRjaChcImNoYW5nZVwiKTtcblx0XHRkcmF3TWFya2VkV29yZEdyaWQoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldEN1cnJlbnRQb3MoKSB7XG5cdFx0cmV0dXJuIHsgeDogY3VycmVudF94LCB5OiBjdXJyZW50X3kgfTtcblx0fVxuXG5cdGZ1bmN0aW9uIHNldEN1cnJlbnRQb3MoeCwgeSkge1xuXHRcdCQkaW52YWxpZGF0ZSgxLCBjdXJyZW50X3ggPSB4KTtcblx0XHQkJGludmFsaWRhdGUoMiwgY3VycmVudF95ID0geSk7XG5cdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdFx0ZHJhd01hcmtlZFdvcmRHcmlkKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVEb3VibGVjbGljayh4LCB5KSB7XG5cdFx0dG9nZ2xlRGlyKCk7XG5cdH0gLy8gbGV0IHNlbGVjdGVkX3F1ZXN0aW9uO1xuXHQvLyBsZXQgcXVlc3Rpb25zID0gJGN1cnJlbnREaXJlY3Rpb24gPT09IFwiYWNyb3NzXCIgPyAkcXVlc3Rpb25zQWNyb3NzIDogJHF1ZXN0aW9uc0Rvd247XG5cblx0ZnVuY3Rpb24gaGFuZGxlS2V5ZG93bihlKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGNvbnN0IGtleWNvZGUgPSBlLmtleUNvZGU7XG5cdFx0aWYgKGUubWV0YUtleSkgcmV0dXJuO1xuXG5cdFx0aWYgKGtleWNvZGUgPiA2NCAmJiBrZXljb2RlIDwgOTEpIHtcblx0XHRcdGRpc3BhdGNoKFwibGV0dGVyXCIsIGUua2V5LnRvVXBwZXJDYXNlKCkpO1xuXHRcdH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gNTEpIHtcblx0XHRcdC8vICNcblx0XHRcdGRpc3BhdGNoKFwibGV0dGVyXCIsIFwiI1wiKTtcblx0XHR9IGVsc2UgaWYgKGtleWNvZGUgPT09IDgpIHtcblx0XHRcdC8vIEJhY2tzcGFjZVxuXHRcdFx0ZGlzcGF0Y2goXCJiYWNrc3BhY2VcIik7XG5cdFx0fSBlbHNlIGlmIChrZXljb2RlID09IDMyKSB7XG5cdFx0XHQvLyBTcGFjZVxuXHRcdFx0ZGlzcGF0Y2goXCJsZXR0ZXJcIiwgXCIgXCIpO1xuXHRcdH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gOSkge1xuXHRcdFx0Ly8gRW50ZXJcblx0XHRcdGlmIChlLnNoaWZ0S2V5KSB7XG5cdFx0XHRcdGRpc3BhdGNoKFwibW92ZVwiLCBcInByZXYtd29yZFwiKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRpc3BhdGNoKFwibW92ZVwiLCBcIm5leHQtd29yZFwiKTtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKGtleWNvZGUgPT09IDEzKSB7XG5cdFx0XHQvLyBFbnRlclxuXHRcdFx0ZGlzcGF0Y2goXCJlbnRlclwiKTtcblx0XHR9IGVsc2UgaWYgKGtleWNvZGUgPT09IDM3KSB7XG5cdFx0XHRkaXNwYXRjaChcIm1vdmVcIiwgXCJsZWZ0XCIpO1xuXHRcdH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gMzgpIHtcblx0XHRcdGRpc3BhdGNoKFwibW92ZVwiLCBcInVwXCIpO1xuXHRcdH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gMzkpIHtcblx0XHRcdGRpc3BhdGNoKFwibW92ZVwiLCBcInJpZ2h0XCIpO1xuXHRcdH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gNDApIHtcblx0XHRcdGRpc3BhdGNoKFwibW92ZVwiLCBcImRvd25cIik7XG5cdFx0fVxuXG5cdFx0aGFuZGxlRm9jdXMoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZUZvY3VzKGUpIHtcblx0XHRJbnB1dC5mb2N1cygpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlVXBkYXRlUXVlc3Rpb24oZSkge1xuXHRcdGNvbnN0IHsgcXVlc3Rpb24sIHN1Z2dlc3Rpb24gfSA9IGUuZGV0YWlsO1xuXG5cdFx0aWYgKHF1ZXN0aW9uLmRpcmVjdGlvbiA9PT0gXCJhY3Jvc3NcIikge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzdWdnZXN0aW9uLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgwLCBncmlkW3F1ZXN0aW9uLnldW2kgKyBxdWVzdGlvbi54XSA9IHN1Z2dlc3Rpb25baV0sIGdyaWQpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHN1Z2dlc3Rpb24ubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0JCRpbnZhbGlkYXRlKDAsIGdyaWRbaSArIHF1ZXN0aW9uLnldW3F1ZXN0aW9uLnhdID0gc3VnZ2VzdGlvbltpXSwgZ3JpZCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gaW5wdXRfYmluZGluZygkJHZhbHVlKSB7XG5cdFx0YmluZGluZ19jYWxsYmFja3NbJCR2YWx1ZSA/ICd1bnNoaWZ0JyA6ICdwdXNoJ10oKCkgPT4ge1xuXHRcdFx0SW5wdXQgPSAkJHZhbHVlO1xuXHRcdFx0JCRpbnZhbGlkYXRlKDQsIElucHV0KTtcblx0XHR9KTtcblx0fVxuXG5cdGNvbnN0IGNsaWNrX2hhbmRsZXIgPSAoeCwgeSkgPT4ge1xuXHRcdHNldEN1cnJlbnRQb3MoeCwgeSk7XG5cdH07XG5cblx0Y29uc3QgZGJsY2xpY2tfaGFuZGxlciA9ICh4LCB5KSA9PiB7XG5cdFx0aGFuZGxlRG91YmxlY2xpY2soKTtcblx0fTtcblxuXHRmdW5jdGlvbiBkaXZfYmluZGluZygkJHZhbHVlKSB7XG5cdFx0YmluZGluZ19jYWxsYmFja3NbJCR2YWx1ZSA/ICd1bnNoaWZ0JyA6ICdwdXNoJ10oKCkgPT4ge1xuXHRcdFx0Q29udGFpbmVyID0gJCR2YWx1ZTtcblx0XHRcdCQkaW52YWxpZGF0ZSgzLCBDb250YWluZXIpO1xuXHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2hhbmdlX2hhbmRsZXIoZXZlbnQpIHtcblx0XHRidWJibGUuY2FsbCh0aGlzLCAkJHNlbGYsIGV2ZW50KTtcblx0fVxuXG5cdCQkc2VsZi4kJHNldCA9ICQkcHJvcHMgPT4ge1xuXHRcdGlmICgnQ29udGFpbmVyJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoMywgQ29udGFpbmVyID0gJCRwcm9wcy5Db250YWluZXIpO1xuXHRcdGlmICgnSW5wdXQnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSg0LCBJbnB1dCA9ICQkcHJvcHMuSW5wdXQpO1xuXHRcdGlmICgnZ3JpZCcgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDAsIGdyaWQgPSAkJHByb3BzLmdyaWQpO1xuXHRcdGlmICgnc2l6ZScgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDI4LCBzaXplID0gJCRwcm9wcy5zaXplKTtcblx0XHRpZiAoJ2N1cnJlbnRfeCcgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDEsIGN1cnJlbnRfeCA9ICQkcHJvcHMuY3VycmVudF94KTtcblx0XHRpZiAoJ2N1cnJlbnRfeScgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDIsIGN1cnJlbnRfeSA9ICQkcHJvcHMuY3VycmVudF95KTtcblx0XHRpZiAoJ3RvdGFsV2lkdGgnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSg1LCB0b3RhbFdpZHRoID0gJCRwcm9wcy50b3RhbFdpZHRoKTtcblx0XHRpZiAoJ3RvdGFsSGVpZ2h0JyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoNiwgdG90YWxIZWlnaHQgPSAkJHByb3BzLnRvdGFsSGVpZ2h0KTtcblx0XHRpZiAoJ291dGVyQm9yZGVyV2lkdGgnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSg3LCBvdXRlckJvcmRlcldpZHRoID0gJCRwcm9wcy5vdXRlckJvcmRlcldpZHRoKTtcblx0XHRpZiAoJ2lubmVyQm9yZGVyV2lkdGgnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSg4LCBpbm5lckJvcmRlcldpZHRoID0gJCRwcm9wcy5pbm5lckJvcmRlcldpZHRoKTtcblx0XHRpZiAoJ21hcmdpbicgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDksIG1hcmdpbiA9ICQkcHJvcHMubWFyZ2luKTtcblx0XHRpZiAoJ291dGVyQm9yZGVyQ29sb3VyJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoMTAsIG91dGVyQm9yZGVyQ29sb3VyID0gJCRwcm9wcy5vdXRlckJvcmRlckNvbG91cik7XG5cdFx0aWYgKCdpbm5lckJvcmRlckNvbG91cicgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDExLCBpbm5lckJvcmRlckNvbG91ciA9ICQkcHJvcHMuaW5uZXJCb3JkZXJDb2xvdXIpO1xuXHRcdGlmICgnZmlsbENvbG91cicgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDEyLCBmaWxsQ29sb3VyID0gJCRwcm9wcy5maWxsQ29sb3VyKTtcblx0XHRpZiAoJ2JhY2tncm91bmRDb2xvdXInIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSgxMywgYmFja2dyb3VuZENvbG91ciA9ICQkcHJvcHMuYmFja2dyb3VuZENvbG91cik7XG5cdH07XG5cblx0JCRzZWxmLiQkLnVwZGF0ZSA9ICgpID0+IHtcblx0XHRpZiAoJCRzZWxmLiQkLmRpcnR5WzBdICYgLypzaXplLCB0b3RhbFdpZHRoLCBtYXJnaW4sIG91dGVyQm9yZGVyV2lkdGgsIHRvdGFsSGVpZ2h0LCBjZWxsV2lkdGgsIGdyaWQsIG51bWJlcl9ncmlkLCBjdXJyZW50X3gsIGN1cnJlbnRfeSovIDI2ODgyOTQxNSkge1xuXHRcdFx0e1xuXHRcdFx0XHRpZiAoc2l6ZSA8IDIpIHtcblx0XHRcdFx0XHQkJGludmFsaWRhdGUoMjgsIHNpemUgPSAyKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChzaXplID4gMzApIHtcblx0XHRcdFx0XHQkJGludmFsaWRhdGUoMjgsIHNpemUgPSAzMCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQkJGludmFsaWRhdGUoMjMsIHZpZXdib3hfd2lkdGggPSB0b3RhbFdpZHRoICsgbWFyZ2luICsgb3V0ZXJCb3JkZXJXaWR0aCk7XG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgyNCwgdmlld2JveF9oZWlnaHQgPSB0b3RhbEhlaWdodCArIG1hcmdpbiArIG91dGVyQm9yZGVyV2lkdGgpO1xuXHRcdFx0XHQkJGludmFsaWRhdGUoMTgsIGNlbGxXaWR0aCA9IHRvdGFsV2lkdGggLyBzaXplKTtcblx0XHRcdFx0JCRpbnZhbGlkYXRlKDIyLCBjZWxsSGVpZ2h0ID0gdG90YWxIZWlnaHQgLyBzaXplKTtcblx0XHRcdFx0JCRpbnZhbGlkYXRlKDIwLCBmb250U2l6ZSA9IGNlbGxXaWR0aCAqIGZvbnRSYXRpbyk7XG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgyMSwgbnVtRm9udFNpemUgPSBjZWxsV2lkdGggKiBudW1SYXRpbyk7XG5cdFx0XHRcdGxldCBxdWVzdGlvbnNfYWNyb3NzID0gW107XG5cdFx0XHRcdGxldCBxdWVzdGlvbnNfZG93biA9IFtdO1xuXHRcdFx0XHRsZXQgbnVtID0gMTtcblxuXHRcdFx0XHQvLyBHcm93IGdyaWQgaWYgbmVjZXNzYXJ5XG5cdFx0XHRcdGlmIChncmlkLmxlbmd0aCAtIDEgPCBzaXplKSB7XG5cdFx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcblx0XHRcdFx0XHRcdCQkaW52YWxpZGF0ZSgwLCBncmlkW2ldID0gZ3JpZFtpXSB8fCBBcnJheShzaXplKS5tYXAoKCkgPT4gXCIgXCIpLCBncmlkKTtcblx0XHRcdFx0XHRcdCQkaW52YWxpZGF0ZSgxNywgbnVtYmVyX2dyaWRbaV0gPSBudW1iZXJfZ3JpZFtpXSB8fCBBcnJheShzaXplKS5tYXAoKCkgPT4gXCIgXCIpLCBudW1iZXJfZ3JpZCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gU2hyaW5rIGdyaWQgaWYgbmVjZXNzYXJ5XG5cdFx0XHRcdHdoaWxlIChncmlkLmxlbmd0aCA+IHNpemUpIHtcblx0XHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGdyaWQubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdHdoaWxlIChncmlkW2ldLmxlbmd0aCA+IHNpemUpIHtcblx0XHRcdFx0XHRcdFx0Z3JpZFtpXS5wb3AoKTtcblx0XHRcdFx0XHRcdFx0bnVtYmVyX2dyaWRbaV0ucG9wKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Z3JpZC5wb3AoKTtcblx0XHRcdFx0XHRudW1iZXJfZ3JpZC5wb3AoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIE1ha2Ugc3VyZSB3ZSdyZSBzdGlsbCBpbiB0aGUgZ3JpZFxuXHRcdFx0XHRpZiAoY3VycmVudF94ID49IHNpemUpIHtcblx0XHRcdFx0XHQkJGludmFsaWRhdGUoMSwgY3VycmVudF94ID0gc2l6ZSAtIDEpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGN1cnJlbnRfeSA+PSBzaXplKSB7XG5cdFx0XHRcdFx0JCRpbnZhbGlkYXRlKDIsIGN1cnJlbnRfeSA9IHNpemUgLSAxKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvciAobGV0IHkgPSAwOyB5IDwgc2l6ZTsgeSsrKSB7XG5cdFx0XHRcdFx0aWYgKCFudW1iZXJfZ3JpZFt5XSkge1xuXHRcdFx0XHRcdFx0JCRpbnZhbGlkYXRlKDE3LCBudW1iZXJfZ3JpZFt5XSA9IEFycmF5KHNpemUpLCBudW1iZXJfZ3JpZCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Zm9yIChsZXQgeCA9IDA7IHggPCBzaXplOyB4KyspIHtcblx0XHRcdFx0XHRcdCQkaW52YWxpZGF0ZSgwLCBncmlkW3ldW3hdID0gZ3JpZFt5XVt4XSB8fCBcIiBcIiwgZ3JpZCk7XG5cdFx0XHRcdFx0XHRpZiAoZ3JpZFt5XVt4XSA9PT0gXCIjXCIpIGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0bGV0IGZvdW5kID0gZmFsc2U7XG5cblx0XHRcdFx0XHRcdGlmIChpc1N0YXJ0T2ZBY3Jvc3MoeCwgeSkpIHtcblx0XHRcdFx0XHRcdFx0cXVlc3Rpb25zX2Fjcm9zcy5wdXNoKGdldFF1ZXN0aW9uKG51bSwgeCwgeSwgXCJhY3Jvc3NcIiwgXCJcIikpO1xuXHRcdFx0XHRcdFx0XHRmb3VuZCA9IHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChpc1N0YXJ0T2ZEb3duKHgsIHkpKSB7XG5cdFx0XHRcdFx0XHRcdHF1ZXN0aW9uc19kb3duLnB1c2goZ2V0UXVlc3Rpb24obnVtLCB4LCB5LCBcImRvd25cIiwgXCJcIikpO1xuXHRcdFx0XHRcdFx0XHRmb3VuZCA9IHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmICghZm91bmQpIHtcblx0XHRcdFx0XHRcdFx0JCRpbnZhbGlkYXRlKDE3LCBudW1iZXJfZ3JpZFt5XVt4XSA9IG51bGwsIG51bWJlcl9ncmlkKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdCQkaW52YWxpZGF0ZSgxNywgbnVtYmVyX2dyaWRbeV1beF0gPSBudW0rKywgbnVtYmVyX2dyaWQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIHF1ZXN0aW9uc19hY3Jvc3Muc29ydCgpO1xuXHRcdFx0XHQvLyBxdWVzdGlvbnNfZG93bi5zb3J0KCk7XG5cdFx0XHRcdHF1ZXN0aW9uc0Fjcm9zcy5zZXQocXVlc3Rpb25zX2Fjcm9zcyk7XG5cblx0XHRcdFx0cXVlc3Rpb25zRG93bi5zZXQocXVlc3Rpb25zX2Rvd24pO1xuXG5cdFx0XHRcdC8vIEZpbmQgdGhlIGN1cnJlbnQgcXVlc3Rpb25cblx0XHRcdFx0Y29uc3QgY3VycmVudF9xdWVzdGlvbiA9IGdldEN1cnJlbnRRdWVzdGlvbigpO1xuXG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKGN1cnJlbnRfcXVlc3Rpb24pO1xuXHRcdFx0XHRjdXJyZW50UXVlc3Rpb24uc2V0KGN1cnJlbnRfcXVlc3Rpb24pO1xuXG5cdFx0XHRcdGRyYXdNYXJrZWRXb3JkR3JpZCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gW1xuXHRcdGdyaWQsXG5cdFx0Y3VycmVudF94LFxuXHRcdGN1cnJlbnRfeSxcblx0XHRDb250YWluZXIsXG5cdFx0SW5wdXQsXG5cdFx0dG90YWxXaWR0aCxcblx0XHR0b3RhbEhlaWdodCxcblx0XHRvdXRlckJvcmRlcldpZHRoLFxuXHRcdGlubmVyQm9yZGVyV2lkdGgsXG5cdFx0bWFyZ2luLFxuXHRcdG91dGVyQm9yZGVyQ29sb3VyLFxuXHRcdGlubmVyQm9yZGVyQ29sb3VyLFxuXHRcdGZpbGxDb2xvdXIsXG5cdFx0YmFja2dyb3VuZENvbG91cixcblx0XHRoYW5kbGVNb3ZlLFxuXHRcdHNldEN1cnJlbnRQb3MsXG5cdFx0aGFuZGxlS2V5ZG93bixcblx0XHRudW1iZXJfZ3JpZCxcblx0XHRjZWxsV2lkdGgsXG5cdFx0bWFya2VkX3dvcmRfZ3JpZCxcblx0XHRmb250U2l6ZSxcblx0XHRudW1Gb250U2l6ZSxcblx0XHRjZWxsSGVpZ2h0LFxuXHRcdHZpZXdib3hfd2lkdGgsXG5cdFx0dmlld2JveF9oZWlnaHQsXG5cdFx0aGFuZGxlRG91YmxlY2xpY2ssXG5cdFx0aGFuZGxlRm9jdXMsXG5cdFx0aGFuZGxlVXBkYXRlUXVlc3Rpb24sXG5cdFx0c2l6ZSxcblx0XHRmb250UmF0aW8sXG5cdFx0bnVtUmF0aW8sXG5cdFx0c2VsZWN0Q2VsbCxcblx0XHRtb3ZlVXAsXG5cdFx0bW92ZURvd24sXG5cdFx0bW92ZUxlZnQsXG5cdFx0bW92ZVJpZ2h0LFxuXHRcdG1vdmVTdGFydE9mUm93LFxuXHRcdG1vdmVFbmRPZlJvdyxcblx0XHRtb3ZlU3RhcnRPZkNvbCxcblx0XHRtb3ZlRW5kT2ZDb2wsXG5cdFx0dG9nZ2xlRGlyLFxuXHRcdHNldERpcixcblx0XHRnZXRDdXJyZW50UG9zLFxuXHRcdGlucHV0X2JpbmRpbmcsXG5cdFx0Y2xpY2tfaGFuZGxlcixcblx0XHRkYmxjbGlja19oYW5kbGVyLFxuXHRcdGRpdl9iaW5kaW5nLFxuXHRcdGNoYW5nZV9oYW5kbGVyXG5cdF07XG59XG5cbmNsYXNzIEdyaWQgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuXHRjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG5cdFx0c3VwZXIoKTtcblxuXHRcdGluaXQoXG5cdFx0XHR0aGlzLFxuXHRcdFx0b3B0aW9ucyxcblx0XHRcdGluc3RhbmNlJDIsXG5cdFx0XHRjcmVhdGVfZnJhZ21lbnQkMixcblx0XHRcdHNhZmVfbm90X2VxdWFsLFxuXHRcdFx0e1xuXHRcdFx0XHRDb250YWluZXI6IDMsXG5cdFx0XHRcdElucHV0OiA0LFxuXHRcdFx0XHRncmlkOiAwLFxuXHRcdFx0XHRzaXplOiAyOCxcblx0XHRcdFx0Y3VycmVudF94OiAxLFxuXHRcdFx0XHRjdXJyZW50X3k6IDIsXG5cdFx0XHRcdHRvdGFsV2lkdGg6IDUsXG5cdFx0XHRcdHRvdGFsSGVpZ2h0OiA2LFxuXHRcdFx0XHRvdXRlckJvcmRlcldpZHRoOiA3LFxuXHRcdFx0XHRpbm5lckJvcmRlcldpZHRoOiA4LFxuXHRcdFx0XHRtYXJnaW46IDksXG5cdFx0XHRcdG91dGVyQm9yZGVyQ29sb3VyOiAxMCxcblx0XHRcdFx0aW5uZXJCb3JkZXJDb2xvdXI6IDExLFxuXHRcdFx0XHRmaWxsQ29sb3VyOiAxMixcblx0XHRcdFx0YmFja2dyb3VuZENvbG91cjogMTMsXG5cdFx0XHRcdGZvbnRSYXRpbzogMjksXG5cdFx0XHRcdG51bVJhdGlvOiAzMCxcblx0XHRcdFx0c2VsZWN0Q2VsbDogMzEsXG5cdFx0XHRcdG1vdmVVcDogMzIsXG5cdFx0XHRcdG1vdmVEb3duOiAzMyxcblx0XHRcdFx0bW92ZUxlZnQ6IDM0LFxuXHRcdFx0XHRtb3ZlUmlnaHQ6IDM1LFxuXHRcdFx0XHRtb3ZlU3RhcnRPZlJvdzogMzYsXG5cdFx0XHRcdG1vdmVFbmRPZlJvdzogMzcsXG5cdFx0XHRcdG1vdmVTdGFydE9mQ29sOiAzOCxcblx0XHRcdFx0bW92ZUVuZE9mQ29sOiAzOSxcblx0XHRcdFx0aGFuZGxlTW92ZTogMTQsXG5cdFx0XHRcdHRvZ2dsZURpcjogNDAsXG5cdFx0XHRcdHNldERpcjogNDEsXG5cdFx0XHRcdGdldEN1cnJlbnRQb3M6IDQyLFxuXHRcdFx0XHRzZXRDdXJyZW50UG9zOiAxNSxcblx0XHRcdFx0aGFuZGxlS2V5ZG93bjogMTZcblx0XHRcdH0sXG5cdFx0XHRudWxsLFxuXHRcdFx0Wy0xLCAtMSwgLTFdXG5cdFx0KTtcblx0fVxuXG5cdGdldCBmb250UmF0aW8oKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzI5XTtcblx0fVxuXG5cdGdldCBudW1SYXRpbygpIHtcblx0XHRyZXR1cm4gdGhpcy4kJC5jdHhbMzBdO1xuXHR9XG5cblx0Z2V0IHNlbGVjdENlbGwoKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzMxXTtcblx0fVxuXG5cdGdldCBtb3ZlVXAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzMyXTtcblx0fVxuXG5cdGdldCBtb3ZlRG93bigpIHtcblx0XHRyZXR1cm4gdGhpcy4kJC5jdHhbMzNdO1xuXHR9XG5cblx0Z2V0IG1vdmVMZWZ0KCkge1xuXHRcdHJldHVybiB0aGlzLiQkLmN0eFszNF07XG5cdH1cblxuXHRnZXQgbW92ZVJpZ2h0KCkge1xuXHRcdHJldHVybiB0aGlzLiQkLmN0eFszNV07XG5cdH1cblxuXHRnZXQgbW92ZVN0YXJ0T2ZSb3coKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzM2XTtcblx0fVxuXG5cdGdldCBtb3ZlRW5kT2ZSb3coKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzM3XTtcblx0fVxuXG5cdGdldCBtb3ZlU3RhcnRPZkNvbCgpIHtcblx0XHRyZXR1cm4gdGhpcy4kJC5jdHhbMzhdO1xuXHR9XG5cblx0Z2V0IG1vdmVFbmRPZkNvbCgpIHtcblx0XHRyZXR1cm4gdGhpcy4kJC5jdHhbMzldO1xuXHR9XG5cblx0Z2V0IGhhbmRsZU1vdmUoKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzE0XTtcblx0fVxuXG5cdGdldCB0b2dnbGVEaXIoKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzQwXTtcblx0fVxuXG5cdGdldCBzZXREaXIoKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzQxXTtcblx0fVxuXG5cdGdldCBnZXRDdXJyZW50UG9zKCkge1xuXHRcdHJldHVybiB0aGlzLiQkLmN0eFs0Ml07XG5cdH1cblxuXHRnZXQgc2V0Q3VycmVudFBvcygpIHtcblx0XHRyZXR1cm4gdGhpcy4kJC5jdHhbMTVdO1xuXHR9XG5cblx0Z2V0IGhhbmRsZUtleWRvd24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzE2XTtcblx0fVxufVxuXG4vKiBzcmMvSW5zdHJ1Y3Rpb25zLnN2ZWx0ZSBnZW5lcmF0ZWQgYnkgU3ZlbHRlIHYzLjQ2LjQgKi9cblxuZnVuY3Rpb24gY3JlYXRlX2ZyYWdtZW50JDEoY3R4KSB7XG5cdGxldCBtYWluO1xuXHRsZXQgZGl2O1xuXHRsZXQgdDE7XG5cdGxldCBoMjtcblx0bGV0IHQzO1xuXHRsZXQgcDA7XG5cdGxldCB0NTtcblx0bGV0IHAxO1xuXHRsZXQgdDc7XG5cdGxldCBwMjtcblx0bGV0IHQ5O1xuXHRsZXQgcDM7XG5cdGxldCB0MTE7XG5cdGxldCBwNDtcblx0bGV0IHQxMztcblx0bGV0IHA1O1xuXHRsZXQgbW91bnRlZDtcblx0bGV0IGRpc3Bvc2U7XG5cblx0cmV0dXJuIHtcblx0XHRjKCkge1xuXHRcdFx0bWFpbiA9IGVsZW1lbnQoXCJtYWluXCIpO1xuXHRcdFx0ZGl2ID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdGRpdi50ZXh0Q29udGVudCA9IFwiw5dcIjtcblx0XHRcdHQxID0gc3BhY2UoKTtcblx0XHRcdGgyID0gZWxlbWVudChcImgyXCIpO1xuXHRcdFx0aDIudGV4dENvbnRlbnQgPSBcIkluc3RydWN0aW9uc1wiO1xuXHRcdFx0dDMgPSBzcGFjZSgpO1xuXHRcdFx0cDAgPSBlbGVtZW50KFwicFwiKTtcblx0XHRcdHAwLnRleHRDb250ZW50ID0gXCJVc2UgXFxcIiNcXFwiIHRvIGNyZWF0ZSBhIGJsYW5rIHNxdWFyZS5cIjtcblx0XHRcdHQ1ID0gc3BhY2UoKTtcblx0XHRcdHAxID0gZWxlbWVudChcInBcIik7XG5cdFx0XHRwMS50ZXh0Q29udGVudCA9IFwiSGl0IEVudGVyIG9yIGRvdWJsZS1jbGljayB0aGUgcXVlc3Rpb24gb24gdGhlIHJpZ2h0IHRvIHNldCBhbiBhbnN3ZXIuXCI7XG5cdFx0XHR0NyA9IHNwYWNlKCk7XG5cdFx0XHRwMiA9IGVsZW1lbnQoXCJwXCIpO1xuXHRcdFx0cDIudGV4dENvbnRlbnQgPSBcIlVzZSBTcGFjZSB0byBjaGFuZ2UgZGlyZWN0aW9ucy5cIjtcblx0XHRcdHQ5ID0gc3BhY2UoKTtcblx0XHRcdHAzID0gZWxlbWVudChcInBcIik7XG5cdFx0XHRwMy50ZXh0Q29udGVudCA9IFwiVXNlIGFycm93IGtleXMgdG8gbmF2aWdhdGUuXCI7XG5cdFx0XHR0MTEgPSBzcGFjZSgpO1xuXHRcdFx0cDQgPSBlbGVtZW50KFwicFwiKTtcblx0XHRcdHA0LnRleHRDb250ZW50ID0gXCJIaW50OiBDb21wbGV0ZSB0aGUgd29yZHMgYmVmb3JlIHN0YXJ0aW5nIG9uIHRoZSBhbnN3ZXJzLCBiZWNhdXNlIHlvdSBtaWdodCBoYXZlIHRvIGNoYW5nZSBzb21ldGhpbmchXCI7XG5cdFx0XHR0MTMgPSBzcGFjZSgpO1xuXHRcdFx0cDUgPSBlbGVtZW50KFwicFwiKTtcblx0XHRcdHA1LmlubmVySFRNTCA9IGBOb3RlOiBUaGlzIENyb3Nzd29yZCBDcmVhdG9yIGlzIGluIEFscGhhLiA8YSBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL2otbm9yd29vZC15b3VuZy9qeHdvcmQtY3JlYXRvci9pc3N1ZXNcIj5QbGVhc2UgcmVwb3J0IGJ1Z3MgaGVyZTwvYT4uYDtcblx0XHRcdGF0dHIoZGl2LCBcImNsYXNzXCIsIFwiY2xvc2Ugc3ZlbHRlLW40azVwMVwiKTtcblx0XHRcdGF0dHIobWFpbiwgXCJjbGFzc1wiLCBcInN2ZWx0ZS1uNGs1cDFcIik7XG5cdFx0XHR0b2dnbGVfY2xhc3MobWFpbiwgXCJ2aXNpYmxlXCIsIC8qdmlzaWJsZSovIGN0eFswXSk7XG5cdFx0fSxcblx0XHRtKHRhcmdldCwgYW5jaG9yKSB7XG5cdFx0XHRpbnNlcnQodGFyZ2V0LCBtYWluLCBhbmNob3IpO1xuXHRcdFx0YXBwZW5kKG1haW4sIGRpdik7XG5cdFx0XHRhcHBlbmQobWFpbiwgdDEpO1xuXHRcdFx0YXBwZW5kKG1haW4sIGgyKTtcblx0XHRcdGFwcGVuZChtYWluLCB0Myk7XG5cdFx0XHRhcHBlbmQobWFpbiwgcDApO1xuXHRcdFx0YXBwZW5kKG1haW4sIHQ1KTtcblx0XHRcdGFwcGVuZChtYWluLCBwMSk7XG5cdFx0XHRhcHBlbmQobWFpbiwgdDcpO1xuXHRcdFx0YXBwZW5kKG1haW4sIHAyKTtcblx0XHRcdGFwcGVuZChtYWluLCB0OSk7XG5cdFx0XHRhcHBlbmQobWFpbiwgcDMpO1xuXHRcdFx0YXBwZW5kKG1haW4sIHQxMSk7XG5cdFx0XHRhcHBlbmQobWFpbiwgcDQpO1xuXHRcdFx0YXBwZW5kKG1haW4sIHQxMyk7XG5cdFx0XHRhcHBlbmQobWFpbiwgcDUpO1xuXG5cdFx0XHRpZiAoIW1vdW50ZWQpIHtcblx0XHRcdFx0ZGlzcG9zZSA9IGxpc3RlbihkaXYsIFwiY2xpY2tcIiwgLypoaWRlSW5zdHJ1Y3Rpb25zKi8gY3R4WzFdKTtcblx0XHRcdFx0bW91bnRlZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRwKGN0eCwgW2RpcnR5XSkge1xuXHRcdFx0aWYgKGRpcnR5ICYgLyp2aXNpYmxlKi8gMSkge1xuXHRcdFx0XHR0b2dnbGVfY2xhc3MobWFpbiwgXCJ2aXNpYmxlXCIsIC8qdmlzaWJsZSovIGN0eFswXSk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRpOiBub29wLFxuXHRcdG86IG5vb3AsXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaChtYWluKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdGRpc3Bvc2UoKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGluc3RhbmNlJDEoJCRzZWxmLCAkJHByb3BzLCAkJGludmFsaWRhdGUpIHtcblx0bGV0IHsgdmlzaWJsZSA9IGZhbHNlIH0gPSAkJHByb3BzO1xuXG5cdGZ1bmN0aW9uIGhpZGVJbnN0cnVjdGlvbnMoKSB7XG5cdFx0JCRpbnZhbGlkYXRlKDAsIHZpc2libGUgPSBmYWxzZSk7XG5cdH1cblxuXHQkJHNlbGYuJCRzZXQgPSAkJHByb3BzID0+IHtcblx0XHRpZiAoJ3Zpc2libGUnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSgwLCB2aXNpYmxlID0gJCRwcm9wcy52aXNpYmxlKTtcblx0fTtcblxuXHRyZXR1cm4gW3Zpc2libGUsIGhpZGVJbnN0cnVjdGlvbnNdO1xufVxuXG5jbGFzcyBJbnN0cnVjdGlvbnMgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuXHRjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG5cdFx0c3VwZXIoKTtcblx0XHRpbml0KHRoaXMsIG9wdGlvbnMsIGluc3RhbmNlJDEsIGNyZWF0ZV9mcmFnbWVudCQxLCBzYWZlX25vdF9lcXVhbCwgeyB2aXNpYmxlOiAwIH0pO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHNhdmVTdGF0ZShzdGF0ZSkge1xuICAgIGxldCBzdGF0ZVN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHN0YXRlKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnanh3b3JkLWNyZWF0b3InLCBzdGF0ZVN0cmluZyk7XG59XG5cbmZ1bmN0aW9uIHJlc3RvcmVTdGF0ZSgpIHtcbiAgICBsZXQgc3RhdGVTdHJpbmcgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnanh3b3JkLWNyZWF0b3InKTtcbiAgICBpZiAoc3RhdGVTdHJpbmcpIHtcbiAgICAgICAgbGV0IHN0YXRlID0gSlNPTi5wYXJzZShzdGF0ZVN0cmluZyk7XG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNsZWFyU3RhdGUoKSB7XG4gICAgbG9jYWxTdG9yYWdlLmNsZWFyKCk7XG59XG5cbmNvbnN0IGZvcm1hdF9kYXRlID0gKGRhdGUpID0+IG5ldyBEYXRlKGRhdGUpLnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwgMTApO1xuXG5mdW5jdGlvbiBYREVuY29kZShvYmopIHtcbiAgICBsZXQgc3RyID0gXCJcIjtcbiAgICBpZiAob2JqLnRpdGxlKSB7XG4gICAgICAgIHN0ciArPSBgVGl0bGU6ICR7b2JqLnRpdGxlfVxcbmA7XG4gICAgfVxuICAgIGlmIChvYmouYXV0aG9yKSB7XG4gICAgICAgIHN0ciArPSBgQXV0aG9yOiAke29iai5hdXRob3J9XFxuYDtcbiAgICB9XG4gICAgaWYgKG9iai5lZGl0b3IpIHtcbiAgICAgICAgc3RyICs9IGBFZGl0b3I6ICR7b2JqLmVkaXRvcn1cXG5gO1xuICAgIH1cbiAgICBpZiAob2JqLmRhdGUpIHtcbiAgICAgICAgc3RyICs9IGBEYXRlOiAke2Zvcm1hdF9kYXRlKG9iai5kYXRlKX1cXG5gO1xuICAgIH1cbiAgICBzdHIgKz0gYFxcblxcbmA7XG4gICAgZm9yIChsZXQgeSA9IDA7IHkgPCBvYmouZ3JpZC5sZW5ndGg7IHkrKykge1xuICAgICAgICBmb3IobGV0IHggPSAwOyB4IDwgb2JqLmdyaWRbeV0ubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIHN0ciArPSBgJHtvYmouZ3JpZFt5XVt4XX1gO1xuICAgICAgICB9XG4gICAgICAgIHN0ciArPSBgXFxuYDtcbiAgICB9XG4gICAgc3RyICs9IGBcXG5cXG5gO1xuICAgIGZvciAobGV0IHEgb2Ygb2JqLnF1ZXN0aW9uc19hY3Jvc3MpIHtcbiAgICAgICAgc3RyICs9IGBBJHtxLm51bX0uICR7cS5xdWVzdGlvbn0gfiAke3EuYW5zd2VyfVxcbmA7XG4gICAgfVxuICAgIHN0ciArPSBgXFxuYDtcbiAgICBmb3IgKGxldCBxIG9mIG9iai5xdWVzdGlvbnNfZG93bikge1xuICAgICAgICBzdHIgKz0gYEQke3EubnVtfS4gJHtxLnF1ZXN0aW9ufSB+ICR7cS5hbnN3ZXJ9XFxuYDtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn1cblxuLy8gQSBsaWJyYXJ5IGZvciBjb252ZXJ0aW5nIC54ZCBDcm9zc3dvcmQgZGF0YSB0byBKU09OIChhcyBkZWZpbmVkIGJ5IFNhdWwgUHdhbnNvbiAtIGh0dHA6Ly94ZC5zYXVsLnB3KSB3cml0dGVuIGJ5IEphc29uIE5vcndvb2QtWW91bmdcblxuZnVuY3Rpb24gWERQYXJzZXIoZGF0YSkge1xuICAgIGZ1bmN0aW9uIHByb2Nlc3NEYXRhKGRhdGEpIHtcbiAgICAgICAgLy8gU3BsaXQgaW50byBwYXJ0c1xuICAgICAgICBsZXQgcGFydHMgPSBkYXRhLnNwbGl0KC9eJF4kL2dtKS5maWx0ZXIocyA9PiBzICE9PSBcIlxcblwiKTtcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA+IDQpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgICAgIHBhcnRzID0gZGF0YS5zcGxpdCgvXFxyXFxuXFxyXFxuL2cpLmZpbHRlcihzID0+IChzLnRyaW0oKSkpO1xuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcGFydHNbaV0gPSBwYXJ0c1tpXS5yZXBsYWNlKC9cXHJcXG4vZywgXCJcXG5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCAhPT0gNCkgdGhyb3cgKGBUb28gbWFueSBwYXJ0cyAtIGV4cGVjdGVkIDQsIGZvdW5kICR7cGFydHMubGVuZ3RofWApO1xuICAgICAgICBjb25zdCByYXdNZXRhID0gcGFydHNbMF07XG4gICAgICAgIGNvbnN0IHJhd0dyaWQgPSBwYXJ0c1sxXTtcbiAgICAgICAgY29uc3QgcmF3QWNyb3NzID0gcGFydHNbMl07XG4gICAgICAgIGNvbnN0IHJhd0Rvd24gPSBwYXJ0c1szXTtcbiAgICAgICAgY29uc3QgbWV0YSA9IHByb2Nlc3NNZXRhKHJhd01ldGEpO1xuICAgICAgICBjb25zdCBncmlkID0gcHJvY2Vzc0dyaWQocmF3R3JpZCk7XG4gICAgICAgIGNvbnN0IGFjcm9zcyA9IHByb2Nlc3NDbHVlcyhyYXdBY3Jvc3MpO1xuICAgICAgICBjb25zdCBkb3duID0gcHJvY2Vzc0NsdWVzKHJhd0Rvd24pO1xuICAgICAgICByZXR1cm4geyBtZXRhLCBncmlkLCBhY3Jvc3MsIGRvd24sIHJhd0dyaWQsIHJhd0Fjcm9zcywgcmF3RG93biwgcmF3TWV0YSwgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzTWV0YShyYXdNZXRhKSB7XG4gICAgICAgIGNvbnN0IG1ldGFMaW5lcyA9IHJhd01ldGEuc3BsaXQoXCJcXG5cIikuZmlsdGVyKHMgPT4gKHMpICYmIHMgIT09IFwiXFxuXCIpO1xuICAgICAgICBsZXQgbWV0YSA9IHt9O1xuICAgICAgICBtZXRhTGluZXMuZm9yRWFjaChtZXRhTGluZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBsaW5lUGFydHMgPSBtZXRhTGluZS5zcGxpdChcIjogXCIpO1xuICAgICAgICAgICAgbWV0YVtsaW5lUGFydHNbMF1dID0gbGluZVBhcnRzWzFdO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG1ldGE7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0dyaWQocmF3R3JpZCkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgICAgIGNvbnN0IGxpbmVzID0gcmF3R3JpZC5zcGxpdChcIlxcblwiKS5maWx0ZXIocyA9PiAocykgJiYgcyAhPT0gXCJcXG5cIik7XG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgbGluZXMubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIHJlc3VsdFt4XSA9IGxpbmVzW3hdLnNwbGl0KFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0NsdWVzKHJhd0NsdWVzKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICAgICAgY29uc3QgbGluZXMgPSByYXdDbHVlcy5zcGxpdChcIlxcblwiKS5maWx0ZXIocyA9PiAocykgJiYgcyAhPT0gXCJcXG5cIik7XG4gICAgICAgIGNvbnN0IHJlZ2V4ID0gLyheLlxcZCopXFwuXFxzKC4qKVxcc35cXHMoLiopLztcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBsaW5lcy5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgaWYgKCFsaW5lc1t4XS50cmltKCkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgY29uc3QgcGFydHMgPSBsaW5lc1t4XS5tYXRjaChyZWdleCk7XG4gICAgICAgICAgICBpZiAocGFydHMubGVuZ3RoICE9PSA0KSB0aHJvdyAoYENvdWxkIG5vdCBwYXJzZSBxdWVzdGlvbiAke2xpbmVzW3hdfWApO1xuICAgICAgICAgICAgLy8gVW5lc2NhcGUgc3RyaW5nXG4gICAgICAgICAgICBjb25zdCBxdWVzdGlvbiA9IHBhcnRzWzJdLnJlcGxhY2UoL1xcXFwvZywgXCJcIik7XG4gICAgICAgICAgICByZXN1bHRbeF0gPSB7XG4gICAgICAgICAgICAgICAgbnVtOiBwYXJ0c1sxXSxcbiAgICAgICAgICAgICAgICBxdWVzdGlvbjogcXVlc3Rpb24sXG4gICAgICAgICAgICAgICAgYW5zd2VyOiBwYXJ0c1szXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHJldHVybiBwcm9jZXNzRGF0YShkYXRhKTtcbn1cblxudmFyIHhkQ3Jvc3N3b3JkUGFyc2VyID0gWERQYXJzZXI7XG5cbi8qIHNyYy9KWFdvcmRDcmVhdG9yLnN2ZWx0ZSBnZW5lcmF0ZWQgYnkgU3ZlbHRlIHYzLjQ2LjQgKi9cblxuZnVuY3Rpb24gY3JlYXRlX2ZyYWdtZW50KGN0eCkge1xuXHRsZXQgbWFpbjtcblx0bGV0IGluc3RydWN0aW9ucztcblx0bGV0IHVwZGF0aW5nX3Zpc2libGU7XG5cdGxldCB0MDtcblx0bGV0IGRpdjI7XG5cdGxldCBsYWJlbDA7XG5cdGxldCB0Mjtcblx0bGV0IGlucHV0MDtcblx0bGV0IHQzO1xuXHRsZXQgbGFiZWwxO1xuXHRsZXQgdDU7XG5cdGxldCBpbnB1dDE7XG5cdGxldCB0Njtcblx0bGV0IGxhYmVsMjtcblx0bGV0IHQ4O1xuXHRsZXQgaW5wdXQyO1xuXHRsZXQgdDk7XG5cdGxldCBsYWJlbDM7XG5cdGxldCB0MTE7XG5cdGxldCBpbnB1dDM7XG5cdGxldCB0MTI7XG5cdGxldCBsYWJlbDQ7XG5cdGxldCB0MTQ7XG5cdGxldCBpbnB1dDQ7XG5cdGxldCB0MTU7XG5cdGxldCBkaXYxO1xuXHRsZXQgZGl2MDtcblx0bGV0IG1lbnU7XG5cdGxldCB0MTY7XG5cdGxldCBncmlkXzE7XG5cdGxldCB1cGRhdGluZ19Db250YWluZXI7XG5cdGxldCB0MTc7XG5cdGxldCBsYWJlbDU7XG5cdGxldCB0MTk7XG5cdGxldCBpbnB1dDU7XG5cdGxldCB0MjA7XG5cdGxldCB0ZXh0YXJlYTtcblx0bGV0IGN1cnJlbnQ7XG5cdGxldCBtb3VudGVkO1xuXHRsZXQgZGlzcG9zZTtcblxuXHRmdW5jdGlvbiBpbnN0cnVjdGlvbnNfdmlzaWJsZV9iaW5kaW5nKHZhbHVlKSB7XG5cdFx0LyppbnN0cnVjdGlvbnNfdmlzaWJsZV9iaW5kaW5nKi8gY3R4WzIxXSh2YWx1ZSk7XG5cdH1cblxuXHRsZXQgaW5zdHJ1Y3Rpb25zX3Byb3BzID0ge307XG5cblx0aWYgKC8qaW5zdHJ1Y3Rpb25zVmlzaWJsZSovIGN0eFsxMV0gIT09IHZvaWQgMCkge1xuXHRcdGluc3RydWN0aW9uc19wcm9wcy52aXNpYmxlID0gLyppbnN0cnVjdGlvbnNWaXNpYmxlKi8gY3R4WzExXTtcblx0fVxuXG5cdGluc3RydWN0aW9ucyA9IG5ldyBJbnN0cnVjdGlvbnMoeyBwcm9wczogaW5zdHJ1Y3Rpb25zX3Byb3BzIH0pO1xuXHRiaW5kaW5nX2NhbGxiYWNrcy5wdXNoKCgpID0+IGJpbmQoaW5zdHJ1Y3Rpb25zLCAndmlzaWJsZScsIGluc3RydWN0aW9uc192aXNpYmxlX2JpbmRpbmcpKTtcblx0bWVudSA9IG5ldyBNZW51KHt9KTtcblx0bWVudS4kb24oXCJyZXNldFwiLCAvKmhhbmRsZVJlc2V0Ki8gY3R4WzE3XSk7XG5cdG1lbnUuJG9uKFwiaW5zdHJ1Y3Rpb25zXCIsIC8qaGFuZGxlSW5zdHJ1Y3Rpb25zKi8gY3R4WzE5XSk7XG5cblx0ZnVuY3Rpb24gZ3JpZF8xX0NvbnRhaW5lcl9iaW5kaW5nKHZhbHVlKSB7XG5cdFx0LypncmlkXzFfQ29udGFpbmVyX2JpbmRpbmcqLyBjdHhbMjhdKHZhbHVlKTtcblx0fVxuXG5cdGxldCBncmlkXzFfcHJvcHMgPSB7XG5cdFx0c2l6ZTogLypzaXplKi8gY3R4WzldLFxuXHRcdGdyaWQ6IC8qZ3JpZCovIGN0eFsxXVxuXHR9O1xuXG5cdGlmICgvKmdyaWRDb21wb25lbnRDb250YWluZXIqLyBjdHhbOF0gIT09IHZvaWQgMCkge1xuXHRcdGdyaWRfMV9wcm9wcy5Db250YWluZXIgPSAvKmdyaWRDb21wb25lbnRDb250YWluZXIqLyBjdHhbOF07XG5cdH1cblxuXHRncmlkXzEgPSBuZXcgR3JpZCh7IHByb3BzOiBncmlkXzFfcHJvcHMgfSk7XG5cdC8qZ3JpZF8xX2JpbmRpbmcqLyBjdHhbMjddKGdyaWRfMSk7XG5cdGJpbmRpbmdfY2FsbGJhY2tzLnB1c2goKCkgPT4gYmluZChncmlkXzEsICdDb250YWluZXInLCBncmlkXzFfQ29udGFpbmVyX2JpbmRpbmcpKTtcblx0Z3JpZF8xLiRvbihcImNoYW5nZVwiLCAvKmhhbmRsZVN0YXRlQ2hhbmdlKi8gY3R4WzE2XSk7XG5cdGdyaWRfMS4kb24oXCJtb3ZlXCIsIC8qaGFuZGxlTW92ZSovIGN0eFsxMl0pO1xuXHRncmlkXzEuJG9uKFwibGV0dGVyXCIsIC8qaGFuZGxlTGV0dGVyKi8gY3R4WzEzXSk7XG5cdGdyaWRfMS4kb24oXCJiYWNrc3BhY2VcIiwgLypoYW5kbGVCYWNrc3BhY2UqLyBjdHhbMTVdKTtcblx0Z3JpZF8xLiRvbihcImVudGVyXCIsIC8qaGFuZGxlRW50ZXIqLyBjdHhbMTRdKTtcblxuXHRyZXR1cm4ge1xuXHRcdGMoKSB7XG5cdFx0XHRtYWluID0gZWxlbWVudChcIm1haW5cIik7XG5cdFx0XHRjcmVhdGVfY29tcG9uZW50KGluc3RydWN0aW9ucy4kJC5mcmFnbWVudCk7XG5cdFx0XHR0MCA9IHNwYWNlKCk7XG5cdFx0XHRkaXYyID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdGxhYmVsMCA9IGVsZW1lbnQoXCJsYWJlbFwiKTtcblx0XHRcdGxhYmVsMC50ZXh0Q29udGVudCA9IFwiVGl0bGVcIjtcblx0XHRcdHQyID0gc3BhY2UoKTtcblx0XHRcdGlucHV0MCA9IGVsZW1lbnQoXCJpbnB1dFwiKTtcblx0XHRcdHQzID0gc3BhY2UoKTtcblx0XHRcdGxhYmVsMSA9IGVsZW1lbnQoXCJsYWJlbFwiKTtcblx0XHRcdGxhYmVsMS50ZXh0Q29udGVudCA9IFwiQXV0aG9yXCI7XG5cdFx0XHR0NSA9IHNwYWNlKCk7XG5cdFx0XHRpbnB1dDEgPSBlbGVtZW50KFwiaW5wdXRcIik7XG5cdFx0XHR0NiA9IHNwYWNlKCk7XG5cdFx0XHRsYWJlbDIgPSBlbGVtZW50KFwibGFiZWxcIik7XG5cdFx0XHRsYWJlbDIudGV4dENvbnRlbnQgPSBcIkVkaXRvclwiO1xuXHRcdFx0dDggPSBzcGFjZSgpO1xuXHRcdFx0aW5wdXQyID0gZWxlbWVudChcImlucHV0XCIpO1xuXHRcdFx0dDkgPSBzcGFjZSgpO1xuXHRcdFx0bGFiZWwzID0gZWxlbWVudChcImxhYmVsXCIpO1xuXHRcdFx0bGFiZWwzLnRleHRDb250ZW50ID0gXCJEYXRlXCI7XG5cdFx0XHR0MTEgPSBzcGFjZSgpO1xuXHRcdFx0aW5wdXQzID0gZWxlbWVudChcImlucHV0XCIpO1xuXHRcdFx0dDEyID0gc3BhY2UoKTtcblx0XHRcdGxhYmVsNCA9IGVsZW1lbnQoXCJsYWJlbFwiKTtcblx0XHRcdGxhYmVsNC50ZXh0Q29udGVudCA9IFwiU2l6ZVwiO1xuXHRcdFx0dDE0ID0gc3BhY2UoKTtcblx0XHRcdGlucHV0NCA9IGVsZW1lbnQoXCJpbnB1dFwiKTtcblx0XHRcdHQxNSA9IHNwYWNlKCk7XG5cdFx0XHRkaXYxID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdGRpdjAgPSBlbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0Y3JlYXRlX2NvbXBvbmVudChtZW51LiQkLmZyYWdtZW50KTtcblx0XHRcdHQxNiA9IHNwYWNlKCk7XG5cdFx0XHRjcmVhdGVfY29tcG9uZW50KGdyaWRfMS4kJC5mcmFnbWVudCk7XG5cdFx0XHR0MTcgPSBzcGFjZSgpO1xuXHRcdFx0bGFiZWw1ID0gZWxlbWVudChcImxhYmVsXCIpO1xuXHRcdFx0bGFiZWw1LnRleHRDb250ZW50ID0gXCJVcGxvYWQgYW4gWEQgZmlsZSAob3B0aW9uYWwpXCI7XG5cdFx0XHR0MTkgPSBzcGFjZSgpO1xuXHRcdFx0aW5wdXQ1ID0gZWxlbWVudChcImlucHV0XCIpO1xuXHRcdFx0dDIwID0gc3BhY2UoKTtcblx0XHRcdHRleHRhcmVhID0gZWxlbWVudChcInRleHRhcmVhXCIpO1xuXHRcdFx0YXR0cihsYWJlbDAsIFwiZm9yXCIsIFwidGl0bGVcIik7XG5cdFx0XHRhdHRyKGxhYmVsMCwgXCJjbGFzc1wiLCBcInN2ZWx0ZS12c2wzZ2ZcIik7XG5cdFx0XHRhdHRyKGlucHV0MCwgXCJpZFwiLCBcInRpdGxlXCIpO1xuXHRcdFx0YXR0cihpbnB1dDAsIFwibmFtZVwiLCBcInRpdGxlXCIpO1xuXHRcdFx0YXR0cihpbnB1dDAsIFwidHlwZVwiLCBcInRleHRcIik7XG5cdFx0XHRhdHRyKGlucHV0MCwgXCJjbGFzc1wiLCBcInN2ZWx0ZS12c2wzZ2ZcIik7XG5cdFx0XHRhdHRyKGxhYmVsMSwgXCJmb3JcIiwgXCJhdXRob3JcIik7XG5cdFx0XHRhdHRyKGxhYmVsMSwgXCJjbGFzc1wiLCBcInN2ZWx0ZS12c2wzZ2ZcIik7XG5cdFx0XHRhdHRyKGlucHV0MSwgXCJpZFwiLCBcImF1dGhvclwiKTtcblx0XHRcdGF0dHIoaW5wdXQxLCBcIm5hbWVcIiwgXCJhdXRob3JcIik7XG5cdFx0XHRhdHRyKGlucHV0MSwgXCJ0eXBlXCIsIFwidGV4dFwiKTtcblx0XHRcdGF0dHIoaW5wdXQxLCBcImNsYXNzXCIsIFwic3ZlbHRlLXZzbDNnZlwiKTtcblx0XHRcdGF0dHIobGFiZWwyLCBcImZvclwiLCBcImVkaXRvclwiKTtcblx0XHRcdGF0dHIobGFiZWwyLCBcImNsYXNzXCIsIFwic3ZlbHRlLXZzbDNnZlwiKTtcblx0XHRcdGF0dHIoaW5wdXQyLCBcImlkXCIsIFwiZWRpdG9yXCIpO1xuXHRcdFx0YXR0cihpbnB1dDIsIFwibmFtZVwiLCBcImVkaXRvclwiKTtcblx0XHRcdGF0dHIoaW5wdXQyLCBcInR5cGVcIiwgXCJ0ZXh0XCIpO1xuXHRcdFx0YXR0cihpbnB1dDIsIFwiY2xhc3NcIiwgXCJzdmVsdGUtdnNsM2dmXCIpO1xuXHRcdFx0YXR0cihsYWJlbDMsIFwiZm9yXCIsIFwiZGF0ZVwiKTtcblx0XHRcdGF0dHIobGFiZWwzLCBcImNsYXNzXCIsIFwic3ZlbHRlLXZzbDNnZlwiKTtcblx0XHRcdGF0dHIoaW5wdXQzLCBcImlkXCIsIFwiZGF0ZVwiKTtcblx0XHRcdGF0dHIoaW5wdXQzLCBcIm5hbWVcIiwgXCJkYXRlXCIpO1xuXHRcdFx0YXR0cihpbnB1dDMsIFwidHlwZVwiLCBcImRhdGVcIik7XG5cdFx0XHRhdHRyKGlucHV0MywgXCJjbGFzc1wiLCBcInN2ZWx0ZS12c2wzZ2ZcIik7XG5cdFx0XHRhdHRyKGxhYmVsNCwgXCJmb3JcIiwgXCJzaXplXCIpO1xuXHRcdFx0YXR0cihsYWJlbDQsIFwiY2xhc3NcIiwgXCJzdmVsdGUtdnNsM2dmXCIpO1xuXHRcdFx0YXR0cihpbnB1dDQsIFwidHlwZVwiLCBcIm51bWJlclwiKTtcblx0XHRcdGF0dHIoaW5wdXQ0LCBcIm5hbWVcIiwgXCJzaXplXCIpO1xuXHRcdFx0YXR0cihpbnB1dDQsIFwiaWRcIiwgXCJzaXplXCIpO1xuXHRcdFx0YXR0cihpbnB1dDQsIFwicGxhY2Vob2xkZXJcIiwgXCJzaXplXCIpO1xuXHRcdFx0YXR0cihpbnB1dDQsIFwiZGVmYXVsdFwiLCBcIjVcIik7XG5cdFx0XHRhdHRyKGlucHV0NCwgXCJtaW5cIiwgXCIyXCIpO1xuXHRcdFx0YXR0cihpbnB1dDQsIFwiY2xhc3NcIiwgXCJzdmVsdGUtdnNsM2dmXCIpO1xuXHRcdFx0YXR0cihkaXYwLCBcImNsYXNzXCIsIFwianh3b3JkLWhlYWRlclwiKTtcblx0XHRcdGF0dHIoZGl2MSwgXCJjbGFzc1wiLCBcImp4d29yZC1jb250YWluZXIgc3ZlbHRlLXZzbDNnZlwiKTtcblx0XHRcdGF0dHIobGFiZWw1LCBcImZvclwiLCBcImZpbGVcIik7XG5cdFx0XHRhdHRyKGxhYmVsNSwgXCJjbGFzc1wiLCBcInN2ZWx0ZS12c2wzZ2ZcIik7XG5cdFx0XHRhdHRyKGlucHV0NSwgXCJjbGFzc1wiLCBcImRyb3Bfem9uZSBzdmVsdGUtdnNsM2dmXCIpO1xuXHRcdFx0YXR0cihpbnB1dDUsIFwidHlwZVwiLCBcImZpbGVcIik7XG5cdFx0XHRhdHRyKGlucHV0NSwgXCJpZFwiLCBcImZpbGVcIik7XG5cdFx0XHRhdHRyKGlucHV0NSwgXCJuYW1lXCIsIFwiZmlsZXNcIik7XG5cdFx0XHRhdHRyKGlucHV0NSwgXCJhY2NlcHRcIiwgXCIueGRcIik7XG5cdFx0XHRhdHRyKHRleHRhcmVhLCBcImlkXCIsIFwieGRcIik7XG5cdFx0XHRhdHRyKHRleHRhcmVhLCBcIm5hbWVcIiwgXCJ4ZFwiKTtcblx0XHRcdGF0dHIodGV4dGFyZWEsIFwiY2xhc3NcIiwgXCJqeHdvcmQteGQtdGV4dGFyZWEgc3ZlbHRlLXZzbDNnZlwiKTtcblx0XHRcdHNldF9zdHlsZSh0ZXh0YXJlYSwgXCJkaXNwbGF5XCIsIC8qZGlzcGxheVhkKi8gY3R4WzZdID8gJ2Jsb2NrJyA6ICdub25lJywgZmFsc2UpO1xuXHRcdFx0YXR0cihkaXYyLCBcImNsYXNzXCIsIFwianh3b3JkLWZvcm0tY29udGFpbmVyIHN2ZWx0ZS12c2wzZ2ZcIik7XG5cdFx0XHRhdHRyKG1haW4sIFwiY2xhc3NcIiwgXCJzdmVsdGUtdnNsM2dmXCIpO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0aW5zZXJ0KHRhcmdldCwgbWFpbiwgYW5jaG9yKTtcblx0XHRcdG1vdW50X2NvbXBvbmVudChpbnN0cnVjdGlvbnMsIG1haW4sIG51bGwpO1xuXHRcdFx0YXBwZW5kKG1haW4sIHQwKTtcblx0XHRcdGFwcGVuZChtYWluLCBkaXYyKTtcblx0XHRcdGFwcGVuZChkaXYyLCBsYWJlbDApO1xuXHRcdFx0YXBwZW5kKGRpdjIsIHQyKTtcblx0XHRcdGFwcGVuZChkaXYyLCBpbnB1dDApO1xuXHRcdFx0c2V0X2lucHV0X3ZhbHVlKGlucHV0MCwgLyp0aXRsZSovIGN0eFsyXSk7XG5cdFx0XHRhcHBlbmQoZGl2MiwgdDMpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIGxhYmVsMSk7XG5cdFx0XHRhcHBlbmQoZGl2MiwgdDUpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIGlucHV0MSk7XG5cdFx0XHRzZXRfaW5wdXRfdmFsdWUoaW5wdXQxLCAvKmF1dGhvciovIGN0eFszXSk7XG5cdFx0XHRhcHBlbmQoZGl2MiwgdDYpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIGxhYmVsMik7XG5cdFx0XHRhcHBlbmQoZGl2MiwgdDgpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIGlucHV0Mik7XG5cdFx0XHRzZXRfaW5wdXRfdmFsdWUoaW5wdXQyLCAvKmVkaXRvciovIGN0eFs0XSk7XG5cdFx0XHRhcHBlbmQoZGl2MiwgdDkpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIGxhYmVsMyk7XG5cdFx0XHRhcHBlbmQoZGl2MiwgdDExKTtcblx0XHRcdGFwcGVuZChkaXYyLCBpbnB1dDMpO1xuXHRcdFx0c2V0X2lucHV0X3ZhbHVlKGlucHV0MywgLypkYXRlKi8gY3R4WzVdKTtcblx0XHRcdGFwcGVuZChkaXYyLCB0MTIpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIGxhYmVsNCk7XG5cdFx0XHRhcHBlbmQoZGl2MiwgdDE0KTtcblx0XHRcdGFwcGVuZChkaXYyLCBpbnB1dDQpO1xuXHRcdFx0c2V0X2lucHV0X3ZhbHVlKGlucHV0NCwgLypzaXplKi8gY3R4WzldKTtcblx0XHRcdGFwcGVuZChkaXYyLCB0MTUpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIGRpdjEpO1xuXHRcdFx0YXBwZW5kKGRpdjEsIGRpdjApO1xuXHRcdFx0bW91bnRfY29tcG9uZW50KG1lbnUsIGRpdjAsIG51bGwpO1xuXHRcdFx0YXBwZW5kKGRpdjEsIHQxNik7XG5cdFx0XHRtb3VudF9jb21wb25lbnQoZ3JpZF8xLCBkaXYxLCBudWxsKTtcblx0XHRcdGFwcGVuZChkaXYyLCB0MTcpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIGxhYmVsNSk7XG5cdFx0XHRhcHBlbmQoZGl2MiwgdDE5KTtcblx0XHRcdGFwcGVuZChkaXYyLCBpbnB1dDUpO1xuXHRcdFx0LyppbnB1dDVfYmluZGluZyovIGN0eFsyOV0oaW5wdXQ1KTtcblx0XHRcdGFwcGVuZChkaXYyLCB0MjApO1xuXHRcdFx0YXBwZW5kKGRpdjIsIHRleHRhcmVhKTtcblx0XHRcdHNldF9pbnB1dF92YWx1ZSh0ZXh0YXJlYSwgLyp4ZCovIGN0eFswXSk7XG5cdFx0XHRjdXJyZW50ID0gdHJ1ZTtcblxuXHRcdFx0aWYgKCFtb3VudGVkKSB7XG5cdFx0XHRcdGRpc3Bvc2UgPSBbXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0MCwgXCJpbnB1dFwiLCAvKmlucHV0MF9pbnB1dF9oYW5kbGVyKi8gY3R4WzIyXSksXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0MCwgXCJjaGFuZ2VcIiwgLypoYW5kbGVTdGF0ZUNoYW5nZSovIGN0eFsxNl0pLFxuXHRcdFx0XHRcdGxpc3RlbihpbnB1dDEsIFwiaW5wdXRcIiwgLyppbnB1dDFfaW5wdXRfaGFuZGxlciovIGN0eFsyM10pLFxuXHRcdFx0XHRcdGxpc3RlbihpbnB1dDEsIFwiY2hhbmdlXCIsIC8qaGFuZGxlU3RhdGVDaGFuZ2UqLyBjdHhbMTZdKSxcblx0XHRcdFx0XHRsaXN0ZW4oaW5wdXQyLCBcImlucHV0XCIsIC8qaW5wdXQyX2lucHV0X2hhbmRsZXIqLyBjdHhbMjRdKSxcblx0XHRcdFx0XHRsaXN0ZW4oaW5wdXQyLCBcImNoYW5nZVwiLCAvKmhhbmRsZVN0YXRlQ2hhbmdlKi8gY3R4WzE2XSksXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0MywgXCJpbnB1dFwiLCAvKmlucHV0M19pbnB1dF9oYW5kbGVyKi8gY3R4WzI1XSksXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0MywgXCJjaGFuZ2VcIiwgLypoYW5kbGVTdGF0ZUNoYW5nZSovIGN0eFsxNl0pLFxuXHRcdFx0XHRcdGxpc3RlbihpbnB1dDQsIFwiaW5wdXRcIiwgLyppbnB1dDRfaW5wdXRfaGFuZGxlciovIGN0eFsyNl0pLFxuXHRcdFx0XHRcdGxpc3RlbihpbnB1dDUsIFwiY2hhbmdlXCIsIC8qaGFuZGxlRmlsZVNlbGVjdCovIGN0eFsxOF0pLFxuXHRcdFx0XHRcdGxpc3Rlbih0ZXh0YXJlYSwgXCJpbnB1dFwiLCAvKnRleHRhcmVhX2lucHV0X2hhbmRsZXIqLyBjdHhbMzBdKVxuXHRcdFx0XHRdO1xuXG5cdFx0XHRcdG1vdW50ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cChjdHgsIGRpcnR5KSB7XG5cdFx0XHRjb25zdCBpbnN0cnVjdGlvbnNfY2hhbmdlcyA9IHt9O1xuXG5cdFx0XHRpZiAoIXVwZGF0aW5nX3Zpc2libGUgJiYgZGlydHlbMF0gJiAvKmluc3RydWN0aW9uc1Zpc2libGUqLyAyMDQ4KSB7XG5cdFx0XHRcdHVwZGF0aW5nX3Zpc2libGUgPSB0cnVlO1xuXHRcdFx0XHRpbnN0cnVjdGlvbnNfY2hhbmdlcy52aXNpYmxlID0gLyppbnN0cnVjdGlvbnNWaXNpYmxlKi8gY3R4WzExXTtcblx0XHRcdFx0YWRkX2ZsdXNoX2NhbGxiYWNrKCgpID0+IHVwZGF0aW5nX3Zpc2libGUgPSBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdGluc3RydWN0aW9ucy4kc2V0KGluc3RydWN0aW9uc19jaGFuZ2VzKTtcblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLyp0aXRsZSovIDQgJiYgaW5wdXQwLnZhbHVlICE9PSAvKnRpdGxlKi8gY3R4WzJdKSB7XG5cdFx0XHRcdHNldF9pbnB1dF92YWx1ZShpbnB1dDAsIC8qdGl0bGUqLyBjdHhbMl0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmF1dGhvciovIDggJiYgaW5wdXQxLnZhbHVlICE9PSAvKmF1dGhvciovIGN0eFszXSkge1xuXHRcdFx0XHRzZXRfaW5wdXRfdmFsdWUoaW5wdXQxLCAvKmF1dGhvciovIGN0eFszXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qZWRpdG9yKi8gMTYgJiYgaW5wdXQyLnZhbHVlICE9PSAvKmVkaXRvciovIGN0eFs0XSkge1xuXHRcdFx0XHRzZXRfaW5wdXRfdmFsdWUoaW5wdXQyLCAvKmVkaXRvciovIGN0eFs0XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qZGF0ZSovIDMyKSB7XG5cdFx0XHRcdHNldF9pbnB1dF92YWx1ZShpbnB1dDMsIC8qZGF0ZSovIGN0eFs1XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qc2l6ZSovIDUxMiAmJiB0b19udW1iZXIoaW5wdXQ0LnZhbHVlKSAhPT0gLypzaXplKi8gY3R4WzldKSB7XG5cdFx0XHRcdHNldF9pbnB1dF92YWx1ZShpbnB1dDQsIC8qc2l6ZSovIGN0eFs5XSk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGdyaWRfMV9jaGFuZ2VzID0ge307XG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKnNpemUqLyA1MTIpIGdyaWRfMV9jaGFuZ2VzLnNpemUgPSAvKnNpemUqLyBjdHhbOV07XG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmdyaWQqLyAyKSBncmlkXzFfY2hhbmdlcy5ncmlkID0gLypncmlkKi8gY3R4WzFdO1xuXG5cdFx0XHRpZiAoIXVwZGF0aW5nX0NvbnRhaW5lciAmJiBkaXJ0eVswXSAmIC8qZ3JpZENvbXBvbmVudENvbnRhaW5lciovIDI1Nikge1xuXHRcdFx0XHR1cGRhdGluZ19Db250YWluZXIgPSB0cnVlO1xuXHRcdFx0XHRncmlkXzFfY2hhbmdlcy5Db250YWluZXIgPSAvKmdyaWRDb21wb25lbnRDb250YWluZXIqLyBjdHhbOF07XG5cdFx0XHRcdGFkZF9mbHVzaF9jYWxsYmFjaygoKSA9PiB1cGRhdGluZ19Db250YWluZXIgPSBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdGdyaWRfMS4kc2V0KGdyaWRfMV9jaGFuZ2VzKTtcblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLyp4ZCovIDEpIHtcblx0XHRcdFx0c2V0X2lucHV0X3ZhbHVlKHRleHRhcmVhLCAvKnhkKi8gY3R4WzBdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypkaXNwbGF5WGQqLyA2NCkge1xuXHRcdFx0XHRzZXRfc3R5bGUodGV4dGFyZWEsIFwiZGlzcGxheVwiLCAvKmRpc3BsYXlYZCovIGN0eFs2XSA/ICdibG9jaycgOiAnbm9uZScsIGZhbHNlKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGkobG9jYWwpIHtcblx0XHRcdGlmIChjdXJyZW50KSByZXR1cm47XG5cdFx0XHR0cmFuc2l0aW9uX2luKGluc3RydWN0aW9ucy4kJC5mcmFnbWVudCwgbG9jYWwpO1xuXHRcdFx0dHJhbnNpdGlvbl9pbihtZW51LiQkLmZyYWdtZW50LCBsb2NhbCk7XG5cdFx0XHR0cmFuc2l0aW9uX2luKGdyaWRfMS4kJC5mcmFnbWVudCwgbG9jYWwpO1xuXHRcdFx0Y3VycmVudCA9IHRydWU7XG5cdFx0fSxcblx0XHRvKGxvY2FsKSB7XG5cdFx0XHR0cmFuc2l0aW9uX291dChpbnN0cnVjdGlvbnMuJCQuZnJhZ21lbnQsIGxvY2FsKTtcblx0XHRcdHRyYW5zaXRpb25fb3V0KG1lbnUuJCQuZnJhZ21lbnQsIGxvY2FsKTtcblx0XHRcdHRyYW5zaXRpb25fb3V0KGdyaWRfMS4kJC5mcmFnbWVudCwgbG9jYWwpO1xuXHRcdFx0Y3VycmVudCA9IGZhbHNlO1xuXHRcdH0sXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaChtYWluKTtcblx0XHRcdGRlc3Ryb3lfY29tcG9uZW50KGluc3RydWN0aW9ucyk7XG5cdFx0XHRkZXN0cm95X2NvbXBvbmVudChtZW51KTtcblx0XHRcdC8qZ3JpZF8xX2JpbmRpbmcqLyBjdHhbMjddKG51bGwpO1xuXHRcdFx0ZGVzdHJveV9jb21wb25lbnQoZ3JpZF8xKTtcblx0XHRcdC8qaW5wdXQ1X2JpbmRpbmcqLyBjdHhbMjldKG51bGwpO1xuXHRcdFx0bW91bnRlZCA9IGZhbHNlO1xuXHRcdFx0cnVuX2FsbChkaXNwb3NlKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGluc3RhbmNlKCQkc2VsZiwgJCRwcm9wcywgJCRpbnZhbGlkYXRlKSB7XG5cdGxldCAkcXVlc3Rpb25zRG93bjtcblx0bGV0ICRxdWVzdGlvbnNBY3Jvc3M7XG5cdGxldCAkY3VycmVudERpcmVjdGlvbjtcblx0Y29tcG9uZW50X3N1YnNjcmliZSgkJHNlbGYsIHF1ZXN0aW9uc0Rvd24sICQkdmFsdWUgPT4gJCRpbnZhbGlkYXRlKDMyLCAkcXVlc3Rpb25zRG93biA9ICQkdmFsdWUpKTtcblx0Y29tcG9uZW50X3N1YnNjcmliZSgkJHNlbGYsIHF1ZXN0aW9uc0Fjcm9zcywgJCR2YWx1ZSA9PiAkJGludmFsaWRhdGUoMzMsICRxdWVzdGlvbnNBY3Jvc3MgPSAkJHZhbHVlKSk7XG5cdGNvbXBvbmVudF9zdWJzY3JpYmUoJCRzZWxmLCBjdXJyZW50RGlyZWN0aW9uLCAkJHZhbHVlID0+ICQkaW52YWxpZGF0ZSgzNCwgJGN1cnJlbnREaXJlY3Rpb24gPSAkJHZhbHVlKSk7XG5cdGNvbnN0IHNhdmVfc3RhdGUgPSB0cnVlO1xuXHRsZXQgeyB4ZCB9ID0gJCRwcm9wcztcblx0bGV0IHsgZ3JpZCA9IFsuLi5BcnJheSgxMCldLm1hcChlID0+IEFycmF5KDEwKSkgfSA9ICQkcHJvcHM7XG5cdGxldCB7IHRpdGxlIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBhdXRob3IgfSA9ICQkcHJvcHM7XG5cdGxldCB7IGVkaXRvciB9ID0gJCRwcm9wcztcblx0bGV0IHsgZGF0ZSB9ID0gJCRwcm9wcztcblx0bGV0IHsgZGlzcGxheVhkID0gdHJ1ZSB9ID0gJCRwcm9wcztcblxuXHQvLyBTdGF0ZVxuXHRsZXQgZ3JpZENvbXBvbmVudDtcblxuXHRsZXQgZ3JpZENvbXBvbmVudENvbnRhaW5lcjtcblx0bGV0IHNpemUgPSBncmlkLmxlbmd0aDtcblxuXHRsZXQgc3RhdGUgPSB7XG5cdFx0Z3JpZCxcblx0XHRzaXplLFxuXHRcdGN1cnJlbnRfeDogMCxcblx0XHRjdXJyZW50X3k6IDAsXG5cdFx0ZGlyZWN0aW9uOiBcImFjcm9zc1wiLFxuXHRcdHF1ZXN0aW9uc19hY3Jvc3M6ICRxdWVzdGlvbnNBY3Jvc3MsXG5cdFx0cXVlc3Rpb25zX2Rvd246ICRxdWVzdGlvbnNEb3duXG5cdH07XG5cblx0bGV0IGdldFN0YXRlID0gKCkgPT4ge1xuXHRcdGxldCB7IHg6IGN1cnJlbnRfeCwgeTogY3VycmVudF95IH0gPSBncmlkQ29tcG9uZW50LmdldEN1cnJlbnRQb3MoKTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRncmlkLFxuXHRcdFx0c2l6ZSxcblx0XHRcdGN1cnJlbnRfeCxcblx0XHRcdGN1cnJlbnRfeSxcblx0XHRcdGRpcmVjdGlvbjogJGN1cnJlbnREaXJlY3Rpb24sXG5cdFx0XHRxdWVzdGlvbnNfYWNyb3NzOiAkcXVlc3Rpb25zQWNyb3NzLFxuXHRcdFx0cXVlc3Rpb25zX2Rvd246ICRxdWVzdGlvbnNEb3duLFxuXHRcdFx0dGl0bGUsXG5cdFx0XHRhdXRob3IsXG5cdFx0XHRlZGl0b3IsXG5cdFx0XHRkYXRlXG5cdFx0fTtcblx0fTtcblxuXHRmdW5jdGlvbiBoYW5kbGVNb3ZlKGV2ZW50KSB7XG5cdFx0Y29uc3QgZGlyZWN0aW9uID0gZXZlbnQuZGV0YWlsO1xuXHRcdGxldCBuZXdEaXI7XG5cblx0XHRpZiAoZGlyZWN0aW9uID09PSBcImRvd25cIiB8fCBkaXJlY3Rpb24gPT09IFwidXBcIikge1xuXHRcdFx0bmV3RGlyID0gXCJkb3duXCI7XG5cdFx0fVxuXG5cdFx0aWYgKGRpcmVjdGlvbiA9PT0gXCJsZWZ0XCIgfHwgZGlyZWN0aW9uID09PSBcInJpZ2h0XCIpIHtcblx0XHRcdG5ld0RpciA9IFwiYWNyb3NzXCI7XG5cdFx0fVxuXG5cdFx0aWYgKG5ld0RpciAhPT0gJGN1cnJlbnREaXJlY3Rpb24pIHtcblx0XHRcdGdyaWRDb21wb25lbnQuc2V0RGlyKG5ld0Rpcik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGdyaWRDb21wb25lbnQuaGFuZGxlTW92ZShkaXJlY3Rpb24pO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZUxldHRlcihldmVudCkge1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0Y29uc3QgbGV0dGVyID0gZXZlbnQuZGV0YWlsO1xuXG5cdFx0aWYgKGxldHRlciA9PT0gXCIgXCIpIHtcblx0XHRcdGdyaWRDb21wb25lbnQudG9nZ2xlRGlyKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0bGV0IHsgeCwgeSB9ID0gZ3JpZENvbXBvbmVudC5nZXRDdXJyZW50UG9zKCk7XG5cdFx0JCRpbnZhbGlkYXRlKDEsIGdyaWRbeV1beF0gPSBsZXR0ZXIsIGdyaWQpO1xuXG5cdFx0aWYgKCRjdXJyZW50RGlyZWN0aW9uID09PSBcImFjcm9zc1wiKSB7XG5cdFx0XHRncmlkQ29tcG9uZW50Lm1vdmVSaWdodCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRncmlkQ29tcG9uZW50Lm1vdmVEb3duKCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlRW50ZXIoZXZlbnQpIHtcblx0XHRsZXQgeyB4LCB5IH0gPSBncmlkQ29tcG9uZW50LmdldEN1cnJlbnRQb3MoKTtcblx0XHRsZXQgc2VsZWN0ZWRfcXVlc3Rpb247XG5cblx0XHRsZXQgcXVlc3Rpb25zID0gJGN1cnJlbnREaXJlY3Rpb24gPT09IFwiYWNyb3NzXCJcblx0XHQ/ICRxdWVzdGlvbnNBY3Jvc3Ncblx0XHQ6ICRxdWVzdGlvbnNEb3duO1xuXG5cdFx0aWYgKCRjdXJyZW50RGlyZWN0aW9uID09PSBcImFjcm9zc1wiKSB7XG5cdFx0XHRzZWxlY3RlZF9xdWVzdGlvbiA9IHF1ZXN0aW9ucy5maW5kKHEgPT4geSA9PT0gcS55ICYmIHggPj0gcS54ICYmIHggPD0gcS54ICsgcS5hbnN3ZXIubGVuZ3RoIC0gMSk7XG5cblx0XHRcdGlmIChzZWxlY3RlZF9xdWVzdGlvbikge1xuXHRcdFx0XHRzZWxlY3RlZF9xdWVzdGlvbi5lZGl0aW5nID0gdHJ1ZTtcblx0XHRcdFx0c2V0X3N0b3JlX3ZhbHVlKHF1ZXN0aW9uc0Fjcm9zcywgJHF1ZXN0aW9uc0Fjcm9zcyA9IHF1ZXN0aW9ucywgJHF1ZXN0aW9uc0Fjcm9zcyk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHNlbGVjdGVkX3F1ZXN0aW9uID0gcXVlc3Rpb25zLmZpbmQocSA9PiB4ID09PSBxLnggJiYgeSA+PSBxLnkgJiYgeSA8PSBxLnkgKyBxLmFuc3dlci5sZW5ndGggLSAxKTtcblxuXHRcdFx0aWYgKHNlbGVjdGVkX3F1ZXN0aW9uKSB7XG5cdFx0XHRcdHNlbGVjdGVkX3F1ZXN0aW9uLmVkaXRpbmcgPSB0cnVlO1xuXHRcdFx0XHRzZXRfc3RvcmVfdmFsdWUocXVlc3Rpb25zRG93biwgJHF1ZXN0aW9uc0Rvd24gPSBxdWVzdGlvbnMsICRxdWVzdGlvbnNEb3duKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVCYWNrc3BhY2UoZXZlbnQpIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGxldCB7IHgsIHkgfSA9IGdyaWRDb21wb25lbnQuZ2V0Q3VycmVudFBvcygpO1xuXHRcdCQkaW52YWxpZGF0ZSgxLCBncmlkW3ldW3hdID0gXCJcIiwgZ3JpZCk7XG5cblx0XHRpZiAoJGN1cnJlbnREaXJlY3Rpb24gPT09IFwiYWNyb3NzXCIpIHtcblx0XHRcdGdyaWRDb21wb25lbnQubW92ZUxlZnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Z3JpZENvbXBvbmVudC5tb3ZlVXAoKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVTdGF0ZUNoYW5nZSgpIHtcblx0XHRzYXZlU3RhdGUoZ2V0U3RhdGUoKSk7XG5cdFx0JCRpbnZhbGlkYXRlKDAsIHhkID0gWERFbmNvZGUoZ2V0U3RhdGUoKSkpO1xuXHR9XG5cblx0b25Nb3VudCgoKSA9PiB7XG5cdFx0aWYgKHhkKSB7XG5cdFx0XHRsb2FkWGQoeGQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR7XG5cdFx0XHRcdHN0YXRlID0gcmVzdG9yZVN0YXRlKCkgfHwgc3RhdGU7XG5cdFx0XHR9XG5cblx0XHRcdCQkaW52YWxpZGF0ZSgxLCBncmlkID0gc3RhdGUuZ3JpZCk7XG5cdFx0XHQkJGludmFsaWRhdGUoOSwgc2l6ZSA9IHN0YXRlLnNpemUpO1xuXHRcdFx0JCRpbnZhbGlkYXRlKDMsIGF1dGhvciA9IHN0YXRlLmF1dGhvcik7XG5cdFx0XHQkJGludmFsaWRhdGUoNCwgZWRpdG9yID0gc3RhdGUuZWRpdG9yKTtcblx0XHRcdCQkaW52YWxpZGF0ZSg1LCBkYXRlID0gc3RhdGUuZGF0ZSk7XG5cdFx0XHQkJGludmFsaWRhdGUoMiwgdGl0bGUgPSBzdGF0ZS50aXRsZSk7XG5cdFx0XHRxdWVzdGlvbnNBY3Jvc3Muc2V0KHN0YXRlLnF1ZXN0aW9uc19hY3Jvc3MpO1xuXHRcdFx0cXVlc3Rpb25zRG93bi5zZXQoc3RhdGUucXVlc3Rpb25zX2Rvd24pO1xuXHRcdFx0Z3JpZENvbXBvbmVudC5zZXREaXIoc3RhdGUuZGlyZWN0aW9uKTtcblx0XHRcdGdyaWRDb21wb25lbnQuc2V0Q3VycmVudFBvcyhzdGF0ZS5jdXJyZW50X3gsIHN0YXRlLmN1cnJlbnRfeSk7XG5cdFx0fVxuXHR9KTtcblxuXHRmdW5jdGlvbiBoYW5kbGVSZXNldCgpIHtcblx0XHRjbGVhclN0YXRlKCk7XG5cdFx0JCRpbnZhbGlkYXRlKDksIHNpemUgPSAxMCk7XG5cdFx0Z3JpZENvbXBvbmVudC5zZXREaXIoXCJhY3Jvc3NcIik7XG5cdFx0Z3JpZENvbXBvbmVudC5zZXRDdXJyZW50UG9zKDAsIDApO1xuXHRcdCQkaW52YWxpZGF0ZSgyLCB0aXRsZSA9IFwiXCIpO1xuXHRcdCQkaW52YWxpZGF0ZSgzLCBhdXRob3IgPSBcIlwiKTtcblx0XHQkJGludmFsaWRhdGUoNCwgZWRpdG9yID0gXCJcIik7XG5cdFx0JCRpbnZhbGlkYXRlKDUsIGRhdGUgPSBcIlwiKTtcblx0XHQkJGludmFsaWRhdGUoMSwgZ3JpZCA9IFsuLi5BcnJheSgxMCldLm1hcChlID0+IEFycmF5KDEwKSkpO1xuXHRcdHF1ZXN0aW9uc0Fjcm9zcy5zZXQoW10pO1xuXHRcdGNsZWFyU3RhdGUoKTtcblx0XHRxdWVzdGlvbnNEb3duLnNldChbXSk7XG5cdFx0Y2xlYXJTdGF0ZSgpO1xuXHRcdCQkaW52YWxpZGF0ZSgwLCB4ZCA9IFwiXCIpO1xuXHRcdGNsZWFyU3RhdGUoKTtcblx0fVxuXG5cdGFzeW5jIGZ1bmN0aW9uIGxvYWRYZCh4ZCkge1xuXHRcdGNvbnN0IGRhdGEgPSB4ZENyb3Nzd29yZFBhcnNlcih4ZCk7XG5cdFx0Y29uc29sZS5sb2coZGF0YSk7XG5cdFx0JCRpbnZhbGlkYXRlKDEsIGdyaWQgPSBkYXRhLmdyaWQpO1xuXHRcdCQkaW52YWxpZGF0ZSg5LCBzaXplID0gZGF0YS5ncmlkLmxlbmd0aCk7XG5cdFx0JCRpbnZhbGlkYXRlKDMsIGF1dGhvciA9IGRhdGEubWV0YS5BdXRob3IpO1xuXHRcdCQkaW52YWxpZGF0ZSg0LCBlZGl0b3IgPSBkYXRhLm1ldGEuRWRpdG9yKTtcblx0XHQkJGludmFsaWRhdGUoNSwgZGF0ZSA9IGRhdGEubWV0YS5EYXRlKTtcblx0XHQkJGludmFsaWRhdGUoMiwgdGl0bGUgPSBkYXRhLm1ldGEuVGl0bGUpO1xuXHRcdGdyaWRDb21wb25lbnQuc2V0RGlyKFwiYWNyb3NzXCIpO1xuXHRcdGdyaWRDb21wb25lbnQuc2V0Q3VycmVudFBvcygwLCAwKTtcblx0XHRhd2FpdCB0aWNrKCk7XG5cdFx0bGV0IHF1ZXN0aW9uc19hY3Jvc3MgPSAkcXVlc3Rpb25zQWNyb3NzO1xuXG5cdFx0Zm9yIChsZXQgcXVlc3Rpb24gb2YgcXVlc3Rpb25zX2Fjcm9zcykge1xuXHRcdFx0bGV0IG1hdGNoaW5nX3F1ZXN0aW9uID0gZGF0YS5hY3Jvc3MuZmluZChxID0+IHEubnVtID09PSBgQSR7cXVlc3Rpb24ubnVtfWApO1xuXG5cdFx0XHQvLyBjb25zb2xlLmxvZyhtYXRjaGluZ19xdWVzdGlvbik7XG5cdFx0XHRpZiAobWF0Y2hpbmdfcXVlc3Rpb24pIHtcblx0XHRcdFx0cXVlc3Rpb24ucXVlc3Rpb24gPSBtYXRjaGluZ19xdWVzdGlvbi5xdWVzdGlvbjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRxdWVzdGlvbnNBY3Jvc3Muc2V0KHF1ZXN0aW9uc19hY3Jvc3MpO1xuXHRcdGxldCBxdWVzdGlvbnNfZG93biA9ICRxdWVzdGlvbnNEb3duO1xuXG5cdFx0Zm9yIChsZXQgcXVlc3Rpb24gb2YgcXVlc3Rpb25zX2Rvd24pIHtcblx0XHRcdGxldCBtYXRjaGluZ19xdWVzdGlvbiA9IGRhdGEuZG93bi5maW5kKHEgPT4gcS5udW0gPT09IGBEJHtxdWVzdGlvbi5udW19YCk7XG5cblx0XHRcdC8vIGNvbnNvbGUubG9nKG1hdGNoaW5nX3F1ZXN0aW9uKTtcblx0XHRcdGlmIChtYXRjaGluZ19xdWVzdGlvbikge1xuXHRcdFx0XHRxdWVzdGlvbi5xdWVzdGlvbiA9IG1hdGNoaW5nX3F1ZXN0aW9uLnF1ZXN0aW9uO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHF1ZXN0aW9uc0Rvd24uc2V0KHF1ZXN0aW9uc19kb3duKTtcblx0XHRoYW5kbGVTdGF0ZUNoYW5nZSgpO1xuXHR9XG5cblx0bGV0IGZpbGVJbnB1dDtcblxuXHRmdW5jdGlvbiBoYW5kbGVGaWxlU2VsZWN0KCkge1xuXHRcdGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cblx0XHRyZWFkZXIub25sb2FkID0gKGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBhc3luYyBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGF3YWl0IGxvYWRYZChlLnRhcmdldC5yZXN1bHQpO1xuXHRcdFx0XHR9IGNhdGNoKGVycikge1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyKTtcblx0XHRcdFx0XHR0aHJvdyBcIlVuYWJsZSB0byBwYXJzZSBmaWxlXCI7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fSkoZmlsZUlucHV0LmZpbGVzWzBdKTtcblxuXHRcdC8vIFJlYWQgaW4gdGhlIGltYWdlIGZpbGUgYXMgYSBkYXRhIFVSTC5cblx0XHRyZWFkZXIucmVhZEFzVGV4dChmaWxlSW5wdXQuZmlsZXNbMF0pO1xuXHR9XG5cblx0bGV0IGluc3RydWN0aW9uc1Zpc2libGU7XG5cblx0ZnVuY3Rpb24gaGFuZGxlSW5zdHJ1Y3Rpb25zKCkge1xuXHRcdCQkaW52YWxpZGF0ZSgxMSwgaW5zdHJ1Y3Rpb25zVmlzaWJsZSA9IHRydWUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5zdHJ1Y3Rpb25zX3Zpc2libGVfYmluZGluZyh2YWx1ZSkge1xuXHRcdGluc3RydWN0aW9uc1Zpc2libGUgPSB2YWx1ZTtcblx0XHQkJGludmFsaWRhdGUoMTEsIGluc3RydWN0aW9uc1Zpc2libGUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5wdXQwX2lucHV0X2hhbmRsZXIoKSB7XG5cdFx0dGl0bGUgPSB0aGlzLnZhbHVlO1xuXHRcdCQkaW52YWxpZGF0ZSgyLCB0aXRsZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBpbnB1dDFfaW5wdXRfaGFuZGxlcigpIHtcblx0XHRhdXRob3IgPSB0aGlzLnZhbHVlO1xuXHRcdCQkaW52YWxpZGF0ZSgzLCBhdXRob3IpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5wdXQyX2lucHV0X2hhbmRsZXIoKSB7XG5cdFx0ZWRpdG9yID0gdGhpcy52YWx1ZTtcblx0XHQkJGludmFsaWRhdGUoNCwgZWRpdG9yKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlucHV0M19pbnB1dF9oYW5kbGVyKCkge1xuXHRcdGRhdGUgPSB0aGlzLnZhbHVlO1xuXHRcdCQkaW52YWxpZGF0ZSg1LCBkYXRlKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlucHV0NF9pbnB1dF9oYW5kbGVyKCkge1xuXHRcdHNpemUgPSB0b19udW1iZXIodGhpcy52YWx1ZSk7XG5cdFx0JCRpbnZhbGlkYXRlKDksIHNpemUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ3JpZF8xX2JpbmRpbmcoJCR2YWx1ZSkge1xuXHRcdGJpbmRpbmdfY2FsbGJhY2tzWyQkdmFsdWUgPyAndW5zaGlmdCcgOiAncHVzaCddKCgpID0+IHtcblx0XHRcdGdyaWRDb21wb25lbnQgPSAkJHZhbHVlO1xuXHRcdFx0JCRpbnZhbGlkYXRlKDcsIGdyaWRDb21wb25lbnQpO1xuXHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ3JpZF8xX0NvbnRhaW5lcl9iaW5kaW5nKHZhbHVlKSB7XG5cdFx0Z3JpZENvbXBvbmVudENvbnRhaW5lciA9IHZhbHVlO1xuXHRcdCQkaW52YWxpZGF0ZSg4LCBncmlkQ29tcG9uZW50Q29udGFpbmVyKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlucHV0NV9iaW5kaW5nKCQkdmFsdWUpIHtcblx0XHRiaW5kaW5nX2NhbGxiYWNrc1skJHZhbHVlID8gJ3Vuc2hpZnQnIDogJ3B1c2gnXSgoKSA9PiB7XG5cdFx0XHRmaWxlSW5wdXQgPSAkJHZhbHVlO1xuXHRcdFx0JCRpbnZhbGlkYXRlKDEwLCBmaWxlSW5wdXQpO1xuXHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gdGV4dGFyZWFfaW5wdXRfaGFuZGxlcigpIHtcblx0XHR4ZCA9IHRoaXMudmFsdWU7XG5cdFx0JCRpbnZhbGlkYXRlKDAsIHhkKTtcblx0fVxuXG5cdCQkc2VsZi4kJHNldCA9ICQkcHJvcHMgPT4ge1xuXHRcdGlmICgneGQnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSgwLCB4ZCA9ICQkcHJvcHMueGQpO1xuXHRcdGlmICgnZ3JpZCcgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDEsIGdyaWQgPSAkJHByb3BzLmdyaWQpO1xuXHRcdGlmICgndGl0bGUnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSgyLCB0aXRsZSA9ICQkcHJvcHMudGl0bGUpO1xuXHRcdGlmICgnYXV0aG9yJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoMywgYXV0aG9yID0gJCRwcm9wcy5hdXRob3IpO1xuXHRcdGlmICgnZWRpdG9yJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoNCwgZWRpdG9yID0gJCRwcm9wcy5lZGl0b3IpO1xuXHRcdGlmICgnZGF0ZScgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDUsIGRhdGUgPSAkJHByb3BzLmRhdGUpO1xuXHRcdGlmICgnZGlzcGxheVhkJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoNiwgZGlzcGxheVhkID0gJCRwcm9wcy5kaXNwbGF5WGQpO1xuXHR9O1xuXG5cdHJldHVybiBbXG5cdFx0eGQsXG5cdFx0Z3JpZCxcblx0XHR0aXRsZSxcblx0XHRhdXRob3IsXG5cdFx0ZWRpdG9yLFxuXHRcdGRhdGUsXG5cdFx0ZGlzcGxheVhkLFxuXHRcdGdyaWRDb21wb25lbnQsXG5cdFx0Z3JpZENvbXBvbmVudENvbnRhaW5lcixcblx0XHRzaXplLFxuXHRcdGZpbGVJbnB1dCxcblx0XHRpbnN0cnVjdGlvbnNWaXNpYmxlLFxuXHRcdGhhbmRsZU1vdmUsXG5cdFx0aGFuZGxlTGV0dGVyLFxuXHRcdGhhbmRsZUVudGVyLFxuXHRcdGhhbmRsZUJhY2tzcGFjZSxcblx0XHRoYW5kbGVTdGF0ZUNoYW5nZSxcblx0XHRoYW5kbGVSZXNldCxcblx0XHRoYW5kbGVGaWxlU2VsZWN0LFxuXHRcdGhhbmRsZUluc3RydWN0aW9ucyxcblx0XHRzYXZlX3N0YXRlLFxuXHRcdGluc3RydWN0aW9uc192aXNpYmxlX2JpbmRpbmcsXG5cdFx0aW5wdXQwX2lucHV0X2hhbmRsZXIsXG5cdFx0aW5wdXQxX2lucHV0X2hhbmRsZXIsXG5cdFx0aW5wdXQyX2lucHV0X2hhbmRsZXIsXG5cdFx0aW5wdXQzX2lucHV0X2hhbmRsZXIsXG5cdFx0aW5wdXQ0X2lucHV0X2hhbmRsZXIsXG5cdFx0Z3JpZF8xX2JpbmRpbmcsXG5cdFx0Z3JpZF8xX0NvbnRhaW5lcl9iaW5kaW5nLFxuXHRcdGlucHV0NV9iaW5kaW5nLFxuXHRcdHRleHRhcmVhX2lucHV0X2hhbmRsZXJcblx0XTtcbn1cblxuY2xhc3MgSlhXb3JkQ3JlYXRvciBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudCB7XG5cdGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcblx0XHRzdXBlcigpO1xuXG5cdFx0aW5pdChcblx0XHRcdHRoaXMsXG5cdFx0XHRvcHRpb25zLFxuXHRcdFx0aW5zdGFuY2UsXG5cdFx0XHRjcmVhdGVfZnJhZ21lbnQsXG5cdFx0XHRzYWZlX25vdF9lcXVhbCxcblx0XHRcdHtcblx0XHRcdFx0c2F2ZV9zdGF0ZTogMjAsXG5cdFx0XHRcdHhkOiAwLFxuXHRcdFx0XHRncmlkOiAxLFxuXHRcdFx0XHR0aXRsZTogMixcblx0XHRcdFx0YXV0aG9yOiAzLFxuXHRcdFx0XHRlZGl0b3I6IDQsXG5cdFx0XHRcdGRhdGU6IDUsXG5cdFx0XHRcdGRpc3BsYXlYZDogNlxuXHRcdFx0fSxcblx0XHRcdG51bGwsXG5cdFx0XHRbLTEsIC0xXVxuXHRcdCk7XG5cdH1cblxuXHRnZXQgc2F2ZV9zdGF0ZSgpIHtcblx0XHRyZXR1cm4gdGhpcy4kJC5jdHhbMjBdO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGRpc3QgKHRhcmdldCwgcHJvcHMpIHtcbiAgICByZXR1cm4gbmV3IEpYV29yZENyZWF0b3Ioe1xuICAgICAgICB0YXJnZXQsXG4gICAgICAgIHByb3BzXG4gICAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZGlzdDtcbiIsIi8vIGV4dHJhY3RlZCBieSBtaW5pLWNzcy1leHRyYWN0LXBsdWdpblxuZXhwb3J0IHt9OyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJjb25zdCBDcmVhdG9yID0gcmVxdWlyZShcImp4d29yZC1jcmVhdG9yL2Rpc3Qvanh3b3JkY3JlYXRvci5qc1wiKTtcbnJlcXVpcmUoXCJqeHdvcmQtY3JlYXRvci9kaXN0L2Rpc3QuY3NzXCIpO1xuY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNyb3Nzd29yZGVuZ2luZS1jcmVhdG9yLWNvbnRhaW5lclwiKTtcbmNvbnN0IHByb3BzID0ge1xuICAgIHNhdmVfc3RhdGU6IGZhbHNlLFxufTtcbmlmICh0eXBlb2YgeGQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcHJvcHMueGQgPSB4ZDtcbn1cbkNyZWF0b3IoZWwsIHByb3BzKTsiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=