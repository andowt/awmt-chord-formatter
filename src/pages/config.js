import configurationsFile from '../data/config.json';
import defaultConfigurationsFile from '../data/default-configs.json';
import {
  normalizeConfiguration,
  normalizeConfigurationList,
  readStoredConfigurations,
  saveStoredConfigurations,
} from '../features/config/configuration.js';

document.addEventListener('DOMContentLoaded', () => {
  let configurations = readStoredConfigurations(configurationsFile);
  let savedConfigurations = JSON.stringify(configurations);
  const configModal = document.getElementById('configModal');
  const configContainer = document.getElementById('configurations');
  const configStatus = document.getElementById('config-status');

  function setConfigStatus(message) {
    configStatus.textContent = message;
  }

  function updateDirtyStatus() {
    const isDirty = JSON.stringify(configurations) !== savedConfigurations;
    setConfigStatus(isDirty ? 'Unsaved changes.' : '');
  }

  function createField(labelText, input) {
    const label = document.createElement('label');
    label.textContent = labelText;
    label.htmlFor = input.id;
    return [label, input];
  }

  function createConfigElement(configuration, index) {
    const configElement = document.createElement('div');
    configElement.className = 'config-item';

    const fontSize = document.createElement('input');
    fontSize.type = 'number';
    fontSize.id = `font-size-${index}`;
    fontSize.value = configuration.fontSize;
    fontSize.min = '1';
    fontSize.max = '72';
    fontSize.required = true;

    const fontWeight = document.createElement('select');
    fontWeight.id = `font-weight-${index}`;
    fontWeight.required = true;
    ['normal', 'bold'].forEach(weight => {
      const option = document.createElement('option');
      option.value = weight;
      option.textContent = weight[0].toUpperCase() + weight.slice(1);
      option.selected = configuration.fontWeight === weight;
      fontWeight.appendChild(option);
    });

    const transpose = document.createElement('input');
    transpose.type = 'number';
    transpose.id = `transpose-${index}`;
    transpose.value = configuration.transpose;
    transpose.min = '-24';
    transpose.max = '24';
    transpose.required = true;

    const name = document.createElement('input');
    name.type = 'text';
    name.id = `name-${index}`;
    name.value = configuration.name;
    name.required = true;

    const a3 = document.createElement('input');
    a3.type = 'checkbox';
    a3.id = `a3-${index}`;
    a3.checked = configuration.a3;

    const enable = document.createElement('input');
    enable.type = 'checkbox';
    enable.id = `enable-${index}`;
    enable.checked = configuration.enable;

    [
      ...createField('Font Size:', fontSize),
      ...createField('Font Weight:', fontWeight),
      ...createField('Transpose:', transpose),
      ...createField('Name:', name),
      ...createField('A3:', a3),
      ...createField('Enable:', enable),
    ].forEach(element => configElement.appendChild(element));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      configurations.splice(index, 1);
      renderConfigurations();
      updateDirtyStatus();
    });
    configElement.appendChild(deleteButton);
    return configElement;
  }

  function renderConfigurations() {
    configContainer.replaceChildren(
      ...configurations.map((configuration, index) => createConfigElement(configuration, index)),
    );
  }

  function readConfigurationsFromForm() {
    return configurations.map((configuration, index) => normalizeConfiguration({
      fontSize: document.getElementById(`font-size-${index}`).value,
      fontWeight: document.getElementById(`font-weight-${index}`).value,
      transpose: document.getElementById(`transpose-${index}`).value,
      name: document.getElementById(`name-${index}`).value,
      a3: document.getElementById(`a3-${index}`).checked,
      enable: document.getElementById(`enable-${index}`).checked,
    }));
  }

  function captureFormChanges() {
    try {
      configurations = normalizeConfigurationList(readConfigurationsFromForm());
      updateDirtyStatus();
      return true;
    } catch (error) {
      setConfigStatus(error.message);
      return false;
    }
  }

  function saveConfigurations() {
    if (!captureFormChanges()) return;
    try {
      saveStoredConfigurations(configurations);
      savedConfigurations = JSON.stringify(configurations);
      setConfigStatus('Configurations saved.');
    } catch (error) {
      setConfigStatus(error.message);
    }
  }

  function exportConfigurations() {
    if (!captureFormChanges()) return;
    const file = new Blob([JSON.stringify({ version: 1, configurations }, null, 2)], {
      type: 'application/json',
    });
    const downloadLink = document.createElement('a');
    const objectUrl = URL.createObjectURL(file);
    downloadLink.href = objectUrl;
    downloadLink.download = 'chord-formatter-configurations.json';
    downloadLink.click();
    URL.revokeObjectURL(objectUrl);
    setConfigStatus('Configurations exported.');
  }

  function importConfigurations(file) {
    file.text()
      .then(fileContents => normalizeConfigurationList(JSON.parse(fileContents)))
      .then(importedConfigurations => {
        configurations = importedConfigurations;
        renderConfigurations();
        setConfigStatus('Configurations imported. Save to keep them.');
      })
      .catch(error => setConfigStatus(`Import failed: ${error.message}`));
  }

  document.getElementById('add-config').addEventListener('click', () => {
    captureFormChanges();
    configurations.push(normalizeConfiguration({
      fontSize: 12,
      fontWeight: 'normal',
      transpose: 0,
      name: 'New Configuration',
      a3: true,
      enable: true,
    }));
    renderConfigurations();
    updateDirtyStatus();
  });

  document.getElementById('save-configurations').addEventListener('click', () => {
    saveConfigurations();
    if (JSON.stringify(configurations) === savedConfigurations) configModal.close();
  });

  document.getElementById('default-configurations').addEventListener('click', () => {
    if (JSON.stringify(configurations) !== savedConfigurations && !window.confirm('Replace current changes with the default configurations?')) {
      return;
    }
    configurations = normalizeConfigurationList(defaultConfigurationsFile);
    renderConfigurations();
    updateDirtyStatus();
  });

  document.getElementById('export-configurations').addEventListener('click', exportConfigurations);

  const configFileInput = document.getElementById('config-file-input');
  document.getElementById('import-configurations').addEventListener('click', () => configFileInput.click());
  configFileInput.addEventListener('change', event => {
    const [file] = event.target.files;
    if (file) importConfigurations(file);
    event.target.value = '';
  });

  configContainer.addEventListener('input', captureFormChanges);
  configModal.addEventListener('close', () => {
    if (JSON.stringify(configurations) !== savedConfigurations) {
      configurations = JSON.parse(savedConfigurations);
      renderConfigurations();
      setConfigStatus('');
    }
  });

  renderConfigurations();
});
