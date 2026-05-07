import { functions } from '../../firebase-config.js';
import { httpsCallable } from 'firebase/functions';

export const WeatherService = {

    async getWeather(icao) {
        const fn = httpsCallable(functions, "getWeather");
        const result = await fn({ icao });
        return result.data;
    }
};