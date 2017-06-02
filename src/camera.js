/**
 * Sigma.js Camera Class
 * ======================
 *
 * Class designed to store camera information & used to update it.
 */
import {EventEmitter} from 'events';

import * as easings from './easings';
import {assign} from './utils';

/**
 * Defaults.
 */
const ANIMATE_DEFAULTS = {
  easing: 'quadraticInOut',
  duration: 150
};

// TODO: animate options = number polymorphism?
// TODO: pan, zoom, unzoom, reset, rotate, zoomTo
// TODO: add width / height to camera and add #.resize
// TODO: bind camera to renderer rather than sigma
// TODO: add #.graphToDisplay, #.displayToGraph, batch methods later

/**
 * Camera class
 *
 * @constructor
 */
export default class Camera extends EventEmitter {
  constructor(dimensions) {
    dimensions = dimensions || {};

    super();

    // Properties
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.ratio = 1;
    this.width = dimensions.width || 0;
    this.height = dimensions.height || 0;

    // State
    this.nextFrame = null;
  }

  /**
   * Method used to retrieve the camera's current state.
   *
   * @return {object}
   */
  getState() {
    return {
      x: this.x,
      y: this.y,
      angle: this.angle,
      ratio: this.ratio,
      width: this.width,
      height: this.height,
    };
  }

  /**
   * Method used to retrieve the camera's dimensions.
   *
   * @return {object}
   */
  getDimensions() {
    return {
      width: this.width,
      height: this.height
    };
  }

  /**
   * Method used to check whether the camera is currently being animated.
   *
   * @return {boolean}
   */
  isAnimated() {
    return !!this.nextFrame;
  }

  /**
   * Method returning the coordinates of a point from the display frame to the
   * graph one.
   *
   * @param  {number} x The X coordinate.
   * @param  {number} y The Y coordinate.
   * @return {object}   The point coordinates in the frame of the graph.
   */
  displayToGraph(x, y) {
    const cos = Math.cos(this.angle),
          sin = Math.sin(this.angle);

    // TODO: this should take a real point not one from offset by the center

    return {
      x: (x * cos - y * sin) * this.ratio,
      y: (y * cos + x * sin) * this.ratio
    };
  }

  /**
   * Method returning the coordinates of a point from the graph frame to the
   * display one.
   *
   * @param  {number} x The X coordinate.
   * @param  {number} y The Y coordinate.
   * @return {object}   The point coordinates in the frame of the display.
   */
  graphToDisplay(x, y) {
    const relCos = Math.cos(this.angle) / this.ratio,
          relSin = Math.sin(this.angle) / this.ratio,
          xOffset = (this.width / 2) - this.x * relCos - this.y * relSin,
          yOffset = (this.height / 2) - this.y * relCos + this.x * relSin;

    return {
      x: x * relCos + y * relSin + xOffset,
      y: y * relCos + x * relSin + yOffset
    };
  }

  /**
   * Method used to set the camera's state.
   *
   * @param  {object} state - New state.
   * @return {Camera}
   */
  setState(state) {

    // TODO: validations
    // TODO: update by function

    if ('x' in state)
      this.x = state.x;

    if ('y' in state)
      this.y = state.y;

    if ('angle' in state)
      this.angle = state.angle;

    if ('ratio' in state)
      this.ratio = state.ratio;

    // Emitting
    // TODO: don't emit if nothing changed?
    this.emit('updated', this.getState());

    return this;
  }

  /**
   * Method used to resize the camera's dimensions.
   *
   * @param  {object} dimensions - New dimensions.
   * @return {Camera}
   */
  resize(dimensions) {

    if ('width' in dimensions)
      this.width = dimensions.width;

    if ('height' in dimensions)
      this.height = dimensions.height;

    this.emit('resized', this.getDimensions());

    return this;
  }

  /**
   * Method used to animate the camera.
   *
   * @param  {object}   state      - State to reach eventually.
   * @param  {object}   options    - Options:
   * @param  {number}     duration - Duration of the animation.
   * @param  {function} callback   - Callback
   * @return {function}            - Return a function to cancel the animation.
   */
  animate(state, options /*, callback */) {

    // TODO: validation

    options = assign({}, ANIMATE_DEFAULTS, options);

    const easing = typeof options.easing === 'function' ?
      options.easing :
      easings[options.easing];

    // Canceling previous animation if needed
    if (this.nextFrame)
      cancelAnimationFrame(this.nextFrame);

    // State
    const start = Date.now(),
          initialState = this.getState();

    // Function performing the animation
    const fn = () => {
      const t = (Date.now() - start) / options.duration;

      // The animation is over:
      if (t >= 1) {
        this.nextFrame = null;
        this.setState(state);

        return;
      }

      const coefficient = easing(t);

      const newState = {};

      if ('x' in state)
        newState.x = initialState.x + (state.x - initialState.x) * coefficient;
      if ('y' in state)
        newState.y = initialState.y + (state.y - initialState.y) * coefficient;
      if ('angle' in state)
        newState.angle = initialState.angle + (state.angle - initialState.angle) * coefficient;
      if ('ratio' in state)
        newState.ratio = initialState.ratio + (state.ratio - initialState.ratio) * coefficient;

      this.setState(newState);

      this.nextFrame = requestAnimationFrame(fn);
    };

    this.nextFrame = requestAnimationFrame(fn);
  }
}
