import {
  markChordsInContent,
  unMarkChordsInContent,
  nestChordsInContent,
  unNestChordsInContent,
  transposeInContent,
  removeBlankLinesInContent,
  autoBreakContent
} from '../features/chordProcessing/chordContentProcessor.js';
import { downloadDocxZip, generateDocx } from '../features/docx/docxGen.js';
import defaultConfigurations from '../data/default-configs.json';
import exampleText from '../data/example.txt?raw';
import { readStoredConfigurations } from '../features/config/configuration.js';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    });
  });
}

function loadConfigurations() {
  return readStoredConfigurations(defaultConfigurations);
}

function showStatus(message) {
  document.getElementById('status').textContent = message;
}

document.addEventListener('DOMContentLoaded', () => {
  const editor = document.getElementById('editor');
  const undoButton = document.getElementById('undoBtn');
  const undoHistory = [];
  let lastEditorContent = editor.innerText;

  function updateUndoButton() {
    undoButton.disabled = undoHistory.length === 0;
  }

  function saveUndoPoint() {
    if (undoHistory.at(-1) !== editor.innerText) {
      undoHistory.push(editor.innerText);
    }
    updateUndoButton();
  }

  function setEditorContent(content) {
    saveUndoPoint();
    editor.innerText = content;
    lastEditorContent = content;
  }

  function undoLastAction() {
    const previousContent = undoHistory.pop();
    if (previousContent === undefined) return;

    editor.innerText = previousContent;
    lastEditorContent = previousContent;
    updateUndoButton();
    showStatus('Last editor action undone.');
  }

  editor.addEventListener('input', () => {
    if (editor.innerText !== lastEditorContent) {
      undoHistory.push(lastEditorContent);
      lastEditorContent = editor.innerText;
      updateUndoButton();
    }
  });

  editor.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
      event.preventDefault();
      undoLastAction();
    }
  });

  undoButton.addEventListener('click', undoLastAction);

  editor.addEventListener('paste', event => {
    event.preventDefault();
    saveUndoPoint();
    const tabSpacesInput = document.getElementById('tabSpaces');
    const tabSpaces = Math.max(0, Number.parseInt(tabSpacesInput.value, 10) || 0);
    const plainText = (event.clipboardData?.getData('text/plain') ?? '')
      .replaceAll('\t', ' '.repeat(tabSpaces));
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      editor.append(document.createTextNode(plainText));
      lastEditorContent = editor.innerText;
      return;
    }

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      editor.append(document.createTextNode(plainText));
      lastEditorContent = editor.innerText;
      return;
    }

    range.deleteContents();
    const textNode = document.createTextNode(plainText);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    lastEditorContent = editor.innerText;
  });

  document.getElementById('loadExampleBtn').addEventListener('click', async () => {
    try {
      setEditorContent(exampleText);
    } catch (error) {
      showStatus('Failed to load example text.');
      console.error(error);
    }
  });

  document.getElementById('markBtn').addEventListener('click', () => {
    setEditorContent(markChordsInContent(editor.innerText));
  });
  document.getElementById('unMarkBtn').addEventListener('click', () => {
    setEditorContent(unMarkChordsInContent(editor.innerText));
  });
  document.getElementById('nestBtn').addEventListener('click', () => {
    setEditorContent(nestChordsInContent(editor.innerText));
  });
  document.getElementById('unNestBtn').addEventListener('click', () => {
    setEditorContent(unNestChordsInContent(editor.innerText));
  });
  document.getElementById('rmEmptyBtn').addEventListener('click', () => {
    setEditorContent(removeBlankLinesInContent(editor.innerText));
  });
  document.getElementById('transUpBtn').addEventListener('click', () => {
    setEditorContent(transposeInContent(editor.innerText, 1));
  });
  document.getElementById('transDownBtn').addEventListener('click', () => {
    setEditorContent(transposeInContent(editor.innerText, -1));
  });

  document.getElementById('generateButton').addEventListener('click', async () => {
    try {
      const configurations = loadConfigurations();
      const fileName = document.getElementById('filename').value;
      if (!fileName.trim()) {
        showStatus('Enter a song name first.');
        return;
      }

      showStatus('Generating DOCX files...');
      const documents = [];
      for (const config of configurations) {
        if (!config.enable) continue;
        let outputContent = transposeInContent(editor.innerText, Number.parseInt(config.transpose));
        if (document.getElementById('autoBreak').checked) {
          outputContent = autoBreakContent(outputContent, Number.parseInt(config.fontSize), config.a3);
        }

        const blob = await generateDocx({
          fontSize: config.fontSize,
          fontWeight: config.fontWeight,
          configName: config.name,
          a3: config.a3,
          content: outputContent,
          fileName,
        });
        documents.push({ blob, configName: config.name });
      }

      if (documents.length === 0) {
        showStatus('Enable at least one configuration first.');
        return;
      }

      showStatus('Creating ZIP download...');
      await downloadDocxZip(documents, fileName);
      showStatus('DOCX generation completed successfully.');
    } catch (error) {
      showStatus('DOCX generation failed.');
      console.error(error);
    }
  });

  document.getElementById('configBtn').addEventListener('click', () => {
    document.getElementById('configModal').showModal();
  });
});
