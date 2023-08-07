import { get } from 'svelte/store';
import { user_id } from '$lib/stores/persistent';

export async function getJson(url: string) {
	return fetch(url).then(async (r) => {
		const body = await r.json();
		if (!r.ok) {
			console.error(body);
			return {
				status: r.status ?? 404,
				message: body.message ?? body.body ?? 'Something went wrong',
				error: true
			};
		}
		return body;
	});
}

export function getUserId() {
	if (!get(user_id) || get(user_id)?.length !== 32) {
		user_id.set(crypto.randomUUID().replace(/-/g, ''));
	}

	localStorage.setItem('user_id', get(user_id));
	return get(user_id);
}
