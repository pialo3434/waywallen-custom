# Waywallen Custom website

Static project site for the independent Waywallen Custom build. The three browser demos cover Scene Colors, wallpaper folders, and launcher themes. The motion preview uses a real Workshop wallpaper recording. The folder and theme screenshots come from the Waywallen Custom Linux app with a demo library.

Preview locally with `python -m http.server 8000`, then open `http://localhost:8000/`. GitHub Pages publishes the `main` branch root. The site uses relative asset URLs.

## Credits

- [Waywallen](https://github.com/waywallen/waywallen) by hypengw and contributors. The original Waywallen icon is provided under the [MIT license](assets/waywallen-LICENSE.txt). The library, folder editor, theme presets, theme editor, and scene controls images are captures from test profiles in Waywallen Custom.
- [4K Audio Visualizer by Alice](https://steamcommunity.com/sharedfiles/filedetails/?id=921617616) ([source](https://github.com/Alice-Jie/AudioVisualizer), [MIT license](assets/audio-visualizer-LICENSE.txt)). The site uses a silent six-second recording of the Workshop project with its built-in gradient, ring and particle settings, driven by a simulated audio spectrum. The demo stills are frames from that wallpaper. The browser preview grades the recording. Native Scene Colors are applied by the renderer to supported Scene wallpapers.
- [Open Wallpaper Engine](https://github.com/waywallen/open-wallpaper-engine) is distributed under GPL-2.0-only.
- [Otaku Video Portal by AncoraThemes](https://otaku.ancorathemes.com/video-portal/) was a reference for layered parallax and the pacing of full-width scenes. [Apple’s iPhone 18 Pro product page](https://www.apple.com/iphone-18-pro/) and [Wallpaper Engine](https://www.wallpaperengine.io/en) were earlier references for presentation. The [upstream Waywallen site](https://waywallen.github.io/) provided project context.
- Bricolage Grotesque is distributed under the [SIL Open Font License](assets/fonts/OFL.txt).
