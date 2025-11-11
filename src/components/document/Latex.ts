import { mergeAttributes, Node } from "@tiptap/core";
import { commentState } from "./comment.svelte";
import katex from "katex";

const LatexNode = Node.create({
  name: "latex",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => element.getAttribute("data"),
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "latex",
      },
    ];
  },
  renderHTML({ HTMLAttributes, node }) {
    return [
      "latex",
      mergeAttributes(HTMLAttributes, {
        data: node.attrs.latex,
      }),
    ];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("span");
      katex.render(node.attrs.latex, dom, {
        throwOnError: false,
      });
      dom.addEventListener("click", (event) => {
        event.preventDefault();
        commentState.dom = dom;
        commentState.comment = node.attrs.latex;
      });

      return {
        dom,
      };
    };
  },
});

export default LatexNode;
