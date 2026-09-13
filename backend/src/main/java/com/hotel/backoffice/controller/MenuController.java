package com.hotel.backoffice.controller;

import com.hotel.backoffice.dto.request.MenuItemRequestDTO;
import com.hotel.backoffice.dto.response.MenuItemResponseDTO;
import com.hotel.backoffice.service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/menu")
@PreAuthorize("hasAnyRole('ADMIN', 'RECEPCIONISTA')")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService service;

    // Vista del menú (la usa el recepcionista para tomar pedidos)
    @GetMapping
    public ResponseEntity<List<MenuItemResponseDTO>> listar(
            @RequestParam(required = false, defaultValue = "false")
            boolean soloDisponibles) {
        return ResponseEntity.ok(service.listar(soloDisponibles));
    }

    // ── Escritura: solo ADMIN ────────────────────────────────
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public MenuItemResponseDTO crear(
            @Valid @RequestBody MenuItemRequestDTO dto) {
        return service.crear(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public MenuItemResponseDTO actualizar(
            @PathVariable Integer id,
            @Valid @RequestBody MenuItemRequestDTO dto) {
        return service.actualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id) {
        service.eliminar(id);
    }
}