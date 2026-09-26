# 💖 Birthday Surprise

Open `index.html` in a browser (double-click works, no install needed).

## Make it yours: edit `js/config.js`
- `name`, `nickname`, `from`: her name and yours
- `balloonNotes`, `reasons`, `wishes`, `letter`: all the messages
- `memories`: titles and captions for each photo
- `togetherSince`: "YYYY-MM-DD" shows a live "together for" counter at the end
- `secretMessage`: the final secret (a great place for a real-life surprise hint)
- `candles`: number of candles on the cake

## Photos
All photos live in `assets/photos/gallery/` as `1.jpg` … `68.jpg`, sorted by date.
To add more, save them as `69.jpg`, `70.jpg` … and update the count in `js/config.js` (GALLERY_COUNT).
The memory carousel picks 8 of them by number in `js/config.js` → `memories`.
Full-size originals are kept outside the site in `../Birthday-original-photos/`.

## Music
Default is a happy-birthday tune in `assets/music/song.mp3`.
Swap in your song: drop the mp3 into `assets/music/` and set `music` in `js/config.js`.

## Chapters
Gate → countdown → 3D balloon playground (10 love notes, then a gift) → memory carousel
→ reasons jar → 3D cake (blow the candles by holding the button, using the mic, or tapping flames)
→ wish lanterns → love letter → fireworks finale + secret.
Hidden extras: the tiny ✦ star on the first screen, tapping the moon 3 times, tapping 3D hearts, double-tapping anywhere.

## Share it with her
Drag this folder onto https://app.netlify.com/drop to get a link.
(The mic only works over https, which Netlify gives you.)
