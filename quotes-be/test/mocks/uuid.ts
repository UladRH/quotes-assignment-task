let counter = 0;

export const v4 = (): string => {
  counter += 1;
  const padded = counter.toString().padStart(12, '0');
  return `00000000-0000-0000-0000-${padded}`;
};
