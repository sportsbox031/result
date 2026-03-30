export const getDefaultDemandYear = (): number => new Date().getFullYear();

export const normalizeDemandYear = ({
  year,
  createdAt
}: {
  year?: unknown;
  createdAt?: Date | null;
}): number => {
  if (typeof year === 'number' && Number.isFinite(year)) {
    return year;
  }

  if (createdAt instanceof Date && !Number.isNaN(createdAt.getTime())) {
    return createdAt.getFullYear();
  }

  return getDefaultDemandYear();
};
