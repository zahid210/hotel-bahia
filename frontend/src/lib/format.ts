export const formatFecha = (d: string, conDia = false) => {
    const [y, m, day] = d.split('-').map(Number)
    return new Date(y, m - 1, day).toLocaleDateString('es-PE', {
        weekday: conDia ? 'short' : undefined,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}