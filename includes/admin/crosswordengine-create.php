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
			'manage_options',
			'crosswordengine_create',
			[ $this, 'crosswordengine_create' ]
		);
    }

    public function crosswordengine_create() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        // Save the new crossword
        if (isset($_POST['submit'])) {
            $this->save_crossword();
        }
        require_once plugin_dir_path( dirname( __FILE__ ) ).'admin/views/create.php';
    }

    public function save_crossword() {
        require_once(plugin_dir_path( dirname( __FILE__ ) ).'db/crossword.php');
        $crossword = new CrosswordEngineCrossword();
        $crossword->set("title", $_POST['crossword_title']);
        $crossword->set("author", $_POST['crossword_author']);
        $crossword->set("editor", $_POST['crossword_editor']);
        $crossword->set("description", $_POST['crossword_description']);
        // Open uploaded file
        $file = $_FILES['crossword_xd_file'];
        $file_tmp_name = $file['tmp_name'];
        $xd_data = file_get_contents($file_tmp_name);
        $crossword->set("xd_data", $xd_data);
        $result = $crossword->save();
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
            echo '<div class="notice notice-success is-dismissible">';
            echo '<p>' . "Crossword saved" . '</p>';
            echo '</div>';
        }
    }

    public function register_settings() {
        foreach($this->options as $option) {
            register_setting( 'crosswordengine-settings-group', $option );
        }
    }
}