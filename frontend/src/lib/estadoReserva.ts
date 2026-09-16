export const ESTADO_CFG = {
    PENDIENTE:  { label: 'Pendiente',  cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    CONFIRMADA: { label: 'Confirmada', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
    CHECKIN:    { label: 'En hotel',   cls: 'bg-red-50    text-red-700    border-red-200'    },
    CHECKOUT:   { label: 'Salida',     cls: 'bg-gray-50   text-gray-500   border-gray-200'   },
    CANCELADA:  { label: 'Cancelada',  cls: 'bg-gray-50   text-gray-400   border-gray-200'   },
} as const