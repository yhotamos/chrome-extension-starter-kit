const matter = require('gray-matter');
const { marked } = require('marked');

function toDocumentMeta(data) {
  const metadata = {
    id: data.id || '',
    title: data.title || 'Untitled',
    order: data.order || 0,
    visible: data.visible !== false,
    expanded: data.expanded !== false,
    date: data.date || '',
    lang: data.lang || '',
  };

  return metadata;
}

/**
 * .md を読み込み，メタ情報付きオブジェクトとして出力する
 */
module.exports = function (source) {
  const callback = this.async();

  try {
    // Front Matter と本文を分離
    const { data, content } = matter(source);

    // 本文を Markdown -> HTML に変換
    const html = marked.parse(content, { async: false });

    // 出力オブジェクトを作成
    const document = {
      metadata: {
        ...toDocumentMeta(data),
      },
      content: html,
    };

    // ES Module として返す
    const code = `export default ${JSON.stringify(document, null, 2)};`;

    callback(null, code);
  } catch (error) {
    callback(error);
  }
};
