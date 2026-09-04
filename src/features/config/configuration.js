export const configStorageKey = 'chord-formatter-configurations';
export const configStorageVersion = 1;

export function normalizeConfiguration(configuration) {
  return {
    fontSize: Number(configuration?.fontSize),
    fontWeight: configuration?.fontWeight,
    transpose: Number(configuration?.transpose),
    name: typeof configuration?.name === 'string' ? configuration.name.trim() : '',
    a3: Boolean(configuration?.a3 ?? configuration?.A3),
    enable: Boolean(configuration?.enable),
  };
}

export function isValidConfiguration(configuration) {
  return Number.isInteger(configuration.fontSize) &&
    configuration.fontSize > 0 &&
    configuration.fontSize <= 72 &&
    (configuration.fontWeight === 'normal' || configuration.fontWeight === 'bold') &&
    Number.isInteger(configuration.transpose) &&
    configuration.transpose >= -24 &&
    configuration.transpose <= 24 &&
    configuration.name.length > 0 &&
    typeof configuration.a3 === 'boolean' &&
    typeof configuration.enable === 'boolean';
}

export function normalizeConfigurationList(value) {
  const configurations = Array.isArray(value) ? value : value?.configurations;
  if (!Array.isArray(configurations) || configurations.length === 0) {
    throw new Error('Configuration data must contain at least one configuration.');
  }

  const normalizedConfigurations = configurations.map(normalizeConfiguration);
  if (!normalizedConfigurations.every(isValidConfiguration)) {
    throw new Error('Configuration data contains invalid values.');
  }
  if (!normalizedConfigurations.some(configuration => configuration.enable)) {
    throw new Error('At least one configuration must be enabled.');
  }
  return normalizedConfigurations;
}

export function readStoredConfigurations(fallback) {
  try {
    const storedValue = localStorage.getItem(configStorageKey);
    return storedValue
      ? normalizeConfigurationList(JSON.parse(storedValue))
      : normalizeConfigurationList(fallback);
  } catch (error) {
    console.warn('Using default configurations:', error);
    return normalizeConfigurationList(fallback);
  }
}

export function saveStoredConfigurations(configurations) {
  try {
    localStorage.setItem(configStorageKey, JSON.stringify({
      version: configStorageVersion,
      configurations,
    }));
  } catch (error) {
    throw new Error('Configurations could not be saved in this browser.');
  }
}
