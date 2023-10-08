import {DefaultParserMeta} from '../utils/constants';
import type {
  IParser,
  ParserMeta,
  ParseType,
  ParseResult,
} from "../types/Parser";

abstract class BaseParser implements IParser {
  protected javaCode: string;
  protected javaPath: string;
  protected meta: ParserMeta;

  constructor(
    javaCode: string,
    javaPath: string,
    meta?: ParserMeta
  ) {
    this.javaCode = javaCode;
    this.javaPath = javaPath;
    this.meta = {
      ...DefaultParserMeta,
      ...meta
    };
    return this;
  }

  abstract parse(type: ParseType): ParseResult
}

export default BaseParser;
