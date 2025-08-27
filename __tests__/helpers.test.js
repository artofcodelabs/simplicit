import { helpers } from "index";

describe("#params", () => {
  it("fetches ID from URL", () => {
    window.history.replaceState({}, "", "/posts/123");
    expect(helpers.params).toEqual({ id: 123 });
  });
});
