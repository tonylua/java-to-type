// https://www.typescriptlang.org/docs/handbook/interfaces.html#difference-between-the-static-and-instance-sides-of-classes

export interface ParserContructor {
  new(javaCode: string, javaPath: string): IParser;
}

export interface IParser {
  parse: () => {result: string; javaPath: string};
}
