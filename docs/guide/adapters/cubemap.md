# Cubemap adapter

[Cube mapping](https://en.wikipedia.org/wiki/Cube_mapping) is a kind of projection where the environment is mapped to the six faces of a cube around the viewer.

Photo Sphere Viewer supports cubemaps as six distinct image files. The files can be provided as [an object or an array](./config.md#panorama-required).

All features of Photo Sphere Viewer are fully supported when using cubemaps but the `fisheye` option gives funky results.

```js
new PhotoSphereViewer.Viewer({
  adapter: PhotoSphereViewer.CubemapAdapter,
  panorama: {
    left:   'path/to/left.jpg',
    front:  'path/to/front.jpg',
    right:  'path/to/right.jpg',
    back:   'path/to/back.jpg',
    top:    'path/to/top.jpg',
    bottom: 'path/to/bottom.jpg',
  },
});
```

::: warning
This adapter does not use `panoData` option. You can use `sphereCorrection` if the tilt/roll/pan needs to be corrected.
:::


## Example

<iframe style="width: 100%; height: 600px;" src="//jsfiddle.net/mistic100/1jL5yc2r/embedded/result,js/dark" allowfullscreen="allowfullscreen" frameborder="0"></iframe>


## Configuration

When using this adapter the `panorama` option and the `setPanorama()` method accept an array or an object of six URLs.

```js
// Cubemap as array (order is important) :
panorama: [
  'path/to/left.jpg',
  'path/to/front.jpg',
  'path/to/right.jpg',
  'path/to/back.jpg',
  'path/to/top.jpg',
  'path/to/bottom.jpg',
]

// Cubemap as object :
panorama: {
  left:   'path/to/left.jpg',
  front:  'path/to/front.jpg',
  right:  'path/to/right.jpg',
  back:   'path/to/back.jpg',
  top:    'path/to/top.jpg',
  bottom: 'path/to/bottom.jpg',
}
```
