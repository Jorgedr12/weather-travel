const inputCiudad = document.getElementById('city-input');
const botonBuscar = document.getElementById('search-btn');
const optionsContainer = document.getElementById('options-container');
const citiesList = document.getElementById('cities-list');
const pError = document.getElementById('p-error');

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
            console.log(`Ciudad elegida: ${lugar.name}`);
            console.log(`Latitud: ${lugar.lat}, Longitud: ${lugar.lon}`);
            
            alert(`Seleccionaste: ${nombreMostrar}\nCoordenadas: ${lugar.lat}, ${lugar.lon}`);
            
            optionsContainer.classList.add('hidden');
        };

        citiesList.appendChild(btn);
    });
}