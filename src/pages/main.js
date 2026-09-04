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

function loadConfigurations() {
  return readStoredConfigurations(defaultConfigurations);
}

function showStatus(message) {
  document.getElementById('status').textContent = message;
}

document.addEventListener('DOMContentLoaded', () => {
  const editor = document.getElementById('editor');

  editor.addEventListener('paste', event => {
    event.preventDefault();
    const tabSpacesInput = document.getElementById('tabSpaces');
    const tabSpaces = Math.max(0, Number.parseInt(tabSpacesInput.value, 10) || 0);
    const plainText = (event.clipboardData?.getData('text/plain') ?? '')
      .replaceAll('\t', ' '.repeat(tabSpaces));
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      editor.append(document.createTextNode(plainText));
      return;
    }

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      editor.append(document.createTextNode(plainText));
      return;
    }

    range.deleteContents();
    const textNode = document.createTextNode(plainText);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  });

  document.getElementById('loadExampleBtn').addEventListener('click', async () => {
    try {
      editor.innerText = exampleText;
    } catch (error) {
      showStatus('Failed to load example text.');
      console.error(error);
    }
  });

  document.getElementById('markBtn').addEventListener('click', () => {
    editor.innerText = markChordsInContent(editor.innerText);
  });
  document.getElementById('unMarkBtn').addEventListener('click', () => {
    editor.innerText = unMarkChordsInContent(editor.innerText);
  });
  document.getElementById('nestBtn').addEventListener('click', () => {
    editor.innerText = nestChordsInContent(editor.innerText);
  });
  document.getElementById('unNestBtn').addEventListener('click', () => {
    editor.innerText = unNestChordsInContent(editor.innerText);
  });
  document.getElementById('rmEmptyBtn').addEventListener('click', () => {
    editor.innerText = removeBlankLinesInContent(editor.innerText);
  });
  document.getElementById('transUpBtn').addEventListener('click', () => {
    editor.innerText = transposeInContent(editor.innerText, 1);
  });
  document.getElementById('transDownBtn').addEventListener('click', () => {
    editor.innerText = transposeInContent(editor.innerText, -1);
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
