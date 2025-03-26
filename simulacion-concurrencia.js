const express = require("express");
const crypto = require("crypto");
const app = express();

app.use(express.json());

// Simulación de una "base de datos" en memoria
const emissionReports = [
  {
    id: 1,
    title: "Informe Anual de Emisiones 2023",
    description: "Análisis de la huella de carbono corporativa",
    co2_total: 1500.5,
    status: "draft",
    created_at: "2023-10-15",
    updated_at: "2023-12-20T14:30:00Z",
  },
  {
    id: 2,
    title: "Emisiones Q1 2024",
    description: "Emisiones del primer trimestre",
    co2_total: 420.8,
    status: "published",
    created_at: "2024-01-15",
    updated_at: "2024-02-02T09:15:00Z",
  },
];

// Función para encontrar un informe por ID
function findReportById(id) {
  return emissionReports.find((report) => report.id === parseInt(id));
}

// Función para actualizar un informe
function updateReport(id, updates) {
  const index = emissionReports.findIndex(
    (report) => report.id === parseInt(id)
  );
  if (index !== -1) {
    // Actualizar solo los campos proporcionados
    const updatedReport = {
      ...emissionReports[index],
      ...updates,
      updated_at: new Date().toISOString(), // Actualizar timestamp
    };
    emissionReports[index] = updatedReport;
    return updatedReport;
  }
  return null;
}

// ==================================
// MALA PRÁCTICA (Sin control de concurrencia)
// ==================================

// Endpoint para obtener un informe
app.get("/api/reports/:id", (req, res) => {
  const report = findReportById(req.params.id);

  if (!report) {
    return res.status(404).json({ error: "Informe no encontrado" });
  }

  res.json(report);
});

// Endpoint para actualizar un informe SIN control de concurrencia
app.put("/api/reports/:id", (req, res) => {
  const reportId = req.params.id;
  const report = findReportById(reportId);

  if (!report) {
    return res.status(404).json({ error: "Informe no encontrado" });
  }

  // Actualizar directamente sin verificar versiones
  const updatedReport = updateReport(reportId, req.body);
  res.json(updatedReport);
});

// ==========================================
// BUENA PRÁCTICA (Con control de concurrencia)
// ==========================================

// Función para generar ETag
function generateETag(report) {
  return crypto.createHash("md5").update(JSON.stringify(report)).digest("hex");
}

// Endpoint para obtener un informe CON ETag
app.get("/api/reports-safe/:id", (req, res) => {
  const report = findReportById(req.params.id);

  if (!report) {
    return res.status(404).json({ error: "Informe no encontrado" });
  }

  // Generar ETag basado en el estado actual del recurso
  const etag = generateETag(report);

  // Verificar si el cliente ya tiene la versión más reciente
  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end(); // Not Modified
  }

  // Incluir ETag en la respuesta
  res.setHeader("ETag", etag);
  res.json(report);
});

// Endpoint para actualizar un informe CON control de concurrencia
app.put("/api/reports-safe/:id", (req, res) => {
  const reportId = req.params.id;
  const report = findReportById(reportId);

  if (!report) {
    return res.status(404).json({ error: "Informe no encontrado" });
  }

  // Generar ETag del estado actual
  const currentETag = generateETag(report);

  // Obtener ETag enviado por el cliente
  const clientETag = req.headers["if-match"];

  // Verificar si se incluyó el encabezado If-Match
  if (!clientETag) {
    return res.status(428).json({
      error: "Precondition Required",
      message:
        "Este recurso requiere el encabezado If-Match para actualizaciones",
    });
  }

  // Verificar si el ETag del cliente coincide con el actual
  if (clientETag !== currentETag) {
    return res.status(412).json({
      error: "Precondition Failed",
      message:
        "El recurso ha sido modificado desde que lo obtuviste. Por favor, obtén la versión más reciente e intenta nuevamente.",
    });
  }

  // ETag coincide, proceder con la actualización
  const updatedReport = updateReport(reportId, req.body);

  // Generar nuevo ETag para la versión actualizada
  const newETag = generateETag(updatedReport);

  // Incluir nuevo ETag en la respuesta
  res.setHeader("ETag", newETag);
  res.json(updatedReport);
});

// =================================
// Simulador de escenario de conflicto
// =================================

// Esta ruta simula visualmente un escenario de conflicto
app.get("/simular-conflicto", (req, res) => {
  const reportId = 1;
  const report = findReportById(reportId);
  const etag = generateETag(report);

  // HTML para mostrar la simulación
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Simulación de Conflicto de Concurrencia</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .container { display: flex; gap: 20px; }
        .user { flex: 1; border: 1px solid #ccc; padding: 15px; border-radius: 5px; }
        .user h2 { margin-top: 0; color: #333; }
        .actions { margin: 20px 0; background: #f7f7f7; padding: 15px; border-radius: 5px; }
        button { padding: 8px 15px; margin: 5px; cursor: pointer; }
        .results { margin-top: 20px; border-left: 4px solid #ccc; padding-left: 15px; }
        .error { color: #d32f2f; }
        .success { color: #388e3c; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; }
      </style>
    </head>
    <body>
      <h1>Simulación de Problema de Concurrencia</h1>
      <p>Este ejemplo muestra cómo dos usuarios pueden editar el mismo recurso simultáneamente, causando problemas de concurrencia.</p>
      
      <div class="container">
        <div class="user">
          <h2>Usuario A</h2>
          <div>
            <p>1. Obtiene el informe (ETag: <code id="etagA">${etag}</code>)</p>
            <pre id="reportA">${JSON.stringify(report, null, 2)}</pre>
            <button onclick="updateUserA()">Actualizar CO₂ a 1650 toneladas</button>
            <div id="resultsA" class="results"></div>
          </div>
        </div>
        
        <div class="user">
          <h2>Usuario B</h2>
          <div>
            <p>1. Obtiene el mismo informe (ETag: <code id="etagB">${etag}</code>)</p>
            <pre id="reportB">${JSON.stringify(report, null, 2)}</pre>
            <button onclick="updateUserB()">Actualizar CO₂ a 1580 toneladas</button>
            <div id="resultsB" class="results"></div>
          </div>
        </div>
      </div>
      
      <div class="actions">
        <h3>Simular escenario:</h3>
        <button onclick="simulateWithoutConcurrencyControl()">Sin Control de Concurrencia</button>
        <button onclick="simulateWithConcurrencyControl()">Con Control de Concurrencia (ETags)</button>
        <button onclick="resetSimulation()">Reiniciar Simulación</button>
      </div>
      
      <script>
        // Variables para seguimiento
        let useConcurrencyControl = false;
        let userAUpdated = false;
        let etagA = "${etag}";
        let etagB = "${etag}";
        
        // Función para actualizar desde Usuario A
        async function updateUserA() {
          const reportId = 1;
          const endpoint = useConcurrencyControl ? '/api/reports-safe/' : '/api/reports/';
          const headers = {
            'Content-Type': 'application/json'
          };
          
          // Agregar ETag si estamos usando control de concurrencia
          if (useConcurrencyControl) {
            headers['If-Match'] = etagA;
          }
          
          try {
            const response = await fetch(endpoint + reportId, {
              method: 'PUT',
              headers: headers,
              body: JSON.stringify({ co2_total: 1650 })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              document.getElementById('resultsA').innerHTML = '<p class="success">✅ Actualización exitosa</p>';
              document.getElementById('reportA').textContent = JSON.stringify(data, null, 2);
              
              // Actualizar ETag si estamos usando control de concurrencia
              if (useConcurrencyControl) {
                etagA = response.headers.get('ETag');
                document.getElementById('etagA').textContent = etagA;
              }
              
              userAUpdated = true;
            } else {
              document.getElementById('resultsA').innerHTML = 
                '<p class="error">❌ Error: ' + data.message + '</p>';
            }
          } catch (error) {
            document.getElementById('resultsA').innerHTML = 
              '<p class="error">❌ Error de red: ' + error.message + '</p>';
          }
        }
        
        // Función para actualizar desde Usuario B
        async function updateUserB() {
          const reportId = 1;
          const endpoint = useConcurrencyControl ? '/api/reports-safe/' : '/api/reports/';
          const headers = {
            'Content-Type': 'application/json'
          };
          
          // Agregar ETag si estamos usando control de concurrencia
          if (useConcurrencyControl) {
            headers['If-Match'] = etagB;
          }
          
          try {
            const response = await fetch(endpoint + reportId, {
              method: 'PUT',
              headers: headers,
              body: JSON.stringify({ co2_total: 1580 })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              document.getElementById('resultsB').innerHTML = '<p class="success">✅ Actualización exitosa</p>';
              document.getElementById('reportB').textContent = JSON.stringify(data, null, 2);
              
              // Verificar si hubo conflicto
              if (userAUpdated && !useConcurrencyControl) {
                document.getElementById('resultsB').innerHTML += 
                  '<p class="error">⚠️ ¡PROBLEMA DE CONCURRENCIA! Los cambios del Usuario A fueron sobrescritos sin advertencia.</p>';
              }
              
              // Actualizar ETag si estamos usando control de concurrencia
              if (useConcurrencyControl) {
                etagB = response.headers.get('ETag');
                document.getElementById('etagB').textContent = etagB;
              }
            } else {
              document.getElementById('resultsB').innerHTML = 
                '<p class="error">❌ Error: ' + data.message + '</p>' +
                '<p>Este error es ESPERADO cuando se usa control de concurrencia y otro usuario ha modificado el recurso.</p>';
            }
          } catch (error) {
            document.getElementById('resultsB').innerHTML = 
              '<p class="error">❌ Error de red: ' + error.message + '</p>';
          }
        }
        
        // Configurar simulación sin control de concurrencia
        function simulateWithoutConcurrencyControl() {
          resetSimulation();
          useConcurrencyControl = false;
          document.body.classList.remove('with-concurrency');
          document.body.classList.add('without-concurrency');
          alert('Simulación SIN control de concurrencia configurada. Sigue estos pasos:\n\n1. Usuario A: Actualiza CO₂ a 1650\n2. Usuario B: Actualiza CO₂ a 1580\n\nVerás que la segunda actualización sobreescribe la primera sin advertencia.');
        }
        
        // Configurar simulación con control de concurrencia
        function simulateWithConcurrencyControl() {
          resetSimulation();
          useConcurrencyControl = true;
          document.body.classList.remove('without-concurrency');
          document.body.classList.add('with-concurrency');
          alert('Simulación CON control de concurrencia configurada. Sigue estos pasos:\n\n1. Usuario A: Actualiza CO₂ a 1650\n2. Usuario B: Intenta actualizar CO₂ a 1580\n\nVerás que la segunda actualización es rechazada con un error de precondición fallida.');
        }
        
        // Reiniciar simulación
        async function resetSimulation() {
          // Reiniciar estado
          userAUpdated = false;
          
          // Obtener el informe actual
          const response = await fetch('/api/reports/1');
          const report = await response.json();
          const etag = useConcurrencyControl ? 
            (await fetch('/api/reports-safe/1')).headers.get('ETag') : "${etag}";
          
          // Actualizar UI
          document.getElementById('reportA').textContent = JSON.stringify(report, null, 2);
          document.getElementById('reportB').textContent = JSON.stringify(report, null, 2);
          document.getElementById('etagA').textContent = etag;
          document.getElementById('etagB').textContent = etag;
          document.getElementById('resultsA').innerHTML = '';
          document.getElementById('resultsB').innerHTML = '';
          
          // Actualizar variables
          etagA = etag;
          etagB = etag;
        }
      </script>
    </body>
    </html>
  `);
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
  console.log(
    `- Ver simulación visual de problemas de concurrencia: http://localhost:${PORT}/simular-conflicto`
  );
  console.log(
    `- API Sin control de concurrencia: GET/PUT http://localhost:${PORT}/api/reports/1`
  );
  console.log(
    `- API Con control de concurrencia: GET/PUT http://localhost:${PORT}/api/reports-safe/1`
  );
});

/*
DEMO DE USO:

1. Navegador: Abrir http://localhost:3000/simular-conflicto
   - Esta interfaz permite simular visualmente el problema de concurrencia

2. Alternativa usando herramientas como curl o Postman:

   SIN CONTROL DE CONCURRENCIA:
   - GET http://localhost:3000/api/reports/1
   - PUT http://localhost:3000/api/reports/1
     Body: { "co2_total": 1650 }
   
   CON CONTROL DE CONCURRENCIA:
   - GET http://localhost:3000/api/reports-safe/1
     (Observar el header ETag en la respuesta)
   - PUT http://localhost:3000/api/reports-safe/1
     Headers: If-Match: "el-etag-obtenido-previamente"
     Body: { "co2_total": 1650 }
*/
