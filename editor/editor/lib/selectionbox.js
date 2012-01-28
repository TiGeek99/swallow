/**
    selectionbox.js
    Copyright (c) Hugo Windisch 2012 All Rights Reserved
*/
var visual = require('visual'),
    domvisual = require('domvisual'),
    groups = require('./definition').definition.groups,
    glmatrix = require('glmatrix'),
    mat4 = glmatrix.mat4,
    vec3 = glmatrix.vec3;

function SelectionBox(config) {
    // call the baseclass
    domvisual.DOMElement.call(this, config, groups.SelectionBox);

    var children = this.children,
        that = this;
        
    // set a default content matrix (this is not really needed in real
    // use cases)
    this.contentMatrix = mat4.create(this.matrix);
    this.contentMatrix[0] = this.dimensions[0];
    this.contentMatrix[5] = this.dimensions[1];
    this.contentMatrix[10] = this.dimensions[2];
        
    function makeHandler(box, fcn) {
        box.on('mousedown', function (evt) {
            // snapshot the dimensions
            var matrix = that.contentMatrix,
                dimensions = vec3.create([matrix[0], matrix[5], matrix[10]]),
                mat = that.parent.getFullDisplayMatrix(true),
                startpos = glmatrix.mat4.multiplyVec3(mat, [evt.pageX, evt.pageY, 1]),
                transform = mat4.identity(),
                endpos;
            // prevent crap from happening
            evt.preventDefault();
            evt.stopPropagation();
                
            function mouseMove(evt) {
                mat = that.parent.getFullDisplayMatrix(true);
                evt.preventDefault();
                evt.stopPropagation();
                endpos = glmatrix.mat4.multiplyVec3(mat, [evt.pageX, evt.pageY, 1]);
                var delta = vec3.subtract(startpos, endpos, vec3.create()),
                    newdim = vec3.add(dimensions, delta),
                    newmat,
                    res;

                transform = fcn(matrix, delta);
                newmat = mat4.multiply(transform, matrix, mat4.create());
                that.updateRepresentation(newmat);
                that.emit('preview', transform);
            }

            box.once('mouseupc', function (evt) {
                evt.preventDefault();
                evt.stopPropagation();
                box.removeListener('mousemovec', mouseMove);
                // the position and matrix of our container is what we need
                that.emit('transform', transform);
            });
            box.on('mousemovec', mouseMove);
        });
    }

    makeHandler(children.topLeft, function (matrix, delta) {
        var transform = mat4.identity();
            
        mat4.translate(transform, [
            matrix[12] - delta[0],
            matrix[13] - delta[1],
            matrix[14] - delta[2]
        ]);
        mat4.scale(transform, [
            (matrix[0] + delta[0]) / matrix[0],
            (matrix[5] + delta[1]) / matrix[5],
            (matrix[10] + delta[2]) / matrix[10]
        ]);
        mat4.translate(transform, [-matrix[12], -matrix[13], -matrix[14]]);

        return transform;
    });

    makeHandler(children.topRight, function (matrix, delta) {
        var transform = mat4.identity();
            
        mat4.translate(transform, [
            matrix[12],
            matrix[13] - delta[1],
            matrix[14] - delta[2]
        ]);
        mat4.scale(transform, [
            (matrix[0] - delta[0]) / matrix[0],
            (matrix[5] + delta[1]) / matrix[5],
            (matrix[10] + delta[2]) / matrix[10]
        ]);
        mat4.translate(transform, [-matrix[12], -matrix[13], -matrix[14]]);

        return transform;
    });

    makeHandler(children.bottomRight, function (matrix, delta) {
        var transform = mat4.identity();
            
        mat4.translate(transform, [
            matrix[12],
            matrix[13],
            matrix[14] - delta[2]
        ]);
        mat4.scale(transform, [
            (matrix[0] - delta[0]) / matrix[0],
            (matrix[5] - delta[1]) / matrix[5],
            (matrix[10] + delta[2]) / matrix[10]
        ]);
        mat4.translate(transform, [-matrix[12], -matrix[13], -matrix[14]]);

        return transform;
    });

    makeHandler(children.bottomLeft, function (matrix, delta) {
        var transform = mat4.identity();
            
        mat4.translate(transform, [
            matrix[12] - delta[0],
            matrix[13],
            matrix[14] - delta[2]
        ]);
        mat4.scale(transform, [
            (matrix[0] + delta[0]) / matrix[0],
            (matrix[5] - delta[1]) / matrix[5],
            (matrix[10] + delta[2]) / matrix[10]
        ]);
        mat4.translate(transform, [-matrix[12], -matrix[13], -matrix[14]]);

        return transform;
    });

}
SelectionBox.prototype = new (domvisual.DOMElement)();
SelectionBox.prototype.setContentMatrix = function (matrix) {
    this.contentMatrix = matrix;
    this.updateRepresentation(this.contentMatrix);
};
SelectionBox.prototype.transformContentMatrix = function (matrix) {
    return matrix;
};
SelectionBox.prototype.updateRepresentation = function (contentMatrix) {
    var mat = this.transformContentMatrix(contentMatrix),
        res = visual.convertScaleToSize(mat);
    this.setDimensions(res.dimensions);
    this.setMatrix(res.matrix);
};

exports.SelectionBox = SelectionBox;