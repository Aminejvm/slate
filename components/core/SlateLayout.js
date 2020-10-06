import * as React from "react";
import * as Constants from "~/common/constants";
import * as SVG from "~/common/svg";

import SlateMediaObjectPreview from "~/components/core/SlateMediaObjectPreview";

import { css } from "@emotion/react";

//NOTE(martina): sets 200px as the standard width and height for a 1080px wide layout with 20px margin btwn images.
//If the container is larger or smaller, it scales accordingly by that factor
const MIN_SIZE = 10;
const SIZE = 200;
const MARGIN = 20;
const CONTAINER_SIZE = 5 * SIZE + 4 * MARGIN;

const reduceToLowestTerms = (a, b) => {
  let i = Math.min(a, b);
  while (i > 1) {
    if (a === 1 || b === 1) {
      break;
    }
    if (a % i === 0 && b % i === 0) {
      a /= i;
      b /= i;
    }
    i--;
  }
  return [a, b];
};

export const generateLayout = (items) => {
  if (!items) {
    return [];
  }

  if (!items.length) {
    return [];
  }

  return items.map((item, i) => {
    return {
      x: (i % 5) * (SIZE + MARGIN),
      y: Math.floor(i / 5) * (SIZE + MARGIN),
      w: SIZE,
      h: SIZE,
      z: i,
    };
  });
};

const STYLES_HIDDEN = css`
  display: inline-block;
  opacity: 0;
`;

const STYLES_CONTAINER = css`
  width: 100%;
  position: relative;
  height: 100vh;
  ${"" /* overflow: hidden; */}
  z-index: ${Constants.zindex.body};
`;

const STYLES_CONTAINER_EDITING = css`
  ${STYLES_CONTAINER}
  background-image: radial-gradient(
    ${Constants.system
    .darkGray} 1px,
    transparent 0
  );
  background-size: 30px 30px;
  background-position: -50% -50%;
`;

const STYLES_FILE_BOX = css`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const STYLES_ITEM = css`
  position: absolute;
  transform-origin: top left;
  cursor: pointer;

  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none; /* Safari */
  -khtml-user-select: none; /* Konqueror HTML */
  -moz-user-select: none; /* Old versions of Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
  user-select: none; /* Non-prefixed version, currently supported by Chrome, Edge, Opera and Firefox */
`;

const STYLES_ITEM_EDITING = css`
  ${STYLES_ITEM}
  cursor: move;
`;

const STYLES_HANDLE_BOX = css`
  padding: 2px;
  cursor: nesw-resize;
  position: absolute;
`;

const STYLES_HANDLE = css`
  width: 4px;
  height: 4px;
  background-color: ${Constants.system.white};
  border: 1px solid ${Constants.system.brand};
`;

export class SlateLayout extends React.Component {
  _ref;
  keysPressed = {};

  state = {
    unit: 10,
    layout: this.props.layout
      ? this.props.layout
      : generateLayout(this.props.items),
    measuring: false,
    hover: null,
    containerHeight: 1000,
    prevLayouts: [],
    zIndexMax: this.props.items.length,
  };

  componentDidMount = async () => {
    window.addEventListener("resize", this.calculateUnit);
    if (this.props.editing) {
      window.addEventListener("keydown", this._handleKeyDown);
      window.addEventListener("keyup", this._handleKeyUp);
    }
    await this.calculateUnit();
    this.calculateContainer();
  };

  componentWillUnmount = () => {
    window.removeEventListener("resize", this._calculateUnit);
    if (this.props.editing) {
      window.removeEventListener("keydown", this._handleKeyDown);
      window.removeEventListener("keyup", this._handleKeyUp);
    }
  };

  componentDidUpdate = (prevProps) => {
    if (this.props.editing !== prevProps.editing) {
      if (this.props.editing) {
        window.addEventListener("keydown", this._handleKeyDown);
        window.addEventListener("keyup", this._handleKeyUp);
      } else {
        window.removeEventListener("keydown", this._handleKeyDown);
        window.removeEventListener("keyup", this._handleKeyUp);
      }
    }
  };

  calculateUnit = () => {
    //if width under a certain amount, set to a default mobile flex or grid layout of single items
    let ref = this._ref;
    if (!ref) {
      return;
    }
    let unit = ref.clientWidth / CONTAINER_SIZE;
    if (unit === 0) {
      return;
    }
    this.setState({ unit });
  };

  calculateContainer = () => {
    let highestPoints = this.state.layout.map((pos) => {
      return pos.y + pos.h;
    });
    let containerHeight = Math.max(...highestPoints) * this.state.unit;
    this.setState({ containerHeight });
  };

  //   calculateGrid = async () => {
  //     await this.setState({ measuring: true });
  //     //only do generate layout and adjust to center if something has been added or removed, then save it after that. don't do it again for viewers
  //     let layout = this.state.layout;
  //     for (let i = 0; i < layout.length; i++) {
  //       let elem = document.getElementById(`measuring-box-${i}`);
  //       let width = elem.clientWidth;
  //       let height = elem.clientHeight;
  //       layout[i] = {
  //         x: layout[i].x + (SIZE - width) / 2, //NOTE(martina): manual adjustment to center justify and align items in their "box"
  //         y: layout[i].y + (SIZE - height) / 2,
  //         // h: height,
  //         // w: width,
  //         ratio: height / width,
  //       };
  //     }
  //     this.setState({ layout, measuring: false });
  //   };

  cloneLayout = (layout) => {
    let copy = [];
    for (let pos of layout) {
      copy.push({ ...pos });
    }
    return copy;
  };

  _handleKeyDown = (e) => {
    this.keysPressed[e.key] = true;
    console.log(this.keysPressed);
    if (
      (this.keysPressed["Control"] || this.keysPressed["Meta"]) &&
      this.keysPressed["z"]
    ) {
      this._handleUndo();
    }
    //ctrl s to save
  };

  _handleKeyUp = (e) => {
    this.keysPressed[e.key] = false;
  };

  _handleUndo = () => {
    if (this.state.prevLayouts.length) {
      console.log(this.state.prevLayouts);
      let prevLayouts = this.state.prevLayouts;
      let layout = prevLayouts.pop();
      this.setState({ layout, prevLayouts });
    }
  };

  _handleMouseDown = (e, i) => {
    e.stopPropagation();
    e.preventDefault();
    let layout = this.cloneLayout(this.state.layout);
    layout[i].z = this.state.zIndexMax;
    this.setState({
      xStart: e.clientX,
      yStart: e.clientY,
      dragIndex: i,
      origLayout: this.cloneLayout(layout),
      layout,
      zIndexMax: this.state.zIndexMax + 1,
      prevLayouts: [...this.state.prevLayouts, this.state.layout],
    });
    window.addEventListener("mousemove", this._handleDrag);
    window.addEventListener("mouseup", this._handleMouseUp);
  };

  _handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    let layout = this.cloneLayout(this.state.origLayout);
    let pos = layout[this.state.dragIndex];
    let dX =
      Math.round((e.clientX - this.state.xStart) / (this.state.unit * 10)) * 10;
    let dY =
      Math.round((e.clientY - this.state.yStart) / (this.state.unit * 10)) * 10;
    if (e.shiftKey) {
      if (Math.abs(dY) > Math.abs(dX)) {
        pos.y += dY;
      } else {
        pos.x += dX;
      }
    } else {
      pos.x += dX;
      pos.y += dY;
    }
    if (pos.x >= CONTAINER_SIZE || pos.x + pos.w <= 0 || pos.y + pos.h <= 0) {
      return;
    }
    this.setState({ layout });
  };

  _handleMouseUp = (e) => {
    window.removeEventListener("mousemove", this._handleDrag);
    window.removeEventListener("mouseup", this._handleMouseUp);
    let pos = this.state.layout[this.state.dragIndex];
    let state = { dragIndex: null };
    if ((pos.y + pos.h) * this.state.unit > this.state.containerHeight) {
      state.containerHeight = (pos.y + pos.h) * this.state.unit;
    }
    this.setState(state);
  };

  _handleMouseDownResize = (e, i, dir) => {
    e.stopPropagation();
    e.preventDefault();
    let layout = this.cloneLayout(this.state.layout);
    layout[i].z = this.state.zIndexMax;
    this.setState({
      xStart: e.clientX,
      yStart: e.clientY,
      dragIndex: i,
      origLayout: this.cloneLayout(layout),
      layout,
      zIndexMax: this.state.zIndexMax + 1,
      resizeDir: dir,
      prevLayouts: [...this.state.prevLayouts, this.state.layout],
      ratio: e.shiftKey ? reduceToLowestTerms(layout[i].w, layout[i].h) : null,
    });
    window.addEventListener("mousemove", this._handleDragResize);
    window.addEventListener("mouseup", this._handleMouseUpResize);
  };

  _handleDragResize = (e) => {
    let state = {};
    e.preventDefault();
    e.stopPropagation();
    let layout = this.cloneLayout(this.state.origLayout);
    let pos = layout[this.state.dragIndex];
    let dX;
    let dY;
    if (e.shiftKey) {
      let ratio = this.state.ratio;
      if (!ratio) {
        ratio = reduceToLowestTerms(pos.w, pos.h);
        state.ratio = ratio;
      }
      dX =
        Math.round(
          (e.clientX - this.state.xStart) / (this.state.unit * 10 * ratio[0])
        ) *
        10 *
        ratio[0];
      dY = (dX * ratio[1]) / ratio[0];
      if (this.state.resizeDir === "sw" || this.state.resizeDir === "ne") {
        dY *= -1;
      }
    } else {
      dX =
        Math.round((e.clientX - this.state.xStart) / (this.state.unit * 10)) *
        10;
      dY =
        Math.round((e.clientY - this.state.yStart) / (this.state.unit * 10)) *
        10;
    }
    if (this.state.resizeDir === "se") {
      pos.w += dX;
      pos.h += dY;
    } else if (this.state.resizeDir === "sw") {
      pos.w -= dX;
      pos.h += dY;
      pos.x += dX;
    } else if (this.state.resizeDir === "ne") {
      pos.w += dX;
      pos.h -= dY;
      pos.y += dY;
    } else if (this.state.resizeDir === "nw") {
      pos.w -= dX;
      pos.h -= dY;
      pos.x += dX;
      pos.y += dY;
    }
    if (
      pos.w < MIN_SIZE ||
      pos.h < MIN_SIZE ||
      pos.w > CONTAINER_SIZE ||
      pos.x >= CONTAINER_SIZE ||
      pos.x + pos.w <= 0 ||
      pos.y + pos.h <= 0
    ) {
      return;
    }
    this.setState({ layout, ...state });
  };

  _handleMouseUpResize = (e) => {
    window.removeEventListener("mousemove", this._handleDragResize);
    window.removeEventListener("mouseup", this._handleMouseUpResize);
    let pos = this.state.layout[this.state.dragIndex];
    let state = { dragIndex: null, ratio: null };
    if ((pos.y + pos.h) * this.state.unit > this.state.containerHeight) {
      state.containerHeight = (pos.y + pos.h) * this.state.unit;
    } else {
      this.setState(state);
    }
  };

  _handleSaveLayout = () => {
    //save layout to the server
    //maybe a warning confirm if they try and navigate away with unsaved changes?
    //auto save, but also keep an old version so they can "undo save" or "cancel changes"
  };

  render() {
    let unit = this.state.unit;
    return (
      <div>
        <div
          style={{ cursor: "pointer", padding: 4 }}
          onClick={this._handleUndo}
        >
          <SVG.Undo height="24px" />
        </div>
        <div
          css={this.props.editing ? STYLES_CONTAINER_EDITING : STYLES_CONTAINER}
          style={{
            height: this.props.editing
              ? `calc(100vh + ${this.state.containerHeight}px)`
              : `${this.state.containerHeight}px`,
            backgroundSize: `${(CONTAINER_SIZE / 108) * this.state.unit}px ${
              10 * this.state.unit
            }px`,
            backgroundPosition: `-${
              (CONTAINER_SIZE / 220) * this.state.unit
            }px -${(CONTAINER_SIZE / 220) * this.state.unit}px`,
          }}
          ref={(c) => {
            this._ref = c;
          }}
        >
          {this.state.layout.map((pos, i) => (
            <div
              css={this.props.editing ? STYLES_ITEM_EDITING : STYLES_ITEM}
              key={i}
              name={i}
              onMouseEnter={() => this.setState({ hover: i })}
              onMouseLeave={() => this.setState({ hover: null })}
              onMouseDown={
                this.props.editing
                  ? (e) => this._handleMouseDown(e, i)
                  : () => {}
              }
              style={{
                top: pos.y * unit,
                left: pos.x * unit,
                zIndex: pos.z,
              }}
            >
              <div
                css={STYLES_FILE_BOX}
                style={{
                  height: pos.h * unit,
                  width: pos.w * unit,
                  boxShadow: this.props.editing
                    ? this.state.hover === i || this.state.dragIndex === i
                      ? `0 0 0 1px inset ${Constants.system.brand}`
                      : `0 0 0 1px inset ${Constants.system.lightBorder}`
                    : null,
                }}
              >
                <SlateMediaObjectPreview
                  charCap={70}
                  type={this.props.items[i].type}
                  url={this.props.items[i].url}
                  title={this.props.items[i].title || this.props.items[i].name}
                  //   style={{ height: pos.h * unit, width: pos.w * unit }}
                  //   imageStyle={{ height: pos.h * unit, width: pos.w * unit }}
                  style={{ maxHeight: "inherit" }}
                />
                {this.props.editing ? (
                  <React.Fragment>
                    <div
                      css={STYLES_HANDLE_BOX}
                      onMouseDown={(e) =>
                        this._handleMouseDownResize(e, i, "nw")
                      }
                      style={{
                        top: "-4px",
                        left: "-4px",
                        opacity:
                          this.state.hover === i || this.state.dragIndex === i
                            ? "1"
                            : "0",
                        cursor: "nwse-resize",
                      }}
                    >
                      <div css={STYLES_HANDLE} />
                    </div>
                    <div
                      css={STYLES_HANDLE_BOX}
                      onMouseDown={(e) =>
                        this._handleMouseDownResize(e, i, "ne")
                      }
                      style={{
                        top: "-4px",
                        right: "-4px",
                        opacity:
                          this.state.hover === i || this.state.dragIndex === i
                            ? "1"
                            : "0",
                      }}
                    >
                      <div css={STYLES_HANDLE} />
                    </div>
                    <div
                      css={STYLES_HANDLE_BOX}
                      onMouseDown={(e) =>
                        this._handleMouseDownResize(e, i, "sw")
                      }
                      style={{
                        bottom: "-4px",
                        left: "-4px",
                        opacity:
                          this.state.hover === i || this.state.dragIndex === i
                            ? "1"
                            : "0",
                      }}
                    >
                      <div css={STYLES_HANDLE} />
                    </div>
                    <div
                      css={STYLES_HANDLE_BOX}
                      onMouseDown={(e) =>
                        this._handleMouseDownResize(e, i, "se")
                      }
                      style={{
                        bottom: "-4px",
                        right: "-4px",
                        opacity:
                          this.state.hover === i || this.state.dragIndex === i
                            ? "1"
                            : "0",
                        cursor: "nwse-resize",
                      }}
                    >
                      <div css={STYLES_HANDLE} />
                    </div>
                  </React.Fragment>
                ) : null}
              </div>
              {/* <div
                  css={STYLES_HANDLE_BOX}
                  onMouseDown={(e) => this._handleMouseDownResize(e, i, "se")}
                  style={{
                    bottom: "0px",
                    right: "0px",
                    opacity:
                      this.state.hover === i && this.state.dragIndex !== i
                        ? "1"
                        : "0",
                    cursor: "nwse-resize",
                    height: "20px",
                    width: "20px",
                  }}
                >
                  <SVG.ResizeHandle
                    height="16px"
                    style={{
                      color: Constants.system.brand,
                    }}
                  />
                </div> */}
            </div>
          ))}
          {this.state.measuring
            ? this.props.items.map((data, i) => (
                <div id={`measuring-box-${i}`} key={i} css={STYLES_HIDDEN}>
                  <div style={{ maxHeight: SIZE, maxWidth: SIZE }}>
                    <SlateMediaObjectPreview
                      charCap={70}
                      type={data.type}
                      url={data.url}
                      title={data.title || data.name}
                      style={{ height: SIZE, width: SIZE }}
                      imageStyle={{ maxHeight: "inherit" }}
                    />
                  </div>
                </div>
              ))
            : null}
        </div>
      </div>
    );
  }
}
