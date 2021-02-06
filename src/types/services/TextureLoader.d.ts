import { Cubemap } from '../models';

/**
 * @summary Texture loader
 */
export class TextureLoader {

  /**
   * @summary Preload a panorama file without displaying it
   */
  preloadPanorama(panorama: string | string[] | Cubemap): Promise<void>;

}
