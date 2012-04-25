/**
    StyleSettingText.js
*/
var visual = require('visual'),
    domvisual = require('domvisual'),
    groups = require('./definition').definition.groups,
    glmatrix = require('glmatrix'),
    mat4 = glmatrix.mat4,
    vec3 = glmatrix.vec3;

function StyleSettingText(config) {
    // call the baseclass
    domvisual.DOMElement.call(this, config, groups.StyleSettingText);
}
StyleSettingText.prototype = new (domvisual.DOMElement)();
StyleSettingText.prototype.getConfigurationSheet = function () {
    return {  };
};

exports.StyleSettingText = StyleSettingText;
