import { AbstractPlugin, Cubemap, Viewer } from 'photo-sphere-viewer';

declare namespace PhotoSphereViewer {

  type Resolution = {
    id: string;
    label: string;
    panorama: string | string[] | Cubemap;
  };

  type ResolutionPluginOptions = {
    resolutions: Resolution[];
  }

  /**
   * @summary Adds a setting to choose between multiple resolutions of the panorama.
   */
  class ResolutionPlugin extends AbstractPlugin {

    static EVENTS: Record<string, string>;

    constructor(psv: Viewer, options: ResolutionPluginOptions);

    /**
     * @summary Changes the available resolutions
     */
    setResolutions(resolutions: Resolution[]);

    /**
     * @summary Changes the current resolution
     */
    setResolution(id: string);

    /**
     * @summary Returns the current resolution
     */
    getResolution(): string;

  }

}

declare const ResolutionPlugin: PhotoSphereViewer.ResolutionPlugin;
export default ResolutionPlugin;
