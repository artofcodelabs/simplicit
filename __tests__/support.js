export const waitFor = (predicate) =>
  new Promise((resolve, reject) => {
    const start = Date.now();

    const tick = () => {
      if (predicate()) return resolve();
      if (Date.now() - start >= 1000) return reject(new Error("timeout"));
      setTimeout(tick, 5);
    };

    tick();
  });
