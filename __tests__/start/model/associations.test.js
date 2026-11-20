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

  it("snake_cases multi-word foreign keys; pluralizes consonant + y as -ies", () => {
    expect(foreignKey({ name: "BlogPost" })).toBe("blog_post_id");
    expect(pluralize("BlogPost")).toBe("blogPosts"); // getters stay camelCase
    expect(pluralize("Category")).toBe("categories");
    expect(pluralize("Day")).toBe("days"); // vowel + y keeps the y
  });

  it("resolves multi-word associations through the snake_case key", () => {
    class BlogPost extends Model {
      static name = "BlogPost";
    }
    class Category extends Model {
      static name = "Category";
      static belongsTo = [BlogPost];
    }
    wireAssociations([BlogPost, Category]);

    BlogPost.load([{ id: 1 }]);
    Category.load([{ id: 5, blog_post_id: 1 }]);

    expect(BlogPost.byId(1).categories.map((c) => c.id)).toEqual([5]);
    expect(Category.byId(5).blogPost.id).toBe(1);
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

describe("namespaced model names", () => {
  it("names association members after the final segment", () => {
    class Post extends Model {
      static name = "Post";
    }
    class Remark extends Model {
      static name = "Post.Remark";
      static belongsTo = [Post];
    }
    wireAssociations([Post, Remark]);

    Post.load([{ id: 1 }]);
    Remark.load([{ id: 10, post_id: 1 }]);

    expect(Post.byId(1).remarks.map((r) => r.id)).toEqual([10]);
    expect(Remark.byId(10).post.id).toEqual(1);
  });
});
