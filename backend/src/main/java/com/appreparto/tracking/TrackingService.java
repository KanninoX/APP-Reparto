package com.appreparto.tracking;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TrackingService {

    private final TrackingRepository trackingRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public TrackingGps guardarYBroadcast(TrackingGps punto) {
        TrackingGps guardado = trackingRepository.save(punto);
        messagingTemplate.convertAndSend(
                "/topic/tracking/" + punto.getVehiculo().getId(), guardado);
        return guardado;
    }

    public java.util.List<TrackingGps> historialVehiculo(Long vehiculoId) {
        return trackingRepository.findByVehiculoIdOrderByTimestampDesc(vehiculoId);
    }
}
