package com.hotel.backoffice.service;

import com.hotel.backoffice.dto.request.MenuItemRequestDTO;
import com.hotel.backoffice.dto.response.MenuItemResponseDTO;
import com.hotel.backoffice.entity.MenuItem;
import com.hotel.backoffice.exception.ResourceNotFoundException;
import com.hotel.backoffice.repository.MenuItemRepository;
import com.hotel.backoffice.repository.PedidoItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MenuService {

    private final MenuItemRepository    menuRepo;
    private final PedidoItemRepository  pedidoItemRepo;

    // ── Listar ───────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MenuItemResponseDTO> listar(boolean soloDisponibles) {
        List<MenuItem> items = soloDisponibles
                ? menuRepo.findByDisponibleTrueOrderByCategoriaAscNombreAsc()
                : menuRepo.findAllByOrderByCategoriaAscNombreAsc();
        return items.stream().map(MenuItemResponseDTO::from).toList();
    }

    // ── Crear ────────────────────────────────────────────────
    public MenuItemResponseDTO crear(MenuItemRequestDTO dto) {
        validar(dto);
        MenuItem item = MenuItem.builder()
                .nombre(dto.nombre().trim())
                .descripcion(dto.descripcion() != null ? dto.descripcion().trim() : null)
                .categoria(dto.categoria().trim())
                .precio(dto.precio())
                .disponible(dto.disponible() != null ? dto.disponible() : true)
                .build();
        return MenuItemResponseDTO.from(menuRepo.save(item));
    }

    // ── Actualizar ───────────────────────────────────────────
    public MenuItemResponseDTO actualizar(Integer id, MenuItemRequestDTO dto) {
        validar(dto);
        MenuItem item = menuRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Plato no encontrado en el menú: " + id));
        item.setNombre(dto.nombre().trim());
        item.setDescripcion(dto.descripcion() != null ? dto.descripcion().trim() : null);
        item.setCategoria(dto.categoria().trim());
        item.setPrecio(dto.precio());
        if (dto.disponible() != null) {
            item.setDisponible(dto.disponible());
        }
        return MenuItemResponseDTO.from(menuRepo.save(item));
    }

    // ── Eliminar ─────────────────────────────────────────────
    // Si el plato ya se usó en algún pedido se "desactiva" (disponible=false)
    // en lugar de borrarse, para no romper el histórico; si no tiene pedidos
    // asociados se elimina por completo.
    public void eliminar(Integer id) {
        MenuItem item = menuRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Plato no encontrado en el menú: " + id));
        if (pedidoItemRepo.existsByMenuItemId(id)) {
            item.setDisponible(false);
            menuRepo.save(item);
        } else {
            menuRepo.delete(item);
        }
    }

    private void validar(MenuItemRequestDTO dto) {
        if (dto.nombre() == null || dto.nombre().isBlank()) {
            throw new IllegalArgumentException("El nombre del plato es obligatorio.");
        }
        if (dto.categoria() == null || dto.categoria().isBlank()) {
            throw new IllegalArgumentException("La categoría es obligatoria.");
        }
        if (dto.precio() == null || dto.precio().signum() <= 0) {
            throw new IllegalArgumentException("El precio debe ser mayor que cero.");
        }
    }
}