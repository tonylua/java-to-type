const TypeMap: {
  boolean: "Boolean";
  Date: "String";
  char: "String";
  "char[]": "String";
  byte: "String";
  short: "Number";
  int: "Number";
  Integer: "Number";
  long: "Number";
  float: "Number";
  double: "Number";
};

module.exports.getJSType = function getJSType(javaType: string) {
  const arrRe: RegExp = /(?:\w*)List<(?<itemType>\w+)>/g;
  if (arrRe.test(javaType)) {
    const m = new RegExp(arrRe).exec(javaType);
    return `${getJSType(m.groups.itemType)}[]`;
  }
  return TypeMap[javaType.toLowerCase()] || javaType;
};
