const fs = require("fs");

export const readJava = (filePath: string) => {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (ex) {
    console.error("read error:", filePath);
    return null;
  }
};
