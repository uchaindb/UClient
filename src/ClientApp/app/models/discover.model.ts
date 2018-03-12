export type InfoTabType = "guide" | "faq" | "db" | "case";
export type ArticleType = { title: string, url: string, author: string, date: string };
export type ArticleList = { [index: string]: Array<ArticleType> };
