import { AbstractPlugin, Animation, ExtendedPosition, PSVError, Viewer } from 'photo-sphere-viewer';

declare namespace PhotoSphereViewer {

  type MarkerType =
    'image'
    | 'html'
    | 'square'
    | 'rect'
    | 'circle'
    | 'ellipse'
    | 'path'
    | 'polygonPx'
    | 'polygonRad'
    | 'polylinePx'
    | 'polylineRad';

  /**
   * @summary Marker properties
   */
  type MarkerProperties = Partial<ExtendedPosition> & {
    image?: string;
    html?: string;
    square?: number;
    rect?: [number, number] | { width: number, height: number };
    circle?: number;
    ellipse?: [number, number] | { cx: number, cy: number };
    path?: string;
    polygonPx?: [number, number][];
    polygonRad?: [number, number][];
    polylinePx?: [number, number][];
    polylineRad?: [number, number][];

    id: string;
    width?: number;
    height?: number;
    scale?: number | [number, number];
    className?: string;
    style?: Record<string, string>;
    svgStyle?: Record<string, string>;
    anchor?: string;
    visible?: boolean;
    tooltip?: string | { content: string, position?: string };
    content?: string;
    hideList?: boolean;
    data?: any;
  };

  type MarkersPluginOptions = {
    clickEventOnMarker?: boolean;
    markers?: MarkerProperties[];
  }

  /**
   * @summary Object representing a marker
   */
  class Marker {

    private constructor();

    readonly id: string;
    readonly type: MarkerType;
    readonly visible: boolean;
    readonly config: MarkerProperties;
    readonly data?: any;

    /**
     * @summary Checks if it is a normal marker (image or html)
     */
    isNormal(): boolean;

    /**
     * @summary Checks if it is a polygon/polyline marker
     */
    isPoly(): boolean;

    /**
     * @summary Checks if it is a polygon/polyline using pixel coordinates
     */
    isPolyPx(): boolean;

    /**
     * @summary Checks if it is a polygon/polyline using radian coordinates
     */
    isPolyRad(): boolean;

    /**
     * @summary Checks if it is a polygon marker
     */
    isPolygon(): boolean;

    /**
     * @summary Checks if it is a polyline marker
     */
    isPolyline(): boolean;

    /**
     * @summary Checks if it is an SVG marker
     */
    isSvg(): boolean;

  }

  /**
   * @summary Displays various markers on the viewer
   */
  class MarkersPlugin extends AbstractPlugin {

    static EVENTS: Record<string, string>;

    constructor(psv: Viewer, options: MarkersPluginOptions);

    /**
     * @summary Toggles the visibility of all tooltips
     */
    toggleAllTooltips();

    /**
     * @summary Displays all tooltips
     */
    showAllTooltips();

    /**
     * @summary Hides all tooltips
     */
    hideAllTooltips();

    /**
     * @summary Return the total number of markers
     * @returns {number}
     */
    getNbMarkers(): number;

    /**
     * @summary Adds a new marker to viewer
     * @returns {PSV.plugins.MarkersPlugin.Marker}
     * @throws {PSVError} when the marker's id is missing or already exists
     */
    addMarker(properties: MarkerProperties, render?: boolean): Marker;

    /**
     * @summary Returns the internal marker object for a marker id
     * @throws {PSVError} when the marker cannot be found
     */
    getMarker(markerId: string): Marker;

    /**
     * @summary Returns the last marker selected by the user
     */
    getCurrentMarker(): Marker;

    /**
     * @summary Updates the existing marker with the same id
     * @description Every property can be changed but you can't change its type (Eg: `image` to `html`).
     */
    updateMarker(properties: MarkerProperties, render?: boolean): Marker;

    /**
     * @summary Removes a marker from the viewer
     */
    removeMarker(markerId: string, render?: boolean);

    /**
     * @summary Replaces all markers
     */
    setMarkers(markers: MarkerProperties[], render?: boolean);

    /**
     * @summary Removes all markers
     */
    clearMarkers(render?: boolean);

    /**
     * @summary Rotate the view to face the marker
     */
    gotoMarker(markerId: string, speed: string | number): Animation;

    /**
     * @summary Hides a marker
     */
    hideMarker(markerId: string);

    /**
     * @summary Shows a marker
     */
    showMarker(markerId: string);

    /**
     * @summary Toggles a marker
     */
    toggleMarker(markerId: string);

    /**
     * @summary Opens the panel with the content of the marker
     */
    showMarkerPanel(markerId: string);

    /**
     * @summary Toggles the visibility of markers list
     */
    toggleMarkersList();

    /**
     * @summary Opens side panel with list of markers
     */
    showMarkersList();

    /**
     * @summary Closes side panel if it contains the list of markers
     */
    hideMarkersList();

    /**
     * @summary Updates the visibility and the position of all markers
     */
    renderMarkers();

  }
}

declare const MarkersPlugin: PhotoSphereViewer.MarkersPlugin;
export default MarkersPlugin;
