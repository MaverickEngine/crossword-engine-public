<?php
/**
 * Plugin Name: CrosswordEngine
 * Plugin URI: https://github.com/MaverickEngine/crossword-engine
 * Description: A Crossword System for Wordpress
 * Author: Daily Maverick, Jason Norwood-Young
 * Author URI: https://dailymaverick.co.za
 * Version: 0.1.4
 * License: GPLv3
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 * WC requires at least: 5.8.0
 * Tested up to: 5.8.2
 *
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once("crosswordengine_constants.php");

// Admin menu
function crosswordengine_admin_init() {
    if (!is_admin()) {
        return;
    }
    require_once(plugin_basename('includes/admin/crosswordengine-admin.php' ) );
    new CrosswordEngineAdmin();
}
add_action( 'init', 'crosswordengine_admin_init' );

// Check database setup
function crosswordengine_database_setup() {
    require_once( plugin_dir_path( __FILE__ ) . 'includes/db/db.php' );
    $db = new DB();
    $db->setup();
}
add_action( 'init', 'crosswordengine_database_setup', 2 );

// Register custom block
// function create_block_crosswordengine_block_init() {
// 	register_block_type(plugin_dir_path( __FILE__ ) . 'includes/gutenblock/build'  );
// }
// add_action( 'init', 'create_block_crosswordengine_block_init' );

// Register shortcodes
function create_shortcode_crosswordengine_init() {
    require_once( plugin_dir_path( __FILE__ ) . 'includes/frontend/crosswordengine-shortcode.php' );
    new CrosswordEngineShortcode();
}
add_action( 'init', 'create_shortcode_crosswordengine_init' );

// Register API
function create_api_crosswordengine_init() {
    require_once( plugin_dir_path( __FILE__ ) . 'includes/api/crosswordengine-api.php' );
    new CrosswordEngineAPI();
}
add_action( 'init', 'create_api_crosswordengine_init' );

// Embed javascript

// Embed stylesheet
