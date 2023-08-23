<?php
class CrosswordEngineView {
    public function __construct($id) {
        $this->id = $id;
    }

    public function generate($meta = false) {
        require_once plugin_dir_path( dirname( __FILE__ ) ).'db/crossword.php';
        $crossword = new CrosswordEngineCrossword($this->id);
        if (get_option('crosswordengine_developer_mode')) {
            wp_enqueue_style('crosswordengine-jxword-style', plugin_dir_url( __FILE__ ) . '../../dist/crosswordengine.jxword.css', [], CROSSWORDENGINE_VERSION);
            wp_enqueue_script( "crosswordengine-jxword-script", plugin_dir_url(__FILE__) . "../../dist/crosswordengine.jxword.js", [], CROSSWORDENGINE_VERSION, true );
        } else {
            wp_enqueue_style('crosswordengine-jxword-style', plugin_dir_url( __FILE__ ) . '../../dist/crosswordengine.jxword.min.css', [], CROSSWORDENGINE_VERSION);
            wp_enqueue_script( "crosswordengine-jxword-script", plugin_dir_url(__FILE__) . "../../dist/crosswordengine.jxword.min.js", [], CROSSWORDENGINE_VERSION, true );
        }
        $random_id = uniqid("crosswordengine_");
        $crossword_html = '<div class="crossword-container">';
        if ($meta) {
            $crossword_html .= '<h2 class="crossword-title">' . $crossword->get('title') . '</h2>';
            $crossword_html .= '<div class="crossword-editor">Editor: ' . $crossword->get('editor') . '</div>';
            $crossword_html .= '<div class="crossword-author">Author: ' . $crossword->get('author') . '</div>';
        }
        $embed = get_site_url() . '/crossword-engine/embed/' . $this->id . "?share_url=" . urlencode(get_permalink());
        $crossword_html .= '<div id="' . $random_id . '" data-embed="' . $embed . '">Loading...</div>';
        $plugin_dir = plugin_dir_url( __FILE__ );
        wp_add_inline_script( "crosswordengine-jxword-script", "add_crossword('" . base64_encode($crossword->get("xd_data")) . "', '$random_id')", "after" );
        $product_name = esc_attr(get_option('crosswordengine_name'));
        wp_add_inline_script( "crosswordengine-jxword-script", "jxword_product_name=\"{$product_name}\";", "after" );
        wp_add_inline_script( "crosswordengine-jxword-script", "jxword_completed_audio=\"{$plugin_dir}../../dist/audio/crossword_ditty.mp3\";", "after" );
        return $crossword_html;
    }

    public function render($meta = false) {
        // phpcs:disable
        echo $this->generate($meta);
    }

}
?>