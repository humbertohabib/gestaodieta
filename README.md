# GestaoDieta

MVP web em portugues para captacao, pagamento sandbox, dashboards administrativos e geracao inicial de dietas.

## Recursos entregues

- Landing page responsiva com formulario avancado de captura.
- Pagamento sandbox para simular liberacao de acesso.
- Login com dois perfis: Admin Geral e Nutricionista.
- Painel Admin com indicadores, leads, usuarios e historico de eventos.
- Painel Nutricionista com pacientes, metricas, fotos de evolucao e gerador de dietas.
- Download de dieta em PDF e simulacao de envio por e-mail.
- Banco de dados em memoria para prototipacao rapida.
- Configuracao pronta para Render via `render.yaml`.

## Acessos de demonstracao

```txt
Admin: admin@gestaodieta.com.br / admin123
Nutri: nutri@gestaodieta.com.br / nutri123
```

## Rodar localmente

```bash
npm install
npm start
```

Acesse `http://localhost:3000`.

## Deploy no Render

1. Crie um novo Web Service no Render conectado a este repositorio.
2. Use ambiente Node.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Configure `SESSION_SECRET` como variavel de ambiente se nao usar o `render.yaml`.

## Sobre o gerador de dietas

O arquivo `src/dietGenerator.js` contem um modelo matematico MVP baseado em Mifflin-St Jeor. Ele foi isolado para facilitar a substituicao pela logica VBA existente quando o codigo for fornecido.

## Banco de dados

Este MVP usa armazenamento em memoria em `src/store.js`. Os dados sao reiniciados quando o servidor reinicia. Para producao, a evolucao natural e trocar essa camada por PostgreSQL, mantendo as mesmas entidades:

- usuarios
- leads
- pacientes
- metricas
- dietas
- fotos
- eventos

## Integracoes futuras

- Gateway real: Stripe, Mercado Pago ou Pagar.me.
- E-mail real: SMTP, SendGrid, Resend ou Amazon SES.
- Persistencia: PostgreSQL no Render.
- Uploads persistentes: S3, Cloudflare R2 ou Supabase Storage.
