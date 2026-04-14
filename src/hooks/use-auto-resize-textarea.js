import { useLayoutEffect } from "react";

export function useAutoResizeTextarea(textareaRef, value) {
  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [textareaRef, value]);
}
