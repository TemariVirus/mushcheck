import { createConnection } from "mysql2/promise";
import { parse } from "node-html-parser";

const connection = await createConnection({
  host: "URL TO YOUR DATABASE INSTANCE",
  user: "YOUR USERNAME",
  password: "YOUR PASSWORD",
  database: "mushcheck",
});
await connection.connect();

const query = `SELECT name FROM mushrooms`;
const names = await connection
  .execute(query)
  .then((res) => res[0])
  .then((rows) => rows.map((row) => row.name));

for (const name of names) {
  // Extract description from Wikipedia
  const wiki_url = `https://en.wikipedia.org/wiki/${name}`;
  const start_marker = /<div [^>]*class="mw-parser-output"[^>]*>/g;
  const end_marker = /<meta [^>]*property="mw:PageProp\/toc"[^>]*>/g;
  const description = await fetch(wiki_url)
    .then((res) => res.text())
    // Remove newlines
    .then((text) => text.replace(/\n/g, ""))
    // Get text inbetween markers (first portion of the article)
    .then((text) => text.split(start_marker)[1].split(end_marker)[0])
    // Get all top level <p> tags that don't have a class (content to be displayed)
    .then((text) =>
      parse(text)
        .childNodes.filter((node) => node.rawTagName == "p")
        .filter((node) => !node.classNames.length)
    )
    // Fix links
    .then((ps) => {
      // Get text from paragraphs
      const paragraphs = ps.map((p) => p.innerHTML);
      // Get all links
      const links = paragraphs.map(
        (p) => p.match(/<a[^>]*href="[^\"]+"[^>]*>[^<]+<\/a>/g) ?? []
      );
      // Fix links
      const new_links = links.map((paragraph_links) => {
        return paragraph_links.map((l) => {
          const groups = l.match(
            /<a([^>]*)href="([^\"]+)"([^>]*)>([^<]+)<\/a>/
          );
          if (groups[2].startsWith("/")) {
            groups[2] = "https://en.wikipedia.org" + groups[2];
          } else if (groups[2].startsWith("#")) {
            groups[2] = wiki_url + groups[2];
          } else if (groups[2].startsWith("http")) {
            // No need to fix link
          } else {
            console.warn("Unknown link type", groups[2]);
          }
          return `<a${groups[1]}href="${groups[2]}"${groups[3]}>${groups[4]}</a>`;
        });
      });
      // Replace links
      return paragraphs.map((p, i) => {
        for (let j = 0; j < links[i].length; j++) {
          p = p.replace(links[i][j], new_links[i][j]);
        }
        // Add back <p> tags
        return `<p>${p}</p>`;
      });
    })
    .then((text) => text.join(" "))
    // Append excerpt reference
    .then(
      (text) =>
        text +
        `<br><p><i>Auto-generated excerpt from <a href="${wiki_url}">Wikipedia, the free encyclopedia</a></i>.</p>`
    );

  console.log(description);
  // Update description in database
  const update_query = `UPDATE mushrooms SET description = ? WHERE name = ?`;
  await connection.execute(update_query, [description, name]);
}

await connection.end();
