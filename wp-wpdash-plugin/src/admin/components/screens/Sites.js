/**
 * Sites.js – List connected sites and add / remove them.
 *
 * Accepts optional `sites` and `onSitesChange` props from App.js shared state.
 * Each row has a "Test Connection" button that pings /health on the bridge.
 * The Add New Site form validates URL format before submitting.
 */
import { useState, useEffect } from '@wordpress/element';
import { Button, TextControl, Spinner, Notice } from '@wordpress/components';
import { apiGet, apiPost, apiDelete, proxyGet } from '../../api';

function isValidUrl( value ) {
	try {
		const u = new URL( value );
		return u.protocol === 'http:' || u.protocol === 'https:';
	} catch {
		return false;
	}
}

function AddSiteForm( { onAdded } ) {
	const [ name, setName ]       = useState( '' );
	const [ url, setUrl ]         = useState( '' );
	const [ token, setToken ]     = useState( '' );
	const [ saving, setSaving ]   = useState( false );
	const [ error, setError ]     = useState( null );

	async function handleSubmit( e ) {
		e.preventDefault();
		if ( ! name || ! url || ! token ) {
			setError( 'All fields are required.' );
			return;
		}
		if ( ! isValidUrl( url ) ) {
			setError( 'Please enter a valid URL starting with http:// or https://.' );
			return;
		}
		setSaving( true );
		setError( null );
		try {
			const site = await apiPost( '/sites', { name, url, token } );
			onAdded( site );
			setName( '' );
			setUrl( '' );
			setToken( '' );
		} catch ( err ) {
			setError( err.message );
		} finally {
			setSaving( false );
		}
	}

	return (
		<div className="wp-dash-card">
			<h3>Add New Site</h3>
			{ error && (
				<div className="wp-dash-error" style={ { marginBottom: 12 } }>{ error }</div>
			) }
			<form onSubmit={ handleSubmit }>
				<div className="wp-dash-form-row">
					<TextControl
						label="Site Name"
						value={ name }
						onChange={ setName }
						placeholder="My Blog"
					/>
					<TextControl
						label="Site URL"
						value={ url }
						onChange={ setUrl }
						placeholder="https://example.com"
						type="url"
						help={ url && ! isValidUrl( url ) ? 'Enter a valid URL (https://…)' : undefined }
					/>
					<TextControl
						label="API Token"
						value={ token }
						onChange={ setToken }
						placeholder="Bearer token from WP Dash Bridge"
						type="password"
					/>
				</div>
				<Button
					variant="primary"
					type="submit"
					isBusy={ saving }
					disabled={ saving }
				>
					{ saving ? 'Saving…' : 'Add Site' }
				</Button>
			</form>
		</div>
	);
}

export default function Sites( { sites: sitesProp, onSitesChange } ) {
	const [ sites, setSitesLocal ] = useState( sitesProp ?? [] );
	const [ loading, setLoading ]  = useState( ! sitesProp );
	const [ error, setError ]      = useState( null );
	const [ notice, setNotice ]    = useState( null );
	const [ connResults, setConnResults ] = useState( {} ); // per-site test results

	// Keeps local state and the App-level shared state in sync.
	function setSites( next ) {
		const resolved = typeof next === 'function' ? next( sites ) : next;
		setSitesLocal( resolved );
		if ( onSitesChange ) onSitesChange( resolved );
	}

	useEffect( () => {
		if ( sitesProp !== undefined ) {
			setLoading( false );
			return;
		}
		apiGet( '/sites' )
			.then( ( data ) => setSites( data ) )
			.catch( ( err ) => setError( err.message ) )
			.finally( () => setLoading( false ) );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	function handleAdded( site ) {
		setSites( ( prev ) => [ ...prev, site ] );
		setNotice( `"${ site.name }" added successfully.` );
		setTimeout( () => setNotice( null ), 4000 );
	}

	async function handleDelete( site ) {
		if ( ! window.confirm( `Remove "${ site.name }"? This cannot be undone.` ) ) return;
		try {
			await apiDelete( `/sites/${ site.id }` );
			setSites( ( prev ) => prev.filter( ( s ) => s.id !== site.id ) );
			setNotice( `"${ site.name }" removed.` );
			setTimeout( () => setNotice( null ), 4000 );
		} catch ( err ) {
			setError( err.message );
		}
	}

	async function handleTestConnection( site ) {
		setConnResults( ( prev ) => ( { ...prev, [ site.id ]: 'testing' } ) );
		try {
			const health = await proxyGet( site.id, '/health' );
			setConnResults( ( prev ) => ( {
				...prev,
				[ site.id ]: {
					ok: true,
					info: `WP ${ health.wp_version ?? '' } · PHP ${ health.php_version ?? '' }`,
				},
			} ) );
		} catch ( err ) {
			setConnResults( ( prev ) => ( {
				...prev,
				[ site.id ]: { ok: false, info: err.message },
			} ) );
		}
	}

	if ( loading ) {
		return (
			<div className="wp-dash-loading">
				<Spinner />
				<span>Loading sites…</span>
			</div>
		);
	}

	return (
		<div>
			<div className="wp-dash-screen-header">
				<h2>Sites</h2>
				<p>Manage all connected WordPress sites.</p>
			</div>

			{ notice && (
				<Notice status="success" isDismissible onRemove={ () => setNotice( null ) }>
					{ notice }
				</Notice>
			) }
			{ error && <div className="wp-dash-error">{ error }</div> }

			<AddSiteForm onAdded={ handleAdded } />

			{ sites.length === 0 ? (
				<div className="wp-dash-empty">No sites added yet. Use the form above to add your first site.</div>
			) : (
				<div className="wp-dash-table-wrap">
					<table className="wp-dash-table">
						<thead>
							<tr>
								<th>Name</th>
								<th>URL</th>
								<th>Added</th>
								<th>Connection</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{ sites.map( ( site ) => {
								const connResult = connResults[ site.id ];
								return (
									<tr key={ site.id }>
										<td><strong>{ site.name }</strong></td>
										<td>
											<a href={ site.url } target="_blank" rel="noreferrer">
												{ site.url }
											</a>
										</td>
										<td>{ new Date( site.created_at ).toLocaleDateString() }</td>
										<td>
											{ connResult === 'testing' ? (
												<Spinner />
											) : connResult ? (
												<span style={ { fontSize: 12, color: connResult.ok ? '#1a7f37' : '#d63638' } }>
													{ connResult.ok ? '✅' : '❌' } { connResult.info }
												</span>
											) : (
												<span style={ { color: '#c3c4c7', fontSize: 12 } }>—</span>
											) }
										</td>
										<td>
											<div className="actions">
												<Button
													variant="secondary"
													size="small"
													isBusy={ connResult === 'testing' }
													disabled={ connResult === 'testing' }
													onClick={ () => handleTestConnection( site ) }
												>
													Test Connection
												</Button>
												<Button
													variant="secondary"
													isDestructive
													size="small"
													onClick={ () => handleDelete( site ) }
												>
													Remove
												</Button>
											</div>
										</td>
									</tr>
								);
							} ) }
						</tbody>
					</table>
				</div>
			) }
		</div>
	);
}
