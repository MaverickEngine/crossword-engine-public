<div class="wrap">
    <form method="post" enctype="multipart/form-data">
        <h1>Add New Crossword</h1>
        <?php settings_errors(); ?>
        <hr>
        <table class="form-table">
            <tbody>
                <tr>
                    <th scope="row"><?php _e("Title", "crosswordengine") ?></th>
                    <td>
                        <input type="text" class="form-control" id="crossword_title" name="crossword_title" placeholder="Title">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php _e("Editor", "crosswordengine") ?></th>
                    <td>
                        <input type="text" class="form-control" id="crossword_editor" name="crossword_editor" placeholder="Editor">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php _e("Author", "crosswordengine") ?></th>
                    <td>
                    <input type="text" class="form-control" id="crossword_author" name="crossword_author" placeholder="Author">
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