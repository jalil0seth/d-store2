import axios from 'axios';

class PocketBaseService {
    private static instance: PocketBaseService;
    private baseURL: string;

    private constructor() {
        this.baseURL = '/api';
    }

    public static getInstance(): PocketBaseService {
        if (!PocketBaseService.instance) {
            PocketBaseService.instance = new PocketBaseService();
        }
        return PocketBaseService.instance;
    }

    async get(endpoint: string) {
        try {
            const response = await axios.get(`${this.baseURL}/${endpoint}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    async post(endpoint: string, data: any) {
        try {
            const response = await axios.post(`${this.baseURL}/${endpoint}`, data);
            return response.data;
        } catch (error) {
            console.error('Error posting data:', error);
            throw error;
        }
    }

    async put(endpoint: string, data: any) {
        try {
            const response = await axios.put(`${this.baseURL}/${endpoint}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating data:', error);
            throw error;
        }
    }

    async delete(endpoint: string) {
        try {
            const response = await axios.delete(`${this.baseURL}/${endpoint}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting data:', error);
            throw error;
        }
    }
}

export { PocketBaseService };
