<div class="wrap">
    <form method="post" enctype="multipart/form-data">
        <h1>Edit Crossword</h1>
        <?php settings_errors(); ?>
        <hr>
        <table class="form-table">
            <input type="hidden" name="crossword_id" value="<?php echo $crossword->get("ID"); ?>">
            <tbody>
                <tr>
                    <th scope="row"><?php _e("Title", "crosswordengine") ?></th>
                    <td>
                        <input type="text" class="form-control" id="crossword_title" name="crossword_title" placeholder="Title" value="<?= $crossword->get("title") ?>">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php _e("Editor", "crosswordengine") ?></th>
                    <td>
                        <input type="text" class="form-control" id="crossword_editor" name="crossword_editor" placeholder="Editor" value="<?php echo $crossword->get("editor"); ?>">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php _e("Author", "crosswordengine") ?></th>
                    <td>
                    <input type="text" class="form-control" id="crossword_author" name="crossword_author" placeholder="Author" value="<?php echo $crossword->get("author"); ?>">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php _e("Date", "crosswordengine") ?></th>
                    <td>
                        <input type="date" class="form-control" id="crossword_date" name="crossword_date" placeholder="Date" value="<?php echo date("Y-m-d", strtotime($crossword->get("date"))); ?>">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php _e("XD Data", "crosswordengine") ?></th>
                    <td>
                        <textarea rows="20" style="width:100%" class="form-control" id="crossword_xd_data" name="crossword_xd_data" placeholder="XD Data"><?php echo $crossword->get("xd_data"); ?></textarea>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php _e("Upload XD file", "crosswordengine") ?></th>
                    <td>
                        <input type="file" class="form-control" id="crossword_xd_file" name="crossword_xd_file" placeholder="Upload XD file">
                    </td>
                </tr>
            </tbody>
        </table>
        <?=	submit_button(); ?>
    </form>
</div>