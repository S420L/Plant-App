// Used for preventing too many renders/ function calls in sequence
export const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      const context = this;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = null;
        func.apply(context, args);
      }, wait);
    };
  };