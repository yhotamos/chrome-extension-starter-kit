declare module "*.md" {
  import type { DocItem } from "../popup/types";
  const doc: DocItem;
  export default doc;
}
