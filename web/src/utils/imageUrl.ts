/**
 * 图片路径工具函数
 * 
 * 处理开发环境和生产环境的图片路径差异：
 * - 开发环境: /images/items/xxx.png
 * - 生产环境: /EndFieldBuildSim/images/items/xxx.png
 */

const getBasePath = (): string => {
  if (import.meta.env.DEV) {
    return '';
  }
  return '/EndFieldBuildSim';
};

export function getImagePath(localPath: string): string {
  if (!localPath) return localPath;
  
  if (localPath.startsWith('http://') || localPath.startsWith('https://')) {
    return localPath;
  }
  
  const basePath = getBasePath();
  
  if (localPath.startsWith('/')) {
    return `${basePath}${localPath}`;
  }
  
  return `${basePath}/${localPath}`;
}
