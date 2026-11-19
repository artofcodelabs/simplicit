import Model from "model";

describe("Model", () => {
  class Article extends Model {
    static name = "article";
  }

  beforeEach(() => {
    Article.load([]);
  });

  it("hydrates a collection of instances from plain data", () => {
    Article.load([
      { id: 1, title: "A" },
      { id: 2, title: "B" },
    ]);

    expect(Article.loaded).toHaveLength(2);
    expect(Article.loaded[0]).toBeInstanceOf(Article);
    expect(Article.loaded[0].title).toBe("A");
  });

  it("finds a record by id, coercing string/number", () => {
    Article.load([{ id: 7, title: "Seven" }]);
    expect(Article.byId(7).title).toBe("Seven");
    expect(Article.byId("7").title).toBe("Seven");
    expect(Article.byId(99)).toBeNull();
  });

  it("appends a record with create()", () => {
    Article.load([{ id: 1 }]);
    const created = Article.add({ id: 2 });

    expect(Article.loaded).toHaveLength(2);
    expect(Article.loaded[1]).toBe(created);
  });

  it("removes a record with delete() and fires onChange", () => {
    Article.load([{ id: 1 }, { id: 2 }]);
    let calls = 0;
    Article.onChange(() => calls++);

    Article.byId(1).del();

    expect(Article.loaded).toHaveLength(1);
    expect(Article.loaded[0].id).toBe(2);
    expect(Article.byId(1)).toBeNull();
    expect(calls).toBe(1);
  });

  it("bind() wires the two-way relation: record.components <-> component.model", () => {
    Article.load([{ id: 1 }]);
    const record = Article.loaded[0];
    const component = { update: () => {} };

    record.bind(component);

    expect(record.components).toEqual([component]);
    expect(component.model).toBe(record);
  });

  it("re-renders only the components bound to the updated record", () => {
    Article.load([
      { id: 1, title: "A" },
      { id: 2, title: "B" },
    ]);
    const [a, b] = Article.loaded;
    let aRenders = 0;
    let bRenders = 0;
    a.bind({ update: () => aRenders++ });
    b.bind({ update: () => bRenders++ });

    a.update({ title: "A2" });

    expect(a.title).toBe("A2");
    expect(aRenders).toBe(1);
    expect(bRenders).toBe(0);
  });

  it("stops re-rendering a record's component after unbind", () => {
    Article.load([{ id: 1 }]);
    const record = Article.loaded[0];
    let renders = 0;
    const component = { update: () => renders++ };
    record.bind(component);
    record.unbind(component);

    record.update({ title: "x" });

    expect(renders).toBe(0);
    expect(record.components).toEqual([]);
  });

  it("fires collection-level onChange on load and create, until unsubscribed", () => {
    let calls = 0;
    const off = Article.onChange(() => calls++);

    Article.load([{ id: 1 }]);
    Article.add({ id: 2 });
    off();
    Article.add({ id: 3 });

    expect(calls).toBe(2);
  });

  it("isolates collections per subclass", () => {
    class Author extends Model {
      static name = "author";
    }
    Article.load([{ id: 1 }]);
    Author.load([{ id: 1 }]);

    expect(Article.loaded).toHaveLength(1);
    expect(Author.loaded[0]).not.toBeInstanceOf(Article);
  });
});
