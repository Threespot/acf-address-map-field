<?php
/*
Plugin Name: Advanced Custom Fields: ACF Address Map
Description: Full Address field with geo-coded map for ACF4. Modified version of Chris Goddard's.
Plugin URI: https://github.com/bericp1/acf-address-map-field
Version: 1.1.0
Author: Everest Agency (Originally: Chris Goddard)
Author URI: http://everest-agency.com/
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
*/

load_plugin_textdomain( 'acf-address-map', false, dirname( plugin_basename(__FILE__) ) . '/lang/' ); 

function register_fields_address_map() {
	include_once('acf-address-map-v4.php');
}
add_action('acf/register_fields', 'register_fields_address_map');
?>