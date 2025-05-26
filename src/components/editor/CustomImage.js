import Image from '@tiptap/extension-image';

const CustomImage = Image.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      handleDeleteMedia: () => {},
      inline: false,
    };
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      mediaId: { default: null },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['img', HTMLAttributes];
  },
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const { src, mediaId } = node.attrs;
      const { handleDeleteMedia } = this.options;
      const wrapper = document.createElement('div');
      wrapper.className = 'relative my-2 inline-block';
      const img = document.createElement('img');
      img.src = src;
      img.setAttribute('data-media-id', mediaId);
      img.className = 'max-w-full h-auto rounded-lg';
      img.onerror = () => console.error(`Failed to load image: ${src}`);
      const deleteButton = document.createElement('button');
      deleteButton.innerHTML = '×';
      deleteButton.className = 'absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600';
      deleteButton.onclick = async (event) => {
        event.stopPropagation();
        event.preventDefault();
        if (mediaId && confirm('Вы уверены, что хотите удалить это изображение?')) {
          await handleDeleteMedia(mediaId, 'image');
          const pos = getPos();
          editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run();
        }
      };
      wrapper.appendChild(img);
      wrapper.appendChild(deleteButton);
      return { dom: wrapper };
    };
  },
});

export default CustomImage; 