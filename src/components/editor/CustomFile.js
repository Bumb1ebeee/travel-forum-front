import { Node } from '@tiptap/core';

const CustomFile = Node.create({
  name: 'customFile',
  group: 'block',
  atom: true,
  addOptions() {
    return {
      handleDeleteMedia: () => {},
    };
  },
  addAttributes() {
    return {
      src: { default: null },
      fileName: { default: null },
      fileType: { default: null },
      mediaId: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'custom-file' }];
  },
  renderHTML({ node }) {
    const { src, fileName, fileType } = node.attrs;
    if (fileType.startsWith('video/')) {
      return ['video', { src, controls: true, class: 'max-w-full max-h-48 rounded-lg my-2' }];
    } else if (fileType.startsWith('audio/')) {
      return ['audio', { src, controls: true, class: 'w-full my-2' }];
    }
    return [
      'a',
      { href: src, target: '_blank', rel: 'noopener noreferrer', class: 'text-indigo-600 hover:underline my-2 inline-block' },
      fileName || 'Скачать файл',
    ];
  },
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const { src, fileName, fileType, mediaId } = node.attrs;
      const { handleDeleteMedia } = this.options;
      const wrapper = document.createElement('div');
      wrapper.className = 'relative my-2';
      let element;
      if (fileType.startsWith('video/')) {
        element = document.createElement('video');
        element.src = src;
        element.controls = true;
        element.className = 'max-w-full max-h-48 rounded-lg';
      } else if (fileType.startsWith('audio/')) {
        element = document.createElement('audio');
        element.src = src;
        element.controls = true;
        element.className = 'w-full';
      } else {
        element = document.createElement('a');
        element.href = src;
        element.target = '_blank';
        element.rel = 'noopener noreferrer';
        element.className = 'text-indigo-600 hover:underline inline-block';
        element.textContent = fileName || 'Скачать файл';
      }
      const deleteButton = document.createElement('button');
      deleteButton.innerHTML = '×';
      deleteButton.className = 'absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600';
      deleteButton.onclick = async (event) => {
        event.stopPropagation();
        event.preventDefault();
        if (mediaId && confirm('Вы уверены, что хотите удалить этот файл?')) {
          await handleDeleteMedia(mediaId, fileType);
          const pos = getPos();
          editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run();
        }
      };
      wrapper.appendChild(element);
      wrapper.appendChild(deleteButton);
      return { dom: wrapper };
    };
  },
});

export default CustomFile; 