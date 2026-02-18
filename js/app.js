const inputCiudad = document.getElementById('city-input');
const botonBuscar = document.getElementById('search-btn');
const optionsContainer = document.getElementById('options-container');
const citiesList = document.getElementById('cities-list');
const pError = document.getElementById('p-error');
const divClima = document.getElementById('weather-info');


apiKey = CONFIG.API_KEY;
let tiempoEspera;

botonBuscar.addEventListener('click', buscarCiudades);

inputCiudad.addEventListener('input', () => {
    clearTimeout(tiempoEspera);

    const ciudad = inputCiudad.value.trim();

    if (ciudad.length < 3) {
        optionsContainer.classList.add('hidden');
        return;
    }
    tiempoEspera = setTimeout(() => {
        buscarCiudades();
    }, 800);
});

async function buscarCiudades() {
    const ciudad = inputCiudad.value.trim();

    if (ciudad.length < 3) {
        pError.textContent = "Por favor, ingresa al menos 3 caracteres para buscar.";
        pError.classList.remove('hidden');
        optionsContainer.classList.add('hidden');
        return;
    }

    if (!ciudad) {
        pError.textContent = "Por favor, ingresa el nombre de una ciudad.";
        pError.classList.remove('hidden');
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
            optionsContainer.classList.add('hidden');
            return;
        }

        mostrarOpciones(ciudades);

    } catch (error) {
        pError.textContent = error.message;
        pError.classList.remove('hidden');
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
        pError.textContent = error.message;
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
            <div class="flex items-center justify-between py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors px-2">
                
                <div class="w-16 text-gray-700 font-medium capitalize text-sm">
                    ${fechaFormateada}
                </div>

                <div class="flex items-center gap-1 w-20 text-sm">
                    <span class="font-bold text-gray-900">${tempMax}°</span>
                    <span class="text-gray-400">/</span>
                    <span class="text-gray-500">${tempMin}°</span>
                </div>

                <div class="flex items-center gap-2 flex-1 min-w-0">
                    <img src="https://openweathermap.org/img/wn/${icono}.png" alt="icono" class="w-8 h-8">
                    <span class="text-gray-700 text-sm capitalize truncate hidden sm:block">${descripcion}</span>
                </div>

            </div>`;
    }

    // Insertamos todo el HTML generado al final
    contenedor.innerHTML = contenidoHTML;
    contenedor.classList.remove('hidden');
}

function generarRecomendacion(climaId, icono) {
    const recContainer = document.getElementById('recommendations');
    const recText = document.getElementById('rec-text');

    const esDeDia = icono.includes('d'); 
    
    let recomendaciones = [];

    if (climaId >= 200 && climaId < 300) {
        // Tormenta
        recomendaciones = ["Tormenta eléctrica", "Desconecta aparatos", "Evita ventanas"];
        
    } else if (climaId >= 300 && climaId < 600) {
        // Lluvia
        recomendaciones = ["Pavimento resbaladizo", "Lleva paraguas", esDeDia ? "Tráfico lento" : "Usa luces altas"];

    } else if (climaId >= 600 && climaId < 700) {
        // Nieve
        recomendaciones = ["Nieve", "Abrigo térmico", esDeDia ? "Gafas de sol (reflejo)" : "Extrema precaución al manejar"];

    } else if (climaId >= 700 && climaId < 800) {
        // Neblina
        recomendaciones = ["Neblina", "Luces antiniebla", esDeDia ? "Conduce despacio" : "Hazte visible al cruzar"];

    } else if (climaId === 800) {
        // Cielo despejado
        if (esDeDia) {
            recomendaciones = ["Cielo despejado", "Usa bloqueador solar", "Gafas de sol"];
        } else {
            recomendaciones = ["Noche despejada", "Suéter ligero", "Buen momento para ver estrellas"];
        }

    } else if (climaId > 800 && climaId < 900) {
        // Nubes
        if (esDeDia) {
            recomendaciones = ["Nublado", "Clima agradable", "Ideal para caminar"];
        } else {
            recomendaciones = ["Noche nublada", "Posible humedad", "Lleva una chaqueta"];
        }

    } else {
        recomendaciones = ["Clima desconocido"];
    }

    recText.innerHTML = recomendaciones.map(rec => `<p class="flex items-center gap-2">• ${rec}</p>`).join('');
    recContainer.classList.remove('hidden');
}