import { AbstractPlugin, Viewer, PSVError } from 'photo-sphere-viewer';

declare namespace PhotoSphereViewer {

  /**
   * @summary Adds stereo view on mobile devices
   */
  class StereoPlugin extends AbstractPlugin {

    static EVENTS: Record<string, string>;

    constructor(psv: Viewer);

    /**
     * @summary Checks if the stereo view is enabled
     */
    isEnabled(): boolean;

    /**
     * @summary Enables the stereo view
     * @throws {PSVError} if the gyroscope API is not available/granted
     */
    start(): Promise<void>;

    /**
     * @summary Disables the stereo view
     */
    stop();

    /**
     * @summary Enables or disables the stereo view
     */
    toggle();

  }

}

declare const StereoPlugin: PhotoSphereViewer.StereoPlugin;
export default StereoPlugin;
