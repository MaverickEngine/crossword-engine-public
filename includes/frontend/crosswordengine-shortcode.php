<?php
class CrosswordEngineShortcode {
    public function __construct() {
        add_shortcode('crosswordengine', array($this, 'crosswordengine_shortcode'));
        add_shortcode('crossword-engine', array($this, 'crosswordengine_shortcode'));
        add_shortcode('crossword_engine', array($this, 'crosswordengine_shortcode'));
        add_shortcode('crosswordengine-creator', array($this, 'crosswordengine_creator_shortcode'));
    }

    public function crosswordengine_shortcode($atts) {
        $atts = shortcode_atts(array(
            'id' => '',
            "meta" => false,
        ), $atts);
        require_once plugin_dir_path( dirname( __FILE__ ) ).'frontend/crosswordengine-view.php';
        $crossword_view = new CrosswordEngineView($atts['id']);
        return $crossword_view->generate($atts['meta']);
    }

    public function crosswordengine_creator_shortcode($atts) {
        $atts = shortcode_atts(array(
            'id' => '',
        ), $atts);
        require_once plugin_dir_path( dirname( __FILE__ ) ).'frontend/crosswordengine-creator.php';
        $crossword_creator = new CrosswordEngineCreator($atts['id']);
        return $crossword_creator->generate();
    }
}
?>