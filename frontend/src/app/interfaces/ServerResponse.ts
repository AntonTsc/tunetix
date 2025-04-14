export default interface ServerResponse<T = any> {
    status: string; // Estado de la respuesta (e.g., "OK", "ERROR")
    message: string; // Mensaje descriptivo de la respuesta
    data?: T; // Datos específicos de la respuesta (genérico para flexibilidad)
}