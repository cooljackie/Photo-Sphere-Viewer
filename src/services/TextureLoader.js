import * as THREE from 'three';
import { AbstractService } from './AbstractService';

/**
 * @summary Texture loader
 * @extends PSV.services.AbstractService
 * @memberof PSV.services
 */
export class TextureLoader extends AbstractService {

  /**
   * @param {PSV.Viewer} psv
   */
  constructor(psv) {
    super(psv);

    /**
     * @summary Current HTTP requests
     * @type {XMLHttpRequest[]}
     * @private
     */
    this.requests = [];
  }

  /**
   * @override
   */
  destroy() {
    this.abortLoading();
    super.destroy();
  }

  /**
   * @summary Cancels current HTTP requests
   * @package
   */
  abortLoading() {
    [...this.requests].forEach(r => r.abort());
  }

  /**
   * @summary Loads a Blob with FileLoader
   * @param {string} url
   * @param {function(number)} [onProgress]
   * @returns {Promise<Blob>}
   */
  loadFile(url, onProgress) {
    return new Promise((resolve, reject) => {
      let progress = 0;
      onProgress && onProgress(progress);

      const loader = new THREE.FileLoader();

      if (this.config.withCredentials) {
        loader.setWithCredentials(true);
      }

      loader.setResponseType('blob');

      const request = loader.load(
        url,
        (result) => {
          const rIdx = this.requests.indexOf(request);
          if (rIdx !== -1) this.requests.splice(rIdx, 1);

          progress = 100;
          onProgress && onProgress(progress);
          resolve(result);
        },
        (e) => {
          if (e.lengthComputable) {
            const newProgress = e.loaded / e.total * 100;
            if (newProgress > progress) {
              progress = newProgress;
              onProgress && onProgress(progress);
            }
          }
        },
        (err) => {
          const rIdx = this.requests.indexOf(request);
          if (rIdx !== -1) this.requests.splice(rIdx, 1);

          reject(err);
        }
      );

      // when we hit the cache, the result is the cache value
      if (request instanceof XMLHttpRequest) {
        this.requests.push(request);
      }
    });
  }

  /**
   * @summary Loads an Image using FileLoader to have progress events
   * @param {string} url
   * @param {function(number)} [onProgress]
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(url, onProgress) {
    return this.loadFile(url, onProgress)
      .then(result => new Promise((resolve, reject) => {
        const img = document.createElementNS('http://www.w3.org/1999/xhtml', 'img');
        img.onload = () => {
          URL.revokeObjectURL(img.src);
          resolve(img);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(result);
      }));
  }

  /**
   * @summary Preload a panorama file without displaying it
   * @param {string|string[]|PSV.Cubemap} panorama
   * @returns {Promise}
   */
  preloadPanorama(panorama) {
    return this.psv.adapter.loadTexture(panorama);
  }

}
