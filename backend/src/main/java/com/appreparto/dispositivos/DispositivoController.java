package com.appreparto.dispositivos;

import com.appreparto.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dispositivos")
@RequiredArgsConstructor
public class DispositivoController {

    private final DispositivoService dispositivoService;

    @GetMapping("/pendientes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Dispositivo>>> pendientes() {
        return ResponseEntity.ok(ApiResponse.ok(dispositivoService.listarPendientes()));
    }

    @PostMapping("/{id}/autorizar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Dispositivo>> autorizar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(dispositivoService.autorizar(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> rechazar(@PathVariable Long id) {
        dispositivoService.rechazar(id);
        return ResponseEntity.ok(ApiResponse.ok("Dispositivo rechazado", null));
    }
}
