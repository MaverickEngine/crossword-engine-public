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
function select_option(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        if (option.__value === value) {
            option.selected = true;
            return;
        }
    }
    select.selectedIndex = -1; // no option should be selected
}
function select_value(select) {
    const selected_option = select.querySelector(':checked') || select.options[0];
    return selected_option && selected_option.__value;
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

function create_fragment$7(ctx) {
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

function instance$7($$self, $$props, $$invalidate) {
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
		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});
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

function get_each_context$3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[16] = list[i];
	return child_ctx;
}

// (84:4) {:else}
function create_else_block$1(ctx) {
	let div1;
	let span0;
	let t0_value = /*question*/ ctx[0].num + "";
	let t0;
	let t1;
	let t2;
	let span1;
	let t3_value = (/*question*/ ctx[0].question || "No question set") + "";
	let t3;
	let t4;
	let span2;
	let t5;
	let t6_value = /*question*/ ctx[0].answer + "";
	let t6;
	let t7;
	let div0;
	let mounted;
	let dispose;
	let if_block = /*suggestions*/ ctx[1].length && create_if_block_1$1(ctx);

	return {
		c() {
			div1 = element("div");
			span0 = element("span");
			t0 = text(t0_value);
			t1 = text(":");
			t2 = space();
			span1 = element("span");
			t3 = text(t3_value);
			t4 = space();
			span2 = element("span");
			t5 = text("~ ");
			t6 = text(t6_value);
			t7 = space();
			div0 = element("div");
			if (if_block) if_block.c();
			attr(span0, "class", "jxword-question-num");
			attr(span1, "class", "jxword-question-question");
			attr(span2, "class", "jxword-question-answer");
			attr(div0, "class", "jxword-suggestions");
			attr(div1, "class", "jxword-question svelte-tw6vzm");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, span0);
			append(span0, t0);
			append(span0, t1);
			append(div1, t2);
			append(div1, span1);
			append(span1, t3);
			append(div1, t4);
			append(div1, span2);
			append(span2, t5);
			append(span2, t6);
			append(div1, t7);
			append(div1, div0);
			if (if_block) if_block.m(div0, null);

			if (!mounted) {
				dispose = listen(div1, "dblclick", function () {
					if (is_function(/*editQuestion*/ ctx[3](/*question*/ ctx[0]))) /*editQuestion*/ ctx[3](/*question*/ ctx[0]).apply(this, arguments);
				});

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*question*/ 1 && t0_value !== (t0_value = /*question*/ ctx[0].num + "")) set_data(t0, t0_value);
			if (dirty & /*question*/ 1 && t3_value !== (t3_value = (/*question*/ ctx[0].question || "No question set") + "")) set_data(t3, t3_value);
			if (dirty & /*question*/ 1 && t6_value !== (t6_value = /*question*/ ctx[0].answer + "")) set_data(t6, t6_value);

			if (/*suggestions*/ ctx[1].length) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_1$1(ctx);
					if_block.c();
					if_block.m(div0, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (detaching) detach(div1);
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
			attr(div2, "class", "btn svelte-tw6vzm");
			attr(div3, "class", "jxword-question jxword-question-editing svelte-tw6vzm");
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

// (88:8) {#if suggestions.length}
function create_if_block_1$1(ctx) {
	let each_1_anchor;
	let each_value = /*suggestions*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
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
					const child_ctx = get_each_context$3(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$3(child_ctx);
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

// (89:12) {#each suggestions as suggestion}
function create_each_block$3(ctx) {
	let span;
	let t_value = /*suggestion*/ ctx[16] + "";
	let t;
	let mounted;
	let dispose;

	return {
		c() {
			span = element("span");
			t = text(t_value);
			attr(span, "class", "jxword-suggestion svelte-tw6vzm");
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

function create_fragment$6(ctx) {
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
			attr(main, "class", "svelte-tw6vzm");
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

function instance$6($$self, $$props, $$invalidate) {
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

		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
			questions_across: 7,
			questions_down: 8,
			question: 0,
			direction: 9
		});
	}
}

/* src/Questions.svelte generated by Svelte v3.46.4 */

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i];
	return child_ctx;
}

function get_each_context_1$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i];
	return child_ctx;
}

// (5:16) {#each questions_across as question}
function create_each_block_1$2(ctx) {
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
function create_each_block$2(ctx) {
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

function create_fragment$5(ctx) {
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
		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
	}

	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
		each_blocks_1[i] = null;
	});

	let each_value = /*questions_down*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
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
			attr(div1, "class", "jxword-questions-direction jxword-questions-down svelte-1jm0aq5");
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
					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
						transition_in(each_blocks_1[i], 1);
					} else {
						each_blocks_1[i] = create_each_block_1$2(child_ctx);
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
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
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

function instance$5($$self, $$props, $$invalidate) {
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
		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});
	}
}

/* src/Grid.svelte generated by Svelte v3.46.4 */

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[60] = list[i];
	child_ctx[62] = i;
	return child_ctx;
}

function get_each_context_1$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[63] = list[i];
	child_ctx[65] = i;
	return child_ctx;
}

// (467:28) {:else}
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
			attr(text_1, "class", "jxword-no-print-blank svelte-1013j5m");
			attr(text_1, "id", "jxword-letter-" + /*x*/ ctx[65] + "-" + /*y*/ ctx[62]);
			attr(text_1, "x", text_1_x_value = /*cellWidth*/ ctx[18] * /*x*/ ctx[65] + /*margin*/ ctx[9] + /*cellWidth*/ ctx[18] / 2);
			attr(text_1, "y", text_1_y_value = /*cellHeight*/ ctx[22] * /*y*/ ctx[62] + /*margin*/ ctx[9] + /*cellHeight*/ ctx[22] - /*cellHeight*/ ctx[22] * 0.1);
			attr(text_1, "text-anchor", "middle");
			attr(text_1, "font-size", /*fontSize*/ ctx[20]);
			attr(text_1, "width", /*cellWidth*/ ctx[18]);
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

// (462:28) {#if letter=="#"}
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
			attr(line0, "class", "jxword-cell-line jxword-no-print svelte-1013j5m");
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
			attr(line1, "class", "jxword-no-print jxword-cell-line svelte-1013j5m");
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

// (471:28) {#if (number_grid[y][x] != null && letter!=="#")}
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

// (460:20) {#each col_data as letter, x}
function create_each_block_1$1(ctx) {
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

// (459:16) {#each grid as col_data, y}
function create_each_block$1(ctx) {
	let each_1_anchor;
	let each_value_1 = /*col_data*/ ctx[60];
	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
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
					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_1$1(child_ctx);
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

function create_fragment$4(ctx) {
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
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
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
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
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

function instance$4($$self, $$props, $$invalidate) {
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

		// Find the current question
		const current_question = getCurrentQuestion();

		// console.log(current_question);
		currentQuestion.set(current_question);

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
		console.log(question, suggestion);

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
			instance$4,
			create_fragment$4,
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

function create_fragment$3(ctx) {
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

function instance$3($$self, $$props, $$invalidate) {
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
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { visible: 0 });
	}
}

/* src/SizeSlider.svelte generated by Svelte v3.46.4 */

function create_fragment$2(ctx) {
	let main;
	let input;
	let t0;
	let label;
	let t1_value = `${/*findSize*/ ctx[1](/*size*/ ctx[0]).name} ${/*size*/ ctx[0]}x${/*size*/ ctx[0]}` + "";
	let t1;
	let mounted;
	let dispose;

	return {
		c() {
			main = element("main");
			input = element("input");
			t0 = space();
			label = element("label");
			t1 = text(t1_value);
			attr(input, "name", "size");
			attr(input, "type", "range");
			attr(input, "min", "2");
			attr(input, "max", "30");
			attr(input, "class", "svelte-1ngozab");
			attr(label, "for", "size");
			attr(main, "class", "svelte-1ngozab");
		},
		m(target, anchor) {
			insert(target, main, anchor);
			append(main, input);
			set_input_value(input, /*size*/ ctx[0]);
			append(main, t0);
			append(main, label);
			append(label, t1);

			if (!mounted) {
				dispose = [
					listen(input, "change", /*input_change_input_handler*/ ctx[3]),
					listen(input, "input", /*input_change_input_handler*/ ctx[3]),
					listen(input, "change", /*handleStateChange*/ ctx[2])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*size*/ 1) {
				set_input_value(input, /*size*/ ctx[0]);
			}

			if (dirty & /*size*/ 1 && t1_value !== (t1_value = `${/*findSize*/ ctx[1](/*size*/ ctx[0]).name} ${/*size*/ ctx[0]}x${/*size*/ ctx[0]}` + "")) set_data(t1, t1_value);
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

function instance$2($$self, $$props, $$invalidate) {
	const dispatch = createEventDispatcher();

	// Sizes
	const sizes = [
		{ name: "Mini", size: 5, min: 2, max: 5 },
		{ name: "Small", size: 7, min: 6, max: 10 },
		{
			name: "Weekday",
			size: 15,
			min: 11,
			max: 20
		},
		{
			name: "Large",
			size: 23,
			min: 21,
			max: 26
		},
		{
			name: "XLarge",
			size: 27,
			min: 27,
			max: 30
		}
	];

	let { size } = $$props;
	findSize(size);

	function findSize(size) {
		return sizes.find(s => size >= s.min && size <= s.max);
	}

	function handleStateChange() {
		findSize(size);
		dispatch("change");
	}

	function input_change_input_handler() {
		size = to_number(this.value);
		$$invalidate(0, size);
	}

	$$self.$$set = $$props => {
		if ('size' in $$props) $$invalidate(0, size = $$props.size);
	};

	return [size, findSize, handleStateChange, input_change_input_handler];
}

class SizeSlider extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, { size: 0 });
	}
}

/* src/Print.svelte generated by Svelte v3.46.4 */

function create_fragment$1(ctx) {
	let main;
	let button0;
	let t1;
	let button1;
	let mounted;
	let dispose;

	return {
		c() {
			main = element("main");
			button0 = element("button");
			button0.textContent = "Print (Filled)";
			t1 = space();
			button1 = element("button");
			button1.textContent = "Print (Blank)";
			attr(button0, "class", "jxword-button");
			attr(button1, "class", "jxword-button");
		},
		m(target, anchor) {
			insert(target, main, anchor);
			append(main, button0);
			append(main, t1);
			append(main, button1);

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*printFilled*/ ctx[1]),
					listen(button1, "click", /*printBlank*/ ctx[0])
				];

				mounted = true;
			}
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(main);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let $questionsAcross;
	let $questionsDown;
	component_subscribe($$self, questionsAcross, $$value => $$invalidate(3, $questionsAcross = $$value));
	component_subscribe($$self, questionsDown, $$value => $$invalidate(4, $questionsDown = $$value));
	let { state } = $$props;

	function printBlank() {
		const svg = document.querySelector(`.jxword-svg`).cloneNode(true);

		const remove_els = [
			...svg.querySelectorAll(`.jxword-no-print-blank`),
			...svg.querySelectorAll(`.jxword-no-print`)
		];

		for (let remove_el of remove_els) {
			remove_el.remove();
		}

		print(svg);
	}

	function printFilled() {
		const svg = document.querySelector(`.jxword-svg`).cloneNode(true);
		const remove_els = [...svg.querySelectorAll(`.jxword-no-print`)];

		for (let remove_el of remove_els) {
			remove_el.remove();
		}

		print(svg);
	}

	function formatQuestions(direction) {
		let questions;

		if (direction === "down") {
			questions = $questionsDown;
		} else {
			questions = $questionsAcross;
		}

		return questions.map(question => `<li>${question.num}: ${question.question}</li>`).join("");
	}

	function print(svg) {
		// console.log(svg);
		const svg_text = svg.outerHTML.replace(/fill="#f7f457"/g, `fill="#ffffff"`).replace(/fill="#9ce0fb"/g, `fill="#ffffff"`);

		const questions_across = `<h4>Across</h4><ol class="jxword-questions-list">${formatQuestions("across")}</ol>`;
		const questions_down = `<h4>Down</h4><ol class="jxword-questions-list">${formatQuestions("down")}</ol>`;
		let printWindow = window.open();
		printWindow.document.write(`<html><head><title>${state.title}</title>`);

		printWindow.document.write(`<style>.svg-container {
  height: 35em;
  display: block;
}

.jxword-svg {
  height: 100%;
  width: 100%;
}

.jxword-questions-list {
  list-style: none;
  line-height: 1.5;
  font-size: 12px;
  padding-left: 0px;
  display: flex;
  flex-direction: column;
  margin-right: 20px;
}

.jxword-questions-list-item-num {
  margin-right: 5px;
  text-align: right;
  width: 25px;
  min-width: 25px;
  font-weight: bold;
}

.questions {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}</style>`);

		printWindow.document.write(`<div class="svg-container">${svg_text}</div>`);
		printWindow.document.write(`<div class="questions">\n`);
		printWindow.document.write(`<div>${questions_across}</div>`);
		printWindow.document.write(`<div>${questions_down}</div>`);
		printWindow.document.write(`</div>`);
		printWindow.document.close();
		printWindow.focus();
		printWindow.print();
		printWindow.close();
	}

	$$self.$$set = $$props => {
		if ('state' in $$props) $$invalidate(2, state = $$props.state);
	};

	return [printBlank, printFilled, state];
}

class Print extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { state: 2 });
	}
}

function saveState(state) {
    let stateString = JSON.stringify(state);
    localStorage.setItem('jxword-creator', stateString);
}

function restoreState() {
    let stateString = localStorage.getItem('jxword-creator');
    if (stateString && stateString !== 'undefined') {
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
    if (!obj) return;
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
    if (obj.difficulty) {
        str += `Difficulty: ${obj.difficulty}\n`;
    }
    if (obj.type) {
        str += `Type: ${obj.type}\n`;
    }
    if (obj.copyright) {
        str += `Copyright: ${obj.copyright}\n`;
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

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[49] = list[i];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[52] = list[i];
	return child_ctx;
}

// (282:6) {#each difficulties as difficulty_option}
function create_each_block_1(ctx) {
	let option;
	let t_value = /*difficulty_option*/ ctx[52] + "";
	let t;
	let option_value_value;

	return {
		c() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = /*difficulty_option*/ ctx[52];
			option.value = option.__value;
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*difficulties*/ 1024 && t_value !== (t_value = /*difficulty_option*/ ctx[52] + "")) set_data(t, t_value);

			if (dirty[0] & /*difficulties*/ 1024 && option_value_value !== (option_value_value = /*difficulty_option*/ ctx[52])) {
				option.__value = option_value_value;
				option.value = option.__value;
			}
		},
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

// (290:6) {#each types as type_option}
function create_each_block(ctx) {
	let option;
	let t_value = /*type_option*/ ctx[49] + "";
	let t;
	let option_value_value;

	return {
		c() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = /*type_option*/ ctx[49];
			option.value = option.__value;
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*types*/ 2048 && t_value !== (t_value = /*type_option*/ ctx[49] + "")) set_data(t, t_value);

			if (dirty[0] & /*types*/ 2048 && option_value_value !== (option_value_value = /*type_option*/ ctx[49])) {
				option.__value = option_value_value;
				option.value = option.__value;
			}
		},
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

function create_fragment(ctx) {
	let main;
	let instructions;
	let updating_visible;
	let t0;
	let div10;
	let div7;
	let div2;
	let input0;
	let t1;
	let sizeslider;
	let updating_size;
	let t2;
	let div0;
	let label0;
	let t4;
	let select0;
	let t5;
	let div1;
	let label1;
	let t7;
	let select1;
	let t8;
	let input1;
	let t9;
	let input2;
	let t10;
	let input3;
	let t11;
	let input4;
	let t12;
	let div6;
	let div3;
	let input5;
	let t13;
	let label2;
	let t15;
	let print;
	let updating_state;
	let t16;
	let div4;
	let label3;
	let t18;
	let input6;
	let t19;
	let div5;
	let button;
	let t21;
	let div9;
	let div8;
	let menu;
	let t22;
	let grid_1;
	let updating_Container;
	let t23;
	let textarea;
	let current;
	let mounted;
	let dispose;

	function instructions_visible_binding(value) {
		/*instructions_visible_binding*/ ctx[29](value);
	}

	let instructions_props = {};

	if (/*instructionsVisible*/ ctx[18] !== void 0) {
		instructions_props.visible = /*instructionsVisible*/ ctx[18];
	}

	instructions = new Instructions({ props: instructions_props });
	binding_callbacks.push(() => bind(instructions, 'visible', instructions_visible_binding));

	function sizeslider_size_binding(value) {
		/*sizeslider_size_binding*/ ctx[31](value);
	}

	let sizeslider_props = {};

	if (/*size*/ ctx[15] !== void 0) {
		sizeslider_props.size = /*size*/ ctx[15];
	}

	sizeslider = new SizeSlider({ props: sizeslider_props });
	binding_callbacks.push(() => bind(sizeslider, 'size', sizeslider_size_binding));
	sizeslider.$on("change", /*handleStateChange*/ ctx[23]);
	let each_value_1 = /*difficulties*/ ctx[10];
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	let each_value = /*types*/ ctx[11];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	function print_state_binding(value) {
		/*print_state_binding*/ ctx[39](value);
	}

	let print_props = {};

	if (/*state*/ ctx[16] !== void 0) {
		print_props.state = /*state*/ ctx[16];
	}

	print = new Print({ props: print_props });
	binding_callbacks.push(() => bind(print, 'state', print_state_binding));
	menu = new Menu({});
	menu.$on("reset", /*handleReset*/ ctx[24]);
	menu.$on("instructions", /*handleInstructions*/ ctx[26]);

	function grid_1_Container_binding(value) {
		/*grid_1_Container_binding*/ ctx[42](value);
	}

	let grid_1_props = {
		size: /*size*/ ctx[15],
		grid: /*grid*/ ctx[1]
	};

	if (/*gridComponentContainer*/ ctx[14] !== void 0) {
		grid_1_props.Container = /*gridComponentContainer*/ ctx[14];
	}

	grid_1 = new Grid({ props: grid_1_props });
	/*grid_1_binding*/ ctx[41](grid_1);
	binding_callbacks.push(() => bind(grid_1, 'Container', grid_1_Container_binding));
	grid_1.$on("change", /*handleStateChange*/ ctx[23]);
	grid_1.$on("move", /*handleMove*/ ctx[19]);
	grid_1.$on("letter", /*handleLetter*/ ctx[20]);
	grid_1.$on("backspace", /*handleBackspace*/ ctx[22]);
	grid_1.$on("enter", /*handleEnter*/ ctx[21]);

	return {
		c() {
			main = element("main");
			create_component(instructions.$$.fragment);
			t0 = space();
			div10 = element("div");
			div7 = element("div");
			div2 = element("div");
			input0 = element("input");
			t1 = space();
			create_component(sizeslider.$$.fragment);
			t2 = space();
			div0 = element("div");
			label0 = element("label");
			label0.textContent = "Difficulty";
			t4 = space();
			select0 = element("select");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t5 = space();
			div1 = element("div");
			label1 = element("label");
			label1.textContent = "Type";
			t7 = space();
			select1 = element("select");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t8 = space();
			input1 = element("input");
			t9 = space();
			input2 = element("input");
			t10 = space();
			input3 = element("input");
			t11 = space();
			input4 = element("input");
			t12 = space();
			div6 = element("div");
			div3 = element("div");
			input5 = element("input");
			t13 = space();
			label2 = element("label");
			label2.textContent = "Symmetry";
			t15 = space();
			create_component(print.$$.fragment);
			t16 = space();
			div4 = element("div");
			label3 = element("label");
			label3.textContent = "Upload Crossword";
			t18 = space();
			input6 = element("input");
			t19 = space();
			div5 = element("div");
			button = element("button");
			button.textContent = "Download Crossword";
			t21 = space();
			div9 = element("div");
			div8 = element("div");
			create_component(menu.$$.fragment);
			t22 = space();
			create_component(grid_1.$$.fragment);
			t23 = space();
			textarea = element("textarea");
			attr(input0, "id", "jxword-title");
			attr(input0, "class", "jxword-title svelte-28r245");
			attr(input0, "name", "title");
			attr(input0, "type", "text");
			attr(input0, "placeholder", "Title");
			attr(label0, "for", "difficulty");
			attr(label0, "class", "svelte-28r245");
			attr(select0, "id", "jxword-difficulty");
			attr(select0, "name", "difficulty");
			attr(select0, "class", "svelte-28r245");
			if (/*difficulty*/ ctx[7] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[32].call(select0));
			attr(label1, "for", "type");
			attr(label1, "class", "svelte-28r245");
			attr(select1, "id", "jxword-type");
			attr(select1, "name", "type");
			attr(select1, "class", "svelte-28r245");
			if (/*type*/ ctx[8] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[33].call(select1));
			attr(input1, "id", "jxword-date");
			attr(input1, "name", "date");
			attr(input1, "type", "date");
			attr(input1, "placeholder", "Publish Date");
			attr(input1, "class", "svelte-28r245");
			attr(input2, "id", "jxword-author");
			attr(input2, "name", "author");
			attr(input2, "type", "text");
			attr(input2, "placeholder", "Author");
			attr(input2, "class", "svelte-28r245");
			attr(input3, "id", "jxword-editor");
			attr(input3, "name", "editor");
			attr(input3, "type", "text");
			attr(input3, "placeholder", "Editor");
			attr(input3, "class", "svelte-28r245");
			attr(input4, "id", "jxword-copyright");
			attr(input4, "name", "copyright");
			attr(input4, "type", "text");
			attr(input4, "placeholder", "Copyright");
			attr(input4, "class", "svelte-28r245");
			attr(div2, "id", "jxword-meta");
			attr(input5, "type", "checkbox");
			attr(input5, "name", "symmetry");
			attr(input5, "class", "svelte-28r245");
			attr(label2, "for", "symmetry");
			attr(label2, "class", "svelte-28r245");
			attr(div3, "class", "jxword-checkbox-group svelte-28r245");
			attr(label3, "for", "file");
			attr(label3, "class", "svelte-28r245");
			attr(input6, "class", "drop_zone svelte-28r245");
			attr(input6, "type", "file");
			attr(input6, "id", "file");
			attr(input6, "name", "files");
			attr(input6, "accept", ".xd");
			attr(div6, "id", "jxword-options");
			attr(div6, "class", "svelte-28r245");
			attr(div7, "id", "jxword-top");
			attr(div7, "class", "svelte-28r245");
			attr(div8, "class", "jxword-header");
			attr(div9, "class", "jxword-container svelte-28r245");
			attr(textarea, "id", "xd");
			attr(textarea, "name", "xd");
			attr(textarea, "class", "jxword-xd-textarea svelte-28r245");
			set_style(textarea, "display", /*displayXd*/ ctx[12] ? 'block' : 'none', false);
			attr(div10, "class", "jxword-form-container svelte-28r245");
			attr(main, "class", "svelte-28r245");
		},
		m(target, anchor) {
			insert(target, main, anchor);
			mount_component(instructions, main, null);
			append(main, t0);
			append(main, div10);
			append(div10, div7);
			append(div7, div2);
			append(div2, input0);
			set_input_value(input0, /*title*/ ctx[2]);
			append(div2, t1);
			mount_component(sizeslider, div2, null);
			append(div2, t2);
			append(div2, div0);
			append(div0, label0);
			append(div0, t4);
			append(div0, select0);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(select0, null);
			}

			select_option(select0, /*difficulty*/ ctx[7]);
			append(div2, t5);
			append(div2, div1);
			append(div1, label1);
			append(div1, t7);
			append(div1, select1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select1, null);
			}

			select_option(select1, /*type*/ ctx[8]);
			append(div2, t8);
			append(div2, input1);
			set_input_value(input1, /*date*/ ctx[6]);
			append(div2, t9);
			append(div2, input2);
			set_input_value(input2, /*author*/ ctx[3]);
			append(div2, t10);
			append(div2, input3);
			set_input_value(input3, /*editor*/ ctx[4]);
			append(div2, t11);
			append(div2, input4);
			set_input_value(input4, /*copyright*/ ctx[5]);
			append(div7, t12);
			append(div7, div6);
			append(div6, div3);
			append(div3, input5);
			input5.checked = /*symmetry*/ ctx[9];
			append(div3, t13);
			append(div3, label2);
			append(div6, t15);
			mount_component(print, div6, null);
			append(div6, t16);
			append(div6, div4);
			append(div4, label3);
			append(div4, t18);
			append(div4, input6);
			/*input6_binding*/ ctx[40](input6);
			append(div6, t19);
			append(div6, div5);
			append(div5, button);
			append(div10, t21);
			append(div10, div9);
			append(div9, div8);
			mount_component(menu, div8, null);
			append(div9, t22);
			mount_component(grid_1, div9, null);
			append(div10, t23);
			append(div10, textarea);
			set_input_value(textarea, /*xd*/ ctx[0]);
			current = true;

			if (!mounted) {
				dispose = [
					listen(input0, "input", /*input0_input_handler*/ ctx[30]),
					listen(input0, "change", /*handleStateChange*/ ctx[23]),
					listen(select0, "change", /*select0_change_handler*/ ctx[32]),
					listen(select0, "change", /*handleStateChange*/ ctx[23]),
					listen(select1, "change", /*select1_change_handler*/ ctx[33]),
					listen(select1, "change", /*handleStateChange*/ ctx[23]),
					listen(input1, "input", /*input1_input_handler*/ ctx[34]),
					listen(input1, "change", /*handleStateChange*/ ctx[23]),
					listen(input2, "input", /*input2_input_handler*/ ctx[35]),
					listen(input2, "change", /*handleStateChange*/ ctx[23]),
					listen(input3, "input", /*input3_input_handler*/ ctx[36]),
					listen(input3, "change", /*handleStateChange*/ ctx[23]),
					listen(input4, "input", /*input4_input_handler*/ ctx[37]),
					listen(input4, "change", /*handleStateChange*/ ctx[23]),
					listen(input5, "change", /*input5_change_handler*/ ctx[38]),
					listen(input6, "change", /*handleFileSelect*/ ctx[25]),
					listen(button, "click", /*downloadXD*/ ctx[27]),
					listen(textarea, "input", /*textarea_input_handler*/ ctx[43])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			const instructions_changes = {};

			if (!updating_visible && dirty[0] & /*instructionsVisible*/ 262144) {
				updating_visible = true;
				instructions_changes.visible = /*instructionsVisible*/ ctx[18];
				add_flush_callback(() => updating_visible = false);
			}

			instructions.$set(instructions_changes);

			if (dirty[0] & /*title*/ 4 && input0.value !== /*title*/ ctx[2]) {
				set_input_value(input0, /*title*/ ctx[2]);
			}

			const sizeslider_changes = {};

			if (!updating_size && dirty[0] & /*size*/ 32768) {
				updating_size = true;
				sizeslider_changes.size = /*size*/ ctx[15];
				add_flush_callback(() => updating_size = false);
			}

			sizeslider.$set(sizeslider_changes);

			if (dirty[0] & /*difficulties*/ 1024) {
				each_value_1 = /*difficulties*/ ctx[10];
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_1(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(select0, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_1.length;
			}

			if (dirty[0] & /*difficulty, difficulties*/ 1152) {
				select_option(select0, /*difficulty*/ ctx[7]);
			}

			if (dirty[0] & /*types*/ 2048) {
				each_value = /*types*/ ctx[11];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select1, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (dirty[0] & /*type, types*/ 2304) {
				select_option(select1, /*type*/ ctx[8]);
			}

			if (dirty[0] & /*date*/ 64) {
				set_input_value(input1, /*date*/ ctx[6]);
			}

			if (dirty[0] & /*author*/ 8 && input2.value !== /*author*/ ctx[3]) {
				set_input_value(input2, /*author*/ ctx[3]);
			}

			if (dirty[0] & /*editor*/ 16 && input3.value !== /*editor*/ ctx[4]) {
				set_input_value(input3, /*editor*/ ctx[4]);
			}

			if (dirty[0] & /*copyright*/ 32 && input4.value !== /*copyright*/ ctx[5]) {
				set_input_value(input4, /*copyright*/ ctx[5]);
			}

			if (dirty[0] & /*symmetry*/ 512) {
				input5.checked = /*symmetry*/ ctx[9];
			}

			const print_changes = {};

			if (!updating_state && dirty[0] & /*state*/ 65536) {
				updating_state = true;
				print_changes.state = /*state*/ ctx[16];
				add_flush_callback(() => updating_state = false);
			}

			print.$set(print_changes);
			const grid_1_changes = {};
			if (dirty[0] & /*size*/ 32768) grid_1_changes.size = /*size*/ ctx[15];
			if (dirty[0] & /*grid*/ 2) grid_1_changes.grid = /*grid*/ ctx[1];

			if (!updating_Container && dirty[0] & /*gridComponentContainer*/ 16384) {
				updating_Container = true;
				grid_1_changes.Container = /*gridComponentContainer*/ ctx[14];
				add_flush_callback(() => updating_Container = false);
			}

			grid_1.$set(grid_1_changes);

			if (dirty[0] & /*xd*/ 1) {
				set_input_value(textarea, /*xd*/ ctx[0]);
			}

			if (dirty[0] & /*displayXd*/ 4096) {
				set_style(textarea, "display", /*displayXd*/ ctx[12] ? 'block' : 'none', false);
			}
		},
		i(local) {
			if (current) return;
			transition_in(instructions.$$.fragment, local);
			transition_in(sizeslider.$$.fragment, local);
			transition_in(print.$$.fragment, local);
			transition_in(menu.$$.fragment, local);
			transition_in(grid_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(instructions.$$.fragment, local);
			transition_out(sizeslider.$$.fragment, local);
			transition_out(print.$$.fragment, local);
			transition_out(menu.$$.fragment, local);
			transition_out(grid_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(main);
			destroy_component(instructions);
			destroy_component(sizeslider);
			destroy_each(each_blocks_1, detaching);
			destroy_each(each_blocks, detaching);
			destroy_component(print);
			/*input6_binding*/ ctx[40](null);
			destroy_component(menu);
			/*grid_1_binding*/ ctx[41](null);
			destroy_component(grid_1);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let $questionsDown;
	let $questionsAcross;
	let $currentDirection;
	component_subscribe($$self, questionsDown, $$value => $$invalidate(44, $questionsDown = $$value));
	component_subscribe($$self, questionsAcross, $$value => $$invalidate(45, $questionsAcross = $$value));
	component_subscribe($$self, currentDirection, $$value => $$invalidate(46, $currentDirection = $$value));
	let { difficulties = ["Easy", "Medium", "Hard", "Evil"] } = $$props;
	let { types = ["Straight", "Quick", "Cryptic"] } = $$props;
	const save_state = true;
	let { xd } = $$props;
	let { grid = [...Array(15)].map(e => Array(15)) } = $$props;
	let { title } = $$props;
	let { author } = $$props;
	let { editor } = $$props;
	let { copyright } = $$props;
	let { date } = $$props;
	let { difficulty } = $$props;
	let { type } = $$props;
	let { displayXd = true } = $$props;
	let { symmetry = true } = $$props;

	// Private properties
	// let symmetry_id = $symmetries.findIndex(s => s.default);
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
	}; // symmetry_id,

	let getState = () => {
		if (!gridComponent) return; // We haven't loaded the grid yet
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
			copyright,
			difficulty,
			type,
			date
		}; // symmetry_id,
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

		if (symmetry) {
			if (letter === "#") {
				$$invalidate(1, grid[size - y - 1][size - x - 1] = "#", grid);
			}
		}

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
		const letter = grid[y][x];

		if (symmetry && letter === "#") {
			$$invalidate(1, grid[size - y - 1][size - x - 1] = "", grid);
		}

		$$invalidate(1, grid[y][x] = "", grid);

		if ($currentDirection === "across") {
			gridComponent.moveLeft();
		} else {
			gridComponent.moveUp();
		}
	}

	async function handleStateChange() {
		saveState(getState());
		$$invalidate(0, xd = XDEncode(getState()));
	}

	onMount(() => {
		if (xd) {
			loadXd(xd);
		} else {
			{
				$$invalidate(16, state = restoreState() || state);
			}

			$$invalidate(1, grid = state.grid);
			$$invalidate(15, size = state.size);
			$$invalidate(3, author = state.author);
			$$invalidate(4, editor = state.editor);
			$$invalidate(5, copyright = state.copyright);
			$$invalidate(6, date = state.date);
			$$invalidate(2, title = state.title);
			$$invalidate(7, difficulty = state.difficulty);
			$$invalidate(8, type = state.type);
			questionsAcross.set(state.questions_across);
			questionsDown.set(state.questions_down);
			gridComponent.setDir(state.direction);
			gridComponent.setCurrentPos(state.current_x, state.current_y);
		} // symmetry_id = state.symmetry_id;
	});

	function handleReset() {
		clearState();
		$$invalidate(15, size = 15);
		gridComponent.setDir("across");
		gridComponent.setCurrentPos(0, 0);
		$$invalidate(2, title = "");
		$$invalidate(3, author = "");
		$$invalidate(4, editor = "");
		$$invalidate(5, copyright = "");
		$$invalidate(6, date = "");
		$$invalidate(7, difficulty = "Medium");
		$$invalidate(8, type = "Straight");
		$$invalidate(1, grid = [...Array(15)].map(e => Array(15)));
		questionsAcross.set([]);
		clearState();
		questionsDown.set([]);
		clearState();
		$$invalidate(0, xd = "");
		clearState();
	}

	async function loadXd(xd) {
		const data = xdCrosswordParser(xd);
		$$invalidate(1, grid = data.grid);
		$$invalidate(15, size = data.grid.length);
		$$invalidate(3, author = data.meta.Author);
		$$invalidate(4, editor = data.meta.Editor);
		$$invalidate(5, copyright = data.meta.Copyright);
		$$invalidate(6, date = data.meta.Date);
		$$invalidate(2, title = data.meta.Title);
		$$invalidate(7, difficulty = data.meta.Difficulty);
		$$invalidate(8, type = data.meta.Type);
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
		$$invalidate(18, instructionsVisible = true);
	}

	function downloadXD() {
		// Download contents of xd
		const file = new Blob([xd], { type: "text/plain;charset=utf-8" });

		const downloadLink = document.createElement("a");
		downloadLink.download = "crossword.xd";
		downloadLink.href = URL.createObjectURL(file);
		downloadLink.click();
	}

	function instructions_visible_binding(value) {
		instructionsVisible = value;
		$$invalidate(18, instructionsVisible);
	}

	function input0_input_handler() {
		title = this.value;
		$$invalidate(2, title);
	}

	function sizeslider_size_binding(value) {
		size = value;
		$$invalidate(15, size);
	}

	function select0_change_handler() {
		difficulty = select_value(this);
		$$invalidate(7, difficulty);
		$$invalidate(10, difficulties);
	}

	function select1_change_handler() {
		type = select_value(this);
		$$invalidate(8, type);
		$$invalidate(11, types);
	}

	function input1_input_handler() {
		date = this.value;
		$$invalidate(6, date);
	}

	function input2_input_handler() {
		author = this.value;
		$$invalidate(3, author);
	}

	function input3_input_handler() {
		editor = this.value;
		$$invalidate(4, editor);
	}

	function input4_input_handler() {
		copyright = this.value;
		$$invalidate(5, copyright);
	}

	function input5_change_handler() {
		symmetry = this.checked;
		$$invalidate(9, symmetry);
	}

	function print_state_binding(value) {
		state = value;
		$$invalidate(16, state);
	}

	function input6_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			fileInput = $$value;
			$$invalidate(17, fileInput);
		});
	}

	function grid_1_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			gridComponent = $$value;
			$$invalidate(13, gridComponent);
		});
	}

	function grid_1_Container_binding(value) {
		gridComponentContainer = value;
		$$invalidate(14, gridComponentContainer);
	}

	function textarea_input_handler() {
		xd = this.value;
		$$invalidate(0, xd);
	}

	$$self.$$set = $$props => {
		if ('difficulties' in $$props) $$invalidate(10, difficulties = $$props.difficulties);
		if ('types' in $$props) $$invalidate(11, types = $$props.types);
		if ('xd' in $$props) $$invalidate(0, xd = $$props.xd);
		if ('grid' in $$props) $$invalidate(1, grid = $$props.grid);
		if ('title' in $$props) $$invalidate(2, title = $$props.title);
		if ('author' in $$props) $$invalidate(3, author = $$props.author);
		if ('editor' in $$props) $$invalidate(4, editor = $$props.editor);
		if ('copyright' in $$props) $$invalidate(5, copyright = $$props.copyright);
		if ('date' in $$props) $$invalidate(6, date = $$props.date);
		if ('difficulty' in $$props) $$invalidate(7, difficulty = $$props.difficulty);
		if ('type' in $$props) $$invalidate(8, type = $$props.type);
		if ('displayXd' in $$props) $$invalidate(12, displayXd = $$props.displayXd);
		if ('symmetry' in $$props) $$invalidate(9, symmetry = $$props.symmetry);
	};

	return [
		xd,
		grid,
		title,
		author,
		editor,
		copyright,
		date,
		difficulty,
		type,
		symmetry,
		difficulties,
		types,
		displayXd,
		gridComponent,
		gridComponentContainer,
		size,
		state,
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
		downloadXD,
		save_state,
		instructions_visible_binding,
		input0_input_handler,
		sizeslider_size_binding,
		select0_change_handler,
		select1_change_handler,
		input1_input_handler,
		input2_input_handler,
		input3_input_handler,
		input4_input_handler,
		input5_change_handler,
		print_state_binding,
		input6_binding,
		grid_1_binding,
		grid_1_Container_binding,
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
				difficulties: 10,
				types: 11,
				save_state: 28,
				xd: 0,
				grid: 1,
				title: 2,
				author: 3,
				editor: 4,
				copyright: 5,
				date: 6,
				difficulty: 7,
				type: 8,
				displayXd: 12,
				symmetry: 9
			},
			null,
			[-1, -1]
		);
	}

	get save_state() {
		return this.$$.ctx[28];
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
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
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
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!************************!*\
  !*** ./src/creator.js ***!
  \************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var jxword_creator_dist_jxwordcreator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jxword-creator/dist/jxwordcreator.js */ "./node_modules/jxword-creator/dist/jxwordcreator.js");
/* harmony import */ var jxword_creator_dist_jxwordcreator_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(jxword_creator_dist_jxwordcreator_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var jxword_creator_dist_dist_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! jxword-creator/dist/dist.css */ "./node_modules/jxword-creator/dist/dist.css");


const el = document.getElementById("crosswordengine-creator-container");
const props = {
    save_state: false,
};
if (typeof xd !== 'undefined') {
    props.xd = xd; // eslint-disable-line
}
jxword_creator_dist_jxwordcreator_js__WEBPACK_IMPORTED_MODULE_0___default()(el, props);
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Jvc3N3b3JkZW5naW5lLmNyZWF0b3IuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNBLGtCQUFrQix3REFBd0QsK0JBQStCLGFBQWEscUdBQXFHLDJCQUEyQixrREFBa0Q7QUFDeFM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsdUJBQXVCO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLDJCQUEyQjtBQUMvQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0I7QUFDL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLDZCQUE2QjtBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLCtDQUErQztBQUMzRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaURBQWlEO0FBQ2pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxHQUFHO0FBQ2QsV0FBVyxtQkFBbUI7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0NBQW9DLDZCQUE2QjtBQUNqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQzs7QUFFbkM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsdUVBQXVFO0FBQ3ZFO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLG9CQUFvQjtBQUN4QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsT0FBTztBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsV0FBVztBQUNYO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsV0FBVztBQUNYO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsV0FBVztBQUNYO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGlCQUFpQix1QkFBdUI7QUFDeEM7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsbUJBQW1CLHdCQUF3QjtBQUMzQztBQUNBOztBQUVBO0FBQ0EsR0FBRztBQUNIO0FBQ0EsbUJBQW1CLHdCQUF3QjtBQUMzQztBQUNBOztBQUVBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGdCQUFnQix1QkFBdUI7QUFDdkM7O0FBRUE7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQVcsd0JBQXdCO0FBQ25DO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLHdCQUF3QjtBQUMvQixPQUFPLHNCQUFzQjtBQUM3QixPQUFPLFdBQVc7QUFDbEIsT0FBTyxZQUFZOztBQUVuQjtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTs7QUFFQTtBQUNBO0FBQ0EscUJBQXFCLHFCQUFxQjtBQUMxQztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsZ0NBQWdDLHlCQUF5QjtBQUN6RDs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxXQUFXO0FBQ1g7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsWUFBWTtBQUNaO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGlCQUFpQix5QkFBeUI7QUFDMUM7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsRUFBRTs7QUFFRjtBQUNBOztBQUVBLGlCQUFpQix1QkFBdUI7QUFDeEM7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsRUFBRTs7QUFFRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1CQUFtQiwwQkFBMEI7QUFDN0M7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1CQUFtQix3QkFBd0I7QUFDM0M7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsbUJBQW1CLDBCQUEwQjtBQUM3QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1CQUFtQix3QkFBd0I7QUFDM0M7QUFDQTs7QUFFQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxnQkFBZ0IseUJBQXlCO0FBQ3pDOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUEsa0NBQWtDLDBCQUEwQjtBQUM1RDtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLGdCQUFnQix1QkFBdUI7QUFDdkM7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQSxnQ0FBZ0Msd0JBQXdCO0FBQ3hEO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBOztBQUVBLG1CQUFtQix5QkFBeUI7QUFDNUM7QUFDQTs7QUFFQSxtQkFBbUIsdUJBQXVCO0FBQzFDO0FBQ0E7O0FBRUE7QUFDQSxHQUFHO0FBQ0g7QUFDQTs7QUFFQSxtQkFBbUIsMEJBQTBCO0FBQzdDO0FBQ0E7O0FBRUE7O0FBRUEsbUJBQW1CLHdCQUF3QjtBQUMzQztBQUNBOztBQUVBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsRUFBRTs7QUFFRjtBQUNBO0FBQ0EsRUFBRTs7QUFFRjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLHVFQUF1RTtBQUN2RTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsaUJBQWlCLHlCQUF5QjtBQUMxQztBQUNBOztBQUVBO0FBQ0E7QUFDQSxtQkFBbUIsd0JBQXdCO0FBQzNDO0FBQ0E7O0FBRUE7QUFDQSxHQUFHO0FBQ0g7QUFDQSxtQkFBbUIsd0JBQXdCO0FBQzNDO0FBQ0E7O0FBRUE7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsZ0JBQWdCLHlCQUF5QjtBQUN6Qzs7QUFFQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsV0FBVyx3QkFBd0I7QUFDbkM7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsaUJBQWlCLHVCQUF1QjtBQUN4QztBQUNBOztBQUVBLDZCQUE2QjtBQUM3QjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsbUJBQW1CLHdCQUF3QjtBQUMzQztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1CQUFtQix3QkFBd0I7QUFDM0M7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGdCQUFnQix1QkFBdUI7QUFDdkM7O0FBRUE7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQVcsd0JBQXdCO0FBQ25DO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU8sWUFBWTtBQUNuQixPQUFPLFFBQVE7QUFDZixPQUFPLFlBQVk7QUFDbkIsT0FBTyxZQUFZO0FBQ25CLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sbUJBQW1CO0FBQzFCLE9BQU8sb0JBQW9CO0FBQzNCLE9BQU8seUJBQXlCO0FBQ2hDLE9BQU8sdUJBQXVCO0FBQzlCLE9BQU8sYUFBYTtBQUNwQixPQUFPLDhCQUE4QjtBQUNyQyxPQUFPLDhCQUE4QjtBQUNyQyxPQUFPLHVCQUF1QjtBQUM5QixPQUFPLDZCQUE2QjtBQUNwQztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsbUJBQW1CLDZCQUE2QjtBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxjQUFjO0FBQ2Q7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0osbUJBQW1CLDJCQUEyQjtBQUM5QztBQUNBLGNBQWM7QUFDZDs7QUFFQTtBQUNBLGlFQUFpRSxvQ0FBb0M7QUFDckc7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFFBQVEsT0FBTztBQUNmOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQVc7QUFDWDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFdBQVc7QUFDWDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLHlCQUF5QixZQUFZO0FBQ3JDO0FBQ0E7QUFDQSxJQUFJO0FBQ0oseUJBQXlCLFlBQVk7QUFDckM7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLDJCQUEyQixVQUFVO0FBQ3JDOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBLDJCQUEyQixRQUFRO0FBQ25DOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0EsMkJBQTJCLFVBQVU7QUFDckM7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsMkJBQTJCLFFBQVE7QUFDbkM7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFdBQVc7QUFDWDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQSxJQUFJO0FBQ0o7QUFDQSxJQUFJO0FBQ0o7QUFDQSxJQUFJO0FBQ0o7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFVBQVUsdUJBQXVCO0FBQ2pDOztBQUVBO0FBQ0EsbUJBQW1CLHVCQUF1QjtBQUMxQztBQUNBO0FBQ0EsSUFBSTtBQUNKLG1CQUFtQix1QkFBdUI7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EscUJBQXFCLFVBQVU7QUFDL0I7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHFCQUFxQixpQkFBaUI7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLG9CQUFvQixVQUFVO0FBQzlCO0FBQ0E7QUFDQTs7QUFFQSxxQkFBcUIsVUFBVTtBQUMvQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsT0FBTyxrQkFBa0I7O0FBRXpCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx1RUFBdUUsWUFBWTtBQUNuRjtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsMkNBQTJDLEVBQUUsZ0JBQWdCLEdBQUcsZ0JBQWdCO0FBQ25HO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBOztBQUVBLHlEQUF5RCwyQ0FBMkMsRUFBRSxnQkFBZ0IsR0FBRyxnQkFBZ0I7QUFDekksR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxJQUFJLHVDQUF1QztBQUMzQyxJQUFJLHlDQUF5QztBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBTyxPQUFPO0FBQ2Q7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLHVFQUF1RSxTQUFTO0FBQ2hGO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU8sUUFBUTs7QUFFZjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTs7QUFFQSwwQ0FBMEMsYUFBYSxJQUFJLGtCQUFrQjtBQUM3RTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsK0VBQStFLDBCQUEwQjtBQUN6RywyRUFBMkUsd0JBQXdCO0FBQ25HO0FBQ0EsbURBQW1ELFlBQVk7O0FBRS9EO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7O0FBRUQsMkRBQTJELFNBQVM7QUFDcEU7QUFDQSxxQ0FBcUMsaUJBQWlCO0FBQ3RELHFDQUFxQyxlQUFlO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx1RUFBdUUsVUFBVTtBQUNqRjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QixVQUFVO0FBQ25DO0FBQ0E7QUFDQSwwQkFBMEIsV0FBVztBQUNyQztBQUNBO0FBQ0EsMEJBQTBCLFdBQVc7QUFDckM7QUFDQTtBQUNBLHdCQUF3QixzQkFBc0I7QUFDOUM7QUFDQTtBQUNBLDhCQUE4QixlQUFlO0FBQzdDO0FBQ0E7QUFDQSx3QkFBd0IsU0FBUztBQUNqQztBQUNBO0FBQ0EsNkJBQTZCLGNBQWM7QUFDM0M7QUFDQTtBQUNBLG9CQUFvQixxQkFBcUI7QUFDekMsdUJBQXVCLHdCQUF3QjtBQUMvQyxzQkFBc0IsZUFBZTtBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLE1BQU0sSUFBSSxZQUFZLElBQUksU0FBUztBQUN0RDtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsTUFBTSxJQUFJLFlBQVksSUFBSSxTQUFTO0FBQ3REO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixrQkFBa0I7QUFDN0M7QUFDQTtBQUNBO0FBQ0EsNkVBQTZFLGFBQWE7QUFDMUY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0Isa0JBQWtCO0FBQzFDO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGtCQUFrQjtBQUMxQztBQUNBO0FBQ0EsdUVBQXVFLFNBQVM7QUFDaEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBLG1DQUFtQywyQkFBMkI7QUFDOUQ7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSwrQkFBK0IseUJBQXlCO0FBQ3hEO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGlCQUFpQix5QkFBeUI7QUFDMUM7QUFDQTs7QUFFQTtBQUNBOztBQUVBLGlCQUFpQix1QkFBdUI7QUFDeEM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBLHFCQUFxQixvQkFBb0I7QUFDekM7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLHFCQUFxQixxQkFBcUI7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxtQkFBbUIsMEJBQTBCO0FBQzdDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1CQUFtQix3QkFBd0I7QUFDM0M7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1CQUFtQiwwQkFBMEI7QUFDN0M7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsbUJBQW1CLHdCQUF3QjtBQUMzQztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxnQkFBZ0IseUJBQXlCO0FBQ3pDOztBQUVBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxXQUFXLDBCQUEwQjtBQUNyQztBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxnQkFBZ0IsdUJBQXVCO0FBQ3ZDOztBQUVBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxXQUFXLHdCQUF3QjtBQUNuQztBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU8sb0RBQW9EO0FBQzNELE9BQU8sMkNBQTJDO0FBQ2xEO0FBQ0EsT0FBTyxLQUFLO0FBQ1osT0FBTyw0Q0FBNEM7QUFDbkQsT0FBTyxRQUFRO0FBQ2YsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sU0FBUztBQUNoQixPQUFPLFlBQVk7QUFDbkIsT0FBTyxPQUFPO0FBQ2QsT0FBTyxhQUFhO0FBQ3BCLE9BQU8sT0FBTztBQUNkLE9BQU8sbUJBQW1CO0FBQzFCLE9BQU8sa0JBQWtCOztBQUV6QjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJOztBQUVKO0FBQ0EsOEJBQThCO0FBQzlCLFFBQVEsNkJBQTZCOztBQUVyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFFBQVEsT0FBTztBQUNmOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxRQUFRLE9BQU87QUFDZjs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFFBQVEsT0FBTztBQUNmOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKLEVBQUU7O0FBRUY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSwrREFBK0QsYUFBYTs7QUFFNUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsNkRBQTZELGFBQWE7O0FBRTFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGdDQUFnQyxrQkFBa0IsZ0JBQWdCOztBQUVsRTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBOzs7Ozs7Ozs7Ozs7O0FDcnpJQTs7Ozs7OztVQ0FBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxpQ0FBaUMsV0FBVztXQUM1QztXQUNBOzs7OztXQ1BBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7Ozs7QUNOMkQ7QUFDckI7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQjtBQUNuQjtBQUNBLDJFQUFPLFkiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vbm9kZV9tb2R1bGVzL2p4d29yZC1jcmVhdG9yL2Rpc3Qvanh3b3JkY3JlYXRvci5qcyIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vbm9kZV9tb2R1bGVzL2p4d29yZC1jcmVhdG9yL2Rpc3QvZGlzdC5jc3M/Zjc4MCIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vY3Jvc3N3b3JkLWVuZ2luZS93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2Nyb3Nzd29yZC1lbmdpbmUvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vc3JjL2NyZWF0b3IuanMiXSwic291cmNlc0NvbnRlbnQiOlsiXG4oZnVuY3Rpb24obCwgcikgeyBpZiAoIWwgfHwgbC5nZXRFbGVtZW50QnlJZCgnbGl2ZXJlbG9hZHNjcmlwdCcpKSByZXR1cm47IHIgPSBsLmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpOyByLmFzeW5jID0gMTsgci5zcmMgPSAnLy8nICsgKHNlbGYubG9jYXRpb24uaG9zdCB8fCAnbG9jYWxob3N0Jykuc3BsaXQoJzonKVswXSArICc6MzU3MjkvbGl2ZXJlbG9hZC5qcz9zbmlwdmVyPTEnOyByLmlkID0gJ2xpdmVyZWxvYWRzY3JpcHQnOyBsLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQocikgfSkoc2VsZi5kb2N1bWVudCk7XG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7IH1cbmZ1bmN0aW9uIHJ1bihmbikge1xuICAgIHJldHVybiBmbigpO1xufVxuZnVuY3Rpb24gYmxhbmtfb2JqZWN0KCkge1xuICAgIHJldHVybiBPYmplY3QuY3JlYXRlKG51bGwpO1xufVxuZnVuY3Rpb24gcnVuX2FsbChmbnMpIHtcbiAgICBmbnMuZm9yRWFjaChydW4pO1xufVxuZnVuY3Rpb24gaXNfZnVuY3Rpb24odGhpbmcpIHtcbiAgICByZXR1cm4gdHlwZW9mIHRoaW5nID09PSAnZnVuY3Rpb24nO1xufVxuZnVuY3Rpb24gc2FmZV9ub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiIHx8ICgoYSAmJiB0eXBlb2YgYSA9PT0gJ29iamVjdCcpIHx8IHR5cGVvZiBhID09PSAnZnVuY3Rpb24nKTtcbn1cbmZ1bmN0aW9uIGlzX2VtcHR5KG9iaikge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMDtcbn1cbmZ1bmN0aW9uIHN1YnNjcmliZShzdG9yZSwgLi4uY2FsbGJhY2tzKSB7XG4gICAgaWYgKHN0b3JlID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgfVxuICAgIGNvbnN0IHVuc3ViID0gc3RvcmUuc3Vic2NyaWJlKC4uLmNhbGxiYWNrcyk7XG4gICAgcmV0dXJuIHVuc3ViLnVuc3Vic2NyaWJlID8gKCkgPT4gdW5zdWIudW5zdWJzY3JpYmUoKSA6IHVuc3ViO1xufVxuZnVuY3Rpb24gY29tcG9uZW50X3N1YnNjcmliZShjb21wb25lbnQsIHN0b3JlLCBjYWxsYmFjaykge1xuICAgIGNvbXBvbmVudC4kJC5vbl9kZXN0cm95LnB1c2goc3Vic2NyaWJlKHN0b3JlLCBjYWxsYmFjaykpO1xufVxuZnVuY3Rpb24gc2V0X3N0b3JlX3ZhbHVlKHN0b3JlLCByZXQsIHZhbHVlKSB7XG4gICAgc3RvcmUuc2V0KHZhbHVlKTtcbiAgICByZXR1cm4gcmV0O1xufVxuZnVuY3Rpb24gYXBwZW5kKHRhcmdldCwgbm9kZSkge1xuICAgIHRhcmdldC5hcHBlbmRDaGlsZChub2RlKTtcbn1cbmZ1bmN0aW9uIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgYW5jaG9yIHx8IG51bGwpO1xufVxuZnVuY3Rpb24gZGV0YWNoKG5vZGUpIHtcbiAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2VhY2goaXRlcmF0aW9ucywgZGV0YWNoaW5nKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVyYXRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChpdGVyYXRpb25zW2ldKVxuICAgICAgICAgICAgaXRlcmF0aW9uc1tpXS5kKGRldGFjaGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XG59XG5mdW5jdGlvbiBzdmdfZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBuYW1lKTtcbn1cbmZ1bmN0aW9uIHRleHQoZGF0YSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKTtcbn1cbmZ1bmN0aW9uIHNwYWNlKCkge1xuICAgIHJldHVybiB0ZXh0KCcgJyk7XG59XG5mdW5jdGlvbiBlbXB0eSgpIHtcbiAgICByZXR1cm4gdGV4dCgnJyk7XG59XG5mdW5jdGlvbiBsaXN0ZW4obm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpIHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgIHJldHVybiAoKSA9PiBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xufVxuZnVuY3Rpb24gYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZSk7XG4gICAgZWxzZSBpZiAobm9kZS5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKSAhPT0gdmFsdWUpXG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZSwgdmFsdWUpO1xufVxuZnVuY3Rpb24gdG9fbnVtYmVyKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSAnJyA/IG51bGwgOiArdmFsdWU7XG59XG5mdW5jdGlvbiBjaGlsZHJlbihlbGVtZW50KSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oZWxlbWVudC5jaGlsZE5vZGVzKTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhKHRleHQsIGRhdGEpIHtcbiAgICBkYXRhID0gJycgKyBkYXRhO1xuICAgIGlmICh0ZXh0Lndob2xlVGV4dCAhPT0gZGF0YSlcbiAgICAgICAgdGV4dC5kYXRhID0gZGF0YTtcbn1cbmZ1bmN0aW9uIHNldF9pbnB1dF92YWx1ZShpbnB1dCwgdmFsdWUpIHtcbiAgICBpbnB1dC52YWx1ZSA9IHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlO1xufVxuZnVuY3Rpb24gc2V0X3N0eWxlKG5vZGUsIGtleSwgdmFsdWUsIGltcG9ydGFudCkge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICBub2RlLnN0eWxlLnJlbW92ZVByb3BlcnR5KGtleSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBub2RlLnN0eWxlLnNldFByb3BlcnR5KGtleSwgdmFsdWUsIGltcG9ydGFudCA/ICdpbXBvcnRhbnQnIDogJycpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNlbGVjdF9vcHRpb24oc2VsZWN0LCB2YWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0Lm9wdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG4gICAgICAgIGlmIChvcHRpb24uX192YWx1ZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2VsZWN0LnNlbGVjdGVkSW5kZXggPSAtMTsgLy8gbm8gb3B0aW9uIHNob3VsZCBiZSBzZWxlY3RlZFxufVxuZnVuY3Rpb24gc2VsZWN0X3ZhbHVlKHNlbGVjdCkge1xuICAgIGNvbnN0IHNlbGVjdGVkX29wdGlvbiA9IHNlbGVjdC5xdWVyeVNlbGVjdG9yKCc6Y2hlY2tlZCcpIHx8IHNlbGVjdC5vcHRpb25zWzBdO1xuICAgIHJldHVybiBzZWxlY3RlZF9vcHRpb24gJiYgc2VsZWN0ZWRfb3B0aW9uLl9fdmFsdWU7XG59XG5mdW5jdGlvbiB0b2dnbGVfY2xhc3MoZWxlbWVudCwgbmFtZSwgdG9nZ2xlKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3RbdG9nZ2xlID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG59XG5mdW5jdGlvbiBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsLCBidWJibGVzID0gZmFsc2UpIHtcbiAgICBjb25zdCBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgZS5pbml0Q3VzdG9tRXZlbnQodHlwZSwgYnViYmxlcywgZmFsc2UsIGRldGFpbCk7XG4gICAgcmV0dXJuIGU7XG59XG5cbmxldCBjdXJyZW50X2NvbXBvbmVudDtcbmZ1bmN0aW9uIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICBjdXJyZW50X2NvbXBvbmVudCA9IGNvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGdldF9jdXJyZW50X2NvbXBvbmVudCgpIHtcbiAgICBpZiAoIWN1cnJlbnRfY29tcG9uZW50KVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Z1bmN0aW9uIGNhbGxlZCBvdXRzaWRlIGNvbXBvbmVudCBpbml0aWFsaXphdGlvbicpO1xuICAgIHJldHVybiBjdXJyZW50X2NvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIG9uTW91bnQoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5vbl9tb3VudC5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpIHtcbiAgICBjb25zdCBjb21wb25lbnQgPSBnZXRfY3VycmVudF9jb21wb25lbnQoKTtcbiAgICByZXR1cm4gKHR5cGUsIGRldGFpbCkgPT4ge1xuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSBjb21wb25lbnQuJCQuY2FsbGJhY2tzW3R5cGVdO1xuICAgICAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgICAgICAvLyBUT0RPIGFyZSB0aGVyZSBzaXR1YXRpb25zIHdoZXJlIGV2ZW50cyBjb3VsZCBiZSBkaXNwYXRjaGVkXG4gICAgICAgICAgICAvLyBpbiBhIHNlcnZlciAobm9uLURPTSkgZW52aXJvbm1lbnQ/XG4gICAgICAgICAgICBjb25zdCBldmVudCA9IGN1c3RvbV9ldmVudCh0eXBlLCBkZXRhaWwpO1xuICAgICAgICAgICAgY2FsbGJhY2tzLnNsaWNlKCkuZm9yRWFjaChmbiA9PiB7XG4gICAgICAgICAgICAgICAgZm4uY2FsbChjb21wb25lbnQsIGV2ZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbn1cbi8vIFRPRE8gZmlndXJlIG91dCBpZiB3ZSBzdGlsbCB3YW50IHRvIHN1cHBvcnRcbi8vIHNob3J0aGFuZCBldmVudHMsIG9yIGlmIHdlIHdhbnQgdG8gaW1wbGVtZW50XG4vLyBhIHJlYWwgYnViYmxpbmcgbWVjaGFuaXNtXG5mdW5jdGlvbiBidWJibGUoY29tcG9uZW50LCBldmVudCkge1xuICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbZXZlbnQudHlwZV07XG4gICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNhbGxiYWNrcy5zbGljZSgpLmZvckVhY2goZm4gPT4gZm4uY2FsbCh0aGlzLCBldmVudCkpO1xuICAgIH1cbn1cblxuY29uc3QgZGlydHlfY29tcG9uZW50cyA9IFtdO1xuY29uc3QgYmluZGluZ19jYWxsYmFja3MgPSBbXTtcbmNvbnN0IHJlbmRlcl9jYWxsYmFja3MgPSBbXTtcbmNvbnN0IGZsdXNoX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgcmVzb2x2ZWRfcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xubGV0IHVwZGF0ZV9zY2hlZHVsZWQgPSBmYWxzZTtcbmZ1bmN0aW9uIHNjaGVkdWxlX3VwZGF0ZSgpIHtcbiAgICBpZiAoIXVwZGF0ZV9zY2hlZHVsZWQpIHtcbiAgICAgICAgdXBkYXRlX3NjaGVkdWxlZCA9IHRydWU7XG4gICAgICAgIHJlc29sdmVkX3Byb21pc2UudGhlbihmbHVzaCk7XG4gICAgfVxufVxuZnVuY3Rpb24gdGljaygpIHtcbiAgICBzY2hlZHVsZV91cGRhdGUoKTtcbiAgICByZXR1cm4gcmVzb2x2ZWRfcHJvbWlzZTtcbn1cbmZ1bmN0aW9uIGFkZF9yZW5kZXJfY2FsbGJhY2soZm4pIHtcbiAgICByZW5kZXJfY2FsbGJhY2tzLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gYWRkX2ZsdXNoX2NhbGxiYWNrKGZuKSB7XG4gICAgZmx1c2hfY2FsbGJhY2tzLnB1c2goZm4pO1xufVxuLy8gZmx1c2goKSBjYWxscyBjYWxsYmFja3MgaW4gdGhpcyBvcmRlcjpcbi8vIDEuIEFsbCBiZWZvcmVVcGRhdGUgY2FsbGJhY2tzLCBpbiBvcmRlcjogcGFyZW50cyBiZWZvcmUgY2hpbGRyZW5cbi8vIDIuIEFsbCBiaW5kOnRoaXMgY2FsbGJhY2tzLCBpbiByZXZlcnNlIG9yZGVyOiBjaGlsZHJlbiBiZWZvcmUgcGFyZW50cy5cbi8vIDMuIEFsbCBhZnRlclVwZGF0ZSBjYWxsYmFja3MsIGluIG9yZGVyOiBwYXJlbnRzIGJlZm9yZSBjaGlsZHJlbi4gRVhDRVBUXG4vLyAgICBmb3IgYWZ0ZXJVcGRhdGVzIGNhbGxlZCBkdXJpbmcgdGhlIGluaXRpYWwgb25Nb3VudCwgd2hpY2ggYXJlIGNhbGxlZCBpblxuLy8gICAgcmV2ZXJzZSBvcmRlcjogY2hpbGRyZW4gYmVmb3JlIHBhcmVudHMuXG4vLyBTaW5jZSBjYWxsYmFja3MgbWlnaHQgdXBkYXRlIGNvbXBvbmVudCB2YWx1ZXMsIHdoaWNoIGNvdWxkIHRyaWdnZXIgYW5vdGhlclxuLy8gY2FsbCB0byBmbHVzaCgpLCB0aGUgZm9sbG93aW5nIHN0ZXBzIGd1YXJkIGFnYWluc3QgdGhpczpcbi8vIDEuIER1cmluZyBiZWZvcmVVcGRhdGUsIGFueSB1cGRhdGVkIGNvbXBvbmVudHMgd2lsbCBiZSBhZGRlZCB0byB0aGVcbi8vICAgIGRpcnR5X2NvbXBvbmVudHMgYXJyYXkgYW5kIHdpbGwgY2F1c2UgYSByZWVudHJhbnQgY2FsbCB0byBmbHVzaCgpLiBCZWNhdXNlXG4vLyAgICB0aGUgZmx1c2ggaW5kZXggaXMga2VwdCBvdXRzaWRlIHRoZSBmdW5jdGlvbiwgdGhlIHJlZW50cmFudCBjYWxsIHdpbGwgcGlja1xuLy8gICAgdXAgd2hlcmUgdGhlIGVhcmxpZXIgY2FsbCBsZWZ0IG9mZiBhbmQgZ28gdGhyb3VnaCBhbGwgZGlydHkgY29tcG9uZW50cy4gVGhlXG4vLyAgICBjdXJyZW50X2NvbXBvbmVudCB2YWx1ZSBpcyBzYXZlZCBhbmQgcmVzdG9yZWQgc28gdGhhdCB0aGUgcmVlbnRyYW50IGNhbGwgd2lsbFxuLy8gICAgbm90IGludGVyZmVyZSB3aXRoIHRoZSBcInBhcmVudFwiIGZsdXNoKCkgY2FsbC5cbi8vIDIuIGJpbmQ6dGhpcyBjYWxsYmFja3MgY2Fubm90IHRyaWdnZXIgbmV3IGZsdXNoKCkgY2FsbHMuXG4vLyAzLiBEdXJpbmcgYWZ0ZXJVcGRhdGUsIGFueSB1cGRhdGVkIGNvbXBvbmVudHMgd2lsbCBOT1QgaGF2ZSB0aGVpciBhZnRlclVwZGF0ZVxuLy8gICAgY2FsbGJhY2sgY2FsbGVkIGEgc2Vjb25kIHRpbWU7IHRoZSBzZWVuX2NhbGxiYWNrcyBzZXQsIG91dHNpZGUgdGhlIGZsdXNoKClcbi8vICAgIGZ1bmN0aW9uLCBndWFyYW50ZWVzIHRoaXMgYmVoYXZpb3IuXG5jb25zdCBzZWVuX2NhbGxiYWNrcyA9IG5ldyBTZXQoKTtcbmxldCBmbHVzaGlkeCA9IDA7IC8vIERvICpub3QqIG1vdmUgdGhpcyBpbnNpZGUgdGhlIGZsdXNoKCkgZnVuY3Rpb25cbmZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIGNvbnN0IHNhdmVkX2NvbXBvbmVudCA9IGN1cnJlbnRfY29tcG9uZW50O1xuICAgIGRvIHtcbiAgICAgICAgLy8gZmlyc3QsIGNhbGwgYmVmb3JlVXBkYXRlIGZ1bmN0aW9uc1xuICAgICAgICAvLyBhbmQgdXBkYXRlIGNvbXBvbmVudHNcbiAgICAgICAgd2hpbGUgKGZsdXNoaWR4IDwgZGlydHlfY29tcG9uZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGRpcnR5X2NvbXBvbmVudHNbZmx1c2hpZHhdO1xuICAgICAgICAgICAgZmx1c2hpZHgrKztcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGNvbXBvbmVudC4kJCk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICBkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCA9IDA7XG4gICAgICAgIGZsdXNoaWR4ID0gMDtcbiAgICAgICAgd2hpbGUgKGJpbmRpbmdfY2FsbGJhY2tzLmxlbmd0aClcbiAgICAgICAgICAgIGJpbmRpbmdfY2FsbGJhY2tzLnBvcCgpKCk7XG4gICAgICAgIC8vIHRoZW4sIG9uY2UgY29tcG9uZW50cyBhcmUgdXBkYXRlZCwgY2FsbFxuICAgICAgICAvLyBhZnRlclVwZGF0ZSBmdW5jdGlvbnMuIFRoaXMgbWF5IGNhdXNlXG4gICAgICAgIC8vIHN1YnNlcXVlbnQgdXBkYXRlcy4uLlxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlbmRlcl9jYWxsYmFja3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gcmVuZGVyX2NhbGxiYWNrc1tpXTtcbiAgICAgICAgICAgIGlmICghc2Vlbl9jYWxsYmFja3MuaGFzKGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgICAgIC8vIC4uLnNvIGd1YXJkIGFnYWluc3QgaW5maW5pdGUgbG9vcHNcbiAgICAgICAgICAgICAgICBzZWVuX2NhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyX2NhbGxiYWNrcy5sZW5ndGggPSAwO1xuICAgIH0gd2hpbGUgKGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoKTtcbiAgICB3aGlsZSAoZmx1c2hfY2FsbGJhY2tzLmxlbmd0aCkge1xuICAgICAgICBmbHVzaF9jYWxsYmFja3MucG9wKCkoKTtcbiAgICB9XG4gICAgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xuICAgIHNlZW5fY2FsbGJhY2tzLmNsZWFyKCk7XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHNhdmVkX2NvbXBvbmVudCk7XG59XG5mdW5jdGlvbiB1cGRhdGUoJCQpIHtcbiAgICBpZiAoJCQuZnJhZ21lbnQgIT09IG51bGwpIHtcbiAgICAgICAgJCQudXBkYXRlKCk7XG4gICAgICAgIHJ1bl9hbGwoJCQuYmVmb3JlX3VwZGF0ZSk7XG4gICAgICAgIGNvbnN0IGRpcnR5ID0gJCQuZGlydHk7XG4gICAgICAgICQkLmRpcnR5ID0gWy0xXTtcbiAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQucCgkJC5jdHgsIGRpcnR5KTtcbiAgICAgICAgJCQuYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG4gICAgfVxufVxuY29uc3Qgb3V0cm9pbmcgPSBuZXcgU2V0KCk7XG5sZXQgb3V0cm9zO1xuZnVuY3Rpb24gZ3JvdXBfb3V0cm9zKCkge1xuICAgIG91dHJvcyA9IHtcbiAgICAgICAgcjogMCxcbiAgICAgICAgYzogW10sXG4gICAgICAgIHA6IG91dHJvcyAvLyBwYXJlbnQgZ3JvdXBcbiAgICB9O1xufVxuZnVuY3Rpb24gY2hlY2tfb3V0cm9zKCkge1xuICAgIGlmICghb3V0cm9zLnIpIHtcbiAgICAgICAgcnVuX2FsbChvdXRyb3MuYyk7XG4gICAgfVxuICAgIG91dHJvcyA9IG91dHJvcy5wO1xufVxuZnVuY3Rpb24gdHJhbnNpdGlvbl9pbihibG9jaywgbG9jYWwpIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2suaSkge1xuICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICBibG9jay5pKGxvY2FsKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uX291dChibG9jaywgbG9jYWwsIGRldGFjaCwgY2FsbGJhY2spIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2subykge1xuICAgICAgICBpZiAob3V0cm9pbmcuaGFzKGJsb2NrKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgb3V0cm9pbmcuYWRkKGJsb2NrKTtcbiAgICAgICAgb3V0cm9zLmMucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRldGFjaClcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suZCgxKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYmxvY2subyhsb2NhbCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBiaW5kKGNvbXBvbmVudCwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICBjb25zdCBpbmRleCA9IGNvbXBvbmVudC4kJC5wcm9wc1tuYW1lXTtcbiAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb21wb25lbnQuJCQuYm91bmRbaW5kZXhdID0gY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudC4kJC5jdHhbaW5kZXhdKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjcmVhdGVfY29tcG9uZW50KGJsb2NrKSB7XG4gICAgYmxvY2sgJiYgYmxvY2suYygpO1xufVxuZnVuY3Rpb24gbW91bnRfY29tcG9uZW50KGNvbXBvbmVudCwgdGFyZ2V0LCBhbmNob3IsIGN1c3RvbUVsZW1lbnQpIHtcbiAgICBjb25zdCB7IGZyYWdtZW50LCBvbl9tb3VudCwgb25fZGVzdHJveSwgYWZ0ZXJfdXBkYXRlIH0gPSBjb21wb25lbnQuJCQ7XG4gICAgZnJhZ21lbnQgJiYgZnJhZ21lbnQubSh0YXJnZXQsIGFuY2hvcik7XG4gICAgaWYgKCFjdXN0b21FbGVtZW50KSB7XG4gICAgICAgIC8vIG9uTW91bnQgaGFwcGVucyBiZWZvcmUgdGhlIGluaXRpYWwgYWZ0ZXJVcGRhdGVcbiAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuZXdfb25fZGVzdHJveSA9IG9uX21vdW50Lm1hcChydW4pLmZpbHRlcihpc19mdW5jdGlvbik7XG4gICAgICAgICAgICBpZiAob25fZGVzdHJveSkge1xuICAgICAgICAgICAgICAgIG9uX2Rlc3Ryb3kucHVzaCguLi5uZXdfb25fZGVzdHJveSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBFZGdlIGNhc2UgLSBjb21wb25lbnQgd2FzIGRlc3Ryb3llZCBpbW1lZGlhdGVseSxcbiAgICAgICAgICAgICAgICAvLyBtb3N0IGxpa2VseSBhcyBhIHJlc3VsdCBvZiBhIGJpbmRpbmcgaW5pdGlhbGlzaW5nXG4gICAgICAgICAgICAgICAgcnVuX2FsbChuZXdfb25fZGVzdHJveSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb21wb25lbnQuJCQub25fbW91bnQgPSBbXTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFmdGVyX3VwZGF0ZS5mb3JFYWNoKGFkZF9yZW5kZXJfY2FsbGJhY2spO1xufVxuZnVuY3Rpb24gZGVzdHJveV9jb21wb25lbnQoY29tcG9uZW50LCBkZXRhY2hpbmcpIHtcbiAgICBjb25zdCAkJCA9IGNvbXBvbmVudC4kJDtcbiAgICBpZiAoJCQuZnJhZ21lbnQgIT09IG51bGwpIHtcbiAgICAgICAgcnVuX2FsbCgkJC5vbl9kZXN0cm95KTtcbiAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQuZChkZXRhY2hpbmcpO1xuICAgICAgICAvLyBUT0RPIG51bGwgb3V0IG90aGVyIHJlZnMsIGluY2x1ZGluZyBjb21wb25lbnQuJCQgKGJ1dCBuZWVkIHRvXG4gICAgICAgIC8vIHByZXNlcnZlIGZpbmFsIHN0YXRlPylcbiAgICAgICAgJCQub25fZGVzdHJveSA9ICQkLmZyYWdtZW50ID0gbnVsbDtcbiAgICAgICAgJCQuY3R4ID0gW107XG4gICAgfVxufVxuZnVuY3Rpb24gbWFrZV9kaXJ0eShjb21wb25lbnQsIGkpIHtcbiAgICBpZiAoY29tcG9uZW50LiQkLmRpcnR5WzBdID09PSAtMSkge1xuICAgICAgICBkaXJ0eV9jb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcbiAgICAgICAgc2NoZWR1bGVfdXBkYXRlKCk7XG4gICAgICAgIGNvbXBvbmVudC4kJC5kaXJ0eS5maWxsKDApO1xuICAgIH1cbiAgICBjb21wb25lbnQuJCQuZGlydHlbKGkgLyAzMSkgfCAwXSB8PSAoMSA8PCAoaSAlIDMxKSk7XG59XG5mdW5jdGlvbiBpbml0KGNvbXBvbmVudCwgb3B0aW9ucywgaW5zdGFuY2UsIGNyZWF0ZV9mcmFnbWVudCwgbm90X2VxdWFsLCBwcm9wcywgYXBwZW5kX3N0eWxlcywgZGlydHkgPSBbLTFdKSB7XG4gICAgY29uc3QgcGFyZW50X2NvbXBvbmVudCA9IGN1cnJlbnRfY29tcG9uZW50O1xuICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpO1xuICAgIGNvbnN0ICQkID0gY29tcG9uZW50LiQkID0ge1xuICAgICAgICBmcmFnbWVudDogbnVsbCxcbiAgICAgICAgY3R4OiBudWxsLFxuICAgICAgICAvLyBzdGF0ZVxuICAgICAgICBwcm9wcyxcbiAgICAgICAgdXBkYXRlOiBub29wLFxuICAgICAgICBub3RfZXF1YWwsXG4gICAgICAgIGJvdW5kOiBibGFua19vYmplY3QoKSxcbiAgICAgICAgLy8gbGlmZWN5Y2xlXG4gICAgICAgIG9uX21vdW50OiBbXSxcbiAgICAgICAgb25fZGVzdHJveTogW10sXG4gICAgICAgIG9uX2Rpc2Nvbm5lY3Q6IFtdLFxuICAgICAgICBiZWZvcmVfdXBkYXRlOiBbXSxcbiAgICAgICAgYWZ0ZXJfdXBkYXRlOiBbXSxcbiAgICAgICAgY29udGV4dDogbmV3IE1hcChvcHRpb25zLmNvbnRleHQgfHwgKHBhcmVudF9jb21wb25lbnQgPyBwYXJlbnRfY29tcG9uZW50LiQkLmNvbnRleHQgOiBbXSkpLFxuICAgICAgICAvLyBldmVyeXRoaW5nIGVsc2VcbiAgICAgICAgY2FsbGJhY2tzOiBibGFua19vYmplY3QoKSxcbiAgICAgICAgZGlydHksXG4gICAgICAgIHNraXBfYm91bmQ6IGZhbHNlLFxuICAgICAgICByb290OiBvcHRpb25zLnRhcmdldCB8fCBwYXJlbnRfY29tcG9uZW50LiQkLnJvb3RcbiAgICB9O1xuICAgIGFwcGVuZF9zdHlsZXMgJiYgYXBwZW5kX3N0eWxlcygkJC5yb290KTtcbiAgICBsZXQgcmVhZHkgPSBmYWxzZTtcbiAgICAkJC5jdHggPSBpbnN0YW5jZVxuICAgICAgICA/IGluc3RhbmNlKGNvbXBvbmVudCwgb3B0aW9ucy5wcm9wcyB8fCB7fSwgKGksIHJldCwgLi4ucmVzdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSByZXN0Lmxlbmd0aCA/IHJlc3RbMF0gOiByZXQ7XG4gICAgICAgICAgICBpZiAoJCQuY3R4ICYmIG5vdF9lcXVhbCgkJC5jdHhbaV0sICQkLmN0eFtpXSA9IHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGlmICghJCQuc2tpcF9ib3VuZCAmJiAkJC5ib3VuZFtpXSlcbiAgICAgICAgICAgICAgICAgICAgJCQuYm91bmRbaV0odmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChyZWFkeSlcbiAgICAgICAgICAgICAgICAgICAgbWFrZV9kaXJ0eShjb21wb25lbnQsIGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSlcbiAgICAgICAgOiBbXTtcbiAgICAkJC51cGRhdGUoKTtcbiAgICByZWFkeSA9IHRydWU7XG4gICAgcnVuX2FsbCgkJC5iZWZvcmVfdXBkYXRlKTtcbiAgICAvLyBgZmFsc2VgIGFzIGEgc3BlY2lhbCBjYXNlIG9mIG5vIERPTSBjb21wb25lbnRcbiAgICAkJC5mcmFnbWVudCA9IGNyZWF0ZV9mcmFnbWVudCA/IGNyZWF0ZV9mcmFnbWVudCgkJC5jdHgpIDogZmFsc2U7XG4gICAgaWYgKG9wdGlvbnMudGFyZ2V0KSB7XG4gICAgICAgIGlmIChvcHRpb25zLmh5ZHJhdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGVzID0gY2hpbGRyZW4ob3B0aW9ucy50YXJnZXQpO1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50Lmwobm9kZXMpO1xuICAgICAgICAgICAgbm9kZXMuZm9yRWFjaChkZXRhY2gpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmMoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5pbnRybylcbiAgICAgICAgICAgIHRyYW5zaXRpb25faW4oY29tcG9uZW50LiQkLmZyYWdtZW50KTtcbiAgICAgICAgbW91bnRfY29tcG9uZW50KGNvbXBvbmVudCwgb3B0aW9ucy50YXJnZXQsIG9wdGlvbnMuYW5jaG9yLCBvcHRpb25zLmN1c3RvbUVsZW1lbnQpO1xuICAgICAgICBmbHVzaCgpO1xuICAgIH1cbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG59XG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIFN2ZWx0ZSBjb21wb25lbnRzLiBVc2VkIHdoZW4gZGV2PWZhbHNlLlxuICovXG5jbGFzcyBTdmVsdGVDb21wb25lbnQge1xuICAgICRkZXN0cm95KCkge1xuICAgICAgICBkZXN0cm95X2NvbXBvbmVudCh0aGlzLCAxKTtcbiAgICAgICAgdGhpcy4kZGVzdHJveSA9IG5vb3A7XG4gICAgfVxuICAgICRvbih0eXBlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gfHwgKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdID0gW10pKTtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAkc2V0KCQkcHJvcHMpIHtcbiAgICAgICAgaWYgKHRoaXMuJCRzZXQgJiYgIWlzX2VtcHR5KCQkcHJvcHMpKSB7XG4gICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy4kJHNldCgkJHByb3BzKTtcbiAgICAgICAgICAgIHRoaXMuJCQuc2tpcF9ib3VuZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5jb25zdCBzdWJzY3JpYmVyX3F1ZXVlID0gW107XG4vKipcbiAqIENyZWF0ZSBhIGBXcml0YWJsZWAgc3RvcmUgdGhhdCBhbGxvd3MgYm90aCB1cGRhdGluZyBhbmQgcmVhZGluZyBieSBzdWJzY3JpcHRpb24uXG4gKiBAcGFyYW0geyo9fXZhbHVlIGluaXRpYWwgdmFsdWVcbiAqIEBwYXJhbSB7U3RhcnRTdG9wTm90aWZpZXI9fXN0YXJ0IHN0YXJ0IGFuZCBzdG9wIG5vdGlmaWNhdGlvbnMgZm9yIHN1YnNjcmlwdGlvbnNcbiAqL1xuZnVuY3Rpb24gd3JpdGFibGUodmFsdWUsIHN0YXJ0ID0gbm9vcCkge1xuICAgIGxldCBzdG9wO1xuICAgIGNvbnN0IHN1YnNjcmliZXJzID0gbmV3IFNldCgpO1xuICAgIGZ1bmN0aW9uIHNldChuZXdfdmFsdWUpIHtcbiAgICAgICAgaWYgKHNhZmVfbm90X2VxdWFsKHZhbHVlLCBuZXdfdmFsdWUpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG5ld192YWx1ZTtcbiAgICAgICAgICAgIGlmIChzdG9wKSB7IC8vIHN0b3JlIGlzIHJlYWR5XG4gICAgICAgICAgICAgICAgY29uc3QgcnVuX3F1ZXVlID0gIXN1YnNjcmliZXJfcXVldWUubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc3Vic2NyaWJlciBvZiBzdWJzY3JpYmVycykge1xuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyWzFdKCk7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJfcXVldWUucHVzaChzdWJzY3JpYmVyLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChydW5fcXVldWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyX3F1ZXVlW2ldWzBdKHN1YnNjcmliZXJfcXVldWVbaSArIDFdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVwZGF0ZShmbikge1xuICAgICAgICBzZXQoZm4odmFsdWUpKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc3Vic2NyaWJlKHJ1biwgaW52YWxpZGF0ZSA9IG5vb3ApIHtcbiAgICAgICAgY29uc3Qgc3Vic2NyaWJlciA9IFtydW4sIGludmFsaWRhdGVdO1xuICAgICAgICBzdWJzY3JpYmVycy5hZGQoc3Vic2NyaWJlcik7XG4gICAgICAgIGlmIChzdWJzY3JpYmVycy5zaXplID09PSAxKSB7XG4gICAgICAgICAgICBzdG9wID0gc3RhcnQoc2V0KSB8fCBub29wO1xuICAgICAgICB9XG4gICAgICAgIHJ1bih2YWx1ZSk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBzdWJzY3JpYmVycy5kZWxldGUoc3Vic2NyaWJlcik7XG4gICAgICAgICAgICBpZiAoc3Vic2NyaWJlcnMuc2l6ZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHN0b3AoKTtcbiAgICAgICAgICAgICAgICBzdG9wID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgc2V0LCB1cGRhdGUsIHN1YnNjcmliZSB9O1xufVxuXG5jb25zdCBpc0VkaXRpbmdRdWVzdGlvbiA9IHdyaXRhYmxlKGZhbHNlKTtcbmNvbnN0IHF1ZXN0aW9uc0Fjcm9zcyA9IHdyaXRhYmxlKFtdKTtcbmNvbnN0IHF1ZXN0aW9uc0Rvd24gPSB3cml0YWJsZShbXSk7XG5jb25zdCBjdXJyZW50RGlyZWN0aW9uID0gd3JpdGFibGUoXCJhY3Jvc3NcIik7XG5jb25zdCBjdXJyZW50UXVlc3Rpb24gPSB3cml0YWJsZSh7fSk7XG5cbi8qIHNyYy9NZW51LnN2ZWx0ZSBnZW5lcmF0ZWQgYnkgU3ZlbHRlIHYzLjQ2LjQgKi9cblxuZnVuY3Rpb24gY3JlYXRlX2ZyYWdtZW50JDcoY3R4KSB7XG5cdGxldCBtYWluO1xuXHRsZXQgbmF2O1xuXHRsZXQgZGl2O1xuXHRsZXQgaW5wdXQ7XG5cdGxldCB0MDtcblx0bGV0IHNwYW4wO1xuXHRsZXQgdDE7XG5cdGxldCBzcGFuMTtcblx0bGV0IHQyO1xuXHRsZXQgc3BhbjI7XG5cdGxldCB0Mztcblx0bGV0IHVsO1xuXHRsZXQgYTA7XG5cdGxldCB0NTtcblx0bGV0IGxpMTtcblx0bGV0IHQ2O1xuXHRsZXQgYTE7XG5cdGxldCBtb3VudGVkO1xuXHRsZXQgZGlzcG9zZTtcblxuXHRyZXR1cm4ge1xuXHRcdGMoKSB7XG5cdFx0XHRtYWluID0gZWxlbWVudChcIm1haW5cIik7XG5cdFx0XHRuYXYgPSBlbGVtZW50KFwibmF2XCIpO1xuXHRcdFx0ZGl2ID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdGlucHV0ID0gZWxlbWVudChcImlucHV0XCIpO1xuXHRcdFx0dDAgPSBzcGFjZSgpO1xuXHRcdFx0c3BhbjAgPSBlbGVtZW50KFwic3BhblwiKTtcblx0XHRcdHQxID0gc3BhY2UoKTtcblx0XHRcdHNwYW4xID0gZWxlbWVudChcInNwYW5cIik7XG5cdFx0XHR0MiA9IHNwYWNlKCk7XG5cdFx0XHRzcGFuMiA9IGVsZW1lbnQoXCJzcGFuXCIpO1xuXHRcdFx0dDMgPSBzcGFjZSgpO1xuXHRcdFx0dWwgPSBlbGVtZW50KFwidWxcIik7XG5cdFx0XHRhMCA9IGVsZW1lbnQoXCJhXCIpO1xuXHRcdFx0YTAuaW5uZXJIVE1MID0gYDxsaSBjbGFzcz1cInN2ZWx0ZS0xaGdpYnpnXCI+SW5zdHJ1Y3Rpb25zPC9saT5gO1xuXHRcdFx0dDUgPSBzcGFjZSgpO1xuXHRcdFx0bGkxID0gZWxlbWVudChcImxpXCIpO1xuXHRcdFx0bGkxLmlubmVySFRNTCA9IGA8aHIvPmA7XG5cdFx0XHR0NiA9IHNwYWNlKCk7XG5cdFx0XHRhMSA9IGVsZW1lbnQoXCJhXCIpO1xuXHRcdFx0YTEuaW5uZXJIVE1MID0gYDxsaSBjbGFzcz1cInN2ZWx0ZS0xaGdpYnpnXCI+UmVzZXQ8L2xpPmA7XG5cdFx0XHRhdHRyKGlucHV0LCBcInR5cGVcIiwgXCJjaGVja2JveFwiKTtcblx0XHRcdGF0dHIoaW5wdXQsIFwiY2xhc3NcIiwgXCJzdmVsdGUtMWhnaWJ6Z1wiKTtcblx0XHRcdGF0dHIoc3BhbjAsIFwiY2xhc3NcIiwgXCJqeHdvcmQtaGFtYmVyZGVyIHN2ZWx0ZS0xaGdpYnpnXCIpO1xuXHRcdFx0YXR0cihzcGFuMSwgXCJjbGFzc1wiLCBcImp4d29yZC1oYW1iZXJkZXIgc3ZlbHRlLTFoZ2liemdcIik7XG5cdFx0XHRhdHRyKHNwYW4yLCBcImNsYXNzXCIsIFwianh3b3JkLWhhbWJlcmRlciBzdmVsdGUtMWhnaWJ6Z1wiKTtcblx0XHRcdGF0dHIoYTAsIFwiaHJlZlwiLCBcImluc3RydWN0aW9uc1wiKTtcblx0XHRcdGF0dHIoYTAsIFwiY2xhc3NcIiwgXCJqeHdvcmQtYnV0dG9uIHN2ZWx0ZS0xaGdpYnpnXCIpO1xuXHRcdFx0YXR0cihsaTEsIFwiY2xhc3NcIiwgXCJqeHdvcmQtbWVudS1icmVhayBzdmVsdGUtMWhnaWJ6Z1wiKTtcblx0XHRcdGF0dHIoYTEsIFwiaHJlZlwiLCBcIiNcIik7XG5cdFx0XHRhdHRyKGExLCBcImNsYXNzXCIsIFwianh3b3JkLWJ1dHRvbiBzdmVsdGUtMWhnaWJ6Z1wiKTtcblx0XHRcdGF0dHIodWwsIFwiY2xhc3NcIiwgXCJqeHdvcmQtbWVudSBzdmVsdGUtMWhnaWJ6Z1wiKTtcblx0XHRcdGF0dHIoZGl2LCBcImNsYXNzXCIsIFwianh3b3JkLW1lbnUtdG9nZ2xlIHN2ZWx0ZS0xaGdpYnpnXCIpO1xuXHRcdFx0YXR0cihuYXYsIFwiY2xhc3NcIiwgXCJqeHdvcmQtY29udHJvbHNcIik7XG5cdFx0fSxcblx0XHRtKHRhcmdldCwgYW5jaG9yKSB7XG5cdFx0XHRpbnNlcnQodGFyZ2V0LCBtYWluLCBhbmNob3IpO1xuXHRcdFx0YXBwZW5kKG1haW4sIG5hdik7XG5cdFx0XHRhcHBlbmQobmF2LCBkaXYpO1xuXHRcdFx0YXBwZW5kKGRpdiwgaW5wdXQpO1xuXHRcdFx0aW5wdXQuY2hlY2tlZCA9IC8qc2hvd01lbnUqLyBjdHhbMF07XG5cdFx0XHRhcHBlbmQoZGl2LCB0MCk7XG5cdFx0XHRhcHBlbmQoZGl2LCBzcGFuMCk7XG5cdFx0XHRhcHBlbmQoZGl2LCB0MSk7XG5cdFx0XHRhcHBlbmQoZGl2LCBzcGFuMSk7XG5cdFx0XHRhcHBlbmQoZGl2LCB0Mik7XG5cdFx0XHRhcHBlbmQoZGl2LCBzcGFuMik7XG5cdFx0XHRhcHBlbmQoZGl2LCB0Myk7XG5cdFx0XHRhcHBlbmQoZGl2LCB1bCk7XG5cdFx0XHRhcHBlbmQodWwsIGEwKTtcblx0XHRcdGFwcGVuZCh1bCwgdDUpO1xuXHRcdFx0YXBwZW5kKHVsLCBsaTEpO1xuXHRcdFx0YXBwZW5kKHVsLCB0Nik7XG5cdFx0XHRhcHBlbmQodWwsIGExKTtcblxuXHRcdFx0aWYgKCFtb3VudGVkKSB7XG5cdFx0XHRcdGRpc3Bvc2UgPSBbXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0LCBcImNoYW5nZVwiLCAvKmlucHV0X2NoYW5nZV9oYW5kbGVyKi8gY3R4WzNdKSxcblx0XHRcdFx0XHRsaXN0ZW4oYTAsIFwiY2xpY2tcIiwgLypoYW5kbGVJbnN0cnVjdGlvbnMqLyBjdHhbMl0pLFxuXHRcdFx0XHRcdGxpc3RlbihhMSwgXCJjbGlja1wiLCAvKmhhbmRsZVJlc2V0Ki8gY3R4WzFdKVxuXHRcdFx0XHRdO1xuXG5cdFx0XHRcdG1vdW50ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cChjdHgsIFtkaXJ0eV0pIHtcblx0XHRcdGlmIChkaXJ0eSAmIC8qc2hvd01lbnUqLyAxKSB7XG5cdFx0XHRcdGlucHV0LmNoZWNrZWQgPSAvKnNob3dNZW51Ki8gY3R4WzBdO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0aTogbm9vcCxcblx0XHRvOiBub29wLFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2gobWFpbik7XG5cdFx0XHRtb3VudGVkID0gZmFsc2U7XG5cdFx0XHRydW5fYWxsKGRpc3Bvc2UpO1xuXHRcdH1cblx0fTtcbn1cblxuZnVuY3Rpb24gaW5zdGFuY2UkNygkJHNlbGYsICQkcHJvcHMsICQkaW52YWxpZGF0ZSkge1xuXHRjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpO1xuXHRsZXQgc2hvd01lbnUgPSBmYWxzZTtcblxuXHRmdW5jdGlvbiBoYW5kbGVSZXNldChlKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGRpc3BhdGNoKCdyZXNldCcpO1xuXHRcdCQkaW52YWxpZGF0ZSgwLCBzaG93TWVudSA9IGZhbHNlKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZUluc3RydWN0aW9ucyhlKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGRpc3BhdGNoKCdpbnN0cnVjdGlvbnMnKTtcblx0XHQkJGludmFsaWRhdGUoMCwgc2hvd01lbnUgPSBmYWxzZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBpbnB1dF9jaGFuZ2VfaGFuZGxlcigpIHtcblx0XHRzaG93TWVudSA9IHRoaXMuY2hlY2tlZDtcblx0XHQkJGludmFsaWRhdGUoMCwgc2hvd01lbnUpO1xuXHR9XG5cblx0cmV0dXJuIFtzaG93TWVudSwgaGFuZGxlUmVzZXQsIGhhbmRsZUluc3RydWN0aW9ucywgaW5wdXRfY2hhbmdlX2hhbmRsZXJdO1xufVxuXG5jbGFzcyBNZW51IGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50IHtcblx0Y29uc3RydWN0b3Iob3B0aW9ucykge1xuXHRcdHN1cGVyKCk7XG5cdFx0aW5pdCh0aGlzLCBvcHRpb25zLCBpbnN0YW5jZSQ3LCBjcmVhdGVfZnJhZ21lbnQkNywgc2FmZV9ub3RfZXF1YWwsIHt9KTtcblx0fVxufVxuXG52YXIgd29yZHMgPSBbXCJ0aGVcIixcIm9mXCIsXCJhbmRcIixcInRvXCIsXCJhXCIsXCJpblwiLFwiZm9yXCIsXCJpc1wiLFwib25cIixcInRoYXRcIixcImJ5XCIsXCJ0aGlzXCIsXCJ3aXRoXCIsXCJpXCIsXCJ5b3VcIixcIml0XCIsXCJub3RcIixcIm9yXCIsXCJiZVwiLFwiYXJlXCIsXCJmcm9tXCIsXCJhdFwiLFwiYXNcIixcInlvdXJcIixcImFsbFwiLFwiaGF2ZVwiLFwibmV3XCIsXCJtb3JlXCIsXCJhblwiLFwid2FzXCIsXCJ3ZVwiLFwid2lsbFwiLFwiaG9tZVwiLFwiY2FuXCIsXCJ1c1wiLFwiYWJvdXRcIixcImlmXCIsXCJwYWdlXCIsXCJteVwiLFwiaGFzXCIsXCJzZWFyY2hcIixcImZyZWVcIixcImJ1dFwiLFwib3VyXCIsXCJvbmVcIixcIm90aGVyXCIsXCJkb1wiLFwibm9cIixcImluZm9ybWF0aW9uXCIsXCJ0aW1lXCIsXCJ0aGV5XCIsXCJzaXRlXCIsXCJoZVwiLFwidXBcIixcIm1heVwiLFwid2hhdFwiLFwid2hpY2hcIixcInRoZWlyXCIsXCJuZXdzXCIsXCJvdXRcIixcInVzZVwiLFwiYW55XCIsXCJ0aGVyZVwiLFwic2VlXCIsXCJvbmx5XCIsXCJzb1wiLFwiaGlzXCIsXCJ3aGVuXCIsXCJjb250YWN0XCIsXCJoZXJlXCIsXCJidXNpbmVzc1wiLFwid2hvXCIsXCJ3ZWJcIixcImFsc29cIixcIm5vd1wiLFwiaGVscFwiLFwiZ2V0XCIsXCJwbVwiLFwidmlld1wiLFwib25saW5lXCIsXCJjXCIsXCJlXCIsXCJmaXJzdFwiLFwiYW1cIixcImJlZW5cIixcIndvdWxkXCIsXCJob3dcIixcIndlcmVcIixcIm1lXCIsXCJzXCIsXCJzZXJ2aWNlc1wiLFwic29tZVwiLFwidGhlc2VcIixcImNsaWNrXCIsXCJpdHNcIixcImxpa2VcIixcInNlcnZpY2VcIixcInhcIixcInRoYW5cIixcImZpbmRcIixcInByaWNlXCIsXCJkYXRlXCIsXCJiYWNrXCIsXCJ0b3BcIixcInBlb3BsZVwiLFwiaGFkXCIsXCJsaXN0XCIsXCJuYW1lXCIsXCJqdXN0XCIsXCJvdmVyXCIsXCJzdGF0ZVwiLFwieWVhclwiLFwiZGF5XCIsXCJpbnRvXCIsXCJlbWFpbFwiLFwidHdvXCIsXCJoZWFsdGhcIixcIm5cIixcIndvcmxkXCIsXCJyZVwiLFwibmV4dFwiLFwidXNlZFwiLFwiZ29cIixcImJcIixcIndvcmtcIixcImxhc3RcIixcIm1vc3RcIixcInByb2R1Y3RzXCIsXCJtdXNpY1wiLFwiYnV5XCIsXCJkYXRhXCIsXCJtYWtlXCIsXCJ0aGVtXCIsXCJzaG91bGRcIixcInByb2R1Y3RcIixcInN5c3RlbVwiLFwicG9zdFwiLFwiaGVyXCIsXCJjaXR5XCIsXCJ0XCIsXCJhZGRcIixcInBvbGljeVwiLFwibnVtYmVyXCIsXCJzdWNoXCIsXCJwbGVhc2VcIixcImF2YWlsYWJsZVwiLFwiY29weXJpZ2h0XCIsXCJzdXBwb3J0XCIsXCJtZXNzYWdlXCIsXCJhZnRlclwiLFwiYmVzdFwiLFwic29mdHdhcmVcIixcInRoZW5cIixcImphblwiLFwiZ29vZFwiLFwidmlkZW9cIixcIndlbGxcIixcImRcIixcIndoZXJlXCIsXCJpbmZvXCIsXCJyaWdodHNcIixcInB1YmxpY1wiLFwiYm9va3NcIixcImhpZ2hcIixcInNjaG9vbFwiLFwidGhyb3VnaFwiLFwibVwiLFwiZWFjaFwiLFwibGlua3NcIixcInNoZVwiLFwicmV2aWV3XCIsXCJ5ZWFyc1wiLFwib3JkZXJcIixcInZlcnlcIixcInByaXZhY3lcIixcImJvb2tcIixcIml0ZW1zXCIsXCJjb21wYW55XCIsXCJyXCIsXCJyZWFkXCIsXCJncm91cFwiLFwibmVlZFwiLFwibWFueVwiLFwidXNlclwiLFwic2FpZFwiLFwiZGVcIixcImRvZXNcIixcInNldFwiLFwidW5kZXJcIixcImdlbmVyYWxcIixcInJlc2VhcmNoXCIsXCJ1bml2ZXJzaXR5XCIsXCJqYW51YXJ5XCIsXCJtYWlsXCIsXCJmdWxsXCIsXCJtYXBcIixcInJldmlld3NcIixcInByb2dyYW1cIixcImxpZmVcIixcImtub3dcIixcImdhbWVzXCIsXCJ3YXlcIixcImRheXNcIixcIm1hbmFnZW1lbnRcIixcInBcIixcInBhcnRcIixcImNvdWxkXCIsXCJncmVhdFwiLFwidW5pdGVkXCIsXCJob3RlbFwiLFwicmVhbFwiLFwiZlwiLFwiaXRlbVwiLFwiaW50ZXJuYXRpb25hbFwiLFwiY2VudGVyXCIsXCJlYmF5XCIsXCJtdXN0XCIsXCJzdG9yZVwiLFwidHJhdmVsXCIsXCJjb21tZW50c1wiLFwibWFkZVwiLFwiZGV2ZWxvcG1lbnRcIixcInJlcG9ydFwiLFwib2ZmXCIsXCJtZW1iZXJcIixcImRldGFpbHNcIixcImxpbmVcIixcInRlcm1zXCIsXCJiZWZvcmVcIixcImhvdGVsc1wiLFwiZGlkXCIsXCJzZW5kXCIsXCJyaWdodFwiLFwidHlwZVwiLFwiYmVjYXVzZVwiLFwibG9jYWxcIixcInRob3NlXCIsXCJ1c2luZ1wiLFwicmVzdWx0c1wiLFwib2ZmaWNlXCIsXCJlZHVjYXRpb25cIixcIm5hdGlvbmFsXCIsXCJjYXJcIixcImRlc2lnblwiLFwidGFrZVwiLFwicG9zdGVkXCIsXCJpbnRlcm5ldFwiLFwiYWRkcmVzc1wiLFwiY29tbXVuaXR5XCIsXCJ3aXRoaW5cIixcInN0YXRlc1wiLFwiYXJlYVwiLFwid2FudFwiLFwicGhvbmVcIixcImR2ZFwiLFwic2hpcHBpbmdcIixcInJlc2VydmVkXCIsXCJzdWJqZWN0XCIsXCJiZXR3ZWVuXCIsXCJmb3J1bVwiLFwiZmFtaWx5XCIsXCJsXCIsXCJsb25nXCIsXCJiYXNlZFwiLFwid1wiLFwiY29kZVwiLFwic2hvd1wiLFwib1wiLFwiZXZlblwiLFwiYmxhY2tcIixcImNoZWNrXCIsXCJzcGVjaWFsXCIsXCJwcmljZXNcIixcIndlYnNpdGVcIixcImluZGV4XCIsXCJiZWluZ1wiLFwid29tZW5cIixcIm11Y2hcIixcInNpZ25cIixcImZpbGVcIixcImxpbmtcIixcIm9wZW5cIixcInRvZGF5XCIsXCJ0ZWNobm9sb2d5XCIsXCJzb3V0aFwiLFwiY2FzZVwiLFwicHJvamVjdFwiLFwic2FtZVwiLFwicGFnZXNcIixcInVrXCIsXCJ2ZXJzaW9uXCIsXCJzZWN0aW9uXCIsXCJvd25cIixcImZvdW5kXCIsXCJzcG9ydHNcIixcImhvdXNlXCIsXCJyZWxhdGVkXCIsXCJzZWN1cml0eVwiLFwiYm90aFwiLFwiZ1wiLFwiY291bnR5XCIsXCJhbWVyaWNhblwiLFwicGhvdG9cIixcImdhbWVcIixcIm1lbWJlcnNcIixcInBvd2VyXCIsXCJ3aGlsZVwiLFwiY2FyZVwiLFwibmV0d29ya1wiLFwiZG93blwiLFwiY29tcHV0ZXJcIixcInN5c3RlbXNcIixcInRocmVlXCIsXCJ0b3RhbFwiLFwicGxhY2VcIixcImVuZFwiLFwiZm9sbG93aW5nXCIsXCJkb3dubG9hZFwiLFwiaFwiLFwiaGltXCIsXCJ3aXRob3V0XCIsXCJwZXJcIixcImFjY2Vzc1wiLFwidGhpbmtcIixcIm5vcnRoXCIsXCJyZXNvdXJjZXNcIixcImN1cnJlbnRcIixcInBvc3RzXCIsXCJiaWdcIixcIm1lZGlhXCIsXCJsYXdcIixcImNvbnRyb2xcIixcIndhdGVyXCIsXCJoaXN0b3J5XCIsXCJwaWN0dXJlc1wiLFwic2l6ZVwiLFwiYXJ0XCIsXCJwZXJzb25hbFwiLFwic2luY2VcIixcImluY2x1ZGluZ1wiLFwiZ3VpZGVcIixcInNob3BcIixcImRpcmVjdG9yeVwiLFwiYm9hcmRcIixcImxvY2F0aW9uXCIsXCJjaGFuZ2VcIixcIndoaXRlXCIsXCJ0ZXh0XCIsXCJzbWFsbFwiLFwicmF0aW5nXCIsXCJyYXRlXCIsXCJnb3Zlcm5tZW50XCIsXCJjaGlsZHJlblwiLFwiZHVyaW5nXCIsXCJ1c2FcIixcInJldHVyblwiLFwic3R1ZGVudHNcIixcInZcIixcInNob3BwaW5nXCIsXCJhY2NvdW50XCIsXCJ0aW1lc1wiLFwic2l0ZXNcIixcImxldmVsXCIsXCJkaWdpdGFsXCIsXCJwcm9maWxlXCIsXCJwcmV2aW91c1wiLFwiZm9ybVwiLFwiZXZlbnRzXCIsXCJsb3ZlXCIsXCJvbGRcIixcImpvaG5cIixcIm1haW5cIixcImNhbGxcIixcImhvdXJzXCIsXCJpbWFnZVwiLFwiZGVwYXJ0bWVudFwiLFwidGl0bGVcIixcImRlc2NyaXB0aW9uXCIsXCJub25cIixcImtcIixcInlcIixcImluc3VyYW5jZVwiLFwiYW5vdGhlclwiLFwid2h5XCIsXCJzaGFsbFwiLFwicHJvcGVydHlcIixcImNsYXNzXCIsXCJjZFwiLFwic3RpbGxcIixcIm1vbmV5XCIsXCJxdWFsaXR5XCIsXCJldmVyeVwiLFwibGlzdGluZ1wiLFwiY29udGVudFwiLFwiY291bnRyeVwiLFwicHJpdmF0ZVwiLFwibGl0dGxlXCIsXCJ2aXNpdFwiLFwic2F2ZVwiLFwidG9vbHNcIixcImxvd1wiLFwicmVwbHlcIixcImN1c3RvbWVyXCIsXCJkZWNlbWJlclwiLFwiY29tcGFyZVwiLFwibW92aWVzXCIsXCJpbmNsdWRlXCIsXCJjb2xsZWdlXCIsXCJ2YWx1ZVwiLFwiYXJ0aWNsZVwiLFwieW9ya1wiLFwibWFuXCIsXCJjYXJkXCIsXCJqb2JzXCIsXCJwcm92aWRlXCIsXCJqXCIsXCJmb29kXCIsXCJzb3VyY2VcIixcImF1dGhvclwiLFwiZGlmZmVyZW50XCIsXCJwcmVzc1wiLFwidVwiLFwibGVhcm5cIixcInNhbGVcIixcImFyb3VuZFwiLFwicHJpbnRcIixcImNvdXJzZVwiLFwiam9iXCIsXCJjYW5hZGFcIixcInByb2Nlc3NcIixcInRlZW5cIixcInJvb21cIixcInN0b2NrXCIsXCJ0cmFpbmluZ1wiLFwidG9vXCIsXCJjcmVkaXRcIixcInBvaW50XCIsXCJqb2luXCIsXCJzY2llbmNlXCIsXCJtZW5cIixcImNhdGVnb3JpZXNcIixcImFkdmFuY2VkXCIsXCJ3ZXN0XCIsXCJzYWxlc1wiLFwibG9va1wiLFwiZW5nbGlzaFwiLFwibGVmdFwiLFwidGVhbVwiLFwiZXN0YXRlXCIsXCJib3hcIixcImNvbmRpdGlvbnNcIixcInNlbGVjdFwiLFwid2luZG93c1wiLFwicGhvdG9zXCIsXCJnYXlcIixcInRocmVhZFwiLFwid2Vla1wiLFwiY2F0ZWdvcnlcIixcIm5vdGVcIixcImxpdmVcIixcImxhcmdlXCIsXCJnYWxsZXJ5XCIsXCJ0YWJsZVwiLFwicmVnaXN0ZXJcIixcImhvd2V2ZXJcIixcImp1bmVcIixcIm9jdG9iZXJcIixcIm5vdmVtYmVyXCIsXCJtYXJrZXRcIixcImxpYnJhcnlcIixcInJlYWxseVwiLFwiYWN0aW9uXCIsXCJzdGFydFwiLFwic2VyaWVzXCIsXCJtb2RlbFwiLFwiZmVhdHVyZXNcIixcImFpclwiLFwiaW5kdXN0cnlcIixcInBsYW5cIixcImh1bWFuXCIsXCJwcm92aWRlZFwiLFwidHZcIixcInllc1wiLFwicmVxdWlyZWRcIixcInNlY29uZFwiLFwiaG90XCIsXCJhY2Nlc3Nvcmllc1wiLFwiY29zdFwiLFwibW92aWVcIixcImZvcnVtc1wiLFwibWFyY2hcIixcImxhXCIsXCJzZXB0ZW1iZXJcIixcImJldHRlclwiLFwic2F5XCIsXCJxdWVzdGlvbnNcIixcImp1bHlcIixcInlhaG9vXCIsXCJnb2luZ1wiLFwibWVkaWNhbFwiLFwidGVzdFwiLFwiZnJpZW5kXCIsXCJjb21lXCIsXCJkZWNcIixcInNlcnZlclwiLFwicGNcIixcInN0dWR5XCIsXCJhcHBsaWNhdGlvblwiLFwiY2FydFwiLFwic3RhZmZcIixcImFydGljbGVzXCIsXCJzYW5cIixcImZlZWRiYWNrXCIsXCJhZ2FpblwiLFwicGxheVwiLFwibG9va2luZ1wiLFwiaXNzdWVzXCIsXCJhcHJpbFwiLFwibmV2ZXJcIixcInVzZXJzXCIsXCJjb21wbGV0ZVwiLFwic3RyZWV0XCIsXCJ0b3BpY1wiLFwiY29tbWVudFwiLFwiZmluYW5jaWFsXCIsXCJ0aGluZ3NcIixcIndvcmtpbmdcIixcImFnYWluc3RcIixcInN0YW5kYXJkXCIsXCJ0YXhcIixcInBlcnNvblwiLFwiYmVsb3dcIixcIm1vYmlsZVwiLFwibGVzc1wiLFwiZ290XCIsXCJibG9nXCIsXCJwYXJ0eVwiLFwicGF5bWVudFwiLFwiZXF1aXBtZW50XCIsXCJsb2dpblwiLFwic3R1ZGVudFwiLFwibGV0XCIsXCJwcm9ncmFtc1wiLFwib2ZmZXJzXCIsXCJsZWdhbFwiLFwiYWJvdmVcIixcInJlY2VudFwiLFwicGFya1wiLFwic3RvcmVzXCIsXCJzaWRlXCIsXCJhY3RcIixcInByb2JsZW1cIixcInJlZFwiLFwiZ2l2ZVwiLFwibWVtb3J5XCIsXCJwZXJmb3JtYW5jZVwiLFwic29jaWFsXCIsXCJxXCIsXCJhdWd1c3RcIixcInF1b3RlXCIsXCJsYW5ndWFnZVwiLFwic3RvcnlcIixcInNlbGxcIixcIm9wdGlvbnNcIixcImV4cGVyaWVuY2VcIixcInJhdGVzXCIsXCJjcmVhdGVcIixcImtleVwiLFwiYm9keVwiLFwieW91bmdcIixcImFtZXJpY2FcIixcImltcG9ydGFudFwiLFwiZmllbGRcIixcImZld1wiLFwiZWFzdFwiLFwicGFwZXJcIixcInNpbmdsZVwiLFwiaWlcIixcImFnZVwiLFwiYWN0aXZpdGllc1wiLFwiY2x1YlwiLFwiZXhhbXBsZVwiLFwiZ2lybHNcIixcImFkZGl0aW9uYWxcIixcInBhc3N3b3JkXCIsXCJ6XCIsXCJsYXRlc3RcIixcInNvbWV0aGluZ1wiLFwicm9hZFwiLFwiZ2lmdFwiLFwicXVlc3Rpb25cIixcImNoYW5nZXNcIixcIm5pZ2h0XCIsXCJjYVwiLFwiaGFyZFwiLFwidGV4YXNcIixcIm9jdFwiLFwicGF5XCIsXCJmb3VyXCIsXCJwb2tlclwiLFwic3RhdHVzXCIsXCJicm93c2VcIixcImlzc3VlXCIsXCJyYW5nZVwiLFwiYnVpbGRpbmdcIixcInNlbGxlclwiLFwiY291cnRcIixcImZlYnJ1YXJ5XCIsXCJhbHdheXNcIixcInJlc3VsdFwiLFwiYXVkaW9cIixcImxpZ2h0XCIsXCJ3cml0ZVwiLFwid2FyXCIsXCJub3ZcIixcIm9mZmVyXCIsXCJibHVlXCIsXCJncm91cHNcIixcImFsXCIsXCJlYXN5XCIsXCJnaXZlblwiLFwiZmlsZXNcIixcImV2ZW50XCIsXCJyZWxlYXNlXCIsXCJhbmFseXNpc1wiLFwicmVxdWVzdFwiLFwiZmF4XCIsXCJjaGluYVwiLFwibWFraW5nXCIsXCJwaWN0dXJlXCIsXCJuZWVkc1wiLFwicG9zc2libGVcIixcIm1pZ2h0XCIsXCJwcm9mZXNzaW9uYWxcIixcInlldFwiLFwibW9udGhcIixcIm1ham9yXCIsXCJzdGFyXCIsXCJhcmVhc1wiLFwiZnV0dXJlXCIsXCJzcGFjZVwiLFwiY29tbWl0dGVlXCIsXCJoYW5kXCIsXCJzdW5cIixcImNhcmRzXCIsXCJwcm9ibGVtc1wiLFwibG9uZG9uXCIsXCJ3YXNoaW5ndG9uXCIsXCJtZWV0aW5nXCIsXCJyc3NcIixcImJlY29tZVwiLFwiaW50ZXJlc3RcIixcImlkXCIsXCJjaGlsZFwiLFwia2VlcFwiLFwiZW50ZXJcIixcImNhbGlmb3JuaWFcIixcInNoYXJlXCIsXCJzaW1pbGFyXCIsXCJnYXJkZW5cIixcInNjaG9vbHNcIixcIm1pbGxpb25cIixcImFkZGVkXCIsXCJyZWZlcmVuY2VcIixcImNvbXBhbmllc1wiLFwibGlzdGVkXCIsXCJiYWJ5XCIsXCJsZWFybmluZ1wiLFwiZW5lcmd5XCIsXCJydW5cIixcImRlbGl2ZXJ5XCIsXCJuZXRcIixcInBvcHVsYXJcIixcInRlcm1cIixcImZpbG1cIixcInN0b3JpZXNcIixcInB1dFwiLFwiY29tcHV0ZXJzXCIsXCJqb3VybmFsXCIsXCJyZXBvcnRzXCIsXCJjb1wiLFwidHJ5XCIsXCJ3ZWxjb21lXCIsXCJjZW50cmFsXCIsXCJpbWFnZXNcIixcInByZXNpZGVudFwiLFwibm90aWNlXCIsXCJvcmlnaW5hbFwiLFwiaGVhZFwiLFwicmFkaW9cIixcInVudGlsXCIsXCJjZWxsXCIsXCJjb2xvclwiLFwic2VsZlwiLFwiY291bmNpbFwiLFwiYXdheVwiLFwiaW5jbHVkZXNcIixcInRyYWNrXCIsXCJhdXN0cmFsaWFcIixcImRpc2N1c3Npb25cIixcImFyY2hpdmVcIixcIm9uY2VcIixcIm90aGVyc1wiLFwiZW50ZXJ0YWlubWVudFwiLFwiYWdyZWVtZW50XCIsXCJmb3JtYXRcIixcImxlYXN0XCIsXCJzb2NpZXR5XCIsXCJtb250aHNcIixcImxvZ1wiLFwic2FmZXR5XCIsXCJmcmllbmRzXCIsXCJzdXJlXCIsXCJmYXFcIixcInRyYWRlXCIsXCJlZGl0aW9uXCIsXCJjYXJzXCIsXCJtZXNzYWdlc1wiLFwibWFya2V0aW5nXCIsXCJ0ZWxsXCIsXCJmdXJ0aGVyXCIsXCJ1cGRhdGVkXCIsXCJhc3NvY2lhdGlvblwiLFwiYWJsZVwiLFwiaGF2aW5nXCIsXCJwcm92aWRlc1wiLFwiZGF2aWRcIixcImZ1blwiLFwiYWxyZWFkeVwiLFwiZ3JlZW5cIixcInN0dWRpZXNcIixcImNsb3NlXCIsXCJjb21tb25cIixcImRyaXZlXCIsXCJzcGVjaWZpY1wiLFwic2V2ZXJhbFwiLFwiZ29sZFwiLFwiZmViXCIsXCJsaXZpbmdcIixcInNlcFwiLFwiY29sbGVjdGlvblwiLFwiY2FsbGVkXCIsXCJzaG9ydFwiLFwiYXJ0c1wiLFwibG90XCIsXCJhc2tcIixcImRpc3BsYXlcIixcImxpbWl0ZWRcIixcInBvd2VyZWRcIixcInNvbHV0aW9uc1wiLFwibWVhbnNcIixcImRpcmVjdG9yXCIsXCJkYWlseVwiLFwiYmVhY2hcIixcInBhc3RcIixcIm5hdHVyYWxcIixcIndoZXRoZXJcIixcImR1ZVwiLFwiZXRcIixcImVsZWN0cm9uaWNzXCIsXCJmaXZlXCIsXCJ1cG9uXCIsXCJwZXJpb2RcIixcInBsYW5uaW5nXCIsXCJkYXRhYmFzZVwiLFwic2F5c1wiLFwib2ZmaWNpYWxcIixcIndlYXRoZXJcIixcIm1hclwiLFwibGFuZFwiLFwiYXZlcmFnZVwiLFwiZG9uZVwiLFwidGVjaG5pY2FsXCIsXCJ3aW5kb3dcIixcImZyYW5jZVwiLFwicHJvXCIsXCJyZWdpb25cIixcImlzbGFuZFwiLFwicmVjb3JkXCIsXCJkaXJlY3RcIixcIm1pY3Jvc29mdFwiLFwiY29uZmVyZW5jZVwiLFwiZW52aXJvbm1lbnRcIixcInJlY29yZHNcIixcInN0XCIsXCJkaXN0cmljdFwiLFwiY2FsZW5kYXJcIixcImNvc3RzXCIsXCJzdHlsZVwiLFwidXJsXCIsXCJmcm9udFwiLFwic3RhdGVtZW50XCIsXCJ1cGRhdGVcIixcInBhcnRzXCIsXCJhdWdcIixcImV2ZXJcIixcImRvd25sb2Fkc1wiLFwiZWFybHlcIixcIm1pbGVzXCIsXCJzb3VuZFwiLFwicmVzb3VyY2VcIixcInByZXNlbnRcIixcImFwcGxpY2F0aW9uc1wiLFwiZWl0aGVyXCIsXCJhZ29cIixcImRvY3VtZW50XCIsXCJ3b3JkXCIsXCJ3b3Jrc1wiLFwibWF0ZXJpYWxcIixcImJpbGxcIixcImFwclwiLFwid3JpdHRlblwiLFwidGFsa1wiLFwiZmVkZXJhbFwiLFwiaG9zdGluZ1wiLFwicnVsZXNcIixcImZpbmFsXCIsXCJhZHVsdFwiLFwidGlja2V0c1wiLFwidGhpbmdcIixcImNlbnRyZVwiLFwicmVxdWlyZW1lbnRzXCIsXCJ2aWFcIixcImNoZWFwXCIsXCJraWRzXCIsXCJmaW5hbmNlXCIsXCJ0cnVlXCIsXCJtaW51dGVzXCIsXCJlbHNlXCIsXCJtYXJrXCIsXCJ0aGlyZFwiLFwicm9ja1wiLFwiZ2lmdHNcIixcImV1cm9wZVwiLFwicmVhZGluZ1wiLFwidG9waWNzXCIsXCJiYWRcIixcImluZGl2aWR1YWxcIixcInRpcHNcIixcInBsdXNcIixcImF1dG9cIixcImNvdmVyXCIsXCJ1c3VhbGx5XCIsXCJlZGl0XCIsXCJ0b2dldGhlclwiLFwidmlkZW9zXCIsXCJwZXJjZW50XCIsXCJmYXN0XCIsXCJmdW5jdGlvblwiLFwiZmFjdFwiLFwidW5pdFwiLFwiZ2V0dGluZ1wiLFwiZ2xvYmFsXCIsXCJ0ZWNoXCIsXCJtZWV0XCIsXCJmYXJcIixcImVjb25vbWljXCIsXCJlblwiLFwicGxheWVyXCIsXCJwcm9qZWN0c1wiLFwibHlyaWNzXCIsXCJvZnRlblwiLFwic3Vic2NyaWJlXCIsXCJzdWJtaXRcIixcImdlcm1hbnlcIixcImFtb3VudFwiLFwid2F0Y2hcIixcImluY2x1ZGVkXCIsXCJmZWVsXCIsXCJ0aG91Z2hcIixcImJhbmtcIixcInJpc2tcIixcInRoYW5rc1wiLFwiZXZlcnl0aGluZ1wiLFwiZGVhbHNcIixcInZhcmlvdXNcIixcIndvcmRzXCIsXCJsaW51eFwiLFwianVsXCIsXCJwcm9kdWN0aW9uXCIsXCJjb21tZXJjaWFsXCIsXCJqYW1lc1wiLFwid2VpZ2h0XCIsXCJ0b3duXCIsXCJoZWFydFwiLFwiYWR2ZXJ0aXNpbmdcIixcInJlY2VpdmVkXCIsXCJjaG9vc2VcIixcInRyZWF0bWVudFwiLFwibmV3c2xldHRlclwiLFwiYXJjaGl2ZXNcIixcInBvaW50c1wiLFwia25vd2xlZGdlXCIsXCJtYWdhemluZVwiLFwiZXJyb3JcIixcImNhbWVyYVwiLFwianVuXCIsXCJnaXJsXCIsXCJjdXJyZW50bHlcIixcImNvbnN0cnVjdGlvblwiLFwidG95c1wiLFwicmVnaXN0ZXJlZFwiLFwiY2xlYXJcIixcImdvbGZcIixcInJlY2VpdmVcIixcImRvbWFpblwiLFwibWV0aG9kc1wiLFwiY2hhcHRlclwiLFwibWFrZXNcIixcInByb3RlY3Rpb25cIixcInBvbGljaWVzXCIsXCJsb2FuXCIsXCJ3aWRlXCIsXCJiZWF1dHlcIixcIm1hbmFnZXJcIixcImluZGlhXCIsXCJwb3NpdGlvblwiLFwidGFrZW5cIixcInNvcnRcIixcImxpc3RpbmdzXCIsXCJtb2RlbHNcIixcIm1pY2hhZWxcIixcImtub3duXCIsXCJoYWxmXCIsXCJjYXNlc1wiLFwic3RlcFwiLFwiZW5naW5lZXJpbmdcIixcImZsb3JpZGFcIixcInNpbXBsZVwiLFwicXVpY2tcIixcIm5vbmVcIixcIndpcmVsZXNzXCIsXCJsaWNlbnNlXCIsXCJwYXVsXCIsXCJmcmlkYXlcIixcImxha2VcIixcIndob2xlXCIsXCJhbm51YWxcIixcInB1Ymxpc2hlZFwiLFwibGF0ZXJcIixcImJhc2ljXCIsXCJzb255XCIsXCJzaG93c1wiLFwiY29ycG9yYXRlXCIsXCJnb29nbGVcIixcImNodXJjaFwiLFwibWV0aG9kXCIsXCJwdXJjaGFzZVwiLFwiY3VzdG9tZXJzXCIsXCJhY3RpdmVcIixcInJlc3BvbnNlXCIsXCJwcmFjdGljZVwiLFwiaGFyZHdhcmVcIixcImZpZ3VyZVwiLFwibWF0ZXJpYWxzXCIsXCJmaXJlXCIsXCJob2xpZGF5XCIsXCJjaGF0XCIsXCJlbm91Z2hcIixcImRlc2lnbmVkXCIsXCJhbG9uZ1wiLFwiYW1vbmdcIixcImRlYXRoXCIsXCJ3cml0aW5nXCIsXCJzcGVlZFwiLFwiaHRtbFwiLFwiY291bnRyaWVzXCIsXCJsb3NzXCIsXCJmYWNlXCIsXCJicmFuZFwiLFwiZGlzY291bnRcIixcImhpZ2hlclwiLFwiZWZmZWN0c1wiLFwiY3JlYXRlZFwiLFwicmVtZW1iZXJcIixcInN0YW5kYXJkc1wiLFwib2lsXCIsXCJiaXRcIixcInllbGxvd1wiLFwicG9saXRpY2FsXCIsXCJpbmNyZWFzZVwiLFwiYWR2ZXJ0aXNlXCIsXCJraW5nZG9tXCIsXCJiYXNlXCIsXCJuZWFyXCIsXCJlbnZpcm9ubWVudGFsXCIsXCJ0aG91Z2h0XCIsXCJzdHVmZlwiLFwiZnJlbmNoXCIsXCJzdG9yYWdlXCIsXCJvaFwiLFwiamFwYW5cIixcImRvaW5nXCIsXCJsb2Fuc1wiLFwic2hvZXNcIixcImVudHJ5XCIsXCJzdGF5XCIsXCJuYXR1cmVcIixcIm9yZGVyc1wiLFwiYXZhaWxhYmlsaXR5XCIsXCJhZnJpY2FcIixcInN1bW1hcnlcIixcInR1cm5cIixcIm1lYW5cIixcImdyb3d0aFwiLFwibm90ZXNcIixcImFnZW5jeVwiLFwia2luZ1wiLFwibW9uZGF5XCIsXCJldXJvcGVhblwiLFwiYWN0aXZpdHlcIixcImNvcHlcIixcImFsdGhvdWdoXCIsXCJkcnVnXCIsXCJwaWNzXCIsXCJ3ZXN0ZXJuXCIsXCJpbmNvbWVcIixcImZvcmNlXCIsXCJjYXNoXCIsXCJlbXBsb3ltZW50XCIsXCJvdmVyYWxsXCIsXCJiYXlcIixcInJpdmVyXCIsXCJjb21taXNzaW9uXCIsXCJhZFwiLFwicGFja2FnZVwiLFwiY29udGVudHNcIixcInNlZW5cIixcInBsYXllcnNcIixcImVuZ2luZVwiLFwicG9ydFwiLFwiYWxidW1cIixcInJlZ2lvbmFsXCIsXCJzdG9wXCIsXCJzdXBwbGllc1wiLFwic3RhcnRlZFwiLFwiYWRtaW5pc3RyYXRpb25cIixcImJhclwiLFwiaW5zdGl0dXRlXCIsXCJ2aWV3c1wiLFwicGxhbnNcIixcImRvdWJsZVwiLFwiZG9nXCIsXCJidWlsZFwiLFwic2NyZWVuXCIsXCJleGNoYW5nZVwiLFwidHlwZXNcIixcInNvb25cIixcInNwb25zb3JlZFwiLFwibGluZXNcIixcImVsZWN0cm9uaWNcIixcImNvbnRpbnVlXCIsXCJhY3Jvc3NcIixcImJlbmVmaXRzXCIsXCJuZWVkZWRcIixcInNlYXNvblwiLFwiYXBwbHlcIixcInNvbWVvbmVcIixcImhlbGRcIixcIm55XCIsXCJhbnl0aGluZ1wiLFwicHJpbnRlclwiLFwiY29uZGl0aW9uXCIsXCJlZmZlY3RpdmVcIixcImJlbGlldmVcIixcIm9yZ2FuaXphdGlvblwiLFwiZWZmZWN0XCIsXCJhc2tlZFwiLFwiZXVyXCIsXCJtaW5kXCIsXCJzdW5kYXlcIixcInNlbGVjdGlvblwiLFwiY2FzaW5vXCIsXCJwZGZcIixcImxvc3RcIixcInRvdXJcIixcIm1lbnVcIixcInZvbHVtZVwiLFwiY3Jvc3NcIixcImFueW9uZVwiLFwibW9ydGdhZ2VcIixcImhvcGVcIixcInNpbHZlclwiLFwiY29ycG9yYXRpb25cIixcIndpc2hcIixcImluc2lkZVwiLFwic29sdXRpb25cIixcIm1hdHVyZVwiLFwicm9sZVwiLFwicmF0aGVyXCIsXCJ3ZWVrc1wiLFwiYWRkaXRpb25cIixcImNhbWVcIixcInN1cHBseVwiLFwibm90aGluZ1wiLFwiY2VydGFpblwiLFwidXNyXCIsXCJleGVjdXRpdmVcIixcInJ1bm5pbmdcIixcImxvd2VyXCIsXCJuZWNlc3NhcnlcIixcInVuaW9uXCIsXCJqZXdlbHJ5XCIsXCJhY2NvcmRpbmdcIixcImRjXCIsXCJjbG90aGluZ1wiLFwibW9uXCIsXCJjb21cIixcInBhcnRpY3VsYXJcIixcImZpbmVcIixcIm5hbWVzXCIsXCJyb2JlcnRcIixcImhvbWVwYWdlXCIsXCJob3VyXCIsXCJnYXNcIixcInNraWxsc1wiLFwic2l4XCIsXCJidXNoXCIsXCJpc2xhbmRzXCIsXCJhZHZpY2VcIixcImNhcmVlclwiLFwibWlsaXRhcnlcIixcInJlbnRhbFwiLFwiZGVjaXNpb25cIixcImxlYXZlXCIsXCJicml0aXNoXCIsXCJ0ZWVuc1wiLFwicHJlXCIsXCJodWdlXCIsXCJzYXRcIixcIndvbWFuXCIsXCJmYWNpbGl0aWVzXCIsXCJ6aXBcIixcImJpZFwiLFwia2luZFwiLFwic2VsbGVyc1wiLFwibWlkZGxlXCIsXCJtb3ZlXCIsXCJjYWJsZVwiLFwib3Bwb3J0dW5pdGllc1wiLFwidGFraW5nXCIsXCJ2YWx1ZXNcIixcImRpdmlzaW9uXCIsXCJjb21pbmdcIixcInR1ZXNkYXlcIixcIm9iamVjdFwiLFwibGVzYmlhblwiLFwiYXBwcm9wcmlhdGVcIixcIm1hY2hpbmVcIixcImxvZ29cIixcImxlbmd0aFwiLFwiYWN0dWFsbHlcIixcIm5pY2VcIixcInNjb3JlXCIsXCJzdGF0aXN0aWNzXCIsXCJjbGllbnRcIixcIm9rXCIsXCJyZXR1cm5zXCIsXCJjYXBpdGFsXCIsXCJmb2xsb3dcIixcInNhbXBsZVwiLFwiaW52ZXN0bWVudFwiLFwic2VudFwiLFwic2hvd25cIixcInNhdHVyZGF5XCIsXCJjaHJpc3RtYXNcIixcImVuZ2xhbmRcIixcImN1bHR1cmVcIixcImJhbmRcIixcImZsYXNoXCIsXCJtc1wiLFwibGVhZFwiLFwiZ2VvcmdlXCIsXCJjaG9pY2VcIixcIndlbnRcIixcInN0YXJ0aW5nXCIsXCJyZWdpc3RyYXRpb25cIixcImZyaVwiLFwidGh1cnNkYXlcIixcImNvdXJzZXNcIixcImNvbnN1bWVyXCIsXCJoaVwiLFwiYWlycG9ydFwiLFwiZm9yZWlnblwiLFwiYXJ0aXN0XCIsXCJvdXRzaWRlXCIsXCJmdXJuaXR1cmVcIixcImxldmVsc1wiLFwiY2hhbm5lbFwiLFwibGV0dGVyXCIsXCJtb2RlXCIsXCJwaG9uZXNcIixcImlkZWFzXCIsXCJ3ZWRuZXNkYXlcIixcInN0cnVjdHVyZVwiLFwiZnVuZFwiLFwic3VtbWVyXCIsXCJhbGxvd1wiLFwiZGVncmVlXCIsXCJjb250cmFjdFwiLFwiYnV0dG9uXCIsXCJyZWxlYXNlc1wiLFwid2VkXCIsXCJob21lc1wiLFwic3VwZXJcIixcIm1hbGVcIixcIm1hdHRlclwiLFwiY3VzdG9tXCIsXCJ2aXJnaW5pYVwiLFwiYWxtb3N0XCIsXCJ0b29rXCIsXCJsb2NhdGVkXCIsXCJtdWx0aXBsZVwiLFwiYXNpYW5cIixcImRpc3RyaWJ1dGlvblwiLFwiZWRpdG9yXCIsXCJpbm5cIixcImluZHVzdHJpYWxcIixcImNhdXNlXCIsXCJwb3RlbnRpYWxcIixcInNvbmdcIixcImNuZXRcIixcImx0ZFwiLFwibG9zXCIsXCJocFwiLFwiZm9jdXNcIixcImxhdGVcIixcImZhbGxcIixcImZlYXR1cmVkXCIsXCJpZGVhXCIsXCJyb29tc1wiLFwiZmVtYWxlXCIsXCJyZXNwb25zaWJsZVwiLFwiaW5jXCIsXCJjb21tdW5pY2F0aW9uc1wiLFwid2luXCIsXCJhc3NvY2lhdGVkXCIsXCJ0aG9tYXNcIixcInByaW1hcnlcIixcImNhbmNlclwiLFwibnVtYmVyc1wiLFwicmVhc29uXCIsXCJ0b29sXCIsXCJicm93c2VyXCIsXCJzcHJpbmdcIixcImZvdW5kYXRpb25cIixcImFuc3dlclwiLFwidm9pY2VcIixcImVnXCIsXCJmcmllbmRseVwiLFwic2NoZWR1bGVcIixcImRvY3VtZW50c1wiLFwiY29tbXVuaWNhdGlvblwiLFwicHVycG9zZVwiLFwiZmVhdHVyZVwiLFwiYmVkXCIsXCJjb21lc1wiLFwicG9saWNlXCIsXCJldmVyeW9uZVwiLFwiaW5kZXBlbmRlbnRcIixcImlwXCIsXCJhcHByb2FjaFwiLFwiY2FtZXJhc1wiLFwiYnJvd25cIixcInBoeXNpY2FsXCIsXCJvcGVyYXRpbmdcIixcImhpbGxcIixcIm1hcHNcIixcIm1lZGljaW5lXCIsXCJkZWFsXCIsXCJob2xkXCIsXCJyYXRpbmdzXCIsXCJjaGljYWdvXCIsXCJmb3Jtc1wiLFwiZ2xhc3NcIixcImhhcHB5XCIsXCJ0dWVcIixcInNtaXRoXCIsXCJ3YW50ZWRcIixcImRldmVsb3BlZFwiLFwidGhhbmtcIixcInNhZmVcIixcInVuaXF1ZVwiLFwic3VydmV5XCIsXCJwcmlvclwiLFwidGVsZXBob25lXCIsXCJzcG9ydFwiLFwicmVhZHlcIixcImZlZWRcIixcImFuaW1hbFwiLFwic291cmNlc1wiLFwibWV4aWNvXCIsXCJwb3B1bGF0aW9uXCIsXCJwYVwiLFwicmVndWxhclwiLFwic2VjdXJlXCIsXCJuYXZpZ2F0aW9uXCIsXCJvcGVyYXRpb25zXCIsXCJ0aGVyZWZvcmVcIixcInNpbXBseVwiLFwiZXZpZGVuY2VcIixcInN0YXRpb25cIixcImNocmlzdGlhblwiLFwicm91bmRcIixcInBheXBhbFwiLFwiZmF2b3JpdGVcIixcInVuZGVyc3RhbmRcIixcIm9wdGlvblwiLFwibWFzdGVyXCIsXCJ2YWxsZXlcIixcInJlY2VudGx5XCIsXCJwcm9iYWJseVwiLFwidGh1XCIsXCJyZW50YWxzXCIsXCJzZWFcIixcImJ1aWx0XCIsXCJwdWJsaWNhdGlvbnNcIixcImJsb29kXCIsXCJjdXRcIixcIndvcmxkd2lkZVwiLFwiaW1wcm92ZVwiLFwiY29ubmVjdGlvblwiLFwicHVibGlzaGVyXCIsXCJoYWxsXCIsXCJsYXJnZXJcIixcImFudGlcIixcIm5ldHdvcmtzXCIsXCJlYXJ0aFwiLFwicGFyZW50c1wiLFwibm9raWFcIixcImltcGFjdFwiLFwidHJhbnNmZXJcIixcImludHJvZHVjdGlvblwiLFwia2l0Y2hlblwiLFwic3Ryb25nXCIsXCJ0ZWxcIixcImNhcm9saW5hXCIsXCJ3ZWRkaW5nXCIsXCJwcm9wZXJ0aWVzXCIsXCJob3NwaXRhbFwiLFwiZ3JvdW5kXCIsXCJvdmVydmlld1wiLFwic2hpcFwiLFwiYWNjb21tb2RhdGlvblwiLFwib3duZXJzXCIsXCJkaXNlYXNlXCIsXCJ0eFwiLFwiZXhjZWxsZW50XCIsXCJwYWlkXCIsXCJpdGFseVwiLFwicGVyZmVjdFwiLFwiaGFpclwiLFwib3Bwb3J0dW5pdHlcIixcImtpdFwiLFwiY2xhc3NpY1wiLFwiYmFzaXNcIixcImNvbW1hbmRcIixcImNpdGllc1wiLFwid2lsbGlhbVwiLFwiZXhwcmVzc1wiLFwiYXdhcmRcIixcImRpc3RhbmNlXCIsXCJ0cmVlXCIsXCJwZXRlclwiLFwiYXNzZXNzbWVudFwiLFwiZW5zdXJlXCIsXCJ0aHVzXCIsXCJ3YWxsXCIsXCJpZVwiLFwiaW52b2x2ZWRcIixcImVsXCIsXCJleHRyYVwiLFwiZXNwZWNpYWxseVwiLFwiaW50ZXJmYWNlXCIsXCJwYXJ0bmVyc1wiLFwiYnVkZ2V0XCIsXCJyYXRlZFwiLFwiZ3VpZGVzXCIsXCJzdWNjZXNzXCIsXCJtYXhpbXVtXCIsXCJtYVwiLFwib3BlcmF0aW9uXCIsXCJleGlzdGluZ1wiLFwicXVpdGVcIixcInNlbGVjdGVkXCIsXCJib3lcIixcImFtYXpvblwiLFwicGF0aWVudHNcIixcInJlc3RhdXJhbnRzXCIsXCJiZWF1dGlmdWxcIixcIndhcm5pbmdcIixcIndpbmVcIixcImxvY2F0aW9uc1wiLFwiaG9yc2VcIixcInZvdGVcIixcImZvcndhcmRcIixcImZsb3dlcnNcIixcInN0YXJzXCIsXCJzaWduaWZpY2FudFwiLFwibGlzdHNcIixcInRlY2hub2xvZ2llc1wiLFwib3duZXJcIixcInJldGFpbFwiLFwiYW5pbWFsc1wiLFwidXNlZnVsXCIsXCJkaXJlY3RseVwiLFwibWFudWZhY3R1cmVyXCIsXCJ3YXlzXCIsXCJlc3RcIixcInNvblwiLFwicHJvdmlkaW5nXCIsXCJydWxlXCIsXCJtYWNcIixcImhvdXNpbmdcIixcInRha2VzXCIsXCJpaWlcIixcImdtdFwiLFwiYnJpbmdcIixcImNhdGFsb2dcIixcInNlYXJjaGVzXCIsXCJtYXhcIixcInRyeWluZ1wiLFwibW90aGVyXCIsXCJhdXRob3JpdHlcIixcImNvbnNpZGVyZWRcIixcInRvbGRcIixcInhtbFwiLFwidHJhZmZpY1wiLFwicHJvZ3JhbW1lXCIsXCJqb2luZWRcIixcImlucHV0XCIsXCJzdHJhdGVneVwiLFwiZmVldFwiLFwiYWdlbnRcIixcInZhbGlkXCIsXCJiaW5cIixcIm1vZGVyblwiLFwic2VuaW9yXCIsXCJpcmVsYW5kXCIsXCJ0ZWFjaGluZ1wiLFwiZG9vclwiLFwiZ3JhbmRcIixcInRlc3RpbmdcIixcInRyaWFsXCIsXCJjaGFyZ2VcIixcInVuaXRzXCIsXCJpbnN0ZWFkXCIsXCJjYW5hZGlhblwiLFwiY29vbFwiLFwibm9ybWFsXCIsXCJ3cm90ZVwiLFwiZW50ZXJwcmlzZVwiLFwic2hpcHNcIixcImVudGlyZVwiLFwiZWR1Y2F0aW9uYWxcIixcIm1kXCIsXCJsZWFkaW5nXCIsXCJtZXRhbFwiLFwicG9zaXRpdmVcIixcImZsXCIsXCJmaXRuZXNzXCIsXCJjaGluZXNlXCIsXCJvcGluaW9uXCIsXCJtYlwiLFwiYXNpYVwiLFwiZm9vdGJhbGxcIixcImFic3RyYWN0XCIsXCJ1c2VzXCIsXCJvdXRwdXRcIixcImZ1bmRzXCIsXCJtclwiLFwiZ3JlYXRlclwiLFwibGlrZWx5XCIsXCJkZXZlbG9wXCIsXCJlbXBsb3llZXNcIixcImFydGlzdHNcIixcImFsdGVybmF0aXZlXCIsXCJwcm9jZXNzaW5nXCIsXCJyZXNwb25zaWJpbGl0eVwiLFwicmVzb2x1dGlvblwiLFwiamF2YVwiLFwiZ3Vlc3RcIixcInNlZW1zXCIsXCJwdWJsaWNhdGlvblwiLFwicGFzc1wiLFwicmVsYXRpb25zXCIsXCJ0cnVzdFwiLFwidmFuXCIsXCJjb250YWluc1wiLFwic2Vzc2lvblwiLFwibXVsdGlcIixcInBob3RvZ3JhcGh5XCIsXCJyZXB1YmxpY1wiLFwiZmVlc1wiLFwiY29tcG9uZW50c1wiLFwidmFjYXRpb25cIixcImNlbnR1cnlcIixcImFjYWRlbWljXCIsXCJhc3Npc3RhbmNlXCIsXCJjb21wbGV0ZWRcIixcInNraW5cIixcImdyYXBoaWNzXCIsXCJpbmRpYW5cIixcInByZXZcIixcImFkc1wiLFwibWFyeVwiLFwiaWxcIixcImV4cGVjdGVkXCIsXCJyaW5nXCIsXCJncmFkZVwiLFwiZGF0aW5nXCIsXCJwYWNpZmljXCIsXCJtb3VudGFpblwiLFwib3JnYW5pemF0aW9uc1wiLFwicG9wXCIsXCJmaWx0ZXJcIixcIm1haWxpbmdcIixcInZlaGljbGVcIixcImxvbmdlclwiLFwiY29uc2lkZXJcIixcImludFwiLFwibm9ydGhlcm5cIixcImJlaGluZFwiLFwicGFuZWxcIixcImZsb29yXCIsXCJnZXJtYW5cIixcImJ1eWluZ1wiLFwibWF0Y2hcIixcInByb3Bvc2VkXCIsXCJkZWZhdWx0XCIsXCJyZXF1aXJlXCIsXCJpcmFxXCIsXCJib3lzXCIsXCJvdXRkb29yXCIsXCJkZWVwXCIsXCJtb3JuaW5nXCIsXCJvdGhlcndpc2VcIixcImFsbG93c1wiLFwicmVzdFwiLFwicHJvdGVpblwiLFwicGxhbnRcIixcInJlcG9ydGVkXCIsXCJoaXRcIixcInRyYW5zcG9ydGF0aW9uXCIsXCJtbVwiLFwicG9vbFwiLFwibWluaVwiLFwicG9saXRpY3NcIixcInBhcnRuZXJcIixcImRpc2NsYWltZXJcIixcImF1dGhvcnNcIixcImJvYXJkc1wiLFwiZmFjdWx0eVwiLFwicGFydGllc1wiLFwiZmlzaFwiLFwibWVtYmVyc2hpcFwiLFwibWlzc2lvblwiLFwiZXllXCIsXCJzdHJpbmdcIixcInNlbnNlXCIsXCJtb2RpZmllZFwiLFwicGFja1wiLFwicmVsZWFzZWRcIixcInN0YWdlXCIsXCJpbnRlcm5hbFwiLFwiZ29vZHNcIixcInJlY29tbWVuZGVkXCIsXCJib3JuXCIsXCJ1bmxlc3NcIixcInJpY2hhcmRcIixcImRldGFpbGVkXCIsXCJqYXBhbmVzZVwiLFwicmFjZVwiLFwiYXBwcm92ZWRcIixcImJhY2tncm91bmRcIixcInRhcmdldFwiLFwiZXhjZXB0XCIsXCJjaGFyYWN0ZXJcIixcInVzYlwiLFwibWFpbnRlbmFuY2VcIixcImFiaWxpdHlcIixcIm1heWJlXCIsXCJmdW5jdGlvbnNcIixcImVkXCIsXCJtb3ZpbmdcIixcImJyYW5kc1wiLFwicGxhY2VzXCIsXCJwaHBcIixcInByZXR0eVwiLFwidHJhZGVtYXJrc1wiLFwicGhlbnRlcm1pbmVcIixcInNwYWluXCIsXCJzb3V0aGVyblwiLFwieW91cnNlbGZcIixcImV0Y1wiLFwid2ludGVyXCIsXCJiYXR0ZXJ5XCIsXCJ5b3V0aFwiLFwicHJlc3N1cmVcIixcInN1Ym1pdHRlZFwiLFwiYm9zdG9uXCIsXCJkZWJ0XCIsXCJrZXl3b3Jkc1wiLFwibWVkaXVtXCIsXCJ0ZWxldmlzaW9uXCIsXCJpbnRlcmVzdGVkXCIsXCJjb3JlXCIsXCJicmVha1wiLFwicHVycG9zZXNcIixcInRocm91Z2hvdXRcIixcInNldHNcIixcImRhbmNlXCIsXCJ3b29kXCIsXCJtc25cIixcIml0c2VsZlwiLFwiZGVmaW5lZFwiLFwicGFwZXJzXCIsXCJwbGF5aW5nXCIsXCJhd2FyZHNcIixcImZlZVwiLFwic3R1ZGlvXCIsXCJyZWFkZXJcIixcInZpcnR1YWxcIixcImRldmljZVwiLFwiZXN0YWJsaXNoZWRcIixcImFuc3dlcnNcIixcInJlbnRcIixcImxhc1wiLFwicmVtb3RlXCIsXCJkYXJrXCIsXCJwcm9ncmFtbWluZ1wiLFwiZXh0ZXJuYWxcIixcImFwcGxlXCIsXCJsZVwiLFwicmVnYXJkaW5nXCIsXCJpbnN0cnVjdGlvbnNcIixcIm1pblwiLFwib2ZmZXJlZFwiLFwidGhlb3J5XCIsXCJlbmpveVwiLFwicmVtb3ZlXCIsXCJhaWRcIixcInN1cmZhY2VcIixcIm1pbmltdW1cIixcInZpc3VhbFwiLFwiaG9zdFwiLFwidmFyaWV0eVwiLFwidGVhY2hlcnNcIixcImlzYm5cIixcIm1hcnRpblwiLFwibWFudWFsXCIsXCJibG9ja1wiLFwic3ViamVjdHNcIixcImFnZW50c1wiLFwiaW5jcmVhc2VkXCIsXCJyZXBhaXJcIixcImZhaXJcIixcImNpdmlsXCIsXCJzdGVlbFwiLFwidW5kZXJzdGFuZGluZ1wiLFwic29uZ3NcIixcImZpeGVkXCIsXCJ3cm9uZ1wiLFwiYmVnaW5uaW5nXCIsXCJoYW5kc1wiLFwiYXNzb2NpYXRlc1wiLFwiZmluYWxseVwiLFwiYXpcIixcInVwZGF0ZXNcIixcImRlc2t0b3BcIixcImNsYXNzZXNcIixcInBhcmlzXCIsXCJvaGlvXCIsXCJnZXRzXCIsXCJzZWN0b3JcIixcImNhcGFjaXR5XCIsXCJyZXF1aXJlc1wiLFwiamVyc2V5XCIsXCJ1blwiLFwiZmF0XCIsXCJmdWxseVwiLFwiZmF0aGVyXCIsXCJlbGVjdHJpY1wiLFwic2F3XCIsXCJpbnN0cnVtZW50c1wiLFwicXVvdGVzXCIsXCJvZmZpY2VyXCIsXCJkcml2ZXJcIixcImJ1c2luZXNzZXNcIixcImRlYWRcIixcInJlc3BlY3RcIixcInVua25vd25cIixcInNwZWNpZmllZFwiLFwicmVzdGF1cmFudFwiLFwibWlrZVwiLFwidHJpcFwiLFwicHN0XCIsXCJ3b3J0aFwiLFwibWlcIixcInByb2NlZHVyZXNcIixcInBvb3JcIixcInRlYWNoZXJcIixcImV5ZXNcIixcInJlbGF0aW9uc2hpcFwiLFwid29ya2Vyc1wiLFwiZmFybVwiLFwiZ2VvcmdpYVwiLFwicGVhY2VcIixcInRyYWRpdGlvbmFsXCIsXCJjYW1wdXNcIixcInRvbVwiLFwic2hvd2luZ1wiLFwiY3JlYXRpdmVcIixcImNvYXN0XCIsXCJiZW5lZml0XCIsXCJwcm9ncmVzc1wiLFwiZnVuZGluZ1wiLFwiZGV2aWNlc1wiLFwibG9yZFwiLFwiZ3JhbnRcIixcInN1YlwiLFwiYWdyZWVcIixcImZpY3Rpb25cIixcImhlYXJcIixcInNvbWV0aW1lc1wiLFwid2F0Y2hlc1wiLFwiY2FyZWVyc1wiLFwiYmV5b25kXCIsXCJnb2VzXCIsXCJmYW1pbGllc1wiLFwibGVkXCIsXCJtdXNldW1cIixcInRoZW1zZWx2ZXNcIixcImZhblwiLFwidHJhbnNwb3J0XCIsXCJpbnRlcmVzdGluZ1wiLFwiYmxvZ3NcIixcIndpZmVcIixcImV2YWx1YXRpb25cIixcImFjY2VwdGVkXCIsXCJmb3JtZXJcIixcImltcGxlbWVudGF0aW9uXCIsXCJ0ZW5cIixcImhpdHNcIixcInpvbmVcIixcImNvbXBsZXhcIixcInRoXCIsXCJjYXRcIixcImdhbGxlcmllc1wiLFwicmVmZXJlbmNlc1wiLFwiZGllXCIsXCJwcmVzZW50ZWRcIixcImphY2tcIixcImZsYXRcIixcImZsb3dcIixcImFnZW5jaWVzXCIsXCJsaXRlcmF0dXJlXCIsXCJyZXNwZWN0aXZlXCIsXCJwYXJlbnRcIixcInNwYW5pc2hcIixcIm1pY2hpZ2FuXCIsXCJjb2x1bWJpYVwiLFwic2V0dGluZ1wiLFwiZHJcIixcInNjYWxlXCIsXCJzdGFuZFwiLFwiZWNvbm9teVwiLFwiaGlnaGVzdFwiLFwiaGVscGZ1bFwiLFwibW9udGhseVwiLFwiY3JpdGljYWxcIixcImZyYW1lXCIsXCJtdXNpY2FsXCIsXCJkZWZpbml0aW9uXCIsXCJzZWNyZXRhcnlcIixcImFuZ2VsZXNcIixcIm5ldHdvcmtpbmdcIixcInBhdGhcIixcImF1c3RyYWxpYW5cIixcImVtcGxveWVlXCIsXCJjaGllZlwiLFwiZ2l2ZXNcIixcImtiXCIsXCJib3R0b21cIixcIm1hZ2F6aW5lc1wiLFwicGFja2FnZXNcIixcImRldGFpbFwiLFwiZnJhbmNpc2NvXCIsXCJsYXdzXCIsXCJjaGFuZ2VkXCIsXCJwZXRcIixcImhlYXJkXCIsXCJiZWdpblwiLFwiaW5kaXZpZHVhbHNcIixcImNvbG9yYWRvXCIsXCJyb3lhbFwiLFwiY2xlYW5cIixcInN3aXRjaFwiLFwicnVzc2lhblwiLFwibGFyZ2VzdFwiLFwiYWZyaWNhblwiLFwiZ3V5XCIsXCJ0aXRsZXNcIixcInJlbGV2YW50XCIsXCJndWlkZWxpbmVzXCIsXCJqdXN0aWNlXCIsXCJjb25uZWN0XCIsXCJiaWJsZVwiLFwiZGV2XCIsXCJjdXBcIixcImJhc2tldFwiLFwiYXBwbGllZFwiLFwid2Vla2x5XCIsXCJ2b2xcIixcImluc3RhbGxhdGlvblwiLFwiZGVzY3JpYmVkXCIsXCJkZW1hbmRcIixcInBwXCIsXCJzdWl0ZVwiLFwidmVnYXNcIixcIm5hXCIsXCJzcXVhcmVcIixcImNocmlzXCIsXCJhdHRlbnRpb25cIixcImFkdmFuY2VcIixcInNraXBcIixcImRpZXRcIixcImFybXlcIixcImF1Y3Rpb25cIixcImdlYXJcIixcImxlZVwiLFwib3NcIixcImRpZmZlcmVuY2VcIixcImFsbG93ZWRcIixcImNvcnJlY3RcIixcImNoYXJsZXNcIixcIm5hdGlvblwiLFwic2VsbGluZ1wiLFwibG90c1wiLFwicGllY2VcIixcInNoZWV0XCIsXCJmaXJtXCIsXCJzZXZlblwiLFwib2xkZXJcIixcImlsbGlub2lzXCIsXCJyZWd1bGF0aW9uc1wiLFwiZWxlbWVudHNcIixcInNwZWNpZXNcIixcImp1bXBcIixcImNlbGxzXCIsXCJtb2R1bGVcIixcInJlc29ydFwiLFwiZmFjaWxpdHlcIixcInJhbmRvbVwiLFwicHJpY2luZ1wiLFwiZHZkc1wiLFwiY2VydGlmaWNhdGVcIixcIm1pbmlzdGVyXCIsXCJtb3Rpb25cIixcImxvb2tzXCIsXCJmYXNoaW9uXCIsXCJkaXJlY3Rpb25zXCIsXCJ2aXNpdG9yc1wiLFwiZG9jdW1lbnRhdGlvblwiLFwibW9uaXRvclwiLFwidHJhZGluZ1wiLFwiZm9yZXN0XCIsXCJjYWxsc1wiLFwid2hvc2VcIixcImNvdmVyYWdlXCIsXCJjb3VwbGVcIixcImdpdmluZ1wiLFwiY2hhbmNlXCIsXCJ2aXNpb25cIixcImJhbGxcIixcImVuZGluZ1wiLFwiY2xpZW50c1wiLFwiYWN0aW9uc1wiLFwibGlzdGVuXCIsXCJkaXNjdXNzXCIsXCJhY2NlcHRcIixcImF1dG9tb3RpdmVcIixcIm5ha2VkXCIsXCJnb2FsXCIsXCJzdWNjZXNzZnVsXCIsXCJzb2xkXCIsXCJ3aW5kXCIsXCJjb21tdW5pdGllc1wiLFwiY2xpbmljYWxcIixcInNpdHVhdGlvblwiLFwic2NpZW5jZXNcIixcIm1hcmtldHNcIixcImxvd2VzdFwiLFwiaGlnaGx5XCIsXCJwdWJsaXNoaW5nXCIsXCJhcHBlYXJcIixcImVtZXJnZW5jeVwiLFwiZGV2ZWxvcGluZ1wiLFwibGl2ZXNcIixcImN1cnJlbmN5XCIsXCJsZWF0aGVyXCIsXCJkZXRlcm1pbmVcIixcInRlbXBlcmF0dXJlXCIsXCJwYWxtXCIsXCJhbm5vdW5jZW1lbnRzXCIsXCJwYXRpZW50XCIsXCJhY3R1YWxcIixcImhpc3RvcmljYWxcIixcInN0b25lXCIsXCJib2JcIixcImNvbW1lcmNlXCIsXCJyaW5ndG9uZXNcIixcInBlcmhhcHNcIixcInBlcnNvbnNcIixcImRpZmZpY3VsdFwiLFwic2NpZW50aWZpY1wiLFwic2F0ZWxsaXRlXCIsXCJmaXRcIixcInRlc3RzXCIsXCJ2aWxsYWdlXCIsXCJhY2NvdW50c1wiLFwiYW1hdGV1clwiLFwiZXhcIixcIm1ldFwiLFwicGFpblwiLFwieGJveFwiLFwicGFydGljdWxhcmx5XCIsXCJmYWN0b3JzXCIsXCJjb2ZmZWVcIixcInd3d1wiLFwic2V0dGluZ3NcIixcImJ1eWVyXCIsXCJjdWx0dXJhbFwiLFwic3RldmVcIixcImVhc2lseVwiLFwib3JhbFwiLFwiZm9yZFwiLFwicG9zdGVyXCIsXCJlZGdlXCIsXCJmdW5jdGlvbmFsXCIsXCJyb290XCIsXCJhdVwiLFwiZmlcIixcImNsb3NlZFwiLFwiaG9saWRheXNcIixcImljZVwiLFwicGlua1wiLFwiemVhbGFuZFwiLFwiYmFsYW5jZVwiLFwibW9uaXRvcmluZ1wiLFwiZ3JhZHVhdGVcIixcInJlcGxpZXNcIixcInNob3RcIixcIm5jXCIsXCJhcmNoaXRlY3R1cmVcIixcImluaXRpYWxcIixcImxhYmVsXCIsXCJ0aGlua2luZ1wiLFwic2NvdHRcIixcImxsY1wiLFwic2VjXCIsXCJyZWNvbW1lbmRcIixcImNhbm9uXCIsXCJsZWFndWVcIixcIndhc3RlXCIsXCJtaW51dGVcIixcImJ1c1wiLFwicHJvdmlkZXJcIixcIm9wdGlvbmFsXCIsXCJkaWN0aW9uYXJ5XCIsXCJjb2xkXCIsXCJhY2NvdW50aW5nXCIsXCJtYW51ZmFjdHVyaW5nXCIsXCJzZWN0aW9uc1wiLFwiY2hhaXJcIixcImZpc2hpbmdcIixcImVmZm9ydFwiLFwicGhhc2VcIixcImZpZWxkc1wiLFwiYmFnXCIsXCJmYW50YXN5XCIsXCJwb1wiLFwibGV0dGVyc1wiLFwibW90b3JcIixcInZhXCIsXCJwcm9mZXNzb3JcIixcImNvbnRleHRcIixcImluc3RhbGxcIixcInNoaXJ0XCIsXCJhcHBhcmVsXCIsXCJnZW5lcmFsbHlcIixcImNvbnRpbnVlZFwiLFwiZm9vdFwiLFwibWFzc1wiLFwiY3JpbWVcIixcImNvdW50XCIsXCJicmVhc3RcIixcInRlY2huaXF1ZXNcIixcImlibVwiLFwicmRcIixcImpvaG5zb25cIixcInNjXCIsXCJxdWlja2x5XCIsXCJkb2xsYXJzXCIsXCJ3ZWJzaXRlc1wiLFwicmVsaWdpb25cIixcImNsYWltXCIsXCJkcml2aW5nXCIsXCJwZXJtaXNzaW9uXCIsXCJzdXJnZXJ5XCIsXCJwYXRjaFwiLFwiaGVhdFwiLFwid2lsZFwiLFwibWVhc3VyZXNcIixcImdlbmVyYXRpb25cIixcImthbnNhc1wiLFwibWlzc1wiLFwiY2hlbWljYWxcIixcImRvY3RvclwiLFwidGFza1wiLFwicmVkdWNlXCIsXCJicm91Z2h0XCIsXCJoaW1zZWxmXCIsXCJub3JcIixcImNvbXBvbmVudFwiLFwiZW5hYmxlXCIsXCJleGVyY2lzZVwiLFwiYnVnXCIsXCJzYW50YVwiLFwibWlkXCIsXCJndWFyYW50ZWVcIixcImxlYWRlclwiLFwiZGlhbW9uZFwiLFwiaXNyYWVsXCIsXCJzZVwiLFwicHJvY2Vzc2VzXCIsXCJzb2Z0XCIsXCJzZXJ2ZXJzXCIsXCJhbG9uZVwiLFwibWVldGluZ3NcIixcInNlY29uZHNcIixcImpvbmVzXCIsXCJhcml6b25hXCIsXCJrZXl3b3JkXCIsXCJpbnRlcmVzdHNcIixcImZsaWdodFwiLFwiY29uZ3Jlc3NcIixcImZ1ZWxcIixcInVzZXJuYW1lXCIsXCJ3YWxrXCIsXCJwcm9kdWNlZFwiLFwiaXRhbGlhblwiLFwicGFwZXJiYWNrXCIsXCJjbGFzc2lmaWVkc1wiLFwid2FpdFwiLFwic3VwcG9ydGVkXCIsXCJwb2NrZXRcIixcInNhaW50XCIsXCJyb3NlXCIsXCJmcmVlZG9tXCIsXCJhcmd1bWVudFwiLFwiY29tcGV0aXRpb25cIixcImNyZWF0aW5nXCIsXCJqaW1cIixcImRydWdzXCIsXCJqb2ludFwiLFwicHJlbWl1bVwiLFwicHJvdmlkZXJzXCIsXCJmcmVzaFwiLFwiY2hhcmFjdGVyc1wiLFwiYXR0b3JuZXlcIixcInVwZ3JhZGVcIixcImRpXCIsXCJmYWN0b3JcIixcImdyb3dpbmdcIixcInRob3VzYW5kc1wiLFwia21cIixcInN0cmVhbVwiLFwiYXBhcnRtZW50c1wiLFwicGlja1wiLFwiaGVhcmluZ1wiLFwiZWFzdGVyblwiLFwiYXVjdGlvbnNcIixcInRoZXJhcHlcIixcImVudHJpZXNcIixcImRhdGVzXCIsXCJnZW5lcmF0ZWRcIixcInNpZ25lZFwiLFwidXBwZXJcIixcImFkbWluaXN0cmF0aXZlXCIsXCJzZXJpb3VzXCIsXCJwcmltZVwiLFwic2Ftc3VuZ1wiLFwibGltaXRcIixcImJlZ2FuXCIsXCJsb3Vpc1wiLFwic3RlcHNcIixcImVycm9yc1wiLFwic2hvcHNcIixcImRlbFwiLFwiZWZmb3J0c1wiLFwiaW5mb3JtZWRcIixcImdhXCIsXCJhY1wiLFwidGhvdWdodHNcIixcImNyZWVrXCIsXCJmdFwiLFwid29ya2VkXCIsXCJxdWFudGl0eVwiLFwidXJiYW5cIixcInByYWN0aWNlc1wiLFwic29ydGVkXCIsXCJyZXBvcnRpbmdcIixcImVzc2VudGlhbFwiLFwibXlzZWxmXCIsXCJ0b3Vyc1wiLFwicGxhdGZvcm1cIixcImxvYWRcIixcImFmZmlsaWF0ZVwiLFwibGFib3JcIixcImltbWVkaWF0ZWx5XCIsXCJhZG1pblwiLFwibnVyc2luZ1wiLFwiZGVmZW5zZVwiLFwibWFjaGluZXNcIixcImRlc2lnbmF0ZWRcIixcInRhZ3NcIixcImhlYXZ5XCIsXCJjb3ZlcmVkXCIsXCJyZWNvdmVyeVwiLFwiam9lXCIsXCJndXlzXCIsXCJpbnRlZ3JhdGVkXCIsXCJjb25maWd1cmF0aW9uXCIsXCJtZXJjaGFudFwiLFwiY29tcHJlaGVuc2l2ZVwiLFwiZXhwZXJ0XCIsXCJ1bml2ZXJzYWxcIixcInByb3RlY3RcIixcImRyb3BcIixcInNvbGlkXCIsXCJjZHNcIixcInByZXNlbnRhdGlvblwiLFwibGFuZ3VhZ2VzXCIsXCJiZWNhbWVcIixcIm9yYW5nZVwiLFwiY29tcGxpYW5jZVwiLFwidmVoaWNsZXNcIixcInByZXZlbnRcIixcInRoZW1lXCIsXCJyaWNoXCIsXCJpbVwiLFwiY2FtcGFpZ25cIixcIm1hcmluZVwiLFwiaW1wcm92ZW1lbnRcIixcInZzXCIsXCJndWl0YXJcIixcImZpbmRpbmdcIixcInBlbm5zeWx2YW5pYVwiLFwiZXhhbXBsZXNcIixcImlwb2RcIixcInNheWluZ1wiLFwic3Bpcml0XCIsXCJhclwiLFwiY2xhaW1zXCIsXCJjaGFsbGVuZ2VcIixcIm1vdG9yb2xhXCIsXCJhY2NlcHRhbmNlXCIsXCJzdHJhdGVnaWVzXCIsXCJtb1wiLFwic2VlbVwiLFwiYWZmYWlyc1wiLFwidG91Y2hcIixcImludGVuZGVkXCIsXCJ0b3dhcmRzXCIsXCJzYVwiLFwiZ29hbHNcIixcImhpcmVcIixcImVsZWN0aW9uXCIsXCJzdWdnZXN0XCIsXCJicmFuY2hcIixcImNoYXJnZXNcIixcInNlcnZlXCIsXCJhZmZpbGlhdGVzXCIsXCJyZWFzb25zXCIsXCJtYWdpY1wiLFwibW91bnRcIixcInNtYXJ0XCIsXCJ0YWxraW5nXCIsXCJnYXZlXCIsXCJvbmVzXCIsXCJsYXRpblwiLFwibXVsdGltZWRpYVwiLFwieHBcIixcImF2b2lkXCIsXCJjZXJ0aWZpZWRcIixcIm1hbmFnZVwiLFwiY29ybmVyXCIsXCJyYW5rXCIsXCJjb21wdXRpbmdcIixcIm9yZWdvblwiLFwiZWxlbWVudFwiLFwiYmlydGhcIixcInZpcnVzXCIsXCJhYnVzZVwiLFwiaW50ZXJhY3RpdmVcIixcInJlcXVlc3RzXCIsXCJzZXBhcmF0ZVwiLFwicXVhcnRlclwiLFwicHJvY2VkdXJlXCIsXCJsZWFkZXJzaGlwXCIsXCJ0YWJsZXNcIixcImRlZmluZVwiLFwicmFjaW5nXCIsXCJyZWxpZ2lvdXNcIixcImZhY3RzXCIsXCJicmVha2Zhc3RcIixcImtvbmdcIixcImNvbHVtblwiLFwicGxhbnRzXCIsXCJmYWl0aFwiLFwiY2hhaW5cIixcImRldmVsb3BlclwiLFwiaWRlbnRpZnlcIixcImF2ZW51ZVwiLFwibWlzc2luZ1wiLFwiZGllZFwiLFwiYXBwcm94aW1hdGVseVwiLFwiZG9tZXN0aWNcIixcInNpdGVtYXBcIixcInJlY29tbWVuZGF0aW9uc1wiLFwibW92ZWRcIixcImhvdXN0b25cIixcInJlYWNoXCIsXCJjb21wYXJpc29uXCIsXCJtZW50YWxcIixcInZpZXdlZFwiLFwibW9tZW50XCIsXCJleHRlbmRlZFwiLFwic2VxdWVuY2VcIixcImluY2hcIixcImF0dGFja1wiLFwic29ycnlcIixcImNlbnRlcnNcIixcIm9wZW5pbmdcIixcImRhbWFnZVwiLFwibGFiXCIsXCJyZXNlcnZlXCIsXCJyZWNpcGVzXCIsXCJjdnNcIixcImdhbW1hXCIsXCJwbGFzdGljXCIsXCJwcm9kdWNlXCIsXCJzbm93XCIsXCJwbGFjZWRcIixcInRydXRoXCIsXCJjb3VudGVyXCIsXCJmYWlsdXJlXCIsXCJmb2xsb3dzXCIsXCJldVwiLFwid2Vla2VuZFwiLFwiZG9sbGFyXCIsXCJjYW1wXCIsXCJvbnRhcmlvXCIsXCJhdXRvbWF0aWNhbGx5XCIsXCJkZXNcIixcIm1pbm5lc290YVwiLFwiZmlsbXNcIixcImJyaWRnZVwiLFwibmF0aXZlXCIsXCJmaWxsXCIsXCJ3aWxsaWFtc1wiLFwibW92ZW1lbnRcIixcInByaW50aW5nXCIsXCJiYXNlYmFsbFwiLFwib3duZWRcIixcImFwcHJvdmFsXCIsXCJkcmFmdFwiLFwiY2hhcnRcIixcInBsYXllZFwiLFwiY29udGFjdHNcIixcImNjXCIsXCJqZXN1c1wiLFwicmVhZGVyc1wiLFwiY2x1YnNcIixcImxjZFwiLFwid2FcIixcImphY2tzb25cIixcImVxdWFsXCIsXCJhZHZlbnR1cmVcIixcIm1hdGNoaW5nXCIsXCJvZmZlcmluZ1wiLFwic2hpcnRzXCIsXCJwcm9maXRcIixcImxlYWRlcnNcIixcInBvc3RlcnNcIixcImluc3RpdHV0aW9uc1wiLFwiYXNzaXN0YW50XCIsXCJ2YXJpYWJsZVwiLFwiYXZlXCIsXCJkalwiLFwiYWR2ZXJ0aXNlbWVudFwiLFwiZXhwZWN0XCIsXCJwYXJraW5nXCIsXCJoZWFkbGluZXNcIixcInllc3RlcmRheVwiLFwiY29tcGFyZWRcIixcImRldGVybWluZWRcIixcIndob2xlc2FsZVwiLFwid29ya3Nob3BcIixcInJ1c3NpYVwiLFwiZ29uZVwiLFwiY29kZXNcIixcImtpbmRzXCIsXCJleHRlbnNpb25cIixcInNlYXR0bGVcIixcInN0YXRlbWVudHNcIixcImdvbGRlblwiLFwiY29tcGxldGVseVwiLFwidGVhbXNcIixcImZvcnRcIixcImNtXCIsXCJ3aVwiLFwibGlnaHRpbmdcIixcInNlbmF0ZVwiLFwiZm9yY2VzXCIsXCJmdW5ueVwiLFwiYnJvdGhlclwiLFwiZ2VuZVwiLFwidHVybmVkXCIsXCJwb3J0YWJsZVwiLFwidHJpZWRcIixcImVsZWN0cmljYWxcIixcImFwcGxpY2FibGVcIixcImRpc2NcIixcInJldHVybmVkXCIsXCJwYXR0ZXJuXCIsXCJjdFwiLFwiYm9hdFwiLFwibmFtZWRcIixcInRoZWF0cmVcIixcImxhc2VyXCIsXCJlYXJsaWVyXCIsXCJtYW51ZmFjdHVyZXJzXCIsXCJzcG9uc29yXCIsXCJjbGFzc2ljYWxcIixcImljb25cIixcIndhcnJhbnR5XCIsXCJkZWRpY2F0ZWRcIixcImluZGlhbmFcIixcImRpcmVjdGlvblwiLFwiaGFycnlcIixcImJhc2tldGJhbGxcIixcIm9iamVjdHNcIixcImVuZHNcIixcImRlbGV0ZVwiLFwiZXZlbmluZ1wiLFwiYXNzZW1ibHlcIixcIm51Y2xlYXJcIixcInRheGVzXCIsXCJtb3VzZVwiLFwic2lnbmFsXCIsXCJjcmltaW5hbFwiLFwiaXNzdWVkXCIsXCJicmFpblwiLFwic2V4dWFsXCIsXCJ3aXNjb25zaW5cIixcInBvd2VyZnVsXCIsXCJkcmVhbVwiLFwib2J0YWluZWRcIixcImZhbHNlXCIsXCJkYVwiLFwiY2FzdFwiLFwiZmxvd2VyXCIsXCJmZWx0XCIsXCJwZXJzb25uZWxcIixcInBhc3NlZFwiLFwic3VwcGxpZWRcIixcImlkZW50aWZpZWRcIixcImZhbGxzXCIsXCJwaWNcIixcInNvdWxcIixcImFpZHNcIixcIm9waW5pb25zXCIsXCJwcm9tb3RlXCIsXCJzdGF0ZWRcIixcInN0YXRzXCIsXCJoYXdhaWlcIixcInByb2Zlc3Npb25hbHNcIixcImFwcGVhcnNcIixcImNhcnJ5XCIsXCJmbGFnXCIsXCJkZWNpZGVkXCIsXCJualwiLFwiY292ZXJzXCIsXCJoclwiLFwiZW1cIixcImFkdmFudGFnZVwiLFwiaGVsbG9cIixcImRlc2lnbnNcIixcIm1haW50YWluXCIsXCJ0b3VyaXNtXCIsXCJwcmlvcml0eVwiLFwibmV3c2xldHRlcnNcIixcImFkdWx0c1wiLFwiY2xpcHNcIixcInNhdmluZ3NcIixcIml2XCIsXCJncmFwaGljXCIsXCJhdG9tXCIsXCJwYXltZW50c1wiLFwicndcIixcImVzdGltYXRlZFwiLFwiYmluZGluZ1wiLFwiYnJpZWZcIixcImVuZGVkXCIsXCJ3aW5uaW5nXCIsXCJlaWdodFwiLFwiYW5vbnltb3VzXCIsXCJpcm9uXCIsXCJzdHJhaWdodFwiLFwic2NyaXB0XCIsXCJzZXJ2ZWRcIixcIndhbnRzXCIsXCJtaXNjZWxsYW5lb3VzXCIsXCJwcmVwYXJlZFwiLFwidm9pZFwiLFwiZGluaW5nXCIsXCJhbGVydFwiLFwiaW50ZWdyYXRpb25cIixcImF0bGFudGFcIixcImRha290YVwiLFwidGFnXCIsXCJpbnRlcnZpZXdcIixcIm1peFwiLFwiZnJhbWV3b3JrXCIsXCJkaXNrXCIsXCJpbnN0YWxsZWRcIixcInF1ZWVuXCIsXCJ2aHNcIixcImNyZWRpdHNcIixcImNsZWFybHlcIixcImZpeFwiLFwiaGFuZGxlXCIsXCJzd2VldFwiLFwiZGVza1wiLFwiY3JpdGVyaWFcIixcInB1Ym1lZFwiLFwiZGF2ZVwiLFwibWFzc2FjaHVzZXR0c1wiLFwiZGllZ29cIixcImhvbmdcIixcInZpY2VcIixcImFzc29jaWF0ZVwiLFwibmVcIixcInRydWNrXCIsXCJiZWhhdmlvclwiLFwiZW5sYXJnZVwiLFwicmF5XCIsXCJmcmVxdWVudGx5XCIsXCJyZXZlbnVlXCIsXCJtZWFzdXJlXCIsXCJjaGFuZ2luZ1wiLFwidm90ZXNcIixcImR1XCIsXCJkdXR5XCIsXCJsb29rZWRcIixcImRpc2N1c3Npb25zXCIsXCJiZWFyXCIsXCJnYWluXCIsXCJmZXN0aXZhbFwiLFwibGFib3JhdG9yeVwiLFwib2NlYW5cIixcImZsaWdodHNcIixcImV4cGVydHNcIixcInNpZ25zXCIsXCJsYWNrXCIsXCJkZXB0aFwiLFwiaW93YVwiLFwid2hhdGV2ZXJcIixcImxvZ2dlZFwiLFwibGFwdG9wXCIsXCJ2aW50YWdlXCIsXCJ0cmFpblwiLFwiZXhhY3RseVwiLFwiZHJ5XCIsXCJleHBsb3JlXCIsXCJtYXJ5bGFuZFwiLFwic3BhXCIsXCJjb25jZXB0XCIsXCJuZWFybHlcIixcImVsaWdpYmxlXCIsXCJjaGVja291dFwiLFwicmVhbGl0eVwiLFwiZm9yZ290XCIsXCJoYW5kbGluZ1wiLFwib3JpZ2luXCIsXCJrbmV3XCIsXCJnYW1pbmdcIixcImZlZWRzXCIsXCJiaWxsaW9uXCIsXCJkZXN0aW5hdGlvblwiLFwic2NvdGxhbmRcIixcImZhc3RlclwiLFwiaW50ZWxsaWdlbmNlXCIsXCJkYWxsYXNcIixcImJvdWdodFwiLFwiY29uXCIsXCJ1cHNcIixcIm5hdGlvbnNcIixcInJvdXRlXCIsXCJmb2xsb3dlZFwiLFwic3BlY2lmaWNhdGlvbnNcIixcImJyb2tlblwiLFwidHJpcGFkdmlzb3JcIixcImZyYW5rXCIsXCJhbGFza2FcIixcInpvb21cIixcImJsb3dcIixcImJhdHRsZVwiLFwicmVzaWRlbnRpYWxcIixcImFuaW1lXCIsXCJzcGVha1wiLFwiZGVjaXNpb25zXCIsXCJpbmR1c3RyaWVzXCIsXCJwcm90b2NvbFwiLFwicXVlcnlcIixcImNsaXBcIixcInBhcnRuZXJzaGlwXCIsXCJlZGl0b3JpYWxcIixcIm50XCIsXCJleHByZXNzaW9uXCIsXCJlc1wiLFwiZXF1aXR5XCIsXCJwcm92aXNpb25zXCIsXCJzcGVlY2hcIixcIndpcmVcIixcInByaW5jaXBsZXNcIixcInN1Z2dlc3Rpb25zXCIsXCJydXJhbFwiLFwic2hhcmVkXCIsXCJzb3VuZHNcIixcInJlcGxhY2VtZW50XCIsXCJ0YXBlXCIsXCJzdHJhdGVnaWNcIixcImp1ZGdlXCIsXCJzcGFtXCIsXCJlY29ub21pY3NcIixcImFjaWRcIixcImJ5dGVzXCIsXCJjZW50XCIsXCJmb3JjZWRcIixcImNvbXBhdGlibGVcIixcImZpZ2h0XCIsXCJhcGFydG1lbnRcIixcImhlaWdodFwiLFwibnVsbFwiLFwiemVyb1wiLFwic3BlYWtlclwiLFwiZmlsZWRcIixcImdiXCIsXCJuZXRoZXJsYW5kc1wiLFwib2J0YWluXCIsXCJiY1wiLFwiY29uc3VsdGluZ1wiLFwicmVjcmVhdGlvblwiLFwib2ZmaWNlc1wiLFwiZGVzaWduZXJcIixcInJlbWFpblwiLFwibWFuYWdlZFwiLFwicHJcIixcImZhaWxlZFwiLFwibWFycmlhZ2VcIixcInJvbGxcIixcImtvcmVhXCIsXCJiYW5rc1wiLFwiZnJcIixcInBhcnRpY2lwYW50c1wiLFwic2VjcmV0XCIsXCJiYXRoXCIsXCJhYVwiLFwia2VsbHlcIixcImxlYWRzXCIsXCJuZWdhdGl2ZVwiLFwiYXVzdGluXCIsXCJmYXZvcml0ZXNcIixcInRvcm9udG9cIixcInRoZWF0ZXJcIixcInNwcmluZ3NcIixcIm1pc3NvdXJpXCIsXCJhbmRyZXdcIixcInZhclwiLFwicGVyZm9ybVwiLFwiaGVhbHRoeVwiLFwidHJhbnNsYXRpb25cIixcImVzdGltYXRlc1wiLFwiZm9udFwiLFwiYXNzZXRzXCIsXCJpbmp1cnlcIixcIm10XCIsXCJqb3NlcGhcIixcIm1pbmlzdHJ5XCIsXCJkcml2ZXJzXCIsXCJsYXd5ZXJcIixcImZpZ3VyZXNcIixcIm1hcnJpZWRcIixcInByb3RlY3RlZFwiLFwicHJvcG9zYWxcIixcInNoYXJpbmdcIixcInBoaWxhZGVscGhpYVwiLFwicG9ydGFsXCIsXCJ3YWl0aW5nXCIsXCJiaXJ0aGRheVwiLFwiYmV0YVwiLFwiZmFpbFwiLFwiZ3JhdGlzXCIsXCJiYW5raW5nXCIsXCJvZmZpY2lhbHNcIixcImJyaWFuXCIsXCJ0b3dhcmRcIixcIndvblwiLFwic2xpZ2h0bHlcIixcImFzc2lzdFwiLFwiY29uZHVjdFwiLFwiY29udGFpbmVkXCIsXCJsaW5nZXJpZVwiLFwibGVnaXNsYXRpb25cIixcImNhbGxpbmdcIixcInBhcmFtZXRlcnNcIixcImphenpcIixcInNlcnZpbmdcIixcImJhZ3NcIixcInByb2ZpbGVzXCIsXCJtaWFtaVwiLFwiY29taWNzXCIsXCJtYXR0ZXJzXCIsXCJob3VzZXNcIixcImRvY1wiLFwicG9zdGFsXCIsXCJyZWxhdGlvbnNoaXBzXCIsXCJ0ZW5uZXNzZWVcIixcIndlYXJcIixcImNvbnRyb2xzXCIsXCJicmVha2luZ1wiLFwiY29tYmluZWRcIixcInVsdGltYXRlXCIsXCJ3YWxlc1wiLFwicmVwcmVzZW50YXRpdmVcIixcImZyZXF1ZW5jeVwiLFwiaW50cm9kdWNlZFwiLFwibWlub3JcIixcImZpbmlzaFwiLFwiZGVwYXJ0bWVudHNcIixcInJlc2lkZW50c1wiLFwibm90ZWRcIixcImRpc3BsYXllZFwiLFwibW9tXCIsXCJyZWR1Y2VkXCIsXCJwaHlzaWNzXCIsXCJyYXJlXCIsXCJzcGVudFwiLFwicGVyZm9ybWVkXCIsXCJleHRyZW1lXCIsXCJzYW1wbGVzXCIsXCJkYXZpc1wiLFwiZGFuaWVsXCIsXCJiYXJzXCIsXCJyZXZpZXdlZFwiLFwicm93XCIsXCJvelwiLFwiZm9yZWNhc3RcIixcInJlbW92ZWRcIixcImhlbHBzXCIsXCJzaW5nbGVzXCIsXCJhZG1pbmlzdHJhdG9yXCIsXCJjeWNsZVwiLFwiYW1vdW50c1wiLFwiY29udGFpblwiLFwiYWNjdXJhY3lcIixcImR1YWxcIixcInJpc2VcIixcInVzZFwiLFwic2xlZXBcIixcIm1nXCIsXCJiaXJkXCIsXCJwaGFybWFjeVwiLFwiYnJhemlsXCIsXCJjcmVhdGlvblwiLFwic3RhdGljXCIsXCJzY2VuZVwiLFwiaHVudGVyXCIsXCJhZGRyZXNzZXNcIixcImxhZHlcIixcImNyeXN0YWxcIixcImZhbW91c1wiLFwid3JpdGVyXCIsXCJjaGFpcm1hblwiLFwidmlvbGVuY2VcIixcImZhbnNcIixcIm9rbGFob21hXCIsXCJzcGVha2Vyc1wiLFwiZHJpbmtcIixcImFjYWRlbXlcIixcImR5bmFtaWNcIixcImdlbmRlclwiLFwiZWF0XCIsXCJwZXJtYW5lbnRcIixcImFncmljdWx0dXJlXCIsXCJkZWxsXCIsXCJjbGVhbmluZ1wiLFwiY29uc3RpdHV0ZXNcIixcInBvcnRmb2xpb1wiLFwicHJhY3RpY2FsXCIsXCJkZWxpdmVyZWRcIixcImNvbGxlY3RpYmxlc1wiLFwiaW5mcmFzdHJ1Y3R1cmVcIixcImV4Y2x1c2l2ZVwiLFwic2VhdFwiLFwiY29uY2VybnNcIixcImNvbG91clwiLFwidmVuZG9yXCIsXCJvcmlnaW5hbGx5XCIsXCJpbnRlbFwiLFwidXRpbGl0aWVzXCIsXCJwaGlsb3NvcGh5XCIsXCJyZWd1bGF0aW9uXCIsXCJvZmZpY2Vyc1wiLFwicmVkdWN0aW9uXCIsXCJhaW1cIixcImJpZHNcIixcInJlZmVycmVkXCIsXCJzdXBwb3J0c1wiLFwibnV0cml0aW9uXCIsXCJyZWNvcmRpbmdcIixcInJlZ2lvbnNcIixcImp1bmlvclwiLFwidG9sbFwiLFwibGVzXCIsXCJjYXBlXCIsXCJhbm5cIixcInJpbmdzXCIsXCJtZWFuaW5nXCIsXCJ0aXBcIixcInNlY29uZGFyeVwiLFwid29uZGVyZnVsXCIsXCJtaW5lXCIsXCJsYWRpZXNcIixcImhlbnJ5XCIsXCJ0aWNrZXRcIixcImFubm91bmNlZFwiLFwiZ3Vlc3NcIixcImFncmVlZFwiLFwicHJldmVudGlvblwiLFwid2hvbVwiLFwic2tpXCIsXCJzb2NjZXJcIixcIm1hdGhcIixcImltcG9ydFwiLFwicG9zdGluZ1wiLFwicHJlc2VuY2VcIixcImluc3RhbnRcIixcIm1lbnRpb25lZFwiLFwiYXV0b21hdGljXCIsXCJoZWFsdGhjYXJlXCIsXCJ2aWV3aW5nXCIsXCJtYWludGFpbmVkXCIsXCJjaFwiLFwiaW5jcmVhc2luZ1wiLFwibWFqb3JpdHlcIixcImNvbm5lY3RlZFwiLFwiY2hyaXN0XCIsXCJkYW5cIixcImRvZ3NcIixcInNkXCIsXCJkaXJlY3RvcnNcIixcImFzcGVjdHNcIixcImF1c3RyaWFcIixcImFoZWFkXCIsXCJtb29uXCIsXCJwYXJ0aWNpcGF0aW9uXCIsXCJzY2hlbWVcIixcInV0aWxpdHlcIixcInByZXZpZXdcIixcImZseVwiLFwibWFubmVyXCIsXCJtYXRyaXhcIixcImNvbnRhaW5pbmdcIixcImNvbWJpbmF0aW9uXCIsXCJkZXZlbFwiLFwiYW1lbmRtZW50XCIsXCJkZXNwaXRlXCIsXCJzdHJlbmd0aFwiLFwiZ3VhcmFudGVlZFwiLFwidHVya2V5XCIsXCJsaWJyYXJpZXNcIixcInByb3BlclwiLFwiZGlzdHJpYnV0ZWRcIixcImRlZ3JlZXNcIixcInNpbmdhcG9yZVwiLFwiZW50ZXJwcmlzZXNcIixcImRlbHRhXCIsXCJmZWFyXCIsXCJzZWVraW5nXCIsXCJpbmNoZXNcIixcInBob2VuaXhcIixcInJzXCIsXCJjb252ZW50aW9uXCIsXCJzaGFyZXNcIixcInByaW5jaXBhbFwiLFwiZGF1Z2h0ZXJcIixcInN0YW5kaW5nXCIsXCJjb21mb3J0XCIsXCJjb2xvcnNcIixcIndhcnNcIixcImNpc2NvXCIsXCJvcmRlcmluZ1wiLFwia2VwdFwiLFwiYWxwaGFcIixcImFwcGVhbFwiLFwiY3J1aXNlXCIsXCJib251c1wiLFwiY2VydGlmaWNhdGlvblwiLFwicHJldmlvdXNseVwiLFwiaGV5XCIsXCJib29rbWFya1wiLFwiYnVpbGRpbmdzXCIsXCJzcGVjaWFsc1wiLFwiYmVhdFwiLFwiZGlzbmV5XCIsXCJob3VzZWhvbGRcIixcImJhdHRlcmllc1wiLFwiYWRvYmVcIixcInNtb2tpbmdcIixcImJiY1wiLFwiYmVjb21lc1wiLFwiZHJpdmVzXCIsXCJhcm1zXCIsXCJhbGFiYW1hXCIsXCJ0ZWFcIixcImltcHJvdmVkXCIsXCJ0cmVlc1wiLFwiYXZnXCIsXCJhY2hpZXZlXCIsXCJwb3NpdGlvbnNcIixcImRyZXNzXCIsXCJzdWJzY3JpcHRpb25cIixcImRlYWxlclwiLFwiY29udGVtcG9yYXJ5XCIsXCJza3lcIixcInV0YWhcIixcIm5lYXJieVwiLFwicm9tXCIsXCJjYXJyaWVkXCIsXCJoYXBwZW5cIixcImV4cG9zdXJlXCIsXCJwYW5hc29uaWNcIixcImhpZGVcIixcInBlcm1hbGlua1wiLFwic2lnbmF0dXJlXCIsXCJnYW1ibGluZ1wiLFwicmVmZXJcIixcIm1pbGxlclwiLFwicHJvdmlzaW9uXCIsXCJvdXRkb29yc1wiLFwiY2xvdGhlc1wiLFwiY2F1c2VkXCIsXCJsdXh1cnlcIixcImJhYmVzXCIsXCJmcmFtZXNcIixcImNlcnRhaW5seVwiLFwiaW5kZWVkXCIsXCJuZXdzcGFwZXJcIixcInRveVwiLFwiY2lyY3VpdFwiLFwibGF5ZXJcIixcInByaW50ZWRcIixcInNsb3dcIixcInJlbW92YWxcIixcImVhc2llclwiLFwic3JjXCIsXCJsaWFiaWxpdHlcIixcInRyYWRlbWFya1wiLFwiaGlwXCIsXCJwcmludGVyc1wiLFwiZmFxc1wiLFwibmluZVwiLFwiYWRkaW5nXCIsXCJrZW50dWNreVwiLFwibW9zdGx5XCIsXCJlcmljXCIsXCJzcG90XCIsXCJ0YXlsb3JcIixcInRyYWNrYmFja1wiLFwicHJpbnRzXCIsXCJzcGVuZFwiLFwiZmFjdG9yeVwiLFwiaW50ZXJpb3JcIixcInJldmlzZWRcIixcImdyb3dcIixcImFtZXJpY2Fuc1wiLFwib3B0aWNhbFwiLFwicHJvbW90aW9uXCIsXCJyZWxhdGl2ZVwiLFwiYW1hemluZ1wiLFwiY2xvY2tcIixcImRvdFwiLFwiaGl2XCIsXCJpZGVudGl0eVwiLFwic3VpdGVzXCIsXCJjb252ZXJzaW9uXCIsXCJmZWVsaW5nXCIsXCJoaWRkZW5cIixcInJlYXNvbmFibGVcIixcInZpY3RvcmlhXCIsXCJzZXJpYWxcIixcInJlbGllZlwiLFwicmV2aXNpb25cIixcImJyb2FkYmFuZFwiLFwiaW5mbHVlbmNlXCIsXCJyYXRpb1wiLFwicGRhXCIsXCJpbXBvcnRhbmNlXCIsXCJyYWluXCIsXCJvbnRvXCIsXCJkc2xcIixcInBsYW5ldFwiLFwid2VibWFzdGVyXCIsXCJjb3BpZXNcIixcInJlY2lwZVwiLFwienVtXCIsXCJwZXJtaXRcIixcInNlZWluZ1wiLFwicHJvb2ZcIixcImRuYVwiLFwiZGlmZlwiLFwidGVubmlzXCIsXCJiYXNzXCIsXCJwcmVzY3JpcHRpb25cIixcImJlZHJvb21cIixcImVtcHR5XCIsXCJpbnN0YW5jZVwiLFwiaG9sZVwiLFwicGV0c1wiLFwicmlkZVwiLFwibGljZW5zZWRcIixcIm9ybGFuZG9cIixcInNwZWNpZmljYWxseVwiLFwidGltXCIsXCJidXJlYXVcIixcIm1haW5lXCIsXCJzcWxcIixcInJlcHJlc2VudFwiLFwiY29uc2VydmF0aW9uXCIsXCJwYWlyXCIsXCJpZGVhbFwiLFwic3BlY3NcIixcInJlY29yZGVkXCIsXCJkb25cIixcInBpZWNlc1wiLFwiZmluaXNoZWRcIixcInBhcmtzXCIsXCJkaW5uZXJcIixcImxhd3llcnNcIixcInN5ZG5leVwiLFwic3RyZXNzXCIsXCJjcmVhbVwiLFwic3NcIixcInJ1bnNcIixcInRyZW5kc1wiLFwieWVhaFwiLFwiZGlzY292ZXJcIixcImFwXCIsXCJwYXR0ZXJuc1wiLFwiYm94ZXNcIixcImxvdWlzaWFuYVwiLFwiaGlsbHNcIixcImphdmFzY3JpcHRcIixcImZvdXJ0aFwiLFwibm1cIixcImFkdmlzb3JcIixcIm1uXCIsXCJtYXJrZXRwbGFjZVwiLFwibmRcIixcImV2aWxcIixcImF3YXJlXCIsXCJ3aWxzb25cIixcInNoYXBlXCIsXCJldm9sdXRpb25cIixcImlyaXNoXCIsXCJjZXJ0aWZpY2F0ZXNcIixcIm9iamVjdGl2ZXNcIixcInN0YXRpb25zXCIsXCJzdWdnZXN0ZWRcIixcImdwc1wiLFwib3BcIixcInJlbWFpbnNcIixcImFjY1wiLFwiZ3JlYXRlc3RcIixcImZpcm1zXCIsXCJjb25jZXJuZWRcIixcImV1cm9cIixcIm9wZXJhdG9yXCIsXCJzdHJ1Y3R1cmVzXCIsXCJnZW5lcmljXCIsXCJlbmN5Y2xvcGVkaWFcIixcInVzYWdlXCIsXCJjYXBcIixcImlua1wiLFwiY2hhcnRzXCIsXCJjb250aW51aW5nXCIsXCJtaXhlZFwiLFwiY2Vuc3VzXCIsXCJpbnRlcnJhY2lhbFwiLFwicGVha1wiLFwidG5cIixcImNvbXBldGl0aXZlXCIsXCJleGlzdFwiLFwid2hlZWxcIixcInRyYW5zaXRcIixcInN1cHBsaWVyc1wiLFwic2FsdFwiLFwiY29tcGFjdFwiLFwicG9ldHJ5XCIsXCJsaWdodHNcIixcInRyYWNraW5nXCIsXCJhbmdlbFwiLFwiYmVsbFwiLFwia2VlcGluZ1wiLFwicHJlcGFyYXRpb25cIixcImF0dGVtcHRcIixcInJlY2VpdmluZ1wiLFwibWF0Y2hlc1wiLFwiYWNjb3JkYW5jZVwiLFwid2lkdGhcIixcIm5vaXNlXCIsXCJlbmdpbmVzXCIsXCJmb3JnZXRcIixcImFycmF5XCIsXCJkaXNjdXNzZWRcIixcImFjY3VyYXRlXCIsXCJzdGVwaGVuXCIsXCJlbGl6YWJldGhcIixcImNsaW1hdGVcIixcInJlc2VydmF0aW9uc1wiLFwicGluXCIsXCJwbGF5c3RhdGlvblwiLFwiYWxjb2hvbFwiLFwiZ3JlZWtcIixcImluc3RydWN0aW9uXCIsXCJtYW5hZ2luZ1wiLFwiYW5ub3RhdGlvblwiLFwic2lzdGVyXCIsXCJyYXdcIixcImRpZmZlcmVuY2VzXCIsXCJ3YWxraW5nXCIsXCJleHBsYWluXCIsXCJzbWFsbGVyXCIsXCJuZXdlc3RcIixcImVzdGFibGlzaFwiLFwiZ251XCIsXCJoYXBwZW5lZFwiLFwiZXhwcmVzc2VkXCIsXCJqZWZmXCIsXCJleHRlbnRcIixcInNoYXJwXCIsXCJsZXNiaWFuc1wiLFwiYmVuXCIsXCJsYW5lXCIsXCJwYXJhZ3JhcGhcIixcImtpbGxcIixcIm1hdGhlbWF0aWNzXCIsXCJhb2xcIixcImNvbXBlbnNhdGlvblwiLFwiY2VcIixcImV4cG9ydFwiLFwibWFuYWdlcnNcIixcImFpcmNyYWZ0XCIsXCJtb2R1bGVzXCIsXCJzd2VkZW5cIixcImNvbmZsaWN0XCIsXCJjb25kdWN0ZWRcIixcInZlcnNpb25zXCIsXCJlbXBsb3llclwiLFwib2NjdXJcIixcInBlcmNlbnRhZ2VcIixcImtub3dzXCIsXCJtaXNzaXNzaXBwaVwiLFwiZGVzY3JpYmVcIixcImNvbmNlcm5cIixcImJhY2t1cFwiLFwicmVxdWVzdGVkXCIsXCJjaXRpemVuc1wiLFwiY29ubmVjdGljdXRcIixcImhlcml0YWdlXCIsXCJwZXJzb25hbHNcIixcImltbWVkaWF0ZVwiLFwiaG9sZGluZ1wiLFwidHJvdWJsZVwiLFwic3ByZWFkXCIsXCJjb2FjaFwiLFwia2V2aW5cIixcImFncmljdWx0dXJhbFwiLFwiZXhwYW5kXCIsXCJzdXBwb3J0aW5nXCIsXCJhdWRpZW5jZVwiLFwiYXNzaWduZWRcIixcImpvcmRhblwiLFwiY29sbGVjdGlvbnNcIixcImFnZXNcIixcInBhcnRpY2lwYXRlXCIsXCJwbHVnXCIsXCJzcGVjaWFsaXN0XCIsXCJjb29rXCIsXCJhZmZlY3RcIixcInZpcmdpblwiLFwiZXhwZXJpZW5jZWRcIixcImludmVzdGlnYXRpb25cIixcInJhaXNlZFwiLFwiaGF0XCIsXCJpbnN0aXR1dGlvblwiLFwiZGlyZWN0ZWRcIixcImRlYWxlcnNcIixcInNlYXJjaGluZ1wiLFwic3BvcnRpbmdcIixcImhlbHBpbmdcIixcInBlcmxcIixcImFmZmVjdGVkXCIsXCJsaWJcIixcImJpa2VcIixcInRvdGFsbHlcIixcInBsYXRlXCIsXCJleHBlbnNlc1wiLFwiaW5kaWNhdGVcIixcImJsb25kZVwiLFwiYWJcIixcInByb2NlZWRpbmdzXCIsXCJmYXZvdXJpdGVcIixcInRyYW5zbWlzc2lvblwiLFwiYW5kZXJzb25cIixcInV0Y1wiLFwiY2hhcmFjdGVyaXN0aWNzXCIsXCJkZXJcIixcImxvc2VcIixcIm9yZ2FuaWNcIixcInNlZWtcIixcImV4cGVyaWVuY2VzXCIsXCJhbGJ1bXNcIixcImNoZWF0c1wiLFwiZXh0cmVtZWx5XCIsXCJ2ZXJ6ZWljaG5pc1wiLFwiY29udHJhY3RzXCIsXCJndWVzdHNcIixcImhvc3RlZFwiLFwiZGlzZWFzZXNcIixcImNvbmNlcm5pbmdcIixcImRldmVsb3BlcnNcIixcImVxdWl2YWxlbnRcIixcImNoZW1pc3RyeVwiLFwidG9ueVwiLFwibmVpZ2hib3Job29kXCIsXCJuZXZhZGFcIixcImtpdHNcIixcInRoYWlsYW5kXCIsXCJ2YXJpYWJsZXNcIixcImFnZW5kYVwiLFwiYW55d2F5XCIsXCJjb250aW51ZXNcIixcInRyYWNrc1wiLFwiYWR2aXNvcnlcIixcImNhbVwiLFwiY3VycmljdWx1bVwiLFwibG9naWNcIixcInRlbXBsYXRlXCIsXCJwcmluY2VcIixcImNpcmNsZVwiLFwic29pbFwiLFwiZ3JhbnRzXCIsXCJhbnl3aGVyZVwiLFwicHN5Y2hvbG9neVwiLFwicmVzcG9uc2VzXCIsXCJhdGxhbnRpY1wiLFwid2V0XCIsXCJjaXJjdW1zdGFuY2VzXCIsXCJlZHdhcmRcIixcImludmVzdG9yXCIsXCJpZGVudGlmaWNhdGlvblwiLFwicmFtXCIsXCJsZWF2aW5nXCIsXCJ3aWxkbGlmZVwiLFwiYXBwbGlhbmNlc1wiLFwibWF0dFwiLFwiZWxlbWVudGFyeVwiLFwiY29va2luZ1wiLFwic3BlYWtpbmdcIixcInNwb25zb3JzXCIsXCJmb3hcIixcInVubGltaXRlZFwiLFwicmVzcG9uZFwiLFwic2l6ZXNcIixcInBsYWluXCIsXCJleGl0XCIsXCJlbnRlcmVkXCIsXCJpcmFuXCIsXCJhcm1cIixcImtleXNcIixcImxhdW5jaFwiLFwid2F2ZVwiLFwiY2hlY2tpbmdcIixcImNvc3RhXCIsXCJiZWxnaXVtXCIsXCJwcmludGFibGVcIixcImhvbHlcIixcImFjdHNcIixcImd1aWRhbmNlXCIsXCJtZXNoXCIsXCJ0cmFpbFwiLFwiZW5mb3JjZW1lbnRcIixcInN5bWJvbFwiLFwiY3JhZnRzXCIsXCJoaWdod2F5XCIsXCJidWRkeVwiLFwiaGFyZGNvdmVyXCIsXCJvYnNlcnZlZFwiLFwiZGVhblwiLFwic2V0dXBcIixcInBvbGxcIixcImJvb2tpbmdcIixcImdsb3NzYXJ5XCIsXCJmaXNjYWxcIixcImNlbGVicml0eVwiLFwic3R5bGVzXCIsXCJkZW52ZXJcIixcInVuaXhcIixcImZpbGxlZFwiLFwiYm9uZFwiLFwiY2hhbm5lbHNcIixcImVyaWNzc29uXCIsXCJhcHBlbmRpeFwiLFwibm90aWZ5XCIsXCJibHVlc1wiLFwiY2hvY29sYXRlXCIsXCJwdWJcIixcInBvcnRpb25cIixcInNjb3BlXCIsXCJoYW1wc2hpcmVcIixcInN1cHBsaWVyXCIsXCJjYWJsZXNcIixcImNvdHRvblwiLFwiYmx1ZXRvb3RoXCIsXCJjb250cm9sbGVkXCIsXCJyZXF1aXJlbWVudFwiLFwiYXV0aG9yaXRpZXNcIixcImJpb2xvZ3lcIixcImRlbnRhbFwiLFwia2lsbGVkXCIsXCJib3JkZXJcIixcImFuY2llbnRcIixcImRlYmF0ZVwiLFwicmVwcmVzZW50YXRpdmVzXCIsXCJzdGFydHNcIixcInByZWduYW5jeVwiLFwiY2F1c2VzXCIsXCJhcmthbnNhc1wiLFwiYmlvZ3JhcGh5XCIsXCJsZWlzdXJlXCIsXCJhdHRyYWN0aW9uc1wiLFwibGVhcm5lZFwiLFwidHJhbnNhY3Rpb25zXCIsXCJub3RlYm9va1wiLFwiZXhwbG9yZXJcIixcImhpc3RvcmljXCIsXCJhdHRhY2hlZFwiLFwib3BlbmVkXCIsXCJ0bVwiLFwiaHVzYmFuZFwiLFwiZGlzYWJsZWRcIixcImF1dGhvcml6ZWRcIixcImNyYXp5XCIsXCJ1cGNvbWluZ1wiLFwiYnJpdGFpblwiLFwiY29uY2VydFwiLFwicmV0aXJlbWVudFwiLFwic2NvcmVzXCIsXCJmaW5hbmNpbmdcIixcImVmZmljaWVuY3lcIixcInNwXCIsXCJjb21lZHlcIixcImFkb3B0ZWRcIixcImVmZmljaWVudFwiLFwid2VibG9nXCIsXCJsaW5lYXJcIixcImNvbW1pdG1lbnRcIixcInNwZWNpYWx0eVwiLFwiYmVhcnNcIixcImplYW5cIixcImhvcFwiLFwiY2FycmllclwiLFwiZWRpdGVkXCIsXCJjb25zdGFudFwiLFwidmlzYVwiLFwibW91dGhcIixcImpld2lzaFwiLFwibWV0ZXJcIixcImxpbmtlZFwiLFwicG9ydGxhbmRcIixcImludGVydmlld3NcIixcImNvbmNlcHRzXCIsXCJuaFwiLFwiZ3VuXCIsXCJyZWZsZWN0XCIsXCJwdXJlXCIsXCJkZWxpdmVyXCIsXCJ3b25kZXJcIixcImxlc3NvbnNcIixcImZydWl0XCIsXCJiZWdpbnNcIixcInF1YWxpZmllZFwiLFwicmVmb3JtXCIsXCJsZW5zXCIsXCJhbGVydHNcIixcInRyZWF0ZWRcIixcImRpc2NvdmVyeVwiLFwiZHJhd1wiLFwibXlzcWxcIixcImNsYXNzaWZpZWRcIixcInJlbGF0aW5nXCIsXCJhc3N1bWVcIixcImNvbmZpZGVuY2VcIixcImFsbGlhbmNlXCIsXCJmbVwiLFwiY29uZmlybVwiLFwid2FybVwiLFwibmVpdGhlclwiLFwibGV3aXNcIixcImhvd2FyZFwiLFwib2ZmbGluZVwiLFwibGVhdmVzXCIsXCJlbmdpbmVlclwiLFwibGlmZXN0eWxlXCIsXCJjb25zaXN0ZW50XCIsXCJyZXBsYWNlXCIsXCJjbGVhcmFuY2VcIixcImNvbm5lY3Rpb25zXCIsXCJpbnZlbnRvcnlcIixcImNvbnZlcnRlclwiLFwib3JnYW5pc2F0aW9uXCIsXCJiYWJlXCIsXCJjaGVja3NcIixcInJlYWNoZWRcIixcImJlY29taW5nXCIsXCJzYWZhcmlcIixcIm9iamVjdGl2ZVwiLFwiaW5kaWNhdGVkXCIsXCJzdWdhclwiLFwiY3Jld1wiLFwibGVnc1wiLFwic2FtXCIsXCJzdGlja1wiLFwic2VjdXJpdGllc1wiLFwiYWxsZW5cIixcInBkdFwiLFwicmVsYXRpb25cIixcImVuYWJsZWRcIixcImdlbnJlXCIsXCJzbGlkZVwiLFwibW9udGFuYVwiLFwidm9sdW50ZWVyXCIsXCJ0ZXN0ZWRcIixcInJlYXJcIixcImRlbW9jcmF0aWNcIixcImVuaGFuY2VcIixcInN3aXR6ZXJsYW5kXCIsXCJleGFjdFwiLFwiYm91bmRcIixcInBhcmFtZXRlclwiLFwiYWRhcHRlclwiLFwicHJvY2Vzc29yXCIsXCJub2RlXCIsXCJmb3JtYWxcIixcImRpbWVuc2lvbnNcIixcImNvbnRyaWJ1dGVcIixcImxvY2tcIixcImhvY2tleVwiLFwic3Rvcm1cIixcIm1pY3JvXCIsXCJjb2xsZWdlc1wiLFwibGFwdG9wc1wiLFwibWlsZVwiLFwic2hvd2VkXCIsXCJjaGFsbGVuZ2VzXCIsXCJlZGl0b3JzXCIsXCJtZW5zXCIsXCJ0aHJlYWRzXCIsXCJib3dsXCIsXCJzdXByZW1lXCIsXCJicm90aGVyc1wiLFwicmVjb2duaXRpb25cIixcInByZXNlbnRzXCIsXCJyZWZcIixcInRhbmtcIixcInN1Ym1pc3Npb25cIixcImRvbGxzXCIsXCJlc3RpbWF0ZVwiLFwiZW5jb3VyYWdlXCIsXCJuYXZ5XCIsXCJraWRcIixcInJlZ3VsYXRvcnlcIixcImluc3BlY3Rpb25cIixcImNvbnN1bWVyc1wiLFwiY2FuY2VsXCIsXCJsaW1pdHNcIixcInRlcnJpdG9yeVwiLFwidHJhbnNhY3Rpb25cIixcIm1hbmNoZXN0ZXJcIixcIndlYXBvbnNcIixcInBhaW50XCIsXCJkZWxheVwiLFwicGlsb3RcIixcIm91dGxldFwiLFwiY29udHJpYnV0aW9uc1wiLFwiY29udGludW91c1wiLFwiZGJcIixcImN6ZWNoXCIsXCJyZXN1bHRpbmdcIixcImNhbWJyaWRnZVwiLFwiaW5pdGlhdGl2ZVwiLFwibm92ZWxcIixcInBhblwiLFwiZXhlY3V0aW9uXCIsXCJkaXNhYmlsaXR5XCIsXCJpbmNyZWFzZXNcIixcInVsdHJhXCIsXCJ3aW5uZXJcIixcImlkYWhvXCIsXCJjb250cmFjdG9yXCIsXCJwaFwiLFwiZXBpc29kZVwiLFwiZXhhbWluYXRpb25cIixcInBvdHRlclwiLFwiZGlzaFwiLFwicGxheXNcIixcImJ1bGxldGluXCIsXCJpYVwiLFwicHRcIixcImluZGljYXRlc1wiLFwibW9kaWZ5XCIsXCJveGZvcmRcIixcImFkYW1cIixcInRydWx5XCIsXCJlcGluaW9uc1wiLFwicGFpbnRpbmdcIixcImNvbW1pdHRlZFwiLFwiZXh0ZW5zaXZlXCIsXCJhZmZvcmRhYmxlXCIsXCJ1bml2ZXJzZVwiLFwiY2FuZGlkYXRlXCIsXCJkYXRhYmFzZXNcIixcInBhdGVudFwiLFwic2xvdFwiLFwicHNwXCIsXCJvdXRzdGFuZGluZ1wiLFwiaGFcIixcImVhdGluZ1wiLFwicGVyc3BlY3RpdmVcIixcInBsYW5uZWRcIixcIndhdGNoaW5nXCIsXCJsb2RnZVwiLFwibWVzc2VuZ2VyXCIsXCJtaXJyb3JcIixcInRvdXJuYW1lbnRcIixcImNvbnNpZGVyYXRpb25cIixcImRzXCIsXCJkaXNjb3VudHNcIixcInN0ZXJsaW5nXCIsXCJzZXNzaW9uc1wiLFwia2VybmVsXCIsXCJzdG9ja3NcIixcImJ1eWVyc1wiLFwiam91cm5hbHNcIixcImdyYXlcIixcImNhdGFsb2d1ZVwiLFwiZWFcIixcImplbm5pZmVyXCIsXCJhbnRvbmlvXCIsXCJjaGFyZ2VkXCIsXCJicm9hZFwiLFwidGFpd2FuXCIsXCJ1bmRcIixcImNob3NlblwiLFwiZGVtb1wiLFwiZ3JlZWNlXCIsXCJsZ1wiLFwic3dpc3NcIixcInNhcmFoXCIsXCJjbGFya1wiLFwibGFib3VyXCIsXCJoYXRlXCIsXCJ0ZXJtaW5hbFwiLFwicHVibGlzaGVyc1wiLFwibmlnaHRzXCIsXCJiZWhhbGZcIixcImNhcmliYmVhblwiLFwibGlxdWlkXCIsXCJyaWNlXCIsXCJuZWJyYXNrYVwiLFwibG9vcFwiLFwic2FsYXJ5XCIsXCJyZXNlcnZhdGlvblwiLFwiZm9vZHNcIixcImdvdXJtZXRcIixcImd1YXJkXCIsXCJwcm9wZXJseVwiLFwib3JsZWFuc1wiLFwic2F2aW5nXCIsXCJuZmxcIixcInJlbWFpbmluZ1wiLFwiZW1waXJlXCIsXCJyZXN1bWVcIixcInR3ZW50eVwiLFwibmV3bHlcIixcInJhaXNlXCIsXCJwcmVwYXJlXCIsXCJhdmF0YXJcIixcImdhcnlcIixcImRlcGVuZGluZ1wiLFwiaWxsZWdhbFwiLFwiZXhwYW5zaW9uXCIsXCJ2YXJ5XCIsXCJodW5kcmVkc1wiLFwicm9tZVwiLFwiYXJhYlwiLFwibGluY29sblwiLFwiaGVscGVkXCIsXCJwcmVtaWVyXCIsXCJ0b21vcnJvd1wiLFwicHVyY2hhc2VkXCIsXCJtaWxrXCIsXCJkZWNpZGVcIixcImNvbnNlbnRcIixcImRyYW1hXCIsXCJ2aXNpdGluZ1wiLFwicGVyZm9ybWluZ1wiLFwiZG93bnRvd25cIixcImtleWJvYXJkXCIsXCJjb250ZXN0XCIsXCJjb2xsZWN0ZWRcIixcIm53XCIsXCJiYW5kc1wiLFwiYm9vdFwiLFwic3VpdGFibGVcIixcImZmXCIsXCJhYnNvbHV0ZWx5XCIsXCJtaWxsaW9uc1wiLFwibHVuY2hcIixcImF1ZGl0XCIsXCJwdXNoXCIsXCJjaGFtYmVyXCIsXCJndWluZWFcIixcImZpbmRpbmdzXCIsXCJtdXNjbGVcIixcImZlYXR1cmluZ1wiLFwiaXNvXCIsXCJpbXBsZW1lbnRcIixcImNsaWNraW5nXCIsXCJzY2hlZHVsZWRcIixcInBvbGxzXCIsXCJ0eXBpY2FsXCIsXCJ0b3dlclwiLFwieW91cnNcIixcInN1bVwiLFwibWlzY1wiLFwiY2FsY3VsYXRvclwiLFwic2lnbmlmaWNhbnRseVwiLFwiY2hpY2tlblwiLFwidGVtcG9yYXJ5XCIsXCJhdHRlbmRcIixcInNob3dlclwiLFwiYWxhblwiLFwic2VuZGluZ1wiLFwiamFzb25cIixcInRvbmlnaHRcIixcImRlYXJcIixcInN1ZmZpY2llbnRcIixcImhvbGRlbVwiLFwic2hlbGxcIixcInByb3ZpbmNlXCIsXCJjYXRob2xpY1wiLFwib2FrXCIsXCJ2YXRcIixcImF3YXJlbmVzc1wiLFwidmFuY291dmVyXCIsXCJnb3Zlcm5vclwiLFwiYmVlclwiLFwic2VlbWVkXCIsXCJjb250cmlidXRpb25cIixcIm1lYXN1cmVtZW50XCIsXCJzd2ltbWluZ1wiLFwic3B5d2FyZVwiLFwiZm9ybXVsYVwiLFwiY29uc3RpdHV0aW9uXCIsXCJwYWNrYWdpbmdcIixcInNvbGFyXCIsXCJqb3NlXCIsXCJjYXRjaFwiLFwiamFuZVwiLFwicGFraXN0YW5cIixcInBzXCIsXCJyZWxpYWJsZVwiLFwiY29uc3VsdGF0aW9uXCIsXCJub3J0aHdlc3RcIixcInNpclwiLFwiZG91YnRcIixcImVhcm5cIixcImZpbmRlclwiLFwidW5hYmxlXCIsXCJwZXJpb2RzXCIsXCJjbGFzc3Jvb21cIixcInRhc2tzXCIsXCJkZW1vY3JhY3lcIixcImF0dGFja3NcIixcImtpbVwiLFwid2FsbHBhcGVyXCIsXCJtZXJjaGFuZGlzZVwiLFwiY29uc3RcIixcInJlc2lzdGFuY2VcIixcImRvb3JzXCIsXCJzeW1wdG9tc1wiLFwicmVzb3J0c1wiLFwiYmlnZ2VzdFwiLFwibWVtb3JpYWxcIixcInZpc2l0b3JcIixcInR3aW5cIixcImZvcnRoXCIsXCJpbnNlcnRcIixcImJhbHRpbW9yZVwiLFwiZ2F0ZXdheVwiLFwia3lcIixcImRvbnRcIixcImFsdW1uaVwiLFwiZHJhd2luZ1wiLFwiY2FuZGlkYXRlc1wiLFwiY2hhcmxvdHRlXCIsXCJvcmRlcmVkXCIsXCJiaW9sb2dpY2FsXCIsXCJmaWdodGluZ1wiLFwidHJhbnNpdGlvblwiLFwiaGFwcGVuc1wiLFwicHJlZmVyZW5jZXNcIixcInNweVwiLFwicm9tYW5jZVwiLFwiaW5zdHJ1bWVudFwiLFwiYnJ1Y2VcIixcInNwbGl0XCIsXCJ0aGVtZXNcIixcInBvd2Vyc1wiLFwiaGVhdmVuXCIsXCJiclwiLFwiYml0c1wiLFwicHJlZ25hbnRcIixcInR3aWNlXCIsXCJjbGFzc2lmaWNhdGlvblwiLFwiZm9jdXNlZFwiLFwiZWd5cHRcIixcInBoeXNpY2lhblwiLFwiaG9sbHl3b29kXCIsXCJiYXJnYWluXCIsXCJ3aWtpcGVkaWFcIixcImNlbGx1bGFyXCIsXCJub3J3YXlcIixcInZlcm1vbnRcIixcImFza2luZ1wiLFwiYmxvY2tzXCIsXCJub3JtYWxseVwiLFwibG9cIixcInNwaXJpdHVhbFwiLFwiaHVudGluZ1wiLFwiZGlhYmV0ZXNcIixcInN1aXRcIixcIm1sXCIsXCJzaGlmdFwiLFwiY2hpcFwiLFwicmVzXCIsXCJzaXRcIixcImJvZGllc1wiLFwicGhvdG9ncmFwaHNcIixcImN1dHRpbmdcIixcIndvd1wiLFwic2ltb25cIixcIndyaXRlcnNcIixcIm1hcmtzXCIsXCJmbGV4aWJsZVwiLFwibG92ZWRcIixcImZhdm91cml0ZXNcIixcIm1hcHBpbmdcIixcIm51bWVyb3VzXCIsXCJyZWxhdGl2ZWx5XCIsXCJiaXJkc1wiLFwic2F0aXNmYWN0aW9uXCIsXCJyZXByZXNlbnRzXCIsXCJjaGFyXCIsXCJpbmRleGVkXCIsXCJwaXR0c2J1cmdoXCIsXCJzdXBlcmlvclwiLFwicHJlZmVycmVkXCIsXCJzYXZlZFwiLFwicGF5aW5nXCIsXCJjYXJ0b29uXCIsXCJzaG90c1wiLFwiaW50ZWxsZWN0dWFsXCIsXCJtb29yZVwiLFwiZ3JhbnRlZFwiLFwiY2hvaWNlc1wiLFwiY2FyYm9uXCIsXCJzcGVuZGluZ1wiLFwiY29tZm9ydGFibGVcIixcIm1hZ25ldGljXCIsXCJpbnRlcmFjdGlvblwiLFwibGlzdGVuaW5nXCIsXCJlZmZlY3RpdmVseVwiLFwicmVnaXN0cnlcIixcImNyaXNpc1wiLFwib3V0bG9va1wiLFwibWFzc2l2ZVwiLFwiZGVubWFya1wiLFwiZW1wbG95ZWRcIixcImJyaWdodFwiLFwidHJlYXRcIixcImhlYWRlclwiLFwiY3NcIixcInBvdmVydHlcIixcImZvcm1lZFwiLFwicGlhbm9cIixcImVjaG9cIixcInF1ZVwiLFwiZ3JpZFwiLFwic2hlZXRzXCIsXCJwYXRyaWNrXCIsXCJleHBlcmltZW50YWxcIixcInB1ZXJ0b1wiLFwicmV2b2x1dGlvblwiLFwiY29uc29saWRhdGlvblwiLFwiZGlzcGxheXNcIixcInBsYXNtYVwiLFwiYWxsb3dpbmdcIixcImVhcm5pbmdzXCIsXCJ2b2lwXCIsXCJteXN0ZXJ5XCIsXCJsYW5kc2NhcGVcIixcImRlcGVuZGVudFwiLFwibWVjaGFuaWNhbFwiLFwiam91cm5leVwiLFwiZGVsYXdhcmVcIixcImJpZGRpbmdcIixcImNvbnN1bHRhbnRzXCIsXCJyaXNrc1wiLFwiYmFubmVyXCIsXCJhcHBsaWNhbnRcIixcImNoYXJ0ZXJcIixcImZpZ1wiLFwiYmFyYmFyYVwiLFwiY29vcGVyYXRpb25cIixcImNvdW50aWVzXCIsXCJhY3F1aXNpdGlvblwiLFwicG9ydHNcIixcImltcGxlbWVudGVkXCIsXCJzZlwiLFwiZGlyZWN0b3JpZXNcIixcInJlY29nbml6ZWRcIixcImRyZWFtc1wiLFwiYmxvZ2dlclwiLFwibm90aWZpY2F0aW9uXCIsXCJrZ1wiLFwibGljZW5zaW5nXCIsXCJzdGFuZHNcIixcInRlYWNoXCIsXCJvY2N1cnJlZFwiLFwidGV4dGJvb2tzXCIsXCJyYXBpZFwiLFwicHVsbFwiLFwiaGFpcnlcIixcImRpdmVyc2l0eVwiLFwiY2xldmVsYW5kXCIsXCJ1dFwiLFwicmV2ZXJzZVwiLFwiZGVwb3NpdFwiLFwic2VtaW5hclwiLFwiaW52ZXN0bWVudHNcIixcImxhdGluYVwiLFwibmFzYVwiLFwid2hlZWxzXCIsXCJzZXhjYW1cIixcInNwZWNpZnlcIixcImFjY2Vzc2liaWxpdHlcIixcImR1dGNoXCIsXCJzZW5zaXRpdmVcIixcInRlbXBsYXRlc1wiLFwiZm9ybWF0c1wiLFwidGFiXCIsXCJkZXBlbmRzXCIsXCJib290c1wiLFwiaG9sZHNcIixcInJvdXRlclwiLFwiY29uY3JldGVcIixcInNpXCIsXCJlZGl0aW5nXCIsXCJwb2xhbmRcIixcImZvbGRlclwiLFwid29tZW5zXCIsXCJjc3NcIixcImNvbXBsZXRpb25cIixcInVwbG9hZFwiLFwicHVsc2VcIixcInVuaXZlcnNpdGllc1wiLFwidGVjaG5pcXVlXCIsXCJjb250cmFjdG9yc1wiLFwibWlsZmh1bnRlclwiLFwidm90aW5nXCIsXCJjb3VydHNcIixcIm5vdGljZXNcIixcInN1YnNjcmlwdGlvbnNcIixcImNhbGN1bGF0ZVwiLFwibWNcIixcImRldHJvaXRcIixcImFsZXhhbmRlclwiLFwiYnJvYWRjYXN0XCIsXCJjb252ZXJ0ZWRcIixcIm1ldHJvXCIsXCJ0b3NoaWJhXCIsXCJhbm5pdmVyc2FyeVwiLFwiaW1wcm92ZW1lbnRzXCIsXCJzdHJpcFwiLFwic3BlY2lmaWNhdGlvblwiLFwicGVhcmxcIixcImFjY2lkZW50XCIsXCJuaWNrXCIsXCJhY2Nlc3NpYmxlXCIsXCJhY2Nlc3NvcnlcIixcInJlc2lkZW50XCIsXCJwbG90XCIsXCJxdHlcIixcInBvc3NpYmx5XCIsXCJhaXJsaW5lXCIsXCJ0eXBpY2FsbHlcIixcInJlcHJlc2VudGF0aW9uXCIsXCJyZWdhcmRcIixcInB1bXBcIixcImV4aXN0c1wiLFwiYXJyYW5nZW1lbnRzXCIsXCJzbW9vdGhcIixcImNvbmZlcmVuY2VzXCIsXCJ1bmlwcm90a2JcIixcInN0cmlrZVwiLFwiY29uc3VtcHRpb25cIixcImJpcm1pbmdoYW1cIixcImZsYXNoaW5nXCIsXCJscFwiLFwibmFycm93XCIsXCJhZnRlcm5vb25cIixcInRocmVhdFwiLFwic3VydmV5c1wiLFwic2l0dGluZ1wiLFwicHV0dGluZ1wiLFwiY29uc3VsdGFudFwiLFwiY29udHJvbGxlclwiLFwib3duZXJzaGlwXCIsXCJjb21taXR0ZWVzXCIsXCJsZWdpc2xhdGl2ZVwiLFwicmVzZWFyY2hlcnNcIixcInZpZXRuYW1cIixcInRyYWlsZXJcIixcImFubmVcIixcImNhc3RsZVwiLFwiZ2FyZGVuc1wiLFwibWlzc2VkXCIsXCJtYWxheXNpYVwiLFwidW5zdWJzY3JpYmVcIixcImFudGlxdWVcIixcImxhYmVsc1wiLFwid2lsbGluZ1wiLFwiYmlvXCIsXCJtb2xlY3VsYXJcIixcImFjdGluZ1wiLFwiaGVhZHNcIixcInN0b3JlZFwiLFwiZXhhbVwiLFwibG9nb3NcIixcInJlc2lkZW5jZVwiLFwiYXR0b3JuZXlzXCIsXCJtaWxmc1wiLFwiYW50aXF1ZXNcIixcImRlbnNpdHlcIixcImh1bmRyZWRcIixcInJ5YW5cIixcIm9wZXJhdG9yc1wiLFwic3RyYW5nZVwiLFwic3VzdGFpbmFibGVcIixcInBoaWxpcHBpbmVzXCIsXCJzdGF0aXN0aWNhbFwiLFwiYmVkc1wiLFwibWVudGlvblwiLFwiaW5ub3ZhdGlvblwiLFwicGNzXCIsXCJlbXBsb3llcnNcIixcImdyZXlcIixcInBhcmFsbGVsXCIsXCJob25kYVwiLFwiYW1lbmRlZFwiLFwib3BlcmF0ZVwiLFwiYmlsbHNcIixcImJvbGRcIixcImJhdGhyb29tXCIsXCJzdGFibGVcIixcIm9wZXJhXCIsXCJkZWZpbml0aW9uc1wiLFwidm9uXCIsXCJkb2N0b3JzXCIsXCJsZXNzb25cIixcImNpbmVtYVwiLFwiYXNzZXRcIixcImFnXCIsXCJzY2FuXCIsXCJlbGVjdGlvbnNcIixcImRyaW5raW5nXCIsXCJyZWFjdGlvblwiLFwiYmxhbmtcIixcImVuaGFuY2VkXCIsXCJlbnRpdGxlZFwiLFwic2V2ZXJlXCIsXCJnZW5lcmF0ZVwiLFwic3RhaW5sZXNzXCIsXCJuZXdzcGFwZXJzXCIsXCJob3NwaXRhbHNcIixcInZpXCIsXCJkZWx1eGVcIixcImh1bW9yXCIsXCJhZ2VkXCIsXCJtb25pdG9yc1wiLFwiZXhjZXB0aW9uXCIsXCJsaXZlZFwiLFwiZHVyYXRpb25cIixcImJ1bGtcIixcInN1Y2Nlc3NmdWxseVwiLFwiaW5kb25lc2lhXCIsXCJwdXJzdWFudFwiLFwic2NpXCIsXCJmYWJyaWNcIixcImVkdFwiLFwidmlzaXRzXCIsXCJwcmltYXJpbHlcIixcInRpZ2h0XCIsXCJkb21haW5zXCIsXCJjYXBhYmlsaXRpZXNcIixcInBtaWRcIixcImNvbnRyYXN0XCIsXCJyZWNvbW1lbmRhdGlvblwiLFwiZmx5aW5nXCIsXCJyZWNydWl0bWVudFwiLFwic2luXCIsXCJiZXJsaW5cIixcImN1dGVcIixcIm9yZ2FuaXplZFwiLFwiYmFcIixcInBhcmFcIixcInNpZW1lbnNcIixcImFkb3B0aW9uXCIsXCJpbXByb3ZpbmdcIixcImNyXCIsXCJleHBlbnNpdmVcIixcIm1lYW50XCIsXCJjYXB0dXJlXCIsXCJwb3VuZHNcIixcImJ1ZmZhbG9cIixcIm9yZ2FuaXNhdGlvbnNcIixcInBsYW5lXCIsXCJwZ1wiLFwiZXhwbGFpbmVkXCIsXCJzZWVkXCIsXCJwcm9ncmFtbWVzXCIsXCJkZXNpcmVcIixcImV4cGVydGlzZVwiLFwibWVjaGFuaXNtXCIsXCJjYW1waW5nXCIsXCJlZVwiLFwiamV3ZWxsZXJ5XCIsXCJtZWV0c1wiLFwid2VsZmFyZVwiLFwicGVlclwiLFwiY2F1Z2h0XCIsXCJldmVudHVhbGx5XCIsXCJtYXJrZWRcIixcImRyaXZlblwiLFwibWVhc3VyZWRcIixcIm1lZGxpbmVcIixcImJvdHRsZVwiLFwiYWdyZWVtZW50c1wiLFwiY29uc2lkZXJpbmdcIixcImlubm92YXRpdmVcIixcIm1hcnNoYWxsXCIsXCJtYXNzYWdlXCIsXCJydWJiZXJcIixcImNvbmNsdXNpb25cIixcImNsb3NpbmdcIixcInRhbXBhXCIsXCJ0aG91c2FuZFwiLFwibWVhdFwiLFwibGVnZW5kXCIsXCJncmFjZVwiLFwic3VzYW5cIixcImluZ1wiLFwia3NcIixcImFkYW1zXCIsXCJweXRob25cIixcIm1vbnN0ZXJcIixcImFsZXhcIixcImJhbmdcIixcInZpbGxhXCIsXCJib25lXCIsXCJjb2x1bW5zXCIsXCJkaXNvcmRlcnNcIixcImJ1Z3NcIixcImNvbGxhYm9yYXRpb25cIixcImhhbWlsdG9uXCIsXCJkZXRlY3Rpb25cIixcImZ0cFwiLFwiY29va2llc1wiLFwiaW5uZXJcIixcImZvcm1hdGlvblwiLFwidHV0b3JpYWxcIixcIm1lZFwiLFwiZW5naW5lZXJzXCIsXCJlbnRpdHlcIixcImNydWlzZXNcIixcImdhdGVcIixcImhvbGRlclwiLFwicHJvcG9zYWxzXCIsXCJtb2RlcmF0b3JcIixcInN3XCIsXCJ0dXRvcmlhbHNcIixcInNldHRsZW1lbnRcIixcInBvcnR1Z2FsXCIsXCJsYXdyZW5jZVwiLFwicm9tYW5cIixcImR1dGllc1wiLFwidmFsdWFibGVcIixcInRvbmVcIixcImNvbGxlY3RhYmxlc1wiLFwiZXRoaWNzXCIsXCJmb3JldmVyXCIsXCJkcmFnb25cIixcImJ1c3lcIixcImNhcHRhaW5cIixcImZhbnRhc3RpY1wiLFwiaW1hZ2luZVwiLFwiYnJpbmdzXCIsXCJoZWF0aW5nXCIsXCJsZWdcIixcIm5lY2tcIixcImhkXCIsXCJ3aW5nXCIsXCJnb3Zlcm5tZW50c1wiLFwicHVyY2hhc2luZ1wiLFwic2NyaXB0c1wiLFwiYWJjXCIsXCJzdGVyZW9cIixcImFwcG9pbnRlZFwiLFwidGFzdGVcIixcImRlYWxpbmdcIixcImNvbW1pdFwiLFwidGlueVwiLFwib3BlcmF0aW9uYWxcIixcInJhaWxcIixcImFpcmxpbmVzXCIsXCJsaWJlcmFsXCIsXCJsaXZlY2FtXCIsXCJqYXlcIixcInRyaXBzXCIsXCJnYXBcIixcInNpZGVzXCIsXCJ0dWJlXCIsXCJ0dXJuc1wiLFwiY29ycmVzcG9uZGluZ1wiLFwiZGVzY3JpcHRpb25zXCIsXCJjYWNoZVwiLFwiYmVsdFwiLFwiamFja2V0XCIsXCJkZXRlcm1pbmF0aW9uXCIsXCJhbmltYXRpb25cIixcIm9yYWNsZVwiLFwiZXJcIixcIm1hdHRoZXdcIixcImxlYXNlXCIsXCJwcm9kdWN0aW9uc1wiLFwiYXZpYXRpb25cIixcImhvYmJpZXNcIixcInByb3VkXCIsXCJleGNlc3NcIixcImRpc2FzdGVyXCIsXCJjb25zb2xlXCIsXCJjb21tYW5kc1wiLFwianJcIixcInRlbGVjb21tdW5pY2F0aW9uc1wiLFwiaW5zdHJ1Y3RvclwiLFwiZ2lhbnRcIixcImFjaGlldmVkXCIsXCJpbmp1cmllc1wiLFwic2hpcHBlZFwiLFwic2VhdHNcIixcImFwcHJvYWNoZXNcIixcImJpelwiLFwiYWxhcm1cIixcInZvbHRhZ2VcIixcImFudGhvbnlcIixcIm5pbnRlbmRvXCIsXCJ1c3VhbFwiLFwibG9hZGluZ1wiLFwic3RhbXBzXCIsXCJhcHBlYXJlZFwiLFwiZnJhbmtsaW5cIixcImFuZ2xlXCIsXCJyb2JcIixcInZpbnlsXCIsXCJoaWdobGlnaHRzXCIsXCJtaW5pbmdcIixcImRlc2lnbmVyc1wiLFwibWVsYm91cm5lXCIsXCJvbmdvaW5nXCIsXCJ3b3JzdFwiLFwiaW1hZ2luZ1wiLFwiYmV0dGluZ1wiLFwic2NpZW50aXN0c1wiLFwibGliZXJ0eVwiLFwid3lvbWluZ1wiLFwiYmxhY2tqYWNrXCIsXCJhcmdlbnRpbmFcIixcImVyYVwiLFwiY29udmVydFwiLFwicG9zc2liaWxpdHlcIixcImFuYWx5c3RcIixcImNvbW1pc3Npb25lclwiLFwiZGFuZ2Vyb3VzXCIsXCJnYXJhZ2VcIixcImV4Y2l0aW5nXCIsXCJyZWxpYWJpbGl0eVwiLFwidGhvbmdzXCIsXCJnY2NcIixcInVuZm9ydHVuYXRlbHlcIixcInJlc3BlY3RpdmVseVwiLFwidm9sdW50ZWVyc1wiLFwiYXR0YWNobWVudFwiLFwicmluZ3RvbmVcIixcImZpbmxhbmRcIixcIm1vcmdhblwiLFwiZGVyaXZlZFwiLFwicGxlYXN1cmVcIixcImhvbm9yXCIsXCJhc3BcIixcIm9yaWVudGVkXCIsXCJlYWdsZVwiLFwiZGVza3RvcHNcIixcInBhbnRzXCIsXCJjb2x1bWJ1c1wiLFwibnVyc2VcIixcInByYXllclwiLFwiYXBwb2ludG1lbnRcIixcIndvcmtzaG9wc1wiLFwiaHVycmljYW5lXCIsXCJxdWlldFwiLFwibHVja1wiLFwicG9zdGFnZVwiLFwicHJvZHVjZXJcIixcInJlcHJlc2VudGVkXCIsXCJtb3J0Z2FnZXNcIixcImRpYWxcIixcInJlc3BvbnNpYmlsaXRpZXNcIixcImNoZWVzZVwiLFwiY29taWNcIixcImNhcmVmdWxseVwiLFwiamV0XCIsXCJwcm9kdWN0aXZpdHlcIixcImludmVzdG9yc1wiLFwiY3Jvd25cIixcInBhclwiLFwidW5kZXJncm91bmRcIixcImRpYWdub3Npc1wiLFwibWFrZXJcIixcImNyYWNrXCIsXCJwcmluY2lwbGVcIixcInBpY2tzXCIsXCJ2YWNhdGlvbnNcIixcImdhbmdcIixcInNlbWVzdGVyXCIsXCJjYWxjdWxhdGVkXCIsXCJmZXRpc2hcIixcImFwcGxpZXNcIixcImNhc2lub3NcIixcImFwcGVhcmFuY2VcIixcInNtb2tlXCIsXCJhcGFjaGVcIixcImZpbHRlcnNcIixcImluY29ycG9yYXRlZFwiLFwibnZcIixcImNyYWZ0XCIsXCJjYWtlXCIsXCJub3RlYm9va3NcIixcImFwYXJ0XCIsXCJmZWxsb3dcIixcImJsaW5kXCIsXCJsb3VuZ2VcIixcIm1hZFwiLFwiYWxnb3JpdGhtXCIsXCJzZW1pXCIsXCJjb2luc1wiLFwiYW5keVwiLFwiZ3Jvc3NcIixcInN0cm9uZ2x5XCIsXCJjYWZlXCIsXCJ2YWxlbnRpbmVcIixcImhpbHRvblwiLFwia2VuXCIsXCJwcm90ZWluc1wiLFwiaG9ycm9yXCIsXCJzdVwiLFwiZXhwXCIsXCJmYW1pbGlhclwiLFwiY2FwYWJsZVwiLFwiZG91Z2xhc1wiLFwiZGViaWFuXCIsXCJ0aWxsXCIsXCJpbnZvbHZpbmdcIixcInBlblwiLFwiaW52ZXN0aW5nXCIsXCJjaHJpc3RvcGhlclwiLFwiYWRtaXNzaW9uXCIsXCJlcHNvblwiLFwic2hvZVwiLFwiZWxlY3RlZFwiLFwiY2FycnlpbmdcIixcInZpY3RvcnlcIixcInNhbmRcIixcIm1hZGlzb25cIixcInRlcnJvcmlzbVwiLFwiam95XCIsXCJlZGl0aW9uc1wiLFwiY3B1XCIsXCJtYWlubHlcIixcImV0aG5pY1wiLFwicmFuXCIsXCJwYXJsaWFtZW50XCIsXCJhY3RvclwiLFwiZmluZHNcIixcInNlYWxcIixcInNpdHVhdGlvbnNcIixcImZpZnRoXCIsXCJhbGxvY2F0ZWRcIixcImNpdGl6ZW5cIixcInZlcnRpY2FsXCIsXCJjb3JyZWN0aW9uc1wiLFwic3RydWN0dXJhbFwiLFwibXVuaWNpcGFsXCIsXCJkZXNjcmliZXNcIixcInByaXplXCIsXCJzclwiLFwib2NjdXJzXCIsXCJqb25cIixcImFic29sdXRlXCIsXCJkaXNhYmlsaXRpZXNcIixcImNvbnNpc3RzXCIsXCJhbnl0aW1lXCIsXCJzdWJzdGFuY2VcIixcInByb2hpYml0ZWRcIixcImFkZHJlc3NlZFwiLFwibGllc1wiLFwicGlwZVwiLFwic29sZGllcnNcIixcIm5yXCIsXCJndWFyZGlhblwiLFwibGVjdHVyZVwiLFwic2ltdWxhdGlvblwiLFwibGF5b3V0XCIsXCJpbml0aWF0aXZlc1wiLFwiaWxsXCIsXCJjb25jZW50cmF0aW9uXCIsXCJjbGFzc2ljc1wiLFwibGJzXCIsXCJsYXlcIixcImludGVycHJldGF0aW9uXCIsXCJob3JzZXNcIixcImxvbFwiLFwiZGlydHlcIixcImRlY2tcIixcIndheW5lXCIsXCJkb25hdGVcIixcInRhdWdodFwiLFwiYmFua3J1cHRjeVwiLFwibXBcIixcIndvcmtlclwiLFwib3B0aW1pemF0aW9uXCIsXCJhbGl2ZVwiLFwidGVtcGxlXCIsXCJzdWJzdGFuY2VzXCIsXCJwcm92ZVwiLFwiZGlzY292ZXJlZFwiLFwid2luZ3NcIixcImJyZWFrc1wiLFwiZ2VuZXRpY1wiLFwicmVzdHJpY3Rpb25zXCIsXCJwYXJ0aWNpcGF0aW5nXCIsXCJ3YXRlcnNcIixcInByb21pc2VcIixcInRoaW5cIixcImV4aGliaXRpb25cIixcInByZWZlclwiLFwicmlkZ2VcIixcImNhYmluZXRcIixcIm1vZGVtXCIsXCJoYXJyaXNcIixcIm1waFwiLFwiYnJpbmdpbmdcIixcInNpY2tcIixcImRvc2VcIixcImV2YWx1YXRlXCIsXCJ0aWZmYW55XCIsXCJ0cm9waWNhbFwiLFwiY29sbGVjdFwiLFwiYmV0XCIsXCJjb21wb3NpdGlvblwiLFwidG95b3RhXCIsXCJzdHJlZXRzXCIsXCJuYXRpb253aWRlXCIsXCJ2ZWN0b3JcIixcImRlZmluaXRlbHlcIixcInNoYXZlZFwiLFwidHVybmluZ1wiLFwiYnVmZmVyXCIsXCJwdXJwbGVcIixcImV4aXN0ZW5jZVwiLFwiY29tbWVudGFyeVwiLFwibGFycnlcIixcImxpbW91c2luZXNcIixcImRldmVsb3BtZW50c1wiLFwiZGVmXCIsXCJpbW1pZ3JhdGlvblwiLFwiZGVzdGluYXRpb25zXCIsXCJsZXRzXCIsXCJtdXR1YWxcIixcInBpcGVsaW5lXCIsXCJuZWNlc3NhcmlseVwiLFwic3ludGF4XCIsXCJsaVwiLFwiYXR0cmlidXRlXCIsXCJwcmlzb25cIixcInNraWxsXCIsXCJjaGFpcnNcIixcIm5sXCIsXCJldmVyeWRheVwiLFwiYXBwYXJlbnRseVwiLFwic3Vycm91bmRpbmdcIixcIm1vdW50YWluc1wiLFwibW92ZXNcIixcInBvcHVsYXJpdHlcIixcImlucXVpcnlcIixcImV0aGVybmV0XCIsXCJjaGVja2VkXCIsXCJleGhpYml0XCIsXCJ0aHJvd1wiLFwidHJlbmRcIixcInNpZXJyYVwiLFwidmlzaWJsZVwiLFwiY2F0c1wiLFwiZGVzZXJ0XCIsXCJwb3N0cG9zdGVkXCIsXCJ5YVwiLFwib2xkZXN0XCIsXCJyaG9kZVwiLFwibmJhXCIsXCJjb29yZGluYXRvclwiLFwib2J2aW91c2x5XCIsXCJtZXJjdXJ5XCIsXCJzdGV2ZW5cIixcImhhbmRib29rXCIsXCJncmVnXCIsXCJuYXZpZ2F0ZVwiLFwid29yc2VcIixcInN1bW1pdFwiLFwidmljdGltc1wiLFwiZXBhXCIsXCJzcGFjZXNcIixcImZ1bmRhbWVudGFsXCIsXCJidXJuaW5nXCIsXCJlc2NhcGVcIixcImNvdXBvbnNcIixcInNvbWV3aGF0XCIsXCJyZWNlaXZlclwiLFwic3Vic3RhbnRpYWxcIixcInRyXCIsXCJwcm9ncmVzc2l2ZVwiLFwiY2lhbGlzXCIsXCJiYlwiLFwiYm9hdHNcIixcImdsYW5jZVwiLFwic2NvdHRpc2hcIixcImNoYW1waW9uc2hpcFwiLFwiYXJjYWRlXCIsXCJyaWNobW9uZFwiLFwic2FjcmFtZW50b1wiLFwiaW1wb3NzaWJsZVwiLFwicm9uXCIsXCJydXNzZWxsXCIsXCJ0ZWxsc1wiLFwib2J2aW91c1wiLFwiZmliZXJcIixcImRlcHJlc3Npb25cIixcImdyYXBoXCIsXCJjb3ZlcmluZ1wiLFwicGxhdGludW1cIixcImp1ZGdtZW50XCIsXCJiZWRyb29tc1wiLFwidGFsa3NcIixcImZpbGluZ1wiLFwiZm9zdGVyXCIsXCJtb2RlbGluZ1wiLFwicGFzc2luZ1wiLFwiYXdhcmRlZFwiLFwidGVzdGltb25pYWxzXCIsXCJ0cmlhbHNcIixcInRpc3N1ZVwiLFwibnpcIixcIm1lbW9yYWJpbGlhXCIsXCJjbGludG9uXCIsXCJtYXN0ZXJzXCIsXCJib25kc1wiLFwiY2FydHJpZGdlXCIsXCJhbGJlcnRhXCIsXCJleHBsYW5hdGlvblwiLFwiZm9sa1wiLFwib3JnXCIsXCJjb21tb25zXCIsXCJjaW5jaW5uYXRpXCIsXCJzdWJzZWN0aW9uXCIsXCJmcmF1ZFwiLFwiZWxlY3RyaWNpdHlcIixcInBlcm1pdHRlZFwiLFwic3BlY3RydW1cIixcImFycml2YWxcIixcIm9rYXlcIixcInBvdHRlcnlcIixcImVtcGhhc2lzXCIsXCJyb2dlclwiLFwiYXNwZWN0XCIsXCJ3b3JrcGxhY2VcIixcImF3ZXNvbWVcIixcIm1leGljYW5cIixcImNvbmZpcm1lZFwiLFwiY291bnRzXCIsXCJwcmljZWRcIixcIndhbGxwYXBlcnNcIixcImhpc3RcIixcImNyYXNoXCIsXCJsaWZ0XCIsXCJkZXNpcmVkXCIsXCJpbnRlclwiLFwiY2xvc2VyXCIsXCJhc3N1bWVzXCIsXCJoZWlnaHRzXCIsXCJzaGFkb3dcIixcInJpZGluZ1wiLFwiaW5mZWN0aW9uXCIsXCJmaXJlZm94XCIsXCJsaXNhXCIsXCJleHBlbnNlXCIsXCJncm92ZVwiLFwiZWxpZ2liaWxpdHlcIixcInZlbnR1cmVcIixcImNsaW5pY1wiLFwia29yZWFuXCIsXCJoZWFsaW5nXCIsXCJwcmluY2Vzc1wiLFwibWFsbFwiLFwiZW50ZXJpbmdcIixcInBhY2tldFwiLFwic3ByYXlcIixcInN0dWRpb3NcIixcImludm9sdmVtZW50XCIsXCJkYWRcIixcImJ1dHRvbnNcIixcInBsYWNlbWVudFwiLFwib2JzZXJ2YXRpb25zXCIsXCJ2YnVsbGV0aW5cIixcImZ1bmRlZFwiLFwidGhvbXBzb25cIixcIndpbm5lcnNcIixcImV4dGVuZFwiLFwicm9hZHNcIixcInN1YnNlcXVlbnRcIixcInBhdFwiLFwiZHVibGluXCIsXCJyb2xsaW5nXCIsXCJmZWxsXCIsXCJtb3RvcmN5Y2xlXCIsXCJ5YXJkXCIsXCJkaXNjbG9zdXJlXCIsXCJlc3RhYmxpc2htZW50XCIsXCJtZW1vcmllc1wiLFwibmVsc29uXCIsXCJ0ZVwiLFwiYXJyaXZlZFwiLFwiY3JlYXRlc1wiLFwiZmFjZXNcIixcInRvdXJpc3RcIixcImF2XCIsXCJtYXlvclwiLFwibXVyZGVyXCIsXCJzZWFuXCIsXCJhZGVxdWF0ZVwiLFwic2VuYXRvclwiLFwieWllbGRcIixcInByZXNlbnRhdGlvbnNcIixcImdyYWRlc1wiLFwiY2FydG9vbnNcIixcInBvdXJcIixcImRpZ2VzdFwiLFwicmVnXCIsXCJsb2RnaW5nXCIsXCJ0aW9uXCIsXCJkdXN0XCIsXCJoZW5jZVwiLFwid2lraVwiLFwiZW50aXJlbHlcIixcInJlcGxhY2VkXCIsXCJyYWRhclwiLFwicmVzY3VlXCIsXCJ1bmRlcmdyYWR1YXRlXCIsXCJsb3NzZXNcIixcImNvbWJhdFwiLFwicmVkdWNpbmdcIixcInN0b3BwZWRcIixcIm9jY3VwYXRpb25cIixcImxha2VzXCIsXCJkb25hdGlvbnNcIixcImFzc29jaWF0aW9uc1wiLFwiY2l0eXNlYXJjaFwiLFwiY2xvc2VseVwiLFwicmFkaWF0aW9uXCIsXCJkaWFyeVwiLFwic2VyaW91c2x5XCIsXCJraW5nc1wiLFwic2hvb3RpbmdcIixcImtlbnRcIixcImFkZHNcIixcIm5zd1wiLFwiZWFyXCIsXCJmbGFnc1wiLFwicGNpXCIsXCJiYWtlclwiLFwibGF1bmNoZWRcIixcImVsc2V3aGVyZVwiLFwicG9sbHV0aW9uXCIsXCJjb25zZXJ2YXRpdmVcIixcImd1ZXN0Ym9va1wiLFwic2hvY2tcIixcImVmZmVjdGl2ZW5lc3NcIixcIndhbGxzXCIsXCJhYnJvYWRcIixcImVib255XCIsXCJ0aWVcIixcIndhcmRcIixcImRyYXduXCIsXCJhcnRodXJcIixcImlhblwiLFwidmlzaXRlZFwiLFwicm9vZlwiLFwid2Fsa2VyXCIsXCJkZW1vbnN0cmF0ZVwiLFwiYXRtb3NwaGVyZVwiLFwic3VnZ2VzdHNcIixcImtpc3NcIixcImJlYXN0XCIsXCJyYVwiLFwib3BlcmF0ZWRcIixcImV4cGVyaW1lbnRcIixcInRhcmdldHNcIixcIm92ZXJzZWFzXCIsXCJwdXJjaGFzZXNcIixcImRvZGdlXCIsXCJjb3Vuc2VsXCIsXCJmZWRlcmF0aW9uXCIsXCJwaXp6YVwiLFwiaW52aXRlZFwiLFwieWFyZHNcIixcImFzc2lnbm1lbnRcIixcImNoZW1pY2Fsc1wiLFwiZ29yZG9uXCIsXCJtb2RcIixcImZhcm1lcnNcIixcInJjXCIsXCJxdWVyaWVzXCIsXCJibXdcIixcInJ1c2hcIixcInVrcmFpbmVcIixcImFic2VuY2VcIixcIm5lYXJlc3RcIixcImNsdXN0ZXJcIixcInZlbmRvcnNcIixcIm1wZWdcIixcIndoZXJlYXNcIixcInlvZ2FcIixcInNlcnZlc1wiLFwid29vZHNcIixcInN1cnByaXNlXCIsXCJsYW1wXCIsXCJyaWNvXCIsXCJwYXJ0aWFsXCIsXCJzaG9wcGVyc1wiLFwicGhpbFwiLFwiZXZlcnlib2R5XCIsXCJjb3VwbGVzXCIsXCJuYXNodmlsbGVcIixcInJhbmtpbmdcIixcImpva2VzXCIsXCJjc3RcIixcImh0dHBcIixcImNlb1wiLFwic2ltcHNvblwiLFwidHdpa2lcIixcInN1YmxpbWVcIixcImNvdW5zZWxpbmdcIixcInBhbGFjZVwiLFwiYWNjZXB0YWJsZVwiLFwic2F0aXNmaWVkXCIsXCJnbGFkXCIsXCJ3aW5zXCIsXCJtZWFzdXJlbWVudHNcIixcInZlcmlmeVwiLFwiZ2xvYmVcIixcInRydXN0ZWRcIixcImNvcHBlclwiLFwibWlsd2F1a2VlXCIsXCJyYWNrXCIsXCJtZWRpY2F0aW9uXCIsXCJ3YXJlaG91c2VcIixcInNoYXJld2FyZVwiLFwiZWNcIixcInJlcFwiLFwiZGlja2VcIixcImtlcnJ5XCIsXCJyZWNlaXB0XCIsXCJzdXBwb3NlZFwiLFwib3JkaW5hcnlcIixcIm5vYm9keVwiLFwiZ2hvc3RcIixcInZpb2xhdGlvblwiLFwiY29uZmlndXJlXCIsXCJzdGFiaWxpdHlcIixcIm1pdFwiLFwiYXBwbHlpbmdcIixcInNvdXRod2VzdFwiLFwiYm9zc1wiLFwicHJpZGVcIixcImluc3RpdHV0aW9uYWxcIixcImV4cGVjdGF0aW9uc1wiLFwiaW5kZXBlbmRlbmNlXCIsXCJrbm93aW5nXCIsXCJyZXBvcnRlclwiLFwibWV0YWJvbGlzbVwiLFwia2VpdGhcIixcImNoYW1waW9uXCIsXCJjbG91ZHlcIixcImxpbmRhXCIsXCJyb3NzXCIsXCJwZXJzb25hbGx5XCIsXCJjaGlsZVwiLFwiYW5uYVwiLFwicGxlbnR5XCIsXCJzb2xvXCIsXCJzZW50ZW5jZVwiLFwidGhyb2F0XCIsXCJpZ25vcmVcIixcIm1hcmlhXCIsXCJ1bmlmb3JtXCIsXCJleGNlbGxlbmNlXCIsXCJ3ZWFsdGhcIixcInRhbGxcIixcInJtXCIsXCJzb21ld2hlcmVcIixcInZhY3V1bVwiLFwiZGFuY2luZ1wiLFwiYXR0cmlidXRlc1wiLFwicmVjb2duaXplXCIsXCJicmFzc1wiLFwid3JpdGVzXCIsXCJwbGF6YVwiLFwicGRhc1wiLFwib3V0Y29tZXNcIixcInN1cnZpdmFsXCIsXCJxdWVzdFwiLFwicHVibGlzaFwiLFwic3JpXCIsXCJzY3JlZW5pbmdcIixcInRvZVwiLFwidGh1bWJuYWlsXCIsXCJ0cmFuc1wiLFwiam9uYXRoYW5cIixcIndoZW5ldmVyXCIsXCJub3ZhXCIsXCJsaWZldGltZVwiLFwiYXBpXCIsXCJwaW9uZWVyXCIsXCJib290eVwiLFwiZm9yZ290dGVuXCIsXCJhY3JvYmF0XCIsXCJwbGF0ZXNcIixcImFjcmVzXCIsXCJ2ZW51ZVwiLFwiYXRobGV0aWNcIixcInRoZXJtYWxcIixcImVzc2F5c1wiLFwiYmVoYXZpb3VyXCIsXCJ2aXRhbFwiLFwidGVsbGluZ1wiLFwiZmFpcmx5XCIsXCJjb2FzdGFsXCIsXCJjb25maWdcIixcImNmXCIsXCJjaGFyaXR5XCIsXCJpbnRlbGxpZ2VudFwiLFwiZWRpbmJ1cmdoXCIsXCJ2dFwiLFwiZXhjZWxcIixcIm1vZGVzXCIsXCJvYmxpZ2F0aW9uXCIsXCJjYW1wYmVsbFwiLFwid2FrZVwiLFwic3R1cGlkXCIsXCJoYXJib3JcIixcImh1bmdhcnlcIixcInRyYXZlbGVyXCIsXCJ1cndcIixcInNlZ21lbnRcIixcInJlYWxpemVcIixcInJlZ2FyZGxlc3NcIixcImxhblwiLFwiZW5lbXlcIixcInB1enpsZVwiLFwicmlzaW5nXCIsXCJhbHVtaW51bVwiLFwid2VsbHNcIixcIndpc2hsaXN0XCIsXCJvcGVuc1wiLFwiaW5zaWdodFwiLFwic21zXCIsXCJyZXN0cmljdGVkXCIsXCJyZXB1YmxpY2FuXCIsXCJzZWNyZXRzXCIsXCJsdWNreVwiLFwibGF0dGVyXCIsXCJtZXJjaGFudHNcIixcInRoaWNrXCIsXCJ0cmFpbGVyc1wiLFwicmVwZWF0XCIsXCJzeW5kcm9tZVwiLFwicGhpbGlwc1wiLFwiYXR0ZW5kYW5jZVwiLFwicGVuYWx0eVwiLFwiZHJ1bVwiLFwiZ2xhc3Nlc1wiLFwiZW5hYmxlc1wiLFwibmVjXCIsXCJpcmFxaVwiLFwiYnVpbGRlclwiLFwidmlzdGFcIixcImplc3NpY2FcIixcImNoaXBzXCIsXCJ0ZXJyeVwiLFwiZmxvb2RcIixcImZvdG9cIixcImVhc2VcIixcImFyZ3VtZW50c1wiLFwiYW1zdGVyZGFtXCIsXCJhcmVuYVwiLFwiYWR2ZW50dXJlc1wiLFwicHVwaWxzXCIsXCJzdGV3YXJ0XCIsXCJhbm5vdW5jZW1lbnRcIixcInRhYnNcIixcIm91dGNvbWVcIixcImFwcHJlY2lhdGVcIixcImV4cGFuZGVkXCIsXCJjYXN1YWxcIixcImdyb3duXCIsXCJwb2xpc2hcIixcImxvdmVseVwiLFwiZXh0cmFzXCIsXCJnbVwiLFwiY2VudHJlc1wiLFwiamVycnlcIixcImNsYXVzZVwiLFwic21pbGVcIixcImxhbmRzXCIsXCJyaVwiLFwidHJvb3BzXCIsXCJpbmRvb3JcIixcImJ1bGdhcmlhXCIsXCJhcm1lZFwiLFwiYnJva2VyXCIsXCJjaGFyZ2VyXCIsXCJyZWd1bGFybHlcIixcImJlbGlldmVkXCIsXCJwaW5lXCIsXCJjb29saW5nXCIsXCJ0ZW5kXCIsXCJndWxmXCIsXCJydFwiLFwicmlja1wiLFwidHJ1Y2tzXCIsXCJjcFwiLFwibWVjaGFuaXNtc1wiLFwiZGl2b3JjZVwiLFwibGF1cmFcIixcInNob3BwZXJcIixcInRva3lvXCIsXCJwYXJ0bHlcIixcIm5pa29uXCIsXCJjdXN0b21pemVcIixcInRyYWRpdGlvblwiLFwiY2FuZHlcIixcInBpbGxzXCIsXCJ0aWdlclwiLFwiZG9uYWxkXCIsXCJmb2xrc1wiLFwic2Vuc29yXCIsXCJleHBvc2VkXCIsXCJ0ZWxlY29tXCIsXCJodW50XCIsXCJhbmdlbHNcIixcImRlcHV0eVwiLFwiaW5kaWNhdG9yc1wiLFwic2VhbGVkXCIsXCJ0aGFpXCIsXCJlbWlzc2lvbnNcIixcInBoeXNpY2lhbnNcIixcImxvYWRlZFwiLFwiZnJlZFwiLFwiY29tcGxhaW50XCIsXCJzY2VuZXNcIixcImV4cGVyaW1lbnRzXCIsXCJhZmdoYW5pc3RhblwiLFwiZGRcIixcImJvb3N0XCIsXCJzcGFua2luZ1wiLFwic2Nob2xhcnNoaXBcIixcImdvdmVybmFuY2VcIixcIm1pbGxcIixcImZvdW5kZWRcIixcInN1cHBsZW1lbnRzXCIsXCJjaHJvbmljXCIsXCJpY29uc1wiLFwibW9yYWxcIixcImRlblwiLFwiY2F0ZXJpbmdcIixcImF1ZFwiLFwiZmluZ2VyXCIsXCJrZWVwc1wiLFwicG91bmRcIixcImxvY2F0ZVwiLFwiY2FtY29yZGVyXCIsXCJwbFwiLFwidHJhaW5lZFwiLFwiYnVyblwiLFwiaW1wbGVtZW50aW5nXCIsXCJyb3Nlc1wiLFwibGFic1wiLFwib3Vyc2VsdmVzXCIsXCJicmVhZFwiLFwidG9iYWNjb1wiLFwid29vZGVuXCIsXCJtb3RvcnNcIixcInRvdWdoXCIsXCJyb2JlcnRzXCIsXCJpbmNpZGVudFwiLFwiZ29ubmFcIixcImR5bmFtaWNzXCIsXCJsaWVcIixcImNybVwiLFwicmZcIixcImNvbnZlcnNhdGlvblwiLFwiZGVjcmVhc2VcIixcImN1bXNob3RzXCIsXCJjaGVzdFwiLFwicGVuc2lvblwiLFwiYmlsbHlcIixcInJldmVudWVzXCIsXCJlbWVyZ2luZ1wiLFwid29yc2hpcFwiLFwiY2FwYWJpbGl0eVwiLFwiYWtcIixcImZlXCIsXCJjcmFpZ1wiLFwiaGVyc2VsZlwiLFwicHJvZHVjaW5nXCIsXCJjaHVyY2hlc1wiLFwicHJlY2lzaW9uXCIsXCJkYW1hZ2VzXCIsXCJyZXNlcnZlc1wiLFwiY29udHJpYnV0ZWRcIixcInNvbHZlXCIsXCJzaG9ydHNcIixcInJlcHJvZHVjdGlvblwiLFwibWlub3JpdHlcIixcInRkXCIsXCJkaXZlcnNlXCIsXCJhbXBcIixcImluZ3JlZGllbnRzXCIsXCJzYlwiLFwiYWhcIixcImpvaG5ueVwiLFwic29sZVwiLFwiZnJhbmNoaXNlXCIsXCJyZWNvcmRlclwiLFwiY29tcGxhaW50c1wiLFwiZmFjaW5nXCIsXCJzbVwiLFwibmFuY3lcIixcInByb21vdGlvbnNcIixcInRvbmVzXCIsXCJwYXNzaW9uXCIsXCJyZWhhYmlsaXRhdGlvblwiLFwibWFpbnRhaW5pbmdcIixcInNpZ2h0XCIsXCJsYWlkXCIsXCJjbGF5XCIsXCJkZWZlbmNlXCIsXCJwYXRjaGVzXCIsXCJ3ZWFrXCIsXCJyZWZ1bmRcIixcInVzY1wiLFwidG93bnNcIixcImVudmlyb25tZW50c1wiLFwidHJlbWJsXCIsXCJkaXZpZGVkXCIsXCJibHZkXCIsXCJyZWNlcHRpb25cIixcImFtZFwiLFwid2lzZVwiLFwiZW1haWxzXCIsXCJjeXBydXNcIixcInd2XCIsXCJvZGRzXCIsXCJjb3JyZWN0bHlcIixcImluc2lkZXJcIixcInNlbWluYXJzXCIsXCJjb25zZXF1ZW5jZXNcIixcIm1ha2Vyc1wiLFwiaGVhcnRzXCIsXCJnZW9ncmFwaHlcIixcImFwcGVhcmluZ1wiLFwiaW50ZWdyaXR5XCIsXCJ3b3JyeVwiLFwibnNcIixcImRpc2NyaW1pbmF0aW9uXCIsXCJldmVcIixcImNhcnRlclwiLFwibGVnYWN5XCIsXCJtYXJjXCIsXCJwbGVhc2VkXCIsXCJkYW5nZXJcIixcInZpdGFtaW5cIixcIndpZGVseVwiLFwicHJvY2Vzc2VkXCIsXCJwaHJhc2VcIixcImdlbnVpbmVcIixcInJhaXNpbmdcIixcImltcGxpY2F0aW9uc1wiLFwiZnVuY3Rpb25hbGl0eVwiLFwicGFyYWRpc2VcIixcImh5YnJpZFwiLFwicmVhZHNcIixcInJvbGVzXCIsXCJpbnRlcm1lZGlhdGVcIixcImVtb3Rpb25hbFwiLFwic29uc1wiLFwibGVhZlwiLFwicGFkXCIsXCJnbG9yeVwiLFwicGxhdGZvcm1zXCIsXCJqYVwiLFwiYmlnZ2VyXCIsXCJiaWxsaW5nXCIsXCJkaWVzZWxcIixcInZlcnN1c1wiLFwiY29tYmluZVwiLFwib3Zlcm5pZ2h0XCIsXCJnZW9ncmFwaGljXCIsXCJleGNlZWRcIixcImJzXCIsXCJyb2RcIixcInNhdWRpXCIsXCJmYXVsdFwiLFwiY3ViYVwiLFwiaHJzXCIsXCJwcmVsaW1pbmFyeVwiLFwiZGlzdHJpY3RzXCIsXCJpbnRyb2R1Y2VcIixcInNpbGtcIixcInByb21vdGlvbmFsXCIsXCJrYXRlXCIsXCJjaGV2cm9sZXRcIixcImJhYmllc1wiLFwiYmlcIixcImthcmVuXCIsXCJjb21waWxlZFwiLFwicm9tYW50aWNcIixcInJldmVhbGVkXCIsXCJzcGVjaWFsaXN0c1wiLFwiZ2VuZXJhdG9yXCIsXCJhbGJlcnRcIixcImV4YW1pbmVcIixcImppbW15XCIsXCJncmFoYW1cIixcInN1c3BlbnNpb25cIixcImJyaXN0b2xcIixcIm1hcmdhcmV0XCIsXCJjb21wYXFcIixcInNhZFwiLFwiY29ycmVjdGlvblwiLFwid29sZlwiLFwic2xvd2x5XCIsXCJhdXRoZW50aWNhdGlvblwiLFwiY29tbXVuaWNhdGVcIixcInJ1Z2J5XCIsXCJzdXBwbGVtZW50XCIsXCJzaG93dGltZXNcIixcImNhbFwiLFwicG9ydGlvbnNcIixcImluZmFudFwiLFwicHJvbW90aW5nXCIsXCJzZWN0b3JzXCIsXCJzYW11ZWxcIixcImZsdWlkXCIsXCJncm91bmRzXCIsXCJmaXRzXCIsXCJraWNrXCIsXCJyZWdhcmRzXCIsXCJtZWFsXCIsXCJ0YVwiLFwiaHVydFwiLFwibWFjaGluZXJ5XCIsXCJiYW5kd2lkdGhcIixcInVubGlrZVwiLFwiZXF1YXRpb25cIixcImJhc2tldHNcIixcInByb2JhYmlsaXR5XCIsXCJwb3RcIixcImRpbWVuc2lvblwiLFwid3JpZ2h0XCIsXCJpbWdcIixcImJhcnJ5XCIsXCJwcm92ZW5cIixcInNjaGVkdWxlc1wiLFwiYWRtaXNzaW9uc1wiLFwiY2FjaGVkXCIsXCJ3YXJyZW5cIixcInNsaXBcIixcInN0dWRpZWRcIixcInJldmlld2VyXCIsXCJpbnZvbHZlc1wiLFwicXVhcnRlcmx5XCIsXCJycG1cIixcInByb2ZpdHNcIixcImRldmlsXCIsXCJncmFzc1wiLFwiY29tcGx5XCIsXCJtYXJpZVwiLFwiZmxvcmlzdFwiLFwiaWxsdXN0cmF0ZWRcIixcImNoZXJyeVwiLFwiY29udGluZW50YWxcIixcImFsdGVybmF0ZVwiLFwiZGV1dHNjaFwiLFwiYWNoaWV2ZW1lbnRcIixcImxpbWl0YXRpb25zXCIsXCJrZW55YVwiLFwid2ViY2FtXCIsXCJjdXRzXCIsXCJmdW5lcmFsXCIsXCJudXR0ZW5cIixcImVhcnJpbmdzXCIsXCJlbmpveWVkXCIsXCJhdXRvbWF0ZWRcIixcImNoYXB0ZXJzXCIsXCJwZWVcIixcImNoYXJsaWVcIixcInF1ZWJlY1wiLFwicGFzc2VuZ2VyXCIsXCJjb252ZW5pZW50XCIsXCJkZW5uaXNcIixcIm1hcnNcIixcImZyYW5jaXNcIixcInR2c1wiLFwic2l6ZWRcIixcIm1hbmdhXCIsXCJub3RpY2VkXCIsXCJzb2NrZXRcIixcInNpbGVudFwiLFwibGl0ZXJhcnlcIixcImVnZ1wiLFwibWh6XCIsXCJzaWduYWxzXCIsXCJjYXBzXCIsXCJvcmllbnRhdGlvblwiLFwicGlsbFwiLFwidGhlZnRcIixcImNoaWxkaG9vZFwiLFwic3dpbmdcIixcInN5bWJvbHNcIixcImxhdFwiLFwibWV0YVwiLFwiaHVtYW5zXCIsXCJhbmFsb2dcIixcImZhY2lhbFwiLFwiY2hvb3NpbmdcIixcInRhbGVudFwiLFwiZGF0ZWRcIixcImZsZXhpYmlsaXR5XCIsXCJzZWVrZXJcIixcIndpc2RvbVwiLFwic2hvb3RcIixcImJvdW5kYXJ5XCIsXCJtaW50XCIsXCJwYWNrYXJkXCIsXCJvZmZzZXRcIixcInBheWRheVwiLFwicGhpbGlwXCIsXCJlbGl0ZVwiLFwiZ2lcIixcInNwaW5cIixcImhvbGRlcnNcIixcImJlbGlldmVzXCIsXCJzd2VkaXNoXCIsXCJwb2Vtc1wiLFwiZGVhZGxpbmVcIixcImp1cmlzZGljdGlvblwiLFwicm9ib3RcIixcImRpc3BsYXlpbmdcIixcIndpdG5lc3NcIixcImNvbGxpbnNcIixcImVxdWlwcGVkXCIsXCJzdGFnZXNcIixcImVuY291cmFnZWRcIixcInN1clwiLFwid2luZHNcIixcInBvd2RlclwiLFwiYnJvYWR3YXlcIixcImFjcXVpcmVkXCIsXCJhc3Nlc3NcIixcIndhc2hcIixcImNhcnRyaWRnZXNcIixcInN0b25lc1wiLFwiZW50cmFuY2VcIixcImdub21lXCIsXCJyb290c1wiLFwiZGVjbGFyYXRpb25cIixcImxvc2luZ1wiLFwiYXR0ZW1wdHNcIixcImdhZGdldHNcIixcIm5vYmxlXCIsXCJnbGFzZ293XCIsXCJhdXRvbWF0aW9uXCIsXCJpbXBhY3RzXCIsXCJyZXZcIixcImdvc3BlbFwiLFwiYWR2YW50YWdlc1wiLFwic2hvcmVcIixcImxvdmVzXCIsXCJpbmR1Y2VkXCIsXCJsbFwiLFwia25pZ2h0XCIsXCJwcmVwYXJpbmdcIixcImxvb3NlXCIsXCJhaW1zXCIsXCJyZWNpcGllbnRcIixcImxpbmtpbmdcIixcImV4dGVuc2lvbnNcIixcImFwcGVhbHNcIixcImNsXCIsXCJlYXJuZWRcIixcImlsbG5lc3NcIixcImlzbGFtaWNcIixcImF0aGxldGljc1wiLFwic291dGhlYXN0XCIsXCJpZWVlXCIsXCJob1wiLFwiYWx0ZXJuYXRpdmVzXCIsXCJwZW5kaW5nXCIsXCJwYXJrZXJcIixcImRldGVybWluaW5nXCIsXCJsZWJhbm9uXCIsXCJjb3JwXCIsXCJwZXJzb25hbGl6ZWRcIixcImtlbm5lZHlcIixcImd0XCIsXCJzaFwiLFwiY29uZGl0aW9uaW5nXCIsXCJ0ZWVuYWdlXCIsXCJzb2FwXCIsXCJhZVwiLFwidHJpcGxlXCIsXCJjb29wZXJcIixcIm55Y1wiLFwidmluY2VudFwiLFwiamFtXCIsXCJzZWN1cmVkXCIsXCJ1bnVzdWFsXCIsXCJhbnN3ZXJlZFwiLFwicGFydG5lcnNoaXBzXCIsXCJkZXN0cnVjdGlvblwiLFwic2xvdHNcIixcImluY3JlYXNpbmdseVwiLFwibWlncmF0aW9uXCIsXCJkaXNvcmRlclwiLFwicm91dGluZVwiLFwidG9vbGJhclwiLFwiYmFzaWNhbGx5XCIsXCJyb2Nrc1wiLFwiY29udmVudGlvbmFsXCIsXCJ0aXRhbnNcIixcImFwcGxpY2FudHNcIixcIndlYXJpbmdcIixcImF4aXNcIixcInNvdWdodFwiLFwiZ2VuZXNcIixcIm1vdW50ZWRcIixcImhhYml0YXRcIixcImZpcmV3YWxsXCIsXCJtZWRpYW5cIixcImd1bnNcIixcInNjYW5uZXJcIixcImhlcmVpblwiLFwib2NjdXBhdGlvbmFsXCIsXCJhbmltYXRlZFwiLFwianVkaWNpYWxcIixcInJpb1wiLFwiaHNcIixcImFkanVzdG1lbnRcIixcImhlcm9cIixcImludGVnZXJcIixcInRyZWF0bWVudHNcIixcImJhY2hlbG9yXCIsXCJhdHRpdHVkZVwiLFwiY2FtY29yZGVyc1wiLFwiZW5nYWdlZFwiLFwiZmFsbGluZ1wiLFwiYmFzaWNzXCIsXCJtb250cmVhbFwiLFwiY2FycGV0XCIsXCJydlwiLFwic3RydWN0XCIsXCJsZW5zZXNcIixcImJpbmFyeVwiLFwiZ2VuZXRpY3NcIixcImF0dGVuZGVkXCIsXCJkaWZmaWN1bHR5XCIsXCJwdW5rXCIsXCJjb2xsZWN0aXZlXCIsXCJjb2FsaXRpb25cIixcInBpXCIsXCJkcm9wcGVkXCIsXCJlbnJvbGxtZW50XCIsXCJkdWtlXCIsXCJ3YWx0ZXJcIixcImFpXCIsXCJwYWNlXCIsXCJiZXNpZGVzXCIsXCJ3YWdlXCIsXCJwcm9kdWNlcnNcIixcIm90XCIsXCJjb2xsZWN0b3JcIixcImFyY1wiLFwiaG9zdHNcIixcImludGVyZmFjZXNcIixcImFkdmVydGlzZXJzXCIsXCJtb21lbnRzXCIsXCJhdGxhc1wiLFwic3RyaW5nc1wiLFwiZGF3blwiLFwicmVwcmVzZW50aW5nXCIsXCJvYnNlcnZhdGlvblwiLFwiZmVlbHNcIixcInRvcnR1cmVcIixcImNhcmxcIixcImRlbGV0ZWRcIixcImNvYXRcIixcIm1pdGNoZWxsXCIsXCJtcnNcIixcInJpY2FcIixcInJlc3RvcmF0aW9uXCIsXCJjb252ZW5pZW5jZVwiLFwicmV0dXJuaW5nXCIsXCJyYWxwaFwiLFwib3Bwb3NpdGlvblwiLFwiY29udGFpbmVyXCIsXCJ5clwiLFwiZGVmZW5kYW50XCIsXCJ3YXJuZXJcIixcImNvbmZpcm1hdGlvblwiLFwiYXBwXCIsXCJlbWJlZGRlZFwiLFwiaW5ramV0XCIsXCJzdXBlcnZpc29yXCIsXCJ3aXphcmRcIixcImNvcnBzXCIsXCJhY3RvcnNcIixcImxpdmVyXCIsXCJwZXJpcGhlcmFsc1wiLFwibGlhYmxlXCIsXCJicm9jaHVyZVwiLFwibW9ycmlzXCIsXCJiZXN0c2VsbGVyc1wiLFwicGV0aXRpb25cIixcImVtaW5lbVwiLFwicmVjYWxsXCIsXCJhbnRlbm5hXCIsXCJwaWNrZWRcIixcImFzc3VtZWRcIixcImRlcGFydHVyZVwiLFwibWlubmVhcG9saXNcIixcImJlbGllZlwiLFwia2lsbGluZ1wiLFwiYmlraW5pXCIsXCJtZW1waGlzXCIsXCJzaG91bGRlclwiLFwiZGVjb3JcIixcImxvb2t1cFwiLFwidGV4dHNcIixcImhhcnZhcmRcIixcImJyb2tlcnNcIixcInJveVwiLFwiaW9uXCIsXCJkaWFtZXRlclwiLFwib3R0YXdhXCIsXCJkb2xsXCIsXCJpY1wiLFwicG9kY2FzdFwiLFwic2Vhc29uc1wiLFwicGVydVwiLFwiaW50ZXJhY3Rpb25zXCIsXCJyZWZpbmVcIixcImJpZGRlclwiLFwic2luZ2VyXCIsXCJldmFuc1wiLFwiaGVyYWxkXCIsXCJsaXRlcmFjeVwiLFwiZmFpbHNcIixcImFnaW5nXCIsXCJuaWtlXCIsXCJpbnRlcnZlbnRpb25cIixcImZlZFwiLFwicGx1Z2luXCIsXCJhdHRyYWN0aW9uXCIsXCJkaXZpbmdcIixcImludml0ZVwiLFwibW9kaWZpY2F0aW9uXCIsXCJhbGljZVwiLFwibGF0aW5hc1wiLFwic3VwcG9zZVwiLFwiY3VzdG9taXplZFwiLFwicmVlZFwiLFwiaW52b2x2ZVwiLFwibW9kZXJhdGVcIixcInRlcnJvclwiLFwieW91bmdlclwiLFwidGhpcnR5XCIsXCJtaWNlXCIsXCJvcHBvc2l0ZVwiLFwidW5kZXJzdG9vZFwiLFwicmFwaWRseVwiLFwiZGVhbHRpbWVcIixcImJhblwiLFwidGVtcFwiLFwiaW50cm9cIixcIm1lcmNlZGVzXCIsXCJ6dXNcIixcImFzc3VyYW5jZVwiLFwiY2xlcmtcIixcImhhcHBlbmluZ1wiLFwidmFzdFwiLFwibWlsbHNcIixcIm91dGxpbmVcIixcImFtZW5kbWVudHNcIixcInRyYW1hZG9sXCIsXCJob2xsYW5kXCIsXCJyZWNlaXZlc1wiLFwiamVhbnNcIixcIm1ldHJvcG9saXRhblwiLFwiY29tcGlsYXRpb25cIixcInZlcmlmaWNhdGlvblwiLFwiZm9udHNcIixcImVudFwiLFwib2RkXCIsXCJ3cmFwXCIsXCJyZWZlcnNcIixcIm1vb2RcIixcImZhdm9yXCIsXCJ2ZXRlcmFuc1wiLFwicXVpelwiLFwibXhcIixcInNpZ21hXCIsXCJnclwiLFwiYXR0cmFjdGl2ZVwiLFwieGh0bWxcIixcIm9jY2FzaW9uXCIsXCJyZWNvcmRpbmdzXCIsXCJqZWZmZXJzb25cIixcInZpY3RpbVwiLFwiZGVtYW5kc1wiLFwic2xlZXBpbmdcIixcImNhcmVmdWxcIixcImV4dFwiLFwiYmVhbVwiLFwiZ2FyZGVuaW5nXCIsXCJvYmxpZ2F0aW9uc1wiLFwiYXJyaXZlXCIsXCJvcmNoZXN0cmFcIixcInN1bnNldFwiLFwidHJhY2tlZFwiLFwibW9yZW92ZXJcIixcIm1pbmltYWxcIixcInBvbHlwaG9uaWNcIixcImxvdHRlcnlcIixcInRvcHNcIixcImZyYW1lZFwiLFwiYXNpZGVcIixcIm91dHNvdXJjaW5nXCIsXCJsaWNlbmNlXCIsXCJhZGp1c3RhYmxlXCIsXCJhbGxvY2F0aW9uXCIsXCJtaWNoZWxsZVwiLFwiZXNzYXlcIixcImRpc2NpcGxpbmVcIixcImFteVwiLFwidHNcIixcImRlbW9uc3RyYXRlZFwiLFwiZGlhbG9ndWVcIixcImlkZW50aWZ5aW5nXCIsXCJhbHBoYWJldGljYWxcIixcImNhbXBzXCIsXCJkZWNsYXJlZFwiLFwiZGlzcGF0Y2hlZFwiLFwiYWFyb25cIixcImhhbmRoZWxkXCIsXCJ0cmFjZVwiLFwiZGlzcG9zYWxcIixcInNodXRcIixcImZsb3Jpc3RzXCIsXCJwYWNrc1wiLFwiZ2VcIixcImluc3RhbGxpbmdcIixcInN3aXRjaGVzXCIsXCJyb21hbmlhXCIsXCJ2b2x1bnRhcnlcIixcIm5jYWFcIixcInRob3VcIixcImNvbnN1bHRcIixcInBoZFwiLFwiZ3JlYXRseVwiLFwiYmxvZ2dpbmdcIixcIm1hc2tcIixcImN5Y2xpbmdcIixcIm1pZG5pZ2h0XCIsXCJuZ1wiLFwiY29tbW9ubHlcIixcInBlXCIsXCJwaG90b2dyYXBoZXJcIixcImluZm9ybVwiLFwidHVya2lzaFwiLFwiY29hbFwiLFwiY3J5XCIsXCJtZXNzYWdpbmdcIixcInBlbnRpdW1cIixcInF1YW50dW1cIixcIm11cnJheVwiLFwiaW50ZW50XCIsXCJ0dFwiLFwiem9vXCIsXCJsYXJnZWx5XCIsXCJwbGVhc2FudFwiLFwiYW5ub3VuY2VcIixcImNvbnN0cnVjdGVkXCIsXCJhZGRpdGlvbnNcIixcInJlcXVpcmluZ1wiLFwic3Bva2VcIixcImFrYVwiLFwiYXJyb3dcIixcImVuZ2FnZW1lbnRcIixcInNhbXBsaW5nXCIsXCJyb3VnaFwiLFwid2VpcmRcIixcInRlZVwiLFwicmVmaW5hbmNlXCIsXCJsaW9uXCIsXCJpbnNwaXJlZFwiLFwiaG9sZXNcIixcIndlZGRpbmdzXCIsXCJibGFkZVwiLFwic3VkZGVubHlcIixcIm94eWdlblwiLFwiY29va2llXCIsXCJtZWFsc1wiLFwiY2FueW9uXCIsXCJnb3RvXCIsXCJtZXRlcnNcIixcIm1lcmVseVwiLFwiY2FsZW5kYXJzXCIsXCJhcnJhbmdlbWVudFwiLFwiY29uY2x1c2lvbnNcIixcInBhc3Nlc1wiLFwiYmlibGlvZ3JhcGh5XCIsXCJwb2ludGVyXCIsXCJjb21wYXRpYmlsaXR5XCIsXCJzdHJldGNoXCIsXCJkdXJoYW1cIixcImZ1cnRoZXJtb3JlXCIsXCJwZXJtaXRzXCIsXCJjb29wZXJhdGl2ZVwiLFwibXVzbGltXCIsXCJ4bFwiLFwibmVpbFwiLFwic2xlZXZlXCIsXCJuZXRzY2FwZVwiLFwiY2xlYW5lclwiLFwiY3JpY2tldFwiLFwiYmVlZlwiLFwiZmVlZGluZ1wiLFwic3Ryb2tlXCIsXCJ0b3duc2hpcFwiLFwicmFua2luZ3NcIixcIm1lYXN1cmluZ1wiLFwiY2FkXCIsXCJoYXRzXCIsXCJyb2JpblwiLFwicm9iaW5zb25cIixcImphY2tzb252aWxsZVwiLFwic3RyYXBcIixcImhlYWRxdWFydGVyc1wiLFwic2hhcm9uXCIsXCJjcm93ZFwiLFwidGNwXCIsXCJ0cmFuc2ZlcnNcIixcInN1cmZcIixcIm9seW1waWNcIixcInRyYW5zZm9ybWF0aW9uXCIsXCJyZW1haW5lZFwiLFwiYXR0YWNobWVudHNcIixcImR2XCIsXCJkaXJcIixcImVudGl0aWVzXCIsXCJjdXN0b21zXCIsXCJhZG1pbmlzdHJhdG9yc1wiLFwicGVyc29uYWxpdHlcIixcInJhaW5ib3dcIixcImhvb2tcIixcInJvdWxldHRlXCIsXCJkZWNsaW5lXCIsXCJnbG92ZXNcIixcImlzcmFlbGlcIixcIm1lZGljYXJlXCIsXCJjb3JkXCIsXCJza2lpbmdcIixcImNsb3VkXCIsXCJmYWNpbGl0YXRlXCIsXCJzdWJzY3JpYmVyXCIsXCJ2YWx2ZVwiLFwidmFsXCIsXCJoZXdsZXR0XCIsXCJleHBsYWluc1wiLFwicHJvY2VlZFwiLFwiZmxpY2tyXCIsXCJmZWVsaW5nc1wiLFwia25pZmVcIixcImphbWFpY2FcIixcInByaW9yaXRpZXNcIixcInNoZWxmXCIsXCJib29rc3RvcmVcIixcInRpbWluZ1wiLFwibGlrZWRcIixcInBhcmVudGluZ1wiLFwiYWRvcHRcIixcImRlbmllZFwiLFwiZm90b3NcIixcImluY3JlZGlibGVcIixcImJyaXRuZXlcIixcImZyZWV3YXJlXCIsXCJkb25hdGlvblwiLFwib3V0ZXJcIixcImNyb3BcIixcImRlYXRoc1wiLFwicml2ZXJzXCIsXCJjb21tb253ZWFsdGhcIixcInBoYXJtYWNldXRpY2FsXCIsXCJtYW5oYXR0YW5cIixcInRhbGVzXCIsXCJrYXRyaW5hXCIsXCJ3b3JrZm9yY2VcIixcImlzbGFtXCIsXCJub2Rlc1wiLFwidHVcIixcImZ5XCIsXCJ0aHVtYnNcIixcInNlZWRzXCIsXCJjaXRlZFwiLFwibGl0ZVwiLFwiZ2h6XCIsXCJodWJcIixcInRhcmdldGVkXCIsXCJvcmdhbml6YXRpb25hbFwiLFwic2t5cGVcIixcInJlYWxpemVkXCIsXCJ0d2VsdmVcIixcImZvdW5kZXJcIixcImRlY2FkZVwiLFwiZ2FtZWN1YmVcIixcInJyXCIsXCJkaXNwdXRlXCIsXCJwb3J0dWd1ZXNlXCIsXCJ0aXJlZFwiLFwidGl0dGVuXCIsXCJhZHZlcnNlXCIsXCJldmVyeXdoZXJlXCIsXCJleGNlcnB0XCIsXCJlbmdcIixcInN0ZWFtXCIsXCJkaXNjaGFyZ2VcIixcImVmXCIsXCJkcmlua3NcIixcImFjZVwiLFwidm9pY2VzXCIsXCJhY3V0ZVwiLFwiaGFsbG93ZWVuXCIsXCJjbGltYmluZ1wiLFwic3Rvb2RcIixcInNpbmdcIixcInRvbnNcIixcInBlcmZ1bWVcIixcImNhcm9sXCIsXCJob25lc3RcIixcImFsYmFueVwiLFwiaGF6YXJkb3VzXCIsXCJyZXN0b3JlXCIsXCJzdGFja1wiLFwibWV0aG9kb2xvZ3lcIixcInNvbWVib2R5XCIsXCJzdWVcIixcImVwXCIsXCJob3VzZXdhcmVzXCIsXCJyZXB1dGF0aW9uXCIsXCJyZXNpc3RhbnRcIixcImRlbW9jcmF0c1wiLFwicmVjeWNsaW5nXCIsXCJoYW5nXCIsXCJnYnBcIixcImN1cnZlXCIsXCJjcmVhdG9yXCIsXCJhbWJlclwiLFwicXVhbGlmaWNhdGlvbnNcIixcIm11c2V1bXNcIixcImNvZGluZ1wiLFwic2xpZGVzaG93XCIsXCJ0cmFja2VyXCIsXCJ2YXJpYXRpb25cIixcInBhc3NhZ2VcIixcInRyYW5zZmVycmVkXCIsXCJ0cnVua1wiLFwiaGlraW5nXCIsXCJsYlwiLFwicGllcnJlXCIsXCJqZWxzb2Z0XCIsXCJoZWFkc2V0XCIsXCJwaG90b2dyYXBoXCIsXCJvYWtsYW5kXCIsXCJjb2xvbWJpYVwiLFwid2F2ZXNcIixcImNhbWVsXCIsXCJkaXN0cmlidXRvclwiLFwibGFtcHNcIixcInVuZGVybHlpbmdcIixcImhvb2RcIixcIndyZXN0bGluZ1wiLFwic3VpY2lkZVwiLFwiYXJjaGl2ZWRcIixcInBob3Rvc2hvcFwiLFwianBcIixcImNoaVwiLFwiYnRcIixcImFyYWJpYVwiLFwiZ2F0aGVyaW5nXCIsXCJwcm9qZWN0aW9uXCIsXCJqdWljZVwiLFwiY2hhc2VcIixcIm1hdGhlbWF0aWNhbFwiLFwibG9naWNhbFwiLFwic2F1Y2VcIixcImZhbWVcIixcImV4dHJhY3RcIixcInNwZWNpYWxpemVkXCIsXCJkaWFnbm9zdGljXCIsXCJwYW5hbWFcIixcImluZGlhbmFwb2xpc1wiLFwiYWZcIixcInBheWFibGVcIixcImNvcnBvcmF0aW9uc1wiLFwiY291cnRlc3lcIixcImNyaXRpY2lzbVwiLFwiYXV0b21vYmlsZVwiLFwiY29uZmlkZW50aWFsXCIsXCJyZmNcIixcInN0YXR1dG9yeVwiLFwiYWNjb21tb2RhdGlvbnNcIixcImF0aGVuc1wiLFwibm9ydGhlYXN0XCIsXCJkb3dubG9hZGVkXCIsXCJqdWRnZXNcIixcInNsXCIsXCJzZW9cIixcInJldGlyZWRcIixcImlzcFwiLFwicmVtYXJrc1wiLFwiZGV0ZWN0ZWRcIixcImRlY2FkZXNcIixcInBhaW50aW5nc1wiLFwid2Fsa2VkXCIsXCJhcmlzaW5nXCIsXCJuaXNzYW5cIixcImJyYWNlbGV0XCIsXCJpbnNcIixcImVnZ3NcIixcImp1dmVuaWxlXCIsXCJpbmplY3Rpb25cIixcInlvcmtzaGlyZVwiLFwicG9wdWxhdGlvbnNcIixcInByb3RlY3RpdmVcIixcImFmcmFpZFwiLFwiYWNvdXN0aWNcIixcInJhaWx3YXlcIixcImNhc3NldHRlXCIsXCJpbml0aWFsbHlcIixcImluZGljYXRvclwiLFwicG9pbnRlZFwiLFwiaGJcIixcImpwZ1wiLFwiY2F1c2luZ1wiLFwibWlzdGFrZVwiLFwibm9ydG9uXCIsXCJsb2NrZWRcIixcImVsaW1pbmF0ZVwiLFwidGNcIixcImZ1c2lvblwiLFwibWluZXJhbFwiLFwic3VuZ2xhc3Nlc1wiLFwicnVieVwiLFwic3RlZXJpbmdcIixcImJlYWRzXCIsXCJmb3J0dW5lXCIsXCJwcmVmZXJlbmNlXCIsXCJjYW52YXNcIixcInRocmVzaG9sZFwiLFwicGFyaXNoXCIsXCJjbGFpbWVkXCIsXCJzY3JlZW5zXCIsXCJjZW1ldGVyeVwiLFwicGxhbm5lclwiLFwiY3JvYXRpYVwiLFwiZmxvd3NcIixcInN0YWRpdW1cIixcInZlbmV6dWVsYVwiLFwiZXhwbG9yYXRpb25cIixcIm1pbnNcIixcImZld2VyXCIsXCJzZXF1ZW5jZXNcIixcImNvdXBvblwiLFwibnVyc2VzXCIsXCJzc2xcIixcInN0ZW1cIixcInByb3h5XCIsXCJhc3Ryb25vbXlcIixcImxhbmthXCIsXCJvcHRcIixcImVkd2FyZHNcIixcImRyZXdcIixcImNvbnRlc3RzXCIsXCJmbHVcIixcInRyYW5zbGF0ZVwiLFwiYW5ub3VuY2VzXCIsXCJtbGJcIixcImNvc3R1bWVcIixcInRhZ2dlZFwiLFwiYmVya2VsZXlcIixcInZvdGVkXCIsXCJraWxsZXJcIixcImJpa2VzXCIsXCJnYXRlc1wiLFwiYWRqdXN0ZWRcIixcInJhcFwiLFwidHVuZVwiLFwiYmlzaG9wXCIsXCJwdWxsZWRcIixcImNvcm5cIixcImdwXCIsXCJzaGFwZWRcIixcImNvbXByZXNzaW9uXCIsXCJzZWFzb25hbFwiLFwiZXN0YWJsaXNoaW5nXCIsXCJmYXJtZXJcIixcImNvdW50ZXJzXCIsXCJwdXRzXCIsXCJjb25zdGl0dXRpb25hbFwiLFwiZ3Jld1wiLFwicGVyZmVjdGx5XCIsXCJ0aW5cIixcInNsYXZlXCIsXCJpbnN0YW50bHlcIixcImN1bHR1cmVzXCIsXCJub3Jmb2xrXCIsXCJjb2FjaGluZ1wiLFwiZXhhbWluZWRcIixcInRyZWtcIixcImVuY29kaW5nXCIsXCJsaXRpZ2F0aW9uXCIsXCJzdWJtaXNzaW9uc1wiLFwib2VtXCIsXCJoZXJvZXNcIixcInBhaW50ZWRcIixcImx5Y29zXCIsXCJpclwiLFwiemRuZXRcIixcImJyb2FkY2FzdGluZ1wiLFwiaG9yaXpvbnRhbFwiLFwiYXJ0d29ya1wiLFwiY29zbWV0aWNcIixcInJlc3VsdGVkXCIsXCJwb3J0cmFpdFwiLFwidGVycm9yaXN0XCIsXCJpbmZvcm1hdGlvbmFsXCIsXCJldGhpY2FsXCIsXCJjYXJyaWVyc1wiLFwiZWNvbW1lcmNlXCIsXCJtb2JpbGl0eVwiLFwiZmxvcmFsXCIsXCJidWlsZGVyc1wiLFwidGllc1wiLFwic3RydWdnbGVcIixcInNjaGVtZXNcIixcInN1ZmZlcmluZ1wiLFwibmV1dHJhbFwiLFwiZmlzaGVyXCIsXCJyYXRcIixcInNwZWFyc1wiLFwicHJvc3BlY3RpdmVcIixcImJlZGRpbmdcIixcInVsdGltYXRlbHlcIixcImpvaW5pbmdcIixcImhlYWRpbmdcIixcImVxdWFsbHlcIixcImFydGlmaWNpYWxcIixcImJlYXJpbmdcIixcInNwZWN0YWN1bGFyXCIsXCJjb29yZGluYXRpb25cIixcImNvbm5lY3RvclwiLFwiYnJhZFwiLFwiY29tYm9cIixcInNlbmlvcnNcIixcIndvcmxkc1wiLFwiZ3VpbHR5XCIsXCJhZmZpbGlhdGVkXCIsXCJhY3RpdmF0aW9uXCIsXCJuYXR1cmFsbHlcIixcImhhdmVuXCIsXCJ0YWJsZXRcIixcImp1cnlcIixcImRvc1wiLFwidGFpbFwiLFwic3Vic2NyaWJlcnNcIixcImNoYXJtXCIsXCJsYXduXCIsXCJ2aW9sZW50XCIsXCJtaXRzdWJpc2hpXCIsXCJ1bmRlcndlYXJcIixcImJhc2luXCIsXCJzb3VwXCIsXCJwb3RlbnRpYWxseVwiLFwicmFuY2hcIixcImNvbnN0cmFpbnRzXCIsXCJjcm9zc2luZ1wiLFwiaW5jbHVzaXZlXCIsXCJkaW1lbnNpb25hbFwiLFwiY290dGFnZVwiLFwiZHJ1bmtcIixcImNvbnNpZGVyYWJsZVwiLFwiY3JpbWVzXCIsXCJyZXNvbHZlZFwiLFwibW96aWxsYVwiLFwiYnl0ZVwiLFwidG9uZXJcIixcIm5vc2VcIixcImxhdGV4XCIsXCJicmFuY2hlc1wiLFwiYW55bW9yZVwiLFwib2NsY1wiLFwiZGVsaGlcIixcImhvbGRpbmdzXCIsXCJhbGllblwiLFwibG9jYXRvclwiLFwic2VsZWN0aW5nXCIsXCJwcm9jZXNzb3JzXCIsXCJwYW50eWhvc2VcIixcInBsY1wiLFwiYnJva2VcIixcIm5lcGFsXCIsXCJ6aW1iYWJ3ZVwiLFwiZGlmZmljdWx0aWVzXCIsXCJqdWFuXCIsXCJjb21wbGV4aXR5XCIsXCJtc2dcIixcImNvbnN0YW50bHlcIixcImJyb3dzaW5nXCIsXCJyZXNvbHZlXCIsXCJiYXJjZWxvbmFcIixcInByZXNpZGVudGlhbFwiLFwiZG9jdW1lbnRhcnlcIixcImNvZFwiLFwidGVycml0b3JpZXNcIixcIm1lbGlzc2FcIixcIm1vc2Nvd1wiLFwidGhlc2lzXCIsXCJ0aHJ1XCIsXCJqZXdzXCIsXCJueWxvblwiLFwicGFsZXN0aW5pYW5cIixcImRpc2NzXCIsXCJyb2NreVwiLFwiYmFyZ2FpbnNcIixcImZyZXF1ZW50XCIsXCJ0cmltXCIsXCJuaWdlcmlhXCIsXCJjZWlsaW5nXCIsXCJwaXhlbHNcIixcImVuc3VyaW5nXCIsXCJoaXNwYW5pY1wiLFwiY3ZcIixcImNiXCIsXCJsZWdpc2xhdHVyZVwiLFwiaG9zcGl0YWxpdHlcIixcImdlblwiLFwiYW55Ym9keVwiLFwicHJvY3VyZW1lbnRcIixcImRpYW1vbmRzXCIsXCJlc3BuXCIsXCJmbGVldFwiLFwidW50aXRsZWRcIixcImJ1bmNoXCIsXCJ0b3RhbHNcIixcIm1hcnJpb3R0XCIsXCJzaW5naW5nXCIsXCJ0aGVvcmV0aWNhbFwiLFwiYWZmb3JkXCIsXCJleGVyY2lzZXNcIixcInN0YXJyaW5nXCIsXCJyZWZlcnJhbFwiLFwibmhsXCIsXCJzdXJ2ZWlsbGFuY2VcIixcIm9wdGltYWxcIixcInF1aXRcIixcImRpc3RpbmN0XCIsXCJwcm90b2NvbHNcIixcImx1bmdcIixcImhpZ2hsaWdodFwiLFwic3Vic3RpdHV0ZVwiLFwiaW5jbHVzaW9uXCIsXCJob3BlZnVsbHlcIixcImJyaWxsaWFudFwiLFwidHVybmVyXCIsXCJzdWNraW5nXCIsXCJjZW50c1wiLFwicmV1dGVyc1wiLFwidGlcIixcImZjXCIsXCJnZWxcIixcInRvZGRcIixcInNwb2tlblwiLFwib21lZ2FcIixcImV2YWx1YXRlZFwiLFwic3RheWVkXCIsXCJjaXZpY1wiLFwiYXNzaWdubWVudHNcIixcImZ3XCIsXCJtYW51YWxzXCIsXCJkb3VnXCIsXCJzZWVzXCIsXCJ0ZXJtaW5hdGlvblwiLFwid2F0Y2hlZFwiLFwic2F2ZXJcIixcInRoZXJlb2ZcIixcImdyaWxsXCIsXCJob3VzZWhvbGRzXCIsXCJnc1wiLFwicmVkZWVtXCIsXCJyb2dlcnNcIixcImdyYWluXCIsXCJhYWFcIixcImF1dGhlbnRpY1wiLFwicmVnaW1lXCIsXCJ3YW5uYVwiLFwid2lzaGVzXCIsXCJidWxsXCIsXCJtb250Z29tZXJ5XCIsXCJhcmNoaXRlY3R1cmFsXCIsXCJsb3Vpc3ZpbGxlXCIsXCJkZXBlbmRcIixcImRpZmZlclwiLFwibWFjaW50b3NoXCIsXCJtb3ZlbWVudHNcIixcInJhbmdpbmdcIixcIm1vbmljYVwiLFwicmVwYWlyc1wiLFwiYnJlYXRoXCIsXCJhbWVuaXRpZXNcIixcInZpcnR1YWxseVwiLFwiY29sZVwiLFwibWFydFwiLFwiY2FuZGxlXCIsXCJoYW5naW5nXCIsXCJjb2xvcmVkXCIsXCJhdXRob3JpemF0aW9uXCIsXCJ0YWxlXCIsXCJ2ZXJpZmllZFwiLFwibHlublwiLFwiZm9ybWVybHlcIixcInByb2plY3RvclwiLFwiYnBcIixcInNpdHVhdGVkXCIsXCJjb21wYXJhdGl2ZVwiLFwic3RkXCIsXCJzZWVrc1wiLFwiaGVyYmFsXCIsXCJsb3ZpbmdcIixcInN0cmljdGx5XCIsXCJyb3V0aW5nXCIsXCJkb2NzXCIsXCJzdGFubGV5XCIsXCJwc3ljaG9sb2dpY2FsXCIsXCJzdXJwcmlzZWRcIixcInJldGFpbGVyXCIsXCJ2aXRhbWluc1wiLFwiZWxlZ2FudFwiLFwiZ2FpbnNcIixcInJlbmV3YWxcIixcInZpZFwiLFwiZ2VuZWFsb2d5XCIsXCJvcHBvc2VkXCIsXCJkZWVtZWRcIixcInNjb3JpbmdcIixcImV4cGVuZGl0dXJlXCIsXCJicm9va2x5blwiLFwibGl2ZXJwb29sXCIsXCJzaXN0ZXJzXCIsXCJjcml0aWNzXCIsXCJjb25uZWN0aXZpdHlcIixcInNwb3RzXCIsXCJvb1wiLFwiYWxnb3JpdGhtc1wiLFwiaGFja2VyXCIsXCJtYWRyaWRcIixcInNpbWlsYXJseVwiLFwibWFyZ2luXCIsXCJjb2luXCIsXCJzb2xlbHlcIixcImZha2VcIixcInNhbG9uXCIsXCJjb2xsYWJvcmF0aXZlXCIsXCJub3JtYW5cIixcImZkYVwiLFwiZXhjbHVkaW5nXCIsXCJ0dXJib1wiLFwiaGVhZGVkXCIsXCJ2b3RlcnNcIixcImN1cmVcIixcIm1hZG9ubmFcIixcImNvbW1hbmRlclwiLFwiYXJjaFwiLFwibmlcIixcIm11cnBoeVwiLFwidGhpbmtzXCIsXCJ0aGF0c1wiLFwic3VnZ2VzdGlvblwiLFwiaGR0dlwiLFwic29sZGllclwiLFwicGhpbGxpcHNcIixcImFzaW5cIixcImFpbWVkXCIsXCJqdXN0aW5cIixcImJvbWJcIixcImhhcm1cIixcImludGVydmFsXCIsXCJtaXJyb3JzXCIsXCJzcG90bGlnaHRcIixcInRyaWNrc1wiLFwicmVzZXRcIixcImJydXNoXCIsXCJpbnZlc3RpZ2F0ZVwiLFwidGh5XCIsXCJleHBhbnN5c1wiLFwicGFuZWxzXCIsXCJyZXBlYXRlZFwiLFwiYXNzYXVsdFwiLFwiY29ubmVjdGluZ1wiLFwic3BhcmVcIixcImxvZ2lzdGljc1wiLFwiZGVlclwiLFwia29kYWtcIixcInRvbmd1ZVwiLFwiYm93bGluZ1wiLFwidHJpXCIsXCJkYW5pc2hcIixcInBhbFwiLFwibW9ua2V5XCIsXCJwcm9wb3J0aW9uXCIsXCJmaWxlbmFtZVwiLFwic2tpcnRcIixcImZsb3JlbmNlXCIsXCJpbnZlc3RcIixcImhvbmV5XCIsXCJ1bVwiLFwiYW5hbHlzZXNcIixcImRyYXdpbmdzXCIsXCJzaWduaWZpY2FuY2VcIixcInNjZW5hcmlvXCIsXCJ5ZVwiLFwiZnNcIixcImxvdmVyc1wiLFwiYXRvbWljXCIsXCJhcHByb3hcIixcInN5bXBvc2l1bVwiLFwiYXJhYmljXCIsXCJnYXVnZVwiLFwiZXNzZW50aWFsc1wiLFwianVuY3Rpb25cIixcInByb3RlY3RpbmdcIixcIm5uXCIsXCJmYWNlZFwiLFwibWF0XCIsXCJyYWNoZWxcIixcInNvbHZpbmdcIixcInRyYW5zbWl0dGVkXCIsXCJ3ZWVrZW5kc1wiLFwic2NyZWVuc2hvdHNcIixcInByb2R1Y2VzXCIsXCJvdmVuXCIsXCJ0ZWRcIixcImludGVuc2l2ZVwiLFwiY2hhaW5zXCIsXCJraW5nc3RvblwiLFwic2l4dGhcIixcImVuZ2FnZVwiLFwiZGV2aWFudFwiLFwibm9vblwiLFwic3dpdGNoaW5nXCIsXCJxdW90ZWRcIixcImFkYXB0ZXJzXCIsXCJjb3JyZXNwb25kZW5jZVwiLFwiZmFybXNcIixcImltcG9ydHNcIixcInN1cGVydmlzaW9uXCIsXCJjaGVhdFwiLFwiYnJvbnplXCIsXCJleHBlbmRpdHVyZXNcIixcInNhbmR5XCIsXCJzZXBhcmF0aW9uXCIsXCJ0ZXN0aW1vbnlcIixcInN1c3BlY3RcIixcImNlbGVicml0aWVzXCIsXCJtYWNyb1wiLFwic2VuZGVyXCIsXCJtYW5kYXRvcnlcIixcImJvdW5kYXJpZXNcIixcImNydWNpYWxcIixcInN5bmRpY2F0aW9uXCIsXCJneW1cIixcImNlbGVicmF0aW9uXCIsXCJrZGVcIixcImFkamFjZW50XCIsXCJmaWx0ZXJpbmdcIixcInR1aXRpb25cIixcInNwb3VzZVwiLFwiZXhvdGljXCIsXCJ2aWV3ZXJcIixcInNpZ251cFwiLFwidGhyZWF0c1wiLFwibHV4ZW1ib3VyZ1wiLFwicHV6emxlc1wiLFwicmVhY2hpbmdcIixcInZiXCIsXCJkYW1hZ2VkXCIsXCJjYW1zXCIsXCJyZWNlcHRvclwiLFwibGF1Z2hcIixcImpvZWxcIixcInN1cmdpY2FsXCIsXCJkZXN0cm95XCIsXCJjaXRhdGlvblwiLFwicGl0Y2hcIixcImF1dG9zXCIsXCJ5b1wiLFwicHJlbWlzZXNcIixcInBlcnJ5XCIsXCJwcm92ZWRcIixcIm9mZmVuc2l2ZVwiLFwiaW1wZXJpYWxcIixcImRvemVuXCIsXCJiZW5qYW1pblwiLFwiZGVwbG95bWVudFwiLFwidGVldGhcIixcImNsb3RoXCIsXCJzdHVkeWluZ1wiLFwiY29sbGVhZ3Vlc1wiLFwic3RhbXBcIixcImxvdHVzXCIsXCJzYWxtb25cIixcIm9seW1wdXNcIixcInNlcGFyYXRlZFwiLFwicHJvY1wiLFwiY2FyZ29cIixcInRhblwiLFwiZGlyZWN0aXZlXCIsXCJmeFwiLFwic2FsZW1cIixcIm1hdGVcIixcImRsXCIsXCJzdGFydGVyXCIsXCJ1cGdyYWRlc1wiLFwibGlrZXNcIixcImJ1dHRlclwiLFwicGVwcGVyXCIsXCJ3ZWFwb25cIixcImx1Z2dhZ2VcIixcImJ1cmRlblwiLFwiY2hlZlwiLFwidGFwZXNcIixcInpvbmVzXCIsXCJyYWNlc1wiLFwiaXNsZVwiLFwic3R5bGlzaFwiLFwic2xpbVwiLFwibWFwbGVcIixcImx1a2VcIixcImdyb2NlcnlcIixcIm9mZnNob3JlXCIsXCJnb3Zlcm5pbmdcIixcInJldGFpbGVyc1wiLFwiZGVwb3RcIixcImtlbm5ldGhcIixcImNvbXBcIixcImFsdFwiLFwicGllXCIsXCJibGVuZFwiLFwiaGFycmlzb25cIixcImxzXCIsXCJqdWxpZVwiLFwib2NjYXNpb25hbGx5XCIsXCJjYnNcIixcImF0dGVuZGluZ1wiLFwiZW1pc3Npb25cIixcInBldGVcIixcInNwZWNcIixcImZpbmVzdFwiLFwicmVhbHR5XCIsXCJqYW5ldFwiLFwiYm93XCIsXCJwZW5uXCIsXCJyZWNydWl0aW5nXCIsXCJhcHBhcmVudFwiLFwiaW5zdHJ1Y3Rpb25hbFwiLFwicGhwYmJcIixcImF1dHVtblwiLFwidHJhdmVsaW5nXCIsXCJwcm9iZVwiLFwibWlkaVwiLFwicGVybWlzc2lvbnNcIixcImJpb3RlY2hub2xvZ3lcIixcInRvaWxldFwiLFwicmFua2VkXCIsXCJqYWNrZXRzXCIsXCJyb3V0ZXNcIixcInBhY2tlZFwiLFwiZXhjaXRlZFwiLFwib3V0cmVhY2hcIixcImhlbGVuXCIsXCJtb3VudGluZ1wiLFwicmVjb3ZlclwiLFwidGllZFwiLFwibG9wZXpcIixcImJhbGFuY2VkXCIsXCJwcmVzY3JpYmVkXCIsXCJjYXRoZXJpbmVcIixcInRpbWVseVwiLFwidGFsa2VkXCIsXCJ1cHNraXJ0c1wiLFwiZGVidWdcIixcImRlbGF5ZWRcIixcImNodWNrXCIsXCJyZXByb2R1Y2VkXCIsXCJob25cIixcImRhbGVcIixcImV4cGxpY2l0XCIsXCJjYWxjdWxhdGlvblwiLFwidmlsbGFzXCIsXCJlYm9va1wiLFwiY29uc29saWRhdGVkXCIsXCJleGNsdWRlXCIsXCJwZWVpbmdcIixcIm9jY2FzaW9uc1wiLFwiYnJvb2tzXCIsXCJlcXVhdGlvbnNcIixcIm5ld3RvblwiLFwib2lsc1wiLFwic2VwdFwiLFwiZXhjZXB0aW9uYWxcIixcImFueGlldHlcIixcImJpbmdvXCIsXCJ3aGlsc3RcIixcInNwYXRpYWxcIixcInJlc3BvbmRlbnRzXCIsXCJ1bnRvXCIsXCJsdFwiLFwiY2VyYW1pY1wiLFwicHJvbXB0XCIsXCJwcmVjaW91c1wiLFwibWluZHNcIixcImFubnVhbGx5XCIsXCJjb25zaWRlcmF0aW9uc1wiLFwic2Nhbm5lcnNcIixcImF0bVwiLFwieGFuYXhcIixcImVxXCIsXCJwYXlzXCIsXCJmaW5nZXJzXCIsXCJzdW5ueVwiLFwiZWJvb2tzXCIsXCJkZWxpdmVyc1wiLFwiamVcIixcInF1ZWVuc2xhbmRcIixcIm5lY2tsYWNlXCIsXCJtdXNpY2lhbnNcIixcImxlZWRzXCIsXCJjb21wb3NpdGVcIixcInVuYXZhaWxhYmxlXCIsXCJjZWRhclwiLFwiYXJyYW5nZWRcIixcImxhbmdcIixcInRoZWF0ZXJzXCIsXCJhZHZvY2FjeVwiLFwicmFsZWlnaFwiLFwic3R1ZFwiLFwiZm9sZFwiLFwiZXNzZW50aWFsbHlcIixcImRlc2lnbmluZ1wiLFwidGhyZWFkZWRcIixcInV2XCIsXCJxdWFsaWZ5XCIsXCJibGFpclwiLFwiaG9wZXNcIixcImFzc2Vzc21lbnRzXCIsXCJjbXNcIixcIm1hc29uXCIsXCJkaWFncmFtXCIsXCJidXJuc1wiLFwicHVtcHNcIixcImZvb3R3ZWFyXCIsXCJzZ1wiLFwidmljXCIsXCJiZWlqaW5nXCIsXCJwZW9wbGVzXCIsXCJ2aWN0b3JcIixcIm1hcmlvXCIsXCJwb3NcIixcImF0dGFjaFwiLFwibGljZW5zZXNcIixcInV0aWxzXCIsXCJyZW1vdmluZ1wiLFwiYWR2aXNlZFwiLFwiYnJ1bnN3aWNrXCIsXCJzcGlkZXJcIixcInBoeXNcIixcInJhbmdlc1wiLFwicGFpcnNcIixcInNlbnNpdGl2aXR5XCIsXCJ0cmFpbHNcIixcInByZXNlcnZhdGlvblwiLFwiaHVkc29uXCIsXCJpc29sYXRlZFwiLFwiY2FsZ2FyeVwiLFwiaW50ZXJpbVwiLFwiYXNzaXN0ZWRcIixcImRpdmluZVwiLFwic3RyZWFtaW5nXCIsXCJhcHByb3ZlXCIsXCJjaG9zZVwiLFwiY29tcG91bmRcIixcImludGVuc2l0eVwiLFwidGVjaG5vbG9naWNhbFwiLFwic3luZGljYXRlXCIsXCJhYm9ydGlvblwiLFwiZGlhbG9nXCIsXCJ2ZW51ZXNcIixcImJsYXN0XCIsXCJ3ZWxsbmVzc1wiLFwiY2FsY2l1bVwiLFwibmV3cG9ydFwiLFwiYW50aXZpcnVzXCIsXCJhZGRyZXNzaW5nXCIsXCJwb2xlXCIsXCJkaXNjb3VudGVkXCIsXCJpbmRpYW5zXCIsXCJzaGllbGRcIixcImhhcnZlc3RcIixcIm1lbWJyYW5lXCIsXCJwcmFndWVcIixcInByZXZpZXdzXCIsXCJiYW5nbGFkZXNoXCIsXCJjb25zdGl0dXRlXCIsXCJsb2NhbGx5XCIsXCJjb25jbHVkZWRcIixcInBpY2t1cFwiLFwiZGVzcGVyYXRlXCIsXCJtb3RoZXJzXCIsXCJuYXNjYXJcIixcImljZWxhbmRcIixcImRlbW9uc3RyYXRpb25cIixcImdvdmVybm1lbnRhbFwiLFwibWFudWZhY3R1cmVkXCIsXCJjYW5kbGVzXCIsXCJncmFkdWF0aW9uXCIsXCJtZWdhXCIsXCJiZW5kXCIsXCJzYWlsaW5nXCIsXCJ2YXJpYXRpb25zXCIsXCJtb21zXCIsXCJzYWNyZWRcIixcImFkZGljdGlvblwiLFwibW9yb2Njb1wiLFwiY2hyb21lXCIsXCJ0b21teVwiLFwic3ByaW5nZmllbGRcIixcInJlZnVzZWRcIixcImJyYWtlXCIsXCJleHRlcmlvclwiLFwiZ3JlZXRpbmdcIixcImVjb2xvZ3lcIixcIm9saXZlclwiLFwiY29uZ29cIixcImdsZW5cIixcImJvdHN3YW5hXCIsXCJuYXZcIixcImRlbGF5c1wiLFwic3ludGhlc2lzXCIsXCJvbGl2ZVwiLFwidW5kZWZpbmVkXCIsXCJ1bmVtcGxveW1lbnRcIixcImN5YmVyXCIsXCJ2ZXJpem9uXCIsXCJzY29yZWRcIixcImVuaGFuY2VtZW50XCIsXCJuZXdjYXN0bGVcIixcImNsb25lXCIsXCJkaWNrc1wiLFwidmVsb2NpdHlcIixcImxhbWJkYVwiLFwicmVsYXlcIixcImNvbXBvc2VkXCIsXCJ0ZWFyc1wiLFwicGVyZm9ybWFuY2VzXCIsXCJvYXNpc1wiLFwiYmFzZWxpbmVcIixcImNhYlwiLFwiYW5ncnlcIixcImZhXCIsXCJzb2NpZXRpZXNcIixcInNpbGljb25cIixcImJyYXppbGlhblwiLFwiaWRlbnRpY2FsXCIsXCJwZXRyb2xldW1cIixcImNvbXBldGVcIixcImlzdFwiLFwibm9yd2VnaWFuXCIsXCJsb3ZlclwiLFwiYmVsb25nXCIsXCJob25vbHVsdVwiLFwiYmVhdGxlc1wiLFwibGlwc1wiLFwicmV0ZW50aW9uXCIsXCJleGNoYW5nZXNcIixcInBvbmRcIixcInJvbGxzXCIsXCJ0aG9tc29uXCIsXCJiYXJuZXNcIixcInNvdW5kdHJhY2tcIixcIndvbmRlcmluZ1wiLFwibWFsdGFcIixcImRhZGR5XCIsXCJsY1wiLFwiZmVycnlcIixcInJhYmJpdFwiLFwicHJvZmVzc2lvblwiLFwic2VhdGluZ1wiLFwiZGFtXCIsXCJjbm5cIixcInNlcGFyYXRlbHlcIixcInBoeXNpb2xvZ3lcIixcImxpbFwiLFwiY29sbGVjdGluZ1wiLFwiZGFzXCIsXCJleHBvcnRzXCIsXCJvbWFoYVwiLFwidGlyZVwiLFwicGFydGljaXBhbnRcIixcInNjaG9sYXJzaGlwc1wiLFwicmVjcmVhdGlvbmFsXCIsXCJkb21pbmljYW5cIixcImNoYWRcIixcImVsZWN0cm9uXCIsXCJsb2Fkc1wiLFwiZnJpZW5kc2hpcFwiLFwiaGVhdGhlclwiLFwicGFzc3BvcnRcIixcIm1vdGVsXCIsXCJ1bmlvbnNcIixcInRyZWFzdXJ5XCIsXCJ3YXJyYW50XCIsXCJzeXNcIixcInNvbGFyaXNcIixcImZyb3plblwiLFwib2NjdXBpZWRcIixcImpvc2hcIixcInJveWFsdHlcIixcInNjYWxlc1wiLFwicmFsbHlcIixcIm9ic2VydmVyXCIsXCJzdW5zaGluZVwiLFwic3RyYWluXCIsXCJkcmFnXCIsXCJjZXJlbW9ueVwiLFwic29tZWhvd1wiLFwiYXJyZXN0ZWRcIixcImV4cGFuZGluZ1wiLFwicHJvdmluY2lhbFwiLFwiaW52ZXN0aWdhdGlvbnNcIixcImljcVwiLFwicmlwZVwiLFwieWFtYWhhXCIsXCJyZWx5XCIsXCJtZWRpY2F0aW9uc1wiLFwiaGVicmV3XCIsXCJnYWluZWRcIixcInJvY2hlc3RlclwiLFwiZHlpbmdcIixcImxhdW5kcnlcIixcInN0dWNrXCIsXCJzb2xvbW9uXCIsXCJwbGFjaW5nXCIsXCJzdG9wc1wiLFwiaG9tZXdvcmtcIixcImFkanVzdFwiLFwiYXNzZXNzZWRcIixcImFkdmVydGlzZXJcIixcImVuYWJsaW5nXCIsXCJlbmNyeXB0aW9uXCIsXCJmaWxsaW5nXCIsXCJkb3dubG9hZGFibGVcIixcInNvcGhpc3RpY2F0ZWRcIixcImltcG9zZWRcIixcInNpbGVuY2VcIixcInNjc2lcIixcImZvY3VzZXNcIixcInNvdmlldFwiLFwicG9zc2Vzc2lvblwiLFwiY3VcIixcImxhYm9yYXRvcmllc1wiLFwidHJlYXR5XCIsXCJ2b2NhbFwiLFwidHJhaW5lclwiLFwib3JnYW5cIixcInN0cm9uZ2VyXCIsXCJ2b2x1bWVzXCIsXCJhZHZhbmNlc1wiLFwidmVnZXRhYmxlc1wiLFwibGVtb25cIixcInRveGljXCIsXCJkbnNcIixcInRodW1ibmFpbHNcIixcImRhcmtuZXNzXCIsXCJwdHlcIixcIndzXCIsXCJudXRzXCIsXCJuYWlsXCIsXCJiaXpyYXRlXCIsXCJ2aWVubmFcIixcImltcGxpZWRcIixcInNwYW5cIixcInN0YW5mb3JkXCIsXCJzb3hcIixcInN0b2NraW5nc1wiLFwiam9rZVwiLFwicmVzcG9uZGVudFwiLFwicGFja2luZ1wiLFwic3RhdHV0ZVwiLFwicmVqZWN0ZWRcIixcInNhdGlzZnlcIixcImRlc3Ryb3llZFwiLFwic2hlbHRlclwiLFwiY2hhcGVsXCIsXCJnYW1lc3BvdFwiLFwibWFudWZhY3R1cmVcIixcImxheWVyc1wiLFwid29yZHByZXNzXCIsXCJndWlkZWRcIixcInZ1bG5lcmFiaWxpdHlcIixcImFjY291bnRhYmlsaXR5XCIsXCJjZWxlYnJhdGVcIixcImFjY3JlZGl0ZWRcIixcImFwcGxpYW5jZVwiLFwiY29tcHJlc3NlZFwiLFwiYmFoYW1hc1wiLFwicG93ZWxsXCIsXCJtaXh0dXJlXCIsXCJiZW5jaFwiLFwidW5pdlwiLFwidHViXCIsXCJyaWRlclwiLFwic2NoZWR1bGluZ1wiLFwicmFkaXVzXCIsXCJwZXJzcGVjdGl2ZXNcIixcIm1vcnRhbGl0eVwiLFwibG9nZ2luZ1wiLFwiaGFtcHRvblwiLFwiY2hyaXN0aWFuc1wiLFwiYm9yZGVyc1wiLFwidGhlcmFwZXV0aWNcIixcInBhZHNcIixcImJ1dHRzXCIsXCJpbm5zXCIsXCJib2JieVwiLFwiaW1wcmVzc2l2ZVwiLFwic2hlZXBcIixcImFjY29yZGluZ2x5XCIsXCJhcmNoaXRlY3RcIixcInJhaWxyb2FkXCIsXCJsZWN0dXJlc1wiLFwiY2hhbGxlbmdpbmdcIixcIndpbmVzXCIsXCJudXJzZXJ5XCIsXCJoYXJkZXJcIixcImN1cHNcIixcImFzaFwiLFwibWljcm93YXZlXCIsXCJjaGVhcGVzdFwiLFwiYWNjaWRlbnRzXCIsXCJ0cmF2ZXN0aVwiLFwicmVsb2NhdGlvblwiLFwic3R1YXJ0XCIsXCJjb250cmlidXRvcnNcIixcInNhbHZhZG9yXCIsXCJhbGlcIixcInNhbGFkXCIsXCJucFwiLFwibW9ucm9lXCIsXCJ0ZW5kZXJcIixcInZpb2xhdGlvbnNcIixcImZvYW1cIixcInRlbXBlcmF0dXJlc1wiLFwicGFzdGVcIixcImNsb3Vkc1wiLFwiY29tcGV0aXRpb25zXCIsXCJkaXNjcmV0aW9uXCIsXCJ0ZnRcIixcInRhbnphbmlhXCIsXCJwcmVzZXJ2ZVwiLFwianZjXCIsXCJwb2VtXCIsXCJ1bnNpZ25lZFwiLFwic3RheWluZ1wiLFwiY29zbWV0aWNzXCIsXCJlYXN0ZXJcIixcInRoZW9yaWVzXCIsXCJyZXBvc2l0b3J5XCIsXCJwcmFpc2VcIixcImplcmVteVwiLFwidmVuaWNlXCIsXCJqb1wiLFwiY29uY2VudHJhdGlvbnNcIixcInZpYnJhdG9yc1wiLFwiZXN0b25pYVwiLFwiY2hyaXN0aWFuaXR5XCIsXCJ2ZXRlcmFuXCIsXCJzdHJlYW1zXCIsXCJsYW5kaW5nXCIsXCJzaWduaW5nXCIsXCJleGVjdXRlZFwiLFwia2F0aWVcIixcIm5lZ290aWF0aW9uc1wiLFwicmVhbGlzdGljXCIsXCJkdFwiLFwiY2dpXCIsXCJzaG93Y2FzZVwiLFwiaW50ZWdyYWxcIixcImFza3NcIixcInJlbGF4XCIsXCJuYW1pYmlhXCIsXCJnZW5lcmF0aW5nXCIsXCJjaHJpc3RpbmFcIixcImNvbmdyZXNzaW9uYWxcIixcInN5bm9wc2lzXCIsXCJoYXJkbHlcIixcInByYWlyaWVcIixcInJldW5pb25cIixcImNvbXBvc2VyXCIsXCJiZWFuXCIsXCJzd29yZFwiLFwiYWJzZW50XCIsXCJwaG90b2dyYXBoaWNcIixcInNlbGxzXCIsXCJlY3VhZG9yXCIsXCJob3BpbmdcIixcImFjY2Vzc2VkXCIsXCJzcGlyaXRzXCIsXCJtb2RpZmljYXRpb25zXCIsXCJjb3JhbFwiLFwicGl4ZWxcIixcImZsb2F0XCIsXCJjb2xpblwiLFwiYmlhc1wiLFwiaW1wb3J0ZWRcIixcInBhdGhzXCIsXCJidWJibGVcIixcInBvclwiLFwiYWNxdWlyZVwiLFwiY29udHJhcnlcIixcIm1pbGxlbm5pdW1cIixcInRyaWJ1bmVcIixcInZlc3NlbFwiLFwiYWNpZHNcIixcImZvY3VzaW5nXCIsXCJ2aXJ1c2VzXCIsXCJjaGVhcGVyXCIsXCJhZG1pdHRlZFwiLFwiZGFpcnlcIixcImFkbWl0XCIsXCJtZW1cIixcImZhbmN5XCIsXCJlcXVhbGl0eVwiLFwic2Ftb2FcIixcImdjXCIsXCJhY2hpZXZpbmdcIixcInRhcFwiLFwic3RpY2tlcnNcIixcImZpc2hlcmllc1wiLFwiZXhjZXB0aW9uc1wiLFwicmVhY3Rpb25zXCIsXCJsZWFzaW5nXCIsXCJsYXVyZW5cIixcImJlbGllZnNcIixcImNpXCIsXCJtYWNyb21lZGlhXCIsXCJjb21wYW5pb25cIixcInNxdWFkXCIsXCJhbmFseXplXCIsXCJhc2hsZXlcIixcInNjcm9sbFwiLFwicmVsYXRlXCIsXCJkaXZpc2lvbnNcIixcInN3aW1cIixcIndhZ2VzXCIsXCJhZGRpdGlvbmFsbHlcIixcInN1ZmZlclwiLFwiZm9yZXN0c1wiLFwiZmVsbG93c2hpcFwiLFwibmFub1wiLFwiaW52YWxpZFwiLFwiY29uY2VydHNcIixcIm1hcnRpYWxcIixcIm1hbGVzXCIsXCJ2aWN0b3JpYW5cIixcInJldGFpblwiLFwiY29sb3Vyc1wiLFwiZXhlY3V0ZVwiLFwidHVubmVsXCIsXCJnZW5yZXNcIixcImNhbWJvZGlhXCIsXCJwYXRlbnRzXCIsXCJjb3B5cmlnaHRzXCIsXCJ5blwiLFwiY2hhb3NcIixcImxpdGh1YW5pYVwiLFwibWFzdGVyY2FyZFwiLFwid2hlYXRcIixcImNocm9uaWNsZXNcIixcIm9idGFpbmluZ1wiLFwiYmVhdmVyXCIsXCJ1cGRhdGluZ1wiLFwiZGlzdHJpYnV0ZVwiLFwicmVhZGluZ3NcIixcImRlY29yYXRpdmVcIixcImtpamlqaVwiLFwiY29uZnVzZWRcIixcImNvbXBpbGVyXCIsXCJlbmxhcmdlbWVudFwiLFwiZWFnbGVzXCIsXCJiYXNlc1wiLFwidmlpXCIsXCJhY2N1c2VkXCIsXCJiZWVcIixcImNhbXBhaWduc1wiLFwidW5pdHlcIixcImxvdWRcIixcImNvbmp1bmN0aW9uXCIsXCJicmlkZVwiLFwicmF0c1wiLFwiZGVmaW5lc1wiLFwiYWlycG9ydHNcIixcImluc3RhbmNlc1wiLFwiaW5kaWdlbm91c1wiLFwiYmVndW5cIixcImNmclwiLFwiYnJ1bmV0dGVcIixcInBhY2tldHNcIixcImFuY2hvclwiLFwic29ja3NcIixcInZhbGlkYXRpb25cIixcInBhcmFkZVwiLFwiY29ycnVwdGlvblwiLFwic3RhdFwiLFwidHJpZ2dlclwiLFwiaW5jZW50aXZlc1wiLFwiY2hvbGVzdGVyb2xcIixcImdhdGhlcmVkXCIsXCJlc3NleFwiLFwic2xvdmVuaWFcIixcIm5vdGlmaWVkXCIsXCJkaWZmZXJlbnRpYWxcIixcImJlYWNoZXNcIixcImZvbGRlcnNcIixcImRyYW1hdGljXCIsXCJzdXJmYWNlc1wiLFwidGVycmlibGVcIixcInJvdXRlcnNcIixcImNydXpcIixcInBlbmRhbnRcIixcImRyZXNzZXNcIixcImJhcHRpc3RcIixcInNjaWVudGlzdFwiLFwic3RhcnNtZXJjaGFudFwiLFwiaGlyaW5nXCIsXCJjbG9ja3NcIixcImFydGhyaXRpc1wiLFwiYmlvc1wiLFwiZmVtYWxlc1wiLFwid2FsbGFjZVwiLFwibmV2ZXJ0aGVsZXNzXCIsXCJyZWZsZWN0c1wiLFwidGF4YXRpb25cIixcImZldmVyXCIsXCJwbWNcIixcImN1aXNpbmVcIixcInN1cmVseVwiLFwicHJhY3RpdGlvbmVyc1wiLFwidHJhbnNjcmlwdFwiLFwibXlzcGFjZVwiLFwidGhlb3JlbVwiLFwiaW5mbGF0aW9uXCIsXCJ0aGVlXCIsXCJuYlwiLFwicnV0aFwiLFwicHJheVwiLFwic3R5bHVzXCIsXCJjb21wb3VuZHNcIixcInBvcGVcIixcImRydW1zXCIsXCJjb250cmFjdGluZ1wiLFwiYXJub2xkXCIsXCJzdHJ1Y3R1cmVkXCIsXCJyZWFzb25hYmx5XCIsXCJqZWVwXCIsXCJjaGlja3NcIixcImJhcmVcIixcImh1bmdcIixcImNhdHRsZVwiLFwibWJhXCIsXCJyYWRpY2FsXCIsXCJncmFkdWF0ZXNcIixcInJvdmVyXCIsXCJyZWNvbW1lbmRzXCIsXCJjb250cm9sbGluZ1wiLFwidHJlYXN1cmVcIixcInJlbG9hZFwiLFwiZGlzdHJpYnV0b3JzXCIsXCJmbGFtZVwiLFwibGV2aXRyYVwiLFwidGFua3NcIixcImFzc3VtaW5nXCIsXCJtb25ldGFyeVwiLFwiZWxkZXJseVwiLFwicGl0XCIsXCJhcmxpbmd0b25cIixcIm1vbm9cIixcInBhcnRpY2xlc1wiLFwiZmxvYXRpbmdcIixcImV4dHJhb3JkaW5hcnlcIixcInRpbGVcIixcImluZGljYXRpbmdcIixcImJvbGl2aWFcIixcInNwZWxsXCIsXCJob3R0ZXN0XCIsXCJzdGV2ZW5zXCIsXCJjb29yZGluYXRlXCIsXCJrdXdhaXRcIixcImV4Y2x1c2l2ZWx5XCIsXCJlbWlseVwiLFwiYWxsZWdlZFwiLFwibGltaXRhdGlvblwiLFwid2lkZXNjcmVlblwiLFwiY29tcGlsZVwiLFwic3F1aXJ0aW5nXCIsXCJ3ZWJzdGVyXCIsXCJzdHJ1Y2tcIixcInJ4XCIsXCJpbGx1c3RyYXRpb25cIixcInBseW1vdXRoXCIsXCJ3YXJuaW5nc1wiLFwiY29uc3RydWN0XCIsXCJhcHBzXCIsXCJpbnF1aXJpZXNcIixcImJyaWRhbFwiLFwiYW5uZXhcIixcIm1hZ1wiLFwiZ3NtXCIsXCJpbnNwaXJhdGlvblwiLFwidHJpYmFsXCIsXCJjdXJpb3VzXCIsXCJhZmZlY3RpbmdcIixcImZyZWlnaHRcIixcInJlYmF0ZVwiLFwibWVldHVwXCIsXCJlY2xpcHNlXCIsXCJzdWRhblwiLFwiZGRyXCIsXCJkb3dubG9hZGluZ1wiLFwicmVjXCIsXCJzaHV0dGxlXCIsXCJhZ2dyZWdhdGVcIixcInN0dW5uaW5nXCIsXCJjeWNsZXNcIixcImFmZmVjdHNcIixcImZvcmVjYXN0c1wiLFwiZGV0ZWN0XCIsXCJhY3RpdmVseVwiLFwiY2lhb1wiLFwiYW1wbGFuZFwiLFwia25lZVwiLFwicHJlcFwiLFwicGJcIixcImNvbXBsaWNhdGVkXCIsXCJjaGVtXCIsXCJmYXN0ZXN0XCIsXCJidXRsZXJcIixcInNob3B6aWxsYVwiLFwiaW5qdXJlZFwiLFwiZGVjb3JhdGluZ1wiLFwicGF5cm9sbFwiLFwiY29va2Jvb2tcIixcImV4cHJlc3Npb25zXCIsXCJ0b25cIixcImNvdXJpZXJcIixcInVwbG9hZGVkXCIsXCJzaGFrZXNwZWFyZVwiLFwiaGludHNcIixcImNvbGxhcHNlXCIsXCJhbWVyaWNhc1wiLFwiY29ubmVjdG9yc1wiLFwidHdpbmtzXCIsXCJ1bmxpa2VseVwiLFwib2VcIixcImdpZlwiLFwicHJvc1wiLFwiY29uZmxpY3RzXCIsXCJ0ZWNobm9cIixcImJldmVyYWdlXCIsXCJ0cmlidXRlXCIsXCJ3aXJlZFwiLFwiZWx2aXNcIixcImltbXVuZVwiLFwibGF0dmlhXCIsXCJ0cmF2ZWxlcnNcIixcImZvcmVzdHJ5XCIsXCJiYXJyaWVyc1wiLFwiY2FudFwiLFwiamRcIixcInJhcmVseVwiLFwiZ3BsXCIsXCJpbmZlY3RlZFwiLFwib2ZmZXJpbmdzXCIsXCJtYXJ0aGFcIixcImdlbmVzaXNcIixcImJhcnJpZXJcIixcImFyZ3VlXCIsXCJpbmNvcnJlY3RcIixcInRyYWluc1wiLFwibWV0YWxzXCIsXCJiaWN5Y2xlXCIsXCJmdXJuaXNoaW5nc1wiLFwibGV0dGluZ1wiLFwiYXJpc2VcIixcImd1YXRlbWFsYVwiLFwiY2VsdGljXCIsXCJ0aGVyZWJ5XCIsXCJpcmNcIixcImphbWllXCIsXCJwYXJ0aWNsZVwiLFwicGVyY2VwdGlvblwiLFwibWluZXJhbHNcIixcImFkdmlzZVwiLFwiaHVtaWRpdHlcIixcImJvdHRsZXNcIixcImJveGluZ1wiLFwid3lcIixcImRtXCIsXCJiYW5na29rXCIsXCJyZW5haXNzYW5jZVwiLFwicGF0aG9sb2d5XCIsXCJzYXJhXCIsXCJicmFcIixcIm9yZGluYW5jZVwiLFwiaHVnaGVzXCIsXCJwaG90b2dyYXBoZXJzXCIsXCJpbmZlY3Rpb25zXCIsXCJqZWZmcmV5XCIsXCJjaGVzc1wiLFwib3BlcmF0ZXNcIixcImJyaXNiYW5lXCIsXCJjb25maWd1cmVkXCIsXCJzdXJ2aXZlXCIsXCJvc2NhclwiLFwiZmVzdGl2YWxzXCIsXCJtZW51c1wiLFwiam9hblwiLFwicG9zc2liaWxpdGllc1wiLFwiZHVja1wiLFwicmV2ZWFsXCIsXCJjYW5hbFwiLFwiYW1pbm9cIixcInBoaVwiLFwiY29udHJpYnV0aW5nXCIsXCJoZXJic1wiLFwiY2xpbmljc1wiLFwibWxzXCIsXCJjb3dcIixcIm1hbml0b2JhXCIsXCJhbmFseXRpY2FsXCIsXCJtaXNzaW9uc1wiLFwid2F0c29uXCIsXCJseWluZ1wiLFwiY29zdHVtZXNcIixcInN0cmljdFwiLFwiZGl2ZVwiLFwic2FkZGFtXCIsXCJjaXJjdWxhdGlvblwiLFwiZHJpbGxcIixcIm9mZmVuc2VcIixcImJyeWFuXCIsXCJjZXRcIixcInByb3Rlc3RcIixcImFzc3VtcHRpb25cIixcImplcnVzYWxlbVwiLFwiaG9iYnlcIixcInRyaWVzXCIsXCJ0cmFuc2V4dWFsZXNcIixcImludmVudGlvblwiLFwibmlja25hbWVcIixcImZpamlcIixcInRlY2huaWNpYW5cIixcImlubGluZVwiLFwiZXhlY3V0aXZlc1wiLFwiZW5xdWlyaWVzXCIsXCJ3YXNoaW5nXCIsXCJhdWRpXCIsXCJzdGFmZmluZ1wiLFwiY29nbml0aXZlXCIsXCJleHBsb3JpbmdcIixcInRyaWNrXCIsXCJlbnF1aXJ5XCIsXCJjbG9zdXJlXCIsXCJyYWlkXCIsXCJwcGNcIixcInRpbWJlclwiLFwidm9sdFwiLFwiaW50ZW5zZVwiLFwiZGl2XCIsXCJwbGF5bGlzdFwiLFwicmVnaXN0cmFyXCIsXCJzaG93ZXJzXCIsXCJzdXBwb3J0ZXJzXCIsXCJydWxpbmdcIixcInN0ZWFkeVwiLFwiZGlydFwiLFwic3RhdHV0ZXNcIixcIndpdGhkcmF3YWxcIixcIm15ZXJzXCIsXCJkcm9wc1wiLFwicHJlZGljdGVkXCIsXCJ3aWRlclwiLFwic2Fza2F0Y2hld2FuXCIsXCJqY1wiLFwiY2FuY2VsbGF0aW9uXCIsXCJwbHVnaW5zXCIsXCJlbnJvbGxlZFwiLFwic2Vuc29yc1wiLFwic2NyZXdcIixcIm1pbmlzdGVyc1wiLFwicHVibGljbHlcIixcImhvdXJseVwiLFwiYmxhbWVcIixcImdlbmV2YVwiLFwiZnJlZWJzZFwiLFwidmV0ZXJpbmFyeVwiLFwiYWNlclwiLFwicHJvc3RvcmVzXCIsXCJyZXNlbGxlclwiLFwiZGlzdFwiLFwiaGFuZGVkXCIsXCJzdWZmZXJlZFwiLFwiaW50YWtlXCIsXCJpbmZvcm1hbFwiLFwicmVsZXZhbmNlXCIsXCJpbmNlbnRpdmVcIixcImJ1dHRlcmZseVwiLFwidHVjc29uXCIsXCJtZWNoYW5pY3NcIixcImhlYXZpbHlcIixcInN3aW5nZXJzXCIsXCJmaWZ0eVwiLFwiaGVhZGVyc1wiLFwibWlzdGFrZXNcIixcIm51bWVyaWNhbFwiLFwib25zXCIsXCJnZWVrXCIsXCJ1bmNsZVwiLFwiZGVmaW5pbmdcIixcInhueHhcIixcImNvdW50aW5nXCIsXCJyZWZsZWN0aW9uXCIsXCJzaW5rXCIsXCJhY2NvbXBhbmllZFwiLFwiYXNzdXJlXCIsXCJpbnZpdGF0aW9uXCIsXCJkZXZvdGVkXCIsXCJwcmluY2V0b25cIixcImphY29iXCIsXCJzb2RpdW1cIixcInJhbmR5XCIsXCJzcGlyaXR1YWxpdHlcIixcImhvcm1vbmVcIixcIm1lYW53aGlsZVwiLFwicHJvcHJpZXRhcnlcIixcInRpbW90aHlcIixcImNoaWxkcmVuc1wiLFwiYnJpY2tcIixcImdyaXBcIixcIm5hdmFsXCIsXCJ0aHVtYnppbGxhXCIsXCJtZWRpZXZhbFwiLFwicG9yY2VsYWluXCIsXCJhdmlcIixcImJyaWRnZXNcIixcInBpY2h1bnRlclwiLFwiY2FwdHVyZWRcIixcIndhdHRcIixcInRoZWh1blwiLFwiZGVjZW50XCIsXCJjYXN0aW5nXCIsXCJkYXl0b25cIixcInRyYW5zbGF0ZWRcIixcInNob3J0bHlcIixcImNhbWVyb25cIixcImNvbHVtbmlzdHNcIixcInBpbnNcIixcImNhcmxvc1wiLFwicmVub1wiLFwiZG9ubmFcIixcImFuZHJlYXNcIixcIndhcnJpb3JcIixcImRpcGxvbWFcIixcImNhYmluXCIsXCJpbm5vY2VudFwiLFwic2Nhbm5pbmdcIixcImlkZVwiLFwiY29uc2Vuc3VzXCIsXCJwb2xvXCIsXCJ2YWxpdW1cIixcImNvcHlpbmdcIixcInJwZ1wiLFwiZGVsaXZlcmluZ1wiLFwiY29yZGxlc3NcIixcInBhdHJpY2lhXCIsXCJob3JuXCIsXCJlZGRpZVwiLFwidWdhbmRhXCIsXCJmaXJlZFwiLFwiam91cm5hbGlzbVwiLFwicGRcIixcInByb3RcIixcInRyaXZpYVwiLFwiYWRpZGFzXCIsXCJwZXJ0aFwiLFwiZnJvZ1wiLFwiZ3JhbW1hclwiLFwiaW50ZW50aW9uXCIsXCJzeXJpYVwiLFwiZGlzYWdyZWVcIixcImtsZWluXCIsXCJoYXJ2ZXlcIixcInRpcmVzXCIsXCJsb2dzXCIsXCJ1bmRlcnRha2VuXCIsXCJ0Z3BcIixcImhhemFyZFwiLFwicmV0cm9cIixcImxlb1wiLFwibGl2ZXNleFwiLFwic3RhdGV3aWRlXCIsXCJzZW1pY29uZHVjdG9yXCIsXCJncmVnb3J5XCIsXCJlcGlzb2Rlc1wiLFwiYm9vbGVhblwiLFwiY2lyY3VsYXJcIixcImFuZ2VyXCIsXCJkaXlcIixcIm1haW5sYW5kXCIsXCJpbGx1c3RyYXRpb25zXCIsXCJzdWl0c1wiLFwiY2hhbmNlc1wiLFwiaW50ZXJhY3RcIixcInNuYXBcIixcImhhcHBpbmVzc1wiLFwiYXJnXCIsXCJzdWJzdGFudGlhbGx5XCIsXCJiaXphcnJlXCIsXCJnbGVublwiLFwidXJcIixcImF1Y2tsYW5kXCIsXCJvbHltcGljc1wiLFwiZnJ1aXRzXCIsXCJpZGVudGlmaWVyXCIsXCJnZW9cIixcIndvcmxkc2V4XCIsXCJyaWJib25cIixcImNhbGN1bGF0aW9uc1wiLFwiZG9lXCIsXCJqcGVnXCIsXCJjb25kdWN0aW5nXCIsXCJzdGFydHVwXCIsXCJzdXp1a2lcIixcInRyaW5pZGFkXCIsXCJhdGlcIixcImtpc3NpbmdcIixcIndhbFwiLFwiaGFuZHlcIixcInN3YXBcIixcImV4ZW1wdFwiLFwiY3JvcHNcIixcInJlZHVjZXNcIixcImFjY29tcGxpc2hlZFwiLFwiY2FsY3VsYXRvcnNcIixcImdlb21ldHJ5XCIsXCJpbXByZXNzaW9uXCIsXCJhYnNcIixcInNsb3Zha2lhXCIsXCJmbGlwXCIsXCJndWlsZFwiLFwiY29ycmVsYXRpb25cIixcImdvcmdlb3VzXCIsXCJjYXBpdG9sXCIsXCJzaW1cIixcImRpc2hlc1wiLFwicm5hXCIsXCJiYXJiYWRvc1wiLFwiY2hyeXNsZXJcIixcIm5lcnZvdXNcIixcInJlZnVzZVwiLFwiZXh0ZW5kc1wiLFwiZnJhZ3JhbmNlXCIsXCJtY2RvbmFsZFwiLFwicmVwbGljYVwiLFwicGx1bWJpbmdcIixcImJydXNzZWxzXCIsXCJ0cmliZVwiLFwibmVpZ2hib3JzXCIsXCJ0cmFkZXNcIixcInN1cGVyYlwiLFwiYnV6elwiLFwidHJhbnNwYXJlbnRcIixcIm51a2VcIixcInJpZFwiLFwidHJpbml0eVwiLFwiY2hhcmxlc3RvblwiLFwiaGFuZGxlZFwiLFwibGVnZW5kc1wiLFwiYm9vbVwiLFwiY2FsbVwiLFwiY2hhbXBpb25zXCIsXCJmbG9vcnNcIixcInNlbGVjdGlvbnNcIixcInByb2plY3RvcnNcIixcImluYXBwcm9wcmlhdGVcIixcImV4aGF1c3RcIixcImNvbXBhcmluZ1wiLFwic2hhbmdoYWlcIixcInNwZWFrc1wiLFwiYnVydG9uXCIsXCJ2b2NhdGlvbmFsXCIsXCJkYXZpZHNvblwiLFwiY29waWVkXCIsXCJzY290aWFcIixcImZhcm1pbmdcIixcImdpYnNvblwiLFwicGhhcm1hY2llc1wiLFwiZm9ya1wiLFwidHJveVwiLFwibG5cIixcInJvbGxlclwiLFwiaW50cm9kdWNpbmdcIixcImJhdGNoXCIsXCJvcmdhbml6ZVwiLFwiYXBwcmVjaWF0ZWRcIixcImFsdGVyXCIsXCJuaWNvbGVcIixcImxhdGlub1wiLFwiZ2hhbmFcIixcImVkZ2VzXCIsXCJ1Y1wiLFwibWl4aW5nXCIsXCJoYW5kbGVzXCIsXCJza2lsbGVkXCIsXCJmaXR0ZWRcIixcImFsYnVxdWVycXVlXCIsXCJoYXJtb255XCIsXCJkaXN0aW5ndWlzaGVkXCIsXCJhc3RobWFcIixcInByb2plY3RlZFwiLFwiYXNzdW1wdGlvbnNcIixcInNoYXJlaG9sZGVyc1wiLFwidHdpbnNcIixcImRldmVsb3BtZW50YWxcIixcInJpcFwiLFwiem9wZVwiLFwicmVndWxhdGVkXCIsXCJ0cmlhbmdsZVwiLFwiYW1lbmRcIixcImFudGljaXBhdGVkXCIsXCJvcmllbnRhbFwiLFwicmV3YXJkXCIsXCJ3aW5kc29yXCIsXCJ6YW1iaWFcIixcImNvbXBsZXRpbmdcIixcImdtYmhcIixcImJ1ZlwiLFwibGRcIixcImh5ZHJvZ2VuXCIsXCJ3ZWJzaG90c1wiLFwic3ByaW50XCIsXCJjb21wYXJhYmxlXCIsXCJjaGlja1wiLFwiYWR2b2NhdGVcIixcInNpbXNcIixcImNvbmZ1c2lvblwiLFwiY29weXJpZ2h0ZWRcIixcInRyYXlcIixcImlucHV0c1wiLFwid2FycmFudGllc1wiLFwiZ2Vub21lXCIsXCJlc2NvcnRzXCIsXCJkb2N1bWVudGVkXCIsXCJ0aG9uZ1wiLFwibWVkYWxcIixcInBhcGVyYmFja3NcIixcImNvYWNoZXNcIixcInZlc3NlbHNcIixcImhhcmJvdXJcIixcIndhbGtzXCIsXCJzb2xcIixcImtleWJvYXJkc1wiLFwic2FnZVwiLFwia25pdmVzXCIsXCJlY29cIixcInZ1bG5lcmFibGVcIixcImFycmFuZ2VcIixcImFydGlzdGljXCIsXCJiYXRcIixcImhvbm9yc1wiLFwiYm9vdGhcIixcImluZGllXCIsXCJyZWZsZWN0ZWRcIixcInVuaWZpZWRcIixcImJvbmVzXCIsXCJicmVlZFwiLFwiZGV0ZWN0b3JcIixcImlnbm9yZWRcIixcInBvbGFyXCIsXCJmYWxsZW5cIixcInByZWNpc2VcIixcInN1c3NleFwiLFwicmVzcGlyYXRvcnlcIixcIm5vdGlmaWNhdGlvbnNcIixcIm1zZ2lkXCIsXCJ0cmFuc2V4dWFsXCIsXCJtYWluc3RyZWFtXCIsXCJpbnZvaWNlXCIsXCJldmFsdWF0aW5nXCIsXCJsaXBcIixcInN1YmNvbW1pdHRlZVwiLFwic2FwXCIsXCJnYXRoZXJcIixcInN1c2VcIixcIm1hdGVybml0eVwiLFwiYmFja2VkXCIsXCJhbGZyZWRcIixcImNvbG9uaWFsXCIsXCJtZlwiLFwiY2FyZXlcIixcIm1vdGVsc1wiLFwiZm9ybWluZ1wiLFwiZW1iYXNzeVwiLFwiY2F2ZVwiLFwiam91cm5hbGlzdHNcIixcImRhbm55XCIsXCJyZWJlY2NhXCIsXCJzbGlnaHRcIixcInByb2NlZWRzXCIsXCJpbmRpcmVjdFwiLFwiYW1vbmdzdFwiLFwid29vbFwiLFwiZm91bmRhdGlvbnNcIixcIm1zZ3N0clwiLFwiYXJyZXN0XCIsXCJ2b2xsZXliYWxsXCIsXCJtd1wiLFwiYWRpcGV4XCIsXCJob3Jpem9uXCIsXCJudVwiLFwiZGVlcGx5XCIsXCJ0b29sYm94XCIsXCJpY3RcIixcIm1hcmluYVwiLFwibGlhYmlsaXRpZXNcIixcInByaXplc1wiLFwiYm9zbmlhXCIsXCJicm93c2Vyc1wiLFwiZGVjcmVhc2VkXCIsXCJwYXRpb1wiLFwiZHBcIixcInRvbGVyYW5jZVwiLFwic3VyZmluZ1wiLFwiY3JlYXRpdml0eVwiLFwibGxveWRcIixcImRlc2NyaWJpbmdcIixcIm9wdGljc1wiLFwicHVyc3VlXCIsXCJsaWdodG5pbmdcIixcIm92ZXJjb21lXCIsXCJleWVkXCIsXCJvdVwiLFwicXVvdGF0aW9uc1wiLFwiZ3JhYlwiLFwiaW5zcGVjdG9yXCIsXCJhdHRyYWN0XCIsXCJicmlnaHRvblwiLFwiYmVhbnNcIixcImJvb2ttYXJrc1wiLFwiZWxsaXNcIixcImRpc2FibGVcIixcInNuYWtlXCIsXCJzdWNjZWVkXCIsXCJsZW9uYXJkXCIsXCJsZW5kaW5nXCIsXCJvb3BzXCIsXCJyZW1pbmRlclwiLFwieGlcIixcInNlYXJjaGVkXCIsXCJiZWhhdmlvcmFsXCIsXCJyaXZlcnNpZGVcIixcImJhdGhyb29tc1wiLFwicGxhaW5zXCIsXCJza3VcIixcImh0XCIsXCJyYXltb25kXCIsXCJpbnNpZ2h0c1wiLFwiYWJpbGl0aWVzXCIsXCJpbml0aWF0ZWRcIixcInN1bGxpdmFuXCIsXCJ6YVwiLFwibWlkd2VzdFwiLFwia2FyYW9rZVwiLFwidHJhcFwiLFwibG9uZWx5XCIsXCJmb29sXCIsXCJ2ZVwiLFwibm9ucHJvZml0XCIsXCJsYW5jYXN0ZXJcIixcInN1c3BlbmRlZFwiLFwiaGVyZWJ5XCIsXCJvYnNlcnZlXCIsXCJqdWxpYVwiLFwiY29udGFpbmVyc1wiLFwiYXR0aXR1ZGVzXCIsXCJrYXJsXCIsXCJiZXJyeVwiLFwiY29sbGFyXCIsXCJzaW11bHRhbmVvdXNseVwiLFwicmFjaWFsXCIsXCJpbnRlZ3JhdGVcIixcImJlcm11ZGFcIixcImFtYW5kYVwiLFwic29jaW9sb2d5XCIsXCJtb2JpbGVzXCIsXCJzY3JlZW5zaG90XCIsXCJleGhpYml0aW9uc1wiLFwia2Vsa29vXCIsXCJjb25maWRlbnRcIixcInJldHJpZXZlZFwiLFwiZXhoaWJpdHNcIixcIm9mZmljaWFsbHlcIixcImNvbnNvcnRpdW1cIixcImRpZXNcIixcInRlcnJhY2VcIixcImJhY3RlcmlhXCIsXCJwdHNcIixcInJlcGxpZWRcIixcInNlYWZvb2RcIixcIm5vdmVsc1wiLFwicmhcIixcInJycFwiLFwicmVjaXBpZW50c1wiLFwib3VnaHRcIixcImRlbGljaW91c1wiLFwidHJhZGl0aW9uc1wiLFwiZmdcIixcImphaWxcIixcInNhZmVseVwiLFwiZmluaXRlXCIsXCJraWRuZXlcIixcInBlcmlvZGljYWxseVwiLFwiZml4ZXNcIixcInNlbmRzXCIsXCJkdXJhYmxlXCIsXCJtYXpkYVwiLFwiYWxsaWVkXCIsXCJ0aHJvd3NcIixcIm1vaXN0dXJlXCIsXCJodW5nYXJpYW5cIixcInJvc3RlclwiLFwicmVmZXJyaW5nXCIsXCJzeW1hbnRlY1wiLFwic3BlbmNlclwiLFwid2ljaGl0YVwiLFwibmFzZGFxXCIsXCJ1cnVndWF5XCIsXCJvb29cIixcImh6XCIsXCJ0cmFuc2Zvcm1cIixcInRpbWVyXCIsXCJ0YWJsZXRzXCIsXCJ0dW5pbmdcIixcImdvdHRlblwiLFwiZWR1Y2F0b3JzXCIsXCJ0eWxlclwiLFwiZnV0dXJlc1wiLFwidmVnZXRhYmxlXCIsXCJ2ZXJzZVwiLFwiaGlnaHNcIixcImh1bWFuaXRpZXNcIixcImluZGVwZW5kZW50bHlcIixcIndhbnRpbmdcIixcImN1c3RvZHlcIixcInNjcmF0Y2hcIixcImxhdW5jaGVzXCIsXCJpcGFxXCIsXCJhbGlnbm1lbnRcIixcIm1hc3R1cmJhdGluZ1wiLFwiaGVuZGVyc29uXCIsXCJia1wiLFwiYnJpdGFubmljYVwiLFwiY29tbVwiLFwiZWxsZW5cIixcImNvbXBldGl0b3JzXCIsXCJuaHNcIixcInJvY2tldFwiLFwiYXllXCIsXCJidWxsZXRcIixcInRvd2Vyc1wiLFwicmFja3NcIixcImxhY2VcIixcIm5hc3R5XCIsXCJ2aXNpYmlsaXR5XCIsXCJsYXRpdHVkZVwiLFwiY29uc2Npb3VzbmVzc1wiLFwic3RlXCIsXCJ0dW1vclwiLFwidWdseVwiLFwiZGVwb3NpdHNcIixcImJldmVybHlcIixcIm1pc3RyZXNzXCIsXCJlbmNvdW50ZXJcIixcInRydXN0ZWVzXCIsXCJ3YXR0c1wiLFwiZHVuY2FuXCIsXCJyZXByaW50c1wiLFwiaGFydFwiLFwiYmVybmFyZFwiLFwicmVzb2x1dGlvbnNcIixcIm1lbnRcIixcImFjY2Vzc2luZ1wiLFwiZm9ydHlcIixcInR1YmVzXCIsXCJhdHRlbXB0ZWRcIixcImNvbFwiLFwibWlkbGFuZHNcIixcInByaWVzdFwiLFwiZmxveWRcIixcInJvbmFsZFwiLFwiYW5hbHlzdHNcIixcInF1ZXVlXCIsXCJkeFwiLFwic2tcIixcInRyYW5jZVwiLFwibG9jYWxlXCIsXCJuaWNob2xhc1wiLFwiYmlvbFwiLFwieXVcIixcImJ1bmRsZVwiLFwiaGFtbWVyXCIsXCJpbnZhc2lvblwiLFwid2l0bmVzc2VzXCIsXCJydW5uZXJcIixcInJvd3NcIixcImFkbWluaXN0ZXJlZFwiLFwibm90aW9uXCIsXCJzcVwiLFwic2tpbnNcIixcIm1haWxlZFwiLFwib2NcIixcImZ1aml0c3VcIixcInNwZWxsaW5nXCIsXCJhcmN0aWNcIixcImV4YW1zXCIsXCJyZXdhcmRzXCIsXCJiZW5lYXRoXCIsXCJzdHJlbmd0aGVuXCIsXCJkZWZlbmRcIixcImFqXCIsXCJmcmVkZXJpY2tcIixcIm1lZGljYWlkXCIsXCJ0cmVvXCIsXCJpbmZyYXJlZFwiLFwic2V2ZW50aFwiLFwiZ29kc1wiLFwidW5lXCIsXCJ3ZWxzaFwiLFwiYmVsbHlcIixcImFnZ3Jlc3NpdmVcIixcInRleFwiLFwiYWR2ZXJ0aXNlbWVudHNcIixcInF1YXJ0ZXJzXCIsXCJzdG9sZW5cIixcImNpYVwiLFwic3VibGltZWRpcmVjdG9yeVwiLFwic29vbmVzdFwiLFwiaGFpdGlcIixcImRpc3R1cmJlZFwiLFwiZGV0ZXJtaW5lc1wiLFwic2N1bHB0dXJlXCIsXCJwb2x5XCIsXCJlYXJzXCIsXCJkb2RcIixcIndwXCIsXCJmaXN0XCIsXCJuYXR1cmFsc1wiLFwibmVvXCIsXCJtb3RpdmF0aW9uXCIsXCJsZW5kZXJzXCIsXCJwaGFybWFjb2xvZ3lcIixcImZpdHRpbmdcIixcImZpeHR1cmVzXCIsXCJibG9nZ2Vyc1wiLFwibWVyZVwiLFwiYWdyZWVzXCIsXCJwYXNzZW5nZXJzXCIsXCJxdWFudGl0aWVzXCIsXCJwZXRlcnNidXJnXCIsXCJjb25zaXN0ZW50bHlcIixcInBvd2VycG9pbnRcIixcImNvbnNcIixcInN1cnBsdXNcIixcImVsZGVyXCIsXCJzb25pY1wiLFwib2JpdHVhcmllc1wiLFwiY2hlZXJzXCIsXCJkaWdcIixcInRheGlcIixcInB1bmlzaG1lbnRcIixcImFwcHJlY2lhdGlvblwiLFwic3Vic2VxdWVudGx5XCIsXCJvbVwiLFwiYmVsYXJ1c1wiLFwibmF0XCIsXCJ6b25pbmdcIixcImdyYXZpdHlcIixcInByb3ZpZGVuY2VcIixcInRodW1iXCIsXCJyZXN0cmljdGlvblwiLFwiaW5jb3Jwb3JhdGVcIixcImJhY2tncm91bmRzXCIsXCJ0cmVhc3VyZXJcIixcImd1aXRhcnNcIixcImVzc2VuY2VcIixcImZsb29yaW5nXCIsXCJsaWdodHdlaWdodFwiLFwiZXRoaW9waWFcIixcInRwXCIsXCJtaWdodHlcIixcImF0aGxldGVzXCIsXCJodW1hbml0eVwiLFwidHJhbnNjcmlwdGlvblwiLFwiam1cIixcImhvbG1lc1wiLFwiY29tcGxpY2F0aW9uc1wiLFwic2Nob2xhcnNcIixcImRwaVwiLFwic2NyaXB0aW5nXCIsXCJnaXNcIixcInJlbWVtYmVyZWRcIixcImdhbGF4eVwiLFwiY2hlc3RlclwiLFwic25hcHNob3RcIixcImNhcmluZ1wiLFwibG9jXCIsXCJ3b3JuXCIsXCJzeW50aGV0aWNcIixcInNoYXdcIixcInZwXCIsXCJzZWdtZW50c1wiLFwidGVzdGFtZW50XCIsXCJleHBvXCIsXCJkb21pbmFudFwiLFwidHdpc3RcIixcInNwZWNpZmljc1wiLFwiaXR1bmVzXCIsXCJzdG9tYWNoXCIsXCJwYXJ0aWFsbHlcIixcImJ1cmllZFwiLFwiY25cIixcIm5ld2JpZVwiLFwibWluaW1pemVcIixcImRhcndpblwiLFwicmFua3NcIixcIndpbGRlcm5lc3NcIixcImRlYnV0XCIsXCJnZW5lcmF0aW9uc1wiLFwidG91cm5hbWVudHNcIixcImJyYWRsZXlcIixcImRlbnlcIixcImFuYXRvbXlcIixcImJhbGlcIixcImp1ZHlcIixcInNwb25zb3JzaGlwXCIsXCJoZWFkcGhvbmVzXCIsXCJmcmFjdGlvblwiLFwidHJpb1wiLFwicHJvY2VlZGluZ1wiLFwiY3ViZVwiLFwiZGVmZWN0c1wiLFwidm9sa3N3YWdlblwiLFwidW5jZXJ0YWludHlcIixcImJyZWFrZG93blwiLFwibWlsdG9uXCIsXCJtYXJrZXJcIixcInJlY29uc3RydWN0aW9uXCIsXCJzdWJzaWRpYXJ5XCIsXCJzdHJlbmd0aHNcIixcImNsYXJpdHlcIixcInJ1Z3NcIixcInNhbmRyYVwiLFwiYWRlbGFpZGVcIixcImVuY291cmFnaW5nXCIsXCJmdXJuaXNoZWRcIixcIm1vbmFjb1wiLFwic2V0dGxlZFwiLFwiZm9sZGluZ1wiLFwiZW1pcmF0ZXNcIixcInRlcnJvcmlzdHNcIixcImFpcmZhcmVcIixcImNvbXBhcmlzb25zXCIsXCJiZW5lZmljaWFsXCIsXCJkaXN0cmlidXRpb25zXCIsXCJ2YWNjaW5lXCIsXCJiZWxpemVcIixcImZhdGVcIixcInZpZXdwaWN0dXJlXCIsXCJwcm9taXNlZFwiLFwidm9sdm9cIixcInBlbm55XCIsXCJyb2J1c3RcIixcImJvb2tpbmdzXCIsXCJ0aHJlYXRlbmVkXCIsXCJtaW5vbHRhXCIsXCJyZXB1YmxpY2Fuc1wiLFwiZGlzY3Vzc2VzXCIsXCJndWlcIixcInBvcnRlclwiLFwiZ3Jhc1wiLFwianVuZ2xlXCIsXCJ2ZXJcIixcInJuXCIsXCJyZXNwb25kZWRcIixcInJpbVwiLFwiYWJzdHJhY3RzXCIsXCJ6ZW5cIixcIml2b3J5XCIsXCJhbHBpbmVcIixcImRpc1wiLFwicHJlZGljdGlvblwiLFwicGhhcm1hY2V1dGljYWxzXCIsXCJhbmRhbGVcIixcImZhYnVsb3VzXCIsXCJyZW1peFwiLFwiYWxpYXNcIixcInRoZXNhdXJ1c1wiLFwiaW5kaXZpZHVhbGx5XCIsXCJiYXR0bGVmaWVsZFwiLFwibGl0ZXJhbGx5XCIsXCJuZXdlclwiLFwia2F5XCIsXCJlY29sb2dpY2FsXCIsXCJzcGljZVwiLFwib3ZhbFwiLFwiaW1wbGllc1wiLFwiY2dcIixcInNvbWFcIixcInNlclwiLFwiY29vbGVyXCIsXCJhcHByYWlzYWxcIixcImNvbnNpc3RpbmdcIixcIm1hcml0aW1lXCIsXCJwZXJpb2RpY1wiLFwic3VibWl0dGluZ1wiLFwib3ZlcmhlYWRcIixcImFzY2lpXCIsXCJwcm9zcGVjdFwiLFwic2hpcG1lbnRcIixcImJyZWVkaW5nXCIsXCJjaXRhdGlvbnNcIixcImdlb2dyYXBoaWNhbFwiLFwiZG9ub3JcIixcIm1vemFtYmlxdWVcIixcInRlbnNpb25cIixcImhyZWZcIixcImJlbnpcIixcInRyYXNoXCIsXCJzaGFwZXNcIixcIndpZmlcIixcInRpZXJcIixcImZ3ZFwiLFwiZWFybFwiLFwibWFub3JcIixcImVudmVsb3BlXCIsXCJkaWFuZVwiLFwiaG9tZWxhbmRcIixcImRpc2NsYWltZXJzXCIsXCJjaGFtcGlvbnNoaXBzXCIsXCJleGNsdWRlZFwiLFwiYW5kcmVhXCIsXCJicmVlZHNcIixcInJhcGlkc1wiLFwiZGlzY29cIixcInNoZWZmaWVsZFwiLFwiYmFpbGV5XCIsXCJhdXNcIixcImVuZGlmXCIsXCJmaW5pc2hpbmdcIixcImVtb3Rpb25zXCIsXCJ3ZWxsaW5ndG9uXCIsXCJpbmNvbWluZ1wiLFwicHJvc3BlY3RzXCIsXCJsZXhtYXJrXCIsXCJjbGVhbmVyc1wiLFwiYnVsZ2FyaWFuXCIsXCJod3lcIixcImV0ZXJuYWxcIixcImNhc2hpZXJzXCIsXCJndWFtXCIsXCJjaXRlXCIsXCJhYm9yaWdpbmFsXCIsXCJyZW1hcmthYmxlXCIsXCJyb3RhdGlvblwiLFwibmFtXCIsXCJwcmV2ZW50aW5nXCIsXCJwcm9kdWN0aXZlXCIsXCJib3VsZXZhcmRcIixcImV1Z2VuZVwiLFwiaXhcIixcImdkcFwiLFwicGlnXCIsXCJtZXRyaWNcIixcImNvbXBsaWFudFwiLFwibWludXNcIixcInBlbmFsdGllc1wiLFwiYmVubmV0dFwiLFwiaW1hZ2luYXRpb25cIixcImhvdG1haWxcIixcInJlZnVyYmlzaGVkXCIsXCJqb3NodWFcIixcImFybWVuaWFcIixcInZhcmllZFwiLFwiZ3JhbmRlXCIsXCJjbG9zZXN0XCIsXCJhY3RpdmF0ZWRcIixcImFjdHJlc3NcIixcIm1lc3NcIixcImNvbmZlcmVuY2luZ1wiLFwiYXNzaWduXCIsXCJhcm1zdHJvbmdcIixcInBvbGl0aWNpYW5zXCIsXCJ0cmFja2JhY2tzXCIsXCJsaXRcIixcImFjY29tbW9kYXRlXCIsXCJ0aWdlcnNcIixcImF1cm9yYVwiLFwidW5hXCIsXCJzbGlkZXNcIixcIm1pbGFuXCIsXCJwcmVtaWVyZVwiLFwibGVuZGVyXCIsXCJ2aWxsYWdlc1wiLFwic2hhZGVcIixcImNob3J1c1wiLFwiY2hyaXN0aW5lXCIsXCJyaHl0aG1cIixcImRpZ2l0XCIsXCJhcmd1ZWRcIixcImRpZXRhcnlcIixcInN5bXBob255XCIsXCJjbGFya2VcIixcInN1ZGRlblwiLFwiYWNjZXB0aW5nXCIsXCJwcmVjaXBpdGF0aW9uXCIsXCJtYXJpbHluXCIsXCJsaW9uc1wiLFwiZmluZGxhd1wiLFwiYWRhXCIsXCJwb29sc1wiLFwidGJcIixcImx5cmljXCIsXCJjbGFpcmVcIixcImlzb2xhdGlvblwiLFwic3BlZWRzXCIsXCJzdXN0YWluZWRcIixcIm1hdGNoZWRcIixcImFwcHJveGltYXRlXCIsXCJyb3BlXCIsXCJjYXJyb2xsXCIsXCJyYXRpb25hbFwiLFwicHJvZ3JhbW1lclwiLFwiZmlnaHRlcnNcIixcImNoYW1iZXJzXCIsXCJkdW1wXCIsXCJncmVldGluZ3NcIixcImluaGVyaXRlZFwiLFwid2FybWluZ1wiLFwiaW5jb21wbGV0ZVwiLFwidm9jYWxzXCIsXCJjaHJvbmljbGVcIixcImZvdW50YWluXCIsXCJjaHViYnlcIixcImdyYXZlXCIsXCJsZWdpdGltYXRlXCIsXCJiaW9ncmFwaGllc1wiLFwiYnVybmVyXCIsXCJ5cnNcIixcImZvb1wiLFwiaW52ZXN0aWdhdG9yXCIsXCJnYmFcIixcInBsYWludGlmZlwiLFwiZmlubmlzaFwiLFwiZ2VudGxlXCIsXCJibVwiLFwicHJpc29uZXJzXCIsXCJkZWVwZXJcIixcIm11c2xpbXNcIixcImhvc2VcIixcIm1lZGl0ZXJyYW5lYW5cIixcIm5pZ2h0bGlmZVwiLFwiZm9vdGFnZVwiLFwiaG93dG9cIixcIndvcnRoeVwiLFwicmV2ZWFsc1wiLFwiYXJjaGl0ZWN0c1wiLFwic2FpbnRzXCIsXCJlbnRyZXByZW5ldXJcIixcImNhcnJpZXNcIixcInNpZ1wiLFwiZnJlZWxhbmNlXCIsXCJkdW9cIixcImV4Y2Vzc2l2ZVwiLFwiZGV2b25cIixcInNjcmVlbnNhdmVyXCIsXCJoZWxlbmFcIixcInNhdmVzXCIsXCJyZWdhcmRlZFwiLFwidmFsdWF0aW9uXCIsXCJ1bmV4cGVjdGVkXCIsXCJjaWdhcmV0dGVcIixcImZvZ1wiLFwiY2hhcmFjdGVyaXN0aWNcIixcIm1hcmlvblwiLFwibG9iYnlcIixcImVneXB0aWFuXCIsXCJ0dW5pc2lhXCIsXCJtZXRhbGxpY2FcIixcIm91dGxpbmVkXCIsXCJjb25zZXF1ZW50bHlcIixcImhlYWRsaW5lXCIsXCJ0cmVhdGluZ1wiLFwicHVuY2hcIixcImFwcG9pbnRtZW50c1wiLFwic3RyXCIsXCJnb3R0YVwiLFwiY293Ym95XCIsXCJuYXJyYXRpdmVcIixcImJhaHJhaW5cIixcImVub3Jtb3VzXCIsXCJrYXJtYVwiLFwiY29uc2lzdFwiLFwiYmV0dHlcIixcInF1ZWVuc1wiLFwiYWNhZGVtaWNzXCIsXCJwdWJzXCIsXCJxdWFudGl0YXRpdmVcIixcInNoZW1hbGVzXCIsXCJsdWNhc1wiLFwic2NyZWVuc2F2ZXJzXCIsXCJzdWJkaXZpc2lvblwiLFwidHJpYmVzXCIsXCJ2aXBcIixcImRlZmVhdFwiLFwiY2xpY2tzXCIsXCJkaXN0aW5jdGlvblwiLFwiaG9uZHVyYXNcIixcIm5hdWdodHlcIixcImhhemFyZHNcIixcImluc3VyZWRcIixcImhhcnBlclwiLFwibGl2ZXN0b2NrXCIsXCJtYXJkaVwiLFwiZXhlbXB0aW9uXCIsXCJ0ZW5hbnRcIixcInN1c3RhaW5hYmlsaXR5XCIsXCJjYWJpbmV0c1wiLFwidGF0dG9vXCIsXCJzaGFrZVwiLFwiYWxnZWJyYVwiLFwic2hhZG93c1wiLFwiaG9sbHlcIixcImZvcm1hdHRpbmdcIixcInNpbGx5XCIsXCJudXRyaXRpb25hbFwiLFwieWVhXCIsXCJtZXJjeVwiLFwiaGFydGZvcmRcIixcImZyZWVseVwiLFwibWFyY3VzXCIsXCJzdW5yaXNlXCIsXCJ3cmFwcGluZ1wiLFwibWlsZFwiLFwiZnVyXCIsXCJuaWNhcmFndWFcIixcIndlYmxvZ3NcIixcInRpbWVsaW5lXCIsXCJ0YXJcIixcImJlbG9uZ3NcIixcInJqXCIsXCJyZWFkaWx5XCIsXCJhZmZpbGlhdGlvblwiLFwic29jXCIsXCJmZW5jZVwiLFwibnVkaXN0XCIsXCJpbmZpbml0ZVwiLFwiZGlhbmFcIixcImVuc3VyZXNcIixcInJlbGF0aXZlc1wiLFwibGluZHNheVwiLFwiY2xhblwiLFwibGVnYWxseVwiLFwic2hhbWVcIixcInNhdGlzZmFjdG9yeVwiLFwicmV2b2x1dGlvbmFyeVwiLFwiYnJhY2VsZXRzXCIsXCJzeW5jXCIsXCJjaXZpbGlhblwiLFwidGVsZXBob255XCIsXCJtZXNhXCIsXCJmYXRhbFwiLFwicmVtZWR5XCIsXCJyZWFsdG9yc1wiLFwiYnJlYXRoaW5nXCIsXCJicmllZmx5XCIsXCJ0aGlja25lc3NcIixcImFkanVzdG1lbnRzXCIsXCJncmFwaGljYWxcIixcImdlbml1c1wiLFwiZGlzY3Vzc2luZ1wiLFwiYWVyb3NwYWNlXCIsXCJmaWdodGVyXCIsXCJtZWFuaW5nZnVsXCIsXCJmbGVzaFwiLFwicmV0cmVhdFwiLFwiYWRhcHRlZFwiLFwiYmFyZWx5XCIsXCJ3aGVyZXZlclwiLFwiZXN0YXRlc1wiLFwicnVnXCIsXCJkZW1vY3JhdFwiLFwiYm9yb3VnaFwiLFwibWFpbnRhaW5zXCIsXCJmYWlsaW5nXCIsXCJzaG9ydGN1dHNcIixcImthXCIsXCJyZXRhaW5lZFwiLFwidm95ZXVyd2ViXCIsXCJwYW1lbGFcIixcImFuZHJld3NcIixcIm1hcmJsZVwiLFwiZXh0ZW5kaW5nXCIsXCJqZXNzZVwiLFwic3BlY2lmaWVzXCIsXCJodWxsXCIsXCJsb2dpdGVjaFwiLFwic3VycmV5XCIsXCJicmllZmluZ1wiLFwiYmVsa2luXCIsXCJkZW1cIixcImFjY3JlZGl0YXRpb25cIixcIndhdlwiLFwiYmxhY2tiZXJyeVwiLFwiaGlnaGxhbmRcIixcIm1lZGl0YXRpb25cIixcIm1vZHVsYXJcIixcIm1pY3JvcGhvbmVcIixcIm1hY2Vkb25pYVwiLFwiY29tYmluaW5nXCIsXCJicmFuZG9uXCIsXCJpbnN0cnVtZW50YWxcIixcImdpYW50c1wiLFwib3JnYW5pemluZ1wiLFwic2hlZFwiLFwiYmFsbG9vblwiLFwibW9kZXJhdG9yc1wiLFwid2luc3RvblwiLFwibWVtb1wiLFwiaGFtXCIsXCJzb2x2ZWRcIixcInRpZGVcIixcImthemFraHN0YW5cIixcImhhd2FpaWFuXCIsXCJzdGFuZGluZ3NcIixcInBhcnRpdGlvblwiLFwiaW52aXNpYmxlXCIsXCJncmF0dWl0XCIsXCJjb25zb2xlc1wiLFwiZnVua1wiLFwiZmJpXCIsXCJxYXRhclwiLFwibWFnbmV0XCIsXCJ0cmFuc2xhdGlvbnNcIixcInBvcnNjaGVcIixcImNheW1hblwiLFwiamFndWFyXCIsXCJyZWVsXCIsXCJzaGVlclwiLFwiY29tbW9kaXR5XCIsXCJwb3NpbmdcIixcImtpbG9tZXRlcnNcIixcInJwXCIsXCJiaW5kXCIsXCJ0aGFua3NnaXZpbmdcIixcInJhbmRcIixcImhvcGtpbnNcIixcInVyZ2VudFwiLFwiZ3VhcmFudGVlc1wiLFwiaW5mYW50c1wiLFwiZ290aGljXCIsXCJjeWxpbmRlclwiLFwid2l0Y2hcIixcImJ1Y2tcIixcImluZGljYXRpb25cIixcImVoXCIsXCJjb25ncmF0dWxhdGlvbnNcIixcInRiYVwiLFwiY29oZW5cIixcInNpZVwiLFwidXNnc1wiLFwicHVwcHlcIixcImthdGh5XCIsXCJhY3JlXCIsXCJncmFwaHNcIixcInN1cnJvdW5kXCIsXCJjaWdhcmV0dGVzXCIsXCJyZXZlbmdlXCIsXCJleHBpcmVzXCIsXCJlbmVtaWVzXCIsXCJsb3dzXCIsXCJjb250cm9sbGVyc1wiLFwiYXF1YVwiLFwiY2hlblwiLFwiZW1tYVwiLFwiY29uc3VsdGFuY3lcIixcImZpbmFuY2VzXCIsXCJhY2NlcHRzXCIsXCJlbmpveWluZ1wiLFwiY29udmVudGlvbnNcIixcImV2YVwiLFwicGF0cm9sXCIsXCJzbWVsbFwiLFwicGVzdFwiLFwiaGNcIixcIml0YWxpYW5vXCIsXCJjb29yZGluYXRlc1wiLFwicmNhXCIsXCJmcFwiLFwiY2Fybml2YWxcIixcInJvdWdobHlcIixcInN0aWNrZXJcIixcInByb21pc2VzXCIsXCJyZXNwb25kaW5nXCIsXCJyZWVmXCIsXCJwaHlzaWNhbGx5XCIsXCJkaXZpZGVcIixcInN0YWtlaG9sZGVyc1wiLFwiaHlkcm9jb2RvbmVcIixcImdzdFwiLFwiY29uc2VjdXRpdmVcIixcImNvcm5lbGxcIixcInNhdGluXCIsXCJib25cIixcImRlc2VydmVcIixcImF0dGVtcHRpbmdcIixcIm1haWx0b1wiLFwicHJvbW9cIixcImpqXCIsXCJyZXByZXNlbnRhdGlvbnNcIixcImNoYW5cIixcIndvcnJpZWRcIixcInR1bmVzXCIsXCJnYXJiYWdlXCIsXCJjb21wZXRpbmdcIixcImNvbWJpbmVzXCIsXCJtYXNcIixcImJldGhcIixcImJyYWRmb3JkXCIsXCJsZW5cIixcInBocmFzZXNcIixcImthaVwiLFwicGVuaW5zdWxhXCIsXCJjaGVsc2VhXCIsXCJib3JpbmdcIixcInJleW5vbGRzXCIsXCJkb21cIixcImppbGxcIixcImFjY3VyYXRlbHlcIixcInNwZWVjaGVzXCIsXCJyZWFjaGVzXCIsXCJzY2hlbWFcIixcImNvbnNpZGVyc1wiLFwic29mYVwiLFwiY2F0YWxvZ3NcIixcIm1pbmlzdHJpZXNcIixcInZhY2FuY2llc1wiLFwicXVpenplc1wiLFwicGFybGlhbWVudGFyeVwiLFwib2JqXCIsXCJwcmVmaXhcIixcImx1Y2lhXCIsXCJzYXZhbm5haFwiLFwiYmFycmVsXCIsXCJ0eXBpbmdcIixcIm5lcnZlXCIsXCJkYW5zXCIsXCJwbGFuZXRzXCIsXCJkZWZpY2l0XCIsXCJib3VsZGVyXCIsXCJwb2ludGluZ1wiLFwicmVuZXdcIixcImNvdXBsZWRcIixcInZpaWlcIixcIm15YW5tYXJcIixcIm1ldGFkYXRhXCIsXCJoYXJvbGRcIixcImNpcmN1aXRzXCIsXCJmbG9wcHlcIixcInRleHR1cmVcIixcImhhbmRiYWdzXCIsXCJqYXJcIixcImV2XCIsXCJzb21lcnNldFwiLFwiaW5jdXJyZWRcIixcImFja25vd2xlZGdlXCIsXCJ0aG9yb3VnaGx5XCIsXCJhbnRpZ3VhXCIsXCJub3R0aW5naGFtXCIsXCJ0aHVuZGVyXCIsXCJ0ZW50XCIsXCJjYXV0aW9uXCIsXCJpZGVudGlmaWVzXCIsXCJxdWVzdGlvbm5haXJlXCIsXCJxdWFsaWZpY2F0aW9uXCIsXCJsb2Nrc1wiLFwibW9kZWxsaW5nXCIsXCJuYW1lbHlcIixcIm1pbmlhdHVyZVwiLFwiZGVwdFwiLFwiaGFja1wiLFwiZGFyZVwiLFwiZXVyb3NcIixcImludGVyc3RhdGVcIixcInBpcmF0ZXNcIixcImFlcmlhbFwiLFwiaGF3a1wiLFwiY29uc2VxdWVuY2VcIixcInJlYmVsXCIsXCJzeXN0ZW1hdGljXCIsXCJwZXJjZWl2ZWRcIixcIm9yaWdpbnNcIixcImhpcmVkXCIsXCJtYWtldXBcIixcInRleHRpbGVcIixcImxhbWJcIixcIm1hZGFnYXNjYXJcIixcIm5hdGhhblwiLFwidG9iYWdvXCIsXCJwcmVzZW50aW5nXCIsXCJjb3NcIixcInRyb3VibGVzaG9vdGluZ1wiLFwidXpiZWtpc3RhblwiLFwiaW5kZXhlc1wiLFwicGFjXCIsXCJybFwiLFwiZXJwXCIsXCJjZW50dXJpZXNcIixcImdsXCIsXCJtYWduaXR1ZGVcIixcInVpXCIsXCJyaWNoYXJkc29uXCIsXCJoaW5kdVwiLFwiZGhcIixcImZyYWdyYW5jZXNcIixcInZvY2FidWxhcnlcIixcImxpY2tpbmdcIixcImVhcnRocXVha2VcIixcInZwblwiLFwiZnVuZHJhaXNpbmdcIixcImZjY1wiLFwibWFya2Vyc1wiLFwid2VpZ2h0c1wiLFwiYWxiYW5pYVwiLFwiZ2VvbG9naWNhbFwiLFwiYXNzZXNzaW5nXCIsXCJsYXN0aW5nXCIsXCJ3aWNrZWRcIixcImVkc1wiLFwiaW50cm9kdWNlc1wiLFwia2lsbHNcIixcInJvb21tYXRlXCIsXCJ3ZWJjYW1zXCIsXCJwdXNoZWRcIixcIndlYm1hc3RlcnNcIixcInJvXCIsXCJkZlwiLFwiY29tcHV0YXRpb25hbFwiLFwiYWNkYmVudGl0eVwiLFwicGFydGljaXBhdGVkXCIsXCJqdW5rXCIsXCJoYW5kaGVsZHNcIixcIndheFwiLFwibHVjeVwiLFwiYW5zd2VyaW5nXCIsXCJoYW5zXCIsXCJpbXByZXNzZWRcIixcInNsb3BlXCIsXCJyZWdnYWVcIixcImZhaWx1cmVzXCIsXCJwb2V0XCIsXCJjb25zcGlyYWN5XCIsXCJzdXJuYW1lXCIsXCJ0aGVvbG9neVwiLFwibmFpbHNcIixcImV2aWRlbnRcIixcIndoYXRzXCIsXCJyaWRlc1wiLFwicmVoYWJcIixcImVwaWNcIixcInNhdHVyblwiLFwib3JnYW5pemVyXCIsXCJudXRcIixcImFsbGVyZ3lcIixcInNha2VcIixcInR3aXN0ZWRcIixcImNvbWJpbmF0aW9uc1wiLFwicHJlY2VkaW5nXCIsXCJtZXJpdFwiLFwiZW56eW1lXCIsXCJjdW11bGF0aXZlXCIsXCJ6c2hvcHNcIixcInBsYW5lc1wiLFwiZWRtb250b25cIixcInRhY2tsZVwiLFwiZGlza3NcIixcImNvbmRvXCIsXCJwb2tlbW9uXCIsXCJhbXBsaWZpZXJcIixcImFtYmllblwiLFwiYXJiaXRyYXJ5XCIsXCJwcm9taW5lbnRcIixcInJldHJpZXZlXCIsXCJsZXhpbmd0b25cIixcInZlcm5vblwiLFwic2Fuc1wiLFwid29ybGRjYXRcIixcInRpdGFuaXVtXCIsXCJpcnNcIixcImZhaXJ5XCIsXCJidWlsZHNcIixcImNvbnRhY3RlZFwiLFwic2hhZnRcIixcImxlYW5cIixcImJ5ZVwiLFwiY2R0XCIsXCJyZWNvcmRlcnNcIixcIm9jY2FzaW9uYWxcIixcImxlc2xpZVwiLFwiY2FzaW9cIixcImRldXRzY2hlXCIsXCJhbmFcIixcInBvc3RpbmdzXCIsXCJpbm5vdmF0aW9uc1wiLFwia2l0dHlcIixcInBvc3RjYXJkc1wiLFwiZHVkZVwiLFwiZHJhaW5cIixcIm1vbnRlXCIsXCJmaXJlc1wiLFwiYWxnZXJpYVwiLFwiYmxlc3NlZFwiLFwibHVpc1wiLFwicmV2aWV3aW5nXCIsXCJjYXJkaWZmXCIsXCJjb3Jud2FsbFwiLFwiZmF2b3JzXCIsXCJwb3RhdG9cIixcInBhbmljXCIsXCJleHBsaWNpdGx5XCIsXCJzdGlja3NcIixcImxlb25lXCIsXCJ0cmFuc3NleHVhbFwiLFwiZXpcIixcImNpdGl6ZW5zaGlwXCIsXCJleGN1c2VcIixcInJlZm9ybXNcIixcImJhc2VtZW50XCIsXCJvbmlvblwiLFwic3RyYW5kXCIsXCJwZlwiLFwic2FuZHdpY2hcIixcInV3XCIsXCJsYXdzdWl0XCIsXCJhbHRvXCIsXCJpbmZvcm1hdGl2ZVwiLFwiZ2lybGZyaWVuZFwiLFwiYmxvb21iZXJnXCIsXCJjaGVxdWVcIixcImhpZXJhcmNoeVwiLFwiaW5mbHVlbmNlZFwiLFwiYmFubmVyc1wiLFwicmVqZWN0XCIsXCJlYXVcIixcImFiYW5kb25lZFwiLFwiYmRcIixcImNpcmNsZXNcIixcIml0YWxpY1wiLFwiYmVhdHNcIixcIm1lcnJ5XCIsXCJtaWxcIixcInNjdWJhXCIsXCJnb3JlXCIsXCJjb21wbGVtZW50XCIsXCJjdWx0XCIsXCJkYXNoXCIsXCJwYXNzaXZlXCIsXCJtYXVyaXRpdXNcIixcInZhbHVlZFwiLFwiY2FnZVwiLFwiY2hlY2tsaXN0XCIsXCJiYW5nYnVzXCIsXCJyZXF1ZXN0aW5nXCIsXCJjb3VyYWdlXCIsXCJ2ZXJkZVwiLFwibGF1ZGVyZGFsZVwiLFwic2NlbmFyaW9zXCIsXCJnYXpldHRlXCIsXCJoaXRhY2hpXCIsXCJkaXZ4XCIsXCJleHRyYWN0aW9uXCIsXCJiYXRtYW5cIixcImVsZXZhdGlvblwiLFwiaGVhcmluZ3NcIixcImNvbGVtYW5cIixcImh1Z2hcIixcImxhcFwiLFwidXRpbGl6YXRpb25cIixcImJldmVyYWdlc1wiLFwiY2FsaWJyYXRpb25cIixcImpha2VcIixcImV2YWxcIixcImVmZmljaWVudGx5XCIsXCJhbmFoZWltXCIsXCJwaW5nXCIsXCJ0ZXh0Ym9va1wiLFwiZHJpZWRcIixcImVudGVydGFpbmluZ1wiLFwicHJlcmVxdWlzaXRlXCIsXCJsdXRoZXJcIixcImZyb250aWVyXCIsXCJzZXR0bGVcIixcInN0b3BwaW5nXCIsXCJyZWZ1Z2Vlc1wiLFwia25pZ2h0c1wiLFwiaHlwb3RoZXNpc1wiLFwicGFsbWVyXCIsXCJtZWRpY2luZXNcIixcImZsdXhcIixcImRlcmJ5XCIsXCJzYW9cIixcInBlYWNlZnVsXCIsXCJhbHRlcmVkXCIsXCJwb250aWFjXCIsXCJyZWdyZXNzaW9uXCIsXCJkb2N0cmluZVwiLFwic2NlbmljXCIsXCJ0cmFpbmVyc1wiLFwibXV6ZVwiLFwiZW5oYW5jZW1lbnRzXCIsXCJyZW5ld2FibGVcIixcImludGVyc2VjdGlvblwiLFwicGFzc3dvcmRzXCIsXCJzZXdpbmdcIixcImNvbnNpc3RlbmN5XCIsXCJjb2xsZWN0b3JzXCIsXCJjb25jbHVkZVwiLFwicmVjb2duaXNlZFwiLFwibXVuaWNoXCIsXCJvbWFuXCIsXCJjZWxlYnNcIixcImdtY1wiLFwicHJvcG9zZVwiLFwiaGhcIixcImF6ZXJiYWlqYW5cIixcImxpZ2h0ZXJcIixcInJhZ2VcIixcImFkc2xcIixcInVoXCIsXCJwcml4XCIsXCJhc3Ryb2xvZ3lcIixcImFkdmlzb3JzXCIsXCJwYXZpbGlvblwiLFwidGFjdGljc1wiLFwidHJ1c3RzXCIsXCJvY2N1cnJpbmdcIixcInN1cHBsZW1lbnRhbFwiLFwidHJhdmVsbGluZ1wiLFwidGFsZW50ZWRcIixcImFubmllXCIsXCJwaWxsb3dcIixcImluZHVjdGlvblwiLFwiZGVyZWtcIixcInByZWNpc2VseVwiLFwic2hvcnRlclwiLFwiaGFybGV5XCIsXCJzcHJlYWRpbmdcIixcInByb3ZpbmNlc1wiLFwicmVseWluZ1wiLFwiZmluYWxzXCIsXCJwYXJhZ3VheVwiLFwic3RlYWxcIixcInBhcmNlbFwiLFwicmVmaW5lZFwiLFwiZmRcIixcImJvXCIsXCJmaWZ0ZWVuXCIsXCJ3aWRlc3ByZWFkXCIsXCJpbmNpZGVuY2VcIixcImZlYXJzXCIsXCJwcmVkaWN0XCIsXCJib3V0aXF1ZVwiLFwiYWNyeWxpY1wiLFwicm9sbGVkXCIsXCJ0dW5lclwiLFwiYXZvblwiLFwiaW5jaWRlbnRzXCIsXCJwZXRlcnNvblwiLFwicmF5c1wiLFwiYXNuXCIsXCJzaGFubm9uXCIsXCJ0b2RkbGVyXCIsXCJlbmhhbmNpbmdcIixcImZsYXZvclwiLFwiYWxpa2VcIixcIndhbHRcIixcImhvbWVsZXNzXCIsXCJob3JyaWJsZVwiLFwiaHVuZ3J5XCIsXCJtZXRhbGxpY1wiLFwiYWNuZVwiLFwiYmxvY2tlZFwiLFwiaW50ZXJmZXJlbmNlXCIsXCJ3YXJyaW9yc1wiLFwicGFsZXN0aW5lXCIsXCJsaXN0cHJpY2VcIixcImxpYnNcIixcInVuZG9cIixcImNhZGlsbGFjXCIsXCJhdG1vc3BoZXJpY1wiLFwibWFsYXdpXCIsXCJ3bVwiLFwicGtcIixcInNhZ2VtXCIsXCJrbm93bGVkZ2VzdG9ybVwiLFwiZGFuYVwiLFwiaGFsb1wiLFwicHBtXCIsXCJjdXJ0aXNcIixcInBhcmVudGFsXCIsXCJyZWZlcmVuY2VkXCIsXCJzdHJpa2VzXCIsXCJsZXNzZXJcIixcInB1YmxpY2l0eVwiLFwibWFyYXRob25cIixcImFudFwiLFwicHJvcG9zaXRpb25cIixcImdheXNcIixcInByZXNzaW5nXCIsXCJnYXNvbGluZVwiLFwiYXB0XCIsXCJkcmVzc2VkXCIsXCJzY291dFwiLFwiYmVsZmFzdFwiLFwiZXhlY1wiLFwiZGVhbHRcIixcIm5pYWdhcmFcIixcImluZlwiLFwiZW9zXCIsXCJ3YXJjcmFmdFwiLFwiY2hhcm1zXCIsXCJjYXRhbHlzdFwiLFwidHJhZGVyXCIsXCJidWNrc1wiLFwiYWxsb3dhbmNlXCIsXCJ2Y3JcIixcImRlbmlhbFwiLFwidXJpXCIsXCJkZXNpZ25hdGlvblwiLFwidGhyb3duXCIsXCJwcmVwYWlkXCIsXCJyYWlzZXNcIixcImdlbVwiLFwiZHVwbGljYXRlXCIsXCJlbGVjdHJvXCIsXCJjcml0ZXJpb25cIixcImJhZGdlXCIsXCJ3cmlzdFwiLFwiY2l2aWxpemF0aW9uXCIsXCJhbmFseXplZFwiLFwidmlldG5hbWVzZVwiLFwiaGVhdGhcIixcInRyZW1lbmRvdXNcIixcImJhbGxvdFwiLFwibGV4dXNcIixcInZhcnlpbmdcIixcInJlbWVkaWVzXCIsXCJ2YWxpZGl0eVwiLFwidHJ1c3RlZVwiLFwibWF1aVwiLFwiaGFuZGpvYnNcIixcIndlaWdodGVkXCIsXCJhbmdvbGFcIixcInNxdWlydFwiLFwicGVyZm9ybXNcIixcInBsYXN0aWNzXCIsXCJyZWFsbVwiLFwiY29ycmVjdGVkXCIsXCJqZW5ueVwiLFwiaGVsbWV0XCIsXCJzYWxhcmllc1wiLFwicG9zdGNhcmRcIixcImVsZXBoYW50XCIsXCJ5ZW1lblwiLFwiZW5jb3VudGVyZWRcIixcInRzdW5hbWlcIixcInNjaG9sYXJcIixcIm5pY2tlbFwiLFwiaW50ZXJuYXRpb25hbGx5XCIsXCJzdXJyb3VuZGVkXCIsXCJwc2lcIixcImJ1c2VzXCIsXCJleHBlZGlhXCIsXCJnZW9sb2d5XCIsXCJwY3RcIixcIndiXCIsXCJjcmVhdHVyZXNcIixcImNvYXRpbmdcIixcImNvbW1lbnRlZFwiLFwid2FsbGV0XCIsXCJjbGVhcmVkXCIsXCJzbWlsaWVzXCIsXCJ2aWRzXCIsXCJhY2NvbXBsaXNoXCIsXCJib2F0aW5nXCIsXCJkcmFpbmFnZVwiLFwic2hha2lyYVwiLFwiY29ybmVyc1wiLFwiYnJvYWRlclwiLFwidmVnZXRhcmlhblwiLFwicm91Z2VcIixcInllYXN0XCIsXCJ5YWxlXCIsXCJuZXdmb3VuZGxhbmRcIixcInNuXCIsXCJxbGRcIixcInBhc1wiLFwiY2xlYXJpbmdcIixcImludmVzdGlnYXRlZFwiLFwiZGtcIixcImFtYmFzc2Fkb3JcIixcImNvYXRlZFwiLFwiaW50ZW5kXCIsXCJzdGVwaGFuaWVcIixcImNvbnRhY3RpbmdcIixcInZlZ2V0YXRpb25cIixcImRvb21cIixcImZpbmRhcnRpY2xlc1wiLFwibG91aXNlXCIsXCJrZW5ueVwiLFwic3BlY2lhbGx5XCIsXCJvd2VuXCIsXCJyb3V0aW5lc1wiLFwiaGl0dGluZ1wiLFwieXVrb25cIixcImJlaW5nc1wiLFwiYml0ZVwiLFwiaXNzblwiLFwiYXF1YXRpY1wiLFwicmVsaWFuY2VcIixcImhhYml0c1wiLFwic3RyaWtpbmdcIixcIm15dGhcIixcImluZmVjdGlvdXNcIixcInBvZGNhc3RzXCIsXCJzaW5naFwiLFwiZ2lnXCIsXCJnaWxiZXJ0XCIsXCJzYXNcIixcImZlcnJhcmlcIixcImNvbnRpbnVpdHlcIixcImJyb29rXCIsXCJmdVwiLFwib3V0cHV0c1wiLFwicGhlbm9tZW5vblwiLFwiZW5zZW1ibGVcIixcImluc3VsaW5cIixcImFzc3VyZWRcIixcImJpYmxpY2FsXCIsXCJ3ZWVkXCIsXCJjb25zY2lvdXNcIixcImFjY2VudFwiLFwibXlzaW1vblwiLFwiZWxldmVuXCIsXCJ3aXZlc1wiLFwiYW1iaWVudFwiLFwidXRpbGl6ZVwiLFwibWlsZWFnZVwiLFwib2VjZFwiLFwicHJvc3RhdGVcIixcImFkYXB0b3JcIixcImF1YnVyblwiLFwidW5sb2NrXCIsXCJoeXVuZGFpXCIsXCJwbGVkZ2VcIixcInZhbXBpcmVcIixcImFuZ2VsYVwiLFwicmVsYXRlc1wiLFwibml0cm9nZW5cIixcInhlcm94XCIsXCJkaWNlXCIsXCJtZXJnZXJcIixcInNvZnRiYWxsXCIsXCJyZWZlcnJhbHNcIixcInF1YWRcIixcImRvY2tcIixcImRpZmZlcmVudGx5XCIsXCJmaXJld2lyZVwiLFwibW9kc1wiLFwibmV4dGVsXCIsXCJmcmFtaW5nXCIsXCJvcmdhbmlzZWRcIixcIm11c2ljaWFuXCIsXCJibG9ja2luZ1wiLFwicndhbmRhXCIsXCJzb3J0c1wiLFwiaW50ZWdyYXRpbmdcIixcInZzbmV0XCIsXCJsaW1pdGluZ1wiLFwiZGlzcGF0Y2hcIixcInJldmlzaW9uc1wiLFwicGFwdWFcIixcInJlc3RvcmVkXCIsXCJoaW50XCIsXCJhcm1vclwiLFwicmlkZXJzXCIsXCJjaGFyZ2Vyc1wiLFwicmVtYXJrXCIsXCJkb3plbnNcIixcInZhcmllc1wiLFwibXNpZVwiLFwicmVhc29uaW5nXCIsXCJ3blwiLFwibGl6XCIsXCJyZW5kZXJlZFwiLFwicGlja2luZ1wiLFwiY2hhcml0YWJsZVwiLFwiZ3VhcmRzXCIsXCJhbm5vdGF0ZWRcIixcImNjZFwiLFwic3ZcIixcImNvbnZpbmNlZFwiLFwib3BlbmluZ3NcIixcImJ1eXNcIixcImJ1cmxpbmd0b25cIixcInJlcGxhY2luZ1wiLFwicmVzZWFyY2hlclwiLFwid2F0ZXJzaGVkXCIsXCJjb3VuY2lsc1wiLFwib2NjdXBhdGlvbnNcIixcImFja25vd2xlZGdlZFwiLFwia3J1Z2VyXCIsXCJwb2NrZXRzXCIsXCJncmFubnlcIixcInBvcmtcIixcInp1XCIsXCJlcXVpbGlicml1bVwiLFwidmlyYWxcIixcImlucXVpcmVcIixcInBpcGVzXCIsXCJjaGFyYWN0ZXJpemVkXCIsXCJsYWRlblwiLFwiYXJ1YmFcIixcImNvdHRhZ2VzXCIsXCJyZWFsdG9yXCIsXCJtZXJnZVwiLFwicHJpdmlsZWdlXCIsXCJlZGdhclwiLFwiZGV2ZWxvcHNcIixcInF1YWxpZnlpbmdcIixcImNoYXNzaXNcIixcImR1YmFpXCIsXCJlc3RpbWF0aW9uXCIsXCJiYXJuXCIsXCJwdXNoaW5nXCIsXCJsbHBcIixcImZsZWVjZVwiLFwicGVkaWF0cmljXCIsXCJib2NcIixcImZhcmVcIixcImRnXCIsXCJhc3VzXCIsXCJwaWVyY2VcIixcImFsbGFuXCIsXCJkcmVzc2luZ1wiLFwidGVjaHJlcHVibGljXCIsXCJzcGVybVwiLFwidmdcIixcImJhbGRcIixcImZpbG1lXCIsXCJjcmFwc1wiLFwiZnVqaVwiLFwiZnJvc3RcIixcImxlb25cIixcImluc3RpdHV0ZXNcIixcIm1vbGRcIixcImRhbWVcIixcImZvXCIsXCJzYWxseVwiLFwieWFjaHRcIixcInRyYWN5XCIsXCJwcmVmZXJzXCIsXCJkcmlsbGluZ1wiLFwiYnJvY2h1cmVzXCIsXCJoZXJiXCIsXCJ0bXBcIixcImFsb3RcIixcImF0ZVwiLFwiYnJlYWNoXCIsXCJ3aGFsZVwiLFwidHJhdmVsbGVyXCIsXCJhcHByb3ByaWF0aW9uc1wiLFwic3VzcGVjdGVkXCIsXCJ0b21hdG9lc1wiLFwiYmVuY2htYXJrXCIsXCJiZWdpbm5lcnNcIixcImluc3RydWN0b3JzXCIsXCJoaWdobGlnaHRlZFwiLFwiYmVkZm9yZFwiLFwic3RhdGlvbmVyeVwiLFwiaWRsZVwiLFwibXVzdGFuZ1wiLFwidW5hdXRob3JpemVkXCIsXCJjbHVzdGVyc1wiLFwiYW50aWJvZHlcIixcImNvbXBldGVudFwiLFwibW9tZW50dW1cIixcImZpblwiLFwid2lyaW5nXCIsXCJpb1wiLFwicGFzdG9yXCIsXCJtdWRcIixcImNhbHZpblwiLFwidW5pXCIsXCJzaGFya1wiLFwiY29udHJpYnV0b3JcIixcImRlbW9uc3RyYXRlc1wiLFwicGhhc2VzXCIsXCJncmF0ZWZ1bFwiLFwiZW1lcmFsZFwiLFwiZ3JhZHVhbGx5XCIsXCJsYXVnaGluZ1wiLFwiZ3Jvd3NcIixcImNsaWZmXCIsXCJkZXNpcmFibGVcIixcInRyYWN0XCIsXCJ1bFwiLFwiYmFsbGV0XCIsXCJvbFwiLFwiam91cm5hbGlzdFwiLFwiYWJyYWhhbVwiLFwianNcIixcImJ1bXBlclwiLFwiYWZ0ZXJ3YXJkc1wiLFwid2VicGFnZVwiLFwicmVsaWdpb25zXCIsXCJnYXJsaWNcIixcImhvc3RlbHNcIixcInNoaW5lXCIsXCJzZW5lZ2FsXCIsXCJleHBsb3Npb25cIixcInBuXCIsXCJiYW5uZWRcIixcIndlbmR5XCIsXCJicmllZnNcIixcInNpZ25hdHVyZXNcIixcImRpZmZzXCIsXCJjb3ZlXCIsXCJtdW1iYWlcIixcIm96b25lXCIsXCJkaXNjaXBsaW5lc1wiLFwiY2FzYVwiLFwibXVcIixcImRhdWdodGVyc1wiLFwiY29udmVyc2F0aW9uc1wiLFwicmFkaW9zXCIsXCJ0YXJpZmZcIixcIm52aWRpYVwiLFwib3Bwb25lbnRcIixcInBhc3RhXCIsXCJzaW1wbGlmaWVkXCIsXCJtdXNjbGVzXCIsXCJzZXJ1bVwiLFwid3JhcHBlZFwiLFwic3dpZnRcIixcIm1vdGhlcmJvYXJkXCIsXCJydW50aW1lXCIsXCJpbmJveFwiLFwiZm9jYWxcIixcImJpYmxpb2dyYXBoaWNcIixcImVkZW5cIixcImRpc3RhbnRcIixcImluY2xcIixcImNoYW1wYWduZVwiLFwiYWxhXCIsXCJkZWNpbWFsXCIsXCJocVwiLFwiZGV2aWF0aW9uXCIsXCJzdXBlcmludGVuZGVudFwiLFwicHJvcGVjaWFcIixcImRpcFwiLFwibmJjXCIsXCJzYW1iYVwiLFwiaG9zdGVsXCIsXCJob3VzZXdpdmVzXCIsXCJlbXBsb3lcIixcIm1vbmdvbGlhXCIsXCJwZW5ndWluXCIsXCJtYWdpY2FsXCIsXCJpbmZsdWVuY2VzXCIsXCJpbnNwZWN0aW9uc1wiLFwiaXJyaWdhdGlvblwiLFwibWlyYWNsZVwiLFwibWFudWFsbHlcIixcInJlcHJpbnRcIixcInJlaWRcIixcInd0XCIsXCJoeWRyYXVsaWNcIixcImNlbnRlcmVkXCIsXCJyb2JlcnRzb25cIixcImZsZXhcIixcInllYXJseVwiLFwicGVuZXRyYXRpb25cIixcIndvdW5kXCIsXCJiZWxsZVwiLFwicm9zYVwiLFwiY29udmljdGlvblwiLFwiaGFzaFwiLFwib21pc3Npb25zXCIsXCJ3cml0aW5nc1wiLFwiaGFtYnVyZ1wiLFwibGF6eVwiLFwibXZcIixcIm1wZ1wiLFwicmV0cmlldmFsXCIsXCJxdWFsaXRpZXNcIixcImNpbmR5XCIsXCJmYXRoZXJzXCIsXCJjYXJiXCIsXCJjaGFyZ2luZ1wiLFwiY2FzXCIsXCJtYXJ2ZWxcIixcImxpbmVkXCIsXCJjaW9cIixcImRvd1wiLFwicHJvdG90eXBlXCIsXCJpbXBvcnRhbnRseVwiLFwicmJcIixcInBldGl0ZVwiLFwiYXBwYXJhdHVzXCIsXCJ1cGNcIixcInRlcnJhaW5cIixcImR1aVwiLFwicGVuc1wiLFwiZXhwbGFpbmluZ1wiLFwieWVuXCIsXCJzdHJpcHNcIixcImdvc3NpcFwiLFwicmFuZ2Vyc1wiLFwibm9taW5hdGlvblwiLFwiZW1waXJpY2FsXCIsXCJtaFwiLFwicm90YXJ5XCIsXCJ3b3JtXCIsXCJkZXBlbmRlbmNlXCIsXCJkaXNjcmV0ZVwiLFwiYmVnaW5uZXJcIixcImJveGVkXCIsXCJsaWRcIixcInNleHVhbGl0eVwiLFwicG9seWVzdGVyXCIsXCJjdWJpY1wiLFwiZGVhZlwiLFwiY29tbWl0bWVudHNcIixcInN1Z2dlc3RpbmdcIixcInNhcHBoaXJlXCIsXCJraW5hc2VcIixcInNraXJ0c1wiLFwibWF0c1wiLFwicmVtYWluZGVyXCIsXCJjcmF3Zm9yZFwiLFwibGFiZWxlZFwiLFwicHJpdmlsZWdlc1wiLFwidGVsZXZpc2lvbnNcIixcInNwZWNpYWxpemluZ1wiLFwibWFya2luZ1wiLFwiY29tbW9kaXRpZXNcIixcInB2Y1wiLFwic2VyYmlhXCIsXCJzaGVyaWZmXCIsXCJncmlmZmluXCIsXCJkZWNsaW5lZFwiLFwiZ3V5YW5hXCIsXCJzcGllc1wiLFwiYmxhaFwiLFwibWltZVwiLFwibmVpZ2hib3JcIixcIm1vdG9yY3ljbGVzXCIsXCJlbGVjdFwiLFwiaGlnaHdheXNcIixcInRoaW5rcGFkXCIsXCJjb25jZW50cmF0ZVwiLFwiaW50aW1hdGVcIixcInJlcHJvZHVjdGl2ZVwiLFwicHJlc3RvblwiLFwiZGVhZGx5XCIsXCJmZW9mXCIsXCJidW5ueVwiLFwiY2hldnlcIixcIm1vbGVjdWxlc1wiLFwicm91bmRzXCIsXCJsb25nZXN0XCIsXCJyZWZyaWdlcmF0b3JcIixcInRpb25zXCIsXCJpbnRlcnZhbHNcIixcInNlbnRlbmNlc1wiLFwiZGVudGlzdHNcIixcInVzZGFcIixcImV4Y2x1c2lvblwiLFwid29ya3N0YXRpb25cIixcImhvbG9jYXVzdFwiLFwia2VlblwiLFwiZmx5ZXJcIixcInBlYXNcIixcImRvc2FnZVwiLFwicmVjZWl2ZXJzXCIsXCJ1cmxzXCIsXCJjdXN0b21pc2VcIixcImRpc3Bvc2l0aW9uXCIsXCJ2YXJpYW5jZVwiLFwibmF2aWdhdG9yXCIsXCJpbnZlc3RpZ2F0b3JzXCIsXCJjYW1lcm9vblwiLFwiYmFraW5nXCIsXCJtYXJpanVhbmFcIixcImFkYXB0aXZlXCIsXCJjb21wdXRlZFwiLFwibmVlZGxlXCIsXCJiYXRoc1wiLFwiZW5iXCIsXCJnZ1wiLFwiY2F0aGVkcmFsXCIsXCJicmFrZXNcIixcIm9nXCIsXCJuaXJ2YW5hXCIsXCJrb1wiLFwiZmFpcmZpZWxkXCIsXCJvd25zXCIsXCJ0aWxcIixcImludmlzaW9uXCIsXCJzdGlja3lcIixcImRlc3RpbnlcIixcImdlbmVyb3VzXCIsXCJtYWRuZXNzXCIsXCJlbWFjc1wiLFwiY2xpbWJcIixcImJsb3dpbmdcIixcImZhc2NpbmF0aW5nXCIsXCJsYW5kc2NhcGVzXCIsXCJoZWF0ZWRcIixcImxhZmF5ZXR0ZVwiLFwiamFja2llXCIsXCJ3dG9cIixcImNvbXB1dGF0aW9uXCIsXCJoYXlcIixcImNhcmRpb3Zhc2N1bGFyXCIsXCJ3d1wiLFwic3BhcmNcIixcImNhcmRpYWNcIixcInNhbHZhdGlvblwiLFwiZG92ZXJcIixcImFkcmlhblwiLFwicHJlZGljdGlvbnNcIixcImFjY29tcGFueWluZ1wiLFwidmF0aWNhblwiLFwiYnJ1dGFsXCIsXCJsZWFybmVyc1wiLFwiZ2RcIixcInNlbGVjdGl2ZVwiLFwiYXJiaXRyYXRpb25cIixcImNvbmZpZ3VyaW5nXCIsXCJ0b2tlblwiLFwiZWRpdG9yaWFsc1wiLFwiemluY1wiLFwic2FjcmlmaWNlXCIsXCJzZWVrZXJzXCIsXCJndXJ1XCIsXCJpc2FcIixcInJlbW92YWJsZVwiLFwiY29udmVyZ2VuY2VcIixcInlpZWxkc1wiLFwiZ2licmFsdGFyXCIsXCJsZXZ5XCIsXCJzdWl0ZWRcIixcIm51bWVyaWNcIixcImFudGhyb3BvbG9neVwiLFwic2thdGluZ1wiLFwia2luZGFcIixcImFiZXJkZWVuXCIsXCJlbXBlcm9yXCIsXCJncmFkXCIsXCJtYWxwcmFjdGljZVwiLFwiZHlsYW5cIixcImJyYXNcIixcImJlbHRzXCIsXCJibGFja3NcIixcImVkdWNhdGVkXCIsXCJyZWJhdGVzXCIsXCJyZXBvcnRlcnNcIixcImJ1cmtlXCIsXCJwcm91ZGx5XCIsXCJwaXhcIixcIm5lY2Vzc2l0eVwiLFwicmVuZGVyaW5nXCIsXCJtaWNcIixcImluc2VydGVkXCIsXCJwdWxsaW5nXCIsXCJiYXNlbmFtZVwiLFwia3lsZVwiLFwib2Jlc2l0eVwiLFwiY3VydmVzXCIsXCJzdWJ1cmJhblwiLFwidG91cmluZ1wiLFwiY2xhcmFcIixcInZlcnRleFwiLFwiYndcIixcImhlcGF0aXRpc1wiLFwibmF0aW9uYWxseVwiLFwidG9tYXRvXCIsXCJhbmRvcnJhXCIsXCJ3YXRlcnByb29mXCIsXCJleHBpcmVkXCIsXCJtalwiLFwidHJhdmVsc1wiLFwiZmx1c2hcIixcIndhaXZlclwiLFwicGFsZVwiLFwic3BlY2lhbHRpZXNcIixcImhheWVzXCIsXCJodW1hbml0YXJpYW5cIixcImludml0YXRpb25zXCIsXCJmdW5jdGlvbmluZ1wiLFwiZGVsaWdodFwiLFwic3Vydml2b3JcIixcImdhcmNpYVwiLFwiY2luZ3VsYXJcIixcImVjb25vbWllc1wiLFwiYWxleGFuZHJpYVwiLFwiYmFjdGVyaWFsXCIsXCJtb3Nlc1wiLFwiY291bnRlZFwiLFwidW5kZXJ0YWtlXCIsXCJkZWNsYXJlXCIsXCJjb250aW51b3VzbHlcIixcImpvaG5zXCIsXCJ2YWx2ZXNcIixcImdhcHNcIixcImltcGFpcmVkXCIsXCJhY2hpZXZlbWVudHNcIixcImRvbm9yc1wiLFwidGVhclwiLFwiamV3ZWxcIixcInRlZGR5XCIsXCJsZlwiLFwiY29udmVydGlibGVcIixcImF0YVwiLFwidGVhY2hlc1wiLFwidmVudHVyZXNcIixcIm5pbFwiLFwiYnVmaW5nXCIsXCJzdHJhbmdlclwiLFwidHJhZ2VkeVwiLFwianVsaWFuXCIsXCJuZXN0XCIsXCJwYW1cIixcImRyeWVyXCIsXCJwYWluZnVsXCIsXCJ2ZWx2ZXRcIixcInRyaWJ1bmFsXCIsXCJydWxlZFwiLFwibmF0b1wiLFwicGVuc2lvbnNcIixcInByYXllcnNcIixcImZ1bmt5XCIsXCJzZWNyZXRhcmlhdFwiLFwibm93aGVyZVwiLFwiY29wXCIsXCJwYXJhZ3JhcGhzXCIsXCJnYWxlXCIsXCJqb2luc1wiLFwiYWRvbGVzY2VudFwiLFwibm9taW5hdGlvbnNcIixcIndlc2xleVwiLFwiZGltXCIsXCJsYXRlbHlcIixcImNhbmNlbGxlZFwiLFwic2NhcnlcIixcIm1hdHRyZXNzXCIsXCJtcGVnc1wiLFwiYnJ1bmVpXCIsXCJsaWtld2lzZVwiLFwiYmFuYW5hXCIsXCJpbnRyb2R1Y3RvcnlcIixcInNsb3Zha1wiLFwiY2FrZXNcIixcInN0YW5cIixcInJlc2Vydm9pclwiLFwib2NjdXJyZW5jZVwiLFwiaWRvbFwiLFwibWl4ZXJcIixcInJlbWluZFwiLFwid2NcIixcIndvcmNlc3RlclwiLFwic2JqY3RcIixcImRlbW9ncmFwaGljXCIsXCJjaGFybWluZ1wiLFwibWFpXCIsXCJ0b290aFwiLFwiZGlzY2lwbGluYXJ5XCIsXCJhbm5veWluZ1wiLFwicmVzcGVjdGVkXCIsXCJzdGF5c1wiLFwiZGlzY2xvc2VcIixcImFmZmFpclwiLFwiZHJvdmVcIixcIndhc2hlclwiLFwidXBzZXRcIixcInJlc3RyaWN0XCIsXCJzcHJpbmdlclwiLFwiYmVzaWRlXCIsXCJtaW5lc1wiLFwicG9ydHJhaXRzXCIsXCJyZWJvdW5kXCIsXCJsb2dhblwiLFwibWVudG9yXCIsXCJpbnRlcnByZXRlZFwiLFwiZXZhbHVhdGlvbnNcIixcImZvdWdodFwiLFwiYmFnaGRhZFwiLFwiZWxpbWluYXRpb25cIixcIm1ldHJlc1wiLFwiaHlwb3RoZXRpY2FsXCIsXCJpbW1pZ3JhbnRzXCIsXCJjb21wbGltZW50YXJ5XCIsXCJoZWxpY29wdGVyXCIsXCJwZW5jaWxcIixcImZyZWV6ZVwiLFwiaGtcIixcInBlcmZvcm1lclwiLFwiYWJ1XCIsXCJ0aXRsZWRcIixcImNvbW1pc3Npb25zXCIsXCJzcGhlcmVcIixcInBvd2Vyc2VsbGVyXCIsXCJtb3NzXCIsXCJyYXRpb3NcIixcImNvbmNvcmRcIixcImdyYWR1YXRlZFwiLFwiZW5kb3JzZWRcIixcInR5XCIsXCJzdXJwcmlzaW5nXCIsXCJ3YWxudXRcIixcImxhbmNlXCIsXCJsYWRkZXJcIixcIml0YWxpYVwiLFwidW5uZWNlc3NhcnlcIixcImRyYW1hdGljYWxseVwiLFwibGliZXJpYVwiLFwic2hlcm1hblwiLFwiY29ya1wiLFwibWF4aW1pemVcIixcImNqXCIsXCJoYW5zZW5cIixcInNlbmF0b3JzXCIsXCJ3b3Jrb3V0XCIsXCJtYWxpXCIsXCJ5dWdvc2xhdmlhXCIsXCJibGVlZGluZ1wiLFwiY2hhcmFjdGVyaXphdGlvblwiLFwiY29sb25cIixcImxpa2VsaWhvb2RcIixcImxhbmVzXCIsXCJwdXJzZVwiLFwiZnVuZGFtZW50YWxzXCIsXCJjb250YW1pbmF0aW9uXCIsXCJtdHZcIixcImVuZGFuZ2VyZWRcIixcImNvbXByb21pc2VcIixcIm1hc3R1cmJhdGlvblwiLFwib3B0aW1pemVcIixcInN0YXRpbmdcIixcImRvbWVcIixcImNhcm9saW5lXCIsXCJsZXVcIixcImV4cGlyYXRpb25cIixcIm5hbWVzcGFjZVwiLFwiYWxpZ25cIixcInBlcmlwaGVyYWxcIixcImJsZXNzXCIsXCJlbmdhZ2luZ1wiLFwibmVnb3RpYXRpb25cIixcImNyZXN0XCIsXCJvcHBvbmVudHNcIixcInRyaXVtcGhcIixcIm5vbWluYXRlZFwiLFwiY29uZmlkZW50aWFsaXR5XCIsXCJlbGVjdG9yYWxcIixcImNoYW5nZWxvZ1wiLFwid2VsZGluZ1wiLFwiZGVmZXJyZWRcIixcImFsdGVybmF0aXZlbHlcIixcImhlZWxcIixcImFsbG95XCIsXCJjb25kb3NcIixcInBsb3RzXCIsXCJwb2xpc2hlZFwiLFwieWFuZ1wiLFwiZ2VudGx5XCIsXCJncmVlbnNib3JvXCIsXCJ0dWxzYVwiLFwibG9ja2luZ1wiLFwiY2FzZXlcIixcImNvbnRyb3ZlcnNpYWxcIixcImRyYXdzXCIsXCJmcmlkZ2VcIixcImJsYW5rZXRcIixcImJsb29tXCIsXCJxY1wiLFwic2ltcHNvbnNcIixcImxvdVwiLFwiZWxsaW90dFwiLFwicmVjb3ZlcmVkXCIsXCJmcmFzZXJcIixcImp1c3RpZnlcIixcInVwZ3JhZGluZ1wiLFwiYmxhZGVzXCIsXCJwZ3BcIixcImxvb3BzXCIsXCJzdXJnZVwiLFwiZnJvbnRwYWdlXCIsXCJ0cmF1bWFcIixcImF3XCIsXCJ0YWhvZVwiLFwiYWR2ZXJ0XCIsXCJwb3NzZXNzXCIsXCJkZW1hbmRpbmdcIixcImRlZmVuc2l2ZVwiLFwic2lwXCIsXCJmbGFzaGVyc1wiLFwic3ViYXJ1XCIsXCJmb3JiaWRkZW5cIixcInRmXCIsXCJ2YW5pbGxhXCIsXCJwcm9ncmFtbWVyc1wiLFwicGpcIixcIm1vbml0b3JlZFwiLFwiaW5zdGFsbGF0aW9uc1wiLFwiZGV1dHNjaGxhbmRcIixcInBpY25pY1wiLFwic291bHNcIixcImFycml2YWxzXCIsXCJzcGFua1wiLFwiY3dcIixcInByYWN0aXRpb25lclwiLFwibW90aXZhdGVkXCIsXCJ3clwiLFwiZHVtYlwiLFwic21pdGhzb25pYW5cIixcImhvbGxvd1wiLFwidmF1bHRcIixcInNlY3VyZWx5XCIsXCJleGFtaW5pbmdcIixcImZpb3JpY2V0XCIsXCJncm9vdmVcIixcInJldmVsYXRpb25cIixcInJnXCIsXCJwdXJzdWl0XCIsXCJkZWxlZ2F0aW9uXCIsXCJ3aXJlc1wiLFwiYmxcIixcImRpY3Rpb25hcmllc1wiLFwibWFpbHNcIixcImJhY2tpbmdcIixcImdyZWVuaG91c2VcIixcInNsZWVwc1wiLFwidmNcIixcImJsYWtlXCIsXCJ0cmFuc3BhcmVuY3lcIixcImRlZVwiLFwidHJhdmlzXCIsXCJ3eFwiLFwiZW5kbGVzc1wiLFwiZmlndXJlZFwiLFwib3JiaXRcIixcImN1cnJlbmNpZXNcIixcIm5pZ2VyXCIsXCJiYWNvblwiLFwic3Vydml2b3JzXCIsXCJwb3NpdGlvbmluZ1wiLFwiaGVhdGVyXCIsXCJjb2xvbnlcIixcImNhbm5vblwiLFwiY2lyY3VzXCIsXCJwcm9tb3RlZFwiLFwiZm9yYmVzXCIsXCJtYWVcIixcIm1vbGRvdmFcIixcIm1lbFwiLFwiZGVzY2VuZGluZ1wiLFwicGF4aWxcIixcInNwaW5lXCIsXCJ0cm91dFwiLFwiZW5jbG9zZWRcIixcImZlYXRcIixcInRlbXBvcmFyaWx5XCIsXCJudHNjXCIsXCJjb29rZWRcIixcInRocmlsbGVyXCIsXCJ0cmFuc21pdFwiLFwiYXBuaWNcIixcImZhdHR5XCIsXCJnZXJhbGRcIixcInByZXNzZWRcIixcImZyZXF1ZW5jaWVzXCIsXCJzY2FubmVkXCIsXCJyZWZsZWN0aW9uc1wiLFwiaHVuZ2VyXCIsXCJtYXJpYWhcIixcInNpY1wiLFwibXVuaWNpcGFsaXR5XCIsXCJ1c3BzXCIsXCJqb3ljZVwiLFwiZGV0ZWN0aXZlXCIsXCJzdXJnZW9uXCIsXCJjZW1lbnRcIixcImV4cGVyaWVuY2luZ1wiLFwiZmlyZXBsYWNlXCIsXCJlbmRvcnNlbWVudFwiLFwiYmdcIixcInBsYW5uZXJzXCIsXCJkaXNwdXRlc1wiLFwidGV4dGlsZXNcIixcIm1pc3NpbGVcIixcImludHJhbmV0XCIsXCJjbG9zZXNcIixcInNlcVwiLFwicHN5Y2hpYXRyeVwiLFwicGVyc2lzdGVudFwiLFwiZGVib3JhaFwiLFwiY29uZlwiLFwibWFyY29cIixcImFzc2lzdHNcIixcInN1bW1hcmllc1wiLFwiZ2xvd1wiLFwiZ2FicmllbFwiLFwiYXVkaXRvclwiLFwid21hXCIsXCJhcXVhcml1bVwiLFwidmlvbGluXCIsXCJwcm9waGV0XCIsXCJjaXJcIixcImJyYWNrZXRcIixcImxvb2tzbWFydFwiLFwiaXNhYWNcIixcIm94aWRlXCIsXCJvYWtzXCIsXCJtYWduaWZpY2VudFwiLFwiZXJpa1wiLFwiY29sbGVhZ3VlXCIsXCJuYXBsZXNcIixcInByb21wdGx5XCIsXCJtb2RlbXNcIixcImFkYXB0YXRpb25cIixcImh1XCIsXCJoYXJtZnVsXCIsXCJwYWludGJhbGxcIixcInByb3phY1wiLFwic2V4dWFsbHlcIixcImVuY2xvc3VyZVwiLFwiYWNtXCIsXCJkaXZpZGVuZFwiLFwibmV3YXJrXCIsXCJrd1wiLFwicGFzb1wiLFwiZ2x1Y29zZVwiLFwicGhhbnRvbVwiLFwibm9ybVwiLFwicGxheWJhY2tcIixcInN1cGVydmlzb3JzXCIsXCJ3ZXN0bWluc3RlclwiLFwidHVydGxlXCIsXCJpcHNcIixcImRpc3RhbmNlc1wiLFwiYWJzb3JwdGlvblwiLFwidHJlYXN1cmVzXCIsXCJkc2NcIixcIndhcm5lZFwiLFwibmV1cmFsXCIsXCJ3YXJlXCIsXCJmb3NzaWxcIixcIm1pYVwiLFwiaG9tZXRvd25cIixcImJhZGx5XCIsXCJ0cmFuc2NyaXB0c1wiLFwiYXBvbGxvXCIsXCJ3YW5cIixcImRpc2FwcG9pbnRlZFwiLFwicGVyc2lhblwiLFwiY29udGludWFsbHlcIixcImNvbW11bmlzdFwiLFwiY29sbGVjdGlibGVcIixcImhhbmRtYWRlXCIsXCJncmVlbmVcIixcImVudHJlcHJlbmV1cnNcIixcInJvYm90c1wiLFwiZ3JlbmFkYVwiLFwiY3JlYXRpb25zXCIsXCJqYWRlXCIsXCJzY29vcFwiLFwiYWNxdWlzaXRpb25zXCIsXCJmb3VsXCIsXCJrZW5vXCIsXCJndGtcIixcImVhcm5pbmdcIixcIm1haWxtYW5cIixcInNhbnlvXCIsXCJuZXN0ZWRcIixcImJpb2RpdmVyc2l0eVwiLFwiZXhjaXRlbWVudFwiLFwic29tYWxpYVwiLFwibW92ZXJzXCIsXCJ2ZXJiYWxcIixcImJsaW5rXCIsXCJwcmVzZW50bHlcIixcInNlYXNcIixcImNhcmxvXCIsXCJ3b3JrZmxvd1wiLFwibXlzdGVyaW91c1wiLFwibm92ZWx0eVwiLFwiYnJ5YW50XCIsXCJ0aWxlc1wiLFwidm95dWVyXCIsXCJsaWJyYXJpYW5cIixcInN1YnNpZGlhcmllc1wiLFwic3dpdGNoZWRcIixcInN0b2NraG9sbVwiLFwidGFtaWxcIixcImdhcm1pblwiLFwicnVcIixcInBvc2VcIixcImZ1enp5XCIsXCJpbmRvbmVzaWFuXCIsXCJncmFtc1wiLFwidGhlcmFwaXN0XCIsXCJyaWNoYXJkc1wiLFwibXJuYVwiLFwiYnVkZ2V0c1wiLFwidG9vbGtpdFwiLFwicHJvbWlzaW5nXCIsXCJyZWxheGF0aW9uXCIsXCJnb2F0XCIsXCJyZW5kZXJcIixcImNhcm1lblwiLFwiaXJhXCIsXCJzZW5cIixcInRoZXJlYWZ0ZXJcIixcImhhcmR3b29kXCIsXCJlcm90aWNhXCIsXCJ0ZW1wb3JhbFwiLFwic2FpbFwiLFwiZm9yZ2VcIixcImNvbW1pc3Npb25lcnNcIixcImRlbnNlXCIsXCJkdHNcIixcImJyYXZlXCIsXCJmb3J3YXJkaW5nXCIsXCJxdFwiLFwiYXdmdWxcIixcIm5pZ2h0bWFyZVwiLFwiYWlycGxhbmVcIixcInJlZHVjdGlvbnNcIixcInNvdXRoYW1wdG9uXCIsXCJpc3RhbmJ1bFwiLFwiaW1wb3NlXCIsXCJvcmdhbmlzbXNcIixcInNlZ2FcIixcInRlbGVzY29wZVwiLFwidmlld2Vyc1wiLFwiYXNiZXN0b3NcIixcInBvcnRzbW91dGhcIixcImNkbmFcIixcIm1leWVyXCIsXCJlbnRlcnNcIixcInBvZFwiLFwic2F2YWdlXCIsXCJhZHZhbmNlbWVudFwiLFwid3VcIixcImhhcmFzc21lbnRcIixcIndpbGxvd1wiLFwicmVzdW1lc1wiLFwiYm9sdFwiLFwiZ2FnZVwiLFwidGhyb3dpbmdcIixcImV4aXN0ZWRcIixcImdlbmVyYXRvcnNcIixcImx1XCIsXCJ3YWdvblwiLFwiYmFyYmllXCIsXCJkYXRcIixcImZhdm91clwiLFwic29hXCIsXCJrbm9ja1wiLFwidXJnZVwiLFwic210cFwiLFwiZ2VuZXJhdGVzXCIsXCJwb3RhdG9lc1wiLFwidGhvcm91Z2hcIixcInJlcGxpY2F0aW9uXCIsXCJpbmV4cGVuc2l2ZVwiLFwia3VydFwiLFwicmVjZXB0b3JzXCIsXCJwZWVyc1wiLFwicm9sYW5kXCIsXCJvcHRpbXVtXCIsXCJuZW9uXCIsXCJpbnRlcnZlbnRpb25zXCIsXCJxdWlsdFwiLFwiaHVudGluZ3RvblwiLFwiY3JlYXR1cmVcIixcIm91cnNcIixcIm1vdW50c1wiLFwic3lyYWN1c2VcIixcImludGVybnNoaXBcIixcImxvbmVcIixcInJlZnJlc2hcIixcImFsdW1pbml1bVwiLFwic25vd2JvYXJkXCIsXCJiZWFzdGFsaXR5XCIsXCJ3ZWJjYXN0XCIsXCJtaWNoZWxcIixcImV2YW5lc2NlbmNlXCIsXCJzdWJ0bGVcIixcImNvb3JkaW5hdGVkXCIsXCJub3RyZVwiLFwic2hpcG1lbnRzXCIsXCJtYWxkaXZlc1wiLFwic3RyaXBlc1wiLFwiZmlybXdhcmVcIixcImFudGFyY3RpY2FcIixcImNvcGVcIixcInNoZXBoZXJkXCIsXCJsbVwiLFwiY2FuYmVycmFcIixcImNyYWRsZVwiLFwiY2hhbmNlbGxvclwiLFwibWFtYm9cIixcImxpbWVcIixcImtpcmtcIixcImZsb3VyXCIsXCJjb250cm92ZXJzeVwiLFwibGVnZW5kYXJ5XCIsXCJib29sXCIsXCJzeW1wYXRoeVwiLFwiY2hvaXJcIixcImF2b2lkaW5nXCIsXCJiZWF1dGlmdWxseVwiLFwiYmxvbmRcIixcImV4cGVjdHNcIixcImNob1wiLFwianVtcGluZ1wiLFwiZmFicmljc1wiLFwiYW50aWJvZGllc1wiLFwicG9seW1lclwiLFwiaHlnaWVuZVwiLFwid2l0XCIsXCJwb3VsdHJ5XCIsXCJ2aXJ0dWVcIixcImJ1cnN0XCIsXCJleGFtaW5hdGlvbnNcIixcInN1cmdlb25zXCIsXCJib3VxdWV0XCIsXCJpbW11bm9sb2d5XCIsXCJwcm9tb3Rlc1wiLFwibWFuZGF0ZVwiLFwid2lsZXlcIixcImRlcGFydG1lbnRhbFwiLFwiYmJzXCIsXCJzcGFzXCIsXCJpbmRcIixcImNvcnB1c1wiLFwiam9obnN0b25cIixcInRlcm1pbm9sb2d5XCIsXCJnZW50bGVtYW5cIixcImZpYnJlXCIsXCJyZXByb2R1Y2VcIixcImNvbnZpY3RlZFwiLFwic2hhZGVzXCIsXCJqZXRzXCIsXCJpbmRpY2VzXCIsXCJyb29tbWF0ZXNcIixcImFkd2FyZVwiLFwicXVpXCIsXCJpbnRsXCIsXCJ0aHJlYXRlbmluZ1wiLFwic3Bva2VzbWFuXCIsXCJ6b2xvZnRcIixcImFjdGl2aXN0c1wiLFwiZnJhbmtmdXJ0XCIsXCJwcmlzb25lclwiLFwiZGFpc3lcIixcImhhbGlmYXhcIixcImVuY291cmFnZXNcIixcInVsdHJhbVwiLFwiY3Vyc29yXCIsXCJhc3NlbWJsZWRcIixcImVhcmxpZXN0XCIsXCJkb25hdGVkXCIsXCJzdHVmZmVkXCIsXCJyZXN0cnVjdHVyaW5nXCIsXCJpbnNlY3RzXCIsXCJ0ZXJtaW5hbHNcIixcImNydWRlXCIsXCJtb3JyaXNvblwiLFwibWFpZGVuXCIsXCJzaW11bGF0aW9uc1wiLFwiY3pcIixcInN1ZmZpY2llbnRseVwiLFwiZXhhbWluZXNcIixcInZpa2luZ1wiLFwibXlydGxlXCIsXCJib3JlZFwiLFwiY2xlYW51cFwiLFwieWFyblwiLFwia25pdFwiLFwiY29uZGl0aW9uYWxcIixcIm11Z1wiLFwiY3Jvc3N3b3JkXCIsXCJib3RoZXJcIixcImJ1ZGFwZXN0XCIsXCJjb25jZXB0dWFsXCIsXCJrbml0dGluZ1wiLFwiYXR0YWNrZWRcIixcImhsXCIsXCJiaHV0YW5cIixcImxpZWNodGVuc3RlaW5cIixcIm1hdGluZ1wiLFwiY29tcHV0ZVwiLFwicmVkaGVhZFwiLFwiYXJyaXZlc1wiLFwidHJhbnNsYXRvclwiLFwiYXV0b21vYmlsZXNcIixcInRyYWN0b3JcIixcImFsbGFoXCIsXCJjb250aW5lbnRcIixcIm9iXCIsXCJ1bndyYXBcIixcImZhcmVzXCIsXCJsb25naXR1ZGVcIixcInJlc2lzdFwiLFwiY2hhbGxlbmdlZFwiLFwidGVsZWNoYXJnZXJcIixcImhvcGVkXCIsXCJwaWtlXCIsXCJzYWZlclwiLFwiaW5zZXJ0aW9uXCIsXCJpbnN0cnVtZW50YXRpb25cIixcImlkc1wiLFwiaHVnb1wiLFwid2FnbmVyXCIsXCJjb25zdHJhaW50XCIsXCJncm91bmR3YXRlclwiLFwidG91Y2hlZFwiLFwic3RyZW5ndGhlbmluZ1wiLFwiY29sb2duZVwiLFwiZ3ppcFwiLFwid2lzaGluZ1wiLFwicmFuZ2VyXCIsXCJzbWFsbGVzdFwiLFwiaW5zdWxhdGlvblwiLFwibmV3bWFuXCIsXCJtYXJzaFwiLFwicmlja3lcIixcImN0cmxcIixcInNjYXJlZFwiLFwidGhldGFcIixcImluZnJpbmdlbWVudFwiLFwiYmVudFwiLFwibGFvc1wiLFwic3ViamVjdGl2ZVwiLFwibW9uc3RlcnNcIixcImFzeWx1bVwiLFwibGlnaHRib3hcIixcInJvYmJpZVwiLFwic3Rha2VcIixcImNvY2t0YWlsXCIsXCJvdXRsZXRzXCIsXCJzd2F6aWxhbmRcIixcInZhcmlldGllc1wiLFwiYXJib3JcIixcIm1lZGlhd2lraVwiLFwiY29uZmlndXJhdGlvbnNcIixcInBvaXNvblwiLFwiXCJdO1xuXG4vKiBcbiBBc2sgZm9yIHdvcmQgc3VnZ2VzdGlvbnMgdGhhdCB3b3VsZCBmaXQgaW4gYSBjZXJ0YWluIHBhdHRlcm4uXG4gVGhlIHBhdHRlcm4gaXMgZGVmaW5lZCBieSB1c2luZyA/J3MgZm9yIHRoZSBibGFuayBsZXR0ZXJzXG4gQSBtYXhpbXVtIG9mIHRocmVlIGFuZCBhIG1pbmltdW0gb2Ygbm8gd29yZHMgYXJlIHJldHVybmVkLlxuIElmIHRoZSByZXN1bHRpbmcgc2V0IGlzIG1vcmUgdGhhbiB0aHJlZSB3b3JkcywgdGhlIHJlc3VsdGluZyB0aHJlZSBcbiB3aWxsIGJlIHNlbGVjdGVkIHJhbmRvbWx5LlxuIGVnLiBcIj94Pz9yP1wiIG1pZ2h0IHN1Z2dlc3QgXCJqeHdvcmRcIlxuKi9cbmZ1bmN0aW9uIHN1Z2dlc3QocGF0dGVybikge1xuICAgIHBhdHRlcm4gPSBwYXR0ZXJuLnRvTG93ZXJDYXNlKCk7XG4gICAgLy8gRmlyc3QgbGV0J3MganVzdCBjb25zaWRlciB3b3JkcyBvZiB0aGUgY29ycmVjdCBsZW5ndGhcbiAgICBsZXQgbWF0Y2hlcyA9IHdvcmRzLmZpbHRlcih3b3JkID0+IHdvcmQubGVuZ3RoID09PSBwYXR0ZXJuLmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXR0ZXJuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChwYXR0ZXJuW2ldICE9PSBcIj9cIikge1xuICAgICAgICAgICAgbWF0Y2hlcyA9IG1hdGNoZXMuZmlsdGVyKHdvcmQgPT4gd29yZFtpXSA9PT0gcGF0dGVybltpXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG1hdGNoZXMubGVuZ3RoIDw9IDMpIHJldHVybiBtYXRjaGVzO1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgICBsZXQgaW5kZXggPSBNYXRoLnJhbmRvbSgpICogbWF0Y2hlcy5sZW5ndGg7XG4gICAgICAgIHJlc3VsdC5wdXNoKC4uLm1hdGNoZXMuc3BsaWNlKGluZGV4LCAxKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qIHNyYy9RdWVzdGlvbi5zdmVsdGUgZ2VuZXJhdGVkIGJ5IFN2ZWx0ZSB2My40Ni40ICovXG5cbmZ1bmN0aW9uIGdldF9lYWNoX2NvbnRleHQkMyhjdHgsIGxpc3QsIGkpIHtcblx0Y29uc3QgY2hpbGRfY3R4ID0gY3R4LnNsaWNlKCk7XG5cdGNoaWxkX2N0eFsxNl0gPSBsaXN0W2ldO1xuXHRyZXR1cm4gY2hpbGRfY3R4O1xufVxuXG4vLyAoODQ6NCkgezplbHNlfVxuZnVuY3Rpb24gY3JlYXRlX2Vsc2VfYmxvY2skMShjdHgpIHtcblx0bGV0IGRpdjE7XG5cdGxldCBzcGFuMDtcblx0bGV0IHQwX3ZhbHVlID0gLypxdWVzdGlvbiovIGN0eFswXS5udW0gKyBcIlwiO1xuXHRsZXQgdDA7XG5cdGxldCB0MTtcblx0bGV0IHQyO1xuXHRsZXQgc3BhbjE7XG5cdGxldCB0M192YWx1ZSA9ICgvKnF1ZXN0aW9uKi8gY3R4WzBdLnF1ZXN0aW9uIHx8IFwiTm8gcXVlc3Rpb24gc2V0XCIpICsgXCJcIjtcblx0bGV0IHQzO1xuXHRsZXQgdDQ7XG5cdGxldCBzcGFuMjtcblx0bGV0IHQ1O1xuXHRsZXQgdDZfdmFsdWUgPSAvKnF1ZXN0aW9uKi8gY3R4WzBdLmFuc3dlciArIFwiXCI7XG5cdGxldCB0Njtcblx0bGV0IHQ3O1xuXHRsZXQgZGl2MDtcblx0bGV0IG1vdW50ZWQ7XG5cdGxldCBkaXNwb3NlO1xuXHRsZXQgaWZfYmxvY2sgPSAvKnN1Z2dlc3Rpb25zKi8gY3R4WzFdLmxlbmd0aCAmJiBjcmVhdGVfaWZfYmxvY2tfMSQxKGN0eCk7XG5cblx0cmV0dXJuIHtcblx0XHRjKCkge1xuXHRcdFx0ZGl2MSA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRzcGFuMCA9IGVsZW1lbnQoXCJzcGFuXCIpO1xuXHRcdFx0dDAgPSB0ZXh0KHQwX3ZhbHVlKTtcblx0XHRcdHQxID0gdGV4dChcIjpcIik7XG5cdFx0XHR0MiA9IHNwYWNlKCk7XG5cdFx0XHRzcGFuMSA9IGVsZW1lbnQoXCJzcGFuXCIpO1xuXHRcdFx0dDMgPSB0ZXh0KHQzX3ZhbHVlKTtcblx0XHRcdHQ0ID0gc3BhY2UoKTtcblx0XHRcdHNwYW4yID0gZWxlbWVudChcInNwYW5cIik7XG5cdFx0XHR0NSA9IHRleHQoXCJ+IFwiKTtcblx0XHRcdHQ2ID0gdGV4dCh0Nl92YWx1ZSk7XG5cdFx0XHR0NyA9IHNwYWNlKCk7XG5cdFx0XHRkaXYwID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdGlmIChpZl9ibG9jaykgaWZfYmxvY2suYygpO1xuXHRcdFx0YXR0cihzcGFuMCwgXCJjbGFzc1wiLCBcImp4d29yZC1xdWVzdGlvbi1udW1cIik7XG5cdFx0XHRhdHRyKHNwYW4xLCBcImNsYXNzXCIsIFwianh3b3JkLXF1ZXN0aW9uLXF1ZXN0aW9uXCIpO1xuXHRcdFx0YXR0cihzcGFuMiwgXCJjbGFzc1wiLCBcImp4d29yZC1xdWVzdGlvbi1hbnN3ZXJcIik7XG5cdFx0XHRhdHRyKGRpdjAsIFwiY2xhc3NcIiwgXCJqeHdvcmQtc3VnZ2VzdGlvbnNcIik7XG5cdFx0XHRhdHRyKGRpdjEsIFwiY2xhc3NcIiwgXCJqeHdvcmQtcXVlc3Rpb24gc3ZlbHRlLXR3NnZ6bVwiKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGluc2VydCh0YXJnZXQsIGRpdjEsIGFuY2hvcik7XG5cdFx0XHRhcHBlbmQoZGl2MSwgc3BhbjApO1xuXHRcdFx0YXBwZW5kKHNwYW4wLCB0MCk7XG5cdFx0XHRhcHBlbmQoc3BhbjAsIHQxKTtcblx0XHRcdGFwcGVuZChkaXYxLCB0Mik7XG5cdFx0XHRhcHBlbmQoZGl2MSwgc3BhbjEpO1xuXHRcdFx0YXBwZW5kKHNwYW4xLCB0Myk7XG5cdFx0XHRhcHBlbmQoZGl2MSwgdDQpO1xuXHRcdFx0YXBwZW5kKGRpdjEsIHNwYW4yKTtcblx0XHRcdGFwcGVuZChzcGFuMiwgdDUpO1xuXHRcdFx0YXBwZW5kKHNwYW4yLCB0Nik7XG5cdFx0XHRhcHBlbmQoZGl2MSwgdDcpO1xuXHRcdFx0YXBwZW5kKGRpdjEsIGRpdjApO1xuXHRcdFx0aWYgKGlmX2Jsb2NrKSBpZl9ibG9jay5tKGRpdjAsIG51bGwpO1xuXG5cdFx0XHRpZiAoIW1vdW50ZWQpIHtcblx0XHRcdFx0ZGlzcG9zZSA9IGxpc3RlbihkaXYxLCBcImRibGNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRpZiAoaXNfZnVuY3Rpb24oLyplZGl0UXVlc3Rpb24qLyBjdHhbM10oLypxdWVzdGlvbiovIGN0eFswXSkpKSAvKmVkaXRRdWVzdGlvbiovIGN0eFszXSgvKnF1ZXN0aW9uKi8gY3R4WzBdKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRtb3VudGVkID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHAobmV3X2N0eCwgZGlydHkpIHtcblx0XHRcdGN0eCA9IG5ld19jdHg7XG5cdFx0XHRpZiAoZGlydHkgJiAvKnF1ZXN0aW9uKi8gMSAmJiB0MF92YWx1ZSAhPT0gKHQwX3ZhbHVlID0gLypxdWVzdGlvbiovIGN0eFswXS5udW0gKyBcIlwiKSkgc2V0X2RhdGEodDAsIHQwX3ZhbHVlKTtcblx0XHRcdGlmIChkaXJ0eSAmIC8qcXVlc3Rpb24qLyAxICYmIHQzX3ZhbHVlICE9PSAodDNfdmFsdWUgPSAoLypxdWVzdGlvbiovIGN0eFswXS5xdWVzdGlvbiB8fCBcIk5vIHF1ZXN0aW9uIHNldFwiKSArIFwiXCIpKSBzZXRfZGF0YSh0MywgdDNfdmFsdWUpO1xuXHRcdFx0aWYgKGRpcnR5ICYgLypxdWVzdGlvbiovIDEgJiYgdDZfdmFsdWUgIT09ICh0Nl92YWx1ZSA9IC8qcXVlc3Rpb24qLyBjdHhbMF0uYW5zd2VyICsgXCJcIikpIHNldF9kYXRhKHQ2LCB0Nl92YWx1ZSk7XG5cblx0XHRcdGlmICgvKnN1Z2dlc3Rpb25zKi8gY3R4WzFdLmxlbmd0aCkge1xuXHRcdFx0XHRpZiAoaWZfYmxvY2spIHtcblx0XHRcdFx0XHRpZl9ibG9jay5wKGN0eCwgZGlydHkpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGlmX2Jsb2NrID0gY3JlYXRlX2lmX2Jsb2NrXzEkMShjdHgpO1xuXHRcdFx0XHRcdGlmX2Jsb2NrLmMoKTtcblx0XHRcdFx0XHRpZl9ibG9jay5tKGRpdjAsIG51bGwpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKGlmX2Jsb2NrKSB7XG5cdFx0XHRcdGlmX2Jsb2NrLmQoMSk7XG5cdFx0XHRcdGlmX2Jsb2NrID0gbnVsbDtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2goZGl2MSk7XG5cdFx0XHRpZiAoaWZfYmxvY2spIGlmX2Jsb2NrLmQoKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdGRpc3Bvc2UoKTtcblx0XHR9XG5cdH07XG59XG5cbi8vICg3Mzo0KSB7I2lmIHF1ZXN0aW9uLmVkaXRpbmd9XG5mdW5jdGlvbiBjcmVhdGVfaWZfYmxvY2skMShjdHgpIHtcblx0bGV0IGRpdjM7XG5cdGxldCBkaXYwO1xuXHRsZXQgc3Bhbjtcblx0bGV0IHQwX3ZhbHVlID0gLypxdWVzdGlvbiovIGN0eFswXS5udW0gKyBcIlwiO1xuXHRsZXQgdDA7XG5cdGxldCB0MTtcblx0bGV0IGlucHV0O1xuXHRsZXQgdDI7XG5cdGxldCBkaXYxO1xuXHRsZXQgdDNfdmFsdWUgPSAvKnF1ZXN0aW9uKi8gY3R4WzBdLmFuc3dlciArIFwiXCI7XG5cdGxldCB0Mztcblx0bGV0IHQ0O1xuXHRsZXQgZGl2Mjtcblx0bGV0IG1vdW50ZWQ7XG5cdGxldCBkaXNwb3NlO1xuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdGRpdjMgPSBlbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0ZGl2MCA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRzcGFuID0gZWxlbWVudChcInNwYW5cIik7XG5cdFx0XHR0MCA9IHRleHQodDBfdmFsdWUpO1xuXHRcdFx0dDEgPSBzcGFjZSgpO1xuXHRcdFx0aW5wdXQgPSBlbGVtZW50KFwiaW5wdXRcIik7XG5cdFx0XHR0MiA9IHNwYWNlKCk7XG5cdFx0XHRkaXYxID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdHQzID0gdGV4dCh0M192YWx1ZSk7XG5cdFx0XHR0NCA9IHNwYWNlKCk7XG5cdFx0XHRkaXYyID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdGRpdjIudGV4dENvbnRlbnQgPSBcIlNhdmVcIjtcblx0XHRcdGF0dHIoZGl2MCwgXCJjbGFzc1wiLCBcImp4d29yZC1xdWVzdGlvbi1udW1iZXJcIik7XG5cdFx0XHRhdHRyKGlucHV0LCBcInR5cGVcIiwgXCJ0ZXh0XCIpO1xuXHRcdFx0YXR0cihpbnB1dCwgXCJjbGFzc1wiLCBcImp4d29yZC1xdWVzdGlvbi10ZXh0XCIpO1xuXHRcdFx0aW5wdXQuYXV0b2ZvY3VzID0gdHJ1ZTtcblx0XHRcdGF0dHIoZGl2MSwgXCJjbGFzc1wiLCBcImp4d29yZC1xdWVzdGlvbi1hbnN3ZXJcIik7XG5cdFx0XHRhdHRyKGRpdjIsIFwiY2xhc3NcIiwgXCJidG4gc3ZlbHRlLXR3NnZ6bVwiKTtcblx0XHRcdGF0dHIoZGl2MywgXCJjbGFzc1wiLCBcImp4d29yZC1xdWVzdGlvbiBqeHdvcmQtcXVlc3Rpb24tZWRpdGluZyBzdmVsdGUtdHc2dnptXCIpO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0aW5zZXJ0KHRhcmdldCwgZGl2MywgYW5jaG9yKTtcblx0XHRcdGFwcGVuZChkaXYzLCBkaXYwKTtcblx0XHRcdGFwcGVuZChkaXYwLCBzcGFuKTtcblx0XHRcdGFwcGVuZChzcGFuLCB0MCk7XG5cdFx0XHRhcHBlbmQoZGl2MywgdDEpO1xuXHRcdFx0YXBwZW5kKGRpdjMsIGlucHV0KTtcblx0XHRcdHNldF9pbnB1dF92YWx1ZShpbnB1dCwgLypxdWVzdGlvbiovIGN0eFswXS5xdWVzdGlvbik7XG5cdFx0XHRhcHBlbmQoZGl2MywgdDIpO1xuXHRcdFx0YXBwZW5kKGRpdjMsIGRpdjEpO1xuXHRcdFx0YXBwZW5kKGRpdjEsIHQzKTtcblx0XHRcdGFwcGVuZChkaXYzLCB0NCk7XG5cdFx0XHRhcHBlbmQoZGl2MywgZGl2Mik7XG5cdFx0XHRpbnB1dC5mb2N1cygpO1xuXG5cdFx0XHRpZiAoIW1vdW50ZWQpIHtcblx0XHRcdFx0ZGlzcG9zZSA9IFtcblx0XHRcdFx0XHRsaXN0ZW4oaW5wdXQsIFwiaW5wdXRcIiwgLyppbnB1dF9pbnB1dF9oYW5kbGVyKi8gY3R4WzEyXSksXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0LCBcImtleWRvd25cIiwgLypoYW5kbGVLZXlkb3duKi8gY3R4WzVdKSxcblx0XHRcdFx0XHRsaXN0ZW4oZGl2MiwgXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHRpZiAoaXNfZnVuY3Rpb24oLypzYXZlUXVlc3Rpb24qLyBjdHhbNF0oLypxdWVzdGlvbiovIGN0eFswXSkpKSAvKnNhdmVRdWVzdGlvbiovIGN0eFs0XSgvKnF1ZXN0aW9uKi8gY3R4WzBdKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdF07XG5cblx0XHRcdFx0bW91bnRlZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRwKG5ld19jdHgsIGRpcnR5KSB7XG5cdFx0XHRjdHggPSBuZXdfY3R4O1xuXHRcdFx0aWYgKGRpcnR5ICYgLypxdWVzdGlvbiovIDEgJiYgdDBfdmFsdWUgIT09ICh0MF92YWx1ZSA9IC8qcXVlc3Rpb24qLyBjdHhbMF0ubnVtICsgXCJcIikpIHNldF9kYXRhKHQwLCB0MF92YWx1ZSk7XG5cblx0XHRcdGlmIChkaXJ0eSAmIC8qcXVlc3Rpb24qLyAxICYmIGlucHV0LnZhbHVlICE9PSAvKnF1ZXN0aW9uKi8gY3R4WzBdLnF1ZXN0aW9uKSB7XG5cdFx0XHRcdHNldF9pbnB1dF92YWx1ZShpbnB1dCwgLypxdWVzdGlvbiovIGN0eFswXS5xdWVzdGlvbik7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eSAmIC8qcXVlc3Rpb24qLyAxICYmIHQzX3ZhbHVlICE9PSAodDNfdmFsdWUgPSAvKnF1ZXN0aW9uKi8gY3R4WzBdLmFuc3dlciArIFwiXCIpKSBzZXRfZGF0YSh0MywgdDNfdmFsdWUpO1xuXHRcdH0sXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaChkaXYzKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdHJ1bl9hbGwoZGlzcG9zZSk7XG5cdFx0fVxuXHR9O1xufVxuXG4vLyAoODg6OCkgeyNpZiBzdWdnZXN0aW9ucy5sZW5ndGh9XG5mdW5jdGlvbiBjcmVhdGVfaWZfYmxvY2tfMSQxKGN0eCkge1xuXHRsZXQgZWFjaF8xX2FuY2hvcjtcblx0bGV0IGVhY2hfdmFsdWUgPSAvKnN1Z2dlc3Rpb25zKi8gY3R4WzFdO1xuXHRsZXQgZWFjaF9ibG9ja3MgPSBbXTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGVhY2hfdmFsdWUubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRlYWNoX2Jsb2Nrc1tpXSA9IGNyZWF0ZV9lYWNoX2Jsb2NrJDMoZ2V0X2VhY2hfY29udGV4dCQzKGN0eCwgZWFjaF92YWx1ZSwgaSkpO1xuXHR9XG5cblx0cmV0dXJuIHtcblx0XHRjKCkge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX2Jsb2Nrcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5jKCk7XG5cdFx0XHR9XG5cblx0XHRcdGVhY2hfMV9hbmNob3IgPSBlbXB0eSgpO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX2Jsb2Nrcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5tKHRhcmdldCwgYW5jaG9yKTtcblx0XHRcdH1cblxuXHRcdFx0aW5zZXJ0KHRhcmdldCwgZWFjaF8xX2FuY2hvciwgYW5jaG9yKTtcblx0XHR9LFxuXHRcdHAoY3R4LCBkaXJ0eSkge1xuXHRcdFx0aWYgKGRpcnR5ICYgLyp1c2VTdWdnZXN0aW9uLCBzdWdnZXN0aW9ucyovIDY2KSB7XG5cdFx0XHRcdGVhY2hfdmFsdWUgPSAvKnN1Z2dlc3Rpb25zKi8gY3R4WzFdO1xuXHRcdFx0XHRsZXQgaTtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgZWFjaF92YWx1ZS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdGNvbnN0IGNoaWxkX2N0eCA9IGdldF9lYWNoX2NvbnRleHQkMyhjdHgsIGVhY2hfdmFsdWUsIGkpO1xuXG5cdFx0XHRcdFx0aWYgKGVhY2hfYmxvY2tzW2ldKSB7XG5cdFx0XHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5wKGNoaWxkX2N0eCwgZGlydHkpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXSA9IGNyZWF0ZV9lYWNoX2Jsb2NrJDMoY2hpbGRfY3R4KTtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldLmMoKTtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldLm0oZWFjaF8xX2FuY2hvci5wYXJlbnROb2RlLCBlYWNoXzFfYW5jaG9yKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmb3IgKDsgaSA8IGVhY2hfYmxvY2tzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0uZCgxKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGVhY2hfYmxvY2tzLmxlbmd0aCA9IGVhY2hfdmFsdWUubGVuZ3RoO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGRlc3Ryb3lfZWFjaChlYWNoX2Jsb2NrcywgZGV0YWNoaW5nKTtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaChlYWNoXzFfYW5jaG9yKTtcblx0XHR9XG5cdH07XG59XG5cbi8vICg4OToxMikgeyNlYWNoIHN1Z2dlc3Rpb25zIGFzIHN1Z2dlc3Rpb259XG5mdW5jdGlvbiBjcmVhdGVfZWFjaF9ibG9jayQzKGN0eCkge1xuXHRsZXQgc3Bhbjtcblx0bGV0IHRfdmFsdWUgPSAvKnN1Z2dlc3Rpb24qLyBjdHhbMTZdICsgXCJcIjtcblx0bGV0IHQ7XG5cdGxldCBtb3VudGVkO1xuXHRsZXQgZGlzcG9zZTtcblxuXHRyZXR1cm4ge1xuXHRcdGMoKSB7XG5cdFx0XHRzcGFuID0gZWxlbWVudChcInNwYW5cIik7XG5cdFx0XHR0ID0gdGV4dCh0X3ZhbHVlKTtcblx0XHRcdGF0dHIoc3BhbiwgXCJjbGFzc1wiLCBcImp4d29yZC1zdWdnZXN0aW9uIHN2ZWx0ZS10dzZ2em1cIik7XG5cdFx0fSxcblx0XHRtKHRhcmdldCwgYW5jaG9yKSB7XG5cdFx0XHRpbnNlcnQodGFyZ2V0LCBzcGFuLCBhbmNob3IpO1xuXHRcdFx0YXBwZW5kKHNwYW4sIHQpO1xuXG5cdFx0XHRpZiAoIW1vdW50ZWQpIHtcblx0XHRcdFx0ZGlzcG9zZSA9IGxpc3RlbihzcGFuLCBcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRpZiAoaXNfZnVuY3Rpb24oLyp1c2VTdWdnZXN0aW9uKi8gY3R4WzZdKC8qc3VnZ2VzdGlvbiovIGN0eFsxNl0pKSkgLyp1c2VTdWdnZXN0aW9uKi8gY3R4WzZdKC8qc3VnZ2VzdGlvbiovIGN0eFsxNl0pLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdG1vdW50ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cChuZXdfY3R4LCBkaXJ0eSkge1xuXHRcdFx0Y3R4ID0gbmV3X2N0eDtcblx0XHRcdGlmIChkaXJ0eSAmIC8qc3VnZ2VzdGlvbnMqLyAyICYmIHRfdmFsdWUgIT09ICh0X3ZhbHVlID0gLypzdWdnZXN0aW9uKi8gY3R4WzE2XSArIFwiXCIpKSBzZXRfZGF0YSh0LCB0X3ZhbHVlKTtcblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2goc3Bhbik7XG5cdFx0XHRtb3VudGVkID0gZmFsc2U7XG5cdFx0XHRkaXNwb3NlKCk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVfZnJhZ21lbnQkNihjdHgpIHtcblx0bGV0IG1haW47XG5cblx0ZnVuY3Rpb24gc2VsZWN0X2Jsb2NrX3R5cGUoY3R4LCBkaXJ0eSkge1xuXHRcdGlmICgvKnF1ZXN0aW9uKi8gY3R4WzBdLmVkaXRpbmcpIHJldHVybiBjcmVhdGVfaWZfYmxvY2skMTtcblx0XHRyZXR1cm4gY3JlYXRlX2Vsc2VfYmxvY2skMTtcblx0fVxuXG5cdGxldCBjdXJyZW50X2Jsb2NrX3R5cGUgPSBzZWxlY3RfYmxvY2tfdHlwZShjdHgpO1xuXHRsZXQgaWZfYmxvY2sgPSBjdXJyZW50X2Jsb2NrX3R5cGUoY3R4KTtcblxuXHRyZXR1cm4ge1xuXHRcdGMoKSB7XG5cdFx0XHRtYWluID0gZWxlbWVudChcIm1haW5cIik7XG5cdFx0XHRpZl9ibG9jay5jKCk7XG5cdFx0XHRhdHRyKG1haW4sIFwiY2xhc3NcIiwgXCJzdmVsdGUtdHc2dnptXCIpO1xuXHRcdFx0dG9nZ2xlX2NsYXNzKG1haW4sIFwiY3VycmVudFwiLCAvKmlzX2N1cnJlbnRfcXVlc3Rpb24qLyBjdHhbMl0pO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0aW5zZXJ0KHRhcmdldCwgbWFpbiwgYW5jaG9yKTtcblx0XHRcdGlmX2Jsb2NrLm0obWFpbiwgbnVsbCk7XG5cdFx0fSxcblx0XHRwKGN0eCwgW2RpcnR5XSkge1xuXHRcdFx0aWYgKGN1cnJlbnRfYmxvY2tfdHlwZSA9PT0gKGN1cnJlbnRfYmxvY2tfdHlwZSA9IHNlbGVjdF9ibG9ja190eXBlKGN0eCkpICYmIGlmX2Jsb2NrKSB7XG5cdFx0XHRcdGlmX2Jsb2NrLnAoY3R4LCBkaXJ0eSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZl9ibG9jay5kKDEpO1xuXHRcdFx0XHRpZl9ibG9jayA9IGN1cnJlbnRfYmxvY2tfdHlwZShjdHgpO1xuXG5cdFx0XHRcdGlmIChpZl9ibG9jaykge1xuXHRcdFx0XHRcdGlmX2Jsb2NrLmMoKTtcblx0XHRcdFx0XHRpZl9ibG9jay5tKG1haW4sIG51bGwpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eSAmIC8qaXNfY3VycmVudF9xdWVzdGlvbiovIDQpIHtcblx0XHRcdFx0dG9nZ2xlX2NsYXNzKG1haW4sIFwiY3VycmVudFwiLCAvKmlzX2N1cnJlbnRfcXVlc3Rpb24qLyBjdHhbMl0pO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0aTogbm9vcCxcblx0XHRvOiBub29wLFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2gobWFpbik7XG5cdFx0XHRpZl9ibG9jay5kKCk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBpbnN0YW5jZSQ2KCQkc2VsZiwgJCRwcm9wcywgJCRpbnZhbGlkYXRlKSB7XG5cdGxldCAkY3VycmVudERpcmVjdGlvbjtcblx0bGV0ICRjdXJyZW50UXVlc3Rpb247XG5cdGxldCAkcXVlc3Rpb25zQWNyb3NzO1xuXHRsZXQgJHF1ZXN0aW9uc0Rvd247XG5cdGNvbXBvbmVudF9zdWJzY3JpYmUoJCRzZWxmLCBjdXJyZW50RGlyZWN0aW9uLCAkJHZhbHVlID0+ICQkaW52YWxpZGF0ZSgxMCwgJGN1cnJlbnREaXJlY3Rpb24gPSAkJHZhbHVlKSk7XG5cdGNvbXBvbmVudF9zdWJzY3JpYmUoJCRzZWxmLCBjdXJyZW50UXVlc3Rpb24sICQkdmFsdWUgPT4gJCRpbnZhbGlkYXRlKDExLCAkY3VycmVudFF1ZXN0aW9uID0gJCR2YWx1ZSkpO1xuXHRjb21wb25lbnRfc3Vic2NyaWJlKCQkc2VsZiwgcXVlc3Rpb25zQWNyb3NzLCAkJHZhbHVlID0+ICQkaW52YWxpZGF0ZSgxMywgJHF1ZXN0aW9uc0Fjcm9zcyA9ICQkdmFsdWUpKTtcblx0Y29tcG9uZW50X3N1YnNjcmliZSgkJHNlbGYsIHF1ZXN0aW9uc0Rvd24sICQkdmFsdWUgPT4gJCRpbnZhbGlkYXRlKDE0LCAkcXVlc3Rpb25zRG93biA9ICQkdmFsdWUpKTtcblx0Y29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKTtcblx0bGV0IHsgcXVlc3Rpb25zX2Fjcm9zcyA9IFtdIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBxdWVzdGlvbnNfZG93biA9IFtdIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBxdWVzdGlvbiB9ID0gJCRwcm9wcztcblx0bGV0IHsgZGlyZWN0aW9uIH0gPSAkJHByb3BzO1xuXG5cdC8vIFByaXZhdGUgcHJvcHNcblx0bGV0IHN1Z2dlc3Rpb25zID0gW107XG5cblx0ZnVuY3Rpb24gZWRpdFF1ZXN0aW9uKHF1ZXN0aW9uKSB7XG5cdFx0cXVlc3Rpb24uZWRpdGluZyA9IHRydWU7XG5cdFx0aXNFZGl0aW5nUXVlc3Rpb24uc2V0KHRydWUpO1xuXG5cdFx0aWYgKGRpcmVjdGlvbiA9PSBcImFjcm9zc1wiKSB7XG5cdFx0XHRxdWVzdGlvbnNBY3Jvc3Muc2V0KHF1ZXN0aW9uc19hY3Jvc3MpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRxdWVzdGlvbnNEb3duLnNldChxdWVzdGlvbnNfZG93bik7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gc2F2ZVF1ZXN0aW9uKHF1ZXN0aW9uKSB7XG5cdFx0aWYgKGRpcmVjdGlvbiA9PSBcImFjcm9zc1wiKSB7XG5cdFx0XHRxdWVzdGlvbnNBY3Jvc3Muc2V0KHF1ZXN0aW9uc19hY3Jvc3MpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRxdWVzdGlvbnNEb3duLnNldChxdWVzdGlvbnNfZG93bik7XG5cdFx0fVxuXG5cdFx0aXNFZGl0aW5nUXVlc3Rpb24uc2V0KGZhbHNlKTtcblx0XHRxdWVzdGlvbi5lZGl0aW5nID0gZmFsc2U7XG5cdFx0ZGlzcGF0Y2goXCJzYXZlXCIsIHsgcXVlc3Rpb24sIGRpcmVjdGlvbiB9KTtcblx0XHRkaXNwYXRjaChcImNoYW5nZVwiKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZUtleWRvd24oZSkge1xuXHRcdGlmIChlLmtleSA9PSBcIkVudGVyXCIpIHtcblx0XHRcdHNhdmVRdWVzdGlvbihxdWVzdGlvbik7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gdXNlU3VnZ2VzdGlvbihzdWdnZXN0aW9uKSB7XG5cdFx0c3VnZ2VzdGlvbiA9IHN1Z2dlc3Rpb24udG9VcHBlckNhc2UoKTtcblx0XHRsZXQgcXMgPSAkcXVlc3Rpb25zRG93bjtcblxuXHRcdGlmIChxdWVzdGlvbi5kaXJlY3Rpb24gPT09IFwiYWNyb3NzXCIpIHtcblx0XHRcdHFzID0gJHF1ZXN0aW9uc0Fjcm9zcztcblx0XHR9XG5cblx0XHRxc1txcy5maW5kSW5kZXgocSA9PiBxLm51bSA9PT0gcXVlc3Rpb24ubnVtKV07XG5cdFx0bGV0IHEgPSBxcy5maW5kKHEgPT4gcS5udW0gPT09IHF1ZXN0aW9uLm51bSk7XG5cdFx0ZGlzcGF0Y2goXCJ1cGRhdGVfcXVlc3Rpb25cIiwgeyBzdWdnZXN0aW9uLCBxdWVzdGlvbjogcSB9KTtcblx0fVxuXG5cdGxldCBpc19jdXJyZW50X3F1ZXN0aW9uID0gZmFsc2U7XG5cblx0ZnVuY3Rpb24gaW5wdXRfaW5wdXRfaGFuZGxlcigpIHtcblx0XHRxdWVzdGlvbi5xdWVzdGlvbiA9IHRoaXMudmFsdWU7XG5cdFx0JCRpbnZhbGlkYXRlKDAsIHF1ZXN0aW9uKTtcblx0fVxuXG5cdCQkc2VsZi4kJHNldCA9ICQkcHJvcHMgPT4ge1xuXHRcdGlmICgncXVlc3Rpb25zX2Fjcm9zcycgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDcsIHF1ZXN0aW9uc19hY3Jvc3MgPSAkJHByb3BzLnF1ZXN0aW9uc19hY3Jvc3MpO1xuXHRcdGlmICgncXVlc3Rpb25zX2Rvd24nIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSg4LCBxdWVzdGlvbnNfZG93biA9ICQkcHJvcHMucXVlc3Rpb25zX2Rvd24pO1xuXHRcdGlmICgncXVlc3Rpb24nIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSgwLCBxdWVzdGlvbiA9ICQkcHJvcHMucXVlc3Rpb24pO1xuXHRcdGlmICgnZGlyZWN0aW9uJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoOSwgZGlyZWN0aW9uID0gJCRwcm9wcy5kaXJlY3Rpb24pO1xuXHR9O1xuXG5cdCQkc2VsZi4kJC51cGRhdGUgPSAoKSA9PiB7XG5cdFx0aWYgKCQkc2VsZi4kJC5kaXJ0eSAmIC8qcXVlc3Rpb24sICRjdXJyZW50UXVlc3Rpb24sICRjdXJyZW50RGlyZWN0aW9uKi8gMzA3Mykge1xuXHRcdFx0e1xuXHRcdFx0XHRsZXQgc3VnZ2VzdGlvbl9xdWVyeSA9IHF1ZXN0aW9uLmFuc3dlci5yZXBsYWNlKC9cXCAvZywgXCI/XCIpO1xuXG5cdFx0XHRcdGlmICghc3VnZ2VzdGlvbl9xdWVyeS5pbmNsdWRlcyhcIj9cIikpIHtcblx0XHRcdFx0XHQkJGludmFsaWRhdGUoMSwgc3VnZ2VzdGlvbnMgPSBbXSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JCRpbnZhbGlkYXRlKDEsIHN1Z2dlc3Rpb25zID0gc3VnZ2VzdChzdWdnZXN0aW9uX3F1ZXJ5KSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoJGN1cnJlbnRRdWVzdGlvbikge1xuXHRcdFx0XHRcdCQkaW52YWxpZGF0ZSgyLCBpc19jdXJyZW50X3F1ZXN0aW9uID0gJGN1cnJlbnRRdWVzdGlvbi5udW0gPT09IHF1ZXN0aW9uLm51bSAmJiAkY3VycmVudERpcmVjdGlvbiA9PT0gcXVlc3Rpb24uZGlyZWN0aW9uKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gW1xuXHRcdHF1ZXN0aW9uLFxuXHRcdHN1Z2dlc3Rpb25zLFxuXHRcdGlzX2N1cnJlbnRfcXVlc3Rpb24sXG5cdFx0ZWRpdFF1ZXN0aW9uLFxuXHRcdHNhdmVRdWVzdGlvbixcblx0XHRoYW5kbGVLZXlkb3duLFxuXHRcdHVzZVN1Z2dlc3Rpb24sXG5cdFx0cXVlc3Rpb25zX2Fjcm9zcyxcblx0XHRxdWVzdGlvbnNfZG93bixcblx0XHRkaXJlY3Rpb24sXG5cdFx0JGN1cnJlbnREaXJlY3Rpb24sXG5cdFx0JGN1cnJlbnRRdWVzdGlvbixcblx0XHRpbnB1dF9pbnB1dF9oYW5kbGVyXG5cdF07XG59XG5cbmNsYXNzIFF1ZXN0aW9uIGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50IHtcblx0Y29uc3RydWN0b3Iob3B0aW9ucykge1xuXHRcdHN1cGVyKCk7XG5cblx0XHRpbml0KHRoaXMsIG9wdGlvbnMsIGluc3RhbmNlJDYsIGNyZWF0ZV9mcmFnbWVudCQ2LCBzYWZlX25vdF9lcXVhbCwge1xuXHRcdFx0cXVlc3Rpb25zX2Fjcm9zczogNyxcblx0XHRcdHF1ZXN0aW9uc19kb3duOiA4LFxuXHRcdFx0cXVlc3Rpb246IDAsXG5cdFx0XHRkaXJlY3Rpb246IDlcblx0XHR9KTtcblx0fVxufVxuXG4vKiBzcmMvUXVlc3Rpb25zLnN2ZWx0ZSBnZW5lcmF0ZWQgYnkgU3ZlbHRlIHYzLjQ2LjQgKi9cblxuZnVuY3Rpb24gZ2V0X2VhY2hfY29udGV4dCQyKGN0eCwgbGlzdCwgaSkge1xuXHRjb25zdCBjaGlsZF9jdHggPSBjdHguc2xpY2UoKTtcblx0Y2hpbGRfY3R4WzZdID0gbGlzdFtpXTtcblx0cmV0dXJuIGNoaWxkX2N0eDtcbn1cblxuZnVuY3Rpb24gZ2V0X2VhY2hfY29udGV4dF8xJDIoY3R4LCBsaXN0LCBpKSB7XG5cdGNvbnN0IGNoaWxkX2N0eCA9IGN0eC5zbGljZSgpO1xuXHRjaGlsZF9jdHhbNl0gPSBsaXN0W2ldO1xuXHRyZXR1cm4gY2hpbGRfY3R4O1xufVxuXG4vLyAoNToxNikgeyNlYWNoIHF1ZXN0aW9uc19hY3Jvc3MgYXMgcXVlc3Rpb259XG5mdW5jdGlvbiBjcmVhdGVfZWFjaF9ibG9ja18xJDIoY3R4KSB7XG5cdGxldCBxdWVzdGlvbjtcblx0bGV0IGN1cnJlbnQ7XG5cblx0cXVlc3Rpb24gPSBuZXcgUXVlc3Rpb24oe1xuXHRcdFx0cHJvcHM6IHtcblx0XHRcdFx0cXVlc3Rpb246IC8qcXVlc3Rpb24qLyBjdHhbNl0sXG5cdFx0XHRcdGRpcmVjdGlvbjogXCJhY3Jvc3NcIixcblx0XHRcdFx0cXVlc3Rpb25zX2Fjcm9zczogLypxdWVzdGlvbnNfYWNyb3NzKi8gY3R4WzBdXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0cXVlc3Rpb24uJG9uKFwiY2hhbmdlXCIsIC8qY2hhbmdlX2hhbmRsZXIqLyBjdHhbMl0pO1xuXHRxdWVzdGlvbi4kb24oXCJ1cGRhdGVfcXVlc3Rpb25cIiwgLyp1cGRhdGVfcXVlc3Rpb25faGFuZGxlciovIGN0eFszXSk7XG5cblx0cmV0dXJuIHtcblx0XHRjKCkge1xuXHRcdFx0Y3JlYXRlX2NvbXBvbmVudChxdWVzdGlvbi4kJC5mcmFnbWVudCk7XG5cdFx0fSxcblx0XHRtKHRhcmdldCwgYW5jaG9yKSB7XG5cdFx0XHRtb3VudF9jb21wb25lbnQocXVlc3Rpb24sIHRhcmdldCwgYW5jaG9yKTtcblx0XHRcdGN1cnJlbnQgPSB0cnVlO1xuXHRcdH0sXG5cdFx0cChjdHgsIGRpcnR5KSB7XG5cdFx0XHRjb25zdCBxdWVzdGlvbl9jaGFuZ2VzID0ge307XG5cdFx0XHRpZiAoZGlydHkgJiAvKnF1ZXN0aW9uc19hY3Jvc3MqLyAxKSBxdWVzdGlvbl9jaGFuZ2VzLnF1ZXN0aW9uID0gLypxdWVzdGlvbiovIGN0eFs2XTtcblx0XHRcdGlmIChkaXJ0eSAmIC8qcXVlc3Rpb25zX2Fjcm9zcyovIDEpIHF1ZXN0aW9uX2NoYW5nZXMucXVlc3Rpb25zX2Fjcm9zcyA9IC8qcXVlc3Rpb25zX2Fjcm9zcyovIGN0eFswXTtcblx0XHRcdHF1ZXN0aW9uLiRzZXQocXVlc3Rpb25fY2hhbmdlcyk7XG5cdFx0fSxcblx0XHRpKGxvY2FsKSB7XG5cdFx0XHRpZiAoY3VycmVudCkgcmV0dXJuO1xuXHRcdFx0dHJhbnNpdGlvbl9pbihxdWVzdGlvbi4kJC5mcmFnbWVudCwgbG9jYWwpO1xuXHRcdFx0Y3VycmVudCA9IHRydWU7XG5cdFx0fSxcblx0XHRvKGxvY2FsKSB7XG5cdFx0XHR0cmFuc2l0aW9uX291dChxdWVzdGlvbi4kJC5mcmFnbWVudCwgbG9jYWwpO1xuXHRcdFx0Y3VycmVudCA9IGZhbHNlO1xuXHRcdH0sXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGRlc3Ryb3lfY29tcG9uZW50KHF1ZXN0aW9uLCBkZXRhY2hpbmcpO1xuXHRcdH1cblx0fTtcbn1cblxuLy8gKDExOjE2KSB7I2VhY2ggcXVlc3Rpb25zX2Rvd24gYXMgcXVlc3Rpb259XG5mdW5jdGlvbiBjcmVhdGVfZWFjaF9ibG9jayQyKGN0eCkge1xuXHRsZXQgcXVlc3Rpb247XG5cdGxldCBjdXJyZW50O1xuXG5cdHF1ZXN0aW9uID0gbmV3IFF1ZXN0aW9uKHtcblx0XHRcdHByb3BzOiB7XG5cdFx0XHRcdHF1ZXN0aW9uOiAvKnF1ZXN0aW9uKi8gY3R4WzZdLFxuXHRcdFx0XHRkaXJlY3Rpb246IFwiZG93blwiLFxuXHRcdFx0XHRxdWVzdGlvbnNfZG93bjogLypxdWVzdGlvbnNfZG93biovIGN0eFsxXVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdHF1ZXN0aW9uLiRvbihcImNoYW5nZVwiLCAvKmNoYW5nZV9oYW5kbGVyXzEqLyBjdHhbNF0pO1xuXHRxdWVzdGlvbi4kb24oXCJ1cGRhdGVfcXVlc3Rpb25cIiwgLyp1cGRhdGVfcXVlc3Rpb25faGFuZGxlcl8xKi8gY3R4WzVdKTtcblxuXHRyZXR1cm4ge1xuXHRcdGMoKSB7XG5cdFx0XHRjcmVhdGVfY29tcG9uZW50KHF1ZXN0aW9uLiQkLmZyYWdtZW50KTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdG1vdW50X2NvbXBvbmVudChxdWVzdGlvbiwgdGFyZ2V0LCBhbmNob3IpO1xuXHRcdFx0Y3VycmVudCA9IHRydWU7XG5cdFx0fSxcblx0XHRwKGN0eCwgZGlydHkpIHtcblx0XHRcdGNvbnN0IHF1ZXN0aW9uX2NoYW5nZXMgPSB7fTtcblx0XHRcdGlmIChkaXJ0eSAmIC8qcXVlc3Rpb25zX2Rvd24qLyAyKSBxdWVzdGlvbl9jaGFuZ2VzLnF1ZXN0aW9uID0gLypxdWVzdGlvbiovIGN0eFs2XTtcblx0XHRcdGlmIChkaXJ0eSAmIC8qcXVlc3Rpb25zX2Rvd24qLyAyKSBxdWVzdGlvbl9jaGFuZ2VzLnF1ZXN0aW9uc19kb3duID0gLypxdWVzdGlvbnNfZG93biovIGN0eFsxXTtcblx0XHRcdHF1ZXN0aW9uLiRzZXQocXVlc3Rpb25fY2hhbmdlcyk7XG5cdFx0fSxcblx0XHRpKGxvY2FsKSB7XG5cdFx0XHRpZiAoY3VycmVudCkgcmV0dXJuO1xuXHRcdFx0dHJhbnNpdGlvbl9pbihxdWVzdGlvbi4kJC5mcmFnbWVudCwgbG9jYWwpO1xuXHRcdFx0Y3VycmVudCA9IHRydWU7XG5cdFx0fSxcblx0XHRvKGxvY2FsKSB7XG5cdFx0XHR0cmFuc2l0aW9uX291dChxdWVzdGlvbi4kJC5mcmFnbWVudCwgbG9jYWwpO1xuXHRcdFx0Y3VycmVudCA9IGZhbHNlO1xuXHRcdH0sXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGRlc3Ryb3lfY29tcG9uZW50KHF1ZXN0aW9uLCBkZXRhY2hpbmcpO1xuXHRcdH1cblx0fTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlX2ZyYWdtZW50JDUoY3R4KSB7XG5cdGxldCBtYWluO1xuXHRsZXQgZGl2Mjtcblx0bGV0IGRpdjA7XG5cdGxldCBoNDA7XG5cdGxldCB0MTtcblx0bGV0IHQyO1xuXHRsZXQgZGl2MTtcblx0bGV0IGg0MTtcblx0bGV0IHQ0O1xuXHRsZXQgY3VycmVudDtcblx0bGV0IGVhY2hfdmFsdWVfMSA9IC8qcXVlc3Rpb25zX2Fjcm9zcyovIGN0eFswXTtcblx0bGV0IGVhY2hfYmxvY2tzXzEgPSBbXTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGVhY2hfdmFsdWVfMS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdGVhY2hfYmxvY2tzXzFbaV0gPSBjcmVhdGVfZWFjaF9ibG9ja18xJDIoZ2V0X2VhY2hfY29udGV4dF8xJDIoY3R4LCBlYWNoX3ZhbHVlXzEsIGkpKTtcblx0fVxuXG5cdGNvbnN0IG91dCA9IGkgPT4gdHJhbnNpdGlvbl9vdXQoZWFjaF9ibG9ja3NfMVtpXSwgMSwgMSwgKCkgPT4ge1xuXHRcdGVhY2hfYmxvY2tzXzFbaV0gPSBudWxsO1xuXHR9KTtcblxuXHRsZXQgZWFjaF92YWx1ZSA9IC8qcXVlc3Rpb25zX2Rvd24qLyBjdHhbMV07XG5cdGxldCBlYWNoX2Jsb2NrcyA9IFtdO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF92YWx1ZS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdGVhY2hfYmxvY2tzW2ldID0gY3JlYXRlX2VhY2hfYmxvY2skMihnZXRfZWFjaF9jb250ZXh0JDIoY3R4LCBlYWNoX3ZhbHVlLCBpKSk7XG5cdH1cblxuXHRjb25zdCBvdXRfMSA9IGkgPT4gdHJhbnNpdGlvbl9vdXQoZWFjaF9ibG9ja3NbaV0sIDEsIDEsICgpID0+IHtcblx0XHRlYWNoX2Jsb2Nrc1tpXSA9IG51bGw7XG5cdH0pO1xuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdG1haW4gPSBlbGVtZW50KFwibWFpblwiKTtcblx0XHRcdGRpdjIgPSBlbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0ZGl2MCA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRoNDAgPSBlbGVtZW50KFwiaDRcIik7XG5cdFx0XHRoNDAudGV4dENvbnRlbnQgPSBcIkFjcm9zc1wiO1xuXHRcdFx0dDEgPSBzcGFjZSgpO1xuXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGVhY2hfYmxvY2tzXzEubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0ZWFjaF9ibG9ja3NfMVtpXS5jKCk7XG5cdFx0XHR9XG5cblx0XHRcdHQyID0gc3BhY2UoKTtcblx0XHRcdGRpdjEgPSBlbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0aDQxID0gZWxlbWVudChcImg0XCIpO1xuXHRcdFx0aDQxLnRleHRDb250ZW50ID0gXCJEb3duXCI7XG5cdFx0XHR0NCA9IHNwYWNlKCk7XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF9ibG9ja3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0uYygpO1xuXHRcdFx0fVxuXG5cdFx0XHRhdHRyKGRpdjAsIFwiY2xhc3NcIiwgXCJqeHdvcmQtcXVlc3Rpb25zLWRpcmVjdGlvbiBqeHdvcmQtcXVlc3Rpb25zLWFjcm9zcyBzdmVsdGUtMWptMGFxNVwiKTtcblx0XHRcdGF0dHIoZGl2MSwgXCJjbGFzc1wiLCBcImp4d29yZC1xdWVzdGlvbnMtZGlyZWN0aW9uIGp4d29yZC1xdWVzdGlvbnMtZG93biBzdmVsdGUtMWptMGFxNVwiKTtcblx0XHRcdGF0dHIoZGl2MiwgXCJjbGFzc1wiLCBcImp4d29yZC1xdWVzdGlvbnMgc3ZlbHRlLTFqbTBhcTVcIik7XG5cdFx0XHRhdHRyKG1haW4sIFwiY2xhc3NcIiwgXCJzdmVsdGUtMWptMGFxNVwiKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGluc2VydCh0YXJnZXQsIG1haW4sIGFuY2hvcik7XG5cdFx0XHRhcHBlbmQobWFpbiwgZGl2Mik7XG5cdFx0XHRhcHBlbmQoZGl2MiwgZGl2MCk7XG5cdFx0XHRhcHBlbmQoZGl2MCwgaDQwKTtcblx0XHRcdGFwcGVuZChkaXYwLCB0MSk7XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF9ibG9ja3NfMS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRlYWNoX2Jsb2Nrc18xW2ldLm0oZGl2MCwgbnVsbCk7XG5cdFx0XHR9XG5cblx0XHRcdGFwcGVuZChkaXYyLCB0Mik7XG5cdFx0XHRhcHBlbmQoZGl2MiwgZGl2MSk7XG5cdFx0XHRhcHBlbmQoZGl2MSwgaDQxKTtcblx0XHRcdGFwcGVuZChkaXYxLCB0NCk7XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF9ibG9ja3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0ubShkaXYxLCBudWxsKTtcblx0XHRcdH1cblxuXHRcdFx0Y3VycmVudCA9IHRydWU7XG5cdFx0fSxcblx0XHRwKGN0eCwgW2RpcnR5XSkge1xuXHRcdFx0aWYgKGRpcnR5ICYgLypxdWVzdGlvbnNfYWNyb3NzKi8gMSkge1xuXHRcdFx0XHRlYWNoX3ZhbHVlXzEgPSAvKnF1ZXN0aW9uc19hY3Jvc3MqLyBjdHhbMF07XG5cdFx0XHRcdGxldCBpO1xuXG5cdFx0XHRcdGZvciAoaSA9IDA7IGkgPCBlYWNoX3ZhbHVlXzEubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRjb25zdCBjaGlsZF9jdHggPSBnZXRfZWFjaF9jb250ZXh0XzEkMihjdHgsIGVhY2hfdmFsdWVfMSwgaSk7XG5cblx0XHRcdFx0XHRpZiAoZWFjaF9ibG9ja3NfMVtpXSkge1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NfMVtpXS5wKGNoaWxkX2N0eCwgZGlydHkpO1xuXHRcdFx0XHRcdFx0dHJhbnNpdGlvbl9pbihlYWNoX2Jsb2Nrc18xW2ldLCAxKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NfMVtpXSA9IGNyZWF0ZV9lYWNoX2Jsb2NrXzEkMihjaGlsZF9jdHgpO1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NfMVtpXS5jKCk7XG5cdFx0XHRcdFx0XHR0cmFuc2l0aW9uX2luKGVhY2hfYmxvY2tzXzFbaV0sIDEpO1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NfMVtpXS5tKGRpdjAsIG51bGwpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGdyb3VwX291dHJvcygpO1xuXG5cdFx0XHRcdGZvciAoaSA9IGVhY2hfdmFsdWVfMS5sZW5ndGg7IGkgPCBlYWNoX2Jsb2Nrc18xLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0b3V0KGkpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2hlY2tfb3V0cm9zKCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eSAmIC8qcXVlc3Rpb25zX2Rvd24qLyAyKSB7XG5cdFx0XHRcdGVhY2hfdmFsdWUgPSAvKnF1ZXN0aW9uc19kb3duKi8gY3R4WzFdO1xuXHRcdFx0XHRsZXQgaTtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgZWFjaF92YWx1ZS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdGNvbnN0IGNoaWxkX2N0eCA9IGdldF9lYWNoX2NvbnRleHQkMihjdHgsIGVhY2hfdmFsdWUsIGkpO1xuXG5cdFx0XHRcdFx0aWYgKGVhY2hfYmxvY2tzW2ldKSB7XG5cdFx0XHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5wKGNoaWxkX2N0eCwgZGlydHkpO1xuXHRcdFx0XHRcdFx0dHJhbnNpdGlvbl9pbihlYWNoX2Jsb2Nrc1tpXSwgMSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldID0gY3JlYXRlX2VhY2hfYmxvY2skMihjaGlsZF9jdHgpO1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0uYygpO1xuXHRcdFx0XHRcdFx0dHJhbnNpdGlvbl9pbihlYWNoX2Jsb2Nrc1tpXSwgMSk7XG5cdFx0XHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5tKGRpdjEsIG51bGwpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGdyb3VwX291dHJvcygpO1xuXG5cdFx0XHRcdGZvciAoaSA9IGVhY2hfdmFsdWUubGVuZ3RoOyBpIDwgZWFjaF9ibG9ja3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRvdXRfMShpKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNoZWNrX291dHJvcygpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0aShsb2NhbCkge1xuXHRcdFx0aWYgKGN1cnJlbnQpIHJldHVybjtcblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX3ZhbHVlXzEubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0dHJhbnNpdGlvbl9pbihlYWNoX2Jsb2Nrc18xW2ldKTtcblx0XHRcdH1cblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX3ZhbHVlLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdHRyYW5zaXRpb25faW4oZWFjaF9ibG9ja3NbaV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRjdXJyZW50ID0gdHJ1ZTtcblx0XHR9LFxuXHRcdG8obG9jYWwpIHtcblx0XHRcdGVhY2hfYmxvY2tzXzEgPSBlYWNoX2Jsb2Nrc18xLmZpbHRlcihCb29sZWFuKTtcblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX2Jsb2Nrc18xLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdHRyYW5zaXRpb25fb3V0KGVhY2hfYmxvY2tzXzFbaV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRlYWNoX2Jsb2NrcyA9IGVhY2hfYmxvY2tzLmZpbHRlcihCb29sZWFuKTtcblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX2Jsb2Nrcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHR0cmFuc2l0aW9uX291dChlYWNoX2Jsb2Nrc1tpXSk7XG5cdFx0XHR9XG5cblx0XHRcdGN1cnJlbnQgPSBmYWxzZTtcblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2gobWFpbik7XG5cdFx0XHRkZXN0cm95X2VhY2goZWFjaF9ibG9ja3NfMSwgZGV0YWNoaW5nKTtcblx0XHRcdGRlc3Ryb3lfZWFjaChlYWNoX2Jsb2NrcywgZGV0YWNoaW5nKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGluc3RhbmNlJDUoJCRzZWxmLCAkJHByb3BzLCAkJGludmFsaWRhdGUpIHtcblx0bGV0IHF1ZXN0aW9uc19hY3Jvc3MgPSBbXTtcblx0bGV0IHF1ZXN0aW9uc19kb3duID0gW107XG5cblx0cXVlc3Rpb25zQWNyb3NzLnN1YnNjcmliZSh2YWx1ZSA9PiB7XG5cdFx0JCRpbnZhbGlkYXRlKDAsIHF1ZXN0aW9uc19hY3Jvc3MgPSB2YWx1ZSk7XG5cdH0pO1xuXG5cdHF1ZXN0aW9uc0Rvd24uc3Vic2NyaWJlKHZhbHVlID0+IHtcblx0XHQkJGludmFsaWRhdGUoMSwgcXVlc3Rpb25zX2Rvd24gPSB2YWx1ZSk7XG5cdH0pO1xuXG5cdGZ1bmN0aW9uIGNoYW5nZV9oYW5kbGVyKGV2ZW50KSB7XG5cdFx0YnViYmxlLmNhbGwodGhpcywgJCRzZWxmLCBldmVudCk7XG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGVfcXVlc3Rpb25faGFuZGxlcihldmVudCkge1xuXHRcdGJ1YmJsZS5jYWxsKHRoaXMsICQkc2VsZiwgZXZlbnQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2hhbmdlX2hhbmRsZXJfMShldmVudCkge1xuXHRcdGJ1YmJsZS5jYWxsKHRoaXMsICQkc2VsZiwgZXZlbnQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlX3F1ZXN0aW9uX2hhbmRsZXJfMShldmVudCkge1xuXHRcdGJ1YmJsZS5jYWxsKHRoaXMsICQkc2VsZiwgZXZlbnQpO1xuXHR9XG5cblx0cmV0dXJuIFtcblx0XHRxdWVzdGlvbnNfYWNyb3NzLFxuXHRcdHF1ZXN0aW9uc19kb3duLFxuXHRcdGNoYW5nZV9oYW5kbGVyLFxuXHRcdHVwZGF0ZV9xdWVzdGlvbl9oYW5kbGVyLFxuXHRcdGNoYW5nZV9oYW5kbGVyXzEsXG5cdFx0dXBkYXRlX3F1ZXN0aW9uX2hhbmRsZXJfMVxuXHRdO1xufVxuXG5jbGFzcyBRdWVzdGlvbnMgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuXHRjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG5cdFx0c3VwZXIoKTtcblx0XHRpbml0KHRoaXMsIG9wdGlvbnMsIGluc3RhbmNlJDUsIGNyZWF0ZV9mcmFnbWVudCQ1LCBzYWZlX25vdF9lcXVhbCwge30pO1xuXHR9XG59XG5cbi8qIHNyYy9HcmlkLnN2ZWx0ZSBnZW5lcmF0ZWQgYnkgU3ZlbHRlIHYzLjQ2LjQgKi9cblxuZnVuY3Rpb24gZ2V0X2VhY2hfY29udGV4dCQxKGN0eCwgbGlzdCwgaSkge1xuXHRjb25zdCBjaGlsZF9jdHggPSBjdHguc2xpY2UoKTtcblx0Y2hpbGRfY3R4WzYwXSA9IGxpc3RbaV07XG5cdGNoaWxkX2N0eFs2Ml0gPSBpO1xuXHRyZXR1cm4gY2hpbGRfY3R4O1xufVxuXG5mdW5jdGlvbiBnZXRfZWFjaF9jb250ZXh0XzEkMShjdHgsIGxpc3QsIGkpIHtcblx0Y29uc3QgY2hpbGRfY3R4ID0gY3R4LnNsaWNlKCk7XG5cdGNoaWxkX2N0eFs2M10gPSBsaXN0W2ldO1xuXHRjaGlsZF9jdHhbNjVdID0gaTtcblx0cmV0dXJuIGNoaWxkX2N0eDtcbn1cblxuLy8gKDQ2NzoyOCkgezplbHNlfVxuZnVuY3Rpb24gY3JlYXRlX2Vsc2VfYmxvY2soY3R4KSB7XG5cdGxldCByZWN0O1xuXHRsZXQgcmVjdF95X3ZhbHVlO1xuXHRsZXQgcmVjdF94X3ZhbHVlO1xuXHRsZXQgdGV4dF8xO1xuXHRsZXQgdF92YWx1ZSA9IC8qbGV0dGVyKi8gY3R4WzYzXSArIFwiXCI7XG5cdGxldCB0O1xuXHRsZXQgdGV4dF8xX3hfdmFsdWU7XG5cdGxldCB0ZXh0XzFfeV92YWx1ZTtcblx0bGV0IG1vdW50ZWQ7XG5cdGxldCBkaXNwb3NlO1xuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdHJlY3QgPSBzdmdfZWxlbWVudChcInJlY3RcIik7XG5cdFx0XHR0ZXh0XzEgPSBzdmdfZWxlbWVudChcInRleHRcIik7XG5cdFx0XHR0ID0gdGV4dCh0X3ZhbHVlKTtcblx0XHRcdGF0dHIocmVjdCwgXCJjbGFzc1wiLCBcImp4d29yZC1jZWxsLXJlY3Qgc3ZlbHRlLTEwMTNqNW1cIik7XG5cdFx0XHRhdHRyKHJlY3QsIFwicm9sZVwiLCBcImNlbGxcIik7XG5cdFx0XHRhdHRyKHJlY3QsIFwidGFiaW5kZXhcIiwgXCItMVwiKTtcblx0XHRcdGF0dHIocmVjdCwgXCJhcmlhLWxhYmVsXCIsIFwiXCIpO1xuXHRcdFx0YXR0cihyZWN0LCBcInlcIiwgcmVjdF95X3ZhbHVlID0gLypjZWxsV2lkdGgqLyBjdHhbMThdICogLyp5Ki8gY3R4WzYyXSArIC8qbWFyZ2luKi8gY3R4WzldKTtcblx0XHRcdGF0dHIocmVjdCwgXCJ4XCIsIHJlY3RfeF92YWx1ZSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0pO1xuXHRcdFx0YXR0cihyZWN0LCBcIndpZHRoXCIsIC8qY2VsbFdpZHRoKi8gY3R4WzE4XSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwiaGVpZ2h0XCIsIC8qY2VsbEhlaWdodCovIGN0eFsyMl0pO1xuXHRcdFx0YXR0cihyZWN0LCBcInN0cm9rZVwiLCAvKmlubmVyQm9yZGVyQ29sb3VyKi8gY3R4WzExXSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwic3Ryb2tlLXdpZHRoXCIsIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwiZmlsbFwiLCAvKmJhY2tncm91bmRDb2xvdXIqLyBjdHhbMTNdKTtcblx0XHRcdGF0dHIocmVjdCwgXCJkYXRhLWNvbFwiLCAvKngqLyBjdHhbNjVdKTtcblx0XHRcdGF0dHIocmVjdCwgXCJkYXRhLXJvd1wiLCAvKnkqLyBjdHhbNjJdKTtcblx0XHRcdGF0dHIodGV4dF8xLCBcImNsYXNzXCIsIFwianh3b3JkLW5vLXByaW50LWJsYW5rIHN2ZWx0ZS0xMDEzajVtXCIpO1xuXHRcdFx0YXR0cih0ZXh0XzEsIFwiaWRcIiwgXCJqeHdvcmQtbGV0dGVyLVwiICsgLyp4Ki8gY3R4WzY1XSArIFwiLVwiICsgLyp5Ki8gY3R4WzYyXSk7XG5cdFx0XHRhdHRyKHRleHRfMSwgXCJ4XCIsIHRleHRfMV94X3ZhbHVlID0gLypjZWxsV2lkdGgqLyBjdHhbMThdICogLyp4Ki8gY3R4WzY1XSArIC8qbWFyZ2luKi8gY3R4WzldICsgLypjZWxsV2lkdGgqLyBjdHhbMThdIC8gMik7XG5cdFx0XHRhdHRyKHRleHRfMSwgXCJ5XCIsIHRleHRfMV95X3ZhbHVlID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeSovIGN0eFs2Ml0gKyAvKm1hcmdpbiovIGN0eFs5XSArIC8qY2VsbEhlaWdodCovIGN0eFsyMl0gLSAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogMC4xKTtcblx0XHRcdGF0dHIodGV4dF8xLCBcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpO1xuXHRcdFx0YXR0cih0ZXh0XzEsIFwiZm9udC1zaXplXCIsIC8qZm9udFNpemUqLyBjdHhbMjBdKTtcblx0XHRcdGF0dHIodGV4dF8xLCBcIndpZHRoXCIsIC8qY2VsbFdpZHRoKi8gY3R4WzE4XSk7XG5cdFx0fSxcblx0XHRtKHRhcmdldCwgYW5jaG9yKSB7XG5cdFx0XHRpbnNlcnQodGFyZ2V0LCByZWN0LCBhbmNob3IpO1xuXHRcdFx0aW5zZXJ0KHRhcmdldCwgdGV4dF8xLCBhbmNob3IpO1xuXHRcdFx0YXBwZW5kKHRleHRfMSwgdCk7XG5cblx0XHRcdGlmICghbW91bnRlZCkge1xuXHRcdFx0XHRkaXNwb3NlID0gW1xuXHRcdFx0XHRcdGxpc3RlbihyZWN0LCBcImZvY3VzXCIsIC8qaGFuZGxlRm9jdXMqLyBjdHhbMjZdKSxcblx0XHRcdFx0XHRsaXN0ZW4odGV4dF8xLCBcImZvY3VzXCIsIC8qaGFuZGxlRm9jdXMqLyBjdHhbMjZdKVxuXHRcdFx0XHRdO1xuXG5cdFx0XHRcdG1vdW50ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cChjdHgsIGRpcnR5KSB7XG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxXaWR0aCwgbWFyZ2luKi8gMjYyNjU2ICYmIHJlY3RfeV92YWx1ZSAhPT0gKHJlY3RfeV92YWx1ZSA9IC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAqIC8qeSovIGN0eFs2Ml0gKyAvKm1hcmdpbiovIGN0eFs5XSkpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcInlcIiwgcmVjdF95X3ZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsSGVpZ2h0LCBtYXJnaW4qLyA0MTk0ODE2ICYmIHJlY3RfeF92YWx1ZSAhPT0gKHJlY3RfeF92YWx1ZSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0pKSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJ4XCIsIHJlY3RfeF92YWx1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbFdpZHRoKi8gMjYyMTQ0KSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJ3aWR0aFwiLCAvKmNlbGxXaWR0aCovIGN0eFsxOF0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxIZWlnaHQqLyA0MTk0MzA0KSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJoZWlnaHRcIiwgLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qaW5uZXJCb3JkZXJDb2xvdXIqLyAyMDQ4KSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJzdHJva2VcIiwgLyppbm5lckJvcmRlckNvbG91ciovIGN0eFsxMV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmlubmVyQm9yZGVyV2lkdGgqLyAyNTYpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcInN0cm9rZS13aWR0aFwiLCAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmJhY2tncm91bmRDb2xvdXIqLyA4MTkyKSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJmaWxsXCIsIC8qYmFja2dyb3VuZENvbG91ciovIGN0eFsxM10pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmdyaWQqLyAxICYmIHRfdmFsdWUgIT09ICh0X3ZhbHVlID0gLypsZXR0ZXIqLyBjdHhbNjNdICsgXCJcIikpIHNldF9kYXRhKHQsIHRfdmFsdWUpO1xuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxXaWR0aCwgbWFyZ2luKi8gMjYyNjU2ICYmIHRleHRfMV94X3ZhbHVlICE9PSAodGV4dF8xX3hfdmFsdWUgPSAvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmNlbGxXaWR0aCovIGN0eFsxOF0gLyAyKSkge1xuXHRcdFx0XHRhdHRyKHRleHRfMSwgXCJ4XCIsIHRleHRfMV94X3ZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsSGVpZ2h0LCBtYXJnaW4qLyA0MTk0ODE2ICYmIHRleHRfMV95X3ZhbHVlICE9PSAodGV4dF8xX3lfdmFsdWUgPSAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogLyp5Ki8gY3R4WzYyXSArIC8qbWFyZ2luKi8gY3R4WzldICsgLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAtIC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAwLjEpKSB7XG5cdFx0XHRcdGF0dHIodGV4dF8xLCBcInlcIiwgdGV4dF8xX3lfdmFsdWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmZvbnRTaXplKi8gMTA0ODU3Nikge1xuXHRcdFx0XHRhdHRyKHRleHRfMSwgXCJmb250LXNpemVcIiwgLypmb250U2l6ZSovIGN0eFsyMF0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxXaWR0aCovIDI2MjE0NCkge1xuXHRcdFx0XHRhdHRyKHRleHRfMSwgXCJ3aWR0aFwiLCAvKmNlbGxXaWR0aCovIGN0eFsxOF0pO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaChyZWN0KTtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaCh0ZXh0XzEpO1xuXHRcdFx0bW91bnRlZCA9IGZhbHNlO1xuXHRcdFx0cnVuX2FsbChkaXNwb3NlKTtcblx0XHR9XG5cdH07XG59XG5cbi8vICg0NjI6MjgpIHsjaWYgbGV0dGVyPT1cIiNcIn1cbmZ1bmN0aW9uIGNyZWF0ZV9pZl9ibG9ja18xKGN0eCkge1xuXHRsZXQgcmVjdDtcblx0bGV0IHJlY3RfeV92YWx1ZTtcblx0bGV0IHJlY3RfeF92YWx1ZTtcblx0bGV0IGxpbmUwO1xuXHRsZXQgbGluZTBfeV9fdmFsdWU7XG5cdGxldCBsaW5lMF94X192YWx1ZTtcblx0bGV0IGxpbmUwX3lfX3ZhbHVlXzE7XG5cdGxldCBsaW5lMF94X192YWx1ZV8xO1xuXHRsZXQgbGluZTE7XG5cdGxldCBsaW5lMV95X192YWx1ZTtcblx0bGV0IGxpbmUxX3hfX3ZhbHVlO1xuXHRsZXQgbGluZTFfeV9fdmFsdWVfMTtcblx0bGV0IGxpbmUxX3hfX3ZhbHVlXzE7XG5cdGxldCBsaW5lMV90cmFuc2Zvcm1fdmFsdWU7XG5cdGxldCBtb3VudGVkO1xuXHRsZXQgZGlzcG9zZTtcblxuXHRyZXR1cm4ge1xuXHRcdGMoKSB7XG5cdFx0XHRyZWN0ID0gc3ZnX2VsZW1lbnQoXCJyZWN0XCIpO1xuXHRcdFx0bGluZTAgPSBzdmdfZWxlbWVudChcImxpbmVcIik7XG5cdFx0XHRsaW5lMSA9IHN2Z19lbGVtZW50KFwibGluZVwiKTtcblx0XHRcdGF0dHIocmVjdCwgXCJjbGFzc1wiLCBcImp4d29yZC1jZWxsLXJlY3Qgc3ZlbHRlLTEwMTNqNW1cIik7XG5cdFx0XHRhdHRyKHJlY3QsIFwicm9sZVwiLCBcImNlbGxcIik7XG5cdFx0XHRhdHRyKHJlY3QsIFwidGFiaW5kZXhcIiwgXCItMVwiKTtcblx0XHRcdGF0dHIocmVjdCwgXCJhcmlhLWxhYmVsXCIsIFwiYmxhbmtcIik7XG5cdFx0XHRhdHRyKHJlY3QsIFwieVwiLCByZWN0X3lfdmFsdWUgPSAvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKnkqLyBjdHhbNjJdICsgLyptYXJnaW4qLyBjdHhbOV0pO1xuXHRcdFx0YXR0cihyZWN0LCBcInhcIiwgcmVjdF94X3ZhbHVlID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeCovIGN0eFs2NV0gKyAvKm1hcmdpbiovIGN0eFs5XSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwid2lkdGhcIiwgLypjZWxsV2lkdGgqLyBjdHhbMThdKTtcblx0XHRcdGF0dHIocmVjdCwgXCJoZWlnaHRcIiwgLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwic3Ryb2tlXCIsIC8qaW5uZXJCb3JkZXJDb2xvdXIqLyBjdHhbMTFdKTtcblx0XHRcdGF0dHIocmVjdCwgXCJzdHJva2Utd2lkdGhcIiwgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdKTtcblx0XHRcdGF0dHIocmVjdCwgXCJmaWxsXCIsIC8qZmlsbENvbG91ciovIGN0eFsxMl0pO1xuXHRcdFx0YXR0cihyZWN0LCBcImRhdGEtY29sXCIsIC8qeSovIGN0eFs2Ml0pO1xuXHRcdFx0YXR0cihyZWN0LCBcImRhdGEtcm93XCIsIC8qeCovIGN0eFs2NV0pO1xuXHRcdFx0YXR0cihsaW5lMCwgXCJjbGFzc1wiLCBcImp4d29yZC1jZWxsLWxpbmUganh3b3JkLW5vLXByaW50IHN2ZWx0ZS0xMDEzajVtXCIpO1xuXHRcdFx0YXR0cihsaW5lMCwgXCJyb2xlXCIsIFwiY2VsbFwiKTtcblx0XHRcdGF0dHIobGluZTAsIFwidGFiaW5kZXhcIiwgXCItMVwiKTtcblx0XHRcdGF0dHIobGluZTAsIFwieTFcIiwgbGluZTBfeV9fdmFsdWUgPSAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogLyp5Ki8gY3R4WzYyXSArIC8qbWFyZ2luKi8gY3R4WzldICsgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdKTtcblx0XHRcdGF0dHIobGluZTAsIFwieDFcIiwgbGluZTBfeF9fdmFsdWUgPSAvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0pO1xuXHRcdFx0YXR0cihsaW5lMCwgXCJ5MlwiLCBsaW5lMF95X192YWx1ZV8xID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeSovIGN0eFs2Ml0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0gKiAvKnkqLyBjdHhbNjJdICsgLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSk7XG5cdFx0XHRhdHRyKGxpbmUwLCBcIngyXCIsIGxpbmUwX3hfX3ZhbHVlXzEgPSAvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKngqLyBjdHhbNjVdICsgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdICogLyp5Ki8gY3R4WzYyXSArIC8qY2VsbFdpZHRoKi8gY3R4WzE4XSk7XG5cdFx0XHRhdHRyKGxpbmUwLCBcInN0cm9rZVwiLCAvKmlubmVyQm9yZGVyQ29sb3VyKi8gY3R4WzExXSk7XG5cdFx0XHRhdHRyKGxpbmUwLCBcInN0cm9rZS13aWR0aFwiLCAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0pO1xuXHRcdFx0YXR0cihsaW5lMCwgXCJkYXRhLWNvbFwiLCAvKnkqLyBjdHhbNjJdKTtcblx0XHRcdGF0dHIobGluZTAsIFwiZGF0YS1yb3dcIiwgLyp4Ki8gY3R4WzY1XSk7XG5cdFx0XHRhdHRyKGxpbmUxLCBcImNsYXNzXCIsIFwianh3b3JkLW5vLXByaW50IGp4d29yZC1jZWxsLWxpbmUgc3ZlbHRlLTEwMTNqNW1cIik7XG5cdFx0XHRhdHRyKGxpbmUxLCBcInJvbGVcIiwgXCJjZWxsXCIpO1xuXHRcdFx0YXR0cihsaW5lMSwgXCJ0YWJpbmRleFwiLCBcIi0xXCIpO1xuXHRcdFx0YXR0cihsaW5lMSwgXCJ5MVwiLCBsaW5lMV95X192YWx1ZSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKnkqLyBjdHhbNjJdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0pO1xuXHRcdFx0YXR0cihsaW5lMSwgXCJ4MVwiLCBsaW5lMV94X192YWx1ZSA9IC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAqIC8qeCovIGN0eFs2NV0gKyAvKm1hcmdpbiovIGN0eFs5XSArIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSk7XG5cdFx0XHRhdHRyKGxpbmUxLCBcInkyXCIsIGxpbmUxX3lfX3ZhbHVlXzEgPSAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogLyp5Ki8gY3R4WzYyXSArIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSAqIC8qeSovIGN0eFs2Ml0gKyAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdKTtcblx0XHRcdGF0dHIobGluZTEsIFwieDJcIiwgbGluZTFfeF9fdmFsdWVfMSA9IC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAqIC8qeCovIGN0eFs2NV0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0gKiAvKnkqLyBjdHhbNjJdICsgLypjZWxsV2lkdGgqLyBjdHhbMThdKTtcblx0XHRcdGF0dHIobGluZTEsIFwic3Ryb2tlXCIsIC8qaW5uZXJCb3JkZXJDb2xvdXIqLyBjdHhbMTFdKTtcblx0XHRcdGF0dHIobGluZTEsIFwic3Ryb2tlLXdpZHRoXCIsIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSk7XG5cdFx0XHRhdHRyKGxpbmUxLCBcImRhdGEtY29sXCIsIC8qeSovIGN0eFs2Ml0pO1xuXHRcdFx0YXR0cihsaW5lMSwgXCJkYXRhLXJvd1wiLCAvKngqLyBjdHhbNjVdKTtcblx0XHRcdGF0dHIobGluZTEsIFwidHJhbnNmb3JtXCIsIGxpbmUxX3RyYW5zZm9ybV92YWx1ZSA9IFwicm90YXRlKDkwLCBcIiArICgvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmNlbGxXaWR0aCovIGN0eFsxOF0gLyAyKSArIFwiLCBcIiArICgvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogLyp5Ki8gY3R4WzYyXSArIC8qbWFyZ2luKi8gY3R4WzldICsgLypjZWxsV2lkdGgqLyBjdHhbMThdIC8gMikgKyBcIilcIik7XG5cdFx0fSxcblx0XHRtKHRhcmdldCwgYW5jaG9yKSB7XG5cdFx0XHRpbnNlcnQodGFyZ2V0LCByZWN0LCBhbmNob3IpO1xuXHRcdFx0aW5zZXJ0KHRhcmdldCwgbGluZTAsIGFuY2hvcik7XG5cdFx0XHRpbnNlcnQodGFyZ2V0LCBsaW5lMSwgYW5jaG9yKTtcblxuXHRcdFx0aWYgKCFtb3VudGVkKSB7XG5cdFx0XHRcdGRpc3Bvc2UgPSBbXG5cdFx0XHRcdFx0bGlzdGVuKHJlY3QsIFwiZm9jdXNcIiwgLypoYW5kbGVGb2N1cyovIGN0eFsyNl0pLFxuXHRcdFx0XHRcdGxpc3RlbihsaW5lMCwgXCJmb2N1c1wiLCAvKmhhbmRsZUZvY3VzKi8gY3R4WzI2XSksXG5cdFx0XHRcdFx0bGlzdGVuKGxpbmUxLCBcImZvY3VzXCIsIC8qaGFuZGxlRm9jdXMqLyBjdHhbMjZdKVxuXHRcdFx0XHRdO1xuXG5cdFx0XHRcdG1vdW50ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cChjdHgsIGRpcnR5KSB7XG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxXaWR0aCwgbWFyZ2luKi8gMjYyNjU2ICYmIHJlY3RfeV92YWx1ZSAhPT0gKHJlY3RfeV92YWx1ZSA9IC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAqIC8qeSovIGN0eFs2Ml0gKyAvKm1hcmdpbiovIGN0eFs5XSkpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcInlcIiwgcmVjdF95X3ZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsSGVpZ2h0LCBtYXJnaW4qLyA0MTk0ODE2ICYmIHJlY3RfeF92YWx1ZSAhPT0gKHJlY3RfeF92YWx1ZSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0pKSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJ4XCIsIHJlY3RfeF92YWx1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbFdpZHRoKi8gMjYyMTQ0KSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJ3aWR0aFwiLCAvKmNlbGxXaWR0aCovIGN0eFsxOF0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxIZWlnaHQqLyA0MTk0MzA0KSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJoZWlnaHRcIiwgLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qaW5uZXJCb3JkZXJDb2xvdXIqLyAyMDQ4KSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJzdHJva2VcIiwgLyppbm5lckJvcmRlckNvbG91ciovIGN0eFsxMV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmlubmVyQm9yZGVyV2lkdGgqLyAyNTYpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcInN0cm9rZS13aWR0aFwiLCAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmZpbGxDb2xvdXIqLyA0MDk2KSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJmaWxsXCIsIC8qZmlsbENvbG91ciovIGN0eFsxMl0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxIZWlnaHQsIG1hcmdpbiwgaW5uZXJCb3JkZXJXaWR0aCovIDQxOTUwNzIgJiYgbGluZTBfeV9fdmFsdWUgIT09IChsaW5lMF95X192YWx1ZSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKnkqLyBjdHhbNjJdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0pKSB7XG5cdFx0XHRcdGF0dHIobGluZTAsIFwieTFcIiwgbGluZTBfeV9fdmFsdWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxXaWR0aCwgbWFyZ2luLCBpbm5lckJvcmRlcldpZHRoKi8gMjYyOTEyICYmIGxpbmUwX3hfX3ZhbHVlICE9PSAobGluZTBfeF9fdmFsdWUgPSAvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0pKSB7XG5cdFx0XHRcdGF0dHIobGluZTAsIFwieDFcIiwgbGluZTBfeF9fdmFsdWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxIZWlnaHQsIGlubmVyQm9yZGVyV2lkdGgqLyA0MTk0NTYwICYmIGxpbmUwX3lfX3ZhbHVlXzEgIT09IChsaW5lMF95X192YWx1ZV8xID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeSovIGN0eFs2Ml0gKyAvKmlubmVyQm9yZGVyV2lkdGgqLyBjdHhbOF0gKiAvKnkqLyBjdHhbNjJdICsgLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSkpIHtcblx0XHRcdFx0YXR0cihsaW5lMCwgXCJ5MlwiLCBsaW5lMF95X192YWx1ZV8xKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsV2lkdGgsIGlubmVyQm9yZGVyV2lkdGgqLyAyNjI0MDAgJiYgbGluZTBfeF9fdmFsdWVfMSAhPT0gKGxpbmUwX3hfX3ZhbHVlXzEgPSAvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKngqLyBjdHhbNjVdICsgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdICogLyp5Ki8gY3R4WzYyXSArIC8qY2VsbFdpZHRoKi8gY3R4WzE4XSkpIHtcblx0XHRcdFx0YXR0cihsaW5lMCwgXCJ4MlwiLCBsaW5lMF94X192YWx1ZV8xKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLyppbm5lckJvcmRlckNvbG91ciovIDIwNDgpIHtcblx0XHRcdFx0YXR0cihsaW5lMCwgXCJzdHJva2VcIiwgLyppbm5lckJvcmRlckNvbG91ciovIGN0eFsxMV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmlubmVyQm9yZGVyV2lkdGgqLyAyNTYpIHtcblx0XHRcdFx0YXR0cihsaW5lMCwgXCJzdHJva2Utd2lkdGhcIiwgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsSGVpZ2h0LCBtYXJnaW4sIGlubmVyQm9yZGVyV2lkdGgqLyA0MTk1MDcyICYmIGxpbmUxX3lfX3ZhbHVlICE9PSAobGluZTFfeV9fdmFsdWUgPSAvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogLyp5Ki8gY3R4WzYyXSArIC8qbWFyZ2luKi8gY3R4WzldICsgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdKSkge1xuXHRcdFx0XHRhdHRyKGxpbmUxLCBcInkxXCIsIGxpbmUxX3lfX3ZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsV2lkdGgsIG1hcmdpbiwgaW5uZXJCb3JkZXJXaWR0aCovIDI2MjkxMiAmJiBsaW5lMV94X192YWx1ZSAhPT0gKGxpbmUxX3hfX3ZhbHVlID0gLypjZWxsV2lkdGgqLyBjdHhbMThdICogLyp4Ki8gY3R4WzY1XSArIC8qbWFyZ2luKi8gY3R4WzldICsgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdKSkge1xuXHRcdFx0XHRhdHRyKGxpbmUxLCBcIngxXCIsIGxpbmUxX3hfX3ZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsSGVpZ2h0LCBpbm5lckJvcmRlcldpZHRoKi8gNDE5NDU2MCAmJiBsaW5lMV95X192YWx1ZV8xICE9PSAobGluZTFfeV9fdmFsdWVfMSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKnkqLyBjdHhbNjJdICsgLyppbm5lckJvcmRlcldpZHRoKi8gY3R4WzhdICogLyp5Ki8gY3R4WzYyXSArIC8qY2VsbEhlaWdodCovIGN0eFsyMl0pKSB7XG5cdFx0XHRcdGF0dHIobGluZTEsIFwieTJcIiwgbGluZTFfeV9fdmFsdWVfMSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbFdpZHRoLCBpbm5lckJvcmRlcldpZHRoKi8gMjYyNDAwICYmIGxpbmUxX3hfX3ZhbHVlXzEgIT09IChsaW5lMV94X192YWx1ZV8xID0gLypjZWxsV2lkdGgqLyBjdHhbMThdICogLyp4Ki8gY3R4WzY1XSArIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSAqIC8qeSovIGN0eFs2Ml0gKyAvKmNlbGxXaWR0aCovIGN0eFsxOF0pKSB7XG5cdFx0XHRcdGF0dHIobGluZTEsIFwieDJcIiwgbGluZTFfeF9fdmFsdWVfMSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qaW5uZXJCb3JkZXJDb2xvdXIqLyAyMDQ4KSB7XG5cdFx0XHRcdGF0dHIobGluZTEsIFwic3Ryb2tlXCIsIC8qaW5uZXJCb3JkZXJDb2xvdXIqLyBjdHhbMTFdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLyppbm5lckJvcmRlcldpZHRoKi8gMjU2KSB7XG5cdFx0XHRcdGF0dHIobGluZTEsIFwic3Ryb2tlLXdpZHRoXCIsIC8qaW5uZXJCb3JkZXJXaWR0aCovIGN0eFs4XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY2VsbFdpZHRoLCBtYXJnaW4sIGNlbGxIZWlnaHQqLyA0NDU2OTYwICYmIGxpbmUxX3RyYW5zZm9ybV92YWx1ZSAhPT0gKGxpbmUxX3RyYW5zZm9ybV92YWx1ZSA9IFwicm90YXRlKDkwLCBcIiArICgvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKmNlbGxXaWR0aCovIGN0eFsxOF0gLyAyKSArIFwiLCBcIiArICgvKmNlbGxIZWlnaHQqLyBjdHhbMjJdICogLyp5Ki8gY3R4WzYyXSArIC8qbWFyZ2luKi8gY3R4WzldICsgLypjZWxsV2lkdGgqLyBjdHhbMThdIC8gMikgKyBcIilcIikpIHtcblx0XHRcdFx0YXR0cihsaW5lMSwgXCJ0cmFuc2Zvcm1cIiwgbGluZTFfdHJhbnNmb3JtX3ZhbHVlKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2gocmVjdCk7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2gobGluZTApO1xuXHRcdFx0aWYgKGRldGFjaGluZykgZGV0YWNoKGxpbmUxKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdHJ1bl9hbGwoZGlzcG9zZSk7XG5cdFx0fVxuXHR9O1xufVxuXG4vLyAoNDcxOjI4KSB7I2lmIChudW1iZXJfZ3JpZFt5XVt4XSAhPSBudWxsICYmIGxldHRlciE9PVwiI1wiKX1cbmZ1bmN0aW9uIGNyZWF0ZV9pZl9ibG9jayhjdHgpIHtcblx0bGV0IHRleHRfMTtcblx0bGV0IHRfdmFsdWUgPSAvKm51bWJlcl9ncmlkKi8gY3R4WzE3XVsvKnkqLyBjdHhbNjJdXVsvKngqLyBjdHhbNjVdXSArIFwiXCI7XG5cdGxldCB0O1xuXHRsZXQgdGV4dF8xX3hfdmFsdWU7XG5cdGxldCB0ZXh0XzFfeV92YWx1ZTtcblx0bGV0IG1vdW50ZWQ7XG5cdGxldCBkaXNwb3NlO1xuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdHRleHRfMSA9IHN2Z19lbGVtZW50KFwidGV4dFwiKTtcblx0XHRcdHQgPSB0ZXh0KHRfdmFsdWUpO1xuXHRcdFx0YXR0cih0ZXh0XzEsIFwieFwiLCB0ZXh0XzFfeF92YWx1ZSA9IC8qY2VsbFdpZHRoKi8gY3R4WzE4XSAqIC8qeCovIGN0eFs2NV0gKyAvKm1hcmdpbiovIGN0eFs5XSArIDIpO1xuXHRcdFx0YXR0cih0ZXh0XzEsIFwieVwiLCB0ZXh0XzFfeV92YWx1ZSA9IC8qY2VsbEhlaWdodCovIGN0eFsyMl0gKiAvKnkqLyBjdHhbNjJdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAvKm51bUZvbnRTaXplKi8gY3R4WzIxXSk7XG5cdFx0XHRhdHRyKHRleHRfMSwgXCJ0ZXh0LWFuY2hvclwiLCBcImxlZnRcIik7XG5cdFx0XHRhdHRyKHRleHRfMSwgXCJmb250LXNpemVcIiwgLypudW1Gb250U2l6ZSovIGN0eFsyMV0pO1xuXHRcdFx0YXR0cih0ZXh0XzEsIFwiY2xhc3NcIiwgXCJzdmVsdGUtMTAxM2o1bVwiKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGluc2VydCh0YXJnZXQsIHRleHRfMSwgYW5jaG9yKTtcblx0XHRcdGFwcGVuZCh0ZXh0XzEsIHQpO1xuXG5cdFx0XHRpZiAoIW1vdW50ZWQpIHtcblx0XHRcdFx0ZGlzcG9zZSA9IGxpc3Rlbih0ZXh0XzEsIFwiZm9jdXNcIiwgLypoYW5kbGVGb2N1cyovIGN0eFsyNl0pO1xuXHRcdFx0XHRtb3VudGVkID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHAoY3R4LCBkaXJ0eSkge1xuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypudW1iZXJfZ3JpZCovIDEzMTA3MiAmJiB0X3ZhbHVlICE9PSAodF92YWx1ZSA9IC8qbnVtYmVyX2dyaWQqLyBjdHhbMTddWy8qeSovIGN0eFs2Ml1dWy8qeCovIGN0eFs2NV1dICsgXCJcIikpIHNldF9kYXRhKHQsIHRfdmFsdWUpO1xuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmNlbGxXaWR0aCwgbWFyZ2luKi8gMjYyNjU2ICYmIHRleHRfMV94X3ZhbHVlICE9PSAodGV4dF8xX3hfdmFsdWUgPSAvKmNlbGxXaWR0aCovIGN0eFsxOF0gKiAvKngqLyBjdHhbNjVdICsgLyptYXJnaW4qLyBjdHhbOV0gKyAyKSkge1xuXHRcdFx0XHRhdHRyKHRleHRfMSwgXCJ4XCIsIHRleHRfMV94X3ZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypjZWxsSGVpZ2h0LCBtYXJnaW4sIG51bUZvbnRTaXplKi8gNjI5MTk2OCAmJiB0ZXh0XzFfeV92YWx1ZSAhPT0gKHRleHRfMV95X3ZhbHVlID0gLypjZWxsSGVpZ2h0Ki8gY3R4WzIyXSAqIC8qeSovIGN0eFs2Ml0gKyAvKm1hcmdpbiovIGN0eFs5XSArIC8qbnVtRm9udFNpemUqLyBjdHhbMjFdKSkge1xuXHRcdFx0XHRhdHRyKHRleHRfMSwgXCJ5XCIsIHRleHRfMV95X3ZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypudW1Gb250U2l6ZSovIDIwOTcxNTIpIHtcblx0XHRcdFx0YXR0cih0ZXh0XzEsIFwiZm9udC1zaXplXCIsIC8qbnVtRm9udFNpemUqLyBjdHhbMjFdKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2godGV4dF8xKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdGRpc3Bvc2UoKTtcblx0XHR9XG5cdH07XG59XG5cbi8vICg0NjA6MjApIHsjZWFjaCBjb2xfZGF0YSBhcyBsZXR0ZXIsIHh9XG5mdW5jdGlvbiBjcmVhdGVfZWFjaF9ibG9ja18xJDEoY3R4KSB7XG5cdGxldCBnO1xuXHRsZXQgaWZfYmxvY2swX2FuY2hvcjtcblx0bGV0IG1vdW50ZWQ7XG5cdGxldCBkaXNwb3NlO1xuXG5cdGZ1bmN0aW9uIHNlbGVjdF9ibG9ja190eXBlKGN0eCwgZGlydHkpIHtcblx0XHRpZiAoLypsZXR0ZXIqLyBjdHhbNjNdID09IFwiI1wiKSByZXR1cm4gY3JlYXRlX2lmX2Jsb2NrXzE7XG5cdFx0cmV0dXJuIGNyZWF0ZV9lbHNlX2Jsb2NrO1xuXHR9XG5cblx0bGV0IGN1cnJlbnRfYmxvY2tfdHlwZSA9IHNlbGVjdF9ibG9ja190eXBlKGN0eCk7XG5cdGxldCBpZl9ibG9jazAgPSBjdXJyZW50X2Jsb2NrX3R5cGUoY3R4KTtcblx0bGV0IGlmX2Jsb2NrMSA9IC8qbnVtYmVyX2dyaWQqLyBjdHhbMTddWy8qeSovIGN0eFs2Ml1dWy8qeCovIGN0eFs2NV1dICE9IG51bGwgJiYgLypsZXR0ZXIqLyBjdHhbNjNdICE9PSBcIiNcIiAmJiBjcmVhdGVfaWZfYmxvY2soY3R4KTtcblxuXHRmdW5jdGlvbiBjbGlja19oYW5kbGVyKCkge1xuXHRcdHJldHVybiAvKmNsaWNrX2hhbmRsZXIqLyBjdHhbNDRdKC8qeCovIGN0eFs2NV0sIC8qeSovIGN0eFs2Ml0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGJsY2xpY2tfaGFuZGxlcigpIHtcblx0XHRyZXR1cm4gLypkYmxjbGlja19oYW5kbGVyKi8gY3R4WzQ1XSgvKngqLyBjdHhbNjVdLCAvKnkqLyBjdHhbNjJdKTtcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdGcgPSBzdmdfZWxlbWVudChcImdcIik7XG5cdFx0XHRpZl9ibG9jazAuYygpO1xuXHRcdFx0aWZfYmxvY2swX2FuY2hvciA9IGVtcHR5KCk7XG5cdFx0XHRpZiAoaWZfYmxvY2sxKSBpZl9ibG9jazEuYygpO1xuXHRcdFx0YXR0cihnLCBcImlkXCIsIFwianh3b3JkLWNlbGwtXCIgKyAvKngqLyBjdHhbNjVdICsgXCItXCIgKyAvKnkqLyBjdHhbNjJdKTtcblx0XHRcdGF0dHIoZywgXCJjbGFzc1wiLCBcImp4d29yZC1jZWxsIHN2ZWx0ZS0xMDEzajVtXCIpO1xuXHRcdFx0c2V0X3N0eWxlKGcsIFwiei1pbmRleFwiLCBcIjIwXCIpO1xuXHRcdFx0dG9nZ2xlX2NsYXNzKGcsIFwic2VsZWN0ZWRcIiwgLypjdXJyZW50X3kqLyBjdHhbMl0gPT09IC8qeSovIGN0eFs2Ml0gJiYgLypjdXJyZW50X3gqLyBjdHhbMV0gPT09IC8qeCovIGN0eFs2NV0pO1xuXHRcdFx0dG9nZ2xlX2NsYXNzKGcsIFwiYWN0aXZlXCIsIC8qbWFya2VkX3dvcmRfZ3JpZCovIGN0eFsxOV1bLyp5Ki8gY3R4WzYyXV1bLyp4Ki8gY3R4WzY1XV0pO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0aW5zZXJ0KHRhcmdldCwgZywgYW5jaG9yKTtcblx0XHRcdGlmX2Jsb2NrMC5tKGcsIG51bGwpO1xuXHRcdFx0YXBwZW5kKGcsIGlmX2Jsb2NrMF9hbmNob3IpO1xuXHRcdFx0aWYgKGlmX2Jsb2NrMSkgaWZfYmxvY2sxLm0oZywgbnVsbCk7XG5cblx0XHRcdGlmICghbW91bnRlZCkge1xuXHRcdFx0XHRkaXNwb3NlID0gW1xuXHRcdFx0XHRcdGxpc3RlbihnLCBcImNsaWNrXCIsIGNsaWNrX2hhbmRsZXIpLFxuXHRcdFx0XHRcdGxpc3RlbihnLCBcImRibGNsaWNrXCIsIGRibGNsaWNrX2hhbmRsZXIpLFxuXHRcdFx0XHRcdGxpc3RlbihnLCBcImtleWRvd25cIiwgLypoYW5kbGVLZXlkb3duKi8gY3R4WzE2XSlcblx0XHRcdFx0XTtcblxuXHRcdFx0XHRtb3VudGVkID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHAobmV3X2N0eCwgZGlydHkpIHtcblx0XHRcdGN0eCA9IG5ld19jdHg7XG5cblx0XHRcdGlmIChjdXJyZW50X2Jsb2NrX3R5cGUgPT09IChjdXJyZW50X2Jsb2NrX3R5cGUgPSBzZWxlY3RfYmxvY2tfdHlwZShjdHgpKSAmJiBpZl9ibG9jazApIHtcblx0XHRcdFx0aWZfYmxvY2swLnAoY3R4LCBkaXJ0eSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZl9ibG9jazAuZCgxKTtcblx0XHRcdFx0aWZfYmxvY2swID0gY3VycmVudF9ibG9ja190eXBlKGN0eCk7XG5cblx0XHRcdFx0aWYgKGlmX2Jsb2NrMCkge1xuXHRcdFx0XHRcdGlmX2Jsb2NrMC5jKCk7XG5cdFx0XHRcdFx0aWZfYmxvY2swLm0oZywgaWZfYmxvY2swX2FuY2hvcik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKC8qbnVtYmVyX2dyaWQqLyBjdHhbMTddWy8qeSovIGN0eFs2Ml1dWy8qeCovIGN0eFs2NV1dICE9IG51bGwgJiYgLypsZXR0ZXIqLyBjdHhbNjNdICE9PSBcIiNcIikge1xuXHRcdFx0XHRpZiAoaWZfYmxvY2sxKSB7XG5cdFx0XHRcdFx0aWZfYmxvY2sxLnAoY3R4LCBkaXJ0eSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aWZfYmxvY2sxID0gY3JlYXRlX2lmX2Jsb2NrKGN0eCk7XG5cdFx0XHRcdFx0aWZfYmxvY2sxLmMoKTtcblx0XHRcdFx0XHRpZl9ibG9jazEubShnLCBudWxsKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChpZl9ibG9jazEpIHtcblx0XHRcdFx0aWZfYmxvY2sxLmQoMSk7XG5cdFx0XHRcdGlmX2Jsb2NrMSA9IG51bGw7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY3VycmVudF95LCBjdXJyZW50X3gqLyA2KSB7XG5cdFx0XHRcdHRvZ2dsZV9jbGFzcyhnLCBcInNlbGVjdGVkXCIsIC8qY3VycmVudF95Ki8gY3R4WzJdID09PSAvKnkqLyBjdHhbNjJdICYmIC8qY3VycmVudF94Ki8gY3R4WzFdID09PSAvKngqLyBjdHhbNjVdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLyptYXJrZWRfd29yZF9ncmlkKi8gNTI0Mjg4KSB7XG5cdFx0XHRcdHRvZ2dsZV9jbGFzcyhnLCBcImFjdGl2ZVwiLCAvKm1hcmtlZF93b3JkX2dyaWQqLyBjdHhbMTldWy8qeSovIGN0eFs2Ml1dWy8qeCovIGN0eFs2NV1dKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2goZyk7XG5cdFx0XHRpZl9ibG9jazAuZCgpO1xuXHRcdFx0aWYgKGlmX2Jsb2NrMSkgaWZfYmxvY2sxLmQoKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdHJ1bl9hbGwoZGlzcG9zZSk7XG5cdFx0fVxuXHR9O1xufVxuXG4vLyAoNDU5OjE2KSB7I2VhY2ggZ3JpZCBhcyBjb2xfZGF0YSwgeX1cbmZ1bmN0aW9uIGNyZWF0ZV9lYWNoX2Jsb2NrJDEoY3R4KSB7XG5cdGxldCBlYWNoXzFfYW5jaG9yO1xuXHRsZXQgZWFjaF92YWx1ZV8xID0gLypjb2xfZGF0YSovIGN0eFs2MF07XG5cdGxldCBlYWNoX2Jsb2NrcyA9IFtdO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF92YWx1ZV8xLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0ZWFjaF9ibG9ja3NbaV0gPSBjcmVhdGVfZWFjaF9ibG9ja18xJDEoZ2V0X2VhY2hfY29udGV4dF8xJDEoY3R4LCBlYWNoX3ZhbHVlXzEsIGkpKTtcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF9ibG9ja3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0uYygpO1xuXHRcdFx0fVxuXG5cdFx0XHRlYWNoXzFfYW5jaG9yID0gZW1wdHkoKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF9ibG9ja3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0ubSh0YXJnZXQsIGFuY2hvcik7XG5cdFx0XHR9XG5cblx0XHRcdGluc2VydCh0YXJnZXQsIGVhY2hfMV9hbmNob3IsIGFuY2hvcik7XG5cdFx0fSxcblx0XHRwKGN0eCwgZGlydHkpIHtcblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY3VycmVudF95LCBjdXJyZW50X3gsIG1hcmtlZF93b3JkX2dyaWQsIHNldEN1cnJlbnRQb3MsIGhhbmRsZURvdWJsZWNsaWNrLCBoYW5kbGVLZXlkb3duLCBjZWxsV2lkdGgsIG1hcmdpbiwgY2VsbEhlaWdodCwgbnVtRm9udFNpemUsIGhhbmRsZUZvY3VzLCBudW1iZXJfZ3JpZCwgZ3JpZCwgaW5uZXJCb3JkZXJXaWR0aCwgaW5uZXJCb3JkZXJDb2xvdXIsIGZpbGxDb2xvdXIsIGZvbnRTaXplLCBiYWNrZ3JvdW5kQ29sb3VyKi8gMTA5MDM0MjQ3KSB7XG5cdFx0XHRcdGVhY2hfdmFsdWVfMSA9IC8qY29sX2RhdGEqLyBjdHhbNjBdO1xuXHRcdFx0XHRsZXQgaTtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgZWFjaF92YWx1ZV8xLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0Y29uc3QgY2hpbGRfY3R4ID0gZ2V0X2VhY2hfY29udGV4dF8xJDEoY3R4LCBlYWNoX3ZhbHVlXzEsIGkpO1xuXG5cdFx0XHRcdFx0aWYgKGVhY2hfYmxvY2tzW2ldKSB7XG5cdFx0XHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5wKGNoaWxkX2N0eCwgZGlydHkpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXSA9IGNyZWF0ZV9lYWNoX2Jsb2NrXzEkMShjaGlsZF9jdHgpO1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0uYygpO1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0ubShlYWNoXzFfYW5jaG9yLnBhcmVudE5vZGUsIGVhY2hfMV9hbmNob3IpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvciAoOyBpIDwgZWFjaF9ibG9ja3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5kKDEpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZWFjaF9ibG9ja3MubGVuZ3RoID0gZWFjaF92YWx1ZV8xLmxlbmd0aDtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGQoZGV0YWNoaW5nKSB7XG5cdFx0XHRkZXN0cm95X2VhY2goZWFjaF9ibG9ja3MsIGRldGFjaGluZyk7XG5cdFx0XHRpZiAoZGV0YWNoaW5nKSBkZXRhY2goZWFjaF8xX2FuY2hvcik7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVfZnJhZ21lbnQkNChjdHgpIHtcblx0bGV0IG1haW47XG5cdGxldCBkaXY7XG5cdGxldCBpbnB1dDtcblx0bGV0IHQwO1xuXHRsZXQgc3ZnO1xuXHRsZXQgZztcblx0bGV0IHJlY3Q7XG5cdGxldCB0MTtcblx0bGV0IHF1ZXN0aW9ucztcblx0bGV0IGN1cnJlbnQ7XG5cdGxldCBtb3VudGVkO1xuXHRsZXQgZGlzcG9zZTtcblx0bGV0IGVhY2hfdmFsdWUgPSAvKmdyaWQqLyBjdHhbMF07XG5cdGxldCBlYWNoX2Jsb2NrcyA9IFtdO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF92YWx1ZS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdGVhY2hfYmxvY2tzW2ldID0gY3JlYXRlX2VhY2hfYmxvY2skMShnZXRfZWFjaF9jb250ZXh0JDEoY3R4LCBlYWNoX3ZhbHVlLCBpKSk7XG5cdH1cblxuXHRxdWVzdGlvbnMgPSBuZXcgUXVlc3Rpb25zKHt9KTtcblx0cXVlc3Rpb25zLiRvbihcImNoYW5nZVwiLCAvKmNoYW5nZV9oYW5kbGVyKi8gY3R4WzQ3XSk7XG5cdHF1ZXN0aW9ucy4kb24oXCJ1cGRhdGVfcXVlc3Rpb25cIiwgLypoYW5kbGVVcGRhdGVRdWVzdGlvbiovIGN0eFsyN10pO1xuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdG1haW4gPSBlbGVtZW50KFwibWFpblwiKTtcblx0XHRcdGRpdiA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRpbnB1dCA9IGVsZW1lbnQoXCJpbnB1dFwiKTtcblx0XHRcdHQwID0gc3BhY2UoKTtcblx0XHRcdHN2ZyA9IHN2Z19lbGVtZW50KFwic3ZnXCIpO1xuXHRcdFx0ZyA9IHN2Z19lbGVtZW50KFwiZ1wiKTtcblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX2Jsb2Nrcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5jKCk7XG5cdFx0XHR9XG5cblx0XHRcdHJlY3QgPSBzdmdfZWxlbWVudChcInJlY3RcIik7XG5cdFx0XHR0MSA9IHNwYWNlKCk7XG5cdFx0XHRjcmVhdGVfY29tcG9uZW50KHF1ZXN0aW9ucy4kJC5mcmFnbWVudCk7XG5cdFx0XHRhdHRyKGlucHV0LCBcInR5cGVcIiwgXCJ0ZXh0XCIpO1xuXHRcdFx0YXR0cihpbnB1dCwgXCJjbGFzc1wiLCBcInN2ZWx0ZS0xMDEzajVtXCIpO1xuXHRcdFx0YXR0cihyZWN0LCBcInhcIiwgLyptYXJnaW4qLyBjdHhbOV0pO1xuXHRcdFx0YXR0cihyZWN0LCBcInlcIiwgLyptYXJnaW4qLyBjdHhbOV0pO1xuXHRcdFx0YXR0cihyZWN0LCBcIndpZHRoXCIsIC8qdG90YWxXaWR0aCovIGN0eFs1XSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwiaGVpZ2h0XCIsIC8qdG90YWxIZWlnaHQqLyBjdHhbNl0pO1xuXHRcdFx0YXR0cihyZWN0LCBcInN0cm9rZVwiLCAvKm91dGVyQm9yZGVyQ29sb3VyKi8gY3R4WzEwXSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwic3Ryb2tlLXdpZHRoXCIsIC8qb3V0ZXJCb3JkZXJXaWR0aCovIGN0eFs3XSk7XG5cdFx0XHRhdHRyKHJlY3QsIFwiZmlsbFwiLCBcIm5vbmVcIik7XG5cdFx0XHRhdHRyKHJlY3QsIFwiY2xhc3NcIiwgXCJzdmVsdGUtMTAxM2o1bVwiKTtcblx0XHRcdGF0dHIoZywgXCJjbGFzc1wiLCBcImNlbGwtZ3JvdXAgc3ZlbHRlLTEwMTNqNW1cIik7XG5cdFx0XHRhdHRyKHN2ZywgXCJjbGFzc1wiLCBcImp4d29yZC1zdmcgc3ZlbHRlLTEwMTNqNW1cIik7XG5cdFx0XHRhdHRyKHN2ZywgXCJtaW4teFwiLCBcIjBcIik7XG5cdFx0XHRhdHRyKHN2ZywgXCJtaW4teVwiLCBcIjBcIik7XG5cdFx0XHRhdHRyKHN2ZywgXCJ3aWR0aFwiLCAvKnZpZXdib3hfd2lkdGgqLyBjdHhbMjNdKTtcblx0XHRcdGF0dHIoc3ZnLCBcImhlaWdodFwiLCAvKnZpZXdib3hfaGVpZ2h0Ki8gY3R4WzI0XSk7XG5cdFx0XHRhdHRyKGRpdiwgXCJjbGFzc1wiLCBcImp4d29yZC1zdmctY29udGFpbmVyIHN2ZWx0ZS0xMDEzajVtXCIpO1xuXHRcdFx0YXR0cihtYWluLCBcImNsYXNzXCIsIFwic3ZlbHRlLTEwMTNqNW1cIik7XG5cdFx0fSxcblx0XHRtKHRhcmdldCwgYW5jaG9yKSB7XG5cdFx0XHRpbnNlcnQodGFyZ2V0LCBtYWluLCBhbmNob3IpO1xuXHRcdFx0YXBwZW5kKG1haW4sIGRpdik7XG5cdFx0XHRhcHBlbmQoZGl2LCBpbnB1dCk7XG5cdFx0XHQvKmlucHV0X2JpbmRpbmcqLyBjdHhbNDNdKGlucHV0KTtcblx0XHRcdGFwcGVuZChkaXYsIHQwKTtcblx0XHRcdGFwcGVuZChkaXYsIHN2Zyk7XG5cdFx0XHRhcHBlbmQoc3ZnLCBnKTtcblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX2Jsb2Nrcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5tKGcsIG51bGwpO1xuXHRcdFx0fVxuXG5cdFx0XHRhcHBlbmQoZywgcmVjdCk7XG5cdFx0XHQvKmRpdl9iaW5kaW5nKi8gY3R4WzQ2XShkaXYpO1xuXHRcdFx0YXBwZW5kKG1haW4sIHQxKTtcblx0XHRcdG1vdW50X2NvbXBvbmVudChxdWVzdGlvbnMsIG1haW4sIG51bGwpO1xuXHRcdFx0Y3VycmVudCA9IHRydWU7XG5cblx0XHRcdGlmICghbW91bnRlZCkge1xuXHRcdFx0XHRkaXNwb3NlID0gW1xuXHRcdFx0XHRcdGxpc3RlbihpbnB1dCwgXCJrZXlkb3duXCIsIC8qaGFuZGxlS2V5ZG93biovIGN0eFsxNl0pLFxuXHRcdFx0XHRcdGxpc3RlbihyZWN0LCBcImZvY3VzXCIsIC8qaGFuZGxlRm9jdXMqLyBjdHhbMjZdKSxcblx0XHRcdFx0XHRsaXN0ZW4obWFpbiwgXCJtb3ZlXCIsIC8qaGFuZGxlTW92ZSovIGN0eFsxNF0pXG5cdFx0XHRcdF07XG5cblx0XHRcdFx0bW91bnRlZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRwKGN0eCwgZGlydHkpIHtcblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qZ3JpZCwgY3VycmVudF95LCBjdXJyZW50X3gsIG1hcmtlZF93b3JkX2dyaWQsIHNldEN1cnJlbnRQb3MsIGhhbmRsZURvdWJsZWNsaWNrLCBoYW5kbGVLZXlkb3duLCBjZWxsV2lkdGgsIG1hcmdpbiwgY2VsbEhlaWdodCwgbnVtRm9udFNpemUsIGhhbmRsZUZvY3VzLCBudW1iZXJfZ3JpZCwgaW5uZXJCb3JkZXJXaWR0aCwgaW5uZXJCb3JkZXJDb2xvdXIsIGZpbGxDb2xvdXIsIGZvbnRTaXplLCBiYWNrZ3JvdW5kQ29sb3VyKi8gMTA5MDM0MjQ3KSB7XG5cdFx0XHRcdGVhY2hfdmFsdWUgPSAvKmdyaWQqLyBjdHhbMF07XG5cdFx0XHRcdGxldCBpO1xuXG5cdFx0XHRcdGZvciAoaSA9IDA7IGkgPCBlYWNoX3ZhbHVlLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0Y29uc3QgY2hpbGRfY3R4ID0gZ2V0X2VhY2hfY29udGV4dCQxKGN0eCwgZWFjaF92YWx1ZSwgaSk7XG5cblx0XHRcdFx0XHRpZiAoZWFjaF9ibG9ja3NbaV0pIHtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldLnAoY2hpbGRfY3R4LCBkaXJ0eSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldID0gY3JlYXRlX2VhY2hfYmxvY2skMShjaGlsZF9jdHgpO1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0uYygpO1xuXHRcdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0ubShnLCByZWN0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmb3IgKDsgaSA8IGVhY2hfYmxvY2tzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0ZWFjaF9ibG9ja3NbaV0uZCgxKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGVhY2hfYmxvY2tzLmxlbmd0aCA9IGVhY2hfdmFsdWUubGVuZ3RoO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWN1cnJlbnQgfHwgZGlydHlbMF0gJiAvKm1hcmdpbiovIDUxMikge1xuXHRcdFx0XHRhdHRyKHJlY3QsIFwieFwiLCAvKm1hcmdpbiovIGN0eFs5XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghY3VycmVudCB8fCBkaXJ0eVswXSAmIC8qbWFyZ2luKi8gNTEyKSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJ5XCIsIC8qbWFyZ2luKi8gY3R4WzldKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFjdXJyZW50IHx8IGRpcnR5WzBdICYgLyp0b3RhbFdpZHRoKi8gMzIpIHtcblx0XHRcdFx0YXR0cihyZWN0LCBcIndpZHRoXCIsIC8qdG90YWxXaWR0aCovIGN0eFs1XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghY3VycmVudCB8fCBkaXJ0eVswXSAmIC8qdG90YWxIZWlnaHQqLyA2NCkge1xuXHRcdFx0XHRhdHRyKHJlY3QsIFwiaGVpZ2h0XCIsIC8qdG90YWxIZWlnaHQqLyBjdHhbNl0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWN1cnJlbnQgfHwgZGlydHlbMF0gJiAvKm91dGVyQm9yZGVyQ29sb3VyKi8gMTAyNCkge1xuXHRcdFx0XHRhdHRyKHJlY3QsIFwic3Ryb2tlXCIsIC8qb3V0ZXJCb3JkZXJDb2xvdXIqLyBjdHhbMTBdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFjdXJyZW50IHx8IGRpcnR5WzBdICYgLypvdXRlckJvcmRlcldpZHRoKi8gMTI4KSB7XG5cdFx0XHRcdGF0dHIocmVjdCwgXCJzdHJva2Utd2lkdGhcIiwgLypvdXRlckJvcmRlcldpZHRoKi8gY3R4WzddKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFjdXJyZW50IHx8IGRpcnR5WzBdICYgLyp2aWV3Ym94X3dpZHRoKi8gODM4ODYwOCkge1xuXHRcdFx0XHRhdHRyKHN2ZywgXCJ3aWR0aFwiLCAvKnZpZXdib3hfd2lkdGgqLyBjdHhbMjNdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFjdXJyZW50IHx8IGRpcnR5WzBdICYgLyp2aWV3Ym94X2hlaWdodCovIDE2Nzc3MjE2KSB7XG5cdFx0XHRcdGF0dHIoc3ZnLCBcImhlaWdodFwiLCAvKnZpZXdib3hfaGVpZ2h0Ki8gY3R4WzI0XSk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRpKGxvY2FsKSB7XG5cdFx0XHRpZiAoY3VycmVudCkgcmV0dXJuO1xuXHRcdFx0dHJhbnNpdGlvbl9pbihxdWVzdGlvbnMuJCQuZnJhZ21lbnQsIGxvY2FsKTtcblx0XHRcdGN1cnJlbnQgPSB0cnVlO1xuXHRcdH0sXG5cdFx0byhsb2NhbCkge1xuXHRcdFx0dHJhbnNpdGlvbl9vdXQocXVlc3Rpb25zLiQkLmZyYWdtZW50LCBsb2NhbCk7XG5cdFx0XHRjdXJyZW50ID0gZmFsc2U7XG5cdFx0fSxcblx0XHRkKGRldGFjaGluZykge1xuXHRcdFx0aWYgKGRldGFjaGluZykgZGV0YWNoKG1haW4pO1xuXHRcdFx0LyppbnB1dF9iaW5kaW5nKi8gY3R4WzQzXShudWxsKTtcblx0XHRcdGRlc3Ryb3lfZWFjaChlYWNoX2Jsb2NrcywgZGV0YWNoaW5nKTtcblx0XHRcdC8qZGl2X2JpbmRpbmcqLyBjdHhbNDZdKG51bGwpO1xuXHRcdFx0ZGVzdHJveV9jb21wb25lbnQocXVlc3Rpb25zKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdHJ1bl9hbGwoZGlzcG9zZSk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBpbnN0YW5jZSQ0KCQkc2VsZiwgJCRwcm9wcywgJCRpbnZhbGlkYXRlKSB7XG5cdGxldCAkY3VycmVudERpcmVjdGlvbjtcblx0bGV0ICRxdWVzdGlvbnNEb3duO1xuXHRsZXQgJHF1ZXN0aW9uc0Fjcm9zcztcblx0Y29tcG9uZW50X3N1YnNjcmliZSgkJHNlbGYsIGN1cnJlbnREaXJlY3Rpb24sICQkdmFsdWUgPT4gJCRpbnZhbGlkYXRlKDQ4LCAkY3VycmVudERpcmVjdGlvbiA9ICQkdmFsdWUpKTtcblx0Y29tcG9uZW50X3N1YnNjcmliZSgkJHNlbGYsIHF1ZXN0aW9uc0Rvd24sICQkdmFsdWUgPT4gJCRpbnZhbGlkYXRlKDQ5LCAkcXVlc3Rpb25zRG93biA9ICQkdmFsdWUpKTtcblx0Y29tcG9uZW50X3N1YnNjcmliZSgkJHNlbGYsIHF1ZXN0aW9uc0Fjcm9zcywgJCR2YWx1ZSA9PiAkJGludmFsaWRhdGUoNTAsICRxdWVzdGlvbnNBY3Jvc3MgPSAkJHZhbHVlKSk7XG5cdGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCk7XG5cblx0Ly8gUHJpdmF0ZSBwcm9wZXJ0aWVzXG5cdGxldCBudW1iZXJfZ3JpZCA9IFtdO1xuXG5cdGxldCBtYXJrZWRfd29yZF9ncmlkID0gW107XG5cdGxldCBmb250U2l6ZTtcblx0bGV0IG51bUZvbnRTaXplO1xuXHRsZXQgY2VsbFdpZHRoO1xuXHRsZXQgY2VsbEhlaWdodDtcblx0bGV0IHZpZXdib3hfd2lkdGg7XG5cdGxldCB2aWV3Ym94X2hlaWdodDtcblx0bGV0IHsgQ29udGFpbmVyIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBJbnB1dCB9ID0gJCRwcm9wcztcblx0bGV0IHsgZ3JpZCA9IFtdIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBzaXplID0gMTAgfSA9ICQkcHJvcHM7XG5cdGxldCB7IGN1cnJlbnRfeCA9IDAgfSA9ICQkcHJvcHM7XG5cdGxldCB7IGN1cnJlbnRfeSA9IDAgfSA9ICQkcHJvcHM7XG5cdGxldCB7IHRvdGFsV2lkdGggPSA1MDAgfSA9ICQkcHJvcHM7XG5cdGxldCB7IHRvdGFsSGVpZ2h0ID0gNTAwIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBvdXRlckJvcmRlcldpZHRoID0gMS41IH0gPSAkJHByb3BzO1xuXHRsZXQgeyBpbm5lckJvcmRlcldpZHRoID0gMSB9ID0gJCRwcm9wcztcblx0bGV0IHsgbWFyZ2luID0gMyB9ID0gJCRwcm9wcztcblx0bGV0IHsgb3V0ZXJCb3JkZXJDb2xvdXIgPSBcImJsYWNrXCIgfSA9ICQkcHJvcHM7XG5cdGxldCB7IGlubmVyQm9yZGVyQ29sb3VyID0gXCJibGFja1wiIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBmaWxsQ29sb3VyID0gXCJibGFja1wiIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBiYWNrZ3JvdW5kQ29sb3VyID0gXCJ3aGl0ZVwiIH0gPSAkJHByb3BzO1xuXHRjb25zdCBmb250UmF0aW8gPSAwLjc7XG5cdGNvbnN0IG51bVJhdGlvID0gMC4zMztcblxuXHRmdW5jdGlvbiBzZWxlY3RDZWxsKGUpIHtcblx0XHQkJGludmFsaWRhdGUoMSwgY3VycmVudF94ID0gZS5zcmNFbGVtZW50LmdldEF0dHJpYnV0ZShcImRhdGEtY29sXCIpKTtcblx0XHQkJGludmFsaWRhdGUoMiwgY3VycmVudF95ID0gZS5zcmNFbGVtZW50LmdldEF0dHJpYnV0ZShcImRhdGEtcm93XCIpKTtcblx0XHRkcmF3TWFya2VkV29yZEdyaWQoKTtcblx0XHRkaXNwYXRjaChcImNoYW5nZVwiKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlzU3RhcnRPZkFjcm9zcyh4LCB5KSB7XG5cdFx0aWYgKGdyaWRbeV1beF0gPT09IFwiI1wiKSByZXR1cm4gZmFsc2U7XG5cdFx0aWYgKHggPj0gc2l6ZSkgcmV0dXJuIGZhbHNlO1xuXHRcdGxldCB3b3JkID0gZ2V0V29yZCh4LCB5LCBcImFjcm9zc1wiKTtcblx0XHRpZiAod29yZC5sZW5ndGggPD0gMSkgcmV0dXJuIGZhbHNlO1xuXHRcdHJldHVybiB4ID09PSAwIHx8IGdyaWRbeV1beCAtIDFdID09IFwiI1wiO1xuXHR9XG5cblx0ZnVuY3Rpb24gaXNTdGFydE9mRG93bih4LCB5KSB7XG5cdFx0aWYgKGdyaWRbeV1beF0gPT09IFwiI1wiKSByZXR1cm4gZmFsc2U7XG5cdFx0aWYgKHkgPj0gc2l6ZSkgcmV0dXJuIGZhbHNlO1xuXHRcdGxldCB3b3JkID0gZ2V0V29yZCh4LCB5LCBcImRvd25cIik7XG5cdFx0aWYgKHdvcmQubGVuZ3RoIDw9IDEpIHJldHVybiBmYWxzZTtcblx0XHRyZXR1cm4geSA9PT0gMCB8fCBncmlkW3kgLSAxXVt4XSA9PSBcIiNcIjtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldFF1ZXN0aW9uKG51bSwgeCwgeSwgZGlyZWN0aW9uLCBxdWVzdGlvbikge1xuXHRcdGNvbnN0IGFuc3dlciA9IGdldFdvcmQoeCwgeSwgZGlyZWN0aW9uKTtcblxuXHRcdGlmIChkaXJlY3Rpb24gPT09IFwiYWNyb3NzXCIpIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgJHF1ZXN0aW9uc0Fjcm9zcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAoJHF1ZXN0aW9uc0Fjcm9zc1tpXS5hbnN3ZXIgPT09IGFuc3dlciAmJiAkcXVlc3Rpb25zQWNyb3NzW2ldLmRpcmVjdGlvbiA9PT0gZGlyZWN0aW9uKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdC4uLiRxdWVzdGlvbnNBY3Jvc3NbaV0sXG5cdFx0XHRcdFx0XHRhbnN3ZXIsXG5cdFx0XHRcdFx0XHRudW0sXG5cdFx0XHRcdFx0XHR4LFxuXHRcdFx0XHRcdFx0eVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoJHF1ZXN0aW9uc0Fjcm9zc1tpXS5udW0gPT09IG51bSAmJiAkcXVlc3Rpb25zQWNyb3NzW2ldLmRpcmVjdGlvbiA9PT0gZGlyZWN0aW9uKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHsgLi4uJHF1ZXN0aW9uc0Fjcm9zc1tpXSwgYW5zd2VyLCB4LCB5IH07XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0bnVtLFxuXHRcdFx0XHR4LFxuXHRcdFx0XHR5LFxuXHRcdFx0XHRxdWVzdGlvbixcblx0XHRcdFx0YW5zd2VyLFxuXHRcdFx0XHRlZGl0aW5nOiBmYWxzZSxcblx0XHRcdFx0ZGlyZWN0aW9uXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8ICRxdWVzdGlvbnNEb3duLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmICgkcXVlc3Rpb25zRG93bltpXS5hbnN3ZXIgPT09IGFuc3dlciAmJiAkcXVlc3Rpb25zRG93bltpXS5kaXJlY3Rpb24gPT09IGRpcmVjdGlvbikge1xuXHRcdFx0XHRcdHJldHVybiB7IC4uLiRxdWVzdGlvbnNEb3duW2ldLCBhbnN3ZXIsIG51bSwgeCwgeSB9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCRxdWVzdGlvbnNEb3duW2ldLm51bSA9PT0gbnVtICYmICRxdWVzdGlvbnNEb3duW2ldLmRpcmVjdGlvbiA9PT0gZGlyZWN0aW9uKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHNldF9zdG9yZV92YWx1ZShxdWVzdGlvbnNEb3duLCAkcXVlc3Rpb25zRG93bltpXSA9IHsgLi4uJHF1ZXN0aW9uc0Rvd25baV0sIGFuc3dlciwgeCwgeSB9LCAkcXVlc3Rpb25zRG93bik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHNldF9zdG9yZV92YWx1ZShcblx0XHRcdFx0cXVlc3Rpb25zRG93bixcblx0XHRcdFx0JHF1ZXN0aW9uc0Rvd24gPSB7XG5cdFx0XHRcdFx0bnVtLFxuXHRcdFx0XHRcdHgsXG5cdFx0XHRcdFx0eSxcblx0XHRcdFx0XHRxdWVzdGlvbixcblx0XHRcdFx0XHRhbnN3ZXIsXG5cdFx0XHRcdFx0ZWRpdGluZzogZmFsc2UsXG5cdFx0XHRcdFx0ZGlyZWN0aW9uXG5cdFx0XHRcdH0sXG5cdFx0XHRcdCRxdWVzdGlvbnNEb3duXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGdldEN1cnJlbnRRdWVzdGlvbigpIHtcblx0XHRsZXQgeyB4LCB5IH0gPSBnZXRDdXJyZW50UG9zKCk7XG5cdFx0bGV0IHNlbGVjdGVkX3F1ZXN0aW9uO1xuXG5cdFx0bGV0IHF1ZXN0aW9ucyA9ICRjdXJyZW50RGlyZWN0aW9uID09PSBcImFjcm9zc1wiXG5cdFx0PyAkcXVlc3Rpb25zQWNyb3NzXG5cdFx0OiAkcXVlc3Rpb25zRG93bjtcblxuXHRcdGlmICghcXVlc3Rpb25zLmxlbmd0aCkgcmV0dXJuO1xuXG5cdFx0aWYgKCRjdXJyZW50RGlyZWN0aW9uID09PSBcImFjcm9zc1wiKSB7XG5cdFx0XHRzZWxlY3RlZF9xdWVzdGlvbiA9IHF1ZXN0aW9ucy5maW5kKHEgPT4geSA9PT0gcS55ICYmIHggPj0gcS54ICYmIHggPD0gcS54ICsgcS5hbnN3ZXIubGVuZ3RoIC0gMSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHNlbGVjdGVkX3F1ZXN0aW9uID0gcXVlc3Rpb25zLmZpbmQocSA9PiB4ID09PSBxLnggJiYgeSA+PSBxLnkgJiYgeSA8PSBxLnkgKyBxLmFuc3dlci5sZW5ndGggLSAxKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gc2VsZWN0ZWRfcXVlc3Rpb247XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRTdGFydE9mV29yZCh4LCB5LCBkaXJlY3Rpb24pIHtcblx0XHRpZiAoZGlyZWN0aW9uID09PSBcImFjcm9zc1wiKSB7XG5cdFx0XHR3aGlsZSAoeCA+IDAgJiYgZ3JpZFt5XVt4IC0gMV0gIT09IFwiI1wiKSB7XG5cdFx0XHRcdHgtLTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0d2hpbGUgKHkgPiAwICYmIGdyaWRbeSAtIDFdW3hdICE9PSBcIiNcIikge1xuXHRcdFx0XHR5LS07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHsgeCwgeSB9O1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0RW5kT2ZXb3JkKHgsIHksIGRpcmVjdGlvbikge1xuXHRcdGlmIChkaXJlY3Rpb24gPT09IFwiYWNyb3NzXCIpIHtcblx0XHRcdHdoaWxlICh4IDwgc2l6ZSAtIDEgJiYgZ3JpZFt5XVt4ICsgMV0gIT09IFwiI1wiKSB7XG5cdFx0XHRcdHgrKztcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0d2hpbGUgKHkgPCBzaXplIC0gMSAmJiBncmlkW3kgKyAxXVt4XSAhPT0gXCIjXCIpIHtcblx0XHRcdFx0eSsrO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB7IHgsIHkgfTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldFdvcmQoeCwgeSwgZGlyZWN0aW9uKSB7XG5cdFx0bGV0IHN0YXJ0ID0gZ2V0U3RhcnRPZldvcmQoeCwgeSwgZGlyZWN0aW9uKTtcblx0XHRsZXQgZW5kID0gZ2V0RW5kT2ZXb3JkKHgsIHksIGRpcmVjdGlvbik7XG5cdFx0bGV0IHdvcmQgPSBcIlwiO1xuXG5cdFx0aWYgKGRpcmVjdGlvbiA9PT0gXCJhY3Jvc3NcIikge1xuXHRcdFx0Zm9yIChsZXQgaSA9IHN0YXJ0Lng7IGkgPD0gZW5kLng7IGkrKykge1xuXHRcdFx0XHR3b3JkICs9IGdyaWRbeV1baV0gfHwgXCIgXCI7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAobGV0IGkgPSBzdGFydC55OyBpIDw9IGVuZC55OyBpKyspIHtcblx0XHRcdFx0d29yZCArPSBncmlkW2ldW3hdIHx8IFwiIFwiO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB3b3JkO1xuXHR9XG5cblx0ZnVuY3Rpb24gZHJhd01hcmtlZFdvcmRHcmlkKCkge1xuXHRcdCQkaW52YWxpZGF0ZSgxOSwgbWFya2VkX3dvcmRfZ3JpZCA9IEFycmF5KHNpemUpLmZpbGwoZmFsc2UpLm1hcCgoKSA9PiBBcnJheShzaXplKS5maWxsKGZhbHNlKSkpO1xuXG5cdFx0aWYgKCRjdXJyZW50RGlyZWN0aW9uID09PSBcImFjcm9zc1wiKSB7XG5cdFx0XHRmb3IgKGxldCB4ID0gY3VycmVudF94OyB4IDwgc2l6ZTsgeCsrKSB7XG5cdFx0XHRcdGlmICghZ3JpZFtjdXJyZW50X3ldKSBicmVhaztcblxuXHRcdFx0XHRpZiAoZ3JpZFtjdXJyZW50X3ldW3hdID09PSBcIiNcIikge1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0JCRpbnZhbGlkYXRlKDE5LCBtYXJrZWRfd29yZF9ncmlkW2N1cnJlbnRfeV1beF0gPSB0cnVlLCBtYXJrZWRfd29yZF9ncmlkKTtcblx0XHRcdH1cblxuXHRcdFx0Zm9yIChsZXQgeCA9IGN1cnJlbnRfeDsgeCA+PSAwOyB4LS0pIHtcblx0XHRcdFx0aWYgKCFncmlkW2N1cnJlbnRfeV0pIGJyZWFrO1xuXG5cdFx0XHRcdGlmIChncmlkW2N1cnJlbnRfeV1beF0gPT09IFwiI1wiKSB7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQkJGludmFsaWRhdGUoMTksIG1hcmtlZF93b3JkX2dyaWRbY3VycmVudF95XVt4XSA9IHRydWUsIG1hcmtlZF93b3JkX2dyaWQpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBkb3duXG5cdFx0XHRmb3IgKGxldCB5ID0gY3VycmVudF95OyB5IDwgc2l6ZTsgeSsrKSB7XG5cdFx0XHRcdGlmICghZ3JpZFt5XSkgYnJlYWs7XG5cblx0XHRcdFx0aWYgKGdyaWRbeV1bY3VycmVudF94XSA9PT0gXCIjXCIpIHtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgxOSwgbWFya2VkX3dvcmRfZ3JpZFt5XVtjdXJyZW50X3hdID0gdHJ1ZSwgbWFya2VkX3dvcmRfZ3JpZCk7XG5cdFx0XHR9XG5cblx0XHRcdGZvciAobGV0IHkgPSBjdXJyZW50X3k7IHkgPj0gMDsgeS0tKSB7XG5cdFx0XHRcdGlmICghZ3JpZFt5XSkgYnJlYWs7XG5cblx0XHRcdFx0aWYgKGdyaWRbeV1bY3VycmVudF94XSA9PT0gXCIjXCIpIHtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgxOSwgbWFya2VkX3dvcmRfZ3JpZFt5XVtjdXJyZW50X3hdID0gdHJ1ZSwgbWFya2VkX3dvcmRfZ3JpZCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gbW92ZVVwKCkge1xuXHRcdGlmIChjdXJyZW50X3kgPiAwKSB7XG5cdFx0XHQkJGludmFsaWRhdGUoMiwgY3VycmVudF95LS0sIGN1cnJlbnRfeSk7XG5cdFx0XHRkaXNwYXRjaChcImNoYW5nZVwiKTtcblx0XHRcdGRyYXdNYXJrZWRXb3JkR3JpZCgpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIG1vdmVEb3duKCkge1xuXHRcdGlmIChjdXJyZW50X3kgPCBzaXplIC0gMSkge1xuXHRcdFx0JCRpbnZhbGlkYXRlKDIsIGN1cnJlbnRfeSsrLCBjdXJyZW50X3kpO1xuXHRcdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdFx0XHRkcmF3TWFya2VkV29yZEdyaWQoKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBtb3ZlTGVmdCgpIHtcblx0XHRpZiAoY3VycmVudF94ID4gMCkge1xuXHRcdFx0JCRpbnZhbGlkYXRlKDEsIGN1cnJlbnRfeC0tLCBjdXJyZW50X3gpO1xuXHRcdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdFx0XHRkcmF3TWFya2VkV29yZEdyaWQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKGN1cnJlbnRfeSA+IDApIHtcblx0XHRcdFx0JCRpbnZhbGlkYXRlKDIsIGN1cnJlbnRfeS0tLCBjdXJyZW50X3kpO1xuXHRcdFx0XHQkJGludmFsaWRhdGUoMSwgY3VycmVudF94ID0gc2l6ZSAtIDEpO1xuXHRcdFx0XHRkaXNwYXRjaChcImNoYW5nZVwiKTtcblx0XHRcdFx0ZHJhd01hcmtlZFdvcmRHcmlkKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gbW92ZVJpZ2h0KCkge1xuXHRcdGlmIChjdXJyZW50X3ggPCBzaXplIC0gMSkge1xuXHRcdFx0JCRpbnZhbGlkYXRlKDEsIGN1cnJlbnRfeCsrLCBjdXJyZW50X3gpO1xuXHRcdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdFx0XHRkcmF3TWFya2VkV29yZEdyaWQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKGN1cnJlbnRfeSA8IHNpemUgLSAxKSB7XG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgyLCBjdXJyZW50X3krKywgY3VycmVudF95KTtcblx0XHRcdFx0JCRpbnZhbGlkYXRlKDEsIGN1cnJlbnRfeCA9IDApO1xuXHRcdFx0XHRkaXNwYXRjaChcImNoYW5nZVwiKTtcblx0XHRcdFx0ZHJhd01hcmtlZFdvcmRHcmlkKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gbW92ZVN0YXJ0T2ZSb3coKSB7XG5cdFx0JCRpbnZhbGlkYXRlKDEsIGN1cnJlbnRfeCA9IDApO1xuXHRcdGRpc3BhdGNoKFwiY2hhbmdlXCIpO1xuXHRcdGRyYXdNYXJrZWRXb3JkR3JpZCgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gbW92ZUVuZE9mUm93KCkge1xuXHRcdCQkaW52YWxpZGF0ZSgxLCBjdXJyZW50X3ggPSBzaXplIC0gMSk7XG5cdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdFx0ZHJhd01hcmtlZFdvcmRHcmlkKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBtb3ZlU3RhcnRPZkNvbCgpIHtcblx0XHQkJGludmFsaWRhdGUoMiwgY3VycmVudF95ID0gMCk7XG5cdFx0ZGlzcGF0Y2goXCJjaGFuZ2VcIik7XG5cdFx0ZHJhd01hcmtlZFdvcmRHcmlkKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBtb3ZlRW5kT2ZDb2woKSB7XG5cdFx0JCRpbnZhbGlkYXRlKDIsIGN1cnJlbnRfeSA9IHNpemUgLSAxKTtcblx0XHRkaXNwYXRjaChcImNoYW5nZVwiKTtcblx0XHRkcmF3TWFya2VkV29yZEdyaWQoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZU1vdmUoZGlyKSB7XG5cdFx0aWYgKGRpciA9PT0gXCJ1cFwiKSB7XG5cdFx0XHRtb3ZlVXAoKTtcblx0XHR9XG5cblx0XHRpZiAoZGlyID09PSBcImRvd25cIikge1xuXHRcdFx0bW92ZURvd24oKTtcblx0XHR9XG5cblx0XHRpZiAoZGlyID09PSBcImxlZnRcIikge1xuXHRcdFx0bW92ZUxlZnQoKTtcblx0XHR9XG5cblx0XHRpZiAoZGlyID09PSBcInJpZ2h0XCIpIHtcblx0XHRcdG1vdmVSaWdodCgpO1xuXHRcdH1cblxuXHRcdGlmIChkaXIgPT09IFwiYmFja3NhcGNlXCIpIHtcblx0XHRcdGJhY2tzcGFjZSgpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHRvZ2dsZURpcigpIHtcblx0XHRpZiAoJGN1cnJlbnREaXJlY3Rpb24gPT09IFwiYWNyb3NzXCIpIHtcblx0XHRcdGN1cnJlbnREaXJlY3Rpb24uc2V0KFwiZG93blwiKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y3VycmVudERpcmVjdGlvbi5zZXQoXCJhY3Jvc3NcIik7XG5cdFx0fVxuXG5cdFx0Ly8gRmluZCB0aGUgY3VycmVudCBxdWVzdGlvblxuXHRcdGNvbnN0IGN1cnJlbnRfcXVlc3Rpb24gPSBnZXRDdXJyZW50UXVlc3Rpb24oKTtcblxuXHRcdC8vIGNvbnNvbGUubG9nKGN1cnJlbnRfcXVlc3Rpb24pO1xuXHRcdGN1cnJlbnRRdWVzdGlvbi5zZXQoY3VycmVudF9xdWVzdGlvbik7XG5cblx0XHRkaXNwYXRjaChcImNoYW5nZVwiKTtcblx0XHRkcmF3TWFya2VkV29yZEdyaWQoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHNldERpcihkaXJlY3Rpb24pIHtcblx0XHRpZiAoZGlyZWN0aW9uID09PSBcImFjcm9zc1wiKSB7XG5cdFx0XHRjdXJyZW50RGlyZWN0aW9uLnNldChcImFjcm9zc1wiKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y3VycmVudERpcmVjdGlvbi5zZXQoXCJkb3duXCIpO1xuXHRcdH1cblxuXHRcdGRpc3BhdGNoKFwiY2hhbmdlXCIpO1xuXHRcdGRyYXdNYXJrZWRXb3JkR3JpZCgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0Q3VycmVudFBvcygpIHtcblx0XHRyZXR1cm4geyB4OiBjdXJyZW50X3gsIHk6IGN1cnJlbnRfeSB9O1xuXHR9XG5cblx0ZnVuY3Rpb24gc2V0Q3VycmVudFBvcyh4LCB5KSB7XG5cdFx0JCRpbnZhbGlkYXRlKDEsIGN1cnJlbnRfeCA9IHgpO1xuXHRcdCQkaW52YWxpZGF0ZSgyLCBjdXJyZW50X3kgPSB5KTtcblx0XHRkaXNwYXRjaChcImNoYW5nZVwiKTtcblx0XHRkcmF3TWFya2VkV29yZEdyaWQoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZURvdWJsZWNsaWNrKHgsIHkpIHtcblx0XHR0b2dnbGVEaXIoKTtcblx0fSAvLyBsZXQgc2VsZWN0ZWRfcXVlc3Rpb247XG5cdC8vIGxldCBxdWVzdGlvbnMgPSAkY3VycmVudERpcmVjdGlvbiA9PT0gXCJhY3Jvc3NcIiA/ICRxdWVzdGlvbnNBY3Jvc3MgOiAkcXVlc3Rpb25zRG93bjtcblxuXHRmdW5jdGlvbiBoYW5kbGVLZXlkb3duKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0Y29uc3Qga2V5Y29kZSA9IGUua2V5Q29kZTtcblx0XHRpZiAoZS5tZXRhS2V5KSByZXR1cm47XG5cblx0XHRpZiAoa2V5Y29kZSA+IDY0ICYmIGtleWNvZGUgPCA5MSkge1xuXHRcdFx0ZGlzcGF0Y2goXCJsZXR0ZXJcIiwgZS5rZXkudG9VcHBlckNhc2UoKSk7XG5cdFx0fSBlbHNlIGlmIChrZXljb2RlID09PSA1MSkge1xuXHRcdFx0Ly8gI1xuXHRcdFx0ZGlzcGF0Y2goXCJsZXR0ZXJcIiwgXCIjXCIpO1xuXHRcdH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gOCkge1xuXHRcdFx0Ly8gQmFja3NwYWNlXG5cdFx0XHRkaXNwYXRjaChcImJhY2tzcGFjZVwiKTtcblx0XHR9IGVsc2UgaWYgKGtleWNvZGUgPT0gMzIpIHtcblx0XHRcdC8vIFNwYWNlXG5cdFx0XHRkaXNwYXRjaChcImxldHRlclwiLCBcIiBcIik7XG5cdFx0fSBlbHNlIGlmIChrZXljb2RlID09PSA5KSB7XG5cdFx0XHQvLyBFbnRlclxuXHRcdFx0aWYgKGUuc2hpZnRLZXkpIHtcblx0XHRcdFx0ZGlzcGF0Y2goXCJtb3ZlXCIsIFwicHJldi13b3JkXCIpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGlzcGF0Y2goXCJtb3ZlXCIsIFwibmV4dC13b3JkXCIpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gMTMpIHtcblx0XHRcdC8vIEVudGVyXG5cdFx0XHRkaXNwYXRjaChcImVudGVyXCIpO1xuXHRcdH0gZWxzZSBpZiAoa2V5Y29kZSA9PT0gMzcpIHtcblx0XHRcdGRpc3BhdGNoKFwibW92ZVwiLCBcImxlZnRcIik7XG5cdFx0fSBlbHNlIGlmIChrZXljb2RlID09PSAzOCkge1xuXHRcdFx0ZGlzcGF0Y2goXCJtb3ZlXCIsIFwidXBcIik7XG5cdFx0fSBlbHNlIGlmIChrZXljb2RlID09PSAzOSkge1xuXHRcdFx0ZGlzcGF0Y2goXCJtb3ZlXCIsIFwicmlnaHRcIik7XG5cdFx0fSBlbHNlIGlmIChrZXljb2RlID09PSA0MCkge1xuXHRcdFx0ZGlzcGF0Y2goXCJtb3ZlXCIsIFwiZG93blwiKTtcblx0XHR9XG5cblx0XHRoYW5kbGVGb2N1cygpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlRm9jdXMoZSkge1xuXHRcdElucHV0LmZvY3VzKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVVcGRhdGVRdWVzdGlvbihlKSB7XG5cdFx0Y29uc3QgeyBxdWVzdGlvbiwgc3VnZ2VzdGlvbiB9ID0gZS5kZXRhaWw7XG5cdFx0Y29uc29sZS5sb2cocXVlc3Rpb24sIHN1Z2dlc3Rpb24pO1xuXG5cdFx0aWYgKHF1ZXN0aW9uLmRpcmVjdGlvbiA9PT0gXCJhY3Jvc3NcIikge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzdWdnZXN0aW9uLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgwLCBncmlkW3F1ZXN0aW9uLnldW2kgKyBxdWVzdGlvbi54XSA9IHN1Z2dlc3Rpb25baV0sIGdyaWQpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHN1Z2dlc3Rpb24ubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0JCRpbnZhbGlkYXRlKDAsIGdyaWRbaSArIHF1ZXN0aW9uLnldW3F1ZXN0aW9uLnhdID0gc3VnZ2VzdGlvbltpXSwgZ3JpZCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gaW5wdXRfYmluZGluZygkJHZhbHVlKSB7XG5cdFx0YmluZGluZ19jYWxsYmFja3NbJCR2YWx1ZSA/ICd1bnNoaWZ0JyA6ICdwdXNoJ10oKCkgPT4ge1xuXHRcdFx0SW5wdXQgPSAkJHZhbHVlO1xuXHRcdFx0JCRpbnZhbGlkYXRlKDQsIElucHV0KTtcblx0XHR9KTtcblx0fVxuXG5cdGNvbnN0IGNsaWNrX2hhbmRsZXIgPSAoeCwgeSkgPT4ge1xuXHRcdHNldEN1cnJlbnRQb3MoeCwgeSk7XG5cdH07XG5cblx0Y29uc3QgZGJsY2xpY2tfaGFuZGxlciA9ICh4LCB5KSA9PiB7XG5cdFx0aGFuZGxlRG91YmxlY2xpY2soKTtcblx0fTtcblxuXHRmdW5jdGlvbiBkaXZfYmluZGluZygkJHZhbHVlKSB7XG5cdFx0YmluZGluZ19jYWxsYmFja3NbJCR2YWx1ZSA/ICd1bnNoaWZ0JyA6ICdwdXNoJ10oKCkgPT4ge1xuXHRcdFx0Q29udGFpbmVyID0gJCR2YWx1ZTtcblx0XHRcdCQkaW52YWxpZGF0ZSgzLCBDb250YWluZXIpO1xuXHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2hhbmdlX2hhbmRsZXIoZXZlbnQpIHtcblx0XHRidWJibGUuY2FsbCh0aGlzLCAkJHNlbGYsIGV2ZW50KTtcblx0fVxuXG5cdCQkc2VsZi4kJHNldCA9ICQkcHJvcHMgPT4ge1xuXHRcdGlmICgnQ29udGFpbmVyJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoMywgQ29udGFpbmVyID0gJCRwcm9wcy5Db250YWluZXIpO1xuXHRcdGlmICgnSW5wdXQnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSg0LCBJbnB1dCA9ICQkcHJvcHMuSW5wdXQpO1xuXHRcdGlmICgnZ3JpZCcgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDAsIGdyaWQgPSAkJHByb3BzLmdyaWQpO1xuXHRcdGlmICgnc2l6ZScgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDI4LCBzaXplID0gJCRwcm9wcy5zaXplKTtcblx0XHRpZiAoJ2N1cnJlbnRfeCcgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDEsIGN1cnJlbnRfeCA9ICQkcHJvcHMuY3VycmVudF94KTtcblx0XHRpZiAoJ2N1cnJlbnRfeScgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDIsIGN1cnJlbnRfeSA9ICQkcHJvcHMuY3VycmVudF95KTtcblx0XHRpZiAoJ3RvdGFsV2lkdGgnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSg1LCB0b3RhbFdpZHRoID0gJCRwcm9wcy50b3RhbFdpZHRoKTtcblx0XHRpZiAoJ3RvdGFsSGVpZ2h0JyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoNiwgdG90YWxIZWlnaHQgPSAkJHByb3BzLnRvdGFsSGVpZ2h0KTtcblx0XHRpZiAoJ291dGVyQm9yZGVyV2lkdGgnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSg3LCBvdXRlckJvcmRlcldpZHRoID0gJCRwcm9wcy5vdXRlckJvcmRlcldpZHRoKTtcblx0XHRpZiAoJ2lubmVyQm9yZGVyV2lkdGgnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSg4LCBpbm5lckJvcmRlcldpZHRoID0gJCRwcm9wcy5pbm5lckJvcmRlcldpZHRoKTtcblx0XHRpZiAoJ21hcmdpbicgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDksIG1hcmdpbiA9ICQkcHJvcHMubWFyZ2luKTtcblx0XHRpZiAoJ291dGVyQm9yZGVyQ29sb3VyJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoMTAsIG91dGVyQm9yZGVyQ29sb3VyID0gJCRwcm9wcy5vdXRlckJvcmRlckNvbG91cik7XG5cdFx0aWYgKCdpbm5lckJvcmRlckNvbG91cicgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDExLCBpbm5lckJvcmRlckNvbG91ciA9ICQkcHJvcHMuaW5uZXJCb3JkZXJDb2xvdXIpO1xuXHRcdGlmICgnZmlsbENvbG91cicgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDEyLCBmaWxsQ29sb3VyID0gJCRwcm9wcy5maWxsQ29sb3VyKTtcblx0XHRpZiAoJ2JhY2tncm91bmRDb2xvdXInIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSgxMywgYmFja2dyb3VuZENvbG91ciA9ICQkcHJvcHMuYmFja2dyb3VuZENvbG91cik7XG5cdH07XG5cblx0JCRzZWxmLiQkLnVwZGF0ZSA9ICgpID0+IHtcblx0XHRpZiAoJCRzZWxmLiQkLmRpcnR5WzBdICYgLypzaXplLCB0b3RhbFdpZHRoLCBtYXJnaW4sIG91dGVyQm9yZGVyV2lkdGgsIHRvdGFsSGVpZ2h0LCBjZWxsV2lkdGgsIGdyaWQsIG51bWJlcl9ncmlkLCBjdXJyZW50X3gsIGN1cnJlbnRfeSovIDI2ODgyOTQxNSkge1xuXHRcdFx0e1xuXHRcdFx0XHRpZiAoc2l6ZSA8IDIpIHtcblx0XHRcdFx0XHQkJGludmFsaWRhdGUoMjgsIHNpemUgPSAyKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChzaXplID4gMzApIHtcblx0XHRcdFx0XHQkJGludmFsaWRhdGUoMjgsIHNpemUgPSAzMCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQkJGludmFsaWRhdGUoMjMsIHZpZXdib3hfd2lkdGggPSB0b3RhbFdpZHRoICsgbWFyZ2luICsgb3V0ZXJCb3JkZXJXaWR0aCk7XG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgyNCwgdmlld2JveF9oZWlnaHQgPSB0b3RhbEhlaWdodCArIG1hcmdpbiArIG91dGVyQm9yZGVyV2lkdGgpO1xuXHRcdFx0XHQkJGludmFsaWRhdGUoMTgsIGNlbGxXaWR0aCA9IHRvdGFsV2lkdGggLyBzaXplKTtcblx0XHRcdFx0JCRpbnZhbGlkYXRlKDIyLCBjZWxsSGVpZ2h0ID0gdG90YWxIZWlnaHQgLyBzaXplKTtcblx0XHRcdFx0JCRpbnZhbGlkYXRlKDIwLCBmb250U2l6ZSA9IGNlbGxXaWR0aCAqIGZvbnRSYXRpbyk7XG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgyMSwgbnVtRm9udFNpemUgPSBjZWxsV2lkdGggKiBudW1SYXRpbyk7XG5cdFx0XHRcdGxldCBxdWVzdGlvbnNfYWNyb3NzID0gW107XG5cdFx0XHRcdGxldCBxdWVzdGlvbnNfZG93biA9IFtdO1xuXHRcdFx0XHRsZXQgbnVtID0gMTtcblxuXHRcdFx0XHQvLyBHcm93IGdyaWQgaWYgbmVjZXNzYXJ5XG5cdFx0XHRcdGlmIChncmlkLmxlbmd0aCAtIDEgPCBzaXplKSB7XG5cdFx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcblx0XHRcdFx0XHRcdCQkaW52YWxpZGF0ZSgwLCBncmlkW2ldID0gZ3JpZFtpXSB8fCBBcnJheShzaXplKS5tYXAoKCkgPT4gXCIgXCIpLCBncmlkKTtcblx0XHRcdFx0XHRcdCQkaW52YWxpZGF0ZSgxNywgbnVtYmVyX2dyaWRbaV0gPSBudW1iZXJfZ3JpZFtpXSB8fCBBcnJheShzaXplKS5tYXAoKCkgPT4gXCIgXCIpLCBudW1iZXJfZ3JpZCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gU2hyaW5rIGdyaWQgaWYgbmVjZXNzYXJ5XG5cdFx0XHRcdHdoaWxlIChncmlkLmxlbmd0aCA+IHNpemUpIHtcblx0XHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGdyaWQubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdHdoaWxlIChncmlkW2ldLmxlbmd0aCA+IHNpemUpIHtcblx0XHRcdFx0XHRcdFx0Z3JpZFtpXS5wb3AoKTtcblx0XHRcdFx0XHRcdFx0bnVtYmVyX2dyaWRbaV0ucG9wKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Z3JpZC5wb3AoKTtcblx0XHRcdFx0XHRudW1iZXJfZ3JpZC5wb3AoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIE1ha2Ugc3VyZSB3ZSdyZSBzdGlsbCBpbiB0aGUgZ3JpZFxuXHRcdFx0XHRpZiAoY3VycmVudF94ID49IHNpemUpIHtcblx0XHRcdFx0XHQkJGludmFsaWRhdGUoMSwgY3VycmVudF94ID0gc2l6ZSAtIDEpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGN1cnJlbnRfeSA+PSBzaXplKSB7XG5cdFx0XHRcdFx0JCRpbnZhbGlkYXRlKDIsIGN1cnJlbnRfeSA9IHNpemUgLSAxKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvciAobGV0IHkgPSAwOyB5IDwgc2l6ZTsgeSsrKSB7XG5cdFx0XHRcdFx0aWYgKCFudW1iZXJfZ3JpZFt5XSkge1xuXHRcdFx0XHRcdFx0JCRpbnZhbGlkYXRlKDE3LCBudW1iZXJfZ3JpZFt5XSA9IEFycmF5KHNpemUpLCBudW1iZXJfZ3JpZCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Zm9yIChsZXQgeCA9IDA7IHggPCBzaXplOyB4KyspIHtcblx0XHRcdFx0XHRcdCQkaW52YWxpZGF0ZSgwLCBncmlkW3ldW3hdID0gZ3JpZFt5XVt4XSB8fCBcIiBcIiwgZ3JpZCk7XG5cdFx0XHRcdFx0XHRpZiAoZ3JpZFt5XVt4XSA9PT0gXCIjXCIpIGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0bGV0IGZvdW5kID0gZmFsc2U7XG5cblx0XHRcdFx0XHRcdGlmIChpc1N0YXJ0T2ZBY3Jvc3MoeCwgeSkpIHtcblx0XHRcdFx0XHRcdFx0cXVlc3Rpb25zX2Fjcm9zcy5wdXNoKGdldFF1ZXN0aW9uKG51bSwgeCwgeSwgXCJhY3Jvc3NcIiwgXCJcIikpO1xuXHRcdFx0XHRcdFx0XHRmb3VuZCA9IHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChpc1N0YXJ0T2ZEb3duKHgsIHkpKSB7XG5cdFx0XHRcdFx0XHRcdHF1ZXN0aW9uc19kb3duLnB1c2goZ2V0UXVlc3Rpb24obnVtLCB4LCB5LCBcImRvd25cIiwgXCJcIikpO1xuXHRcdFx0XHRcdFx0XHRmb3VuZCA9IHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmICghZm91bmQpIHtcblx0XHRcdFx0XHRcdFx0JCRpbnZhbGlkYXRlKDE3LCBudW1iZXJfZ3JpZFt5XVt4XSA9IG51bGwsIG51bWJlcl9ncmlkKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdCQkaW52YWxpZGF0ZSgxNywgbnVtYmVyX2dyaWRbeV1beF0gPSBudW0rKywgbnVtYmVyX2dyaWQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIHF1ZXN0aW9uc19hY3Jvc3Muc29ydCgpO1xuXHRcdFx0XHQvLyBxdWVzdGlvbnNfZG93bi5zb3J0KCk7XG5cdFx0XHRcdHF1ZXN0aW9uc0Fjcm9zcy5zZXQocXVlc3Rpb25zX2Fjcm9zcyk7XG5cblx0XHRcdFx0cXVlc3Rpb25zRG93bi5zZXQocXVlc3Rpb25zX2Rvd24pO1xuXG5cdFx0XHRcdC8vIEZpbmQgdGhlIGN1cnJlbnQgcXVlc3Rpb25cblx0XHRcdFx0Y29uc3QgY3VycmVudF9xdWVzdGlvbiA9IGdldEN1cnJlbnRRdWVzdGlvbigpO1xuXG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKGN1cnJlbnRfcXVlc3Rpb24pO1xuXHRcdFx0XHRjdXJyZW50UXVlc3Rpb24uc2V0KGN1cnJlbnRfcXVlc3Rpb24pO1xuXG5cdFx0XHRcdGRyYXdNYXJrZWRXb3JkR3JpZCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gW1xuXHRcdGdyaWQsXG5cdFx0Y3VycmVudF94LFxuXHRcdGN1cnJlbnRfeSxcblx0XHRDb250YWluZXIsXG5cdFx0SW5wdXQsXG5cdFx0dG90YWxXaWR0aCxcblx0XHR0b3RhbEhlaWdodCxcblx0XHRvdXRlckJvcmRlcldpZHRoLFxuXHRcdGlubmVyQm9yZGVyV2lkdGgsXG5cdFx0bWFyZ2luLFxuXHRcdG91dGVyQm9yZGVyQ29sb3VyLFxuXHRcdGlubmVyQm9yZGVyQ29sb3VyLFxuXHRcdGZpbGxDb2xvdXIsXG5cdFx0YmFja2dyb3VuZENvbG91cixcblx0XHRoYW5kbGVNb3ZlLFxuXHRcdHNldEN1cnJlbnRQb3MsXG5cdFx0aGFuZGxlS2V5ZG93bixcblx0XHRudW1iZXJfZ3JpZCxcblx0XHRjZWxsV2lkdGgsXG5cdFx0bWFya2VkX3dvcmRfZ3JpZCxcblx0XHRmb250U2l6ZSxcblx0XHRudW1Gb250U2l6ZSxcblx0XHRjZWxsSGVpZ2h0LFxuXHRcdHZpZXdib3hfd2lkdGgsXG5cdFx0dmlld2JveF9oZWlnaHQsXG5cdFx0aGFuZGxlRG91YmxlY2xpY2ssXG5cdFx0aGFuZGxlRm9jdXMsXG5cdFx0aGFuZGxlVXBkYXRlUXVlc3Rpb24sXG5cdFx0c2l6ZSxcblx0XHRmb250UmF0aW8sXG5cdFx0bnVtUmF0aW8sXG5cdFx0c2VsZWN0Q2VsbCxcblx0XHRtb3ZlVXAsXG5cdFx0bW92ZURvd24sXG5cdFx0bW92ZUxlZnQsXG5cdFx0bW92ZVJpZ2h0LFxuXHRcdG1vdmVTdGFydE9mUm93LFxuXHRcdG1vdmVFbmRPZlJvdyxcblx0XHRtb3ZlU3RhcnRPZkNvbCxcblx0XHRtb3ZlRW5kT2ZDb2wsXG5cdFx0dG9nZ2xlRGlyLFxuXHRcdHNldERpcixcblx0XHRnZXRDdXJyZW50UG9zLFxuXHRcdGlucHV0X2JpbmRpbmcsXG5cdFx0Y2xpY2tfaGFuZGxlcixcblx0XHRkYmxjbGlja19oYW5kbGVyLFxuXHRcdGRpdl9iaW5kaW5nLFxuXHRcdGNoYW5nZV9oYW5kbGVyXG5cdF07XG59XG5cbmNsYXNzIEdyaWQgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuXHRjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG5cdFx0c3VwZXIoKTtcblxuXHRcdGluaXQoXG5cdFx0XHR0aGlzLFxuXHRcdFx0b3B0aW9ucyxcblx0XHRcdGluc3RhbmNlJDQsXG5cdFx0XHRjcmVhdGVfZnJhZ21lbnQkNCxcblx0XHRcdHNhZmVfbm90X2VxdWFsLFxuXHRcdFx0e1xuXHRcdFx0XHRDb250YWluZXI6IDMsXG5cdFx0XHRcdElucHV0OiA0LFxuXHRcdFx0XHRncmlkOiAwLFxuXHRcdFx0XHRzaXplOiAyOCxcblx0XHRcdFx0Y3VycmVudF94OiAxLFxuXHRcdFx0XHRjdXJyZW50X3k6IDIsXG5cdFx0XHRcdHRvdGFsV2lkdGg6IDUsXG5cdFx0XHRcdHRvdGFsSGVpZ2h0OiA2LFxuXHRcdFx0XHRvdXRlckJvcmRlcldpZHRoOiA3LFxuXHRcdFx0XHRpbm5lckJvcmRlcldpZHRoOiA4LFxuXHRcdFx0XHRtYXJnaW46IDksXG5cdFx0XHRcdG91dGVyQm9yZGVyQ29sb3VyOiAxMCxcblx0XHRcdFx0aW5uZXJCb3JkZXJDb2xvdXI6IDExLFxuXHRcdFx0XHRmaWxsQ29sb3VyOiAxMixcblx0XHRcdFx0YmFja2dyb3VuZENvbG91cjogMTMsXG5cdFx0XHRcdGZvbnRSYXRpbzogMjksXG5cdFx0XHRcdG51bVJhdGlvOiAzMCxcblx0XHRcdFx0c2VsZWN0Q2VsbDogMzEsXG5cdFx0XHRcdG1vdmVVcDogMzIsXG5cdFx0XHRcdG1vdmVEb3duOiAzMyxcblx0XHRcdFx0bW92ZUxlZnQ6IDM0LFxuXHRcdFx0XHRtb3ZlUmlnaHQ6IDM1LFxuXHRcdFx0XHRtb3ZlU3RhcnRPZlJvdzogMzYsXG5cdFx0XHRcdG1vdmVFbmRPZlJvdzogMzcsXG5cdFx0XHRcdG1vdmVTdGFydE9mQ29sOiAzOCxcblx0XHRcdFx0bW92ZUVuZE9mQ29sOiAzOSxcblx0XHRcdFx0aGFuZGxlTW92ZTogMTQsXG5cdFx0XHRcdHRvZ2dsZURpcjogNDAsXG5cdFx0XHRcdHNldERpcjogNDEsXG5cdFx0XHRcdGdldEN1cnJlbnRQb3M6IDQyLFxuXHRcdFx0XHRzZXRDdXJyZW50UG9zOiAxNSxcblx0XHRcdFx0aGFuZGxlS2V5ZG93bjogMTZcblx0XHRcdH0sXG5cdFx0XHRudWxsLFxuXHRcdFx0Wy0xLCAtMSwgLTFdXG5cdFx0KTtcblx0fVxuXG5cdGdldCBmb250UmF0aW8oKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzI5XTtcblx0fVxuXG5cdGdldCBudW1SYXRpbygpIHtcblx0XHRyZXR1cm4gdGhpcy4kJC5jdHhbMzBdO1xuXHR9XG5cblx0Z2V0IHNlbGVjdENlbGwoKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzMxXTtcblx0fVxuXG5cdGdldCBtb3ZlVXAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzMyXTtcblx0fVxuXG5cdGdldCBtb3ZlRG93bigpIHtcblx0XHRyZXR1cm4gdGhpcy4kJC5jdHhbMzNdO1xuXHR9XG5cblx0Z2V0IG1vdmVMZWZ0KCkge1xuXHRcdHJldHVybiB0aGlzLiQkLmN0eFszNF07XG5cdH1cblxuXHRnZXQgbW92ZVJpZ2h0KCkge1xuXHRcdHJldHVybiB0aGlzLiQkLmN0eFszNV07XG5cdH1cblxuXHRnZXQgbW92ZVN0YXJ0T2ZSb3coKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzM2XTtcblx0fVxuXG5cdGdldCBtb3ZlRW5kT2ZSb3coKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzM3XTtcblx0fVxuXG5cdGdldCBtb3ZlU3RhcnRPZkNvbCgpIHtcblx0XHRyZXR1cm4gdGhpcy4kJC5jdHhbMzhdO1xuXHR9XG5cblx0Z2V0IG1vdmVFbmRPZkNvbCgpIHtcblx0XHRyZXR1cm4gdGhpcy4kJC5jdHhbMzldO1xuXHR9XG5cblx0Z2V0IGhhbmRsZU1vdmUoKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzE0XTtcblx0fVxuXG5cdGdldCB0b2dnbGVEaXIoKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzQwXTtcblx0fVxuXG5cdGdldCBzZXREaXIoKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzQxXTtcblx0fVxuXG5cdGdldCBnZXRDdXJyZW50UG9zKCkge1xuXHRcdHJldHVybiB0aGlzLiQkLmN0eFs0Ml07XG5cdH1cblxuXHRnZXQgc2V0Q3VycmVudFBvcygpIHtcblx0XHRyZXR1cm4gdGhpcy4kJC5jdHhbMTVdO1xuXHR9XG5cblx0Z2V0IGhhbmRsZUtleWRvd24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzE2XTtcblx0fVxufVxuXG4vKiBzcmMvSW5zdHJ1Y3Rpb25zLnN2ZWx0ZSBnZW5lcmF0ZWQgYnkgU3ZlbHRlIHYzLjQ2LjQgKi9cblxuZnVuY3Rpb24gY3JlYXRlX2ZyYWdtZW50JDMoY3R4KSB7XG5cdGxldCBtYWluO1xuXHRsZXQgZGl2O1xuXHRsZXQgdDE7XG5cdGxldCBoMjtcblx0bGV0IHQzO1xuXHRsZXQgcDA7XG5cdGxldCB0NTtcblx0bGV0IHAxO1xuXHRsZXQgdDc7XG5cdGxldCBwMjtcblx0bGV0IHQ5O1xuXHRsZXQgcDM7XG5cdGxldCB0MTE7XG5cdGxldCBwNDtcblx0bGV0IHQxMztcblx0bGV0IHA1O1xuXHRsZXQgbW91bnRlZDtcblx0bGV0IGRpc3Bvc2U7XG5cblx0cmV0dXJuIHtcblx0XHRjKCkge1xuXHRcdFx0bWFpbiA9IGVsZW1lbnQoXCJtYWluXCIpO1xuXHRcdFx0ZGl2ID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdGRpdi50ZXh0Q29udGVudCA9IFwiw5dcIjtcblx0XHRcdHQxID0gc3BhY2UoKTtcblx0XHRcdGgyID0gZWxlbWVudChcImgyXCIpO1xuXHRcdFx0aDIudGV4dENvbnRlbnQgPSBcIkluc3RydWN0aW9uc1wiO1xuXHRcdFx0dDMgPSBzcGFjZSgpO1xuXHRcdFx0cDAgPSBlbGVtZW50KFwicFwiKTtcblx0XHRcdHAwLnRleHRDb250ZW50ID0gXCJVc2UgXFxcIiNcXFwiIHRvIGNyZWF0ZSBhIGJsYW5rIHNxdWFyZS5cIjtcblx0XHRcdHQ1ID0gc3BhY2UoKTtcblx0XHRcdHAxID0gZWxlbWVudChcInBcIik7XG5cdFx0XHRwMS50ZXh0Q29udGVudCA9IFwiSGl0IEVudGVyIG9yIGRvdWJsZS1jbGljayB0aGUgcXVlc3Rpb24gb24gdGhlIHJpZ2h0IHRvIHNldCBhbiBhbnN3ZXIuXCI7XG5cdFx0XHR0NyA9IHNwYWNlKCk7XG5cdFx0XHRwMiA9IGVsZW1lbnQoXCJwXCIpO1xuXHRcdFx0cDIudGV4dENvbnRlbnQgPSBcIlVzZSBTcGFjZSB0byBjaGFuZ2UgZGlyZWN0aW9ucy5cIjtcblx0XHRcdHQ5ID0gc3BhY2UoKTtcblx0XHRcdHAzID0gZWxlbWVudChcInBcIik7XG5cdFx0XHRwMy50ZXh0Q29udGVudCA9IFwiVXNlIGFycm93IGtleXMgdG8gbmF2aWdhdGUuXCI7XG5cdFx0XHR0MTEgPSBzcGFjZSgpO1xuXHRcdFx0cDQgPSBlbGVtZW50KFwicFwiKTtcblx0XHRcdHA0LnRleHRDb250ZW50ID0gXCJIaW50OiBDb21wbGV0ZSB0aGUgd29yZHMgYmVmb3JlIHN0YXJ0aW5nIG9uIHRoZSBhbnN3ZXJzLCBiZWNhdXNlIHlvdSBtaWdodCBoYXZlIHRvIGNoYW5nZSBzb21ldGhpbmchXCI7XG5cdFx0XHR0MTMgPSBzcGFjZSgpO1xuXHRcdFx0cDUgPSBlbGVtZW50KFwicFwiKTtcblx0XHRcdHA1LmlubmVySFRNTCA9IGBOb3RlOiBUaGlzIENyb3Nzd29yZCBDcmVhdG9yIGlzIGluIEFscGhhLiA8YSBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL2otbm9yd29vZC15b3VuZy9qeHdvcmQtY3JlYXRvci9pc3N1ZXNcIj5QbGVhc2UgcmVwb3J0IGJ1Z3MgaGVyZTwvYT4uYDtcblx0XHRcdGF0dHIoZGl2LCBcImNsYXNzXCIsIFwiY2xvc2Ugc3ZlbHRlLW40azVwMVwiKTtcblx0XHRcdGF0dHIobWFpbiwgXCJjbGFzc1wiLCBcInN2ZWx0ZS1uNGs1cDFcIik7XG5cdFx0XHR0b2dnbGVfY2xhc3MobWFpbiwgXCJ2aXNpYmxlXCIsIC8qdmlzaWJsZSovIGN0eFswXSk7XG5cdFx0fSxcblx0XHRtKHRhcmdldCwgYW5jaG9yKSB7XG5cdFx0XHRpbnNlcnQodGFyZ2V0LCBtYWluLCBhbmNob3IpO1xuXHRcdFx0YXBwZW5kKG1haW4sIGRpdik7XG5cdFx0XHRhcHBlbmQobWFpbiwgdDEpO1xuXHRcdFx0YXBwZW5kKG1haW4sIGgyKTtcblx0XHRcdGFwcGVuZChtYWluLCB0Myk7XG5cdFx0XHRhcHBlbmQobWFpbiwgcDApO1xuXHRcdFx0YXBwZW5kKG1haW4sIHQ1KTtcblx0XHRcdGFwcGVuZChtYWluLCBwMSk7XG5cdFx0XHRhcHBlbmQobWFpbiwgdDcpO1xuXHRcdFx0YXBwZW5kKG1haW4sIHAyKTtcblx0XHRcdGFwcGVuZChtYWluLCB0OSk7XG5cdFx0XHRhcHBlbmQobWFpbiwgcDMpO1xuXHRcdFx0YXBwZW5kKG1haW4sIHQxMSk7XG5cdFx0XHRhcHBlbmQobWFpbiwgcDQpO1xuXHRcdFx0YXBwZW5kKG1haW4sIHQxMyk7XG5cdFx0XHRhcHBlbmQobWFpbiwgcDUpO1xuXG5cdFx0XHRpZiAoIW1vdW50ZWQpIHtcblx0XHRcdFx0ZGlzcG9zZSA9IGxpc3RlbihkaXYsIFwiY2xpY2tcIiwgLypoaWRlSW5zdHJ1Y3Rpb25zKi8gY3R4WzFdKTtcblx0XHRcdFx0bW91bnRlZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRwKGN0eCwgW2RpcnR5XSkge1xuXHRcdFx0aWYgKGRpcnR5ICYgLyp2aXNpYmxlKi8gMSkge1xuXHRcdFx0XHR0b2dnbGVfY2xhc3MobWFpbiwgXCJ2aXNpYmxlXCIsIC8qdmlzaWJsZSovIGN0eFswXSk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRpOiBub29wLFxuXHRcdG86IG5vb3AsXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaChtYWluKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdGRpc3Bvc2UoKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGluc3RhbmNlJDMoJCRzZWxmLCAkJHByb3BzLCAkJGludmFsaWRhdGUpIHtcblx0bGV0IHsgdmlzaWJsZSA9IGZhbHNlIH0gPSAkJHByb3BzO1xuXG5cdGZ1bmN0aW9uIGhpZGVJbnN0cnVjdGlvbnMoKSB7XG5cdFx0JCRpbnZhbGlkYXRlKDAsIHZpc2libGUgPSBmYWxzZSk7XG5cdH1cblxuXHQkJHNlbGYuJCRzZXQgPSAkJHByb3BzID0+IHtcblx0XHRpZiAoJ3Zpc2libGUnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSgwLCB2aXNpYmxlID0gJCRwcm9wcy52aXNpYmxlKTtcblx0fTtcblxuXHRyZXR1cm4gW3Zpc2libGUsIGhpZGVJbnN0cnVjdGlvbnNdO1xufVxuXG5jbGFzcyBJbnN0cnVjdGlvbnMgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuXHRjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG5cdFx0c3VwZXIoKTtcblx0XHRpbml0KHRoaXMsIG9wdGlvbnMsIGluc3RhbmNlJDMsIGNyZWF0ZV9mcmFnbWVudCQzLCBzYWZlX25vdF9lcXVhbCwgeyB2aXNpYmxlOiAwIH0pO1xuXHR9XG59XG5cbi8qIHNyYy9TaXplU2xpZGVyLnN2ZWx0ZSBnZW5lcmF0ZWQgYnkgU3ZlbHRlIHYzLjQ2LjQgKi9cblxuZnVuY3Rpb24gY3JlYXRlX2ZyYWdtZW50JDIoY3R4KSB7XG5cdGxldCBtYWluO1xuXHRsZXQgaW5wdXQ7XG5cdGxldCB0MDtcblx0bGV0IGxhYmVsO1xuXHRsZXQgdDFfdmFsdWUgPSBgJHsvKmZpbmRTaXplKi8gY3R4WzFdKC8qc2l6ZSovIGN0eFswXSkubmFtZX0gJHsvKnNpemUqLyBjdHhbMF19eCR7LypzaXplKi8gY3R4WzBdfWAgKyBcIlwiO1xuXHRsZXQgdDE7XG5cdGxldCBtb3VudGVkO1xuXHRsZXQgZGlzcG9zZTtcblxuXHRyZXR1cm4ge1xuXHRcdGMoKSB7XG5cdFx0XHRtYWluID0gZWxlbWVudChcIm1haW5cIik7XG5cdFx0XHRpbnB1dCA9IGVsZW1lbnQoXCJpbnB1dFwiKTtcblx0XHRcdHQwID0gc3BhY2UoKTtcblx0XHRcdGxhYmVsID0gZWxlbWVudChcImxhYmVsXCIpO1xuXHRcdFx0dDEgPSB0ZXh0KHQxX3ZhbHVlKTtcblx0XHRcdGF0dHIoaW5wdXQsIFwibmFtZVwiLCBcInNpemVcIik7XG5cdFx0XHRhdHRyKGlucHV0LCBcInR5cGVcIiwgXCJyYW5nZVwiKTtcblx0XHRcdGF0dHIoaW5wdXQsIFwibWluXCIsIFwiMlwiKTtcblx0XHRcdGF0dHIoaW5wdXQsIFwibWF4XCIsIFwiMzBcIik7XG5cdFx0XHRhdHRyKGlucHV0LCBcImNsYXNzXCIsIFwic3ZlbHRlLTFuZ296YWJcIik7XG5cdFx0XHRhdHRyKGxhYmVsLCBcImZvclwiLCBcInNpemVcIik7XG5cdFx0XHRhdHRyKG1haW4sIFwiY2xhc3NcIiwgXCJzdmVsdGUtMW5nb3phYlwiKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGluc2VydCh0YXJnZXQsIG1haW4sIGFuY2hvcik7XG5cdFx0XHRhcHBlbmQobWFpbiwgaW5wdXQpO1xuXHRcdFx0c2V0X2lucHV0X3ZhbHVlKGlucHV0LCAvKnNpemUqLyBjdHhbMF0pO1xuXHRcdFx0YXBwZW5kKG1haW4sIHQwKTtcblx0XHRcdGFwcGVuZChtYWluLCBsYWJlbCk7XG5cdFx0XHRhcHBlbmQobGFiZWwsIHQxKTtcblxuXHRcdFx0aWYgKCFtb3VudGVkKSB7XG5cdFx0XHRcdGRpc3Bvc2UgPSBbXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0LCBcImNoYW5nZVwiLCAvKmlucHV0X2NoYW5nZV9pbnB1dF9oYW5kbGVyKi8gY3R4WzNdKSxcblx0XHRcdFx0XHRsaXN0ZW4oaW5wdXQsIFwiaW5wdXRcIiwgLyppbnB1dF9jaGFuZ2VfaW5wdXRfaGFuZGxlciovIGN0eFszXSksXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0LCBcImNoYW5nZVwiLCAvKmhhbmRsZVN0YXRlQ2hhbmdlKi8gY3R4WzJdKVxuXHRcdFx0XHRdO1xuXG5cdFx0XHRcdG1vdW50ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cChjdHgsIFtkaXJ0eV0pIHtcblx0XHRcdGlmIChkaXJ0eSAmIC8qc2l6ZSovIDEpIHtcblx0XHRcdFx0c2V0X2lucHV0X3ZhbHVlKGlucHV0LCAvKnNpemUqLyBjdHhbMF0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHkgJiAvKnNpemUqLyAxICYmIHQxX3ZhbHVlICE9PSAodDFfdmFsdWUgPSBgJHsvKmZpbmRTaXplKi8gY3R4WzFdKC8qc2l6ZSovIGN0eFswXSkubmFtZX0gJHsvKnNpemUqLyBjdHhbMF19eCR7LypzaXplKi8gY3R4WzBdfWAgKyBcIlwiKSkgc2V0X2RhdGEodDEsIHQxX3ZhbHVlKTtcblx0XHR9LFxuXHRcdGk6IG5vb3AsXG5cdFx0bzogbm9vcCxcblx0XHRkKGRldGFjaGluZykge1xuXHRcdFx0aWYgKGRldGFjaGluZykgZGV0YWNoKG1haW4pO1xuXHRcdFx0bW91bnRlZCA9IGZhbHNlO1xuXHRcdFx0cnVuX2FsbChkaXNwb3NlKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGluc3RhbmNlJDIoJCRzZWxmLCAkJHByb3BzLCAkJGludmFsaWRhdGUpIHtcblx0Y29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKTtcblxuXHQvLyBTaXplc1xuXHRjb25zdCBzaXplcyA9IFtcblx0XHR7IG5hbWU6IFwiTWluaVwiLCBzaXplOiA1LCBtaW46IDIsIG1heDogNSB9LFxuXHRcdHsgbmFtZTogXCJTbWFsbFwiLCBzaXplOiA3LCBtaW46IDYsIG1heDogMTAgfSxcblx0XHR7XG5cdFx0XHRuYW1lOiBcIldlZWtkYXlcIixcblx0XHRcdHNpemU6IDE1LFxuXHRcdFx0bWluOiAxMSxcblx0XHRcdG1heDogMjBcblx0XHR9LFxuXHRcdHtcblx0XHRcdG5hbWU6IFwiTGFyZ2VcIixcblx0XHRcdHNpemU6IDIzLFxuXHRcdFx0bWluOiAyMSxcblx0XHRcdG1heDogMjZcblx0XHR9LFxuXHRcdHtcblx0XHRcdG5hbWU6IFwiWExhcmdlXCIsXG5cdFx0XHRzaXplOiAyNyxcblx0XHRcdG1pbjogMjcsXG5cdFx0XHRtYXg6IDMwXG5cdFx0fVxuXHRdO1xuXG5cdGxldCB7IHNpemUgfSA9ICQkcHJvcHM7XG5cdGZpbmRTaXplKHNpemUpO1xuXG5cdGZ1bmN0aW9uIGZpbmRTaXplKHNpemUpIHtcblx0XHRyZXR1cm4gc2l6ZXMuZmluZChzID0+IHNpemUgPj0gcy5taW4gJiYgc2l6ZSA8PSBzLm1heCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVTdGF0ZUNoYW5nZSgpIHtcblx0XHRmaW5kU2l6ZShzaXplKTtcblx0XHRkaXNwYXRjaChcImNoYW5nZVwiKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlucHV0X2NoYW5nZV9pbnB1dF9oYW5kbGVyKCkge1xuXHRcdHNpemUgPSB0b19udW1iZXIodGhpcy52YWx1ZSk7XG5cdFx0JCRpbnZhbGlkYXRlKDAsIHNpemUpO1xuXHR9XG5cblx0JCRzZWxmLiQkc2V0ID0gJCRwcm9wcyA9PiB7XG5cdFx0aWYgKCdzaXplJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoMCwgc2l6ZSA9ICQkcHJvcHMuc2l6ZSk7XG5cdH07XG5cblx0cmV0dXJuIFtzaXplLCBmaW5kU2l6ZSwgaGFuZGxlU3RhdGVDaGFuZ2UsIGlucHV0X2NoYW5nZV9pbnB1dF9oYW5kbGVyXTtcbn1cblxuY2xhc3MgU2l6ZVNsaWRlciBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudCB7XG5cdGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcblx0XHRzdXBlcigpO1xuXHRcdGluaXQodGhpcywgb3B0aW9ucywgaW5zdGFuY2UkMiwgY3JlYXRlX2ZyYWdtZW50JDIsIHNhZmVfbm90X2VxdWFsLCB7IHNpemU6IDAgfSk7XG5cdH1cbn1cblxuLyogc3JjL1ByaW50LnN2ZWx0ZSBnZW5lcmF0ZWQgYnkgU3ZlbHRlIHYzLjQ2LjQgKi9cblxuZnVuY3Rpb24gY3JlYXRlX2ZyYWdtZW50JDEoY3R4KSB7XG5cdGxldCBtYWluO1xuXHRsZXQgYnV0dG9uMDtcblx0bGV0IHQxO1xuXHRsZXQgYnV0dG9uMTtcblx0bGV0IG1vdW50ZWQ7XG5cdGxldCBkaXNwb3NlO1xuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdG1haW4gPSBlbGVtZW50KFwibWFpblwiKTtcblx0XHRcdGJ1dHRvbjAgPSBlbGVtZW50KFwiYnV0dG9uXCIpO1xuXHRcdFx0YnV0dG9uMC50ZXh0Q29udGVudCA9IFwiUHJpbnQgKEZpbGxlZClcIjtcblx0XHRcdHQxID0gc3BhY2UoKTtcblx0XHRcdGJ1dHRvbjEgPSBlbGVtZW50KFwiYnV0dG9uXCIpO1xuXHRcdFx0YnV0dG9uMS50ZXh0Q29udGVudCA9IFwiUHJpbnQgKEJsYW5rKVwiO1xuXHRcdFx0YXR0cihidXR0b24wLCBcImNsYXNzXCIsIFwianh3b3JkLWJ1dHRvblwiKTtcblx0XHRcdGF0dHIoYnV0dG9uMSwgXCJjbGFzc1wiLCBcImp4d29yZC1idXR0b25cIik7XG5cdFx0fSxcblx0XHRtKHRhcmdldCwgYW5jaG9yKSB7XG5cdFx0XHRpbnNlcnQodGFyZ2V0LCBtYWluLCBhbmNob3IpO1xuXHRcdFx0YXBwZW5kKG1haW4sIGJ1dHRvbjApO1xuXHRcdFx0YXBwZW5kKG1haW4sIHQxKTtcblx0XHRcdGFwcGVuZChtYWluLCBidXR0b24xKTtcblxuXHRcdFx0aWYgKCFtb3VudGVkKSB7XG5cdFx0XHRcdGRpc3Bvc2UgPSBbXG5cdFx0XHRcdFx0bGlzdGVuKGJ1dHRvbjAsIFwiY2xpY2tcIiwgLypwcmludEZpbGxlZCovIGN0eFsxXSksXG5cdFx0XHRcdFx0bGlzdGVuKGJ1dHRvbjEsIFwiY2xpY2tcIiwgLypwcmludEJsYW5rKi8gY3R4WzBdKVxuXHRcdFx0XHRdO1xuXG5cdFx0XHRcdG1vdW50ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cDogbm9vcCxcblx0XHRpOiBub29wLFxuXHRcdG86IG5vb3AsXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaChtYWluKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdHJ1bl9hbGwoZGlzcG9zZSk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBpbnN0YW5jZSQxKCQkc2VsZiwgJCRwcm9wcywgJCRpbnZhbGlkYXRlKSB7XG5cdGxldCAkcXVlc3Rpb25zQWNyb3NzO1xuXHRsZXQgJHF1ZXN0aW9uc0Rvd247XG5cdGNvbXBvbmVudF9zdWJzY3JpYmUoJCRzZWxmLCBxdWVzdGlvbnNBY3Jvc3MsICQkdmFsdWUgPT4gJCRpbnZhbGlkYXRlKDMsICRxdWVzdGlvbnNBY3Jvc3MgPSAkJHZhbHVlKSk7XG5cdGNvbXBvbmVudF9zdWJzY3JpYmUoJCRzZWxmLCBxdWVzdGlvbnNEb3duLCAkJHZhbHVlID0+ICQkaW52YWxpZGF0ZSg0LCAkcXVlc3Rpb25zRG93biA9ICQkdmFsdWUpKTtcblx0bGV0IHsgc3RhdGUgfSA9ICQkcHJvcHM7XG5cblx0ZnVuY3Rpb24gcHJpbnRCbGFuaygpIHtcblx0XHRjb25zdCBzdmcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuanh3b3JkLXN2Z2ApLmNsb25lTm9kZSh0cnVlKTtcblxuXHRcdGNvbnN0IHJlbW92ZV9lbHMgPSBbXG5cdFx0XHQuLi5zdmcucXVlcnlTZWxlY3RvckFsbChgLmp4d29yZC1uby1wcmludC1ibGFua2ApLFxuXHRcdFx0Li4uc3ZnLnF1ZXJ5U2VsZWN0b3JBbGwoYC5qeHdvcmQtbm8tcHJpbnRgKVxuXHRcdF07XG5cblx0XHRmb3IgKGxldCByZW1vdmVfZWwgb2YgcmVtb3ZlX2Vscykge1xuXHRcdFx0cmVtb3ZlX2VsLnJlbW92ZSgpO1xuXHRcdH1cblxuXHRcdHByaW50KHN2Zyk7XG5cdH1cblxuXHRmdW5jdGlvbiBwcmludEZpbGxlZCgpIHtcblx0XHRjb25zdCBzdmcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuanh3b3JkLXN2Z2ApLmNsb25lTm9kZSh0cnVlKTtcblx0XHRjb25zdCByZW1vdmVfZWxzID0gWy4uLnN2Zy5xdWVyeVNlbGVjdG9yQWxsKGAuanh3b3JkLW5vLXByaW50YCldO1xuXG5cdFx0Zm9yIChsZXQgcmVtb3ZlX2VsIG9mIHJlbW92ZV9lbHMpIHtcblx0XHRcdHJlbW92ZV9lbC5yZW1vdmUoKTtcblx0XHR9XG5cblx0XHRwcmludChzdmcpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZm9ybWF0UXVlc3Rpb25zKGRpcmVjdGlvbikge1xuXHRcdGxldCBxdWVzdGlvbnM7XG5cblx0XHRpZiAoZGlyZWN0aW9uID09PSBcImRvd25cIikge1xuXHRcdFx0cXVlc3Rpb25zID0gJHF1ZXN0aW9uc0Rvd247XG5cdFx0fSBlbHNlIHtcblx0XHRcdHF1ZXN0aW9ucyA9ICRxdWVzdGlvbnNBY3Jvc3M7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHF1ZXN0aW9ucy5tYXAocXVlc3Rpb24gPT4gYDxsaT4ke3F1ZXN0aW9uLm51bX06ICR7cXVlc3Rpb24ucXVlc3Rpb259PC9saT5gKS5qb2luKFwiXCIpO1xuXHR9XG5cblx0ZnVuY3Rpb24gcHJpbnQoc3ZnKSB7XG5cdFx0Ly8gY29uc29sZS5sb2coc3ZnKTtcblx0XHRjb25zdCBzdmdfdGV4dCA9IHN2Zy5vdXRlckhUTUwucmVwbGFjZSgvZmlsbD1cIiNmN2Y0NTdcIi9nLCBgZmlsbD1cIiNmZmZmZmZcImApLnJlcGxhY2UoL2ZpbGw9XCIjOWNlMGZiXCIvZywgYGZpbGw9XCIjZmZmZmZmXCJgKTtcblxuXHRcdGNvbnN0IHF1ZXN0aW9uc19hY3Jvc3MgPSBgPGg0PkFjcm9zczwvaDQ+PG9sIGNsYXNzPVwianh3b3JkLXF1ZXN0aW9ucy1saXN0XCI+JHtmb3JtYXRRdWVzdGlvbnMoXCJhY3Jvc3NcIil9PC9vbD5gO1xuXHRcdGNvbnN0IHF1ZXN0aW9uc19kb3duID0gYDxoND5Eb3duPC9oND48b2wgY2xhc3M9XCJqeHdvcmQtcXVlc3Rpb25zLWxpc3RcIj4ke2Zvcm1hdFF1ZXN0aW9ucyhcImRvd25cIil9PC9vbD5gO1xuXHRcdGxldCBwcmludFdpbmRvdyA9IHdpbmRvdy5vcGVuKCk7XG5cdFx0cHJpbnRXaW5kb3cuZG9jdW1lbnQud3JpdGUoYDxodG1sPjxoZWFkPjx0aXRsZT4ke3N0YXRlLnRpdGxlfTwvdGl0bGU+YCk7XG5cblx0XHRwcmludFdpbmRvdy5kb2N1bWVudC53cml0ZShgPHN0eWxlPi5zdmctY29udGFpbmVyIHtcbiAgaGVpZ2h0OiAzNWVtO1xuICBkaXNwbGF5OiBibG9jaztcbn1cblxuLmp4d29yZC1zdmcge1xuICBoZWlnaHQ6IDEwMCU7XG4gIHdpZHRoOiAxMDAlO1xufVxuXG4uanh3b3JkLXF1ZXN0aW9ucy1saXN0IHtcbiAgbGlzdC1zdHlsZTogbm9uZTtcbiAgbGluZS1oZWlnaHQ6IDEuNTtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBwYWRkaW5nLWxlZnQ6IDBweDtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgbWFyZ2luLXJpZ2h0OiAyMHB4O1xufVxuXG4uanh3b3JkLXF1ZXN0aW9ucy1saXN0LWl0ZW0tbnVtIHtcbiAgbWFyZ2luLXJpZ2h0OiA1cHg7XG4gIHRleHQtYWxpZ246IHJpZ2h0O1xuICB3aWR0aDogMjVweDtcbiAgbWluLXdpZHRoOiAyNXB4O1xuICBmb250LXdlaWdodDogYm9sZDtcbn1cblxuLnF1ZXN0aW9ucyB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gIGZsZXgtd3JhcDogd3JhcDtcbn08L3N0eWxlPmApO1xuXG5cdFx0cHJpbnRXaW5kb3cuZG9jdW1lbnQud3JpdGUoYDxkaXYgY2xhc3M9XCJzdmctY29udGFpbmVyXCI+JHtzdmdfdGV4dH08L2Rpdj5gKTtcblx0XHRwcmludFdpbmRvdy5kb2N1bWVudC53cml0ZShgPGRpdiBjbGFzcz1cInF1ZXN0aW9uc1wiPlxcbmApO1xuXHRcdHByaW50V2luZG93LmRvY3VtZW50LndyaXRlKGA8ZGl2PiR7cXVlc3Rpb25zX2Fjcm9zc308L2Rpdj5gKTtcblx0XHRwcmludFdpbmRvdy5kb2N1bWVudC53cml0ZShgPGRpdj4ke3F1ZXN0aW9uc19kb3dufTwvZGl2PmApO1xuXHRcdHByaW50V2luZG93LmRvY3VtZW50LndyaXRlKGA8L2Rpdj5gKTtcblx0XHRwcmludFdpbmRvdy5kb2N1bWVudC5jbG9zZSgpO1xuXHRcdHByaW50V2luZG93LmZvY3VzKCk7XG5cdFx0cHJpbnRXaW5kb3cucHJpbnQoKTtcblx0XHRwcmludFdpbmRvdy5jbG9zZSgpO1xuXHR9XG5cblx0JCRzZWxmLiQkc2V0ID0gJCRwcm9wcyA9PiB7XG5cdFx0aWYgKCdzdGF0ZScgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDIsIHN0YXRlID0gJCRwcm9wcy5zdGF0ZSk7XG5cdH07XG5cblx0cmV0dXJuIFtwcmludEJsYW5rLCBwcmludEZpbGxlZCwgc3RhdGVdO1xufVxuXG5jbGFzcyBQcmludCBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudCB7XG5cdGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcblx0XHRzdXBlcigpO1xuXHRcdGluaXQodGhpcywgb3B0aW9ucywgaW5zdGFuY2UkMSwgY3JlYXRlX2ZyYWdtZW50JDEsIHNhZmVfbm90X2VxdWFsLCB7IHN0YXRlOiAyIH0pO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHNhdmVTdGF0ZShzdGF0ZSkge1xuICAgIGxldCBzdGF0ZVN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHN0YXRlKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnanh3b3JkLWNyZWF0b3InLCBzdGF0ZVN0cmluZyk7XG59XG5cbmZ1bmN0aW9uIHJlc3RvcmVTdGF0ZSgpIHtcbiAgICBsZXQgc3RhdGVTdHJpbmcgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnanh3b3JkLWNyZWF0b3InKTtcbiAgICBpZiAoc3RhdGVTdHJpbmcgJiYgc3RhdGVTdHJpbmcgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGxldCBzdGF0ZSA9IEpTT04ucGFyc2Uoc3RhdGVTdHJpbmcpO1xuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjbGVhclN0YXRlKCkge1xuICAgIGxvY2FsU3RvcmFnZS5jbGVhcigpO1xufVxuXG5jb25zdCBmb3JtYXRfZGF0ZSA9IChkYXRlKSA9PiBuZXcgRGF0ZShkYXRlKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcblxuZnVuY3Rpb24gWERFbmNvZGUob2JqKSB7XG4gICAgaWYgKCFvYmopIHJldHVybjtcbiAgICBsZXQgc3RyID0gXCJcIjtcbiAgICBpZiAob2JqLnRpdGxlKSB7XG4gICAgICAgIHN0ciArPSBgVGl0bGU6ICR7b2JqLnRpdGxlfVxcbmA7XG4gICAgfVxuICAgIGlmIChvYmouYXV0aG9yKSB7XG4gICAgICAgIHN0ciArPSBgQXV0aG9yOiAke29iai5hdXRob3J9XFxuYDtcbiAgICB9XG4gICAgaWYgKG9iai5lZGl0b3IpIHtcbiAgICAgICAgc3RyICs9IGBFZGl0b3I6ICR7b2JqLmVkaXRvcn1cXG5gO1xuICAgIH1cbiAgICBpZiAob2JqLmRhdGUpIHtcbiAgICAgICAgc3RyICs9IGBEYXRlOiAke2Zvcm1hdF9kYXRlKG9iai5kYXRlKX1cXG5gO1xuICAgIH1cbiAgICBpZiAob2JqLmRpZmZpY3VsdHkpIHtcbiAgICAgICAgc3RyICs9IGBEaWZmaWN1bHR5OiAke29iai5kaWZmaWN1bHR5fVxcbmA7XG4gICAgfVxuICAgIGlmIChvYmoudHlwZSkge1xuICAgICAgICBzdHIgKz0gYFR5cGU6ICR7b2JqLnR5cGV9XFxuYDtcbiAgICB9XG4gICAgaWYgKG9iai5jb3B5cmlnaHQpIHtcbiAgICAgICAgc3RyICs9IGBDb3B5cmlnaHQ6ICR7b2JqLmNvcHlyaWdodH1cXG5gO1xuICAgIH1cbiAgICBzdHIgKz0gYFxcblxcbmA7XG4gICAgZm9yIChsZXQgeSA9IDA7IHkgPCBvYmouZ3JpZC5sZW5ndGg7IHkrKykge1xuICAgICAgICBmb3IobGV0IHggPSAwOyB4IDwgb2JqLmdyaWRbeV0ubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIHN0ciArPSBgJHtvYmouZ3JpZFt5XVt4XX1gO1xuICAgICAgICB9XG4gICAgICAgIHN0ciArPSBgXFxuYDtcbiAgICB9XG4gICAgc3RyICs9IGBcXG5cXG5gO1xuICAgIGZvciAobGV0IHEgb2Ygb2JqLnF1ZXN0aW9uc19hY3Jvc3MpIHtcbiAgICAgICAgc3RyICs9IGBBJHtxLm51bX0uICR7cS5xdWVzdGlvbn0gfiAke3EuYW5zd2VyfVxcbmA7XG4gICAgfVxuICAgIHN0ciArPSBgXFxuYDtcbiAgICBmb3IgKGxldCBxIG9mIG9iai5xdWVzdGlvbnNfZG93bikge1xuICAgICAgICBzdHIgKz0gYEQke3EubnVtfS4gJHtxLnF1ZXN0aW9ufSB+ICR7cS5hbnN3ZXJ9XFxuYDtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn1cblxuLy8gQSBsaWJyYXJ5IGZvciBjb252ZXJ0aW5nIC54ZCBDcm9zc3dvcmQgZGF0YSB0byBKU09OIChhcyBkZWZpbmVkIGJ5IFNhdWwgUHdhbnNvbiAtIGh0dHA6Ly94ZC5zYXVsLnB3KSB3cml0dGVuIGJ5IEphc29uIE5vcndvb2QtWW91bmdcblxuZnVuY3Rpb24gWERQYXJzZXIoZGF0YSkge1xuICAgIGZ1bmN0aW9uIHByb2Nlc3NEYXRhKGRhdGEpIHtcbiAgICAgICAgLy8gU3BsaXQgaW50byBwYXJ0c1xuICAgICAgICBsZXQgcGFydHMgPSBkYXRhLnNwbGl0KC9eJF4kL2dtKS5maWx0ZXIocyA9PiBzICE9PSBcIlxcblwiKTtcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA+IDQpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgICAgIHBhcnRzID0gZGF0YS5zcGxpdCgvXFxyXFxuXFxyXFxuL2cpLmZpbHRlcihzID0+IChzLnRyaW0oKSkpO1xuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcGFydHNbaV0gPSBwYXJ0c1tpXS5yZXBsYWNlKC9cXHJcXG4vZywgXCJcXG5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCAhPT0gNCkgdGhyb3cgKGBUb28gbWFueSBwYXJ0cyAtIGV4cGVjdGVkIDQsIGZvdW5kICR7cGFydHMubGVuZ3RofWApO1xuICAgICAgICBjb25zdCByYXdNZXRhID0gcGFydHNbMF07XG4gICAgICAgIGNvbnN0IHJhd0dyaWQgPSBwYXJ0c1sxXTtcbiAgICAgICAgY29uc3QgcmF3QWNyb3NzID0gcGFydHNbMl07XG4gICAgICAgIGNvbnN0IHJhd0Rvd24gPSBwYXJ0c1szXTtcbiAgICAgICAgY29uc3QgbWV0YSA9IHByb2Nlc3NNZXRhKHJhd01ldGEpO1xuICAgICAgICBjb25zdCBncmlkID0gcHJvY2Vzc0dyaWQocmF3R3JpZCk7XG4gICAgICAgIGNvbnN0IGFjcm9zcyA9IHByb2Nlc3NDbHVlcyhyYXdBY3Jvc3MpO1xuICAgICAgICBjb25zdCBkb3duID0gcHJvY2Vzc0NsdWVzKHJhd0Rvd24pO1xuICAgICAgICByZXR1cm4geyBtZXRhLCBncmlkLCBhY3Jvc3MsIGRvd24sIHJhd0dyaWQsIHJhd0Fjcm9zcywgcmF3RG93biwgcmF3TWV0YSwgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzTWV0YShyYXdNZXRhKSB7XG4gICAgICAgIGNvbnN0IG1ldGFMaW5lcyA9IHJhd01ldGEuc3BsaXQoXCJcXG5cIikuZmlsdGVyKHMgPT4gKHMpICYmIHMgIT09IFwiXFxuXCIpO1xuICAgICAgICBsZXQgbWV0YSA9IHt9O1xuICAgICAgICBtZXRhTGluZXMuZm9yRWFjaChtZXRhTGluZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBsaW5lUGFydHMgPSBtZXRhTGluZS5zcGxpdChcIjogXCIpO1xuICAgICAgICAgICAgbWV0YVtsaW5lUGFydHNbMF1dID0gbGluZVBhcnRzWzFdO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG1ldGE7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0dyaWQocmF3R3JpZCkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgICAgIGNvbnN0IGxpbmVzID0gcmF3R3JpZC5zcGxpdChcIlxcblwiKS5maWx0ZXIocyA9PiAocykgJiYgcyAhPT0gXCJcXG5cIik7XG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgbGluZXMubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIHJlc3VsdFt4XSA9IGxpbmVzW3hdLnNwbGl0KFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0NsdWVzKHJhd0NsdWVzKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICAgICAgY29uc3QgbGluZXMgPSByYXdDbHVlcy5zcGxpdChcIlxcblwiKS5maWx0ZXIocyA9PiAocykgJiYgcyAhPT0gXCJcXG5cIik7XG4gICAgICAgIGNvbnN0IHJlZ2V4ID0gLyheLlxcZCopXFwuXFxzKC4qKVxcc35cXHMoLiopLztcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBsaW5lcy5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgaWYgKCFsaW5lc1t4XS50cmltKCkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgY29uc3QgcGFydHMgPSBsaW5lc1t4XS5tYXRjaChyZWdleCk7XG4gICAgICAgICAgICBpZiAocGFydHMubGVuZ3RoICE9PSA0KSB0aHJvdyAoYENvdWxkIG5vdCBwYXJzZSBxdWVzdGlvbiAke2xpbmVzW3hdfWApO1xuICAgICAgICAgICAgLy8gVW5lc2NhcGUgc3RyaW5nXG4gICAgICAgICAgICBjb25zdCBxdWVzdGlvbiA9IHBhcnRzWzJdLnJlcGxhY2UoL1xcXFwvZywgXCJcIik7XG4gICAgICAgICAgICByZXN1bHRbeF0gPSB7XG4gICAgICAgICAgICAgICAgbnVtOiBwYXJ0c1sxXSxcbiAgICAgICAgICAgICAgICBxdWVzdGlvbjogcXVlc3Rpb24sXG4gICAgICAgICAgICAgICAgYW5zd2VyOiBwYXJ0c1szXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHJldHVybiBwcm9jZXNzRGF0YShkYXRhKTtcbn1cblxudmFyIHhkQ3Jvc3N3b3JkUGFyc2VyID0gWERQYXJzZXI7XG5cbi8qIHNyYy9KWFdvcmRDcmVhdG9yLnN2ZWx0ZSBnZW5lcmF0ZWQgYnkgU3ZlbHRlIHYzLjQ2LjQgKi9cblxuZnVuY3Rpb24gZ2V0X2VhY2hfY29udGV4dChjdHgsIGxpc3QsIGkpIHtcblx0Y29uc3QgY2hpbGRfY3R4ID0gY3R4LnNsaWNlKCk7XG5cdGNoaWxkX2N0eFs0OV0gPSBsaXN0W2ldO1xuXHRyZXR1cm4gY2hpbGRfY3R4O1xufVxuXG5mdW5jdGlvbiBnZXRfZWFjaF9jb250ZXh0XzEoY3R4LCBsaXN0LCBpKSB7XG5cdGNvbnN0IGNoaWxkX2N0eCA9IGN0eC5zbGljZSgpO1xuXHRjaGlsZF9jdHhbNTJdID0gbGlzdFtpXTtcblx0cmV0dXJuIGNoaWxkX2N0eDtcbn1cblxuLy8gKDI4Mjo2KSB7I2VhY2ggZGlmZmljdWx0aWVzIGFzIGRpZmZpY3VsdHlfb3B0aW9ufVxuZnVuY3Rpb24gY3JlYXRlX2VhY2hfYmxvY2tfMShjdHgpIHtcblx0bGV0IG9wdGlvbjtcblx0bGV0IHRfdmFsdWUgPSAvKmRpZmZpY3VsdHlfb3B0aW9uKi8gY3R4WzUyXSArIFwiXCI7XG5cdGxldCB0O1xuXHRsZXQgb3B0aW9uX3ZhbHVlX3ZhbHVlO1xuXG5cdHJldHVybiB7XG5cdFx0YygpIHtcblx0XHRcdG9wdGlvbiA9IGVsZW1lbnQoXCJvcHRpb25cIik7XG5cdFx0XHR0ID0gdGV4dCh0X3ZhbHVlKTtcblx0XHRcdG9wdGlvbi5fX3ZhbHVlID0gb3B0aW9uX3ZhbHVlX3ZhbHVlID0gLypkaWZmaWN1bHR5X29wdGlvbiovIGN0eFs1Ml07XG5cdFx0XHRvcHRpb24udmFsdWUgPSBvcHRpb24uX192YWx1ZTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGluc2VydCh0YXJnZXQsIG9wdGlvbiwgYW5jaG9yKTtcblx0XHRcdGFwcGVuZChvcHRpb24sIHQpO1xuXHRcdH0sXG5cdFx0cChjdHgsIGRpcnR5KSB7XG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmRpZmZpY3VsdGllcyovIDEwMjQgJiYgdF92YWx1ZSAhPT0gKHRfdmFsdWUgPSAvKmRpZmZpY3VsdHlfb3B0aW9uKi8gY3R4WzUyXSArIFwiXCIpKSBzZXRfZGF0YSh0LCB0X3ZhbHVlKTtcblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypkaWZmaWN1bHRpZXMqLyAxMDI0ICYmIG9wdGlvbl92YWx1ZV92YWx1ZSAhPT0gKG9wdGlvbl92YWx1ZV92YWx1ZSA9IC8qZGlmZmljdWx0eV9vcHRpb24qLyBjdHhbNTJdKSkge1xuXHRcdFx0XHRvcHRpb24uX192YWx1ZSA9IG9wdGlvbl92YWx1ZV92YWx1ZTtcblx0XHRcdFx0b3B0aW9uLnZhbHVlID0gb3B0aW9uLl9fdmFsdWU7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRkKGRldGFjaGluZykge1xuXHRcdFx0aWYgKGRldGFjaGluZykgZGV0YWNoKG9wdGlvbik7XG5cdFx0fVxuXHR9O1xufVxuXG4vLyAoMjkwOjYpIHsjZWFjaCB0eXBlcyBhcyB0eXBlX29wdGlvbn1cbmZ1bmN0aW9uIGNyZWF0ZV9lYWNoX2Jsb2NrKGN0eCkge1xuXHRsZXQgb3B0aW9uO1xuXHRsZXQgdF92YWx1ZSA9IC8qdHlwZV9vcHRpb24qLyBjdHhbNDldICsgXCJcIjtcblx0bGV0IHQ7XG5cdGxldCBvcHRpb25fdmFsdWVfdmFsdWU7XG5cblx0cmV0dXJuIHtcblx0XHRjKCkge1xuXHRcdFx0b3B0aW9uID0gZWxlbWVudChcIm9wdGlvblwiKTtcblx0XHRcdHQgPSB0ZXh0KHRfdmFsdWUpO1xuXHRcdFx0b3B0aW9uLl9fdmFsdWUgPSBvcHRpb25fdmFsdWVfdmFsdWUgPSAvKnR5cGVfb3B0aW9uKi8gY3R4WzQ5XTtcblx0XHRcdG9wdGlvbi52YWx1ZSA9IG9wdGlvbi5fX3ZhbHVlO1xuXHRcdH0sXG5cdFx0bSh0YXJnZXQsIGFuY2hvcikge1xuXHRcdFx0aW5zZXJ0KHRhcmdldCwgb3B0aW9uLCBhbmNob3IpO1xuXHRcdFx0YXBwZW5kKG9wdGlvbiwgdCk7XG5cdFx0fSxcblx0XHRwKGN0eCwgZGlydHkpIHtcblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qdHlwZXMqLyAyMDQ4ICYmIHRfdmFsdWUgIT09ICh0X3ZhbHVlID0gLyp0eXBlX29wdGlvbiovIGN0eFs0OV0gKyBcIlwiKSkgc2V0X2RhdGEodCwgdF92YWx1ZSk7XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qdHlwZXMqLyAyMDQ4ICYmIG9wdGlvbl92YWx1ZV92YWx1ZSAhPT0gKG9wdGlvbl92YWx1ZV92YWx1ZSA9IC8qdHlwZV9vcHRpb24qLyBjdHhbNDldKSkge1xuXHRcdFx0XHRvcHRpb24uX192YWx1ZSA9IG9wdGlvbl92YWx1ZV92YWx1ZTtcblx0XHRcdFx0b3B0aW9uLnZhbHVlID0gb3B0aW9uLl9fdmFsdWU7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRkKGRldGFjaGluZykge1xuXHRcdFx0aWYgKGRldGFjaGluZykgZGV0YWNoKG9wdGlvbik7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVfZnJhZ21lbnQoY3R4KSB7XG5cdGxldCBtYWluO1xuXHRsZXQgaW5zdHJ1Y3Rpb25zO1xuXHRsZXQgdXBkYXRpbmdfdmlzaWJsZTtcblx0bGV0IHQwO1xuXHRsZXQgZGl2MTA7XG5cdGxldCBkaXY3O1xuXHRsZXQgZGl2Mjtcblx0bGV0IGlucHV0MDtcblx0bGV0IHQxO1xuXHRsZXQgc2l6ZXNsaWRlcjtcblx0bGV0IHVwZGF0aW5nX3NpemU7XG5cdGxldCB0Mjtcblx0bGV0IGRpdjA7XG5cdGxldCBsYWJlbDA7XG5cdGxldCB0NDtcblx0bGV0IHNlbGVjdDA7XG5cdGxldCB0NTtcblx0bGV0IGRpdjE7XG5cdGxldCBsYWJlbDE7XG5cdGxldCB0Nztcblx0bGV0IHNlbGVjdDE7XG5cdGxldCB0ODtcblx0bGV0IGlucHV0MTtcblx0bGV0IHQ5O1xuXHRsZXQgaW5wdXQyO1xuXHRsZXQgdDEwO1xuXHRsZXQgaW5wdXQzO1xuXHRsZXQgdDExO1xuXHRsZXQgaW5wdXQ0O1xuXHRsZXQgdDEyO1xuXHRsZXQgZGl2Njtcblx0bGV0IGRpdjM7XG5cdGxldCBpbnB1dDU7XG5cdGxldCB0MTM7XG5cdGxldCBsYWJlbDI7XG5cdGxldCB0MTU7XG5cdGxldCBwcmludDtcblx0bGV0IHVwZGF0aW5nX3N0YXRlO1xuXHRsZXQgdDE2O1xuXHRsZXQgZGl2NDtcblx0bGV0IGxhYmVsMztcblx0bGV0IHQxODtcblx0bGV0IGlucHV0Njtcblx0bGV0IHQxOTtcblx0bGV0IGRpdjU7XG5cdGxldCBidXR0b247XG5cdGxldCB0MjE7XG5cdGxldCBkaXY5O1xuXHRsZXQgZGl2ODtcblx0bGV0IG1lbnU7XG5cdGxldCB0MjI7XG5cdGxldCBncmlkXzE7XG5cdGxldCB1cGRhdGluZ19Db250YWluZXI7XG5cdGxldCB0MjM7XG5cdGxldCB0ZXh0YXJlYTtcblx0bGV0IGN1cnJlbnQ7XG5cdGxldCBtb3VudGVkO1xuXHRsZXQgZGlzcG9zZTtcblxuXHRmdW5jdGlvbiBpbnN0cnVjdGlvbnNfdmlzaWJsZV9iaW5kaW5nKHZhbHVlKSB7XG5cdFx0LyppbnN0cnVjdGlvbnNfdmlzaWJsZV9iaW5kaW5nKi8gY3R4WzI5XSh2YWx1ZSk7XG5cdH1cblxuXHRsZXQgaW5zdHJ1Y3Rpb25zX3Byb3BzID0ge307XG5cblx0aWYgKC8qaW5zdHJ1Y3Rpb25zVmlzaWJsZSovIGN0eFsxOF0gIT09IHZvaWQgMCkge1xuXHRcdGluc3RydWN0aW9uc19wcm9wcy52aXNpYmxlID0gLyppbnN0cnVjdGlvbnNWaXNpYmxlKi8gY3R4WzE4XTtcblx0fVxuXG5cdGluc3RydWN0aW9ucyA9IG5ldyBJbnN0cnVjdGlvbnMoeyBwcm9wczogaW5zdHJ1Y3Rpb25zX3Byb3BzIH0pO1xuXHRiaW5kaW5nX2NhbGxiYWNrcy5wdXNoKCgpID0+IGJpbmQoaW5zdHJ1Y3Rpb25zLCAndmlzaWJsZScsIGluc3RydWN0aW9uc192aXNpYmxlX2JpbmRpbmcpKTtcblxuXHRmdW5jdGlvbiBzaXplc2xpZGVyX3NpemVfYmluZGluZyh2YWx1ZSkge1xuXHRcdC8qc2l6ZXNsaWRlcl9zaXplX2JpbmRpbmcqLyBjdHhbMzFdKHZhbHVlKTtcblx0fVxuXG5cdGxldCBzaXplc2xpZGVyX3Byb3BzID0ge307XG5cblx0aWYgKC8qc2l6ZSovIGN0eFsxNV0gIT09IHZvaWQgMCkge1xuXHRcdHNpemVzbGlkZXJfcHJvcHMuc2l6ZSA9IC8qc2l6ZSovIGN0eFsxNV07XG5cdH1cblxuXHRzaXplc2xpZGVyID0gbmV3IFNpemVTbGlkZXIoeyBwcm9wczogc2l6ZXNsaWRlcl9wcm9wcyB9KTtcblx0YmluZGluZ19jYWxsYmFja3MucHVzaCgoKSA9PiBiaW5kKHNpemVzbGlkZXIsICdzaXplJywgc2l6ZXNsaWRlcl9zaXplX2JpbmRpbmcpKTtcblx0c2l6ZXNsaWRlci4kb24oXCJjaGFuZ2VcIiwgLypoYW5kbGVTdGF0ZUNoYW5nZSovIGN0eFsyM10pO1xuXHRsZXQgZWFjaF92YWx1ZV8xID0gLypkaWZmaWN1bHRpZXMqLyBjdHhbMTBdO1xuXHRsZXQgZWFjaF9ibG9ja3NfMSA9IFtdO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF92YWx1ZV8xLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0ZWFjaF9ibG9ja3NfMVtpXSA9IGNyZWF0ZV9lYWNoX2Jsb2NrXzEoZ2V0X2VhY2hfY29udGV4dF8xKGN0eCwgZWFjaF92YWx1ZV8xLCBpKSk7XG5cdH1cblxuXHRsZXQgZWFjaF92YWx1ZSA9IC8qdHlwZXMqLyBjdHhbMTFdO1xuXHRsZXQgZWFjaF9ibG9ja3MgPSBbXTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGVhY2hfdmFsdWUubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRlYWNoX2Jsb2Nrc1tpXSA9IGNyZWF0ZV9lYWNoX2Jsb2NrKGdldF9lYWNoX2NvbnRleHQoY3R4LCBlYWNoX3ZhbHVlLCBpKSk7XG5cdH1cblxuXHRmdW5jdGlvbiBwcmludF9zdGF0ZV9iaW5kaW5nKHZhbHVlKSB7XG5cdFx0LypwcmludF9zdGF0ZV9iaW5kaW5nKi8gY3R4WzM5XSh2YWx1ZSk7XG5cdH1cblxuXHRsZXQgcHJpbnRfcHJvcHMgPSB7fTtcblxuXHRpZiAoLypzdGF0ZSovIGN0eFsxNl0gIT09IHZvaWQgMCkge1xuXHRcdHByaW50X3Byb3BzLnN0YXRlID0gLypzdGF0ZSovIGN0eFsxNl07XG5cdH1cblxuXHRwcmludCA9IG5ldyBQcmludCh7IHByb3BzOiBwcmludF9wcm9wcyB9KTtcblx0YmluZGluZ19jYWxsYmFja3MucHVzaCgoKSA9PiBiaW5kKHByaW50LCAnc3RhdGUnLCBwcmludF9zdGF0ZV9iaW5kaW5nKSk7XG5cdG1lbnUgPSBuZXcgTWVudSh7fSk7XG5cdG1lbnUuJG9uKFwicmVzZXRcIiwgLypoYW5kbGVSZXNldCovIGN0eFsyNF0pO1xuXHRtZW51LiRvbihcImluc3RydWN0aW9uc1wiLCAvKmhhbmRsZUluc3RydWN0aW9ucyovIGN0eFsyNl0pO1xuXG5cdGZ1bmN0aW9uIGdyaWRfMV9Db250YWluZXJfYmluZGluZyh2YWx1ZSkge1xuXHRcdC8qZ3JpZF8xX0NvbnRhaW5lcl9iaW5kaW5nKi8gY3R4WzQyXSh2YWx1ZSk7XG5cdH1cblxuXHRsZXQgZ3JpZF8xX3Byb3BzID0ge1xuXHRcdHNpemU6IC8qc2l6ZSovIGN0eFsxNV0sXG5cdFx0Z3JpZDogLypncmlkKi8gY3R4WzFdXG5cdH07XG5cblx0aWYgKC8qZ3JpZENvbXBvbmVudENvbnRhaW5lciovIGN0eFsxNF0gIT09IHZvaWQgMCkge1xuXHRcdGdyaWRfMV9wcm9wcy5Db250YWluZXIgPSAvKmdyaWRDb21wb25lbnRDb250YWluZXIqLyBjdHhbMTRdO1xuXHR9XG5cblx0Z3JpZF8xID0gbmV3IEdyaWQoeyBwcm9wczogZ3JpZF8xX3Byb3BzIH0pO1xuXHQvKmdyaWRfMV9iaW5kaW5nKi8gY3R4WzQxXShncmlkXzEpO1xuXHRiaW5kaW5nX2NhbGxiYWNrcy5wdXNoKCgpID0+IGJpbmQoZ3JpZF8xLCAnQ29udGFpbmVyJywgZ3JpZF8xX0NvbnRhaW5lcl9iaW5kaW5nKSk7XG5cdGdyaWRfMS4kb24oXCJjaGFuZ2VcIiwgLypoYW5kbGVTdGF0ZUNoYW5nZSovIGN0eFsyM10pO1xuXHRncmlkXzEuJG9uKFwibW92ZVwiLCAvKmhhbmRsZU1vdmUqLyBjdHhbMTldKTtcblx0Z3JpZF8xLiRvbihcImxldHRlclwiLCAvKmhhbmRsZUxldHRlciovIGN0eFsyMF0pO1xuXHRncmlkXzEuJG9uKFwiYmFja3NwYWNlXCIsIC8qaGFuZGxlQmFja3NwYWNlKi8gY3R4WzIyXSk7XG5cdGdyaWRfMS4kb24oXCJlbnRlclwiLCAvKmhhbmRsZUVudGVyKi8gY3R4WzIxXSk7XG5cblx0cmV0dXJuIHtcblx0XHRjKCkge1xuXHRcdFx0bWFpbiA9IGVsZW1lbnQoXCJtYWluXCIpO1xuXHRcdFx0Y3JlYXRlX2NvbXBvbmVudChpbnN0cnVjdGlvbnMuJCQuZnJhZ21lbnQpO1xuXHRcdFx0dDAgPSBzcGFjZSgpO1xuXHRcdFx0ZGl2MTAgPSBlbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0ZGl2NyA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRkaXYyID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdGlucHV0MCA9IGVsZW1lbnQoXCJpbnB1dFwiKTtcblx0XHRcdHQxID0gc3BhY2UoKTtcblx0XHRcdGNyZWF0ZV9jb21wb25lbnQoc2l6ZXNsaWRlci4kJC5mcmFnbWVudCk7XG5cdFx0XHR0MiA9IHNwYWNlKCk7XG5cdFx0XHRkaXYwID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdGxhYmVsMCA9IGVsZW1lbnQoXCJsYWJlbFwiKTtcblx0XHRcdGxhYmVsMC50ZXh0Q29udGVudCA9IFwiRGlmZmljdWx0eVwiO1xuXHRcdFx0dDQgPSBzcGFjZSgpO1xuXHRcdFx0c2VsZWN0MCA9IGVsZW1lbnQoXCJzZWxlY3RcIik7XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWFjaF9ibG9ja3NfMS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRlYWNoX2Jsb2Nrc18xW2ldLmMoKTtcblx0XHRcdH1cblxuXHRcdFx0dDUgPSBzcGFjZSgpO1xuXHRcdFx0ZGl2MSA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRsYWJlbDEgPSBlbGVtZW50KFwibGFiZWxcIik7XG5cdFx0XHRsYWJlbDEudGV4dENvbnRlbnQgPSBcIlR5cGVcIjtcblx0XHRcdHQ3ID0gc3BhY2UoKTtcblx0XHRcdHNlbGVjdDEgPSBlbGVtZW50KFwic2VsZWN0XCIpO1xuXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGVhY2hfYmxvY2tzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdGVhY2hfYmxvY2tzW2ldLmMoKTtcblx0XHRcdH1cblxuXHRcdFx0dDggPSBzcGFjZSgpO1xuXHRcdFx0aW5wdXQxID0gZWxlbWVudChcImlucHV0XCIpO1xuXHRcdFx0dDkgPSBzcGFjZSgpO1xuXHRcdFx0aW5wdXQyID0gZWxlbWVudChcImlucHV0XCIpO1xuXHRcdFx0dDEwID0gc3BhY2UoKTtcblx0XHRcdGlucHV0MyA9IGVsZW1lbnQoXCJpbnB1dFwiKTtcblx0XHRcdHQxMSA9IHNwYWNlKCk7XG5cdFx0XHRpbnB1dDQgPSBlbGVtZW50KFwiaW5wdXRcIik7XG5cdFx0XHR0MTIgPSBzcGFjZSgpO1xuXHRcdFx0ZGl2NiA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRkaXYzID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdGlucHV0NSA9IGVsZW1lbnQoXCJpbnB1dFwiKTtcblx0XHRcdHQxMyA9IHNwYWNlKCk7XG5cdFx0XHRsYWJlbDIgPSBlbGVtZW50KFwibGFiZWxcIik7XG5cdFx0XHRsYWJlbDIudGV4dENvbnRlbnQgPSBcIlN5bW1ldHJ5XCI7XG5cdFx0XHR0MTUgPSBzcGFjZSgpO1xuXHRcdFx0Y3JlYXRlX2NvbXBvbmVudChwcmludC4kJC5mcmFnbWVudCk7XG5cdFx0XHR0MTYgPSBzcGFjZSgpO1xuXHRcdFx0ZGl2NCA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRsYWJlbDMgPSBlbGVtZW50KFwibGFiZWxcIik7XG5cdFx0XHRsYWJlbDMudGV4dENvbnRlbnQgPSBcIlVwbG9hZCBDcm9zc3dvcmRcIjtcblx0XHRcdHQxOCA9IHNwYWNlKCk7XG5cdFx0XHRpbnB1dDYgPSBlbGVtZW50KFwiaW5wdXRcIik7XG5cdFx0XHR0MTkgPSBzcGFjZSgpO1xuXHRcdFx0ZGl2NSA9IGVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRidXR0b24gPSBlbGVtZW50KFwiYnV0dG9uXCIpO1xuXHRcdFx0YnV0dG9uLnRleHRDb250ZW50ID0gXCJEb3dubG9hZCBDcm9zc3dvcmRcIjtcblx0XHRcdHQyMSA9IHNwYWNlKCk7XG5cdFx0XHRkaXY5ID0gZWxlbWVudChcImRpdlwiKTtcblx0XHRcdGRpdjggPSBlbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0Y3JlYXRlX2NvbXBvbmVudChtZW51LiQkLmZyYWdtZW50KTtcblx0XHRcdHQyMiA9IHNwYWNlKCk7XG5cdFx0XHRjcmVhdGVfY29tcG9uZW50KGdyaWRfMS4kJC5mcmFnbWVudCk7XG5cdFx0XHR0MjMgPSBzcGFjZSgpO1xuXHRcdFx0dGV4dGFyZWEgPSBlbGVtZW50KFwidGV4dGFyZWFcIik7XG5cdFx0XHRhdHRyKGlucHV0MCwgXCJpZFwiLCBcImp4d29yZC10aXRsZVwiKTtcblx0XHRcdGF0dHIoaW5wdXQwLCBcImNsYXNzXCIsIFwianh3b3JkLXRpdGxlIHN2ZWx0ZS0yOHIyNDVcIik7XG5cdFx0XHRhdHRyKGlucHV0MCwgXCJuYW1lXCIsIFwidGl0bGVcIik7XG5cdFx0XHRhdHRyKGlucHV0MCwgXCJ0eXBlXCIsIFwidGV4dFwiKTtcblx0XHRcdGF0dHIoaW5wdXQwLCBcInBsYWNlaG9sZGVyXCIsIFwiVGl0bGVcIik7XG5cdFx0XHRhdHRyKGxhYmVsMCwgXCJmb3JcIiwgXCJkaWZmaWN1bHR5XCIpO1xuXHRcdFx0YXR0cihsYWJlbDAsIFwiY2xhc3NcIiwgXCJzdmVsdGUtMjhyMjQ1XCIpO1xuXHRcdFx0YXR0cihzZWxlY3QwLCBcImlkXCIsIFwianh3b3JkLWRpZmZpY3VsdHlcIik7XG5cdFx0XHRhdHRyKHNlbGVjdDAsIFwibmFtZVwiLCBcImRpZmZpY3VsdHlcIik7XG5cdFx0XHRhdHRyKHNlbGVjdDAsIFwiY2xhc3NcIiwgXCJzdmVsdGUtMjhyMjQ1XCIpO1xuXHRcdFx0aWYgKC8qZGlmZmljdWx0eSovIGN0eFs3XSA9PT0gdm9pZCAwKSBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IC8qc2VsZWN0MF9jaGFuZ2VfaGFuZGxlciovIGN0eFszMl0uY2FsbChzZWxlY3QwKSk7XG5cdFx0XHRhdHRyKGxhYmVsMSwgXCJmb3JcIiwgXCJ0eXBlXCIpO1xuXHRcdFx0YXR0cihsYWJlbDEsIFwiY2xhc3NcIiwgXCJzdmVsdGUtMjhyMjQ1XCIpO1xuXHRcdFx0YXR0cihzZWxlY3QxLCBcImlkXCIsIFwianh3b3JkLXR5cGVcIik7XG5cdFx0XHRhdHRyKHNlbGVjdDEsIFwibmFtZVwiLCBcInR5cGVcIik7XG5cdFx0XHRhdHRyKHNlbGVjdDEsIFwiY2xhc3NcIiwgXCJzdmVsdGUtMjhyMjQ1XCIpO1xuXHRcdFx0aWYgKC8qdHlwZSovIGN0eFs4XSA9PT0gdm9pZCAwKSBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IC8qc2VsZWN0MV9jaGFuZ2VfaGFuZGxlciovIGN0eFszM10uY2FsbChzZWxlY3QxKSk7XG5cdFx0XHRhdHRyKGlucHV0MSwgXCJpZFwiLCBcImp4d29yZC1kYXRlXCIpO1xuXHRcdFx0YXR0cihpbnB1dDEsIFwibmFtZVwiLCBcImRhdGVcIik7XG5cdFx0XHRhdHRyKGlucHV0MSwgXCJ0eXBlXCIsIFwiZGF0ZVwiKTtcblx0XHRcdGF0dHIoaW5wdXQxLCBcInBsYWNlaG9sZGVyXCIsIFwiUHVibGlzaCBEYXRlXCIpO1xuXHRcdFx0YXR0cihpbnB1dDEsIFwiY2xhc3NcIiwgXCJzdmVsdGUtMjhyMjQ1XCIpO1xuXHRcdFx0YXR0cihpbnB1dDIsIFwiaWRcIiwgXCJqeHdvcmQtYXV0aG9yXCIpO1xuXHRcdFx0YXR0cihpbnB1dDIsIFwibmFtZVwiLCBcImF1dGhvclwiKTtcblx0XHRcdGF0dHIoaW5wdXQyLCBcInR5cGVcIiwgXCJ0ZXh0XCIpO1xuXHRcdFx0YXR0cihpbnB1dDIsIFwicGxhY2Vob2xkZXJcIiwgXCJBdXRob3JcIik7XG5cdFx0XHRhdHRyKGlucHV0MiwgXCJjbGFzc1wiLCBcInN2ZWx0ZS0yOHIyNDVcIik7XG5cdFx0XHRhdHRyKGlucHV0MywgXCJpZFwiLCBcImp4d29yZC1lZGl0b3JcIik7XG5cdFx0XHRhdHRyKGlucHV0MywgXCJuYW1lXCIsIFwiZWRpdG9yXCIpO1xuXHRcdFx0YXR0cihpbnB1dDMsIFwidHlwZVwiLCBcInRleHRcIik7XG5cdFx0XHRhdHRyKGlucHV0MywgXCJwbGFjZWhvbGRlclwiLCBcIkVkaXRvclwiKTtcblx0XHRcdGF0dHIoaW5wdXQzLCBcImNsYXNzXCIsIFwic3ZlbHRlLTI4cjI0NVwiKTtcblx0XHRcdGF0dHIoaW5wdXQ0LCBcImlkXCIsIFwianh3b3JkLWNvcHlyaWdodFwiKTtcblx0XHRcdGF0dHIoaW5wdXQ0LCBcIm5hbWVcIiwgXCJjb3B5cmlnaHRcIik7XG5cdFx0XHRhdHRyKGlucHV0NCwgXCJ0eXBlXCIsIFwidGV4dFwiKTtcblx0XHRcdGF0dHIoaW5wdXQ0LCBcInBsYWNlaG9sZGVyXCIsIFwiQ29weXJpZ2h0XCIpO1xuXHRcdFx0YXR0cihpbnB1dDQsIFwiY2xhc3NcIiwgXCJzdmVsdGUtMjhyMjQ1XCIpO1xuXHRcdFx0YXR0cihkaXYyLCBcImlkXCIsIFwianh3b3JkLW1ldGFcIik7XG5cdFx0XHRhdHRyKGlucHV0NSwgXCJ0eXBlXCIsIFwiY2hlY2tib3hcIik7XG5cdFx0XHRhdHRyKGlucHV0NSwgXCJuYW1lXCIsIFwic3ltbWV0cnlcIik7XG5cdFx0XHRhdHRyKGlucHV0NSwgXCJjbGFzc1wiLCBcInN2ZWx0ZS0yOHIyNDVcIik7XG5cdFx0XHRhdHRyKGxhYmVsMiwgXCJmb3JcIiwgXCJzeW1tZXRyeVwiKTtcblx0XHRcdGF0dHIobGFiZWwyLCBcImNsYXNzXCIsIFwic3ZlbHRlLTI4cjI0NVwiKTtcblx0XHRcdGF0dHIoZGl2MywgXCJjbGFzc1wiLCBcImp4d29yZC1jaGVja2JveC1ncm91cCBzdmVsdGUtMjhyMjQ1XCIpO1xuXHRcdFx0YXR0cihsYWJlbDMsIFwiZm9yXCIsIFwiZmlsZVwiKTtcblx0XHRcdGF0dHIobGFiZWwzLCBcImNsYXNzXCIsIFwic3ZlbHRlLTI4cjI0NVwiKTtcblx0XHRcdGF0dHIoaW5wdXQ2LCBcImNsYXNzXCIsIFwiZHJvcF96b25lIHN2ZWx0ZS0yOHIyNDVcIik7XG5cdFx0XHRhdHRyKGlucHV0NiwgXCJ0eXBlXCIsIFwiZmlsZVwiKTtcblx0XHRcdGF0dHIoaW5wdXQ2LCBcImlkXCIsIFwiZmlsZVwiKTtcblx0XHRcdGF0dHIoaW5wdXQ2LCBcIm5hbWVcIiwgXCJmaWxlc1wiKTtcblx0XHRcdGF0dHIoaW5wdXQ2LCBcImFjY2VwdFwiLCBcIi54ZFwiKTtcblx0XHRcdGF0dHIoZGl2NiwgXCJpZFwiLCBcImp4d29yZC1vcHRpb25zXCIpO1xuXHRcdFx0YXR0cihkaXY2LCBcImNsYXNzXCIsIFwic3ZlbHRlLTI4cjI0NVwiKTtcblx0XHRcdGF0dHIoZGl2NywgXCJpZFwiLCBcImp4d29yZC10b3BcIik7XG5cdFx0XHRhdHRyKGRpdjcsIFwiY2xhc3NcIiwgXCJzdmVsdGUtMjhyMjQ1XCIpO1xuXHRcdFx0YXR0cihkaXY4LCBcImNsYXNzXCIsIFwianh3b3JkLWhlYWRlclwiKTtcblx0XHRcdGF0dHIoZGl2OSwgXCJjbGFzc1wiLCBcImp4d29yZC1jb250YWluZXIgc3ZlbHRlLTI4cjI0NVwiKTtcblx0XHRcdGF0dHIodGV4dGFyZWEsIFwiaWRcIiwgXCJ4ZFwiKTtcblx0XHRcdGF0dHIodGV4dGFyZWEsIFwibmFtZVwiLCBcInhkXCIpO1xuXHRcdFx0YXR0cih0ZXh0YXJlYSwgXCJjbGFzc1wiLCBcImp4d29yZC14ZC10ZXh0YXJlYSBzdmVsdGUtMjhyMjQ1XCIpO1xuXHRcdFx0c2V0X3N0eWxlKHRleHRhcmVhLCBcImRpc3BsYXlcIiwgLypkaXNwbGF5WGQqLyBjdHhbMTJdID8gJ2Jsb2NrJyA6ICdub25lJywgZmFsc2UpO1xuXHRcdFx0YXR0cihkaXYxMCwgXCJjbGFzc1wiLCBcImp4d29yZC1mb3JtLWNvbnRhaW5lciBzdmVsdGUtMjhyMjQ1XCIpO1xuXHRcdFx0YXR0cihtYWluLCBcImNsYXNzXCIsIFwic3ZlbHRlLTI4cjI0NVwiKTtcblx0XHR9LFxuXHRcdG0odGFyZ2V0LCBhbmNob3IpIHtcblx0XHRcdGluc2VydCh0YXJnZXQsIG1haW4sIGFuY2hvcik7XG5cdFx0XHRtb3VudF9jb21wb25lbnQoaW5zdHJ1Y3Rpb25zLCBtYWluLCBudWxsKTtcblx0XHRcdGFwcGVuZChtYWluLCB0MCk7XG5cdFx0XHRhcHBlbmQobWFpbiwgZGl2MTApO1xuXHRcdFx0YXBwZW5kKGRpdjEwLCBkaXY3KTtcblx0XHRcdGFwcGVuZChkaXY3LCBkaXYyKTtcblx0XHRcdGFwcGVuZChkaXYyLCBpbnB1dDApO1xuXHRcdFx0c2V0X2lucHV0X3ZhbHVlKGlucHV0MCwgLyp0aXRsZSovIGN0eFsyXSk7XG5cdFx0XHRhcHBlbmQoZGl2MiwgdDEpO1xuXHRcdFx0bW91bnRfY29tcG9uZW50KHNpemVzbGlkZXIsIGRpdjIsIG51bGwpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIHQyKTtcblx0XHRcdGFwcGVuZChkaXYyLCBkaXYwKTtcblx0XHRcdGFwcGVuZChkaXYwLCBsYWJlbDApO1xuXHRcdFx0YXBwZW5kKGRpdjAsIHQ0KTtcblx0XHRcdGFwcGVuZChkaXYwLCBzZWxlY3QwKTtcblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX2Jsb2Nrc18xLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdGVhY2hfYmxvY2tzXzFbaV0ubShzZWxlY3QwLCBudWxsKTtcblx0XHRcdH1cblxuXHRcdFx0c2VsZWN0X29wdGlvbihzZWxlY3QwLCAvKmRpZmZpY3VsdHkqLyBjdHhbN10pO1xuXHRcdFx0YXBwZW5kKGRpdjIsIHQ1KTtcblx0XHRcdGFwcGVuZChkaXYyLCBkaXYxKTtcblx0XHRcdGFwcGVuZChkaXYxLCBsYWJlbDEpO1xuXHRcdFx0YXBwZW5kKGRpdjEsIHQ3KTtcblx0XHRcdGFwcGVuZChkaXYxLCBzZWxlY3QxKTtcblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlYWNoX2Jsb2Nrcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRlYWNoX2Jsb2Nrc1tpXS5tKHNlbGVjdDEsIG51bGwpO1xuXHRcdFx0fVxuXG5cdFx0XHRzZWxlY3Rfb3B0aW9uKHNlbGVjdDEsIC8qdHlwZSovIGN0eFs4XSk7XG5cdFx0XHRhcHBlbmQoZGl2MiwgdDgpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIGlucHV0MSk7XG5cdFx0XHRzZXRfaW5wdXRfdmFsdWUoaW5wdXQxLCAvKmRhdGUqLyBjdHhbNl0pO1xuXHRcdFx0YXBwZW5kKGRpdjIsIHQ5KTtcblx0XHRcdGFwcGVuZChkaXYyLCBpbnB1dDIpO1xuXHRcdFx0c2V0X2lucHV0X3ZhbHVlKGlucHV0MiwgLyphdXRob3IqLyBjdHhbM10pO1xuXHRcdFx0YXBwZW5kKGRpdjIsIHQxMCk7XG5cdFx0XHRhcHBlbmQoZGl2MiwgaW5wdXQzKTtcblx0XHRcdHNldF9pbnB1dF92YWx1ZShpbnB1dDMsIC8qZWRpdG9yKi8gY3R4WzRdKTtcblx0XHRcdGFwcGVuZChkaXYyLCB0MTEpO1xuXHRcdFx0YXBwZW5kKGRpdjIsIGlucHV0NCk7XG5cdFx0XHRzZXRfaW5wdXRfdmFsdWUoaW5wdXQ0LCAvKmNvcHlyaWdodCovIGN0eFs1XSk7XG5cdFx0XHRhcHBlbmQoZGl2NywgdDEyKTtcblx0XHRcdGFwcGVuZChkaXY3LCBkaXY2KTtcblx0XHRcdGFwcGVuZChkaXY2LCBkaXYzKTtcblx0XHRcdGFwcGVuZChkaXYzLCBpbnB1dDUpO1xuXHRcdFx0aW5wdXQ1LmNoZWNrZWQgPSAvKnN5bW1ldHJ5Ki8gY3R4WzldO1xuXHRcdFx0YXBwZW5kKGRpdjMsIHQxMyk7XG5cdFx0XHRhcHBlbmQoZGl2MywgbGFiZWwyKTtcblx0XHRcdGFwcGVuZChkaXY2LCB0MTUpO1xuXHRcdFx0bW91bnRfY29tcG9uZW50KHByaW50LCBkaXY2LCBudWxsKTtcblx0XHRcdGFwcGVuZChkaXY2LCB0MTYpO1xuXHRcdFx0YXBwZW5kKGRpdjYsIGRpdjQpO1xuXHRcdFx0YXBwZW5kKGRpdjQsIGxhYmVsMyk7XG5cdFx0XHRhcHBlbmQoZGl2NCwgdDE4KTtcblx0XHRcdGFwcGVuZChkaXY0LCBpbnB1dDYpO1xuXHRcdFx0LyppbnB1dDZfYmluZGluZyovIGN0eFs0MF0oaW5wdXQ2KTtcblx0XHRcdGFwcGVuZChkaXY2LCB0MTkpO1xuXHRcdFx0YXBwZW5kKGRpdjYsIGRpdjUpO1xuXHRcdFx0YXBwZW5kKGRpdjUsIGJ1dHRvbik7XG5cdFx0XHRhcHBlbmQoZGl2MTAsIHQyMSk7XG5cdFx0XHRhcHBlbmQoZGl2MTAsIGRpdjkpO1xuXHRcdFx0YXBwZW5kKGRpdjksIGRpdjgpO1xuXHRcdFx0bW91bnRfY29tcG9uZW50KG1lbnUsIGRpdjgsIG51bGwpO1xuXHRcdFx0YXBwZW5kKGRpdjksIHQyMik7XG5cdFx0XHRtb3VudF9jb21wb25lbnQoZ3JpZF8xLCBkaXY5LCBudWxsKTtcblx0XHRcdGFwcGVuZChkaXYxMCwgdDIzKTtcblx0XHRcdGFwcGVuZChkaXYxMCwgdGV4dGFyZWEpO1xuXHRcdFx0c2V0X2lucHV0X3ZhbHVlKHRleHRhcmVhLCAvKnhkKi8gY3R4WzBdKTtcblx0XHRcdGN1cnJlbnQgPSB0cnVlO1xuXG5cdFx0XHRpZiAoIW1vdW50ZWQpIHtcblx0XHRcdFx0ZGlzcG9zZSA9IFtcblx0XHRcdFx0XHRsaXN0ZW4oaW5wdXQwLCBcImlucHV0XCIsIC8qaW5wdXQwX2lucHV0X2hhbmRsZXIqLyBjdHhbMzBdKSxcblx0XHRcdFx0XHRsaXN0ZW4oaW5wdXQwLCBcImNoYW5nZVwiLCAvKmhhbmRsZVN0YXRlQ2hhbmdlKi8gY3R4WzIzXSksXG5cdFx0XHRcdFx0bGlzdGVuKHNlbGVjdDAsIFwiY2hhbmdlXCIsIC8qc2VsZWN0MF9jaGFuZ2VfaGFuZGxlciovIGN0eFszMl0pLFxuXHRcdFx0XHRcdGxpc3RlbihzZWxlY3QwLCBcImNoYW5nZVwiLCAvKmhhbmRsZVN0YXRlQ2hhbmdlKi8gY3R4WzIzXSksXG5cdFx0XHRcdFx0bGlzdGVuKHNlbGVjdDEsIFwiY2hhbmdlXCIsIC8qc2VsZWN0MV9jaGFuZ2VfaGFuZGxlciovIGN0eFszM10pLFxuXHRcdFx0XHRcdGxpc3RlbihzZWxlY3QxLCBcImNoYW5nZVwiLCAvKmhhbmRsZVN0YXRlQ2hhbmdlKi8gY3R4WzIzXSksXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0MSwgXCJpbnB1dFwiLCAvKmlucHV0MV9pbnB1dF9oYW5kbGVyKi8gY3R4WzM0XSksXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0MSwgXCJjaGFuZ2VcIiwgLypoYW5kbGVTdGF0ZUNoYW5nZSovIGN0eFsyM10pLFxuXHRcdFx0XHRcdGxpc3RlbihpbnB1dDIsIFwiaW5wdXRcIiwgLyppbnB1dDJfaW5wdXRfaGFuZGxlciovIGN0eFszNV0pLFxuXHRcdFx0XHRcdGxpc3RlbihpbnB1dDIsIFwiY2hhbmdlXCIsIC8qaGFuZGxlU3RhdGVDaGFuZ2UqLyBjdHhbMjNdKSxcblx0XHRcdFx0XHRsaXN0ZW4oaW5wdXQzLCBcImlucHV0XCIsIC8qaW5wdXQzX2lucHV0X2hhbmRsZXIqLyBjdHhbMzZdKSxcblx0XHRcdFx0XHRsaXN0ZW4oaW5wdXQzLCBcImNoYW5nZVwiLCAvKmhhbmRsZVN0YXRlQ2hhbmdlKi8gY3R4WzIzXSksXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0NCwgXCJpbnB1dFwiLCAvKmlucHV0NF9pbnB1dF9oYW5kbGVyKi8gY3R4WzM3XSksXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0NCwgXCJjaGFuZ2VcIiwgLypoYW5kbGVTdGF0ZUNoYW5nZSovIGN0eFsyM10pLFxuXHRcdFx0XHRcdGxpc3RlbihpbnB1dDUsIFwiY2hhbmdlXCIsIC8qaW5wdXQ1X2NoYW5nZV9oYW5kbGVyKi8gY3R4WzM4XSksXG5cdFx0XHRcdFx0bGlzdGVuKGlucHV0NiwgXCJjaGFuZ2VcIiwgLypoYW5kbGVGaWxlU2VsZWN0Ki8gY3R4WzI1XSksXG5cdFx0XHRcdFx0bGlzdGVuKGJ1dHRvbiwgXCJjbGlja1wiLCAvKmRvd25sb2FkWEQqLyBjdHhbMjddKSxcblx0XHRcdFx0XHRsaXN0ZW4odGV4dGFyZWEsIFwiaW5wdXRcIiwgLyp0ZXh0YXJlYV9pbnB1dF9oYW5kbGVyKi8gY3R4WzQzXSlcblx0XHRcdFx0XTtcblxuXHRcdFx0XHRtb3VudGVkID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHAoY3R4LCBkaXJ0eSkge1xuXHRcdFx0Y29uc3QgaW5zdHJ1Y3Rpb25zX2NoYW5nZXMgPSB7fTtcblxuXHRcdFx0aWYgKCF1cGRhdGluZ192aXNpYmxlICYmIGRpcnR5WzBdICYgLyppbnN0cnVjdGlvbnNWaXNpYmxlKi8gMjYyMTQ0KSB7XG5cdFx0XHRcdHVwZGF0aW5nX3Zpc2libGUgPSB0cnVlO1xuXHRcdFx0XHRpbnN0cnVjdGlvbnNfY2hhbmdlcy52aXNpYmxlID0gLyppbnN0cnVjdGlvbnNWaXNpYmxlKi8gY3R4WzE4XTtcblx0XHRcdFx0YWRkX2ZsdXNoX2NhbGxiYWNrKCgpID0+IHVwZGF0aW5nX3Zpc2libGUgPSBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdGluc3RydWN0aW9ucy4kc2V0KGluc3RydWN0aW9uc19jaGFuZ2VzKTtcblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLyp0aXRsZSovIDQgJiYgaW5wdXQwLnZhbHVlICE9PSAvKnRpdGxlKi8gY3R4WzJdKSB7XG5cdFx0XHRcdHNldF9pbnB1dF92YWx1ZShpbnB1dDAsIC8qdGl0bGUqLyBjdHhbMl0pO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBzaXplc2xpZGVyX2NoYW5nZXMgPSB7fTtcblxuXHRcdFx0aWYgKCF1cGRhdGluZ19zaXplICYmIGRpcnR5WzBdICYgLypzaXplKi8gMzI3NjgpIHtcblx0XHRcdFx0dXBkYXRpbmdfc2l6ZSA9IHRydWU7XG5cdFx0XHRcdHNpemVzbGlkZXJfY2hhbmdlcy5zaXplID0gLypzaXplKi8gY3R4WzE1XTtcblx0XHRcdFx0YWRkX2ZsdXNoX2NhbGxiYWNrKCgpID0+IHVwZGF0aW5nX3NpemUgPSBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdHNpemVzbGlkZXIuJHNldChzaXplc2xpZGVyX2NoYW5nZXMpO1xuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmRpZmZpY3VsdGllcyovIDEwMjQpIHtcblx0XHRcdFx0ZWFjaF92YWx1ZV8xID0gLypkaWZmaWN1bHRpZXMqLyBjdHhbMTBdO1xuXHRcdFx0XHRsZXQgaTtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgZWFjaF92YWx1ZV8xLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0Y29uc3QgY2hpbGRfY3R4ID0gZ2V0X2VhY2hfY29udGV4dF8xKGN0eCwgZWFjaF92YWx1ZV8xLCBpKTtcblxuXHRcdFx0XHRcdGlmIChlYWNoX2Jsb2Nrc18xW2ldKSB7XG5cdFx0XHRcdFx0XHRlYWNoX2Jsb2Nrc18xW2ldLnAoY2hpbGRfY3R4LCBkaXJ0eSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzXzFbaV0gPSBjcmVhdGVfZWFjaF9ibG9ja18xKGNoaWxkX2N0eCk7XG5cdFx0XHRcdFx0XHRlYWNoX2Jsb2Nrc18xW2ldLmMoKTtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzXzFbaV0ubShzZWxlY3QwLCBudWxsKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmb3IgKDsgaSA8IGVhY2hfYmxvY2tzXzEubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRlYWNoX2Jsb2Nrc18xW2ldLmQoMSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRlYWNoX2Jsb2Nrc18xLmxlbmd0aCA9IGVhY2hfdmFsdWVfMS5sZW5ndGg7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qZGlmZmljdWx0eSwgZGlmZmljdWx0aWVzKi8gMTE1Mikge1xuXHRcdFx0XHRzZWxlY3Rfb3B0aW9uKHNlbGVjdDAsIC8qZGlmZmljdWx0eSovIGN0eFs3XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qdHlwZXMqLyAyMDQ4KSB7XG5cdFx0XHRcdGVhY2hfdmFsdWUgPSAvKnR5cGVzKi8gY3R4WzExXTtcblx0XHRcdFx0bGV0IGk7XG5cblx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGVhY2hfdmFsdWUubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRjb25zdCBjaGlsZF9jdHggPSBnZXRfZWFjaF9jb250ZXh0KGN0eCwgZWFjaF92YWx1ZSwgaSk7XG5cblx0XHRcdFx0XHRpZiAoZWFjaF9ibG9ja3NbaV0pIHtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldLnAoY2hpbGRfY3R4LCBkaXJ0eSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldID0gY3JlYXRlX2VhY2hfYmxvY2soY2hpbGRfY3R4KTtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldLmMoKTtcblx0XHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldLm0oc2VsZWN0MSwgbnVsbCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Zm9yICg7IGkgPCBlYWNoX2Jsb2Nrcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdGVhY2hfYmxvY2tzW2ldLmQoMSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRlYWNoX2Jsb2Nrcy5sZW5ndGggPSBlYWNoX3ZhbHVlLmxlbmd0aDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLyp0eXBlLCB0eXBlcyovIDIzMDQpIHtcblx0XHRcdFx0c2VsZWN0X29wdGlvbihzZWxlY3QxLCAvKnR5cGUqLyBjdHhbOF0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmRhdGUqLyA2NCkge1xuXHRcdFx0XHRzZXRfaW5wdXRfdmFsdWUoaW5wdXQxLCAvKmRhdGUqLyBjdHhbNl0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmF1dGhvciovIDggJiYgaW5wdXQyLnZhbHVlICE9PSAvKmF1dGhvciovIGN0eFszXSkge1xuXHRcdFx0XHRzZXRfaW5wdXRfdmFsdWUoaW5wdXQyLCAvKmF1dGhvciovIGN0eFszXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qZWRpdG9yKi8gMTYgJiYgaW5wdXQzLnZhbHVlICE9PSAvKmVkaXRvciovIGN0eFs0XSkge1xuXHRcdFx0XHRzZXRfaW5wdXRfdmFsdWUoaW5wdXQzLCAvKmVkaXRvciovIGN0eFs0XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qY29weXJpZ2h0Ki8gMzIgJiYgaW5wdXQ0LnZhbHVlICE9PSAvKmNvcHlyaWdodCovIGN0eFs1XSkge1xuXHRcdFx0XHRzZXRfaW5wdXRfdmFsdWUoaW5wdXQ0LCAvKmNvcHlyaWdodCovIGN0eFs1XSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkaXJ0eVswXSAmIC8qc3ltbWV0cnkqLyA1MTIpIHtcblx0XHRcdFx0aW5wdXQ1LmNoZWNrZWQgPSAvKnN5bW1ldHJ5Ki8gY3R4WzldO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBwcmludF9jaGFuZ2VzID0ge307XG5cblx0XHRcdGlmICghdXBkYXRpbmdfc3RhdGUgJiYgZGlydHlbMF0gJiAvKnN0YXRlKi8gNjU1MzYpIHtcblx0XHRcdFx0dXBkYXRpbmdfc3RhdGUgPSB0cnVlO1xuXHRcdFx0XHRwcmludF9jaGFuZ2VzLnN0YXRlID0gLypzdGF0ZSovIGN0eFsxNl07XG5cdFx0XHRcdGFkZF9mbHVzaF9jYWxsYmFjaygoKSA9PiB1cGRhdGluZ19zdGF0ZSA9IGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdFx0cHJpbnQuJHNldChwcmludF9jaGFuZ2VzKTtcblx0XHRcdGNvbnN0IGdyaWRfMV9jaGFuZ2VzID0ge307XG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKnNpemUqLyAzMjc2OCkgZ3JpZF8xX2NoYW5nZXMuc2l6ZSA9IC8qc2l6ZSovIGN0eFsxNV07XG5cdFx0XHRpZiAoZGlydHlbMF0gJiAvKmdyaWQqLyAyKSBncmlkXzFfY2hhbmdlcy5ncmlkID0gLypncmlkKi8gY3R4WzFdO1xuXG5cdFx0XHRpZiAoIXVwZGF0aW5nX0NvbnRhaW5lciAmJiBkaXJ0eVswXSAmIC8qZ3JpZENvbXBvbmVudENvbnRhaW5lciovIDE2Mzg0KSB7XG5cdFx0XHRcdHVwZGF0aW5nX0NvbnRhaW5lciA9IHRydWU7XG5cdFx0XHRcdGdyaWRfMV9jaGFuZ2VzLkNvbnRhaW5lciA9IC8qZ3JpZENvbXBvbmVudENvbnRhaW5lciovIGN0eFsxNF07XG5cdFx0XHRcdGFkZF9mbHVzaF9jYWxsYmFjaygoKSA9PiB1cGRhdGluZ19Db250YWluZXIgPSBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdGdyaWRfMS4kc2V0KGdyaWRfMV9jaGFuZ2VzKTtcblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLyp4ZCovIDEpIHtcblx0XHRcdFx0c2V0X2lucHV0X3ZhbHVlKHRleHRhcmVhLCAvKnhkKi8gY3R4WzBdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRpcnR5WzBdICYgLypkaXNwbGF5WGQqLyA0MDk2KSB7XG5cdFx0XHRcdHNldF9zdHlsZSh0ZXh0YXJlYSwgXCJkaXNwbGF5XCIsIC8qZGlzcGxheVhkKi8gY3R4WzEyXSA/ICdibG9jaycgOiAnbm9uZScsIGZhbHNlKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGkobG9jYWwpIHtcblx0XHRcdGlmIChjdXJyZW50KSByZXR1cm47XG5cdFx0XHR0cmFuc2l0aW9uX2luKGluc3RydWN0aW9ucy4kJC5mcmFnbWVudCwgbG9jYWwpO1xuXHRcdFx0dHJhbnNpdGlvbl9pbihzaXplc2xpZGVyLiQkLmZyYWdtZW50LCBsb2NhbCk7XG5cdFx0XHR0cmFuc2l0aW9uX2luKHByaW50LiQkLmZyYWdtZW50LCBsb2NhbCk7XG5cdFx0XHR0cmFuc2l0aW9uX2luKG1lbnUuJCQuZnJhZ21lbnQsIGxvY2FsKTtcblx0XHRcdHRyYW5zaXRpb25faW4oZ3JpZF8xLiQkLmZyYWdtZW50LCBsb2NhbCk7XG5cdFx0XHRjdXJyZW50ID0gdHJ1ZTtcblx0XHR9LFxuXHRcdG8obG9jYWwpIHtcblx0XHRcdHRyYW5zaXRpb25fb3V0KGluc3RydWN0aW9ucy4kJC5mcmFnbWVudCwgbG9jYWwpO1xuXHRcdFx0dHJhbnNpdGlvbl9vdXQoc2l6ZXNsaWRlci4kJC5mcmFnbWVudCwgbG9jYWwpO1xuXHRcdFx0dHJhbnNpdGlvbl9vdXQocHJpbnQuJCQuZnJhZ21lbnQsIGxvY2FsKTtcblx0XHRcdHRyYW5zaXRpb25fb3V0KG1lbnUuJCQuZnJhZ21lbnQsIGxvY2FsKTtcblx0XHRcdHRyYW5zaXRpb25fb3V0KGdyaWRfMS4kJC5mcmFnbWVudCwgbG9jYWwpO1xuXHRcdFx0Y3VycmVudCA9IGZhbHNlO1xuXHRcdH0sXG5cdFx0ZChkZXRhY2hpbmcpIHtcblx0XHRcdGlmIChkZXRhY2hpbmcpIGRldGFjaChtYWluKTtcblx0XHRcdGRlc3Ryb3lfY29tcG9uZW50KGluc3RydWN0aW9ucyk7XG5cdFx0XHRkZXN0cm95X2NvbXBvbmVudChzaXplc2xpZGVyKTtcblx0XHRcdGRlc3Ryb3lfZWFjaChlYWNoX2Jsb2Nrc18xLCBkZXRhY2hpbmcpO1xuXHRcdFx0ZGVzdHJveV9lYWNoKGVhY2hfYmxvY2tzLCBkZXRhY2hpbmcpO1xuXHRcdFx0ZGVzdHJveV9jb21wb25lbnQocHJpbnQpO1xuXHRcdFx0LyppbnB1dDZfYmluZGluZyovIGN0eFs0MF0obnVsbCk7XG5cdFx0XHRkZXN0cm95X2NvbXBvbmVudChtZW51KTtcblx0XHRcdC8qZ3JpZF8xX2JpbmRpbmcqLyBjdHhbNDFdKG51bGwpO1xuXHRcdFx0ZGVzdHJveV9jb21wb25lbnQoZ3JpZF8xKTtcblx0XHRcdG1vdW50ZWQgPSBmYWxzZTtcblx0XHRcdHJ1bl9hbGwoZGlzcG9zZSk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBpbnN0YW5jZSgkJHNlbGYsICQkcHJvcHMsICQkaW52YWxpZGF0ZSkge1xuXHRsZXQgJHF1ZXN0aW9uc0Rvd247XG5cdGxldCAkcXVlc3Rpb25zQWNyb3NzO1xuXHRsZXQgJGN1cnJlbnREaXJlY3Rpb247XG5cdGNvbXBvbmVudF9zdWJzY3JpYmUoJCRzZWxmLCBxdWVzdGlvbnNEb3duLCAkJHZhbHVlID0+ICQkaW52YWxpZGF0ZSg0NCwgJHF1ZXN0aW9uc0Rvd24gPSAkJHZhbHVlKSk7XG5cdGNvbXBvbmVudF9zdWJzY3JpYmUoJCRzZWxmLCBxdWVzdGlvbnNBY3Jvc3MsICQkdmFsdWUgPT4gJCRpbnZhbGlkYXRlKDQ1LCAkcXVlc3Rpb25zQWNyb3NzID0gJCR2YWx1ZSkpO1xuXHRjb21wb25lbnRfc3Vic2NyaWJlKCQkc2VsZiwgY3VycmVudERpcmVjdGlvbiwgJCR2YWx1ZSA9PiAkJGludmFsaWRhdGUoNDYsICRjdXJyZW50RGlyZWN0aW9uID0gJCR2YWx1ZSkpO1xuXHRsZXQgeyBkaWZmaWN1bHRpZXMgPSBbXCJFYXN5XCIsIFwiTWVkaXVtXCIsIFwiSGFyZFwiLCBcIkV2aWxcIl0gfSA9ICQkcHJvcHM7XG5cdGxldCB7IHR5cGVzID0gW1wiU3RyYWlnaHRcIiwgXCJRdWlja1wiLCBcIkNyeXB0aWNcIl0gfSA9ICQkcHJvcHM7XG5cdGNvbnN0IHNhdmVfc3RhdGUgPSB0cnVlO1xuXHRsZXQgeyB4ZCB9ID0gJCRwcm9wcztcblx0bGV0IHsgZ3JpZCA9IFsuLi5BcnJheSgxNSldLm1hcChlID0+IEFycmF5KDE1KSkgfSA9ICQkcHJvcHM7XG5cdGxldCB7IHRpdGxlIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBhdXRob3IgfSA9ICQkcHJvcHM7XG5cdGxldCB7IGVkaXRvciB9ID0gJCRwcm9wcztcblx0bGV0IHsgY29weXJpZ2h0IH0gPSAkJHByb3BzO1xuXHRsZXQgeyBkYXRlIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBkaWZmaWN1bHR5IH0gPSAkJHByb3BzO1xuXHRsZXQgeyB0eXBlIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBkaXNwbGF5WGQgPSB0cnVlIH0gPSAkJHByb3BzO1xuXHRsZXQgeyBzeW1tZXRyeSA9IHRydWUgfSA9ICQkcHJvcHM7XG5cblx0Ly8gUHJpdmF0ZSBwcm9wZXJ0aWVzXG5cdC8vIGxldCBzeW1tZXRyeV9pZCA9ICRzeW1tZXRyaWVzLmZpbmRJbmRleChzID0+IHMuZGVmYXVsdCk7XG5cdC8vIFN0YXRlXG5cdGxldCBncmlkQ29tcG9uZW50O1xuXG5cdGxldCBncmlkQ29tcG9uZW50Q29udGFpbmVyO1xuXHRsZXQgc2l6ZSA9IGdyaWQubGVuZ3RoO1xuXG5cdGxldCBzdGF0ZSA9IHtcblx0XHRncmlkLFxuXHRcdHNpemUsXG5cdFx0Y3VycmVudF94OiAwLFxuXHRcdGN1cnJlbnRfeTogMCxcblx0XHRkaXJlY3Rpb246IFwiYWNyb3NzXCIsXG5cdFx0cXVlc3Rpb25zX2Fjcm9zczogJHF1ZXN0aW9uc0Fjcm9zcyxcblx0XHRxdWVzdGlvbnNfZG93bjogJHF1ZXN0aW9uc0Rvd25cblx0fTsgLy8gc3ltbWV0cnlfaWQsXG5cblx0bGV0IGdldFN0YXRlID0gKCkgPT4ge1xuXHRcdGlmICghZ3JpZENvbXBvbmVudCkgcmV0dXJuOyAvLyBXZSBoYXZlbid0IGxvYWRlZCB0aGUgZ3JpZCB5ZXRcblx0XHRsZXQgeyB4OiBjdXJyZW50X3gsIHk6IGN1cnJlbnRfeSB9ID0gZ3JpZENvbXBvbmVudC5nZXRDdXJyZW50UG9zKCk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Z3JpZCxcblx0XHRcdHNpemUsXG5cdFx0XHRjdXJyZW50X3gsXG5cdFx0XHRjdXJyZW50X3ksXG5cdFx0XHRkaXJlY3Rpb246ICRjdXJyZW50RGlyZWN0aW9uLFxuXHRcdFx0cXVlc3Rpb25zX2Fjcm9zczogJHF1ZXN0aW9uc0Fjcm9zcyxcblx0XHRcdHF1ZXN0aW9uc19kb3duOiAkcXVlc3Rpb25zRG93bixcblx0XHRcdHRpdGxlLFxuXHRcdFx0YXV0aG9yLFxuXHRcdFx0ZWRpdG9yLFxuXHRcdFx0Y29weXJpZ2h0LFxuXHRcdFx0ZGlmZmljdWx0eSxcblx0XHRcdHR5cGUsXG5cdFx0XHRkYXRlXG5cdFx0fTsgLy8gc3ltbWV0cnlfaWQsXG5cdH07XG5cblx0ZnVuY3Rpb24gaGFuZGxlTW92ZShldmVudCkge1xuXHRcdGNvbnN0IGRpcmVjdGlvbiA9IGV2ZW50LmRldGFpbDtcblx0XHRsZXQgbmV3RGlyO1xuXG5cdFx0aWYgKGRpcmVjdGlvbiA9PT0gXCJkb3duXCIgfHwgZGlyZWN0aW9uID09PSBcInVwXCIpIHtcblx0XHRcdG5ld0RpciA9IFwiZG93blwiO1xuXHRcdH1cblxuXHRcdGlmIChkaXJlY3Rpb24gPT09IFwibGVmdFwiIHx8IGRpcmVjdGlvbiA9PT0gXCJyaWdodFwiKSB7XG5cdFx0XHRuZXdEaXIgPSBcImFjcm9zc1wiO1xuXHRcdH1cblxuXHRcdGlmIChuZXdEaXIgIT09ICRjdXJyZW50RGlyZWN0aW9uKSB7XG5cdFx0XHRncmlkQ29tcG9uZW50LnNldERpcihuZXdEaXIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRncmlkQ29tcG9uZW50LmhhbmRsZU1vdmUoZGlyZWN0aW9uKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVMZXR0ZXIoZXZlbnQpIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGNvbnN0IGxldHRlciA9IGV2ZW50LmRldGFpbDtcblxuXHRcdGlmIChsZXR0ZXIgPT09IFwiIFwiKSB7XG5cdFx0XHRncmlkQ29tcG9uZW50LnRvZ2dsZURpcigpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGxldCB7IHgsIHkgfSA9IGdyaWRDb21wb25lbnQuZ2V0Q3VycmVudFBvcygpO1xuXHRcdCQkaW52YWxpZGF0ZSgxLCBncmlkW3ldW3hdID0gbGV0dGVyLCBncmlkKTtcblxuXHRcdGlmIChzeW1tZXRyeSkge1xuXHRcdFx0aWYgKGxldHRlciA9PT0gXCIjXCIpIHtcblx0XHRcdFx0JCRpbnZhbGlkYXRlKDEsIGdyaWRbc2l6ZSAtIHkgLSAxXVtzaXplIC0geCAtIDFdID0gXCIjXCIsIGdyaWQpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICgkY3VycmVudERpcmVjdGlvbiA9PT0gXCJhY3Jvc3NcIikge1xuXHRcdFx0Z3JpZENvbXBvbmVudC5tb3ZlUmlnaHQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Z3JpZENvbXBvbmVudC5tb3ZlRG93bigpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZUVudGVyKGV2ZW50KSB7XG5cdFx0bGV0IHsgeCwgeSB9ID0gZ3JpZENvbXBvbmVudC5nZXRDdXJyZW50UG9zKCk7XG5cdFx0bGV0IHNlbGVjdGVkX3F1ZXN0aW9uO1xuXG5cdFx0bGV0IHF1ZXN0aW9ucyA9ICRjdXJyZW50RGlyZWN0aW9uID09PSBcImFjcm9zc1wiXG5cdFx0PyAkcXVlc3Rpb25zQWNyb3NzXG5cdFx0OiAkcXVlc3Rpb25zRG93bjtcblxuXHRcdGlmICgkY3VycmVudERpcmVjdGlvbiA9PT0gXCJhY3Jvc3NcIikge1xuXHRcdFx0c2VsZWN0ZWRfcXVlc3Rpb24gPSBxdWVzdGlvbnMuZmluZChxID0+IHkgPT09IHEueSAmJiB4ID49IHEueCAmJiB4IDw9IHEueCArIHEuYW5zd2VyLmxlbmd0aCAtIDEpO1xuXG5cdFx0XHRpZiAoc2VsZWN0ZWRfcXVlc3Rpb24pIHtcblx0XHRcdFx0c2VsZWN0ZWRfcXVlc3Rpb24uZWRpdGluZyA9IHRydWU7XG5cdFx0XHRcdHNldF9zdG9yZV92YWx1ZShxdWVzdGlvbnNBY3Jvc3MsICRxdWVzdGlvbnNBY3Jvc3MgPSBxdWVzdGlvbnMsICRxdWVzdGlvbnNBY3Jvc3MpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZWxlY3RlZF9xdWVzdGlvbiA9IHF1ZXN0aW9ucy5maW5kKHEgPT4geCA9PT0gcS54ICYmIHkgPj0gcS55ICYmIHkgPD0gcS55ICsgcS5hbnN3ZXIubGVuZ3RoIC0gMSk7XG5cblx0XHRcdGlmIChzZWxlY3RlZF9xdWVzdGlvbikge1xuXHRcdFx0XHRzZWxlY3RlZF9xdWVzdGlvbi5lZGl0aW5nID0gdHJ1ZTtcblx0XHRcdFx0c2V0X3N0b3JlX3ZhbHVlKHF1ZXN0aW9uc0Rvd24sICRxdWVzdGlvbnNEb3duID0gcXVlc3Rpb25zLCAkcXVlc3Rpb25zRG93bik7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlQmFja3NwYWNlKGV2ZW50KSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRsZXQgeyB4LCB5IH0gPSBncmlkQ29tcG9uZW50LmdldEN1cnJlbnRQb3MoKTtcblx0XHRjb25zdCBsZXR0ZXIgPSBncmlkW3ldW3hdO1xuXG5cdFx0aWYgKHN5bW1ldHJ5ICYmIGxldHRlciA9PT0gXCIjXCIpIHtcblx0XHRcdCQkaW52YWxpZGF0ZSgxLCBncmlkW3NpemUgLSB5IC0gMV1bc2l6ZSAtIHggLSAxXSA9IFwiXCIsIGdyaWQpO1xuXHRcdH1cblxuXHRcdCQkaW52YWxpZGF0ZSgxLCBncmlkW3ldW3hdID0gXCJcIiwgZ3JpZCk7XG5cblx0XHRpZiAoJGN1cnJlbnREaXJlY3Rpb24gPT09IFwiYWNyb3NzXCIpIHtcblx0XHRcdGdyaWRDb21wb25lbnQubW92ZUxlZnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Z3JpZENvbXBvbmVudC5tb3ZlVXAoKTtcblx0XHR9XG5cdH1cblxuXHRhc3luYyBmdW5jdGlvbiBoYW5kbGVTdGF0ZUNoYW5nZSgpIHtcblx0XHRzYXZlU3RhdGUoZ2V0U3RhdGUoKSk7XG5cdFx0JCRpbnZhbGlkYXRlKDAsIHhkID0gWERFbmNvZGUoZ2V0U3RhdGUoKSkpO1xuXHR9XG5cblx0b25Nb3VudCgoKSA9PiB7XG5cdFx0aWYgKHhkKSB7XG5cdFx0XHRsb2FkWGQoeGQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR7XG5cdFx0XHRcdCQkaW52YWxpZGF0ZSgxNiwgc3RhdGUgPSByZXN0b3JlU3RhdGUoKSB8fCBzdGF0ZSk7XG5cdFx0XHR9XG5cblx0XHRcdCQkaW52YWxpZGF0ZSgxLCBncmlkID0gc3RhdGUuZ3JpZCk7XG5cdFx0XHQkJGludmFsaWRhdGUoMTUsIHNpemUgPSBzdGF0ZS5zaXplKTtcblx0XHRcdCQkaW52YWxpZGF0ZSgzLCBhdXRob3IgPSBzdGF0ZS5hdXRob3IpO1xuXHRcdFx0JCRpbnZhbGlkYXRlKDQsIGVkaXRvciA9IHN0YXRlLmVkaXRvcik7XG5cdFx0XHQkJGludmFsaWRhdGUoNSwgY29weXJpZ2h0ID0gc3RhdGUuY29weXJpZ2h0KTtcblx0XHRcdCQkaW52YWxpZGF0ZSg2LCBkYXRlID0gc3RhdGUuZGF0ZSk7XG5cdFx0XHQkJGludmFsaWRhdGUoMiwgdGl0bGUgPSBzdGF0ZS50aXRsZSk7XG5cdFx0XHQkJGludmFsaWRhdGUoNywgZGlmZmljdWx0eSA9IHN0YXRlLmRpZmZpY3VsdHkpO1xuXHRcdFx0JCRpbnZhbGlkYXRlKDgsIHR5cGUgPSBzdGF0ZS50eXBlKTtcblx0XHRcdHF1ZXN0aW9uc0Fjcm9zcy5zZXQoc3RhdGUucXVlc3Rpb25zX2Fjcm9zcyk7XG5cdFx0XHRxdWVzdGlvbnNEb3duLnNldChzdGF0ZS5xdWVzdGlvbnNfZG93bik7XG5cdFx0XHRncmlkQ29tcG9uZW50LnNldERpcihzdGF0ZS5kaXJlY3Rpb24pO1xuXHRcdFx0Z3JpZENvbXBvbmVudC5zZXRDdXJyZW50UG9zKHN0YXRlLmN1cnJlbnRfeCwgc3RhdGUuY3VycmVudF95KTtcblx0XHR9IC8vIHN5bW1ldHJ5X2lkID0gc3RhdGUuc3ltbWV0cnlfaWQ7XG5cdH0pO1xuXG5cdGZ1bmN0aW9uIGhhbmRsZVJlc2V0KCkge1xuXHRcdGNsZWFyU3RhdGUoKTtcblx0XHQkJGludmFsaWRhdGUoMTUsIHNpemUgPSAxNSk7XG5cdFx0Z3JpZENvbXBvbmVudC5zZXREaXIoXCJhY3Jvc3NcIik7XG5cdFx0Z3JpZENvbXBvbmVudC5zZXRDdXJyZW50UG9zKDAsIDApO1xuXHRcdCQkaW52YWxpZGF0ZSgyLCB0aXRsZSA9IFwiXCIpO1xuXHRcdCQkaW52YWxpZGF0ZSgzLCBhdXRob3IgPSBcIlwiKTtcblx0XHQkJGludmFsaWRhdGUoNCwgZWRpdG9yID0gXCJcIik7XG5cdFx0JCRpbnZhbGlkYXRlKDUsIGNvcHlyaWdodCA9IFwiXCIpO1xuXHRcdCQkaW52YWxpZGF0ZSg2LCBkYXRlID0gXCJcIik7XG5cdFx0JCRpbnZhbGlkYXRlKDcsIGRpZmZpY3VsdHkgPSBcIk1lZGl1bVwiKTtcblx0XHQkJGludmFsaWRhdGUoOCwgdHlwZSA9IFwiU3RyYWlnaHRcIik7XG5cdFx0JCRpbnZhbGlkYXRlKDEsIGdyaWQgPSBbLi4uQXJyYXkoMTUpXS5tYXAoZSA9PiBBcnJheSgxNSkpKTtcblx0XHRxdWVzdGlvbnNBY3Jvc3Muc2V0KFtdKTtcblx0XHRjbGVhclN0YXRlKCk7XG5cdFx0cXVlc3Rpb25zRG93bi5zZXQoW10pO1xuXHRcdGNsZWFyU3RhdGUoKTtcblx0XHQkJGludmFsaWRhdGUoMCwgeGQgPSBcIlwiKTtcblx0XHRjbGVhclN0YXRlKCk7XG5cdH1cblxuXHRhc3luYyBmdW5jdGlvbiBsb2FkWGQoeGQpIHtcblx0XHRjb25zdCBkYXRhID0geGRDcm9zc3dvcmRQYXJzZXIoeGQpO1xuXHRcdCQkaW52YWxpZGF0ZSgxLCBncmlkID0gZGF0YS5ncmlkKTtcblx0XHQkJGludmFsaWRhdGUoMTUsIHNpemUgPSBkYXRhLmdyaWQubGVuZ3RoKTtcblx0XHQkJGludmFsaWRhdGUoMywgYXV0aG9yID0gZGF0YS5tZXRhLkF1dGhvcik7XG5cdFx0JCRpbnZhbGlkYXRlKDQsIGVkaXRvciA9IGRhdGEubWV0YS5FZGl0b3IpO1xuXHRcdCQkaW52YWxpZGF0ZSg1LCBjb3B5cmlnaHQgPSBkYXRhLm1ldGEuQ29weXJpZ2h0KTtcblx0XHQkJGludmFsaWRhdGUoNiwgZGF0ZSA9IGRhdGEubWV0YS5EYXRlKTtcblx0XHQkJGludmFsaWRhdGUoMiwgdGl0bGUgPSBkYXRhLm1ldGEuVGl0bGUpO1xuXHRcdCQkaW52YWxpZGF0ZSg3LCBkaWZmaWN1bHR5ID0gZGF0YS5tZXRhLkRpZmZpY3VsdHkpO1xuXHRcdCQkaW52YWxpZGF0ZSg4LCB0eXBlID0gZGF0YS5tZXRhLlR5cGUpO1xuXHRcdGdyaWRDb21wb25lbnQuc2V0RGlyKFwiYWNyb3NzXCIpO1xuXHRcdGdyaWRDb21wb25lbnQuc2V0Q3VycmVudFBvcygwLCAwKTtcblx0XHRhd2FpdCB0aWNrKCk7XG5cdFx0bGV0IHF1ZXN0aW9uc19hY3Jvc3MgPSAkcXVlc3Rpb25zQWNyb3NzO1xuXG5cdFx0Zm9yIChsZXQgcXVlc3Rpb24gb2YgcXVlc3Rpb25zX2Fjcm9zcykge1xuXHRcdFx0bGV0IG1hdGNoaW5nX3F1ZXN0aW9uID0gZGF0YS5hY3Jvc3MuZmluZChxID0+IHEubnVtID09PSBgQSR7cXVlc3Rpb24ubnVtfWApO1xuXG5cdFx0XHQvLyBjb25zb2xlLmxvZyhtYXRjaGluZ19xdWVzdGlvbik7XG5cdFx0XHRpZiAobWF0Y2hpbmdfcXVlc3Rpb24pIHtcblx0XHRcdFx0cXVlc3Rpb24ucXVlc3Rpb24gPSBtYXRjaGluZ19xdWVzdGlvbi5xdWVzdGlvbjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRxdWVzdGlvbnNBY3Jvc3Muc2V0KHF1ZXN0aW9uc19hY3Jvc3MpO1xuXHRcdGxldCBxdWVzdGlvbnNfZG93biA9ICRxdWVzdGlvbnNEb3duO1xuXG5cdFx0Zm9yIChsZXQgcXVlc3Rpb24gb2YgcXVlc3Rpb25zX2Rvd24pIHtcblx0XHRcdGxldCBtYXRjaGluZ19xdWVzdGlvbiA9IGRhdGEuZG93bi5maW5kKHEgPT4gcS5udW0gPT09IGBEJHtxdWVzdGlvbi5udW19YCk7XG5cblx0XHRcdC8vIGNvbnNvbGUubG9nKG1hdGNoaW5nX3F1ZXN0aW9uKTtcblx0XHRcdGlmIChtYXRjaGluZ19xdWVzdGlvbikge1xuXHRcdFx0XHRxdWVzdGlvbi5xdWVzdGlvbiA9IG1hdGNoaW5nX3F1ZXN0aW9uLnF1ZXN0aW9uO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHF1ZXN0aW9uc0Rvd24uc2V0KHF1ZXN0aW9uc19kb3duKTtcblx0XHRoYW5kbGVTdGF0ZUNoYW5nZSgpO1xuXHR9XG5cblx0bGV0IGZpbGVJbnB1dDtcblxuXHRmdW5jdGlvbiBoYW5kbGVGaWxlU2VsZWN0KCkge1xuXHRcdGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cblx0XHRyZWFkZXIub25sb2FkID0gKGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBhc3luYyBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGF3YWl0IGxvYWRYZChlLnRhcmdldC5yZXN1bHQpO1xuXHRcdFx0XHR9IGNhdGNoKGVycikge1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyKTtcblx0XHRcdFx0XHR0aHJvdyBcIlVuYWJsZSB0byBwYXJzZSBmaWxlXCI7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fSkoZmlsZUlucHV0LmZpbGVzWzBdKTtcblxuXHRcdC8vIFJlYWQgaW4gdGhlIGltYWdlIGZpbGUgYXMgYSBkYXRhIFVSTC5cblx0XHRyZWFkZXIucmVhZEFzVGV4dChmaWxlSW5wdXQuZmlsZXNbMF0pO1xuXHR9XG5cblx0bGV0IGluc3RydWN0aW9uc1Zpc2libGU7XG5cblx0ZnVuY3Rpb24gaGFuZGxlSW5zdHJ1Y3Rpb25zKCkge1xuXHRcdCQkaW52YWxpZGF0ZSgxOCwgaW5zdHJ1Y3Rpb25zVmlzaWJsZSA9IHRydWUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZG93bmxvYWRYRCgpIHtcblx0XHQvLyBEb3dubG9hZCBjb250ZW50cyBvZiB4ZFxuXHRcdGNvbnN0IGZpbGUgPSBuZXcgQmxvYihbeGRdLCB7IHR5cGU6IFwidGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04XCIgfSk7XG5cblx0XHRjb25zdCBkb3dubG9hZExpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcblx0XHRkb3dubG9hZExpbmsuZG93bmxvYWQgPSBcImNyb3Nzd29yZC54ZFwiO1xuXHRcdGRvd25sb2FkTGluay5ocmVmID0gVVJMLmNyZWF0ZU9iamVjdFVSTChmaWxlKTtcblx0XHRkb3dubG9hZExpbmsuY2xpY2soKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGluc3RydWN0aW9uc192aXNpYmxlX2JpbmRpbmcodmFsdWUpIHtcblx0XHRpbnN0cnVjdGlvbnNWaXNpYmxlID0gdmFsdWU7XG5cdFx0JCRpbnZhbGlkYXRlKDE4LCBpbnN0cnVjdGlvbnNWaXNpYmxlKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlucHV0MF9pbnB1dF9oYW5kbGVyKCkge1xuXHRcdHRpdGxlID0gdGhpcy52YWx1ZTtcblx0XHQkJGludmFsaWRhdGUoMiwgdGl0bGUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gc2l6ZXNsaWRlcl9zaXplX2JpbmRpbmcodmFsdWUpIHtcblx0XHRzaXplID0gdmFsdWU7XG5cdFx0JCRpbnZhbGlkYXRlKDE1LCBzaXplKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHNlbGVjdDBfY2hhbmdlX2hhbmRsZXIoKSB7XG5cdFx0ZGlmZmljdWx0eSA9IHNlbGVjdF92YWx1ZSh0aGlzKTtcblx0XHQkJGludmFsaWRhdGUoNywgZGlmZmljdWx0eSk7XG5cdFx0JCRpbnZhbGlkYXRlKDEwLCBkaWZmaWN1bHRpZXMpO1xuXHR9XG5cblx0ZnVuY3Rpb24gc2VsZWN0MV9jaGFuZ2VfaGFuZGxlcigpIHtcblx0XHR0eXBlID0gc2VsZWN0X3ZhbHVlKHRoaXMpO1xuXHRcdCQkaW52YWxpZGF0ZSg4LCB0eXBlKTtcblx0XHQkJGludmFsaWRhdGUoMTEsIHR5cGVzKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlucHV0MV9pbnB1dF9oYW5kbGVyKCkge1xuXHRcdGRhdGUgPSB0aGlzLnZhbHVlO1xuXHRcdCQkaW52YWxpZGF0ZSg2LCBkYXRlKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlucHV0Ml9pbnB1dF9oYW5kbGVyKCkge1xuXHRcdGF1dGhvciA9IHRoaXMudmFsdWU7XG5cdFx0JCRpbnZhbGlkYXRlKDMsIGF1dGhvcik7XG5cdH1cblxuXHRmdW5jdGlvbiBpbnB1dDNfaW5wdXRfaGFuZGxlcigpIHtcblx0XHRlZGl0b3IgPSB0aGlzLnZhbHVlO1xuXHRcdCQkaW52YWxpZGF0ZSg0LCBlZGl0b3IpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5wdXQ0X2lucHV0X2hhbmRsZXIoKSB7XG5cdFx0Y29weXJpZ2h0ID0gdGhpcy52YWx1ZTtcblx0XHQkJGludmFsaWRhdGUoNSwgY29weXJpZ2h0KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlucHV0NV9jaGFuZ2VfaGFuZGxlcigpIHtcblx0XHRzeW1tZXRyeSA9IHRoaXMuY2hlY2tlZDtcblx0XHQkJGludmFsaWRhdGUoOSwgc3ltbWV0cnkpO1xuXHR9XG5cblx0ZnVuY3Rpb24gcHJpbnRfc3RhdGVfYmluZGluZyh2YWx1ZSkge1xuXHRcdHN0YXRlID0gdmFsdWU7XG5cdFx0JCRpbnZhbGlkYXRlKDE2LCBzdGF0ZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBpbnB1dDZfYmluZGluZygkJHZhbHVlKSB7XG5cdFx0YmluZGluZ19jYWxsYmFja3NbJCR2YWx1ZSA/ICd1bnNoaWZ0JyA6ICdwdXNoJ10oKCkgPT4ge1xuXHRcdFx0ZmlsZUlucHV0ID0gJCR2YWx1ZTtcblx0XHRcdCQkaW52YWxpZGF0ZSgxNywgZmlsZUlucHV0KTtcblx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdyaWRfMV9iaW5kaW5nKCQkdmFsdWUpIHtcblx0XHRiaW5kaW5nX2NhbGxiYWNrc1skJHZhbHVlID8gJ3Vuc2hpZnQnIDogJ3B1c2gnXSgoKSA9PiB7XG5cdFx0XHRncmlkQ29tcG9uZW50ID0gJCR2YWx1ZTtcblx0XHRcdCQkaW52YWxpZGF0ZSgxMywgZ3JpZENvbXBvbmVudCk7XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiBncmlkXzFfQ29udGFpbmVyX2JpbmRpbmcodmFsdWUpIHtcblx0XHRncmlkQ29tcG9uZW50Q29udGFpbmVyID0gdmFsdWU7XG5cdFx0JCRpbnZhbGlkYXRlKDE0LCBncmlkQ29tcG9uZW50Q29udGFpbmVyKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHRleHRhcmVhX2lucHV0X2hhbmRsZXIoKSB7XG5cdFx0eGQgPSB0aGlzLnZhbHVlO1xuXHRcdCQkaW52YWxpZGF0ZSgwLCB4ZCk7XG5cdH1cblxuXHQkJHNlbGYuJCRzZXQgPSAkJHByb3BzID0+IHtcblx0XHRpZiAoJ2RpZmZpY3VsdGllcycgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDEwLCBkaWZmaWN1bHRpZXMgPSAkJHByb3BzLmRpZmZpY3VsdGllcyk7XG5cdFx0aWYgKCd0eXBlcycgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDExLCB0eXBlcyA9ICQkcHJvcHMudHlwZXMpO1xuXHRcdGlmICgneGQnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSgwLCB4ZCA9ICQkcHJvcHMueGQpO1xuXHRcdGlmICgnZ3JpZCcgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDEsIGdyaWQgPSAkJHByb3BzLmdyaWQpO1xuXHRcdGlmICgndGl0bGUnIGluICQkcHJvcHMpICQkaW52YWxpZGF0ZSgyLCB0aXRsZSA9ICQkcHJvcHMudGl0bGUpO1xuXHRcdGlmICgnYXV0aG9yJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoMywgYXV0aG9yID0gJCRwcm9wcy5hdXRob3IpO1xuXHRcdGlmICgnZWRpdG9yJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoNCwgZWRpdG9yID0gJCRwcm9wcy5lZGl0b3IpO1xuXHRcdGlmICgnY29weXJpZ2h0JyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoNSwgY29weXJpZ2h0ID0gJCRwcm9wcy5jb3B5cmlnaHQpO1xuXHRcdGlmICgnZGF0ZScgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDYsIGRhdGUgPSAkJHByb3BzLmRhdGUpO1xuXHRcdGlmICgnZGlmZmljdWx0eScgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDcsIGRpZmZpY3VsdHkgPSAkJHByb3BzLmRpZmZpY3VsdHkpO1xuXHRcdGlmICgndHlwZScgaW4gJCRwcm9wcykgJCRpbnZhbGlkYXRlKDgsIHR5cGUgPSAkJHByb3BzLnR5cGUpO1xuXHRcdGlmICgnZGlzcGxheVhkJyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoMTIsIGRpc3BsYXlYZCA9ICQkcHJvcHMuZGlzcGxheVhkKTtcblx0XHRpZiAoJ3N5bW1ldHJ5JyBpbiAkJHByb3BzKSAkJGludmFsaWRhdGUoOSwgc3ltbWV0cnkgPSAkJHByb3BzLnN5bW1ldHJ5KTtcblx0fTtcblxuXHRyZXR1cm4gW1xuXHRcdHhkLFxuXHRcdGdyaWQsXG5cdFx0dGl0bGUsXG5cdFx0YXV0aG9yLFxuXHRcdGVkaXRvcixcblx0XHRjb3B5cmlnaHQsXG5cdFx0ZGF0ZSxcblx0XHRkaWZmaWN1bHR5LFxuXHRcdHR5cGUsXG5cdFx0c3ltbWV0cnksXG5cdFx0ZGlmZmljdWx0aWVzLFxuXHRcdHR5cGVzLFxuXHRcdGRpc3BsYXlYZCxcblx0XHRncmlkQ29tcG9uZW50LFxuXHRcdGdyaWRDb21wb25lbnRDb250YWluZXIsXG5cdFx0c2l6ZSxcblx0XHRzdGF0ZSxcblx0XHRmaWxlSW5wdXQsXG5cdFx0aW5zdHJ1Y3Rpb25zVmlzaWJsZSxcblx0XHRoYW5kbGVNb3ZlLFxuXHRcdGhhbmRsZUxldHRlcixcblx0XHRoYW5kbGVFbnRlcixcblx0XHRoYW5kbGVCYWNrc3BhY2UsXG5cdFx0aGFuZGxlU3RhdGVDaGFuZ2UsXG5cdFx0aGFuZGxlUmVzZXQsXG5cdFx0aGFuZGxlRmlsZVNlbGVjdCxcblx0XHRoYW5kbGVJbnN0cnVjdGlvbnMsXG5cdFx0ZG93bmxvYWRYRCxcblx0XHRzYXZlX3N0YXRlLFxuXHRcdGluc3RydWN0aW9uc192aXNpYmxlX2JpbmRpbmcsXG5cdFx0aW5wdXQwX2lucHV0X2hhbmRsZXIsXG5cdFx0c2l6ZXNsaWRlcl9zaXplX2JpbmRpbmcsXG5cdFx0c2VsZWN0MF9jaGFuZ2VfaGFuZGxlcixcblx0XHRzZWxlY3QxX2NoYW5nZV9oYW5kbGVyLFxuXHRcdGlucHV0MV9pbnB1dF9oYW5kbGVyLFxuXHRcdGlucHV0Ml9pbnB1dF9oYW5kbGVyLFxuXHRcdGlucHV0M19pbnB1dF9oYW5kbGVyLFxuXHRcdGlucHV0NF9pbnB1dF9oYW5kbGVyLFxuXHRcdGlucHV0NV9jaGFuZ2VfaGFuZGxlcixcblx0XHRwcmludF9zdGF0ZV9iaW5kaW5nLFxuXHRcdGlucHV0Nl9iaW5kaW5nLFxuXHRcdGdyaWRfMV9iaW5kaW5nLFxuXHRcdGdyaWRfMV9Db250YWluZXJfYmluZGluZyxcblx0XHR0ZXh0YXJlYV9pbnB1dF9oYW5kbGVyXG5cdF07XG59XG5cbmNsYXNzIEpYV29yZENyZWF0b3IgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuXHRjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG5cdFx0c3VwZXIoKTtcblxuXHRcdGluaXQoXG5cdFx0XHR0aGlzLFxuXHRcdFx0b3B0aW9ucyxcblx0XHRcdGluc3RhbmNlLFxuXHRcdFx0Y3JlYXRlX2ZyYWdtZW50LFxuXHRcdFx0c2FmZV9ub3RfZXF1YWwsXG5cdFx0XHR7XG5cdFx0XHRcdGRpZmZpY3VsdGllczogMTAsXG5cdFx0XHRcdHR5cGVzOiAxMSxcblx0XHRcdFx0c2F2ZV9zdGF0ZTogMjgsXG5cdFx0XHRcdHhkOiAwLFxuXHRcdFx0XHRncmlkOiAxLFxuXHRcdFx0XHR0aXRsZTogMixcblx0XHRcdFx0YXV0aG9yOiAzLFxuXHRcdFx0XHRlZGl0b3I6IDQsXG5cdFx0XHRcdGNvcHlyaWdodDogNSxcblx0XHRcdFx0ZGF0ZTogNixcblx0XHRcdFx0ZGlmZmljdWx0eTogNyxcblx0XHRcdFx0dHlwZTogOCxcblx0XHRcdFx0ZGlzcGxheVhkOiAxMixcblx0XHRcdFx0c3ltbWV0cnk6IDlcblx0XHRcdH0sXG5cdFx0XHRudWxsLFxuXHRcdFx0Wy0xLCAtMV1cblx0XHQpO1xuXHR9XG5cblx0Z2V0IHNhdmVfc3RhdGUoKSB7XG5cdFx0cmV0dXJuIHRoaXMuJCQuY3R4WzI4XTtcblx0fVxufVxuXG5mdW5jdGlvbiBkaXN0ICh0YXJnZXQsIHByb3BzKSB7XG4gICAgcmV0dXJuIG5ldyBKWFdvcmRDcmVhdG9yKHtcbiAgICAgICAgdGFyZ2V0LFxuICAgICAgICBwcm9wc1xuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRpc3Q7XG4iLCIvLyBleHRyYWN0ZWQgYnkgbWluaS1jc3MtZXh0cmFjdC1wbHVnaW5cbmV4cG9ydCB7fTsiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbl9fd2VicGFja19yZXF1aXJlX18ubiA9IChtb2R1bGUpID0+IHtcblx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG5cdFx0KCkgPT4gKG1vZHVsZVsnZGVmYXVsdCddKSA6XG5cdFx0KCkgPT4gKG1vZHVsZSk7XG5cdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsIHsgYTogZ2V0dGVyIH0pO1xuXHRyZXR1cm4gZ2V0dGVyO1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IENyZWF0b3IgZnJvbSBcImp4d29yZC1jcmVhdG9yL2Rpc3Qvanh3b3JkY3JlYXRvci5qc1wiO1xuaW1wb3J0IFwianh3b3JkLWNyZWF0b3IvZGlzdC9kaXN0LmNzc1wiO1xuY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNyb3Nzd29yZGVuZ2luZS1jcmVhdG9yLWNvbnRhaW5lclwiKTtcbmNvbnN0IHByb3BzID0ge1xuICAgIHNhdmVfc3RhdGU6IGZhbHNlLFxufTtcbmlmICh0eXBlb2YgeGQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcHJvcHMueGQgPSB4ZDsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxufVxuQ3JlYXRvcihlbCwgcHJvcHMpOyJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==