package com.hotel.backoffice.config;

import com.hotel.backoffice.entity.Habitacion;
import com.hotel.backoffice.entity.Habitacion.*;
import com.hotel.backoffice.entity.MenuItem;
import com.hotel.backoffice.entity.Usuario;
import com.hotel.backoffice.repository.HabitacionRepository;
import com.hotel.backoffice.repository.MenuItemRepository;
import com.hotel.backoffice.repository.PedidoItemRepository;
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
    private final PedidoItemRepository pedidoItemRepo;
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

        // ── Menú de bocaditos (snacks/cuartos/galletas/gaseosas) ─────
        // Idempotente: si ya existe algún bocadito (categorías nuevas),
        // se asume el menú actualizado y no se toca nada.
        // Cuando se detecta el menú viejo de comidas (Desayuno/Almuerzo/Cena),
        // se reemplaza retirando los ítems no usados y deshabilitando los que
        // ya figuran en pedidos (FK de historial), como hace MenuService.
        List<String> categoriasBocadito = List.of("SNACKS", "GALLETAS",
                "DULCES", "GASEOSAS", "BEBIDAS");
        boolean yaMigrado = menuRepo.count() > 0 && menuRepo.findAll().stream()
                .anyMatch(m -> categoriasBocadito.contains(m.getCategoria()));

        if (!yaMigrado) {
            int eliminados = 0, deshabilitados = 0;
            for (MenuItem m : menuRepo.findAll()) {
                if (pedidoItemRepo.existsByMenuItemId(m.getId())) {
                    m.setDisponible(false);
                    menuRepo.save(m);
                    deshabilitados++;
                } else {
                    menuRepo.delete(m);
                    eliminados++;
                }
            }
            if (eliminados + deshabilitados > 0) {
                log.info("Menú migrado comidas → bocaditos: "
                        + "{} retirados, {} deshabilitados por historial.",
                        eliminados, deshabilitados);
            }
            menuRepo.saveAll(menuBocaditos());
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

    // Bocaditos del menú (snacks, cuates, galletas, dulces, gaseosas, bebidas)
    private List<MenuItem> menuBocaditos() {
        return List.of(
                // ── Snacks (bocaditos salados) ────────────────
                bocadito("Cuates", "Bolsa 100 g", "SNACKS", 3.50),
                bocadito("Chizitos", "Bolsa 100 g", "SNACKS", 2.50),
                bocadito("Papitas fritas", "Bolsa 150 g", "SNACKS", 5.00),
                bocadito("Gusanitos", "Bolsa 100 g", "SNACKS", 2.50),
                bocadito("Canchita serrana", "Bolsa 120 g", "SNACKS", 4.00),
                bocadito("Maní confitado", "Bolsa 150 g", "SNACKS", 3.00),

                // ── Galletas ───────────────────────────────────
                bocadito("Galleta soda", "Paquete 2 unidades", "GALLETAS", 1.50),
                bocadito("Galleta vainilla", "Paquete 2 unidades", "GALLETAS", 2.00),
                bocadito("Galleta rellena de cacao", "Paquete 2 unidades", "GALLETAS", 2.50),
                bocadito("Galleta con mermelada", "Paquete 2 unidades", "GALLETAS", 2.00),
                bocadito("Galleta integral", "Paquete 2 unidades", "GALLETAS", 2.00),

                // ── Dulces ─────────────────────────────────────
                bocadito("Chocolate oscuro", "Barra 50 g", "DULCES", 3.50),
                bocadito("Caramelos surtidos", "Frasco 30 g", "DULCES", 2.00),
                bocadito("Chupetines", "Unidad", "DULCES", 1.00),
                bocadito("Chocotejas", "Unidad", "DULCES", 3.00),
                bocadito("Toffee", "Bolsa 50 g", "DULCES", 1.50),

                // ── Gaseosas ───────────────────────────────────
                bocadito("Inca Kola personal", "Botella 500 ml fría", "GASEOSAS", 4.00),
                bocadito("Coca-Cola personal", "Botella 500 ml fría", "GASEOSAS", 4.00),
                bocadito("Sprite personal", "Botella 500 ml fría", "GASEOSAS", 4.00),
                bocadito("Kola Real personal", "Botella 500 ml fría", "GASEOSAS", 3.50),
                bocadito("Guaraná personal", "Botella 500 ml fría", "GASEOSAS", 3.50),

                // ── Otras bebidas ──────────────────────────────
                bocadito("Agua mineral", "Botella 625 ml fría", "BEBIDAS", 2.50),
                bocadito("Jugo de naranja", "Vaso 350 ml", "BEBIDAS", 5.00),
                bocadito("Gatorade", "Botella 500 ml fría", "BEBIDAS", 7.00),
                bocadito("Café instantáneo", "Taza con azúcar a elección", "BEBIDAS", 3.00),
                bocadito("Agua de cebada", "Vaso 350 ml", "BEBIDAS", 2.00)
        );
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

    // Bocadito del menú inicial (snacks, galletas, dulces, gaseosas, bebidas)
    private MenuItem bocadito(String nombre, String descripcion, String categoria, double precio) {
        return MenuItem.builder()
                .nombre(nombre)
                .descripcion(descripcion)
                .categoria(categoria)
                .precio(BigDecimal.valueOf(precio))
                .disponible(true)
                .build();
    }
}