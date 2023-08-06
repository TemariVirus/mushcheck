import { get } from 'svelte/store';
import { user_id } from '$lib/stores/persistent';

export async function getJson(url: string) {
	return fetch(url)
		.then((r) => {
			return r.ok ? r.json() : Promise.reject(r);
		})
		.catch(async (e) => {
			console.error(e);
			return {
				status: e.status ?? 404,
				body: e.body ?? 'Something went wrong',
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
