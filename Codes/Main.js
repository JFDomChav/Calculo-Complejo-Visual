document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('main section');
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    const dropdownMenus = document.querySelectorAll('.dropdown-menu');

    // --- Lógica de los menús desplegables ---
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const menu = toggle.nextElementSibling;
            const isExpanded = menu.classList.contains('hidden');
            
            // Ocultar todos los menús
            dropdownMenus.forEach(m => { 
                m.classList.add('hidden');
                m.previousElementSibling.setAttribute('aria-expanded', 'false');
            });

            // Mostrar/ocultar el menú actual
            if (isExpanded) {
                menu.classList.remove('hidden');
                toggle.setAttribute('aria-expanded', 'true');
            } else {
                menu.classList.add('hidden');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Ocultar menús al hacer clic fuera
    window.addEventListener('click', () => {
        dropdownMenus.forEach(menu => {
            menu.classList.add('hidden');
            menu.previousElementSibling.setAttribute('aria-expanded', 'false');
        });
    });

    // --- Resaltado de la sección activa en la navegación ---
    const observer = new IntersectionObserver((entries) => {
        let currentActiveId = null;
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                currentActiveId = entry.target.id;
            }
        });

        document.querySelectorAll('#top-nav a, #top-nav button').forEach(link => {
            link.classList.remove('active-nav');
        });
        
        if (currentActiveId) {
            const activeLink = document.querySelector(`#top-nav a[href="#${currentActiveId}"]`);
            if(activeLink) {
                const parentDropdownButton = activeLink.closest('.dropdown')?.querySelector('.dropdown-toggle');
                if (parentDropdownButton) {
                    parentDropdownButton.classList.add('active-nav');
                } else {
                    activeLink.classList.add('active-nav');
                }
            } else if (currentActiveId === 'gemini-assistants') {
                document.querySelector('#top-nav a[href="#gemini-assistants"]').classList.add('active-nav');
            }
        }
    }, { rootMargin: '-40% 0px -60% 0px', threshold: 0.1 });

    sections.forEach(section => {
        observer.observe(section);
    });
    
    // --- Integración con la API de Gemini (Sin cambios) ---
    const analyzeBtn = document.getElementById('analyze-btn');
    const functionInput = document.getElementById('function-input');
    const analysisResult = document.getElementById('analysis-result');
    
    const discussBtn = document.getElementById('discuss-btn');
    const conceptInput = document.getElementById('concept-input');
    const discussionResult = document.getElementById('discussion-result');

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=`;

    async function callGemini(prompt, element) {
        element.innerHTML = '<div class="flex justify-center items-center"><div class="loader"></div></div>';
        
        try {
            const payload = { contents: [{ parts: [{ text: prompt }] }] };
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (text) {
                    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
                html = html.replace(/\n/g, '<br>');
                element.innerHTML = html;
                if (window.MathJax) {
                    MathJax.typesetPromise([element]).catch((err) => console.log('MathJax error:', err));
                }
            } else {
                element.textContent = "No se pudo obtener una respuesta. Intenta de nuevo.";
            }
        } catch (error) {
        console.error('Gemini API Error:', error);
        element.textContent = "Ocurrió un error al contactar la IA.";
    }
}

analyzeBtn.addEventListener('click', () => {
    const functionString = functionInput.value.trim();
    if (!functionString) {
        analysisResult.innerHTML = '<p class="text-red-500">Por favor, ingresa una función.</p>';
        return;
    }
    const prompt = `Actúa como un experto en análisis complejo. Analiza la función f(z) = ${functionString}. Tu respuesta debe ser concisa y cumplir dos puntos clave:
1. Proporciona un resumen del análisis de Cauchy-Riemann (partes u y v, derivadas parciales y dónde es analítica).
2. Compara de forma clara y breve la diferencia fundamental en el comportamiento de esta función en el plano complejo versus la recta real.
    Usa notación LaTeX para todas las matemáticas.`;
    callGemini(prompt, analysisResult);
});

discussBtn.addEventListener('click', () => {
    const userIdea = conceptInput.value.trim();
    if (!userIdea) {
        discussionResult.innerHTML = '<p class="text-red-500">Por favor, ingresa tu idea o pregunta.</p>';
        return;
    }
    const prompt = `Actúa como un tutor de matemáticas con "tacto" y experto en análisis complejo. La siguiente es la interpretación de un estudiante sobre un concepto. Tu tarea es responder de forma muy concisa.
- Si la interpretación es correcta, felicítalo brevemente y reafirma la idea.
- Si la interpretación es mayormente correcta pero tiene un pequeño error, empieza diciendo "Tu intuición es muy buena, pero..." y corrige sutilmente el detalle incorrecto.
- Si la interpretación es incorrecta, empieza diciendo "Esa es una perspectiva interesante. Veamoslo de esta otra manera para aclarar algunos puntos..." y luego explica el concepto correctamente de forma sencilla.
- Mantén la respuesta breve y al punto. Usa notación LaTeX para las matemáticas.

    Interpretación del estudiante: "${userIdea}"`;
    callGemini(prompt, discussionResult);
});
});