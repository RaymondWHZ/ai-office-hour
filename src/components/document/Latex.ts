import { mergeAttributes, Node } from "@tiptap/core";
import { latexState } from "./latex.svelte";
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
    return ({ node, view, getPos, editor }) => {
      const dom = document.createElement("span");
      katex.render(node.attrs.latex, dom, {
        throwOnError: false,
      });
      dom.addEventListener("click", (event) => {
        event.preventDefault();
        latexState.dom = dom;
        latexState.latex = node.attrs.latex;
        latexState.update = (latex) => {
          if (latex === node.attrs.latex) return;
          console.log("edit");
          const pos = getPos();
          if (!pos) return;
          view.dispatch(
            view.state.tr.setNodeMarkup(pos, undefined, {
              latex,
            }),
          );
          editor.commands.focus();
        };
      });

      return {
        dom,
      };
    };
  },
});

export default LatexNode;
