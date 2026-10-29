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

const plurals = new Intl.PluralRules('ru');
export function formatMaterialCount(count: number): string {
  const form = plurals.select(count);
  const word = form === 'one' ? 'материал' : form === 'few' ? 'материала' : 'материалов';
  return `${count} ${word}`;
}
