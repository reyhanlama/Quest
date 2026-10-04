# A life in little places

A local interactive portfolio prototype inspired by the supplied Sikkim village reference.

## Run locally

From this folder:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://localhost:4173. No install or build step is required. Nothing is deployed.

## Explore

- Click a signpost to zoom toward a destination.
- Enter the tea house and click its bookshelf or open notebook to read sample writing.
- Use the Places menu for direct navigation, including on mobile.
- Drag or swipe the map to explore; use Back to the village or Escape to return.
- The red bus follows the stone road; cloud banks drift and tea-house smoke rises.
- Use the scenery pause button to stop ambient movement. Reduced-motion preferences are respected, and animation pauses when the browser tab is hidden.
- Sound is opt-in, synthesized locally through Web Audio.
- Visited places are saved only in this browser.

## Add your content

Edit `content.js` to replace sample writing, project entries, and destination descriptions. Set `contactEmail` to enable the email link. The letter form only copies a draft and never sends it. Biography text and the sample journey are in `index.html` and `app.js`. Photography currently has a placeholder entry; no personal photographs were supplied.

The app uses vanilla HTML, CSS, and JavaScript. Fonts load from Google Fonts with local fallback fonts if offline. Illustrations are stored locally in `assets/`.

## Artwork and current revision

Created using the built-in image-generation tool. Original images remain available for comparison; the current app uses:

- `assets/village-open-meadows.webp`: River-free village with fewer trees, open meadows, and a clear foreground ledge for the road.
- `assets/tea-house-simple.webp`: A simpler, spacious pixel-art tea room that matches the exterior.
- `assets/hill-bus.webp`: Previous bus artwork, retained for comparison. The active bus is drawn directly in Canvas.
- `assets/mountain-cloud.webp`: Transparent pixel-art mountain cloud bank.

Generation prompts, condensed:

1. **Hillside:** Edit the existing village map. Preserve the precise positions of the buildings, mountains, paths and greenery. Replace every river, waterfall and pool with dry wooded gullies, mossy rock and green terraces. Keep the bridge over a dry gully. Remove the static bus and chimney smoke for separate animation. No labels or UI.
2. **Tea house:** Use the outdoor map as the style and palette reference. Create a simple 16-bit RPG interior with chunky pixel clusters, broad color areas, minimal texture and open floor space. Wooden walls, mountain windows, a bookshelf, one low table with notebook and teapot, two red cushions, a small plant and stove. No ornate fabrics or clutter.
3. **Bus:** One transparent red-and-cream Sikkim bus sprite, elevated three-quarter view, front toward the lower right, approximately 24 degrees below horizontal. Simple game pixel art, navy outline and blue-gray windows. No road, smoke or text.
4. **Cloud:** One transparent, horizontally stretched pixel-art cloud bank. Irregular fluffy silhouette with white/peach light and pale lavender-blue shadow. Small stepped pixel clusters, no scenery or text.

`road.js` defines a continuous cubic curve in the illustration’s original 1536 × 1024 coordinates. `scenery.js` uses that same geometry for the rendered paving, curb, railing, bus position and heading. The road is drawn once at native map resolution, with irregular paving, a shaded masonry retaining face, timber railing and broken grass edges. The bus uses a separate Canvas layer and is constructed directly at game scale, including wheels, windows, roof, door and front face; no large bus image is resized. Arc-length sampling gives the bus constant speed. Its ground plane and wheel contact points use the road tangent, so perspective changes coherently along the route. The old bobbing and on-road fade are removed; both ends of the route are outside the map, so looping happens offscreen. All layers pan and zoom together.

Latest landscape prompt: Preserve building positions, mountains and upper footpaths. Remove roughly 40 percent of dense trees and bushes in the central and lower village, replacing them with grassy terraces, flowers and mossy rock. Replace the old foreground road and fence with an unobstructed grassy ledge for the separate rendered road. Keep the river-free pixel-art palette and layout. Generated using the built-in image tool, saved as `assets/village-open-meadows.webp`.

## Rooms, character and navigation

All seven destinations now have illustrated interiors and clickable objects. `rooms.js` holds each image, object position, label and content action. Six new backgrounds (`monastery.webp`, `studio.webp`, `projects.webp`, `skills.webp`, `trail.webp`, `contact.webp`) and `character.webp` were created with the built-in image-generation tool and saved in `assets/`.

Room prompts used the simplified tea-house image as a style reference: sparse chunky pixel-art interiors with warm timber, mountain daylight and open floor space, no people, interface or legible text. Destination-specific objects are manuscripts and a study table; drafting table and computer; seed trays and miniature village; workbench and tools; photographs and field journal; envelopes and a writing counter. Character prompt: a friendly black-haired adult in a rust overshirt, navy trousers and hiking boots, waving with a small backpack, isolated on transparency.

Map dots are anchored to buildings in `content.js`. Labels appear on hover or keyboard focus; on touch, the first tap reveals the label and a second enters. The Forest Trail now enters the Forest Cabin on the upper-right plateau. The clickable character beside the tea house opens the introduction, journey and contact links. The Places menu provides direct access.

Rooms fill the viewport at their original aspect ratio and extend sideways on mobile. Drag or swipe to pan; keyboard users can focus the room and use arrow keys. Image and hotspots share the same scroll plane. Back navigation and object shortcuts stay fixed over the scene. Closing content returns to the current room and preserves its scroll position.

## Compact character revision

The map and introduction now use `assets/character-compact.webp`. Created with the built-in image-generation tool using the user's supplied pixel portrait as reference. Prompt: isolate and recreate only the compact front-facing RPG character, with oversized tousled dark hair, a simple tan face, orange-red jacket and straps, navy outfit, arms down and tiny boots; chunky low-detail pixels, dark outline, limited palette, transparent background, no parchment or interface. The previous waving character remains in `assets/character.webp` for comparison.


## Collections and reading (October 2026)

- **Tea House:** Cloth-cover bookshelf, essays and field notes, a saved shelf, a long-form reader, adjustable type size, and locally remembered reading progress.
- **Design Studio:** Three project sheets and detailed case-study views, with the actual village prototype plus two explicitly fictional projects, Hillpost and Margin. Product sketches use HTML/CSS.
- **Forest Cabin:** Three albums and a lightbox with thumbnail, previous/next, and keyboard-arrow navigation. Existing illustrated village assets are labelled as placeholders for future photography.
- **Navigation:** Places works inside rooms at every screen size. Map and room positions persist locally. Collection URLs support reload and browser Back, for example `#tea/read/attention`, `#studio/project/hillpost`, and `#trail/album/hillside/1`.

`experience-content.js` owns the current sample writing, projects, and albums. It loads after `content.js` and replaces its earlier writing samples. Update `window.villageCollection` and `window.journalContent.writings` there to add real content. Each album's `photos` entry accepts a local image filename, title, caption, and position. All current editorial pieces and projects marked fictional are demonstration content authorised by the user, not claims about their career.

`experiences.js` implements collections, route restoration, and local reading/navigation state. `experiences.css` contains their responsive styles. No account, backend, analytics, or deployment is required. Reading state uses `mountain-journal-reading`; navigation uses `mountain-journal-travel` in browser local storage. The original visited-place state remains separate.

## Public beta and Netlify

This repository is ready to deploy as a static Netlify site. Connect the GitHub repository in Netlify and use the defaults detected from `netlify.toml`; there is no build command and the publish directory is `.`.

The published bundle contains only active WebP artwork and is roughly 3 MB. Netlify receives the Post Office form through its built-in form handling; after the first production deploy, enable form notifications in the Netlify dashboard if you want submissions forwarded by email.

Before announcing a permanent public launch:

1. Replace fictional projects, sample writing, and illustrated photo placeholders in `experience-content.js`.
2. Add a direct contact email to `contactEmail` in `content.js` if desired.
3. Once the Netlify or custom domain is known, change `og:image` in `index.html` to the absolute URL of `share-card.webp`, and add a canonical link plus a sitemap using that domain.
4. Keep Netlify deploy previews enabled and check one on iPhone Safari, Android Chrome, Firefox, and a slow mobile connection before promoting it to production.

## Ambient life

The Sound control defaults to on and combines low wind with a procedurally synthesized, low-pitched temple bell. Browsers begin playback on the visitor's first interaction, then a bell sounds shortly afterward and at irregular 22–38 second intervals with a long decay; no audio file or licensed recording is used. Audio stops scheduling while the tab is hidden.

Two small prayer-flag strings, occasional rhododendron petals, and a periodic fog bank around the upper shrine are DOM overlays in `scenery.js`. They share the illustrated map plane, pause with the Scenery control, and respect reduced-motion preferences. The summit fog crosses in soft layers and leaves a long clear interval before returning. Clouds, chimney smoke, the bus, flags, petals, and summit fog are the intended motion budget; adding movement to trees, houses, or every decorative object would weaken the map’s calm focal hierarchy.
