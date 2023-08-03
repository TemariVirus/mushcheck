export function getJson(url: string) {
	return fetch(url)
		.then((r) => (r.ok ? r.json() : Promise.reject(r)))
		.catch(async (e) => {
			console.error(e);
			return {
				error: true
			};
		});
}
