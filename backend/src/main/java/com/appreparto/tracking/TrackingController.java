package com.appreparto.tracking;

import com.appreparto.common.dto.ApiResponse;
import com.appreparto.vehiculos.VehiculoService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class TrackingController {

    private final TrackingService trackingService;
    private final VehiculoService vehiculoService;

    // El operario publica su posición desde la app móvil → /app/tracking
    // El backend persiste y hace broadcast a /topic/tracking/{vehiculoId}
    @MessageMapping("/tracking")
    public void recibirPosicion(PosicionMessage mensaje) {
        TrackingGps punto = TrackingGps.builder()
                .vehiculo(vehiculoService.buscarPorId(mensaje.getVehiculoId()))
                .latitud(mensaje.getLatitud())
                .longitud(mensaje.getLongitud())
                .velocidadKmh(mensaje.getVelocidadKmh())
                .build();
        trackingService.guardarYBroadcast(punto);
    }

    @Data
    public static class PosicionMessage {
        private Long vehiculoId;
        private Double latitud;
        private Double longitud;
        private Double velocidadKmh;
    }
}

@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
class TrackingRestController {

    private final TrackingService trackingService;

    @GetMapping("/vehiculo/{vehiculoId}")
    @PreAuthorize("hasAnyRole('EJECUTIVO','ADMIN')")
    public ResponseEntity<ApiResponse<List<TrackingGps>>> historialVehiculo(@PathVariable Long vehiculoId) {
        return ResponseEntity.ok(ApiResponse.ok(trackingService.historialVehiculo(vehiculoId)));
    }
}
