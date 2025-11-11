import { Node, mergeAttributes } from "@tiptap/core";
import { commentState } from "./document.svelte";

const CommentNode = Node.create({
  name: "comment",
  group: "inline",
  inline: true,
  content: "inline*",
  addAttributes() {
    return {
      comment: {
        default: "",
        parseHTML: (element) => element.getAttribute("data"),
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "comment",
      },
    ];
  },
  renderHTML({ HTMLAttributes, node }) {
    return [
      "comment",
      mergeAttributes(HTMLAttributes, {
        data: node.attrs.comment,
      }),
      0,
    ];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("span");
      dom.setAttribute("class", "underline bg-accent");
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
