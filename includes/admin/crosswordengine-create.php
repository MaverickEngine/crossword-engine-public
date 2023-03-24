<?php

class CrosswordEngineCreate {
    private $options = [
        "crosswordengine_developer_mode",
    ];
    
    public function __construct() {
        add_action('admin_menu', [ $this, 'create_page' ]);
    }

    public function create_page() {
        add_submenu_page(
            'crosswordengine',
			'Add New Crossword',
			'Add New',
			'edit_posts',
			'crosswordengine_create',
			[ $this, 'crosswordengine_create' ]
		);
    }

    public function crosswordengine_create() {
        if (!current_user_can('edit_posts')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        // Save the new crossword
        if (isset($_POST['submit'])) {
            $this->save_crossword();
        }
        if (get_option('crosswordengine_developer_mode')) {
            wp_enqueue_style('crosswordengine-creator-style', plugin_dir_url( __FILE__ ) . '../../dist/crosswordengine.creator.css', [], CROSSWORDENGINE_VERSION);
            wp_enqueue_script( "crosswordengine-creator-script", plugin_dir_url(__FILE__) . "../../dist/crosswordengine.creator.js", [], CROSSWORDENGINE_VERSION, true );
        } else {
            wp_enqueue_style('crosswordengine-creator-style', plugin_dir_url( __FILE__ ) . '../../dist/crosswordengine.creator.min.css', [], CROSSWORDENGINE_VERSION);
            wp_enqueue_script( "crosswordengine-creator-script", plugin_dir_url(__FILE__) . "../../dist/crosswordengine.creator.min.js", [], CROSSWORDENGINE_VERSION, true );
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
        require_once plugin_dir_path( dirname( __FILE__ ) ).'admin/views/create.php';
    }

    public function save_crossword() {
        require_once(plugin_dir_path( dirname( __FILE__ ) ).'db/crossword.php');
        $crossword = new CrosswordEngineCrossword();
        $crossword->set("title", $_POST['title']);
        $crossword->set("author", $_POST['author']);
        $crossword->set("editor", $_POST['editor']);
        $crossword->set("xd_data", $_POST['xd']);
        $crossword->set("copyright", $_POST['copyright']);
        $crossword->set("difficulty", $_POST['difficulty']);
        $crossword->set("type", $_POST['type']);
        $crossword->set("size", $_POST['size']);
        $result = $crossword->save();
        // Redirect to the edit page
        // if result is type error, show error message
        if (is_wp_error($result)) {
            echo '<div class="notice notice-error is-dismissible">';
            echo '<p>' . $result->get_error_message() . '</p>';
            echo '</div>';
        } else if (!$result) {
            echo '<div class="notice notice-error is-dismissible">';
            echo '<p>' . "Error saving crossword" . '</p>';
            echo '</div>';
        } else {
            wp_redirect(admin_url('admin.php?page=crosswordengine&action=edit&edit=' . $result->id));
        }
    }

    public function register_settings() {
        foreach($this->options as $option) {
            register_setting( 'crosswordengine-settings-group', $option );
        }
    }
}