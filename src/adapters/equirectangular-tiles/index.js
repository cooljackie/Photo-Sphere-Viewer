import { AbstractAdapter, CONSTANTS, PSVError, SYSTEM } from 'photo-sphere-viewer';
import * as THREE from 'three';
import { Queue, Task } from './Queue';

/**
 * @callback PanoramaUrl
 * @summary Function called to build a tile url
 * @memberOf PSV.adapters.EquirectangularTilesAdapter
 * @param {int} col
 * @param {int} row
 * @returns {string}
 */

/**
 * @typedef {Object} PSV.adapters.EquirectangularTilesAdapter.Panorama
 * @summary Configuration of a tiled panorama
 * @property {string} [baseUrl] - low resolution panorama loaded before tiles
 * @property {int} width - complete panorama width (height is always width/2)
 * @property {int} cols - number of vertical tiles
 * @property {int} rows - number of horizontal tiles
 * @property {PSV.adapters.EquirectangularTilesAdapter.PanoramaUrl} tileUrl - function to build a tile url
 */

/**
 * @typedef {Object} PSV.adapters.EquirectangularTilesAdapter.Tile
 * @private
 * @property {int} col
 * @property {int} row
 * @property {int} angle
 */

/**
 * @summary Number of vertice of the THREE.SphereGeometry
 * @memberOf PSV.constants
 * @type {number}
 * @constant
 */
const SPHERE_VERTICES = 64;

/**
 * @summary Number of parallel tile load
 * @memberOf PSV.constants
 * @type {number}
 * @constant
 */
const QUEUE_CONCURENCY = 2;

const tileId = tile => `${tile.col}x${tile.row}`;

/**
 * @summary Adapter for tiled panoramas
 * @memberof PSV.adapters
 */
export default class EquirectangularTilesAdapter extends AbstractAdapter {

  static debug = false;

  constructor(psv) {
    super(psv);

    this.canvas = [];
    this.textures = [];
    this.queue = new Queue(QUEUE_CONCURENCY);

    this.props = {
      colSize: 0,
      rowSize: 0,
      tiles  : {},
    };

    this.loader = new THREE.ImageLoader();
    if (this.psv.config.withCredentials) {
      this.loader.setWithCredentials(true);
    }

    this.psv.on(CONSTANTS.EVENTS.POSITION_UPDATED, this);
    this.psv.on(CONSTANTS.EVENTS.ZOOM_UPDATED, this);
  }

  destroy() {
    this.psv.off(CONSTANTS.EVENTS.POSITION_UPDATED, this);
    this.psv.off(CONSTANTS.EVENTS.ZOOM_UPDATED, this);

    super.destroy();
  }

  handleEvent(e) {
    /* eslint-disable */
    switch (e.type) {
      // @formatter:off
      case CONSTANTS.EVENTS.POSITION_UPDATED:
      case CONSTANTS.EVENTS.ZOOM_UPDATED:
        this.__refresh();
        break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @summary Loads the panorama texture
   * @param {PSV.adapters.EquirectangularTilesAdapter.Panorama} panorama
   * @returns {Promise.<PSV.TextureData>}
   */
  loadTexture(panorama) {
    if (typeof panorama !== 'object' || !panorama.width || !panorama.cols || !panorama.rows || !panorama.tileUrl) {
      return Promise.reject(new PSVError('Invalid panorama configuration, are you using the right adapter?.'));
    }
    if (panorama.cols % 4 !== 0 || panorama.rows % 2 !== 0) {
      return Promise.reject(new PSVError('Panorama cols must be multiple of 4 and rows must be multiple of 2.'));
    }

    panorama.height = panorama.width / 2;

    this.props.colSize = panorama.width / panorama.cols;
    this.props.rowSize = panorama.height / panorama.rows;

    this.queue.clear();
    this.props.tiles = {};
    this.textures.length = 0;
    this.canvas.length = 0;

    for (let i = 0; i < 8; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(panorama.width / 4, SYSTEM.getMaxCanvasWidth() / 2);
      canvas.height = canvas.width;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = this.psv.config.canvasBackground;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      this.canvas.push(canvas);
      this.textures.push(texture);

      if (EquirectangularTilesAdapter.debug) {
        ctx.fillStyle = ['#111', '#333', '#555', '#777', '#999', '#bbb', '#ddd', '#fff'][i];
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let col = 0; col < panorama.cols / 4; col++) {
          for (let row = 0; row < panorama.rows / 2; row++) {
            ctx.strokeStyle = 'red';
            ctx.strokeRect(col * this.props.colSize, row * this.props.rowSize, this.props.colSize, this.props.rowSize);
            ctx.font = `${this.props.colSize / 5}px serif`;
            ctx.fillStyle = '#a22';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const absCol = Math.floor(i / 2) * (panorama.cols / 4) + (panorama.cols / 4 - col - 1);
            const absRow = i % 2 * (panorama.rows / 2) + row;
            ctx.fillText(`${absCol}x${absRow}`, (col + 0.5) * this.props.colSize, (row + 0.5) * this.props.rowSize);
          }
        }

        texture.needsUpdate = true;
      }
    }

    const panoData = {
      fullWidth    : panorama.width,
      fullHeight   : panorama.height,
      croppedWidth : panorama.width,
      croppedHeight: panorama.height,
      croppedX     : 0,
      croppedY     : 0,
    };

    if (panorama.baseUrl && !EquirectangularTilesAdapter.debug) {
      return this.__loadBase(panorama.baseUrl)
        .then(() => {
          setTimeout(() => this.__refresh());

          return {
            texture : this.textures,
            panoData: panoData,
          };
        });
    }
    else {
      setTimeout(() => this.__refresh());

      return Promise.resolve({
        texture : this.textures,
        panoData: panoData,
      });
    }
  }

  __loadBase(url) {
    return this.psv.textureLoader.loadImage(url, p => this.psv.loader.setProgress(p))
      .then((image) => {
        for (let i = 0; i < 8; i++) {
          const ctx = this.canvas[i].getContext('2d');
          const x = Math.floor((7 - i) / 2);
          const y = i % 2;

          ctx.drawImage(image,
            x * image.width / 4, y * image.height / 2, image.width / 4, image.height / 2,
            0, 0, ctx.canvas.width, ctx.canvas.height);
        }
      });
  }

  /**
   * @summary Creates the mesh group
   * @param {number} [scale=1]
   * @returns {external:THREE.Group}
   */
  createMesh(scale = 1) {
    const group = new THREE.Group();

    group.add(this.__getSphereGeometry(scale, Math.PI, Math.PI / 2, 0, Math.PI / 2));
    group.add(this.__getSphereGeometry(scale, Math.PI, Math.PI / 2, Math.PI / 2, Math.PI / 2));
    group.add(this.__getSphereGeometry(scale, Math.PI / 2, Math.PI / 2, 0, Math.PI / 2));
    group.add(this.__getSphereGeometry(scale, Math.PI / 2, Math.PI / 2, Math.PI / 2, Math.PI / 2));
    group.add(this.__getSphereGeometry(scale, 0, Math.PI / 2, 0, Math.PI / 2));
    group.add(this.__getSphereGeometry(scale, 0, Math.PI / 2, Math.PI / 2, Math.PI / 2));
    group.add(this.__getSphereGeometry(scale, -Math.PI / 2, Math.PI / 2, 0, Math.PI / 2));
    group.add(this.__getSphereGeometry(scale, -Math.PI / 2, Math.PI / 2, Math.PI / 2, Math.PI / 2));

    return group;
  }

  __getSphereGeometry(scale, phiStart, phiLength, thetaStart, thetaLength) {
    const geometry = new THREE.SphereGeometry(
      CONSTANTS.SPHERE_RADIUS * scale, SPHERE_VERTICES / 4, SPHERE_VERTICES / 2,
      phiStart, phiLength, thetaStart, thetaLength
    );

    const material = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(-1, 1, 1);

    return mesh;
  }

  /**
   * @summary Applies the texture to the mesh
   * @param {external:THREE.Group} group
   * @param {PSV.TextureData} textureData
   * @fires PSV.panorama-loaded
   */
  setTexture(group, textureData) {
    for (let i = 0; i < 8; i++) {
      if (group.children[i].material.map) {
        group.children[i].material.map.dispose();
      }

      group.children[i].material.map = textureData.texture[i];
    }
  }

  /**
   * @summary Changes the opacity of the mesh
   * @param {external:THREE.Group} group
   * @param {number} opacity
   */
  setTextureOpacity(group, opacity) {
    for (let i = 0; i < 4; i++) {
      group.children[i].material.opacity = opacity;
      group.children[i].material.transparent = opacity < 1;
    }
  }

  /**
   * @summary Compute visible tiles and load them
   * @private
   */
  __refresh() {
    const viewerSize = this.psv.prop.size;
    const panorama = this.psv.config.panorama;

    const tilesToLoad = [];

    for (let col = 0; col <= panorama.cols; col++) {
      for (let row = 0; row <= panorama.rows; row++) {
        // TODO prefilter with less complex math if possible
        const tileTexturePosition = {
          x: col * this.props.colSize,
          y: row * this.props.rowSize,
        };
        const tilePosition = this.psv.dataHelper.sphericalCoordsToVector3(this.psv.dataHelper.textureCoordsToSphericalCoords(tileTexturePosition));

        if (tilePosition.dot(this.psv.prop.direction) > 0) {
          const tileViewerPosition = this.psv.dataHelper.vector3ToViewerCoords(tilePosition);

          if (tileViewerPosition.x >= 0
            && tileViewerPosition.x <= viewerSize.width
            && tileViewerPosition.y >= 0
            && tileViewerPosition.y <= viewerSize.height) {
            const angle = tilePosition.angleTo(this.psv.prop.direction);

            this.__getAdjacentTiles(col, row)
              .forEach((tile) => {
                const existingTile = tilesToLoad.find(c => c.row === tile.row && c.col === tile.col);
                if (existingTile) {
                  existingTile.angle = Math.min(existingTile.angle, angle);
                }
                else {
                  tilesToLoad.push({ ...tile, angle });
                }
              });
          }
        }
      }
    }

    this.__loadTiles(tilesToLoad);
  }

  /**
   * @summary Get the the 4 adjacent tiles
   * @private
   */
  __getAdjacentTiles(col, row) {
    const panorama = this.psv.config.panorama;

    return [
      { col: col - 1, row: row - 1 },
      { col: col, row: row - 1 },
      { col: col, row: row }, // eslint-disable-line object-shorthand
      { col: col - 1, row: row },
    ]
      .map((tile) => {
        // examples are for cols=16 and rows=8
        if (tile.row < 0) {
          // wrap on top
          tile.row = -tile.row - 1; // -1 => 0, -2 => 1
          tile.col += panorama.cols / 2; // change hemisphere
        }
        else if (tile.row >= panorama.rows) {
          // wrap on bottom
          tile.row = (panorama.rows - 1) - (tile.row - panorama.rows); // 8 => 7, 9 => 6
          tile.col += panorama.cols / 2; // change hemisphere
        }
        if (tile.col < 0) {
          // wrap on left
          tile.col += panorama.cols; // -1 => 15, -2 => 14
        }
        else if (tile.col >= panorama.cols) {
          // wrap on right
          tile.col -= panorama.cols; // 16 => 0, 17 => 1
        }

        return tile;
      });
  }

  /**
   * @summary Loads tiles and change existing tiles priority
   * @param {PSV.adapters.EquirectangularTilesAdapter.Tile[]} tiles
   * @private
   */
  __loadTiles(tiles) {
    this.queue.setAllPriorities();
    tiles.forEach((tile) => {
      const id = tileId(tile);
      const priority = Math.PI / 2 - tile.angle;

      if (this.props.tiles[id]) {
        this.queue.setPriority(id, priority);
      }
      else {
        this.props.tiles[id] = true;
        this.queue.enqueue(new Task(id, priority, () => this.__drawTile(tile)));
      }
    });

    this.queue.start();
  }

  /**
   * @summary Loads and draw a tile
   * @param {PSV.adapters.EquirectangularTilesAdapter.Tile} tile
   * @return {Promise}
   * @private
   */
  __drawTile(tile) {
    if (EquirectangularTilesAdapter.debug) {
      return Promise.resolve();
    }

    const panorama = this.psv.config.panorama;
    const url = panorama.tileUrl(tile.col, tile.row);

    let canvasIdx = Math.floor((panorama.cols - 1 - tile.col) / panorama.cols * 4) * 2;
    if (tile.row >= panorama.rows / 2) {
      canvasIdx++;
    }

    const colInCanvas = tile.col % (panorama.cols / 4);
    const rowInCanvas = tile.row % (panorama.rows / 2);

    const ctx = this.canvas[canvasIdx].getContext('2d');

    return new Promise((resolve, reject) => this.loader.load(url, resolve, undefined, reject))
      .then((image) => {
        ctx.drawImage(image, 0, 0, image.width, image.height,
          colInCanvas * this.props.colSize, rowInCanvas * this.props.rowSize, this.props.colSize, this.props.rowSize);
      })
      .catch(() => {
        ctx.fillStyle = '#333';
        ctx.fillRect(colInCanvas * this.props.colSize, rowInCanvas * this.props.rowSize, this.props.colSize, this.props.rowSize);
        ctx.font = `${this.props.colSize / 5}px serif`;
        ctx.fillStyle = '#a22';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠', (colInCanvas + 0.5) * this.props.colSize, (rowInCanvas + 0.5) * this.props.rowSize);
      })
      .then(() => {
        this.textures[canvasIdx].needsUpdate = true;
        this.psv.needsUpdate();
      });
  }

}
