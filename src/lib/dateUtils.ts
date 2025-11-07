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
