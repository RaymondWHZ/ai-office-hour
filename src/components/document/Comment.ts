import { mergeAttributes, Node } from "@tiptap/core";
import { commentState } from "./comment.svelte";

const CommentNode = Node.create({
  name: "comment",
  group: "inline",
  inline: true,
  content: "inline*",
  addAttributes() {
    return {
      comment: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-comment"),
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "span[data-type='comment']",
      },
    ];
  },
  renderHTML({ HTMLAttributes, node }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": "comment",
        "data-comment": node.attrs.comment,
      }),
      0,
    ];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("span");
      dom.setAttribute("class", "underline");
      dom.addEventListener("mouseover", () => {
        commentState.dom = dom;
        commentState.comment = node.attrs.comment;
      });
      dom.addEventListener("mouseout", () => {
        commentState.dom = undefined;
      });

      const contentDOM = document.createElement("span");
      dom.append(contentDOM);

      return {
        dom,
        contentDOM,
      };
    };
  },
});

export default CommentNode;
