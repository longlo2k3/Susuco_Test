export const removeVietnameseTones = (str: string) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

export const matchVietnameseSearch = (text: string, search: string) => {
  const normalizedText = removeVietnameseTones(text).toLowerCase();
  const normalizedSearch = removeVietnameseTones(search).toLowerCase();
  return normalizedText.includes(normalizedSearch);
};
