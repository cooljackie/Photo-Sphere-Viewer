import { AbstractPlugin, ExtendedPosition, Viewer } from 'photo-sphere-viewer';

declare namespace PhotoSphereViewer {

  /**
   * @summary Definition of keypoints for automatic rotation, can be a position object, a marker id or an object with the following properties
   */
  type AutorotateKeypoint = string | ExtendedPosition | {
    markerId?: string;
    position?: ExtendedPosition;
    tooltip?: string | { content: string, position: string };
    pause?: number;
  }

  type AutorotateKeypointsPluginOptions = {
    startFromClosest?: boolean;
    keypoints?: AutorotateKeypoint[];
  }

  /**
   * @summary Replaces the standard autorotate animation by a smooth transition between multiple points
   */
  class AutorotateKeypointsPlugin extends AbstractPlugin {

    constructor(psv: Viewer, options: AutorotateKeypointsPluginOptions);

    /**
     * @summary Changes the keypoints
     */
    setKeypoints(keypoints: AutorotateKeypoint[]);

  }

}

declare const AutorotateKeypointsPlugin: PhotoSphereViewer.AutorotateKeypointsPlugin;
export default AutorotateKeypointsPlugin;
