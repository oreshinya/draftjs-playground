import React from 'react';
import {CompositeDecorator} from "draft-js";

const HIGHLIGHT_RULES = [
  {
    regex: /\@[\w]+/g,
    color: "rgb(98, 177, 254)"
  },
  {
    regex: /\#[\w]+/g,
    color: "rgb(95, 184, 138)"
  }
];

export default new CompositeDecorator(HIGHLIGHT_RULES.map(rule => (
  {
    strategy(contentBlock, callback) {
      const text = contentBlock.getText();
      let matchArr, start;
      while ((matchArr = rule.regex.exec(text)) !== null) {
        start = matchArr.index;
        callback(start, start + matchArr[0].length);
      }
    },
    component(props) {
      return <span {...props} style={{
        color: rule.color,
        direction: "ltr",
        unicodeBidi: "bidi-override",
      }}>{props.children}</span>;
    },
  }
)));
