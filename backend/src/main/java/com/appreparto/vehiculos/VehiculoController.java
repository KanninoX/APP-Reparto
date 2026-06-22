package com.appreparto.vehiculos;

import com.appreparto.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehiculos")
@RequiredArgsConstructor
public class VehiculoController {

    private final VehiculoService vehiculoService;

    @GetMapping
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<List<Vehiculo>>> listar(
            @RequestParam(defaultValue = "false") boolean todos) {
        List<Vehiculo> lista = todos ? vehiculoService.listarTodos() : vehiculoService.listarActivos();
        return ResponseEntity.ok(ApiResponse.ok(lista));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<Vehiculo>> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(vehiculoService.buscarPorId(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Vehiculo>> crear(@RequestBody Vehiculo vehiculo) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Vehículo creado", vehiculoService.crear(vehiculo)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Vehiculo>> actualizar(@PathVariable Long id,
                                                             @RequestBody Vehiculo vehiculo) {
        return ResponseEntity.ok(ApiResponse.ok(vehiculoService.actualizar(id, vehiculo)));
    }

    @PatchMapping("/{id}/activo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Vehiculo>> cambiarActivo(@PathVariable Long id,
                                                                @RequestParam boolean activo) {
        return ResponseEntity.ok(ApiResponse.ok(vehiculoService.cambiarActivo(id, activo)));
    }
}
