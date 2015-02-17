/*!
 * verge 1.8.0+201310080639
 * https://github.com/ryanve/verge
 * MIT License 2013 Ryan Van Etten
 */

(function(root, name, make) {
    if (typeof module != 'undefined' && module['exports']) module['exports'] = make();
    else root[name] = make();
}(this, 'verge', function() {

    var win = typeof window != 'undefined' && window
        , doc = typeof document != 'undefined' && document
        , docElem = doc && doc.documentElement
        , Modernizr = win['Modernizr']
        , matchMedia = win['matchMedia'] || win['msMatchMedia']
        , mq = matchMedia ? function(q) {
            return !!matchMedia.call(win, q).matches;
        } : function() {
            return false;
        }
        , makeViewportGetter = function(dim, inner, client) {
            // http://responsejs.com/labs/dimensions/
            // http://quirksmode.org/mobile/viewports2.html
            // http://github.com/ryanve/response.js/issues/17
            return docElem[client] < win[inner] && mq('(min-' + dim + ':' + win[inner] + 'px)') ? function() {
                return win[inner];
            } : function() {
                return docElem[client];
            };
        }
        , viewportW = makeViewportGetter('width', 'innerWidth', 'clientWidth')
        , viewportH = makeViewportGetter('height', 'innerHeight', 'clientHeight')
        , xports = {};

    /**
     * Test if a media query is active. (Fallback uses Modernizr if avail.)
     * @since 1.6.0
     * @return {boolean}
     */
    xports['mq'] = !matchMedia && Modernizr && Modernizr['mq'] || mq;

    /**
     * Normalized, gracefully-degrading matchMedia.
     * @since 1.6.0
     * @return {Object}
     */
    xports['matchMedia'] = matchMedia ? function() {
        // matchMedia must be binded to window
        return matchMedia.apply(win, arguments);
    } : function() {
        return {};
    };

    /**
     * Get the layout viewport width.
     * @since 1.0.0
     * @return {number}
     */
    xports['viewportW'] = viewportW;

    /**
     * Get the layout viewport height.
     * @since 1.0.0
     * @return {number}
     */
    xports['viewportH'] = viewportH;

    /**
     * alternate syntax for getting viewport dims
     * @since 1.8.0
     * @return {Object}
     */
    function viewport() {
        return {'width':viewportW(), 'height':viewportH()};
    }
    xports['viewport'] = viewport;

    /**
     * Cross-browser window.scrollX
     * @since 1.0.0
     * @return {number}
     */
    xports['scrollX'] = function() {
        return win.pageXOffset || docElem.scrollLeft;
    };

    /**
     * Cross-browser window.scrollY
     * @since 1.0.0
     * @return {number}
     */
    xports['scrollY'] = function() {
        return win.pageYOffset || docElem.scrollTop;
    };

    /**
     * Cross-browser element.getBoundingClientRect plus optional cushion.
     * Coords are relative to the top-left corner of the viewport.
     * @since 1.0.0
     * @param {Node|Object} el DOM element or collection (defaults to first item)
     * @param {number=} cushion +/- pixel amount to act as a cushion around the viewport
     * @return {Object|boolean}
     */
    function rectangle(el, cushion) {
        var o = {};
        if (el && !el.nodeType) el = el[0];
        if (!el || 1 !== el.nodeType) return false;
        cushion = typeof cushion == 'number' && cushion || 0;
        el = el.getBoundingClientRect(); // read-only
        o['width'] = (o['right'] = el['right'] + cushion) - (o['left'] = el['left'] - cushion);
        o['height'] = (o['bottom'] = el['bottom'] + cushion) - (o['top'] = el['top'] - cushion);
        return o;
    }
    xports['rectangle'] = rectangle;

    /**
     * Get the viewport aspect ratio (or the aspect ratio of an object or element)
     * @since 1.7.0
     * @param {(Node|Object)=} o optional object with width/height props or methods
     * @return {number}
     * @link http://w3.org/TR/css3-mediaqueries/#orientation
     */
    function aspect(o) {
        o = null == o ? viewport() : 1 === o.nodeType ? rectangle(o) : o;
        var h = o['height'], w = o['width'];
        h = typeof h == 'function' ? h.call(o) : h;
        w = typeof w == 'function' ? w.call(o) : w;
        return w/h;
    }
    xports['aspect'] = aspect;

    /**
     * Test if an element is in the same x-axis section as the viewport.
     * @since 1.0.0
     * @param {Node|Object} el
     * @param {number=} cushion
     * @return {boolean}
     */
    xports['inX'] = function(el, cushion) {
        var r = rectangle(el, cushion);
        return !!r && r.right >= 0 && r.left <= viewportW();
    };

    /**
     * Test if an element is in the same y-axis section as the viewport.
     * @since 1.0.0
     * @param {Node|Object} el
     * @param {number=} cushion
     * @return {boolean}
     */
    xports['inY'] = function(el, cushion) {
        var r = rectangle(el, cushion);
        return !!r && r.bottom >= 0 && r.top <= viewportH();
    };

    /**
     * Test if an element is in the viewport.
     * @since 1.0.0
     * @param {Object} el
     * @param {number=} cushion
     * @return {boolean}
     */
    xports['inViewport'] = function(el, cushion) {
        // Equiv to `inX(el, cushion) && inY(el, cushion)` but just manually do both
        // to avoid calling rectangle() twice. It gzips just as small like this.
        var r = rectangle(el, cushion);
        return !!r && r.bottom >= 0 && r.right >= 0 && r.top <= viewportH() && r.left <= viewportW();
    };

    return xports;
}));