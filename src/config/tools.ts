import debug from 'debug';
import { EnvKeys, EnvVars } from './interfaces';

import variables, { VariableValue } from './variables';

const log = debug('app:config');

type GNonNullableAppEnvVar<T extends EnvKeys> = NonNullable<EnvVars[T]>;

export const get = (() => {
  const cache: Record<string, VariableValue> = {};

  return <T extends EnvKeys>(envVarName: T): GNonNullableAppEnvVar<T> => {
    type TAppEnvVars = GNonNullableAppEnvVar<T>;

    if (typeof cache[envVarName] !== 'undefined') return cache[envVarName] as TAppEnvVars;

    let result = process.env[envVarName] as VariableValue;
    const variable = variables[envVarName];

    if (!variable) return result as TAppEnvVars;

    const { defaultValue, type = 'string' } = variable;

    if (typeof result === 'undefined') result = defaultValue as VariableValue;

    switch (type) {
      case 'number':
        return +result as TAppEnvVars;
      case 'boolean':
        return (result === 'true' || result === true) as TAppEnvVars;
      default:
        return result as TAppEnvVars;
    }
  };
})();

export function print() {
  const max_length = {
    group: 0,
    label: 0,
  };
  /**
   * Extract variables should be logged and group them
   */
  const groups = Object.entries(variables).reduce<
    {
      name: string;
      variables: {
        name: string;
        value: VariableValue;
      }[];
    }[]
  >((prev, [key, { name = key, log: isLog, group = 'global' }]) => {
    if (isLog === false) return prev;
    let g = prev.find(({ name: n }) => n === group);
    if (!g) {
      g = { name: group, variables: [] };
      prev.push(g);
    }
    g.variables.push({
      name,
      value: exports.get(key),
    });

    if (group.length > max_length.group) max_length.group = group.length;
    if (name.length > max_length.label) max_length.label = name.length;
    return prev;
  }, []);

  groups.sort(({ name: a }, { name: b }) => a.length - b.length);

  groups.forEach(({ name: group, variables: vars }) => {
    vars
      .sort(({ name: a }, { name: b }) => a.length - b.length)
      .forEach(({ name, value }) => {
        const label = `${`[${group}]`.padEnd(max_length.group + 2)} ${name.padEnd(
          max_length.label + 1,
        )}`;
        log(`${label}: ${value === '' ? '<empty>' : value}`);
      });
  });
}
