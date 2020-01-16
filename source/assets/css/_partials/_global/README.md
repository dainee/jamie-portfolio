# The Process for Icons

1. Export the icon as an svg from Sketch or PhotoShop
2. Run the svg through [SVGOMG](https://jakearchibald.github.io/svgomg/)
3. In Illustrator, open the icon-template.ai
4. Copy/Paste the icon you had exported into this template
5. Resize the icon so that either the width or height snap to a guide - do not expand beyond the guides on either direction
    * If the icon does not seem to scale properly, it may be that it is stroke-based instead of fill-based. If that is the case, do an Object > Expand prior to resizing.
6. Align the icon to the center of the Artboard (make sure "Align To:" > "Align to Artboard" is enabled)
7. Make sure that your icon is a single shape.  Select the shape(s) and try:
    * Object > Expand
    * Object > Clipping Path > Release (and delete any "rectangles of color")
    * Object > Compound Path > Make
8. File > Save As > Format: SVG (svg)
9. In the window that appears, Click on the "SVG Code..." button
10. Copy the path tag (should only be one) into a new key in _icons.svg, following the same pattern as others
    * Ensure that there are no line breaks in the path - replace them all with spaces
    * If your icon is made up of entirely vertical and horizontal lines (e.g. a pause button, a hamburger icon), you can add an additional attribute: `shape-rendering="crispEdges"` in order to reduce anti-aliasing weirdness
11. In the path, either add or replace the values of the `fill`, `stroke` and `stroke-width` attributes
12. Add the icon name to the _data/partials/02-icons/all-icons.json list
