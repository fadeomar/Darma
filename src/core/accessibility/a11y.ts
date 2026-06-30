export const CORE_TOUCH_TARGET_PX = 44;

export const createAriaLabel = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(" · ");

export const rovingTabIndex = (activeIndex: number, index: number) => (activeIndex === index ? 0 : -1);
