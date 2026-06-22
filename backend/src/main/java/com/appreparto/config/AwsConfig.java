package com.appreparto.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.sns.SnsClient;

@Configuration
public class AwsConfig {

    @Value("${aws.region}")
    private String awsRegion;

    @Bean
    S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(awsRegion))
                .build();
    }

    @Bean
    SesClient sesClient() {
        return SesClient.builder()
                .region(Region.of(awsRegion))
                .build();
    }

    @Bean
    SnsClient snsClient() {
        return SnsClient.builder()
                .region(Region.of(awsRegion))
                .build();
    }
}
