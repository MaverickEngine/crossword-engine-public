<?php
if( ! class_exists( 'WP_List_Table' ) ) {
    require_once( ABSPATH . 'wp-admin/includes/class-wp-list-table.php' );
}

if (!class_exists("CrosswordEngineCrosswords")) {
    require_once(plugin_dir_path( dirname( __FILE__ ) ).'../db/crosswords.php');
}

class CrosswordEngineTable extends WP_List_Table {

    public function __construct() {
        WP_List_Table::__construct([
            'singular' => 'crossword',
            'plural'   => 'crosswords',
            // 'ajax'     => false,
        ]);
    }
    
    /**
     * Prepare the items for the table to process
     *
     * @return Void
     */
    public function prepare_items() {
        $columns = $this->get_columns();
        $hidden = $this->get_hidden_columns();
        $sortable = $this->get_sortable_columns();

        $data = $this->table_data();
        usort( $data, array( &$this, 'sort_data' ) );

        $perPage = 30;
        $currentPage = $this->get_pagenum();
        $totalItems = count($data);
        
        $this->row_actions("edit", "delete");

        $this->set_pagination_args( array(
            'total_items' => $totalItems,
            'per_page'    => $perPage
        ) );

        $data = array_slice($data,(($currentPage-1)*$perPage),$perPage);

        $this->_column_headers = array($columns, $hidden, $sortable);
        $this->items = $data;
    }

    /**
     * Override the parent columns method. Defines the columns to use in your listing table
     *
     * @return Array
     */
    public function get_columns()
    {
        $columns = array(
            // 'id'     => 'ID',
            'cb'		=> '<input type="checkbox" />',
            'date'   => 'Date',
            'title'  => 'Title',
            'editor' => 'Editor',
            'author' => 'Author',
        );

        return $columns;
    }

    /**
     * Define which columns are hidden
     *
     * @return Array
     */
    public function get_hidden_columns()
    {
        return array();
    }

    /**
     * Define the sortable columns
     *
     * @return Array
     */
    public function get_sortable_columns()
    {
        return array(
            "date" => array("date", true),
            'title' => array('title', false),
        );
    }

    /**
     * Get the table data
     *
     * @return Array
     */
    private function table_data()
    {
        $Crosswords = new CrosswordEngineCrosswords();
        $crosswords = $Crosswords->get_crosswords_array();
        return (array) $crosswords;
    }

    /**
     * Define what data to show on each column of the table
     *
     * @param  Array $item        Data
     * @param  String $column_name - Current column name
     *
     * @return Mixed
     */
    public function column_default( $item, $column_name )
    {
        switch( $column_name ) {
            case 'id':
            // case 'title':
            case 'editor':
            case 'author':
                return $item[ $column_name ];
            case 'date':
                return date( 'Y/m/d', strtotime( $item[ $column_name ] ) );
            default:
                return " - ";
        }
    }

    /**
     * Show actions for title column
     */
    public function column_title($item) {
        $edit_link = admin_url( 'admin.php?page=crosswordengine&amp;action=edit&amp;edit=' .  $item["id"]  );
        $view_link = get_permalink( $item["title"] ); 
        $output    = '';
 
        // Title.
        $output .= '<strong><a href="' . esc_url( $edit_link ) . '" class="row-title">' . esc_html(  $item["title"]   ) . '</a></strong>';
 
        // Get actions.
        $actions = array(
            'edit'   => '<a target="_blank" href="' . esc_url( $edit_link ) . '">' . esc_html__( 'Edit', 'my_plugin' ) . '</a>',
            'view'   => '<a target="_blank" href="' . esc_url( $view_link ) . '">' . esc_html__( 'View', 'my_plugin' ) . '</a>',
        );
 
        $row_actions = array();
 
        foreach ( $actions as $action => $link ) {
            $row_actions[] = '<span class="' . esc_attr( $action ) . '">' . $link . '</span>';
        }
 
        $output .= '<div class="row-actions">' . implode( ' | ', $row_actions ) . '</div>';
 
        return $output;
    }

     /**
     * Get value for checkbox column.
     *
     * @param object $item  A row's data.
     * @return string Text to be placed inside the column <td>.
     */
    protected function column_cb( $item ) {
        return sprintf(
        '<label class="screen-reader-text" for="crossword_' . $item['id'] . '">' . sprintf( __( 'Select %s' ), $item['crossword_login'] ) . '</label>'
        . "<input type='checkbox' name='crosswords[]' id='crossword_{$item['id']}' value='{$item['id']}' />"
        );
    }

    /**
     * Allows you to sort the data by the variables set in the $_GET
     *
     * @return Mixed
     */
    private function sort_data( $a, $b )
    {
        // Set defaults
        $orderby = 'date';
        $order = 'desc';

        // If orderby is set, use this as the sort column
        if(!empty($_GET['orderby']))
        {
            $orderby = $_GET['orderby'];
        }

        // If order is set use this as the order
        if(!empty($_GET['order']))
        {
            $order = $_GET['order'];
        }


        $result = strcmp( $a[$orderby], $b[$orderby] );

        if($order === 'asc')
        {
            return $result;
        }

        return -$result;
    }

    public function get_bulk_actions() {
        /*
         * on hitting apply in bulk actions the url paramas are set as
         * ?action=bulk-download&paged=1&action2=-1
         * 
         * action and action2 are set based on the triggers above and below the table
         */
         $actions = array(
             'bulk-delete' => 'Delete'
         );
         return $actions;
    }
}
?>