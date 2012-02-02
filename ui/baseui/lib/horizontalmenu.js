/**
    horizontalmenu.js
    Copyright (c) Hugo Windisch 2012 All Rights Reserved
*/

var visual = require('visual'),
    domvisual = require('domvisual'),
    utils = require('utils'),
    verticalmenu = require('./verticalmenu'),
    glmatrix = require('glmatrix'),
    mat4 = glmatrix.mat4,
    vec3 = glmatrix.vec3,
    isFunction = utils.isFunction;
    

function HorizontalMenu(config) {
    var that = this;
    domvisual.DOMElement.call(this, config);

    // Menu variables
    //////////////////
    // we are the top of the menu stack
    this.parentMenu = null;
    this.highlighted = null;
    // set a key handler for accelerators
    this.on('keydown', function (evt) {
        var accel;
        // accelerators
        if (that.accelerators) {
            accel = that.accelerators[evt.decoratedVk];
            if (accel) {
                accel();
                evt.preventDefault();
                evt.stopPropagation();
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

    function find(items) {
        var i, l = items.length, it, accel, subitems;
        for (i = 0; i < l; i += 1) {
            it = items[i];
            if (it.getEnabled()) {
                accel = it.getAccelerator();
                if (accel) {
                    accelerators[accel.toDecoratedVk()] = it.action;
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
        toHighlight = this.children[itemName],
        subItems,
        subMenu,
        smMat,
        smDim;
    if (toHighlight !== this.highlighted) {
        // if some item is already highlighted
        if (this.highlighted) {
            this.highlighted.clearClass('baseui_MenuItem_highlighted');
            if (this.children.subMenu) {
                this.removeChild(this.children.subMenu);
            }
        }
        this.highlighted = toHighlight ? toHighlight : null;
        if (toHighlight) {
            this.highlighted.setClass('baseui_MenuItem_highlighted');
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
    
    // we now want to iterate our items and create children for them
    var items = this.getItems(),
        i,
        l = items.length;
    for (i = 0; i < l; i += 1) {
        this.createItemHtml(items[i], i, l);
    }
    this.numItems = l;
    
    // find available accelerators
    this.findAccelerators();
};

HorizontalMenu.prototype.createItemHtml = function (item, index, numIndex) {
    var that = this,
        name = String(index),
        c = this.addTextChild(
            'span', 
            item.getText(),
            { "class": "baseui_MenuItem" },
            name
        );
    // keep a reference to the item
    c.item = item;
    
    // to this child we want to add a handler
    c.on('click', function () {
        console.log('click');
        if (that.highlighted && that.highlighted.name === name) {
            that.highlightItem(null);
            
        } else {
            that.highlightItem(name);
        }
        
    });
    c.on('mouseover', function () {
        // if something is already highlighted
        if (that.highlighted) {
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
};
HorizontalMenu.prototype.getItems = function () {
    return this.items;
};
HorizontalMenu.prototype.getConfigurationSheet = function () {
    return { items: {} };
};
exports.HorizontalMenu = HorizontalMenu;
