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
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=es`;
        const response = await fetch(weatherUrl);

        console.log("URL de la consulta:", weatherUrl);
        console.log("Respuesta del servidor:", response);

        if (!response.ok) {
            throw new Error("No se pudo obtener el clima");
        }

        const data = await response.json();

        document.getElementById('city-name').textContent = nombreCiudad;
        document.getElementById('temp-val').textContent = Math.round(data.main.temp);
        document.getElementById('weather-desc').textContent = data.weather[0].description;

        const iconCode = data.weather[0].icon;
        document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        divClima.classList.remove('hidden');

    } catch (error) {
        pError.textContent = error.message;
        pError.classList.remove('hidden');
    }
}