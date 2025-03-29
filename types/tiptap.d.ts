// tiptap.d.ts (or wherever your type declarations live)
import "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customIconList: {
      toggleCustomIconList: () => ReturnType;
    };
  }
}
