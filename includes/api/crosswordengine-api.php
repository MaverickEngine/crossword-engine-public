<?php
if (!class_exists("CrosswordEngineCrosswords")) {
    require_once(plugin_dir_path( dirname( __FILE__ ) ).'/db/crosswords.php');
}
class CrosswordEngineAPI {
    public function __construct() {
        add_action('rest_api_init', [$this, 'register_api_routes']);
    }
    
    public function register_api_routes() {
        register_rest_route( 'crosswordengine/v1', '/crosswords', [
            'methods' => 'GET',
            'callback' => [ $this, 'get_crosswords' ],
			'permission_callback' => '__return_true'
        ]);
    }

    public function get_crosswords() {
        $Crosswords = new CrosswordEngineCrosswords();
        $crosswords = $Crosswords->get_crossword_list();
        return (array) $crosswords;
    }
}

?>
