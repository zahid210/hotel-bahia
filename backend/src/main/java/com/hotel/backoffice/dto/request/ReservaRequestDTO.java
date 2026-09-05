package com.hotel.backoffice.dto.request;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalTime;

public record ReservaRequestDTO(

        @NotNull(message = "La habitación es obligatoria")
        Integer habitacionId,

        @NotBlank(message = "El nombre del huésped es obligatorio")
        String nombreHuesped,

        @NotBlank(message = "El apellido del huésped es obligatorio")
        String apellidoHuesped,

        @NotBlank(message = "El tipo de documento es obligatorio")
        @Pattern(regexp = "DNI|PASAPORTE|CE",
                 message = "El tipo de documento debe ser DNI, PASAPORTE o CE")
        String tipoDocumento,

        @NotBlank(message = "El número de documento es obligatorio")
        String nroDocumento,

        @NotNull(message = "La fecha de entrada es obligatoria")
        LocalDate fechaEntrada,

        @NotNull(message = "La fecha de salida es obligatoria")
        LocalDate fechaSalida,

        // ── Horas acordadas — ahora vienen del formulario ────────
        // Si el recepcionista no las especifica, el servicio aplica
        // los defaults del hotel (15:00 entrada / 12:00 salida)
        LocalTime horaEntradaAcordada,    // nullable → default 15:00
        LocalTime horaSalidaAcordada,     // nullable → default 12:00

        @NotNull(message = "El número de huéspedes es obligatorio")
        @Min(value = 1,  message = "Debe haber al menos 1 huésped")
        @Max(value = 10, message = "Máximo 10 huéspedes")
        Short numHuespedes,

        String notas
) {}