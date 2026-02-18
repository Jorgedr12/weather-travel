document.addEventListener('DOMContentLoaded', renderizarSidebar);

const inputCiudad = document.getElementById('city-input');
const botonBuscar = document.getElementById('search-btn');
const optionsContainer = document.getElementById('options-container');
const citiesList = document.getElementById('cities-list');
const pError = document.getElementById('p-error');
const divClima = document.getElementById('weather-info');
const btnFavorite = document.getElementById('btn-favorite');
const modalListas = document.getElementById('modal-listas');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');
const btnCloseModal = document.getElementById('btn-close-modal');
const listaFavoritos = document.getElementById('lista-favoritos');
const listaHistorial = document.getElementById('lista-historial');
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');

let ciudadActualObj = null;

apiKey = CONFIG.API_KEY;
let tiempoEspera;

botonBuscar.addEventListener('click', buscarCiudades);

inputCiudad.addEventListener('input', () => {
    clearTimeout(tiempoEspera);

    const ciudad = inputCiudad.value.trim();

    if (ciudad === "") {
        optionsContainer.classList.add('hidden');
        pError.classList.add('hidden');
        return;
    }

    if (ciudad.length < 3) {
        optionsContainer.classList.add('hidden');
        pError.textContent = "Ingresa al menos 3 caracteres para buscar.";
        pError.classList.remove('hidden');
        return;
    }

    const regex = /^[a-zA-Z\s]+$/;
    if (!regex.test(ciudad)) {
        optionsContainer.classList.add('hidden');
        pError.textContent = "Solo se permiten letras y espacios.";
        pError.classList.remove('hidden');
        return;
    }

    pError.classList.add('hidden');
    optionsContainer.classList.remove('hidden');
    citiesList.innerHTML = `
        <div class="p-4 text-center text-gray-500 text-sm">
            <span class="animate-pulse"> Buscando </span>
        </div>`;

    tiempoEspera = setTimeout(() => {
        buscarCiudades();
    }, 800);
});

inputCiudad.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
        clearTimeout(tiempoEspera);
        const ciudad = inputCiudad.value.trim();

        if (ciudad.length < 3) {
            pError.textContent = "Ingresa al menos 3 caracteres.";
            pError.classList.remove('hidden');
            optionsContainer.classList.add('hidden');
            return;
        }

        const regex = /^[a-zA-Z\s]+$/;
        if (!regex.test(ciudad)) {
            optionsContainer.classList.add('hidden');
            pError.textContent = "Solo se permiten letras y espacios.";
            pError.classList.remove('hidden');
            return;
        }

        optionsContainer.classList.add('hidden');

        try {
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${ciudad}&limit=1&appid=${apiKey}`;
            const response = await fetch(geoUrl);
            const ciudades = await response.json();

            if (ciudades.length > 0) {
                const lugar = ciudades[0];
                const nombreMostrar = `${lugar.name}${lugar.state ? ', ' + lugar.state : ''} (${lugar.country})`;

                inputCiudad.value = lugar.name;
                obtenerClima(lugar.lat, lugar.lon, nombreMostrar);
            } else {
                pError.textContent = "No se encontraron ciudades.";
                pError.classList.remove('hidden');
            }
        } catch (error) {
            if (!navigator.onLine) {
                pError.textContent = "No tienes conexión a internet.";
            } else {
                pError.textContent = "Ocurrió un error al buscar ciudades.";
            }
            console.error("Error al buscar por Enter:", error);
        }
    }
});

async function buscarCiudades() {
    const ciudad = inputCiudad.value.trim();

    if (ciudad.length < 3) {
        pError.textContent = "Ingresa al menos 3 caracteres.";
        pError.classList.remove('hidden');
        optionsContainer.classList.add('hidden');
        return;
    }

    try {
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${ciudad}&limit=5&appid=${apiKey}`;
        const response = await fetch(geoUrl);

        if (!response.ok) {
            throw new Error("Error en la respuesta del servidor");
        }

        const ciudades = await response.json();

        if (ciudades.length === 0) {
            optionsContainer.classList.remove('hidden');
            citiesList.innerHTML = `
                <div class="p-4 text-center text-gray-500 text-sm">
                    No hay ciudades que coincidan
                </div>`;
            return;
        }

        mostrarOpciones(ciudades);

    } catch (error) {
        if (!navigator.onLine) {
            pError.textContent = "No tienes conexión a internet.";
        } else {
            pError.textContent = "Ocurrió un error al buscar ciudades.";
        }
        pError.classList.remove('hidden');

        citiesList.innerHTML = `
            <div class="p-4 text-center text-red-500 text-sm">
                Error al buscar: ${error.message}
            </div>`;
    }
}


function mostrarOpciones(ciudades) {
    citiesList.innerHTML = "";
    optionsContainer.classList.remove('hidden');

    ciudades.forEach(lugar => {
        const btn = document.createElement('button');

        const nombreMostrar = `${lugar.name}${lugar.state ? ', ' + lugar.state : ''} (${lugar.country})`;

        btn.textContent = nombreMostrar;

        btn.style.display = "block";
        btn.style.margin = "5px 0";
        btn.style.cursor = "pointer";

        btn.onclick = () => {
            inputCiudad.value = lugar.name;
            optionsContainer.classList.add('hidden');
            obtenerClima(lugar.lat, lugar.lon, nombreMostrar);
        };

        citiesList.appendChild(btn);
    });
}

async function obtenerClima(lat, lon, nombreCiudad) {
    if (!navigator.onLine) {
        pError.textContent = "No tienes internet.";
        pError.classList.remove('hidden');
        return; 
    }

    console.log(navigator.onLine)

    try {
        pError.classList.add('hidden');
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=es`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=es`;

        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(currentUrl),
            fetch(forecastUrl)
        ]);

        if (!currentResponse.ok || !forecastResponse.ok) {
            pError.textContent = "No se pudo obtener la información del clima.";
            pError.classList.remove('hidden');
            throw new Error("No se pudo obtener la información del clima");
        }

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        ciudadActualObj = { name: nombreCiudad, lat: lat, lon: lon };
        guardarEnHistorial(nombreCiudad, lat, lon);

        actualizarBotonFavorito(nombreCiudad);

        document.getElementById('city-name').textContent = nombreCiudad;
        document.getElementById('temp-val').textContent = Math.round(currentData.main.temp);
        document.getElementById('weather-desc').textContent = currentData.weather[0].description;

        document.getElementById('humidity-val').textContent = `${currentData.main.humidity}%`;

        const velocidadkmh = (currentData.wind.speed * 3.6).toFixed(1);
        document.getElementById('wind-val').textContent = `${velocidadkmh} km/h`;

        const iconCode = currentData.weather[0].icon;
        document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

        mostrarPronostico(forecastData);

        divClima.classList.remove('hidden');

        const climaId = currentData.weather[0].id;
        generarRecomendacion(climaId, iconCode);

        divClima.classList.remove('hidden');

    } catch (error) {
        if (!navigator.onLine) {
            pError.textContent = "No tienes conexión a internet.";
        } else {
            pError.textContent = error.message;
        }

        pError.classList.remove('hidden');
    }
}

function mostrarPronostico(data) {
    const contenedor = document.getElementById('forecast-container');

    contenedor.innerHTML = "";
    contenedor.className = "flex flex-col w-full mt-6";

    let diasAgrupados = {};

    for (let i = 0; i < data.list.length; i++) {
        let item = data.list[i];
        let fecha = item.dt_txt.split(' ')[0];

        if (!diasAgrupados[fecha]) {
            diasAgrupados[fecha] = [];
        }
        diasAgrupados[fecha].push(item);
    }

    let fechas = Object.keys(diasAgrupados);

    let cantidadDias = fechas.length < 5 ? fechas.length : 5;

    let contenidoHTML = "";

    for (let i = 0; i < cantidadDias; i++) {
        let fechaActual = fechas[i];
        let datosDelDia = diasAgrupados[fechaActual];

        let maximo = -100;
        let minimo = 100;

        for (let j = 0; j < datosDelDia.length; j++) {
            let tempMaxActual = datosDelDia[j].main.temp_max;
            let tempMinActual = datosDelDia[j].main.temp_min;

            if (tempMaxActual > maximo) maximo = tempMaxActual;
            if (tempMinActual < minimo) minimo = tempMinActual;
        }

        let tempMax = Math.round(maximo);
        let tempMin = Math.round(minimo);

        let indiceMedio = Math.floor(datosDelDia.length / 2);
        let info = datosDelDia[indiceMedio];

        let fechaObj = new Date(info.dt * 1000);
        let diaSemana = fechaObj.toLocaleDateString('es-ES', { weekday: 'short' });
        let diaNumero = fechaObj.getDate();
        let fechaFormateada = `${diaSemana} ${diaNumero}`;

        let icono = info.weather[0].icon;
        let descripcion = info.weather[0].description;

        contenidoHTML += `
            <div class="grid grid-cols-3 sm:grid-cols-4 items-center py-4 border-b border-gray-100 px-4 hover:translate-x-2 transition-transform duration-300 ease-in-out cursor-default">
                <div class="text-gray-700 font-medium capitalize text-sm">
                    ${fechaFormateada}
                </div>

                <div class="flex items-center gap-1 text-sm">
                    <span class="font-bold text-gray-900">${tempMax}°</span>
                    <span class="text-gray-400">/</span>
                    <span class="text-gray-500">${tempMin}°</span>
                </div>

                <div class="flex items-center gap-2 justify-end sm:justify-center">
                    <img src="https://openweathermap.org/img/wn/${icono}.png" alt="icono" class="w-8 h-8">
                    <span class="text-gray-700 text-sm capitalize truncate hidden sm:block">${descripcion}</span>
                </div>

            </div>`;
    }

    contenedor.innerHTML = contenidoHTML;
    contenedor.classList.remove('hidden');
}

function generarRecomendacion(climaId, icono) {
    const recContainer = document.getElementById('recommendations');
    const recText = document.getElementById('rec-text');
    const esDeDia = icono.includes('d');
    const grupoClima = Math.floor(climaId / 100);

    console.log("Clima ID:", climaId, "Grupo:", grupoClima, "Es de día:", esDeDia);

    let recomendaciones = [];

    switch (grupoClima) {
        case 2:
            recomendaciones = esDeDia
                ? ["Refúgiate en interiores", "Evita áreas abiertas"]
                : ["Quédate en casa/hotel", "Cena en el interior"];
            break;
        case 3:
        case 5:
            recomendaciones = esDeDia
                ? ["Usa paraguas", "Museos o cines", "Ropa impermeable"]
                : ["Noche de descanso", "Evita conducir"];
            break;
        case 6:
            recomendaciones = esDeDia
                ? ["Ropa térmica", "Paseo con cuidado", "Bebidas calientes"]
                : ["Mantente abrigado", "Cena caliente", "Evita el exterior"];
            break;
        case 7:
            recomendaciones = ["Baja visibilidad", "Conduce con precaución", "Usa luces altas"];
            break;
        case 8:
            recomendaciones = esDeDia
                ? ["Actividades al aire libre", "Caminata o parque"]
                : ["Cena en terraza", "Observar estrellas", "Paseo nocturno"];

            break;
        default:
            recomendaciones = ["Disfruta el dia sin importar el clima"];
    }

    recText.innerHTML = recomendaciones.map(rec => `<p class="flex items-center gap-2">• ${rec}</p>`).join('');
    recContainer.classList.remove('hidden');
}

function renderizarSidebar() {
    const favs = JSON.parse(localStorage.getItem('weather_favorites')) || [];
    const hist = JSON.parse(localStorage.getItem('weather_history')) || [];

    if (favs.length === 0) {
        listaFavoritos.innerHTML = '<li class="text-xs text-gray-400 px-2 italic hidden lg:block">Sin favoritos</li>';
    } else {
        listaFavoritos.innerHTML = favs.map(c => `
            <li>
                <button onclick="cargarCiudad('${c.name}', ${c.lat}, ${c.lon})" 
                        class="w-full text-left flex items-center px-2 py-2 text-sm text-gray-700 rounded-lg transition-all duration-200 hover:bg-blue-50 active:scale-95 ">
                    <span class="truncate">${c.name}</span>
                </button>
            </li>
        `).join('');
    }

    if (hist.length === 0) {
        listaHistorial.innerHTML = '<li class="text-xs text-gray-400 px-2 italic hidden lg:block">Vacío</li>';
    } else {
        listaHistorial.innerHTML = hist.slice(0, 5).map(c => `  <li>
                <button onclick="cargarCiudad('${c.name}', ${c.lat}, ${c.lon})" 
                        class="w-full text-left flex items-center px-2 py-2 text-sm text-gray-700 rounded-lg transition-all duration-200 hover:bg-blue-50 active:scale-95">
                    <span class="truncate">${c.name}</span>
                </button>
            </li>
        `).join('');
    }
}

window.cargarCiudad = (nombre, lat, lon) => {
    inputCiudad.value = nombre;
    obtenerClima(lat, lon, nombre);
};

function guardarEnHistorial(nombre, lat, lon) {
    let historial = JSON.parse(localStorage.getItem('weather_history')) || [];

    historial = historial.filter(item => item.name !== nombre);
    historial.unshift({ name: nombre, lat, lon });

    localStorage.setItem('weather_history', JSON.stringify(historial.slice(0, 10)));

    renderizarSidebar();
}

btnFavorite.addEventListener('click', () => {
    if (!ciudadActualObj) return;

    let favs = JSON.parse(localStorage.getItem('weather_favorites')) || [];
    const index = favs.findIndex(c => c.name === ciudadActualObj.name);

    if (index === -1) {
        favs.push(ciudadActualObj);
        actualizarEstiloBotonFavorito(true);
    } else {
        favs.splice(index, 1);
        actualizarEstiloBotonFavorito(false);
    }

    localStorage.setItem('weather_favorites', JSON.stringify(favs));
    renderizarSidebar();
});

function actualizarBotonFavorito(nombre) {
    const favs = JSON.parse(localStorage.getItem('weather_favorites')) || [];
    const esFavorito = favs.some(c => c.name === nombre);
    actualizarEstiloBotonFavorito(esFavorito);
}

function actualizarEstiloBotonFavorito(esFavorito) {
    btnFavorite.classList.remove('hidden');
    if (esFavorito) {
        btnFavorite.classList.add('text-red-500');
        btnFavorite.classList.remove('text-gray-400');
    } else {
        btnFavorite.classList.add('text-gray-400');
        btnFavorite.classList.remove('text-red-500');
    }
}

function toggleMenu() {
    const estaCerrado = sidebar.classList.contains('-translate-x-full');

    if (estaCerrado) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
}

if (menuBtn) menuBtn.addEventListener('click', toggleMenu);
if (overlay) overlay.addEventListener('click', toggleMenu);

const funcionOriginalCargarCiudad = window.cargarCiudad;

window.cargarCiudad = (nombre, lat, lon) => {
    funcionOriginalCargarCiudad(nombre, lat, lon);

    if (window.innerWidth < 1024) {
        toggleMenu();
    }
};