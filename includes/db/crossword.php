<?php

class CrosswordEngineCrossword {
    public function __construct($id = null, $data = null) {
        if ($data) {
            foreach($data as $key => $value) {
                $this->$key = $value;
            }
        } else if ($id) {
            $this->id = $id;
            $this->load();
        } else {
            $this->id = null;
            $this->crossword_date = date("Y-m-d H:i:s");
            $this->crossword_modified = date("Y-m-d H:i:s");
            $this->crossword_title = "";
            $this->crossword_editor = "";
            $this->crossword_author = "";
            $this->crossword_xd_data = "";
        }
    }

    public function set($key, $value) {
        $this->{"crossword_" . $key} = $value;
    }

    public function get($key) {
        return $this->{"crossword_" . $key};
    }

    protected function load() {
        global $wpdb;
        $crossword_table_name = $wpdb->prefix . "crosswordengine_crosswords";
        $crossword = $wpdb->get_row( "SELECT * FROM $crossword_table_name WHERE ID = $this->id" );
        $this->crossword_date = $crossword->crossword_date;
        $this->crossword_modified = $crossword->crossword_modified;
        $this->crossword_title = $crossword->crossword_title;
        $this->crossword_editor = $crossword->crossword_editor;
        $this->crossword_author = $crossword->crossword_author;
        $this->crossword_xd_data = $crossword->crossword_xd_data;
    }

    public function save() {
        global $wpdb;
        if (!$this->crossword_title) {
            return new WP_Error("crossword_title_empty", "Crossword title cannot be empty.");
        }
        if (!$this->crossword_date) {
            return new WP_Error("crossword_date_empty", "Crossword date cannot be empty.");
        }
        if (!$this->crossword_xd_data) {
            return new WP_Error("crossword_xd_data", "Crossword XD data cannot be empty.");
        }
        $crossword_table_name = $wpdb->prefix . "crosswordengine_crosswords";
        if ($this->id) {
            $this->crossword_modified = date("Y-m-d H:i:s");
            $result = $wpdb->update(
                $crossword_table_name,
                [
                    'crossword_date' => $this->crossword_date,
                    'crossword_modified' => $this->crossword_modified,
                    'crossword_title' => $this->crossword_title,
                    'crossword_editor' => $this->crossword_editor,
                    'crossword_author' => $this->crossword_author,
                    'crossword_xd_data' => $this->crossword_xd_data,
                ],
                [ 'ID' => $this->id ]
            );
        } else {
            $result = $wpdb->insert(
                $crossword_table_name,
                [
                    'crossword_date' => $this->crossword_date,
                    'crossword_modified' => $this->crossword_modified,
                    'crossword_title' => $this->crossword_title,
                    'crossword_editor' => $this->crossword_editor,
                    'crossword_author' => $this->crossword_author,
                    'crossword_xd_data' => $this->crossword_xd_data,
                ]
            );
            $this->id = $wpdb->insert_id;
        }
        // Alert success
        if ($result) {
            $this->load();
            return $this;
        } else {
            return false;
        }
    }

    public function get_crossword_array() {
        $crossword_array = array(
            "id" => $this->ID,
            "date" => $this->crossword_date,
            "modified" => $this->crossword_modified,
            "title" => $this->crossword_title,
            "editor" => $this->crossword_editor,
            "author" => $this->crossword_author,
            "xd_data" => $this->crossword_xd_data,
        );
        return $crossword_array;
    }
}