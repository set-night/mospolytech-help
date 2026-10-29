export const quickTags = [
  'стипендия',
  'общежитие',
  'сессия',
  'справки',
  'пересдачи',
  'пропуск',
  'перевод',
  'ПД',
];
export const normalizeTag = (value: string): string =>
  value.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim();
