package com.hotel.backoffice.controller;

import com.hotel.backoffice.dto.request.ReservaRequestDTO;
import com.hotel.backoffice.dto.response.ReservaResponseDTO;
import com.hotel.backoffice.service.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaService service;

    // AHORA acepta ?estado=CONFIRMADA, etc.
    @GetMapping
    public ResponseEntity<List<ReservaResponseDTO>> listar(
            @RequestParam(required = false) String estado) {
        if (estado != null && !estado.isBlank()) {
            return ResponseEntity.ok(service.listarPorEstado(estado));
        }
        return ResponseEntity.ok(service.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservaResponseDTO> obtener(@PathVariable UUID id) {
        return ResponseEntity.ok(service.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<ReservaResponseDTO> crear(
            @Valid @RequestBody ReservaRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crearReserva(dto));
    }

    @PatchMapping("/{id}/checkin")
    public ResponseEntity<ReservaResponseDTO> checkIn(@PathVariable UUID id) {
        return ResponseEntity.ok(service.realizarCheckIn(id));
    }

    @PatchMapping("/{id}/checkout")
    public ResponseEntity<ReservaResponseDTO> checkOut(@PathVariable UUID id) {
        return ResponseEntity.ok(service.realizarCheckOut(id));
    }

    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<ReservaResponseDTO> cancelar(@PathVariable UUID id) {
        return ResponseEntity.ok(service.cancelarReserva(id));
    }
}