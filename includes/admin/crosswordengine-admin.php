<?php

class CrosswordEngineAdmin {

    function __construct() {
        add_action('admin_menu', [ $this, 'menu' ]);
        require_once('crosswordengine-list.php' );
        new CrosswordEngineList();
        require_once('crosswordengine-create.php' );
        new CrosswordEngineCreate();
        require_once('crosswordengine-settings.php' );
        new CrosswordEngineSettings();
        
    }

    function menu() {
        add_menu_page(
            'CrosswordEngine',
			'CrosswordEngine',
			'edit_posts',
			'crosswordengine',
			null,
            "dashicons-grid-view",
            30
        );
    }
}