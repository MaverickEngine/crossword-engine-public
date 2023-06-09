<div class="wrap">
    <form method="post" enctype="multipart/form-data">
        <input type="hidden" name="crossword_id" value="<?php echo esc_attr($crossword->get("ID")); ?>">
        <h1>Edit Crossword</h1>
        <?php settings_errors(); ?>
        <hr>
        <div id="crosswordengine-creator-container"></div>
        <?php submit_button(); ?>
    </form>
</div>