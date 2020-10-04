import * as React from "react";
import * as Constants from "~/common/constants";
import * as SVG from "~/common/svg";

import SlateMediaObjectPreview from "~/components/core/SlateMediaObjectPreview";

import { css } from "@emotion/react";

const SIZE = 200;
const MARGIN = 16;
const CONTAINER_SIZE = 5 * SIZE + 4 * MARGIN;

export const generateLayout = (items) => {
  if (!items) {
    return [];
  }

  if (!items.length) {
    return [];
  }

  return items.map((item, i) => {
    return {
      x: (i % 5) * (SIZE + MARGIN), //NOTE(martina): sets 200px as the standard width and height for a 1064px wide layout (scales accordingly) with 16px margin
      y: Math.floor(i / 5) * (SIZE + MARGIN),
      w: 200,
      h: 200,
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
  height: 200vh; /* TODO(martina): make this calculated based off lowest item position and height, not a set number like this */
  overflow: hidden;
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

  state = {
    unit: 10,
    layout: this.props.layout
      ? this.props.layout
      : generateLayout(this.props.items),
    measuring: true,
    hover: null,
  };

  componentDidMount = () => {
    this.calculateUnit();
    window.addEventListener("resize", this._calculateUnit);
    if (!this.props.layout) {
      this.calculateGrid();
    }
    this.setState({ measuring: false });
  };

  componentWillUnmount = () => {
    window.removeEventListener("resize", this._calculateUnit);
  };

  calculateUnit = () => {
    let width = this._ref.clientWidth;
    //if width under a certain amount, set to a default mobile flex or grid layout of single items
    this.setState({ unit: width / CONTAINER_SIZE });
  };

  calculateGrid = () => {
    //only do generate layout and adjust to center if something has been added or removed, then save it after that. don't do it again for viewers
    let layout = this.state.layout;
    for (let i = 0; i < layout.length; i++) {
      let elem = document.getElementById(`measuring-box-${i}`);
      let width = elem.clientWidth;
      let height = elem.clientHeight;
      layout[i] = {
        x: layout[i].x + (SIZE - width) / 2, //NOTE(martina): manual adjustment to center justify and align items in their "box"
        y: layout[i].y + (SIZE - height) / 2,
        h: height,
        w: width,
        ratio: height / width,
      };
    }
    this.setState({ layout });
  };

  _handleMouseDown = (e, i) => {
    e.stopPropagation();
    e.preventDefault();
    this.setState({ xStart: e.clientX, yStart: e.clientY, dragIndex: i });
    window.addEventListener("mousemove", this._handleDrag);
    window.addEventListener("mouseup", this._handleMouseUp);
  };

  _handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    let layout = this.state.layout;
    layout[this.state.dragIndex].x +=
      (e.clientX - this.state.xStart) / this.state.unit;
    layout[this.state.dragIndex].y +=
      (e.clientY - this.state.yStart) / this.state.unit;
    console.log(layout[this.state.dragIndex]);
    this.setState({ layout, xStart: e.clientX, yStart: e.clientY });
  };

  _handleMouseUp = (e) => {
    window.removeEventListener("mousemove", this._handleDrag);
    window.removeEventListener("mouseup", this._handleMouseUp);
    this.setState({ dragIndex: null });
  };

  _handleMouseDownResize = (e, i, dir) => {
    e.stopPropagation();
    e.preventDefault();
    this.setState({
      xStart: e.clientX,
      yStart: e.clientY,
      dragIndex: i,
      dragDirection: dir,
      isImage: this.props.items[i].type.startsWith("image/"),
    });
    window.addEventListener("mousemove", this._handleDragResize);
    window.addEventListener("mouseup", this._handleMouseUpResize);
  };

  _handleDragResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    let layout = this.state.layout;
    let dX = (e.clientX - this.state.xStart) / this.state.unit;
    let dY = (e.clientY - this.state.yStart) / this.state.unit;
    let pos = layout[this.state.dragIndex];
    if (this.state.isImage) {
      if ((dX * e.clientY) / e.clientX > dY) {
        dY = dX * pos.ratio;
      } else {
        dX = dY / pos.ratio;
      }
    }
    pos.w += dX;
    pos.h += dY;
    this.setState({ layout, xStart: e.clientX, yStart: e.clientY });
  };

  _handleMouseUpResize = (e) => {
    window.removeEventListener("mousemove", this._handleDragResize);
    window.removeEventListener("mouseup", this._handleMouseUpResize);
    this.setState({ dragIndex: null });
  };

  _handleSaveLayout = () => {
    //save layout to the server
    //maybe a warning confirm if they try and navigate away with unsaved changes?
    //auto save, but also keep an old version so they can "undo save" or "cancel changes"
  };

  render() {
    let unit = this.state.unit;
    return (
      <div
        css={STYLES_CONTAINER}
        style={
          this.props.editing
            ? { border: `1px dashed ${Constants.system.border}` }
            : null
        }
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
              this.props.editing ? (e) => this._handleMouseDown(e, i) : () => {}
            }
            style={{
              top: pos.y * unit,
              left: pos.x * unit,
            }}
          >
            <div
              style={{
                height: pos.h * unit,
                width: pos.w * unit,
                position: "relative",
              }}
            >
              <SlateMediaObjectPreview
                charCap={70}
                type={this.props.items[i].type}
                url={this.props.items[i].url}
                title={this.props.items[i].title || this.props.items[i].name}
                style={{ height: pos.h * unit, width: pos.w * unit }}
                imageStyle={{ height: pos.h * unit, width: pos.w * unit }}
              />
              {this.props.editing ? (
                <div
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
                </div>
              ) : null}
            </div>

            {/* <React.Fragment>
                  <div
                    css={STYLES_HANDLE_BOX}
                    onMouseDown={(e) => this._handleMouseDownResize(e, i, "nw")}
                    style={{
                      top: "-4px",
                      left: "-4px",
                      opacity: this.state.hover === i ? "1" : "0",
                      cursor: "nwse-resize",
                    }}
                  >
                    <div css={STYLES_HANDLE} />
                  </div>
                  <div
                    css={STYLES_HANDLE_BOX}
                    onMouseDown={(e) => this._handleMouseDownResize(e, i, "ne")}
                    style={{
                      top: "-4px",
                      right: "-4px",
                      opacity: this.state.hover === i ? "1" : "0",
                    }}
                  >
                    <div css={STYLES_HANDLE} />
                  </div>
                  <div
                    css={STYLES_HANDLE_BOX}
                    onMouseDown={(e) => this._handleMouseDownResize(e, i, "sw")}
                    style={{
                      bottom: "-4px",
                      left: "-4px",
                      opacity: this.state.hover === i ? "1" : "0",
                    }}
                  >
                    <div css={STYLES_HANDLE} />
                  </div>
                  <div
                    css={STYLES_HANDLE_BOX}
                    onMouseDown={(e) => this._handleMouseDownResize(e, i, "se")}
                    style={{
                      bottom: "-4px",
                      right: "-4px",
                      opacity: this.state.hover === i ? "1" : "0",
                      cursor: "nwse-resize",
                    }}
                  >
                    <div css={STYLES_HANDLE} />
                  </div>
                </React.Fragment> */}
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
    );
  }
}
