const fetchParams = (url = window.location.href) => {
  const match = /https?:\/\/.+\/\w+\/(\d+)/.exec(url);
  const params = match !== null ? { id: parseInt(match[1]) } : {};
  const query = url.includes("?") ? url.split("?").pop() : "";
  return Object.assign(params, Object.fromEntries(new URLSearchParams(query)));
};

export default {
  get params() {
    return fetchParams();
  },
};
