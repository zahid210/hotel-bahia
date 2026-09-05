package com.hotel.backoffice;

import com.hotel.backoffice.entity.Habitacion;
import com.hotel.backoffice.entity.Reserva;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReservaLogicaTest {

    private static final LocalDate ENTRADA = LocalDate.of(2026, 3, 12);
    private static final LocalDate SALIDA  = LocalDate.of(2026, 3, 13);

    private Reserva reserva(LocalTime horaEntrada, LocalTime horaSalida) {
        return Reserva.builder()
                .habitacion(Habitacion.builder()
                        .precioNoche(BigDecimal.valueOf(100))
                        .build())
                .fechaEntrada(ENTRADA)
                .fechaSalida(SALIDA)
                .horaEntradaAcordada(horaEntrada)
                .horaSalidaAcordada(horaSalida)
                .build();
    }

    private Reserva reservaConCheckout(LocalDateTime checkout) {
        Reserva reserva = Reserva.builder()
                .habitacion(Habitacion.builder()
                        .precioNoche(BigDecimal.valueOf(100))
                        .build())
                .fechaEntrada(LocalDate.of(2026, 3, 14))
                .fechaSalida(LocalDate.of(2026, 3, 16))
                .horaEntradaAcordada(LocalTime.of(15, 0))
                .horaSalidaAcordada(LocalTime.of(12, 0))
                .build();
        reserva.calcularCargoLateCheckout(checkout);
        return reserva;
    }

    @Test
    void horarioEstandarCuentaUnaNoche() {
        Reserva reserva = reserva(LocalTime.of(15, 0), LocalTime.of(12, 0));
        assertEquals(1, reserva.calcularNochesFacturables());
        assertEquals(new BigDecimal("100.00"), reserva.calcularTotalEstancia());
    }

    @Test
    void masDeVeinticuatroHorasCuentaDosNoches() {
        Reserva reserva = reserva(LocalTime.of(7, 0), LocalTime.of(20, 0));
        assertEquals(2, reserva.calcularNochesFacturables());
    }

    @Test
    void pocasHorasNuncaCobranMenosDeUnaNoche() {
        Reserva reserva = reserva(LocalTime.of(20, 0), LocalTime.of(12, 0));
        assertEquals(1, reserva.calcularNochesFacturables());
    }

    @Test
    void checkoutAntesDeMedianocheNoGeneraCargo() {
        Reserva reserva = reservaConCheckout(LocalDate.of(2026, 3, 16).atTime(11, 30));
        assertEquals(0, reserva.getHorasExtra());
        assertEquals(BigDecimal.ZERO, reserva.getCargoHorasExtra());
    }

    @Test
    void checkoutPasadaLaMedianocheGeneraUnaNoche() {
        Reserva reserva = reservaConCheckout(LocalDate.of(2026, 3, 17).atTime(2, 0));
        assertEquals(1, reserva.getHorasExtra());
        assertEquals(new BigDecimal("100.00"), reserva.getCargoHorasExtra());
    }

    @Test
    void checkoutExactoEnMedianocheCuentaUnaNoche() {
        Reserva reserva = reservaConCheckout(LocalDate.of(2026, 3, 17).atStartOfDay());
        assertEquals(1, reserva.getHorasExtra());
        assertEquals(new BigDecimal("100.00"), reserva.getCargoHorasExtra());
    }

    @Test
    void dosDiasExtraGeneranDosNoches() {
        Reserva reserva = reservaConCheckout(LocalDate.of(2026, 3, 18).atTime(10, 0));
        assertEquals(2, reserva.getHorasExtra());
        assertEquals(new BigDecimal("200.00"), reserva.getCargoHorasExtra());
    }

    @Test
    void totalEstanciaIncluyeCargoExtra() {
        Reserva reserva = reservaConCheckout(LocalDate.of(2026, 3, 17).atTime(2, 0));
        // 2 noches originales (14 → 16) + 1 noche extra
        assertEquals(new BigDecimal("300.00"), reserva.calcularTotalEstancia());
    }
}