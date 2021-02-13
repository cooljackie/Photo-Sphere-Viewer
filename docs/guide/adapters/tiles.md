# Equirectangular tiles adapter

This adapter is used to load equirectangular panoramas which has been sliced into many smaller files, it drastically improve the initial loading time and the used bandwidth.

```js
new PhotoSphereViewer.Viewer({
  adapter: PhotoSphereViewer.EquirectangularTilesAdapter,
  panorama: {
    width: 6000,
    cols: 16,
    rows: 8,
    baseUrl: 'low_res.jpg',
    tileUrl: (col, row) => {
      return `tile_${col}x${row}.jpg`;
    },
  },
});
```

::: warning
This adapter does not use `panoData` option. You can use `sphereCorrection` if the tilt/roll/pan needs to be corrected.
:::


## Example

TODO


## Configuration

When using this adapter the `panorama` option and the `setPanorama()` method accept an object to configure the tiles.

#### `width` (required)
- type: `number`

Total width of the panorama, the height is always width / 2.

#### `cols` (required)
- type: `number` multiple of 4

Number of columns.

#### `rows` (required)
- type: `number` multiple of 2

Number of rows.

#### `tileUrl` (required)
- type: `function: (col, row) => string`

Function used to build the URL of a tile.

#### `baseUrl` (recommended)
- type: `string`

URL of a low resolution complete panorama image to display while the tiles are loading.
