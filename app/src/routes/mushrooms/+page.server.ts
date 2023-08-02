import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { parse } from 'node-html-parser';

export const load = (async ({ url }) => {
	const name = url.searchParams.get('name') ?? '';
	const result = await fetch(
		`https://5yrf3rrviwwrb6xhu77445ssiy0kcsqb.lambda-url.us-east-1.on.aws?name=${name}`
	)
		.then((r) => (r.ok ? r.json() : Promise.reject(r)))
		.catch(async (e) => {
			console.error(e);
			return {
				error: true
			};
		});
	if (result.error) {
		throw error(404, 'Mushroom not found');
	}

	const { wiki_url, image_url } = result;
	const edible = result.edible == 0;

	const start_marker = /<div [^>]*class="mw-parser-output"[^>]*>/g;
	const end_marker = /<meta [^>]*property="mw:PageProp\/toc"[^>]*>/g;

	const description = await fetch(wiki_url)
		.then((response) => response.text())
		// Remove newlines
		.then((text) => text.replace(/\n/g, ''))
		// Get text inbetween markers (first portion of the article)
		.then((text) => text.split(start_marker)[1].split(end_marker)[0])
		// Get all top level <p> tags that don't have a class (content to be displayed)
		.then((text) =>
			parse(text)
				.childNodes.filter((node: any) => node.rawTagName == 'p')
				.filter((node: any) => !node.classNames.length)
		)
		// Fix links
		.then((ps) => {
			// Get text from paragraphs
			const paragraphs = ps.map((p: any) => p.innerHTML as string);
			// Get all links
			const links = paragraphs.map((p) => p.match(/<a[^>]*href="[^\"]+"[^>]*>[^<]+<\/a>/g) ?? []);
			// Fix links
			const new_links = links.map((paragraph_links) => {
				return paragraph_links.map((l) => {
					const groups = l.match(/<a([^>]*)href="([^\"]+)"([^>]*)>([^<]+)<\/a>/)!;
					if (groups[2].startsWith('/')) {
						groups[2] = 'https://en.wikipedia.org' + groups[2];
					} else if (groups[2].startsWith('#')) {
						groups[2] = wiki_url + groups[2];
					} else if (groups[2].startsWith('http')) {
						// No need to fix link
					} else {
						console.warn('Unknown link type', groups[2]);
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
		.then((text) => text.join(' '))
		// Append excerpt reference
		.then(
			(text) =>
				text +
				`<br><p><i>Auto-generated excerpt from <a href="${wiki_url}">Wikipedia, the free encyclopedia</a></i>.</p>`
		);

	return {
		props: {
			name,
			description,
			image_url,
			edible
		}
	};
}) satisfies PageServerLoad;
