// Códigos de error parseables del flujo de bloqueos, en archivo propio
// (NO "use server") para que pueda ser importado tanto desde la server
// action como desde el componente cliente. Next.js prohibe exportar
// constantes desde archivos "use server" — solo permite funciones async.

/** Prefijo del mensaje de error cuando un bloqueo se solapa con reservas
 * activas. La UI lo parsea para mostrar un diálogo de confirmación con la
 * cantidad de reservas afectadas en vez de un error plano. */
export const ERROR_BLOQUEO_CONFLICTO = "BLOQUEO_TIENE_RESERVAS"
