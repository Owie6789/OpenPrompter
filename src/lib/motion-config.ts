export const motionConfig = {
  isLowEnd() {
    if (typeof navigator === "undefined") return false
    return navigator.hardwareConcurrency <= 4
  },

  prefersReduced() {
    if (typeof globalThis.window === "undefined") return false
    return globalThis.window.matchMedia("(prefers-reduced-motion: reduce)").matches
  },

  shouldAnimate({ essential = false } = {}) {
    if (this.prefersReduced()) return false
    if (!essential && this.isLowEnd()) return false
    return true
  },
}
