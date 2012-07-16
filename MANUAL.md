# What is swallow
The ever increasing number of graphic features (transformation matrices, shadows, gradients, backgrounds, animation effects, filters, masks, canvas, etc.) supported by modern browsers is difficult to fully leverage without graphic design tools. For most people design is a task that must be performed graphically and interactively: we want to see what we do and get instant feedback whenever we add, remove or change something. Moreover we don't necessarily want to learn programming languages and file formats in order to be able to create user interfaces.

Swallow is an open source graphic environment for creating HTML5 applications. Its main goal is to separate graphic design from programming so that designers can work visually on visual elements and programmers can work with programming tools on code.

## The Editor
The editor is a visual tool that is documented visual with youtube
videos. These video are available in the Help menu of the editor.

## The Framework
The framework consists of:

- packages that implement standard apis (assert, http, events, http, glmatrix) that handle tasks that are already well defined in NodJS or CommonJS and are similar on the client and the server.

- custom packages (visual, domvisual, config, utils) that implement apis that are specific to swallow and that let you create or use visual components.

- optional packages (baseui, domquery, doxhtml, sse) that implement other useful apis and extensions. You can also add your own extensions by adding more packages or porting NodeJS packages.

# Getting Started
Here I will provide programming example for the most useful programming features.

##How do I start?
From the Launcher, you can create a new package, then create a new module in that package. Package names should start with a lowercase letter. Visual module names should start with an uppercase letter.

The package you created has a package.json file. It is a commonJS package. It is located in work/packages/yourpackagename.

The module you created is a Javascript file and a CommonJS module (it can require() packages and modules, and be require()d by other packages and modules). It is located in work/packages/yourpackagename/lib.

##Where is the code?
Swallow generates a small javascript module for each new visual element that you create.

This module looks like this:

```javascript
    /**
        MyClass.js
    */
    var visual = require('visual'),
        domvisual = require('domvisual'),
        packageName = 'mypackage',
        className = 'MyClass',
        group = require('./groups').groups.MyClass;

    function MyClass(config) {
        domvisual.DOMElement.call(this, config, group);
    }
    MyClass.prototype = visual.inheritVisual(domvisual.DOMElement, group, packageName, className);
    MyClass.prototype.getConfigurationSheet = function () {
        return {  };
    };

    exports.MyClass} = MyClass;
```

It can be found in your woriking directory under the work/packages/youpackage/lib
directory.

Note: Instanciating this class will create an instance of your visual element.

##I have created something with the editor, what's next: Event Handlers
The next step is to add event handlers. As soon as your baseclass has been called, you can add event handlers to your class. Your class inherits from an implementation of the EventEmitter class defined in NodeJS. This gives you access to the following methods:

```javascript
        // In your constructor, the constructor of the baseclass is called:
        domvisual.DOMElement.call(this, config, group);

        // after the baseclass has been called, we can add event handlers:
        this.getChild('myChild').on('mousedown', function (evt) {
            console.log('mouse event!');
        });
```

Here are the events that are currently supported:
keydown, keyup, resize, click, mousedown, mousedownt, mousedownc, mouseup, mouseupc, mouseupt, mouseover, mousemove, mousemovec, mouseout, change, load, error.

TODO: Add all what's missing
TODO: Document the and c version of some events
TODO: Document the liftetime management of handlers

##Dealing with Mouse events (and positional events)
SwallowApps lets you compute the position of mouse events relative to your component (in HTML, mouse events are positioned relatively to the page). This can be useful if you want to use the mouse to position a visual element inside another visual element (just like swallow's visual editor does).


```javascript
        this.getChild('myChild').on('mousemove', function (evt) {
            var glmatrix = require('glmatrix'),
                mat = myVisualElement.getFullDisplayMatrix(true);
            glmatrix.mat4.multiplyVec3(mat, [evt.pageX, evt.pageY, 0]));
        });
```

getFullDisplayMatrix(true) returns the inverse of the display matrix that positions myVisualElement in the page. glmatrix.mat4.multiplyVec3 transforms the page coordinates of the event with this matrix.

TODO: Point to a complete code sample

##Animating Positions
In the editor, whenever you create a new visual element two things are actually created: a child and a position. The child has the same name as its initial position (ex: 'pos0'), but you can move it to any other position. You can also create empty positions and move your children to any of them. You can't have two children (or two positions) with the same name but you can move many children to the same position.

The following code will move a child name 'pos' to a position named 'offscreen'.
```javascript
    this.getChild('pos').setPosition('offscreen');
```

Note: A complete example of this can be found in samples/lib/PositionAnimation.js (and you can run the PositionAnimation sample).

TODO: Add a video showing how to add postions and children and how to rename them.
TODO: Show how animation is supported.

##Animating Styles
Some visual elements use styles. A good example of this is domvisual.DOMElement that has a setStyle method. You can use any style defined in your visual component and pass it to setStyle:

```javascript
    this.getChild('pos').setStyle('style0');
```

Note: A complete example of this can be found in samples/lib/StyleAnimation.js (and you can run the StyleAnimation sample).

TODO: Show how animation is supported

##Playing with Depth
You can change the visual ordering of visual elements: which one is on top, which one is hidden by others.


##Setting other attributes
Other than the position and style of elements you can also set the following attributes:

TODO: explain the following methods:
TODO: Make sure we need special things in the framework (these could all be style Attributes)

DOMVisual.prototype.setElementAttributes = function (attr) {
DOMVisual.prototype.setStyleAttributes
setClass, clearClass
setOverflow
setVisible
setCursor
setTransition (... tb fixed...)

Note: overflow, visible, cursor: should this be really different from styles?
My thought on this: ALL visual elements should support this.


##Adding a Configuration Sheet
All the visual elements that you create can be used as components of other visual elements. Whenever you place a visual element in the editor a small configuration sheet appears and lets you set some attributes to your component.

It is very easy to create a configuration sheet for your component. The only thing you have to do is to change the default implementation of getConfigurationSheet (that does nothing). So you can write:

```javascript
    MyClass.prototype.getConfigurationSheet = function () {
        var config = require('config');
        return {
            "title": config.inputConfig('Title: '),
            "blink": config.booleanCOnfig('Blink: ')
        };
    };
```

You will also need to add a getter and a setter for all the properties that you expose in your configuration sheet:

```javascript
    // 'set' + you config with an uppercased first character
    MyClass.prototype.setTitle = function (str) {
        this.str = str;
        // do something with this str here if you wish
    };

    MyClass.prototype.getTitle = function () {
        return this.str;
    };

    MyClass.prototype.setBlink = function (b) {
        this.blink = b;
    };

    MyClass.prototype.getBlink = function () {
        return b;
    };
```

The config methods currently supported in the config package are:
+ inputConfig(label): Lets the user input a string
+ inputConfigFullLine(label): Lets the user input a string (on a full line)
+ booleanConfig(label): Lets the user input a boolean (checkbox)
+ imageUrlConfig(label): Lets the user pick an image
+ styleConfig(label): Lets the user pick a style

TODO: add something to input a number with optional range validation

##Creating instances of visual components.
You can manually ...

##Flowing Elements
Swallow implements an absolute positioning model: graphic elements are explicitely positioned using a graphic editor. But sometimes it is very convenient to let HTML flow elements.

You can tell html to flow some of the elements of a given container by doing something like:

```javascript
    myContainer.getChild('myChild').setHtmlFlowing({position: 'relative'}, false);
```

#Advanced Features
This section discusses topics that will probably not be useful for playing with the tool but that will probably become essential in some real life situations.

##Dealing with html



##Dealing with external data and lists


##Adding Tests to your Packages
You can add tests to your packages and run these tests from the TestViewer (http://localhost:1337/make/testviewer.TestViewer.html). You will find examples of this in many standard packages (http is a good example, because it demonstrates how asynchronous testing works).

+ Tests should be added in a subfolder

##Adding JSDoc to your packages

##Adding non visual packages

##Porting NodeJS packages

##Dealing with server side parts




#More Advanced Features

##Multiple Layouts

##Custom positioning
(postion vs ...)