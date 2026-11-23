import { load } from "../../../src/start/model/load";
import { Model } from "index";

class Article extends Model {
  static name = "article";
}

describe("load", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    Article.load([]);
  });

  it("hydrates a Model from an in-place JSON script and removes the script", () => {
    document.body.innerHTML = `
      <script type="application/json" data-model="article">
        [{"id":1,"title":"A"},{"id":2,"title":"B"}]
      </script>`;

    load(document.body, [Article]);

    expect(Article.loaded).toHaveLength(2);
    expect(Article.loaded[0].title).toBe("A");
    expect(
      document.querySelectorAll('script[data-model="article"]'),
    ).toHaveLength(0);
  });

  it("hydrates multiple model scripts in one pass", () => {
    class Author extends Model {
      static name = "author";
    }
    document.body.innerHTML = `
      <script type="application/json" data-model="article">[{"id":1,"title":"A"}]</script>
      <script type="application/json" data-model="author">[{"id":1,"name":"X"}]</script>`;

    load(document.body, [Article, Author]);

    expect(Article.loaded).toHaveLength(1);
    expect(Author.loaded).toHaveLength(1);
  });

  it("throws for a data-model script with no matching Model", () => {
    document.body.innerHTML = `
      <script type="application/json" data-model="unknown">[{"id":1}]</script>`;

    expect(() => load(document.body, [Article])).toThrow(
      /data-model="unknown"/,
    );
  });
});
