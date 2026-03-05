/**
 * Security.js – Run and display a security integrity audit on a selected site.
 *
 * Improvements: accepts shared `sites` prop, shows last audit timestamp,
 * adds a "Run New Audit" button (POST /security/scan), color-codes status.
 */
import { useState, useEffect } from '@wordpress/element';
import { Button, SelectControl, Spinner } from '@wordpress/components';
import { apiGet, proxyGet, proxyPost } from '../../api';

export default function Security( { sites: sitesProp } ) {
	const [ sites, setSites ]               = useState( sitesProp ?? [] );
	const [ selectedSite, setSelectedSite ] = useState( '' );
	const [ audit, setAudit ]               = useState( null );
	const [ loading, setLoading ]           = useState( false );
	const [ sitesLoading, setSitesLoading ] = useState( ! sitesProp );
	const [ error, setError ]               = useState( null );
	const [ auditDate, setAuditDate ]       = useState( null );
	const [ scanning, setScanning ]         = useState( false );

	useEffect( () => {
		if ( sitesProp !== undefined ) {
			if ( sitesProp.length > 0 ) setSelectedSite( String( sitesProp[ 0 ].id ) );
			setSitesLoading( false );
			return;
		}
		apiGet( '/sites' )
			.then( ( data ) => {
				setSites( data );
				if ( data.length > 0 ) setSelectedSite( String( data[ 0 ].id ) );
			} )
			.catch( ( err ) => setError( err.message ) )
			.finally( () => setSitesLoading( false ) );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Auto-run audit when site selection changes.
	useEffect( () => {
		if ( ! selectedSite ) return;
		runAudit();
	}, [ selectedSite ] ); // eslint-disable-line react-hooks/exhaustive-deps

	async function runAudit() {
		setLoading( true );
		setAudit( null );
		setError( null );
		try {
			const result = await proxyGet( Number( selectedSite ), '/security/integrity' );
			setAudit( result );
			setAuditDate( new Date() );
		} catch ( err ) {
			setError( err.message );
		} finally {
			setLoading( false );
		}
	}

	async function runNewScan() {
		setScanning( true );
		setError( null );
		try {
			await proxyPost( Number( selectedSite ), '/security/scan', {} );
		} catch ( err ) {
			// Non-fatal: scan trigger may not exist on all bridges; still refresh audit.
			setError( `Scan trigger: ${ err.message }` );
		} finally {
			setScanning( false );
		}
		await runAudit();
	}

	const siteOptions = sites.map( ( s ) => ( { label: s.name, value: String( s.id ) } ) );

	// Status logic
	let statusLabel, statusColor, statusBg;
	if ( ! audit ) {
		statusLabel = 'NO DATA';
		statusColor = '#646970';
		statusBg    = '#f0f0f1';
	} else if ( ! audit.issues || audit.issues.length === 0 ) {
		statusLabel = 'CLEAN';
		statusColor = '#1a7f37';
		statusBg    = '#edfaef';
	} else {
		statusLabel = 'ISSUES FOUND';
		statusColor = '#d63638';
		statusBg    = '#fce8e8';
	}

	if ( sitesLoading ) {
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
				<h2>Security</h2>
				<p>Run a file integrity audit on a connected site.</p>
			</div>

			{ error && <div className="wp-dash-error">{ error }</div> }

			{ sites.length === 0 ? (
				<div className="wp-dash-empty">No sites connected. Add a site first.</div>
			) : (
				<>
					<div className="wp-dash-card" style={ { marginBottom: 20 } }>
						<div style={ { display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' } }>
							<div style={ { flex: 1, minWidth: 180 } }>
								<SelectControl
									label="Select Site"
									value={ selectedSite }
									options={ siteOptions }
									onChange={ ( val ) => setSelectedSite( val ) }
								/>
							</div>
							<Button
								variant="secondary"
								onClick={ runAudit }
								disabled={ loading || scanning || ! selectedSite }
								isBusy={ loading }
								style={ { marginBottom: 8 } }
							>
								↻ Refresh Audit
							</Button>
							<Button
								variant="primary"
								onClick={ runNewScan }
								disabled={ loading || scanning || ! selectedSite }
								isBusy={ scanning }
								style={ { marginBottom: 8 } }
							>
								▶ Run New Audit
							</Button>
						</div>
						{ auditDate && (
							<div style={ { fontSize: 11, color: '#646970', marginTop: 4 } }>
								Last audited: { auditDate.toLocaleString() }
							</div>
						) }
					</div>

					{ loading && (
						<div className="wp-dash-loading">
							<Spinner />
							<span>Running security audit…</span>
						</div>
					) }

					{ ! loading && (
						<div className="wp-dash-card">
							<div style={ { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 } }>
								<h3 style={ { margin: 0 } }>Audit Result</h3>
								<span
									style={ {
										display: 'inline-block',
										padding: '3px 10px',
										borderRadius: 12,
										fontSize: 11,
										fontWeight: 700,
										letterSpacing: 0.5,
										background: statusBg,
										color: statusColor,
									} }
								>
									{ statusLabel }
								</span>
							</div>

							{ audit && audit.summary && (
								<p style={ { margin: '0 0 12px', color: '#50575e', fontSize: 13 } }>
									{ audit.summary }
								</p>
							) }

							{ audit && audit.checks && (
								<div style={ { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 } }>
									{ Object.entries( audit.checks ).map( ( [ key, val ] ) => (
										<div key={ key } style={ { background: '#f0f0f1', padding: '10px 14px', borderRadius: 4 } }>
											<div style={ { fontSize: 11, color: '#646970', textTransform: 'uppercase', letterSpacing: 0.5 } }>
												{ key.replace( /_/g, ' ' ) }
											</div>
											<div style={ { fontWeight: 600, marginTop: 4 } }>
												{ typeof val === 'boolean' ? ( val ? '✓ Pass' : '✗ Fail' ) : String( val ) }
											</div>
										</div>
									) ) }
								</div>
							) }

							{ audit && audit.issues && audit.issues.length > 0 && (
								<>
									<h4 style={ { margin: '0 0 8px', fontSize: 13 } }>
										{ audit.issues.length } suspicious / modified file{ audit.issues.length !== 1 ? 's' : '' }:
									</h4>
									<ul className="wp-dash-file-list">
										{ audit.issues.map( ( issue, i ) => (
											<li key={ i }>
												<span className="dashicons dashicons-warning" />
												<span style={ { flex: 1 } }>{ issue.file ?? issue.path ?? issue }</span>
												{ issue.reason && (
													<span style={ { color: '#d63638', fontSize: 11 } }>{ issue.reason }</span>
												) }
											</li>
										) ) }
									</ul>
								</>
							) }

							{ audit && ( ! audit.issues || audit.issues.length === 0 ) && (
								<p style={ { color: '#1a7f37', fontWeight: 600 } }>
									✓ No suspicious files detected. Your installation looks healthy.
								</p>
							) }

							{ ! audit && (
								<p style={ { color: '#646970' } }>
									No audit data yet. Select a site and click "Run New Audit".
								</p>
							) }
						</div>
					) }
				</>
			) }
		</div>
	);
}
