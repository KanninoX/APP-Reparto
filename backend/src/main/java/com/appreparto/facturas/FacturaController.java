package com.appreparto.facturas;

import com.appreparto.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/facturas")
@RequiredArgsConstructor
public class FacturaController {

    private final FacturaService facturaService;

    @GetMapping
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<List<Factura>>> listar(
            @RequestParam(required = false) Factura.Estado estado) {
        List<Factura> lista = estado != null
                ? facturaService.listarPorEstado(estado)
                : facturaService.listarTodas();
        return ResponseEntity.ok(ApiResponse.ok(lista));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<Factura>> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(facturaService.buscarPorId(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<Factura>> crear(@RequestBody Factura factura) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Factura creada", facturaService.crear(factura)));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<Factura>> cambiarEstado(@PathVariable Long id,
                                                               @RequestParam Factura.Estado estado) {
        return ResponseEntity.ok(ApiResponse.ok(facturaService.cambiarEstado(id, estado)));
    }

    @PostMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<Factura>> subirPdf(@PathVariable Long id,
                                                          @RequestParam MultipartFile pdf) {
        return ResponseEntity.ok(ApiResponse.ok("PDF subido", facturaService.subirPdf(id, pdf)));
    }
}
