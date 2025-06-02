export function setupEditor() {
  const editor = document.querySelector('#note-content');
  const boldBtn = document.querySelector('#bold-btn');
  const italicBtn = document.querySelector('#italic-btn');
  const bulletBtn = document.querySelector('#bullet-btn');

  boldBtn.addEventListener('click', () => {
    document.execCommand('bold', false, null);
    editor.focus();
  });

  italicBtn.addEventListener('click', () => {
    document.execCommand('italic', false, null);
    editor.focus();
  });

  bulletBtn.addEventListener('click', () => {
    document.execCommand('insertUnorderedList', false, null);
    editor.focus();
  });

  editor.addEventListener('input', () => {
    if (!editor.innerHTML.trim()) {
      editor.innerHTML = '<div><br></div>';
    }
  });
}