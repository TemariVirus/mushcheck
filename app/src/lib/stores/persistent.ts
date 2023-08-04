import { browser } from '$app/environment';
import { writable } from 'svelte/store';

function createPersistentStore(key: string, startValue: string) {
	if (!browser) {
		return writable(startValue);
	}

	const store = writable(localStorage.getItem(key) || startValue);
	store.subscribe((val) => localStorage.setItem(key, val));
	return store;
}

export function clearPersistentStore(key: string) {
	if (!browser) {
		return;
	}

	localStorage.removeItem(key);
}

export const user_id = createPersistentStore('user_id', crypto.randomUUID().replace(/-/g, ''));
