<?php

class DB {
    public function __construct() {
    }
    
    public function setup() {
        $crosswordengine_db_version = get_option("crosswordengine_db_version", 0 );
        if ($crosswordengine_db_version == CROSSWORDENGINE_DB_VERSION) {
            return;
        }
        global $wpdb;
        require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
        $charset_collate = $wpdb->get_charset_collate();
        $crossword_table_name = $wpdb->prefix . "crosswordengine_crosswords";
        $crossword_sql = "CREATE TABLE $crossword_table_name (
            ID mediumint(9) NOT NULL AUTO_INCREMENT,
            crossword_date datetime DEFAULT NOW() NOT NULL,
            crossword_modified datetime DEFAULT NOW() NOT NULL,
            crossword_created datetime DEFAULT NOW() NOT NULL,
            crossword_title text NOT NULL,
            crossword_editor text NOT NULL,
            crossword_author text NOT NULL,
            crossword_copyright text NOT NULL DEFAULT '',
            crossword_difficulty text NOT NULL DEFAULT '',
            crossword_type text NOT NULL DEFAULT '',
            crossword_public_submission boolean NOT NULL DEFAULT false,
            crossword_xd_data text NOT NULL,
            crossword_size INT NOT NULL DEFAULT -1,
            UNIQUE KEY id (ID)
        ) $charset_collate;";
        dbDelta( $crossword_sql );
        update_option( "crosswordengine_db_version", CROSSWORDENGINE_DB_VERSION );
    }
}