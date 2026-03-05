/**
 * Settings.js – Manage site connections (view token, test connection, edit, remove).
 *
 * Improvements: accepts shared `sites` prop, shows plugin version,
 * adds "Export Sites List" button (downloads name+url JSON, no tokens).
 */
import { useState, useEffect } from '@wordpress/element';
import { Button, TextControl, Spinner, Notice } from '@wordpress/components';
import { apiGet, apiPost, apiDelete, proxyGet } from '../../api';

const pluginVersion = window.wpDashData?.version ?? '—';

function EditSiteModal( { site, onSave, onCancel } ) {
	const [ name, setName ]     = useState( site.name );
	const [ url, setUrl ]       = useState( site.url );
	const [ token, setToken ]   = useState( '' );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ]   = useState( null );

	async function handleSave( e ) {
		e.preventDefault();
		setSaving( true );
		setError( null );
		try {
			const body = { name, url };
			if ( token ) body.token = token;
			// Use PUT /sites/{id}
			const updated = await apiPost( `/sites/${ site.id }`, body );
			onSave( updated );
		} catch ( err ) {
			setError( err.message );
		} finally {
			setSaving( false );
		}
	}

	return (
		<div style={ { background: '#fff', border: '1px solid #dcdcde', borderRadius: 4, padding: 20, marginBottom: 12 } }>
			<h4 style={ { margin: '0 0 12px' } }>Edit &quot;{ site.name }&quot;</h4>
			{ error && <div className="wp-dash-error" style={ { marginBottom: 12 } }>{ error }</div> }
			<form onSubmit={ handleSave }>
				<TextControl label="Name" value={ name } onChange={ setName } />
				<TextControl label="URL"  value={ url }  onChange={ setUrl }  type="url" />
				<TextControl
					label="API Token (leave blank to keep current)"
					value={ token }
					onChange={ setToken }
					type="password"
					placeholder="New token (optional)"
				/>
				<div style={ { display: 'flex', gap: 8, marginTop: 12 } }>
					<Button variant="primary" type="submit" isBusy={ saving } disabled={ saving }>
						Save
					</Button>
					<Button variant="secondary" onClick={ onCancel } disabled={ saving }>
						Cancel
					</Button>
				</div>
			</form>
		</div>
	);
}

export default function Settings( { sites: sitesProp, onSitesChange } ) {
	const [ sites, setSitesLocal ]  = useState( sitesProp ?? [] );
	const [ loading, setLoading ]   = useState( ! sitesProp );
	const [ error, setError ]       = useState( null );
	const [ notice, setNotice ]     = useState( null );
	const [ testResults, setTestResults ] = useState( {} );
	const [ editingId, setEditingId ]     = useState( null );

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

	function showNotice( msg, status = 'success' ) {
		setNotice( { msg, status } );
		setTimeout( () => setNotice( null ), 5000 );
	}

	async function testConnection( site ) {
		setTestResults( ( prev ) => ( { ...prev, [ site.id ]: 'testing' } ) );
		try {
			const health = await proxyGet( site.id, '/health' );
			setTestResults( ( prev ) => ( {
				...prev,
				[ site.id ]: {
					ok: true,
					info: `WP ${ health.wp_version ?? '' } · PHP ${ health.php_version ?? '' }`,
				},
			} ) );
		} catch ( err ) {
			setTestResults( ( prev ) => ( {
				...prev,
				[ site.id ]: { ok: false, info: err.message },
			} ) );
		}
	}

	async function handleDelete( site ) {
		if ( ! window.confirm( `Remove "${ site.name }"?` ) ) return;
		try {
			await apiDelete( `/sites/${ site.id }` );
			setSites( ( prev ) => prev.filter( ( s ) => s.id !== site.id ) );
			showNotice( `"${ site.name }" removed.` );
		} catch ( err ) {
			setError( err.message );
		}
	}

	function handleSaved( updated ) {
		setSites( ( prev ) => prev.map( ( s ) => ( s.id === updated.id ? updated : s ) ) );
		setEditingId( null );
		showNotice( 'Site updated.' );
	}

	function handleExport() {
		const data = sites.map( ( s ) => ( { name: s.name, url: s.url } ) );
		const blob = new Blob( [ JSON.stringify( data, null, 2 ) ], { type: 'application/json' } );
		const url  = URL.createObjectURL( blob );
		const a    = document.createElement( 'a' );
		a.href     = url;
		a.download = 'wpdash-sites.json';
		a.click();
		URL.revokeObjectURL( url );
	}

	if ( loading ) {
		return (
			<div className="wp-dash-loading">
				<Spinner />
				<span>Loading…</span>
			</div>
		);
	}

	return (
		<div>
			<div className="wp-dash-screen-header">
				<h2>Settings</h2>
				<div style={ { display: 'flex', alignItems: 'center', gap: 16 } }>
					<p style={ { margin: 0 } }>Manage API tokens and connections for each site.</p>
					<span style={ { fontSize: 11, color: '#646970', background: '#f0f0f1', padding: '2px 8px', borderRadius: 10 } }>
						WP Dash v{ pluginVersion }
					</span>
				</div>
			</div>

			{ notice && (
				<Notice
					status={ notice.status }
					isDismissible
					onRemove={ () => setNotice( null ) }
				>
					{ notice.msg }
				</Notice>
			) }
			{ error && <div className="wp-dash-error">{ error }</div> }

			{ sites.length === 0 ? (
				<div className="wp-dash-empty">
					No sites configured. Go to <strong>Sites</strong> to add your first site.
				</div>
			) : (
				<>
					<div style={ { marginBottom: 16 } }>
						<Button variant="secondary" onClick={ handleExport }>
							⬇ Export Sites List
						</Button>
					</div>

					<div>
						{ sites.map( ( site ) => {
							const testResult = testResults[ site.id ];
							return (
								<div key={ site.id } className="wp-dash-card" style={ { marginBottom: 16 } }>
									{ editingId === site.id ? (
										<EditSiteModal
											site={ site }
											onSave={ handleSaved }
											onCancel={ () => setEditingId( null ) }
										/>
									) : (
										<>
											<div style={ { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 } }>
												<div>
													<strong style={ { fontSize: 15 } }>{ site.name }</strong>
													<div style={ { fontSize: 12, color: '#646970', marginTop: 2 } }>
														<a href={ site.url } target="_blank" rel="noreferrer">{ site.url }</a>
													</div>
													<div style={ { fontSize: 11, color: '#646970', marginTop: 2 } }>
														Added: { new Date( site.created_at ).toLocaleDateString() }
													</div>
												</div>
												<div style={ { display: 'flex', gap: 6, flexWrap: 'wrap' } }>
													<Button
														variant="secondary"
														size="small"
														isBusy={ testResult === 'testing' }
														disabled={ testResult === 'testing' }
														onClick={ () => testConnection( site ) }
													>
														Test Connection
													</Button>
													<Button
														variant="secondary"
														size="small"
														onClick={ () => setEditingId( site.id ) }
													>
														Edit
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
											</div>

											{ testResult && testResult !== 'testing' && (
												<div
													style={ {
														display: 'inline-flex',
														alignItems: 'center',
														gap: 6,
														padding: '6px 12px',
														borderRadius: 4,
														fontSize: 12,
														background: testResult.ok ? '#edfaef' : '#fce8e8',
														color: testResult.ok ? '#1a7f37' : '#d63638',
														marginTop: 4,
													} }
												>
													{ testResult.ok ? '✓ Connected' : '✗ Failed' }
													{ testResult.info && ` — ${ testResult.info }` }
												</div>
											) }
										</>
									) }
								</div>
							);
						} ) }
					</div>
				</>
			) }
		</div>
	);
}
