import { AbstractPlugin, CONSTANTS, DEFAULTS, PSVError, utils } from 'photo-sphere-viewer';
import * as THREE from 'three';
import arrowGeometryJson from './arrow.json';
import targetIcon from './target.svg';

/**
 * @typedef {Object} PSV.plugins.VirtualTourPlugin.Node
 * @summary Definition of a single node in the tour
 * @property {string} id - unique identifier of the node
 * @property {PSV.Panorama} panorama
 * @property {PSV.plugins.VirtualTourPlugin.NodeLink[]} [links] - links to other nodes
 * @property {number[]} [position] - GPS position (longitude, latitude, optional altitude)
 * @property {PSV.PanoData | PSV.PanoDataProvider} [panoData] - data used for this panorama
 * @property {string} [name] - short name of the node
 * @property {string} [caption] - caption visible in the navbar
 * @property {PSV.plugins.MarkersPlugin.Properties[]} [markers] - additional markers to use on this node
 */

/**
 * @typedef {PSV.ExtendedPosition} PSV.plugins.VirtualTourPlugin.NodeLink
 * @summary Definition of a link between two nodes
 * @property {string} nodeId - identifier of the target node
 * @property {PSV.plugins.MarkersPlugin.Properties} [markerStyle] - override global marker style
 * @property {PSV.plugins.VirtualTourPlugin.ArrowStyle} [arrowStyle] - override global arrow style
 */

/**
 * @typedef {Object} PSV.plugins.VirtualTourPlugin.ArrowStyle
 * @summary Style of the arrow in 3D mode
 * @property {string} [color=#0055aa]
 * @property {number} [opacity=0.8]
 */

/**
 * @typedef {Object} PSV.plugins.VirtualTourPlugin.Options
 * @property {PSV.plugins.VirtualTourPlugin.Node[]} [nodes] - initial nodes
 * @property {'manual'|'gps'} [positionMode='manual'] - configure positionning mode
 * @property {'markers'|'3d'} [renderMode='3d'] - configure rendering mode of links
 * @property {string} [startNodeId] - id of the initial node, if not defined the first node will be used
 * @property {PSV.plugins.MarkersPlugin.Properties} [markerStyle] - global marker style
 * @property {PSV.plugins.VirtualTourPlugin.ArrowStyle} [arrowStyle] - global arrow style
 * @property {number} [markerLatOffset=-0.1] - (GPS & Markers mode) latitude offset applied to link markers, to compensate for viewer height
 * @property {number[]} [arrowPosition=-3] - (3D mode) arrows vertical position relative to the center of the viewer
 * @property {string} [arrowHoverColor=#aa5500] - (3D mode) color applied to link arrows on mousehover
 * @property {number[]} [arrowScaleFactor=[2,0.5]] - (3D mode) scale factor of the link arrows depending on zoom level
 * @property {boolean} [warnOrphans=true] - logs a warning if some nodes have no link or are never linked
 */


DEFAULTS.lang.loading = 'Loading...';


// Load the arrow geometry
const ARROW_GEOM = (() => {
  const loader = new THREE.ObjectLoader();
  const geom = loader.parseGeometries([arrowGeometryJson])[arrowGeometryJson.uuid];
  geom.scale(0.02, 0.03, 0.03);
  geom.computeBoundingBox();
  const b = geom.boundingBox;
  geom.translate(-(b.max.x - b.min.y) / 2, -(b.max.y - b.min.y) / 2, -(b.max.z - b.min.z) / 2);
  geom.rotateX(Math.PI);
  return geom;
})();


/**
 * @summary Create virtual tours by linking multiple panoramas
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export default class VirtualTourPlugin extends AbstractPlugin {

  static id = 'virtual-tour';

  /**
   * @summary Available events
   * @enum {string}
   * @constant
   */
  static EVENTS = {
    NODE_CHANGED: 'node-changed',
  };

  /**
   * @summary Property name added to markers
   * @type {string}
   * @constant
   */
  static LINK_DATA = 'tourLink';

  /**
   * @summary In manual mode each link is positionned manually on the panorama
   * @type {string}
   * @constant
   */
  static MODE_MANUAL = 'manual';

  /**
   * @summary In GPS mode each node is globally positionned and the links are automatically computed
   * @type {string}
   * @constant
   */
  static MODE_GPS = 'gps';

  /**
   * @summaru In markers mode the links are represented using markers
   * @type {string}
   * @constant
   */
  static MODE_MARKERS = 'markers';

  /**
   * @summaru In 3D mode the links are represented using 3d arrows
   * @type {string}
   * @constant
   */
  static MODE_3D = '3d';

  /**
   * @summary Default style of the link marker
   * @type {PSV.plugins.MarkersPlugin.Properties}
   * @constant
   */
  static DEFAULT_MARKER = {
    html  : targetIcon,
    width : 80,
    height: 80,
    scale : [0.5, 2],
    style : {
      color: 'rgba(255, 255, 255, 0.8)',
    },
  };

  /**
   * @summary Default style of the link arrow
   * @type {PSV.plugins.VirtualTourPlugin.ArrowStyle}
   * @constant
   */
  static DEFAULT_ARROW = {
    color  : 0x0055aa,
    opacity: 0.8,
  };

  /**
   * @param {PSV.Viewer} psv
   * @param {PSV.plugins.VirtualTourPlugin.Options} [options]
   */
  constructor(psv, options) {
    super(psv);

    /**
     * @member {Object}
     * @property {external:THREE.Mesh} currentArrow
     * @property {PSV.plugins.VirtualTourPlugin.Node} currentNode
     * @property {PSV.Tooltip} currentTooltip
     * @private
     */
    this.prop = {
      currentNode   : null,
      currentArrow  : null,
      currentTooltip: null,
    };

    /**
     * @member {PSV.plugins.VirtualTourPlugin.Options}
     * @private
     */
    this.config = {
      positionMode    : VirtualTourPlugin.MODE_MANUAL,
      renderMode      : VirtualTourPlugin.MODE_3D,
      markerLatOffset : -0.1,
      arrowHoverColor : 0xaa5500,
      arrowPosition   : -3,
      arrowScaleFactor: [2, 0.5],
      ...options,
      markerStyle     : {
        ...VirtualTourPlugin.DEFAULT_MARKER,
        ...options?.markerStyle,
      },
      arrowStyle      : {
        ...VirtualTourPlugin.DEFAULT_ARROW,
        ...options?.arrowStyle,
      },
      nodes           : null,
    };

    /**
     * @member {Object<string, PSV.plugins.VirtualTourPlugin.Node[]>}
     * @private
     */
    this.nodes = null;

    /**
     * @type {PSV.plugins.MarkersPlugin}
     * @private
     */
    this.markers = this.psv.getPlugin('markers');

    if (!this.is3D() && !this.markers) {
      throw new PSVError('Tour plugin requires the Markers plugin in markers mode');
    }

    /**
     * @type {external:THREE.Group}
     * @private
     */
    this.arrowsGroup = null;

    if (this.is3D()) {
      this.arrowsGroup = new THREE.Group();

      const light = new THREE.PointLight(0xffffff, 1, 0);
      light.position.set(2, 0, 0);
      this.arrowsGroup.add(light);

      this.psv.once(CONSTANTS.EVENTS.READY, () => {
        this.__positionArrows();
        this.psv.renderer.scene.add(this.arrowsGroup);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.psv.renderer.scene.add(ambientLight);

        this.psv.needsUpdate();

        this.psv.container.addEventListener('mousemove', this);
      });

      this.psv.on(CONSTANTS.EVENTS.POSITION_UPDATED, this);
      this.psv.on(CONSTANTS.EVENTS.ZOOM_UPDATED, this);
      this.psv.on(CONSTANTS.EVENTS.CLICK, this);
    }
    else {
      this.markers.on('select-marker', this);
    }

    if (options?.nodes) {
      this.setNodes(options.nodes, this.config.startNodeId);
    }
  }

  destroy() {
    if (this.markers) {
      this.markers.off('select-marker', this);
    }
    if (this.arrowsGroup) {
      this.psv.renderer.scene.remove(this.arrowsGroup);
    }

    this.psv.off(CONSTANTS.EVENTS.POSITION_UPDATED, this);
    this.psv.off(CONSTANTS.EVENTS.ZOOM_UPDATED, this);
    this.psv.off(CONSTANTS.EVENTS.CLICK, this);
    this.psv.container.removeEventListener('mousemove', this);

    delete this.nodes;
    delete this.markers;
    delete this.prop;
    delete this.arrowsGroup;

    super.destroy();
  }

  handleEvent(e) {
    let nodeId;
    switch (e.type) {
      case 'select-marker':
        nodeId = e.args[0].data?.[VirtualTourPlugin.LINK_DATA];
        if (nodeId) {
          this.setCurrentNode(nodeId);
        }
        break;

      case CONSTANTS.EVENTS.POSITION_UPDATED:
      case CONSTANTS.EVENTS.ZOOM_UPDATED:
        if (this.arrowsGroup) {
          this.__positionArrows();
        }
        break;

      case CONSTANTS.EVENTS.CLICK:
        if (this.prop.currentArrow) {
          this.setCurrentNode(this.prop.currentArrow.userData[VirtualTourPlugin.LINK_DATA]);
        }
        break;

      case 'mousemove':
        this.__onMouseMove(e);
        break;

      default:
    }
  }

  /**
   * @summary Tests if running in GPS mode
   * @return {boolean}
   */
  isGps() {
    return this.config.positionMode === VirtualTourPlugin.MODE_GPS;
  }

  /**
   * @summary Tests if running in 3D mode
   * @return {boolean}
   */
  is3D() {
    return this.config.renderMode === VirtualTourPlugin.MODE_3D;
  }

  /**
   * @summary Sets/changes the nodes
   * @param {PSV.plugins.VirtualTourPlugin.Node[]} nodes
   * @param {string} [startNodeId]
   * @throws {PSV.PSVError} when the configuration is incorrect
   */
  setNodes(nodes, startNodeId) {
    this.nodes = this.__checkNodes(nodes);

    if (!startNodeId) {
      // eslint-disable-next-line no-param-reassign
      startNodeId = nodes[0].id;
    }
    else if (!this.nodes[startNodeId]) {
      // eslint-disable-next-line no-param-reassign
      startNodeId = nodes[0].id;
      utils.logWarn(`startNodeId not found is provided nodes, resetted to ${startNodeId}`);
    }

    this.setCurrentNode(startNodeId);
  }

  /**
   * @summary Changes the current node
   * @param {string} nodeId
   * @throws {PSV.PSVError} when the node does not exist
   */
  setCurrentNode(nodeId) {
    const node = this.nodes[nodeId];
    this.prop.currentNode = node;

    if (!node) {
      throw new PSVError(`Node ${nodeId} not found`);
    }

    if (this.prop.currentTooltip) {
      this.prop.currentTooltip.hide();
      this.prop.currentTooltip = null;
    }

    if (this.is3D()) {
      this.arrowsGroup.remove(...this.arrowsGroup.children.filter(o => o.type === 'Mesh'));
      this.prop.currentArrow = null;
    }

    if (this.markers) {
      this.markers.clearMarkers();
    }

    this.psv.navbar.setCaption(`<em>${this.psv.config.lang.loading}</em>`);

    this.psv.setPanorama(node.panorama, {
      transition: 1000,
      panoData  : node.panoData,
    })
      .then(() => {
        if (node.markers) {
          this.markers.setMarkers(node.markers);
        }

        if (node.links) {
          this.__renderLinks(node);
        }

        this.psv.navbar.setCaption(node.caption || this.psv.config.caption);

        /**
         * @event node-changed
         * @memberof PSV.plugins.VirtualTourPlugin
         * @summary Triggered when the current node is changed
         * @param {string} nodeId
         */
        this.trigger(VirtualTourPlugin.EVENTS.NODE_CHANGED, nodeId);
      });
  }

  /**
   * @summary Adds the links for the node
   * @param {PSV.plugins.VirtualTourPlugin.Node} node
   * @private
   */
  __renderLinks(node) {
    node.links.forEach((link) => {
      const position = this.__getLinkPosition(node, link);

      if (this.is3D()) {
        const color = link.arrowStyle?.color || this.config.arrowStyle.color;
        const opacity = link.arrowStyle?.opacity || this.config.arrowStyle.opacity;

        const arrow = ARROW_GEOM.clone();
        const mat = new THREE.MeshLambertMaterial({
          color: color,
          emissive: color,
          transparent: true,
          opacity: opacity,
        });
        const mesh = new THREE.Mesh(arrow, mat);

        mesh.userData = { [VirtualTourPlugin.LINK_DATA]: link.nodeId };
        mesh.rotateY(-position.longitude);
        mesh.position.copy(
          this.psv.dataHelper
            .sphericalCoordsToVector3({ longitude: position.longitude, latitude: 0 })
            .multiplyScalar(2 / CONSTANTS.SPHERE_RADIUS)
        );

        this.arrowsGroup.add(mesh);
      }
      else {
        if (this.isGps()) {
          position.latitude += this.config.markerLatOffset;
        }

        this.markers.addMarker({
          ...this.config.markerStyle,
          ...link.markerStyle,
          id      : `tour-link-${link.nodeId}`,
          tooltip : this.nodes[link.nodeId].name,
          hideList: true,
          data    : { [VirtualTourPlugin.LINK_DATA]: link.nodeId },
          ...position,
        }, false);
      }
    });

    if (!this.is3D()) {
      this.markers.renderMarkers();
    }
  }

  /**
   * @summary Computes the marker position for a link
   * @param {PSV.plugins.VirtualTourPlugin.Node} node
   * @param {PSV.plugins.VirtualTourPlugin.NodeLink} link
   * @return {PSV.Position}
   * @private
   */
  __getLinkPosition(node, link) {
    if (this.isGps()) {
      const targetNode = this.nodes[link.nodeId];

      const p1 = [THREE.Math.degToRad(node.position[0]), THREE.Math.degToRad(node.position[1])];
      const p2 = [THREE.Math.degToRad(targetNode.position[0]), THREE.Math.degToRad(targetNode.position[1])];
      const h1 = node.position[2] !== undefined ? node.position[2] : targetNode.position[2] || 0;
      const h2 = targetNode.position[2] !== undefined ? targetNode.position[2] : node.position[2] || 0;

      let latitude = 0;
      if (h1 !== h2) {
        const d = utils.greatArcDistance(p1, p2) * 6371e3;
        latitude = Math.atan((h2 - h1) / d);
      }

      const longitude = utils.bearing(p1, p2);

      return { longitude, latitude };
    }
    else {
      return this.psv.dataHelper.cleanPosition(link);
    }
  }

  /**
   * @summary Check the definition of nodes
   * @param {PSV.plugins.VirtualTourPlugin.Node[]} rawNodes
   * @return {Object<string, PSV.plugins.VirtualTourPlugin.Node[]>}
   * @private
   */
  __checkNodes(rawNodes) {
    const nodes = {};
    const linkedNodes = {};

    if (!rawNodes || !rawNodes.length) {
      throw new PSVError('No nodes provided');
    }

    rawNodes.forEach((node, i) => {
      if (!node.id) {
        throw new PSVError(`No id given for node #${i}`);
      }
      if (nodes[node.id]) {
        throw new PSVError(`Duplicate node ${node.id}`);
      }
      if (!node.panorama) {
        throw new PSVError(`No panorama provided for node ${node.id}`);
      }
      if (this.isGps() && !(node.position?.length >= 2)) {
        throw new PSVError(`No position provided for node ${node.id}`);
      }
      if (!this.markers && node.markers) {
        throw new PSVError(`Node ${node.id} has markers but the markers plugin is not loaded`);
      }
      if (!node.links && this.config.warnOrphans) {
        utils.logWarn(`Node ${node.id} has no links`);
      }

      nodes[node.id] = node;
    });

    rawNodes.forEach((node) => {
      if (node.links) {
        node.links.forEach((link, i) => {
          if (!link.nodeId) {
            throw new PSVError(`Link #${i} of node ${node.id} has no target id`);
          }
          if (!nodes[link.nodeId]) {
            throw new PSVError(`Target node ${link.nodeId} of node ${node.id} does not exists`);
          }
          if (!this.isGps() && !utils.isExtendedPosition(link)) {
            throw new PSVError(`No position provided for link ${link.nodeId} of node ${node.id}`);
          }

          linkedNodes[link.nodeId] = true;
        });
      }
    });

    rawNodes.forEach((node) => {
      if (!linkedNodes[node.id] && this.config.warnOrphans) {
        utils.logWarn(`Node ${node.id} is never linked to`);
      }
    });

    return nodes;
  }

  /**
   * @summary Updates hovered arrow on mousemove
   * @param {MouseEvent} evt
   * @private
   */
  __onMouseMove(evt) {
    const viewerPos = utils.getPosition(this.psv.container);
    const viewerPoint = {
      x: evt.clientX - viewerPos.left,
      y: evt.clientY - viewerPos.top,
    };

    const mesh = this.psv.dataHelper.getIntersection(viewerPoint, VirtualTourPlugin.LINK_DATA)?.object;

    if (mesh === this.prop.currentArrow) {
      if (this.prop.currentTooltip) {
        this.prop.currentTooltip.move({
          left: viewerPoint.x,
          top : viewerPoint.y,
        });
      }
    }
    else {
      if (this.prop.currentArrow) {
        const link = this.prop.currentNode.links.find(l => l.nodeId === this.prop.currentArrow.userData[VirtualTourPlugin.LINK_DATA]);
        this.prop.currentArrow.material.color.set(link.arrowStyle?.color || this.config.arrowStyle.color);
        this.prop.currentArrow.material.emissive.set(link.arrowStyle?.color || this.config.arrowStyle.color);

        if (this.prop.currentTooltip) {
          this.prop.currentTooltip.hide();
          this.prop.currentTooltip = null;
        }
      }

      if (mesh) {
        mesh.material.color.set(this.config.arrowHoverColor);
        mesh.material.emissive.set(this.config.arrowHoverColor);

        const node = this.nodes[mesh.userData[VirtualTourPlugin.LINK_DATA]];

        if (node.name) {
          this.prop.currentTooltip = this.psv.tooltip.create({
            left   : viewerPoint.x,
            top    : viewerPoint.y,
            content: node.name,
          });
        }
      }

      this.prop.currentArrow = mesh;

      this.psv.needsUpdate();
    }
  }

  /**
   * @summary Updates to position of the group of arrows
   * @private
   */
  __positionArrows() {
    this.arrowsGroup.position.copy(this.psv.prop.direction).multiplyScalar(0.1);
    this.arrowsGroup.position.y += this.config.arrowPosition;
    const s = this.config.arrowScaleFactor;
    const f = s[0] + (s[1] - s[0]) * CONSTANTS.EASINGS.linear(this.psv.prop.zoomLvl / 100);
    this.arrowsGroup.scale.set(f, f, f);
  }

}
