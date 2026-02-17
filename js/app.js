const inputCiudad = document.getElementById('city-input');
const botonBuscar = document.getElementById('search-btn');
const optionsContainer = document.getElementById('options-container');
const citiesList = document.getElementById('cities-list');
const pError = document.getElementById('p-error');
const divClima = document.getElementById('weather-info');


apiKey = CONFIG.API_KEY;

botonBuscar.addEventListener('click', buscarCiudades);

async function buscarCiudades() {
    const ciudad = inputCiudad.value.trim();

    if (!ciudad) {
        pError.textContent = "Por favor, ingresa el nombre de una ciudad.";
        pError.classList.remove('hidden');
        return;
    }

    try {
        pError.classList.add('hidden');
        optionsContainer.classList.add('hidden');
        divClima.classList.add('hidden');
        citiesList.innerHTML = "";

        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${ciudad}&limit=5&appid=${apiKey}`;

        const response = await fetch(geoUrl);

        if (!response.ok) {
            throw new Error("Error en la respuesta del servidor");
        }

        const ciudades = await response.json();

        if (ciudades.length === 0) {
            throw new Error("No se encontraron ciudades con ese nombre");
        }

        mostrarOpciones(ciudades);

    } catch (error) {
        pError.textContent = error.message;
        pError.classList.remove('hidden');
    }
}

function mostrarOpciones(ciudades) {
    optionsContainer.classList.remove('hidden');

    ciudades.forEach(lugar => {
        const btn = document.createElement('button');

        const nombreMostrar = `${lugar.name}${lugar.state ? ', ' + lugar.state : ''} (${lugar.country})`;

        btn.textContent = nombreMostrar;

        btn.style.display = "block";
        btn.style.margin = "5px 0";
        btn.style.cursor = "pointer";

        btn.onclick = () => {
            optionsContainer.classList.add('hidden');
            obtenerClima(lugar.lat, lugar.lon, nombreMostrar);
        };

        citiesList.appendChild(btn);
    });
}

async function obtenerClima(lat, lon, nombreCiudad) {
    try {
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=es`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=es`;

        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(currentUrl),
            fetch(forecastUrl)
        ]);

        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error("No se pudo obtener la información del clima");
        }

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        document.getElementById('city-name').textContent = nombreCiudad;
        document.getElementById('temp-val').textContent = Math.round(currentData.main.temp);
        document.getElementById('weather-desc').textContent = currentData.weather[0].description;

        const iconCode = currentData.weather[0].icon;
        document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        mostrarPronostico(forecastData);

        divClima.classList.remove('hidden');

    } catch (error) {
        pError.textContent = error.message;
        pError.classList.remove('hidden');
    }
}

function mostrarPronostico(data) {
    const contenedor = document.getElementById('forecast-container');
    
    const listaReducida = data.list.filter(item => item.dt_txt.includes("12:00:00"));

    let contenidoHTML = "";

    listaReducida.forEach(dia => {
        const fecha = new Date(dia.dt * 1000).toLocaleDateString('es-ES', { weekday: 'short' });
        const temp = Math.round(dia.main.temp);
        const icono = dia.weather[0].icon;

        contenidoHTML += `
            <div class="forecast-card">
                <p>${fecha}</p>
                <img src="https://openweathermap.org/img/wn/${icono}.png">
                <p>${temp}°C</p>
            </div>`;
    });

    contenedor.innerHTML = contenidoHTML;
    contenedor.classList.remove('hidden');
}