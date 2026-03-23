package com.hotel.backoffice.controller;

import com.hotel.backoffice.dto.response.ReporteDTO.ReporteCompleto;
import com.hotel.backoffice.service.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService service;

    // ── Reporte por rango de fechas ───────────────────────────
    // GET /api/v1/reportes?inicio=2026-03-01&fin=2026-03-31
    @GetMapping
    public ResponseEntity<ReporteCompleto> reporte(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate inicio,

            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fin) {
        return ResponseEntity.ok(service.generarReporte(inicio, fin));
    }

    // ── Atajos de períodos comunes ────────────────────────────
    @GetMapping("/hoy")
    public ResponseEntity<ReporteCompleto> hoy() {
        LocalDate hoy = LocalDate.now();
        return ResponseEntity.ok(service.generarReporte(hoy, hoy));
    }

    @GetMapping("/semana")
    public ResponseEntity<ReporteCompleto> semanaActual() {
        LocalDate hoy   = LocalDate.now();
        LocalDate inicio = hoy.with(
                java.time.DayOfWeek.MONDAY);
        return ResponseEntity.ok(service.generarReporte(inicio, hoy));
    }

    @GetMapping("/mes")
    public ResponseEntity<ReporteCompleto> mesActual() {
        LocalDate hoy   = LocalDate.now();
        LocalDate inicio = hoy.withDayOfMonth(1);
        return ResponseEntity.ok(service.generarReporte(inicio, hoy));
    }
}