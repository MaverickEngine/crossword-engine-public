<div class="wrap">
    <form method="post" action="options.php">
        <?php settings_fields( 'crosswordengine-settings-group' ); ?>
        <?php do_settings_sections( 'crosswordengine-settings-group' ); ?>
        <h1><?php _e( 'CrosswordEngine Settings', 'crosswordengine' ); ?></h1>
        <?php settings_errors(); ?>
        <hr>
        <table class="form-table">
            <tbody>
                <tr>
                    <th scope="row"><?php _e("Developer mode", "crosswordengine") ?></th>
                    <td>
                        <input type="checkbox" name="crosswordengine_developer_mode" value="1" <?php echo get_option('crosswordengine_developer_mode') ? 'checked' : '' ?>>
                    </td>
                </tr>
            </tbody>
        </table>
        <?=	submit_button(); ?>
    </form>
</div>