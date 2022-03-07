<?php

class CrosswordEngineList {
    private $options = [
        "crosswordengine_developer_mode",
    ];
    
    public function __construct() {
        add_action('admin_menu', [ $this, 'create_page' ]);
    }

    public function create_page() {
        add_submenu_page(
            'crosswordengine',
			'Crosswords',
			'All Crosswords',
			'manage_options',
			'crosswordengine',
			[ $this, 'crosswordengine_list' ]
		);
    }

    public function crosswordengine_list() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        // Check for edit
        if (isset($_GET['edit'])) {
            $this->edit_crossword($_GET['edit']);
        } else {
            require_once(plugin_dir_path( dirname( __FILE__ ) ).'admin/tables/crosswordengine-table.php');
            $crosswordengineTable = new CrosswordEngineTable();
            $crosswordengineTable->prepare_items();
            require_once plugin_dir_path( dirname( __FILE__ ) ).'admin/views/list.php';
        }
    }

    public function edit_crossword($id) {
        require_once(plugin_dir_path( dirname( __FILE__ ) ).'db/crossword.php');
        $crossword = new CrosswordEngineCrossword($id);
        if (isset($_POST['submit'])) {
            $crossword = $this->save_crossword($id, $crossword);
        }
        wp_enqueue_style('crosswordengine-style', plugin_dir_url( __FILE__ ) . '../../dist/crosswordengine.creator.css');
        wp_enqueue_script( "crosswordengine-script", plugin_dir_url(__FILE__) . "../../dist/crosswordengine.creator.js", [], "0.0.2", true );
        $script = 'var xd = ' . json_encode($crossword->get("xd_data")) . '; ';
        wp_add_inline_script('crosswordengine-script', $script, 'before');
        require_once plugin_dir_path( dirname( __FILE__ ) ).'admin/views/edit.php';
    }

    public function register_settings() {
        foreach($this->options as $option) {
            register_setting( 'crosswordengine-settings-group', $option );
        }
    }

    public function save_crossword($id, $crossword) {
        require_once(plugin_dir_path( dirname( __FILE__ ) ).'db/crossword.php');
        $crossword = new CrosswordEngineCrossword($id);
        $crossword->set("title", $_POST['title']);
        $crossword->set("author", $_POST['author']);
        $crossword->set("editor", $_POST['editor']);
        $crossword->set("description", $_POST['description']);
        $crossword->set("date", $_POST['date']);
        // Open uploaded file
        $file = $_FILES['xd_file'];
        if ($file['tmp_name']) {
            $file_tmp_name = $file['tmp_name'];
            $xd_data = file_get_contents($file_tmp_name);
            $crossword->set("xd_data", $xd_data);
        } else {
            $crossword->set("xd_data", $_POST['xd']);
        }
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
        return $crossword;
    }
}