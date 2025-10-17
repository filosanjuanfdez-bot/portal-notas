// script.js
// Lógica del portal de notas.

/**
 * Convierte una cadena a su hash SHA‑256.
 * @param {string} texto Cadena a hashear
 * @returns {Promise<string>} Hash en formato hexadecimal
 */
async function calcularHash(texto) {
  const encoder = new TextEncoder();
  const data = encoder.encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Carga la lista de clases desde data/classes.json
 */
function cargarClases() {
  fetch('data/classes.json')
    .then((res) => {
      if (!res.ok) throw new Error('No se pudo cargar el listado de clases');
      return res.json();
    })
    .then((datos) => {
      const select = document.getElementById('classSelect');
      datos.classes.forEach((clase) => {
        const option = document.createElement('option');
        option.value = clase.file;
        option.textContent = clase.name;
        select.appendChild(option);
      });
    })
    .catch((err) => {
      console.error(err);
      alert('Error al cargar las clases: ' + err.message);
    });
}

/**
 * Procesa el formulario cuando el alumno quiere ver sus notas.
 * Busca al estudiante por hash y muestra sus calificaciones.
 * @param {Event} event
 */
async function procesarFormulario(event) {
  event.preventDefault();
  const claseArchivo = document.getElementById('classSelect').value;
  const contrasena = document.getElementById('passwordInput').value;
  const resultadoDiv = document.getElementById('result');
  resultadoDiv.innerHTML = '';

  if (!claseArchivo || !contrasena) {
    resultadoDiv.textContent = 'Debes seleccionar una clase e introducir tu contraseña.';
    return;
  }

  // Calcula el hash de la contraseña del alumno
  let hash;
  try {
    hash = await calcularHash(contrasena);
  } catch (e) {
    console.error(e);
    resultadoDiv.textContent = 'Error al calcular el hash de la contraseña.';
    return;
  }

  // Carga el archivo de la clase
  fetch('data/' + claseArchivo)
    .then((res) => {
      if (!res.ok) throw new Error('No se pudo cargar el archivo de la clase');
      return res.json();
    })
    .then((datos) => {
      const estudiante = datos.students.find((s) => s.passwordHash === hash);
      if (estudiante) {
        let html = `<h2>Notas de ${estudiante.name}</h2>`;
        html += '<ul>';
        // Recorre cada calificación
        Object.entries(estudiante.grades).forEach(([actividad, nota]) => {
          html += `<li><strong>${actividad}:</strong> ${nota}</li>`;
        });
        html += '</ul>';
        resultadoDiv.innerHTML = html;
      } else {
        resultadoDiv.textContent = 'Contraseña incorrecta o estudiante no encontrado.';
      }
    })
    .catch((err) => {
      console.error(err);
      resultadoDiv.textContent = 'Error al cargar los datos de la clase: ' + err.message;
    });
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  cargarClases();
  document.getElementById('loginForm').addEventListener('submit', procesarFormulario);
});
