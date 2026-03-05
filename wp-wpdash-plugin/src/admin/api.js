/**
 * api.js – Thin wrapper around fetch() for the WP Dash internal REST API
 * and the proxy endpoint that forwards calls to connected (bridge) sites.
 */

const { nonce, restBase } = window.wpDashData;

// ── Core fetch helpers ─────────────────────────────────────────────────────

function buildHeaders( extra = {} ) {
	return {
		'Content-Type': 'application/json',
		'X-WP-Nonce': nonce,
		...extra,
	};
}

async function handleResponse( res ) {
	const text = await res.text();
	let data;
	try {
		data = JSON.parse( text );
	} catch {
		data = text;
	}
	if ( ! res.ok ) {
		const message =
			( data && data.message ) ||
			`HTTP ${ res.status }: ${ res.statusText }`;
		throw new Error( message );
	}
	return data;
}

export async function apiGet( path ) {
	const res = await fetch( restBase + path, {
		method: 'GET',
		headers: buildHeaders(),
	} );
	return handleResponse( res );
}

export async function apiPost( path, body ) {
	const res = await fetch( restBase + path, {
		method: 'POST',
		headers: buildHeaders(),
		body: JSON.stringify( body ),
	} );
	return handleResponse( res );
}

export async function apiPut( path, body ) {
	const res = await fetch( restBase + path, {
		method: 'PUT',
		headers: buildHeaders(),
		body: JSON.stringify( body ),
	} );
	return handleResponse( res );
}

export async function apiDelete( path ) {
	const res = await fetch( restBase + path, {
		method: 'DELETE',
		headers: buildHeaders(),
	} );
	return handleResponse( res );
}

// ── Proxy helpers (forward requests to connected bridge sites) ─────────────

export async function proxyGet( siteId, endpoint ) {
	return apiPost( '/proxy', {
		site_id: siteId,
		endpoint,
		method: 'GET',
	} );
}

export async function proxyPost( siteId, endpoint, data = {} ) {
	return apiPost( '/proxy', {
		site_id: siteId,
		endpoint,
		method: 'POST',
		data,
	} );
}

export async function proxyDelete( siteId, endpoint ) {
	return apiPost( '/proxy', {
		site_id: siteId,
		endpoint,
		method: 'DELETE',
	} );
}
