const TypeMap = {
  boolean: "Boolean",
  Date: "String",
  char: "String",
  "char[]": "String",
  byte: "String",
  short: "Number",
  int: "Number",
  Integer: "Number",
  long: "Number",
  float: "Number",
  double: "Number"
};

// https://github.com/microsoft/TypeScript/issues/36132#issuecomment-573141594
export const getJSType = function getJSType(javaType: string) {
  // const arrRe: RegExp = /(?:\w*)List<(?<itemType>\w+)>/g;
  const arrRe: RegExp = /(?:\w*)List<(\w+)>/g;
  if (arrRe.test(javaType)) {
    const m = new RegExp(arrRe).exec(javaType);
    // return `${getJSType(m.groups.itemType)}[]`;
    return `${getJSType(m[1])}[]`;
  }
  return TypeMap[javaType.toLowerCase()] || javaType;
};
