import { get } from 'svelte/store';
import { user_id } from '$lib/stores/persistent';

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

export function getUserId() {
	if (!get(user_id) || get(user_id)?.length !== 32) {
		user_id.set(crypto.randomUUID().replace(/-/g, ''));
	}

	localStorage.setItem('user_id', get(user_id));
	return get(user_id);
}
