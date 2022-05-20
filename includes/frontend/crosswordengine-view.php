<?php
class CrosswordEngineView {
    public function __construct($id) {
        $this->id = $id;
    }

    public function generate($meta = false) {
        require_once plugin_dir_path( dirname( __FILE__ ) ).'db/crossword.php';
        $crossword = new CrosswordEngineCrossword($this->id);
        if (get_option('crosswordengine_developer_mode')) {
            wp_enqueue_style('crosswordengine-jxword-style', plugin_dir_url( __FILE__ ) . '../../dist/crosswordengine.jxword.css', [], "0.0.4");
            wp_enqueue_script( "crosswordengine-jxword-script", plugin_dir_url(__FILE__) . "../../dist/crosswordengine.jxword.js", [], "0.0.4", true );
        } else {
            wp_enqueue_style('crosswordengine-jxword-style', plugin_dir_url( __FILE__ ) . '../../dist/crosswordengine.jxword.min.css', [], "0.0.4");
            wp_enqueue_script( "crosswordengine-jxword-script", plugin_dir_url(__FILE__) . "../../dist/crosswordengine.jxword.min.js", [], "0.0.4", true );
        }
        $random_id = uniqid("crosswordengine_");
        $crossword_html = '<div class="crossword-container">';
        if ($meta) {
            $crossword_html .= '<h2 class="crossword-title">' . $crossword->get('title') . '</h2>';
            $crossword_html .= '<div class="crossword-editor">Editor: ' . $crossword->get('editor') . '</div>';
            $crossword_html .= '<div class="crossword-author">Author: ' . $crossword->get('author') . '</div>';
        }
        $crossword_html .= '<div id="' . $random_id . '">Loading...</div>';
        wp_add_inline_script( "crosswordengine-jxword-script", "add_crossword('" . base64_encode($crossword->get("xd_data")) . "', '$random_id')", "after" );
        return $crossword_html;
    }

    public function render($meta = false) {
        echo $this->generate($meta);
    }

}
?>