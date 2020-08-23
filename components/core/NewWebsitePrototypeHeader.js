import * as React from "react";
import * as Constants from "~/common/constants";

import { css } from "@emotion/react";

const STYLES_CONTAINER = css`
  font-family: ${Constants.font.code};
  font-size: 12px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 88px;
  postion: fixed;
  top: 0px;
  position: -webkit-sticky;
  position: sticky;
  z-index: 3;
  height: 88px;

  @media (max-width: ${Constants.sizes.mobile}px) {
    display: block;
  }
`;

const STYLES_LINK = css`
  color: ${Constants.system.pitchBlack};
  text-decoration: none;
  transition: 200ms ease color;

  :visited {
    color: ${Constants.system.black};
  }

  :hover {
    color: ${Constants.system.brand};
  }
`;

const STYLES_LEFT = css`
  flex-shrink: 0;
  padding: 12px 0 12px 0;
`;

const STYLES_RIGHT = css`
  min-width: 10%;
  width: 100%;
  display: flex;
  justify-content: flex-end;
  padding: 12px 0 12px 0;

  @media (max-width: ${Constants.sizes.mobile}px) {
    justify-content: center;
  }
`;

export default (props) => {
  return (
    <div css={STYLES_CONTAINER} style={props.style}>
      <div css={STYLES_LEFT}>
        <a
          css={STYLES_LINK}
          href="/"
          style={{ marginRight: 24, fontFamily: Constants.font.codeBold }}
        >
          Slate {Constants.values.version}
        </a>
      </div>
      <div css={STYLES_RIGHT}>
        <a css={STYLES_LINK} style={{ marginRight: 24 }} href="/_/system">
          Design System
        </a>
        <a
          css={STYLES_LINK}
          style={{ marginRight: 24 }}
          href="https://github.com/filecoin-project/slate"
        >
          Community
        </a>
        <a css={STYLES_LINK} href="https://github.com/filecoin-project/slate">
          Download
        </a>
      </div>
    </div>
  );
};
