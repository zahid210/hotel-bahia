package com.hotel.backoffice.config;

import com.hotel.backoffice.entity.Habitacion;
import com.hotel.backoffice.entity.Habitacion.*;
import com.hotel.backoffice.entity.MenuItem;
import com.hotel.backoffice.entity.Usuario;
import com.hotel.backoffice.repository.HabitacionRepository;
import com.hotel.backoffice.repository.MenuItemRepository;
import com.hotel.backoffice.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@Profile({"local", "docker"})
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

private final HabitacionRepository habitRepo;
    private final UsuarioRepository    usuarioRepo;
    private final MenuItemRepository  menuRepo;
    private final PasswordEncoder     encoder;

    @Value("${app.admin.email:zahidmatos@hotel.com}")   private String adminEmail;
    @Value("${app.admin.nombre:Zahid Matos}")           private String adminNombre;
    @Value("${app.admin.password:}")                    private String adminPassword;

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

        if (menuRepo.count() == 0) {
            menuRepo.saveAll(List.of(
                    // ── Desayunos ──────────────────────────────
                    plato("Desayuno continental", "Pan, mantequilla, café o té y jugo", "Desayuno", 10.00),
                    plato("Desayuno americano", "Huevos fritos/revueltos, pan, jamón y café", "Desayuno", 15.00),
                    plato("Desayuno con frutas", "Porción de frutas de estación con yogurt", "Desayuno", 12.00),

                    // ── Almuerzos / Cenas ──────────────────────
                    plato("Lomo saltado", "Porción de lomo, arroz y papas fritas", "Almuerzo", 25.00),
                    plato("Ceviche de pescado", "Pescado fresco con limón y camote", "Almuerzo", 28.00),
                    plato("Aji de gallina", "Pollo deshilachado con arroz y papa", "Almuerzo", 22.00),
                    plato("Pollo a la brasa + papas", "Con ensalada y gaseosa personal", "Almuerzo", 24.00),
                    plato("Arroz con mariscos", "Arroz con mariscos salteados", "Almuerzo", 30.00),
                    plato("Milanesa de pollo", "Con arroz, papa frita y ensalada", "Cena", 22.00),
                    plato("Tortilla de verduras", "Con arroz y ensalada", "Cena", 18.00),

                    // ── Bebidas ────────────────────────────────
                    plato("Gaseosa personal", "Inca Kola, Coca-Cola o Sprite", "Bebidas", 4.00),
                    plato("Agua mineral", "Botella 625 ml", "Bebidas", 3.00),
                    plato("Jugo natural", "Papaya, maracuyá, piña o naranja", "Bebidas", 8.00),
                    plato("Café", "Café pasado o instantáneo", "Bebidas", 4.00),
                    plato("Té", "Manzanilla, hierba luisa o cedrón", "Bebidas", 3.00),

                    // ── Snacks ─────────────────────────────────
                    plato("Sándwich simple", "Jamón o queso, opción tostado", "Snacks", 12.00),
                    plato("Porción de papas fritas", "Con salsas", "Snacks", 8.00),
                    plato("Fruta de estación", "2 unidades o porción", "Snacks", 5.00)
            ));
        }

        if (usuarioRepo.count() == 0) {
            if (adminPassword == null || adminPassword.isBlank()) {
                log.warn("No se creó el usuario administrador inicial: "
                        + "define APP_ADMIN_PASSWORD (perfil local/docker).");
            } else {
                usuarioRepo.save(Usuario.builder()
                        .nombre(adminNombre)
                        .email(adminEmail)
                        .password(encoder.encode(adminPassword))
                        .rol(Usuario.Rol.ADMIN)
                        .activo(true)
                        .build());
            }
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

    // Plato del menú inicial
    private MenuItem plato(String nombre, String descripcion, String categoria, double precio) {
        return MenuItem.builder()
                .nombre(nombre)
                .descripcion(descripcion)
                .categoria(categoria)
                .precio(BigDecimal.valueOf(precio))
                .disponible(true)
                .build();
    }
}