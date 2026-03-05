/**
 * Sites.js – List connected sites and add / remove them.
 */
import { useState, useEffect } from '@wordpress/element';
import { Button, TextControl, Spinner, Notice } from '@wordpress/components';
import { apiGet, apiPost, apiDelete } from '../../api';

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

export default function Sites() {
	const [ sites, setSites ]   = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ]   = useState( null );
	const [ notice, setNotice ] = useState( null );

	useEffect( () => {
		apiGet( '/sites' )
			.then( setSites )
			.catch( ( err ) => setError( err.message ) )
			.finally( () => setLoading( false ) );
	}, [] );

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
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{ sites.map( ( site ) => (
								<tr key={ site.id }>
									<td><strong>{ site.name }</strong></td>
									<td>
										<a href={ site.url } target="_blank" rel="noreferrer">
											{ site.url }
										</a>
									</td>
									<td>{ new Date( site.created_at ).toLocaleDateString() }</td>
									<td>
										<Button
											variant="secondary"
											isDestructive
											size="small"
											onClick={ () => handleDelete( site ) }
										>
											Remove
										</Button>
									</td>
								</tr>
							) ) }
						</tbody>
					</table>
				</div>
			) }
		</div>
	);
}
