import type { Configuration } from 'webpack';
import { rendererConfig } from './webpack.renderer.config';
import { mainConfig } from './webpack.main.config';
import { preloadConfig } from './webpack.preload.config';

export default [mainConfig, rendererConfig, preloadConfig] as Configuration[]; 