const { randomUUID } = require('crypto');

const nowIso = () => new Date().toISOString();

const users = [
  {
    id: 'admin-1',
    name: 'Admin Geral',
    email: 'admin@gestaodieta.com.br',
    password: 'admin123',
    role: 'admin',
    active: true,
    paid: true,
    createdAt: nowIso()
  },
  {
    id: 'nutri-1',
    name: 'Nutricionista Demo',
    email: 'nutri@gestaodieta.com.br',
    password: 'nutri123',
    role: 'nutri',
    active: true,
    paid: true,
    createdAt: nowIso()
  }
];

const leads = [
  {
    id: randomUUID(),
    name: 'Mariana Lopes',
    email: 'mariana@email.com',
    phone: '(11) 98888-1000',
    goal: 'Emagrecimento com preservacao de massa magra',
    plan: 'Profissional',
    status: 'pago',
    paid: true,
    source: 'Landing page',
    createdAt: nowIso()
  }
];

const patients = [
  {
    id: randomUUID(),
    name: 'Mariana Lopes',
    email: 'mariana@email.com',
    phone: '(11) 98888-1000',
    birthDate: '1992-04-10',
    goal: 'Emagrecimento',
    restrictions: 'Sem lactose',
    createdAt: nowIso()
  }
];

const metrics = [];
const diets = [];
const photos = [];
const events = [
  {
    id: randomUUID(),
    type: 'sistema',
    message: 'Ambiente MVP iniciado com banco em memoria.',
    createdAt: nowIso()
  }
];

function addEvent(type, message, meta = {}) {
  const event = { id: randomUUID(), type, message, meta, createdAt: nowIso() };
  events.unshift(event);
  return event;
}

function createLead(data) {
  const lead = {
    id: randomUUID(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    goal: data.goal,
    plan: data.plan,
    status: 'pendente',
    paid: false,
    source: 'Landing page',
    createdAt: nowIso()
  };
  leads.unshift(lead);
  addEvent('lead', `Novo lead cadastrado: ${lead.name}`, { leadId: lead.id });
  return lead;
}

function markLeadPaid(leadId) {
  const lead = leads.find((item) => item.id === leadId);
  if (!lead) return null;
  lead.status = 'pago';
  lead.paid = true;
  addEvent('pagamento', `Pagamento confirmado para ${lead.name}`, { leadId });
  return lead;
}

function createPatient(data) {
  const patient = {
    id: randomUUID(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    birthDate: data.birthDate,
    goal: data.goal,
    restrictions: data.restrictions || 'Nenhuma informada',
    createdAt: nowIso()
  };
  patients.unshift(patient);
  addEvent('paciente', `Paciente criado: ${patient.name}`, { patientId: patient.id });
  return patient;
}

function addMetric(data) {
  const metric = {
    id: randomUUID(),
    patientId: data.patientId,
    date: data.date || new Date().toISOString().slice(0, 10),
    weight: Number(data.weight),
    waist: Number(data.waist),
    hip: Number(data.hip),
    bodyFat: Number(data.bodyFat),
    notes: data.notes || '',
    createdAt: nowIso()
  };
  metrics.unshift(metric);
  addEvent('metrica', 'Nova metrica registrada.', { patientId: metric.patientId });
  return metric;
}

function addDiet(data) {
  const diet = {
    id: randomUUID(),
    patientId: data.patientId,
    patientName: data.patientName,
    patientEmail: data.patientEmail,
    calories: data.calories,
    protein: data.protein,
    carbs: data.carbs,
    fat: data.fat,
    meals: data.meals,
    notes: data.notes,
    sentAt: data.sentAt || null,
    createdAt: nowIso()
  };
  diets.unshift(diet);
  addEvent('dieta', `Dieta gerada para ${diet.patientName}`, { dietId: diet.id });
  return diet;
}

function addPhoto(data) {
  const photo = {
    id: randomUUID(),
    patientId: data.patientId,
    filename: data.filename,
    originalName: data.originalName,
    caption: data.caption || 'Foto de evolucao',
    createdAt: nowIso()
  };
  photos.unshift(photo);
  addEvent('foto', 'Foto de evolucao enviada.', { patientId: photo.patientId });
  return photo;
}

function findUserByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === String(email).toLowerCase());
}

function dashboardStats() {
  const paidLeads = leads.filter((lead) => lead.paid).length;
  return {
    totalLeads: leads.length,
    paidLeads,
    pendingLeads: leads.length - paidLeads,
    activeUsers: users.filter((user) => user.active).length,
    patients: patients.length,
    diets: diets.length,
    conversionRate: leads.length ? Math.round((paidLeads / leads.length) * 100) : 0
  };
}

module.exports = {
  users,
  leads,
  patients,
  metrics,
  diets,
  photos,
  events,
  addDiet,
  addEvent,
  addMetric,
  addPhoto,
  createLead,
  createPatient,
  dashboardStats,
  findUserByEmail,
  markLeadPaid
};
