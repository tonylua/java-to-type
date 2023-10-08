export const replaceQuote = (str: string, replaceTo: string = "") =>
  str.replace(/^"/, replaceTo).replace(/"$/, replaceTo);

export const formatParagraph = (str: string) =>
  str.replace(/\n\s*\n/gm, "\n").trim();
