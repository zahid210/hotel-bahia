package com.hotel.backoffice.controller;

import com.hotel.backoffice.dto.request.PasswordDTO;
import com.hotel.backoffice.dto.request.UsuarioRequestDTO;
import com.hotel.backoffice.dto.request.UsuarioUpdateDTO;
import com.hotel.backoffice.dto.response.UsuarioResponseDTO;
import com.hotel.backoffice.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

// ── Gestión de usuarios del hotel (solo ADMIN) ────────────────
@RestController
@RequestMapping("/api/v1/usuarios")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService service;

    @GetMapping
    public ResponseEntity<List<UsuarioResponseDTO>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponseDTO crear(@Valid @RequestBody UsuarioRequestDTO dto) {
        return service.crear(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> actualizar(
            @PathVariable UUID id,
            @Valid @RequestBody UsuarioUpdateDTO dto) {
        return ResponseEntity.ok(service.actualizar(id, dto));
    }

    @PatchMapping("/{id}/password")
    public ResponseEntity<UsuarioResponseDTO> resetPassword(
            @PathVariable UUID id,
            @Valid @RequestBody PasswordDTO dto) {
        return ResponseEntity.ok(service.resetPassword(id, dto));
    }
}