import { AbstractPlugin, Viewer } from 'photo-sphere-viewer';

declare namespace PhotoSphereViewer {

  /**
   * @summary Description of a setting
   */
  type BaseSetting = {
    id: string;
    label: string;
  };

  /**
   * @summary Description of a 'options' setting
   */
  type OptionsSetting = BaseSetting & {
    type: 'options';
    current: () => string;
    options: () => SettingOption[]
    apply: (string) => void;
  };

  /**
   * @summary Description of a 'toggle' setting
   */
  type ToggleSetting = BaseSetting & {
    type: 'toggle';
    active: () => boolean;
    toggle: () => void;
  };

  /**
   * @summary Option of an 'option' setting
   */
  type SettingOption = {
    id: string;
    label: string;
  };

  type Setting = OptionsSetting | ToggleSetting;

  /**
   * @summary Adds a button to access various settings.
   */
  class SettingsPlugin extends AbstractPlugin {

    constructor(psv: Viewer);

    /**
     * @summary Registers a new setting
     */
    addSetting(setting: Setting);

    /**
     * @summary Removes a setting
     * @param {string} id
     */
    removeSetting(id: string);

    /**
     * @summary Toggles the settings panel
     */
    toggleSettings();

    /**
     * @summary Hides the settings panel
     */
    hideSettings();

    /**
     * @summary Shows the settings panel
     */
    showSettings();

  }

}

declare const SettingsPlugin: PhotoSphereViewer.SettingsPlugin;
export default SettingsPlugin;
