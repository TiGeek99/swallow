/**
    browser.js
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
var browser,
    preferences,
    ua = navigator.userAgent;

// detect the browser
if (ua.indexOf("AppleWebKit") !== -1) {
    browser = 'AppleWebKit';
    preferences = {
        allow3D: false,
        preferMatrixPositioning: false
    };
} else if (ua.indexOf("MSIE") !== -1) {
    browser = 'MSIE';
    preferences = {
        allow3D: false,
        preferMatrixPositioning: false
    };
} else if (ua.indexOf("Mozilla") !== -1) {
    browser = 'Mozilla';
    preferences = {
        allow3D: true,
        preferMatrixPositioning: false
    };
}

/**
* mimimalistic browser detection
* @api private
*/
function getBrowser() {
    return browser;
}

/**
* minimalistic feature enable/disable
* @api private
*/
function getPreferences() {
    return preferences;
}

exports.getBrowser = getBrowser;
exports.getPreferences = getPreferences;
