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
      hint: {
        default: "",
        parseHTML: (element) => element.getAttribute("hint") || "",
      },
      status: {
        default: "",
        parseHTML: (element) => element.getAttribute("status") || "",
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
        hint: node.attrs.hint,
        status: node.attrs.status,
      }),
      0,
    ];
  },

  addNodeView() {
    return SvelteNodeViewRenderer(ResponseNodeView);
  },
});

export default ResponseNode;
