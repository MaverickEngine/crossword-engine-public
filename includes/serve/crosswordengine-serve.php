<?php

/**
 * Crossword Engine - Serve Pages
 *
 * @package     CrosswordEngine
 * @since       1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require_once(plugin_dir_path( __FILE__ ) . '../frontend/crosswordengine-view.php' );

class CrosswordEngineServe {
    public function __construct() {
        if (empty($_SERVER['REQUEST_URI'])) return;
        $this->uri = sanitize_url($_SERVER['REQUEST_URI']);
        $this->parsed_url = wp_parse_url($this->uri);
        if (!is_array($this->parsed_url)) return;
        $this->parameters = wp_parse_args($this->parsed_url["query"] ?? null);
        if (!preg_match('/\/crossword-engine\/(embed)\/(.*)/', $this->parsed_url["path"], $matches)) {
            return;
        }
        $format = $matches[1];
        $id = $matches[2];
        // Check that the crossword exists
        global $wpdb;
        $crossword = $wpdb->get_row($wpdb->prepare( "SELECT * FROM {$wpdb->prefix}crosswordengine_crosswords WHERE ID = %d", $id));
        if (!$crossword) {
            return;
        }
        switch ($format) {
            case 'embed':
                $this->render_embed($id);
                break;
            default:
                $this->render_embed($id);
                break;
        }
        exit;
    }

    public function render_embed($id) {
        include_once(plugin_dir_path( __FILE__ ) . "./header-iframe.php");
        $view = new CrosswordEngineView($id);
        $view->render(false);
        include_once(plugin_dir_path( __FILE__ ) . "./footer-iframe.php");
    }
}