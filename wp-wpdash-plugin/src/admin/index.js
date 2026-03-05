/**
 * React entry point – mounts <App /> into the #wp-dash-root div injected by PHP.
 */
import { render } from '@wordpress/element';
import App from './App';
import './index.css';

const root = document.getElementById( 'wp-dash-root' );

if ( root ) {
	render( <App />, root );
}
