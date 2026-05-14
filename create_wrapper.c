#include <X11/Xlib.h>
#include <X11/Xutil.h>
#include <string.h>

// Wrapper: create a window with dark red background and draw centered text "text"
Window create_simple_window(Display *display, Window parent, int x, int y, unsigned int width, unsigned int height) {
    Colormap colormap = DefaultColormap(display, DefaultScreen(display));
    XColor spare, exact;

    // Allocate dark red background
    if (!XAllocNamedColor(display, colormap, "dark red", &spare, &exact)) {
        // fallback to hard-coded value if allocation fails
        spare.pixel = 0x440000;
    }
    unsigned long background = spare.pixel;

    // Allocate black border
    if (!XAllocNamedColor(display, colormap, "black", &spare, &exact)) {
        spare.pixel = 0x000000;
    }
    unsigned long border = spare.pixel;

    Window win = XCreateSimpleWindow(display, parent, x, y, width, height, 1, border, background);

    // Map and flush so window is visible
    XMapWindow(display, win);
    XFlush(display);

    // Create GC for drawing text
    GC gc = XCreateGC(display, win, 0, NULL);

    // Set text color to white
    if (!XAllocNamedColor(display, colormap, "white", &spare, &exact)) {
        spare.pixel = 0xFFFFFF;
    }
    XSetForeground(display, gc, spare.pixel);

    // Load a simple fixed font
    XFontStruct *fontinfo = XLoadQueryFont(display, "fixed");
    if (fontinfo) {
        XSetFont(display, gc, fontinfo->fid);
    }

    const char *msg = "text";
    int len = (int)strlen(msg);
    int text_width = 0;
    if (fontinfo) text_width = XTextWidth(fontinfo, msg, len);
    else text_width = len * 8; // fallback estimate

    int tx = (int)width / 2 - text_width / 2;
    int ty = (int)height / 2;

    XDrawString(display, win, gc, tx, ty, msg, len);
    XFlush(display);

    if (fontinfo) XFreeFont(display, fontinfo);

    return win;
}
