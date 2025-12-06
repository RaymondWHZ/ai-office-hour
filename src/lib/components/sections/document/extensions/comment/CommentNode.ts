import { Node, mergeAttributes } from "@tiptap/core";
import { SvelteNodeViewRenderer } from "svelte-tiptap";
import CommentNodeView from "./CommentNodeView.svelte";

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
      title: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("data-title"),
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
    const attrs: Record<string, string> = {
      data: node.attrs.comment,
    };
    if (node.attrs.title) {
      attrs["data-title"] = node.attrs.title;
    }
    return ["comment", mergeAttributes(HTMLAttributes, attrs), 0];
  },

  addNodeView() {
    return SvelteNodeViewRenderer(CommentNodeView);
  },
});

export default CommentNode;
