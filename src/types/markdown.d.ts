declare module '*.md' {
  import { DocItem } from '../popup/types';
  const doc: DocItem;
  export default doc;
}
