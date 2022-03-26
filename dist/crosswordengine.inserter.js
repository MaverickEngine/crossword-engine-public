/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!*************************!*\
  !*** ./src/inserter.js ***!
  \*************************/
jQuery(function($) {
    $(document).ready(function(){
        $('#crosswordengine_media_button').click(open_crosswordengine_window);
    });

    async function open_crosswordengine_window(e) {
        e.preventDefault();
        const el = $("#crosswordengine_insert_shortcode_modal_content");
        el.html(`Fetching crosswords...`);
        try {
            const result = await jQuery.get("/wp-json/crosswordengine/v1/crosswords");
            el.html(`<table>
                <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Insert</th>
                </tr>
                ${result.map(crossword => `
                    <tr>
                        <td>${new Date(crossword.date).toUTCString()}</td>
                        <td>${crossword.title}</td>
                        <td>
                            <a href="#" data-id="${crossword.id}" class="crosswordengine_insert_shortcode_insert">Insert</button>
                        </td>
                    </tr>
                `).join("")}
            </table>`);
            $(".crosswordengine_insert_shortcode_insert").click(e => {
                const id = $(e.target).data("id");
                const shortcode = `[crosswordengine id="${id}"]`;
                wp.media.editor.insert(shortcode);
            })
        } catch(err) {
            el.html(`There was an error fetching the crosswords.`);
            console.error(err);
        }
    }
});
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Jvc3N3b3JkZW5naW5lLmluc2VydGVyLmpzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQSw4QkFBOEIsdUNBQXVDO0FBQ3JFLDhCQUE4QixnQkFBZ0I7QUFDOUM7QUFDQSxtREFBbUQsYUFBYTtBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwREFBMEQsR0FBRztBQUM3RDtBQUNBLGFBQWE7QUFDYixVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDLEUiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jcm9zc3dvcmQtZW5naW5lLy4vc3JjL2luc2VydGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImpRdWVyeShmdW5jdGlvbigkKSB7XG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcbiAgICAgICAgJCgnI2Nyb3Nzd29yZGVuZ2luZV9tZWRpYV9idXR0b24nKS5jbGljayhvcGVuX2Nyb3Nzd29yZGVuZ2luZV93aW5kb3cpO1xuICAgIH0pO1xuXG4gICAgYXN5bmMgZnVuY3Rpb24gb3Blbl9jcm9zc3dvcmRlbmdpbmVfd2luZG93KGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCBlbCA9ICQoXCIjY3Jvc3N3b3JkZW5naW5lX2luc2VydF9zaG9ydGNvZGVfbW9kYWxfY29udGVudFwiKTtcbiAgICAgICAgZWwuaHRtbChgRmV0Y2hpbmcgY3Jvc3N3b3Jkcy4uLmApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgalF1ZXJ5LmdldChcIi93cC1qc29uL2Nyb3Nzd29yZGVuZ2luZS92MS9jcm9zc3dvcmRzXCIpO1xuICAgICAgICAgICAgZWwuaHRtbChgPHRhYmxlPlxuICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgPHRoPkRhdGU8L3RoPlxuICAgICAgICAgICAgICAgICAgICA8dGg+VGl0bGU8L3RoPlxuICAgICAgICAgICAgICAgICAgICA8dGg+SW5zZXJ0PC90aD5cbiAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICR7cmVzdWx0Lm1hcChjcm9zc3dvcmQgPT4gYFxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+JHtuZXcgRGF0ZShjcm9zc3dvcmQuZGF0ZSkudG9VVENTdHJpbmcoKX08L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPiR7Y3Jvc3N3b3JkLnRpdGxlfTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiNcIiBkYXRhLWlkPVwiJHtjcm9zc3dvcmQuaWR9XCIgY2xhc3M9XCJjcm9zc3dvcmRlbmdpbmVfaW5zZXJ0X3Nob3J0Y29kZV9pbnNlcnRcIj5JbnNlcnQ8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgYCkuam9pbihcIlwiKX1cbiAgICAgICAgICAgIDwvdGFibGU+YCk7XG4gICAgICAgICAgICAkKFwiLmNyb3Nzd29yZGVuZ2luZV9pbnNlcnRfc2hvcnRjb2RlX2luc2VydFwiKS5jbGljayhlID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpZCA9ICQoZS50YXJnZXQpLmRhdGEoXCJpZFwiKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzaG9ydGNvZGUgPSBgW2Nyb3Nzd29yZGVuZ2luZSBpZD1cIiR7aWR9XCJdYDtcbiAgICAgICAgICAgICAgICB3cC5tZWRpYS5lZGl0b3IuaW5zZXJ0KHNob3J0Y29kZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgZWwuaHRtbChgVGhlcmUgd2FzIGFuIGVycm9yIGZldGNoaW5nIHRoZSBjcm9zc3dvcmRzLmApO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgfVxufSk7Il0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9