// Função para adicionar dias úteis (segunda a sexta)
export const addBusinessDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    // 0 = domingo, 6 = sábado
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays++;
    }
  }

  return result;
};

// Função para adicionar horas úteis (considerando dias úteis)
export const addBusinessHours = (date: Date, hours: number): Date => {
  const hoursPerDay = 24;
  const days = Math.floor(hours / hoursPerDay);
  const remainingHours = hours % hoursPerDay;

  let result = addBusinessDays(date, days);
  result.setHours(result.getHours() + remainingHours);

  return result;
};

// Verificar se o prazo expirou
export const isPrazoExpirado = (dataPrazo: string | null): boolean => {
  if (!dataPrazo) return false;
  return new Date(dataPrazo) < new Date();
};

// Normalizar data para início do dia (00:00:00.000) - timezone local
export const getStartOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

// Normalizar data para fim do dia (23:59:59.999) - timezone local
export const getEndOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

// Converter data local para ISO string (UTC) mantendo o dia correto
export const getStartOfDayISO = (date: Date): string => {
  return getStartOfDay(date).toISOString();
};

// Converter data local para ISO string (UTC) mantendo o dia correto - fim do dia
export const getEndOfDayISO = (date: Date): string => {
  return getEndOfDay(date).toISOString();
};

// Obter data de hoje (início do dia)
export const getTodayStart = (): Date => {
  return getStartOfDay(new Date());
};

// Obter data de hoje (fim do dia)
export const getTodayEnd = (): Date => {
  return getEndOfDay(new Date());
};
