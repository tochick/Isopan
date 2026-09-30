const path = require('node:path');
const { spawn } = require('node:child_process');

const address = 'http://127.0.0.1:4173';

async function available() {
  try {
    const response = await fetch(`${address}/api/bootstrap`, { signal: AbortSignal.timeout(1500) });
    const body = await response.json();
    return response.ok && typeof body.setupRequired === 'boolean';
  } catch {
    return false;
  }
}

async function main() {
  if (await available()) {
    console.log(`Isopan ya está disponible en ${address}`);
    return;
  }

  const child = spawn(process.execPath, [path.join(__dirname, 'server.cjs')], {
    cwd: __dirname,
    detached: true,
    windowsHide: true,
    stdio: 'ignore'
  });
  child.unref();

  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 250));
    if (await available()) {
      console.log(`Isopan iniciada. Abre ${address} en este ordenador.`);
      return;
    }
  }

  console.error('No se pudo iniciar Isopan. Comprueba que el puerto 4173 esté libre y consulta el archivo README.md.');
  process.exitCode = 1;
}

main().catch(error => {
  console.error('No se pudo iniciar Isopan:', error.message);
  process.exitCode = 1;
});
