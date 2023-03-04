(function (w, d, nameSpace) {
  function toQueryString(o, delimiter, assign) {
    delimiter = delimiter || '&';
    assign = assign || '=';
    var l = [];

    for (var i in o) {
      if (o.hasOwnProperty(i)) {
        l.push(i + assign + encodeURIComponent(o[i]));
      }
    }

    return l.join(delimiter);
  }

  function toQueryStringArr(arr, delimiter, assign) {
    delimiter = delimiter || '&';
    assign = assign || '=';
    var r = [];

    for (var i = 0, l = arr.length, o; i < l; i++) {
      o = arr[i];

      if (o[0] !== void 0 && o[1] !== void 0) {
        r.push(o[0] + assign + encodeURIComponent(o[1]));
      }
    }

    return r.join(delimiter);
  }

  function fromQueryString(str) {
    // return JSON.parse('{"' + decodeURI(str).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}')
    var res = {};

    if (str) {
      var pairs = str.split("&");

      for (var k in pairs) {
        if (pairs.hasOwnProperty(k)) {
          var pair = pairs[k].split("=");

          if (pair[0] !== void 0 && pair[1] !== void 0) {
            res[pair[0]] = decodeURIComponent(pair[1]);
          }
        }
      }
    }

    return res;
  }

  function httplize(s) {
    return (/^\/\//.test(s) ? 'https:' : '') + s;
  }

  function generateRnd() {
    return Math.round(Math.random() * 1e6);
  }

  function objectKeys(o) {
    var r = [];

    for (var i in o) {
      if (o.hasOwnProperty(i)) {
        r.push(i);
      }
    }

    return r;
  }

  function extend() {
    for (var l = arguments[0], i = 1, len = arguments.length, r, j; i < len; i++) {
      r = arguments[i];

      for (j in r) {
        if (r.hasOwnProperty(j)) {
          if (r[j] instanceof Function) {
            l[j] = r[j];
          } else if (r[j] instanceof Object) {
            if (l[j]) {
              extend(l[j], r[j]);
            } else {
              l[j] = extend(r[j] instanceof Array ? [] : {}, r[j]);
            }
          } else {
            l[j] = r[j];
          }
        }
      }
    }

    return l;
  }

  function isEmptyObj(obj) {
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        return false;
      }
    }

    return true;
  }

  function parseParams(params) {
    var res,
        custom = {};

    function setCustom(name, code) {
      if (typeof params[name] !== 'undefined') {
        params[name] !== '' && (custom[code] = params[name]);
        delete params[name];
      }
    }

    if (typeof params.site_area !== 'undefined') {
      params.site_area !== '' && (params.sz = params.site_area);
      delete params.site_area;
    }

    setCustom('offer_id', '10');
    setCustom('category_id', '11');
    setCustom('lead_id', '150');
    setCustom('order_sum', '151');
    setCustom('reg_id', '152');
    setCustom('user_id', '153');
    res = extend(params.custom || {}, custom);

    if (!isEmptyObj(res)) {
      params.custom = res;
    }

    return params;
  }

  function createScript(src, doc) {
    try {
      var head = doc.getElementsByTagName('head')[0];
      var s = doc.createElement('script');
      s.setAttribute('type', 'text/javascript');
      s.setAttribute('charset', 'windows-1251');
      s.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      s.setAttribute('src', src.split('![rnd]').join(generateRnd()));

      s.onreadystatechange = function () {
        if (/loaded|complete/.test(this.readyState)) {
          s.onload = null;
          head.removeChild(s);
        }
      };

      s.onload = function () {
        head.removeChild(s);
      };

      head.insertBefore(s, head.firstChild);
    } catch (e) {}
  }

  function getCookie(doc, name) {
    var res = doc.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
    return res ? decodeURIComponent(res[2]) : null;
  }

  var nameSpaceCustom = '206';
  var AdRiverFPSURL = '//content.adriver.ru/AdRiverFPS.js';
  var AdRiverFPSLoaded = false;

  function loadScript(req) {
    createScript(req, d);
  }

  function request(req) {
    loadScript(Counter.redirectHost + '/cgi-bin/erle.cgi?' + req);
  }

  function orderedCustom(o, nsPos) {
    function groupKeys() {
      var res = {};

      for (var i in o) {
        if (o.hasOwnProperty(i)) {
          var l = i.length;
          res[l] = res[l] || [];
          res[l].push(i);
        }
      }

      return res;
    }

    function desc(a, b) {
      if (a < b) {
        return 1;
      }

      if (a > b) {
        return -1;
      }

      return 0;
    } // Исключаем служебный 206 кастом из сортировки


    var ns = o[nsPos];
    delete o[nsPos];
    var groupedKeys = groupKeys();
    var groupsSorted = objectKeys(groupedKeys).sort(desc);
    var res = [];

    for (var i = 0, l = groupsSorted.length; i < l; i++) {
      var group = groupedKeys[groupsSorted[i]];
      var groupSorted = group.sort();

      for (var j = 0, c = groupSorted.length; j < c; j++) {
        var key = groupSorted[j];
        res.push([key, o[key]]);
      }
    } // Добавляем служебный 206 кастом в конец


    res.push([nsPos, ns]);
    return res;
  }

  function orderParams(o) {
    var order = ['sid', 'bt', 'ad', 'pid', 'bid', 'bn', 'pz', 'sz', 'custom', 'ph', 'rnd', 'tail256', 'pass'],
        ordered = {},
        res;

    for (var i = 0, l = order.length, key, d; i < l; i++) {
      key = order[i];
      d = o[key];

      if (typeof d !== 'undefined') {
        ordered[key] = d;
        delete o[key];
      }
    }

    res = extend({}, ordered, o);
    return toQueryString(res);
  }

  function setDefaults(defaults) {
    extend(Counter.defaults, defaults);
  }

  function execQueue() {
    var previous = w[nameSpace];
    var l = previous.q ? previous.q.length : 0;

    for (var a, i = 0; i < l; i++) {
      a = previous.q[i];
      Counter(a[0], a[1]);
    }
  }

  function pickDefaults() {
    var defaults = {
      custom: {}
    };
    defaults.custom[nameSpaceCustom] = nameSpace;
    var urlParams = fromQueryString(location.search.substring(1));

    if (urlParams.adrclid) {
      defaults.fsid = urlParams.adrclid;
    }

    var cookieCID = getCookie(d, 'adrcid');

    if (cookieCID) {
      defaults.custom[300] = cookieCID;
    } else {
      !AdRiverFPSLoaded && loadScript(AdRiverFPSURL);
      AdRiverFPSLoaded = true;
    }

    return defaults;
  }

  function Counter(id, params) {
    if (this instanceof Counter) {
      id = Counter.items.length;
      Counter.items[id] = this;
      params = parseParams(params);
      params.ph = id;
      params = extend({}, Counter.defaults, params);
      params.custom = toQueryStringArr(orderedCustom(params.custom, nameSpaceCustom), ';');
      params.rnd = generateRnd();
      request(orderParams(params));
    } else {
      switch (id) {
        case 'send':
          return new Counter(null, params);

        case 'firstSend':
          Counter.setDefaults(parseParams(params));
          return new Counter(null, {});

        default:
          return Counter.items[id];
      }
    }
  }

  Counter.items = [];
  Counter.defaults = {
    bt: 62,
    tail256: d.referrer || 'unknown',
    custom: {}
  };
  setDefaults(pickDefaults());
  Counter.redirectHost = httplize('//ad.adriver.ru'); // Counter.redirectHost = httplize('http://work.local/async-counter/app/scripts/reply_test.js?');

  Counter.loaded = true;
  Counter.httplize = httplize;
  Counter.loadScript = loadScript;
  Counter.setDefaults = setDefaults;
  extend({
    httplize: httplize,
    loadScript: loadScript,
    toQueryString: toQueryString
  }, Counter.prototype);

  if (!w[nameSpace].loaded) {
    execQueue();
    w[nameSpace] = Counter;
  } // export default Counter

})(window, document, "DSPCounter");
