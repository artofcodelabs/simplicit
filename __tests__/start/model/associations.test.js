import Model from "model";
import {
  wireAssociations,
  pluralize,
  foreignKey,
} from "start/model/associations.js";

describe("associations", () => {
  class Article extends Model {
    static name = "Article";
  }
  class Author extends Model {
    static name = "Author";
  }
  class Comment extends Model {
    static name = "Comment";
    static belongsTo = [Article, Author]; // hasMany inverses are inferred
  }
  // Unrelated Model, to prove inference doesn't pollute the shared base array.
  class Tag extends Model {
    static name = "Tag";
  }

  wireAssociations([Article, Author, Comment, Tag]);

  beforeEach(() => {
    Article.load([{ id: 1 }, { id: 2 }]);
    Author.load([{ id: 9 }]);
    Comment.load([
      { id: 1, article_id: 1, author_id: 9 },
      { id: 2, article_id: 1 },
      { id: 3, article_id: 2 },
    ]);
  });

  it("derives foreign key and plural accessor name", () => {
    expect(foreignKey(Article)).toBe("article_id");
    expect(pluralize(Comment.name)).toBe("comments");
  });

  it("infers hasMany inverses from belongsTo without polluting siblings", () => {
    expect(Article.hasMany).toEqual([Comment]);
    expect(Author.hasMany).toEqual([Comment]);
    expect(Tag.hasMany).toEqual([]); // unrelated Model untouched
  });

  it("has many: resolves children by foreign key (string/number coerced)", () => {
    expect(Article.byId(1).comments.map((c) => c.id)).toEqual([1, 2]);
    expect(Article.byId(2).comments.map((c) => c.id)).toEqual([3]);
  });

  it("belongs to: resolves each owner record independently", () => {
    expect(Comment.byId(3).article).toBe(Article.byId(2));
    expect(Comment.byId(1).author).toBe(Author.byId(9));
    expect(Comment.byId(2).author).toBeNull(); // no author_id
  });

  it("reflects live collection changes", () => {
    Comment.add({ id: 4, article_id: 2 });
    expect(Article.byId(2).comments.map((c) => c.id)).toEqual([3, 4]);
  });
});
