// Definición de áreas y preguntas
const CATEGORIES = [
  {
    id: "marketing",
    name: "Marketing y Ventas",
    description: "Visibilidad, atracción y conversión de clientes.",
    questions: [
      "Tenemos claro quién es nuestro cliente ideal.",
      "Generamos prospectos de forma constante (leads).",
      "Tenemos un proceso definido para convertir prospectos en clientes."
    ]
  },
  {
    id: "finanzas",
    name: "Finanzas",
    description: "Control de ingresos, gastos y rentabilidad.",
    questions: [
      "Conozco con claridad mis números (ingresos, gastos, utilidades).",
      "Tenemos presupuesto y lo revisamos periódicamente.",
      "Sabemos qué productos o servicios son más rentables."
    ]
  },
  {
    id: "operaciones",
    name: "Operaciones",
    description: "Entrega, calidad y consistencia del servicio.",
    questions: [
      "Tenemos procesos documentados para las tareas clave.",
      "Podemos entregar consistentemente sin depender de una sola persona.",
      "Los clientes reciben lo prometido en tiempo y forma."
    ]
  },
  {
    id: "liderazgo",
    name: "Liderazgo y Equipo",
    description: "Personas, coordinación y cultura.",
    questions: [
      "Las responsabilidades del equipo están claras.",
      "Damos retroalimentación y seguimiento de forma regular.",
      "Hay buen clima y comunicación dentro del equipo."
    ]
  },
  {
    id: "sistemas",
    name: "Sistemas y Tecnología",
    description: "Herramientas, automatización y datos.",
    questions: [
      "Usamos herramientas digitales para trabajar de forma más eficiente.",
      "Guardamos la información importante de forma organizada.",
      "Tenemos indicadores (KPIs) para tomar decisiones."
    ]
  }
];

const STORAGE_KEY = "consultorNegociosRespuestasV1";
const LAST_SAVED_KEY = "consultorNegociosLastSaved";

const questionsContainer = document.getElementById("questions-container");
const calculateBtn = document.getElementById("calculate-btn");
const resetBtn = document.getElementById("reset-btn");
const resultsSection = document.getElementById("results");
const categoryResultsEl = document.getElementById("category-results");
const overallTextEl = document.getElementById("overall-text");
const lastSavedEl = document.getElementById("last-saved");

// --- Utils de fecha ---
function formatDateTime(d) {
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// --- Cargar / Guardar respuestas ---
function loadAnswers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn("No se pudieron cargar las respuestas, reseteando.");
    return {};
  }
}

function saveAnswers(answers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  const now = new Date();
  localStorage.setItem(LAST_SAVED_KEY, now.toISOString());
  updateLastSaved();
}

function updateLastSaved() {
  const raw = localStorage.getItem(LAST_SAVED_KEY);
  if (!raw) {
    lastSavedEl.textContent = "Aún no guardas un diagnóstico.";
    return;
  }
  const d = new Date(raw);
  lastSavedEl.textContent = "Última actualización: " + formatDateTime(d);
}

// --- Render de preguntas ---
function renderQuestions(answers) {
  questionsContainer.innerHTML = "";

  CATEGORIES.forEach((cat) => {
    const block = document.createElement("section");
    block.className = "category-block";

    const title = document.createElement("h2");
    title.className = "category-title";
    title.textContent = cat.name;

    const desc = document.createElement("p");
    desc.className = "category-description";
    desc.textContent = cat.description;

    block.appendChild(title);
    block.appendChild(desc);

    cat.questions.forEach((qText, index) => {
      const qId = `${cat.id}-${index}`;

      const row = document.createElement("div");
      row.className = "question-row";

      const label = document.createElement("div");
      label.className = "question-text";
      label.textContent = qText;

      const inputRow = document.createElement("div");
      inputRow.className = "question-input-row";

      const input = document.createElement("input");
      input.type = "range";
      input.min = "1";
      input.max = "5";
      input.step = "1";
      input.value = answers[qId] || "3";
      input.dataset.qid = qId;

      const valueLabel = document.createElement("span");
      valueLabel.className = "question-value";
      valueLabel.textContent = input.value;

      input.addEventListener("input", () => {
        valueLabel.textContent = input.value;
        answers[qId] = Number(input.value);
        saveAnswers(answers);
      });

      inputRow.appendChild(input);
      inputRow.appendChild(valueLabel);

      row.appendChild(label);
      row.appendChild(inputRow);

      block.appendChild(row);
    });

    questionsContainer.appendChild(block);
  });
}

// --- Cálculo de resultados ---
function calculateResults(answers) {
  const categoryScores = [];

  CATEGORIES.forEach((cat) => {
    let sum = 0;
    let count = 0;

    cat.questions.forEach((_, index) => {
      const qId = `${cat.id}-${index}`;
      const value = answers[qId];
      if (typeof value === "number") {
        sum += value;
        count += 1;
      }
    });

    const avg = count > 0 ? sum / count : 0;
    categoryScores.push({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      average: avg
    });
  });

  return categoryScores;
}

function getLevel(avg) {
  if (avg >= 4.2) return "strong";
  if (avg >= 2.8) return "medium";
  return "weak";
}

function getAdvice(level) {
  switch (level) {
    case "strong":
      return "Fortaleza actual. Mantén y documenta lo que funciona.";
    case "medium":
      return "Zona de mejora. Pequeños ajustes aquí pueden tener gran impacto.";
    case "weak":
      return "Área crítica. Requiere foco y decisiones estratégicas pronto.";
    default:
      return "";
  }
}

function renderResults(categoryScores) {
  resultsSection.classList.remove("hidden");
  categoryResultsEl.innerHTML = "";

  const validScores = categoryScores.filter((c) => c.average > 0);
  if (validScores.length === 0) {
    overallTextEl.textContent = "Responde al menos algunas preguntas para ver tu diagnóstico.";
    return;
  }

  const overallAvg =
    validScores.reduce((acc, c) => acc + c.average, 0) / validScores.length;

  let overallMsg = "";
  if (overallAvg >= 4.2) {
    overallMsg = "Tu negocio muestra una base sólida. Estás en fase de optimización y crecimiento.";
  } else if (overallAvg >= 2.8) {
    overallMsg =
      "Tu negocio tiene elementos funcionando, pero hay áreas que requieren claridad y enfoque.";
  } else {
    overallMsg =
      "Tu negocio está en fase frágil. Prioriza las áreas con puntuación más baja para estabilizar.";
  }
  overallMsg += ` (Promedio general: ${overallAvg.toFixed(1)} / 5)`;
  overallTextEl.textContent = overallMsg;

  // Ordenar por promedio ascendente para mostrar primero las áreas más débiles
  validScores.sort((a, b) => a.average - b.average);

  validScores.forEach((cat) => {
    const level = getLevel(cat.average);
    const advice = getAdvice(level);

    const card = document.createElement("div");
    card.className = `category-result-card level-${level}`;

    const info = document.createElement("div");
    info.className = "category-info";

    const nameEl = document.createElement("div");
    nameEl.className = "category-name";
    nameEl.textContent = cat.name;

    const advEl = document.createElement("div");
    advEl.className = "category-advice";
    advEl.textContent = advice;

    info.appendChild(nameEl);
    info.appendChild(advEl);

    const badge = document.createElement("div");
    badge.className = "badge-score";
    badge.textContent = `${cat.average.toFixed(1)} / 5`;

    card.appendChild(info);
    card.appendChild(badge);

    categoryResultsEl.appendChild(card);
  });
}

// --- Reset ---
function resetAll() {
  if (!confirm("¿Seguro que quieres resetear todas las respuestas?")) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LAST_SAVED_KEY);
  const answers = {};
  renderQuestions(answers);
  resultsSection.classList.add("hidden");
  updateLastSaved();
}

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  const answers = loadAnswers();
  renderQuestions(answers);
  updateLastSaved();

  calculateBtn.addEventListener("click", () => {
    const scores = calculateResults(answers);
    renderResults(scores);
  });

  resetBtn.addEventListener("click", resetAll);
});
