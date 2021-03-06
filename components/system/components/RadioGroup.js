import * as React from "react";
import * as Constants from "~/common/constants";

import { css } from "@emotion/react";

import { DescriptionGroup } from "~/components/system/components/fragments/DescriptionGroup";

const STYLES_RADIO = css`
  box-sizing: border-box;
  font-family: ${Constants.font.text};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  position: relative;
  margin-bottom: 16px;
  cursor: pointer;
`;

const STYLES_RADIO_INPUT = css`
  box-sizing: border-box;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  height: 1px;
  width: 1px;
  position: absolute;
  top: 0;
  left: 0;
`;

const STYLES_RADIO_GROUP = css`
  box-sizing: border-box;
  display: block;
  width: 100%;
`;

const STYLES_RADIO_CUSTOM = css`
  box-sizing: border-box;
  box-shadow: 0 0 0 1px ${Constants.system.darkGray};
  background-color: ${Constants.system.white};
  cursor: pointer;
  height: 32px;
  width: 32px;
  border-radius: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  margin-right: 16px;
  flex-shrink: 0;
`;

const STYLES_RADIO_CUSTOM_SELECTED = css`
  box-sizing: border-box;
  background-color: ${Constants.system.brand};
  height: 24px;
  width: 24px;
  border-radius: 24px;
  pointer-events: none;
  opacity: 0;
  transition: 200ms ease opacity;
  z-index: 1;
`;

const STYLES_RADIO_LABEL = css`
  box-sizing: border-box;
  font-size: 14px;
  cursor: pointer;
  min-width: 10%;
  width: 100%;
  line-height: 1.5;
  padding-top: 4px;
  overflow-wrap: break-word;

  strong {
    font-family: ${Constants.font.semiBold};
    font-weight: 400;
  }
`;

export class RadioGroup extends React.Component {
  _handleChange = (value) => {
    this.props.onChange({
      target: { name: this.props.name, value },
    });
  };

  render() {
    return (
      <div>
        <DescriptionGroup
          full={this.props.full}
          tooltip={this.props.tooltip}
          label={this.props.label}
          description={this.props.description}
        />
        <form css={STYLES_RADIO_GROUP}>
          {this.props.options.map((radio) => {
            const checked = this.props.selected === radio.value;

            return (
              <label css={STYLES_RADIO} key={`radio-${radio.value}`}>
                <span css={STYLES_RADIO_CUSTOM}>
                  <span
                    css={STYLES_RADIO_CUSTOM_SELECTED}
                    style={{ opacity: checked ? 1 : 0 }}
                  />
                </span>
                <input
                  css={STYLES_RADIO_INPUT}
                  type="radio"
                  value={radio.value}
                  checked={checked}
                  onChange={() => this._handleChange(radio.value)}
                />{" "}
                <span css={STYLES_RADIO_LABEL}>{radio.label}</span>
              </label>
            );
          })}
        </form>
      </div>
    );
  }
}
