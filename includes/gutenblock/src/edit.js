/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/packages/packages-block-editor/#useBlockProps
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/developers/block-api/block-edit-save/#edit
 *
 * @return {WPElement} Element to render.
 */
import apiFetch from '@wordpress/api-fetch';
export default function Edit() {
	const crosswords = [];
	apiFetch({ path: '/wp/v2/posts' }).then(function(data) {
		console.log({data})
		return (
			<p {...useBlockProps()}>
				<p>Select a Crossword, or <a href="#">create one quickly</a>...</p>
				<select>
					{crosswords.map(crossword => (
						<option key={crossword.id} value={crossword.id}>
							{crossword.title.rendered}
						</option>
					))}
				</select>
			</p>
		);
	})
	.catch(function(error) {
		console.log({error})
		return (
			<p {...useBlockProps()}>
				<p>Oh dear, we are experiencing an error...</p>
			</p>
		);
	});
}
