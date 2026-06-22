package com.appreparto.facturas;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    public String subirArchivo(MultipartFile archivo, String carpeta) {
        String clave = carpeta + "/" + UUID.randomUUID() + "_" + archivo.getOriginalFilename();
        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(clave)
                            .contentType(archivo.getContentType())
                            .build(),
                    RequestBody.fromBytes(archivo.getBytes()));
        } catch (IOException e) {
            throw new RuntimeException("Error al subir archivo a S3", e);
        }
        return "https://" + bucketName + ".s3.amazonaws.com/" + clave;
    }
}
