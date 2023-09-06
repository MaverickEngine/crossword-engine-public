<?php

class CrosswordEngineRedirects {
    public function __construct() {
        if (empty($_SERVER['REQUEST_URI'])) return;
        $this->uri = sanitize_url($_SERVER['REQUEST_URI']);
        $this->parsed_url = wp_parse_url($this->uri);
        if (!is_array($this->parsed_url)) return;
        $this->parameters = wp_parse_args($this->parsed_url["query"] ?? null);
        if (!preg_match('/\/crosswords\/(latest|today)\/(.*)/', $this->parsed_url["path"], $matches)) {
            return;
        }
        $this->redirect(urldecode($matches[2]), $this->parsed_url["query"]);
    }

    public function redirect($tag, $params) {
        $query = [
            'post_type' => CROSSWORDENGINE_POST_TYPE,
            'posts_per_page' => 1,
            'orderby' => 'date',
            'order' => 'DESC',
            'post_status' => 'publish',
            'tax_query' => [
                'relation' => 'OR',
                [
                    'taxonomy' => 'section',
                    'field' => 'slug',
                    'terms' => [CROSSWORDENGINE_SECTION],
                ],
                [
                    'taxonomy' => CROSSWORDENGINE_TAXONOMY,
                    'field' => 'slug',
                    'terms' => [$tag],
                ],
            ],
        ];
        $latest_crossword = get_posts($query);
        if (empty($latest_crossword)) {
            exit;
        }
        $latest_crossword = $latest_crossword[0];
        $latest_crossword_url = get_permalink($latest_crossword->ID);
        if (!empty($params)) {
            if (strpos($latest_crossword_url, "?") === false) {
                $latest_crossword_url .= "?";
            } else {
                $latest_crossword_url .= "&";
            }
            $latest_crossword_url .= $params;
        }
        wp_redirect($latest_crossword_url);
        exit;
    }
}