const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const resolveFrontendUrl = (value) => {
  if (!value) {
    throw new Error('FRONTEND_URL debe estar definida');
  }

  const url = new URL(value.split(',')[0].trim());
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('FRONTEND_URL debe usar HTTP o HTTPS');
  }

  return url.toString();
};

const renderApiLandingPage = (req, res) => {
  const frontendUrl = escapeHtml(resolveFrontendUrl(process.env.FRONTEND_URL));

  return res.type('html').send(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>EcoMinds API</title>
    <style>
      :root { color-scheme: light; font-family: Arial, sans-serif; }
      body { align-items: center; background: #f5f8f7; color: #173d33; display: flex; justify-content: center; margin: 0; min-height: 100vh; padding: 1.5rem; }
      main { background: #fff; border: 1px solid #d9e5df; border-radius: 1rem; box-shadow: 0 12px 32px rgba(0, 69, 50, .12); max-width: 28rem; padding: 2.5rem; text-align: center; width: 100%; }
      img { height: 5rem; object-fit: contain; width: 5rem; }
      h1 { font-size: 2rem; margin: 1rem 0 .5rem; }
      p { color: #557067; line-height: 1.55; margin: 0 0 1.75rem; }
      a { background: #004532; border-radius: .5rem; color: #fff; display: inline-block; font-weight: 700; padding: .8rem 1.25rem; text-decoration: none; }
      a:hover, a:focus { background: #00664b; }
    </style>
  </head>
  <body>
    <main>
      <img src="/assets/icono_hoja.png" alt="EcoMinds">
      <h1>EcoMinds API</h1>
      <p>Servicio de auditoría ambiental.</p>
      <a href="${frontendUrl}">Ir a EcoMinds</a>
    </main>
  </body>
</html>`);
};

export default renderApiLandingPage;
