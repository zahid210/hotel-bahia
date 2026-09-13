package com.hotel.backoffice.controller;

import com.hotel.backoffice.dto.request.PedidoEstadoDTO;
import com.hotel.backoffice.dto.request.PedidoRequestDTO;
import com.hotel.backoffice.dto.response.PedidoResponseDTO;
import com.hotel.backoffice.service.PedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/pedidos")
@PreAuthorize("hasAnyRole('ADMIN', 'RECEPCIONISTA')")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService service;

    @GetMapping
    public ResponseEntity<List<PedidoResponseDTO>> listar(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) UUID   reservaId) {
        return ResponseEntity.ok(service.listar(estado, reservaId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PedidoResponseDTO> obtener(@PathVariable UUID id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PedidoResponseDTO crear(@Valid @RequestBody PedidoRequestDTO dto) {
        return service.crear(dto);
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<PedidoResponseDTO> cambiarEstado(
            @PathVariable UUID id,
            @Valid @RequestBody PedidoEstadoDTO dto) {
        return ResponseEntity.ok(service.cambiarEstado(id, dto.estado()));
    }
}