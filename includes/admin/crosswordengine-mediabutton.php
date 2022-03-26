<?php
class CrosswordEngineMediaButton {
    public function __construct() {
        add_action( 'media_buttons', [ $this, 'crosswordengine_media_button' ] );
        add_action( "wp_enqueue_media", [ $this, "crosswordengine_media_button_js" ]);
    }

    public function crosswordengine_media_button() {
        require_once plugin_dir_path( dirname( __FILE__ ) ).'admin/views/mediabutton.php';
    }

    public function crosswordengine_media_button_js() {
        if (get_option('crosswordengine_developer_mode')) {
            wp_enqueue_script( "crosswordengine-script", plugin_dir_url(__FILE__) . "../../dist/crosswordengine.inserter.js", [], "0.0.1", true );
        } else {
            wp_enqueue_script( "crosswordengine-script", plugin_dir_url(__FILE__) . "../../dist/crosswordengine.inserter.min.js", [], "0.0.1", true );
        }
    }
}
?>