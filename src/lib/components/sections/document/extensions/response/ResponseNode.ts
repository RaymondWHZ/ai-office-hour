import { Node, mergeAttributes } from "@tiptap/core";
import { SvelteNodeViewRenderer } from "svelte-tiptap";
import ResponseNodeView from "./ResponseNodeView.svelte";

const ResponseNode = Node.create({
  name: "response",
  group: "block",
  content: "block+",

  addAttributes() {
    return {
      question: {
        default: "",
        parseHTML: (element) => element.getAttribute("question") || "",
      },
      submitted: {
        default: "false",
        parseHTML: (element) => element.getAttribute("submitted") || "false",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "response",
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "response",
      mergeAttributes(HTMLAttributes, {
        question: node.attrs.question,
        submitted: node.attrs.submitted,
      }),
      0,
    ];
  },

  addNodeView() {
    return SvelteNodeViewRenderer(ResponseNodeView);
  },
});

export default ResponseNode;
