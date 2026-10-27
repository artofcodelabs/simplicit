import { start, Component, Model } from "index";
import { waitFor } from "../../support";

// A comment thread: Article has many Comment, and a Comment belongs to a
// Comment (a reply), so comment containers nest into themselves recursively.
class ArticleCard extends Component {
  static name = "article-card";
  static template = ({ id, title }) => `
    <div data-component="article-card" data-key="${id}">
      <h4>${title}</h4>
      <ul data-container-component="comment-item"></ul>
    </div>`;
}

class CommentItem extends Component {
  static name = "comment-item";
  static template = ({ id, body }) => `
    <li data-component="comment-item" data-key="${id}">
      <span>${body}</span>
      <ul data-container-component="comment-item"></ul>
    </li>`;
}

class Article extends Model {
  static name = "article";
  static components = [ArticleCard];
}

class Comment extends Model {
  static name = "comment";
  static components = [CommentItem];
  static belongsTo = [Article, Comment];
}

const byKey = (id) =>
  document.querySelectorAll(
    `[data-component="comment-item"][data-key="${id}"]`,
  );

// direct child comment-items of the container inside comment `id`
const childrenOf = (id) =>
  Array.from(
    byKey(id)[0].querySelectorAll(
      ":scope > ul[data-container-component='comment-item'] > [data-component='comment-item']",
    ),
  ).map((el) => el.dataset.key);

describe("nested self-referential comments", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div data-container-component="article-card"></div>
      <script type="application/json" data-model="article">[{"id":1,"title":"A"}]</script>
      <script type="application/json" data-model="comment">
        [{"id":1,"article_id":1,"body":"root"},
         {"id":2,"comment_id":1,"body":"reply to 1"}]
      </script>`;
    start({ root: document, models: [Article, Comment] });
  });

  it("nests a reply under its parent, not the whole collection", () => {
    // A root carries article_id; a reply carries comment_id. So the article's
    // container shows only roots, and each comment's own container shows its
    // replies — resolved by owner data-key, independent of bind timing.
    expect(childrenOf(1)).toEqual(["2"]); // root's container → its reply
    expect(childrenOf(2)).toEqual([]); // reply's container → empty
    expect(byKey(2)).toHaveLength(1);
  });

  it("a new reply renders once — under its parent, not inside itself", async () => {
    Comment.add({ id: 3, comment_id: 2, body: "reply to 2" });

    await waitFor(() => byKey(3).length >= 1);
    await new Promise((r) => setTimeout(r, 50)); // let the observer settle

    // The bug rendered the new reply twice: once correctly under comment 2, and
    // once inside its OWN container (owner resolution climbed to the grandparent
    // because the freshly-inserted node wasn't bound yet).
    expect(byKey(3)).toHaveLength(1);
    expect(childrenOf(2)).toEqual(["3"]);
    expect(childrenOf(3)).toEqual([]);
  });
});
