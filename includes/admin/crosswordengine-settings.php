<?php

class CrosswordEngineSettings {
    private $options = [
        "crosswordengine_developer_mode",
        "crosswordengine_name",
    ];
    
    public function __construct() {
        add_action('admin_menu', [ $this, 'settings_page' ]);
        add_action('admin_init', [ $this, 'register_settings' ]);
        
    }

    public function settings_page() {
        add_submenu_page(
            'crosswordengine',
			'CrosswordEngine Settings',
			'Settings',
			'manage_options',
			'crosswordengine_settings',
			[ $this, 'crosswordengine_settings' ]
		);
    }

    public function crosswordengine_settings() {
        if (!current_user_can('manage_options')) {
            wp_die('You do not have sufficient permissions to access this page.');
        }
        require_once plugin_dir_path( dirname( __FILE__ ) ).'admin/views/settings.php';
    }

    public function register_settings() {
        foreach($this->options as $option) {
            register_setting( 'crosswordengine-settings-group', $option );
        }
    }
}