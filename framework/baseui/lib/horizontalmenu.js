/**
    horizontalmenu.js
    Copyright (C) 2012 Hugo Windisch

    Permission is hereby granted, free of charge, to any person obtaining a
    copy of this software and associated documentation files (the "Software"),
    to deal in the Software without restriction, including without limitation
    the rights to use, copy, modify, merge, publish, distribute, sublicense,
    and/or sell copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
    IN THE SOFTWARE.
*/

var visual = require('visual'),
    domvisual = require('domvisual'),
    utils = require('utils'),
    verticalmenu = require('./verticalmenu'),
    glmatrix = require('glmatrix'),
    isObject = utils.isObject,
    forEachProperty = utils.forEachProperty,
    mat4 = glmatrix.mat4,
    vec3 = glmatrix.vec3,
    isFunction = utils.isFunction;


function HorizontalMenu(config) {
    var that = this;
    // set default dimensions
    domvisual.DOMElement.call(this, config);

    // Menu variables
    //////////////////
    // we are the top of the menu stack
    this.parentMenu = null;
    this.highlighted = null;
    // set a key handler for accelerators
    this.on('keydown', function (evt) {
        var accel;
        // accelerators (note: we only apply them when no text box is
        // focused, preventing from eating normal keys in edit boxes)
        if (that.accelerators && this.nothingFocused()) {
            accel = that.accelerators[evt.decoratedVk];
            if (accel) {
                if (accel()) {
                    evt.preventDefault();
                    evt.stopPropagation();
                }
                return;
            }
        }
        // normal menu function
        if (!that.children.subMenu) {
            that.handleKey(evt);
        }
    });
}
HorizontalMenu.prototype = new (domvisual.DOMElement)();

HorizontalMenu.prototype.getActiveTheme = visual.getGetActiveTheme(
    'baseui',
    'HorizontalMenu'
);

HorizontalMenu.prototype.getDescription = function () {
    return "A menu bar";
};

HorizontalMenu.createPreview = function () {
    return new (domvisual.DOMImg)({url: 'baseui/img/menupreview.png'});
};

HorizontalMenu.prototype.theme = new (visual.Theme)({
    normal: {
        basedOn: [
            // take the line styles from here
            { factory: 'baseui', type: 'Theme', style: 'menuTitleBackground' },
            { factory: 'baseui', type: 'Theme', style: 'menuTitleText' }

        ]
    },
    highlighted: {
        basedOn: [
            // take the line styles from here
            {
                factory: 'baseui',
                type: 'Theme',
                style: 'highLightedMenuTitleBackground'
            },
            {
                factory: 'baseui',
                type: 'Theme',
                style: 'highLightedMenuTitleText'
            }
        ]
    },
    menuBar: {
        basedOn: [
            // take the line styles from here
            {
                factory: 'baseui',
                type: 'Theme',
                style: 'menuBar'
            }
        ]
    }
});

/**
    Handles keys
*/
HorizontalMenu.prototype.handleKey = function (evt) {
    var nH, maxH = this.numItems;
    if (this.highlighted) {
        nH = Number(this.highlighted.name);
        switch (evt.decoratedVk) {
        case 'VK_LEFT':
            nH -= 1;
            if (nH < 0) {
                nH = maxH - 1;
            }
            this.highlightItem(String(nH));
            break;
        case 'VK_RIGHT':
            nH += 1;
            if (nH === maxH) {
                nH = 0;
            }
            this.highlightItem(String(nH));
            break;
        case 'VK_DOWN':
            if (this.children.subMenu) {
                this.children.subMenu.highlightItem(0);
            }
            break;
        }
    }
};

/**
    Finds accelerators. This is not perfect. If a submenu gets changed,
    its accelerators will not be automatically recomputed.
*/
HorizontalMenu.prototype.findAccelerators = function (evt) {
    var accelerators = {};

    function geAccelFunction(it) {
        return function () {
            var ret = false;
            if (it.getEnabled()) {
                it.action();
                ret = true;
            }
            return ret;
        };
    }

    function find(items) {
        var i, l = items.length, it, accel, subitems;
        for (i = 0; i < l; i += 1) {
            it = items[i];
            if (it) {
                accel = it.getAccelerator();
                if (accel) {
                    accelerators[accel.toDecoratedVk()] = geAccelFunction(it);
                }
                subitems = it.getSubMenu();
                if (subitems) {
                    find(subitems);
                }
            }
        }
    }
    // do it
    find(this.getItems());
    this.accelerators = accelerators;
};

/**
    Highlights an item.
*/
HorizontalMenu.prototype.highlightItem = function (itemName) {
    var c,
        bar = this.children.bar,
        toHighlight = bar.children[itemName],
        subItems,
        subMenu,
        smMat,
        smDim,
        that = this;

    function cleanupClickout() {
        if (that.cleanupClickout) {
            that.cleanupClickout();
            delete that.cleanupClickout;
        }
    }
    function setupClickout() {
        var skip = 1;
        function clickout(evt) {
            if (skip === 0) {
                if (that.highlighted) {
                    that.highlightItem(null);
                }
            }
            skip -= 1;
        }
        // if not already setup
        if (!that.cleanupClickout) {
            that.on('mouseupt', clickout);
            that.cleanupClickout = function () {
                that.removeListener('mouseupt', clickout);
            };
        }
    }

    if (toHighlight !== this.highlighted) {
        // if some item is already highlighted
        if (this.highlighted) {
            this.highlighted.setStyle('normal');
            if (this.children.subMenu) {
                this.removeChild(this.children.subMenu);
            }
        }
        this.highlighted = toHighlight ? toHighlight : null;
        if (toHighlight) {
            this.highlighted.setStyle('highlighted');
            // do we have a submenu for this item?
            subItems = toHighlight.item.getSubMenu();
            if (subItems) {
                // we need to create a sub menu
                subMenu = new (verticalmenu.VerticalMenu)({ items: subItems});
                subMenu.parentMenu = this;
                this.addChild(subMenu, 'subMenu');
                // we want to position it semi intelligently
                smMat = mat4.create(toHighlight.getComputedMatrix());
                smDim = toHighlight.getComputedDimensions();
                smMat[13] += smDim[1];
                subMenu.setMatrix(smMat);
            }
            setupClickout();
        } else {
            cleanupClickout();
        }
    }
};

/**
    It is way easier to create something like this in HTML (because the
    automatic layouting fits this thing so well).
*/
HorizontalMenu.prototype.updateChildren = function () {
    // we want to remove all our children
    this.removeAllChildren();
    this.addHtmlChild(
        'div',
        '',
        {'style': 'menuBar' },
        'bar'
    ).setHtmlFlowing({
        position: 'absolute',
        left: '0px',
        top: '0px',
        right: '0px',
        bottom: 'auto'
    });


    // we now want to iterate our items and create children for them
    var items = this.getItems(),
        i,
        l = items.length,
        item;
    for (i = 0; i < l; i += 1) {
        item = items[i];
        // we silently ignore separators (null)
        if (item) {
            this.createItemHtml(item, i, l);
        }
    }
    this.numItems = l;

    // find available accelerators
    this.findAccelerators();
};

HorizontalMenu.prototype.createItemHtml = function (item, index, numIndex) {
    var that = this,
        name = String(index),
        bar = this.children.bar,
        c = bar.addTextChild(
            'div',
            item.getText(),
            { style: 'normal' },
            name
        ),
        height = (this.dimensions[1] - 4) + 'px';
    // keep a reference to the item
    c.item = item;

    c.setHtmlFlowing({ /*height: height,*/ display: 'inline-block' });
    c.setCursor('pointer');
    // to this child we want to add a handler
    c.on('mousedown', function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        if (that.highlighted && that.highlighted.name === name) {
            that.highlightItem(null);

        } else {
            that.highlightItem(name);
        }

    });
    c.on('mouseover', function (evt) {
        // if something is already highlighted
        if (that.highlighted) {
            evt.preventDefault();
            evt.stopPropagation();
            that.highlightItem(name);
        }
    });
};

HorizontalMenu.prototype.setItems = function (items) {
    if (isFunction(items)) {
        this.getItems = items;
    } else {
        this.items = items;
    }
    this.updateChildren();
    return this;
};

HorizontalMenu.prototype.getItems = function () {
    return this.items;
};

HorizontalMenu.prototype.getConfigurationSheet = function () {
    return { items: null };
};

HorizontalMenu.prototype.setDimensions = function (dimensions) {
    domvisual.DOMElement.prototype.setDimensions.call(this, dimensions);
    // mixing html flowing with absolute positioning is a war...
    // outer stuff grows according to inner stuff... But what we want
    // here is the other way around. So we fight.
    // Note: the -5 is a hack... I must rethink this... (the css thing...)
    var height = dimensions[1] - 5 + 'px',
        children = this.children;
    if (children && children.bar) {
        forEachProperty(children.bar.children, function (c) {
            c.setHtmlFlowing({height: height, display: 'inline-block'});
        });
    }
    return this;
};

exports.HorizontalMenu = HorizontalMenu;
