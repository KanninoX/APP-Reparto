package com.appreparto.notificaciones;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final SesClient sesClient;

    @Value("${aws.ses.from-email}")
    private String fromEmail;

    public void enviar(String destinatario, String asunto, String cuerpo) {
        try {
            sesClient.sendEmail(SendEmailRequest.builder()
                    .source(fromEmail)
                    .destination(Destination.builder().toAddresses(destinatario).build())
                    .message(Message.builder()
                            .subject(Content.builder().data(asunto).charset("UTF-8").build())
                            .body(Body.builder()
                                    .text(Content.builder().data(cuerpo).charset("UTF-8").build())
                                    .build())
                            .build())
                    .build());
            log.info("Email enviado a {}", destinatario);
        } catch (Exception e) {
            log.error("Error al enviar email a {}: {}", destinatario, e.getMessage());
        }
    }
}
