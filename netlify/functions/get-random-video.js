// netlify/functions/get-random-video.js

exports.handler = async (event, context) => {
    console.log("INFO: La función 'get-random-video' ha comenzado.");

    // 1. Obtener las claves secretas de las variables de entorno de Netlify.
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;

    // Imprimir en el log si las variables se cargaron (sin mostrar la clave completa por seguridad).
    console.log(`INFO: Clave de API cargada: ${apiKey ? 'Sí' : 'No'}`);
    console.log(`INFO: ID del Canal cargado: ${channelId || 'No encontrado'}`);

    // Si faltan las variables, devuelve un error claro.
    if (!apiKey || !channelId) {
        console.error("ERROR: Faltan las variables de entorno YOUTUBE_API_KEY o YOUTUBE_CHANNEL_ID.");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error de configuración en el servidor. Faltan credenciales.' })
        };
    }

    // 2. Construir la URL para llamar a la API de YouTube.
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=50&type=video`;
    console.log(`INFO: Llamando a la API de YouTube...`);

    try {
        // 3. Llamar a la API de YouTube.
        const response = await fetch(apiUrl);
        const data = await response.json();
        console.log("INFO: Respuesta recibida de YouTube.");

        // Comprobar si la propia API de YouTube devolvió un error.
        if (data.error) {
            console.error("ERROR de la API de YouTube:", JSON.stringify(data.error, null, 2));
            return {
                statusCode: data.error.code || 500,
                body: JSON.stringify({ error: `Error de la API de YouTube: ${data.error.message}` })
            };
        }

        if (!data.items || data.items.length === 0) {
            console.warn("ADVERTENCIA: No se encontraron videos en el canal.");
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'No se encontraron videos en el canal especificado.' })
            };
        }

        // 4. Elegir un video al azar.
        const randomIndex = Math.floor(Math.random() * data.items.length);
        const randomVideo = data.items[randomIndex];
        console.log(`ÉXITO: Video aleatorio seleccionado: "${randomVideo.snippet.title}"`);

        // 5. Preparar y devolver los datos que el frontend necesita.
        const videoData = {
            videoId: randomVideo.id.videoId,
            title: randomVideo.snippet.title,
            description: randomVideo.snippet.description
        };

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(videoData)
        };

    } catch (error) {
        console.error("ERROR INESPERADO:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Ocurrió un error inesperado en el servidor.', details: error.message })
        };
    }
};
