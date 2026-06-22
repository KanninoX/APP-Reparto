package com.appreparto.notificaciones;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {

    private final SnsClient snsClient;

    public void enviar(String telefono, String mensaje) {
        try {
            snsClient.publish(PublishRequest.builder()
                    .phoneNumber(telefono)
                    .message(mensaje)
                    .build());
            log.info("SMS enviado a {}", telefono);
        } catch (Exception e) {
            log.error("Error al enviar SMS a {}: {}", telefono, e.getMessage());
        }
    }
}
