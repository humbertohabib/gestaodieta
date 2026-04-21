const path = require('path');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const {
  addDiet,
  addEvent,
  addMetric,
  addPhoto,
  createLead,
  createPatient,
  dashboardStats,
  diets,
  events,
  findUserByEmail,
  leads,
  markLeadPaid,
  metrics,
  patients,
  photos,
  users
} = require('./src/store');
const { generateDiet } = require('./src/dietGenerator');
const { buildDietPdf } = require('./src/pdf');

const app = express();
const port = process.env.PORT || 3000;

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, 'public', 'uploads'),
    filename: (_req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-');
      cb(null, `${Date.now()}-${safeName}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'gestaodieta-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

function flash(req, type, message) {
  req.session.flash = { type, message };
}

function requireAuth(role) {
  return (req, res, next) => {
    if (!req.session.user) {
      flash(req, 'erro', 'Entre para acessar o painel.');
      return res.redirect('/login');
    }
    if (role && req.session.user.role !== role) {
      flash(req, 'erro', 'Seu perfil nao possui permissao para essa area.');
      return res.redirect(req.session.user.role === 'admin' ? '/admin' : '/nutri');
    }
    return next();
  };
}

function patientById(patientId) {
  return patients.find((patient) => patient.id === patientId);
}

app.get('/', (_req, res) => {
  res.render('landing', {
    title: 'GestaoDieta',
    plans: [
      { id: 'starter', name: 'Essencial', price: 'R$ 97', description: 'Captacao, triagem e primeiro plano alimentar.' },
      { id: 'professional', name: 'Profissional', price: 'R$ 197', description: 'Gerador, dashboard e acompanhamento mensal.' },
      { id: 'clinic', name: 'Clinica', price: 'R$ 397', description: 'Volume ampliado para times e historico completo.' }
    ]
  });
});

app.post('/lead', (req, res) => {
  const lead = createLead(req.body);
  res.redirect(`/pagamento/${lead.id}`);
});

app.get('/pagamento/:id', (req, res) => {
  const lead = leads.find((item) => item.id === req.params.id);
  if (!lead) return res.status(404).render('error', { title: 'Lead nao encontrado', message: 'Cadastro nao localizado.' });
  return res.render('payment', { title: 'Pagamento', lead });
});

app.post('/pagamento/:id/confirmar', (req, res) => {
  const lead = markLeadPaid(req.params.id);
  if (!lead) return res.status(404).render('error', { title: 'Lead nao encontrado', message: 'Cadastro nao localizado.' });
  flash(req, 'sucesso', 'Pagamento confirmado no modo sandbox. O acesso ja pode ser liberado.');
  return res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

app.post('/login', (req, res) => {
  const user = findUserByEmail(req.body.email);
  if (!user || user.password !== req.body.password || !user.active) {
    flash(req, 'erro', 'Credenciais invalidas ou usuario inativo.');
    return res.redirect('/login');
  }
  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  addEvent('login', `${user.name} acessou o sistema.`, { userId: user.id });
  return res.redirect(user.role === 'admin' ? '/admin' : '/nutri');
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.get('/admin', requireAuth('admin'), (_req, res) => {
  res.render('admin', {
    title: 'Painel Admin',
    stats: dashboardStats(),
    leads,
    users,
    events
  });
});

app.post('/admin/users/:id/toggle', requireAuth('admin'), (req, res) => {
  const user = users.find((item) => item.id === req.params.id);
  if (user && user.role !== 'admin') {
    user.active = !user.active;
    addEvent('usuario', `${user.name} foi ${user.active ? 'ativado' : 'inativado'}.`, { userId: user.id });
  }
  res.redirect('/admin#usuarios');
});

app.post('/admin/leads/:id/payment', requireAuth('admin'), (req, res) => {
  markLeadPaid(req.params.id);
  res.redirect('/admin#leads');
});

app.get('/nutri', requireAuth('nutri'), (_req, res) => {
  const latestMetrics = patients.map((patient) => ({
    patient,
    metric: metrics.find((item) => item.patientId === patient.id)
  }));
  res.render('nutri', {
    title: 'Painel Nutricionista',
    patients,
    metrics,
    latestMetrics,
    diets,
    photos
  });
});

app.post('/nutri/pacientes', requireAuth('nutri'), (req, res) => {
  createPatient(req.body);
  flash(req, 'sucesso', 'Paciente cadastrado.');
  res.redirect('/nutri#pacientes');
});

app.post('/nutri/metricas', requireAuth('nutri'), (req, res) => {
  addMetric(req.body);
  flash(req, 'sucesso', 'Metrica registrada.');
  res.redirect('/nutri#metricas');
});

app.post('/nutri/fotos', requireAuth('nutri'), upload.single('photo'), (req, res) => {
  if (!req.file) {
    flash(req, 'erro', 'Envie uma imagem valida.');
    return res.redirect('/nutri#fotos');
  }
  addPhoto({
    patientId: req.body.patientId,
    filename: req.file.filename,
    originalName: req.file.originalname,
    caption: req.body.caption
  });
  flash(req, 'sucesso', 'Foto enviada.');
  return res.redirect('/nutri#fotos');
});

app.post('/nutri/dietas', requireAuth('nutri'), (req, res) => {
  const patient = patientById(req.body.patientId);
  if (!patient) {
    flash(req, 'erro', 'Paciente nao encontrado.');
    return res.redirect('/nutri#gerador');
  }
  const generated = generateDiet({ ...req.body, restrictions: patient.restrictions });
  const diet = addDiet({
    ...generated,
    patientId: patient.id,
    patientName: patient.name,
    patientEmail: patient.email
  });
  req.session.lastDietId = diet.id;
  flash(req, 'sucesso', 'Dieta gerada com sucesso.');
  return res.redirect(`/nutri/dietas/${diet.id}`);
});

app.get('/nutri/dietas/:id', requireAuth('nutri'), (req, res) => {
  const diet = diets.find((item) => item.id === req.params.id);
  if (!diet) return res.status(404).render('error', { title: 'Dieta nao encontrada', message: 'Plano alimentar nao localizado.' });
  return res.render('diet', { title: 'Dieta gerada', diet });
});

app.get('/nutri/dietas/:id/pdf', requireAuth('nutri'), (req, res) => {
  const diet = diets.find((item) => item.id === req.params.id);
  if (!diet) return res.status(404).send('Dieta nao encontrada');
  const pdf = buildDietPdf(diet);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="dieta-${diet.patientName.replace(/\s+/g, '-').toLowerCase()}.pdf"`);
  return res.send(pdf);
});

app.post('/nutri/dietas/:id/enviar', requireAuth('nutri'), (req, res) => {
  const diet = diets.find((item) => item.id === req.params.id);
  if (!diet) return res.status(404).render('error', { title: 'Dieta nao encontrada', message: 'Plano alimentar nao localizado.' });
  diet.sentAt = new Date().toISOString();
  addEvent('email', `Envio simulado para ${diet.patientEmail}.`, { dietId: diet.id });
  flash(req, 'sucesso', `Envio simulado para ${diet.patientEmail}. Configure SMTP/SendGrid para disparo real.`);
  return res.redirect(`/nutri/dietas/${diet.id}`);
});

app.get('/api/nutri/metricas/:patientId', requireAuth('nutri'), (req, res) => {
  res.json(metrics.filter((item) => item.patientId === req.params.patientId).reverse());
});

app.use((_req, res) => {
  res.status(404).render('error', { title: 'Pagina nao encontrada', message: 'A rota solicitada nao existe neste MVP.' });
});

app.listen(port, () => {
  console.log(`GestaoDieta rodando em http://localhost:${port}`);
});
