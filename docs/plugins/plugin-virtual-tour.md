# VirtualTourPlugin

<ApiButton page="PSV.plugins.VirtualTourPlugin.html"/>

> Create virtual tours by linking multiple panoramas.

This plugin is available in the core `photo-sphere-viewer` package in `dist/plugins/virtual-tour.js`.

[[toc]]

## Usage

The plugin allows to define `nodes` which contains a `panorama` and one or more `links` to other nodes. The links are represented with a 3D arrow (default) or using the [Markers plugin](./plugin-markers.md).

There two different ways to define the position of the links : the manual way and the GPS way.

:::: tabs

::: tab Manual mode
In manual mode each link must have `longitude`/`latitude` or `x`/`y` coordinates to be placed at the correct location on the panorama. This morks exactly like the placement of markers.

```js
const node = {
  id: 'node-1',
  panorama: '001.jpg',
  links: [{
    nodeId: 'node-2',
    x: 1500,
    y: 780,
  }],
};
```
:::

::: tab GPS mode
In GPS mode each node has positionning coordinates and the links are placed automatically.

```js
const node = {
  id: 'node-1',
  panorama: '001.jpg',
  position: [-80.156479, 25.666725], // optional altitude has 3rd value
  links: [{
    nodeId: 'node-2',
  }],
};
```
:::

::::


## Example

<iframe style="width: 100%; height: 500px;" src="//jsfiddle.net/mistic100/y0svuLpt/embedded/result,js,html/dark" allowfullscreen="allowfullscreen" frameborder="0"></iframe>


## Nodes options

#### `id` (required)
- type: `string`

Unique identifier of the node

#### `panorama` (required)
- type: `string | string[] | object`

Refer to the main [config page](../guide/config.md) for possible values.

#### `links` (required)
- type: `array`

Definition of the links of this node. See bellow.

#### `position` (required in GPS mode)
- type: `number[]`

GPS coordinates of this node as an array of two or three values (`[longitude, latitude, altitude]`).

#### `panoData`
- type: `object | function<Image, object>`

Refer to the main [config page](../guide/config.md) for possible values.

#### `name`
- type: `string`

Short name of this node, used in links tooltips.

#### `caption`
- type: `string`

Caption displayed in th navbar, if not defined the global caption will be used.

#### `markers`
- type: `array`

Additional markers displayed on this node, requires the [Markers plugin](./plugin-markers.md).


## Link options

#### `nodeId` (required)
- type: `string`

Identifier of the target node.

#### `x` & `y` or `latitude` & `longitude` (required in manual mode)
- type: `integer` or `double`

Position of the link in **texture coordinates** (pixels) or **spherical coordinates** (radians).

#### `arrowStyle`
- type: `object`

Overrides the global style of the arrow used to display the link. See global configuration for details.
_(Only effective if `renderMode=3d`)._

#### `markerStyle`
- type: `object`

Overrides the global style of the marker used to display the link. See global configuration for details.
_(Only effective if `renderMode=markers`)._


## Configuration

#### `nodes`
- type: `array`

Initial list of nodes. You can also call `setNodes` method later.

#### `startNodeId`
- type: `string`

Id of the initially loaded node. If empty the first node will be displayed. You can also call `setCurrentNode` method later.

#### `positionMode`
- type: `'manual' | 'gps'`
- default: `'manual'`

Configure how the links between nodes are positionned.

#### `renderMode`
- type: `'markers' | '3d'`
- default: `'3d'`

How the links are displayed, `markers` requires the [Markers plugin](./plugin-markers.md).

#### `markerStyle`
- type: `object`

Style of the marker used to display links. _(Only effective if `renderMode=markers`)._

Default value is:
```js
{
  html  : targetIcon, // an SVG provided by the plugin
  width : 80,
  height: 80,
  scale : [0.5, 2],
  style : {
    color: 'rgba(255, 255, 255, 0.8)',
  },
}
```

#### `arrowStyle`
- type: `object`

Style of the arrow used to display links. _(Only effective if `renderMode=3d`)._

Default value is:
```js
{
  color  : '#0055aa',
  opacity: 0.8,
}
```

(The 3D model used cannot be modified).

#### `markerLatOffset`
- type: `number`
- default: `-0.1`

Vertical offset in radians applied to the markers to compensate for the viewer position above ground.
_(Only effective if `renderMode=markers` and `positionMode=gps`)._


#### `arrowPosition`
- type: `number`
- default: `-3`

Vertical position of the arrows relative to the center of the viewer (unit is arbitrary).
_(Only effective if `renderMode=3d`)._


#### `arrowHoverColor`
- type: `string`
- default: `#aa5500`

Color applied to the arrows on mousehover. _(Only effective if `renderMode=3d`)._


## Methods

#### `setNodes(nodes, [startNodeId])`

Changes the nodes and display the first one (or the one designated by `startNodeId`).

#### `setCurrentNode(nodeId)`

Changes the current node.


## Events

#### `node-changed(nodeId)`

Triggered when the current node is changed.

```js
virtualTourPlugin.on('node-changed', (e, nodeId) => {
  console.log(`Current node is ${nodeId}`);
});
```
