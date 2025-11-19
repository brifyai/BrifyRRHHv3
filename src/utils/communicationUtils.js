// Funciones de utilidad para generar datos de comunicación

export const generateChileanPhone = (employeeId) => {
  const prefixes = ['9', '8', '7'];
  const prefix = prefixes[employeeId % 3];
  const number = String(employeeId).padStart(8, '0').slice(0, 8);
  return `+56${prefix}${number}`;
};

export const generateTelegramUsername = (firstName, lastName, employeeId) => {
  const baseName = `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase().replace(/\s/g, '')}`;
  return `${baseName}${employeeId % 9999}`;
};

export const getSimulatedWhatsApp = (employee) => {
  // Usar un hash simple del ID para generar un número consistente
  const hash = employee.id.split('-').join('').slice(0, 8);
  const numericId = parseInt(hash, 16) || parseInt(employee.id) || 0;
  const enabled = numericId % 10 < 8; // 80% habilitado
  return {
    enabled,
    phone: enabled ? generateChileanPhone(numericId) : 'Sin WhatsApp'
  };
};

export const getSimulatedTelegram = (employee) => {
  // Usar un hash simple del ID para generar un número consistente
  const hash = employee.id.split('-').join('').slice(0, 8);
  const numericId = parseInt(hash, 16) || parseInt(employee.id) || 0;
  const enabled = numericId % 10 < 7; // 70% habilitado
  return {
    enabled,
    username: enabled ? `@${generateTelegramUsername(employee.first_name, employee.last_name, numericId)}` : 'Sin Telegram'
  };
};

export const getSimulatedSMS = (employee, whatsappData) => {
  return {
    enabled: whatsappData.enabled, // SMS usa el mismo número que WhatsApp
    phone: whatsappData.phone
  };
};

export const getSimulatedMailing = (employee) => {
  // Usar un hash simple del ID para generar un número consistente
  const hash = employee.id.split('-').join('').slice(0, 8);
  const numericId = parseInt(hash, 16) || parseInt(employee.id) || 0;
  const enabled = employee.email && numericId % 10 < 6; // 60% de los que tienen email
  return {
    enabled,
    status: enabled ? 'Suscrito' : 'No suscrito'
  };
};