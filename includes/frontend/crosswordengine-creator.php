<?php
class CrosswordEngineCreator {
    public function __construct($id) {
        $this->id = $id;
    }

    public function generate($meta = false) {
        if (get_option('crosswordengine_developer_mode')) {
            wp_enqueue_style('crosswordengine-creator-style', plugin_dir_url( __FILE__ ) . '../../dist/crosswordengine.creator.css', [], "0.1.7");
            wp_enqueue_script( "crosswordengine-creator-script", plugin_dir_url(__FILE__) . "../../dist/crosswordengine.creator.js", [], "0.1.7", true );
        } else {
            wp_enqueue_style('crosswordengine-creator-style', plugin_dir_url( __FILE__ ) . '../../dist/crosswordengine.creator.min.css', [], "0.1.7");
            wp_enqueue_script( "crosswordengine-creator-script", plugin_dir_url(__FILE__) . "../../dist/crosswordengine.creator.min.js", [], "0.1.7", true );
        }
        $empty_xd = "

        A1.  ~           
        A11.  ~           
        A12.  ~           
        A13.  ~           
        A14.  ~           
        A15.  ~           
        A16.  ~           
        A17.  ~           
        A18.  ~           
        A19.  ~           
        
        D1.  ~           
        D2.  ~           
        D3.  ~           
        D4.  ~           
        D5.  ~           
        D6.  ~           
        D7.  ~           
        D8.  ~           
        D9.  ~           
        D10.  ~           
        ";
        $script = 'var xd = ' . json_encode($empty_xd) . '; ';
        wp_add_inline_script('crosswordengine-script', $script, 'before');
        return '<div id="crosswordengine-creator-container"></div>';
    }

    public function render($meta = false) {
        echo $this->generate($meta);
    }

}
?>