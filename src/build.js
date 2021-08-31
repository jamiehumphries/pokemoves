const axios = require("axios").default;
const cheerio = require("cheerio");
const fs = require("fs");
const nunjucks = require("nunjucks");
const { join } = require("path");
const rimraf = require("rimraf");

const PVPOKE_FORMAT_SELECT =
  "https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/modules/formatselect.php";

const root = "docs";
rimraf.sync(root);

const views = join(__dirname, "views");
nunjucks.configure(views);

fs.mkdirSync(root);
fs.writeFileSync(join(root, ".nojekyll"), "");
fs.writeFileSync(join(root, "CNAME"), "www.pokemoves.com");

async function build() {
  const formats = await getFormats();
  for (const format of formats) {
    const { cup, value } = format;
    const html = getHtml(format);
    const dir = join(root, cup, value);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(join(dir, "index.html"), html);
  }
}

async function getFormats() {
  const data = await axios.get(PVPOKE_FORMAT_SELECT).then((res) => res.data);
  const $ = cheerio.load(data);
  return $("option")
    .map((_, el) => {
      const { cup, value } = el.attribs;
      const name = el.children[0].data;
      return { cup, value, name };
    })
    .get();
}

function getHtml(format) {
  return nunjucks.render("format.njk", { format });
}

build();
