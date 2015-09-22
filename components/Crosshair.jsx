/*!
 * Copyright 2015 Florian Biewald
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

require('jquery-translate3d');
require('crosshair/sass/style');

var React = require('react');
var PureRenderMixin = React.addons.PureRenderMixin;

var mapCalculate = require('core/mapCalculate');
var math = require('core/math');
var MouseEvent = require('core/MouseEvent');
var CrosshairActionCreators = require('crosshair/actions/CrosshairActionCreators');
var mouseEvent = new MouseEvent;

var $el = null;
var basePosition = null;
var moveBackId = null;
var borderOffsetY = 0;
var prevPos = null;
var _crosshairHeight = null;
var playerPosTop = null;
var _width = null;
var _height = null;

var THUMB_OFFSET = 100;
var CROSSHAIR_BORDER_OFFSET = 2;
var CROSSHAIR_OFFSET = -40;



function changeOpacityTo(target, speed) {
  var currentOpacity, id, reachedTarget, steps;
  if (speed == null) {
    speed = 100;
  }
  currentOpacity = parseFloat($el.css('opacity'));
  steps = 0.1;
  if (target < currentOpacity) {
    steps = steps * -1;
  }
  reachedTarget = function(opacity) {
    if (steps < 0) {
      return opacity <= target;
    }
    return opacity >= target;
  };
  id = setInterval(function() {
    if (reachedTarget(currentOpacity)) {
      return clearInterval(id);
    }
    currentOpacity += steps;
    $el.css('opacity', currentOpacity);
  }, speed);
}



function moveBack() {
  var absDistance, absXunits, absYunits, coveredDistance, currentPosition,
      distance, p1, p2, speed, xunits, yunits;
  speed = 10;
  currentPosition = $el.get(0).getBoundingClientRect();
  p1 = {
    x: currentPosition.left,
    y: currentPosition.top
  };
  p2 = {
    x: basePosition.left,
    y: basePosition.top
  };
  distance = math.distance(p1, p2, speed);
  absXunits = Math.abs(distance.x / distance.moves);
  absYunits = Math.abs(distance.y / distance.moves);
  xunits = distance.x / distance.moves;
  yunits = distance.y / distance.moves;
  coveredDistance = {
    x: 0,
    y: 0
  };
  absDistance = {
    x: Math.abs(distance.x),
    y: Math.abs(distance.y)
  };
  moveBackId = setInterval(function() {
    if ((coveredDistance.x + absXunits) >= absDistance.x && (coveredDistance.y + absYunits) >= absDistance.y) {
      return clearInterval(moveBackId);
    }
    $el.translate3d({
      x: xunits,
      y: yunits
    });
    coveredDistance.x += absXunits;
    return coveredDistance.y += absYunits;
  }, 20);
}



function attachEventsToCrosshair() {
  $el.on(mouseEvent.mousedown, function(event) {
    var xy;
    event.preventDefault();
    changeOpacityTo(1, 50);
    clearInterval(moveBackId);
    $el.translate3d({
      y: THUMB_OFFSET * -1
    });
    borderOffsetY = 0;
    xy = mouseEvent.getPageXY(event);
    prevPos = {
      top: xy.y,
      left: xy.x
    };
    $(document).on(mouseEvent.mousemove, move)
    .on(mouseEvent.mouseup, function() {
      var moveBackToleranceId;
      moveBackToleranceId = setTimeout(function() {
        $(document).off(mouseEvent.mousemove).off(mouseEvent.mouseup).off(mouseEvent.mousedown + ".shoot");
        moveBack();
        // _this.fireCenterPosition(_this.initialPosition);
        changeOpacityTo(0.5);
      }, 500);
      $(document).on(mouseEvent.mousedown + ".shoot", function() {
        clearTimeout(moveBackToleranceId);
        // Events.fireEvent('crosshair.shoot');
        var pos = $el.get(0).getBoundingClientRect();
        CrosshairActionCreators.shoot({
            x: pos.left + (_width / 2) - 1,
            y: pos.top + (_height / 2) - 1
        });
        $(document).off(mouseEvent.mousedown + ".shoot");
        return true;
      });
      return true;
    });
  });
}



function move(event) {
  var borderReached, moveX, moveY, x, xy, y;
  event.preventDefault();
  xy = mouseEvent.getPageXY(event);
  moveX = xy.x - prevPos.left;
  moveY = xy.y - prevPos.top;
  x = moveX;
  y = 0;
  borderReached = function(xunits, yunits) {
    var pos;
    pos = $el.get(0).getBoundingClientRect();
    return pos.top + _crosshairHeight + yunits >= playerPosTop;
  };

  if (borderReached(moveX, moveY)) {
    borderOffsetY += moveY;
  }
  if (!borderReached(moveX, moveY) && borderOffsetY > 0) {
    borderOffsetY += moveY;
  }
  if (borderOffsetY < 0) {
    y += borderOffsetY * -1;
    borderOffsetY = 0;
  }
  if (borderOffsetY <= 0) {
    y += moveY;
  }
  $el.translate3d({
    x: x,
    y: y
  });
  prevPos = {
    top: xy.y,
    left: xy.x
  };
  // this.fireCenterPosition();
}



var Crosshair = React.createClass({

  mixins: [PureRenderMixin],

  // componentWillReceiveProps: function() {
  //   $(React.findDOMNode(this.refs.player)).translate3d({rotate: this.props.heading});
  // },
  //

  componentDidMount: function() {
    $el = $(React.findDOMNode(this.refs.crosshair));
    _height = $el.height();
    _width = $el.width();
    _crosshairHeight = (_height / 2);

    var style = {
      top: $(document).height() / 2 - _crosshairHeight + CROSSHAIR_OFFSET,
      left: $(document).width() / 2 - (_width / 2)
    };

    playerPosTop = $(document).height() / 2 + mapCalculate.getPlayerOffset() - 80;

    basePosition = style;
    attachEventsToCrosshair();

    $el.css(style);
  },

  render: function() {
    return (
      <div className="crosshair" ref="crosshair"></div>
    );
  }

});

module.exports = Crosshair;
