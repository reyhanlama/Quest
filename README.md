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
- Enter the tea house and click its bookshelf or open notebook to read Reyhan’s essays and field notes.
- Use the Places menu for direct navigation, including on mobile.
- Drag or swipe the map to explore; use Back to the village or Escape to return.
- The red bus follows the stone road; cloud banks drift and tea-house smoke rises.
- Use the scenery pause button to stop ambient movement. Reduced-motion preferences are respected, and animation pauses when the browser tab is hidden.
- Sound is enabled by default and begins after the visitor’s first interaction, as required by browser audio policies. It is synthesized locally through Web Audio.
- Visited places are saved only in this browser.

## Add your content

Portfolio copy, writing, destinations, email, and social links live in `content.js`. Project case studies and photography collections live in `experience-content.js`. The Netlify-ready letter form posts to the site root.

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
- **Design Studio:** Three selected public-sector and travel projects with detailed case-study views.
- **Forest Cabin:** Three albums of Reyhan’s photographs with thumbnail, previous/next, and keyboard-arrow navigation.
- **Navigation:** Places works inside rooms at every screen size. Map and room positions persist locally. Collection URLs support reload and browser Back, for example `#tea/read/designer-boundary-moved`, `#studio/project/lakshadweep`, and `#trail/album/roads/1`.

`experience-content.js` owns the project and album collections. Writing lives in `content.js`. Each album’s `photos` entry accepts a local image filename, title, caption, and position.

`experiences.js` implements collections, route restoration, and local reading/navigation state. `experiences.css` contains their responsive styles. No account, backend, analytics, or deployment is required. Reading state uses `mountain-journal-reading`; navigation uses `mountain-journal-travel` in browser local storage. The original visited-place state remains separate.

## Public beta and Netlify

This repository is ready to deploy as a static Netlify site. Connect the GitHub repository in Netlify and use the defaults detected from `netlify.toml`; there is no build command and the publish directory is `.`.

The published bundle contains local artwork, project previews, and photographs. Netlify receives the Post Office form through its built-in form handling; after the first production deploy, enable form notifications in the Netlify dashboard if you want submissions forwarded by email.

Before announcing a permanent public launch:

1. Review and refine the imported portfolio copy and project case-study details.
2. Once the Netlify or custom domain is known, change `og:image` in `index.html` to the absolute URL of `share-card.webp`, and add a canonical link plus a sitemap using that domain.
3. Keep Netlify deploy previews enabled and check one on iPhone Safari, Android Chrome, Firefox, and a slow mobile connection before promoting it to production.

## Ambient life

The Sound control defaults to on and combines low wind with a procedurally synthesized, low-pitched temple bell. Browsers begin playback on the visitor's first interaction, then a bell sounds shortly afterward and at irregular 22–38 second intervals with a long decay; no audio file or licensed recording is used. Audio stops scheduling while the tab is hidden.

Two small prayer-flag strings, occasional rhododendron petals, and a periodic fog bank around the upper shrine are DOM overlays in `scenery.js`. They share the illustrated map plane, pause with the Scenery control, and respect reduced-motion preferences. The summit fog crosses in soft layers and leaves a long clear interval before returning. Clouds, chimney smoke, the bus, flags, petals, and summit fog are the intended motion budget; adding movement to trees, houses, or every decorative object would weaken the map’s calm focal hierarchy.
