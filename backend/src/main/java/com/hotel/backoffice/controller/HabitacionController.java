package com.hotel.backoffice.controller;

import com.hotel.backoffice.dto.response.HabitacionResponseDTO;
import com.hotel.backoffice.service.HabitacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/habitaciones")
@PreAuthorize("hasAnyRole('ADMIN', 'RECEPCIONISTA', 'LIMPIEZA')")
@RequiredArgsConstructor
public class HabitacionController {

    private final HabitacionService service;

    @GetMapping
    public ResponseEntity<List<HabitacionResponseDTO>> listar() {
        return ResponseEntity.ok(service.listarTodas());
    }

    @GetMapping("/libres")
    public ResponseEntity<List<HabitacionResponseDTO>> listarLibres() {
        return ResponseEntity.ok(service.listarLibres());
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<HabitacionResponseDTO> cambiarEstado(
            @PathVariable Integer id,
            @RequestParam String estado) {
        return ResponseEntity.ok(service.cambiarEstado(id, estado));
    }
}