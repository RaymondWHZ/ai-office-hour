import { Node } from "@tiptap/core";
import { SvelteNodeViewRenderer } from "svelte-tiptap";
import CardNodeView from "./CardNodeView.svelte";

const CardNode = Node.create({
  name: "Card",
  group: "block",
  content: "block+",

  parseHTML() {
    return [
      {
        tag: "card",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["card", HTMLAttributes, 0];
  },

  addNodeView() {
    return SvelteNodeViewRenderer(CardNodeView);
  },
});

export default CardNode;
