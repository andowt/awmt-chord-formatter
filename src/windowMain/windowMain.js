import {
  markChordsInContent,
  unMarkChordsInContent,
  nestChordsInContent,
  unNestChordsInContent,
  transposeInContent,
  removeBlankLinesInContent,
  autoBreakContent
} from '../chordProcessing/chordContentProcessor.js';
import { downloadDocx, generateDocx } from '../docxGenerator/docxGen.js';

const configStorageKey = 'chord-formatter-configurations';
const defaultConfigurationsUrl = new URL('../windowConfig/default_configs.json', import.meta.url);
const exampleTextUrl = new URL('../exampleLoader/example.txt', import.meta.url);

async function loadConfigurations() {
  const savedConfigurations = localStorage.getItem(configStorageKey);
  if (savedConfigurations) return JSON.parse(savedConfigurations);

  const response = await fetch(defaultConfigurationsUrl);
  if (!response.ok) throw new Error(`Failed to load configurations: ${response.status}`);
  return response.json();
}

function showStatus(message) {
  document.getElementById('status').textContent = message;
}

document.addEventListener('DOMContentLoaded', () => {
  const editor = document.getElementById('editor');

  document.getElementById('loadExampleBtn').addEventListener('click', async () => {
    try {
      const response = await fetch(exampleTextUrl);
      if (!response.ok) throw new Error(`Failed to load example: ${response.status}`);
      editor.innerText = await response.text();
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
      const configurations = await loadConfigurations();
      const fileName = document.getElementById('filename').value;
      if (!fileName.trim()) {
        showStatus('Enter a song name first.');
        return;
      }

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
        downloadDocx(blob, fileName, config.name);
      }
      showStatus('DOCX generation completed successfully.');
    } catch (error) {
      showStatus('DOCX generation failed.');
      console.error(error);
    }
  });

  document.getElementById('configBtn').addEventListener('click', () => {
    window.open('/config.html', '_blank', 'popup,width=800,height=600');
  });
});
