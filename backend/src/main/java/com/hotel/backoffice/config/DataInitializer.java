package com.hotel.backoffice.config;

import com.hotel.backoffice.entity.Habitacion;
import com.hotel.backoffice.entity.Habitacion.*;
import com.hotel.backoffice.entity.Usuario;
import com.hotel.backoffice.repository.HabitacionRepository;
import com.hotel.backoffice.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@Profile({"local", "docker"})
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final HabitacionRepository habitRepo;
    private final UsuarioRepository    usuarioRepo;
    private final PasswordEncoder      encoder;

    @Override
    public void run(String... args) {

        if (habitRepo.count() == 0) {
            habitRepo.saveAll(List.of(

                    // ── Piso 1 ───────────────────────────────────────
                    hab("101", 1, TipoHabitacion.SIMPLE,   2,  80.00),
                    hab("102", 1, TipoHabitacion.SIMPLE,   2,  80.00),
                    hab("103", 1, TipoHabitacion.DOBLE,    4, 120.00),
                    hab("104", 1, TipoHabitacion.DOBLE,    4, 120.00),
                    hab("105", 1, TipoHabitacion.FAMILIAR, 6, 180.00),
                    hab("106", 1, TipoHabitacion.SIMPLE,   2,  80.00),
                    hab("107", 1, TipoHabitacion.DOBLE,    4, 120.00),
                    hab("108", 1, TipoHabitacion.SUITE,    2, 250.00),
                    hab("109", 1, TipoHabitacion.FAMILIAR, 6, 180.00),
                    hab("110", 1, TipoHabitacion.SIMPLE,   2,  80.00),

                    // ── Piso 2 ───────────────────────────────────────
                    hab("201", 2, TipoHabitacion.SUITE,    2, 250.00),
                    hab("202", 2, TipoHabitacion.SIMPLE,   2,  80.00),
                    hab("203", 2, TipoHabitacion.DOBLE,    4, 120.00),
                    hab("204", 2, TipoHabitacion.FAMILIAR, 6, 180.00),
                    hab("205", 2, TipoHabitacion.DOBLE,    4, 120.00),
                    hab("206", 2, TipoHabitacion.SIMPLE,   2,  80.00),
                    hab("207", 2, TipoHabitacion.SUITE,    2, 250.00),
                    hab("208", 2, TipoHabitacion.DOBLE,    4, 120.00),
                    hab("209", 2, TipoHabitacion.FAMILIAR, 6, 180.00),
                    hab("210", 2, TipoHabitacion.SIMPLE,   2,  80.00),

                    // ── Piso 3 ───────────────────────────────────────
                    hab("301", 3, TipoHabitacion.SUITE,    2, 250.00),
                    hab("302", 3, TipoHabitacion.SIMPLE,   2,  80.00),
                    hab("303", 3, TipoHabitacion.DOBLE,    4, 120.00),
                    hab("304", 3, TipoHabitacion.FAMILIAR, 6, 180.00),
                    hab("305", 3, TipoHabitacion.SIMPLE,   2,  80.00),
                    hab("306", 3, TipoHabitacion.DOBLE,    4, 120.00),
                    hab("307", 3, TipoHabitacion.SUITE,    2, 250.00),
                    hab("308", 3, TipoHabitacion.SIMPLE,   2,  80.00),
                    hab("309", 3, TipoHabitacion.FAMILIAR, 6, 180.00),
                    hab("310", 3, TipoHabitacion.DOBLE,    4, 120.00),

                    // ── Piso 4 ───────────────────────────────────────
                    hab("401", 4, TipoHabitacion.SIMPLE,   2,  80.00),
                    hab("402", 4, TipoHabitacion.SIMPLE,   2,  80.00),
                    hab("403", 4, TipoHabitacion.DOBLE,    4, 120.00),
                    hab("404", 4, TipoHabitacion.DOBLE,    4, 120.00),
                    hab("405", 4, TipoHabitacion.FAMILIAR, 6, 180.00),
                    hab("406", 4, TipoHabitacion.SUITE,    2, 250.00),
                    hab("407", 4, TipoHabitacion.SIMPLE,   2,  80.00),
                    hab("408", 4, TipoHabitacion.DOBLE,    4, 120.00),
                    hab("409", 4, TipoHabitacion.FAMILIAR, 6, 180.00),
                    hab("410", 4, TipoHabitacion.SUITE,    2, 250.00),

                    // ── Piso 5 ───────────────────────────────────────
                    hab("501", 5, TipoHabitacion.SUITE,    2, 280.00), // Precio premium por altura
                    hab("502", 5, TipoHabitacion.SUITE,    2, 280.00),
                    hab("503", 5, TipoHabitacion.FAMILIAR, 6, 200.00),
                    hab("504", 5, TipoHabitacion.FAMILIAR, 6, 200.00),
                    hab("505", 5, TipoHabitacion.DOBLE,    4, 140.00),
                    hab("506", 5, TipoHabitacion.DOBLE,    4, 140.00),
                    hab("507", 5, TipoHabitacion.SIMPLE,   2,  90.00),
                    hab("508", 5, TipoHabitacion.SIMPLE,   2,  90.00),
                    hab("509", 5, TipoHabitacion.SUITE,    2, 280.00),
                    hab("510", 5, TipoHabitacion.SUITE,    2, 280.00)
            ));
        }

        if (usuarioRepo.count() == 0) {
            usuarioRepo.save(Usuario.builder()
                    .nombre("Zahid Matos")
                    .email("zahidmatos@hotel.com")
                    .password(encoder.encode("hotel_bahia"))
                    .rol(Usuario.Rol.ADMIN)
                    .activo(true)
                    .build());
        }
    }

    // Sin parámetro de estado — todas arrancan en LIBRE por defecto
    private Habitacion hab(String num, int piso, TipoHabitacion tipo,
                           int cap, double precio) {
        return Habitacion.builder()
                .numero(num).piso(piso).tipo(tipo).capacidad(cap)
                .precioNoche(BigDecimal.valueOf(precio))
                .estado(EstadoHabitacion.LIBRE)
                .build();
    }
}