<?php

class CrosswordEngineCrosswords {
    public function __construct($opts = []) {
        $defaults = [
            "order_by" => "crossword_date",
            "order" => "DESC",
            "limit" => 100,
            "offset" => 0,
        ];
        $this->opts = array_merge($defaults, $opts);        
        $this->crosswords = array();
        $this->load();
    }

    public function load() {
        require_once("crossword.php");
        global $wpdb;
        $crossword_table_name = $wpdb->prefix . "crosswordengine_crosswords";
        $sql = "SELECT * FROM $crossword_table_name";
        $sql .= " ORDER BY " . $this->opts["order_by"] . " " . $this->opts["order"];
        $sql .= " LIMIT " . $this->opts["limit"] . " OFFSET " . $this->opts["offset"];
        $crosswords = $wpdb->get_results($sql);
        foreach ($crosswords as $crossword) {
            $this->crosswords[] = new CrosswordEngineCrossword($crossword->ID, $crossword);
        }
    }
    
    public function get_crosswords() {
        return $this->crosswords;
    }

    public function get_crosswords_array() {
        $crosswords = array();
        foreach ($this->crosswords as $crossword) {
            $crosswords[] = $crossword->get_crossword_array();
        }
        return $crosswords;
    }

    public function get_crossword_list() {
        $map_crossword = function ($crossword) {
            return $crossword->get_crossword_basics();
        };
        $crosswords = array_map($map_crossword, $this->get_crosswords());
        return $crosswords;
    }
}

?>