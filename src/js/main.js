import { sanitizeInput, exportToJSON, importFromJSON, generateUUID } from './utils.js';
import { setupEditor } from './editor.js';

// DOM elements
const noteTitle = document.querySelector('#note-title');
const noteCategory = document.querySelector('#note-category');
const noteTags = document.querySelector('#note-tags');
const noteContent = document.querySelector('#note-content');
const addNoteButton = document.querySelector('#add-note');
const exportNotesButton = document.querySelector('#export-notes');
const importNotesButton = document.querySelector('#import-btn');
const importNotesInput = document.querySelector('#import-notes');
const searchNotes = document.querySelector('#search-notes');
const sortNotes = document.querySelector('#sort-notes');
const notesList = document.querySelector('#notes-list');
const formError = document.querySelector('#form-error');
const undoNotification = document.querySelector('#undo-notification');
const undoDeleteButton = document.querySelector('#undo-delete');
const themeToggle = document.querySelector('#theme-toggle');

// State
let notes = JSON.parse(localStorage.getItem('leangsNotes')) || [];
let deletedNote = null;
let deletedNoteId = null;

// Setup rich text editor
setupEditor();

// Render notes
function renderNotes(filter = '', sort = 'date-desc') {
  notesList.innerHTML = '';
  let filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(filter.toLowerCase()) ||
    note.content.toLowerCase().includes(filter.toLowerCase()) ||
    note.category.toLowerCase().includes(filter.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
  );

  filteredNotes.sort((a, b) => {
    if (sort === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === 'title-asc') return a.title.localeCompare(b.title);
    if (sort === 'title-desc') return b.title.localeCompare(a.title);
    return a.category.localeCompare(b.category);
  });

  filteredNotes.forEach(note => {
    const noteElement = document.createElement('div');
    noteElement.classList.add('card', 'mb-3');
    noteElement.setAttribute('role', 'listitem');
    noteElement.innerHTML = `
      <div class="card-body">
        <h3 class="card-title">${sanitizeInput(note.title)}</h3>
        <p class="card-text text-muted">${sanitizeInput(note.category)}</p>
        <p class="card-text">${note.content}</p>
        <p class="card-text"><small class="text-muted">Tags: ${sanitizeInput(note.tags.join(', '))}</small></p>
        <button class="btn btn-outline-primary btn-sm me-2" onclick="editNote('${note.id}')" aria-label="Edit note">Edit</button>
        <button class="btn btn-outline-danger btn-sm" onclick="deleteNoteHandler('${note.id}')" aria-label="Delete note">Delete</button>
      </div>
    `;
    notesList.appendChild(noteElement);
  });
}

// Add note
addNoteButton.addEventListener('click', () => {
  const title = noteTitle.value.trim();
  const content = noteContent.innerHTML.trim();
  const category = noteCategory.value;
  const tags = noteTags.value.split(',').map(tag => tag.trim()).filter(tag => tag);
  if (title && content !== '<div><br></div>') {
    const note = {
      id: generateUUID(),
      title,
      content,
      category,
      tags,
      createdAt: new Date().toISOString()
    };
    notes.push(note);
    localStorage.setItem('leangsNotes', JSON.stringify(notes));
    noteTitle.value = '';
    noteContent.innerHTML = '';
    noteTags.value = '';
    formError.classList.add('d-none');
    renderNotes(searchNotes.value, sortNotes.value);
  } else {
    formError.textContent = 'Please enter a title and content.';
    formError.classList.remove('d-none');
  }
});

// Edit note
window.editNote = (id) => {
  const note = notes.find(n => n.id === id);
  noteTitle.value = note.title;
  noteContent.innerHTML = note.content;
  noteCategory.value = note.category;
  noteTags.value = note.tags.join(', ');
  notes = notes.filter(n => n.id !== id);
  localStorage.setItem('leangsNotes', JSON.stringify(notes));
  renderNotes(searchNotes.value, sortNotes.value);
};

// Delete note with undo
window.deleteNoteHandler = (id) => {
  deletedNote = { ...notes.find(n => n.id === id) };
  deletedNoteId = id;
  notes = notes.filter(n => n.id !== id);
  localStorage.setItem('leangsNotes', JSON.stringify(notes));
  undoNotification.classList.remove('d-none');
  setTimeout(() => {
    undoNotification.classList.add('d-none');
    deletedNote = null;
    deletedNoteId = null;
  }, 5000);
  renderNotes(searchNotes.value, sortNotes.value);
};

// Undo delete
undoDeleteButton.addEventListener('click', () => {
  if (deletedNote && deletedNoteId) {
    notes.push(deletedNote);
    localStorage.setItem('leangsNotes', JSON.stringify(notes));
    undoNotification.classList.add('d-none');
    deletedNote = null;
    deletedNoteId = null;
    renderNotes(searchNotes.value, sortNotes.value);
  }
});

// Search notes (debounced)
let searchTimeout;
searchNotes.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    renderNotes(searchNotes.value, sortNotes.value);
  }, 300);
});

// Sort notes
sortNotes.addEventListener('change', () => {
  renderNotes(searchNotes.value, sortNotes.value);
});

// Export notes
exportNotesButton.addEventListener('click', () => {
  exportToJSON(notes, 'leangs-note.json');
});

// Import notes
importNotesButton.addEventListener('click', () => {
  importNotesInput.click();
});
importNotesInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    importFromJSON(file, (importedNotes) => {
      importedNotes = importedNotes.map(note => ({
        ...note,
        id: generateUUID(),
        createdAt: note.createdAt || new Date().toISOString()
      }));
      notes = [...notes, ...importedNotes];
      localStorage.setItem('leangsNotes', JSON.stringify(notes));
      renderNotes(searchNotes.value, sortNotes.value);
      importNotesInput.value = '';
    });
  }
});

// Theme toggle
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
});

// Load theme
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
}

// Initial render
renderNotes();