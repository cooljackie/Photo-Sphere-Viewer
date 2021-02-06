import { AbstractPlugin, Viewer, PSVError } from 'photo-sphere-viewer';

declare namespace PhotoSphereViewer {

  type GyroscopePluginOptions = {
    touchmove?: boolean;
    absolutePosition?: boolean;
  }

  /**
   * @summary Adds gyroscope controls on mobile devices
   */
  class GyroscopePlugin extends AbstractPlugin {

    static EVENTS: Record<string, string>;

    constructor(psv: Viewer, options: GyroscopePluginOptions);

    /**
     * @summary Checks if the gyroscope is enabled
     */
    isEnabled(): boolean;

    /**
     * @summary Enables the gyroscope navigation if available
     * @throws {PSVError} if the gyroscope API is not available/granted
     */
    start(): Promise<void>;

    /**
     * @summary Disables the gyroscope navigation
     */
    stop();

    /**
     * @summary Enables or disables the gyroscope navigation
     */
    toggle();

  }

}

declare const GyroscopePlugin: PhotoSphereViewer.GyroscopePlugin;
export default GyroscopePlugin;
