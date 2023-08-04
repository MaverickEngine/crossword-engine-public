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
            $this->crossword_date = gmdate("Y-m-d H:i:s");
            $this->crossword_modified = gmdate("Y-m-d H:i:s");
            $this->crossword_title = "";
            $this->crossword_editor = "";
            $this->crossword_author = "";
            $this->crossword_xd_data = "";
            $this->crossword_copyright = "";
            $this->crossword_difficulty = "Medium";
            $this->crossword_type = "Straight";
            $this->crossword_public_submission = false;
            $this->crossword_size = 15;
        }
    }

    public function set($key, $value) {
        $this->{"crossword_" . $key} = $value;
    }

    public function get($key) {
        if (isset($this->{"crossword_" . $key})) {
            return $this->{"crossword_" . $key};
        } else {
            return null;
        }
    }

    protected function load() {
        global $wpdb;
        $crossword = $wpdb->get_row($wpdb->prepare( "SELECT * FROM {$wpdb->prefix}crosswordengine_crosswords WHERE ID = %d", $this->id));
        $this->crossword_date = $crossword->crossword_date;
        $this->crossword_modified = $crossword->crossword_modified;
        $this->crossword_title = $crossword->crossword_title;
        $this->crossword_editor = $crossword->crossword_editor;
        $this->crossword_author = $crossword->crossword_author;
        $this->crossword_xd_data = $crossword->crossword_xd_data;
        $this->crossword_copyright = $crossword->crossword_copyright;
        $this->crossword_difficulty = $crossword->crossword_difficulty;
        $this->crossword_type = $crossword->crossword_type;
        $this->crossword_public_submission = $crossword->crossword_public_submission;
        $this->crossword_size = $crossword->crossword_size;
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
            $this->crossword_modified = gmdate("Y-m-d H:i:s");
            $result = $wpdb->update(
                $crossword_table_name,
                [
                    'crossword_date' => $this->crossword_date,
                    'crossword_modified' => $this->crossword_modified,
                    'crossword_title' => $this->crossword_title,
                    'crossword_editor' => $this->crossword_editor,
                    'crossword_author' => $this->crossword_author,
                    'crossword_xd_data' => $this->crossword_xd_data,
                    'crossword_copyright' => $this->crossword_copyright,
                    'crossword_difficulty' => $this->crossword_difficulty,
                    'crossword_type' => $this->crossword_type,
                    'crossword_public_submission' => $this->crossword_public_submission,
                    'crossword_size' => $this->crossword_size,
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
                    'crossword_copyright' => $this->crossword_copyright,
                    'crossword_difficulty' => $this->crossword_difficulty,
                    'crossword_type' => $this->crossword_type,
                    'crossword_public_submission' => $this->crossword_public_submission,
                    'crossword_size' => $this->crossword_size,
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
            "created" => $this->crossword_created,
            "modified" => $this->crossword_modified,
            "title" => $this->crossword_title,
            "editor" => $this->crossword_editor,
            "author" => $this->crossword_author,
            "xd_data" => $this->crossword_xd_data,
            "copyright" => $this->crossword_copyright,
            "difficulty" => $this->crossword_difficulty,
            "type" => $this->crossword_type,
            "public_submission" => $this->crossword_public_submission,
            "size" => $this->crossword_size,
        );
        return $crossword_array;
    }

    public function get_crossword_basics() {
        $crossword_array = array(
            "id" => $this->ID,
            "date" => $this->crossword_date,
            "created" => $this->crossword_created,
            "modified" => $this->crossword_modified,
            "title" => $this->crossword_title,
            "editor" => $this->crossword_editor,
            "author" => $this->crossword_author,
            "size" => $this->crossword_size,
            "difficulty" => $this->crossword_difficulty,
            "type" => $this->crossword_type,
        );
        return $crossword_array;
    }
}