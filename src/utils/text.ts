module.exports.replaceQuote = (str: string, replaceTo: string = "") =>
  str.replace(/^"/, replaceTo).replace(/"$/, replaceTo);

module.exports.formatParagraph = (str: string) =>
  str.replace(/\n\s*\n/gm, "\n").trim();
