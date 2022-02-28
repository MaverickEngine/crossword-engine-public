<?php
class CrosswordEngineShortcode {
    public function __construct() {
        add_shortcode('crosswordengine', array($this, 'crosswordengine_shortcode'));
    }

    public function crosswordengine_shortcode($atts) {
        $atts = shortcode_atts(array(
            'id' => '',
            "meta" => false,
        ), $atts);
        require_once plugin_dir_path( dirname( __FILE__ ) ).'db/crossword.php';
        $crossword = new CrosswordEngineCrossword($atts["id"]);
        wp_enqueue_style('crosswordengine-style', plugin_dir_url( __FILE__ ) . '../../dist/crosswordengine.jxword.css');
        wp_enqueue_script( "crosswordengine-script", plugin_dir_url(__FILE__) . "../../dist/crosswordengine.jxword.js", [], "0.0.2", true );
        $random_id = uniqid("crosswordengine_");
        $crossword_html = '<div class="crossword-container">';
        if ($atts["meta"]) {
            $crossword_html .= '<h2 class="crossword-title">' . $crossword->get('title') . '</h2>';
            $crossword_html .= '<div class="crossword-editor">Editor: ' . $crossword->get('editor') . '</div>';
            $crossword_html .= '<div class="crossword-author">Author: ' . $crossword->get('author') . '</div>';
        }
        $crossword_html .= '<div id="' . $random_id . '">Loading...</div>';
        wp_add_inline_script( "crosswordengine-script", "add_crossword('" . base64_encode($crossword->get("xd_data")) . "', '$random_id')", "after" );
        return $crossword_html;
    }
}
?>