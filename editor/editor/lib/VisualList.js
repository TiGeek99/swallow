/**
    VisualList.js
    Copyright (c) Hugo Windisch 2012 All Rights Reserved
*/
var visual = require('visual'),
    domvisual = require('domvisual'),
    groups = require('./definition').definition.groups,
    VisualInfo = require('./VisualInfo').VisualInfo,
    utils = require('utils'),
    forEach = utils.forEach,
    forEachProperty = utils.forEachProperty;

function VisualList(config) {
    // call the baseclass
    domvisual.DOMElement.call(this, config, groups.VisualList);
    var that = this,
        library = this.children.library;
    library.on('change', function (evt) {
        that.filterFactories();
    });
}
VisualList.prototype = new (domvisual.DOMElement)();
VisualList.prototype.filterFactories = function () {
    var editor = this.editor,
        choices = this.children.choices,
        docInfo = editor.getDocInfo(),
        filteredFactory = this.children.library.getSelectedOption(),
        editedFactory = docInfo.factory,
        alwaysShow = this.alwaysShow,
        selected = this.selected;
    forEachProperty(choices.children, function (c) {
        // skip separators
        if (c instanceof VisualInfo) {
            var cti = c.getTypeInfo(),
                f = cti.factory;
            c.setVisible(alwaysShow[f] || filteredFactory === f || c === selected);
        }
    });
};
VisualList.prototype.select = function (vi, apply) {
    var sel = this.selected,
        ret = false,
        editor = this.editor,
        choices = this.children.choices,
        docInfo = editor.getDocInfo(),
        alwaysShow = this.alwaysShow,
        filteredFactory = this.children.library.getSelectedOption(),
        f,
        editedFactory = docInfo.factory;
    if (vi !== sel) {
        if (sel) {
            sel.select(false);
            f = sel.getTypeInfo().factory;
            sel.setVisible(alwaysShow[f] || editedFactory === f || filteredFactory === f);
        }
        this.selected = vi;
        if (apply === true) {
            this.applySelectedPosition();
        }
        if (vi) {
            vi.select(true);
            vi.setVisible(true);
        }
        ret = true;
    }
    return ret;
};
VisualList.prototype.selectByTypeInfo = function (ti) {
    if (ti) {
        var factory = ti.factory,
            choices = this.children.choices,
            type = ti.type,
            that = this,
            editor = this.editor;
        forEachProperty(choices.children, function (c) {
            // skip separators
            if (c instanceof VisualInfo) {
                var cti = c.getTypeInfo();
                if (cti.factory === factory && cti.type === type) {
                    that.select(c);
                }
            }
        });
    } else {
        this.select(null);
    }
};
VisualList.prototype.applySelectedPosition = function () {
    var viewer = this.editor.getViewer(),
        group = viewer.getGroup(),
        cmdGroup = group.cmdCommandGroup('setContent', 'Set Content'),
        documentData = group.documentData,
        children = documentData.children,
        sel = this.selected,
        selection = viewer.getSelection(),
        selTypeInfo;

    if (viewer.getSelectionLength() > 0) {
        if (sel) {
            selTypeInfo = sel.getTypeInfo();
            forEachProperty(selection, function (pos, posName) {
                var selectedChild = children[posName];
                // updated
                if (selectedChild) {
                    cmdGroup.add(group.cmdUpdateVisual(
                        posName,
                        {
                            factory: selTypeInfo.factory,
                            type: selTypeInfo.type,
                            position: posName,
                            config: {
                            }
                        }
                    ));
                } else {
                    cmdGroup.add(group.cmdAddVisual(
                        posName,
                        {
                            factory: selTypeInfo.factory,
                            type: selTypeInfo.type,
                            position: posName,
                            config: {
                            }
                        }
                    ));
                }
            });
            group.doCommand(cmdGroup);
        } else {
            forEachProperty(selection, function (pos, posName) {
                // clear the content from the box
                if (children[posName]) {
                    cmdGroup.add(group.cmdRemoveVisual(posName));
                }
            });
            group.doCommand(cmdGroup);
        }
    }
};
VisualList.prototype.updateVisualList = function () {
    var editor = this.editor,
        packageManager = editor.getDependencyManager(),
        visualList = packageManager.getVisualList(),
        l = visualList.length,
        i,
        jsd,
        alwaysShow = this.alwaysShow,
        choices = this.children.choices,
        docInfo = editor.getDocInfo(),
        editedFactory = docInfo.factory,
        ve,
        that = this;
    function onClick() {
        that.select(this, true);
    }
    function add(jsd) {
        var c;
        if ((!jsd.private || jsd.factory === editedFactory) && !(jsd.factory === docInfo.factory && jsd.type === docInfo.type)) {
            // keep a list of factories
            c = new VisualInfo({ typeInfo: jsd});
            c.init(that.editor);
            // FIXME: this needs some thinking... I want to flow the thing,
            // and doing so
            c.setHtmlFlowing({position: 'relative'}, true);
            choices.addChild(c);
            c.on('click', onClick);
        }
    }
    // remove all children
    choices.removeAllChildren();
    // create the always visible choices first
    forEach(visualList, function (jsd) {
        if (alwaysShow[jsd.factory]) {
            add(jsd);
        }
    });
    // add a separator
    choices.addChild(
        (new (domvisual.DOMElement)()).setHtmlFlowing({position: 'relative'}, true).setDimensions([1, 20, 1]),
        'separator'
    );

    // then the other ones
    forEach(visualList, function (jsd) {
        if (!alwaysShow[jsd.factory]) {
            add(jsd);
        }
    });
    // then setup the factory selector
    that.setFactories(packageManager.getFactories());
    that.filterFactories();
};

VisualList.prototype.init = function (editor) {
    var viewer = editor.getViewer(),
        container = this.parent,
        docInfo = editor.getDocInfo(),
        that = this;
    this.editor = editor;
    this.alwaysShow = { domvisual: true };

    this.updateVisualList();
    editor.getDependencyManager().on('change', function () {
        that.updateVisualList();
    });
    // a new box has been selected
    function newBoxSelected() {
        that.selectByTypeInfo(viewer.getSelectionTypeInfo());
    }

    viewer.on('updateSelectionControlBox', newBoxSelected);
};

VisualList.prototype.setFactories = function (factories) {
    var factArray = [],
        docInfo = this.editor.getDocInfo(),
        alwaysShow = this.alwaysShow || {};
    forEachProperty(factories, function (f, name) {
        // don't show the factories that are always present
        if (!alwaysShow[name]) {
            factArray.push(name);
        }
    });
    factArray.sort(function (i1, i2) {
        return i1 > i2;
    });
    this.children.library.setOptions(factArray);
};


exports.VisualList = VisualList;
